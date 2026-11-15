
/* ============================================================
 * GM 系統
 * 開啟方式：
 *  A) 標題頁快速點「無盡之門」標題五次，接著點標題上方兩次、下方兩次，再輸入通行碼。
 * 通行碼：wuxian2024
 * ============================================================ */
var GM_PASSWORD='wuxian2024';

var GM_ITEMS=[
  {id:'crumpled_note',name:'皺巴巴的紙條',desc:'質數會騙人'},
  {id:'key3',name:'3號房鑰匙',desc:'銅製鑰匙'},
  {id:'rope',name:'繩子',desc:'十米長，很結實'},
  {id:'main_key',name:'大門鑰匙',desc:'銅製大鑰匙'},
  {id:'key_second',name:'第二把大門鑰匙',desc:'鏡像掉落'},
  {id:'golden_key',name:'黃金鑰匙',desc:'刻著看不懂的記號'},
  {id:'movie_ticket',name:'舊電影票',desc:'1987年7月14日'},
  {id:'admin_diary',name:'管理員的日記',desc:'媛媛與1987'},
  {id:'your_book',name:'《陸衍的一生》',desc:'你的一生'},
  {id:'zhangwei_notebook',name:'張偉的筆記本',desc:'密碼8269'},
  {id:'yuanyuan_album',name:'媛媛的畫冊',desc:'布面繡貓'},
  {id:'manager_book',name:'管理員的書',desc:'出口真相'},
  {id:'exit_key',name:'出口鑰匙',desc:'黃銅，生鏽'},
  {id:'unlabeled_medicine',name:'未標籤藥瓶',desc:'需林醫生辨識'},
  {id:'painkiller',name:'止痛藥',desc:'+15分鐘'},
  {id:'antibiotic',name:'抗生素',desc:'+20分鐘'},
  {id:'sedative',name:'鎮定劑',desc:'+30分鐘，副作用'},
  {id:'backup_sedative',name:'應急鎮定劑',desc:'林醫生確認'},
  {id:'epinephrine',name:'腎上腺素針劑',desc:'恢復30生命'},
  {id:'medical_records',name:'病人病歷',desc:'地下二樓失蹤者'},
  {id:'director_diary',name:'院長日記',desc:'B2的活物'},
  {id:'scalpel',name:'手術刀',desc:'防身/撬鎖'},
  {id:'surgery_record',name:'手術記錄單',desc:'陳媛媛之死'},
  {id:'valium',name:'安定片',desc:'+10分鐘'},
  {id:'b2_key',name:'B2鑰匙',desc:'院長遺物'},
  {id:'yuanyuan_memory',name:'媛媛的記憶卡',desc:'1987-1993'}
];

var GM_NPCS=[
  {name:'陸衍',desc:'主角。數學系博士生，研究質數分佈，實驗室猝死後進入迴廊。理性、耐煩、習慣懷疑顯而易見的答案。'},
  {name:'蘇晚',desc:'第一扇門隊友。白連帽衫女生，話少，眼神躲。對「疼的就是真的」這句話記憶深刻。她的生還狀態會繼承到後續門扉。'},
  {name:'老趙',desc:'第一扇門隊友。中年男人，自稱見過陣仗，手卻在抖。嘴硬。'},
  {name:'阿凱',desc:'第一扇門隊友。少年，嘴叼棒棒糖。表面粗心愛闖禍，實為旅館生成的複製人/鏡像，任務是說假話把人往死路上帶。'},
  {name:'圖書館管理員',desc:'第二扇門核心NPC。深灰西裝，不說話，靠唇語和便簽與你溝通。媛媛1987-1993，他是第三任管理員，替死去的第二任（媛媛的父親）守著圖書館。知道出口在地毯下、五個凹槽的秘密。'},
  {name:'媛媛',desc:'貫穿第二、第三扇門的小女孩。六歲死於記憶提取手術，記憶被困在B2。她在等爸爸。'},
  {name:'陳姐',desc:'第二扇門隊友。小學老師，保溫杯裡裝著安眠藥水，怕自己閉館時尖叫。生還狀態會繼承。'},
  {name:'老周',desc:'第二扇門隊友。藍色工作服，左手缺一根小指。不愛說話，用筆記本和人交流。生還狀態會繼承。'},
  {name:'小雨',desc:'第三扇門隊友。護理系學生，想回家吃媽媽做的紅燒肉。她的選擇會導致不同結局。'},
  {name:'林醫生',desc:'第三扇門NPC。能辨識未標籤藥物，交換應急鎮定劑。'},
  {name:'夜巡護士（周敏）',desc:'第三扇門追蹤者。1999年做到醫院關門，最終走進了太平間第14格。'},
  {name:'鏡像',desc:'第一扇門終局。鏡子裡的另一個你。擊敗與否影響繼承。'}
];

