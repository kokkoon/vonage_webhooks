const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const axios = require("axios");

const { Auth } = require('@vonage/auth');
const { Vonage } = require('@vonage/server-sdk');
const { WhatsAppText } = require('@vonage/messages');
const { Channels } = require('@vonage/verify2');
const { Meetings, MeetingType } = require('@vonage/meetings');
const vonage = new Vonage ({
    apiKey: process.env.apiKey,
    apiSecret: process.env.apiSecret,
    applicationId: process.env.VONAGE_APPLICATION_ID,
    privateKey: process.env.VONAGE_PRIVATE_KEY_PATH
});
var verifyId = "";

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/webhooks/inbound-messages', async (req,res) => {
    const TO_NUMBER = req.body.from;
    console.log("to: ", TO_NUMBER);
    var message = req.body.text;
    if (verifyId != "") {
        message = await vonage.verify2.checkCode(verifyId, message);
    };
    /*
    vonage.messages.send(
        new WhatsAppText({
          text: "This is a WhatsApp Message text message sent using the Messages API",
          to: TO_NUMBER,
          from: process.env.VONAGE_NUMBER,
        }),
      )
        .then(resp => {
            console.log(resp.messageUUID);
            res.send("OK");
        })
        .catch(err => {
            console.error(err);
            res.error(err);
        });
    */
    await axios.post(
        "https://messages-sandbox.nexmo.com/v0.1/messages",
        {
          from: {
            type: "whatsapp",
            number: process.env.VONAGE_NUMBER,
          },
          to: {
            type: "whatsapp",
            number: TO_NUMBER,
          },
          message: {
            content: {
              type: "text",
              text: message,
            },
          },
        },
        {
          auth: {
            username: process.env.VONAGE_API_KEY,
            password: process.env.VONAGE_API_SECRET,
          },
        }
      );
});

app.post('/webhooks/message-status', (req, res) => {
console.log("status: ", req.body);
res.status(200).end();
});

app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.get('/sendsms/:to', async (req, res) => {
    await vonage.sms.send({to:req.params.to, from:"6583327738", text:"hi there!"})
    .then(resp => {
        console.log(resp);
        res.send('Mesage sent successfully');
    })
    .catch(err => { res.send(err); });
});

app.get('/sendverify/:to', async (req,res) => {
    verifyId = "";
    /*
    await vonage.verify2.newRequest({
        brand: "KKG DEMO",
        workflow: [
          {
            channel: Channels.SMS,
            to: req.params.to,
          }
        ]
      })
        .then(({requestId}) => {
            verifyId = requestId;
            console.log('Code sent successfully');
            res.json({"requestId": requestId});
        })
        .catch(err => {console.error(err); res.json({"requestId": 1234});});
    */
   res.json({"requestId":1233})
});

app.post('/verify', async (req, res) => {
    var requestId = req.body.requestId;
    var code = req.body.code;
    vonage.verify2.checkCode(requestId, code)
    .then(async status => {
        console.log(`The status is ${status}`) ;
        const meetingsClient = new Meetings(credentials, options);
        await meetingsClient.createRoom({
          type: MeetingType.INSTANT,
          displayName: ROOM_DISPLAY_NAME,
        });
        res.json({"status": status});
})
    .catch(err => {
        console.error(err);
        res.json({"status": failed});
    });
});

app.post('/verifytest', async (req, res) => {
    var requestId = req.body.requestId;
    var code = req.body.code;
    console.log("requestId: ", requestId, " code: ", code);
    const credentials = new Auth({
        applicationId: process.env.VONAGE_APPLICATION_ID,
        privateKey: process.env.VONAGE_PRIVATE_KEY_PATH
      });
    const options = {};
    const meetingsClient = new Meetings(credentials, options);
    var meeting = await meetingsClient.createRoom({
        type: MeetingType.INSTANT,
        displayName: "KK Demo Meeting",
      });
    console.log("Meeting: ", meeting);
    res.json({"status":"success", "guest_link":meeting.hostUrl, "host_link":meeting.guestUrl});
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});