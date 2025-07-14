module.exports = (userName) => {
  return `
<div id="email" style="background: #fdf6f7;padding: 20px 0;">
  <table role="presentation" border="0" cellspacing="0" width="100%" style="font-family: arial;max-width:500px; margin: auto;background-color: #fff;">        
    <tr>
      <td style="padding: .5rem  1rem;text-align: center;"> 
        <a href="https://www.japaneseforme.com/" style="text-decoration: none;">
          <img style="logo.png" src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/logo.png" alt="Japanese For Me">
        </a>
      </td> 
    </tr>
    <tr>
      <td style="padding: 2.5rem 1rem 2rem;"> 
        <img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/welcome-img.png" alt="banner" style="max-width:100%;margin: auto;display: block;" />
      </td>
    </tr>
    <tr>
      <td style="padding: .1rem 1rem 1rem ;border-bottom: 1px solid rgba(0,0,0,.1)">
        <p style="font-size: 1.5rem; font-weight: bold; line-height: 1.6rem; text-align: left;color: #CC2828;margin: 0 0 .6rem;">Welcome to Japanese for Me</p> 
        <p style="font-size: 1.1rem; font-weight: bold; line-height: 1.6rem; text-align: left;color: #333333;margin: 0 0 .7rem;">Hi ${userName},</p>

        <p style="font-size: 1rem; font-weight: 400; line-height: 1.5rem; text-align: left;color: #333333;margin: 0 0 1.3rem;">
          Welcome to Japanese for Me as a teacher! 🎉<br><br>
          Your application has been received and is currently pending approval from our team. Once your account is approved, you’ll be able to create lessons and start teaching students on our platform.
        </p>

        <p style="font-size: 1rem; font-weight: 400; line-height: 22px; text-align: left;color: #333333;margin: 0 0 1.5rem;">Thank you for joining us, <br>Japanese for Me Team</p>  
      </td>
    </tr>
    <tr>
      <td style="padding: .1rem 0rem 1rem ;">
        <div style="padding: 1.3rem  1rem;background: #EFD1D1;">
          <p style="font-size: 12px; font-weight: 400; line-height: 18px;  text-align: center;color: #CC2828;margin: 0 auto; max-width: 260px;">© 2025 Japanese for Me. All Rights Reserved.</p>
        </div>
      </td>
    </tr>
  </table>
</div>
      `;
};
