// Midjourney helpers for tab objects in the Codex in-app browser (`cua_repl`).
// Load from the installed skill directory:
//   const mj = await import('file://<skill-directory>/scripts/codex-browser.mjs');
// Each helper checks its own postcondition and returns a compact status object.
// Helpers press Enter at most once per call, never retry a submission, and never
// click feed overlays, variations, reruns or other job-starting controls.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

export const ORIGIN = 'https://www.midjourney.com';
export const PROMPT_INPUT = 'textarea#desktop_input_bar';
export const JOB_LINKS = 'a[href*="/jobs/"]';
// SVG group IDs observed inside otherwise unnamed icon buttons (2026-09-29).
export const ICONS = Object.freeze({ addImage: 'AddImageUncentered', settings: 'Settings', folders: 'Folders', search: 'Search' });
export const MUTATING_ICONS = Object.freeze(['TrashIcon', 'Heart', 'Reload', 'SpotlightPin']);
// Role columns of the Imagine bar, identified by their header icons. Feed rows also use
// SubjectReferenceIcon, so role lookups are always scoped to the bar.
export const ROLE_ICONS = Object.freeze({ edit: 'SubjectReferenceIcon', style: 'StyleReferenceIcon', image: 'ImagePromptIcon' });

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const JOB_ID_RE = new RegExp(`^${UUID}$`);
const JOB_PATH_RE = new RegExp(`^/jobs/(${UUID})/?$`);
const MEDIA_PATH_RE = new RegExp(`^/(${UUID})/0_(\\d+)(?:_(\\d+)_N)?\\.(jpe?g|png|webp)$`, 'i');
const LIBRARY_PATH_RE = new RegExp(`^/u/${UUID}/([0-9a-f]{64})_\\d+_N\\.(?:jpe?g|png|webp)$`, 'i');
const SITE_HOSTS = new Set(['www.midjourney.com', 'midjourney.com']);

export function assertJobId(id) {
  if (typeof id !== 'string' || !JOB_ID_RE.test(id)) throw new Error(`Invalid Midjourney job ID: ${String(id).slice(0, 60)}`);
  return id;
}

function assertIndex(index) {
  if (!Number.isInteger(index) || index < 0 || index > 15) throw new Error(`Invalid image index: ${index}`);
  return index;
}

export function jobURL(jobId, index = 0) {
  return `${ORIGIN}/jobs/${assertJobId(jobId)}?index=${assertIndex(index)}`;
}

export function parseJobHref(href) {
  let url;
  try { url = new URL(href, ORIGIN); } catch { return null; }
  if (url.protocol !== 'https:' || !SITE_HOSTS.has(url.hostname)) return null;
  const match = url.pathname.match(JOB_PATH_RE);
  if (!match) return null;
  const raw = url.searchParams.get('index');
  return { jobId: match[1], index: raw !== null && /^\d+$/.test(raw) ? Number(raw) : null };
}

export function orderedJobIds(hrefs) {
  const ids = [];
  for (const href of hrefs) {
    const parsed = parseJobHref(href);
    if (parsed && !ids.includes(parsed.jobId)) ids.push(parsed.jobId);
  }
  return ids;
}

// The Create feed mounts rows lazily: after a submission, older rows can mount
// and look new. A submitted job must appear above the row that was on top before
// submission; without that row there is no evidence, so nothing is returned.
export function newTopJobIds(before, after) {
  if (!before.length) return [];
  const anchor = after.indexOf(before[0]);
  if (anchor === -1) return [];
  const known = new Set(before);
  return after.slice(0, anchor).filter(id => !known.has(id));
}

export function newJobLinkSelector(knownIds) {
  return JOB_LINKS + knownIds.map(id => `:not([href*="${assertJobId(id)}"])`).join('');
}

