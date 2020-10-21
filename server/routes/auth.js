const { findByToken } = require('./functions')


const auth = (req, res, next) => {
  console.log(req.body)
  if (!req.body.token) {console.log("No llegó el token a AUTH"); return null}
  let tokens = req.body.token.split('token=')
  console.log(tokens)

  tokens.forEach(async token => {
    token = token.split(';')
    console.log("Ingreso en auth", token)
    const user = await findByToken(token)
    if (user) {
      req.user = user
      console.log("Autenticado", user.email)
      next()
    } else {
      const pack = {
        isAdmin: false,
        isAuth: false
      }
      console.log("No autenticado")
      return res.status(200).json(pack)
    }
  })

  //return res.json({isAuth:false, error:true})
}

const admin = async (req, res, next) => {
  console.log(req.body)
  if (!req.body.token) {console.log("No llegó el token a AUTH"); return null}
  let tokens = req.body.token.split('token=')
  console.log(tokens)

  tokens.forEach(async token => {
    token = token.split(';')
    console.log("Ingreso en admin", token)
    const user = await findByToken(token)
    if (user && user.role==1) {
      req.user = user
      console.log("Autenticado", user.email)
      return next()
    }
  })

}


module.exports = { auth, admin }
