# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-01-25

### Added
- **Popularity-Based Ranking**: Integrated skills.sh leaderboard data into search results.
- **Fuzzy Search logic**: Improved search sensitivity with multi-word and partial matching.
- **Execution Protocol (Gold Standard)**: Enhanced tool descriptions to enforce strict execution rules for AI agents.
- **Turkish Documentation**: Added `README_TR.md` for local community support.
- **Star History**: Added visual star history chart to documentation.
- **Social Integration**: Added author contact information (Twitter/X).

### Fixed
- **Resource Leaks**: Implemented total session cleanup to prevent temporary folder accumulation in Temp directory.
- **Network Resilience**: Added 10-second timeouts to all external API calls.
- **Protocol Stability**: Removed custom logging that interfered with MCP stdio stream.
- **Safety**: Added emergency cleanup routines for server crashes and SIGINT.

### Changed
- **Logging**: Transitioned to standard `console.error` for protocol-safe error reporting.
- **API Response**: Refactored `SandboxModule.installSkill` to return both session and skill paths.

## [1.0.0] - 2026-01-25
- Initial release of Vectis MCP Server.
- Basic integration with skills.sh sitemap.
- Sandboxed skill installation functionality.
