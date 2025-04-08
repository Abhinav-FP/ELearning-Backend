const { AddMessage, DeleteMessage, GetMessage } = require("../controller/messageController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/message/send", verifyToken, AddMessage);
router.delete("/message/delete/:id", verifyToken, DeleteMessage);
router.get("/message/get/:Id", verifyToken, GetMessage);

module.exports = router;