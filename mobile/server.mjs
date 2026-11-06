import http from 'node:http';
import fs from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(__dirname, 'dist');

// Ensure mobile build exists
if (!existsSync(path.join(distDir, 'app.js'))) {
  console.log('Compilando mobile/dist antes de iniciar...');
  execSync(`node "${path.join(__dirname, 'build.cjs')}"`, { stdio: 'inherit' });
}

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm'
};

function getLocalIps() {
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        // Prioritize Wi-Fi
        if (/wi-fi|wlan|sem fio/i.test(name)) {
          addresses.unshift({ name, ip: net.address });
        } else {
          addresses.push({ name, ip: net.address });
        }
      }
    }
  }
  return addresses.length ? addresses : [{ name: 'Localhost', ip: 'localhost' }];
}

// Find Desktop Library Path
async function getDesktopLibraryRoot() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const configPath = path.join(appData, 'Image Atlas', 'application.json');
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    const conf = JSON.parse(raw);
    if (conf.library && existsSync(conf.library)) return conf.library;
  } catch {}
  const defaultLib = path.join(appData, 'Image Atlas', 'libraries', 'default');
  if (existsSync(defaultLib)) return defaultLib;
  return null;
}

const server = http.createServer(async (req, res) => {
  // CORS & PWA headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Service-Worker-Allowed', '/');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // 1. Endpoint: Sync Desktop Vault to Mobile
  if (url.pathname === '/api/vault/backup') {
    try {
      const libRoot = await getDesktopLibraryRoot();
      if (!libRoot) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Biblioteca do computador não encontrada.' }));
        return;
      }

      const files = [];
      const ignored = new Set(['.obsidian', '.git', 'node_modules', '.trash', 'local-backups']);

      async function scan(dir, base = '') {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.atlas-') || ignored.has(entry.name)) continue;
          const rel = base ? base + '/' + entry.name : entry.name;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await scan(full, rel);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            const isBinary = /^\.(png|jpe?g|webp|gif|pdf|avif|ico)$/i.test(ext);
            const content = await fs.readFile(full);
            files.push({
              path: rel,
              content: isBinary ? content.toString('base64') : content.toString('utf8'),
              isBinary
            });
          }
        }
      }

      await scan(libRoot);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ files }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 2. Static File Serving from mobile/dist
  let reqPath = decodeURIComponent(url.pathname);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  let filePath = path.join(distDir, reqPath);
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403);
    res.end('Acesso negado');
    return;
  }

  try {
    let stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stat = await fs.stat(filePath);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });

    createReadStream(filePath).pipe(res);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Fallback to index.html for SPA routes
      try {
        const indexFile = path.join(distDir, 'index.html');
        const stat = await fs.stat(indexFile);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': stat.size });
        createReadStream(indexFile).pipe(res);
      } catch {
        res.writeHead(404);
        res.end('Arquivo não encontrado');
      }
    } else {
      res.writeHead(500);
      res.end('Erro interno: ' + err.message);
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIps();
  console.log('\n================================================================');
  console.log('            ◈  ROMUS MOBILE - SERVIDOR ATIVO  ◈                 ');
  console.log('================================================================\n');
  console.log('  📱 NO SEU CELULAR (conectado na mesma rede Wi-Fi):');
  for (const { name, ip } of ips) {
    console.log(`  👉 [${name}]:  http://${ip}:${PORT}`);
  }
  console.log('\n  💻 NO SEU COMPUTADOR:');
  console.log(`  👉 Acesse:  http://localhost:${PORT}`);
  console.log('\n----------------------------------------------------------------');
  console.log('  COMO USAR NO CELULAR:');
  console.log('  1. Digite o endereço http://' + ips[0].ip + ':' + PORT + ' no Chrome (Android) ou Safari (iPhone).');
  console.log('  2. No menu do navegador, toque em "Adicionar à tela de início" ou "Instalar app".');
  console.log('  3. O ROMUS abrirá em tela cheia como um aplicativo nativo no celular!');
  console.log('  4. Toque no botão (+) -> "Baixar Notas do Computador" para sincronizar tudo.');
  console.log('================================================================\n');
});
