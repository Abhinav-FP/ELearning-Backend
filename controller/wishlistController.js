const Wishlist = require("../model/wishlist");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");

exports.AddTeacher = catchAsync(async (req, res) => {
  try {
    const { teacherId } = req.body;

    if (!teacherId) {
      return errorResponse(res, "Teacher ID is required", 400);
    }

    const wishlistRecord = new Wishlist({
      student: req.user.id,
      teacher: teacherId,
    });

    const wishlistResult = await wishlistRecord.save();

    if (!wishlistResult) {
      return errorResponse(res, "Failed to add teacher.", 500);
    }
    return successResponse(res, "Favourite teacher added successfully", 201);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.RemoveTeacher = catchAsync(async (req, res) => {
  try {
    const { teacherId } = req.body;

    if (!teacherId) {
      return errorResponse(res, "All fields are required", 400);
    }

    const wishlistResult = await Wishlist.findOneAndDelete({ student: req.user.id, teacher: teacherId });

    if (!wishlistResult) {
      return errorResponse(res, "Failed to remove from favourites.", 500);
    }
    return successResponse(res, "Teacher removed successfuly from favourites", 201);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.GetFavouriteTeachers = catchAsync(async (req, res) => {
  try {
    const wishlistResult = await Wishlist.find({ student: req.user.id });
    if (!wishlistResult) {
      return errorResponse(res, "No Teachers found", 500);
    }
    return successResponse(res, "Teachers retrieved successfully.", 201);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});