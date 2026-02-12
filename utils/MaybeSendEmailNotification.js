const EmailNotification = require("../model/emailNotificationSchema");
const User = require("../model/user");
const sendEmail = require("./EmailMailler");
const Message = require("../EmailTemplate/Message");
const { DateTime } = require("luxon");
const logger = require("../utils/Logger");

const EMAIL_COOLDOWN_MINUTES = 240;

exports.MaybeSendEmailNotification = async (senderId, receiverId) => {
  // console.log("senderId", senderId);
  // console.log("receiverId", receiverId);
  // console.log("Inside the funtion");
  try {
    const now = DateTime.utc();

    // Check record
    const record = await EmailNotification.findOne({
      sender: senderId.id,
      receiver: receiverId,
    });

    const shouldSend =
      !record ||
      (now - new Date(record.lastSentAt)) / 1000 / 60 > EMAIL_COOLDOWN_MINUTES;

    if (!shouldSend) return;

    // console.log("email bhej rahe hai");

    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId?.id);
    // console.log("receiver", receiver);

    if (!receiver || !receiver.email) return;

    const link = senderId.role === "teacher" ? "https://akitainakaschoolonline.com/student/message" : "https://akitainakaschoolonline.com/teacher-dashboard/message";
    const subject = `New message from ${sender?.name}`;

    const emailHtml = Message(receiver?.name || "", sender?.name || "" ,link);
    await sendEmail({
        email: receiver?.email,
        subject: subject,
        emailHtml: emailHtml,
    });
    logger.info(`Email sent for sender: ${senderId?.id} and receiver: ${receiverId}`)

    // Update or create record
    await EmailNotification.findOneAndUpdate(
      { sender: senderId?.id, receiver: receiverId },
      { lastSentAt: now },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("Error sending email notification:", err);
  }
};