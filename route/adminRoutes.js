const router = require("express").Router();
const { TeacherList, StudentList, AdminBlockUser, ApproveRejectTeacher } = require("../controller/AdminController");

router.get("/admin/teachers", TeacherList);
router.post("/admin/approveteacher", ApproveRejectTeacher);
router.get("/admin/studentlist", StudentList);
router.post("/admin/blockuser", AdminBlockUser);

module.exports = router;