const mongoose = require("mongoose");

const ZoomSchema = mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: [true, "Meeting Id is required."],
    },
    meetingLink: {
      type: String,
      required: [true, "Meeting Link is required."],
    },
    download: {
      type: [String],
      default : null,
    },
  },
  { timestamps: true }
);

const Zoom = mongoose.model("Zoom", ZoomSchema);
module.exports = Zoom;
