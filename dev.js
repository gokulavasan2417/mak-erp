const { spawn, execSync } = require('child_process');
const path = require('path');

// ANSI Color codes
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

console.log(`${colors.cyan}${colors.bold}==========================================${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}   Starting MAK Tours & Travels ERP       ${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}==========================================${colors.reset}`);
console.log(`${colors.gray}Backend:  http://localhost:5000${colors.reset}`);
console.log(`${colors.gray}Frontend: http://localhost:5173${colors.reset}\n`);

const isWindows = process.platform === 'win32';

function killProcess(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (isWindows) {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-proc.pid, 'SIGINT');
    }
  } catch {
    // Process might already be closed
  }
}

function startProcess(name, commandString, cwd, color) {
  const proc = spawn(commandString, {
    cwd,
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe']
  });

  const prefix = `${color}[${name}]${colors.reset} `;

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/);
    lines.forEach((line) => {
      if (line.trim().length > 0) {
        console.log(`${prefix}${line}`);
      }
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/);
    lines.forEach((line) => {
      if (line.trim().length > 0) {
        console.error(`${prefix}${colors.red}${line}${colors.reset}`);
      }
    });
  });

  return proc;
}

const backendProc = startProcess(
  'Backend',
  'npm run dev',
  path.join(__dirname, 'backend'),
  colors.cyan
);

const frontendProc = startProcess(
  'Frontend',
  'npm run dev',
  path.join(__dirname, 'frontend'),
  colors.green
);

let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log(`\n${colors.yellow}Shutting down MAK-ERP services...${colors.reset}`);
  killProcess(backendProc);
  killProcess(frontendProc);
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
