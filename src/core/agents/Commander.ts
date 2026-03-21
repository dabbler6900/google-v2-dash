import { Telemetry } from "../telemetry/TraceContract.js";
import { MissionControl } from "../soul/MissionControl.js";
import { GuardrailEngine } from "../security/GuardrailEngine.js";

export class Commander {
  static init() {
    console.log("Commander Agent Initialized. Using OpenClaw Local Thinking Gateway.");
  }

  /**
   * Commander reasons about actions by communicating with the local Thinking Gateway.
   * This ensures "OpenClaw Only" logic and prevents external dependency drift.
   */
  static async reasonAboutAction(action: string, context: any): Promise<{ allowed: boolean; reasoning: string; suggestions?: string[] }> {
    const systemContext = MissionControl.generateSystemContext();
    
    try {
      // Pointing to the local Thinking Gateway as requested
      const response = await fetch('http://localhost:3000/api/system/thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          context,
          systemContext
        })
      });

      if (!response.ok) {
        throw new Error(`Thinking Gateway responded with ${response.status}`);
      }

      const result = await response.json();
      
      Telemetry.log({
        traceId: `commander_reason_${Date.now()}`,
        agentId: 'COMMANDER',
        eventType: 'REASONING',
        action: `REASONED_ACTION: ${action}`,
        payload: { action, result }
      });

      return result;
    } catch (err: any) {
      console.error("Commander reasoning failed:", err);
      
      // Fallback to local deterministic logic if gateway is unreachable
      return this.localDeterministicReasoning(action, context);
    }
  }

  /**
   * Local deterministic reasoning engine (The "Logic Lock" fallback).
   */
  private static localDeterministicReasoning(action: string, context: any): { allowed: boolean; reasoning: string; suggestions: string[] } {
    const guardrailResult = GuardrailEngine.validateAction(action, context);
    
    if (!guardrailResult.allowed) {
      return {
        allowed: false,
        reasoning: `OpenClaw Kernel blocked action: ${guardrailResult.reason}`,
        suggestions: ["Modify action to comply with system guardrails", "Request security override"]
      };
    }

    return {
      allowed: true,
      reasoning: "Action validated against local guardrails. No immediate violations detected.",
      suggestions: ["Proceed with caution", "Monitor telemetry for side effects"]
    };
  }
}
