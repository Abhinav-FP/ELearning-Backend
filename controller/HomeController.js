const { Logger } = require("winston");
const Home = require("../model/Home");
const { errorResponse, successResponse, validationErrorResponse } = require("../utils/ErrorHandling");
const Loggers = require("../utils/Logger");
const catchAsync = require("../utils/catchAsync");
const Faq = require("../model/Faq");
const Teacher = require("../model/teacher");
const { deleteFileFromSpaces, uploadFileToSpaces } = require("../utils/FileUploader");
const teacherfaq = require("../model/teacherfaq");

// Home Section
exports.homeAdd = catchAsync(async (req, res, next) => {
    try {
        const { home_img_first, hero_img_second, hero_heading, best_teacher, learn, course_heading, course_paragraph, course_img } = req.body;
        const record = new Home({
            home_img_first,
            hero_img_second,
            hero_heading,
            best_teacher,
            learn,
            course_heading,
            course_paragraph,
            course_img
        })
        const data = await record.save();
        Loggers.info("Home created successfully!");
        successResponse(res, "Home created successfully!", 201, {
            data: data,
        });

    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
}
);

exports.homefind = catchAsync(async (req, res, next) => {
    try {
        const record = await Home.findOne({});
        if (record.length === 0) {
            return validationErrorResponse(res, "Home Data Not Found", 400);
        }
        return successResponse(res, "Home Find successfully!", 200, record);

    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.homeupdate = catchAsync(async (req, res, next) => {
    try {
        const { _id, ...updateData } = req.body;
        const updated = await Home.findOne({ _id });
        const Files = req.files;
        if (Files.hero_img_first?.[0]) {
            if (updated?.hero_img_first) {
                const isDeleted = await deleteFileFromSpaces(updated.hero_img_first);
                if (!isDeleted) {
                    return res.status(500).json({ status: false, message: "Unable to delete old hero_img_first" });
                }
            }
            const fileKey = await uploadFileToSpaces(Files.hero_img_first[0]);
            updateData.hero_img_first = fileKey;
        }

        if (Files.hero_img_second?.[0]) {
            if (updated?.hero_img_second) {
                const isDeleted = await deleteFileFromSpaces(updated.hero_img_second);
                if (!isDeleted) {
                    return res.status(500).json({ status: false, message: "Unable to delete old hero_img_second" });
                }
            }
            const fileKey = await uploadFileToSpaces(Files.hero_img_second[0]);
            updateData.hero_img_second = fileKey; // ✅
        }

        if (Files.course_img?.[0]) {
            if (updated?.course_img) {
                const isDeleted = await deleteFileFromSpaces(updated.course_img);
                if (!isDeleted) {
                    return res.status(500).json({ status: false, message: "Unable to delete old course_img" });
                }
            }
            const fileKey = await uploadFileToSpaces(Files.course_img[0]);
            updateData.course_img = fileKey; // ✅
        }

        const updatedRecord = await Home.findByIdAndUpdate(_id, updateData, { new: true });

        if (!updatedRecord) {
            return validationErrorResponse(res, "Home Data Not Updated", 400);
        }

        return successResponse(res, "Home updated successfully!", 200, { updatedRecord });
    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});


exports.GetTeachers = catchAsync(async (req, res, next) => {
    try {
        const record = await Teacher.find({}).populate({
            path: "userId",
            select: "-password"
        });
        if (record.length === 0) {
            return validationErrorResponse(res, "Faq Data Not Found", 400);
        }

        Loggers.info("Faq Find successfully!");
        return successResponse(res, "Faq Find successfully!", 200, { record });

    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.GetTeacherVideo = catchAsync(async (req, res, next) => {
    try {
        const record = await Teacher.find({}).populate({
            path: "userId",
            select: "-password"
        }).limit(2).sort({
            createdAt: -1
        }).select("name intro_video average_duration average_price profile_photo");
        if (record.length === 0) {
            return validationErrorResponse(res, "Teacher Data Not Found", 400);
        }

        return successResponse(res, "Teacher Find successfully!", 200, { record });

    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

// Faq Section  
exports.FAQAdd = catchAsync(async (req, res, next) => {
    try {
        const { type, question, answer } = req.body;
        const record = new Faq({
            type, question, answer
        })
        const data = await record.save();
        Loggers.info("Faq created successfully!");
        successResponse(res, "Faq created successfully!", 201, {
            data: data,
        });

    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
}
);

exports.faqfind = catchAsync(async (req, res, next) => {
    try {
        const record = await Faq.find({});

        if (record.length === 0) {
            Loggers.warn("Faq Data Not Found");
            return validationErrorResponse(res, "Faq Data Not Found", 400);
        }

        Loggers.info("Faq Find successfully!");
        return successResponse(res, "Faq Find successfully!", 200, { record });

    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.faqupdate = catchAsync(async (req, res, next) => {
    try {
        const { _id, ...updateData } = req.body;

        const updatedRecord = await Faq.findByIdAndUpdate(
            _id,
            updateData,
            { new: true }
        );
        if (!updatedRecord) {
            Loggers.warn("No data found with this ID.");
            return validationErrorResponse(res, "Faq Data Not Updated", 400);
        }
        Loggers.info("Faq Update successfully!");
        return successResponse(res, "Faq Update successfully!", 200, { updatedRecord });
    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.faqDelete = catchAsync(async (req, res, next) => {
    try {
        const { _id } = req.body;
        const updatedRecord = await Faq.findByIdAndDelete(
            _id,
            { new: true }
        );
        if (!updatedRecord) {
            Loggers.warn("No data found with this ID.");
            return validationErrorResponse(res, "Faq Data Not Delete", 400);
        }
        return successResponse(res, "Faq Delete successfully!", 200, updatedRecord);
    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.policycondition = catchAsync(async (req, res, next) => {
    try {
        const { _id, ...updateData } = req.body;

        const updatedRecord = await Home.findByIdAndUpdate(
            _id,
            updateData,
            { new: true }
        );

        if (!updatedRecord) {
            Loggers.warn("No data found with this ID.");
            return validationErrorResponse(res, "Not Updated", 400);
        }
        Loggers.info("Home Update successfully!");
        return successResponse(res, "Term & privacy Update successfully!", 200, { updatedRecord });

    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});




//Teacher  Faq Section  
exports.teacherFAQAdd = catchAsync(async (req, res, next) => {
    try {
        const { type, question, answer } = req.body;
        const record = new teacherfaq({
            type, question, answer
        })
        const data = await record.save();
        Loggers.info("Faq created successfully!");
        successResponse(res, "Faq created successfully!", 201, {
            data: data,
        });

    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
}
);

exports.teacherfaqfind = catchAsync(async (req, res, next) => {
    try {
        const record = await teacherfaq.find({});

        if (record.length === 0) {
            Loggers.warn("Faq Data Not Found");
            return validationErrorResponse(res, "Faq Data Not Found", 400);
        }

        Loggers.info("Faq Find successfully!");
        return successResponse(res, "Faq Find successfully!", 200, { record });

    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.teacherfaqupdate = catchAsync(async (req, res, next) => {
    try {
        const { _id, ...updateData } = req.body;

        const updatedRecord = await teacherfaq.findByIdAndUpdate(
            _id,
            updateData,
            { new: true }
        );
        if (!updatedRecord) {
            Loggers.warn("No data found with this ID.");
            return validationErrorResponse(res, "Faq Data Not Updated", 400);
        }
        Loggers.info("Faq Update successfully!");
        return successResponse(res, "Faq Update successfully!", 200, { updatedRecord });
    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.teacherfaqDelete = catchAsync(async (req, res, next) => {
    try {
        const { _id } = req.body;
        const updatedRecord = await teacherfaq.findByIdAndDelete(
            _id,
            { new: true }
        );
        if (!updatedRecord) {
            Loggers.warn("No data found with this ID.");
            return validationErrorResponse(res, "Faq Data Not Delete", 400);
        }
        return successResponse(res, "Faq Delete successfully!", 200, updatedRecord);
    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});
