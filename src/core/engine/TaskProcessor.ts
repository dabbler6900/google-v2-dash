import { Telemetry } from '../telemetry/TraceContract.js';
import { Ralph } from '../agents/Ralph.js';

export class TaskProcessor {
  private static status: 'IDLE' | 'PROCESSING' | 'ERROR' = 'IDLE';
  private static queue: string[] = [];

  static init() {
    console.log("Task Processor Initialized. Kernel Power: 100%.");
    this.status = 'IDLE';
  }

  /**
   * The "Core" of OpenClaw. This is the "AutoForge" style autonomous engine.
   * It processes tasks by delegating them to subagents like Ralph.
   */
  static async processTask(taskId: string, description: string): Promise<{ success: boolean; result: string }> {
    this.status = 'PROCESSING';
    this.queue.push(taskId);

    Telemetry.log({
      traceId: `task_proc_${Date.now()}`,
      agentId: 'KERNEL',
      eventType: 'STATE_MUTATION',
      action: `PROCESSING_TASK: ${taskId}`,
      payload: { taskId, description }
    });

    // Delegate to Ralph for feature extraction
    const ralphResult = await Ralph.executeDirective(`Process task ${taskId}`, { description });

    this.status = 'IDLE';
    this.queue = this.queue.filter(id => id !== taskId);

    return { success: ralphResult.success, result: ralphResult.result };
  }

  static getStatus() {
    return {
      status: this.status,
      queueSize: this.queue.length,
      kernelPower: '100%',
      engine: 'AutoForge-Core-v1'
    };
  }
}
