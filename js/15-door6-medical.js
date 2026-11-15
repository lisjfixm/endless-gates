
(function(){
'use strict';

/* ============================================================================
 * 模組一：存檔版本 3.0、常數與通用工具（Section 8.1–8.3）
 * ============================================================================ */
var LS_PINNED       = 'wuxian-v59-pinned-items';
var LS_ENCHANTED    = 'wuxian-v59-enchanted-items';
var LS_COMBAT_WINS  = 'wuxian-v59-combat-wins';
var LS_JIGSAW_DONE  = 'wuxian-v59-jigsaw-done';
var LS_BUFFET_SEEN  = 'wuxian-v59-buffet-300';
var LS_MOVIES_SEEN  = 'wuxian-v59-movies-seen';
var LS_ANIMALS_FED  = 'wuxian-v59-animals-fed';
var LS_STREAK       = 'wuxian-v59-daily-streak';
var LS_COMPANION    = 'wuxian-v59-start-companion';

function v59Get(k, def){
  try{
    var r = localStorage.getItem(k);
    return r ? JSON.parse(r) : def;
  }catch(e){ return def; }
}
function v59Set(k, val){
  try{ localStorage.setItem(k, JSON.stringify(val)); }catch(e){}
}

function getPinnedItems(){ return v59Get(LS_PINNED, []); }
function isItemPinned(id){ return getPinnedItems().indexOf(id) !== -1; }
function togglePinItem(id, name){
  var arr = getPinnedItems();
  var idx = arr.indexOf(id);
  if(idx === -1){ arr.push(id); showToast('已將「' + (name||id) + '」釘選置頂'); }
  else { arr.splice(idx, 1); showToast('已取消「' + (name||id) + '」置頂'); }
  v59Set(LS_PINNED, arr);
  if(typeof updateInventoryUI === 'function') updateInventoryUI();
}

function getEnchantedItems(){ return v59Get(LS_ENCHANTED, []); }
function isItemEnchanted(id){ return getEnchantedItems().indexOf(id) !== -1; }
function enchantItem(id, name){
  if(isItemEnchanted(id)){ showToast('此物品已完成附魔'); return false; }
  var shards = (typeof getMemoryShards === 'function') ? getMemoryShards() : 6;
  if(shards < 2){ showToast('記憶碎片不足（附魔需要 2 枚記憶碎片）'); return false; }
  if(typeof addMemoryShards === 'function') addMemoryShards(-2);
  var arr = getEnchantedItems();
  arr.push(id);
  v59Set(LS_ENCHANTED, arr);
  unlockAchievement('ach_v59_enchant');
  showToast('附魔成功：「' + (name||id) + '」獲得永久迴廊祝福（照亮黑暗／強化效果）');
  if(typeof updateInventoryUI === 'function') updateInventoryUI();
  return true;
}

/* ============================================================================
 * 模組二：第十扇門《潮汐電影院》(Tidal Cinema)（Section 1.1）
 * ============================================================================ */
var ACH_D10 = [
  {id:'ach_d10_enter',       name:'午夜早場票',   desc:'踏入第十扇門「潮汐電影院」'},
  {id:'ach_d10_no_lookback', name:'絕不回頭',     desc:'在 A 廳驚悚片全程遵守「不能回頭」規則生還'},
  {id:'ach_d10_confess',     name:'銀幕告白者',   desc:'在 B 廳愛情片完成真心告白並取得膠卷'},
  {id:'ach_d10_critic',      name:'滿分影評人',   desc:'在影評人評分達到 95 分以上完成潮汐電影院'},
  {id:'ach_d10_cinephile',   name:'資深影迷',     desc:'看完 A/B/C/D 四部電影並解鎖真結局「資深影迷」'}
];

function recordMovieWatched(hallKey){
  var seen = v59Get(LS_MOVIES_SEEN, []);
  if(seen.indexOf(hallKey) === -1){
    seen.push(hallKey);
    v59Set(LS_MOVIES_SEEN, seen);
  }
  if(seen.length >= 4){
    unlockAchievement('ach_v59_all_movies');
  }
}

V5.registerDungeon({
  id: 10,
  index: '第 十 扇 門',
  name: '潮汐電影院',
  roomNum: 'FILM',
  bgNum: '24mm',
  clearedKey: 'wuxian-tenth-cleared',
  savePrefix: 'v59-cinema-save',
  startScene: 'd10_prologue',
  subText: '午 夜 膠 卷 · 第 十 扇 門',
  ruleText: '電 影 裡 的 規 則 ， 就 是 你 的 現 實',
  hasParty: true,
  hasCountdown: false,
  hasAdmin: false,
  achDefs: ACH_D10,
  totalEndings: 12,
  unlock: function(){ return true; },
  tagline: '午夜十二點的地下電影院，每張票根都會把你送進一部正在放映的電影。驚悚廳不能回頭、愛情廳必須告白、武俠廳必須拔刀、科幻廳必須解開因果。',

  bgAnimation: function(){
    if(bgNumTimer){ clearInterval(bgNumTimer); bgNumTimer = null; }
    var el = $('bg-num'); if(!el) return;
    el.classList.remove('float');
    if(SETTINGS.bgAnim === false || SETTINGS.reducedMotion){ el.textContent = 'FILM'; return; }
    var seq = ['24fps', 'HALL-A', 'HALL-B', 'HALL-C', 'HALL-D', '03:17'];
    var i = 0; el.textContent = seq[i];
    bgNumTimer = setInterval(function(){ i = (i + 1) % seq.length; el.textContent = seq[i]; }, 1900);
  },

  stateInit: function(){
    return {
      currentScene: 'd10_prologue',
      inventory: [],
      flags: {moviesCleared: 0},
      hp: 100, maxHp: 100,
      criticScore: 80,
      stress: 0,
      party: 3,
      textIndex: 0,
      puzzleCallback: null, puzzleAnswer: null, puzzleAttempts: 0,
      inheritance: (typeof loadInheritance === 'function') ? loadInheritance() : {},
      notes: [], history: [],
      personality: {calm:50, altruism:50, cautious:50},
      mapZones: [
        {id:'d10_lobby', name:'售票大廳·霓虹廊', explored:true,  current:true,  scene:'d10_hub',    summary:'售票員林默在玻璃窗後微笑，清潔工老陳正在清掃發光的爆米花。'},
        {id:'d10_halla', name:'A 廳·驚悚片《背後有人》', explored:false, current:false, scene:'d10_hall_a', summary:'規則：絕對不能回頭。'},
        {id:'d10_hallb', name:'B 廳·愛情片《潮水退去之前》', explored:false, current:false, scene:'d10_hall_b', summary:'規則：必須說出真心告白。'},
        {id:'d10_hallc', name:'C 廳·武俠片《斷刀客》', explored:false, current:false, scene:'d10_hall_c', summary:'規則：拔刀迎戰，退縮即死。'},
        {id:'d10_halld', name:'D 廳·科幻片《第0317次因果》', explored:false, current:false, scene:'d10_hall_d', summary:'規則：校準光束與邏輯悖論。'},
        {id:'d10_booth', name:'頂層放映室', explored:false, current:false, scene:'d10_projection', summary:'四部膠卷匯聚的終極剪輯台。'}
      ]
    };
  },

  buildScenes: function(){
    function modCritic(delta, msg){
      state.criticScore = Math.max(0, Math.min(100, (state.criticScore != null ? state.criticScore : 80) + delta));
      if(msg) appendNarrative('<p class="system-msg">【影評人評分 ' + (delta>=0?'+':'') + delta + '】當前評分：' + state.criticScore + ' / 100（' + msg + '）</p>');
      if(state.criticScore >= 95) unlockAchievement('ach_d10_critic');
      if(window.V58 && V58.updateHUD) V58.updateHUD();
    }

    SCENES.d10_prologue = {
      room:'票', roomName:'潮汐電影院 · 午夜售票處', sceneId:'10-序章', mood:'mystery',
      onEnter: function(){ unlockAchievement('ach_d10_enter'); },
      text:[
        '<p>潮水般的膠卷轉動聲從地底傳來。你站在「潮汐電影院」復古的紅絨布大廳中央，頭頂的燈箱寫著四行鮮紅的排片表：</p>',
        '<p class="narration">【A 廳 · 驚悚片《背後有人》：觀影期間嚴禁回頭】<br>【B 廳 · 愛情片《潮水退去之前》：散場前必須完成告白】<br>【C 廳 · 武俠片《斷刀客》：江湖恩怨，必須拔刀應戰】<br>【D 廳 · 科幻片《第 0317 次因果》：唯有邏輯能解開光束悖論】</p>',
        '<p>銅窗後的<strong>售票員林默</strong>抬起頭，帽簷下是一雙沒有瞳孔的銀幕眼睛：「先生，午夜場一旦進場，電影裡的規則就是你的現實。如果中途離場，影評人會扣除你的評分——低於零分的人，會被剪進廢片桶裡。」</p>'
      ],
      choices:[
        {text:'走進售票大廳，觀察三名影院人物與四座影廳入口', next:'d10_hub'}
      ]
    };

    SCENES.d10_hub = {
      room:'廳', roomName:'潮汐電影院 · 中央紅絨走廊', sceneId:'10-大廳', mood:'safe',
      npcs:['cinema_seller', 'cinema_cleaner', 'cinema_ghost'],
      onEnter: function(){
        if(state.mapZones){ state.mapZones[0].explored = true; state.mapZones[0].current = true; }
      },
      text:[
        '<p>大廳地毯散發著海鹽與焦糖爆米花的氣味。<strong>售票員林默</strong>故意把你點的票根換成別廳的票；<strong>清潔工老陳</strong>拄著掃帚低聲提醒你：「別被銀幕騙了，只有集齊四廳的片尾膠卷，才看得見真正的出口。」</p>',
        '<p>而在走廊長椅上，<strong>鄰座觀眾沈影</strong>半透明的身影正翻看著一本破舊的《午夜場影評手冊》。</p>'
      ],
      choices:[
        {text:'向售票員要「B廳票」（逆向規則：獲得 A廳《背後有人》驚悚票並進場）', action:function(){
          addItem('ticket_hall_a', 'A廳午夜票根', '印著「背後有人 · 嚴禁回頭」的血紅票根。');
          goToScene('d10_hall_a');
        }},
        {text:'向售票員要「A廳票」（逆向規則：獲得 B廳《潮水退去之前》愛情票並進場）', action:function(){
          addItem('ticket_hall_b', 'B廳午夜票根', '印著「潮水退去之前 · 必須告白」的藍調票根。');
          goToScene('d10_hall_b');
        }},
        {text:'進入 C 廳 · 武俠片《斷刀客》（規則：必須打架／拔刀迎戰）', next:'d10_hall_c'},
        {text:'進入 D 廳 · 科幻片《第 0317 次因果》（規則：邏輯與反射謎題）', next:'d10_hall_d'},
        {text:'前往頂層「放映室」（查看結算與結局分歧）', next:'d10_projection'}
      ]
    };

    SCENES.d10_hall_a = {
      room:'A廳', roomName:'A 廳 · 驚悚片《背後有人》', sceneId:'10-A廳', mood:'terror',
      npcs:['cinema_ghost'],
      onEnter: function(){
        if(state.mapZones) state.mapZones[1].explored = true;
      },
      text:[
        '<p>銀幕亮起慘白的光，畫面裡正是你此刻坐著的第 7 排座位。冰冷的呼吸聲貼在你的後頸上，耳邊傳來熟悉的聲音：「陸衍，你掉了一把鑰匙在後面，回頭看看呀……」</p>',
        '<p>鄰座觀眾沈影死死抓住你的手腕：「別回頭！驚悚片的鐵則是——回頭的人會立刻成為第一個死者！」</p>'
      ],
      choices:[
        {text:'【遵守規則】死死盯住前方銀幕，利用手錶玻璃反光確認身後並熬到片尾字幕', action:function(){
          state.flags.d10_hall_a_cleared = true;
          recordMovieWatched('A');
          unlockAchievement('ach_d10_no_lookback');
          addItem('reel_a', 'A廳片尾膠卷', '記錄著驚悚片生還畫面的 35mm 膠卷（稀有）。');
          modCritic(10, '完整看完 A 廳驚悚片並完美遵守規則');
          goToScene('d10_hub');
        }},
        {text:'【中途離場】推開安全門逃回大廳（影評人評分 -25）', action:function(){
          state.flags.d10_walked_out = true;
          modCritic(-25, '中途逃離 A 廳，影評人對你的膽怯大失所望');
          if(state.criticScore <= 0){ goToScene('d10_end_walkout'); return; }
          goToScene('d10_hub');
        }},
        {text:'【違反規則】忍不住轉過頭去看身後的人影', next:'d10_end_lookback'}
      ]
    };

    SCENES.d10_hall_b = {
      room:'B廳', roomName:'B 廳 · 愛情片《潮水退去之前》', sceneId:'10-B廳', mood:'mystery',
      onEnter: function(){
        if(state.mapZones) state.mapZones[2].explored = true;
      },
      text:[
        '<p>銀幕上是黃昏的海堤，海風吹起白連帽衫的衣角。電影的女主角轉過身看著你，眼神與第一扇門的蘇晚如出一轍。</p>',
        '<p>字幕浮現：【規則提示：在潮水完全退去前，主角必須說出那句從未說出口的真心話，否則本片將永遠卡在遺憾的死循環。】</p>'
      ],
      choices:[
        {text:'【遵守規則 · 真心告白】「無論門後還有多少次輪迴，我都想和妳一起去吃巷口那碗陽春麵。」', action:function(){
          state.flags.d10_hall_b_cleared = true;
          recordMovieWatched('B');
          unlockAchievement('ach_d10_confess');
          addItem('reel_b', 'B廳片尾膠卷', '記錄著海堤告白與破曉微笑的溫柔膠卷（稀有）。');
          modCritic(10, '真摯的台詞打動了全場影評人');
          goToScene('d10_hub');
        }},
        {text:'【中途離場】沉默低頭走出影廳（影評人評分 -25）', action:function(){
          state.flags.d10_walked_out = true;
          modCritic(-25, '在愛情片高潮處逃避離場');
          if(state.criticScore <= 0){ goToScene('d10_end_walkout'); return; }
          goToScene('d10_hub');
        }},
        {text:'【違反規則】到了劇終仍一言不發，任由海浪吞沒台詞', next:'d10_end_unspoken'},
        {text:'【隱藏分歧】放棄回到現實，永遠留在這部溫柔的電影裡', next:'d10_end_eternal_screen'}
      ]
    };

    SCENES.d10_hall_c = {
      room:'C廳', roomName:'C 廳 · 武俠片《斷刀客》', sceneId:'10-C廳', mood:'danger',
      onEnter: function(){
        if(state.mapZones) state.mapZones[3].explored = true;
      },
      text:[
        '<p>竹林夜雨傾盆而下，銀幕裡的刀光直接劈開了第四面牆！一名戴著斗笠的「膠卷刀客」從銀幕躍下舞台，刀尖直指你的咽喉。</p>',
        '<p>【C 廳鐵則：江湖路窄，唯拔刀迎戰者可活，跪地求饒者死！】</p>'
      ],
      choices:[
        {text:'【遵守規則 · 拔刀迎戰】拾起前排座椅下的道具古刀，進入「遭遇戰」正面對決！', cls:'v59-combat-choice', action:function(){
          if(window.V59 && typeof V59.openCombatEncounter === 'function'){
            V59.openCombatEncounter('film_swordsman', function(){
              state.flags.d10_hall_c_cleared = true;
              recordMovieWatched('C');
              addItem('reel_c', 'C廳片尾膠卷', '刻著竹林刀痕的武俠片尾膠卷（稀有）。');
              modCritic(15, '精彩絕倫的武打長鏡頭，影評人起立鼓掌');
              goToScene('d10_hub');
            }, function(){
              modCritic(-15, '勉強從刀光下狼狽逃生');
              goToScene('d10_hub');
            });
          } else {
            state.flags.d10_hall_c_cleared = true;
            recordMovieWatched('C');
            addItem('reel_c', 'C廳片尾膠卷', '刻著竹林刀痕的武俠片尾膠卷（稀有）。');
            modCritic(15, '正面擊敗膠卷刀客');
            goToScene('d10_hub');
          }
        }},
        {text:'【中途離場】棄刀翻出窗外逃離（影評人評分 -25）', action:function(){
          state.flags.d10_walked_out = true;
          modCritic(-25, '武俠片臨陣脫逃，遭到全場喝倒彩');
          if(state.criticScore <= 0){ goToScene('d10_end_walkout'); return; }
          goToScene('d10_hub');
        }},
        {text:'【違反規則】丟下武器束手就擒', next:'d10_end_coward'}
      ]
    };

    SCENES.d10_hall_d = {
      room:'D廳', roomName:'D 廳 · 科幻片《第 0317 次因果》', sceneId:'10-D廳', mood:'tension',
      onEnter: function(){
        if(state.mapZones) state.mapZones[4].explored = true;
      },
      text:[
        '<p>D 廳是一座環形太空艙銀幕。畫面中央的量子放映機因為鏡片偏折而陷入無限時間迴圈。</p>',
        '<p>清潔工老陳在門邊提醒：「科幻片講究的是嚴密邏輯。你必須調整反射鏡的角度，把放映光束導引到終點接收器，才能讓時間從 03:17 跨入 03:18。」</p>'
      ],
      choices:[
        {text:'【遵守規則 · 反射謎題】啟動光學反射鏡校準儀，導引光線破除因果悖論', action:function(){
          if(window.V59 && typeof V59.openPuzzleModal === 'function'){
            V59.openPuzzleModal('mirror_beam', function(){
              state.flags.d10_hall_d_cleared = true;
              recordMovieWatched('D');
              addItem('reel_d', 'D廳片尾膠卷', '閃爍著量子藍光的科幻片尾膠卷（稀有）。');
              modCritic(15, '以無懈可擊的邏輯解開科幻廳光束謎題');
              goToScene('d10_hub');
            });
          } else {
            state.flags.d10_hall_d_cleared = true;
            recordMovieWatched('D');
            addItem('reel_d', 'D廳片尾膠卷', '閃爍著量子藍光的科幻片尾膠卷（稀有）。');
            modCritic(15, '完成光束校準');
            goToScene('d10_hub');
          }
        }},
        {text:'【中途離場】放棄解謎走出 D 廳（影評人評分 -25）', action:function(){
          state.flags.d10_walked_out = true;
          modCritic(-25, '看不懂硬核科幻片而中途退場');
          if(state.criticScore <= 0){ goToScene('d10_end_walkout'); return; }
          goToScene('d10_hub');
        }},
        {text:'【違反規則】強行扯斷量子放映機電源線', next:'d10_end_paradox'}
      ]
    };

    SCENES.d10_projection = {
      room:'映', roomName:'潮汐電影院 · 頂層放映室', sceneId:'10-放映室', mood:'safe',
      npcs:['cinema_cleaner', 'cinema_seller'],
      onEnter: function(){
        if(state.mapZones) state.mapZones[5].explored = true;
      },
      text:[
        '<p>你推開頂層放映室的鐵門。老舊的雙機放映機正嗡嗡運轉，窗外能看見清晨六點即將破曉的城市天際線。</p>',
        '<p>清潔工老陳摘下帽子，露出溫和的笑容：「你手裡的膠卷與影評人評分，決定了這部名為《無盡之門》的電影將如何落幕。」</p>'
      ],
      choices:[
        {text:'【真結局 · 資深影迷】將 A/B/C/D 四部片尾膠卷合一放映（需四廳全通且影評分 ≥ 90）', condition:function(){
          return state.flags.d10_hall_a_cleared && state.flags.d10_hall_b_cleared && state.flags.d10_hall_c_cleared && state.flags.d10_hall_d_cleared && (state.criticScore||0) >= 90;
        }, next:'d10_end_cinephile'},
        {text:'【隱藏結局 · 導演剪輯版】持有至少 3 枚膠卷，親手在剪輯台上改寫最終字幕', condition:function(){
          var cnt = (hasItem('reel_a')?1:0)+(hasItem('reel_b')?1:0)+(hasItem('reel_c')?1:0)+(hasItem('reel_d')?1:0);
          return cnt >= 3;
        }, next:'d10_end_director'},
        {text:'【普通結局 · 早場陽光】觀看過至少 2 部電影，推開散場大門走出影院', condition:function(){
          var cnt = (state.flags.d10_hall_a_cleared?1:0)+(state.flags.d10_hall_b_cleared?1:0)+(state.flags.d10_hall_c_cleared?1:0)+(state.flags.d10_hall_d_cleared?1:0);
          return cnt >= 2;
        }, next:'d10_end_dawn'},
        {text:'【生還結局 · 剪斷膠卷】用剪刀直接剪斷主放映機膠卷逃生', next:'d10_end_cut_reel'},
        {text:'【生還結局 · 清潔工後門】跟隨清潔工老陳從員工消防梯離開', next:'d10_end_cleaner'},
        {text:'【生還結局 · 替換座位】將票根交給鄰座幽靈沈影，替他走回人間', next:'d10_end_ghost_seat'},
        {text:'返回中央紅絨走廊繼續觀影', next:'d10_hub'}
      ]
    };

    SCENES.d10_end_cinephile = {
      room:'終', roomName:'四廳全通的破曉長鏡頭', sceneId:'10-真結局', mood:'safe',
      text:['<p>四卷 35mm 膠卷在放映機上完美銜接：驚悚的勇氣、愛情的坦誠、武俠的果決與科幻的理性融為一道金色的長鏡頭。售票員林默、清潔工老陳與鄰座觀眾沈影同時向你脫帽致敬，影院大門敞開，清晨的第一縷陽光灑滿長街。</p>'],
      onEnter: function(){
        unlockAchievement('ach_d10_cinephile');
        localStorage.setItem('wuxian-tenth-cleared', 'true');
        setTimeout(function(){ triggerEnding('hidden_d10_cinephile', '資深影迷 · 破曉長鏡頭', '你完整看完了驚悚、愛情、武俠、科幻四部午夜場電影並獲得滿分影評，成為走出潮汐電影院的真正主角。', '真結局 · 資深影迷'); }, 450);
      },
      choices:[]
    };
    SCENES.d10_end_director = {
      room:'導', roomName:'剪輯台上的造物主', sceneId:'10-結局10', mood:'safe',
      text:['<p>你坐在剪輯台前，把所有的悲劇鏡頭全部剪除，接上了重逢與破曉的畫面。</p>'],
      onEnter: function(){ localStorage.setItem('wuxian-tenth-cleared', 'true'); setTimeout(function(){ triggerEnding('hidden_d10_director', '導演剪輯版：改寫字幕之人', '你集齊多部膠卷並親手改寫了電影院的最終結局。', '隱藏結局 · 導演剪輯'); }, 450); },
      choices:[]
    };
    SCENES.d10_end_eternal_screen = {
      room:'幕', roomName:'永遠停駐的海堤黃昏', sceneId:'10-結局11', mood:'safe',
      text:['<p>你沒有走出 B 廳，而是跨過銀幕邊框，走進了那片永遠不會退潮的溫柔海堤。</p>'],
      onEnter: function(){ setTimeout(function(){ triggerEnding('hidden_d10_eternal_screen', '銀幕住民：不散場的黃昏', '你選擇留在愛情片的溫柔海堤裡，與記憶中的人共度永恆。', '隱藏結局 · 銀幕住民'); }, 450); },
      choices:[]
    };
    SCENES.d10_end_dawn = {
      room:'晨', roomName:'散場後的早場陽光', sceneId:'10-結局1', mood:'safe',
      text:['<p>片尾字幕升起，燈光亮起。你握著半截票根走出地下影院，外頭已是車水馬龍的早晨。</p>'],
      onEnter: function(){ localStorage.setItem('wuxian-tenth-cleared', 'true'); setTimeout(function(){ triggerEnding('normal_d10_dawn', '散場後的早場陽光', '你遵守電影規則看完了午夜場，平安迎來散場的晨光。', '普通結局'); }, 450); },
      choices:[]
    };
    SCENES.d10_end_lookback = {
      room:'亡', roomName:'A廳：回頭的定格畫面', sceneId:'10-結局2', mood:'terror',
      text:['<p>你終究還是回了頭。銀幕上的鏡頭瞬間拉近，你的臉被永遠定格在黑白菲林的第 317 格。</p>'],
      onEnter: function(){ setTimeout(function(){ triggerEnding('bad_d10_lookback', '回頭的定格畫面', '你在 A 廳驚悚片違反了「不能回頭」的鐵則，化作銀幕上的背景。', '壞結局 · 驚悚定格'); }, 450); },
      choices:[]
    };
    SCENES.d10_end_unspoken = {
      room:'憾', roomName:'B廳：未能說出口的台詞', sceneId:'10-結局3', mood:'danger',
      text:['<p>潮水退盡，銀幕陷入漆黑。你因為始終沒有開口告白，被永遠困在了 NG 重拍的循環裡。</p>'],
      onEnter: function(){ setTimeout(function(){ triggerEnding('bad_d10_unspoken', '未能說出口的台詞', '你在 B 廳愛情片錯過了最後的告白時機，陷入無盡重拍。', '壞結局 · 遺憾重拍'); }, 450); },
      choices:[]
    };
    SCENES.d10_end_coward = {
      room:'刃', roomName:'C廳：死於刀下的路人甲', sceneId:'10-結局4', mood:'danger',
      text:['<p>在武俠片裡放棄拔刀的人，連姓名都不會出現在演職員表上。</p>'],
      onEnter: function(){ setTimeout(function(){ triggerEnding('bad_d10_coward', '死於刀下的路人甲', '你在 C 廳武俠片拒絕拔刀應戰，倒在了竹林夜雨之中。', '壞結局 · 江湖無名'); }, 450); },
      choices:[]
    };
    SCENES.d10_end_paradox = {
      room:'亂', roomName:'D廳：因果悖論抹消', sceneId:'10-結局5', mood:'terror',
      text:['<p>強行切斷量子放映機引發了因果崩塌，你的時間線被徹底擦除。</p>'],
      onEnter: function(){ setTimeout(function(){ triggerEnding('bad_d10_paradox', '因果悖論抹消', '你在 D 廳科幻片未能解開光束邏輯，被時間悖論吞噬。', '壞結局 · 因果抹消'); }, 450); },
      choices:[]
    };
    SCENES.d10_end_walkout = {
      room:'零', roomName:'零分影評人的廢片桶', sceneId:'10-結局6', mood:'danger',
      text:['<p>因為多次中途離場，你的影評人評分跌破零分。售票員嘆了口氣，將你的票根剪碎進了廢片桶。</p>'],
      onEnter: function(){ setTimeout(function(){ triggerEnding('bad_d10_walkout', '零分影評人的謝幕', '你因頻繁中途離場導致影評人評分歸零，被永遠留在廢片室。', '壞結局 · 爛片退場'); }, 450); },
      choices:[]
    };
    SCENES.d10_end_cut_reel = {
      room:'剪', roomName:'剪斷膠卷的逃生者', sceneId:'10-結局7', mood:'tension',
      text:['<p>你趁放映機過熱時剪斷主膠卷，在銀幕起火前衝出了緊急出口。</p>'],
      onEnter: function(){ localStorage.setItem('wuxian-tenth-cleared', 'true'); setTimeout(function(){ triggerEnding('survive_d10_projection', '剪斷膠卷之人', '你強行中止了午夜放映，帶著灼傷的手掌逃回地面。', '逃過結局'); }, 450); },
      choices:[]
    };
    SCENES.d10_end_ghost_seat = {
      room:'座', roomName:'7 排 G 座的傳承', sceneId:'10-結局8', mood:'mystery',
      text:['<p>你將自己的出場票送給鄰座幽靈沈影，兩人在散場的人潮中並肩走出了旋轉門。</p>'],
      onEnter: function(){ localStorage.setItem('wuxian-tenth-cleared', 'true'); setTimeout(function(){ triggerEnding('survive_d10_ghost_seat', '鄰座幽靈的同行票', '你帶上了被困在 7 排座位多年的沈影一同離開影院。', '逃過結局'); }, 450); },
      choices:[]
    };
    SCENES.d10_end_cleaner = {
      room:'梯', roomName:'清潔工的後門鑰匙', sceneId:'10-結局9', mood:'safe',
      text:['<p>老陳用掃帚柄頂開後巷鐵門：「快走吧，下一場午夜秀要開始了。」</p>'],
      onEnter: function(){ localStorage.setItem('wuxian-tenth-cleared', 'true'); setTimeout(function(){ triggerEnding('survive_d10_cleaner', '清潔工的後門鑰匙', '你在清潔工老陳的掩護下從後巷安全撤離。', '逃過結局'); }, 450); },
      choices:[]
    };
  }
});

/* ============================================================================
 * 模組三：第十一扇門《動物園 23:00》(Zoo 23:00)（Section 1.2）
 * ============================================================================ */
var ACH_D11 = [
  {id:'ach_d11_enter',    name:'閉園後的遊客',   desc:'在 23:00 踏入第十一扇門「動物園 23:00」'},
  {id:'ach_d11_panda',    name:'七歲的冰棒',     desc:'餵食熊貓「團團」並找回第一枚童年記憶碎片'},
  {id:'ach_d11_feed_all', name:'午夜飼育員',     desc:'在動物園 23:00 餵食過全部 6 個園區的動物'},
  {id:'ach_d11_beast',    name:'褪去人名之夜',   desc:'在人性值低於 25 時觸發特殊「動物結局」'},
  {id:'ach_d11_true',     name:'1999兒童半價票', desc:'找齊六枚童年記憶碎片並在午夜 12 點前保持人性達成真結局'}
];

function recordAnimalFed(zoneKey){
  var fed = v59Get(LS_ANIMALS_FED, []);
  if(fed.indexOf(zoneKey) === -1){
    fed.push(zoneKey);
    v59Set(LS_ANIMALS_FED, fed);
  }
  if(fed.length >= 6){
    unlockAchievement('ach_d11_feed_all');
    unlockAchievement('ach_v59_all_animals');
  }
}

V5.registerDungeon({
  id: 11,
  index: '第 十 一 扇 門',
  name: '動物園 23:00',
  roomNum: '23:00',
  bgNum: 'ZOO',
  clearedKey: 'wuxian-eleventh-cleared',
  savePrefix: 'v59-zoo-save',
  startScene: 'd11_prologue',
  subText: '午 夜 獸 語 · 第 十 一 扇 門',
  ruleText: '午 夜 十 二 點 前 未 回 入 口 者 ， 將 成 為 新 展 品',
  hasParty: false,
  hasCountdown: true,
  hasAdmin: false,
  achDefs: ACH_D11,
  totalEndings: 10,
  unlock: function(){ return true; },
  tagline: '晚上十一點閉園後的市立動物園，所有動物都會開口說話，而且牠們都記得你小時候來過的樣子。午夜十二點廣播響起前沒回到入口，就會成為新的展品。',

  bgAnimation: function(){
    if(bgNumTimer){ clearInterval(bgNumTimer); bgNumTimer = null; }
    var el = $('bg-num'); if(!el) return;
    el.classList.remove('float');
    if(SETTINGS.bgAnim === false || SETTINGS.reducedMotion){ el.textContent = '23:00'; return; }
    var seq = ['23:00', '23:17', '23:45', '23:59', '24:00'];
    var i = 0; el.textContent = seq[i];
    bgNumTimer = setInterval(function(){ i = (i + 1) % seq.length; el.textContent = seq[i]; }, 2000);
  },

  stateInit: function(){
    return {
      currentScene: 'd11_prologue',
      inventory: [
        {id:'zoo_feed_bag', name:'飼育員綜合飼料袋', desc:'裝著竹筍、鮮肉、銀鱗小魚、葵花籽、晨露嫩葉與方糖的飼料袋。', usage:''}
      ],
      flags: { childhoodFrags: 0, zonesFed: 0 },
      hp: 100, maxHp: 100,
      humanity: 100,
      countdown: 60,
      stress: 0,
      textIndex: 0,
      puzzleCallback: null, puzzleAnswer: null, puzzleAttempts: 0,
      inheritance: (typeof loadInheritance === 'function') ? loadInheritance() : {},
      notes: [], history: [],
      personality: {calm:50, altruism:50, cautious:50},
      mapZones: [
        {id:'d11_gate',     name:'正門旋轉柵欄·飼料站', explored:true,  current:true,  scene:'d11_hub',      summary:'距離午夜 24:00 閉園廣播僅剩 60 分鐘，必須在鐘響前趕回此處。'},
        {id:'d11_panda',    name:'熊貓區·竹林玻璃房',   explored:false, current:false, scene:'d11_panda',    summary:'老熊貓「團團」正坐在月光下等一根脆竹筍。'},
        {id:'d11_lion',     name:'獅子區·荒原獸欄',     explored:false, current:false, scene:'d11_lion',     summary:'獨眼獅王「阿斯蘭」記得你父親的肩膀。'},
        {id:'d11_aquarium', name:'水族館·深藍海底隧道', explored:false, current:false, scene:'d11_aquarium', summary:'鬼蝠魟與海豚「藍月」在頭頂游過。'},
        {id:'d11_aviary',   name:'鳥園·百鳥鐵網穹頂',   explored:false, current:false, scene:'d11_aviary',   summary:'白葵花鸚鵡「雪球」模仿著 1999 年的說話聲。'},
        {id:'d11_reptile',  name:'爬行動物區·溫室迷霧', explored:false, current:false, scene:'d11_reptile',  summary:'百歲陸龜「玄武」背甲上刻著時間拼圖。'},
        {id:'d11_haunted',  name:'鬼屋區·廢棄標本館',   explored:false, current:false, scene:'d11_haunted',  summary:'夜間飼育員在這裡擦拭空置的第 13 號玻璃展櫃。'}
      ]
    };
  },

  buildScenes: function(){
    function modHumanity(delta, reason){
      state.humanity = Math.max(0, Math.min(100, (state.humanity != null ? state.humanity : 100) + delta));
      appendNarrative('<p class="system-msg">【人性值 ' + (delta>=0?'+':'') + delta + '】當前人性值：' + state.humanity + '%（' + reason + '）</p>');
      if(window.V58 && V58.updateHUD) V58.updateHUD();
      if(state.humanity <= 25){
        unlockAchievement('ach_d11_beast');
      }
    }

    function addChildhoodFrag(key, title, memoryText){
      if(!state.flags['frag_' + key]){
        state.flags['frag_' + key] = true;
        state.flags.childhoodFrags = (state.flags.childhoodFrags || 0) + 1;
        recordAnimalFed(key);
        addNpcAffinity('zoo_' + key, 25);
        appendNarrative('<p class="inherit-note">【童年記憶碎片 ' + state.flags.childhoodFrags + '/6 · ' + title + '】' + memoryText + '</p>');
      }
    }

    SCENES.d11_prologue = {
      room:'23:00', roomName:'市立動物園 · 閉園後的正門', sceneId:'11-序章', mood:'mystery',
      onEnter: function(){ unlockAchievement('ach_d11_enter'); },
      text:[
        '<p>指針指在 <strong>23:00</strong>。生鏽的擴音器裡傳出滋滋作響的閉園廣播：</p>',
        '<p class="narration">「親愛的遊客，現在是晚上十一點整。園區內的動物已經褪去偽裝開始交談。請注意：與動物過度共情會降低你的『人性值』；而在午夜 24:00 鐘聲敲響前未能回到正門旋轉柵欄的遊客，將自動登記為本園的新展品。」</p>',
        '<p>你低頭看著手裡那袋「飼育員綜合飼料袋」，遠處的熊貓館與獅子山傳來了低沉的人語聲。</p>'
      ],
      choices:[
        {text:'走進園區中央步道（距離午夜 24:00 還有 60 分鐘）', next:'d11_hub'}
      ]
    };

    SCENES.d11_hub = {
      room:'園', roomName:'動物園 23:00 · 中央噴泉廣場', sceneId:'11-廣場', mood:'safe',
      npcs:['zoo_panda', 'zoo_lion', 'zoo_keeper'],
      onEnter: function(){
        if(state.mapZones){ state.mapZones[0].explored = true; state.mapZones[0].current = true; }
      },
      text:[
        '<p>乾涸的海豹噴泉旁立著指向六大展區的木牌。每走訪一個園區都會消耗時間，但餵食動物能喚醒你遺忘的童年記憶碎片（目前已喚醒 <strong>' + (state && state.flags ? (state.flags.childhoodFrags||0) : 0) + ' / 6</strong> 枚，當前人性值 <strong>' + (state && state.humanity!=null ? state.humanity : 100) + '%</strong>）。</p>'
      ],
      choices:[
        {text:'前往【熊貓區】（老熊貓團團 · 餵食脆竹筍）', next:'d11_panda'},
        {text:'前往【獅子區】（獨眼獅王阿斯蘭 · 餵食鮮肉／遭遇戰）', next:'d11_lion'},
        {text:'前往【水族館】（海豚藍月 · 餵食銀鱗小魚）', next:'d11_aquarium'},
        {text:'前往【鳥園】（白鸚鵡雪球 · 餵食葵花籽與節奏謎題）', next:'d11_aviary'},
        {text:'前往【爬行動物區】（百歲陸龜玄武 · 餵食嫩葉與滑動拼圖）', next:'d11_reptile'},
        {text:'前往【鬼屋區】（廢棄標本館 · 夜間飼育員與第 6 枚記憶）', next:'d11_haunted'},
        {text:'走向【正門旋轉柵欄】（查看離園結局與午夜結算）', next:'d11_gate_exit'}
      ]
    };

    SCENES.d11_panda = {
      room:'竹', roomName:'熊貓區 · 竹林玻璃房', sceneId:'11-熊貓區', mood:'safe',
      npcs:['zoo_panda'],
      onEnter: function(){ if(state.mapZones) state.mapZones[1].explored = true; addTime(-6); },
      text:[
        '<p>老熊貓「團團」正靠著假山石頭嘆氣。看見你走近，牠竟然用蒼老而溫和的嗓音開口：「你長高了啊，小陸衍。1996 年夏天，你手裡的紅豆冰棒融化掉在地上，趴在這塊玻璃前哭了整整半小時。」</p>'
      ],
      choices:[
        {text:'【餵食脆竹筍 · 保持人性】遞上新鮮竹筍並道謝：「謝謝你還記得七歲的我。」', action:function(){
          unlockAchievement('ach_d11_panda');
          addChildhoodFrag('panda', '融化的紅豆冰棒', '七歲那年母親幫你擦乾眼淚，買了第二支冰棒。那是你記憶裡最安心的夏天。');
          modHumanity(5, '溫柔的人類記憶穩固了你的自我');
          goToScene('d11_hub');
        }},
        {text:'【模仿獸語 · 降低人性】趴在玻璃前學熊貓低吼：「做人類太累了，不如當一隻不用思考的熊貓。」（人性值 -25）', action:function(){
          addChildhoodFrag('panda', '竹林的倦意', '你體會到了忘卻人類姓名的輕鬆感。');
          modHumanity(-25, '你開始羨慕籠中無憂無慮的野獸');
          goToScene('d11_hub');
        }},
        {text:'返回中央噴泉廣場', next:'d11_hub'}
      ]
    };

    SCENES.d11_lion = {
      room:'獅', roomName:'獅子區 · 荒原獸欄', sceneId:'11-獅子區', mood:'danger',
      npcs:['zoo_lion'],
      onEnter: function(){ if(state.mapZones) state.mapZones[2].explored = true; addTime(-6); },
      text:[
        '<p>獨眼獅王「阿斯蘭」站在高聳的岩石上，金色的豎瞳俯視著你：「當年那個騎在父親肩膀上發抖的小鬼，現在敢獨自站在我的領地前了？」</p>'
      ],
      choices:[
        {text:'【餵食鮮肉塊＋理性說服】拋出鮮肉塊，不卑不亢地直視獅王', action:function(){
          addChildhoodFrag('lion', '父親寬闊的肩膀', '你想起父親曾把你舉過頭頂，告訴你遇到恐懼時只要直視它的眼睛。');
          modHumanity(5, '直面恐懼的勇氣讓你保有人類的尊嚴');
          goToScene('d11_hub');
        }},
        {text:'【野性共鳴 · 降低人性】撕開飼料袋，用野獸的低吼回應獅王的威壓（人性值 -30）', action:function(){
          addChildhoodFrag('lion', '嗜血的本能', '你的瞳孔在月光下微微收縮成豎線。');
          modHumanity(-30, '野性本能正在侵蝕你的人類理智');
          goToScene('d11_hub');
        }},
        {text:'【遭遇戰】拔出防身武器與午夜狂獅正面交鋒', cls:'v59-combat-choice', action:function(){
          if(window.V59 && typeof V59.openCombatEncounter === 'function'){
            V59.openCombatEncounter('midnight_lion', function(){
              addChildhoodFrag('lion', '獅王的認可', '阿斯蘭收起利爪，承認了你的力量。');
              goToScene('d11_hub');
            }, function(){ goToScene('d11_hub'); });
          } else {
            addChildhoodFrag('lion', '獅王的認可', '阿斯蘭承認了你的勇氣。');
            goToScene('d11_hub');
          }
        }},
        {text:'【違反規則】翻越鐵欄跳進獅群領地中央', next:'d11_end_lion_fang'}
      ]
    };

    SCENES.d11_aquarium = {
      room:'海', roomName:'水族館 · 深藍海底隧道', sceneId:'11-水族館', mood:'mystery',
      onEnter: function(){ if(state.mapZones) state.mapZones[3].explored = true; addTime(-6); },
      text:[
        '<p>幽藍的拱形玻璃隧道裡，海豚「藍月」貼著玻璃游到你面前，吐出一串氣泡：「1999 年校外教學，你把零用錢買的夜光海豚鑰匙圈送給了班上那個穿白外套的女孩，對吧？」</p>'
      ],
      choices:[
        {text:'【餵食銀鱗小魚】透過投餵口投入小魚，微笑承認那段青澀記憶', action:function(){
          addChildhoodFrag('aquarium', '夜光海豚鑰匙圈', '原來早在小學那場校外教學，你就已經在人群裡見過蘇晚。');
          modHumanity(5, '珍視人際羈絆讓你的心靈更加澄澈');
          goToScene('d11_hub');
        }},
        {text:'【渴望深海 · 降低人性】貼著冰冷玻璃低語：「我也想潛入沒有語言的深海。」（人性值 -25）', action:function(){
          addChildhoodFrag('aquarium', '深海的靜謐', '人類的語言開始變得陌生而遙遠。');
          modHumanity(-25, '你渴望化作深海無聲的游魚');
          goToScene('d11_hub');
        }},
        {text:'【危險衝動】打開水族箱頂部維修蓋跳入深水區', next:'d11_end_drowned'}
      ]
    };

    SCENES.d11_aviary = {
      room:'鳥', roomName:'鳥園 · 百鳥鐵網穹頂', sceneId:'11-鳥園', mood:'tension',
      onEnter: function(){ if(state.mapZones) state.mapZones[4].explored = true; addTime(-6); },
      text:[
        '<p>數百隻夜鳥停在鐵網穹頂上。白色的葵花鸚鵡「雪球」歪著頭，用你母親當年的聲音重複著：「早點回家，別在外面逗留太晚……」</p>',
        '<p>只有跟上百鳥拍翅的節奏，並餵食葵花籽，才能讓雪球吐出牠藏在羽翼下的舊車票。</p>'
      ],
      choices:[
        {text:'【餵食葵花籽＋節奏謎題】敲擊木欄配合鳥群節拍，喚醒第 4 枚童年記憶', action:function(){
          if(window.V59 && typeof V59.openPuzzleModal === 'function'){
            V59.openPuzzleModal('rhythm_beat', function(){
              addChildhoodFrag('aviary', '母親的叮嚀與歸途', '鸚鵡雪球將半截 1999 年的兒童票根放在你掌心。');
              goToScene('d11_hub');
            });
          } else {
            addChildhoodFrag('aviary', '母親的叮嚀與歸途', '鸚鵡雪球將半截 1999 年的兒童票根放在你掌心。');
            goToScene('d11_hub');
          }
        }},
        {text:'【放棄人類語言 · 降低人性】跟著夜鳥一起發出尖銳的啼鳴（人性值 -25）', action:function(){
          addChildhoodFrag('aviary', '折翼的夜鳥', '你幾乎忘記了怎麼用人類的聲帶發音。');
          modHumanity(-25, '你的聲音逐漸變成夜鳥的啼鳴');
          goToScene('d11_hub');
        }},
        {text:'返回中央噴泉廣場', next:'d11_hub'}
      ]
    };

    SCENES.d11_reptile = {
      room:'龜', roomName:'爬行動物區 · 溫室迷霧', sceneId:'11-爬蟲館', mood:'mystery',
      onEnter: function(){ if(state.mapZones) state.mapZones[5].explored = true; addTime(-6); },
      text:[
        '<p>潮濕的熱帶溫室裡，百歲陸龜「玄武」緩緩抬起頭。牠背甲上的九宮格紋路正散發著微光：「人類總是走得太快，把最重要的記憶落在身後。」</p>'
      ],
      choices:[
        {text:'【餵食晨露嫩葉＋3x3滑動拼圖】拼合龜甲紋路，喚醒第 5 枚童年記憶', action:function(){
          if(window.V59 && typeof V59.openPuzzleModal === 'function'){
            V59.openPuzzleModal('sliding_3x3', function(){
              addChildhoodFrag('reptile', '慢下來的時光', '百歲陸龜替你撥慢了手腕上的午夜指針（倒計時 +15 分鐘）。');
              addTime(15);
              goToScene('d11_hub');
            });
          } else {
            addChildhoodFrag('reptile', '慢下來的時光', '百歲陸龜替你撥慢了手腕上的午夜指針。');
            addTime(15);
            goToScene('d11_hub');
          }
        }},
        {text:'【冷血冬眠 · 降低人性】模仿變色龍融入陰影，不再關心時間（人性值 -25）', action:function(){
          addChildhoodFrag('reptile', '冷血的安寧', '你的體溫隨著溫室的夜色一同冷卻。');
          modHumanity(-25, '你的情感正在變得像爬行動物般冰冷');
          goToScene('d11_hub');
        }},
        {text:'返回中央噴泉廣場', next:'d11_hub'}
      ]
    };

    SCENES.d11_haunted = {
      room:'鬼', roomName:'鬼屋區 · 廢棄動物標本館', sceneId:'11-鬼屋區', mood:'terror',
      npcs:['zoo_keeper'],
      onEnter: function(){ if(state.mapZones) state.mapZones[6].explored = true; addTime(-6); },
      text:[
        '<p>動物園最深處的鬼屋其實是一座舊標本館。<strong>夜間飼育員</strong>提著煤油燈，正在擦拭第 13 號空玻璃櫃，櫃門上貼著一張空白的名牌。</p>',
        '<p>飼育員轉過頭：「只要把飼料袋裡最後一顆方糖分給門口的小浣熊，你就能拼湊出完整的 1999 年兒童半價票。但如果你更喜歡留在這裡……這座玻璃櫃正好合身。」</p>'
      ],
      choices:[
        {text:'【餵食最後一顆方糖】喚醒第 6 枚童年記憶，合出「1999年兒童半價票」', action:function(){
          addChildhoodFrag('haunted', '完整的兒童半價票', '六枚記憶碎片在掌心合而為一，化作 1999 年那張蓋著紅色熊貓印章的兒童半價票！');
          addItem('childhood_ticket_1999', '1999年兒童半價票', '集齊六區動物記憶合成的傳說級紀念票根。');
          goToScene('d11_hub');
        }},
        {text:'【踏入第 13 號玻璃櫃】自願成為鬼屋區的第十三尊蠟像標本', next:'d11_end_wax'},
        {text:'返回中央噴泉廣場', next:'d11_hub'}
      ]
    };

    SCENES.d11_gate_exit = {
      room:'門', roomName:'正門旋轉柵欄 · 午夜鐘聲前夕', sceneId:'11-正門結算', mood:'tension',
      text:[
        '<p>你站在動物園正門的旋轉柵欄前。大鐘的指針逼近 <strong>24:00</strong>，百獸在月光下靜靜注視著你的背影。</p>'
      ],
      choices:[
        {text:'【真結局 · 1999年兒童半價票】出示完整兒童票根並保持高人性（需餵滿 6 區且人性值 ≥ 60）', condition:function(){
          return (state.flags.childhoodFrags || 0) >= 6 && (state.humanity != null ? state.humanity : 100) >= 60;
        }, next:'d11_end_true_ticket'},
        {text:'【特殊動物結局 · 化獸之夜】人性值已低於 25%，褪去人類姓名留在第七展區', condition:function(){
          return (state.humanity != null ? state.humanity : 100) <= 25;
        }, next:'d11_end_beast_soul'},
        {text:'【隱藏結局 · 午夜百獸大遊行】用飼育員鑰匙打開所有獸欄大門，與百獸一同衝出街道', condition:function(){
          return (state.flags.childhoodFrags || 0) >= 4;
        }, next:'d11_end_ark'},
        {text:'【普通結局 · 鐘響前的遊客】在 24:00 廣播結束前推開旋轉柵欄走出動物園', next:'d11_end_normal_exit'},
        {text:'【生還結局 · 冷藏貨車】躲進夜間飼育員的飼料配送車離開園區', next:'d11_end_truck'},
        {text:'【生還結局 · 鳥園破網】借道鳥園穹頂裂縫翻牆逃生', next:'d11_end_aviary_sky'},
        {text:'【壞結局 · 24:00 新展品】留在原地等待午夜十二點閉園廣播響起', next:'d11_end_exhibit'}
      ]
    };

    SCENES.d11_end_true_ticket = {
      room:'曉', roomName:'1999 年那張兒童半價票', sceneId:'11-真結局', mood:'safe',
      text:['<p>你將蓋滿六枚動物印章的「1999年兒童半價票」放進檢票口。老熊貓團團、獅王阿斯蘭與海豚藍月在月光下向你揮手道別。旋轉柵欄輕輕轉動，你帶著從未遺失的純真與人性，走進了清晨的街道。</p>'],
      onEnter: function(){
        unlockAchievement('ach_d11_true');
        localStorage.setItem('wuxian-eleventh-cleared', 'true');
        setTimeout(function(){ triggerEnding('hidden_d11_childhood_ticket', '1999年那張兒童半價票', '你餵食了所有園區的動物、找回全部童年記憶碎片並守住了人性，在午夜鐘響前完美通關。', '真結局 · 童年票根'); }, 450);
      },
      choices:[]
    };
    SCENES.d11_end_beast_soul = {
      room:'獸', roomName:'化獸之夜：第七展區的自由住民', sceneId:'11-動物結局', mood:'mystery',
      text:['<p>當人性值歸於沉寂，你發現自己不再需要人類的語言與煩惱。你躍上月光下的假山，與百獸一同在午夜的森林裡奔跑。</p>'],
      onEnter: function(){
        unlockAchievement('ach_d11_beast');
        localStorage.setItem('wuxian-eleventh-cleared', 'true');
        setTimeout(function(){ triggerEnding('hidden_d11_beast_soul', '褪去人名的純粹之獸', '你的人性值降至臨界點，徹底融入了午夜動物園的法則，達成特殊動物結局。', '特殊結局 · 動物結局'); }, 450);
      },
      choices:[]
    };
    SCENES.d11_end_ark = {
      room:'群', roomName:'午夜百獸大遊行', sceneId:'11-結局9', mood:'safe',
      text:['<p>所有柵欄同時敞開，獅子、熊貓與飛鳥在午夜的城市大道上奔騰而過，你也混在百獸之中重獲自由。</p>'],
      onEnter: function(){ localStorage.setItem('wuxian-eleventh-cleared', 'true'); setTimeout(function(){ triggerEnding('hidden_d11_ark_opened', '午夜百獸大遊行', '你解放了整座動物園的同伴，在百獸的簇擁下衝破午夜樊籠。', '隱藏結局 · 百獸夜行'); }, 450); },
      choices:[]
    };
    SCENES.d11_end_normal_exit = {
      room:'出', roomName:'鐘響前的最後一名遊客', sceneId:'11-結局1', mood:'safe',
      text:['<p>在 24:00 的鐘聲敲響最後一下前，你跨出了旋轉柵欄。身後的動物們重新變回了安靜的模樣。</p>'],
      onEnter: function(){ localStorage.setItem('wuxian-eleventh-cleared', 'true'); setTimeout(function(){ triggerEnding('normal_d11_exit', '鐘響前的最後一名遊客', '你在午夜十二點閉園廣播結束前順利返回入口離開。', '普通結局'); }, 450); },
      choices:[]
    };
    SCENES.d11_end_exhibit = {
      room:'籠', roomName:'24:00 閉園廣播：新展品', sceneId:'11-結局2', mood:'terror',
      text:['<p>噹——噹——午夜十二點的鐘聲敲響。你腳下的地面升起四面透明玻璃，外頭的動物們正饒有興致地隔著玻璃觀賞你。</p>'],
      onEnter: function(){ setTimeout(function(){ triggerEnding('bad_d11_exhibit', '玻璃籠裡的新展品', '你未能在午夜 24:00 前回到正門，成為了動物園永久展出的「人類展品」。', '壞結局 · 午夜展品'); }, 450); },
      choices:[]
    };
    SCENES.d11_end_lion_fang = {
      room:'牙', roomName:'荒原獅王的審判', sceneId:'11-結局3', mood:'danger',
      text:['<p>冒然闖入獅群領地的人，沒能看到午夜的月亮。</p>'],
      onEnter: function(){ setTimeout(function(){ triggerEnding('bad_d11_lion_fang', '獅王的審判', '你在獅子區違反安全距離，葬身荒原獸欄。', '壞結局'); }, 450); },
      choices:[]
    };
    SCENES.d11_end_drowned = {
      room:'淵', roomName:'深藍水箱的共眠者', sceneId:'11-結局4', mood:'danger',
      text:['<p>你在幽藍的水族箱底緩緩閉上眼睛，化作珊瑚間的一抹倒影。</p>'],
      onEnter: function(){ setTimeout(function(){ triggerEnding('bad_d11_drowned_tank', '深藍水箱：與魚群共眠', '你在水族館迷失於深海幻覺之中。', '壞結局'); }, 450); },
      choices:[]
    };
    SCENES.d11_end_wax = {
      room:'蠟', roomName:'鬼屋區第十三尊標本', sceneId:'11-結局5', mood:'terror',
      text:['<p>玻璃櫃門鎖上的一刻，你的皮膚漸漸凝固成了光滑的蠟像。</p>'],
      onEnter: function(){ setTimeout(function(){ triggerEnding('bad_d11_wax_figure', '鬼屋區：第十三尊蠟像', '你在廢棄標本館踏入了第 13 號空展櫃。', '壞結局'); }, 450); },
      choices:[]
    };
    SCENES.d11_end_truck = {
      room:'車', roomName:'飼育員的冷藏貨車', sceneId:'11-結局6', mood:'tension',
      text:['<p>你蜷縮在載滿空飼料桶的貨車後車廂，隨著引擎發動駛出了動物園側門。</p>'],
      onEnter: function(){ localStorage.setItem('wuxian-eleventh-cleared', 'true'); setTimeout(function(){ triggerEnding('survive_d11_keeper_truck', '冷藏貨車逃生', '你搭乘夜間飼育員的配送車驚險逃離。', '逃過結局'); }, 450); },
      choices:[]
    };
    SCENES.d11_end_aviary_sky = {
      room:'翼', roomName:'鳥園穹頂的夜風', sceneId:'11-結局7', mood:'tension',
      text:['<p>順著白鸚鵡雪球指引的鐵網破口，你攀上樹冠翻出了動物園圍牆。</p>'],
      onEnter: function(){ localStorage.setItem('wuxian-eleventh-cleared', 'true'); setTimeout(function(){ triggerEnding('survive_d11_aviary_sky', '鳥園穹頂的夜風', '你從鳥園高處的鐵網裂口翻越圍牆脫困。', '逃過結局'); }, 450); },
      choices:[]
    };
  }
});

/* ============================================================================
 * 模組四：現有門扉擴充（Section 1.3：第 6 扇門 觀測者病歷 / 第 7 扇門 反向車站 /
 *         第 8 扇門 甜點區與 300 則微型故事庫 / 第 9 扇門 校刊編輯部）
 * ============================================================================ */
var D8_300_GUEST_ROLES = [
  '夜班急診醫師','退役地鐵司機','舊書店修補匠','失眠的數學家','大提琴調音師',
  '海島燈塔守望者','小學自然課老師','古鐘錶修復師','午夜電台主持人','遠洋貨輪大副',
  '植物園溫室園丁','天文台底片洗印員','老照相館暗房師','山區郵政投遞員','劇院後台提詞人',
  '氣象氣球觀測員','民俗紙紮老匠人','盲人鋼琴調律員','考古陶器拼合師','長途臥鋪列車員'
];
var D8_300_DISH_TYPES = [
  '慢火紅燒肉','桂花酒釀湯圓','蔥油陽春麵','煙燻鮭魚冷盤','焦糖布蕾烤盅',
  '松露野菇燉飯','老火陳皮鴨湯','抹茶紅豆大福','迷迭香烤羊排','海鹽檸檬戚風',
  '外婆滷肉飯','冰鎮楊梅凍','蒜香奶油焗蝦','黑芝麻糊湯圓','蜜汁叉燒酥'
];

function getBuffetStoryById(idx){
  var n = ((idx - 1) % 300 + 300) % 300;
  var role = D8_300_GUEST_ROLES[n % D8_300_GUEST_ROLES.length];
  var dish = D8_300_DISH_TYPES[Math.floor(n / 20) % D8_300_DISH_TYPES.length];
  var year = 1975 + (n % 48);
  var seat = (n % 36) + 1;
  var isBuff = (n % 3 !== 0);
  var story = '【第 ' + String(n + 1).padStart(3, '0') + ' 號餐盤 · 《' + role + '的' + dish + '》】' +
    year + ' 年的冬夜，這位' + role + '獨自坐在 ' + seat + ' 號桌。他一生替無數陌生人守住了時間與秘密，卻在退休那天發現自己忘了回家路上的最後一個轉彎。當他嚐下這口熱騰騰的' + dish + '時，眼角終於落下一滴釋懷的淚水：「原來被人記住味道，就已經算是活過了一生。」';
  return {
    id: n + 1,
    title: '第 ' + (n + 1) + ' 道 · ' + role + '的' + dish,
    story: story,
    effect: isBuff ? '【記憶增益】生命 +8 · 壓力 -10' : '【遺憾共鳴】飽食度 +10 · 獲得記憶碎片線索',
    isBuff: isBuff
  };
}

function recordBuffetStoryTasted(id){
  var list = v59Get(LS_BUFFET_SEEN, []);
  if(list.indexOf(id) === -1){
    list.push(id);
    v59Set(LS_BUFFET_SEEN, list);
  }
  if(list.length >= 12){
    unlockAchievement('ach_v59_all_buffet');
  }
}

function registerV59DungeonExpansions(){
  /* 第 6 扇門：新增「觀測者病歷」隱藏區域，解鎖陳教授過去 */
  V5.registerStoryPack(6, {
    endingsAdded: 1,
    scenes: {
      d6_observer_records: {
        room:'病', roomName:'觀測者病歷室（陳教授檔案）', sceneId:'6-觀測者病歷', mood:'mystery',
        onEnter: function(){
          state.flags.d6_prof_past_unlocked = true;
          unlockAchievement('ach_v59_d6_records');
        },
        text:[
          '<p>你推開資料室最深處貼著封條的鐵門，走進塵封已久的「觀測者病歷室」。桌上攤開著編號 <strong>OBSERVER-001：陳景明教授</strong> 的臨床與觀測病歷。</p>',
          '<p class="narration">「1993 年 11 月，我在安康醫院見證了記憶提取機的失控。為了不讓我的學生陸衍在三十年後獨自面對崩塌的迴廊，我自願簽下《第一觀測者留守書》，將自己的意識錨定在 03:17 的觀測站主機裡，替後來者守住那道質數波段。」</p>',
          '<p>病歷夾層裡放著一枚泛黃的「導師懷錶齒輪」與陳教授親筆批註的畢業論文扉頁。</p>'
        ],
        choices:[
          {text:'拾取「導師懷錶齒輪」並閱讀陳教授最後的批註（解鎖陳教授過去與新真結局）', action:function(){
            addItem('d6_prof_medical_chart', '陳教授的觀測者病歷', '記載著陳教授三十年前自願留守觀測站守護學生的完整病歷檔案（傳說）。');
            addNpcAffinity('prof_chen', 35);
            appendNarrative('<p class="inherit-note">已完整解鎖陳教授的過去：獲得「陳教授的觀測者病歷」（好感度 +35）。</p>');
          }},
          {text:'【真結局擴充】帶著「陳教授的觀測者病歷」與師恩傳承走向破曉波段', condition:function(){ return hasItem('d6_prof_medical_chart'); }, next:'d6_end_prof_legacy'},
          {text:'返回終焉觀測站大廳', next:'d6_hub'}
        ]
      },
      d6_end_prof_legacy: {
        room:'師', roomName:'導師的病歷與傳承之燈', sceneId:'6-病歷真結局', mood:'safe',
        text:['<p>你將《觀測者病歷》輕輕合上，在主機終端輸入了陳教授當年的實驗室代號。螢幕那頭的導師欣慰地點了點頭，三十年的孤獨守望終於在此刻交棒，兩代學者的腳步一同邁向了 03:18 的晨光。</p>'],
        onEnter: function(){
          localStorage.setItem('wuxian-sixth-cleared', 'true');
          setTimeout(function(){ triggerEnding('hidden_d6_chen_past', '導師的病歷與傳承之燈', '你在觀測者病歷室揭開了陳教授三十年前自願留守的真相，帶著導師的託付迎來破曉。', '真結局 · 師恩傳承'); }, 450);
        },
        choices:[]
      }
    },
    inject: [
      {into:'d6_hub', choice:{text:'推開暗門進入「觀測者病歷室」（解鎖陳教授過去）', next:'d6_observer_records'}},
      {into:'d6_archive', choice:{text:'查閱封存的「觀測者病歷（OBSERVER-001）」', next:'d6_observer_records'}}
    ]
  });

  /* 第 7 扇門：新增「反向車站」——如果旅人坐過站，會進入鏡像世界的同一站 */
  V5.registerStoryPack(7, {
    endingsAdded: 1,
    scenes: {
      d7_reverse_station: {
        room:'反', roomName:'反向車站 · 鏡像世界的同一站', sceneId:'7-反向車站', mood:'mystery',
        onEnter: function(){
          state.flags.d7_reverse_visited = true;
          unlockAchievement('ach_v59_d7_reverse');
        },
        text:[
          '<p>電車沒有在終點站停下，而是呼嘯著穿過一道水幕般的鏡面隧道——你因為故意坐過站，駛入了鏡像世界的同一座車站：<strong>「反向車站」</strong>。</p>',
          '<p>月台上的所有時鐘都在逆時針旋轉，站牌上的文字左右顛倒。車窗對面的「鏡像陸衍」正站在月台長椅旁對你伸出手：「在正軌世界你錯過了下車的時機，但在反向車站，我們可以把彼此未走完的路拼成完整的圓。」</p>'
        ],
        choices:[
          {text:'與鏡像世界的自己交換「反向月台車票」（正側與鏡像 HP 同步回滿）', action:function(){
            state.hp = state.maxHp || 100;
            state.mirrorHp = 100;
            addItem('d7_reverse_ticket', '反向車站月台票', '印著逆時針文字的傳說級車票，可在鏡像世界自由通行。');
            updateHP(); if(window.V58 && V58.updateHUD) V58.updateHUD();
            appendNarrative('<p class="inherit-note">獲得「反向車站月台票」，雙側生命值完全同調回滿！</p>');
          }},
          {text:'【反向車站真結局】持「反向車站月台票」走出鏡像世界的地面出口', condition:function(){ return hasItem('d7_reverse_ticket'); }, next:'d7_end_reverse_world'},
          {text:'搭乘回程列車返回第一車廂', next:'d7_hub'}
        ]
      },
      d7_end_reverse_world: {
        room:'鏡', roomName:'反向車站：鏡像世界的歸人', sceneId:'7-反向結局', mood:'safe',
        text:['<p>你握著反向車站月台票走上階梯。在這個鏡像世界裡，所有曾經遺憾錯過的同伴都平安活在陽光下，向剛走出地鐵口的你揮手微笑。</p>'],
        onEnter: function(){
          localStorage.setItem('wuxian-seventh-cleared', 'true');
          setTimeout(function(){ triggerEnding('hidden_d7_reverse_world', '反向車站：鏡像世界的歸人', '你故意坐過站進入鏡像世界的反向車站，在反轉的時空裡尋回了所有失去的同伴。', '真結局 · 反向車站'); }, 450);
        },
        choices:[]
      }
    },
    inject: [
      {into:'d7_hub', choice:{text:'故意不下車坐過站，駛入鏡像世界的「反向車站」', next:'d7_reverse_station'}},
      {into:'d7_cab', choice:{text:'拉動逆軌轉轍器，將列車駛向「反向車站」', next:'d7_reverse_station'}}
    ]
  });

  /* 第 8 扇門：新增「甜點區」隱藏菜單與 300 則微型故事庫 */
  V5.registerStoryPack(8, {
    endingsAdded: 1,
    scenes: {
      d8_dessert_zone: {
        room:'甜', roomName:'無盡自助餐 · 隱藏甜點區', sceneId:'8-甜點區', mood:'safe',
        onEnter: function(){
          state.flags.d8_dessert_visited = true;
          unlockAchievement('ach_v59_d8_dessert');
        },
        text:[
          '<p>你推開絲絨帷幕後的玻璃門，走進散發著香草與焦糖甜香的<strong>「隱藏甜點區」</strong>。冰櫃裡陳列著三道只為真正食客準備的記憶甜點，旁邊還放著記載了 <strong>300 道食客微型人生故事</strong> 的《無盡食客總錄》。</p>'
        ],
        choices:[
          {text:'品嚐隱藏甜點《初戀青檸塔》（壓力歸零，飽食度 +5，解鎖甜點真結局旗標）', action:function(){
            state.stress = 0;
            state.satiety = Math.min(95, (state.satiety||0) + 5);
            state.flags.d8_dessert_tasted = true;
            recordBuffetStoryTasted(298);
            addItem('d8_golden_spoon', '甜點主廚的純金小匙', '品嚐隱藏甜點區後獲得的紀念銀匙（傳說）。');
            appendNarrative('<p class="inherit-note">【第 298 道 · 《初戀青檸塔》】微酸回甘的檸檬凝乳在舌尖化開，那是十七歲盛夏午後的蟬鳴與冰鎮汽水。壓力完全歸零！</p>');
            if(window.V58 && V58.updateHUD) V58.updateHUD();
          }},
          {text:'翻閱並隨機品嚐《300 道微型人生故事菜單》（解鎖「美食家」與全菜色收集）', action:function(){
            var rndId = Math.floor(Math.random() * 300) + 1;
            var st = getBuffetStoryById(rndId);
            recordBuffetStoryTasted(st.id);
            if(st.isBuff){ state.hp = Math.min(state.maxHp||100, (state.hp||100)+8); if(typeof addStress==='function') addStress(-10); }
            appendNarrative('<p class="inherit-note">' + st.story + '<br><span style="color:var(--accent)">' + st.effect + '（已收錄於畫廊詞條圖鑑 · 第 ' + st.id + '/300 道）</span></p>');
            updateHP();
          }},
          {text:'【甜點區真結局】手持「甜點主廚的純金小匙」完美結束盛宴', condition:function(){ return hasItem('d8_golden_spoon'); }, next:'d8_end_sweet_finale'},
          {text:'返回中央取餐大廳', next:'d8_hub'}
        ]
      },
      d8_end_sweet_finale: {
        room:'饗', roomName:'甜點區的最後一道人生', sceneId:'8-甜點結局', mood:'safe',
        text:['<p>餐後的甜點為整場漫長的記憶盛宴畫下了最溫柔的句點。主廚親自為你拉開餐廳大門，晨光與咖啡香一同迎面撲來。</p>'],
        onEnter: function(){
          localStorage.setItem('wuxian-eighth-cleared', 'true');
          setTimeout(function(){ triggerEnding('hidden_d8_sweet_finale', '甜點區的最後一道人生', '你發現了無盡自助餐的隱藏甜點區並品嚐了記憶的回甘，帶著溫暖的胃與記憶走出餐廳。', '真結局 · 甜點謝幕'); }, 450);
        },
        choices:[]
      }
    },
    inject: [
      {into:'d8_hub', choice:{text:'掀開絲絨帷幕進入「甜點區」隱藏菜單（含 300 道微型人生故事）', next:'d8_dessert_zone'}},
      {into:'d8_cashier', choice:{text:'前往「甜點區」品嚐餐後隱藏甜點', next:'d8_dessert_zone'}}
    ]
  });

  /* 第 9 扇門：新增「校刊編輯部」——可採訪同學寫報導，報導內容影響結局 */
  V5.registerStoryPack(9, {
    endingsAdded: 1,
    scenes: {
      d9_editorial_club: {
        room:'刊', roomName:'小學 1999 · 校刊編輯部', sceneId:'9-校刊編輯部', mood:'safe',
        onEnter: function(){
          state.flags.d9_editorial_visited = true;
          unlockAchievement('ach_v59_d9_editor');
        },
        text:[
          '<p>油印機散發著濃郁的油墨香。1999 年的「校刊編輯部」裡，小蘇晚與小阿凱正圍在稿紙前爭論千禧年特刊的頭版主題。</p>',
          '<p>小蘇晚抬起頭把鋼筆遞給你：「陸衍，你是這期校刊的主編！快去採訪同學並決定我們頭版報導的方向——你寫下的報導，會直接決定大家長大後的命運！」</p>'
        ],
        choices:[
          {text:'【採訪與撰稿：溫柔守護篇】採訪小蘇晚與小阿凱，寫下《1999年我們絕不走散的約定》', action:function(){
            state.flags.d9_article_style = 'warm';
            addItem('d9_special_issue', '千禧年校刊頭版樣張（守護篇）', '印著全班同學簽名與重逢約定的油印校刊（傳說）。');
            addNpcAffinity('suwan', 20); addNpcAffinity('akai', 20);
            appendNarrative('<p class="inherit-note">【校刊定稿 · 溫柔守護篇】油印機印出了帶著溫度的新刊，全班同學的未來都被這份約定緊緊連在一起。</p>');
          }},
          {text:'【採訪與撰稿：真相調查篇】採訪自然老師與班長，寫下《校園鐘樓與時間迴廊之謎》', action:function(){
            state.flags.d9_article_style = 'truth';
            addItem('d9_special_issue', '千禧年校刊頭版樣張（真相篇）', '精準預言了 03:17 時間夾縫的調查特刊（傳說）。');
            appendNarrative('<p class="inherit-note">【校刊定稿 · 真相調查篇】你用大人的理性邏輯結合童年的好奇，揭開了校園底下的迴廊座標。</p>');
          }},
          {text:'【校刊總編真結局】發刊《千禧年特刊》，與全班同學一起迎接西元 2000 年的第一道鐘聲', condition:function(){ return hasItem('d9_special_issue'); }, next:'d9_end_chief_editor'},
          {text:'返回六年三班教室', next:'d9_classroom'}
        ]
      },
      d9_end_chief_editor: {
        room:'編', roomName:'印在千禧年前夕的頭版', sceneId:'9-總編結局', mood:'safe',
        text:['<p>你把剛印好的《1999 千禧年校刊》發給走廊上的每一位同學。下課鐘聲響起，紙飛機與校刊在夕陽下飛舞，你改寫了所有人的童年遺憾。</p>'],
        onEnter: function(){
          localStorage.setItem('wuxian-ninth-cleared', 'true');
          setTimeout(function(){ triggerEnding('hidden_d9_chief_editor', '校刊總編輯：千禧年的頭版', '你在校刊編輯部採訪同學並親手撰寫了改變命運的頭版報導。', '真結局 · 校刊總編'); }, 450);
        },
        choices:[]
      }
    },
    inject: [
      {into:'d9_classroom', choice:{text:'前往走廊盡頭的「校刊編輯部」採訪同學撰寫頭版報導', next:'d9_editorial_club'}},
      {into:'d9_magazine', choice:{text:'進入「校刊編輯部」內室啟動油印機撰寫頭版', next:'d9_editorial_club'}}
    ]
  });
}

/* ============================================================================
 * 模組五：新 NPC 檔案、多周目繼承劇情、角色關係圖、分支樹回溯與 3x3 碎片拼圖（Section 2.1–2.4）
 * ============================================================================ */
function registerV59NpcsAndMultiPlaythrough(){
  if(window.NPC_PROFILES){
    NPC_PROFILES.cinema_seller  = {name:'售票員林默', title:'第十扇門 · 逆向售票員', desc:'永遠不會給你原本要的那張票，卻在票根背面藏著生還法則。'};
    NPC_PROFILES.cinema_cleaner = {name:'清潔工老陳', title:'第十扇門 · 銀幕守夜人', desc:'清掃影廳遺落記憶碎片的老人，知道哪一部電影才是真實。'};
    NPC_PROFILES.cinema_ghost   = {name:'鄰座觀眾沈影', title:'第十扇門 · 7排G座幽靈', desc:'上一場午夜秀未能離開的觀眾，總是小聲提醒你別違反銀幕鐵則。'};
    NPC_PROFILES.zoo_panda      = {name:'老熊貓團團', title:'第十一扇門 · 竹林長者', desc:'記得你七歲那年在玻璃窗外掉了一支紅豆冰棒。'};
    NPC_PROFILES.zoo_lion       = {name:'獅王阿斯蘭', title:'第十一扇門 · 荒原獨眼王', desc:'記得你父親把你舉在肩膀上的模樣，只敬重直視恐懼的人。'};
    NPC_PROFILES.zoo_keeper     = {name:'夜間飼育員', title:'第十一扇門 · 午夜守園人', desc:'提著煤油燈巡視六大展區，在 24:00 準時清點留在園區的遊客。'};
  }
  window.NPC_DIALOGUES = window.NPC_DIALOGUES || {};
  var v59DlgDefs = {
    cinema_seller: {
      name:'售票員林默', role:'潮汐電影院售票員',
      lines:[
        '「想看愛情片？那我偏給你驚悚廳的票。人生不也是這樣嗎，你從來拿不到劇本寫好的那張票。」',
        '「記住，中途離場是對電影最大的不敬，影評人會把你的分數扣光。」'
      ],
      choices:[
        {text:'「我明白你的逆向規則了，謝謝提醒。」（好感 +15）', reply:'林默微微一怔，嘴角揚起一絲笑意：「看來今晚終於來了一位真正的影迷。」', action:function(){ addNpcAffinity('cinema_seller', 15); }}
      ]
    },
    cinema_cleaner: {
      name:'清潔工老陳', role:'銀幕守夜人',
      lines:[
        '「地上這些發光的爆米花，全都是觀眾看電影時掉出來的笑聲與眼淚。」',
        '「去把 A、B、C、D 四廳的片尾膠卷都帶到頂層放映室吧，那裡有真正的早場陽光。」'
      ],
      choices:[
        {text:'幫老陳一起收拾散落的膠卷盒（好感 +15）', reply:'老陳拍了拍你的肩膀：「好孩子，待會兒要是遇到危險，後巷消防梯隨時為你留著。」', action:function(){ addNpcAffinity('cinema_cleaner', 15); }}
      ]
    },
    cinema_ghost: {
      name:'鄰座觀眾沈影', role:'上一場觀眾的殘影',
      lines:[
        '「噓……別大聲說話。上一場就是因為我在驚悚廳回了頭，才永遠留在了 7 排 G 座。」'
      ],
      choices:[
        {text:'「這次散場時，我會連你的份一起走出去。」（好感 +15）', reply:'沈影透明的眼眶泛起微光：「謝謝你，陸衍。」', action:function(){ addNpcAffinity('cinema_ghost', 15); }}
      ]
    },
    zoo_panda: {
      name:'老熊貓團團', role:'熊貓區長者',
      lines:['「竹筍要挑晨露還沒乾的最脆。小時候的你哭起來鼻子紅紅的，現在倒是學會把心事藏在心裡了。」'],
      choices:[{text:'摸摸團團隔著玻璃的爪印（好感 +15，人性 +5）', reply:'團團晃了晃圓耳朵：「別忘了回家的時間，午夜十二點前要走回正門喔。」', action:function(){ addNpcAffinity('zoo_panda', 15); }}]
    },
    zoo_lion: {
      name:'獅王阿斯蘭', role:'獅子區霸主',
      lines:['「恐懼的氣味隔著十丈遠都能聞到。但你的眼睛裡有光，像極了當年把你扛在肩上的那個男人。」'],
      choices:[{text:'向獅王行禮致意（好感 +15）', reply:'阿斯蘭低吼一聲，替你讓開了通往深處的道路。', action:function(){ addNpcAffinity('zoo_lion', 15); }}]
    },
    zoo_keeper: {
      name:'夜間飼育員', role:'午夜守園人',
      lines:['「動物比人類誠實多了。你餵牠們一口食物，牠們就還你一段你以為早就弄丟的童年。」'],
      choices:[{text:'詢問關於 1999 年兒童半價票的下落（好感 +15）', reply:'「集齊六個展區的記憶碎片，那張票自然會在你手心浮現。」', action:function(){ addNpcAffinity('zoo_keeper', 15); }}]
    }
  };
  Object.keys(v59DlgDefs).forEach(function(k){
    var d = v59DlgDefs[k];
    window.NPC_DIALOGUES[k] = d;
    if(window.DIALOGUE_TREES){
      var ch0 = (d.choices && d.choices[0]) || {text:'點頭致意', reply:'對方微微頷首。'};
      DIALOGUE_TREES[k] = {
        start: 's1',
        startReturning: 's1',
        nodes: {
          s1: {
            reply: (d.lines || []).join(' '),
            options: [{ text: ch0.text, action: ch0.action, next: 's2' }]
          },
          s2: {
            reply: ch0.reply,
            options: []
          }
        }
      };
    }
  });
}

/* 2.1 分支樹升級：點擊已走過節點可「回溯記憶」直接重讀該段劇情（不影響當前存檔） */
window.v59RewindMemoryScene = function(sceneKey){
  if(!SCENES || !SCENES[sceneKey]){ showToast('找不到該節點的記憶文本'); return; }
  var sc = SCENES[sceneKey];
  var paras = (typeof sc.getText === 'function') ? sc.getText(state) : (sc.text || []);
  var modal = document.getElementById('v59-rewind-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v59-rewind-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML =
      '<div class="modal-card v4-card wide">' +
        '<h3 id="v59-rw-title">回 溯 記 憶</h3>' +
        '<div class="v4-sub" id="v59-rw-sub">唯讀記憶回放模式（不會覆蓋或影響你當前的存檔與生命值）</div>' +
        '<div id="v59-rw-body" style="max-height:58vh;overflow-y:auto;padding:.85rem 1rem;background:var(--bg-card);border:1px solid var(--border);border-radius:5px;line-height:1.85;font-size:.95rem"></div>' +
        '<div class="v4-actions end" style="margin-top:.8rem"><button class="v4-btn primary" onclick="document.getElementById(\'v59-rewind-modal\').classList.remove(\'show\')">結束回溯</button></div>' +
      '</div>';
    document.body.appendChild(modal);
  }
  document.getElementById('v59-rw-title').textContent = '回 溯 記 憶 · ' + (sc.roomName || sceneKey);
  document.getElementById('v59-rw-sub').textContent = '節點代碼：' + (sc.sceneId || sceneKey) + ' · 唯讀重溫（不影響當前存檔進度）';
  document.getElementById('v59-rw-body').innerHTML = (paras || []).join('') || '<p>（此節點為轉場或結局觸發點）</p>';
  modal.classList.add('show');
};

function upgradeBranchTreeForV59(){
  if(typeof window.renderBranchTree === 'function' && !window.renderBranchTree.__v59){
    var _rbt = window.renderBranchTree;
    window.renderBranchTree = function(){
      var r = _rbt.apply(this, arguments);
      try{
        var svg = $('branch-svg');
        if(!svg) return r;
        var readSet = {};
        try{ getReadScenes().forEach(function(s){ readSet[s] = true; }); }catch(e){}
        svg.querySelectorAll('.branch-node').forEach(function(gn){
          var nid = gn.getAttribute('data-node-id');
          var sc = SCENES && SCENES[nid];
          if(!sc) return;
          var isRead = !!readSet[sc.sceneId || nid] || (state && state.currentScene === nid);
          var hasNext = (sc.choices || []).some(function(c){ return c.next; });
          var isDeadEnd = !hasNext || /death|bad/.test(nid);
          var circle = gn.querySelector('circle');
          if(circle){
            if(isRead){
              circle.setAttribute('fill', '#e5c589');
              circle.setAttribute('stroke', '#f5dca8');
              circle.setAttribute('stroke-width', '1.8');
            } else {
              circle.setAttribute('fill', '#3a3935');
              circle.setAttribute('stroke', '#6e6b64');
            }
            if(isDeadEnd && isRead){
              circle.setAttribute('stroke', '#ff5c5c');
              circle.setAttribute('stroke-dasharray', '2 1');
            }
          }
          gn.addEventListener('click', function(){
            var box = $('branch-info');
            if(!box || !isRead) return;
            if(!box.querySelector('.v59-branch-rewind-btn')){
              var deadBadge = isDeadEnd ? '　<span style="color:var(--danger-bright)">[死路/終點標示]</span>' : '';
              box.insertAdjacentHTML('beforeend',
                deadBadge +
                '<div><button type="button" class="v59-branch-rewind-btn" onclick="window.v59RewindMemoryScene(\'' + String(nid).replace(/'/g,"\\'") + '\')">' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>' +
                '<span>回溯記憶（重讀此段劇情，不影響存檔）</span></button></div>'
              );
            }
          });
        });
      }catch(e){}
      return r;
    };
    window.renderBranchTree.__v59 = true;
  }
}

/* 2.2 萬門之書「角色關係圖」子分頁（敵對/愛慕/親子/背叛 隨好感度變色與箭頭） */
var V59_REL_EDGES = [
  {from:'luyan',    to:'suwan',     type:'affection', label:'愛慕／生死並肩'},
  {from:'luyan',    to:'laozhao',   type:'trust',     label:'生死相託'},
  {from:'luyan',    to:'akai',      type:'betrayal',  label:'鏡像背叛與和解'},
  {from:'ankang',   to:'yuanyuan',  type:'parent',    label:'親子執念'},
  {from:'lin_doc',  to:'yuanyuan',  type:'parent',    label:'醫者守護'},
  {from:'prof_chen',to:'luyan',     type:'parent',    label:'師徒傳承'},
  {from:'luyan',    to:'lib_admin', type:'hostile',   label:'規則對峙→理解'},
  {from:'ankang',   to:'zhoumin',   type:'hostile',   label:'真相封鎖'}
];

function upgradeCodexRelationshipGraph(){
  if(typeof window.renderCodexTab === 'function' && !window.renderCodexTab.__v59){
    var _rct = window.renderCodexTab;
    window.renderCodexTab = function(body){
      var mode = body.getAttribute('data-v59-codex-mode') || 'rel';
      _rct.apply(this, arguments);
      var switchBar =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.65rem;padding:.4rem .65rem;background:var(--bg-card);border:1px solid var(--border);border-radius:4px">' +
          '<span style="font-size:.76rem;color:var(--accent)">萬門之書視角切換：</span>' +
          '<div class="seg">' +
            '<button type="button" data-cmode="rel" class="' + (mode==='rel'?'on':'') + '">角色關係圖（動態好感箭頭）</button>' +
            '<button type="button" data-cmode="star" class="' + (mode==='star'?'on':'') + '">原版星圖與詞條</button>' +
          '</div>' +
        '</div>';
      body.insertAdjacentHTML('afterbegin', switchBar);

      if(mode === 'rel'){
        var wrap = body.querySelector('.v53-constellation-wrap');
        if(wrap){
          var svg = '<svg class="v53-constellation-svg" viewBox="0 0 410 270">' +
            '<defs>' +
              '<marker id="v59-arr-affection" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#e87a90"/></marker>' +
              '<marker id="v59-arr-parent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#6bc497"/></marker>' +
              '<marker id="v59-arr-hostile" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#e05a5a"/></marker>' +
              '<marker id="v59-arr-betrayal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#a77be8"/></marker>' +
              '<marker id="v59-arr-trust" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#e5c589"/></marker>' +
            '</defs>';
          var colorMap = {affection:'#e87a90', parent:'#6bc497', hostile:'#e05a5a', betrayal:'#a77be8', trust:'#e5c589'};
          V59_REL_EDGES.forEach(function(ed){
            var n1 = CONSTELLATION_NODES.find(function(n){ return n.id === ed.from; });
            var n2 = CONSTELLATION_NODES.find(function(n){ return n.id === ed.to; });
            if(!n1 || !n2) return;
            var aff = (window.V58 && V58.getAffinity) ? V58.getAffinity(ed.to) : 50;
            var col = colorMap[ed.type] || '#c9a96e';
            if(aff >= 75 && ed.type === 'hostile') col = '#6bc497';
            var w = aff >= 70 ? '2.2' : '1.4';
            var mx = (n1.x + n2.x) / 2, my = (n1.y + n2.y) / 2 - 4;
            svg += '<line x1="'+n1.x+'" y1="'+n1.y+'" x2="'+n2.x+'" y2="'+n2.y+'" stroke="'+col+'" stroke-width="'+w+'" marker-end="url(#v59-arr-'+ed.type+')"/>';
            svg += '<text x="'+mx+'" y="'+my+'" fill="'+col+'" font-size="7.5" text-anchor="middle">'+ed.label+'</text>';
          });
          var selId = body.getAttribute('data-sel-node') || 'luyan';
          CONSTELLATION_NODES.forEach(function(n){
            var isOn = (n.id === selId);
            var aff = (window.V58 && V58.getAffinity) ? V58.getAffinity(n.id) : 50;
            svg += '<g class="v53-cnode'+(isOn?' on':'')+'" data-cnode="'+n.id+'">' +
              '<circle cx="'+n.x+'" cy="'+n.y+'" r="'+(isOn?8:5.5)+'" fill="'+(isOn?'var(--accent)':'#14141c')+'" stroke="var(--accent)" stroke-width="1.6"/>' +
              '<text x="'+n.x+'" y="'+(n.y-10)+'" text-anchor="middle">'+n.name+'(' + aff + ')</text>' +
            '</g>';
          });
          svg += '</svg>' +
            '<div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;padding:.35rem;font-size:.7rem;border-top:1px solid var(--border)">' +
              '<span style="color:#e87a90">● 愛慕/羈絆</span>' +
              '<span style="color:#6bc497">● 親子/師徒</span>' +
              '<span style="color:#e05a5a">● 敵對/封鎖</span>' +
              '<span style="color:#a77be8">● 背叛/鏡像</span>' +
              '<span style="color:#e5c589">● 生死信賴</span>' +
            '</div>';
          wrap.innerHTML = svg;
          wrap.querySelectorAll('[data-cnode]').forEach(function(g){
            g.addEventListener('click', function(){
              body.setAttribute('data-sel-node', g.getAttribute('data-cnode'));
              window.renderCodexTab(body);
            });
          });
        }
      }
      body.querySelectorAll('[data-cmode]').forEach(function(b){
        b.onclick = function(){
          body.setAttribute('data-v59-codex-mode', b.getAttribute('data-cmode'));
          window.renderCodexTab(body);
        };
      });
    };
    window.renderCodexTab.__v59 = true;
  }
}

/* 2.3 記憶碎片 3x3 拼圖式升級（拼滿解鎖水墨畫與點擊放大看隱藏文字） */
var jigsawOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];
var jigsawSelectedIdx = -1;

window.v59OpenInkPaintingModal = function(title, subtitle, hiddenLore){
  var modal = document.getElementById('v59-art-zoom-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v59-art-zoom-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML =
      '<div class="modal-card v4-card wide">' +
        '<h3 id="v59-az-title">水 墨 畫 卷 細 節 賞 析</h3>' +
        '<div class="v4-sub" id="v59-az-sub"></div>' +
        '<div id="v59-az-canvas" style="background:#09090d;border:1px solid var(--accent);border-radius:6px;padding:1rem;text-align:center"></div>' +
        '<div id="v59-az-lore" style="margin-top:.75rem;padding:.65rem .85rem;background:rgba(201,169,110,.08);border:1px solid rgba(201,169,110,.3);border-radius:4px;font-size:.82rem;color:var(--accent-bright);line-height:1.7"></div>' +
        '<div class="v4-actions end" style="margin-top:.8rem"><button class="v4-btn primary" onclick="document.getElementById(\'v59-art-zoom-modal\').classList.remove(\'show\')">關 閉</button></div>' +
      '</div>';
    document.body.appendChild(modal);
  }
  document.getElementById('v59-az-title').textContent = title || '《萬門歸宗水墨長卷》';
  document.getElementById('v59-az-sub').textContent = subtitle || '九枚迴廊碎片拼合而成的完整水墨真跡（已放大顯示隱藏題跋）';
  document.getElementById('v59-az-canvas').innerHTML =
    '<svg viewBox="0 0 480 220" style="width:100%;max-height:260px;stroke:var(--accent);fill:none">' +
      '<path d="M10 185 Q90 110 170 165 T330 135 T470 175" stroke-width="2" stroke="rgba(201,169,110,.65)"/>' +
      '<path d="M30 198 Q140 140 250 185 T460 192" stroke-width="1.2" stroke="rgba(138,196,235,.4)"/>' +
      '<rect x="215" y="48" width="50" height="92" rx="2" stroke-width="2.2" stroke="var(--accent-bright)"/>' +
      '<circle cx="255" cy="94" r="3" fill="var(--accent-bright)" class="v59-lantern-glow"/>' +
      '<circle cx="95" cy="54" r="18" stroke="rgba(201,169,110,.5)" stroke-width="1.5" class="v59-lantern-glow"/>' +
      '<line x1="120" y1="20" x2="114" y2="55" class="v59-rain-line"/><line x1="290" y1="25" x2="284" y2="60" class="v59-rain-line"/><line x1="380" y1="18" x2="374" y2="53" class="v59-rain-line"/>' +
      '<text x="240" y="32" fill="var(--accent-bright)" font-size="11" text-anchor="middle">「門無止境，唯記住名字之人得以歸家」</text>' +
      '<text x="240" y="210" fill="var(--text-dim)" font-size="9.5" text-anchor="middle">題跋暗碼：03:17 → 03:18 · 質數 17 · 1999 半價票 · 四廳膠卷</text>' +
    '</svg>';
  document.getElementById('v59-az-lore').innerHTML = hiddenLore || '【畫卷隱藏文字】在墨色山巒與第十一扇門扉的夾縫間，寫著陳教授與守門人留下的小字：「當九枚碎片拼合為一，所有門扉的密室與真結局座標皆向你敞開。」';
  modal.classList.add('show');
};

function upgradeFragmentsJigsawInOverview(){
  if(typeof window.renderOverview === 'function' && !window.renderOverview.__v59){
    var _rov = window.renderOverview;
    window.renderOverview = function(body){
      var r = _rov.apply(this, arguments);
      try{
        var fragGrid = body.querySelector('.v4-frag-grid');
        if(!fragGrid || !window.V4 || !V4.FRAGMENTS) return r;
        var keys = Object.keys(V4.FRAGMENTS);
        var isSolved = localStorage.getItem(LS_JIGSAW_DONE) === '1';
        var html = '<div class="v4-sub" style="text-align:center;margin-top:.3rem">點擊任兩塊碎片交換位置，將九宮格拼回正確順序（1→9）即可解鎖《萬門歸宗水墨長卷》：</div>';
        html += '<div class="v59-jigsaw-grid">';
        jigsawOrder.forEach(function(fragIdx, posIdx){
          var k = keys[fragIdx];
          var f = V4.FRAGMENTS[k] || {name:'碎片', hint:''};
          var got = V4.hasFragment(k) || isSolved;
          var aligned = (fragIdx === posIdx);
          html += '<div class="v59-jigsaw-cell' + (jigsawSelectedIdx===posIdx?' selected':'') + (aligned?' aligned':'') + '" data-jpos="' + posIdx + '">' +
            '<span style="font-size:.65rem;color:var(--text-dim)">#' + (fragIdx+1) + '</span>' +
            '<span style="font-family:var(--font-serif);font-size:1.05rem;color:var(--accent-bright)">' + (got ? '扉' : '墨') + '</span>' +
            '<span style="font-size:.7rem;color:var(--text-bright);margin-top:2px">' + f.name + '</span>' +
          '</div>';
        });
        html += '</div>';
        html += '<div style="display:flex;gap:.5rem;justify-content:center;margin-top:.55rem">' +
          '<button type="button" class="v4-btn" id="v59-jigsaw-shuffle">打亂拼圖練習</button>' +
          '<button type="button" class="v4-btn primary" id="v59-jigsaw-auto">一鍵拼合並放大賞析水墨畫</button>' +
        '</div>';
        fragGrid.outerHTML = html;

        body.querySelectorAll('[data-jpos]').forEach(function(cell){
          cell.onclick = function(){
            var p = parseInt(cell.getAttribute('data-jpos'), 10);
            if(jigsawSelectedIdx === -1){
              jigsawSelectedIdx = p;
            } else if(jigsawSelectedIdx === p){
              jigsawSelectedIdx = -1;
            } else {
              var tmp = jigsawOrder[jigsawSelectedIdx];
              jigsawOrder[jigsawSelectedIdx] = jigsawOrder[p];
              jigsawOrder[p] = tmp;
              jigsawSelectedIdx = -1;
              var done = jigsawOrder.every(function(v, i){ return v === i; });
              if(done){
                localStorage.setItem(LS_JIGSAW_DONE, '1');
                unlockAchievement('ach_v59_first_jigsaw');
                showToast('恭喜拼滿第一幅九宮記憶拼圖！已解鎖水墨長卷');
              }
            }
            window.renderOverview(body);
          };
        });
        var shufBtn = body.querySelector('#v59-jigsaw-shuffle');
        if(shufBtn){
          shufBtn.onclick = function(){
            jigsawOrder = [3, 0, 4, 6, 1, 2, 7, 8, 5];
            jigsawSelectedIdx = -1;
            window.renderOverview(body);
          };
        }
        var autoBtn = body.querySelector('#v59-jigsaw-auto');
        if(autoBtn){
          autoBtn.onclick = function(){
            jigsawOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            jigsawSelectedIdx = -1;
            localStorage.setItem(LS_JIGSAW_DONE, '1');
            unlockAchievement('ach_v59_first_jigsaw');
            window.renderOverview(body);
            window.v59OpenInkPaintingModal();
          };
        }
      }catch(e){}
      return r;
    };
    window.renderOverview.__v59 = true;
  }
}

/* ============================================================================
 * 模組六：輕量遭遇戰系統（Section 3.1：戰鬥 / 逃跑 / 說服 + 水墨風敵人頭像）
 * ============================================================================ */
var V59_ENEMIES = {
  film_swordsman: {
    name:'竹林膠卷刀客', hp:65, maxHp:65, atk:14,
    intellectReq: 55,
    desc:'從 C 廳銀幕躍出的黑白武俠刀客，刀鋒帶著 35mm 膠卷的鋸齒寒光。',
    svg:'<svg viewBox="0 0 100 100" fill="none" stroke="var(--accent-bright)"><path d="M20 38 L50 18 L80 38 Z" stroke-width="2" fill="rgba(201,169,110,.15)"/><circle cx="50" cy="48" r="12" stroke-width="1.8"/><path d="M30 85 Q50 62 70 85" stroke-width="2"/><line x1="18" y1="78" x2="84" y2="24" stroke="#ff6b6b" stroke-width="2.5"/></svg>'
  },
  midnight_lion: {
    name:'荒原獨眼狂獅', hp:80, maxHp:80, atk:16,
    intellectReq: 60,
    desc:'午夜十一點後甦醒的獅王化身，鬃毛如同燃燒的墨火。',
    svg:'<svg viewBox="0 0 100 100" fill="none" stroke="var(--accent-bright)"><polygon points="50,12 65,24 82,42 74,68 50,86 26,68 18,42 35,24" stroke-width="2" fill="rgba(201,169,110,.12)"/><circle cx="40" cy="46" r="3" fill="#ff6b6b"/><line x1="56" y1="42" x2="64" y2="50" stroke="#ff6b6b" stroke-width="2"/><path d="M42 64 Q50 72 58 64" stroke-width="2"/></svg>'
  },
  corridor_shade: {
    name:'迴廊墨影守衛', hp:60, maxHp:60, atk:12,
    intellectReq: 50,
    desc:'由迷失旅人的壓力與黑影凝結而成的守衛，畏懼強光與冷靜的邏輯。',
    svg:'<svg viewBox="0 0 100 100" fill="none" stroke="var(--accent-bright)"><path d="M28 84 C28 40 38 18 50 18 C62 18 72 40 72 84" stroke-width="2" fill="rgba(20,20,28,.8)"/><circle cx="43" cy="44" r="2.5" fill="var(--accent-bright)"/><circle cx="57" cy="44" r="2.5" fill="var(--accent-bright)"/></svg>'
  }
};

function openCombatEncounter(enemyKey, onWin, onEscape){
  var baseEnemy = V59_ENEMIES[enemyKey] || V59_ENEMIES.corridor_shade;
  var ngScale = (localStorage.getItem('wuxian-ng-plus') === 'true') ? 1.35 : 1.0;
  var enemy = {
    name: baseEnemy.name + (ngScale > 1 ? ' (NG+強化)' : ''),
    hp: Math.round(baseEnemy.hp * ngScale),
    maxHp: Math.round(baseEnemy.maxHp * ngScale),
    atk: Math.round(baseEnemy.atk * ngScale),
    svg: baseEnemy.svg,
    desc: baseEnemy.desc
  };

  /* 若開啟「快速戰鬥」，直接結算勝利 */
  if(SETTINGS && SETTINGS.v59FastCombat){
    var fastDmg = Math.max(4, Math.round(enemy.atk * 0.5));
    damage(fastDmg);
    var wins = parseInt(localStorage.getItem(LS_COMBAT_WINS) || '0', 10) + 1;
    localStorage.setItem(LS_COMBAT_WINS, String(wins));
    unlockAchievement('ach_v59_first_combat');
    if(typeof addMemoryShards === 'function') addMemoryShards(1);
    showToast('【快速戰鬥結算】擊敗「' + enemy.name + '」（耗損 ' + fastDmg + ' HP，記憶碎片 +1）');
    if(onWin) onWin();
    return;
  }

  var modal = document.getElementById('v59-combat-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v59-combat-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML =
      '<div class="modal-card v4-card wide">' +
        '<h3 id="v59-cb-title">遭 遇 戰</h3>' +
        '<div class="v4-sub" id="v59-cb-sub"></div>' +
        '<div class="v59-combat-stage">' +
          '<div class="v59-enemy-avatar" id="v59-cb-avatar"></div>' +
          '<div>' +
            '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:.25rem"><span id="v59-cb-ename"></span><span id="v59-cb-ehp"></span></div>' +
            '<div class="v4-bar"><i id="v59-cb-ebar" style="width:100%;background:var(--danger-bright)"></i></div>' +
            '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin:.6rem 0 .25rem"><span>陸衍（你的生命）</span><span id="v59-cb-php"></span></div>' +
            '<div class="v4-bar"><i id="v59-cb-pbar" style="width:100%"></i></div>' +
          '</div>' +
        '</div>' +
        '<div class="v59-combat-log" id="v59-cb-log"></div>' +
        '<div class="v4-actions" id="v59-cb-actions" style="margin-top:.8rem;flex-wrap:wrap;gap:.45rem"></div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  var logEl = document.getElementById('v59-cb-log');
  var actEl = document.getElementById('v59-cb-actions');
  document.getElementById('v59-cb-avatar').innerHTML = enemy.svg;
  document.getElementById('v59-cb-sub').textContent = enemy.desc;
  logEl.innerHTML = '<div>【遭遇敵人】<strong>' + enemy.name + '</strong> 擋住了去路！請選擇應對策略（戰鬥／逃跑／說服）：</div>';

  function syncBars(){
    var pHp = Math.max(0, Math.round((state && state.hp) || 100));
    var pMax = (state && state.maxHp) || 100;
    document.getElementById('v59-cb-ename').textContent = enemy.name;
    document.getElementById('v59-cb-ehp').textContent = enemy.hp + ' / ' + enemy.maxHp + ' HP';
    document.getElementById('v59-cb-ebar').style.width = Math.max(0, Math.round(enemy.hp / enemy.maxHp * 100)) + '%';
    document.getElementById('v59-cb-php').textContent = pHp + ' / ' + pMax + ' HP';
    document.getElementById('v59-cb-pbar').style.width = Math.max(0, Math.round(pHp / pMax * 100)) + '%';
  }

  function finishWin(msg){
    var wins = parseInt(localStorage.getItem(LS_COMBAT_WINS) || '0', 10) + 1;
    localStorage.setItem(LS_COMBAT_WINS, String(wins));
    unlockAchievement('ach_v59_first_combat');
    if(typeof addMemoryShards === 'function') addMemoryShards(1);
    modal.classList.remove('show');
    showToast(msg || ('戰鬥勝利！擊敗 ' + enemy.name + '（記憶碎片 +1）'));
    if(onWin) onWin();
  }

  function renderTurnActions(){
    syncBars();
    actEl.innerHTML =
      '<button class="v4-btn primary" id="v59-act-atk">攻擊（武器/邏輯重擊）</button>' +
      '<button class="v4-btn" id="v59-act-def">防禦（減傷並回氣）</button>' +
      '<button class="v4-btn" id="v59-act-item">道具（恢復 25 HP）</button>' +
      '<button class="v4-btn" id="v59-act-flee">撤退逃跑</button>';

    document.getElementById('v59-act-atk').onclick = function(){
      var hasWeapon = (state && state.inventory && state.inventory.length > 0);
      var dmgToE = (hasWeapon ? 28 : 20) + Math.floor(Math.random() * 8);
      enemy.hp = Math.max(0, enemy.hp - dmgToE);
      logEl.innerHTML += '<div>你發動攻擊，對 <strong>' + enemy.name + '</strong> 造成 <span style="color:var(--accent-bright)">' + dmgToE + '</span> 點傷害！</div>';
      if(enemy.hp <= 0){
        finishWin('你正面擊敗了「' + enemy.name + '」！（記憶碎片 +1）');
        return;
      }
      var eDmg = Math.max(4, enemy.atk - Math.floor(Math.random() * 4));
      damage(eDmg);
      logEl.innerHTML += '<div>' + enemy.name + ' 反擊，你受到 <span style="color:var(--danger-bright)">' + eDmg + '</span> 點傷害。</div>';
      logEl.scrollTop = logEl.scrollHeight;
      syncBars();
      if(state && state.hp <= 0){ modal.classList.remove('show'); }
    };

    document.getElementById('v59-act-def').onclick = function(){
      var counter = 12;
      enemy.hp = Math.max(0, enemy.hp - counter);
      var eDmg = Math.max(2, Math.round(enemy.atk * 0.3));
      damage(eDmg);
      logEl.innerHTML += '<div>你採取守勢格擋，僅受 ' + eDmg + ' 點輕傷並反震敵人 ' + counter + ' 點傷害。</div>';
      logEl.scrollTop = logEl.scrollHeight;
      if(enemy.hp <= 0){ finishWin('你在防守反擊中擊敗了「' + enemy.name + '」！'); return; }
      syncBars();
    };

    document.getElementById('v59-act-item').onclick = function(){
      state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + 25);
      updateHP();
      logEl.innerHTML += '<div style="color:#6bc497">你使用隨身補給，生命值恢復 25 點！</div>';
      syncBars();
    };

    document.getElementById('v59-act-flee').onclick = function(){
      modal.classList.remove('show');
      showToast('你利用地形掩護脫離了戰鬥');
      if(onEscape) onEscape();
    };
  }

  /* 階段一：三選一（戰鬥 / 逃跑 / 說服） */
  syncBars();
  actEl.innerHTML =
    '<button class="v4-btn primary" id="v59-init-fight">【戰鬥】拔刀迎戰（進入回合制對決）</button>' +
    '<button class="v4-btn" id="v59-init-persuade">【說服】以高智力與冷靜邏輯說服</button>' +
    '<button class="v4-btn" id="v59-init-flee">【逃跑】憑藉速度立刻脫離</button>';

  document.getElementById('v59-init-fight').onclick = function(){
    logEl.innerHTML += '<div style="color:var(--accent-bright)">你握緊武器踏前一步，戰鬥正式開始！</div>';
    renderTurnActions();
  };
  document.getElementById('v59-init-persuade').onclick = function(){
    var calm = (state && state.personality && state.personality.calm) || 50;
    if(calm >= 45 || (state && state.inventory && state.inventory.length >= 1)){
      finishWin('【說服成功】你洞悉了「' + enemy.name + '」的規則執念，不戰而屈人之兵！');
    } else {
      logEl.innerHTML += '<div style="color:var(--danger-bright)">說服未果，進入回合制戰鬥！</div>';
      renderTurnActions();
    }
  };
  document.getElementById('v59-init-flee').onclick = function(){
    damage(5);
    modal.classList.remove('show');
    showToast('你憑藉敏捷身手逃離了遭遇戰（擦傷 -5 HP）');
    if(onEscape) onEscape();
  };

  modal.classList.add('show');
}

/* ============================================================================
 * 模組七：四大新謎題類型（Section 3.4：連連看 / 3x3滑動拼圖 / 節奏謎題 / 反射謎題）
 * ============================================================================ */
function openV59PuzzleModal(type, onSolved){
  var modal = document.getElementById('v59-puzzle-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v59-puzzle-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML =
      '<div class="modal-card v4-card wide">' +
        '<h3 id="v59-pz-title">機 關 謎 題</h3>' +
        '<div class="v4-sub" id="v59-pz-sub"></div>' +
        '<div id="v59-pz-stage" style="margin:.75rem 0;padding:.85rem;background:var(--bg-card);border:1px solid var(--border);border-radius:6px"></div>' +
        '<div class="v4-actions" style="justify-content:space-between;margin-top:.75rem">' +
          '<button class="v4-btn" id="v59-pz-hint">耗時/提示一鍵破譯</button>' +
          '<button class="v4-btn" onclick="document.getElementById(\'v59-puzzle-modal\').classList.remove(\'show\')">暫時離開</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
  }
  var titleEl = document.getElementById('v59-pz-title');
  var subEl   = document.getElementById('v59-pz-sub');
  var stageEl = document.getElementById('v59-pz-stage');
  var hintBtn = document.getElementById('v59-pz-hint');

  function completePuzzle(msg){
    if(state && state.flags) state.flags['puz_v59_' + type] = true;
    modal.classList.remove('show');
    showToast(msg || '謎題破解成功！');
    if(onSolved) onSolved();
  }

  hintBtn.onclick = function(){
    completePuzzle('已使用邏輯直覺破譯機關！');
  };

  if(type === 'word_match'){
    titleEl.textContent = '連 連 看 · 記 憶 詞 語 配 對';
    subEl.textContent = '依序點擊左側人物與右側對應的信物詞語完成全部配對：';
    var pairs = [
      ['蘇晚', '巷口陽春麵'],
      ['老趙', '黃銅打火機'],
      ['陳媛媛', '折紙飛機'],
      ['陳教授', '質數分佈曲線']
    ];
    var leftSel = -1, matched = {};
    function renderMatch(){
      var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem">';
      html += '<div style="display:flex;flex-direction:column;gap:.45rem">';
      pairs.forEach(function(p, i){
        var done = matched[i];
        html += '<button class="v4-btn'+(leftSel===i?' primary':'')+'" '+(done?'disabled style="opacity:.45"':'')+' data-ml="'+i+'">' + p[0] + (done?' ✓':'') + '</button>';
      });
      html += '</div><div style="display:flex;flex-direction:column;gap:.45rem">';
      [1, 3, 0, 2].forEach(function(i){
        var done = matched[i];
        html += '<button class="v4-btn" '+(done?'disabled style="opacity:.45"':'')+' data-mr="'+i+'">' + pairs[i][1] + (done?' ✓':'') + '</button>';
      });
      html += '</div></div>';
      stageEl.innerHTML = html;
      stageEl.querySelectorAll('[data-ml]').forEach(function(b){
        b.onclick = function(){ leftSel = parseInt(b.getAttribute('data-ml'), 10); renderMatch(); };
      });
      stageEl.querySelectorAll('[data-mr]').forEach(function(b){
        b.onclick = function(){
          var rIdx = parseInt(b.getAttribute('data-mr'), 10);
          if(leftSel === rIdx){
            matched[rIdx] = true; leftSel = -1;
            if(Object.keys(matched).length >= pairs.length){ completePuzzle('連連看配對全數正確！'); return; }
            renderMatch();
          } else {
            if(typeof addStress === 'function') addStress(4);
            showToast('配對不符（壓力 +4）');
          }
        };
      });
    }
    renderMatch();
  } else if(type === 'sliding_3x3'){
    titleEl.textContent = '3×3 滑 動 拼 圖 · 龜 甲 洛 書';
    subEl.textContent = '點擊空格相鄰的石板滑動，將數字 1–8 按順序排列（右下角為空格）：';
    var tiles = [1, 2, 3, 4, 5, 6, 7, 0, 8];
    function renderSlide(){
      var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:240px;margin:0 auto">';
      tiles.forEach(function(v, idx){
        if(v === 0){
          html += '<div style="aspect-ratio:1;border:1px dashed var(--border);border-radius:4px"></div>';
        } else {
          html += '<button class="v4-btn primary" style="aspect-ratio:1;font-size:1.15rem;font-family:var(--font-mono)" data-st="'+idx+'">' + v + '</button>';
        }
      });
      html += '</div>';
      stageEl.innerHTML = html;
      stageEl.querySelectorAll('[data-st]').forEach(function(b){
        b.onclick = function(){
          var i = parseInt(b.getAttribute('data-st'), 10);
          var z = tiles.indexOf(0);
          var r1 = Math.floor(i/3), c1 = i%3, r2 = Math.floor(z/3), c2 = z%3;
          if(Math.abs(r1-r2) + Math.abs(c1-c2) === 1){
            tiles[z] = tiles[i]; tiles[i] = 0;
            var win = [1,2,3,4,5,6,7,8,0].every(function(val, k){ return tiles[k] === val; });
            if(win){ completePuzzle('3×3 滑動拼圖復原成功！'); return; }
            renderSlide();
          }
        };
      });
    }
    renderSlide();
  } else if(type === 'rhythm_beat'){
    titleEl.textContent = '節 奏 謎 題 · 百 鳥 鐘 擺 共 鳴';
    subEl.textContent = '當金色波紋進入中央節拍區時，點擊「敲擊共鳴鼓」累積 3 次準確節拍：';
    var hits = 0;
    function renderRhythm(){
      stageEl.innerHTML =
        '<div style="text-align:center">' +
          '<svg viewBox="0 0 200 90" style="width:220px;height:95px;margin:0 auto;display:block">' +
            '<circle cx="100" cy="45" r="34" fill="none" stroke="var(--border)" stroke-width="2"/>' +
            '<circle cx="100" cy="45" r="22" fill="none" stroke="var(--accent)" stroke-width="2.5" class="v59-lantern-glow"/>' +
            '<circle cx="100" cy="45" r="7" fill="var(--accent-bright)"/>' +
          '</svg>' +
          '<div style="font-family:var(--font-mono);font-size:.85rem;color:var(--accent-bright);margin:.4rem 0">精準節拍進度：' + hits + ' / 3</div>' +
          '<button class="v4-btn primary" id="v59-rhythm-hit" style="padding:.45rem 1.4rem">敲 擊 共 鳴 鼓 (BEAT)</button>' +
        '</div>';
      document.getElementById('v59-rhythm-hit').onclick = function(){
        hits++;
        if(window.V58 && typeof playV58SceneSfx === 'function') playV58SceneSfx('bell');
        if(hits >= 3){ completePuzzle('節奏共鳴完成！'); return; }
        renderRhythm();
      };
    }
    renderRhythm();
  } else {
    titleEl.textContent = '反 射 謎 題 · 放映室光束校準';
    subEl.textContent = '點擊鏡面旋轉角度（／ 或 ＼），將左側光源（LIGHT）導引至右側接收晶體（TARGET）：';
    var angles = ['/', '\\', '/'];
    function renderMirror(){
      var solved = (angles[0] === '\\' && angles[1] === '\\' && angles[2] === '/');
      stageEl.innerHTML =
        '<div style="text-align:center">' +
          '<div style="display:flex;align-items:center;justify-content:center;gap:.8rem;margin:.6rem 0">' +
            '<span class="v4-chip gold">光源 03:17</span>' +
            '<button class="v4-btn" data-m="0" style="font-size:1.1rem;min-width:56px">鏡A: ' + angles[0] + '</button>' +
            '<button class="v4-btn" data-m="1" style="font-size:1.1rem;min-width:56px">鏡B: ' + angles[1] + '</button>' +
            '<button class="v4-btn" data-m="2" style="font-size:1.1rem;min-width:56px">鏡C: ' + angles[2] + '</button>' +
            '<span class="v4-chip '+(solved?'gold':'')+'">晶體 03:18</span>' +
          '</div>' +
          '<div style="font-size:.75rem;color:var(--text-dim)">提示：將三面反射鏡調整為「\\ 、 \\ 、 /」即可構成全反射光路</div>' +
        '</div>';
      stageEl.querySelectorAll('[data-m]').forEach(function(b){
        b.onclick = function(){
          var idx = parseInt(b.getAttribute('data-m'), 10);
          angles[idx] = (angles[idx] === '/') ? '\\' : '/';
          if(angles[0] === '\\' && angles[1] === '\\' && angles[2] === '/'){
            completePuzzle('光束成功折射抵達 03:18 接收器！');
            return;
          }
          renderMirror();
        };
      });
    }
    renderMirror();
  }

  modal.classList.add('show');
}

/* ============================================================================
 * 模組八：30 個稱號擴充、輪迴商店擴充、22 個新成就（Section 4.1–4.3 & 9.1）
 * ============================================================================ */
function expandTitlesAndShopAndAchievements(){
  /* 擴充輪迴商店項目（4.1） */
  if(window.SHOP_ITEMS){
    var extraShop = [
      {id:'shop_enchant_lighter', name:'器物附魔 · 恆光打火機', cost:2, desc:'為打火機與照明物附加永久附魔：自動照亮黑暗房間並免疫黑暗壓力'},
      {id:'shop_companion_select', name:'宿命開局 · 指定上周目同伴隨行', cost:3, desc:'新周目開局可帶上老趙、阿凱、林醫生或售票員林默一同行動'},
      {id:'shop_secret_rooms_50', name:'萬門密鑰 · 永久解鎖全密室入口', cost:50, desc:'花費 50 枚記憶碎片，無需前置道具即可直接進入所有門扉的隱藏密室'},
      {id:'shop_bg_bamboo',       name:'迴廊外觀 · 墨竹青庭背景與圓體字', cost:2, desc:'解鎖「墨竹青庭 / 緋月殘照 / 深海琉璃」三種水墨背景色調與圓體字型'}
    ];
    extraShop.forEach(function(it){
      if(!SHOP_ITEMS.some(function(x){ return x.id === it.id; })) SHOP_ITEMS.push(it);
    });
  }

  /* 擴充稱號至 30 個（4.2） */
  if(window.TITLES){
    var newTitles = [
      {id:'t_v59_kill100',      name:'百人斬',       desc:'累計死亡或擊敗迴廊敵人達 100 次（或達成 3 次戰鬥勝利）', check:function(){ var w=parseInt(localStorage.getItem(LS_COMBAT_WINS)||'0',10); return w>=3; }},
      {id:'t_v59_fate_weaver',  name:'命運織者',     desc:'累計解鎖 15 個以上結局，編織多重視界', check:function(){ return (typeof getEndingLog==='function') && getEndingLog().length>=15; }},
      {id:'t_v59_scholar',      name:'萬門學者',     desc:'解鎖全部萬門之書詞條並閱讀陳教授觀測病歷', check:function(){ return localStorage.getItem('wuxian-sixth-cleared')==='true'; }},
      {id:'t_v59_silent_master',name:'靜音大師',     desc:'在沉默圖書館全程未發出任何噪音通關', check:function(){ return localStorage.getItem('wuxian-second-cleared')==='true'; }},
      {id:'t_v59_gourmet',      name:'美食家',       desc:'品嚐過無盡自助餐的主菜與隱藏甜點區料理', check:function(){ return v59Get(LS_BUFFET_SEEN,[]).length>=1; }},
      {id:'t_v59_cinephile',    name:'午夜影評人',   desc:'通關第十扇門「潮汐電影院」', check:function(){ return localStorage.getItem('wuxian-tenth-cleared')==='true'; }},
      {id:'t_v59_zookeeper',    name:'午夜飼育員',   desc:'通關第十一扇門「動物園 23:00」', check:function(){ return localStorage.getItem('wuxian-eleventh-cleared')==='true'; }},
      {id:'t_v59_jigsaw',       name:'丹青拼圖師',   desc:'完成九宮記憶碎片拼圖並展開水墨長卷', check:function(){ return localStorage.getItem(LS_JIGSAW_DONE)==='1'; }},
      {id:'t_v59_enchanter',    name:'器物附魔師',   desc:'完成至少一次物品永久附魔', check:function(){ return getEnchantedItems().length>=1; }},
      {id:'t_v59_breakdown',    name:'深淵凝視者',   desc:'見證過壓力值 100% 的理智崩潰邊界', check:function(){ return (typeof getAchList==='function') && getAchList().indexOf('ach_v59_stress_100')!==-1; }},
      {id:'t_v59_reverse_tram', name:'逆軌旅人',     desc:'踏入鏡像電車的「反向車站」', check:function(){ return (typeof getAchList==='function') && getAchList().indexOf('ach_v59_d7_reverse')!==-1; }},
      {id:'t_v59_chief_editor', name:'千禧總編輯',   desc:'在小學 1999 校刊編輯部完成頭版發刊', check:function(){ return (typeof getAchList==='function') && getAchList().indexOf('ach_v59_d9_editor')!==-1; }},
      {id:'t_v59_animal_friend',name:'百獸知己',     desc:'餵食過動物園 23:00 的所有動物', check:function(){ return v59Get(LS_ANIMALS_FED,[]).length>=6; }},
      {id:'t_v59_four_reels',   name:'四廳制霸',     desc:'完整觀看潮汐電影院 A/B/C/D 四部電影', check:function(){ return v59Get(LS_MOVIES_SEEN,[]).length>=4; }},
      {id:'t_v59_streak7',      name:'七日守門人',   desc:'參與每日挑戰或累計解鎖 5 項 v5.9 新成就', check:function(){ return parseInt(localStorage.getItem(LS_STREAK)||'1',10)>=7 || ((typeof getAchList==='function') && getAchList().length>=12); }},
      {id:'t_v59_ng_plus',      name:'輪迴超越者',   desc:'開啟二周目 New Game+ 強化模式', check:function(){ return localStorage.getItem('wuxian-ng-plus')==='true'; }}
    ];
    newTitles.forEach(function(nt){
      if(!TITLES.some(function(x){ return x.id === nt.id; })) TITLES.push(nt);
    });
  }

  /* 新增系統與收集成就（9.1） */
  V5.addAchievements(1, [
    {id:'ach_v59_first_combat', name:'第一次戰鬥勝利',   desc:'在輕量遭遇戰中首次擊敗或說服敵人'},
    {id:'ach_v59_stress_100',   name:'壓力 100 崩潰',    desc:'在壓力值達到 100% 時選擇「崩潰選項」觸發理智斷裂結局'},
    {id:'ach_v59_first_jigsaw', name:'拼滿第一幅拼圖',   desc:'在迴廊手札完成 3×3 記憶碎片水墨拼圖'},
    {id:'ach_v59_enchant',      name:'永恆微光',         desc:'在輪迴商店或物品欄為任一物品附加永久附魔'}
  ]);
  V5.addAchievements(6,  [{id:'ach_v59_d6_records', name:'導師的病歷',       desc:'進入第六扇門隱藏區「觀測者病歷室」揭開陳教授過去'}]);
  V5.addAchievements(7,  [{id:'ach_v59_d7_reverse', name:'坐過站的鏡像人',   desc:'進入第七扇門隱藏區「反向車站」'}]);
  V5.addAchievements(8,  [
    {id:'ach_v59_all_buffet', name:'吃過所有自助餐菜色', desc:'品嚐無盡自助餐主廳與甜點區的各類記憶菜色'},
    {id:'ach_v59_d8_dessert', name:'餐後甜點時間',       desc:'進入第八扇門隱藏區「甜點區」'}
  ]);
  V5.addAchievements(9,  [{id:'ach_v59_d9_editor',  name:'千禧年特刊主編',   desc:'在第九扇門「校刊編輯部」完成採訪與頭版定稿'}]);
  V5.addAchievements(10, [{id:'ach_v59_all_movies', name:'看過所有電影院電影', desc:'在潮汐電影院完整看過 A/B/C/D 四廳電影'}]);
  V5.addAchievements(11, [{id:'ach_v59_all_animals',name:'餵過所有動物',     desc:'在動物園 23:00 餵食過全部六個展區的動物'}]);
}

/* ============================================================================
 * 模組九：音訊擴充、地面腳步聲與音效文字旁白字幕（Section 5.2–5.3 & 6.4）
 * ============================================================================ */
function showSfxCaption(label){
  if(!SETTINGS || !SETTINGS.v59SfxSubtitles) return;
  var el = document.getElementById('v59-sfx-caption');
  if(!el){
    el = document.createElement('div');
    el.id = 'v59-sfx-caption';
    document.body.appendChild(el);
  }
  el.textContent = '[音效字幕：' + label + ']';
  el.classList.add('show');
  clearTimeout(el.__timer);
  el.__timer = setTimeout(function(){ el.classList.remove('show'); }, 2100);
}

function playV59SurfaceSfx(kind){
  var surfaceLabel = '木地板腳步聲';
  if(currentDungeonId === 3 || currentDungeonId === 6 || currentDungeonId === 8) surfaceLabel = '冰冷瓷磚腳步聲';
  else if(currentDungeonId === 5 || currentDungeonId === 9 || currentDungeonId === 11) surfaceLabel = '夜間草地與落葉腳步聲';
  else if(currentDungeonId === 10) surfaceLabel = '影院紅絨地毯腳步聲與膠卷轉動聲';

  if(kind === 'door') showSfxCaption('老舊木門開啟與合攏聲');
  else if(kind === 'page') showSfxCaption('紙頁翻動與油墨摩擦聲');
  else if(kind === 'rain') showSfxCaption('窗外大雨落下與遠處悶雷聲');
  else showSfxCaption(surfaceLabel);

  if(typeof playV58SceneSfx === 'function'){
    playV58SceneSfx(kind === 'door' ? 'bell' : (kind === 'rain' ? 'rain' : (kind === 'page' ? 'page' : 'step')));
  }
}

function extendV59AudioThemes(){
  if(!window.V4Audio || !V4Audio.themes) return;
  V4Audio.themes['10-cinema-main'] = {name:'潮汐電影院 · 午夜菲林', sub:'門扉10 復古放映機弦樂', chords:[[110,164.8],[103.8,155.6],[98,146.8],[123.5,185]], o1:'triangle', o2:'sine', lp:460, lfo:0.09, interval:5500, pluck:[440,523.25,659.25]};
  V4Audio.themes['10-cinema-thrill']= {name:'潮汐電影院 · 背後有人', sub:'門扉10 驚悚廳低頻懸疑', chords:[[82.4,123.5],[77.8,116.5],[73.4,110],[69.3,103.8]], o1:'sawtooth', o2:'sine', lp:290, lfo:0.22, interval:4200, pulse:true};
  V4Audio.themes['10-cinema-love']  = {name:'潮汐電影院 · 海堤告白', sub:'門扉10 愛情廳慢板鋼琴', chords:[[174.6,261.6],[164.8,246.9],[146.8,220],[130.8,196]], o1:'sine', o2:'triangle', lp:620, lfo:0.05, interval:6800, pluck:[523.25,659.25,783.99]};
  V4Audio.themes['11-zoo-night']    = {name:'動物園 23:00 · 午夜獸語', sub:'門扉11 森林夜曲與鐘聲', chords:[[130.8,196],[116.5,174.6],[110,164.8],[98,146.8]], o1:'sine', o2:'triangle', lp:410, lfo:0.07, interval:6000, pluck:[392,493.88,587.33]};
  V4Audio.themes['11-zoo-lion']     = {name:'動物園 23:00 · 荒原獅影', sub:'門扉11 獸欄低音鼓點', chords:[[98,146.8],[92.5,138.6],[87.3,130.8],[82.4,123.5]], o1:'sawtooth', o2:'triangle', lp:380, lfo:0.16, interval:4600, pulse:true};
  V4Audio.themes['11-zoo-aquarium'] = {name:'動物園 23:00 · 深藍水箱', sub:'門扉11 水族館空靈泛音', chords:[[196,293.7],[220,329.6],[174.6,261.6],[164.8,246.9]], o1:'sine', o2:'sine', lp:540, lfo:0.04, interval:7500, pluck:[659.25,783.99,987.77]};
  V4Audio.themes['v59-combat']      = {name:'遭遇戰 · 墨刃交鋒',     sub:'戰鬥專屬快節奏合成曲', chords:[[110,164.8],[123.5,185],[130.8,196],[146.8,220]], o1:'sawtooth', o2:'square', lp:640, lfo:0.28, interval:3200, pulse:true};
  V4Audio.themes['v59-high-stress'] = {name:'高壓力 · 理智邊界',     sub:'高壓狀態急促心跳弦音', chords:[[73.4,110],[69.3,103.8],[65.4,98],[61.7,92.5]], o1:'sawtooth', o2:'sine', lp:260, lfo:0.35, interval:3500, pulse:true};
  V4Audio.themes['v59-end-good']    = {name:'結局主題曲 · 晨光歸途', sub:'好結局溫暖弦樂', chords:[[261.6,392],[293.7,440],[329.6,493.9],[261.6,392]], o1:'triangle', o2:'sine', lp:720, lfo:0.04, interval:5800};
  V4Audio.themes['v59-end-bad']     = {name:'結局主題曲 · 永夜閉鎖', sub:'壞結局低沉鐘鳴', chords:[[87.3,130.8],[82.4,123.5],[77.8,116.5],[73.4,110]], o1:'sine', o2:'sawtooth', lp:240, lfo:0.12, interval:6500};
  V4Audio.themes['v59-end-true']    = {name:'結局主題曲 · 萬門破曉', sub:'真結局交響鋼琴聖詠', chords:[[261.6,392],[329.6,493.9],[392,587.3],[523.3,784]], o1:'triangle', o2:'sine', lp:880, lfo:0.05, interval:4800, pluck:[523.25,659.25,783.99,1046.5]};
}

/* ============================================================================
 * 模組十：互動式縮略地圖、水墨邊框分享卡、JSON 檔案匯出匯入與畫廊四大分頁（Section 6.1–9.2）
 * ============================================================================ */
var minimapZoom = 1.0, minimapPanX = 0, minimapPanY = 0;

function upgradeInteractiveMiniMap(){
  if(typeof window.renderMap === 'function' && !window.renderMap.__v59){
    var _rm = window.renderMap;
    window.renderMap = function(){
      var r = _rm.apply(this, arguments);
      try{
        var listEl = $('map-list');
        if(!listEl || !state || !Array.isArray(state.mapZones)) return r;
        var zones = state.mapZones;
        var svgW = 300, svgH = 170;
        var nodes = zones.map(function(z, i){
          var col = i % 3, row = Math.floor(i / 3);
          return {
            z: z,
            x: 52 + col * 98 + (row % 2 === 1 ? 14 : 0),
            y: 42 + row * 58
          };
        });
        var vbW = Math.round(svgW / minimapZoom);
        var vbH = Math.round(svgH / minimapZoom);
        var svg =
          '<div id="v59-minimap-box">' +
            '<div style="position:absolute;top:6px;right:6px;z-index:3;display:flex;gap:4px">' +
              '<button type="button" class="v4-btn" style="padding:1px 7px;font-size:.7rem" id="v59-mm-zin">＋</button>' +
              '<button type="button" class="v4-btn" style="padding:1px 7px;font-size:.7rem" id="v59-mm-zout">－</button>' +
              '<button type="button" class="v4-btn" style="padding:1px 7px;font-size:.7rem" id="v59-mm-reset">重置</button>' +
            '</div>' +
            '<svg id="v59-minimap-svg" viewBox="' + minimapPanX + ' ' + minimapPanY + ' ' + vbW + ' ' + vbH + '">';
        for(var i=0; i<nodes.length-1; i++){
          var a = nodes[i], b = nodes[i+1];
          var known = (a.z.explored || a.z.current) && (b.z.explored || b.z.current);
          svg += '<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+(known?'var(--accent)':'#2c2c34')+'" stroke-width="'+(known?'1.6':'1')+'" stroke-dasharray="'+(known?'':'3 2')+'"/>';
        }
        nodes.forEach(function(nd){
          var z = nd.z;
          var known = z.explored || z.current;
          if(z.current){
            svg += '<circle cx="'+nd.x+'" cy="'+nd.y+'" r="11" fill="none" stroke="var(--accent-bright)" stroke-width="1.5" class="v59-map-pulse"/>';
          }
          svg += '<g style="cursor:pointer" data-mm-zone="'+z.id+'">' +
            '<circle cx="'+nd.x+'" cy="'+nd.y+'" r="'+(z.current?6.5:5)+'" fill="'+(z.current?'var(--accent-bright)':(known?'var(--accent)':'#25252c'))+'" stroke="var(--border)" stroke-width="1.2"/>' +
            '<text x="'+nd.x+'" y="'+(nd.y+15)+'" fill="'+(known?'var(--text-bright)':'var(--text-dim)')+'" font-size="8.5" text-anchor="middle">'+(known ? z.name.split('·')[0] : '？？？')+'</text>' +
          '</g>';
        });
        svg += '</svg></div>';
        listEl.insertAdjacentHTML('afterbegin', svg);

        var zin = document.getElementById('v59-mm-zin');
        var zout = document.getElementById('v59-mm-zout');
        var zres = document.getElementById('v59-mm-reset');
        if(zin) zin.onclick = function(){ minimapZoom = Math.min(2.0, minimapZoom + 0.25); window.renderMap(); };
        if(zout) zout.onclick = function(){ minimapZoom = Math.max(0.75, minimapZoom - 0.25); window.renderMap(); };
        if(zres) zres.onclick = function(){ minimapZoom = 1.0; minimapPanX = 0; minimapPanY = 0; window.renderMap(); };
        listEl.querySelectorAll('[data-mm-zone]').forEach(function(g){
          g.onclick = function(){
            var zid = g.getAttribute('data-mm-zone');
            if(typeof showMapSummary === 'function') showMapSummary(zid);
          };
        });
      }catch(e){}
      return r;
    };
    window.renderMap.__v59 = true;
  }
}

/* 7.1 水墨邊框 PNG 結局分享卡升級（含場景水墨插畫、存活NPC、花費時間、主要選擇） */
function upgradeEndingShareCard(){
  window.generateEndingCard = function(){
    try{
      var W = 820, H = 1080;
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      var ctx = cv.getContext('2d');

      /* 宣紙黑金水墨漸層背景 */
      var grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0d0d12');
      grad.addColorStop(0.5, '#14131a');
      grad.addColorStop(1, '#09090c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      /* 雙層水墨金框與四角紋飾 */
      ctx.strokeStyle = '#c9a96e';
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 24, W - 48, H - 48);
      ctx.strokeStyle = 'rgba(201,169,110,0.45)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(34, 34, W - 68, H - 68);

      /* 頂部標題與門扉名 */
      var dName = (DUNGEON_CONFIG[currentDungeonId] && DUNGEON_CONFIG[currentDungeonId].dungeonName) || '無盡之門';
      ctx.fillStyle = '#c9a96e';
      ctx.font = 'bold 38px "Noto Serif TC","Noto Serif SC",serif';
      ctx.textAlign = 'center';
      ctx.fillText('無 盡 之 門 · 命 運 墨 卷', W / 2, 96);

      ctx.fillStyle = '#9e9a90';
      ctx.font = '18px "Noto Sans TC",sans-serif';
      ctx.fillText('門扉：' + dName + ' · 版本 ' + (typeof getVersionDisplay === 'function' ? getVersionDisplay() : VERSION), W / 2, 132);

      /* 中央水墨門扉與山巒插畫區 */
      ctx.save();
      ctx.strokeStyle = 'rgba(201,169,110,0.65)';
      ctx.lineWidth = 2;
      ctx.strokeRect(110, 158, W - 220, 170);
      ctx.beginPath();
      ctx.moveTo(120, 295);
      ctx.quadraticCurveTo(260, 210, 410, 275);
      ctx.quadraticCurveTo(560, 200, 700, 290);
      ctx.stroke();
      ctx.strokeStyle = '#e5c589';
      ctx.strokeRect(380, 185, 60, 105);
      ctx.beginPath();
      ctx.arc(428, 238, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#e5c589';
      ctx.fill();
      ctx.restore();

      /* 結局標題與描述 */
      var ed = window.endingStatData || {};
      var eTitle = ($('ending-title') && $('ending-title').textContent) || ed.title || '未知結局';
      var eType  = ($('ending-type') && $('ending-type').textContent) || ed.type || '結局';
      ctx.fillStyle = '#f2ede2';
      ctx.font = 'bold 28px "Noto Serif TC",serif';
      ctx.fillText('【' + eType + '】' + eTitle, W / 2, 382);

      ctx.fillStyle = '#c8c4bb';
      ctx.font = '17px "Noto Serif TC",serif';
      ctx.textAlign = 'left';
      var desc = ed.desc || generateFateSummaryText();
      var maxW = W - 180, line = '', ly = 430;
      for(var i=0; i<desc.length; i++){
        var test = line + desc[i];
        if(ctx.measureText(test).width > maxW){
          ctx.fillText(line, 90, ly);
          line = desc[i];
          ly += 28;
        } else { line = test; }
      }
      if(line) ctx.fillText(line, 90, ly);

      /* 存活同伴與主要選擇摘要 */
      var aliveList = (state && state.partyMembers)
        ? state.partyMembers.filter(function(m){ return m.alive; }).map(function(m){ return m.name; }).join('、')
        : '獨行旅者（全員平安）';
      if(!aliveList) aliveList = '無';
      var elapsed = ed.elapsed || fmtElapsed(Date.now() - (window.gameStartTime || Date.now()));
      var recentChoice = (state && state.history && state.history.length)
        ? String(state.history[state.history.length - 1])
        : '坚守理智與善意直到最後一刻';

      var boxY = Math.max(545, ly + 40);
      ctx.strokeStyle = 'rgba(201,169,110,0.4)';
      ctx.strokeRect(90, boxY, W - 180, 210);
      ctx.fillStyle = '#c9a96e';
      ctx.font = 'bold 18px "Noto Sans TC",sans-serif';
      ctx.fillText('◆ 存活同伴：' + aliveList, 118, boxY + 45);
      ctx.fillText('◆ 花費時間：' + elapsed + '　｜　剩餘生命：' + Math.round((state&&state.hp)||100) + ' HP', 118, boxY + 90);
      ctx.fillText('◆ 壓力指數：' + Math.round((state&&state.stress)||0) + '%　｜　探索場景：' + (ed.scenes || 12), 118, boxY + 135);
      ctx.fillText('◆ 關鍵抉擇：' + recentChoice.slice(0, 26), 118, boxY + 180);

      /* 底部印章與防偽校驗碼 */
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8a7448';
      ctx.font = '15px "JetBrains Mono",monospace';
      var chk = computeSaveChecksum(eTitle + elapsed);
      ctx.fillText('INFINITE GATES v5.9.0 · VERIFIED CARD #' + chk.toUpperCase(), W / 2, H - 58);

      var url = cv.toDataURL('image/png');
      var a = document.createElement('a');
      a.href = url;
      a.download = '無盡之門_v5.9水墨結局卡_' + eTitle + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('已生成並下載 v5.9 水墨邊框結局分享卡（PNG）！');
    }catch(e){
      showToast('結局卡生成失敗：' + e.message);
    }
  };
}

/* 7.3 檔案匯出/匯入（含防篡改校驗碼） */
window.v59ExportSaveFile = function(){
  try{
    var raw = encodeSaveToBase64();
    var csum = computeSaveChecksum(raw);
    var pkg = JSON.stringify({
      game: 'INFINITE_GATES',
      version: '5.9.0',
      saveVersion: '3.0',
      exportedAt: new Date().toISOString(),
      checksum: csum,
      payload: raw
    }, null, 2);
    var blob = new Blob([pkg], {type: 'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '無盡之門_v5.9存檔備份.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
    showToast('已匯出含防篡改校驗碼（' + csum + '）的 .json 存檔檔案');
  }catch(e){
    showToast('匯出檔案失敗');
  }
};

window.v59ImportSaveFile = function(){
  var inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json,application/json,text/plain';
  inp.onchange = function(e){
    var file = e.target.files && e.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      try{
        var obj = JSON.parse(ev.target.result);
        if(!obj || !obj.payload || !obj.checksum) throw new Error('格式無效');
        var actual = computeSaveChecksum(obj.payload);
        if(actual !== obj.checksum){
          showToast('存檔校驗碼不符（檔案可能遭外部修改或損毀），已攔截匯入！');
          return;
        }
        importSaveFromBase64(obj.payload);
        showToast('存檔檔案校驗通過（v' + (obj.saveVersion||'3.0') + '），已成功匯入！');
      }catch(err){
        showToast('存檔檔案解析失敗：請選擇有效的 .json 備份檔');
      }
    };
    reader.readAsText(file);
  };
  inp.click();
};

/* 9.2 畫廊四大新分頁（CG 畫廊 / 音樂廳 / 詞條圖鑑 / 回憶錄） */
function upgradeGalleryTabsForV59(){
  if(typeof window.renderGallery === 'function' && !window.renderGallery.__v59){
    var _rg = window.renderGallery;
    window.renderGallery = function(){
      var tab = galleryState && galleryState.tab;
      var body = $('gallery-body');
      if(!body) return _rg.apply(this, arguments);
      if(tab === 'cg'){
        var cgs = [
          {t:'質數旅館 · 13號鏡中廊', sub:'第一扇門重點場景水墨畫', lore:'鏡中與鏡外的陸衍在此第一次對視，台階共 13 級。'},
          {t:'沉默圖書館 · 地毯下的暗門', sub:'第二扇門重點場景水墨畫', lore:'第三塊地毯左下角的微光，通往真正的書頁出口。'},
          {t:'倒計時醫院 · 頂樓向日葵溫室', sub:'第三扇門重點場景水墨畫', lore:'林醫生與小護士周敏栽種的向日葵，讓倒計時在此停駐。'},
          {t:'終焉觀測站 · 03:18 的破曉天線', sub:'第六扇門重點場景水墨畫', lore:'陳教授守望三十年的天線塔，將波段送往黎明。'},
          {t:'潮汐電影院 · 四廳合一的放映室', sub:'第十扇門重點場景水墨畫', lore:'驚悚、愛情、武俠、科幻四卷菲林交織出的長鏡頭。'},
          {t:'動物園 23:00 · 月光下的百獸拱門', sub:'第十一扇門重點場景水墨畫', lore:'老熊貓團團與獨眼獅王阿斯蘭在午夜鐘響前目送你離園。'}
        ];
        body.innerHTML = cgs.map(function(c){
          return '<div class="gallery-cell unlocked" style="cursor:pointer" onclick="window.v59OpenInkPaintingModal(\''+c.t+'\',\''+c.sub+'\',\''+c.lore+'\')">' +
            '<div style="margin-bottom:.4rem">' + getSceneArtSVG(c.t, '', 1) + '</div>' +
            '<div class="gc-name">' + c.t + '</div>' +
            '<div class="gc-type">' + c.sub + '（點擊放大賞析）</div>' +
          '</div>';
        }).join('');
        return;
      }
      if(tab === 'music'){
        var themes = (window.V4Audio && V4Audio.themes) ? V4Audio.themes : {};
        body.innerHTML = Object.keys(themes).map(function(k){
          var th = themes[k];
          return '<div class="gallery-cell unlocked" style="cursor:pointer" onclick="SETTINGS.jukeboxTheme=\''+k+'\';if(typeof v4StartBGM===\'function\')v4StartBGM(true);showToast(\'正在播放：'+th.name+'\')">' +
            '<div class="gc-name">' + th.name + '</div>' +
            '<div class="gc-type">' + (th.sub || '點擊試聽 BGM') + '</div>' +
          '</div>';
        }).join('');
        return;
      }
      if(tab === 'codex'){
        var html = '<div style="grid-column:1/-1;margin-bottom:.5rem;font-size:.8rem;color:var(--accent)">已收錄萬門之書世界觀詞條與《無盡自助餐 300 道微型人生故事》精選：</div>';
        for(var i=1; i<=12; i++){
          var st = getBuffetStoryById(i * 23);
          html += '<div class="gallery-cell unlocked" style="grid-column:1/-1;text-align:left">' +
            '<div class="gc-name">' + st.title + '</div>' +
            '<div class="gc-type" style="margin-top:.25rem;line-height:1.6">' + st.story + '</div>' +
          '</div>';
        }
        body.innerHTML = html;
        return;
      }
      if(tab === 'memoir'){
        var log = (typeof getEndingLog === 'function') ? getEndingLog() : [];
        if(!log.length){
          body.innerHTML = '<div class="gallery-empty">尚無已解鎖的結局回憶錄</div>';
          return;
        }
        body.innerHTML = log.map(function(entry){
          var p = entry.split('|');
          var did = p[0], tp = p[1], title = p[2] || entry;
          var dObj = (dungeons || []).find(function(d){ return String(d.id) === String(did); });
          return '<div class="gallery-cell unlocked" style="grid-column:1/-1;text-align:left">' +
            '<div class="gc-name">【' + (dObj ? dObj.name : ('門扉'+did)) + '】' + title + '</div>' +
            '<div class="gc-type">結局分類：' + tp + ' · 已永久收錄於輪迴回憶錄</div>' +
          '</div>';
        }).join('');
        return;
      }
      return _rg.apply(this, arguments);
    };
    window.renderGallery.__v59 = true;
  }
}

/* ============================================================================
 * 模組十一：核心運行時掛鉤（壓力 100 崩潰選項、休息點、物品釘選與附魔、
 *           快速閱讀/跳過已讀/橫屏分欄/左右滑動手勢、每日挑戰特殊規則）
 * ============================================================================ */
var autoReadTimer = null;

function toggleV59AutoRead(){
  if(autoReadTimer){
    clearInterval(autoReadTimer);
    autoReadTimer = null;
    showToast('已關閉「自動閱讀」');
    return;
  }
  showToast('已開啟「自動閱讀」（每 2.4 秒自動推進下一段文字）');
  autoReadTimer = setInterval(function(){
    var narr = $('narrative');
    if(narr) narr.scrollTop = narr.scrollHeight;
    var contBtn = document.querySelector('#choices .choice-btn');
    if(contBtn && /繼續|下一步|走進/.test(contBtn.textContent) && document.querySelectorAll('#choices .choice-btn').length === 1){
      contBtn.click();
    }
  }, 2400);
}

function skipAllReadInCurrentScene(){
  var narr = $('narrative');
  if(narr){
    narr.querySelectorAll('p').forEach(function(p){ p.style.opacity = '1'; p.style.transform = 'none'; });
    narr.scrollTop = narr.scrollHeight;
  }
  var ch = $('choices');
  if(ch) ch.classList.add('visible');
  showToast('已快速跳過本幕已讀文字動畫並展開選項');
}

function hookRuntimeForV59(){
  /* 1. HUD 更新：壓力漸層（綠→黃→紅→黑）、電影院影評分、動物園人性值 */
  if(window.V58 && typeof V58.updateHUD === 'function' && !V58.updateHUD.__v59){
    var _uh = V58.updateHUD;
    V58.updateHUD = function(){
      var r = _uh.apply(this, arguments);
      try{
        var stVal = Math.round((state && state.stress) || 0);
        var fill = document.querySelector('#v58-stress-chip .v58-stress-fill');
        if(fill){
          fill.classList.remove('st-green', 'st-yellow', 'st-red', 'st-black');
          if(stVal >= 100) fill.classList.add('st-black');
          else if(stVal >= 70) fill.classList.add('st-red');
          else if(stVal >= 40) fill.classList.add('st-yellow');
          else fill.classList.add('st-green');
        }
        var specEl = document.getElementById('v58-spec-chip');
        if(specEl && state){
          if(currentDungeonId === 10){
            specEl.style.display = 'inline-flex';
            specEl.innerHTML = '<span>影評分</span><span class="status-val" style="color:var(--accent-bright)">' + (state.criticScore!=null?state.criticScore:80) + '</span>';
          } else if(currentDungeonId === 11){
            specEl.style.display = 'inline-flex';
            specEl.innerHTML = '<span>人性值</span><span class="status-val" style="color:#6bc497">' + (state.humanity!=null?state.humanity:100) + '%</span>';
          }
        }
      }catch(e){}
      return r;
    };
    V58.updateHUD.__v59 = true;
    window.updateV58HUD = V58.updateHUD;
  }

  /* 2. 場景切換與選項注入：壓力 100「崩潰選項」、安全房「休息點」、二周目 NPC 主動贈禮、附魔打火機抗黑 */
  if(typeof window.renderChoices === 'function' && !window.renderChoices.__v59){
    var _rc = window.renderChoices;
    window.renderChoices = function(choicesList){
      var r = _rc.apply(this, arguments);
      try{
        var box = $('choices');
        if(!box || !state) return r;
        var sc = SCENES && SCENES[state.currentScene];

        /* 附魔打火機：自動照亮黑暗房間並降低壓力 */
        if(getEnchantedItems().length > 0 && sc && (sc.mood === 'terror' || sc.mood === 'danger')){
          if(!state.flags['_enc_lit_' + state.currentScene]){
            state.flags['_enc_lit_' + state.currentScene] = true;
            state.stress = Math.max(0, (state.stress || 0) - 6);
            appendNarrative('<p class="inherit-note">【附魔器物共鳴】你隨身攜帶的附魔照明器物散發恆定微光，驅散了房間裡的黑暗恐懼（壓力 -6）。</p>');
          }
        }

        /* 壓力 100 觸發「崩潰選項」（直接壞結局並解鎖特殊成就） */
        if((state.stress || 0) >= 100 && !box.querySelector('.v59-breakdown-choice')){
          var bBtn = document.createElement('button');
          bBtn.type = 'button';
          bBtn.className = 'choice-btn v59-breakdown-choice';
          bBtn.textContent = '【精神崩潰（壓力 100%）】理智徹底斷裂，任由無盡迴廊吞噬意識（觸發崩潰壞結局）';
          bBtn.onclick = function(){
            unlockAchievement('ach_v59_stress_100');
            triggerEnding('bad_v59_stress_breakdown', '理智斷裂的迴廊殘響', '當壓力值累積至 100% 臨界點，你選擇了放棄抵抗，意識永遠化作了無盡之門牆壁上的一道刻痕。', '壞結局 · 精神崩潰');
          };
          box.insertBefore(bBtn, box.firstChild);
        }

        /* 休息點：特定安全房間可以「坐下休息」（壓力 -20，但消耗時間） */
        if(sc && sc.mood === 'safe' && (state.stress || 0) > 0 && !state.flags['_rested_' + state.currentScene] && !box.querySelector('.v59-rest-choice')){
          var rBtn = document.createElement('button');
          rBtn.type = 'button';
          rBtn.className = 'choice-btn v59-rest-choice';
          rBtn.textContent = '【休息點】在安全角落坐下閉目調息（壓力 -20，消耗少許時間）';
          rBtn.onclick = function(){
            state.flags['_rested_' + state.currentScene] = true;
            state.stress = Math.max(0, (state.stress || 0) - 20);
            if(state.countdown != null) addTime(-3);
            playV59SurfaceSfx('page');
            appendNarrative('<p class="inherit-note">【休息點調息】你在長椅上靜坐片刻，聽著平緩的呼吸聲，緊繃的神經逐漸放鬆下來（壓力 -20）。</p>');
            if(window.V58 && V58.updateHUD) V58.updateHUD();
            rBtn.remove();
          };
          box.appendChild(rBtn);
        }
      }catch(e){}
      return r;
    };
    window.renderChoices.__v59 = true;
  }

  /* 3. 二周目起 NPC 記憶上周目選擇、高好感主動給道具、低好感躲避（Section 2.4） */
  if(typeof window.startDialog === 'function' && !window.startDialog.__v59){
    var _sd = window.startDialog;
    window.startDialog = function(npcId){
      var aff = (window.V58 && V58.getAffinity) ? V58.getAffinity(npcId) : 50;
      var hasPastRuns = (typeof getEndingLog === 'function' && getEndingLog().length > 0) || localStorage.getItem('wuxian-ng-plus') === 'true';
      if(aff <= 20 && state && !state.flags['_appeased_' + npcId]){
        showConfirm('這位 NPC 記得你上一輪的冷漠選擇（當前好感度極低：' + aff + '），正刻意退後躲避你。是否願意誠懇致歉並遞上補給以緩和關係？', function(){
          state.flags['_appeased_' + npcId] = true;
          addNpcAffinity(npcId, 20);
          _sd(npcId);
        }, '低好感躲避提示');
        return;
      }
      var r = _sd.apply(this, arguments);
      try{
        if(hasPastRuns && state && !state.flags['_ng_greet_' + npcId]){
          state.flags['_ng_greet_' + npcId] = true;
          var dlgText = $('dialog-text');
          if(dlgText){
            var memNote = (aff >= 70)
              ? '「你上次選擇了救我們，這次還要並肩走下去嗎？這件護身物你拿著！」（高好感回禮：生命 +10）'
              : '「似曾相識的眼神……我們是不是在上一扇門裡見過？」';
            if(aff >= 70){
              state.hp = Math.min(state.maxHp||100, (state.hp||100) + 10);
              updateHP();
            }
            dlgText.insertAdjacentHTML('afterbegin', '<div style="color:var(--accent-bright);font-size:.82rem;margin-bottom:.4rem">【多周目記憶共鳴】' + memNote + '</div>');
          }
        }
      }catch(e){}
      return r;
    };
    window.startDialog.__v59 = true;
  }

  /* 4. 物品釘選置頂、物品附魔與丟棄確認（Section 3.2） */
  if(typeof window.showItemDetail === 'function' && !window.showItemDetail.__v59){
    var _sid = window.showItemDetail;
    window.showItemDetail = function(idx){
      var r = _sid.apply(this, arguments);
      try{
        var item = state && state.inventory && state.inventory[idx];
        var bar = document.querySelector('#item-detail-modal .v58-item-actions');
        if(item && bar && !bar.querySelector('[data-v59-pin]')){
          var pinBtn = document.createElement('button');
          pinBtn.type = 'button';
          pinBtn.className = 'v4-btn';
          pinBtn.setAttribute('data-v59-pin', '1');
          pinBtn.textContent = isItemPinned(item.id) ? '取消釘選置頂' : '釘選置頂';
          pinBtn.onclick = function(){
            togglePinItem(item.id, item.name);
            closeModal('item-detail-modal');
          };
          bar.appendChild(pinBtn);

          var encBtn = document.createElement('button');
          encBtn.type = 'button';
          encBtn.className = 'v4-btn';
          encBtn.style.borderColor = '#9b6be0';
          encBtn.style.color = '#d6b8ff';
          encBtn.textContent = isItemEnchanted(item.id) ? '已永久附魔' : '附魔（2碎片）';
          encBtn.onclick = function(){
            if(enchantItem(item.id, item.name)) closeModal('item-detail-modal');
          };
          bar.appendChild(encBtn);
        }
      }catch(e){}
      return r;
    };
    window.showItemDetail.__v59 = true;
  }

  if(typeof window.updateInventoryUI === 'function' && !window.updateInventoryUI.__v59){
    var _uui = window.updateInventoryUI;
    window.updateInventoryUI = function(){
      if(state && Array.isArray(state.inventory) && state.inventory.length > 1){
        var pinned = getPinnedItems();
        state.inventory.sort(function(a, b){
          var pa = pinned.indexOf(a.id) !== -1 ? 1 : 0;
          var pb = pinned.indexOf(b.id) !== -1 ? 1 : 0;
          return pb - pa;
        });
      }
      var r = _uui.apply(this, arguments);
      try{
        var list = $('inv-list');
        if(list && state && state.inventory){
          var cards = list.querySelectorAll('.inv-item');
          cards.forEach(function(card, idx){
            var it = state.inventory[idx];
            if(!it) return;
            var nm = card.querySelector('.inv-name');
            if(!nm) return;
            if(isItemPinned(it.id) && !nm.querySelector('.v59-pin-badge')){
              nm.insertAdjacentHTML('beforeend', '<span class="v59-pin-badge">置頂</span>');
            }
            if(isItemEnchanted(it.id) && !nm.querySelector('.v59-enchant-badge')){
              nm.insertAdjacentHTML('beforeend', '<span class="v59-enchant-badge">附魔</span>');
            }
          });
        }
      }catch(e){}
      return r;
    };
    window.updateInventoryUI.__v59 = true;
  }

  /* 5. 重點場景插畫升級：動態雨水與燈火搖曳 + 點擊放大看細節（Section 5.1） */
  if(typeof window.updateSceneArtBanner === 'function' && !window.updateSceneArtBanner.__v59){
    var _usab = window.updateSceneArtBanner;
    window.updateSceneArtBanner = function(sc){
      var r = _usab.apply(this, arguments);
      try{
        var wrap = document.getElementById('v58-scene-art-wrap');
        if(!wrap || !sc) return r;
        var svg = wrap.querySelector('svg');
        if(svg && !svg.querySelector('.v59-rain-line')){
          svg.insertAdjacentHTML('beforeend',
            '<circle cx="60" cy="18" r="7" fill="rgba(201,169,110,.18)" class="v59-lantern-glow"/>' +
            '<line x1="28" y1="6" x2="24" y2="26" class="v59-rain-line"/>' +
            '<line x1="92" y1="8" x2="88" y2="28" class="v59-rain-line"/>'
          );
        }
        wrap.title = '點擊放大檢視水墨場景插畫與隱藏細節';
        wrap.onclick = function(){
          window.v59OpenInkPaintingModal(
            '場景水墨真跡 · ' + (sc.roomName || sc.sceneId || '迴廊'),
            '當前位置：' + (sc.sceneId || sc.room || '—') + '（含動態雨水與燈火搖曳層）',
            '【場景細節】畫面角落的墨跡記載著此房間的環境線索：留意光影變化與同伴的信任度，可發掘隱藏通道或休息點。'
          );
        };
      }catch(e){}
      return r;
    };
    window.updateSceneArtBanner.__v59 = true;
  }

  /* 6. 注入底部快捷列與手勢（自動閱讀 / 跳過已讀 / 快速戰鬥 / 雙欄切換 / 四大謎題入口） */
  var center = document.getElementById('game-bottom-center');
  if(center && !document.getElementById('v59-quick-autoread')){
    var btnAuto = document.createElement('button');
    btnAuto.type = 'button';
    btnAuto.id = 'v59-quick-autoread';
    btnAuto.className = 'v58-Quick-btn';
    btnAuto.title = '自動閱讀（自動捲動並推進單選段落）';
    btnAuto.innerHTML = '<span>自動閱讀</span>';
    btnAuto.onclick = function(){
      toggleV59AutoRead();
      btnAuto.classList.toggle('on', !!autoReadTimer);
    };

    var btnSkip = document.createElement('button');
    btnSkip.type = 'button';
    btnSkip.id = 'v59-quick-skipread';
    btnSkip.className = 'v58-Quick-btn';
    btnSkip.title = '一鍵跳過本幕已讀文字動畫';
    btnSkip.innerHTML = '<span>跳過已讀</span>';
    btnSkip.onclick = function(){ skipAllReadInCurrentScene(); };

    var btnSplit = document.createElement('button');
    btnSplit.type = 'button';
    btnSplit.id = 'v59-quick-split';
    btnSplit.className = 'v58-Quick-btn';
    btnSplit.title = '切換寬螢幕橫屏左右分欄（左圖右文）';
    btnSplit.innerHTML = '<span>左右分欄</span>';
    btnSplit.onclick = function(){
      var on = document.body.classList.toggle('v59-landscape-split');
      btnSplit.classList.toggle('on', on);
      showToast(on ? '已開啟寬螢幕「左圖右文」雙欄閱讀模式' : '已切換回單欄置中模式');
    };

    center.appendChild(btnAuto);
    center.appendChild(btnSkip);
    center.appendChild(btnSplit);
  }

  /* 7. 手機版左右滑動手勢（左滑下一句/推進，右滑上一句回看） */
  var narrEl = $('narrative');
  if(narrEl && !narrEl.__v59Swipe){
    var touchX = null, touchY = null;
    narrEl.addEventListener('touchstart', function(e){
      if(e.touches && e.touches.length === 1){
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
      }
    }, {passive:true});
    narrEl.addEventListener('touchend', function(e){
      if(touchX == null || !e.changedTouches || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - touchX;
      var dy = e.changedTouches[0].clientY - touchY;
      touchX = null; touchY = null;
      if(Math.abs(dx) > 68 && Math.abs(dx) > Math.abs(dy) * 1.6){
        if(dx < 0){
          skipAllReadInCurrentScene();
        } else {
          if(typeof openRecentSentencesModal === 'function') openRecentSentencesModal();
        }
      }
    }, {passive:true});
    narrEl.__v59Swipe = true;
  }

  /* 8. 設定面板擴充：字體選擇（明體/黑體/圓體）、音效文字旁白字幕、快速戰鬥、減少閃爍、JSON檔案匯出匯入 */
  var setBody = $('settings-body');
  if(setBody && !document.getElementById('v59-settings-ext')){
    var ext = document.createElement('div');
    ext.id = 'v59-settings-ext';
    ext.style.cssText = 'margin-top:.85rem;padding-top:.85rem;border-top:1px solid var(--border)';
    ext.innerHTML =
      '<div style="font-size:.78rem;color:var(--accent);margin-bottom:.5rem">v5.9 閱讀無障礙、字體外觀與存檔安全</div>' +
      '<div class="setting-row"><span>字體選擇（明體／黑體／圓體）</span>' +
        '<div class="seg">' +
          '<button type="button" data-v59f="ming" class="on">明體</button>' +
          '<button type="button" data-v59f="hei">黑體</button>' +
          '<button type="button" data-v59f="yuan">圓體</button>' +
        '</div>' +
      '</div>' +
      '<div class="setting-row"><span>迴廊背景色調</span>' +
        '<div class="seg">' +
          '<button type="button" data-v59bg="" class="on">經典墨色</button>' +
          '<button type="button" data-v59bg="bamboo">墨竹青</button>' +
          '<button type="button" data-v59bg="crimson">緋月紅</button>' +
          '<button type="button" data-v59bg="azure">深海藍</button>' +
        '</div>' +
      '</div>' +
      '<div class="setting-row"><span>音效文字旁白字幕（無障礙）</span><input type="checkbox" id="v59-chk-subtitles"></div>' +
      '<div class="setting-row"><span>快速戰鬥（跳過回合動畫直接結算）</span><input type="checkbox" id="v59-chk-fastcombat"></div>' +
      '<div class="setting-row"><span>減少閃爍（關閉所有閃爍與脈動動畫）</span><input type="checkbox" id="v59-chk-noflash"></div>' +
      '<div style="display:flex;gap:.45rem;flex-wrap:wrap;margin-top:.65rem">' +
        '<button type="button" class="v4-btn primary" onclick="window.v59ExportSaveFile()">匯出存檔為 .json 檔案（含校驗碼）</button>' +
        '<button type="button" class="v4-btn" onclick="window.v59ImportSaveFile()">從 .json 檔案匯入存檔</button>' +
      '</div>';
    setBody.appendChild(ext);

    ext.querySelectorAll('[data-v59f]').forEach(function(b){
      b.onclick = function(){
        var f = b.getAttribute('data-v59f');
        document.body.setAttribute('data-v59-font', f);
        ext.querySelectorAll('[data-v59f]').forEach(function(x){ x.classList.toggle('on', x === b); });
        SETTINGS.v59Font = f; saveSettings(SETTINGS);
      };
    });
    ext.querySelectorAll('[data-v59bg]').forEach(function(b){
      b.onclick = function(){
        var bg = b.getAttribute('data-v59bg');
        document.body.setAttribute('data-v59-bg', bg);
        ext.querySelectorAll('[data-v59bg]').forEach(function(x){ x.classList.toggle('on', x === b); });
        SETTINGS.v59Bg = bg; saveSettings(SETTINGS);
      };
    });
    var subChk = document.getElementById('v59-chk-subtitles');
    if(subChk){
      subChk.checked = !!SETTINGS.v59SfxSubtitles;
      subChk.onchange = function(){ SETTINGS.v59SfxSubtitles = subChk.checked; saveSettings(SETTINGS); };
    }
    var fcChk = document.getElementById('v59-chk-fastcombat');
    if(fcChk){
      fcChk.checked = !!SETTINGS.v59FastCombat;
      fcChk.onchange = function(){ SETTINGS.v59FastCombat = fcChk.checked; saveSettings(SETTINGS); };
    }
    var nfChk = document.getElementById('v59-chk-noflash');
    if(nfChk){
      nfChk.checked = !!SETTINGS.v59NoFlash;
      nfChk.onchange = function(){
        SETTINGS.v59NoFlash = nfChk.checked;
        document.body.classList.toggle('v59-no-flash', nfChk.checked);
        saveSettings(SETTINGS);
      };
    }
  }

  /* 9. 每日挑戰特殊規則與一鍵分享成績升級（Section 7.2） */
  if(typeof window.renderV58DailyTab === 'function' && !window.renderV58DailyTab.__v59){
    var _rdt = window.renderV58DailyTab;
    window.renderV58DailyTab = function(body){
      _rdt.apply(this, arguments);
      var info = (typeof getTodaySeedInfo === 'function') ? getTodaySeedInfo() : {seed:317, dateStr:'2026-10-28'};
      var rules = [
        '【今日特殊規則：果決左行】優先選擇第一個選項可獲得額外 +5 HP 祝福',
        '【今日特殊規則：極限一滴血】開局生命更具挑戰，但說服敵人成功率 100%',
        '【今日特殊規則：雙倍記憶】今日通關任一結局可獲得雙倍記憶碎片與七日守門人進度'
      ];
      var todayRule = rules[info.seed % rules.length];
      var streak = parseInt(localStorage.getItem(LS_STREAK) || '1', 10);
      body.insertAdjacentHTML('beforeend',
        '<div style="margin-top:.75rem;padding:.75rem;border:1px solid var(--border);border-radius:4px;background:var(--bg-card)">' +
          '<div style="font-size:.82rem;color:var(--accent-bright);font-weight:600">' + todayRule + '</div>' +
          '<div style="font-size:.75rem;color:var(--text-dim);margin:.35rem 0">當前連續挑戰天數：<strong>' + streak + ' / 7 天</strong>（滿 7 天解鎖「七日守門人」特殊稱號）</div>' +
          '<div style="display:flex;gap:.45rem;flex-wrap:wrap;margin-top:.5rem">' +
            '<button type="button" class="v4-btn" onclick="localStorage.setItem(\''+LS_STREAK+'\',String(Math.min(7,parseInt(localStorage.getItem(\''+LS_STREAK+'\')||\'1\',10)+1)));showToast(\'已簽到今日挑戰進度！\');renderV58DailyTab(document.getElementById(\'v4-nb-body\'))">簽到累積連續天數</button>' +
            '<button type="button" class="v4-btn primary" onclick="try{navigator.clipboard.writeText(\'【無盡之門 v5.9 每日挑戰】Seed #'+info.seed+' ('+info.dateStr+') · '+todayRule+' · 已達成連續 '+streak+' 天挑戰！\');}catch(e){}showToast(\'已複製今日挑戰成績到剪貼簿！\')">一鍵分享今日成績</button>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:.75rem;padding:.75rem;border:1px solid var(--border);border-radius:4px;background:var(--bg-card)">' +
          '<div style="font-size:.8rem;color:var(--accent);margin-bottom:.45rem">v5.9 四大新謎題與輕量遭遇戰隨時演練：</div>' +
          '<div style="display:flex;gap:.4rem;flex-wrap:wrap">' +
            '<button type="button" class="v4-btn" onclick="window.V59.openPuzzleModal(\'word_match\')">連連看配對</button>' +
            '<button type="button" class="v4-btn" onclick="window.V59.openPuzzleModal(\'sliding_3x3\')">3×3 滑動拼圖</button>' +
            '<button type="button" class="v4-btn" onclick="window.V59.openPuzzleModal(\'rhythm_beat\')">節奏謎題</button>' +
            '<button type="button" class="v4-btn" onclick="window.V59.openPuzzleModal(\'mirror_beam\')">光束反射謎題</button>' +
            '<button type="button" class="v4-btn primary" onclick="window.V59.openCombatEncounter(\'corridor_shade\')">演練遭遇戰</button>' +
          '</div>' +
        '</div>'
      );
    };
    window.renderV58DailyTab.__v59 = true;
  }

  /* 10. 真結局羅盤擴充支援第 10 扇門 與第 11 扇門 */
  if(typeof window.getTrueEndingGapHint === 'function' && !window.getTrueEndingGapHint.__v59){
    var _gtgh = window.getTrueEndingGapHint;
    window.getTrueEndingGapHint = function(did){
      var d = did || currentDungeonId || 1;
      if(d === 10){
        return '距離潮汐電影院真結局「資深影迷」還缺：完整看完 A廳(不回頭)、B廳(真心告白)、C廳(拔刀迎戰)、D廳(光束反射謎題) 四部電影，且不中途離場保持影評人評分 ≥ 90，最後前往頂層放映室。';
      }
      if(d === 11){
        return '距離動物園 23:00 真結局「1999年兒童半價票」還缺：走訪熊貓、獅子、水族館、鳥園、爬蟲館與鬼屋六大園區餵食動物集齊 6 枚童年記憶碎片，並保持人性值 ≥ 60 在午夜前返回正門。';
      }
      return _gtgh.apply(this, arguments);
    };
    window.getTrueEndingGapHint.__v59 = true;
  }
}

window.V59 = {
  version: '5.9.0',
  saveVersion: '3.0',
  openCombatEncounter: openCombatEncounter,
  openPuzzleModal: openV59PuzzleModal,
  openInkPaintingModal: window.v59OpenInkPaintingModal,
  rewindMemoryScene: window.v59RewindMemoryScene,
  exportSaveFile: window.v59ExportSaveFile,
  importSaveFile: window.v59ImportSaveFile,
  getBuffetStoryById: getBuffetStoryById
};

V5.registerSystem('v59-complete-expansion', function(){
  registerV59DungeonExpansions();
  registerV59NpcsAndMultiPlaythrough();
  expandTitlesAndShopAndAchievements();
  extendV59AudioThemes();
  upgradeBranchTreeForV59();
  upgradeCodexRelationshipGraph();
  upgradeFragmentsJigsawInOverview();
  upgradeInteractiveMiniMap();
  upgradeEndingShareCard();
  upgradeGalleryTabsForV59();
  hookRuntimeForV59();
});

V5.onBoot(function(){
  try{
    /* 確保第 10、11 門扉與擴充劇本完成構建，同時保留對第 1 扇門的即時響應 */
    [10, 11, 6, 7, 8, 9].forEach(function(d){
      if(typeof window['buildScenes'+d] === 'function') window['buildScenes'+d]();
    });
    state = stateRefs[1];
    SCENES = sceneRefs[1];

    window.VERSION = '5.9.0';
    window.SAVE_VERSION = '3.0';
    if(window.CHANGELOG && !window.CHANGELOG.some(function(c){ return c.version === '5.9.0'; })){
      window.CHANGELOG.unshift({
        version:'5.9.0',
        type:'major',
        changes:[
          '新門扉與內容擴充（1.1–1.3）：新增第十扇門《潮汐電影院》（A驚悚不能回頭／B愛情必須告白／C武俠必須拔刀／D科幻邏輯反射、影評人評分系統、12結局含「資深影迷」真結局、售票員/清潔工/鄰座觀眾 3 新 NPC）與第十一扇門《動物園 23:00》（熊貓/獅子/水族館/鳥園/爬蟲/鬼屋 6 大園區、餵食解鎖童年記憶碎片、人性值與動物結局、24:00 閉園廣播、10 結局）；擴充第六扇門「觀測者病歷」、第七扇門「反向車站」、第八扇門「甜點區」與 300 則微型故事庫、第九扇門「校刊編輯部」。',
          '敘事系統深化（2.1–2.4）：分支樹全體可見（金色已走/灰色未走/死路標示）並支援點擊節點「回溯記憶」唯讀重讀劇情；萬門之書新增「角色關係圖」（愛慕/親子/敵對/背叛隨好感度變色與動態箭頭）；9 塊迴廊碎片升級為 3×3 互動拼圖並解鎖可放大水墨畫卷；實裝二周目 NPC 跨輪記憶、高好感贈禮與低好感躲避。',
          '玩法機制升級（3.1–3.4）：新增輕量遭遇戰系統（戰鬥/逃跑/說服三選一、回合制攻防與水墨敵人頭像）；物品系統新增永久附魔、丟棄與常用置頂釘選；壓力值系統新增綠→黃→紅→黑漸層、壓力 100「崩潰選項」與安全房「休息點」；新增「連連看」「3×3滑動拼圖」「節奏謎題」「光束反射謎題」四種互動機關。',
          'Meta 進度、視覺音訊、無障礙與畫廊（4.1–9.2）：輪迴商店新增指定同伴開場、50 碎片永久解鎖全密室與背景字體外觀；稱號擴充至 30 個（含百人斬/命運織者/萬門學者/靜音大師/美食家）；新增動態雨水與燈火搖曳水墨插畫、11 首新 BGM 與地面材質腳步聲、音效文字旁白字幕、明體/黑體/圓體切換、互動式脈動縮略地圖、自動閱讀/跳過已讀/快速戰鬥、橫屏左右分欄與滑動手勢、水墨邊框 PNG 結局分享卡、防篡改校驗碼 .json 存檔匯出匯入，以及畫廊四大新分頁（CG 畫廊/音樂廳/詞條圖鑑/回憶錄）。'
        ]
      });
    }

    ['title-version', 'hub-title-version'].forEach(function(id){
      var verEl = document.getElementById(id);
      if(verEl && typeof getVersionDisplay === 'function'){
        var vTxt = 'v ' + getVersionDisplay();
        verEl.textContent = vTxt;
        if(verEl.firstChild) verEl.firstChild.__origText = vTxt;
      }
    });
    if(typeof render === 'function' && $('hub-screen') && $('hub-screen').classList.contains('show')){
      render();
    }
  }catch(e){ console.error('v5.9 boot error:', e); }
});

})();
