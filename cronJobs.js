// cronJobs.js
const cron = require('node-cron');
const Bookings = require("./model/booking");
const Zoom = require("./model/Zoom");
const TeacherAvailability = require("./model/TeacherAvailability");
const { updateCurrencyRatesJob } = require("./controller/currencycontroller");
const sendEmail = require("./utils/EmailMailler");
const currency = require("./EmailTemplate/currency");
const Reminder = require("./EmailTemplate/Reminder");
const TeacherReminder = require("./EmailTemplate/TeacherReminder");
const StudentLessonDone = require("./EmailTemplate/StudentLessonDone");
const TeacherLessonDone = require("./EmailTemplate/TeacherLessonDone");
const { DateTime } = require("luxon"); // Already in your project
const createZoomMeeting = require('./zoommeeting');
const logger = require("./utils/Logger");
const jwt = require("jsonwebtoken");

module.exports = () => {
  cron.schedule('*/1 * * * *', async () => {
    try {
        // console.log(`Running cron job at ${new Date().toISOString()}`);
        const now = new Date(); // current time in UTC

        const data = await Bookings.find({
        startDateTime: { $gt: now }
        })
        .populate('teacherId')
        .populate('UserId')
        .populate('LessonId')
        .sort({ startDateTime: 1 });
        // console.log("data",data);

        const registrationSubject = "Reminder for Booking ⏰";

        for (const booking of data) {
        const nowTime = DateTime.utc();
        const startUTC = DateTime.fromJSDate(booking.startDateTime).toUTC();
        const diffInMinutes = Math.round(startUTC.diff(nowTime, 'minutes').minutes);
        // console.log("startUTC",startUTC);
        // console.log("nowTime",nowTime);
        // console.log("diffInMinutes",diffInMinutes);
        let time = null;
        if (diffInMinutes === 1440) time = "24 hours";
        else if (diffInMinutes === 120) time = "2 hours";
        else if (diffInMinutes === 30) time = "30 minutes";
        else continue; // skip if not one of the 3 target intervals

        // Zoom Code
        if(diffInMinutes === 30)
        {
          logger.info(`Creating Zoom meeting for booking ID: ${booking._id}`);
          // console.log(`Creating Zoom meeting for booking ID: ${booking._id}`);
          const meetingDetails = {
            topic: booking?.LessonId?.title || "Title not available",
            type: 2,
            start_time: booking?.startDateTime,
            duration: booking?.LessonId?.duration,
            password: "12334",
            timezone: "UTC",
            settings: {
              auto_recording: "cloud",
              host_video: true,
              participant_video: true,
              mute_upon_entry: true,
              join_before_host: true,
              waiting_room: false,
              registrants_capacity: 2,
            },
          };
          const result = await createZoomMeeting(meetingDetails);
          // console.log("result",result);
          const zoomRecord = new Zoom({
            meetingId: result?.meeting_id || "",
            meetingLink: result?.meeting_url || "",
          });
          const zoomResult = await zoomRecord.save();
          booking.zoom = zoomResult._id; // Save the Zoom meeting ID in the booking
          await booking.save();
        }
        
        logger.info("Sending email for booking",booking._id);
        // console.log("Sending email for booking",booking._id);
        // continue;

        const user = booking?.UserId;
        const teacher = booking?.teacherId;
        const lesson = booking?.LessonId;

        const userName = user?.name || "";
        const teacherName = teacher?.name || "";
        const lessonName = lesson?.title || "";

        // Sending email to student
        const emailHtml = Reminder(
            userName,
            "https://japaneseforme.com/student/lessons",
            time,
            teacherName,
            lessonName
        );

        await sendEmail({
            email: user.email,
            subject: registrationSubject,
            emailHtml: emailHtml,
        });

        // Sending email to teacher
        const TeacherEmailHtml = TeacherReminder(
            userName,
            "https://japaneseforme.com/teacher-dashboard/booking",
            time,
            teacherName,
            lessonName
        );

        await sendEmail({
            email: teacher.email,
            subject: registrationSubject,
            emailHtml: TeacherEmailHtml,
        });        

        logger.info(`📧 Reminder email sent to ${user.email}`);
        }

        // Sending lesson done emails to user and teacher
        const endNow = DateTime.utc().startOf('minute'); // e.g., 13:42:00
        const justEndedBookings = await Bookings.find({
          cancelled: false,
          endDateTime: {
            $gte: endNow.toJSDate(),
            $lt: endNow.plus({ minutes: 1 }).toJSDate(), // match to current minute
          },
        })
          .populate('teacherId')
          .populate('UserId')
          .populate('LessonId');

        for (const booking of justEndedBookings) {
          const user = booking?.UserId;
          const teacher = booking?.teacherId;

          const userName = user?.name || "";
          const teacherName = teacher?.name || "";

          const token = jwt.sign(
            { bookingId: booking._id, studentId: booking?.UserId },
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES_IN || "365d" }
          );

          const studentDoneEmailHtml = StudentLessonDone(
            userName,
            teacherName,
            `https://japaneseforme.com/student/confirm-lesson/${token}`
          );

          await sendEmail({
            email: user.email,
            subject: "Please confirm your lesson completion ✅",
            emailHtml: studentDoneEmailHtml,
          });

          logger.info(`📧 StudentLessonDone email sent to ${user.email} for booking ${booking._id}`);
          console.log(`📧 StudentLessonDone email sent to ${user.email} for booking ${booking._id}`);

          // Lesson done email to teacher
           const teacherToken = jwt.sign(
            { bookingId: booking._id, teacherId: booking?.teacherId },
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES_IN || "365d" }
          );

          const teacherDoneEmailHtml = TeacherLessonDone(
            userName,
            teacherName,
            `https://japaneseforme.com/student/confirm-lesson/${teacherToken}`
          );

          await sendEmail({
            email: teacher.email,
            subject: "Please confirm your lesson completion ✅",
            emailHtml: teacherDoneEmailHtml,
          });

          logger.info(`📧 TeacherLessonDone email sent to ${teacher.email} for booking ${booking._id}`);
          console.log(`📧 TeacherLessonDone email sent to ${teacher.email} for booking ${booking._id}`);
        }

    } catch (error) {
        console.log("Error in cron job", error);
        logger.error("Error in cron job", error);
    }
    });

  // Cleanup old availability - daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    try {
      console.log(`🕐 Running availability cleanup at ${new Date().toISOString()}`);
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

  cron.schedule('46 16 * * *', async () => {
    try {
      console.log('⏰ Currency update cron job triggered!');
      const emailHtml = currency('Success', true, '', 'May 29, 2025 11:25 AM');
      const record = await updateCurrencyRatesJob();
      await sendEmail({
        email: "ankit.jain@internetbusinesssolutionsindia.com",
        subject: 'Currency Rate Update - Success',
        emailHtml: emailHtml,
      });
    } catch (err) {
      console.error('❌ Cron job error:', err);
    }
  });
};
