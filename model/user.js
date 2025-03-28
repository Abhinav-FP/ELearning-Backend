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
  },
  role: {
    type: String,
    required: [true, "Role is required"],
    enum: ['student', 'teacher', "admin"],
  },
  gender: {
    type: String,
    required: [true, "Gender is required"],
    enum: ['M', 'F'],
  },
  nationality: {
    type: String,
    default: null,
  },
  time_zone :{
    type: String,
    required: [true, "Time zone is required"],    
  },
},{ timestamps: true });

userSchema.index({ email: 1 }, { unique: [true, 'Unique email is required!'] });

const User = mongoose.model('User', userSchema);

module.exports = User;