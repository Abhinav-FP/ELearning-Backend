const { AddTeacher, RemoveTeacher, GetFavouriteTeachers } = require("../controller/wishlistController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/add", verifyToken, AddTeacher);
router.delete("/delete", verifyToken, RemoveTeacher);
router.get("/get-all", verifyToken, GetFavouriteTeachers);

module.exports = router;