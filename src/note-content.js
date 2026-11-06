// Study blocks stay in the Markdown file, outside the ordinary summary editor.
export function splitNoteContent(body){
 const ranges=[];const pattern=/(?:^#{1,6}[ \t]+Flashcards[^\S\r\n]*\r?\n\s*)?<!-- image-atlas-(visual|flashcards|caption):start -->[\s\S]*?<!-- image-atlas-\1:end -->|<!-- image-atlas-fsrs-deck:[^>]*-->|^#{1,6}[ \t]+Flashcards[ \t]*\r?$(?:\n)?/gm;
 for(const match of body.matchAll(pattern))ranges.push({start:match.index,end:match.index+match[0].length,raw:match[0]});
 // Generated navigation footers are retained in the file, outside the summary.
 for(const match of body.matchAll(/(?:^|\n)---[ \t]*\r?\nQuadro:[ \t]*\[\[[^\]\n]*(?:Índice|Indice|índice|indice)[^\]\n]*\]\][ \t]*(?:\r?\n|$)/g))ranges.push({start:match.index,end:match.index+match[0].length,raw:match[0]});
 ranges.sort((a,b)=>a.start-b.start);const protectedRanges=ranges.slice();let protectedIndex=0;
 let offset=0,fence=null,comment=false;
 const lines=body.match(/[^\n]*\n|[^\n]+$/g)||[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i],start=offset;offset+=line.length;
  while(protectedRanges[protectedIndex]?.end<=start)protectedIndex++;
  const protectedRange=protectedRanges[protectedIndex];if(protectedRange&&start>=protectedRange.start&&start<protectedRange.end)continue;
  const trimmed=line.trim(),marker=line.match(/^ {0,3}(`{3,}|~{3,})/);
  if(fence){if(marker&&marker[1][0]===fence[0]&&marker[1].length>=fence.length)fence=null;continue}
  if(marker){fence=marker[1];continue}
  if(comment){if(line.includes('-->'))comment=false;continue}
  if(trimmed.startsWith('<!--')){comment=!line.includes('-->');continue}
  if(!trimmed||/^#{1,6}\s/.test(trimmed))continue;
  const separators=[];let ticks=0;
  for(let j=0;j<line.length;j++){if(line[j]==='\\'){j++;continue}if(line[j]==='`'){let count=1;while(line[j+count]==='`')count++;ticks=ticks===count?0:ticks||count;j+=count-1;continue}if(!ticks&&line.slice(j,j+2)==='=='&&line[j-1]!=='='&&line[j+2]!=='='){separators.push(j);j++}}
  if(separators.length!==1)continue;const position=separators[0];if(!line.slice(0,position).trim()||!line.slice(position+2).trim())continue;
  let raw=line,end=offset;while(i+1<lines.length&&/^(?: {2}|\t)/.test(lines[i+1])&&!(protectedRange&&end>=protectedRange.start&&end<protectedRange.end)){raw+=lines[++i];offset+=lines[i].length;end=offset}ranges.push({start,end,raw});
 }
 ranges.sort((a,b)=>a.start-b.start);let text='',cursor=0;for(const range of ranges){if(range.start<cursor)continue;text+=body.slice(cursor,range.start);cursor=range.end}text+=body.slice(cursor);
 return{text:cleanEditorSpacing(text),managed:ranges.map(range=>range.raw)};
}
export function cleanEditorSpacing(text){let fenced=false;return text.split('\n').map(line=>{if(/^\s*(```|~~~)/.test(line))fenced=!fenced;return!fenced&&/^(?:\s|&nbsp;|&#160;|&#xA0;)*$/i.test(line)?'':line}).join('\n')}
export function mergeNoteContent(text,managed){return cleanEditorSpacing(text).trimEnd()+'\n'+(managed.length?'\n'+managed.map(block=>block.trimEnd()).join('\n\n')+'\n':'')}
export const summaryText=body=>{const {text,managed}=splitNoteContent(body),captions=managed.filter(block=>block.includes('image-atlas-caption:start')).map(block=>block.replace(/<!--[^]*?-->/g,'').trim());return[text,...captions].filter(Boolean).join('\n\n')};
