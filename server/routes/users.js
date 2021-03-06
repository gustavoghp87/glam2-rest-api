const express = require('express')
const router = express.Router()
const { auth, admin } = require('./auth')
const { User } = require('../models/User')
const { Product } = require('../models/Product')
const { Payment } = require('../models/Payment')
const { Notification } = require('../models/Notification')
const mercadopago = require('mercadopago')
const { findByEmail, comparePassword, generateToken } = require('./functions')
const cors = require('cors')

require('dotenv').config()
const access_token = process.env.access_token
const fetch = require('node-fetch')
const mongoose = require('mongoose')

const USER_SERVER = "https://glam2-rest-api.herokuapp.com/api/users"
// para activar pago recibido luego de las notificaciones de MP


router.post("/auth", auth, async (req, res) => {

    console.log("en /auth,", req.user.email)
    let pack
    if (req.user) {
        pack = {
            _id: req.user._id,
            isAdmin: req.user.role === 0 ? false : true,
            isAuth: true,
            email: req.user.email,
            name: req.user.name,
            lastname: req.user.lastname,
            role: req.user.role,
            image: req.user.image,
            cart: req.user.cart,
            history: req.user.history
        }
        console.log("Autenticado 2", req.user.email)
    } else {
        pack = {
            isAuth: false,
            isAdmin: false
        }
        console.log("No autenticado 2")
    }

    res.status(200).json(pack)
})


router.post("/register", (req, res) => {

    const user = new User(req.body)

    user.save((err, doc) => {
        if (err) return res.json({ success: false, err })
        return res.status(200).json({
            success: true
        })
    })
})


router.post("/login", async (req, res) => {

    const user = await findByEmail(req.body.email)
    if (!user) return res.json({
        loginSuccess: false,
        message: "No se encontró ese email; revisar o registrarse"
    })

    const compare = await comparePassword(req.body.password, user.password)
    if (!compare) return res.json({loginSuccess:false, message:"Contraseña mal escrita"})
    
    const token = await generateToken(user._id)
    if (!token) return res.json({loginSuccess:false})

    //res.cookie("w_authExp", user.tokenExp)
    res.status(200).json({loginSuccess:true, userId:user._id, token})
})


router.post("/logout", auth, (req, res) => {
    console.log("Autenticado, procediendo logout");
    User.findOneAndUpdate({_id:req.user._id},
        {token:"", fbAccessToken:"", glAccessToken:""},
        (err, doc) => {
            if (err) return res.json({ success: false, err })
            console.log("..............................................       Logout exitoso")
            return res.status(200).send({success:true})
        }
    )
})


///////////////////////////////////////////////////////////////////////////////////////////////////////


router.post('/addToCart', auth, async (req, res) => {

    console.log("Agregando a carrito")
    console.log("Usuario que solicita:", req.user)
    User.findOne({ _id: req.user._id }, async (err, userInfo) => {
        let duplicate = false;

        let producto = await Product.findOne({_id:req.query.productId})
        let price = producto.price;
        let name = producto.title;
        let images = producto.images;

        userInfo.cart.forEach((item) => {
            if (item.id == req.query.productId) {
                duplicate = true;
            }
        })

        if (duplicate) {
            User.findOneAndUpdate(
                { _id: req.user._id, "cart.id": req.query.productId },
                { $inc: { "cart.$.quantity": 1 } },
                { new: true },
                (err, userInfo) => {
                    if (err) return res.json({ success: false, err });
                    res.status(200).json(userInfo.cart)
                }
            )
        } else {
            User.findOneAndUpdate(
                { _id: req.user._id },
                {
                    $push: {
                        cart: {
                            id: req.query.productId,
                            quantity: 1,
                            date: Date.now(),
                            price,
                            name,
                            images
                        }
                    }
                },
                { new: true },
                (err, userInfo) => {
                    if (err) return res.json({ success: false, err })
                    res.status(200).json(userInfo.cart)
                }
            )
        }
    })
})

router.post('/addEnvio', auth, async (req, res) => {

    let money = req.query.money;

    let new_envio = {
        id: mongoose.ObjectId.toString(),
        date: Date.now(),
        price: money,
        images: ["1595286596981_envios.jpg"],
        title: "Envío personalizado",
        description: "Envío " + new Date(),
        writer: req.user._id,
        types: 100,
        envio: true
    }

    try {
        let new_env = await Product.create(new_envio);

        new_envio = {
            id: new_env._id.toString(),
            quantity: 1,
            price: new_env.price,
            name: new_env.title,
            images: new_env.images,
            date: Date.now()
        }

        User.findOneAndUpdate(
            { _id: req.user._id },
            { $push: {cart: new_envio} },
            { new: true },
            async (err, userInfo) => {
                res.status(200).json(userInfo.cart)
            })
    } catch(e) {console.log("No se pudo crear envío,", e); res.json({ success: false, err })}
})


