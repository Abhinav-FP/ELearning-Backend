const { AddLesson, DeleteLesson, GetLessonsByTeacher, UpdateLesson, GetLessonsForAdmin } = require("../controller/lessonController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/lesson/add", verifyToken, AddLesson);
router.put("/lesson/update/:id", verifyToken, UpdateLesson);
router.delete("/lesson/delete/:id", verifyToken, DeleteLesson);
router.get("/lesson/get", GetLessonsByTeacher);
// The below route is using req.query, try sending teacherId=value to get specific results
router.get("/lesson/admin/get", verifyToken, GetLessonsForAdmin);

module.exports = router;