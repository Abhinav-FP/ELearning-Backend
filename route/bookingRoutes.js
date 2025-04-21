const router = require("express").Router();
const { AddBooking, GetBookings, CancelBooking, UpdateBooking } = require("../controller/bookingController");
const { verifyToken } = require("../middleware/tokenVerify");

router.post("/booking/add" , verifyToken , AddBooking);
router.post("/booking/update/:id" , verifyToken , UpdateBooking);
router.get("/booking/cancel/:id" , verifyToken , CancelBooking);
router.get("/booking/get" , verifyToken , GetBookings);

module.exports = router;