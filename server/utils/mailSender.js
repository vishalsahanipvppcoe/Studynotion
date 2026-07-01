const brevo = require("@getbrevo/brevo");

const mailSender = async (email, title, body) => {
  try {
    const apiInstance = new brevo.TransactionalEmailsApi();

    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: "StudyNotion",
      email: process.env.MAIL_FROM,
    };

    sendSmtpEmail.to = [
      {
        email: email,
      },
    ];

    sendSmtpEmail.subject = title;
    sendSmtpEmail.htmlContent = body;

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("Email sent successfully:", response);

    return response;
  } catch (error) {
    console.error("Brevo Error:", error);
    throw error;
  }
};

module.exports = mailSender;