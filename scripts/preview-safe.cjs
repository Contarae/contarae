const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createRequire } = require('node:module');
const requireCli = createRequire(require.resolve('netlify-cli/package.json'));
const toml = requireCli('@iarna/toml');

async function start() {
  const root = path.resolve(__dirname, '../build');
  const config = toml.parse(await fs.readFile(path.resolve(__dirname, '../netlify.toml'), 'utf8'));
  const globalHeaders = config.headers.find(rule => rule.for === '/*').values;
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (req.method !== 'GET' || pathname.startsWith('/api/') || pathname.startsWith('/.netlify/')) {
        res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ error: 'Vista local aislada: las operaciones reales no estan conectadas.' }));
        return;
      }
      let file = path.resolve(root, `.${pathname}`);
      if (!file.startsWith(`${root}${path.sep}`) && file !== root) { res.writeHead(403); res.end(); return; }
      if (!(await fs.stat(file).catch(() => null))?.isFile()) file = path.join(root, 'index.html');
      const headers = { ...globalHeaders, 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': pathname.startsWith('/static/') ? 'public, max-age=31536000, immutable' : 'no-store' };
      res.writeHead(200, headers);
      res.end(await fs.readFile(file));
    } catch { res.writeHead(500); res.end(); }
  });
  server.listen(Number(process.env.PREVIEW_PORT || 4183), '127.0.0.1', () => console.log(`Vista local aislada: http://127.0.0.1:${server.address().port}`));
}
start().catch(error => { console.error(error.message); process.exitCode = 1; });
