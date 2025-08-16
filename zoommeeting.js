const  axios = require("axios");
const dotenv =  require("dotenv");
const btoa = require("btoa");

dotenv.config();

const auth_token_url = "https://zoom.us/oauth/token";
const api_base_url = "https://api.zoom.us/v2";

// Old code for creating meeting using admin zoom account
// const clientId = process.env.ZOOM_clientId;
// const accountId = process.env.ZOOM_accountId;
// const clientSecret = process.env.ZOOM_clientSecret;

// const createZoomMeeting = async (meetingDetails) => {
//   const base64 = btoa(`${clientId}:${clientSecret}`);

//   try {
//     // Step 1: Get Access Token
//     const authResponse = await axios.post(
//       `${auth_token_url}?grant_type=account_credentials&account_id=${accountId}`,
//       {},
//       {
//         headers: {
//           Authorization: `Basic ${base64}`,
//         },
//       }
//     );

//     const access_token = authResponse.data.access_token;

//     // Step 2: Create Meeting
//     const headers = {
//       Authorization: `Bearer ${access_token}`,
//       "Content-Type": "application/json",
//     };

//     const response = await axios.post(
//       `${api_base_url}/users/me/meetings`,
//       JSON.stringify(meetingDetails),
//       { headers }
//     );

//     if (response.status !== 201) {
//       return { success: false, message: "Meeting creation failed", data: null };
//     }

//     const data = response.data;
//     return {
//         meeting_url: data.join_url,
//         meeting_id: data.id,
//         meetingTime: data.start_time,
//         purpose: data.topic,
//         duration: data.duration,
//         password: data.password,
//         status: data.status,
//         alternative_host: "new.host@example.com", // optional
//     };
//   } catch (error) {
//     logger.error("Zoom API Error:", error.response?.data || error.message);
//     console.log("Zoom API Error:", error.response?.data || error.message);
//     return {
//       success: false,
//       message: "Something went wrong",
//       error: error.response?.data || error.message,
//     };
//   }
// };


// New Code for creating meeting using teachers token
const refreshZoomToken = async (refresh_token) => {
  try {
    const clientId = process.env.ZOOM_clientId;
    const clientSecret = process.env.ZOOM_clientSecret;
    const base64 = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await axios.post(
      `${auth_token_url}?grant_type=refresh_token&refresh_token=${refresh_token}`,
      {},
      {
        headers: { Authorization: `Basic ${base64}` },
      }
    );

    return {
      access_token: res.data.access_token,
      refresh_token: res.data.refresh_token,
    };
  } catch (err) {
    console.error("Error refreshing Zoom token:", err.response?.data || err.message);
    return null;
  }
};

/**
 * Creates a Zoom meeting using teacher’s OAuth access token
 */
const createZoomMeeting = async (meetingDetails, teacherData, TeacherModel) => {
  try {
    let access_token = teacherData.access_token;

    // Test if token works
    let tokenValid = true;
    try {
      await axios.get(`${api_base_url}/users/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
    } catch {
      tokenValid = false;
    }

    // If token invalid, refresh it
    if (!tokenValid) {
      logger.info("Token invalid generating new one");
      const newTokens = await refreshZoomToken(teacherData.refresh_token);
      if (!newTokens) throw new Error("Failed to refresh Zoom token");

      access_token = newTokens.access_token;

      // Save updated tokens in teacherData
      await TeacherModel.updateOne(
        { _id: teacherData._id },
        { access_token: newTokens.access_token, refresh_token: newTokens.refresh_token }
      );
    }

     // Sanitize payload before sending
    const sanitizedDetails = {
      topic: meetingDetails.topic || "Lesson booking",
      type: meetingDetails.type || 2,
      start_time: meetingDetails.start_time || new Date().toISOString(),
      duration: meetingDetails.duration || 60,
      password: meetingDetails.password || Math.random().toString(36).slice(-8),
      timezone: "UTC",
      settings: meetingDetails.settings || {
       auto_recording: "cloud",
       host_video: true,
       participant_video: true,
       mute_upon_entry: true,
       join_before_host: true,
       waiting_room: false,
      },
    };

    // Create Zoom meeting
    const response = await axios.post(
      `${api_base_url}/users/me/meetings`,
      sanitizedDetails,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    // console.log("response?.data", response?.data);

    return {
      meeting_url: response.data.join_url,
      meeting_id: response.data.id,
      meetingTime: response.data.start_time,
      purpose: response.data.topic,
      duration: response.data.duration,
      password: response.data.password,
      status: response.data.status,
    };
  } catch (error) {
    console.error("Zoom API Error:", error.response?.data || error.message);
    return { success: false, message: "Zoom meeting creation failed" };
  }
};

module.exports = { createZoomMeeting, refreshZoomToken };