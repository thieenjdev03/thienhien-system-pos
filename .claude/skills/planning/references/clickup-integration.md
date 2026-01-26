# ClickUp Integration

## Overview

When provided with a ClickUp task ID (format: `E4G-XXX`, `ABC-123`, etc.), fetch full task details including user story documentation.

## Configuration

ClickUp API credentials stored in `~/.clickup/config.json`:
```json
{
  "api_token": "pk_...",
  "defaults": {
    "team_id": "90181271407",
    "space_id": "...",
    "list_id": "..."
  }
}
```

## Fetching Task Details

### Step 1: Fetch Task with Markdown Description

```bash
curl -s -H "Authorization: {api_token}" \
  "https://api.clickup.com/api/v2/task/{task_id}?custom_task_ids=true&team_id={team_id}&include_markdown_description=true"
```

**Required Parameters:**
- `custom_task_ids=true` - Allows using custom task IDs (E4G-870) instead of internal IDs
- `team_id={team_id}` - Required for authentication
- `include_markdown_description=true` - Returns markdown_description field with doc links

**Key Response Fields:**
- `name` - Task title
- `description` - Plain text description (often empty)
- `markdown_description` - Contains links to ClickUp docs with full user story
- `status` - Current task status
- `priority` - Task priority
- `checklists` - Verification criteria
- `custom_fields` - Project type, release version, etc.

### Step 2: Fetch User Story Documentation

If `markdown_description` contains a ClickUp docs link like:
```
https://app.clickup.com/90181271407/docs/2kzkhzvf-8678/2kzkhzvf-83118
```

Extract the workspace_id, doc_id, and page_id, then fetch:

```bash
curl -s -H "Authorization: {api_token}" \
  "https://api.clickup.com/api/v3/workspaces/{workspace_id}/docs/{doc_id}/pages/{page_id}"
```

**URL Pattern:**
- `https://app.clickup.com/{workspace_id}/docs/{doc_id}/{page_id}`
- API: `https://api.clickup.com/api/v3/workspaces/{workspace_id}/docs/{doc_id}/pages/{page_id}`

**Key Response Fields:**
- `name` - Page title (e.g., "US2. Logout")
- `content` - Full markdown content with user story details including:
  - User story statement
  - Overview (Why, Description)
  - Design mockups and Figma links
  - Acceptance criteria
  - Test cases links

## Usage Pattern

```bash
# 1. Read config
API_TOKEN=$(cat ~/.clickup/config.json | grep api_token | cut -d'"' -f4)
TEAM_ID=$(cat ~/.clickup/config.json | grep team_id | cut -d'"' -f4)

# 2. Fetch task
TASK_DATA=$(curl -s -H "Authorization: $API_TOKEN" \
  "https://api.clickup.com/api/v2/task/E4G-870?custom_task_ids=true&team_id=$TEAM_ID&include_markdown_description=true")

# 3. Extract doc URL from markdown_description and parse IDs
# Example: https://app.clickup.com/90181271407/docs/2kzkhzvf-8678/2kzkhzvf-83118
WORKSPACE_ID="90181271407"
DOC_ID="2kzkhzvf-8678"
PAGE_ID="2kzkhzvf-83118"

# 4. Fetch user story content
DOC_CONTENT=$(curl -s -H "Authorization: $API_TOKEN" \
  "https://api.clickup.com/api/v3/workspaces/$WORKSPACE_ID/docs/$DOC_ID/pages/$PAGE_ID")
```

## Planning Integration

When task ID detected:
1. Fetch task details with `include_markdown_description=true`
2. Extract user story doc link from `markdown_description`
3. Fetch full user story content from docs API
4. Use complete requirements (user story + acceptance criteria + checklist) for planning
5. Reference ClickUp task ID and doc links in plan frontmatter

## Common Pitfalls

- ❌ Missing `custom_task_ids=true` → OAuth error
- ❌ Missing `team_id` parameter → OAuth error
- ❌ Using v2 API for docs → Route not found (docs use v3 API)
- ❌ Not including `include_markdown_description=true` → Empty description field
