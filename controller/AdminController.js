const Teacher = require("../model/teacher");
const User = require("../model/user");
const Payout = require("../model/Payout");
const Bookings = require("../model/booking");
const catchAsync = require("../utils/catchAsync");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const Payouts = require("../model/Payout");
const Lessons = require("../model/lesson");
const Review = require("../model/review");
const Bonus = require("../model/Bonus");

exports.TeacherList = catchAsync(async (req, res) => {
  try {
    const { search, block } = req.query;
    const userQuery = {};
    if (block) {
      userQuery.block = block;
    }
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search, "i");
      userQuery.$or = [{ name: searchRegex }, { email: searchRegex }];
    }
    const teacherQuery = {};
    if (Object.keys(userQuery).length > 0) {
      const matchedUsers = await User.find(userQuery).select("_id");
      const userIds = matchedUsers.map((user) => user._id);
      teacherQuery.userId = { $in: userIds };
    }

    const [approvedTeachers, rejectedTeachers, pendingApproval] =
      await Promise.all([
        Teacher.find({ ...teacherQuery, admin_approved: true }).populate(
          "userId"
        ),
        Teacher.find({ ...teacherQuery, admin_approved: false }).populate(
          "userId"
        ),
        Teacher.find({ ...teacherQuery, admin_approved: null }).populate(
          "userId"
        ),
      ]);

    return successResponse(res, "Teachers retrieved successfully", 200, {
      approvedTeachers,
      rejectedTeachers,
      pendingApproval,
    });

  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.ApproveRejectTeacher = catchAsync(async (req, res) => {
  try {
    const { id, approved } = req.body;
    const teacher = await Teacher.findByIdAndUpdate(
      id,
      { admin_approved: approved },
      { new: true }
    );
    if (!teacher) {
      return errorResponse(res, "Teacher not found", 404);
    }
    if (approved) {
      return successResponse(res, "Teacher approved successfully", 200, teacher);
    }
    else {
      return successResponse(res, "Teacher rejected successfully", 200, teacher);
    }
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.StudentList = catchAsync(async (req, res) => {
  const { search = "", block = "" } = req.query;

  try {
    const query = { role: "student" };
    if (search && search.trim() !== "") {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [{ name: regex }, { email: regex }];
    }
    if (block === "true") {
      query.block = true;
    } else if (block === "false") {
      query.block = false;
    }
    const students = await User.find(query);

    return successResponse(res, "Students retrieved successfully", 200, students);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});


exports.AdminBlockUser = catchAsync(async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { block: !user.block },
      { new: true }
    );
    return successResponse(res, "User block status updated successfully", 200, updatedUser);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.PayoutListing = catchAsync(async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};
    if (status && status != "") {
      filter.Status = status;
    }
    let result = await Payout.find(filter)
      .sort({ createdAt: -1 })
      .populate("BankId")
      .populate("userId");
    if (result.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No payouts found.",
      });
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");

      result = result.filter((item) => {
        const teacherName = item?.userId?.name || "";

        return (
          regex.test(teacherName)
        );
      });
    }

    return res.status(200).json({
      status: true,
      message: "Payouts retrieved successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to retrieve bank records.",
      error: error.message,
    });
  }
});

