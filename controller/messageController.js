const Message = require("../model/message");
const mongoose = require("mongoose");
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
    const { id } = req.params;
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    let student, teacher;

    if (req.user.role === "student") {
      student = req.user.id;
      teacher = id;
    } else if (req.user.role === "teacher") {
      teacher = req.user.id;
      student = id;
    } else {
      return errorResponse(res, "Invalid user role", 400);
    }

    const messages = await Message.find({
      student: student,
      teacher: teacher,
      is_deleted: false,
    }).sort({ createdAt: 1 });

    return successResponse(res, "Message sent successfully", 201, messages);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.GetAllMessageCountWithNames = catchAsync(async (req, res) => {
  try {
    let aggregationPipeline = [];

    if (req.user.role === "teacher") {
      aggregationPipeline = [
        {
          $match: {
            teacher: new mongoose.Types.ObjectId(req.user.id),
            is_read: false,
            is_deleted: false,
          },
        },
        {
          $group: {
            _id: "$student",
            count: { $sum: 1 },
            teacher: { $first: "$teacher" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: "$student" },
        {
          $project: {
            _id: 0,
            student: 1,
            count: 1,
          },
        },
      ];
    } else if (req.user.role === "student") {
      aggregationPipeline = [
        {
          $match: {
            student: new mongoose.Types.ObjectId(req.user.id),
            is_read: false,
            is_deleted: false,
          },
        },
        {
          $group: {
            _id: "$teacher",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "teacher",
          },
        },
        { $unwind: "$teacher" },
        {
          $project: {
            _id: 0,
            teacher: 1,
            count: 1,
          },
        },
      ];
    } else {
      return errorResponse(res, "Invalid user role", 400);
    }

    const messages = await Message.aggregate(aggregationPipeline);

    return successResponse(res, "Message count fetched successfully", 200, messages);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});