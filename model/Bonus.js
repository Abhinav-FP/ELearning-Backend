const mongoose = require("mongoose");


const bonusSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required."],
    },
    teacherId: {
        ref: "User",
        required: [true, "Teacher ID is required."],
    },
    LessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
        required: [true, "Lesson id is required"],
    },
    paypalpaymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "paypalpayments"
    },
    StripepaymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "stripepayments",
    },
    amount: {
        type: number,
        default: 0
    },
    Currency: {
        type: String,
        default: "usd"
    },
    conversion_rate: {
        type: Number,
        default: 0
    }
    ,
})


module.exports = mongoose.model("bonus", bonusSchema);
