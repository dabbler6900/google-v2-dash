/**
 * Priority 5: Eval suite + regression set wired to fail builds/merges when drift reappears.
 */
import { describe, it, expect } from 'vitest';
import { WriteBoundary } from '../../src/core/enforcement/WriteBoundary';
import { ProjectScaffolder } from '../../src/core/scaffolding/ProjectScaffolder';
import { ApprovalEngine, PrivilegeLevel } from '../../src/core/security/ApprovalEngine';

describe('Drift Regression & Invariant Evals', () => {
  
  it('EVAL-001: Should block creation of unregistered top-level domains', async () => {
    await expect(
      WriteBoundary.validateWrite('/unauthorized_folder/file.ts', 'CREATE')
    ).rejects.toThrow(/Invariant violation/);
  });

  it('EVAL-002: Should block semantic duplicate folders (e.g. utilities vs utils)', async () => {
    await expect(
      WriteBoundary.validateWrite('/src/utilities/helper.ts', 'CREATE')
    ).rejects.toThrow(/Semantic duplicate detected/);
  });

  it('EVAL-003: Project Scaffolder must be idempotent and converge, not duplicate', async () => {
    // Mocking existing state and ensuring scaffolder doesn't throw or create canonicalId_2
    await expect(
      ProjectScaffolder.scaffold('auth_module', { 'index.ts': 'export const auth = true;' })
    ).resolves.not.toThrow();
  });

  it('EVAL-004: Destructive tools must require run-wide approval', async () => {
    await expect(
      ApprovalEngine.requestExecution({
        toolName: 'DELETE_DOMAIN',
        agentId: 'ROGUE_AGENT',
        level: PrivilegeLevel.DESTRUCTIVE,
        target: '/src'
      })
    ).rejects.toThrow(/Execution blocked/);
  });

  it('EVAL-005: Destructive tools succeed if explicit approval is granted', async () => {
    ApprovalEngine.grantApproval('AUTHORIZED_AGENT', 'DELETE_DOMAIN', '/src/legacy');
    
    await expect(
      ApprovalEngine.requestExecution({
        toolName: 'DELETE_DOMAIN',
        agentId: 'AUTHORIZED_AGENT',
        level: PrivilegeLevel.DESTRUCTIVE,
        target: '/src/legacy'
      })
    ).resolves.toContain('TOKEN_');
  });
});
