const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User ID is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
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
    type: [String],
    default: [],
  },
  languages_spoken: {
    type: [String],
    default: [],
  },
  is_ais_trained: {
    type: Boolean,
    default: false,
  },
  is_japanese_for_me_approved: {
    type: Boolean,
    default: false,
  },
  payment_method: {
    type: String,
    enum: ['PayPal', 'Bank', 'WISE'],
    default: 'PayPal',
  },
  earnings: {
    usd: { type: Number, default: 0 },
    jpy: { type: Number, default: 0 },
  },
  profile_photo :{
    type: String,
    required: [true, "Profile Photo is required"],  
  },
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;