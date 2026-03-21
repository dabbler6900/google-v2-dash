import { broadcastStateUpdate } from './broadcast.js';
import { Telemetry } from '../telemetry/TraceContract.js';

export type EventSource = 'cron' | 'hook' | 'watcher' | 'ui' | 'discord' | 'telegram' | 'health-monitor' | 'mcp' | 'manual' | 'kernel';
export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EventStatus = 'new' | 'routed' | 'processing' | 'completed' | 'failed';

export interface AutomationEvent {
  id: string;
  timestamp: string;
  source: EventSource;
  type: string;
  project: string;
  severity: EventSeverity;
  owner: string;
  status: EventStatus;
  title: string;
  summary: string;
  payload: Record<string, any>;
  requiresApproval: boolean;
  traceId: string;
}

export class AutomationInbox {
  private static events: AutomationEvent[] = [];

  static emit(event: Omit<AutomationEvent, 'id' | 'timestamp' | 'traceId' | 'status'>): AutomationEvent {
    const id = `evt_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const traceId = `trace_${id}`;
    
    const fullEvent: AutomationEvent = {
      ...event,
      id,
      timestamp: new Date().toISOString(),
      traceId,
      status: 'new'
    };

    this.events.unshift(fullEvent);
    
    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events.pop();
    }

    // Broadcast to UI
    broadcastStateUpdate('AUTOMATION_EVENT', fullEvent);

    // Log to telemetry
    Telemetry.log({
      traceId,
      agentId: event.owner,
      eventType: 'LIFECYCLE',
      action: `EVENT_EMITTED:${event.type}`,
      payload: { eventId: id, title: event.title }
    });

    return fullEvent;
  }

  static getEvents(): AutomationEvent[] {
    return this.events;
  }

  static updateEventStatus(id: string, status: EventStatus) {
    const event = this.events.find(e => e.id === id);
    if (event) {
      event.status = status;
      broadcastStateUpdate('AUTOMATION_EVENT_UPDATED', event);
    }
  }
}
