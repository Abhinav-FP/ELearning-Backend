module.exports = (userName, link) => {
    return `
<div id="email" style="background: #444;padding: 20px 0;">
    <table role="presentation" border="0" cellspacing="0" width="100%" style="font-family: arial;max-width:450px; margin: auto;background-color: #fff;">        
        <tr>
            <td style="padding: .5rem  1rem;text-align: center;"> 
                <a href="https://www.japaneseforme.com/" style="text-decoration: none;">
                  <img style="logo.png" src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/logo.png" alt="Japanese For Me">
                </a>
             </td> 
        </tr>
         <tr>
            <td style=" padding: 0rem 1rem 1rem;"> 
                <img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/booking-rescheduled-banner.png" alt="" style="max-width:100%;margin: auto;display: block;" />
            </td>
        </tr>
        <tr>
            <td style="padding: .1rem 1rem 1rem ;border-bottom: 1px solid rgba(0,0,0,.1)">
                <p style="font-size: 1.5rem; font-weight: bold; line-height: 1.9rem; text-align: center;color: #CC2828;margin: 0 0 .8rem;">Booking Rescheduled</p> 
                <p style="font-size: 1.1rem; font-weight: bold; line-height: 1.6rem; text-align: center;color: #333333;margin: 0 0 .7rem;">Hi ${userName}</p>

                <p style="font-size: 1rem; font-weight: 400; line-height: 1.5rem; text-align: center;color: #333333;margin: 0 0 1.3rem;">Your lesson with Easter Howard has been rescheduled.</p>
                <div style="max-width: 300px; margin: 0 auto 1.2rem;padding-bottom: 15px;background-image: url(pc-bg.png); background-repeat: no-repeat;background-position: bottom center;    background-size: contain;">
                    <div style="border:6px solid #CC2828;border-radius: 20px; height: 158px; padding-top: 2em;">
                        <table cellspacing="0" cellpadding="0" style="width: 100%;margin: 0">
                        <tr>
                            <td width="30%" style="font-size: 1rem; font-weight: 600; line-height: 18px;text-align: left;color: #333333;padding: 1rem 1.3rem;border-bottom: 1px solid #CC2828;">Date:</td> 
                            <td width="70%" style="font-size: 1rem; font-weight: 400; line-height: 1.3rem;text-align: left;color: #CC2828;padding: 1rem 1.3rem;border-bottom: 1px solid #CC2828;"><img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/date.png" style="max-width:100%;vertical-align: text-bottom;"> 28-05-2025</td> 
                        </tr>
                         <tr>
                            <td width="30%" style="font-size: 1rem; font-weight: 600; line-height: 18px;text-align: left;color: #333333;padding: .6rem 1.3rem;border-bottom: 1px solid #CC2828;">Time:</td> 
                            <td width="70%" style="font-size: 1rem; font-weight: 400; line-height: 1.3rem;text-align: left;color: #CC2828;padding: .6rem 1.3rem;border-bottom: 1px solid #CC2828;"><img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/time.png" style="max-width:100%;vertical-align: text-bottom;"> 02:00Pm</td> 
                        </tr>                      
                    </table>
                    </div>
                </div>

                <p style="margin: 0 0 1.3rem;text-align: center;"><a href="${link}" style="background:#CC2828;color:#fff;border-radius: 7px;font-size: 1.1rem;text-decoration: none;display: inline-block;padding: .8rem 1.5rem;">View Updated Booking</a></p> 
                <p style="font-size: 1rem; font-weight: 400; line-height: 22px; text-align: center;color: #333333;margin: 0 0 0rem;">Thanks for your flexibility!</p> 
                </td>
            </tr>

            <tr> 
              <td style="padding:0;">   
                <div style="padding: 1.3rem  1rem;background: #EFD1D1;">
                    <div style="text-align: center;">                        
                        <a href="#" style="text-decoration: none;margin-right: 10px;vertical-align: middle;"><img src="facebook_icon.png" alt="facebook"></a>
                        <a href="#" style="text-decoration: none;margin-right: 10px;vertical-align: middle;"><img src="twitter_icon.png" alt="twitter"></a>
                        <a href="#" style="text-decoration: none;margin-right: 10px;vertical-align: middle;"><img src="instagram_icon.png" alt="instagram"></a>
                    </div> 
                    <div style="text-align: center; padding: 1.1em 0 ;">
                        <a href="tel:(123) 456-7890" style="font-size: 12px; font-weight: 400; line-height: 18px;color: #CC2828;text-decoration: none;margin: 0 .5em;"><img style="margin-right: .2em; vertical-align: middle;" src="phone.png" alt="img" /> (123) 456-7890</a>
                        <a href="mailto:Algora Publishing@gmail.com" style="font-size: 12px; font-weight: 400; line-height: 18px;color: #CC2828; text-decoration: none;margin: 0 .5em;"><img src="email.png" alt="img" style="margin-right: .2em; vertical-align: middle;" /> Japaneseforme@gmail.com</a>
                    </div>
                    <p style="font-size: 12px; font-weight: 400; line-height: 18px;  text-align: center;color: #CC2828;margin: 0 auto; max-width: 260px;">© 2025 Japanese for Me. All Rights Reserved.</p>
                </div>
            </td>
        </tr> 
    </table>
</div>
    `}

