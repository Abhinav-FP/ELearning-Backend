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
    console.log("➡️ Google OAuth callback hit");

    const { code, state } = req.query;
    console.log("req.query", req.query);

    if (!code || !state) {
      return res.status(400).json({ message: "Invalid Google callback" });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    console.log("✅ Tokens received from Google:", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    });

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
    // const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    // const calendarList = await calendar.calendarList.list();
    // const primaryCalendar = calendarList.data.items.find(
    //   cal => cal.primary
    // );

    // const calendarId = "primary";
    console.log("🔍 Finding teacher with userId:", state);
    const teacher = await Teacher.findOne({ userId: state });

    if (!teacher) {
      console.error("❌ Teacher not found for userId:", state);
      throw new Error("Teacher not found");
    }
    
    console.log("✅ Teacher found:", teacher._id.toString());
    // 🧠 Preserve existing refresh token if Google didn’t send one
    const refreshTokenToSave =
      tokens.refresh_token || teacher.googleCalendar?.refreshToken;
    if (!refreshTokenToSave) {
      console.warn("⚠️ No refresh token available (new or existing)");
    }
    // 💾 UPDATE TEACHER
    teacher.googleCalendar = {
      accessToken: tokens.access_token,
      refreshToken: refreshTokenToSave,
      expiryDate: tokens.expiry_date,
      calendarId: "primary",
      connected: true,
    };
    await teacher.save();
    console.log("✅ Google Calendar data saved for teacher:", teacher._id);

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