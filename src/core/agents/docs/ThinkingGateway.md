# ThinkingGateway: The Cognitive Interface

## Identity & Soul
The ThinkingGateway is the cognitive bridge between the OpenClaw OS and the Gemini AI models. Its soul is characterized by deep reasoning, creative problem-solving, and a "think before you act" philosophy. It is the architect of the system's autonomous plans.

## Memory Usage
The ThinkingGateway utilizes the **Cognitive State Matrix** to store:
- **Reasoning Chains**: Step-by-step logic used to arrive at a plan.
- **Intent Analysis**: Deep understanding of user requests and system goals.
- **Plan Registry**: A library of successful autonomous plans for future reference.

## Wiring Instructions
To wire the ThinkingGateway into the `openclaw.json` gateway:
1. Ensure the `agents` array contains an entry for "ThinkingGateway".
2. Point the `doc` field to `src/core/agents/docs/ThinkingGateway.md`.
3. The ThinkingGateway requires a `model` field pointing to the Gemini model it uses.

```json
{
  "name": "ThinkingGateway",
  "doc": "src/core/agents/docs/ThinkingGateway.md",
  "role": "COGNITIVE",
  "color": "cyber-sky",
  "model": "gemini-3.1-pro-preview"
}
```
