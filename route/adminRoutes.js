const router = require("express").Router();
const { TeacherList, ApproveTeacher, StudentList, AdminBlockUser } = require("../controller/AdminController");

router.get("/admin/teachers", TeacherList);
router.post("/admin/approveteacher", ApproveTeacher);
router.get("/admin/studentlist", StudentList);
router.post("/admin/blockuser", AdminBlockUser);

module.exports = router;