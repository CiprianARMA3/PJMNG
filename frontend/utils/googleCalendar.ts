// // utils/googleCalendar.ts

//-------------README--------------

// THIS IS THE PROJECT SETUP CODE, YOU'LL NEED TO IMPORT THE NEXT_GOOGLEAPI IN THE .ENV.LOCAL AND CHANGE THE TSX /CALENDAR/PAGE.TSX LOGIC



//
// export type GoogleCalendarEvent = {
//   id: string;
//   start: Date;
//   end: Date;
//   title: string;
//   description?: string | null;
//   lead: string;
//   category: string;
//   categoryColor: string;
// };

// export async function fetchGoogleCalendarEvents(
//   calendarId: string,
//   timeMin: string,
//   timeMax: string
// ): Promise<GoogleCalendarEvent[]> {
//   const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
//   if (!apiKey) throw new Error("Missing GOOGLE_CALENDAR_API_KEY");

//   const res = await fetch(
//     `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
//       calendarId
//     )}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`
//   );

//   if (!res.ok) {
//     const text = await res.text();
//     throw new Error(`Google Calendar fetch failed: ${text}`);
//   }

//   const data = await res.json();

//   return (data.items || []).map((e: any) => ({
//     id: e.id,
//     start: new Date(e.start.dateTime || e.start.date),
//     end: new Date(e.end.dateTime || e.end.date),
//     title: e.summary || "No Title",
//     description: e.description || null,
//     lead: e.organizer?.displayName || "Unknown",
//     category: "Google Calendar",
//     categoryColor: "#4285F4", // Google Blue
//   }));
// }



