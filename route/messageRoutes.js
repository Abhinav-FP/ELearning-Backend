const { AddMessage, DeleteMessage, GetMessage } = require("../controller/messageController");

const router = require("express").Router();

router.post("/add", AddMessage);
router.delete("/delete/:id", DeleteMessage);
router.get("/get/:studentId/:teacherId", GetMessage);

module.exports = router;