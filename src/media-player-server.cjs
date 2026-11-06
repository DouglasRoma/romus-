const http=require('node:http');
async function startPlayerServer(){
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');let src;
  const video=url.pathname.match(/^\/youtube\/([\w-]{11})$/),spotify=url.pathname.match(/^\/spotify\/(track|album|playlist|episode|show|artist)\/([a-zA-Z0-9]{10,32})$/);
  if(video){const start=Math.max(0,Math.min(86400,Number(url.searchParams.get('start'))||0));src='https://www.youtube.com/embed/'+video[1]+'?playsinline=1&start='+start}
  else if(spotify)src='https://open.spotify.com/embed/'+spotify[1]+'/'+spotify[2];
  else{res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-src https://www.youtube.com https://open.spotify.com; base-uri 'none'"});
  res.end('<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;background:#181a1c;overflow:hidden}iframe{border:0;width:100%;height:100%;display:block}</style><iframe src="'+src.replaceAll('&','&amp;')+'" title="Player de mídia" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></html>');
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});return{origin:'http://127.0.0.1:'+server.address().port,close:()=>server.close()};
}
module.exports={startPlayerServer};
