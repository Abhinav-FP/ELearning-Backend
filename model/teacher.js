const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User ID is required"],
  },
  description: {
    type: String,
    default: null,
    // required: [true, "Description is required"],
  },
  gender: {
    type: String,
    // required: [true, "Gender is required"],
    enum: ['M', 'F', "O"],
    default: null
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
  // profile_photo: {
  //   type: String,
  //   default: null
  //   // required: [true, "Profile Photo is required"],  
  // },
  documentlink : {
    type :String ,
    default :""
  },
  average_time : {
    type :String ,
    default :null,
  },
  average_price :{
    type :String ,
    default : null,
  },
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;