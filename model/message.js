const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Student ID is required"],
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Teacher ID is required"],
  },
  content: {
    type: String,
    // required: [true, "Content is required"],
    default: null
  },
  file_url: {
    type: String,
    default: null,
  },
  file_name: {
    type: String,
    default: null,
  },
  file_type: {
    type: String,
    default: null,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  sent_by: {
    type: String,
    enum: ["student", "teacher"],
    required: [true, "Sent by is required"],
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;