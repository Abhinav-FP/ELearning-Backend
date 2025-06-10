const { signup, login, updateProfile, resetPassword, GetUser, verifyEmail, ResendVerificationLink } = require("../controller/authController");
const { forgotlinkrecord, forgotpassword } = require("../controller/ForgetpasswordController");
const { verifyToken } = require("../middleware/tokenVerify");
const { upload } = require("../utils/FileUploader");

const router = require("express").Router();

router.post("/user/register", signup);
router.post("/user/login", login);
router.get("/user/profile", verifyToken, GetUser);
router.post("/user/update-profile", verifyToken, upload.single('profile_photo'), updateProfile);
router.post("/user/verify-email", verifyEmail);
router.post("/user/reset-password", verifyToken, resetPassword);
router.post("/user/forget-link", forgotlinkrecord);
router.post("/user/forget-password", forgotpassword);
router.get("/user/verification-link", verifyToken, ResendVerificationLink);

module.exports = router;