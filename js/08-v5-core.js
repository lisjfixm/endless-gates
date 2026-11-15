
/* ===== 00-v5-core.js ===== */
/* ============================================================
 * 無盡之門 · v5.0 擴展核心（Infinite Gates · v5 Extension Core）
 * 建立在 V4 純增量層之上，再接入新門扉、新系統：
 *  - 通用註冊新門扉（自動建立 state/scene refs、buildScenes、迴廊列表）
 *  - 通用註冊新系統、劇情包、成就
 * 不修改任何既有內容，只在其後追加。
 * ============================================================ */
(function(){
'use strict';
if(!window.V4)return;
if(window.V5&&window.V5.__booted)return;
var V5=window.V5={
  version:'5.0.0',__booted:false,
  _dungeonDefs:{},_story:{},_systems:[],_achAdd:{},_postBoot:[]
};

/* ---------- 註冊 API ---------- */
V5.registerDungeon=function(def){V5._dungeonDefs[def.id]=def;};
V5.registerSystem=function(name,initFn){V5._systems.push({name:name,init:initFn});};
V5.onBoot=function(fn){V5._postBoot.push(fn);};
V5.addAchievements=function(id,list){
  if(!V5._achAdd[id])V5._achAdd[id]=[];
  list.forEach(function(a){
    V5._achAdd[id].push(a);
    if(window.DUNGEON_CONFIG && DUNGEON_CONFIG[id] && Array.isArray(DUNGEON_CONFIG[id].achDefs)){
      if(!DUNGEON_CONFIG[id].achDefs.some(function(x){return x.id===a.id;})){
        DUNGEON_CONFIG[id].achDefs.push(a);
      }
    }
  });
};
V5.registerStoryPack=function(id,pack){
  if(!V5._story[id])V5._story[id]={scenes:{},inject:[]};
  var s=V5._story[id];
  if(pack.scenes)for(var k in pack.scenes)s.scenes[k]=pack.scenes[k];
  if(pack.inject)pack.inject.forEach(function(x){
    if(!x.choice.__v5cid)x.choice.__v5cid='v5_'+id+'_'+s.inject.length+'_'+(x.into||'');
    s.inject.push(x);
  });
  if(pack.endingsAdded)s.endingsAdded=(s.endingsAdded||0)+pack.endingsAdded;
};

/* ---------- 劇情包套用（每次 buildScenes 後） ---------- */
function applyV5Story(id){
  var pack=V5._story[id];if(!pack)return;
  for(var k in pack.scenes){SCENES[k]=pack.scenes[k];}
  pack.inject.forEach(function(inj){
    var sc=SCENES[inj.into];if(!sc||!sc.choices)return;
    if(!sc.__v5ids)sc.__v5ids=[];
    if(sc.__v5ids.indexOf(inj.choice.__v5cid)!==-1)return;
    sc.__v5ids.push(inj.choice.__v5cid);
    sc.choices.push(inj.choice);
  });
  if(pack.endingsAdded&&!pack.__endingsCounted){pack.__endingsCounted=true;ENDING_TOTALS[id]=(ENDING_TOTALS[id]||0)+pack.endingsAdded;if(DUNGEON_CONFIG[id])DUNGEON_CONFIG[id].totalEndings=ENDING_TOTALS[id];}
}
V5.applyV5Story=applyV5Story;

/* ---------- 新門扉接入 ---------- */
function setupV5Dungeon(def){
  var id=def.id;
  var st=def.stateInit();stateRefs[id]=st;
  var S={};sceneRefs[id]=S;
  DUNGEON_CONFIG[id]={
    savePrefix:def.savePrefix,dungeonId:String(id),totalEndings:def.totalEndings,
    startScene:def.startScene,roomNum:def.roomNum,dungeonName:def.name,
    subText:def.subText,ruleText:def.ruleText||'',
    hasParty:!!def.hasParty,hasCountdown:!!def.hasCountdown,hasAdmin:!!def.hasAdmin,
    achDefs:def.achDefs?def.achDefs.slice():[]
  };
  window['buildScenes'+id]=function(){
    state=stateRefs[id];SCENES=sceneRefs[id];
    if(def.buildScenes)def.buildScenes();
    try{applyV5Story(id);}catch(e){}
  };
  dungeons.push({id:id,name:def.name,index:def.index,bgNum:def.bgNum||def.roomNum,
                 tagline:def.tagline,clearedKey:def.clearedKey});
}

/* 新門扉接入後的一次性初始化（V4 完成後） */
function v5setup(){
  if(V5.__setupDone)return;V5.__setupDone=true;

  /* 1. 新門扉解鎖/通關包裝（再包一層，含 V5） */
  var _u4=isUnlocked;
  isUnlocked=function(x){
    if(V5._dungeonDefs[x])return V5._dungeonDefs[x].unlock?V5._dungeonDefs[x].unlock():false;
    return _u4(x);
  };
  var _c4=isCleared;
  isCleared=function(x){
    var dd=V5._dungeonDefs[x];
    if(dd){try{return localStorage.getItem(dd.clearedKey)==='true';}catch(e){return false;}}
    return _c4(x);
  };
  var _bg4=startBgNumAnimation;
  startBgNumAnimation=function(x){
    if(V5._dungeonDefs[x]){if(V5._dungeonDefs[x].bgAnimation)V5._dungeonDefs[x].bgAnimation();return;}
    return _bg4(x);
  };

  /* 引擎強健性：renderMap / renderNotes 在門扉缺少 mapZones/notes 時不應崩潰 */
  if(typeof window.renderMap==='function'&&!window.renderMap.__v5){
    var _rm=window.renderMap;
    window.renderMap=function(){
      try{ if(!state||!state.mapZones){var ml=$('map-list');if(ml)ml.innerHTML='';return;} }catch(e){return;}
      return _rm.apply(this,arguments);
    };
    window.renderMap.__v5=true;
  }
  if(typeof window.renderNotes==='function'&&!window.renderNotes.__v5){
    var _rn=window.renderNotes;
    window.renderNotes=function(){
      try{ if(!state||!state.notes)return; }catch(e){return;}
      return _rn.apply(this,arguments);
    };
    window.renderNotes.__v5=true;
  }

  /* 2. 建立新門扉 */
  Object.keys(V5._dungeonDefs).forEach(function(k){setupV5Dungeon(V5._dungeonDefs[k]);});

  /* 3. 追加成就、重算 ACH_TOTAL */
  Object.keys(V5._achAdd).forEach(function(id){
    var cfg=DUNGEON_CONFIG[id];if(!cfg)return;
    V5._achAdd[id].forEach(function(a){
      if(cfg.achDefs.filter(function(x){return x.id===a.id;}).length===0)cfg.achDefs.push(a);
    });
  });
  var achTot=0;
  Object.keys(DUNGEON_CONFIG).forEach(function(id){achTot+=DUNGEON_CONFIG[id].achDefs.length;});
  ACH_TOTAL=achTot;

  /* 4. 新門扉結局總數 */
  Object.keys(V5._dungeonDefs).forEach(function(k){
    ENDING_TOTALS[k]=V5._dungeonDefs[k].totalEndings;
  });

  /* 5. 版本號升級、更新日誌（在 postBoot 之前執行，讓後續模組可繼續向上迭代版本號） */
  try{
    window.VERSION='5.0.0';
    if(window.CHANGELOG&&!window.CHANGELOG.some(function(c){return c.version==='5.0.0';})){
      window.CHANGELOG.unshift({version:'5.0.0',type:'major',changes:[
        '第五扇門「迴光之海」上線：19 個新場景、7 個結局（含集齊未選之門與謎題後才抵達的真結局「迴光之海」），收容所有未選擇的路。',
        '潮汐機制：世界漲退，部分場景與路徑僅於特定潮汐狀態可達，可在潮井推動潮汐。',
        '迴溯機制：消耗有限的「迴光粒」可撤銷上一個選擇、回到上一場景。',
        '傳承之印：通關後可選擇裝備印記，於下次遊玩獲得開局增益（如額外 HP、復活、初始道具、更多提示）。',
        '迴光遺物圖鑑：四扇既有門扉各藏 2 件隱藏遺物，共 8 件，可於迴廊手札查看。',
        '命令面板：Ctrl/Cmd+K 喚出，快速搜尋並執行動作（手機端亦可）。',
        '迴廊手札新增「遺物／統計／印記」分頁，含人格雷達、旅程統計等可視化。',
        '音頻強化：3 首第五扇門 BGM 主題、潮汐環境音層、新系統音效，並納入點唱機。',
        '修復畫廊無法檢視第四扇門、匯出存檔漏失第四扇門與碎片進度、畫廊場景分頁對第四扇門失效等問題。',
        '新增琥珀、青玉兩套主題與仿宋字體；UIUX 與手機適配、無障礙再精緻化。'
      ]});
    }
  }catch(e){}

  /* 6. 啟動新系統與 postBoot 回調 */
  V5._systems.forEach(function(s){try{s.init();}catch(e){console.error('V5 系統「'+s.name+'」啟動失敗：',e);}});
  V5._postBoot.forEach(function(fn){try{fn();}catch(e){console.error('v5 postBoot 失敗：',e);}});
  try{if(typeof render==='function')render();}catch(e){}
}

/* ---------- 引導（v5 模組全部載入後由末尾 V5.boot() 呼叫） ---------- */
V5.boot=function(){
  if(V5.__bootCalled)return;V5.__bootCalled=true;
  if(V4.__booted)v5setup();
  /* V4 尚未引導時，改由 V4.onBoot 觸發 */
  else V4.onBoot(v5setup);
};
})();

/* ===== 42-dungeon5.js ===== */
/* ============================================================
 * 無盡之門 · v5.0 第五扇門：迴光之海（The Sea of Echoing Light）
 * 純增量接入：V5.registerDungeon。不修改任何既有內容。
 * 定位：穿過迴廊心臟與第四扇門之後，沉入收容所有「未選擇的路」
 *       與被遺忘時刻的幽暗潮汐之海。
 * 核心機制：
 *   ① 潮汐（tide）：世界漲退，部分場景/選項只在特定潮汐可達；
 *      可在潮井推動潮汐。
 *   ② 迴溯（rewind）：消耗「迴光粒」撤銷上一個選擇，回到上一場景。
 * ============================================================ */
