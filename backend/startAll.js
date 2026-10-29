import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const services = [
  { name: 'API GATEWAY       ', file: 'gateway/server.js' },
  { name: 'SERVICE NILAI     ', file: 'service-nilai/server.js' },
  { name: 'SERVICE TRANSKRIP ', file: 'service-transkrip/server.js' },
];

console.log('====================================================');
console.log(' STARTING ZERO TRUST ACADEMIC SYSTEM BACKEND');
console.log('====================================================');

services.forEach(s => {
  const filePath = path.resolve(__dirname, s.file);
  const child = spawn(process.execPath, [filePath], {
    stdio: 'inherit',
    shell: false
  });

  child.on('error', err => {
    console.error(`[${s.name}] Failed to start:`, err);
  });

  child.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`[${s.name}] Process exited with code ${code}`);
    }
  });
});
