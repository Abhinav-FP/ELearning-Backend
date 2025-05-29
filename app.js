const dotenv = require("dotenv");
dotenv.config();
const stripe   = require("./utils/stripe")
require("./dbconfigration");
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require("cors");
const cron = require("node-cron");
const StripePayment = require("./model/StripePayment");
const TeacherAvailability = require("./model/TeacherAvailability");
const Bookings = require("./model/booking");
const User = require("./model/user");
const { DateTime } = require("luxon");
const BookingSuccess = require("./EmailTemplate/BookingSuccess");
const sendEmail = require("./utils/EmailMailler");
const  axios = require("axios");
const corsOptions = {
  origin: "*", // Allowed origins
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: '*', // Allow all headers
  credentials: true,
  optionsSuccessStatus: 200, // for legacy browsers
}
app.use(cors(corsOptions));

//stripe Webhook
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log("Headers received:", req.headers);
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Webhook event received: ${event.type}`);

  // Handle event
  switch (event.type) {
    case 'charge.succeeded': {
      const charge = event.data.object;
      console.log(`💰 Charge succeeded for amount: ${charge.amount}`);
      // You can save payment to DB or update user status here
      break;
    }

    case 'charge.failed': {
      const charge = event.data.object;
      console.log(`❌ Charge failed: ${charge.failure_message}`);
      // You can notify user or log failure
      break;
    }

    case 'payment_intent.created': {
      const pi = event.data.object;
      console.log(`🕐 PaymentIntent created: ${pi.id}`);
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      console.log(`❌ PaymentIntent failed: ${pi.last_payment_error?.message}`);
      break;
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      console.log(`✅ PaymentIntent succeeded for amount: ${pi.amount}`);
      const metadata = pi.metadata;

      console.log(`✅ PaymentIntent succeeded for amount: ${pi.amount}`);
      console.log("📦 Metadata:", metadata);

      // Convert times to UTC
      const startUTC = DateTime.fromISO(metadata.startDateTime, { zone: metadata.timezone }).toUTC().toJSDate();
      const endUTC = DateTime.fromISO(metadata.endDateTime, { zone: metadata.timezone }).toUTC().toJSDate();
      // Save payment record
      const payment = new StripePayment({
        srNo: parseInt(metadata.srNo),
        payment_type: "card",
        payment_id: pi.id,
        currency: pi.currency,
        LessonId: metadata.LessonId,
        amount: pi.amount / 100,
        UserId: metadata.userId,
        payment_status: pi.status
      });
      const savedPayment = await payment.save();
      console.log("savedPayment", savedPayment)
      const teacherEarning = (pi.amount / 100) - metadata.adminCommission;
      // Save booking record
      const booking = new Bookings({
        teacherId: metadata.teacherId,
        UserId: metadata.userId,
        teacherEarning,
        adminCommission: metadata.adminCommission,
        LessonId: metadata.LessonId,
        StripepaymentId: savedPayment._id,
        startDateTime: startUTC,
        endDateTime: endUTC,
        currency: pi.currency,
        totalAmount: pi.amount / 100,
        srNo: parseInt(metadata.srNo),
        notes: metadata.notes || ""
      });

      const record = await booking.save();

      console.log("record", record)
      // Send confirmation email
      const user = await User.findById(metadata.userId);
      const registrationSubject = "Booking Confirmed 🎉";
      const emailHtml = BookingSuccess(startUTC, user.name);
      await sendEmail({
        email: metadata.email,
        subject: registrationSubject,
        emailHtml
      });
      console.log("Success Payment")
      // Mark order as paid, send email, grant access, etc.
      break;
    }

    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

//paypal Webhook 
// app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// app.post("/api/paypal/webhook", async (req, res) => {
//   const webhookId = process.env.PAYPAL_WEBHOOK_ID;

//   const transmissionId = req.headers["paypal-transmission-id"];
//   const timestamp = req.headers["paypal-transmission-time"];
//   const certUrl = req.headers["paypal-cert-url"];
//   const authAlgo = req.headers["paypal-auth-algo"];
//   const transmissionSig = req.headers["paypal-transmission-sig"];
//   const webhookEvent = req.body;

//   try {
//     const accessToken = await getPayPalAccessToken();

//     const response = await axios.post(
//       "https://api.sandbox.paypal.com/v1/notifications/verify-webhook-signature",
//       {
//         auth_algo: authAlgo,
//         cert_url: certUrl,
//         transmission_id: transmissionId,
//         transmission_sig: transmissionSig,
//         transmission_time: timestamp,
//         webhook_id: webhookId,
//         webhook_event: webhookEvent,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${accessToken}`,
//         },
//       }
//     );

