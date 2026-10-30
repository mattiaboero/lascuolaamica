'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../../js/gioco-tabelline-motore.js');
const DT=1/120;
const tick=(w,n,input={})=>{for(let i=0;i<n;i++)w.step(DT,input);};
const events=(w,type)=>w.events.filter(e=>e.type===type);
const still=(w,mode)=>{w.mode=mode;const before=JSON.stringify(w);tick(w,150,{right:true,jumpPressed:true,shootPressed:true});assert.equal(JSON.stringify(w),before);};
function atMath(index=0,practice=false){
  const w=new C.World(index,{tables:[7],practice,random:()=>0});
  w.enemies=[];w.player.x=w.level.math.x;w.player.y=w.level.math.y;tick(w,3);
  return w;
}
function strikeAnswer(w,value){
  const b=w.answerBlocks().find(b=>b.value===value);assert(b);
  // An isolated station fixture. The answer itself must be caused by a real jump.
  w.player.x=b.x+b.w/2;w.player.y=w.level.math.y;w.player.vx=0;w.player.vy=0;w.player.grounded=false;tick(w,3);
  const revision=w.questionRevision;w.step(DT,{jumpPressed:true});
  for(let i=0;i<110&&w.questionRevision===revision&&w.mode==='play';i++)w.step(DT);
  assert(w.questionRevision>revision,'a head strike from below must select the visible block');
}

test('reference controls: arrows/W jump, Space fires, ordinary mode restarts on wrong answer',()=>{
  assert(C.DEFAULT_KEYS.jump.includes('ArrowUp'));assert(!C.DEFAULT_KEYS.jump.includes('Space'));
  assert(C.DEFAULT_KEYS.shoot.includes('Space'));assert.equal(C.defaults().practice,false);
});

test('ground, acceleration, walls and two jumps use the motion controller',()=>{
  const w=new C.World(0);tick(w,3);assert(w.player.grounded);const x=w.player.x;
  tick(w,60,{right:true});assert(w.player.x>x+90);assert(w.player.x<x+120);
  w.step(DT,{jumpPressed:true});assert.equal(w.player.jumps,1);assert(w.player.vy<-450);
  tick(w,25);w.step(DT,{jumpPressed:true});assert.equal(w.player.jumps,2);assert(w.player.vy<-420);
  tick(w,2);const vy=w.player.vy;w.step(DT,{jumpPressed:true});assert.equal(w.player.jumps,2);assert(w.player.vy>vy);
  tick(w,200);assert.equal(w.player.y,448);assert.equal(w.player.hp,3);
  w.level.platforms.push({x:350,y:300,w:40,h:148,dx:0,dy:0});tick(w,180,{right:true});assert.equal(w.player.x,338);
});

test('the correct block is hit from below; the opened gate completes only on walking through',()=>{
  const w=atMath();const before=w.score;
  assert.equal(w.question.a,2);assert.equal(w.question.b,1);
  strikeAnswer(w,w.question.answer);assert.equal(w.solved,1);assert(!w.gateOpen);assert.equal(w.score,before+25);
  tick(w,120);strikeAnswer(w,w.question.answer);assert.equal(w.solved,2);assert(w.gateOpen);assert.equal(w.mode,'play');assert.equal(w.score,before+50);
  assert.equal(events(w,'gate_open').length,1);assert.equal(events(w,'complete').length,0);
  assert.equal(w.answer(w.question.answer),false);tick(w,120);assert.equal(w.score,before+50);
  for(let i=0;i<500&&w.mode==='play';i++)w.step(DT,{right:true});
  assert.equal(w.mode,'complete');assert.equal(events(w,'complete').length,1);
  const saved=JSON.stringify(w);tick(w,600,{right:true,interactPressed:true});assert.equal(JSON.stringify(w),saved);
});

test('approach and E cannot bypass a closed gate or award an answer',()=>{
  const w=atMath();w.player.x=w.level.gate.x-80;tick(w,180,{right:true,interactPressed:true});
  assert(w.player.x<=w.level.gate.x-48);assert.equal(w.mode,'play');assert.equal(w.solved,0);assert.equal(w.score,0);assert(!w.gateOpen);
  assert.equal(events(w,'complete').length,0);assert.equal(w.answer(w.question.answer),false,'outside the answer area');
});

