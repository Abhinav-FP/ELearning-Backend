const dotenv = require("dotenv");
dotenv.config();
const stripe = require("./utils/stripe")
require("./dbconfigration");
const express = require("express");
const app = express();
const cors = require("cors");
const StripePayment = require("./model/StripePayment");
const Bookings = require("./model/booking");
const Zoom = require("./model/Zoom");
const crypto = require("crypto");
const User = require("./model/user");
const SpecialSlot = require("./model/SpecialSlot");
const { DateTime } = require("luxon");
const BookingSuccess = require("./EmailTemplate/BookingSuccess");
const TeacherBooking = require("./EmailTemplate/TeacherBooking");
const sendEmail = require("./utils/EmailMailler");

const cron = require("node-cron");
const fetch = require('node-fetch');
const mongoose = require("mongoose");
const Teacher = require("./model/teacher");
const { updateCurrencyRatesJob } = require("./controller/currencycontroller");
const TeacherAvailability = require("./model/TeacherAvailability");
const paypalCommon = require("./utils/Paypalcommon")
const currency = require("./EmailTemplate/currency");
const bodyParser = require("body-parser");
const { default: axios } = require("axios");
const createZoomMeeting = require("./zoommeeting");
const webhookID = process.env.PAYPAL_WEBHOOK_ID;
const verifyURL = process.env.PAYPAL_VERIFY_URL;
const logger = require("./utils/Logger");
const { uploadFileToSpaces } = require("./utils/FileUploader");


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
    return res.status(400).json(`Webhook Error: ${err.message}`);
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
      let startUTC, endUTC;
      // Convert times to UTC
      console.log("metadata", metadata);
      if (metadata?.isSpecial) {
        startUTC = metadata.startDateTime;
        endUTC = metadata.endDateTime;
      }
      else {
        startUTC = DateTime.fromISO(metadata.startDateTime, { zone: metadata.timezone }).toUTC().toJSDate();
        endUTC = DateTime.fromISO(metadata.endDateTime, { zone: metadata.timezone }).toUTC().toJSDate();
      }
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
      console.log("record", record);

      // Updating Specialslot
      if (metadata?.isSpecial) {
        const studentId = new mongoose.Types.ObjectId(metadata.userId);
        const lessonId = new mongoose.Types.ObjectId(metadata.LessonId);
        const updatedSlot = await SpecialSlot.findOneAndUpdate(
          {
            student: studentId,
            lesson: lessonId,
            startDateTime: startUTC,
          },
          { paymentStatus: "paid" },
          { new: true, runValidators: true }
        );
        console.log("Speial Slot updated", updatedSlot);
      }

      // Send confirmation email to student
      const user = await User.findById(metadata.userId);
      const teacher = await User.findById(metadata.teacherId);
      const registrationSubject = "Booking Confirmed 🎉";
      const emailHtml = BookingSuccess(startUTC, user?.name, teacher?.name);
      await sendEmail({
        email: metadata.email,
        subject: registrationSubject,
        emailHtml
      });

      // Send Confirmation email to teacher
      const TeacherSubject = "New Booking 🎉";
      const TeacheremailHtml = TeacherBooking(startUTC, user?.name, teacher?.name);
      await sendEmail({
        email: teacher.email,
        subject: TeacherSubject,
        emailHtml: TeacheremailHtml
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
// app.post('/api/paypal/webhook', bodyParser.json(), async (req, res) => {
//   const payload = req.body;
//   const transmissionID = req.headers['paypal-transmission-id'];
//   const transmissionTime = req.headers['paypal-transmission-time'];
//   const certURL = req.headers['paypal-cert-url'];
//   const authAlgo = req.headers['paypal-auth-algo'];
//   const transmissionSig = req.headers['paypal-transmission-sig'];
//   let accessToken;

//   const body = {
//     webhook_id: webhookID,
//     transmission_id: transmissionID,
//     transmission_time: transmissionTime,
//     cert_url: certURL,
//     auth_algo: authAlgo,
//     transmission_sig: transmissionSig,
//     webhook_event: payload,
//   };

//   if (!webhookID || !verifyURL) {
//     const errorParams =
//       'Paypal Webhook Error: webhookID or verifyURL was found to be empty';
//     console.error(errorParams);
//     return res.status(400).json(errorParams);
//   }

//   try {
//     accessToken = await paypalCommon.generateAccessToken();
//   } catch (err) {
//     const errorConstructEvent = 'Paypal Webhook Error in generateAccessToken: ';
//     console.error(errorConstructEvent, err.message);
//     return res.status(400).json(`${errorConstructEvent} ${err.message}`);
//   }

//   try {
//     // let Paypal verify if this payload was actually sent by them
//     let response = await axios(verifyURL, {
//       method: 'POST',
//       body: JSON.stringify(body),
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${accessToken}`,
//       },
//     });
//     let responseJson = await response.json();
//     if (responseJson.verification_status !== 'SUCCESS') {
//       const errorConstructEvent =
//         'Paypal Webhook Error, payload verification failure.';
//       console.error(errorConstructEvent);
//       return res.status(400).json(errorConstructEvent);
//     }
//   } catch (err) {
//     const errorConstructEvent = 'Paypal Webhook Error in verify: ';
//     console.error(errorConstructEvent, err.message);
//     return res.status(400).json(`${errorConstructEvent} ${err.message}`);
//   }

//   if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
//     // Your business logic here
//   }

//   res.status(200).json();
// });

// app.post('/api/payment/save', async (req, res) => {
//   console.log("req.body" ,req.body)
//   const {  amount, payer, status ,orderID } = req.body;

//   try {
//     console.log('Received payment from:', payer?.email_address);
//     console.log('Amount:', amount, 'Status:', status, );
//     return res.status(200).json({ message: 'Payment saved successfully' });
//   } catch (err) {
//     console.error('Error saving payment:', err.message);
//     return res.status(500).json({ error: 'Failed to save payment' });
//   }
// });

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

const ZOOM_WEBHOOK_SECRET = process.env.ZOOM_WEBHOOK_SECRET;
const ZOOM_CLIENT_ID = process.env.ZOOM_clientId;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_clientSecret;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_accountId;

// Helper: Get Zoom OAuth token
async function getZoomAccessToken() {
  const base64 = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");
  const res = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    {},
    {
      headers: { Authorization: `Basic ${base64}` },
    }
  );
  return res.data.access_token;
}

// Map to track empty meetings
const emptyMeetingTimeouts = new Map();

app.post("/zoom-webhook", async (req, res) => {
  console.log("Zoom webhook received", req.body);
  logger.info("Zoom webhook received", req.body);
  const event = req.body.event;

  // Step 1: Validate Zoom endpoint
  if (event === "endpoint.url_validation") {
    const plainToken = req.body.payload.plainToken;
    const encryptedToken = crypto.createHmac("sha256", ZOOM_WEBHOOK_SECRET)
      .update(plainToken)
      .digest("hex");
    return res.status(200).json({ plainToken, encryptedToken });
  }

  // Recording complete route
  if (event === "recording.completed") {
    logger.info("Recording completed event received");
    console.log("Recording completed event received");
    const recordingObject = req.body.payload.object;
    const meetingId = recordingObject.id;
    const files = recordingObject.recording_files || [];

    try {
      const accessToken = await getZoomAccessToken();
      const uploadedUrls = [];

      for (const file of files) {
        if (!file.download_url) continue;

        const downloadUrl = `${file.download_url}?access_token=${accessToken}`;
        const response = await axios.get(downloadUrl, {
          responseType: "arraybuffer",
        });

        const fileBuffer = response.data;
        const fileMime = file.file_type === "M4A"
          ? "audio/m4a"
          : file.file_type === "MP4"
            ? "video/mp4"
            : "application/octet-stream";

        const fileName = `recording-${meetingId}-${file.id}.${file.file_type.toLowerCase()}`;

        // Upload to DO Spaces
        const url = await uploadFileToSpaces({
          originalname: fileName,
          buffer: fileBuffer,
          mimetype: fileMime,
        });

        if (url) uploadedUrls.push(url);
      }

      if (uploadedUrls.length) {
        await Zoom.findOneAndUpdate(
          { meetingId: String(meetingId) },
          { $push: { download: { $each: uploadedUrls } } },
          { new: true }
        );
        logger.info(`Uploaded Zoom recordings for meeting ${meetingId}`);
        console.log(`Uploaded Zoom recordings for meeting ${meetingId}`);
      }
    } catch (err) {
      logger.error("Error uploading Zoom recordings:", err?.response?.data || err.message);
      console.log("Error uploading Zoom recordings:", err?.response?.data || err.message);
    }
    return res.sendStatus(200);
  }

  // Step 2: Handle "participant_left" event
  if (event === "meeting.participant_left") {
    const meetingId = req.body.payload.object.id;

    // Check how many participants are still in the meeting
    const accessToken = await getZoomAccessToken();

    try {
      const resp = await axios.get(
        `https://api.zoom.us/v2/metrics/meetings/${meetingId}/participants?type=live`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const participants = resp.data?.participants || [];

      // If no one is left, set a 5 min timeout to verify and end meeting
      if (participants.length === 0) {
        if (!emptyMeetingTimeouts.has(meetingId)) {
          logger.info(`No one left in meeting ${meetingId}. Starting 5-min timer.`);

          const timeout = setTimeout(async () => {
            try {
              // Get Zoom entry
              const zoom = await Zoom.findOne({ meetingId });
              if (!zoom) return;

              // Populate associated booking
              const booking = await Bookings.findOne({ zoom: zoom._id });
              if (!booking) return;

              const now = new Date();
              const endTime = new Date(booking.endDateTime);

              // Only end if endDateTime has passed
              if (now >= endTime) {
                logger.info(`Ending Zoom meeting ${meetingId} after empty timeout.`);

                await axios.delete(
                  `https://api.zoom.us/v2/meetings/${meetingId}`,
                  { headers: { Authorization: `Bearer ${accessToken}` } }
                );
              }
            } catch (err) {
              logger.error("Error ending Zoom meeting:", err?.response?.data || err.message);
            } finally {
              emptyMeetingTimeouts.delete(meetingId);
            }
          }, 5 * 60 * 1000); // 5 minutes

          emptyMeetingTimeouts.set(meetingId, timeout);
        }
      } else {
        // If someone rejoined, clear the timeout
        if (emptyMeetingTimeouts.has(meetingId)) {
          clearTimeout(emptyMeetingTimeouts.get(meetingId));
          emptyMeetingTimeouts.delete(meetingId);
          logger.info(`Participant rejoined meeting ${meetingId}. Timer cleared.`);
        }
      }
    } catch (error) {
      logger.error("Zoom participant check failed:", error?.response?.data || error.message);
    }
  }

  return res.sendStatus(200);
});

// Testing route for zoom meeting creation
// app.get("/zoom", async(req, res) => {
//   const meetingDetails = {
//   topic: "Demo Application",
//   type: 2,
//   start_time: "2025-06-18T11:40:00+05:30",
//   duration: 5,
//   password: "12334",
//   timezone: "Asia/Kolkata",
//   settings: {
//     auto_recording: "cloud",
//     host_video: true,
//     participant_video: true,
//     mute_upon_entry: true,
//     join_before_host: true,
//     waiting_room: false,
//     registrants_capacity: 2,
//   },
// };
// const result = await createZoomMeeting(meetingDetails);
// return res.json({
//     msg: 'Hello World',
//     status: 200,
//     data:result,
//   });

// });

app.get("/", (req, res) => {
  res.json({
    msg: 'Hello World',
    status: 200,
  });
});

require('./cronJobs')();

const server = app.listen(PORT, () => console.log("Server is running at port : " + PORT));
server.timeout = 360000; // 6 minutes