(function(){
'use strict';

/* ---- 避免觸發既有 onEndingReached 對舊門扉的兜底比對 ---- */
if(typeof window.onEndingReached === 'function'){
  var _origOnEndingReached = window.onEndingReached;
  window.onEndingReached = function(type, title){
    if(currentDungeonId === 5) return; /* 第五扇門結局由場景內顯式處理 */
    return _origOnEndingReached.apply(this, arguments);
  };
}

/* ============================================================
 * 成就定義（6 枚）
 * ============================================================ */
var ACH = [
  {id:'ach_d5_sink',      name:'沉沒',       desc:'第一次沉入迴光之海'},
  {id:'ach_d5_tidepushed',name:'弄潮',       desc:'在潮井推動過一次潮汐'},
  {id:'ach_d5_rewind',    name:'倒帶',       desc:'用迴光粒迴溯上一個選擇'},
  {id:'ach_d5_unchosen',  name:'未選之路',   desc:'看過兩扇你當初沒推開的門'},
  {id:'ach_d5_tidewatcher',name:'聽海人',    desc:'解開海底潮鐘與燈塔迴聲之數'},
  {id:'ach_d5_true',      name:'迴光',       desc:'看見迴光之海的盡頭'}
];

/* 潮汐狀態顯示 */
var TIDE_LABEL = {still:'平潮', high:'漲潮', low:'退潮'};

V5.registerDungeon({
  id:5,
  index:'第 五 扇 門',
  name:'迴光之海',
  roomNum:'≈',
  bgNum:'≈',
  clearedKey:'wuxian-fifth-cleared',
  savePrefix:'v5-tide-save',
  startScene:'d5_prologue',
  subText:'沉 没 之 海 · 第 五 扇 門',
  ruleText:'海 會 漲 ， 也 會 退',
  hasParty:false,
  hasCountdown:false,
  hasAdmin:false,
  achDefs:ACH,
  totalEndings:7,
  unlock:function(){ return isCleared(4); },
  tagline:'收容所有未選擇的路。',

  /* ---- 背景數字：在波浪符號間緩慢輪轉，尊重減速動畫 ---- */
  bgAnimation:function(){
    if(bgNumTimer){ clearInterval(bgNumTimer); bgNumTimer=null; }
    var el = $('bg-num'); if(!el) return;
    el.classList.remove('float');
    if(SETTINGS.bgAnim === false || SETTINGS.reducedMotion){ el.textContent='≈'; return; }
    var seq = ['≈','≈','∿','≈','～','≈','∿','3:17','≈'];
    var i = 0;
    el.textContent = seq[i];
    bgNumTimer = setInterval(function(){
      i = (i+1) % seq.length;
      el.textContent = seq[i];
    }, 2600);
  },

  /* ---- state：潮汐、迴光粒、迴溯足跡、地圖 ---- */
  stateInit:function(){
    return {
      currentScene:'d5_prologue',
      inventory:[],
      flags:{},
      hp:100,
      textIndex:0,
      puzzleCallback:null, puzzleAnswer:null, puzzleAttempts:0,
      inheritance:(typeof loadInheritance === 'function') ? loadInheritance() : {},
      notes:[], history:[],
      personality:{calm:50, altruism:50, cautious:50},
      tide:'still',          /* still 平潮 / high 漲潮 / low 退潮 */
      echo:3,                /* 迴光粒：迴溯的代價 */
      trail:[],              /* 迴溯足跡（去過的場景） */
      mapZones:[
        {id:'d5_shore', name:'汐岸',     explored:false, current:true,  scene:'d5_shore',     summary:'海邊一道退不出的沙。潮水在這裡決定下一步。'},
        {id:'d5_well',  name:'潮井',     explored:false, current:false, scene:'d5_well',      summary:'井裡沒有水，只有海的心搏。伸手進去，就能推動潮汐。'},
        {id:'d5_seabed',name:'退潮海床', explored:false, current:false, scene:'d5_seabed',    summary:'退潮才露出的海底。兩扇半沉的門，門後是你沒選的路。'},
        {id:'d5_raft',  name:'浮光筏',   explored:false, current:false, scene:'d5_raft',      summary:'漲潮才浮起的光。一座燈塔，和一個做了不同選擇的你。'},
        {id:'d5_deep',  name:'海心',     explored:false, current:false, scene:'d5_deepgate',  summary:'海最深的縫。所有未說出口的時刻，都沉在這裡。'}
      ]
    };
  },

  /* ---- 場景定義 ---- */
  buildScenes:function(){

    /* 兩扇未選之路都看過 → 成就 */
    function checkUnchosen(){
      if(state.flags.d5_unspoken && state.flags.d5_untaken){
        unlockAchievement('ach_d5_unchosen');
        addNote('d5_unchosen','未選之路','電話那頭、岔路那邊——你都回去站了一會。它們沒有你想的那麼好，也沒有那麼壞。');
      }
    }
    /* 兩道謎都解過 → 成就 */
    function checkWatcher(){
      if(state.flags.d5_recognized && state.flags.d5_echoes){
        unlockAchievement('ach_d5_tidewatcher');
      }
    }
    /* 加迴光粒（上限 6） */
    function addEcho(n){
      state.echo = Math.min(6, (state.echo||0)+n);
      updateD5HUD();
    }

    /* ===== 1. 序章：沉入 ===== */
    SCENES.d5_prologue = {
      room:'≈', roomName:'入水', sceneId:'5-序章', mood:'melancholy',
      text:[
        '<p>你以為推開最後那扇門，會看見一盞燈。</p>',
        '<p>門後沒有燈。是水。</p>',
        '<p>不是淹進來的那種水——是你自己，慢慢往下沉。沒有壓力，沒有嗆咳，像終於躺下。四周的黑是溫的，溫得像凌晨三點十七分那間沒人再進來的辦公室。</p>',
        '<p>你低頭。手裡還攥著點什麼。不是鑰匙，不是門牌——是一些「沒走完的」。一通沒打的電話，一條岔開後沒轉進去的路，一個沒說出口的對不起。它們沒有隨著門關上而消失。它們沉在這裡。</p>',
        '<p>原來這片海，收容的是所有「你沒選的那條路」。</p>',
        '<p>上方有光。很遠，一明一暗，像潮汐，也像呼吸。你朝著那光，划了第一下。</p>'
      ],
      onEnter:function(){ unlockAchievement('ach_d5_sink'); },
      choices:[
        {text:'朝著那點光，游到能站腳的地方', next:'d5_shore', personality:{calm:+5}}
      ]
    };

    /* ===== 2. 汐岸（樞紐，潮汐分流） ===== */
    SCENES.d5_shore = {
      room:'≈', roomName:'汐岸', sceneId:'5-汐岸', mood:'mystery', mapZone:'d5_shore',
      text:[
        '<p>你踩到底。是一道沙。沙的顏色不是黃，是褪色的金，像舊紙張的邊。</p>',
        '<p>海在你腳邊一進一退。你蹲下，把手貼上去——它是活的。它正在漲，或者正在退。</p>',
        '<p class="system-msg">現在是「'+TIDE_LABEL[state.tide]+'」。潮汐決定哪裡有路：退潮露出海床，漲潮浮起光筏。</p>',
        '<p>沙的盡頭，一口發著幽光的井。海的正前方，一道半沉在水裡的石階，若隱若現。</p>'
      ],
      textReturn:[
        '<p>汐岸還是那道褪色的金沙。海在你腳邊，'+TIDE_LABEL[state.tide]+'。</p>'
      ],
      choices:[
        {text:'走向那口發著幽光的潮井', next:'d5_well', personality:{cautious:+2}},
        {text:'走下剛露出水面的海床（退潮才見）', next:'d5_seabed',
         condition:function(){ return state.tide==='low'; }, personality:{cautious:+3}},
        {text:'登上浮光凝成的筏（漲潮才浮起）', next:'d5_raft',
         condition:function(){ return state.tide==='high'; }, personality:{cautious:+3}},
        {text:'涉水走向正前方那道半沉的石階（海心）', next:'d5_deepgate',
         condition:function(){ return !!state.flags.d5_tidepushed; }, personality:{calm:+3}},
        {text:'放鬆身子，不再掙扎，任自己往下沉', next:'d5_end_drown', danger:true,
         personality:{cautious:-10}},
        {text:'蹲下，看平靜無波的水面', observe:'水面映出的不是你的臉。是另一個你，站在一個你沒去過的地方，回頭朝你揮手。你直起身。'}
      ]
    };

    /* ===== 3. 潮井（推動潮汐 / 謎題 P3 / 補給） ===== */
    SCENES.d5_well = {
      room:'≈', roomName:'潮井', sceneId:'5-潮井', mood:'mystery', mapZone:'d5_well',
      text:[
        '<p>井沿是圓的，裡頭沒有水。你往下看，看見的是海的「裡側」——一層一層的潮，像翻開的書頁。</p>',
        '<p>井壁刻著一行字，被水波磨得發亮：</p>',
        '<p class="dialogue">「伸手進來。你推一下，海就換一個方向。」</p>',
        '<p>井沿縫裡，卡著一粒會發光的東西，像凝住的一滴光。</p>'
      ],
      textReturn:[
        '<p>潮井安靜地等著。海現在是'+TIDE_LABEL[state.tide]+'。</p>'
      ],
      choices:[
        {text:'把手伸進井裡，推動潮汐', action:function(){
          /* 循環：平 → 漲 → 退 → 平 */
          var order=['still','high','low'];
          var idx=order.indexOf(state.tide);
          state.tide = order[(idx+1)%order.length];
          state.flags.d5_tidepushed = true;
          unlockAchievement('ach_d5_tidepushed');
          updateD5HUD();
          appendNarrative('<p class="inherit-note">井裡的潮頁翻了一頁。海在你腳邊換了方向——現在是「'+TIDE_LABEL[state.tide]+'」。</p>');
        }},
        {text:'解開井壁那道問題（潮井之問）', action:function(){
          if(state.flags.d5_well_solved){
            appendNarrative('<p class="action">井壁的字已經暗了。海的答案你早就知道。</p>');
            return;
          }
          openPuzzle('謎題 · 海的心跳',
            '井壁刻著：潮水晝夜，一漲一退。\n一個太陽日裡，海的心，總共搏動幾回？（輸入一個數字）',
            '2',
            function(ok){
              if(ok){
                state.flags.d5_well_solved = true;
                addEcho(1);
                addNote('d5_well','海的心跳','一漲，一退。一天兩回。海心在你手裡穩了一下。');
                appendNarrative('<p class="inherit-note">井壁的字亮了一下，又暗下去。一粒新的迴光粒落到你掌心（+1）。</p>');
              }else{
                appendNarrative('<p class="action">井裡的潮頁紋絲不動。你算錯了海的節奏。</p>');
              }
            },
            '一漲配一退，就是一次完整的呼吸。一天有幾次呼吸？');
        }},
        {text:'拾起井沿縫裡那粒凝住的光', action:function(){
          if(state.flags.d5_well_picked){ appendNarrative('<p class="action">井沿空了。</p>'); return; }
          state.flags.d5_well_picked = true;
          addEcho(1);
          appendNarrative('<p class="inherit-note">那是一粒迴光粒，溫溫的。你把它收進口袋（+1）。</p>');
        }},
        {text:'退回汐岸', next:'d5_shore'}
      ]
    };

    /* ===== 4. 退潮海床（低潮） ===== */
    SCENES.d5_seabed = {
      room:'≈', roomName:'海床', sceneId:'5-海床', mood:'melancholy', mapZone:'d5_seabed',
      text:[
        '<p>只有退潮時，這裡才露得出來。</p>',
        '<p>海床上立著兩扇門。一半還泡在水裡，門牌的位置被海藻吃掉了。它們不是給你走的——是你當初沒走的。</p>',
        '<p>再往低處，一座淹了一半的禮拜堂，屋頂露出水面，鐘樓歪著。鐘停了。</p>',
        '<p>沙裡埋著一點光。</p>'
      ],
      textReturn:[
        '<p>海床還是那兩扇半沉的門。潮水低低地伏著。</p>'
      ],
      choices:[
        {text:'推開左邊那扇：沒打出去的那通電話', next:'d5_door_unspoken', personality:{altruism:+3}},
        {text:'推開右邊那扇：岔路口沒轉進去的那條路', next:'d5_door_untaken', personality:{calm:+3}},
        {text:'走進那座淹了一半的禮拜堂', next:'d5_chapel', personality:{cautious:+2}},
        {text:'拾起沙裡埋著的那點光', action:function(){
          if(state.flags.d5_seabed_picked){ appendNarrative('<p class="action">沙已經空了。</p>'); return; }
          state.flags.d5_seabed_picked = true;
          addEcho(1);
          appendNarrative('<p class="inherit-note">一粒迴光粒。濕的，溫的（+1）。</p>');
        }},
        {text:'在海床低處坐下，不願回到岸上', next:'d5_end_tide', danger:true,
         personality:{cautious:-8}},
        {text:'退回汐岸', next:'d5_shore'}
      ]
    };

    /* ===== 5. 未說出口的門 ===== */
    SCENES.d5_door_unspoken = {
      room:'≈', roomName:'電話', sceneId:'5-海床·電話', mood:'melancholy',
      text:[
        '<p>門後不是房間。是一個你認得的傍晚。</p>',
        '<p>桌上一部老式電話，燈在閃。你知道它是誰——那個你很久沒聯絡的人。你當時拿起話筒，又放下了。</p>',
        '<p>這次你沒有放下。你撥了號。嘟——嘟——三聲之後，那頭接起來了。沒有責備，沒有抱怨，只是一個很平靜的聲音：「我一直在等你打來。」</p>',
        '<p>你說了該說的話。掛斷的時候，電話輕輕化進了海裡。</p>'
      ],
      onEnter:function(){ state.flags.d5_unspoken=true; checkUnchosen(); },
      choices:[
        {text:'回到海床', next:'d5_seabed'}
      ]
    };

    /* ===== 6. 沒走的那條路 ===== */
    SCENES.d5_door_untaken = {
      room:'≈', roomName:'岔路', sceneId:'5-海床·岔路', mood:'mystery',
      text:[
        '<p>門後是一個岔口。你站在當時猶豫過的那個角上。</p>',
        '<p>左邊那條，你走了。右邊那條，你沒轉。這次你轉了進去。</p>',
        '<p>路的盡頭沒有奇蹟，也沒有懲罰。只是另一種尋常：另一間辦公室，另一杯涼掉的咖啡，另一個一樣會累的你。原來選哪條，都會走到某個三點十七分。</p>',
        '<p>你笑了一下。這次不是苦笑。</p>'
      ],
      onEnter:function(){ state.flags.d5_untaken=true; checkUnchosen(); },
      choices:[
        {text:'回到海床', next:'d5_seabed'}
      ]
    };

    /* ===== 7. 沉鐘禮拜堂（謎題 P1） ===== */
    SCENES.d5_chapel = {
      room:'≈', roomName:'沉鐘', sceneId:'5-海床·鐘', mood:'mystery', mapZone:'d5_deep',
      text:[
        '<p>禮拜堂的長椅泡在水裡，聖壇上沒有十字架，掛著一面鏡子。</p>',
        '<p>鐘樓的鐘垂著，指針隨著海水輕輕晃。你走近——鐘面是溫的，指針停在某個你一輩子不會忘的時刻。</p>',
        '<p class="dialogue">「把你倒下的那個凌晨，說給海聽。」一個很遠的聲音說，「說對了，海就認得你。」</p>'
      ],
      textReturn:[
        '<p>鐘還是停在那個時刻。鏡子裡這次是你自己。</p>'
      ],
      choices:[
        {text:'把那個時間，輕聲說給鐘聽', action:function(){
          if(state.flags.d5_recognized){
            appendNarrative('<p class="action">鐘輕輕蕩了一下。海早就認得你了。</p>');
            return;
          }
          openPuzzle('謎題 · 沉鐘之時',
            '鐘停在你倒下的那個凌晨。\n屏幕右下角那個亮了六個小時的數字，你到最後一眼都記得。（格式：時:分）',
            '3:17',
            function(ok){
              if(ok){
                state.flags.d5_recognized = true;
                addEcho(1);
                addNote('d5_time','三點十七分','沉鐘認出了這個時間。整座禮拜堂安靜了一下，像鬆了口氣。');
                checkWatcher();
                appendNarrative('<p class="inherit-note">鐘溫溫地震了一下。水面上盪開一圈光——一粒迴光粒浮了上來（+1）。</p>');
              }else{
                appendNarrative('<p class="action">鐘涼了下去。海不認得這個時間。</p>');
              }
            },
            '質數分佈的曲線跑到第六個小時。你盯著那個數字，太久了。');
        }},
        {text:'回到海床', next:'d5_seabed'}
      ]
    };

    /* ===== 8. 浮光筏（高潮） ===== */
    SCENES.d5_raft = {
      room:'≈', roomName:'光筏', sceneId:'5-光筏', mood:'mystery', mapZone:'d5_raft',
      text:[
        '<p>只有漲潮時，這塊光才浮得起來。</p>',
        '<p>它不是木頭，是凝住的、會發光的浪。你站上去，它輕輕晃，不沉。</p>',
        '<p>海的盡頭，一座燈塔，一明一暗地掃。更近的地方，水面上站著一個人——看起來很像你。</p>',
        '<p>浪尖之間，卡著一粒光。</p>'
      ],
      textReturn:[
        '<p>光筏浮在漲起來的海上。燈塔還在掃。</p>'
      ],
      choices:[
        {text:'划向那座一明一暗的燈塔', next:'d5_lighthouse', personality:{calm:+3}},
        {text:'走近水面上那個「另一個你」', next:'d5_echo_self', personality:{cautious:+2}},
        {text:'拾起浪尖間那粒光', action:function(){
          if(state.flags.d5_raft_picked){ appendNarrative('<p class="action">浪尖空了。</p>'); return; }
          state.flags.d5_raft_picked = true;
          addEcho(1);
          appendNarrative('<p class="inherit-note">迴光粒落在掌心，暖的（+1）。</p>');
        }},
        {text:'退回汐岸', next:'d5_shore'}
      ]
    };

    /* ===== 9. 迴光燈塔（謎題 P2 / 存活結局分支） ===== */
    SCENES.d5_lighthouse = {
      room:'≈', roomName:'燈塔', sceneId:'5-燈塔', mood:'mystery', mapZone:'d5_deep',
      text:[
        '<p>燈塔的樓梯鏽了，但還能走。頂上的燈罩是裂的，光從縫裡漏出來，一道一道掃過海面。</p>',
        '<p>每掃一次，海就回一次聲。你靠在欄杆上數。</p>',
        '<p class="dialogue">「十三次迴聲。」一個很輕的聲音說，「其中三次是空的——那是你已經走完的路，不會再回頭。真正還在等你的迴聲，有幾次？」</p>'
      ],
      textReturn:[
        '<p>燈塔還在一明一暗。海的迴聲數過一次了。</p>'
      ],
      choices:[
        {text:'把那個數字說出來', action:function(){
          if(state.flags.d5_echoes){
            appendNarrative('<p class="action">海已經給過你答案。</p>');
            return;
          }
          openPuzzle('謎題 · 迴聲之數',
            '十三次迴聲，其中三次是空的——那是你已經走完、不會再回頭的路。\n真正還在等你的迴聲，有幾次？（輸入一個數字）',
            '10',
            function(ok){
              if(ok){
                state.flags.d5_echoes = true;
                addEcho(1);
                addNote('d5_echoes','迴聲之數','十三減三，等於十。十次迴聲還在等你。燈罩下多了一粒迴光（+1）。');
                checkWatcher();
                appendNarrative('<p class="inherit-note">燈光頓了一下，像認可了你。海面靜了，只餘十道很輕的回聲。</p>');
              }else{
                appendNarrative('<p class="action">迴聲亂了。你數錯了還剩幾次。</p>');
              }
            },
            '十三次裡，三次不會再回頭。剩下的，才是你還沒走的。');
        }},
        {text:'伸手把那盞裂燈，點得更亮一些', next:'d5_end_lighthouse',
         condition:function(){ return !!state.flags.d5_echoes; },
         personality:{altruism:+15}},
        {text:'回到光筏', next:'d5_raft'}
      ]
    };

    /* ===== 10. 另一個你（鏡像母題） ===== */
    SCENES.d5_echo_self = {
      room:'≈', roomName:'倒影', sceneId:'5-光筏·倒影', mood:'melancholy',
      text:[
        '<p>水面上那個人，和你長得一樣。但他站得比你鬆，手插在口袋裡，像沒什麼好輸的。</p>',
        '<p>他是你在岔路口選了另一條之後，長成的那個人。</p>',
        '<p class="dialogue">「不用對不起。」他先開口，「也不用羨慕。我那條路，一樣會卡在某個凌晨。只不過——我後來學會了在水裡呼吸。」</p>',
        '<p>他朝你伸出手，掌心里是一粒迴光粒。「拿著。倒帶的時候，用得上。」</p>'
      ],
      onEnter:function(){ if(!state.flags.d5_met_self){ state.flags.d5_met_self=true; addEcho(1); } },
      choices:[
        {text:'接過那粒光，點點頭', action:function(){
          appendNarrative('<p class="action">他笑了一下，沉進水裡，像一滴墨回到海。你們終於不必再比較了。</p>');
        }},
        {text:'回到光筏', next:'d5_raft'}
      ]
    };

    /* ===== 11. 海心之門（最終樞紐） ===== */
    SCENES.d5_deepgate = {
      room:'≈', roomName:'海心', sceneId:'5-海心', mood:'tension', mapZone:'d5_deep',
      text:[
        '<p>石階把你帶到海最深的地方。水在這裡不動，像一面垂直的鏡。</p>',
        '<p>鏡子中央有一道縫。縫後面，是所有你沒做完的事沉在一起的重量。</p>',
        '<p>水面上方，光透下來——那是你最初划向的那點。這裡，你可以選擇怎麼離開。</p>',
        '<p class="system-msg">你身上還有 '+state.echo+' 粒迴光。它能讓你倒帶，也能讓你走進最深的那道縫。</p>'
      ],
      textReturn:[
        '<p>海心安靜地立著。鏡縫裡，是你所有未說出口的時刻。</p>'
      ],
      choices:[
        {text:'深吸一口氣，向上浮，浮向那點光', next:'d5_end_breath', personality:{calm:+5}},
        {text:'與兩扇門後的自己和解，踏上石階上岸', next:'d5_end_return',
         condition:function(){ return state.flags.d5_unspoken && state.flags.d5_untaken; },
         personality:{altruism:+10}},
        {text:'水面漂來一隻紙貓，把它撈起來', next:'d5_papercat', personality:{altruism:+3}},
        {text:'把所有迴光粒倒出來，強行倒回落水前那一刻', next:'d5_end_loop', danger:true,
         condition:function(){ return (state.echo||0)>0; }, personality:{cautious:-15}},
        {text:'走進鏡子中央那道最深的縫', next:'d5_end_true',
         condition:function(){
           return state.flags.d5_unspoken && state.flags.d5_untaken &&
                  state.flags.d5_recognized && state.flags.d5_echoes &&
                  state.flags.d5_cat && (state.echo||0)>=2;
         },
         personality:{calm:+15}},
        {text:'退回汐岸，再走一趟', next:'d5_shore'}
      ]
    };

    /* ===== 12. 紙貓（紙貓母題，真結局前提） ===== */
    SCENES.d5_papercat = {
      room:'≈', roomName:'紙貓', sceneId:'5-海心·紙貓', mood:'melancholy',
      text:[
        '<p>一隻紙摺的小貓，從深處漂上來。摺得很拙劣，角對角，邊對邊——是孩子的手藝。</p>',
        '<p>你認得它。也許是在某張空床的床腳邊，也許是在某個你以為早就放下的地方。它一路漂到這片海，身上一個角都沒皺。</p>',
        '<p>你把它從水裡撈起來，瀝乾。它輕輕蹭了蹭你的掌心。</p>'
      ],
      onEnter:function(){
        state.flags.d5_cat = true;
        if(!hasItem('paper_cat')){
          addItem('paper_cat','紙摺的小貓','摺得很拙劣。它從很深的地方漂上來，身上一個角都沒皺。');
        }
        addNote('d5_cat','紙貓','它跟著你漂過了四扇門。這次，你把它撈起來了。');
      },
      choices:[
        {text:'回到海心', next:'d5_deepgate'}
      ]
    };

    /* ===== 結局一：沉到底（death_） ===== */
    SCENES.d5_end_drown = {
      room:'—', roomName:'沉', sceneId:'5-結局·沉', mood:'terror',
      text:[
        '<p>你放鬆了身子。</p>',
        '<p>沒有嗆水，沒有恐慌。海溫溫地托著你，一點一點往下。上方那點光越來越遠。</p>',
        '<p>你想：原來不掙扎，是這樣的安靜。</p>'
      ],
      onEnter:function(){
        setTimeout(function(){
          triggerEnding('death_drown','沉到底',
            '你放棄了划水。海收容了你，像收容所有沒走完的路——溫柔、安靜、不會再醒。這片海從此多了一道不冒泡的影子。',
            '死亡結局 · 沉沒');
        }, 900);
      },
      choices:[]
    };

    /* ===== 結局二：被潮水吞沒（bad_） ===== */
    SCENES.d5_end_tide = {
      room:'≈', roomName:'漲', sceneId:'5-結局·吞', mood:'tension',
      text:[
        '<p>你在海床低處坐下，不想動。</p>',
        '<p>然後你感覺到水在漲。開始是漫過膝蓋，接著是腰，是肩。你賴著不走——也許是懶，也許是覺得哪裡都一樣。</p>',
        '<p>等你想起該起來的時候，海床已經回到了水下。那兩扇門，關上了。</p>'
      ],
      onEnter:function(){
        setTimeout(function(){
          triggerEnding('bad_tide','漲潮',
            '你賴在退潮的海床上，忘記潮水會回來。它把你連同那兩扇未選的門，一起蓋了回去。海不會等人準備好。',
            '壞結局 · 吞沒');
        }, 900);
      },
      choices:[]
    };

    /* ===== 結局三：在海裡呼吸（normal_） ===== */
    SCENES.d5_end_breath = {
      room:'≈', roomName:'浮', sceneId:'5-結局·呼吸', mood:'safe',
      text:[
        '<p>你深吸一口氣——奇怪的是，在水裡，你居然吸得到。</p>',
        '<p>原來那個「另一個你」說的是真的：人是可以學會在海裡呼吸的。不是逃出去，是學會和這片收容你遺憾的海，一起待著。</p>',
        '<p>你慢慢上浮，浮到那點光裡。</p>'
      ],
      onEnter:function(){
        V4.markDungeonCleared(5);
        setTimeout(function(){
          triggerEnding('normal_breath','在海裡呼吸',
            '你沒有逼自己立刻上岸。你學會了在這片收容未竟之事的海裡呼吸——沉下去，再浮上來，不急。後來你發現，人不一定要上岸，也能活。',
            '普通結局 · 呼吸');
        }, 900);
      },
      choices:[]
    };

    /* ===== 結局四：點燈為後來者引路（survive_） ===== */
    SCENES.d5_end_lighthouse = {
      room:'≈', roomName:'點燈', sceneId:'5-結局·燈', mood:'safe', mapZone:'d5_deep',
      text:[
        '<p>你把那盞裂燈，轉得更亮了一些。</p>',
        '<p>光掃過海面的時候，你看見遠處有好幾個影子，正往下沉。它們看見了光，停住了，開始朝這邊轉。</p>',
        '<p>你不是為自己點的燈。你是為下一批沉進來、還在慌的人。</p>'
      ],
      onEnter:function(){
        V4.markDungeonCleared(5);
        setTimeout(function(){
          triggerEnding('survive_lighthouse','點燈的人',
            '你在海心頂上把燈撥亮，為那些剛沉進來、還沒學會呼吸的人照出一道方向。你活下來了，還順手給後來者留了一條光。',
            '逃過一劫 · 點燈');
        }, 900);
      },
      choices:[]
    };

    /* ===== 結局五：與未選之路和解（normal_） ===== */
    SCENES.d5_end_return = {
      room:'≈', roomName:'上岸', sceneId:'5-結局·和', mood:'safe',
      text:[
        '<p>你走上那道石階。</p>',
        '<p>那通電話你打過了，那條路你走過了。它們沒有把你的人生改寫——它們只是，終於不再在你背後發出聲音。</p>',
        '<p>你回頭看了一眼海。海平靜地伏著，像一本闔上的書。</p>'
      ],
      onEnter:function(){
        V4.markDungeonCleared(5);
        setTimeout(function(){
          triggerEnding('normal_return','上岸',
            '你回去看過那兩扇沒推的門。它們後面沒有更好，也沒有更壞，只是另一條路。你從水裡走出來，在沙上坐了很久。腳邊的沙，乾了一塊。',
            '普通結局 · 和解');
        }, 900);
      },
      choices:[]
    };

    /* ===== 結局六：用盡迴光倒帶（death_） ===== */
    SCENES.d5_end_loop = {
      room:'—', roomName:'倒帶', sceneId:'5-結局·循環', mood:'tension',
      text:[
        '<p>你把口袋裡所有的迴光粒，一把倒進了海心。</p>',
        '<p>水開始往回走。浪退回去，鐘倒著蕩，那通電話自己掛斷了，那條路退回岔口。</p>',
        '<p>你看見自己，又回到了入水的那一刻。你想：這次我一定不會選錯。</p>',
        '<p>可是迴光粒用完了。你被困在這一秒裡，無限地、重新往下沉。</p>'
      ],
      onEnter:function(){
        setTimeout(function(){
          triggerEnding('death_loop','無限倒帶',
            '你用盡迴光粒，想把一切倒回落水前。但倒帶不能改寫你——只能讓你無限重溫那一刻。你把自己活成了一個迴圈，沒有盡頭。',
            '死亡結局 · 循環');
        }, 900);
      },
      choices:[]
    };

    /* ===== 結局七：真結局（hidden_） ===== */
    SCENES.d5_end_true = {
      room:'≈', roomName:'迴光', sceneId:'5-結局·真', mood:'safe', mapZone:'d5_deep',
      text:[
        '<p>你走進鏡子中央那道最深的縫。</p>',
        '<p>縫後面不是黑暗。是光——所有你沒選的路、沒說的話、沒撈起的紙貓，在這裡全都化成了很淡的光。它們沒有被浪磨掉，只是在等你來看一眼。</p>',
        '<p>你口袋裡的紙貓輕輕跳下來，落在光裡，安靜地坐下。那個另一個你，也站在光裡，朝你最後一次揮手，然後淡了。</p>',
        '<p>你學會了在海裡呼吸，也點過一盞燈。這片收容遺憾的海，終於為你漲起一道溫的潮，把你托了起來。</p>',
        '<p class="dialogue">「原來，未選擇的路，也值得被看完。」那個很遠的聲音說。</p>'
      ],
      onEnter:function(){
        V4.markDungeonCleared(5);
        unlockAchievement('ach_d5_true');
        setTimeout(function(){
          triggerEnding('hidden_echo','迴光之海',
            '你看完了兩扇未選的門，解開沉鐘與迴聲，撈起紙貓，留著足夠的光走進海心。海沒有把你留下。你轉身往回游的時候，身後那些沒走過的路，一條一條，安靜地滅了。',
            '隱藏結局 · 真');
        }, 1100);
      },
      choices:[]
    };

  }
});

/* ============================================================
 * 機制層：潮汐 HUD 注入 + 迴溯（goToScene 包裝）
 * ============================================================ */
function d5Active(){ return currentDungeonId===5 && typeof state!=='undefined' && state; }

/* 更新潮汐/迴光 HUD */
function updateD5HUD(){
  if(typeof $!=='function') return;
  var tideEl=$('d5-tide-label'), echoEl=$('d5-echo-count'), rwBtn=$('d5-rewind-btn');
  var box=$('d5-status');
  if(!box) return;
  if(!d5Active()){ box.style.display='none'; return; }
  box.style.display='';
  if(tideEl) tideEl.textContent=TIDE_LABEL[state.tide]||'平潮';
  if(echoEl) echoEl.textContent=(state.echo||0);
  if(rwBtn){
    var sc=SCENES[state.currentScene];
    var isEnding=!sc||!sc.choices||sc.choices.length===0;
    var can=!!(state.trail&&state.trail.length)&&(state.echo>0)&&!isEnding;
    rwBtn.disabled=!can;
  }
}
window.updateD5HUD=updateD5HUD;

/* 迴溯：消耗 1 粒迴光，回到上一場景 */
window.d5Rewind=function(){
  if(!d5Active()) return;
  var trail=state.trail||[];
  var sc=SCENES[state.currentScene];
  if(sc && sc.choices && sc.choices.length===0){ showToast('這裡已經是結局，無法迴溯'); return; }
  if(trail.length===0){ showToast('前面沒有可以倒帶的路'); return; }
  if((state.echo||0)<=0){ showToast('迴光粒用盡了'); return; }
  var prev=trail.pop();
  state.echo--;
  unlockAchievement('ach_d5_rewind');
  window.__d5rewinding=true;
  try{ goToScene(prev); }finally{ window.__d5rewinding=false; }
  showToast('迴溯 — 剩餘 '+(state.echo)+' 粒');
  updateD5HUD();
};

/* 注入 HUD（引導後執行一次） */
V5.onBoot(function(){
  try{
    var bar=document.querySelector('.status-bar');
    if(bar && !$('d5-status')){
      var box=document.createElement('div');
      box.className='status-item d5-status';
      box.id='d5-status';
      box.style.display='none';
      box.innerHTML =
        '<span class="d5-tide-chip"><svg class="d5-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 8c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2"/><path d="M2 14c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2"/></svg>潮汐 <span id="d5-tide-label">平潮</span></span>'+
        '<span class="d5-echo-chip"><svg class="d5-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>迴光 <span class="status-val" id="d5-echo-count">3</span></span>'+
        '<button type="button" class="d5-rewind-btn" id="d5-rewind-btn" onclick="d5Rewind()" title="消耗 1 粒迴光，回到上一場景">迴溯</button>';
      bar.appendChild(box);
    }
    /* 包裝 goToScene：維護迴溯足跡 + 刷新 HUD */
    if(typeof window.goToScene==='function' && !window.__d5gtsWrapped){
      window.__d5gtsWrapped=true;
      var _gts=window.goToScene;
      window.goToScene=function(id){
        try{
          if(currentDungeonId===5 && state && !window.__d5rewinding){
            var sc=SCENES&&SCENES[id];
            var isEnding=!sc||!sc.choices||sc.choices.length===0;
            var cur=state.currentScene;
            if(!isEnding && cur && cur!==id){
              state.trail=state.trail||[];
              if(state.trail[state.trail.length-1]!==cur){
                state.trail.push(cur);
                if(state.trail.length>24) state.trail.shift();
              }
            }
          }
        }catch(e){}
        _gts.apply(this,arguments);
        try{ updateD5HUD(); }catch(e){}
      };
    }
    updateD5HUD();
  }catch(e){ if(window.console)console.warn('d5 HUD 注入失敗',e); }
});

})();

