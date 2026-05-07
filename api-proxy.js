/**
 * API 代理 - 将 OpenClaw Gateway 的 chatCompletions 端口暴露给前端
 * 
 * 用法: node api-proxy.js
 * 监听: 0.0.0.0:3000
 * 转发: http://127.0.0.1:18789/v1/chat/completions
 */

import http from 'http';
import https from 'https';

const PORT = 80;
const GATEWAY_HOST = '127.0.0.1';
const GATEWAY_PORT = 18789;
const GATEWAY_TOKEN = '38ba03e8caf00adc553ec167344c403c7a14a86979960c730bc2c0bf02db2f9f';

const server = http.createServer((req, res) => {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 只允许 POST /v1/chat/completions
  if (req.method !== 'POST' || !req.url.includes('/v1/chat/completions')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // 读取请求体
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    // 转发到 Gateway
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
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
      console.error('Proxy error:', e.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Gateway unreachable', detail: e.message }));
    });

    proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API 代理运行在 http://0.0.0.0:${PORT}`);
  console.log(`转发到 http://${GATEWAY_HOST}:${GATEWAY_PORT}`);
});
