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

exports.ApproveTeacher = catchAsync(async (req, res) => {
    try {
        const { _id } = req.body;
        const teacher = await Teacher.findByIdAndUpdate(_id, {
            admin_approved: true,
        });
        return successResponse(res, "Teacher approved successfully", 200, teacher);
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.StudentList = catchAsync(async (req, res) => {
    try {
        const Student = await User.find({
            role: "student",
            block: false
        });
        return successResponse(res, "Student retrieved successfully", 200, {
            Student
        });


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