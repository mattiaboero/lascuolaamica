/* Authored Nina maps. These are original layouts, not exported reference maps. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.NinaLevels=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const NAMES=['Il sentiero dei mulini','Il custode del bosco','Le serre d’ambra','La pompa delle dune','I giardini della luna','Il cuore del vento','I ponti del ritorno','La fucina delle nuvole','L’arcipelago dei numeri'];
  const COURSE=NAMES.map((name,index)=>({name,tables:index<8?[index+2]:[2,3,4,5,6,7,8,9],label:index===6?'Tabellina dell’8':index<8?`Tabellina del ${index+2}`:'Ripasso dal 2 al 9',biome:[0,0,1,1,2,2,0,1,2][index],background:['valley','valley','amber','amber','night','night','bridges-v25','forge-v25','aurora-v25'][index]}));
  const floor=(x,y,w)=>({x,y,w,h:600-y});
  const ledge=(x,y,w,motion,range=0,period=4)=>({x,y,w,h:28,oneWay:true,...(motion?{motion,range,period}:{})});
  const row=(x,y,count=3,gap=46)=>Array.from({length:count},(_,i)=>({x:x+i*gap,y,taken:false}));
  const star=(x,y)=>({x,y,taken:false});
  const ammo=(x,y)=>({x,y,taken:false});
  const block=(x,y,remaining=1)=>({x,y,w:34,h:34,remaining});
  const mob=(x,y,left,right,type=0)=>({x,y,left,right,type});
  const flowers=(x,y,type=18)=>({x,y,type});
  const common=index=>({index,name:NAMES[index],biome:COURSE[index].biome,background:COURSE[index].background,tables:[...COURSE[index].tables],lesson:COURSE[index].label,width:3860,spawn:{x:170,y:448},gate:{x:3720,y:448},math:{x:3360,y:448},sign:{x:340,y:448},turbine:{x:75,y:448},questions:2,spikes:[],enemies:[],ammo:[],blocks:[],springs:[],decor:[]});
  const AUTHORS=[
    () => ({
      platforms:[floor(0,448,600),floor(600,400,300),floor(900,328,320),floor(1220,400,320),floor(1540,448,640),floor(2180,400,360),floor(2540,448,1320),
        ledge(420,355,136),ledge(720,306,160),ledge(1270,306,140),ledge(1640,354,180),ledge(1870,280,170),ledge(2290,306,160),ledge(2600,354,150)],
      coins:[...row(230,416,2),...row(458,323,2),...row(626,368,2),...row(978,296,3),...row(1300,274,2),...row(1578,416,2),...row(1680,322,3),...row(2220,368,2),...row(2320,274,3),...row(2820,416,3)],
      stars:[star(800,264),star(1955,238),star(2675,312)],
      checkpoint:{x:2110,y:448},chest:{x:1450,y:400},secret:{x:1388,y:330,w:124,h:70},
      blocks:[block(500,225),block(1120,198,5)],
      decor:[flowers(410,448),flowers(1160,328,19),flowers(1510,400,20),flowers(2030,448),flowers(2485,400,19)]
    }),
    () => ({
      platforms:[floor(0,448,560),floor(560,400,360),floor(920,448,470),floor(1500,448,550),floor(2050,384,440),floor(2490,448,1370),
        ledge(300,355,150),ledge(650,306,170),ledge(1050,354,160),ledge(1300,360,120,'horizontal',70,4.8),ledge(1530,354,120),ledge(1650,270,180),ledge(2320,290,150),ledge(2510,344,176)],
      coins:[...row(230,416,2),...row(600,368,2),...row(1080,322,3),...row(1548,322,2),...row(2080,352,2),...row(2350,258,3)],
      stars:[star(735,264),star(1740,228),star(2598,302)],
      enemies:[mob(1180,448,1080,1320),mob(2260,300,2180,2310,1),mob(2870,448,2780,2990,3)],
      checkpoint:{x:1990,y:448},chest:{x:1900,y:448},secret:{x:1838,y:374,w:124,h:74},
      ammo:[ammo(980,416),ammo(2660,416)],blocks:[block(490,300),block(2165,245,5)],
      decor:[flowers(470,448,20),flowers(1275,448,19),flowers(1810,448),flowers(2440,384,19)]
    }),
    () => ({
      platforms:[floor(0,448,700),floor(700,400,330),floor(1030,448,290),floor(1430,448,480),floor(1910,384,280),floor(2190,448,270),floor(2580,448,1280),
        ledge(390,354,150),ledge(780,306,160),ledge(1480,354,120),ledge(1640,278,180),ledge(2280,350,130,'falling'),ledge(2468,365,100,'horizontal',40,4.8),ledge(2640,278,180)],
      coins:[...row(230,416,2),...row(422,322,2),...row(720,368,2),...row(1496,322,2),...row(1940,352,2),...row(2310,318,2),...row(2860,416,3)],
      stars:[star(860,264),star(1730,236),star(2730,236)],
      enemies:[mob(1140,448,1080,1250),mob(1860,448,1790,1890,2),mob(2290,282,2210,2400,1)],
      checkpoint:{x:2230,y:448},chest:{x:2070,y:384},secret:{x:2008,y:310,w:124,h:74},
      ammo:[ammo(990,368),ammo(2160,352)],blocks:[block(600,285),block(2000,230,5)],
      spikes:[{x:1500,y:425,w:42,h:23},{x:2380,y:425,w:38,h:23}],
      decor:[flowers(560,448,19),flowers(1258,448,20),flowers(1605,448),flowers(2810,448,19)]
    }),
    () => ({
      platforms:[floor(0,448,480),floor(480,400,330),floor(810,328,290),floor(1100,400,300),floor(1400,448,220),floor(1740,448,460),floor(2200,392,320),floor(2520,448,1340),
        ledge(560,306,160),ledge(870,234,160),ledge(1120,306,120),ledge(1240,224,180),ledge(1650,354,110,'horizontal',54,4.8),ledge(1940,354,144,'falling'),ledge(2410,298,160)],
      coins:[...row(230,416,2),...row(500,368,2),...row(910,202,3),...row(1140,368,2),...row(1760,416,2),...row(1970,322,2),...row(2230,360,2)],
      stars:[star(640,264),star(1330,182),star(2490,256)],
      enemies:[mob(990,328,900,1070,2),mob(2060,448,1980,2150),mob(2870,448,2780,2990,3)],
      checkpoint:{x:1840,y:448},chest:{x:1510,y:448},secret:{x:1448,y:374,w:124,h:74},
      ammo:[ammo(405,416),ammo(2660,416)],blocks:[block(1460,300),block(2680,300,5)],
      springs:[{x:2310,y:392}],spikes:[{x:1300,y:377,w:42,h:23},{x:2160,y:425,w:38,h:23}],
      decor:[flowers(750,400,19),flowers(1440,448,20),flowers(1910,448),flowers(2580,448,19)]
    }),
    () => ({
      platforms:[floor(0,448,600),floor(600,384,320),floor(920,448,320),floor(1360,448,400),floor(1760,384,320),floor(2080,448,340),floor(2540,448,1320),
        ledge(380,354,150),ledge(710,290,160),ledge(1190,354,145,'horizontal',70,5.2),ledge(1430,354,150),ledge(1660,275,176),ledge(940,354,140,'falling'),ledge(2110,352,150),ledge(2422,330,90,'orbit',26,6),ledge(2560,354,120),ledge(2660,275,176)],
      coins:[...row(230,416,2),...row(410,322,2),...row(620,352,2),...row(1460,322,2),...row(1790,352,2),...row(2140,320,2),...row(2920,416,2)],
      stars:[star(790,248),star(1748,233),star(2748,233)],
      enemies:[mob(1030,448,970,1180),mob(1610,448,1510,1690,2),mob(2290,280,2150,2390,1)],
      checkpoint:{x:1930,y:384},chest:{x:2230,y:448},secret:{x:2168,y:374,w:124,h:74},
      ammo:[ammo(900,352),ammo(2020,352)],blocks:[block(540,300),block(1960,235,5),block(2600,224)],
      springs:[{x:2350,y:448}],spikes:[{x:1490,y:425,w:40,h:23},{x:2860,y:425,w:40,h:23}],
      decor:[flowers(560,448,19),flowers(1120,448,20),flowers(1855,384),flowers(2820,448,19)]
    }),
    () => ({
      platforms:[floor(0,448,520),floor(520,400,300),floor(820,344,280),floor(1100,448,310),floor(1530,448,410),floor(1940,392,310),floor(2250,448,310),floor(2560,448,1300),
        ledge(610,306,170),ledge(880,250,150),ledge(1330,350,110,'horizontal',64,5),ledge(1550,354,120),ledge(1700,278,176),ledge(1960,280,100,'falling'),ledge(2080,298,100),ledge(2278,320,90,'orbit',24,6),ledge(2410,355,120),ledge(2480,278,176)],
      coins:[...row(230,416,2),...row(540,368,2),...row(910,218,3),...row(1130,416,2),...row(1576,322,2),...row(2070,266,2)],
      stars:[star(695,264),star(1788,236),star(2568,236)],
      enemies:[mob(980,344,900,1060,2),mob(1640,286,1540,1710,1),mob(2370,448,2300,2440),mob(2870,448,2780,2990,3)],
      checkpoint:{x:1870,y:448},chest:{x:2140,y:392},secret:{x:2078,y:318,w:124,h:74},
      ammo:[ammo(460,416),ammo(1980,248),ammo(2680,416)],blocks:[block(350,280),block(1180,290,5),block(2700,300)],
      springs:[{x:2280,y:448}],spikes:[{x:1210,y:425,w:42,h:23},{x:1580,y:425,w:42,h:23}],
      decor:[flowers(390,448,19),flowers(760,400,20),flowers(1365,448),flowers(2210,392,19)]
    }),
    () => ({
      platforms:[floor(0,448,620),floor(620,384,360),floor(980,448,300),floor(1400,448,420),floor(1820,384,320),floor(2140,448,290),floor(2550,448,1310),
        ledge(380,350,150),ledge(720,290,160),ledge(1050,350,140),ledge(1280,340,100,'horizontal',70,5),ledge(1510,350,140),ledge(1680,270,180),ledge(1980,290,140),ledge(2310,340,100,'falling'),ledge(2450,330,90,'orbit',26,6),ledge(2600,350,150),ledge(2640,260,180)],
      coins:[...row(230,416,2),...row(414,318,2),...row(650,352,2),...row(1080,318,2),...row(1540,318,2),...row(2010,258,2),...row(2340,308,2),...row(2830,416,2)],
      stars:[star(800,248),star(1770,228),star(2730,218)],
      enemies:[mob(1150,448,1060,1220),mob(1850,280,1830,1950,1),mob(2840,448,2780,2960,2)],
      checkpoint:{x:1920,y:384},chest:{x:2210,y:448},secret:{x:2148,y:374,w:124,h:74},
      ammo:[ammo(960,352),ammo(2610,416)],blocks:[block(490,220),block(2010,160,5)],
      spikes:[{x:1590,y:425,w:40,h:23}],
      decor:[flowers(580,448),flowers(1230,448,20),flowers(1790,448,19)]
    }),
    () => ({
      platforms:[floor(0,448,500),floor(500,392,320),floor(820,336,300),floor(1120,400,320),floor(1440,448,220),floor(1780,448,380),floor(2160,384,340),floor(2500,448,1360),
        ledge(390,354,120),ledge(590,298,170),ledge(880,242,150),ledge(1180,306,120),ledge(1330,220,170),ledge(1700,350,100,'horizontal',60,5.2),ledge(1930,350,100,'falling'),ledge(2320,286,160)],
      coins:[...row(230,416,2),...row(420,322,2),...row(530,360,2),...row(910,210,2),...row(1200,274,2),...row(1810,416,2),...row(1960,318,2),...row(2180,352,2)],
      stars:[star(675,256),star(1415,178),star(2400,244)],
      enemies:[mob(990,336,900,1080,2),mob(2040,260,1960,2110,1),mob(2870,448,2780,2990,3)],
      checkpoint:{x:2090,y:448},chest:{x:1540,y:448},secret:{x:1478,y:374,w:124,h:74},
      ammo:[ammo(840,304),ammo(1790,416),ammo(2680,416)],blocks:[block(390,224),block(2690,300,5)],
      springs:[{x:2240,y:384}],spikes:[{x:1280,y:377,w:40,h:23},{x:2550,y:425,w:38,h:23}],
      decor:[flowers(750,392,19),flowers(1145,400),flowers(1620,448,20),flowers(2445,384,19)]
    }),
    () => ({
      platforms:[floor(0,448,600),floor(600,384,350),floor(950,448,310),floor(1380,448,400),floor(1780,384,360),floor(2140,448,280),floor(2540,448,1320),
        ledge(400,354,140),ledge(710,290,170),ledge(1040,350,110),ledge(1240,350,110,'horizontal',60,5),ledge(1480,350,140),ledge(1690,270,180),ledge(1960,280,100,'falling'),ledge(2080,290,100),ledge(2406,330,90,'orbit',26,6),ledge(2580,350,120),ledge(2710,260,160)],
      coins:[...row(230,416,2),...row(430,322,2),...row(630,352,2),...row(1070,318,2),...row(1510,318,2),...row(1980,248,2),...row(2110,258,2),...row(2600,318,2)],
      stars:[star(795,248),star(1778,228),star(2790,218)],
      enemies:[mob(1100,448,1000,1200),mob(1640,448,1550,1710,2),mob(2330,280,2260,2370,1),mob(2870,448,2780,2990,3)],
      checkpoint:{x:2190,y:448},chest:{x:2330,y:448},secret:{x:2268,y:374,w:124,h:74},
      ammo:[ammo(990,416),ammo(2090,352),ammo(2630,416)],blocks:[block(480,224),block(1110,220,5),block(2700,300)],
      spikes:[{x:1510,y:425,w:40,h:23},{x:2560,y:425,w:38,h:23}],
      decor:[flowers(570,448),flowers(910,384,19),flowers(1630,448,20)]
    })
  ];

  function visualBounds(level){
    const out=[];
    const box=(kind,id,x,y,w,h)=>out.push({kind,id,x,y,w,h});
    const centered=(kind,p,i,w,h,bottom=false)=>box(kind,`${kind}-${i}`,p.x-w/2,bottom?p.y-h:p.y-h/2,w,h);
    level.coins.forEach((p,i)=>centered('coin',p,i,28,28));
    level.stars.forEach((p,i)=>centered('star',p,i,44,44));
    level.ammo.forEach((p,i)=>centered('ammo',p,i,36,38));
    level.blocks.forEach((p,i)=>box('block',`block-${i}`,p.x,p.y,p.w,p.h));
    level.spikes.forEach((p,i)=>box('spike',`spike-${i}`,p.x,p.y,p.w,p.h));
    level.springs.forEach((p,i)=>centered('spring',p,i,48,28,true));
    level.decor.forEach((p,i)=>centered('decor',p,i,42,32,true));
    level.enemies.forEach((p,i)=>centered('enemy',p,i,p.type===3?126:70,p.type===3?112:46,true));
    centered('chest',level.chest,0,65,58,true);
    centered('checkpoint',level.checkpoint,0,76,76,true);
    centered('sign',level.sign,0,66,55,true);
    centered('turbine',level.turbine,0,125,139,true);
    centered('gate',level.gate,0,154,140,true);
    box('math','math-0',level.math.x-200,150,400,250);
    return out;
  }
  function separated(a,b,padding=12){return a.x+a.w+padding<=b.x||b.x+b.w+padding<=a.x||a.y+a.h+padding<=b.y||b.y+b.h+padding<=a.y;}
  function overlaps(a,b){return !separated(a,b,0);}
  function motionBounds(r,platforms){
    const horizontal=['horizontal','orbit'].includes(r.motion)?r.range:0;
    let bottom=r.y+r.h+(r.motion==='orbit'?r.range*.9:r.motion==='vertical'?r.range:0);
    if(r.motion==='falling')bottom=Math.min(700,...platforms.filter(p=>p!==r&&!p.motion&&p.x<r.x+r.w&&p.x+p.w>r.x&&p.y>=r.y+r.h).map(p=>p.y));
    const top=r.y-72-(r.motion==='vertical'?r.range:0);
    // Full journey plus Nina's 64px silhouette and 8px above her head.
    return {x:r.x-horizontal,y:top,w:r.w+2*horizontal,h:bottom-top};
  }
  function create(index){
    if(!Number.isInteger(index)||index<0||index>=AUTHORS.length)throw new Error('Isola non valida');
    const level={...common(index),...AUTHORS[index]()};
    // Authored rows are clipped only against reserved object footprints. Stars,
    // treasure, signage and the final teaching area always retain their space.
    const reserved=visualBounds({...level,coins:[],decor:[]});
    const kept=[];
    for(const coin of level.coins){
      const b={x:coin.x-14,y:coin.y-14,w:28,h:28};
      if(coin.x>=3020||level.stars.some(s=>Math.hypot(s.x-coin.x,s.y-coin.y)<80))continue;
      if(reserved.some(r=>!separated(b,r))||kept.some(c=>!separated(b,{x:c.x-14,y:c.y-14,w:28,h:28})))continue;
      kept.push(coin);
    }
    level.coins=kept;
    const fixed=visualBounds({...level,decor:[]});
    level.decor=level.decor.filter(p=>p.x<3020&&fixed.every(r=>separated({x:p.x-21,y:p.y-32,w:42,h:32},r)));
    return level;
  }
  function validate(level){
    const errors=[];
    if(level.stars.length!==3)errors.push('Servono esattamente tre stelle.');
    if(level.width!==3860)errors.push('Larghezza inattesa.');
    const bounds=visualBounds(level);
    for(let i=0;i<bounds.length;i++){
      const a=bounds[i];
      if(![a.x,a.y,a.w,a.h].every(Number.isFinite)||a.w<=0||a.h<=0)errors.push(`Rettangolo non valido: ${a.id}`);
      if(a.x<0||a.x+a.w>level.width||a.y<0)errors.push(`Fuori mappa: ${a.id}`);
      if(!['gate','math'].includes(a.kind)&&a.x>=3020)errors.push(`Area finale occupata: ${a.id}`);
      for(let j=i+1;j<bounds.length;j++)if(!separated(a,bounds[j]))errors.push(`Spazio insufficiente: ${a.id} / ${bounds[j].id}`);
      if(!['math','enemy'].includes(a.kind)&&level.platforms.some(r=>overlaps(a,r)))errors.push(`Grafica dentro una piattaforma: ${a.id}`);
    }
    for(const s of level.stars)for(const c of level.coins)if(Math.hypot(s.x-c.x,s.y-c.y)<80)errors.push('Stella troppo vicina a una moneta.');
    const floorAt=(x,y)=>level.platforms.some(r=>!r.oneWay&&x>=r.x+4&&x<=r.x+r.w-4&&Math.abs(r.y-y)<.01);
    for(const k of ['spawn','checkpoint','chest','sign','turbine','gate','math'])if(!floorAt(level[k].x,level[k].y))errors.push(`Base non sicura: ${k}`);
    for(const p of level.springs)if(!floorAt(p.x,p.y))errors.push('Molla senza base fissa.');
    if(!level.platforms.some(r=>!r.oneWay&&r.x<=3020&&r.x+r.w>=level.width&&r.y===448))errors.push('Manca il pavimento continuo finale.');
    for(const [kind,items] of [['coin',level.coins],['star',level.stars],['ammo',level.ammo]])for(const p of items){
      if(!level.platforms.some(r=>p.x>=r.x&&p.x<=r.x+r.w&&r.y-p.y>=24&&r.y-p.y<=190))errors.push(`Nessun supporto vicino a ${kind} ${p.x},${p.y}`);
    }
    for(const p of level.blocks){
      if(![1,5].includes(p.remaining))errors.push('Contenuto blocco non valido.');
      const support=level.platforms.filter(r=>!r.motion&&p.x+p.w/2>=r.x&&p.x+p.w/2<=r.x+r.w&&r.y>=p.y+p.h).sort((a,b)=>a.y-b.y)[0];
      if(!support||support.y-p.y-p.h<96||support.y-p.y-p.h>150)errors.push(`Spazio salto insufficiente sotto il blocco: ${p.x}`);
      for(const c of level.coins)if(!separated(p,{x:c.x-14,y:c.y-14,w:28,h:28},32))errors.push(`Moneta troppo vicina al blocco: ${p.x}`);
    }
    const grounds=level.platforms.filter(r=>!r.oneWay).sort((a,b)=>a.x-b.x);
    for(let i=1;i<grounds.length;i++){
      const a=grounds[i-1],b=grounds[i];
      if(b.x-a.x-a.w>130)errors.push(`Vuoto oltre 130px: ${a.x+a.w}`);
      if(a.y-b.y>95)errors.push(`Gradino oltre 95px: ${b.x}`);
    }
    const moving=level.platforms.filter(r=>r.motion);
    for(const r of moving){
      if(r.oneWay!==true)errors.push('Piattaforma mobile non attraversabile dal basso.');
      const envelope=motionBounds(r,level.platforms);
      for(const fixed of level.platforms.filter(p=>!p.motion))if(overlaps(envelope,fixed))errors.push(`Percorso mobile ostruito: ${r.x} / ${fixed.x}`);
      for(const other of moving)if(other!==r&&overlaps(envelope,motionBounds(other,level.platforms)))errors.push(`Percorsi mobili sovrapposti: ${r.x} / ${other.x}`);
      for(const block of level.blocks)if(overlaps(envelope,block))errors.push(`Cubo nel percorso mobile: ${r.x} / ${block.x}`);
    }
    return [...new Set(errors)];
  }
  return {NAMES,COURSE,create,visualBounds,motionBounds,validate};
});
