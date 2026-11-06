const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const mobileDir = path.resolve(__dirname);
  const outDir = path.join(mobileDir, 'dist');

  console.log('Compilando ROMUS Mobile...');
  await fs.mkdir(outDir, { recursive: true });

  // 1. Copy desktop compiled app & worker
  await fs.copyFile(path.join(root, 'dist/app.js'), path.join(outDir, 'app.js'));
  if (await fs.stat(path.join(root, 'dist/app.js.map')).catch(() => false)) {
    await fs.copyFile(path.join(root, 'dist/app.js.map'), path.join(outDir, 'app.js.map'));
  }
  await fs.copyFile(path.join(root, 'dist/search-worker.js'), path.join(outDir, 'search-worker.js'));

  // 2. Copy CSS files
  for (const file of ['engine.css', 'note-page.css', 'refined.css', 'romus.css', 'shell.css']) {
    const srcPath = path.join(root, 'dist', file);
    if (await fs.stat(srcPath).catch(() => false)) {
      await fs.copyFile(srcPath, path.join(outDir, file));
    }
  }

  // 3. Copy assets and PDF.js
  await fs.mkdir(path.join(outDir, 'assets'), { recursive: true });
  await fs.cp(path.join(root, 'dist/assets'), path.join(outDir, 'assets'), { recursive: true });

  await fs.mkdir(path.join(outDir, 'pdfjs'), { recursive: true });
  await fs.cp(path.join(root, 'dist/pdfjs'), path.join(outDir, 'pdfjs'), { recursive: true });

  // 4. Copy mobile-specific files
  const mobileFiles = [
    'index.html',
    'mobile-storage.js',
    'mobile-touch.js',
    'mobile-bridge.js',
    'mobile.css',
    'manifest.webmanifest',
    'sw.js'
  ];

  for (const file of mobileFiles) {
    await fs.copyFile(path.join(mobileDir, file), path.join(outDir, file));
  }

  console.log('✓ ROMUS Mobile compilado com sucesso em mobile/dist/!');
  console.log('  Você pode iniciar o servidor com: node mobile/server.mjs');
})().catch(err => {
  console.error('Falha ao compilar mobile:', err);
  process.exitCode = 1;
});
