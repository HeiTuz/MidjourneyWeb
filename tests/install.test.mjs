import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { install, parseArgs, plan, payloadFiles } from '../scripts/install.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mj-install-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const source = path.join(dir, 'source'), home = path.join(dir, 'home');
  fs.mkdirSync(home);
  fs.cpSync(path.join(repo, 'skills'), path.join(source, 'skills'), { recursive: true });
  fs.cpSync(path.join(repo, 'hosts'), path.join(source, 'hosts'), { recursive: true });
  fs.copyFileSync(path.join(repo, 'LICENSE'), path.join(source, 'LICENSE'));
  const dest = path.join(home, '.codex', 'skills', 'midjourney-web');
  return { dir, source, home, dest, options: { sourceRoot: source, home, env: {} } };
}

test('argument validation, npm separator and gpt alias', () => {
  assert.equal(parseArgs(['--', '--target=gpt', '--dry-run']).target, 'codex');
  for (const args of [['--dest'], ['--target', '--force'], ['--target=nope'], ['--wat'], ['--dest=x', '--target=all']]) assert.throws(() => parseArgs(args));
});

test('auto selection uses directory existence only; explicit target and CODEX_HOME win', t => {
  const f = fixture(t);
  assert.equal(plan(parseArgs([]), f.home)[0].host, 'codex');
  for (const host of ['codex', 'hermes', 'claude']) fs.mkdirSync(path.join(f.home, '.' + host));
  fs.writeFileSync(path.join(f.home, '.claude', 'settings.json'), 'this is not parsed JSON');
  assert.equal(plan(parseArgs([]), f.home)[0].host, 'claude');
  assert.equal(plan(parseArgs(['--target=all']), f.home).length, 3);
  const custom = path.join(f.home, 'codex-custom');
  assert.equal(plan(parseArgs(['--target=codex']), f.home, { CODEX_HOME: custom })[0].destination, path.join(custom, 'skills', 'midjourney-web'));
});

test('dry run creates no destination and validates the payload', t => {
  const f = fixture(t);
  const r = install([{ host: 'codex', destination: f.dest }], { ...f.options, dryRun: true });
  assert.equal(r[0].dryRun, true);
  assert.equal(fs.existsSync(path.dirname(f.dest)), false);
});

test('installed copy survives removal of its source checkout', t => {
  const f = fixture(t);
  install([{ host: 'codex', destination: f.dest }], f.options);
  assert.equal(fs.lstatSync(f.dest).isSymbolicLink(), false);
  fs.rmSync(f.source, { recursive: true });
  assert.match(fs.readFileSync(path.join(f.dest, 'SKILL.md'), 'utf8'), /name: midjourney-web/);
  assert.ok(fs.existsSync(path.join(f.dest, 'agents', 'openai.yaml')));
});

test('force updates preserve complete prior install outside discovery tree', t => {
  const f = fixture(t);
  const plans = [{ host: 'codex', destination: f.dest }];
  install(plans, f.options);
  fs.writeFileSync(path.join(f.dest, 'user-note.txt'), 'preserve me');
  assert.throws(() => install(plans, f.options), /Destination exists/);
  const result = install(plans, { ...f.options, force: true })[0];
  assert.equal(fs.readFileSync(path.join(result.backup, 'user-note.txt'), 'utf8'), 'preserve me');
  assert.equal(fs.existsSync(path.join(f.dest, 'user-note.txt')), false);
  assert.equal(result.backup.includes(path.join('.codex', 'skills')), false);
});

test('migrate owned source symlink without modifying source', t => {
  const f = fixture(t);
  const canonical = path.join(f.source, 'skills', 'midjourney-web');
  fs.mkdirSync(path.dirname(f.dest), { recursive: true });
  fs.symlinkSync(canonical, f.dest, 'dir');
  const bytes = fs.readFileSync(path.join(canonical, 'SKILL.md'));
  const r = install([{ host: 'codex', destination: f.dest }], { ...f.options, force: true })[0];
  assert.ok(fs.lstatSync(r.backup).isSymbolicLink());
  assert.deepEqual(fs.readFileSync(path.join(canonical, 'SKILL.md')), bytes);
  assert.equal(fs.lstatSync(f.dest).isSymbolicLink(), false);
});

test('force refuses unrelated files, directories and broken links', t => {
  const f = fixture(t);
  fs.mkdirSync(path.dirname(f.dest), { recursive: true });
  for (const kind of ['directory', 'file', 'link']) {
    if (kind === 'directory') fs.mkdirSync(f.dest);
    if (kind === 'file') fs.writeFileSync(f.dest, 'preserve');
    if (kind === 'link') fs.symlinkSync(path.join(f.home, 'missing'), f.dest);
    assert.throws(() => install([{ host: 'codex', destination: f.dest }], { ...f.options, force: true }), /unrelated/);
    assert.ok(fs.lstatSync(f.dest));
    fs.rmSync(f.dest, { recursive: true });
  }
});