test('side contact and falling onto an answer do not select it',()=>{
  const w=atMath(),b=w.answerBlocks()[0];w.player.x=b.x+b.w/2;w.player.y=b.y-5;w.player.vy=60;w.player.grounded=false;tick(w,70);
  assert.equal(w.solved,0);assert.equal(w.lastAnswer,null);assert.equal(events(w,'wrong').length,0);
});

test('every island requires two distinct physical answers with no repeated credit while locked',()=>{
  for(let index=0;index<C.NAMES.length;index++){
  const w=atMath(index),first={...w.question};assert.equal(w.level.questions,2);
  strikeAnswer(w,w.question.answer);assert.equal(w.solved,1);assert(!w.gateOpen);assert.equal(w.score,25);
  for(let i=0;i<30;i++)assert.equal(w.answer(w.question.answer),false);
  assert.equal(w.score,25);tick(w,120);assert.equal(w.lastAnswer,null);
  strikeAnswer(w,w.question.answer);assert.equal(w.solved,2);assert(w.gateOpen);assert.equal(w.score,50);
  assert.equal(events(w,'correct').length,2);assert.equal(events(w,'gate_open').length,1);
  assert.notDeepEqual(w.question,first);if(index===8)assert.notEqual(w.question.a,first.a);
  }
});

test('wrong head strike freezes Avventura until restart, while Allenamento can retry',()=>{
  const w=atMath();strikeAnswer(w,w.choices.find(n=>n!==w.question.answer));
  assert.equal(w.mode,'wrong');assert.equal(w.solved,0);assert.equal(w.score,0);assert(!w.gateOpen);assert.equal(events(w,'wrong').length,1);still(w,'wrong');
  const restarted=new C.World(w.level.index,{tables:w.tables,practice:w.practice,random:()=>0});
  assert.deepEqual([restarted.coins,restarted.stars,restarted.score,restarted.solved],[0,0,0,0]);assert.equal(restarted.player.x,restarted.level.spawn.x);assert.equal(restarted.mode,'play');
  const practice=atMath(0,true),original={...practice.question};strikeAnswer(practice,practice.choices.find(n=>n!==practice.question.answer));
  assert.equal(practice.mode,'play');tick(practice,120);assert.deepEqual(practice.question,original);assert.equal(practice.score,0);
  strikeAnswer(practice,practice.question.answer);assert(!practice.gateOpen);assert.equal(practice.score,25);
  tick(practice,120);strikeAnswer(practice,practice.question.answer);assert(practice.gateOpen);assert.equal(practice.score,50);
});

test('live custodian blocks answers; swept shots and stomp award defeat once',()=>{
  const w=new C.World(1,{tables:[2],random:()=>0}),boss=w.enemies.find(e=>e.type===3);
  w.player.x=w.level.math.x;assert(!w.canAnswer());assert.equal(w.answer(w.question.answer),false);
  const initialHP=boss.hp;
  for(let i=0;i<initialHP;i++){boss.guard=0;w.shots.push({x:boss.x-90,y:boss.y-40,vx:15000,life:1,hostile:false});w.stepShots(DT);}
  assert.equal(boss.hp,0);assert.equal(w.score,25);assert.equal(w.coins,0);assert(w.canAnswer());w.damageEnemy(boss);assert.equal(w.score,25);assert.equal(events(w,'boss_clear').length,1);
  const small=w.enemies.find(e=>e.type===0);w.player.x=small.x;w.player.y=small.y-38;w.player.vy=130;w.player.invincible=0;w.player.grounded=false;
  tick(w,3);assert.equal(small.hp,0);assert(w.player.vy<0);assert.equal(w.player.hp,3);assert.equal(w.score,30);
});

