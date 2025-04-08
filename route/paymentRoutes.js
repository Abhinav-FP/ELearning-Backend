const { PaymentcreateOrder, PaymentcaptureOrder } = require("../controller/paymentController");

const router = require("express").Router();

router.post("/payment/create-order" , PaymentcreateOrder);

router.post("/payment/capture-order" , PaymentcaptureOrder);

// router.post("/cancel-order" ,cancelOrder)

module.exports = router;
