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
    facebook: {
        type: Boolean,
        default: false
    },
    facebookID: {
        type: String,
        default: ""
    },
    fbAccessToken: {
        type: String,
        default: ""
    },
    fbTokenExp: {
        type: Number
    },
    google: {
        type: Boolean,
        default: false
    },
    googleID: {
        type: String,
        default: ""
    },
    glAccessToken: {
        type: String,
        default: ""
    },
    glTokenExp: {
        type: Number
    }
})

const User = mongoose.model('User', userSchema)

module.exports = { User }
