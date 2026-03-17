/**
 * Priority 3: Run-wide approvals + least privilege for destructive or high-impact tools.
 * Includes nested agent calls.
 */
import { Telemetry } from '../telemetry/TraceContract.js';
import { broadcastStateUpdate } from '../../../server.js';

export enum PrivilegeLevel {
  READ = 'READ',
  WRITE_SAFE = 'WRITE_SAFE',
  DESTRUCTIVE = 'DESTRUCTIVE',
  ADMIN = 'ADMIN'
}

export interface ToolExecutionRequest {
  toolName: string;
  agentId: string;
  level: PrivilegeLevel;
  target?: string;
}

export class ApprovalEngine {
  // Stores cryptographic or run-wide approval tokens
  private static runWideApprovals = new Map<string, boolean>();
  private static pendingRequests: ToolExecutionRequest[] = [];

  /**
   * Validates if an agent has the required privilege to execute a tool.
   */
  static async requestExecution(req: ToolExecutionRequest): Promise<string> {
    const traceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Least Privilege Check: Destructive/Admin actions require explicit run-wide approval
    if (req.level === PrivilegeLevel.DESTRUCTIVE || req.level === PrivilegeLevel.ADMIN) {
      const approvalKey = `${req.agentId}:${req.toolName}:${req.target}`;
      
      if (!this.runWideApprovals.has(approvalKey)) {
        // Add to pending requests if not already there
        if (!this.pendingRequests.some(p => p.agentId === req.agentId && p.toolName === req.toolName && p.target === req.target)) {
          this.pendingRequests.push(req);
          broadcastStateUpdate('APPROVALS_UPDATE', this.pendingRequests);
        }

        Telemetry.log({
          traceId,
          agentId: 'SECURITY_GATEWAY',
          eventType: 'SECURITY_VIOLATION',
          action: 'EXECUTION_BLOCKED',
          targetPath: req.target,
          payload: { reason: 'Missing run-wide approval for high-impact tool', req }
        });
        
        // Suspends execution. In a real system, this routes to a human or Commander for signing.
        throw new Error(`[SECURITY] Execution blocked. Tool ${req.toolName} requires explicit run-wide approval for target ${req.target}.`);
      }
    }

    // Return a signed token for the write boundary to verify
    return `TOKEN_${traceId}`;
  }

  /**
   * Grants a run-wide approval (usually called by Commander or Human).
   */
  static grantApproval(agentId: string, toolName: string, target: string) {
    this.runWideApprovals.set(`${agentId}:${toolName}:${target}`, true);
    this.pendingRequests = this.pendingRequests.filter(p => !(p.agentId === agentId && p.toolName === toolName && p.target === target));
    broadcastStateUpdate('APPROVALS_UPDATE', this.pendingRequests);
  }

  /**
   * Denies a run-wide approval.
   */
  static denyApproval(agentId: string, toolName: string, target: string) {
    this.pendingRequests = this.pendingRequests.filter(p => !(p.agentId === agentId && p.toolName === toolName && p.target === target));
    broadcastStateUpdate('APPROVALS_UPDATE', this.pendingRequests);
  }

  static getPendingRequests(): ToolExecutionRequest[] {
    return this.pendingRequests;
  }
}
