// ROMUS Mobile Storage - Complete IndexedDB implementation of atlasNative backend
// Provides full offline persistence, atomic writes, trash bin, attachments, and export/import.

const DB_NAME = 'romus_mobile_vault_v1';
const DB_VERSION = 1;

let dbInstance = null;
const blobUrlCache = new Map();

function openDatabase() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'path' });
      }
      if (!db.objectStoreNames.contains('folders')) {
        db.createObjectStore('folders', { keyPath: 'path' });
      }
      if (!db.objectStoreNames.contains('trash')) {
        db.createObjectStore('trash', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    request.onsuccess = event => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
    request.onerror = event => reject(event.target.error);
  });
}

function normalizePath(p) {
  return String(p || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').split('/')
    .filter(segment => segment && segment !== '.')
    .join('/');
}

export class MobileStorage {
  constructor() {
    this.ready = openDatabase();
  }

  async catalog() {
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['files', 'folders'], 'readonly');
      const filesStore = tx.objectStore('files');
      const foldersStore = tx.objectStore('folders');
      const filesReq = filesStore.getAll();
      const foldersReq = foldersStore.getAll();

      tx.oncomplete = () => {
        const files = (filesReq.result || []).map(f => ({
          path: f.path,
          stat: f.stat || { ctime: Date.now(), mtime: Date.now(), size: (f.content || '').length }
        }));
        const folders = (foldersReq.result || []).map(item => item.path);
        resolve({ files, folders });
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async list() {
    const cat = await this.catalog();
    return cat.files;
  }

  async read(name, binary = false) {
    const norm = normalizePath(name);
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.get(norm);
      req.onsuccess = () => {
        const item = req.result;
        if (!item) return reject(new Error('Arquivo não encontrado: ' + norm));
        if (binary) {
          if (item.isBinary) resolve(item.content);
          else resolve(btoa(unescape(encodeURIComponent(item.content))));
        } else {
          if (item.isBinary) {
            try {
              resolve(decodeURIComponent(escape(atob(item.content))));
            } catch {
              resolve(item.content);
            }
          } else {
            resolve(item.content);
          }
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async write(name, data, binary = false, create = false) {
    const norm = normalizePath(name);
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['files', 'folders'], 'readwrite');
      const store = tx.objectStore('files');
      const folderStore = tx.objectStore('folders');

      const checkReq = store.get(norm);
      checkReq.onsuccess = () => {
        const existing = checkReq.result;
        if (create && existing) {
          return reject(new Error('Arquivo já existe: ' + norm));
        }

        const now = Date.now();
        const stat = {
          ctime: existing?.stat?.ctime || now,
          mtime: now,
          size: binary ? (data.length * 0.75) | 0 : new TextEncoder().encode(data).length
        };

        const record = {
          path: norm,
          content: data,
          isBinary: Boolean(binary),
          stat,
          backup: existing ? existing.content : undefined
        };

        store.put(record);

        // Ensure parent directories exist
        const parts = norm.split('/');
        parts.pop();
        let current = '';
        for (const part of parts) {
          current = current ? current + '/' + part : part;
          folderStore.put({ path: current });
        }

        // Revoke cached blob URL if modified
        if (blobUrlCache.has(norm)) {
          URL.revokeObjectURL(blobUrlCache.get(norm));
          blobUrlCache.delete(norm);
        }
      };

      tx.oncomplete = () => {
        resolve({
          path: norm,
          stat: {
            ctime: Date.now(),
            mtime: Date.now(),
            size: binary ? (data.length * 0.75) | 0 : data.length
          }
        });
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async mkdir(path) {
    const norm = normalizePath(path);
    if (!norm) return;
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('folders', 'readwrite');
      const store = tx.objectStore('folders');
      store.put({ path: norm });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async rename(from, to) {
    const src = normalizePath(from);
    const dest = normalizePath(to);
    const db = await this.ready;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['files', 'folders'], 'readwrite');
      const fileStore = tx.objectStore('files');
      const folderStore = tx.objectStore('folders');

      // Check if it is a single file
      const req = fileStore.get(src);
      req.onsuccess = () => {
        const item = req.result;
        if (item) {
          fileStore.delete(src);
          item.path = dest;
          item.stat = { ...item.stat, mtime: Date.now() };
          fileStore.put(item);

          // Update cached blob URL
          if (blobUrlCache.has(src)) {
            URL.revokeObjectURL(blobUrlCache.get(src));
            blobUrlCache.delete(src);
          }
          return;
        }

        // If not a single file, rename directory prefix
        const allFilesReq = fileStore.getAll();
        allFilesReq.onsuccess = () => {
          const files = allFilesReq.result || [];
          const prefix = src + '/';
          for (const f of files) {
            if (f.path.startsWith(prefix)) {
              fileStore.delete(f.path);
              f.path = dest + '/' + f.path.slice(prefix.length);
              fileStore.put(f);
            }
          }
        };

        folderStore.delete(src);
        folderStore.put({ path: dest });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async trash(name, metadata = {}) {
    const norm = normalizePath(name);
    const db = await this.ready;
    const id = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['files', 'trash'], 'readwrite');
      const fileStore = tx.objectStore('files');
      const trashStore = tx.objectStore('trash');

      const req = fileStore.get(norm);
      req.onsuccess = () => {
        const item = req.result;
        if (!item) return reject(new Error('Item não encontrado para mover à lixeira: ' + norm));

        const entry = {
          id,
          path: norm,
          folder: false,
          backup: Boolean(item.backup),
          kind: metadata.kind || 'note',
          title: metadata.title || norm.split('/').pop().replace(/\.md$/i, ''),
          mediaId: metadata.mediaId || '',
          at: new Date().toISOString(),
          attachments: metadata.attachments || []
        };

        trashStore.put({
          id,
          entry,
          item,
          attachments: []
        });

        fileStore.delete(norm);
        if (blobUrlCache.has(norm)) {
          URL.revokeObjectURL(blobUrlCache.get(norm));
          blobUrlCache.delete(norm);
        }

        resolve(entry);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async trashList() {
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('trash', 'readonly');
      const store = tx.objectStore('trash');
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result || []).map(r => r.entry).sort((a, b) => b.at.localeCompare(a.at));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async restore(id) {
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['files', 'trash'], 'readwrite');
      const fileStore = tx.objectStore('files');
      const trashStore = tx.objectStore('trash');

      const req = trashStore.get(id);
      req.onsuccess = () => {
        const record = req.result;
        if (!record) return reject(new Error('Item não encontrado na lixeira.'));

        fileStore.put(record.item);
        trashStore.delete(id);
        resolve(record.entry);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async purge(id) {
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('trash', 'readwrite');
      const trashStore = tx.objectStore('trash');
      const req = trashStore.get(id);
      req.onsuccess = () => {
        const record = req.result;
        if (!record) return reject(new Error('Item não encontrado na lixeira.'));
        trashStore.delete(id);
        resolve(record.entry);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async getMeta(key, defaultValue = {}) {
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readonly');
      const store = tx.objectStore('meta');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.value ?? defaultValue);
      req.onerror = () => reject(req.error);
    });
  }

  async setMeta(key, value) {
    const db = await this.ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readwrite');
      const store = tx.objectStore('meta');
      store.put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async importAttachment(kind = 'attachment') {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = kind !== 'cover';
      if (kind === 'cover') {
        input.accept = 'image/*';
      } else {
        input.accept = 'image/*,application/pdf,video/*,audio/*';
      }

      input.onchange = async () => {
        try {
          const files = Array.from(input.files || []);
          if (!files.length) return resolve([]);

          const added = [];
          for (const file of files) {
            const uuid = crypto.randomUUID();
            const safeName = file.name.replace(/[<>:"|?*\x00-\x1f]/g, '_');
            const targetPath = `Anexos/${uuid}/${safeName}`;

            const buffer = await file.arrayBuffer();
            let binaryStr = '';
            const bytes = new Uint8Array(buffer);
            const chunkSize = 8192;
            for (let i = 0; i < bytes.length; i += chunkSize) {
              binaryStr += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
            }
            const base64 = btoa(binaryStr);

            await this.write(targetPath, base64, true, true);
            added.push({
              path: targetPath,
              stat: { ctime: Date.now(), mtime: Date.now(), size: file.size }
            });
          }
          resolve(added);
        } catch (error) {
          reject(error);
        }
      };

      input.onerror = () => resolve([]);
      input.click();
    });
  }

  async getResourceUrl(fileOrPath) {
    const path = typeof fileOrPath === 'string' ? normalizePath(fileOrPath) : normalizePath(fileOrPath.path);
    if (blobUrlCache.has(path)) return blobUrlCache.get(path);

    try {
      const db = await this.ready;
      const record = await new Promise((resolve, reject) => {
        const tx = db.transaction('files', 'readonly');
        const req = tx.objectStore('files').get(path);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (!record) return '';

      let blob;
      if (record.isBinary) {
        const byteChars = atob(record.content);
        const byteNumbers = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const ext = path.split('.').pop().toLowerCase();
        const mime = {
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
          svg: 'image/svg+xml', gif: 'image/gif', pdf: 'application/pdf',
          mp4: 'video/mp4', mp3: 'audio/mpeg'
        }[ext] || 'application/octet-stream';
        blob = new Blob([byteNumbers], { type: mime });
      } else {
        blob = new Blob([record.content], { type: 'text/markdown; charset=utf-8' });
      }

      const url = URL.createObjectURL(blob);
      blobUrlCache.set(path, url);
      return url;
    } catch {
      return '';
    }
  }

  async exportVaultZip() {
    const cat = await this.catalog();
    const files = [];
    for (const f of cat.files) {
      try {
        const content = await this.read(f.path, false);
        files.push({ path: f.path, content });
      } catch {}
    }
    const meta = {
      settings: await this.getMeta('settings'),
      propertyTypes: await this.getMeta('property-types'),
      boardOrder: await this.getMeta('board-order')
    };

    const payload = JSON.stringify({ version: '0.3.7-mobile', date: new Date().toISOString(), meta, files }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ROMUS-Mobile-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }

  async importVaultJson(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data.files) throw new Error('Arquivo de backup inválido.');

    if (data.meta?.settings) await this.setMeta('settings', data.meta.settings);
    if (data.meta?.propertyTypes) await this.setMeta('property-types', data.meta.propertyTypes);
    if (data.meta?.boardOrder) await this.setMeta('board-order', data.meta.boardOrder);

    for (const file of data.files) {
      await this.write(file.path, file.content, false, false);
    }
  }

  async seedDemoIfEmpty() {
    const cat = await this.catalog();
    if (cat.files.length > 0) return;

    // Welcome note
    await this.write('Notas/Bem-vindo ao ROMUS Mobile.md', `# Bem-vindo ao ROMUS Mobile

**Whiteboards, notas conectadas, mídias e flashcards com revisão espaçada FSRS.**

O ROMUS foi totalmente otimizado para o seu celular, preservando 100% de todas as funcionalidades da versão de computador:

- **Whiteboards Infinitos:** Navegue pelos seus mapas mentais com toque e gesto de pinça (*pinch-to-zoom*).
- **Notas e Resumos:** Edição rápida em Markdown com TipTap, wikilinks [[Nota]] e marca-texto inteligente.
- **Flashcards com FSRS:** Revisão ativa de alto rendimento com algoritmo espaçado moderno.
- **Quizzes Markdown:** Pratique questões com gabarito automático e explicações integradas.

---

## Como criar flashcards
Basta escrever uma pergunta seguida de == e a resposta:
Qual o principal neurotransmissor inibitório do SNC? == GABA (Ácido gama-aminobutírico)

---

## Teste de Quiz
- [ ] Alternativa A
- [x] Alternativa Correta
- [ ] Alternativa C
Explicação: Esta é uma explicação detalhada em **Markdown**.
`, false, true);

    // Initial whiteboard
    const demoBoard = {
      title: 'Quadro Inicial',
      camera: { x: 0, y: 0, z: 1 },
      nodes: [
        {
          id: 'welcome-card',
          type: 'note',
          title: 'Bem-vindo ao ROMUS Mobile',
          path: 'Notas/Bem-vindo ao ROMUS Mobile.md',
          x: 40,
          y: 40,
          w: 360,
          h: 420,
          color: '#6DB5FF'
        },
        {
          id: 'mind-1',
          type: 'mind',
          title: 'Aprendizado Ativo',
          x: 460,
          y: 80,
          w: 220,
          h: 80,
          color: '#5BE3A1'
        },
        {
          id: 'mind-2',
          type: 'mind',
          title: 'FSRS Spaced Repetition',
          parentId: 'mind-1',
          x: 460,
          y: 200,
          w: 220,
          h: 80,
          color: '#3D8BFF'
        }
      ],
      edges: [
        { from: 'mind-1', to: 'mind-2' }
      ]
    };

    await this.write('Whiteboards/Quadro Inicial.imageboard', JSON.stringify(demoBoard, null, 2), false, true);
    await this.setMeta('settings', { demoOpened: true, notesFolder: 'Notas' });
  }
}
