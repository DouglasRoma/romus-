import {validateQuiz} from './note-page-data.js';
export const QUIZ_MARKDOWN_EXAMPLE=`## Investigação inicial
Qual é a melhor alternativa?
- [ ] Primeira alternativa
- [x] Alternativa correta
- [ ] Terceira alternativa
Explicação: Escreva a justificativa em **Markdown**. Use [[Nota]] para criar vínculos.

---

## Segundo quiz
Escreva outra pergunta aqui.
- [x] Resposta correta
- [ ] Outra alternativa
Explicação: A explicação é opcional.
`;
const fence=line=>line.match(/^ {0,3}(`{3,}|~{3,})/);
export function parseQuizMarkdown(input){
 let text=String(input||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
 // Accept a single Markdown fence commonly used when copying a whole answer.
 const outer=text.match(/^```(?:markdown|md)?\s*\n([\s\S]*)\n```$/i);if(outer)text=outer[1];
 const blocks=[];let lines=[],start=1,code=null;
 for(const [i,line]of text.split('\n').entries()){const marker=fence(line);if(marker){if(!code)code=marker[1];else if(marker[1][0]===code[0]&&marker[1].length>=code.length)code=null}
  if(!code&&!marker&&/^\s*---\s*$/.test(line)){if(lines.some(l=>l.trim()))blocks.push({lines,start});lines=[];start=i+2}else lines.push(line);
 }if(lines.some(l=>l.trim()))blocks.push({lines,start});
 const quizzes=[],errors=[];
 for(const [index,block]of blocks.entries()){
  try{
   const content=block.lines.slice();while(content.length&&!content[0].trim())content.shift();let title='';if(/^#{1,3}\s+/.test(content[0]||''))title=content.shift().replace(/^#{1,3}\s+/,'').trim();
   const question=[],choices=[],correct=[],explanation=[];let zone='question',code=null;
   for(const line of content){const marker=fence(line);if(marker){if(!code)code=marker[1];else if(marker[1][0]===code[0]&&marker[1].length>=code.length)code=null}
    const option=!code&&!marker&&line.match(/^\s*(?:[-*+]|\d+[.)])\s+\[([ xX])\]\s*(.*)$/),explain=!code&&!marker&&line.match(/^\s*(?:>\s*)?(?:Explica[çc][aã]o|Explicaci[oó]n|Explanation)\s*:\s*(.*)$/i);
    if(explain&&zone!=='explanation'){zone='explanation';explanation.push(explain[1]);continue}
    if(option&&zone!=='explanation'){zone='choices';choices.push([option[2]]);if(option[1].toLowerCase()==='x')correct.push(choices.length-1);continue}
    if(zone==='question')question.push(line);else if(zone==='explanation')explanation.push(line);else if(!line.trim()||/^\s{2,}|^\t/.test(line)||code||marker)choices.at(-1).push(line.replace(/^ {2}|^\t/,''));else throw Error('Use “Explicação:” antes da justificativa e separe os quizzes com --- numa linha própria.');
   }
   if(correct.length!==1)throw Error('Marque exatamente uma alternativa com [x]; use [ ] nas demais.');
   const q=question.join('\n').trim().replace(/^(?:Pergunta|Pregunta|Question)\s*:\s*/i,'');
   quizzes.push(validateQuiz({title:title||q.split('\n')[0].replace(/[#*`]/g,'').slice(0,100)||'Quiz '+(index+1),question:q,choices:choices.map(parts=>parts.join('\n').trim()),correct:correct[0],explanation:explanation.join('\n').trim()}));
  }catch(error){errors.push({quiz:index+1,line:block.start,message:error.message})}
 }
 if(!blocks.length)errors.push({quiz:1,line:1,message:'Cole pelo menos uma pergunta com alternativas [ ] e uma resposta [x].'});
 return{quizzes,errors};
}
const signature=quiz=>JSON.stringify([quiz.title.trim(),quiz.question.trim(),quiz.choices.map(value=>value.trim()),quiz.correct,(quiz.explanation||'').trim()]);
export function appendQuizImport(data,quizzes,makeId){
 data.quizzes||=[];const seen=new Set(data.quizzes.map(signature));let added=0,skipped=0;
 for(const quiz of quizzes){validateQuiz(quiz);const key=signature(quiz);if(seen.has(key)){skipped++;continue}seen.add(key);data.quizzes.push({...quiz,choices:quiz.choices.slice(),id:makeId()});added++}return{added,skipped};
}
