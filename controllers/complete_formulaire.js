const User = require('../models/user_model');

exports.completInfos = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Mettre à jour uniquement les champs fournis dans req.body
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: req.body }, // Utilise $set pour mettre à jour uniquement les champs spécifiés
      { new: true, runValidators: true } // Retourne le document mis à jour et exécute les validateurs
    );

    res.status(200).json({ message: "Profil mis à jour avec succès", user });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour des informations.", error: error.message });
  }
};