export function iconSelector(iconId, { allowMutation = false } = {}) {
  if (typeof iconId !== 'string' || !/^[A-Za-z][A-Za-z0-9]*$/.test(iconId)) throw new Error(`Invalid icon ID: ${iconId}`);
  if (MUTATING_ICONS.includes(iconId) && !allowMutation) {
    throw new Error(`${iconId} changes data or starts a job; allow it only for an explicitly requested action`);
  }
  return `button:has(svg g#${iconId})`;
}

export function parseMediaSrc(src) {
  let url;
  try { url = new URL(src); } catch { return null; }
  if (url.protocol !== 'https:' || url.hostname !== 'cdn.midjourney.com') return null;
  const match = url.pathname.match(MEDIA_PATH_RE);
  if (!match) return null;
  return { jobId: match[1], index: Number(match[2]), original: !match[3], ext: match[4].toLowerCase() };
}

// Uploads-library thumbnails in the Add Images panel. The 64-hex name is an opaque
// library ID: it did not equal the SHA-256 of any of 2,908 recent local images, so it
// must not be treated as a file hash.
export function parseLibrarySrc(src) {
  let url;
  try { url = new URL(src); } catch { return null; }
  if (url.protocol !== 'https:' || url.hostname !== 'cdn.midjourney.com') return null;
  const match = url.pathname.match(LIBRARY_PATH_RE);
  return match ? { libraryId: match[1].toLowerCase() } : null;
}

function assertLibraryId(id) {
  if (typeof id !== 'string' || !/^[0-9a-f]{64}$/.test(id)) throw new Error(`Invalid library ID: ${String(id).slice(0, 70)}`);
  return id;
}

// Library items whose aspect ratio matches a local image; candidates for a visual same-source check.
export function sameAspectItems(items, width, height, tolerance = 0.01) {
  if (!(width > 0 && height > 0)) throw new Error('Local image width and height are required');
  const target = width / height;
  return items.filter(item => Math.abs(item.ratio - target) <= tolerance * target);
}

