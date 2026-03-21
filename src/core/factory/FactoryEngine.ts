import { Telemetry } from "../telemetry/TraceContract.js";

export interface Build {
  id: string;
  commitHash: string;
  status: 'QUEUED' | 'BUILDING' | 'SUCCESS' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  logs: string[];
  artifactUrl?: string;
}

export interface Deployment {
  id: string;
  buildId: string;
  environment: 'STAGING' | 'PRODUCTION';
  status: 'PENDING' | 'DEPLOYING' | 'ACTIVE' | 'FAILED';
  url?: string;
  deployedAt?: string;
}

export interface AgentContribution {
  agentId: string;
  action: string;
  timestamp: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class FactoryEngine {
  private static builds: Build[] = [];
  private static deployments: Deployment[] = [];
  private static contributions: AgentContribution[] = [];

  static init() {
    console.log("FactoryEngine Initialized.");
  }

  static async startBuild(commitHash: string): Promise<Build> {
    const id = `build_${Date.now()}`;
    const build: Build = {
      id,
      commitHash,
      status: 'QUEUED',
      startedAt: new Date().toISOString(),
      logs: ["Build queued by OpenClaw Pipeline."]
    };
    this.builds.push(build);
    
    Telemetry.log({
      traceId: id,
      agentId: 'PIPELINE',
      eventType: 'LIFECYCLE',
      action: 'BUILD_QUEUED',
      payload: { commitHash }
    });

    // Simulate build process
    this.simulateBuild(build);
    return build;
  }

  private static async simulateBuild(build: Build) {
    build.status = 'BUILDING';
    build.logs.push("Compiling source code...");
    
    setTimeout(() => {
      build.status = 'SUCCESS';
      build.completedAt = new Date().toISOString();
      build.logs.push("Build successful. Artifact generated.");
      build.artifactUrl = `https://storage.openclaw.io/artifacts/${build.id}.zip`;
      
      Telemetry.log({
        traceId: build.id,
        agentId: 'PIPELINE',
        eventType: 'LIFECYCLE',
        action: 'BUILD_SUCCESS',
        payload: { artifact: build.artifactUrl }
      });
    }, 15000);
  }

  static async deploy(buildId: string, environment: 'STAGING' | 'PRODUCTION'): Promise<Deployment> {
    const id = `deploy_${Date.now()}`;
    const deployment: Deployment = {
      id,
      buildId,
      environment,
      status: 'PENDING'
    };
    this.deployments.push(deployment);

    Telemetry.log({
      traceId: id,
      agentId: 'DEPLOYER',
      eventType: 'LIFECYCLE',
      action: 'DEPLOYMENT_REQUESTED',
      payload: { buildId, environment }
    });

    this.simulateDeployment(deployment);
    return deployment;
  }

  private static async simulateDeployment(deployment: Deployment) {
    deployment.status = 'DEPLOYING';
    
    setTimeout(() => {
      deployment.status = 'ACTIVE';
      deployment.deployedAt = new Date().toISOString();
      deployment.url = `https://${deployment.environment.toLowerCase()}.openclaw.io`;
      
      Telemetry.log({
        traceId: deployment.id,
        agentId: 'DEPLOYER',
        eventType: 'LIFECYCLE',
        action: 'DEPLOYMENT_ACTIVE',
        payload: { url: deployment.url }
      });
    }, 10000);
  }

  static logContribution(agentId: string, action: string, impact: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM') {
    this.contributions.push({
      agentId,
      action,
      timestamp: new Date().toISOString(),
      impact
    });
  }

  static getBuilds() { return this.builds; }
  static getDeployments() { return this.deployments; }
  static getContributions() { return this.contributions; }
  
  static getPipelineStats() {
    return {
      totalBuilds: this.builds.length,
      successRate: this.builds.length > 0 ? (this.builds.filter(b => b.status === 'SUCCESS').length / this.builds.length) * 100 : 0,
      activeDeployments: this.deployments.filter(d => d.status === 'ACTIVE').length,
      recentContributions: this.contributions.slice(-10)
    };
  }
}
