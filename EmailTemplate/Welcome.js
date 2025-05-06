
module.exports = (userName,link) => {
    console.log("userName" ,userName)
    return `
  <div id="email" style="background: #444;padding: 20px 0;">
    <table role="presentation" border="0" cellspacing="0" width="100%" style="font-family: arial;max-width:450px; margin: auto;background-color: #fff;">        
        <tr>
            <td style="padding: .5rem  1rem;text-align: center;"> 
                <a href="#" style="text-decoration: none;">
                  <img style="logo.png" src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/logo.png" alt="">
                </a>
             </td> 
        </tr>
         <tr>
            <td style=" padding: 2.5rem 1rem 2rem;"> 
                <img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/welcome-img.png" alt="banner" style="max-width:100%;margin: auto;display: block;" />
            </td>
        </tr>
        <tr>
            <td style="padding: .1rem 1rem 1rem ;border-bottom: 1px solid rgba(0,0,0,.1)">
                <p style="font-size: 1.5rem; font-weight: bold; line-height: 1.6rem; text-align: left;color: #CC2828;margin: 0 0 .6rem;">Welcome to E-learning</p> 
                <p style="font-size: 1.1rem; font-weight: bold; line-height: 1.6rem; text-align: left;color: #333333;margin: 0 0 .7rem;">Hi ${userName}</p>

                <p style="font-size: 1rem; font-weight: 400; line-height: 1.5rem; text-align: left;color: #333333;margin: 0 0 1.3rem;">
                    Thanks for joining Japanese for Me  You're now part of a global community of language learners and certified teachers. Whether you're learning English or Japanese, we’re here to guide you every step of the way.
                </p>
                <p style="margin: 0 0 1.3rem;"><a href="#" style="background:#CC2828;color:#fff;border-radius: 7px;font-size: 1.1rem;text-decoration: none;display: inline-block;padding: .8rem 1.5rem;">Get started now</a></p> 
                <p style="font-size: 1rem; font-weight: 400; line-height: 22px; text-align: left;color: #333333;margin: 0 0 1.5rem;">Happy Learning, <br> e-learing Team</p>  
                <div style="padding: 1.3rem  1rem;background: #EFD1D1;">
                    <div style="text-align: center;">                        
                        <a href="#" style="text-decoration: none;margin-right: 10px;vertical-align: middle;"><img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/facebook_icon.png" alt="facebook"></a>
                        <a href="#" style="text-decoration: none;margin-right: 10px;vertical-align: middle;"><img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/twitter_icon.png" alt="twitter"></a>
                        <a href="#" style="text-decoration: none;margin-right: 10px;vertical-align: middle;"><img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/instagram_icon.png" alt="instagram"></a>
                    </div> 
                    <div style="text-align: center; padding: 1.1em 0 ;">
                        <a href="tel:(123) 456-7890" style="font-size: 12px; font-weight: 400; line-height: 18px;color: #CC2828;text-decoration: none;margin: 0 .5em;"><img style="margin-right: .2em; vertical-align: middle;" src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/phone.png" alt="img" /> (123) 456-7890</a>
                        <a href="mailto:Algora Publishing@gmail.com" style="font-size: 12px; font-weight: 400; line-height: 18px;color: #CC2828; text-decoration: none;margin: 0 .5em;"><img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/email.png" alt="img" style="margin-right: .2em; vertical-align: middle;" /> Japaneseforme@gmail.com</a>
                    </div>

                    <p style="font-size: 12px; font-weight: 400; line-height: 18px;  text-align: center;color: #CC2828;margin: 0 auto; max-width: 260px;">© 2025 Japanese for Me. All Rights Reserved.</p>
                </div>
            </td>
        </tr> 
    </table>
</div>
      `;
  };
  