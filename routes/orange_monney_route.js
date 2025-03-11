const express = require('express')
const router = express.Router()
const orangeController = require('../controllers/orange_monney_controller')

router.post('/abonnement',orangeController.abonnePaiementMarchand)
router.post("/deposit",orangeController.depot)
router.post("/retrait",orangeController.retrait)
router.post("/transfert",orangeController.TransfertAvecCommission)
router.get("/transactions/:userId",orangeController.getTransactions)
router.get("/solde/:userId",orangeController.getSolde)
module.exports= router