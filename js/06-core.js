
/* ===== 00-core.js ===== */
/* ============================================================
 * 無盡之門 · v4.0 擴展核心（Infinite Gates Extension Core）
 * 純增量層：登錄框架、劇情包掛載、第四扇門接入、迴廊碎片收集。
 * 不修改任何既有內容，只包裝既有函數並在其後追加。
 * ============================================================ */
(function(){
'use strict';
if(window.V4 && window.V4.__booted) return;
var V4 = window.V4 = {
  __booted:false, version:'4.0.0',
  _story:{}, _dungeonDefs:{}, _achAdd:{}, _systems:[], _postBoot:[]
};

/* ---------- 安全存儲 ---------- */
function safeGet(k){ try{return localStorage.getItem(k);}catch(e){return null;} }
function safeSet(k,v){ try{localStorage.setItem(k,v);return true;}catch(e){return false;} }

/* ---------- 輕量事件總線 ---------- */
V4._ls={};
V4.on=function(ev,fn){ (V4._ls[ev]=V4._ls[ev]||[]).push(fn); };
V4.off=function(ev,fn){ if(!V4._ls[ev])return; V4._ls[ev]=V4._ls[ev].filter(function(f){return f!==fn;}); };
V4.emit=function(ev,d){ (V4._ls[ev]||[]).forEach(function(fn){try{fn(d);}catch(e){}}); };

/* ============================================================
 * 迴廊碎片（Gate Fragments）——貫穿全遊戲的隱藏收集要素
 * 共 9 枚，三扇門各 3 枚；集齊可解開第四扇門的「真·門後」結局。
 * ============================================================ */
var FRAG_KEY='wuxian-fragments';
V4.FRAGMENTS={
  /* 門扉1 質數旅館 */
  d1_mirror:{d:1,name:'鏡之扉',        hint:'鏡像不會承認自己是假的'},
  d1_loop:  {d:1,name:'環之扉',        hint:'門後仍是那條走廊'},
  d1_prime: {d:1,name:'質之扉',        hint:'被除盡的質數，與 1 有關'},
  /* 門扉2 沉默圖書館 */
  d2_forbid:{d:2,name:'禁之扉',        hint:'牆長出來的地方'},
  d2_below: {d:2,name:'藏之扉',        hint:'被刪掉的記憶在地下'},
  d2_cat:   {d:2,name:'貓之扉',        hint:'三隻貓，都與媛媛有關'},
  /* 門扉3 倒計時醫院 */
  d3_core:  {d:3,name:'憶之扉',        hint:'吃記憶的東西在 B2'},
  d3_morgue:{d:3,name:'格之扉',        hint:'太平間，第十四格'},
  d3_wait:  {d:3,name:'等之扉',        hint:'在四樓寫下名字的人'}
};
V4.TOTAL_FRAGMENTS=9;
function getFragSet(){ try{return JSON.parse(safeGet(FRAG_KEY)||'[]');}catch(e){return [];} }
V4.getFragments=getFragSet;
V4.hasFragment=function(id){ return getFragSet().indexOf(id)!==-1; };
V4.fragmentsCount=function(){ return getFragSet().length; };
V4.fragmentsInDungeon=function(d){ return Object.keys(V4.FRAGMENTS).filter(function(k){return V4.FRAGMENTS[k].d===d;}); };
V4.fragmentsFoundInDungeon=function(d){ return getFragSet().filter(function(id){ var f=V4.FRAGMENTS[id]; return f&&f.d===d;}); };
V4.findFragment=function(id){
  if(!V4.FRAGMENTS[id]) return false;
  var s=getFragSet();
  if(s.indexOf(id)!==-1) return false;
  s.push(id); safeSet(FRAG_KEY,JSON.stringify(s));
  try{ if(typeof showToast==='function') showToast('迴廊碎片 · '+V4.FRAGMENTS[id].name); }catch(e){}
  V4.emit('fragment',id);
  return true;
};
V4.allFragmentsFound=function(){ return V4.fragmentsCount()>=V4.TOTAL_FRAGMENTS; };

/* ---------- 登錄 API ---------- */
V4.registerStoryPack=function(id,pack){
  if(!V4._story[id]) V4._story[id]={scenes:{},inject:[]};
  var s=V4._story[id];
  if(pack.scenes) for(var k in pack.scenes) s.scenes[k]=pack.scenes[k];
  if(pack.inject) pack.inject.forEach(function(x){
    /* 為每條注入選擇配穩定唯一 id，便於逐條去重（支援多模組注入同一場景） */
    if(!x.choice.__v4cid) x.choice.__v4cid='inj_'+id+'_'+s.inject.length+'_'+(x.into||'');
    s.inject.push(x);
  });
  if(pack.endingsAdded) s.endingsAdded=(s.endingsAdded||0)+pack.endingsAdded;
};
V4.registerDungeon=function(def){ V4._dungeonDefs[def.id]=def; };
V4.addAchievements=function(id,list){
  if(!V4._achAdd[id]) V4._achAdd[id]=[];
  list.forEach(function(a){ V4._achAdd[id].push(a); });
};
V4.registerSystem=function(name,initFn){ V4._systems.push({name:name,init:initFn}); };
V4.onBoot=function(fn){ V4._postBoot.push(fn); };

/* ---------- 劇情包套用（每次 buildScenes 後執行） ---------- */
function applyStory(id){
  var pack=V4._story[id]; if(!pack) return;
  for(var k in pack.scenes){ SCENES[k]=pack.scenes[k]; }
  pack.inject.forEach(function(inj){
    var sc=SCENES[inj.into];
    if(!sc) return;
    if(!sc.choices) sc.choices=[];
    /* 逐條去重：同一個 buildScenes 重建後場景為全新物件，所有注入都會重放；
       若在同一物件上被重複呼叫，則依注入選擇 id 跳過已存在者。 */
    if(!sc.__v4ids) sc.__v4ids=[];
    if(sc.__v4ids.indexOf(inj.choice.__v4cid)!==-1) return;
    sc.__v4ids.push(inj.choice.__v4cid);
    sc.choices.push(inj.choice);
  });
}
V4.applyStory=applyStory;

/* ---------- 門扉通關標記（通用） ---------- */
V4.markDungeonCleared=function(id){
  var d=dungeons.filter(function(x){return x.id===id;})[0];
  if(d) safeSet(d.clearedKey,'true');
};

/* ---------- 第四扇門接入 ---------- */
function setupDungeon(def){
  var id=def.id;
  var st=def.stateInit();
  stateRefs[id]=st;
  var S={}; sceneRefs[id]=S;
  DUNGEON_CONFIG[id]={
    savePrefix:def.savePrefix, dungeonId:String(id), totalEndings:def.totalEndings,
    startScene:def.startScene, roomNum:def.roomNum, dungeonName:def.name,
    subText:def.subText, ruleText:def.ruleText||'',
    hasParty:!!def.hasParty, hasCountdown:!!def.hasCountdown, hasAdmin:!!def.hasAdmin,
    achDefs:def.achDefs?def.achDefs.slice():[]
  };
  window['buildScenes'+id]=function(){
    state=stateRefs[id]; SCENES=sceneRefs[id];
    if(def.buildScenes) def.buildScenes();
  };
  dungeons.push({id:id,name:def.name,index:def.index,bgNum:def.bgNum||def.roomNum,
                 tagline:def.tagline,clearedKey:def.clearedKey});

  /* 包裝 isUnlocked / isCleared / 背景動畫（只包裝一次） */
  if(!isUnlocked.__v4){
    var _u=isUnlocked;
    isUnlocked=function(x){
      if(V4._dungeonDefs[x]) return V4._dungeonDefs[x].unlock ? V4._dungeonDefs[x].unlock() : false;
      return _u(x);
    };
    isUnlocked.__v4=true;
  }
  if(!isCleared.__v4){
    var _c=isCleared;
    isCleared=function(x){
      var dd=V4._dungeonDefs[x];
      if(dd) return safeGet(dd.clearedKey)==='true';
      return _c(x);
    };
    isCleared.__v4=true;
  }
  if(!startBgNumAnimation.__v4){
    var _bg=startBgNumAnimation;
    startBgNumAnimation=function(x){
      if(V4._dungeonDefs[x]){ if(V4._dungeonDefs[x].bgAnimation) V4._dungeonDefs[x].bgAnimation(); return; }
      return _bg(x);
    };
    startBgNumAnimation.__v4=true;
  }
}

/* ---------- 啟動 ---------- */
V4.boot=function(){
  if(V4.__booted) return; V4.__booted=true;
  Object.keys(V4._dungeonDefs).forEach(function(k){ setupDungeon(V4._dungeonDefs[k]); });

  /* 追加成就，並重算 ACH_TOTAL */
  Object.keys(V4._achAdd).forEach(function(id){
    var cfg=DUNGEON_CONFIG[id]; if(!cfg) return;
    V4._achAdd[id].forEach(function(a){
      if(cfg.achDefs.filter(function(x){return x.id===a.id;}).length===0) cfg.achDefs.push(a);
    });
  });
  var achTot=0;
  Object.keys(DUNGEON_CONFIG).forEach(function(id){ achTot+=DUNGEON_CONFIG[id].achDefs.length; });
  ACH_TOTAL=achTot;

  /* 更新結局總數（1-3 追加，第四扇門直接給定） */
  [1,2,3].forEach(function(id){
    var pack=V4._story[id]; var add=pack?pack.endingsAdded||0:0;
    if(add){
      ENDING_TOTALS[id]=(ENDING_TOTALS[id]||0)+add;
      if(DUNGEON_CONFIG[id])DUNGEON_CONFIG[id].totalEndings=ENDING_TOTALS[id];
    }
  });
  Object.keys(V4._dungeonDefs).forEach(function(id){
    ENDING_TOTALS[id]=V4._dungeonDefs[id].totalEndings;
  });

  /* 包裝 buildScenes（必須在第四扇門設定之後） */
  [1,2,3,4].forEach(function(id){
    var key='buildScenes'+id, orig=window[key];
    if(!orig || orig.__wrapped) return;
    var wrapped=function(){ var r=orig.apply(this,arguments); try{applyStory(id);}catch(e){} return r; };
    wrapped.__wrapped=true; wrapped.__orig=orig; window[key]=wrapped;
  });

  /* 啟動系統 */
  V4._systems.forEach(function(s){ try{ s.init(); }catch(e){console.error('V4 系統「'+s.name+'」啟動失敗：',e);} });
  V4._postBoot.forEach(function(fn){ try{fn();}catch(e){console.error('postBoot 失敗：',e);} });

  /* 若已在迴廊，刷新一次以顯示第四扇門 */
  try{ if(document.getElementById('hub-screen').classList.contains('show') && typeof render==='function') render(); }catch(e){}
};

/* 啟動時機：所有模組腳本於其後載入，最後由 v4-boot 顯式呼叫 V4.boot()；
   此處再掛一個保險。 */
if(document.readyState==='loading'){
  window.addEventListener('DOMContentLoaded',function(){ setTimeout(function(){ if(window.V4 && !V4.__booted && V4._modulesLoaded) V4.boot(); },1); });
}
})();

/* ===== 10-dungeon1.js ===== */
/* ============================================================
 * 無盡之門 · v4.0 純增量劇情包
 * 門扉一「質數旅館」——樓梯口支線（0 號房 / 畫後夾層 / 石板密室）
 * 載入順序：00-core.js → 本片段 → V4.boot()
 * 純增量：不改寫任何既有場景，只透過 inject 加入口。
 * ============================================================ */

/* ---------- 新增成就（id 全域唯一 ach_d1_*） ---------- */
V4.addAchievements(1, [
  {id:'ach_d1_painter',     name:'畫布之後', desc:'掀開走廊那幅油畫，找到畫後的夾層'},
  {id:'ach_d1_prime_knock', name:'十一響',   desc:'敲出質數的節奏，打開不存在的 0 號門'}
]);

V4.registerStoryPack(1, {
  endingsAdded: 2,

  scenes: {

    /* ---------- 樓梯口：員工門 + 窄梯入口 ---------- */
    d1_stairwell: {
      room:'—', roomName:'二樓樓梯口', sceneId:'第四幕·支線', mood:'melancholy',
      text:[
        '<p>你離開走廊主段，往樓梯口走。梯間的燈壞了一半，踩在舊木階上，每一級都吱呀一聲。</p>',
        '<p>轉角平台上，一扇漆成灰綠色的門，門上釘著小木牌：「員工專用」。門把手上掛一把舊彈子鎖，銅綠都蝕進鎖眼裡了。</p>',
        '<p>門縫裡滲出一線風。不是旅館裡那種發霉的溫暖，是凌晨後巷的冷，夾著一點煤炭味。</p>',
        '<p>樓梯背面還有一道更窄的梯，沒有燈，扶手積了灰。梯間向下的牆縫裡，漏出一點淡金色的光。</p>'
      ],
      textReturn:[
        '<p>你又回到樓梯口。灰綠色的員工門還是那個樣子，彈子鎖紋絲不動。那道窄梯向下延伸，金光還在牆縫裡。</p>'
      ],
      choices:[
        {text:'走那道窄梯下去看看', next:'d1_loop_landing', personality:{cautious:-5}},
        {text:'用黃金鑰匙試那把彈子鎖', condition:function(){return hasItem('golden_key');}, next:'d1_service_exit', personality:{cautious:-5}},
        {text:'光著手去推那扇員工門', useless:true, flavor:'你把肩膀頂上去。門紋絲不動，像和牆長在了一起。門縫的風鑽進你領口，涼得你打了個寒顫。你縮回來。'},
        {text:'退回二樓走廊', next:'corridor'}
      ]
    },

    /* ---------- 逃過一劫結局：後巷 ---------- */
    d1_service_exit: {
      room:'—', roomName:'後巷', sceneId:'逃過一劫', mood:'calm',
      text:[
        '<p>黃金鑰匙插進彈子鎖，齒紋居然咬上了。你手腕一沉，鎖「噠」一聲開了。</p>',
        '<p>門外是鐵皮搭的後巷。凌晨的風灌進來，你冷得一個激靈——這麼久以來，你第一次覺得冷是「真的」。</p>',
        '<p>巷口外傳來推車的輪子聲，隱約有人在喊早市的號子。天還沒亮，但已經快了。</p>',
        '<p>你回頭看了一眼那扇門。你甚至沒去過 7 號房，沒碰過那面鏡子。你繞過了整局。</p>',
        '<p>樓上，另外三個人還在算質數。你沒有回去叫他們。</p>'
      ],
      onEnter:function(){
        setTimeout(function(){
          triggerEnding('survive_d1_service','後巷的風',
            '你用一把不該出現在這裡的鑰匙，打開了一扇不該由你打開的門。你活下來了，帶著凌晨的冷風和一點煤炭味。大廳裡的燈還在閃，沒人知道你走了。',
            '逃過一劫');
        }, 900);
      },
      choices:[]
    },

    /* ---------- 迴轉梯間：環之扉 + 0 號門謎題 ---------- */
    d1_loop_landing: {
      room:'—', roomName:'迴轉梯間', sceneId:'支線', mood:'mystery',
      onEnter:function(){ V4.findFragment('d1_loop'); },
      text:[
        '<p>窄梯沒有扶手，你扶著牆摸下去。走了十幾級，腳底才碰到底。</p>',
        '<p>這裡沒有燈，只有一扇門。門牌不是銅的也不是黑的——是一塊木牌，刻著一個字：「0」。</p>',
        '<p>你回頭數樓梯。下來的時候你記得數了十一級。現在抬頭看，梯口離你很近，近得不像走了十一級。</p>',
        '<p>牆上用粉筆畫了一道箭頭，從樓梯口直指這扇門。箭頭旁邊一行小字：「門後仍是這裡。」</p>',
        '<p>[glow]門縫裡透出一線淡金色的光，像有人在門後點了一支蠟燭。</p>',
        '<p>門框上方刻著一行更小的字：「旅館的房號都是質數。這一扇不屬於 1 到 10。敲幾下，才配打開它？」</p>'
      ],
      choices:[
        {text:'敲那扇 0 號門，數出下一個質數', action:function(){
          openPuzzle('解謎 · 0 號門',
            '旅館的房號都是質數。2、3、5、7 之後，下一個質數是幾？敲門幾下，門才會開？（輸入一個數字）',
            '11',
            function(ok){
              if(ok){
                unlockAchievement('ach_d1_prime_knock');
                goToScene('d1_zero_room');
              }else{
                appendNarrative('<p class="system-msg">門沒有開。門縫那點金光滅了。牆裡傳來很輕的、像笑聲又像歎息的聲音。後頸一緊。</p>');
                damage(10);
              }
            },
            '把質數由小到大背一遍：2、3、5、7……先別急著報 8——8 能被 2 整除。9 呢？10 呢？一路數下去，第一個除了 1 和自己、誰都除不盡的那個兩位數，就是答案。');
        }},
        {text:'推開身後的門，走上樓梯回去', next:'d1_stairwell'},
        {text:'對著空氣再數一遍樓梯', useless:true, flavor:'十一級。你又數一遍。十級。第三遍的時候你放棄了。也許樓梯自己也不確定自己有幾級。'},
        {text:'把耳朵貼在 0 號門上聽', observe:'門後沒有聲音。不是安靜——是「沒有」。像牆那邊什麼都不存在。你貼了十秒，後頸的汗毛一根根豎起來。你直起身。'}
      ]
    },

    /* ---------- 0 號房：隱藏區域 + 鏡之扉 + 隱藏結局 ---------- */
    d1_zero_room: {
      room:'0', roomName:'0 號房', sceneId:'支線·隱藏', mood:'dread',
      onEnter:function(){ V4.findFragment('d1_mirror'); },
      text:[
        '<p>敲到第十一響，門「咔」地一聲開了。</p>',
        '<p>門後不是門牌上該有的房間。這裡沒有床，沒有窗，牆是白的，和迴廊一樣白。</p>',
        '<p>正中一張圓桌。桌上一面鏡子，鏡面朝下扣著。四周牆上開滿了門——一模一樣的木門，每扇門牌都刻著「0」。</p>',
        '<p>你推開最近一扇。門後還是這間房。圓桌。鏡子朝下。滿牆的 0 號門。</p>',
        '<p>你退回圓桌邊，把鏡子翻了過來。</p>',
        '<p>[ghost]鏡子裡不是你。是大廳。是前台。蘇晚——或者那個「蘇晚」——正站在你剛才站過的位置，對著鏡頭方向微笑。</p>',
        '<p>那個笑，你從來沒有過。</p>'
      ],
      choices:[
        {text:'把鏡子翻回背面，從來時的門退出去', next:'d1_stairwell'},
        {text:'對著鏡子說：「你不是我。」', danger:true, action:function(){
          appendNarrative('<p>你湊近鏡子，聲音很平：<span class="dialogue">你不是我。我沒有那種笑。</span></p>');
          appendNarrative('<p>鏡子裡那個「蘇晚」的笑僵住了。然後一圈裂紋從她眉間爬開。</p>');
          appendNarrative('<p>碎的不是玻璃。是這間房。滿牆的 0 號門一扇接一扇塌下去，露出背後白的、無盡的迴廊。</p>');
          setTimeout(function(){
            triggerEnding('hidden_d1_mirror_self','鏡中屋',
              '你在一間不存在的房間裡，認出了一張不該有的臉。滿牆的門一齊倒下，門後沒有旅館——只有迴廊，和迴廊裡那個終於不笑了的「你」。',
              '隱藏結局');
          }, 1300);
        }}
      ]
    },

    /* ---------- 畫後夾層：隱藏區域 ---------- */
    d1_behind_painting: {
      room:'—', roomName:'畫框之後', sceneId:'支線·隱藏', mood:'mystery',
      onEnter:function(){ unlockAchievement('ach_d1_painter'); },
      text:[
        '<p>你抓住畫框下沿，兩腳頂住牆，用力一掀。</p>',
        '<p>畫布連框離開牆面——牆上居然開著一扇門。和畫框一樣大，像是有人先在牆上挖了門，再用油畫把它蓋住。</p>',
        '<p>門後是一間不到兩坪的夾層。黑，嗆著松節油和顏料乾透了的味道。</p>',
        '<p>牆上釘滿了同一幅畫的草圖：大廳、前台、四個旅客。每一幅的角落都多畫了一個人。畫到最後一張，角落那個人被畫上了臉。</p>',
        '<p>是你。</p>',
        '<p>草圖底下壓著一張泛黃的結算單。房號那一欄印著「1」，金額是空的。落款一行鋼筆字：「本旅館不招待 1 號客人。1 既非質數，也非合數——它什麼都不是。」</p>'
      ],
      choices:[
        {text:'把油畫掛回去，退回走廊', next:'corridor'},
        {text:'把那張畫了你的草圖撕下來', useless:true, flavor:'紙很脆，撕下來的時候響了一聲。你把它疊好塞進口袋。也許出去以後，你想知道這一夜自己長什麼樣。'},
        {text:'數一數牆上有幾張草圖', useless:true, flavor:'十一張。每一張角落那個人，都比上一張離你更近一點。最後一張，他的眼睛畫好了。'}
      ]
    },

    /* ---------- 石板下的密室：質之扉 ---------- */
    d1_cellar: {
      room:'—', roomName:'石板之下', sceneId:'支線', mood:'dread',
      onEnter:function(){ V4.findFragment('d1_prime'); },
      text:[
        '<p>你蹲下，指甲摳進那塊鬆石板的縫，往上一掀。石板翻開，下面不是土。</p>',
        '<p>是一間剛好容你蹲下的密室。空氣裡全是粉筆的灰味。</p>',
        '<p>牆上用粉筆畫著一條數帶，從牆這頭排到那頭：2、3、5、7、11、13……寫到粉筆斷了為止。每隔三個數，牆上就釘一張住客的照片。</p>',
        '<p>照片下面各有一個日期。日期最近那張，框是空的。</p>',
        '<p>地面正中間刻著一行字，刻得很深：「質數是旅館的門牌。1 不是質數，所以 1 號從來沒有住客。可出口就是 1 號——它不屬於質數，它屬於走得出去的人。」</p>',
        '<p>[glow]你忽然明白，這旅館一直在等你自己想通這件事。</p>'
      ],
      choices:[
        {text:'鑽回地下室', next:'basement'},
        {text:'對著那張空照片框站一會', useless:true, flavor:'你站了一會。空框比任何照片都重。你不知道下一個被釘進來的是誰——也許是你，也許不是。你把石板蓋回去了。'}
      ]
    }

  },

  /* ---------- 自然注入：在既有場景尾端追加入口 ----------
   * 注意：V4.applyStory 對同一場景只注入第一條（__v4inj 護欄），
   * 故三個入口分別注入三個不同場景。 */
  inject:[
    /* 二樓走廊：樓梯口支線（員工門 / 窄梯） */
    {into:'corridor', choice:{text:'走回樓梯口，檢查那扇「員工專用」的門', next:'d1_stairwell'}},
    /* 走廊凝視選單：原本就能「盯著那幅油畫看」，掀開畫框是順勢升級 */
    {into:'corridor_focus', choice:{text:'把那幅油畫連框掀起來', next:'d1_behind_painting'}},
    /* 地下室：既有「踩石頭」flavor 已埋「有一塊有點鬆」的伏筆 */
    {into:'basement', choice:{text:'撬開那塊鬆動的石板', next:'d1_cellar'}}
  ]
});