// A role-column attachment is drawn as a background image: library uploads become their
// library ID; any other reference keeps its URL without the query string.
export function referenceKey(style) {
  const url = (String(style ?? '').match(/url\(\s*["']?([^"')]+)["']?\s*\)/) || [])[1];
  if (!url) return null;
  return parseLibrarySrc(url)?.libraryId ?? url.replace(/[?#].*$/, '');
}

function assertRole(role) {
  if (!Object.hasOwn(ROLE_ICONS, role)) throw new Error(`Unknown role: ${role}; use edit, style or image`);
  return role;
}

export function sameReferences(expected, actual) {
  for (const role of Object.keys(expected ?? {})) assertRole(role);
  return Object.keys(ROLE_ICONS).every(role => {
    const want = new Set(expected?.[role] ?? []);
    const have = new Set(actual?.[role] ?? []);
    return want.size === have.size && [...want].every(key => have.has(key));
  });
}

const isEmptyReferences = references => !references || Object.keys(ROLE_ICONS).every(role => !references[role]?.length);

const squash = text => String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

export function promptCore(text) {
  return squash(String(text ?? '').split(/(?:^|\s)--[a-z]/i)[0]);
}

// true/false when the prompt body is long enough to identify a job; null otherwise.
export function promptMatches(submitted, shownText) {
  const core = promptCore(submitted);
  if (core.length < 12) return null;
  return squash(shownText).includes(core);
}

export function classifySubmission(text, freshIds, rowTexts) {
  const jobs = freshIds.map((jobId, i) => ({ jobId, url: jobURL(jobId, 0), promptMatch: promptMatches(text, rowTexts[i] ?? '') }));
  const matched = jobs.filter(job => job.promptMatch === true);
  if (matched.length === 1) return { status: 'submitted', ...matched[0], otherNewJobs: jobs.length - 1 };
  return { status: 'ambiguous', jobs, next: 'The prompt did not identify exactly one new job. Open each job to identify this submission. Do not resubmit.' };
}

// Dimensions plus container checks (JPEG segment bounds and EOI, PNG chunk CRCs
// and IEND, WebP RIFF/chunk sizes). This rejects truncated or malformed files but
// is not a full pixel decode.
export function imageInfo(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const u16 = i => (b[i] << 8) | b[i + 1];
  const u32 = i => ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
  const le16 = i => b[i] | (b[i + 1] << 8);
  const le24 = i => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
  const le32 = i => (le24(i) + b[i + 3] * 0x1000000) >>> 0;
  const ascii = (i, n) => String.fromCharCode(...b.subarray(i, i + n));
  const sized = info => (info.width > 0 && info.height > 0 ? info : null);
  if (b.length >= 8 && u32(0) === 0x89504e47 && u32(4) === 0x0d0a1a0a) {
    let i = 8;
    let info = null;
    while (i + 12 <= b.length) {
      const length = u32(i);
      const type = ascii(i + 4, 4);
      const end = i + 12 + length;
      if (end > b.length || zlib.crc32(b.subarray(i + 4, i + 8 + length)) !== u32(i + 8 + length)) return null;
      if (i === 8) {
        if (type !== 'IHDR' || length !== 13) return null;
        info = sized({ format: 'png', width: u32(i + 8), height: u32(i + 12) });
      }
      if (type === 'IEND') return end === b.length ? info : null;
      i = end;
    }
    return null;
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    if (b[b.length - 2] !== 0xff || b[b.length - 1] !== 0xd9) return null;
    let i = 2;
    let info = null;
    while (i + 4 <= b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      if (marker === 0xff) { i += 1; continue; }
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      if (marker === 0xd8 || marker === 0xd9) return null;
      const length = u16(i + 2);
      if (length < 2 || i + 2 + length > b.length) return null;
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        if (length < 8) return null;
        info = sized({ format: 'jpeg', width: u16(i + 7), height: u16(i + 5) });
      }
      if (marker === 0xda) return info;
      i += 2 + length;
    }
    return null;
  }
  if (b.length >= 20 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    if (le32(4) + 8 !== b.length) return null;
    const chunk = ascii(12, 4);
    const size = le32(16);
    if (20 + size > b.length) return null;
    if (chunk === 'VP8X' && size >= 10) return sized({ format: 'webp', width: 1 + le24(24), height: 1 + le24(27) });
    if (chunk === 'VP8L' && size >= 5 && b[20] === 0x2f) {
      const bits = le32(21);
      return sized({ format: 'webp', width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 });
    }
    if (chunk === 'VP8 ' && size >= 10 && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
      return sized({ format: 'webp', width: le16(26) & 0x3fff, height: le16(28) & 0x3fff });
    }
  }
  return null;
}

// The visibly dominant media must be the requested candidate's decoded original.
export function pickDisplayedOriginal(jobId, index, media) {
  const shown = media.map(item => ({ ...item, parsed: parseMediaSrc(item.src) }))
    .filter(item => item.parsed?.jobId === jobId && item.area > 0);
  if (!shown.length) return { ok: false, reason: 'no-job-media-in-view' };
  const largest = Math.max(...shown.map(item => item.area));
  const dominant = shown.filter(item => item.area >= largest * 0.9);
  if (dominant.some(item => item.parsed.index !== index)) {
    return { ok: false, reason: 'another-candidate-displayed', displayedIndexes: [...new Set(dominant.map(item => item.parsed.index))] };
  }
  const original = dominant.find(item => item.parsed.original && item.complete && item.width > 0);
  if (!original) return { ok: false, reason: 'original-not-decoded' };
  return { ok: true, src: original.src, width: original.width, height: original.height };
}

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export function copyNoOverwrite(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  try {
    fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL);
    return 'copied';
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (sha256(fs.readFileSync(from)) === sha256(fs.readFileSync(to))) return 'identical-existing';
    throw new Error(`Refusing to overwrite a different file: ${to}`);
  }
}

