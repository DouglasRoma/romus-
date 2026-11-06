import {parse as parseYaml,stringify as stringifyYaml} from 'yaml';
import {marked} from 'marked';
import DOMPurify from 'dompurify';
import {icons,createElement} from 'lucide';
import {createColorControl} from './color-palette.js';
import {wireImageActions} from './image-actions.js';
import {noteLinkLabel} from './note-link-label.js';
import {MEDIA_MARKER} from './note-media-format.js';
import {normalizeHighlight} from './highlight-color.js';
export {parseYaml};
export const Platform={isMobile:false,isDesktopApp:true};
export const normalizePath=value=>{const parts=[];for(const p of String(value).replaceAll('\\','/').split('/')){if(!p||p==='.')continue;if(p==='..')parts.pop();else parts.push(p)}return parts.join('/')};
export function installDOM(){
 const p=Element.prototype;
 p.empty=function(){this.replaceChildren()};p.addClass=function(...c){this.classList.add(...c)};p.removeClass=function(...c){this.classList.remove(...c)};p.toggleClass=function(c,v){this.classList.toggle(c,v)};
 p.createEl=function(tag,options={}){if(typeof options==='string')options={cls:options};if(tag==='input'&&(options.type==='color'||options.attr?.type==='color'))return createColorControl(this,options);const el=document.createElement(tag);if(options.cls)el.className=Array.isArray(options.cls)?options.cls.join(' '):options.cls;if(options.text!==undefined)el.textContent=options.text;for(const key of ['type','value','placeholder','title'])if(options[key]!==undefined)el[key]=options[key];for(const [key,value]of Object.entries(options.attr||{}))el.setAttribute(key,String(value));this.append(el);return el};
 p.createDiv=function(options){return this.createEl('div',options)};p.createSpan=function(options){return this.createEl('span',options)};p.setText=function(text){this.textContent=text};
}
export function setIcon(el,name){const key=name.split('-').map(s=>s[0]?.toUpperCase()+s.slice(1)).join('');const data=icons[key];if(data)el.replaceChildren(createElement(data,{width:16,height:16,'aria-hidden':'true'}));else el.textContent='◇'}
export class Notice{constructor(message){const item=document.getElementById('notices').createDiv({cls:'notice',text:String(message)});setTimeout(()=>item.remove(),6500)}}
export class Component{
 constructor(){this.disposers=[];this.children=new Set()}
 register(fn){this.disposers.push(fn);return fn}registerEvent(dispose){if(typeof dispose==='function')this.register(dispose)}
 registerDomEvent(target,type,callback,options){target.addEventListener(type,callback,options);this.register(()=>target.removeEventListener(type,callback,options))}
 registerInterval(id){this.register(()=>clearInterval(id));return id}
 addChild(child){this.children.add(child);child.load();return child}removeChild(child){child.unload();this.children.delete(child)}
 load(){if(this.loaded)return;this.loaded=true;return this.onload?.()}
 unload(){for(const child of this.children)child.unload();this.children.clear();for(const dispose of this.disposers.splice(0).reverse())try{dispose()}catch(e){console.error(e)}this.onunload?.();this.loaded=false}
}
const modalStack=[];
class Scope{constructor(){this.bindings=[]}register(modifiers,key,callback){this.bindings.push({modifiers,key,callback});return callback}}
document.addEventListener('keydown',event=>{
 if(event.defaultPrevented)return;
 const modal=modalStack.at(-1);if(!modal)return;
 const binding=modal.scope.bindings.find(b=>b.key.toLowerCase()===event.key.toLowerCase()&&b.modifiers.includes('Mod')===(event.ctrlKey||event.metaKey)&&b.modifiers.includes('Shift')===event.shiftKey&&b.modifiers.includes('Alt')===event.altKey);
 if(binding&&binding.callback(event)===false){event.preventDefault();event.stopImmediatePropagation();return}
 if(event.key==='Escape'&&!event.defaultPrevented){event.preventDefault();modal.close()}
});
export class Modal{
 constructor(app){this.app=app;this.scope=new Scope();this.containerEl=document.createElement('div');this.containerEl.className='modal-container';this.containerEl.createDiv({cls:'modal-bg'}).onclick=()=>this.close();this.modalEl=this.containerEl.createDiv({cls:'modal'});this.titleEl=this.modalEl.createDiv({cls:'modal-title'});const close=this.modalEl.createEl('button',{cls:'modal-close-button',text:'×',attr:{'aria-label':'Fechar'}});close.onclick=()=>this.close();this.contentEl=this.modalEl.createDiv({cls:'modal-content'})}
 setTitle(text){this.titleEl.textContent=text}open(){this.beforeFocus=document.activeElement;modalStack.push(this);document.body.append(this.containerEl);Promise.resolve(this.onOpen?.()).catch(e=>{console.error(e);new Notice(e.message)});return this}
 mountIn(host){const i=modalStack.indexOf(this);if(i>=0)modalStack.splice(i,1);this.docked=true;this.containerEl.querySelector('.modal-bg')?.remove();this.containerEl.classList.add('atlas-docked-modal');host.append(this.containerEl);return this}
 close(){const i=modalStack.indexOf(this);if(i<0&&!this.docked)return;if(i>=0)modalStack.splice(i,1);this.docked=false;try{Promise.resolve(this.onClose?.()).catch(console.error)}finally{this.containerEl.remove();if(this.beforeFocus?.isConnected)this.beforeFocus.focus({preventScroll:true});window.dispatchEvent(new Event('atlas:modal-closed'))}}
}
export class SuggestModal extends Modal{
 setPlaceholder(text){this.placeholder=text}
 onOpen(){this.inputEl=this.contentEl.createEl('input',{attr:{placeholder:this.placeholder||'Buscar…','aria-label':this.placeholder||'Buscar'}});this.inputEl.className='suggest-input';this.results=this.contentEl.createDiv({cls:'suggest-results'});this.inputEl.oninput=()=>this.update();this.inputEl.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();this.results.querySelector('button')?.click()}};this.update();this.inputEl.focus()}
 update(){this.results.empty();for(const value of this.getSuggestions(this.inputEl.value)){const item=this.results.createEl('button',{cls:'suggest-item'});this.renderSuggestion(value,item);item.onclick=()=>{this.close();this.onChooseSuggestion(value)}}}
}
export class Menu{
 constructor(){this.el=document.createElement('div');this.el.className='context-menu'}
 addItem(fn){const button=this.el.createEl('button');const item={setTitle:text=>{button.textContent=text;return item},setIcon:()=>item,setDisabled:value=>{button.disabled=value;return item},setChecked:value=>{button.setAttribute('aria-checked',value);return item},onClick:callback=>{button.onclick=()=>{this.el.remove();callback()};return item}};fn(item);return this}
 addSeparator(){this.el.createEl('hr');return this}showAtMouseEvent(event){this.showAtPosition({x:event.clientX,y:event.clientY})}
 showAtPosition({x,y}){document.body.append(this.el);this.el.style.left=Math.min(x,innerWidth-280)+'px';this.el.style.top=Math.min(y,innerHeight-this.el.offsetHeight-10)+'px';setTimeout(()=>document.addEventListener('pointerdown',event=>{if(!this.el.contains(event.target))this.el.remove()},{once:true}),0)}
}
export class ItemView extends Component{
 constructor(leaf){super();this.leaf=leaf;this.app=leaf.app;this.containerEl=leaf.containerEl;this.contentEl=this.containerEl.createDiv({cls:'view-content'});this.scope=new Scope()}
 async setState(){}getState(){return{}}getViewType(){return'view'}
}
export class TextFileView extends ItemView{
 requestSave(){clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>this.save().catch(e=>new Notice('Falha ao salvar: '+e.message)),180)}
 async save(){clearTimeout(this.saveTimer);if(this.file&&this.getViewData)await this.app.vault.modify(this.file,this.getViewData())}
 async onClose(){await this.save()}
}
export class Plugin extends Component{
 constructor(app){super();this.app=app}
 loadData(){return window.atlasNative.call('settings:read')}saveData(data){return window.atlasNative.call('settings:write',data)}
 registerView(type,factory){this.app.factories.set(type,factory)}registerExtensions(extensions,type){for(const ext of extensions)this.app.extensions.set(ext,type)}
 registerHoverLinkSource(){}addRibbonIcon(icon,title,run){this.app.ribbon?.(icon,title,run)}addCommand(command){this.app.commands.push(command)}
}
marked.use({extensions:[{name:'wikilink',level:'inline',start:src=>src.search(/!?\[\[/),tokenizer(src){const m=/^(!?)\[\[([^\]\n]+)\]\]/.exec(src);if(m)return{type:'wikilink',raw:m[0],target:m[2],embed:!!m[1]}},renderer(token){const [target,label]=token.target.split('|');const safe=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));return token.embed?`<img data-atlas-resource="${safe(target)}" alt="${safe(label||target)}">`:`<a class="internal-link" data-href="${safe(target)}" href="#">${safe(noteLinkLabel(target,label))}</a>`}}]});
export const MarkdownRenderer={async render(app,text,el,source,component,options={}){
 const clean=String(text).replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'');
 el.innerHTML=DOMPurify.sanitize(marked.parse(clean),{ADD_ATTR:['data-href','data-atlas-resource','style','data-atlas-highlight','data-atlas-original-color'],FORBID_TAGS:['iframe','form','input','script','style']});
 for(const span of el.querySelectorAll('[style],mark')){const color=span.style.color,background=span.style.backgroundColor;span.removeAttribute('style');if(span.tagName==='SPAN'||span.tagName==='MARK'){if(color&&CSS.supports('color',color))span.style.color=color;if(background&&CSS.supports('background-color',background))span.style.backgroundColor=background;normalizeHighlight(span)}}
 let imageIndex=0;for(const img of el.querySelectorAll('img')){const index=imageIndex++;const link=img.dataset.atlasResource||img.getAttribute('src');if(img.title===MEDIA_MARKER&&app.noteMedia){const figure=document.createElement('figure');img.replaceWith(figure);try{component?.register(app.noteMedia.mount(figure,link,{notePath:source,onRemove:options.onRemoveImage?()=>options.onRemoveImage(index):undefined}))}catch(error){figure.textContent=error.message}continue}if(link&&!/^https?:|^data:image\/|^atlas-data:\/\/library\//i.test(link)){const file=app.metadataCache.getFirstLinkpathDest(link,source);if(file)img.src=app.vault.getResourcePath(file);else img.removeAttribute('src')}const caption=document.createElement('figcaption'),figure=document.createElement('figure');figure.className='atlas-note-image';img.replaceWith(figure);figure.append(img,caption);const paint=()=>{caption.textContent=app.images?.forSource(img.src)?.caption||img.title||'';caption.hidden=!caption.textContent};paint();const off=app.vault.on('image-caption-changed',paint);component?.register(off);const actions=wireImageActions(app,figure,img,{notePath:source,caption:()=>img.title||'',onRemove:options.onRemoveImage?()=>options.onRemoveImage(index):undefined});component?.register(actions)}
 for(const a of el.querySelectorAll('a:not(.internal-link)')){const href=a.getAttribute('href');if(href&&!/^[a-z]+:|^#/i.test(href)&&app.metadataCache.getFirstLinkpathDest(href,source)){a.classList.add('internal-link');a.dataset.href=href}}
 const click=event=>{const img=event.target.closest('img');if(img&&app.images){event.preventDefault();app.images.open(img.src,{notePath:source,caption:img.title}).catch(error=>new Notice(error.message));return}const a=event.target.closest('a');if(!a)return;if(a.classList.contains('internal-link')){event.preventDefault();(app.openNoteLink?app.openNoteLink(a.dataset.href,source,event):app.workspace.openLinkText(a.dataset.href,source,event.ctrlKey||event.metaKey))}else if(/^https?:/.test(a.href)){event.preventDefault();window.atlasNative.call('external',a.href)}};
 el.addEventListener('click',click);component?.register(()=>el.removeEventListener('click',click));
}};
export function rewriteFrontmatter(text,fn){const match=/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);const fm=match?parseYaml(match[1])||{}:{};fn(fm);return'---\n'+stringifyYaml(fm,{lineWidth:0})+'---\n'+(match?text.slice(match[0].length):text)}
export class Events{constructor(){this.events=new Map()}on(type,fn){if(!this.events.has(type))this.events.set(type,new Set());this.events.get(type).add(fn);return()=>this.events.get(type)?.delete(fn)}trigger(type,...args){for(const fn of this.events.get(type)||[])try{fn(...args)}catch(e){console.error(e)}}}
export function modalsOpen(){return modalStack.length>0}
