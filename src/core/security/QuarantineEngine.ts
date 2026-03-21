import { Telemetry } from '../telemetry/TraceContract.js';

export interface QuarantineItem {
  id: string;
  file: string;
  reason: string;
  timestamp: string;
  status: 'QUARANTINED' | 'RELEASED' | 'DELETED';
}

export class QuarantineEngine {
  private static items: QuarantineItem[] = [];

  static quarantine(file: string, reason: string) {
    const item: QuarantineItem = {
      id: `q_${Date.now()}`,
      file,
      reason,
      timestamp: new Date().toISOString(),
      status: 'QUARANTINED'
    };
    this.items.push(item);
    
    Telemetry.log({
      traceId: item.id,
      agentId: 'SECURITY_GATEWAY',
      eventType: 'SECURITY_VIOLATION',
      action: 'FILE_QUARANTINED',
      targetPath: file,
      payload: { reason }
    });
  }

  static getItems() {
    return this.items.filter(i => i.status === 'QUARANTINED');
  }
}
