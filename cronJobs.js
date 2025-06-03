// cronJobs.js
const cron = require('node-cron');
const Bookings = require("./model/booking");
const TeacherAvailability = require("./model/TeacherAvailability");
const { updateCurrencyRatesJob } = require("./controller/currencycontroller");
const sendEmail = require("./utils/EmailMailler");
const currency = require("./EmailTemplate/currency");
const Reminder = require("./EmailTemplate/Reminder");
const TeacherReminder = require("./EmailTemplate/TeacherReminder");
const { DateTime } = require("luxon"); // Already in your project

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
        
        console.log("Sending email for booking",booking);
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
            "https://japaneseforme.com/",
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
            "https://japaneseforme.com/",
            time,
            teacherName,
            lessonName
        );

        await sendEmail({
            email: teacher.email,
            subject: registrationSubject,
            emailHtml: TeacherEmailHtml,
        });        

        console.log(`📧 Reminder email sent to ${user.email}`);
        }

    } catch (error) {
        console.error("Error in cron job", error);
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
