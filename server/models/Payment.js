const mongoose = require('mongoose');


const paymentSchema = mongoose.Schema({
    user: {               // ubicado a través de external_reference colocado tanto en db como preference
        type: Object,
        default: {}
    },
    product: {            // es el carrito
        type: Array,
        default: []
    },
    mpJSON: {             // info de pago recuperada por fetch
        type: Object,
        default: {}
    },
    mpPaymentNotif: {     // notificación inicial
        type: Object,
        default: {}
    }
}, { timestamps: true })

const Payment = mongoose.model('Payment', paymentSchema);


module.exports = { Payment }
