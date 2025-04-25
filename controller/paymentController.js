const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_TEST_KEY);
const catchAsync = require("../utils/catchAsync");
const axios = require("axios");
const qs = require('qs');
const Payment = require("../model/Payment");
const StripePayment = require("../model/StripePayment");



const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const paypalApiUrl = process.env.PAYPAL_API;

const generateAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString('base64');
    const response = await axios.post(
      `${paypalApiUrl}/v1/oauth2/token`,
      qs.stringify({
        grant_type: 'client_credentials',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("PayPal Token Error:", error.response?.data || error.message);
  }
};


exports.createOrder = catchAsync(
  async (req, res) => {
    try {
      const { amount, currency } = req.body
      const accessToken = await generateAccessToken();
      const paypalApiUrl = process.env.PAYPAL_API;

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount,
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
              payment_method_selected: "PAYPAL",
              brand_name: "DekayHub - Volatility Grid",
              shipping_preference: "NO_SHIPPING",
              locale: "en-US",
              user_action: "PAY_NOW",
            },
          },
        },
      };

      const response = await axios.post(
        `${paypalApiUrl}/v2/checkout/orders`,
        orderData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );


      res.status(201).json(response.data);
    } catch (error) {
      console.error('Error in createOrder controller:', error);
      res.status(500).json({ error: 'Failed to create PayPal order' });
    }
  }
);


exports.PaymentcaptureOrder = catchAsync(async (req, res) => {
  try {
    const accessToken = await generateAccessToken();
    const { orderID, LessonId, UserId } = req.body;


    const response = await axios.post(
      `${paypalApiUrl}/v2/checkout/orders/${orderID}/capture`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const captureData = response.data;
    const newPayment = new Payment({
      orderID: captureData.id,
      intent: captureData.intent,
      status: captureData.status,
      purchase_units: captureData.purchase_units,
      payer: captureData.payer,
      payment_source: captureData.payment_source,
      capturedAt: new Date(),
      LessonId: LessonId || undefined,
      UserId: UserId || undefined,
      amount: captureData.purchase_units[0].payments.captures[0].amount.value, // "100.00"
      currency: captureData.purchase_units[0].payments.captures[0].amount.currency_code, // "USD"
    });
    const savedPayment = await newPayment.save();

    res.status(200).json(savedPayment);
  } catch (error) {
    console.error(" Error capturing PayPal order:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to capture and save PayPal order" });
  }
});


exports.PaymentcancelOrder = catchAsync(
  async (req, res) => {
    try {
      const { orderID, LessonId, UserId } = req.body;

      if (!orderID) {
        return res.status(400).json({ error: "orderID is required" });
      }

      const accessToken = await generateAccessToken();
      try {
        const voidResponse = await axios.post(
          `${paypalApiUrl}/v2/checkout/orders/${orderID}/void`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      } catch (paypalErr) {
        console.warn("Could not void PayPal order (maybe already captured?):", paypalErr.response?.data || paypalErr.message);
      }
      const existing = await Payment.findOne({ orderID });
      if (existing) {
        return res.status(200).json({ status: "CANCELLED", message: "Already recorded" });
      }

      const newPayment = new Payment({
        orderID,
        status: "CANCELLED",
        capturedAt: new Date(),
        LessonId: LessonId || undefined,
        UserId: UserId || undefined,
      });

      await newPayment.save();

      res.status(200).json({ status: "CANCELLED", message: "Order cancelled successfully" });
    } catch (error) {
      console.error("Error saving cancelled order:", error.message);
      res.status(500).json({ error: "Failed to cancel order" });
    }
  }
);


// Stripe Checkout Sytem 
const fetchPaymentId = async (sessionId, srNo) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentId = session.payment_intent;
    if (!srNo) {
      return;
    }
    const data = await StripePayment.findOne({ srNo: srNo });
    if (!data) {
      return null;
    }
    data.payment_id = paymentId;
    await data.save();
    return paymentId;
  } catch (error) {
    console.error("Error fetching payment ID:", error);
    logger.error("Error fetching payment ID:", error);
    return null;
  }
};


exports.createCheckout = catchAsync(async (req, res) => {
  try {
    const { amount, email, userId, LessonId, currency } = req?.body;
    const lastpayment = await StripePayment.findOne().sort({ srNo: -1 });
    const srNo = lastpayment ? lastpayment.srNo + 1 : 1;
    const amountInCents = Math.round(amount * 100);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // Correct mode value
      success_url: `http://localhost:3000/stripe/success/${srNo}`,
      cancel_url: `http://localhost:3000/stripe/cancel/${srNo}`,
      submit_type: "pay",
      customer_email: "ankitjain@gmail.com",
      billing_address_collection: "auto",
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: "Booking Payment",
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
    });


    const newPayment = new StripePayment({
      srNo,
      payment_type: "card",
      payment_id: null,
      session_id: session?.id,
      currency,
      amount,
      srNo
    });
    await newPayment.save();
    res.status(200).json({ url: session.url, status: "true" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});


exports.PaymentSuccess = catchAsync(async (req, res) => {
  try {
    const { srNo } = req.params;
    if (!srNo) {
      return res.status(400).json({
        message: "srNo is required.",
        status: false,
      });
    }
    const data = await StripePayment.findOne({ srNo: srNo });
    if (!data) {
      return res.status(404).json({
        message: "Data not found",
        status: false,
      });
    }
    data.payment_status = "success";
    await data.save();
    const Payment_ID = await fetchPaymentId(data?.session_id, srNo, "success");
    res.status(200).json({
      message: `Payment status updated`,
      status: true,
      data: data,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    logger.error("Error updating booking status:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
});


exports.PaymentCancel = catchAsync(async (req, res) => {
  try {
    const { srNo } = req.params;
    if (!srNo) {
      return res.status(400).json({
        message: "srNo is required.",
        status: false,
      });
    }
    const data = await StripePayment.findOne({ srNo: srNo });
    if (!data) {
      return res.status(404).json({
        message: "Data not found",
        status: false,
      });
    }
    data.payment_status = "failed";
    await data.save();
    fetchPaymentId(data?.session_id, srNo, "cancel");
    res.status(200).json({
      message: `Payment status updated`,
      status: true,
      data: data,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    logger.error("Error updating booking status:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
});

