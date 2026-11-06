const {test}=require('node:test'),assert=require('node:assert/strict');
test('quiz embaralha por tentativa, mantém índices originais e evita repetir a ordem anterior',async()=>{
 const {nextQuizOrder}=await import('../src/quiz-order.js');
 for(const count of [2,3,4,8]){let previous=Array.from({length:count},(_,i)=>i);for(let attempt=0;attempt<15;attempt++){const order=nextQuizOrder(count,previous,()=>.999);assert.notDeepEqual(order,previous);assert.deepEqual([...order].sort((a,b)=>a-b),Array.from({length:count},(_,i)=>i));assert.equal(order[order.indexOf(1)],1);previous=order}}
});
