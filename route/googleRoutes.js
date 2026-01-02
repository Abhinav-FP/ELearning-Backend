const express = require("express");
const { google } = require("googleapis");
const Teacher = require("../model/teacher");
const router = express.Router();
const { oauth2Client } = require("../utils/googleOAuth");
const { verifyToken } = require("../middleware/tokenVerify");

router.get("/auth/google", verifyToken, async (req, res) => {
  const teacherId = req.user.id;
  const scopes = [
    "https://www.googleapis.com/auth/calendar.freebusy",
    "https://www.googleapis.com/auth/calendar.events",
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",      // IMPORTANT (for refresh token)
    prompt: "consent",            // ensures refresh token on first connect
    scope: scopes,
    state: teacherId,             // VERY IMPORTANT (link callback to teacher)
  });
  res.json({ url });
});

router.get("/auth/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ message: "Invalid Google callback" });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    /*
      tokens = {
        access_token,
        refresh_token,
        expiry_date
      }
    */

    // Set credentials to verify access (optional but good)
    oauth2Client.setCredentials(tokens);

    // Get user's primary calendar info (optional)
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items.find(
      cal => cal.primary
    );

    // Store securely in DB
    await Teacher.findOneAndUpdate({userId: state}, {
          googleCalendar: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token, // STORE THIS
            expiryDate: tokens.expiry_date,
            calendarId: primaryCalendar?.id || "primary",
            connected: true,
          },
        },
      { new: true }
    );

    // Redirect back to frontend
    res.redirect(
      `https://japaneseforme.com/teacher-dashboard/setting`
    );

  } catch (err) {
    console.error("Google OAuth Error:", err);
    res.redirect(
      `https://japaneseforme.com/teacher-dashboard/setting`
    );
  }
});

module.exports = router;