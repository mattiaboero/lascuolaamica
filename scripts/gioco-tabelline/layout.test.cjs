'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../../js/gioco-tabelline-motore.js'),L=require('../../js/gioco-tabelline-livelli.js');
const atlas=JSON.parse(fs.readFileSync(path.join(__dirname,'../../js/gioco-tabelline-atlante.js'),'utf8').replace(/^window\.NINA_ATLAS = /,'').replace(/;\s*$/,''));
const DT=1/120;
const apart=(a,b,pad=0)=>a.x+a.w+pad<=b.x||b.x+b.w+pad<=a.x||a.y+a.h+pad<=b.y||b.y+b.h+pad<=a.y;
const sprite=(name,frame,x,bottom,height)=>{const r=atlas[name][frame],width=height*r[2]/r[3];return{x:x-width/2,y:bottom-height,w:width,h:height};};
const union=rects=>{const x=Math.min(...rects.map(r=>r.x)),y=Math.min(...rects.map(r=>r.y));return{x,y,w:Math.max(...rects.map(r=>r.x+r.w))-x,h:Math.max(...rects.map(r=>r.y+r.h))-y};};
function renderedObjects(level){
  // Bounds independently reconstructed from renderer heights and the actual atlas.
  // Bobs and both chest/gate states are included, not only an instant screenshot.
  const out=[],put=(kind,index,box)=>out.push({...box,kind,id:`${kind}-${index}`});
  level.coins.forEach((p,i)=>put('coin',i,union([6,7,8].flatMap(f=>[-2,2].map(b=>sprite('props',f,p.x,p.y+12+b,23))))));
  level.stars.forEach((p,i)=>put('star',i,union([-3,3].map(b=>sprite('props',9,p.x,p.y+17+b,34)))));
  level.ammo.forEach((p,i)=>put('ammo',i,union([-2,2].map(b=>sprite('rewards-v3',2,p.x,p.y+17+b,34)))));
  level.blocks.forEach((b,i)=>put('block',i,{x:b.x,y:b.y-6,w:b.w,h:b.h+6}));
  level.decor.forEach((p,i)=>put('decor',i,sprite('props',p.type,p.x,p.y,25)));
  level.spikes.forEach((p,i)=>put('spike',i,p));
  level.springs.forEach((p,i)=>put('spring',i,sprite('props',22,p.x,p.y,27)));
  for(const [kind,frames,height] of [['gate',[15,16],126],['checkpoint',[17],76],['sign',[12],55]]){
    const p=level[kind];put(kind,0,union(frames.map(f=>sprite('props',f,p.x,p.y,height))));
  }
  put('chest',0,union([sprite('props',13,level.chest.x,level.chest.y,43),sprite('chest-empty',0,level.chest.x,level.chest.y,56)]));
  put('turbine',0,sprite('turbine-v3',0,level.turbine.x,level.turbine.y,139));
  put('math',0,{x:level.math.x-200,y:150,w:400,h:250});
  return out;
}
function advance(w,targetX,goal=()=>true,allowJump=true){
  let ticks=0;
  while(!(Math.abs(w.player.x-targetX)<5&&goal())&&ticks<3000){
    const p=w.player,axis=Math.abs(p.x-targetX)<5?0:p.x<targetX?1:-1;
    const jump=allowJump&&p.x<3050&&(p.grounded||(p.jumps===1&&p.vy>-45));
    w.step(DT,{right:axis>0,left:axis<0,jumpPressed:jump});ticks++;
    if(w.mode!=='play')break;
  }
  assert(ticks<3000,`path stalled at ${w.player.x.toFixed(2)},${w.player.y.toFixed(2)} toward ${targetX}`);
  return ticks;
}

test('all nine authored maps validate and are independent data objects',()=>{
  const fingerprints=[];
  for(let i=0;i<L.NAMES.length;i++){
    const level=L.create(i);assert.deepEqual(L.validate(level),[],`island ${i+1}`);
    fingerprints.push(JSON.stringify(level.platforms));const other=L.create(i);level.coins[0].taken=true;level.platforms[0].x=99;
    assert.equal(other.coins[0].taken,false);assert.equal(other.platforms[0].x,0);
    assert.equal(other.stars.length,3);assert.equal(other.questions,2);
  }
  assert.equal(new Set(fingerprints).size,9);assert.throws(()=>L.create(9));assert.throws(()=>L.create(-1));
});

test('animated collectible extents stay separate from stars, treasure, signs and decoration',()=>{
  const conflicts=[];
  for(let i=0;i<L.NAMES.length;i++){
    const objects=renderedObjects(L.create(i));
    for(let a=0;a<objects.length;a++)for(let b=a+1;b<objects.length;b++){
      const one=objects[a],two=objects[b];
      if(!apart(one,two,8))conflicts.push(`island ${i+1}: actual rendered ${one.id} / ${two.id} overlap or lack 8px clearance`);
    }
    for(const obj of objects){assert(obj.x>=0,`${obj.id} clipped by left edge`);assert(obj.y>=0,`${obj.id} clipped by top edge`);assert(obj.x+obj.w<=3860,`${obj.id} clipped by right edge`);}
  }
  assert.deepEqual(conflicts,[]);
});

test('layout validator catches the original coin/star, coin/chest and coin/sign overlap regressions',()=>{
  for(const kind of ['star','chest','sign']){
    const level=L.create(0),target=kind==='star'?level.stars[0]:level[kind];
    level.coins.push({x:target.x,y:target.y-(kind==='star'?0:25),taken:false});
    assert(L.validate(level).some(e=>e.includes('Spazio insufficiente')||e.includes('Stella troppo vicina')),kind);
  }
});

