const { paymentget, GetFavouriteTeachers, teacherget, reviewUserGet } = require("../controller/studentController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.get("/student/payment" , verifyToken , paymentget);

router.get("/student/teacherGet" , verifyToken , teacherget);

router.get("/student/favourite/get_all", verifyToken, GetFavouriteTeachers);

router.get("/student/review", verifyToken, reviewUserGet);


module.exports = router;