import path from "path";

import { chromium } from "playwright";
import "dotenv/config";
import { wait } from "./helpers.mjs";

const browser = await chromium.launch({
    headless: true,
    args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        `--use-file-for-fake-video-capture=${path.join(import.meta.dirname, "cat_videos", "short", "video.y4m")}`,
        `--use-file-for-fake-audio-capture=${path.join(import.meta.dirname, "cat_videos", "short", "audio.wav")}`,
    ],
});

const meetingId = process.argv[2];
if (!meetingId || !/^[a-z]{2,5}-[a-z]{2,5}-[a-z]{2,5}$/.test(meetingId)) {
    console.error("Invalid Meeting ID!");
    process.exit(1);
}

const context = await browser.newContext({
    permissions: ["microphone", "camera"],
    deviceScaleFactor: 20,
});

const page = await context.newPage();

// Navigate to Google login
console.log("Signing in")
await page.goto("https://accounts.google.com/signin");

// Fill in email
await page.fill('input[type="email"]', process.env.GOOGLE_EMAIL);
await page.click("#identifierNext");

// Wait for password field and fill it
await page.waitForSelector('input[type="password"]', { state: "visible" });
await page.fill('input[type="password"]', process.env.GOOGLE_PASSWORD);
await page.click("#passwordNext");

// Wait for login to complete
await page.waitForNavigation();

// Navigate to the Google Meet URL
console.log("Navigating to Google Meet");
await page.goto("https://meet.google.com/" + meetingId);


console.log("Configuring settings");
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
    await page.click('button[aria-label="Noise cancellation"]');
} catch (err) {
    console.error("Noise cancellation button not found");
}

// find button w/ label Close dialog
await page.click('button[aria-label="Close dialog"]');

console.log("Joining meeting");
const result = await Promise.race([
    page
        .waitForSelector('span:has-text("Join now")', { timeout: 60000 })
        .then(() => ({ type: "join", element: 'span:has-text("Join now")' })),
    page
        .waitForSelector('span:has-text("Ask to join")', { timeout: 60000 })
        .then(() => ({ type: "ask", element: 'span:has-text("Ask to join")' })),
]);

await page.click(result.element);

await wait(10000);

console.log("Cleaning up")
await page.close({ 
    runBeforeUnload: true
});
await context.close();
await browser.close();