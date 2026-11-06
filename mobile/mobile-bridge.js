// ROMUS Mobile Bridge - Initializer that sets up atlasNative, touch gestures,
// bottom navigation bar, mobile drawer and desktop sync.

import { MobileStorage } from './mobile-storage.js';
import { installMobileTouch } from './mobile-touch.js';

// 1. Browser & Process Shim
window.process = window.process || { env: {}, versions: { chrome: '140' } };

export const storage = new MobileStorage();

// 2. Complete atlasNative Facade Implementation
window.atlasNative = {
  call: async (operation, ...args) => {
    switch (operation) {
      case 'catalog':
        return storage.catalog();
      case 'list':
        return storage.list();
      case 'read':
        return storage.read(args[0], Boolean(args[1]));
      case 'write':
        return storage.write(args[0], args[1], Boolean(args[2]), Boolean(args[3]));
      case 'mkdir':
        return storage.mkdir(args[0]);
      case 'rename':
        return storage.rename(args[0], args[1]);
      case 'trash':
        return storage.trash(args[0], args[1]);
      case 'trash:list':
        return storage.trashList();
      case 'trash:restore':
        return storage.restore(args[0]);
      case 'trash:purge':
        return storage.purge(args[0]);
      case 'settings:read':
        return storage.getMeta('settings', { demoOpened: true, notesFolder: 'Notas' });
      case 'settings:write':
        return storage.setMeta('settings', args[0]);
      case 'property-types:read':
        return storage.getMeta('property-types', {});
      case 'property-types:write':
        return storage.setMeta('property-types', args[0]);
      case 'board-order:read':
        return storage.getMeta('board-order', {});
      case 'info':
        return {
          version: '0.3.7-mobile',
          library: 'ROMUS Mobile Vault (IndexedDB)',
          playerOrigin: window.location.origin
        };
      case 'window:theme':
        document.documentElement.dataset.theme = args[0];
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', args[0] === 'light' ? '#f5f7fa' : '#0d0d0d');
        return;
      case 'attachment:import':
        return storage.importAttachment(args[0]);
      case 'attachment:reveal':
        return;
      case 'media:pdf-data':
        return fetchPdfData(args[0], args[1]);
      case 'media:metadata':
        return fetchMediaMetadata(args[0]);
      case 'external':
        window.open(args[0], '_blank');
        return;
      case 'import':
        return openImportDialog();
      case 'export':
        return storage.exportVaultZip();
      default:
        console.warn('Operação mobile não tratada:', operation, args);
        return null;
    }
  },
  getResourceUrl: fileOrPath => storage.getResourceUrl(fileOrPath),
  onMediaTab: () => {},
  onMediaPreview: () => {},
  onClosing: () => {},
  onUpdate: () => {},
  restartDevelopment: () => window.location.reload(),
  readyToClose: () => {}
};

async function fetchPdfData(source, isLocal) {
  if (isLocal) {
    const base64 = await storage.read(source, true);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  const response = await fetch(source);
  return new Uint8Array(await response.arrayBuffer());
}

async function fetchMediaMetadata(urlStr) {
  try {
    const url = new URL(urlStr);
    let endpoint = '';
    if (['www.youtube.com', 'youtube.com', 'youtu.be', 'm.youtube.com'].includes(url.hostname)) {
      endpoint = 'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(url.href);
    } else if (url.hostname === 'open.spotify.com') {
      endpoint = 'https://open.spotify.com/oembed?url=' + encodeURIComponent(url.href);
    } else {
      return null;
    }
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: (data.title || '').slice(0, 400),
      thumbnail: (data.thumbnail_url || '').slice(0, 2048)
    };
  } catch {
    return null;
  }
}

function openImportDialog() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.zip';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(false);
      try {
        const text = await file.text();
        await storage.importVaultJson(text);
        window.location.reload();
        resolve(true);
      } catch (err) {
        alert('Erro ao importar cofre: ' + err.message);
        resolve(false);
      }
    };
    input.click();
  });
}