/* ===== 11-dungeon2.js ===== */
/* ============================================================
 * 無盡之門 · v4.0 增量劇情包 11 —— 第二扇門「沉默圖書館」
 * 主題：不出聲。
 * 新增：6 個場景（含 1 隱藏區「黑書架牆縫」）、2 個結局、
 *       2 個成就、1 個杜威分類謎題、3 枚迴廊碎片。
 * 純增量：不改寫任何既有內容，只經 inject 加入自然入口。
 * ============================================================ */
(function(){
'use strict';

/* ---------- 成就（id 全域唯一） ---------- */
V4.addAchievements(2,[
  {id:'ach_d2_whisper', name:'耳語的人', desc:'在迴音走道裡，全程沒有出一聲'},
  {id:'ach_d2_deleted', name:'被刪的書', desc:'找到黑書架牆縫後，那本被颳掉名字的書'}
]);

/* ---------- 劇情包 ---------- */
V4.registerStoryPack(2,{
  endingsAdded:2,

  scenes:{

    /* ① 索書號壁龕——杜威分類謎題（0200） */
    d2_catalog_alcove:{
      room:'工具書區',roomName:'卡片目錄深處',sceneId:'2-4-E2 壁龕',mood:'mystery',
      text:[
        '<p>工具書區那排卡片目錄櫃，你拉過500那一格。今天你注意到最盡頭還有一格，比別的深半寸。</p>',
        '<p>你蹲下來看。抽屜面板上貼著小紙條，是管理員的字：「這本書沒有書名。它記錄所有不出聲的人。把它歸回該在的類。」</p>',
        '<p>側邊一個四位數字鎖。抽屜旁邊散著三張舊卡片，你認得——</p>',
        '<p class="dialogue">「100 哲學。」「020 圖書館學。」「800 文學。」</p>',
        '<p class="system-msg">這座館本身，該歸進哪一類？</p>'
      ],
      onEnter:function(){ state.flags.d2_alcove_found=true; },
      choices:[
        {text:'輸入四位索書號解鎖',action:function(){
          openPuzzle('索書號鎖',
            '提示：這座館本身——圖書館學與資訊科學——在杜威十進分類法裡是哪三位數？照館內慣例，第四位補0。',
            '0200',
            function(ok){
              if(ok){
                state.flags.d2_alcove_solved=true;
                addItem('d2_deleted_card','被刪書的索書卡','一張手寫卡片：《無聲之書》。索書號被墨水塗掉一半。背面寫著：「黑書架牆根，第三道縫。」');
                addNote('d2_deleted_note','牆縫的位置','被刪書的索書卡背面：黑書架牆根，第三道縫。');
                appendNarrative('<p class="inherit-note">鎖「咯」一聲開了。抽屜裡躺著一張索書卡，索書號被墨水塗掉了一半，只剩「02」。</p>');
                appendNarrative('<p>卡片背面，孩子的字跡：「黑書架牆根，第三道縫。」</p>');
              }else{
                damage(10);
                appendNarrative('<p class="action">鎖芯傳來一聲細小的「噠」。你的指腹被燙出一道白印。</p>');
              }
            },
            '杜威分類法的百位分段：000 是總類，裡面 020 專指圖書館學與資訊科學。這座沒有聲音的館，記錄的就是它自己。四位索書號末位補0。');
        }},
        {text:'放回卡片，回閱覽區',next:'reading_room'}
      ]
    },

    /* ② 迴音走道——「不出聲」機制示範 */
    d2_silent_aisle:{
      room:'書架深處',roomName:'沒掛號的窄走道',sceneId:'2-4-A2 迴音',mood:'tension',
      text:[
        '<p>A-E區盡頭，兩排書架之間有一條窄道，沒有分類號，燈也不亮。</p>',
        '<p>你邁進去。腳步落下的瞬間，回聲從書架夾牆之間彈回來——比你的腳步晚半拍，而且是兩倍大。</p>',
        '<p>你停住。再邁一步，回聲跟著再大一分。</p>',
        '<p class="system-msg">這條走道裡，聲音會加倍還給你。</p>'
      ],
      onEnter:function(){ state.flags.d2_aisle_found=true; },
      choices:[
        {text:'完全屏住呼吸，貼牆摸過去',personality:{calm:+10},action:function(){
          state.flags.d2_aisle_silent=true;
          unlockAchievement('ach_d2_whisper');
          appendNarrative('<p>你把呼吸壓到最輕，腳尖先落地，再放腳跟。夾牆之間一片死寂——連回聲都覺得沒東西可還。</p>');
          appendNarrative('<p>你走過去了。走道盡頭，一個小壁龕。</p>');
          goToScene('d2_aisle_niche');
        }},
        {text:'輕咳一聲，試試回聲有多大',action:function(){
          damage(5);
          appendNarrative('<p>你輕輕咳了一下。回聲加倍地撞回來，「咳——」「咳——」，一層一層散開。最近的一排書「沙沙」翻了半頁。</p>');
          appendNarrative('<p>你不敢再試，快步走到盡頭。</p>');
          goToScene('d2_aisle_niche');
        }},
        {text:'喊一聲，測這條走道到底有多深',danger:true,personality:{calm:-15},next:'d2_ending_echo'},
        {text:'後退，退出窄道',next:'bookshelf'}
      ]
    },

    /* ③ 走道盡頭的壁龕 */
    d2_aisle_niche:{
      room:'書架深處',roomName:'走道盡頭',sceneId:'2-4-A3 壁龕',mood:'melancholy',
      text:[
        '<p>窄道盡頭一個小壁龕。龕裡沒有書，只有一張折好的紙。</p>',
        '<p>你展開。是第二任管理員的字：</p>',
        '<p>「這條走道是我砌的。聲音進來，加倍出去。所以別出聲。」</p>',
        '<p>「我在這裡等過媛媛睡著。她白天畫貓，晚上怕黑，我就帶她來這條走道——安靜，夠長，長到她睡著為止。」</p>',
        '<p class="inherit-note">線索：第二任管理員在這條走道裡，哄過媛媛。</p>'
      ],
      choices:[
        {text:'把紙收好，退回書架區',next:'bookshelf'},
        {text:'再讀一遍那行「等她睡著」',useless:true,flavor:'你把那行字讀了兩遍。壁龕裡涼涼的，像真的等過誰很久。'}
      ]
    },

    /* ④ 黑書架牆縫——隱藏區（含碎片 d2_forbid、結局入口） */
    d2_wall_gap:{
      room:'禁書區深處',roomName:'牆後的夾層',sceneId:'2-5-B2 隱藏',mapZone:'forbidden',mood:'mystery',
      getText:function(st){
        var hasCard=(st.inventory||[]).some(function(i){return i.id==='d2_deleted_card';});
        return [
          '<p>禁書區的黑書架在這裡長成了一面牆——沒有層板，書脊與書脊擠成磚。</p>',
          hasCard
            ? '<p>你想起那張索書卡：黑書架牆根，第三道縫。你數過去——第一道，第二道，第三道。</p>'
            : '<p>你數著牆根的書縫。第三道，比別的寬一指。你側過身子。</p>',
          '<p>剛好容一個人擠進去。</p>',
          '<p>牆後不是房間。是書與書之間的一個夾層，矮得要蹲。正中一個小木架，架上一本黑皮書，書名被人用刀颳掉了。</p>',
          '<p>空氣裡那股孩子房間的味道，在這裡最濃。像有人在這夾層裡，輕輕呼吸了很多年。</p>'
        ];
      },
      onEnter:function(){
        state.flags.d2_wall_gap_found=true;
        V4.findFragment('d2_forbid');
        unlockAchievement('ach_d2_deleted');
      },
      choices:[
        {text:'把黑皮書帶走',action:function(){
          addItem('d2_silent_book','《無聲之書》','一本被颳掉書名的黑皮書。翻開，每一頁都是空白。');
          appendNarrative('<p>你把書抽出木架。書頁很軟，像被人翻過無數遍。翻開——每一頁都是空白。</p>');
          appendNarrative('<p>你把它塞進外套。轉身擠了出去。</p>');
          goToScene('forbidden_inner');
        }},
        {text:'把書放回原處，用背把牆縫掩上，全程不出一聲',personality:{calm:+15,altruism:+5},next:'d2_ending_hush'},
        {text:'多看一眼那個木架',observe:'你蹲在夾層裡，慢慢看。<p>木架邊緣有一排小小的指甲痕，很高——是一個六歲孩子墊著腳夠書架留下的。她夠了很久。</p><p>黑皮書旁邊，壓著一張蠟筆畫：一個大人，一個小孩，中間一隻貓。畫紙邊角捲了。你沒碰。</p><p>夾層頂上有一道很細的光，從書縫裡漏下來。在灰塵裡慢慢動。像有人用手指，輕輕指過你。</p>'},
        {text:'側身退出，回禁書區',next:'forbidden_inner'}
      ]
    },

    /* ⑤ 地下書庫一角（含碎片 d2_below） */
    d2_under_stack:{
      room:'地下室',roomName:'牆根夾角',sceneId:'2-5-C2 地下',mapZone:'basement',mood:'dread',
      text:[
        '<p>你沒跑。你蹲低，貼著牆根的夾角，一點一點挪。</p>',
        '<p>正中那團黑東西在動。那些長手指從你頭頂半空抓過去，差一寸。沒摸到你。</p>',
        '<p>夾角裡堆著一個紙箱，被壓在書架底下。你掀開蓋——一箱被刪掉的讀者登記卡。</p>',
        '<p>最上面一張：「1993年5月17日，陳媛媛，讀者證註銷。原因：讀者已不在。」</p>',
        '<p>下面一疊，全是同一年的名字。每張角落都蓋著同一個印章——「刪除」。有的卡上，名字被人用指腹摸得發毛。</p>',
        '<p class="inherit-note">線索：被刪掉的人，不只媛媛一個。</p>'
      ],
      onEnter:function(){
        state.flags.d2_under_found=true;
        V4.findFragment('d2_below');
        addNote('d2_deleted_records','被刪的讀者','地下書庫夾角一箱登記卡，1993年，全蓋「刪除」。媛媛那張在最上面。');
        damage(5);
      },
      choices:[
        {text:'順著牆根退出去，回到閱覽區',next:'first_bell'},
        {text:'再翻一張別人的卡',useless:true,flavor:'你抽出中間一張。名字被塗掉了。註銷原因那一欄，只寫了四個字：「沒有聲音。」你把它放回去，和別的卡疊齊。'}
      ]
    },

    /* ⑥ 三隻貓（含碎片 d2_cat） */
    d2_cat_names:{
      room:'禁書區深處',roomName:'三隻貓',sceneId:'2-5-D2 貓',mapZone:'forbidden',mood:'melancholy',
      text:[
        '<p>你蹲在矮架前，看那隻毛線貓。然後你看見——這片黑書架上，貓不只一隻。</p>',
        '<p>第一隻，用釘子刻在書脊之間的木框上，三瓣鬚，尾巴捲成一個圈。</p>',
        '<p>第二隻，畫冊某一頁的頁腳，蠟筆勾的，只畫了半隻，像畫到一半被人叫走。</p>',
        '<p>第三隻，就是你手邊這隻毛線貓。肚子上那三顆紐扣，你剛按過。</p>',
        '<p>三隻貓。你數出來了。它們沒有名字——那個畫貓的孩子，從來沒給它們起過名字。她只是畫了又畫。</p>',
        '<p class="inherit-note">線索：三隻貓，都與媛媛有關。</p>'
      ],
      onEnter:function(){
        state.flags.d2_cat_names_done=true;
        V4.findFragment('d2_cat');
      },
      choices:[
        {text:'輕輕把毛線貓放回矮架',next:'forbidden_inner'},
        {text:'數一數那三顆紐扣',useless:true,flavor:'第一顆，第二顆，第三顆。它們沉下去過一次，現在還沒彈回來。你別再按。'}
      ]
    },

    /* 結局 A：無聲之書（hidden） */
    d2_ending_hush:{
      room:'禁書區深處',roomName:'無聲',sceneId:'隱藏結局',mapZone:'forbidden',mood:'melancholy',
      text:[
        '<p>你把黑皮書放回木架。對齊，壓平。</p>',
        '<p>你側身退出牆縫。用背，用肩膀，把書架的縫一寸一寸頂回原處——動作很慢，沒有一聲。</p>',
        '<p>你站在禁書區中央。黑書架安靜地長著，像什麼都沒發生過。</p>',
        '<p>你轉身。腳步很輕。這一次，連回聲都沒有。</p>'
      ],
      onEnter:function(){
        setTimeout(function(){
          triggerEnding('hidden_d2_hush','無聲之書',
            '你讀懂了這座館的規矩：有些東西不該被帶走，也不該被念出聲。你把它放回原處，用全身的安靜掩上那道縫。圖書館認出了你——不是作為讀者，是作為一個懂得不出聲的人。',
            '隱藏結局');
        },900);
      },
      choices:[]
    },

    /* 結局 B：回音（bad） */
    d2_ending_echo:{
      room:'書架深處',roomName:'回音',sceneId:'壞結局',mapZone:'fiction',mood:'terror',
      text:[
        '<p>你喊了一聲。</p>',
        '<p>回聲從夾牆之間彈回來——不是一倍，是三倍。你的聲音在書架之間撞來撞去，越撞越尖，越尖越近。</p>',
        '<p>然後所有書架，同一時間，動了。</p>',
        '<p>黑色的手從每一條書縫裡伸出來。它們不抓別人。它們只抓出聲的那個。</p>',
        '<p>你最後聽見的，是自己的聲音被切成無數份，分別關進了無數本空白的書裡。</p>'
      ],
      onEnter:function(){
        setTimeout(function(){
          triggerEnding('bad_d2_echo','回音',
            '你在迴音走道裡出了聲。聲音被加倍送回來，也被書架聽見了。',
            '壞結局 · 你成了走道裡又一道回聲');
        },900);
      },
      choices:[]
    }

  },

  /* ---------- 自然入口 ---------- */
  inject:[
    {into:'reading_room', choice:{text:'工具書區旁，那格特別深的卡片抽屜', next:'d2_catalog_alcove', condition:function(){return !hasFlag('d2_alcove_found');}}},
    {into:'bookshelf',     choice:{text:'書架之間，一條沒掛號的窄走道',       next:'d2_silent_aisle',   condition:function(){return !hasFlag('d2_aisle_found');}}},
    {into:'forbidden_inner',choice:{text:'黑書架牆根，好像有一道縫',          next:'d2_wall_gap',       condition:function(){return !hasFlag('d2_wall_gap_found');}}},
    {into:'yuanyuan_end',  choice:{text:'矮架上那隻毛線貓，旁邊好像還有別的貓',next:'d2_cat_names',  condition:function(){return !hasFlag('d2_cat_names_done');}}},
    {into:'basement',      choice:{text:'先別跑——牆根那個夾角藏得住人',       next:'d2_under_stack',    condition:function(){return !hasFlag('d2_under_found');}}}
  ]

});
})();

