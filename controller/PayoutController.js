const Bank = require("../model/Bank");
const Payout = require("../model/Payout");
const catchAsync = require("../utils/catchAsync");
const Loggers = require("../utils/Logger");

exports.PayoutAdd = catchAsync(async (req, res) => {

    const userId = req?.user?.id;

    const Bank  = Bank.findOne({ userId: userId });
    if (!userId) {
        return res.status(400).json({
            status: false,
            message: "User ID is missing.",
        });
    }
    const {  amount} = req.body;


    if ( !amount) {
        return res.status(400).json({
            status: false,
            message: "Amount are required.",
        });
    }
    try {
        const record = new Payout({
            BankId : Bank._id,
            amount,
            userId,
        });

        const result = await record.save();

        return res.status(201).json({
            status: true,
            message: "Payout details have been successfully added!",
            data: result,
        });
    } catch (error) {
        Loggers.error("Error in PayoutAddOrEdit:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error.",
        });
    }
})