test('ammunition adds fifteen once; holding the old shoot input cannot autofire',()=>{
  const w=new C.World(1);w.enemies=[];assert.equal(w.ammo,0);
  w.step(DT,{shootPressed:true});assert.equal(w.shots.length,0);assert.equal(events(w,'no_ammo').length,1);
  const pack=w.level.ammo[0];w.player.x=pack.x-35;w.player.y=pack.y+32;w.player.vx=0;w.player.vy=0;
  tick(w,25,{right:true});assert(pack.taken);assert.equal(w.ammo,15);tick(w,20);assert.equal(w.ammo,15);
  w.step(DT,{shootPressed:true});assert.equal(w.ammo,14);assert.equal(events(w,'seed').length,1);
  tick(w,160,{shoot:true});assert.equal(w.ammo,14);assert.equal(events(w,'seed').length,1);
  w.step(DT,{shootPressed:true});assert.equal(w.ammo,13);assert.equal(events(w,'seed').length,2);
  const second=w.level.ammo[1];w.player.x=second.x;w.player.y=second.y+25;w.player.vx=0;w.player.vy=0;w.step(DT);assert.equal(w.ammo,28);assert.equal(events(w,'ammo').length,2);
});

test('coin blocks pay one or five coins from actual head hits, then stay empty',()=>{
  for(const which of [0,1]){
    const w=new C.World(0),b=w.level.blocks[which],count=b.remaining;
    const floor=w.level.platforms.filter(r=>!r.motion&&r.y>=b.y+b.h&&b.x+b.w/2>r.x&&b.x+b.w/2<r.x+r.w).sort((a,b)=>a.y-b.y)[0];
    w.player.x=b.x+b.w/2;w.player.y=floor.y;w.player.vx=0;w.player.vy=0;tick(w,3);const before=w.coins;
    for(let hit=0;hit<count;hit++){
      w.step(DT,{jumpPressed:true});tick(w,100);assert.equal(b.remaining,count-hit-1);assert.equal(w.coins,before+hit+1);
    }
    w.step(DT,{jumpPressed:true});tick(w,100);assert.equal(b.remaining,0);assert.equal(w.coins,before+count);assert.equal(events(w,'block').length,count);
  }
});

test('a projectile can activate a coin block and is consumed by that one impact',()=>{
  const w=new C.World(0),b=w.level.blocks[1];w.ammo=1;
  w.player.x=b.x-75;w.player.y=b.y+48;w.player.face=1;w.player.vx=0;w.player.vy=0;
  w.step(DT,{shootPressed:true});tick(w,30);assert.equal(w.ammo,0);assert.equal(b.remaining,4);assert.equal(w.coins,1);assert.equal(w.shots.length,0);assert.equal(events(w,'block').length,1);
});

test('secret and treasure reveal by walking; repeated contact and KO cannot duplicate reward',()=>{
  const w=new C.World(0),c=w.level.chest;
  w.player.x=c.x-100;w.player.y=c.y;w.player.hp=2;w.player.vx=0;w.player.vy=0;const before=w.coins;
  tick(w,60,{right:true});assert(w.secretRevealed);assert(w.chestOpen);assert.equal(w.coins,before+12);assert.equal(w.player.hp,3);assert.equal(events(w,'secret').length,1);assert.equal(events(w,'chest').length,1);
  assert.equal(events(w,'chest')[0].coins,12);assert.equal(events(w,'chest')[0].hearts,1);
  w.openChest();w.openChest();assert.equal(w.coins,before+12);
  w.hurt(true);w.hurt(true);w.hurt(true);assert.equal(w.mode,'ko');still(w,'ko');w.respawn();
  assert.equal(w.player.hp,3);assert(w.chestOpen);assert.equal(w.coins,before+12);w.openChest();assert.equal(w.coins,before+12);
  assert.equal(events(w,'chest').length,1);
  const healthy=new C.World(0);healthy.openChest();
  assert.equal(events(healthy,'chest')[0].coins,12);assert.equal(events(healthy,'chest')[0].hearts,0);assert.equal(healthy.player.hp,3);
});

test('checkpoint, falling loss and respawn preserve collected rewards',()=>{
  const w=new C.World(0),cp=w.level.checkpoint;w.player.x=cp.x-24;w.player.y=cp.y;tick(w,2);assert(w.checkpoint);
  const coins=w.coins;w.player.y=710;w.step(DT);assert.equal(w.player.hp,2);assert.equal(w.player.x,cp.x+35);assert.equal(w.player.y,cp.y);assert.equal(w.coins,coins);assert.equal(events(w,'checkpoint').length,1);
});

