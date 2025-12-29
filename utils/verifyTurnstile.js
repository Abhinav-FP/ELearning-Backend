const axios = require("axios");

async function verifyTurnstile(token, ip) {
  const res = await axios.post(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    new URLSearchParams({
      secret: process.env.CLOUDFLARE_TURNSTILE_SECRET,
      response: token,
      remoteip: ip || ""
    })
  );
  return res.data;
}

module.exports = verifyTurnstile;