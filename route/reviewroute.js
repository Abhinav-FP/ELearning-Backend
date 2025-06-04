const { reviewAdd, reviewGet, ReviewEdit, ReviewStatus, ReviewDelete, ReviewList, ReviewApporve } = require("../controller/reviewController");
const { verifyToken } = require("../middleware/tokenVerify");

const router = require("express").Router();

router.post("/review/add", verifyToken, reviewAdd);

router.get("/review/get", reviewGet);

router.post("/review/edit", ReviewEdit);

router.post("/review/delete", ReviewDelete);

router.get("/review/list", ReviewList);

router.post("/review/status", ReviewApporve)

module.exports = router; 