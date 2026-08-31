const { spawn } = require('child_process');
const path = require('path');

const serverDir = path.join(__dirname, 'server');
const clientDir = path.join(__dirname, 'client');

console.log('Starting server...');
const server = spawn('node', ['src/index.js'], { cwd: serverDir, detached: true, stdio: 'ignore' });
server.unref();
console.log('Server PID:', server.pid);

console.log('Starting client...');
const client = spawn('node', ['node_modules/vite/bin/vite.js', '--host'], { cwd: clientDir, detached: true, stdio: 'ignore' });
client.unref();
console.log('Client PID:', client.pid);

setTimeout(() => { console.log('Done. Both processes started.'); process.exit(0); }, 1000);