/* ===== 12-dungeon3.js ===== */
/* ============================================================
 * 無盡之門 · v4.0 增量劇情包 —— 第三扇門「倒計時醫院」(v4.1)
 * 純增量：不修改任何既有內容，只透過 V4 註冊新場景、注入入口。
 *
 * 新增清單：
 *  - 新場景 ×5：d3_morgue_back（太平間牆後·秘密區）、d3_404_under（404牆板下）、
 *               d3_b2_behind（B2散熱間·秘密區）、d3_overload（壞結局場）、
 *               d3_ending_names（好結局場）
 *  - 新結局 ×2：bad_d3_overload「斷電」、hidden_d3_names「十四個名字」(endingsAdded:2)
 *  - 新成就 ×2：ach_d3_names「牆下的名字」、ach_d3_service「幕後」
 *  - 新謎題 ×1：散熱間密碼鎖（答案 0415，含提示）
 *  - 碎片 ×3：d3_morgue（太平間牆後）、d3_wait（404牆板下）、d3_core（B2散熱間）
 * ============================================================ */
(function(){
'use strict';

/* ---------- 新成就（id 全域唯一，於符合條件處解鎖） ---------- */
V4.addAchievements(3,[
  {id:'ach_d3_names',  name:'牆下的名字', desc:'讀出404牆板下十四個人的名字'},
  {id:'ach_d3_service',name:'幕後',       desc:'找到記憶主機後面的散熱間'}
]);

V4.registerStoryPack(3,{
  endingsAdded:2,

  scenes:{

    /* ===== 秘密區域一：太平間 N 格之後（需先解開太平間密碼） ===== */
    d3_morgue_back:{
      room:'B1',roomName:'第十四格之後',sceneId:'3-4-D 牆後',mapZone:'morgue',mood:'mystery',
      text:[
        '<p>你拉住N格的抽屜底板。它比你想的輕——後面不是水泥。</p>',
        '<p>底板底下是空的。你把它掀起來，抽屜後面露出一個剛好能容一個人的夾層。</p>',
        '<p>你鑽進去。膝蓋頂著下巴。空氣更冷，帶著鐵鏽和紙張發黴的味道。</p>',
        '<p>夾層深處釘著一只鐵盒，沒有鎖。裡面是周敏的夜班交接本。</p>',
        '<p>你翻開。字跡一開始很工整，後來越來越抖：</p>',
        '<p>「3月2日。院長說，機器只是『備忘錄』。我信了。」</p>',
        '<p>「4月10日。3床開始對著空氣叫爸爸。院長說是正常的。」</p>',
        '<p>「4月15日。機器沒有停。我問院長要不要報警。他說報了警，媛媛就真的死了。」</p>',
        '<p>「4月16日。我送了十四個人下來。他們還活著。我沒有忘記他們的名字。」</p>',
        '<p>最後一頁只有一行，用鉛筆寫了又擦、擦了又寫：</p>',
        '<p class="dialogue">「別把他們的名字和我一起鎖進抽屜。有人會來念的。」</p>',
        '<p>交接本底下壓著一小片東西。不是紙。半透明，像從記憶上撕下來的一角。你捏起來的時候，它在你指間輕輕發亮。</p>'
      ],
      textReturn:[
        '<p>你鑽回N格後的夾層。鐵盒裡的交接本攤開著，翻在4月16日那頁。</p>',
        '<p>你讀過了。周敏沒有忘記那十四個名字。她只是把它們藏起來，等一個會念出來的人。</p>'
      ],
      onEnter:function(){
        if(!state.flags.d3_morgue_back_done){
          state.flags.d3_morgue_back_done=true;
          addNote('note_d3_handover','周敏的交接本','N格抽屜背板後的夾層裡，藏著一本夜班交接本。4月16日那頁：我送了十四個人下來。他們還活著。我沒有忘記他們的名字。');
          V4.findFragment('d3_morgue');
          loseTime(3);
        }else{ showToast('牆後的夾層看過了'); }
      },
      choices:[
        {text:'鑽回太平間',next:'morgue'}
      ]
    },

    /* ===== 秘密區域二：404 牆板下（十四個名字） ===== */
    d3_404_under:{
      room:'4F',roomName:'404·牆板下',sceneId:'3-3-B 牆下',mapZone:'ward4',mood:'melancholy',
      text:[
        '<p>膠帶乾了，那張貼歪的「等」字紙，輕輕一揭就下來了。</p>',
        '<p>牆板上留著一圈圈發黃的膠痕。你撕到第三張的時候，指尖摸到下面凹凸不平。</p>',
        '<p>不是膠痕。是字。</p>',
        '<p>有人用原子筆，在牆板最下面、齊膝蓋高的地方，一個一個寫名字。寫得很擠，像怕寫不下：</p>',
        '<p>「張國棟。李素芬。王小滿。趙長生。陳玉蘭。」</p>',
        '<p>「劉志遠。周雅琴。吳解放。孫小梅。鄭天成。」</p>',
        '<p>「馮雪。何偉。林秀貞。黃阿土。」</p>',
        '<p>十四個。</p>',
        '<p>你一個一個讀過去。讀到一半，你發現自己不自覺放輕了聲音——像在病房門外走路。</p>',
        '<p>讀完最後一個，你站了很久。</p>',
        '<p class="inherit-note">線索：404的牆板下，有十四個名字。就是太平間那十四個「無名」。周敏沒有忘記，寫字的人也沒有。</p>',
        '<p>名字旁邊釘著一張更小的紙，紙上畫著一隻歪歪扭扭的貓。和媛媛紙飛機上那隻，是同一筆畫法。</p>',
        '<p>你把紙按原樣貼回去。膠帶還黏。</p>'
      ],
      textReturn:[
        '<p>你揭開那張貼歪的「等」。牆板下的十四個名字還在。你讀過了。</p>',
        '<p>名字旁邊那隻歪貓還釘著。你沒有動它。</p>'
      ],
      onEnter:function(){
        if(!state.flags.d3_names_read){
          state.flags.d3_names_read=true;
          unlockAchievement('ach_d3_names');
          addNote('note_d3_names','牆板下的十四個名字','404病房牆板齊膝高處，有人寫下了太平間那十四個無名件的名字。一個都沒有少。名字旁邊畫著一隻貓。');
          V4.findFragment('d3_wait');
          loseTime(2);
        }else{ showToast('牆下的名字讀過了'); }
      },
      choices:[
        {text:'回到404病房',next:'ward4_4'}
      ]
    },

    /* ===== 秘密區域三：B2 主機後面的散熱間（謎題 + 壞結局岔路） ===== */
    d3_b2_behind:{
      room:'B2',roomName:'機房後側',sceneId:'3-4-D 幕後',mapZone:'basement',mood:'mystery',
      text:[
        '<p>主機後面比你想的寬。一條窄通道，冷氣從地板的出風口往上冒。</p>',
        '<p>通道盡頭是一扇半開的員工門。門牌寫著：「記憶庫·散熱間。非維護人員勿入。」</p>',
        '<p>散熱間不大。鐵架子靠牆排開，一格一格，每格插著一張記憶卡。卡片上貼著標籤——不是病人編號，是手寫的名字。</p>',
        '<p>你一路看過去。十幾張卡，名字都不同。最裡面一格是空的，標籤寫著：「陳媛媛。1987-1993。原件已轉主機。」</p>',
        '<p>房間中央一張掉漆的桌子，桌上一台終端，螢幕還亮著。進度條緩緩爬：</p>',
        '<p class="system-msg">記憶存儲量：98.7%。 已釋放：0.0%。</p>',
        '<p>大廳接待台那台黑螢幕上閃過的「記憶提取進度」，原來是從這裡發出去的。</p>',
        '<p>桌子角落釘著一只密碼鎖鐵盒。盒上壓著一張交接單：</p>',
        '<p>「應急停機密碼＝院長當年親筆拒絕的那一天。月日，四位。」</p>',
        '<p>終端旁邊立著一個紅色閘刀，上著塑料封條：「全機斷電。誤觸後果自負。」</p>',
        '<p class="action">這裡的每一樣東西，都像在等你做一個決定。</p>'
      ],
      textReturn:[
        '<p>你走回散熱間。鐵架子上的記憶卡一排排插著，全是名字。</p>',
        '<p>最裡面那格是空的——媛媛的原件已經轉去主機了。你讀過了。</p>',
        '<p>終端螢幕上的進度條還在走。98.7%。一點都沒有釋放。</p>'
      ],
      onEnter:function(){
        if(!state.flags.d3_service_done){
          state.flags.d3_service_done=true;
          unlockAchievement('ach_d3_service');
          addNote('note_d3_service','機房後側','主機後面有一間散熱間。十幾張記憶卡上貼著病人的名字。空的那一格寫著陳媛媛。終端顯示：記憶存儲量98.7%，已釋放0.0%。');
          V4.findFragment('d3_core');
          loseTime(4);
        }else{ showToast('機房後側來過了'); }
      },
      choices:[
        {text:'輸入密碼，打開鐵盒（解謎）',condition:function(){return !state.flags.d3_box_open;},action:function(){
          openPuzzle('散熱間密碼鎖','交接單上寫著：「應急停機密碼＝院長當年親筆拒絕的那一天。」\n\n那天MK-II過載，十四個人同時記憶崩潰，院長卻在事故報告上簽了「拒絕停機」。\n\n輸入四位數字：月兩位、日兩位。','0415',function(ok){
            if(ok){
              state.flags.d3_box_open=true;
              addItem('d3_names_card','十四個名字的備份卡','周敏藏在散熱間的記憶備份。上面是十四個被忘記的名字。');
              appendNarrative('<p class="inherit-note">鎖「咔」一聲開了。裡面是一張小小的備份卡，貼著便條：「給肯讀完那些名字的人。——周敏」</p>');
            }else{
              damage(10);
              appendNarrative('<p class="system-msg">密碼鎖吐出一聲悶響。電流順著你的指尖麻上手肘。生命-10。你還可以再試一次。</p>');
            }
          }, '線索散落在這一層你走過的地方：二樓那份病歷拼圖寫明了MK-II過載、十四人同時崩潰的那一天；外科年度報告上，「事故」兩個字後面跟著同一個日期。把那一天寫成月兩位、日兩位。');
        }},
        {text:'扳下「全機斷電」閘刀',danger:true,personality:{cautious:-15},action:function(){
          appendNarrative('<p>你撕開塑料封條，握住閘刀，往下扳到底。</p><p>冷風猛地停了。整間機房安靜得不像話。</p><p>然後你聽見主機那邊傳來一個聲音——不是她的聲音。是機器本身，像一個憋了三十年的哈欠，終於打到一半。</p><p>它在餓。</p>');
          setTimeout(function(){ goToScene('d3_overload'); },1500);
        }},
        {text:'回到記憶核心',next:'basement'}
      ]
    },

    /* ===== 新壞結局：斷電 ===== */
    d3_overload:{
      room:'B2',roomName:'斷電',sceneId:'壞結局',mapZone:'basement',mood:'terror',
      text:[
        '<p>閘刀落下。</p>',
        '<p>主機的燈一盞一盞暗下去。螢幕上的98.7%停住了，然後開始扭曲——不是減少，是像水面被搖過。</p>',
        '<p>那團記憶「轉」過來。這次她沒有問你是不是爸爸。</p>',
        '<p class="dialogue">你要走了？她說。聲音很小。你把燈關了。我一個人？</p>',
        '<p>斷電不是停機。是把她從供電裡撕開。她慌了。三十年來第一次，她沒有東西可以抓。</p>',
        '<p>她抓住了你。</p>',
        '<p>你感覺到腦子裡有什麼被抽出去。不是記憶——是「你」這件事本身。數學系。實驗室。那杯太甜的紅豆麵包。你一個一個，想不起來。</p>',
        '<p class="system-msg">太平間登記簿自動翻頁。新增一行：「送件人：系統。件名：無名。件數：15。」</p>',
        '<p>你最後一個念頭是：手環上的倒計時，好像從來沒有存在過。</p>'
      ],
      onEnter:function(){
        setTimeout(function(){
          triggerEnding('bad_d3_overload','斷電','你以為斷電是放走她。但斷了電的機器只會做一件事——從最近的東西身上找記憶充電。它找到了你。太平間的件數，從14變成了15。','壞結局 · 第十五格·貳');
        },800);
      },
      choices:[]
    },

    /* ===== 新好結局：十四個名字 ===== */
    d3_ending_names:{
      room:'B2',roomName:'十四個名字',sceneId:'結局',mapZone:'basement',mood:'melancholy',
      text:[
        '<p>你把那張備份卡舉起來。卡面上的便條被體溫焐得發軟。</p>',
        '<p>你沒有回答她「是不是爸爸」。你一個一個，念出了那些名字。</p>',
        '<p>「張國棟。李素芬。王小滿。趙長生。陳玉蘭。」</p>',
        '<p>她安靜下來了。那團記憶的輪廓不再晃。</p>',
        '<p>「劉志遠。周雅琴。吳解放。孫小梅。鄭天成。」</p>',
        '<p>每念一個，就有一小片光從她身上脫離。像光終於想起自己該去哪裡。它們飄向門口，一個接一個，穿過牆，不見了。</p>',
        '<p>「馮雪。何偉。林秀貞。黃阿土。」</p>',
        '<p>十四片。十四個。一張都沒有少。</p>',
        '<p>她身上的霧薄下去。原來那團龐大的、會吃人的東西，本來只該是一個六歲女孩的記憶。多出來的部分，全是別人的。現在，還回去了。</p>',
        '<p class="dialogue">他們都有人來認領了。她說。聲音輕得像風鈴。</p>',
        '<p>她抬起那團小小的光，看著你。</p>',
        '<p class="dialogue">那……我呢？她說。我叫什麼？</p>',
        '<p>你蹲下來，讓自己和她一樣高。</p>',
        '<p>「你叫媛媛。」你說。「陳媛媛。你爸爸叫陳安康。你畫的貓歪歪扭扭。你說過，你要去外面等他。」</p>',
        '<p>那團光靜了很久很久。</p>',
        '<p>然後它像紙飛機一樣，慢慢轉了一個圈，朝門口飄去。飄到一半，它回頭，輕輕晃了一下——像在揮手。</p>',
        '<p>機器螢幕上的字一行一行跳出來：</p>',
        '<p class="system-msg">記憶存儲量：0.0%。 已釋放：100%。 狀態：空閒。</p>',
        '<p>你走出大門。外面是清晨。大榕樹的影子拉得很長。</p>'
      ],
      onEnter:function(){
        saveInheritance({third_cleared:true,memory_kept:true});
        localStorage.setItem('wuxian-third-cleared','true');
        setTimeout(function(){
          triggerEnding('hidden_d3_names','十四個名字','你沒有騙她，也沒有刪掉她。你念出了那十四個被忘記的名字，一個一個，把他們還給了外面。最後她問你她叫什麼。你記得。','隱藏結局 · 「念名者」稱號');
        },900);
      },
      choices:[]
    }
  },

  /* ---------- 自然入口注入 ---------- */
  inject:[
    /* 太平間：解開第十四格密碼後，抽屜背板後面另有夾層 */
    {into:'morgue',choice:{
      text:'拉開N格之後，摸一摸抽屜後面那塊發空的牆',
      condition:function(){ return hasFlag('morgue_puzzle_done'); },
      next:'d3_morgue_back'
    }},
    /* 404：貼歪的「等」字紙下面，壓著別的東西 */
    {into:'ward4_4',choice:{
      text:'撕下一張貼歪的「等」字紙，看看牆上本來有什麼',
      next:'d3_404_under'
    }},
    /* B2走廊：核心區門側的員工通道（散熱間入口） */
    {into:'basement_entrance',choice:{
      text:'注意到走廊側邊有一扇員工門——門縫透出冷風',
      next:'d3_b2_behind'
    }},
    /* B2核心：念名結局（需備份卡＋讀過牆下名字） */
    {into:'basement',choice:{
      text:'拿出備份卡，把十四個名字唸給她聽',
      condition:function(){ return hasItem('d3_names_card')&&hasFlag('d3_names_read'); },
      next:'d3_ending_names',
      personality:{altruism:+10}
    }}
  ]
});
})();

