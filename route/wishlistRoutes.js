const { AddTeacher, RemoveTeacher } = require("../controller/wishlistController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/add", verifyToken, AddTeacher);
router.delete("/delete", verifyToken, RemoveTeacher);

module.exports = router;