router.post('/subtractOneToCart', auth, async (req, res, next) => {

    const usuario = await User.findOne({ _id: req.user._id })

    let duplicate = false
    let ubicacion = ''
    let i = -1

    await usuario.cart.forEach((item) => {
        ++i;
        if (item.id == req.query.productId) {
            duplicate = true
            ubicacion = i
        }
    })

    if (duplicate) {
        //console.log("CAANTIDAD", usuario.cart[ubicacion].quantity)
        //const usuario = await User.findOneAndUpdate({_id: req.user._id, "cart.id": req.query.productId });
        if (usuario!=null && usuario.cart[ubicacion].quantity>0) {
            //console.log("QUITAR UNO")
            let nuevaCantidad = usuario.cart[ubicacion].quantity - 1
            
            User.findOneAndUpdate(
                { _id: req.user._id, "cart.id": req.query.productId },
                { $inc: { "cart.$.quantity": -1 } },
                { new: true },
                (err, userInfo) => {
                    if (err) return res.json({ success: false, err })
                    res.status(200).json(userInfo.cart)
                }
            )
        } else if (usuario!=null && usuario.cart[ubicacion].quantity<1) {
            console.log("NO HAY MÁS; NO SE PUEDE RESTAR")
        }

    } else {
        console.log("NI ESTÄ")
    }
})


router.post('/removeFromCart', auth, async (req, res) => {

    console.log(req.user._id, "=", req.query._id)

    User.findOneAndUpdate(
        { _id: req.user._id },
        {
            "$pull":
                { "cart": { "id": req.query._id } }
        }, {'new':true},
        (err, userInfo) => {
            if(err) console.log(err)
            let cart = userInfo.cart;
            let array = cart.map(item => {
                return item.id
            })

            Product.find({ '_id': { $in: array } })
                .populate('writer')
                .exec((err, cartDetail) => {
                    return res.status(200).json({
                        cartDetail,
                        cart
                    })
                })
        }
    )
});


router.post('/userCartInfo', auth, (req, res) => {
    User.findOne(
        { _id: req.user._id },
        (err, userInfo) => {
            let cart = userInfo.cart;
            let array = cart.map(item => {
                return item.id
            })


            Product.find({ '_id': { $in: array } })
                .populate('writer')
                .exec((err, cartDetail) => {
                    if (err) return res.status(400).send(err);
                    return res.status(200).json({ success: true, cartDetail, cart })
                })

        }
    )
})


router.post('/getHistory', auth, (req, res) => {
    console.log("GET HISTORY")
    User.findOne(
        { _id: req.user._id },
        (err, doc) => {
            let history = doc.history
            if (err) return res.status(400).send(err)
            return res.status(200).json({ success: true, history })
        }
    )
})


router.post('/getSales', admin, async (_, res) => {
    console.log("get sales");
    const pagos = await Payment.find().sort({createdAt:-1})
    return res.status(200).json({pagos})
})


router.post('/procesar-pago', cors(), auth, async (req, res) => {

    console.log("Post procesar pago")
    const items = req.body.items
    console.log("ITEMS:", items)
    // console.log("Usuario que quiere pagar:", req.user)

    var preference = {
        items,
        payer: {
            name: req.user.name,
            surname: req.user.lastname,
            email: req.user.email,
        //     "phone": {
        //         "area_code": "11",
        //         "number": "4444-4444"
        //     },
        //     "identification": {
        //         "type": "DNI",
        //         "number": "12345678"
        //     },
        //     "address": {
        //         "street_name": "Street",
        //         "street_number": 123,
        //         "zip_code": "5700"
        //     }
        },
         back_urls: {
            success: `https://glamstudio.com.ar/history`,
            failure: `https://glamstudio.com.ar/user/cart`,
            pending: `https://glamstudio.com.ar/user/cart`
        },
        auto_return: "approved",
        // "payment_methods": {
        //     "excluded_payment_methods": [
        //         {
        //             "id": "master"
        //         }
        //     ],
        //     "excluded_payment_types": [
        //         {
        //             "id": "ticket"
        //         }
        //     ],
        //     "installments": 12
        // },
        notification_url: `${USER_SERVER}/notif`,
        external_reference: req.user.email + "_" + Date.now().toString(),
        expires: true,
        expiration_date_from: new Date().toISOString().slice(0, -1) + "-00:00",
        expiration_date_to: (new Date(+ Date.now() + 900000000).toISOString()).slice(0, -1) + "-00:00"
    }

    let external_reference = preference.external_reference

    let sumaTotal = 0;
    items.forEach(item => {sumaTotal += item.unit_price * item.quantity})
    console.log("Suma total:", sumaTotal)

    let pedidos = {external_reference, sumaTotal, pedidosCart: items}

    try {
        await User.findOneAndUpdate({_id:req.user._id}, {$push: {pedidos}} )
    } catch(e) {console.log("No se pudo guardar external_reference y su carrito en Usuario", e)}

    let create = await mercadopago.preferences.create(preference)
    console.log("RESPONSE MP:", create.body.init_point)
    
    res.json({url: create.body.init_point})
})


