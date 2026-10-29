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
 vm.runInContext(fs.readFileSync(base+'app.js','utf8'),ctx);
 const click=(action,rest={})=>events.click({target:{closest(){return {dataset:{action,...rest},classList:element().classList,setAttribute(){}}}}});
 const input=(i,value)=>events.input({target:{dataset:{blank:String(i)},value}});
 const option=(n,checked=true)=>events.change({target:{dataset:{option:String(n)},checked,closest(){return element()}}});
 const state=()=>JSON.parse(store['qiushi-study-v1']);
 const answer=q=>q.type==='fill'?q.blanks.forEach((b,i)=>input(i,b.answers[0])):q.answers.forEach(n=>option(n));
 return {ctx,store,root,controls,click,input,option,state,answer,confirm(){assert(dialog,'Expected confirmation dialog');dialog.querySelector('#confirm').onclick();}};
}
const a=boot(),bank=a.ctx.QUESTION_BANK,core=a.ctx.QUIZ_CORE;
assert.equal(bank.length,116);assert.equal(new Set(bank.map(q=>q.id)).size,116);
let assertions=0;
for(const q of bank){
 assert(['basics','theory','discipline','current','school'].includes(q.module));
 assert(q.prompt&&q.explanation&&q.source.label);
 const good=q.type==='fill'?q.blanks.map(b=>b.answers[0]):q.answers;
 assert.equal(core.grade(q,good).correct,true,q.id+' canonical');
 assert.equal(core.grade(q,[]).correct,false,q.id+' unanswered');
 assert.equal(!!core.complete(q,good),true,q.id+' complete');
 if(q.type==='fill'){
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
a.click('next');s=a.state();const third=bank.find(q=>q.id===s.session.ids[s.session.index]);
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
console.log(JSON.stringify({questions:bank.length,answerChecks:assertions,flows:'training, exam, peek, wrongs, bookmarks, resume, 100-point result, two-round mastery: passed'},null,2));