/* ===== 40-systems.js ===== */
/* ============================================================
 * 無盡之門 · v5.0 系統模組 40
 *  - 系統 A：傳承之印（多周目強化，通關獲印、裝備 3 枚、持久化）
 *  - 系統 B：迴光遺物圖鑑（經 V5.registerStoryPack 注入 8 件隱藏遺物）
 *  - 系統 C：命令面板（Ctrl/Cmd+K，模糊搜尋全域動作）
 *  - 系統 D：旅者統計（選擇數、死亡、時長、性格雷達、門扉完成率）
 *  - 系統 E：高級主題與字體（amber / jade / 仿宋）
 * 純增量：只透過 V5.registerSystem / V5.registerStoryPack / V5.addAchievements。
 * ============================================================ */
(function(){
'use strict';
if(!window.V5) return;

/* ---------- 工具 ---------- */
function lsGet(k){ try{return localStorage.getItem(k);}catch(e){return null;} }
function lsSet(k,v){ try{localStorage.setItem(k,v);}catch(e){} }
function lsJSON(k,def){
  try{ var v=JSON.parse(localStorage.getItem(k)); if(v==null) return def; return v; }
  catch(e){ return def; }
}
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
});}
function $(id){ return document.getElementById(id); }
function el(html){ var d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }
function reduceMotion(){
  try{
    if(window.SETTINGS && SETTINGS.reducedMotion) return true;
    return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }catch(e){ return false; }
}