async function currentURL(tab) {
  return new URL(await tab.url());
}

// The in-app browser ends a single locator wait after about 3 s whatever timeout is
// requested, so wait in short slices until the condition holds or the deadline passes.
// Errors other than a wait timeout are rethrown.
export async function waitUntil(locator, state, deadline) {
  for (;;) {
    const left = deadline - Date.now();
    if (left <= 0) return false;
    try {
      await locator.waitFor({ state, timeoutMs: Math.min(left, 3000) });
      return true;
    } catch (error) {
      if (!/deadline exceeded|timed? ?out/i.test(String(error?.message ?? error))) throw error;
    }
  }
}

export async function listJobIds(tab) {
  const hrefs = await tab.playwright.locator(JOB_LINKS).evaluateAll(links => links.map(link => link.getAttribute('href')));
  return orderedJobIds(hrefs);
}

// Text of the largest ancestor that still contains only this job's links.
export async function readJobRowText(tab, jobId) {
  assertJobId(jobId);
  return tab.playwright.evaluate(id => {
    const first = document.querySelector(`a[href*="/jobs/${id}"]`);
    const idsIn = el => new Set([...el.querySelectorAll('a[href*="/jobs/"]')]
      .map(link => (link.getAttribute('href').match(/\/jobs\/([0-9a-f-]{36})/) || [])[1]));
    let row = null;
    for (let el = first?.parentElement; el && el !== document.body; el = el.parentElement) {
      if (idsIn(el).size > 1) break;
      row = el;
    }
    return row ? row.innerText.replace(/\s+/g, ' ').trim().slice(0, 4000) : null;
  }, jobId);
}

export async function listLibraryImages(tab) {
  const images = await tab.playwright.evaluate(() => [...document.images].map(img => ({
    src: img.currentSrc, width: img.naturalWidth, height: img.naturalHeight,
    selected: /(^|\s)outline(\s|$)/.test(String(img.parentElement?.className || '')),
  })));
  const items = [];
  for (const image of images) {
    const parsed = parseLibrarySrc(image.src);
    if (!parsed || items.some(item => item.libraryId === parsed.libraryId) || !(image.width > 0)) continue;
    items.push({ libraryId: parsed.libraryId, width: image.width, height: image.height, ratio: Number((image.width / image.height).toFixed(4)), selected: image.selected });
  }
  return items;
}

// Page function: find the Imagine bar (the nearest ancestor of the prompt input that holds all
// role icons), then collect background-image styles inside each role column.
const SCAN_REFERENCES = roleIcons => {
  const ids = Object.values(roleIcons);
  const walk = (node, out = []) => { for (const child of node.children || []) { out.push(child); walk(child, out); } return out; };
  const holds = (node, id) => node.id === id || walk(node).some(child => child.id === id);
  let bar = null;
  for (let node = document.getElementById('desktop_input_bar')?.parentElement; node; node = node.parentElement) {
    if (ids.every(id => holds(node, id))) { bar = node; break; }
  }
  if (!bar) return null;
  const inBar = walk(bar);
  const result = {};
  for (const [role, id] of Object.entries(roleIcons)) {
    let column = null;
    for (let node = inBar.find(child => child.id === id); node && node !== bar; node = node.parentElement) {
      if (ids.some(other => other !== id && holds(node, other))) break;
      column = node;
    }
    result[role] = column ? [column, ...walk(column)].map(node => (node.getAttribute && node.getAttribute('style')) || '').filter(style => style.includes('url(')) : [];
  }
  return result;
};

// Attachments per role column, e.g. { edit: [libraryId], style: [], image: [] }; null when the
// role row is not shown (no attachments and the Add Images panel closed).
export async function readReferences(tab) {
  const styles = await tab.playwright.evaluate(SCAN_REFERENCES, { ...ROLE_ICONS });
  if (!styles) return null;
  return Object.fromEntries(Object.keys(ROLE_ICONS).map(role => [role, [...new Set((styles[role] ?? []).map(referenceKey).filter(Boolean))]]));
}

