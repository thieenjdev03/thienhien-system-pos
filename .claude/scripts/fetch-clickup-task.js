#!/usr/bin/env node
/**
 * Fetch ClickUp task details by task ID
 * Usage: node fetch-clickup-task.js <task-id>
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env in skills directory
function loadEnv() {
  const envPath = path.join(process.env.HOME, '.claude', 'skills', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env file not found at:', envPath);
    console.error('Please create .env file with CLICKUP_API_TOKEN=your_token');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key.trim()] = value;
      }
    }
  }
}

function fetchClickUpTask(taskId) {
  return new Promise((resolve, reject) => {
    const apiToken = process.env.CLICKUP_API_TOKEN;

    if (!apiToken) {
      reject(new Error('CLICKUP_API_TOKEN not found in environment variables'));
      return;
    }

    const options = {
      hostname: 'api.clickup.com',
      path: `/api/v2/task/${taskId}`,
      method: 'GET',
      headers: {
        'Authorization': apiToken,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const taskData = JSON.parse(data);
            resolve(taskData);
          } catch (error) {
            reject(new Error(`Failed to parse JSON response: ${error.message}`));
          }
        } else {
          reject(new Error(`ClickUp API returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.end();
  });
}

function formatTaskDetails(task) {
  const output = {
    id: task.id,
    name: task.name,
    description: task.description || 'No description provided',
    status: task.status?.status || 'Unknown',
    priority: task.priority?.priority || 'None',
    due_date: task.due_date ? new Date(parseInt(task.due_date)).toISOString() : 'Not set',
    tags: task.tags?.map(t => t.name).join(', ') || 'None',
    assignees: task.assignees?.map(a => a.username).join(', ') || 'Unassigned',
    custom_fields: [],
    subtasks: [],
    checklist_items: []
  };

  // Extract custom fields
  if (task.custom_fields) {
    output.custom_fields = task.custom_fields.map(field => ({
      name: field.name,
      value: field.value || 'Not set'
    }));
  }

  // Extract subtasks
  if (task.subtasks) {
    output.subtasks = task.subtasks.map(st => ({
      name: st.name,
      status: st.status?.status || 'Unknown'
    }));
  }

  // Extract checklist items
  if (task.checklists) {
    task.checklists.forEach(checklist => {
      checklist.items?.forEach(item => {
        output.checklist_items.push({
          checklist: checklist.name,
          item: item.name,
          resolved: item.resolved
        });
      });
    });
  }

  return output;
}

function generateMarkdown(taskDetails) {
  let markdown = `# ${taskDetails.name}\n\n`;
  markdown += `**Task ID:** ${taskDetails.id}\n\n`;
  markdown += `**Status:** ${taskDetails.status}\n`;
  markdown += `**Priority:** ${taskDetails.priority}\n`;
  markdown += `**Due Date:** ${taskDetails.due_date}\n`;
  markdown += `**Assignees:** ${taskDetails.assignees}\n`;
  markdown += `**Tags:** ${taskDetails.tags}\n\n`;

  markdown += `## Description\n\n${taskDetails.description}\n\n`;

  if (taskDetails.custom_fields.length > 0) {
    markdown += `## Custom Fields\n\n`;
    taskDetails.custom_fields.forEach(field => {
      markdown += `- **${field.name}:** ${field.value}\n`;
    });
    markdown += '\n';
  }

  if (taskDetails.subtasks.length > 0) {
    markdown += `## Subtasks\n\n`;
    taskDetails.subtasks.forEach(subtask => {
      markdown += `- [${subtask.status === 'complete' ? 'x' : ' '}] ${subtask.name}\n`;
    });
    markdown += '\n';
  }

  if (taskDetails.checklist_items.length > 0) {
    markdown += `## Checklist Items\n\n`;
    let currentChecklist = '';
    taskDetails.checklist_items.forEach(item => {
      if (item.checklist !== currentChecklist) {
        markdown += `\n### ${item.checklist}\n\n`;
        currentChecklist = item.checklist;
      }
      markdown += `- [${item.resolved ? 'x' : ' '}] ${item.item}\n`;
    });
    markdown += '\n';
  }

  return markdown;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node fetch-clickup-task.js <task-id>');
    console.error('Example: node fetch-clickup-task.js 86b0z9y2m');
    process.exit(1);
  }

  const taskId = args[0];
  const outputFormat = args[1] || 'markdown'; // 'json' or 'markdown'

  try {
    loadEnv();
    const task = await fetchClickUpTask(taskId);
    const taskDetails = formatTaskDetails(task);

    if (outputFormat === 'json') {
      console.log(JSON.stringify(taskDetails, null, 2));
    } else {
      console.log(generateMarkdown(taskDetails));
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
