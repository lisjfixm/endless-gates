
/* ============================================================
 * HUB 邏輯（入口頁 index.html）
 * ============================================================ */
var dungeons = [
  { id: 1, name: "質數旅館", index: "第 一 扇 門", bgNum: "13", tagline: "一座只有質數房間的旅館。每一扇門後面都是一個房間，每一個房間裡都有一個謎題。你需要在黎明之前找到出口。", clearedKey: "wuxian-first-cleared" },
  { id: 2, name: "沉默圖書館", index: "第 二 扇 門", bgNum: "靜", tagline: "一座沒有聲音的圖書館。書架上的每一本書，都記錄著一個人的一生。規則只有一條：不能大聲說話。", clearedKey: "wuxian-second-cleared" },
  { id: 3, name: "倒計時醫院", index: "第 三 扇 門", bgNum: "60:00", tagline: "一座廢棄的醫院。每個受困者都有一個倒計時，時間到了會重置。你需要在時間耗盡之前找到出口——用藥品，用病歷，用記憶。", clearedKey: "wuxian-third-cleared" }
];
var ENDING_TOTALS = { 1: 17, 2: 22, 3: 13 };
var ACH_TOTAL = 29;
var currentIndex = 0;
var previewIndex = -1;

var INHERIT_LABELS={
  suwan_survived:'蘇晚生還',golden_key:'持有黃金鑰匙',mirror_defeated:'已擊敗鏡像',
  traded_admin:'與旅館管理員交易過',alone_escape:'獨自逃生',lost_limb:'失去肢體',
  admin_guest:'圖書館管理員認出你',chen_survived:'陳姐生還',xiaoyu_survived:'小宇生還',
  laozhou_survived:'老周生還',yuanyuan_carried:'攜帶媛媛',memory_kept:'保留記憶',memory_deleted:'刪除記憶'
};
function enterHub(){
  /* 上下分屏過場：遮蓋→切換到hub→金色切割線→裂開露出 */
  var so=document.getElementById('split-overlay');
  var topEl=so?so.querySelector('.split-top'):null;
  var botEl=so?so.querySelector('.split-bottom'):null;
  if(!so||!topEl||!botEl){doEnterHub();return;}
  topEl.style.clipPath=buildZigzagClip(true);
  botEl.style.clipPath=buildZigzagClip(false);
  setZigzagLines();
  so.classList.remove('open');
  so.classList.add('active','no-title');
  void so.offsetWidth;
  /* 在分屏遮蓋下切換到hub */
  doEnterHub();
  /* 金色切割線→分屏 */
  playCutLineAndSplit(so);
}
function doEnterHub(){
  document.getElementById('hub-title-screen').classList.add('hidden');
  document.getElementById('hub-screen').classList.add('show');
  render();
}
function backToTitle(){
  var so=document.getElementById('split-overlay');
  /* 隱藏hub */
  $('hub-screen').classList.remove('show');
  $('hub-title-screen').classList.add('hidden');
  /* 重置開場狀態 */
  window._openingDone=false;
  if(window._openingTimers)window._openingTimers.forEach(clearTimeout);
  /* 半屏和線先在屏幕外（open狀態），再閉合到中間 */
  setZigzagLines();
  so.classList.remove('reverse','reverse-ready','drawing');
  so.classList.add('active','no-title','open');
  void so.offsetWidth;
  /* 閉合：半屏和線從屏幕外移到中間 */
  so.classList.remove('open');
  /* 1.4s閉合完成後：線從左到右擦除，標題從左到右顯現 */
  setTimeout(function(){
    so.classList.remove('no-title');
    so.classList.add('reverse-ready');
    void so.offsetWidth;
    so.classList.add('reverse');
    /* 0.8s擦除/顯現完成後，重置為正常開場狀態 */
    setTimeout(function(){
      so.classList.remove('reverse','reverse-ready');
      window._openingTimers=[setTimeout(splitSkipAndEnter,10000)];
    },800);
  },1400);
}
function isCleared(id){
  var key=id===1?'wuxian-first-cleared':(id===2?'wuxian-second-cleared':'wuxian-third-cleared');
  return localStorage.getItem(key)==='true';
}
function getClearedCount(){ return dungeons.filter(function(d){return isCleared(d.id);}).length; }
function isUnlocked(id){
  if(id===1) return true;
  if(id===2) return isCleared(1);
  if(id===3) return isCleared(2);
  return false;
}
/* getEndingLog / getAchList 的正式定義見下方（使用 ENDINGS_KEY / ACH_KEY 常量），
   此處不重複定義，避免兩份邏輯漂移。 */
function getDefaultIndex(){
  return 0;
}
function renderDots(){
  var c=document.getElementById('switch-dots');c.innerHTML='';
  dungeons.forEach(function(d,i){
    var dot=document.createElement('button');
    dot.className='switch-dot'+(i===currentIndex?' active':'')+(!isUnlocked(d.id)?' locked-dot':'');
    dot.onclick=function(){currentIndex=i;render();};
    c.appendChild(dot);
  });
}
var bgNumTimer=null;
function startBgNumAnimation(dungeonId){
  if(bgNumTimer){clearInterval(bgNumTimer);bgNumTimer=null;}
  var el=$('bg-num');
  el.classList.remove('float');
  if(SETTINGS.bgAnim===false){
    el.textContent=(dungeonId===1?'13':(dungeonId===2?'靜':'60:00'));
    return;
  }
  if(dungeonId===1){
    var primes=[2,3,5,7,11,13];
    var pi=0;
    el.textContent=primes[pi];
    bgNumTimer=setInterval(function(){
      pi=(pi+1)%primes.length;
      el.textContent=primes[pi];
    },400);
  }else if(dungeonId===2){
    el.textContent='靜';
    el.classList.add('float');
  }else if(dungeonId===3){
    var times=['60:00','45:00','30:00','15:00','0:00'];
    var ti=0;
    el.textContent=times[ti];
    bgNumTimer=setInterval(function(){
      ti=(ti+1)%times.length;
      el.textContent=times[ti];
    },600);
  }
}
function render(){
  var d=dungeons[currentIndex];
  var unlocked=isUnlocked(d.id);
  var cleared=isCleared(d.id);
  startBgNumAnimation(d.id);
  $('dungeon-index').textContent=d.index;
  $('dungeon-name').textContent=d.name;
  $('dungeon-name').className='dungeon-name'+(unlocked?'':' locked');
  $('dungeon-tagline').textContent=d.tagline;
  $('lock-badge').style.display=unlocked?'none':'inline-flex';
  var dot=$('status-dot'),txt=$('status-text');
  if(cleared){dot.className='status-dot cleared';txt.className='status-text cleared';txt.textContent='已 通 關';}
  else if(!unlocked){dot.className='status-dot locked';txt.className='status-text locked';var _ordMap={2:'一',3:'二',4:'三',5:'四',6:'五'};txt.textContent='未 通 關 第 '+(_ordMap[d.id]||String(d.id-1))+' 扇 門';}
  else{dot.className='status-dot available';txt.className='status-text available';txt.textContent='未 通 關';}
  var btn=$('enter-btn');
  btn.disabled=!unlocked;
  btn.textContent=unlocked?'推 門 進 入':'未 解 鎖';
  $('prev-btn').disabled=currentIndex===0;
  $('next-btn').disabled=currentIndex===dungeons.length-1;
  $('progress-text').textContent=getClearedCount()+' / '+dungeons.length;
  $('ach-text').textContent=getAchList().length+' / '+ACH_TOTAL;
  var total=ENDING_TOTALS[d.id]||0;
  var found=getEndingLog().filter(function(e){return e.indexOf(String(d.id)+'|')===0;}).length;
  $('ending-rate').innerHTML='已發現結局 <span>'+found+' / '+total+'</span>';
  var inh=loadInheritance();
  var chips=Object.keys(INHERIT_LABELS).filter(function(k){return inh[k];}).map(function(k){return '<span class="inherit-chip">'+INHERIT_LABELS[k]+'</span>';});
  $('inherit-strip').innerHTML=chips.length?chips.join(''):'<span class="inherit-empty">尚無來自前扇門扉的殘留</span>';
  renderDots();
}
function switchDungeon(dir){
  var next=currentIndex+dir;
  if(next<0||next>=dungeons.length)return;
  currentIndex=next;render();
}
function enterDungeonFromHub(){
  var d=dungeons[currentIndex];
  if(!isUnlocked(d.id)){showPreview();return;}
  enterDungeon(d.id,true);
}
function showPreview(){
  var d=dungeons[currentIndex];
  $('preview-title').textContent=d.name;
  $('preview-subtitle').textContent='無 盡 迴 廊 · '+d.index;
  var texts={
    1:['「13號房。」','一座只有質數房間的旅館。每一扇門後面都是一個房間，每一個房間裡都有一個謎題。','你需要在黎明之前找到出口。旅館裡住著各懷鬼胎的房客，走廊盡頭的鏡子裡藏著另一個你。','算得出門牌是一回事，分得清誰在說謊，是另一回事。','你的選擇將影響後續門扉——誰生還，誰留下，誰成為你未來路上的籌碼。'],
    2:['「請保持安靜。」','一座沒有聲音的圖書館。書架上的每一本書，都記錄著一個人的一生。','規則只有一條：不能大聲說話。違者，被書架吞噬。','誰都不確定自己到底算不算出聲。管理員只給你三個問題，別問錯。','通關第一扇門後解鎖。你的選擇將影響第二扇門的開局。'],
    3:['「時間正在流逝。」','一座廢棄的醫院。每個受困者都有一個倒計時，時間到了會重置——失去所有物品和記憶。','時間一點一滴在走。藥品能給你買幾分鐘，病歷裡埋著真相。','醫院的地下二樓有一個「活的」東西，在吃人的記憶。它在等它的爸爸。','通關第二扇門後解鎖。你的選擇將影響最終結局。'],
    4:['「門後沒有規則。」','穿過旅館、圖書館與醫院之後，你第一次站到迴廊本身的「心臟」。','三扇舊門安靜地立在四周，大門前守門人提著一盞沒有火的燈。','這裡沒有倒計時，也沒有獵殺者。只有一個問題：走過這一切之後，你要如何面對那個凌晨三點十七分？','通關第三扇門後解鎖。集齊九枚迴廊碎片可開啟真結局「無盡之門」。'],
    5:['「海會漲，也會退。」','穿過迴廊的心臟後，你沉入收容所有「未選擇的路」與遺忘時刻的幽暗之海。','潮汐在這裡一進一退：退潮露出半沉的海床與未推開的門，漲潮浮起通往燈塔的光筏。','消耗迴光粒可以倒帶上一個選擇，但倒帶也有盡頭。','通關第四扇門後解鎖。'],
    6:['「03:17 之後的一分鐘。」','迴廊最頂層的觀測站——凌晨三點十七分與三點十八分之間的夾縫。','無數台監視器播放著每一扇門扉、每一次輪迴的截面，桌上的冷咖啡還維持著傾倒的瞬間。','調校頻率、解開質數曲線偏離的最後一頁，決定是永遠留在觀測席，還是推開通往 03:18 的破曉之門。','通關第五扇門後解鎖。']
  };
  var arr=texts[d.id]||texts[1];
  $('preview-text').innerHTML=arr.map(function(t,i){return i===arr.length-1?'<p style="color:var(--accent);margin-top:1rem">'+t+'</p>':'<p>'+t+'</p>';}).join('');
  $('preview-modal').classList.add('show');
}
function closePreview(){ $('preview-modal').classList.remove('show'); }

/* ============================================================
 * 共享遊戲框架
 * ============================================================ */
function $(id){return document.getElementById(id);}
/* 安全寫入 localStorage：配額超限或被禁用時靜默失敗，避免遊戲崩潰 */
function safeSet(key,val){try{localStorage.setItem(key,val);}catch(e){}}

/* --- 繼承 --- */
var DEFAULT_INHERITANCE={
  mirror_defeated:false,golden_key:false,basement_knowledge:false,
  traded_admin:false,alone_escape:false,trusted:false,
  lost_limb:false,admin_guest:false,
  chen_survived:false,laozhou_survived:false,
  suwan_survived:false,xiaoyu_survived:false,
  yuanyuan_carried:false,memory_kept:false,memory_deleted:false,
  first_cleared:false,second_cleared:false,third_cleared:false,
  ng_plus:false,
  /* D類：時間循環 */
  deathCount:0,memoryFragments:[],loopCount:0
};
function loadInheritance(){
  try{
    var raw=localStorage.getItem('wuxian-inheritance');
    if(!raw)return Object.assign({},DEFAULT_INHERITANCE);
    return Object.assign({},DEFAULT_INHERITANCE,JSON.parse(raw));
  }catch(e){return Object.assign({},DEFAULT_INHERITANCE);}
}
function saveInheritance(obj){
  var cur=loadInheritance();
  var merged=Object.assign({},cur,obj);
  safeSet('wuxian-inheritance',JSON.stringify(merged));
}

/* --- 設置 --- */
var SETTINGS_KEY='wuxian-settings';
var ACH_KEY='wuxian-achievements';
var ENDINGS_KEY='wuxian-endings';
var SAVE_VERSION='3.0';
var SAVE_SLOTS=3;
var SETTINGS=loadSettings();
var SPEED_MAP={'slow':70,'normal':35,'fast':12};
/* C類：頁面加載時應用字體大小 */
(function(){
  var fs=SETTINGS.fontSize||20;
  document.documentElement.style.setProperty('--narrative-font-size',fs+'px');
  var ts=SETTINGS.transitionSpeed||1;
  document.documentElement.style.setProperty('--transition-mult',ts);
  /* 功能18/19：頁面加載時應用已保存的主題與敘事字體 */
  document.body.setAttribute('data-theme',SETTINGS.theme||'default');
  document.body.setAttribute('data-font',SETTINGS.narrativeFont||'serif');
})();
/* G類：可訪問性——頁面加載時檢查系統 prefers-reduced-motion */
(function(){
  try{
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      SETTINGS.reducedMotion=true;
    }
  }catch(e){}
})();
/* G類：根據SETTINGS切換body上的可訪問性class */
function applyAccessibility(){
  var b=document.body;
  if(!b)return;
  b.classList.toggle('colorblind-mode',!!SETTINGS.colorblindMode);
  b.classList.toggle('high-contrast',!!SETTINGS.highContrast);
  b.classList.toggle('reduced-motion',!!SETTINGS.reducedMotion);
}
/* 頁面加載後立即應用一次 */
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',applyAccessibility);
}else{applyAccessibility();}

function loadSettings(){
  var def={typeSpeed:35,autoScroll:true,bgAnim:true,ollamaEnabled:true,ollamaModel:'qwen2.5',ollamaUrl:'http://localhost:11434',
    autoSkipRead:false,autoPlay:false,autoPlaySpeed:3,difficulty:'normal',showRandomChoice:true,
    /* C類新增 */
    soundEnabled:false,masterVolume:70,typeVolume:50,ambientVolume:30,
    /* P2-11：合成BGM */
    bgmEnabled:false,bgmVolume:25,
    transitionSpeed:1,fontSize:20,particlesEnabled:true,flashSafe:false,
    /* G類：可訪問性 */
    colorblindMode:false,highContrast:false,reducedMotion:false,
    /* 功能18/19：主題與敘事字體 */
    theme:'default',narrativeFont:'serif'};
  try{var s=JSON.parse(localStorage.getItem(SETTINGS_KEY));if(s)return Object.assign(def,s);}catch(e){}
  return def;
}
function saveSettings(s){safeSet(SETTINGS_KEY,JSON.stringify(s));}

/* ============================================================
 * D類：錯誤邊界（window.onerror + 未捕獲Promise）
 * ============================================================ */
function showErrorModal(msg,detail){
  var m=document.getElementById('error-modal');
  if(!m)return;
  var b=document.getElementById('error-detail-body');
  if(b)b.textContent=detail||msg||'';
  m.classList.add('show');
}
function closeErrorModal(){
  var m=document.getElementById('error-modal');
  if(m)m.classList.remove('show');
}
window.onerror=function(message,source,lineno,colno,error){
  try{
    var detail='錯誤：'+message+'\n來源：'+(source||'')+'\n行：'+lineno+'，列：'+colno;
    if(error&&error.stack)detail+='\n\n'+error.stack;
    console.error('[無盡之門] 捕獲錯誤：',message,error);
    if(typeof autoSave==='function'){try{autoSave();}catch(e){}}
    showErrorModal(String(message),detail);
  }catch(e){}
  return true;
};
window.addEventListener('unhandledrejection',function(ev){
  try{
    var reason=ev.reason;
    var msg=(reason&&(reason.message||String(reason)))||'未處理的 Promise 錯誤';
    var detail='Promise 未捕獲：'+msg;
    if(reason&&reason.stack)detail+='\n\n'+reason.stack;
    console.error('[無盡之門] 未捕獲 Promise：',reason);
    if(typeof autoSave==='function'){try{autoSave();}catch(e){}}
    showErrorModal(String(msg),detail);
  }catch(e){}
});

/* ============================================================
 * D類：加載骨架屏淡出
 * 原則：進度條按真實初始化階段推進，loading 一直覆蓋到
 *       V4/V5 模組全部就緒、split-overlay 已 active 後才淡出，
 *       中間不出現「loading 已關、主畫面未到」的空白窗。
 * ============================================================ */
(function(){
  var ls=document.getElementById('loading-screen');
  var fill=document.querySelector('.loading-bar-fill');
  var tip=document.querySelector('.loading-tip');
  var progress=0;
  var hidden=false;

  function setProgress(pct,label){
    if(pct<progress)pct=progress;
    if(pct>100)pct=100;
    progress=pct;
    if(fill)fill.style.width=pct+'%';
    if(label&&tip)tip.textContent=label;
  }
  window.__setLoadingProgress=setProgress;

  function hideLoading(){
    if(hidden)return;hidden=true;
    if(!ls)return;
    ls.classList.add('hide');
    setTimeout(function(){ls.classList.add('done');},900);
  }
  window.__hideLoading=hideLoading;

  /* 輪詢就緒信號：V4.boot、V5.setupDone、split-overlay active */
  var poll=setInterval(function(){
    var v4ok=!!(window.V4&&V4.__booted);
    var v5ok=!(window.V5)||!!(window.V5&&V5.__setupDone);
    var so=document.getElementById('split-overlay');
    var soOk=!!(so&&so.classList.contains('active'));
    if(v4ok&&v5ok&&soOk){
      setProgress(100,'就緒');
      clearInterval(poll);
      setTimeout(hideLoading,350);
    }else if(v4ok&&!v5ok){
      setProgress(80,'載入第五扇門……');
    }else if(v4ok){
      setProgress(60,'啟動遊戲引擎……');
    }else{
      setProgress(35,'解析劇本與系統……');
    }
  },120);

  /* 初始階段 */
  setProgress(10,'載入資源……');
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setProgress(30,'就緒開始……');});
  }else{
    setProgress(30,'就緒開始……');
  }

  /* 兜底：最多 8 秒後無論如何淡出，避免卡死 */
  setTimeout(hideLoading,8000);
})();

/* ============================================================
 * D類：性能監控 requestAnimationFrame 幀率檢測 + 自動降級
 * ============================================================ */
var perfMonitor={fps:0,frameCount:0,lastSecondTime:0,lowFpsSeconds:0,recoverSeconds:0,degraded:false,rafId:null};
var perfDegraded=false;
function startPerfMonitor(){
  stopPerfMonitor();
  perfMonitor.degraded=false;perfDegraded=false;
  perfMonitor.frameCount=0;perfMonitor.lowFpsSeconds=0;perfMonitor.recoverSeconds=0;
  perfMonitor.lastSecondTime=performance.now();
  perfMonitor.rafId=requestAnimationFrame(perfTick);
}
function stopPerfMonitor(){
  if(perfMonitor.rafId){cancelAnimationFrame(perfMonitor.rafId);perfMonitor.rafId=null;}
}
function perfTick(now){
  perfMonitor.frameCount++;
  var elapsed=now-perfMonitor.lastSecondTime;
  if(elapsed>=1000){
    perfMonitor.fps=Math.round(perfMonitor.frameCount*1000/elapsed);
    perfMonitor.frameCount=0;
    perfMonitor.lastSecondTime=now;
    if(perfMonitor.fps<30){
      perfMonitor.lowFpsSeconds++;
      perfMonitor.recoverSeconds=0;
      if(perfMonitor.lowFpsSeconds>=3&&!perfMonitor.degraded){
        perfMonitor.degraded=true;perfDegraded=true;
        try{if(typeof stopParticles==='function')stopParticles();}catch(e){}
        if(typeof showToast==='function')showToast('性能不足，已自動降級');
      }
    }else if(perfMonitor.fps>50){
      perfMonitor.recoverSeconds++;
      perfMonitor.lowFpsSeconds=0;
      /* 可選：連續5秒高速後自動恢復粒子（僅當旅人設置開啟且遊戲仍在進行） */
      if(perfMonitor.degraded&&perfMonitor.recoverSeconds>=5){
        perfMonitor.degraded=false;perfDegraded=false;
        try{
          if(SETTINGS.particlesEnabled!==false&&typeof startParticles==='function'
             &&document.getElementById('game-screen').classList.contains('active')
             &&!document.getElementById('ending-screen').classList.contains('show')){
            startParticles();
          }
        }catch(e){}
      }
    }else{
      perfMonitor.lowFpsSeconds=0;perfMonitor.recoverSeconds=0;
    }
  }
  perfMonitor.rafId=requestAnimationFrame(perfTick);
}

/* ============================================================
 * D類：時間循環——死亡記憶與周回記憶恢復
 * ============================================================ */
var LOOP_ROOM_HINT={
  'mirror_final':'你記得在3號房，鏡像臨走前那句沒說完的話。',
  'manager':'你記得管理員桌上那盞燈，和他那張看不清的臉。',
  'forbidden_inner':'你記得禁書區空氣裡，有一股孩子房間的味道。',
  'yuanyuan_end':'你記得毛線貓肚子裡那張紙條，和孩子歪歪扭扭的字。',
  'operating_room':'你記得三樓手術室，那台機器螢幕黑著，旁邊有個插槽。',
  'basement':'你記得B2，那台卡車大的機器螢幕亮著98.7%。',
  'ending_bad_reset':'你記得倒數歸零前那十秒，壁鐘的滴答聲特別清楚，像有人在你耳朵裡數。',
  'death_dark':'你記得地下室那種像液體的黑，和石頭上有東西在爬的沙沙聲。',
  'death_lobby':'你記得大廳沒有編號，置換時白牆從四面往中間折，像被揉成一團。',
  'death_mirror_rage':'你記得鏡像發怒時，那隻掐住你喉嚨、冰涼又濕的手。',
  'death_force_together':'你記得5號門後那片更空的白，和老趙最後張嘴、沒出聲的那個口型。',
  'bad_puzzle':'你記得7號房的紙張自己燒起來，牆在薄薄地發抖。'
};
function recordDeathMemory(){
  try{
    var inh=loadInheritance();
    inh.deathCount=(inh.deathCount||0)+1;
    var sceneId=(state&&state.currentScene)?state.currentScene:'';
    var roomName='';
    try{roomName=(typeof $==='function'&&$('room-name'))?$('room-name').textContent:'';}catch(e){}
    var hint=LOOP_ROOM_HINT[sceneId]||('你記得在'+(roomName||'某個地方')+'，有什麼不對勁。');
    var frag={sceneId:sceneId,roomName:roomName,hint:hint,flag:'remember_'+sceneId};
    inh.memoryFragments=inh.memoryFragments||[];
    inh.memoryFragments=inh.memoryFragments.filter(function(f){return f.sceneId!==sceneId;});
    inh.memoryFragments.push(frag);
    if(inh.memoryFragments.length>6)inh.memoryFragments=inh.memoryFragments.slice(-6);
    saveInheritance({deathCount:inh.deathCount,memoryFragments:inh.memoryFragments});
  }catch(e){}
}
/* 返回開場敘事 HTML 字串（已含 <p>）；無死亡記憶時返回空字串 */
function restoreLoopMemory(){
  if(!state)return '';
  var inh=loadInheritance();
  var dc=inh.deathCount||0;
  state.loopCount=dc;
  if(dc<=0)return '';
  var frags=inh.memoryFragments||[];
  if(state.flags){frags.forEach(function(f){if(f&&f.flag)state.flags[f.flag]=true;});}
  var html='<p class="inherit-note">你又醒來了。</p>';
  frags.slice(-2).reverse().forEach(function(f){
    if(f&&f.hint)html+='<p class="inherit-note">'+f.hint+'</p>';
  });
  if(dc>3){html+='<p class="inherit-note">你開始注意到——這不是第一次了。</p>';}
  return html;
}

/* ============================================================
 * C類：Web Audio API 合成音效系統（無外部音頻文件）
 * ============================================================ */
var audioCtx=null;
var audioMasterGain=null;
var typeGainNode=null;
var ambientNodes=null; /* {osc, filter, gain} */
var typeClickCounter=0;

function initAudio(){
  if(!SETTINGS.soundEnabled)return;
  if(audioCtx){
    if(audioCtx.state==='suspended'){audioCtx.resume().catch(function(){});}
    return;
  }
  try{
    var AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    audioCtx=new AC();
    audioMasterGain=audioCtx.createGain();
    audioMasterGain.gain.value=(SETTINGS.masterVolume!=null?SETTINGS.masterVolume:70)/100;
    audioMasterGain.connect(audioCtx.destination);
    /* 打字聲專用 GainNode */
    typeGainNode=audioCtx.createGain();
    typeGainNode.gain.value=(SETTINGS.typeVolume!=null?SETTINGS.typeVolume:50)/100;
    typeGainNode.connect(audioMasterGain);
    if(audioCtx.state==='suspended'){audioCtx.resume().catch(function(){});}
  }catch(e){audioCtx=null;}
}
/* 頁面切到背景時暫停音頻與性能監控，回到前台時恢復 */
document.addEventListener('visibilitychange',function(){
  if(document.hidden){
    if(audioCtx&&audioCtx.state==='running'){try{audioCtx.suspend();}catch(e){}}
    if(perfMonitor.rafId)stopPerfMonitor();
  }else{
    if(audioCtx&&audioCtx.state==='suspended'){audioCtx.resume().catch(function(){});}
    try{startPerfMonitor();}catch(e){}
  }
});
/* 音量改變時即時生效 */
function applyAudioVolumes(){
  if(!audioCtx)return;
  var mv=(SETTINGS.masterVolume!=null?SETTINGS.masterVolume:70)/100;
  var tv=(SETTINGS.typeVolume!=null?SETTINGS.typeVolume:50)/100;
  var av=(SETTINGS.ambientVolume!=null?SETTINGS.ambientVolume:30)/100;
  if(audioMasterGain)audioMasterGain.gain.value=mv;
  if(typeGainNode)typeGainNode.gain.value=tv;
  if(ambientNodes&&ambientNodes.gain)ambientNodes.gain.gain.value=av*0.3;
}
/* 打字鍵盤聲：方形波短脈衝，節流每3-4字一次 */
function playTypeClick(){
  if(!SETTINGS.soundEnabled||!audioCtx||!typeGainNode)return;
  if(audioCtx.state!=='running')return;
  typeClickCounter++;
  if(typeClickCounter%4!==0)return; /* 節流：每4字響一次 */
  try{
    var now=audioCtx.currentTime;
    var osc=audioCtx.createOscillator();
    var g=audioCtx.createGain();
    osc.type='square';
    osc.frequency.value=800+Math.random()*400;
    g.gain.setValueAtTime(0.015,now);
    g.gain.exponentialRampToValueAtTime(0.001,now+0.015);
    osc.connect(g);
    g.connect(typeGainNode);
    osc.start(now);
    osc.stop(now+0.02);
  }catch(e){}
}
/* 門開關聲：低頻正弦波滑音+噪聲 */
function playDoorSound(){
  if(!SETTINGS.soundEnabled||!audioCtx||!audioMasterGain)return;
  if(audioCtx.state!=='running')return;
  try{
    var now=audioCtx.currentTime;
    var osc=audioCtx.createOscillator();
    var g=audioCtx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(150,now);
    osc.frequency.exponentialRampToValueAtTime(80,now+0.2);
    g.gain.setValueAtTime(0.08,now);
    g.gain.exponentialRampToValueAtTime(0.001,now+0.25);
    osc.connect(g);g.connect(audioMasterGain);
    osc.start(now);osc.stop(now+0.28);
    /* 簡單噪聲：短脈衝 */
    var bufSize=audioCtx.sampleRate*0.05;
    var buf=audioCtx.createBuffer(1,bufSize,audioCtx.sampleRate);
    var data=buf.getChannelData(0);
    for(var i=0;i<bufSize;i++){data[i]=(Math.random()*2-1)*0.05;}
    var noise=audioCtx.createBufferSource();
    noise.buffer=buf;
    var ng=audioCtx.createGain();
    ng.gain.setValueAtTime(0.03,now);
    ng.gain.exponentialRampToValueAtTime(0.001,now+0.08);
    noise.connect(ng);ng.connect(audioMasterGain);
    noise.start(now);
  }catch(e){}
}
/* 結局鼓點：低頻正弦波，重複2-3次 */
function playEndingDrum(){
  if(!SETTINGS.soundEnabled||!audioCtx||!audioMasterGain)return;
  if(audioCtx.state!=='running')return;
  var times=[0,0.6,1.2];
  for(var t=0;t<times.length;t++){
    (function(offset){
      try{
        var now=audioCtx.currentTime+offset;
        var osc=audioCtx.createOscillator();
        var g=audioCtx.createGain();
        osc.type='sine';
        osc.frequency.value=60;
        g.gain.setValueAtTime(0.25,now);
        g.gain.exponentialRampToValueAtTime(0.001,now+0.5);
        osc.connect(g);g.connect(audioMasterGain);
        osc.start(now);osc.stop(now+0.55);
      }catch(e){}
    })(times[t]);
  }
}
/* 迴廊低頻氛圍音：鋸齒波+低通濾波器 */
function startAmbient(){
  if(!SETTINGS.soundEnabled||!audioCtx||!audioMasterGain)return;
  if(audioCtx.state!=='running')return;
  if(ambientNodes)return; /* 已在播放 */
  try{
    var osc=audioCtx.createOscillator();
    osc.type='sawtooth';
    osc.frequency.value=60+Math.random()*20;
    var filter=audioCtx.createBiquadFilter();
    filter.type='lowpass';
    filter.frequency.value=200;
    var g=audioCtx.createGain();
    g.gain.value=(SETTINGS.ambientVolume!=null?SETTINGS.ambientVolume:30)/100*0.3;
    osc.connect(filter);filter.connect(g);g.connect(audioMasterGain);
    osc.start();
    ambientNodes={osc:osc,filter:filter,gain:g};
    /* P2-11：氛圍啟動後順便啟動BGM */
    startBGM();
  }catch(e){}
}
function stopAmbient(){
  if(!ambientNodes)return;
  try{
    ambientNodes.osc.stop();
    ambientNodes.osc.disconnect();
    ambientNodes.filter.disconnect();
    ambientNodes.gain.disconnect();
  }catch(e){}
  ambientNodes=null;
  /* P2-11：停止BGM */
  stopBGM();
}

/* ===== P2-11：合成BGM（三扇門各有和弦進行，低通濾波+LFO呼吸） ===== */
var bgmNodes=null;var bgmTimer=null;var bgmChordIdx=0;
var BGM_CHORDS={
  '1':[[110,138.6],[87.3,110],[130.8,164.8],[98,123.5]],
  '2':[[73.4,92.5],[58.3,73.4],[87.3,110],[65.4,82.4]],
  '3':[[65.4,82.4],[51.9,65.4],[77.8,98],[58.3,73.4]]
};
function startBGM(){
  if(!audioCtx||!SETTINGS.bgmEnabled||bgmNodes)return;
  if(audioCtx.state!=='running')return;
  try{
    var chords=BGM_CHORDS[currentDungeonId]||BGM_CHORDS['1'];
    bgmChordIdx=0;
    var osc1=audioCtx.createOscillator();osc1.type='triangle';
    var osc2=audioCtx.createOscillator();osc2.type='sine';
    var filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=380;filter.Q.value=0.7;
    var gain=audioCtx.createGain();gain.gain.value=0;
    var lfo=audioCtx.createOscillator();lfo.frequency.value=0.06;
    var lfoGain=audioCtx.createGain();lfoGain.gain.value=100;
    lfo.connect(lfoGain);lfoGain.connect(filter.frequency);
    osc1.connect(filter);osc2.connect(filter);filter.connect(gain);gain.connect(audioMasterGain);
    var vol=(SETTINGS.bgmVolume!=null?SETTINGS.bgmVolume:25)/100*0.1;
    gain.gain.linearRampToValueAtTime(vol,audioCtx.currentTime+2.5);
    function setChord(){
      var ch=chords[bgmChordIdx%chords.length];
      osc1.frequency.setTargetAtTime(ch[0],audioCtx.currentTime,2);
      osc2.frequency.setTargetAtTime(ch[1],audioCtx.currentTime,2);
      bgmChordIdx++;
    }
    setChord();
    osc1.start();osc2.start();lfo.start();
    bgmNodes={osc1:osc1,osc2:osc2,filter:filter,gain:gain,lfo:lfo,lfoGain:lfoGain};
    bgmTimer=setInterval(setChord,10000);
  }catch(e){}
}
function stopBGM(){
  if(!bgmNodes)return;
  try{
    var now=audioCtx.currentTime;
    bgmNodes.gain.gain.cancelScheduledValues(now);
    bgmNodes.gain.gain.linearRampToValueAtTime(0,now+1.2);
    var nodes=bgmNodes;
    setTimeout(function(){try{nodes.osc1.stop();nodes.osc2.stop();nodes.lfo.stop();}catch(e){}},1300);
  }catch(e){}
  bgmNodes=null;
  if(bgmTimer){clearInterval(bgmTimer);bgmTimer=null;}
}
function updateBGMVolume(){
  if(bgmNodes&&audioCtx){
    var vol=(SETTINGS.bgmVolume!=null?SETTINGS.bgmVolume:25)/100*0.1;
    bgmNodes.gain.gain.setTargetAtTime(vol,audioCtx.currentTime,0.5);
  }
}
/* 轉場速度倍率：baseMs / transitionSpeed */
function trTime(baseMs){
  var sp=SETTINGS.transitionSpeed||1;
  if(sp<=0)sp=1;
  return baseMs/sp;
}

/* ============================================================
 * C類：灰塵粒子系統（canvas，克制使用）
 * ============================================================ */
var particleRaf=null;
var particleTimeoutId=null; /* 修復9：不可見降頻時的 setTimeout ID 單獨儲存，避免與 rAF ID 混用 */
var particlesArr=[];
var particleResizeHandler=null; /* 命名引用，供 stopParticles 移除 */
/* ===== 功能15：氛圍（mood）配置——驅動背景色與粒子行為 ===== */
var MOOD_CONFIG={
  terror:{bg:'#050508',particleCount:10,particleSpeed:0.3,glow:false},
  tension:{bg:'#0a0606',particleCount:20,particleSpeed:1.8,glow:false},
  safe:{bg:'#0e0c0a',particleCount:25,particleSpeed:1.0,glow:false},
  melancholy:{bg:'#07080c',particleCount:15,particleSpeed:0.5,glow:false,falling:true},
  mystery:{bg:'#08060c',particleCount:20,particleSpeed:0.8,glow:true}
};
var currentMood='mystery';
var particleSpeedMult=1;
var particleGlow=false;
var particleFalling=false;
/* 功能18：從 CSS 變量讀取主題強調色作為粒子顏色 */
function getParticleColor(){
  try{
    var v=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    if(v)return v;
  }catch(e){}
  return '#c9a96e';
}
/* 功能15：套用氛圍——背景色過渡 + 粒子速度/發光調整 */
function applyMood(mood){
  var cfg=MOOD_CONFIG[mood]||MOOD_CONFIG.mystery;
  currentMood=mood||'mystery';
  /* 背景色：透過 CSS 變量驅動 #game-screen 的 1.5 秒過渡 */
  document.documentElement.style.setProperty('--bg-mood',cfg.bg);
  /* 速度倍率與發光：loop 內即時讀取，無需重啟 */
  particleSpeedMult=cfg.particleSpeed||1;
  particleGlow=!!cfg.glow;
  particleFalling=!!cfg.falling;
  /* 粒子數量改變需要重啟粒子才能生效 */
  if((particleRaf||particleTimeoutId) && $('game-screen').classList.contains('active')){
    stopParticles();
    startParticles();
  }
}
function startParticles(){
  var canvas=$('particle-canvas');
  if(!canvas)return;
  if(particleRaf||particleTimeoutId)return; /* 修復9：rAF 或降頻 timeout 任一存活即視為運行中 */
  if(SETTINGS.particlesEnabled===false)return;
  if(SETTINGS.bgAnim===false)return;
  /* G類：減少動畫模式下不自動啟動粒子 */
  if(SETTINGS.reducedMotion)return;
  var ctx=canvas.getContext('2d');
  function resize(){
    var gs=$('game-screen');
    if(!gs)return;
    canvas.width=gs.clientWidth;
    canvas.height=gs.clientHeight;
  }
  particleResizeHandler=resize;
  resize();
  window.addEventListener('resize',particleResizeHandler);
  /* 初始化粒子：數量與速度來自當前 mood 配置；觸控/小屏再降級 */
  var cfg=MOOD_CONFIG[currentMood]||MOOD_CONFIG.mystery;
  particleSpeedMult=cfg.particleSpeed||1;
  particleGlow=!!cfg.glow;
  particleFalling=!!cfg.falling;
  particlesArr=[];
  var isSmall=window.matchMedia&&window.matchMedia('(max-width:600px)').matches;
  var touch=('ontouchstart' in window);
  var count=cfg.particleCount||20;
  if(isSmall||touch)count=Math.max(6,Math.round(count*0.6));
  for(var i=0;i<count;i++){
    particlesArr.push({
      x:Math.random()*canvas.width,
      y:Math.random()*canvas.height,
      vx:0.1+Math.random()*0.2,
      vy:particleFalling?(0.15+Math.random()*0.25):(0.05+Math.random()*0.1),
      size:1+Math.random()*2,
      phase:Math.random()*Math.PI*2,
      swayAmp:0.3+Math.random()*0.3
    });
  }
  /* 功能18：粒子顏色跟隨主題強調色 */
  var pcolor=getParticleColor();
  ctx.fillStyle=pcolor;
  var frame=0;
  function loop(){
    if(!$('game-screen').classList.contains('active')){
      /* 不可見時不要每幀空轉 rAF，改為 500ms 後復查一次，降低空轉開銷 */
      /* 修復9：降頻 timeout 單獨存入 particleTimeoutId，並清空已觸發的 rAF ID */
      particleRaf=null;
      particleTimeoutId=setTimeout(function(){loop();},500);
      return;
    }
    /* 修復9：回到可見狀態，清除待執行的降頻 timeout，恢復 rAF 驅動 */
    particleTimeoutId=null;
    frame++;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    /* 功能15：發光氛圍透過 shadowBlur 實現 */
    if(particleGlow){
      ctx.shadowBlur=10;
      ctx.shadowColor=pcolor;
    }else{
      ctx.shadowBlur=0;
      ctx.shadowColor='transparent';
    }
    for(var i=0;i<particlesArr.length;i++){
      var p=particlesArr[i];
      /* 功能15：速度倍率由 mood 控制 */
      p.x+=p.vx*particleSpeedMult;
      p.y+=p.vy*particleSpeedMult;
      p.phase+=0.02;
      /* 正弦擺動 */
      var sway=Math.sin(p.phase)*p.swayAmp;
      /* 循環 */
      if(p.x>canvas.width+5)p.x=-5;
      if(p.y>canvas.height+5)p.y=-5;
      /* 閃爍透明度 */
      var alpha=0.1+Math.sin(p.phase*1.5)*0.1;
      if(alpha<0.05)alpha=0.05;
      if(alpha>0.3)alpha=0.3;
      ctx.globalAlpha=alpha;
      ctx.beginPath();
      ctx.arc(p.x+sway,p.y,p.size,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha=1;
    ctx.shadowBlur=0;
    particleRaf=requestAnimationFrame(loop);
  }
  loop();
}
function stopParticles(){
  /* 修復9：rAF ID 與降頻 timeout ID 分別清除，語義清晰 */
  if(particleRaf){
    cancelAnimationFrame(particleRaf);
    particleRaf=null;
  }
  if(particleTimeoutId){
    clearTimeout(particleTimeoutId);
    particleTimeoutId=null;
  }
  /* 移除 resize 監聽器，避免反覆進出遊戲時累積 */
  if(particleResizeHandler){
    window.removeEventListener('resize',particleResizeHandler);
    particleResizeHandler=null;
  }
  particlesArr=[];
  var canvas=$('particle-canvas');
  if(canvas){
    var ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }
}

/* --- 已讀場景記錄（跨局、按門扉隔離） --- */
var AUTO_PLAY_SPEEDS=[4000,3000,2000,1200,700];
var READ_KEY_PREFIX='wuxian-read-scenes-';
var CHAPTER_KEY='wuxian-chapter-unlock';
function getReadKey(){return READ_KEY_PREFIX+(DUNGEON_ID||'1');}
function getReadScenes(){
  try{var arr=JSON.parse(localStorage.getItem(getReadKey()));if(Array.isArray(arr))return arr;}catch(e){}
  return [];
}
function isSceneRead(sceneId){
  if(!sceneId)return false;
  return getReadScenes().indexOf(sceneId)!==-1;
}
function markSceneRead(sceneId){
  if(!sceneId)return;
  var arr=getReadScenes();
  if(arr.indexOf(sceneId)===-1){arr.push(sceneId);safeSet(getReadKey(),JSON.stringify(arr));}
}
/* ===== 功能17：閱讀進度條——已訪問場景數 / 門扉總場景數 ===== */
function updateProgress(){
  var fill=$('progress-fill');var txt=$('reading-progress-text');
  if(!fill||!txt)return;
  var total=(typeof SCENES!=='undefined'&&SCENES)?Object.keys(SCENES).length:0;
  var read=getReadScenes().length;
  var pct=total>0?Math.min(100,Math.round(read/total*100)):0;
  fill.style.width=pct+'%';
  txt.textContent='進度 '+pct+'%';
}
/* 章節解鎖記錄：{門扉ID: [已到達sceneId...]} */
function getChapterUnlock(){
  try{var o=JSON.parse(localStorage.getItem(CHAPTER_KEY));if(o&&typeof o==='object')return o;}catch(e){}
  return {};
}
function markChapterReached(sceneId){
  if(!sceneId)return;
  var all=getChapterUnlock();
  var did=DUNGEON_ID||'1';
  if(!Array.isArray(all[did]))all[did]=[];
  if(all[did].indexOf(sceneId)===-1)all[did].push(sceneId);
  safeSet(CHAPTER_KEY,JSON.stringify(all));
}
function getUnlockedChapters(){
  var all=getChapterUnlock();
  var did=DUNGEON_ID||'1';
  return Array.isArray(all[did])?all[did]:[];
}
function hasClearedDungeon(){
  /* 只要章節解鎖中有記錄，代表該門扉通關過 */
  var all=getChapterUnlock();
  var did=DUNGEON_ID||'1';
  return Array.isArray(all[did])&&all[did].length>0;
}

/* --- 結局 / 成就 --- */
function getEndingLog(){try{return JSON.parse(localStorage.getItem(ENDINGS_KEY))||[];}catch(e){return[];}}
function recordEnding(type,title){
  var log=getEndingLog();
  var entry=DUNGEON_ID+'|'+type+'|'+title;
  if(log.indexOf(entry)===-1){log.push(entry);localStorage.setItem(ENDINGS_KEY,JSON.stringify(log));}
}
function discoveredEndings(){
  return getEndingLog().filter(function(e){return e.indexOf(DUNGEON_ID+'|')===0;}).length;
}
function getAchList(){try{return JSON.parse(localStorage.getItem(ACH_KEY))||[];}catch(e){return[];}}
function unlockAchievement(id){
  var ach=getAchList();
  if(ach.indexOf(id)!==-1)return;
  ach.push(id);safeSet(ACH_KEY,JSON.stringify(ach));
  var def=(ACH_DEFS||[]).find(function(a){return a.id===id;});
  if(!def && window.DUNGEON_CONFIG){
    Object.keys(DUNGEON_CONFIG).some(function(k){
      var found=(DUNGEON_CONFIG[k].achDefs||[]).find(function(a){return a.id===id;});
      if(found){def=found;return true;}
      return false;
    });
  }
  if(def){showAchPopup(def.name,def.desc);}
  else{showToast('成就解鎖');}
}
var achPopupTimer=null;
function showAchPopup(name,desc){
  var p=$('ach-popup');
  $('ach-popup-name').textContent=name||'未知成就';
  $('ach-popup-desc').textContent=desc||'';
  p.classList.add('show');
  clearTimeout(achPopupTimer);
  achPopupTimer=setTimeout(function(){p.classList.remove('show');},2500);
}
function hasAchievement(id){return getAchList().indexOf(id)!==-1;}

/* --- 動態引用 --- */
var state=null;
var SCENES=null;
var SAVE_PREFIX='';
var DUNGEON_ID='1';
var TOTAL_ENDINGS=17;
var ACH_DEFS=[];
var currentDungeonId=1;
var gameStartTime=Date.now();
/* H類：版本與更新日誌 */
var VERSION='5.9.0';
var CHANGELOG=[
{version:'4.0.0',type:'major',changes:[
'第四扇門「無盡之間」上線：20 個新場景、7 個結局（含集齊迴廊碎片才能抵達的真結局「無盡之門」），回顧前三扇門的後設旅程。',
'迴廊碎片收集系統：前三扇門各藏 3 枚、共 9 枚，集齊後開啟通往真結局的最後一道門。',
'迴廊手札：頂欄「札」入口，總覽整體完成度、各扇門扉結局進度、成就與碎片收集；另含 14 枚里程碑稱號（可裝備）。',
'提示系統：在卡關時給予不暴雷的具體提示，每解鎖新結局回補提示次數。',
'三扇門各擴充 2 結局、2 成就、1 謎題與多個隱藏區域（質數旅館鏡中屋、沉默圖書館無聲之書、倒計時醫院十四個名字）。',
'音頻強化：8 首程式化合成 BGM 主題、結局收束音、克制的 UI 音效，以及設置中的「點唱機」。',
'修復成就系統在結局 ID 唯一化後約一半成就無法解鎖的重大問題；結局相關警告不再於正常遊玩時刷屏。',
'修復沉默圖書館「禁書區」、倒計時醫院「三樓 ICU」兩處長期斷鏈（相關隱藏劇情原本無法抵達）。',
'GM 自動遊玩強化：可解謎題、觸發動作結局，結局清單與實際總數一致。',
'UIUX 精緻化：過渡動畫、手機窄版與無障礙（鍵盤焦點、減少動作）改善。'
]},
{version:'3.9.2',type:'patch',changes:[
    '修復分支圖放大/縮小按鈕搞反的問題，並加大縮放幅度至1.5倍',
    '分支圖改為全體可見：一般模式下未探索節點顯示「？」，經歷過的節點才顯示實際內容；GM模式下仍可看到全部細節和無用分支',
    '一般模式下選項後不顯示「？」預覽按鈕（僅GM專屬）',
    '修復「菜」快捷輪盤按鈕在桌面端被隱藏的問題，改為常駐顯示，Q鍵快捷開關']},
{version:'3.9.1',type:'patch',changes:[
    '分支圖正常分支線加上箭頭標記，已讀路徑為金色箭頭，未探索為灰色箭頭',
    '無用分支改為實際節點：橢圓形虛線框，標註「無用」，從父節點彎線連出再彎線指回父節點（GM模式）',
    'GM「？」定位精準化：使用存儲的節點座標直接縮放，不再靠DOM標籤文本查詢，無用分支也能精準定位到對應橢圓節點',
    '分支圖佈局優化：節點間距加大，無用節點顯示區域自動擴展viewBox']},
{version:'3.9.0',type:'minor',changes:[
    'GM解鎖持久化：解鎖後存入本地存儲，下次進入遊戲自動恢復，無需重複解鎖序列',
    '分支圖改為GM專用：一般模式不可見，GM解鎖後頂欄顯示分支圖按鈕',
    '分支圖顯示無用分支：GM模式下，擁有無關選項的節點會顯示數量標記（虛線圓圈+數字）',
    'GM選項預覽：GM模式下每個選項後顯示「？」按鈕，點擊打開分支圖並局部放大定位到目標節點，顯示場景類型與摘要',
    '章節過場動畫強化：雙層徑向光暈脈衝、中央垂直裝飾線展開、標題金色發光呼吸、分隔線從中心向兩端生長、跳過提示閃爍',
    '第一章新增多選擇查看型分支：走廊「凝視」場景，可選擇深入觀察油畫/女孩/圓圈/裂縫，四條分支各自有獨立劇情但不影響結局走向']},
{version:'3.8.0',type:'minor',changes:[
    '壞結局動畫強化：血液滴落粒子從屏幕頂部流下、屏幕裂紋SVG遮罩、標題故障抖動、紅色脈衝暗角、緩慢推進zoom',
    '好結局動畫強化：金色光線從中心掃射、金色浮遊粒子從底部升起（帶光暈）、標題金色發光脈衝、內容逐項浮入、溫暖暈染背景',
    '所有結局粒子效果尊重減速動畫設置與光敏性安全設置，離開結局畫面時自動清理']},
{version:'3.7.1',type:'patch',changes:[
    '從門扉選擇畫面點「推門進入」時跳過章節標題畫面，過場動畫結束後直接進入序章',
    '移除過場與分屏動畫之間的1.1秒空白延遲，進入流程更順暢']},
{version:'3.7.0',type:'minor',changes:[
    '第一扇門「質數旅館」全文潤色：去AI味、優化對話自然度與氛圍描寫',
    '第三扇門「倒計時醫院」全文潤色：統一人稱、強化緊迫感與角色動機',
    '三扇門全部36+47+54=137個場景完成潤色合併，保留所有遊戲邏輯與條件分支']},
{version:'3.6.0',type:'minor',changes:[
    '第二扇門「沉默圖書館」全文潤色：優化劇情節奏、對話自然度、場景氛圍描寫',
    '潤色範圍涵蓋全部47個場景（序章、大廳、分類區、閱覽區、書架區、禁書區、結局分支）',
    '保留所有遊戲邏輯：條件分支、繼承繼承標記、onEnter動作、選項跳轉、成就解鎖、對話樹結構不變']},
{version:'3.5.0',type:'minor',changes:[
    '修復第二、三扇門扣血未經過damage()導致HP歸零不觸發死亡、失血過多結局永遠不可達的問題',
    '修復貪婪路線阿凍死亡後仍在mirror_final開口、return_lobby引用死者證據的矛盾',
    '修復老趙死亡分支中人數統計、room7咳聲、death_dark、survive_hide等處的狀態矛盾',
    '修復重返此門時personality性格數據未重置導致雷達圖跨局污染',
    '補齊第二扇門四個幻影成就定義（ach_lib_mirror/puzzles/trade/yuanyuan），修正成就計數虛高',
    '為ach_dual雙面成就補上解鎖路徑',
    '新增頁面可見性監聽：切換標籤時自動暫停音頻與性能監控，返回時恢復',
    '為所有localStorage寫入封裝safeSet異常防護，避免配額超限崩潰',
    '擴展死亡循環記憶提示，為多個壞結局補充專屬記憶句',
    '修正兩處錯別字（聲子→聲音、手機的保溫杯→手裡的保溫杯）',
    '為手術室/太平間/地下室等關鍵場景補充mood氛圍標記',
    '章節卡計時器在離開門扉時正確清理']},
{version:'3.4.0',type:'minor',changes:[
    '三扇門主角人稱全面統一為第二人稱「你」，修正 prologue、lobby、death、ending 等場景中殘留的第三人稱「他」',
    '移除外部 Google Fonts 依賴，改用系統字體棧（Songti TC / PingFang TC / SF Mono），確保單文件完全離線可用',
    '收斂快捷開啟途徑：僅保留標題點擊序列，移除鍵盤組合與長按房號等旁路',
    '清理未使用的箭頭序列變量',
    '踏入門扉時清理迴廊背景數字動畫定時器，避免資源洩漏',
    '更新暗黑金屬字體 fallback 為繁中系統字體',
    '成就彈窗結構補齊標籤與圖標層級']},
{version:'3.3.0',type:'minor',changes:[
    '新增偽結局系統：看似結局其實是假的，繼續操作打破第四面牆後返回遊戲',
    '新增環境敘事系統：關鍵場景可「觀察四周」查看額外環境描述，補充世界觀細節',
    '擴展鍵盤快捷鍵：Space繼續、I物品欄、M地圖、S存檔、L讀檔，設置中顯示鍵位說明']},
{version:'3.2.31',type:'patch',changes:[
    '修復暫停菜單pause-card缺少max-height和overflow-y，內容超出視口時無滾動條']},
{version:'3.2.30',type:'patch',changes:[
    '分屏切割線跟隨主題色變化']},
{version:'3.2.29',type:'patch',changes:[
    '改善色盲模式小圓點position定位']},
{version:'3.2.28',type:'patch',changes:[
    '#game-screen改用100dvh適配移動端']},
{version:'3.2.27',type:'patch',changes:[
    '六處觸控區域擴大至44px']},
{version:'3.2.26',type:'patch',changes:[
    '改善移動端頂欄高度']},
{version:'3.2.25',type:'patch',changes:[
    '修復兩處註釋簡體字殘留']},
{version:'3.2.24',type:'patch',changes:[
    '修復backup_sedative重複取得']},
{version:'3.2.23',type:'patch',changes:[
    '修復valium重複取得']},
{version:'3.2.22',type:'patch',changes:[
    '修復epinephrine重複取得']},
{version:'3.2.21',type:'patch',changes:[
    '修復commonFlags中b2_key應為director_letter']},
{version:'3.2.18',type:'patch',changes:[
    '接入孤兒場景ending_xiaoyu_betray']},
{version:'3.2.17',type:'patch',changes:[
    '接入孤兒場景ending_bad_chen']},
{version:'3.2.16',type:'patch',changes:[
    '接入孤兒場景ending_bad_silence']},
{version:'3.2.15',type:'patch',changes:[
    '序幕第一人稱「你」與第三人稱「他」混用統一為「你」']},
{version:'3.2.14',type:'patch',changes:[
    '更新林醫生對話樹為前行者前輩身份']},
{version:'3.2.13',type:'patch',changes:[
    '更新圖書館管理員對話樹為地毯暗門五凹槽機制']},
{version:'3.2.12',type:'patch',changes:[
    '修復貪婪路線阿凱已死仍有台詞']},
{version:'3.2.11',type:'patch',changes:[
    '修復貪婪路線阿凱已死仍顯示「四人」']},
{version:'3.2.10',type:'patch',changes:[
    '修復8269密碼提示與正文筆畫數解法不一致']},
{version:'3.2.9',type:'patch',changes:[
    '統一媛媛年份設定為1987年生、1993年六歲病故']},
{version:'3.2.8',type:'patch',changes:[
    '修復ending_normal捷徑路線缺少main_key的邏輯矛盾']},
{version:'3.2.7',type:'patch',changes:[
    '修復彈窗遮罩層級顯示異常']},
{version:'3.2.6',type:'patch',changes:[
    '修復progress-text重複ID']},
{version:'3.2.5',type:'patch',changes:[
    '修復preview-title重複ID']},
{version:'3.2.4',type:'patch',changes:[
    '修復preview-modal重複ID導致JS操作錯誤元素']},
{version:'3.2.3',type:'patch',changes:[
    '修復已讀標籤被clearNarrative同步清除']},
{version:'3.2.2',type:'patch',changes:[
    '修復死亡循環記憶提示被clearNarrative立即清空']},
{version:'3.2.1',type:'patch',changes:[
    '修復版本計數函數getUpdateCount()恆返回0，改為continue跳過當前版本']},
{version:'3.2.0',type:'minor',changes:[
    '新增設置預覽功能：五項可預覽設置旁顯示眼睛圖標，點擊彈出預覽窗口（打字速度真實播放示例、字體大小五檔對比、敘事字體完整段落、主題色五卡並排、轉場速度進度條演示）',
    '建立語義版本系統 x.y.z：x為大更新（新章節）、y為中更新（新功能）、z為小更新（修復/UI）',
    '更新日誌重寫為細粒度版本記錄，拆分大版本更新為多個獨立版本點']},
{version:'2.39.2',type:'patch',changes:[
    '分支樹入口增加到暫停菜單']},
{version:'2.39.1',type:'patch',changes:[
    '開場標題頁「進入迴廊」下方新增「設置」按鈕，以鋸齒分屏動畫打開設置，關閉後返回標題',
    '標題頁底部顯示當前版本號']},
{version:'2.39.0',type:'minor',changes:[
    '修復場景內容重複bug：重返同一地點根據已觸發事件顯示不同劇情（textReturn機制）',
    '修復NPC對話重複bug：對話進度持久化到state.flags，關閉再打開從上次進度繼續',
    '為25個可重複進入場景添加重返描述，為8個NPC添加重返招呼']},
{version:'2.38.0',type:'minor',changes:[
    '「保持安靜」警戒指標從頂欄移動到狀態欄']},
{version:'2.37.0',type:'minor',changes:[
    '新增章節卡：每章開始有獨特視覺卡片，文字從底部升起邊升邊放大，附文學性引言與主題符號']},
{version:'2.36.0',type:'minor',changes:[
    '新增四種字體切換（宋體/楷體/黑體/等寬），敘事文字使用單獨字體變量',
    '新增字體大小調節（14-22px滑桿）']},
{version:'2.35.0',type:'minor',changes:[
    '新增五套主題切換（暗黑金/血紅/冰藍/墨綠/紫羅蘭），CSS變量驅動全局色調，粒子顏色跟隨主題']},
{version:'2.33.0',type:'minor',changes:[
    '新增動態背景：五種情緒色調（恐怖/緊張/安全/憂鬱/神秘），場景背景與粒子隨情緒自動過渡']},
{version:'2.32.0',type:'minor',changes:[
    '新增旅人性格畫像：通關後顯示三角形雷達圖（冷靜/利他/謹慎三軸），根據70餘處關鍵選擇分析性格，附一句話描述']},
{version:'2.31.0',type:'minor',changes:[
    '新增分支樹可視化：SVG自動生成當前門扉完整分支，已走過金色實心、未探索灰色空心、結局按類型著色，當前節點閃爍，支援縮放平移與點擊查看場景資訊']},
{version:'2.30.1',type:'patch',changes:[
    '劇本全面去AI味：消除公式化寫作、對白自然化、抽象感受改為具體身體反應',
    '修復結局統計配置不一致']},
{version:'2.30.0',type:'minor',changes:[
    '全面代碼審查：修復重複函數、內存洩漏、異步競態、空指針等12項問題',
    '修復CSS層級錯誤（z-index=180改為z-index:180）',
    '擴大所有可點擊元素觸控區域到44px',
    '性能優化：粒子系統不可見降頻、打字機滾動優化']},
{version:'2.29.0',type:'minor',changes:[
    '新增可訪問性模式：色盲模式（藍色替代金色、橙色替代紅色，附圖案輔助）、高對比模式、光敏性保護（關閉壞結局閃爍震動）、減少動畫']},
{version:'2.28.0',type:'minor',changes:[
    '新增快捷輪盤（Q鍵喚出圓形菜單）、滑動手勢（手機端左滑返回/右滑地圖/下滑菜單）、雙擊快速繼續']},
{version:'2.27.0',type:'minor',changes:[
    '新增性能監控（requestAnimationFrame幀率檢測，低於30fps自動降級）與錯誤邊界（JS報錯時彈出友好提示並自動存檔）']},
{version:'2.26.0',type:'minor',changes:[
    '新增時間循環機制：死亡後在存檔點醒來，保留記憶碎片（顯示「你記得……」），解鎖新選項']},
{version:'2.25.0',type:'minor',changes:[
    '新增三個隱藏結局：質數旅館「鏡中門」、沉默圖書館「萬書之主」、倒計時醫院「記憶之門」，需特定物品與選擇順序解鎖']},
{version:'2.24.0',type:'minor',changes:[
    '新增地圖交互：點擊地圖上已探索區域可快速回顧該區劇情摘要']},
{version:'2.23.0',type:'minor',changes:[
    '新增存檔預覽增強：存檔槽顯示門扉名、場景名、遊戲時長、隊伍狀態、HP']},
{version:'2.22.0',type:'minor',changes:[
    '新增物品組合系統：物品欄兩個物品可組合生成新物品，每門扉3-5個配方，共11個配方']},
{version:'2.21.0',type:'minor',changes:[
    'New Game+模式：通關後繼承部分物品和知識進入二周目，解鎖隱藏對話']},
{version:'2.20.0',type:'minor',changes:[
    '新增畫廊/收藏室：集中查看已解鎖結局（灰/解鎖）、人物檔案、成就、場景列表']},
{version:'2.19.0',type:'minor',changes:[
    '新增Web Audio音效系統：打字鍵盤聲、門開關聲、結局鼓點、迴廊低頻氛圍，全部合成不需外部文件，設置中獨立音量控制']},
{version:'2.18.0',type:'minor',changes:[
    '新增難度設置：倒計時醫院時間寬鬆/標準/嚴格（倒計時倍率）、謎題提示次數']},
{version:'2.17.0',type:'minor',changes:[
    '新增文字回顧：打開歷史記錄面板查看之前讀過的劇情，支持按NPC名字或關鍵詞搜索']},
{version:'2.16.0',type:'minor',changes:[
    '新增自動播放模式：文字打完後自動推進劇情，遇選項暫停，可調1-5檔速度']},
{version:'2.15.0',type:'minor',changes:[
    '新增已讀文字跳過：重玩時看過的段落一鍵跳過，只停在新分支',
    '新增章節選擇：通關後可從已到達的章節直接跳轉']},
{version:'2.14.0',type:'minor',changes:[
    '新增通關統計數據（遊戲時長/死亡次數/場景數/對話次數）、分享截圖（一鍵生成通關結算卡片PNG）、更新日誌、製作人員名單']},
{version:'2.13.0',type:'minor',changes:[
    '新增倒計時顯示與重置計數：倒計時醫院專用，實時顯示剩餘時間與重置次數']},
{version:'2.12.0',type:'minor',changes:[
    '新增隊伍系統與生命值顯示：隊伍人數、HP條、HP數值']},
{version:'2.11.1',type:'patch',changes:[
    '修復第三扇門多個劇情邏輯bug',
    '優化夜間護士追逐場景的節奏']},
{version:'2.11.0',type:'minor',changes:[
    '新增NPC對話系統：7個NPC完整對話樹，「對話」按鈕→NPC列表→三選項對話',
    '新增名字對話流程：NPC先問→旅人可選「先說你的」→NPC回「你還是先說你的吧」→只剩「陸衍」選項']},
{version:'2.10.0',type:'minor',changes:[
    '鍵盤快捷鍵擴展與移動端觸控適配優化']},
{version:'2.9.1',type:'patch',changes:[
    '修復粒子背景在低性能設備上卡頓，加入自動降頻']},
{version:'2.9.0',type:'minor',changes:[
    '建立粒子背景系統，灰塵粒子飄浮增強沉浸感']},
{version:'2.8.0',type:'minor',changes:[
    '結局畫面演出強化：紅色脈衝、屏幕震動、暗角收縮']},
{version:'2.7.0',type:'minor',changes:[
    '成就系統擴展：第三扇門專屬成就與隱藏成就']},
{version:'2.6.1',type:'patch',changes:[
    '修復跨門扉傳承變量在重置後未正確還原']},
{version:'2.6.0',type:'minor',changes:[
    '跨門扉傳承變量擴展：角色存活狀態、關鍵物品傳遞、劇情旗標繼承']},
{version:'2.5.0',type:'minor',changes:[
    '隊伍成員狀態跟蹤與死亡判定，隊伍人數實時更新']},
{version:'2.4.0',type:'minor',changes:[
    '重置機制與記憶碎片系統：死亡後保留部分記憶解鎖新選項']},
{version:'2.3.1',type:'patch',changes:[
    '修復夜間護士追逐觸發條件與路徑判斷錯誤']},
{version:'2.3.0',type:'minor',changes:[
    '夜間護士追逐機制與AI行為邏輯']},
{version:'2.2.0',type:'minor',changes:[
    '醫院謎題系統：手術室密碼、藥品組合、檔案室拼圖']},
{version:'2.1.1',type:'patch',changes:[
    '修復第三扇門開場劇情與倒計時初始化不同步']},
{version:'2.1.0',type:'minor',changes:[
    '第三扇門劇本擴寫：補全支線劇情與NPC背景故事']},
{version:'2.0.0',type:'major',changes:[
    '新增第三扇門：倒計時醫院（60分鐘倒計時、重置機制、夜間護士追逐、手術室謎題）']},
{version:'1.19.0',type:'minor',changes:[
    '新增頂欄折疊動畫：預設收起細線+向下箭頭，點擊展開，箭頭順時針/逆時針旋轉180度']},
{version:'1.18.0',type:'minor',changes:[
    '新增長按跳過（3秒）：中央金色SVG圓環從頂部順時針畫滿，中間「跳過」文字，跳過後所有劇情立即加載並彈出選項']},
{version:'1.17.0',type:'minor',changes:[
    '新增無用選項系統：場景文字打完後選項才滑入，先只顯示無用選項，選一個後面板下滑隱藏→flavor文字打出→面板上滑顯示剩餘無用+主線，選過的無用選項永久消失，至少查看一個才出現主線']},
{version:'1.16.1',type:'patch',changes:[
    '修復跨門扉傳承變量傳遞bug']},
{version:'1.16.0',type:'minor',changes:[
    '新增鍵盤快捷鍵1/2/3快速選擇選項']},
{version:'1.15.0',type:'minor',changes:[
    '新增成就系統：通關、隱藏結局、特殊選擇等解鎖成就，localStorage持久化']},
{version:'1.14.0',type:'minor',changes:[
    '新增存檔系統：自動存檔+三組存檔槽，支持存檔預覽與刪除']},
{version:'1.13.0',type:'minor',changes:[
    '新增金色鋸齒分屏過場動畫：斜線鋸齒（/\/\/\）從左到右畫出，上下半屏分開，用於開場/結局/返回/踏入門扉']},
{version:'1.12.1',type:'patch',changes:[
    '修復質數旅館多個場景引用錯誤',
    '修復沉默圖書館謎題邏輯bug']},
{version:'1.12.0',type:'minor',changes:[
    '新增跨門扉傳承系統：約20個繼承變量（mirror_defeated/golden_key/basement_knowledge/traded_admin/alone_escape/trusted/lost_limb/admin_guest/角色存活等），影響後續門扉的劇情分支與可用選項']},
{version:'1.11.0',type:'minor',changes:[
    '第二扇門劇本擴寫：補全管理員背景、書架謎題分支與三種逃離路線']},
{version:'1.10.0',type:'minor',changes:[
    '新增第二扇門：沉默圖書館（鏡子迷宮、管理員、沉默規則、黃金鑰匙）']},
{version:'1.9.1',type:'patch',changes:[
    '修復質數旅館多個劇情bug',
    '優化打字機速度與游標位置']},
{version:'1.9.0',type:'minor',changes:[
    '新增第一扇門：質數旅館（只有質數房間的旅館、鏡子謎題、管理員、後門逃脫）']},
{version:'1.8.0',type:'minor',changes:[
    '建立localStorage存檔基礎，實現遊戲進度數據持久化']},
{version:'1.7.1',type:'patch',changes:[
    '修復狀態欄HP顯示在切換場景時不同步']},
{version:'1.7.0',type:'minor',changes:[
    '建立狀態欄：旅人名、門扉名、HP條與數值實時顯示']},
{version:'1.6.0',type:'minor',changes:[
    '實現房間編號顯示與場景導航機制']},
{version:'1.5.1',type:'patch',changes:[
    '修復物品重複取得與物品欄滾動顯示異常']},
{version:'1.5.0',type:'minor',changes:[
    '建立物品欄系統：物品取得、查看、使用與場景關聯']},
{version:'1.4.0',type:'minor',changes:[
    '實現壞結局與逃過一節結局系統，結局分類與計數']},
{version:'1.3.1',type:'patch',changes:[
    '修復選項點擊後重複觸發與場景切換閃爍']},
{version:'1.3.0',type:'minor',changes:[
    '建立場景系統與選項分支機制，支持條件分支與旗標判定']},
{version:'1.2.0',type:'minor',changes:[
    '實現打字機效果與行內游標，文字逐字顯示並自動滾動']},
{version:'1.1.0',type:'minor',changes:[
    '建立HTML單文件架構，確立暗黑金色主題（Noto Serif SC、grain噪點、vignette暗角）']},
{version:'1.0.0',type:'major',changes:[
    '遊戲首次發布']}
];
/* 計算累計更新次數：中更新（minor）+ 小更新（patch）的版本數量之和，不含大更新（major） */
function getUpdateCount(){
  var count=0;
  for(var i=0;i<CHANGELOG.length;i++){
    if(CHANGELOG[i].version===VERSION) continue;
    if(CHANGELOG[i].type==='minor'||CHANGELOG[i].type==='patch')count++;
  }
  return count;
}
function getVersionDisplay(){
  var major=VERSION.split('.')[0];
  return VERSION+' ('+major+'.'+getUpdateCount()+')';
}
/* H類：統計計數器 */
var dialogCount=0;
var itemObtainCount=0;
var itemObtainSet={};
var typeTimer=null;
var typingState=null;
var toastTimer=null;
var autoPlayPaused=false;
/* 格式化遊玩時長：<1小時顯示 mm:ss，否則 x時xx分 */
function fmtElapsed(ms){
  if(ms==null||isNaN(ms)||ms<0)return '—';
  var s=Math.floor(ms/1000);
  var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  if(h>0)return h+'時'+String(m).padStart(2,'0')+'分';
  return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');
}

/* --- 每扇門扉配置 --- */
var DUNGEON_CONFIG={
  1:{
    savePrefix:'prime-hotel-save',dungeonId:'1',totalEndings:17,
    startScene:'prelude',roomNum:'13',dungeonName:'質數旅館',
    subText:'無 盡 迴 廊 · 第 一 扇 門',ruleText:'',hasParty:true,hasCountdown:false,hasAdmin:false,
    achDefs:[
      {id:'ach_mirror',name:'鏡中真相',desc:'發現鏡子背後的秘密'},
      {id:'ach_dual',name:'雙面',desc:'體驗兩種鏡結局'},
      {id:'ach_golden',name:'金色鑰匙',desc:'找到金色鑰匙'},
      {id:'ach_basement',name:'地下室',desc:'下到地下室'},
      {id:'ach_trade',name:'交易',desc:'和管理員做交易'},
      {id:'ach_backdoor',name:'後門',desc:'找到後門'},
      {id:'ach_admin',name:'管理員的客人',desc:'成為管理員的貴客'},
      {id:'ach_puzzles',name:'解謎者',desc:'解開所有謎題'}
    ]
  },
  2:{
    savePrefix:'silent-library-save',dungeonId:'2',totalEndings:22,
    startScene:'prologue',roomNum:'靜',dungeonName:'沉默圖書館',
    subText:'無 盡 迴 廊 · 第 二 扇 門',ruleText:'請 保 持 安 靜',hasParty:true,hasCountdown:false,hasAdmin:true,
    achDefs:[
      {id:'ach_lib_silent',name:'死寂',desc:'在書架區保持完全安靜'},
      {id:'ach_lib_voice',name:'出聲',desc:'打破沉默'},
      {id:'ach_lib_cat',name:'三隻貓',desc:'找到所有關於貓的線索'},
      {id:'ach_lib_admin',name:'管理員',desc:'和管理員對話'},
      {id:'ach_lib_forbidden',name:'禁書區',desc:'進入禁書區'},
      {id:'ach_lib_truth',name:'圖書館真相',desc:'發現圖書館的秘密'},
      {id:'ach_lib_alone',name:'獨自',desc:'一個人通關'},
      {id:'ach_lib_bad',name:'沉默',desc:'體驗沉默結局'},
      {id:'ach_lib_mirror',name:'鏡中之書',desc:'讀到鏡子主題的那本書，明白圖書館本身就是一面鏡'},
      {id:'ach_lib_puzzles',name:'索書號',desc:'解開杜威分類法的鐵盒謎題'},
      {id:'ach_lib_yuanyuan',name:'地毯下',desc:'在管理員口中拼出媛媛的真相'},
      {id:'ach_lib_trade',name:'以物換話',desc:'把日記或電影票押給管理員，換出他沒說過的真話'}
    ]
  },
  3:{
    savePrefix:'countdown-hospital-save',dungeonId:'3',totalEndings:13,
    startScene:'prologue',roomNum:'60:00',dungeonName:'倒計時醫院',
    subText:'無 盡 迴 廊 · 第 三 扇 門',ruleText:'時 間 正 在 流 逝',hasParty:false,hasCountdown:true,hasAdmin:false,
    achDefs:[
      {id:'ach_yuanyuan',name:'媛媛',desc:'了解媛媛的故事'},
      {id:'ach_truth',name:'真相',desc:'發現全部真相'},
      {id:'ach_nurse',name:'夜巡',desc:'打傷夜巡護士'},
      {id:'ach_fourth',name:'四樓',desc:'探訪所有四樓病房'},
      {id:'ach_morgue',name:'第十四格',desc:'打開太平間N格'},
      {id:'ach_lin',name:'林醫生',desc:'完成林醫生支線'},
      {id:'ach_xiaoyu',name:'小雨',desc:'完成小雨支線'},
      {id:'ach_machine',name:'記憶提取機',desc:'找到記憶提取機'},
      {id:'ach_waiting',name:'等',desc:'在四樓寫下自己的名字'}
    ]
  }
};

/* --- 三份 state --- */
var state1={
  currentScene:'prelude',inventory:[],flags:{},hp:100,party:4,
  textIndex:0,puzzleCallback:null,puzzleAnswer:null,puzzleAttempts:0,
  inheritance:loadInheritance(),notes:[],history:[],
  /* 功能14：性格追蹤（冷靜/利他/謹慎，0-100，初始50） */
  personality:{calm:50,altruism:50,cautious:50},
  mapZones:[
    {id:'lobby',name:'旅館大廳',explored:false,current:true,scene:'lobby',summary:'登記入住的地方。管理員在櫃檯後面撥算盤，房客各懷心事。'},
    {id:'room13',name:'13號房',explored:false,current:false,scene:'lobby',summary:'被鎖著的房間。13是質數，但老趙說別進。'},
    {id:'hallway',name:'走廊',explored:false,current:false,scene:'corridor',summary:'兩側都是質數房間的門。紙條上寫著：質數會騙人。'},
    {id:'stairs',name:'樓梯',explored:false,current:false,scene:'lobby',summary:'連接各樓層。往下走，是空的。'},
    {id:'basement',name:'地下室',explored:false,current:false,scene:'basement',summary:'潮濕陰暗。牆上有刮痕，像有人在這裡撓過。'},
    {id:'mirror',name:'鏡子房間',explored:false,current:false,scene:'lobby',summary:'鏡子裡的東西會跟著你。別盯太久。'},
    {id:'admin',name:'管理員室',explored:false,current:false,scene:'manager',summary:'管理員的地方。可以做交易，但代價不小。'},
    {id:'exit',name:'後門',explored:false,current:false,scene:'lobby',summary:'通往外面的出口。帶上你該帶的東西再走。'}
  ]
};
var state2={
  currentScene:'prologue',inventory:[],flags:{},hp:100,party:4,
  textIndex:0,puzzleCallback:null,puzzleAnswer:null,puzzleAttempts:0,
  adminQuestions:3,
  inheritance:loadInheritance(),notes:[],history:[],
  /* 功能14：性格追蹤（冷靜/利他/謹慎，0-100，初始50） */
  personality:{calm:50,altruism:50,cautious:50},
  mapZones:[
    {id:'entrance',name:'入口大廳',explored:false,current:true,scene:'lobby',summary:'進入圖書館的地方。規則只有一條：保持安靜。'},
    {id:'bookshelf',name:'書架區',explored:false,current:false,scene:'bookshelf',summary:'書架上的每本書都記錄著一個人的一生。別出聲。'},
    {id:'corridor',name:'長走廊',explored:false,current:false,scene:'corridor_left',summary:'安靜得能聽見自己的呼吸。有人在盡頭走動。'},
    {id:'reading',name:'閱覽室',explored:false,current:false,scene:'reading_room',summary:'有人在這裡看書。他們不出聲，也不抬頭。'},
    {id:'archive',name:'檔案區',explored:false,current:false,scene:'bookshelf_right',summary:'存放舊檔案的地方。1987年的線索在這裡。'},
    {id:'fiction',name:'小說區',explored:false,current:false,scene:'fiction_zone',summary:'小說區的書都不是小說。每一本都是真的。'},
    {id:'reference',name:'參考區',explored:false,current:false,scene:'reference_zone',summary:'參考書籍擺滿了架。你想找的東西不在這裡。'},
    {id:'admin',name:'管理員室',explored:false,current:false,scene:'admin_deal',summary:'管理員只給你三個問題。別問錯。'},
    {id:'forbidden',name:'禁書區',explored:false,current:false,scene:'forbidden_zone',summary:'不許進入的區域。書架在這裡長出了牆。'},
    {id:'basement',name:'地下書庫',explored:false,current:false,scene:'basement',summary:'圖書館最深的地方。所有被刪掉的記憶都在這裡。'},
    {id:'exit',name:'出口',explored:false,current:false,scene:'lobby',summary:'離開的門。帶上你該帶的書。'}
  ]
};
var state3={
  currentScene:'prologue',inventory:[],flags:{},hp:100,countdown:60,resetCount:0,
  textIndex:0,puzzleCallback:null,puzzleAnswer:null,puzzleAttempts:0,
  inheritance:loadInheritance(),notes:[],history:[],
  /* 功能14：性格追蹤（冷靜/利他/謹慎，0-100，初始50） */
  personality:{calm:50,altruism:50,cautious:50},
  mapZones:[
    {id:'lobby',name:'醫院大廳',explored:false,current:true,scene:'entrance',summary:'荒廢的醫院。燈還在閃。倒計時開始了。'},
    {id:'pharmacy',name:'藥房',explored:false,current:false,scene:'pharmacy',summary:'還有沒過期的藥品。止痛、抗生素、鎮定劑，自己選。'},
    {id:'internal',name:'內科',explored:false,current:false,scene:'internal_med',summary:'病人在這裡看病。後來他們都消失了，身體還在。'},
    {id:'surgery',name:'外科',explored:false,current:false,scene:'surgery',summary:'手術室附近的走廊。地上有劃痕。'},
    {id:'or',name:'手術室/ICU',explored:false,current:false,scene:'icu',summary:'媛媛在ICU這張床上等過爸爸。本子上還有字跡。'},
    {id:'ward4',name:'四樓住院部',explored:false,current:false,scene:'ward4_floor',summary:'401病房的老病人記得他兒子。他記了很多年。'},
    {id:'office',name:'院長辦公室',explored:false,current:false,scene:'director_office',summary:'院長留下了一封信和一把鑰匙。拜託你給媛媛一個了斷。'},
    {id:'morgue',name:'太平間',explored:false,current:false,scene:'morgue',summary:'第14格。周敏把自己推了進去，留了一支針劑。'},
    {id:'basement',name:'B2記憶核心',explored:false,current:false,scene:'basement_entrance',summary:'吃記憶的東西在這裡。它在等它的爸爸。'}
  ]
};
var stateRefs={1:state1,2:state2,3:state3};
var SCENES1={},SCENES2={},SCENES3={};
var sceneRefs={1:SCENES1,2:SCENES2,3:SCENES3};

/* ============================================================
 * 共享工具函數
 * ============================================================ */
function showToast(msg){
  var t=$('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.classList.remove('show');},1800);
}
function addItem(id,name,desc,usage){
  if(state.inventory.find(function(i){return i.id===id;}))return;
  state.inventory.push({id:id,name:name,desc:desc,usage:usage||''});
  /* H類：獲得物品計數（去重，同一物品不重複計） */
  if(!itemObtainSet[id]){itemObtainSet[id]=true;itemObtainCount++;}
  updateInventoryUI();
}
function removeItem(id){
  state.inventory=state.inventory.filter(function(i){return i.id!==id;});updateInventoryUI();
}
function hasItem(id){
  if(!state||!state.inventory)return false;
  if(state.inventory.some(function(i){return i.id===id;}))return true;
  /* 組合後仍保留原組件的劇情判定資格，避免合成物品導致主線/支線卡死 */
  var compMap={
    rope:['rope_key'],main_key:['rope_key'],
    crumpled_note:['note_ticket'],movie_ticket:['note_ticket'],
    key_second:['golden_key2'],golden_key:['golden_key2'],
    zhangwei_notebook:['book_notebook'],your_book:['book_notebook'],
    admin_diary:['diary_album'],yuanyuan_album:['diary_album'],
    manager_book:['manager_exit'],exit_key:['manager_exit'],
    antibiotic:['antibiotic_painkiller'],painkiller:['antibiotic_painkiller'],
    medical_records:['medicine_record'],unlabeled_medicine:['medicine_record'],
    director_diary:['diary_scalpel'],scalpel:['diary_scalpel'],
    yuanyuan_memory:['memory_record'],surgery_record:['memory_record'],
    epinephrine:['epinephrine_sedative'],sedative:['epinephrine_sedative']
  };
  var alts=compMap[id];
  if(alts){
    for(var k=0;k<alts.length;k++){
      if(state.inventory.some(function(i){return i.id===alts[k];}))return true;
    }
  }
  return false;
}
function setFlag(f){state.flags[f]=true;}
function hasFlag(f){return !!state.flags[f];}
function updateInventoryUI(){
  $('item-count').textContent=state.inventory.length;
  $('inv-list').innerHTML=state.inventory.length?state.inventory.map(function(i){
    var tip=String(i.desc||'').replace(/"/g,'&quot;');
    if(typeof combineMode!=='undefined'&&combineMode){
      var sel=combineSelected.indexOf(i.id)!==-1;
      return '<div class="inv-item combine-selectable'+(sel?' combine-selected':'')+'" data-tooltip="'+tip+'" onclick="selectCombineItem(\''+i.id+'\')"><div class="inv-name">'+i.name+'</div><div class="inv-desc">'+i.desc+'</div></div>';
    }
    return '<div class="inv-item" data-tooltip="'+tip+'" onclick="showItemDetailById(\''+i.id+'\')"><div class="inv-name">'+i.name+'</div><div class="inv-desc">'+i.desc+'</div></div>';
  }).join(''):'<div class="panel-empty">空空如也</div>';
}
function updateHP(){
  var maxH=(state&&state.maxHp)||100;
  var pct=Math.min(100,Math.max(0,Math.round((state.hp/maxH)*100)));
  $('hp-fill').style.width=pct+'%';
  $('hp-text').textContent=Math.max(0,state.hp);
}
function updateParty(){ $('party-count').textContent=state.party; }
function updateCountdown(){
  var m=Math.floor(state.countdown/60),s=state.countdown%60;
  $('countdown-display').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
function difficultyMul(){
  var d=(SETTINGS.difficulty||'normal');
  if(d==='easy')return 0.5;
  if(d==='hard')return 2;
  return 1;
}
function addTime(min){state.countdown+=Math.round(min*difficultyMul());updateCountdown();}
function loseTime(min){state.countdown-=Math.round(min*difficultyMul());updateCountdown();
  if(state.countdown<=0){state.countdown=0;updateCountdown();
    var snapState=state; /* 捕獲當前 state，讀檔後比對 */
    setTimeout(function(){
      /* 若已讀檔切換到其他 state，或已進入結局，則不強制跳轉 */
      if(state!==snapState)return;
      if(!$('game-screen').classList.contains('active'))return;
      if($('ending-screen').classList.contains('show'))return;
      goToScene('ending_bad_reset');
    },800);
  }
}
function damage(amount){
  state.hp-=amount;updateHP();
  if(state.hp<=0){
    state.hp=0;updateHP();
    var snapState=state;
    setTimeout(function(){
      if(state!==snapState)return;
      if(!$('game-screen').classList.contains('active'))return;
      if($('ending-screen').classList.contains('show'))return;
      triggerEnding('death_hp','失血過多','你在黑暗中倒下。生命歸零。','壞結局 · 死亡');
    },600);
  }
}
function killPartyMember(name){
  if(state.party>1){state.party--;updateParty();appendNarrative('<p class="death_text">'+name+'倒下了。你聽到遠處傳來的笑聲。</p>');}
}

/* --- 打字機 --- */
/* 功能16：從節點開頭剝離 [shake]/[glow]/[ghost] 前綴，回傳對應特效 class（保留後續子元素） */
function stripTextEffectPrefix(node){
  var tx=node.textContent||'';
  var m=tx.match(/^\[(shake|glow|ghost)\]/);
  if(!m)return '';
  var cls='tx-'+m[1];
  var first=node.firstChild;
  if(first&&first.nodeType===3){first.textContent=first.textContent.slice(m[0].length);}
  return cls;
}
function typewriterHTML(html,cb){
  /* 安全：若前一場打字尚未結束，先清除其定時器，避免孤兒回調 */
  if(typingState&&!typingState.done){
    clearTimeout(typeTimer);
    typingState.done=true;
  }
  var tmp=document.createElement('div');tmp.innerHTML=html;
  var el=tmp.firstChild;if(!el){if(cb)cb();return;}
  var text=el.textContent||'';var tag=el.tagName;var cls=el.className;
  /* 功能16：偵測文字特效前綴 [shake]/[glow]/[ghost]，剝離前綴並記錄特效 class */
  var txCls='';
  var txm=text.match(/^\[(shake|glow|ghost)\]/);
  if(txm){txCls='tx-'+txm[1];text=text.slice(txm[0].length);}
  var node=document.createElement(tag);node.className=cls?cls+' visible '+txCls:('visible '+txCls);
  $('narrative').appendChild(node);
  var i=0;
  var st={node:node,fullText:text,i:i,cb:cb,done:false};
  typingState=st;
  /* 記錄打字開始前用戶是否貼底：若用戶已向上翻閱，則不搶滾，避免打斷閱讀 */
  var narrEl=$('narrative');
  var stickToBottom=true;
  if(narrEl){
    stickToBottom=(narrEl.scrollHeight-narrEl.scrollTop-narrEl.clientHeight)<80;
  }
  (function type(){
    if(st.done)return;
    if(i<=text.length){
      node.textContent=text.slice(0,i);i++;st.i=i;
      playTypeClick(); /* C類：打字音效（節流內部已處理） */
      if(SETTINGS.autoScroll && stickToBottom){
        /* 修復6：復用函數開頭緩存的 narrEl，避免每次打字重複 DOM 查詢 */
        if(narrEl){narrEl.scrollTop=narrEl.scrollHeight;}
      }
      typeTimer=setTimeout(type,SETTINGS.typeSpeed);
    }else{
      /* 修復5：打字完成，標記 typed-done 以隱藏 CSS 游標 */
      node.classList.add('typed-done');
      st.done=true;typingState=null;if(cb)cb();
    }
  })();
}
function isTyping(){return !!typingState&&!typingState.done;}
/* 立即把當前段落補滿，但不繼續佇列（用於離開場景前） */
function abortTyping(){
  if(isTyping()){
    clearTimeout(typeTimer);
    typingState.node.textContent=typingState.fullText;
    /* 修復5：中止打字同樣標記完成，隱藏游標 */
    typingState.node.classList.add('typed-done');
    typingState.done=true;
    typingState=null;
  }
}
/* 點擊文字區域：補滿當前段落並繼續下一條 */
function skipTyping(){
  if(isTyping()){
    var st=typingState;
    clearTimeout(typeTimer);
    st.node.textContent=st.fullText;
    /* 修復5：跳過打字同樣標記完成，隱藏游標 */
    st.node.classList.add('typed-done');
    st.done=true;
    typingState=null;
    if(st.cb)st.cb();
  }
}
function appendNarrative(html){typewriterHTML(html);}
function clearNarrative(){
  if(isTyping()){clearTimeout(typeTimer);typingState.done=true;typingState=null;}
  $('narrative').innerHTML='';
}

/* --- 房間資訊 --- */
function setRoom(room,roomName){$('room-number').textContent=room;$('room-name').textContent=roomName;}
function setSceneId(id){$('scene-id').textContent=id||'—';}

/* --- 選項渲染 --- */
var sceneChoiceState = {pickedUseless:[], hasShownMain:false};
var uselessChoiceTimer=null; /* 無用選項 flavor 播放中的 interval/timeout 追蹤 */

function renderChoices(choices){
  var c=$('choices');c.innerHTML='';
  /* 分離無用選項和主線選項 */
  var valid=choices.filter(function(ch){return !ch.condition||ch.condition();});
  var useless=valid.filter(function(ch){return ch.useless;});
  var main=valid.filter(function(ch){return !ch.useless;});
  /* 移除已選過的無用選項 */
  useless=useless.filter(function(ch){return sceneChoiceState.pickedUseless.indexOf(ch.text)===-1;});
  /* 決定顯示哪些 */
  var toShow;
  if(useless.length>0 && main.length>0){
    /* 有無用有主線：先只顯示無用，選過至少一個後才加主線 */
    if(sceneChoiceState.hasShownMain){
      toShow=useless.concat(main);
    }else{
      toShow=useless;
    }
  }else if(useless.length===0 && main.length>0){
    /* 無用選項全選完了，只顯示主線 */
    toShow=main;
  }else{
    toShow=valid;
  }
  toShow.forEach(function(ch,i){
    var btn=document.createElement('button');
    btn.className='choice-btn'+(ch.danger?' danger':'');
    var gmQ=window._gmUnlocked?'<span class="gm-choice-q" data-next="'+(ch.next||'')+'" data-useless="'+(ch.useless?'1':'0')+'" data-text="'+ch.text.replace(/"/g,'&quot;')+'">?</span>':'';
    /* 數字快捷鍵提示：僅第1-9個選項對應鍵盤1-9，第10個起不顯示 */
    var numHtml=(i<9)?'<span class="choice-num">'+(i+1)+'</span>':'';
    btn.innerHTML=numHtml+'<span class="txt">'+ch.text+'</span>'+gmQ;
    btn.onclick=function(e){
      if(e&&e.stopPropagation)e.stopPropagation();
      /* GM模式：點擊「？」打開分支圖定位 */
      if(e&&e.target&&e.target.classList&&e.target.classList.contains('gm-choice-q')){
        e.preventDefault();
        openBranchTreeAt(e.target.getAttribute('data-next'),e.target.getAttribute('data-useless')==='1',e.target.getAttribute('data-text'));
        return;
      }
      handleChoiceClick(ch);
    };
    c.appendChild(btn);
  });
  /* 隨機選擇按鈕：選項>=2且設定開啟時顯示（不在 .choice-btn 內，不佔數字鍵索引） */
  if(toShow.length>=2 && SETTINGS.showRandomChoice!==false){
    var rnd=document.createElement('button');
    rnd.id='random-choice-btn';
    rnd.type='button';
    rnd.innerHTML='<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.4"/><circle cx="15.5" cy="15.5" r="1.4"/><circle cx="15.5" cy="8.5" r="1.4"/><circle cx="8.5" cy="15.5" r="1.4"/></svg>隨機';
    rnd.onclick=function(e){
      if(e&&e.stopPropagation)e.stopPropagation();
      pickRandomChoice();
    };
    c.appendChild(rnd);
  }
}
/* 隨機選擇：在目前可見的有效選項中隨機點一個 */
function pickRandomChoice(){
  var btns=$('choices').querySelectorAll('.choice-btn');
  if(!btns.length)return;
  var pick=btns[Math.floor(Math.random()*btns.length)];
  if(pick)pick.click();
}
/* GM：打開分支圖並定位到指定節點（動態最大縮放，同時容納源節點和目標節點） */
function openBranchTreeAt(targetId,isUseless,choiceText){
  renderBranchTree();
  $('branch-modal').classList.add('show');
  var info=$('branch-info');
  var svg=$('branch-svg');
  var wrap=$('branch-canvas-wrap');
  /* 容器寬高比，用於計算viewBox */
  var cw=wrap?wrap.clientWidth:800,ch=wrap?wrap.clientHeight:500;
  var containerRatio=cw/ch;
  function highlightNode(nodeId){
    var el=svg.querySelector('[data-node-id="'+nodeId.replace(/"/g,'\\"')+'"]');
    if(el){
      var shape=el.querySelector('circle,ellipse');
      if(shape){
        if(shape.tagName==='circle'){shape.setAttribute('r','9');}
        shape.setAttribute('stroke','var(--accent-bright)');
        shape.setAttribute('stroke-width','2.5');
      }
    }
  }
  /* 動態縮放：計算包含所有指定節點的最小bounding box，加padding，匹配容器比例 */
  function zoomToFit(nodeIds){
    if(!window._branchNodePositions)return;
    var pts=[];
    nodeIds.forEach(function(id){
      if(window._branchNodePositions[id])pts.push(window._branchNodePositions[id]);
    });
    if(pts.length===0)return;
    var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    pts.forEach(function(p){
      if(p.x<minX)minX=p.x;if(p.y<minY)minY=p.y;
      if(p.x>maxX)maxX=p.x;if(p.y>maxY)maxY=p.y;
    });
    var pad=35; /* 節點周圍留白 */
    minX-=pad;minY-=pad;maxX+=pad;maxY+=pad;
    var bw=maxX-minX,bh=maxY-minY;
    /* 匹配容器比例，確保兩個節點都在屏幕內 */
    if(bw/bh<containerRatio){
      var newW=bh*containerRatio;
      var cx=(minX+maxX)/2;
      minX=cx-newW/2;bw=newW;
    }else{
      var newH=bw/containerRatio;
      var cy=(minY+maxY)/2;
      minY=cy-newH/2;bh=newH;
    }
    svg.setAttribute('viewBox',minX+' '+minY+' '+bw+' '+bh);
  }
  if(isUseless){
    /* 無用分支：找到對應的虛擬節點 */
    var foundUid=null,parentKey=null;
    if(window._branchNodePositions){
      for(var uid in window._branchNodePositions){
        if(uid.indexOf('__useless__')===0){
          var parts=uid.split('__');
          var pk=parts[2];
          var idx=parseInt(parts[3],10);
          var sc=SCENES[pk];
          if(sc){
            var uselessChoices=(sc.choices||[]).filter(function(c){return c.useless;});
            if(uselessChoices[idx]&&uselessChoices[idx].text===choiceText){
              foundUid=uid;parentKey=pk;break;
            }
          }
        }
      }
    }
    info.innerHTML='<strong style="color:var(--text-dim)">無關分支</strong><br>所屬場景：'+(parentKey?((SCENES[parentKey]||{}).roomName||'—'):'—')+
      '<br>選項：「'+choiceText+'」'+
      '<br><span style="color:var(--text-dim)">此選項不影響劇情走向，僅播放額外描述後返回原場景。</span>';
    if(foundUid&&parentKey){
      zoomToFit([parentKey,foundUid]);
      highlightNode(foundUid);
      highlightNode(parentKey);
    }
    return;
  }
  if(!targetId||!SCENES[targetId]){
    info.innerHTML='<strong style="color:var(--text-dim)">未知節點</strong><br>選項：「'+choiceText+'」<br><span style="color:var(--text-dim)">此選項無明確跳轉目標（可能是action類選項或條件分支）。</span>';
    return;
  }
  var sc=SCENES[targetId];
  var firstText='';
  if(sc.text&&sc.text.length){
    var raw=String(sc.text[0]).replace(/<[^>]+>/g,'').replace(/\[shake\]|\[glow\]|\[ghost\]/g,'');
    firstText=raw.length>80?raw.slice(0,80)+'…':raw;
  }
  var type=branchNodeType(targetId,sc);
  var typeLabel=type==='bad'?'壞結局':(type==='survive'?'逃過一劫':(type==='ending'?'結局':'普通場景'));
  info.innerHTML='<strong style="color:var(--accent)">'+(sc.roomName||targetId)+'</strong>　'+(sc.sceneId||'')+
    '<br><span style="color:var(--accent-dim)">類型：'+typeLabel+'</span>'+
    (firstText?'<br>'+firstText:'');
  /* 動態最大縮放：同時容納當前場景（源）和目標場景 */
  var sourceId=state&&state.currentScene?state.currentScene:null;
  if(sourceId&&targetId&&sourceId!==targetId){
    zoomToFit([sourceId,targetId]);
  }else if(targetId){
    zoomToFit([targetId]);
  }
  highlightNode(targetId);
  if(sourceId&&sourceId!==targetId)highlightNode(sourceId);
}

function handleChoiceClick(ch){
  /* Feature 24：觀察選項——打開環境描述彈窗，不切換場景，選項保留 */
  if(ch.observe){
    showObservation(ch.observe);
    return;
  }
  if(ch.useless){
    /* 標記已選 */
    if(sceneChoiceState.pickedUseless.indexOf(ch.text)===-1){
      sceneChoiceState.pickedUseless.push(ch.text);
    }
    sceneChoiceState.hasShownMain=true;
    /* 選項面板下滑隱藏 */
    var c=$('choices');
    c.classList.add('hidden-choices');
    /* 播放flavor文字 */
    var flavorToken=sceneToken;
    setTimeout(function(){
      if(flavorToken!==sceneToken)return; /* B8：場景已切換，放棄過期 flavor */
      if(ch.flavor){
        appendNarrative('<p class="flavor">'+ch.flavor+'</p>');
        /* GM自動跳過：立即跳過flavor打字 */
        if(window.gmAutoSkip){
          setTimeout(function(){
            if(isTyping()){clearTimeout(typeTimer);if(typingState&&typingState.node){typingState.node.textContent=typingState.fullText;typingState.node.classList.add('typed-done');typingState.done=true;}typingState=null;}
            var n=$('narrative');n.scrollTop=n.scrollHeight;
            renderChoices(currentSceneChoices);
            c.classList.remove('hidden-choices');
          },60);
          return;
        }
        /* 等文字打完再重新顯示選項 */
        uselessChoiceTimer=setInterval(function(){
          if(!isTyping()){
            clearInterval(uselessChoiceTimer);uselessChoiceTimer=null;
            setTimeout(function(){
              renderChoices(currentSceneChoices);
              c.classList.remove('hidden-choices');
              if(SETTINGS.autoScroll){
                var n=$('narrative');
                n.scrollTop=n.scrollHeight;
              }
            },200);
          }
        },100);
      }else{
        renderChoices(currentSceneChoices);
        c.classList.remove('hidden-choices');
      }
    },350);
  }else{
    /* 主線選項：先收起選項面板再執行 */
    var c=$('choices');
    c.classList.add('hidden-choices');
    var oldScene=state.currentScene;
    setTimeout(function(){
      /* 功能14：套用選項帶來的性格傾向偏移（clamp 0-100） */
      if(ch.personality && state.personality){
        var pers=state.personality;
        ['calm','altruism','cautious'].forEach(function(k){
          if(typeof ch.personality[k]==='number'){
            pers[k]=Math.max(0,Math.min(100,(pers[k]||50)+ch.personality[k]));
          }
        });
      }
      if(ch.action)ch.action();
      else if(ch.next)goToScene(ch.next);
      /* 如果action沒有切換場景，恢復選項 */
      setTimeout(function(){
        if(state.currentScene===oldScene && !$('puzzle-modal').classList.contains('show') && !$('admin-modal').classList.contains('show')){
          renderChoices(currentSceneChoices);
          c.classList.remove('hidden-choices');
        }
      },500);
    },350);
  }
}

var currentSceneChoices=[];
var currentPlayContext=null;
var sceneToken=0; /* 場景生成計數器：goToScene 每次遞增，舊回調檢查過期即捨棄 */

/* --- 場景切換 --- */
/* preStart：在舊文字清空、新文字開始前執行（用於 onEnter，避免其追加的文字被清空） */
function playSceneText(textArr, onDone, preStart){
  var myToken=sceneToken;
  var narr=$('narrative');
  /* 先淡出舊文字，再清空、再淡入新文字，避免生硬跳切 */
  narr.classList.add('scene-fade');
  setTimeout(function(){
    /* 場景已被更新的 goToScene 取代，放棄本次回調 */
    if(myToken!==sceneToken)return;
    clearNarrative();state.textIndex=0;
    try{var loopHtml=restoreLoopMemory();if(loopHtml)$('narrative').innerHTML=loopHtml;}catch(e){}
    currentPlayContext={textArr:textArr,onDone:onDone};
    narr.classList.remove('scene-fade');
    if(preStart)preStart();
    function next(){
      if(myToken!==sceneToken)return; /* 過期場景，停止推進 */
      if(state.textIndex<textArr.length){
        var t=textArr[state.textIndex];
        if(t){
          typewriterHTML(t,function(){
            if(myToken!==sceneToken)return;
            state.textIndex++;
            /* 自動播放：段落打完後等待對應毫秒數再繼續下一段 */
            var delay=100;
            if(SETTINGS.autoPlay && !autoPlayPaused && !window.gmAutoSkip){
              delay=AUTO_PLAY_SPEEDS[(SETTINGS.autoPlaySpeed||3)-1]||2000;
            }
            setTimeout(next,delay);
          });
        }
        else{state.textIndex++;next();}
      }else{
        if(onDone)onDone();
      }
    }
    next();
  },trTime(300));
}

/* 長按跳過：一次性輸出剩餘所有文字，立刻顯示選項 */
function skipCurrentScene(){
  if(isTyping()){
    clearTimeout(typeTimer);
    typingState.node.textContent=typingState.fullText;
    /* 修復5：跳過當前打字段落，標記完成以隱藏游標 */
    typingState.node.classList.add('typed-done');
    typingState.done=true;
    typingState=null;
  }
  if(currentPlayContext){
    var ctx=currentPlayContext;
    currentPlayContext=null;
    /* 一次性追加剩餘段落，並標記為可見 */
    for(var i=state.textIndex+1;i<ctx.textArr.length;i++){
      if(ctx.textArr[i]){
        var tmp=document.createElement('div');tmp.innerHTML=ctx.textArr[i];
        var node=tmp.firstChild;
        if(node){
          /* 功能16：跳過打字時同樣剝離特效前綴並套用 class */
          var skipTx=stripTextEffectPrefix(node);
          if(skipTx)node.classList.add(skipTx);
          node.classList.add('visible');
          /* 修復5：跳過模式下所有段落均已完整呈現，不顯示打字游標 */
          node.classList.add('typed-done');
          $('narrative').appendChild(node);
        }
      }
    }
    state.textIndex=ctx.textArr.length;
    /* 所有已存在的段落也確保可見，並標記完成避免殘留游標 */
    var paras=$('narrative').children;
    for(var j=0;j<paras.length;j++){paras[j].classList.add('visible');paras[j].classList.add('typed-done');}
    if(SETTINGS.autoScroll){
      var n=$('narrative');
      n.scrollTop=n.scrollHeight;
      setTimeout(function(){n.scrollTop=n.scrollHeight;},20);
    }
    var skipToken=sceneToken;
    setTimeout(function(){
      if(skipToken!==sceneToken)return; /* B8：場景已切換，不觸發過期 onDone */
      if(ctx.onDone)ctx.onDone();
    },50);
  }
}

/* --- 自動播放指示器 --- */
function updateAutoPlayIndicator(){
  var ind=$('autoplay-indicator');
  if(!ind)return;
  var inGame=$('game-screen').classList.contains('active');
  if(SETTINGS.autoPlay && inGame){
    ind.classList.add('show');
    if(autoPlayPaused){
      ind.classList.add('paused');
      ind.querySelector('.ap-label').textContent='已暫停';
    }else{
      ind.classList.remove('paused');
      ind.querySelector('.ap-label').textContent='自動播放中';
    }
  }else{
    ind.classList.remove('show','paused');
  }
}
function toggleAutoPlay(){
  autoPlayPaused=!autoPlayPaused;
  updateAutoPlayIndicator();
  /* 如果恢復且正在打字結束等待中，觸發一次推進 */
  if(!autoPlayPaused && isTyping()){
    /* 正在打字中，不需要做什麼；下一段打完後會自動等待並繼續 */
  }
}

function goToScene(id){
  var sc=SCENES[id];if(!sc)return;
  sceneToken++; /* 使前一次 playSceneText 的待執行回調失效 */
  /* 清除無用選項 flavor 播放中的輪詢，避免在新場景殘留 */
  if(uselessChoiceTimer){clearInterval(uselessChoiceTimer);uselessChoiceTimer=null;}
  state.currentScene=id;
  /* C類：房間號變化時播放門聲 */
  var prevRoom=$('room-number').textContent;
  var newRoom=sc.room||'—';
  if(prevRoom!==newRoom && newRoom!=='—' && prevRoom!=='—'){
    setTimeout(playDoorSound,200);
  }
  setRoom(sc.room||'—',sc.roomName||'—');
  setSceneId(sc.sceneId||'—');
  /* 功能15：依場景 mood 切換背景與粒子氛圍 */
  if(typeof applyMood==='function')applyMood(sc.mood||'mystery');
  pushHistory(sc.sceneId||sc.roomName||'—','進入'+(sc.roomName||id));
  if(sc.mapZone)markZone(sc.mapZone);
  /* 已讀場景處理：先判斷是否已讀，再標記為已讀 */
  var sid=sc.sceneId||id;
  var wasRead=isSceneRead(sid);
  markSceneRead(sid);
  markChapterReached(sid);
  /* 功能17：標記已讀後更新閱讀進度條 */
  if(typeof updateProgress==='function')updateProgress();
  sceneChoiceState={pickedUseless:[],hasShownMain:false};
  currentSceneChoices=sc.choices||[];
  $('choices').classList.add('hidden-choices');
  /* 動態文字：重返場景可用 textReturn，或用 getText(state) 完全動態生成 */
  var textArr;
  if(typeof sc.getText==='function'){textArr=sc.getText(state);}
  else if(wasRead && sc.textReturn){textArr=sc.textReturn;}
  else{textArr=sc.text||[];}
  /* 功能20：章節卡——若當前場景是章節節點且尚未顯示過，先播章節卡再開始打字 */
  function beginPlay(){
    /* 已讀標籤：在 clearNarrative 之後、打字開始前注入，避免被清空 */
    var effectivePreStart=function(){
      if(sc.onEnter)sc.onEnter();
      if(wasRead){
        var tag=document.createElement('div');
        tag.className='read-tag';tag.textContent='已讀';
        $('narrative').appendChild(tag);
      }
    };
    playSceneText(textArr,function(){
      /* 文字全部打完後才顯示選項 */
      /* 修復10：捕獲當前 sceneToken，快速切場景時放棄過期的選項渲染 */
      var choiceToken=sceneToken;
      setTimeout(function(){
        if(choiceToken!==sceneToken)return;
        renderChoices(currentSceneChoices);
        $('choices').classList.remove('hidden-choices');
      },200);
    }, effectivePreStart);
    /* GM自動跳過：在 playSceneText 淡入啟動後立即跳過打字動畫 */
    if(window.gmAutoSkip){
      setTimeout(function(){
        skipCurrentScene();
        var n=$('narrative');if(n)n.scrollTop=n.scrollHeight;
      },Math.max(60, trTime(300)+30));
    }
    /* 已讀跳過：開啟後進入已讀場景自動跳過打字動畫 */
    else if(SETTINGS.autoSkipRead && wasRead){
      setTimeout(function(){
        skipCurrentScene();
        var n=$('narrative');if(n)n.scrollTop=n.scrollHeight;
      },Math.max(80, trTime(300)+40));
    }
  }
  var chDef=getChapterDefFor(id);
  if(chDef && !hasShownChapter(chDef)){
    markChapterShown(chDef);
    showChapterCard(chDef, beginPlay);
  }else{
    beginPlay();
  }
  var dlgOverlay = $('dialog-overlay');
  if(dlgOverlay && dlgOverlay.classList.contains('open')) closeDialogPanel();
  autoSave();
}

/* --- 謎題 --- */
function openPuzzle(title,text,answer,cb,hint){
  $('puzzle-title').textContent=title;
  $('puzzle-text').textContent=text;
  $('puzzle-input').value='';
  state.puzzleCallback=cb;state.puzzleAnswer=answer;state.puzzleAttempts=0;
  state.puzzleHint=hint||null;
  /* 難度決定提示次數 */
  var diff=SETTINGS.difficulty||'normal';
  var hintMax=(diff==='easy')?3:(diff==='hard')?0:1;
  state.puzzleHintRemaining=hintMax;
  /* 提示按鈕：有 hint 且難度允許才顯示，否則隱藏 */
  var bar=$('puzzle-hint-bar');
  var ht=$('puzzle-hint-text');
  var tg=$('puzzle-hint-toggle');
  ht.style.display='none';ht.textContent='';
  var remEl=$('puzzle-hint-remaining');
  if(hint && hintMax>0){
    bar.style.display='flex';
    tg.textContent='提 示';
    tg.style.display='';
    if(remEl){remEl.style.display='';remEl.textContent='剩餘提示：'+hintMax+'次';remEl.classList.remove('zero');}
  }else if(hint && hintMax===0){
    bar.style.display='flex';
    tg.style.display='none';
    if(remEl){remEl.style.display='';remEl.textContent='剩餘提示：0次（嚴格難度）';remEl.classList.add('zero');}
  }else{
    bar.style.display='none';
    if(remEl)remEl.style.display='none';
  }
  $('puzzle-modal').classList.add('show');
  setTimeout(function(){$('puzzle-input').focus();},100);
}
function togglePuzzleHint(){
  var ht=$('puzzle-hint-text');
  var tg=$('puzzle-hint-toggle');
  if(!state.puzzleHint){return;}
  if(state.puzzleHintRemaining<=0){showToast('提示次數已用完');return;}
  if(ht.style.display==='none'||!ht.style.display){
    ht.textContent=state.puzzleHint;
    ht.style.display='';
    tg.textContent='收起提示';
    state.puzzleHintRemaining--;
    var remEl=$('puzzle-hint-remaining');
    if(remEl){
      remEl.textContent='剩餘提示：'+state.puzzleHintRemaining+'次';
      if(state.puzzleHintRemaining<=0)remEl.classList.add('zero');
    }
  }else{
    ht.style.display='none';
    tg.textContent='提 示';
  }
}
function closePuzzle(){$('puzzle-modal').classList.remove('show');state.puzzleCallback=null;}
function submitPuzzle(){
  var val=$('puzzle-input').value.trim();
  var ok=val===state.puzzleAnswer;
  var cb=state.puzzleCallback;
  closePuzzle();
  if(cb)cb(ok);
}

/* --- 管理員問答（門扉2） --- */
function openAdmin(){
  if(!state.adminQuestions||state.adminQuestions<=0){showToast('他已經不願意回答了');return;}
  $('admin-question-text').textContent='「你想問什麼？」他推了推眼鏡。「我只回答三個問題。」';
  $('admin-count').textContent=state.adminQuestions;
  $('admin-modal').classList.add('show');
  setTimeout(function(){$('admin-answer').focus();},100);
}
function closeAdmin(){$('admin-modal').classList.remove('show');}
function askAdmin(){
  var q=$('admin-answer').value.trim();
  if(!q)return;
  state.adminQuestions--;
  $('admin-count').textContent=Math.max(0,state.adminQuestions);
  $('admin-answer').value='';
  var resp='「這裡的規則是——保持安靜。」他說。「問太多，對你沒好處。」';
  if(q.indexOf('貓')!==-1||q.indexOf('貓咪')!==-1)resp='「貓？」他愣了一下。「後樓梯那隻橘貓。牠不咬人。但別在晚上餵牠——牠會把你當同伴。」';
  else if(q.indexOf('媛媛')!==-1||q.indexOf('小女孩')!==-1)resp='「媛媛……」他沉默了很久。「她在書裡。你找不到的。除非你已經讀過那本書。」';
  else if(q.indexOf('出口')!==-1||q.indexOf('離開')!==-1||q.indexOf('門')!==-1)resp='「出口？」他指了指地板。「地毯下的暗門、五個凹槽，找齊東西門才會開。」';
  else if(q.indexOf('規則')!==-1||q.indexOf('規矩')!==-1)resp='「規則只有一條：保持安靜。出聲的東西……不是你能對付的。」';
  appendNarrative('<p class="dialogue">你問：「'+q+'」</p><p class="dialogue">'+resp+'</p>');
  if(state.adminQuestions<=0){closeAdmin();showToast('他不願意再回答了');}
}

/* --- 硬編NPC對話系統 --- */
var NPC_PROFILES = {
  laozhou:{name:'老趙',desc:'當過兩年兵，現在在質數旅館混日子。叼著煙，不愛多說話，但知道這地方的規矩。'},
  suwan:{name:'蘇晚',desc:'一個人闖進來的女孩。看起來比實際年齡成熟，眼神很警惕。'},
  akai:{name:'阿凱',desc:'嘴裡永遠叼著棒棒糖。看起來沒心沒肺，其實在偷偷觀察所有人。'},
  hotel_landlord:{name:'旅館管理員',desc:'坐在櫃檯後面撥算盤。他知道所有房間的秘密，但不會白告訴你。'},
  hotel_girl:{name:'13號房的女孩',desc:'被鎖在13號房裡的人。她說鏡子裡的東西不是她。'},
  library_admin:{name:'圖書館管理員',desc:'只給你三個問題。問錯了，他就不再回答。'},
  hospital_doctor:{name:'值班醫生',desc:'林醫生。在這家醫院待了很久，知道一些關於媛媛的事。'},
  night_nurse:{name:'夜巡護士',desc:'周敏。每個夜班都巡邏。後來她把自己推進了太平間第14格。'}
};

var DIALOGUE_TREES = {
laozhou: {
  start: "root",
  startReturning: "returning",
  nodes: {
    returning: {
      reply: "又來了。他叼著煙，沒看你。有話直說。",
      options: [
        {text: "你叫什麼名字？", next: "ask_name", condition: function(){return !hasFlag('name_laozhou');}},
        {text: "這裡是什麼地方？", next: "rules"},
        {text: "13號房是怎麼回事？", next: "room13"},
        {text: "你有沒有注意到鏡子裡的東西？", next: "mirror"},
        {text: "那個叼棒棒糖的人是誰？", next: "akai"},
        {text: "你看起來不像普通旅客。", next: "background"}
      ]
    },
    root: {
      reply: "又來一個。老趙叼著煙，上下打量你。自己找地方坐，別亂碰房間的門。",
      options: [
        {text: "你叫什麼名字？", next: "ask_name", condition: function(){return !hasFlag('name_laozhou');}},
        {text: "這裡是什麼地方？", next: "rules"},
        {text: "13號房是怎麼回事？", next: "room13"},
        {text: "你有沒有注意到鏡子裡的東西？", next: "mirror"},
        {text: "那個叼棒棒糖的人是誰？", next: "akai"},
        {text: "你看起來不像普通旅客。", next: "background"}
      ]
    },
    ask_name: {
      reply: "我？他吐了口煙。你叫什麼？",
      options: [
        {text: "陸衍。", next: "name_answer"},
        {text: "先說你的。", next: "ask_name_persist"}
      ]
    },
    ask_name_persist: {
      reply: "你還是先說你的吧。他叼著煙，不看你。名字這東西，在這兒沒那麼要緊。",
      options: [
        {text: "陸衍。", next: "name_answer"}
      ]
    },
    name_answer: {
      reply: "陸衍。他重複了一遍，像在記什麼。行。記住這名字，別隨便跟人說。",
      onVisit: function(s){s.flags['name_laozhou']=true;},
      options: [
        {text: "為什麼不能說？", next: "rules"},
        {text: "你還沒說你叫什麼。", next: "laozhou_name"},
        {text: "……算了。", next: "root"}
      ]
    },
    laozhou_name: {
      reply: "「老趙」。他不耐煩地擺擺手。當過兩年兵，沒別的。別追問。",
      options: [
        {text: "當兵的怎麼會在這裡？", next: "background"},
        {text: "說說規矩吧。", next: "rules"},
        {text: "……哦。", next: "root"}
      ]
    },
    rules: {
      reply: "規矩？他哼了一聲。這旅館只有一條規矩——進質數的房間。別的，碰都別碰。",
      options: [
        {text: "什麼叫質數？", next: "rules_prime"},
        {text: "誰定的規矩？", next: "rules_who"},
        {text: "違反了會怎樣？", next: "rules_violate"},
        {text: "13也是質數，為什麼鎖著？", next: "room13"}
      ]
    },
    rules_prime: {
      reply: "質數都不懂？他皺眉。除了自己和一，除不盡的。二、三、五、七、十一……數學課都睡覺了？",
      options: [
        {text: "13也是質數，為什麼鎖著？", next: "room13"},
        {text: "你怎麼知道這些？", next: "rules_who"},
        {text: "……知道了。", next: "root"}
      ]
    },
    rules_who: {
      reply: "怎麼知道？他眼神閃了一下。活下來的人都知道。前一批……算了。",
      options: [
        {text: "前一批怎麼了？", next: "rules_before"},
        {text: "不想說就別說。", next: "root"}
      ]
    },
    rules_before: {
      reply: "沒了。他兩個字擲過來。推開一間不該開的門，人就沒了。連聲都沒出。",
      options: [
        {text: "你親眼看過？", next: "rules_see"},
        {text: "那你怎麼活下來的？", next: "background"},
        {text: "……", next: "root"}
      ]
    },
    rules_see: {
      reply: "他沉默了幾秒。看過。所以我勸你，別好奇。煙灰掉在褲腿上，他沒拍。",
      options: [
        {text: "你怕了。", next: "fear"},
        {text: "謝了。", next: "root"}
      ]
    },
    rules_violate: {
      reply: "怎樣？他聲音沉下來。你想看？我不攔你。死了別怪我沒說。",
      options: [
        {text: "13號房呢？", next: "room13"},
        {text: "我只是問問。", next: "root"}
      ]
    },
    room13: {
      reply: "13？他左右掃了一眼，壓低聲音。那間……別碰。鎖著不是沒有原因。",
      options: [
        {text: "為什麼鎖著？", next: "room13_lock"},
        {text: "裡面有什麼？", next: "room13_inside"},
        {text: "你開過嗎？", next: "room13_tried"},
        {text: "……我知道了。", next: "root"}
      ]
    },
    room13_lock: {
      reply: "裡頭有什麼我不知道。他搖頭。我只知道，輪到你開的時候，別選它。",
      options: [
        {text: "輪到我？什麼意思？", next: "room13_turn"}
      ]
    },
    room13_inside: {
      reply: "問這麼多幹嘛。他站起來，又坐下。能不看就不看。",
      options: [
        {text: "你知道裡面有東西。", next: "room13_know"},
        {text: "……算了。", next: "root"}
      ]
    },
    room13_know: {
      reply: "他盯著你看了半晌，終於從鼻子出氣。知道又怎樣。他別過頭。走開。",
      options: []
    },
    room13_tried: {
      reply: "他瞪你。你以為我活膩了？頓了頓。……試過。拉不動。",
      options: [
        {text: "你在怕什麼。", next: "fear"},
        {text: "……拉不動？", next: "root"}
      ]
    },
    room13_turn: {
      reply: "這旅館會逼你選。他聲音硬邦邦的。選錯一次，就完了。懂？",
      options: [
        {text: "誰逼？", next: "room13_who"},
        {text: "……懂了。", next: "root"}
      ]
    },
    room13_who: {
      reply: "我他媽怎麼知道。他突然火大。牆？樓梯？那個笑咪咪的阿凱？",
      options: []
    },
    mirror: {
      reply: "鏡子。他嘴角抽了一下。你看了？",
      options: [
        {text: "鏡子裡哪裡不對？", next: "mirror_what"},
        {text: "我看過，裡面……", next: "mirror_saw"},
        {text: "隨便問問。", next: "root"}
      ]
    },
    mirror_what: {
      reply: "別盯著看太久。他打斷你。就這樣。別問了。",
      options: []
    },
    mirror_saw: {
      reply: "他沒說話，手指在膝蓋上敲了兩下。……動得比我慢半拍。",
      options: [
        {text: "什麼意思？", next: "mirror_meaning"},
        {text: "……我知道了。", next: "root"}
      ]
    },
    mirror_meaning: {
      reply: "意思就是，他聲音很低。那東西不是你。別確認了。",
      options: []
    },
    akai: {
      reply: "阿凱？他往旁邊努努嘴，聲音壓低。那小子……你少跟他搭話。",
      options: [
        {text: "他怎麼了？", next: "akai_wrong"},
        {text: "為什麼這麼說？", next: "akai_wrong"}
      ]
    },
    akai_wrong: {
      reply: "說不上來。他眯眼。笑，嘴裡叼著糖，一副無所謂。可他從來不問規矩。",
      options: [
        {text: "他本來就知道規矩？", next: "akai_known"},
        {text: "你懷疑他是……", next: "akai_suspect"},
        {text: "也許他只是心大。", next: "root"}
      ]
    },
    akai_known: {
      reply: "知道？他冷笑。活了這麼久的人，哪個不是提心吊膽？只有他，像來玩的。",
      options: [
        {text: "也許他運氣好。", next: "akai_lucky"},
        {text: "……有道理。", next: "root"}
      ]
    },
    akai_lucky: {
      reply: "運氣？他哼。我當兵的時候，不信運氣。我只信眼睛看到的。",
      options: []
    },
    akai_suspect: {
      reply: "他立刻瞪你。別亂說。聲音壓得更低。尤其當著他的面。",
      options: []
    },
    background: {
      reply: "當兵的怎麼在這？他嗤笑。睡著了，醒來就在。還能怎麼著。",
      options: [
        {text: "你有同伴在這嗎？", next: "background_comrade"},
        {text: "……行吧。", next: "root"}
      ]
    },
    background_comrade: {
      reply: "他臉繃了一下。……沒有。兩個字，咬得很死。",
      options: []
    },
    fear: {
      reply: "我怕？他猛地站起來，椅子劃地一聲。放狗屁。老子什麼沒見過。",
      options: [
        {text: "你手在抖。", next: "fear_tremble"},
        {text: "當我沒說。", next: "root"}
      ]
    },
    fear_tremble: {
      reply: "他把手塞進口袋。……抽煙抽多了。轉過身。別再問了。",
      options: []
    }
  }
},
suwan: {
  start: "root",
  startReturning: "returning",
  nodes: {
    returning: {
      reply: "她抬頭看你一眼，又低下。……你還在。",
      options: [
        {text: "你叫什麼名字？", next: "ask_name", condition: function(){return !hasFlag('name_suwan');}},
        {text: "你在這裡待多久了？", next: "howlong"},
        {text: "這旅館的規矩你知道嗎？", next: "rules"},
        {text: "13號房是怎麼回事？", next: "room13"},
        {text: "你有沒有注意到鏡子？", next: "mirror"},
        {text: "那個人……叼棒棒糖的，是同伴嗎？", next: "akai"},
        {text: "你一個人？", next: "past"}
      ]
    },
    root: {
      reply: "蘇晚坐在樓梯階上，膝蓋上放著一本沒打開的書。她看了你一眼，又移開。",
      options: [
        {text: "你叫什麼名字？", next: "ask_name", condition: function(){return !hasFlag('name_suwan');}},
        {text: "你在這裡待多久了？", next: "howlong"},
        {text: "這旅館的規矩你知道嗎？", next: "rules"},
        {text: "13號房是怎麼回事？", next: "room13"},
        {text: "你有沒有注意到鏡子？", next: "mirror"},
        {text: "那個人……叼棒棒糖的，是同伴嗎？", next: "akai"},
        {text: "你一個人？", next: "past"}
      ]
    },
    ask_name: {
      reply: "她看了你三秒。……你先說。",
      options: [
        {text: "陸衍。", next: "name_answer"},
        {text: "為什麼我先？", next: "ask_name_persist"}
      ]
    },
    ask_name_persist: {
      reply: "你還是先說吧。她把書翻了一頁，沒看你。問這麼多做什麼。",
      options: [
        {text: "陸衍。", next: "name_answer"}
      ]
    },
    name_answer: {
      reply: "陸衍。她重複得很輕，像在咀嚼這兩個字。嗯。",
      onVisit: function(s){s.flags['name_suwan']=true;},
      options: [
        {text: "你還沒說你叫什麼。", next: "suwan_name"},
        {text: "……嗯。", next: "root"}
      ]
    },
    suwan_name: {
      reply: "「蘇晚」。兩個字，沒有語氣。不用記。",
      options: [
        {text: "為什麼不用記？", next: "leave"},
        {text: "……好。", next: "root"}
      ]
    },
    howlong: {
      reply: "夠久了。她翻了一下書，沒看字。久到記不清外面的天。",
      options: [
        {text: "你見過別人出去嗎？", next: "leave"},
        {text: "……我懂了。", next: "root"}
      ]
    },
    rules: {
      reply: "質數房。她沒抬頭。你沒聽別人說？",
      options: [
        {text: "我想聽你說。", next: "rules_listen"},
        {text: "非質數的房間會怎樣？", next: "rules_death"},
        {text: "……知道了。", next: "root"}
      ]
    },
    rules_listen: {
      reply: "進質數。她重複一遍，像在背課文。別的，別碰。這就是全部。",
      options: [
        {text: "誰告訴你的？", next: "rules_told"},
        {text: "……多謝。", next: "root"}
      ]
    },
    rules_told: {
      reply: "……前一個人。她書頁停住了。他現在不在了。",
      options: [
        {text: "他怎麼了？", next: "rules_gone"},
        {text: "……抱歉。", next: "root"}
      ]
    },
    rules_gone: {
      reply: "他推錯了門。平靜得像在說天氣。我在走廊盡頭，聽到一聲。就一聲。",
      options: [
        {text: "你當時為什麼不阻止他？", next: "rules_stop"},
        {text: "……", next: "root"}
      ]
    },
    rules_stop: {
      reply: "我站在那裡。她終於看你。動不了。手腳都動不了。",
      options: []
    },
    rules_death: {
      reply: "死。一個字。她終於把書闔上。你以為是什麼？",
      options: [
        {text: "13號房呢？", next: "room13"},
        {text: "……沒事。", next: "root"}
      ]
    },
    room13: {
      reply: "13是質數。她說。但它鎖著。",
      options: [
        {text: "為什麼鎖著？", next: "room13_why"},
        {text: "你試過開嗎？", next: "room13_try"},
        {text: "……哦。", next: "root"}
      ]
    },
    room13_why: {
      reply: "因為裡面的東西，她聲音很輕，不該放出來。",
      options: [
        {text: "裡面是什麼？", next: "room13_inside"},
        {text: "……知道了。", next: "root"}
      ]
    },
    room13_inside: {
      reply: "我不知道。她搖頭。我只知道，上一個試著開它的人，後來不說話了。",
      options: [
        {text: "他怎麼了？", next: "room13_after"},
        {text: "……", next: "root"}
      ]
    },
    room13_after: {
      reply: "他還在走廊走。她看著樓梯下方。但他已經不是他了。",
      options: []
    },
    room13_try: {
      reply: "你問我試過沒有？她笑了一下，很短。我活得比你以為的久。",
      options: []
    },
    mirror: {
      reply: "鏡子。她站起來。你被它跟上了？",
      options: [
        {text: "跟上？什麼意思？", next: "mirror_follow"},
        {text: "鏡子裡到底是什麼？", next: "mirror_what"},
        {text: "沒有。", next: "root"}
      ]
    },
    mirror_follow: {
      reply: "你照鏡子的時候，她湊近一步，聲音冷。裡面那個，有沒有慢半拍？",
      options: [
        {text: "……有。", next: "mirror_yes"},
        {text: "沒有。", next: "mirror_no"},
        {text: "我不知道。", next: "root"}
      ]
    },
    mirror_yes: {
      reply: "那就別再照了。她退開。下次它不快了，你就出不來了。",
      options: []
    },
    mirror_no: {
      reply: "她看了你一眼，沒再說話。最好如此。她轉身。",
      options: []
    },
    mirror_what: {
      reply: "不是我。她盯著你身後的鏡子。也不是你。別問我是什麼。",
      options: []
    },
    akai: {
      reply: "阿凱。她唸這個名字像在含著冰。你覺得他正常？",
      options: [
        {text: "他看起來挺開心的。", next: "akai_happy"},
        {text: "你察覺什麼了？", next: "akai_notice"},
        {text: "……還好。", next: "root"}
      ]
    },
    akai_happy: {
      reply: "這地方，她直視你。誰會開心？",
      options: []
    },
    akai_notice: {
      reply: "他不睡覺。她垂下眼。我看了他三個晚上。他一直在走廊走。",
      options: [
        {text: "也許他失眠。", next: "akai_insomnia"},
        {text: "……然後？", next: "root"}
      ]
    },
    akai_insomnia: {
      reply: "他不吃東西，只舔那根糖。她聲音沒有起伏。糖不會化。你注意過嗎？",
      options: [
        {text: "……沒有。", next: "akai_candy"},
        {text: "也許他藏了別的。", next: "root"}
      ]
    },
    akai_candy: {
      reply: "那根棒棒糖，她轉回頭。我進來那天他就叼著。現在還在。",
      options: []
    },
    leave: {
      reply: "出去？她像聽到一個笑話。你以為有出去這回事？",
      options: [
        {text: "你試過？", next: "leave_try"},
        {text: "難道要一直待在這？", next: "leave_stay"},
        {text: "……也是。", next: "root"}
      ]
    },
    leave_try: {
      reply: "我同伴有試過。她終於有了表情，很淡。他走了七層樓梯，回到同一個走廊。",
      options: [
        {text: "後來呢？", next: "names_missing"},
        {text: "……", next: "root"}
      ]
    },
    names_missing: {
      reply: "後來？她把書翻過一頁，指腹壓著書脊，像在數什麼。我每晚睡以前數人。老趙。阿凱。我自己。一、二、三。她停了一下，聲音更輕。剛來那陣子是四個。第四個叫什麼——她眉頭動了動，像在一間空屋子裡找一把鑰匙。想不起來了。也許本來就沒有第四個。",
      options: []
    },
    leave_stay: {
      reply: "待著。她重新打開書。活一天算一天。別指望出口。",
      options: []
    },
    past: {
      reply: "一個人？她看著書。曾經不是。",
      options: [
        {text: "同伴呢？", next: "past_comrade"},
        {text: "……抱歉。", next: "root"}
      ]
    },
    past_comrade: {
      reply: "死了。兩個字。開錯門。我站在旁邊。",
      options: [
        {text: "你自責？", next: "past_blame"},
        {text: "……我不問了。", next: "root"}
      ]
    },
    past_blame: {
      reply: "自責有用？她終於冷笑。有用的話，我早死一百次了。",
      options: []
    }
  }
},
akai: {
  start: "root",
  startReturning: "returning",
  nodes: {
    returning: {
      reply: "喲！他揮揮棒棒糖。又見啦！",
      options: [
        {text: "你叫什麼名字？", next: "ask_name", condition: function(){return !hasFlag('name_akai');}},
        {text: "這是什麼地方？", next: "where"},
        {text: "你知道旅館的規矩嗎？", next: "rules"},
        {text: "13號房怎麼了？", next: "room13"},
        {text: "鏡子裡好像有東西。", next: "mirror"},
        {text: "你一直待在這？", next: "here"},
        {text: "你到底是什麼人？", next: "suspect"}
      ]
    },
    root: {
      reply: "阿凱靠在走廊牆上，嘴裡叼著草莓棒棒糖，看見你立刻揮手。嗨！新來的？太好了，這裡悶死了。",
      options: [
        {text: "你叫什麼名字？", next: "ask_name", condition: function(){return !hasFlag('name_akai');}},
        {text: "這是什麼地方？", next: "where"},
        {text: "你知道旅館的規矩嗎？", next: "rules"},
        {text: "13號房怎麼了？", next: "room13"},
        {text: "鏡子裡好像有東西。", next: "mirror"},
        {text: "你一直待在這？", next: "here"},
        {text: "你到底是什麼人？", next: "suspect"}
      ]
    },
    ask_name: {
      reply: "我？他把糖抽出來，指著你。你先說你叫什麼！",
      options: [
        {text: "陸衍。", next: "name_answer"},
        {text: "你先說。", next: "ask_name_persist"}
      ]
    },
    ask_name_persist: {
      reply: "哎呀別客氣嘛！他揮揮手。你先說你先說，我不虧你的。",
      options: [
        {text: "陸衍。", next: "name_answer"}
      ]
    },
    name_answer: {
      reply: "陸衍！他眼睛一亮，把糖又塞回去。好名字好名字，我記住啦！",
      onVisit: function(s){s.flags['name_akai']=true;},
      options: [
        {text: "你呢？", next: "akai_name"},
        {text: "……隨便你。", next: "root"}
      ]
    },
    akai_name: {
      reply: "「阿凱」！他拍了拍胸口。大家都叫我阿凱。你也這麼叫就好。",
      options: [
        {text: "你在這多久了？", next: "howlong"},
        {text: "……好。", next: "root"}
      ]
    },
    where: {
      reply: "這裡啊～他拖長聲音，環顧走廊。旅館唄。房間很多，慢慢逛。",
      options: [
        {text: "所有房間都能進嗎？", next: "tempt_all"},
        {text: "你住哪間？", next: "tempt_room"},
        {text: "……嗯。", next: "root"}
      ]
    },
    howlong: {
      reply: "多久？他愣了一下，撓頭。唔……忘了耶。反正糖果還沒吃完嘛。",
      options: [
        {text: "這棒棒糖不會化？", next: "candy"},
        {text: "……行。", next: "root"}
      ]
    },
    candy: {
      reply: "化？他笑著舉起糖看了看。不會啊，這糖可耐吃了。你要不要也來一根？",
      options: [
        {text: "不用了。", next: "candy_no"},
        {text: "……你哪來的糖？", next: "root"}
      ]
    },
    candy_no: {
      reply: "真可惜。他聳肩。甜的。這地方唯一的好東西。",
      options: []
    },
    rules: {
      reply: "規矩？他眨眨眼。什麼規矩？這裡還要規矩？",
      options: [
        {text: "聽說只能進質數房。", next: "rules_prime"},
        {text: "你都住哪種房間？", next: "tempt_any"},
        {text: "……沒什麼。", next: "root"}
      ]
    },
    rules_prime: {
      reply: "質數——他拖長音，像在想。哦～就是那種很挑的數字對吧。他笑。哪有那麼講究。",
      options: [
        {text: "不是挑不挑的問題。", next: "rules_why"},
        {text: "你住過非質數房間嗎？", next: "tempt_nonprime"},
        {text: "……隨便你。", next: "root"}
      ]
    },
    rules_why: {
      reply: "哎呀，別那麼緊張嘛。他揮手。一間房間而已，打開看看又不會怎樣。",
      options: [
        {text: "你怎麼知道不會怎樣？", next: "rules_how"},
        {text: "……也對。", next: "root"}
      ]
    },
    rules_how: {
      reply: "我——他張嘴，又停住，像忘記要說什麼。嗯……反正啦。他笑。",
      options: []
    },
    tempt_all: {
      reply: "全部都能進啊？他眼睛彎起來。這麼多房間，一間間開，多好玩。",
      options: [
        {text: "開錯了怎麼辦？", next: "tempt_wrong"},
        {text: "……慢慢逛。", next: "root"}
      ]
    },
    tempt_wrong: {
      reply: "錯了？他歪頭。錯……會怎樣？他笑得若無其事。我不知道耶。",
      options: []
    },
    tempt_room: {
      reply: "我住啊——他指了指走廊隨便一間。那間。隨便進的。他根本沒看房號。",
      options: [
        {text: "你看清楚那是幾號？", next: "tempt_number"},
        {text: "……隨便。", next: "root"}
      ]
    },
    tempt_number: {
      reply: "幾號？他湊過去看了一眼，笑出來。哎，數字我最頭痛了。反正能開嘛。",
      options: []
    },
    tempt_any: {
      reply: "我啊？他舔了舔糖。都住過耶。走到哪睡到哪。",
      options: [
        {text: "你沒出事過？", next: "tempt_safe"},
        {text: "……厲害。", next: "root"}
      ]
    },
    tempt_safe: {
      reply: "出事？他愣了半拍，然後大笑。我命硬啦！放心！",
      options: []
    },
    tempt_nonprime: {
      reply: "非質數——他唸得很開心。哦～你是說那些不能進的？他突然壓低聲音。其實……我試過。",
      options: [
        {text: "裡面是什麼？", next: "tempt_inside"},
        {text: "……別說了。", next: "root"}
      ]
    },
    tempt_inside: {
      reply: "裡面啊——他眼珠轉一圈，笑得曖昧。不告訴你。你自己去看嘛。",
      options: []
    },
    room13: {
      reply: "13？他壓低聲音，像講秘密。那間鎖著耶。你不覺得，鎖著的東西最想打開嗎？",
      options: [
        {text: "你想打開？", next: "room13_want"},
        {text: "裡面有什麼？", next: "room13_inside"},
        {text: "……不想。", next: "root"}
      ]
    },
    room13_want: {
      reply: "想啊。他坦白得可愛。可是拉不動。奇怪，我力氣不小的。",
      options: []
    },
    room13_inside: {
      reply: "誰知道。他聳肩。也許是寶藏？也許是出口？誰不打開誰知道。",
      options: []
    },
    mirror: {
      reply: "鏡子？他說這兩個字的時候，視線飄開了。不知不覺，他已經把身子側過去，背對著走廊盡頭那面鏡子。喔，那個啊。你看過？",
      options: [
        {text: "鏡子裡的你怪怪的。", next: "mirror_you"},
        {text: "裡面是什麼？", next: "mirror_what"},
        {text: "你自己……照過鏡子嗎？", next: "mirror_self"},
        {text: "隨便看看。", next: "root"}
      ]
    },
    mirror_you: {
      reply: "怪怪的？他湊近你，笑得沒心沒肺。哪裡怪？跟我長得不一樣嗎？",
      options: [
        {text: "鏡子裡的你慢半拍。", next: "mirror_late"},
        {text: "……沒什麼。", next: "root"}
      ]
    },
    mirror_late: {
      reply: "慢半拍？他認真想了想。哦……或許吧。他又笑。鏡子本來就這樣子啦。他說話的尾音在走廊裡多蕩了一下，像有人隔了半秒，把同一句又輕輕複述了一遍。你回頭。身後沒人。",
      options: []
    },
    mirror_self: {
      reply: "我？他愣了一下，棒棒糖在嘴裡轉了半圈。我幹嘛照鏡子。他笑，笑得有點快。長得就這樣子，看了也不會變。他抬起手，像要捋頭髮，手舉到一半又放下了。走吧走吧，別站在這兒。",
      options: []
    },
    mirror_what: {
      reply: "鏡子裡啊——他拖長聲音。有另一個世界？你要不要對著它問問話？",
      options: []
    },
    here: {
      reply: "這裡？他環顧四周，笑嘻嘻。挺好的呀。不用上班，不用交房租。",
      options: [
        {text: "你不想出去？", next: "here_leave"},
        {text: "……也是。", next: "root"}
      ]
    },
    here_leave: {
      reply: "出去？他像聽不懂。出去幹嘛？這裡不好嗎？他舔了口糖。再陪我嘛。",
      options: []
    },
    suspect: {
      reply: "什麼人？他哈哈大笑。我是人啊！你看，有手有腳，會說話。他戳了戳自己臉頰。",
      options: [
        {text: "你不怕死嗎？", next: "suspect_afraid"},
        {text: "你根本不記得自己怎麼來的。", next: "suspect_remember"},
        {text: "……隨便問問。", next: "root"}
      ]
    },
    suspect_afraid: {
      reply: "死？他眨眨眼。死是什麼？他笑得很甜。聽起來好遠喔。",
      options: []
    },
    suspect_remember: {
      reply: "怎麼來的……他皺眉，努力想。唔……唔……他突然笑開。忘了！想不起來就算啦！",
      options: []
    }
  }
},
hotel_landlord: {
  start: "root",
  startReturning: "returning",
  nodes: {
    returning: {
      reply: "（眼皮沒抬，算盤珠子撥了一下。）……又來了。說吧。",
      options: [
        {text: "這旅館的房間，有什麼講究嗎？", next: "ask_rules"},
        {text: "十三號房為什麼鎖著？", next: "ask_13"},
        {text: "樓上那面鏡子，是怎麼回事？", next: "ask_mirror"},
        {text: "地下室可以下去嗎？", next: "ask_basement"},
        {text: "你叫什麼名字？", next: "ask_name", condition: function(){return !hasFlag('name_hotel_landlord');}},
        {text: "我叫陸衍。", next: "introduce_yan", condition: function(){return !hasFlag('name_hotel_landlord');}},
        {text: "現在……幾點了？", next: "ask_time"},
        {text: "十三號房裡住著誰？", next: "ask_girl"},
        {text: "沒事了。", next: "end_root"}
      ]
    },
    root: {
      reply: "……嗯。住店？身份證壓在櫃檯，房間自己看門牌。別敲不該敲的門。",
      options: [
        {text: "這旅館的房間，有什麼講究嗎？", next: "ask_rules"},
        {text: "十三號房為什麼鎖著？", next: "ask_13"},
        {text: "樓上那面鏡子，是怎麼回事？", next: "ask_mirror"},
        {text: "地下室可以下去嗎？", next: "ask_basement"},
        {text: "你叫什麼名字？", next: "ask_name", condition: function(){return !hasFlag('name_hotel_landlord');}},
        {text: "我叫陸衍。", next: "introduce_yan", condition: function(){return !hasFlag('name_hotel_landlord');}},
        {text: "現在……幾點了？", next: "ask_time"},
        {text: "十三號房裡住著誰？", next: "ask_girl"},
        {text: "沒事了。", next: "end_root"}
      ]
    },

    ask_rules: {
      reply: "規矩就是規矩。……門牌號數，看得懂吧？看得懂就不會死。看不懂，活著也沒用。",
      options: [
        {text: "什麼意思？哪些房間不能進？", next: "prime_detail"},
        {text: "你少裝糊塗，說清楚。", next: "dodge_rules"},
        {text: "算了，沒事。", next: "root"}
      ]
    },
    prime_detail: {
      reply: "……背得出來就進不去。背不出來，更進不去。我說過了，規矩就是規矩。",
      options: [
        {text: "非質數的房間，進去會怎樣？", next: "death_warn"},
        {text: "你到底知道什麼？", next: "dodge_rules"},
        {text: "不問了。", next: "end_tired"}
      ]
    },
    dodge_rules: {
      reply: "（眨了眨眼，像沒聽見）……退房時間十二點。過了十二點，我不管。",
      options: [
        {text: "你們這裡，有誰成功退過房？", next: "checkout_history"},
        {text: "我再問一次——十三號房。", next: "ask_13"},
        {text: "（離開）", next: "end_back"}
      ]
    },
    checkout_history: {
      reply: "退房？……（像在回憶）有過。有過人拿著鑰匙走到大門。後來……後來我沒看過他們出去。",
      options: [
        {text: "那他們去哪了？", next: "where_did_they_go"},
        {text: "（我知道了）", next: "end_tired"}
      ]
    },
    where_did_they_go: {
      reply: "……樓下。或者鏡子。……這個旅館，只有兩個方向。",
      options: [
        {text: "（兩個方向都是死路）", next: "end_back"}
      ]
    },
    death_warn: {
      reply: "（慢吞吞地抬眼）……進去的人，從來沒出來過。這還不夠嗎？",
      options: [
        {text: "那你為什麼不阻止？", next: "why_not"},
        {text: "地下室呢？地下室也有規矩？", next: "ask_basement"},
        {text: "（不再追問）", next: "end_tired"}
      ]
    },
    why_not: {
      reply: "阻止？我一個看櫃檯的。……規矩就是規矩。住客自己選的門，自己負責。",
      options: [
        {text: "你也是被這地方困住的吧？", next: "trapped"},
        {text: "鏡子那邊呢？", next: "ask_mirror"},
        {text: "（走開）", next: "end_back"}
      ]
    },
    trapped: {
      reply: "（沉默很久）……睡吧。年輕人。睡著了就不想了。",
      options: [
        {text: "你在這裡待了多久？", next: "how_long"},
        {text: "（不再說話）", next: "end_tired"}
      ]
    },
    how_long: {
      reply: "忘了。……日曆上的日子，不算數。鐘錶上的也不算數。",
      options: [
        {text: "那什麼才算數？", next: "what_counts"},
        {text: "我知道了。", next: "end_back"}
      ]
    },
    what_counts: {
      reply: "（咧嘴，不像笑）……門開了幾次。人少了幾個。就這些。",
      options: [
        {text: "十三號房那個女孩——", next: "ask_girl"},
        {text: "（他不願再說了）", next: "end_tired"}
      ]
    },

    ask_13: {
      reply: "（眼神動了一下，又垂下去）十三……鎖著。鑰匙不在我這。從來不在我這。",
      options: [
        {text: "鑰匙在哪？", next: "key_where"},
        {text: "誰把房間鎖起來的？", next: "who_lock"},
        {text: "裡面有人嗎？", next: "inside_13"},
        {text: "（回到主題）", next: "root"}
      ]
    },
    key_where: {
      reply: "在該在的地方。……不在該在的地方，就找不到。找到了也不該開。",
      options: [
        {text: "你知道在哪，對吧？", next: "dodge_key"},
        {text: "（換個話題）", next: "root"}
      ]
    },
    dodge_key: {
      reply: "（打了個哈欠）……我看你也累了。回去睡吧。",
      options: [
        {text: "我不困。", next: "not_tired"},
        {text: "（他在下逐客令）", next: "end_back"}
      ]
    },
    not_tired: {
      reply: "（慢吞吞地搖頭）……現在說不困的人，到了半夜都會敲我的門。……敲了也沒用。",
      options: [
        {text: "半夜會怎樣？", next: "midnight"},
        {text: "（我先回房間）", next: "end_tired"}
      ]
    },
    midnight: {
      reply: "……十二點。鐘一到十二點，走廊就不長這樣了。……你最好別出來。",
      options: [
        {text: "走廊會變成什麼？", next: "corridor_changes"},
        {text: "（我記住了）", next: "end_back"}
      ]
    },
    corridor_changes: {
      reply: "……多一扇門。少一扇門。……門牌號數，會自己換位置。",
      options: [
        {text: "（所以十二點後不能亂走）", next: "end_tired"}
      ]
    },
    who_lock: {
      reply: "……上一個住的人。或者上上個。記不清了。鎖上了，就別打開。",
      options: [
        {text: "為什麼鎖？", next: "why_lock"},
        {text: "（繼續追問）", next: "inside_13"}
      ]
    },
    why_lock: {
      reply: "因為裡面的東西，出來過一次。……一次就夠了。",
      options: [
        {text: "出來過的是什麼？", next: "what_came_out"},
        {text: "十三號房那個女孩，還活著嗎？", next: "ask_girl"},
        {text: "（不再問）", next: "end_tired"}
      ]
    },
    what_came_out: {
      reply: "（搖頭，很慢）……別問。問了我也不會說。規矩就是規矩。",
      options: [
        {text: "鏡子呢？鏡子也有規矩？", next: "ask_mirror"},
        {text: "（他真的不說了）", next: "end_tired"}
      ]
    },
    inside_13: {
      reply: "（盯著檯燈）……有人。一直有人。你敲門，她會應。應了，也別開。",
      options: [
        {text: "她是誰？", next: "ask_girl"},
        {text: "為什麼不能開？", next: "why_not_open"},
        {text: "（離開櫃檯）", next: "end_back"}
      ]
    },
    why_not_open: {
      reply: "開了，她就會出來。……或者，裡面那個，會換人進去。",
      options: [
        {text: "換誰？", next: "swap"},
        {text: "（這暗示太清楚了）", next: "end_tired"}
      ]
    },
    swap: {
      reply: "……你說呢？進了那條走廊的人，少一個，十三號房就多一個聲音。",
      options: [
        {text: "所以那女孩已經——", next: "she_dead"},
        {text: "我懂了。謝謝。", next: "end_back"}
      ]
    },
    she_dead: {
      reply: "（很慢地眨眼）……別說出來。說出來，她會聽見。",
      options: [
        {text: "鏡子裡的，又是什麼？", next: "ask_mirror"},
        {text: "（安靜地退開）", next: "end_tired"}
      ]
    },

    ask_mirror: {
      reply: "（像背台詞）鏡子……照人。不照鬼。……你照過，對吧。",
      options: [
        {text: "鏡子裡的不是我。", next: "not_me"},
        {text: "誰把鏡子放那裡的？", next: "who_mirror"},
        {text: "鏡子和十三號房有關係？", next: "mirror_13"},
        {text: "（不談了）", next: "root"}
      ]
    },
    not_me: {
      reply: "（終於正眼看你）……對。不是你。你看它，它也在看你。別看太久。",
      options: [
        {text: "太久會怎樣？", next: "too_long"},
        {text: "它想出來？", next: "want_out_mirror"},
        {text: "（這句話夠了）", next: "end_tired"}
      ]
    },
    want_out_mirror: {
      reply: "……它不急。它有的是時間。你沒有。",
      options: [
        {text: "什麼意思？", next: "no_time"},
        {text: "（我懂了）", next: "end_back"}
      ]
    },
    no_time: {
      reply: "你住進來，就開始倒數。……它等得起。你呢？",
      options: [
        {text: "倒數到什麼？", next: "countdown_what"},
        {text: "（我不想知道）", next: "end_tired"}
      ]
    },
    countdown_what: {
      reply: "……到你分不清哪個是你。那個時候，它就出來了。",
      options: [
        {text: "（原來如此）", next: "end_back"}
      ]
    },
    too_long: {
      reply: "……它會先學會你的臉。再來，就換它出來，你進去。",
      options: [
        {text: "進去哪？鏡子裡？", next: "inside_mirror"},
        {text: "和地下室一樣？", next: "ask_basement"}
      ]
    },
    inside_mirror: {
      reply: "鏡子裡和地下室，是一個地方。……別問我怎麼知道的。",
      options: [
        {text: "你去過？", next: "he_been"},
        {text: "（原來如此）", next: "end_tired"}
      ]
    },
    he_been: {
      reply: "（很久沒說話）……出去過一次。出來的，還是不是我，我不記得。",
      options: [
        {text: "你現在……還是你嗎？", next: "still_you"},
        {text: "（他不願再說）", next: "end_back"}
      ]
    },
    still_you: {
      reply: "（咧嘴，那種不像笑的笑）……規矩就是規矩。我是管理員。這就夠了。",
      options: [
        {text: "（不再追問）", next: "end_tired"}
      ]
    },
    who_mirror: {
      reply: "放鏡子的人，不在了。……鏡子留下來，比他久。",
      options: [
        {text: "為什麼要放鏡子？", next: "why_mirror"},
        {text: "（換話題）", next: "root"}
      ]
    },
    why_mirror: {
      reply: "……照東西用的。有些東西，需要被照住。照住了，才不會滿處跑。",
      options: [
        {text: "照住的是什麼？", next: "what_held"},
        {text: "和十三號房有關？", next: "mirror_13"}
      ]
    },
    what_held: {
      reply: "（低聲）……別說名字。說名字它會應。",
      options: [
        {text: "（我知道了）", next: "end_tired"}
      ]
    },
    mirror_13: {
      reply: "（點頭，很慢）……鏡子照走廊。走廊連十三。十三連地下室。一條線。",
      options: [
        {text: "一條線？什麼意思？", next: "one_line"},
        {text: "所以順著鏡子就能找到十三號房？", next: "mirror_find_13"},
        {text: "（我先到這）", next: "end_back"}
      ]
    },
    one_line: {
      reply: "進來的人，走到頭。……鏡子是起點，地下室是盡頭。中間十三。",
      options: [
        {text: "走到盡頭會怎樣？", next: "end_of_line"},
        {text: "（這地圖我記下了）", next: "end_tired"}
      ]
    },
    end_of_line: {
      reply: "……走到盡頭，就不用退房了。",
      options: [
        {text: "不用退房是什麼意思？", next: "no_checkout"},
        {text: "（他笑了一下，我不愛聽）", next: "end_back"}
      ]
    },
    no_checkout: {
      reply: "永遠留下。……或者，永遠走出去。誰知道。",
      options: [
        {text: "有人走出去過嗎？", next: "anyone_out"},
        {text: "（我不想知道了）", next: "end_tired"}
      ]
    },
    anyone_out: {
      reply: "（搖頭）……我看了這麼多年櫃檯。出去的，我一個都沒見過。",
      options: [
        {text: "那進來的呢？", next: "who_come_in"},
        {text: "（謝謝你說這些）", next: "end_back"}
      ]
    },
    who_come_in: {
      reply: "一個一個。……背著包，以為是旅館。以為住一晚就能走。",
      options: [
        {text: "包括我？", next: "including_me"},
        {text: "（我該走了）", next: "end_tired"}
      ]
    },
    including_me: {
      reply: "（看了一眼鐘）……包括你。還差幾步，就到你了。",
      options: [
        {text: "（背一涼）", next: "end_back"}
      ]
    },
    mirror_find_13: {
      reply: "……別照著走。照著走，你會先看見自己。",
      options: [
        {text: "（明白）", next: "end_tired"}
      ]
    },

    ask_basement: {
      reply: "地下室……有鎖。鎖鏽了。……下去的人，沒有上來過。",
      options: [
        {text: "下面有什麼？", next: "what_below"},
        {text: "鎖為什麼鏽了？", next: "rust_lock"},
        {text: "和鏡子有什麼關係？", next: "basement_mirror"},
        {text: "（先不問了）", next: "root"}
      ]
    },
    what_below: {
      reply: "（沉默很久）……比走廊更深的東西。……別下去。這是規矩。",
      options: [
        {text: "你下過？", next: "he_down"},
        {text: "為什麼規矩不寫在門口？", next: "why_not_sign"},
        {text: "（他說的我記住了）", next: "end_tired"}
      ]
    },
    why_not_sign: {
      reply: "寫了，你會看。……不寫，你才會因為好奇下去。……這就是規矩。",
      options: [
        {text: "（規矩是故意的）", next: "he_down"},
        {text: "（我懂了）", next: "end_back"}
      ]
    },
    he_down: {
      reply: "（慢慢搖頭）……我不想記得。記得的部分，也不像是我。",
      options: [
        {text: "（我懂了）", next: "end_back"}
      ]
    },
    rust_lock: {
      reply: "鏽了，是因為很久沒開。……也是因為，開過一次就夠。",
      options: [
        {text: "上次是誰開的？", next: "last_open"},
        {text: "（我明白了）", next: "end_tired"}
      ]
    },
    last_open: {
      reply: "……一個女孩。住十三號。下去之後，房間就空了。",
      options: [
        {text: "十三號房的女孩？", next: "ask_girl"},
        {text: "她下去做什麼？", next: "why_her_down"}
      ]
    },
    why_her_down: {
      reply: "找東西。……找一個不存在的人。後來，她自己也不存在了。",
      options: [
        {text: "（她還在嗎？）", next: "ask_girl"},
        {text: "（我不敢再聽）", next: "end_tired"}
      ]
    },
    basement_mirror: {
      reply: "鏡子照的，就是地下室。……兩頭都得有人看著。一頭是我，一頭是——",
      options: [
        {text: "一頭是誰？", next: "other_end"},
        {text: "（夠了）", next: "end_back"}
      ]
    },
    other_end: {
      reply: "……別問。你以後會自己看見。看見的時候，別認出來。",
      options: [
        {text: "（我知道了）", next: "end_tired"}
      ]
    },

    ask_name: {
      reply: "（眨了眨眼）……名字？這裡不需要名字。你叫什麼？",
      options: [
        {text: "陸衍。", next: "introduce_yan"},
        {text: "憑什麼告訴你？", next: "refuse_name"}
      ]
    },
    refuse_name: {
      reply: "（聳肩）……不說也可以。這裡的人，最後都只剩一個房間號。",
      options: [
        {text: "……我叫陸衍。", next: "introduce_yan"},
        {text: "（他說得對）", next: "end_tired"}
      ]
    },
    introduce_yan: {
      reply: "陸衍。……嗯。（在一本爛帳本上寫了什麼）陸衍，住幾號？",
      onVisit: function(s){s.flags['name_hotel_landlord']=true;},
      options: [
        {text: "你還沒給我房間。", next: "no_room"},
        {text: "十三號。", next: "say_13"},
        {text: "（他在登記什麼？）", next: "what_register"}
      ]
    },
    no_room: {
      reply: "自己選。……門牌看得懂吧？質數。其他的別碰。",
      options: [
        {text: "質數是什麼規矩？", next: "ask_rules"},
        {text: "如果選錯了呢？", next: "wrong_room"},
        {text: "（我自己看）", next: "end_back"}
      ]
    },
    say_13: {
      reply: "（筆停住，很久）……十三，不能住。鎖著。",
      options: [
        {text: "為什麼鎖？", next: "why_lock"},
        {text: "我偏要住。", next: "insist_13"},
        {text: "（那就換一間）", next: "no_room"}
      ]
    },
    insist_13: {
      reply: "（搖頭，很慢）……鑰匙不在。你敲門，裡面會應。應了，也別開。",
      options: [
        {text: "她會應？", next: "ask_girl"},
        {text: "（我知道了）", next: "end_tired"}
      ]
    },
    what_register: {
      reply: "（合上帳本）……住客名冊。……你以為為什麼有人進來，有人不出去。",
      options: [
        {text: "名冊上有誰？", next: "roster"},
        {text: "（我不想看）", next: "end_back"}
      ]
    },
    roster: {
      reply: "……一排名字。很多名字。有些，後面畫了個勾。",
      options: [
        {text: "勾是什麼意思？", next: "checkmark"},
        {text: "（我不想知道）", next: "end_tired"}
      ]
    },
    checkmark: {
      reply: "……退房了。或者，不用退了。我不分。",
      options: [
        {text: "有陸衍嗎？", next: "my_name_on_list"},
        {text: "（合上吧）", next: "end_back"}
      ]
    },
    my_name_on_list: {
      reply: "（翻了一頁，停住）……有了。剛剛寫上的。",
      options: [
        {text: "（我還沒死）", next: "end_tired"}
      ]
    },
    wrong_room: {
      reply: "……選錯的人，不會回來問我第二遍。",
      options: [
        {text: "（我記住了）", next: "end_back"}
      ]
    },

    ask_time: {
      reply: "（看了一眼鐘，鐘沒有針）……十二點。永遠十二點。",
      options: [
        {text: "永遠十二點？", next: "always_twelve"},
        {text: "退房呢？", next: "checkout"},
        {text: "（這鐘有問題）", next: "root"}
      ]
    },
    always_twelve: {
      reply: "對。……日升日落，不關這裡的事。我們只認十二點。",
      options: [
        {text: "十二點會發生什麼？", next: "what_at_twelve"},
        {text: "（我懂了）", next: "end_tired"}
      ]
    },
    what_at_twelve: {
      reply: "……十二點一到，退房的退房，退房的……退房。",
      options: [
        {text: "你在繞什麼？", next: "still_you"},
        {text: "（這句話我聽不懂）", next: "end_back"}
      ]
    },
    checkout: {
      reply: "退房？……拿著鑰匙，走到大門。大門開了，就走出去。",
      options: [
        {text: "大門會開嗎？", next: "door_open"},
        {text: "鑰匙在哪？", next: "key_where"},
        {text: "（聽著像騙人）", next: "end_tired"}
      ]
    },
    door_open: {
      reply: "（很久）……有人走過去。門沒開。……後來，走廊裡就多了一個人。",
      options: [
        {text: "（我明白了）", next: "end_back"}
      ]
    },

    ask_girl: {
      reply: "（終於完全睜開眼）……十三號那個？別跟她說話。數數的那個。",
      options: [
        {text: "她在數什麼？", next: "what_counting"},
        {text: "她是住客？", next: "is_guest"},
        {text: "她死了嗎？", next: "is_dead"},
        {text: "（我去找她）", next: "end_goto_girl"}
      ]
    },
    what_counting: {
      reply: "……數房間。數腳步。數還剩幾個。數到零，就有人少掉。",
      options: [
        {text: "她知道自己是——", next: "knows_dead"},
        {text: "（我不想聽了）", next: "end_tired"}
      ]
    },
    is_guest: {
      reply: "住過。……住太久了。久到忘了自己住過。",
      options: [
        {text: "她在這裡多久了？", next: "girl_how_long"},
        {text: "（我去找她）", next: "end_goto_girl"}
      ]
    },
    girl_how_long: {
      reply: "……比我久。或者比我短。這裡的時間，不準。",
      options: [
        {text: "（她還以為自己活著？）", next: "end_tired"}
      ]
    },
    is_dead: {
      reply: "（把聲音壓得很低）……別說出來。她聽見，會停。停下來，就該換人了。",
      options: [
        {text: "換誰？", next: "swap"},
        {text: "（我不說）", next: "end_tired"}
      ]
    },
    knows_dead: {
      reply: "（搖頭）……她不知道。她要是知道，就不數了。",
      options: [
        {text: "（那我也不說）", next: "end_back"}
      ]
    },

    end_root: {
      reply: "（點點頭，又打瞌睡去了）……嗯。",
      options: []
    },
    end_tired: {
      reply: "（眼皮合上）……規矩就是規矩。睡吧。",
      options: []
    },
    end_back: {
      reply: "（揮揮手，像趕蒼蠅）……走吧走吧。十二點前回來。",
      options: []
    },
    end_goto_girl: {
      reply: "（忽然睜眼，盯著你）……她敲門，你別開。她叫你名字，你別答。",
      options: []
    }
  }
},

hotel_girl: {
  start: "root",
  startReturning: "returning",
  nodes: {
    returning: {
      reply: "（停了一下數數，像認出你。）……你又來了。別打斷我數。",
      options: [
        {text: "你在數什麼？", next: "what_counting"},
        {text: "你是誰？", next: "ask_name", condition: function(){return !hasFlag('name_hotel_girl');}},
        {text: "我叫陸衍。", next: "introduce_yan", condition: function(){return !hasFlag('name_hotel_girl');}},
        {text: "這條走廊為什麼一直有聲音？", next: "corridor_sound"},
        {text: "你的房間……為什麼鎖著？", next: "why_lock_room"},
        {text: "鏡子那邊，你去過嗎？", next: "ask_mirror"},
        {text: "地下室呢？", next: "ask_basement"},
        {text: "你在這裡待多久了？", next: "how_long_here"},
        {text: "（輕聲打斷她）", next: "be_quiet"}
      ]
    },
    root: {
      reply: "……三……四……五……（聲音很輕，像怕吵醒什麼）別、別過來。你數你的，我數我的。",
      options: [
        {text: "你在數什麼？", next: "what_counting"},
        {text: "你是誰？", next: "ask_name", condition: function(){return !hasFlag('name_hotel_girl');}},
        {text: "我叫陸衍。", next: "introduce_yan", condition: function(){return !hasFlag('name_hotel_girl');}},
        {text: "這條走廊為什麼一直有聲音？", next: "corridor_sound"},
        {text: "你的房間……為什麼鎖著？", next: "why_lock_room"},
        {text: "鏡子那邊，你去過嗎？", next: "ask_mirror"},
        {text: "地下室呢？", next: "ask_basement"},
        {text: "你在這裡待多久了？", next: "how_long_here"},
        {text: "（輕聲打斷她）", next: "be_quiet"}
      ]
    },

    what_counting: {
      reply: "數……數門。一間……兩間……三間。數到不該數的，就停。",
      options: [
        {text: "什麼叫不該數的？", next: "wrong_number"},
        {text: "數完了會怎樣？", next: "finish_count"},
        {text: "（她還在繼續數）", next: "root"}
      ]
    },
    wrong_number: {
      reply: "（聲音更小）……非……非那個數字的。不能數。數了，它就來敲門。",
      options: [
        {text: "非什麼數字？", next: "prime_hint"},
        {text: "誰來敲門？", next: "who_knocks"},
        {text: "（我別嚇她）", next: "end_shush"}
      ]
    },
    prime_hint: {
      reply: "……老爺爺說，能進的，是那種……除得盡自己，除不盡別人的。我……我記不太清。",
      options: [
        {text: "你說的是質數。", next: "you_say_prime"},
        {text: "老爺爺是誰？", next: "old_man"},
        {text: "（她已經記不清楚了）", next: "end_trail_off"}
      ]
    },
    you_say_prime: {
      reply: "（像被嚇到）……別、別大聲說。說出來，走廊會聽到。",
      options: [
        {text: "對不起。", next: "sorry"},
        {text: "那十三號房呢？", next: "room_13"}
      ]
    },
    room_13: {
      reply: "（聲音緊了一下）……十三。……十三不能進。它……它不是那種數字。",
      options: [
        {text: "為什麼不是？十三是質數啊。", next: "why_not_prime"},
        {text: "（你住的就是十三號）", next: "you_live_13"}
      ]
    },
    why_not_prime: {
      reply: "（搖頭，很快）……不知道。……老爺爺說十三不一樣。鎖著。",
      options: [
        {text: "（我去問他）", next: "end_leave_her"}
      ]
    },
    you_live_13: {
      reply: "（愣了一下）……十三？……這是十三號？我……我不知道。我以為這是別的號。",
      options: [
        {text: "你不認得自己的房間？", next: "not_recognize_room"},
        {text: "（她不知道）", next: "end_shush"}
      ]
    },
    not_recognize_room: {
      reply: "……我來的時候，沒看門牌。……走累了，推開一間就進來了。",
      options: [
        {text: "（她以為自己住的是別間）", next: "end_trail_off"}
      ]
    },
    old_man: {
      reply: "櫃檯那個……打瞌睡的。他什麼都知道。……但他不肯說。",
      options: [
        {text: "他跟你說過話？", next: "talked_to_landlord"},
        {text: "（我去找他問）", next: "end_leave_her"}
      ]
    },
    talked_to_landlord: {
      reply: "（點點頭）……他給我送過水。一次。後來……後來我就沒出去過。",
      options: [
        {text: "為什麼沒出去？", next: "why_not_leave"},
        {text: "（她在迴避）", next: "end_trail_off"}
      ]
    },
    why_not_leave: {
      reply: "……門外有東西在走。我不敢。……數到它走，我才敢出聲。",
      options: [
        {text: "外面走的是什麼？", next: "what_walks"},
        {text: "（我陪你等）", next: "wait_with_her"}
      ]
    },
    what_walks: {
      reply: "（搖頭，很快）……不知道。不能看。看了，它就會停下來。停在你門口。",
      options: [
        {text: "停在門口會怎樣？", next: "stop_at_door"},
        {text: "（我知道了）", next: "end_shush"}
      ]
    },
    stop_at_door: {
      reply: "……敲。三下一停。再三下。……你不開，它就走。你開了——",
      options: [
        {text: "開了會怎樣？", next: "if_open"},
        {text: "（她說不下去了）", next: "end_trail_off"}
      ]
    },
    if_open: {
      reply: "（聲音幾乎聽不見）……開了，它就進來。或者……或者換我出去。",
      options: [
        {text: "你出去過嗎？", next: "did_go_out"},
        {text: "（這話太涼了）", next: "end_shush"}
      ]
    },
    did_go_out: {
      reply: "……出去過一次。回來的時候，走廊不認得我了。",
      options: [
        {text: "什麼意思？不認得你？", next: "not_recognized"},
        {text: "（別再問了）", next: "end_leave_her"}
      ]
    },
    not_recognized: {
      reply: "……燈不一樣了。門牌不一樣了。我敲我的門，裡面……裡面不應。",
      options: [
        {text: "（你已經不是原來的你了）", next: "end_trail_off"}
      ]
    },
    wait_with_her: {
      reply: "（安靜很久）……你也不走？……很少有人陪我數。",
      options: [
        {text: "你叫什麼名字？", next: "ask_name"},
        {text: "你一個人在這裡很久了吧。", next: "alone_long"}
      ]
    },
    alone_long: {
      reply: "……不記得了。我數著數著，就忘了白天晚上。……也忘了我是怎麼來的。",
      options: [
        {text: "你記得來這裡之前的事嗎？", next: "before_here"},
        {text: "（她不記得了）", next: "end_shush"}
      ]
    },
    before_here: {
      reply: "……有車子。很吵。有人牽我的手。……後來，就只剩走廊了。",
      options: [
        {text: "牽你手的是誰？", next: "who_held_hand"},
        {text: "（別逼她）", next: "end_trail_off"}
      ]
    },
    who_held_hand: {
      reply: "（皺眉，像在想）……媽媽？……不，不像。溫度不一樣。",
      options: [
        {text: "（那不是媽媽）", next: "end_shush"}
      ]
    },
    who_knocks: {
      reply: "……不知道。不開門，就不知道。開了，就沒機會知道了。",
      options: [
        {text: "（我懂）", next: "end_trail_off"}
      ]
    },
    finish_count: {
      reply: "數完……數完一輪，就要重數。……不重數，就會少一個人。",
      options: [
        {text: "少誰？", next: "missing_one"},
        {text: "（她在重複一件事）", next: "end_shush"}
      ]
    },
    missing_one: {
      reply: "……不知道。回來數的時候，就發現少了。房間空了。門開著。",
      options: [
        {text: "那個人去了哪？", next: "where_gone"},
        {text: "（我不想聽）", next: "end_trail_off"}
      ]
    },
    where_gone: {
      reply: "……樓下。地下室那邊。……或者鏡子裡。我不敢看。",
      options: [
        {text: "地下室有什麼？", next: "ask_basement"},
        {text: "鏡子裡有什麼？", next: "ask_mirror"},
        {text: "（別說了）", next: "end_shush"}
      ]
    },

    ask_name: {
      reply: "（停了一下數數）……名字？……你先說。你叫什麼？",
      options: [
        {text: "陸衍。", next: "introduce_yan"},
        {text: "為什麼要我先說？", next: "why_me_first"}
      ]
    },
    why_me_first: {
      reply: "……因為我怕我說了，你記不住。……很多人來過，都記不住我。",
      options: [
        {text: "我叫陸衍。", next: "introduce_yan"},
        {text: "（她笑了一下，很淡）", next: "end_trail_off"}
      ]
    },
    introduce_yan: {
      reply: "陸……衍。（輕輕唸）……好聽。……我叫小滿。他們都叫我小滿。",
      onVisit: function(s){s.flags['name_hotel_girl']=true;},
      options: [
        {text: "小滿，你怎麼會在十三號房？", next: "how_here"},
        {text: "小滿，你一個人住這裡？", next: "alone_room"},
        {text: "（她終於說出名字了）", next: "remember_name"}
      ]
    },
    remember_name: {
      reply: "（點頭）……嗯。你記得就好。……下次來，還叫我小滿。",
      options: [
        {text: "我會的。", next: "end_promise"},
        {text: "下次？你要等到什麼時候？", next: "when_next"}
      ]
    },
    when_next: {
      reply: "……不知道。數到零的時候吧。……數到零，就會有新人來。",
      options: [
        {text: "新人來了，你就走了？", next: "new_comes"},
        {text: "（她不覺得這有什麼）", next: "end_trail_off"}
      ]
    },
    new_comes: {
      reply: "（歪頭）……走？去哪？……我一直都在這裡啊。",
      options: [
        {text: "（她不知道自己已經——）", next: "end_shush"}
      ]
    },
    how_here: {
      reply: "……走進來的。跟你一樣。……走廊很長，我走累了，就進了這間。",
      options: [
        {text: "那時候門沒鎖？", next: "door_unlocked"},
        {text: "你進來後，就出不去了？", next: "cant_leave"}
      ]
    },
    door_unlocked: {
      reply: "（點頭）……沒鎖。後來……後來不知道什麼時候，就鎖上了。",
      options: [
        {text: "你沒試過推門？", next: "tried_door"},
        {text: "（門自己鎖上的）", next: "end_trail_off"}
      ]
    },
    tried_door: {
      reply: "推過。……推不動。外面像頂著什麼。……有時候，外面也在推。",
      options: [
        {text: "外面在推？", next: "outside_pushing"},
        {text: "（我不問了）", next: "end_shush"}
      ]
    },
    outside_pushing: {
      reply: "（聲音發抖）……一下。兩下。……像在數。數到和我一樣，就停了。",
      options: [
        {text: "和你一樣？", next: "same_as_you"},
        {text: "（她在發抖）", next: "comfort_her"}
      ]
    },
    same_as_you: {
      reply: "……數到同一個數字。它就……它就以為我是它了。",
      options: [
        {text: "（太涼了）", next: "end_trail_off"}
      ]
    },
    comfort_her: {
      reply: "（停了一下，像在聽你）……你不怕我？",
      options: [
        {text: "不怕。", next: "not_afraid"},
        {text: "（她很怕）", next: "end_shush"}
      ]
    },
    not_afraid: {
      reply: "（輕輕地笑，很輕）……很久沒人說不怕了。……他們都跑。",
      options: [
        {text: "你在這多久了，小滿？", next: "how_long_here"},
        {text: "（我陪你一會）", next: "wait_with_her"}
      ]
    },
    alone_room: {
      reply: "……一開始不是。……後來同房的人走了。就剩我。",
      options: [
        {text: "同房的人去哪了？", next: "roommate_gone"},
        {text: "（她不記得了）", next: "end_trail_off"}
      ]
    },
    roommate_gone: {
      reply: "……她說她要去退房。……打開門，就沒回來過。",
      options: [
        {text: "你不出去找她？", next: "why_not_find"},
        {text: "（門外有東西）", next: "end_shush"}
      ]
    },
    why_not_find: {
      reply: "……外面黑。而且……而且我怕出去了，就找不到回來的路。",
      options: [
        {text: "（這是你的房間啊）", next: "this_is_your_room"},
        {text: "（她被困住了）", next: "end_trail_off"}
      ]
    },
    this_is_your_room: {
      reply: "（點頭，又搖頭）……是。也不是。……住久了，就分不清了。",
      options: [
        {text: "（她連這個都分不清了）", next: "end_shush"}
      ]
    },
    cant_leave: {
      reply: "……出不去了。門不開。……或者，門開了，外面不是走廊。",
      options: [
        {text: "外面是什麼？", next: "outside_what"},
        {text: "（她試過）", next: "end_trail_off"}
      ]
    },
    outside_what: {
      reply: "……別人。……一個和我一樣的人。站在門外，看著我。",
      options: [
        {text: "那是你自己。", next: "that_is_you"},
        {text: "（別說了）", next: "end_shush"}
      ]
    },
    that_is_you: {
      reply: "（退後一步）……你別嚇我。……我不認得她。",
      options: [
        {text: "（我不該說的）", next: "comfort_her"}
      ]
    },

    corridor_sound: {
      reply: "（一下子停住數數）……別說。……別說那個聲音。它聽到你說，就會停下。",
      options: [
        {text: "停下來會怎樣？", next: "sound_stops"},
        {text: "（我閉嘴）", next: "end_shush"}
      ]
    },
    sound_stops: {
      reply: "……停下，就開始敲門。……三下一停。再三下。",
      options: [
        {text: "和敲你房門的一樣？", next: "same_knock"},
        {text: "（她在發抖）", next: "comfort_her"}
      ]
    },
    same_knock: {
      reply: "（點點頭，很快）……一樣。……它在找東西。找不到，就一直敲。",
      options: [
        {text: "找什麼？", next: "looking_for"},
        {text: "（別說了）", next: "end_trail_off"}
      ]
    },
    looking_for: {
      reply: "……找一個……一個不該在這的人。……我不說了。說了它會換找我。",
      options: [
        {text: "（我懂）", next: "end_shush"}
      ]
    },

    why_lock_room: {
      reply: "（縮了一下）……為了安全。……鎖著，它進不來。",
      options: [
        {text: "你自己鎖的？", next: "you_lock"},
        {text: "裡面除了你還有誰？", next: "who_inside"}
      ]
    },
    you_lock: {
      reply: "……不記得了。……也許是它鎖的。也許，是為了不讓我出去。",
      options: [
        {text: "你想出去嗎？", next: "want_out"},
        {text: "（兩種都有可能）", next: "end_trail_off"}
      ]
    },
    want_out: {
      reply: "（沉默很久）……想。……但我不知道出去了要去哪。",
      options: [
        {text: "你家在哪？", next: "where_home"},
        {text: "（她連家都忘了）", next: "end_shush"}
      ]
    },
    where_home: {
      reply: "……有窗戶。……窗戶外面有樹。……樹後面，想不起來了。",
      options: [
        {text: "（別想了）", next: "end_trail_off"}
      ]
    },
    who_inside: {
      reply: "（看了一眼房間深處）……我。……還有影子。影子有時候不跟我一起動。",
      options: [
        {text: "什麼意思？", next: "shadow_not_you"},
        {text: "（別看那邊）", next: "end_shush"}
      ]
    },
    shadow_not_you: {
      reply: "……我站著，它走。我坐下，它站著。……我不敢回頭看它。",
      options: [
        {text: "（那不是你的影子）", next: "end_trail_off"}
      ]
    },

    ask_mirror: {
      reply: "（聲音突然發緊）……別去看。……那邊的東西，會學你。",
      options: [
        {text: "學我？", next: "learn_you"},
        {text: "你看過？", next: "seen_mirror"},
        {text: "（我知道了）", next: "end_shush"}
      ]
    },
    learn_you: {
      reply: "……你抬左手，它慢半拍。你笑，它晚一會才笑。……後來，就換它先。",
      options: [
        {text: "換它先是什麼意思？", next: "it_first"},
        {text: "（太嚇人了）", next: "end_trail_off"}
      ]
    },
    it_first: {
      reply: "……它先笑，你才跟著笑。……那時候，你已經不知道是你在笑了。",
      options: [
        {text: "（我不去看）", next: "end_shush"}
      ]
    },
    seen_mirror: {
      reply: "……看過一次。就一次。……後來我把臉別過去，它還在我背後看我。",
      options: [
        {text: "背後？", next: "behind_you"},
        {text: "（別說了）", next: "end_trail_off"}
      ]
    },
    behind_you: {
      reply: "（輕聲）……我現在不確定，你面前這個，是我，還是……",
      options: [
        {text: "（我不敢問）", next: "end_shush"}
      ]
    },

    ask_basement: {
      reply: "（整個人縮起來）……樓下。別提樓下。……樓下的聲音，不一樣。",
      options: [
        {text: "怎麼不一樣？", next: "different_sound"},
        {text: "你下去過？", next: "went_down"},
        {text: "（我不問了）", next: "end_shush"}
      ]
    },
    different_sound: {
      reply: "……走廊的聲音，是走過去。樓下的聲音，是……是往上爬。",
      options: [
        {text: "爬上來？", next: "climbing_up"},
        {text: "（她在發抖）", next: "comfort_her"}
      ]
    },
    climbing_up: {
      reply: "……一下一下。很慢。……數著數著，就到門口了。",
      options: [
        {text: "到門口後呢？", next: "arrives_door"},
        {text: "（別說了）", next: "end_trail_off"}
      ]
    },
    arrives_door: {
      reply: "……不敲。……它就站在外面。等你自己以為沒人了，打開——",
      options: [
        {text: "（我知道了）", next: "end_shush"}
      ]
    },
    went_down: {
      reply: "……走過樓梯口。沒下去。……樓梯口的風，是冷的。從下面吹上來。",
      options: [
        {text: "冷的風？", next: "cold_wind"},
        {text: "（她有分寸）", next: "end_trail_off"}
      ]
    },
    cold_wind: {
      reply: "……不像風。像有人在下面……呼氣。",
      options: [
        {text: "（我不下去）", next: "end_shush"}
      ]
    },

    how_long_here: {
      reply: "（想了很久，忘記數到哪）……一……一個晚上？……很多個晚上？我分不清。",
      options: [
        {text: "你記得自己是怎麼來的嗎？", next: "before_here"},
        {text: "你今年多大？", next: "how_old"},
        {text: "（她分不清了）", next: "end_trail_off"}
      ]
    },
    how_old: {
      reply: "……十二？……十三？……過生日那天，走廊多了一扇門。我就進不出去了。",
      options: [
        {text: "十三歲生日？", next: "thirteen_birthday"},
        {text: "（原來如此）", next: "end_shush"}
      ]
    },
    thirteen_birthday: {
      reply: "（點頭）……嗯。生日快樂，他們說。……後來就沒人來了。",
      options: [
        {text: "（生日變成了禁錮）", next: "end_trail_off"}
      ]
    },

    be_quiet: {
      reply: "（被打斷，嚇了一跳）……對不起。……我數太大聲了嗎？",
      options: [
        {text: "沒有。你繼續。", next: "continue_counting"},
        {text: "小滿，你聽過別人叫你名字嗎？", next: "heard_name"}
      ]
    },
    continue_counting: {
      reply: "……六……七……八……（聲音更輕了）",
      options: [
        {text: "（陪她數一會）", next: "root"},
        {text: "（她回到自己的世界了）", next: "end_leave_her"}
      ]
    },
    heard_name: {
      reply: "（停住）……誰？……很久沒有人叫我了。……除了老爺爺。",
      options: [
        {text: "老爺爺怎麼叫你？", next: "landlord_calls"},
        {text: "（我叫你小滿）", next: "call_her_xiaoman"}
      ]
    },
    landlord_calls: {
      reply: "……十三號房。……他都叫我十三號房。不叫名字。",
      options: [
        {text: "（他把你當房間了）", next: "end_trail_off"}
      ]
    },
    call_her_xiaoman: {
      reply: "（像被嚇到，又像很高興）……小滿。……你再叫一次。",
      options: [
        {text: "小滿。", next: "call_again"},
        {text: "（她聽到自己的名字很高興）", next: "end_promise"}
      ]
    },
    call_again: {
      reply: "（輕輕笑）……嗯。……我記住了。下次你來，我還在這。",
      options: [
        {text: "我會來的。", next: "end_promise"}
      ]
    },
    sorry: {
      reply: "（搖頭）……不要緊。……你坐遠一點就好。",
      options: [
        {text: "為什麼？", next: "why_far"},
        {text: "（我坐下）", next: "wait_with_her"}
      ]
    },
    why_far: {
      reply: "……我身上涼。……他們說，坐近了會感冒。",
      options: [
        {text: "（她不知道自己是涼的）", next: "end_shush"}
      ]
    },

    end_shush: {
      reply: "……噓。……走廊有聲音。別說了。",
      options: []
    },
    end_trail_off: {
      reply: "（聲音越來越輕，又開始數）……九……十……十一……",
      options: []
    },
    end_leave_her: {
      reply: "（揮揮手，很小）……走吧。……記得回來叫我。",
      options: []
    },
    end_promise: {
      reply: "（點點頭，繼續數）……十二……十三……十四……",
      options: []
    }
  }
},
library_admin: {
  start: "root",
  startReturning: "returning",
  nodes: {
    returning: {
      reply: "（食指壓在唇上，看了你一眼。）……回來了。小聲。",
      options: [
        {text: "你是誰？", next: "ask_name", condition: function(){return !hasFlag('name_library_admin');}},
        {text: "這裡是什麼地方？", next: "about_place"},
        {text: "為什麼不能出聲？", next: "about_silence"},
        {text: "那些書……都是什麼？", next: "about_books"}
      ]
    },
    root: {
      reply: "（他從書堆後面抬起眼鏡，食指壓在嘴唇上。）小聲。這裡不收聲音。",
      options: [
        {text: "你是誰？", next: "ask_name", condition: function(){return !hasFlag('name_library_admin');}},
        {text: "這裡是什麼地方？", next: "about_place"},
        {text: "為什麼不能出聲？", next: "about_silence"},
        {text: "那些書……都是什麼？", next: "about_books"}
      ]
    },
    ask_name: {
      reply: "（他哼了一聲。）名字？先說你的。",
      options: [
        {text: "我叫陸衍。", next: "name_luyan"},
        {text: "憑什麼我先說？", next: "defy_name"}
      ]
    },
    name_luyan: {
      reply: "陸衍。（他默念一遍，像是在查書目。）收好了。這裡記得住所有名字。你的——也一樣。",
      onVisit: function(s){s.flags['name_library_admin']=true;},
      options: [
        {text: "那你叫什麼？", next: "his_name"},
        {text: "你剛才說，這裡記住所有名字……", next: "about_books"},
        {text: "算了。後門在哪？", next: "about_door"}
      ]
    },
    defy_name: {
      reply: "（他嘴角扯了一下。）膽子不小。可惜——在這間館裡，出聲的都還回去。你想試？",
      options: [
        {text: "……我叫陸衍。", next: "name_luyan"},
        {text: "（低頭不說話）", next: "root"}
      ]
    },
    his_name: {
      reply: "名字？（他推了推眼鏡。）編號而已。你問這個做什麼。名字寫在書脊上，不是寫在人身上。",
      options: [
        {text: "你自己也不記得？", next: "about_himself"},
        {text: "後門怎麼走？", next: "about_door"},
        {text: "（轉身去看書架）", next: "about_place"}
      ]
    },
    about_place: {
      reply: "圖書館。（他頓了頓。）還能是什麼。一排排書，一盞盞燈，靜得能聽見灰塵落地。你要找什麼？",
      options: [
        {text: "找一本書。", next: "find_books"},
        {text: "我想出去。", next: "about_door"},
        {text: "這館外頭呢？", next: "about_outside"}
      ]
    },
    about_silence: {
      reply: "出聲會被書架拖走。（他用指甲敲了敲書脊。）聲音一落，那排書就動了。你想被拖進去？一本一生，你賠得起？",
      options: [
        {text: "一本……一生？", next: "about_books"},
        {text: "那你為什麼可以說話？", next: "about_himself"},
        {text: "（點頭，壓低聲音）", next: "root"}
      ]
    },
    about_books: {
      reply: "每一本。（他抽出一本，又插回去。）封面是名字，內頁是日子。從第一聲啼哭，到最後一口氣。你翻開——就是那個人活過的全部。",
      options: [
        {text: "有我的那一本嗎？", next: "my_book"},
        {text: "有你的那一本嗎？", next: "his_book"},
        {text: "誰寫的？", next: "who_writes"},
        {text: "後門跟這些書有關？", next: "about_door"}
      ]
    },
    my_book: {
      reply: "（他上下打量你。）陸衍。當然有。第三排，左邊。自己去找——別翻太狠，紙頁脆。",
      options: [
        {text: "你怎麼知道我叫陸衍？", next: "know_name"},
        {text: "第三排左邊……我去看。", next: "find_books"},
        {text: "裡面寫到現在了嗎？", next: "my_book_now"}
      ]
    },
    know_name: {
      reply: "（他笑了，笑聲很輕。）你剛才不是自己說的。還是——你以為這裡有人會忘？",
      options: [
        {text: "……這地方有點嚇人。", next: "about_place"},
        {text: "後門。三本書。告訴我。", next: "about_door"}
      ]
    },
    my_book_now: {
      reply: "寫到哪一頁，你就活到哪一頁。（他聳肩。）還沒合起來，說明你還沒翻完。你問我？我又不是執筆的那個。",
      options: [
        {text: "誰執筆？", next: "who_writes"},
        {text: "（沉默）", next: "root"}
      ]
    },
    his_book: {
      reply: "（他愣了一下，隨即別開臉。）……別翻我那本。規矩。",
      options: [
        {text: "什麼規矩？", next: "his_book_rule"},
        {text: "你怕什麼？", next: "about_himself"}
      ]
    },
    his_book_rule: {
      reply: "管理員不許讀自己的書。（他聲音更低了。）讀了——就得把館交出來。下一個進來的人，接著坐我這位置。",
      options: [
        {text: "下一個……是我？", next: "im_next"},
        {text: "後門還是三本書？", next: "about_door"}
      ]
    },
    im_next: {
      reply: "（他盯著你，好久。）想走，就走得遠一點。後門——不是每個人都找得到。",
      options: [
        {text: "後門到底怎麼開？", next: "about_door"},
        {text: "（退後一步）", next: "end_silence"}
      ]
    },
    who_writes: {
      reply: "不知道。（他搖頭。）我來的時候，筆就在桌上。墨是滿的。我只負責歸檔。寫——不是我的事。",
      options: [
        {text: "你來了多久？", next: "about_himself"},
        {text: "後門。三本書。", next: "about_door"}
      ]
    },
    about_himself: {
      reply: "（他推眼鏡的手停了一下。）第三任。1993年接的位置。（他聲音低下去。）前一任……是我女兒的父親。媛媛。1987年生，1993年走，六歲。我坐在這位置上，是替他守她。",
      options: [
        {text: "你也想出去？", next: "wants_out"},
        {text: "你剛才能說話……", next: "about_silence"},
        {text: "後門。", next: "about_door"}
      ]
    },
    wants_out: {
      reply: "出去？（他重複這兩個字，像在認生詞。）媛媛走了之後，這裡就只剩我。出去做什麼——外面沒有她了。我排書，她在書架裡。（他別過臉。）別問了。",
      options: [
        {text: "你不知道外面？", next: "about_outside"},
        {text: "（同情地看著他）", next: "end_pity"}
      ]
    },
    about_outside: {
      reply: "（他眉頭皺起來。）外面。……雨？太陽？人？（他搖頭。）別跟我說。我聽不得。聽了——書會亂。",
      options: [
        {text: "你到底在怕什麼？", next: "about_himself"},
        {text: "後門。也通外面嗎？", next: "about_door"}
      ]
    },
    about_door: {
      reply: "地毯下面，門在那裡。（他壓低聲音，第一次正眼看你。）五個凹槽。五樣東西。你湊得齊，門才開。湊不齊——就跟灰塵一起留著。",
      options: [
        {text: "哪五樣？", next: "which_books"},
        {text: "為什麼是五個？", next: "why_three"},
        {text: "門在哪一頭？", next: "where_door"}
      ]
    },
    which_books: {
      reply: "不告訴你。（他搖指。）自己找。翻到——自然就知道。封面會燙手。那時候你就懂了。",
      options: [
        {text: "如果我翻不到呢？", next: "find_books"},
        {text: "你幫我找。", next: "help_find"},
        {text: "（轉身走向書架）", next: "find_books"}
      ]
    },
    help_find: {
      reply: "我幫你？（他冷笑一聲。）陸衍。我在這裡的工作，是不幫人。你忘了——出聲的都還回去。",
      options: [
        {text: "你嘴硬什麼。", next: "defy_again"},
        {text: "……多謝提醒。", next: "end_silence"}
      ]
    },
    defy_again: {
      reply: "（他眼睛眯起來。）嘴硬？我看你是不知道這館裡——最安靜的那個，往往才是最危險的。走開。",
      options: [
        {text: "（低頭走開）", next: "end_tired"},
        {text: "後門的事，我還會回來問。", next: "root"}
      ]
    },
    why_three: {
      reply: "五個。（他比了五根手指。）不多不少。五樣東西，對應五個凹槽。少一樣，門不認。這是上一批留下的規矩——他們沒走完，就把門拆成了五份。",
      options: [
        {text: "上一批是誰？", next: "door_book"},
        {text: "五樣東西分別是什麼？", next: "which_books"},
        {text: "我去哪找？", next: "find_books"}
      ]
    },
    door_book: {
      reply: "（他點頭。）萬物皆有書。牆有，燈有，後門也有。只不過——門那本，從來沒人翻到最後一頁。",
      options: [
        {text: "翻到最後一頁會怎樣？", next: "end_final"},
        {text: "（沉默）", next: "root"}
      ]
    },
    where_door: {
      reply: "你找？（他下巴往深處一抬。）最裡頭。第七排。別問我怎麼記得——我記得每一塊磚的書號。",
      options: [
        {text: "第七排……我去看看。", next: "find_books"},
        {text: "你不陪我？", next: "about_himself"}
      ]
    },
    find_books: {
      reply: "（他揮揮手，像趕一隻蠅。）去吧。翻慢點。翻快了——紙頁會記得你急。",
      options: [
        {text: "如果我找到三本？", next: "which_books"},
        {text: "（走向深處）", next: "end_silence"}
      ]
    },
    end_tired: {
      reply: "（他重新埋回書堆。）……走吧。別再出聲了。",
      options: []
    },
    end_silence: {
      reply: "（他不再看你，只把食指壓回嘴唇。）……",
      options: []
    },
    end_pity: {
      reply: "（他被你看得渾身不自在，轉身。）看什麼。走。",
      options: []
    },
    end_final: {
      reply: "（他聲音幾乎聽不見。）翻到最後一頁——這館就空了。連你，帶我，帶這些灰。都走。……去吧。",
      options: []
    }
  }
},
hospital_doctor: {
  start: "root",
  startReturning: "returning",
  nodes: {
    returning: {
      reply: "（他靠在走廊牆上，看了你一眼。）……陸衍。又醒了？這是你第幾次重置了？",
      options: [
        {text: "你是誰？怎麼知道我的名字？", next: "ask_name", condition: function(){return !hasFlag('name_hospital_doctor');}},
        {text: "你不是醫生……對吧？", next: "blood"}
      ]
    },
    root: {
      reply: "（他從牆上站直，白袍皺巴巴的，像好幾天沒換。）別怕。我不是這的員工。我跟你一樣——闖進來的。",
      options: [
        {text: "你是誰？", next: "ask_name", condition: function(){return !hasFlag('name_hospital_doctor');}},
        {text: "你穿著白袍……", next: "blood"},
        {text: "這到底是什麼地方？", next: "luyan_where"}
      ]
    },
    ask_name: {
      reply: "（他伸出手，又縮回去——手背上全是針孔。）林。他們叫我林醫生。我穿這件白袍，是因為穿別的會被護士認出來。我跟你一樣，是從前面五扇門活下來的人。",
      options: [
        {text: "五扇門？", next: "his_name"},
        {text: "我叫陸衍。", next: "luyan_where"}
      ]
    },
    his_name: {
      reply: "林建國。（他頓了頓。）別記姓，記名字就行——在這裡，名字記太牢會出事。我闖過五扇門。旅館、圖書館、太平間……你現在站的這個，是第六個。",
      onVisit: function(s){s.flags['name_hospital_doctor']=true;},
      options: [
        {text: "你活下來了？", next: "how_long"},
        {text: "護士是什麼？", next: "nurse_warn"}
      ]
    },
    luyan_where: {
      reply: "陸衍。（他念了一遍，像在記。）好名字。這裡是第六扇門——倒計時醫院。每個人手腕上都有個碼頭，時間到了就重置，什麼都忘。",
      options: [
        {text: "重置是什麼感覺？", next: "reset"},
        {text: "你穿白袍……", next: "blood"}
      ]
    },
    reset: {
      reply: "重置。（他靠回牆上，聲音平。）就是死一次，再醒過來。物品沒了，記憶沒了，同伴沒了。你以為你剛入院——其實你已經死過十幾次了。",
      options: [
        {text: "怎麼躲過重置？", next: "time_up"},
        {text: "誰在執行重置？", next: "who_reset"}
      ]
    },
    time_up: {
      reply: "躲不過。（他搖頭。）碼頭歸零，鈴響，護士推車進來，給你打一針。醒來就是新的一天。唯一能做的——在時間到之前，找到地下二樓那個東西。",
      options: [
        {text: "地下二樓？", next: "b2"},
        {text: "護士……", next: "nurse_warn"}
      ]
    },
    who_reset: {
      reply: "不是人執行。（他壓低聲音。）是那台機器。院長留下的記憶提取機。它吃人記憶。護士——只是它伸出來的手。別信護士，她給你打針不是救你，是清空你。",
      options: [
        {text: "護士長什麼樣？", next: "nurse_warn"},
        {text: "機器在地下二樓？", next: "b2"}
      ]
    },
    nurse_warn: {
      reply: "夜巡護士。（他聲音更低。）穿高跟，皮鞋聲在走廊拖很長。聽到那聲——別出聲，別看她，別答話。她給你打鎮定劑，你就永遠留在這了。我見過三個人被她拖走。",
      options: [
        {text: "怎麼分辨她是真是假？", next: "blood"},
        {text: "地下二樓有什麼？", next: "b2"}
      ]
    },
    b2: {
      reply: "地下二樓。（他眼睛亮了一下。）機器在那。機器裡關著一個六歲的女孩記憶。她叫媛媛。你在前面的門扉聽過這個名字吧？那不是巧合。",
      options: [
        {text: "媛媛是誰？", next: "yuanyuan"},
        {text: "怎麼下去？", next: "how_down"}
      ]
    },
    yuanyuan: {
      reply: "1987年生，1993年死。六歲。她爸是這醫院的院長。她死了之後，院長把她記憶存進機器。結果2003年機器失控，開始吃人的記憶。（他停頓。）那個東西——就是她。她在等爸爸。",
      options: [
        {text: "我能救她嗎？", next: "save_yy"},
        {text: "怎麼下去？", next: "how_down"}
      ]
    },
    save_yy: {
      reply: "（他看著你，很久。）我不知道。我闖過五扇門，沒有人到過B2還能回來。你要是下去了——告訴她，林叔叔記得她。（他別過頭。）走吧。碼頭不等人。",
      options: [
        {text: "你不一起？", next: "end_tired_doc"},
        {text: "怎麼下去？", next: "how_down"}
      ]
    },
    how_down: {
      reply: "手術室那層，有個鎖著的門。四位數密碼。（他比了個手勢。）答案你自己找——病歷、手術記錄、太平間。別問我。我告訴你的，機器都聽得到。",
      options: [
        {text: "謝謝你，前輩。", next: "end_quiet_doc"},
        {text: "白袍上的血……", next: "blood"}
      ]
    },
    blood: {
      reply: "（他低頭看了一眼白袍，扯了扯。）血漬。（他笑了一下，很短。）前幾次重置留下的。白袍不是醫生袍——是護士不為難我的偽裝。穿上這個，她當我是這的，不給我打針。",
      options: [
        {text: "你一直靠這個活著？", next: "end_tired_doc"},
        {text: "地下二樓……", next: "b2"}
      ]
    },
    how_long: {
      reply: "（他算了算，搖頭。）不記得了。重置太多次，我已經記不得自己是第幾輪了。我只記得——前面五扇門，我都活下來了。這第六個，我可能要交代在這。",
      options: [
        {text: "為什麼不跑？", next: "end_shift"},
        {text: "護士……", next: "nurse_warn"}
      ]
    },
    end_shift: {
      reply: "跑？（他苦笑。）碼頭在手上，跑到哪都一樣重置。唯一的辦法——把那台機器關了。我做不到。也許你可以。",
      options: [
        {text: "（點頭）", next: "end_quiet_doc"}
      ]
    },
    end_tired_doc: {
      reply: "（他揮揮手，轉身走回陰影裡。）去吧。別像我一樣，活了五扇門，卻連一個女孩都救不了。",
      options: []
    },
    end_quiet_doc: {
      reply: "（他不再說話，只是靠在牆上，聽著遠處那雙高跟鞋聲慢慢靠近。）……",
      options: []
    }
  }
},
night_nurse: {
  start: "root",
  startReturning: "returning",
  nodes: {
    returning: {
      reply: "（她手裡的瓶子差點沒拿穩。）……是你。別站在燈底下。",
      options: [
        {text: "我不是病人。", next: "not_patient"},
        {text: "妳是夜班護士？", next: "ask_name"},
        {text: "妳在數什麼？", next: "counting"}
      ]
    },
    root: {
      reply: "（她蹲在二樓樓梯口的推車旁，一只手壓著針劑盤，數玻璃小瓶。聽見腳步，她猛地抬頭，眼睛在口罩上方瞪得很大。）……查房。是查房時間。你是幾床？",
      options: [
        {text: "我不是病人。", next: "not_patient"},
        {text: "妳是夜班護士？", next: "ask_name"},
        {text: "妳在數什麼？", next: "counting"}
      ]
    },
    ask_name: {
      reply: "（她點頭，又像在搖頭。）夜巡。每班。（她低聲唸。）白班走了，小夜班走了，就剩我。（她壓低聲。）別告訴別人我在這裡。他聽得見。",
      options: [
        {text: "「他」是誰？", next: "who_he"},
        {text: "妳的排班表上寫著周敏。", next: "name_zhoumin"},
        {text: "妳一個人在這多久了？", next: "how_long"},
        {text: "（安靜地聽）", next: "root"}
      ]
    },
    not_patient: {
      reply: "（她眼睛又瞪大了一下，把針盤往胸前抱緊。）不是病人……那你是家屬？（她搖頭，自言自語。）家屬都探完了。三樓那個，家屬去年就不來了。",
      options: [
        {text: "三樓那個是誰？", next: "who_he"},
        {text: "妳在數什麼？", next: "counting"},
        {text: "……打擾了。", next: "root"}
      ]
    },
    counting: {
      reply: "（她重新低頭數瓶，手指點得很快，卻又停住。）一、二、三……（她皺眉。）剛才是幾？她猛地抬頭看你，像怕你偷了一瓶。你別碰。少一瓶，少一個病人，我就得——她沒說完，把話嚥回去。",
      options: [
        {text: "少一個會怎樣？", next: "count_missing"},
        {text: "妳怕誰？", next: "afraid"},
        {text: "我不碰。", next: "root"}
      ]
    },
    count_missing: {
      reply: "（她聲音發抖。）就會有人想起來。想起來……就不對了。她用袖口擦了一下口罩上方的額頭。上一個少了的，是七床。（她忽然壓得更低。）別去找七床。他今晚上會查房。",
      options: [
        {text: "「他」是誰？", next: "who_he"},
        {text: "妳叫什麼名字？", next: "name_zhoumin", condition: function(){return !hasFlag('name_night_nurse');}}
      ]
    },
    who_he: {
      reply: "（她環顧走廊，像牆裡長著耳朵。然後她低頭，看了看自己的鞋。一雙高跟鞋。她從來不記得自己什麼時候換上的。）……沒有「他」。（她聲音發抖。）聽到那雙高跟鞋聲——噠、噠、噠，從走廊盡頭過來——那就是我來了。到那時候，別認我。別出聲。我已經不是我了。",
      options: [
        {text: "妳……", next: "how_long"},
        {text: "妳該離開這裡。", next: "afraid"},
        {text: "（點頭，不語）", next: "root"}
      ]
    },
    how_long: {
      reply: "（她張嘴，又停住。手指在針盤邊沿點，像在數年份。）……忘了。日曆撕掉的那一摞，我從來不看。她把最後一瓶藥擺正。你要是能出去，別回頭。回頭看走廊——她聲音輕得像歎息。走廊會多一張床。",
      options: [
        {text: "我會記得妳。", next: "root"},
        {text: "（轉身離開）", next: "root"}
      ]
    },
    name_zhoumin: {
      reply: "（她身體僵了一下。那個名字……她低頭看自己胸口，名牌早就掉了。你怎麼知道的。她不是在問你。她是在問這條走廊。）……周敏。很久沒人叫了。叫了，就像又要上班似的。",
      onVisit: function(s){s.flags['name_night_nurse']=true;},
      options: [
        {text: "妳也該下班了。", next: "how_long"},
        {text: "（輕聲叫她）周敏。", next: "name_echo"},
        {text: "……抱歉。", next: "root"}
      ]
    },
    name_echo: {
      reply: "（她肩膀抖了一下。隔了半秒，走廊盡頭也很輕地回了一聲：「……敏。」她立刻噤聲，把食指豎在唇前，眼睛紅了。別叫了。別讓他知道——我還在。）",
      options: []
    },
    afraid: {
      reply: "（她把針盤抱得更緊。）怕。她直認不諱。怕也得巡。不巡，就換我躺在七床。她看了你一眼，那眼神不像在看病人，像在看一個隨時會不見的人。你快走。倒數響的時候，別站在燈底下。",
      options: []
    }
  }
}
};

function getSceneNpcKeys(){
  if(!SCENES||!state||!state.currentScene)return [];
  var sc=SCENES[state.currentScene];
  var npcProp=sc&&(sc.npc||sc.npcs);
  if(!npcProp)return [];
  var arr=Array.isArray(npcProp)?npcProp:[npcProp];
  return arr.filter(function(k){
    if(!NPC_PROFILES[k]||!DIALOGUE_TREES[k])return false;
    if(state.flags){
      if(k==='akai'&&state.flags.akai_dead)return false;
      if(k==='laozhou'&&state.flags.zhao_dead)return false;
    }
    return true;
  });
}

/* --- 對話面板 --- */
var dialogCurrentNpc = null;
var dialogCurrentNode = null;
var dialogVisited = {};
var dialogTypeTimer=null; /* 對話打字機計時器，關閉/切換時需取消 */
var dialogTypeDone=false;

function cancelDialogTypewriter(){
  if(dialogTypeTimer){clearTimeout(dialogTypeTimer);dialogTypeTimer=null;}
  dialogTypeDone=true;
}

function openDialogPanel(){
  if(isTyping())abortTyping();
  var overlay = $('dialog-overlay');
  overlay.classList.add('open');
  $('dialog-conversation-view').style.display = 'none';
  $('dialog-npc-list-view').style.display = 'flex';
  renderNpcList();
}

function renderNpcList(){
  var container = $('dialog-npc-list');
  var keys = getSceneNpcKeys();
  if(keys.length === 0){
    container.innerHTML = '<div class="dialog-empty">此處無人可交談。</div>';
    return;
  }
  var html = '';
  for(var i=0;i<keys.length;i++){
    var key = keys[i];
    var prof = NPC_PROFILES[key];
    if(!prof) continue;
    /* F類：懸浮顯示 NPC 一句簡介 */
    var npcTip=String(prof.desc||'').replace(/"/g,'&quot;');
    html += '<button class="dialog-npc-item" data-tooltip="'+npcTip+'" onclick="startDialog(\''+key+'\')">'+
      '<span class="npc-name">'+prof.name+'</span>'+
      '</button>';
  }
  container.innerHTML = html;
}

/* 繼承開場：旅人帶著上一扇門的旗標進入對話時，NPC 主動提一句。
   回傳字串陣列，依序當作 NPC 的開場白，打完再進樹的起點節點。 */
function getInheritancePrologue(npcKey){
  var inh = (typeof state!=='undefined' && state && state.inheritance) ? state.inheritance : {};
  var lines = [];
  if(npcKey==='laozhou'){
    if(inh.golden_key){
      lines.push('（他的目光掠過你口袋鼓起的那一塊，嘴角的煙動了動，像要說什麼，又嚥回去。）……你身上那把鑰匙，別隨便掏出來。這地方，認得的東西太多。');
    }
    if(inh.suwan_survived){
      lines.push('（他往你身後瞟了一眼，像在找誰，又把頭轉回去。）「那丫頭……這次沒跟你一塊兒？」他哼了一聲，「活著就好。別死在我前頭，我不收屍。」');
    }
    if(inh.lost_limb){
      lines.push('（他看見你袖口那道空蕩，眉頭擰了一下，沒多問。）……上回那地方，還疼麼？……別提了。提了也接不回來。');
    }
  }else if(npcKey==='akai'){
    if(inh.suwan_survived){
      lines.push('（他叼著棒棒糖，眼睛掃過你兩邊，笑得有點假。）「蘇晚那姐們沒來啊？她要是在，又要念叨我闖禍了。」他舔了舔糖紙，「……她還活著吧？上次分開的時候，我還沒跟她道歉。」');
    }
    if(inh.golden_key){
      lines.push('（他眼睛一亮，湊過來壓低聲音。）「哎，你那把金鑰匙……能不能讓我看一眼？就一眼！我不亂用，真的！」');
    }
  }else if(npcKey==='hotel_landlord'){
    if(inh.golden_key){
      lines.push('（撥算盤的手停了。珠子不動。他從眼皮底下瞄你一眼。）「客人身上……帶著不該有的東西吧。本店有本店的規矩，鑰匙這物件，還是收好。轉動的時候，聲音不小。」');
    }
  }else if(npcKey==='suwan'){
    if(inh.suwan_survived){
      lines.push('（她看見你，眼神動了一下。沒有驚訝，像早就知道你會來。）「……又見了。」她聲音很輕，「上一次分開的時候，你說你會回頭。我以為你死了。」');
    }
  }
  return lines;
}

function startDialog(npcKey){
  cancelDialogTypewriter(); /* 取消上一場可能仍在進行的打字 */
  dialogCurrentNpc = npcKey;
  var tree = DIALOGUE_TREES[npcKey];
  if(!tree) return;
  /* 記錄本次調用前是否已見過，用於決定重返開場 */
  var wasMet = !!(state && state.flags && state.flags['met_'+npcKey]);
  markNpcMet(npcKey);
  if(state && state.flags) state.flags['met_'+npcKey]=true;
  var prof = NPC_PROFILES[npcKey];
  $('dialog-npc-name').textContent = '「' + prof.name + '」';
  $('dialog-npc-list-view').style.display = 'none';
  $('dialog-conversation-view').style.display = 'flex';
  $('dialog-messages').innerHTML = '';
  $('dialog-options').innerHTML = '';
  /* 重返時優先恢復上次未完的節點（若該節點仍有後續選項），否則使用 startReturning */
  var savedNode = (state && state.flags) ? state.flags['dlg_'+npcKey] : null;
  if(savedNode && tree.nodes[savedNode] && tree.nodes[savedNode].options && tree.nodes[savedNode].options.length > 0){
    dialogCurrentNode = savedNode;
  }else{
    dialogCurrentNode = (wasMet && tree.startReturning) ? tree.startReturning : tree.start;
  }
  /* 繼承開場：有就先依序打完，再進起點節點 */
  var prologue = getInheritancePrologue(npcKey);
  /* NG+ 隱藏台詞：在所有繼承開場之前追加一句 */
  if(typeof state!=='undefined'&&state&&state.flags&&state.flags.ng_plus_mode){
    prologue = prologue||[];
    prologue.unshift('（你看著眼前這個人，後頸發麻。好像……上一次也見過。）');
  }
  if(prologue && prologue.length){
    playDialogPrologue(npcKey, dialogCurrentNode, prologue, 0);
  }else{
    showDialogNode(npcKey, dialogCurrentNode);
  }
}

function playDialogPrologue(npcKey, nodeId, lines, idx){
  if(idx >= lines.length){
    showDialogNode(npcKey, nodeId);
    return;
  }
  addDialogMsgTypewriter('npc', lines[idx], function(){
    playDialogPrologue(npcKey, nodeId, lines, idx+1);
  });
}

function showDialogNode(npcKey, nodeId){
  var tree = DIALOGUE_TREES[npcKey];
  var node = tree.nodes[nodeId];
  if(!node) return;
  dialogCurrentNode = nodeId;
  /* 節點回調：進入節點時觸發，用於寫旗標等副作用 */
  if(node.onVisit && typeof node.onVisit==='function'){node.onVisit(state);}
  /* 隱藏選項，打字機打完再顯示 */
  $('dialog-options').innerHTML='';
  addDialogMsgTypewriter('npc', node.reply, function(){
    renderDialogOptions(node.options || []);
  });
}

function addDialogMsgTypewriter(type, text, cb){
  var el = document.createElement('div');
  el.className = 'dialog-msg ' + type;
  $('dialog-messages').appendChild(el);
  var i=0,timer=null,done=false;
  dialogTypeDone=false;
  /* 打完當前段落：清除定時器、補滿文字、觸發回調 */
  function finish(){
    if(done)return;
    done=true;
    dialogTypeDone=true;
    if(timer){clearTimeout(timer);timer=null;}
    dialogTypeTimer=null;
    el.textContent=text;
    el.style.cursor='';
    el.removeEventListener('click',onClick);
    if(cb)cb();
  }
  /* 點擊 NPC 回應文字：跳過打字機，直接打完 */
  function onClick(e){
    if(done)return;
    if(e&&e.stopPropagation)e.stopPropagation();
    finish();
  }
  if(type==='npc'){
    el.style.cursor='pointer';
    el.addEventListener('click',onClick);
  }
  (function type(){
    if(done)return;
    if(i<=text.length){
      el.textContent=text.slice(0,i);i++;
      $('dialog-messages').scrollTop=$('dialog-messages').scrollHeight;
      timer=setTimeout(type,30);
      dialogTypeTimer=timer;
    }else{
      done=true;
      dialogTypeDone=true;
      timer=null;
      dialogTypeTimer=null;
      el.style.cursor='';
      el.removeEventListener('click',onClick);
      if(cb)cb();
    }
  })();
}

function addDialogMsg(type, text){
  var el = document.createElement('div');
  el.className = 'dialog-msg ' + type;
  el.textContent = text;
  $('dialog-messages').appendChild(el);
  $('dialog-messages').scrollTop = $('dialog-messages').scrollHeight;
  /* H類：對話次數計數 */
  dialogCount++;
}

function renderDialogOptions(options){
  var container = $('dialog-options');
  /* 條件過濾：condition(state) 為假的選項不顯示 */
  var visibleOptions = options.filter(function(opt){return !opt.condition || opt.condition(state);});
  var html = '';
  for(var i=0;i<visibleOptions.length;i++){
    var opt = visibleOptions[i];
    var safeText = opt.text.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    var safeNext = String(opt.next==null?'':opt.next).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    var displayText = opt.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    html += '<button class="dialog-opt-btn" style="animation-delay:'+(i*0.06)+'s" onclick="chooseDialogOption(\''+safeText+'\',\''+safeNext+'\')">'+displayText+'</button>';
  }
  html += '<button class="dialog-opt-btn leave" onclick="backToNpcList()">離開對話</button>';
  container.innerHTML = html;
}

function chooseDialogOption(text, nextNode){
  addDialogMsg('player', text);
  if(nextNode && DIALOGUE_TREES[dialogCurrentNpc].nodes[nextNode]){
    showDialogNode(dialogCurrentNpc, nextNode);
  }
}

function closeDialogPanel(){
  cancelDialogTypewriter();
  /* 保存對話進度，供重返時銜接 */
  if(dialogCurrentNpc && dialogCurrentNode && state && state.flags){state.flags['dlg_'+dialogCurrentNpc]=dialogCurrentNode;}
  $('dialog-overlay').classList.remove('open');
  dialogCurrentNpc = null;
  dialogCurrentNode = null;
  $('choices').classList.remove('hidden-choices');
}

function backToNpcList(){
  cancelDialogTypewriter();
  /* 保存對話進度，供重返時銜接 */
  if(dialogCurrentNpc && dialogCurrentNode && state && state.flags){state.flags['dlg_'+dialogCurrentNpc]=dialogCurrentNode;}
  dialogCurrentNpc = null;
  dialogCurrentNode = null;
  $('dialog-conversation-view').style.display = 'none';
  $('dialog-npc-list-view').style.display = 'flex';
  renderNpcList();
}

/* --- 結局 --- */
function triggerEnding(type,title,desc,reward){
  recordEnding(type,title);
  /* 清理殘留打字機與無用選項輪詢，避免結局畫面後仍有背景定時器 */
  if(typingState&&!typingState.done){clearTimeout(typeTimer);typingState.done=true;typingState=null;}
  if(uselessChoiceTimer){clearInterval(uselessChoiceTimer);uselessChoiceTimer=null;}
  currentPlayContext=null;
  /* D類：時間循環——死亡/壞結局時記錄記憶碎片 */
  if(type==='death_hp'||type==='bad'||type.indexOf('bad_')===0||type.indexOf('death_')===0){
    try{recordDeathMemory();}catch(e){}
  }
  if(typeof onEndingReached==='function')onEndingReached(type,title);
  /* 先設置結局內容 */
  var es=$('ending-screen');
  es.classList.remove('ending-bad','ending-good','pseudo-ending','show-meta','glitching');
  /* P1-5：結局分類支援前綴（bad_/normal_/survive_/hidden_/death_），使每個結局可擁有唯一ID */
  var isBad=(type==='bad'||type==='death_hp'||type.indexOf('bad_')===0||type.indexOf('death_')===0);
  var isGood=(type==='normal'||type==='survive'||type==='hidden'||type.indexOf('normal_')===0||type.indexOf('survive_')===0||type.indexOf('hidden_')===0);
  if(isBad)es.classList.add('ending-bad');
  if(isGood)es.classList.add('ending-good');
  var _tBad=(type==='bad'||type.indexOf('bad_')===0);
  var _tDeath=(type==='death_hp'||type.indexOf('death_')===0);
  var _tSurv=(type==='survive'||type.indexOf('survive_')===0);
  var _tNorm=(type==='normal'||type.indexOf('normal_')===0);
  var _tHidden=(type==='hidden'||type.indexOf('hidden_')===0);
  $('ending-type').textContent=_tNorm?'普通結局':(_tBad?'壞結局':(_tSurv?'逃過一劫':(_tDeath?'死亡結局':(_tHidden?'隱藏結局':type))));
  $('ending-type').className='ending-type'+(_tBad?' bad':(_tDeath?' death':(_tSurv?' survive':' normal')));
  $('ending-title').textContent=title;
  $('ending-desc').textContent=desc;
  $('ending-reward').textContent=reward||'';
  closeDialogPanel();
  /* 門扉1 專有：結局時寫入繼承（支援前綴型結局 ID） */
  if(currentDungeonId===1&&(_tNorm||_tSurv||_tHidden)){
    var inh={};
    if(state.flags.mirror_defeated)inh.mirror_defeated=true;
    if(state.flags.golden_key)inh.golden_key=true;
    if(state.flags.basement_knowledge)inh.basement_knowledge=true;
    if(state.flags.traded_admin)inh.traded_admin=true;
    if(_tSurv)inh.alone_escape=true;
    if(state.flags.trusted)inh.trusted=true;
    if(state.flags.lost_limb)inh.lost_limb=true;
    if(state.flags.admin_guest)inh.admin_guest=true;
    inh.first_cleared=true;
    saveInheritance(inh);
    localStorage.setItem('wuxian-first-cleared','true');
  }
  /* 通關章節解鎖：好結局記錄該門扉已通關 */
  if(isGood){
    markChapterReached(state.currentScene);
    /* NG+：任何門扉通關後標記 ng_plus */
    saveInheritance({ng_plus:true});
    if(window.V4&&typeof V4.markDungeonCleared==='function'){
      try{V4.markDungeonCleared(currentDungeonId);}catch(e){}
    }
  }
  /* 鋸齒分屏轉場：線從屏幕外閉合到中間遮蓋，再打開露出結局 */
  var so=$('split-overlay');
  setZigzagLines();
  so.classList.remove('drawing','reverse','reverse-ready');
  so.classList.add('active','no-title','open');
  void so.offsetWidth;
  so.classList.remove('open');
  if(isBad)playBadFlash();
  setTimeout(function(){
    /* 在遮蓋下顯示結局，隱藏遊戲屏 */
    es.classList.add('show');
    $('game-screen').classList.remove('active');
    /* C類：結局顯示，停止氛圍音與粒子 */
    stopAmbient();
    stopParticles();
    /* D類：結局停止性能監控 */
    try{stopPerfMonitor();}catch(e){}
    /* H類：填充結局統計 */
    try{renderEndingStats();}catch(e){}
    /* 功能14：繪製性格雷達圖與描述（壞結局/死亡內部自行隱藏） */
    try{renderPersonality();}catch(e){}
    /* 金色切割線→分屏→露出結局 */
    playCutLineAndSplit(so);
    /* 結局專用粒子效果：延遲到分屏打開後啟動 */
    setTimeout(function(){
      if(isBad){
        startBadBlood();
        var crack=document.getElementById('bad-crack-overlay');
        if(crack&&!SETTINGS.flashSafe&&!SETTINGS.reducedMotion)crack.classList.add('active');
      }
      if(isGood){startGoodParticles();}
    },trTime(1200));
  },trTime(1400));
}

/* --- Feature 21：偽結局 --- */
var pseudoTimers=[];
function triggerPseudoEnding(title,desc,metaText,returnSceneId){
  /* 清理上次殛留的計時器 */
  pseudoTimers.forEach(function(t){clearTimeout(t);});
  pseudoTimers=[];
  /* 清除打字機與無用選項輪詢 */
  if(typingState&&!typingState.done){clearTimeout(typeTimer);typingState.done=true;typingState=null;}
  if(uselessChoiceTimer){clearInterval(uselessChoiceTimer);uselessChoiceTimer=null;}
  closeDialogPanel();
  /* 設置結局內容——看似真結局 */
  var es=$('ending-screen');
  es.classList.remove('ending-bad','pseudo-ending','show-meta','glitching');
  es.classList.add('pseudo-ending');
  $('ending-type').textContent='結 局';
  $('ending-type').className='ending-type normal';
  $('ending-title').textContent=title;
  $('ending-desc').textContent=desc;
  $('ending-reward').textContent='';
  /* 隱藏統計與按鈕 */
  $('ending-stats').innerHTML='';
  /* 注入元敘事文本容器 */
  var metaEl=es.querySelector('.pseudo-meta');
  if(!metaEl){
    metaEl=document.createElement('div');
    metaEl.className='pseudo-meta';
    es.insertBefore(metaEl,$('ending-actions'));
  }
  metaEl.textContent=metaText;
  es.classList.remove('show-meta','glitching');
  /* 顯示結局畫面 */
  es.classList.add('show');
  $('game-screen').classList.remove('active');
  stopAmbient();
  stopParticles();
  /* 點擊或2.5秒後開始glitch */
  var proceed=function(){
    es.removeEventListener('click',proceed);
    if(es.classList.contains('glitching'))return;
    es.classList.add('glitching');
    /* 再1秒後顯示元敘事文本 */
    pseudoTimers.push(setTimeout(function(){
      es.classList.remove('glitching');
      es.classList.add('show-meta');
      /* 再1.5秒後返回指定場景 */
      pseudoTimers.push(setTimeout(function(){
        es.classList.remove('show','pseudo-ending','show-meta');
        es.classList.add('show'); /* 短暫顯示空白再切回 */
        setTimeout(function(){
          es.classList.remove('show');
          $('game-screen').classList.add('active');
          goToScene(returnSceneId);
        },200);
      },1500));
    },1000));
  };
  es.addEventListener('click',proceed);
  pseudoTimers.push(setTimeout(proceed,2500));
}
function onEndingReached(type,title){
  /* v3.9.2 修復：結局ID唯一化後，舊 mapping 的 type key 全部失效，導致大量成就永遠無法解鎖。
     此處改用新的穩定 ending type；title 僅作後備子字串比對（避免改名遺失）。
     其餘「場景發現型」成就（貓/禁書區/太平間/機器/林醫生/小雨/鏡子/解謎者等）改於對應場景直接 unlockAchievement。 */
  var mapping={
    1:{
      'hidden_mirror_door':{key:'ach_mirror'},   /* 鏡中門：揭開鏡子背後的秘密 */
      'survive_backdoor':{key:'ach_backdoor'},   /* 斷尾求生：緊急出口＝後門 */
      'bad_admin_guest':{key:'ach_admin',title:'管理員的客人'},
      'survive_trade':{key:'ach_trade'}
    },
    2:{
      'bad_applause':{key:'ach_lib_voice'},      /* 鼓掌＝打破沉默 */
      'bad_silence_cost':{key:'ach_lib_bad'},    /* 沉默的代價＝沉默結局 */
      'survive_silence':{key:'ach_lib_alone'},   /* 一個人熬過閉館鈴 */
      'normal_yuanyuan':{key:'ach_lib_truth'}    /* 畫冊＝拼出圖書館全部真相 */
    },
    3:{
      'normal_truth':{key:'ach_yuanyuan',title:'真相'},
      'normal_truth2':{key:'ach_truth'},         /* 與上同結局一併解「全部真相」 */
      'normal_lin_redemption':{key:'ach_lin'},   /* 林建國的救贖＝完成林醫生支線 */
      'bad_nightnurse':{key:'ach_nurse',title:'夜巡'}
    }
  };
  function unlockByDungeon(dungeonId, pairs){
    var hit=false;
    for(var tkey in pairs){
      var p=pairs[tkey];
      var typeMatch = (tkey==='normal_truth2') ? (type==='normal_truth') : (type===tkey);
      if(typeMatch || (p.title && title && title.indexOf(p.title)!==-1)){unlockAchievement(p.key);hit=true;}
    }
    /* 並非每個結局都有專屬成就；僅在 GM/除錯模式下輸出未匹配警告，避免正常遊玩刷 console */
    if(!hit && (window._gmUnlocked || new URLSearchParams(location.search).has('debug'))){
      console.warn('[achievement] 未匹配結局解鎖: dungeon='+dungeonId+' type='+type+' title='+title);
    }
  }
  if(currentDungeonId===1)unlockByDungeon(1,mapping[1]);
  else if(currentDungeonId===2)unlockByDungeon(2,mapping[2]);
  else unlockByDungeon(3,mapping[3]);
}

/* ============================================================
 * H類：結局統計 / 分享截圖 / 更新日誌 / 製作名單
 * ============================================================ */
var endingStatData=null;
function renderEndingStats(){
  var box=$('ending-stats');
  if(!box)return;
  var elapsed=Date.now()-gameStartTime;
  var inh=(typeof state!=='undefined'&&state&&state.inheritance)?state.inheritance:{};
  var deathCount=inh.deathCount||0;
  var readScenes=0;
  try{readScenes=getReadScenes().length;}catch(e){}
  endingStatData={
    elapsed:fmtElapsed(elapsed),
    death:deathCount,
    scenes:readScenes,
    dialogs:dialogCount,
    items:itemObtainCount,
    title:$('ending-title').textContent||'',
    type:$('ending-type').textContent||'',
    desc:$('ending-desc').textContent||''
  };
  box.innerHTML=
    '<div class="ending-stat"><span class="stat-num">'+endingStatData.elapsed+'</span><span class="stat-label">遊戲時長</span></div>'+
    '<div class="ending-stat"><span class="stat-num">'+endingStatData.death+'</span><span class="stat-label">死亡次數</span></div>'+
    '<div class="ending-stat"><span class="stat-num">'+endingStatData.scenes+'</span><span class="stat-label">看過場景</span></div>'+
    '<div class="ending-stat"><span class="stat-num">'+endingStatData.dialogs+'</span><span class="stat-label">對話次數</span></div>'+
    '<div class="ending-stat"><span class="stat-num">'+endingStatData.items+'</span><span class="stat-label">獲得物品</span></div>';
}
function generateEndingCard(){
  try{
    var W=800,H=1000;
    var cv=document.createElement('canvas');
    cv.width=W;cv.height=H;
    var ctx=cv.getContext('2d');
    /* 背景 */
    ctx.fillStyle='#0a0a0c';
    ctx.fillRect(0,0,W,H);
    /* 金色邊框 */
    ctx.strokeStyle='#c9a96e';
    ctx.lineWidth=4;
    ctx.strokeRect(20,20,W-40,H-40);
    /* 標題 */
    ctx.fillStyle='#c9a96e';
    ctx.font='bold 40px "Noto Serif SC",serif';
    ctx.textAlign='center';
    ctx.fillText('無盡之門',W/2,110);
    /* 分隔線 */
    ctx.strokeStyle='#8a7448';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(100,140);ctx.lineTo(W-100,140);ctx.stroke();
    /* 結局類型+標題 */
    var ed=endingStatData||{};
    ctx.fillStyle='#e8e4da';
    ctx.font='bold 26px "Noto Serif SC",serif';
    var line1=(ed.type||'結局')+' · '+(ed.title||'');
    ctx.fillText(line1,W/2,200);
    /* 結局描述（自動換行） */
    ctx.fillStyle='#c8c4bb';
    ctx.font='16px "Noto Serif SC",serif';
    ctx.textAlign='left';
    var desc=ed.desc||'';
    var maxW=W-200;
    var words=desc.split('');
    var line='';
    var ly=260;
    for(var i=0;i<words.length;i++){
      var test=line+words[i];
      if(ctx.measureText(test).width>maxW){
        ctx.fillText(line,100,ly);
        line=words[i];
        ly+=28;
      }else{line=test;}
    }
    if(line)ctx.fillText(line,100,ly);
    /* 分隔線 */
    var sepY=ly+50;
    ctx.strokeStyle='#8a7448';
    ctx.beginPath();ctx.moveTo(100,sepY);ctx.lineTo(W-100,sepY);ctx.stroke();
    /* 統計數據 */
    ctx.textAlign='center';
    var stats=[
      ['遊戲時長',ed.elapsed||'—'],
      ['死亡次數',String(ed.death!=null?ed.death:0)],
      ['看過場景',String(ed.scenes!=null?ed.scenes:0)],
      ['對話次數',String(ed.dialogs!=null?ed.dialogs:0)],
      ['獲得物品',String(ed.items!=null?ed.items:0)]
    ];
    var sy=sepY+70;
    for(var j=0;j<stats.length;j++){
      ctx.fillStyle='#c9a96e';
      ctx.font='bold 30px "JetBrains Mono",monospace';
      ctx.fillText(stats[j][1],W/2,sy);
      ctx.fillStyle='#6b6860';
      ctx.font='14px "Noto Sans SC",sans-serif';
      ctx.fillText(stats[j][0],W/2,sy+24);
      sy+=60;
    }
    /* 底部版本號 */
    ctx.fillStyle='#6b6860';
    ctx.font='14px "Noto Sans SC",sans-serif';
    ctx.fillText('版本 '+(typeof getVersionDisplay==='function'?getVersionDisplay():VERSION),W/2,H-80);
    ctx.font='bold 16px "JetBrains Mono",monospace';
    ctx.fillStyle='#8a7448';
    ctx.fillText('INFINITE GATES',W/2,H-50);
    /* 噪點效果（隨機像素點） */
    for(var n=0;n<800;n++){
      var px=Math.random()*W,py=Math.random()*H;
      ctx.fillStyle='rgba(255,255,255,'+(Math.random()*0.03)+')';
      ctx.fillRect(px,py,1,1);
    }
    /* 下載 */
    var url=cv.toDataURL('image/png');
    var a=document.createElement('a');
    a.href=url;
    a.download='無盡之門_結算.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('結算卡片已保存');
  }catch(e){
    showToast('生成失敗：'+e.message);
  }
}
function openChangelog(){
  var list=$('changelog-list');
  if(!list)return;
  var html='';
  for(var i=0;i<CHANGELOG.length;i++){
    var c=CHANGELOG[i];
    html+='<div class="changelog-entry">'+
      '<div><span class="changelog-ver">v'+c.version+'</span></div>'+
      '<ul>';
    for(var j=0;j<c.changes.length;j++){
      html+='<li>'+c.changes[j]+'</li>';
    }
    html+='</ul></div>';
  }
  list.innerHTML=html;
  $('changelog-modal').classList.add('show');
}
function openCredits(){
  var box=$('credits-scroll');
  if(!box)return;
  box.innerHTML=
    '<div class="c-title">無盡之門</div>'+
    '<div class="c-sub">INFINITE GATES</div>'+
    '<div class="c-sep">———</div>'+
    '<div class="c-role">製作 · 程式 · 劇本</div>'+
    '<div class="c-name">——</div>'+
    '<div class="c-sep">———</div>'+
    '<div class="c-role">特別感謝</div>'+
    '<div class="c-note">所有走進這扇門的人</div>'+
    '<div class="c-sep">———</div>'+
    '<div class="c-ver">版本 '+(typeof getVersionDisplay==='function'?getVersionDisplay():VERSION)+'</div>'+
    '<div class="c-note">2026</div>';
  $('credits-modal').classList.add('show');
}

/* --- 物品欄 --- */
function toggleInventory(){
  var willOpen=!$('inventory-panel').classList.contains('open');
  $('inventory-panel').classList.toggle('open');
  $('inventory-overlay').classList.toggle('show');
  if(!willOpen&&typeof combineMode!=='undefined'&&combineMode){
    combineMode=false;combineSelected=[];
    var bar=$('combine-bar');if(bar)bar.style.display='none';
    updateInventoryUI();
  }
}

/* --- 回憶錄 --- */
/* 總遊玩時間追蹤（localStorage 累計，僅遊戲進行中計時） */
var TOTAL_PLAY_KEY='wuxian-total-play-ms';
var totalPlayMs=0;
try{totalPlayMs=parseInt(localStorage.getItem(TOTAL_PLAY_KEY)||'0',10)||0;}catch(e){}
var _lastPlayTick=Date.now();
setInterval(function(){
  var now=Date.now();var dt=now-_lastPlayTick;_lastPlayTick=now;
  var gs=document.getElementById('game-screen');
  var es=document.getElementById('ending-screen');
  if(gs&&gs.classList.contains('active')&&!(es&&es.classList.contains('show'))){
    totalPlayMs+=dt;
    try{localStorage.setItem(TOTAL_PLAY_KEY,String(totalPlayMs));}catch(e){}
  }
},5000);
window.addEventListener('beforeunload',function(){
  try{localStorage.setItem(TOTAL_PLAY_KEY,String(totalPlayMs));}catch(e){}
});
/* 統計區塊 HTML */
function memoirStatsHTML(){
  var inh={};try{inh=loadInheritance();}catch(e){}
  var deaths=inh.deathCount||0;
  var endDisc=0;try{endDisc=discoveredEndings();}catch(e){}
  var endTotal=TOTAL_ENDINGS||0;
  var achUn=0;try{
    var allAch=getAchList();
    if(ACH_DEFS&&ACH_DEFS.length){
      achUn=ACH_DEFS.filter(function(a){return allAch.indexOf(a.id)!==-1;}).length;
    }else{achUn=allAch.length;}
  }catch(e){}
  var achTotal=(ACH_DEFS&&ACH_DEFS.length)?ACH_DEFS.length:ACH_TOTAL;
  return '<div class="memoir-stats">'+
    '<div class="ms-stat-title">遊 戲 統 計</div>'+
    '<div class="ms-stat-row"><span>總遊玩時間</span><span id="memoir-total-time">'+fmtElapsed(totalPlayMs)+'</span></div>'+
    '<div class="ms-stat-row"><span>本輪死亡次數</span><span>'+deaths+'</span></div>'+
    '<div class="ms-stat-row"><span>已發現結局</span><span>'+endDisc+' / '+endTotal+'</span></div>'+
    '<div class="ms-stat-row"><span>已解鎖成就</span><span>'+achUn+' / '+achTotal+'</span></div>'+
    '</div>';
}
var _memoirStatsTimer=null;
function startMemoirStatsTick(){
  if(_memoirStatsTimer)clearInterval(_memoirStatsTimer);
  _memoirStatsTimer=setInterval(function(){
    var p=document.getElementById('notes-panel');
    if(!p||!p.classList.contains('open')){clearInterval(_memoirStatsTimer);_memoirStatsTimer=null;return;}
    var el=document.getElementById('memoir-total-time');
    if(el)el.textContent=fmtElapsed(totalPlayMs);
  },1000);
}
function addNote(id,title,content){
  state.notes.push({id:id,title:title,content:content});renderNotes();
}
function renderNotes(){
  var stats=memoirStatsHTML();
  $('notes-list').innerHTML=stats+(state.notes.length?state.notes.map(function(n){
    return '<div class="note-item"><div class="note-id">'+n.id+'</div><div class="note-title">'+n.title+'</div><div class="note-content">'+n.content+'</div></div>';
  }).join(''):'<div class="panel-empty">還沒有記錄</div>');
}
function toggleNotes(){
  $('notes-panel').classList.toggle('open');$('notes-overlay').classList.toggle('show');
  if($('notes-panel').classList.contains('open'))startMemoirStatsTick();
}
function openNotes(){
  $('notes-panel').classList.add('open');$('notes-overlay').classList.add('show');
  startMemoirStatsTick();
}

/* --- 地圖 --- */
function markZone(id){
  var z=state.mapZones.find(function(z){return z.id===id;});
  state.mapZones.forEach(function(zz){zz.current=false;});
  if(z){z.explored=true;z.current=true;renderMap();}
}
var summaryZoneId=null;
function renderMap(){
  $('map-list').innerHTML=state.mapZones.map(function(z){
    var known=z.explored||z.current;
    var clickable=known&&z.scene&&SCENES[z.scene];
    var dotCls=z.current?'current':(z.explored?'explored':'unexplored');
    var html='<span class="map-dot '+dotCls+'"></span><span class="map-name '+(known?'':'unexplored')+'">'+(known?z.name:'？？？')+'</span>';
    /* F類：已探索區域懸浮顯示 summary */
    var tipAttr='';
    if(known&&z.summary){tipAttr=' data-tooltip="'+String(z.summary).replace(/"/g,'&quot;')+'"';}
    if(clickable){
      return '<div class="map-zone clickable"'+tipAttr+' onclick="showMapSummary(\''+z.id+'\')">'+html+'<span class="map-go">詳情</span></div>';
    }
    return '<div class="map-zone"'+tipAttr+'>'+html+'</div>';
  }).join('');
}
function showMapSummary(id){
  var z=state.mapZones.find(function(zz){return zz.id===id;});
  if(!z)return;
  if(!(z.explored||z.current)){showToast('還沒有探索過那裡');return;}
  if(!z.scene||!SCENES[z.scene]){showToast('那裡還無法直接前往');return;}
  summaryZoneId=id;
  $('ms-name').textContent=z.name;
  $('ms-text').textContent=z.summary||'這個區域沒有留下記錄。';
  $('map-summary-popup').classList.add('show');
}
function hideMapSummary(){
  summaryZoneId=null;
  $('map-summary-popup').classList.remove('show');
}
function goFromSummary(){
  var id=summaryZoneId;
  hideMapSummary();
  if(!id)return;
  var z=state.mapZones.find(function(zz){return zz.id===id;});
  if(!z||!z.scene||!SCENES[z.scene]){showToast('那裡還無法直接前往');return;}
  $('map-panel').classList.remove('open');
  $('map-overlay').classList.remove('show');
  goToScene(z.scene);
}
function jumpToZone(id){
  showMapSummary(id);
}
function toggleMap(){$('map-panel').classList.toggle('open');$('map-overlay').classList.toggle('show');}
function openMap(){$('map-panel').classList.add('open');$('map-overlay').classList.add('show');}

/* --- 歷史 --- */
function pushHistory(tag,text){
  state.history.push({tag:tag,text:text,time:Date.now()});
  if(state.history.length>200)state.history.shift();
}
var histSearchQuery='';
function fmtHistTime(ts){
  if(!ts)return '';
  var d=new Date(ts);
  var m=String(d.getMinutes()).padStart(2,'0');
  var s=String(d.getSeconds()).padStart(2,'0');
  return m+':'+s;
}
function openHistory(){
  histSearchQuery='';
  var sb=$('hist-search');if(sb)sb.value='';
  renderHistory();$('history-modal').classList.add('show');
}
function renderHistory(){
  var list=state.history.slice().reverse();
  /* 搜索過濾 */
  if(histSearchQuery){
    var q=histSearchQuery.toLowerCase();
    list=list.filter(function(h){
      return (h.tag&&h.tag.toLowerCase().indexOf(q)!==-1)||(h.text&&h.text.toLowerCase().indexOf(q)!==-1);
    });
  }
  $('history-list').innerHTML=list.length?list.map(function(h){
    var timeStr=fmtHistTime(h.time);
    return '<div class="hist-item clickable" onclick="this.classList.toggle(\'expanded\')">'+
      '<div class="hist-tag">'+h.tag+(timeStr?'<span class="hist-time">'+timeStr+'</span>':'')+'</div>'+
      '<div class="hist-text">'+h.text+'</div>'+
      '<div class="hist-full">'+h.text+'</div>'+
      '</div>';
  }).join(''):'<div class="panel-empty">沒有符合的記錄</div>';
}
function onHistSearchInput(){
  var sb=$('hist-search');
  histSearchQuery=sb?sb.value.trim():'';
  renderHistory();
}

/* --- 章節選擇 --- */
function openChapterSelect(){
  renderChapterList();
  $('chapter-modal').classList.add('show');
}
function renderChapterList(){
  var list=getUnlockedChapters();
  /* 合併已讀場景記錄，只保留真實存在的場景 */
  var allScenes=getReadScenes().concat(list);
  /* 去重 */
  var unique=[];
  allScenes.forEach(function(s){if(unique.indexOf(s)===-1)unique.push(s);});
  /* 過濾出真實存在於 SCENES 的場景 */
  var items=unique.map(function(sid){
    var sceneKey=null,roomName='';
    for(var k in SCENES){
      if(SCENES[k].sceneId===sid){sceneKey=k;roomName=SCENES[k].roomName||'';break;}
    }
    if(!sceneKey){
      if(SCENES[sid]){sceneKey=sid;roomName=SCENES[sid].roomName||'';}
      else return null;
    }
    return {sid:sid,sceneKey:sceneKey,roomName:roomName};
  }).filter(Boolean);
  var html=items.map(function(it){
    return '<div class="chapter-item" onclick="jumpToChapter(\''+it.sceneKey+'\')">'+
      '<span class="ch-id">'+it.sid+'</span>'+
      '<span class="ch-name">'+it.roomName+'</span>'+
      '<span class="ch-go">前往 ›</span>'+
      '</div>';
  }).join('');
  $('chapter-list').innerHTML=html||'<div class="chapter-empty">尚未解鎖章節</div>';
}
function jumpToChapter(sceneKey){
  if(!SCENES[sceneKey]){showToast('該場景不存在');return;}
  closeModal('chapter-modal');
  if($('inventory-panel'))$('inventory-panel').classList.remove('open');
  if($('inventory-overlay'))$('inventory-overlay').classList.remove('show');
  if($('notes-panel'))$('notes-panel').classList.remove('open');
  if($('notes-overlay'))$('notes-overlay').classList.remove('show');
  if($('map-panel'))$('map-panel').classList.remove('open');
  if($('map-overlay'))$('map-overlay').classList.remove('show');
  if($('ach-panel'))$('ach-panel').classList.remove('open');
  if($('ach-overlay'))$('ach-overlay').classList.remove('show');
  $('game-title-screen').classList.remove('active');
  $('game-screen').classList.add('active');
  goToScene(sceneKey);
}

/* --- 物品詳情 --- */
/* 可直接從背包使用的消耗品：點擊即自動生效並移除。
 * 邊界：鑰匙/書籍/照片/線索，以及必須在特定場景交換或會直接觸發壞結局的物品
 * （如鎮定劑、未標籤藥瓶）不在此列，仍由場景選項或醫生辨識觸發。 */
var ITEM_CONSUMABLES={
  painkiller:{use:function(){
    if(!hasItem('painkiller'))return false;
    removeItem('painkiller');addTime(15);
    appendNarrative('<p class="action">你從背包翻出止痛藥，就著自來水吞下一顆。藥片在嘴裡化開，苦的。幾分鐘後眼皮開始沉。倒數多了15分鐘。</p>');
    return true;
  }},
  antibiotic:{use:function(){
    if(!hasItem('antibiotic'))return false;
    removeItem('antibiotic');addTime(20);
    if(Math.random()>0.7){damage(20);appendNarrative('<p class="system-msg">過敏反應！喉嚨發緊，手上起了一片疹子。生命-20。</p>');}
    else{appendNarrative('<p class="action">你把抗生素注射了。沒有過敏反應。倒數多了20分鐘。</p>');}
    return true;
  }},
  valium:{use:function(){
    if(!hasItem('valium'))return false;
    removeItem('valium');addTime(10);
    appendNarrative('<p class="action">你吞了一片安定。睡意很快上來，你靠牆眯了一會。倒數多了10分鐘。</p>');
    return true;
  }},
  backup_sedative:{use:function(){
    if(!hasItem('backup_sedative'))return false;
    removeItem('backup_sedative');addTime(25);
    appendNarrative('<p class="action">林醫生辨識過的那針。你穩住劑量注射了。世界慢下來，人卻很清醒。倒數多了25分鐘。</p>');
    return true;
  }},
  epinephrine:{use:function(){
    if(!hasItem('epinephrine'))return false;
    removeItem('epinephrine');state.hp=Math.min(state.maxHp||100,state.hp+30);updateHP();
    appendNarrative('<p class="action">你把腎上腺素扎進大腿。一陣銳痛，心跳猛地撞了一下，又穩住。生命恢復30。</p>');
    return true;
  }},
  antibiotic_painkiller:{use:function(){
    if(!hasItem('antibiotic_painkiller'))return false;
    removeItem('antibiotic_painkiller');addTime(25);
    state.hp=Math.min(state.maxHp||100,state.hp+20);updateHP();
    appendNarrative('<p class="action">你服下複合藥劑。苦味過後，疼痛與發熱同時退去。倒數多了25分鐘，生命恢復20。</p>');
    return true;
  }},
  epinephrine_sedative:{use:function(){
    if(!hasItem('epinephrine_sedative'))return false;
    removeItem('epinephrine_sedative');addTime(20);
    state.hp=Math.min(state.maxHp||100,state.hp+40);updateHP();
    appendNarrative('<p class="action">你注射了應急針劑。腎上腺素壓住了鎮定劑的昏沉，心跳強勁而平穩。倒數多了20分鐘，生命恢復40。</p>');
    return true;
  }},
  medicine_record:{use:function(){
    if(!hasItem('medicine_record'))return false;
    removeItem('medicine_record');addTime(20);
    appendNarrative('<p class="action">你按病歷核對過的劑量服下藥瓶裡的抗生素，沒有出現過敏反應。倒數多了20分鐘。</p>');
    return true;
  }}
};
function showItemDetail(item){
  $('item-detail-name').textContent=item.name;
  $('item-detail-desc').textContent=item.desc;
  $('item-detail-usage').textContent=item.usage||'— 無特殊用法 —';
  $('item-detail-modal').classList.add('show');
}
function showItemDetailById(id){
  var it=state.inventory.find(function(i){return i.id===id;});
  if(!it)return;
  /* 消耗品：點擊即自動使用，不再開詳情 */
  var cons=ITEM_CONSUMABLES[id];
  if(cons){
    if(cons.use()){showToast('使用了：'+it.name);return;}
  }
  showItemDetail(it);
}

/* ============================================================
 * 功能11：分支樹可視化（純 SVG，BFS 分層佈局，支援縮放平移）
 * ============================================================ */
var branchDefaultVb='0 0 100 100';
var branchPanInit=false;
/* 判斷節點類型：壞結局 / 逃過一節 / 普通結局 / 普通路徑 */
function branchNodeType(key,sc){
  if(!sc)return 'ending';
  var id=(key||'').toLowerCase();
  var hasNext=(sc.choices||[]).some(function(c){return c.next;});
  if(/death|bad/.test(id))return 'bad';
  if(/survive|escape/.test(id))return 'survive';
  if(!hasNext)return 'ending';
  return 'path';
}
function openBranchTree(){
  renderBranchTree();
  branchInitPan();
  $('branch-modal').classList.add('show');
}
/* 結局畫面「查看分支樹」：關閉結局、打開分支樹並定位到當前場景節點 */
function viewBranchFromEnding(e){
  if(e&&e.stopPropagation)e.stopPropagation();
  /* 取消偽結局待執行計時器，避免背景跳場景 */
  if(typeof pseudoTimers!=='undefined'&&pseudoTimers&&pseudoTimers.length){
    pseudoTimers.forEach(function(t){clearTimeout(t);});
    pseudoTimers.length=0;
  }
  var es=$('ending-screen');
  es.classList.remove('show','pseudo-ending','show-meta','glitching');
  $('game-screen').classList.add('active');
  openBranchTree();
  setTimeout(function(){locateBranchNode(state.currentScene);},60);
}
/* 高亮並縮放定位到指定分支樹節點 */
function locateBranchNode(nodeId){
  if(!nodeId||!window._branchNodePositions)return;
  var svg=$('branch-svg');if(!svg)return;
  var el=svg.querySelector('[data-node-id="'+String(nodeId).replace(/"/g,'\\"')+'"]');
  if(el){
    var shape=el.querySelector('circle,ellipse');
    if(shape){
      if(shape.tagName==='circle'){shape.setAttribute('r','9');}
      shape.setAttribute('stroke','var(--accent-bright)');
      shape.setAttribute('stroke-width','2.5');
    }
  }
  var p=window._branchNodePositions[nodeId];
  if(!p)return;
  var wrap=$('branch-canvas-wrap');
  var cw=wrap?wrap.clientWidth:800,ch=wrap?wrap.clientHeight:500;
  var bw=420,bh=320; /* 以節點為中心的初始視窗大小 */
  if(cw/ch>bw/bh){bw=bh*cw/ch;}else{bh=bw*ch/cw;}
  svg.setAttribute('viewBox',(p.x-bw/2)+' '+(p.y-bh/2)+' '+bw+' '+bh);
}
function renderBranchTree(){
  var svg=$('branch-svg');
  var info=$('branch-info');
  if(!svg)return;
  svg.innerHTML='';
  if(!SCENES||!Object.keys(SCENES).length){info.textContent='尚未踏入門扉。';return;}
  var cfg=DUNGEON_CONFIG[currentDungeonId]||DUNGEON_CONFIG[1];
  var start=cfg.startScene;
  /* 已讀集合 */
  var readSet={};
  try{getReadScenes().forEach(function(s){readSet[s]=true;});}catch(e){}
  /* 輔助：提取場景所有出邊目標（包含 c.next、函数型 choices、c.action 內 goToScene 及 onEnter 內 goToScene） */
  function _getSceneTargets(scObj){
    if(!scObj) return [];
    var out = [];
    var chList = (typeof scObj.choices === 'function') ? (scObj.choices(state) || []) : (scObj.choices || []);
    chList.forEach(function(c){
      if(c.next && SCENES[c.next] && out.indexOf(c.next) === -1) out.push(c.next);
      if(c.action){
        var s = String(c.action);
        var re = /goToScene\(\s*['"]([^'"]+)['"]\s*\)/g, m;
        while((m = re.exec(s)) !== null){
          if(SCENES[m[1]] && out.indexOf(m[1]) === -1) out.push(m[1]);
        }
      }
    });
    if(scObj.onEnter){
      var s2 = String(scObj.onEnter);
      var re2 = /goToScene\(\s*['"]([^'"]+)['"]\s*\)/g, m2;
      while((m2 = re2.exec(s2)) !== null){
        if(SCENES[m2[1]] && out.indexOf(m2[1]) === -1) out.push(m2[1]);
      }
    }
    return out;
  }
  /* BFS 從起點分層 */
  var levels={},depth={},queue=[start];depth[start]=0;var guard=0;
  while(queue.length&&guard<2000){
    guard++;
    var cur=queue.shift();
    var sc=SCENES[cur];if(!sc)continue;
    var d=depth[cur];
    if(!levels[d])levels[d]=[];
    levels[d].push(cur);
    _getSceneTargets(sc).forEach(function(tgt){
      if(SCENES[tgt]&&depth[tgt]==null){
        depth[tgt]=d+1;queue.push(tgt);
      }
    });
  }
  /* 若有未連接的獨立/隱藏場景節點，亦納入最末層避免遺漏 */
  var maxReachedLvl = Object.keys(levels).length ? Math.max.apply(null, Object.keys(levels).map(Number)) : 0;
  Object.keys(SCENES).forEach(function(k){
    if(depth[k] == null && SCENES[k]){
      var orphanLvl = maxReachedLvl + 1;
      depth[k] = orphanLvl;
      if(!levels[orphanLvl]) levels[orphanLvl] = [];
      levels[orphanLvl].push(k);
    }
  });
  var levelKeys=Object.keys(levels).map(Number).sort(function(a,b){return a-b;});
  var LEVEL_W=180,NODE_H=68;
  var pos={},maxN=1;
  levelKeys.forEach(function(l){maxN=Math.max(maxN,levels[l].length);});
  /* 第一遍：均勻分布作為初始值 */
  levelKeys.forEach(function(l){
    var arr=levels[l],n=arr.length;
    arr.forEach(function(key,i){
      pos[key]={x:l*LEVEL_W,y:(i-(n-1)/2)*NODE_H};
    });
  });
  /* 第二遍：父節點重心引導 + 同層防重疊（迭代4次，消除節點重疊） */
  var parentMap={};
  levelKeys.forEach(function(l){
    levels[l].forEach(function(key){
      var sc=SCENES[key];
      _getSceneTargets(sc).forEach(function(tgt){
        if(pos[tgt]&&depth[tgt]===l+1){
          if(!parentMap[tgt])parentMap[tgt]=[];
          if(parentMap[tgt].indexOf(key)===-1)parentMap[tgt].push(key);
        }
      });
    });
  });
  for(var _iter=0;_iter<4;_iter++){
    /* 拉向父節點重心：子節點圍繞父節點的y位置分布，避免跨分支重疊 */
    levelKeys.forEach(function(l){
      if(l===0)return;
      levels[l].forEach(function(key){
        var parents=parentMap[key];
        if(parents&&parents.length){
          var avgY=parents.reduce(function(s,p){return s+pos[p].y;},0)/parents.length;
          pos[key].y=pos[key].y*0.45+avgY*0.55;
        }
      });
    });
    /* 同層防重疊：按y排序，相鄰節點距離不足則對稱推開 */
    levelKeys.forEach(function(l){
      var arr=levels[l].slice().sort(function(a,b){return pos[a].y-pos[b].y;});
      var minDist=NODE_H*0.82;
      for(var _i=1;_i<arr.length;_i++){
        var d=pos[arr[_i]].y-pos[arr[_i-1]].y;
        if(d<minDist){
          var push=(minDist-d)/2;
          pos[arr[_i-1]].y-=push;
          pos[arr[_i]].y+=push;
        }
      }
    });
  }
  /* 收集無用分支（GM模式），為每個場景的無用選項創建虛擬節點 */
  var uselessNodes={}; /* id -> {parentId, text, x, y} */
  var uselessEdges=[]; /* {from, to, type} */
  if(window._gmUnlocked){
    levelKeys.forEach(function(l){
      levels[l].forEach(function(key){
        var sc=SCENES[key];
        var uselessChoices=(sc.choices||[]).filter(function(c){return c.useless;});
        if(uselessChoices.length===0)return;
        var pp=pos[key];
        uselessChoices.forEach(function(uc,idx){
          var uid='__useless__'+key+'__'+idx;
          /* 多個無用分支在父節點上方水平展開 */
          var spread=(idx-(uselessChoices.length-1)/2)*55;
          var ux=pp.x+spread,uy=pp.y-52;
          uselessNodes[uid]={parentId:key,text:uc.text,x:ux,y:uy,choiceIdx:idx};
          uselessEdges.push({from:key,to:uid,type:'to_useless'});
          uselessEdges.push({from:uid,to:key,type:'from_useless'});
        });
      });
    });
  }
  /* 計算包含無用節點後的邊界 */
  var allMinY=0,allMaxY=0;
  Object.keys(pos).forEach(function(k){if(pos[k].y<allMinY)allMinY=pos[k].y;if(pos[k].y>allMaxY)allMaxY=pos[k].y;});
  Object.keys(uselessNodes).forEach(function(k){if(uselessNodes[k].y<allMinY)allMinY=uselessNodes[k].y;});
  var maxLvl=levelKeys.length?levelKeys[levelKeys.length-1]:0;
  var padX=90,padY=Math.max(80,(allMaxY-allMinY)/2+70);
  var vbW=maxLvl*LEVEL_W+padX*2;
  var vbH=(allMaxY-allMinY)+padY*2;
  var ox=padX,oy=vbH/2;
  var NS='http://www.w3.org/2000/svg';
  svg.setAttribute('viewBox','0 0 '+vbW+' '+vbH);
  branchDefaultVb=svg.getAttribute('viewBox');
  /* 存儲所有節點位置（含無用節點），供GM「？」精準定位 */
  window._branchNodePositions={};
  Object.keys(pos).forEach(function(k){window._branchNodePositions[k]={x:pos[k].x+ox,y:pos[k].y+oy};});
  Object.keys(uselessNodes).forEach(function(k){window._branchNodePositions[k]={x:uselessNodes[k].x+ox,y:uselessNodes[k].y+oy};});
  /* SVG defs：箭頭標記 */
  var defs=document.createElementNS(NS,'defs');
  defs.innerHTML='<marker id="arrow-normal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--border)"/></marker>'+
    '<marker id="arrow-read" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"/></marker>'+
    '<marker id="arrow-useless" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--text-dim)"/></marker>';
  svg.appendChild(defs);
  var g=document.createElementNS(NS,'g');
  svg.appendChild(g);
  function P(key){var p=pos[key];return {x:p.x+ox,y:p.y+oy};}
  function UP(uid){var u=uselessNodes[uid];return {x:u.x+ox,y:u.y+oy};}
  /* 正常連線（帶箭頭，涵蓋 c.next 與 action/onEnter 跳轉） */
  levelKeys.forEach(function(l){
    levels[l].forEach(function(key){
      var sc=SCENES[key],from=P(key);
      _getSceneTargets(sc).forEach(function(tgt){
        var c={next:tgt};
        if(!c.next||!pos[c.next])return;
        var to=P(c.next);
        var fromRead=readSet[sc.sceneId||key];
        var toRead=readSet[(SCENES[c.next].sceneId||c.next)];
        var bothRead=fromRead&&toRead;
        var path=document.createElementNS(NS,'path');
        var d;
        if(depth[c.next]<=l){
          var mx=(from.x+to.x)/2,my=Math.min(from.y,to.y)-40;
          d='M'+from.x+','+from.y+' Q'+mx+','+my+' '+to.x+','+to.y;
        }else{
          d='M'+from.x+','+from.y+' L'+to.x+','+to.y;
        }
        path.setAttribute('d',d);
        path.setAttribute('fill','none');
        path.setAttribute('stroke',bothRead?'var(--accent)':'var(--border)');
        path.setAttribute('stroke-width',bothRead?1.4:0.8);
        path.setAttribute('opacity',bothRead?0.85:0.4);
        path.setAttribute('marker-end',bothRead?'url(#arrow-read)':'url(#arrow-normal)');
        g.appendChild(path);
      });
    });
  });
  /* 無用分支連線：父→無用節點（彎上），無用節點→父（彎回落，略偏移） */
  if(window._gmUnlocked){
    uselessEdges.forEach(function(e){
      var path=document.createElementNS(NS,'path');
      var d;
      if(e.type==='to_useless'){
        var from=P(e.from),to=UP(e.to);
        /* 從父節點向上彎到無用節點 */
        var cpx=(from.x+to.x)/2,cpy=Math.min(from.y,to.y)-18;
        d='M'+from.x+','+(from.y-6)+' Q'+cpx+','+cpy+' '+to.x+','+(to.y+10);
      }else{
        var fromU=UP(e.from),toP=P(e.to);
        /* 從無用節點彎回父節點，向右側偏移避免重疊 */
        var cpx2=(fromU.x+toP.x)/2+12,cpy2=Math.max(fromU.y,toP.y)-10;
        d='M'+(fromU.x+4)+','+(fromU.y+10)+' Q'+cpx2+','+cpy2+' '+(toP.x+6)+','+(toP.y+2);
      }
      path.setAttribute('d',d);
      path.setAttribute('fill','none');
      path.setAttribute('stroke','var(--text-dim)');
      path.setAttribute('stroke-width','0.7');
      path.setAttribute('opacity','0.45');
      path.setAttribute('stroke-dasharray','3 2');
      path.setAttribute('marker-end','url(#arrow-useless)');
      g.appendChild(path);
    });
  }
  /* 正常節點 */
  levelKeys.forEach(function(l){
    levels[l].forEach(function(key){
      var sc=SCENES[key],p=P(key);
      var type=branchNodeType(key,sc);
      var isRead=!!readSet[sc.sceneId||key];
      var isCurrent=(state&&state.currentScene===key);
      var isGM=!!window._gmUnlocked;
      /* 非GM：未探索節點顯示為「？」，不暴露類型和內容 */
      var showMasked=!isGM&&!isRead&&!isCurrent;
      var gn=document.createElementNS(NS,'g');
      gn.setAttribute('class','branch-node'+(isCurrent?' current':''));
      gn.style.cursor='pointer';
      gn.setAttribute('data-node-id',key);
      var circle=document.createElementNS(NS,'circle');
      circle.setAttribute('cx',p.x);circle.setAttribute('cy',p.y);circle.setAttribute('r',6);
      var fill='transparent',stroke='var(--text-dim)';
      if(showMasked){fill='rgba(80,80,80,.3)';stroke='var(--text-dim)';}
      else if(type==='bad'){fill='var(--danger-bright)';stroke='var(--danger-bright)';}
      else if(type==='survive'){fill='var(--accent)';stroke='var(--accent)';}
      else if(type==='ending'){fill='var(--text-bright)';stroke='var(--text-bright)';}
      else if(isRead){fill='var(--accent)';stroke='var(--accent)';}
      circle.setAttribute('fill',fill);
      circle.setAttribute('stroke',stroke);
      circle.setAttribute('stroke-width','1.2');
      gn.appendChild(circle);
      var label=document.createElementNS(NS,'text');
      label.setAttribute('x',p.x);label.setAttribute('y',p.y-11);
      label.setAttribute('text-anchor','middle');
      label.setAttribute('class','node-label');
      label.textContent=showMasked?'？':(sc.sceneId||key);
      if(showMasked){label.setAttribute('fill','var(--text-dim)');label.setAttribute('opacity','0.6');}
      gn.appendChild(label);
      gn.addEventListener('click',function(){
        var box=$('branch-info');
        if(showMasked){
          box.innerHTML='<strong style="color:var(--text-dim)">？ 未探索</strong><br><span style="color:var(--text-dim)">你還沒有來到這裡。繼續探索以解鎖。</span>';
          return;
        }
        var firstText='';
        if(sc.text&&sc.text.length){
          var raw=String(sc.text[0]).replace(/<[^>]+>/g,'').replace(/\[shake\]|\[glow\]|\[ghost\]/g,'');
          firstText=raw.length>60?raw.slice(0,60)+'…':raw;
        }
        box.innerHTML='<strong style="color:var(--accent)">'+(sc.roomName||key)+'</strong>　'+(sc.sceneId||'')+
          (isRead?'　<span style="color:var(--accent-dim)">已讀</span>':'　<span style="color:var(--text-dim)">未探索</span>')+
          (isCurrent?'　<span style="color:var(--accent-bright)">← 當前</span>':'')+
          (firstText?'<br>'+firstText:'');
      });
      g.appendChild(gn);
    });
  });
  /* 無用分支節點（橢圓形） */
  if(window._gmUnlocked){
    Object.keys(uselessNodes).forEach(function(uid){
      var u=uselessNodes[uid],up=UP(uid);
      var gn=document.createElementNS(NS,'g');
      gn.setAttribute('class','branch-node useless-node');
      gn.style.cursor='pointer';
      gn.setAttribute('data-node-id',uid);
      var ell=document.createElementNS(NS,'ellipse');
      ell.setAttribute('cx',up.x);ell.setAttribute('cy',up.y);
      ell.setAttribute('rx',22);ell.setAttribute('ry',9);
      ell.setAttribute('fill','rgba(60,60,60,.5)');
      ell.setAttribute('stroke','var(--text-dim)');
      ell.setAttribute('stroke-width','0.8');
      ell.setAttribute('stroke-dasharray','2 1.5');
      gn.appendChild(ell);
      var label=document.createElementNS(NS,'text');
      label.setAttribute('x',up.x);label.setAttribute('y',up.y+3);
      label.setAttribute('text-anchor','middle');
      label.setAttribute('font-size','6.5');
      label.setAttribute('fill','var(--text-dim)');
      label.setAttribute('font-family','var(--font-mono)');
      label.textContent='無用';
      gn.appendChild(label);
      gn.addEventListener('click',function(){
        var box=$('branch-info');
        box.innerHTML='<strong style="color:var(--text-dim)">無關分支</strong>'+
          '<br>所屬場景：'+(SCENES[u.parentId]?(SCENES[u.parentId].roomName||u.parentId):u.parentId)+
          '<br>選項：「'+u.text+'」'+
          '<br><span style="color:var(--text-dim)">此選項不影響劇情走向，僅播放額外描述後返回原場景。</span>';
      });
      g.appendChild(gn);
    });
  }
  info.textContent='點擊節點查看場景資訊　·　拖拽平移　·　按鈕縮放'+(window._gmUnlocked?'　·　虛線橢圓＝無關分支':'');
}
function branchZoom(factor){
  var svg=$('branch-svg');if(!svg)return;
  var vb=svg.viewBox.baseVal;
  var cx=vb.x+vb.width/2,cy=vb.y+vb.height/2;
  var nw=vb.width/factor,nh=vb.height/factor;
  vb.x=cx-nw/2;vb.y=cy-nh/2;vb.width=nw;vb.height=nh;
}
function branchReset(){
  var svg=$('branch-svg');if(!svg||!branchDefaultVb)return;
  svg.setAttribute('viewBox',branchDefaultVb);
}
/* 分支樹拖拽平移（滑鼠 + 觸控） */
function branchInitPan(){
  if(branchPanInit)return;branchPanInit=true;
  var wrap=$('branch-canvas-wrap');var svg=$('branch-svg');
  if(!wrap||!svg)return;
  var dragging=false,lx=0,ly=0;
  function moveVb(dxPx,dyPx){
    var vb=svg.viewBox.baseVal;
    var dx=dxPx/wrap.clientWidth*vb.width;
    var dy=dyPx/wrap.clientHeight*vb.height;
    vb.x-=dx;vb.y-=dy;
  }
  wrap.addEventListener('mousedown',function(e){dragging=true;lx=e.clientX;ly=e.clientY;e.preventDefault();});
  window.addEventListener('mousemove',function(e){
    if(!dragging)return;
    moveVb(e.clientX-lx,e.clientY-ly);
    lx=e.clientX;ly=e.clientY;
  });
  window.addEventListener('mouseup',function(){dragging=false;});
  wrap.addEventListener('touchstart',function(e){
    if(e.touches.length===1){dragging=true;lx=e.touches[0].clientX;ly=e.touches[0].clientY;}
  },{passive:true});
  wrap.addEventListener('touchmove',function(e){
    if(!dragging||e.touches.length!==1)return;
    moveVb(e.touches[0].clientX-lx,e.touches[0].clientY-ly);
    lx=e.touches[0].clientX;ly=e.touches[0].clientY;
  },{passive:true});
  wrap.addEventListener('touchend',function(){dragging=false;});
}

/* ============================================================
 * 功能14：旅人性格畫像（三角形雷達圖 + 一句話描述）
 * ============================================================ */
function renderPersonality(){
  var panel=$('personality-panel');if(!panel)return;
  var typeTxt=$('ending-type')?$('ending-type').textContent:'';
  /* 壞結局 / 死亡結局不顯示性格畫像 */
  if(typeTxt.indexOf('壞結局')!==-1||typeTxt.indexOf('死亡')!==-1){panel.classList.remove('show');return;}
  var p=(state&&state.personality)?state.personality:{calm:50,altruism:50,cautious:50};
  panel.classList.add('show');
  var svg=$('radar-chart');if(!svg)return;
  var cx=100,cy=100,R=68;
  var axes=[
    {k:'calm',ang:-90,label:'冷靜'},
    {k:'altruism',ang:150,label:'利他'},
    {k:'cautious',ang:30,label:'謹慎'}
  ];
  function pt(angDeg,rad){
    var a=angDeg*Math.PI/180;
    return [cx+rad*Math.cos(a),cy+rad*Math.sin(a)];
  }
  var NS='http://www.w3.org/2000/svg';
  svg.innerHTML='';
  /* 同心三角形網格 */
  [0.25,0.5,0.75,1].forEach(function(f){
    var pts=axes.map(function(a){return pt(a.ang,R*f).join(',');}).join(' ');
    var poly=document.createElementNS(NS,'polygon');
    poly.setAttribute('points',pts);
    poly.setAttribute('fill','none');
    poly.setAttribute('stroke','var(--accent-dim)');
    poly.setAttribute('stroke-width','0.5');
    poly.setAttribute('opacity','0.5');
    svg.appendChild(poly);
  });
  /* 軸線與頂點標籤 */
  axes.forEach(function(a){
    var p2=pt(a.ang,R);
    var line=document.createElementNS(NS,'line');
    line.setAttribute('x1',cx);line.setAttribute('y1',cy);
    line.setAttribute('x2',p2[0]);line.setAttribute('y2',p2[1]);
    line.setAttribute('stroke','var(--border)');line.setAttribute('stroke-width','0.6');
    svg.appendChild(line);
    var lp=pt(a.ang,R+15);
    var t=document.createElementNS(NS,'text');
    t.setAttribute('x',lp[0]);t.setAttribute('y',lp[1]);
    t.setAttribute('text-anchor','middle');
    t.setAttribute('dominant-baseline','middle');
    t.setAttribute('font-size','9');
    t.setAttribute('fill','var(--text-dim)');
    t.textContent=a.label;
    svg.appendChild(t);
  });
  /* 數據三角形 */
  var dp=axes.map(function(a){
    var v=(p[a.k]!=null?p[a.k]:50)/100;
    return pt(a.ang,R*v);
  });
  var dpoly=document.createElementNS(NS,'polygon');
  dpoly.setAttribute('points',dp.map(function(q){return q.join(',');}).join(' '));
  dpoly.setAttribute('fill','rgba(201,169,110,0.2)');
  dpoly.setAttribute('stroke','var(--accent)');
  dpoly.setAttribute('stroke-width','1.5');
  svg.appendChild(dpoly);
  /* 數據點 */
  dp.forEach(function(q){
    var c=document.createElementNS(NS,'circle');
    c.setAttribute('cx',q[0]);c.setAttribute('cy',q[1]);c.setAttribute('r',2.5);
    c.setAttribute('fill','var(--accent)');
    svg.appendChild(c);
  });
  /* 性格描述（去AI味，用具體句子） */
  var cm=p.calm,al=p.altruism,ca=p.cautious,desc=[];
  if(cm>=70)desc.push('你習慣在慌亂中先深呼吸。');
  else if(cm<=30)desc.push('你的血液總是比大腦先到達現場。');
  else desc.push('你在緊張和鎮定之間來回。');
  if(al>=70)desc.push('你總是先看別人，再看自己。');
  else if(al<=30)desc.push('你很清楚，活下來的人才有資格談道德。');
  else desc.push('你在別人和自己之間找平衡。');
  if(ca>=70)desc.push('你習慣在邁步之前量三步。');
  else if(ca<=30)desc.push('你相信先動起來再說。');
  else desc.push('你有時謹慎，有時拼命。');
  $('personality-desc').textContent=desc.join('');
}

/* ============================================================
 * 功能20：章節卡（進入關鍵場景時彈出編號+名稱+引言+符號）
 * ============================================================ */
var CHAPTER_DEFS={
  1:[
    {scene:'prelude',num:'序',title:'實驗室',quote:'他想知道答案。',symbol:'∑'},
    {scene:'lobby',num:'壹',title:'質數旅館',quote:'質數會騙人。',symbol:'ℙ'},
    {scene:'corridor',num:'貳',title:'走廊',quote:'每一間門後都有答案。',symbol:'√'},
    {scene:'basement',num:'參',title:'地下室',quote:'往下走，是空的。',symbol:'∞'},
    {scene:'mirror_final',num:'肆',title:'鏡子',quote:'鏡子裡的東西不是你。',symbol:'§'}
  ],
  2:[
    {scene:'prologue',num:'序',title:'沉默圖書館',quote:'請保持安靜。',symbol:'書'},
    {scene:'bookshelf',num:'壹',title:'書架區',quote:'每本書都是一個人的一生。',symbol:'卷'},
    {scene:'reading_room',num:'貳',title:'閱覽室',quote:'他們不出聲，也不抬頭。',symbol:'冊'},
    {scene:'forbidden_zone',num:'參',title:'禁書區',quote:'書架在這裡長出了牆。',symbol:'§'},
    {scene:'basement',num:'肆',title:'地下書庫',quote:'所有被刪掉的記憶。',symbol:'錄'}
  ],
  3:[
    {scene:'prologue',num:'序',title:'倒計時醫院',quote:'燈還在閃。',symbol:'時'},
    {scene:'entrance',num:'壹',title:'大廳',quote:'倒計時開始了。',symbol:'脈'},
    {scene:'pharmacy',num:'貳',title:'藥房',quote:'止痛、抗生素、鎮定劑。',symbol:'藥'},
    {scene:'icu',num:'參',title:'ICU',quote:'媛媛在這張床上等過爸爸。',symbol:'+'},
    {scene:'ward4_floor',num:'肆',title:'四樓',quote:'他記了很多年。',symbol:'鐘'}
  ]
};
var chCardTimerFade=null,chCardTimerOut=null,chCardCallback=null;
function getChapterDefFor(id){
  var list=CHAPTER_DEFS[DUNGEON_ID]||CHAPTER_DEFS[currentDungeonId]||[];
  for(var i=0;i<list.length;i++){if(list[i].scene===id)return list[i];}
  return null;
}
function hasShownChapter(def){return !!(state&&state.flags&&state.flags['ch_'+def.scene]);}
function markChapterShown(def){if(state&&state.flags)state.flags['ch_'+def.scene]=true;}
function showChapterCard(def,cb){
  chCardCallback=cb||null;
  var ov=$('chapter-card-overlay');
  $('chapter-num').textContent=def.num;
  $('chapter-title').textContent=def.title;
  $('chapter-quote').textContent=def.quote;
  $('chapter-symbol').textContent=def.symbol;
  ov.classList.remove('fading');
  ov.classList.add('show');
  if(chCardTimerOut)clearTimeout(chCardTimerOut);
  if(chCardTimerFade)clearTimeout(chCardTimerFade);
  /* 停留 2.5 秒後開始淡出 */
  chCardTimerOut=setTimeout(function(){ov.classList.add('fading');},trTime(2500));
  /* 3.3 秒後完全隱藏並繼續打字 */
  chCardTimerFade=setTimeout(function(){
    ov.classList.remove('show','fading');
    var cb=chCardCallback;chCardCallback=null;
    if(cb)cb();
  },trTime(3300));
}
function skipChapterCard(){
  var ov=$('chapter-card-overlay');
  if(!ov||!ov.classList.contains('show'))return;
  if(chCardTimerOut)clearTimeout(chCardTimerOut);
  if(chCardTimerFade)clearTimeout(chCardTimerFade);
  ov.classList.add('fading');
  setTimeout(function(){
    ov.classList.remove('show','fading');
    var cb=chCardCallback;chCardCallback=null;
    if(cb)cb();
  },trTime(600));
}

/* --- 設置 --- */
/* 設置預覽：根據類型顯示不同預覽內容 */
var _previewTimer=null;
function openPreview(type){
  var body=$('preview-body');
  var title=$('theme-preview-title');
  var replayBtn=$('preview-replay-btn');
  if(_previewTimer){clearTimeout(_previewTimer);_previewTimer=null;}
  body.innerHTML='';
  body.style.flexDirection='row';
  body.style.gap='';
  replayBtn.style.display='none';
  var sampleText='你推開那扇門，門軸發出一聲低沉的呻吟。走廊裡沒有燈，只有遠處某個房間透出慘白的光。你後頸發緊，手心出汗。空氣裡有一股發霉的味道，混著某種說不出來的甜。';
  if(type==='speed'){
    title.textContent='打字速度預覽';
    var p=document.createElement('p');
    p.className='preview-sample-text';
    p.style.fontSize=(SETTINGS.fontSize||20)+'px';
    body.appendChild(p);
    replayBtn.style.display='inline-block';
    replayBtn.onclick=function(){openPreview('speed');};
    /* 用當前設置的打字速度播放示例文本 */
    var idx=0;
    var speed=SETTINGS.typeSpeed||35;
    function typeChar(){
      if(idx<sampleText.length){
        p.textContent=sampleText.substring(0,idx+1);
        idx++;
        _previewTimer=setTimeout(typeChar,speed);
      }
    }
    typeChar();
  }else if(type==='font'){
    title.textContent='敘事字體預覽';
    var fontMap={serif:'var(--font-serif)',kai:'var(--font-serif)',sans:'var(--font-sans)',mono:'var(--font-mono)'};
    var fontName={serif:'宋體',kai:'楷體',sans:'黑體',mono:'等寬'};
    var curFont=SETTINGS.narrativeFont||'serif';
    var p2=document.createElement('p');
    p2.className='preview-sample-text';
    p2.style.fontFamily=fontMap[curFont]||fontMap.serif;
    p2.style.fontSize=(SETTINGS.fontSize||20)+'px';
    p2.textContent=sampleText;
    var label=document.createElement('div');
    label.style.cssText='font-size:.65rem;color:var(--text-dim);margin-top:.8rem;letter-spacing:.15em;text-align:center';
    label.textContent='當前：'+fontName[curFont];
    body.style.flexDirection='column';
    body.appendChild(p2);
    body.appendChild(label);
  }else if(type==='fontSize'){
    title.textContent='字體大小預覽';
    var sizes=[14,16,18,20,22];
    body.style.flexDirection='column';
    body.style.gap='.6rem';
    sizes.forEach(function(sz){
      var p3=document.createElement('p');
      p3.className='preview-sample-text';
      p3.style.fontSize=sz+'px';
      p3.style.opacity=(sz===(SETTINGS.fontSize||16))?'1':'0.4';
      p3.textContent=sz+'px：你推開那扇門，門軸發出低沉的呻吟。';
      body.appendChild(p3);
    });
  }else if(type==='theme'){
    title.textContent='主題色預覽';
    var themes=[
      {key:'default',name:'暗黑金',accent:'#c9a96e',bg:'#0c0a08'},
      {key:'blood',name:'血紅',accent:'#c94a4a',bg:'#0c0808'},
      {key:'ice',name:'冰藍',accent:'#5a9ec9',bg:'#080a0c'},
      {key:'forest',name:'墨綠',accent:'#5a9a6a',bg:'#080c0a'},
      {key:'violet',name:'紫羅蘭',accent:'#9a6ac9',bg:'#0a080c'}
    ];
    var curTheme=SETTINGS.theme||'default';
    var row=document.createElement('div');
    row.className='preview-theme-swatch-row';
    themes.forEach(function(t){
      var card=document.createElement('div');
      card.className='preview-theme-card';
      card.style.background=t.bg;
      card.style.borderColor=(t.key===curTheme?t.accent:'var(--border)');
      var bar=document.createElement('div');
      bar.className='ptc-bar';
      bar.style.background=t.accent;
      var lbl=document.createElement('div');
      lbl.className='ptc-label';
      lbl.style.color=t.accent;
      lbl.textContent=t.name+(t.key===curTheme?'（當前）':'');
      card.appendChild(bar);
      card.appendChild(lbl);
      row.appendChild(card);
    });
    body.appendChild(row);
  }else if(type==='transition'){
    title.textContent='轉場速度預覽';
    var speed=SETTINGS.transitionSpeed||1;
    var speedLabel=speed===0.5?'慢':(speed===2?'快':'標準');
    var info=document.createElement('div');
    info.style.cssText='text-align:center;color:var(--text-dim);font-size:.75rem;margin-bottom:1rem';
    info.textContent='當前速度：'+speedLabel+'（'+speed+'x）';
    var demoBox=document.createElement('div');
    demoBox.style.cssText='width:200px;height:80px;border:1px solid var(--border);border-radius:4px;position:relative;overflow:hidden;background:var(--bg-card)';
    var demoBar=document.createElement('div');
    demoBar.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;background:var(--accent);transform:scaleX(0);transform-origin:left;transition:transform '+(0.8/speed)+'s ease';
    demoBox.appendChild(demoBar);
    body.style.flexDirection='column';
    body.appendChild(info);
    body.appendChild(demoBox);
    replayBtn.style.display='inline-block';
    replayBtn.onclick=function(){openPreview('transition');};
    setTimeout(function(){demoBar.style.transform='scaleX(1)';},100);
  }
  $('theme-preview-modal').classList.add('show');
}
function openSettings(){renderSettings();$('settings-modal').classList.add('show');}
/* P1-4：操作說明 */
function openHelp(){$('help-modal').classList.add('show');}
function closeHelp(){$('help-modal').classList.remove('show');}
function renderSettings(){
  var speedKey=Object.keys(SPEED_MAP).find(function(k){return SPEED_MAP[k]===SETTINGS.typeSpeed;})||'normal';
  var spd=SETTINGS.typeSpeed;
  var apSpeed=SETTINGS.autoPlaySpeed||3;
  var apLabels=['慢','較慢','中','較快','快'];
  var diff=SETTINGS.difficulty||'normal';
  $('settings-body').innerHTML=
    '<div class="setting-row"><div><div class="set-label">打字速度<button class="preview-btn" onclick="openPreview(\'speed\')" title="預覽"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div><div class="set-sub">越小越快（'+spd+' 毫秒/字）</div></div><div style="display:flex;align-items:center;gap:.6rem">'+
    '<input type="range" class="speed-slider" id="speed-slider" min="10" max="100" step="1" value="'+spd+'">'+
    '<span class="speed-val" id="speed-val">'+spd+'ms</span></div></div>'+
    '<div class="setting-row"><div><div class="set-label">快捷速度</div><div class="set-sub">一鍵切換常用檔位</div></div><div class="seg">'+
    ['slow','normal','fast'].map(function(k){
      return '<button data-spd="'+k+'" class="'+(speedKey===k?'on':'')+'">'+({slow:'慢',normal:'中',fast:'快'})[k]+'</button>';
    }).join('')+'</div></div>'+
    '<div class="setting-row"><div><div class="set-label">背景動畫</div><div class="set-sub">關閉門扉首頁的數字翻牌與浮字</div></div><div class="toggle '+(SETTINGS.bgAnim!==false?'on':'')+'" id="bg-anim-toggle"></div></div>'+
    '<div class="setting-row"><div><div class="set-label">自動滾動</div><div class="set-sub">新文字出現時自動捲到底部</div></div><div class="toggle '+(SETTINGS.autoScroll?'on':'')+'" id="auto-scroll-toggle"></div></div>'+
    '<div class="setting-row"><div><div class="set-label">已讀跳過</div><div class="set-sub">進入看過的場景時跳過打字動畫</div></div><div class="toggle '+(SETTINGS.autoSkipRead?'on':'')+'" id="autoskip-toggle"></div></div>'+
    '<div class="setting-row"><div><div class="set-label">隨機選擇按鈕</div><div class="set-sub">選項區底部顯示「隨機」按鈕，幫你擲骰子選一個選項</div></div><div class="toggle '+(SETTINGS.showRandomChoice!==false?'on':'')+'" id="randomchoice-toggle"></div></div>'+
    '<div class="setting-row"><div><div class="set-label">自動播放</div><div class="set-sub">文字打完後自動推進，遇選項暫停</div></div><div class="toggle '+(SETTINGS.autoPlay?'on':'')+'" id="autoplay-toggle"></div></div>'+
    '<div class="setting-row" id="autoplay-speed-row" style="display:'+(SETTINGS.autoPlay?'flex':'none')+'"><div><div class="set-label">播放速度</div><div class="set-sub">'+apLabels[apSpeed-1]+'（'+AUTO_PLAY_SPEEDS[apSpeed-1]+'ms）</div></div><div style="display:flex;align-items:center;gap:.6rem">'+
    '<input type="range" class="speed-slider" id="autoplay-speed" min="1" max="5" step="1" value="'+apSpeed+'">'+
    '<span class="speed-val" id="autoplay-speed-val">'+apLabels[apSpeed-1]+'</span></div></div>'+
    '<div class="setting-row"><div><div class="set-label">難度</div><div class="set-sub">倒計時速度與謎題提示次數</div></div><div class="seg">'+
    '<button data-diff="easy" class="'+(diff==='easy'?'on':'')+'">寬鬆</button>'+
    '<button data-diff="normal" class="'+(diff==='normal'?'on':'')+'">標準</button>'+
    '<button data-diff="hard" class="'+(diff==='hard'?'on':'')+'">嚴格</button>'+
    '</div></div>'+
    /* C類：音效區塊 */
    '<div class="setting-row"><div><div class="set-label">音效</div><div class="set-sub">Web Audio 合成音效（需手動開啟）</div></div><div class="toggle '+(SETTINGS.soundEnabled?'on':'')+'" id="sound-toggle"></div></div>'+
    '<div class="setting-row" id="master-vol-row" style="display:'+(SETTINGS.soundEnabled?'flex':'none')+'"><div><div class="set-label">總音量</div><div class="set-sub">'+(SETTINGS.masterVolume!=null?SETTINGS.masterVolume:70)+'%</div></div><div style="display:flex;align-items:center;gap:.6rem">'+
    '<input type="range" class="speed-slider" id="master-vol" min="0" max="100" step="1" value="'+(SETTINGS.masterVolume!=null?SETTINGS.masterVolume:70)+'">'+
    '<span class="speed-val" id="master-vol-val">'+(SETTINGS.masterVolume!=null?SETTINGS.masterVolume:70)+'%</span></div></div>'+
    '<div class="setting-row" id="type-vol-row" style="display:'+(SETTINGS.soundEnabled?'flex':'none')+'"><div><div class="set-label">打字音量</div><div class="set-sub">'+(SETTINGS.typeVolume!=null?SETTINGS.typeVolume:50)+'%</div></div><div style="display:flex;align-items:center;gap:.6rem">'+
    '<input type="range" class="speed-slider" id="type-vol" min="0" max="100" step="1" value="'+(SETTINGS.typeVolume!=null?SETTINGS.typeVolume:50)+'">'+
    '<span class="speed-val" id="type-vol-val">'+(SETTINGS.typeVolume!=null?SETTINGS.typeVolume:50)+'%</span></div></div>'+
    '<div class="setting-row" id="amb-vol-row" style="display:'+(SETTINGS.soundEnabled?'flex':'none')+'"><div><div class="set-label">氛圍音量</div><div class="set-sub">'+(SETTINGS.ambientVolume!=null?SETTINGS.ambientVolume:30)+'%</div></div><div style="display:flex;align-items:center;gap:.6rem">'+
    '<input type="range" class="speed-slider" id="amb-vol" min="0" max="100" step="1" value="'+(SETTINGS.ambientVolume!=null?SETTINGS.ambientVolume:30)+'">'+
    '<span class="speed-val" id="amb-vol-val">'+(SETTINGS.ambientVolume!=null?SETTINGS.ambientVolume:30)+'%</span></div></div>'+
    /* P2-11：BGM */
    '<div class="setting-row" id="bgm-toggle-row" style="display:'+(SETTINGS.soundEnabled?'flex':'none')+'"><div><div class="set-label">背景音樂</div><div class="set-sub">合成氛圍 BGM，三扇門各有和弦進行</div></div><div class="toggle '+(SETTINGS.bgmEnabled?'on':'')+'" id="bgm-toggle"></div></div>'+
    '<div class="setting-row" id="bgm-vol-row" style="display:'+(SETTINGS.soundEnabled&&SETTINGS.bgmEnabled?'flex':'none')+'"><div><div class="set-label">BGM 音量</div><div class="set-sub">'+(SETTINGS.bgmVolume!=null?SETTINGS.bgmVolume:25)+'%</div></div><div style="display:flex;align-items:center;gap:.6rem">'+
    '<input type="range" class="speed-slider" id="bgm-vol" min="0" max="100" step="1" value="'+(SETTINGS.bgmVolume!=null?SETTINGS.bgmVolume:25)+'">'+
    '<span class="speed-val" id="bgm-vol-val">'+(SETTINGS.bgmVolume!=null?SETTINGS.bgmVolume:25)+'%</span></div></div>'+
    /* C類：轉場速度 */
    '<div class="setting-row"><div><div class="set-label">轉場速度<button class="preview-btn" onclick="openPreview(\'transition\')" title="預覽"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div><div class="set-sub">分屏與過場動畫的快慢</div></div><div class="seg">'+
    '<button data-tr="0.5" class="'+((SETTINGS.transitionSpeed||1)===0.5?'on':'')+'">慢</button>'+
    '<button data-tr="1" class="'+((SETTINGS.transitionSpeed||1)===1?'on':'')+'">標準</button>'+
    '<button data-tr="2" class="'+((SETTINGS.transitionSpeed||1)===2?'on':'')+'">快</button>'+
    '</div></div>'+
    /* C類：字體大小 */
    '<div class="setting-row" id="font-size-row"><div><div class="set-label">字體大小<button class="preview-btn" onclick="openPreview(\'fontSize\')" title="預覽"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div><div class="set-sub">'+(SETTINGS.fontSize||20)+'px（即時預覽）</div></div><div style="display:flex;align-items:center;gap:.6rem">'+
    '<input type="range" class="speed-slider" id="font-size-slider" min="14" max="30" step="1" value="'+(SETTINGS.fontSize||20)+'">'+
    '<span class="speed-val" id="font-size-val">'+(SETTINGS.fontSize||20)+'px</span></div></div>'+
    /* C類：粒子 */
    '<div class="setting-row"><div><div class="set-label">灰塵粒子</div><div class="set-sub">遊戲畫面中的浮塵點綴</div></div><div class="toggle '+((SETTINGS.particlesEnabled!==false)?'on':'')+'" id="particles-toggle"></div></div>'+
    /* 功能18：主題切換（五套配色圓塊） */
    '<div class="setting-row" style="border-top:1px solid var(--border);margin-top:.6rem;padding-top:.6rem"><div><div class="set-label">主題色<button class="preview-btn" onclick="openPreview(\'theme\')" title="預覽"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div><div class="set-sub">五套配色，粒子顏色跟隨主題</div></div><div class="theme-row">'+
    [['default','#c9a96e','暗黑金'],['blood','#c94a4a','血紅'],['ice','#5a9ec9','冰藍'],['forest','#5a9a6a','墨綠'],['violet','#9a6ac9','紫羅蘭']].map(function(t){
      return '<button class="theme-swatch'+((SETTINGS.theme||'default')===t[0]?' on':'')+'" data-theme="'+t[0]+'" style="background:'+t[1]+'" title="'+t[2]+'"></button>';
    }).join('')+'</div></div>'+
    /* 功能19：敘事字體切換（分段按鈕組） */
    '<div class="setting-row"><div><div class="set-label">敘事字體<button class="preview-btn" onclick="openPreview(\'font\')" title="預覽"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div><div class="set-sub">切換正文排版字體</div></div><div class="seg">'+
    [['serif','宋'],['kai','楷'],['sans','黑'],['mono','等寬']].map(function(f){
      return '<button data-font="'+f[0]+'" class="'+((SETTINGS.narrativeFont||'serif')===f[0]?'on':'')+'">'+f[1]+'</button>';
    }).join('')+'</div></div>'+
    /* G類：可訪問性分組 */
    '<div class="setting-row" style="border-top:1px solid var(--border);margin-top:.6rem;padding-top:.6rem"><div><div class="set-label">色盲模式</div><div class="set-sub">藍色替代金色，橙色替代紅色</div></div><div class="toggle '+(SETTINGS.colorblindMode?'on':'')+'" id="colorblind-toggle"></div></div>'+
    '<div class="setting-row"><div><div class="set-label">高對比模式</div><div class="set-sub">黑白背景配亮金文字，提升可讀性</div></div><div class="toggle '+(SETTINGS.highContrast?'on':'')+'" id="highcontrast-toggle"></div></div>'+
    '<div class="setting-row"><div><div class="set-label">光敏性保護</div><div class="set-sub">關閉壞結局的閃爍和震動</div></div><div class="toggle '+(SETTINGS.flashSafe?'on':'')+'" id="flashsafe-toggle"></div></div>'+
    '<div class="setting-row"><div><div class="set-label">減少動畫</div><div class="set-sub">大幅縮短過場動畫，不自動啟動粒子</div></div><div class="toggle '+(SETTINGS.reducedMotion?'on':'')+'" id="reducedmotion-toggle"></div></div>'+
    /* Feature 19擴展：鍵盤快捷鍵說明 */
    '<div class="setting-row" style="border-top:1px solid var(--border);margin-top:.6rem;padding-top:.6rem;flex-direction:column;align-items:stretch;gap:.4rem"><div><div class="set-label">鍵盤快捷鍵</div><div class="set-sub">遊戲進行中可用的按鍵快捷方式</div></div>'+
    '<div style="display:grid;grid-template-columns:auto 1fr;gap:.3rem .8rem;font-family:var(--font-mono);font-size:.8rem;color:var(--text-dim);margin-top:.3rem">'+
    '<span style="color:var(--accent)">1-9</span><span>選擇選項</span>'+
    '<span style="color:var(--accent)">Esc</span><span>暫停／返回</span>'+
    '<span style="color:var(--accent)">Space</span><span>跳過打字／自動播放時暫停</span>'+
    '<span style="color:var(--accent)">I</span><span>物品欄</span>'+
    '<span style="color:var(--accent)">M</span><span>地圖</span>'+
    '<span style="color:var(--accent)">S</span><span>存檔</span>'+
    '<span style="color:var(--accent)">L</span><span>讀檔</span>'+
    '<span style="color:var(--accent)">Q</span><span>快捷輪盤</span>'+
    '</div></div>'+
    /* H類：更新日誌 */
    '<div class="setting-row" style="border-top:1px solid var(--border);margin-top:.6rem;padding-top:.6rem"><div><div class="set-label">更新日誌</div><div class="set-sub">版本 '+(typeof getVersionDisplay==='function'?getVersionDisplay():VERSION)+' 的變更記錄</div></div><button class="secondary" style="padding:.4rem 1rem" onclick="openChangelog()">查看</button></div>';
  document.querySelectorAll('#settings-body [data-spd]').forEach(function(b){
    b.onclick=function(){SETTINGS.typeSpeed=SPEED_MAP[b.dataset.spd];saveSettings(SETTINGS);renderSettings();};
  });
  var sl=$('speed-slider');
  if(sl)sl.oninput=function(){
    var v=parseInt(sl.value);
    SETTINGS.typeSpeed=v;
    $('speed-val').textContent=v+'ms';
    saveSettings(SETTINGS);
  };
  var tg=$('auto-scroll-toggle');
  if(tg)tg.onclick=function(){SETTINGS.autoScroll=!SETTINGS.autoScroll;saveSettings(SETTINGS);renderSettings();};
  var btg=$('bg-anim-toggle');
  if(btg)btg.onclick=function(){SETTINGS.bgAnim=!(SETTINGS.bgAnim!==false);saveSettings(SETTINGS);renderSettings();if(typeof render==='function'&&$('hub-screen').classList.contains('show'))render();};
  /* 已讀跳過開關 */
  var ask=$('autoskip-toggle');
  if(ask)ask.onclick=function(){SETTINGS.autoSkipRead=!SETTINGS.autoSkipRead;saveSettings(SETTINGS);renderSettings();};
  /* 隨機選擇按鈕開關 */
  var rctg=$('randomchoice-toggle');
  if(rctg)rctg.onclick=function(){SETTINGS.showRandomChoice=!SETTINGS.showRandomChoice;saveSettings(SETTINGS);renderSettings();if(typeof renderChoices==='function'&&typeof currentSceneChoices!=='undefined')renderChoices(currentSceneChoices);};
  /* 自動播放開關 */
  var apg=$('autoplay-toggle');
  if(apg)apg.onclick=function(){
    SETTINGS.autoPlay=!SETTINGS.autoPlay;
    if(!SETTINGS.autoPlay)autoPlayPaused=false;
    saveSettings(SETTINGS);renderSettings();updateAutoPlayIndicator();
  };
  /* 自動播放速度滑桿 */
  var aps=$('autoplay-speed');
  if(aps)aps.oninput=function(){
    var v=parseInt(aps.value);
    SETTINGS.autoPlaySpeed=v;
    $('autoplay-speed-val').textContent=apLabels[v-1];
    var sub=document.querySelector('#autoplay-speed-row .set-sub');
    if(sub)sub.textContent=apLabels[v-1]+'（'+AUTO_PLAY_SPEEDS[v-1]+'ms）';
    saveSettings(SETTINGS);
  };
  /* 難度分段按鈕 */
  document.querySelectorAll('#settings-body [data-diff]').forEach(function(b){
    b.onclick=function(){SETTINGS.difficulty=b.dataset.diff;saveSettings(SETTINGS);renderSettings();};
  });
  /* C類：音效總開關 */
  var sndTg=$('sound-toggle');
  if(sndTg)sndTg.onclick=function(){
    SETTINGS.soundEnabled=!SETTINGS.soundEnabled;
    if(SETTINGS.soundEnabled){initAudio();applyAudioVolumes();}
    saveSettings(SETTINGS);renderSettings();
  };
  /* C類：總音量 */
  var mv=$('master-vol');
  if(mv)mv.oninput=function(){
    SETTINGS.masterVolume=parseInt(mv.value);
    $('master-vol-val').textContent=mv.value+'%';
    var sub=document.querySelector('#master-vol-row .set-sub');
    if(sub)sub.textContent=mv.value+'%';
    applyAudioVolumes();
    saveSettings(SETTINGS);
  };
  /* C類：打字音量 */
  var tv=$('type-vol');
  if(tv)tv.oninput=function(){
    SETTINGS.typeVolume=parseInt(tv.value);
    $('type-vol-val').textContent=tv.value+'%';
    var sub=document.querySelector('#type-vol-row .set-sub');
    if(sub)sub.textContent=tv.value+'%';
    applyAudioVolumes();
    saveSettings(SETTINGS);
  };
  /* C類：氛圍音量 */
  var av=$('amb-vol');
  if(av)av.oninput=function(){
    SETTINGS.ambientVolume=parseInt(av.value);
    $('amb-vol-val').textContent=av.value+'%';
    var sub=document.querySelector('#amb-vol-row .set-sub');
    if(sub)sub.textContent=av.value+'%';
    applyAudioVolumes();
    saveSettings(SETTINGS);
  };
  /* P2-11：BGM開關 */
  var bgmTg=$('bgm-toggle');
  if(bgmTg)bgmTg.onclick=function(){
    SETTINGS.bgmEnabled=!SETTINGS.bgmEnabled;
    saveSettings(SETTINGS);renderSettings();
    if(SETTINGS.bgmEnabled){if(!audioCtx)initAudio();startBGM();}
    else stopBGM();
  };
  /* P2-11：BGM音量 */
  var bv=$('bgm-vol');
  if(bv)bv.oninput=function(){
    SETTINGS.bgmVolume=parseInt(bv.value);
    $('bgm-vol-val').textContent=bv.value+'%';
    var sub=document.querySelector('#bgm-vol-row .set-sub');
    if(sub)sub.textContent=bv.value+'%';
    updateBGMVolume();
    saveSettings(SETTINGS);
  };
  /* C類：轉場速度分段 */
  document.querySelectorAll('#settings-body [data-tr]').forEach(function(b){
    b.onclick=function(){
      SETTINGS.transitionSpeed=parseFloat(b.dataset.tr);
      document.documentElement.style.setProperty('--transition-mult',SETTINGS.transitionSpeed);
      saveSettings(SETTINGS);renderSettings();
    };
  });
  /* C類：字體大小滑桿（即時預覽） */
  var fs=$('font-size-slider');
  if(fs)fs.oninput=function(){
    var v=parseInt(fs.value);
    SETTINGS.fontSize=v;
    $('font-size-val').textContent=v+'px';
    var sub=document.querySelector('#font-size-row .set-sub');
    if(sub)sub.textContent=v+'px（即時預覽）';
    document.documentElement.style.setProperty('--narrative-font-size',v+'px');
    saveSettings(SETTINGS);
  };
  /* C類：粒子開關 */
  var ptg=$('particles-toggle');
  if(ptg)ptg.onclick=function(){
    SETTINGS.particlesEnabled=!(SETTINGS.particlesEnabled!==false);
    saveSettings(SETTINGS);renderSettings();
    if($('game-screen').classList.contains('active')){
      if(SETTINGS.particlesEnabled)startParticles();
      else stopParticles();
    }
  };
  /* 功能18：主題切換——即時套用並重啟粒子以應用新顏色 */
  document.querySelectorAll('#settings-body [data-theme]').forEach(function(b){
    b.onclick=function(){
      SETTINGS.theme=b.dataset.theme;
      document.body.setAttribute('data-theme',SETTINGS.theme);
      saveSettings(SETTINGS);renderSettings();
      /* 重啟粒子以讀取新的主題強調色 */
      if($('game-screen').classList.contains('active')){
        if(SETTINGS.particlesEnabled!==false){stopParticles();startParticles();}
      }
    };
  });
  /* 功能19：敘事字體切換——即時套用 */
  document.querySelectorAll('#settings-body [data-font]').forEach(function(b){
    b.onclick=function(){
      SETTINGS.narrativeFont=b.dataset.font;
      document.body.setAttribute('data-font',SETTINGS.narrativeFont);
      saveSettings(SETTINGS);renderSettings();
    };
  });
  /* G類：色盲模式 */
  var cbmTg=$('colorblind-toggle');
  if(cbmTg)cbmTg.onclick=function(){
    SETTINGS.colorblindMode=!SETTINGS.colorblindMode;
    saveSettings(SETTINGS);renderSettings();applyAccessibility();
  };
  /* G類：高對比模式 */
  var hcTg=$('highcontrast-toggle');
  if(hcTg)hcTg.onclick=function(){
    SETTINGS.highContrast=!SETTINGS.highContrast;
    saveSettings(SETTINGS);renderSettings();applyAccessibility();
  };
  /* G類：光敏性保護 */
  var fsTg=$('flashsafe-toggle');
  if(fsTg)fsTg.onclick=function(){
    SETTINGS.flashSafe=!SETTINGS.flashSafe;
    saveSettings(SETTINGS);renderSettings();
  };
  /* G類：減少動畫 */
  var rmTg=$('reducedmotion-toggle');
  if(rmTg)rmTg.onclick=function(){
    SETTINGS.reducedMotion=!SETTINGS.reducedMotion;
    saveSettings(SETTINGS);renderSettings();applyAccessibility();
    if(SETTINGS.reducedMotion){stopParticles();}
    else if($('game-screen').classList.contains('active')&&SETTINGS.particlesEnabled!==false){startParticles();}
  };
}

/* --- 多存檔槽 --- */
function slotMeta(n){
  try{return JSON.parse(localStorage.getItem(SAVE_PREFIX+'-'+n));}catch(e){return null;}
}
/* P1-6：舊版本存檔遷移——補全缺失欄位並升級版本號，而非直接刪除 */
function migrateSave(d){
  if(!d||typeof d!=='object')return null;
  try{
    var prevVer=d.version||'2.2';
    d.currentScene=d.currentScene||'prelude';
    d.inventory=Array.isArray(d.inventory)?d.inventory:[];
    d.flags=d.flags&&typeof d.flags==='object'?d.flags:{};
    d.hp=d.hp!=null?Number(d.hp):100;
    d.stress=d.stress!=null?Number(d.stress):0;
    d.humanity=d.humanity!=null?Number(d.humanity):100;
    d.criticScore=d.criticScore!=null?Number(d.criticScore):80;
    d.pinnedItems=Array.isArray(d.pinnedItems)?d.pinnedItems:[];
    d.enchantedItems=Array.isArray(d.enchantedItems)?d.enchantedItems:[];
    d.notes=Array.isArray(d.notes)?d.notes:[];
    d.history=Array.isArray(d.history)?d.history:[];
    d.mapZones=Array.isArray(d.mapZones)?d.mapZones:(state&&Array.isArray(state.mapZones)?state.mapZones:[]);
    d.personality=d.personality&&typeof d.personality==='object'?d.personality:{calm:50,altruism:50,cautious:50};
    if(d.dungeonId==null)d.dungeonId=currentDungeonId;
    d.migratedFrom=prevVer;
    d.version=SAVE_VERSION;
    try{
      localStorage.setItem('wuxian-v30-backup',JSON.stringify({migratedAt:Date.now(),from:prevVer,save:d}));
      localStorage.setItem('wuxian-v30-backup-secondary',JSON.stringify({migratedAt:Date.now(),from:prevVer,save:d}));
    }catch(_be){}
    return d;
  }catch(e){return null;}
}
function openSaveModal(){renderSlots('save');$('slot-modal').classList.add('show');}
function openLoadModal(){renderSlots('load');$('slot-modal').classList.add('show');}
function renderSlots(mode){
  $('slot-title').textContent=mode==='save'?'存 檔':'讀 檔';
  $('slot-text').textContent=mode==='save'?'選擇槽位覆蓋':'選擇槽位讀取';
  function slotCardHTML(n,m,isAuto){
    if(!m){
      var label=isAuto?'自動存檔':'槽位 '+n;
      return '<button class="slot-card empty" onclick="doSlot(\''+mode+'\',\''+(isAuto?'auto':n)+'\')"><div class="slot-icon"><span class="slot-num">'+(isAuto?'A':n)+'</span></div><div class="slot-info"><div class="slot-line1">— 空 —</div></div></button>';
    }
    var dn=m.dungeonName||(DUNGEON_CONFIG[m.dungeonId]?DUNGEON_CONFIG[m.dungeonId].dungeonName:'未知門扉');
    var rn=m.roomName||m.currentScene||'進度中';
    var el=m.elapsedMs!=null?fmtElapsed(m.elapsedMs):'—';
    var hp=m.hp!=null?Math.round(m.hp):'?';
    var party=m.party!=null?m.party+'人':'?';
    var cc=m.clearedCount!=null?m.clearedCount:'?';
    var ct=m.clearedTotal||dungeons.length;
    var line1=dn+' · '+rn;
    var line2='時長 '+el+' · HP:'+hp+' · 隊伍:'+party;
    var line3=(m.savedAt||'')+' · 已通關 '+cc+'/'+ct;
    var verOk=m.version===SAVE_VERSION;
    var clickAction=isAuto?'doAutoLoad()':'doSlot(\''+mode+'\','+n+')';
    return '<button class="slot-card" onclick="'+clickAction+'"><div class="slot-icon"><span class="slot-num">'+(isAuto?'A':n)+'</span></div><div class="slot-info"><div class="slot-line1">'+line1+'</div><div class="slot-line2">'+line2+'</div><div class="slot-line3">'+line3+(verOk?'':' · 版本過舊')+'</div></div></button>';
  }
  var html='';
  if(mode==='load'){
    var am=slotMeta('auto');
    html+=slotCardHTML(0,am,true);
  }
  for(var n=1;n<=SAVE_SLOTS;n++){
    var m=slotMeta(n);
    html+=slotCardHTML(n,m,false);
  }
  $('slot-list').innerHTML=html;
}
/* 自動存檔：獨立 key，不覆蓋手動槽 */
function autoSave(){
  if(!state||!$('game-screen').classList.contains('active'))return;
  if($('ending-screen').classList.contains('show'))return;
  try{
    var data=collectSaveData();data.version=SAVE_VERSION;
    data.savedAt=new Date().toLocaleString('zh-Hant');
    data.roomName=($('room-name')? $('room-name').textContent:'');
    localStorage.setItem(SAVE_PREFIX+'-auto',JSON.stringify(data));
  }catch(e){}
}
function doAutoLoad(){
  var m=slotMeta('auto');
  if(!m){showToast('沒有自動存檔');return;}
  if(m.version!==SAVE_VERSION){
    var migrated=migrateSave(m);
    if(migrated){
      try{localStorage.setItem(SAVE_PREFIX+'-auto',JSON.stringify(migrated));}catch(e){}
      applySaveData(migrated);closeModal('slot-modal');showToast('舊存檔已自動升級');return;
    }
    localStorage.removeItem(SAVE_PREFIX+'-auto');showToast('舊版本存檔已清除');closeModal('slot-modal');return;
  }
  applySaveData(m);closeModal('slot-modal');showToast('讀取自動存檔');
}
/* 通用確認彈窗：showConfirm(訊息, 確認後回調, 自訂標題) */
var _confirmOnOk=null;
function showConfirm(msg,onOk,title){
  var m=$('confirm-modal');if(!m)return;
  $('confirm-text').textContent=msg;
  if(title)$('confirm-title').textContent=title;
  else $('confirm-title').textContent='確 認';
  _confirmOnOk=onOk||null;
  m.classList.add('show');
}
function closeConfirm(){
  $('confirm-modal').classList.remove('show');
  _confirmOnOk=null;
}
document.addEventListener('DOMContentLoaded',function(){
  var ok=$('confirm-ok-btn');
  if(ok)ok.onclick=function(){
    var cb=_confirmOnOk;
    closeConfirm();
    if(typeof cb==='function')cb();
  };
});
function doSlot(mode,n){
  if(mode==='save'){
    /* 覆蓋確認：目標槽（含自動槽 auto）已有存檔時先彈窗確認 */
    var existing=slotMeta(n);
    if(existing){
      showConfirm('確定要覆蓋此存檔嗎？',function(){doSave(n);});
      return;
    }
    doSave(n);
  }else{
    var m=slotMeta(n);if(!m){showToast('槽位是空的');return;}
    if(m.version!==SAVE_VERSION){
      var migrated=migrateSave(m);
      if(migrated){
        try{localStorage.setItem(SAVE_PREFIX+'-'+n,JSON.stringify(migrated));}catch(e){}
        applySaveData(migrated);closeModal('slot-modal');showToast('舊存檔已自動升級');return;
      }
      localStorage.removeItem(SAVE_PREFIX+'-'+n);showToast('舊版本存檔已清除');closeModal('slot-modal');return;
    }
    applySaveData(m);closeModal('slot-modal');showToast('讀取槽位 '+n);
  }
}
/* 實際寫入存檔（由 doSlot 確認後呼叫） */
function doSave(n){
  var data=collectSaveData();data.version=SAVE_VERSION;data.savedAt=new Date().toLocaleString('zh-Hant');
  data.roomName=($('room-name')? $('room-name').textContent:'');
  safeSet(SAVE_PREFIX+'-'+n,JSON.stringify(data));
  closeModal('slot-modal');showToast('已存到槽位 '+n);
}
function collectSaveData(){
  var d={currentScene:state.currentScene,inventory:state.inventory,flags:state.flags,hp:state.hp,notes:state.notes,history:state.history,mapZones:state.mapZones};
  if(state.party!==undefined)d.party=state.party;
  if(state.adminQuestions!==undefined)d.adminQuestions=state.adminQuestions;
  if(state.countdown!==undefined)d.countdown=state.countdown;
  if(state.resetCount!==undefined)d.resetCount=state.resetCount;
  if(state.maxHp!==undefined)d.maxHp=state.maxHp;
  if(state.tide!==undefined)d.tide=state.tide;
  if(state.echo!==undefined)d.echo=state.echo;
  if(state.trail!==undefined)d.trail=state.trail;
  /* 功能14：性格數據存檔 */
  if(state.personality)d.personality=state.personality;
  d.elapsedMs=Date.now()-gameStartTime;
  d.clearedCount=getClearedCount();
  d.clearedTotal=dungeons.length;
  /* B類：存檔預覽增強字段 */
  d.dungeonId=currentDungeonId;
  d.dungeonName=DUNGEON_CONFIG[currentDungeonId]?DUNGEON_CONFIG[currentDungeonId].dungeonName:'';
  d.roomName=($('room-name')?$('room-name').textContent:'');
  d.savedAt=new Date().toLocaleString('zh-Hant');
  return d;
}
function applySaveData(d){
  /* B6：跨門扉存檔——若存檔所屬門扉與當前不同，先切換門扉再應用數據 */
  if(d.dungeonId!=null && d.dungeonId!==currentDungeonId){
    enterDungeon(d.dungeonId);
  }
  state.currentScene=d.currentScene||'prelude';
  state.inventory=d.inventory||[];
  state.flags=d.flags||{};
  state.hp=d.hp!=null?d.hp:100;
  if(d.party!==undefined)state.party=d.party;
  if(d.adminQuestions!==undefined)state.adminQuestions=d.adminQuestions;
  if(d.countdown!==undefined)state.countdown=d.countdown;
  if(d.resetCount!==undefined)state.resetCount=d.resetCount;
  if(d.maxHp!==undefined)state.maxHp=d.maxHp;
  if(d.tide!==undefined)state.tide=d.tide;
  if(d.echo!==undefined)state.echo=d.echo;
  if(d.trail!==undefined)state.trail=d.trail;
  state.notes=d.notes||[];
  state.history=d.history||[];
  state.mapZones=(Array.isArray(d.mapZones)&&d.mapZones.length>0)?d.mapZones:state.mapZones;
  /* 功能14：還原性格數據（舊存檔缺字段時用預設值） */
  state.personality=d.personality||{calm:50,altruism:50,cautious:50};
  /* 向後兼容：缺失字段用預設值 */
  if(d.dungeonId!=null)currentDungeonId=d.dungeonId;
  updateHP();
  if(state.party!==undefined)updateParty();
  if(state.countdown!==undefined){updateCountdown();$('reset-count').textContent=state.resetCount||0;}
  updateInventoryUI();renderNotes();renderMap();
  goToScene(state.currentScene);
}

/* --- 成就面板 --- */
function openAchievements(){
  var list=$('ach-list');
  list.innerHTML=ACH_DEFS.map(function(a){
    var un=hasAchievement(a.id);
    return '<div class="ach-item '+(un?'unlocked':'locked')+'"><div class="ach-icon">'+(un?'<span class="css-star"></span>':'?')+'</div><div class="ach-info"><div class="ach-name">'+a.name+'</div><div class="ach-desc">'+a.desc+'</div></div></div>';
  }).join('');
  $('ach-panel').classList.toggle('open');
  $('ach-overlay').classList.toggle('show');
}

/* --- 彈窗關閉 --- */
function closeModal(id){
  $(id).classList.remove('show');
  /* 從標題頁打開的設置，關閉後返回標題頁 */
  if(id==='settings-modal'&&window._returnToTitleAfterSettings){
    window._returnToTitleAfterSettings=false;
    window._openingDone=false;
    var so=document.getElementById('split-overlay');
    if(so){
      so.classList.remove('open','drawing','no-title','reverse','reverse-ready');
      so.classList.add('active');
    }
  }
}

/* --- Feature 24：環境觀察彈窗 --- */
function showObservation(text){
  $('observation-text').innerHTML=text;
  $('observation-modal').classList.add('show');
}

/* --- 暫停 --- */
function openPause(){$('pause-modal').classList.add('show');}
function closePause(){$('pause-modal').classList.remove('show');}
function confirmRestart(){closePause();restartGame();}

/* --- 繼承顯示 --- */
function updateInheritanceDisplay(){
  var el=$('inheritance-display');
  var items=[];
  var inh=state.inheritance;
  if(inh.mirror_defeated)items.push('擊敗鏡中存在');
  if(inh.golden_key)items.push('持有金色鑰匙');
  if(inh.basement_knowledge)items.push('知曉地下室秘密');
  if(inh.traded_admin)items.push('與管理員交易過');
  if(inh.alone_escape)items.push('曾獨自逃離');
  if(inh.trusted)items.push('獲得信任');
  if(inh.lost_limb)items.push('失去一肢');
  if(inh.admin_guest)items.push('管理員的貴客');
  if(inh.chen_survived)items.push('陳姐存活');
  if(inh.laozhou_survived)items.push('老周存活');
  if(inh.suwan_survived)items.push('蘇晚存活');
  if(inh.xiaoyu_survived)items.push('小雨存活');
  if(inh.yuanyuan_carried)items.push('攜帶媛媛記憶');
  if(inh.memory_kept)items.push('保留了記憶');
  if(inh.memory_deleted)items.push('刪除了記憶');
  el.innerHTML=items.length?'<div class="ih-title">繼承狀態</div><div class="ih-list">'+items.join('<br>')+'</div>':'<div class="ih-empty">無繼承屬性</div>';
}

/* ============================================================
 * 視圖切換：hub <-> 遊戲
 * ============================================================ */
/* 門扉過場：黑屏 + 金色「進入第 X 門扉」淡入，停留約 2 秒後淡出 */
var dtTimerIn=null,dtTimerOut=null;
var dtCallback=null;
function playDungeonTransition(id){
  var cfg=DUNGEON_CONFIG[id];
  if(!cfg)return;
  var ord=['','一','二','三','四','五','六','七','八','九','十','十一','十二','十三'];
  $('dt-index').textContent='無 盡 迴 廊 · 第 '+(ord[id]||id)+' 扇 門';
  $('dt-name').textContent=cfg.dungeonName;
  dtCallback=null;
  var skipEl=document.querySelector('#dungeon-transition .dt-skip');
  if(skipEl)skipEl.style.display='';
  var ov=$('dungeon-transition');
  if(dtTimerIn)clearTimeout(dtTimerIn);
  if(dtTimerOut)clearTimeout(dtTimerOut);
  /* 立刻黑幕遮蓋，不淡入，避免舊畫面閃現 */
  ov.style.transition='none';
  ov.classList.add('show');
  void ov.offsetWidth;
  /* 短暫停留後再淡入文字（此時底下新畫面已就緒） */
  dtTimerIn=setTimeout(function(){
    ov.style.transition='';
    /* 重新觸發文字淡入 */
    ov.classList.remove('show');
    void ov.offsetWidth;
    ov.classList.add('show');
  },trTime(120));
  dtTimerOut=setTimeout(function(){
    ov.classList.remove('show');
    if(dtCallback){var cb=dtCallback;dtCallback=null;cb();}
  },trTime(2200));
}
/* 點擊跳過過場：立即淡出（底下新畫面已就緒） */
function skipDungeonTransition(){
  var ov=$('dungeon-transition');
  if(!ov.classList.contains('show'))return;
  if(dtTimerIn){clearTimeout(dtTimerIn);dtTimerIn=null;}
  if(dtTimerOut){clearTimeout(dtTimerOut);dtTimerOut=null;}
  ov.style.transition='';
  ov.classList.remove('show');
  if(dtCallback){var cb=dtCallback;dtCallback=null;cb();}
}
/* 開場過場：立刻黑幕，在黑幕下設置hub，再淡入文字，最後淡出露出hub */
function playOpeningTransition(){
  $('dt-index').textContent='INFINITE GATES';
  $('dt-name').textContent='無 盡 迴 廊';
  var skipEl=document.querySelector('#dungeon-transition .dt-skip');
  if(skipEl)skipEl.style.display='none';
  var ov=$('dungeon-transition');
  if(dtTimerIn)clearTimeout(dtTimerIn);
  if(dtTimerOut)clearTimeout(dtTimerOut);
  /* 立刻黑幕遮蓋 */
  ov.style.transition='none';
  ov.classList.add('show');
  void ov.offsetWidth;
  /* 在黑幕下設置hub */
  doEnterHub();
  /* 短暫停留後淡入文字 */
  dtTimerIn=setTimeout(function(){
    ov.style.transition='';
    ov.classList.remove('show');
    void ov.offsetWidth;
    ov.classList.add('show');
  },120);
  dtTimerOut=setTimeout(function(){
    ov.classList.remove('show');
  },1400);
}
/* 壞結局：血液滴落粒子系統 */
var badBloodAnim={running:false,raf:null,drops:[],ctx:null,canvas:null};
function initBadBloodCanvas(){
  var c=document.getElementById('bad-blood-canvas');
  if(!c)return;
  c.width=window.innerWidth;c.height=window.innerHeight;
  badBloodAnim.canvas=c;
  badBloodAnim.ctx=c.getContext('2d');
}
function spawnBadDrops(){
  if(!badBloodAnim.ctx)return;
  var w=badBloodAnim.canvas.width;
  for(var i=0;i<18;i++){
    badBloodAnim.drops.push({
      x:Math.random()*w,
      y:-20-Math.random()*100,
      speed:1.5+Math.random()*3,
      width:1.5+Math.random()*2.5,
      length:8+Math.random()*25,
      alpha:0.3+Math.random()*0.4,
      wobble:Math.random()*Math.PI*2
    });
  }
}
function tickBadBlood(){
  if(!badBloodAnim.running||!badBloodAnim.ctx)return;
  var ctx=badBloodAnim.ctx;
  var w=badBloodAnim.canvas.width,h=badBloodAnim.canvas.height;
  ctx.clearRect(0,0,w,h);
  for(var i=badBloodAnim.drops.length-1;i>=0;i--){
    var d=badBloodAnim.drops[i];
    d.y+=d.speed;
    d.wobble+=0.03;
    d.x+=Math.sin(d.wobble)*0.4;
    var grad=ctx.createLinearGradient(d.x,d.y,d.x,d.y+d.length);
    grad.addColorStop(0,'rgba(160,25,25,0)');
    grad.addColorStop(0.3,'rgba(160,25,25,'+d.alpha*0.5+')');
    grad.addColorStop(1,'rgba(120,15,15,'+d.alpha+')');
    ctx.strokeStyle=grad;
    ctx.lineWidth=d.width;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(d.x,d.y);
    ctx.lineTo(d.x,d.y+d.length);
    ctx.stroke();
    if(d.y>h+30){badBloodAnim.drops.splice(i,1);}
  }
  if(Math.random()<0.06&&badBloodAnim.drops.length<60)spawnBadDrops();
  badBloodAnim.raf=requestAnimationFrame(tickBadBlood);
}
function startBadBlood(){
  if(SETTINGS.flashSafe||SETTINGS.reducedMotion)return;
  initBadBloodCanvas();
  if(!badBloodAnim.ctx)return;
  badBloodAnim.drops=[];
  spawnBadDrops();
  badBloodAnim.running=true;
  badBloodAnim.canvas.classList.add('active');
  tickBadBlood();
}
function stopBadBlood(){
  badBloodAnim.running=false;
  if(badBloodAnim.raf){cancelAnimationFrame(badBloodAnim.raf);badBloodAnim.raf=null;}
  if(badBloodAnim.canvas){badBloodAnim.canvas.classList.remove('active');}
  badBloodAnim.drops=[];
}
/* 好結局：金色浮遊粒子系統 */
var goodParticleAnim={running:false,raf:null,particles:[],ctx:null,canvas:null};
function initGoodParticleCanvas(){
  var c=document.getElementById('good-particle-canvas');
  if(!c)return;
  c.width=window.innerWidth;c.height=window.innerHeight;
  goodParticleAnim.canvas=c;
  goodParticleAnim.ctx=c.getContext('2d');
}
function spawnGoodParticles(){
  if(!goodParticleAnim.ctx)return;
  var w=goodParticleAnim.canvas.width,h=goodParticleAnim.canvas.height;
  for(var i=0;i<40;i++){
    goodParticleAnim.particles.push({
      x:Math.random()*w,
      y:h+10+Math.random()*50,
      speed:0.4+Math.random()*1.2,
      size:1+Math.random()*2.5,
      alpha:0.2+Math.random()*0.5,
      wobble:Math.random()*Math.PI*2,
      wobbleSpeed:0.01+Math.random()*0.02,
      glow:Math.random()>0.6
    });
  }
}
function tickGoodParticles(){
  if(!goodParticleAnim.running||!goodParticleAnim.ctx)return;
  var ctx=goodParticleAnim.ctx;
  var w=goodParticleAnim.canvas.width,h=goodParticleAnim.canvas.height;
  ctx.clearRect(0,0,w,h);
  for(var i=goodParticleAnim.particles.length-1;i>=0;i--){
    var p=goodParticleAnim.particles[i];
    p.y-=p.speed;
    p.wobble+=p.wobbleSpeed;
    p.x+=Math.sin(p.wobble)*0.5;
    p.alpha*=0.998;
    if(p.glow){
      ctx.shadowBlur=8;
      ctx.shadowColor='rgba(212,175,90,.8)';
    }
    ctx.fillStyle='rgba(220,185,100,'+p.alpha+')';
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur=0;
    if(p.y<-20||p.alpha<0.05){goodParticleAnim.particles.splice(i,1);}
  }
  if(goodParticleAnim.particles.length<50&&Math.random()<0.08)spawnGoodParticles();
  goodParticleAnim.raf=requestAnimationFrame(tickGoodParticles);
}
function startGoodParticles(){
  if(SETTINGS.reducedMotion)return;
  initGoodParticleCanvas();
  if(!goodParticleAnim.ctx)return;
  goodParticleAnim.particles=[];
  spawnGoodParticles();
  goodParticleAnim.running=true;
  goodParticleAnim.canvas.classList.add('active');
  tickGoodParticles();
}
function stopGoodParticles(){
  goodParticleAnim.running=false;
  if(goodParticleAnim.raf){cancelAnimationFrame(goodParticleAnim.raf);goodParticleAnim.raf=null;}
  if(goodParticleAnim.canvas){goodParticleAnim.canvas.classList.remove('active');}
  goodParticleAnim.particles=[];
}
/* 結局效果清理 */
function cleanupEndingEffects(){
  stopBadBlood();
  stopGoodParticles();
  var crack=document.getElementById('bad-crack-overlay');
  if(crack)crack.classList.remove('active');
  document.body.classList.remove('bad-ending');
  var gs=document.getElementById('game-screen');
  if(gs)gs.classList.remove('shake');
  var bf=document.getElementById('bad-flash');
  if(bf)bf.classList.remove('active');
}
/* 結局粒子畫布隨窗口縮放 */
window.addEventListener('resize',function(){
  var bc=document.getElementById('bad-blood-canvas');
  if(bc&&badBloodAnim.running){bc.width=window.innerWidth;bc.height=window.innerHeight;}
  var gc=document.getElementById('good-particle-canvas');
  if(gc&&goodParticleAnim.running){gc.width=window.innerWidth;gc.height=window.innerHeight;}
});
/* 壞結局紅色閃爍覆蓋層（C類強化：脈衝/震動/暗角/音效） */
function playBadFlash(){
  var el=$('bad-flash');
  var gs=$('game-screen');
  /* 光敏性安全：跳過震動與脈衝，只顯示靜態紅色 */
  if(SETTINGS.flashSafe){
    if(el){
      el.classList.remove('active');
      void el.offsetWidth;
      el.style.background='rgba(155,30,30,0.5)';
      el.classList.add('active');
      el.style.animation='none';
      setTimeout(function(){
        el.classList.remove('active');
        el.style.animation='';
        el.style.background='';
      },1500);
    }
    playEndingDrum();
    return;
  }
  /* 1. 暗角收縮 */
  document.body.classList.add('bad-ending');
  /* 2. 屏幕震動 */
  if(gs)gs.classList.add('shake');
  /* 3. 紅色脈衝 */
  if(el){
    el.classList.remove('active');
    void el.offsetWidth;
    el.classList.add('active');
  }
  /* 4. 低沉音效 */
  playEndingDrum();
  /* 5. 1500ms後清理 */
  setTimeout(function(){
    document.body.classList.remove('bad-ending');
    if(gs)gs.classList.remove('shake');
    if(el)el.classList.remove('active');
  },1500);
}
function enterDungeon(id,autoStart){
  currentDungeonId=id;
  gameStartTime=Date.now();
  /* 清理 hub 背景數字動畫定時器，避免踏入門扉後繼續運行 */
  if(bgNumTimer){clearInterval(bgNumTimer);bgNumTimer=null;}
  /* H類：重置統計計數器 */
  dialogCount=0;itemObtainCount=0;itemObtainSet={};endingStatData=null;
  var cfg=DUNGEON_CONFIG[id];
  /* 先黑幕遮蓋，避免舊畫面閃現 */
  playDungeonTransition(id);
  /* 重新指向 state 與 SCENES，並刷新繼承 */
  state=stateRefs[id];
  /* B5：踏入門扉前清空運行時 state，避免上一殘留物品/旗標汙染新門扉 */
  resetDungeonState();
  state.inheritance=loadInheritance();
  SCENES=sceneRefs[id];
  dialogCurrentNpc=null;
  SAVE_PREFIX=cfg.savePrefix;
  DUNGEON_ID=cfg.dungeonId;
  TOTAL_ENDINGS=cfg.totalEndings;
  ACH_DEFS=cfg.achDefs;
  /* 重新構建該門扉場景（讓 text 陣列讀取最新 inheritance） */
  if(typeof window['buildScenes'+id]==='function')window['buildScenes'+id]();
  /* 功能17：踏入門扉時重置進度條顯示 */
  if(typeof updateProgress==='function')updateProgress();
  /* 配置標題頁 */
  $('g-title-num').textContent=cfg.roomNum;
  $('g-title-name').textContent=cfg.dungeonName;
  $('g-title-sub').textContent=cfg.subText;
  if(cfg.ruleText){$('g-title-rule').style.display='block';$('g-title-rule').textContent=cfg.ruleText;}
  else{$('g-title-rule').style.display='none';}
  /* NG+ 標籤 */
  var inh0=loadInheritance();
  if(inh0.ng_plus)$('ngplus-label').classList.add('show');
  else $('ngplus-label').classList.remove('show');
  /* 配置頂欄額外元素 */
  $('silence-indicator').style.display=cfg.hasAdmin?'inline-block':'none';
  $('countdown-display').style.display=cfg.hasCountdown?'inline-block':'none';
  $('party-status').style.display=cfg.hasParty?'flex':'none';
  $('reset-status').style.display=cfg.hasCountdown?'flex':'none';
  /* 配置額外按鈕（跨門扉跳轉改為視圖切換；未解鎖者禁用並附鎖圖標） */
  var ex=$('g-extra-buttons');ex.innerHTML='';
  function crossBtn(targetId,label){
    var lockSvg='<svg class="btn-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
    if(isUnlocked(targetId)){
      return '<button class="title-btn title-btn-secondary" onclick="enterDungeon('+targetId+')">'+label+'</button>';
    }
    return '<button class="title-btn title-btn-secondary" disabled>'+label+lockSvg+'</button>';
  }
  if(id===1){
    ex.innerHTML=(hasClearedDungeon()?'<button class="title-btn title-btn-secondary" onclick="openChapterSelect()">章 節 選 擇</button>':'')+crossBtn(2,'前 往 沉 默 圖 書 館')+crossBtn(3,'前 往 倒 計 時 醫 院');
  }else if(id===2){
    ex.innerHTML=(hasClearedDungeon()?'<button class="title-btn title-btn-secondary" onclick="openChapterSelect()">章 節 選 擇</button>':'')+crossBtn(3,'前 往 倒 計 時 醫 院');
  }else{
    ex.innerHTML=hasClearedDungeon()?'<button class="title-btn title-btn-secondary" onclick="openChapterSelect()">章 節 選 擇</button>':'';
  }
  /* 更新繼承顯示 */
  updateInheritanceDisplay();
  /* 切換視圖：隱藏 hub，顯示遊戲標題（在黑幕下進行，不可見） */
  $('hub-screen').classList.remove('show');
  $('game-screen').classList.remove('active');
  $('ending-screen').classList.remove('show');
  if(!autoStart){$('game-title-screen').classList.add('active');}
  /* 從選擇畫面進入時：過場結束後自動開始遊戲，跳過章節卡確認 */
  if(autoStart){dtCallback=startGame;}
}
function backToHub(){
  $('game-title-screen').classList.remove('active');
  $('game-screen').classList.remove('active');
  $('ending-screen').classList.remove('show');
  cleanupEndingEffects();
  $('pause-modal').classList.remove('show');
  closePuzzle();closeAdmin();closeModal('slot-modal');closeModal('settings-modal');
  closeModal('history-modal');closeModal('item-detail-modal');closeModal('chapter-modal');
  closeDialogPanel();
  /* 清理殘留打字機與無用選項輪詢 */
  if(typingState&&!typingState.done){clearTimeout(typeTimer);typingState.done=true;typingState=null;}
  if(uselessChoiceTimer){clearInterval(uselessChoiceTimer);uselessChoiceTimer=null;}
  if(chCardTimerOut){clearTimeout(chCardTimerOut);chCardTimerOut=null;}
  if(chCardTimerFade){clearTimeout(chCardTimerFade);chCardTimerFade=null;}
  currentPlayContext=null;
  $('hub-screen').classList.add('show');
  render();
  updateAutoPlayIndicator();
  /* C類：離開遊戲屏，停止氛圍音與粒子 */
  stopAmbient();
  stopParticles();
  /* D類：停止性能監控 */
  try{stopPerfMonitor();}catch(e){}
}
/* 從遊戲中直接回到最頂標題屏 */
function quitToTitle(){
  closePause();
  $('game-title-screen').classList.remove('active');
  $('game-screen').classList.remove('active');
  $('ending-screen').classList.remove('show');
  cleanupEndingEffects();
  closePuzzle();closeAdmin();closeModal('slot-modal');closeModal('settings-modal');
  closeModal('history-modal');closeModal('item-detail-modal');closeModal('chapter-modal');
  closeDialogPanel();
  /* 清理殘留打字機與無用選項輪詢 */
  if(typingState&&!typingState.done){clearTimeout(typeTimer);typingState.done=true;typingState=null;}
  if(uselessChoiceTimer){clearInterval(uselessChoiceTimer);uselessChoiceTimer=null;}
  if(chCardTimerOut){clearTimeout(chCardTimerOut);chCardTimerOut=null;}
  if(chCardTimerFade){clearTimeout(chCardTimerFade);chCardTimerFade=null;}
  currentPlayContext=null;
  $('hub-screen').classList.remove('show');
  $('hub-title-screen').classList.remove('hidden');
  $('hub-title-screen').classList.add('show');
  updateAutoPlayIndicator();
  /* C類：離開遊戲屏，停止氛圍音與粒子 */
  stopAmbient();
  stopParticles();
  /* D類：停止性能監控 */
  try{stopPerfMonitor();}catch(e){}
}
function toggleTopBar(){
  var w=$('top-wrap');
  w.classList.toggle('collapsed');
}
/* 生成鋸齒狀 clip-path（已停用：黑色半屏改用直邊，金色線負責鋸齒視覺） */
function buildZigzagClip(isTop){
  return 'none';
}
/* 生成斜線鋸齒狀金色切割線的SVG path（/\/\/\ 從左上到右下再到右上交替） */
function buildZigzagLinePath(){
  var teeth=16,depth=20,step=1000/teeth,half=step/2;
  var d='M0,0';
  for(var i=0;i<teeth;i++){
    var x=i*step;
    d+=' L'+(x+half)+','+depth+' L'+(x+step)+',0';
  }
  return d;
}
/* 設置上下半屏的鋸齒金線路徑（兩條相同，重疊為一條） */
function setZigzagLines(){
  var paths=document.querySelectorAll('#split-overlay .cut-path');
  var d=buildZigzagLinePath();
  paths.forEach(function(p){p.setAttribute('d',d);});
}
function startGame(){
  /* 上下分屏過場 + 金色切割線 */
  var so=$('split-overlay');
  var topEl=so.querySelector('.split-top');
  var botEl=so.querySelector('.split-bottom');
  topEl.style.clipPath=buildZigzagClip(true);
  botEl.style.clipPath=buildZigzagClip(false);
  setZigzagLines();
  so.classList.remove('open');
  so.classList.add('active','no-title');
  void so.offsetWidth;
  /* 切換到遊戲屏並保持頂欄與狀態欄預設展開清晰可見 */
  $('game-title-screen').classList.remove('active');
  $('game-screen').classList.add('active');
  $('top-wrap').classList.remove('collapsed');
  /* C類：進入遊戲屏，啟動氛圍音與粒子 */
  initAudio();
  startAmbient();
  startParticles();
  /* D類：啟動性能監控 */
  try{startPerfMonitor();}catch(e){}
  var cfg=DUNGEON_CONFIG[currentDungeonId];
  state.currentScene=cfg.startScene;
  /* NG+：繼承前次記憶 */
  var inh=loadInheritance();
  if(inh.ng_plus){
    state.flags.ng_plus_mode=true;
    if(inh.golden_key)addItem('golden_key','黃金鑰匙','金黃色的舊鑰匙，柄上刻著一個你看不懂的記號。');
    if(inh.mirror_defeated)state.flags.mirror_defeated=true;
    if(inh.basement_knowledge)state.flags.basement_knowledge=true;
    if(inh.traded_admin)state.flags.traded_admin=true;
    if(inh.admin_guest)state.flags.admin_guest=true;
    if(inh.trusted)state.flags.trusted=true;
    showToast('你帶著前次的記憶醒來……');
  }
  updateHP();
  if(state.party!==undefined)updateParty();
  if(state.countdown!==undefined){updateCountdown();$('reset-count').textContent=state.resetCount||0;}
  updateInventoryUI();renderNotes();renderMap();
  $('narrative').innerHTML='';
  $('choices').innerHTML='';
  sceneChoiceState={pickedUseless:[],hasShownMain:false};
  currentSceneChoices=[];
  /* 在遮蓋下預加載劇情：標記首幕序章卡已由推門過場演繹，等待 playSceneText 啟動後立即完成首幕文字呈現 */
  var _initChDef = (typeof getChapterDefFor === 'function') ? getChapterDefFor(state.currentScene) : null;
  if(_initChDef && typeof markChapterShown === 'function') markChapterShown(_initChDef);
  goToScene(state.currentScene);
  setTimeout(function(){skipCurrentScene();}, Math.max(340, trTime(300) + 40));
  /* 200ms後開始：金色切割線→分屏→露出已預加載的劇情 */
  setTimeout(function(){
    playCutLineAndSplit(so);
  },200);
  updateAutoPlayIndicator();
  history.pushState({inGame:true},'');
  /* P1-4：首次進入遊戲時彈出操作說明（過場動畫結束後） */
  try{
    if(!localStorage.getItem('wuxian-help-shown')){
      localStorage.setItem('wuxian-help-shown','1');
      setTimeout(function(){
        if($('game-screen').classList.contains('active')&&!$('ending-screen').classList.contains('show')&&!document.querySelector('.modal-overlay.show')){
          openHelp();
        }
      },2600);
    }
  }catch(e){}
}
function restartGame(){
  var cfg=DUNGEON_CONFIG[currentDungeonId];
  gameStartTime=Date.now();
  /* H類：重置統計計數器 */
  dialogCount=0;itemObtainCount=0;itemObtainSet={};endingStatData=null;
  /* 重置 state */
  resetDungeonState();
  $('ending-screen').classList.remove('show');
  cleanupEndingEffects();
  updateHP();
  if(state.party!==undefined)updateParty();
  if(state.countdown!==undefined){updateCountdown();$('reset-count').textContent=0;}
  updateInventoryUI();renderNotes();renderMap();
  state.currentScene=cfg.startScene;
  goToScene(state.currentScene);
}
/* 提取自 restartGame：清空當前門扉的運行時 state（不動 inheritance） */
function resetDungeonState(){
  if(!state)return;
  var def=(window.V5&&V5._dungeonDefs&&V5._dungeonDefs[currentDungeonId])||(window.V4&&V4._dungeonDefs&&V4._dungeonDefs[currentDungeonId]);
  var fresh=(def&&typeof def.stateInit==='function')?def.stateInit():null;
  state.inventory=(fresh&&Array.isArray(fresh.inventory))?fresh.inventory.map(function(x){return Object.assign({},x);}):[];
  state.flags=(fresh&&fresh.flags&&typeof fresh.flags==='object')?JSON.parse(JSON.stringify(fresh.flags)):{};
  state.hp=(fresh&&fresh.hp!=null)?fresh.hp:100;
  state.textIndex=0;
  state.notes=(fresh&&Array.isArray(fresh.notes))?fresh.notes.slice():[];
  state.history=[];
  if(state.party!==undefined)state.party=(fresh&&fresh.party!=null)?fresh.party:4;
  if(state.partyMembers!==undefined)state.partyMembers=[];
  if(state.adminQuestions!==undefined)state.adminQuestions=3;
  state.maxHp=(fresh&&fresh.maxHp!=null)?fresh.maxHp:100;
  state.bonusCountdown=0;
  if(state.countdown!==undefined)state.countdown=(fresh&&fresh.countdown!=null)?fresh.countdown:60;
  if(state.resetCount!==undefined)state.resetCount=0;
  if(state.tide!==undefined)state.tide=(fresh&&fresh.tide!=null)?fresh.tide:'still';
  if(state.echo!==undefined)state.echo=(fresh&&fresh.echo!=null)?fresh.echo:3;
  if(state.trail!==undefined)state.trail=[];
  if(fresh&&fresh.satiety!==undefined)state.satiety=fresh.satiety;
  if(fresh&&fresh.mirrorHp!==undefined)state.mirrorHp=fresh.mirrorHp;
  if(fresh&&fresh.criticScore!==undefined)state.criticScore=fresh.criticScore;
  if(fresh&&fresh.humanity!==undefined)state.humanity=fresh.humanity;
  if(state.personality)state.personality={calm:50,altruism:50,cautious:50};
  if(fresh&&Array.isArray(fresh.mapZones)){
    state.mapZones=JSON.parse(JSON.stringify(fresh.mapZones));
  }else if(state.mapZones&&state.mapZones.forEach){
    state.mapZones.forEach(function(z,i){z.explored=(i===0);z.current=(i===0);});
  }
  if(window.V62&&typeof V62.ensureCombatItemsInInventory==='function'){
    try{V62.ensureCombatItemsInInventory();}catch(e){}
  }
}
function replayDungeon(){restartGame();}

/* ============================================================
 * 門扉專有輔助函數
 * ============================================================ */
/* 門扉2：檢查三隻貓條件——完整版定義位於場景數據區塊（buildScenes2 內），
   該版本額外設置 cat_order_ok 與 puzzle5_done 標記，此處不再重複定義。 */
/* 門扉3：夜巡護士隨機/追蹤遭遇 */
function randomNurseEncounter(fromScene){
  if(state.flags.nurse_escaped||state.flags.nurse_defeated||state.flags.chase_started)return;
  if(state.countdown<15)return;
  state.flags.nurse_track=(state.flags.nurse_track||0)+1;
  if(state.flags.nurse_track>=2){
    var snapState=state;
    setTimeout(function(){
      if(state!==snapState)return;
      if(!$('game-screen').classList.contains('active'))return;
      if($('ending-screen').classList.contains('show'))return;
      goToScene('night_nurse_encounter');
    },600);
  }
}
/* 門扉3：吃鎮定劑壞結局 */
function useSedativeBadEnd(){
  removeItem('sedative');
  state.hp=0;updateHP();
  var snapState=state;
  setTimeout(function(){
    if(state!==snapState)return;
    if(!$('game-screen').classList.contains('active'))return;
    goToScene('ending_bad_medicine');
  },800);
}

/* ============================================================
 * 鍵盤操作
 * ============================================================ */
/* 關閉當前最上層打開的彈窗/側邊面板（用於 Escape 鍵，回傳是否有關閉） */
function closeTopmostOverlay(){
  /* 1) 任一 modal-overlay 打開：關閉最後一個（DOM 順序即層級順序） */
  var modals=document.querySelectorAll('.modal-overlay.show');
  if(modals.length){
    var top=modals[modals.length-1];
    top.classList.remove('show');
    return true;
  }
  /* 2) 暫停選單 */
  var pm=$('pause-modal');
  if(pm&&pm.classList.contains('show')){pm.classList.remove('show');return true;}
  /* 3) 畫廊/預覽等其它浮層 */
  var pv=$('preview-modal');
  if(pv&&pv.classList.contains('show')){pv.classList.remove('show');return true;}
  var tpv=$('theme-preview-modal');
  if(tpv&&tpv.classList.contains('show')){tpv.classList.remove('show');return true;}
  /* 4) 側邊抽屜面板（inventory/notes/map/ach） */
  var panels=['inventory-panel','notes-panel','map-panel','ach-panel'];
  for(var i=0;i<panels.length;i++){
    var p=$(panels[i]);
    if(p&&p.classList.contains('open')){
      p.classList.remove('open');
      var ov=$(panels[i].replace('-panel','-overlay'));
      if(ov)ov.classList.remove('show');
      return true;
    }
  }
  return false;
}
document.addEventListener('keydown',function(e){
  /* F類：快捷輪盤打開時，讓輪盤的監聽器全權處理按鍵 */
  if($('quick-wheel')&&$('quick-wheel').classList.contains('show'))return;
  /* Escape 優先關閉最上層彈窗/面板，而不是無條件打開暫停 */
  if(e.key==='Escape'){
    if($('puzzle-modal').classList.contains('show'))return; /* 謎題有自己的處理 */
    if($('admin-modal').classList.contains('show'))return;
    if($('dialog-overlay').classList.contains('open')){
      if(dialogCurrentNpc)backToNpcList();
      else closeDialogPanel();
      return;
    }
    if(closeTopmostOverlay()){e.preventDefault();return;}
    /* 沒有打開任何彈窗才打開暫停 */
    openPause();
    return;
  }
  if($('puzzle-modal').classList.contains('show'))return;
  if($('admin-modal').classList.contains('show'))return;
  if($('dialog-overlay').classList.contains('open')){
    /* 對話進行中：數字鍵 1/2/3…選擇對話選項（不含「離開對話」） */
    if(dialogCurrentNpc && e.key>='1'&&e.key<='9'){
      var dOpts=$('dialog-options').querySelectorAll('.dialog-opt-btn:not(.leave)');
      var dIdx=parseInt(e.key)-1;
      if(dOpts[dIdx]&&!dOpts[dIdx].disabled)dOpts[dIdx].click();
    }
    return;
  }
  /* Feature 19擴展：僅在遊戲屏激活、無彈窗、非輸入框聚焦時生效 */
  if($('game-screen').classList.contains('active')
     && !$('ending-screen').classList.contains('show')
     && !$('pause-modal').classList.contains('show')
     && !document.querySelector('.modal-overlay.show')
     && !$('inventory-panel').classList.contains('open')
     && !$('map-panel').classList.contains('open')
     && !(document.activeElement && (document.activeElement.tagName==='INPUT'||document.activeElement.tagName==='TEXTAREA'))){
    /* Space：打字中=跳過打字；自動播放中且打字已完成=暫停/繼續 */
    if(e.key===' '){
      e.preventDefault();
      if(isTyping()){skipTyping();}
      else if(SETTINGS.autoPlay && !window.gmAutoSkip){toggleAutoPlay();}
      return;
    }
    /* I/i：物品欄 */
    if(e.key==='i'||e.key==='I'){toggleInventory();return;}
    /* M/m：地圖 */
    if(e.key==='m'||e.key==='M'){openMap();return;}
    /* S/s：存檔 */
    if(e.key==='s'||e.key==='S'){openSaveModal();return;}
    /* L/l：讀檔 */
    if(e.key==='l'||e.key==='L'){openLoadModal();return;}
  }
  if(e.key>='1'&&e.key<='9'){
    var btns=$('choices').querySelectorAll('.choice-btn');
    var idx=parseInt(e.key)-1;
    if(btns[idx])btns[idx].click();
  }
});
/* 點擊文字區域：跳過當前打字（選項按鈕位於 #choices，不經此層，互不干擾） */
document.addEventListener('click',function(e){
  if(!$('game-screen').classList.contains('active'))return;
  if($('ending-screen').classList.contains('show'))return;
  if($('dialog-overlay').classList.contains('open'))return;
  if(e.target.closest('.modal-overlay,.pause-menu,#choices,.top-bar,.status-bar,.room-display,#autoplay-indicator'))return;
  var narr=e.target.closest('#narrative');
  if(narr&&isTyping()){e.preventDefault();skipTyping();}
});
/* C類：首次點擊喚醒 AudioContext（瀏覽器自動播放策略） */
document.addEventListener('click',function onceAudioInit(){
  initAudio();
  if(audioCtx){
    document.removeEventListener('click',onceAudioInit);
  }
},{once:false});
/* 歷史搜索框輸入事件 */
(function(){
  var sb=document.getElementById('hist-search');
  if(sb)sb.addEventListener('input',onHistSearchInput);
})();

/* ============================================================
 * F類：全局懸浮提示 Tooltip（事件委託）
 * ============================================================ */
(function(){
  function initTip(){
  var tip=$('global-tooltip');
  if(!tip)return;
  /* 快取 tooltip 尺寸，避免每次 mousemove 都讀 offsetWidth/offsetHeight 造成強制同步佈局 */
  var tipW=0,tipH=0,tipText='';
  document.addEventListener('mouseover',function(e){
    var el=e.target.closest('[data-tooltip]');
    if(!el){tip.style.display='none';return;}
    var text=el.getAttribute('data-tooltip');
    if(!text){tip.style.display='none';return;}
    tip.textContent=text;
    tip.style.display='block';
    if(text!==tipText){
      tipText=text;
      tipW=tip.offsetWidth;tipH=tip.offsetHeight; /* 只在文字變了才測量 */
    }
    positionTip(e);
  });
  document.addEventListener('mousemove',function(e){
    if(tip.style.display==='block')positionTip(e);
  });
  document.addEventListener('mouseout',function(e){
    var el=e.target.closest('[data-tooltip]');
    if(el&&!el.contains(e.relatedTarget)){tip.style.display='none';}
  });
  function positionTip(e){
    var x=e.clientX+12,y=e.clientY+12;
    var tw=tipW||tip.offsetWidth,th=tipH||tip.offsetHeight;
    if(x+tw>window.innerWidth-8)x=e.clientX-tw-12;
    if(y+th>window.innerHeight-8)y=e.clientY-th-12;
    tip.style.left=x+'px';
    tip.style.top=y+'px';
  }
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initTip);}
  else{initTip();}
})();

/* ============================================================
 * F類：快捷輪盤（圓形扇形菜單）
 * ============================================================ */
var _wheelSavedScenes=null,_wheelSavedState=null,_wheelSavedDungeonId=null;
function openQuickWheel(){
  var qw=$('quick-wheel');
  if(!qw)return;
  qw.classList.add('show');
}
function closeQuickWheel(){
  var qw=$('quick-wheel');
  if(qw)qw.classList.remove('show');
  document.querySelectorAll('.wheel-sector.active').forEach(function(s){s.classList.remove('active');});
  document.body.classList.remove('wheel-paused');
}
function toggleQuickWheel(){
  var qw=$('quick-wheel');
  if(!qw)return;
  if(qw.classList.contains('show'))closeQuickWheel();
  else openQuickWheel();
}
function wheelAction(n){
  closeQuickWheel();
  switch(n){
    case 1:toggleInventory();break;
    case 2:openMap();break;
    case 3:openSaveModal();break;
    case 4:openSettings();break;
    case 5:openHistory();break;
    case 6:openBranchDungeonSelect();break;
    case 7:restartCurrentDungeon();break;
  }
}
/* 快捷輪盤：重新開始當前門扉（保留繼承/成就/結局記錄） */
function restartCurrentDungeon(){
  if(!state||!$('game-screen').classList.contains('active')){showToast('尚未踏入門扉');return;}
  showConfirm('確定要重新開始此門扉嗎？目前進度將遺失（建議先存檔）',function(){
    restartGame();
    showToast('此門扉已重新開始');
  },'重新踏入此門');
}
/* 分支圖：先選門扉 */
function openBranchDungeonSelect(){
  var list=$('branch-dungeon-list');
  if(!list)return;
  list.innerHTML='';
  var dgs=dungeons.map(function(d){
    return {id:d.id,name:d.name,index:d.index,scenes:sceneRefs[d.id],st:stateRefs[d.id]};
  });
  var isGM=!!window._gmUnlocked;
  dgs.forEach(function(d){
    var unlocked=isGM||isUnlocked(d.id);
    var btn=document.createElement('button');
    btn.className='branch-dungeon-btn'+(unlocked?'':' locked');
    btn.innerHTML='<span class="bd-index">'+d.index+'</span><span class="bd-name">'+d.name+'</span>'+(unlocked?'':'<span class="bd-lock">未 解 鎖</span>');
    if(unlocked){
      btn.addEventListener('click',function(){
        closeModal('branch-dungeon-modal');
        openBranchTreeForDungeon(d.id,d.scenes,d.st);
      });
    }
    list.appendChild(btn);
  });
  $('branch-dungeon-modal').classList.add('show');
}
/* 打開指定門扉的分支樹（臨時切換SCENES，關閉時恢復） */
var _branchViewActive = false;
function openBranchTreeForDungeon(dungeonId,scenesObj,stateObj){
  if(!_branchViewActive){
    _wheelSavedScenes=SCENES;
    _wheelSavedState=state;
    _wheelSavedDungeonId=currentDungeonId;
    _branchViewActive=true;
  }
  SCENES=scenesObj;
  state=stateObj;
  currentDungeonId=dungeonId;
  renderBranchTree();
  branchInitPan();
  $('branch-modal').classList.add('show');
  var bm=$('branch-modal');
  if(!bm.__v64RestoreBound){
    var restoreObserver=new MutationObserver(function(){
      if(!bm.classList.contains('show') && _branchViewActive){
        SCENES=_wheelSavedScenes;state=_wheelSavedState;currentDungeonId=_wheelSavedDungeonId;
        _wheelSavedScenes=null;_wheelSavedState=null;_wheelSavedDungeonId=null;
        _branchViewActive=false;
      }
    });
    restoreObserver.observe(bm,{attributes:true,attributeFilter:['class']});
    bm.__v64RestoreBound = true;
  }
}
(function(){
  /* 綁定扇形 */
  function bindWheelSectors(){
    var sectors=document.querySelectorAll('#quick-wheel .wheel-sector');
    sectors.forEach(function(sec){
      sec.addEventListener('click',function(e){
        e.stopPropagation();
        wheelAction(parseInt(sec.dataset.wheel));
      });
    });
    /* 點擊內圓關閉 */
    var svg=$('wheel-svg');
    if(svg){
      svg.addEventListener('click',function(e){
        if(e.target.tagName==='circle'&&e.target.getAttribute('r')==='52'){
          closeQuickWheel();
        }
      });
    }
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',bindWheelSectors);}
  else{bindWheelSectors();}

  /* FAB：按住彈出+拖動選擇+鬆開執行，短按點擊切換 */
  var fab=null,pressTimer=null,isPressing=false,wheelOpenedByPress=false;
  var suppressClick=false,activeSector=null;
  function getSectorAtPoint(clientX,clientY){
    var qw=$('quick-wheel');
    if(!qw||!qw.classList.contains('show'))return null;
    var rect=qw.getBoundingClientRect();
    var cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    var dx=clientX-cx,dy=clientY-cy;
    var dist=Math.sqrt(dx*dx+dy*dy);
    var minR=rect.width*0.17,maxR=rect.width*0.48;
    if(dist<minR||dist>maxR)return null;
    /* 計算角度，0度=頂部，順時針 */
    var angle=Math.atan2(dx,-dy)*180/Math.PI;
    if(angle<0)angle+=360;
    /* 6個扇形，每個60度，從頂部0°開始順時針：物品(0-60),地圖(60-120),存檔(120-180),設置(180-240),歷史(240-300),分支(300-360) */
    var sectorNum;
    if(angle<60)sectorNum=1;
    else if(angle<120)sectorNum=2;
    else if(angle<180)sectorNum=3;
    else if(angle<240)sectorNum=4;
    else if(angle<300)sectorNum=5;
    else sectorNum=6;
    return sectorNum;
  }
  function highlightSector(num){
    document.querySelectorAll('.wheel-sector').forEach(function(s){
      s.classList.toggle('active',parseInt(s.dataset.wheel)===num);
    });
  }
  function onPressStart(e){
    if(isPressing)return;
    isPressing=true;
    fab.classList.add('pressing');
    suppressClick=false;
    activeSector=null;
    pressTimer=setTimeout(function(){
      openQuickWheel();
      wheelOpenedByPress=true;
      document.body.classList.add('wheel-paused');
      suppressClick=true;
    },200);
  }
  function onPressMove(e){
    if(!isPressing||!wheelOpenedByPress)return;
    var pt=e.touches?e.touches[0]:e;
    var num=getSectorAtPoint(pt.clientX,pt.clientY);
    if(num!==activeSector){
      activeSector=num;
      highlightSector(num);
    }
  }
  function onPressEnd(e){
    if(!isPressing)return;
    isPressing=false;
    fab.classList.remove('pressing');
    if(pressTimer){clearTimeout(pressTimer);pressTimer=null;}
    /* 如果是按住彈出的輪盤 */
    if(wheelOpenedByPress){
      document.body.classList.remove('wheel-paused');
      /* 如果拖動到了扇形，執行該動作 */
      if(activeSector){
        var chosen=activeSector;
        closeQuickWheel();
        wheelOpenedByPress=false;
        activeSector=null;
        setTimeout(function(){wheelAction(chosen);},50);
        return;
      }
      /* 否則直接關閉 */
      closeQuickWheel();
      wheelOpenedByPress=false;
      activeSector=null;
      return;
    }
    /* 短按（未到200ms），讓click事件處理切換 */
  }
  function initFab(){
    fab=document.getElementById('wheel-fab');
    if(!fab)return;
    fab.style.touchAction='none';
    fab.addEventListener('click',function(e){
      e.stopPropagation();
      if(suppressClick){suppressClick=false;return;}
      toggleQuickWheel();
    });
    /* Pointer Events 統一處理鼠標和觸控，避免雙重觸發 */
    fab.addEventListener('pointerdown',function(e){
      e.preventDefault();
      onPressStart(e);
    });
    document.addEventListener('pointermove',onPressMove);
    document.addEventListener('pointerup',function(e){
      onPressEnd(e);
    });
    document.addEventListener('pointercancel',onPressEnd);
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initFab);}
  else{initFab();}

  /* keydown：Q 切換，ESC 關閉，1-6 選擇 */
  document.addEventListener('keydown',function(e){
    var qw=$('quick-wheel');
    if(!qw)return;
    var open=qw.classList.contains('show');
    if(!open){
      if(e.key==='q'||e.key==='Q'){
        if($('game-screen').classList.contains('active')
          &&!$('ending-screen').classList.contains('show')
          &&!$('dialog-overlay').classList.contains('open')){
          e.preventDefault();
          toggleQuickWheel();
        }
      }
      return;
    }
    if(e.key==='Escape'||e.key==='q'||e.key==='Q'){
      e.preventDefault();
      closeQuickWheel();
      return;
    }
    if(e.key>='1'&&e.key<='7'){
      e.preventDefault();
      wheelAction(parseInt(e.key));
    }
  });

  /* 點擊輪盤外部關閉 */
  document.addEventListener('click',function(e){
    var qw=$('quick-wheel');
    if(qw&&qw.classList.contains('show')){
      if(!e.target.closest('#quick-wheel')&&!e.target.closest('#wheel-fab')){
        closeQuickWheel();
      }
    }
  });
})();

/* ============================================================
 * F類：雙擊快速繼續（一次性跳過當前場景）
 * ============================================================ */
(function(){
  var narr=$('narrative');
  if(!narr)return;
  narr.addEventListener('dblclick',function(e){
    if(!$('game-screen').classList.contains('active'))return;
    if($('ending-screen').classList.contains('show'))return;
    if($('dialog-overlay').classList.contains('open'))return;
    e.preventDefault();
    skipCurrentScene();
  });
})();

/* ============================================================
 * F類：滑動手勢（手機端）
 * 左滑=歷史，右滑=地圖，下滑=菜單
 * ============================================================ */
(function(){
  if(!('ontouchstart' in window))return;
  var gs=$('game-screen');
  if(!gs)return;
  var sx=0,sy=0,st=0;
  var THRESH=50,MAX_TIME=500;
  gs.addEventListener('touchstart',function(e){
    if(e.touches.length!==1)return;
    sx=e.touches[0].clientX;
    sy=e.touches[0].clientY;
    st=Date.now();
  },{passive:true});
  gs.addEventListener('touchend',function(e){
    var dt=Date.now()-st;
    if(dt>MAX_TIME)return;
    var t=e.changedTouches[0];
    var dx=t.clientX-sx;
    var dy=t.clientY-sy;
    var adx=Math.abs(dx),ady=Math.abs(dy);
    if(Math.max(adx,ady)<THRESH)return;
    /* 只在遊戲屏激活、非結局、非對話時生效 */
    if(!gs.classList.contains('active'))return;
    if($('ending-screen').classList.contains('show'))return;
    if($('dialog-overlay').classList.contains('open'))return;
    if(adx>ady){
      /* 橫向滑動 */
      if(dx<-THRESH){e.preventDefault();openHistory();}
      else if(dx>THRESH){e.preventDefault();openMap();}
    }else{
      /* 縱向滑動：只有下滑 */
      if(dy>THRESH){e.preventDefault();openPause();}
    }
  },{passive:false});
})();

/* --- 長按5秒跳過 --- */
var lpTimer=null,lpRaf=null,lpStart=0,lpActive=false;
var LP_DURATION=3000;

function lpStartProgress(){
  if(!$('game-screen').classList.contains('active'))return;
  if($('ending-screen').classList.contains('show'))return;
  if($('dialog-overlay').classList.contains('open'))return;
  if(!isTyping()&&!currentPlayContext)return;
  lpActive=true;
  lpStart=performance.now();
  var overlay=$('lp-overlay');
  var circle=$('lp-progress');
  var C=2*Math.PI*36;
  circle.style.strokeDasharray=C;
  circle.style.strokeDashoffset=C;
  overlay.classList.add('show');
  function frame(now){
    if(!lpActive)return;
    var elapsed=now-lpStart;
    var pct=Math.min(1,elapsed/LP_DURATION);
    circle.style.strokeDashoffset=C*(1-pct);
    if(pct>=1){
      lpCancel();
      skipCurrentScene();
      return;
    }
    lpRaf=requestAnimationFrame(frame);
  }
  lpRaf=requestAnimationFrame(frame);
}
function lpCancel(){
  lpActive=false;
  if(lpRaf)cancelAnimationFrame(lpRaf);
  lpRaf=null;
  if(lpTimer){clearTimeout(lpTimer);lpTimer=null;}
  $('lp-overlay').classList.remove('show');
}
(function(){
  var narr=document.getElementById('narrative');
  if(!narr)return;
  var lpX=0,lpY=0;
  var EXCLUDE='#choices,.top-bar,.status-bar,.room-display,.modal-overlay,.pause-menu';
  function recordStart(x,y){lpX=x;lpY=y;}
  function tooFar(x,y){return Math.abs(x-lpX)>10||Math.abs(y-lpY)>10;}
  narr.addEventListener('mousedown',function(e){
    if(e.target.closest(EXCLUDE))return;
    recordStart(e.clientX,e.clientY);
    lpStartProgress();
  });
  narr.addEventListener('touchstart',function(e){
    if(e.target.closest(EXCLUDE))return;
    var t=e.touches[0];if(t)recordStart(t.clientX,t.clientY);
    lpStartProgress();
  },{passive:true});
  document.addEventListener('mouseup',lpCancel);
  document.addEventListener('touchend',lpCancel);
  document.addEventListener('touchcancel',lpCancel);
  /* 手指/滑鼠移動超過 10px 即取消長按（避免滾動、滑動誤觸） */
  document.addEventListener('mousemove',function(e){
    if(lpActive&&tooFar(e.clientX,e.clientY))lpCancel();
  });
  narr.addEventListener('touchmove',function(e){
    if(lpActive){
      var t=e.touches[0];
      if(t&&tooFar(t.clientX,t.clientY))lpCancel();
    }
  },{passive:true});
})();
window.addEventListener('popstate',function(){
  if($('game-screen').classList.contains('active')&&!$('ending-screen').classList.contains('show')){
    openPause();history.pushState({inGame:true},'');
  }
});

/* ============================================================
 * B類深化：畫廊 / NPC遇見 / 物品組合 / NG+重置
 * ============================================================ */

/* --- NPC 遇見記錄 --- */
var MET_NPCS_KEY='wuxian-met-npcs';
function getMetNpcs(){
  try{var a=JSON.parse(localStorage.getItem(MET_NPCS_KEY));if(Array.isArray(a))return a;}catch(e){}
  return [];
}
function markNpcMet(npcKey){
  var arr=getMetNpcs();
  if(arr.indexOf(npcKey)===-1){arr.push(npcKey);localStorage.setItem(MET_NPCS_KEY,JSON.stringify(arr));}
}

/* --- 畫廊 --- */
var galleryState={dungeon:1,tab:'endings'};
function openGallery(){
  galleryState.dungeon=(state&&currentDungeonId)?currentDungeonId:currentIndex+1;
  renderGalleryDungeonSwitcher();
  renderGallery();
  $('gallery-modal').classList.add('show');
}
function renderGalleryDungeonSwitcher(){
  var html='';
  dungeons.forEach(function(d){
    var isHid=(window.V61&&typeof V61.getDungeonDisplayState==='function'&&V61.getDungeonDisplayState(d.id)==='hidden'&&!window._gmUnlocked);
    var label=isHid?'？？？':d.name;
    html+='<button class="gallery-dz-btn'+(galleryState.dungeon===d.id?' active':'')+'" onclick="setGalleryDungeon('+d.id+')">'+label+'</button>';
  });
  $('gallery-dz-switcher').innerHTML=html;
}
function setGalleryDungeon(did){
  if(window.V61&&typeof V61.getDungeonDisplayState==='function'&&V61.getDungeonDisplayState(did)==='hidden'&&!window._gmUnlocked){
    if(typeof V61.showMysteryLockModal==='function')V61.showMysteryLockModal(did,false);
    return;
  }
  galleryState.dungeon=did;
  renderGalleryDungeonSwitcher();
  renderGallery();
}
function switchGalleryTab(tab){
  galleryState.tab=tab;
  var tabs=document.querySelectorAll('.gallery-tab');
  tabs.forEach(function(t){t.classList.toggle('active',t.dataset.tab===tab);});
  renderGallery();
}
function renderGallery(){
  var body=$('gallery-body');
  var did=galleryState.dungeon;
  var tab=galleryState.tab;
  if(tab==='endings')renderGalleryEndings(did,body);
  else if(tab==='npcs')renderGalleryNpcs(body);
  else if(tab==='achievements')renderGalleryAchievements(did,body);
  else if(tab==='scenes')renderGalleryScenes(did,body);
}
function renderGalleryEndings(did,body){
  var log=getEndingLog();
  var total=ENDING_TOTALS[did]||0;
  var found=log.filter(function(e){return e.indexOf(did+'|')===0;});
  if(found.length===0){body.innerHTML='<div class="gallery-empty">尚未發現任何結局</div>';return;}
  var html='';
  found.forEach(function(e){
    var parts=e.split('|');
    var type=parts[1]||'',title=parts[2]||'';
    var baseType=type.split('_')[0];
    var typeLabel={normal:'普通',bad:'壞',survive:'逃過',hidden:'隱藏',death:'死亡'}[baseType]||({normal:'普通',bad:'壞',survive:'逃過',hidden:'隱藏',death_hp:'死亡'}[type]||type);
    html+='<div class="gallery-cell unlocked"><div class="gc-name">'+title+'</div><div class="gc-type">'+typeLabel+'結局</div></div>';
  });
  var lockedCount=total-found.length;
  for(var i=0;i<lockedCount;i++){
    html+='<div class="gallery-cell locked"><div class="gc-name">？？？</div><div class="gc-type">未解鎖</div></div>';
  }
  body.innerHTML=html;
}
function renderGalleryNpcs(body){
  var met=getMetNpcs();
  var keys=Object.keys(NPC_PROFILES);
  if(keys.length===0){body.innerHTML='<div class="gallery-empty">尚未遇見任何人</div>';return;}
  var html='';
  keys.forEach(function(k){
    var prof=NPC_PROFILES[k];
    var isMet=met.indexOf(k)!==-1;
    if(isMet){
      var desc=prof.desc||'一個你遇見過的人。';
      html+='<div class="gallery-cell npc-cell unlocked"><div class="gc-name">'+prof.name+'</div><div class="gc-desc">'+desc+'</div></div>';
    }else{
      html+='<div class="gallery-cell npc-cell locked"><div class="gc-name">？？？</div><div class="gc-type">未遇見</div></div>';
    }
  });
  body.innerHTML=html;
}
function renderGalleryAchievements(did,body){
  var cfg=DUNGEON_CONFIG[did];
  var defs=cfg?cfg.achDefs:[];
  var unlocked=getAchList();
  if(defs.length===0){body.innerHTML='<div class="gallery-empty">此門扉尚無成就</div>';return;}
  var html='';
  defs.forEach(function(a){
    var isUn=unlocked.indexOf(a.id)!==-1;
    if(isUn){
      html+='<div class="gallery-cell unlocked"><div class="gc-name">'+a.name+'</div><div class="gc-desc">'+a.desc+'</div></div>';
    }else{
      html+='<div class="gallery-cell locked"><div class="gc-name">？？？</div><div class="gc-type">未解鎖</div></div>';
    }
  });
  body.innerHTML=html;
}
function renderGalleryScenes(did,body){
  /* 讀取已讀場景記錄 */
  var readKey='wuxian-read-scenes-'+did;
  var readArr=[];
  try{readArr=JSON.parse(localStorage.getItem(readKey))||[];}catch(e){}
  /* 獲取該門扉所有場景ID。
     根因修正：改用 sceneRefs[did] 這個統一來源。門扉1-3 的 SCENES1/2/3 是頂層全域（剛好掛在 window 上），
     但第四扇門的場景掛在 sceneRefs[4]、從未賦予 window.SCENES4，舊寫法 window['SCENES'+did] 永遠取不到，
     導致第四扇門場景分頁恒顯示「尚未進入此門扉」。sceneRefs 才是所有門扉場景的正確索引。 */
  var scenesObj=sceneRefs[did];
  if(!scenesObj){body.innerHTML='<div class="gallery-empty">尚未進入此門扉</div>';return;}
  var allIds=Object.keys(scenesObj);
  if(allIds.length===0){body.innerHTML='<div class="gallery-empty">此門扉尚無場景</div>';return;}
  var html='';
  allIds.forEach(function(sid){
    var isRead=readArr.indexOf(sid)!==-1;
    if(isRead){
      html+='<div class="gallery-cell unlocked"><div class="gc-name">'+sid+'</div><div class="gc-type">已到達</div></div>';
    }else{
      html+='<div class="gallery-cell locked"><div class="gc-name">？？？</div><div class="gc-type">未到達</div></div>';
    }
  });
  body.innerHTML=html;
}

/* --- 物品組合 --- */
var COMBINATION_RECIPES={
  /* 門扉1 配方 */
  'rope_key':{ingredients:['rope','main_key'],name:'繩綁鑰匙',desc:'把繩子綁在大門鑰匙上，垂下去撿地面的東西。',usage:'可以拿到走廊地面遺落的物品'},
  'note_ticket':{ingredients:['crumpled_note','movie_ticket'],name:'線索拼合',desc:'紙條上的提示和電影票日期對上了。',usage:'發現13號房和1987年的關聯'},
  'golden_key2':{ingredients:['key_second','golden_key'],name:'雙鑰合一',desc:'兩把鑰匙重合時，邊緣泛起微弱金光。',usage:'解鎖鏡子房間的秘密'},
  /* 門扉2 配方 */
  'book_notebook':{ingredients:['zhangwei_notebook','your_book'],name:'記錄對照',desc:'張偉的筆記和《陸衍的一生》互相印證。',usage:'得知前一批受困者的結局'},
  'diary_album':{ingredients:['admin_diary','yuanyuan_album'],name:'媛媛的線索',desc:'日記和畫冊拼出媛媛的完整故事。',usage:'發現圖書館和旅館的關聯'},
  'manager_exit':{ingredients:['manager_book','exit_key'],name:'出口線索',desc:'管理員的書記載著出口鑰匙的用法。',usage:'找到沉默圖書館的真正出口'},
  /* 門扉3 配方 */
  'antibiotic_painkiller':{ingredients:['antibiotic','painkiller'],name:'複合藥劑',desc:'抗生素和止痛藥混合，效果更強。',usage:'+25分鐘，恢復20點生命'},
  'medicine_record':{ingredients:['medical_records','unlabeled_medicine'],name:'辨識藥瓶',desc:'對照病歷上的用藥記錄，認出藥瓶內容。',usage:'得知未標籤藥瓶是哪種藥'},
  'diary_scalpel':{ingredients:['director_diary','scalpel'],name:'拆信刀',desc:'手術刀拆開院長日記的密封信封。',usage:'讀到日記最後一頁的隱藏信息'},
  'memory_record':{ingredients:['yuanyuan_memory','surgery_record'],name:'記憶還原',desc:'記憶卡和手術記錄拼出媛媛的最後一刻。',usage:'解鎖媛媛的完整結局'},
  'epinephrine_sedative':{ingredients:['epinephrine','sedative'],name:'應急針劑',desc:'腎上腺素對沖鎮定劑的副作用。',usage:'危急時使用，恢復40點生命'}
};
var combineMode=false;
var combineSelected=[];
function toggleCombineMode(){
  combineMode=!combineMode;
  combineSelected=[];
  var bar=$('combine-bar');
  bar.style.display=combineMode?'flex':'none';
  updateInventoryUI();
  if(combineMode)showToast('組合模式：點選兩樣物品');
}
function selectCombineItem(id){
  var idx=combineSelected.indexOf(id);
  if(idx!==-1){combineSelected.splice(idx,1);}
  else{
    if(combineSelected.length>=2){showToast('最多選兩樣');return;}
    combineSelected.push(id);
  }
  updateCombineBar();
  updateInventoryUI();
}
function updateCombineBar(){
  var hint=$('combine-hint');
  var btn=$('combine-do-btn');
  if(combineSelected.length===0){hint.textContent='選中兩樣物品';btn.disabled=true;}
  else if(combineSelected.length===1){
    var it1=state.inventory.find(function(i){return i.id===combineSelected[0];});
    hint.textContent='已選：'+(it1?it1.name:combineSelected[0]);
    btn.disabled=true;
  }else{
    var n1=state.inventory.find(function(i){return i.id===combineSelected[0];});
    var n2=state.inventory.find(function(i){return i.id===combineSelected[1];});
    hint.textContent='已選：'+(n1?n1.name:'?')+' + '+(n2?n2.name:'?');
    btn.disabled=false;
  }
}
function doCombine(){
  if(combineSelected.length<2)return;
  var id1=combineSelected[0],id2=combineSelected[1];
  var recipeId=null;
  for(var rid in COMBINATION_RECIPES){
    var r=COMBINATION_RECIPES[rid];
    if(r.ingredients.indexOf(id1)!==-1&&r.ingredients.indexOf(id2)!==-1){recipeId=rid;break;}
  }
  if(!recipeId){
    showToast('這兩樣東西無法組合');
    return;
  }
  var rec=COMBINATION_RECIPES[recipeId];
  removeItem(id1);removeItem(id2);
  addItem(recipeId,rec.name,rec.desc,rec.usage||'');
  showToast('組合成功：獲得'+rec.name);
  combineSelected=[];
  updateCombineBar();
}

/* --- NG+ 重置 --- */
function clearNgPlus(){
  saveInheritance({ng_plus:false});
  showToast('New Game+ 狀態已清除');
}

/* ============================================================
 * 初始化
 * ============================================================ */
/* 初始化由第二個 script 區塊完成（state 就緒後） */
