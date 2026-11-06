import {Notice,setIcon} from './compat.js';

// One compact navigation shell; the existing file tree and actions stay intact.
export function installSidebar(app,actions){
 const library=document.getElementById('library');library.setAttribute('aria-label','Navegação da biblioteca');
 let popup,anchor,disposePopup;
 const close=(restore=false)=>{if(!popup)return;popup.remove();popup=null;disposePopup?.();disposePopup=null;anchor?.setAttribute('aria-expanded','false');if(restore&&anchor?.isConnected)anchor.focus()};
 const action=(host,label,icon,callback,cls='')=>{const button=host.createEl('button',{cls,attr:{type:'button',title:label,'aria-label':label}});setIcon(button.createSpan(),icon);button.createSpan({text:label});button.onclick=()=>Promise.resolve().then(callback).catch(error=>new Notice(error.message));return button};
 const showMenu=(button,title,groups)=>{
  if(anchor===button&&popup){close(true);return}close();anchor=button;button.setAttribute('aria-expanded','true');
  popup=document.body.createDiv({cls:'atlas-sidebar-popover',attr:{role:'menu','aria-label':title}});popup.createDiv({cls:'atlas-sidebar-menu-caption',text:title});
  groups.forEach((group,index)=>{if(index)popup.createEl('hr');for(const [label,icon,callback,shortcut]of group){const item=action(popup,label,icon,()=>{close();return callback()});item.setAttribute('role','menuitem');if(shortcut)item.createEl('kbd',{text:shortcut})}});
  const rect=button.getBoundingClientRect(),height=popup.offsetHeight,width=Math.min(280,innerWidth-24);Object.assign(popup.style,{width:width+'px',left:Math.max(12,Math.min(rect.left,innerWidth-width-12))+'px',top:Math.max(12,rect.bottom+height+8>innerHeight?rect.top-height-8:rect.bottom+8)+'px'});
  const outside=event=>{if(!popup?.contains(event.target)&&!button.contains(event.target))close()};
  const key=event=>{if(!popup)return;const items=[...popup.querySelectorAll('button')],index=items.indexOf(document.activeElement);if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true)}else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();items[event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus()}else if(event.key==='Tab')close(true)};
  const resize=()=>close();document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',key,true);window.addEventListener('resize',resize);disposePopup=()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',key,true);window.removeEventListener('resize',resize)};popup.querySelector('button')?.focus();
 };
 const header=library.querySelector('header');header.empty();const brand=header.createDiv({cls:'atlas-workspace-brand romus-brand'});
 brand.createEl('img',{cls:'romus-logo-on-dark',attr:{src:'assets/brand/romus-horizontal.svg',alt:'ROMUS',width:'141',height:'34'}});
 brand.createEl('img',{cls:'romus-logo-on-light',attr:{src:'assets/brand/romus-horizontal-dark.svg',alt:'ROMUS',width:'141',height:'34'}});
 brand.createSpan({text:'Ideias conectadas. Conhecimento vivo.'});
 const collapse=action(header,'Recolher barra lateral','panel-left-close',()=>{close();app.toggleSidebar(false)},'atlas-sidebar-collapse');
 const quick=library.createDiv({cls:'atlas-sidebar-quick'});header.after(quick);
 const search=action(quick,'Buscar','search',actions.search,'atlas-sidebar-search');search.title='Buscar notas e quadros · Ctrl+O';search.createEl('kbd',{text:'Ctrl O'});
 const create=action(quick,'Criar','plus',()=>showMenu(create,'CRIAR NA BIBLIOTECA',[[['Nova nota','file-plus',actions.newNote],['Novo whiteboard','panels-top-left',actions.newBoard],['Nova pasta','folder-plus',()=>app.createFolder()]]]),'atlas-sidebar-create');create.setAttribute('aria-haspopup','menu');create.setAttribute('aria-expanded','false');
 const nav=document.getElementById('primary-actions');nav.empty();nav.setAttribute('aria-label','Bibliotecas');
 for(const [label,icon,callback,type]of [['Biblioteca de notas','files',actions.notes,'atlas-notes-library'],['Biblioteca de mídia','clapperboard',actions.media,'atlas-media-library'],['Revisões de hoje','layers',actions.reviews,'image-atlas-flashcards']]){const item=action(nav,label,icon,callback);item.dataset.sidebarView=type}
 const explorer=library.createDiv({cls:'atlas-sidebar-explorer'});nav.after(explorer);const explorerHead=explorer.createDiv({cls:'atlas-explorer-heading'});explorerHead.createSpan({text:'EXPLORAR'});action(explorerHead,'Buscar nos mapas','scan-search',actions.maps,'atlas-sidebar-map-search');
 const filter= document.getElementById('file-search'),filterHost=explorer.createDiv({cls:'atlas-sidebar-filter'});setIcon(filterHost.createSpan(),'search');filter.placeholder='Filtrar quadros e recentes…';filterHost.append(filter);
 const files=document.getElementById('files');files.setAttribute('aria-label','Quadros e notas recentes');explorer.append(files);
 const footer=document.getElementById('library-footer');footer.empty();const space=footer.createEl('button',{cls:'atlas-workspace-menu',attr:{type:'button','aria-label':'Opções da biblioteca','aria-haspopup':'menu','aria-expanded':'false'}});const avatar=space.createSpan({cls:'atlas-workspace-avatar'});avatar.createEl('img',{attr:{src:'assets/brand/romus-icon.svg',alt:'',width:'25',height:'15'}});const info=space.createSpan({cls:'atlas-workspace-info'});info.createEl('strong',{text:'Biblioteca local'});info.createEl('small',{cls:'atlas-library-overview',text:'Neste computador'});setIcon(space.createSpan({cls:'atlas-workspace-options'}),'ellipsis');
 space.onclick=()=>showMenu(space,'SEU ESPAÇO',[
  [['Configurações','settings',actions.settings],['Alternar tema','sun-moon',actions.theme],['Lixeira','trash-2',actions.trash]],
  [['Importar biblioteca','folder-input',actions.import],['Exportar cópia','download',actions.export]],
  [['Comandos','command',actions.commands,'Ctrl P']]
 ]);
 // Width changes affect only this shell, never the whiteboard camera.
 const resize=library.createDiv({cls:'atlas-sidebar-resizer',attr:{role:'separator','aria-label':'Largura da barra lateral','aria-orientation':'vertical',tabindex:'0','aria-valuemin':'240','aria-valuemax':'400'}});
 const width=value=>{value=Math.max(240,Math.min(400,Number(value)||272));library.style.setProperty('--atlas-sidebar-width',value+'px');resize.setAttribute('aria-valuenow',String(value));return value};
 width(app.preferences.sidebarWidth);const persist=value=>{app.preferences.sidebarWidth=value;localStorage.setItem('atlas:preferences',JSON.stringify(app.preferences))};
 resize.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();persist(width(event.key==='Home'?240:event.key==='End'?400:Number(resize.getAttribute('aria-valuenow'))+(event.key==='ArrowRight'?16:-16)))};
 resize.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();close();const start=event.clientX,initial=library.offsetWidth;resize.setPointerCapture(event.pointerId);document.body.classList.add('atlas-resizing-sidebar');const move=event=>width(initial+event.clientX-start),end=()=>{resize.removeEventListener('pointermove',move);resize.removeEventListener('pointerup',end);resize.removeEventListener('pointercancel',end);resize.removeEventListener('lostpointercapture',end);document.body.classList.remove('atlas-resizing-sidebar');persist(Number(resize.getAttribute('aria-valuenow')))};resize.addEventListener('pointermove',move);resize.addEventListener('pointerup',end);resize.addEventListener('pointercancel',end);resize.addEventListener('lostpointercapture',end)};
 return{close};
}
