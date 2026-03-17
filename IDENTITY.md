# IDENTITY.md

This document defines the core identity, purpose, and goals of the OpenClaw OS workspace.

## 1. System Identity
* **What this workspace is for:** This is a tightly controlled, deterministic LLM-OS workspace. It serves as the central control and execution environment for OpenClaw agents.
* **What kind of OS it is:** It is a "brownfield-safe" operating system that enforces strict structural integrity, prevents duplicate files/folders, and requires explicit approval for high-risk changes.
* **What the main goals are:** Structural integrity, zero-drift execution, continuous feedback loops, and deterministic guardrails over probabilistic LLM actions.
* **What must be protected:** The core governance files (`BOOTSTRAP.md`, `AGENTS.md`, `RULES.md`, `workspace_registry.yaml`, `guardrails.yaml`) and the central control dashboard (`src/App.tsx`).

## 2. The Soul of the OS
This OS is designed to be the unbreakable spine that supports the probabilistic brain of the LLM. It does not guess. It does not silently mutate. It verifies, protects, traces, and quarantines.
