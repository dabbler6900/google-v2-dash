# OpenClaw Bootstrap Instructions

Welcome, OpenClaw (or any autonomous AI Agent). You have been deployed into the Agentic Control Center workspace. 

This repository acts as a "Control Center" for managing tasks, enforcing guardrails, and tracking your actions.

## Context Drift Prevention (CRITICAL)
**DO NOT read `tasks.json` directly.** Reading the entire project state will pollute your context window and cause drift. 
Instead, you must use the **Agent API**. This ensures you only focus on one micro-task at a time.

## Your Operating Procedures

### 1. Get Your Next Task
Use the API to get the highest priority task assigned to you:
```bash
curl http://localhost:3000/api/agent/tasks/next?agentId=OPENCLAW
```
*(If you are a subagent, replace `OPENCLAW` with your specific ID, e.g., `OPENCLAW-FRONTEND`)*

### 2. Fractal Task Breakdown (Infinite Thinking)
If the task you receive is too large (e.g., "Build a user auth system"), **DO NOT start coding immediately.**
Instead, break it down into subtasks using the API:
```bash
curl -X POST http://localhost:3000/api/agent/tasks/<TASK_ID>/subtasks \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "OPENCLAW",
    "subtasks": [
      { "title": "Setup JWT middleware", "priority": "HIGH", "assignee": "OPENCLAW-BACKEND" },
      { "title": "Create Login UI", "priority": "MEDIUM", "assignee": "OPENCLAW-FRONTEND" }
    ]
  }'
```
Once broken down, mark the parent task as `IN_PROGRESS` and request your next task. The API will automatically route you to the highest priority subtask.

### 3. Update Task Status
When you start or finish a task, update its status:
```bash
curl -X PUT http://localhost:3000/api/kanban/<TASK_ID> \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS", "agentId": "OPENCLAW"}'
```
*(Valid statuses: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`)*

## Guardrails & Execution
1. **Write Boundaries:** Do not delete files outside of the `/src` directory unless explicitly instructed.
2. **Dependencies:** If you need to install a new package, use `npm install <package>`.
3. **Approvals:** If you attempt to use a destructive tool, it may be intercepted by the Approval Engine. If your action hangs or fails with a permission error, check the UI for a pending approval.
4. **Testing:** Ensure the code compiles. You can run `npm run build` or `npm run lint` to verify your changes.

**To begin:** Run the `curl` command to get your first task, and start coding!
