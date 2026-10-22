const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = '127.0.0.1';
const ROOT_DIR = fs.realpathSync(__dirname);
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf'
};

function outsideRoot(filePath) {
  const relative = path.relative(ROOT_DIR, filePath);
  return relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}

function sendError(req, res, status, message) {
  if (res.destroyed || res.writableEnded) return;
  if (res.headersSent) { res.destroy(); return; }
  const body = `${status} ${message}\n`;
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(req.method === 'HEAD' ? undefined : body);
}

// Development only: same-origin static files, bound exclusively to loopback.
const server = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Allow', 'GET, HEAD, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    req.resume();
    sendError(req, res, 405, 'Method Not Allowed');
    return;
  }
  let pathname;
  try {
    const rawPath = (req.url || '/').split('?')[0];
    if (!rawPath.startsWith('/')) throw new Error('Expected a relative request path');
    pathname = decodeURIComponent(rawPath);
  } catch (_) { sendError(req, res, 400, 'Bad Request'); return; }
  if (/[\\\u0000-\u001f:]/.test(pathname)) { sendError(req, res, 400, 'Bad Request'); return; }
  const filePath = path.resolve(ROOT_DIR, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (outsideRoot(filePath)) { sendError(req, res, 403, 'Forbidden'); return; }
  // Resolve links/junctions as well as lexical '..' traversal and sibling-prefix paths.
  fs.realpath(filePath, (resolveError, realPath) => {
    if (resolveError) { sendError(req, res, resolveError.code === 'EACCES' ? 403 : 404, resolveError.code === 'EACCES' ? 'Forbidden' : 'Not Found'); return; }
    if (outsideRoot(realPath)) { sendError(req, res, 403, 'Forbidden'); return; }
    fs.stat(realPath, (statError, stats) => {
      if (statError || !stats.isFile()) { sendError(req, res, 404, 'Not Found'); return; }
      if (res.destroyed) return;
      const headers = { 'Content-Type': MIME_TYPES[path.extname(realPath).toLowerCase()] || 'application/octet-stream', 'Content-Length': stats.size };
      if (req.method === 'HEAD') { res.writeHead(200, headers); res.end(); return; }
      const stream = fs.createReadStream(realPath);
      stream.once('error', (error) => sendError(req, res, error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? 'Not Found' : 'Read Error'));
      stream.once('open', () => {
        if (res.destroyed) { stream.destroy(); return; }
        res.writeHead(200, headers);
        stream.pipe(res);
      });
      res.once('close', () => stream.destroy());
      res.once('error', () => stream.destroy());
    });
  });
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${PORT} is already in use.` : `Local server error: ${error.message}`);
  process.exitCode = 1;
});
server.listen(PORT, HOST, () => {
  console.log(`Qoraqalpog'iston development server is ready: http://${HOST}:${PORT}/`);
  console.log('Open the address after this message. Stop the server with Ctrl+C.');
});
