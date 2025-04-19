const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher id is required"],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student id is required"],
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: [true, "Lesson id is required"],
    },
    time: {
      type: String,
      required: true,
    },
    lessonCompletedStudent: {
      type: Boolean,
      default: false,
    },
    lessonCompletedTeacher: {
      type: Boolean,
      default: false,
    },
    cancelled: {
      type: Boolean,
      default: false,
    },
    rescheduled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Bookings = mongoose.model("Bookings", bookingSchema);
module.exports = Booking;