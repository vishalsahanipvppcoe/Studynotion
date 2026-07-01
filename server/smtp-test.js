require("dotenv").config();

const nodemailer = require("nodemailer");

async function test() {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      logger: true,
      debug: true,
    });

    await transporter.verify();

    console.log("SMTP Connected");
  } catch (err) {
    console.log(err);
  }
}

test();