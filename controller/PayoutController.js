const Bank = require("../model/Bank");
const Bookings = require("../model/booking");
const Payout = require("../model/Payout");
const catchAsync = require("../utils/catchAsync");
const Loggers = require("../utils/Logger");

exports.PayoutAdd = catchAsync(async (req, res) => {
    const userId = req?.user?.id;
    const { amount } = req.body;
    const Banks = await Bank.findOne({ userId: userId });
    if (!userId) {
        return res.status(400).json({
            status: false,
            message: "User ID is missing.",
        });
    }
    const time = Date.now();
    const bookings = await Bookings.updateMany(
        { teacherId: userId },
        { $set: { payoutCreationDate: time } }, 
        {
            new: true, // Not needed in updateMany, only works in findOneAndUpdate
            runValidators: true,
        }
    );
    if (!amount) {
        return res.status(400).json({
            status: false,
            message: "Amount are required.",
        });
    }
    try {
        const record = new Payout({
            BankId: Banks._id,
            amount,
            userId,
            createdAt:time,
        });

        const result = await record.save();

        return res.status(201).json({
            status: true,
            message: "Payout details have been successfully added!",
            data: result,
        });
    } catch (error) {
        console.log("error", error)
        Loggers.error("Error in PayoutAddOrEdit:", error);
        return res.status(500).json({
            status: false,
            message: error,
        });
    }
});

exports.payoutList = catchAsync(async (req, res) => {
    const userId = req?.user?.id;
    if (!userId) {
        return res.status(400).json({
            status: false,
            message: "User ID is missing.",
        });
    }
    try {
        const result = await Payout.find({ userId }).sort({ createdAt: -1 }).populate('BankId');
        if (result.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No bank records found.",
            });
        }
        return res.status(200).json({
            status: true,
            message: "Bank records retrieved successfully.",
            data: result,
        });
    } catch (error) {
        Loggers.error(error)
        return res.status(500).json({
            status: false,
            message: "Failed to retrieve bank records.",
            error: error.message,
        });
    }
});
