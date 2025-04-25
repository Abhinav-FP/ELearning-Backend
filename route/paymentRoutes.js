const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');

router.post('/create-order', paymentController.createOrder);
router.post('/capture-order', paymentController.PaymentcaptureOrder);

router.post('/cancel-order', paymentController.PaymentcancelOrder);

router.post("/create-checkout-session" ,paymentController.createCheckout);

router.get("/payment-success/:srNo", paymentController.PaymentSuccess)

router.get("/payment-cancel/:srNo", paymentController.PaymentCancel)


module.exports = router;
