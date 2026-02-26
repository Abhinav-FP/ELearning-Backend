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
    ref: "Bookings",
    default: null
  },
  stripePaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "stripepayments",
    default: null
  },
  paypalPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "paypalpayments",
    default: null
  },
  // This is the balance after the transaction takes place
  balance: { 
    type: Number, 
    required: true 
  },
}, { timestamps: true });

walletTransactionSchema.index({ userId: 1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

module.exports = WalletTransaction;