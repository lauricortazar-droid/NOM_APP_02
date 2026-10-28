import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import assert from 'node:assert/strict';

const port = 35837;
const base = 'http://127.0.0.1:' + port;
const child = spawn(process.execPath, ['server.js'], {
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stderr.on('data', b => { output += b; });
child.stdout.on('data', b => { output += b; });

async function request(path, options = {}) {
  for (let i = 0; i < 35; i++) {
    try {
      return await fetch(base + path, options);
    } catch (error) {
      if (child.exitCode !== null) throw new Error('Servidor finalizó: ' + output);
      await sleep(200);
    }
  }
  throw new Error('Servidor no inició: ' + output);
}

try {
  const home = await request('/');
  assert.equal(home.status, 200);
  assert.match(await home.text(), /CentroVida DEMO/);
  assert.match(home.headers.get('content-type') || '', /text\/html/);
  assert.match(home.headers.get('x-robots-tag') || '', /noindex/);

  const route = await request('/personas', { headers: { Accept: 'text/html' } });
  assert.equal(route.status, 200);
  assert.match(await route.text(), /CentroVida DEMO/);

  const missing = await request('/assets/not-here.js');
  assert.equal(missing.status, 404);
  console.log('OK: Hostinger Express sirve dist/, SPA y devuelve 404 para assets inexistentes');
} finally {
  child.kill('SIGTERM');
}
