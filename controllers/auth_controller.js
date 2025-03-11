// authController.js
require("dotenv").config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user_model');


// Configuration
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes
const MAX_ATTEMPTS = 5;
const JWT_SECRET = process.env.SECRET_KEY;

// Helpers
const getExpirationMessage = (expirationDate) => {
  const time = expirationDate.toTimeString().split(' ')[0];
  return `Nombre maximal de tentatives atteint. Veuillez réessayer après ${time}.`;
};

// Contrôleur d'inscription
exports.register = async (req, res) => {
  try {
console.log(req.body)
    // Vérification de l'existence de l'utilisateur
    const existingUser = await User.findOne({
      $or: [
        { phone_number: req.body.phone_number },
        { email: req.body.email }
      ]
    });

    if (existingUser) {
      return res.status(401).json({
        status: false,
        message: "Ce numéro ou email existe déjà"
      });
    }

    // Création de l'utilisateur
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const user = new User({
      fullName: req.body.fullName,
      phone_number: req.body.phone_number,
      email: req.body.email,
      role:req.body.role,
      password: hashedPassword
    });

    await user.save();

    // Génération du token JWT
    const token = jwt.sign(
      { userId: user._id.toString() },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(201).json({
      status: true,
      message: "Compte créé avec succès !!",
      user: user,
      userId: user._id,
      token
    });

  } catch (error) {
    console.log("erreur du 500",error.message)
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

// Contrôleur de connexion
exports.login = async (req, res) => {
  try {

    // Recherche de l'utilisateur
    const user = await User.findOne({
      $or: [
        { phone_number: req.body.contacts },
        { email: req.body.contacts }
      ]
    });

    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'Votre email est incorrect'
      });
    }

    // Vérification du blocage
    if (user.tentatives >= MAX_ATTEMPTS && user.tentatives_expires > Date.now()) {
      return res.status(429).json({
        message: getExpirationMessage(user.tentatives_expires)
      });
    }

    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      user.tentatives += 1;
      if (user.tentatives >= MAX_ATTEMPTS) {
        user.tentatives_expires = Date.now() + BLOCK_DURATION;
      }
      await user.save();
      return res.status(401).json({
        status: false,
        message: 'Votre mot de passe est incorrect'
      });
    }

    // Réinitialisation des tentatives
    user.tentatives = 0;
    user.tentatives_expires = Date.now();
    await user.save();

    // Génération du token
    const token = jwt.sign(
      { userId: user._id.toString() },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      status: true,
      message: "Connecté avec succès !!",
      userId: user._id,
      token,
      user
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};


exports.sendFmcToken = async (req, res) => {
  const { fcmToken } = req.body;

  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { fcmToken }, { new: true });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
console.log(user)
    return res.status(200).json({ message: "Token FCM enregistré !", user });
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    res.status(500).json({ message: error.message });
  }
};