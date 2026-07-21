import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const failures = [];
const checks = [];

function check(name, condition, detail = '') {
  checks.push({ name, pass: Boolean(condition), detail });
  if (!condition) failures.push(`${name}${detail ? `: ${detail}` : ''}`);
}

const required = [
  'index.html',
  'assets/css/app.css',
  'assets/css/theme-dark.css',
  'assets/js/core/constants.js',
  'assets/js/data/local-state.js',
  'assets/js/domain/task-service.js',
  'assets/js/ui/shared.js',
  'assets/js/ui/task-detail.js',
  'assets/js/pages/dashboard.js',
  'assets/js/pages/my-tasks.js',
  'assets/js/pages/team-board.js',
  'assets/js/pages/review-queue.js',
  'assets/js/pages/calendar.js',
  'assets/js/pages/settings.js',
  'assets/js/ui/runtime.js',
  'assets/js/services/api-task-service.js',
  'docs/OPENAPI.yaml',
  'docs/DATABASE_SCHEMA.sql',
  'docs/ROLE_PERMISSION_MATRIX.md'
];
required.forEach(file => check(`Required file ${file}`, fs.existsSync(path.join(root, file))));

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
check('No duplicate static IDs', duplicates.length === 0, duplicates.join(', '));
check('No inline click handlers', !/\bonclick\s*=/.test(html));
check('No inline change handlers', !/\bonchange\s*=/.test(html));

const srcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/g)].map(match => match[1]);
const hrefs = [...html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*>/g)].map(match => match[1]);
[...srcs, ...hrefs].forEach(asset => check(`Referenced asset ${asset}`, fs.existsSync(path.join(root, asset))));

const expectedOrder = [
  'assets/js/core/config.js',
  'assets/js/services/http-client.js',
  'assets/js/services/api-task-service.js',
  'assets/js/core/constants.js',
  'assets/js/data/local-state.js',
  'assets/js/domain/task-service.js',
  'assets/js/ui/shared.js',
  'assets/js/ui/task-detail.js',
  'assets/js/pages/dashboard.js',
  'assets/js/pages/my-tasks.js',
  'assets/js/pages/team-board.js',
  'assets/js/pages/review-queue.js',
  'assets/js/pages/calendar.js',
  'assets/js/pages/settings.js',
  'assets/js/ui/runtime.js'
];
check('Application script order', expectedOrder.every((value, index) => srcs[index + 1] === value), srcs.join(' -> '));

const applicationScripts = expectedOrder.slice(3);
for (const script of [...expectedOrder]) {
  try {
    execFileSync(process.execPath, ['--check', path.join(root, script)], { stdio: 'pipe' });
    check(`JavaScript syntax ${script}`, true);
  } catch (error) {
    check(`JavaScript syntax ${script}`, false, error.stderr?.toString() || error.message);
  }
}

const combinedPath = path.join(os.tmpdir(), `accounting-task-${process.pid}.js`);
fs.writeFileSync(combinedPath, applicationScripts.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n'));
try {
  execFileSync(process.execPath, ['--check', combinedPath], { stdio: 'pipe' });
  check('Combined application syntax', true);
} catch (error) {
  check('Combined application syntax', false, error.stderr?.toString() || error.message);
} finally {
  fs.rmSync(combinedPath, { force: true });
}

const domainCode = fs.readFileSync(path.join(root, 'assets/js/domain/task-service.js'), 'utf8');
check('LocalTaskService boundary present', domainCode.includes('const LocalTaskService='));
check('TaskService adapter present', domainCode.includes('const TaskService = LocalTaskService'));
check('API service is asynchronous', fs.readFileSync(path.join(root, 'assets/js/services/api-task-service.js'), 'utf8').includes('class ApiTaskService'));

console.table(checks);
if (failures.length) {
  console.error(`\nValidation failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nValidation passed: ${checks.length}/${checks.length}`);
