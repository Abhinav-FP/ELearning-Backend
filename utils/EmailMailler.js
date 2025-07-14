const nodemailer = require('nodemailer');
const logger = require('./Logger');

const sendEmail = async (data) => {
    const { email, subject, emailHtml } = data;

    let transporter = nodemailer.createTransport({
        host: "smtpout.secureserver.net",
        port: 465,
        // service: 'gmail',
        secure: true,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });
    const mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: email,
        subject: subject,
        html: emailHtml,
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("info",info);
        console.log("Email sent successfully");
    } catch (error) {
        console.log('Error sending email:', error);
        logger.error('Error sending email:', error);
        throw error; // Rethrow the error to be caught in the controller
    }
};

module.exports = sendEmail;
