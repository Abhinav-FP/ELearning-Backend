const stripe = require('../utils/stripe');
const catchAsync = require("../utils/catchAsync");
const axios = require("axios");
const qs = require('qs');
const Payment = require("../model/PaypalPayment");
const StripePayment = require("../model/StripePayment");
const Bookings = require("../model/booking");
const Lesson = require("../model/lesson");
const BulkLessons = require("../model/bulkLesson");
const { DateTime } = require("luxon");
const BookingSuccess = require("../EmailTemplate/BookingSuccess");
const BulkEmail = require("../EmailTemplate/BulkLesson");
const TeacherBooking = require("../EmailTemplate/TeacherBooking");
const sendEmail = require("../utils/EmailMailler");
const User = require("../model/user");
const SpecialSlot = require("../model/SpecialSlot");
const mongoose = require("mongoose");
const Bonus = require('../model/Bonus');
const logger = require("../utils/Logger");

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
    logger.error(`PayPal Token Error: ${JSON.stringify(error.response?.data || error.message || 'Unknown error')}`);
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
    logger.info("Paypal order create route ran successfully");
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error in createOrder controller:', error);
    logger.error(`Error in createOrder controller:, ${JSON.stringify(error || 'Unknown error')}`);
    res.status(500).json({ error: error || 'Failed to create PayPal order' });
  }
}
);

// Bulk booking iss function ke through hoti hai
async function handleBulkBooking(data) {
  try {
    // console.log("Bulk booking called with data:", data);
    const { orderID, teacherId, LessonId, totalAmount, adminCommission, email, processingFee, multipleLessons, UserId, req, res } = data;
    // Saving the payment details
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
      amount: captureData.purchase_units[0].payments.captures[0].amount.value,
      currency: captureData.purchase_units[0].payments.captures[0].amount.currency_code,
    });
    const savedPayment = await newPayment.save();
    logger.info(`PayPal payment saved for bulk lesson, paymentId: ${JSON.stringify(savedPayment || "")}`);

    // Bulk lesson record creation
    const bulkLesson = new BulkLessons({
      teacherId,
      UserId,
      LessonId,
      paypalpaymentId: savedPayment?._id,
      StripepaymentId: null,
      totalAmount,
      teacherEarning: (totalAmount - processingFee) * 0.90 || 0,
      adminCommission,
      processingFee,
      totalLessons: multipleLessons,
      lessonsRemaining: multipleLessons,
    });
    const savedBulkLesson = await bulkLesson.save();
    logger.info(`Bulk lesson record created: ${JSON.stringify(savedBulkLesson || "")}`);

    const user = await User.findById({ _id: UserId });
    const teacher = await User.findById({ _id: teacherId });
    const lesson = await Lesson.findById(LessonId);
    const Username = user?.name;
    const emailHtml = BulkEmail(Username , multipleLessons, teacher?.name, lesson?.title);
    const subject = "Bulk Lesson Purchase is Successful! 🎉";
    logger.info(`Paypal sending bulk email to student at  ${email}`);
    await sendEmail({
      email: email,
      subject: subject,
      emailHtml: emailHtml,
    });
    res.status(200).json(savedPayment);
  } catch (err) {
    console.error("Bulk booking handler error:", err);
    return data.res.status(500).json({
      status: false,
      error: err.message || "Bulk handler failed"
    });
  }
}

