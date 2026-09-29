import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import {
  ORIGIN, PROMPT_INPUT, jobURL, parseJobHref, newTopJobIds, newJobLinkSelector, iconSelector, parseMediaSrc,
  promptMatches, classifySubmission, imageInfo, pickDisplayedOriginal, copyNoOverwrite, submitPrompt, waitUntil,
  readJobRowText, readCandidates, saveCandidate, parseLibrarySrc, sameAspectItems, listLibraryImages, attachLibraryImage,
  ROLE_ICONS, referenceKey, sameReferences, readReferences, clearReferences, openLibrary, checkInput, attachJobImage,
  jobReferenceKey, WAIT_SLICE_MS, openCreate,
} from '../skills/midjourney-web/scripts/codex-browser.mjs';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const OLD = '33333333-3333-4333-8333-333333333333';
const NEW = '44444444-4444-4444-8444-444444444444';
const PROMPT = 'A red ceramic cube on a walnut table, soft window light --ar 16:9 --raw';
const LIB = 'ab'.repeat(32);
const LIB2 = 'cd'.repeat(32);
const LIB3 = 'ef'.repeat(32);
const libSrc = id => 'https://cdn.midjourney.com/u/' + A + '/' + id + '_384_N.jpg';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ---- image builders with valid container structure ----
function jpeg(width, height, sof = 0xc0) {
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, ...Array(14).fill(0),
    0xff, sof, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 3, ...Array(9).fill(0),
    0xff, 0xda, 0x00, 0x0c, ...Array(10).fill(0), 0x12, 0x34, 0xff, 0xd9]);
}
function pngChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(zlib.crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function png(width, height) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  return Uint8Array.from(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pngChunk('IHDR', ihdr), pngChunk('IDAT', [1, 2, 3]), pngChunk('IEND', [])]));
}
function webp(chunk, body) {
  const out = Buffer.alloc(20 + body.length);
  out.write('RIFF', 0, 'ascii');
  out.writeUInt32LE(out.length - 8, 4);
  out.write('WEBP', 8, 'ascii');
  out.write(chunk, 12, 'ascii');
  out.writeUInt32LE(body.length, 16);
  Buffer.from(body).copy(out, 20);
  return Uint8Array.from(out);
}

// ---- executable fake DOM: page callbacks run unchanged against it ----
function el({ text = '', href = null, children = [] } = {}) {
  const node = { innerText: text, href, children, parentElement: null, getAttribute: name => (name === 'href' ? href : null) };
  node.querySelectorAll = selector => descendants(node).filter(child => matches(child, selector));
  for (const child of children) child.parentElement = node;
  return node;
}
function descendants(node) { return node.children.flatMap(child => [child, ...descendants(child)]); }
function matches(node, selector) {
  const m = selector.match(/^a\[href\*="([^"]+)"\]$/);
  return Boolean(m && node.href && node.href.includes(m[1]));
}
function feedDom(ids, rows = {}) {
  const rowNodes = ids.map(id => el({ text: (rows[id] ?? '') + ' Rerun', children: [0, 1, 2, 3].map(i => el({ href: '/jobs/' + id + '?index=' + i })) }));
  const body = el({ children: [el({ text: rowNodes.map(row => row.innerText).join(' '), children: rowNodes })] });
  return { body, images: [], querySelector: selector => body.querySelectorAll(selector)[0] ?? null, getElementById: () => null };
}
function img(src, { width = 960, height = 1200, complete = true, rect = [0, 0, 400, 500] } = {}) {
  return { currentSrc: src, naturalWidth: complete ? width : 0, naturalHeight: complete ? height : 0, complete,
    getBoundingClientRect: () => ({ left: rect[0], top: rect[1], right: rect[0] + rect[2], bottom: rect[1] + rect[3] }) };
}
function inDom(dom, fn) {
  const saved = [globalThis.document, globalThis.innerWidth, globalThis.innerHeight];
  Object.assign(globalThis, { document: dom, innerWidth: 1280, innerHeight: 720 });
  try { return fn(); } finally { [globalThis.document, globalThis.innerWidth, globalThis.innerHeight] = saved; }
}
const cdn = (id, index, preview) => 'https://cdn.midjourney.com/' + id + '/0_' + index + (preview ? '_384_N.webp' : '.jpeg');

// Fake CDP: the page receives a pointer move shifted by offset, or none at all. A released
// button runs state.onClick, which each fake tab points at the element it last aimed at.
function fakeCdp({ offset = [0, 0], deliver = true } = {}) {
  const state = { moves: 0, presses: 0, armed: false, seen: null, onClick: null };
  return {
    state,
    send: async (method, params = {}) => {
      if (method === 'Input.dispatchMouseEvent' && params.type === 'mouseMoved') {
        state.moves += 1;
        if (state.armed && deliver) state.seen = [params.x + offset[0], params.y + offset[1]];
        return {};
      }
      if (method === 'Input.dispatchMouseEvent') {
        if (params.type === 'mouseReleased') { state.presses += 1; await state.onClick?.(); }
        return {};
      }
      if (method === 'Runtime.evaluate' && !params.awaitPromise) { state.armed = true; state.seen = null; return {}; }
      if (method === 'Runtime.evaluate') { state.armed = false; return { result: { value: state.seen } }; }
      throw new Error('unexpected CDP method ' + method);
    },
  };
}
const box = (size = 20) => ({ getBoundingClientRect: () => ({ left: 100, top: 200, width: size, height: size }) });
// Runs pressChecked's hit-test page callback. Under the target's centre lies an element that is
// 'inside' the target, 'outside' it (an overlay), or a control or thumbnail 'nested' inside it.
function hitTest(fn, arg, under = 'inside') {
  const target = { contains: n => n === target || n?.parent === target };
  const nested = { parent: target };
  const at = under === 'outside' ? { parent: null, closest: () => null } : { parent: target, closest: () => (under === 'nested' ? nested : null) };
  return inDom({ elementFromPoint: () => at }, () => fn(target, arg));
}

test('job links and URLs accept only exact Midjourney job IDs', () => {
  assert.deepEqual(parseJobHref('/jobs/' + A + '?index=2'), { jobId: A, index: 2 });
  assert.deepEqual(parseJobHref('https://midjourney.com/jobs/' + A), { jobId: A, index: null });
  for (const href of ['https://example.com/jobs/' + A, '/jobs/' + A + '/extra', '/jobs/not-a-job', 'http://www.midjourney.com/jobs/' + A]) {
    assert.equal(parseJobHref(href), null);
  }
  assert.equal(jobURL(A, 3), ORIGIN + '/jobs/' + A + '?index=3');
  for (const [id, index] of [['x', 0], [A, -1], [A, 1.5], [A, 16]]) assert.throws(() => jobURL(id, index));
  assert.throws(() => newJobLinkSelector([A + '"]']));
});

