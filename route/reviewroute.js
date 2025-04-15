const { reviewAdd, reviewGet, ReviewEdit, ReviewStatus, ReviewDelete } = require("../controller/reviewController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/review/add", verifyToken, reviewAdd);

router.get("/review/get", reviewGet);

router.post("/review/edit", ReviewEdit);

router.post("/review/status", ReviewStatus);

router.post("/review/delete", ReviewDelete);

module.exports = router; 