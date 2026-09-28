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
  ROLE_ICONS, referenceKey, sameReferences, readReferences, clearReferences,
} from '../skills/midjourney-web/scripts/codex-browser.mjs';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const OLD = '33333333-3333-4333-8333-333333333333';
const NEW = '44444444-4444-4444-8444-444444444444';
const PROMPT = 'A red ceramic cube on a walnut table, soft window light --ar 16:9 --raw';
const LIB = 'ab'.repeat(32);
const LIB2 = 'cd'.repeat(32);
const libSrc = id => 'https://cdn.midjourney.com/u/' + A + '/' + id + '_384_N.jpg';

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

test('media names distinguish originals from previews', () => {
  assert.deepEqual(parseMediaSrc(cdn(A, 2)), { jobId: A, index: 2, original: true, ext: 'jpeg' });
  assert.deepEqual(parseMediaSrc('https://cdn.midjourney.com/' + A + '/0_1_640_N.webp?method=shortest'), { jobId: A, index: 1, original: false, ext: 'webp' });
  for (const src of ['https://cdn.example.com/' + A + '/0_1.jpeg', 'https://cdn.midjourney.com/' + A + '/grid_0.png', 'not a url']) {
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
function submitTab({ url = ORIGIN + '/imagine', draft = '', echo = value => value, feeds = [[A, B]], rows = {}, linksWithoutJobs = false, slowTicks = 0 } = {}) {
  const state = { value: draft, fills: 0, presses: 0, feed: 0, slow: slowTicks };
  const dom = () => feedDom(feeds[state.feed], rows);
  const input = {
    count: async () => 1,
    evaluate: async fn => fn({ value: state.value }),
    fill: async value => { state.fills += 1; state.value = echo(value); },
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

test('waits continue across short host wait slices and rethrow other errors', async () => {
  let calls = 0;
  const slowLocator = { waitFor: async () => { calls += 1; if (calls < 4) throw new Error('Playwright selector deadline exceeded'); } };
  assert.equal(await waitUntil(slowLocator, 'attached', Date.now() + 5000), true);
  assert.equal(calls, 4);
  const never = { waitFor: async () => { throw new Error('timed out'); } };
  assert.equal(await waitUntil(never, 'attached', Date.now() + 30), false);
  const broken = { waitFor: async () => { throw new Error('Invalid selector'); } };
  await assert.rejects(waitUntil(broken, 'attached', Date.now() + 1000), /Invalid selector/);
});

// Job-page tab with executable DOM images and a controllable pageAssets capability.
function jobTab({ images, index = 0, bundle, decodeAfter = 0 }) {
  let current = jobURL(A, index);
  let evaluations = 0;
  const dom = () => ({ images: evaluations > decodeAfter ? images.map(image => ({ ...image, complete: true, naturalWidth: image.naturalWidth || 960, naturalHeight: image.naturalHeight || 1200 })) : images, body: el(), querySelector: () => null });
  const assets = {
    list: async () => ({ id: 'inventory', assets: images.map((image, i) => ({ id: 'asset' + i, url: image.currentSrc })) }),
    bundle: async ({ assetIds }) => bundle(assetIds[0]),
  };
  return {
    url: async () => current,
    goto: async url => { current = url; },
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
      waitForTimeout: async () => {},
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

test('saving exports only a verified original of the requested candidate', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mj-save-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  let n = 0;
  const file = bytes => { const p = path.join(dir, 'asset-' + (n += 1) + '.jpeg'); fs.writeFileSync(p, bytes); return p; };
  const ok = bytes => async id => ({ assets: [{ id, path: file(bytes) }], failures: [] });
  const out = path.join(dir, 'out');
  const shown = index => [img(cdn(A, index)), ...strip];

  const wrong = jobTab({ index: 1, images: [img(cdn(A, 1), { rect: [1200, 0, 56, 56] }), img(cdn(A, 2)), ...strip], bundle: ok(jpeg(960, 1200)) });
  assert.equal((await saveCandidate(wrong, A, 1, out)).status, 'display-mismatch');
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
  const saved = await saveCandidate(jobTab({ index: 2, images: shown(2), bundle: ok(good) }), A, 2, out);
  assert.deepEqual([saved.status, saved.outcome, saved.width, saved.height], ['saved', 'copied', 960, 1200]);
  assert.deepEqual(new Uint8Array(fs.readFileSync(saved.path)), good);
  const again = await saveCandidate(jobTab({ index: 2, images: shown(2), bundle: ok(good) }), A, 2, out);
  assert.equal(again.outcome, 'identical-existing');
  await assert.rejects(saveCandidate(jobTab({ index: 2, images: shown(2), bundle: ok(good) }), A, 2, 'relative/dir'));
});

test('library thumbnails yield opaque IDs and same-aspect candidates', () => {
  assert.deepEqual(parseLibrarySrc(libSrc(LIB)), { libraryId: LIB });
  for (const src of [cdn(A, 0), 'https://cdn.midjourney.com/u/' + A + '/' + LIB + '.jpg', 'https://example.com/u/' + A + '/' + LIB + '_384_N.jpg']) {
    assert.equal(parseLibrarySrc(src), null);
  }
  const items = [{ libraryId: LIB, ratio: 0.8 }, { libraryId: LIB2, ratio: 1.5 }];
  assert.deepEqual(sameAspectItems(items, 1122, 1402).map(item => item.libraryId), [LIB]);
  assert.throws(() => sameAspectItems(items, 0, 10));
});

// Imagine bar with role columns; attachments are background images, as on the site. A feed row
// outside the bar carries the same SubjectReferenceIcon and its own reference.
function node(tagName, { id = '', style = '', children = [] } = {}) {
  const n = { tagName, id, children, parentElement: null, getAttribute: name => (name === 'style' ? style || null : null) };
  for (const child of children) child.parentElement = n;
  return n;
}
function barDom({ columns, rowShown, images }) {
  const bg = key => node('DIV', { style: 'background-image: url("' + libSrc(key).replace('_384_', '_128_') + '"); background-size: cover;' });
  const column = role => node('DIV', { children: [node('svg', { children: [node('g', { id: ROLE_ICONS[role] })] }), ...columns[role].map(bg)] });
  const feed = node('DIV', { children: [node('DIV', { children: [node('g', { id: ROLE_ICONS.edit }), bg(LIB2)] })] });
  const bar = node('DIV', { children: [node('TEXTAREA', { id: 'desktop_input_bar' }), ...(rowShown ? [node('DIV', { children: Object.keys(ROLE_ICONS).map(column) })] : [])] });
  const body = node('BODY', { children: [feed, bar] });
  const all = n => n.children.flatMap(child => [child, ...all(child)]);
  return { body, images, getElementById: id => all(body).find(n => n.id === id) ?? null };
}
// Clicking a role header selects that column (unless selectOnClick is false); clicking a library
// item attaches it to the selected column (unless attachOnClick is false).
function roleTab({ columns = {}, rowShown = true, library = [LIB, LIB2], outlined = [], selectOnClick = true, attachOnClick = true, clearOnClick = true } = {}) {
  const state = { columns: { edit: [], style: [], image: [], ...structuredClone(columns) }, active: 'edit', clicks: [], rowShown };
  const images = library.map(id => ({ currentSrc: libSrc(id), naturalWidth: 384, naturalHeight: 480, parentElement: { className: outlined.includes(id) ? 'h-0 outline p-3' : 'h-0 false' } }));
  const locator = selector => ({
    filter: () => locator(selector),
    first: () => locator(selector),
    last: () => locator(selector),
    locator: child => locator(child),
    count: async () => {
      const item = selector.match(/img\[src\*="\/([0-9a-f]{64})_"\]/);
      if (item) return library.filter(id => id === item[1]).length;
      return /^svg:has\(g#|TrashIcon/.test(selector) && state.rowShown ? 1 : 0;
    },
    click: async () => {
      state.clicks.push(selector);
      const item = selector.match(/img\[src\*="\/([0-9a-f]{64})_"\]/);
      const role = Object.keys(ROLE_ICONS).find(r => selector === 'svg:has(g#' + ROLE_ICONS[r] + ')');
      if (role) { if (selectOnClick) state.active = role; } else if (item) {
        if (attachOnClick && !state.columns[state.active].includes(item[1])) state.columns[state.active].push(item[1]);
      } else if (/TrashIcon/.test(selector) && clearOnClick) for (const r of Object.keys(state.columns)) state.columns[r] = [];
    },
  });
  return {
    state,
    playwright: {
      locator,
      evaluate: async (fn, arg) => inDom(barDom({ columns: state.columns, rowShown: state.rowShown, images }), () => fn(arg)),
      waitForTimeout: async () => {},
    },
  };
}

test('role columns are read inside the Imagine bar only', async () => {
  assert.equal(referenceKey('background-image: url("' + libSrc(LIB).replace('_384_', '_128_') + '")'), LIB);
  assert.equal(referenceKey("background-image: url('https://s.mj.run/abc?thumb=true')"), 'https://s.mj.run/abc');
  assert.equal(referenceKey('color: red'), null);
  assert.deepEqual(await readReferences(roleTab({ columns: { style: [LIB] } })), { edit: [], style: [LIB], image: [] });
  assert.equal(await readReferences(roleTab({ rowShown: false })), null);
  assert.equal(sameReferences({ style: [LIB] }, { edit: [], style: [LIB], image: [] }), true);
  assert.equal(sameReferences({}, { edit: [], style: [LIB], image: [] }), false);
  assert.equal(sameReferences({}, null), true);
  assert.throws(() => sameReferences({ styles: [LIB] }, null));
});

test('attachment is confirmed per role and never short-circuits on another role', async () => {
  const listed = await listLibraryImages(roleTab({ outlined: [LIB2] }));
  assert.deepEqual(listed.map(item => [item.libraryId, item.ratio, item.selected]), [[LIB, 0.8, false], [LIB2, 0.8, true]]);
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
});