var GM_MECH=[
  '<strong>繼承系統</strong>：通關前一門扉後，特定旗標（生還者、關鍵物品、重要選擇）會寫入 wuxian-inheritance，帶入下一扇門的開局。例如擊敗鏡像、持有黃金鑰匙、陳姐/老周/小雨/蘇晚生還、是否保留記憶等。',
  '<strong>解鎖規則</strong>：門扉1恆開；通關門扉1解鎖門扉2；通關門扉2解鎖門扉3。',
  '<strong>結局條件</strong>：每扇門扉有多個普通、壞、隱藏結局，由關鍵選擇與旗標觸發。結局會記入 wuxian-endings。',
  '<strong>倒計時</strong>：第三扇門內，時間到會重置——失去物品與記憶。用藥品增加時間。',
  '<strong>存檔</strong>：每扇門扉三個槽位，key 前綴分別為 prime-hotel-save / silent-library-save / countdown-hospital-save。',
  '<strong>GM 備註</strong>：此面板僅供除錯與體驗，不影響正式存檔 key 名稱。'
];

function gmShowPassword(){
  var ov=document.getElementById('gm-password-overlay');
  ov.classList.add('show');
  var inp=document.getElementById('gm-pw-input');
  inp.value='';
  document.getElementById('gm-pw-err').textContent='';
  setTimeout(function(){inp.focus();},50);
}
function gmSubmitPassword(){
  var inp=document.getElementById('gm-pw-input');
  if(inp.value===GM_PASSWORD){
    document.getElementById('gm-password-overlay').classList.remove('show');
    window._gmUnlocked=true;
    try{localStorage.setItem('wuxian_gm_unlocked','1');}catch(e){}
    document.getElementById('gm-bar').style.display='flex';
    updateGmOnlyButtons();
    gmOpenPanel();
  }else{
    document.getElementById('gm-pw-err').textContent='通行碼錯誤';
    inp.value='';
  }
}
function gmOpenPanel(){
  gmRefreshAll();
  document.getElementById('gm-panel').classList.add('open');
  document.body.classList.add('gm-open');
}
function gmClosePanel(){
  document.getElementById('gm-panel').classList.remove('open');
  document.body.classList.remove('gm-open');
}
function gmTogglePanel(){
  if(!window._gmUnlocked)return;
  var p=document.getElementById('gm-panel');
  if(p.classList.contains('open')){gmClosePanel();}
  else{gmOpenPanel();}
}
function gmSwitchTab(tab){
  document.querySelectorAll('.gm-tab').forEach(function(b){b.classList.toggle('on',b.dataset.gmtab===tab);});
  document.querySelectorAll('.gm-section').forEach(function(s){s.classList.remove('on');});
  document.getElementById('gm-sec-'+tab).classList.add('on');
}
function gmRefreshAll(){
  document.getElementById('gm-cur-dungeon').textContent=currentDungeonId;
  gmRenderScenes();gmRenderItems();gmRenderScript();gmRenderNPCs();gmRenderMech();gmRenderInh();gmRenderFlags();gmRenderAutoplay();
}
function gmRenderScenes(){
  var el=document.getElementById('gm-scene-list');
  if(!document.getElementById('game-screen').classList.contains('active')){
    el.innerHTML='<div class="gm-note" style="padding:.5rem 0">請先進入遊戲。場景跳轉僅限當前門扉內使用。</div>';
    return;
  }
  var keys=Object.keys(SCENES||{});
  el.innerHTML=keys.map(function(k){
    var sc=SCENES[k];
    var label=k+(sc&&sc.roomName?'  ·  '+sc.roomName:'');
    return '<button class="gm-btn" onclick="gmGoScene(\''+k+'\')">'+label+'</button>';
  }).join('');
}
function gmGoScene(id){
  if(!document.getElementById('game-screen').classList.contains('active')){
    showToast('請先進入遊戲再使用場景跳轉');
    return;
  }
  if(SCENES[id]){
    goToScene(id);
  }else{
    showToast('場景ID不存在：'+id);
  }
}
function gmGoSceneManual(){
  var v=document.getElementById('gm-jump-input').value.trim();
  if(v)gmGoScene(v);
}
function gmRenderItems(){
  var el=document.getElementById('gm-item-list');
  el.innerHTML=GM_ITEMS.map(function(it){
    return '<button class="gm-btn" onclick="gmGiveItem(\''+it.id+'\',\''+it.name+'\')">'+it.name+' <span style="color:var(--text-dim);font-size:.65rem">'+it.id+'</span></button>';
  }).join('');
}
function gmGiveItem(id,name){
  if(!state)return;
  addItem(id,name,'GM 給予');
  showToast('已給予 '+name);
}
function gmGiveManual(){
  var id=document.getElementById('gm-item-id').value.trim();
  var name=document.getElementById('gm-item-name').value.trim();
  if(id&&name){gmGiveItem(id,name);document.getElementById('gm-item-id').value='';document.getElementById('gm-item-name').value='';}
}
function gmRenderScript(){
  var keys=Object.keys(SCENES||{});
  var el=document.getElementById('gm-script-list');
  el.innerHTML=keys.map(function(k){
    var sc=SCENES[k];
    var txt=(sc&&sc.text?sc.text:[]).map(function(p){return '<p>'+p+'</p>';}).join('');
    return '<div class="gm-script-block"><div class="gm-script-id">'+k+(sc&&sc.roomName?' · '+sc.roomName:'')+'</div><div class="gm-script-text">'+txt+'</div></div>';
  }).join('');
}
function gmRenderNPCs(){
  document.getElementById('gm-npc-list').innerHTML=GM_NPCS.map(function(n){
    return '<div class="gm-npc"><div class="gm-npc-name">'+n.name+'</div><div class="gm-npc-desc">'+n.desc+'</div></div>';
  }).join('');
}
function gmRenderMech(){
  document.getElementById('gm-mech-text').innerHTML=GM_MECH.map(function(m){return '<p style="margin-bottom:.6rem">'+m+'</p>';}).join('');
}
function gmRenderInh(){
  var inh=loadInheritance();
  var el=document.getElementById('gm-inh-list');
  el.innerHTML=Object.keys(DEFAULT_INHERITANCE).map(function(k){
    var on=!!inh[k];
    var label=INHERIT_LABELS[k]||k;
    return '<div class="gm-inh-row"><div><div class="gm-inh-name">'+label+'</div><div class="gm-inh-key">'+k+'</div></div><div class="gm-toggle'+(on?' on':'')+'" onclick="gmToggleInh(\''+k+'\')"></div></div>';
  }).join('');
}
function gmToggleInh(k){
  var inh=loadInheritance();
  inh[k]=!inh[k];
  saveInheritance(inh);
  if(state)state.inheritance=inh;
  gmRenderInh();
  updateInheritanceDisplay();
}
/* 運行時 state.flags 切換 */
var GM_COMMON_FLAGS=[
  'golden_key','mirror_defeated','basement_knowledge','traded_admin','trusted','lost_limb','admin_guest',
  'password_solved','puzzle1_done','puzzle2_done','puzzle3_done','puzzle4_done',
  'diary_found','your_book_found','exit_location','forbidden_open','yuanyuan_photo',
  'nurse_escaped','nurse_defeated','chase_started','elevator_used',
  'explored_lobby','explored_pharmacy','explored_backroom','explored_internal','explored_storage',
  'explored_surgery','explored_surgery_deep','explored_icu','explored_ward','explored_director','explored_morgue','explored_or',
  'yuanyuan_died','yuanyuan_waited','memory_viewed','full_truth','director_letter'
];
function gmRenderFlags(){
  var el=document.getElementById('gm-flag-list');
  if(!el)return;
  var flags=(state&&state.flags)||{};
  var keys=Object.keys(flags);
  GM_COMMON_FLAGS.forEach(function(k){if(keys.indexOf(k)===-1)keys.push(k);});
  keys.sort();
  el.innerHTML=keys.map(function(k){
    var on=!!flags[k];
    return '<div class="gm-inh-row"><div><div class="gm-inh-name">'+k+'</div></div><div class="gm-toggle'+(on?' on':'')+'" onclick="gmToggleFlag(\''+k+'\')"></div></div>';
  }).join('')||'<div class="gm-sub">當前沒有旗標（先踏入門扉）</div>';
}
function gmToggleFlag(k){
  if(!state)return;
  state.flags[k]=!state.flags[k];
  gmRenderFlags();
  showToast(k+' = '+(state.flags[k]?'true':'false'));
}
/* GM自動跳過開關 */
window.gmAutoSkip=false;
function gmToggleAutoSkip(){
  window.gmAutoSkip=!window.gmAutoSkip;
  var btn=document.getElementById('gm-autoskip-btn');
  if(btn)btn.textContent='自動跳過：'+(window.gmAutoSkip?'開':'關');
  showToast('自動跳過已'+(window.gmAutoSkip?'開啟':'關閉'));
}
function gmUnlockAll(){
  ['wuxian-first-cleared','wuxian-second-cleared','wuxian-third-cleared','wuxian-fourth-cleared','wuxian-fifth-cleared','wuxian-sixth-cleared'].forEach(function(k){
    safeSet(k,'true');
  });
  if(typeof render==='function'&&document.getElementById('hub-screen').classList.contains('show'))render();
  showToast('已解鎖全部門扉');
}
/* ===== GM 自動遊玩：選擇結局後自動沿路徑遊玩 ===== */
var gmAutoPlaying=false,gmAutoPath=null,gmAutoStep=0,gmAutoTimer=null;
function gmGetEndingList(){
  var list=[];
  Object.keys(SCENES||{}).forEach(function(k){
    var sc=SCENES[k];
    if(!sc)return;
    var isEnding=false,title='',reward='';
    /* 結局場景：onEnter 裡有 triggerEnding，或場景ID以 ending_ 開頭 */
    if(k.indexOf('ending_')===0)isEnding=true;
    if(sc.onEnter&&sc.onEnter.toString().indexOf('triggerEnding')>-1)isEnding=true;
    if(sc.onEnter){
      var m=sc.onEnter.toString().match(/triggerEnding\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]/);
      if(m){title=m[2];reward=m[3];}
    }
    if(isEnding){
      list.push({id:k,title:title||(sc.sceneId||k),roomName:sc.roomName||'',reward:reward});
    }
  });
  return list;
}
function gmRenderAutoplay(){
  var el=document.getElementById('gm-autoplay-list');
  if(!el)return;
  if(!document.getElementById('game-screen').classList.contains('active')){
    el.innerHTML='<div class="gm-note" style="padding:.5rem 0">請先進入遊戲再使用自動遊玩。</div>';
    return;
  }
  var list=gmGetEndingList();
  if(!list.length){el.innerHTML='<div class="gm-note">未找到結局場景。</div>';return;}
  el.innerHTML=list.map(function(e){
    return '<button class="gm-btn" onclick="gmAutoPlayStart(\''+e.id+'\')">'+e.title+' <span style="color:var(--text-dim);font-size:.65rem">'+e.id+'</span>'+(e.reward?' <span style="color:var(--accent-dim);font-size:.6rem">'+e.reward+'</span>':'')+'</button>';
  }).join('');
}
function gmFindPathTo(targetId){
  var start=state.currentScene;
  if(start===targetId)return [start];
  var queue=[[start]],visited={};visited[start]=true;
  var guard=0;
  while(queue.length&&guard<5000){
    guard++;
    var path=queue.shift();
    var cur=path[path.length-1];
    var sc=SCENES[cur];if(!sc)continue;
    var choices=sc.choices||[];
    for(var i=0;i<choices.length;i++){
      var c=choices[i];
      if(!c.next||!SCENES[c.next]||c.useless)continue;
      if(visited[c.next])continue;
      visited[c.next]=true;
      var np=path.concat([c.next]);
      if(c.next===targetId)return np;
      queue.push(np);
    }
  }
  return null;
}
function gmAutoPlayStart(targetId){
  if(gmAutoPlaying){showToast('自動遊玩進行中，請先停止');return;}
  if(!document.getElementById('game-screen').classList.contains('active')){showToast('請先進入遊戲');return;}
  var path=gmFindPathTo(targetId);
  if(!path){showToast('找不到通往該結局的路徑，請先跳轉到更接近的場景');return;}
  gmAutoPlaying=true;gmAutoPath=path;gmAutoStep=0;
  window.gmAutoSkip=true;
  document.getElementById('gm-autoplay-stop').style.display='inline-block';
  gmAutoPlayNext();
}
function gmAutoPlayNext(){
  if(!gmAutoPlaying)return;
  var statusEl=document.getElementById('gm-autoplay-status');
  if(gmAutoStep>=gmAutoPath.length){
    gmAutoPlayStop();
    if(statusEl)statusEl.textContent='已到達結局';
    showToast('自動遊玩完成');
    return;
  }
  var targetScene=gmAutoPath[gmAutoStep];
  if(statusEl)statusEl.textContent='進度：'+(gmAutoStep+1)+'/'+gmAutoPath.length+' → '+targetScene;
  /* 如果當前已經是目標場景，直接下一步 */
  if(state.currentScene===targetScene){
    gmAutoStep++;
    gmAutoTimer=setTimeout(gmAutoPlayNext,600);
    return;
  }
  /* 優先嘗試點擊對應選項；找不到則直接跳轉 */
  var sc=SCENES[state.currentScene];
  var choiceIdx=-1;
  if(sc&&sc.choices){
    for(var i=0;i<sc.choices.length;i++){
      if(sc.choices[i].next===targetScene){choiceIdx=i;break;}
    }
  }
  if(choiceIdx>=0){
    var btns=document.querySelectorAll('#choices .choice-btn');
    if(btns[choiceIdx]&&btns[choiceIdx].style.display!=='none'){
      btns[choiceIdx].click();
    }else{
      goToScene(targetScene);
    }
  }else{
    goToScene(targetScene);
  }
  gmAutoStep++;
  gmAutoTimer=setTimeout(gmAutoPlayNext,700);
}
function gmAutoPlayStop(){
  gmAutoPlaying=false;
  if(gmAutoTimer){clearTimeout(gmAutoTimer);gmAutoTimer=null;}
  window.gmAutoSkip=false;
  var btn=document.getElementById('gm-autoplay-stop');
  if(btn)btn.style.display='none';
  var statusEl=document.getElementById('gm-autoplay-status');
  if(statusEl)statusEl.textContent='已停止';
}
function gmResetAll(){
  showConfirm('確定清除所有存檔？此操作不可恢復。',function(){
    doWipeAllSaves();
    showToast('存檔已重置');
  },'重置存檔');
}
/* 雙重確認：從暫停菜單觸發 */
function clearAllSaves(){
  showConfirm('確定要清除全部存檔嗎？所有通關記錄、繼承、成就都會消失。',function(){
    closePause();
    doWipeAllSaves();
    showToast('全部存檔已清除');
    if($('hub-screen').classList.contains('show'))render();
  },'清除全部存檔');
}
function doWipeAllSaves(){
  var keys=[];
  for(var i=0;i<localStorage.length;i++){
    var k=localStorage.key(i);
    if(k&&(k.indexOf('wuxian')===0||/-save(-\d+|-auto)$/.test(k)))keys.push(k);
  }
  ['prime-hotel-save','silent-library-save','countdown-hospital-save','infinite-core-save','v5-tide-save','v53-observatory-save'].forEach(function(p){
    for(var n=1;n<=3;n++){keys.push(p+'-'+n);keys.push(p+'-auto');}
  });
  keys.forEach(function(k){try{localStorage.removeItem(k);}catch(e){}});
}

