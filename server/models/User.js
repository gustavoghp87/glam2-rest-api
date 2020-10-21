const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    cart: {
        type: Array,
        default: []
    },
    history: {
        type: Array,
        default: []
    },
    image: String,
    token: {
        type: String,
    },
    tokenExp: {
        type: Number
    },
    pedidos: {
        type: [],
        default: []
    },
    facebookId: {
        type: String,
        default: ""
    },
    fbAccessToken: {
        type: String,
        default: ""
    },
    googleId: {
        type: String,
        default: ""
    },
    glAccessToken: {
        type: String,
        default: ""
    }
})

const User = mongoose.model('User', userSchema)

module.exports = { User }