test('a new job must appear above the row that was on top before submission', () => {
  assert.deepEqual(newTopJobIds([A, B], [A, B, OLD]), []);
  assert.deepEqual(newTopJobIds([A, B], [NEW, A, B, OLD]), [NEW]);
  assert.deepEqual(newTopJobIds([A, B], [OLD, B]), []);
  assert.deepEqual(newTopJobIds([A, B], [OLD]), []);
  assert.deepEqual(newTopJobIds([], [NEW]), []);
});

test('icon selectors refuse data-changing icons unless explicitly allowed', () => {
  assert.equal(iconSelector('Settings'), 'button:has(svg g#Settings)');
  for (const id of ['TrashIcon', 'Heart', 'Reload']) assert.throws(() => iconSelector(id), /explicitly requested/);
  assert.equal(iconSelector('Heart', { allowMutation: true }), 'button:has(svg g#Heart)');
  for (const id of ['a b', 'g#x', '', 'x)']) assert.throws(() => iconSelector(id));
});

test('media names distinguish originals from previews and require https on the CDN', () => {
  assert.deepEqual(parseMediaSrc(cdn(A, 2)), { jobId: A, index: 2, original: true, ext: 'jpeg' });
  assert.deepEqual(parseMediaSrc('https://cdn.midjourney.com/' + A + '/0_1_640_N.webp?method=shortest'), { jobId: A, index: 1, original: false, ext: 'webp' });
  for (const src of ['https://cdn.example.com/' + A + '/0_1.jpeg', 'https://cdn.midjourney.com/' + A + '/grid_0.png', 'not a url', 'http://cdn.midjourney.com/' + A + '/0_1.jpeg']) {
    assert.equal(parseMediaSrc(src), null);
  }
});

test('prompt identity uses the whole prompt body and refuses weak evidence', () => {
  assert.equal(promptMatches(PROMPT, 'Row  A red ceramic cube on a WALNUT table, soft window light --ar 16:9'), true);
  assert.equal(promptMatches(PROMPT, 'A blue glass sphere on a marble floor'), false);
  const long = 'x'.repeat(70) + ' ending one';
  assert.equal(promptMatches(long, 'x'.repeat(70) + ' ending two'), false);
  assert.equal(promptMatches('red cat', 'A blue airplane'), null);
  assert.equal(classifySubmission('red cat', [NEW], ['A blue airplane']).status, 'ambiguous');
  const two = classifySubmission(PROMPT, [NEW, OLD], ['A red ceramic cube on a walnut table, soft window light', 'other text entirely']);
  assert.deepEqual([two.status, two.jobId], ['submitted', NEW]);
  assert.equal(classifySubmission(PROMPT, [NEW, OLD], [PROMPT, PROMPT]).status, 'ambiguous');
});

test('image checks accept valid containers and reject truncated or malformed ones', () => {
  assert.deepEqual(imageInfo(png(1456, 816)), { format: 'png', width: 1456, height: 816 });
  assert.deepEqual(imageInfo(jpeg(960, 1200)), { format: 'jpeg', width: 960, height: 1200 });
  assert.deepEqual(imageInfo(jpeg(2048, 2048, 0xc2)), { format: 'jpeg', width: 2048, height: 2048 });
  assert.deepEqual(imageInfo(webp('VP8X', [0, 0, 0, 0, 0x7f, 0x02, 0, 0x1f, 0x03, 0])), { format: 'webp', width: 640, height: 800 });
  const bits = (640 - 1) | ((800 - 1) << 14);
  assert.deepEqual(imageInfo(webp('VP8L', [0x2f, bits & 255, (bits >> 8) & 255, (bits >> 16) & 255, (bits >>> 24) & 255, 0])), { format: 'webp', width: 640, height: 800 });
  assert.deepEqual(imageInfo(webp('VP8 ', [0, 0, 0, 0x9d, 0x01, 0x2a, 0x80, 0x02, 0x20, 0x03])), { format: 'webp', width: 640, height: 800 });
  const validPng = png(1456, 816);
  assert.equal(imageInfo(validPng.subarray(0, 24)), null);
  const badCrc = validPng.slice();
  badCrc[20] ^= 1;
  assert.equal(imageInfo(badCrc), null);
  const validJpeg = jpeg(960, 1200);
  assert.equal(imageInfo(validJpeg.subarray(0, validJpeg.length - 2)), null);
  const shortSof = validJpeg.slice();
  shortSof[21] = 0x02;
  assert.equal(imageInfo(shortSof), null);
  const badRiff = webp('VP8X', [0, 0, 0, 0, 0x7f, 0x02, 0, 0x1f, 0x03, 0]);
  badRiff[4] += 4;
  assert.equal(imageInfo(badRiff), null);
  assert.equal(imageInfo(webp('VP8 ', [0, 0, 0, 0, 0, 0, 0x80, 0x02, 0x20, 0x03])), null);
  assert.equal(imageInfo(Uint8Array.from([1, 2, 3, 4])), null);
});

test('only the dominant decoded original of the requested index is exportable', () => {
  const src = (index, preview) => 'https://cdn.midjourney.com/' + A + '/0_' + index + (preview ? '_640_N.webp' : '.jpeg');
  const main = [{ src: src(2, true), width: 640, height: 800, complete: true, area: 1000 },
    { src: src(2), width: 960, height: 1200, complete: true, area: 1000 },
    { src: src(0, true), width: 384, height: 480, complete: true, area: 30 }];
  assert.deepEqual(pickDisplayedOriginal(A, 2, main), { ok: true, src: src(2), width: 960, height: 1200 });
  assert.equal(pickDisplayedOriginal(A, 0, main).reason, 'another-candidate-displayed');
  assert.equal(pickDisplayedOriginal(A, 2, [{ ...main[1], complete: false, width: 0 }]).reason, 'original-not-decoded');
  assert.equal(pickDisplayedOriginal(A, 2, [{ ...main[1], complete: true, width: 0 }]).reason, 'original-not-decoded');
  assert.equal(pickDisplayedOriginal(B, 2, main).reason, 'no-job-media-in-view');
});

test('copies never overwrite a different file', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mj-copy-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const a = path.join(dir, 'a.jpg'), b = path.join(dir, 'b.jpg'), dest = path.join(dir, 'out', 'x.jpg');
  fs.writeFileSync(a, 'first');
  fs.writeFileSync(b, 'second');
  assert.equal(copyNoOverwrite(a, dest), 'copied');
  assert.equal(copyNoOverwrite(a, dest), 'identical-existing');
  assert.throws(() => copyNoOverwrite(b, dest), /Refusing to overwrite/);
  assert.equal(fs.readFileSync(dest, 'utf8'), 'first');
});

test('row text belongs to one job and excludes its neighbour', async () => {
  const dom = feedDom([A, B], { [A]: 'first prompt text', [B]: 'second prompt text' });
  const tab = { playwright: { evaluate: async (fn, arg) => inDom(dom, () => fn(arg)) } };
  const row = await readJobRowText(tab, A);
  assert.match(row, /first prompt text/);
  assert.doesNotMatch(row, /second prompt text/);
});

