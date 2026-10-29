import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const child = spawn(process.execPath, [fileURLToPath(new URL('./server.mjs', import.meta.url))], {
  env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
});
try {
  const origin = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
    child.stdout.on('data', bytes => {
      output += bytes;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('exit', code => { clearTimeout(timer); reject(new Error(`Server exited: ${code}`)); });
    child.stderr.on('data', bytes => process.stderr.write(bytes));
  });
  for (const [path, type] of [['/', 'text/html'], ['/styles.css', 'text/css'], ['/app.js', 'text/javascript'], ['/questions.js', 'text/javascript'], ['/recall.js', 'text/javascript']]) {
    const r = await fetch(origin + path);
    assert.equal(r.status, 200, path);
    assert(r.headers.get('content-type').includes(type));
    assert((await r.text()).length > 100);
  }
  assert.equal((await fetch(origin + '/.openai/hosting.json')).status, 404);
  assert.equal((await fetch(origin + '/README.md')).status, 404);
  assert.equal((await fetch(origin + '/', { method: 'POST' })).status, 405);
  const head = await fetch(origin + '/', { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  console.log('HTTP assets, MIME types, HEAD, unsupported methods and file boundaries: passed');
} finally {
  child.kill();
}
