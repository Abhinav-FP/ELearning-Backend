const mongoose = require("mongoose");

const BankSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required."],
    },
    BankName: {
        type: String,
        required: [true, "Bank name is required."],
    },
    AccountHolderName: {
        type: String,
        required: [true, "Account Holder Name is required."],
    },
    BankNumber: {
        type: String,
        required: [true, "Bank account number is required."],
    },
    BranchName: {
        type: String,
        // required: [true, "Branch name is required."],
    },
    IFSC: {
        type: String,
    },
    AccountType: {
        type: String,
        default: null,
    },
    OverseasDetails: {
        type: String
    },
    BranchCode: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Bank = mongoose.model("Bank", BankSchema);
module.exports = Bank;
