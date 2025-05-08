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
        default: 0
    },
    Status: {
        type: String,
        enum: ["Approved", "Rejected"],
    },
    Reasons: {
        type: String,
    },
    TranscationId: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now, 
    }
});

const Payouts = mongoose.model("Payout", PayoutSchema);
module.exports = Payouts;