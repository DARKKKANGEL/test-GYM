import http from 'node:http';
import { readFile } from 'node:fs/promises';

const requestedPort = Number(process.env.PORT ?? 8765);
if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
  console.error('PORT 必须是 0–65535 之间的整数。');
  process.exit(1);
}
const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/styles.css', ['styles.css', 'text/css']],
  ['/questions.js', ['questions.js', 'text/javascript']],
  ['/app.js', ['app.js', 'text/javascript']],
]);
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end('Method not allowed');
  }
  let pathname;
  try { pathname = new URL(req.url, 'http://127.0.0.1').pathname; }
  catch { res.writeHead(400); return res.end('Bad request'); }
  const file = files.get(pathname);
  if (!file) { res.writeHead(404); return res.end(req.method === 'HEAD' ? undefined : 'Not found'); }
  try {
    const bytes = await readFile(new URL(`./dist/${file[0]}`, import.meta.url));
    res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Content-Length': bytes.length });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch {
    res.writeHead(500);
    res.end('无法读取网页文件，请确认 dist 目录完整。');
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `端口 ${requestedPort} 已被占用。请关闭已运行的工作台，或用 PORT=8766 npm start 换一个端口。`
    : error.message);
  process.exitCode = 1;
});
server.listen(requestedPort, '127.0.0.1', () => {
  console.log(`\n求是知新 · 闭卷练习工作台\nhttp://127.0.0.1:${server.address().port}\n\n保持此终端打开；按 Ctrl+C 停止。\n`);
});