// Submission tab: each wait after Enter advances to the next feed state.
// Waits after Enter first time out slowTicks times (as the host does after ~3 s), then advance.
function submitTab({ url = ORIGIN + '/imagine', draft = '', echo = value => value, feeds = [[A, B]], rows = {}, linksWithoutJobs = false, slowTicks = 0, fillDelay = 0 } = {}) {
  const state = { value: draft, fills: 0, presses: 0, feed: 0, slow: slowTicks };
  const dom = () => feedDom(feeds[state.feed], rows);
  const input = {
    count: async () => 1,
    evaluate: async fn => fn({ value: state.value }),
    fill: async value => { await sleep(fillDelay); state.fills += 1; state.value = echo(value); },
    press: async key => { assert.equal(key, 'Enter'); state.presses += 1; },
  };
  const links = selector => ({
    evaluateAll: async fn => { const d = dom(); return inDom(d, () => fn(d.body.querySelectorAll('a[href*="/jobs/"]'))); },
    first: () => ({
      waitFor: async () => {
        if (state.presses === 0) { if (!feeds[0].length && !linksWithoutJobs) throw new Error('timeout'); return; }
        if (state.slow > 0) { state.slow -= 1; throw new Error('Playwright selector deadline exceeded'); }
        state.feed = Math.min(state.feed + 1, feeds.length - 1);
        const excluded = [...selector.matchAll(/href\*="([0-9a-f-]{36})"/g)].map(match => match[1]);
        if (!feeds[state.feed].some(id => !excluded.includes(id))) throw new Error('timeout');
      },
    }),
  });
  const tab = {
    url: async () => url,
    playwright: { locator: selector => (selector === PROMPT_INPUT ? input : links(selector)), evaluate: async (fn, arg) => { const d = dom(); return inDom(d, () => fn(arg)); } },
  };
  return { tab, state };
}

test('submission preserves drafts, refuses bad read-back or an unloaded feed without pressing Enter', async () => {
  const drafted = submitTab({ draft: 'someone else draft' });
  assert.equal((await submitPrompt(drafted.tab, PROMPT)).status, 'draft-present');
  assert.deepEqual([drafted.state.fills, drafted.state.presses], [0, 0]);
  const truncated = submitTab({ echo: value => value.slice(0, -1) });
  assert.equal((await submitPrompt(truncated.tab, PROMPT)).status, 'readback-mismatch');
  assert.equal(truncated.state.presses, 0);
  const empty = submitTab({ feeds: [[]] });
  assert.equal((await submitPrompt(empty.tab, PROMPT, { timeoutMs: 50 })).status, 'feed-not-ready');
  assert.equal(empty.state.presses, 0);
  const unparsed = submitTab({ feeds: [[]], linksWithoutJobs: true });
  assert.equal((await submitPrompt(unparsed.tab, PROMPT)).status, 'feed-not-ready');
  assert.equal(unparsed.state.presses, 0);
  const elsewhere = submitTab({ url: ORIGIN + '/jobs/' + A + '?index=0' });
  assert.equal((await submitPrompt(elsewhere.tab, PROMPT)).status, 'wrong-page');
  const guarded = submitTab();
  assert.equal((await submitPrompt(guarded.tab, PROMPT, { references: { style: [LIB] } })).status, 'references-mismatch');
  assert.equal(guarded.state.presses, 0);
  await assert.rejects(submitPrompt(submitTab().tab, PROMPT, { references: { styles: [] } }));
  for (const timeoutMs of [NaN, Infinity, -1, '20000']) await assert.rejects(submitPrompt(submitTab().tab, PROMPT, { timeoutMs }), /finite/);
  const slowFill = submitTab({ fillDelay: 350 });
  assert.deepEqual([(await submitPrompt(slowFill.tab, PROMPT, { timeoutMs: 400 })).status, slowFill.state.presses], ['deadline-passed', 0]);
  const broken = submitTab();
  broken.tab.playwright.locator(PROMPT_INPUT).evaluate = async () => { throw new Error('Execution context was destroyed'); };
  const failed = await submitPrompt(broken.tab, PROMPT);
  assert.deepEqual([failed.status, broken.state.presses], ['error', 0]);
  assert.match(failed.error, /context was destroyed/);
});

test('submission skips remounted older rows, presses Enter once and never retries', async () => {
  const rows = { [NEW]: 'Submitting... ' + PROMPT, [OLD]: 'An older prompt about something else entirely', [A]: 'top', [B]: 'second' };
  const ok = submitTab({ feeds: [[A, B], [A, B, OLD], [NEW, A, B, OLD]], rows });
  const result = await submitPrompt(ok.tab, PROMPT, { references: {} });
  assert.deepEqual([result.status, result.jobId, ok.state.presses], ['submitted', NEW, 1]);
  const slow = submitTab({ feeds: [[A, B], [NEW, A, B]], rows, slowTicks: 3 });
  const late = await submitPrompt(slow.tab, PROMPT);
  assert.deepEqual([late.status, late.jobId, slow.state.presses], ['submitted', NEW, 1]);
  const displaced = submitTab({ feeds: [[A, B], [OLD, B]], rows: { ...rows, [OLD]: PROMPT } });
  assert.equal((await submitPrompt(displaced.tab, PROMPT, { timeoutMs: 200 })).status, 'submission-unknown');
  assert.equal(displaced.state.presses, 1);
  const lost = submitTab({ feeds: [[A, B], [A, B, OLD]], rows });
  assert.equal((await submitPrompt(lost.tab, PROMPT, { timeoutMs: 200 })).status, 'submission-unknown');
  assert.equal(lost.state.presses, 1);
  const flaky = submitTab({ rows });
  flaky.tab.playwright.locator(PROMPT_INPUT).press = async () => { flaky.state.presses += 1; throw new Error('target closed'); };
  const pressed = await submitPrompt(flaky.tab, PROMPT, { timeoutMs: 200 });
  assert.deepEqual([pressed.status, flaky.state.presses], ['submission-unknown', 1]);
});

test('waits continue across short host wait slices, pace instant failures and rethrow other errors', async () => {
  let calls = 0;
  const slowLocator = { waitFor: async () => { calls += 1; if (calls < 4) throw new Error('Playwright selector deadline exceeded'); } };
  assert.equal(await waitUntil(slowLocator, 'attached', Date.now() + 5000), true);
  assert.equal(calls, 4);
  const never = { waitFor: async () => { throw new Error('timed out'); } };
  assert.equal(await waitUntil(never, 'attached', Date.now() + 30), false);
  const broken = { waitFor: async () => { throw new Error('Invalid selector'); } };
  await assert.rejects(waitUntil(broken, 'attached', Date.now() + 1000), /Invalid selector/);
  let instant = 0;
  const detached = { waitFor: async () => { instant += 1; throw new Error('timeout'); } };
  assert.equal(await waitUntil(detached, 'attached', Date.now() + 500), false);
  assert.ok(instant <= 5, 'instant failures must be paced, got ' + instant);
  const slices = [];
  const recorded = { waitFor: async ({ timeoutMs }) => { slices.push(timeoutMs); if (slices.length < 2) throw new Error('timeout'); } };
  assert.equal(await waitUntil(recorded, 'visible', Date.now() + 60000), true);
  assert.ok(WAIT_SLICE_MS <= 3000);
  assert.ok(slices.every(ms => ms <= WAIT_SLICE_MS) && slices[0] === WAIT_SLICE_MS);
  const ready = { waitFor: async () => {} };
  for (const deadline of [Infinity, NaN, undefined, '5000']) await assert.rejects(waitUntil(ready, 'attached', deadline), /finite deadline/);
});

