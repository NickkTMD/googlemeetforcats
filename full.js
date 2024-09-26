const { google } = require("googleapis");
const { chromium } = require("playwright");
const path = require("path");

const KEY_PATH = path.join(process.cwd(), "service_account.json");
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

function authorize() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: SCOPES,
  });
  return auth.getClient();
}

async function checkForEvents(auth, alreadyJoinedMeetings) {
  const calendar = google.calendar({ version: "v3", auth });
  const now = new Date();
  const fiveMinutesLater = new Date(now.getTime() + 5 * 60000);

  try {
    const res = await calendar.events.list({
      calendarId: "fluffles24245@gmail.com",
      timeMin: now.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    let events = res.data.items;
    if (events && events.length > 0) {
      // filter out alreadyJoinedMeetings

      events = events.filter((event) => {
        return (
          !alreadyJoinedMeetings.includes(event.hangoutLink) &&
          new Date(event.start.dateTime) < fiveMinutesLater
        );
      });

      return events.map((event) => event.hangoutLink);
    }
  } catch (err) {
    console.error("Error checking for events:", err);
  }
  return null;
}

async function joinGoogleMeet(meetingUrl, email, password) {
  

  //   await new Promise((resolve) => setTimeout(resolve, 30000));
  // await browser.close();
}

async function main() {
  const auth = await authorize();
  const email = process.env["GOOGLE_EMAIL"];
  const password = process.env["GOOGLE_PASSWORD"];

  // list of meeting ids joined and so we don't join the same meeting twice
  const joinedMeetings = [];

  while (true) {
    console.log("Checking for events...");
    const meetingUrls = await checkForEvents(auth, joinedMeetings);
    for (const meetingUrl of meetingUrls) {
      joinedMeetings.push(meetingUrl);

      console.log(`Joining meeting: ${meetingUrl}`);

      //   make new thread to join meeting and keep checking for events

      joinGoogleMeet(meetingUrl, email, password).catch(console.error);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before next check
  }
}

main().catch(console.error);
