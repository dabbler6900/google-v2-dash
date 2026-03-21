import { Telemetry } from "../telemetry/TraceContract.js";

export interface Project {
  id: string;
  name: string;
  path: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export class ProjectEngine {
  private static projects: Project[] = [];

  static init() {
    // Initial project
    this.createProject("OpenClaw Core", "/src/core", "The heart of the OpenClaw OS.");
  }

  static createProject(name: string, path: string, description: string): Project {
    const id = `proj_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const project: Project = {
      id,
      name,
      path,
      description,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.projects.push(project);
    
    Telemetry.log({
      traceId: `proj_init_${id}`,
      agentId: 'KERNEL',
      eventType: 'STATE_MUTATION',
      action: 'PROJECT_CREATED',
      payload: { name, path }
    });

    return project;
  }

  static getProjects() {
    return this.projects;
  }

  static getProject(id: string) {
    return this.projects.find(p => p.id === id);
  }
}
