import {marked} from 'marked';

const inlineText=tokens=>(tokens||[]).map(token=>token.tokens?inlineText(token.tokens):token.type==='html'?'':token.type==='br'?' ':token.text||'').join('');
/** Lexer ignores code fences and recognizes both # headings and Setext headings. */
export function markdownHeadings(text){
 const rows=[];
 const walk=(tokens,start)=>{let cursor=start;for(const token of tokens||[]){let at=text.indexOf(token.raw||'\0',cursor);if(at<0)at=token.text?text.indexOf(token.text,cursor):-1;if(at<0)at=cursor;
  if(token.type==='heading')rows.push({level:token.depth,title:inlineText(token.tokens)||token.text||'Sem título',start:text.lastIndexOf('\n',Math.max(0,at-1))+1});
  else if(token.type==='blockquote')walk(token.tokens,at);
  else if(token.type==='list'){let itemAt=at;for(const item of token.items||[]){const found=text.indexOf(item.raw||'\0',itemAt);walk(item.tokens,found<0?itemAt:found);if(found>=0)itemAt=found+item.raw.length}}
  cursor=at+(token.raw?.length||0);
 }};
 walk(marked.lexer(text),0);return rows;
}
export function richHeadings(doc){const rows=[];doc.descendants((node,pos)=>{if(node.type.name==='heading')rows.push({level:node.attrs.level,title:node.textContent||'Sem título',pos});return !node.isTextblock});return rows}
export function headingChange(transaction){
 let changed=false;const check=(doc,from,to)=>{if(changed)return;doc.nodesBetween(Math.max(0,Math.min(from-1,doc.content.size)),Math.max(0,Math.min(to+1,doc.content.size)),node=>{if(node.type.name==='heading')changed=true;return!node.isTextblock})};
 transaction.steps.forEach((step,index)=>{const before=transaction.docs[index],after=transaction.docs[index+1]||transaction.doc;step.getMap().forEach((oldFrom,oldTo,newFrom,newTo)=>{check(before,oldFrom,oldTo);check(after,newFrom,newTo)})});return changed;
}
