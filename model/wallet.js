const mongoose = require('mongoose');

const walletSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

walletSchema.index({ userId: 1 }, { unique: true });

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;