const Message = require("../model/message");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");

exports.AddMessage = catchAsync(async (req, res) => {
  try {
    const { student, teacher, content, sent_by } = req.body;

    if (!student || !teacher || !content || !sent_by) {
      return errorResponse(res, "All fields are required", 400);
    }

    const messageRecord = new Message({
      student,
      teacher,
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
    const { studentId, teacherId } = req.params;
    if(!studentId || !teacherId ){
      return errorResponse(res, "Student and teacher id are required", 400);
    }
    const messages = await Message.find({
      student: studentId,
      teacher: teacherId,
    }).sort({ createdAt: 1 }); // Sort by time (oldest to newest)

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});