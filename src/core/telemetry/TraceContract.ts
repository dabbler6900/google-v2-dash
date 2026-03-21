/**
 * Priority 6: Trace/telemetry contract aligned with GenAI observability standards.
 * Detects behavior drift, state drift, and security drift over time.
 */

import { broadcastStateUpdate } from '../events/broadcast.js';

export type TraceEventType = 
  | 'BEHAVIOR_DRIFT' 
  | 'STATE_MUTATION' 
  | 'SECURITY_VIOLATION' 
  | 'LIFECYCLE'
  | 'VERIFICATION_RESULT'
  | 'REASONING'
  | 'COMMUNICATION';

export interface TraceEvent {
  traceId: string;
  agentId: string;
  timestamp?: string;
  eventType: TraceEventType;
  action: string;
  targetPath?: string;
  payload: Record<string, any>;
}

export class Telemetry {
  private static traces: TraceEvent[] = [];

  /**
   * Standardized telemetry logger.
   * In production, this flushes to OpenTelemetry / Datadog / LangSmith.
   */
  static log(event: TraceEvent) {
    const fullEvent = { 
      ...event, 
      timestamp: event.timestamp || new Date().toISOString() 
    };
    
    this.traces.push(fullEvent);
    broadcastStateUpdate('TELEMETRY_UPDATE', fullEvent);
    
    // Console output for local observability
    const color = event.eventType === 'SECURITY_VIOLATION' ? '\x1b[31m' : 
                  event.eventType === 'STATE_MUTATION' ? '\x1b[32m' : '\x1b[34m';
    console.log(`${color}[TELEMETRY] ${fullEvent.eventType}: ${fullEvent.action}\x1b[0m`, fullEvent.targetPath || '');
  }

  static getHistory(): TraceEvent[] {
    return this.traces;
  }
}
