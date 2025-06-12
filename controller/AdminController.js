const Teacher = require("../model/teacher");
const User = require("../model/user");
const Payout = require("../model/Payout");
const Bookings = require("../model/booking");
const catchAsync = require("../utils/catchAsync");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const Payouts = require("../model/Payout");
const Lessons = require("../model/lesson");
const Review = require("../model/review");

exports.TeacherList = catchAsync(async (req, res) => {
  try {
    const { search } = req.query;

    // Step 1: Fetch all teacher groups with userId populated
    const [approvedRaw, rejectedRaw, pendingRaw, blockRaw] = await Promise.all([
      Teacher.find({ admin_approved: true }).populate("userId"),
      Teacher.find({ admin_approved: false }).populate("userId"),
      Teacher.find({ admin_approved: null }).populate("userId"),
    ]);

    // Step 2: Filter function after population
    const filterBySearch = (list) => {
      if (!search || search.trim() === "") return list;
      const searchLower = search.toLowerCase();
      return list.filter((teacher) =>
        teacher.userId?.name?.toLowerCase().includes(searchLower)
      );
    };

    // Step 3: Apply search filters
    const approved = filterBySearch(approvedRaw);
    const rejected = filterBySearch(rejectedRaw);
    const pending = filterBySearch(pendingRaw);

    return successResponse(res, "Teachers grouped successfully", 200, {
      approvedTeachers: approved,
      rejectedTeachers: rejected,
      pendingApproval: pending,
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
      query.name = { $regex: search.trim(), $options: "i" };
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
    const result = await Payout.find({})
      .sort({ createdAt: -1 })
      .populate("BankId")
      .populate("userId");
    if (result.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No payouts found.",
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
    // console.log("payoutId",payoutId);

    const { status, reason, transactionId } = req.body;
    // console.log("req.body",req.body);

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

    let updatedBookings;

    if (status === "approved") {
      updatedBookings = await Bookings.updateMany(
        { payoutCreationDate: payout.createdAt },
        { payoutDoneAt: new Date() }
      );
    } else if (status === "rejected") {
      updatedBookings = await Bookings.updateMany(
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
    const data = await Bookings.find({}).sort({ createdAt: -1 })
      .populate('StripepaymentId')
      .populate('paypalpaymentId')
      .populate('UserId')
      .populate('teacherId')
      .populate('LessonId');

    if (!data) {
      return errorResponse(res, "Bookings not Found", 401);
    }
    successResponse(res, "Bookings retrieved successfully!", 200, data);
  } catch (error) {
    console.log(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.AdminEarning = catchAsync(async(req, res)=>{
  try{
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
    const count = await Bookings.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          teacherEarning: { $sum: "$teacherEarning" },
          adminCommission: { $sum: "$adminCommission" },
          bonus: { $sum: "$bonus" }
        }
      }
    ]);
    let bookings = await Bookings.find(filter).sort({ startDateTime: -1 })
      .populate('StripepaymentId')
      .populate('paypalpaymentId')
      .populate('UserId')
      .populate('teacherId')
      .populate('LessonId');

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
    successResponse(res, "Bookings retrieved successfully!", 200, {
      count:count[0],
      bookings
    });
  }catch(error){
    console.log("error",error);
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
      { path: "LessonId" }
    ]);

    const payoutdata = await Payouts.find({ userId: id });
    const lessondata = await Lessons.find({ teacher: id });
    const reviews = await Review.find()
      .populate({
        path: "lessonId",
        select: "teacher title description",
      })
      .populate("userId");

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
    const ReviewData = await Review.find({}).limit(5).populate("userId").populate("lessonId");
    return successResponse(res, "Admin Dashboard Data Get", 200, {
      ReviewData, countstudent, Countteacher, pendingreview, TeacherData, totalbooking
    });
  } catch (error) {
    console.log("error", error)
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
})