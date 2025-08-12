# GitHub Actions MediaWiki Update Plan

## Overview

Automate the deployment of JavaScript changes to the Dominion Strategy Wiki by
updating MediaWiki:Common.js through GitHub Actions.

## Workflow Steps

### 1. CI/CD Pipeline

- **Lint**: Run linting tools to ensure code quality
- **Test**: Execute test suite to verify functionality
- **Compile**: Build/compile JavaScript file for production

### 2. MediaWiki Authentication

- Use service account:
  [User:GitHubBot](https://wiki.dominionstrategy.com/index.php/User:GitHubBot)
- Store credentials securely in GitHub Secrets
- Authenticate using MediaWiki API

### 3. Update MediaWiki:Common.js

- Target page: https://wiki.dominionstrategy.com/index.php/MediaWiki:Common.js
- Replace existing content with compiled JavaScript
- Use MediaWiki API `edit` action with proper parameters

### 4. Verification

- Fetch raw content from:
  https://wiki.dominionstrategy.com/index.php/MediaWiki:Common.js?action=raw
- Compare retrieved content with expected compiled output
- Fail the workflow if verification doesn't match

## Implementation Requirements

### GitHub Secrets Needed

- `MEDIAWIKI_USERNAME`: GitHubBot username
- `MEDIAWIKI_PASSWORD`: GitHubBot password
- `MEDIAWIKI_API_URL`: https://wiki.dominionstrategy.com/api.php

### API Tools and Dependencies

#### MediaWiki API Client
- **Tool**: Node.js with `axios` or `node-fetch` for HTTP requests
- **Purpose**: Authenticate and interact with MediaWiki API
- **Key endpoints**:
  - `POST /api.php?action=login` - Initial authentication
  - `POST /api.php?action=query&meta=tokens` - Get CSRF token
  - `POST /api.php?action=edit` - Update page content
  - `GET /index.php?title=MediaWiki:Common.js&action=raw` - Verify content

#### Dependencies to Add
```json
{
  "devDependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.0.0"
  }
}
```

#### GitHub Actions Setup
- **Environment**: `ubuntu-latest`
- **Node.js version**: 20 (matches existing CI)
- **Package manager**: pnpm 10.14.0
- **Workflow triggers**: Push to `main` branch only

#### Disclaimer Implementation
- **Approach**: Add comment at top of source TypeScript file (`src/common.ts`)
- **Rationale**: 
  - TypeScript `removeComments: false` preserves source comments in output
  - Simpler than post-build processing
  - Comment automatically appears in compiled `dist/common.js`
- **Implementation**: 
  - Add disclaimer comment to `src/common.ts` header
  - TypeScript compiler will preserve it in the output

### Code Organization

#### File Structure
```
.github/workflows/
├── ci.yml (existing - lint, test, build)
└── deploy.yml (new - MediaWiki deployment)

scripts/
└── deploy-to-mediawiki.js (new - deployment logic)
```

#### Deployment Script Location
- **File**: `scripts/deploy-to-mediawiki.js`
- **Purpose**: Contains MediaWiki API interaction logic
- **Input**: `dist/common.js` (compiled output)
- **Output**: Updates MediaWiki:Common.js page
- **Authentication**: Reads credentials from environment variables:
  - `process.env.MEDIAWIKI_USERNAME`
  - `process.env.MEDIAWIKI_PASSWORD`
  - `process.env.MEDIAWIKI_API_URL`
- **Local Testing**: Uses `dotenv` to load `.env` file for local development
  - GitHub Actions will use repository secrets directly
  - Local `.env` file should be gitignored

### Key Considerations

- Handle MediaWiki CSRF tokens properly
- Implement proper error handling for API calls
- Ensure atomic updates (rollback on failure)
- Add appropriate commit messages/edit summaries
- Consider rate limiting and API throttling

### Success Criteria

- All tests pass
- Linting succeeds
- Compilation completes without errors
- MediaWiki page updates successfully
- Verification confirms identical content
- No manual intervention required
