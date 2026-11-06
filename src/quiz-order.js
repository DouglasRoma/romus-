/** The displayed permutation never changes the stored correct-answer index. */
export function nextQuizOrder(count,previous,random=Math.random){
 const order=Array.from({length:count},(_,i)=>i);
 for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
 if(count>1&&previous?.length===count&&order.every((value,i)=>value===previous[i]))order.push(order.shift());
 return order;
}
