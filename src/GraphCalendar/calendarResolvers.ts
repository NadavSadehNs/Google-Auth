import { Resolver, Query, Mutation, Ctx } from "type-graphql";
import { CalendarEvent } from "./calendarSchema";
import { google } from "googleapis";

@Resolver(CalendarEvent)
export class CalendarResolver {
    @Query(() => [CalendarEvent])
    // Injects the auth const
    async events(@Ctx() ctx: { authClient: any }): Promise<CalendarEvent[]> {
        try {
            // Initialized the Google Calendar API service
            const calendar = google.calendar({ version: 'v3', auth: ctx.authClient });
            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: (new Date()).toISOString(),
                maxResults: 10,
                singleEvents: true,
                orderBy: 'startTime',
            });
            // Imports the events from response data. If null => [].
            const events = response.data.items || [];

            // Maps each event from events to an event object.
            return events.map(event => ({
                summary: event.summary || "",
                start: event.start?.dateTime || event.start?.date || "",
                end: event.end?.dateTime || event.end?.date || "",
                location: event.location || "No Location Defined",
                description: event.description || "No Description",
            }));

        } catch (error) {
            console.error("Error fetching contacts:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch contacts: ${error.message}`);
            } else {
                throw new Error("Failed to fetch contacts: Unknown error occurred");
            }
        }
    }
}
