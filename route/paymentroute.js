const { PaymentcreateOrder, PaymentcaptureOrder } = require("../controller/paymentController");

const router = require("express").Router();

router.post("/create-order" , PaymentcreateOrder);

router.post("/capture-order" , PaymentcaptureOrder);

// router.post("/cancel-order" ,cancelOrder)

module.exports = router;
