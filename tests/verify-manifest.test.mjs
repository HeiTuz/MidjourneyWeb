import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyInstall } from '../scripts/verify-install.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('invalid manifest roots return errors without running an installer', t => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'mj-manifest-input-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  // Input data only: no installer call, payload copy, or real skill destination.
  for (const content of ['null', 'false', '0', '"text"', '[]', '[1]', '{']) {
    fs.writeFileSync(path.join(fixture, '.midjourney-install.json'), content);
    assert.deepEqual(verifyInstall(root, fixture, 'codex'), ['Missing or invalid install manifest']);
  }
});
