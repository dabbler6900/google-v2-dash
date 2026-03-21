# OPENCLAW OS SYSTEM CONTEXT (DYNAMIC)
Generated: 2026-03-21T08:29:21.785Z

## MISSION DIRECTIVE
**North Star**: Build a robust, autonomous Agent OS that maximizes user value and system reliability.
**Constraints**:
- Never delete root files without approval.
- Always dry-run structural changes.
- Maintain 99.9% uptime.

## ACTIVE GOALS
1. **Establish Autonomous Baseline**: Ensure the system can triage and execute simple tasks without human intervention. (Criteria: Triage 10 events, Complete 5 tasks, Maintain 100% uptime)

## SYSTEM CAPABILITIES (MCP)
The OpenClaw OS is equipped with Model Context Protocol (MCP) tools that allow agents to interact with the environment:
- **FileSystem**: Read/Write access to the workspace.
- **ShellExec**: System analysis via permitted shell commands.
- **ThinkingEngine**: Advanced reasoning via Gemini models.

For more details, see `src/core/agents/docs/MCP_TOOLS.md`.

## GUARDRAILS (LOGIC LOCK)
These rules are enforced at the kernel level by the `GuardrailEngine`:
1. **No Destructive Shell Commands**: Commands like `rm -rf /` are blocked.
2. **Approval Required for Root Changes**: Any modification to root files requires explicit user approval.
3. **Memory Quota Enforcement**: Agents cannot exceed their assigned memory limits.
