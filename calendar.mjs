import child_process from "child_process";
import path from "path";

import { google } from "googleapis";
import { MEETING_ID_REGEX, wait } from "./helpers.mjs";

import "dotenv/config";
import { DateTime } from "luxon";

const KEY_PATH = path.join(import.meta.dirname, "service_account.json");
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
let joinedMeetings = [];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: SCOPES,
});
const client = await auth.getClient();
const calendar = google.calendar({ version: "v3", auth: client });

while (true) {
    console.log("Checking for events...");
    const meetingUrls = await checkForEvents(auth, joinedMeetings);
    for (const meetingUrl of meetingUrls) {
        joinedMeetings.push(meetingUrl);
        const meetingId = validateMeetingUrl(meetingUrl);
        if (meetingId) {
            console.log(`Joining meeting: ${meetingId}`);
            child_process.fork("join.mjs", [meetingId]);
        }
    }

    await wait(5000);
}

function validateMeetingUrl(input) {
    let url;
    try {
        url = new URL(input);
    } catch (err) {
        return false;
    }

    if (url.hostname !== "meet.google.com") return false;
    const meetingId = url.pathname.slice(1);
    if (!meetingId || !MEETING_ID_REGEX.test(meetingId)) return false;

    return meetingId;
};

async function checkForEvents(auth, alreadyJoinedMeetings) {
    const now = DateTime.now();
    try {
        // Get all events going on now
        const res = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            timeMin: now.minus({ seconds: 1 }).toISO(),
            timeMax: now.toISO(),
            singleEvents: true,
            orderBy: "startTime",
            showHiddenInvitations: true,
        });

        let events = res.data.items;
        if (events && events.length > 0) {
            events = events.filter((event) => {
                return !alreadyJoinedMeetings.includes(event.hangoutLink);
            });

            return events.map((event) => event.hangoutLink).filter((link) => link);
        }
    } catch (err) {
        console.error("Error checking for events:", err);
    }
    
    return [];
}
