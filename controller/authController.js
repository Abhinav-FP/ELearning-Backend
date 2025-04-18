const User = require("../model/user");
const Teacher = require("../model/teacher");
const jwt = require("jsonwebtoken");
const { errorResponse, successResponse, validationErrorResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
const Loggers = require("../utils/Logger");

exports.signup = catchAsync(async (req, res) => {
  try {
    const { name, email, password, role, gender, nationality, time_zone } = req.body;
    // teacher  field 
    const { description, experience, city, intro_video, qualifications, languages_spoken, ais_trained, payment_method } = req.body;

    if ((!email, !password, !role, !name, !time_zone)) {
      return errorResponse(res, "All fields are required", 401, "false");
    }
    const userRecord = new User({
      name,
      email,
      password,
      role,
      gender,
      nationality,
      time_zone
    });
    const userResult = await userRecord.save();
    if (!userResult) {
      return errorResponse(res, "Failed to create user.", 500);
    }
    // Teacher Register
    if (role === "teacher") {
      if ((!description, !experience, !city, !intro_video, !qualifications, !languages_spoken, !ais_trained, !payment_method)) {
        return errorResponse(res, "All fields are required", 401, "false");
      }
    }

    if (role !== "teacher") {
      return successResponse(res, "User created successfully!", 201, {
        user: userResult,
      });
    }

    // Save remaining data to Carrier table with reference to User


    const teacherRecord = new Teacher({
      userId: userResult._id,
      description: description,
      experience,
      city,
      intro_video,
      qualifications,
      languages_spoken,
      ais_trained,
      payment_method,
      profile_photo: req.file?.location || null,
    });

    const teacherResult = await teacherRecord.save();

    if (teacherResult) {
      successResponse(res, "Teacher created successfully!", 201, {
        user: userResult,
        carrier: teacherResult,
      });
    } else {
      // Rollback user creation if carrier creatison fails
      await User.findByIdAndDelete(userResult._id);

      errorResponse(res, "Failed to create carrier.", 500);
    }
  } catch (error) {
    console.log("error", error)
    Loggers.error(error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      console.log("errors", errors)
      return validationErrorResponse(res, errors.join(", "), 400, "error");
    }
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.login = catchAsync(async (req, res) => {
  // Code to sync indexes, just replace Ranks with your model name
  // (async () => {
  //   try {
  //     await Ranks.syncIndexes(); // Ensures missing indexes are created
  //     console.log("Indexes synced successfully!");
  //     res.status(200).json({
  //       status:true,
  //       message:"Indexes synced successfully"
  //     })
  //   } catch (error) {
  //     console.error("Error syncing indexes:", error);
  //   }
  // })();

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        status: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return errorResponse(res, "Invalid email", 401);
    }
    if (password != user.password) {
      return errorResponse(res, "Invalid password", 401);
    }
    if (user?.role === "teacher") {
      const teacher = await Teacher.findOne({ userId: user._id });
      if (!teacher) {
        return errorResponse(res, "Teacher not found", 401);
      }
      if (teacher?.admin_approved === false) {
        return errorResponse(res, "Account not approved yet", 401);
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    return res.status(200).json({
      status: true,
      message: "Login successful",
      token,
      role: user?.role,
    });
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.GetUser = catchAsync(async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      Loggers.error("Invalid User");
      return errorResponse(res, "Invalid User", 401);
    }
    const user = await User.findById({ _id: userId }).select("email name role phone");
    if (!user) {
      Loggers.error("Invalid User");
      return errorResponse(res, "Invalid User", 401);
    }
    if (user) {
      return successResponse(res, "User Get successfully!", 201, {
        user,
      });
    }
  } catch (error) {
    console.log(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
})

exports.updateProfile = catchAsync(async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return errorResponse(res, "Invalid User", 401);
    }
    const updates = req.body;
    if (updates.password) {
      return errorResponse(res, "Pasword cannot be updated", 401);
    }
    if (Object.keys(updates).length === 0) {
      return errorResponse(res, "No fields to update", 400);
    }
    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    return successResponse(res, "Profile updated successfully!", 200, {
      user,
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.resetPassword = catchAsync(async (req, res) => {
  try {
    const userId = req.user.id;
    const { existingPassword, newPassword } = req.body;

    if (!existingPassword || !newPassword) {
      return errorResponse(res, "Existing password and new password are required", 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    if (existingPassword !== user.password) {
      return errorResponse(res, "Existing password is incorrect", 401);
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, "Password updated successfully!", 200);
  } catch (error) {
    console.log(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});