// api/index.js
const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
require("dotenv").config();
const serverless = require("serverless-http");

const app = express().use(body_parser.json());

const token = process.env.TOKEN;
const mytoken = process.env.MYTOKEN; // Verification token

// Webhook verification (GET request)
app.get("/webhook", (req, res) => {
  let mode = req.query["hub.mode"];
  let challenge = req.query["hub.challenge"];
  let verify_token = req.query["hub.verify_token"];

  if (mode && verify_token) {
    if (mode === "subscribe" && verify_token === mytoken) {
      console.log("✅ Webhook Verified!");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook message handling (POST request)
app.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
    const message = body.entry[0].changes[0].value.messages[0];
    const from = message.from;
    const text = message.text?.body;
    const phone_number_id =
      body.entry[0].changes[0].value.metadata.phone_number_id;

    // Auto-reply via WhatsApp Cloud API
    axios
      .post(
        `https://graph.facebook.com/v22.0/${phone_number_id}/messages?access_token=${token}`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: `Hi.. I'm Jelle, your message is: "${text}"` },
        },
        { headers: { "Content-Type": "application/json" } }
      )
      .then(() => {
        console.log("✅ Message sent!");
      })
      .catch((err) => {
        console.error(
          "❌ Failed to send message:",
          err.response?.data || err.message
        );
      });

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Root route
app.get("/", (req, res) => {
  res.status(200).send("✅ Webhook is ready.");
});

// Export as serverless function
module.exports = app;
module.exports.handler = serverless(app);
