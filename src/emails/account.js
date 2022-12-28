const sgMail = require("@sendgrid/mail");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const senderEmail = "shridharmaskeri@gmail.com";

// Welcome Email
const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: senderEmail,
    subject: "Thanks for joining in!",
    text: `Welcome to the App, ${name}`,
  });
};

// Cancelation Email
const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: senderEmail,
    subject: "Sorry to see you go!",
    text: `Goodbye, ${name}, I hope to see you back soon!`,
  });
};

module.exports = { sendWelcomeEmail, sendCancelationEmail };