/* ===== 13-dungeon4.js ===== */
/* ============================================================
 * 無盡之門 · v4.0 第四扇門：無盡之間（The Gate Between）
 * 純增量接入：V4.registerDungeon。不修改任何既有內容。
 * 定位：迴廊的心臟，所有門之間的縫隙。三扇門通關後抵達。
 * ============================================================ */
(function(){
'use strict';

/* ---- 避免觸發既有 onEndingReached 對「門扉4」的兜底比對（它只認 1~3） ---- */
if(typeof window.onEndingReached === 'function'){
  var _origOnEndingReached = window.onEndingReached;
  window.onEndingReached = function(type, title){
    if(currentDungeonId === 4) return; /* 第四扇門成就由場景內顯式解鎖 */
    return _origOnEndingReached.apply(this, arguments);
  };
}

/* ============================================================
 * 成就定義（6 枚）——在場景內顯式 unlockAchievement
 * ============================================================ */
var ACH = [
  {id:'ach_d4_heart',   name:'心臟',     desc:'第一次站到迴廊的中心'},
  {id:'ach_d4_triptych',name:'三扇舊門', desc:'重訪鏡、書架與病房三扇舊門'},
  {id:'ach_d4_guardian',name:'守門人',   desc:'聽守門人說完三句話'},
  {id:'ach_d4_doormath',name:'門數',     desc:'解開地板上那道後設謎題'},
  {id:'ach_d4_lantern', name:'留燈',     desc:'為門後沉睡的人留一道縫'},
  {id:'ach_d4_true',    name:'無盡之門', desc:'看見所有的門之後，走進真結局'}
];

V4.registerDungeon({
  id:4,
  index:'第 四 扇 門',
  name:'無盡之間',
  roomNum:'∞',
  bgNum:'∞',
  clearedKey:'wuxian-fourth-cleared',
  savePrefix:'infinite-core-save',
  startScene:'prologue',
  subText:'無 盡 迴 廊 · 第 四 扇 門',
  ruleText:'門 後 沒 有 規 則',
  hasParty:false,
  hasCountdown:false,
  hasAdmin:false,
  achDefs:ACH,
  totalEndings:7,
  unlock:function(){ return isCleared(3); },

  /* ---- 背景數字：在 ∞ 與三段舊門符號間緩慢輪轉，尊重減速動畫 ---- */
  bgAnimation:function(){
    if(bgNumTimer){ clearInterval(bgNumTimer); bgNumTimer=null; }
    var el = $('bg-num'); if(!el) return;
    el.classList.remove('float');
    if(SETTINGS.bgAnim === false || SETTINGS.reducedMotion){ el.textContent='∞'; return; }
    var seq = ['∞','∞','∞','13','∞','∞','靜','∞','60:00','∞'];
    var i = 0;
    el.textContent = seq[i];
    bgNumTimer = setInterval(function(){
      i = (i+1) % seq.length;
      el.textContent = seq[i];
    }, 2800);
  },

  /* ---- state：仿 base 形狀，無 party / countdown ---- */
  stateInit:function(){
    return {
      currentScene:'prologue',
      inventory:[],
      flags:{},
      hp:100,
      textIndex:0,
      puzzleCallback:null, puzzleAnswer:null, puzzleAttempts:0,
      inheritance:(typeof loadInheritance === 'function') ? loadInheritance() : {},
      notes:[], history:[],
      personality:{calm:50, altruism:50, cautious:50},
      mapZones:[
        {id:'heart',  name:'迴廊心臟',   explored:false, current:true,  scene:'heart',          summary:'所有門之間的縫。站在這裡，能聽見每扇門另一面的呼吸。'},
        {id:'old_mirror', name:'舊鏡之門',explored:false, current:false, scene:'old_mirror',     summary:'門牌是 13。鏡子還在，但鏡子裡的那個人已經不住了。'},
        {id:'old_library',name:'舊書架之門',explored:false, current:false, scene:'old_library', summary:'門上只有一個「靜」字。空氣裡還是舊紙張的味道。'},
        {id:'old_hospital',name:'舊病房之門',explored:false, current:false, scene:'old_hospital',summary:'門牌停在 60:00。床腳邊壓著一隻紙摺的小貓。'},
        {id:'gate',   name:'大門前',     explored:false, current:false, scene:'gate',            summary:'沒有門牌，只有一個無窮符號。守門人站在那裡，已經站了很久。'},
        {id:'choice', name:'抉擇廳',     explored:false, current:false, scene:'choice_hall',     summary:'門縫裂開之後，所有走法都攤開在這裡。'}
      ]
    };
  },

  /* ---- 場景定義 ---- */
  buildScenes:function(){
    /* 標記舊門造訪；三門皆訪 → 成就 */
    function markOldDoor(flag){
      state.flags[flag] = true;
      if(state.flags.old_mirror_done && state.flags.old_library_done && state.flags.old_hospital_done){
        unlockAchievement('ach_d4_triptych');
        addNote('d4_triptych','三扇舊門','鏡、書架、病房——你都回去看過了。它們不再追著你走。');
      }
    }

    /* ===== 1. 序章 ===== */
    SCENES.prologue = {
      room:'—', roomName:'白光盡頭', sceneId:'4-序章', mood:'melancholy',
      text:[
        '<p>你以為自己會再醒在那間白色房間。</p>',
        '<p>塑膠床，自動販賣機，一張空椅子，牆上一塊寫著倒數的黑板。每次都是這樣。上一段路結束，下一張公告貼出來，七十二小時，或者六十分鐘。</p>',
        '<p>這次沒有。</p>',
        '<p>你睜開眼的時候，沒有床。天花板不是白的——是沒顏色的，像一張被擦乾淨的紙。沒有倒數，沒有冰冷的低語，沒有門憑空長出來的聲音。</p>',
        '<p>你站在一片空裡。前後左右，都像走廊，又都不是走廊。</p>',
        '<p>腳下有地。你低頭，看見地上有一圈很淺的印——像被什麼東西，一圈一圈，走了很多年。</p>',
        '<p>你這次走了很遠。旅館的鏡子，圖書館的書架，醫院停在 00:00 的鐘。三段路走完，你以為自己會聽到一句「通關」。</p>',
        '<p>什麼都沒有。只有很安靜的聲音，從四面八方過來：是門。一扇、一扇、又一扇，都在你看不見的縫裡，輕輕呼吸。</p>',
        '<p>你認出來了。你一直在它們之間走，這是第一次，走到「之間」本身。</p>'
      ],
      choices:[
        {text:'沿著那圈淺印，走到中心去', next:'heart', personality:{calm:+5}}
      ]
    };

    /* ===== 2. 迴廊心臟（樞紐） ===== */
    SCENES.heart = {
      room:'∞', roomName:'迴廊心臟', sceneId:'4-心臟', mood:'mystery', mapZone:'heart',
      text:[
        '<p>你站到那圈印的正中央。</p>',
        '<p>這裡不是走廊，是走廊的「心臟」。沒有盡頭，也沒有開始。牆不存在——或者說，四面牆都是門。</p>',
        '<p>你左邊一扇老木門，門牌是 13。你認得。右邊一扇門，門上沒有牌，只刻了一個字：靜。背後靠裡一點，是一扇塑膠門，門牌的位置停著一塊停擺的電子鐘：60:00。</p>',
        '<p>三扇門你都推開過。推開過三次，或更多次——你不確定。</p>',
        '<p>正前方，是一扇大得多的門。沒有門牌，沒有把手。門中央刻著一個你很熟的符號：∞。</p>',
        '<p>大門旁站著一個人。深色長外套，半張臉在影子裡，手裡提一盞沒有火的燈。他沒有看你。他看起來，像已經站在那裡等了很多年。</p>'
      ],
      textReturn:[
        '<p>你回到心臟。三扇舊門安靜地待在原處，像三件被疊好的舊外套。</p>',
        '<p>大門前那個人還站在那裡。燈還是沒有火。</p>'
      ],
      onEnter:function(){ unlockAchievement('ach_d4_heart'); },
      choices:[
        {text:'走左邊那扇老木門（門牌 13）', next:'old_mirror', personality:{cautious:+3}},
        {text:'走右邊那扇刻著「靜」的門', next:'old_library', personality:{cautious:+3}},
        {text:'走靠後那扇停擺的塑膠門（60:00）', next:'old_hospital', personality:{cautious:+3}},
        {text:'蹲下身，細看地上那圈刻痕', next:'threshold_mark'},
        {text:'繞到大門側邊那張空椅子', next:'chair'},
        {text:'直接走向大門前那個人', next:'gate'},
        {text:'走到角落那道爬上天花板的細縫前', next:'crack'},
        {text:'仰視那張沒有顏色的「天花板」', observe:'你抬頭。沒有天花板——上面是很多門，一扇疊著一扇，遠到看不見盡頭。每一扇門都透著一點光。你數到第十七扇的時候，數錯了，只好重來。原來從心臟往上看，門也是無窮的。'},
        {text:'走到角落那扇沒有門牌的門前', next:'unnumbered', condition:function(){ return !!(state.inheritance && state.inheritance.ng_plus); }}
      ]
    };

    /* ===== 3. 牆縫（可選觀察） ===== */
    SCENES.crack = {
      room:'∞', roomName:'牆上的縫', sceneId:'4-心臟·縫隙', mood:'mystery',
      text:[
        '<p>心臟的牆不存在，但牆縫存在。</p>',
        '<p>一道很細的裂縫，從地面爬到你眼睛的高度，縫裡滲出一點白光。你把耳朵貼上去。</p>',
        '<p>縫裡有聲音。很遠，像隔了很多堵牆：算盤珠子，翻書紙頁，儀器「滴」的一聲。</p>',
        '<p>是你走過的三段路。它們沒有消失——它們只是縮小了，縮在這道縫裡。</p>'
      ],
      choices:[
        {text:'把耳朵再貼近一點', useless:true, flavor:'一個很輕的童聲夾在儀器聲裡，只說了半句：「……爸爸？」你直起身。縫又合上了一點。'},
        {text:'離開這道縫', next:'heart'}
      ]
    };

    /* ===== 4. 無門牌的門（NG+ 殘留） ===== */
    SCENES.unnumbered = {
      room:'∞', roomName:'沒有門牌的門', sceneId:'4-心臟·迴', mood:'melancholy',
      text:[
        '<p>這扇門沒有牌。門縫裡滲出的，是你走過太多次的那條白走廊。</p>',
        '<p>你認得這條路。你走過不止一次。每次走完，都有人把你放回起點，把一部分記憶擦掉，再給你一次機會。</p>',
        '<p>門後傳來自己的腳步聲。像很久很久以前的你，還在第一扇 13 號門前猶豫。</p>'
      ],
      choices:[
        {text:'推開它看看', useless:true, flavor:'門後是空的。空得很乾淨——像一次重置之前的畫面。你輕輕把門帶上。這次你不打算再回去了。'},
        {text:'離開', next:'heart'}
      ]
    };

    /* ===== 5. 地板刻痕（謎題一） ===== */
    SCENES.threshold_mark = {
      room:'∞', roomName:'地板上的刻痕', sceneId:'4-心臟·門數', mood:'mystery',
      text:[
        '<p>你蹲下。那圈淺印不是印——是刻出來的。</p>',
        '<p>一個角上，十三道短痕。旁邊一個被磨平的「靜」字。再過去，是六十分鐘那樣一格一格的刻線。</p>',
        '<p>三組記號擺在一起，像三個排好隊的門。刻痕中間有一行更淺的小字，是用指甲寫的：</p>',
        '<p class="system-msg">「三扇門扉，三扇你親手推開的門。不是房間，不是走廊——是『門』。數一數，到今天為止，你一共推開過幾扇。」</p>'
      ],
      choices:[
        {text:'把那個數字說出來', action:function(){
          openPuzzle('謎題 · 你一共推開過幾扇門',
            '三扇門扉，三扇你親手推開的門。旅館的門、圖書館的門、醫院的門——它們不是房間，是「門」。\n數一數：到今天為止，你一共推開過幾扇這樣的門？（輸入一個數字）',
            '3',
            function(ok){
              if(ok){
                if(!state.flags.puzzle_doors_done){
                  state.flags.puzzle_doors_done = true;
                  unlockAchievement('ach_d4_doormath');
                  addNote('d4_doormath','門數','十三道刻痕、一個靜字、六十格線——三段路，每一段都只推開過一扇真正的門。一共三扇。');
                }
                appendNarrative('<p class="inherit-note">你說出那個數字。三組刻痕輕輕燙了一下，一齊熄了。</p>');
              }else{
                appendNarrative('<p class="action">刻痕沒有反應。你數錯了——數錯了自己走過的路。</p>');
              }
            },
            '不是房間數，不是走廊數。三段路，每一段，你都只推開過一扇真正的門。');
        }},
        {text:'回到心臟', next:'heart'}
      ]
    };

    /* ===== 6. 舊鏡之門 ===== */
    SCENES.old_mirror = {
      room:'13', roomName:'鏡子舊處', sceneId:'4-舊門·鏡', mood:'safe', mapZone:'old_mirror',
      text:[
        '<p>木門推開，裡面不是旅館。是旅館走廊的最後一眼，被裝進了一面鏡子裡。</p>',
        '<p>鏡子還立在那裡。鏡框磨得發亮。</p>',
        '<p>鏡裡沒有你。</p>',
        '<p>鏡子深處站著那個「你」——阿凱的輪廓，又不像阿凱，像你自己，在某個分叉裡長成的另一個人。它看見你，沒有說假話。它只是抬起手，朝你很慢地揮了一下。</p>',
        '<p>這一次，你沒有攔它。</p>'
      ],
      textReturn:[
        '<p>鏡子空了。那個「你」走了，走得很乾淨，像從來沒有存在過。</p>'
      ],
      onEnter:function(){ markOldDoor('old_mirror_done'); },
      choices:[
        {text:'走近一步，看看鏡深處', next:'mirror_self'},
        {text:'退回心臟', next:'heart'}
      ]
    };

    /* ===== 7. 鏡中告別 ===== */
    SCENES.mirror_self = {
      room:'13', roomName:'鏡深處', sceneId:'4-舊門·訣別', mood:'melancholy',
      text:[
        '<p>你走到鏡子跟前。鏡面是溫的。</p>',
        '<p>那個「你」也走近。兩張臉貼著同一層玻璃。你看見它眼底那點一直以來的、說謊說出來的疲倦。</p>',
        '<p>它開口。沒有聲音，但你讀得出唇形：「謝謝你沒殺我。」</p>',
        '<p>然後它轉身，走進鏡子更深的地方，沒有回頭。鏡面漸漸只剩下你自己——這一次，鏡裡那個人是你，不是別人。</p>'
      ],
      choices:[
        {text:'退回心臟', next:'heart'}
      ]
    };

    /* ===== 8. 舊書架之門 ===== */
    SCENES.old_library = {
      room:'靜', roomName:'書架舊處', sceneId:'4-舊門·書', mood:'safe', mapZone:'old_library',
      text:[
        '<p>推開這扇門，先聞到的是舊紙張的味道。</p>',
        '<p>沒有圖書館。只有一道書架的影子，牆一樣立在那裡，架上一本書攤開著。</p>',
        '<p>你走過去。攤開的那一頁，是你的那本——寫著你這輩子沒做的飯、沒打的電話、沒說出口的對不起。</p>',
        '<p>書頁自己翻了一頁。下一頁是空的。</p>',
        '<p>腳邊有東西輕輕蹭過。你低頭——什麼都沒有。也許本來就不需要有。</p>'
      ],
      textReturn:[
        '<p>書架安靜地立著。那本書還攤在空的那一頁。</p>'
      ],
      onEnter:function(){ markOldDoor('old_library_done'); },
      choices:[
        {text:'把書輕輕合上，放回原處', action:function(){
          if(!state.flags.book_closed){
            state.flags.book_closed = true;
            appendNarrative('<p class="inherit-note">書合上的聲音很輕。整個空間安靜了一下，像謝你沒有再翻。</p>');
          }else{
            appendNarrative('<p class="action">書已經合好了。</p>');
          }
        }},
        {text:'退回心臟', next:'heart'}
      ]
    };

    /* ===== 9. 舊病房之門 ===== */
    SCENES.old_hospital = {
      room:'60:00', roomName:'病房舊處', sceneId:'4-舊門·鐘', mood:'melancholy', mapZone:'old_hospital',
      text:[
        '<p>塑膠門推開，先聽見的是儀器的靜默——那種壞掉之後、一直沒人拔電源的「嗡」。</p>',
        '<p>沒有醫院。只有一張空床，床頭卡上是個你不認得的名字。輸液架上掛一隻停了的錶。</p>',
        '<p>錶針停在三點十七分。</p>',
        '<p>床腳邊，水杯底下壓著一隻紙摺的小貓。摺得很拙劣，角對角，邊對邊——是孩子的手藝。</p>',
        '<p>你站了一會。空床安靜地等著誰，像一直在等。</p>'
      ],
      textReturn:[
        '<p>床還是空的。錶還是停在三點十七分。紙貓還在水杯底下。</p>'
      ],
      onEnter:function(){ markOldDoor('old_hospital_done'); },
      choices:[
        {text:'把紙貓從水杯底下抽出來，放進口袋', action:function(){
          if(!hasItem('paper_cat')){
            addItem('paper_cat','紙摺的小貓','摺得很拙劣。壓在空床床腳的水杯底下。也許是誰留給誰的。');
            appendNarrative('<p class="inherit-note">紙貓很薄，邊角已經軟了。你把它放進口袋，像接過一件很小、很沉的東西。</p>');
          }else{
            appendNarrative('<p class="action">紙貓在你口袋裡。</p>');
          }
        }},
        {text:'退回心臟', next:'heart'}
      ]
    };

    /* ===== 10. 守門人的椅子 ===== */
    SCENES.chair = {
      room:'∞', roomName:'大門側邊', sceneId:'4-門前·椅', mood:'safe',
      text:[
        '<p>大門左側，一張椅子。木的，坐的地方磨出了一層包漿——很多很多人，在這裡坐過。</p>',
        '<p>椅面上疊著一件多餘的深色外套，疊得整整齊齊，像隨時有人要接。</p>',
        '<p>你在椅子邊站了一會。遠處那三扇舊門安靜地呼吸。</p>'
      ],
      choices:[
        {text:'坐下，歇一口氣', useless:true, flavor:'椅面是溫的。你坐了大概一口氣那麼久，又站起來。這裡沒有什麼好休息的——你已經不走了。'},
        {text:'走向大門前那個人', next:'gate'},
        {text:'退回心臟', next:'heart'}
      ]
    };

    function guardAsked(){
      if(state.flags.guard_q1 && state.flags.guard_q2 && state.flags.guard_q3){
        unlockAchievement('ach_d4_guardian');
      }
    }
    /* ===== 11. 大門前 · 守門人 ===== */
    SCENES.gate = {
      room:'∞', roomName:'門前', sceneId:'4-大門', mood:'mystery', mapZone:'gate',
      text:[
        '<p>大門比你想的高。門面是啞光的，看不出木頭還是石頭，正中央那個 ∞ 刻得很深。</p>',
        '<p>守門人就站在門邊。他終於正眼看你了。眼神不凶，也不和氣——是那種站了很多年、看過太多人的眼神。</p>',
        '<p class="dialogue">「來了。」他說。聲音像很久沒開口的人。「三扇都走過了？」</p>',
        '<p>你點頭。</p>',
        '<p class="dialogue">「那就，問吧。」他說，「我只回答三個。問完，門是你的。」</p>'
      ],
      textReturn:[
        '<p>大門前，守門人還站在原處。他看你回來，略一點頭。</p>'
      ],
      choices:[
        {text:'問：你是誰？', action:function(){
          state.flags.guard_q1 = true;
          appendNarrative('<p class="dialogue">「上一個站在這裡的人。」他頓了頓，「再上一個，也是。這位置沒有名字。有名字的人，都走門裡去了。」</p>');
          appendNarrative('<p>他提了提那盞沒有火的燈。「我只是看著，不讓人亂走。」</p>');
          guardAsked();
        }, condition:function(){ return !state.flags.guard_q1; }},
        {text:'問：這裡是哪裡？', action:function(){
          state.flags.guard_q2 = true;
          appendNarrative('<p class="dialogue">「所有門和門之間的縫。」他說，「你們管外頭叫迴廊。這裡是它的心臟。旅館、圖書館、醫院——都是從這扇門長出去的。」</p>');
          appendNarrative('<p>「你走過的每一條路，都從這裡出發，最後也都回到這裡。」</p>');
          guardAsked();
        }, condition:function(){ return !state.flags.guard_q2; }},
        {text:'問：我……死了嗎？', action:function(){
          state.flags.guard_q3 = true;
          appendNarrative('<p>他沉默了很久。久到你以為他不會回答了。</p>');
          appendNarrative('<p class="dialogue">「三點十七分。」他終於開口，「咖啡濺在鍵盤上。這些，你都還記得。」</p>');
          appendNarrative('<p class="dialogue">「這不是夢。夢會醒。」他說，「這裡沒有『醒』這回事。」</p>');
          guardAsked();
        }, condition:function(){ return !state.flags.guard_q3; }},
        {text:'把那個時間，輕聲說給門聽', next:'gate_time'},
        {text:'轉向那扇門', next:'choice_hall',
         condition:function(){ return state.flags.guard_q1 && state.flags.guard_q2 && state.flags.guard_q3; },
         personality:{calm:+5}},
        {text:'退回心臟', next:'heart'}
      ]
    };

    /* ===== 12. 門環之問（謎題二） ===== */
    SCENES.gate_time = {
      room:'∞', roomName:'門環', sceneId:'4-大門·時刻', mood:'mystery',
      text:[
        '<p>大門沒有把手。代替把手的，是一隻銅環，被摸得發亮。</p>',
        '<p>你的手指碰上銅環的時候，它涼了一下，像一隻半睜的眼。</p>',
        '<p class="system-msg">門沒有聲音，但你「聽」見了一句很輕的話：</p>',
        '<p class="dialogue">「你倒下的那個凌晨，是幾點？說對了，我就認得你。」</p>'
      ],
      choices:[
        {text:'把那個時間說出來', action:function(){
          openPuzzle('謎題 · 倒下的時間',
            '你倒下的那個凌晨，是幾點？\n屏幕右下角那個亮了六個小時的數字，你到死都記得。（格式：時:分）',
            '3:17',
            function(ok){
              if(ok){
                if(!state.flags.door_recognized){
                  state.flags.door_recognized = true;
                  addNote('d4_time','三點十七分','銅環認出了這個時間。門，終於知道你是誰了。');
                }
                appendNarrative('<p class="inherit-note">銅環輕輕一震。門面上那個 ∞，溫了一下。它認得你了。</p>');
              }else{
                appendNarrative('<p class="action">銅環涼了下去。門不認得這個時間。</p>');
              }
            },
            '質數分佈的曲線跑到第六個小時。屏幕右下角的數字，你盯了太久，久到最後一眼還是它。');
        }},
        {text:'回到守門人那裡', next:'gate'}
      ]
    };

    /* ===== 13. 抉擇廳 ===== */
    SCENES.choice_hall = {
      room:'∞', roomName:'抉擇廳', sceneId:'4-抉擇', mood:'tension', mapZone:'choice',
      text:[
        '<p>你轉向大門。門，不知什麼時候裂開了一道縫。</p>',
        '<p>縫裡沒有光，也沒有黑——是一種很安靜的「待決」。所有走法都在這道縫前攤開了。</p>',
        '<p>守門人往側邊讓了一步。他不替你選。</p>',
        '<p class="system-msg">這一次，沒有倒數，沒有規則，沒有系統。門只問你：你要怎麼走？</p>'
      ],
      choices:[
        {text:'退後，轉身，走回來時的那扇門', next:'end_cycle', personality:{cautious:-5}},
        {text:'放下手。承認那杯咖啡早就涼了', next:'end_release', personality:{calm:+10}},
        {text:'接過守門人手裡那盞燈', next:'end_handoff', personality:{cautious:+5}},
        {text:'攥緊拳頭，砸向門心', next:'end_shatter', danger:true, personality:{cautious:-15}},
        {text:'在門邊蹲下，為門後那個還沒醒的人留一道縫', next:'end_lantern',
         condition:function(){ return !!state.flags.old_hospital_done; },
         personality:{altruism:+15}},
        {text:'憑三段記憶，對自己點頭', next:'end_return',
         condition:function(){ return state.flags.old_mirror_done && state.flags.old_library_done && state.flags.old_hospital_done; },
         personality:{calm:+10}},
        {text:'把手掌，貼上門中央那道「沒有縫的縫」', action:function(){
          if(V4.allFragmentsFound()){
            goToScene('end_true');
          }else{
            appendNarrative('<p class="system-msg">門是涼的。縫沒有打開。一個很輕的聲音說：</p>');
            appendNarrative('<p class="dialogue">「你還沒看見所有的門。」</p>');
          }
        }},
        {text:'退回心臟，再走一趟', next:'heart'}
      ]
    };

    /* ===== 14. 結局一：輪迴（冷） ===== */
    SCENES.end_cycle = {
      room:'—', roomName:'退回', sceneId:'4-結局·迴', mood:'tension',
      text:[
        '<p>你退後，轉身。來時那扇門還開著一條縫。</p>',
        '<p>你邁進去。</p>',
        '<p>門在你背後合上的聲音，很輕。</p>'
      ],
      onEnter:function(){
        setTimeout(function(){
          triggerEnding('bad_cycle','又回到開頭',
            '你退回來的那一刻，門重新長成了走廊。第一扇門的門牌是 13。你會推開它，像從來沒有推過一樣。這一次，你不會記得這裡。',
            '壞結局 · 輪迴');
        }, 900);
      },
      choices:[]
    };

    /* ===== 15. 結局二：釋懷（暖） ===== */
    SCENES.end_release = {
      room:'∞', roomName:'放下', sceneId:'4-結局·釋', mood:'safe',
      text:[
        '<p>你在門前站了很久。</p>',
        '<p>然後你彎下腰，把那杯想像中灑出來的咖啡，輕輕擦乾。</p>',
        '<p>三點十七分，你沒有站起來。這次你承認了。以後，也不用再站起來。</p>',
        '<p>門裡面是很溫的光。你走進去，沒有回頭。</p>'
      ],
      onEnter:function(){
        V4.markDungeonCleared(4);
        setTimeout(function(){
          triggerEnding('normal_release','放下',
            '你終於承認了那個凌晨。旅館的鏡子、圖書館的書、醫院停住的鐘，都只是這次跌倒的延長。門後不是出口，是不用再推門了。',
            '普通結局 · 釋懷');
        }, 900);
      },
      choices:[]
    };

    /* ===== 16. 結局三：值守（中性偏苦，冷） ===== */
    SCENES.end_handoff = {
      room:'∞', roomName:'守燈', sceneId:'4-結局·守', mood:'melancholy',
      text:[
        '<p>你伸出手。守門人愣了一下，把那盞沒有火的燈遞了過來。</p>',
        '<p>燈芯在你手裡，亮了一下。很弱，但有了。</p>',
        '<p>他解下那件疊在椅子上的外套，遞給你。然後他走進門裡——那是他這麼多年，第一次不是以守門人的身份走進去。</p>',
        '<p>你站回他剛才的位置。燈還亮著。下一個人，很快會來。</p>'
      ],
      onEnter:function(){
        V4.markDungeonCleared(4);
        setTimeout(function(){
          triggerEnding('bad_handoff','守燈人',
            '你接過了位置。燈在你手裡亮著，下一個推門的人，你會看他一眼，然後再回答他三個問題。這不是結束，是換你站著。',
            '壞結局 · 值守');
        }, 900);
      },
      choices:[]
    };

    /* ===== 17. 結局四：破碎（冷） ===== */
    SCENES.end_shatter = {
      room:'—', roomName:'砸', sceneId:'4-結局·碎', mood:'terror',
      text:[
        '<p>你攥緊拳頭，砸上去。</p>',
        '<p>門整片地碎開。不是裂——是像玻璃那樣，安靜地、整片地碎。</p>',
        '<p>碎片後面沒有房間，沒有走廊。是一種很安靜的黑。</p>',
        '<p>你想：原來門後什麼都沒有。</p>'
      ],
      onEnter:function(){
        setTimeout(function(){
          triggerEnding('bad_shatter','破碎',
            '你砸開了門，也砸碎了「之間」。門後沒有房間，沒有出口，也沒有守門人——只有很安靜的黑。原來一直以來，門比門後的東西更像答案。',
            '死亡結局 · 破碎');
        }, 900);
      },
      choices:[]
    };

    /* ===== 18. 結局五：留燈（暖，利他） ===== */
    SCENES.end_lantern = {
      room:'∞', roomName:'留燈', sceneId:'4-結局·引', mood:'safe',
      text:[
        '<p>你在門邊蹲下身。</p>',
        '<p>你不知道門後是誰。也許是那個還在四樓寫下名字、等爸爸的小女孩；也許是別的、你叫不出名字的誰。</p>',
        '<p>你用指尖把那道縫，輕輕挑寬了一點。</p>',
        '<p>你從口袋裡摸出那隻紙摺的小貓，放在縫口。又向守門人那盞燈借了一點火，點在旁邊。</p>',
        '<p>「路在這邊。」你說。</p>'
      ],
      onEnter:function(){
        V4.markDungeonCleared(4);
        unlockAchievement('ach_d4_lantern');
        setTimeout(function(){
          triggerEnding('survive_lantern','留燈',
            '你沒有為自己走門。你為門後那個還沒醒的人，把縫挑寬了一點，點了一盞燈。也許她會跟著光走出去——也許要很久。你不確定，但你做了。',
            '逃過一劫 · 引路');
        }, 900);
      },
      choices:[]
    };

    /* ===== 19. 結局六：歸（普通暖色） ===== */
    SCENES.end_return = {
      room:'∞', roomName:'歸', sceneId:'4-結局·和', mood:'safe',
      text:[
        '<p>鏡子裡的那個你，走了。</p>',
        '<p>書架上的那本書，合上了。</p>',
        '<p>病房的那張床，空著，不再等誰。</p>',
        '<p>你對自己點了點頭。像跟一個很久不見、終於碰上面的自己，打了個招呼。</p>',
        '<p>原來出口，不是逃離那三個地方。是跟它們和解。</p>'
      ],
      onEnter:function(){
        V4.markDungeonCleared(4);
        setTimeout(function(){
          triggerEnding('normal_return','歸',
            '三段舊門你都回去過了一趟。鏡子你沒贏，書沒修好，那張床也沒叫醒。你沒跟它們講和，只是不再把它們扛在身上。走出大門的時候，腳步比進來時輕。',
            '普通結局 · 歸');
        }, 900);
      },
      choices:[]
    };

    /* ===== 20. 真結局（隱藏，暖色，輕觸第四面牆） ===== */
    SCENES.end_true = {
      room:'∞', roomName:'無盡', sceneId:'4-結局·真', mood:'safe',
      text:[
        '<p>九枚碎片在你口袋裡同時發燙。</p>',
        '<p>你把它們倒出來。它們浮在半空，一枚一枚，慢慢排成一個無窮符號。</p>',
        '<p>門沒有開。門本身，開始亮了起來——像它本來就是光的一部分。</p>',
        '<p>守門人這一次沒有看你。他看著門後頭，很輕地說：「原來，你都看完了。」</p>',
        '<p>他停了一下。</p>',
        '<p class="dialogue">「連這個，也是。」</p>',
        '<p>門縫裡傳來很輕的聲音：像鍵盤敲到一半，像咖啡杯被放下，像一份論文終於按下保存。</p>',
        '<p>「這一次，不用再推門了。」那個聲音說，「你可以關上它。」</p>',
        '<p>你伸出手，輕輕把門帶上。</p>',
        '<p>縫裡透出的最後一句話是：「晚安，陸衍。」</p>'
      ],
      onEnter:function(){
        V4.markDungeonCleared(4);
        unlockAchievement('ach_d4_true');
        setTimeout(function(){
          triggerEnding('hidden_true','無盡之門',
            '你集齊九扇門的碎片，看見迴廊本身。門沒有把你送出來。它只是安靜地亮著，像一間忘記關燈的空房。你在門前站了很久，沒有推。這一次，是你自己決定不再推了。',
            '隱藏結局 · 真');
        }, 1100);
      },
      choices:[]
    };

  }
});

})();

