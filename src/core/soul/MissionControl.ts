import { ProjectSoul } from "./ProjectSoul.js";
import { GuardrailEngine } from "../security/GuardrailEngine.js";
import { TaskEngine } from "../engine/TaskEngine.js";
import { FactoryEngine } from "../factory/FactoryEngine.js";

export class MissionControl {
  static init() {
    console.log("MissionControl Initialized.");
  }

  static generateSystemContext(): string {
    const mission = ProjectSoul.getMission();
    const goals = ProjectSoul.getGoals();
    const guardrails = GuardrailEngine.getRules().filter(r => r.enabled);
    const tasks = TaskEngine.getTasks().filter(t => t.status !== 'DONE');
    const stats = FactoryEngine.getPipelineStats();

    return `
# OPENCLAW OS SYSTEM CONTEXT (DYNAMIC)
Generated: ${new Date().toISOString()}

## MISSION DIRECTIVE
**North Star:** ${mission.northStar}
**Constraints:** ${mission.constraints.join(', ')}

## ACTIVE GOALS
${goals.map(g => `- **${g.title}**: ${g.description} (Criteria: ${g.successCriteria.join(', ')})`).join('\n')}

## GUARDRAILS (LOGIC LOCK)
These rules are enforced at the kernel level. Any attempt to bypass them will trigger a security violation.
${guardrails.map(r => `- **${r.id}**: ${r.description} (${r.type})`).join('\n')}

## CURRENT WORKLOAD (TOP 5)
${tasks.slice(0, 5).map(t => `- [${t.status}] ${t.title} (Priority: ${t.priority}, Assignee: ${t.assignee})`).join('\n')}

## SOFTWARE FACTORY STATUS
- **Total Builds:** ${stats.totalBuilds}
- **Success Rate:** ${stats.successRate.toFixed(1)}%
- **Active Deployments:** ${stats.activeDeployments}

## AGENT INSTRUCTIONS
1. Observe the current state and goals.
2. Classify incoming signals against the mission directive.
3. Act only if the action is within the guardrails.
4. Verify all outcomes and log contributions.
    `.trim();
  }

  static getSystemState() {
    return {
      mission: ProjectSoul.getMission(),
      goals: ProjectSoul.getGoals(),
      guardrails: GuardrailEngine.getRules(),
      context: this.generateSystemContext()
    };
  }
}
