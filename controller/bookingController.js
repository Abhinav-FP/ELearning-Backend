const Bookings = require("../model/booking");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");

exports.AddBooking = catchAsync(async (req, res) => {
  try {
    const { teacher_id, lesson_id, time } = req.body;

    if (!teacher_id || !lesson_id || !time) {
      return errorResponse(
        res,
        "Teacher ID, Lesson ID, and time are required",
        400
      );
    }

    const booking = await Bookings.create({
      teacher: teacher_id,
      lesson: lesson_id,
      time,
      student: req.user._id,
    });

    return successResponse(res, "Booking added successfully", 201, booking);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.UpdateBooking = catchAsync(async (req, res) => {
  try {
    const { lessonCompletedStudent, lessonCompletedTeacher, time } = req.body;
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Booking ID is required", 400);
    }

    const booking = await Bookings.findById(id);
    if (!booking) {
      return errorResponse(res, "Booking not found", 404);
    }

    if (lessonCompletedStudent != null) {
      booking.lessonCompletedStudent = lessonCompletedStudent;
    }

    if (lessonCompletedTeacher != null) {
      booking.lessonCompletedTeacher = lessonCompletedTeacher;
    }

    if (time != null && !booking.rescheduled) {
      booking.time = time;
      booking.rescheduled = true;
    }

    await booking.save();
    return successResponse(res, "Booking updated successfully", 200);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.GetBookings = catchAsync(async (req, res) => {
  try {
    const { role, _id } = req.user;

    let data;
    if (role === "teacher") {
      data = await Bookings.find({ teacher: _id }).populate([
        { path: "teacher" },
        { path: "student" },
        { path: "lesson" },
      ]);
    } else if (role === "student") {
      data = await Bookings.find({ student: _id }).populate([
        { path: "teacher" },
        { path: "student" },
        { path: "lesson" },
      ]);
    }
    else {
      // Case when role is admin
      data = await Bookings.find().populate([
        { path: "teacher" },
        { path: "student" },
        { path: "lesson" },
      ]);
    }

    if (!data || data.length === 0) {
      return errorResponse(res, "No bookings found", 404);
    }

    return successResponse(res, "Bookings retrieved successfully", 200, data);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});
