const router = require("express").Router();
const { paymentget, GetFavouriteTeachers, teacherget, reviewUserGet, studentDashboard, teachergetByID, GetTeacherAvailability, GetLessonsByTeacher } = require("../controller/studentController");
const { verifyToken } = require("../middleware/tokenVerify");

router.get("/student/payment", verifyToken, paymentget);

router.get("/student/teacherGet", verifyToken, teacherget);

router.get("/student/favourite/get_all", verifyToken, GetFavouriteTeachers);

router.get("/student/review", verifyToken, reviewUserGet);

router.get("/student/dashboard", verifyToken, studentDashboard);

router.get("/student/teacher/:id", teachergetByID);

router.get("/student/lesson/get/:id", GetLessonsByTeacher);

router.get("/student/teacher/availability/:id", GetTeacherAvailability);


module.exports = router;