router.post('/notif', async (req, res) => {

    const notificationMP = req.body
    console.log("NOTIFICACIÓN DE MERCADO PAGO", notificationMP)

    try {
        await Notification.create({notificationMP})
    } catch (error) {console.log("Error al intentar guardar en DB:", error)}

    var payment_id = ""
    try {
        payment_id = notificationMP.data.id;
        console.log("ID del pago según notificación de MP:", payment_id)
    } catch(e) { console.log("No es notif de pago creado") }

    const buscarPago = await Payment.find({id:payment_id})
    let noEstaba = true
    if (buscarPago!=null) {noRepetido=false}
    console.log("No estaba el pago en la base de datos:", noEstaba)

    if (notificationMP.action=='payment.created' && noEstaba) {

        console.log("Entró")

        var newPayment = {}

        newPayment.mpPaymentNotif = notificationMP

        try {
            let url = `https://api.mercadopago.com/v1/payments/${payment_id}?access_token=${access_token}#json`
    
            fetch(url)
            .then(response => {
                // console.log(response, response.status)
                return response.json()
            })
            .then(async (objPayment) => {
                // console.log("Llegó Objeto Pago:", objPayment);
                newPayment.mpJSON = objPayment

                let external_reference = objPayment.external_reference

                var comprador = {}
                try { comprador = await User.findOne({"pedidos.external_reference":external_reference}); console.log("Comprador encontrado,", comprador.email) } catch(e) {console.log("Comprador no encontrado,", e)}

                //    const comprador = await User.aggregate([ {$unwind:"$pedidos"}, {$match: {"pedidos.external_reference":external_reference}} ]);
            
                let pedido = []
                
                comprador.pedidos.forEach(item => {
                    if (item.external_reference == external_reference) {
                        pedido = item
                    }
                })
            
                console.log("PEDIDO,", pedido)

                // VERIFICACIÓN
                let verificado = false;
                if (pedido.sumaTotal === objPayment.transaction_amount) {
                    console.log("HAY COINCIDENCIA DE IMPORTES ENTRE NOTIFICACIÓN Y BASE DE DATOS");
                    verificado = true;
                } else ( console.log("NO HAY COINCIDENCIA DE IMPORTES, SE ABORTA OPERACIÓN") );

                if (verificado) { newPayment.user = comprador }

                let nuevaCompra = []
                try {
                    pedido.pedidosCart.forEach((item) => {
                        nuevaCompra.push({
                            dateOfPurchase: Date.now(),
                            name: item.title,
                            id: item.id,
                            price: item.unit_price,
                            quantity: item.quantity,
                            paymentId: payment_id,
                            images: item.picture_url
                        })
                    })
                    if (verificado) { newPayment.product = nuevaCompra }

                    try {
                        if (verificado) {
                            pedido.pedidosCart.forEach(async (item) => {
                                await Product.updateOne({_id:item.id}, {$inc: {sold:item.quantity}})
                            })
                        }
                    } catch(e) {console.log("No se pudo aumentar la cantidad de vendidos,", e) }

                    try {
                        if (verificado) {
                            await User.findOneAndUpdate({_id: comprador._id}, {$push: {history:nuevaCompra}, $set:{cart:[]} });
                        }
                    } catch(e) {console.log("No se pudo vaciar carrito y actualizar historial de compras,", e) }

                    console.log("\n\nVERIFICADO:", verificado, "\nTerminado json newPayment:", newPayment);
                    const payment = new Payment(newPayment)
                    payment.save()

                    console.log("Todo logrado ........................................................")

                } catch(e) {console.log("No se pudo guardar la compra en Payment", e)}

            })
        } catch(e) {
            console.log("No se pudo recuperar pago, fin de todo, solo se almacenó la notificación")
        }        

    } else { console.log("Es una notificación de otro tipo o repetida")}

    res.status(200).send("Ok")
})


////////////////////////////////////////////////////////////////////////////////////////     FACEBOOK


