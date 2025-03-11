const express = require('express')
const router = express.Router()
const stripeController = require('../controllers/stripe_controller')

router.post('/abonnement',stripeController.stripeCheckout)

module.exports= router