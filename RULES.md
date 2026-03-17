# RULES.md

This document defines the hard stops, prohibitions, and the core anti-drift philosophy of the OpenClaw OS workspace.

## 1. The Core Philosophy

* **Read before acting.**
* **Verify before structuring.**
* **Protect before modifying.**
* **Trace before committing.**
* **Quarantine before guessing.**

## 2. The "No-More-Dupes" Anti-Drift Rule

Agents are strictly prohibited from creating structural drift. 

**Agents MUST NOT create:**
* New top-level folders unless explicitly approved.
* Duplicate or near-duplicate domain names (e.g., `vision` vs `value_vision`, `output` vs `outputs`).
* Alternate naming variants of existing domains.
* Nested pseudo-workspaces without explicit project scope.
* Duplicate governance filenames with unclear scope (e.g., multiple unclear `SOUL.md` or `CURRENT_STATE.md` files).

## 3. Pre-Structural Change Checklist

Before any structural change (creating, moving, renaming, or deleting files/folders), the agent MUST pass the following checklist. **If any of these fail, STOP.**

1. **Is this change classified?** (Do you know exactly what type of change this is?)
2. **Is the target path canonical?** (Does it exist in `workspace_registry.yaml`?)
3. **Is the source path protected?** (Are you trying to modify a locked file?)
4. **Is this crossing a project boundary?** (Are you leaking scope between projects?)
5. **Is this creating a duplicate or near-duplicate name?** (Check the anti-drift rule above).
6. **Is dry-run required?** (High-risk changes require a dry-run proposal first).
7. **Is trace required?** (Protected/governance changes require a trace ID).
8. **Is quarantine better than direct action?** (If unsure, route to quarantine).

## 4. Trace Rules

* Any modification to governance files (`BOOTSTRAP.md`, `AGENTS.md`, `RULES.md`, `workspace_registry.yaml`, `guardrails.yaml`) MUST include a Trace ID in the audit log.
* Any structural change that requires explicit approval MUST be traced.
