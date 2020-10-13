const express = require("express")
const app = express()
const path = require("path")
const cors = require('cors')
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const morgan = require('morgan')
const mercadopago = require('mercadopago')
require('dotenv').config()

const DB_CONECTION = process.env.DB_CONECTION
const connectDB = require('./config/database')
connectDB(DB_CONECTION)

app.use(cors())
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(morgan('dev'))

const access_token = process.env.access_token
mercadopago.configure({access_token})

app.use('/api/users', require('./routes/users'))
app.use('/api/product', require('./routes/product'))
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')))

const port = process.env.PORT || 5000


app.listen(port, () => {
  console.log(`Server Running at ${port}`)
})
