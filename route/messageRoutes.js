const { AddMessage, DeleteMessage, GetMessage } = require("../controller/messageController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/send", verifyToken, AddMessage);
router.delete("/delete/:id", verifyToken, DeleteMessage);
router.get("/get/:Id", verifyToken, GetMessage);

module.exports = router;