exports.PayoutAcceptorReject = catchAsync(async (req, res) => {
  try {
    const payoutId = req.params.id;
    if (!payoutId) {
      return res.status(400).json({
        status: false,
        message: "Payout ID is missing.",
      });
    }

    const { status, reason, transactionId } = req.body;

    if (!status) {
      return res.status(400).json({
        status: false,
        message: "Please send a status.",
      });
    }

    if (status === "approved" && !transactionId) {
      return res.status(400).json({
        status: false,
        message: "Transaction id is required.",
      });
    }

    if (status === "rejected" && !reason) {
      return res.status(400).json({
        status: false,
        message: "Reason is required for rejection.",
      });
    }

    const payout = await Payout.findById(payoutId);
    if (!payout) {
      return res.status(404).json({
        status: false,
        message: "Payout not found.",
      });
    }

    // Update payout
    payout.Status = status;
    payout.TransactionId = transactionId || null;
    payout.Reasons = reason || null;
    await payout.save();

    let updatedBookings, updatedBonus;

    if (status === "approved") {
      updatedBookings = await Bookings.updateMany(
        { payoutCreationDate: payout.createdAt },
        { payoutDoneAt: new Date() }
      );
      updatedBonus = await Bonus.updateMany(
        { payoutCreationDate: payout.createdAt },
        { payoutDoneAt: new Date() }
      );
    } else if (status === "rejected") {
      updatedBookings = await Bookings.updateMany(
        { payoutCreationDate: payout.createdAt },
        { payoutCreationDate: null }
      );
      updatedBonus = await Bonus.updateMany(
        { payoutCreationDate: payout.createdAt },
        { payoutCreationDate: null }
      );
    }

    return res.status(200).json({
      status: true,
      message: `Payout ${status} successfully.`,
      updatedBookingsCount: updatedBookings?.modifiedCount || 0,
    });
  } catch (error) {
    console.log("error", error);
    Loggers.error("Error in PayoutAcceptorReject:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
});

exports.AdminBookingsGet = catchAsync(async (req, res) => {
  try {
    const { search } = req.query;
    let data = await Bookings.find({}).sort({ createdAt: -1 })
      .populate('StripepaymentId')
      .populate('paypalpaymentId')
      .populate('UserId')
      .populate('teacherId')
      .populate('LessonId')
      .populate('zoom');
    if (!data) {
      return errorResponse(res, "Bookings not Found", 401);
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i"); // case-insensitive match

      data = data.filter((item) => {
        const lessonTitle = item.LessonId?.title || "";
        const teacherName = item?.teacherId?.name || "";

        return (
          regex.test(lessonTitle) ||
          regex.test(teacherName)
        );
      });
    }
    successResponse(res, "Bookings retrieved successfully!", 200, data);
  } catch (error) {
    console.log(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.AdminEarning = catchAsync(async (req, res) => {
  try {
    const { date, search } = req.query;
    const filter = {};
    if (date) {
      const now = new Date();
      if (date === "last7") {
        const from = new Date();
        from.setDate(now.getDate() - 7);
        filter.startDateTime = { $gte: from, $lte: now };

      } else if (date === "last30") {
        const from = new Date();
        from.setDate(now.getDate() - 30);
        filter.startDateTime = { $gte: from, $lte: now };

      } else if (!isNaN(date)) {
        // If it's a year like "2024"
        const year = parseInt(date, 10);
        const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
        filter.startDateTime = { $gte: startOfYear, $lte: endOfYear };
      }
    }
    let count = await Bookings.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          teacherEarning: { $sum: "$teacherEarning" },
          adminCommission: { $sum: "$adminCommission" },
          processingFee: { $sum: "$processingFee" }
        }
      }
    ]);
    let bookings = await Bookings.find(filter).sort({ startDateTime: -1 })
      .populate('StripepaymentId')
      .populate('paypalpaymentId')
      .populate('UserId')
      .populate('teacherId')
      .populate('LessonId');

    const bonus = await Bonus.aggregate([
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" }
      }
    }
    ]);

    const totalBonus = bonus.length > 0 ? bonus[0].totalAmount : 0;
    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i"); // case-insensitive match

      bookings = bookings.filter((item) => {
        const lessonTitle = item.LessonId?.title || "";
        const stripeId = item.StripepaymentId?.payment_id || "";
        const paypalId = item.paypalpaymentId?.orderID || "";
        const studentName = item?.UserId?.name || "";
        const teacherName = item?.teacherId?.name || "";

        return (
          regex.test(lessonTitle) ||
          regex.test(stripeId) ||
          regex.test(paypalId) ||
          regex.test(studentName) ||
          regex.test(teacherName)
        );
      });
    }
    if (!bookings) {
      return errorResponse(res, "Bookings not Found", 401);
    }
    count[0].totalAmount+=totalBonus;
    count[0].teacherEarning+=totalBonus;
    count[0].bonus=totalBonus;
    successResponse(res, "Bookings retrieved successfully!", 200, {
      count: count[0],
      bookings
    });
  } catch (error) {
    console.log("error", error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.TeacherAllData = catchAsync(async (req, res) => {
  try {
    const id = req.params.id;
    const record = await Teacher.findOne({ userId: id }).populate("userId");
    const Booking = await Bookings.find({
      teacherId: id,
      lessonCompletedStudent: true,
      lessonCompletedTeacher: true
    }).populate([
      { path: "teacherId" },
      { path: "UserId" },
      { path: "LessonId" },
      { path: "zoom" },
      { path: "zoom" },
    ]).sort({createdAt: -1});

    const payoutdata = await Payouts.find({ userId: id });
    const lessondata = await Lessons.find({ teacher: id }).sort({is_deleted: 1});
    const reviews = await Review.find()
      .populate({
        path: "lessonId",
        select: "teacher title description",
      })
      .populate("userId").sort({createdAt: -1});

    const filteredReviews = reviews.filter(
      (review) =>
        review.lessonId?.teacher?._id?.toString() === id
    );
    if (!record) {
      return errorResponse(res, "Teacher not found", 404);
    }
    successResponse(res, "Teacher retrieved successfully!", 200, { record, Booking, lessondata, payoutdata, filteredReviews });
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});


exports.Admindashbaord = catchAsync(async (req, res) => {
  try {
    const countstudent = await User.countDocuments({ role: "student", block: false, email_verify: true });
    const Countteacher = await Teacher.countDocuments({ admin_approved: true })
    const pendingreview = await Review.countDocuments({ review_status: "Pending" })
    const totalbooking = await Bookings.countDocuments({ lessonCompletedStudent: true, lessonCompletedTeacher: true });
    const TeacherData = await Teacher.find({ admin_approved: true }).limit(5).populate("userId");
    const ReviewData = await Review.find({}).populate("userId").populate("lessonId").sort({createdAt: -1}).limit(5);
    return successResponse(res, "Admin Dashboard Data Get", 200, {
      ReviewData, countstudent, Countteacher, pendingreview, TeacherData, totalbooking
    });
  } catch (error) {
    console.log("error", error)
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
})


exports.AistrainedApprove = catchAsync(async (req, res) => {
  try {
    const { id } = req.body;
    const user = await Teacher.findById(id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // toggle ais_trained
    const newStatus = user.ais_trained === true ? false : true;

    const teacher = await Teacher.findByIdAndUpdate(
      id,
      { ais_trained: newStatus },
      { new: true }
    );

    if (!teacher) {
      return errorResponse(res, "Teacher not found.", 404);
    }


    const message = teacher.ais_trained === true
      ? "Teacher has been successfully marked as AI-trained."
      : "Teacher has been rejected successfully.";

    return successResponse(res, message, 200, teacher);
  } catch (error) {
    console.error("Error:", error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});
