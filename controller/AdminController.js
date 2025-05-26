const Teacher = require("../model/teacher");
const User = require("../model/user");
const catchAsync = require("../utils/catchAsync");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");

exports.aTeacherList = catchAsync(async (req, res) => {
    try {
        const TeacherApprove = await Teacher.find({
            admin_approved: true
        }).populate({
            path: "userId",
            select: "-password",
        });
        const NewTeachers = await Teacher.find({
            admin_approved: false
        }).populate({
            path: "userId",
            select: "-password"
        });
        return successResponse(res, "Teacher retrieved successfully", 200, {
            TeacherApprove ,NewTeachers
        });
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
})

exports.NewTeacher = catchAsync(async (req, res) => {
    try {
        const teacher = await Teacher.find({
            admin_approved: false
        }).populate({
            path: "userId",
            select: "-password"
        });
        return successResponse(res, "Teacher retrieved successfully", 200, {
            teacher
        });
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
})

exports.ApproveTeacher = catchAsync(async (req, res) => {
    try {
        const { _id, admin_approved } = req.body;
        const AdminApprove = admin_approved === true ? false : true;
        const teacher = await Teacher.findByIdAndUpdate(_id, {
            admin_approved: AdminApprove
        });
        return successResponse(res, "Teacher retrieved successfully", 200, {
            teacher
        });
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
})

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
        const { _id, block } = req.body;
        const AdminBlock = block === true ? false : true;
        const teacher = await User.findByIdAndUpdate(_id, {
            block: AdminBlock
        });
        return successResponse(res, "Teacher retrieved successfully", 200, {
            teacher
        });
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
})

