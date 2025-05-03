const TeacherAvailability = require("../model/TeacherAvailability");
const Bookings = require("../model/booking");
const Lesson = require("../model/lesson");
const catchAsync = require("../utils/catchAsync");
const { successResponse, errorResponse, validationErrorResponse } = require("../utils/ErrorHandling");
const logger = require("../utils/Logger");

exports.AddAvailability = catchAsync(async (req, res) => {
  try {
    let { startDateTime, endDateTime } = req.body;

    if (!startDateTime || !endDateTime) {
      return errorResponse(
        res,
        "Start time and End time are required",
        400
      );
    }

    // Append 'Z' if missing (assumes input is meant to be in UTC)
    if (!startDateTime.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(startDateTime)) {
      startDateTime += 'Z';
    }

    if (!endDateTime.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(endDateTime)) {
      endDateTime += 'Z';
    }

    const booking = await TeacherAvailability.create({
      teacher: req.user.id,
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
    });

    return successResponse(res, "Availability added successfully", 201, booking);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.UpdateAvailability = catchAsync(async (req, res) => {
  try {
    const { startDateTime, endDateTime  } = req.body;
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "ID is required", 400);
    }

    const data = await TeacherAvailability.findById(id);
    if (!data) {
      return errorResponse(res, "Invalid Id. No data found", 404);
    }

     // Append 'Z' if missing (assumes input is meant to be in UTC)
     if (!startDateTime.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(startDateTime)) {
      startDateTime += 'Z';
    }

    if (!endDateTime.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(endDateTime)) {
      endDateTime += 'Z';
    }

    if (startDateTime != null) {
      data.startDateTime = startDateTime;
    }

    if (endDateTime != null) {
      data.endDateTime = endDateTime;
    }

    await data.save();
    return successResponse(res, "Availability updated successfully", 200);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.RemoveAvailability = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "ID is required", 400);
    }

    const availability = await TeacherAvailability.findOneAndDelete({ _id: id });

    if (!availability) {
      return errorResponse(res, "Invalid Id. No data found", 404);
    }

    return successResponse(res, "Availability removed successfully", 200);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.GetAvailability = catchAsync(async (req, res) => {
  try {
    const id = req.user.id;
    const availabilityBlocks = await TeacherAvailability.find({ teacher: id });
    if (!availabilityBlocks || availabilityBlocks.length === 0) {
      return errorResponse(res, "No Data found", 200);
    }
    const bookings = await Bookings.find({ teacher: id, cancelled: false }).lean();
    if (!bookings || bookings.length === 0) {
      return successResponse(res, "Availability processed", 200, {
        availabilityBlocks,
        bookedSlots: [],
      });
    }

    let availableSlots = [];
    let bookedSlots = [];

    for (const availability of availabilityBlocks) {
      const aStart = new Date(availability.startDateTime);
      const aEnd = new Date(availability.endDateTime);

      const matchingBookings = bookings.filter(booking =>
        new Date(booking.endDateTime) > aStart && new Date(booking.startDateTime) < aEnd
      );

      matchingBookings.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

      let cursor = aStart;

      for (const booking of matchingBookings) {
        const bStart = new Date(booking.startDateTime);
        const bEnd = new Date(booking.endDateTime);

        if (cursor < bStart) {
          availableSlots.push({
            teacher: id,
            start: new Date(cursor),
            end: new Date(bStart),
          });
        }

        // Move cursor 5 minutes ahead of booking end
        const nextStart = new Date(bEnd.getTime() + 5 * 60000);
        cursor = nextStart > cursor ? nextStart : cursor;
      }

      if (cursor < aEnd) {
        availableSlots.push({
          teacher: id,
          start: new Date(cursor),
          end: new Date(aEnd),
        });
      }

      bookedSlots.push(
        ...matchingBookings.map(b => ({
          teacher: id,
          start: new Date(b.startDateTime),
          end: new Date(b.endDateTime),
          student: b.student,
          lesson: b.lesson,
        }))
      );
    }

    return successResponse(res, "Availability processed", 200, {
      availableSlots,
      bookedSlots,
    });
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

// This route is used when teacher want to get all the lessons in their panel
exports.GetLessons = catchAsync(async (req, res) => {
    try {
        const teacherId  = req.user.id;
        const lessons = await Lesson.find({ teacher: teacherId, is_deleted: { $ne: true } }).populate("teacher");
        if (!lessons || lessons.length === 0) {
            return errorResponse(res, "No lessons found", 404);
        }
        return successResponse(res, "Lessons retrieved successfully", 200, lessons);
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});