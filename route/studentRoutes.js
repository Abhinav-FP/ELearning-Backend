const router = require("express").Router();
const { paymentget, GetFavouriteTeachers, teacherget, reviewUserGet, studentDashboard, teachergetByID, GetTeacherAvailability, GetLessonsByTeacher, SpecialSlotList, SpecialSlotPaymentLink, BulkLessonList, BulkLessonRedeem, BulkLessonCheck, WalletGet } = require("../controller/studentController");
const { verifyToken } = require("../middleware/tokenVerify");

router.get("/student/payment", verifyToken, paymentget);
router.get("/student/teacherGet", verifyToken, teacherget);
router.get("/student/favourite/get_all", verifyToken, GetFavouriteTeachers);
router.get("/student/review", verifyToken, reviewUserGet);
router.get("/student/dashboard", verifyToken, studentDashboard);
router.get("/student/teacher/:id", teachergetByID);
router.get("/student/lesson/get/:id", GetLessonsByTeacher);
router.get("/student/teacher/availability/:id", GetTeacherAvailability);
router.get("/student/specialSlot", verifyToken, SpecialSlotList);
router.get("/student/specialSlot/payment/:id", verifyToken, SpecialSlotPaymentLink);
router.post("/student/bulkLessons/check", verifyToken, BulkLessonCheck);
router.get("/student/bulkLessons", verifyToken, BulkLessonList);
router.post("/student/bulkLessons/redeem", verifyToken, BulkLessonRedeem);
router.get("/student/wallet", verifyToken, WalletGet);

module.exports = router;