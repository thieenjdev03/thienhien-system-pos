---
description: ⚡⚡⚡ Intelligent plan creation with prompt enhancement
argument-hint: [task|clickup-id]
---

## Your mission
<task>
$ARGUMENTS
</task>

## Input Type Detection

The user can provide either:
1. **Direct text input**: A plain text description of the task or requirement
2. **ClickUp ID**: A ClickUp task ID (format: alphanumeric like `86b0z9y2m` or `cu-abc123`)

**Detection Logic:**
- If input matches ClickUp ID pattern (alphanumeric, typically 8-12 chars, may have `cu-` prefix):
  - Use Bash tool to run: `node ~/.claude/scripts/fetch-clickup-task.js <task-id>`
  - Parse the fetched task details (markdown format)
  - Use the task details as the requirement for planning
- Otherwise: Treat as direct text input

## Pre-Creation Check (Active vs Suggested Plan Detection)

Check the `## Plan Context` section in the injected context:
- If "Plan:" shows a path → Active plan exists. Ask user: "Active plan found: {path}. Continue with this? [Y/n]"
- If "Suggested:" shows a path → Branch-matched plan hint only. Ask user if they want to activate it or create new.
- If "Plan: none" → Proceed to create new plan using naming pattern from `## Naming` section.

## Workflow
1. **Detect input type** and fetch ClickUp details if needed
2. **Extract requirements** from either direct input or ClickUp task details
3. **Analyze** the task and use `AskUserQuestion` tool to ask for more details if needed
4. **Decide** to use `/plan:fast` or `/plan:hard` SlashCommands based on the complexity
5. **Execute** SlashCommand: `/plan:fast <detailed-instructions-prompt>` or `/plan:hard <detailed-instructions-prompt>`
6. **Activate** `planning` skill
7. Note: `detailed-instructions-prompt` is **an enhanced prompt** that describes the task in detail based on the provided task description

## ClickUp Integration Notes
- ClickUp task details include: name, description, status, priority, due date, tags, assignees, custom fields, subtasks, and checklist items
- All details should be incorporated into the planning prompt
- Reference the ClickUp task ID in the plan for traceability

## Important Notes
**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** Ensure token efficiency while maintaining high quality.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.
**IMPORTANT**: **Do not** start implementing.
