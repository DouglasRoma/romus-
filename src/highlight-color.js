/** Opaque highlighter swatches use black text; dark fills retain readable contrast. */
export function highlightTextColor(background){
 const value=String(background||'').trim();if(!value||/^(?:transparent|none)$/i.test(value))return null;
 let rgb;const hex=/^#([a-f\d]{3}|[a-f\d]{6})$/i.exec(value);if(hex){const raw=hex[1].length===3?hex[1].split('').map(c=>c+c).join(''):hex[1];rgb=[0,2,4].map(at=>parseInt(raw.slice(at,at+2),16))}else{const match=/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/i.exec(value);if(match){if(match[4]!==undefined&&Number(match[4])===0)return null;rgb=match.slice(1,4).map(Number)}}
 if(!rgb)return'#000000';const linear=rgb.map(c=>{const n=Math.max(0,Math.min(255,c))/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722>.179?'#000000':'#ffffff';
}
export function textPaintAttributes({color,background,autoForeground}={}){
 const automatic=!!background&&autoForeground!==false,foreground=automatic?highlightTextColor(background)||color:color,attrs={};if(background){attrs['data-atlas-highlight']=automatic?'auto':'manual';if(automatic&&color)attrs['data-atlas-original-color']=color}
 attrs.style=[foreground&&`color:${foreground}`,background&&`background-color:${background}`].filter(Boolean).join(';');return attrs;
}
export function originalTextColor(element){if(element.getAttribute('data-atlas-highlight')==='auto'){const original=element.getAttribute('data-atlas-original-color');return original&&CSS.supports('color',original)?original:null}return element.style.color||null}
/** Called while rendering Markdown, so existing notes gain contrast without rewriting files. */
export function normalizeHighlight(element){const background=element.style.backgroundColor|| (element.tagName==='MARK'?'#dfbf55':'');if(!background)return;const automatic=element.getAttribute('data-atlas-highlight')!=='manual',color=automatic?highlightTextColor(background):element.style.color;if(color)element.style.color=color;element.style.backgroundColor=background;element.setAttribute('data-atlas-highlight',automatic?'auto':'manual')}
