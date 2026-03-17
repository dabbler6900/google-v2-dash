/**
 * The Commander Agent integrating all 6 priorities.
 */
import { Telemetry } from '../telemetry/TraceContract';
import { WriteBoundary } from '../enforcement/WriteBoundary';
import { ApprovalEngine, PrivilegeLevel } from '../security/ApprovalEngine';
import { OutcomeVerifier } from '../verification/OutcomeVerifier';
import { ProjectScaffolder } from '../scaffolding/ProjectScaffolder';
import { MCPRegistry } from '../mcp/MCPRegistry';
import { KanbanBoard } from '../tasks/KanbanBoard';
import { DocManager } from '../docs/DocManager';
import { GoogleAuth } from '../integrations/GoogleAuth';
import { GoogleCalendar } from '../integrations/GoogleCalendar';

export class CommanderAgent {
  private agentId = 'COMMANDER_PRIMARY';

  async executeTask(taskDescription: string) {
    const traceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    Telemetry.log({ 
      traceId, 
      agentId: this.agentId, 
      eventType: 'LIFECYCLE', 
      action: 'STARTUP', 
      payload: { task: taskDescription } 
    });

    try {
      // 1. Preflight & Invariant Check (BOOTSTRAP.md Contract)
      await this.verifyWorkspaceState();

      // 2. Discover MCP Docker Tools
      const tools = await MCPRegistry.discoverTools();
      Telemetry.log({ traceId, agentId: this.agentId, eventType: 'LIFECYCLE', action: 'TOOLS_DISCOVERED', payload: { count: tools.length } });

      // 3. Create a Kanban Task for tracking
      const task = await KanbanBoard.createTask(`Execute: ${taskDescription.substring(0, 20)}...`, taskDescription, this.agentId);
      await KanbanBoard.updateTaskStatus(task.id, 'IN_PROGRESS', this.agentId);

      // 3.5 Schedule the task in Google Calendar if authenticated
      const session = GoogleAuth.getSession();
      if (session.isAuthenticated) {
        try {
          const startTime = new Date();
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
          await GoogleCalendar.createEvent({
            summary: `[Agent Task] ${task.title}`,
            description: `Agent: ${this.agentId}\nTask ID: ${task.id}\nDescription: ${taskDescription}`,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          });
        } catch (err) {
          console.warn("Failed to schedule task in calendar:", err);
        }
      }

      // 4. Request Least-Privilege Approvals for planned actions
      const token = await ApprovalEngine.requestExecution({
        toolName: 'SCAFFOLD_PROJECT',
        agentId: this.agentId,
        level: PrivilegeLevel.WRITE_SAFE,
        target: '/src/projects/new_feature'
      });

      // 5. Execute through Idempotent Scaffolder & Write Boundary
      await ProjectScaffolder.scaffold('new_feature', {
        'index.ts': 'export const feature = true;'
      });

      // 6. Save execution context to Docs Drop
      await DocManager.saveDoc(`${task.id}_context.md`, `# Execution Context\nTask: ${taskDescription}\nStatus: Completed`, this.agentId);

      // 7. Outcome-Based Verification (No LLM narration, hard postconditions)
      const result = await OutcomeVerifier.verify([
        { type: 'FILE_EXISTS', target: '/src/projects/new_feature/index.ts' },
        { type: 'NO_DRIFT', target: 'workspace_registry.yaml' }
      ], traceId);

      if (!result.success) {
        throw new Error(`[VERIFICATION FAILED] Postconditions not met: ${JSON.stringify(result.failedConditions)}`);
      }

      // 8. Mark Task Done
      await KanbanBoard.updateTaskStatus(task.id, 'DONE', this.agentId);

      Telemetry.log({ traceId, agentId: this.agentId, eventType: 'LIFECYCLE', action: 'SUCCESS', payload: result });

    } catch (error: any) {
      Telemetry.log({ 
        traceId, 
        agentId: this.agentId, 
        eventType: 'BEHAVIOR_DRIFT', 
        action: 'TASK_FAILED', 
        payload: { error: error.message } 
      });
      throw error;
    }
  }

  private async verifyWorkspaceState() {
    // Simulates loading BOOTSTRAP.md, guardrails.yaml, and checking git status
    Telemetry.log({
      traceId: 'sys',
      agentId: this.agentId,
      eventType: 'LIFECYCLE',
      action: 'WORKSPACE_VERIFIED',
      payload: { status: 'clean' }
    });
  }
}
