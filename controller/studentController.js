const Payment = require("../model/Payment");
const review = require("../model/review");
const Teacher = require("../model/teacher");
const Wishlist = require("../model/wishlist");
const catchAsync = require("../utils/catchAsync");
const {
  successResponse,
  errorResponse,
  validationErrorResponse,
} = require("../utils/ErrorHandling");
const Loggers = require("../utils/Logger");
const mongoose = require("mongoose");

exports.paymentget = catchAsync(async (req, res) => {
  try {
    const UserId = req.user.id;
    // console.log("req.user.id", req.user.id)
    const payment = await Payment.find({ UserId: UserId }).populate("LessonId");

    // console.log("_id:", payment)
    if (!payment) {
      Loggers.warn("Payment Not Found.");
      return validationErrorResponse(res, "payment Not Updated", 400);
    }
    return successResponse(res, "Payment Get successfully!", 201, {
      payment,
    });
  } catch (error) {
    console.log("error", error);
    Loggers.error(error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((el) => el.message);
      console.log("errors", errors);
      return validationErrorResponse(res, errors.join(", "), 400, "error");
    }
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.teacherget = catchAsync(async (req, res) => {
  try {
    const teachers = await Teacher.find({}).populate({
      path: "userId",
      select: "-password",
    });
    const wishlistResult = await Wishlist.find({
      student: req.user.id,
    }).populate("teacher");
    if (!teachers) {
      return validationErrorResponse(res, "No teacher found", 400);
    }

    // Extract wishlist emails
    const wishlistEmails = wishlistResult.map((w) => w.teacher?.email);

    // Add isLiked to each teacher
    const updatedTeachers = teachers.map((t) => {
      const isLiked = wishlistEmails.includes(t.userId?.email);
      return {
        ...t.toObject(),
        isLiked,
      };
    });

    return successResponse(
      res,
      "Teachers retrieved successfully!",
      200,
      updatedTeachers
    );
  } catch (error) {
    console.log("error", error);
    Loggers.error(error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((el) => el.message);
      return validationErrorResponse(res, errors.join(", "), 400, "error");
    }
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.GetFavouriteTeachers = catchAsync(async (req, res) => {
  try {
    const wishlistResult = await Wishlist.find({
      student: req.user.id,
    }).populate("teacher");

    if (!wishlistResult || wishlistResult.length === 0) {
      return errorResponse(res, "No Teachers found", 404);
    }

    const userIds = wishlistResult
      .map((item) => item.teacher?._id?.toString())
      .filter(Boolean);

    const teacherProfiles = await Teacher.find({ userId: { $in: userIds } });

    const teacherMap = {};
    teacherProfiles.forEach((teacher) => {
      teacherMap[teacher.userId.toString()] = teacher.toObject();
    });

    const enrichedWishlist = wishlistResult.map((item) => {
      const teacherUserId = item.teacher?._id?.toString();
      const extraFields = teacherMap[teacherUserId] || {};
      return {
        ...item.toObject(),
        teacher: {
          ...item.teacher?.toObject?.(),
          ...extraFields,
        },
      };
    });

    return successResponse(
      res,
      "Teachers retrieved successfully.",
      200,
      enrichedWishlist
    );
  } catch (error) {
    console.error("Error in GetFavouriteTeachers:", error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.reviewUserGet = catchAsync(async (req, res) => {
  const userId = req.user.id;
  try {
    const reviews = await review.find({ userId: userId }).populate({
      path: "lessonId",
      select: "title",
    });
    if (!reviews.length) {
      Loggers.warn("No reviews found");
      return validationErrorResponse(res, "No reviews available", 404);
    }
    return successResponse(res, "Reviews retrieved successfully", 200, {
      reviews,
    });
  } catch (error) {
    Loggers.error(error.message);
    return errorResponse(res, "Failed to retrieve reviews", 500);
  }
});

exports.studentDashboard = catchAsync(async (req, res) => {
  const userId = req.user.id;
  try {
    //review
    const reviews = await review
      .find({ userId: userId })
      .populate({
        path: "lessonId",
        select: "title",
      })
      .limit(5)
      .sort({ createdAt: -1 });
    // favrator Techaer
    const wishlistResult = await Wishlist.find({ student: userId })
      .populate("teacher")
      .limit(3)
      .sort({ createdAt: -1 });

    const userIds = wishlistResult
      .map((item) => item.teacher?._id?.toString())
      .filter(Boolean);

    const teacherProfiles = await Teacher.find({ userId: { $in: userIds } });

    const teacherMap = {};
    teacherProfiles.forEach((teacher) => {
      teacherMap[teacher.userId.toString()] = teacher.toObject();
    });

    res.json({
      message: "Dashboard retrieved successfully",
      reviews: reviews,
      wishlistResult: wishlistResult,
    });
  } catch (error) {
    console.log("error", error);
    return errorResponse(res, "Failed to retrieve reviews", 500);
  }
});

exports.teachergetByID = catchAsync(async (req, res) => {
  try {
    const id = req.params.id;
    const teacher = await Teacher.findById(id).populate("userId");

    if (!teacher) {
      return validationErrorResponse(res, "No teacher found", 400);
    }

    let isLiked = false;

    if (req.user?.id) {
      // Student is logged in
      const wishlistResult = await Wishlist.findOne({
        teacher: teacher.userId._id,
        student: req.user.id,
      });

      if (wishlistResult) {
        isLiked = true;
      }
    }

    const updatedTeacher = {
      ...teacher.toObject(),
      isLiked,
    };

    return successResponse(
      res,
      "Teacher retrieved successfully!",
      200,
      updatedTeacher
    );
  } catch (error) {
    console.log("error", error);
    Loggers.error(error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((el) => el.message);
      return validationErrorResponse(res, errors.join(", "), 400, "error");
    }
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});
