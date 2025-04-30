const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  ReceiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Receiver ID is required"],
  },
  text: {
    type: String,
    required: [true, "Notification text is required"],
  },
  IsRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const NotificationModel = mongoose.model("Notification", NotificationSchema);

module.exports = NotificationModel;