/* ---------- 持久化鍵 ---------- */
var LS_SEALS_OWN   = 'wuxian-v5-seals-owned';
var LS_SEALS_EQ    = 'wuxian-v5-seals-equipped';
var LS_RELICS      = 'wuxian-v5-relics';
var LS_STATS       = 'wuxian-v5-stats';
var LS_SEAL_PEND   = 'wuxian-v5-seal-pending';

var EQUIP_LIMIT = 3;

/* ============================================================
 * A. 傳承之印（Legacy Seals）
 * ============================================================ */
var SEALS=[
  {id:'seal_hp',   name:'銅皮印',   glyph:'皮', desc:'開局生命上限與生命 +25',
   apply:function(st){ st.maxHp=(st.maxHp||100)+25; st.hp=(st.hp||100)+25; }},
  {id:'seal_hint', name:'指引印',   glyph:'指', desc:'開局提示次數 +2',
   apply:function(){ bumpHints(2); }},
  {id:'seal_item', name:'行囊印',   glyph:'囊', desc:'開局自帶一件「舊銅鑰匙」（等同持有黃金鑰匙）',
   apply:function(st){ try{ addItem('v5_oldkey','舊銅鑰匙','前次旅程留下的銅鑰匙。可在需要黃金鑰匙的門鎖處通用。','等同黃金鑰匙'); if(st.inheritance)st.inheritance.golden_key=true; if(!hasItem('golden_key'))addItem('golden_key','黃金鑰匙','由行囊印共鳴喚出的舊鑰匙。'); }catch(e){} }},
  {id:'seal_revive', name:'不滅印', glyph:'生', desc:'本次遊玩死亡時自動回滿一次',
   apply:function(st){ st.v5Revive=true; }},
  {id:'seal_calm', name:'靜心印',   glyph:'靜', desc:'冷靜初始 +10',
   apply:function(st){ if(st.personality) st.personality.calm=Math.min(100,(st.personality.calm||50)+10); }},
  {id:'seal_time', name:'沙漏印',   glyph:'漏', desc:'倒計時篇章 +10 分鐘；否則 HP +10',
   apply:function(st){
     if(st.countdown!=null){ st.bonusCountdown=(st.bonusCountdown||0)+10; st.countdown+=10; }
     else{ st.maxHp=(st.maxHp||100)+10; st.hp=(st.hp||100)+10; }
   }}
];
function sealById(id){ for(var i=0;i<SEALS.length;i++) if(SEALS[i].id===id) return SEALS[i]; return null; }
function ownedSeals(){ return lsJSON(LS_SEALS_OWN,[]); }
function equippedSeals(){ return lsJSON(LS_SEALS_EQ,[]).filter(function(id){ return sealById(id); }); }
function addOwnedSeal(id){
  var s=ownedSeals(); if(s.indexOf(id)!==-1) return;
  s.push(id); lsSet(LS_SEALS_OWN,JSON.stringify(s));
}
function setEquipped(list){
  list=list.filter(function(id){ return sealById(id); }).slice(0,EQUIP_LIMIT);
  lsSet(LS_SEALS_EQ,JSON.stringify(list));
}
function bumpHints(n){
  /* v4 提示次數存在 wuxian-v4-hints-left */
  var cur=parseInt(lsGet('wuxian-v4-hints-left'),10);
  if(isNaN(cur)) cur=3;
  lsSet('wuxian-v4-hints-left', String(Math.min(9, cur+n)));
}

/* 套用已裝備印記（在 resetDungeonState 之後呼叫） */
function applyEquippedSeals(){
  var eq=equippedSeals();
  eq.forEach(function(id){
    var s=sealById(id); if(!s) return;
    try{ s.apply(state); }catch(e){}
  });
  if(typeof updateHP==='function'){ try{ updateHP(); }catch(e){} }
}

/* 死亡復活包裝 */
function wrapDamage(){
  if(window.damage && !window.damage.__v5){
    var orig=window.damage;
    window.damage=function(amount){
      /* 先讓原邏輯跑，但我們攔截致死 */
      if(state && state.v5Revive && (state.hp - amount) <= 0){
        state.v5Revive=false;
        state.hp=Math.min(100, (state.hp||0)+50); /* 回滿到 100 以下，但保證活 */
        state.hp=100;
        if(typeof updateHP==='function') updateHP();
        if(typeof showToast==='function') showToast('不滅印發動：你從死亡邊緣歸來');
        return;
      }
      return orig.apply(this,arguments);
    };
    window.damage.__v5=true;
  }
}

/* 通關（good ending）時給印選擇 */
var SealOffer={ modal:null, choices:[] };
function offerSealIfNewEnding(){
  /* 由 recordEnding 包裝呼叫；只在新 ending 且 type 為 survive_/normal_/hidden_ 時給 */
}
function showSealOffer(){
  var pool=SEALS.slice();
  /* 隨機 3 個 */
  var picks=[];
  var copy=pool.slice();
  while(picks.length<3 && copy.length){
    var i=Math.floor(Math.random()*copy.length);
    picks.push(copy.splice(i,1)[0]);
  }
  SealOffer.choices=picks;
  var html='<div class="v4-sub">這次旅程留下了印記。選擇一枚帶走（可在迴廊手札裝備）</div>';
  html+='<div class="v4-list">';
  picks.forEach(function(s,idx){
    html+='<button class="v4-row v5-seal-pick" data-id="'+s.id+'" style="width:100%;text-align:left;cursor:pointer">'+
      '<div class="v4-row-ic">'+s.glyph+'</div>'+
      '<div class="v4-row-main"><div class="v4-row-t">'+esc(s.name)+'</div>'+
      '<div class="v4-row-d">'+esc(s.desc)+'</div></div>'+
      '<span class="v4-chip gold">+'+ (ownedSeals().indexOf(s.id)!==-1?'重複':'新') +'</span>'+
    '</button>';
  });
  html+='</div>';
  SealOffer.body.innerHTML=html;
  SealOffer.modal.classList.add('show');
  SealOffer.body.querySelectorAll('.v5-seal-pick').forEach(function(b){
    b.addEventListener('click',function(){
      var id=b.getAttribute('data-id');
      addOwnedSeal(id);
      if(typeof showToast==='function') showToast('獲得印記 · '+sealById(id).name);
      closeSealOffer();
    });
  });
}
function closeSealOffer(){ if(SealOffer.modal) SealOffer.modal.classList.remove('show'); }

/* 印記管理彈窗 */
var SealMgr={ modal:null, body:null };
function openSealMgr(){
  renderSealMgr();
  SealMgr.modal.classList.add('show');
}
function closeSealMgr(){ if(SealMgr.modal) SealMgr.modal.classList.remove('show'); }
function renderSealMgr(){
  var owned=ownedSeals(), eq=equippedSeals();
  var html='<div class="v4-sub">已擁有 '+owned.length+' / '+SEALS.length+' · 同時裝備 '+eq.length+' / '+EQUIP_LIMIT+'</div>';
  html+='<div class="v4-list">';
  SEALS.forEach(function(s){
    var have=owned.indexOf(s.id)!==-1;
    var on=eq.indexOf(s.id)!==-1;
    html+='<div class="v4-row'+(have?' unlocked':' locked')+'">'+
      '<div class="v4-row-ic">'+(have?s.glyph:'？')+'</div>'+
      '<div class="v4-row-main"><div class="v4-row-t">'+(have?esc(s.name):'？？？')+'</div>'+
      '<div class="v4-row-d">'+esc(s.desc)+'</div></div>'+
      (have?(on?'<span class="v4-chip gold">已裝備</span>'+
        '<button class="v4-btn" data-unequip="'+s.id+'">卸 下</button>':
        '<button class="v4-btn" data-equip="'+s.id+'">裝 備</button>'):'<span class="v4-chip">通關獲得</span>')+
    '</div>';
  });
  html+='</div>';
  SealMgr.body.innerHTML=html;
  SealMgr.body.querySelectorAll('[data-equip]').forEach(function(b){
    b.addEventListener('click',function(){
      var id=b.getAttribute('data-equip');
      var cur=equippedSeals();
      if(cur.indexOf(id)!==-1) return;
      if(cur.length>=EQUIP_LIMIT){ if(typeof showToast==='function') showToast('裝備已達上限（'+EQUIP_LIMIT+'）'); return; }
      cur.push(id); setEquipped(cur); renderSealMgr();
    });
  });
  SealMgr.body.querySelectorAll('[data-unequip]').forEach(function(b){
    b.addEventListener('click',function(){
      var id=b.getAttribute('data-unequip');
      setEquipped(equippedSeals().filter(function(x){return x!==id;}));
      renderSealMgr();
    });
  });
}

/* ============================================================
 * B. 迴光遺物圖鑑
 * ============================================================ */
