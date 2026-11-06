export const MEDIA_TYPES={web:'Páginas e links',youtube:'YouTube',spotify:'Spotify',pdf:'PDFs',image:'Imagens',file:'Arquivos'};
export function mediaSource(source,local=false){
 if(local){if(typeof source!=='string'||source.split('/').some(p=>p==='..')||/^[a-z]+:|^[\\/]|\\/i.test(source))return null;const image=/\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i.test(source),type=image?'image':/\.pdf$/i.test(source)?'pdf':'file';if(!/\.[\w-]{1,16}$/i.test(source))return null;return{key:type+':'+source,type,source,local:true,title:source.split('/').pop().replace(type==='pdf'?/\.pdf$/i:/$^/,'')}}
 let url;try{url=new URL(source)}catch{return null}if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;
 const host=url.hostname.toLowerCase().replace(/^www\./,''),parts=url.pathname.split('/').filter(Boolean);
 if(['youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','youtu.be'].includes(host)){
  const video=host==='youtu.be'?parts[0]:url.searchParams.get('v')||(['embed','shorts','live'].includes(parts[0])?parts[1]:'');
  if(/^[\w-]{11}$/.test(video||''))return{key:'youtube:'+video,type:'youtube',source:url.href,video,thumbnail:'https://i.ytimg.com/vi/'+video+'/hqdefault.jpg',title:'Vídeo do YouTube'};
 }
 if(host==='open.spotify.com'){
  const clean=parts.filter(part=>!/^intl-/.test(part));if(clean[0]==='embed')clean.shift();
  if(['track','album','playlist','episode','show','artist'].includes(clean[0])&&/^[a-zA-Z0-9]{10,32}$/.test(clean[1]||''))return{key:'spotify:'+clean[0]+':'+clean[1],type:'spotify',source:url.href,spotifyType:clean[0],spotifyId:clean[1],title:'Áudio do Spotify'};
 }
 let title;try{title=decodeURIComponent(url.pathname.split('/').filter(Boolean).pop()||host)}catch{title=host}
 return{key:url.href,type:/\.pdf$/i.test(url.pathname)?'pdf':'web',source:url.href,title:title.replace(/[_-]/g,' ')};
}
export function nodeMedia(node){
 if(node.mediaFile)return mediaSource(node.mediaFile,true);
 if(node.type==='image'&&node.mediaId)return mediaSource(node.path,true);
 if(node.type==='web')return mediaSource(node.path);
 if(node.type==='note'&&node.path?.toLowerCase().endsWith('.pdf'))return mediaSource(node.path,true);
 return null;
}
