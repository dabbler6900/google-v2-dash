import { google, calendar_v3 } from 'googleapis';
import { GoogleAuth } from './GoogleAuth';
import { Telemetry } from '../telemetry/TraceContract';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  attendees?: string[];
}

export class GoogleCalendar {
  private static mockEvents: CalendarEvent[] = [];

  private static getClient() {
    const session = GoogleAuth.getSession();
    if (!session.isAuthenticated || !session.accessToken) {
      throw new Error("Google Auth session is not authenticated or missing access token.");
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });
    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  /**
   * List upcoming events from the primary calendar.
   */
  static async listEvents(maxResults: number = 10): Promise<CalendarEvent[]> {
    const traceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      const calendar = this.getClient();
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = res.data.items?.map(item => ({
        id: item.id || undefined,
        summary: item.summary || 'Untitled Event',
        description: item.description || '',
        startTime: item.start?.dateTime || item.start?.date || '',
        endTime: item.end?.dateTime || item.end?.date || '',
        attendees: item.attendees?.map(a => a.email || '') || []
      })) || [];

      Telemetry.log({
        traceId,
        agentId: 'SYSTEM',
        eventType: 'LIFECYCLE',
        action: 'CALENDAR_LIST_EVENTS',
        payload: { count: events.length }
      });

      return events;
    } catch (error: any) {
      // Fallback to mock if not truly authenticated with Google
      if (error.message.includes('missing access token') || error.message.includes('Invalid Credentials') || error.code === 401 || error.status === 401) {
        Telemetry.log({
          traceId,
          agentId: 'SYSTEM',
          eventType: 'LIFECYCLE',
          action: 'CALENDAR_LIST_EVENTS_MOCK',
          payload: { count: this.mockEvents.length }
        });
        return this.mockEvents;
      }
      throw error;
    }
  }

  /**
   * Create a new event on the primary calendar.
   */
  static async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
    const traceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      const calendar = this.getClient();
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: { dateTime: event.startTime },
          end: { dateTime: event.endTime },
          attendees: event.attendees?.map(email => ({ email }))
        }
      });

      const createdEvent: CalendarEvent = {
        id: res.data.id || undefined,
        summary: res.data.summary || event.summary,
        description: res.data.description || event.description,
        startTime: res.data.start?.dateTime || event.startTime,
        endTime: res.data.end?.dateTime || event.endTime,
        attendees: res.data.attendees?.map(a => a.email || '') || event.attendees
      };

      Telemetry.log({
        traceId,
        agentId: 'SYSTEM',
        eventType: 'LIFECYCLE',
        action: 'CALENDAR_CREATE_EVENT',
        payload: { summary: event.summary }
      });

      return createdEvent;
    } catch (error: any) {
      // Fallback to mock
      if (error.message.includes('missing access token') || error.message.includes('Invalid Credentials') || error.code === 401 || error.status === 401) {
        const mockEvent = { ...event, id: `mock-id-${Date.now()}` };
        this.mockEvents.push(mockEvent);
        Telemetry.log({
          traceId,
          agentId: 'SYSTEM',
          eventType: 'LIFECYCLE',
          action: 'CALENDAR_CREATE_EVENT_MOCK',
          payload: { summary: event.summary }
        });
        return mockEvent;
      }
      throw error;
    }
  }
}
