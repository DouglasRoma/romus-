function surface(owner,mode=owner.editorMode){return mode==='source'?owner.sourceInput:owner.pageScrollElement||(mode==='preview'?owner.rendered:owner.writingArea)}
function blocks(owner){return [...(owner.editorMode==='formatted'?owner.richHost.querySelector('.tiptap'):owner.rendered)?.children||[]]}
export function captureReadingPosition(owner){
 if(!owner.editorMode)return null;const root=surface(owner),ratio=root.scrollTop/Math.max(1,root.scrollHeight-root.clientHeight);
 if(owner.editorMode==='source')return{ratio};
 const items=blocks(owner),top=root.getBoundingClientRect().top;let lo=0,hi=items.length-1,index=0;while(lo<=hi){const mid=(lo+hi)>>1;if(items[mid].getBoundingClientRect().bottom>top+2){index=mid;hi=mid-1}else lo=mid+1}const element=items[index];if(!element)return{ratio};const rect=element.getBoundingClientRect();return{ratio,index,text:(element.textContent||'').slice(0,100),fraction:(top-rect.top)/Math.max(1,rect.height)};
}
export function restoreReadingPosition(owner,position,{focus=false}={}){
 const root=surface(owner);if(!root)return;
 if(owner.editorMode==='source'){if(focus){let at=position?.text?root.value.indexOf(position.text):-1;if(at<0)at=Math.round((position?.ratio||0)*root.value.length);root.setSelectionRange(at,at);root.focus({preventScroll:true})}root.scrollTop=(position?.ratio||0)*Math.max(0,root.scrollHeight-root.clientHeight);return}
 const items=blocks(owner);let index=Math.min(position?.index||0,Math.max(0,items.length-1));if(position?.text&&items[index]?.textContent?.slice(0,100)!==position.text){const found=items.findIndex((item,i)=>Math.abs(i-index)<6&&(item.textContent||'').slice(0,100)===position.text);if(found>=0)index=found}const element=items[index];
 if(element&&position?.index!==undefined){const rect=element.getBoundingClientRect();root.scrollTop=Math.max(0,root.scrollTop+rect.top-root.getBoundingClientRect().top+(position.fraction||0)*rect.height)}else root.scrollTop=(position?.ratio||0)*Math.max(0,root.scrollHeight-root.clientHeight);
 if(focus&&owner.editorMode==='formatted'){const editor=owner.formatted.editor,rect=root.getBoundingClientRect(),point=document.caretPositionFromPoint(rect.left+20,rect.top+20),scroll=root.scrollTop;let pos;if(point&&owner.richHost.contains(point.offsetNode))pos=editor.view.posAtDOM(point.offsetNode,point.offset);else if(element)pos=editor.view.posAtDOM(element,0);if(pos!==undefined)editor.commands.setTextSelection(Math.max(1,Math.min(editor.state.doc.content.size,pos)));editor.view.dom.focus({preventScroll:true});root.scrollTop=scroll}
 owner.outline?.scheduleGeometry();
}