test('dangerous destinations are rejected including alias parents', t => {
  const f = fixture(t);
  const alias = path.join(f.dir, 'source-alias');
  fs.symlinkSync(f.source, alias, 'dir');
  for (const destination of [f.home, f.source, path.join(f.source, 'new'), path.join(alias, 'new'), path.dirname(f.dest), path.parse(f.home).root]) {
    assert.throws(() => install([{ host: 'codex', destination }], { ...f.options, force: true, dryRun: true }), /Unsafe/);
  }
});

test('payload excludes local notes and rejects escaping symlinks', t => {
  const f = fixture(t), refs = path.join(f.source, 'skills', 'midjourney-web', 'references');
  fs.writeFileSync(path.join(refs, 'private.local.md'), 'private');
  fs.writeFileSync(path.join(refs, '.secret.md'), 'private');
  fs.writeFileSync(path.join(refs, 'draft.md.bak'), 'private');
  assert.ok(payloadFiles(f.source, 'codex').every(file => !/private|secret|bak/.test(file.to)));
  fs.symlinkSync(path.join(f.source, 'LICENSE'), path.join(refs, 'linked.md'));
  assert.throws(() => payloadFiles(f.source, 'codex'), /Non-regular/);
});

test('all hosts get their adapter and exactly one skill entry', t => {
  const f = fixture(t);
  const plans = ['codex', 'claude', 'hermes'].map(host => ({ host, destination: path.join(f.home, 'test-' + host) }));
  install(plans, f.options);
  for (const p of plans) {
    assert.ok(fs.existsSync(path.join(p.destination, 'SKILL.md')));
    assert.equal(fs.existsSync(path.join(p.destination, 'agents')), p.host === 'codex');
    assert.equal(fs.readFileSync(path.join(p.destination, 'references', 'host.md'), 'utf8'), fs.readFileSync(path.join(f.source, 'hosts', p.host + '.md'), 'utf8'));
  }
});

test('one conflict prevents any writes to all targets', t => {
  const f = fixture(t), blocked = path.join(f.home, 'blocked');
  fs.mkdirSync(blocked);
  assert.throws(() => install([{ host: 'codex', destination: f.dest }, { host: 'claude', destination: blocked }], f.options));
  assert.equal(fs.existsSync(f.dest), false);
});

test('npm-style symlink binary executes the CLI', t => {
  const f = fixture(t), bin = path.join(f.dir, 'heituz-midjourney');
  fs.symlinkSync(path.join(repo, 'scripts', 'install.mjs'), bin);
  const output = execFileSync(process.execPath, [bin, '--help'], { encoding: 'utf8' });
  assert.match(output, /MidjourneyWeb installer/);
});

test('failure applying a second target rolls back the first', t => {
  const f = fixture(t);
  const second = path.join(f.home, 'second-skill');
  const plans = [{ host: 'codex', destination: f.dest }, { host: 'claude', destination: second }];
  install(plans, f.options);
  fs.writeFileSync(path.join(f.dest, 'old.txt'), 'first original');
  fs.writeFileSync(path.join(second, 'old.txt'), 'second original');
  const rename = fs.renameSync;
  t.mock.method(fs, 'renameSync', (from, to) => {
    if (String(from).includes('.midjourney-stage-') && to === second) throw new Error('simulated apply failure');
    return rename(from, to);
  });
  assert.throws(() => install(plans, { ...f.options, force: true }), /simulated/);
  assert.equal(fs.readFileSync(path.join(f.dest, 'old.txt'), 'utf8'), 'first original');
  assert.equal(fs.readFileSync(path.join(second, 'old.txt'), 'utf8'), 'second original');
});

test('packed npm payload excludes local data and runs offline from its binary', t => {
  const f = fixture(t);
  for (const file of ['package.json', 'README.md', 'README.ko.md', 'RELEASING.md']) fs.copyFileSync(path.join(repo, file), path.join(f.source, file));
  fs.mkdirSync(path.join(f.source, 'scripts'));
  fs.copyFileSync(path.join(repo, 'scripts', 'install.mjs'), path.join(f.source, 'scripts', 'install.mjs'));
  fs.writeFileSync(path.join(f.source, 'skills', 'midjourney-web', 'references', 'private.local.md'), 'private test fixture');
  fs.writeFileSync(path.join(f.source, 'private.log'), 'private test fixture');
  const cache = path.join(f.dir, 'npm-cache');
  const packed = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--cache', cache, '--pack-destination', f.dir], { cwd: f.source, encoding: 'utf8' }))[0];
  assert.ok(packed.files.every(file => !/private|node_modules|\.git\//.test(file.path)));
  assert.ok(packed.files.some(file => file.path === 'README.ko.md'));
  const archive = path.join(f.dir, packed.filename);
  const output = execFileSync('npm', ['exec', '--offline', '--yes', '--cache', cache, '--package', archive, '--', 'heituz-midjourney', '--target', 'codex', '--dest', f.dest], { cwd: f.home, encoding: 'utf8', timeout: 30000 });
  assert.match(output, /"host":"codex"/);
  fs.rmSync(f.source, { recursive: true });
  fs.rmSync(cache, { recursive: true });
  assert.match(fs.readFileSync(path.join(f.dest, 'SKILL.md'), 'utf8'), /name: midjourney-web/);
  assert.ok(fs.existsSync(path.join(f.dest, 'references', 'host.md')));
});