/* ===== P2-9：存檔匯出 / 匯入 ===== */
function exportSaves(){
  try{
    var data={version:SAVE_VERSION,exportedAt:new Date().toISOString(),saves:{},meta:{}};
    /* 動態盤點 localStorage：所有存檔槽（含第四扇門 infinite-core-save）與 wuxian-* 進度。
       不再寫死三扇門前綴，避免新門扉存檔、碎片、稱號、已讀場景等進度在匯出時遺漏。 */
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);if(!k)continue;
      var v=localStorage.getItem(k);if(!v)continue;
      if(/-save(-\d+|-auto)$/.test(k)){ data.saves[k]=v; }
      else if(k.indexOf('wuxian')===0){ data.meta[k]=v; }
    }
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='wuxian_saves_'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('存檔已匯出為 JSON');
  }catch(e){showToast('匯出失敗');}
}
function importSaves(e){
  var file=e.target.files[0];
  if(!file)return;
  showConfirm('匯入存檔將覆蓋目前所有進度，確定繼續？',function(){
  var reader=new FileReader();
  reader.onload=function(ev){
    try{
      var data=JSON.parse(ev.target.result);
      if(!data||!data.saves)throw new Error('格式錯誤');
      var count=0;
      for(var k in data.saves){if(data.saves[k]){localStorage.setItem(k,data.saves[k]);count++;}}
      if(data.meta){for(var mk in data.meta){if(data.meta[mk])localStorage.setItem(mk,data.meta[mk]);}}
      showToast('已匯入 '+count+' 個存檔，即將重新整理');
      setTimeout(function(){location.reload();},1200);
    }catch(err){showToast('匯入失敗：檔案格式錯誤');}
  };
  reader.readAsText(file);
  e.target.value='';
  },'匯入存檔');
}

