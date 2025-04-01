const { AddTeacher, RemoveTeacher } = require("../controller/wishlistController");

const router = require("express").Router();

router.post("/add", AddTeacher);
router.delete("/delete", RemoveTeacher);

module.exports = router;