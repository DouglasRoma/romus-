import {propertyDocument} from './property-data.js';
export const NOTE_PAGE_KEY='atlas-internal-page';
export function notePageData(props){
 const value=props[NOTE_PAGE_KEY];if(value!==undefined&&(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1))throw Error('O conteúdo extra desta nota usa um formato não reconhecido. Ele foi preservado.');
 return structuredClone(value||{version:1,cover:null,resources:[],cases:[],quizzes:[]});
}
export function patchNotePage(text,change){
 const current=propertyDocument(text),data=notePageData(current.props),before=JSON.stringify(data);change(data);
 if(JSON.stringify(data)===before)return text;current.document.set(NOTE_PAGE_KEY,data);
 return current.bom+'---'+current.eol+current.document.toString({lineWidth:0}).trimEnd().replace(/\n/g,current.eol)+current.eol+'---'+current.eol+current.body;
}
// Media deletion also clears note covers/resources, keeping the same trash undo.
export function removePageMedia(text,matches,id,cleanMarkdown=value=>value){
 const parsed=propertyDocument(text);if(!parsed.props[NOTE_PAGE_KEY])return text;
 return patchNotePage(text,data=>{if(data.cover?.source&&matches(data.cover.source))data.cover=null;data.resources=(data.resources||[]).filter(item=>item.id!==id&&!matches(item.source));for(const item of data.cases||[])if(item.body)item.body=cleanMarkdown(item.body);for(const quiz of data.quizzes||[])for(const field of ['question','explanation'])if(quiz[field])quiz[field]=cleanMarkdown(quiz[field])});
}
export function validateQuiz(quiz){
 if(!quiz.title?.trim()||!quiz.question?.trim())throw Error('Preencha o título e a pergunta do quiz.');
 if(!Array.isArray(quiz.choices)||quiz.choices.length<2||quiz.choices.length>8||quiz.choices.some(choice=>!choice.trim()))throw Error('Preencha de duas a oito alternativas.');
 if(!Number.isInteger(quiz.correct)||quiz.correct<0||quiz.correct>=quiz.choices.length)throw Error('Marque a alternativa correta.');
 return quiz;
}
