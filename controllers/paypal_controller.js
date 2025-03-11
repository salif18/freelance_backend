// paypal
require('dotenv').config()
const axios = require("axios");
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET_KEY;
const PAYPAL_API = "https://api-m.sandbox.paypal.com"; // Sandbox API

// 🔹 1. Créer une commande PayPal
exports.createPayPal = async (req, res) => {
    try {
        const { amount, currency } = req.body;
        console.log(req.body)
        // Générer un token d'authentification
        const auth = await axios.post(
            `${PAYPAL_API}/v1/oauth2/token`,
            "grant_type=client_credentials",
            {
                auth: {
                    username: PAYPAL_CLIENT_ID,
                    password: PAYPAL_SECRET,
                },
            }
        );

        const accessToken = auth.data.access_token;

        // Créer une commande
        const order = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders`,
            {
                intent: "CAPTURE",
                purchase_units: [
                    {
                        amount: {
                            currency_code: currency || "USD",
                            value: amount,
                        },
                    },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        console.log(order.data)
        res.json({ id: order.data.id });
    } catch (error) {
        res.status(500).json(error.response.data);
    }
};

// 🔹 2. Capturer un paiement
exports.capturePaypal = async (req, res) => {
    try {
        const { orderID } = req.params;

        // Générer un token d'authentification
        const auth = await axios.post(
            `${PAYPAL_API}/v1/oauth2/token`,
            "grant_type=client_credentials",
            {
                auth: {
                    username: PAYPAL_CLIENT_ID,
                    password: PAYPAL_SECRET,
                },
            }
        );

        const accessToken = auth.data.access_token;

        // Capturer le paiement
        const capture = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.json(capture.data);
    } catch (error) {
        res.status(500).json(error.response.data);
    }
};

