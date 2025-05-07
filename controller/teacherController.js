const TeacherAvailability = require("../model/TeacherAvailability");
const Bookings = require("../model/booking");
const Lesson = require("../model/lesson");
const catchAsync = require("../utils/catchAsync");
const { successResponse, errorResponse, validationErrorResponse } = require("../utils/ErrorHandling");
const { DateTime } = require("luxon");
const logger = require("../utils/Logger");
const { uploadFileToSpaces, deleteFileFromSpaces } = require("../utils/FileUploader");

exports.AddAvailability = catchAsync(async (req, res) => {
  try {
    let { startDateTime, endDateTime } = req.body;
    const time_zone = req.user.time_zone;

    if (!startDateTime || !endDateTime) {
      return errorResponse(res, "Start time and End time are required", 400);
    }

    // Convert input to UTC
    let startUTC = DateTime.fromISO(startDateTime, { zone: time_zone }).toUTC().toJSDate();
    let endUTC = DateTime.fromISO(endDateTime, { zone: time_zone }).toUTC().toJSDate();

    if (startUTC >= endUTC) {
      return errorResponse(res, "End time must be after start time", 400);
    }
    const existingAvailabilities = await TeacherAvailability.find({ teacher: req.user.id });
    const hasOverlap = existingAvailabilities.some(avail => {
      return startUTC < avail.endDateTime && endUTC > avail.startDateTime;
    });
    if (hasOverlap) {
      return errorResponse(res, "Availability overlaps with existing schedule", 400);
    }
    const adjacents = existingAvailabilities.filter(avail => 
      avail.endDateTime.getTime() === startUTC.getTime() || 
      avail.startDateTime.getTime() === endUTC.getTime()
    );
    if (adjacents.length > 0) {
      for (const avail of adjacents) {
        startUTC = new Date(Math.min(startUTC.getTime(), avail.startDateTime.getTime()));
        endUTC = new Date(Math.max(endUTC.getTime(), avail.endDateTime.getTime()));
      }
      const adjacentIds = adjacents.map(a => a._id);
      await TeacherAvailability.deleteMany({ _id: { $in: adjacentIds } });
    }
    const booking = await TeacherAvailability.create({
      teacher: req.user.id,
      startDateTime: startUTC,
      endDateTime: endUTC,
    });
    return successResponse(res, "Availability added successfully", 201, booking);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.UpdateAvailability = catchAsync(async (req, res) => {
  try {
    const { startDateTime, endDateTime } = req.body;
    const { id } = req.params;
    const time_zone = req.user.time_zone;

    if (!id) {
      return errorResponse(res, "ID is required", 400);
    }

    const data = await TeacherAvailability.findById(id);
    if (!data) {
      return errorResponse(res, "Invalid Id. No data found", 404);
    }

    if (startDateTime != null) {
      data.startDateTime = DateTime.fromISO(startDateTime, { zone: time_zone }).toUTC().toJSDate();
    }

    if (endDateTime != null) {
      data.endDateTime = DateTime.fromISO(endDateTime, { zone: time_zone }).toUTC().toJSDate();
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
    // console.log("availabilityBlocks",availabilityBlocks);
    const bookings = await Bookings.find({ teacherId: id, cancelled: false }).lean();
    // console.log("bookings",bookings);
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

exports.UploadCheck = catchAsync(async (req, res) => {
  try {
    if(!req.file){
      return res.status(500).json({ error: 'File toh bhej bhai' });
    }
    const fileKey = await uploadFileToSpaces(req.file);
    if (fileKey) {
      res.status(200).json({ fileKey });
    } else {
      res.status(500).json({ error: 'Upload failed' });
    }
  } catch (error) {
      return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.DeleteCheck = catchAsync(async (req, res) => {
  try {
    // console.log("req.body",req.body);
    const { url }= req.body;
    if(!url){
      return res.status(400).json({
        status:false,
        message: "Please provide url"
      })
    }
    const isDeleted = await deleteFileFromSpaces(url);
    if(!isDeleted){
      return res.status(500).json({
        status:false,
        message: "Unable to delete file"
      })
    }
    res.status(200).json({
      status:false,
      message: "File deleted successfully!"
    })
  } catch (error) {
      return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});