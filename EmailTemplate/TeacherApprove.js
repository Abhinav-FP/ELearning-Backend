module.exports = (teacherName, link) => {
  return `
    <div id="email" style="background: #fdf6f7;padding: 20px 0;">
  <table role="presentation" border="0" cellspacing="0" width="100%" style="font-family: arial;max-width:450px; margin: auto;background-color: #fff;">
    <tr>
      <td style="padding: .5rem 1rem;text-align: center;">
        <a href="https://www.akitainakaschoolonline.com/" style="text-decoration: none;">
          <img style="logo.png" src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/logo.png" alt="Japanese For Me">
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 1.5rem 1rem 2rem;">
        <img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/booked.png" alt="banner" style="max-width:100%;margin: auto;display: block;" />
      </td>
    </tr>
    <tr>
      <td style="padding: .1rem 1rem 1rem; border-bottom: 1px solid rgba(0,0,0,.1)">
        <p style="font-size: 1.5rem; font-weight: bold; line-height: 1.9rem; text-align: center;color: #55844D;margin: 0 0 .6rem;">
          Your Account Has Been Approved! 🎉
        </p>
        <p style="font-size: 1.1rem; font-weight: bold; line-height: 1.6rem; text-align: center;color: #333333;margin: 0.8rem 0 .7rem;">
          Hi ${teacherName},
        </p>

        <p style="font-size: 1rem; font-weight: 400; line-height: 1.5rem; text-align: center;color: #333333;margin: 0 0 .5rem;">
          Congratulations! Your profile has been successfully approved. You can now start creating lessons and begin teaching students on Japanese For Me.
        </p>

        <p style="margin: 1.2rem 0;text-align: center;">
          <a href=${link} style="background:#55844D;color:#fff;border-radius: 7px;font-size: 1.1rem;text-decoration: none;display: inline-block;padding: .8rem 1.5rem;">
            Verify Your Email
          </a>
        </p>

        <p style="font-size: 1rem; font-weight: 400; line-height: 22px; text-align: center;color: #333333;margin: 0 0 1.5rem;">
          We're thrilled to have you onboard. Share your knowledge, connect with eager learners, and make an impact.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: .1rem 0rem 1rem;">
        <div style="padding: 1.3rem 0rem;background: #55844D;">
          <p style="font-size: 12px; font-weight: 400; line-height: 18px;  text-align: center;color: #ffff;margin: 0 auto; max-width: 260px;">
            © 2025 Japanese for Me. All Rights Reserved.
          </p>
        </div>
      </td>
    </tr>
  </table>
</div>
  `;
};
