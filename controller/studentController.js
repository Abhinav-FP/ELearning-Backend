const Payment = require("../model/Payment");
const review = require("../model/review");
const Teacher = require("../model/teacher");
const User = require("../model/user");
const catchAsync = require("../utils/catchAsync");
const { successResponse, errorResponse, validationErrorResponse } = require("../utils/ErrorHandling");
const Loggers = require("../utils/Logger");

exports.paymentget = catchAsync(async (req, res) => {

    try {
        const UserId = req.user.id;
        const payment = await Payment.findById({
            _id: UserId
        });

        if (!payment) {
            Loggers.warn("Payment Not Found.");
            return validationErrorResponse(res, "payment Not Updated", 400);
        }
        return successResponse(res, "Payment Get successfully!", 201, {
            user: payment,
        });

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


exports.teacherget = catchAsync(async (req, res) => {
    try {
        const teacher = await Teacher.find({}).populate("UserId");

        if (!teacher) {
            Loggers.warn("Payment Not Found.");
            return validationErrorResponse(res, "payment Not Updated", 400);
        }
        return successResponse(res, "User created successfully!", 201, {
            user: teacher,
        });

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
})


exports.GetFavouriteTeachers = catchAsync(async (req, res) => {
    try {
        const wishlistResult = await Wishlist.find({ student: req.user.id });
        if (!wishlistResult) {
            return errorResponse(res, "Failed to remove from favourites.", 500);
        }
        return successResponse(res, "Teacher removed successfuly from favourites", 201);
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});


exports.reviewUserGet = catchAsync(async (req, res) => {
    const userId = req.user.id
    try {
        const reviews = await review.find({ userId: userId }).populate({
            path :"lessonId",
            select: "title"
        });
        if (!reviews.length) {
            Loggers.warn("No reviews found");
            return validationErrorResponse(res, "No reviews available", 404);
        }
        return successResponse(res, "Reviews retrieved successfully", 200, { reviews });
    } catch (error) {
        Loggers.error(error.message);
        return errorResponse(res, "Failed to retrieve reviews", 500);
    }
});