// Job-page tab with executable DOM images and a controllable pageAssets capability.
function jobTab({ images, index = 0, bundle, decodeAfter = 0, url, gotoHangs = false }) {
  let current = url ?? jobURL(A, index);
  let evaluations = 0;
  const dom = () => ({ images: evaluations > decodeAfter ? images.map(image => ({ ...image, complete: true, naturalWidth: image.naturalWidth || 960, naturalHeight: image.naturalHeight || 1200 })) : images, body: el(), getElementById: () => null, querySelector: () => null });
  const assets = {
    list: async () => ({ id: 'inventory', assets: images.map((image, i) => ({ id: 'asset' + i, url: image.currentSrc })) }),
    bundle: async ({ assetIds }) => bundle(assetIds[0]),
  };
  return {
    url: async () => current,
    goto: async next => { if (gotoHangs) return new Promise(() => {}); current = next; },
    capabilities: { get: async name => (name === 'pageAssets' ? assets : null) },
    playwright: {
      locator: selector => ({
        first: () => ({
          waitFor: async () => {
            const needle = selector.match(/src\*="([^"]+)"/)[1];
            if (!images.some(image => image.currentSrc.includes(needle))) throw new Error('timeout');
          },
        }),
      }),
      evaluate: async (fn, arg) => { evaluations += 1; return inDom(dom(), () => fn(arg)); },
      waitForTimeout: ms => sleep(Math.min(ms, 20)),
    },
  };
}
const strip = [0, 1, 2, 3].map(i => img(cdn(A, i, true), { width: 384, height: 480, rect: [1200, 200 + i * 60, 56, 56] }));

test('candidates are ready only when the shown original is decoded', async () => {
  const loading = jobTab({ images: [img(cdn(A, 0), { complete: false }), ...strip], decodeAfter: Infinity });
  assert.equal((await readCandidates(loading, A, { timeoutMs: 30 })).status, 'pending');
  const decoding = jobTab({ images: [img(cdn(A, 0), { complete: false }), ...strip], decodeAfter: 2 });
  assert.equal((await readCandidates(decoding, A)).status, 'ready');
  const done = jobTab({ images: [img(cdn(A, 0)), ...strip] });
  const ready = await readCandidates(done, A);
  assert.deepEqual([ready.status, ready.count, ready.original.width], ['ready', 4, 960]);
});

test('navigation counts against the deadline and browser failures become statuses', { timeout: 5000 }, async () => {
  const started = Date.now();
  const hung = jobTab({ images: [img(cdn(A, 0)), ...strip], url: ORIGIN + '/imagine', gotoHangs: true });
  assert.equal((await readCandidates(hung, A, { timeoutMs: 80 })).status, 'pending');
  assert.equal((await saveCandidate(hung, A, 0, os.tmpdir(), { timeoutMs: 80 })).status, 'navigation-pending');
  const idle = jobTab({ images: [img(cdn(A, 0)), ...strip], url: ORIGIN + '/imagine', gotoHangs: true });
  assert.equal((await saveCandidate(idle, A, 0, os.tmpdir(), { timeoutMs: 80 })).status, 'original-not-loaded');
  assert.ok(Date.now() - started < 2000);
  const closed = jobTab({ images: strip });
  closed.url = async () => { throw new Error('Target page, context or browser has been closed'); };
  const failed = await readCandidates(closed, A);
  assert.deepEqual([failed.status, /closed/.test(failed.error)], ['error', true]);
});

test('saving exports only a verified original of the requested candidate', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mj-save-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  let n = 0;
  const file = bytes => { const p = path.join(dir, 'asset-' + (n += 1) + '.jpeg'); fs.writeFileSync(p, bytes); return p; };
  const ok = bytes => async id => ({ assets: [{ id, path: file(bytes) }], failures: [] });
  const out = path.join(dir, 'out');
  const shown = index => [img(cdn(A, index)), ...strip];

  const wrong = jobTab({ index: 1, images: [img(cdn(A, 1), { rect: [1200, 0, 56, 56] }), img(cdn(A, 2)), ...strip], bundle: ok(jpeg(960, 1200)) });
  assert.equal((await saveCandidate(wrong, A, 1, out, { timeoutMs: 300 })).status, 'display-mismatch');
  const failed = jobTab({ index: 2, images: shown(2), bundle: async () => ({ assets: [], failures: [{ reason: 'blocked' }] }) });
  assert.equal((await saveCandidate(failed, A, 2, out)).status, 'bundle-failed');
  const partial = jobTab({ index: 2, images: shown(2), bundle: async id => ({ assets: [{ id, path: file(jpeg(960, 1200)) }], failures: [{ reason: 'partial' }] }) });
  assert.equal((await saveCandidate(partial, A, 2, out)).status, 'bundle-failed');
  const truncated = jobTab({ index: 2, images: shown(2), bundle: ok(jpeg(960, 1200).subarray(0, 30)) });
  assert.equal((await saveCandidate(truncated, A, 2, out)).status, 'decode-mismatch');
  const resized = jobTab({ index: 2, images: shown(2), bundle: ok(jpeg(480, 600)) });
  assert.equal((await saveCandidate(resized, A, 2, out)).status, 'decode-mismatch');
  assert.equal(fs.existsSync(out), false);

  const good = jpeg(960, 1200);
  const decoding = jobTab({ index: 2, images: [img(cdn(A, 2), { complete: false }), ...strip], decodeAfter: 2, bundle: ok(good) });
  const saved = await saveCandidate(decoding, A, 2, out);
  assert.deepEqual([saved.status, saved.outcome, saved.width, saved.height], ['saved', 'copied', 960, 1200]);
  assert.deepEqual(new Uint8Array(fs.readFileSync(saved.path)), good);
  const again = await saveCandidate(jobTab({ index: 2, images: shown(2), bundle: ok(good) }), A, 2, out);
  assert.equal(again.outcome, 'identical-existing');
  const conflict = await saveCandidate(jobTab({ index: 2, images: shown(2), bundle: ok(jpeg(960, 1200, 0xc2)) }), A, 2, out);
  assert.equal(conflict.status, 'destination-conflict');
  assert.deepEqual(new Uint8Array(fs.readFileSync(saved.path)), good);
  await assert.rejects(saveCandidate(jobTab({ index: 2, images: shown(2), bundle: ok(good) }), A, 2, 'relative/dir'));
});

