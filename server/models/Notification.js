const mongoose = require('mongoose');


const notificationSchema = mongoose.Schema({
    notificationMP: {
        type: Object,
        default: {}
    }
}, { timestamps: true })


const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Notification }
