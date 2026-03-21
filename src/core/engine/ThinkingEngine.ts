import { GoogleGenAI, Type } from "@google/genai";
import { Telemetry } from "../telemetry/TraceContract.js";
import { TaskEngine } from "../engine/TaskEngine.js";
import { ProjectEngine } from "../engine/ProjectEngine.js";

export class ThinkingEngine {
  private static ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  static async generateProjectPlan(projectId: string): Promise<{ success: boolean; tasksCreated: number }> {
    if (!process.env.GEMINI_API_KEY) {
      console.error("CRITICAL: GEMINI_API_KEY is not set in environment variables.");
      return { success: false, tasksCreated: 0 };
    }
    const project = ProjectEngine.getProject(projectId);
    if (!project) return { success: false, tasksCreated: 0 };

    Telemetry.log({
      traceId: `plan_${projectId}`,
      agentId: 'KERNEL',
      eventType: 'STATE_MUTATION',
      action: 'GENERATING_PLAN',
      payload: { projectName: project.name }
    });

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a detailed task list for the project: "${project.name}". Description: "${project.description}". The tasks should follow a logical development flow.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                assignee: { type: Type.STRING, enum: ['COMMANDER', 'RALPH', 'DBAgent', 'SecurityScanner'] },
                priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }
              },
              required: ['title', 'description', 'assignee', 'priority']
            }
          }
        }
      });

      const tasks = JSON.parse(response.text || '[]');
      let count = 0;

      for (const t of tasks) {
        const task = await TaskEngine.createTask(t.title, t.description, t.assignee, projectId);
        task.priority = t.priority;
        count++;
      }

      Telemetry.log({
        traceId: `plan_complete_${projectId}`,
        agentId: 'KERNEL',
        eventType: 'STATE_MUTATION',
        action: 'PLAN_GENERATED',
        payload: { tasksCreated: count }
      });

      return { success: true, tasksCreated: count };
    } catch (error) {
      console.error("Thinking Engine Error:", error);
      return { success: false, tasksCreated: 0 };
    }
  }
}
