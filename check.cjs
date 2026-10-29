const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=__dirname+'/dist/';
function boot(saved){
 const events={},store=saved||{},controls={mode:{value:'exam'},type:{value:'all'},size:{value:'20'},level:{value:'all'}};
 const element=()=>({style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},focus(){},scrollIntoView(){},remove(){},addEventListener(){}});
 const root={...element(),innerHTML:'',addEventListener(name,fn){events[name]=fn},querySelectorAll(){return []}};
 let dialog;
 const document={getElementById(id){return id==='app'?root:controls[id]||element()},querySelector(){return null},querySelectorAll(){return []},activeElement:element(),createElement(){const children={};dialog={...element(),querySelector(s){return children[s]||(children[s]=element())},querySelectorAll(){return Object.values(children)}};return dialog;},body:{append(){}}};
 const ctx={document,localStorage:{getItem(k){return store[k]||null},setItem(k,v){store[k]=v}},setTimeout(){},clearTimeout(){},matchMedia(){return {matches:true}},console};
 ctx.window=ctx;ctx.scrollTo=()=>{};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(base+'questions.js','utf8'),ctx);
 vm.runInContext(fs.readFileSync(base+'recall.js','utf8'),ctx);
 vm.runInContext(fs.readFileSync(base+'app.js','utf8'),ctx);
 const click=(action,rest={})=>events.click({target:{closest(){return {dataset:{action,...rest},classList:element().classList,setAttribute(){}}}}});
 const input=(i,value)=>events.input({target:{dataset:{blank:String(i)},value}});
 const recite=value=>events.input({target:{dataset:{recite:''},value}});
 const option=(n,checked=true)=>events.change({target:{dataset:{option:String(n)},checked,closest(){return element()}}});
 const state=()=>JSON.parse(store['qiushi-study-v1']);
 const answer=q=>q.type==='recite'?recite(q.answer):q.type==='fill'?q.blanks.forEach((b,i)=>input(i,b.answers[0])):q.answers.forEach(n=>option(n));
 const key=(key,rest={})=>{let prevented=false;events.keydown({key,isComposing:false,target:{matches:selector=>selector==='[data-recite]'},preventDefault(){prevented=true},...rest});return prevented;};
 return {ctx,store,root,controls,click,input,recite,option,state,answer,key,confirm(){assert(dialog,'Expected confirmation dialog');dialog.querySelector('#confirm').onclick();}};
}
const a=boot(),bank=a.ctx.QUESTION_BANK,core=a.ctx.QUIZ_CORE;
assert.equal(bank.length,111);assert.equal(new Set(bank.map(q=>q.id)).size,111);
assert.equal(bank.filter(q=>q.type==='recite').length,41);
let assertions=0;
for(const q of bank){
 assert(['basics','theory','discipline','current','school'].includes(q.module));
 assert(q.prompt&&q.explanation&&q.source.label);
 const good=q.type==='recite'?q.answer:q.type==='fill'?q.blanks.map(b=>b.answers[0]):q.answers;
 assert.equal(core.grade(q,good).correct,true,q.id+' canonical');
 assert.equal(core.grade(q,[]).correct,false,q.id+' unanswered');
 assert.equal(!!core.complete(q,good),true,q.id+' complete');
 if(q.type==='recite'){
  assert(q.segments.length>0);
  assert.equal(core.grade(q,'答：'+q.answer.replaceAll('，','\n')).correct,true,q.id+' formatting');
  assert.equal(core.grade(q,q.answer+'错误内容').correct,false,q.id+' extra text');
  assert.equal(core.grade(q,q.answer.slice(1)).correct,false,q.id+' missing character');
  for(const alias of q.alternatives){const g=core.grade(q,alias);assert(g.correct,q.id+' alias');assert(g.parts.every(Boolean),q.id+' alias coverage');}
  if(q.mode==='list'){
   assert(core.grade(q,[...q.segments].reverse().map((s,i)=>`${i+1}. ${s}`).join('\n')).correct,q.id+' unordered numbered list');
   assert(!core.grade(q,q.segments.slice(1).join('；')).correct,q.id+' missing item');
  }
 }else if(q.type==='fill'){
  for(let i=0;i<q.blanks.length;i++)for(const alias of q.blanks[i].answers){const v=[...good];v[i]='  '+alias+'。 ';assert.equal(core.grade(q,v).correct,true,q.id+' alias');assertions++;}
  const v=[...good];v[0]='错误答案';assert.equal(core.grade(q,v).correct,false,q.id+' wrong');
 }else{
  assert(q.answers.every(n=>Number.isInteger(n)&&n>=0&&n<q.options.length));
  if(q.type==='single')assert.equal(q.answers.length,1);
  if(q.type==='multi'){assert(q.answers.length>1);assert.equal(core.grade(q,q.answers.slice(1)).correct,false,q.id+' missed option');}
  const other=q.options.findIndex((_,i)=>!q.answers.includes(i));
  if(other>=0)assert.equal(core.grade(q,[...q.answers,other]).correct,false,q.id+' extra option');
 }
 assertions+=7;
}
assert.equal(core.norm('４．５％'),core.norm('4.5%'));
assert.notEqual(core.norm('4.5'),core.norm('45'));
assert.notEqual(core.norm('2%'),core.norm('2'));

