const Home = require("../model/Home");
const { errorResponse, successResponse, validationErrorResponse } = require("../utils/ErrorHandling");
const Loggers = require("../utils/Logger");
const catchAsync = require("../utils/catchAsync");
const Faq = require("../model/Faq");
const Teacher = require("../model/teacher");
const { deleteFileFromSpaces, uploadFileToSpaces } = require("../utils/FileUploader");
const teacherfaq = require("../model/teacherfaq");
const Lesson = require("../model/lesson");
const { default: mongoose } = require("mongoose");

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
        const teachers = await Teacher.find({})
            .populate({ path: "userId", select: "-password" });

        if (!teachers.length) {
            return validationErrorResponse(res, "Teacher data not found", 400);
        }

        const teacherData = await Promise.all(
            teachers.map(async (teacher) => {
                const lowestLesson = await Lesson.findOne({
                    teacher: new mongoose.Types.ObjectId(teacher.userId?._id), // ✅ Correct usage
                    is_deleted: false
                })
                    .sort({ price: 1 })
                    .lean();

                return {
                    ...teacher.toObject(),
                    lowestPriceLesson: lowestLesson || null
                };
            })
        );

        const record = Lesson.find({
            teacher: new mongoose.Types.ObjectId(teachers?.userId?._id)
        }).count();
        return successResponse(res, "Teachers fetched with lowest-price lessons", 200, {
            record, teacherData
        });
    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.GetTeacherVideo = catchAsync(async (req, res, next) => {
    try {
        const teachers = await Teacher.find({})
            .populate({ path: "userId", select: "-password" }).limit(3);

        if (!teachers.length) {
            return validationErrorResponse(res, "Teacher data not found", 400);
        }

        const teacherData = await Promise.all(
            teachers.map(async (teacher) => {
                const lowestLesson = await Lesson.findOne({
                    teacher: new mongoose.Types.ObjectId(teacher.userId?._id), // ✅ Correct usage
                    is_deleted: false
                })
                    .sort({ price: 1 })
                    .lean();
                return {
                    ...teacher.toObject(),
                    lowestPriceLesson: lowestLesson || null
                };
            })
        );
        const record = Lesson.find({
            teacher: new mongoose.Types.ObjectId(teachers?.userId?._id)
        }).count();

        return successResponse(res, "Teachers fetched with lowest-price lessons", 200, { record, teacherData });
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

// Faq Section 

exports.FAQAdd = catchAsync(async (req, res, next) => {
    try {
        const { type, question, answer } = req.body;
        const record = new Faq({
            type, question, answer
        })
        const data = await record.save();
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
        return successResponse(res, "Faq Find successfully!", 200, record);
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

// Teacher Faq Section

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
        return successResponse(res, "Faq Find successfully!", 200, record);
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