require("dotenv").config()
const axios = require("axios");
const Transaction = require("../models/transactions_model")
const Wallet = require("../models/wallet_model")

const OM_API_URL = "https://api.orange.com/orange-money/api/v1/transactions";
const OM_CLIENT_ID = "YOUR_CLIENT_ID";
const OM_CLIENT_SECRET = "YOUR_CLIENT_SECRET";
const OM_MERCHANT_KEY = "YOUR_MARCHAND_SECRET"; // Clé du marchand

// Fonction pour obtenir le token d'accès
const getAccessToken = async () => {
  const response = await axios.post("https://api.orange.com/oauth/v3/token", {
    grant_type: "client_credentials",
    client_id: OM_CLIENT_ID,
    client_secret: OM_CLIENT_SECRET,
  });

  return response.data.access_token;
};

// Fonction utilitaire pour appeler l'API Orange Money
async function callOrangeMoneyAPI(accessToken, data) {
  const response = await axios.post(OM_API_URL, data, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data;
}

// Fonction utilitaire pour enregistrer une transaction
async function saveTransaction(userId, type, amount, description, orangeMoneyTransactionId, status = "success") {
  const transaction = new Transaction({
    userId,
    type,
    amount,
    description,
    orangeMoneyTransactionId,
    status
  });
  await transaction.save();
  return transaction;
}

// Effectuer un depot sur son wallet depuis son oraange monney
exports.depot = async (req, res) => {
  try {
    const { userId, phoneNumber, amount, description = "Dépôt initial" } = req.body;

    // Validation des entrées
    if (!userId || !phoneNumber || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Données invalides" });
    }

    const accessToken = await getAccessToken();

    // Appeler l'API Orange Money pour prélever le montant du compte Orange Money de l'utilisateur
    const response = await callOrangeMoneyAPI(accessToken, {
      amount,
      currency: 'XOF',
      receiverNumber: phoneNumber, // Le numéro de téléphone de l'utilisateur
      description: `Dépôt pour le portefeuille virtuel de l'utilisateur ${userId}`
    });

    // Mettre à jour le solde du portefeuille virtuel de l'utilisateur
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );

    // Enregistrer la transaction
    const transaction = await saveTransaction(userId, "dépot", amount, description, response.transactionId);

    res.status(200).json({ success: true, message: "Dépôt réussi", wallet, transaction });
  } catch (error) {
    console.error("Erreur lors du dépôt :", error.message);
    res.status(500).json({ success: false, message: "Erreur lors du dépôt", error: error.message });
  }
};

exports.retrait = async (req, res) => {
  try {
    const { userId, phoneNumber, amount, description = "Retrait" } = req.body;

    // Validation des entrées
    if (!userId || !phoneNumber || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Données invalides" });
    }

    // Vérifier le solde de l'utilisateur
    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, message: "Solde insuffisant" });
    }

    // Mettre à jour le solde de l'utilisateur
    wallet.balance -= amount;
    await wallet.save();

    // Appeler l'API Orange Money pour transférer le montant vers le compte Orange Money de l'utilisateur
    const accessToken = await getAccessToken();
    const response = await callOrangeMoneyAPI(accessToken, {
      amount,
      currency: 'XOF',
      receiverNumber: phoneNumber,
      description
    });

    // Enregistrer la transaction
    const transaction = await saveTransaction(userId, "retrait", amount, description, response.transactionId);

    res.status(200).json({ success: true, message: "Retrait réussi", wallet, transaction });
  } catch (error) {
    console.error("Erreur lors du retrait :", error.message);
    res.status(500).json({ success: false, message: "Erreur lors du retrait", error: error.message });
  }
};

exports.TransfertAvecCommission = async (req, res) => {
  try {
    const { senderId, recipientPhoneNumber, amount, description = "Transfert avec commission" } = req.body;

    // Validation des entrées
    if (!senderId || !recipientPhoneNumber || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Données invalides" });
    }

    // Calculer la commission (10%)
    const commission = amount * 0.1;
    const montantTransfert = amount - commission;

    // Vérifier le solde de l'expéditeur
    const senderWallet = await Wallet.findOne({ userId: senderId });
    if (!senderWallet || senderWallet.balance < amount) {
      return res.status(400).json({ success: false, message: "Solde insuffisant" });
    }

    // Mettre à jour le solde de l'expéditeur
    senderWallet.balance -= amount;
    await senderWallet.save();

    // Appeler l'API Orange Money pour transférer le montant au destinataire
    const accessToken = await getAccessToken();
    const transfertResponse = await callOrangeMoneyAPI(accessToken, {
      amount: montantTransfert,
      currency: 'XOF',
      receiverNumber: recipientPhoneNumber,
      description
    });

    // Appeler l'API Orange Money pour créditer la commission sur le compte marchand
    const commissionResponse = await callOrangeMoneyAPI(accessToken, {
      amount: commission,
      currency: 'XOF',
      receiverNumber: process.env.MERCHANT_PHONE_NUMBER, // Numéro de téléphone du compte marchand
      description: "Commission sur transfert"
    });

    // Mettre à jour le solde du destinataire (dans votre base de données)
    const recipientWallet = await Wallet.findOneAndUpdate(
      { userId: recipientId }, // Supposons que recipientId est disponible
      { $inc: { balance: montantTransfert } },
      { new: true, upsert: true }
    );

    // Mettre à jour le solde du compte marchand (dans votre base de données)
    const merchantWallet = await Wallet.findOneAndUpdate(
      { userId: process.env.MERCHANT_USER_ID }, // ID du compte marchand
      { $inc: { balance: commission } },
      { new: true, upsert: true }
    );

    // Enregistrer les transactions
    const senderTransaction = await saveTransaction(senderId, "transfert", -amount, description, transfertResponse.transactionId);
    const recipientTransaction = await saveTransaction(recipientId, "transfert", montantTransfert, description, transfertResponse.transactionId);
    const commissionTransaction = await saveTransaction(process.env.MERCHANT_USER_ID, "commission", commission, "Commission sur transfert", commissionResponse.transactionId);

    res.status(200).json({
      success: true,
      message: "Transfert et commission effectués",
      senderWallet,
      recipientWallet,
      merchantWallet,
      senderTransaction,
      recipientTransaction,
      commissionTransaction
    });
  } catch (error) {
    console.error("Erreur lors du transfert :", error.message);
    res.status(500).json({ success: false, message: "Échec du transfert", error: error.message });
  }
};

