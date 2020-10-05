const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = mongoose.Schema({
    writer: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        maxlength: 50
    },
    description: {
        type: String
    },
    price: {
        type: Number,
        default: 99999
    },
    images: {
        type: Array,
        default: []
    },
    types: {
        type: Number,
        default: 7
    },
    sold: {
        type: Number,
        maxlength: 10000,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    envio: {
        type: Boolean,
        default: false
    },
    eliminado: {
        type: Boolean,
        default: false
    }

}, { timestamps: true })


productSchema.index({ 
    title:'text',
    description: 'text',
}, {
    weights: {
        name: 5,
        description: 1,
    }
})

const Product = mongoose.model('Product', productSchema);

module.exports = { Product }