const router = require("express").Router();
const { TeacherList, StudentList, AdminBlockUser, ApproveRejectTeacher, PayoutAcceptorReject, PayoutListing, AdminBookingsGet, TeacherAllData, Admindashbaord , AdminEarning, AistrainedApprove } = require("../controller/AdminController");
const { verifyToken } = require("../middleware/tokenVerify");

router.get("/admin/teachers", verifyToken, TeacherList);
router.post("/admin/approveteacher", verifyToken, ApproveRejectTeacher);
router.get("/admin/studentlist", verifyToken, StudentList);
router.post("/admin/blockuser", verifyToken, AdminBlockUser);
router.get("/admin/payout", verifyToken, PayoutListing);
router.post("/admin/payoutUpdate/:id", verifyToken, PayoutAcceptorReject);
router.get("/admin/booking", verifyToken, AdminBookingsGet);
router.get("/admin/dashboard", Admindashbaord);
router.get("/admin/earning", verifyToken, AdminEarning);
router.get("/admin/teacher/:id" ,  TeacherAllData);
router.post("/admin/ais-trained" ,  AistrainedApprove);


module.exports = router;