const router = require("express").Router();
const { TeacherList, StudentList, AdminBlockUser, ApproveRejectTeacher, PayoutAcceptorReject, PayoutListing, AdminBookingsGet, TeacherAllData, Admindashbaord , AdminEarning, AistrainedApprove, DeleteUser, UpdateTeacherVideo, UpdateFeaturedTeachers, AddCourse, getCourse, UpdateCourse, deleteCourse, UpdateTeacherRank, GetRankedTeachers, emulateUser } = require("../controller/AdminController");
const { verifyToken } = require("../middleware/tokenVerify");
const { upload } = require("../utils/FileUploader");

router.get("/admin/teachers", verifyToken, TeacherList);
router.post("/admin/approveteacher", verifyToken, ApproveRejectTeacher);
router.get("/admin/studentlist", verifyToken, StudentList);
// Delete Teacher and student
router.post("/admin/deleteUser/:id", verifyToken, DeleteUser);
router.post("/admin/blockuser", verifyToken, AdminBlockUser);
router.get("/admin/payout", verifyToken, PayoutListing);
router.post("/admin/payoutUpdate/:id", verifyToken, PayoutAcceptorReject);
router.get("/admin/booking", verifyToken, AdminBookingsGet);
router.get("/admin/dashboard", Admindashbaord);
router.get("/admin/earning", verifyToken, AdminEarning);
router.get("/admin/teacher/:id", verifyToken,  TeacherAllData);
router.post("/admin/ais-trained", verifyToken,  AistrainedApprove);
router.post("/admin/teacher-video", verifyToken,  UpdateTeacherVideo);
router.post("/admin/teacher/featured", verifyToken, UpdateFeaturedTeachers);
router.post("/admin/teacher/rank", verifyToken, UpdateTeacherRank);
router.get("/admin/get-rank-teachers", verifyToken, GetRankedTeachers);
router.post("/admin/course/add", verifyToken, upload.single('thumbnail'), AddCourse);
router.post("/admin/course/edit/:id", verifyToken, upload.single('thumbnail'), UpdateCourse);
router.post("/admin/course/delete/:id", verifyToken, deleteCourse);
router.get("/admin/course/get", verifyToken, getCourse);
router.get("/admin/emulate/:id", verifyToken, emulateUser);

module.exports = router;