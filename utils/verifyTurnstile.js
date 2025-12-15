const axios = require("axios");

module.exports = async function verifyTurnstile(token, ip) {
  try {
    const response = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret: process.env.CF_TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Turnstile verify error:", error);
    return { success: false };
  }
};