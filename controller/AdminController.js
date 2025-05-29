const Teacher = require("../model/teacher");
const User = require("../model/user");
const Payout = require("../model/Payout");
const Bookings = require("../model/booking");
const catchAsync = require("../utils/catchAsync");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");

exports.TeacherList = catchAsync(async (req, res) => {
  try {
    const [approved, rejected, pending] = await Promise.all([
      Teacher.find({ admin_approved: true }).populate("userId"),
      Teacher.find({ admin_approved: false }).populate("userId"),
      Teacher.find({ admin_approved: null }).populate("userId"),
    ]);

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
  try {
    const Student = await User.find({ role: "student" });
    return successResponse(res, "Student retrieved successfully", 200, Student);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
})

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
    const result = await Payout.find({ })
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