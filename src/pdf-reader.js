import {getDocument,GlobalWorkerOptions,OutputScale} from 'pdfjs-dist/build/pdf.mjs';
GlobalWorkerOptions.workerSrc=new URL('pdfjs/pdf.worker.min.mjs',document.baseURI).href;
// Increase the PDF backing buffer, without magnifying an already-rendered bitmap.
const surfaces=new Set();
const surfaceScale=host=>host.closest('.ia-web')?._atlasMediaScale||host.closest('.ia-viewport')?._atlasCameraScale||1;
Object.defineProperty(OutputScale,'pixelRatio',{configurable:true,get:()=>Math.max(2,(window.devicePixelRatio||1)*1.5)*Math.max(1,...[...surfaces].filter(host=>host.isConnected).map(surfaceScale))});
const documents=new Map();
function acquire(app,item){
 const file=item.local&&app.vault.getFileByPath(item.source),key=item.source+':'+(file?file.stat.mtime+':'+file.stat.size:'remote');let entry=documents.get(key);
 if(!entry){entry={refs:0,last:Date.now(),key};entry.promise=(async()=>{const bytes=await window.atlasNative.call('media:pdf-data',item.source,!!item.local);const base=new URL('pdfjs/',document.baseURI).href;entry.task=getDocument({data:bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),isEvalSupported:false,useSystemFonts:true,cMapUrl:base+'cmaps/',cMapPacked:true,standardFontDataUrl:base+'standard_fonts/',wasmUrl:base+'wasm/'});entry.doc=await entry.task.promise;return entry.doc})();entry.promise.catch(()=>documents.delete(key));documents.set(key,entry)}
 entry.refs++;entry.last=Date.now();return entry;
}
function release(entry){entry.refs=Math.max(0,entry.refs-1);entry.last=Date.now();const unused=[...documents.values()].filter(value=>!value.refs).sort((a,b)=>b.last-a.last);for(const old of unused.slice(2)){documents.delete(old.key);old.task?.destroy().catch(()=>{})}}
export function mountPdfReader(app,host,item){
 host.empty();host.addClass('atlas-pdf-reader');surfaces.add(host);const abort=new AbortController(),entry=acquire(app,item);let alive=true,viewer,linkService;
 let redrawTimer,lastScale=surfaceScale(host);const stopScale=app.vault.on('media-scale-changed',viewport=>{if(viewport&&!viewport.contains(host))return;const scale=surfaceScale(host);if(Math.abs(scale-lastScale)<.05)return;clearTimeout(redrawTimer);redrawTimer=setTimeout(()=>{lastScale=scale;if(alive)viewer?.refresh()},180)});
 const tools=host.createDiv({cls:'atlas-pdf-tools'}),previous=tools.createEl('button',{text:'‹',attr:{title:'Página anterior','aria-label':'Página anterior do PDF'}}),page=tools.createEl('input',{value:'1',attr:{type:'number',min:'1','aria-label':'Página do PDF'}}),total=tools.createSpan({text:'/ …'}),next=tools.createEl('button',{text:'›',attr:{title:'Próxima página','aria-label':'Próxima página do PDF'}}),zoom=tools.createEl('select',{attr:{'aria-label':'Zoom do PDF'}});
 for(const [value,label]of [['page-width','Ajustar largura'],['page-fit','Página inteira'],['.75','75%'],['1','100%'],['1.25','125%'],['1.5','150%'],['2','200%']])zoom.createEl('option',{text:label,attr:{value}});zoom.value='page-width';
 const status=host.createDiv({cls:'atlas-pdf-status',text:'Carregando PDF…',attr:{role:'status'}}),stage=host.createDiv({cls:'atlas-pdf-stage'}),scroll=stage.createDiv({cls:'atlas-pdf-scroll'}),pages=scroll.createDiv({cls:'pdfViewer'});
 // Splitting a player changes the reading pane, not the document's chosen zoom.
 let fitTimer,lastWidth=scroll.clientWidth;const resize=new ResizeObserver(()=>{const width=scroll.clientWidth;if(width===lastWidth)return;lastWidth=width;clearTimeout(fitTimer);fitTimer=setTimeout(()=>{if(alive&&viewer&&['page-width','page-fit'].includes(zoom.value))viewer.currentScaleValue=zoom.value},70)});resize.observe(scroll);
 previous.onclick=()=>{if(viewer)viewer.currentPageNumber=Math.max(1,viewer.currentPageNumber-1)};next.onclick=()=>{if(viewer)viewer.currentPageNumber=Math.min(viewer.pagesCount,viewer.currentPageNumber+1)};page.onchange=()=>{if(viewer)viewer.currentPageNumber=Math.max(1,Math.min(viewer.pagesCount,Number(page.value)||1))};zoom.onchange=()=>{if(viewer)viewer.currentScaleValue=zoom.value};
 // Wheel reading and PDF shortcuts must not pan or zoom the surrounding board.
 host.addEventListener('wheel',event=>event.stopPropagation(),{passive:true});host.addEventListener('pointerdown',event=>event.stopPropagation());host.addEventListener('keydown',event=>event.stopPropagation());
 Promise.all([entry.promise,import('pdfjs-dist/web/pdf_viewer.mjs')]).then(([doc,lib])=>{
  if(!alive)return;const eventBus=new lib.EventBus();linkService=new lib.PDFLinkService({eventBus,externalLinkTarget:2});viewer=new lib.PDFViewer({container:scroll,viewer:pages,eventBus,linkService,maxCanvasPixels:8_000_000,maxCanvasDim:16384,capCanvasAreaFactor:-1,enableDetailCanvas:true,minDurationToUpdateCanvas:120,removePageBorders:true,annotationMode:1,abortSignal:abort.signal});
  eventBus.on('pagesinit',()=>{if(!alive)return;viewer.currentScaleValue=zoom.value;status.hidden=true;page.max=String(doc.numPages);total.textContent='/ '+doc.numPages;host.dataset.pdfPages=String(doc.numPages)});
  eventBus.on('pagechanging',event=>{if(alive)page.value=String(event.pageNumber)});
  eventBus.on('pagerendered',()=>{if(!alive)return;const canvas=pages.querySelector('canvas');if(canvas){host.dataset.pdfRendered='true';host.dataset.pdfDensity=String(canvas.width/Math.max(1,canvas.getBoundingClientRect().width))}});
  viewer.setDocument(doc);linkService.setViewer(viewer);linkService.setDocument(doc);
 }).catch(error=>{if(alive){status.hidden=false;status.textContent='Não foi possível abrir o PDF: '+error.message}});
 return()=>{if(!alive)return;alive=false;stopScale();resize.disconnect();clearTimeout(fitTimer);clearTimeout(redrawTimer);surfaces.delete(host);abort.abort();viewer?.setDocument(null);linkService?.setDocument(null);release(entry);host.empty();host.removeClass('atlas-pdf-reader')};
}
