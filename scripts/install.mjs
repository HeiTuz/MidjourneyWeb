#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const name = 'midjourney-web';
const priority = ['claude', 'hermes', 'codex'];
const normalize = (host) => host === 'gpt' ? 'codex' : host;
const exists = (p) => { try { fs.lstatSync(p); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } };
const contains = (parent, child) => { const rel = path.relative(parent, child); return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel)); };

export function parseArgs(argv) {
  const opts = { target: 'auto', dest: null, force: false, quiet: false, dryRun: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') continue;
    if (a === '--force') opts.force = true;
    else if (a === '--quiet') opts.quiet = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (['--help', '-h'].includes(a)) opts.help = true;
    else if (a === '--target' || a === '--dest' || a.startsWith('--target=') || a.startsWith('--dest=')) {
      const [key, inline] = a.split(/=(.*)/s);
      const value = inline === undefined ? argv[++i] : inline;
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
      opts[key.slice(2)] = value;
    } else throw new Error(`Unknown argument: ${a}`);
  }
  opts.target = normalize(opts.target.toLowerCase());
  if (![...priority, 'auto', 'all'].includes(opts.target)) throw new Error(`Unknown target: ${opts.target}`);
  if (opts.dest && opts.target === 'all') throw new Error('--dest cannot be combined with --target all');
  return opts;
}

export function destinationForTarget(home, host, env = {}) {
  if (host === 'codex') return path.join(env.CODEX_HOME || path.join(home, '.codex'), 'skills', name);
  if (host === 'claude') return path.join(home, '.claude', 'skills', name);
  if (host === 'hermes') return path.join(home, '.hermes', 'skills', 'image-generation', name);
  throw new Error(`Unknown host: ${host}`);
}

export function detectHosts(home, env = {}) {
  return priority.filter(host => fs.existsSync(host === 'codex' && env.CODEX_HOME ? env.CODEX_HOME : path.join(home, '.' + host)));
}

export function plan(opts, home, env = {}) {
  const detected = detectHosts(home, env);
  let hosts = opts.target === 'all' ? detected : [opts.target === 'auto' ? (detected[0] || 'codex') : opts.target];
  if (!hosts.length) throw new Error('No detected hosts for --target all; select a specific host');
  if (opts.dest) {
    const expanded = opts.dest === '~' ? home : opts.dest.replace(/^~[/\\]/, home + path.sep);
    const destination = path.resolve(expanded);
    if (opts.target === 'auto') hosts = [priority.find(h => path.resolve(destinationForTarget(home, h, env)) === destination) || 'codex'];
    return [{ host: hosts[0], destination }];
  }
  return hosts.map(host => ({ host, destination: path.resolve(destinationForTarget(home, host, env)) }));
}

// Resolve ancestors without dereferencing an existing destination symlink.
function physicalParent(p) {
  if (exists(p)) return fs.realpathSync(p);
  const parent = path.dirname(p);
  if (parent === p) return p;
  return path.join(physicalParent(parent), path.basename(p));
}

function checkDestination(destination, home, sourceRoot, env) {
  const dest = path.join(physicalParent(path.dirname(destination)), path.basename(destination));
  const source = fs.realpathSync(sourceRoot);
  const protectedPaths = [home, source, path.join(home, '.local', 'share', 'heituz', name, 'backups'), ...priority.map(h => destinationForTarget(home, h, env)).map(p => path.dirname(p))]
    .map(p => physicalParent(p));
  if (contains(source, dest) || protectedPaths.some(p => contains(dest, p))) throw new Error(`Unsafe destination: ${destination}`);
}

export function payloadFiles(sourceRoot, host) {
  const skill = path.join(sourceRoot, 'skills', name);
  const files = [{ from: path.join(skill, 'SKILL.md'), to: 'SKILL.md' }, { from: path.join(sourceRoot, 'LICENSE'), to: 'LICENSE' }];
  if (host === 'codex') files.push({ from: path.join(skill, 'agents', 'openai.yaml'), to: 'agents/openai.yaml' });
  for (const entry of fs.readdirSync(path.join(skill, 'references'), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.endsWith('.local.md') || !entry.name.endsWith('.md') || entry.name === 'host.md') continue;
    if (!entry.isFile()) throw new Error(`Non-regular reference: ${entry.name}`);
    files.push({ from: path.join(skill, 'references', entry.name), to: 'references/' + entry.name });
  }
  files.push({ from: path.join(sourceRoot, 'hosts', host + '.md'), to: 'references/host.md' });
  for (const file of files) {
    if (!fs.lstatSync(file.from).isFile() || !contains(fs.realpathSync(sourceRoot), fs.realpathSync(file.from))) throw new Error(`Unsafe payload file: ${file.from}`);
  }
  return files;
}