function imagineBar(tab) {
  const pw = tab.playwright;
  let bar = pw.locator('div').filter({ has: pw.locator(PROMPT_INPUT) });
  for (const id of Object.values(ROLE_ICONS)) bar = bar.filter({ has: pw.locator(`g#${id}`) });
  return bar.last();
}

function roleHeaderIcon(tab, role) {
  const pw = tab.playwright;
  let column = imagineBar(tab).locator('div').filter({ has: pw.locator(`g#${ROLE_ICONS[role]}`) });
  for (const [other, id] of Object.entries(ROLE_ICONS)) if (other !== role) column = column.filter({ hasNot: pw.locator(`g#${id}`) });
  return column.first().locator(`svg:has(g#${ROLE_ICONS[role]})`).first();
}

async function pollReferences(tab, done, deadline) {
  for (;;) {
    const references = await readReferences(tab);
    if (done(references)) return { ok: true, references };
    const left = deadline - Date.now();
    if (left <= 0) return { ok: false, references };
    await tab.playwright.waitForTimeout(Math.min(300, left));
  }
}

// Open the Add Images panel, which shows the role columns and the uploads library.
export async function openLibrary(tab, { timeoutMs = 8000 } = {}) {
  const shown = tab.playwright.locator('img[src*="cdn.midjourney.com/u/"]');
  if (await shown.count() === 0) {
    const add = tab.playwright.locator(iconSelector(ICONS.addImage));
    if (await add.count() === 0) return { status: 'add-images-not-found', next: 'Inspect fresh AX state.' };
    await add.first().click();
  }
  if (!await waitUntil(shown.first(), 'visible', Date.now() + timeoutMs)) {
    return { status: 'library-not-shown', next: 'If clicks leave no trace, open a fresh tab; otherwise inspect the page.' };
  }
  return { status: 'open', items: await listLibraryImages(tab) };
}

// Attach an existing upload to one role column (edit = Attach to prompt, style, image) without
// uploading again. Success means that role column now shows this library ID. The same upload
// may sit in several roles; the library thumbnail's outline does not say which.
export async function attachLibraryImage(tab, libraryId, role, { timeoutMs = 8000 } = {}) {
  assertLibraryId(libraryId);
  assertRole(role);
  const before = await readReferences(tab);
  if (!before) return { status: 'role-row-not-shown', libraryId, role, next: 'Open the uploads library first. Nothing was attached.' };
  if (before[role].includes(libraryId)) return { status: 'already-attached', libraryId, role, references: before };
  const item = tab.playwright.locator(`img[src*="/${libraryId}_"]`);
  const matches = await item.count();
  if (matches !== 1) {
    return { status: matches ? 'library-item-ambiguous' : 'library-item-not-found', libraryId, role, references: before, next: 'Open the uploads library and list its items. Nothing was attached.' };
  }
  const header = roleHeaderIcon(tab, role);
  if (await header.count() !== 1) return { status: 'role-column-not-found', libraryId, role, references: before, next: 'Nothing was attached.' };
  await header.click();
  await item.click();
  const outcome = await pollReferences(tab, now => Boolean(now?.[role]?.includes(libraryId)), Date.now() + timeoutMs);
  if (!outcome.ok) return { status: 'attach-unconfirmed', libraryId, role, references: outcome.references, next: 'Inspect the role columns and clear stray attachments before submitting.' };
  return { status: 'attached', libraryId, role, references: outcome.references };
}

