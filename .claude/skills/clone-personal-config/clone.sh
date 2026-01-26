#!/bin/bash

# Clone Personal Claude Code Configuration
# Clones personal .claude config from GKIM-DIGITAL-LTD/claude-code-skills-agents

set -e  # Exit on error

REPO_URL="git@github.com:GKIM-DIGITAL-LTD/claude-code-skills-agents.git"
TARGET_DIR=".claude"
TEMP_DIR=".claude-temp"

echo "🔧 Cloning personal Claude Code configuration..."
echo "📦 Repository: ${REPO_URL}"
echo ""

# Step 1: Remove existing .claude if it exists
if [ -d "${TARGET_DIR}" ]; then
    echo "⚠️  Removing existing ${TARGET_DIR} folder..."
    rm -rf "${TARGET_DIR}"
fi

# Step 2: Clone repository
echo "📥 Cloning repository..."
if ! git clone "${REPO_URL}" "${TEMP_DIR}"; then
    echo "❌ Failed to clone repository"
    exit 1
fi

# Step 3: Check for nested .claude directory and restructure
if [ -d "${TEMP_DIR}/.claude" ]; then
    echo "📁 Restructuring nested directory..."
    mv "${TEMP_DIR}/.claude" "${TARGET_DIR}"
    rm -rf "${TEMP_DIR}"
else
    # If no nested directory, just rename
    echo "📁 Setting up directory..."
    mv "${TEMP_DIR}" "${TARGET_DIR}"
fi

# Step 4: Verify installation
echo ""
echo "✅ Personal Claude Code configuration installed successfully!"
echo ""
echo "📋 Installed components:"
[ -d "${TARGET_DIR}/agents" ] && echo "  ✓ agents/"
[ -d "${TARGET_DIR}/commands" ] && echo "  ✓ commands/"
[ -d "${TARGET_DIR}/hooks" ] && echo "  ✓ hooks/"
[ -d "${TARGET_DIR}/skills" ] && echo "  ✓ skills/"
[ -d "${TARGET_DIR}/workflows" ] && echo "  ✓ workflows/"
[ -f "${TARGET_DIR}/settings.json" ] && echo "  ✓ settings.json"
echo ""
echo "🎉 Setup complete! Your personal configuration is ready to use."
