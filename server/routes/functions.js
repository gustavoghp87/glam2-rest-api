const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User } = require('../models/User')


const findByEmail = async (email) => {
    const user = await User.findOne({email})
    if (!user) return null
    return user
}

const findByToken = async (token) => {
    let user = await User.findOne({token})
    if (!user) user = await User.findOne({fbAccessToken:token})
    if (!user) user = await User.findOne({glAccessToken:token})
    if (!user) return null
    console.log("Encontrado usuario por token", user.email);
    return user
    
    // const verif = await jwt.verify(token, 'secret')
    // if (verif)
    // (err, decode) => {
    //     user.findOne({_id:decode, token}, (err, user) => {
    //         if (err) return cb(err)
    //         cb(null, user)
    //     })
    // }
}

const comparePassword = async (plainPassword, password) => {
    const compare = await bcrypt.compare(plainPassword, password)
    if (!compare) return false
    return true
}

const generateToken = async (_id) => {
    console.log("por generar y guardar token nuevo");
    let token = jwt.sign(_id.toHexString(), 'secret')
    //let oneHour = moment().add(1000000, 'hour').valueOf()
    //user.tokenExp = oneHour
    await User.updateOne({_id}, {token})
    return token
}

const findByTokenFB = async (fbAccessToken) => {
    const user = await User.findOne({fbAccessToken})
    if (!user) return null
    return user
}

const findByTokenGL = async (glAccessToken) => {
    const user = await User.findOne({glAccessToken})
    if (!user) return null
    return user
}

const findByIdFB = async (facebookID) => {
    const user = await User.findOne({facebookID})
    if (!user) return null
    return user
}

const findByIdGL = async (googleID) => {
    const user = await User.findOne({googleID})
    if (!user) return null
    return user
}


module.exports = { findByEmail, comparePassword, generateToken, findByToken, findByTokenFB, findByTokenGL, findByIdFB, findByIdGL }
