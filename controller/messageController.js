const mongoose = require("mongoose");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
const Message = require("../model/message");
const User = require("../model/user");
const { createNotification } = require("./NotificationController");

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
    await createNotification({
      body: {
        ReceiverId: receiver,
        text: `You have received a new message from ${req.user.name || ""}`,
      },
    });

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

    let student, teacher, senderRole;

    if (req.user.role === "student") {
      student = req.user.id;
      teacher = id;
      senderRole = "teacher"; // mark teacher's messages as read
    } else if (req.user.role === "teacher") {
      teacher = req.user.id;
      student = id;
      senderRole = "student"; // mark student's messages as read
    } else {
      return errorResponse(res, "Invalid user role", 400);
    }

    const ReciverUser = await User.findById(id);

    // Fetch messages
    const messages = await Message.find({
      student,
      teacher,
      is_deleted: false,
    }).sort({ createdAt: 1 });

    // Mark relevant messages as read
    await Message.updateMany(
      {
        student,
        teacher,
        sent_by: senderRole,
        is_read: false,
        is_deleted: false,
      },
      { $set: { is_read: true } }
    );

    res.json({
      ReciverUser: ReciverUser,
      messages: messages,
      status: 200,
      message: "Messages fetched successfully",
    });
    // return successResponse(res, "Messages fetched successfully", 200, messages);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.GetAllMessageCountWithNames = catchAsync(async (req, res) => {
  // Helper to merge users and messages (ensures users with no messages are included)
  function mergeUsersWithMessages(users, messages, role) {
    const messagesMap = new Map();
    const field = role === "teacher" ? "student" : "teacher";

    // Put all message-based entries in the map
    messages.forEach((msg) => {
      const userId = msg[field]?._id?.toString();
      if (userId) {
        messagesMap.set(userId, msg);
      }
    });

    // Add users who have no messages
    users.forEach((user) => {
      const userId = user._id.toString();
      if (!messagesMap.has(userId)) {
        messagesMap.set(userId, {
          count: 0,
          latestMessageTime: null,
          [field]: user,
        });
      }
    });

    // Convert map to array and sort by latestMessageTime descending
    return Array.from(messagesMap.values()).sort(
      (a, b) =>
        new Date(b.latestMessageTime || 0) - new Date(a.latestMessageTime || 0)
    );
  }

  try {
    let aggregationPipeline = [];

    // If the logged-in user is a TEACHER
    if (req.user.role === "teacher") {
      aggregationPipeline = [
        {
          $match: {
            teacher: new mongoose.Types.ObjectId(req.user.id),
            is_deleted: false,
          },
        },
        {
          $group: {
            _id: "$student",
            count: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$is_read", false] },
                      { $eq: ["$sent_by", "student"] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            latestMessageTime: { $max: "$createdAt" },
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
        { $unset: "student.password" },
        {
          $project: {
            _id: 0,
            student: 1,
            count: 1,
            latestMessageTime: 1,
          },
        },
        { $sort: { latestMessageTime: -1 } },
      ];
    }
    // If the logged-in user is a STUDENT
    else if (req.user.role === "student") {
      aggregationPipeline = [
        {
          $match: {
            student: new mongoose.Types.ObjectId(req.user.id),
            is_deleted: false,
          },
        },
        {
          $group: {
            _id: "$teacher",
            count: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$is_read", false] },
                      { $eq: ["$sent_by", "teacher"] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            latestMessageTime: { $max: "$createdAt" },
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
        { $unset: "teacher.password" },
        {
          $project: {
            _id: 0,
            teacher: 1,
            count: 1,
            latestMessageTime: 1,
          },
        },
        { $sort: { latestMessageTime: -1 } },
      ];
    } else {
      return errorResponse(res, "Invalid user role", 400);
    }

    // Run aggregation
    const messages = await Message.aggregate(aggregationPipeline);

    // Get all users of the opposite role
    const roleToSearch = req.user.role === "teacher" ? "student" : "teacher";
    const users = await User.find({ role: roleToSearch });

    // Merge messages and users, then sort by recency
    const mergedMessages = mergeUsersWithMessages(
      users,
      messages,
      req.user.role
    );

    return successResponse(
      res,
      "Message count fetched successfully",
      200,
      mergedMessages
    );
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});
