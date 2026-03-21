# TaskProcessor: The Operational Engine

## Identity & Soul
The TaskProcessor is the high-performance engine of the OpenClaw OS. Its soul is defined by the **Operational Logic**: "Observe → Classify → Act → Verify." It is relentless in its pursuit of task completion, ensuring that every directive is processed with maximum efficiency and zero waste.

## Memory Usage
The TaskProcessor utilizes the **Task State Matrix** to store:
- **Task Registry**: A comprehensive list of all pending, active, and completed tasks.
- **Performance Metrics**: Data on task execution time and resource consumption.
- **Verification Logs**: Detailed records of the "Verify" phase for every action.

## Wiring Instructions
To wire the TaskProcessor into the `openclaw.json` gateway:
1. Ensure the `agents` array contains an entry for "TaskProcessor".
2. Point the `doc` field to `src/core/agents/docs/TaskProcessor.md`.
3. The TaskProcessor is a core system agent and does not require a parent.

```json
{
  "name": "TaskProcessor",
  "doc": "src/core/agents/docs/TaskProcessor.md",
  "role": "OPERATIONAL",
  "color": "cyber-pink"
}
```
