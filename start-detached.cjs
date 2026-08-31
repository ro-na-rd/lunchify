const { spawn } = require('child_process');
const path = require('path');

const serverDir = path.join(__dirname, 'server');
const clientDir = path.join(__dirname, 'client');

function startDetached(cmd, args, cwd) {
  const child = spawn(cmd, args, {
    cwd,
    detached: true,
    stdio: 'ignore',
    shell: true,
    windowsHide: true,
  });
  child.unref();
  return child.pid;
}

console.log('Starting Lunchify...');
const serverPid = startDetached('node', ['src/index.js'], serverDir);
console.log('Server PID:', serverPid);
const clientPid = startDetached('node', ['node_modules/vite/bin/vite.js', '--host'], clientDir);
console.log('Client PID:', clientPid);
console.log('Both processes started detached.');
