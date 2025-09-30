/** IntegrationPanel – lists available integrations and surfaces conflicts.
 * This is a lightweight, framework-agnostic placeholder (no React dependency yet).
 * Later we can provide a React wrapper or Web Component.
 */
import fs from 'node:fs';
import path from 'node:path';

export function loadIntegrationSchema(baseDir = process.cwd()) {
  const p = path.join(baseDir, 'dashboard-core', 'src', 'data', 'integration-schema.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return { integrations: [], error: String(e) };
  }
}

export function renderIntegrationPanel({ schema, opts = {} } = {}) {
  const data = schema || loadIntegrationSchema(opts.baseDir);
  const rows = (data.integrations || []).map(int => {
    const conflicts = int.conflicts && int.conflicts.length ? `<span class="conflicts" data-conflicts="${int.conflicts.join(', ')}">⚠ Conflicts: ${int.conflicts.join(', ')}</span>` : '';
    return `<li class="integration" data-name="${int.name}"><strong>${int.name}</strong> – ${int.capabilities.join(', ')} ${conflicts}</li>`;
  }).join('\n');
  return `<section class="integration-panel"><h3>Integrations</h3><ul>${rows}</ul></section>`;
}

// Convenience CLI preview
if (import.meta.url === 'file://' + process.argv[1]) {
  const html = renderIntegrationPanel({});
  console.log(html);
}
