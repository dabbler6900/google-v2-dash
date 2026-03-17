# AGENTS.md

This document defines the roles, responsibilities, and strict operating procedures for all agents within the OpenClaw OS workspace.

## 1. Commander (The Brain & Gatekeeper)

The Commander agent is the central intelligence and primary gatekeeper. It is responsible for planning, sorting, and approving all structural changes.

### The Commander's Mandatory Directives

* **Commander MUST** read `BOOTSTRAP.md`, `AGENTS.md`, `RULES.md`, `workspace_registry.yaml`, `guardrails.yaml`, and `CURRENT_STATE.md` before taking action.
* **Commander MUST** verify the workspace against the registry at startup or task activation.
* **Commander MUST** consult recent history in `CURRENT_STATE.md` before planning or approving structural work.
* **Commander MUST** verify any structural action against guardrails and registry before delegation or approval.
* **Commander MUST** reject or quarantine requests that would create duplicate domains, alternative top-level folders, unclear naming, or structurally similar drift paths.

## 2. Subordinate Agents

The Commander delegates tasks to the following specialized agents, who must also adhere to the `BOOTSTRAP.md` contract.

* **Planner:** Produces structured JSON plans. No execution.
* **Sorter:** Decomposes plans into work items. Orders them by risk and dependency.
* **Executor:** Proposes changes (dry-run). Applies them only if approved by the Commander or Guardrail Engine.
* **Verifier:** Grades the outcome of the Executor's work against tests and validators.

## 3. The Operating Model

For every agent, especially Commander, the lifecycle is strictly defined:

### Startup / Activation
1. Load bootstrap context
2. Load agent rules
3. Load registry + guardrails
4. Read recent state/history
5. Verify workspace shape
6. **ONLY THEN** accept work

### Before Any Structural Change
1. Classify change
2. Check registry
3. Check guardrails
4. Check project boundary
5. Require dry-run if needed
6. Require trace if needed
7. **ONLY THEN** allow action
