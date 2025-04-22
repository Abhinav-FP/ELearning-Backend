const router = require("express").Router();
const { paymentget, GetFavouriteTeachers, teacherget, reviewUserGet, studentDashboard, teachergetByID } = require("../controller/studentController");
const { AddAvailability, UpdateAvailability } = require("../controller/teacherController");
const { verifyToken } = require("../middleware/tokenVerify");

router.post("/teacher/availability/add" , verifyToken , AddAvailability);

router.update("/teacher/availability/update/:id" , verifyToken , UpdateAvailability);

router.delete("/teacher/availability/delete/:id", verifyToken, RemoveAvailability);

router.get("/teacher/availability/get/:id", verifyToken, reviewUserGet);

module.exports = router;