var RELICS={
  d1_watch:   {d:1,name:'旅館老懷錶', desc:'錶針停在凌晨 3:13。管理員說這是開店那一年的壞掉的東西。', found:false},
  d1_card:    {d:1,name:'13 號房舊門卡', desc:'塑膠磁條早已消磁。背面用鉛筆寫著：「別照鏡子」。', found:false},
  d2_blueprint:{d:2,name:'無聲圖書館藍圖', desc:'地下有一層被畫掉了。那層的名字被人用指甲摳過。', found:false},
  d2_bell:    {d:2,name:'三貓遺落的鈴鐺', desc:'沒有鈴聲。媛媛說這隻鈴鐺從來不會響。', found:false},
  d3_tag:     {d:3,name:'媛媛的病歷夾牌', desc:'塑膠套裡還壓著一朵乾掉的紙飛機。', found:false},
  d3_syringe:{d:3,name:'第十四格空針劑', desc:'周敏留下的。標籤上寫著「給自己」。', found:false},
  d4_key:    {d:4,name:'無號之鑰', desc:'鑰匙沒有齒。它開的不是鎖，是你願意記起的那段。', found:false},
  d4_letter:  {d:4,name:'門外寄來的信', desc:'沒有郵戳。收件人寫著你的名字。', found:false},
  d5_shell:   {d:5,name:'迴聲海螺', desc:'貼在耳邊能聽見十三次潮聲，其中三次是空的。', found:false},
  d5_compass: {d:5,name:'沉沒羅盤', desc:'指針永遠指向你沒走的那條岔路。表面覆著一層乾鹽。', found:false},
  d6_mug:     {d:6,name:'裂紋咖啡杯', desc:'停在凌晨 03:17 的馬克杯，杯底還留著溫熱的咖啡印。', found:false},
  d6_thesis:  {d:6,name:'質數分佈手稿末頁', desc:'背面用鉛筆寫著前七個質數：2, 3, 5, 7, 11, 13, 17。', found:false}
};
function foundRelics(){ return lsJSON(LS_RELICS,[]); }
function hasRelic(id){ return foundRelics().indexOf(id)!==-1; }
function grantRelic(id){
  if(!RELICS[id]) return;
  if(hasRelic(id)) return;
  var s=foundRelics(); s.push(id); lsSet(LS_RELICS,JSON.stringify(s));
  if(typeof showToast==='function') showToast('迴光遺物 · '+RELICS[id].name);
}

/* 註冊劇情包：在既有場景注入隱藏選項 */
function registerRelicPacks(){
  /* D1 質數旅館：lobby（櫃檯下）、corridor（13 號房門卡） */
  V5.registerStoryPack(1,{
    inject:[
      {into:'lobby', choice:{
        text:'蹲下身，瞧向櫃檯下的縫隙',
        condition:function(){ return !hasRelic('d1_watch'); },
        action:function(){ grantRelic('d1_watch'); if(typeof showToast==='function') showToast('你拾起一枚老懷錶'); }
      }},
      {into:'corridor', choice:{
        text:'在 13 號房門口蹲下，撿起縫裡的塑膠片',
        condition:function(){ return !hasRelic('d1_card'); },
        action:function(){ grantRelic('d1_card'); if(typeof showToast==='function') showToast('一張舊門卡'); }
      }}
    ]
  });
  /* D2 沉默圖書館：basement（藍圖）、bookshelf（貓鈴） */
  V5.registerStoryPack(2,{
    inject:[
      {into:'basement', choice:{
        text:'在潮濕的地上撿起一張捲曲的藍圖',
        condition:function(){ return !hasRelic('d2_blueprint'); },
        action:function(){ grantRelic('d2_blueprint'); if(typeof showToast==='function') showToast('你展開那張藍圖'); }
      }},
      {into:'bookshelf', choice:{
        text:'撫過書架底層，摸到一隻沒有聲音的鈴',
        condition:function(){ return !hasRelic('d2_bell'); },
        action:function(){ grantRelic('d2_bell'); if(typeof showToast==='function') showToast('一隻啞鈴'); }
      }}
    ]
  });
  /* D3 倒計時醫院：entrance（夾牌）、morgue（針劑） */
  V5.registerStoryPack(3,{
    inject:[
      {into:'entrance', choice:{
        text:'拾起候診椅上掉落的塑膠夾牌',
        condition:function(){ return !hasRelic('d3_tag'); },
        action:function(){ grantRelic('d3_tag'); if(typeof showToast==='function') showToast('夾牌上有媛媛的名字'); }
      }},
      {into:'morgue', choice:{
        text:'在第十四格旁，捏起那支空針劑',
        condition:function(){ return !hasRelic('d3_syringe'); },
        action:function(){ grantRelic('d3_syringe'); if(typeof showToast==='function') showToast('針筒還有余溫'); }
      }}
    ]
  });
  /* D4 無盡之間：prologue（無號鑰）、gate（信） */
  V5.registerStoryPack(4,{
    inject:[
      {into:'prologue', choice:{
        text:'在掌心裡掂一掂那把沒有齒的鑰',
        condition:function(){ return !hasRelic('d4_key'); },
        action:function(){ grantRelic('d4_key'); if(typeof showToast==='function') showToast('鑰匙微微發熱'); }
      }},
      {into:'gate', choice:{
        text:'拆開那封沒有郵戳的信',
        condition:function(){ return !hasRelic('d4_letter'); },
        action:function(){ grantRelic('d4_letter'); if(typeof showToast==='function') showToast('信上是你的名字'); }
      }}
    ]
  });
  /* D5 迴光之海：d5_lighthouse（迴聲海螺）、d5_seabed（沉沒羅盤） */
  V5.registerStoryPack(5,{
    inject:[
      {into:'d5_lighthouse', choice:{
        text:'拾起燈塔欄杆下那枚帶鹽霜的海螺（迴光遺物）',
        condition:function(){ return !hasRelic('d5_shell'); },
        action:function(){ grantRelic('d5_shell'); appendNarrative('<p class="inherit-note">你把海螺貼近耳邊，裡頭傳來十三次輕柔的潮聲。獲得遺物：迴聲海螺。</p>'); }
      }},
      {into:'d5_seabed', choice:{
        text:'從海床石縫裡撿起那枚停擺的舊羅盤（迴光遺物）',
        condition:function(){ return !hasRelic('d5_compass'); },
        action:function(){ grantRelic('d5_compass'); appendNarrative('<p class="inherit-note">銅殼已經被海水泡得發烏，指針卻還指著身後的門。獲得遺物：沉沒羅盤。</p>'); }
      }}
    ]
  });
}

/* 遺物圖鑑渲染（嵌入迴廊手札） */
function renderRelicGallery(body){
  var found=foundRelics();
  var total=Object.keys(RELICS).length;
  var html='<div class="v4-sub">迴光遺物 '+found.length+' / '+total+' · 散落在各扇門扉的隱藏角落</div>';
  /* 依門扉分組 */
  var groups=[1,2,3,4,5,6].filter(function(d){return Object.keys(RELICS).some(function(k){return RELICS[k].d===d;});});
  groups.forEach(function(d){
    var dname='';
    try{ dname=(typeof dungeons!=='undefined' && dungeons[d-1])?dungeons[d-1].name:('第 '+d+' 門扉'); }
    catch(e){ dname='第 '+d+' 門扉'; }
    html+='<div class="v4-sec" style="margin-top:.9rem">'+esc(dname)+'</div>';
    html+='<div class="v4-list">';
    Object.keys(RELICS).filter(function(k){return RELICS[k].d===d;}).forEach(function(k){
      var r=RELICS[k], got=found.indexOf(k)!==-1;
      html+='<div class="v4-row'+(got?' unlocked':' locked')+'">'+
        '<div class="v4-row-ic">'+(got?
          '<svg viewBox="0 0 24 24"><path d="M12 3l2.5 5.5L20 9.3l-4.2 3.8 1.2 5.9L12 16l-5 3 1.2-5.9L4 9.3l5.5-.8z"/></svg>':
          '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M9 10h6M9 14h4"/></svg>')+
        '</div>'+
        '<div class="v4-row-main"><div class="v4-row-t">'+(got?esc(r.name):'？？？')+'</div>'+
        '<div class="v4-row-d">'+(got?esc(r.desc):'在這扇門扉的某個角落，也許藏著一件與你有關的東西。')+'</div></div>'+
      '</div>';
    });
    html+='</div>';
  });
  body.innerHTML=html;
}

/* ============================================================
 * C. 命令面板（Command Palette）
 * ============================================================ */
var Palette={ modal:null, input:null, list:null, items:[], sel:0 };

function buildActions(){
  var A=[];
  A.push({id:'notebook',  label:'打開迴廊手札',  hint:'札', run:function(){ openV4Notebook(); }});
  A.push({id:'seals',    label:'打開印記管理',  hint:'印', run:function(){ openSealMgr(); }});
  A.push({id:'save',      label:'打開存檔面板',  hint:'存', run:function(){ try{ openSaveModal(); }catch(e){}}});
  A.push({id:'load',      label:'打開讀檔面板',  hint:'讀', run:function(){ try{ openLoadModal(); }catch(e){}}});
  A.push({id:'settings',   label:'打開設置',      hint:'設', run:function(){ try{ openSettings(); }catch(e){}}});
  A.push({id:'hub',      label:'返回迴廊',      hint:'離場', run:function(){ try{ backToHub(); }catch(e){}}});
  A.push({id:'pause',     label:'暫停 / 菜單',   hint:'選', run:function(){ try{ openPause(); }catch(e){}}});
  A.push({id:'inv',       label:'打開物品欄',    hint:'包', run:function(){ try{ toggleInventory(); }catch(e){}}});
  A.push({id:'map',       label:'打開地圖',      hint:'圖', run:function(){ try{ openMap(); }catch(e){}}});
  A.push({id:'ach',       label:'打開成就',      hint:'就', run:function(){ try{ openAchievements(); }catch(e){}}});
  A.push({id:'history',   label:'打開歷史',      hint:'史', run:function(){ try{ openHistory(); }catch(e){}}});
  A.push({id:'random',    label:'隨機選擇',      hint:'選擇區', run:function(){ randomChoice(); }});
  A.push({id:'theme_next', label:'切換下一套主題', hint:'外觀', run:function(){ cycleTheme(1); }});
  A.push({id:'theme_prev', label:'切換上一套主題', hint:'外觀', run:function(){ cycleTheme(-1); }});
  A.push({id:'font_next',  label:'切換下一種字體', hint:'排版', run:function(){ cycleFont(1); }});
  return A;
}
function openV4Notebook(){
  /* v4 把模態存在閉包裡；我們用頂欄「札」按鈕點一下 */
  var b=document.querySelector('.v4-nb-btn');
  if(b) b.click();
}
function randomChoice(){
  /* 點擊選擇區中一個可用選項 */
  var c=document.getElementById('choices');
  if(!c) return;
  var btns=c.querySelectorAll('button');
  var usable=[];
  btns.forEach(function(b){ if(!b.disabled && !b.classList.contains('v4-hint-entry')) usable.push(b); });
  if(!usable.length){ if(typeof showToast==='function') showToast('現在沒有可選的選項'); return; }
  var pick=usable[Math.floor(Math.random()*usable.length)];
  pick.click();
}
var THEMES=['default','blood','ice','forest','violet','amber','jade'];
var FONTS=['serif','kai','sans','mono','fang'];
function cycleTheme(dir){
  try{
    var cur=SETTINGS.theme||'default';
    var i=THEMES.indexOf(cur); if(i<0) i=0;
    i=(i+dir+THEMES.length)%THEMES.length;
    SETTINGS.theme=THEMES[i];
    document.body.setAttribute('data-theme',SETTINGS.theme);
    if(typeof saveSettings==='function') saveSettings(SETTINGS);
    if(typeof showToast==='function') showToast('主題 · '+SETTINGS.theme);
  }catch(e){}
}
function cycleFont(dir){
  try{
    var cur=SETTINGS.narrativeFont||'serif';
    var i=FONTS.indexOf(cur); if(i<0) i=0;
    i=(i+dir+FONTS.length)%FONTS.length;
    SETTINGS.narrativeFont=FONTS[i];
    document.body.setAttribute('data-font',SETTINGS.narrativeFont);
    if(typeof saveSettings==='function') saveSettings(SETTINGS);
    if(typeof showToast==='function') showToast('字體 · '+SETTINGS.narrativeFont);
  }catch(e){}
}

function fuzzyMatch(q,text){
  if(!q) return true;
  q=q.toLowerCase(); text=text.toLowerCase();
  if(text.indexOf(q)>=0) return true;
  /* 子序列比對 */
  var qi=0;
  for(var i=0;i<text.length && qi<q.length;i++){
    if(text[i]===q[qi]) qi++;
  }
  return qi===q.length;
}
function renderPaletteList(){
  var q=Palette.input.value.trim();
  var items=Palette._all.filter(function(a){ return fuzzyMatch(q,a.label)||fuzzyMatch(q,a.hint||'',a.label); });
  Palette.items=items.slice(0,20);
  Palette.sel=0;
  if(!Palette.items.length){
    Palette.list.innerHTML='<div class="v5-pal-empty">沒有符合的動作</div>';
    return;
  }
  Palette.list.innerHTML=Palette.items.map(function(a,i){
    return '<div class="v5-pal-item'+(i===0?' on':'')+'" data-i="'+i+'">'+
      '<span class="v5-pal-label">'+esc(a.label)+'</span>'+
      '<span class="v5-pal-hint">'+esc(a.hint||'')+'</span>'+
    '</div>';
  }).join('');
  Palette.list.querySelectorAll('.v5-pal-item').forEach(function(n){
    n.addEventListener('click',function(){
      var i=parseInt(n.getAttribute('data-i'),10);
      runItem(i);
    });
    n.addEventListener('mouseenter',function(){
      Palette.list.querySelectorAll('.v5-pal-item').forEach(function(x){x.classList.remove('on');});
      n.classList.add('on');
      Palette.sel=parseInt(n.getAttribute('data-i'),10);
    });
  });
}
function runItem(i){
  var a=Palette.items[i]; if(!a) return;
  closePalette();
  try{ a.run(); }catch(e){ console.error('命令面板動作失敗',e); }
}
function openPalette(){
  Palette._all=buildActions();
  Palette.input.value='';
  renderPaletteList();
  Palette.modal.classList.add('show');
  setTimeout(function(){ try{ Palette.input.focus(); Palette.input.select(); }catch(e){} },30);
}
function closePalette(){ if(Palette.modal) Palette.modal.classList.remove('show'); }

/* ============================================================
 * D. 旅者統計（Traveler Stats）
 * ============================================================ */