/* ===== 20-systems.js ===== */
/* ============================================================
 * 無盡之門 · v4.0 系統模組 20
 * 系統一：迴廊手札（總覽儀表板，頂欄「札」按鈕）
 * 系統二：稱號系統（里程碑解鎖 / 裝備 / 標題畫面顯示）
 * 系統三：提示系統（依場景給予克制提示，次數有限、新結局回補）
 * 純增量：只透過 V4.registerSystem 註冊，不修改既有內容。
 * ============================================================ */
(function(){
'use strict';

var LS_EQUIP='wuxian-v4-equipped-title';
var LS_HINTS='wuxian-v4-hints-left';
var LS_AUTOPLAY='wuxian-v4-autoplay-used';
var LS_INHERIT='wuxian-inheritance';
var FREE_HINTS=3;
var HINT_CAP=9;

function lsGet(k){ try{return localStorage.getItem(k);}catch(e){return null;} }
function lsSet(k,v){ try{localStorage.setItem(k,v);}catch(e){} }
function lsJSON(k){ try{return JSON.parse(localStorage.getItem(k))||[];}catch(e){return[];} }

function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
});}

/* ---------- 共用數據讀取（全部即時讀 localStorage，不做快取） ---------- */
function endLog(){ return (typeof getEndingLog==='function')?getEndingLog():lsJSON('wuxian-endings'); }
function achList(){ return (typeof getAchList==='function')?getAchList():lsJSON('wuxian-achievements'); }
function achTotal(){ return (typeof ACH_TOTAL!=='undefined')?ACH_TOTAL:1; }
function endingTotals(){ return (typeof ENDING_TOTALS!=='undefined')?ENDING_TOTALS:{}; }
function dungeonsList(){ return (typeof dungeons!=='undefined')?dungeons:[]; }
function deathCount(){
  try{ var o=JSON.parse(lsGet(LS_INHERIT)||'{}'); return o.deathCount||0; }catch(e){ return 0; }
}
function endingsFoundIn(id){
  var pre=String(id)+'|';
  return endLog().filter(function(e){ return e.indexOf(pre)===0; }).length;
}
function hiddenEndingFound(){
  return endLog().some(function(e){
    var p=e.split('|'); return p[1]&&p[1].indexOf('hidden_')===0;
  });
}

