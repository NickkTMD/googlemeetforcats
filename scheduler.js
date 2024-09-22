const { google } = require("googleapis");
const path = require("path");

// Path to the service account key file
const KEY_PATH = path.join(process.cwd(), "service_account.json");

// Scope for read-only access to the calendar
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

// Function to create an authorized client using a service account
function authorize() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: SCOPES,
  });
  return auth.getClient();
}

// Function to list events
async function listEvents(auth) {
  const calendar = google.calendar({ version: "v3", auth });
  const now = new Date().toISOString();
  try {
    // list all calendar events
    // debug / binding.pry
    console.log("Listing events...");

    const res = await calendar.events.list({
      calendarId: "Zmx1ZmZsZXMyNDI0NUBnbWFpbC5jb20", // or use a specific calendar ID
      singleEvents: true,
      orderBy: "startTime",
      showHiddenInvitations: true,
      // show non-accepted invites
      timeMin: now,
    });
    const events = res.data.items;

    if (!events || events.length === 0) {
      console.log("No upcoming events found.");
      return;
    }
    console.log("Upcoming events:");
    events.forEach((event) => {
      const start = event.start.dateTime || event.start.date;
      console.log(`${start} - ${event.summary}`);
    });
  } catch (err) {
    console.error("The API returned an error:", err);
  }
}

// Main function to run the script
async function main() {
  try {
    const auth = await authorize();
    await listEvents(auth);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
