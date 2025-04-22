const mongoose = require("mongoose");

const TeacherAvailabilitySchema = new mongoose.Schema({
    teacher: {
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
  });

  module.exports = mongoose.model("teacherAvailabilitys", TeacherAvailabilitySchema);
  