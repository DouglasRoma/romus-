import {Mark,mergeAttributes} from '@tiptap/core';
import {setIcon} from './compat.js';
import {openColorPalette,closeColorPalette} from './color-palette.js';
import {textPaintAttributes,originalTextColor} from './highlight-color.js';
const safeColor=value=>/^#[a-f\d]{6}$/i.test(value||'')?value:null;
function paintSelection(editor,attribute,value){editor.chain().focus(undefined,{scrollIntoView:false}).command(({tr,state})=>{const type=state.schema.marks.textPaint,{from,to}=state.selection;state.doc.nodesBetween(from,to,(node,pos)=>{if(!node.isText)return;const previous=node.marks.find(mark=>mark.type===type),attrs={...(previous?.attrs||{}),[attribute]:value},start=Math.max(from,pos),end=Math.min(to,pos+node.nodeSize);if(attribute==='background')attrs.autoForeground=value?true:null;else if(attrs.background)attrs.autoForeground=value?false:true;tr.removeMark(start,end,type);if(attrs.color||attrs.background)tr.addMark(start,end,type.create(attrs))});return true}).run()}
export const TextPaint=Mark.create({
 name:'textPaint',
 addAttributes(){return{color:{default:null,parseHTML:originalTextColor},background:{default:null,parseHTML:el=>el.style.backgroundColor||(el.tagName==='MARK'?'#dfbf55':null)},autoForeground:{default:null,parseHTML:el=>el.getAttribute('data-atlas-highlight')==='manual'?false:el.style.backgroundColor||el.tagName==='MARK'?true:null}}},
 parseHTML(){return[{tag:'span[style]',getAttrs:el=>el.style.color||el.style.backgroundColor?{}:false},{tag:'mark'}]},
 renderHTML({HTMLAttributes}){const {color,background,autoForeground,...rest}=HTMLAttributes;return['span',mergeAttributes(rest,textPaintAttributes({color,background,autoForeground})),0]},
 renderMarkdown(node,h){const escape=value=>String(value).replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c])),attrs=textPaintAttributes(node.attrs);return`<span ${Object.entries(attrs).map(([key,value])=>`${key}="${escape(value)}"`).join(' ')}>${h.renderChildren(node)}</span>`}
});
export class SelectionToolbar{
 constructor(owner){
  this.owner=owner;this.editor=owner.editor;this.element=document.body.createDiv({cls:'atlas-selection-toolbar',attr:{role:'toolbar','aria-label':'Formatar seleção'}});this.element.hidden=true;
  const button=(label,icon,action)=>{const el=this.element.createEl('button',{attr:{type:'button',title:label,'aria-label':label}});setIcon(el,icon);el.onpointerdown=event=>event.preventDefault();el.onclick=()=>{action();this.update()};return el};
  this.bold=button('Negrito · Ctrl+B','bold',()=>this.editor.chain().focus().toggleBold().run());
  this.italic=button('Itálico · Ctrl+I','italic',()=>this.editor.chain().focus().toggleItalic().run());
  this.strike=button('Tachado','strikethrough',()=>this.editor.chain().focus().toggleStrike().run());
  this.underline=button('Sublinhado','underline',()=>this.editor.chain().focus().toggleUnderline().run());
  button('Código','code',()=>this.editor.chain().focus().toggleCode().run());
  const block=this.element.createEl('select',{attr:{'aria-label':'Formato do bloco',title:'Formato do bloco'}});
  for(const [value,label]of [['','Formato'],['paragraph','Texto'],['h1','Título 1'],['h2','Título 2'],['h3','Título 3'],['h4','Título 4'],['h5','Título 5'],['h6','Título 6'],['bullet','Lista'],['ordered','Lista numerada'],['task','Lista de tarefas'],['quote','Citação'],['code','Bloco de código']])block.createEl('option',{text:label,attr:{value}});
  block.onchange=()=>{const value=block.value,chain=this.editor.chain().focus();if(/^h[1-6]$/.test(value))chain.toggleHeading({level:Number(value[1])}).run();else({paragraph:()=>chain.setParagraph().run(),bullet:()=>chain.toggleBulletList().run(),ordered:()=>chain.toggleOrderedList().run(),task:()=>chain.toggleTaskList().run(),quote:()=>chain.toggleBlockquote().run(),code:()=>chain.toggleCodeBlock().run()})[value]?.();block.value='';this.update()};
  this.colorInput('Cor da fonte','color','#75b8ff');this.colorInput('Cor de fundo','background','#d9b84a');
  button('Inserir link','link',()=>this.openLink());
  button('Criar ou vincular nota ao lado','file-plus',()=>{const {from,to}=this.editor.state.selection,title=this.editor.state.doc.textBetween(from,to,' ').trim();if(!title)return;this.editor.chain().focus(undefined,{scrollIntoView:false}).setLink({href:'atlas-note:'+encodeURIComponent(title)}).run();this.owner.flushToOwner();this.owner.app.openNoteLink(title,this.owner.owner.file.path).catch(error=>{this.owner.owner.status.textContent=error.message})});
  button('Remover formatação','remove-formatting',()=>this.editor.chain().focus().unsetAllMarks().clearNodes().run());
  this.reposition=()=>this.schedule();owner.host.closest('.atlas-writing-area')?.addEventListener('scroll',this.reposition,{passive:true});window.addEventListener('resize',this.reposition);
  this.outside=event=>{if(!this.element.contains(event.target)&&!owner.host.contains(event.target)&&!event.target.closest('.atlas-common-palette'))this.element.hidden=true};document.addEventListener('pointerdown',this.outside,true);
 }
 colorInput(label,attribute,value){
  const wrapper=this.element.createDiv({cls:'atlas-paint-control'}),button=wrapper.createEl('button',{cls:'atlas-selection-color',attr:{type:'button',title:label+' · aplicar ou remover','aria-label':label,'aria-pressed':'false'}});setIcon(button,attribute==='color'?'baseline':'highlighter');
  const arrow=wrapper.createEl('button',{cls:'atlas-paint-choose',attr:{type:'button',title:'Escolher '+label.toLowerCase(),'aria-label':'Escolher '+label.toLowerCase(),'aria-haspopup':'dialog','aria-expanded':'false'}});setIcon(arrow,'chevron-down');const control={attribute,value,button};(this.paintControls||=[]).push(control);button.style.setProperty('--selection-color',value);
  const apply=(color,toggle=true)=>{const active=this.editor.getAttributes('textPaint')[attribute],next=toggle&&active?null:color;paintSelection(this.editor,attribute,next);control.value=color;button.style.setProperty('--selection-color',color);this.update()};
  button.onpointerdown=arrow.onpointerdown=event=>event.preventDefault();button.onclick=()=>apply(control.value);arrow.onclick=()=>openColorPalette(arrow,{label,value:control.value,onChange:color=>{if(safeColor(color))apply(color,false)},reset:()=>{paintSelection(this.editor,attribute,null);this.update()}});
 }
 schedule(){if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=null;this.update()})}
 openLink(){
  const popup=this.element.createDiv({cls:'atlas-selection-link'}),input=popup.createEl('input',{attr:{placeholder:'https://… ou [[Nome da nota]]','aria-label':'Endereço do link'}});input.value=this.editor.getAttributes('link').href||'';
  const save=popup.createEl('button',{text:'Aplicar'});save.onclick=()=>{let href=input.value.trim();if(/^\[\[.+\]\]$/.test(href))href='atlas-note:'+encodeURIComponent(href.slice(2,-2));if(href)this.editor.chain().focus().setLink({href}).run();else this.editor.chain().focus().unsetLink().run();popup.remove();this.update()};input.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();save.click()}if(event.key==='Escape'){popup.remove();this.editor.commands.focus()}};input.focus();
 }
 update(){
  if(this.element.contains(document.activeElement)||document.activeElement?.closest('.atlas-common-palette'))return;
  const editor=this.editor,{from,to,empty}=editor.state.selection;
  if(empty||!editor.isFocused||this.owner.owner.editorMode!=='formatted'||!this.owner.host.isConnected){this.element.hidden=true;return}
  this.element.hidden=false;this.bold.setAttribute('aria-pressed',String(editor.isActive('bold')));this.italic.setAttribute('aria-pressed',String(editor.isActive('italic')));this.strike.setAttribute('aria-pressed',String(editor.isActive('strike')));this.underline.setAttribute('aria-pressed',String(editor.isActive('underline')));
  for(const control of this.paintControls||[])control.button.setAttribute('aria-pressed',String(!!editor.getAttributes('textPaint')[control.attribute]));
  const start=editor.view.coordsAtPos(from),end=editor.view.coordsAtPos(to),rect=this.element.getBoundingClientRect(),width=Math.min(rect.width,innerWidth-16),height=rect.height;
  const top=start.top-height-10>8?start.top-height-10:end.bottom+10;
  const bounds=this.owner.host.getBoundingClientRect(),leaf=this.owner.host.closest('.workspace-leaf')?.getBoundingClientRect(),right=Math.min(innerWidth-8,(leaf?.right||innerWidth)-8),left=Math.max(8,Math.min(bounds.left,right-width));
  Object.assign(this.element.style,{left:Math.max(left,Math.min((start.left+end.right-width)/2,right-width))+'px',top:Math.max(8,Math.min(top,innerHeight-height-8))+'px'});
 }
 hide(){this.element.hidden=true;closeColorPalette()}
 destroy(){cancelAnimationFrame(this.frame);this.hide();this.element.remove();document.removeEventListener('pointerdown',this.outside,true);window.removeEventListener('resize',this.reposition);this.owner.host.closest('.atlas-writing-area')?.removeEventListener('scroll',this.reposition)}
}
