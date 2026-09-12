import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mediaURL, parseArgs, createBridge } from '../skills/midjourney-web/scripts/media-bridge.mjs';

const image = 'https://cdn.midjourney.com/example/image.png?first=1&second=2';

test('bridge accepts explicit image URLs without deriving paths or credentials', () => {
  assert.deepEqual(parseArgs(['--url', image, '--url', 'https://cdn.midjourney.com/example/output.jpeg']), [image, 'https://cdn.midjourney.com/example/output.jpeg']);
  for (const url of ['http://cdn.midjourney.com/example/a.png', 'https://example.com/a.png', 'https://cdn.midjourney.com.example.com/a.png', 'https://user:pass@cdn.midjourney.com/a.png', 'https://cdn.midjourney.com/a.png#fragment', 'file:///tmp/a.png', 'https://cdn.midjourney.com/script.js']) {
    assert.throws(() => mediaURL(url));
  }
  for (const args of [[], ['--url'], ['--url', '--url'], ['--unknown', image]]) assert.throws(() => parseArgs(args));
});

test('bridge serves only its in-memory document and preserves escaped query separators', async t => {
  const server = createBridge([image]);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const url = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(url);
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.ok(body.includes('src="https://cdn.midjourney.com/example/image.png?first=1&amp;second=2"'));
  assert.ok(body.includes('alt="Asset 1"'));
  assert.equal((await fetch(url + '/package.json')).status, 404);
  assert.equal((await fetch(url, { method: 'POST' })).status, 405);
  const head = await fetch(url, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('actual bridge CLI reports a loopback URL and terminates cleanly', async t => {
  const script = fileURLToPath(new URL('../skills/midjourney-web/scripts/media-bridge.mjs', import.meta.url));
  const child = spawn(process.execPath, [script, '--url', image], { stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => child.kill('SIGTERM'));
  const [chunk] = await once(child.stdout, 'data');
  const info = JSON.parse(chunk.toString());
  assert.match(info.url, /^http:\/\/127\.0\.0\.1:\d+\/$/);
  assert.equal(info.images, 1);
  assert.equal((await fetch(info.url)).status, 200);
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  const [code] = await exited;
  assert.equal(code, 0);
});