// Train, incomplete validation, single/multiple answers, bookmark and persisted resume.
a.click('module',{module:'basics'});
const first=bank.find(q=>q.id===a.state().session.ids[0]);
a.click('check');assert.equal(a.state().records[first.id],undefined);
a.answer(first);a.click('check');assert.equal(a.state().session.results[first.id].correct,true);
a.click('check');assert.equal(a.state().records[first.id].attempts,1);
a.click('bookmark',{id:first.id});assert(a.state().bookmarks.includes(first.id));
a.click('next');let s=a.state();const second=bank.find(q=>q.id===s.session.ids[s.session.index]);
a.answer(second);a.click('check');assert.equal(a.state().session.results[second.id].correct,true);
const third=bank.find(q=>q.id==='basics-14');a.click('jump',{index:String(a.state().session.ids.indexOf(third.id))});
a.option(third.answers[0]);a.click('check');assert.equal(a.state().session.results[third.id].correct,false);assert(a.state().records[third.id].needsReview);
const resumed=boot(a.store);assert(resumed.root.innerHTML.includes('上次练到这里'));resumed.click('resume');assert(resumed.root.innerHTML.includes(third.prompt));
resumed.click('next');resumed.click('peek');s=resumed.state();const peekId=s.session.ids[s.session.index];assert(s.session.results[peekId].peek);assert(s.records[peekId].needsReview);
resumed.click('finish');resumed.confirm();assert(resumed.state().session.finished);assert(resumed.root.innerHTML.includes('逐题核对'));resumed.click('retry');assert(resumed.state().session.ids.includes(third.id));assert(!resumed.state().session.ids.includes(first.id));

// Exam remains editable and does not expose correctness before submission.
const exam=boot();exam.click('mixed');let es=exam.state();assert.equal(es.session.ids.length,20);assert.equal(es.session.mode,'exam');
for(let i=0;i<20;i++){const q=bank.find(q=>q.id===exam.state().session.ids[i]);exam.click('jump',{index:String(i)});exam.answer(q);assert.equal(Object.keys(exam.state().session.results).length,0);assert(!exam.root.innerHTML.includes('class="feedback'));}
exam.click('finish');es=exam.state();assert(es.session.finished);assert(Object.values(es.session.results).every(r=>r.correct));assert(exam.root.innerHTML.includes('<strong>100</strong>'));
exam.click('again');for(let i=0;i<20;i++){const q=bank.find(q=>q.id===exam.state().session.ids[i]);exam.click('jump',{index:String(i)});exam.answer(q);}exam.click('finish');assert(Object.values(exam.state().records).every(r=>r.streak===2));

// A previous wrong answer requires two independent correct rounds to clear.
const q=bank[0],seed={records:{[q.id]:{attempts:1,streak:0,errors:1,needsReview:true}},bookmarks:[],history:[],session:null};
const retry=boot({'qiushi-study-v1':JSON.stringify(seed)});retry.click('practice-list',{kind:'wrong'});retry.answer(q);retry.click('check');assert(retry.state().records[q.id].needsReview);retry.click('finish');retry.click('again');retry.answer(q);retry.click('check');assert.equal(retry.state().records[q.id].needsReview,false);

// Full recall has no answer scaffolding until check, and Enter does not submit.
const oath=bank.find(q=>q.id==='basics-08-recite'),recall=boot();
recall.controls.type.value='recite';recall.controls.mode.value='train';recall.controls.size.value='all';recall.click('mixed');
assert(recall.state().session.ids.every(id=>bank.find(q=>q.id===id).type==='recite'));
recall.click('jump',{index:String(recall.state().session.ids.indexOf(oath.id))});
assert(recall.root.innerHTML.includes('<textarea'));assert(!recall.root.innerHTML.includes(oath.answer));
assert.equal(recall.key('Enter'),false);assert.equal(Object.keys(recall.state().session.results).length,0);
recall.recite(oath.answer.replace('志愿','自愿'));assert.equal(recall.key('Enter',{ctrlKey:true}),true);
assert.equal(recall.state().session.results[oath.id].correct,false);assert(recall.root.innerHTML.includes('待核对'));
assert(recall.root.innerHTML.includes(oath.segments[0]));assert.equal(recall.state().records[oath.id].attempts,1);
const strict=core.grade(oath,[...oath.segments].reverse().join('，'));assert.equal(strict.correct,false);assert(strict.parts.every(Boolean));
const draft=boot();draft.click('module',{module:'basics'});draft.recite('中国共产党是');
const restored=boot(draft.store);restored.click('resume');assert(restored.root.innerHTML.includes('>中国共产党是</textarea>'));

// Existing v1 history is preserved; changed questions require fresh recall.
const legacy={records:{'basics-01':{attempts:2,streak:2},'basics-09':{attempts:1,streak:0,needsReview:true},'basics-11':{attempts:2,streak:2}},bookmarks:['basics-01','basics-02','basics-09','basics-11'],history:[{total:28}],session:{ids:['basics-01','basics-11'],index:0,drafts:{'basics-01':['先锋队','先锋队']},results:{},orders:{},finished:false}};
const upgraded=boot({'qiushi-study-v1':JSON.stringify(legacy)}),us=upgraded.state();
assert.equal(us.records['basics-11'].streak,2);assert.equal(us.records['basics-01-recite'],undefined);
assert(us.records['basics-08-recite'].needsReview);assert.equal(us.records['basics-01'].streak,2);
assert.equal(us.session,null);assert.equal(us.previousSession.ids[0],'basics-01');
assert.deepEqual(us.bookmarks,['basics-01-recite','basics-08-recite','basics-11']);assert.equal(us.revision,2);
assert(boot(upgraded.store).root.innerHTML.includes('已更新整段默写')===false);
console.log(JSON.stringify({questions:bank.length,answerChecks:assertions,flows:'recitation, strict wording, unordered lists, keyboard, migration, training, exam, peek, wrongs, bookmarks, resume, score, mastery: passed'},null,2));
