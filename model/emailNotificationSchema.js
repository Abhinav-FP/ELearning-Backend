const mongoose = require("mongoose");

const emailNotificationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lastSentAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

emailNotificationSchema.index({ sender: 1, receiver: 1 }, { unique: true });

const EmailNotification = mongoose.model("EmailNotification", emailNotificationSchema);

module.exports = EmailNotification;