const router = require("express").Router();
const { TeacherList, NewTeacher, ApproveTeacher, StudentList, AdminBlockUser } = require("../controller/AdminController");


router.get("/admin/existingteacher", TeacherList);
router.get("/admin/newteacher", NewTeacher);
router.post("/admin/approveteacher", ApproveTeacher);
router.get("/admin/studentlist", StudentList);
router.post("/admin/blockuser", AdminBlockUser);

module.exports = router;