exports.PaymentcaptureOrder = catchAsync(async (req, res) => {
  try {
    const UserId = req.user.id;
    const { orderID, teacherId, startDateTime, endDateTime, LessonId, timezone, totalAmount, adminCommission, email,
      isSpecialSlot, processingFee, isBulk, multipleLessons } = req.body;
    
    // Bulk booking handling
    if (isBulk) {
      return handleBulkBooking({
        ...req.body,        
        UserId,             
        req,                
        res                 
      });
    }

    let startUTCs, endUTCs;
    if (isSpecialSlot) {
      logger.info(`Special slot PayPal booking request body: ${JSON.stringify(req.body || "")}`);
      logger.info(`Special slot PayPal booking: userId:", UserId, email: ${email}, teacherId: ${teacherId}`);
      startUTCs =  new Date(startDateTime);
      endUTCs =  new Date(endDateTime);
    }
    else {
      startUTCs = DateTime.fromISO(startDateTime, { zone: timezone }).toUTC().toJSDate();
      endUTCs = DateTime.fromISO(endDateTime, { zone: timezone }).toUTC().toJSDate();
    }

     // ✅ Get current UTC time
    const nowUTC = new Date();

    // ✅ Check if slot is in the past or less than 10 minutes from now
    const timeDiffInMs = startUTCs - nowUTC;
    const timeDiffInMinutes = timeDiffInMs / (1000 * 60);
    if (timeDiffInMinutes < 10) {
      return res.status(400).json({
        status: false,
        error: "Cannot create a booking which starts in less than 10 minutes from now or is in the past"
      });
    }

    // Check for booking conflict for the same teacher
    const existingBooking = await Bookings.findOne({
      teacherId: new mongoose.Types.ObjectId(teacherId),
      cancelled: false, // Only consider active bookings
      startDateTime: { $lt: endUTCs },
      endDateTime: { $gt: startUTCs },
    });
    if (existingBooking) {
      return res.status(400).json({
        status: false,
        error: "Booking already exists at the given slot for this teacher.",
      });
    }

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
     logger.info(`PayPal payment saved, paymentId: ${JSON.stringify(savedPayment || "")}`);
    let startUTC, endUTC;
    if (isSpecialSlot) {
      startUTC = new Date(startDateTime);
      endUTC = new Date(endDateTime);
    } else {
      startUTC = DateTime.fromISO(startDateTime, { zone: timezone }).toUTC().toJSDate();
      endUTC = DateTime.fromISO(endDateTime, { zone: timezone }).toUTC().toJSDate();
    }
    const teacherEarning = (totalAmount - processingFee) * 0.90; // 90% to teacher, 10% to admin as discussed with client
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
      processingFee,
    });
    const record = await Bookingsave.save();

    // Updating Special Slot
    if (isSpecialSlot) {
      const studentId = new mongoose.Types.ObjectId(UserId);
      const lessonId = new mongoose.Types.ObjectId(LessonId);
      const updatedSlot = await SpecialSlot.findOneAndUpdate(
        {
          student: studentId,
          lesson: lessonId,
          startDateTime: startUTC,
        },
        { paymentStatus: "paid" },
        { new: true, runValidators: true }
      );
      if (updatedSlot) {
        await Bookings.findByIdAndUpdate(record._id, {
          specialSlotId: updatedSlot._id,
        });
      }
    }


    const user = await User.findById({ _id: req.user.id });
    const teacher = await User.findById({ _id: teacherId });
    logger.info("Paypal Everything done now about to send email");
    logger.info(`Teacher details: ${JSON.stringify(teacher || "")}`);
    // Send confirmation email to student
    const registrationSubject = "Booking Confirmed 🎉";
    const Username = user?.name;

    // Convert to ISO format for moment parsing in email templates
    const utcDateTime = DateTime.fromJSDate(new Date(startUTC), { zone: "utc" });
    
    const userTimeISO = user?.time_zone
        ? utcDateTime.setZone(user.time_zone).toISO()
        : utcDateTime.toISO();

      const teacherTimeISO = teacher?.time_zone
        ? utcDateTime.setZone(teacher.time_zone).toISO()
        : utcDateTime.toISO();
      
    const emailHtml = BookingSuccess(userTimeISO , Username, teacher?.name);
    logger.info(`Paypal sending email to student at  ${email}`);
    await sendEmail({
      email: email,
      subject: registrationSubject,
      emailHtml: emailHtml,
    });

    // Send Confirmation email to teacher
    const TeacherSubject = "New Booking 🎉";
    const TeacheremailHtml = TeacherBooking(teacherTimeISO, Username, teacher?.name);
    logger.info(`Paypal sending email to teacher at: ${teacher?.email}`);
    await sendEmail({
      email: teacher.email,
      subject: TeacherSubject,
      emailHtml: TeacheremailHtml,
    });
    logger.info("Paypal order created route ran successfully");
    res.status(200).json(savedPayment);
  } catch (error) {
    console.error(" Error capturing PayPal order:", error?.response?.data || error.message);
    logger.error(`Error capturing PayPal order: ${JSON.stringify(error?.response?.data || error.message || 'Unknown error')}`);
    res.status(500).json({ error: error || "Failed to capture and save PayPal order" });
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
    logger.error(`Error saving cancelled order: ${JSON.stringify(error || 'Unknown error')}`);
    res.status(500).json({ error: error || "Failed to cancel order" });
  }
}
);

