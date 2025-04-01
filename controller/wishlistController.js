const Wishlist = require("../model/wishlist");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");

exports.AddTeacher = catchAsync(async (req, res) => {
  try {
    const { student, teacher } = req.body;

    if (!student || !teacher) {
      return errorResponse(res, "All fields are required", 400);
    }

    const wishlistRecord = new Wishlist({
      student,
      teacher,
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
      const { student, teacher } = req.body;
  
      if (!student || !teacher) {
        return errorResponse(res, "All fields are required", 400);
      }
      
      const wishlistResult = await Wishlist.findOneAndDelete({ student, teacher });
  
      if (!wishlistResult) {
        return errorResponse(res, "Failed to remove from favourites.", 500);
      }
      return successResponse(res, "Teacher removed successfuly from favourites", 201);
    } catch (error) {
      return errorResponse(res, error.message || "Internal Server Error", 500);
    }
  });