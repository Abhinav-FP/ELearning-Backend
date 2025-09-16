const Lesson = require("../model/lesson");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
const Bookings = require("../model/booking");
const User = require("../model/user");
const Review = require("../EmailTemplate/Review");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/EmailMailler");
const logger = require("../utils/Logger");
const Teacher = require("../model/teacher");

exports.AddLesson = catchAsync(async (req, res) => {
    try {
        // const data = await Teacher.findOne({userId : req.user?.id});        
        // if(!data?.admin_approved){
        //   return errorResponse(res, "Your account is not yet approved", 403);
        // }
        
        const { title, description, duration, price } = req.body;

        if (!title || !description || !duration || !price) {
            return errorResponse(res, "All fields are required", 400);
        }

        const lessonRecord = new Lesson({
            title,
            description,
            duration,
            price,
            teacher: req.user.id,
        });

        const lessonResult = await lessonRecord.save();

        if (!lessonResult) {
            return errorResponse(res, "Failed to add lesson.", 500);
        }

        return successResponse(res, "Lesson added successfully", 201);
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.UpdateLesson = catchAsync(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return errorResponse(res, "Lesson ID is required", 400);
        }
        const updates = req.body;
        const updatedLesson = await Lesson.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });
        if (!updatedLesson) {
            return errorResponse(res, "Lesson not found", 404);
        }
        return successResponse(res, "Lesson updated successfully", 200, updatedLesson);
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.DeleteLesson = catchAsync(async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, "Lesson ID is required", 400);
        }

        const lesson = await Lesson.findById(id);

        if (!lesson) {
            return errorResponse(res, "Lesson not found", 404);
        }

        lesson.is_deleted = true;
        await lesson.save();

        return successResponse(res, "Lesson disabled successfully", 200);
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.GetLessonsForAdmin = catchAsync(async (req, res) => {
    try {
        const { teacherId } = req.query;
        let lessons;
        if (teacherId) {
            lessons = await Lesson.find({ teacher: teacherId }).populate("teacher");
        } else {
            lessons = await Lesson.find().populate("teacher");
        }
        if (!lessons || lessons.length === 0) {
            return errorResponse(res, "No lessons found", 404);
        }
        return successResponse(res, "Lessons retrieved successfully", 200, lessons);
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});


exports.LessonDone = catchAsync(async (req, res) => {
  try {
    const { token } = req.body;
    const { teacherId, UserId, BookingId } = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!BookingId) {
      return res.status(400).json({
        status: false,
        msg: "Booking ID is required",
      });
    }

    const booking = await Bookings.findById(BookingId);
    if (!booking) {
      return res.status(404).json({
        status: false,
        msg: "Booking not found",
      });
    }

    // ✅ If both already done, exit early
    if (booking.lessonCompletedTeacher && booking.lessonCompletedStudent) {
      return res.status(200).json({
        status: true,
        msg: "Lesson already marked as done",
      });
    }

    let updatedBooking = booking;

    if (teacherId && !booking.lessonCompletedTeacher) {
      updatedBooking = await Bookings.findByIdAndUpdate(
        booking._id,
        { lessonCompletedTeacher: true },
        { new: true }
      );
    }

    if (UserId && !booking.lessonCompletedStudent) {
      updatedBooking = await Bookings.findByIdAndUpdate(
        booking._id,
        { lessonCompletedStudent: true },
        { new: true }
      );
    }

    // ✅ Send review email only if both are now marked as done
    if (
      updatedBooking?.lessonCompletedTeacher === true &&
      updatedBooking?.lessonCompletedStudent === true
    ) {
      const userdata = await User.findById(updatedBooking?.UserId);
      if (userdata?.email) {
        const reviewLink = `https://japaneseforme.com/student/review/${updatedBooking._id}`;
        const reviewSubject = "🎉 Share your feedback with Japanese for Me!";
        const emailHtml = Review(userdata?.name, reviewLink);

        await sendEmail({
          email: userdata.email,
          subject: reviewSubject,
          emailHtml: emailHtml,
        });

        logger.info(
          `📧 Lesson review email sent to ${userdata.email} for booking ${updatedBooking._id}`
        );
      }
    }

    return res.status(200).json({
      status: true,
      msg: "Lesson completion status updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      msg: "Something went wrong while updating lesson status",
      error: error.message,
    });
  }
});


exports.Bookingid = catchAsync(async (req, res) => {
    try {
        const { id } = req.params;
        console.log("id" ,id)
        const record = await Bookings.findById( id );
        if (!record) {
            return res.status(404).json({
                status: false,
                message: "booking not found",
            });
        }
        res.json({
            data: record,
            msg: "booking retrieved successfully",
            status: true
        })
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({
            status: false,
            message: "Failed to fetch booking",
            error: error.message,
        });
    }
})
