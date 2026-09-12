#!/usr/bin/env node
// Render only observed CDN images so the host can export loaded image assets.
// This helper does not fetch media, read credentials, or change the source site.
import http from 'node:http';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export function mediaURL(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'cdn.midjourney.com' ||
      url.port || url.username || url.password || url.hash ||
      !/\.(png|jpe?g|webp|gif)$/i.test(url.pathname)) {
    throw new Error('Use an exact observed HTTPS cdn.midjourney.com image URL without credentials or fragment');
  }
  return url.href;
}

export function parseArgs(args) {
  const urls = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== '--url' || !args[i + 1] || args[i + 1].startsWith('--')) {
      throw new Error('Usage: node media-bridge.mjs --url <observed-image-url> [--url <another-image-url>]');
    }
    urls.push(mediaURL(args[++i]));
  }
  if (!urls.length) throw new Error('At least one observed image URL is required');
  return urls;
}

const escapeHTML = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function createBridge(urls) {
  const validated = urls.map(mediaURL);
  if (!validated.length) throw new Error('At least one observed image URL is required');
  const html = `<!doctype html><html lang="en"><meta charset="utf-8">
<title>Midjourney original media bridge</title>
<style>body{font:16px system-ui;margin:24px;background:#eee;color:#222}figure{margin:24px 0}img{display:block;max-width:90vw;height:auto}figcaption{margin-bottom:8px}</style>
<h1>Midjourney original media bridge</h1>
<p>Observed image URLs only. Images are loaded without conversion. Export the selected loaded asset through the browser's supported file API.</p>
${validated.map((url, i) => `<figure><figcaption>Asset ${i + 1}</figcaption><img alt="Asset ${i + 1}" src="${escapeHTML(url)}" loading="eager"></figure>`).join('\n')}
</html>`;
  return http.createServer((request, response) => {
    const headers = { 'Cache-Control': 'no-store', 'Connection': 'close', 'Content-Type': 'text/html; charset=utf-8' };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { ...headers, Allow: 'GET, HEAD' });
      response.end();
    } else if (request.url !== '/' && request.url !== '/index.html') {
      response.writeHead(404, headers);
      response.end();
    } else {
      response.writeHead(200, { ...headers, 'Content-Length': Buffer.byteLength(html) });
      response.end(request.method === 'HEAD' ? undefined : html);
    }
  });
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const urls = parseArgs(process.argv.slice(2));
    const server = createBridge(urls);
    server.on('error', error => { console.error(error.message); process.exitCode = 1; });
    server.listen(0, '127.0.0.1', () => console.log(JSON.stringify({ url: `http://127.0.0.1:${server.address().port}/`, images: urls.length })));
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
