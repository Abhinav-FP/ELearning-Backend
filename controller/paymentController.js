const catchAsync = require("../utils/catchAsync");
const axios = require("axios");
const qs = require('qs');
const Loggers = require("../utils/Logger");
const Payment = require("../model/Payment");


const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const paypalApiUrl = process.env.PAYPAL_API;

const generateAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString('base64');
    console.log("auth", auth);
    console.log("PAYPAL_API", clientId, clientSecret, paypalApiUrl);

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
    console.error("❌ PayPal Token Error:", error.response?.data || error.message);
    throw new Error("Failed to generate PayPal access token");
  }
};


exports.createOrder = async (req, res) => {
  try {
    const accessToken = await generateAccessToken();
    const paypalApiUrl = process.env.PAYPAL_API;

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: '10.00',
          },
        },
      ],
      application_context: {
        return_url: `${process.env.PAYPAL_REDIRECT_BASE_URL}/complete-payment`,
        cancel_url: `${process.env.PAYPAL_REDIRECT_BASE_URL}/cancel-payment`,
      },
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
    console.log("✅ PayPal Create Order Response:", response.data);
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error in createOrder controller:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
};
exports.PaymentcaptureOrder = async (req, res) => {
  try {
    const accessToken = await generateAccessToken();
    const { orderID } = req.body;

    console.log("paymentId", orderID);
    console.log("accessToken", accessToken);

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
    console.log("Captured Payment Data:", captureData);

    try {
      const newPayment = new Payment({
        orderId: captureData.id,
        status: captureData.status,
        paymentSource: captureData.payment_source,
        purchaseUnits: captureData.purchase_units,
        payer: captureData.payer,
      });

      const savedPayment = await newPayment.save();
      console.log("Payment saved to database:", savedPayment);
      res.status(200).json(captureData);
    } catch (dbError) {
      console.error("Error saving payment to database:", dbError);
      res.status(200).json(captureData);
    }

  } catch (error) {
    console.error('Error capturing payment:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to capture PayPal order' });
  }
};
