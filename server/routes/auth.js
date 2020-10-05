const { findByIdFB, findByIdGL, findByToken } = require('./functions')


let auth = async (req, res, next) => {

  if (!req.body.token) {console.log("No llegó el token a AUTH"); return null}
  const token = req.body.token.split('=')[1]
  console.log(token)

  if (req.cookies.facebook=="true") {
    console.log("Ingreso en auth,", req.cookies.fbAccessToken)
    
    try {
      let fbAccessTokenCookie = req.cookies.fbAccessToken

      const user = findByIdFB(req.cookies.facebookID)
      if (!user) return res.json({isAuth: false, error: true})

      if (user.fbAccessToken === fbAccessTokenCookie) {
        req.fbAccessToken = fbAccessTokenCookie
        req.user = user
        next()
      } else {
        return res
          .cookie("facebook", "false")
          .cookie("fbAccessToken", "")
          .cookie("facebookID", "")
          .json({isAuth: false, error: true})
      }
    } catch(e) {
      console.log("Error en admin fb,", e)
      return res
        .cookie("facebook", "false")
        .cookie("fbAccessToken", "")
        .cookie("facebookID", "")
        .json({isAuth: false, error: true})
    }
  }

    
  if (req.cookies.google=="true") {
    console.log("Ingreso en admin.js 2,", req.cookies.glAccessToken)

    try {
      let glAccessTokenCookie = req.cookies.glAccessToken

      const user = await findByIdGL(req.cookies.googleID)
      if (!user) return res.json({isAuth:false, error:true})
    
      if (user.glAccessToken === glAccessTokenCookie) {
        req.glAccessToken = glAccessTokenCookie
        req.user = user
        next()
      } else {
        return res
          .cookie("google", "false")
          .cookie("glAccessToken", "")
          .cookie("googleID", "")
          .json({isAuth: false, error: true})
      }
    } catch(e) {
      console.log("Error en admin gl,", e)
      return res
      .cookie("google", "false")
      .cookie("glAccessToken", "")
      .cookie("googleID", "")
      .json({isAuth: false, error: true})
    }
  }

  if (req.cookies.google!="true" && req.cookies.facebook!="true") {
    console.log("Ingreso en admin.js 3")
    const user = await findByToken(token)
    if (!user) return res.json({isAuth:false, error:true})
    req.user = user
    next()
  }
}


module.exports = { auth }
