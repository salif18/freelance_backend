const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "User"
    },
    type: {
        type: String,
        enum: ["dépot", "retrait", "transfert"],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    recipientId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending"
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);