const express = require('express');
const router = express.Router();

const paypal_controller = require("../controllers/paypal_controller")

router.post("/create-paypal-order",paypal_controller.createPayPal );
router.post("/capture-paypal-order/:orderID", paypal_controller.capturePaypal)

module.exports = router