test('library thumbnails yield opaque IDs and same-aspect candidates', () => {
  assert.deepEqual(parseLibrarySrc(libSrc(LIB)), { libraryId: LIB });
  for (const src of [cdn(A, 0), 'https://cdn.midjourney.com/u/' + A + '/' + LIB + '.jpg', 'https://example.com/u/' + A + '/' + LIB + '_384_N.jpg', libSrc(LIB).replace('https:', 'http:')]) {
    assert.equal(parseLibrarySrc(src), null);
  }
  const items = [{ libraryId: LIB, ratio: 0.8 }, { libraryId: LIB2, ratio: 1.5 }];
  assert.deepEqual(sameAspectItems(items, 1122, 1402).map(item => item.libraryId), [LIB]);
  const edge = [{ libraryId: LIB, ratio: 1.09 }, { libraryId: LIB2, ratio: 1.11 }, { libraryId: LIB3, ratio: 0.91 }];
  assert.deepEqual(sameAspectItems(edge, 100, 100, 0.1).map(item => item.libraryId), [LIB, LIB3]);
  assert.throws(() => sameAspectItems(items, 0, 10));
});

// Imagine bar with role columns; attachments are background images, as on the site. A feed row
// outside the bar carries the same SubjectReferenceIcon and its own reference. The uploads
// library is the parent of the page's file input; document.images holds images elsewhere.
function node(tagName, { id = '', style = '', children = [] } = {}) {
  const n = { tagName, id, children, parentElement: null, getAttribute: name => (name === 'style' ? style || null : null) };
  for (const child of children) child.parentElement = n;
  return n;
}
const thumbSrc = key => (key.startsWith('job:')
  ? 'https://cdn.midjourney.com/' + key.slice(4).replace('/', '/0_') + '_128_N.webp'
  : libSrc(key).replace('_384_', '_128_'));
