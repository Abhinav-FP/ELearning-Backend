const mongoose = require("mongoose");

const reviewSchema = new  mongoose.Schema({
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
        default: "Pending",
        enum: ["Accept", "Reject", "Pending"]
    },
    rating: {
        type: Number,
        default: 1
    }

}, { timestamps: true });

module.exports = mongoose.model("review", reviewSchema)