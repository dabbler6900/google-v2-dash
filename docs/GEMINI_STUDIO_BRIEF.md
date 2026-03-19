# Gemini Studio Brief

## Product
Build a clean React dashboard called `OpenClaw Forge`.

This is not a generic AI chat app and not a fake “agent OS” demo.
It is a project planning, task orchestration, execution tracking, and review dashboard for OpenClaw.

## Core Workflow
`Intent -> Project -> Plan -> Tasks -> Ready Queue -> OpenClaw Run -> Review -> Done`

## Product Rules
- Every visible panel must map to a real API endpoint.
- No placeholder widgets.
- No fake sample events.
- No mock metrics unless explicitly labeled `demo mode`.
- No duplicate API concepts.
- No overlapping route surface.
- Markdown may exist for memory/specs, but it is not the control plane.
- Canonical state lives in APIs and persistence for `projects`, `tasks`, `runs`, `reviews`, and `runtime`.
- Do not expose raw chain-of-thought.
- Show structured execution state instead:
  - current goal
  - current action
  - tool or runtime
  - files/artifacts touched
  - blocker
  - result

## Tabs
1. `Command`
One place to create projects, tasks, and planning requests from plain language.

2. `Projects`
Project registry, status, repo/workspace binding, health.

3. `Planner`
Break intent into goals, steps, constraints, and subtasks.

4. `Board`
Task states:
- inbox
- planned
- ready
- running
- review
- done
- blocked

5. `Runs`
OpenClaw sessions, stored execution runs, statuses, runtime links.

6. `Runtime`
Gateway health, paired devices, cron, plugins/channels, warnings, audit.

7. `Review`
Approve, request changes, or block.

## Required Backend Contract
- `GET /api/runtime/overview`
- `GET /api/runtime/runs`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `POST /api/tasks/:id/plan`
- `POST /api/tasks/:id/execute`
- `POST /api/tasks/:id/review`
- `GET /api/events/stream`

## UX Direction
- Serious operational UI, not playful toy UI.
- Fast overview first, details second.
- Board-first planning and execution.
- Multi-agent visibility without overwhelming the screen.
- Clean separation between:
  - planning state
  - execution state
  - runtime state
  - review state

## Data Model
- `Project`
- `Task`
- `Run`
- `Review`
- `RuntimeOverview`
- `Event`

## Visual Direction
- Dark/light support.
- Strong dashboard structure.
- Intentional spacing and typography.
- Small number of clear accents.
- Avoid novelty chrome.
- Design for long operational sessions, not splash-page screenshots.

## Anti-Drift Constraints
- Do not assume hidden local markdown is the source of truth.
- Do not create UI features without a backing endpoint.
- Do not merge planning and runtime into one undifferentiated inbox.
- Do not duplicate the same record in multiple tabs without labeling the source.
- Prefer a single canonical card per entity and filtered views on top.

## Implementation Ask
Generate a production-oriented frontend shell and component structure for the contract above.
Assume a real backend exists and optimize for clean orchestration, execution visibility, and review flow.
