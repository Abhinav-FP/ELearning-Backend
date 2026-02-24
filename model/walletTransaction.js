const mongoose = require('mongoose');

const walletTransactionSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true
  },
  amount: { 
    type: Number, 
    required: true 
  },
  reason: {
    type: String,
    required: true
  }, // The reason for the transaction (e.g., "Wallet Recharge", "lesson payment", "refund", "admin adjustment")
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    default: null
  }
}, { timestamps: true });

walletTransactionSchema.index({ userId: 1 }, { unique: true });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

module.exports = WalletTransaction;