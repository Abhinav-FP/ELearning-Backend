const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    unique: true,                      // ✅ only boolean here
    required: [true, "Email is required"],
    validate: {
      validator: function (v) {
        // any extra custom validation logic if you need it
        return /\S+@\S+\.\S+/.test(v);
      },
      message: "Unique email is required!" // custom message belongs here
    }
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    select: false,
  },
  phone: {
    type: Number,
  },
  role: {
    type: String,
    required: [true, "Role is required"],
    enum: ['student', 'teacher', "admin"],
  },
  nationality: {
    type: String,
    default: null,
  },
  time_zone: {
    type: String,
    required: [true, "Time zone is required"],
  },
  block: {
    type: Boolean,
    default: false,
  },
  profile_photo: {
    type: String,
    default: null
  },
  email_verify: {
    type: Boolean,
    default: false,
  },
  deleted_at: {
    type: String,
    default: null,
  },
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User;