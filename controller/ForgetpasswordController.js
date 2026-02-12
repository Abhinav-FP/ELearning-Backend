const jwt = require("jsonwebtoken");
const User = require("../model/user");
const { validationErrorResponse, errorResponse, successResponse } = require("../utils/ErrorHandling");
const bcrypt = require("bcrypt");
const catchAsync = require("../utils/catchAsync");
const { promisify } = require("util");
const nodemailer = require("nodemailer");
const logger = require("../utils/Logger");
const ForgetPassword = require("../EmailTemplate/Forgetpassword");
const sendEmail = require("../utils/EmailMailler");

const signEmail = async (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "15m",
  });
  return token;
};

exports.forgotlinkrecord = catchAsync(
  async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return validationErrorResponse(res, { email: 'Email is required' });
      }
      const record = await User.findOne({ email: email });
      if (!record) {
        return errorResponse(res, "No user found with this email", 404);
      }
      const token = await signEmail(record._id);
      const resetLink = `https://www.akitainakaschoolonline.com/forget-password/${token}`;
      const customerUser = record.name;
      const registrationSubject =
        "Reset Your Password";
      const emailHtml = ForgetPassword(resetLink, customerUser);
      await sendEmail({
        email: email,
        subject: registrationSubject,
        emailHtml: emailHtml,
      });
      return successResponse(res, "Email has been sent to your registered email");
    } catch (error) {
      console.error("Error in forgot password process:", error);
      logger.error("Error in forgot password process:", error);
      return errorResponse(res, "Failed to send email");
    }
  }
);

exports.forgotpassword = catchAsync(
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.id);
      if (!user) {
        return errorResponse(res, "User not found", 404);
      }
      // Hash the password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
      const record = await user.save();
      return successResponse(res, "Password has been successfully reset");
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return errorResponse(res, "Token has expired. Please generate a new token.", 401);
      }
      console.error("Error in password reset process:", error);
      logger.error("Error in password reset process:", error);
      return errorResponse(res, "Failed to reset password");
    }
  }
);