// For Tips  teacher given  by student 
exports.PaymentcaptureTipsOrder = catchAsync(async (req, res) => {
  try {
    const UserId = req.user.id;
    const { orderID, teacherId, LessonId, totalAmount, IsBonus, BookingId } = req.body;
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
      IsBonus: IsBonus,
    });

    const savedPayment = await newPayment.save();
    const record = await Bonus.create({
      userId: UserId,
      teacherId,
      LessonId,
      bookingId: BookingId,
      amount: totalAmount,
      currency: "USD",
      paypalpaymentId: savedPayment?._id,
    });


    const BookingData = await Bookings.findOneAndUpdate(
      { _id: BookingId },
      {
        IsBonus: true,
        BonusId: record._id,
      },
      { new: true }
    );
    res.status(200).json(savedPayment);
  } catch (error) {
    console.error(" Error capturing PayPal order:", error?.response?.data || error.message);
    logger.error(`Error capturing PayPal order: ${JSON.stringify(error?.response?.data || error.message || 'Unknown error')}`);
    res.status(500).json({ error: "Failed to capture and save PayPal order" });
  }
});

exports.PaymentCreate = catchAsync(async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, LessonId, currency, teacherId, startDateTime, 
      endDateTime, timezone, adminCommission, email, isSpecial, 
      IsBonus, BookingId, processingFee, isBulk, multipleLessons
    } = req?.body;
    // console.log("req?.body", req?.body)

    // Checking if the booking with the same slot already exists
    let startUTC, endUTC;
    if(!isBulk){
    if (isSpecial) {
      startUTC = new Date(startDateTime);
      endUTC = new Date(endDateTime);
    }
    else {
      startUTC = DateTime.fromISO(startDateTime, { zone: timezone }).toUTC().toJSDate();
      endUTC = DateTime.fromISO(endDateTime, { zone: timezone }).toUTC().toJSDate();
    }

    // ✅ Get current UTC time
    const nowUTC = new Date();

    // ✅ Check if slot is in the past or less than 10 minutes from now
    const timeDiffInMs = startUTC - nowUTC;
    const timeDiffInMinutes = timeDiffInMs / (1000 * 60);
    if (timeDiffInMinutes < 10) {
      return res.status(400).json({
        status: false,
        error: "Cannot select a slot that starts in less than 10 minutes or is in the past"
      });
    }

    // Check for booking conflict for the same teacher
    const existingBooking = await Bookings.findOne({
      teacherId: new mongoose.Types.ObjectId(teacherId),
      cancelled: false, // Only consider active bookings
      startDateTime: { $lt: endUTC },
      endDateTime: { $gt: startUTC },
    });

    if (existingBooking) {
      return res.status(400).json({
        status: false,
        error: "Booking already exists at the given slot for this teacher.",
      });
    }    
    }
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
        srNo: srNo.toString(),
        isSpecial,
        BookingId,
        IsBonus,
        processingFee,
        isBulk, 
        multipleLessons
      }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    logger.error(`Error creating payment intent: ${JSON.stringify(error || 'Unknown error')}`);
    res.status(500).json({ error: error || 'Internal Server Error' });
  }
});






// Stripe Checkout Sytem 
// const fetchPaymentId = async (sessionId, srNo) => {
//   try {
//     const session = await stripe.checkout.sessions.retrieve(sessionId);
//     const paymentId = session.payment_intent;
//     if (!srNo) {
//       return;
//     }
//     const data = await StripePayment.findOne({ srNo: srNo });
//     if (!data) {
//       return null;
//     }
//     data.payment_id = paymentId;
//     await data.save();
//     return paymentId;
//   } catch (error) {
//     console.error("Error fetching payment ID:", error);
//     logger.error("Error fetching payment ID:", error);
//     return null;
//   }
// };


