const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "Student ID is required"],
    },
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Teacher ID is required"],
      },
},{ timestamps: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;