function loadStats(){
  var s=lsJSON(LS_STATS,{});
  return {
    choices:s.choices||0,
    deaths:s.deaths||0,
    sessions:s.sessions||0,
    playtimeMs:s.playtimeMs||0,
    persSums:s.persSums||{calm:0,altruism:0,cautious:0},
    persRuns:s.persRuns||0
  };
}
function saveStats(s){ lsSet(LS_STATS,JSON.stringify(s)); }
function bumpStats(patch){
  var s=loadStats();
  for(var k in patch) s[k]=(s[k]||0)+patch[k];
  saveStats(s);
}
function recordRunEnd(){
  /* 在結局時呼叫：把本局 personality 累計、時長累計 */
  try{
    var s=loadStats();
    s.sessions=(s.sessions||0)+1;
    if(state && state.personality){
      s.persSums.calm=(s.persSums.calm||0)+(state.personality.calm||50);
      s.persSums.altruism=(s.persSums.altruism||0)+(state.personality.altruism||50);
      s.persSums.cautious=(s.persSums.cautious||0)+(state.personality.cautious||50);
      s.persRuns=(s.persRuns||0)+1;
    }
    if(window.gameStartTime){
      s.playtimeMs=(s.playtimeMs||0)+Math.max(0,Date.now()-gameStartTime);
    }
    saveStats(s);
  }catch(e){}
}
function fmtDuration(ms){
  var s=Math.floor(ms/1000);
  var h=Math.floor(s/3600), m=Math.floor((s%3600)/60);
  if(h>0) return h+' 小時 '+m+' 分';
  if(m>0) return m+' 分鐘';
  return s+' 秒';
}

/* SVG 雷達圖（三軸：冷靜 / 利他 / 謹慎） */
function radarSVG(vals){
  /* vals: {calm, altruism, cautious} 0-100 */
  var size=180, cx=size/2, cy=size/2, R=62;
  var axes=[{k:'calm',label:'冷靜'},{k:'altruism',label:'利他'},{k:'cautious',label:'謹慎'}];
  function pt(angle,r){ return [cx+Math.cos(angle)*r, cy+Math.sin(angle)*r]; }
  /* 軸從 -90 度開始，每 120 度 */
  var pts=axes.map(function(a,i){
    var ang=(-90 + i*120) * Math.PI/180;
    return {ang:ang, a:a};
  });
  /* 網格 3 圈 */
  var rings='';
  [0.33,0.66,1].forEach(function(f){
    var p=pts.map(function(x){ return pt(x.ang, R*f).join(','); }).join(' ');
    rings+='<polygon points="'+p+'" fill="none" stroke="var(--border)" stroke-width=".5"/>';
  });
  /* 軸線 + 標籤 */
  var lines='', labels='';
  pts.forEach(function(x){
    var p=pt(x.ang,R);
    lines+='<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0]+'" y2="'+p[1]+'" stroke="var(--border)" stroke-width=".5"/>';
    var lp=pt(x.ang,R+16);
    labels+='<text x="'+lp[0]+'" y="'+lp[1]+'" text-anchor="middle" dominant-baseline="middle" fill="var(--text-dim)" font-size="9" font-family="var(--font-sans)">'+x.a.label+'</text>';
  });
  /* 數值多邊形 */
  var data=pts.map(function(x){
    var v=(vals[x.a.k]||50)/100;
    return pt(x.ang, R*v);
  });
  var dataStr=data.map(function(p){return p[0]+','+p[1];}).join(' ');
  return '<svg viewBox="0 0 '+size+' '+size+'" class="v5-radar" role="img" aria-label="人格傾向雷達">'+
    rings+lines+
    '<polygon points="'+dataStr+'" fill="var(--accent)" fill-opacity=".18" stroke="var(--accent)" stroke-width="1.2"/>'+
    labels+
  '</svg>';
}

function renderStats(body){
  var s=loadStats();
  var pers={calm:50,altruism:50,cautious:50};
  if(s.persRuns>0){
    pers.calm=Math.round(s.persSums.calm/s.persRuns);
    pers.altruism=Math.round(s.persSums.altruism/s.persRuns);
    pers.cautious=Math.round(s.persSums.cautious/s.persRuns);
  }
  /* 門扉完成率 */
  var endLog=(typeof getEndingLog==='function')?getEndingLog():[];
  var totals=(typeof ENDING_TOTALS!=='undefined')?ENDING_TOTALS:{};
  var dlist=(typeof dungeons!=='undefined')?dungeons:[];

  var html='<div class="v4-grid">'+
    '<div class="v4-stat"><span class="v4-stat-n">'+s.choices+'</span><span class="v4-stat-l">累計選擇</span></div>'+
    '<div class="v4-stat"><span class="v4-stat-n">'+s.deaths+'</span><span class="v4-stat-l">死亡次數</span></div>'+
    '<div class="v4-stat accent"><span class="v4-stat-n" style="font-size:1.05rem">'+fmtDuration(s.playtimeMs)+'</span><span class="v4-stat-l">遊玩時長</span></div>'+
    '<div class="v4-stat"><span class="v4-stat-n">'+s.sessions+'</span><span class="v4-stat-l">完整旅程</span></div>'+
  '</div>';

  html+='<div class="v4-sec" style="margin-top:1.2rem">人格傾向（跨局平均）</div>';
  html+='<div class="v5-pers-wrap">'+radarSVG(pers)+
    '<div class="v5-pers-bars">'+
      persBar('冷靜',pers.calm)+
      persBar('利他',pers.altruism)+
      persBar('謹慎',pers.cautious)+
    '</div></div>';

  html+='<div class="v4-sec" style="margin-top:1.2rem">各扇門扉完成率</div>';
  dlist.forEach(function(d){
    var t=totals[d.id]||0;
    var f=endLog.filter(function(e){return e.indexOf(String(d.id)+'|')===0;}).length;
    var p=t?Math.round(100*f/t):0;
    html+='<div class="v4-pbar-row" style="margin-bottom:.5rem">'+
      '<span style="min-width:6.5rem">'+esc(d.name)+'</span>'+
      '<div class="v4-bar"><i style="width:'+p+'%"></i></div>'+
      '<span class="v4-pbar-n">'+f+' / '+t+'</span></div>';
  });

  /* 遺物 + 印記完成度 */
  var relicTotal=Object.keys(RELICS).length;
  var relicGot=foundRelics().length;
  var sealTotal=SEALS.length;
  var sealGot=ownedSeals().length;
  html+='<div class="v4-grid" style="margin-top:1.1rem">'+
    '<div class="v4-stat"><span class="v4-stat-n">'+relicGot+' / '+relicTotal+'</span><span class="v4-stat-l">迴光遺物</span></div>'+
    '<div class="v4-stat"><span class="v4-stat-n">'+sealGot+' / '+sealTotal+'</span><span class="v4-stat-l">傳承之印</span></div>'+
  '</div>';

  body.innerHTML=html;
}
function persBar(label,v){
  return '<div class="v5-pbar">'+
    '<span class="v5-pbar-l">'+label+'</span>'+
    '<div class="v4-bar"><i style="width:'+v+'%"></i></div>'+
    '<span class="v5-pbar-n">'+v+'</span>'+
  '</div>';
}

/* ============================================================
 * E. 高級主題 / 字體（由 CSS 提供，這裡只把選項掛進設置面板）
 * ============================================================ */
function wrapSettings(){
  if(!window.renderSettings || window.renderSettings.__v5) return;
  var orig=window.renderSettings;
  window.renderSettings=function(){
    var r=orig.apply(this,arguments);
    try{
      var body=$('settings-body'); if(!body) return;
      /* 找到主題色那一行（包含五個 theme-swatch），在其列尾追加兩個 */
      var themeRow=body.querySelector('.theme-row');
      if(themeRow && !themeRow.querySelector('[data-theme="amber"]')){
        var a=document.createElement('button');
        a.className='theme-swatch'+((SETTINGS.theme==='amber')?' on':'');
        a.setAttribute('data-theme','amber');
        a.style.background='#d8a04a';
        a.title='琥珀';
        themeRow.appendChild(a);
        var j=document.createElement('button');
        j.className='theme-swatch'+((SETTINGS.theme==='jade')?' on':'');
        j.setAttribute('data-theme','jade');
        j.style.background='#6ab09a';
        j.title='青玉';
        themeRow.appendChild(j);
        /* 綁定點擊（原 renderSettings 的 querySelectorAll 在我們注入前已跑過） */
        [a,j].forEach(function(b){
          b.onclick=function(){
            SETTINGS.theme=b.getAttribute('data-theme');
            document.body.setAttribute('data-theme',SETTINGS.theme);
            if(typeof saveSettings==='function') saveSettings(SETTINGS);
            if(typeof renderSettings==='function') renderSettings();
            if($('game-screen') && $('game-screen').classList.contains('active')){
              if(SETTINGS.particlesEnabled!==false && typeof stopParticles==='function' && typeof startParticles==='function'){
                stopParticles(); startParticles();
              }
            }
          };
        });
      }
      /* 字體分段按鈕追加「仿宋」 */
      var segs=body.querySelectorAll('.seg');
      segs.forEach(function(seg){
        if(seg.querySelector('[data-font="fang"]')) return;
        /* 只在含 data-font 的那組追加 */
        if(!seg.querySelector('[data-font]')) return;
        var f=document.createElement('button');
        f.setAttribute('data-font','fang');
        f.textContent='仿';
        if(SETTINGS.narrativeFont==='fang') f.classList.add('on');
        f.onclick=function(){
          SETTINGS.narrativeFont='fang';
          document.body.setAttribute('data-font','fang');
          if(typeof saveSettings==='function') saveSettings(SETTINGS);
          if(typeof renderSettings==='function') renderSettings();
        };
        seg.appendChild(f);
      });
    }catch(e){}
    return r;
  };
  window.renderSettings.__v5=true;
}

/* ============================================================
 * 掛鉤：包裝既有全局函數
 * ============================================================ */
function wrapAll(){
  /* recordEnding：統計死亡、結束時長、新 good ending 給印 */
  if(window.recordEnding && !window.recordEnding.__v5){
    var orig=window.recordEnding;
    window.recordEnding=function(type,title){
      var before=endLogLen();
      var r=orig.apply(this,arguments);
      var after=endLogLen();
      var isNew=after>before;
      /* 死亡計數：death_ 或 bad_ */
      if(type && /^(death_|bad_)/.test(type)){
        bumpStats({deaths:1});
      }
      /* 結算本局時長 + 性格 */
      recordRunEnd();
      /* good ending 首次發現 → 給印選擇 */
      if(isNew && /^(survive_|normal_|hidden_)/.test(type||'')){
        setTimeout(function(){ try{ showSealOffer(); }catch(e){} }, 1200);
      }
      return r;
    };
    window.recordEnding.__v5=true;
  }
  function endLogLen(){
    try{ return (typeof getEndingLog==='function')?getEndingLog().length:0; }catch(e){ return 0; }
  }

  /* goToScene：統計選擇數 */
  if(window.goToScene && !window.goToScene.__v5){
    var og=window.goToScene;
    window.goToScene=function(k){
      bumpStats({choices:1});
      return og.apply(this,arguments);
    };
    window.goToScene.__v5=true;
  }

  /* resetDungeonState：套用印記 */
  if(window.resetDungeonState && !window.resetDungeonState.__v5){
    var ors=window.resetDungeonState;
    window.resetDungeonState=function(){
      var r=ors.apply(this,arguments);
      try{ applyEquippedSeals(); }catch(e){}
      return r;
    };
    window.resetDungeonState.__v5=true;
  }

  wrapDamage();
  wrapSettings();
}

/* ============================================================
 * 注入 UI：頂欄按鈕、迴廊手札新分頁、命令面板、印記彈窗
 * ============================================================ */
function buildUI(){
  /* 命令面板彈窗 */
  Palette.modal=el(
    '<div class="modal-overlay" id="v5-palette">'+
      '<div class="v4-card v5-pal-card">'+
        '<input type="text" id="v5-pal-input" class="v5-pal-input" placeholder="輸入指令或動作…（↑↓ 選擇，Enter 執行，Esc 關閉）" autocomplete="false" aria-label="命令面板">'+
        '<div id="v5-pal-list" class="v5-pal-list"></div>'+
      '</div>'+
    '</div>');
  document.body.appendChild(Palette.modal);
  Palette.input=Palette.modal.querySelector('#v5-pal-input');
  Palette.list=Palette.modal.querySelector('#v5-pal-list');
  Palette.input.addEventListener('input',renderPaletteList);
  Palette.input.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){ e.preventDefault(); Palette.sel=Math.min(Palette.items.length-1,Palette.sel+1); paintSel(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); Palette.sel=Math.max(0,Palette.sel-1); paintSel(); }
    else if(e.key==='Enter'){ e.preventDefault(); runItem(Palette.sel); }
    else if(e.key==='Escape'){ e.preventDefault(); closePalette(); }
  });
  Palette.modal.addEventListener('click',function(e){ if(e.target===Palette.modal) closePalette(); });
  function paintSel(){
    Palette.list.querySelectorAll('.v5-pal-item').forEach(function(n,i){
      n.classList.toggle('on', i===Palette.sel);
    });
    var on=Palette.list.querySelector('.v5-pal-item.on');
    if(on && on.scrollIntoView) on.scrollIntoView({block:'nearest'});
  }

  /* 印記選擇彈窗（通關獎勵） */
  SealOffer.modal=el(
    '<div class="modal-overlay" id="v5-seal-offer">'+
      '<div class="v4-card wide">'+
        '<h3>傳 承 之 印</h3>'+
        '<div id="v5-seal-offer-body"></div>'+
        '<div class="v4-actions end"><button class="v4-btn" id="v5-seal-offer-skip">略 過</button></div>'+
      '</div>'+
    '</div>');
  document.body.appendChild(SealOffer.modal);
  SealOffer.body=SealOffer.modal.querySelector('#v5-seal-offer-body');
  SealOffer.modal.addEventListener('click',function(e){ if(e.target===SealOffer.modal) closeSealOffer(); });
  SealOffer.modal.querySelector('#v5-seal-offer-skip').addEventListener('click',closeSealOffer);

  /* 印記管理彈窗 */
  SealMgr.modal=el(
    '<div class="modal-overlay" id="v5-seal-mgr">'+
      '<div class="v4-card wide">'+
        '<h3>印 記 管 理</h3>'+
        '<div id="v5-seal-mgr-body"></div>'+
        '<div class="v4-actions end"><button class="v4-btn" id="v5-seal-mgr-close">關 閉</button></div>'+
      '</div>'+
    '</div>');
  document.body.appendChild(SealMgr.modal);
  SealMgr.body=SealMgr.modal.querySelector('#v5-seal-mgr-body');
  SealMgr.modal.querySelector('#v5-seal-mgr-close').addEventListener('click',closeSealMgr);
  SealMgr.modal.addEventListener('click',function(e){ if(e.target===SealMgr.modal) closeSealMgr(); });

  /* 頂欄：命令面板按鈕（低調，快捷鍵圖標） */
  var bar=document.querySelector('.top-bar-right');
  if(bar && !bar.querySelector('.v5-cmd-btn')){
    var b=document.createElement('button');
    b.className='icon-btn v5-cmd-btn';
    b.title='命令面板（Ctrl/Cmd+K）';
    b.setAttribute('aria-label','命令面板');
    b.innerHTML='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/></svg>';
    b.addEventListener('click',openPalette);
    bar.insertBefore(b, bar.firstChild);
  }

  /* 全域快捷鍵 Ctrl/Cmd+K */
  document.addEventListener('keydown',function(e){
    var mod=(e.ctrlKey||e.metaKey);
    if(mod && (e.key==='k'||e.key==='K')){
      e.preventDefault();
      if(Palette.modal.classList.contains('show')) closePalette();
      else openPalette();
    }
    /* Esc 關閉所有 v5 彈窗 */
    if(e.key==='Escape'){
      closePalette(); closeSealOffer(); closeSealMgr();
    }
  });

  /* 把新分頁注入迴廊手札 */
  injectNotebookTabs();
}