// Remove every attachment with the Imagine bar's own clear button. The feed's delete button
// uses the same TrashIcon, so the button is looked up only inside the bar.
export async function clearReferences(tab, { timeoutMs = 5000 } = {}) {
  const before = await readReferences(tab);
  if (isEmptyReferences(before)) return { status: 'already-empty', references: before };
  const button = imagineBar(tab).locator('button:has(svg g#TrashIcon)');
  if (await button.count() !== 1) return { status: 'clear-button-not-found', references: before };
  await button.click();
  const outcome = await pollReferences(tab, isEmptyReferences, Date.now() + timeoutMs);
  return { status: outcome.ok ? 'cleared' : 'clear-unconfirmed', references: outcome.references };
}

// Fill the Imagine bar, read it back, press Enter once and identify the new job.
// References, roles and settings must already be prepared and inspected.
// Pass references (for example { edit: [libraryId] }, or {} for none) to refuse submission
// when the role columns differ, which also catches stale locked attachments.
export async function submitPrompt(tab, text, { timeoutMs = 20000, replaceDraft = false, references } = {}) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Prompt text is required');
  if (references !== undefined) sameReferences(references, {});
  const page = await currentURL(tab);
  if (!SITE_HOSTS.has(page.hostname) || !page.pathname.startsWith('/imagine')) {
    return { status: 'wrong-page', url: page.href, next: 'Open Create (/imagine) at the top of its feed.' };
  }
  const input = tab.playwright.locator(PROMPT_INPUT);
  if (await input.count() !== 1) return { status: 'input-not-found', next: 'The input selector changed; inspect fresh AX state.' };
  const draft = await input.evaluate(el => el.value);
  if (draft.trim() && draft !== text && !replaceDraft) {
    return { status: 'draft-present', draft, next: 'Preserve the existing draft before replacing it. Nothing was submitted.' };
  }
  if (!await waitUntil(tab.playwright.locator(JOB_LINKS).first(), 'attached', Date.now() + Math.min(timeoutMs, 5000))) {
    return { status: 'feed-not-ready', next: 'No existing job is visible, so a new job could not be identified. Nothing was submitted.' };
  }
  const before = await listJobIds(tab);
  if (!before.length) return { status: 'feed-not-ready', next: 'Nothing was submitted.' };
  if (draft !== text) await input.fill(text);
  const typed = await input.evaluate(el => el.value);
  if (typed !== text) return { status: 'readback-mismatch', typed, next: 'Nothing was submitted.' };
  if (references !== undefined) {
    const actual = await readReferences(tab);
    if (!sameReferences(references, actual)) {
      return { status: 'references-mismatch', expected: references, actual, next: 'Fix the role columns. Nothing was submitted.' };
    }
  }
  const deadline = Date.now() + timeoutMs;
  let known = before.slice();
  const unknown = { status: 'submission-unknown', next: 'Enter was sent at most once. Reconcile the Create feed before any retry.' };
  try {
    await input.press('Enter');
    while (await waitUntil(tab.playwright.locator(newJobLinkSelector(known)).first(), 'attached', deadline)) {
      const after = await listJobIds(tab);
      const fresh = newTopJobIds(before, after);
      if (fresh.length) {
        const rows = [];
        for (const id of fresh) rows.push(await readJobRowText(tab, id));
        return classifySubmission(text, fresh, rows);
      }
      known = [...new Set([...known, ...after])];
    }
  } catch (error) {
    return { ...unknown, error: String(error?.message ?? error).slice(0, 200) };
  }
  return unknown;
}

