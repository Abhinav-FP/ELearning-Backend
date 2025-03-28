const User = require("../model/user");
const jwt = require("jsonwebtoken");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhoneNumber = (phoneNumber) => {
  const phoneNumberRegex = /^[0-9]{10}$/; // Assumes a 10-digit phone number
  return phoneNumberRegex.test(phoneNumber);
};

exports.signup = catchAsync(async (req, res) => {
  try {
    const { name, email, password, role, contact } = req.body;

    // Check if required fields are provided
    if ((!email, !password, !role)) {
      return errorResponse(res, "All fields are required", 401, "false");
    }

    // Create new user record
    const record = new User({
      name,
      email,
      password,
      role,
      contact,
      created_by: null,
    });

    const result = await record.save();
    if (result) {
      successResponse(res, "You have been registered successfully !!", 201);
    } else {
      errorResponse(res, "Failed to create user.", 500);
    }
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.login = catchAsync(async (req, res) => {
  // Code to sync indexes
  // User.syncIndexes()
  // .then(() => {
  //   console.log('Indexes synced successfully');
  // })
  // .catch((err) => {
  //   console.error('Error syncing indexes:', err.message);
  // });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        status: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse(res, "Invalid email", 401);
    }
    if (user?.role === "driver") {
      return errorResponse(
        res,
        "Drivers are not allowed to login on website",
        401,
        "false"
      );
    }

    if (password != user.password) {
      return errorResponse(res, "Invalid password", 401);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    const userObject = user.toObject();
    delete userObject.password;
    return res.status(200).json({
      status: true,
      message: "Login successful",
      token,
      user: userObject,
    });
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});