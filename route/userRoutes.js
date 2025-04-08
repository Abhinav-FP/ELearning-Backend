const { signup, login } = require("../controller/authController");

const router = require("express").Router();

router.post("/user/sign-up", signup);
router.post("/user/login", login);

module.exports = router;