/**
 * API 代理 + 静态文件服务器
 * 监听: 0.0.0.0:80
 * API: POST /v1/chat/completions → Gateway 18789
 * 静态: GET /* → ./ 目录
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 80;
const GATEWAY_HOST = '127.0.0.1';
const GATEWAY_PORT = 18789;
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '38ba03e8caf00adc553ec167344c403c7a14a86979960c730bc2c0bf02db2f9f';
const MAX_BODY_SIZE = 1024 * 1024; // 1MB

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // API 代理
  if (req.method === 'POST' && req.url.includes('/v1/chat/completions')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request body too large' }));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (body.length > MAX_BODY_SIZE) return;
      const proxyReq = http.request({
        hostname: GATEWAY_HOST,
        port: GATEWAY_PORT,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GATEWAY_TOKEN}`,
          'Content-Length': Buffer.byteLength(body)
        }
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        proxyRes.pipe(res);
      });
      proxyReq.on('error', (e) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Gateway unreachable' }));
      });
      proxyReq.write(body);
      proxyReq.end();
    });
    return;
  }

  // 静态文件（去掉 query string，防路径遍历）
  const urlPath = req.url.split('?')[0];
  let filePath = urlPath === '/' ? '/demo/agent.html' : urlPath;
  filePath = path.resolve(path.join(__dirname, filePath));
  
  // 安全检查：防止路径遍历
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath);
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    
    // 静态文件缓存（1小时）
    if (ext === '.js' || ext === '.css' || ext === '.jpg' || ext === '.png') {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`运行在 http://0.0.0.0:${PORT}`);
  console.log(`API: /v1/chat/completions → Gateway`);
  console.log(`静态: / → demo/agent.html`);
});
