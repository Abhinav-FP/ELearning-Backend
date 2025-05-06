const router = require("express").Router();
const { AddAvailability, UpdateAvailability, GetLessons, GetAvailability, RemoveAvailability, UploadCheck, DeleteCheck } = require("../controller/teacherController");
const { verifyToken } = require("../middleware/tokenVerify");
const { upload } = require("../utils/FileUploader");

router.post("/teacher/availability/add" , verifyToken , AddAvailability);

router.put("/teacher/availability/update/:id" , verifyToken , UpdateAvailability);

router.delete("/teacher/availability/delete/:id", verifyToken, RemoveAvailability);

router.get("/teacher/availability/get", verifyToken, GetAvailability);

router.get("/teacher/lesson/get", verifyToken, GetLessons);

router.post("/teacher/upload/check",upload.single('file'), UploadCheck);

router.post("/teacher/delete/check", DeleteCheck);

module.exports = router;