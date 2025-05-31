const router = require("express").Router();
const { TeacherList, StudentList, AdminBlockUser, ApproveRejectTeacher, PayoutAcceptorReject, PayoutListing, AdminBookingsGet, TeacherAllData } = require("../controller/AdminController");
const { verifyToken } = require("../middleware/tokenVerify");

router.get("/admin/teachers", verifyToken, TeacherList);
router.post("/admin/approveteacher", verifyToken, ApproveRejectTeacher);
router.get("/admin/studentlist", verifyToken, StudentList);
router.post("/admin/blockuser", verifyToken, AdminBlockUser);
router.get("/admin/payout", verifyToken, PayoutListing);
router.post("/admin/payoutUpdate/:id", verifyToken, PayoutAcceptorReject);
router.get("/admin/booking", verifyToken, AdminBookingsGet);

router.get("/admin/teacher/:id" ,  TeacherAllData);


module.exports = router;