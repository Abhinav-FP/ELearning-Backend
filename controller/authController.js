const User = require("../model/user");
const Teacher = require("../model/teacher");
const jwt = require("jsonwebtoken");
const {errorResponse, successResponse,validationErrorResponse} = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
const Loggers = require("../utils/Logger");
const sendEmail = require("../utils/EmailMailler");
const Welcome = require("../EmailTemplate/Welcome");
const { uploadFileToSpaces, deleteFileFromSpaces } = require("../utils/FileUploader");

const signEmail = async (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "15m",
  });
  return token;
};

exports.signup = catchAsync(async (req, res) => {
  try {
    const { name, email, password, role, gender, nationality, time_zone } =  req.body;
    if (!email || !password || !role || !name || !time_zone) {
      return errorResponse(res, "All fields are required", 401, "false");
    }
    const userRecord = new User({
      name,
      email,
      password,
      role,
      gender,
      nationality,
      time_zone,
    });

    const userResult = await userRecord.save();

    if (!userResult) {
      return errorResponse(res, "Failed to create user.", 500);
    }
    // Teacher Register
    // if (role === "teacher") {
    //   if ((!description, !experience, !city, !intro_video, !qualifications, !languages_spoken, !ais_trained, !payment_method)) {
    //     return errorResponse(res, "All fields are required", 401, "false");
    //   }
    // }
    const token = await signEmail(userResult._id);
    const link = `https://e-learning-seven-ashy.vercel.app/verify/${token}`;

    if (role !== "teacher") {
      // Send email logic for student
      const registrationSubject =
      "Welcome to Japanese for Me!🎉 Your account has been created.";
    const emailHtml = Welcome(name, link);
    await sendEmail({
      email: email,
      subject: registrationSubject,
      emailHtml: emailHtml,
    });
      return successResponse(res, "User created successfully!", 201, {
        user: userResult,
      });
    }

    // Save remaining data to Carrier table with reference to User

    const teacherRecord = new Teacher({
      userId: userResult._id,
      // description: description,
      // experience,
      // city,
      // intro_video,
      // qualifications,
      // languages_spoken,
      // ais_trained,
      // payment_method,
      // profile_photo: req.file?.location || null,
    });

    const teacherResult = await teacherRecord.save();

    if (!teacherResult) {
      await User.findByIdAndDelete(userResult._id);
      return errorResponse(res, "Failed to create carrier.", 500);
    }

    const registrationSubject =
      "Welcome to E-learning! 🎉 Your account has been created.";
    const emailHtml = Welcome(name, link);
    await sendEmail({
      email: email,
      subject: registrationSubject,
      emailHtml: emailHtml,
    });
    successResponse(res, "Teacher created successfully!", 201, {
      user: userResult,
      carrier: teacherResult,
    });

  } catch (error) {
    console.log("error", error);
    Loggers.error(error);
     if (error.code === 11000 && error.keyPattern?.email) {
    return errorResponse(
      res,
      "This email is already registered. Please log in or use a different email.",
      400
    );
  }
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((el) => el.message);
      console.log("errors", errors);
      return validationErrorResponse(res, errors.join(", "), 400, "error");
    }
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.verifyEmail = catchAsync(async (req, res) => {
  try{
  const { token } = req.body;
  const { id } = jwt.verify(token, process.env.JWT_SECRET_KEY);
  if (!id) {
    return errorResponse(res, "Invalid or expired token", 400);
  }
  const user = await User.findById(id);
  if (!user) {
    return errorResponse(res, "User not found", 404);
  }
  user.email_verify = true;
  await user.save();
  return successResponse(res, "Email verified successfully!", 200);
} catch (error) {
  return errorResponse(res, error.message || "Internal Server Error", 500);
}
});

exports.login = catchAsync(async (req, res) => {
  // Code to sync indexes, just replace Ranks with your model name
  // (async () => {
  //   try {
  //     await User.syncIndexes(); // Ensures missing indexes are created
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
    if(user?.block){
      return errorResponse(res, "Your account is blocked", 401);
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
      { id: user._id, role: user.role, time_zone: user.time_zone, email: user.email },
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
    const user = await User.findById({ _id: userId }).select(
      "email name role time_zone profile_photo email_verify"
    );
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
});

exports.updateProfile = catchAsync(async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return errorResponse(res, "Invalid User", 401);
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const updates = req.body;
    if (updates.password) {
      return errorResponse(res, "Password cannot be updated", 401);
    }

    let photo = null;
    if (req.file) {
      if (user.profile_photo) {
        // console.log("Old profile photo to delete:", user.profile_photo);
        const isDeleted = await deleteFileFromSpaces(user.profile_photo);
        if (!isDeleted) {
          return res.status(500).json({
            status: false,
            message: "Unable to delete old profile photo",
          });
        }
      }
      const fileKey = await uploadFileToSpaces(req.file);
      photo = fileKey;
    }

    if (photo) {
      updates.profile_photo = photo;
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, "No fields to update", 400);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    return successResponse(res, "Profile updated successfully!", 200, {
      user: updatedUser,
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
      return errorResponse(
        res,
        "Existing password and new password are required",
        400
      );
    }

    const user = await User.findById(userId).select("+password");

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

exports.ResendVerificationLink = catchAsync(async (req, res) => {
  try{
    const userId = req.user.id;
    if (!userId) {
      Loggers.error("Invalid User");
      return errorResponse(res, "Invalid User", 401);
    }
    const userResult = await User.findById({ _id: userId });
     const token = await signEmail(userResult._id);
    const link = `https://e-learning-seven-ashy.vercel.app/verify/${token}`;

    // Send email logic for student
    const registrationSubject =
      "Welcome to Japanese for Me!🎉 Your account has been created.";
    const emailHtml = Welcome(userResult?.name, link);
    await sendEmail({
      email: userResult?.email,
      subject: registrationSubject,
      emailHtml: emailHtml,
    });
    return successResponse(res, "Verification link sent successfully!", 200);
  }catch(error){
    console.log(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});
