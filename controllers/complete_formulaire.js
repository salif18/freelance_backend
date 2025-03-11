// controllers/complete_formulaire.js
const User = require('../models/user_model');

exports.completInfos = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(userId, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    res.status(200).json({ message: "Profil mis à jour avec succès", user });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour des informations.", error: error.message });
  }
};