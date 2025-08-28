const { spawn } = require('child_process');

console.log('Starting Channel Manager...');

const child = spawn('npm', ['run', 'start:dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('Failed to start Channel Manager:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`Channel Manager exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down Channel Manager...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down Channel Manager...');
  child.kill('SIGTERM');
}); 