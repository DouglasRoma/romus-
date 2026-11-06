import {marked} from 'marked';
import {mediaSource} from './media-source.js';
export const MEDIA_MARKER='atlas-media';
export function mediaMarkdown(source,title='Mídia incorporada'){
 return `![${String(title).replace(/[\[\]\r\n]/g,' ')}](<${source}> "${MEDIA_MARKER}")`;
}
export function firstNoteMedia(text){
 if(!text?.includes(MEDIA_MARKER))return null;
 let found=null;marked.walkTokens(marked.lexer(text),token=>{if(!found&&token.type==='image'&&token.title===MEDIA_MARKER){const parsed=mediaSource(token.href);if(parsed)found={...parsed,label:token.text,raw:token.raw}}});return found;
}
