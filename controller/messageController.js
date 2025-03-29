const Message = require("../model/message");
const jwt = require("jsonwebtoken");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");

exports.AddMessage = catchAsync(async (req, res) => {
  try {
    const { student_id, teacher_id, content, sent_by } = req.body;

    if (!student_id || !teacher_id || !content || !sent_by) {
      return errorResponse(res, "All fields are required", 400);
    }

    const messageRecord = new Message({
      student_id,
      teacher_id,
      content,
      sent_by,
    });

    const messageResult = await messageRecord.save();

    if (!messageResult) {
      return errorResponse(res, "Failed to send message.", 500);
    }

    return successResponse(res, "Message Sent successfully", 201);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.DeleteMessage = catchAsync(async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return errorResponse(res, "Message ID is required", 400);
        }

        const message = await Message.findById(id);

        if (!message) {
            return errorResponse(res, "Message not found", 404);
        }

        message.is_deleted = true;
        await message.save();

        return successResponse(res, "Message deleted successfully", 200);
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});