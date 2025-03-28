const { signup } = require("../controller/authController");

const router = require("express").Router();

router.post("/sign-up", signup);

module.exports = router;