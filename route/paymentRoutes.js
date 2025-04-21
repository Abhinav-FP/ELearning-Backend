const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');

router.post('/create-order', paymentController.createOrder);
router.post('/capture-order', paymentController.PaymentcaptureOrder);

router.post('/cancel-order', paymentController.PaymentcancelOrder);


module.exports = router;
