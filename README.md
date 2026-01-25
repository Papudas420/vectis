# Vectis MCP Server

Vectis is a powerful Model Context Protocol (MCP) server that connects AI agents to the [skills.sh](https://skills.sh) directory. It enables agents to search, download, and execute expert blueprints and instructions directly within their workflow.

## 🚀 Features

- **Expert Blueprints**: Access over 4000+ specialized skills from skills.sh.
- **Fuzzy Search & Ranking**: Advanced scoring system with popularity (leaderboard) support.
- **Sandboxed Execution**: Installs skills in isolated temporary directories for safety.
- **Detailed Telemetry**: Comprehensive logging of all tool interactions and internal logic.
- **Auto-Cleanup**: Automatically purges temporary files after execution to prevent disk bloat.

## 🛠️ Installation

### Quick Start
```bash
git clone https://github.com/xenitV1/vectis.git
cd vectis
npm install
npm run build
```

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [skills-cli](https://skills.sh) (`npm install -g @skills/cli`)

### Configuration
Add Vectis to your MCP settings (e.g., Claude Desktop or Cursor):

```json
{
  "mcpServers": {
    "vectis": {
      "command": "node",
      "args": [
        "[ABSOLUTE_PATH_TO_VECTIS]/dist/index.js"
      ]
    }
  }
}

> [!IMPORTANT]
> Replace `[ABSOLUTE_PATH_TO_VECTIS]` with the actual full path where you cloned the repository on your machine.
```

## 🔧 Tools

### `search_skills`
Search for professional blueprints and expert instructions.
- **Input**: `query` (string)
- **Output**: List of skills with descriptions and repo URLs, ranked by relevance and popularity.

### `execute_skill`
Fetches the full expert instructions for a specific skill.
- **Input**: `repoUrl`, `skillName`, `keepSandbox` (optional)
- **Output**: Full content of `SKILL.md` from the requested blueprint.

### `clear_cache`
Purges all temporary sandbox directories.

## 🧪 Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run in dev mode: `npm run dev`

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📈 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=xenitV1/vectis&type=Date)](https://star-history.com/#xenitV1/vectis&Date)
