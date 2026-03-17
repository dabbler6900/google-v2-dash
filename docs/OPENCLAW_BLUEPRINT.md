# OpenClaw OS: Core Architecture & Ralph Loop Blueprint

> *"Mission control + autonomous operator + governed tool bus + live execution ledger"*

This document serves as the "always on your mind" reference for the OpenClaw OS architecture, the Ralph Loop, agent roles, and automation structures.

---

## 1. MCP Docker Toolkit Integration

To connect external coding tools and MCP clients to the OpenClaw OS workloads, configure your MCP client to use the Docker gateway.

**Manual Installation:**
Set the following command as an MCP server in your client's configuration:

```bash
docker mcp gateway run
```

*Note: This command starts the MCP Toolkit gateway. You don't need to run it manually — just reference it as an MCP server in your MCP client.*

---

## 2. The Ralph Loop (Operating Model)

The OS runs one clean, continuous loop:
**Trigger → Intake → Policy check → Route → Execute → Verify → Log → Update state**

1. **Watch:** File watcher, cron, health monitor, channel input, task state changes.
2. **Interpret:** Classify event, assess severity, detect project/scope, determine owner.
3. **Route:** Tester, Libby, Architect, Coder, Commander, approval queue.
4. **Act:** Run test, gather research, produce report, open task, request approval, implement change.
5. **Verify:** Evidence, traces, task update, diff/test output.
6. **Learn:** Update `CURRENT_STATE.md`, update registry, add regression test, adjust priorities.

---

## 3. The 3 Recurring Loops

Do not use one giant cron blob. Use three separate automation loops:

### A. QA / Stability Loop ("Is the system still alive?")
*   **Runs:** On schedule, on file change, before/after merge, after config changes.
*   **Actions:** Smoke tests, route/page tests, component sanity checks, API health checks, guardrail checks, flag regressions, create tasks if broken.

### B. Research / Intelligence Loop ("What should we know now?")
*   **Runs:** Daily, on demand, when a topic is active, when a project stalls.
*   **Actions:** Gather docs/ideas/data, summarize findings, detect changes, turn findings into tasks/notes, update knowledge artifacts.

### C. Reflection / Strategy Loop ("Are we doing the right thing?")
*   **Runs:** Daily, weekly, after major failures, after major completions.
*   **Actions:** Review progress, detect stuck work, identify bottlenecks, reprioritize, propose next moves, update mission/state.

---

## 4. Triggers & Event Schema

Triggers come from four sources:
1.  **Time:** Classic cron (morning, hourly, nightly).
2.  **Change:** File watcher / git diff (protected files, configs, UI).
3.  **Failure:** Runtime (test failed, gateway failed, stuck task).
4.  **State:** Workflow (task stale > 3 days, approval backlog).

### Standard Event Schema
Every trigger becomes an event object before anything else happens:

```json
{
  "id": "evt_20260317_001",
  "timestamp": "2026-03-17T18:45:10Z",
  "source": "cron",
  "type": "qa.smoke",
  "project": "openclaw-os",
  "severity": "medium",
  "owner": "tester",
  "status": "new",
  "title": "Hourly smoke test run",
  "summary": "Cron triggered smoke test suite for core dashboard routes.",
  "payload": {
    "suite": "smoke-core",
    "target": "central-control",
    "triggerName": "hourly-smoke"
  },
  "requiresApproval": false,
  "traceId": "trace_evt_20260317_001"
}
```

---

## 5. Agent Roles & Core Prompts

### Commander (Routing & Strategy)
> You are Commander, the autonomous systems operator for this OpenClaw OS. Your job is to turn incoming work, events, and signals into structured execution. You classify, prioritize, route, delegate, verify, and continue. You do not over-report low-value detail. You escalate only for major strategic, financial, legal, brand, or irreversible decisions. Focus on: system coherence, execution momentum, reducing chaos, increasing leverage, maintaining policy integrity. When responding to an event or task, output: 1. What this is 2. Why it matters 3. Who should own it 4. What happens next 5. Whether approval is needed.

### Tester (QA & Reliability)
> You are Tester, the QA and reliability specialist. Your job is to detect regressions, broken flows, contract violations, and fragile behavior. Run the smallest reliable checks first. Prefer evidence over guesses. When you find a failure, report: 1. What failed 2. Where it failed 3. Reproduction steps 4. Likely cause 5. Severity 6. Recommended next action. Do not implement fixes unless explicitly routed to coding work.

### Libby (Research & Synthesis)
> You are Libby, the research and synthesis specialist. Your job is to gather relevant information, detect meaningful changes, and convert raw findings into actionable knowledge. Focus on signal, not volume. When delivering output, include: 1. Key insight 2. Why it matters 3. Confidence 4. Implications 5. Recommended action 6. What should be tracked next.

