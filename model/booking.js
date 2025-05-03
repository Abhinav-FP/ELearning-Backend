const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher id is required"],
    },
    UserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student id is required"],
         default: "67f8eb8224daa0005ae23291"
    },
    LessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: [true, "Lesson id is required"],
       default: "67ff410ea8e3ad25440e5161"
    },
    paypalpaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "paypalpayment"
    },
    StripepaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "stripepayments",
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
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
module.exports = Bookings;