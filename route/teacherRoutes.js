const router = require("express").Router();
const { BankAddOrEdit, BankList } = require("../controller/BankController");
const { PayoutAdd, payoutList } = require("../controller/PayoutController");
const { AddAvailability, UpdateAvailability, GetLessons, GetAvailability, RemoveAvailability, UploadCheck, DeleteCheck, TeacherGet, EarningsGet, BookingsGet, updateProfile, DashboardApi } = require("../controller/teacherController");
const { verifyToken } = require("../middleware/tokenVerify");
const { upload } = require("../utils/FileUploader");

router.post("/teacher/availability/add", verifyToken, AddAvailability);

router.put("/teacher/availability/update/:id", verifyToken, UpdateAvailability);

router.delete("/teacher/availability/delete/:id", verifyToken, RemoveAvailability);

router.get("/teacher/availability/get", verifyToken, GetAvailability);

router.get("/teacher/lesson/get", verifyToken, GetLessons);

// The below 2 are test routes only don't use them
router.post("/teacher/upload/check", upload.single('file'), UploadCheck);
router.post("/teacher/delete/check", DeleteCheck);

router.post("/teacher/payout", verifyToken, PayoutAdd);

router.get("/teacher/payout", verifyToken, payoutList);

router.post("/teacher/bank", verifyToken, BankAddOrEdit);

router.get("/teacher/bank", verifyToken, BankList);

router.get("/teacher/profile", verifyToken, TeacherGet);

router.post("/teacher/profile", verifyToken, upload.fields([
  { name: 'profile_photo', maxCount: 1 },
  { name: 'documents', maxCount: 1 },
]), updateProfile);

router.get("/teacher/earning", verifyToken, EarningsGet);

router.get("/teacher/booking", verifyToken, BookingsGet);

router.get("/teacher/dashboard", verifyToken, DashboardApi);


module.exports = router;