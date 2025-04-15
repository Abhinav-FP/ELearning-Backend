const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "User ID is required"],
    },
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: [true, "Lesson ID is required"],
    },
    description: {
        type: String,
        default: ""
    },
    review_status: {
        type: String,
        default: "Reject",
        enum: ["Accept", "Reject"]
    },
    rating: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        deafult: Date.now
    },

});

module.exports = mongoose.model("review", reviewSchema)