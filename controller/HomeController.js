const Home = require("../model/Home");
const { errorResponse, successResponse, validationErrorResponse } = require("../utils/ErrorHandling");
const logger = require("../utils/Logger");
const catchAsync = require("../utils/catchAsync");
const Faq = require("../model/Faq");
const Teacher = require("../model/teacher");
const { deleteFileFromSpaces, uploadFileToSpaces } = require("../utils/FileUploader");
const teacherfaq = require("../model/teacherfaq");
const Lesson = require("../model/lesson");
const { default: mongoose } = require("mongoose");
const review = require("../model/review");

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
    logger.info("Home created successfully!");
    successResponse(res, "Home created successfully!", 201, {
      data: data,
    });

  } catch (error) {
    logger.error(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.homefind = catchAsync(async (req, res, next) => {
  try {
    const record = await Home.findOne({});
    const Faqrecord = await Faq.find({});
    return successResponse(res, "Home Find successfully!", 200, { Faqrecord, record });
  } catch (error) {
    logger.error(error);
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
    logger.error(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.GetTeachers = catchAsync(async (req, res, next) => {
  try {
    // Step 1: Get all teachers with userId populated (only where user is verified and not blocked)
    const teachers = await Teacher.find({})
      .populate({
        path: "userId",
        select: "-password",
        match: { block: false, email_verify: true },
      })
      .lean(); // Still includes teachers with userId: null if match fails

    // Step 2: Count lessons grouped by teacher.userId._id
    const teacherUserIds = teachers.map(t => t?.userId?._id).filter(Boolean); // Skip nulls from unmatched populate

    const lessonsAgg = await Lesson.aggregate([
      {
        $match: {
          is_deleted: false,
          teacher: { $in: teacherUserIds },
        },
      },
      {
        $group: {
          _id: "$teacher",
          count: { $sum: 1 },
          lessons: {
            $push: {
              _id: "$_id",
              price: "$price",
            },
          },
        },
      },
    ]);

    const lessonsMap = {};
    lessonsAgg.forEach((entry) => {
      const lowestLesson = entry.lessons.reduce((min, curr) =>
        curr.price < min.price ? curr : min,
        entry.lessons[0]
      );

      lessonsMap[entry._id.toString()] = {
        count: entry.count,
        lowestLesson,
      };
    });

    // Step 3 & 4: Merge data and exclude teachers with 0 lessons
    const finalTeachers = teachers
      .map((teacher) => {
        const teacherId = teacher?.userId?._id?.toString();
        const lessonInfo = lessonsMap[teacherId];

        if (!lessonInfo) return null;

        return {
          ...teacher,
          lowestLesson: lessonInfo.lowestLesson,
          totalLessons: lessonInfo.count,
        };
      })
      .filter(Boolean); // Remove teachers with 0 lessons or unmatched user

    if (!finalTeachers.length) {
      return validationErrorResponse(res, "No teacher with lessons found", 400);
    }

    return successResponse(
      res,
      "Teachers fetched with reviews and lessons",
      200,
      finalTeachers
    );
  } catch (error) {
    logger.error(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.GetTeacherVideo = catchAsync(async (req, res, next) => {
  try {
    // Step 1: Get all teachers with userId populated (only where user is verified and not blocked)
    const teachers = await Teacher.find({})
      .populate({
        path: "userId",
        select: "-password",
        match: { block: false, email_verify: true },
      })
      .sort({ createdAt: -1 })
      .lean(); // Still includes teachers with userId: null if match fails

    // Step 2: Count lessons grouped by teacher.userId._id
    const teacherUserIds = teachers.map(t => t?.userId?._id).filter(Boolean); // Skip nulls from unmatched populate

    const lessonsAgg = await Lesson.aggregate([
      {
        $match: {
          is_deleted: false,
          teacher: { $in: teacherUserIds },
        },
      },
      {
        $group: {
          _id: "$teacher",
          count: { $sum: 1 },
          lessons: {
            $push: {
              _id: "$_id",
              price: "$price",
            },
          },
        },
      },
    ]);

    const lessonsMap = {};
    lessonsAgg.forEach((entry) => {
      const lowestLesson = entry.lessons.reduce((min, curr) =>
        curr.price < min.price ? curr : min,
        entry.lessons[0]
      );

      lessonsMap[entry._id.toString()] = {
        count: entry.count,
        lowestLesson,
      };
    });

    // Step 3 & 4: Merge data and exclude teachers with 0 lessons
    const finalTeachers = teachers
      .map((teacher) => {
        const teacherId = teacher?.userId?._id?.toString();
        const lessonInfo = lessonsMap[teacherId];

        if (!lessonInfo) return null;

        return {
          ...teacher,
          lowestLesson: lessonInfo.lowestLesson,
          totalLessons: lessonInfo.count,
        };
      })
      .filter(Boolean); // Remove teachers with 0 lessons or unmatched user

    if (!finalTeachers.length) {
      return validationErrorResponse(res, "No teacher with lessons found", 400);
    }

    // ✅ Return only first 3 if more than 3
    const resultTeachers = finalTeachers.length > 3
      ? finalTeachers.slice(0, 3)
      : finalTeachers;

    return successResponse(
      res,
      "Teachers fetched with reviews and lessons",
      200,
      resultTeachers
    );
  } catch (error) {
    logger.error(error);
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
      logger.warn("No data found with this ID.");
      return validationErrorResponse(res, "Not Updated", 400);
    }
    logger.info("Home Update successfully!");
    return successResponse(res, "Term & privacy Update successfully!", 200, { updatedRecord });

  } catch (error) {
    logger.error(error);
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
    logger.error(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
}
);

exports.faqfind = catchAsync(async (req, res, next) => {
  try {
    const record = await Faq.find({});

    return successResponse(res, "Faq Find successfully!", 200, record);
  } catch (error) {
    logger.error(error);
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
      logger.warn("No data found with this ID.");
      return validationErrorResponse(res, "Faq Data Not Updated", 400);
    }
    logger.info("Faq Update successfully!");
    return successResponse(res, "Faq Update successfully!", 200, { updatedRecord });
  } catch (error) {
    logger.error(error);
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
      logger.warn("No data found with this ID.");
      return validationErrorResponse(res, "Faq Data Not Delete", 400);
    }
    return successResponse(res, "Faq Delete successfully!", 200, updatedRecord);
  } catch (error) {
    logger.error(error);
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
    logger.info("Faq created successfully!");
    successResponse(res, "Faq created successfully!", 201, {
      data: data,
    });

  } catch (error) {
    logger.error(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
}
);

exports.teacherfaqfind = catchAsync(async (req, res, next) => {
  try {
    const record = await teacherfaq.find({});
    return successResponse(res, "Faq Find successfully!", 200, record);
  } catch (error) {
    logger.error(error);
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
      logger.warn("No data found with this ID.");
      return validationErrorResponse(res, "Faq Data Not Updated", 400);
    }
    logger.info("Faq Update successfully!");
    return successResponse(res, "Faq Update successfully!", 200, { updatedRecord });
  } catch (error) {
    logger.error(error);
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
      logger.warn("No data found with this ID.");
      return validationErrorResponse(res, "Faq Data Not Delete", 400);
    }
    return successResponse(res, "Faq Delete successfully!", 200, updatedRecord);
  } catch (error) {
    logger.error(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getCommission = catchAsync(async (req, res, next) => {
  try {
    const record = await Home.findOne({}).select("admin_comission");
    if (!record) {
      return errorResponse(res, "Commission not found", 404);
    }
    successResponse(res, "Commission retrieved successfully!", 201, record?.admin_comission);
  } catch (error) {
    logger.error(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.Privacy = catchAsync(async (req, res, next) => {
  try {
    const record = await Home.findOne({}).select("privcay_policy term_contdition admin_comission");
    return successResponse(res, "Home Find successfully!", 200, record);
  } catch (error) {
    logger.error(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});