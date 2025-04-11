const { signup, login, updateProfile, resetPassword, GetUser } = require("../controller/authController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/user/register", signup);
router.post("/user/login", login);
router.get("/user/profile", verifyToken, GetUser);
router.post("/user/update-profile", verifyToken, updateProfile);
router.post("/user/reset-password", verifyToken, resetPassword);

module.exports = router;