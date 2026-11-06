/** Find nearby empty space without moving any existing card or map. */
export function freeBoardPosition(nodes,preferred,footprint={x:0,y:0,w:360,h:322},gap=42){
 const obstacles=nodes.map(n=>({x:n.x-gap,y:n.y-gap,w:n.w+gap*2,h:n.h+42+gap*2}));
 const origin={x:preferred.x+footprint.x,y:preferred.y+footprint.y},queue=[origin],seen=new Set();let checked=0;
 const intersects=(p,r)=>p.x<r.x+r.w&&p.x+footprint.w>r.x&&p.y<r.y+r.h&&p.y+footprint.h>r.y;
 while(queue.length&&checked++<1800){
  queue.sort((a,b)=>(a.x-origin.x)**2+(a.y-origin.y)**2-((b.x-origin.x)**2+(b.y-origin.y)**2));const p=queue.shift(),key=p.x.toFixed(1)+':'+p.y.toFixed(1);if(seen.has(key))continue;seen.add(key);
  const hit=obstacles.find(r=>intersects(p,r));if(!hit)return{x:p.x-footprint.x,y:p.y-footprint.y};
  queue.push({x:hit.x+hit.w,y:p.y},{x:hit.x-footprint.w,y:p.y},{x:p.x,y:hit.y+hit.h},{x:p.x,y:hit.y-footprint.h});
 }
 return{x:Math.max(origin.x,...obstacles.map(r=>r.x+r.w))-footprint.x,y:origin.y-footprint.y};
}