// 3. UI Injections (Bottom Bar, Drawer Backdrop, FAB)
function setupMobileUI() {
  // Backdrop for drawer
  const backdrop = document.createElement('div');
  backdrop.id = 'mobile-drawer-backdrop';
  backdrop.onclick = () => document.body.classList.remove('mobile-drawer-open');
  document.body.append(backdrop);

  // Bottom Navigation Bar
  const bottomBar = document.createElement('nav');
  bottomBar.id = 'mobile-bottom-bar';
  bottomBar.setAttribute('aria-label', 'Navegação principal');

  bottomBar.innerHTML = `
    <button type="button" class="mobile-nav-item active" data-nav="board" title="Whiteboard">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
      <span>Quadro</span>
    </button>
    <button type="button" class="mobile-nav-item" data-nav="note" title="Nota atual">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
      <span>Nota</span>
    </button>
    <button type="button" class="mobile-nav-item" data-nav="review" title="Flashcards FSRS">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      <span>Revisão</span>
    </button>
    <button type="button" class="mobile-nav-item" data-nav="search" title="Buscar no conteúdo (Ctrl+O)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
      <span>Busca</span>
    </button>
    <button type="button" class="mobile-nav-item" data-nav="menu" title="Menu e Arquivos">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      <span>Menu</span>
    </button>
  `;
  document.body.append(bottomBar);

  bottomBar.addEventListener('click', e => {
    const btn = e.target.closest('.mobile-nav-item');
    if (!btn) return;

    const action = btn.dataset.nav;
    document.querySelectorAll('.mobile-nav-item').forEach(b => b.classList.toggle('active', b === btn));
    document.body.classList.remove('mobile-drawer-open');

    const app = window.atlasApp;
    if (!app) return;

    switch (action) {
      case 'board': {
        const boardLeaf = app.workspace.leaves.find(l => l.view?.board);
        if (boardLeaf) {
          app.workspace.revealLeaf(boardLeaf);
        } else {
          const firstBoard = app.vault.getFiles().find(f => f.extension === 'imageboard');
          if (firstBoard) app.workspace.getLeaf('tab').openFile(firstBoard);
        }
        break;
      }
      case 'note': {
        const noteLeaf = app.workspace.leaves.find(l => l.view?.file?.extension === 'md');
        if (noteLeaf) {
          app.workspace.revealLeaf(noteLeaf);
        } else {
          const firstNote = app.vault.getMarkdownFiles()[0];
          if (firstNote) app.workspace.getLeaf('tab').openFile(firstNote);
        }
        break;
      }
      case 'review': {
        const activeFile = app.workspace.getActiveFile();
        if (activeFile) {
          app.commands.find(c => c.id === 'study-active-note')?.callback?.() ||
          app.commands.find(c => c.id === 'edit-note-flashcards')?.callback?.();
        } else {
          app.openOmniSearch?.();
        }
        break;
      }
      case 'search': {
        app.openOmniSearch?.();
        break;
      }
      case 'menu': {
        document.body.classList.toggle('mobile-drawer-open');
        break;
      }
    }
  });

  // Floating Action Button (+)
  const fab = document.createElement('button');
  fab.id = 'mobile-fab';
  fab.setAttribute('aria-label', 'Ações rápidas');
  fab.innerHTML = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
  document.body.append(fab);

  fab.onclick = () => {
    const menu = document.createElement('div');
    menu.className = 'modal-container';
    menu.innerHTML = `
      <div class="modal-bg"></div>
      <div class="modal" style="padding: 16px;">
        <h3 style="margin-top:0; margin-bottom: 12px; font-size: 17px;">Criar ou Sincronizar</h3>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <button id="fab-new-note" style="padding:12px; font-size:15px; text-align:left; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:#202228; color:#fff;">📝 Nova Nota</button>
          <button id="fab-new-board" style="padding:12px; font-size:15px; text-align:left; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:#202228; color:#fff;">🗺️ Novo Whiteboard</button>
          <button id="fab-sync-pc" style="padding:12px; font-size:15px; text-align:left; border-radius:8px; border:1px solid rgba(109,181,255,0.3); background:#182536; color:#6DB5FF;">📥 Baixar Notas do Computador (Sync Wi-Fi)</button>
          <button id="fab-backup" style="padding:12px; font-size:15px; text-align:left; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:#202228; color:#a1a9b5;">💾 Exportar Backup das Notas (JSON)</button>
          <button id="fab-import" style="padding:12px; font-size:15px; text-align:left; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:#202228; color:#a1a9b5;">📂 Importar Backup</button>
        </div>
      </div>
    `;
    document.body.append(menu);
    menu.querySelector('.modal-bg').onclick = () => menu.remove();

    menu.querySelector('#fab-new-note').onclick = () => {
      menu.remove();
      window.atlasApp?.createNote?.();
    };

    menu.querySelector('#fab-new-board').onclick = async () => {
      menu.remove();
      const title = prompt('Nome do novo whiteboard:', 'Novo Quadro');
      if (!title) return;
      const file = await window.atlasPlugin?.createBoardFile(title);
      if (file) window.atlasApp?.workspace.getLeaf('tab').openFile(file);
    };

    menu.querySelector('#fab-sync-pc').onclick = async () => {
      menu.remove();
      syncWithDesktop();
    };

    menu.querySelector('#fab-backup').onclick = () => {
      menu.remove();
      storage.exportVaultZip();
    };

    menu.querySelector('#fab-import').onclick = () => {
      menu.remove();
      openImportDialog();
    };
  };
}

async function syncWithDesktop() {
  const serverUrl = window.location.origin;
  try {
    const res = await fetch(`${serverUrl}/api/vault/backup`);
    if (!res.ok) throw new Error('Servidor de sync não respondeu. Certifique-se de que o servidor mobile está rodando no PC.');
    const data = await res.json();
    if (!data.files || !data.files.length) {
      alert('Nenhum arquivo encontrado no computador para sincronizar.');
      return;
    }
    const proceed = confirm(`Encontrados ${data.files.length} arquivos no computador. Deseja carregar no celular?`);
    if (!proceed) return;

    for (const f of data.files) {
      await storage.write(f.path, f.content, Boolean(f.isBinary), false);
    }
    alert('Sincronização concluída com sucesso! Recarregando...');
    window.location.reload();
  } catch (err) {
    alert('Falha na sincronização: ' + err.message);
  }
}

// 4. Initialization sequence
(async () => {
  await storage.ready;
  await storage.seedDemoIfEmpty();

  // Watch for app creation to patch getResourcePath and install touch
  const interval = setInterval(() => {
    if (window.atlasApp && window.atlasApp.vault) {
      clearInterval(interval);

      // Override getResourcePath to use blob URLs
      window.atlasApp.vault.getResourcePath = (file) => storage.getResourceUrl(file);

      // Install mobile touch engine
      installMobileTouch(window.atlasApp);
    }
  }, 100);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMobileUI);
  } else {
    setupMobileUI();
  }
})();
