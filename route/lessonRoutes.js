const { AddLesson, DeleteLesson, GetLessonsByTeacher } = require("../controller/lessonController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/add", verifyToken, AddLesson);
router.delete("/delete/:id", verifyToken, DeleteLesson);
// The below route is using req.query, try sending teacherId=value to get specific results
router.get("/get", verifyToken, GetLessonsByTeacher);

module.exports = router;