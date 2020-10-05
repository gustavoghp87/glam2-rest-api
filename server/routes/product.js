const express = require('express');
const router = express.Router();
const { Product } = require("../models/Product");
const multer = require('multer');
//const { auth } = require("../middleware/auth");
const { admin } = require("../middleware/admin");
const { User } = require('../models/User');


var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')               // hardcoredeado
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`)              // hardcoredeado
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        if (ext !== '.jpg' || ext !== '.png') {
            return cb(res.status(400).end('only jpg, png are allowed'), false);
        }
        cb(null, true)
    }
})

var upload = multer({ storage: storage }).single("file")


//=================================
//             Product
//=================================

router.post("/uploadImage", admin, (req, res) => {

    upload(req, res, err => {
        if (err) {
            return res.json({ success: false, err })
        }
        image = res.req.file.path.slice(8);
        return res.json({ success: true, image: image, fileName: res.req.file.filename })
    })

});


router.post("/uploadProduct", admin, (req, res) => {

    //save all the data we got from the client into the DB
    console.log("Creando producto,", req.body)
    const product = new Product(req.body)

    product.save((err) => {
        if (err) return res.status(400).json({ success: false, err })
        return res.status(200).json({ success: true })
    })

});


router.post("/getProducts", (req, res) => {

    let order = req.body.order ? req.body.order : "desc";
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limit = req.body.limit ? parseInt(req.body.limit) : 100;
    let skip = parseInt(req.body.skip);

    let findArgs = {};
    let term = req.body.searchTerm;

    for (let key in req.body.filters) {

        if (req.body.filters[key].length > 0) {
            if (key === "price") {
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                }
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }

    //console.log(findArgs)

    if (term) {
        let busqueda = [];
        let terminos = term.trim().split(' ');
        terminos.forEach(palabra => {
            busqueda.push( new RegExp(palabra, "i") )
        });
        
        //console.log(busqueda, skip, limit, sortBy, order, findArgs)

        Product.find(findArgs)
            .find( {$and: [ {$and: [ {$or: [{title:busqueda}, {description:busqueda}]}, {eliminado:false} ]}, {envio:false} ]} )
            .populate("writer")
            .sort([[sortBy, order]])
            .skip(skip)
            .limit(limit)
            .exec((err, products) => {
                if (err) return res.status(400).json({ success: false, err })
                res.status(200).json({ success: true, products, postSize: products.length })
            })
    } else {
        console.log("aca")
        Product.find(findArgs)
            .find( {$and: [{eliminado:false}, {envio:false} ]})
            .populate("writer")
            .sort([[sortBy, order]])
            .skip(skip)
            .limit(limit)
            .exec((err, products) => {
                if (err) return res.status(400).json({ success: false, err })
                res.status(200).json({ success: true, products, postSize: products.length })
            })
    }

});


//?id=${productId}&type=single
//id=12121212,121212,1212121   type=array 


router.get("/products_by_id", (req, res) => {
    let type = req.query.type
    let productIds = req.query.id

    //console.log("req.query.id", req.query.id)

    if (type === "array") {
        let ids = req.query.id.split(',');
        productIds = [];
        productIds = ids.map(item => {
            return item
        })
    }

    //console.log("productIds", productIds)

    //we need to find the product information that belong to product Id 
    Product.find({ '_id': { $in: productIds } })
        .populate('writer')
        .exec((err, product) => {
            if (err) return res.status(400).send(err)
            return res.status(200).send(product)
        })
        
});


router.get('/deleteProduct', admin, async (req, res) => {
    productId = req.query._id;
    console.log("A REMOVER: ", productId)

    // Product.deleteOne({_id:productId}, (err, info) => {
    //     if (err) res.json({remove:false})
    //     res.json({remove:true})
    // })


    // eliminar de todos los carritos
    const usuarios = await User.aggregate([ {$unwind:"$cart"}, {$match: {"cart.id":productId}} ]);
    
    usuarios.forEach(async (usuario) => {
        //console.log("****************************************", usuario)
        //console.log(usuario.cart)
        await User.findByIdAndUpdate(
            usuario._id, { $pull: { "cart": { id: productId } } }, { safe: true, upsert: true },
            (err, node) => {
                if (err) { console.log(err) }
                return console.log("ok borrado de un carrito");
            }
        );
    });



    Product.updateOne({_id:productId}, {eliminado:true}, (err, info) => {
        if (err) res.json({remove:false})
        res.json({remove:true})
    })

});


router.post('/editProduct', admin, (req, res) => {
    //console.log("A EDITAR: ", req.query)
    productId = req.query;
    console.log(req.body)
    const {title, description, price, types} = req.body;

    //console.log(title, description, price, types)

    Product.updateOne({_id:productId}, {title, description, price, types}, (err, info) => {
        console.log(info)
        if (err) res.json({edited:false})
        res.json({edited:true})
    });

});


module.exports = router;
