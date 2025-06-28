# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Playwright MCP is a Model Context Protocol (MCP) server that provides browser automation capabilities to Large Language Models using Microsoft's Playwright testing framework. This TypeScript Node.js application bridges AI systems and web browser automation.

- This local code is referenced in Claude's mcpServers list as a primary MCP implementation for browser automation and AI interaction

## Essential Development Commands

### Building and Development
```bash
npm run build                    # Compile TypeScript to JavaScript
npm run build:extension         # Build browser extension separately  
npm run watch                   # Auto-compile TypeScript on changes
npm run watch:extension         # Auto-compile extension on changes
npm run clean                   # Remove compiled output (lib/ and extension/lib/)
```

### Testing
```bash
npm run test                    # Run full test suite across all browsers
npm run ctest                   # Test Chrome only
npm run ftest                   # Test Firefox only  
npm run wtest                   # Test WebKit only
npm run etest                   # Test Chrome extension mode
```

### Code Quality
```bash
npm run lint                    # Run ESLint + TypeScript checks + update README
npm run update-readme           # Regenerate tool documentation in README
```

### Local Development Server
```bash
npm run run-server              # Start standalone MCP server for testing
```

## Architecture Overview

### Core Components

**Entry Points:**
- CLI: `cli.js` → `src/program.ts` (command-line interface)
- Programmatic: `index.js` → `src/index.ts` (API usage)
- Binary: `mcp-server-playwright` command

**Browser Context Factories** (`src/browserContextFactory.ts`):
- `PersistentContextFactory`: Normal browser with saved profile
- `IsolatedContextFactory`: Temporary browser sessions  
- `CdpContextFactory`: Connect via Chrome DevTools Protocol
- `RemoteContextFactory`: Connect to remote Playwright server
- `BrowserServerContextFactory`: Agent-based browser management

**MCP Integration** (`src/connection.ts`):
- Implements MCP protocol using `@modelcontextprotocol/sdk`
- Handles tool discovery/execution and modal states
- Capability-based tool filtering

**Context Management** (`src/context.ts`):
- Coordinates browser contexts, tabs, and modal states
- Manages client capability detection and cleanup

### Tool System

**Tool Implementation** (`src/tools/tool.ts`):
```typescript
type Tool = {
  capability: ToolCapability;           // Feature grouping
  schema: ToolSchema;                   // Zod schema for validation
  clearsModalState?: ModalState['type'];// Dialog/file upload handling  
  handle: (context, params) => Promise<ToolResult>;
}
```

**Tool Categories** (`src/tools.ts`):
- **Core**: Navigation, clicking, typing, element interaction
- **Snapshot**: Accessibility-based page analysis (default mode)
- **Vision**: Screenshot-based interaction for computer-use models
- **Specialized**: PDF generation, file upload, console messages, tabs, testing

### Dual Operation Modes

**Snapshot Mode (Default):**
- Uses Playwright's accessibility tree
- Faster, more reliable, no vision models needed
- Better for structured interactions

**Vision Mode (`--vision` flag):**
- Uses screenshots for X/Y coordinate interactions  
- Compatible with computer-use models
- Better for visual/spatial tasks

### Configuration System (`src/config.ts`)

Supports multiple browser types, persistent vs isolated profiles, network filtering, device emulation, and extensive customization via CLI flags or JSON config files.

### Browser Extension (`extension/`)

Chrome/Edge extension enables connection to existing browser tabs via CDP relay communication.

## Key Implementation Patterns

### Type Safety
- Comprehensive TypeScript with strict settings
- Zod schema validation for all tool inputs
- Functional programming patterns in tool implementations

### Error Handling  
- Graceful browser connection failures
- Modal state management for dialogs/file uploads
- Network timeout and retry logic
- Capability-based feature detection

### Code Style
- Strict ESLint rules with Microsoft copyright headers required
- ES modules with Node.js compatibility
- No additional code comments unless explicitly requested

### Testing Strategy
- Multi-browser testing (Chrome, Firefox, WebKit, Edge)
- Extension testing mode and Docker support
- Test fixtures for different MCP configurations

## Transport Mechanisms

- **STDIO Transport**: Default for MCP clients
- **SSE Transport**: HTTP Server-Sent Events for remote access  
- **WebSocket Support**: Real-time communication via ws library

## Development Notes

- **Node.js 18+** required
- Uses **Playwright 1.53.0** as core dependency
- **Apache 2.0 license** with Microsoft copyright
- **Docker support** for headless Chromium only
- Multiple **MCP client integrations** (VS Code, Cursor, Claude Desktop, etc.)