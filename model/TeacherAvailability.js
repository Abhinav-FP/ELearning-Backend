const mongoose = require("mongoose");

const TeacherAvailabilitySchema = new mongoose.Schema({
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    maxDurationMinutes: {
      type: Number, // Optional: can limit how long a single session can be booked
      default: 60,
    },
  });

  module.exports = mongoose.model("teacherAvailabilitys", TeacherAvailabilitySchema);
  