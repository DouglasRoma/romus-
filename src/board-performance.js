import {applyDocumentZoom,placeInlineDocument} from './media-zoom.js';

export function installMediaMotion(view){
 const original=view.place.bind(view);
 view.place=(element,node)=>{
  if(node.type!=='web')return original(element,node);
  const camera=view.board.camera,cache=element._atlasWebPlacement;
  if(cache&&cache.node===node&&cache.w===node.w&&cache.h===node.h&&cache.z===camera.z&&cache.head?.isConnected&&cache.resize?.isConnected&&!element._atlasMediaLayoutDirty){
   const dpr=view.contentEl.ownerDocument.defaultView.devicePixelRatio||1;
   element.style.left=Math.round((camera.x+node.x*camera.z)*dpr)/dpr+'px';element.style.top=Math.round((camera.y+node.y*camera.z)*dpr)/dpr+'px';return;
  }
  view.mediaPlacing=true;
  try{original(element,node);placeInlineDocument(view,element,node)}finally{view.mediaPlacing=false}
  element._atlasWebPlacement={node,w:node.w,h:node.h,z:camera.z,head:element.querySelector('.ia-card-head'),resize:element.querySelector('.ia-resize')};
 };
 // Native guest zoom never depends on the camera. Check it once after a gesture,
 // rather than crossing the browser-process boundary for every animation frame.
 view.checkMediaZoomAfterMotion=()=>{clearTimeout(view.mediaZoomCheck);if(!view.webSessions?.size)return;view.mediaZoomCheck=setTimeout(()=>{if(!view.viewport?.isConnected||view.boardMotionActive||view.drag)return;for(const session of view.webSessions.values())if(session.reader&&!session.reader.atlasMediaInline)applyDocumentZoom(session.reader)},180)};
 view.register(()=>clearTimeout(view.mediaZoomCheck));
}

export function memoizeReaderRefresh(reader){
 if(reader.atlasRefreshMemoized)return;reader.atlasRefreshMemoized=true;
 queueMicrotask(()=>{if(!reader.alive||!reader.inline)return;const element=reader.view.nodeElements?.get(reader.node.id);if(element){element._atlasMediaLayoutDirty=true;reader.view.place(element,reader.node)}reader.view.onMediaReaderMounted?.(reader)});
 reader.frame.addEventListener('did-navigate-in-page',()=>{reader.atlasRefreshKey=null;reader.refresh()});
 const refresh=reader.refresh.bind(reader);
 reader.refresh=()=>{
  if(!reader.alive||!reader.ready)return Promise.resolve();
  const key=JSON.stringify([reader.generation,reader.marking,reader.node.pins]);
  if(key===reader.atlasRefreshKey)return reader.atlasRefreshJob||Promise.resolve();
  reader.atlasRefreshKey=key;const job=reader.atlasRefreshJob=Promise.resolve(refresh());
  job.catch(()=>{if(reader.atlasRefreshJob===job)reader.atlasRefreshKey=null});return job;
 };
}
