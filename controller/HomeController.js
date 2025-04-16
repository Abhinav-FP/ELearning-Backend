const { Logger } = require("winston");
const Home = require("../model/Home");
const { errorResponse, successResponse, validationErrorResponse } = require("../utils/ErrorHandling");
const Loggers = require("../utils/Logger");
const catchAsync = require("../utils/catchAsync");
const Faq = require("../model/Faq");
const Teacher = require("../model/teacher");

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
        const record = await Home.find({});

        if (record.length === 0) {
            Loggers.warn("Data Not Found");
            return validationErrorResponse(res, "Home Data Not Found", 400);
        }

        Loggers.info("Home Find successfully!");
        return successResponse(res, "Home Find successfully!", 200, { record });

    } catch (error) {
        Loggers.error(error);
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.homeupdate = catchAsync(async (req, res, next) => {
    try {
        const { _id, ...updateData } = req.body;

        const updatedRecord = await Home.findByIdAndUpdate(
            _id,
            updateData,
            { new: true }
        );

        if (!updatedRecord) {
            Loggers.warn("No data found with this ID.");
            return validationErrorResponse(res, "Home Data Not Updated", 400);
        }

        Loggers.info("Home Update successfully!");
        return successResponse(res, "Home Update successfully!", 200, { updatedRecord });

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


exports.GetTeachersData = catchAsync(async (req, res, next) => {
    try {
        const record = await Teacher.find({}).populate({
            path:"userId",
            select :"-password"
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

