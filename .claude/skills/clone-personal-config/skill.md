---
name: clone-personal-config
description: Clone personal Claude Code configuration from git@github.com:GKIM-DIGITAL-LTD/claude-code-skills-agents.git into current project
---

# Clone Personal Configuration

Automates cloning your personal Claude Code skills, agents, and configuration from the GKIM-DIGITAL-LTD repository into any project.

## What This Skill Does

1. Removes existing `.claude` folder if present
2. Clones `git@github.com:GKIM-DIGITAL-LTD/claude-code-skills-agents.git`
3. Restructures nested `.claude/.claude` to root `.claude` level
4. Confirms successful setup

## Usage

Simply invoke this skill when you want to set up your personal Claude Code configuration in a new project:

```
/clone-personal-config
```

or just ask:
```
Clone my personal Claude config
```

## Instructions

When this skill is invoked:

1. Execute the clone script:
   ```bash
   bash .claude/skills/clone-personal-config/clone.sh
   ```

2. The script will:
   - Remove existing `.claude` folder (if present)
   - Clone the repository
   - Restructure the nested directory
   - Verify installation

3. Confirm to the user that setup is complete

## What Gets Installed

- **agents/** - Custom agent definitions
- **commands/** - Custom slash commands
- **hooks/** - Git and workflow hooks
- **skills/** - Reusable skills library
- **workflows/** - Development workflows
- **settings.json** - Claude Code settings
- **statusline scripts** - Status line customization

## Repository

Source: `git@github.com:GKIM-DIGITAL-LTD/claude-code-skills-agents.git`

## Notes

- This will **replace** any existing `.claude` folder in the current project
- Requires SSH access to the GKIM-DIGITAL-LTD GitHub organization
- The script handles the nested directory structure automatically