function gmLock(){
  window._gmUnlocked=false;
  try{localStorage.removeItem('wuxian_gm_unlocked');}catch(e){}
  document.getElementById('gm-bar').style.display='none';
  updateGmOnlyButtons();
  gmClosePanel();
}
/* GM專用UI按鈕顯示切換 */
function updateGmOnlyButtons(){
  var btns=document.querySelectorAll('.gm-only-btn');
  btns.forEach(function(b){b.style.display=window._gmUnlocked?'':'none';});
}
/* --- 開啟序列 --- */
var gmSeqPending=false;
var gmSeqStep=0; /* 0=idle, 1=expect above×2, 2=expect below×2 */
var gmSeqAbove=0,gmSeqBelow=0;
function gmBindUnlock(){
  /* 僅保留點擊標題序列作為唯一解鎖途徑 */
}
/* A: 快速點標題/門扉卡片五次 → 點上方兩次 → 點下方兩次 → 密碼 */
(function(){
  try{
  var triggers=document.querySelectorAll('.series-title,.dungeon-card');
  if(!triggers.length)return;
  var clicks=0,resetT=null,activeTitle=null;
  function isTrigger(el){
    while(el&&el!==document.body){
      if(el.classList&&(el.classList.contains('series-title')||el.classList.contains('dungeon-card')))return true;
      el=el.parentNode;
    }
    return false;
  }
  function microFlash(el){
    if(!el)return;
    var orig=el.style.opacity;
    el.style.transition='opacity .08s';
    el.style.opacity='0.5';
    setTimeout(function(){el.style.opacity=orig;},80);
  }
  triggers.forEach(function(title){
    title.style.userSelect='none';
    title.style.webkitUserSelect='none';
    title.addEventListener('pointerdown',function(e){
      if(e.target.tagName==='BUTTON')return;
      e.stopPropagation();
      activeTitle=title.classList.contains('dungeon-card')?title.querySelector('.dungeon-name')||title:title;
      clicks++;
      /* 不做任何視覺反饋，保持元素固定不動 */
      clearTimeout(resetT);
      resetT=setTimeout(function(){clicks=0;},3000);
      if(clicks>=5){
        clicks=0;
        gmSeqPending=true;gmSeqStep=1;gmSeqAbove=0;gmSeqBelow=0;
      }
    });
  });
  ['hub-title-screen','split-overlay','hub-screen'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el)return;
    el.addEventListener('pointerdown',function(e){
      if(!gmSeqPending)return;
      if(isTrigger(e.target))return;
      var t=activeTitle||document.querySelector('.series-title,.dungeon-name');
      if(!t)return;
      var titleRect=t.getBoundingClientRect();
      var titleMidY=titleRect.top+titleRect.height/2;
      var clickY=e.clientY;
      if(gmSeqStep===1){
        if(clickY<titleMidY){
          gmSeqAbove++;
          if(gmSeqAbove>=2){gmSeqStep=2;gmSeqBelow=0;}
        }else{
          gmSeqAbove=0;gmSeqStep=1;
        }
      }else if(gmSeqStep===2){
        if(clickY>titleMidY){
          gmSeqBelow++;
          if(gmSeqBelow>=2){
            gmSeqPending=false;gmSeqStep=0;
            if(window._gmUnlocked){gmLock();}
            else{gmShowPassword();}
          }
        }else{
          gmSeqBelow=0;gmSeqStep=2;
        }
      }
    });
  });
  }catch(err){console.error('GM unlock init error:',err);}
})();
gmBindUnlock();

