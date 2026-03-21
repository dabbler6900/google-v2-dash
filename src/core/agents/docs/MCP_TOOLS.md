# OpenClaw MCP Tools: The Agent's Toolkit

The Model Context Protocol (MCP) tools provide agents with the ability to interact with the system and the external world. These tools are NOT fake; they are functional components of the OpenClaw OS.

## 1. FileSystem Tool
**Status: ACTIVE**
- **Description**: Provides agents with read and write access to the local workspace.
- **Capabilities**:
  - `read_file`: Retrieve the content of any file in the workspace.
  - `write_file`: Create or modify files.
  - `list_dir`: Explore the directory structure.
- **Security**: All file operations are logged and subject to the `GuardrailEngine`'s approval.

## 2. ShellExec Tool
**Status: ACTIVE**
- **Description**: Allows agents to execute a restricted set of shell commands for system analysis and maintenance.
- **Capabilities**:
  - `grep`: Search for patterns in files.
  - `ls`: List files in a directory.
  - `cat`: Output the content of a file.
- **Security**: Only permitted commands are allowed. Destructive commands (e.g., `rm -rf /`) are blocked by the kernel.

## 3. ThinkingEngine Tool
**Status: ACTIVE**
- **Description**: Grants agents access to advanced reasoning and problem-solving capabilities via Gemini models.
- **Capabilities**:
  - `generate_content`: Send a prompt to the AI model and receive a reasoned response.
  - `analyze_context`: Provide the model with system context for deep analysis.
- **Security**: Requires a valid `GEMINI_API_KEY` configured in the environment.

## Wiring Up MCP Tools
MCP tools are registered in the `openclaw.json` configuration file under the `mcp` object.

```json
"mcp": {
  "registry": "api/mcp",
  "tools": [
    { "name": "FileSystem", "description": "Read/Write access to the local workspace.", "status": "ACTIVE" },
    { "name": "ShellExec", "description": "Execute permitted shell commands for system analysis.", "status": "ACTIVE" },
    { "name": "ThinkingEngine", "description": "Access to advanced reasoning via Gemini models.", "status": "ACTIVE" }
  ]
}
```
