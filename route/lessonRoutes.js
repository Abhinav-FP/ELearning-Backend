const { AddLesson, DeleteLesson, GetLessonsByTeacher } = require("../controller/lessonController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/lesson/add", verifyToken, AddLesson);
router.delete("/lesson/delete/:id", verifyToken, DeleteLesson);
// The below route is using req.query, try sending teacherId=value to get specific results
router.get("/lesson/get", verifyToken, GetLessonsByTeacher);

module.exports = router;