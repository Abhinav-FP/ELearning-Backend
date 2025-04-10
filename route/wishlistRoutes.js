const { AddTeacher, RemoveTeacher, GetFavouriteTeachers } = require("../controller/wishlistController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/favourite/add", verifyToken, AddTeacher);
router.delete("/favourite/delete", verifyToken, RemoveTeacher);
router.get("/favourite/get-all", verifyToken, GetFavouriteTeachers);

module.exports = router;