test('horizontal, vertical and orbit platforms carry standing Nina and freeze with the world',()=>{
  for(const motion of ['horizontal','vertical','orbit']){
    const w=new C.World(motion==='orbit'?4:1);w.enemies=[];w.level.spikes=[];
    const r=w.level.platforms.find(r=>r.motion===(motion==='orbit'?'orbit':'horizontal'));r.motion=motion;
    w.player.x=r.x+r.w/2;w.player.y=r.y;w.player.vx=0;w.player.vy=0;w.player.grounded=true;const x=w.player.x,y=w.player.y;
    tick(w,90);assert(w.player.grounded,motion);assert(Math.abs(w.player.y-r.y)<.01,motion);assert(Math.abs(w.player.x-x-(r.x-r.baseX))<.01,motion);assert(Math.abs(w.player.y-y-(r.y-r.baseY))<.01,motion);
    still(w,'pause');w.mode='play';w.step(DT);assert(w.time>90*DT);
  }
});

test('falling platforms wait, carry Nina down, freeze and reset on respawn',()=>{
  const w=new C.World(2);w.enemies=[];w.level.spikes=[];const r=w.level.platforms.find(r=>r.motion==='falling');
  w.player.x=r.x+r.w/2;w.player.y=r.y;w.player.vx=0;w.player.vy=0;w.player.grounded=true;
  tick(w,45);assert.equal(r.y,r.baseY);assert(r.fallTime>0);tick(w,50);assert(r.y>r.baseY);assert.equal(w.player.y,r.y);
  still(w,'pause');w.mode='play';w.respawn();assert.equal(r.y,r.baseY);assert.equal(r.fallTime,0);assert.equal(r.fallVelocity,0);
});

test('falling ledges land on solid ground without sinking or losing their rider',()=>{
  for(const index of [2,3,4,5]){
    const w=new C.World(index);w.enemies=[];w.level.spikes=[];
    const r=w.level.platforms.find(r=>r.motion==='falling');
    const floor=w.level.platforms.filter(o=>!o.motion&&o.x<r.x+r.w&&o.x+o.w>r.x&&o.y>=r.y+r.h).sort((a,b)=>a.y-b.y)[0];
    Object.assign(w.player,{x:r.x+r.w/2,y:r.y,vx:0,vy:0,grounded:true});
    tick(w,600);
    assert.equal(r.y+r.h,floor.y);assert.equal(r.fallVelocity,0);
    assert.equal(w.player.y,r.y);assert(w.player.grounded);assert.equal(w.player.hp,3);
    const landed=r.y;tick(w,300);assert.equal(r.y,landed);
    w.respawn();assert.equal(r.y,r.baseY);assert.equal(r.fallVelocity,0);
  }
});

test('selected tables, unique positive choices and exact integer answers',()=>{
  for(let a=1;a<=12;a++)for(let b=1;b<=10;b++){
    let i=0;const q=C.problem([a],()=>i++?(b-.5)/10:0),choices=C.answerChoices(q,()=>.37);
    assert.equal(q.a,a);assert.equal(q.b,b);assert.equal(choices.length,3);assert.equal(new Set(choices).size,3);assert(choices.includes(a*b));assert(choices.every(n=>Number.isInteger(n)&&n>0));
    assert(C.checkAnswer(q,String(a*b)));assert(!C.checkAnswer(q,String(a*b+1)));assert(!C.checkAnswer(q,''));assert(!C.checkAnswer(q,`${a*b}.0`));
  }
  assert.throws(()=>C.problem([]));
});

test('legacy records remain readable; best results and unknown extensions survive new scores',()=>{
  let p=C.defaults();p.extension={kept:true};p.records[0]={stars:2,coins:37,custom:'preserved'};
  assert.deepEqual(C.validateProgress(p).records[0],p.records[0]);
  p=C.recordCompletion(p,0,1,2,11);assert.deepEqual(p.records[0],{stars:2,coins:37,custom:'preserved',score:11});
  for(let i=0;i<C.NAMES.length;i++)p=C.recordCompletion(p,i,3,50+i,100+i);
  assert.equal(p.unlocked,9);p=C.recordCompletion(p,0,1,2,3);assert.equal(p.records[0].score,100);assert.equal(p.records[0].stars,3);assert(p.extension.kept);
  for(const score of [NaN,Infinity,-1,1.5,'1',null,5001]){assert.throws(()=>C.recordCompletion(p,0,1,2,score));assert.throws(()=>C.validateProgress({...p,records:{0:{stars:1,coins:1,score}}}));}
});

