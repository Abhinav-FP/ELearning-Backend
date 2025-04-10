const { signup, login, userId } = require("../controller/authController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/user/register", signup);
router.post("/user/login", login);
router.get("/user/profile", verifyToken ,userId );


module.exports = router;