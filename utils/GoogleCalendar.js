const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");

async function getValidGoogleClient(teacher) {
  if (!teacher.googleCalendar?.connected) {
    throw new Error("Google Calendar not connected");
  }

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: teacher.googleCalendar.accessToken,
    refresh_token: teacher.googleCalendar.refreshToken,
    expiry_date: teacher.googleCalendar.expiryDate,
  });

  // Refresh token if needed
  if (Date.now() >= teacher.googleCalendar.expiryDate - 60_000) {
    const { credentials } = await oauth2Client.refreshAccessToken();

    teacher.googleCalendar.accessToken = credentials.access_token;
    teacher.googleCalendar.expiryDate = credentials.expiry_date;
    await teacher.save();

    oauth2Client.setCredentials(credentials);
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

async function getTeacherJapaneseformeEvents(teacher) {
  const calendar = await getValidGoogleClient(teacher);

  const res = await calendar.events.list({
    calendarId: "primary",
    privateExtendedProperty: "source=japaneseforme",
    singleEvents: true,
    orderBy: "startTime",
    timeMin: new Date().toISOString(),
  });

  return res.data.items || [];
}

async function addBookingToGoogleCalendar({
  booking,
  teacher,
  student,
  lesson,
}) {
  // Idempotency check
  if (booking.googleCalendar?.synced && booking.googleCalendar?.eventId) {
    return booking.googleCalendar.eventId;
  }

  const calendar = await getValidGoogleClient(teacher);

  const event = {
    summary: `Japanese Lesson with ${student.name}`,
    description: `
Lesson: ${lesson.title}
Student: ${student.name}
Teacher: ${teacher.name}
Booking ID: ${booking._id}
`,
    start: {
      dateTime: booking.startDateTime.toISOString(),
    },
    end: {
      dateTime: booking.endDateTime.toISOString(),
    },
    extendedProperties: {
      private: {
        source: "japaneseforme",
        bookingId: booking._id.toString(),
      },
    },
  };

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

  // Save sync status
  booking.googleCalendar = {
    eventId: res.data.id,
    synced: true,
    syncedAt: new Date(),
  };

  await booking.save();

  return res.data.id;
}

module.exports = {
  getValidGoogleClient,
  getTeacherJapaneseformeEvents,
  addBookingToGoogleCalendar
};