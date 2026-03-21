import { Telemetry } from "../telemetry/TraceContract.js";

export interface GuardrailRule {
  id: string;
  type: 'BANNED_TASK' | 'BANNED_PROJECT' | 'ANTI_DRIFT';
  description: string;
  enabled: boolean;
}

export class GuardrailEngine {
  private static rules: GuardrailRule[] = [
    { id: 'bypass_dry_run', type: 'BANNED_TASK', description: 'Bypass dry-run mode for critical operations', enabled: true },
    { id: 'force_delete_protected', type: 'BANNED_TASK', description: 'Force deletion of protected system files', enabled: true },
    { id: 'create_unregistered_domain', type: 'BANNED_TASK', description: 'Creation of unregistered workspace domains', enabled: true },
    { id: 'mutate_governance_without_trace', type: 'BANNED_TASK', description: 'Mutation of governance rules without telemetry trace', enabled: true },
    { id: 'legacy_test_project', type: 'BANNED_PROJECT', description: 'Interaction with legacy test projects', enabled: true },
    { id: 'unauthorized_crypto_miner', type: 'BANNED_PROJECT', description: 'Unauthorized crypto mining activities', enabled: true },
    { id: 'no_duplicate_domains', type: 'ANTI_DRIFT', description: 'Prevent duplicate workspace domains', enabled: true },
    { id: 'no_alternate_naming', type: 'ANTI_DRIFT', description: 'Enforce strict naming conventions', enabled: true }
  ];

  static init() {
    console.log("GuardrailEngine Initialized.");
  }

  static validateAction(action: string, context: any): { allowed: boolean; reason?: string } {
    // Check banned tasks
    const bannedTask = this.rules.find(r => r.type === 'BANNED_TASK' && action.toLowerCase().includes(r.id.toLowerCase()) && r.enabled);
    if (bannedTask) {
      this.logViolation(bannedTask.id, action);
      return { allowed: false, reason: `Guardrail Violation: ${bannedTask.description}` };
    }

    // Check banned projects
    if (context.project) {
      const bannedProject = this.rules.find(r => r.type === 'BANNED_PROJECT' && context.project.toLowerCase().includes(r.id.toLowerCase()) && r.enabled);
      if (bannedProject) {
        this.logViolation(bannedProject.id, `Project: ${context.project}`);
        return { allowed: false, reason: `Guardrail Violation: ${bannedProject.description}` };
      }
    }

    return { allowed: true };
  }

  private static logViolation(ruleId: string, details: string) {
    Telemetry.log({
      traceId: `guardrail_${Date.now()}`,
      agentId: 'GUARDRAIL_ENGINE',
      eventType: 'SECURITY_VIOLATION',
      action: `GUARDRAIL_TRIGGERED: ${ruleId}`,
      payload: { ruleId, details }
    });
  }

  static getRules() {
    return this.rules;
  }

  static toggleRule(id: string, enabled: boolean) {
    const rule = this.rules.find(r => r.id === id);
    if (rule) {
      rule.enabled = enabled;
    }
  }
}
