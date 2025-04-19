const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
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
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: [true, 'Unique email is required!'] });

const User = mongoose.model('User', userSchema);

module.exports = User;