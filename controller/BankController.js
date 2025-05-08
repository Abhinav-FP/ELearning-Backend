const Bank = require("../model/Bank");
const catchAsync = require("../utils/catchAsync");
const Loggers = require("../utils/Logger");


exports.BankAddOrEdit = catchAsync(async (req, res) => {
    const userId = req?.User?._id;
    if (!userId) {
        return res.status(400).json({
            status: false,
            message: "User ID is missing.",
        });
    }
    const { BankName, BankNumber, BranchName, IFSC, _id } = req.body;

    if (!BankName || !BankNumber || !BranchName || !IFSC) {
        return res.status(400).json({
            status: false,
            message: "All fields (BankName, BankNumber, BranchName, IFSC) are required.",
        });
    }
    try {
        let result;
        if (_id) {
            // Edit existing record
            result = await Bank.findByIdAndUpdate(
                _id,
                { BankName, BankNumber, BranchName, IFSC, userId },
                { new: true, runValidators: true }
            );

            if (!result) {
                return res.status(404).json({
                    status: false,
                    message: "Bank record not found.",
                });
            }

            return res.status(200).json({
                status: true,
                message: "Bank details have been successfully updated!",
                data: result,
            });
        } else {
            // Add new record
            const record = new Bank({
                BankName,
                BankNumber,
                BranchName,
                IFSC,
                userId,
            });

            result = await record.save();

            return res.status(201).json({
                status: true,
                message: "Bank details have been successfully added!",
                data: result,
            });
        }
    } catch (error) {
        Loggers.error(error)
        return res.status(500).json({
            status: false,
            message: "Failed to process bank details.",
            error: error.message,
        });
    }
});

exports.BankList = catchAsync(async (req, res) => {
    const userId = req?.User?.id;
    if (!userId) {
        return res.status(400).json({
            status: false,
            message: "User ID is missing.",
        });
    }
    try {
        const result = await Bank.find({ userId }).sort({ createdAt: -1 });

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
        logger.error(error)
        return res.status(500).json({
            status: false,
            message: "Failed to retrieve bank records.",
            error: error.message,
        });
    }
});