const Message = require("../model/message");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");

exports.AddMessage = catchAsync(async (req, res) => {
  try {
    const { receiver, content } = req.body;

    if (!receiver || !content) {
      return errorResponse(res, "Receiver and content are required", 400);
    }

    let student, teacher;

    if (req.user.role === "student") {
      student = req.user.id;
      teacher = receiver;
    } else if (req.user.role === "teacher") {
      teacher = req.user.id;
      student = receiver;
    } else {
      return errorResponse(res, "Invalid user role", 400);
    }

    const messageRecord = new Message({
      student,
      teacher,
      content,
      sent_by: req.user.role, // Derived automatically from req.user.role
    });

    const messageResult = await messageRecord.save();

    if (!messageResult) {
      return errorResponse(res, "Failed to send message.", 500);
    }

    return successResponse(res, "Message sent successfully", 201);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.DeleteMessage = catchAsync(async (req, res) => {
    try {
        const { id } = req.params;

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

exports.GetMessage = catchAsync(async (req, res) => {
  try {
    const { Id } = req.params;
    if(!Id ){
      return errorResponse(res, "Id are required", 400);
    }
    let student, teacher;

    if (req.user.role === "student") {
      student = req.user.id;
      teacher = Id;
    } else if (req.user.role === "teacher") {
      teacher = req.user.id;
      student = Id;
    } else {
      return errorResponse(res, "Invalid user role", 400);
    }

    const messages = await Message.find({
      student: student,
      teacher: teacher,
    }).sort({ createdAt: 1 }); // Sort by time (oldest to newest)

    return successResponse(res, "Message sent successfully", 201, messages);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});