# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run dev` - Start development server using tsx
- `npm run build` - Build production bundle using esbuild
- `npm run build:types` - Generate TypeScript declaration files
- `npm start` - Run the built application

### Quality Assurance
- `npm run typecheck` - Type check without emitting files
- `npm run biome:ci` - Run Biome CI checks (formatting/linting)
- `npm run biome:fix` - Auto-fix Biome issues
- `npm test` - Run tests with coverage using Vitest

### MCP Development
- `npm run dev:inspector` - Start MCP inspector for debugging
- `npm run start:inspector` - Start MCP inspector with built code

## Architecture Overview

This is a **Model Context Protocol (MCP) server** that provides AI assistants with access to ConoHa VPS OpenStack APIs. The server follows a clean architecture with feature-based organization.

### Core Structure
- **MCP Server**: Built using `@modelcontextprotocol/sdk`, registered tools and prompts in `src/index.ts`
- **OpenStack Integration**: Modular clients for different OpenStack services
- **Feature Organization**: Each OpenStack service has its own directory under `src/features/openstack/`

### Key Components

#### MCP Tools (src/index.ts)
- `conoha_get` - GET requests to OpenStack APIs
- `conoha_get_by_param` - GET requests with path parameters
- `conoha_post` - POST requests for resource creation
- `conoha_post_put_by_param` - POST/PUT requests with parameters
- `conoha_delete_by_param` - DELETE requests with parameters

#### OpenStack Services (src/features/openstack/)
- **compute/** - Server management (create, delete, start, stop, resize)
- **volume/** - Volume management (create, delete, update)
- **image/** - Image listings
- **network/** - Security groups, ports, and networking
- **common/** - Shared utilities (API client, token generation, response formatting)

#### Authentication
- Uses OpenStack token-based authentication
- Tokens are generated via `generateApiToken()` in `common/generate-api-token.ts`
- Required environment variables: ConoHa API credentials

### Configuration
- **TypeScript**: Strict type checking enabled
- **Biome**: Code formatting with tabs, double quotes
- **Vitest**: Testing framework with coverage reports
- **esbuild**: Fast bundling for production

### API Schema Validation
- Zod schemas for request/response validation in each service
- Discriminated unions for different request types
- Strong typing throughout the codebase

## Development Notes

### Environment Setup
Requires ConoHa VPS API credentials set as environment variables. Reference the setup documentation in `docs/` for details.

### Testing
- Unit tests co-located with source files (*.test.ts)
- Coverage reports generated in `reports/coverage/`
- CSV test reports generated via custom reporter

### Code Style
- Uses Biome for consistent formatting and linting
- Tab indentation, double quotes for strings
- Import organization enabled
- Strict linting rules with some exceptions for test files