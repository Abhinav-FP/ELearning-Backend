const mongoose = require("mongoose");

const adminCourseSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Lesson title is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    thumbnail: {
      type: String,
      required: [true, "Thumbnail is required"],
    },
    link: {
      type: String,
      required: [true, "Link is required"],
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  }, { timestamps: true }
);

const AdminCourse = mongoose.model("AdminCourse", adminCourseSchema);
module.exports = AdminCourse;