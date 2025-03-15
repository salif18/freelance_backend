const User = require('../models/user_model');

exports.completInfos = async (req, res) => {
  try {
    const { userId } = req.params;

    // Récupérer l'utilisateur existant
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Fusionner les données
    const updates = req.body;
    for (const key in updates) {
      if (updates.hasOwnProperty(key) && user[key] !== undefined) {
        // Si le champ existe dans req.body et dans le modèle utilisateur, on le met à jour
        user[key] = updates[key];
      }
    }

    // Valider les données avant de sauvegarder
    await user.validate();

    // Sauvegarder les modifications
    await user.save();

    res.status(200).json({ message: "Profil mis à jour avec succès", user });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour des informations.", error: error.message });
  }
};