/* Nina e le isole del vento: Canvas 2D, controlli DOM nativi e audio locale.
   Versione per lascuolaamica.it: il DOM si costruisce con createElement (CSP con Trusted Types),
   asset in /assets/gioco-tabelline/, timer di gioco facoltativo del sito. */
/* global Audio, ResizeObserver */
(() => {
  'use strict';
  const C=window.NinaCore, $=id=>document.getElementById(id);
  const canvas=$('game'), ctx=canvas.getContext('2d',{alpha:false}), stage=$('stage'), ui=$('interface'), screen=$('screen');
  const images={}, held=new Set(), pressed=new Set(), released=new Set(), physical=new Set();
  const memory=new Map(), params=new URLSearchParams(location.search), testMode=params.has('test');
  const playerCtx=$('player-overlay').getContext('2d');
  const storage=testMode?{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)}:{getItem:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},setItem:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){/* memoria piena o navigazione privata */}}};
  const store=new C.ProgressStore(storage);let progress=store.load();
  let world=null, mode='loading', returnMenu='title', pendingBind=null;
  let toastTime=0, lastFrame=0, accumulator=0, animationTime=0, music=null, musicBiome=-1, audioUnlocked=false;
  let particles=[], hudCache='', mathCache='', effects=[];
  const labels={left:'Vai a sinistra',right:'Vai a destra',jump:'Salto / doppio salto',shoot:'Lanciasemi',interact:'Interagisci',pause:'Pausa'};
  const keyName=code=>({Space:'Spazio',ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',Escape:'Esc',Enter:'Invio',Backspace:'⌫'}[code]||code.replace(/^Key|^Digit/,''));
  const keys=action=>progress.bindings[action]?[progress.bindings[action]]:C.DEFAULT_KEYS[action];
  const keyLabel=action=>keys(action).map(keyName).join(' / ');
  const bind=(id,fn)=>$(id).addEventListener('click',fn);
  // Costruisce un elemento senza passare da HTML: attributi, poi figli (testo, nodi o liste).
  function el(tag,attrs,...children){
    const node=document.createElement(tag);
    for(const [k,v] of Object.entries(attrs||{})){
      if(v===false||v===null||v===undefined)continue;
      if(k==='class')node.className=v;else if(v===true)node.setAttribute(k,'');else node.setAttribute(k,String(v));
    }
    for(const c of children.flat(Infinity)){if(c===null||c===undefined||c===false)continue;node.append(c instanceof Node?c:String(c));}
    return node;
  }
  const br=()=>el('br');
  // Il timer di gioco facoltativo del sito (pannello Info): con il timer acceso
  // si gioca 30 minuti, poi 60 di pausa. Senza shared.js il gioco parte comunque.
  function ensurePlayWindow(){
    const api=window.SA&&window.SA.playWindow;
    if(!api||typeof api.ensureActive!=='function')return Promise.resolve(true);
    return api.ensureActive();
  }
  async function play(index){if(await ensurePlayWindow())startLevel(index);}
  function clearInput(){held.clear();pressed.clear();released.clear();physical.clear();}
  function setMode(next){mode=next;clearInput();accumulator=0;pendingBind=null;screen.replaceChildren();$('math-station').hidden=next!=='play';$('hud').hidden=!world||next==='title'||next==='map';$('touch-controls').classList.toggle('inactive',next!=='play');musicVolume();}
  function persist(){store.save(progress);updateFooter();}
  function updateFooter(){$('footer-status').textContent=store.warning|| (testMode?'Anteprima di collaudo · Progressi temporanei':'Tastiera, mouse o touch · Progressi sul tuo browser');}
  function toast(message,seconds=3){$('toast').textContent=message;$('toast').hidden=false;toastTime=seconds;}
  // Larghezza della scena in punti di gioco. L'altezza e' sempre 540. Su
  // computer e tablet la scena e' 960x540 (16:9); sul telefono in orizzontale
  // il riquadro e' piu' largo e la scena si allarga con lui, fino a 1500 punti:
  // si vede piu' isola ai lati, con Nina grande quanto permette l'altezza.
  const panoramico=window.matchMedia('(pointer: coarse) and (orientation: landscape) and (max-height: 500px)');
  let VW=960;
  function resize(){
    const box=stage.getBoundingClientRect();
    const larga=panoramico.matches&&box.height>0?Math.max(960,Math.min(1500,Math.round(540*box.width/box.height))):960;
    if(larga!==VW||canvas.width!==larga){
      VW=larga;canvas.width=VW;$('player-overlay').width=VW;
      ui.style.width=`${VW}px`;ui.style.setProperty('--nina-extra',`${VW-960}px`);
      if(world)world.viewWidth=VW;
    }
    const scale=Math.min(box.width/VW,box.height/540);
    ui.style.transformOrigin='top left';ui.style.left=`${(box.width-VW*scale)/2}px`;ui.style.top=`${(box.height-540*scale)/2}px`;ui.style.transform=`scale(${scale})`;
  }
  panoramico.addEventListener('change',resize);
  new ResizeObserver(resize).observe(stage);document.addEventListener('fullscreenchange',resize);
  // Su iPhone Safari non mette a schermo intero niente che non sia un video:
  // il pulsante li' non farebbe nulla, quindi non si mostra.
  if(!document.fullscreenEnabled)$('fullscreen').hidden=true;
  bind('fullscreen',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.game-shell').requestFullscreen();}catch(e){$('footer-status').textContent='Schermo intero non disponibile in questo browser.';}});
  function unlockAudio(){audioUnlocked=true;playMusic(world?world.level.biome:0);}
  function musicVolume(){if(music)music.volume=progress.music?(mode==='play'?.24:.13):0;}
  function playMusic(biome){
    if(!audioUnlocked)return;
    if(musicBiome!==biome){if(music)music.pause();music=new Audio(`/assets/gioco-tabelline/audio/theme_${biome}.m4a`);music.loop=true;musicBiome=biome;}
    musicVolume();if(progress.music&&music.paused)music.play().catch(()=>{$('footer-status').textContent='Premi un pulsante per attivare la musica.';});
    if(!progress.music)music.pause();
  }
  function sound(name){
    if(!audioUnlocked||!progress.sound)return;
    effects=effects.filter(a=>!a.ended&&!a.paused);if(effects.length>9){effects.shift().pause();}
    const a=new Audio(`/assets/gioco-tabelline/audio/${name}.wav`);a.volume=name==='coin'?.2:.34;effects.push(a);a.play().catch(()=>{});
  }
  function sprite(context,atlas,index,x,y,height,flip=false,alpha=1,width=null){
    const rect=window.NINA_ATLAS[atlas][index], image=images[atlas];if(!image||!rect)return;
    const [sx,sy,sw,sh]=rect,w=width||height*sw/sh;
    context.save();context.imageSmoothingEnabled=false;context.globalAlpha=alpha;
    context.translate(Math.round(x),Math.round(y));if(flip)context.scale(-1,1);
    context.drawImage(image,sx,sy,sw,sh,Math.round(-w/2),-height,Math.round(w),height);context.restore();
  }
  function icon(atlas,index,width,height,className=''){
    const c=document.createElement('canvas');c.width=width;c.height=height;c.className=`sprite-canvas ${className}`;c.setAttribute('aria-hidden','true');
    const r=window.NINA_ATLAS[atlas][index], h=Math.min(height,width*r[3]/r[2]);
    sprite(c.getContext('2d'),atlas,index,width/2,(height+h)/2,h);return c;
  }
  function addIcon(selector,atlas,index,w,h,cls=''){screen.querySelector(selector)?.append(icon(atlas,index,w,h,cls));}
  function dialog(title,body,cls=''){
    screen.replaceChildren(el('div',{class:'shade'},el('section',{class:`panel dialog ${cls}`.trim(),role:'dialog','aria-modal':'true','aria-labelledby':'dialog-title'},el('h2',{id:'dialog-title'},title),body)));
  }
  function title(){
    world=null;setMode('title');playMusic(0);updateFooter();
    screen.replaceChildren(el('section',{class:'title-screen'},
      el('span',{class:'eyebrow'},'UNA PICCOLA RIPARATRICE. UNA GRANDE AVVENTURA.'),
      el('p',{class:'game-logo'},'NINA'),
      el('h2',{},'E LE ISOLE DEL VENTO'),
      el('p',{class:'description'},'Salta tra le nuvole, raccogli le stelle.',br(),'Le tabelline fanno girare il mondo.'),
      el('button',{id:'start',class:'primary start'},progress.unlocked?'CONTINUA IL VIAGGIO →':'PARTI PER L’AVVENTURA →'),
      el('button',{id:'map',class:'map-button'},'LE ISOLE'),
      el('button',{id:'options',class:'options-button'},'OPZIONI'),
      el('button',{id:'help',class:'help-button'},'COME SI GIOCA ?'),
      el('span',{class:'chapter-note'},'9 ISOLE · TABELLINE DAL 2 AL 9'),
      el('div',{id:'hero-art'}),el('div',{id:'island-art'}),el('div',{id:'star-art'})));
    addIcon('#hero-art','nina',0,160,211,'title-hero');addIcon('#island-art','props',0,307,128,'title-island');addIcon('#star-art','props',9,46,46,'title-star');
    if(store.warning){const warning=document.createElement('p');warning.className='save-warning';warning.textContent=store.warning;screen.firstChild.append(warning);}
    bind('start',()=>{unlockAudio();play(Math.min(progress.unlocked,C.NAMES.length-1));});bind('map',showMap);bind('options',()=>options('title'));bind('help',()=>help('title'));
  }
  function showMap(){
    world=null;setMode('map');
    screen.replaceChildren(el('section',{class:'map-screen'},
      el('h2',{},'Le nove isole delle tabelline'),
      el('p',{},'Due risposte per aprire ogni passaggio. Tre stelle da cercare.'),
      el('div',{class:'map-grid'},C.COURSE.map((lesson,i)=>{const r=progress.records[i],open=i<=progress.unlocked;return el('article',{class:'panel island-card'},
        el('h3',{},`${i+1}. ${lesson.label}`),
        el('p',{class:'island-name'},lesson.name),
        el('p',{class:'island-progress'},r?'★'.repeat(r.stars)+'☆'.repeat(3-r.stars)+` · ${r.coins} monete`:open?'Da esplorare':'Completa l’isola precedente'),
        el('button',{'data-level':i,'aria-label':`Esplora isola ${i+1}: ${lesson.label}`,disabled:!open},open?'ESPLORA →':'DA RAGGIUNGERE'));})),
      el('button',{id:'back-title',class:'map-back'},'← TORNA A CASA')));
    screen.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{unlockAudio();play(Number(b.dataset.level));});bind('back-title',title);
  }
  // Telefono: in verticale il gioco e' coperto dall'invito a girarlo (CSS). Se
  // lo si gira in verticale durante la partita, la partita va in pausa.
  const verticale=window.matchMedia('(pointer: coarse) and (orientation: portrait) and (max-width: 600px)');
  verticale.addEventListener('change',e=>{if(e.matches){clearInput();if(mode==='play')pause();}});
  // Sul touch la pagina ha sopra intestazione e briciole: all'inizio di
  // un'isola il gioco viene portato in cima allo schermo.
  const touch=window.matchMedia('(pointer: coarse)');
  function startLevel(index){if(touch.matches)document.querySelector('.nina-game').scrollIntoView({block:'start'});world=new C.World(index,{practice:progress.practice});world.viewWidth=VW;particles=[];hudCache='';mathCache='';setMode('play');playMusic(world.level.biome);canvas.focus();toast(index===0?'Tabellina del 2 · ↑ salta, premi ancora ↑ per il doppio salto':`${index+1}. ${world.level.name} · ${world.level.lesson}`,3.5);updateHUD();}
  function resume(){setMode('play');canvas.focus();}
  function pause(){
    if(!world||mode!=='play')return;setMode('pause');
    dialog('Una pausa tra le nuvole',[el('p',{class:'island-subtitle'},world.level.name),el('div',{class:'stack'},el('button',{id:'resume',class:'primary'},'RIPRENDI →'),el('button',{id:'settings'},'OPZIONI E COMANDI'),el('button',{id:'help-pause'},'COME SI GIOCA'),el('button',{id:'exit'},'TORNA AL TITOLO')),el('p',{class:'fine'},'I risultati si salvano entrando nella porta aperta.')]);
    bind('resume',resume);bind('settings',()=>options('pause'));bind('help-pause',()=>help('pause'));bind('exit',()=>confirmExit());$('resume').focus();
  }
  function confirmExit(){setMode('confirm-exit');dialog('Tornare a casa?',[el('p',{},'Le stelle e le monete di questa isola non sono ancora salvate.',br(),'I risultati delle isole completate restano con te.'),el('div',{class:'actions'},el('button',{id:'stay',class:'primary'},'CONTINUA'),el('button',{id:'leave'},'TORNA AL TITOLO'))]);bind('stay',resume);bind('leave',title);}
  function returnTo(where){if(where==='pause'){mode='play';pause();}else title();}
  function options(back='title'){
    returnMenu=back;setMode('options');unlockAudio();
    dialog('Scegli il tuo vento',[el('div',{class:'course-explainer'},el('p',{},'Le isole 1–8 allenano, in ordine, le tabelline dal 2 al 9.'),el('p',{},'La nona isola è un ripasso misto.',br(),el('b',{},'Due domande finali in ogni isola.'))),el('button',{id:'practice',class:'settings-mode'},progress.practice?'ALLENAMENTO · puoi riprovare la risposta':'AVVENTURA · un errore riavvia l’isola'),el('div',{class:'settings-row'},el('button',{id:'music'},`MUSICA: ${progress.music?'SÌ':'NO'}`),el('button',{id:'sound'},`SUONI: ${progress.sound?'SÌ':'NO'}`)),el('div',{class:'settings-row settings-bottom'},el('button',{id:'keys'},'COMANDI'),el('button',{id:'done',class:'primary'},'FATTO →')),el('p',{class:'fine'},'Puoi rigiocare le isole sbloccate dalla mappa.')],'modal-wide');
    bind('practice',()=>{progress.practice=!progress.practice;if(world)world.practice=progress.practice;persist();options(back);});
    bind('music',()=>{progress.music=!progress.music;persist();options(back);playMusic(world?world.level.biome:0);});
    bind('sound',()=>{progress.sound=!progress.sound;persist();options(back);if(progress.sound)sound('coin');});
    bind('keys',()=>bindings(back));bind('done',()=>returnTo(back));
  }
  function bindings(back){
    setMode('bindings');returnMenu=back;
    dialog('Comandi su misura',[Object.keys(labels).map(k=>el('div',{class:'binding-row'},el('span',{},labels[k]),el('button',{'data-bind':k},keyLabel(k)))),el('p',{class:'binding-status',id:'binding-status'},'Premi un comando, poi il nuovo tasto. Esc annulla la scelta.',br(),'Il clic nell’area di gioco lancia sempre un seme.'),el('div',{class:'actions'},el('button',{id:'reset-keys'},'RIPRISTINA'),el('button',{id:'back-settings',class:'primary'},'FATTO →'))],'modal-wide');
    screen.querySelectorAll('[data-bind]').forEach(b=>b.onclick=()=>{pendingBind=b.dataset.bind;$('binding-status').textContent=`Premi il nuovo tasto per “${labels[pendingBind]}”.`;});
    bind('reset-keys',()=>{progress.bindings={};persist();bindings(back);});bind('back-settings',()=>options(back));
  }
  function help(back){
    setMode('help');returnMenu=back;
    dialog('Una riparatrice tra le nuvole',[el('div',{id:'help-portrait'}),el('div',{class:'readable'},el('p',{},el('b',{},`${keyLabel('left')} · ${keyLabel('right')}`),' per camminare.',br(),el('b',{},keyLabel('jump')),' per saltare: premi di nuovo in aria per il doppio salto.'),el('p',{},el('b',{},keyLabel('shoot')),' o clic: un seme per pressione.',br(),el('b',{},keyLabel('interact')),': aiuto o baule vicino.',br(),el('b',{},keyLabel('pause')),': fai una pausa.'),el('p',{},'Raccogli scorte da 15 semi. Alla porta risolvi due domande della tabellina dell’isola: salta sotto i numeri giusti, poi entra. La nona isola è un ripasso dal 2 al 9.')),el('button',{id:'understood',class:'primary understood'},'PRONTA, NINA! →')],'modal-wide');
    addIcon('#help-portrait','nina',15,115,145,'portrait');bind('understood',()=>returnTo(back));
  }
  function updateMathStation(){
    const station=$('math-station');
    if(!world||mode!=='play'||world.level.math.x-world.camera>VW+240||world.level.math.x-world.camera<-250){station.hidden=true;return;}
    station.hidden=false;station.style.left=`${world.level.math.x-world.camera-200}px`;
    const locked=world.bossAlive(),enabled=world.canAnswer();
    const cache=`${world.questionRevision}/${locked}/${world.gateOpen}/${enabled}/${world.practice}`;
    if(cache===mathCache)return;mathCache=cache;
    const q=world.question;
    station.replaceChildren(
      el('h3',{},world.gateOpen?'IL PASSAGGIO È APERTO':world.lastAnswer===q.answer?`GIUSTO · ${world.solved} / ${world.level.questions}`:locked?'CALMA PRIMA IL CUSTODE':`${world.level.lesson.toUpperCase()} · ${world.solved+1}/${world.level.questions}`),
      el('p',{class:'question-line'},`${q.a} × ${q.b} = ${world.gateOpen||world.lastAnswer===q.answer?q.answer+' ✓':'?'}`),
      el('div',{class:'answer-blocks'},world.choices.map((n,i)=>{const b=el('button',{'data-answer':n,class:`answer-block ${world.lastAnswer===n?(n===q.answer?'correct':'incorrect'):''}`.trim(),disabled:!enabled,'aria-label':`Risposta ${n}. Salta sotto questo blocco o premi qui.`},n);b.style.left=`${88+i*82}px`;return b;})),
      el('p',{class:'math-note',role:'status'},world.gateOpen?'Cammina dentro la porta →':locked?'Usa i semi oppure salta sul custode.':world.answerFeedback||'Salta sotto il numero giusto ↑'),
      el('span',{class:'math-mode'},world.practice?'ALLENAMENTO · PUOI RIPROVARE':'AVVENTURA · UN ERRORE RIAVVIA L’ISOLA'));
    station.querySelectorAll('[data-answer]').forEach(button=>button.onclick=e=>{e.stopPropagation();if(world.answer(Number(button.dataset.answer))){handleEvents();updateMathStation();}canvas.focus();});
  }
  function wrongAnswer(){
    if(world.practice){toast('Risposta da rivedere. Riprova saltando sotto un altro numero.');return;}
    setMode('wrong');const q=world.question;
    dialog('Il vento fa un altro giro',[el('p',{class:'wrong-equation'},`${q.a} × ${q.b} = `,el('b',{},q.answer)),el('p',{},'Questa era la risposta giusta.',br(),'In modalità Avventura riparti dall’inizio dell’isola.'),el('div',{class:'actions'},el('button',{id:'retry-math',class:'primary'},'RIPROVA L’ISOLA'),el('button',{id:'wrong-title'},'TORNA AL TITOLO'))]);
    bind('retry-math',()=>play(world.level.index));bind('wrong-title',title);
  }
  function complete(){
    progress=C.recordCompletion(progress,world.level.index,world.stars,world.coins,world.score);persist();setMode('complete');sound('win');
    const last=world.level.index===C.NAMES.length-1;
    dialog(last?'Il vento è tornato!':'Un’altra isola torna a respirare',[el('div',{class:'success-content'},el('div',{id:'victory-portrait'}),el('div',{class:'summary'},el('p',{class:'success-title'},last?'Hai riacceso il cuore delle isole.':world.level.name),el('div',{class:'award-stars',id:'awards'}),el('p',{},`${world.score} punti`,br(),`${world.coins} monete · ${world.stars} / 3 stelle`))),el('p',{class:'fine'},store.warning||'Risultati salvati. Puoi tornare a cercare le stelle mancanti.'),el('div',{class:'actions'},el('button',{id:'replay'},'RIGIOCA'),el('button',{id:'win-map'},'LE ISOLE')),el('button',{id:'next',class:'primary'},last?'ESPLORA LE TUE ISOLE →':'VERSO LA PROSSIMA ISOLA →')],'complete-dialog modal-wide');
    addIcon('#victory-portrait','nina',22,130,165);
    for(let i=0;i<3;i++)$('awards').append(icon('props',9,61,61,i<world.stars?'':'empty'));
    bind('next',()=>last?showMap():play(world.level.index+1));bind('replay',()=>play(world.level.index));bind('win-map',showMap);
  }
  function knockout(){
    setMode('ko');dialog('Una sosta per ripartire',[el('p',{},'Nina si rimette in piedi.',br(),world.checkpoint?'Riparti dalla bandierina.':'Riparti dall’inizio dell’isola.'),el('p',{class:'fine'},'Monete, stelle e nemici già sconfitti restano come li hai lasciati.'),el('div',{class:'actions'},el('button',{id:'retry',class:'primary'},'RIPROVA →'),el('button',{id:'ko-title'},'TORNA AL TITOLO'))]);
    bind('retry',()=>{world.respawn();resume();});bind('ko-title',title);
  }
  function handleEvents(){
    for(const event of world.events.splice(0)){
      const {type,x,y}=event;
      if(['jump','double_jump','seed','coin','star','hit','enemy','checkpoint'].includes(type))sound(type);
      if(['coin','star','enemy','defeated','boss_clear','chest','checkpoint','block','ammo'].includes(type))for(let i=0;i<(type==='star'?18:7);i++)particles.push({x,y,vx:(Math.random()-.5)*160,vy:-Math.random()*130-20,life:.5+Math.random()*.4,color:type==='enemy'?'#9ac081':'#f2c164'});
      if(type==='checkpoint')toast('Punto di ripartenza attivato.');
      if(type==='star')toast(`Stella del vento! +25 punti · ${world.stars} / 3`,2);
      if(type==='chest'){sound('star');toast(`Premio raccolto: +${event.coins} monete${event.hearts?' · +1 cuore':''}!`,4);}
      if(type==='secret')toast('Hai trovato un passaggio nascosto!');
      if(type==='ammo'){sound('coin');toast('+15 semi per il lanciasemi. Spazio o X: un colpo.');}
      if(type==='block')sound('coin');if(type==='spring')sound('double_jump');
      if(type==='no_ammo')toast(world.level.index===0?'Qui bastano i salti. I semi arrivano sulle prossime isole.':'Hai finito i semi. Cerca una scorta o salta sui nemici.',2.5);
      if(type==='boss_clear'){sound('win');toast('Custode disattivato! Ora risolvi la tabellina.');}
      if(type==='gate_locked')toast('Calma prima il custode con i semi o saltandogli sopra.');
      if(type==='math_help')toast('La domanda è davanti alla porta. Salta sotto il numero giusto.');
      if(type==='correct'){sound('gate');toast('Risposta corretta! +25 punti.',2);}
      if(type==='gate_open')toast('Porta aperta! Cammina dentro per completare l’isola.',3);
      if(type==='wrong'){sound('wrong');wrongAnswer();}
      if(type==='complete')complete();if(type==='ko')knockout();
    }
  }
  function updateHUD(){
    if(!world)return;const p=world.player,key=`${p.hp}-${world.coins}-${world.stars}-${world.ammo}-${world.score}-${world.level.index}`;
    if(key!==hudCache){hudCache=key;$('lesson-label').textContent=world.level.lesson.toUpperCase();$('hearts').replaceChildren(...Array.from({length:3},(_,i)=>icon('props',10,23,22,`heart ${i<p.hp?'':'empty'}`)));$('hearts').setAttribute('aria-label',`${p.hp} cuori`);$('coin-counter').textContent=String(world.coins).padStart(2,'0');$('star-counter').textContent=`${world.stars}/3`;$('ammo-counter').textContent=world.ammo;$('score-counter').textContent=world.score;$('level-counter').textContent=`ISOLA ${world.level.index+1} / ${C.NAMES.length}`;}
    let hint=`${keyName(keys('left')[0])} ${keyName(keys('right')[0])}  MUOVI     ${keyName(keys('jump')[0])} × 2  DOPPIO SALTO     ${keyName(keys('shoot')[0])} / X  LANCIA SEMI`;
    if(world.player.x>world.level.math.x-600)hint=world.gateOpen?'PORTA APERTA → cammina dentro':world.bossAlive()?'CALMA IL CUSTODE: semi o salti sulla testa':world.solved?'SALTA SOTTO IL NUMERO GIUSTO ↑ — manca una risposta':'SALTA SOTTO IL NUMERO GIUSTO ↑ — servono due risposte';
    else if(world.chestOpen&&Math.abs(p.x-world.level.chest.x)<115&&Math.abs(p.y-world.level.chest.y)<100)hint='FORZIERE VUOTO · Hai già raccolto il premio.';
    $('context-hint').textContent=hint;updateMathStation();
  }
  function background(name,camera=0){
    ctx.imageSmoothingEnabled=true;const im=images[name];
    if(im){const scale=Math.max(608/im.height,(VW+2*camera*.014)/im.width),h=im.height*scale,w=im.width*scale;ctx.drawImage(im,-(w-VW)/2-camera*.014,(540-h)/2,w,h);}else{ctx.fillStyle='#a5d0c9';ctx.fillRect(0,0,VW,540);}
    if(!world||['title','map'].includes(mode)){ctx.fillStyle=mode==='map'?'#eff3d438':'#fff7df16';ctx.fillRect(0,0,VW,540);}
  }
  function drawWorld(){
    const w=world,p=w.player,b=w.level.biome;ctx.save();ctx.translate(-Math.round(w.camera),0);
    for(const r of w.level.platforms){
      if(r.x+r.w<w.camera-80||r.x>w.camera+VW+80||r.y>620)continue;
      if(r.motion){
        sprite(ctx,'rewards-v3',3,r.x+r.w/2,r.y+r.h,r.h,false,1,r.w);
        if(r.motion==='falling'&&r.fallTime>0&&r.fallTime<.55){ctx.fillStyle='#f9d190';ctx.fillRect(r.x+8,r.y+3,r.w-16,2);}
        continue;
      }
      ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();
      ctx.fillStyle=['#785946','#946342','#55576e'][b];ctx.fillRect(r.x,r.y,r.w,r.h);
      const tile=b===0?0:b===1?3:4;
      for(let x=r.x;x<r.x+r.w;x+=72)sprite(ctx,'props',tile,x+36,r.y+55,60,false,1,78);
      if(!r.oneWay){ctx.fillStyle=['#8b6952','#a7784b','#68647e'][b];for(let yy=r.y+65;yy<r.y+r.h;yy+=28)for(let xx=r.x+((yy%56)?10:30);xx<r.x+r.w;xx+=47)ctx.fillRect(xx,yy,12,5);}
      ctx.fillStyle=['#6e9958','#bda65c','#849b9d'][b];ctx.fillRect(r.x,r.y,r.w,4);ctx.restore();
    }
    for(const d of w.level.decor)sprite(ctx,'props',d.type,d.x,d.y,25,false,.9);
    sprite(ctx,'props',12,w.level.sign.x,w.level.sign.y,55);
    sprite(ctx,'turbine-v3',0,w.level.turbine.x,w.level.turbine.y,139);
    sprite(ctx,'props',17,w.level.checkpoint.x,w.level.checkpoint.y,76,false,w.checkpoint?1:.55);
    if(w.chestOpen)sprite(ctx,'chest-empty',0,w.level.chest.x,w.level.chest.y,56);
    else sprite(ctx,'props',13,w.level.chest.x,w.level.chest.y,43);
    sprite(ctx,'props',w.gateOpen?16:15,w.level.gate.x,w.level.gate.y,126);
    for(const s of w.level.spikes)sprite(ctx,'props',23,s.x+s.w/2,s.y+s.h,s.h,false,1,s.w);
    for(const s of w.level.springs)sprite(ctx,'props',22,s.x,s.y,27);
    for(const block of w.level.blocks){
      const y=block.y-Math.sin(block.bump/.22*Math.PI)*5;
      sprite(ctx,'rewards-v3',block.remaining?0:1,block.x+block.w/2,y+block.h,block.h,false,1,block.w);
    }
    for(const coin of w.level.coins)if(!coin.taken)sprite(ctx,'props',6+Math.floor(w.time*7)%3,coin.x,coin.y+12+Math.sin(w.time*3+coin.x)*2,23);
    for(const star of w.level.stars)if(!star.taken)sprite(ctx,'props',9,star.x,star.y+17+Math.sin(w.time*2+star.x)*3,34);
    for(const a of w.level.ammo)if(!a.taken)sprite(ctx,'rewards-v3',2,a.x,a.y+17+Math.sin(w.time*2+a.x)*2,34);
    if(!w.secretRevealed){
      const r=w.level.secret;
      // A silhouette of foliage hides the chest; no opaque rectangle behind it.
      for(const offset of [.23,.5,.77])sprite(ctx,'props',19,r.x+r.w*offset,r.y+r.h,Math.min(60,r.h));
    }
    for(const e of w.enemies){
      if(e.dead>.65)continue;
      let frame=e.type*6+Math.floor(w.time*(e.type===1?10:6))%4;
      if(e.hp<=0)frame=e.type*6+5;else if(e.guard>0)frame=e.type*6+4;else if(e.type===3)frame=18+(e.phase>2.1&&e.phase<2.65?3:e.phase>1.5&&e.phase<2.1?2:Math.floor(w.time*3)%2);
      sprite(ctx,'enemies',frame,e.x,e.y,e.type===3?112:e.type===1?46:43,e.dir<0,e.hp>0?1:Math.max(0,1-e.dead/.65));
      if(e.type===3&&e.hp>0){ctx.fillStyle='#183d43';ctx.fillRect(e.x-42,e.y-128,84,8);ctx.fillStyle='#daaa62';ctx.fillRect(e.x-40,e.y-126,80*e.hp/(7+w.level.index),4);}
    }
    for(const s of w.shots)sprite(ctx,'props',11,s.x,s.y+7,s.hostile?22:14,s.vx<0);
    let frame=0;
    if(mode==='complete')frame=22+Math.floor(animationTime*4)%2;
    else if(p.hp<=0)frame=20+Math.floor(animationTime*3)%2;
    else if(p.hurtPose>0)frame=18+Math.floor(w.time*8)%2;
    else if(p.shootPose>0)frame=15+Math.floor(w.time*12)%3;
    else if(!p.grounded)frame=p.vy<-100?12:p.vy<100?13:14;
    else if(Math.abs(p.vx)>15)frame=6+Math.floor(w.time*10)%6;
    else frame=Math.floor(w.time*5)%6;
    playerCtx.save();playerCtx.translate(-Math.round(w.camera),0);sprite(playerCtx,'nina',frame,p.x,p.y,64,p.face<0,p.invincible>0&&Math.floor(w.time*12)%2?.5:1);playerCtx.restore();
    for(const a of particles){ctx.globalAlpha=Math.min(1,a.life*2);ctx.fillStyle=a.color;ctx.fillRect(Math.round(a.x),Math.round(a.y),4,4);}ctx.globalAlpha=1;ctx.restore();
  }
  function frame(now){
    const dt=Math.min(.1,(now-lastFrame)/1000||0);lastFrame=now;animationTime+=dt;
    if(mode==='play'&&world){
      accumulator+=dt;
      while(accumulator>=1/120&&mode==='play'){
        world.step(1/120,{left:held.has('left'),right:held.has('right'),shootPressed:pressed.has('shoot'),jumpPressed:pressed.has('jump'),jumpReleased:released.has('jump'),interactPressed:pressed.has('interact')});
        pressed.clear();released.clear();accumulator-=1/120;handleEvents();
      }
      particles=particles.filter(a=>a.life>0);for(const a of particles){a.life-=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=180*dt;}
      if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').hidden=true;}updateHUD();
    }
    playerCtx.clearRect(0,0,VW,540);background(world?world.level.background:'valley',world?world.camera:0);if(world)drawWorld();requestAnimationFrame(frame);
  }
  function actionDown(action){if(mode!=='play')return;if(!held.has(action))pressed.add(action);held.add(action);}
  function actionUp(action){if(held.has(action))released.add(action);held.delete(action);}
  document.addEventListener('keydown',e=>{
    if(pendingBind){e.preventDefault();if(e.code==='Escape'){pendingBind=null;$('binding-status').textContent='Scelta annullata.';return;}
      if(e.repeat||e.metaKey||e.ctrlKey||e.altKey||/^(Shift|Control|Alt|Meta)/.test(e.code))return;
      const conflict=Object.keys(labels).find(k=>k!==pendingBind&&keys(k).includes(e.code));
      if(conflict){$('binding-status').textContent=`Questo tasto è già usato per “${labels[conflict]}”. Scegline un altro.`;return;}
      progress.bindings[pendingBind]=e.code;pendingBind=null;persist();bindings(returnMenu);return;
    }
    if(e.metaKey||e.ctrlKey||e.altKey)return;
    if(mode==='math'||mode==='options'||mode==='bindings'||mode==='help'||mode==='confirm-exit'||mode==='wrong'||mode==='complete'||mode==='ko'||mode==='map'||mode==='title')return;
    const actions=Object.keys(labels).filter(k=>keys(k).includes(e.code));if(!actions.length)return;e.preventDefault();
    if(e.repeat||physical.has(e.code))return;physical.add(e.code);
    if(actions.includes('pause')){if(mode==='play')pause();else if(mode==='pause')resume();return;}
    for(const action of actions)actionDown(action);
  });
  document.addEventListener('keyup',e=>{physical.delete(e.code);for(const a of Object.keys(labels))if(keys(a).includes(e.code))actionUp(a);});
  canvas.addEventListener('pointerdown',e=>{if(mode==='play'){e.preventDefault();canvas.focus();unlockAudio();actionDown('shoot');canvas.setPointerCapture(e.pointerId);}});
  canvas.addEventListener('pointerup',()=>actionUp('shoot'));canvas.addEventListener('pointercancel',()=>actionUp('shoot'));
  document.querySelectorAll('[data-action]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();unlockAudio();b.setPointerCapture(e.pointerId);actionDown(b.dataset.action);});b.addEventListener('pointerup',()=>actionUp(b.dataset.action));b.addEventListener('pointercancel',()=>actionUp(b.dataset.action));});
  bind('pause-button',pause);
  window.addEventListener('blur',()=>{clearInput();if(mode==='play')pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(mode==='play')pause();if(music)music.pause();}else if(audioUnlocked)playMusic(world?world.level.biome:0);});
  // Keep keyboard focus inside modal menus without intercepting text entry.
  document.addEventListener('keydown',e=>{if(e.key!=='Tab'||!screen.querySelector('[role="dialog"]'))return;const focus=[...screen.querySelectorAll('button:not(:disabled),input')];if(!focus.length)return;const first=focus[0],last=focus[focus.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
  // Scaduti i 30 minuti del timer di gioco: si torna al titolo, come negli altri giochi del sito.
  document.addEventListener((window.SA&&window.SA.playWindow&&window.SA.playWindow.eventName)||'sa:play-window-change',event=>{
    if(!event||!event.detail||!event.detail.expired||!world)return;
    title();
    const msg='I 30 minuti di gioco sono terminati. Adesso bisogna aspettare 60 minuti prima di poter tornare a giocare.';
    if(window.SA&&window.SA.ui&&typeof window.SA.ui.alert==='function')window.SA.ui.alert(msg,{title:'Tempo di gioco terminato',okLabel:'Va bene'});else toast(msg,6);
  });
  async function boot(){
    const names=[...new Set(['nina','enemies','props','turbine-v3','rewards-v3','chest-empty','icon',...C.COURSE.map(level=>level.background)])];$('load-progress').max=names.length;
    try{await Promise.all(names.map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[name]=im;$('load-progress').value++;resolve();};im.onerror=()=>reject(new Error(name));im.src=`/assets/gioco-tabelline/art/${name}.webp`;})));
      await document.fonts.ready;$('loading').hidden=true;document.querySelector('.coin-icon').append(icon('props',6,26,26));document.querySelector('.star-icon').append(icon('props',9,28,28));document.querySelector('.ammo-icon').append(icon('rewards-v3',2,28,28));resize();title();requestAnimationFrame(frame);
    }catch(e){$('loading').replaceChildren(el('h2',{},'Manca un pezzetto dell’isola'),el('p',{},'Ricarica la pagina.'));}
  }
  boot();
})();
