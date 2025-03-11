const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
        unique: true,
        ref: "User"
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    }
},{timestamps:true});

module.exports = mongoose.model('Wallet',walletSchema);