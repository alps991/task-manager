const sgMail = require('@sendgrid/mail');

const apiKey = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(apiKey);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'alper.donmez490@gmail.com',
        subject: "Welcome to task manager!",
        text: `Welcome ${name}!!`
    });
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'alper.donmez490@gmail.com',
        subject: 'Goodbye!',
        text: `Good bye ${name}. We hate to see you go!`
    });
}

module.exports = { sendWelcomeEmail, sendCancellationEmail };