function injectNotebookTabs(){
  /* 等 v4 手札 DOM 就緒（v4 系統先 init） */
  var tryInject=function(){
    var nb=document.getElementById('v4-notebook');
    if(!nb){ setTimeout(tryInject,200); return; }
    var tabs=nb.querySelector('.v4-tabs');
    var body=nb.querySelector('#v4-nb-body');
    if(!tabs || !body) return;
    if(tabs.querySelector('[data-t="v5-relics"]')) return;

    /* 遺物分頁 */
    var t1=document.createElement('button');
    t1.className='v4-tab'; t1.setAttribute('data-t','v5-relics');
    t1.textContent='遺 物';
    tabs.appendChild(t1);
    /* 統計分頁 */
    var t2=document.createElement('button');
    t2.className='v4-tab'; t2.setAttribute('data-t','v5-stats');
    t2.textContent='統 計';
    tabs.appendChild(t2);
    /* 印記分頁 */
    var t3=document.createElement('button');
    t3.className='v4-tab'; t3.setAttribute('data-t','v5-seals');
    t3.textContent='印 記';
    tabs.appendChild(t3);

    tabs.addEventListener('click',function(e){
      var b=e.target.closest('.v4-tab'); if(!b) return;
      var t=b.getAttribute('data-t');
      if(t!=='v5-relics' && t!=='v5-stats' && t!=='v5-seals') return;
      /* 切換 on */
      tabs.querySelectorAll('.v4-tab').forEach(function(x){x.classList.remove('on');});
      b.classList.add('on');
      if(t==='v5-relics') renderRelicGallery(body);
      else if(t==='v5-stats') renderStats(body);
      else if(t==='v5-seals') renderSealMgrInline(body);
    });
  };
  tryInject();
}

/* 在迴廊手札裡渲染印記（不是獨立彈窗） */
function renderSealMgrInline(body){
  var owned=ownedSeals(), eq=equippedSeals();
  var html='<div class="v4-sub">已擁有 '+owned.length+' / '+SEALS.length+' · 同時裝備 '+eq.length+' / '+EQUIP_LIMIT+
    '（裝備後下次踏入門扉即生效）</div>';
  html+='<div class="v4-list">';
  SEALS.forEach(function(s){
    var have=owned.indexOf(s.id)!==-1;
    var on=eq.indexOf(s.id)!==-1;
    html+='<div class="v4-row'+(have?' unlocked':' locked')+'">'+
      '<div class="v4-row-ic">'+(have?s.glyph:'？')+'</div>'+
      '<div class="v4-row-main"><div class="v4-row-t">'+(have?esc(s.name):'？？？')+'</div>'+
      '<div class="v4-row-d">'+esc(s.desc)+'</div></div>'+
      (have?(on?'<span class="v4-chip gold">已裝備</span>'+
        '<button class="v4-btn" data-eq="off:'+s.id+'">卸 下</button>':
        '<button class="v4-btn" data-eq="on:'+s.id+'">裝 備</button>'):'<span class="v4-chip">通關獲得</span>')+
    '</div>';
  });
  html+='</div>';
  body.innerHTML=html;
  body.querySelectorAll('[data-eq]').forEach(function(b){
    b.addEventListener('click',function(){
      var v=b.getAttribute('data-eq');
      var off=v.indexOf('off:')===0, id=v.split(':')[1];
      var cur=equippedSeals();
      if(off){ cur=cur.filter(function(x){return x!==id;}); }
      else{
        if(cur.indexOf(id)!==-1) return;
        if(cur.length>=EQUIP_LIMIT){ if(typeof showToast==='function') showToast('裝備已達上限'); return; }
        cur.push(id);
      }
      setEquipped(cur);
      renderSealMgrInline(body);
    });
  });
}

/* ============================================================
 * 註冊
 * ============================================================ */
V5.registerStoryPackRelics=registerRelicPacks; V5.RELICS=RELICS; V5.grantRelic=function(id){grantRelic(id);};

V5.registerSystem('v5-systems-40',function(){
  registerRelicPacks();
  /* V5 的故事包要套用到既有第 1 扇門-4（V4 包裝只會跑 V4.applyStory） */
  [1,2,3,4].forEach(function(id){
    var key='buildScenes'+id;
    var orig=window[key];
    if(!orig || orig.__v5rel) return;
    window[key]=function(){
      var r=orig.apply(this,arguments);
      try{ if(window.V5 && V5.applyV5Story) V5.applyV5Story(id); }catch(e){}
      return r;
    };
    window[key].__v5rel=true;
  });
  buildUI();
  wrapAll();
  /* 初始化主題/字體（若 SETTINGS 已存 v5 值） */
  try{
    if(SETTINGS.theme) document.body.setAttribute('data-theme',SETTINGS.theme);
    if(SETTINGS.narrativeFont) document.body.setAttribute('data-font',SETTINGS.narrativeFont);
  }catch(e){}
});

/* 成就追加：遺物/印記相關（掛到第 4 扇門，因為它是 v5 主門扉） */
V5.addAchievements(4,[
  {id:'v5_first_relic', name:'初次迴光', desc:'找到第一件迴光遺物'},
  {id:'v5_relic_all',   name:'拾光者',   desc:'集齊全部八件迴光遺物'},
  {id:'v5_first_seal',  name:'鑄印',     desc:'獲得第一枚傳承之印'},
  {id:'v5_seal_all',    name:'滿印之人', desc:'集齊全部六枚傳承之印'}
]);

/* 遺物/印記成就的即時判定（每次找到/獲得時檢查） */
V5.onBoot(function(){
  /* 包裝 grantRelic / addOwnedSeal 以觸發成就 */
  var _gr=grantRelic;
  grantRelic=function(id){
    var before=foundRelics().length;
    _gr(id);
    var after=foundRelics().length;
    if(after>before){
      if(after>=1 && typeof unlockAchievement==='function') unlockAchievement('v5_first_relic');
      if(after>=Object.keys(RELICS).length && typeof unlockAchievement==='function') unlockAchievement('v5_relic_all');
    }
  };
  var _ao=addOwnedSeal;
  addOwnedSeal=function(id){
    var before=ownedSeals().length;
    _ao(id);
    var after=ownedSeals().length;
    if(after>before){
      if(after>=1 && typeof unlockAchievement==='function') unlockAchievement('v5_first_seal');
      if(after>=SEALS.length && typeof unlockAchievement==='function') unlockAchievement('v5_seal_all');
    }
  };
});

})();

/* ===== 50-audio.js ===== */
/* ============================================================
 * 無盡之門 v5.0 · 音頻擴充模組（50-audio.js，純增量）
 * 在 v4（30-audio.js）之上，為第五扇門「迴光之海」追加：
 *   1) 1 首基底主題（潮汐）+ 2 首 mood 變奏（深淵 / 空靈）
 *      —— 以 currentDungeonId===5 切換，包覆 applyMood/startBGM 做平滑交叉淡入淡出，
 *         不與場景 key 綁定，避免每個場景重啟。
 *   2) 環境音層：低強度 Web Audio 合成 drone / 浪聲，可隨「潮汐」狀態微妙起伏；
 *      離開門扉 / 結局正確停止清理（純 Web Audio LFO，不用外部音檔、無裸 interval）。
 *   3) 新 UI 音效：印記裝備 / 遺物取得 / 命令面板開啟與選取 / 統計，
 *      沿用既有 SETTINGS.uiSfx 開關（預設關閉）。
 *   4) 結局收束音：複用 v4 分類（好 / 壞 / 隱藏 / 真），第五扇門離場即停乾淨，不疊音。
 *   5) 新曲目自動進入 v4 既有「點唱機」：試聽 / 指定 / 跟隨門扉（擴充同一 themes 表）。
 * 全部沿用既有 AudioContext、音量 / 靜音 / BGM / UI 音效閘門；首次進入無聲，手勢喚醒。
 * ============================================================ */
