module.exports = (userName, teacherName, link) => {
  return `
  <div id="email" style="background: #d9d9d9;padding: 20px 0;">
    <table role="presentation" border="0" cellspacing="0" width="100%" style="font-family: arial;max-width:450px; margin: auto;background-color: #fff;">        
        <tr>
            <td style="padding: .5rem  1rem;text-align: center;"> 
                <a href="https://www.japaneseforme.com/" style="text-decoration: none;">
                  <img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/logo.png" alt="logo">
                </a>
            </td> 
        </tr>
        <tr>
            <td style="padding: 0rem 1rem .2rem;"> 
                <img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/rating-review-banner.png" alt="banner" style="max-width:100%;margin: auto;display: block;" />
            </td>
        </tr>
        <tr>
            <td style="padding: .1rem 1rem 1rem ;border-bottom: 1px solid rgba(0,0,0,.1);">
                <p style="font-size: 1.5rem; font-weight: bold; line-height: 1.9rem; text-align: center;color: #CC2828;margin: 0 0 .6rem;">Did You Complete Your Lesson with ${teacherName}?</p> 
                <p style="font-size: 1.1rem; font-weight: bold; line-height: 1.6rem; text-align: center;color: #333333;margin: 0 0 .7rem;">Hi ${userName},</p>

                <p style="font-size: 1rem; font-weight: 400; line-height: 1.5rem; text-align: center;color: #333333;margin: 0 0 1.3rem;">
                    Please confirm whether your lesson with <strong>${teacherName}</strong> was completed.<br>This helps us process any related payments and maintain a smooth learning experience.
                </p>  
                <p style="margin: 0 0 1.3rem;text-align: center;">
                    <a href=${link} style="background:#CC2828;color:#fff;border-radius: 7px;font-size: 1.1rem;text-decoration: none;display: inline-block;padding: .8rem 1.5rem;">Mark Lesson as Completed</a>
                </p>  
                <p style="font-size: 1rem; font-weight: 400; line-height: 1.5rem; text-align: center;color: #333333;margin: 0 0 1.3rem;">
                    Thank you for your prompt response.<br>— The Japanese for Me Team
                </p>
            </td>
        </tr>
        <tr> 
            <td style="padding:0;">  
                <div style="padding: 1.3rem  1rem;background: #EFD1D1;">
                    <p style="font-size: 12px; font-weight: 400; line-height: 18px;  text-align: center;color: #CC2828;margin: 0 auto; max-width: 260px;">© 2025 Japanese for Me. All Rights Reserved.</p>
                </div>
            </td>
        </tr> 
    </table>
</div>
    `;
};