function barDom({ columns, rowShown, library = null, fileInputs = 1, media = [] }) {
  const bg = key => node('DIV', { style: 'background-image: url("' + thumbSrc(key) + '"); background-size: cover;' });
  const column = role => node('DIV', { children: [node('svg', { children: [node('g', { id: ROLE_ICONS[role] })] }), ...columns[role].map(bg)] });
  const feed = node('DIV', { children: [node('DIV', { children: [node('g', { id: ROLE_ICONS.edit }), bg(LIB2)] })] });
  const bar = node('DIV', { children: [node('TEXTAREA', { id: 'desktop_input_bar' }), ...(rowShown ? [node('DIV', { children: Object.keys(ROLE_ICONS).map(column) })] : [])] });
  const body = node('BODY', { children: [feed, bar] });
  const all = n => n.children.flatMap(child => [child, ...all(child)]);
  const panel = library && { querySelectorAll: selector => (selector === 'img' ? library : []) };
  const inputs = library ? Array.from({ length: fileInputs }, () => ({ parentElement: panel })) : [];
  return { body, images: media, getElementById: id => all(body).find(n => n.id === id) ?? null, querySelectorAll: selector => (selector === 'input[type="file"]' ? inputs : []) };
}
// Clicking a role header selects that column (unless selectOnClick is false); clicking a library
// item attaches it to the selected column (unless attachOnClick is false). Add Images opens the
// panel (unless openOnClick is false). failOn makes clicks or page reads throw; under sets what
// every hit test finds. Clicks arrive through the fake CDP at the element whose centre was aimed at.
function roleTab({ columns = {}, rowShown = true, library = [LIB, LIB2], outlined = [], undecoded = [], elsewhere = [], panelOpen = true, fileInputs = 1,
  openOnClick = true, selectOnClick = true, attachOnClick = true, clearOnClick = true, cdp = fakeCdp(), failOn = null, under = 'inside' } = {}) {
  const state = { columns: { edit: [], style: [], image: [], ...structuredClone(columns) }, active: 'edit', clicks: [], rowShown, panelOpen, aimed: null };
  const fail = what => { if (failOn === what) throw new Error('Target page, context or browser has been closed'); };
  const images = () => library.map(id => ({ currentSrc: libSrc(id), naturalWidth: undecoded.includes(id) ? 0 : 384, naturalHeight: undecoded.includes(id) ? 0 : 480, parentElement: { className: outlined.includes(id) ? 'h-0 outline p-3' : 'h-0 false' } }));
  const media = elsewhere.map(id => ({ currentSrc: libSrc(id), naturalWidth: 384, naturalHeight: 480, parentElement: { className: '' } }));
  const click = selector => {
    fail('click');
    state.clicks.push(selector);
    if (selector.includes('AddImageUncentered')) { if (openOnClick) Object.assign(state, { panelOpen: true, rowShown: true }); return; }
    const item = selector.match(/img\[src\*="\/([0-9a-f]{64})_"\]/);
    const role = Object.keys(ROLE_ICONS).find(r => selector === 'svg:has(g#' + ROLE_ICONS[r] + ')');
    if (role) { if (selectOnClick) state.active = role; } else if (item) {
      if (attachOnClick && !state.columns[state.active].includes(item[1])) state.columns[state.active].push(item[1]);
    } else if (/TrashIcon/.test(selector) && clearOnClick) for (const r of Object.keys(state.columns)) state.columns[r] = [];
  };
  if (cdp) cdp.state.onClick = () => click(state.aimed);
  const locator = selector => ({
    filter: () => locator(selector),
    first: () => locator(selector),
    last: () => locator(selector),
    locator: child => locator(child),
    evaluate: async (fn, arg) => {
      if (arg !== undefined) { fail('hit'); return hitTest(fn, arg, under); }
      state.aimed = selector;
      return fn(box());
    },
    waitFor: async () => { if (selector === 'input[type="file"]' && !state.panelOpen) throw new Error('timeout'); },
    count: async () => {
      if (selector === 'input[type="file"]') return state.panelOpen ? fileInputs : 0;
      if (selector.includes('AddImageUncentered')) return 1;
      if (selector.includes('cdn.midjourney.com/u/')) return elsewhere.length + (state.panelOpen ? library.length : 0);
      const item = selector.match(/img\[src\*="\/([0-9a-f]{64})_"\]/);
      if (item) return state.panelOpen ? library.filter(id => id === item[1]).length : 0;
      return /^svg:has\(g#|TrashIcon/.test(selector) && state.rowShown ? 1 : 0;
    },
  });
  return {
    state,
    capabilities: { get: async name => (name === 'cdp' ? cdp : null) },
    playwright: {
      locator,
      evaluate: async (fn, arg) => { fail('evaluate'); return inDom(barDom({ columns: state.columns, rowShown: state.rowShown, library: state.panelOpen ? images() : null, fileInputs, media }), () => fn(arg)); },
      waitForTimeout: ms => sleep(Math.min(ms, 20)),
    },
  };
}

test('role columns are read inside the Imagine bar only', async () => {
  assert.equal(referenceKey('background-image: url("' + libSrc(LIB).replace('_384_', '_128_') + '")'), LIB);
  assert.equal(referenceKey("background-image: url('https://s.mj.run/abc?thumb=true')"), 'https://s.mj.run/abc');
  assert.equal(referenceKey('background-image: url("https://cdn.midjourney.com/' + A + '/0_2_128_N.webp")'), 'job:' + A + '/2');
  assert.equal(jobReferenceKey(A, 2), 'job:' + A + '/2');
  assert.equal(referenceKey('background-image: url("http://cdn.midjourney.com/' + A + '/0_2_128_N.webp")'), 'http://cdn.midjourney.com/' + A + '/0_2_128_N.webp');
  assert.equal(referenceKey('background-image: url("https://cdn.midjourney.com/' + A + '/0_16_128_N.webp")'), 'https://cdn.midjourney.com/' + A + '/0_16_128_N.webp');
  assert.equal(referenceKey('color: red'), null);
  assert.deepEqual(await readReferences(roleTab({ columns: { style: [LIB] } })), { edit: [], style: [LIB], image: [] });
  assert.equal(await readReferences(roleTab({ rowShown: false })), null);
  assert.equal(sameReferences({ style: [LIB] }, { edit: [], style: [LIB], image: [] }), true);
  assert.equal(sameReferences({}, { edit: [], style: [LIB], image: [] }), false);
  assert.equal(sameReferences({}, null), true);
  assert.throws(() => sameReferences({ styles: [LIB] }, null));
});

test('clicks happen only after the pointer is confirmed to land on target', async () => {
  const aligned = roleTab();
  assert.equal((await checkInput(aligned, aligned.playwright.locator('x'))).status, 'aligned');
  const shifted = await checkInput(roleTab({ cdp: fakeCdp({ offset: [0, -43] }) }), roleTab().playwright.locator('x'));
  assert.deepEqual([shifted.status, shifted.dx, shifted.dy], ['input-misaligned', 0, -43]);
  assert.equal((await checkInput(roleTab({ cdp: fakeCdp({ deliver: false }) }), roleTab().playwright.locator('x'))).status, 'input-unchecked');
  assert.equal((await checkInput(roleTab({ cdp: null }), roleTab().playwright.locator('x'))).status, 'input-unchecked');
  assert.equal((await checkInput(roleTab(), { evaluate: async fn => fn(box(0)) })).status, 'target-not-visible');
  for (const cdp of [fakeCdp({ offset: [0, -43] }), null]) {
    const tab = roleTab({ columns: { edit: [LIB] }, cdp });
    assert.match((await clearReferences(tab)).status, /^input-/);
    assert.match((await attachLibraryImage(tab, LIB2, 'style')).status, /^input-/);
    const closed = roleTab({ panelOpen: false, cdp });
    assert.match((await openLibrary(closed)).status, /^input-/);
    assert.deepEqual([tab.state.clicks.length, closed.state.clicks.length], [0, 0]);
    if (cdp) assert.equal(cdp.state.presses, 0);
  }
  const hidden = roleTab({ columns: { edit: [LIB] }, under: 'outside' });
  assert.deepEqual([(await clearReferences(hidden)).status, hidden.state.clicks.length], ['target-covered', 0]);
  assert.deepEqual([(await attachLibraryImage(hidden, LIB2, 'style')).status, hidden.state.clicks.length], ['target-covered', 0]);
  const thumbnail = roleTab({ under: 'nested' });
  assert.deepEqual([(await attachLibraryImage(thumbnail, LIB2, 'style')).status, thumbnail.state.clicks.length], ['target-covered', 0]);
});

test('the uploads library is read from the Add Images panel only', async () => {
  const listed = await listLibraryImages(roleTab({ outlined: [LIB2], elsewhere: [LIB3] }));
  assert.deepEqual(listed.map(item => [item.libraryId, item.ratio, item.selected]), [[LIB, 0.8, false], [LIB2, 0.8, true]]);
  assert.deepEqual((await listLibraryImages(roleTab({ library: [LIB, LIB, LIB2], undecoded: [LIB2] }))).map(item => item.libraryId), [LIB]);
  assert.equal(await listLibraryImages(roleTab({ panelOpen: false, elsewhere: [LIB3] })), null);
  assert.equal(await listLibraryImages(roleTab({ fileInputs: 2 })), null);
  const closed = roleTab({ panelOpen: false, elsewhere: [LIB3] });
  const opened = await openLibrary(closed);
  assert.deepEqual([opened.status, opened.items.map(item => item.libraryId), closed.state.clicks.length], ['open', [LIB, LIB2], 1]);
  const already = roleTab();
  assert.deepEqual([(await openLibrary(already)).status, already.state.clicks.length], ['open', 0]);
  const empty = await openLibrary(roleTab({ library: [] }), { timeoutMs: 300 });
  assert.deepEqual([empty.status, empty.items], ['open', []]);
  const doubled = roleTab({ fileInputs: 2 });
  assert.deepEqual([(await openLibrary(doubled)).status, doubled.state.clicks.length], ['library-ambiguous', 0]);
  const stuck = roleTab({ panelOpen: false, openOnClick: false });
  assert.equal((await openLibrary(stuck, { timeoutMs: 100 })).status, 'library-not-shown');
  assert.equal((await openLibrary(roleTab({ panelOpen: false, failOn: 'click' }))).status, 'library-unconfirmed');
});

test('attachment is confirmed per role and never short-circuits on another role', async () => {
  const same = roleTab({ columns: { style: [LIB] } });
  assert.equal((await attachLibraryImage(same, LIB, 'style')).status, 'already-attached');
  assert.equal(same.state.clicks.length, 0);
  const other = roleTab({ columns: { style: [LIB] } });
  const added = await attachLibraryImage(other, LIB, 'image');
  assert.deepEqual([added.status, added.references.style, added.references.image], ['attached', [LIB], [LIB]]);
  const unselected = roleTab({ selectOnClick: false });
  const stray = await attachLibraryImage(unselected, LIB, 'style', { timeoutMs: 20 });
  assert.deepEqual([stray.status, stray.references.edit, stray.references.style], ['attach-unconfirmed', [LIB], []]);
  assert.equal((await attachLibraryImage(roleTab({ attachOnClick: false }), LIB, 'edit', { timeoutMs: 20 })).status, 'attach-unconfirmed');
  const missing = roleTab({ library: [LIB2] });
  assert.equal((await attachLibraryImage(missing, LIB, 'edit')).status, 'library-item-not-found');
  assert.equal(missing.state.clicks.length, 0);
  assert.equal((await attachLibraryImage(roleTab({ library: [LIB, LIB] }), LIB, 'edit')).status, 'library-item-ambiguous');
  assert.equal((await attachLibraryImage(roleTab({ rowShown: false }), LIB, 'edit')).status, 'role-row-not-shown');
  const crashed = await attachLibraryImage(roleTab({ failOn: 'click' }), LIB, 'edit');
  assert.deepEqual([crashed.status, /closed/.test(crashed.error)], ['attach-unconfirmed', true]);
  const unaimed = roleTab({ failOn: 'hit' });
  assert.deepEqual([(await attachLibraryImage(unaimed, LIB, 'edit')).status, unaimed.state.clicks.length], ['error', 0]);
  assert.equal((await attachLibraryImage(roleTab({ failOn: 'evaluate' }), LIB, 'edit')).status, 'error');
  await assert.rejects(attachLibraryImage(roleTab(), LIB, 'styles'));
  await assert.rejects(attachLibraryImage(roleTab(), 'not-an-id', 'edit'));
});

test('clearing uses the bar button and confirms empty columns', async () => {
  const empty = roleTab();
  assert.equal((await clearReferences(empty)).status, 'already-empty');
  assert.equal(empty.state.clicks.length, 0);
  const full = roleTab({ columns: { edit: [LIB], image: [LIB2] } });
  const cleared = await clearReferences(full);
  assert.deepEqual([cleared.status, cleared.references], ['cleared', { edit: [], style: [], image: [] }]);
  const stuck = await clearReferences(roleTab({ columns: { edit: [LIB] }, clearOnClick: false }), { timeoutMs: 20 });
  assert.deepEqual([stuck.status, stuck.references.edit], ['clear-unconfirmed', [LIB]]);
  const unreadable = roleTab({ columns: { edit: [LIB] }, failOn: 'evaluate' });
  assert.deepEqual([(await clearReferences(unreadable)).status, unreadable.state.clicks.length], ['error', 0]);
});

// Job page with a displayed candidate, the Imagine bar and labelled buttons. A button attaches
// the displayed candidate to the role named in attaches; shown overrides the URL's index. While
// the Add Images panel is open, a click outside it only closes it, as on the site. A full page
// load (goto) empties the bar; page links (links, and the sidebar Create link) keep it, unless
// linksDropState simulates a reload. overlay puts a nested button under every link's centre.
function jobRoleTab({ url = ORIGIN + '/imagine', shown = null, columns = {}, labels = ['빠른 편집', '스타일', '스타일 생성기', '프롬프트'],
  attaches = { '빠른 편집': 'edit', '스타일': 'style' }, cdp = fakeCdp(), gotoHangs = false, panelOpen = false, links = [], linksDropState = false, overlay = false,
  failAfterClick = false, draft = '' } = {}) {
  const state = { url, draft, columns: { edit: [], style: [], image: [], ...structuredClone(columns) }, gotos: 0, clicks: [], aimed: null, panelOpen };
  const empty = () => { state.columns = { edit: [], style: [], image: [] }; };
  const job = () => parseJobHref(state.url);
  const displayed = () => shown ?? job()?.index ?? 0;
  const media = () => (job() ? [img(cdn(job().jobId, displayed())), ...[0, 1, 2, 3].map(i => img(cdn(job().jobId, i, true), { width: 384, height: 480, rect: [1200, 200 + i * 60, 56, 56] }))] : []);
  const click = label => {
    state.clicks.push(label);
    if (label === 'toggle') { state.panelOpen = !state.panelOpen; return; }
    if (state.panelOpen) { state.panelOpen = false; return; }
    if (label.startsWith('link:')) { state.url = ORIGIN + label.slice(5); if (linksDropState) empty(); return; }
    const role = attaches[label];
    const key = job() && 'job:' + job().jobId + '/' + displayed();
    if (role && key && !state.columns[role].includes(key)) state.columns[role].push(key);
  };
  if (cdp) cdp.state.onClick = () => click(state.aimed);
  const aimable = (label, under = 'inside') => ({ evaluate: async (fn, arg) => (arg === undefined ? ((state.aimed = label), fn(box())) : hitTest(fn, arg, under)) });
  const button = name => {
    const hits = labels.filter(label => name.test(label));
    return {
      ...aimable(hits[0]),
      filter: () => button(name),
      count: async () => hits.length,
    };
  };
  const linkHref = selector => (selector.match(/^a\[href(?:\$)?="([^"]+)"\]$/) || [])[1];
  const locator = selector => {
    const href = linkHref(selector);
    const visibleLinks = href === '/imagine' ? 1 : links.filter(link => href && link.endsWith(href)).length;
    return {
      ...(href ? aimable('link:' + (href === '/imagine' ? href : links.find(link => link.endsWith(href))), overlay && href !== '/imagine' ? 'nested' : 'inside') : aimable('toggle')),
      first: () => locator(selector),
      filter: () => locator(selector),
      count: async () => (href ? visibleLinks : selector === 'input[type="file"]' ? Number(state.panelOpen) : 1),
      waitFor: async ({ state: wanted }) => {
        if (selector === PROMPT_INPUT) return;
        if ((wanted === 'detached') === state.panelOpen) throw new Error('timeout');
      },
    };
  };
  return {
    state,
    url: async () => state.url,
    goto: async next => { state.gotos += 1; if (gotoHangs) return new Promise(() => {}); state.url = next; empty(); },
    capabilities: { get: async name => (name === 'cdp' ? cdp : null) },
    playwright: {
      evaluate: async (fn, arg) => {
        if (failAfterClick && state.clicks.length) throw new Error('Execution context was destroyed');
        const dom = barDom({ columns: state.columns, rowShown: Object.values(state.columns).some(list => list.length), media: media() });
        dom.getElementById('desktop_input_bar').value = state.draft;
        return inDom(dom, () => fn(arg));
      },
      getByRole: (role, { name }) => { assert.equal(role, 'button'); return button(name); },
      locator,
      waitForTimeout: ms => sleep(Math.min(ms, 20)),
    },
  };
}

test('generated candidates attach by job ID and index from their job page', { timeout: 10000 }, async () => {
  const quick = jobRoleTab();
  const edit = await attachJobImage(quick, A, 2, 'edit');
  assert.deepEqual([edit.status, edit.key, edit.references.edit, quick.state.clicks, quick.state.gotos], ['attached', 'job:' + A + '/2', ['job:' + A + '/2'], ['빠른 편집'], 1]);
  const styled = await attachJobImage(quick, A, 2, 'style');
  assert.deepEqual([styled.status, styled.references.style, quick.state.clicks.at(-1), quick.state.gotos], ['attached', ['job:' + A + '/2'], '스타일', 1]);
  const again = await attachJobImage(quick, A, 2, 'style');
  assert.deepEqual([again.status, quick.state.clicks.length], ['already-attached', 2]);
  const wrongShown = jobRoleTab({ shown: 1 });
  assert.deepEqual([(await attachJobImage(wrongShown, A, 2, 'edit', { timeoutMs: 400 })).status, wrongShown.state.clicks.length], ['display-mismatch', 0]);
  const twins = jobRoleTab({ labels: ['빠른 편집', '빠른 편집'] });
  assert.deepEqual([(await attachJobImage(twins, A, 2, 'edit')).status, twins.state.clicks.length], ['role-button-ambiguous', 0]);
  const shifted = jobRoleTab({ cdp: fakeCdp({ offset: [0, -43] }) });
  assert.deepEqual([(await attachJobImage(shifted, A, 2, 'style')).status, shifted.state.clicks.length], ['input-misaligned', 0]);
  const blind = jobRoleTab({ cdp: null });
  assert.deepEqual([(await attachJobImage(blind, A, 2, 'edit')).status, blind.state.clicks.length], ['input-unchecked', 0]);
  const panelled = jobRoleTab({ url: jobURL(A, 2), panelOpen: true });
  const closedFirst = await attachJobImage(panelled, A, 2, 'edit');
  assert.deepEqual([closedFirst.status, panelled.state.clicks, panelled.state.gotos], ['attached', ['toggle', '빠른 편집'], 0]);
  const misrouted = jobRoleTab({ attaches: { '빠른 편집': 'style' } });
  const lost = await attachJobImage(misrouted, A, 2, 'edit', { timeoutMs: 300 });
  assert.deepEqual([lost.status, lost.references.style], ['attach-unconfirmed', ['job:' + A + '/2']]);
  const hung = jobRoleTab({ gotoHangs: true });
  assert.deepEqual([(await attachJobImage(hung, A, 2, 'edit', { timeoutMs: 200 })).status, hung.state.clicks.length], ['navigation-timeout', 0]);
  await assert.rejects(attachJobImage(jobRoleTab(), A, 2, 'image'), /upload/);
  await assert.rejects(attachJobImage(jobRoleTab(), A, 16, 'edit'));
  await assert.rejects(attachJobImage(jobRoleTab(), 'x', 0, 'edit'));
});

test('attachments survive only in-app navigation, which is used whenever the bar is not empty', { timeout: 10000 }, async () => {
  const held = jobRoleTab({ columns: { style: [LIB] } });
  const refused = await attachJobImage(held, A, 2, 'edit');
  assert.deepEqual([refused.status, held.state.gotos, held.state.clicks.length, held.state.columns.style], ['navigation-would-clear', 0, 0, [LIB]]);
  const linked = jobRoleTab({ columns: { style: [LIB] }, links: ['/jobs/' + A + '?index=2', '/jobs/' + A + '?index=12'] });
  const kept = await attachJobImage(linked, A, 2, 'edit');
  assert.deepEqual([kept.status, kept.references.style, kept.references.edit, linked.state.gotos], ['attached', [LIB], ['job:' + A + '/2'], 0]);
  assert.deepEqual(linked.state.clicks, ['link:/jobs/' + A + '?index=2', '빠른 편집']);
  const covered = jobRoleTab({ columns: { style: [LIB] }, links: ['/jobs/' + A + '?index=2'], overlay: true });
  assert.deepEqual([(await attachJobImage(covered, A, 2, 'edit')).status, covered.state.clicks.length, covered.state.gotos], ['navigation-would-clear', 0, 0]);
  const behind = jobRoleTab({ links: ['/jobs/' + A + '?index=2'], overlay: true });
  assert.deepEqual([(await attachJobImage(behind, A, 2, 'edit')).status, behind.state.clicks, behind.state.gotos], ['attached', ['빠른 편집'], 1]);
  const panelled = jobRoleTab({ columns: { style: [LIB] }, links: ['/jobs/' + A + '?index=2'], panelOpen: true });
  assert.deepEqual([(await attachJobImage(panelled, A, 2, 'edit')).status, panelled.state.clicks[0], panelled.state.gotos], ['attached', 'toggle', 0]);
  const created = await openCreate(linked);
  assert.deepEqual([created.status, linked.state.url, created.references.edit, linked.state.gotos], ['open', ORIGIN + '/imagine', ['job:' + A + '/2'], 0]);
  const again = await openCreate(linked);
  assert.deepEqual([again.status, linked.state.clicks.length], ['open', 3]);
  const dropping = jobRoleTab({ url: jobURL(A, 2), columns: { edit: ['job:' + A + '/2'] }, linksDropState: true });
  assert.equal((await openCreate(dropping)).status, 'references-changed');
  assert.equal((await openCreate(jobRoleTab({ url: jobURL(A, 2), cdp: fakeCdp({ offset: [0, -43] }) }))).status, 'input-misaligned');
});

test('late page loads, spent deadlines and preparatory clicks are handled conservatively', { timeout: 10000 }, async () => {
  const hung = jobRoleTab({ gotoHangs: true });
  assert.equal((await attachJobImage(hung, A, 2, 'edit', { timeoutMs: 200 })).status, 'navigation-timeout');
  assert.deepEqual([(await attachJobImage(hung, A, 2, 'style')).status, (await openCreate(hung)).status, hung.state.gotos, hung.state.clicks.length], ['navigation-pending', 'navigation-pending', 1, 0]);
  const spent = jobRoleTab();
  assert.deepEqual([(await attachJobImage(spent, A, 2, 'edit', { timeoutMs: 0 })).status, spent.state.gotos, spent.state.clicks.length], ['navigation-timeout', 0, 0]);
  const onPage = jobRoleTab({ url: jobURL(A, 2) });
  assert.deepEqual([(await attachJobImage(onPage, A, 2, 'edit', { timeoutMs: 0 })).status, onPage.state.clicks.length], ['deadline-passed', 0]);
  for (const timeoutMs of [NaN, Infinity, -1]) {
    await assert.rejects(attachJobImage(jobRoleTab({ url: jobURL(A, 2) }), A, 2, 'edit', { timeoutMs }), /finite/);
    await assert.rejects(openCreate(jobRoleTab(), { timeoutMs }), /finite/);
    await assert.rejects(clearReferences(roleTab({ columns: { edit: [LIB] } }), { timeoutMs }), /finite/);
    await assert.rejects(openLibrary(roleTab(), { timeoutMs }), /finite/);
  }
  const panelled = jobRoleTab({ url: jobURL(A, 2), columns: { edit: ['job:' + A + '/2'] }, panelOpen: true });
  const created = await openCreate(panelled);
  assert.deepEqual([created.status, panelled.state.clicks, created.references.edit], ['open', ['toggle', 'link:/imagine'], ['job:' + A + '/2']]);
  const lost = jobRoleTab({ panelOpen: true, failAfterClick: true });
  const afterToggle = await attachJobImage(lost, A, 2, 'edit');
  assert.deepEqual([afterToggle.status, lost.state.clicks], ['attach-unconfirmed', ['toggle']]);
});


test('full navigation refuses to discard drafts or references across attachment, read and save', async () => {
  for (const action of [tab => attachJobImage(tab, A, 2, 'edit'), tab => readCandidates(tab, A), tab => saveCandidate(tab, A, 2, os.tmpdir())]) {
    for (const content of [{ draft: 'Keep this unsent prompt' }, { columns: { style: [LIB] } }]) {
      const tab = jobRoleTab(content);
      assert.equal((await action(tab)).status, 'navigation-would-clear');
      assert.equal(tab.state.gotos, 0);
      assert.equal(tab.state.draft, content.draft ?? '');
    }
  }
  const linked = jobRoleTab({ draft: 'Keep this unsent prompt', links: ['/jobs/' + A + '?index=2'] });
  assert.equal((await attachJobImage(linked, A, 2, 'edit')).status, 'attached');
  assert.equal(linked.state.draft, 'Keep this unsent prompt');
  assert.equal(linked.state.gotos, 0);
});
