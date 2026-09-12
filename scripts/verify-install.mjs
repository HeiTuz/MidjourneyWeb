#!/usr/bin/env node
// Compare an installed runtime copy to this checkout, including the host overlay.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { payloadFiles } from './install.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

export function verifyInstall(sourceRoot, destination, host) {
  const errors = [];
  if (!fs.existsSync(destination) || !fs.lstatSync(destination).isDirectory()) {
    return ['Expected an installed directory copy'];
  }
  const files = payloadFiles(sourceRoot, host);
  const expected = new Set(files.map(file => file.to));
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(path.join(destination, '.midjourney-install.json'), 'utf8')); }
  catch { return ['Missing or invalid install manifest']; }
  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return ['Missing or invalid install manifest'];
  }
  if (manifest.host !== host) errors.push('Host mismatch');
  for (const file of files) {
    const installed = path.join(destination, file.to);
    if (!fs.existsSync(installed) || !fs.lstatSync(installed).isFile()) {
      errors.push(`Missing/non-regular payload: ${file.to}`);
      continue;
    }
    const hash = digest(file.from);
    if (digest(installed) !== hash) errors.push(`Content differs: ${file.to}`);
    if (manifest.hashes?.[file.to] !== hash) errors.push(`Manifest differs: ${file.to}`);
  }
  for (const key of Object.keys(manifest.hashes || {})) {
    if (!expected.has(key)) errors.push(`Unexpected manifest entry: ${key}`);
  }
  function walk(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), relative + '/');
      else if (relative !== '.midjourney-install.json' && !expected.has(relative)) errors.push(`Unexpected installed file: ${relative}`);
    }
  }
  walk(destination);
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [host, destination] = process.argv.slice(2);
  if (!['codex', 'claude', 'hermes'].includes(host) || !destination || process.argv.length !== 4) {
    console.error('Usage: node scripts/verify-install.mjs codex|claude|hermes <installed-skill-directory>');
    process.exitCode = 1;
  } else {
    const errors = verifyInstall(root, path.resolve(destination), host);
    console.log(errors.length ? errors.join('\n') : `Installed ${host} payload matches canonical files and host adapter`);
    process.exitCode = Number(errors.length > 0);
  }
}
