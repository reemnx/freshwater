const accountSid = "ACfc973de553636dfe543614bf5a3a3dec";
const authToken = "19c23a904766ce9423da7ed1f3206520";
const twilioClient = require("twilio")(accountSid, authToken);

function sendSMS({ to, body }) {
  twilioClient.messages
    .create({
      body,
      messagingServiceSid: "MGf493ab523c805e68b84b7a7df10f9304",
      to,
    })
    .then((message) => console.log(message.sid))
    .done();
}

module.exports = { sendSMS };
