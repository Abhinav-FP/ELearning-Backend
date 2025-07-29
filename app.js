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
const mongoose = require("mongoose");
const { default: axios } = require("axios");
const createZoomMeeting = require("./zoommeeting");
const logger = require("./utils/Logger");
const { uploadFileToSpaces } = require("./utils/FileUploader");
const Loggers = require("./utils/Logger");
const Bonus = require("./model/Bonus");

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
  Loggers.info("Headers received:", req.headers)
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    Loggers.error(`❌ Webhook signature verification failed: ${err.message}`)
    return res.status(400).json(`Webhook Error: ${err.message}`);
  }

  Loggers.silly(`✅ Webhook event received: ${event.type}`)
  // Handle event
  switch (event.type) {
    case 'charge.succeeded': {
      const charge = event.data.object;
      Loggers.warn(`💰 Charge succeeded for amount: ${charge.amount}`)
      break;
    }

    case 'charge.failed': {
      const charge = event.data.object;
      Loggers.debug(`❌ Charge failed: ${charge.failure_message}`)
      break;
    }

    case 'payment_intent.created': {
      const pi = event.data.object;
      Loggers.silly(`🕐 PaymentIntent created: ${pi.id}`)
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      Loggers.debug(`❌ PaymentIntent failed: ${pi.last_payment_error?.message}`)
      break;
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      Loggers.info(`✅ PaymentIntent succeeded for amount: ${pi.amount}`)
      const metadata = pi.metadata;
      if (metadata.IsBonus) {
        const payment = await StripePayment.create({
          srNo: parseInt(metadata.srNo),
          payment_type: "card",
          payment_id: pi.id,
          currency: pi.currency,
          LessonId: metadata.LessonId,
          amount: pi.amount / 100,
          UserId: metadata.userId,
          payment_status: pi.status,
          IsBonus: true,
        });
        // Create Bonus record
        const record = await Bonus.create({
          userId: metadata.userId,
          teacherId: metadata.teacherId,
          LessonId: metadata.LessonId,
          bookingId: metadata.BookingId,
          amount: metadata.amount,
          currency: pi.currency,
          StripepaymentId: payment._id, // ✅ updated to reflect Stripe
        });
        // Update Booking with Bonus
        await Bookings.findOneAndUpdate(
          { _id: metadata.BookingId },
          {
            IsBonus: true,
            BonusId: record._id,
          },
          { new: true }
        );
        return;
      }
      // Bonus Case ends here


      Loggers.info("📦 Metadata:", metadata)
      let startUTC, endUTC;
      // Convert times to UTC
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
      const teacherEarning = ((pi.amount / 100) - metadata.processingFee) * 0.90; // 90% to teacher, 10% to admin as discussed with client
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
        processingFee: metadata.processingFee || 0,
        notes: metadata.notes || ""
      });
      const record = await booking.save();

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
      }

      // Send confirmation email to student
      const user = await User.findById(metadata.userId);
      const teacher = await User.findById(metadata.teacherId);
      const registrationSubject = "Booking Confirmed 🎉";
      
      // Convert to ISO format for moment parsing in email templates
      // console.log("startUTC", startUTC);
      const utcDateTime = DateTime.fromJSDate(new Date(startUTC), { zone: "utc" });
      // console.log("utcDateTime", utcDateTime);
      // console.log("user",user);
      // console.log("teacher",teacher);
      
      const userTimeISO = user?.time_zone
        ? utcDateTime.setZone(user.time_zone).toISO()
        : utcDateTime.toISO();

      const teacherTimeISO = teacher?.time_zone
        ? utcDateTime.setZone(teacher.time_zone).toISO()
        : utcDateTime.toISO();
    // console.log("userTimeISO", userTimeISO);
    // console.log("teacherTimeISO", teacherTimeISO);

      const emailHtml = BookingSuccess(userTimeISO, user?.name, teacher?.name);
      await sendEmail({
        email: metadata.email,
        subject: registrationSubject,
        emailHtml
      });
      // Send Confirmation email to teacher
      const TeacherSubject = "New Booking 🎉";
      const TeacheremailHtml = TeacherBooking(teacherTimeISO, user?.name, teacher?.name);
      await sendEmail({
        email: teacher.email,
        subject: TeacherSubject,
        emailHtml: TeacheremailHtml
      });
      Loggers.info("Stripe webhook received successfully. Payment processed and booking with special slot completed.");
      break;
    }

    default:
      Loggers.error(`⚠️ Unhandled event type: ${event.type}`)
  }

  res.json({ received: true });
});


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
const ZOOM_REDIRECT_URI = process.env.ZOOM_REDIRECT_URI;

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
  // logger.info("Zoom webhook received", req.body);
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
    logger.info("files received", files);
    console.log("files received", files);

    try {
      const accessToken = await getZoomAccessToken();
      const downloadToken = req.body.download_token;
      const uploadedUrls = [];

      // Fetch current Zoom record for deduplication
      const zoomRecord = await Zoom.findOne({ meetingId: String(meetingId) });
      for (const file of files) {
        if (!file.download_url) continue;
        const fileExtension = file.file_type.toLowerCase();
        logger.info("fileExtension", fileExtension);
        console.log("fileExtension", fileExtension);
        const fileName = `recording-${meetingId}-${file.id}.${fileExtension}`;

        // Handle .chat files (convert to JSON, store in chat field)
        if (fileExtension === "chat") {
          const downloadUrl = `${file.download_url}?access_token=${downloadToken}`;
          const response = await axios.get(downloadUrl, {
            responseType: "text",
          });

          const chatContent = response.data || "";
          const chatLines = chatContent
            .split("\n")
            .filter(line => line.trim())
            .map(line => {
              const [time, name, ...messageParts] = line.split("\t");
              return { time, name, message: messageParts.join(" ") };
            });

          await Zoom.findOneAndUpdate(
            { meetingId: String(meetingId) },
            { chat: JSON.stringify(chatLines) },
            { new: true }
          );

          logger.info(`Saved chat file as JSON for meeting ${meetingId}`);
          console.log(`Saved chat file as JSON for meeting ${meetingId}`);
          continue;
        }

        // Handle .mp4 files (check for duplicates, upload)
        if (fileExtension === "mp4") {
          const fileExists = zoomRecord?.download?.some(existingUrl =>
            existingUrl.includes(file.id)
          );

          if (fileExists) {
            logger.info(`Skipping duplicate file ${fileName}`);
            console.log(`Skipping duplicate file ${fileName}`);
            continue;
          }

          const downloadUrl = `${file.download_url}?access_token=${downloadToken}`;
          logger.info(`Download url received ${downloadUrl}`);
          console.log(`Download url received ${downloadUrl}`);

          const response = await axios.get(downloadUrl, {
            responseType: "arraybuffer",
          });

          const fileBuffer = response.data;

          const fileMime = "video/mp4";

          const url = await uploadFileToSpaces({
            originalname: fileName,
            buffer: fileBuffer,
            mimetype: fileMime,
          });

          if (url) {
            uploadedUrls.push(url);
            logger.info(`Uploaded to: ${url}`);
            console.log(`url ${url}`);
          }

          continue;
        }

        // Ignore other file types
        logger.info(`Ignoring file ${fileName} of type ${file.file_type}`);
      }

      // Push URLs of uploaded mp4 files
      if (uploadedUrls.length) {
        await Zoom.findOneAndUpdate(
          { meetingId: String(meetingId) },
          { $push: { download: { $each: uploadedUrls } } },
          { new: true }
        );
        logger.info(`Uploaded Zoom recordings for meeting ${meetingId}: ${uploadedUrls}`);
        console.log(`Uploaded Zoom recordings for meeting ${meetingId}: ${uploadedUrls}`);
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

// OAuth Route used for zoom account connecting
app.post("/api/zoom/oauth-callback", async (req, res) => {
  console.log("Zoom account connection route opened");
  const code = req.query.code;
  console.log("code", code);
  if (!code) return res.status(400).send('No code in request');

  try {
    const tokenRes = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: ZOOM_REDIRECT_URI,
      },
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64'),
      },
    });
    console.log("tokenRes.data",tokenRes.data);

    const { access_token, refresh_token } = tokenRes.data;
    console.log("access_token",access_token);
    console.log("refresh_token",refresh_token);

    // Fetch Zoom user profile
    const userRes = await axios.get('https://api.zoom.us/v2/users/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    console.log("userRes",userRes);

    const zoomEmail = userRes.data.email;

    // Save to DB (example)
    // await Teacher.updateOne(
    //   { email: zoomEmail }, // or use your authenticated user ID
    //   {
    //     $set: {
    //       'zoom.access_token': access_token,
    //       'zoom.refresh_token': refresh_token,
    //       'zoom.email': zoomEmail,
    //     },
    //   }
    // );

    return res.redirect('/'); 
  } catch (err) {
    console.error('Zoom OAuth error:', err.response?.data || err.message);
    return res.status(500).send('Zoom OAuth failed');
  }
});

app.get("/", (req, res) => {
  res.json({
    msg: 'Hello World',
    status: 200,
  });
});

require('./cronJobs')();

const server = app.listen(PORT, () => console.log("Server is running at port : " + PORT));
server.timeout = 360000;