//     const verificationStatus = response.data.verification_status;

//     if (verificationStatus === "SUCCESS") {
//       console.log("✅ Webhook verified:", webhookEvent.event_type);
//       return res.status(200).json({ success: true, event: webhookEvent.event_type });
//     } else {
//       console.warn("❌ Webhook verification failed.");
//       return res.status(400).json({ success: false, message: "Webhook verification failed" });
//     }

//   } catch (error) {
//     console.log("error" ,error)
//     console.error("⚠️ Error verifying webhook:", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Error verifying PayPal webhook",
//       error: error.message,
//     });
//   }
// });

// async function getPayPalAccessToken() {
//   const clientId = process.env.PAYPAL_CLIENT_ID;
//   const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
//   const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

//   const response = await axios.post(
//     "https://api.sandbox.paypal.com/v1/oauth2/token",
//     "grant_type=client_credentials",
//     {
//       headers: {
//         Authorization: `Basic ${auth}`,
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//     }
//   );

//   return response.data.access_token;
// }

app.use(express.json({ limit: '2000mb' }));
app.use(express.urlencoded({ extended: true, limit: "2000mb" }));

const PORT = process.env.REACT_APP_SERVER_DOMAIN || 5000;


app.use("/api", require("./route/userRoutes"));
app.use("/api", require("./route/messageRoutes"));
app.use("/api", require("./route/wishlistRoutes"));
app.use("/api", require("./route/lessonRoutes"));
app.use("/api", require("./route/homeRoutes"));
app.use("/api", require("./route/reviewroute"));
app.use("/api", require("./route/studentRoutes"));
app.use("/api", require("./route/adminRoutes"));
app.use("/api", require("./route/bookingRoutes"));
app.use("/api", require("./route/teacherRoutes"));
app.use("/api/payment", require("./route/paymentRoutes"));

app.get("/", (req, res) => {
  res.json({
    msg: 'Hello World',
    status: 200,
  });
});

// cron.schedule('*/1 * * * *', async () => {
//   try{
//     console.log(`Running cron job at ${new Date()}`);
//   }catch(error){
//     console.log("Error in cron job", error);
//   }
// });

// Cron job running at 1 am daily for deleting old availability entries
cron.schedule('0 1 * * *', async () => {
// cron.schedule('*/1 * * * *', async () => {
  try {
    console.log(`🕐 Running availability cleanup at ${new Date().toISOString()}`);

    // Always base calculations on UTC
    const nowUtc = new Date();
    const yesterdayEndUtc = new Date(Date.UTC(
      nowUtc.getUTCFullYear(),
      nowUtc.getUTCMonth(),
      nowUtc.getUTCDate() - 1,
      23, 59, 59, 999
    ));

    const result = await TeacherAvailability.deleteMany({
      startDateTime: { $lte: yesterdayEndUtc },
      endDateTime: { $lte: yesterdayEndUtc }
    });
    console.log(`✅ Deleted ${result.deletedCount} outdated availability entries.`);
  } catch (error) {
    console.error('❌ Error in availability cleanup cron job:', error);
  }
});

const server = app.listen(PORT, () => console.log("Server is running at port : " + PORT));
server.timeout = 360000; // 6 minutes