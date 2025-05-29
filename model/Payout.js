const mongoose = require("mongoose");

const PayoutSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required."],
    },
    BankId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bank",
        required: [true, "Bank ID is required."],
    },
    amount: {
        type: Number,
        required: [true, "amount is required."],
    },
    Status: {
        type: String,
        enum: ["approved", "rejected", "pending"],
        default: "pending",
    },
    Reasons: {
        type: String,
        default: null,
    },
    TransactionId: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Payouts = mongoose.model("Payout", PayoutSchema);
module.exports = Payouts;