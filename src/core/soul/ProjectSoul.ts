import { GoogleGenAI, Type } from "@google/genai";
import { Telemetry } from "../telemetry/TraceContract.js";
import { TaskEngine } from "../engine/TaskEngine.js";

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'ACHIEVED' | 'ABANDONED';
  successCriteria: string[];
  contextPaths: string[]; // Files/folders relevant to this goal
}

export interface MissionDirective {
  northStar: string;
  constraints: string[];
  updatedAt: string;
}

export class ProjectSoul {
  private static goals: Goal[] = [];
  private static mission: MissionDirective = {
    northStar: "Build a robust, autonomous Agent OS that maximizes user value and system reliability.",
    constraints: ["Never delete root files without approval.", "Always dry-run structural changes.", "Maintain 99.9% uptime."],
    updatedAt: new Date().toISOString()
  };

  static init() {
    // Passive initialization
  }

  static getMission() {
    return this.mission;
  }

  static updateMission(northStar: string, constraints: string[]) {
    this.mission = {
      northStar,
      constraints,
      updatedAt: new Date().toISOString()
    };
    
    Telemetry.log({
      traceId: 'mission_update',
      agentId: 'COMMANDER',
      eventType: 'STATE_MUTATION',
      action: 'MISSION_UPDATED',
      targetPath: 'project_soul',
      payload: { northStar }
    });
  }

  static async defineGoal(title: string, description: string, successCriteria: string[]): Promise<Goal> {
    const goal: Goal = {
      id: `goal_${Date.now()}`,
      title,
      description,
      status: 'ACTIVE',
      successCriteria,
      contextPaths: ['/src', '/docs'] // Default broad context
    };

    this.goals.push(goal);

    Telemetry.log({
      traceId: goal.id,
      agentId: 'COMMANDER',
      eventType: 'STATE_MUTATION',
      action: 'GOAL_DEFINED',
      targetPath: 'project_soul',
      payload: { goal: title, status: 'WAITING_FOR_OPENCLAW_PLAN' }
    });

    return goal;
  }

  static getGoals() {
    return this.goals;
  }
}
