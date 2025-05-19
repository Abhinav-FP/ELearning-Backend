const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');
const { verifyToken } = require('../middleware/tokenVerify');
const bodyParser = require('body-parser');

router.post('/create-order', verifyToken , paymentController.createOrder);
router.post('/capture-order', verifyToken ,  paymentController.PaymentcaptureOrder);

router.post('/cancel-order', verifyToken , paymentController.PaymentcancelOrder);

router.post("/create-checkout-session"  ,verifyToken  ,paymentController.createCheckout);

router.get("/payment-success/:srNo", verifyToken , paymentController.PaymentSuccess)

router.get("/payment-cancel/:srNo", verifyToken , paymentController.PaymentCancel)




module.exports = router;
