const Bookings = require("../model/booking");
const Review = require("../model/review");
const catchAsync = require("../utils/catchAsync");
const { successResponse, errorResponse, validationErrorResponse } = require("../utils/ErrorHandling");
const Loggers = require("../utils/Logger");

exports.reviewAdd = catchAsync(async (req, res) => {
    try {
        const userId = req.user.id;
        const { description, rating, bookingId } = req.body;
        if (!userId || !bookingId || !description) {
            return validationErrorResponse(res, "All fields are required", 400);
        }
        const lessonId = await Bookings.findById(bookingId).select("LessonId");
        const reviews = await Review.create({ userId, description, lessonId: lessonId.LessonId, rating });
        const updatedBooking = await Bookings.findByIdAndUpdate(
            bookingId,
            {
                ReviewId: reviews._id
            },
            { new: true }
        );
        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        return successResponse(res, "Review submitted successfully", 201, { reviews });
    } catch (error) {
        console.log(error)
        return errorResponse(res, "Failed to submit review", 500);
    }
});

exports.reviewGet = catchAsync(async (req, res) => {
    try {
        const { status } = req.params; // URL param se status nikaal rahe hain

        let query = {};
        if (status) {
            query.review_status = status;
        }
        const reviews = await Review.find(query);
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
    try {
        const result = await Review.findByIdAndUpdate(
            _id,
            { review_status },
            { new: true }
        );
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
        return successResponse(res, "Review updated successfully", 200, result);
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

exports.ReviewList = catchAsync(async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate({
                path: "lessonId",
                select: "teacher title description",
            })
            .populate("userId");

        const groupedReviews = reviews.reduce((acc, review) => {
            const status = review.review_status || "Unknown";
            if (!acc[status]) {
                acc[status] = [];
            }
            acc[status].push(review);
            return acc;
        }, {});
        successResponse(res, "Grouped reviews", 200, { reviews, groupedReviews });
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
})

exports.ReviewApporve = catchAsync(async (req, res) => {
    try {
        const { _id, review_status, description } = req.body;

        const Record = await Review.findByIdAndUpdate(
            _id,
            { review_status, description },
            { new: true }
        );

        if (!Record) {
            return errorResponse(res, "Review not found", 404);
        }

        successResponse(res, "Review retrieved successfully!", 200, Record);
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});


