const Bonus = require("../model/Bonus");
const Bookings = require("../model/booking");
const catchAsync = require("../utils/catchAsync");

exports.BonusAdd = catchAsync(async (req, res) => {
    try {
        const userId = req.user._id;
        const { teacherId, LessonId, amount, currency } = req.body;
        const record = new Bonus({
            userId, teacherId, LessonId, amount, currency
        })
        return res.status(200).json({
            status: true,
            message: "Bonus  records retrieved successfully.",
            data: record,
        });

    } catch (error) {
        Loggers.error(error)
        return res.status(500).json({
            status: false,
            message: "Failed to retrieve Bonus records.",
            error: error.message,
        });
    }
})

exports.BonusList = catchAsync(async (req, res) => {
    try {
        const record = await Bonus.find({});
        res.json({
            data: record,
            msg: "Bonus retrie all  ",
            status: true
        })
    } catch (error) {
        console.log("error", error);
        res.json({
            msg: "Bonus fail ",
            error: error,
            status: false
        })
    }
})


