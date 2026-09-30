/**
 * ID Mobile Manager Pro - Local Server
 * 
 * This is a simple local server for serving the built application.
 * Run this after building the project: npm run build
 * 
 * Usage:
 *   node server.js
 * 
 * Then access:
 *   - On this computer: http://localhost:3000
 *   - From mobile on same WiFi: http://YOUR-IP:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
};

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

const server = http.createServer((req, res) => {
  // CORS headers for local network
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // SPA fallback - serve index.html for all non-file routes
  if (!path.extname(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Try index.html for SPA routing
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data2);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║        ID Mobile Manager Pro - Local Server         ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Server running on port ${PORT}                        ║`);
  console.log('║                                                      ║');
  console.log('║  Access from this computer:                          ║');
  console.log(`║    → http://localhost:${PORT}                          ║`);
  console.log('║                                                      ║');
  console.log('║  Access from mobile/tablet on same WiFi:             ║');
  ips.forEach(ip => {
    const url = `http://${ip}:${PORT}`;
    console.log(`║    → ${url}${' '.repeat(Math.max(0, 48 - url.length))}║`);
  });
  console.log('║                                                      ║');
  console.log('║  Default login: admin / ChangeMe123!                 ║');
  console.log('║  (Change password on first login)                    ║');
  console.log('║                                                      ║');
  console.log('║  Press Ctrl+C to stop the server                     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
});
