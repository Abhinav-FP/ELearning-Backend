const router = require("express").Router();
const { BankAddOrEdit, BankList } = require("../controller/BankController");
const { PayoutAdd, payoutList } = require("../controller/PayoutController");
const { AddAvailability, UpdateAvailability, GetLessons, GetAvailability, RemoveAvailability, UploadCheck, DeleteCheck, TeacherGet, EarningsGet, BookingsGet } = require("../controller/teacherController");
const { verifyToken } = require("../middleware/tokenVerify");
const { upload } = require("../utils/FileUploader");

router.post("/teacher/availability/add", verifyToken, AddAvailability);

router.put("/teacher/availability/update/:id", verifyToken, UpdateAvailability);

router.delete("/teacher/availability/delete/:id", verifyToken, RemoveAvailability);

router.get("/teacher/availability/get", verifyToken, GetAvailability);

router.get("/teacher/lesson/get", verifyToken, GetLessons);

router.post("/teacher/upload/check", upload.single('file'), UploadCheck);

router.post("/teacher/delete/check", DeleteCheck);

router.post("/teacher/payout", verifyToken, PayoutAdd);

router.get("/teacher/payout", verifyToken, payoutList);

router.post("/teacher/bank", verifyToken, BankAddOrEdit);

router.get("/teacher/bank", verifyToken, BankList);

router.get("/teacher/profile", verifyToken, TeacherGet);

router.get("/teacher/earning", verifyToken, EarningsGet);

router.get("/teacher/booking", verifyToken, BookingsGet);

module.exports = router;