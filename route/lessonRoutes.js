const { AddLesson, DeleteLesson, UpdateLesson, GetLessonsForAdmin, LessonDone } = require("../controller/lessonController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/lesson/add", verifyToken, AddLesson);
router.put("/lesson/update/:id", verifyToken, UpdateLesson);
router.delete("/lesson/delete/:id", verifyToken, DeleteLesson);
router.get("/lesson/admin/get", verifyToken, GetLessonsForAdmin);
router.post("/lesson/completed", verifyToken, LessonDone);



module.exports = router;