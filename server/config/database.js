const connect = require('mongoose').connect


const connectDB = async (DB_CONECTION) => {
    try {
        await connect(DB_CONECTION, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify:false,
            useCreateIndex:true
        })
        console.log('MongoDB connected!')
    } catch (err) {console.log(err)}
}

module.exports = connectDB