test('the course assigns tables 2–9 to islands 1–8 and only those tables to the final review',()=>{
  let seed=123456;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const reviewTables=new Set();
  for(let index=0;index<9;index++)for(let sample=0;sample<60;sample++){
    // Legacy custom-table preferences must not replace the island's lesson.
    const w=new C.World(index,{tables:[1,10,11,12],random});
    assert.equal(w.level.questions,2);
    assert.deepEqual(w.tables,index<8?[index+2]:[2,3,4,5,6,7,8,9]);
    if(index<8)assert.equal(w.question.a,index+2);else{assert(w.tables.includes(w.question.a));reviewTables.add(w.question.a);}
    assert(w.question.b>=1&&w.question.b<=10);assert.equal(w.question.answer,w.question.a*w.question.b);
    assert.equal(new Set(w.choices).size,3);assert(w.choices.includes(w.question.answer));
  }
  assert.equal(reviewTables.size,8);
});

test('a completed six-island save continues at island seven and keeps all previous results',()=>{
  const legacy={schema:1,unlocked:6,tables:[2,3,4,5],practice:true,music:false,sound:true,bindings:{jump:'KeyU'},records:{},extension:{keep:'unchanged'}};
  for(let index=0;index<6;index++)legacy.records[index]={stars:index%4,coins:21+index,score:105+index,custom:'kept'};
  legacy.records['future-island']={opaque:['keep',42]};
  const data=new Map([['nina.isole.v1',JSON.stringify(legacy)]]),before=data.get('nina.isole.v1');
  const store=new C.ProgressStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)});
  let p=store.load();assert.equal(data.get('nina.isole.v1'),before,'loading never writes');
  assert.equal(p.unlocked,6);assert.equal(new C.World(p.unlocked).level.lesson,'Tabellina dell’8');
  for(let index=6;index<9;index++){
    p=C.recordCompletion(p,index,3,30,150);assert.equal(p.unlocked,index+1);assert(store.save(p));p=store.load();
    for(let old=0;old<6;old++)assert.deepEqual(p.records[old],legacy.records[old]);
  }
  assert.deepEqual(p.records['future-island'],legacy.records['future-island']);
  assert.deepEqual(p.tables,legacy.tables);assert.deepEqual(p.bindings,legacy.bindings);assert.deepEqual(p.extension,legacy.extension);
  assert.equal(p.music,false);assert.equal(p.practice,true);
  assert.throws(()=>C.recordCompletion(p,9,1,1));assert.throws(()=>C.validateProgress({...p,unlocked:10}));
});

test('future, malformed and denied storage preserve bytes; valid data reload and write failures report',()=>{
  const map=new Map(),adapter={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
  const s=new C.ProgressStore(adapter);let p=C.recordCompletion(s.load(),0,2,19,80);assert(s.save(p));assert.deepEqual(new C.ProgressStore(adapter).load(),p);
  const malformed=[null,[],{}, {...p,schema:2},{...p,tables:[]},{...p,records:{0:{stars:4,coins:2}}},{...p,records:{0:{stars:1,coins:2,score:'bad'}}}];
  for(const raw of ['{bad',...malformed.map(JSON.stringify)]){
    map.set('nina.isole.v1',raw);const broken=new C.ProgressStore(adapter);assert.equal(broken.load().unlocked,0);assert(!broken.save(C.defaults()));assert.equal(map.get('nina.isole.v1'),raw);assert(broken.warning);
  }
  const denied=new C.ProgressStore({getItem(){throw Error('denied');},setItem(){throw Error('denied');}});assert.equal(denied.load().unlocked,0);assert(!denied.save(p));
  const full=new C.ProgressStore({getItem:()=>null,setItem(){throw Error('quota');}});full.load();assert(!full.save(p));assert(full.warning);
});