export function install(plans, { sourceRoot = root, home = os.homedir(), env = process.env, force = false, dryRun = false } = {}) {
  // Validate every target and source before making any changes.
  const prepared = plans.map(item => {
    checkDestination(item.destination, home, sourceRoot, env);
    if (exists(item.destination) && !force) throw new Error(`Destination exists: ${item.destination}; use --force to update with backup`);
    if (exists(item.destination) && force) {
      const stat = fs.lstatSync(item.destination);
      const sourceSkill = fs.realpathSync(path.join(sourceRoot, 'skills', name));
      const ownLink = stat.isSymbolicLink() && fs.existsSync(item.destination) && fs.realpathSync(item.destination) === sourceSkill;
      const entry = path.join(item.destination, 'SKILL.md');
      const ownDirectory = stat.isDirectory() && fs.existsSync(entry) && /^name: midjourney-web\r?$/m.test(fs.readFileSync(entry, 'utf8'));
      if (!ownLink && !ownDirectory) throw new Error(`Refusing unrelated destination even with --force: ${item.destination}`);
    }
    return { ...item, files: payloadFiles(sourceRoot, item.host) };
  });
  for (let i = 0; i < prepared.length; i++) for (let j = 0; j < i; j++) {
    if (contains(prepared[i].destination, prepared[j].destination) || contains(prepared[j].destination, prepared[i].destination)) throw new Error('Overlapping install destinations');
  }
  if (dryRun) return prepared.map(({ host, destination, files }) => ({ host, destination, files: files.length, dryRun: true }));
  const staged = [], applied = [];
  try {
    for (const item of prepared) {
      const parent = path.dirname(item.destination);
      fs.mkdirSync(parent, { recursive: true });
      const stage = fs.mkdtempSync(path.join(parent, '.midjourney-stage-'));
      staged.push(stage);
      const hashes = {};
      for (const file of item.files) {
        const to = path.join(stage, file.to);
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(file.from, to);
        hashes[file.to] = crypto.createHash('sha256').update(fs.readFileSync(to)).digest('hex');
      }
      fs.writeFileSync(path.join(stage, '.midjourney-install.json'), JSON.stringify({ host: item.host, hashes }, null, 2) + '\n');
      item.stage = stage;
    }
    for (const item of prepared) {
      // Keep backups outside the skills search tree to avoid duplicate discovery.
      let backup = null;
      if (exists(item.destination)) {
        if (!force) throw new Error(`Destination appeared during install: ${item.destination}`);
        const backupRoot = path.join(home, '.local', 'share', 'heituz', name, 'backups');
        fs.mkdirSync(backupRoot, { recursive: true });
        backup = path.join(backupRoot, `${Date.now()}-${crypto.randomUUID()}`);
        fs.renameSync(item.destination, backup);
      }
      try { fs.renameSync(item.stage, item.destination); }
      catch (e) { if (backup) fs.renameSync(backup, item.destination); throw e; }
      applied.push({ host: item.host, destination: item.destination, backup });
    }
    return applied;
  } catch (e) {
    for (const item of applied.reverse()) {
      fs.rmSync(item.destination, { recursive: true, force: true });
      if (item.backup) fs.renameSync(item.backup, item.destination);
    }
    throw e;
  } finally {
    for (const stage of staged) fs.rmSync(stage, { recursive: true, force: true });
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('MidjourneyWeb installer\n--target auto|all|codex|gpt|claude|hermes\n--dest <skill-directory>\n--force  update with backup\n--dry-run  show plan without writes\n--quiet  errors only\nLocal: node scripts/install.mjs --target codex');
    return;
  }
  const home = os.homedir();
  if (opts.target === 'auto' && !opts.dest && !opts.dryRun && !opts.quiet && process.stdin.isTTY && process.stdout.isTTY && !process.env.CI) {
    const detected = detectHosts(home, process.env);
    const suggested = detected[0] || 'codex';
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
      const answer = (await rl.question(`Detected: ${detected.join(', ') || 'none'}. Target [${suggested}] (codex/claude/hermes/all): `)).trim();
      opts.target = normalize(answer || suggested);
      if (![...priority, 'all'].includes(opts.target)) throw new Error('Invalid target selection');
    } finally { rl.close(); }
  }
  const plans = plan(opts, home, process.env);
  const results = install(plans, { force: opts.force, dryRun: opts.dryRun });
  if (!opts.quiet) for (const result of results) console.log(JSON.stringify(result));
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