(function(){
'use strict';
if(window.V5Audio && V5Audio.__v50) return;
if(!window.V4Audio){ /* v4 音頻層不存在：仍掛載空 API，避免其他模組呼叫爆炸 */
  window.V5Audio={__v50:true, sfx:function(){}, setTide:function(){},
    debug:function(){return {note:'no v4 audio'};}};
  return;
}

/* ---------- D5 主題：直接擴充 v4 同一張 themes 表（活參考，點唱機自動列出） ---------- */
/* 與既有門扉區隔：潮汐=開放五度＋海浪般緩慢呼吸；深淵=次低頻暗部、無心跳；空靈=高處稀疏水珠鐘鈴 */
var THEMES=V4Audio.themes;
THEMES['5-tide']={name:'迴光之海 · 潮汐', sub:'第五扇門 基底主題（開放五度・潮來潮往）',
  chords:[[82.4,123.5],[98,146.8],[73.4,110],[65.4,98]],
  o1:'triangle', o2:'sine', lp:430, lfo:0.04, interval:13000,
  pluck:[659.25,783.99,987.77,880]};
THEMES['5-abyss']={name:'迴光之海 · 深淵', sub:'第五扇門 恐懼段落（次低頻暗湧）',
  chords:[[41.2,51.9],[43.65,55],[38.9,46.2],[49,58.3]],
  o1:'sawtooth', o2:'sine', lp:175, lfo:0.035, interval:9000};
THEMES['5-ethereal']={name:'迴光之海 · 空靈', sub:'第五扇門 神秘段落（高處水珠鐘鈴）',
  chords:[[110,164.8],[98,146.8],[130.8,196],[87.3,130.8]],
  o1:'sine', o2:'triangle', lp:660, lfo:0.05, interval:15000,
  pluck:[880,1046.5,1174.7,1318.5,1568]};

/* ---------- 內部狀態 ---------- */
var d5={bgm:null, timer:null, themeKey:null, chordIdx:0, preview:false};
var env={nodes:null, tideLFO:null, tideLFOGain:null, waveGain:null, waveFilter:null, subGain:null, tide:0.5};
var uiGain=null;   /* 新 UI 音效專用 Gain（掛 audioMasterGain 之後），沿用 v4 作法 */

function ac(){ return audioCtx||null; }
function ready(){ return !!(typeof SETTINGS!=='undefined' && SETTINGS.soundEnabled && audioCtx && audioCtx.state==='running'); }
function master(){ return (typeof audioMasterGain!=='undefined')?audioMasterGain:null; }
function bgmVol(){ return (SETTINGS.bgmVolume!=null?SETTINGS.bgmVolume:25)/100*0.1; }
function envVol(){ return (SETTINGS.ambientVolume!=null?SETTINGS.ambientVolume:30)/100*0.35; }
/* 是否由本模組接管 BGM（第五扇門且點唱機未手動指定曲目） */
function d5OwnsAudio(){
  if((typeof currentDungeonId==='undefined')||currentDungeonId!==5)return false;
  var ov=SETTINGS.jukeboxTheme;
  if(ov && ov!=='auto')return false;   /* 使用者已指定 → 交回 v4 引擎 */
  return true;
}

/* ---------- D5 mood → 主題（與場景 key 解耦） ---------- */
function d5PickTheme(){
  var m=(typeof currentMood==='string')?currentMood:'mystery';
  if(m==='terror'||m==='tension'||m==='dread')return '5-abyss';
  if(m==='mystery'||m==='calm')return '5-ethereal';
  return '5-tide';                      /* melancholy / 預設：潮汐基底 */
}

/* ---------- D5 BGM 引擎（寫法對齊 v4：雙振盪→低通→呼吸 LFO→master） ---------- */
function d5StartBGM(allowPreview){
  if(!audioCtx||!SETTINGS.soundEnabled)return;
  if(!SETTINGS.bgmEnabled && !allowPreview)return;
  if(audioCtx.state!=='running')return;
  if(d5.bgm)return;
  var key=d5PickTheme(); var th=THEMES[key]; if(!th)return;
  try{
    var osc1=audioCtx.createOscillator(); osc1.type=th.o1;
    var osc2=audioCtx.createOscillator(); osc2.type=th.o2||'sine';
    var filter=audioCtx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=th.lp; filter.Q.value=0.7;
    var gain=audioCtx.createGain(); gain.gain.value=0;
    var lfo=audioCtx.createOscillator(); lfo.frequency.value=th.lfo;
    var lfoGain=audioCtx.createGain(); lfoGain.gain.value=120;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(audioMasterGain);
    d5.chordIdx=0;
    function setChord(){
      if(!d5.bgm)return;
      var ch=th.chords[d5.chordIdx%th.chords.length];
      osc1.frequency.setTargetAtTime(ch[0],audioCtx.currentTime,2.5);
      osc2.frequency.setTargetAtTime(ch[1],audioCtx.currentTime,2.5);
      if(th.pluck && (d5.chordIdx%2===1)){
        var f=th.pluck[Math.floor(Math.random()*th.pluck.length)];
        try{
          var pn=audioCtx.createOscillator(); pn.type='sine'; pn.frequency.value=f;
          var pg=audioCtx.createGain(); var pnow=audioCtx.currentTime;
          pg.gain.setValueAtTime(0.0001,pnow);
          pg.gain.exponentialRampToValueAtTime(0.012,pnow+0.03);
          pg.gain.exponentialRampToValueAtTime(0.0001,pnow+1.8);
          pn.connect(pg); pg.connect(gain);
          pn.start(pnow); pn.stop(pnow+1.9);
        }catch(e){}
      }
      d5.chordIdx++;
    }
    setChord();
    osc1.start(); osc2.start(); lfo.start();
    gain.gain.linearRampToValueAtTime(bgmVol(),audioCtx.currentTime+3);
    d5.bgm={osc1:osc1,osc2:osc2,filter:filter,gain:gain,lfo:lfo,lfoGain:lfoGain,themeKey:key};
    d5.themeKey=key;
    d5.timer=setInterval(setChord,th.interval);
  }catch(e){ d5.bgm=null; d5.themeKey=null; }
}
function d5StopBGM(fadeSec){
  fadeSec=fadeSec||1.2;
  if(!d5.bgm)return;
  if(d5.timer){clearInterval(d5.timer);d5.timer=null;}
  try{
    var now=audioCtx.currentTime;
    d5.bgm.gain.gain.cancelScheduledValues(now);
    d5.bgm.gain.gain.setTargetAtTime(0,now,fadeSec/3);
    var nodes=d5.bgm;
    setTimeout(function(){ try{nodes.osc1.stop();nodes.osc2.stop();nodes.lfo.stop();}catch(e){} },fadeSec*1000+200);
  }catch(e){}
  d5.bgm=null; d5.themeKey=null;
}
function d5UpdateBGMVolume(){
  if(d5.bgm&&audioCtx)d5.bgm.gain.gain.setTargetAtTime(bgmVol(),audioCtx.currentTime,0.5);
}
/* mood 變化：主題不同才平滑切換，避免每個場景重啟；引擎因故缺席則自療式重啟 */
function d5MoodChange(){
  if(d5.preview)return;
  if(!d5.bgm){
    /* 引擎未運轉（如切背景分頁 context 被暫停後恢復）：門扉5 內且 BGM 開啟時補啟 */
    if(currentDungeonId===5 && SETTINGS.bgmEnabled && d5OwnsAudio()){
      d5AutoReadTide(); d5StartEnv(); d5StartBGM(false);
    }
    return;
  }
  var desired=d5PickTheme();
  if(desired!==d5.themeKey){
    d5StopBGM(0.9);
    setTimeout(function(){ if(!d5.preview)d5StartBGM(false); },700);
  }
}

/* ---------- 環境音層：合成浪聲（濾波噪聲漲落）＋ 低頻 drone ---------- */
function d5BuildNoiseBuffer(){
  var len=audioCtx.sampleRate*2;
  var buf=audioCtx.createBuffer(1,len,audioCtx.sampleRate);
  var d=buf.getChannelData(0);
  for(var i=0;i<len;i++)d[i]=Math.random()*2-1;
  return buf;
}
function d5StartEnv(){
  if(!ready())return;
  if(!audioMasterGain)return;
  if(env.nodes)return;
  try{
    /* 浪聲：循環噪聲 → 低通 → 漲落 Gain */
    var noise=audioCtx.createBufferSource(); noise.buffer=d5BuildNoiseBuffer(); noise.loop=true;
    var nFilter=audioCtx.createBiquadFilter(); nFilter.type='lowpass'; nFilter.frequency.value=480; nFilter.Q.value=0.6;
    var waveGain=audioCtx.createGain(); waveGain.gain.value=0;
    noise.connect(nFilter); nFilter.connect(waveGain); waveGain.connect(audioMasterGain);
    /* 漲落 LFO：讓浪聲音量如潮汐般起伏 */
    var tideLFO=audioCtx.createOscillator(); tideLFO.type='sine'; tideLFO.frequency.value=0.07;
    var tideLFOGain=audioCtx.createGain(); tideLFOGain.gain.value=envVol()*0.5;
    tideLFO.connect(tideLFOGain); tideLFOGain.connect(waveGain.gain);
    /* 低頻 drone：沉穩的海床共鳴 */
    var sub=audioCtx.createOscillator(); sub.type='sine'; sub.frequency.value=50;
    var subGain=audioCtx.createGain(); subGain.gain.value=0;
    sub.connect(subGain); subGain.connect(audioMasterGain);
    /* 淡入 */
    waveGain.gain.setTargetAtTime(envVol()*0.5,audioCtx.currentTime,3);
    subGain.gain.setTargetAtTime(envVol()*0.4,audioCtx.currentTime,3);
    noise.start(); sub.start(); tideLFO.start();
    env.nodes={noise:noise,sub:sub,tideLFO:tideLFO,waveGain:waveGain,waveFilter:nFilter,
               tideLFOGain:tideLFOGain,subGain:subGain};
    d5ApplyTide();   /* 套用目前潮汐狀態 */
  }catch(e){ env.nodes=null; }
}
/* 潮汐 0..1：越高潮 → 浪來得越快、濾波越亮；低潮則平靜 */
function d5ApplyTide(){
  if(!env.nodes||!audioCtx)return;
  var t=Math.max(0,Math.min(1,env.tide||0.5));
  try{
    env.tideLFO.frequency.setTargetAtTime(0.05+t*0.10,audioCtx.currentTime,2.0);          /* 0.05~0.15 Hz */
    env.waveFilter.frequency.setTargetAtTime(360+t*360,audioCtx.currentTime,2.0);          /* 360~720 Hz */
    env.tideLFOGain.gain.setTargetAtTime(envVol()*(0.35+t*0.5),audioCtx.currentTime,2.0);   /* 漲幅隨潮位 */
  }catch(e){}
}
function d5SetTide(x){
  var n=parseFloat(x); if(isNaN(n))return;
  env.tide=n; d5ApplyTide();
}
function d5StopEnv(fadeSec){
  fadeSec=fadeSec||1.5;
  if(!env.nodes)return;
  var nodes=env.nodes; env.nodes=null;
  try{
    var now=audioCtx.currentTime;
    nodes.waveGain.gain.cancelScheduledValues(now);
    nodes.waveGain.gain.setTargetAtTime(0,now,fadeSec/3);
    nodes.subGain.gain.cancelScheduledValues(now);
    nodes.subGain.gain.setTargetAtTime(0,now,fadeSec/3);
    setTimeout(function(){
      try{nodes.noise.stop();nodes.sub.stop();nodes.tideLFO.stop();}catch(e){}
      try{nodes.waveGain.disconnect();nodes.waveFilter.disconnect();nodes.subGain.disconnect();nodes.tideLFOGain.disconnect();}catch(e){}
    },fadeSec*1000+200);
  }catch(e){}
}
function d5StopAll(){ d5StopBGM(1.2); d5StopEnv(1.5); }

/* 防禦性自動讀取 state 內的潮汐欄位（若門扉模組有寫），不依賴外部呼叫 */
function d5AutoReadTide(){
  try{
    if(typeof state==='undefined'||!state)return;
    if(typeof state.tide==='number'){env.tide=state.tide;}
    else if(state.flags && typeof state.flags.tide==='number'){env.tide=state.flags.tide;}
    else if(typeof state.tideLevel==='number'){env.tide=state.tideLevel;}
    d5ApplyTide();
  }catch(e){}
}

/* ---------- 新 UI 音效（沿用 SETTINGS.uiSfx，預設關閉） ---------- */
function blip(o){
  if(!ready())return;
  if(!uiGain){
    if(!audioCtx||!audioMasterGain)return;
    try{ uiGain=audioCtx.createGain(); uiGain.gain.value=1; uiGain.connect(audioMasterGain); }catch(e){ uiGain=null; return; }
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
    osc.connect(gn); gn.connect(uiGain);
    osc.start(now); osc.stop(now+o.dur+0.05);
  }catch(e){}
}
function v5Sfx(name){
  if(!SETTINGS.uiSfx)return;
  try{
    if(name==='sigilEquip'){       /* 印記裝備：低—中兩段沉實扣合 */
      blip({type:'sine',f0:300,f1:240,dur:0.09,vol:0.025});
      blip({type:'sine',f0:520,t:0.08,dur:0.12,vol:0.022});
    }else if(name==='relic'){      /* 遺物取得：溫和上行三音 */
      [440,554.37,659.25].forEach(function(f,i){ blip({type:'sine',f0:f,t:i*0.09,dur:0.4,vol:0.028}); });
    }else if(name==='paletteOpen'){ /* 命令面板開啟：空靈雙音 */
      blip({type:'sine',f0:520,dur:0.1,vol:0.02}); blip({type:'sine',f0:780,t:0.08,dur:0.14,vol:0.02});
    }else if(name==='paletteSelect'){ /* 命令面板選取：清脆確認 */
      blip({type:'sine',f0:660,f1:920,dur:0.07,vol:0.025});
    }else if(name==='stats'){       /* 統計：輕柔面板tick */
      blip({type:'sine',f0:480,dur:0.06,vol:0.018}); blip({type:'sine',f0:360,t:0.05,dur:0.08,vol:0.015});
    }
  }catch(e){}
}

/* ---------- 包覆既有函數（純增量，不刪減 v4 / base 行為） ---------- */
var _sb=startBGM;
var _stb=stopBGM;               /* v4 的 stopBGM（=v4StopBGM），直接呼叫可收 v4 引擎而不遞迴 */
startBGM=function(){
  if(d5OwnsAudio()){
    /* 進入第五扇門：收乾 v4 BGM（避免 v4 pickTheme 誤播 '1-a' 造成疊音），再啟 D5 主題＋潮汐環境音 */
    try{_stb();}catch(e){}
    d5AutoReadTide();
    d5StartEnv();
    d5StartBGM(false);
  }else{
    d5StopAll();
    _sb.apply(this,arguments);
  }
};
stopBGM=function(){ d5StopAll(); _stb.apply(this,arguments); };
var _ubv=updateBGMVolume;
updateBGMVolume=function(){ d5UpdateBGMVolume(); try{d5ApplyTide();}catch(e){} _ubv.apply(this,arguments); };

var _am=applyMood;
applyMood=function(m){
  var r=_am.apply(this,arguments);
  try{ if(currentDungeonId===5)d5MoodChange(); }catch(e){}
  return r;
};

/* 跨門扉轉場：離開第五扇門即停乾淨（end/backToHub 已有 stopAmbient→stopBGM，此處兜底） */
if(typeof enterDungeon!=='undefined'){
  var _ed=enterDungeon;
  enterDungeon=function(id){
    if(currentDungeonId===5 && Number(id)!==5)d5StopAll();
    return _ed.apply(this,arguments);
  };
}

/* 結局：複用 v4 分類，並保險地收乾 D5 音層（base stopAmbient→stopBGM 已會收，雙保險不疊音） */
var _te=triggerEnding;
triggerEnding=function(type,title,desc,reward){
  var r=_te.apply(this,arguments);
  try{ d5StopAll(); d5.preview=false; }catch(e){}
  return r;
};

/* ---------- 委派：帶 [data-v5-sfx] 的元素點擊即播放對應新音效 ---------- */
document.addEventListener('click',function(e){
  var t=e.target; if(!t||!t.closest)return;
  var el=t.closest('[data-v5-sfx]');
  if(el)v5Sfx(el.getAttribute('data-v5-sfx'));
});

/* ---------- 點唱機協調：開時暫停 D5 層（交給 v4 試聽引擎），關時依門扉恢復 ---------- */
function jukeboxVisibility(open){
  if(open){
    d5.preview=true; d5StopBGM(0.4); /* 環境浪聲保留低強度亦可；這裡連同收乾，避免與試聽和諧波疊加 */
    d5StopEnv(0.6);
  }else{
    d5.preview=false;
    var inGame=$('game-screen')&&$('game-screen').classList.contains('active');
    if(inGame && d5OwnsAudio() && SETTINGS.bgmEnabled){
      d5AutoReadTide(); d5StartEnv(); d5StartBGM(false);
    }
  }
}
function watchJukebox(){
  var m=document.getElementById('v4-jukebox-modal');
  var obs=new MutationObserver(function(){
    if(!m)return;
    jukeboxVisibility(m.classList.contains('show'));
  });
  if(m){ obs.observe(m,{attributes:true,attributeFilter:['class']}); }
}
/* v4 點唱機彈窗是延遲建立的：用 body 層觀察其出現，再掛 class 觀察 */
var bodyObs=new MutationObserver(function(){
  var m=document.getElementById('v4-jukebox-modal');
  if(m){ watchJukebox(); tagJukeRows(); bodyObs.disconnect(); }
});
bodyObs.observe(document.body,{childList:true,subtree:true});

/* 點唱機列表：替第五扇門曲目列加視覺標記（不動 v4 渲染邏輯） */
function tagJukeRows(){
  var list=document.getElementById('v4-juke-list'); if(!list)return;
  list.querySelectorAll('.v4-row').forEach(function(row){
    var pick=row.querySelector('[data-v4pick]');
    if(pick && /^5-/.test(pick.getAttribute('data-v4pick')))row.classList.add('v5-tide-row');
  });
}
var listObs=new MutationObserver(function(){ tagJukeRows(); });
function watchJukeList(){
  var list=document.getElementById('v4-juke-list');
  if(list)listObs.observe(list,{childList:true,subtree:true});
}
/* list 在彈窗建立後才存在，延遲掛 */
setTimeout(function(){ try{watchJukeList();}catch(e){} },1500);

/* ---------- 對外 API ---------- */
window.V5Audio={
  __v50:true,
  sfx:v5Sfx,                 /* 新系統呼叫：sfx('sigilEquip'|'relic'|'paletteOpen'|'paletteSelect'|'stats') */
  setTide:d5SetTide,         /* 門扉5：setTide(0..1) 驅動浪聲起伏 */
  themes:THEMES,
  debug:function(){ return {dungeon:currentDungeonId, owns:d5OwnsAudio(),
    bgm:d5.themeKey, bgmNodes:!!d5.bgm, env:!!env.nodes, tide:env.tide, preview:d5.preview}; }
};
})();

