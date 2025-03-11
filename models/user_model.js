const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone_number: { type: String, required: true },
  profileImage: { type: String, default: null }, // URL de l'image de profil
  role: { type: String, enum: ["freelancer", "client", "admin"], require: true },
  email_verified_at: {
    type: Date,
    default: null
  },
  fcmToken: { type: String },
  tentatives: {
    type: Number,
    default: 0
  },
  tentatives_expires: {
    type: Date,
    default: Date.now
  },
  remember_token: {
    type: String,
    default: null
  },

  // Informations spécifiques aux freelancers
  skills: [{ type: String, default: null }],
  experience: { type: Number, default: null },
  portfolio: [{ type: String, default: null }],
  hourlyRate: { type: Number, default: null },
  rating: { type: Number, default: 0 },
  completedProjects: { type: Number, default: 0 },

  // Informations spécifiques aux clients
  companyName: { type: String, default: null },
  website: { type: String, default: null },
  postedProjects: { type: Number, default: 0 },
  budgetRange: { type: String, default: 0 },

  // Paiements et abonnements
  subscription: {
    plan: { type: String, enum: ["free", "premium", "enterprise"], default: "free" }, // Type d'abonnement
    startDate: { type: Date }, // Date de début de l’abonnement
    endDate: { type: Date }, // Date de fin de l’abonnement
    status: { type: String, enum: ["active", "expired", "canceled"], default: "active" }, // État de l’abonnement
  },

  //  Géolocalisation
   location: {
    type: { type: String, enum: ["Point"],require:false},
    coordinates: { type: [Number],require:false,  } // Longitude, Latitude
  },
  address: { type: String,default: null }, // Adresse formatée
  city: { type: String ,default: null},
  country: { type: String,default: null },

  // Méthodes de paiement
  paymentMethods: [
    {
      type: { type: String, enum: ["paypal", "credit_card", "bank_transfer"],default: null },
      details: { type: String ,default: null},
    },
  ],

  // Statut du compte
  accountStatus: { type: String, enum: ["active", "suspended", "pending"], default: "pending" },
}, {
  timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

UserSchema.plugin(uniqueValidator)
// Index pour la recherche géographique
UserSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", UserSchema);
