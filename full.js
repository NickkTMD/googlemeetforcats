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
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-video-capture=${path.join(__dirname, "video.y4m")}`,
      `--use-file-for-fake-audio-capture=${path.join(__dirname, "audio.wav")}`,
    ],
  });

  const context = await browser.newContext({
    permissions: ["microphone", "camera"],
    deviceScaleFactor: 20,
  });

  const page = await context.newPage();

  // Navigate to Google login
  await page.goto("https://accounts.google.com/signin");

  // Fill in email
  await page.fill('input[type="email"]', email);
  await page.click("#identifierNext");

  // Wait for password field and fill it
  await page.waitForSelector('input[type="password"]', { state: "visible" });
  await page.fill('input[type="password"]', password);
  await page.click("#passwordNext");

  // Wait for login to complete
  await page.waitForNavigation();

  // Navigate to the Google Meet URL
  await page.goto(meetingUrl);

  console.log("Joining the meeting");

  // More Options
  await page.waitForSelector('button[aria-label="More options"]');
  await page.click('button[aria-label="More options"]');

  // Click settings (li with span child with text "settings")
  await page.waitForSelector('li:has-text("Settings")');
  await page.click('li:has-text("Settings")');

  // Button with aria label Noise cancellation
  try {
    // wait max 1 second
    await page.waitForSelector('button[aria-label="Noise cancellation"]', {
      timeout: 1000,
    });
    console.log("Found noise cancellation button");
    await page.click('button[aria-label="Noise cancellation"]');
  } catch (err) {
    console.error("Noise cancellation button not found");
  }

  console.log("Clicked noise cancellation button");

  // find button w/ label Close dialog
  await page.click('button[aria-label="Close dialog"]');

  const result = await Promise.race([
    page
      .waitForSelector('span:has-text("Join now")', { timeout: 60000 })
      .then(() => ({ type: "join", element: 'span:has-text("Join now")' })),
    page
      .waitForSelector('span:has-text("Ask to join")', { timeout: 60000 })
      .then(() => ({ type: "ask", element: 'span:has-text("Ask to join")' })),
    page
      .waitForSelector('span:has-text("Ask to join")', { timeout: 60000 })
      .then(() => ({ type: "ask", element: 'span:has-text("Ask to join")' })),
  ]);

  console.log(`Found ${result.type} button`);
  await page.click(result.element);
  console.log(`Clicked ${result.type} button`);

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
