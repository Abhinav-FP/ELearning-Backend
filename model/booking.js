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
      ref: "paypalpayments"
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
      // default: false,
      default: true,
    },
    lessonCompletedTeacher: {
      type: Boolean,
      // default: false,
      default: true,
    },
    cancelled: {
      type: Boolean,
      default: false,
    },
    rescheduled: {
      type: Boolean,
      default: false,
    },
    totalAmount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    teacherEarning: {
      type: Number,
      required: [true, "Teacher Earning is required"],
    },
    adminCommission: {
      type: Number,
      required: [true, "Admin Commission is required"],
    },
    // This is the bonus/tip the student can give while submitting review
    bonus: {
      type: Number,
      default: 0,
    },
    payoutCreationDate: {
      type: Date,
      default: null,
    },
    payoutDoneAt: {
      type: Date,
      default: null,
    },
    // Zoom meeting link
    zoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zoom",
      default: null,
    },
  },
  { timestamps: true }
);

const Bookings = mongoose.model("Bookings", bookingSchema);
module.exports = Bookings;