// exports.createCheckout = catchAsync(async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { amount, LessonId, currency, teacherId, startDateTime, endDateTime, timezone, adminCommission, email } = req?.body;
//     const lastpayment = await StripePayment.findOne().sort({ srNo: -1 });
//     const srNo = lastpayment ? lastpayment.srNo + 1 : 1;
//     const amountInCents = Math.round(amount * 100);
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       mode: 'payment', // Correct mode value
//       // success_url: `${process.env.stripe_link}/stripe/success/${srNo}`,
//       success_url: `https://japaneseforme.com/stripe/success/${srNo}`,
//       // cancel_url: `${process.env.stripe_link}/stripe/cancel/${srNo}`,
//       cancel_url: `https://japaneseforme.com/stripe/cancel/${srNo}`,
//       submit_type: "pay",
//       customer_email: email || "ankitjain@gmail.com",
//       billing_address_collection: "auto",
//       line_items: [
//         {
//           price_data: {
//             currency: currency,
//             product_data: {
//               name: "Booking Payment",
//             },
//             unit_amount: amountInCents,
//           },
//           quantity: 1,
//         },
//       ],
//     });


//     const newPayment = new StripePayment({
//       srNo,
//       payment_type: "card",
//       payment_id: null,
//       session_id: session?.id,
//       currency,
//       LessonId,
//       amount,
//       srNo,
//       UserId: userId
//     });
//     const record = await newPayment.save();

//     // Convert times from user's timezone to UTC
//     const startUTC = DateTime.fromISO(startDateTime, { zone: timezone }).toUTC().toJSDate();
//     const endUTC = DateTime.fromISO(endDateTime, { zone: timezone }).toUTC().toJSDate();

//     const teacherEarning = amount - adminCommission;
//     const Bookingsave = new Bookings({
//       teacherId,
//       UserId: userId,
//       teacherEarning,
//       adminCommission,
//       LessonId,
//       StripepaymentId: record?._id,
//       startDateTime: startUTC,
//       endDateTime: endUTC,
//       currency,
//       totalAmount: amount,
//       srNo
//     });
//     await Bookingsave.save();
//     const user = await User.findById({ _id: req.user.id });
//     const registrationSubject = "Booking Confirmed 🎉";
//     const Username = user.name
//     const emailHtml = BookingSuccess(startUTC, Username);
//     await sendEmail({
//       email: email,
//       subject: registrationSubject,
//       emailHtml: emailHtml,
//     });
//     res.status(200).json({ url: session.url, status: "true" });
//   } catch (err) {
//     res.status(err.statusCode || 500).json({ error: err.message });
//   }
// });


// exports.PaymentSuccess = catchAsync(async (req, res) => {
//   try {
//     const { srNo } = req.params;
//     if (!srNo) {
//       return res.status(400).json({
//         message: "srNo is required.",
//         status: false,
//       });
//     }
//     const data = await StripePayment.findOne({ srNo: srNo });
//     if (!data) {
//       return res.status(404).json({
//         message: "Data not found",
//         status: false,
//       });
//     }
//     data.payment_status = "success";
//     await data.save();
//     const Payment_ID = await fetchPaymentId(data?.session_id, srNo, "success");
//     res.status(200).json({
//       message: `Payment status updated`,
//       status: true,
//       data: data,
//     });
//   } catch (error) {
//     console.error("Error updating booking status:", error);
//     logger.error("Error updating booking status:", error);
//     res.status(500).json({
//       message: "Internal Server Error",
//       status: false,
//     });
//   }
// });


// exports.PaymentCancel = catchAsync(async (req, res) => {
//   try {
//     const { srNo } = req.params;
//     if (!srNo) {
//       return res.status(400).json({
//         message: "srNo is required.",
//         status: false,
//       });
//     }
//     const data = await StripePayment.findOne({ srNo: srNo });
//     if (!data) {
//       return res.status(404).json({
//         message: "Data not found",
//         status: false,
//       });
//     }
//     data.payment_status = "failed";
//     await data.save();
//     fetchPaymentId(data?.session_id, srNo, "cancel");
//     res.status(200).json({
//       message: `Payment status updated`,
//       status: true,
//       data: data,
//     });
//   } catch (error) {
//     console.error("Error updating booking status:", error);
//     logger.error("Error updating booking status:", error);
//     res.status(500).json({
//       message: "Internal Server Error",
//       status: false,
//     });
//   }
// });


// exports.createpayment = async (req, res) => {
//   try {
//     const { amount = 2000, currency = 'usd' } = req.body;
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount,
//       currency,
//       metadata: req.body.metadata || {},
//     });
//     console.log("paymentIntent", paymentIntent)
//     return res.json({ clientSecret: paymentIntent.client_secret });;
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: err.message });
//   }
// }
