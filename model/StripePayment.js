const mongoose = require("mongoose");

const PaymentSchema = mongoose.Schema({
    srNo: {
        type: Number,
        required: true,
    },
    payment_status: {
        type: String,
        default: "pending",
        enum: ["pending", "success", "canceled"],
    },
    payment_type: {
        type: String,
        // required: true
    },
    LessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
    },
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: "67f8eb8224daa0005ae23291"
    },
    payment_id: {
        type: String,
        // required: true,
    },
    session_id: {
        type: String,
        // required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: "JPY",
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

const payment = mongoose.model("stripepayments", PaymentSchema);

module.exports = payment;