module.exports = (userName, multipleLessons, teacherName, lessonName) => {
    return `
    <div id="email" style="background: #fdf6f7;padding: 20px 0;">
        <table role="presentation" border="0" cellspacing="0" width="100%" style="font-family: arial;max-width:450px; margin: auto;background-color: #fff;">
            <tr>
            <td style="padding: .5rem 1rem;text-align: center;">
                <a href="https://www.akitainakaschoolonline.com/" style="text-decoration: none;">
                <img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/logo.png" alt="Japanese For Me" style="max-width:160px;">
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
                Your Bulk Lesson Purchase is Confirmed! 🎉
                </p>
                <p style="font-size: 1.1rem; font-weight: bold; text-align: center;color: #333333;margin: 0.8rem 0 .7rem;">
                Hi ${userName},
                </p>
                <p style="font-size: 1rem; line-height: 1.5rem; text-align: center;color: #333333;margin: 0 0 1rem;">
                You have successfully purchased <strong>${multipleLessons}</strong> ${lessonName} lesson(s) with <strong>${teacherName}</strong>.
                </p>
                <p style="font-size: 1rem; line-height: 1.5rem; text-align: center;color: #333333;margin: 0 0 1rem;">
                You can schedule these lessons anytime in the future at your convenience. Your purchased lessons are now added to your account as credits.
                </p>
                <p style="margin: 0 0 1.3rem; text-align: center;">
                <a href="https://akitainakaschoolonline.com/student/bulk" style="background:#55844D;color:#fff;border-radius: 7px;font-size: 1.1rem;text-decoration: none;display: inline-block;padding: .8rem 1.5rem;">
                    View Your Lesson Credits
                </a>
                </p>
                <p style="font-size: 1rem; line-height: 22px; text-align: center;color: #333333;margin: 0 0 1.5rem;">
                Thank you for choosing Japanese for Me! We're excited to support your learning journey.
                </p>
            </td>
            </tr>
            <tr>
            <td style="padding: 0rem 0rem 1rem;">
                <div style="padding: 1.3rem 0rem;background: #55844D;">
                <p style="font-size: 12px; line-height: 18px; text-align: center;color: #55844D;margin: 0 auto; max-width: 260px;">
                    © 2025 Japanese for Me. All Rights Reserved.
                </p>
                </div>
            </td>
            </tr>
        </table>
    </div>
  `;
};