// Paiement marchand
exports.abonnePaiementMarchand = async (req, res) => {
  try {
    const { userId, amount, description = "Paiement pour un abonnement" } = req.body;

    // Validation des entrées
    if (!userId || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Montant invalide" });
    }

    const accessToken = await getAccessToken();

    // Appeler l'API Orange Money pour initier le paiement
    const response = await callOrangeMoneyAPI(accessToken, {
      merchant_key: OM_MERCHANT_KEY,
      amount,
      currency: 'XOF',
      description
    });

    // Enregistrer la transaction dans la base de données
    const transaction = await saveTransaction(userId, "paiement", amount, description, response.transactionId);

    res.status(200).json({ success: true, message: "Paiement en attente", transaction });
  } catch (error) {
    console.error("Erreur lors du paiement :", error.message);
    res.status(500).json({ success: false, message: "Échec du paiement", error: error.message });
  }
};

exports.getSolde = async (req, res) => {
  try {
      const { userId } = req.params;

      // Récupérer le solde de l'utilisateur
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
          return res.status(404).json({ success: false, message: "Portefeuille non trouvé" });
      }

      res.status(200).json({ success: true, solde: wallet.balance });
  } catch (error) {
      console.error("Erreur lors de la récupération du solde :", error.message);
      res.status(500).json({ success: false, message: "Erreur lors de la récupération du solde", error: error.message });
  }
};

// récupérer le solde et les transactions
exports.getTransactions = async (req, res) => {
 
    try {
      const { userId } = req.params;

      // Récupérer toutes les transactions de l'utilisateur
      const transactions = await Transaction.find({ userId });

      // Calculer les totaux
      const totalDepots = transactions
          .filter(t => t.type === "dépot")
          .reduce((total, t) => total + t.amount, 0);

      const totalRetraits = transactions
          .filter(t => t.type === "retrait")
          .reduce((total, t) => total + t.amount, 0);

      const totalTransferts = transactions
          .filter(t => t.type === "transfert")
          .reduce((total, t) => total + t.amount, 0);

      res.status(200).json({
          success: true,
          transactions,
          totalDepots,
          totalRetraits,
          totalTransferts
      });
  } catch (error) {
      console.error("Erreur lors du calcul des transactions :", error.message);
      res.status(500).json({ success: false, message: "Erreur lors du calcul des transactions", error: error.message });
  }
}


// Contrôleur pour initier un transfert d'argent avec commission
// exports.TransfertAvecCommission = async (req, res) => {
//   try {
//     const { phoneNumber, amount } = req.body;
//     console.log("Corps de la requête :", req.body);
//     // Validation des entrées
//     if (!phoneNumber || !amount || isNaN(amount) || amount <= 0) {
//       return res.status(400).json({ success: false, message: "Données invalides" });
//     }

//     const accessToken = await getAccessToken();

//     // Calculer les 10% de commission
//     const commission = amount * 0.1;
//     const montantTransfert = amount - commission;

//     // Transférer le montant restant au destinataire
//     const transfertRequest = await axios.post(
//       OM_API_URL,
//       {
//         amount: montantTransfert,
//         currency: "XOF",
//         receiverNumber: phoneNumber,
//         description: "Transfert d'argent avec commission",
//       },
//       { headers: { Authorization: `Bearer ${accessToken}` } }
//     );

//     // Crediter les 10% sur le compte marchand
//     const paiementCommission = await axios.post(
//       OM_API_URL,
//       {
//         merchant_key: OM_MERCHANT_KEY, // Clé du marchand
//         amount: commission,
//         currency: "XOF",
//         description: "Commission sur transfert",
//       },
//       { headers: { Authorization: `Bearer ${accessToken}` } }
//     );
//     res.status(200).json({
//       success: true,
//       message: "Transfert et commission effectués",
//       transfert: transfertRequest.data,
//       commission: paiementCommission.data,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Échec du transfert", error: error.message });
//   }
// };


// Contrôleur pour initier un paiement marchand
// exports.abonnePaiementMarchand = async (req, res) => {
//   try {
//     const { amount } = req.body;
//     console.log("Corps de la requête :", req.body);
//     // Validation des entrées
//     if (!amount || isNaN(amount) || amount <= 0) {
//       return res.status(400).json({ success: false, message: "Montant invalide" });
//     }

//     const accessToken = await getAccessToken();

//     const paymentRequest = await axios.post(
//       OM_API_URL,
//       {
//         merchant_key: OM_MERCHANT_KEY, // Clé du marchand
//         amount: amount,
//         currency: "XOF",
//         description: "Paiement pour un produit",
//       },
//       { headers: { Authorization: `Bearer ${accessToken}` } }
//     );

//     res.status(200).json({ success: true, message: "Paiement en attente", payment: paymentRequest.data });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Échec du paiement", error: error.message });
//   }
// };

