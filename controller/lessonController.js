const Lesson = require("../model/lesson");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");

exports.AddLesson = catchAsync(async (req, res) => {
  try {
    const { title, description, duration, price } = req.body;

    if (!receiver || !content) {
      return errorResponse(res, "Receiver and content are required", 400);
    }

    const lessonRecord = new Lesson({
        title,
        description,
        duration,
        price,
        teacher: req.user.id, 
    });

    const lessonResult = await lessonRecord.save();

    if (!lessonResult) {
      return errorResponse(res, "Failed to add lesson.", 500);
    }

    return successResponse(res, "Lesson added successfully", 201);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.DeleteLesson = catchAsync(async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, "Lesson ID is required", 400);
        }

        const lesson = await Lesson.findById(id);

        if (!lesson) {
            return errorResponse(res, "Lesson not found", 404);
        }

        lesson.is_deleted = true;
        await lesson.save();

        return successResponse(res, "Lesson deleted successfully", 200);
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.GetLessonsByTeacher = catchAsync(async (req, res) => {
    try {
        const { teacherId } = req.query;

        let lessons;
        if (teacherId) {
            lessons = await Lesson.find({ teacher: teacherId, is_deleted: { $ne: true } }).populate({
                path: "teacher",
              });
        } else {
            lessons = await Lesson.find({ is_deleted: { $ne: true } }).populate({
                path: "teacher",
              });;
        }

        if (!lessons || lessons.length === 0) {
            return errorResponse(res, "No lessons found", 404);
        }

        return successResponse(res, "Lessons retrieved successfully", 200, lessons);
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});