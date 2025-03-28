const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student ID is required"],
    },
    teacher_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher ID is required"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
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
  },{ timestamps: true });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
