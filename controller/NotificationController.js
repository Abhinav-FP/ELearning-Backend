const catchAsync = require("../utils/catchAsync");
const NotificationModel = require("../model/Notification");

exports.createNotification = catchAsync(async (req, res) => {
  try {
    const { ReceiverId, text } = req.body;
    // console.log("req.body:", req.body);
    const recordData = {
      ReceiverId,
      text,
    };
    const record = new NotificationModel(recordData);
    const data = await record.save();
    // console.log("Saved Data:", data);
  } catch (error) {
    console.error("Error saving notification:", error);
  }
});

exports.NotificationGet = catchAsync(async (req, res) => {
  const UserId = req.user.id;

  try {
    const notifications = await NotificationModel.fine({ReceiverId: UserId});
    if(!notifications){
        return errorResponse(res, "No noification found", 404); 
    }
    const notificationCount = notifications?.length || 0;
    res.json({
      status: true,
      data: notifications,
      count: notificationCount,
      message: "Notifications fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      status: false,
      message: error.message || "Failed to fetch notifications",
    });
  }
});

exports.MarkNotificationAsRead = catchAsync(async (req, res) => {
  const { id } = req.body;
  try {
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "ID is required",
      });
    }

    // Find notification by ID
    const notification = await NotificationModel.findById(id);

    if (!notification) {
      return res.status(404).json({
        status: false,
        message: "Notification not found",
      });
    }

    // Update the isRead field to true
    notification.IsRead = true;
    await notification.save();

    res.json({
      status: true,
      message: "Notification marked as read successfully",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      status: false,
      message: error.message || "Failed to mark notification as read",
    });
  }
});