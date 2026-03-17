/**
 * Priority 1: Formalize invariants and enforce at every write boundary.
 * Manifest compiler + path/tool validators.
 */
import { Telemetry } from '../telemetry/TraceContract';

export class WriteBoundary {
  // Canonical paths loaded from workspace_registry.yaml
  private static canonicalPaths = new Set(['/src', '/public', '/dashboards', '/tests', '/docs']);
  
  /**
   * Intercepts and validates every file system write against structural invariants.
   */
  static async validateWrite(targetPath: string, operation: 'CREATE' | 'UPDATE' | 'DELETE'): Promise<void> {
    const rootDir = targetPath.split('/')[1]; // e.g., "src" from "/src/App.tsx"
    const traceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // 1. Enforce Canonical Paths (No new top-level folders without explicit registry update)
    if (operation === 'CREATE' && !this.canonicalPaths.has(`/${rootDir}`)) {
      Telemetry.log({
        traceId,
        agentId: 'SYSTEM_ENFORCER',
        eventType: 'SECURITY_VIOLATION',
        action: 'BLOCK_UNREGISTERED_DOMAIN',
        targetPath,
        payload: { reason: `Path /${rootDir} is not in workspace_registry.yaml` }
      });
      throw new Error(`[WRITE BOUNDARY] Invariant violation: /${rootDir} is not a canonical domain. Update registry first.`);
    }

    // 2. Enforce Anti-Duplication (e.g., no "utilities" if "utils" exists)
    if (targetPath.includes('utilities') && this.canonicalPaths.has('/src/utils')) {
       Telemetry.log({
         traceId,
         agentId: 'SYSTEM_ENFORCER',
         eventType: 'BEHAVIOR_DRIFT',
         action: 'BLOCK_SEMANTIC_DUPLICATE',
         targetPath,
         payload: { conflict: '/src/utils' }
       });
       throw new Error(`[WRITE BOUNDARY] Invariant violation: Semantic duplicate detected (utilities vs utils).`);
    }

    // 3. Log successful boundary pass
    Telemetry.log({
      traceId,
      agentId: 'SYSTEM_ENFORCER',
      eventType: 'STATE_MUTATION',
      action: `BOUNDARY_PASSED_${operation}`,
      targetPath,
      payload: { status: 'approved' }
    });
  }
}