/* ============================================================
 * 稱號定義（14 枚，全部由既有資料即時判定）
 * ============================================================ */
var TITLES=window.TITLES=[
  {id:'t_first_end', name:'初叩門扉', desc:'解鎖你的第一個結局',
   check:function(){ return endLog().length>=1; }},
  {id:'t_d1_all', name:'旅館通曉者', desc:'收集「質數旅館」的全部結局',
   check:function(){ var t=endingTotals()[1]||0; return t>0&&endingsFoundIn(1)>=t; }},
  {id:'t_d2_all', name:'靜默讀者', desc:'收集「沉默圖書館」的全部結局',
   check:function(){ var t=endingTotals()[2]||0; return t>0&&endingsFoundIn(2)>=t; }},
  {id:'t_d3_all', name:'時間守門人', desc:'收集「倒計時醫院」的全部結局',
   check:function(){ var t=endingTotals()[3]||0; return t>0&&endingsFoundIn(3)>=t; }},
  {id:'t_ach10', name:'略有所成', desc:'解鎖 10 項成就',
   check:function(){ return achList().length>=10; }},
  {id:'t_ach20', name:'博聞強記', desc:'解鎖 20 項成就',
   check:function(){ return achList().length>=20; }},
  {id:'t_ach_all', name:'萬象集錄者', desc:'解鎖全部成就',
   check:function(){ var t=achTotal(); return t>0&&achList().length>=t; }},
  {id:'t_frag9', name:'碎片湊齊者', desc:'集齊九枚迴廊碎片',
   check:function(){ return V4.fragmentsCount()>=V4.TOTAL_FRAGMENTS; }},
  {id:'t_d4_clear', name:'門外之人', desc:'通關第四扇門',
   check:function(){
     if(typeof isCleared!=='function') return false;
     return dungeonsList().some(function(d){ return d.id===4; }) && isCleared(4);
   }},
  {id:'t_true', name:'窺見真實', desc:'抵達一枚隱藏結局',
   check:function(){ return hiddenEndingFound(); }},
  {id:'t_autoplay', name:'旁觀者', desc:'打開過自動播放，靜靜看故事自己走',
   check:function(){ return lsGet(LS_AUTOPLAY)==='1'; }},
  {id:'t_death5', name:'輪迴常客', desc:'累計死亡 5 次',
   check:function(){ return deathCount()>=5; }},
  {id:'t_death15', name:'涅槃者', desc:'累計死亡 15 次',
   check:function(){ return deathCount()>=15; }},
  {id:'t_all_end', name:'無盡通曉者', desc:'收集全部門扉的全部結局',
   check:function(){
     var tot=endingTotals(), ok=true;
     dungeonsList().forEach(function(d){
       var t=tot[d.id]||0;
       if(t>0 && endingsFoundIn(d.id)<t) ok=false;
     });
     return ok && dungeonsList().length>0;
   }}
];

function equippedTitleId(){ return lsGet(LS_EQUIP)||''; }
function equippedTitle(){
  var id=equippedTitleId();
  for(var i=0;i<TITLES.length;i++) if(TITLES[i].id===id) return TITLES[i];
  return null;
}

/* ============================================================
 * 提示文案（依當前場景靜態策劃，克制、不直接暴雷終局）
 * ============================================================ */
var HINTS={
  1:[
    ['basement','地下室的台階數不對。走到底之前，記得回頭數一次。'],
    ['hidden_mirror_door','有些門不在牆上，在你特別注意過的地方。'],
    ['mirror','鏡子裡那個人，比你以為的更有主見。別急著否定它說的話。'],
    ['corridor','兩側房間的門牌都是質數。非質數的門，也許藏在別處。'],
    ['manager','管理員的算盤打個不停。他開的價，先想清楚你付不付得起。'],
    ['room3','房間裡的東西，貪心與克制往往通往不同的門。'],
    ['lobby','旅館大廳值得多站一會。每個人進出的時機，都是線索。'],
    ['','在旅館裡，重點不在「走哪扇門」，而在「你願意記住什麼」。']
  ],
  2:[
    ['basement','地下層的光是冷的。被刪掉的東西，往往藏在最下層。'],
    ['forbidden','規則是「不能出聲」。但安靜有很多種——管理員分得清。'],
    ['braille','看不懂的地方，不一定要用眼睛。'],
    ['xiaoyu','三隻貓不是隨便放的。媛媛的線索散在牠們身上。'],
    ['bell','鐘聲響起的時候，先問自己：剛才，我出聲了沒有？'],
    ['lobby','大廳架上的書，每一本都記著一個人的一生。慢慢翻。'],
    ['','圖書館裡最危險的不是書架，是你忍不住開口的那句話。']
  ],
  3:[
    ['morgue','太平間的格子不對。第十四格，不是用來放屍體的。'],
    ['elevator','B2 在吃記憶。下去之前，先想清楚哪些記憶你捨不得。'],
    ['night_nurse','夜巡護士走得很規律。跟上她的節奏，或許比硬拼更好。'],
    ['ward4','四樓的病房門牌順序很奇怪。一間一間推開，記住先後。'],
    ['pharmacy','藥房的藥都有副作用。組合之前，先讀一遍說明。'],
    ['lin_doctor','林醫生認得媛媛。有些答案，要先讓他願意開口。'],
    ['entrance','倒計時不會騙人，但藥品能給你喘息。先找資源，再找真相。'],
    ['','在這家醫院，時間是最貴的東西。別把它浪費在同樣的恐懼上。']
  ]
};

function currentDungeonId(){
  return (typeof currentDungeonId!=='undefined')?currentDungeonId:1;
}
function currentScene(){
  try{ return (state&&state.currentScene)?state.currentScene:''; }catch(e){ return ''; }
}
function pickHint(did,scene){
  var list=HINTS[did]||HINTS[1];
  var best=null,bestLen=-1;
  list.forEach(function(item){
    var m=item[0],t=item[1];
    if(m && scene.indexOf(m)>=0 && m.length>bestLen){ best=t; bestLen=m.length; }
  });
  if(best) return best;
  /* 退回該門扉的通用提示 */
  for(var i=list.length-1;i>=0;i--){ if(!list[i][0]) return list[i][1]; }
  return list[list.length-1][1];
}
function hintsLeft(){
  var v=lsGet(LS_HINTS);
  if(v===null||v==='') return FREE_HINTS;
  var n=parseInt(v,10); return isNaN(n)?FREE_HINTS:n;
}
function setHintsLeft(n){ lsSet(LS_HINTS,String(Math.max(0,n))); }

/* ============================================================
 * 建立 DOM（彈窗、頂欄按鈕、提示入口）
 * ============================================================ */
function el(html){ var d=document.createElement('div'); d.innerHTML=html; return d.firstChild; }

var Notebook={ modal:null, body:null, tab:'overview' };
var HintBox={ modal:null, sub:null, body:null, useBtn:null };

function buildModals(){
  /* ---- 迴廊手札 ---- */
  Notebook.modal=el(
    '<div class="modal-overlay" id="v4-notebook">'+
      '<div class="v4-card wide">'+
        '<h3>迴 廊 手 札</h3>'+
        '<div class="v4-sub">記錄你在無盡迴廊走過的每一步</div>'+
        '<div class="v4-tabs">'+
          '<button class="v4-tab on" data-t="overview">總 覽</button>'+
          '<button class="v4-tab" data-t="titles">稱 號<span class="v4-tab-count" id="v4-title-count"></span></button>'+
        '</div>'+
        '<div id="v4-nb-body" class="v4-stagger"></div>'+
        '<div class="v4-actions end"><button class="v4-btn" id="v4-nb-close">關 閉</button></div>'+
      '</div>'+
    '</div>');
  document.body.appendChild(Notebook.modal);
  Notebook.body=Notebook.modal.querySelector('#v4-nb-body');
  Notebook.modal.querySelectorAll('.v4-tab').forEach(function(t){
    t.addEventListener('click',function(){
      Notebook.modal.querySelectorAll('.v4-tab').forEach(function(x){x.classList.remove('on');});
      t.classList.add('on');
      Notebook.tab=t.getAttribute('data-t');
      renderNotebook();
    });
  });
  Notebook.modal.querySelector('#v4-nb-close').addEventListener('click',closeNotebook);
  Notebook.modal.addEventListener('click',function(e){ if(e.target===Notebook.modal) closeNotebook(); });

  /* ---- 提示彈窗 ---- */
  HintBox.modal=el(
    '<div class="modal-overlay" id="v4-hint-modal">'+
      '<div class="v4-card">'+
        '<h3>提 示</h3>'+
        '<div class="v4-sub" id="v4-hint-sub"></div>'+
        '<div id="v4-hint-body"></div>'+
        '<div class="v4-actions">'+
          '<button class="v4-btn primary" id="v4-hint-use">獲得提示</button>'+
          '<button class="v4-btn" id="v4-hint-close">關 閉</button>'+
        '</div>'+
      '</div>'+
    '</div>');
  document.body.appendChild(HintBox.modal);
  HintBox.sub=HintBox.modal.querySelector('#v4-hint-sub');
  HintBox.body=HintBox.modal.querySelector('#v4-hint-body');
  HintBox.useBtn=HintBox.modal.querySelector('#v4-hint-use');
  HintBox.useBtn.addEventListener('click',useHint);
  HintBox.modal.querySelector('#v4-hint-close').addEventListener('click',closeHint);
  HintBox.modal.addEventListener('click',function(e){ if(e.target===HintBox.modal) closeHint(); });

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){ closeNotebook(); closeHint(); }
  });
}

function injectTopBarButton(){
  var bar=document.querySelector('.top-bar-right');
  if(!bar) return;
  if(bar.querySelector('.v4-nb-btn')) return;
  var b=document.createElement('button');
  b.className='icon-btn v4-nb-btn';
  b.textContent='札';
  b.title='迴廊手札';
  b.setAttribute('aria-label','迴廊手札');
  b.addEventListener('click',openNotebook);
  bar.appendChild(b);
}

/* ---- 標題畫面稱號顯示 ---- */
function injectTitleBadge(){
  var sub=document.getElementById('g-title-sub');
  if(!sub) return;
  if(document.getElementById('v4-title-display')) return;
  var d=document.createElement('div');
  d.id='v4-title-display';
  sub.parentNode.insertBefore(d,sub.nextSibling);
}
function refreshTitleBadge(){
  var d=document.getElementById('v4-title-display');
  if(!d) return;
  var t=equippedTitle();
  d.innerHTML=t?('<span class="v4-equip-line">'+esc(t.name)+'</span>'):'';
}

/* ============================================================
 * 迴廊手札內容渲染
 * ============================================================ */
function renderOverview(body){
  var log=endLog();
  var totalEnd=0,foundEnd=0;
  dungeonsList().forEach(function(d){
    var t=endingTotals()[d.id]||0; totalEnd+=t;
    foundEnd+=endingsFoundIn(d.id);
  });
  var ach=achList().length, at=achTotal();
  var fr=V4.fragmentsCount();
  var endP=totalEnd?foundEnd/totalEnd:0;
  var achP=at?ach/at:0;
  var frP=V4.TOTAL_FRAGMENTS?fr/V4.TOTAL_FRAGMENTS:0;
  var overall=Math.round(100*(0.4*endP+0.35*achP+0.25*frP));

  var html='';
  html+='<div class="v4-overall"><span class="v4-overall-n">'+overall+'%</span>'+
        '<span class="v4-overall-l">整體完成度</span></div>';
  html+='<div class="v4-bar lg" style="margin:.6rem 0 1.2rem"><i style="width:'+overall+'%"></i></div>';

  /* 各扇門扉結局進度 */
  html+='<div class="v4-sec">門扉結局</div>';
  dungeonsList().forEach(function(d){
    var t=endingTotals()[d.id]||0;
    var f=endingsFoundIn(d.id);
    var p=t?Math.round(100*f/t):0;
    var isHid=(window.V61&&typeof V61.getDungeonDisplayState==='function'&&V61.getDungeonDisplayState(d.id)==='hidden'&&!window._gmUnlocked);
    var dLabel=isHid?'？？？':d.name;
    html+='<div class="v4-pbar-row" style="margin-bottom:.5rem">'+
      '<span style="min-width:6.5rem">'+esc(dLabel)+'</span>'+
      '<div class="v4-bar"><i style="width:'+p+'%"></i></div>'+
      '<span class="v4-pbar-n">'+f+' / '+t+'</span></div>';
  });

  /* 成就 + 碎片統計 */
  html+='<div class="v4-grid" style="margin-top:1.1rem">'+
    '<div class="v4-stat"><span class="v4-stat-n">'+ach+' / '+at+'</span><span class="v4-stat-l">成就</span></div>'+
    '<div class="v4-stat"><span class="v4-stat-n">'+foundEnd+' / '+totalEnd+'</span><span class="v4-stat-l">結局</span></div>'+
    '<div class="v4-stat accent"><span class="v4-stat-n">'+fr+' / '+V4.TOTAL_FRAGMENTS+'</span><span class="v4-stat-l">迴廊碎片</span></div>'+
  '</div>';

  /* 九格碎片 */
  html+='<div class="v4-sec" style="margin-top:1.3rem">迴廊碎片</div>';
  html+='<div class="v4-frag-grid">';
  Object.keys(V4.FRAGMENTS).forEach(function(k){
    var f=V4.FRAGMENTS[k];
    var got=V4.hasFragment(k);
    html+='<div class="v4-frag'+(got?' found':'')+'">'+
      '<span class="v4-frag-glyph">'+(got?'扉':'？')+'</span>'+
      '<span class="v4-frag-n">'+(got?esc(f.name):'尚未尋獲')+'</span>'+
      '<span class="v4-frag-hint">'+esc(f.hint)+'</span>'+
    '</div>';
  });
  html+='</div>';
  body.innerHTML=html;
}

function renderTitles(body){
  var eq=equippedTitleId();
  var un=0;
  TITLES.forEach(function(t){ if(t.check()) un++; });
  var cnt=document.getElementById('v4-title-count');
  if(cnt) cnt.textContent=un+' / '+TITLES.length;

  var html='<div class="v4-list">';
  TITLES.forEach(function(t){
    var on=t.check();
    var equipped=(t.id===eq);
    html+='<div class="v4-row'+(on?' unlocked':' locked')+'">'+
      '<div class="v4-row-ic">'+(on?
        '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>':
        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M9 10h6M9 14h4"/></svg>')+
      '</div>'+
      '<div class="v4-row-main">'+
        '<div class="v4-row-t">'+(on?esc(t.name):'？？？')+'</div>'+
        '<div class="v4-row-d">'+(on?esc(t.desc):esc(t.desc))+'</div>'+
      '</div>'+
      (on?(equipped?'<span class="v4-chip gold">已裝備</span>':
        '<button class="v4-btn" data-equip="'+esc(t.id)+'">裝 備</button>'):'')+
    '</div>';
  });
  html+='</div>';
  body.innerHTML=html;
  body.querySelectorAll('[data-equip]').forEach(function(b){
    b.addEventListener('click',function(){
      lsSet(LS_EQUIP,b.getAttribute('data-equip'));
      refreshTitleBadge();
      renderTitles(Notebook.body);
      if(typeof showToast==='function') showToast('已裝備稱號');
    });
  });
}

window.renderOverview=renderOverview;
window.renderTitles=renderTitles;
function renderNotebook(){
  if(Notebook.tab==='titles') (window.renderTitles||renderTitles)(Notebook.body);
  else (window.renderOverview||renderOverview)(Notebook.body);
}
function openNotebook(){
  var activeTab = Notebook.modal ? Notebook.modal.querySelector('.v4-tab.on') : null;
  var t = activeTab ? activeTab.getAttribute('data-t') : 'overview';
  if(t && t !== 'overview' && t !== 'titles'){
    Notebook.modal.classList.add('show');
    activeTab.click();
    return;
  }
  Notebook.tab = (t === 'titles') ? 'titles' : 'overview';
  renderNotebook();
  Notebook.modal.classList.add('show');
}
function closeNotebook(){ if(Notebook.modal) Notebook.modal.classList.remove('show'); }

/* ============================================================
 * 提示系統
 * ============================================================ */
function openHint(){
  var left=hintsLeft();
  HintBox.sub.textContent='今日尚餘 '+left+' 次提示 · 解鎖新結局可回補';
  if(left<=0){
    HintBox.body.innerHTML='<p style="font-size:.82rem;line-height:1.9;color:var(--text-dim)">提示已用盡。每解鎖一個新結局，可回補一次——再去推幾扇門吧。</p>';
    HintBox.useBtn.style.display='none';
  }else{
    HintBox.body.innerHTML='<p style="font-size:.82rem;line-height:1.9;color:var(--text)">點擊下方按鈕，取得一條貼近當前路徑的提示。提示不會直接告訴你結局在哪。</p>';
    HintBox.useBtn.style.display='';
  }
  HintBox.modal.classList.add('show');
}
function closeHint(){ if(HintBox.modal) HintBox.modal.classList.remove('show'); }
function useHint(){
  var left=hintsLeft();
  if(left<=0){ closeHint(); return; }
  setHintsLeft(left-1);
  var did=currentDungeonId();
  var sc=currentScene();
  var tip=pickHint(did,sc);
  HintBox.sub.textContent='剩餘 '+(left-1)+' 次';
  HintBox.body.innerHTML='<p style="font-family:var(--font-serif);font-size:.95rem;line-height:2;color:var(--text-bright);letter-spacing:.05em">「 '+esc(tip)+' 」</p>';
  HintBox.useBtn.style.display='none';
}

/* 在選擇區注入低調提示入口（renderChoices 每次重建，故掛在其後） */
function buildHintEntry(){
  var c=document.getElementById('choices');
  if(!c||c.querySelector('.v4-hint-entry')) return;
  var row=document.createElement('div');
  row.className='v4-hint-entry';
  row.innerHTML='<button type="button" class="v4-hint-btn">'+
    '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.5 1 2.5h6c0-1 .2-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>'+
    '提示 <span class="v4-hint-left">'+hintsLeft()+'</span></button>';
  row.querySelector('.v4-hint-btn').addEventListener('click',openHint);
  c.appendChild(row);
}

/* ============================================================
 * 掛鉤：包裝既有全局函數（只追加行為）
 * ============================================================ */
function wrapAll(){
  /* 新結局 → 提示回補 */
  if(typeof window.recordEnding==='function' && !window.recordEnding.__v4){
    var _re=window.recordEnding;
    window.recordEnding=function(type,title){
      var before=endLog().length;
      var r=_re.apply(this,arguments);
      var after=endLog().length;
      if(after>before){
        var left=hintsLeft();
        setHintsLeft(Math.min(left+(after-before),HINT_CAP));
      }
      return r;
    };
    window.recordEnding.__v4=true;
  }
  /* 選擇區渲染後 → 注入提示入口；順手記錄自動播放 */
  if(typeof window.renderChoices==='function' && !window.renderChoices.__v4){
    var _rc=window.renderChoices;
    window.renderChoices=function(choices){
      var r=_rc.apply(this,arguments);
      try{
        if(window.SETTINGS && SETTINGS.autoPlay) lsSet(LS_AUTOPLAY,'1');
        buildHintEntry();
      }catch(e){}
      return r;
    };
    window.renderChoices.__v4=true;
  }
  /* 踏入門扉 → 刷新標題畫面稱號 */
  if(typeof window.enterDungeon==='function' && !window.enterDungeon.__v4){
    var _ed=window.enterDungeon;
    window.enterDungeon=function(id,autoStart){
      var r=_ed.apply(this,arguments);
      try{ refreshTitleBadge(); }catch(e){}
      return r;
    };
    window.enterDungeon.__v4=true;
  }
}

/* ============================================================
 * 註冊系統
 * ============================================================ */
V4.registerSystem('v4-corridor-notebook',function(){
  buildModals();
  injectTopBarButton();
  injectTitleBadge();
  refreshTitleBadge();
  wrapAll();
  /* 首次進場若提示次數尚未初始化，寫入免費次數 */
  if(lsGet(LS_HINTS)===null) setHintsLeft(FREE_HINTS);
});

})();

