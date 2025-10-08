#!/usr/bin/env node
// Simple updater: injects the todos.json content into start.md between markers
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const startPath = path.join(root, 'start.md');
const todosPath = path.join(root, 'todos.json');

function renderTodos(todos) {
  if (!Array.isArray(todos)) return '';
  let out = '\n## Tracked Todos\n\n';
  for (const t of todos) {
    out += `- [${t.status === 'completed' ? 'x' : ' '}] ${t.id}. ${t.title} — ${t.status}\n`;
    if (t.description) out += `  - ${t.description}\n`;
  }
  return out;
}

async function main() {
  const md = fs.readFileSync(startPath, 'utf8');
  const todosRaw = fs.readFileSync(todosPath, 'utf8');
  const todos = JSON.parse(todosRaw);
  const rendered = renderTodos(todos);

  const startMarker = '<!-- TODOS-START -->';
  const endMarker = '<!-- TODOS-END -->';
  const startIdx = md.indexOf(startMarker);
  const endIdx = md.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) {
    console.error('Markers not found in start.md');
    process.exit(2);
  }

  const newMd = md.slice(0, startIdx + startMarker.length) + '\n' + rendered + '\n' + md.slice(endIdx);
  fs.writeFileSync(startPath, newMd, 'utf8');
  console.log('start.md updated with todos');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