router.post('/login-with-facebook', async (req, res) => {
    console.log("Llegó algo de Facebook,", req.body)
    const { accessToken, picture, userID, email } = req.body;
    const profilePic = picture.data.url;

    const fbObj = await fetch(`https://graph.facebook.com/v7.0/me?access_token=${accessToken}&method=get&pretty=0&sdk=joey&supress_http_code=1`);
    const json = await fbObj.json();

    if (!email) {
        console.log("NO SE PUDO RECUPERAR EL EMAIL VÍA FACEBOOK");
        return res.status(200).json({message:"No se pudo obtener la dirección de correo electrónico de Facebook", isEmail: false, verif:false})
    }

    if (json.id != userID) {
        console.log("Falló la verificación")
        return res.json({message:"Falló la verificación", isEmail:true, verif:false})
    }

    console.log("Coincidencia, verificado")
    const resp = await User.findOne({facebookId: userID})

    if (resp) {
        console.log("El usuario ya existe, procediendo a loguear", )

        let facebookId = userID
        console.log("Acc token:", accessToken)

        await User.updateOne({facebookId}, {$set: {fbAccessToken: accessToken}})

        return res.status(200).json({
            verif:true, isEmail:true, newUser:false, fusion:false, loginSuccess:true, correo:email,
            userId: resp._id, token:accessToken
        })
    }

    console.log("Usuario Facebook no existente, comprobando si el email está registrado por otro método...")
    
    const X = await User.findOne({email})

    if (X) {
        console.log("El usuario ya estaba registrado por otro método, procediendo a unificar cuentas")
        const fusion = {
            facebookId: json.id,
            fbAccessToken: accessToken,
        }

        await User.updateOne({email}, {$set: fusion})

        console.log("Guardando en db:", fusion)
        console.log("Logueando al usuario nuevo...")

        return res.status(200).json({
            verif:true, isEmail:true, newUser:true, fusion:true, loginSuccess: true, correo:email,
            token:accessToken
        })
    }
        
    console.log("CREANDO USUARIO")
    const nuevoUsuario = new User({
        name: json.name,
        lastname: "",
        email,
        image: profilePic,
        token: "",
        facebookId: json.id,
        fbAccessToken: accessToken,
    })

    return res.status(200).json({
        verif:true, isEmail:true, newUser:true, fusion:false, loginSuccess: true, correo:email,
        token:accessToken
    })

})


/////////////////////////////////////////////////////////////////////////////        GOOGLE

router.post('/google', async (req, res) => {
    console.log("Recibido en /google:", req.body)
    const { googleId, tokenObj, accessToken, profileObj, tokenId } = req.body

    const image = profileObj.imageUrl
    const email = profileObj.email
    const name = profileObj.name
    const expires = tokenObj.expires_at

    console.log("Tenemos:", "1", image, "2", email, "3", name, "4", expires, "5", googleId, "6", accessToken)

    // VERIFICAR
    const fetchy = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenId}`)
    const consulta = await fetchy.json()

    if (!email) {
        console.log("NO SE PUDO RECUPERAR EL EMAIL VÍA GOOGLE")
        return res.status(200).json({message:"No se pudo obtener la dirección de correo electrónico de Facebook", isEmail: false, verif:false})
    }

    if (consulta.sub != googleId) { console.log("Falló verificación"); return res.status(200).json({message:"Falló la verificación por Google", isEmail: true, verif:false}) }

    console.log("Coincidencia, verificado")

    const userById = await User.findOne({googleId})

    if (userById) {
        console.log("El usuario ya existe, procediendo a loguear")
        await User.updateOne({googleId}, {$set: {glAccessToken:accessToken, glTokenExp:expires}})

        return res.status(200).json({
            verif:true, isEmail:true, newUser:false, fusion:false, loginSuccess:true, correo:email,
            token:accessToken
        })
    }

    console.log("Usuario Google no existente, comprobando si el email está registrado por otro método...")
    const userByEmail = await User.findOne({email:email})
    if (userByEmail) {
        console.log("El usuario ya estaba registrado por otro método, procediendo a unificar cuentas")
        const fusion = {
            google: true,
            googleId,
            glAccessToken: accessToken,
            glTokenExp: expires
        }
        await User.updateOne({email}, {$set: fusion})
        console.log("Guardando en db:", fusion)

        return res.status(200).json({
            verif:true, isEmail:true, newUser:true, fusion:true, loginSuccess: true, correo:email,
            token:accessToken
        })
    }

    console.log("CREANDO USUARIO")
    const nuevoUsuario = new User({
        name: name,
        lastname:"",
        email: email,
        image: image,
        token: "",
        google: true,
        googleId,
        glAccessToken: accessToken,
        glTokenExp: expires
    })

    let nuevo = await User.create(nuevoUsuario)
    console.log("Guardando en db:", nuevo)

    return res.status(200).json({
        verif:true, isEmail:true, newUser:true, fusion:false, loginSuccess: true, correo:email,
        token:accessToken
    })
})


module.exports = router
