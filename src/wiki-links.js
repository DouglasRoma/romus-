const fold = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

/** Local note index only: typing never reads note bodies or touches review data. */
export function attachWikiLinks(editor) {
  const { input, app } = editor, doc = input.ownerDocument, win = doc.defaultView;
  let menu, match, items = [], selected = 0, index = null, busy = false, mirror;
  const close = () => {
    menu?.remove(); menu = null; match = null; mirror?.remove(); mirror = null;
    input.removeAttribute('aria-activedescendant'); input.setAttribute('aria-expanded', 'false');
  };
  const invalidate = () => { index = null; };
  const disposers = ['create', 'rename', 'delete','note-catalog-changed'].map(type => app.vault.on(type, invalidate));
  function position() {
    if (!menu) return;
    mirror?.remove(); mirror = doc.createElement('div');
    const style = win.getComputedStyle(input), rect = input.getBoundingClientRect();
    Object.assign(mirror.style, { position:'fixed', visibility:'hidden', left:'0', top:'0', width:rect.width+'px', whiteSpace:'pre-wrap', overflowWrap:'break-word', boxSizing:'border-box' });
    for (const key of ['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','paddingTop','paddingRight','paddingBottom','paddingLeft','borderWidth','tabSize']) mirror.style[key] = style[key];
    mirror.textContent = input.value.slice(0,input.selectionStart); const caret = doc.createElement('span'); caret.textContent = '\u200b'; mirror.append(caret); doc.body.append(mirror);
    const marker = caret.getBoundingClientRect(), base = mirror.getBoundingClientRect();
    const x = rect.left + marker.left - base.left - input.scrollLeft, y = rect.top + marker.top - base.top - input.scrollTop;
    const width = Math.min(410, win.innerWidth - 24), height = Math.min(300, menu.scrollHeight || 300), line = parseFloat(style.lineHeight) || 26;
    const top = y + line + height + 12 > win.innerHeight ? Math.max(8,y-height-6) : y+line+6;
    Object.assign(menu.style, { width:width+'px', left:Math.max(12,Math.min(x,win.innerWidth-width-12))+'px', top:Math.max(8,Math.min(top,win.innerHeight-height-8))+'px' });
    mirror.remove(); mirror = null;
  }
  function highlight() {
    [...menu.querySelectorAll('[role=option]')].forEach((el,i) => { el.setAttribute('aria-selected',String(i===selected)); if(i===selected) { input.setAttribute('aria-activedescendant',el.id); el.scrollIntoView({block:'nearest'}); } });
  }
  async function choose(i) {
    if (busy || !match || !items[i]) return;
    const chosen = items[i], insertion = { ...match }; busy = true;
    try {
      let file = chosen.file;
      if (!file) {
        const name = chosen.title.replace(/[\\/:*?"<>|#\[\]\r\n]/g,' ').replace(/\s+/g,' ').trim().slice(0,100);
        if (!name) return;
        const folder = editor.file.path.split('/').slice(0,-1).join('/');
        const path = (folder ? folder+'/' : '')+name+'.md';
        file = app.vault.getFileByPath(path) || await app.vault.create(path,'# '+name+'\n\n');
      }
      // Do not insert into a note that was closed/replaced during an async create.
      if (!input.isConnected || input.selectionStart !== insertion.end || input.value.slice(insertion.start,insertion.end) !== insertion.raw) return;
      const end = input.value.slice(insertion.end).startsWith(']]') ? insertion.end+2 : insertion.end;
      const target = app.metadataCache.fileToLinktext(file,editor.file.path,true);
      close(); input.setRangeText(`[[${target}]]`,insertion.start,end,'end'); input.focus({preventScroll:true});
      input.dispatchEvent(new Event('input',{bubbles:true}));
    } catch(error) { editor.status.textContent = error.message; }
    finally { busy = false; }
  }
  function update() {
    if (busy || input.selectionStart !== input.selectionEnd || input.hidden) return close();
    const before = input.value.slice(Math.max(0,input.selectionStart-250),input.selectionStart), found = before.match(/\[\[([^\[\]\n|]*)$/);
    if (!found) return close();
    const query = found[1].trim(), tokens = fold(query).split(/\s+/).filter(Boolean);
    index ||= (app.getLinkableNotes?.()||app.getMainNotes()).map(file => ({file,title:file.basename,key:fold(file.basename+' '+file.path)}));
    items = index.filter(item => tokens.every(token=>item.key.includes(token))).sort((a,b)=>Number(fold(b.title)===fold(query))-Number(fold(a.title)===fold(query)) || Number(fold(b.title).startsWith(fold(query)))-Number(fold(a.title).startsWith(fold(query))) || a.title.localeCompare(b.title)).slice(0,10);
    if (query && !index.some(item=>fold(item.title)===fold(query)||fold(item.file.path.replace(/\.md$/i,''))===fold(query))) items.push({title:query,create:true});
    close(); if (!items.length) return;
    match = {start:input.selectionStart-found[0].length,end:input.selectionStart,raw:found[0]}; selected=0;
    menu = doc.body.createDiv({cls:'atlas-note-link-menu',attr:{id:'atlas-note-link-options',role:'listbox','aria-label':'Vincular nota'}});
    menu.createDiv({cls:'atlas-link-heading',text:'VINCULAR UMA NOTA'});
    items.forEach((item,i)=>{
      const button = menu.createEl('button',{attr:{type:'button',role:'option',id:'atlas-note-link-option-'+i,'aria-selected':String(i===0)}});
      button.createSpan({cls:'atlas-link-icon',text:item.create?'+':'↗'});
      const label = button.createDiv(); label.createEl('strong',{text:item.create?`Criar nota “${item.title}”`:item.title}); label.createSpan({text:item.file?(app.displayNoteFolder(item.file)||'Nota'):'Criar e vincular sem sair deste texto'});
      button.onpointerdown = event=>{event.preventDefault();choose(i)};
    });
    menu.createDiv({cls:'atlas-link-footer',text:'↑ ↓ selecionar · Enter vincular · Esc fechar'});
    input.setAttribute('aria-controls','atlas-note-link-options'); input.setAttribute('aria-expanded','true'); position();
  }
  const key = event => {
    if (!menu || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (!['ArrowUp','ArrowDown','Enter','Tab','Escape'].includes(event.key)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.key==='Escape') close();
    else if (event.key==='Enter'||event.key==='Tab') choose(selected);
    else { selected=(selected+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;highlight(); }
  };
  const follow=event=>{if(!event.ctrlKey&&!event.metaKey&&!event.shiftKey)return;const at=input.selectionStart;for(const match of input.value.matchAll(/\[\[([^\]\n]+)\]\]/g))if(at>=match.index&&at<=match.index+match[0].length){event.preventDefault();app.openNoteLink(match[1],editor.file.path,event).catch(error=>{editor.status.textContent=error.message});break}};
  input.addEventListener('click',follow);
  const outside = event => {if(event.target!==input&&!menu?.contains(event.target))close()};
  input.addEventListener('blur',close); input.addEventListener('input',update); input.addEventListener('click',update); input.addEventListener('keyup',eventKeyUp);
  function eventKeyUp(event){if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key))update()}
  input.addEventListener('keydown',key,true); input.addEventListener('scroll',position); win.addEventListener('resize',position); doc.addEventListener('pointerdown',outside,true);
  return { close, dispose(){close();input.removeEventListener('click',follow);input.removeEventListener('blur',close);for(const dispose of disposers)dispose();input.removeEventListener('input',update);input.removeEventListener('click',update);input.removeEventListener('keyup',eventKeyUp);input.removeEventListener('keydown',key,true);input.removeEventListener('scroll',position);win.removeEventListener('resize',position);doc.removeEventListener('pointerdown',outside,true)} };
}
