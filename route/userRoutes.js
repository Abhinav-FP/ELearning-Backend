const { signup, login } = require("../controller/authController");

const router = require("express").Router();

router.post("/sign-up", signup);
router.post("/login", login);

module.exports = router;