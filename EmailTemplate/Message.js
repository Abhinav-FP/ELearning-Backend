module.exports = (receiverName, senderName ,link) => {
  return `
    <div id="email" style="background: #fdf6f7; padding: 20px 0;">
  <table role="presentation" border="0" cellspacing="0" width="100%" style="font-family: arial; max-width: 500px; margin: auto; background-color: #fff;">
    <tr>
      <td style="padding: .5rem 1rem; text-align: center;">
        <a href="https://www.japaneseforme.com/" style="text-decoration: none;">
          <img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/logo.png" alt="Japanese For Me" style="max-width: 150px;">
        </a>
      </td>
    </tr>

    <tr>
      <td style="padding: 2.5rem 1rem 2rem;">
        <img src="ttps://student-teacher-platform.sgp1.digitaloceanspaces.com/message.png" alt="New Message" style="max-width: 100%; margin: auto; display: block;">
      </td>
    </tr>

    <tr>
      <td style="padding: .1rem 1rem 1rem; border-bottom: 1px solid rgba(0,0,0,.1);">
        <p style="font-size: 1.5rem; font-weight: bold; line-height: 1.6rem; text-align: left; color: #CC2828; margin: 0 0 .6rem;">
          You have a new message!
        </p>

        <p style="font-size: 1.1rem; font-weight: bold; line-height: 1.6rem; text-align: left; color: #333333; margin: 0 0 .7rem;">
          Hi ${receiverName},
        </p>

        <p style="font-size: 1rem; font-weight: 400; line-height: 1.5rem; text-align: left; color: #333333; margin: 0 0 1.3rem;">
          You’ve received a new message from <strong>${senderName}</strong>.
        </p>


        <p style="font-size: 1rem; font-weight: 400; line-height: 1.5rem; text-align: left; color: #333333; margin: 0 0 1.3rem;">
          Click the button below to open your conversation and reply:
        </p>

        <p style="margin: 0 0 1.3rem;">
          <a href="${link}" style="background: #CC2828; color: #fff; border-radius: 7px; font-size: 1.1rem; text-decoration: none; display: inline-block; padding: .8rem 1.5rem;">
            View Message
          </a>
        </p>

        <p style="font-size: 1rem; font-weight: 400; line-height: 22px; text-align: left; color: #333333; margin: 0 0 1.5rem;">
          Happy Learning,<br>
          Japanese for Me Team
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: .1rem 0rem 1rem;">
        <div style="padding: 1.3rem 1rem; background: #EFD1D1;">
          <p style="font-size: 12px; font-weight: 400; line-height: 18px; text-align: center; color: #CC2828; margin: 0 auto; max-width: 260px;">
            © 2025 Japanese for Me. All Rights Reserved.
          </p>
        </div>
      </td>
    </tr>
  </table>
</div>
      `;
};