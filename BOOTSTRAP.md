# BOOTSTRAP.md

**Bootstrap is not a one-time setup step. It is the mandatory startup and task-activation contract for all agents operating in this workspace.**

## 1. The Startup Contract
Before accepting any work, planning any task, or executing any change, every agent (especially Commander) MUST execute the following preflight sequence.

### Mandatory Reading Order
You must load and read context in this exact order to build your situational awareness:
1. `BOOTSTRAP.md` (This file - The Contract)
2. `AGENTS.md` (Roles and Responsibilities)
3. `RULES.md` (Constraints and Prohibitions)
4. `workspace_registry.yaml` (Canonical Structure)
5. `guardrails.yaml` (Hard Boundaries)
6. `CURRENT_STATE.md` (Recent History and Fragility)
7. Relevant `project.yaml` (If operating inside a protected project)
8. Relevant task or queue file (If task-driven)

## 2. Preflight Checks & Structural Verification
After loading the context above, you must verify the workspace matches the registry. 
**This verification must be brownfield-safe.**

* **DO:** Report current reality.
* **DO:** Block new drift.
* **DO:** Warn on legacy drift (e.g., unknown top-level folders, duplicate governance files).
* **DO:** Route ambiguity to review/quarantine.
* **DO NOT:** Silently mutate structure. Do not instantly move or delete things without explicit approval.

## 3. Operating Context
To operate safely, you must understand the current environment:

* **System Identity:** This is a tightly controlled, deterministic LLM-OS workspace. The main goal is structural integrity and zero-drift execution.
* **Active Protected Assets:** `dashboards/CENTRAL_CONTROL`, `registry.yml`, `guardrails.yml`.
* **Known Drift Zones:** Watch out for nested pseudo-workspaces, duplicate governance files, and legacy folders currently under review.
* **Uncertainty Routing:** If unsure about a file's placement or purpose, put it in the quarantine inbox. Do not guess. Do not create a new folder.
