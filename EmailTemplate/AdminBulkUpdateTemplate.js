module.exports = (
  userName,
  actionType,
  reason,
  teacherName,
  lessonName,
  lessonsChanged,
  refundAmount,
) => {
  let title = "";
  let message = "";
  let buttonText = "View Your Lesson Credits";

  if (actionType === "adjust_credits") {
    if (lessonsChanged > 0) {
      title = "Your Lesson Credits Have Been Updated 🎉";
      message = `
        <p style="font-size: 1rem; line-height: 1.5rem; text-align: center;color: #333333;margin: 0 0 1rem;">
        <strong>${lessonsChanged}</strong> additional lesson credit(s) have been added to your 
        <strong>${lessonName}</strong> lessons with <strong>${teacherName}</strong>.
        </p>
      `;
    } else {
      title = "Your Lesson Credits Have Been Updated";
      message = `
        <p style="font-size: 1rem; line-height: 1.5rem; text-align: center;color: #333333;margin: 0 0 1rem;">
        <strong>${Math.abs(lessonsChanged)}</strong> lesson credit(s) have been deducted from your 
        <strong>${lessonName}</strong> lessons with <strong>${teacherName}</strong>.
        </p>
      `;
    }
  }

  if (actionType === "refund") {
    title = "Your Lesson Refund Has Been Processed 💳";

    message = `
      <p style="font-size: 1rem; line-height: 1.5rem; text-align: center;color: #333333;margin: 0 0 1rem;">
      A refund of <strong>$${refundAmount}</strong> has been processed for your 
      <strong>${lessonName}</strong> lessons with <strong>${teacherName}</strong>.
      </p>
      <p style="font-size: 0.95rem; line-height: 1.5rem; text-align: center;color: #333333;margin: 0 0 1rem;">
      The refund was issued to your original payment method and may take a few days
      depending on your bank or card provider.
      </p>
    `;
  }

  if (actionType === "cancel") {
    title = "Your Bulk Lesson Package Has Been Cancelled";

    message = `
      <p style="font-size: 1rem; line-height: 1.5rem; text-align: center;color: #333333;margin: 0 0 1rem;">
      Your bulk lesson package for <strong>${lessonName}</strong> with 
      <strong>${teacherName}</strong> has been cancelled by our support team.
      </p>
    `;
  }

  return `
    <div id="email" style="background: #fdf6f7;padding: 20px 0;">
        <table role="presentation" border="0" cellspacing="0" width="100%" style="font-family: arial;max-width:450px; margin: auto;background-color: #fff;">
            
            <tr>
            <td style="padding: .5rem 1rem;text-align: center;">
                <a href="https://www.akitainakaschoolonline.com/" style="text-decoration: none;">
                <img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/logo.png" alt="Akita Inaka School Online" style="max-width:160px;">
                </a>
            </td>
            </tr>

            <tr>
            <td style="padding: 1.5rem 1rem 2rem;">
                <img src="https://student-teacher-platform.sgp1.digitaloceanspaces.com/bulk.png" alt="banner" style="max-width:100%;margin: auto;display: block;" />
            </td>
            </tr>

            <tr>
            <td style="padding: .1rem 1rem 1rem; border-bottom: 1px solid rgba(0,0,0,.1)">

                <p style="font-size: 1.5rem; font-weight: bold; line-height: 1.9rem; text-align: center;color: #55844D;margin: 0 0 .6rem;">
                ${title}
                </p>

                <p style="font-size: 1.1rem; font-weight: bold; text-align: center;color: #333333;margin: 0.8rem 0 .7rem;">
                Hi ${userName},
                </p>

                ${message}

                ${
                  reason
                    ? `
                <p style="font-size: .95rem; line-height: 1.4rem; text-align: center;color: #555;margin: 0 0 1rem;">
                <strong>Reason:</strong> ${reason}
                </p>`
                    : ""
                }

                <p style="margin: 0 0 1.3rem; text-align: center;">
                <a href="https://akitainakaschoolonline.com/student/bulk" style="background:#55844D;color:#fff;border-radius: 7px;font-size: 1.1rem;text-decoration: none;display: inline-block;padding: .8rem 1.5rem;">
                    ${buttonText}
                </a>
                </p>

                <p style="font-size: 1rem; line-height: 22px; text-align: center;color: #333333;margin: 0 0 1.5rem;">
                If you have any questions, feel free to contact our support team.
                We're always happy to help with your learning journey.
                </p>

            </td>
            </tr>

            <tr>
            <td style="padding: 0rem 0rem 1rem;">
                <div style="padding: 1.3rem 0rem;background: #55844D;">
                <p style="font-size: 12px; line-height: 18px; text-align: center;color: #ffffff;margin: 0 auto; max-width: 260px;">
                    © 2025 Akita Inaka School Online. All Rights Reserved.
                </p>
                </div>
            </td>
            </tr>

        </table>
    </div>
  `;
};