test('teaching area has a continuous safe floor, visible answer geometry and an uncluttered gate',()=>{
  for(let i=0;i<L.NAMES.length;i++){
    const w=new C.World(i,{tables:[2],random:()=>0});
    assert(w.level.platforms.some(r=>!r.oneWay&&r.x<=3020&&r.x+r.w>=3860&&r.y===448));
    assert(w.level.gate.x>w.level.math.x+250);
    for(const b of w.answerBlocks()){
      assert.equal(b.y,283);assert.equal(b.h,46);assert(b.x>w.level.math.x-200&&b.x+b.w<w.level.math.x+200);
      assert(b.y+b.h<w.level.math.y-43,'enough headroom before a deliberate jump');
    }
    const clutter=renderedObjects(w.level).filter(o=>!['math','gate'].includes(o.kind));
    assert(clutter.every(o=>o.x+o.w<3020));
  }
});

test('moving paths stay clear for their entire cycle, including room above Nina',()=>{
  for(let index=0;index<L.NAMES.length;index++){
    const w=new C.World(index),moving=w.level.platforms.filter(r=>r.motion);
    for(const r of moving)if(r.motion==='falling')r.fallTime=.001;
    // Two complete cycles of the longest orbit. Runtime positions, not the
    // authoring validator's formula, are the evidence used here.
    for(let frame=0;frame<1440;frame++){
      w.time+=DT;w.updatePlatforms(DT);
      for(const r of moving){
        const occupied={x:r.x,y:r.y-72,w:r.w,h:r.h+72};
        for(const fixed of w.level.platforms.filter(p=>!p.motion))assert(apart(occupied,fixed),`island ${index+1}, ${r.motion} at ${w.time}: platform / rider intersects fixed ledge ${fixed.x}`);
        for(const other of moving)if(other!==r)assert(apart(occupied,other),`island ${index+1}: crossing moving platforms`);
      }
    }
  }
});

test('the layout validator rejects the reported low block and crossing platform paths',()=>{
  const low=L.create(0);low.blocks[0].y=287;
  assert(L.validate(low).some(e=>e.includes('Spazio salto insufficiente')));
  const crossing=L.create(1),r=crossing.platforms.find(p=>p.motion);
  r.x=1360;r.w=135;
  assert(L.validate(crossing).some(e=>e.includes('Percorso mobile ostruito')));
});

test('every reward block has visible headroom, clear coin spacing and a real jump solution',()=>{
  let count=0;
  for(let index=0;index<L.NAMES.length;index++)for(let which=0;which<L.create(index).blocks.length;which++){
    const w=new C.World(index),b=w.level.blocks[which];w.enemies=[];w.level.spikes=[];
    const support=w.level.platforms.filter(r=>!r.motion&&b.x+b.w/2>r.x&&b.x+b.w/2<r.x+r.w&&r.y>b.y+b.h).sort((a,b)=>a.y-b.y)[0];
    assert(support.y-b.y-b.h>=96);
    for(const c of w.level.coins)assert(apart(b,{x:c.x-14,y:c.y-14,w:28,h:28},32));
    Object.assign(w.player,{x:b.x+b.w/2,y:support.y,vx:0,vy:0,grounded:true});
    const remaining=b.remaining;w.step(DT,{jumpPressed:true});
    for(let t=0;t<120;t++)w.step(DT);
    assert.equal(b.remaining,remaining-1,`island ${index+1}, block ${which+1}`);count++;
  }
  assert.equal(count,21);
});

for(let index=0;index<L.NAMES.length;index++)test(`island ${index+1}: replay from spawn collects all three stars, answers by jumping and walks through the gate`,()=>{
  const w=new C.World(index,{tables:[2],practice:false,random:()=>0});
  // Geometry test: hazards are neutralized, while all platforms, walls, springs,
  // blocks and gravity stay exactly as shipped. No position/velocity assignment.
  w.enemies=[];w.level.spikes=[];
  const spawn={x:w.player.x,y:w.player.y};assert.deepEqual(spawn,w.level.spawn);
  let ticks=0;
  for(const s of w.level.stars){ticks+=advance(w,s.x,()=>s.taken);assert(s.taken);assert.equal(w.mode,'play');}
  assert.equal(w.stars,3);assert.equal(w.events.filter(e=>e.type==='star').length,3);
  ticks+=advance(w,w.level.math.x,()=>w.player.grounded);assert.equal(w.mode,'play');
  const before=w.score;
  for(let answer=0;answer<w.level.questions;answer++){
    const b=w.answerBlocks().find(b=>b.value===w.question.answer);assert(b);
    ticks+=advance(w,b.x+b.w/2,()=>w.player.grounded,false);
    w.step(DT,{jumpPressed:true});ticks++;
    for(let wait=0;wait<120&&w.solved===answer&&w.mode==='play';wait++){w.step(DT);ticks++;}
    assert.equal(w.solved,answer+1);assert.equal(w.mode,'play');assert.equal(w.score,before+25*(answer+1));
    for(let wait=0;wait<120;wait++){w.step(DT);ticks++;}
  }
  assert(w.gateOpen);assert.equal(w.events.filter(e=>e.type==='complete').length,0);
  ticks+=advance(w,w.level.gate.x,()=>false,false);
  assert.equal(w.mode,'complete');assert.equal(w.events.filter(e=>e.type==='complete').length,1);
  assert.equal(w.player.hp,3,'route must not fall and respawn');assert.equal(w.events.filter(e=>e.type==='hit').length,0);
  assert(ticks<6000,'complete replay should fit within 50 seconds of simulation');
});
