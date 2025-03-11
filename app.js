//importations

require("dotenv").config();

const mongoose = require("mongoose");
const express = require('express')
const cors = require('cors')
const path = require('path')
const app = express()

const Auth_Router = require("./routes/auth_route");
const srtipeRouter = require('./routes/stripe_route')
const paypalRouter = require("./routes/paypal_route")
const orangeRouter = require('./routes/orange_monney_route')

//configurations
app.use(cors());
app.use(express.json()) 
app.use('/images',express.static(path.join(__dirname,'images')))
app.use('/videos',express.static(path.join(__dirname,'videos')))



mongoose
.connect(process.env.DATA_BASES)
    .then(() => console.log("Connection a database reussie"))
    .catch(() => console.log("Echec de connection  a database"));

// les fonctions de route
app.use("/api/auth", Auth_Router);
app.use('/api/checkout-stripe',srtipeRouter)
app.use('/api/checkout-paypal',paypalRouter)
app.use('/api/checkout-orange',orangeRouter)

//exportation de l'application
module.exports = app  