// Open the job page and wait for the shown candidate's original file, which exists only after completion.
export async function readCandidates(tab, jobId, { timeoutMs = 25000 } = {}) {
  assertJobId(jobId);
  const current = parseJobHref(await tab.url());
  if (!current || current.jobId !== jobId) await tab.goto(jobURL(jobId, 0));
  const shownIndex = parseJobHref(await tab.url())?.index ?? 0;
  const deadline = Date.now() + timeoutMs;
  if (!await waitUntil(tab.playwright.locator(`img[src*="/${jobId}/0_${shownIndex}."]`).first(), 'visible', deadline)) {
    return { status: 'pending', jobId, next: 'No finished original yet. Call again later with this job ID; do not resubmit.' };
  }
  // The original element can exist before it decodes; recheck its decode state until the deadline.
  let parsed = [];
  let original = null;
  for (;;) {
    const media = await tab.playwright.evaluate(id => [...document.images]
      .filter(img => img.currentSrc.includes(`/${id}/`))
      .map(img => ({ src: img.currentSrc, width: img.naturalWidth, height: img.naturalHeight, complete: img.complete })), jobId);
    parsed = media.map(item => ({ ...item, media: parseMediaSrc(item.src) })).filter(item => item.media?.jobId === jobId);
    original = parsed.find(item => item.media.original && item.media.index === shownIndex && item.complete && item.width > 0);
    const left = deadline - Date.now();
    if (original || left <= 0) break;
    await tab.playwright.waitForTimeout(Math.min(500, left));
  }
  if (!original) return { status: 'pending', jobId, next: 'The original is present but not decoded yet. Call again; do not resubmit.' };
  // Indexes come from the page's candidate strip; saveCandidate verifies each original separately.
  const indexes = [...new Set(parsed.map(item => item.media.index))].sort((a, b) => a - b);
  return { status: 'ready', jobId, count: indexes.length, indexes, url: jobURL(jobId, shownIndex), original: { index: shownIndex, width: original.width, height: original.height } };
}

// Open the exact job/index, confirm the displayed decoded original, export it via
// pageAssets and copy it without overwriting a different file.
export async function saveCandidate(tab, jobId, index, destDir, { timeoutMs = 20000 } = {}) {
  const target = jobURL(jobId, index);
  if (!path.isAbsolute(String(destDir))) throw new Error('destDir must be an absolute directory path');
  if (await tab.url() !== target) await tab.goto(target);
  if (!await waitUntil(tab.playwright.locator(`img[src*="/${jobId}/0_${index}."]`).first(), 'visible', Date.now() + timeoutMs)) {
    return { status: 'original-not-loaded', jobId, index, next: 'Inspect the job page; the original did not load.' };
  }
  const media = await tab.playwright.evaluate(id => [...document.images]
    .filter(img => img.currentSrc.includes(`/${id}/`))
    .map(img => {
      const r = img.getBoundingClientRect();
      const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
      const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      return { src: img.currentSrc, width: img.naturalWidth, height: img.naturalHeight, complete: img.complete, area: w * h };
    }), jobId);
  const pick = pickDisplayedOriginal(jobId, index, media);
  if (!pick.ok) return { status: 'display-mismatch', jobId, index, ...pick };
  const assets = await tab.capabilities.get('pageAssets');
  const inventory = await assets.list();
  const asset = inventory.assets.find(item => item.url === pick.src);
  if (!asset) return { status: 'asset-not-listed', jobId, index, src: pick.src };
  const bundle = await assets.bundle({ inventoryId: inventory.id, assetIds: [asset.id] });
  const saved = bundle.assets?.find(item => item.id === asset.id);
  if (!saved?.path || bundle.failures?.length) return { status: 'bundle-failed', jobId, index, failures: bundle.failures ?? [] };
  const bytes = fs.readFileSync(saved.path);
  const info = imageInfo(bytes);
  if (!info || info.width !== pick.width || info.height !== pick.height) {
    return { status: 'decode-mismatch', jobId, index, file: info, displayed: { width: pick.width, height: pick.height } };
  }
  const dest = path.join(destDir, `${jobId}_${index}.${info.format === 'jpeg' ? 'jpg' : info.format}`);
  const outcome = copyNoOverwrite(saved.path, dest);
  return { status: 'saved', outcome, path: dest, format: info.format, width: info.width, height: info.height, bytes: bytes.length, sha256: sha256(bytes), jobId, index, url: target };
}
