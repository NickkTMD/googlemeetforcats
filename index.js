const { chromium } = require("playwright");
const path = require("path");

console.log("Starting Google Meet bot...");

async function joinGoogleMeet(meetingUrl, email, password) {
  // convert video.mp4 to y4m via code
  // ffmpeg -i video.mp4 -pix_fmt yuv420p video.y4m

  // also convert to wav for audio (convert video.mp4)
  // ffmpeg -i video.mp4 -vn -acodec pcm_s16le -ar 44100 -ac 2 audio.wav

  const browser = await chromium.launch({
    // fullscreen

    headless: true,
    args: [
      "--use-fake-ui-for-media-stream", // Automatically allow microphone and camera permissions
      "--use-fake-device-for-media-stream", // Use fake audio and video streams
      //   "--use-file-for-fake-video-capture=./video.mp4", // Use a video file as the fake camera input
      `--use-file-for-fake-video-capture=${path.join(__dirname, "video.y4m")}`,
      `--use-file-for-fake-audio-capture=${path.join(__dirname, "audio.wav")}`,
    ],
  });

  //   set mic volume to max
  //   const context = await browser.newContext({
  //     permissions: ["microphone", "camera"],
  //     deviceScaleFactor: 2,

  const context = await browser.newContext({
    permissions: ["microphone", "camera"],
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

  //   print all spans with text
  //   const spans = await page.$$("span");
  //   for (const span of spans) {
  //     const text = await span.innerText();
  //     console.log(text);
  //   }

  // More Options
  await page.waitForSelector('button[aria-label="More options"]');
  await page.click('button[aria-label="More options"]');

  // Click settings (li with span child with text "settings")
  await page.waitForSelector('li:has-text("Settings")');
  await page.click('li:has-text("Settings")');

  // Button with aria label Noise cancellation
  await page.waitForSelector('button[aria-label="Noise cancellation"]');
  await page.click('button[aria-label="Noise cancellation"]');

  // press escape
  await page.keyboard.press("Escape");

  // Use Promise.race to wait for either button
  try {
    const result = await Promise.race([
      page
        .waitForSelector('span:has-text("Join now")', { timeout: 60000 })
        .then(() => ({ type: "join", element: 'span:has-text("Join now")' })),
      page
        .waitForSelector('span:has-text("Ask to join")', { timeout: 60000 })
        .then(() => ({ type: "ask", element: 'span:has-text("Ask to join")' })),
    ]);

    console.log(`Found ${result.type} button`);
    await page.click(result.element);
    console.log(`Clicked ${result.type} button`);
  } catch (error) {
    console.error("Error waiting for join buttons:", error);
  }

  console.log("Attempted to join the meeting");

  // Keep the browser open
  await new Promise(() => {});
}

// Replace with your actual meeting URL, email, and password
joinGoogleMeet(
  "https://meet.google.com/zod-xndz-qhx",
  process.env["GOOGLE_EMAIL"],
  process.env["GOOGLE_PASSWORD"]
);
