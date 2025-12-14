require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// 🔐 Google Auth (ENV VARIABLES)
// ===============================
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/calendar"]
);

const calendar = google.calendar({ version: "v3", auth });

// ✅ USE ONE SOURCE OF TRUTH
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

// ===============================
// GET EVENTS BY DATE (PUBLIC)
// ===============================
app.get("/events/date/:date", async (req, res) => {
  try {
    const date = req.params.date;

    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json(response.data.items || []);
  } catch (error) {
    console.error("Date fetch error:", error);
    res.status(500).json({ error: "Failed to fetch events by date" });
  }
});

// ===============================
// CREATE EVENT (ADMIN)
// ===============================
app.post("/events", async (req, res) => {
  try {
    const { summary, date, time, location, description } = req.body;

    const start = new Date(`${date}T${time}:00`).toISOString();
    const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();

    const event = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary,
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

// ===============================
// UPDATE EVENT (ADMIN)
// ===============================
app.put("/events/:id", async (req, res) => {
  try {
    const { summary, date, time, location, description } = req.body;

    const start = new Date(`${date}T${time}:00`).toISOString();
    const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();

    const event = await calendar.events.update({
      calendarId: CALENDAR_ID,
      eventId: req.params.id,
      requestBody: {
        summary,
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

// ===============================
// DELETE EVENT (ADMIN)
// ===============================
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

// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
