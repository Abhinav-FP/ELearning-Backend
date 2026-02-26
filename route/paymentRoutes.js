const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');
const { verifyToken } = require('../middleware/tokenVerify');
const bodyParser = require('body-parser');

router.post('/create-order', verifyToken, paymentController.createOrder);
router.post('/capture-order', verifyToken, paymentController.PaymentcaptureOrder);
// Wallet recharge paypal route
router.post('/capture-wallet-order', verifyToken, paymentController.PaymentWalletCaptureOrder);
router.post('/tip-capture-order', verifyToken, paymentController.PaymentcaptureTipsOrder);
router.post('/cancel-order', verifyToken, paymentController.PaymentcancelOrder);

// router.post("/create-checkout-session"  ,verifyToken  ,paymentController.createCheckout);

// router.get("/payment-success/:srNo", verifyToken , paymentController.PaymentSuccess)

// router.get("/payment-cancel/:srNo", verifyToken , paymentController.PaymentCancel)


router.post("/create-payment-intent", verifyToken, paymentController.PaymentCreate)
// Wallet Stripe payment route
router.post("/create-wallet-payment-intent", verifyToken, paymentController.WalletPaymentCreate)

// Booking payment via wallet route
router.post("/wallet-booking", verifyToken, paymentController.WalletBookingPayment)


module.exports = router;