/* ===== 30-audio.js ===== */
/* ============================================================
 * 無盡之門 v4.0 · 音頻擴充模組（30-audio.js）
 * 純增量：在既有 Web Audio 合成系統之上擴充
 *   1) 三扇門各 2~3 首 BGM 主題變奏（依 mood 切換）＋ 第四扇門獨特主題
 *   2) 結局收束音（好 / 壞 / 隱藏 / 真）
 *   3) 克制的 UI 音效（預設關閉）＋ 新 SETTINGS 開關
 *   4) 點唱機彈窗：試聽曲目、指定主題、顯示既有音量（不另造音量系統）
 * 全部程式化合成，無外部音檔；沿用既有 AudioContext、音量與靜音開關。
 * ============================================================ */
(function(){
'use strict';
if(window.V4Audio && V4Audio.__v30) return;

/* ---------- 主題登記表：和弦進行 / 波形 / 濾波 / 呼吸 / 速度 ---------- */
/* 和弦為 [根頻, 五度泛音] Hz；pluck 為稀疏高八度輕撥音列；pulse 為心跳低頻 */
var THEMES={
  '1-a':{name:'質數旅館 · 長廊',   sub:'門扉1 基底和弦進行',   chords:[[110,138.6],[87.3,110],[130.8,164.8],[98,123.5]], o1:'triangle', o2:'sine',    lp:380, lfo:0.06, interval:10000},
  '1-m':{name:'質數旅館 · 殘影',   sub:'門扉1 憂鬱段落（緩）', chords:[[87.3,110],[65.4,82.4],[73.4,92.5],[55,65.4]],    o1:'triangle', o2:'sine',    lp:300, lfo:0.05, interval:12000},
  '1-t':{name:'質數旅館 · 驚悸',   sub:'門扉1 驚悚段落（微諧）', chords:[[55,58.3],[58.3,61.7],[55,62.2],[49,58.3]],      o1:'sawtooth', o2:'sine',   lp:230, lfo:0.13, interval:8000},
  '2-a':{name:'沉默圖書館 · 塵封', sub:'門扉2 基底和弦進行',   chords:[[73.4,92.5],[58.3,73.4],[87.3,110],[65.4,82.4]],  o1:'triangle', o2:'sine',    lp:340, lfo:0.05, interval:11000},
  '2-m':{name:'沉默圖書館 · 失蹤目錄', sub:'門扉2 神秘段落（稀疏鐘聲）', chords:[[82.4,98],[61.7,73.4],[73.4,87.3],[55,69.3]], o1:'sine', o2:'triangle', lp:300, lfo:0.045, interval:13000, pluck:[440,523.25,659.25]},
  '3-a':{name:'倒計時醫院 · 迴廊', sub:'門扉3 基底和弦進行',   chords:[[65.4,82.4],[51.9,65.4],[77.8,98],[58.3,73.4]],   o1:'triangle', o2:'sine',    lp:360, lfo:0.06, interval:9000},
  '3-d':{name:'倒計時醫院 · 滴答', sub:'門扉3 恐懼段落（心跳脈衝）', chords:[[49,58.3],[51.9,62.2],[46.2,55],[49,62.2]],   o1:'sawtooth', o2:'sine',   lp:210, lfo:0.15, interval:6000, pulse:true},
  '4':  {name:'真門之後',           sub:'門扉4 獨特主題（空靈五度）', chords:[[98,146.8],[87.3,130.8],[110,164.8],[73.4,110]], o1:'sine', o2:'triangle', lp:520, lfo:0.05, interval:12000, pluck:[523.25,587.33,659.25,783.99,880]}
};

/* ---------- 內部狀態 ---------- */
var v4UiGain=null;          /* UI 音效專用 Gain（掛在 audioMasterGain 之後） */
var lastHoverT=0,lastHoverEl=null;
var bgm={nodes:null,timer:null,pulseTimer:null,themeKey:null,chordIdx:0,preview:false};

function ready(){ return !!(typeof SETTINGS!=='undefined' && SETTINGS.soundEnabled && audioCtx && audioCtx.state==='running'); }
function masterGainNode(){ return (typeof audioMasterGain!=='undefined')?audioMasterGain:null; }
function bgmVol(){ return (SETTINGS.bgmVolume!=null?SETTINGS.bgmVolume:25)/100*0.1; }

/* ---------- 一發即收的短音 ---------- */
function blip(o){
  if(!ready())return;
  if(!v4UiGain){
    if(!audioCtx||!audioMasterGain)return;
    try{ v4UiGain=audioCtx.createGain(); v4UiGain.gain.value=1; v4UiGain.connect(audioMasterGain); }catch(e){ v4UiGain=null; return; }
  }
  try{
    var now=audioCtx.currentTime+(o.t||0);
    var osc=audioCtx.createOscillator();
    var gn=audioCtx.createGain();
    osc.type=o.type||'sine';
    osc.frequency.setValueAtTime(o.f0,now);
    if(o.f1)osc.frequency.exponentialRampToValueAtTime(Math.max(1,o.f1),now+o.dur);
    gn.gain.setValueAtTime(0.0001,now);
    gn.gain.exponentialRampToValueAtTime(o.vol,now+0.008);
    gn.gain.exponentialRampToValueAtTime(0.0001,now+o.dur);
    osc.connect(gn); gn.connect(v4UiGain);
    osc.start(now); osc.stop(now+o.dur+0.05);
  }catch(e){}
}

/* ---------- UI 音效目錄（很短、音量小） ---------- */
function v4UiSfx(name){
  if(!SETTINGS.uiSfx)return;
  try{
    if(name==='hover'){ blip({type:'sine',f0:1500,dur:0.03,vol:0.006}); }
    else if(name==='click'){ blip({type:'sine',f0:620,f1:820,dur:0.06,vol:0.02}); }
    else if(name==='confirm'){ blip({type:'sine',f0:520,f1:780,dur:0.1,vol:0.03}); }
    else if(name==='panelOpen'){ blip({type:'sine',f0:440,dur:0.1,vol:0.02}); blip({type:'sine',f0:660,t:0.09,dur:0.14,vol:0.02}); }
    else if(name==='panelClose'){ blip({type:'sine',f0:660,dur:0.09,vol:0.018}); blip({type:'sine',f0:440,t:0.08,dur:0.12,vol:0.018}); }
    else if(name==='unlock'){ [660,880,1320].forEach(function(f,i){ blip({type:'sine',f0:f,t:i*0.08,dur:0.5,vol:0.035}); }); }
    else if(name==='fragment'){ blip({type:'sine',f0:1568,dur:0.4,vol:0.025}); blip({type:'sine',f0:2093,t:0.07,dur:0.6,vol:0.02}); }
  }catch(e){}
}

/* ---------- 結局收束音（避免疊音：此時基礎 BGM 已被 stopAmbient 關閉） ---------- */
function v4Stinger(kind){
  if(!ready())return;
  var out=masterGainNode(); if(!out)return;
  function note(f,t,dur,vol,type){
    try{
      var now=audioCtx.currentTime+t;
      var osc=audioCtx.createOscillator(); var gn=audioCtx.createGain();
      osc.type=type||'sine';
      osc.frequency.setValueAtTime(f,now);
      gn.gain.setValueAtTime(0.0001,now);
      gn.gain.exponentialRampToValueAtTime(vol,now+0.03);
      gn.gain.exponentialRampToValueAtTime(0.0001,now+dur);
      osc.connect(gn); gn.connect(out);
      osc.start(now); osc.stop(now+dur+0.1);
    }catch(e){}
  }
  if(kind==='bad'){
    note(110,0,1.3,0.14,'sawtooth'); note(116.5,0,1.3,0.1,'sawtooth'); note(55,0.15,1.5,0.16,'sine');
  }else if(kind==='hidden'){
    note(880,0,2.2,0.05); note(1318.5,0.15,2.6,0.04); note(1760,0.35,2.0,0.025);
  }else if(kind==='true'){
    [392,523.25,659.25,783.99,1046.5].forEach(function(f,i){ note(f,i*0.13,2.2,0.045,'triangle'); });
  }else{ /* good */
    note(523.25,0,1.6,0.05); note(659.25,0.12,1.8,0.05); note(783.99,0.24,2.0,0.045);
  }
}

/* ---------- BGM 主題引擎（沿用基礎寫法：雙振盪→低通→呼吸 LFO→master） ---------- */
function pickTheme(){
  var ov=SETTINGS.jukeboxTheme;
  if(ov&&ov!=='auto'&&THEMES[ov])return ov;           /* 點唱機指定 */
  var d=(typeof currentDungeonId!=='undefined')?currentDungeonId:1;
  var m=(typeof currentMood==='string')?currentMood:'mystery';
  if(d===4)return '4';                                  /* 第四扇門解耦：依 id 切換 */
  if(d===1){ if(m==='terror'||m==='tension')return '1-t'; if(m==='melancholy')return '1-m'; return '1-a'; }
  if(d===2){ if(m==='mystery')return '2-m'; return '2-a'; }
  if(d===3){ if(m==='terror'||m==='dread'||m==='tension')return '3-d'; return '3-a'; }
  return '1-a';
}

function v4StartBGM(allowPreview){
  if(!audioCtx)return;
  if(!SETTINGS.soundEnabled)return;
  if(!SETTINGS.bgmEnabled && !allowPreview)return;
  if(audioCtx.state!=='running')return;
  if(bgm.nodes)return;
  var key=pickTheme(); var th=THEMES[key];
  try{
    var osc1=audioCtx.createOscillator(); osc1.type=th.o1;
    var osc2=audioCtx.createOscillator(); osc2.type=th.o2||'sine';
    var filter=audioCtx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=th.lp; filter.Q.value=0.7;
    var gain=audioCtx.createGain(); gain.gain.value=0;
    var lfo=audioCtx.createOscillator(); lfo.frequency.value=th.lfo;
    var lfoGain=audioCtx.createGain(); lfoGain.gain.value=120;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(audioMasterGain);
    bgm.chordIdx=0;
    function setChord(){
      if(!bgm.nodes)return;
      var ch=th.chords[bgm.chordIdx%th.chords.length];
      osc1.frequency.setTargetAtTime(ch[0],audioCtx.currentTime,2);
      osc2.frequency.setTargetAtTime(ch[1],audioCtx.currentTime,2);
      /* 稀疏高八度輕撥，點綴旋律感 */
      if(th.pluck && (bgm.chordIdx%2===1)){
        var f=th.pluck[Math.floor(Math.random()*th.pluck.length)];
        try{
          var pn=audioCtx.createOscillator(); pn.type='sine'; pn.frequency.value=f;
          var pg=audioCtx.createGain(); var pnow=audioCtx.currentTime;
          pg.gain.setValueAtTime(0.0001,pnow);
          pg.gain.exponentialRampToValueAtTime(0.014,pnow+0.02);
          pg.gain.exponentialRampToValueAtTime(0.0001,pnow+1.4);
          pn.connect(pg); pg.connect(gain);
          pn.start(pnow); pn.stop(pnow+1.5);
        }catch(e){}
      }
      /* 恐懼段落：半拍一次低頻心跳 */
      if(th.pulse){
        bgm.pulseTimer=setTimeout(function(){
          if(!bgm.nodes)return;
          try{
            var pn=audioCtx.createOscillator(); pn.type='sine'; pn.frequency.value=58;
            var pg=audioCtx.createGain(); var pnow=audioCtx.currentTime;
            pg.gain.setValueAtTime(0.05,pnow);
            pg.gain.exponentialRampToValueAtTime(0.0001,pnow+0.35);
            pn.connect(pg); pg.connect(gain);
            pn.start(pnow); pn.stop(pnow+0.4);
          }catch(e){}
        },th.interval/2);
      }
      bgm.chordIdx++;
    }
    setChord();
    osc1.start(); osc2.start(); lfo.start();
    gain.gain.linearRampToValueAtTime(bgmVol(),audioCtx.currentTime+2.5);
    bgm.nodes={osc1:osc1,osc2:osc2,filter:filter,gain:gain,lfo:lfo,lfoGain:lfoGain,themeKey:key};
    bgm.timer=setInterval(setChord,th.interval);
  }catch(e){ bgm.nodes=null; }
}
function v4StopBGM(fadeSec){
  fadeSec=fadeSec||1.2;
  if(!bgm.nodes)return;
  if(bgm.timer){clearInterval(bgm.timer);bgm.timer=null;}
  if(bgm.pulseTimer){clearTimeout(bgm.pulseTimer);bgm.pulseTimer=null;}
  try{
    var now=audioCtx.currentTime;
    bgm.nodes.gain.gain.cancelScheduledValues(now);
    bgm.nodes.gain.gain.setTargetAtTime(0,now,fadeSec/3);
    var nodes=bgm.nodes;
    setTimeout(function(){ try{nodes.osc1.stop();nodes.osc2.stop();nodes.lfo.stop();}catch(e){} },fadeSec*1000+200);
  }catch(e){}
  bgm.nodes=null; bgm.themeKey=null;
}
function v4UpdateBGMVolume(){
  if(bgm.nodes&&audioCtx)bgm.nodes.gain.gain.setTargetAtTime(bgmVol(),audioCtx.currentTime,0.5);
}
/* mood 變化：主題不同才平滑切換，避免每個場景都重啟 */
function v4MoodChange(){
  if(!bgm.nodes||bgm.preview)return;
  var desired=pickTheme();
  if(desired!==bgm.nodes.themeKey){
    v4StopBGM(0.9);
    setTimeout(function(){ if(!bgm.preview)v4StartBGM(); },700);
  }
}

/* ---------- 包覆既有函數（純增量，不改原內容） ---------- */
window.v4StartBGM=v4StartBGM;
window.v4StopBGM=v4StopBGM;
var _sb=startBGM;
startBGM=function(){ (window.v4StartBGM||v4StartBGM)(false); };
var _stb=stopBGM;
stopBGM=function(){ (window.v4StopBGM||v4StopBGM)(1.2); };
var _ubv=updateBGMVolume;
updateBGMVolume=function(){ v4UpdateBGMVolume(); };

var _am=applyMood;
applyMood=function(m){ var r=_am.apply(this,arguments); try{v4MoodChange();}catch(e){} return r; };

/* 結局：依 type 分類收束音 */
var _te=triggerEnding;
triggerEnding=function(type,title,desc,reward){
  var r=_te.apply(this,arguments);
  try{
    var t=String(type||'');
    var kind='good';
    if(t==='bad'||t==='death_hp'||t.indexOf('bad_')===0||t.indexOf('death_')===0)kind='bad';
    else if(/true/i.test(t))kind='true';
    else if(t==='hidden'||t.indexOf('hidden_')===0)kind='hidden';
    setTimeout(function(){ v4Stinger(kind); },1500);  /* 與基礎 stopAmbient 同步，不疊音 */
  }catch(e){}
  return r;
};

/* 成就：僅在真正解鎖時提示 */
var _ua=unlockAchievement;
unlockAchievement=function(id){
  var before=(typeof hasAchievement==='function')&&hasAchievement(id);
  var r=_ua.apply(this,arguments);
  try{ if(!before&&(typeof hasAchievement==='function')&&hasAchievement(id))v4UiSfx('unlock'); }catch(e){}
  return r;
};
/* 迴廊碎片事件（V4 事件總線） */
if(window.V4&&V4.on)V4.on('fragment',function(){ try{v4UiSfx('fragment');}catch(e){} });

/* ---------- 全域事件委派：克制的 UI 音效 ---------- */
document.addEventListener('mouseover',function(e){
  var b=(e.target&&e.target.closest)?e.target.closest('#choices .choice-btn'):null;
  if(!b)return;
  var now=Date.now();
  if(lastHoverEl===b||now-lastHoverT<90)return;
  lastHoverEl=b; lastHoverT=now;
  v4UiSfx('hover');
});
document.addEventListener('click',function(e){
  var t=e.target; if(!t||!t.closest)return;
  if(t.closest('#choices .choice-btn')){ v4UiSfx('confirm'); return; }
  if(t.closest('#settings-body .toggle')||t.closest('#v4-jukebox-modal .toggle')||
     t.closest('#settings-body .secondary')||t.closest('.v4-btn')){ v4UiSfx('click'); }
});

/* 面板開 / 關音效 */
var _os=openSettings;
openSettings=function(){ var r=_os.apply(this,arguments); try{v4UiSfx('panelOpen');}catch(e){} return r; };
var _cm=closeModal;
closeModal=function(id){
  var el=document.getElementById(id);
  var was=el&&el.classList.contains('show');
  var r=_cm.apply(this,arguments);
  if(was)try{v4UiSfx('panelClose');}catch(e){}
  return r;
};

/* ---------- 設置面板追加兩列（包覆 renderSettings，既有列不動） ---------- */
function v4InjectSettingsRows(){
  var host=document.getElementById('settings-body');
  if(!host||document.getElementById('v4uisfx-row'))return;
  var soundOn=!!SETTINGS.soundEnabled;
  var row1=document.createElement('div');
  row1.className='setting-row'; row1.id='v4uisfx-row';
  row1.style.display=soundOn?'flex':'none';
  row1.innerHTML='<div><div class="set-label">UI 音效</div><div class="set-sub">選項懸停與點擊、面板開關、解鎖提示（預設關閉）</div></div>'+
    '<div class="toggle '+(SETTINGS.uiSfx?'on':'')+'" id="v4uisfx-toggle"></div>';
  var row2=document.createElement('div');
  row2.className='setting-row';
  row2.innerHTML='<div><div class="set-label">點唱機</div><div class="set-sub">試聽各門扉 BGM 主題，並指定固定曲目</div></div>'+
    '<button class="secondary" id="v4juke-open">打 開</button>';
  var anchor=document.getElementById('bgm-vol-row');
  if(anchor&&anchor.parentNode){
    anchor.parentNode.insertBefore(row1,anchor.nextSibling);
    anchor.parentNode.insertBefore(row2,row1.nextSibling);
  }else{ host.appendChild(row1); host.appendChild(row2); }
  var tg=document.getElementById('v4uisfx-toggle');
  if(tg)tg.onclick=function(){
    SETTINGS.uiSfx=!SETTINGS.uiSfx;
    saveSettings(SETTINGS);
    renderSettings();
    if(SETTINGS.uiSfx)v4UiSfx('click');
  };
  var op=document.getElementById('v4juke-open');
  if(op)op.onclick=function(){ v4OpenJukebox(); };
}
var _rs=renderSettings;
renderSettings=function(){
  var r=_rs.apply(this,arguments);
  try{v4InjectSettingsRows();}catch(e){}
  return r;
};

/* ---------- 點唱機彈窗 ---------- */
function v4BuildJukebox(){
  if(document.getElementById('v4-jukebox-modal'))return;
  var ov=document.createElement('div');
  ov.className='modal-overlay'; ov.id='v4-jukebox-modal';
  ov.innerHTML=
   '<div class="modal-card v4-card">'+
   '<h3>點 唱 機</h3>'+
   '<div class="v4-sub">合成 BGM 試聽 · 音量與開關沿用設置</div>'+
   '<div class="v4-juke-status" id="v4-juke-status"></div>'+
   '<div class="setting-row" style="margin-top:1rem;align-items:center"><div><div class="set-label">UI 音效</div><div class="set-sub">介面點擊提示音</div></div><div class="toggle" id="v4-juke-uisfx"></div></div>'+
   '<div class="v4-divider"></div>'+
   '<div class="v4-list" id="v4-juke-list"></div>'+
   '<div class="v4-actions">'+
   '<button class="v4-btn" id="v4-juke-auto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>跟隨門扉</button>'+
   '<button class="v4-btn primary" id="v4-juke-close">關 閉</button>'+
   '</div>'+
   '</div>';
  document.body.appendChild(ov);
  document.getElementById('v4-juke-close').onclick=function(){ v4CloseJukebox(); };
  document.getElementById('v4-juke-auto').onclick=function(){
    SETTINGS.jukeboxTheme='auto'; saveSettings(SETTINGS); v4UiSfx('click'); v4RenderJukeList();
    if(bgm.nodes){ v4StopBGM(0.6); setTimeout(function(){v4StartBGM(false);},500); }
  };
  document.getElementById('v4-juke-uisfx').onclick=function(){
    SETTINGS.uiSfx=!SETTINGS.uiSfx; saveSettings(SETTINGS); v4UiSfx('click'); v4RefreshJukeToggle();
  };
}
function v4RefreshJukeStatus(){
  var el=document.getElementById('v4-juke-status'); if(!el)return;
  el.textContent='總音量 '+(SETTINGS.masterVolume!=null?SETTINGS.masterVolume:70)+
    '% · BGM 音量 '+(SETTINGS.bgmVolume!=null?SETTINGS.bgmVolume:25)+
    '% · 背景音樂 '+(SETTINGS.bgmEnabled?'開':'關')+
    ' · 音效總開關 '+(SETTINGS.soundEnabled?'開':'關');
}
function v4RefreshJukeToggle(){
  var t=document.getElementById('v4-juke-uisfx');
  if(t)t.className='toggle'+(SETTINGS.uiSfx?' on':'');
}
function v4RenderJukeList(){
  var list=document.getElementById('v4-juke-list'); if(!list)return;
  var cur=pickTheme();
  list.innerHTML='';
  Object.keys(THEMES).forEach(function(key){
    var th=THEMES[key];
    var row=document.createElement('div');
    row.className='v4-row'+(cur===key?' on':'');
    row.innerHTML='<div class="v4-row-main"><div class="v4-row-t">'+th.name+'</div><div class="v4-row-d">'+th.sub+'</div></div>'+
      '<button class="v4-btn" data-v4preview="'+key+'">試聽</button>'+
      '<button class="v4-btn primary" data-v4pick="'+key+'">指定</button>';
    list.appendChild(row);
  });
  list.querySelectorAll('[data-v4preview]').forEach(function(b){
    b.onclick=function(){
      v4PreviewTheme(b.getAttribute('data-v4preview'));
      v4UiSfx('click');
    };
  });
  list.querySelectorAll('[data-v4pick]').forEach(function(b){
    b.onclick=function(){
      var key=b.getAttribute('data-v4pick');
      SETTINGS.jukeboxTheme=key; saveSettings(SETTINGS);
      v4PreviewTheme(key);
      v4UiSfx('click');
      v4RenderJukeList();
    };
  });
}
/* 試聽：以指定主題直接啟動（允許在 BGM 總開關關閉時試聽，仍受音效總開關與音量節制） */
function v4PreviewTheme(key){
  if(!THEMES[key])return;
  if(!audioCtx||audioCtx.state!=='running')return;
  if(!SETTINGS.soundEnabled)return;
  bgm.preview=true;
  v4StopBGM(0.4);
  var saved=SETTINGS.jukeboxTheme;
  SETTINGS.jukeboxTheme=key;
  setTimeout(function(){ v4StartBGM(true); SETTINGS.jukeboxTheme=saved; },350);
}
function v4OpenJukebox(){
  v4BuildJukebox();
  try{ if(typeof initAudio==='function')initAudio(); }catch(e){}  /* 借這次手勢喚醒 AudioContext */
  v4RefreshJukeStatus();
  v4RefreshJukeToggle();
  v4RenderJukeList();
  document.getElementById('v4-jukebox-modal').classList.add('show');
  v4UiSfx('panelOpen');
  /* 開彈窗時先停掉現場 BGM，避免與試聽疊音 */
  if(bgm.nodes){ bgm.preview=true; v4StopBGM(0.6); }
}
function v4CloseJukebox(){
  var ov=document.getElementById('v4-jukebox-modal');
  if(ov)ov.classList.remove('show');
  v4UiSfx('panelClose');
  var inGame=($('game-screen')&&$('game-screen').classList.contains('active'));
  bgm.preview=false;
  v4StopBGM(0.8);
  /* 離開彈窗：在遊戲中且 BGM 開啟才恢復現場；標題畫面不留殘音 */
  if(inGame&&SETTINGS.bgmEnabled){ setTimeout(function(){v4StartBGM(false);},600); }
}

/* ---------- 對外開放（供其他模組呼叫） ---------- */
window.V4Audio={__v30:true, stinger:v4Stinger, preview:v4PreviewTheme, themes:THEMES,
  debug:function(){ return {nodes:!!bgm.nodes, theme:(bgm.nodes?bgm.nodes.themeKey:null), preview:bgm.preview, timer:!!bgm.timer}; }};
})();

