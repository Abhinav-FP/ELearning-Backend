const jwt = require("jsonwebtoken");
const User = require("../model/user");
const { validationErrorResponse, errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
const { promisify } = require("util");
const nodemailer = require("nodemailer");
const logger = require("../utils/Logger");
const ForgetPassword = require("../EmailTemplate/Forgetpassword");

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
      console.log("email" ,email)
      if (!email) {
        return validationErrorResponse(res, { email: 'Email is required' });
      }
      const record = await User.findOne({ email: email });
      if (!record) {
        return errorResponse(res, "No user found with this email", 404);
      }
      const token = await signEmail(record._id);
      const resetLink = `https://www.japaneseforme.com/forget-password/${token}`;
      const customerUser = record.name;
      let transporter = nodemailer.createTransport({
        host: "smtpout.secureserver.net", port: 465, secure: true,
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
        },
      });
      const emailHtml = ForgetPassword(resetLink, customerUser);
      await transporter.sendMail({
        from: process.env.MAIL_USERNAME,
        to: record.email,
        subject: "Reset Your Password",
        html: emailHtml,
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
      user.password = newPassword ;
    const record =   await user.save(); 
    console.log(
      "record" ,record
    )
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
