const mongoose = require("mongoose");

const lessonSchema =  mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher id is required"],
    },
    title: {
      type: String,
      required: [true, "Lesson title is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    duration: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: [true, "Lesson price is required"],
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  }, { timestamps: true }
);

const Lesson = mongoose.model("Lesson", lessonSchema);
module.exports = Lesson;