/* ===== 35-gm-enhance.js ===== */
/* ============================================================
 * 無盡之門 · v4.0 GM 自動遊玩強化（完整版）
 * 讓自動遊玩可觸及所有結局，並與 ENDING_TOTALS 一致：
 *  - 一般 next 選擇、動作（action）內 goToScene 導航
 *  - 謎題（openPuzzle）：自動以正確答案解開後繼續
 *  - 動作內 triggerEnding 結局（含隱藏結局）
 *  - 通用「失血過多（death_hp）」結局
 * 純增量包裝，不修改既有 GM 函數，只在其前後追加。
 * ============================================================ */
(function(){
'use strict';
if(!window.V4)return;
var ACT='@act';

/* ---------- 建立「靜態動作圖」：每個場景的可走邊 ---------- */
function buildEdges(){
  var g={};
  for(var k in SCENES){
    var sc=SCENES[k]; if(!sc)continue;
    var edges=[];
    (sc.choices||[]).forEach(function(c,idx){
      if(c.next&&SCENES[c.next]&&!c.useless){
        edges.push({to:c.next,type:'nav',idx:idx});
      }
      if(typeof c.action==='function'){
        var src=c.action.toString();
        if(src.indexOf('openPuzzle')>-1){
          var ansM=src.match(/openPuzzle\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*'([^']*)'/);
          var answer=ansM?ansM[3]:null;
          /* 回調參數名可能是 ok / success：先取成功分支，再退回整個回調體 */
          var succ=null;
          var truthM=src.match(/if\s*\(\s*\w+\s*\)\s*\{([\s\S]*?)\}/);
          if(truthM){var sM=truthM[1].match(/goToScene\(\s*['"]([^'"]+)['"]/);if(sM)succ=sM[1];}
          if(!succ){
            var cbM=src.match(/function\s*\(\s*\w+\s*\)\s*\{([\s\S]*?)\}\s*[,)]/);
            if(cbM){var cM=cbM[1].match(/goToScene\(\s*['"]([^'"]+)['"]/);if(cM)succ=cM[1];}
          }
          if(succ)edges.push({to:succ,type:'puzzle',idx:idx,answer:answer});
        }else if(src.indexOf('triggerEnding')>-1){
          var tM=src.match(/triggerEnding\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/);
          edges.push({to:'__END__',type:'ending',idx:idx,et:tM?tM[1]:null,title:tM?tM[2]:null});
        }else if(src.indexOf('goToScene')>-1){
          var gM=src.match(/goToScene\(\s*['"]([^'"]+)['"]/);
          if(gM&&SCENES[gM[1]])edges.push({to:gM[1],type:'action-nav',idx:idx});
        }
      }
    });
    g[k]=edges;
  }
  return g;
}

/* 收集「動作內 triggerEnding」結局（補登清單用） */
function scanActionEndings(){
  var map={};
  for(var k in SCENES){
    var sc=SCENES[k]; if(!sc||!sc.choices)continue;
    sc.choices.forEach(function(c,idx){
      if(typeof c.action==='function'){
        var src=c.action.toString();
        if(src.indexOf('openPuzzle')===-1){
          var m=src.match(/triggerEnding\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/);
          if(m)(map[k]=map[k]||[]).push({choiceIdx:idx,type:m[1],title:m[2]});
        }
      }
    });
  }
  return map;
}

/* ---------- 在動作圖上 BFS 找邊路徑 ---------- */
function findEdgePath(start,targetScene){
  var g=buildEdges();
  if(start===targetScene)return [];
  var queue=[{scene:start,edges:[]}],visited={};visited[start]=true;var guard=0;
  while(queue.length&&guard<8000){
    guard++;
    var cur=queue.shift();
    var edges=g[cur.scene]||[];
    for(var i=0;i<edges.length;i++){
      var e=edges[i],to=e.to;
      if(to==='__END__'||!SCENES[to]||visited[to])continue;
      visited[to]=true;
      var ne=cur.edges.concat([e]);
      if(to===targetScene)return ne;
      queue.push({scene:to,edges:ne});
    }
  }
  return null;
}

/* ---------- 直接執行一邊（繞過「先選廢選項才出現主選項」的渲染門檻） ---------- */
function executeEdge(e){
  var cur=state.currentScene;
  var sc=SCENES[cur];
  if(e.type==='nav'){
    /* 純 next 導航：goToScene 等價於點擊，且更可靠 */
    goToScene(e.to);
  }else if(e.type==='action-nav'){
    var ch=sc.choices[e.idx];ch.action();
  }else if(e.type==='puzzle'){
    /* 直接喚起謎題，再以正確答案送出 */
    sc.choices[e.idx].action();
    setTimeout(function(){
      var inp=document.getElementById('puzzle-input');
      if(inp){inp.value=e.answer;window.submitPuzzle();}
    },420);
  }
}

V4.onBoot(function(){
  if(typeof window.gmGetEndingList!=='function')return;

  /* ---------- 1. 補全結局清單 ---------- */
  var _origList=window.gmGetEndingList;
  window.gmGetEndingList=function(){
    var list=_origList();
    var have={};list.forEach(function(e){have[e.id]=true;});
    var map=scanActionEndings();
    for(var k in map){
      map[k].forEach(function(meta){
        var id=k+ACT+meta.choiceIdx;
        if(!have[id]){list.push({id:id,title:meta.title,reward:'',roomName:''});have[id]=true;}
      });
    }
    var did=(state&&state.dungeonId!=null)?state.dungeonId:(typeof currentDungeonId!=='undefined'?currentDungeonId:null);
    var expected=ENDING_TOTALS[did]!=null?ENDING_TOTALS[did]:list.length;
    if(!have['death_hp']&&list.length===expected-1&&typeof window.damage==='function'){
      list.push({id:'death_hp',title:'失血過多',reward:'壞結局 · 死亡',roomName:''});
    }
    return list;
  };

  /* ---------- 2. 啟動：解析目標、走動作圖 ---------- */
  window.gmAutoPlayStart=function(targetId){
    if(window.gmAutoPlaying){window.showToast('自動遊玩進行中，請先停止');return;}
    if(!document.getElementById('game-screen').classList.contains('active')){window.showToast('請先進入遊戲');return;}

    if(targetId==='death_hp'){
      window.gmAutoPlaying=true;window.gmAutoSkip=true;
      var stop=document.getElementById('gm-autoplay-stop');if(stop)stop.style.display='inline-block';
      state.hp=1;window.damage(2);
      return;
    }

    var scene=targetId,finalChoice=-1;
    if(targetId.indexOf(ACT)>-1){
      scene=targetId.split(ACT)[0];
      finalChoice=parseInt(targetId.split(ACT)[1],10);
    }
    var start=state.currentScene;
    var path=findEdgePath(start,scene);
    if(path===null){window.showToast('找不到通往該結局的路徑，請先跳轉到更接近的場景');return;}

    window.gmAutoPlaying=true;window.gmAutoSkip=true;
    var sbtn=document.getElementById('gm-autoplay-stop');if(sbtn)sbtn.style.display='inline-block';
    var statusEl=document.getElementById('gm-autoplay-status');

    var i=0;
    function runEdges(){
      if(i>=path.length){arrive();return;}
      var e=path[i];
      if(statusEl)statusEl.textContent='進度：'+(i+1)+'/'+(path.length)+' → '+e.to+(e.type==='puzzle'?'（解謎）':'');
      executeEdge(e);
      i++;setTimeout(runEdges, e.type==='puzzle'?1100:780);
    }
    function arrive(){
      if(statusEl)statusEl.textContent='已到達 '+scene+(finalChoice>=0?'，觸發選擇…':'');
      setTimeout(function(){
        if(finalChoice>=0){
          var sc=SCENES[scene];
          var ch=sc&&sc.choices?sc.choices[finalChoice]:null;
          if(ch&&typeof ch.action==='function'){try{ch.action();}catch(e){console.warn(e);}}
        }
        setTimeout(function(){
          window.gmAutoPlayStop();
          window.showToast('自動遊玩完成');
        },900);
      },900);
    }
    runEdges();
  };

  /* 保留舊的路徑查詢（其他地方可能呼叫），改為走動作圖 */
  if(window.gmFindPathTo){
    var _origFind=window.gmFindPathTo;
    window.gmFindPathTo=function(targetId){
      var scene=targetId.indexOf(ACT)>-1?targetId.split(ACT)[0]:targetId;
      var start=state.currentScene;
      var path=findEdgePath(start,scene);
      if(path===null)return _origFind(targetId);
      return path.map(function(e){return e.to;}).concat([scene]);
    };
  }
});
})();

