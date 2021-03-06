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
      console.log("Autenticado 1,", user.email)
      next()
    }
  })

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
