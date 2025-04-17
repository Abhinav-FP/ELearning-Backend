const Payment = require("../model/Payment");
const review = require("../model/review");
const Teacher = require("../model/teacher");
const Wishlist = require("../model/wishlist");
const catchAsync = require("../utils/catchAsync");
const { successResponse, errorResponse, validationErrorResponse } = require("../utils/ErrorHandling");
const Loggers = require("../utils/Logger");
const mongoose = require("mongoose");

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
        const teachers = await Teacher.find({}).populate(
            {
                path: "userId",
                select: "-password"
            }
        );
        const wishlistResult = await Wishlist.find({ student: req.user.id }).populate("teacher");
        if (!teachers) {
            return validationErrorResponse(res, "No teacher found", 400);
        }

        // Extract wishlist emails
        const wishlistEmails = wishlistResult.map(w => w.teacher?.email);

        // Add isLiked to each teacher
        const updatedTeachers = teachers.map(t => {
            const isLiked = wishlistEmails.includes(t.userId?.email);
            return {
                ...t.toObject(),
                isLiked
            };
        });

        return successResponse(res, "Teachers retrieved successfully!", 200, updatedTeachers);

    } catch (error) {
        console.log("error", error);
        Loggers.error(error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            return validationErrorResponse(res, errors.join(", "), 400, "error");
        }
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.GetFavouriteTeachers = catchAsync(async (req, res) => {
    try {
        const wishlistResult = await Wishlist.find({ student: req.user.id }).populate("teacher");

        if (!wishlistResult || wishlistResult.length === 0) {
            return errorResponse(res, "No Teachers found", 404);
        }

        const userIds = wishlistResult
            .map(item => item.teacher?._id?.toString())
            .filter(Boolean); 

        const teacherProfiles = await Teacher.find({ userId: { $in: userIds } });

        const teacherMap = {};
        teacherProfiles.forEach(teacher => {
            teacherMap[teacher.userId.toString()] = teacher.toObject();
        });

        const enrichedWishlist = wishlistResult.map(item => {
            const teacherUserId = item.teacher?._id?.toString();
            const extraFields = teacherMap[teacherUserId] || {};
            return {
                ...item.toObject(),
                teacher: {
                    ...item.teacher?.toObject?.(),
                    ...extraFields
                }
            };
        });

        return successResponse(res, "Teachers retrieved successfully.", 200, enrichedWishlist);
    } catch (error) {
        console.error("Error in GetFavouriteTeachers:", error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.reviewUserGet = catchAsync(async (req, res) => {
    const userId = req.user.id
    try {
        const reviews = await review.find({ userId: userId }).populate({
            path: "lessonId",
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

exports.studentDashbard = catchAsync(async (req,res)=>{
    try {
        const UserId = req.user.id;
        const reviews = await review.find({ userId: UserId }).populate({
            path: "lessonId",
            select: "title"
        }).limit(5).sort({
            updatedAt
             :-1});
        
        return successResponse(res, "Dashboard retrieved successfully", 200, { reviews });
             
    } catch (error) {
        console.log("error" ,error)
        return errorResponse(res, "Failed to retrieve reviews", 500);

    }
})