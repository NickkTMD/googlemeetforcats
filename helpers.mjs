export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const MEETING_ID_REGEX = /^[a-z]{2,5}-[a-z]{2,5}-[a-z]{2,5}$/;