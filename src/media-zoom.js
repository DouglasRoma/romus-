// Render a denser guest surface, then compensate its geometry. The density is
// independent of the board camera and is never saved as the user's page zoom.
export const webRasterDensity=node=>node.w*node.h<=1_500_000?2:1;
export function applyDocumentZoom(reader){
 if(!reader.ready||!reader.alive||reader.view.mediaPlacing)return;
 try{
  const density=reader.inline?webRasterDensity(reader.node):1,current=reader.frame.getZoomFactor();
  if(reader.zoomGeneration===reader.generation&&reader.rasterDensity===density&&reader.nativePageZoom&&Math.abs(current-reader.nativePageZoom)>.001){reader.node.mediaPageZoom=Math.max(.25,Math.min(5,current/density));reader.view.changed(false)}
  const factor=reader.node.mediaPageZoom||1;
  if(Math.abs(current-factor*density)>.001)reader.frame.setZoomFactor(factor*density);
  reader.pageZoom=factor;reader.nativePageZoom=factor*density;reader.rasterDensity=density;reader.zoomGeneration=reader.generation;
 }catch{/* Guest navigation can temporarily detach the native surface. */}
}
export function placeInlineDocument(view,element,node){
 if(node.type!=='web')return;const scale=view.board.camera.z,host=element.querySelector('.ia-web-card.atlas-media-inline,.ia-web-card.ia-inline-reader');element.style.setProperty('--atlas-media-scale',String(scale));if(!host)return;
 const toolbar=host.querySelector(':scope>.atlas-media-inline-actions,:scope>.ia-reader-toolbar');if(toolbar)toolbar.style.zoom=String(scale);
 // Keep the complete reader at its logical card dimensions. Shrinking only its
 // native surface makes responsive pages reflow and leaves giant text/buttons
 // inside a small card even though getZoomFactor() still reports 100%.
 const content=host.querySelector(':scope>iframe,:scope>.atlas-pdf-inline-mount,:scope>.ia-reader-body');if(!content)return;
 let layout=element._atlasMediaLayout;
 if(!layout||layout.toolbar!==toolbar||layout.content!==content){
  layout?.dispose();layout={toolbar,content,toolbarHeight:toolbar?.offsetHeight||0};element._atlasMediaLayout=layout;
  const observer=toolbar&&new ResizeObserver(entries=>{const height=entries[0]?.borderBoxSize?.[0]?.blockSize;if(!Number.isFinite(height)||Math.abs(height-layout.toolbarHeight)<.25)return;layout.toolbarHeight=height;element._atlasMediaLayoutDirty=true;if(layout.frame)return;layout.frame=requestAnimationFrame(()=>{layout.frame=null;if(element.isConnected){const current=view.nodeById?.get(node.id);if(current)view.place(element,current)}})});
  layout.dispose=()=>{observer?.disconnect();if(layout.frame)cancelAnimationFrame(layout.frame);view.mediaLayouts?.delete(layout)};
  if(!view.mediaLayouts){view.mediaLayouts=new Set();view.register(()=>{for(const item of [...view.mediaLayouts])item.dispose()})}layout.element=element;view.mediaLayouts.add(layout);observer?.observe(toolbar);
 }
 const toolbarHeight=layout.toolbarHeight*scale;element._atlasMediaLayoutDirty=false;element._atlasMediaScale=scale;
 const density=content.classList.contains('ia-reader-body')?webRasterDensity(node):1;
 Object.assign(content.style,{position:'absolute',left:'0',top:toolbarHeight+'px',width:(node.w*density)+'px',height:(Math.max(40,node.h-toolbarHeight/scale)*density)+'px',flex:'none',maxWidth:'none',transformOrigin:'0 0',transform:`scale(${scale/density})`});
 host.style.position='relative';
}
