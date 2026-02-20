const mongoose = require('mongoose');

const teacherSchema =  mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User ID is required"],
  },
  description: {
    type: String,
    default: null,
  },
  gender: {
    type: String,
    default: null,
  },
  experience: {
    type: Number,
    default: null,
  },
  city: {
    type: String,
    default: null,
  },
  intro_video: {
    type: String,
    default: null,
  },
  qualifications: {
    type: String,
    default: null,
  },
  languages_spoken: {
    type: [String],
    default: [],
  },
  ais_trained: {
    type: Boolean,
    default: false,
  },
  japanese_for_me_approved: {
    type: Boolean,
    default: false,
  },
  admin_approved: {
    type: Boolean,
    default: null,
  },
  documentlink: {
    type: String,
    default: ""
  },
  tags: {
    type: [String],
    default: [],
  },
  access_token: {
    type: String,
    default: null,
  },
  refresh_token: {
    type: String,
    default: null,
  },
  featured: {
    type: Number,
    default: null,
  },
  rank: {
    type: Number,
    default: null,
  },
  bulk_bookings_allowed: {
    type: Boolean,
    default: false,
  },
  // google calendar fields
  googleCalendar: {
  accessToken: {
    type: String,
    default: null,
  },
  refreshToken: {
    type: String,
    default: null,
  },
  expiryDate: {
    type: Number,
    default: null,
  },
  calendarId: {
    type: String,
    default: "primary",
  },
  connected: {
    type: Boolean,
    default: false,
  },
},
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;