require("dotenv/lib/main").config();
const express = require("express");
const cors = require("cors");
const { google } = require("googleapis/build/src");

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Load service account
const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json",
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });

// 🔹 Replace with your calendar ID
const CALENDAR_ID = "manjugymanja@gmail.com";

/* ===============================
   GET EVENTS (PUBLIC / USER)
================================ */
app.get("/events", async (req, res) => {
  try {
    const { date } = req.query;

    let timeMin, timeMax;

    if (date) {
      timeMin = new Date(`${date}T00:00:00`).toISOString();
      timeMax = new Date(`${date}T23:59:59`).toISOString();
    }

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json(response.data.items || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

/* ===============================
   CREATE EVENT (ADMIN)
================================ */
app.post("/events", async (req, res) => {
  try {
const { summary, date, time, location, description } = req.body;

    const start = new Date(`${date}T${time}:00`).toISOString();
    const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();

    const event = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
summary: summary,
        location,
        description,
        start: { dateTime: start },
        end: { dateTime: end },
      },
    });

    res.json(event.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

/* ===============================
   UPDATE EVENT (ADMIN)
================================ */
app.put("/events/:id", async (req, res) => {
  try {
const { summary, date, time, location, description } = req.body;

    const start = new Date(`${date}T${time}:00`).toISOString();
    const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();

    const event = await calendar.events.update({
      calendarId: CALENDAR_ID,
      eventId: req.params.id,
      requestBody: {
summary: summary,
        location,
        description,
        start: { dateTime: start },
        end: { dateTime: end },
      },
    });

    res.json(event.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update event" });
  }
});

/* ===============================
   DELETE EVENT (ADMIN)
================================ */
app.delete("/events/:id", async (req, res) => {
  try {
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: req.params.id,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});