/* 通行碼 Enter 提交 */
document.getElementById('gm-pw-input').addEventListener('keydown',function(e){
  if(e.key==='Enter')gmSubmitPassword();
});

/* 開場分屏的「進入迴廊」按鈕：裂開分屏，露出主標題畫面 */
/* 金色切割線動畫：畫線（內容同步從左到右被遮擋）→分屏（線分裂成兩條跟隨上下半屏）→完成後回調 */
function playCutLineAndSplit(so, cb){
  /* 開始畫線：金色線從左到右增長，標題內容同步從左到右被位置遮擋 */
  so.classList.add('drawing');
  /* 畫線完成，內容全部被遮擋，開始分屏（C類：trTime倍率） */
  setTimeout(function(){
    so.classList.add('open');
    /* 分屏動畫完成，清理並回調 */
    setTimeout(function(){
      so.classList.remove('active','open','drawing','no-title');
      if(cb)cb();
    },trTime(1400));
  },trTime(800));
}
/* 開場動畫的「進入迴廊」按鈕：在遮蓋下直接進入第一扇門 */
function splitSkipAndEnter(){
  var so=document.getElementById('split-overlay');
  if(!so||!so.classList.contains('active'))return;
  if(window._openingDone)return;
  window._openingDone=true;
  if(window._openingTimers)window._openingTimers.forEach(clearTimeout);
  so.classList.add('no-title');
  /* 在分屏遮蓋下先切換到門扉選擇畫面 */
  doEnterHub();
  /* 金色切割線→分屏→露出門扉選擇 */
  playCutLineAndSplit(so);
}
/* 開場標題頁的「設置」按鈕：鋸齒動畫後打開設置面板 */
function openSettingsFromTitle(){
  var so=document.getElementById('split-overlay');
  if(!so||!so.classList.contains('active'))return;
  if(window._openingDone)return;
  window._openingDone=true;
  window._returnToTitleAfterSettings=true;
  if(window._openingTimers)window._openingTimers.forEach(clearTimeout);
  so.classList.add('no-title');
  /* 在遮蓋下打開設置面板 */
  openSettings();
  /* 金色切割線→分屏→露出設置面板 */
  playCutLineAndSplit(so);
}
/* ===== 開場動畫：頁面載入自動播放，標題淡入，按鈕升起 ===== */
(function playOpeningAnimation(){
  var so=document.getElementById('split-overlay');
  var topEl=so?so.querySelector('.split-top'):null;
  var botEl=so?so.querySelector('.split-bottom'):null;
  if(!so||!topEl||!botEl)return;
  window._openingDone=false;
  window._openingTimers=[];
  /* 立刻分屏遮蓋，應用鋸齒 */
  topEl.style.clipPath=buildZigzagClip(true);
  botEl.style.clipPath=buildZigzagClip(false);
  setZigzagLines();
  so.classList.remove('open');
  so.classList.add('active');
  void so.offsetWidth;
  /* 設置標題頁版本顯示 */
  var verEl=document.getElementById('title-version');
  if(verEl)verEl.textContent='v '+getVersionDisplay();
  /* 10秒後自動進入（如果用戶沒點按鈕） */
  window._openingTimers.push(setTimeout(splitSkipAndEnter,10000));
})();
