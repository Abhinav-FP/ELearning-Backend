const router = require("express").Router();
const { AddAvailability, UpdateAvailability, GetLessons, GetAvailability, RemoveAvailability } = require("../controller/teacherController");
const { verifyToken } = require("../middleware/tokenVerify");

router.post("/teacher/availability/add" , verifyToken , AddAvailability);

router.put("/teacher/availability/update/:id" , verifyToken , UpdateAvailability);

router.delete("/teacher/availability/delete/:id", verifyToken, RemoveAvailability);

router.get("/teacher/availability/get", verifyToken, GetAvailability);

router.get("/teacher/lesson/get", verifyToken, GetLessons);

module.exports = router;