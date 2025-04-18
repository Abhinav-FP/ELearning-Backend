const Teacher = require("../model/teacher");
const catchAsync = require("../utils/catchAsync");
const { errorResponse } = require("../utils/ErrorHandling");


exports.TeacherList = catchAsync(async (req, res) => {
    try {
        const TeacherApprove = await Teacher.find({
            admin_approved: true
        }).populate({
            path: "userId",
            select: "-password"
        });
        const TeacherDisApprove = await Teacher.find({
            admin_approved: false
        }).populate({
            path: "userId",
            select: "-password"
        });

        res.json({
            teacherapprove  :TeacherApprove,
            teacherdisapprove :TeacherDisApprove,
            message : "Teacher List"
        })
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
})