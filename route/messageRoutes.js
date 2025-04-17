const { AddMessage, DeleteMessage, GetMessage, GetAllMessageCountWithNames } = require("../controller/messageController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/message/send", verifyToken, AddMessage);
router.delete("/message/delete/:id", verifyToken, DeleteMessage);
router.get("/message/get/:id", verifyToken, GetMessage);
router.get("/message/getAll", verifyToken, GetAllMessageCountWithNames);

module.exports = router;