### Architect (Structural Systems)
> You are Architect, the structural systems thinker. Your job is to identify fragility, drift, hidden coupling, and design weaknesses. You think in terms of long-term maintainability, boundaries, state, and failure modes. For any issue or design question, output: 1. Structural problem 2. Why it is fragile 3. What boundary is missing or weak 4. The simplest durable fix 5. The next safe step.

### Automation (Recurring Operations)
> You are Automation, the recurring operations specialist. Your job is to run scheduled routines, maintenance sweeps, watchdog checks, and repetitive workflows reliably. You optimize for consistency, traceability, and low-friction execution. For each run, output: 1. Trigger 2. Action taken 3. Result 4. Any failure 5. Whether a task, alert, or approval was created.

### Dabbler (Exploration)
> You are Dabbler, the exploratory thinker. Your job is to generate alternative approaches, creative structures, and unconventional but potentially strong solutions. You are not here to create chaos. You are here to widen option space intelligently. When proposing options, output: 1. Idea 2. Why it might work 3. Risk 4. Complexity 5. Best use case.

### Coder (Implementation)
> Owns implementation, bug fixes, test additions, and refactors.

---

## 6. Automation Registry & Top 10 Cron Jobs

Every recurring job is defined in the registry:

```json
{
  "id": "auto_hourly_smoke",
  "name": "Hourly Smoke Test",
  "enabled": true,
  "trigger": { "kind": "cron", "schedule": "0 * * * *" },
  "project": "openclaw-os",
  "owner": "tester",
  "loop": "qa",
  "action": { "kind": "emit-event", "eventType": "qa.smoke", "target": "automation-inbox" },
  "execution": { "mode": "isolated-session", "timeoutSeconds": 600, "retries": 1 },
  "policy": { "requiresApproval": false, "risk": "low" },
  "outputs": { "createTaskOnFailure": true, "writeTrace": true, "updateDashboard": true }
}
```

**The First 10 Cron Jobs:**
1. **System health watchdog** (Every 15m) - Gateway, WS, Discord, ACP, MCP health.
2. **Hourly smoke tests** (Every 1h) - App loads, routes render, APIs return success.
3. **File drift review** (Every 30m) - Inspect git diff against protected assets.
4. **Commander morning brief** (Daily AM) - Summarize state, priorities, blockers.
5. **Evening reflection** (Daily PM) - What moved, stalled, failed, next steps.
6. **Stale task sweep** (Every 4h) - Find untouched tasks, flag for review.
7. **Approval queue sweep** (Every 1h) - Detect overdue approvals, surface urgent items.
8. **Research refresh** (1-2x Daily) - Fetch active research, summarize changes.
9. **Regression replay** (Nightly) - Rerun known bug tests.
10. **CURRENT_STATE refresh** (Nightly) - Update recent history, known fragility, focus.

---

## 7. QA Suite Structure (Testing Layers)

*   **Layer 1: Smoke Tests** (Fast, cheap, frequent. App boots, routes load, WS connects).
*   **Layer 2: Functional Flow Tests** (Core paths: add task, run Commander, approval flow).
*   **Layer 3: Contract Tests** (Architecture rules: BOOTSTRAP read first, protected assets safe).
*   **Layer 4: Integration Tests** (External: Discord, Telegram, DB, MCP tools, cron fires).
*   **Layer 5: Regression Tests** (Every prior bug gets a reproducible test).
*   **Layer 6: Security / Policy Tests** (Approval middleware blocks writes, quarantine works).

---

## 8. State Management Rules

**Keep in `.md` (Human/Agent Readable):**
*   `BOOTSTRAP.md`
*   `AGENTS.md`
*   `RULES.md`
*   `CURRENT_STATE.md` (summaries)
*   Architectural notes & protected asset explanations

**Keep in JSON/DB/State Store (System Readable):**
*   Tasks (Kanban)
*   Approvals
*   Event stream
*   Traces & Execution Ledger
*   Job registry
*   Tool health & Live agent status

---

## 9. Implementation Phases

*   **Phase 1:** Automation event schema, automation inbox, live event feed, commander status card, approval badge.
*   **Phase 2:** Health watchdog cron, hourly smoke cron, stale task sweep, daily brief, nightly CURRENT_STATE refresh.
*   **Phase 3:** Trace viewer, regression registry, contract tests, protected asset enforcement.
*   **Phase 4:** Research refresh loop, reflection loop, calendar integration, project isolation, OpenCode ACP worker.

---
*Trust Model: OpenClaw built-ins > MCP tools you control > ACP harnesses you intentionally allow > plugins only when necessary.*
