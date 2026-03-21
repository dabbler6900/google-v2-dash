import { EventEmitter } from 'events';
import { Telemetry } from '../telemetry/TraceContract.js';
import { broadcastStateUpdate } from './broadcast.js';

export type MessageType = 'COMMAND' | 'STATUS' | 'QUERY' | 'RESPONSE' | 'BROADCAST';
export type MessagePriority = 'low' | 'medium' | 'high' | 'critical';

export interface AgentMessage {
  id: string;
  timestamp: string;
  sender: string;
  recipient: string | 'all';
  type: MessageType;
  payload: any;
  priority: MessagePriority;
  traceId?: string;
}

export class AgentCommBus {
  private static bus = new EventEmitter();
  private static history: AgentMessage[] = [];
  private static MAX_HISTORY = 200;

  static publish(message: Omit<AgentMessage, 'id' | 'timestamp'>): AgentMessage {
    const fullMessage: AgentMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      traceId: message.traceId || `trace_${Date.now()}`
    };

    this.history.unshift(fullMessage);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.pop();
    }

    // Emit locally for other agents to listen
    if (fullMessage.recipient === 'all') {
      this.bus.emit('broadcast', fullMessage);
    } else {
      this.bus.emit(`message:${fullMessage.recipient}`, fullMessage);
    }

    // Also emit a general 'message' event for global listeners
    this.bus.emit('message', fullMessage);

    // Broadcast to UI via WebSocket
    broadcastStateUpdate('AGENT_MESSAGE', fullMessage);

    // Log to telemetry
    Telemetry.log({
      traceId: fullMessage.traceId!,
      agentId: fullMessage.sender,
      eventType: 'COMMUNICATION',
      action: `MESSAGE_SENT:${fullMessage.type}`,
      payload: { 
        recipient: fullMessage.recipient, 
        msgId: fullMessage.id,
        type: fullMessage.type
      }
    });

    return fullMessage;
  }

  static subscribe(agentId: string, callback: (message: AgentMessage) => void) {
    this.bus.on(`message:${agentId}`, callback);
    this.bus.on('broadcast', callback);
  }

  static unsubscribe(agentId: string, callback: (message: AgentMessage) => void) {
    this.bus.off(`message:${agentId}`, callback);
    this.bus.off('broadcast', callback);
  }

  static getHistory(): AgentMessage[] {
    return this.history;
  }

  /**
   * Send a command and wait for a response (simplified RPC)
   */
  static async request(message: Omit<AgentMessage, 'id' | 'timestamp' | 'type'>): Promise<AgentMessage> {
    const msg = this.publish({ ...message, type: 'QUERY' });
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.bus.off('message', handler);
        reject(new Error(`Request timed out for message ${msg.id}`));
      }, 30000);

      const handler = (response: AgentMessage) => {
        if (response.type === 'RESPONSE' && response.payload?.requestId === msg.id) {
          clearTimeout(timeout);
          this.bus.off('message', handler);
          resolve(response);
        }
      };

      this.bus.on('message', handler);
    });
  }
}
