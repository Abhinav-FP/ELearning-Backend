const moment = require("moment");


module.exports = (statusText = 'Success', isSuccess = true, errorMessage = '', ) => {
  return `
<div id="email" style="background: #d9d9d9;padding: 20px 0;">
  <table role="presentation" border="0" cellspacing="0" width="100%" style="font-family: arial;max-width:450px; margin: auto;background-color: #fff;">
    <tr>
      <td style="padding: .5rem  1rem;text-align: center;"> 
        <a href="https://www.yourcompany.com/" style="text-decoration: none;">
          <img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/logo.png" alt="Japanese For Me" style="max-width: 150px;">
        </a>
      </td> 
    </tr>
    <tr>
      <td style="padding: 0rem 1rem .2rem;"> 
        <img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/rating-review-banner.png" alt="banner" style="max-width:100%;margin: auto;display: block;" />
      </td>
    </tr>
    <tr>
      <td style="padding: .5rem 1rem 1rem; border-bottom: 1px solid rgba(0,0,0,.1);">
        <p style="font-size: 1.5rem; font-weight: bold; line-height: 1.9rem; text-align: center;color: #CC2828;margin: 0 0 .6rem;">
          💱 Currency Rate Update Notification
        </p> 
        <p style="font-size: 1.1rem; font-weight: bold; line-height: 1.6rem; text-align: center;color: #333333;margin: 0 0 .7rem;">
          Status: <span style="color: ${isSuccess ? 'green' : 'red'};">${statusText}</span>
        </p>
        <p style="font-size: 1rem; line-height: 1.5rem; text-align: center; color: #333;margin: 0 0 1.3rem;">
          The scheduled currency rate update job ran on <strong>${moment(new Date()).format("DD MM YYYY hh:mm A")}</strong>.
        </p>
        ${
          !isSuccess
            ? `<p style="color: #b30000; background: #ffe5e5; padding: 1rem; border-radius: 6px; margin-bottom: 1.3rem; text-align: center;">
                Error: ${errorMessage}
              </p>`
            : `<p style="text-align: center; margin-bottom: 1.3rem;">
                ✅ All currency rates were updated successfully.
              </p>`
        }
        <p style="font-size: 1rem; line-height: 1.5rem; text-align: center; color: #333;margin: 0 0 1.3rem;">
          This is an automated update from the system. If you have any questions, please contact the administrator.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0;">
        <div style="padding: 1.3rem 1rem; background: #EFD1D1;">
          <p style="font-size: 12px; line-height: 18px; text-align: center; color: #CC2828;margin: 0 auto; max-width: 260px;">
            © 2025 Your Company. All Rights Reserved.
          </p>
        </div>
      </td>
    </tr> 
  </table>
</div>
  `;
};
