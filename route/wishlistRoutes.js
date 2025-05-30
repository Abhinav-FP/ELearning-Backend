const { AddTeacher, RemoveTeacher, GetFavouriteTeachers } = require("../controller/wishlistController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/favourite/add", verifyToken, AddTeacher);
router.post("/favourite/delete", verifyToken, RemoveTeacher);

module.exports = router;