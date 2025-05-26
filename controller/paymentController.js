const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_TEST_KEY);
const catchAsync = require("../utils/catchAsync");
const axios = require("axios");
const qs = require('qs');
const Payment = require("../model/PaypalPayment");
const StripePayment = require("../model/StripePayment");
const Bookings = require("../model/booking");
const Teacher = require("../model/teacher");
const logger = require("../utils/Logger");
const { DateTime } = require("luxon");
const BookingSuccess = require("../EmailTemplate/BookingSuccess");
const sendEmail = require("../utils/EmailMailler");
const User = require("../model/user");

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

exports.createOrder = catchAsync(async (req, res) => {
  try {
    const { amount, currency, } = req.body
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
    const UserId = req.user.id;
    console.log("req.body", req.body)
    const { orderID, teacherId, startDateTime, endDateTime, LessonId, timezone, totalAmount, adminCommission, email } = req.body;
    const accessToken = await generateAccessToken();
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

    // Convert times from user's timezone to UTC
    const startUTC = DateTime.fromISO(startDateTime, { zone: timezone }).toUTC().toJSDate();
    const endUTC = DateTime.fromISO(endDateTime, { zone: timezone }).toUTC().toJSDate();

    console.log("startUTC", startUTC)
    console.log("endUTC", endUTC)
    const teacherEarning = totalAmount - adminCommission;
    const Bookingsave = new Bookings({
      teacherId,
      totalAmount,
      adminCommission,
      teacherEarning,
      UserId: UserId,
      LessonId,
      paypalpaymentId: savedPayment?._id,
      startDateTime: startUTC,
      endDateTime: endUTC,
    });
    await Bookingsave.save();

    const user = await User.findById({ _id: req.user.id });
    const teacher = await User.findById({ _id: teacherId });
    console.log("UserId:", user);

    const registrationSubject = "Booking Confirmed 🎉";
    const Username = user.name
    const emailHtml = BookingSuccess(startDateTime, Username, teacher?.name);
    await sendEmail({
      email: email,
      subject: registrationSubject,
      emailHtml: emailHtml,
    });

    res.status(200).json(savedPayment);
  } catch (error) {
    console.error(" Error capturing PayPal order:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to capture and save PayPal order" });
  }
});


exports.PaymentcancelOrder = catchAsync(async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderID, LessonId } = req.body;

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
      logger.wran("voidResponse", voidResponse)
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
      UserId: userId || undefined,
    });

    const record = await newPayment.save();
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
    const userId = req.user.id;
    const { amount, LessonId, currency, teacherId, startDateTime, endDateTime, timezone, adminCommission, email } = req?.body;
    const lastpayment = await StripePayment.findOne().sort({ srNo: -1 });
    const srNo = lastpayment ? lastpayment.srNo + 1 : 1;
    const amountInCents = Math.round(amount * 100);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // Correct mode value
      // success_url: `${process.env.stripe_link}/stripe/success/${srNo}`,
      success_url: `https://japaneseforme.com/stripe/success/${srNo}`,
      // cancel_url: `${process.env.stripe_link}/stripe/cancel/${srNo}`,
      cancel_url: `https://japaneseforme.com/stripe/cancel/${srNo}`,
      submit_type: "pay",
      customer_email: email || "ankitjain@gmail.com",
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
      LessonId,
      amount,
      srNo,
      UserId: userId
    });
    const record = await newPayment.save();

    // Convert times from user's timezone to UTC
    const startUTC = DateTime.fromISO(startDateTime, { zone: timezone }).toUTC().toJSDate();
    const endUTC = DateTime.fromISO(endDateTime, { zone: timezone }).toUTC().toJSDate();

    const teacherEarning = amount - adminCommission;
    const Bookingsave = new Bookings({
      teacherId,
      UserId: userId,
      teacherEarning,
      adminCommission,
      LessonId,
      StripepaymentId: record?._id,
      startDateTime: startUTC,
      endDateTime: endUTC,
      currency,
      totalAmount: amount,
      srNo
    });
    await Bookingsave.save();
    const user = await User.findById({ _id: req.user.id });
    const registrationSubject = "Booking Confirmed 🎉";
    const Username = user.name
    const emailHtml = BookingSuccess(startUTC, Username);
    await sendEmail({
      email: email,
      subject: registrationSubject,
      emailHtml: emailHtml,
    });
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


exports.createpayment = async (req, res) => {
  try {
    const { amount = 2000, currency = 'usd' } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: req.body.metadata || {},
    });
    console.log("paymentIntent", paymentIntent)
    return res.json({ clientSecret: paymentIntent.client_secret });;
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}


exports.PaymentCreate = catchAsync(async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("UserId", userId)
    console.log("req?.body", req?.body)
    const { amount, LessonId, currency, teacherId, startDateTime, endDateTime, timezone, adminCommission, email } = req?.body;
    const lastpayment = await StripePayment.findOne().sort({ srNo: -1 });
    const srNo = lastpayment ? lastpayment.srNo + 1 : 1;
    const amountInCents = Math.round(amount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      payment_method_types: ['card'],
      metadata: {
        userId,
        LessonId,
        teacherId,
        startDateTime,
        endDateTime,
        timezone,
        adminCommission,
        email,
        amount,
        currency,
        srNo: srNo.toString()
      }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




