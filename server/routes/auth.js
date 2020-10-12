const { findByToken } = require('./functions')


const auth = async (req, res, next) => {
  console.log(req.body)
  if (!req.body.token) {console.log("No llegó el token a AUTH"); return null}
  let token = req.body.token.split('token=')[1].split(';')[0]

  console.log("Ingreso en auth", token)
  const user = await findByToken(token)
  if (!user) return res.json({isAuth:false, error:true})
  req.user = user
  console.log("Autenticado", user);
  next()
}

const admin = async (req, res, next) => {
  console.log(req.body)
  if (!req.body.token) {console.log("No llegó el token a AUTH"); return null}
  let token = req.body.token.split('token=')[1].split(';')[0]

  console.log("Ingreso en admin", token)
  const user = await findByToken(token)
  if (!user) return res.json({isAuth:false, error:true})
  if (user.role!=1) return null
  req.user = user
  next()
}


module.exports = { auth, admin }
