const Bank = require("../model/Bank");
const catchAsync = require("../utils/catchAsync");
const Loggers = require("../utils/Logger");

exports.BankAddOrEdit = catchAsync(async (req, res) => {
    const userId = req?.user?.id;

    if (!userId) {
        return res.status(401).json({
            status: false,
            message: "Unauthorized user.",
        });
    }

    const {
        BankName,
        BankNumber,
        BranchName,
        IFSC,
        AccountHolderName,
        BranchCode,
        AccountType,
        OverseasDetails
    } = req.body;

    // Basic validation (optional but recommended)
    if (!BankName || !BankNumber || !AccountHolderName) {
        return res.status(400).json({
            status: false,
            message: "Required bank details are missing.",
        });
    }

    try {
        const bank = await Bank.findOneAndUpdate(
            { userId }, // 👈 ALWAYS by userId
            {
                BankName,
                BankNumber,
                BranchName,
                IFSC,
                AccountHolderName,
                BranchCode,
                AccountType,
                OverseasDetails,
                userId
            },
            {
                new: true,          // return updated doc
                upsert: true,       // create if not exists
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(200).json({
            status: true,
            message: "Bank details saved successfully.",
            data: bank,
        });

    } catch (error) {
        Loggers.error(error);

        // Handle unique index race condition gracefully
        if (error.code === 11000) {
            return res.status(409).json({
                status: false,
                message: "Bank details already exist for this user.",
            });
        }

        return res.status(500).json({
            status: false,
            message: "Failed to save bank details.",
            error: error.message,
        });
    }
});

exports.BankList = catchAsync(async (req, res) => {
    const userId = req?.user?.id;
    if (!userId) {
        return res.status(400).json({
            status: false,
            message: "User ID is missing.",
        });
    }
    try {
        const result = await Bank.findOne({ userId }).sort({ createdAt: -1 });
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