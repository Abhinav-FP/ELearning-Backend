const Teacher = require("../model/teacher");
const User = require("../model/user");
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

// exports.NewTeacher = catchAsync(async (req, res) => {
//     try {
//         const teacher = await Teacher.find({
//             admin_approved: false
//         }).populate({
//             path: "userId",
//             select: "-password"
//         });
//         return successResponse(res, "Teacher retrieved successfully", 200, {
//             teacher
//         });
//     } catch (error) {
//         return errorResponse(res, error.message || "Internal Server Error", 500);
//     }
// })

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
        if(approved){
          return successResponse(res, "Teacher approved successfully", 200, teacher);
        }
        else{
          return successResponse(res, "Teacher rejected successfully", 200, teacher);
        }
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.StudentList = catchAsync(async (req, res) => {
    try {
        const Student = await User.find({role: "student"});
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