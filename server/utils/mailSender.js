const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    console.log("MAIL_HOST:", process.env.MAIL_HOST);
    console.log("MAIL_PORT:", process.env.MAIL_PORT);
    console.log("MAIL_USER:", process.env.MAIL_USER);
    console.log("MAIL_FROM:", process.env.MAIL_FROM);

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("SMTP Connected Successfully");

    const info = await transporter.sendMail({
      from: `"StudyNotion" <${process.env.MAIL_FROM}>`,
      to: email,
      subject: title,
      html: body,
    });

    console.log("Email sent:", info);
    return info;

  } catch (error) {
    console.error("MailSender Error:");
    console.error(error);
    throw error;
  }
};

module.exports = mailSender;