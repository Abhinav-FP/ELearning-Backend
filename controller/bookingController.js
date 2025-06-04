const Bookings = require("../model/booking");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
const { DateTime } = require("luxon");

exports.AddBooking = catchAsync(async (req, res) => {
  try {
    const { startDateTime, endDateTime, teacher_id, lesson_id } = req.body;

    if (!startDateTime, !endDateTime, !teacher_id || !lesson_id ) {
      return errorResponse(
        res,
        "Teacher ID, Lesson ID, and time are required",
        400
      );
    }

    const booking = await Bookings.create({
      teacher: teacher_id,
      startDateTime,
      endDateTime,
      lesson: lesson_id,
      student: req.user._id,
    });

    return successResponse(res, "Booking added successfully", 201, booking);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.UpdateBooking = catchAsync(async (req, res) => {
  try {
    const { lessonCompletedStudent, lessonCompletedTeacher, startDateTime, endDateTime, timezone } = req.body;
    const { id } = req.params;
    if (!id) {
      return errorResponse(res, "Booking ID is required", 400);
    }
    const booking = await Bookings.findById(id)
        .populate('teacherId')
        .populate('UserId')
        .populate('LessonId');
    if (!booking) {
      return errorResponse(res, "Booking not found", 404);
    }

    if (lessonCompletedStudent != null) {
      booking.lessonCompletedStudent = lessonCompletedStudent;
    }

    if (lessonCompletedTeacher != null) {
      booking.lessonCompletedTeacher = lessonCompletedTeacher;
    }

    if (startDateTime != null &&  endDateTime != null && booking.rescheduled) {
      return errorResponse(res, "Booking has already been rescheduled once", 404);
    }

    if (startDateTime != null &&  endDateTime != null && !booking.rescheduled) {
      if(!timezone){
        return errorResponse(res, "Timezone are required when updating startTIme", 400);
      }
      // Convert times from user's timezone to UTC
      const startUTC = DateTime.fromISO(startDateTime, { zone: timezone }).toUTC().toJSDate();
      const endUTC = DateTime.fromISO(endDateTime, { zone: timezone }).toUTC().toJSDate();
      booking.startDateTime = startUTC;
      booking.endDateTime = endUTC;
      booking.rescheduled = true;
    }
    // console.log("booking",booking);
    await booking.save();
    return successResponse(res, "Booking updated successfully", 200);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.GetBookings = catchAsync(async (req, res) => {
  try {
    const { role,id } = req.user;

    let data;
      data = await Bookings.find({ UserId: id }).populate('teacherId').populate('UserId').populate('LessonId').sort({startDateTime: 1});

    if (!data || data.length === 0) {
      return errorResponse(res, "No bookings found", 200);
    }

    return successResponse(res, "Bookings retrieved successfully", 200, data);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.CancelBooking = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return errorResponse(res, "Booking ID is required", 400);
    }
    const booking = await Bookings.findById(id);
    if (!booking) {
      return errorResponse(res, "Booking not found", 404);
    }
    booking.cancelled = true;
    await booking.save();
    return successResponse(res, "Booking updated successfully", 200);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});