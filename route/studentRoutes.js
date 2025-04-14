const { paymentget, GetFavouriteTeachers, teacherget } = require("../controller/studentController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.get("/student/payment" , verifyToken , paymentget);

router.get("/student/teacher_get" , teacherget);

router.get("/favourite/get-all", verifyToken, GetFavouriteTeachers);




module.exports = router;