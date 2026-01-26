# Implementation Plan: GitHub Private npm Package Setup

## Objective

Configure `claude-code-skills-agents` as a private GitHub npm package (`@gkim-digital-ltd/claude-code-skills-agents`) that distributes the complete `.claude/` configuration to consuming projects.

## Package Scope

- **Include**: Entire `.claude/` directory + `CLAUDE.md`
- **Exclude**: `history.jsonl`, `stats-cache.json`, `settings.local.json`, `cache/`, `telemetry/`, `.venv/`, `node_modules/`, `plans/`
- **Distribution**: Single monolithic package
- **Installation**: Postinstall script copies files to project root, auto-runs `install.sh`

## Critical Files to Create

### 1. package.json (root)

**Location**: `/Users/thinhpham/dev/claude-code-skills/package.json`

```json
{
  "name": "@gkim-digital-ltd/claude-code-skills-agents",
  "version": "1.0.0",
  "description": "Claude Code skills, agents, workflows, and hooks for enhanced AI-assisted development",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/GKIM-DIGITAL-LTD/claude-code-skills-agents.git"
  },
  "author": "GKIM Digital Ltd",
  "license": "MIT",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com/",
    "@gkim-digital-ltd:registry": "https://npm.pkg.github.com/"
  },
  "files": [
    ".claude/",
    "CLAUDE.md",
    "scripts/postinstall.js",
    "!.claude/history.jsonl",
    "!.claude/stats-cache.json",
    "!.claude/settings.local.json",
    "!.claude/cache",
    "!.claude/telemetry",
    "!.claude/skills/.venv",
    "!.claude/skills/*/node_modules",
    "!.claude/**/.DS_Store",
    "!plans"
  ],
  "scripts": {
    "postinstall": "node scripts/postinstall.js",
    "prepublishOnly": "node scripts/prepublish-check.js",
    "test": "node scripts/verify-package.js"
  },
  "keywords": ["claude-code", "ai-development", "skills", "agents", "workflows"],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Key features**:
- `files` array controls package contents (explicit include/exclude)
- `publishConfig` targets GitHub Packages registry
- `postinstall` auto-runs after npm install

### 2. scripts/postinstall.js

**Location**: `/Users/thinhpham/dev/claude-code-skills/scripts/postinstall.js`

**Purpose**: Copy `.claude/` and `CLAUDE.md` to consuming project, run `install.sh`

**Features**:
- Skip if installing package itself (during development)
- Recursive copy with skip-existing logic (preserve user customizations)
- Auto-run `.claude/skills/install.sh` after copy
- Colored console output with summary
- Error handling (non-fatal)

**Pseudo-logic**:
1. Detect package root vs project root
2. Skip if installing in package itself
3. Copy `.claude/` recursively (skip existing files)
4. Copy `CLAUDE.md` (skip if exists)
5. Run `.claude/skills/install.sh` automatically
6. Print summary and next steps

### 3. scripts/prepublish-check.js

**Location**: `/Users/thinhpham/dev/claude-code-skills/scripts/prepublish-check.js`

**Purpose**: Safety check before publishing - prevent sensitive data leaks

**Checks**:
- Verify sensitive files excluded: `history.jsonl`, `stats-cache.json`, `settings.local.json`, `.env`
- Detect large files (>5MB)
- Exit with error if issues found

### 4. scripts/verify-package.js

**Location**: `/Users/thinhpham/dev/claude-code-skills/scripts/verify-package.js`

**Purpose**: Test script to verify package contents

**Checks**:
- Expected includes: `.claude/skills/`, `.claude/agents/`, `.claude/workflows/`, `CLAUDE.md`
- Expected excludes: `history.jsonl`, `stats-cache.json`, `.venv/`, `plans/`
- Uses `npm pack --dry-run` output for verification

### 5. .npmignore

**Location**: `/Users/thinhpham/dev/claude-code-skills/.npmignore`

**Purpose**: Backup exclusion layer (files array is primary)

```text
.git
.gitignore
.DS_Store
.claude/history.jsonl
.claude/stats-cache.json
.claude/settings.local.json
.claude/cache/
.claude/telemetry/
.claude/skills/.venv/
.claude/skills/*/node_modules/
node_modules/
plans/
package-lock.json
yarn.lock
pnpm-lock.yaml
.env
.mcp.json
```

### 6. .npmrc.example

**Location**: `/Users/thinhpham/dev/claude-code-skills/.npmrc.example`

**Purpose**: Template for consuming projects

```ini
@gkim-digital-ltd:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT_HERE
```

### 7. README.md (root)

**Location**: `/Users/thinhpham/dev/claude-code-skills/README.md`

**Sections**:
1. Installation - GitHub PAT setup, `.npmrc` config, npm install command
2. What's Included - 33 skills, 18 agents, 4 workflows, etc.
3. Post-Installation - Verify `.claude/` copied, configure `.env`
4. Updating - Manual merge strategy for customizations
5. Publishing (Maintainers) - Version bumping, npm publish workflow
6. Troubleshooting - Common authentication/installation errors

### 8. PUBLISHING.md

**Location**: `/Users/thinhpham/dev/claude-code-skills/PUBLISHING.md`

**Content**: Maintainer guide for publishing updates

**Sections**:
- GitHub PAT setup (`write:packages` scope)
- Pre-publish checklist
- Manual publishing workflow
- Version strategy (semver)
- Troubleshooting

### 9. CHANGELOG.md

**Location**: `/Users/thinhpham/dev/claude-code-skills/CHANGELOG.md`

**Format**: Keep a Changelog style

**Initial entry**:
```markdown
## [1.0.0] - 2026-01-22
### Added
- Initial release as private GitHub npm package
- 33 skills, 18 agents, 4 workflows, 27 commands, 14 hooks
- Postinstall script with auto-dependency installation
```

### 10. LICENSE

**Location**: `/Users/thinhpham/dev/claude-code-skills/LICENSE`

**Content**: MIT License

### 11. Update .gitignore (root)

**Location**: `/Users/thinhpham/dev/claude-code-skills/.gitignore`

**Add**:
```text
*.tgz
node_modules/
.npmrc
test-install/
```

## Implementation Sequence

### Phase 1: Core Setup

1. Create `package.json` with proper scoping and `files` array
2. Create `scripts/` directory
3. Create `scripts/postinstall.js` with:
   - Directory copy logic
   - Auto-run `install.sh` (NEW per user requirement)
   - Skip-existing behavior
4. Create `.npmignore`

### Phase 2: Safety & Testing

1. Create `scripts/prepublish-check.js`
2. Create `scripts/verify-package.js`
3. Test locally:
   ```bash
   npm run test  # Verify package contents
   npm pack      # Create test package
   tar -tzf *.tgz  # Inspect contents
   ```

### Phase 3: Documentation

1. Create/update `README.md` with installation guide
2. Create `PUBLISHING.md` for maintainers
3. Create `CHANGELOG.md`
4. Create `LICENSE`
5. Create `.npmrc.example`

### Phase 4: Local Testing

1. Create test directory:
   ```bash
   mkdir ../test-install && cd ../test-install
   npm init -y
   ```
2. Install local package:
   ```bash
   npm install ../claude-code-skills/gkim-digital-ltd-*.tgz
   ```
3. Verify:
   - `.claude/` directory copied
   - `CLAUDE.md` copied
   - `install.sh` ran successfully
   - Skills/agents/workflows present

### Phase 5: Registry Publishing

1. Generate GitHub PAT:
   - Settings → Developer settings → Personal access tokens
   - Scopes: `write:packages`, `read:packages`
2. Create `.npmrc` in repo (DO NOT commit):
   ```ini
   @gkim-digital-ltd:registry=https://npm.pkg.github.com/
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   ```
3. Update root `.gitignore` to exclude `.npmrc`
4. Publish:
   ```bash
   npm run prepublishOnly  # Safety check
   npm publish
   ```
5. Verify at: `https://github.com/orgs/GKIM-DIGITAL-LTD/packages`

### Phase 6: Consumer Testing

1. Create new test project
2. Add `.npmrc` with GitHub PAT
3. Install from registry:
   ```bash
   npm install @gkim-digital-ltd/claude-code-skills-agents
   ```
4. Verify postinstall completed successfully

## Postinstall Script Details

Auto-run `install.sh` behavior (per user requirement):

```javascript
// After copying .claude/ directory
const installScript = path.join(projectRoot, '.claude/skills/install.sh');

if (fs.existsSync(installScript)) {
  log('Running skill dependency installer...');
  try {
    execSync('bash .claude/skills/install.sh', {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    log('✓ Dependencies installed successfully');
  } catch (error) {
    log('⚠ install.sh failed - run manually if needed', 'yellow');
    log('  cd .claude/skills && bash install.sh', 'dim');
  }
}
```

**Rationale**: User selected auto-install. Script will attempt to run `install.sh`, but gracefully handle failures (user can run manually if needed).

## Update Strategy (Manual Merge)

Per user requirement: Document manual merge process in README

**README section**:

### Updating

To update to latest version:

1. Backup customizations:
   ```bash
   cp -r .claude .claude.backup
   ```
2. Remove `.claude/` directory:
   ```bash
   rm -rf .claude CLAUDE.md
   ```
3. Update package:
   ```bash
   npm update @gkim-digital-ltd/claude-code-skills-agents
   ```
4. Merge customizations:
   ```bash
   # Compare and merge your changes from .claude.backup/
   diff -r .claude.backup .claude
   ```
5. Clean up:
   ```bash
   rm -rf .claude.backup
   ```

## Verification Steps

**Before publishing:**
- [ ] `npm run test` passes (verify-package.js)
- [ ] `npm run prepublishOnly` passes (safety check)
- [ ] `npm pack` creates package <15MB
- [ ] Inspect `.tgz` contents - no sensitive files
- [ ] Test install in clean project

**After publishing:**
- [ ] Package visible at `https://github.com/orgs/GKIM-DIGITAL-LTD/packages`
- [ ] Test install from registry in fresh project
- [ ] Verify `.claude/` copied correctly
- [ ] Verify `install.sh` ran automatically
- [ ] Verify skills/agents/workflows function correctly

## Publishing Workflow (Manual)

**Per user requirement:** No CI/CD initially

```bash
# 1. Update version
npm version patch  # or minor, major

# 2. Run safety checks
npm test
npm run prepublishOnly

# 3. Publish to GitHub Packages
export GITHUB_TOKEN=your_pat_here
npm publish

# 4. Push changes
git push && git push --tags

# 5. Verify publication
open https://github.com/orgs/GKIM-DIGITAL-LTD/packages
```

## Package Size Estimation

- `.claude/` structure (excluding `.venv`, `node_modules`, `cache`): ~5-10MB
- Total package: ~5-10MB (well under 15MB limit)

## Consumer Installation Flow

```bash
# 1. Setup .npmrc
echo "@gkim-digital-ltd:registry=https://npm.pkg.github.com/" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_PAT" >> .npmrc

# 2. Install (auto-runs postinstall)
npm install @gkim-digital-ltd/claude-code-skills-agents

# Postinstall automatically:
# - Copies .claude/ to project root
# - Copies CLAUDE.md to project root
# - Runs .claude/skills/install.sh

# 3. Configure environment
cp .claude/.env.example .claude/.env
# Edit .env with API keys

# 4. Ready to use!
```

## CI/CD (Future Enhancement)

Not included in initial implementation per user requirement.

Can add later: `.github/workflows/publish.yml` for auto-publish on version tags

## Risk Mitigation

**Sensitive data leak:**
- ✓ `prepublishOnly` script checks for sensitive files
- ✓ `.npmignore` + `files` array double exclusion
- ✓ Manual review before publish

**Large package size:**
- ✓ Exclude `.venv/` and `node_modules/`
- ✓ Exclude cache and history files
- ✓ Test with `npm pack`

**Installation failures:**
- ✓ Postinstall has error handling
- ✓ `install.sh` failure is non-fatal (warns user)
- ✓ Manual fallback documented

**Breaking changes:**
- ✓ Follow semver strictly
- ✓ Document in CHANGELOG
- ✓ Non-overwrite preserves customizations

## Success Criteria

- Package publishes to GitHub Packages
- Package size <15MB
- No sensitive files in package
- Postinstall copies all files
- Postinstall auto-runs `install.sh`
- Existing files preserved (not overwritten)
- Test installation succeeds
- Skills/agents/workflows function after install
- Complete documentation