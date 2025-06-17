const  axios = require("axios");
const dotenv =  require("dotenv");
const btoa = require("btoa");

dotenv.config();

const clientId = process.env.ZOOM_clientId;
const accountId = process.env.ZOOM_accountId;
const clientSecret = process.env.ZOOM_clientSecret;

const auth_token_url = "https://zoom.us/oauth/token";
const api_base_url = "https://api.zoom.us/v2";

/**
 * Creates a Zoom meeting using Server-to-Server OAuth credentials
 * @param {Object} meetingDetails - Zoom meeting settings like topic, start_time, duration, etc.
 * @returns {Object} Zoom meeting response or error
 */
const createZoomMeeting = async (meetingDetails) => {
  const base64 = btoa(`${clientId}:${clientSecret}`);

  try {
    // Step 1: Get Access Token
    const authResponse = await axios.post(
      `${auth_token_url}?grant_type=account_credentials&account_id=${accountId}`,
      {},
      {
        headers: {
          Authorization: `Basic ${base64}`,
        },
      }
    );

    const access_token = authResponse.data.access_token;

    // Step 2: Create Meeting
    const headers = {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(
      `${api_base_url}/users/me/meetings`,
      JSON.stringify(meetingDetails),
      { headers }
    );

    if (response.status !== 201) {
      return { success: false, message: "Meeting creation failed", data: null };
    }

    const data = response.data;
    return {
        meeting_url: data.join_url,
        meeting_id: data.id,
        meetingTime: data.start_time,
        purpose: data.topic,
        duration: data.duration,
        password: data.password,
        status: data.status,
        alternative_host: "new.host@example.com", // optional
    };
  } catch (error) {
    console.error("Zoom API Error:", error.response?.data || error.message);
    return {
      success: false,
      message: "Something went wrong",
      error: error.response?.data || error.message,
    };
  }
};

module.exports = createZoomMeeting;