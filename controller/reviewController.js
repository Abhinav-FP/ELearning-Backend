const Review = require("../model/review");
const catchAsync = require("../utils/catchAsync");
const { successResponse, errorResponse, validationErrorResponse } = require("../utils/ErrorHandling");
const Loggers = require("../utils/Logger");

exports.reviewAdd = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { description, lessonId, rating } = req.body;

    if (!userId || !lessonId || !description) {
        Loggers.warn("Missing required fields");
        return validationErrorResponse(res, "All fields are required", 400);
    }
    try {
        const review = await Review.create({ userId, description, lessonId, rating });
        return successResponse(res, "Review submitted successfully", 201, { review });
    } catch (error) {
        Loggers.error(error.message);
        return errorResponse(res, "Failed to submit review", 500);
    }
});

exports.reviewGet = catchAsync(async (req, res) => {
    try {
        const reviews = await Review.find({});
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

exports.ReviewStatus = catchAsync(async (req, res) => {
    const { _id, review_status } = req.body;

    if (!_id || !review_status) {
        Loggers.warn("Missing required fields");
        return validationErrorResponse(res, "All fields are required", 400);
    }
    try {
        const result = await Review.findByIdAndUpdate(_id, { review_status }, { new: true });
        if (!result) {
            return validationErrorResponse(res, "Review not found", 404);
        }

        return successResponse(res, "Review status updated successfully", 200, { result });
    } catch (error) {
        Loggers.error(error.message);
        return errorResponse(res, "Failed to update review status", 500);
    }
});

exports.ReviewEdit = catchAsync(async (req, res) => {
    const { _id, description, rating } = req.body;

    if (!_id || !description) {
        Loggers.warn("Missing required fields");
        return validationErrorResponse(res, "All fields are required", 400);
    }

    try {
        const result = await Review.findByIdAndUpdate(_id, { description, rating }, { new: true });
        if (!result) {
            return validationErrorResponse(res, "Review not found", 404);
        }

        return successResponse(res, "Review updated successfully", 200, { result });
    } catch (error) {
        Loggers.error(error.message);
        return errorResponse(res, "Failed to update review", 500);
    }
});

exports.ReviewDelete = catchAsync(async (req, res) => {
    const { _id } = req.body;

    if (!_id) {
        Loggers.warn("Missing required fields");
        return validationErrorResponse(res, "Review ID is required", 400);
    }

    try {
        const result = await Review.findByIdAndDelete(_id);
        if (!result) {
            return validationErrorResponse(res, "Review not found", 404);
        }

        return successResponse(res, "Review deleted successfully", 200, { result });
    } catch (error) {
        Loggers.error(error.message);
        return errorResponse(res, "Failed to delete review", 500);
    }
});
