const { AddMessage, DeleteMessage, GetMessage } = require("../controller/messageController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/add", verifyToken, AddMessage);
router.delete("/delete/:id", verifyToken, DeleteMessage);
router.get("/get/:studentId/:teacherId", verifyToken, GetMessage);

module.exports = router;