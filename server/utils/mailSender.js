const axios = require("axios");
console.log(
  "BREVO_API_KEY:",
  process.env.BREVO_API_KEY
    ? process.env.BREVO_API_KEY.substring(0, 10)
    : "NOT FOUND"
);

const mailSender = async (email, title, body) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "StudyNotion",
          email: process.env.MAIL_FROM,
        },
        to: [
          {
            email: email,
          },
        ],
        subject: title,
        htmlContent: body,
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
      }
    );

    console.log("Email sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Brevo API Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

module.exports = mailSender;