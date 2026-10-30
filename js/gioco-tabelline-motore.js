/* Nina — pure game rules. No DOM, dependencies or engine runtime. */
(function (root, factory) {
  const levels = typeof module === 'object' && module.exports ? require('./gioco-tabelline-livelli.js') : root.NinaLevels;
  const api = factory(levels);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NinaCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function (Levels) {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const toward = (a, b, d) => a < b ? Math.min(b, a + d) : Math.max(b, a - d);
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const DEFAULT_KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['ArrowUp', 'KeyW'], shoot: ['Space', 'KeyX', 'KeyJ'], interact: ['KeyE', 'Enter'], pause: ['Escape', 'KeyP'] };
  const NAMES = Levels.NAMES, COURSE = Levels.COURSE;
  const levelData = index => Levels.create(index);
  const defaults = () => ({schema:1,unlocked:0,tables:[2,3,4,5,6,7,8,9],practice:false,music:true,sound:true,records:{},bindings:{}});
  function validateProgress(raw) {
    if (!raw || raw.schema !== 1 || !Number.isInteger(raw.unlocked) || raw.unlocked<0 || raw.unlocked>NAMES.length) throw new Error('Formato dei progressi non compatibile');
    if (!Array.isArray(raw.tables) || !raw.tables.length || raw.tables.some(x=>!Number.isInteger(x)||x<1||x>12)) throw new Error('Tabelline non valide');
    for(const k of ['practice','music','sound']) if(typeof raw[k] !== 'boolean') throw new Error('Opzione non valida');
    if(!raw.records || typeof raw.records!=='object' || Array.isArray(raw.records)) throw new Error('Risultati non validi');
    for(const [k,v] of Object.entries(raw.records)) {
      if(!/^(0|[1-9]\d*)$/.test(k)||Number(k)>=NAMES.length) continue; // Preserve future extensions without using them.
      if(!v || !Number.isInteger(v.stars)||v.stars<0||v.stars>3||!Number.isInteger(v.coins)||v.coins<0||v.coins>200) throw new Error('Risultato non valido');
      if(v.score!==undefined&&(!Number.isInteger(v.score)||v.score<0||v.score>5000))throw new Error('Punteggio non valido');
    }
    const copy=JSON.parse(JSON.stringify(raw));
    copy.tables=[...new Set(copy.tables)].sort((a,b)=>a-b);
    copy.bindings=copy.bindings || {};
    if(typeof copy.bindings!=='object' || Array.isArray(copy.bindings)) throw new Error('Comandi non validi');
    for(const [k,v] of Object.entries(copy.bindings)) if(k in DEFAULT_KEYS && (typeof v!=='string'||!/^([A-Za-z0-9]{1,30})$/.test(v))) throw new Error('Tasto non valido');
    return copy;
  }
  function recordCompletion(progress,index,stars,coins,score=0) {
    if(!Number.isInteger(score)||score<0||score>5000)throw new Error('Punteggio non valido');
    if(!Number.isInteger(index)||index<0||index>=NAMES.length||!Number.isInteger(stars)||stars<0||stars>3||!Number.isInteger(coins)||coins<0||coins>200) throw new Error('Consegna non valida');
    const next=validateProgress(progress), old=next.records[index]||{stars:0,coins:0};
    next.records[index]={...old,stars:Math.max(old.stars,stars),coins:Math.max(old.coins,coins),score:Math.max(old.score||0,clamp(Math.floor(score),0,5000))};
    next.unlocked=Math.max(next.unlocked,index+1);
    return next;
  }
  function problem(tables,random=Math.random) {
    if(!tables.length || tables.some(x=>!Number.isInteger(x)||x<1||x>12)) throw new Error('Scegli una tabellina');
    const a=tables[clamp(Math.floor(random()*tables.length),0,tables.length-1)], b=clamp(1+Math.floor(random()*10),1,10);
    return {a,b,answer:a*b};
  }
  function checkAnswer(q,value) {return /^\d{1,3}$/.test(String(value).trim()) && Number(value)===q.answer;}
  class ProgressStore {
    constructor(storage,key='nina.isole.v1') {this.storage=storage;this.key=key;this.blocked=false;this.warning='';}
    load() {
      try {const text=this.storage.getItem(this.key);return text===null?defaults():validateProgress(JSON.parse(text));}
      catch(e) {this.blocked=true;this.warning='Progressi non disponibili: giochi in questa sessione. Il salvataggio esistente è conservato.';return defaults();}
    }
    save(data) {
      if(this.blocked) return false;
      try {this.storage.setItem(this.key,JSON.stringify(validateProgress(data)));this.warning='';return true;}
      catch(e) {this.warning='Il browser non ha salvato i progressi. Puoi continuare in questa sessione.';return false;}
    }
  }
  function answerChoices(q,random=Math.random) {
    const values=new Set([q.answer]);
    for(const d of [-q.a,q.a,1,-1,2,3]){const n=q.answer+d;if(n>0&&n!==q.answer)values.add(n);if(values.size===3)break;}
    const result=[...values];for(let i=result.length-1;i>0;i--){const j=clamp(Math.floor(random()*(i+1)),0,i);[result[i],result[j]]=[result[j],result[i]];}return result;
  }
  class World {
    constructor(index,options={}) {
      this.level=levelData(index);this.time=0;this.events=[];this.shots=[];this.mode='play';
      this.coins=0;this.stars=0;this.score=0;this.ammo=0;this.checkpoint=false;this.chestOpen=false;this.secretRevealed=false;
      this.solved=0;this.gateOpen=false;this.answerLock=0;this.answerFeedback='';this.lastAnswer=null;
      this.practice=options.practice??false;this.tables=[...this.level.tables];this.random=options.random||Math.random;
      this.question=problem(this.tables,this.random);this.choices=answerChoices(this.question,this.random);this.questionRevision=0;
      const spawn=this.level.spawn;
      this.player={x:spawn.x,y:spawn.y,vx:0,vy:0,face:1,hp:3,grounded:false,jumps:0,coyote:0,buffer:0,invincible:1.2,shotTimer:0,shootPose:0,hurtPose:0};
      this.enemies=this.level.enemies.map((e,i)=>({...e,baseY:e.y,dir:i%2?-1:1,hp:e.type===3?7+index:e.type===2?2:1,phase:0,guard:0,dead:0}));
      this.level.platforms.forEach(r=>Object.assign(r,{baseX:r.x,baseY:r.y,fallTime:0,fallVelocity:0,dx:0,dy:0}));
      this.level.blocks.forEach(r=>r.bump=0);this.camera=0;
    }
    emit(type,x=this.player.x,y=this.player.y,extra={}) {this.events.push({type,x,y,...extra});}
    body() {const p=this.player;return{x:p.x-12,y:p.y-43,w:24,h:43};}
    enemyBody(e) {const w=e.type===3?76:36,h=e.type===3?89:36;return{x:e.x-w/2,y:e.y-h,w,h};}
    bossAlive(){return this.enemies.some(e=>e.type===3&&e.hp>0);}
    answerBlocks(){return this.choices.map((value,i)=>({x:this.level.math.x-82+i*82-27,y:this.level.math.y-165,w:54,h:46,value}));}
    canAnswer(){return this.mode==='play'&&!this.gateOpen&&this.answerLock<=0&&!this.bossAlive()&&Math.abs(this.player.x-this.level.math.x)<260;}
    answer(value){
      if(!this.canAnswer()||!this.choices.includes(value))return false;
      this.lastAnswer=value;this.answerLock=.8;
      if(checkAnswer(this.question,String(value))){this.solved++;this.score+=25;this.answerFeedback='Giusto! +25 punti';this.emit('correct');if(this.solved>=this.level.questions){this.gateOpen=true;this.emit('gate_open');}}
      else {this.answerFeedback=`${this.question.a} × ${this.question.b} = ${this.question.answer}`;this.emit('wrong');if(!this.practice)this.mode='wrong';}
      this.questionRevision++;return true;
    }
    step(dt,input={}) {
      if(this.mode!=='play')return;dt=clamp(dt,0,1/30);this.time+=dt;const p=this.player;
      for(const k of ['invincible','shotTimer','shootPose','hurtPose'])p[k]=Math.max(0,p[k]-dt);
      if(this.answerLock>0){this.answerLock=Math.max(0,this.answerLock-dt);if(this.answerLock===0&&!this.gateOpen){if(this.lastAnswer===this.question.answer){const previous=this.question,available=this.tables.length>1?this.tables.filter(n=>n!==previous.a):this.tables;this.question=problem(available,this.random);if(this.question.a===previous.a&&this.question.b===previous.b){this.question.b=this.question.b%10+1;this.question.answer=this.question.a*this.question.b;}this.choices=answerChoices(this.question,this.random);this.answerFeedback='Ancora una risposta per il passaggio.';}else this.answerFeedback='Riprova: scegli un altro blocco.';this.lastAnswer=null;this.questionRevision++;}}
      this.updatePlatforms(dt);
      p.buffer=input.jumpPressed?.12:Math.max(0,p.buffer-dt);p.coyote=p.grounded?.10:Math.max(0,p.coyote-dt);if(p.grounded)p.jumps=0;
      const axis=(input.right?1:0)-(input.left?1:0);p.vx=toward(p.vx,axis*238,(axis?1650:2100)*dt);if(axis)p.face=axis;
      if(p.buffer>0&&(p.coyote>0||p.jumps<2)){
        const second=p.coyote<=0&&p.jumps>=1;if(p.coyote<=0&&p.jumps===0)p.jumps=1;
        p.vy=second?-440:-465;p.jumps++;p.buffer=0;p.coyote=0;p.grounded=false;this.emit(second?'double_jump':'jump');
      }
      if(input.jumpReleased&&p.vy<-180)p.vy*=.65;p.vy=Math.min(740,p.vy+1080*dt);this.move(dt);
      if(this.mode!=='play')return;
      if(input.shootPressed&&p.shotTimer<=0){
        if(this.ammo>0){this.ammo--;this.shots.push({x:p.x+p.face*22,y:p.y-31,vx:p.face*520,life:1.25,hostile:false});p.shotTimer=.22;p.shootPose=.2;this.emit('seed');}
        else this.emit('no_ammo');
      }
      this.stepEnemies(dt);this.stepShots(dt);
      if(this.mode!=='play')return;
      for(const c of this.level.coins)if(!c.taken&&Math.hypot(p.x-c.x,p.y-25-c.y)<28){c.taken=true;this.coins++;this.score++;this.emit('coin',c.x,c.y,{points:1});}
      for(const s of this.level.stars)if(!s.taken&&Math.hypot(p.x-s.x,p.y-25-s.y)<31){s.taken=true;this.stars++;this.score+=25;this.emit('star',s.x,s.y,{points:25});}
      for(const a of this.level.ammo)if(!a.taken&&Math.hypot(p.x-a.x,p.y-25-a.y)<29){a.taken=true;this.ammo+=15;this.emit('ammo',a.x,a.y);}
      const cp=this.level.checkpoint;
      if(!this.checkpoint&&Math.abs(p.x-cp.x)<38&&Math.abs(p.y-cp.y)<75){this.checkpoint=true;this.emit('checkpoint');}
      if(!this.secretRevealed&&overlap(this.body(),this.level.secret)){this.secretRevealed=true;this.emit('secret');}
      const c=this.level.chest;if(!this.chestOpen&&Math.abs(p.x-c.x)<40&&Math.abs(p.y-c.y)<34)this.openChest();
      for(const s of this.level.spikes)if(overlap(this.body(),s))this.hurt();
      for(const s of this.level.springs)if(p.vy>=0&&Math.abs(p.x-s.x)<23&&p.y>s.y-26&&p.y<s.y+3){p.y=s.y-24;p.vy=-690;p.jumps=1;p.grounded=false;this.emit('spring');}
      if(p.y>680){this.hurt(true);if(this.mode==='play')this.respawn(false);}
      if(input.interactPressed&&this.mode==='play')this.interact();
      if(this.gateOpen&&Math.abs(p.x-this.level.gate.x)<30&&Math.abs(p.y-this.level.gate.y)<75&&this.mode==='play'){this.mode='complete';this.emit('complete');}
      this.camera=toward(this.camera,clamp(p.x-420,0,this.level.width-(this.viewWidth||960)),dt*600);
    }
    updatePlatforms(dt){
      const p=this.player;
      for(const r of this.level.platforms){
        const stood=p.grounded&&Math.abs(p.y-r.y)<1&&p.x+12>r.x&&p.x-12<r.x+r.w,ox=r.x,oy=r.y;
        if(r.motion==='horizontal')r.x=r.baseX+Math.sin(this.time*2*Math.PI/(r.period||4))*(r.range||70);
        if(r.motion==='vertical')r.y=r.baseY+Math.sin(this.time*2*Math.PI/(r.period||5))*(r.range||45);
        if(r.motion==='orbit'){const phase=this.time*2*Math.PI/(r.period||7);r.x=r.baseX+Math.sin(phase)*(r.range||55);r.y=r.baseY+(1-Math.cos(phase))*(r.range||55)*.45;}
        if(r.motion==='falling'&&r.fallTime>0){
          r.fallTime+=dt;
          if(r.fallTime>.55){
            r.fallVelocity+=550*dt;
            const nextY=r.y+r.fallVelocity*dt;
            // Stop on the first surface below, including a thin one-way ledge.
            // Sweep the bottom edge so even a large fall step cannot tunnel.
            const landing=this.level.platforms.filter(other=>other!==r&&!other.motion&&r.x<other.x+other.w&&r.x+r.w>other.x&&other.y>=r.y+r.h-.01&&other.y<=nextY+r.h)
              .sort((a,b)=>a.y-b.y)[0];
            r.y=landing?landing.y-r.h:nextY;
            if(landing)r.fallVelocity=0;
          }
        }
        r.dx=r.x-ox;r.dy=r.y-oy;if(stood){p.x+=r.dx;p.y+=r.dy;if(r.y>620)p.grounded=false;}
      }
      for(const b of this.level.blocks)b.bump=Math.max(0,b.bump-dt);
    }
    move(dt){
      const p=this.player;p.x=clamp(p.x+p.vx*dt,12,this.level.width-12);
      if(!this.gateOpen)p.x=Math.min(p.x,this.level.gate.x-48);
      for(const r of this.level.platforms)if(!r.oneWay&&overlap(this.body(),r)){if(p.vx>0)p.x=r.x-12;else if(p.vx<0)p.x=r.x+r.w+12;p.vx=0;}
      const oldY=p.y;p.y+=p.vy*dt;p.grounded=false;
      for(const r of this.level.platforms)if(overlap(this.body(),r)){
        if(p.vy>=0&&oldY<=r.y+Math.abs(r.dy)+.2){p.y=r.y;p.vy=0;p.grounded=true;if(r.motion==='falling'&&r.fallTime===0)r.fallTime=.001;}
        else if(!r.oneWay&&p.vy<0&&oldY-43>=r.y+r.h-.1){p.y=r.y+r.h+43;p.vy=0;}
      }
      for(const b of this.level.blocks){
        if(!overlap(this.body(),b))continue;
        if(p.vy<0&&oldY-43>=b.y+b.h-.1){p.y=b.y+b.h+43;p.vy=0;this.hitBlock(b);}
        else if(p.vy>=0&&oldY<=b.y+.1){p.y=b.y;p.vy=0;p.grounded=true;}
      }
      if(this.canAnswer())for(const b of this.answerBlocks())if(p.vy<0&&p.x+12>b.x&&p.x-12<b.x+b.w&&oldY-43>=b.y+b.h-.2&&p.y-43<=b.y+b.h){p.y=b.y+b.h+43;p.vy=70;this.answer(b.value);break;}
    }
    hitBlock(b){if(b.remaining<=0||b.bump>0)return false;b.remaining--;b.bump=.22;this.coins++;this.score++;this.emit('block',b.x+b.w/2,b.y,{points:1});return true;}
    stepEnemies(dt){
      const p=this.player;
      for(const e of this.enemies){e.guard=Math.max(0,e.guard-dt);if(e.hp<=0){e.dead+=dt;continue;}
        const oldPhase=e.phase;e.phase=(e.phase+dt)%3.4;let speed=e.type===1?70:e.type===2?62:46;
        if(e.type===3){speed=e.phase<2.1?22:e.phase<2.65?185:0;if(oldPhase<2.1&&e.phase>=2.1){e.dir=p.x<e.x?-1:1;this.shots.push({x:e.x+e.dir*46,y:e.y-38,vx:e.dir*230,life:3,hostile:true});this.emit('boss');}}
        e.x+=e.dir*speed*dt;if(e.x<e.left){e.x=e.left;e.dir=1;}if(e.x>e.right){e.x=e.right;e.dir=-1;}
        e.y=e.baseY+(e.type===1?Math.sin(this.time*2.4)*25:e.type===2?-Math.max(0,Math.sin(this.time*3))*46:0);
        const body=this.enemyBody(e);if(overlap(this.body(),body)){if(p.vy>60&&p.y<body.y+19){p.vy=-340;p.jumps=1;this.damageEnemy(e);}else this.hurt();}
      }
    }
    stepShots(dt){
      for(const s of this.shots){const ox=s.x;s.x+=s.vx*dt;s.life-=dt;const sweep={x:Math.min(ox,s.x)-5,y:s.y-5,w:Math.abs(s.x-ox)+10,h:10};
        if(s.hostile){if(overlap(sweep,this.body())){this.hurt();s.life=0;}}
        else {for(const b of this.level.blocks)if(overlap(sweep,b)){this.hitBlock(b);s.life=0;break;}
          if(s.life>0)for(const e of this.enemies)if(e.hp>0&&overlap(sweep,this.enemyBody(e))){this.damageEnemy(e);s.life=0;break;}}
        if(this.level.platforms.some(r=>overlap(sweep,r)))s.life=0;
      }this.shots=this.shots.filter(s=>s.life>0);
    }
    damageEnemy(e){if(e.hp<=0||e.guard>0)return;e.hp--;e.guard=.22;this.emit('enemy',e.x,e.y-20);if(e.hp===0){const points=e.type===3?25:5;this.score+=points;this.emit(e.type===3?'boss_clear':'defeated',e.x,e.y-20,{points});}}
    hurt(force=false){const p=this.player;if(this.mode!=='play'||(!force&&p.invincible>0))return;p.hp--;p.invincible=1.5;p.hurtPose=.3;this.emit('hit');if(p.hp<=0){p.hp=0;this.mode='ko';this.emit('ko');}}
    respawn(full=true){
      const p=this.player,spawn=this.checkpoint?this.level.checkpoint:this.level.spawn;p.x=spawn.x+ (this.checkpoint?35:0);p.y=spawn.y;p.vx=0;p.vy=0;p.jumps=0;p.coyote=0;p.buffer=0;p.shotTimer=.2;p.invincible=1.8;p.grounded=false;
      if(full)p.hp=3;this.mode='play';this.shots=[];this.camera=clamp(p.x-420,0,this.level.width-(this.viewWidth||960));
      for(const r of this.level.platforms)if(r.motion==='falling'){r.x=r.baseX;r.y=r.baseY;r.fallTime=0;r.fallVelocity=0;}
    }
    openChest(){
      if(this.chestOpen)return;
      this.chestOpen=true;this.secretRevealed=true;this.coins+=12;this.score+=12;
      const before=this.player.hp;this.player.hp=Math.min(3,this.player.hp+1);
      this.emit('chest',this.level.chest.x,this.level.chest.y,{points:12,coins:12,hearts:this.player.hp-before});
    }
    interact(){const p=this.player,c=this.level.chest;if(!this.chestOpen&&Math.hypot(p.x-c.x,p.y-c.y)<70)this.openChest();else if(Math.abs(p.x-this.level.math.x)<600&&!this.gateOpen)this.emit(this.bossAlive()?'gate_locked':'math_help');}
  }
  return {World,levelData,defaults,validateProgress,recordCompletion,problem,answerChoices,checkAnswer,ProgressStore,DEFAULT_KEYS,NAMES,COURSE,clamp,overlap};
});
