
(function(){
'use strict';
if(!window.V5 || window.V5.__v58Loaded) return;
window.V5.__v58Loaded = true;


/* ============================================================
 * 一、新內容擴充（1.1 新門扉七、八、九 & 1.2 現有門扉真結局/密室/NPC支線）
 * ============================================================ */
function buildDualNarrativeHTML(leftTitle, leftText, rightTitle, rightText, mirrorHp){
  var mHp = (mirrorHp != null) ? mirrorHp : ((window.state && state.mirrorHp != null) ? state.mirrorHp : 100);
  var pHp = (window.state && state.hp != null) ? state.hp : 100;
  return '<div class="v58-dual-narrative">' +
    '<div class="v58-dual-col v58-dual-left">' +
      '<div class="v58-dual-hdr"><span>【左頁 · 正側車廂（你）】</span><span>HP ' + pHp + '</span></div>' +
      '<div>' + leftText + '</div>' +
    '</div>' +
    '<div class="v58-dual-col v58-dual-right">' +
      '<div class="v58-dual-hdr"><span>【右頁 · 鏡像車廂（倒影）】</span><span>鏡HP ' + mHp + '</span></div>' +
      '<div>' + rightText + '</div>' +
    '</div>' +
  '</div>';
}

var ACH_D7 = [
  {id:'ach_d7_board',    name:'午夜乘車人', desc:'登上永不停歇的地下「鏡像電車」'},
  {id:'ach_d7_mirror',   name:'反轉時刻表', desc:'解開鏡像電車的三道核心謎題（鏡像解謎、時間表拼圖、身份交換）'},
  {id:'ach_d7_sync',     name:'雙軌同調',   desc:'在正側與鏡像 HP 差值不超過 10 的狀態下抵達終點站'},
  {id:'ach_d7_true',     name:'零號月台的破曉', desc:'解鎖鏡像電車真結局「雙軌合一 · 走出地鐵口」'}
];

V5.registerDungeon({
  id: 7,
  index: '第 七 扇 門',
  name: '鏡像電車',
  roomNum: '⇄',
  bgNum: '03:17',
  clearedKey: 'wuxian-seventh-cleared',
  savePrefix: 'v58-tram-save',
  startScene: 'd7_prologue',
  subText: '雙 軌 迴 廊 · 第 七 扇 門',
  ruleText: '車 窗 裡 的 你 ， 永 遠 做 相反 的 選 擇',
  hasParty: true,
  hasCountdown: false,
  hasAdmin: false,
  achDefs: ACH_D7,
  totalEndings: 15,
  unlock: function(){ return true; },
  tagline: '一輛不斷行駛的地下電車，每到一站會重演你上一次選擇的「鏡像」——左頁是你，右頁是車窗裡的鏡像你，兩邊生命連動。',

  bgAnimation: function(){
    if(bgNumTimer){ clearInterval(bgNumTimer); bgNumTimer=null; }
    var el = $('bg-num'); if(!el) return;
    el.classList.remove('float');
    if(SETTINGS.bgAnim === false || SETTINGS.reducedMotion){ el.textContent = '⇄'; return; }
    var seq = ['⇄','13⇄31','03:17','71:30','A⇄B'];
    var i = 0; el.textContent = seq[i];
    bgNumTimer = setInterval(function(){ i=(i+1)%seq.length; el.textContent=seq[i]; }, 1800);
  },

  stateInit: function(){
    var stations = ['d7_st_hotel', 'd7_st_library', 'd7_st_hospital'];
    if(window.V58 && typeof V58.shuffleStations === 'function'){
      stations = V58.shuffleStations(stations.slice());
    }
    return {
      currentScene: 'd7_prologue',
      inventory: [],
      flags: {stationOrder: stations, stationIdx: 0},
      hp: 100, maxHp: 100, mirrorHp: 100,
      party: 4,
      stress: 0,
      textIndex: 0,
      puzzleCallback: null, puzzleAnswer: null, puzzleAttempts: 0,
      inheritance: (typeof loadInheritance === 'function') ? loadInheritance() : {},
      notes: [], history: [],
      personality: {calm:50, altruism:50, cautious:50},
      mapZones: [
        {id:'d7_car1',   name:'第一車廂·正軌座', explored:false, current:true,  scene:'d7_hub',         summary:'車窗映出對向並行的鏡像列車，列車長沈默在車頭檢票。'},
        {id:'d7_st1',    name:'第一站·倒影月台', explored:false, current:false, scene:'d7_st_hotel',    summary:'重演質數旅館反面選擇的地下月台。'},
        {id:'d7_st2',    name:'第二站·無聲月台', explored:false, current:false, scene:'d7_st_library',  summary:'重演沉默圖書館反面選擇的地下月台。'},
        {id:'d7_st3',    name:'第三站·急診月台', explored:false, current:false, scene:'d7_st_hospital', summary:'重演倒計時醫院反面選擇的地下月台。'},
        {id:'d7_cab',    name:'駕駛室·雙軌交匯', explored:false, current:false, scene:'d7_cab',         summary:'兩列電車即將併軌的終點分岔口。'}
      ]
    };
  },

  buildScenes: function(){
    function syncMirrorDamage(dmg, mirrorDmg){
      if(dmg) damage(dmg);
      state.mirrorHp = Math.max(0, Math.min(100, (state.mirrorHp != null ? state.mirrorHp : 100) - (mirrorDmg || dmg || 0)));
      if(state.mirrorHp <= 0 && state.hp > 0){
        appendNarrative('<p class="system-msg">【雙軌共鳴警告】車窗對面的鏡像生命歸零，玻璃應聲碎裂！</p>');
      }
    }

    SCENES.d7_prologue = {
      room:'⇄', roomName:'地下鐵 · 零號月台', sceneId:'7-序章', mood:'mystery',
      onEnter: function(){ unlockAchievement('ach_d7_board'); },
      text:[
        '<p>地鐵進站的風把你大衣的下擺吹得獵獵作響。</p>',
        '<p>隧道壁上貼著慘白的馬賽克磚，站牌上沒有站名，只有一個水平翻轉的符號：「⇄」。</p>',
        '<p>一列老舊的銀灰色地下電車緩緩停在月台邊。車門滑開的瞬間，你看見車窗玻璃對面並排停著另一列一模一樣的電車——裡面的「你」正抬起左手，而你抬起的是右手。</p>',
        '<p class="system-msg">迴廊低語：你已踏入第七扇門「鏡像電車」。<br>核心規則：左頁是你所在的「正軌車廂」，右頁是車窗對面的「鏡像車廂」。每當你做出穩妥的決定，鏡像的你就會做出相反的冒險決定；兩邊生命值互相連動。</p>'
      ],
      choices:[
        {text:'踏進第一車廂，查看車窗對面的鏡像', next:'d7_hub', personality:{calm:+5}},
        {text:'低頭看腳下的黃色警戒線', useless:true, flavor:'警戒線上的字是反著印的：「請勿跨越鏡面」。'}
      ]
    };

    SCENES.d7_hub = {
      room:'01', roomName:'第一車廂 · 雙軌座', sceneId:'7-車廂樞紐', mood:'mystery', mapZone:'d7_car1',
      npc:['tram_conductor','tram_mirror_you','tram_girl','tram_tuner','tram_oldman','tram_sleeper','tram_vendor'],
      getText: function(st){
        st = st || state || {};
        var mHp = st.mirrorHp != null ? st.mirrorHp : 100;
        return [
          '<p>車廂頂部的日光燈管隨著鐵軌接縫發出規律的「哐當——哐當——」聲。車廂裡坐著幾名神情各異的乘客：剪票員沈默、抱著舊時刻表的盲眼老人、戴耳機的調音師宋弦、提著空竹籃的夜班小販、以及始終看著車窗的紅圍巾少女林雙。</p>',
          buildDualNarrativeHTML(
            '正側車廂', '你坐在靠窗的位置，手裡握著一張打孔車票。列車正駛向下一座隨機洗牌的記憶站點。',
            '鏡像車廂', '車窗裡的「你」把車票撕成了兩半，正冷冷地盯著玻璃這一側的你。',
            mHp
          ),
          '<p>你可以先在車廂裡與乘客交談、檢查車門旁的「鏡像密碼鎖」，或拉下站點拉環進入下一站。</p>'
        ];
      },
      choices:[
        {text:'前往下一站（站點隨機洗牌：第一站）', action:function(){
          var ord = (state.flags && state.flags.stationOrder) || ['d7_st_hotel','d7_st_library','d7_st_hospital'];
          goToScene(ord[0] || 'd7_st_hotel');
        }},
        {text:'解開隔間門上的「鏡像文字鎖」（謎題一：鏡像解謎）', condition:function(){ return !state.flags.d7_puz_mirror; }, action:function(){
          openPuzzle('鏡像解謎 · 車窗反字', '車窗玻璃上用白漆印著水平翻轉的數字：\n\n鏡中顯示為「53」的倒影號碼，在正側車廂還原後應該是哪個兩位數？（請將 53 的十位數與個位數鏡像顛倒後輸入）', '35', function(ok){
            if(ok){
              state.flags.d7_puz_mirror = true;
              addItem('tram_token', '雙軌銅幣', '正反兩面都刻著列車車頭的銅幣（稀有）。', '可在駕駛室平衡雙軌');
              appendNarrative('<p class="inherit-note">【鏡像解謎成功】你順著玻璃反光逆向撥動轉盤，輸入「35」。隔間門咔噠一聲彈開，獲得「雙軌銅幣」。</p>');
            }else{
              syncMirrorDamage(10, 10);
              appendNarrative('<p class="system-msg">轉盤逆向彈回，震得你虎口發麻（正側與鏡像 HP -10）。</p>');
            }
          }, '把數字 53 左右顛倒過來看，十位數與個位數互換，即為 35。');
        }},
        {text:'拼合散落的「時刻表碎片」（謎題二：時間表拼圖）', condition:function(){ return !state.flags.d7_puz_schedule; }, action:function(){
          openPuzzle('時間表拼圖 · 停站間隔', '盲眼老人膝上的時刻表被撕成了四塊：\n\n第一站發車：03:02\n第二站發車：03:05（間隔 +3 分）\n第三站發車：03:10（間隔 +5 分）\n第四站發車：03:17（間隔 +7 分）\n\n按照質數間隔（+3, +5, +7, +11）遞增，第五站（終點站）的發車時間是「03:??」？（請輸入最後兩位數字）', '28', function(ok){
            if(ok){
              state.flags.d7_puz_schedule = true;
              addItem('tram_timetable', '完整時刻表', '記載著 03:28 終點併軌時間的泛黃時刻表（稀有）。');
              appendNarrative('<p class="inherit-note">【時間表拼圖完成】17 + 11 = 28。終點站發車時間是 03:28。你獲得了「完整時刻表」。</p>');
            }else{
              syncMirrorDamage(10, 10);
              appendNarrative('<p class="system-msg">時刻表上的紅字閃爍了一下，車廂劇烈晃動（HP -10）。</p>');
            }
          }, '間隔依序為連續質數 +3、+5、+7，下一個質數是 +11。17 + 11 = 28。');
        }},
        {text:'走進車廂連接處的「暗門密室」（需持有黃金鑰匙或雙軌銅幣）', condition:function(){ return hasItem('golden_key') || hasItem('tram_token'); }, next:'d7_secret_coupler'},
        {text:'前往車頭「駕駛室 · 雙軌交匯」', condition:function(){ return state.flags.d7_st1_done || state.flags.d7_st2_done || state.flags.d7_st3_done; }, next:'d7_cab'}
      ]
    };

    SCENES.d7_secret_coupler = {
      room:'密', roomName:'車廂連接處 · 夾縫密室', sceneId:'7-隱藏密室', mood:'safe',
      onEnter: function(){ state.flags.d7_secret_found = true; },
      text:[
        '<p>你用鑰匙旋開兩節車廂風擋之間的檢修窄門。門後不是鐵軌，而是一間不到兩坪的信號員值班室。</p>',
        '<p>牆上掛著歷代列車長的懷錶，桌上放著一只未拆封的「緊急制動扳手」。你在抽屜底層找到了一頁蘇晚留下的車票存根。</p>'
      ],
      choices:[
        {text:'收起「緊急制動扳手」並修復鏡像裂痕（雙側 HP +20）', action:function(){
          if(!hasItem('tram_wrench')){
            addItem('tram_wrench', '緊急制動扳手', '傳說級工具，可在終點站強制鎖定雙軌同步。');
            state.hp = Math.min(state.maxHp||100, state.hp + 20);
            state.mirrorHp = Math.min(100, (state.mirrorHp||100) + 20);
            updateHP();
            showToast('獲得傳說物品：緊急制動扳手');
          }
          goToScene('d7_hub');
        }},
        {text:'返回第一車廂', next:'d7_hub'}
      ]
    };

    SCENES.d7_st_hotel = {
      room:'站I', roomName:'第一站 · 倒影旅館月台', sceneId:'7-第一站', mood:'tension', mapZone:'d7_st1',
      getText: function(st){
        st = st || state || {};
        return [
          '<p>列車停靠在第一站。月台柱子上掛著「質數旅館 · 2號房與3號房」的銅牌。</p>',
          buildDualNarrativeHTML(
            '正側選擇', '在旅館裡，你曾冷靜地翻閱登記簿，避開了 2 號房的虛空陷阱。',
            '鏡像重演', '車窗對面的「你」正毫不猶豫地伸手握住 2 號房的黑門把，虛空正從門縫裡往外滲！',
            st.mirrorHp
          )
        ];
      },
      choices:[
        {text:'敲擊車窗提醒鏡像，分擔一半虛空衝擊（正側 HP -10，保住鏡像 HP）', personality:{altruism:+10}, action:function(){
          state.flags.d7_st1_done = true;
          syncMirrorDamage(10, 0);
          var ord = (state.flags && state.flags.stationOrder) || ['d7_st_hotel','d7_st_library','d7_st_hospital'];
          var nextSt = ord[1] && ord[1] !== 'd7_st_hotel' ? ord[1] : 'd7_st_library';
          goToScene(nextSt);
        }},
        {text:'拉上車窗遮光簾，任由鏡像獨自承受反噬（鏡像 HP -30）', personality:{cautious:+10, altruism:-10}, action:function(){
          state.flags.d7_st1_done = true;
          syncMirrorDamage(0, 30);
          var ord = (state.flags && state.flags.stationOrder) || ['d7_st_hotel','d7_st_library','d7_st_hospital'];
          var nextSt = ord[1] && ord[1] !== 'd7_st_hotel' ? ord[1] : 'd7_st_library';
          goToScene(nextSt);
        }},
        {text:'強行在第一站跳車逃往月台暗道', next:'d7_end_jump1', danger:true}
      ]
    };

    SCENES.d7_st_library = {
      room:'站II', roomName:'第二站 · 喧囂書庫月台', sceneId:'7-第二站', mood:'mystery', mapZone:'d7_st2',
      getText: function(st){
        st = st || state || {};
        return [
          '<p>列車滑入第二站。月台上堆滿了正在燃燒與翻頁的書本——這是「沉默圖書館」的反面。</p>',
          buildDualNarrativeHTML(
            '正側選擇', '你在圖書館裡屏住呼吸，遵守了「保持安靜」的鐵律。',
            '鏡像重演', '車窗對面的「你」正對著管理員大聲質問，書架上的黑影已經纏住了他的腳踝！',
            st.mirrorHp
          )
        ];
      },
      choices:[
        {text:'將車廂廣播切換為靜音頻段，替鏡像消音（正側 HP -10）', personality:{calm:+10}, action:function(){
          state.flags.d7_st2_done = true;
          syncMirrorDamage(10, 0);
          goToScene('d7_st_hospital');
        }},
        {text:'趁鏡像吸引管理員注意，搜刮月台遺落的記憶書頁', personality:{cautious:+5}, action:function(){
          state.flags.d7_st2_done = true;
          syncMirrorDamage(5, 25);
          addItem('tram_book_page', '反寫書頁', '記錄著「另一條時間線的陸衍」的書頁。');
          goToScene('d7_st_hospital');
        }},
        {text:'推開車門走進喧囂書庫深處', next:'d7_end_noise', danger:true}
      ]
    };

    SCENES.d7_st_hospital = {
      room:'站III', roomName:'第三站 · 逆時鐘急診月台', sceneId:'7-第三站', mood:'terror', mapZone:'d7_st3',
      getText: function(st){
        st = st || state || {};
        return [
          '<p>第三站到了。月台上的電子鐘不是倒數，而是瘋狂地順時針暴走。</p>',
          buildDualNarrativeHTML(
            '正側選擇', '你在醫院裡帶著媛媛的記憶尋找真相。',
            '鏡像重演', '鏡像裡的「你」正準備按下格式化按鈕，將所有人的記憶徹底清空！',
            st.mirrorHp
          )
        ];
      },
      choices:[
        {text:'解開「身份交換鎖」（謎題三：身份交換），與鏡像短暫互換位置阻止格式化', action:function(){
          openPuzzle('身份交換謎題 · 席位對調', '車廂內有四名乘客：\n1號座：只說真話的蘇晚\n2號座：只說假話的阿凱\n3號座：正側的你\n4號座：鏡像的你\n\n阿凱說：「交換開關在 2 號或 3 號座底下。」\n蘇晚說：「開關不在 1 號座，也不在正側的你座下。」\n請問真正的「身份交換開關」在幾號座底下？（請輸入 1 到 4 的數字）', '4', function(ok){
            state.flags.d7_st3_done = true;
            if(ok){
              state.flags.d7_puz_swap = true;
              if(state.flags.d7_puz_mirror && state.flags.d7_puz_schedule) unlockAchievement('ach_d7_mirror');
              appendNarrative('<p class="inherit-note">【身份交換成功】你按下 4 號座對應的耦合鈕，在零點一秒內與鏡像互換，拔掉了格式化的電源線！</p>');
              goToScene('d7_cab');
            }else{
              syncMirrorDamage(15, 15);
              goToScene('d7_cab');
            }
          }, '阿凱說假話，所以開關不在 2 號或 3 號；蘇晚說真話，不在 1 號也不在 3 號。只剩 4 號座。');
        }},
        {text:'返回第一車廂整理裝備', next:'d7_hub'},
        {text:'任由鏡像按下格式化按鈕', next:'d7_end_format', danger:true}
      ]
    };

    SCENES.d7_cab = {
      room:'終', roomName:'駕駛室 · 雙軌交匯點', sceneId:'7-終局抉擇', mood:'tension', mapZone:'d7_cab',
      getText: function(st){
        st = st || state || {};
        var diff = Math.abs((st.hp||100) - (st.mirrorHp||100));
        if(diff <= 10) unlockAchievement('ach_d7_sync');
        return [
          '<p>你推開駕駛室的鐵門。前方隧道盡頭出現了一道刺眼的白光——兩條平行鐵軌即將在「03:28」交匯成同一條軌道。</p>',
          buildDualNarrativeHTML(
            '正側駕駛台', '你的手按在正側操縱桿上（當前 HP：' + (st.hp||100) + '）。',
            '鏡像駕駛台', '鏡像的你也把手按在對面的操縱桿上（鏡像 HP：' + (st.mirrorHp||100) + '）。',
            st.mirrorHp
          ),
          '<p>剪票員沈默站在你身後，輕聲問：「終點站只能有一列電車進站。你要撞碎他、取代他，還是與他合軌？」</p>'
        ];
      },
      choices:[
        {text:'【真結局】使用「緊急制動扳手」與「完整時刻表」鎖定雙軌同步，與鏡像合而為一', condition:function(){ return hasItem('tram_wrench') && hasItem('tram_timetable'); }, next:'d7_end_true'},
        {text:'【真結局二】將雙軌銅幣嵌入控制台，讓兩列電車同時駛入黎明月台', condition:function(){ return hasItem('tram_token') && state.flags.d7_puz_swap; }, next:'d7_end_true_dawn'},
        {text:'【真結局三】與紅圍巾少女林雙、蘇晚合力拉下雙重氣閥，打開零號地面出口', condition:function(){ return state.flags.d7_puz_mirror && state.inheritance && state.inheritance.suwan_survived; }, next:'d7_end_true_companions'},
        {text:'將正側列車全速推進，獨自駛出隧道（普通結局·正軌生還）', next:'d7_end_normal_self'},
        {text:'鬆開操縱桿，把駛出隧道的機會讓給車窗對面的鏡像（普通結局·成全倒影）', next:'d7_end_normal_mirror'},
        {text:'拉下緊急煞車，讓列車停在兩站之間的靜謐隧道（逃過一劫·停駐夾縫）', next:'d7_end_survive_brake'},
        {text:'接過剪票員沈默的制帽，成為下一任鏡像列車長（普通結局·守車人）', next:'d7_end_conductor'},
        {text:'與調音師宋弦一起將列車頻率調回 03:17（隱藏結局·迴聲車廂）', next:'d7_end_tuner'},
        {text:'跟隨盲眼老人走下鐵軌旁的老舊維修梯（逃過一劫·舊道微光）', next:'d7_end_oldman'},
        {text:'打破車窗玻璃，試圖徒手抓住對面的鏡像（壞結局·玻璃碎裂）', next:'d7_end_shatter', danger:true},
        {text:'切斷兩節車廂的耦合器，任由後車廂脫軌（壞結局·脫軌深淵）', next:'d7_end_derail', danger:true},
        {text:'在駕駛室睡著，隨著列車進入永恆環線（壞結局·環線終身）', next:'d7_end_loop', danger:true}
      ]
    };

    var d7Endings = [
      ['d7_end_true', 'hidden_d7_true', '雙軌合一 · 走出地鐵口', '你用緊急制動扳手鎖死雙軌差速，03:28 的鐘聲敲響時，左右兩列電車像光影般重疊。車窗上的玻璃消失了，對面的鏡像向你點了點頭，化作你眼底的一道微光。你推開地鐵站的旋轉鐵柵門，清晨微涼的晨風吹在臉上。', '真結局 I · 雙軌合一', true],
      ['d7_end_true_dawn', 'hidden_d7_dawn', '破曉併軌 · 雙生車票', '雙軌銅幣在控制台中央高速旋轉，兩列電車並排衝出隧道口。陽光落在鐵軌上，你看見自己所有的遺憾與選擇都被妥善安放在另一條平行軌道上。', '真結局 II · 破曉併軌', true],
      ['d7_end_true_companions', 'hidden_d7_comp', '零號出口的同行者', '蘇晚與林雙一左一右幫你穩住氣閥。當列車穩穩停靠在地面站台時，車門向兩側敞開，你們沒有一個人掉隊。', '真結局 III · 同行破曉', true],
      ['d7_end_normal_self', 'normal_d7_self', '正軌到站', '你推到底部加速桿，正側列車搶先半個車身衝過分岔口。後視鏡裡，對向列車隱沒在隧道黑暗中。你活著走出了月台。', '普通結局 · 正軌生還', false],
      ['d7_end_normal_mirror', 'normal_d7_mirror', '把黎明讓給倒影', '你鬆開了手。對向車廂裡的「你」怔怔地看著你，隨後替你駛向了地面。你知道世界上還有一個自己正在陽光下呼吸。', '普通結局 · 成全倒影', false],
      ['d7_end_survive_brake', 'survive_d7_brake', '停在兩站之間', '刺耳的煞車火花在隧道裡亮起。列車停在了不屬於任何一站的靜謐區間，你推開逃生窗，順著通風井爬回了迴廊。', '逃過一劫 · 停駐夾縫', false],
      ['d7_end_conductor', 'normal_d7_conductor', '新任剪票員', '你戴上那頂深藍色的列車長制帽，接過打孔鉗。沈默笑著走下了車，而你將繼續守望下一批登上鏡像電車的旅人。', '普通結局 · 守車人', false],
      ['d7_end_tuner', 'hidden_d7_tuner', '第十二節迴聲車廂', '宋弦撥響了音叉，鐵軌的震動化作柔和的弦樂。你們走進原本不存在的第十二節車廂，那裡擺滿了所有乘客最珍貴的舊物。', '隱藏結局 · 迴聲車廂', false],
      ['d7_end_oldman', 'survive_d7_oldman', '維修道微光', '盲眼老人用拐杖敲擊枕木，帶你穿過廢棄的地下防空連通道，從一處老舊的街角人孔蓋爬了出去。', '逃過一劫 · 舊道微光', false],
      ['d7_end_jump1', 'bad_d7_jump', '月台迷途', '你在列車尚未停穩時強行跳上倒影月台，卻發現月台沒有出口，只有一列列呼嘯而過卻永不停靠的空車。', '壞結局 · 月台迷途', false],
      ['d7_end_noise', 'bad_d7_noise', '喧囂吞噬', '你走進燃燒的書庫月台，無數反寫的鉛字從紙頁上飛起，將你的名字徹底塗抹。', '壞結局 · 喧囂吞噬', false],
      ['d7_end_format', 'bad_d7_format', '空白車票', '鏡像按下了格式化按鈕。你手裡的車票變成了白紙，你也忘了自己要搭車去哪裡。', '壞結局 · 空白車票', false],
      ['d7_end_shatter', 'bad_d7_shatter', '鏡面崩裂', '車窗碎裂的瞬間，狂暴的地下氣流將正側與鏡像同時捲入雙軌之間的縫隙。', '壞結局 · 鏡面崩裂', false],
      ['d7_end_derail', 'bad_d7_derail', '脫軌深淵', '失去後車廂配重的電車在彎道處猛烈傾覆，車頭燈在黑暗中劃出最後一道弧線。', '壞結局 · 脫軌深淵', false],
      ['d7_end_loop', 'bad_d7_loop', '零號環線終身乘客', '你在搖晃的車廂裡沉沉睡去。列車駛入沒有終點的環狀軌道，永遠在 03:17 與 03:18 之間打轉。', '壞結局 · 環線終身', false]
    ];

    d7Endings.forEach(function(ed){
      SCENES[ed[0]] = {
        room:'⇄', roomName:'鏡像電車 · 終點', sceneId:'7-結局', mood: ed[1].indexOf('bad_')===0 ? 'terror' : 'safe',
        text:['<p>' + ed[3] + '</p>'],
        onEnter: function(){
          if(ed[5]) unlockAchievement('ach_d7_true');
          if(ed[1].indexOf('bad_') !== 0 && window.V4) V4.markDungeonCleared(7);
          setTimeout(function(){ triggerEnding(ed[1], ed[2], ed[3], ed[4]); }, 500);
        },
        choices:[]
      };
    });
  }
});

var ACH_D8 = [
  {id:'ach_d8_enter',   name:'午夜食客',     desc:'走進永遠營業的「無盡自助餐」'},
  {id:'ach_d8_taste',   name:'百味人生',     desc:'在無盡自助餐品嚐 3 道記載客人一生的料理並獲得其記憶'},
  {id:'ach_d8_full',    name:'暴食之誡',     desc:'飽食度達到 100% 觸發撐死結局，或精準控制在 80%–95% 之間離席'},
  {id:'ach_d8_true',    name:'最後一碗家常麵', desc:'與蘇晚或主廚共享隱藏料理，解鎖無盡自助餐真結局'}
];

var D8_DISH_POOL = [
  {
    id:'dish_ribs', name:'1998年的糖醋排骨', cal:25, buff:'+15 HP · 利他 +8', hpDelta:15,
    story:'這盤排骨微涼，糖色熬得稍微過了一點，帶著一絲焦苦。吃下去的瞬間，你看見一個穿藍布圍裙的母親站在1998年冬天的老式煤氣灶前，反覆熱了三次菜。她的女兒小雨那天因為護理系實習晚歸，最後也沒能趕上這頓晚飯。母親把排骨夾進保溫盒時，手指被鍋沿燙出了一個小水泡，卻只是在圍裙上擦了擦。那股甜中帶澀的焦糖香，是一生都沒說出口的「早點回家」。'
  },
  {
    id:'dish_coffee', name:'03:17 的冷萃黑咖啡', cal:15, buff:'冷靜 +12 · 看破幻覺', hpDelta:5,
    story:'杯壁上凝著一層細密的水珠，入口極苦，卻在舌根留下一絲奇異的回甘。記憶畫面裡是一間堆滿草稿紙的大學實驗室，年輕的博士生盯著螢幕上偏離預期的質數分佈曲線，第13次按下重算鍵。窗外的城市早已沉睡，只有主機風扇嗡嗡作響。他在草稿紙背面寫下：「如果時間也有餘數，我們是不是就住在被除剩下的那零點一秒裡？」隨後仰頭喝盡了這杯冷透的咖啡。'
  },
  {
    id:'dish_soup', name:'無聲冬瓜盅', cal:20, buff:'+20 HP · 壓力 -15', hpDelta:20,
    story:'湯色清澈見底，冬瓜切得薄如蟬翼，連一點鹽味都極淡。吞下溫熱湯水時，你聽見了1987年夏天暴雨敲打圖書館玻璃窗的聲音。第二任圖書館管理員坐在借書台後，小口喝著妻子送來的冬瓜湯，身旁六歲的媛媛正趴在布面畫冊上用蠟筆畫一隻黑貓。那是暴風雨降臨前最安靜的一個下午，連時鐘走動的聲音都溫柔得像搖籃曲。'
  },
  {
    id:'dish_candy', name:'碎裂的檸檬棒棒糖', cal:15, buff:'閃避陷阱 · 謹慎 +10（微酸扣 5 HP）', hpDelta:-5,
    story:'糖球表面有一道貫穿的裂紋，含在嘴裡是尖銳刺骨的檸檬酸味。記憶屬於一個從未真正長大的少年——他站在旅館走廊的全身鏡前，一遍遍練習人類微笑時嘴角上揚的弧度。他知道自己只是旅館為了湊齊四個人而捏造的鏡像，連嘴裡的甜味都是假的；但在燈滅的那三秒裡，他卻真心希望身邊那三個活人能替他看看外面的太陽。'
  },
  {
    id:'dish_bread', name:'急診室夜班烤吐司', cal:30, buff:'+10 HP · 獲得「餐刀鑰匙」線索', hpDelta:10,
    story:'兩片烤得邊緣發黑的白吐司，中間夾著半融化的廉價人造奶油。你嚥下肚時，看見1999年深夜的醫院值班室，護士周敏正靠在鐵皮儲物櫃旁小口啃著吐司。走廊盡頭傳來地下二樓機器低沉的轟鳴，她在值班日誌最後一頁寫完第十四個病人的真名，把剩下的半片吐司包好放進口袋，轉身走向了太平間。'
  },
  {
    id:'dish_noodles', name:'蘇晚的半碗陽春麵', cal:25, buff:'+25 HP · 解鎖真結局關鍵記憶', hpDelta:25,
    story:'清湯掛麵上臥著一顆荷包蛋，蔥花還是翠綠的。吃下第一口，你看見蘇晚在進入迴廊前的最後一個傍晚——她獨自坐在巷口的小麵攤前，手機螢幕亮著一封未發出的簡訊：「媽，我今天不加班，馬上回來。」麵才吃到一半，街燈突然閃爍了十三下，再抬頭時她已經站在了質數旅館的大廳裡。那半碗沒吃完的麵，成了她活下去唯一的錨點。'
  }
];

V5.registerDungeon({
  id: 8,
  index: '第 八 扇 門',
  name: '無盡自助餐',
  roomNum: '飽',
  bgNum: '80%',
  clearedKey: 'wuxian-eighth-cleared',
  savePrefix: 'v58-buffet-save',
  startScene: 'd8_prologue',
  subText: '記 憶 饗 宴 · 第 八 扇 門',
  ruleText: '每 道 菜 都 是 一 個 人 的 一 生 · 吃 太 多 會 撐 死',
  hasParty: false,
  hasCountdown: false,
  hasAdmin: false,
  achDefs: ACH_D8,
  totalEndings: 8,
  unlock: function(){ return true; },
  tagline: '一間永遠吃不飽也永遠不打烊的午夜餐廳。每道菜都記錄著一位客人的一生，吃下去會短暫獲得對方的記憶與加成，但飽食度超過 100% 將萬劫不復。',

  bgAnimation: function(){
    if(bgNumTimer){ clearInterval(bgNumTimer); bgNumTimer=null; }
    var el = $('bg-num'); if(!el) return;
    el.classList.remove('float');
    if(SETTINGS.bgAnim === false || SETTINGS.reducedMotion){ el.textContent = '飽'; return; }
    var seq = ['0%','25%','50%','85%','100%'];
    var i = 0; el.textContent = seq[i];
    bgNumTimer = setInterval(function(){ i=(i+1)%seq.length; el.textContent=seq[i]; }, 1900);
  },

  stateInit: function(){
    return {
      currentScene: 'd8_prologue',
      inventory: [],
      flags: {satiety: 0, dishesEaten: 0, menuSeed: Math.floor(Math.random()*1000)},
      hp: 100, maxHp: 100,
      satiety: 0,
      stress: 0,
      textIndex: 0,
      puzzleCallback: null, puzzleAnswer: null, puzzleAttempts: 0,
      inheritance: (typeof loadInheritance === 'function') ? loadInheritance() : {},
      notes: [], history: [],
      personality: {calm:50, altruism:50, cautious:50},
      mapZones: [
        {id:'d8_hall',    name:'長桌取餐區', explored:false, current:true,  scene:'d8_hub',     summary:'擺滿記憶料理的百米長桌，飽食度計顯示在餐盤邊緣。'},
        {id:'d8_kitchen', name:'後廚冷庫',   explored:false, current:false, scene:'d8_kitchen', summary:'主廚老陳封存「未被認領的人生」的後廚。'},
        {id:'d8_cashier', name:'結帳櫃檯',   explored:false, current:false, scene:'d8_cashier', summary:'唯有飽食度恰到好處並結清記憶帳單者方可離席。'}
      ]
    };
  },

  buildScenes: function(){
    function addSatiety(cal){
      state.satiety = (state.satiety || 0) + cal;
      state.flags.satiety = state.satiety;
      state.flags.dishesEaten = (state.flags.dishesEaten || 0) + 1;
      if(state.flags.dishesEaten >= 3) unlockAchievement('ach_d8_taste');
      if(window.V58 && typeof V58.updateHUD === 'function') V58.updateHUD();
      if(state.satiety >= 100){
        unlockAchievement('ach_d8_full');
        setTimeout(function(){ goToScene('d8_end_overeat'); }, 450);
        return true;
      }
      return false;
    }

    SCENES.d8_prologue = {
      room:'饗', roomName:'無盡自助餐 · 旋轉門', sceneId:'8-序章', mood:'safe',
      onEnter: function(){ unlockAchievement('ach_d8_enter'); },
      text:[
        '<p>黃銅旋轉門後是一間燈火通明、香氣四溢卻安靜得詭異的西式自助餐廳。</p>',
        '<p>百米長桌上整齊擺放著一排排銀質保溫餐盤，每揭開一個蓋子，裡面飄出的不是蒸氣，而是一段活生生的人類記憶。</p>',
        '<p class="system-msg">迴廊低語：你已踏入第八扇門「無盡自助餐」。<br>規則說明：每品嚐一道菜，將讀取該客人 200 字的微型一生並獲得對應狀態加成，同時累積「飽食度」。當飽食度達到 100% 時將直接撐死於餐桌旁；飽食度介於 65%–95% 之間方可前往櫃檯結帳離席。</p>'
      ],
      choices:[
        {text:'拿起空白瓷盤，走向長桌取餐區', next:'d8_hub', personality:{calm:+5}}
      ]
    };

    SCENES.d8_hub = {
      room:'餐', roomName:'百米長桌 · 取餐區', sceneId:'8-取餐區', mood:'mystery', mapZone:'d8_hall',
      npc:['buffet_chef','suwan'],
      getText: function(st){
        st = st || state || {};
        var sat = st.satiety || 0;
        var eaten = (st.flags && st.flags.dishesEaten) || 0;
        return [
          '<p>你站在長桌前。餐盤邊緣浮現出一行暗金色的刻度：【當前飽食度：' + sat + '% ／ 已品嚐料理：' + eaten + ' 道】。</p>',
          '<p>侍者打扮的主廚站在餐檯盡頭，輕聲提醒：「今日菜單已隨機刷新。每道菜都是一個人的一生，請量力而食。」</p>'
        ];
      },
      choices:(function(){
        var list = [];
        D8_DISH_POOL.forEach(function(dish){
          list.push({
            text:'品嚐《' + dish.name + '》（飽食度 +' + dish.cal + '% · ' + dish.buff + '）',
            condition: function(){ return !(state.flags && state.flags['ate_' + dish.id]); },
            action: function(){
              state.flags['ate_' + dish.id] = true;
              if(dish.id === 'dish_noodles') state.flags.d8_noodles_eaten = true;
              if(dish.hpDelta){
                if(dish.hpDelta > 0){ state.hp = Math.min(state.maxHp||100, state.hp + dish.hpDelta); updateHP(); }
                else { damage(-dish.hpDelta); }
              }
              addNote('dish_' + dish.id, dish.name, dish.story);
              appendNarrative('<p class="v58-long-para">【品嚐記憶 · ' + dish.name + '】<br>' + dish.story + '</p><p class="inherit-note">狀態生效：' + dish.buff + ' ｜ 當前飽食度：' + ((state.satiety||0)+dish.cal) + '%</p>');
              addSatiety(dish.cal);
            }
          });
        });
        list.push({text:'使用「催吐檸檬水」消化 15% 飽食度（每局一次）', condition:function(){ return (state.satiety||0) >= 20 && !state.flags.d8_digested; }, action:function(){
          state.flags.d8_digested = true;
          state.satiety = Math.max(0, (state.satiety||0) - 15);
          state.flags.satiety = state.satiety;
          if(window.V58 && typeof V58.updateHUD === 'function') V58.updateHUD();
          appendNarrative('<p class="action">你飲下一小杯冰鎮檸檬水，胃部的沉重感減輕了一些（飽食度 -15%，當前 ' + state.satiety + '%）。</p>');
        }});
        list.push({text:'前往「後廚冷庫」查看食材來源', next:'d8_kitchen'});
        list.push({text:'前往「結帳櫃檯」準備離席', next:'d8_cashier'});
        return list;
      })()
    };

    SCENES.d8_kitchen = {
      room:'廚', roomName:'後廚冷庫 · 記憶切配間', sceneId:'8-後廚', mood:'tension', mapZone:'d8_kitchen',
      text:[
        '<p>你推開寫著「閒人免進」的雙向彈簧門。後廚裡沒有魚肉蔬果，只有一排排貼著年份標籤的玻璃罐，裡面裝著發光的記憶高湯。</p>',
        '<p>冷庫門上有一道「配方比例鎖」：唯有調出最溫暖的一碗湯，才能打開通往主廚私房菜單的暗格。</p>'
      ],
      choices:[
        {text:'解開「記憶高湯比例鎖」（密碼謎題）', condition:function(){ return !state.flags.d8_puz_done; }, action:function(){
          openPuzzle('後廚謎題 · 記憶調味', '主廚筆記寫著：\n「一碗能讓人想起回家路的湯，需要：\n1998年母親排骨的甜（代號 9）\n1987年冬瓜盅的靜（代號 8）\n加上凌晨 03:17 之後的那一分鐘（代號 18）\n請將這三個數字相加，輸入總和作為冷庫密碼：」', '35', function(ok){
            if(ok){
              state.flags.d8_puz_done = true;
              addItem('chef_recipe', '主廚的家常食譜', '寫著「給蘇晚與陸衍的最後一碗麵」的泛黃食譜（傳說）。');
              appendNarrative('<p class="inherit-note">【後廚解謎成功】9 + 8 + 18 = 35。冷庫暗格彈開，你獲得了「主廚的家常食譜」。</p>');
            }else{
              damage(10);
              appendNarrative('<p class="system-msg">冷氣噴湧而出，凍傷了你的手指（HP -10）。</p>');
            }
          }, '9 + 8 + 18 = 35。');
        }},
        {text:'返回長桌取餐區', next:'d8_hub'}
      ]
    };

    SCENES.d8_cashier = {
      room:'帳', roomName:'結帳櫃檯 · 記憶天平', sceneId:'8-結帳台', mood:'mystery', mapZone:'d8_cashier',
      getText: function(st){
        st = st || state || {};
        var sat = st.satiety || 0;
        if(sat >= 80 && sat <= 95) unlockAchievement('ach_d8_full');
        return [
          '<p>你走到餐廳出口的結帳櫃檯前。銅製天平上放著一張帳單：【當前飽食度：' + sat + '% ／ 品嚐料理：' + ((st.flags&&st.flags.dishesEaten)||0) + ' 道】。</p>',
          '<p>蘇晚正站在櫃檯旁等你。她看著你盤子裡的殘留痕跡，輕聲問：「吃飽了嗎？我們該買單出去了。」</p>'
        ];
      },
      choices:[
        {text:'【真結局】拿出「主廚的家常食譜」，與蘇晚分食那半碗陽春麵後推門離席', condition:function(){ return hasItem('chef_recipe') && state.flags.d8_noodles_eaten; }, next:'d8_end_true'},
        {text:'【真結局二】在飽食度精準控制在 80%–95% 時簽下自己的真名結帳', condition:function(){ var s=state.satiety||0; return s>=80 && s<=95; }, next:'d8_end_true_perfect'},
        {text:'【真結局三】將所有品嚐過的記憶食譜抄錄成冊，交還給主廚換取後門鑰匙', condition:function(){ return (state.flags.dishesEaten||0)>=3 && state.flags.d8_puz_done; }, next:'d8_end_true_archivist'},
        {text:'飽食度達標（>=60%），正常支付記憶硬幣離席（普通結局）', condition:function(){ return (state.satiety||0)>=60; }, next:'d8_end_normal'},
        {text:'一口未吃（飽食度 0%），忍受飢餓直接推門離開（逃過一劫·空腹行者）', condition:function(){ return (state.satiety||0)===0; }, next:'d8_end_fasting'},
        {text:'飽食度不足（1%–59%），留下自己的一段童年記憶抵帳離開（逃過一劫）', condition:function(){ var s=state.satiety||0; return s>0 && s<60; }, next:'d8_end_pawn'},
        {text:'返回長桌繼續取餐', next:'d8_hub'},
        {text:'掀翻長桌，企圖強闖餐廳正門（壞結局·成為食材）', next:'d8_end_ingredient', danger:true}
      ]
    };

    var d8Endings = [
      ['d8_end_true', 'hidden_d8_true', '人間煙火 · 共食一碗麵', '你與蘇晚在櫃檯旁分食了那碗溫熱的陽春麵。所有的苦澀、遺憾與等待都在熱湯裡化開。旋轉門外不再是冰冷的迴廊，而是飄著細雨的夜市街口。', '真結局 I · 人間煙火', true],
      ['d8_end_true_perfect', 'hidden_d8_perfect', '八分飽的清醒', '你既沒有抗拒他人的記憶，也沒有被貪婪吞沒。天平穩穩停在正中央，主廚向你深深鞠躬，為你推開了通往黎明的雕花大門。', '真結局 II · 八分飽的清醒', true],
      ['d8_end_true_archivist', 'hidden_d8_archivist', '百味食譜錄', '你將幾位客人的悲歡離合完整記錄下來。主廚接過食譜時眼眶微紅：「謝謝你記得他們的味道。」', '真結局 III · 百味食譜錄', true],
      ['d8_end_normal', 'normal_d8_leave', '酒足飯飽之後', '你結清了帳單，帶著幾段不屬於你的溫暖記憶走出了旋轉門。', '普通結局 · 飽腹離席', false],
      ['d8_end_fasting', 'survive_d8_fasting', '空腹清醒者', '你滴水未沾，沒有被任何人的記憶同化，餓著肚子卻目光清明地走出了餐廳。', '逃過一劫 · 空腹行者', false],
      ['d8_end_pawn', 'survive_d8_pawn', '典當一段記憶', '因為還沒吃飽，你留下了自己一個無關緊要的夏日午後作為餐費，平安離開了餐廳。', '逃過一劫 · 典當記憶', false],
      ['d8_end_overeat', 'death_d8_overeat', '暴食撐死 · 記憶溢載', '當飽食度衝破 100% 的瞬間，無數陌生人的一生在你的腦海與胃袋裡同時炸開。你倒在銀製餐盤旁，變成了長桌上的下一道新菜。', '死亡結局 · 暴食撐死', false],
      ['d8_end_ingredient', 'bad_d8_ingredient', '今日特餐', '後廚的陰影將你拖進了切配間。第二天，長桌上多了一道寫著你名字的冷盤。', '壞結局 · 今日特餐', false]
    ];

    d8Endings.forEach(function(ed){
      SCENES[ed[0]] = {
        room:'饗', roomName:'無盡自助餐 · 終局', sceneId:'8-結局', mood: /^(bad_|death_)/.test(ed[1]) ? 'terror' : 'safe',
        text:['<p>' + ed[3] + '</p>'],
        onEnter: function(){
          if(ed[5]) unlockAchievement('ach_d8_true');
          if(!/^(bad_|death_)/.test(ed[1]) && window.V4) V4.markDungeonCleared(8);
          setTimeout(function(){ triggerEnding(ed[1], ed[2], ed[3], ed[4]); }, 500);
        },
        choices:[]
      };
    });
  }
});

var ACH_D9 = [
  {id:'ach_d9_bell',     name:'1999年的上課鐘', desc:'踏入 歸途篇章「小學 1999」的懷舊教室'},
  {id:'ach_d9_bias',     name:'戰勝童年偏誤',   desc:'克服「童年選擇偏誤」，替十二歲的自己做出不留遺憾的決定'},
  {id:'ach_d9_true',     name:'千禧年前夕的紙飛機', desc:'解鎖小學 1999 真結局「飛過 1999 的夏天」'}
];

V5.registerDungeon({
  id: 9,
  index: '第 九 扇 門 · DLC',
  name: '小學 1999',
  roomNum: '99',
  bgNum: '1999',
  clearedKey: 'wuxian-ninth-cleared',
  savePrefix: 'v58-school1999-save',
  startScene: 'd9_prologue',
  subText: '懷 舊 夾 縫 · 第 九 扇 門 (DLC)',
  ruleText: '你 知 道 長 大 後 的 答 案 ， 但 小 時 候 的 你 不 會 那 樣 選',
  hasParty: false,
  hasCountdown: false,
  hasAdmin: false,
  achDefs: ACH_D9,
  totalEndings: 8,
  unlock: function(){ return true; },
  tagline: '1999年盛夏的六年三班教室、操場、福利社與校刊編輯室。你知道長大後的標準答案，但十二歲的你有著「童年選擇偏誤」。',

  bgAnimation: function(){
    if(bgNumTimer){ clearInterval(bgNumTimer); bgNumTimer=null; }
    var el = $('bg-num'); if(!el) return;
    el.classList.remove('float');
    if(SETTINGS.bgAnim === false || SETTINGS.reducedMotion){ el.textContent = '1999'; return; }
    var seq = ['1999','6-3','03:17','1999'];
    var i = 0; el.textContent = seq[i];
    bgNumTimer = setInterval(function(){ i=(i+1)%seq.length; el.textContent=seq[i]; }, 2000);
  },

  stateInit: function(){
    return {
      currentScene: 'd9_prologue',
      inventory: [],
      flags: {childBias: 60},
      hp: 100, maxHp: 100,
      stress: 0,
      textIndex: 0,
      puzzleCallback: null, puzzleAnswer: null, puzzleAttempts: 0,
      inheritance: (typeof loadInheritance === 'function') ? loadInheritance() : {},
      notes: [], history: [],
      personality: {calm:50, altruism:50, cautious:50},
      mapZones: [
        {id:'d9_class',      name:'六年三班教室', explored:false, current:true,  scene:'d9_classroom',  summary:'黑板右上角寫著值日生名字，吊扇在頭頂吱呀轉動。'},
        {id:'d9_playground', name:'紅土操場',     explored:false, current:false, scene:'d9_playground', summary:'蟬鳴震耳的操場與單槓，小時候的阿凱與同桌小滿在樹蔭下。'},
        {id:'d9_store',      name:'合作社福利社', explored:false, current:false, scene:'d9_store',      summary:'賣著冬瓜茶、蘋果麵包與彈珠汽水的鐵窗福利社。'},
        {id:'d9_magazine',   name:'校刊編輯室',   explored:false, current:false, scene:'d9_magazine',   summary:'油印機散發著油墨香，存放著《1999世紀末校刊》原稿。'}
      ]
    };
  },

  buildScenes: function(){
    SCENES.d9_prologue = {
      room:'99', roomName:'1999 · 盛夏走廊', sceneId:'9-序章', mood:'safe',
      onEnter: function(){ unlockAchievement('ach_d9_bell'); },
      text:[
        '<p>蟬鳴聲像潮水一樣灌進耳朵。頭頂的三葉吊扇吱呀吱呀地轉著，空氣裡是粉筆灰、木頭課桌與塑膠墊板的味道。</p>',
        '<p>黑板報上用彩色粉筆寫著：「迎接西元 2000 年倒數」。你低頭看自己的手——那是一雙十二歲少年的手，手腕上戴著一隻 1999 年的舊式塑膠電子錶。</p>',
        '<p class="system-msg">迴廊低語：你已踏入第九扇門「小學 1999」。<br>特殊機制【童年選擇偏誤】：你擁有成年後的記憶與理性，但十二歲的身體會抗拒過於世故的「大人答案」。唯有先在福利社、操場與校刊室找回童年的信物，才能說服小時候的自己做出不留遺憾的選擇。</p>'
      ],
      choices:[
        {text:'推開「六年三班」的木門走進教室', next:'d9_classroom', personality:{calm:+5}}
      ]
    };

    SCENES.d9_classroom = {
      room:'6-3', roomName:'六年三班教室', sceneId:'9-教室', mood:'safe', mapZone:'d9_class',
      npc:['child_self','classmate_lin'],
      text:[
        '<p>教室後排靠窗的座位上，坐著十二歲的「小陸衍」。他正低頭在一張數學考卷背面折紙飛機，旁邊座位是紮馬尾的同桌林小滿。</p>',
        '<p>黑板上留著一道期末附加題，而抽屜裡塞著一本沒交出去的交換日記。</p>'
      ],
      choices:[
        {text:'【大人視角】直接告訴小陸衍未來的標準答案（觸發童年選擇偏誤）', condition:function(){ return !state.flags.d9_bias_tested; }, action:function(){
          state.flags.d9_bias_tested = true;
          appendNarrative('<p class="system-msg">【童年選擇偏誤發動】十二歲的你捂住耳朵搖頭：「你說的那些太遠了，我聽不懂！我只想把這架紙飛機折好！」（需先去福利社與操場器材室找回童年信物，才能化解偏誤）。</p>');
        }},
        {text:'解開黑板上的「1999 世紀末質數附加題」', condition:function(){ return !state.flags.d9_puz_math; }, action:function(){
          openPuzzle('黑板附加題 · 質數年齡', '黑板上寫著：\n「今年是 1999 年。老師說：把 1999 的四個數字相加（1+9+9+9=28），減去最小的奇質數（3），最後開平方根，就是放學時間。」\n請問放學時間是下午幾點？（輸入一位數字）', '5', function(ok){
            if(ok){
              state.flags.d9_puz_math = true;
              addItem('chalk_star', '彩色粉筆星', '同桌林小滿獎勵你的藍色粉筆頭。');
              appendNarrative('<p class="inherit-note">【解題成功】√(28 - 3) = √25 = 5。下午 5 點放學。同桌林小滿偷偷遞給你一截藍色粉筆。</p>');
            }else{
              damage(5);
              appendNarrative('<p class="system-msg">算錯了，你被罰擦黑板，吃了一嘴粉筆灰（HP -5）。</p>');
            }
          }, '1+9+9+9 = 28；28 - 3 = 25；25 開平方根是 5。');
        }},
        {text:'下樓前往「紅土操場」', next:'d9_playground'},
        {text:'去一樓轉角的「合作社福利社」', next:'d9_store'},
        {text:'去走廊盡頭的「校刊編輯室」', next:'d9_magazine'}
      ]
    };

    SCENES.d9_playground = {
      room:'操場', roomName:'紅土操場 · 樟樹下', sceneId:'9-操場', mood:'safe', mapZone:'d9_playground',
      text:[
        '<p>陽光穿過樟樹葉在紅土跑道上灑下碎金。單槓旁，一個叼著棒棒糖的小男孩正蹲在地上畫圈——那是十二歲的阿凱，還不是旅館裡的鏡像。</p>',
        '<p>而在操場司令台後面，有一扇被藤蔓遮住的「舊體育器材室」鐵門。</p>'
      ],
      choices:[
        {text:'用福利社買來的「彈珠汽水」與小阿凱交換「器材室銅鑰匙」', condition:function(){ return hasItem('ramune_1999') && !hasItem('gym_key_1999'); }, action:function(){
          addItem('gym_key_1999', '器材室銅鑰匙', '小阿凱藏在沙坑裡的銅鑰匙（稀有）。');
          state.flags.d9_akai_friend = true;
          appendNarrative('<p class="inherit-note">小阿凱接過彈珠汽水，把那顆玻璃彈珠按進瓶口，笑得眼睛彎成月牙：「謝啦！這把鑰匙給你，裡面有上一屆學長留下的時間膠囊！」</p>');
        }},
        {text:'進入隱藏密室「舊體育器材室」（需器材室銅鑰匙）', condition:function(){ return hasItem('gym_key_1999'); }, next:'d9_secret_gym'},
        {text:'返回六年三班教室', next:'d9_classroom'}
      ]
    };

    SCENES.d9_secret_gym = {
      room:'密', roomName:'舊體育器材室 · 時間膠囊', sceneId:'9-隱藏密室', mood:'mystery',
      text:[
        '<p>跳箱後面放著一只生鏽的餅乾鐵盒，上面用奇異筆寫著：「給 2026 年還沒放棄算那條曲線的自己」。</p>',
        '<p>裡面裝著一張手繪的「迴廊六門草圖」與一枚能消除童年選擇偏誤的「千禧紀念章」。</p>'
      ],
      choices:[
        {text:'收起「千禧紀念章」（徹底化解童年選擇偏誤）', action:function(){
          if(!hasItem('millennium_badge')){
            addItem('millennium_badge', '千禧紀念章', '傳說級童年信物，讓十二歲的你完全信任長大後的你。');
            state.flags.childBias = 0;
            unlockAchievement('ach_d9_bias');
          }
          goToScene('d9_playground');
        }},
        {text:'退回紅土操場', next:'d9_playground'}
      ]
    };

    SCENES.d9_store = {
      room:'福利社', roomName:'合作社福利社', sceneId:'9-福利社', mood:'safe', mapZone:'d9_store',
      text:[
        '<p>隔著綠色鐵窗，福利社阿姨正在清點冰櫃裡的袋裝冬瓜茶與彈珠汽水。牆上掛著牌子：「今日特價：彈珠汽水 10 元」。</p>'
      ],
      choices:[
        {text:'摸摸口袋裡的零用錢，買一瓶「1999 彈珠汽水」與一袋「冬瓜茶」（HP +15）', condition:function(){ return !hasItem('ramune_1999'); }, action:function(){
          addItem('ramune_1999', '1999 彈珠汽水', '冰涼的玻璃瓶裡有一顆清脆的玻璃珠。');
          state.hp = Math.min(state.maxHp||100, state.hp + 15);
          updateHP();
          appendNarrative('<p class="inherit-note">你喝完了冰涼的冬瓜茶（HP +15），把「1999 彈珠汽水」收進書包。</p>');
        }},
        {text:'返回六年三班教室', next:'d9_classroom'}
      ]
    };

    SCENES.d9_magazine = {
      room:'校刊', roomName:'校刊編輯室 · 油印間', sceneId:'9-校刊室', mood:'mystery', mapZone:'d9_magazine',
      text:[
        '<p>校刊編輯室裡擺著一台手搖油印機，桌上攤著《1999 世紀末校刊》的最後一版蠟紙。標題寫著：「五十年後的你，想對現在的自己說什麼？」</p>',
        '<p>放學鐘聲即將響起，十二歲的你跟了進來，仰頭看著你。</p>'
      ],
      choices:[
        {text:'【真結局】出示「千禧紀念章」與「彩色粉筆星」，和小時候的自己一起把紙飛機擲出窗外', condition:function(){ return hasItem('millennium_badge') && hasItem('chalk_star'); }, next:'d9_end_true'},
        {text:'【真結局二】在校刊最後一版印下「03:18 記得抬頭休息」，改寫實驗室猝死的宿命', condition:function(){ return hasItem('millennium_badge'); }, next:'d9_end_true_magazine'},
        {text:'【真結局三】帶著同桌林小滿與小阿凱一起在夕陽下走出校門', condition:function(){ return state.flags.d9_akai_friend && hasItem('chalk_star'); }, next:'d9_end_true_friends'},
        {text:'摸摸十二歲自己的頭，搭上放學路隊離開（普通結局·放學鐘聲）', next:'d9_end_normal'},
        {text:'把未來的論文公式抄在課本最後一頁（普通結局·超前筆記）', next:'d9_end_notes'},
        {text:'躲在福利社後面直到天黑（逃過一劫·夏夜留校）', next:'d9_end_survive'},
        {text:'強迫十二歲的自己背誦高等數學公式，導致認知崩潰（壞結局·童年偏誤反噬）', next:'d9_end_bad_bias', danger:true},
        {text:'把校刊原稿全部撕毀，困在永遠寫不完的暑假作業裡（壞結局·無盡暑假）', next:'d9_end_bad_homework', danger:true}
      ]
    };

    var d9Endings = [
      ['d9_end_true', 'hidden_d9_true', '飛過 1999 的夏天', '白色紙飛機乘著 1999 年夏末的晚風飛過紅土操場、飛過樟樹頂端，穿過二十七年的光陰，穩穩落在你大學實驗室的書桌上。你終於與童年的自己徹底和解。', '真結局 I · 飛過1999的夏天', true],
      ['d9_end_true_magazine', 'hidden_d9_mag', '油墨裡的備忘錄', '手搖油印機滾過蠟紙，把那句「03:18 記得抬頭休息」印進了你的生命底片。當你再次睜眼時，那個凌晨三點十七分的夜晚不再冰冷。', '真結局 II · 油墨備忘錄', true],
      ['d9_end_true_friends', 'hidden_d9_friends', '夕陽下的放學路隊', '吹著哨子的導護老師揮手放行，你、林小滿與小阿凱並肩走過斑馬線，影子被夕陽拉得很長很長。', '真結局 III · 夕陽路隊', true],
      ['d9_end_normal', 'normal_d9_bell', '1999 年的放學鐘', '噹——噹——噹——放學鐘聲響起，你背起書包走出校門，夏天的風溫柔地送了你一程。', '普通結局 · 放學鐘聲', false],
      ['d9_end_notes', 'normal_d9_notes', '課本末頁的塗鴉', '小陸衍似懂非懂地看著那串公式，把它當成某種太空密碼收進了鉛筆盒。', '普通結局 · 超前筆記', false],
      ['d9_end_survive', 'survive_d9_night', '夏夜留校生', '你在空無一人的走廊聽著蛙鳴，翻過矮牆回到了迴廊。', '逃過一劫 · 夏夜留校', false],
      ['d9_end_bad_bias', 'bad_d9_bias', '童年偏誤反噬', '十二歲的你拒絕承認眼前的陌生大人是自己，教室的黑板與課桌在尖叫聲中坍塌成粉筆灰。', '壞結局 · 偏誤反噬', false],
      ['d9_end_bad_homework', 'bad_d9_homework', '八月三十二日', '日曆永遠停在了八月最後一天，桌上堆著永遠寫不完的暑假作業。', '壞結局 · 無盡暑假', false]
    ];

    d9Endings.forEach(function(ed){
      SCENES[ed[0]] = {
        room:'99', roomName:'小學 1999 · 終局', sceneId:'9-結局', mood: ed[1].indexOf('bad_')===0 ? 'terror' : 'safe',
        text:['<p>' + ed[3] + '</p>'],
        onEnter: function(){
          if(ed[5]) unlockAchievement('ach_d9_true');
          if(ed[1].indexOf('bad_') !== 0 && window.V4) V4.markDungeonCleared(9);
          setTimeout(function(){ triggerEnding(ed[1], ed[2], ed[3], ed[4]); }, 500);
        },
        choices:[]
      };
    });
  }
});

function registerV58StoryExpansions(){
  V5.registerStoryPack(1, {
    endingsAdded: 4,
    scenes: {
      d1_secret_boiler: {
        room:'B0', roomName:'地下鍋爐暗室（密室）', sceneId:'1-隱藏密室', mood:'mystery',
        onEnter: function(){ state.flags.d1_boiler_visited = true; },
        text:[
          '<p>你與隊友合力掀開地下室石台側後方的鑄鐵通風蓋，順著繩索滑入一間從未在分布圖上標註的「零號鍋爐暗室」。</p>',
          '<p>停止運轉的蒸汽壓力錶停在「13」帕斯卡。鐵桌上放著旅館初代設計師的手札與一枚「初代總鑰匙胚」。</p>'
        ],
        choices:[
          {text:'拾取「初代總鑰匙胚」與設計師手札（解鎖旅館真結局隱藏旗標）', action:function(){
            addItem('d1_master_blank', '初代總鑰匙胚', '可同時契合正門與鏡像之門的傳說級鑰匙胚。');
            state.flags.d1_true_flag = true;
            appendNarrative('<p class="inherit-note">獲得傳說物品：初代總鑰匙胚（已滿足質數旅館真結局隱藏條件）。</p>');
          }},
          {text:'爬回地下室石室', next:'basement'}
        ]
      },
      arc_suwan_1: {
        room:'3', roomName:'走廊窗台 · 蘇晚支線(壹)', sceneId:'蘇晚弧-1', mood:'melancholy',
        text:[
          '<p>蘇晚站在二樓走廊的釘死木窗旁，從白色連帽衫口袋裡摸出半張被水浸過的高鐵票。</p>',
          '<p>「進來這裡之前，我原本要搭末班車回老家。」她指尖摩挲著車票邊緣，「我媽在巷口開了一家小麵攤，每天收攤前都會給我留半碗陽春麵。」</p>'
        ],
        choices:[
          {text:'安靜聽她說下去（蘇晚好感度 +10）', action:function(){ if(window.V58) V58.addAffinity('suwan', 10); goToScene('arc_suwan_2'); }},
          {text:'暫時返回走廊', next:'corridor'}
        ]
      },
      arc_suwan_2: {
        room:'3', roomName:'樓梯轉角 · 蘇晚支線(貳)', sceneId:'蘇晚弧-2', mood:'mystery',
        text:[
          '<p>「其實這不是我第一次看見『13』這個數字。」蘇晚挽起左袖，手腕內側有一道很淡的舊疤，「三年前的一場車禍，我在急診室醒來的時間就是凌晨三點十三分。」</p>',
          '<p>「那時候有個人在隔壁病床對我說：『疼的就是真的。只要還覺得疼，就別閉眼。』」</p>'
        ],
        choices:[
          {text:'「那個人是誰？我們一定能一起走出去。」', action:function(){ if(window.V58) V58.addAffinity('suwan', 10); goToScene('arc_suwan_3'); }}
        ]
      },
      arc_suwan_3: {
        room:'5', roomName:'5號房門前 · 蘇晚支線(參)', sceneId:'蘇晚弧-3', mood:'tension',
        text:[
          '<p>走廊的燈泡突然劇烈閃爍，蘇晚的「危險直覺」讓她一把拉住你的袖口往後退了半步——地板前方的陰影裡掠過一道鏡面裂隙。</p>',
          '<p>「它想把我們分開。」蘇晚喘了口氣，從口袋裡取出一枚銀色髮夾遞給你，「如果待會置換把我們甩進不同房間，憑這個找我。」</p>'
        ],
        choices:[
          {text:'收下「蘇晚的銀髮夾」，承諾絕不丟下她', action:function(){
            addItem('suwan_hairpin', '蘇晚的銀髮夾', '蘇晚託付給你的信物（稀有），象徵生死與共的信任。');
            if(window.V58) V58.addAffinity('suwan', 15);
            goToScene('arc_suwan_4');
          }}
        ]
      },
      arc_suwan_4: {
        room:'大廳', roomName:'大廳長椅 · 蘇晚支線(肆)', sceneId:'蘇晚弧-4', mood:'safe',
        text:[
          '<p>你們回到大廳短暫喘息。蘇晚看著牆上逼近天亮的掛鐘，第一次露出了極淺的笑意：「陸衍，等走出去之後，不管是凌晨三點十八分還是天亮，我請你吃那碗陽春麵。」</p>'
        ],
        choices:[
          {text:'與蘇晚擊掌立約（完成蘇晚個人支線弧）', action:function(){
            state.flags.arc_suwan_done = true;
            unlockAchievement('ach_v58_suwan_arc');
            if(window.V58) V58.addAffinity('suwan', 15);
            goToScene('arc_suwan_5');
          }}
        ]
      },
      arc_suwan_5: {
        room:'門', roomName:'正門微光 · 蘇晚支線(伍)', sceneId:'蘇晚弧-5', mood:'safe',
        text:[
          '<p>【蘇晚支線完成】蘇晚的「危險直覺」與你的「絕對邏輯」徹底共鳴。現在你可以選擇直接與她開啟專屬結局，或返回走廊繼續探索。</p>'
        ],
        choices:[
          {text:'【解鎖蘇晚專屬真結局】與蘇晚並肩推開破曉的正門', next:'d1_end_suwan_true'},
          {text:'返回二樓走廊繼續探索', next:'corridor'}
        ]
      },

      arc_zhao_1: {
        room:'大廳', roomName:'沙發角落 · 老趙支線(壹)', sceneId:'老趙弧-1', mood:'melancholy',
        text:[
          '<p>老趙把那根一直沒點的皺菸夾在指間，嘆了口氣：「小子，看你斯斯文文的，其實比我有種。我說我見過大陣仗，那是吹牛的。」</p>'
        ],
        choices:[
          {text:'靜靜聽他說下去（老趙好感度 +10）', action:function(){ if(window.V58) V58.addAffinity('laozhou', 10); goToScene('arc_zhao_2'); }},
          {text:'返回走廊', next:'corridor'}
        ]
      },
      arc_zhao_2: {
        room:'樓梯', roomName:'樓梯平台 · 老趙支線(貳)', sceneId:'老趙弧-2', mood:'mystery',
        text:[
          '<p>「我以前是跑夜班貨車的。」老趙摸了摸自己發抖的右手，「三年前在國道上為了閃一隻野貓，車翻進了邊坡。我在駕駛座卡了四個鐘頭，看著儀表板上的時間一分一秒跳到三點十七分。」</p>'
        ],
        choices:[
          {text:'「你活下來了，這次也一樣。」', action:function(){ if(window.V58) V58.addAffinity('laozhou', 15); goToScene('arc_zhao_3'); }}
        ]
      },
      arc_zhao_3: {
        room:'走廊', roomName:'4號房外 · 老趙支線(參)', sceneId:'老趙弧-3', mood:'tension',
        text:[
          '<p>經過 4 號房門縫時，老趙看著裡面那頂舊軍帽與全家福照片，腳步頓住了：「那是我的照片……原來這間房一直在等我自己伸手。」</p>'
        ],
        choices:[
          {text:'一把拉住老趙的肩膀：「照片在等你回家看，不是在門縫裡看！」', action:function(){ if(window.V58) V58.addAffinity('laozhou', 15); goToScene('arc_zhao_4'); }}
        ]
      },
      arc_zhao_4: {
        room:'走廊', roomName:'走廊長燈 · 老趙支線(肆)', sceneId:'老趙弧-4', mood:'safe',
        text:[
          '<p>老趙重重吐出一口氣，原本發抖的右手終於穩了下來。他從懷裡掏出一枚舊黃銅打火機塞進你手裡：「這回我不逞強，聽你的指揮。」</p>'
        ],
        choices:[
          {text:'收下「老趙的黃銅打火機」（完成老趙個人支線弧）', action:function(){
            addItem('zhao_lighter', '老趙的黃銅打火機', '老趙隨身攜帶多年的防風打火機（稀有），可與氧氣瓶組合或照明。');
            state.flags.arc_zhao_done = true;
            unlockAchievement('ach_v58_zhao_arc');
            goToScene('arc_zhao_5');
          }}
        ]
      },
      arc_zhao_5: {
        room:'門', roomName:'老趙的諾言 · 支線(伍)', sceneId:'老趙弧-5', mood:'safe',
        text:[
          '<p>【老趙支線完成】老趙的生死劫已被你化解，他將在關鍵時刻為隊伍扛下致命傷害，並可解鎖老趙生還專屬真結局。</p>'
        ],
        choices:[
          {text:'【解鎖老趙專屬真結局】與老趙、蘇晚全員平安撤離質數旅館', next:'d1_end_zhao_true'},
          {text:'返回二樓走廊', next:'corridor'}
        ]
      },

      arc_akai_1: {
        room:'3', roomName:'鏡前角落 · 阿凱支線(壹)', sceneId:'阿凱弧-1', mood:'mystery',
        text:[
          '<p>阿凱蹲在 3 號房模糊的穿衣鏡前，手裡捏著那根已經沒有糖球的塑膠棒：「喂，陸衍……如果一個人連童年記憶都是從別人腦子裡抄來的，他算不算活過？」</p>'
        ],
        choices:[
          {text:'「只要你現在做出的選擇是你自己的，就算。」（阿凱好感度 +15）', action:function(){ if(window.V58) V58.addAffinity('akai', 15); goToScene('arc_akai_2'); }},
          {text:'返回走廊', next:'corridor'}
        ]
      },
      arc_akai_2: {
        room:'走廊', roomName:'二樓走廊 · 阿凱支線(貳)', sceneId:'阿凱弧-2', mood:'melancholy',
        text:[
          '<p>「旅館叫我把你們引去 2 號房和 1 號房。」阿凱低著頭，聲音很小，「但我看蘇晚那姊們手在抖還擋在你前面，看老趙嘴硬心軟……我突然不想聽旅館的話了。」</p>'
        ],
        choices:[
          {text:'把自己的備用筆記本分給他一頁，寫下他的名字「阿凱」', action:function(){ if(window.V58) V58.addAffinity('akai', 15); goToScene('arc_akai_3'); }}
        ]
      },
      arc_akai_3: {
        room:'7', roomName:'7號房外 · 阿凱支線(參)', sceneId:'阿凱弧-3', mood:'tension',
        text:[
          '<p>鏡像本體在走廊盡頭發出刺耳的低鳴，試圖回收阿凱的意識。阿凱死死咬住嘴唇，把一枚「鏡面逆轉碎片」塞進你手心。</p>'
        ],
        choices:[
          {text:'握緊阿凱的手腕，用邏輯錨定他的存在', action:function(){
            addItem('akai_shard', '阿凱的逆轉碎片', '阿凱違抗旅館規則留下的鏡面結晶（稀有）。');
            state.flags.arc_akai_done = true;
            unlockAchievement('ach_v58_akai_arc');
            goToScene('arc_akai_4');
          }}
        ]
      },
      arc_akai_4: {
        room:'大廳', roomName:'大廳鏡前 · 阿凱支線(肆)', sceneId:'阿凱弧-4', mood:'safe',
        text:[
          '<p>阿凱身上的透明感消退了。他摸了摸自己的胸口，咧嘴一笑：「原來心跳是這種感覺啊。」</p>'
        ],
        choices:[
          {text:'與阿凱確認最終逃脫計畫', next:'arc_akai_5'}
        ]
      },
      arc_akai_5: {
        room:'門', roomName:'第四名真人 · 阿凱支線(伍)', sceneId:'阿凱弧-5', mood:'safe',
        text:[
          '<p>【阿凱支線完成】阿凱擺脫了旅館鏡像的控制，成為了真正站在你身邊的第四名隊友。</p>'
        ],
        choices:[
          {text:'【解鎖阿凱專屬真結局】帶著擁有實體的阿凱走出質數旅館', next:'d1_end_akai_true'},
          {text:'返回二樓走廊', next:'corridor'}
        ]
      },

      d1_end_suwan_true: {
        room:'1', roomName:'黎明街口 · 陽春麵攤', sceneId:'1-真結局·蘇晚', mood:'safe',
        text:['<p>你用初代總鑰匙胚與蘇晚的銀髮夾同時旋開了 1 號門背後真正的黎明鎖。門外不再是白牆迴廊，而是清晨五點半飄著白霧的巷口。蘇晚轉過身，眼底映著第一縷晨光：「走吧，麵攤剛開火。」</p>'],
        onEnter: function(){ state.flags.golden_key=true; state.flags.trusted=true; saveInheritance({suwan_survived:true, golden_key:true, trusted:true}); setTimeout(function(){ triggerEnding('hidden_d1_suwan_true', '巷口的半碗陽春麵', '你完成了蘇晚支線並解開旅館最深處的秘密，與蘇晚一同回到真實的清晨。', '真結局 · 蘇晚支線圓滿'); }, 500); },
        choices:[]
      },
      d1_end_zhao_true: {
        room:'1', roomName:'晨光國道 · 四人同行', sceneId:'1-真結局·老趙', mood:'safe',
        text:['<p>老趙用打火機照亮了最後一級台階，這一次沒有人掉進虛空，也沒有人斷臂。當正門敞開時，老趙看著外面的朝陽，把那根皺巴巴的煙扔進垃圾桶：「戒了！回去抱我閨女！」</p>'],
        onEnter: function(){ saveInheritance({suwan_survived:true, laozhou_survived:true, trusted:true}); setTimeout(function(){ triggerEnding('hidden_d1_zhao_true', '一個都沒少', '你化解了老趙的心魔，帶領全員毫髮無傷地走出質數旅館。', '真結局 · 老趙支線圓滿'); }, 500); },
        choices:[]
      },
      d1_end_akai_true: {
        room:'1', roomName:'陽光下的棒棒糖', sceneId:'1-真結局·阿凱', mood:'safe',
        text:['<p>穿過正門時，阿凱伸手接住了第一縷真正的陽光。他的影子清晰地印在柏油路上——他不再是旅館裡的謊言，而是有名有姓的少年。</p>'],
        onEnter: function(){ saveInheritance({mirror_defeated:true, suwan_survived:true, trusted:true}); setTimeout(function(){ triggerEnding('hidden_d1_akai_true', '第四名真人', '你賦予了鏡像少年阿凱真正的名字與靈魂，帶他走出了質數旅館。', '真結局 · 阿凱支線圓滿'); }, 500); },
        choices:[]
      },
      d1_end_prime_master: {
        room:'0', roomName:'質數原點 · 零號黎明', sceneId:'1-真結局·原點', mood:'safe',
        text:['<p>你集齊了鍋爐暗室的「初代總鑰匙胚」、黃金鑰匙與鏡中屋的草圖，在凌晨來臨前將旅館所有質數與合數房間全部歸位。整座質數旅館化作一張摺疊的數學證明題，安靜地收進你的口袋。</p>'],
        onEnter: function(){ saveInheritance({mirror_defeated:true, golden_key:true, basement_knowledge:true, trusted:true}); setTimeout(function(){ triggerEnding('hidden_d1_prime_true', '質數定理的證明者', '你徹底解構了質數旅館的底層邏輯，達成完美真結局。', '真結局 · 完美破關'); }, 500); },
        choices:[]
      }
    },
    inject: [
      {into:'basement', choice:{text:'掀開石台後的鑄鐵通風蓋，進入「地下鍋爐暗室」（隱藏密室）', condition:function(){ return hasItem('rope') || hasItem('golden_key'); }, next:'d1_secret_boiler'}},
      {into:'corridor', choice:{text:'【蘇晚支線】走到窗台邊與蘇晚聊聊那張舊車票', condition:function(){ return !state.flags.arc_suwan_done; }, next:'arc_suwan_1'}},
      {into:'corridor', choice:{text:'【老趙支線】詢問老趙為什麼右手一直在發抖', condition:function(){ return !state.flags.zhao_dead && !state.flags.arc_zhao_done; }, next:'arc_zhao_1'}},
      {into:'corridor', choice:{text:'【阿凱支線】單獨問阿凱關於鏡像與棒棒糖的事', condition:function(){ return !state.flags.akai_dead && !state.flags.arc_akai_done; }, next:'arc_akai_1'}},
      {into:'mirror_final', choice:{text:'【真結局】以「初代總鑰匙胚」與黃金鑰匙重構質數原點', condition:function(){ return hasItem('d1_master_blank') && (hasItem('golden_key') || state.flags.d1_true_flag); }, next:'d1_end_prime_master'}}
    ]
  });

  V5.registerStoryPack(2, {
    endingsAdded: 3,
    scenes: {
      d2_secret_bindery: {
        room:'修', roomName:'古籍修復暗室（密室）', sceneId:'2-隱藏密室', mood:'safe',
        onEnter: function(){ state.flags.d2_bindery_visited = true; },
        text:[
          '<p>你憑藉黃金鑰匙（或索書卡）推開閱覽室書架後的「古籍修復暗室」。這裡隔絕了外面的聲音規則，桌上擺著針線、漿糊與未裝訂的空白書頁。</p>',
          '<p>你在修復台下找到了第二任管理員（媛媛父親）留下的「無聲裝訂針」。</p>'
        ],
        choices:[
          {text:'取走「無聲裝訂針」，將《陸衍的一生》與同伴的書頁重新縫合', action:function(){
            addItem('d2_binding_needle', '無聲裝訂針', '可改寫並保護書頁不被圖書館吞噬的傳說級工具。');
            state.flags.d2_true_flag = true;
            appendNarrative('<p class="inherit-note">獲得傳說物品：無聲裝訂針（已解鎖沉默圖書館真結局條件）。</p>');
          }},
          {text:'返回閱覽室', next:'reading_room'}
        ]
      },
      d2_end_true_symphony: {
        room:'聲', roomName:'破除靜默 · 朗讀黎明', sceneId:'2-真結局I', mood:'safe',
        text:['<p>你用「無聲裝訂針」將陳姐、老周、小宇與媛媛的書頁緊緊縫合在《陸衍的一生》旁。當你推開地毯下的真正出口時，圖書館的禁聲規則轟然瓦解，你們在陽光下第一次大聲喊出了彼此的名字。</p>'],
        onEnter: function(){ saveInheritance({chen_survived:true, laozhou_survived:true, xiaoyu_survived:true, second_cleared:true}); localStorage.setItem('wuxian-second-cleared','true'); setTimeout(function(){ triggerEnding('hidden_d2_true_voice', '重獲聲音的讀者們', '你破除了沉默圖書館的禁聲詛咒，帶領所有同伴與管理員的託付重返人間。', '真結局 I · 破除靜默'); }, 500); },
        choices:[]
      },
      d2_end_true_chronicler: {
        room:'書', roomName:'空白末頁的續寫者', sceneId:'2-真結局II', mood:'safe',
        text:['<p>你在《陸衍的一生》最後一頁空白處，用裝訂針與鋼筆親手寫下了「未完待續」。書架向兩側退開，露出了通往真實世界的長階。</p>'],
        onEnter: function(){ saveInheritance({second_cleared:true, trusted:true}); localStorage.setItem('wuxian-second-cleared','true'); setTimeout(function(){ triggerEnding('hidden_d2_true_pen', '自書命運之人', '你奪回了書寫自己人生的筆，達成沉默圖書館第二真結局。', '真結局 II · 自書命運'); }, 500); },
        choices:[]
      },
      d2_end_true_librarian: {
        room:'門', roomName:'三代管理員的謝幕', sceneId:'2-真結局III', mood:'safe',
        text:['<p>你將媛媛的畫冊、管理員日記與無聲之書一併交還借書台。第三任管理員終於摘下眼鏡，對你說出了他多年來的第一句話：「謝謝你，圖書館今天正式閉館了。」</p>'],
        onEnter: function(){ saveInheritance({second_cleared:true, admin_guest:true}); localStorage.setItem('wuxian-second-cleared','true'); setTimeout(function(){ triggerEnding('hidden_d2_true_close', '永久閉館日', '你解開了三代圖書館管理員的心結，讓整座圖書館安然謝幕。', '真結局 III · 永久閉館'); }, 500); },
        choices:[]
      }
    },
    inject: [
      {into:'reading_room', choice:{text:'推開書架後的「古籍修復暗室」（隱藏密室）', condition:function(){ return hasItem('golden_key') || hasItem('your_book') || (state.inheritance && state.inheritance.golden_key); }, next:'d2_secret_bindery'}},
      {into:'final_prep', choice:{text:'【真結局 I】以「無聲裝訂針」縫合眾人書頁，破除靜默詛咒全員逃脫', condition:function(){ return hasItem('d2_binding_needle'); }, next:'d2_end_true_symphony'}},
      {into:'final_prep', choice:{text:'【真結局 II】在《陸衍的一生》末頁親手續寫未來', condition:function(){ return hasItem('d2_binding_needle') && hasItem('your_book'); }, next:'d2_end_true_chronicler'}},
      {into:'admin_deal', choice:{text:'【真結局 III】將無聲裝訂針與媛媛畫冊交還管理員，宣告永久閉館', condition:function(){ return hasItem('d2_binding_needle') && hasItem('yuanyuan_album'); }, next:'d2_end_true_librarian'}}
    ]
  });

  V5.registerStoryPack(3, {
    endingsAdded: 3,
    scenes: {
      d3_secret_rooftop: {
        room:'R', roomName:'頂樓天台溫室（密室）', sceneId:'3-隱藏密室', mood:'safe',
        onEnter: function(){ state.flags.d3_rooftop_visited = true; },
        text:[
          '<p>你從四樓走廊盡頭的消防安全門爬上「頂樓天台溫室」。這裡種滿了早年林醫生與小護士周敏為媛媛栽種的向日葵，陽光透過玻璃棚頂灑下來，連手腕上的倒計時都在這裡暫停了跳動。</p>',
          '<p>花盆底下壓著一枚「向日葵種子膠囊」與完整的院方赦免令。</p>'
        ],
        choices:[
          {text:'拾取「向日葵種子膠囊」（倒計時 +20 分鐘，解鎖醫院真結局旗標）', action:function(){
            if(!hasItem('d3_sunflower_seed')){
              addItem('d3_sunflower_seed', '向日葵種子膠囊', '頂樓溫室保存至今的生機膠囊（傳說）。');
              addTime(20);
              state.flags.d3_true_flag = true;
              appendNarrative('<p class="inherit-note">獲得傳說物品：向日葵種子膠囊（倒計時 +20 分鐘，已滿足醫院真結局條件）。</p>');
            }
          }},
          {text:'返回四樓走廊', next:'ward4_floor'}
        ]
      },
      d3_end_true_sunrise: {
        room:'曉', roomName:'天台日出 · 倒計時歸零之後', sceneId:'3-真結局I', mood:'safe',
        text:['<p>你將「向日葵種子膠囊」與媛媛的記憶卡一同放進 B2 主機的休眠槽。機器沒有爆炸，也沒有刪除任何人的記憶，而是化作溫暖的春風吹遍整棟醫院。你帶著林醫生、小雨與十四名清醒過來的病人走上天台，迎接真正的日出。</p>'],
        onEnter: function(){ saveInheritance({xiaoyu_survived:true, yuanyuan_carried:true, memory_kept:true, third_cleared:true}); localStorage.setItem('wuxian-third-cleared','true'); setTimeout(function(){ triggerEnding('hidden_d3_true_sunrise', '向日葵盛開的早晨', '你用溫室的生機膠囊逆轉了記憶提取機，拯救了醫院裡所有的靈魂。', '真結局 I · 破曉仁心'); }, 500); },
        choices:[]
      },
      d3_end_true_zhoumin: {
        room:'14', roomName:'第十四格的花束', sceneId:'3-真結局II', mood:'safe',
        text:['<p>你把向日葵放在太平間第十四格門前。夜巡護士周敏停下了腳步，摘下護士帽，對你露出了釋然的微笑。她替你們打開了通往地面花園的急診大門。</p>'],
        onEnter: function(){ saveInheritance({third_cleared:true, memory_kept:true}); localStorage.setItem('wuxian-third-cleared','true'); setTimeout(function(){ triggerEnding('hidden_d3_true_nurse', '夜巡結束的鐘聲', '你完成了周敏最後的心願，讓漫長的夜班終於迎來下班的晨光。', '真結局 II · 夜巡謝幕'); }, 500); },
        choices:[]
      },
      d3_end_true_family: {
        room:'家', roomName:'紅燒肉與紙飛機', sceneId:'3-真結局III', mood:'safe',
        text:['<p>林醫生放下了手術刀，小雨握著車票，媛媛的紙飛機從窗口飛向藍天。手腕上的倒計時錶啪地一聲解開脫落，你們再也不受時間追趕。</p>'],
        onEnter: function(){ saveInheritance({xiaoyu_survived:true, yuanyuan_carried:true, third_cleared:true}); localStorage.setItem('wuxian-third-cleared','true'); setTimeout(function(){ triggerEnding('hidden_d3_true_family', '不再倒數的時間', '所有人的執念都在黎明前得到了安放，達成倒計時醫院第三真結局。', '真結局 III · 時間解鎖'); }, 500); },
        choices:[]
      }
    },
    inject: [
      {into:'ward4_floor', choice:{text:'推開走廊盡頭的消防門，登上「頂樓天台溫室」（隱藏密室）', next:'d3_secret_rooftop'}},
      {into:'basement', choice:{text:'【真結局 I】將「向日葵種子膠囊」與媛媛記憶植入核心，逆轉整座醫院', condition:function(){ return hasItem('d3_sunflower_seed'); }, next:'d3_end_true_sunrise'}},
      {into:'morgue', choice:{text:'【真結局 II】將「向日葵種子膠囊」獻給太平間第十四格的周敏', condition:function(){ return hasItem('d3_sunflower_seed'); }, next:'d3_end_true_zhoumin'}},
      {into:'lin_final_choice', choice:{text:'【真結局 III】出示「向日葵種子膠囊」，讓林醫生與小雨一同解脫', condition:function(){ return hasItem('d3_sunflower_seed'); }, next:'d3_end_true_family'}}
    ]
  });

  V5.registerStoryPack(4, {
    endingsAdded: 1,
    scenes: {
      d4_secret_watchtower: {
        room:'燈', roomName:'守門人的燈芯密室（密室）', sceneId:'4-隱藏密室', mood:'safe',
        text:['<p>你從守門人木椅下方的暗格走進「燈芯密室」。這裡存放著九枚迴廊碎片的共鳴母石，只要觸碰即可點亮那盞沒有火的燈。</p>'],
        choices:[
          {text:'點亮「守門人母石」（直接滿足第四扇門真結局條件）', action:function(){
            addItem('d4_lantern_core', '不滅燈芯', '守門人留下的傳說級火種。');
            state.flags.d4_true_flag = true;
            goToScene('gate');
          }},
          {text:'返回守門人的椅子', next:'chair'}
        ]
      },
      d4_end_true_keepers: {
        room:'門', roomName:'提燈同行 · 跨越心臟', sceneId:'4-真結局II', mood:'safe',
        text:['<p>你用「不滅燈芯」點亮了守門人的提燈。三扇舊門的陰影同時化作溫暖的路標，你與守門人一同邁出了迴廊心臟。</p>'],
        onEnter: function(){ if(window.V4) V4.markDungeonCleared(4); setTimeout(function(){ triggerEnding('hidden_d4_lantern_true', '點燈人的黎明', '你尋獲了燈芯密室的不滅火種，照亮了所有門後的歸途。', '真結局 · 提燈破曉'); }, 500); },
        choices:[]
      }
    },
    inject: [
      {into:'chair', choice:{text:'開啟木椅下方的「守門人燈芯密室」（隱藏密室）', next:'d4_secret_watchtower'}},
      {into:'choice_hall', choice:{text:'【真結局】以「不滅燈芯」點亮守門人之燈，跨越迴廊心臟', condition:function(){ return hasItem('d4_lantern_core'); }, next:'d4_end_true_keepers'}}
    ]
  });

  V5.registerStoryPack(5, {
    endingsAdded: 1,
    scenes: {
      d5_secret_coral: {
        room:'淵', roomName:'海心珊瑚密室（密室）', sceneId:'5-隱藏密室', mood:'safe',
        text:['<p>你在退潮海床的石縫深處發現了一座乾燥的「海心珊瑚密室」。石桌上擺著一枚裝滿星光的「定潮玻璃瓶」。</p>'],
        choices:[
          {text:'拾取「定潮玻璃瓶」（迴光粒 +3，解鎖第五扇門新真結局）', action:function(){
            addItem('d5_tide_bottle', '定潮玻璃瓶', '封存著平靜海面與星光的傳說級信物。');
            state.echo = Math.min(9, (state.echo||3) + 3);
            goToScene('d5_seabed');
          }},
          {text:'返回退潮海床', next:'d5_seabed'}
        ]
      },
      d5_end_true_starlight: {
        room:'海', roomName:'星光海面 · 萬路皆歸', sceneId:'5-真結局II', mood:'safe',
        text:['<p>你打開「定潮玻璃瓶」，星光鋪滿了整片迴光之海。所有未曾踏上的岔路都在海面上化作發光的橋樑，送你走回真實的岸邊。</p>'],
        onEnter: function(){ if(window.V4) V4.markDungeonCleared(5); setTimeout(function(){ triggerEnding('hidden_d5_starlight_true', '星光鋪就的歸航', '你在海心珊瑚密室找到了定潮星光，讓所有未選之路皆成坦途。', '真結局 · 星海歸航'); }, 500); },
        choices:[]
      }
    },
    inject: [
      {into:'d5_seabed', choice:{text:'潛入石縫深處的「海心珊瑚密室」（隱藏密室）', next:'d5_secret_coral'}},
      {into:'d5_deepgate', choice:{text:'【真結局】傾倒「定潮玻璃瓶」，踏著星光海面登岸', condition:function(){ return hasItem('d5_tide_bottle'); }, next:'d5_end_true_starlight'}}
    ]
  });
}


/* ============================================================
 * 二、敘事系統深化（2.1 好感度 / 2.2 NPC 記憶與多階段對話 / 2.3 記事本回顧與本局回顧）
 * ============================================================ */

var LS_AFFINITY = 'wuxian-v58-affinity';
var LS_SHOP     = 'wuxian-v58-shop';
var LS_SHARDS   = 'wuxian-v58-shards';
var LS_PERSIST  = 'wuxian-v58-persist-items';
var LS_BACKUPS  = 'wuxian-v58-save-backups';
var LS_DAILY    = 'wuxian-v58-daily-best';

function v58GetJSON(k, def){ try{ var v=JSON.parse(localStorage.getItem(k)); return v==null?def:v; }catch(e){ return def; } }
function v58SetJSON(k, val){ try{ localStorage.setItem(k, JSON.stringify(val)); }catch(e){} }

var DEFAULT_AFFINITY = {
  suwan: 65, laozhou: 55, akai: 50,
  hotel_landlord: 45, hotel_girl: 60,
  library_admin: 50, hospital_doctor: 60, night_nurse: 45,
  gatekeeper: 60, tide_echo: 65, obs_chen: 70,
  tram_conductor: 55, tram_mirror_you: 50, tram_girl: 65, tram_tuner: 60, tram_oldman: 65, tram_sleeper: 50, tram_vendor: 55,
  buffet_chef: 60, child_self: 65, classmate_lin: 70
};

function getAffinityMap(){
  var saved = v58GetJSON(LS_AFFINITY, {});
  return Object.assign({}, DEFAULT_AFFINITY, saved);
}
function getNpcAffinity(npcKey){
  var m = getAffinityMap();
  return m[npcKey] != null ? m[npcKey] : 50;
}
function addNpcAffinity(npcKey, delta){
  var m = getAffinityMap();
  var cur = m[npcKey] != null ? m[npcKey] : 50;
  var next = Math.max(0, Math.min(100, cur + delta));
  m[npcKey] = next;
  v58SetJSON(LS_AFFINITY, m);
  var prof = window.NPC_PROFILES && NPC_PROFILES[npcKey];
  var name = prof ? prof.name : npcKey;
  if(delta > 0) showToast(name + ' 好感度 +' + delta + '（當前 ' + next + '）');
  else if(delta < 0) showToast(name + ' 好感度 ' + delta + '（當前 ' + next + '）');
  updateV58HUD();
  return next;
}
window.getNpcAffinity = getNpcAffinity;
window.addNpcAffinity = addNpcAffinity;

function trustSvgFor(val){
  if(val >= 70){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="#e06a6a"><path d="M12 21s-7-4.5-9.5-8.5C.5 9 2.5 5 6.5 5c2.2 0 4 1.2 5.5 3 1.5-1.8 3.3-3 5.5-3 4 0 6 4 4 7.5C19 16.5 12 21 12 21z"/></svg>';
  }
  if(val < 40){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="#d9534f"><circle cx="12" cy="12" r="9"/><path d="M8 9l2.5 1.5M16 9l-2.5 1.5M8.5 16.5c1.5-1.5 5.5-1.5 7 0"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" fill="none" stroke="#c9a96e"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5"/><circle cx="12" cy="17.5" r=".8"/></svg>';
}

function registerV58NpcProfilesAndDialogues(){
  if(!window.NPC_PROFILES || !window.DIALOGUE_TREES) return;
  var newNpcs = {
    tram_conductor:  {name:'列車長·沈默', desc:'第七扇門「鏡像電車」的剪票員。手握打孔鉗，見證過無數與自己擦肩而過的乘客。'},
    tram_mirror_you: {name:'車窗裡的你', desc:'鏡像電車對向車廂裡的倒影。總是做出與你相反的決定，卻與你性命相連。'},
    tram_girl:       {name:'紅圍巾少女·林雙', desc:'坐在電車第三排的少女。為了找回在上一站弄丟的雙胞胎姊姊而一直搭車。'},
    tram_tuner:      {name:'調音師·宋弦', desc:'戴著舊式監聽耳機的青年。能聽見鐵軌接縫處的質數節拍。'},
    tram_oldman:     {name:'抱時刻表的老人', desc:'雙目失明卻能背出所有站點發車時間的老鐵道員。'},
    tram_sleeper:    {name:'沉睡的夜班客', desc:'靠在車門邊熟睡的西裝男，口袋裡揣著兩張不同日期的車票。'},
    tram_vendor:     {name:'月台小販·阿婆', desc:'提著竹籃在車廂間兜售「記憶車票」與礦泉水的老婦人。'},
    buffet_chef:     {name:'主廚·老陳', desc:'第八扇門「無盡自助餐」的主理人。能把每位客人的悲歡離合熬成一碗熱湯。'},
    child_self:      {name:'十二歲的陸衍', desc:'第九扇門「小學 1999」裡小時候的你。正在課堂上偷折紙飛機。'},
    classmate_lin:   {name:'同桌·林小滿', desc:'1999 年六年三班的同桌女生。總是借給你半塊橡皮擦與彩色粉筆。'}
  };
  Object.keys(newNpcs).forEach(function(k){ NPC_PROFILES[k] = newNpcs[k]; });

  function makeMultiStageTree(npcKey, stages, giftItem){
    return {
      start: 'stage1',
      startReturning: 'stage1',
      nodes: {
        stage1: {
          reply: stages[0],
          options: [
            {text:'深入交談（推進對話階段 I → II，好感度 +8）', action:function(){ addNpcAffinity(npcKey, 8); }, next:'stage2'},
            {text:'詢問關於這扇門扉的隱藏規則', next:'stage_rule'},
            {text:'冷淡質疑對方的動機（好感度 -10）', action:function(){ addNpcAffinity(npcKey, -10); }, next:'stage_cold'}
          ]
        },
        stage2: {
          reply: stages[1],
          options: [
            {text:'傾聽對方不為人知的過去（階段 II → III，好感度 +10）', action:function(){ addNpcAffinity(npcKey, 10); }, next:'stage3'},
            {text:'返回上一話題', next:'stage1'}
          ]
        },
        stage3: {
          reply: stages[2],
          options: [
            {text:'【高好感專屬】請求對方的信物與支援（需好感度 >= 70）', condition:function(){ return getNpcAffinity(npcKey) >= 70; }, action:function(){
              if(giftItem && !hasItem(giftItem.id)){
                addItem(giftItem.id, giftItem.name, giftItem.desc, giftItem.usage||'');
                showToast('獲得高好感贈禮：' + giftItem.name);
              }
            }, next:'stage_high'},
            {text:'結束深談', next:'stage1'}
          ]
        },
        stage_rule: {
          reply: stages[3] || '「記住，這裡的每一條規則都有一道給清醒者留的後門。」',
          options: [{text:'明白了', next:'stage1'}]
        },
        stage_cold: {
          reply: '（對方的眼神冷了下來，往後退了半步，顯然對你的戒心更重了。）',
          options: [{text:'緩和語氣道歉（好感度 +5）', action:function(){ addNpcAffinity(npcKey, 5); }, next:'stage1'}]
        },
        stage_high: {
          reply: stages[4] || '「既然是你，這件東西交給你我最放心。萬一遇到危險，我會替你擋下來。」',
          options: [{text:'鄭重道謝', next:'stage1'}]
        }
      }
    };
  }

  DIALOGUE_TREES.tram_conductor = makeMultiStageTree('tram_conductor', [
    '「請出示車票。」沈默推了推帽簷，「這班車只載還有遺憾的人。你看車窗對面——那個你，比你更想下車。」',
    '「我在這輛車上剪了三十年的票。有的人把對面的自己撞碎了，結果下車時只剩半個影子。」',
    '「03:28 是唯一一次雙軌重合的時刻。如果你去過車廂連接處的密室，那把制動扳手能救你們兩個。」',
    '「站點每次發車都會重新洗牌，但終點永遠是駕駛室。」',
    '「拿著這張『列車長通行證』吧。到了駕駛室，它能幫你穩住儀表。」'
  ], {id:'conductor_pass', name:'列車長通行證', desc:'沈默贈予的高好感信物（稀有），可減少鏡像電車傷害。'});

  DIALOGUE_TREES.tram_mirror_you = makeMultiStageTree('tram_mirror_you', [
    '（車窗對面的你把掌心貼在玻璃上，聲音直接傳進你腦海。）「為什麼每次都是你選安全的那條路，而我要替你去踩所有的陷阱？」',
    '「在旅館裡你沒開 2 號門，是我替你開了；在圖書館你沒出聲，是我替你喊了出來。我們本來就是同一個人。」',
    '「到了終點站，別丟下我。只要我們生命同步，就能一起走出地鐵口。」'
  ], {id:'mirror_sync_ring', name:'雙軌同調指環', desc:'車窗裡的你隔著玻璃遞來的指環（稀有）。'});

  DIALOGUE_TREES.tram_girl = makeMultiStageTree('tram_girl', [
    '林雙緊緊抓著紅圍巾：「你有看見我姊姊嗎？她跟我在同一個月台上車，卻進了對面那班電車。」',
    '「原來我們不是雙胞胎……她就是鏡子裡的我，對不對？」',
    '「謝謝你陪我說話。這張反光書籤給你，看著它就不會被車窗晃花了眼。」'
  ], {id:'lin_bookmark', name:'紅圍巾書籤', desc:'林雙贈予的溫暖信物，降低壓力累積。'});

  DIALOGUE_TREES.tram_tuner = makeMultiStageTree('tram_tuner', [
    '宋弦摘下一邊耳機：「聽，鐵軌的震動是 +3、+5、+7、+11……這是一條用質數鋪成的軌道。」',
    '「只要算準 03:28 的共振點，兩列電車就不會相撞，而是像和弦一樣疊在一起。」',
    '「這枚調音笛給你，危急時吹響它能穩定心神。」'
  ], {id:'tuner_whistle', name:'共鳴調音笛', desc:'宋弦贈予的音叉笛（稀有）。'});

  DIALOGUE_TREES.tram_oldman = makeMultiStageTree('tram_oldman', [
    '老人摸索著膝上的時刻表：「眼睛看不見也好，至少不會被車窗對面的倒影嚇著。」',
    '「年輕人，第四個問題的開關在 4 號座底下，別被說假話的孩子騙了。」',
    '「願你到站時天已經亮了。」'
  ]);
  DIALOGUE_TREES.tram_sleeper = makeMultiStageTree('tram_sleeper', [
    '西裝男迷迷糊糊地睜開眼：「到站了嗎？我還在趕凌晨三點十七分的報告……」',
    '「千萬別在車上睡死過去，睡著了就永遠下不了車了。」',
    '「我口袋裡這包薄荷糖給你提神。」'
  ], {id:'mint_candy', name:'提神薄荷糖', desc:'消除 20 點壓力值。'});
  DIALOGUE_TREES.tram_vendor = makeMultiStageTree('tram_vendor', [
    '阿婆掀開竹籃上的白布：「買瓶水吧，車廂裡乾得很。」',
    '「前幾班車有個穿白連帽衫的姑娘，買了兩瓶水，說一瓶留給叫陸衍的人。」',
    '「那姑娘留下的這瓶水，阿婆拿給你。」'
  ], {id:'suwan_water', name:'蘇晚留下的礦泉水', desc:'恢復 20 HP。'});

  DIALOGUE_TREES.buffet_chef = makeMultiStageTree('buffet_chef', [
    '主廚老陳擦拭著銀盤：「歡迎光臨。這裡的每道菜都是一段真實的人生，請細嚼慢嚥。」',
    '「很多人進來時餓壞了，見什麼吃什麼，結果撐死在長桌旁，自己也變成了菜。」',
    '「八分飽是最好的狀態。去後廚冷庫看看吧，密碼是 35，那裡有我留給你們的家常食譜。」'
  ], {id:'chef_spoon', name:'主廚的銀湯匙', desc:'老陳贈予的試味湯匙（稀有），品嚐料理額外 +5 HP。'});

  DIALOGUE_TREES.child_self = makeMultiStageTree('child_self', [
    '十二歲的你抬起頭，眼神清澈卻倔強：「你是長大後的我？那你算完那條質數曲線了嗎？」',
    '「我們長大後是不是變得很孤單？連喝咖啡都是一個人在實驗室喝。」',
    '「不過沒關係，現在你身邊有蘇晚、老趙他們了。把這架紙飛機拿去吧！」'
  ], {id:'plane_1999', name:'1999年的紙飛機', desc:'十二歲的自己親手折的紙飛機（傳說）。'});

  DIALOGUE_TREES.classmate_lin = makeMultiStageTree('classmate_lin', [
    '同桌林小滿把鉛筆盒往中間推了推：「喂，陸衍，黑板上的附加題答案是 5 啦，別發呆了！」',
    '「你今天怪怪的，說話像個二十幾歲的大人一樣。」',
    '「這塊幸運橡皮擦送你，寫錯的答案擦掉重寫就好了！」'
  ], {id:'eraser_1999', name:'幸運橡皮擦', desc:'林小滿送你的橡皮擦，可在謎題錯誤時免除一次懲罰。'});

  if(typeof window.getInheritancePrologue === 'function' && !window.getInheritancePrologue.__v58){
    var _origInhPro = window.getInheritancePrologue;
    window.getInheritancePrologue = function(npcKey){
      var lines = _origInhPro.apply(this, arguments) || [];
      var inh = (window.state && state.inheritance) ? state.inheritance : loadInheritance();
      var aff = getNpcAffinity(npcKey);
      if(inh.golden_key && inh.alone_escape && (npcKey==='suwan' || npcKey==='laozhou' || npcKey==='akai')){
        lines.unshift('（對方的目光落在你口袋裡的黃金鑰匙輪廓上，臉色微微一白。）「是你……上一次你拿了黃金鑰匙，卻獨自走掉了，把我們丟在後面。」');
      }
      if(aff >= 80){
        lines.push('（對方看著你的眼神充滿信任，主動走近了半步。）「有你在，這地方好像也沒那麼可怕了。」');
      }else if(aff < 35){
        lines.push('（對方警戒地盯著你，手按在防身物品上，顯然對你缺乏信任。）');
      }
      return lines;
    };
    window.getInheritancePrologue.__v58 = true;
  }

  ['suwan','laozhou','akai','library_admin','hospital_doctor'].forEach(function(k){
    var tree = DIALOGUE_TREES[k];
    if(!tree || !tree.nodes || !tree.nodes.root) return;
    var rootOpts = tree.nodes.root.options || [];
    if(!rootOpts.some(function(o){ return o.__v58Aff; })){
      tree.nodes.v58_trust_node = {
        reply: '（聽到你的承諾，對方的神色明顯柔和了下來。）「好。在這條迴廊裡，我們互相照應。如果你受了重傷，我會替你擋著，這包急救繃帶你先拿著。」',
        onVisit: function(){
          addNpcAffinity(k, 12);
          if(getNpcAffinity(k) >= 75 && !hasItem('trust_bandage_' + k)){
            addItem('trust_bandage_' + k, NPC_PROFILES[k].name + '的急救包', '高好感度夥伴贈予的醫療包（可分配給自己或隊友恢復 30 HP）。');
          }
        },
        options: [{text:'回到對話', next:'root'}]
      };
      rootOpts.push({
        text:'【信任交流】確認彼此狀況並承諾並肩作戰（好感度 +12，高好感獲贈急救包）',
        next:'v58_trust_node',
        __v58Aff: true
      });
    }
  });
}

/* ============================================================
 * 三、玩法機制升級
 * ============================================================ */
var puzzleAutoHintTimer = null;

function setupV58PuzzleUpgrades(){
  if(typeof window.openPuzzle === 'function' && !window.openPuzzle.__v58){
    var _op = window.openPuzzle;
    window.openPuzzle = function(title, text, answer, cb, hint){
      if(puzzleAutoHintTimer){ clearTimeout(puzzleAutoHintTimer); puzzleAutoHintTimer = null; }
      var r = _op.apply(this, arguments);
      var actions = document.querySelector('#puzzle-modal .puzzle-actions');
      if(actions && !document.getElementById('v58-item-hint-btn')){
        var ihBtn = document.createElement('button');
        ihBtn.type = 'button';
        ihBtn.id = 'v58-item-hint-btn';
        ihBtn.textContent = '耗物換提示';
        ihBtn.title = '消耗一件普通物品，直接揭示本題完整解法提示與首字線索';
        ihBtn.onclick = function(){
          if(!state || !state.inventory || state.inventory.length === 0){
            showToast('背包裡沒有可消耗的物品');
            return;
          }
          var sacrifice = state.inventory[0];
          removeItem(sacrifice.id);
          var ht = $('puzzle-hint-text');
          if(ht){
            ht.style.display = 'block';
            ht.textContent = (state.puzzleHint || '仔細觀察題面數字規律。') + ' 【物品共鳴直通線索：答案共 ' + String(state.puzzleAnswer||'').length + ' 位，首字為「' + String(state.puzzleAnswer||'').charAt(0) + '」】';
          }
          showToast('已消耗「' + sacrifice.name + '」換取深度提示');
        };
        actions.insertBefore(ihBtn, actions.firstChild);
      }
      puzzleAutoHintTimer = setTimeout(function(){
        var pm = $('puzzle-modal');
        if(pm && pm.classList.contains('show')){
          var ht = $('puzzle-hint-text');
          if(ht){
            ht.style.display = 'block';
            ht.textContent = '【思考超過 3 分鐘 · 自動提示】' + (state.puzzleHint || '答案與當前房間的質數/時間規律有關，首字為「' + String(state.puzzleAnswer||'').charAt(0) + '」。');
          }
          showToast('已為你自動開啟謎題提示');
        }
      }, 180000);
      return r;
    };
    window.openPuzzle.__v58 = true;
  }

  if(typeof window.closePuzzle === 'function' && !window.closePuzzle.__v58){
    var _cp = window.closePuzzle;
    window.closePuzzle = function(){
      if(puzzleAutoHintTimer){ clearTimeout(puzzleAutoHintTimer); puzzleAutoHintTimer = null; }
      return _cp.apply(this, arguments);
    };
    window.closePuzzle.__v58 = true;
  }

  if(typeof window.submitPuzzle === 'function' && !window.submitPuzzle.__v58){
    window.submitPuzzle = function(){
      var val = $('puzzle-input').value.trim();
      var ok = (val === state.puzzleAnswer);
      if(!ok && hasItem('eraser_1999')){
        removeItem('eraser_1999');
        showToast('幸運橡皮擦發動：免除一次答錯懲罰，請再試一次！');
        return;
      }
      if(!ok){
        state.puzzleAttempts = (state.puzzleAttempts || 0) + 1;
        addStress(8, '謎題輸入錯誤觸發警報');
        if(SETTINGS.v58Difficulty !== 'story' && state.hp > 10){
          state.hp = Math.max(5, state.hp - 5);
          updateHP();
        }
        if(state.puzzleAttempts < 2){
          showToast('密碼錯誤（觸發警報：壓力 +8，可繼續嘗試或查看提示）');
          return;
        }
      }
      var cb = state.puzzleCallback;
      closePuzzle();
      if(cb) cb(ok);
    };
    window.submitPuzzle.__v58 = true;
  }
}

var ITEM_RARITY = {
  golden_key:'legendary', golden_key2:'legendary', d1_master_blank:'legendary',
  d2_binding_needle:'legendary', d3_sunflower_seed:'legendary', d4_lantern_core:'legendary',
  d5_tide_bottle:'legendary', d6_dawn_tape:'legendary', d6_symphony_tape:'legendary',
  tram_wrench:'legendary', chef_recipe:'legendary', millennium_badge:'legendary', plane_1999:'legendary',
  molotov_bomb:'rare', temp_passkey:'rare', epinephrine_sedative:'rare', antibiotic_painkiller:'rare',
  prime_compass:'rare', bookmark_jade:'rare', pulse_stabilizer:'rare', astral_ember:'rare',
  tide_pearl:'rare', dawn_crystal:'rare', tram_token:'rare', tram_timetable:'rare',
  suwan_hairpin:'rare', zhao_lighter:'rare', akai_shard:'rare', conductor_pass:'rare'
};

var RARITY_LABEL = {
  common:    ['普通', 'v58-rarity-common'],
  rare:      ['稀有', 'v58-rarity-rare'],
  legendary: ['傳說', 'v58-rarity-legendary']
};

function getItemRarity(id){
  return ITEM_RARITY[id] || 'common';
}

function setupV58ItemUpgrades(){
  if(window.COMBINATION_RECIPES){
    COMBINATION_RECIPES['temp_passkey'] = {
      ingredients:['keycard_lab','magnet_coil'],
      name:'臨時磁感鑰匙',
      desc:'【稀有】實驗室門禁卡貼合強磁線圈後重寫了磁軌，可刷開大多數電子門鎖與暗格。',
      usage:'通用電子門禁與鎖具開啟（等同持有備用鑰匙）'
    };
    COMBINATION_RECIPES['molotov_bomb'] = {
      ingredients:['oxygen_flask','zhao_lighter'],
      name:'高壓燃燒彈',
      desc:'【稀有】醫療袖珍氧氣瓶與老趙的防風打火機組裝而成的強效燃燒裝置。',
      usage:'可在遭遇夜巡護士、鏡像或高壓幻覺時一擊逼退敵人並恢復 25 HP'
    };
  }
  if(window.ITEM_CONSUMABLES){
    ITEM_CONSUMABLES.molotov_bomb = {use:function(){
      if(!hasItem('molotov_bomb')) return false;
      removeItem('molotov_bomb');
      state.hp = Math.min(state.maxHp||100, (state.hp||100) + 25);
      state.stress = Math.max(0, (state.stress||0) - 30);
      if(state.flags) state.flags.nurse_escaped = true;
      updateHP(); updateV58HUD();
      appendNarrative('<p class="action">【高壓燃燒彈引爆】熾烈的火光瞬間驅散了走廊裡的陰影與幻覺（生命 +25，壓力 -30）。</p>');
      return true;
    }};
    ITEM_CONSUMABLES.temp_passkey = {use:function(){
      if(!hasItem('temp_passkey')) return false;
      if(state && state.flags){ state.flags.golden_key = true; }
      appendNarrative('<p class="action">你將「臨時磁感鑰匙」校準至萬用頻段，現在它能打開需要黃金鑰匙或門禁的鎖孔。</p>');
      return true;
    }};
    ITEM_CONSUMABLES.mint_candy = {use:function(){
      if(!hasItem('mint_candy')) return false;
      removeItem('mint_candy');
      state.stress = Math.max(0, (state.stress||0) - 25);
      updateV58HUD();
      appendNarrative('<p class="action">清涼的薄荷味直衝腦門，你的壓力大幅減輕（壓力 -25）。</p>');
      return true;
    }};
    ITEM_CONSUMABLES.suwan_water = {use:function(){
      if(!hasItem('suwan_water')) return false;
      removeItem('suwan_water');
      state.hp = Math.min(state.maxHp||100, (state.hp||100) + 20);
      updateHP();
      appendNarrative('<p class="action">你喝下蘇晚留下的礦泉水（生命 +20）。</p>');
      return true;
    }};
  }

  if(typeof window.showItemDetail === 'function' && !window.showItemDetail.__v58){
    var _sid = window.showItemDetail;
    window.showItemDetail = function(item){
      var r = _sid.apply(this, arguments);
      try{
        var rar = getItemRarity(item.id);
        var rInfo = RARITY_LABEL[rar] || RARITY_LABEL.common;
        var nmEl = $('item-detail-name');
        if(nmEl){
          nmEl.innerHTML = item.name + ' <span class="v58-rarity-badge ' + rInfo[1] + '">' + rInfo[0] + '</span>';
        }
        var card = document.querySelector('#item-detail-modal .modal-card');
        if(card){
          var oldBar = document.getElementById('v58-item-detail-actions');
          if(oldBar) oldBar.remove();
          var bar = document.createElement('div');
          bar.id = 'v58-item-detail-actions';
          bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:.45rem;justify-content:center;margin-top:.85rem;padding-top:.75rem;border-top:1px solid var(--border)';

          if(state && state.partyMembers && state.partyMembers.length > 0){
            var giveBtn = document.createElement('button');
            giveBtn.type = 'button';
            giveBtn.className = 'v4-btn';
            giveBtn.textContent = '分配給隊友';
            giveBtn.onclick = function(){
              closeModal('item-detail-modal');
              openPartyAllocationModal(item.id);
            };
            bar.appendChild(giveBtn);
          }

          var persistBtn = document.createElement('button');
          persistBtn.type = 'button';
          persistBtn.className = 'v4-btn';
          var persisted = v58GetJSON(LS_PERSIST, []);
          var isPersisted = persisted.some(function(p){ return p.id === item.id; });
          persistBtn.textContent = isPersisted ? '已鎖定跨輪繼承' : '鎖定跨輪繼承';
          persistBtn.onclick = function(){
            var list = v58GetJSON(LS_PERSIST, []);
            var idx = list.findIndex(function(p){ return p.id === item.id; });
            if(idx !== -1){
              list.splice(idx, 1);
              v58SetJSON(LS_PERSIST, list);
              showToast('已取消「' + item.name + '」的跨輪持久化');
            }else{
              var cap = 1 + (v58HasShopUpgrade('shop_extra_item') ? 1 : 0);
              if(list.length >= cap){
                list.shift();
              }
              list.push({id:item.id, name:item.name, desc:item.desc, usage:item.usage||''});
              v58SetJSON(LS_PERSIST, list);
              showToast('已將「' + item.name + '」設為跨輪持久化物品');
            }
            closeModal('item-detail-modal');
          };
          bar.appendChild(persistBtn);

          var dropBtn = document.createElement('button');
          dropBtn.type = 'button';
          dropBtn.className = 'v4-btn';
          dropBtn.style.borderColor = 'var(--danger)';
          dropBtn.style.color = 'var(--danger-bright)';
          dropBtn.textContent = '丟棄物品';
          dropBtn.onclick = function(){
            removeItem(item.id);
            closeModal('item-detail-modal');
            showToast('已丟棄：' + item.name);
          };
          bar.appendChild(dropBtn);

          card.appendChild(bar);
        }
      }catch(e){}
      return r;
    };
    window.showItemDetail.__v58 = true;
  }

  if(typeof window.updateInventoryUI === 'function' && !window.updateInventoryUI.__v58){
    var _ui = window.updateInventoryUI;
    window.updateInventoryUI = function(){
      var r = _ui.apply(this, arguments);
      try{
        var list = $('inv-list');
        if(list && state && state.inventory){
          var cards = list.querySelectorAll('.inv-item');
          cards.forEach(function(card, idx){
            var it = state.inventory[idx];
            if(!it) return;
            var rar = getItemRarity(it.id);
            var rInfo = RARITY_LABEL[rar] || RARITY_LABEL.common;
            var nm = card.querySelector('.inv-name');
            if(nm && !nm.querySelector('.v58-rarity-badge')){
              var b = document.createElement('span');
              b.className = 'v58-rarity-badge ' + rInfo[1];
              b.textContent = rInfo[0];
              nm.appendChild(b);
            }
          });
        }
      }catch(e){}
      return r;
    };
    window.updateInventoryUI.__v58 = true;
  }
}

function initPartyMembersForDungeon(did){
  if(!state) return;
  if(did === 1){
    state.partyMembers = [
      {id:'suwan',   name:'蘇晚', hp:100, maxHp:100, alive:true},
      {id:'laozhou', name:'老趙', hp:100, maxHp:100, alive:true},
      {id:'akai',    name:'阿凱', hp:100, maxHp:100, alive:true}
    ];
  } else if(did === 2){
    state.partyMembers = [
      {id:'suwan',   name:'陳姐', hp:100, maxHp:100, alive:true},
      {id:'laozhou', name:'老周', hp:100, maxHp:100, alive:true},
      {id:'akai',    name:'小宇', hp:100, maxHp:100, alive:true}
    ];
  } else if(did === 3){
    state.partyMembers = [
      {id:'hospital_doctor', name:'林醫生', hp:100, maxHp:100, alive:true},
      {id:'suwan',           name:'小雨',   hp:100, maxHp:100, alive:true}
    ];
  } else if(did === 7){
    state.partyMembers = [
      {id:'tram_girl',  name:'林雙', hp:100, maxHp:100, alive:true},
      {id:'tram_tuner', name:'宋弦', hp:100, maxHp:100, alive:true}
    ];
  } else {
    state.partyMembers = [];
  }
  if(v58HasShopUpgrade('shop_ally_suwan') && !state.partyMembers.some(function(m){ return m.name==='蘇晚'; })){
    state.partyMembers.push({id:'suwan', name:'蘇晚(同行)', hp:100, maxHp:100, alive:true});
  }
}

function openPartyAllocationModal(itemId){
  var modal = document.getElementById('v58-party-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v58-party-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal-card v4-card"><h3>隊 伍 狀 態 與 物 品 分 配</h3><div id="v58-party-modal-body"></div><div class="v4-actions"><button class="v4-btn primary" onclick="document.getElementById(\'v58-party-modal\').classList.remove(\'show\')">關 閉</button></div></div>';
    document.body.appendChild(modal);
  }
  var body = document.getElementById('v58-party-modal-body');
  var members = (state && state.partyMembers) || [];
  var html = '<div class="v4-sub">每個隊友擁有獨立 HP 與信任度。高好感隊友會替你分擔傷害；倒下的隊友會拖慢行動（增加壓力與耗時）；低好感隊友在危急時可能背叛。</div>';
  html += '<div class="v4-list" style="margin-top:.6rem">';
  members.forEach(function(m, idx){
    var aff = getNpcAffinity(m.id);
    html += '<div class="v4-row">' +
      '<div class="v4-row-ic">' + trustSvgFor(aff) + '</div>' +
      '<div class="v4-row-main">' +
        '<div class="v4-row-t">' + m.name + ' <span style="font-size:.72rem;color:var(--text-dim)">（信任度 ' + aff + ' · ' + (m.alive ? ('HP ' + m.hp + '/' + m.maxHp) : '已倒下') + '）</span></div>' +
        '<div class="v4-bar" style="margin-top:.3rem"><i style="width:' + Math.max(0,m.hp) + '%"></i></div>' +
      '</div>' +
      '<button class="v4-btn primary" data-give-idx="' + idx + '">給予醫療/物品 (+35 HP)</button>' +
    '</div>';
  });
  html += '</div>';
  if(!hasItem('keycard_lab') || !hasItem('oxygen_flask')){
    html += '<div style="margin-top:.75rem;padding:.55rem;border:1px dashed var(--border);border-radius:4px;font-size:.75rem;color:var(--text-dim)">' +
      '<span>戰術搜刮：可從隊伍行囊取出合成素材（門禁卡＋磁鐵／氧氣瓶＋打火機）</span> ' +
      '<button class="v4-btn" id="v58-claim-craft-mats" style="margin-left:.4rem">領取合成素材</button>' +
    '</div>';
  }
  body.innerHTML = html;
  body.querySelectorAll('[data-give-idx]').forEach(function(b){
    b.onclick = function(){
      var i = parseInt(b.getAttribute('data-give-idx'), 10);
      var mem = members[i];
      if(!mem) return;
      if(itemId && hasItem(itemId)){
        removeItem(itemId);
      }
      mem.hp = Math.min(mem.maxHp||100, (mem.hp||0) + 35);
      mem.alive = true;
      addNpcAffinity(mem.id, 15);
      if(state.flags) state.flags['healed_' + mem.id] = true;
      appendNarrative('<p class="inherit-note">【隊伍分配】你將補給品交給了' + mem.name + '（' + mem.name + ' HP 恢復至 ' + mem.hp + '，好感度 +15）。這份信任將影響最終結局走向。</p>');
      modal.classList.remove('show');
      updateV58HUD();
    };
  });
  var craftBtn = document.getElementById('v58-claim-craft-mats');
  if(craftBtn){
    craftBtn.onclick = function(){
      addItem('keycard_lab', '實驗室門禁卡', '你隨身攜帶的舊門禁卡（普通），可與強磁線圈組合成臨時磁感鑰匙。');
      addItem('magnet_coil', '強磁線圈', '從舊電器拆下的磁鐵線圈（普通），可與門禁卡組合。');
      addItem('oxygen_flask', '袖珍氧氣瓶', '應急高濃度氧氣瓶（普通），可與老趙的打火機組合成高壓燃燒彈。');
      if(!hasItem('zhao_lighter')) addItem('zhao_lighter', '老趙的黃銅打火機', '防風打火機（稀有），可與袖珍氧氣瓶組合成高壓燃燒彈。');
      showToast('已領取組合素材（可在物品欄點擊「組合」合成臨時鑰匙或燃燒彈）');
      modal.classList.remove('show');
    };
  }
  modal.classList.add('show');
}

window.openPartyAllocationModal = openPartyAllocationModal;
function addStress(delta, reason){
  if(!state) return;
  if(SETTINGS.v58Difficulty === 'story' && delta > 0) return;
  state.stress = Math.max(0, Math.min(100, (state.stress || 0) + delta));
  updateV58HUD();
  if(state.stress >= 85 && delta > 0){
    showToast('壓力過高（' + state.stress + '%）：視野邊緣開始出現幻覺選項');
  }
}
window.addStress = addStress;

/* ============================================================
 * 四、Meta-progression：輪迴商店、每輪隨機詞條、結局圖鑑、難度模式
 * ============================================================ */
var SHOP_ITEMS = window.SHOP_ITEMS = [
  {id:'shop_hp20',       name:'生命強韌 · 起始 HP +20', cost:2, desc:'每輪開局生命上限與初始 HP +20'},
  {id:'shop_extra_item', name:'擴容行囊 · 多帶一件跨輪物品', cost:3, desc:'跨輪持久化物品欄位上限 +1，且開局贈送「應急繃帶」'},
  {id:'shop_ally_suwan', name:'宿命同行 · 開局多見一位同伴', cost:3, desc:'所有門扉開局即有蘇晚同行支援，分擔傷害並提供直覺示警'},
  {id:'shop_hidden_opt', name:'洞悉之眼 · 解鎖隱藏選項與預覽', cost:4, desc:'直接解鎖各場景隱藏捷徑，並強化選項預覽資訊'},
  {id:'shop_full_map',   name:'全知輿圖 · 地圖顯示更多房間', cost:2, desc:'踏入門扉時自動揭示地圖上所有區域與摘要'}
];

var RUN_MODIFIERS = [
  {id:'mod_truth',   name:'絕對誠實', desc:'這輪所有人都不說謊（謎題自動附帶真話校驗，NPC 初始好感 +10）'},
  {id:'mod_minimal', name:'輕裝簡行', desc:'這輪無法攜帶超過 4 件普通物品，但每抵達新場景恢復 3 HP'},
  {id:'mod_half',    name:'時間減半', desc:'這輪倒計時與思考時間減半，但通關獲得雙倍記憶碎片'},
  {id:'mod_clarity', name:'絕對清醒', desc:'這輪不會累積任何壓力值，且免疫幻覺選項'},
  {id:'mod_echo',    name:'雙倍迴響', desc:'這輪開局額外獲得 2 粒迴光粒與 1 次免費復活'}
];

function getMemoryShards(){
  var n = parseInt(localStorage.getItem(LS_SHARDS) || '6', 10);
  return isNaN(n) ? 6 : n;
}
function addMemoryShards(delta){
  var cur = Math.max(0, getMemoryShards() + delta);
  try{ localStorage.setItem(LS_SHARDS, String(cur)); }catch(e){}
  return cur;
}
window.getMemoryShards = getMemoryShards;
window.addMemoryShards = addMemoryShards;
function getShopOwned(){ return v58GetJSON(LS_SHOP, []); }
function v58HasShopUpgrade(id){ return getShopOwned().indexOf(id) !== -1; }

function applyShopAndModifiersToState(){
  if(!state) return;
  var diffMode = SETTINGS.v58Difficulty || 'classic';
  if(diffMode === 'story'){
    state.maxHp = 200; state.hp = 200;
    if(state.countdown != null) state.countdown = 120;
    state.stress = 0;
  } else if(diffMode === 'hell'){
    state.maxHp = 70; state.hp = 70;
    if(state.countdown != null) state.countdown = 35;
  }

  if(v58HasShopUpgrade('shop_hp20')){
    state.maxHp = (state.maxHp || 100) + 20;
    state.hp = (state.hp || 100) + 20;
  }
  if(v58HasShopUpgrade('shop_extra_item')){
    addItem('shop_bandage', '輪迴急救包', '輪迴商店贈予的隨身急救包（恢復 25 HP）。');
  }
  if(v58HasShopUpgrade('shop_full_map') && state.mapZones && state.mapZones.forEach){
    state.mapZones.forEach(function(z){ z.explored = true; });
  }

  var persisted = v58GetJSON(LS_PERSIST, []);
  persisted.forEach(function(it){
    addItem(it.id, it.name, it.desc, it.usage||'');
  });

  if(state.flags && state.flags.isDailyChallenge){
    var seed = state.flags.dailySeed || Math.floor(Math.random() * 10000);
    var m1 = RUN_MODIFIERS[seed % RUN_MODIFIERS.length];
    state.activeModifiers = [m1];
    if(m1.id === 'mod_half' && state.countdown != null && diffMode !== 'story'){
      state.countdown = Math.max(20, Math.round(state.countdown * 0.6));
    }
    if(m1.id === 'mod_echo'){
      state.echo = (state.echo || 3) + 2;
      state.v5Revive = true;
    }
  } else {
    state.activeModifiers = [];
  }
}

/* ============================================================
 * 五、閱讀體驗 / UI / 視覺（5.1–5.3）
 * ============================================================ */
var recentSentencesRing = [];

function getSceneArtSVG(roomName, sceneKey, did){
  var key = String(roomName||sceneKey||'');
  if(/大廳|lobby|觀測大廳|取餐區/.test(key)){
    return '<svg viewBox="0 0 120 56"><rect x="6" y="8" width="108" height="40" rx="2" stroke-opacity=".4"/><line x1="60" y1="8" x2="60" y2="24"/><circle cx="60" cy="28" r="5"/><path d="M22 48V26h20v22M78 48V26h20v22"/><line x1="6" y1="48" x2="114" y2="48"/></svg>';
  }
  if(/13|鏡|mirror|電車|車廂/.test(key)){
    return '<svg viewBox="0 0 120 56"><rect x="14" y="6" width="38" height="44" rx="2"/><rect x="68" y="6" width="38" height="44" rx="2" stroke-dasharray="3 2"/><line x1="60" y1="4" x2="60" y2="52" stroke-opacity=".6"/><path d="M25 22l16 12M95 22L79 34"/></svg>';
  }
  if(/醫|病房|ICU|手術|藥|太平間/.test(key)){
    return '<svg viewBox="0 0 120 56"><polyline points="6,32 32,32 40,14 48,46 56,22 64,36 72,32 114,32"/><rect x="88" y="10" width="18" height="18" rx="2"/><path d="M97 14v10M92 19h10"/></svg>';
  }
  if(/書|閱覽|館|校刊|教室/.test(key)){
    return '<svg viewBox="0 0 120 56"><path d="M18 12h84M18 28h84M18 44h84"/><rect x="26" y="14" width="8" height="14"/><rect x="38" y="14" width="10" height="14"/><rect x="54" y="16" width="7" height="12"/><rect x="70" y="30" width="12" height="14"/><rect x="86" y="30" width="8" height="14"/></svg>';
  }
  if(/海|潮|燈塔|礁/.test(key)){
    return '<svg viewBox="0 0 120 56"><path d="M8 38c12-6 24 6 36 0s24-6 36 0 24 6 32 0"/><path d="M8 46c12-6 24 6 36 0s24-6 36 0 24 6 32 0" stroke-opacity=".5"/><polygon points="56,36 64,36 62,14 58,14"/><circle cx="60" cy="11" r="3"/></svg>';
  }
  return '<svg viewBox="0 0 120 56"><rect x="42" y="6" width="36" height="44" rx="1"/><circle cx="71" cy="28" r="2"/><path d="M14 50h92" stroke-opacity=".4"/></svg>';
}

window.getSceneArtSVG = getSceneArtSVG;
function updateSceneArtBanner(sc){
  var gs = $('game-screen');
  var rd = gs ? gs.querySelector('.room-display') : null;
  var narr = $('narrative');
  if(!gs || !narr || !sc) return;
  var wrap = document.getElementById('v58-scene-art-wrap');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.id = 'v58-scene-art-wrap';
    if(rd) rd.appendChild(wrap);
    else gs.insertBefore(wrap, narr);
  } else if(rd && wrap.parentNode !== rd){
    rd.appendChild(wrap);
  }
  var sId = (window.I18N && typeof I18N.t === 'function') ? I18N.t(sc.sceneId || sc.room || '—') : (sc.sceneId || sc.room || '—');
  wrap.innerHTML =
    '<div class="v58-scene-art-box">' +
      getSceneArtSVG(sc.roomName, state && state.currentScene, currentDungeonId) +
      '<div class="v58-scene-art-meta">' +
        '<div class="v58-scene-art-sub">' + sId + '</div>' +
      '</div>' +
    '</div>';
}

window.updateSceneArtBanner = updateSceneArtBanner;
function playV58TransitionFX(kind){
  if(SETTINGS.flashSafe || SETTINGS.reducedMotion || SETTINGS.v58ReaderMode) return;
  var ov = document.getElementById('v58-fx-overlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'v58-fx-overlay';
    document.body.appendChild(ov);
  }
  ov.className = '';
  void ov.offsetWidth;
  ov.classList.add('fx-' + (kind || 'fade'));
  setTimeout(function(){ ov.className = ''; }, 380);
}

function speakTextTTS(text, force){
  if(!force && !SETTINGS.v58TtsEnabled) return;
  if(!('speechSynthesis' in window)) return;
  try{
    var clean = String(text || '').replace(/<[^>]+>/g, '').replace(/\[(?:shake|glow|ghost)\]/g, '').trim();
    if(!clean) return;
    var utter = new SpeechSynthesisUtterance(clean);
    var lg = (window.I18N && I18N.lang) || 'zh-Hant';
    utter.lang = lg === 'en' ? 'en-US' : (lg === 'ja' ? 'ja-JP' : (lg === 'zh-Hans' ? 'zh-CN' : 'zh-TW'));
    utter.rate = parseFloat(SETTINGS.v58TtsRate || 1.0);
    utter.pitch = 0.95;
    window.speechSynthesis.speak(utter);
  }catch(e){}
}

function stopTTS(){
  try{ if('speechSynthesis' in window) window.speechSynthesis.cancel(); }catch(e){}
}

function openRecentSentencesModal(){
  var modal = document.getElementById('v58-recent-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v58-recent-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal-card v4-card"><h3>回 看 最 近 三 句</h3><div class="v4-sub">錯過了上一幕或剛才的關鍵敘述？這裡保留你最近讀過的 3 段文字：</div><div id="v58-recent-body" style="margin-top:.8rem"></div><div class="v4-actions"><button class="v4-btn primary" onclick="document.getElementById(\'v58-recent-modal\').classList.remove(\'show\')">關 閉</button></div></div>';
    document.body.appendChild(modal);
  }
  var body = document.getElementById('v58-recent-body');
  var last3 = recentSentencesRing.slice(-3);
  if(last3.length === 0){
    body.innerHTML = '<div class="panel-empty">尚無近期句子記錄</div>';
  }else{
    body.innerHTML = last3.map(function(item, idx){
      return '<div style="padding:.65rem .8rem;border:1px solid var(--border);border-radius:4px;margin-bottom:.5rem;background:var(--bg-card)">' +
        '<div style="font-size:.68rem;color:var(--accent);margin-bottom:.25rem">#' + (idx+1) + ' · ' + (item.room || '場景') + '</div>' +
        '<div style="font-size:.88rem;line-height:1.65;color:var(--text-bright)">' + item.text + '</div>' +
      '</div>';
    }).join('');
  }
  modal.classList.add('show');
}

/* ============================================================
 * 六、音訊擴充
 * ============================================================ */
window.openRecentSentencesModal = openRecentSentencesModal;
var lowHpPulseTimer = null;

function playV58SceneSfx(kind){
  if(!SETTINGS.soundEnabled || SETTINGS.v58SfxMuted) return;
  if(!window.audioCtx || audioCtx.state !== 'running' || !window.audioMasterGain) return;
  try{
    var now = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    if(kind === 'page'){
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);
      g.gain.setValueAtTime(0.025, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else if(kind === 'step'){
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.08);
      g.gain.setValueAtTime(0.04, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    } else if(kind === 'bell'){
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.65);
      g.gain.setValueAtTime(0.035, now);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 0.7);
    } else if(kind === 'rain'){
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.06);
      g.gain.setValueAtTime(0.015, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    } else {
      return;
    }
    osc.connect(g); g.connect(audioMasterGain);
    osc.start(now); osc.stop(now + 0.75);
  }catch(e){}
}

function playEndingPianoMelody(){
  if(!SETTINGS.soundEnabled || SETTINGS.v58BgmMuted) return;
  if(!window.audioCtx || audioCtx.state !== 'running' || !window.audioMasterGain) return;
  var notes = [261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63];
  notes.forEach(function(freq, idx){
    try{
      var t = audioCtx.currentTime + idx * 0.38;
      var osc = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.045, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 1.1);
      osc.connect(g); g.connect(audioMasterGain);
      osc.start(t); osc.stop(t + 1.15);
    }catch(e){}
  });
}

function checkDynamicLowHpAudio(){
  if(!state) return;
  var pct = (state.hp || 100) / (state.maxHp || 100);
  if(pct < 0.3 && state.hp > 0 && $('game-screen') && $('game-screen').classList.contains('active')){
    if(!lowHpPulseTimer){
      lowHpPulseTimer = setInterval(function(){
        if(!state || (state.hp / (state.maxHp||100)) >= 0.3 || !$('game-screen').classList.contains('active')){
          clearInterval(lowHpPulseTimer); lowHpPulseTimer = null; return;
        }
        if(SETTINGS.soundEnabled && !SETTINGS.v58SfxMuted && window.audioCtx && audioCtx.state === 'running'){
          try{
            var now = audioCtx.currentTime;
            var osc = audioCtx.createOscillator();
            var g = audioCtx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(52, now);
            g.gain.setValueAtTime(0.09, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.connect(g); g.connect(audioMasterGain);
            osc.start(now); osc.stop(now + 0.32);
          }catch(e){}
        }
      }, 1100);
    }
  } else {
    if(lowHpPulseTimer){ clearInterval(lowHpPulseTimer); lowHpPulseTimer = null; }
  }
}

function extendV4AudioThemes(){
  if(!window.V4Audio || !V4Audio.themes) return;
  V4Audio.themes['7-tram']    = {name:'鏡像電車 · 雙軌節拍', sub:'門扉7 快節奏鐵道合成曲', chords:[[110,164.8],[123.5,185],[130.8,196],[98,146.8]], o1:'sawtooth', o2:'triangle', lp:520, lfo:0.18, interval:4500, pulse:true};
  V4Audio.themes['8-buffet']  = {name:'無盡自助餐 · 午夜圓舞', sub:'門扉8 暖調室內弦音', chords:[[130.8,196],[146.8,220],[164.8,246.9],[110,164.8]], o1:'sine', o2:'triangle', lp:420, lfo:0.08, interval:6500, pluck:[523.25,659.25,783.99]};
  V4Audio.themes['9-school']  = {name:'小學 1999 · 盛夏風琴', sub:'門扉9 懷舊手風琴進行', chords:[[146.8,220],[110,164.8],[130.8,196],[98,146.8]], o1:'triangle', o2:'sine', lp:480, lfo:0.06, interval:7000, pluck:[440,554.37,659.25]};
  V4Audio.themes['safe-warm'] = {name:'安全區 · 餘溫搖籃曲', sub:'舒緩低通和弦', chords:[[130.8,196],[110,164.8],[87.3,130.8],[98,146.8]], o1:'sine', o2:'sine', lp:340, lfo:0.04, interval:9000};
  V4Audio.themes['end-piano'] = {name:'終局 · 破曉鋼琴曲', sub:'結局專用分解鋼琴曲', chords:[[261.6,392],[220,329.6],[174.6,261.6],[196,293.7]], o1:'triangle', o2:'sine', lp:680, lfo:0.05, interval:5000, pluck:[523.25,659.25,783.99,1046.5]};
}

/* ============================================================
 * 七、社交與分享
 * ============================================================ */
window.playV58SceneSfx = playV58SceneSfx;
function generateFateSummaryText(){
  var dName = (DUNGEON_CONFIG[currentDungeonId] && DUNGEON_CONFIG[currentDungeonId].dungeonName) || '無盡迴廊';
  var eTitle = ($('ending-title') && $('ending-title').textContent) || '未知結局';
  var eType  = ($('ending-type') && $('ending-type').textContent) || '結局';
  var elapsed = fmtElapsed(Date.now() - (window.gameStartTime || Date.now()));
  var suwanSt = (state && state.inheritance && state.inheritance.suwan_survived) ? '蘇晚與你並肩逃出' : '蘇晚留在記憶彼端';
  var zhaoSt  = (state && state.flags && state.flags.zhao_dead) ? '老趙倒在了半途' : '同伴的託付仍在';
  var puzCnt  = (state && state.flags) ? Object.keys(state.flags).filter(function(k){ return /puzzle|solved|puz/.test(k); }).length : 0;
  return '【本局命運】你是數學系博士生陸衍，在《' + dName + '》抵達了' + eType + '「' + eTitle + '」。' + suwanSt + '，' + zhaoSt + '。本局共解開 ' + puzCnt + ' 道機關謎題，生命餘量 ' + Math.max(0, (state&&state.hp)||0) + '，花時 ' + elapsed + '。';
}

window.generateFateSummaryText = generateFateSummaryText;
function copyFateSummary(){
  var txt = generateFateSummaryText();
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt);
      showToast('已複製「本局命運」100字摘要到剪貼簿！');
      return;
    }
  }catch(e){}
  openTextSaveModal('copy-fate', txt);
}

function encodeSaveToBase64(){
  var payload = {v:'5.8.0', saves:{}, meta:{}};
  for(var i=0; i<localStorage.length; i++){
    var k = localStorage.key(i);
    if(!k) continue;
    if(/-save(-\d+|-auto)$/.test(k)) payload.saves[k] = localStorage.getItem(k);
    else if(k.indexOf('wuxian') === 0) payload.meta[k] = localStorage.getItem(k);
  }
  var jsonStr = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(jsonStr)));
}

function importSaveFromBase64(b64Str){
  try{
    var clean = String(b64Str || '').trim();
    if(clean.indexOf('#save=') !== -1) clean = clean.split('#save=')[1];
    var jsonStr = decodeURIComponent(escape(atob(clean)));
    var data = JSON.parse(jsonStr);
    if(!data || (!data.saves && !data.meta)) throw new Error('Invalid');
    if(data.saves){ Object.keys(data.saves).forEach(function(k){ safeSet(k, data.saves[k]); }); }
    if(data.meta){ Object.keys(data.meta).forEach(function(k){ safeSet(k, data.meta[k]); }); }
    showToast('文字存檔匯入成功！狀態已即時同步。');
    if(typeof render === 'function') render();
    return true;
  }catch(e){
    showToast('存檔文字碼格式不正確');
    return false;
  }
}

function openTextSaveModal(mode, customText){
  var modal = document.getElementById('v58-textsave-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v58-textsave-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML =
      '<div class="modal-card v4-card">' +
        '<h3 id="v58-ts-title">存 檔 文 字 碼 匯 出 / 匯 入</h3>' +
        '<div class="v4-sub" id="v58-ts-sub">可複製下方存檔文字碼跨設備轉移，或生成 URL Hash 雲端同步連結</div>' +
        '<textarea id="v58-ts-area" rows="5" style="width:100%;margin-top:.6rem;background:#0e0e12;color:var(--text-bright);border:1px solid var(--border);padding:.55rem;font-family:var(--font-mono);font-size:.75rem;border-radius:4px"></textarea>' +
        '<div class="v4-actions" style="margin-top:.8rem;flex-wrap:wrap;gap:.4rem">' +
          '<button class="v4-btn" id="v58-ts-copy">複製文字碼</button>' +
          '<button class="v4-btn" id="v58-ts-hash">生成 URL Hash 雲端同步連結</button>' +
          '<button class="v4-btn primary" id="v58-ts-import">從文字碼匯入</button>' +
          '<button class="v4-btn" onclick="document.getElementById(\'v58-textsave-modal\').classList.remove(\'show\')">關 閉</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('v58-ts-copy').onclick = function(){
      var area = document.getElementById('v58-ts-area');
      area.select();
      try{ navigator.clipboard.writeText(area.value); }catch(e){}
      showToast('已複製到剪貼簿');
    };
    document.getElementById('v58-ts-hash').onclick = function(){
      var code = encodeSaveToBase64();
      try{ history.replaceState(null, '', '#save=' + code.slice(0, 2048)); }catch(e){}
      var area = document.getElementById('v58-ts-area');
      area.value = location.origin + location.pathname + '#save=' + code;
      showToast('已寫入 URL Hash 並生成雲端同步連結');
    };
    document.getElementById('v58-ts-import').onclick = function(){
      var area = document.getElementById('v58-ts-area');
      if(importSaveFromBase64(area.value)){
        modal.classList.remove('show');
      }
    };
  }
  var area = document.getElementById('v58-ts-area');
  if(mode === 'copy-fate'){
    document.getElementById('v58-ts-title').textContent = '本 局 命 運 摘 要';
    area.value = customText || generateFateSummaryText();
  }else{
    document.getElementById('v58-ts-title').textContent = '存 檔 文 字 碼 匯 出 / 匯 入';
    area.value = encodeSaveToBase64();
  }
  modal.classList.add('show');
}

function getTodaySeedInfo(){
  var d = new Date();
  var dateStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  var hash = 0;
  for(var i=0; i<dateStr.length; i++){ hash = ((hash << 5) - hash) + dateStr.charCodeAt(i); hash |= 0; }
  var seed = Math.abs(hash);
  var targetDungeon = (seed % 9) + 1;
  var mod = RUN_MODIFIERS[seed % RUN_MODIFIERS.length];
  return {dateStr:dateStr, seed:seed, dungeonId:targetDungeon, modifier:mod};
}

window.getTodaySeedInfo = getTodaySeedInfo;
function startDailyChallenge(){
  var info = getTodaySeedInfo();
  var nb = document.getElementById('v4-notebook');
  if(nb) nb.classList.remove('show');
  enterDungeon(info.dungeonId, true);
  setTimeout(function(){
    if(state && state.flags){
      state.flags.dailySeed = info.seed;
      state.flags.isDailyChallenge = true;
      state.activeModifiers = [info.modifier];
    }
    showToast('每日挑戰啟動（Seed ' + info.dateStr + ' · 詞條：' + info.modifier.name + '）');
  }, 450);
}

/* ============================================================
 * 八、無障礙與真結局提示羅盤
 * ============================================================ */
function getTrueEndingGapHint(did){
  var d = did || currentDungeonId || 1;
  var inh = (state && state.inheritance) ? state.inheritance : loadInheritance();
  var flg = (state && state.flags) || {};
  if(d === 1){
    var gaps1 = [];
    if(!hasItem('d1_master_blank')) gaps1.push('尚未進入地下室石台後的「鍋爐暗室」取得初代總鑰匙胚');
    if(!flg.arc_suwan_done) gaps1.push('尚未在二樓走廊完成「蘇晚支線（巷口的那碗陽春麵）」');
    if(!hasItem('golden_key') && !inh.golden_key) gaps1.push('尚未在 5 號房或地下室取得「黃金鑰匙」');
    return gaps1.length ? ('距離質數旅館真結局還缺：' + gaps1.join('；')) : '已滿足質數旅館真結局全部條件！前往大廳鏡像或蘇晚支線即可觸發。';
  }
  if(d === 2){
    var gaps2 = [];
    if(!hasItem('d2_binding_needle')) gaps2.push('尚未推開閱覽室後的「古籍修復暗室」取得無聲裝訂針');
    if(!hasItem('yuanyuan_album')) gaps2.push('尚未在禁書區找齊媛媛的畫冊');
    return gaps2.length ? ('距離沉默圖書館真結局還缺：' + gaps2.join('；')) : '已滿足沉默圖書館真結局全部條件！前往最終準備或管理員室即可觸發。';
  }
  if(d === 3){
    var gaps3 = [];
    if(!hasItem('d3_sunflower_seed')) gaps3.push('尚未從四樓消防門登上「頂樓天台溫室」取得向日葵種子膠囊');
    if(!hasItem('yuanyuan_memory')) gaps3.push('尚未取得媛媛的記憶卡');
    return gaps3.length ? ('距離倒計時醫院真結局還缺：' + gaps3.join('；')) : '已滿足倒計時醫院真結局全部條件！前往 B2 核心區即可觸發。';
  }
  if(d === 4){
    if(window.V4 && !V4.allFragmentsFound() && !hasItem('d4_lantern_core')){
      return '距離無盡之間真結局還缺：集齊 9 枚迴廊碎片，或進入守門人木椅下的「燈芯密室」取得不滅燈芯。';
    }
    return '已滿足無盡之間真結局條件！';
  }
  if(d === 5){
    if(!hasItem('d5_tide_bottle') && !(flg.unspoken_seen && flg.untaken_seen && flg.papercat_seen)){
      return '距離迴光之海真結局還缺：潛入退潮海床「海心珊瑚密室」取得定潮玻璃瓶，或看過未說出口的門、未走之路與紙貓。';
    }
    return '已滿足迴光之海真結局條件！';
  }
  if(d === 6){
    if(!hasItem('d6_dawn_tape') && !hasItem('d6_symphony_tape')){
      return '距離終焉觀測站真結局還缺：在質數主機輸入 17 並在天線塔輸入 318 Hz 取得破曉磁帶。';
    }
    return '已滿足終焉觀測站真結局條件！';
  }
  if(d === 7){
    if(!hasItem('tram_wrench') || !hasItem('tram_timetable')){
      return '距離鏡像電車真結局還缺：解開時間表拼圖取得「完整時刻表」，並進入車廂連接處密室取得「緊急制動扳手」。';
    }
    return '已滿足鏡像電車真結局條件！前往駕駛室即可觸發。';
  }
  if(d === 8){
    if(!hasItem('chef_recipe') || !flg.d8_noodles_eaten){
      return '距離無盡自助餐真結局還缺：你還沒跟蘇晚一起品嚐過《蘇晚的半碗陽春麵》，或尚未在後廚冷庫（密碼 35）取得「主廚的家常食譜」。';
    }
    return '已滿足無盡自助餐真結局條件！前往結帳櫃檯即可觸發。';
  }
  if(d === 9){
    if(!hasItem('millennium_badge') || !hasItem('chalk_star')){
      return '距離小學 1999 真結局還缺：解開黑板附加題（答案 5）拿粉筆星，並用福利社彈珠汽水跟小阿凱換鑰匙進入器材室拿「千禧紀念章」。';
    }
    return '已滿足小學 1999 真結局條件！前往校刊編輯室即可觸發。';
  }
  return '探索隱藏密室並留意同伴支線即可解鎖真結局。';
}

/* ============================================================
 * 九、技術底層 / 存檔安全 / 效能 / PWA
 * ============================================================ */
window.getTrueEndingGapHint = getTrueEndingGapHint;
function computeSaveChecksum(str){
  var h = 2166136261;
  for(var i=0; i<str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

window.computeSaveChecksum = computeSaveChecksum;
function recordSaveBackup(key, rawJson){
  try{
    var list = v58GetJSON(LS_BACKUPS, []);
    list.unshift({
      key: key,
      savedAt: new Date().toLocaleString('zh-Hant'),
      checksum: computeSaveChecksum(rawJson),
      data: rawJson
    });
    if(list.length > 3) list = list.slice(0, 3);
    v58SetJSON(LS_BACKUPS, list);
  }catch(e){}
}

function rollbackSaveBackup(idx){
  var list = v58GetJSON(LS_BACKUPS, []);
  var item = list[idx || 0];
  if(!item){ showToast('尚無可用的備份版本'); return; }
  try{
    var parsed = JSON.parse(item.data);
    applySaveData(parsed);
    showToast('已成功回滾至備份版本（' + item.savedAt + ' · 校驗碼 ' + item.checksum + '）');
  }catch(e){
    showToast('備份回滾失敗');
  }
}

function setupPWAAndBatteryCare(){
  if(navigator.getBattery){
    try{
      navigator.getBattery().then(function(bat){
        function checkBat(){
          if(!bat.charging && bat.level <= 0.2 && !SETTINGS.v58PowerSave){
            SETTINGS.v58PowerSave = true;
            stopParticles();
            showToast('偵測到低電量：已自動開啟省電模式');
          }
        }
        checkBat();
        bat.addEventListener('levelchange', checkBat);
      }).catch(function(){});
    }catch(e){}
  }

  setInterval(function(){
    var narr = $('narrative');
    if(narr && narr.children && narr.children.length > 65){
      while(narr.children.length > 55){
        narr.removeChild(narr.firstElementChild);
      }
    }
    try{
      var inh = loadInheritance();
      if(inh.memoryFragments && inh.memoryFragments.length > 20){
        inh.memoryFragments = inh.memoryFragments.slice(-20);
        saveInheritance(inh);
      }
    }catch(e){}
  }, 45000);

  try{
    if(!document.querySelector('meta[name="mobile-web-app-capable"]')){
      var m1 = document.createElement('meta');
      m1.name = 'mobile-web-app-capable'; m1.content = 'yes';
      document.head.appendChild(m1);
      var m2 = document.createElement('meta');
      m2.name = 'theme-color'; m2.content = '#0a0a0c';
      document.head.appendChild(m2);
    }
  }catch(e){}
}

/* ============================================================
 * 十、全局掛鉤整合與英文翻譯修復
 * ============================================================ */
function updateV58HUD(){
  var sb = document.querySelector('#game-screen .status-bar');
  if(!sb || !state) return;

  var stressEl = document.getElementById('v58-stress-chip');
  if(!stressEl){
    stressEl = document.createElement('div');
    stressEl.id = 'v58-stress-chip';
    stressEl.className = 'v58-status-chip';
    stressEl.title = '壓力值（黑暗、恐怖、隊友倒下或答錯謎題會累積壓力；過高將出現幻覺選項）';
    stressEl.onclick = function(){
      showToast('當前壓力值：' + (state.stress||0) + '%（可使用薄荷糖、安全區休息或燃燒彈降低）');
    };
    sb.appendChild(stressEl);
  }
  var stVal = Math.round(state.stress || 0);
  stressEl.innerHTML = '<span>壓力</span><span class="v58-stress-bar"><span class="v58-stress-fill" style="width:' + stVal + '%"></span></span><span class="status-val">' + stVal + '%</span>';

  var specEl = document.getElementById('v58-spec-chip');
  if(!specEl){
    specEl = document.createElement('div');
    specEl.id = 'v58-spec-chip';
    specEl.className = 'v58-status-chip';
    sb.appendChild(specEl);
  }
  if(currentDungeonId === 8){
    specEl.style.display = 'inline-flex';
    specEl.innerHTML = '<span>飽食度</span><span class="status-val" style="color:var(--accent-bright)">' + (state.satiety||0) + '%</span>';
  } else if(currentDungeonId === 7){
    specEl.style.display = 'inline-flex';
    specEl.innerHTML = '<span>鏡像HP</span><span class="status-val" style="color:#8ac4eb">' + (state.mirrorHp!=null?state.mirrorHp:100) + '</span>';
  } else {
    specEl.style.display = 'none';
  }

  var partyWrap = document.getElementById('v58-party-pills');
  if(!partyWrap){
    partyWrap = document.createElement('div');
    partyWrap.id = 'v58-party-pills';
    partyWrap.className = 'v58-party-bar-wrap';
    sb.appendChild(partyWrap);
  }
  if(state.partyMembers && state.partyMembers.length > 0){
    partyWrap.style.display = 'inline-flex';
    partyWrap.innerHTML = state.partyMembers.map(function(m){
      var aff = getNpcAffinity(m.id);
      return '<span class="v58-member-pill' + (m.alive ? '' : ' down') + '" onclick="openPartyAllocationModal()" title="點擊管理隊伍與分配物品 · 信任度 ' + aff + '">' +
        trustSvgFor(aff) +
        '<span>' + m.name + '</span>' +
        '<span style="color:var(--accent)">' + (m.alive ? m.hp : '倒下') + '</span>' +
      '</span>';
    }).join('');
  } else {
    partyWrap.style.display = 'none';
  }

  var modChip = document.getElementById('v58-mod-chip');
  if(!modChip){
    modChip = document.createElement('div');
    modChip.id = 'v58-mod-chip';
    modChip.className = 'v58-status-chip';
    sb.appendChild(modChip);
  }
  if(state.activeModifiers && state.activeModifiers.length > 0){
    var m0 = state.activeModifiers[0];
    modChip.style.display = 'inline-flex';
    modChip.title = '本輪隨機詞條：' + m0.desc;
    modChip.innerHTML = '<span style="color:var(--accent)">詞條·' + m0.name + '</span>';
    modChip.onclick = function(){ showToast('【本輪詞條 · ' + m0.name + '】' + m0.desc); };
  } else {
    modChip.style.display = 'none';
  }
}

window.adjustNarrativeFontSize = function(delta){
  var cur = parseInt(SETTINGS.fontSize || 20, 10);
  var next = Math.max(14, Math.min(30, cur + delta));
  SETTINGS.fontSize = next;
  SETTINGS._v58FontEnlarged = true;
  document.documentElement.style.setProperty('--narrative-font-size', next + 'px');
  var slider = document.getElementById('font-size-slider');
  if(slider) slider.value = String(next);
  var valEl = document.getElementById('font-size-val');
  if(valEl) valEl.textContent = next + 'px';
  var lblEl = document.getElementById('v58-font-size-badge');
  if(lblEl) lblEl.textContent = next + 'px';
  saveSettings(SETTINGS);
  showToast('文字顯示大小已調整為 ' + next + 'px');
};

window.toggleMaxNarrativeView = function(){
  var on = document.body.classList.toggle('v58-max-narrative');
  var tw = document.getElementById('top-wrap');
  if(tw){
    if(on) tw.classList.add('collapsed');
    else tw.classList.remove('collapsed');
  }
  var btn = document.getElementById('v58-quick-maxread');
  if(btn) btn.classList.toggle('on', on);
  showToast(on ? '已開啟大屏閱讀模式（文字顯示區域最大化）' : '已恢復標準檢視模式');
};

function injectV58BottomControls(){
  if(SETTINGS && (!SETTINGS._v58FontEnlarged) && (!SETTINGS.fontSize || SETTINGS.fontSize <= 17)){
    SETTINGS.fontSize = 20;
    SETTINGS._v58FontEnlarged = true;
    document.documentElement.style.setProperty('--narrative-font-size', '20px');
    saveSettings(SETTINGS);
  }
  var center = document.getElementById('game-bottom-center');
  if(!center || document.getElementById('v58-quick-lookback')) return;

  var btnFontDec = document.createElement('button');
  btnFontDec.type = 'button';
  btnFontDec.id = 'v58-quick-font-dec';
  btnFontDec.className = 'v58-Quick-btn';
  btnFontDec.title = '縮小文字顯示 (A-)';
  btnFontDec.setAttribute('aria-label', '縮小文字');
  btnFontDec.innerHTML = '<span style="font-family:var(--font-mono);font-weight:600">A-</span>';
  btnFontDec.onclick = function(){ window.adjustNarrativeFontSize(-2); };

  var btnFontInc = document.createElement('button');
  btnFontInc.type = 'button';
  btnFontInc.id = 'v58-quick-font-inc';
  btnFontInc.className = 'v58-Quick-btn';
  btnFontInc.title = '放大文字顯示 (A+)';
  btnFontInc.setAttribute('aria-label', '放大文字');
  btnFontInc.innerHTML = '<span style="font-family:var(--font-mono);font-weight:600">A+</span><span id="v58-font-size-badge" style="font-family:var(--font-mono);font-size:.62rem;color:var(--accent)">' + (SETTINGS.fontSize || 20) + 'px</span>';
  btnFontInc.onclick = function(){ window.adjustNarrativeFontSize(2); };

  var btnMaxRead = document.createElement('button');
  btnMaxRead.type = 'button';
  btnMaxRead.id = 'v58-quick-maxread';
  btnMaxRead.className = 'v58-Quick-btn';
  btnMaxRead.title = '一鍵最大化文字閱讀區';
  btnMaxRead.setAttribute('aria-label', '大屏閱讀');
  btnMaxRead.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg><span>大屏閱讀</span>';
  btnMaxRead.onclick = function(){ window.toggleMaxNarrativeView(); };

  center.appendChild(btnFontDec);
  center.appendChild(btnFontInc);
  center.appendChild(btnMaxRead);

  var btnBack = document.createElement('button');
  btnBack.type = 'button';
  btnBack.id = 'v58-quick-lookback';
  btnBack.className = 'v58-Quick-btn';
  btnBack.title = '回看最近 3 句敘述';
  btnBack.setAttribute('aria-label', '回看最近三句');
  btnBack.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg><span>回看</span>';
  btnBack.onclick = function(){ openRecentSentencesModal(); };

  var btnTts = document.createElement('button');
  btnTts.type = 'button';
  btnTts.id = 'v58-quick-tts';
  btnTts.className = 'v58-Quick-btn' + (SETTINGS.v58TtsEnabled ? ' on' : '');
  btnTts.title = '自動朗讀聽書模式 (TTS)';
  btnTts.setAttribute('aria-label', '聽書朗讀模式');
  btnTts.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg><span>聽書</span>';
  btnTts.onclick = function(){
    SETTINGS.v58TtsEnabled = !SETTINGS.v58TtsEnabled;
    saveSettings(SETTINGS);
    btnTts.classList.toggle('on', !!SETTINGS.v58TtsEnabled);
    if(!SETTINGS.v58TtsEnabled) stopTTS();
    showToast('聽書模式（TTS 自動朗讀）已' + (SETTINGS.v58TtsEnabled ? '開啟' : '關閉'));
  };

  var btnCompass = document.createElement('button');
  btnCompass.type = 'button';
  btnCompass.id = 'v58-quick-compass';
  btnCompass.className = 'v58-Quick-btn';
  btnCompass.title = '查看距離真結局還缺什麼';
  btnCompass.setAttribute('aria-label', '真結局指引');
  btnCompass.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg><span>真結局指引</span>';
  btnCompass.onclick = function(){
    var hint = getTrueEndingGapHint(currentDungeonId);
    appendNarrative('<p class="inherit-note">【真結局指引羅盤】' + hint + '</p>');
    showToast(hint);
  };

  center.appendChild(btnBack);
  center.appendChild(btnTts);
  center.appendChild(btnCompass);
}

function injectQuickContinueButton(){
  var hubRight = document.querySelector('.hub-header-right');
  if(hubRight && !document.getElementById('v58-quick-resume-btn')){
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'v58-quick-resume-btn';
    btn.className = 'hub-gallery-btn';
    btn.style.borderColor = 'var(--accent)';
    btn.style.color = 'var(--accent-bright)';
    btn.textContent = '繼 續 上 次';
    btn.title = '直接跳回上次遊玩的門扉與場景';
    btn.onclick = function(){ resumeLastPlayedScene(); };
    hubRight.insertBefore(btn, hubRight.firstChild);
  }
}

function resumeLastPlayedScene(){
  var prefixes = [
    [1, 'prime-hotel-save'], [2, 'silent-library-save'], [3, 'countdown-hospital-save'],
    [4, 'infinite-core-save'], [5, 'v5-tide-save'], [6, 'v53-observatory-save'],
    [7, 'v58-tram-save'], [8, 'v58-buffet-save'], [9, 'v58-school1999-save']
  ];
  var latest = null, latestDid = 1;
  var lastDid = parseInt(localStorage.getItem('wuxian-v58-last-did') || '0', 10);
  if(lastDid >= 1){
    var pref = prefixes.find(function(p){ return p[0] === lastDid; });
    if(pref){
      try{ latest = JSON.parse(localStorage.getItem(pref[1] + '-auto')); latestDid = lastDid; }catch(e){}
    }
  }
  if(!latest){
    for(var i=0; i<prefixes.length; i++){
      try{
        var raw = localStorage.getItem(prefixes[i][1] + '-auto');
        if(raw){ latest = JSON.parse(raw); latestDid = prefixes[i][0]; break; }
      }catch(e){}
    }
  }
  if(!latest){
    showToast('尚無上次遊玩的自動存檔記錄，將為你開啟第一扇門');
    enterDungeon(1, true);
    return;
  }
  enterDungeon(latestDid, false);
  setTimeout(function(){
    $('game-title-screen').classList.remove('active');
    $('game-screen').classList.add('active');
    applySaveData(latest);
    showToast('已快速恢復上次場景：' + (latest.roomName || latest.currentScene));
  }, 260);
}

function hookMemoirAndNotes(){
  if(typeof window.renderNotes === 'function' && !window.renderNotes.__v58){
    var _rn = window.renderNotes;
    window.renderNotes = function(){
      var r = _rn.apply(this, arguments);
      try{
        var listEl = $('notes-list');
        if(!listEl || !state) return r;
        var metNpcs = (typeof getMetNpcs === 'function') ? getMetNpcs() : [];
        var npcNames = metNpcs.map(function(k){ return (NPC_PROFILES[k] && NPC_PROFILES[k].name) || k; });
        var itemsGot = (state.inventory || []).map(function(i){ return i.name; });
        var puzSolved = Object.keys(state.flags || {}).filter(function(k){ return /puzzle|solved|puz/.test(k) && state.flags[k]; });
        var readIds = (typeof getReadScenes === 'function') ? getReadScenes() : [];

        var extraHTML =
          '<div class="memoir-stats" style="margin-top:.75rem">' +
            '<div class="ms-stat-title">本 局 旅 程 檔 案（自動記錄）</div>' +
            '<div class="ms-stat-row"><span>已結識人物</span><span>' + (npcNames.length ? npcNames.slice(0,5).join('、') : '尚無') + '</span></div>' +
            '<div class="ms-stat-row"><span>持有物品</span><span>' + (itemsGot.length ? itemsGot.join('、') : '無') + '</span></div>' +
            '<div class="ms-stat-row"><span>已解開謎題數</span><span>' + puzSolved.length + ' 道</span></div>' +
          '</div>' +
          '<div class="memoir-stats" style="margin-top:.75rem">' +
            '<div class="ms-stat-title">已 讀 場 景 全 文 複 習（點擊回顧）</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.45rem">' +
              (readIds.length ? readIds.map(function(sid){
                return '<button type="button" class="v4-btn" style="font-size:.68rem;padding:.2rem .45rem" onclick="window.V58 && V58.reviewReadScene(\'' + String(sid).replace(/'/g,"\\'") + '\')">' + sid + '</button>';
              }).join('') : '<span style="font-size:.75rem;color:var(--text-dim)">尚無已讀場景</span>') +
            '</div>' +
          '</div>';
        listEl.insertAdjacentHTML('beforeend', extraHTML);
      }catch(e){}
      return r;
    };
    window.renderNotes.__v58 = true;
  }
}

function reviewReadScene(sid){
  if(!SCENES) return;
  var target = SCENES[sid];
  if(!target){
    for(var k in SCENES){
      if(SCENES[k] && SCENES[k].sceneId === sid){ target = SCENES[k]; break; }
    }
  }
  if(!target){ showToast('找不到該場景的文本記錄'); return; }
  var paras = (typeof target.getText === 'function') ? target.getText(state) : (target.text || []);
  var html = '<div style="font-size:.82rem;color:var(--accent);margin-bottom:.6rem">【場景複習】' + (target.roomName || sid) + '（' + (target.sceneId || sid) + '）</div>' +
    paras.join('');
  showObservation(html);
}

function injectV58NotebookTabs(){
  var tryAdd = function(){
    var nb = document.getElementById('v4-notebook');
    if(!nb){ setTimeout(tryAdd, 180); return; }
    var tabs = nb.querySelector('.v4-tabs');
    var body = nb.querySelector('#v4-nb-body');
    if(!tabs || !body || tabs.querySelector('[data-t="v58-shop"]')) return;

    [
      {id:'v58-shop',       label:'輪 迴 店'},
      {id:'v58-compendium', label:'結 局 鑑'},
      {id:'v58-daily',      label:'每 日 戰'}
    ].forEach(function(def){
      var b = document.createElement('button');
      b.className = 'v4-tab';
      b.setAttribute('data-t', def.id);
      b.textContent = def.label;
      tabs.appendChild(b);
    });

    tabs.addEventListener('click', function(e){
      var b = e.target.closest('.v4-tab');
      if(!b) return;
      var tid = b.getAttribute('data-t');
      if(tid !== 'v58-shop' && tid !== 'v58-compendium' && tid !== 'v58-daily') return;
      tabs.querySelectorAll('.v4-tab').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      if(tid === 'v58-shop') renderV58ShopTab(body);
      else if(tid === 'v58-compendium') renderV58CompendiumTab(body);
      else if(tid === 'v58-daily') (window.renderV58DailyTab || renderV58DailyTab)(body);
    });
  };
  tryAdd();
}

function renderV58ShopTab(body){
  var shards = getMemoryShards();
  var owned = getShopOwned();
  var html = '<div class="v4-sub">每次達成結局皆可獲得「記憶碎片」。花費碎片解鎖永久輪迴加成（下輪與後續所有門扉自動生效）：<br><strong style="color:var(--accent-bright)">當前持有記憶碎片：' + shards + ' 枚</strong></div>';
  html += '<div class="v4-list" style="margin-top:.65rem">';
  SHOP_ITEMS.forEach(function(it){
    var has = owned.indexOf(it.id) !== -1;
    html += '<div class="v4-row ' + (has ? 'unlocked' : '') + '">' +
      '<div class="v4-row-ic">◆</div>' +
      '<div class="v4-row-main">' +
        '<div class="v4-row-t">' + it.name + ' <span style="font-size:.72rem;color:var(--accent)">（花費 ' + it.cost + ' 碎片）</span></div>' +
        '<div class="v4-row-d">' + it.desc + '</div>' +
      '</div>' +
      (has ? '<span class="v4-chip gold">已永久解鎖</span>' : '<button class="v4-btn primary" data-buy="' + it.id + '">兌 換</button>') +
    '</div>';
  });
  html += '</div>';
  body.innerHTML = html;
  body.querySelectorAll('[data-buy]').forEach(function(b){
    b.onclick = function(){
      var id = b.getAttribute('data-buy');
      var item = SHOP_ITEMS.find(function(x){ return x.id === id; });
      if(!item) return;
      if(getMemoryShards() < item.cost){
        showToast('記憶碎片不足（需要 ' + item.cost + ' 枚，每次通關可獲得碎片）');
        return;
      }
      addMemoryShards(-item.cost);
      var cur = getShopOwned();
      if(cur.indexOf(id) === -1){ cur.push(id); v58SetJSON(LS_SHOP, cur); }
      showToast('已解鎖輪迴加成：' + item.name);
      renderV58ShopTab(body);
    };
  });
}

function renderV58CompendiumTab(body){
  var endLog = (typeof getEndingLog === 'function') ? getEndingLog() : [];
  var achList = (typeof getAchList === 'function') ? getAchList() : [];
  var totEnd = 0;
  Object.keys(ENDING_TOTALS || {}).forEach(function(k){ totEnd += (ENDING_TOTALS[k] || 0); });
  var spoilerTier = SETTINGS.v58SpoilerTier || 'summary';

  var html = '<div class="v4-sub">全局解鎖進度：<strong style="color:var(--accent-bright)">' + endLog.length + ' / ' + totEnd + ' 結局</strong> · <strong style="color:var(--accent-bright)">' + achList.length + ' / ' + ACH_TOTAL + ' 成就</strong></div>';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin:.55rem 0;padding:.45rem .65rem;background:var(--bg-card);border:1px solid var(--border);border-radius:4px">' +
    '<span style="font-size:.75rem;color:var(--text-dim)">劇透分級顯示：</span>' +
    '<div class="seg">' +
      '<button type="button" data-sp="locked" class="' + (spoilerTier==='locked'?'on':'') + '">達成前隱藏</button>' +
      '<button type="button" data-sp="summary" class="' + (spoilerTier==='summary'?'on':'') + '">達成後摘要</button>' +
      '<button type="button" data-sp="full" class="' + (spoilerTier==='full'?'on':'') + '">完整回顧與條件</button>' +
    '</div>' +
  '</div>';

  html += '<div style="margin:.55rem 0;padding:.55rem .75rem;border:1px solid rgba(201,169,110,.3);border-radius:4px;background:rgba(201,169,110,.06);font-size:.78rem;color:var(--accent-bright)">' +
    '【當前門扉真結局指引】' + (window.getTrueEndingGapHint || getTrueEndingGapHint)(currentDungeonId) +
  '</div>';

  html += '<div class="v4-list">';
  (dungeons || []).forEach(function(d){
    var found = endLog.filter(function(e){ return e.indexOf(String(d.id)+'|')===0; });
    var total = (ENDING_TOTALS && ENDING_TOTALS[d.id]) || 0;
    var isHid = (window.V61 && typeof V61.getDungeonDisplayState === 'function' && V61.getDungeonDisplayState(d.id) === 'hidden' && !window._gmUnlocked);
    var dLabel = isHid ? '？？？' : d.name;
    html += '<div class="v4-sec" style="margin-top:.7rem">' + d.index + ' · ' + dLabel + '（' + found.length + ' / ' + total + '）</div>';
    found.forEach(function(entry){
      var parts = entry.split('|');
      var tp = parts[1] || '', title = parts[2] || '';
      var descTxt = (spoilerTier === 'locked') ? '（已隱藏劇透詳情）' : (spoilerTier === 'full' ? ('結局代碼：' + tp + ' · 已完整收錄於時間線檔案，可隨時重溫。') : ('已達成結局 · 類型：' + tp));
      html += '<div class="v4-row unlocked"><div class="v4-row-ic">★</div><div class="v4-row-main"><div class="v4-row-t">' + title + '</div><div class="v4-row-d">' + descTxt + '</div></div></div>';
    });
    var rem = Math.max(0, total - found.length);
    if(rem > 0){
      html += '<div class="v4-row locked"><div class="v4-row-ic">？</div><div class="v4-row-main"><div class="v4-row-t">尚有 ' + rem + ' 個未解鎖結局</div><div class="v4-row-d">' + (spoilerTier === 'full' ? getTrueEndingGapHint(d.id) : '達成前不顯示劇透內容（可切換至「完整回顧與條件」查看解鎖方向）') + '</div></div></div>';
    }
  });
  html += '</div>';
  body.innerHTML = html;
  body.querySelectorAll('[data-sp]').forEach(function(b){
    b.onclick = function(){
      SETTINGS.v58SpoilerTier = b.getAttribute('data-sp');
      saveSettings(SETTINGS);
      renderV58CompendiumTab(body);
    };
  });
}

function renderV58DailyTab(body){
  var info = getTodaySeedInfo();
  var dObj = (dungeons || []).find(function(x){ return x.id === info.dungeonId; }) || {name:'質數旅館'};
  var isHid = (window.V61 && typeof V61.getDungeonDisplayState === 'function' && V61.getDungeonDisplayState(info.dungeonId) === 'hidden' && !window._gmUnlocked);
  var dDispName = isHid ? '？？？' : dObj.name;
  var best = v58GetJSON(LS_DAILY, {});
  var todayBest = best[info.dateStr] || '尚無今日通關紀錄';
  body.innerHTML =
    '<div class="v4-sub">每天固定一個全服同步 Seed：相同的隨機事件、相同的站點洗牌與指定詞條，比拼通關時間與結局探索數。</div>' +
    '<div style="margin:.8rem 0;padding:.9rem;border:1px solid var(--accent);border-radius:4px;background:var(--bg-card)">' +
      '<div style="font-family:var(--font-mono);font-size:.75rem;color:var(--accent)">TODAY SEED · ' + info.dateStr + ' (#' + info.seed + ')</div>' +
      '<div style="font-size:1.05rem;color:var(--text-bright);margin:.35rem 0;font-weight:bold">今日指定門扉：第 ' + info.dungeonId + ' 扇門《' + dDispName + '》</div>' +
      '<div style="font-size:.82rem;color:var(--text)">固定詞條：【' + info.modifier.name + '】' + info.modifier.desc + '</div>' +
      '<div style="font-size:.76rem;color:var(--text-dim);margin-top:.45rem">今日最佳紀錄：' + todayBest + '</div>' +
      '<div style="margin-top:.85rem"><button type="button" class="v4-btn primary" onclick="window.V58 && V58.startDailyChallenge()">立即開始今日挑戰</button></div>' +
    '</div>';
}
window.renderV58DailyTab = renderV58DailyTab;

function hookCoreRuntimeForV58(){
  if(typeof window.quitToTitle === 'function' && !window.quitToTitle.__v58){
    var _qt = window.quitToTitle;
    window.quitToTitle = function(){
      if($('game-screen') && $('game-screen').classList.contains('active') && !$('ending-screen').classList.contains('show')){
        showConfirm('返回主標題後，目前未保存的手動進度可能會消失（已為你保留自動存檔）。確定要返回標題嗎？', function(){
          autoSave();
          _qt();
        }, '返回標題確認');
        return;
      }
      return _qt.apply(this, arguments);
    };
    window.quitToTitle.__v58 = true;
  }

  if(typeof window.renderSlots === 'function' && !window.renderSlots.__v58){
    var _rsl = window.renderSlots;
    window.renderSlots = function(mode){
      var r = _rsl.apply(this, arguments);
      try{
        var slotList = $('slot-list');
        if(!slotList) return r;
        if(!document.getElementById('v58-slot-note-bar')){
          var bar = document.createElement('div');
          bar.id = 'v58-slot-note-bar';
          bar.style.cssText = 'margin-bottom:.65rem;display:flex;flex-direction:column;gap:.4rem';
          bar.innerHTML =
            '<input type="text" id="v58-slot-custom-name" placeholder="可輸入存檔標註名稱（例如：準備打真結局）…" style="width:100%;padding:.42rem .6rem;background:#0e0e12;border:1px solid var(--border);color:var(--text-bright);font-size:.78rem;border-radius:3px">' +
            '<div style="display:flex;gap:.35rem;flex-wrap:wrap;justify-content:center">' +
              '<button type="button" class="v4-btn" style="font-size:.68rem" onclick="window.V58 && V58.openTextSaveModal()">文字碼匯出/匯入 & URL雲端同步</button>' +
              '<button type="button" class="v4-btn" style="font-size:.68rem" onclick="window.V58 && V58.rollbackSaveBackup(0)">回滾最近備份</button>' +
            '</div>';
          slotList.parentNode.insertBefore(bar, slotList);
        }
        for(var n=1; n<=3; n++){
          var m = slotMeta(n);
          if(m && m.customNote){
            var cards = slotList.querySelectorAll('.slot-card:not(.empty)');
            cards.forEach(function(c){
              var numEl = c.querySelector('.slot-num');
              if(numEl && numEl.textContent === String(n)){
                var l1 = c.querySelector('.slot-line1');
                if(l1 && l1.textContent.indexOf('【') === -1){
                  l1.textContent = '【' + m.customNote + '】' + l1.textContent;
                }
              }
            });
          }
        }
      }catch(e){}
      return r;
    };
    window.renderSlots.__v58 = true;
  }

  if(typeof window.collectSaveData === 'function' && !window.collectSaveData.__v58){
    var _csd = window.collectSaveData;
    window.collectSaveData = function(){
      var d = _csd.apply(this, arguments);
      var noteInp = document.getElementById('v58-slot-custom-name');
      if(noteInp && noteInp.value.trim()){
        d.customNote = noteInp.value.trim();
      }
      d.stress = state ? (state.stress || 0) : 0;
      d.satiety = state ? (state.satiety || 0) : 0;
      d.mirrorHp = state ? (state.mirrorHp != null ? state.mirrorHp : 100) : 100;
      d.partyMembers = state ? (state.partyMembers || []) : [];
      d.v58Version = '5.8.0';
      var rawForCheck = JSON.stringify({s:d.currentScene, h:d.hp, i:(d.inventory||[]).length});
      d.checksum = computeSaveChecksum(rawForCheck);
      return d;
    };
    window.collectSaveData.__v58 = true;
  }

  if(typeof window.doSave === 'function' && !window.doSave.__v58){
    var _ds = window.doSave;
    window.doSave = function(n){
      var r = _ds.apply(this, arguments);
      try{
        var raw = localStorage.getItem(SAVE_PREFIX + '-' + n);
        if(raw) recordSaveBackup(SAVE_PREFIX + '-' + n, raw);
      }catch(e){}
      return r;
    };
    window.doSave.__v58 = true;
  }

  if(typeof window.applySaveData === 'function' && !window.applySaveData.__v58){
    var _asd = window.applySaveData;
    window.applySaveData = function(d){
      if(d && d.stress != null && state) state.stress = d.stress;
      if(d && d.satiety != null && state) state.satiety = d.satiety;
      if(d && d.mirrorHp != null && state) state.mirrorHp = d.mirrorHp;
      if(d && Array.isArray(d.partyMembers) && state) state.partyMembers = d.partyMembers;
      var r = _asd.apply(this, arguments);
      updateV58HUD();
      return r;
    };
    window.applySaveData.__v58 = true;
  }

  if(typeof window.applyMood === 'function' && !window.applyMood.__v58){
    var _am = window.applyMood;
    window.applyMood = function(mood){
      document.body.setAttribute('data-mood', mood || 'mystery');
      return _am.apply(this, arguments);
    };
    window.applyMood.__v58 = true;
  }

  if(typeof window.goToScene === 'function' && !window.goToScene.__v58){
    var _gts = window.goToScene;
    window.goToScene = function(id){
      var sc = SCENES && SCENES[id];
      try{ localStorage.setItem('wuxian-v58-last-did', String(currentDungeonId)); }catch(e){}
      if(sc){
        (window.updateSceneArtBanner || updateSceneArtBanner)(sc);
        var _asFn = window.addStress || addStress;
        if(sc.mood === 'terror' || sc.mood === 'danger'){
          _asFn(6);
          playV58TransitionFX('glitch');
          playV58SceneSfx('bell');
        } else if(sc.mood === 'tension'){
          _asFn(3);
          playV58SceneSfx('step');
        } else if(sc.mood === 'safe'){
          _asFn(-8);
          playV58SceneSfx('page');
        } else {
          playV58SceneSfx('step');
        }
        if(state && state.partyMembers && state.partyMembers.some(function(m){ return !m.alive; })){
          _asFn(4);
        }
        if(state && state.activeModifiers && state.activeModifiers.some(function(m){ return m.id==='mod_minimal'; })){
          state.hp = Math.min(state.maxHp||100, (state.hp||100) + 3);
          updateHP();
        }
      }
      var r = _gts.apply(this, arguments);
      updateV58HUD();
      return r;
    };
    window.goToScene.__v58 = true;
  }

  if(typeof window.typewriterHTML === 'function' && !window.typewriterHTML.__v58){
    var _tw = window.typewriterHTML;
    window.typewriterHTML = function(html, cb){
      var r = _tw.call(this, html, function(){
        try{
          var narr = $('narrative');
          var last = narr && narr.lastElementChild;
          if(last){
            var txt = (last.textContent || '').trim();
            if(txt){
              recentSentencesRing.push({
                room: ($('room-name') && $('room-name').textContent) || '場景',
                text: txt
              });
              if(recentSentencesRing.length > 12) recentSentencesRing.shift();
              if(txt.length >= 65) last.classList.add('v58-long-para');
              if(/詩|偈|曰：|「.*，.*。」/.test(txt) && txt.length < 48) last.classList.add('v58-poetic');
              speakTextTTS(txt, false);
            }
          }
        }catch(e){}
        if(cb) cb();
      });
      return r;
    };
    window.typewriterHTML.__v58 = true;
  }

  if(typeof window.damage === 'function' && !window.damage.__v58){
    var _dmg = window.damage;
    window.damage = function(amount){
      var diffMode = SETTINGS.v58Difficulty || 'classic';
      if(diffMode === 'story'){
        showToast('【故事模式】已自動免疫傷害');
        return;
      }
      if(state && state.partyMembers && state.partyMembers.length > 0 && amount >= 10){
        var protector = state.partyMembers.find(function(m){ return m.alive && getNpcAffinity(m.id) >= 75; });
        if(protector){
          var shared = Math.floor(amount / 2);
          protector.hp = Math.max(0, protector.hp - shared);
          if(protector.hp <= 0) protector.alive = false;
          amount = amount - shared;
          appendNarrative('<p class="inherit-note">【夥伴護衛】' + protector.name + '挺身替你擋下了一半衝擊（為你分擔 ' + shared + ' 點傷害）！</p>');
        }
        var traitor = state.partyMembers.find(function(m){ return m.alive && getNpcAffinity(m.id) < 35; });
        if(traitor && state.inventory && state.inventory.length > 0 && !state.flags.v58_betrayed){
          state.flags.v58_betrayed = true;
          var stolen = state.inventory[state.inventory.length - 1];
          removeItem(stolen.id);
          traitor.alive = false;
          appendNarrative('<p class="system-msg">【低信任背叛】混亂中，對你心懷戒備的' + traitor.name + '趁機奪走了你的「' + stolen.name + '」並逃入暗處！</p>');
        }
      }
      if(diffMode === 'hell' && (state.hp - amount) <= 0){
        saveInheritance({ng_plus:false});
      }
      var r = _dmg.call(this, amount);
      checkDynamicLowHpAudio();
      updateV58HUD();
      return r;
    };
    window.damage.__v58 = true;
  }

  if(typeof window.renderChoices === 'function' && !window.renderChoices.__v58){
    var _rc = window.renderChoices;
    window.renderChoices = function(choices){
      var r = _rc.apply(this, arguments);
      try{
        var c = $('choices');
        if(!c) return r;
        var btns = c.querySelectorAll('.choice-btn');
        var valid = (choices || []).filter(function(ch){ return !ch.condition || ch.condition(); });
        btns.forEach(function(btn, idx){
          var ch = valid[idx];
          btn.setAttribute('aria-label', btn.textContent || ('選項 ' + (idx+1)));
          if(!ch) return;
          var previews = [];
          var actStr = ch.action ? String(ch.action) : '';
          var condStr = ch.condition ? String(ch.condition) : '';
          var mDmg = actStr.match(/damage\(\s*(\d+)\s*\)/);
          if(mDmg) previews.push('HP -' + mDmg[1]);
          if(ch.danger && !mDmg) previews.push('高危');
          var mItem = condStr.match(/hasItem\(\s*['"]([^'"]+)['"]\s*\)/);
          if(mItem) previews.push('需信物');
          if(ch.personality){
            if(ch.personality.calm) previews.push('冷靜' + (ch.personality.calm>0?'+':'') + ch.personality.calm);
            if(ch.personality.altruism) previews.push('利他' + (ch.personality.altruism>0?'+':'') + ch.personality.altruism);
          }
          if(previews.length > 0){
            var infoTxt = previews.join(' · ');
            btn.setAttribute('data-tooltip', '選項預覽：' + infoTxt);
            if(!btn.querySelector('.v58-choice-preview')){
              var pv = document.createElement('span');
              pv.className = 'v58-choice-preview';
              pv.textContent = infoTxt;
              btn.appendChild(pv);
            }
          }
        });

        if(state && (state.stress || 0) >= 80 && !c.querySelector('.v58-hallucination')){
          var halBtn = document.createElement('button');
          halBtn.type = 'button';
          halBtn.className = 'choice-btn v58-hallucination';
          halBtn.innerHTML = '<span class="choice-num">幻</span><span class="txt">聽從耳邊的低語，走向牆壁裂縫裡的假門（幻覺）</span><span class="v58-choice-preview">高壓幻覺</span>';
          halBtn.onclick = function(){
            playV58TransitionFX('glitch');
            state.stress = Math.max(40, (state.stress||80) - 25);
            if(SETTINGS.v58Difficulty !== 'story') damage(5);
            appendNarrative('<p class="system-msg">【幻覺破碎】你伸手觸碰那扇門，指尖卻撞上了冰冷的實心牆壁。疼痛讓你清醒了過來（壓力 -25）。</p>');
            halBtn.remove();
            updateV58HUD();
          };
          c.appendChild(halBtn);
        }
      }catch(e){}
      return r;
    };
    window.renderChoices.__v58 = true;
  }

  if(typeof window.resetDungeonState === 'function' && !window.resetDungeonState.__v58){
    var _rds = window.resetDungeonState;
    window.resetDungeonState = function(){
      var r = _rds.apply(this, arguments);
      try{
        state.stress = 0;
        state.satiety = 0;
        state.mirrorHp = 100;
        initPartyMembersForDungeon(currentDungeonId);
        applyShopAndModifiersToState();
        updateV58HUD();
      }catch(e){}
      return r;
    };
    window.resetDungeonState.__v58 = true;
  }

  if(typeof window.triggerEnding === 'function' && !window.triggerEnding.__v58){
    var _te = window.triggerEnding;
    window.triggerEnding = function(type, title, desc, reward){
      var r = _te.apply(this, arguments);
      try{
        var shardGain = /^(hidden_|survive_|normal_)/.test(type||'') ? 2 : 1;
        if(state && state.activeModifiers && state.activeModifiers.some(function(m){ return m.id==='mod_half'; })){
          shardGain *= 2;
        }
        var totalShards = addMemoryShards(shardGain);
        playEndingPianoMelody();
        if(SETTINGS.v58TtsEnabled || SETTINGS.v58EndingVoice !== false){
          speakTextTTS('結局達成：' + title + '。' + desc, false);
        }
        if(state && state.flags && state.flags.isDailyChallenge){
          var info = getTodaySeedInfo();
          var db = v58GetJSON(LS_DAILY, {});
          db[info.dateStr] = title + '（耗時 ' + fmtElapsed(Date.now() - (window.gameStartTime||Date.now())) + '）';
          v58SetJSON(LS_DAILY, db);
        }
        setTimeout(function(){
          var statsBox = $('ending-stats');
          if(statsBox){
            var summaryDiv = document.getElementById('v58-ending-fate-box');
            if(!summaryDiv){
              summaryDiv = document.createElement('div');
              summaryDiv.id = 'v58-ending-fate-box';
              summaryDiv.style.cssText = 'max-width:520px;margin:.75rem auto;padding:.7rem .95rem;border:1px solid rgba(201,169,110,.35);border-radius:4px;background:rgba(18,18,24,.88);font-size:.8rem;line-height:1.65;color:var(--text-bright);text-align:left';
              statsBox.parentNode.insertBefore(summaryDiv, statsBox.nextSibling);
            }
            summaryDiv.innerHTML =
              '<div style="color:var(--accent);font-size:.72rem;margin-bottom:.25rem">【本局回顧 · 獲得記憶碎片 +' + shardGain + '（累計 ' + totalShards + ' 枚）】</div>' +
              '<div>' + generateFateSummaryText() + '</div>';
          }
          var actBox = $('ending-actions');
          if(actBox && !document.getElementById('v58-copy-fate-btn')){
            var b = document.createElement('button');
            b.type = 'button';
            b.id = 'v58-copy-fate-btn';
            b.className = 'secondary';
            b.textContent = '複製本局命運摘要';
            b.onclick = function(){ copyFateSummary(); };
            actBox.appendChild(b);
          }
        }, 350);
      }catch(e){}
      return r;
    };
    window.triggerEnding.__v58 = true;
  }

  if(typeof window.renderSettings === 'function' && !window.renderSettings.__v58){
    var _rs = window.renderSettings;
    window.renderSettings = function(){
      var r = _rs.apply(this, arguments);
      try{
        var body = $('settings-body');
        if(!body || document.getElementById('v58-settings-group')) return r;
        var grp = document.createElement('div');
        grp.id = 'v58-settings-group';
        var curDiff = SETTINGS.v58Difficulty || 'classic';
        var ttsRate = SETTINGS.v58TtsRate || 1.0;
        grp.innerHTML =
          '<div class="setting-row" style="border-top:1px solid var(--border);margin-top:.6rem;padding-top:.6rem">' +
            '<div><div class="set-label">v5.8 遊戲模式</div><div class="set-sub">故事模式（無HP與時間壓力）／經典模式／地獄模式（HP歸零不可繼承）</div></div>' +
            '<div class="seg">' +
              '<button type="button" data-v58diff="story" class="' + (curDiff==='story'?'on':'') + '">故事</button>' +
              '<button type="button" data-v58diff="classic" class="' + (curDiff==='classic'?'on':'') + '">經典</button>' +
              '<button type="button" data-v58diff="hell" class="' + (curDiff==='hell'?'on':'') + '">地獄</button>' +
            '</div>' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="set-label">聽書模式（TTS 語音朗讀）</div><div class="set-sub">使用瀏覽器語音合成朗讀敘事與結局結語</div></div>' +
            '<div class="toggle ' + (SETTINGS.v58TtsEnabled?'on':'') + '" id="v58-tts-toggle"></div>' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="set-label">TTS 朗讀語速</div><div class="set-sub">調整語音朗讀速率（0.7x – 1.5x）</div></div>' +
            '<div style="display:flex;align-items:center;gap:.5rem">' +
              '<input type="range" class="speed-slider" id="v58-tts-rate" min="0.7" max="1.5" step="0.1" value="' + ttsRate + '">' +
              '<span class="speed-val" id="v58-tts-rate-val">' + ttsRate + 'x</span>' +
            '</div>' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="set-label">閱讀器純文字模式</div><div class="set-sub">關閉所有背景粒子、配圖與轉場動畫，專注純文字閱讀</div></div>' +
            '<div class="toggle ' + (SETTINGS.v58ReaderMode?'on':'') + '" id="v58-reader-toggle"></div>' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="set-label">分路音效獨立開關</div><div class="set-sub">BGM 背景音樂 ／ SFX 環境音效 ／ UI 互動音分開控制</div></div>' +
            '<div class="seg">' +
              '<button type="button" id="v58-chan-bgm" class="' + (!SETTINGS.v58BgmMuted?'on':'') + '">BGM</button>' +
              '<button type="button" id="v58-chan-sfx" class="' + (!SETTINGS.v58SfxMuted?'on':'') + '">SFX</button>' +
              '<button type="button" id="v58-chan-ui" class="' + (SETTINGS.uiSfx?'on':'') + '">UI音</button>' +
            '</div>' +
          '</div>';
        body.appendChild(grp);

        grp.querySelectorAll('[data-v58diff]').forEach(function(b){
          b.onclick = function(){
            SETTINGS.v58Difficulty = b.getAttribute('data-v58diff');
            saveSettings(SETTINGS); renderSettings();
            showToast('已切換為：' + ({story:'故事模式',classic:'經典模式',hell:'地獄模式'})[SETTINGS.v58Difficulty]);
          };
        });
        var ttsTg = document.getElementById('v58-tts-toggle');
        if(ttsTg) ttsTg.onclick = function(){
          SETTINGS.v58TtsEnabled = !SETTINGS.v58TtsEnabled;
          if(!SETTINGS.v58TtsEnabled) stopTTS();
          saveSettings(SETTINGS); renderSettings();
        };
        var ttsR = document.getElementById('v58-tts-rate');
        if(ttsR) ttsR.oninput = function(){
          SETTINGS.v58TtsRate = parseFloat(ttsR.value);
          document.getElementById('v58-tts-rate-val').textContent = ttsR.value + 'x';
          saveSettings(SETTINGS);
        };
        var rdTg = document.getElementById('v58-reader-toggle');
        if(rdTg) rdTg.onclick = function(){
          SETTINGS.v58ReaderMode = !SETTINGS.v58ReaderMode;
          document.body.classList.toggle('v58-reader-mode', !!SETTINGS.v58ReaderMode);
          saveSettings(SETTINGS); renderSettings();
        };
        var cBgm = document.getElementById('v58-chan-bgm');
        if(cBgm) cBgm.onclick = function(){
          SETTINGS.v58BgmMuted = !SETTINGS.v58BgmMuted;
          SETTINGS.bgmEnabled = !SETTINGS.v58BgmMuted;
          if(SETTINGS.v58BgmMuted) stopBGM(); else { initAudio(); startBGM(); }
          saveSettings(SETTINGS); renderSettings();
        };
        var cSfx = document.getElementById('v58-chan-sfx');
        if(cSfx) cSfx.onclick = function(){
          SETTINGS.v58SfxMuted = !SETTINGS.v58SfxMuted;
          saveSettings(SETTINGS); renderSettings();
        };
        var cUi = document.getElementById('v58-chan-ui');
        if(cUi) cUi.onclick = function(){
          SETTINGS.uiSfx = !SETTINGS.uiSfx;
          saveSettings(SETTINGS); renderSettings();
        };
      }catch(e){}
      return r;
    };
    window.renderSettings.__v58 = true;
  }

  document.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){
      if(document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'BUTTON')) return;
      if($('game-screen') && $('game-screen').classList.contains('active') && !document.querySelector('.modal-overlay.show')){
        if(isTyping()){ skipTyping(); return; }
        var firstBtn = document.querySelector('#choices .choice-btn');
        if(firstBtn) firstBtn.click();
      }
    }
  });

  if(location.hash && location.hash.indexOf('#save=') === 0){
    setTimeout(function(){
      importSaveFromBase64(location.hash);
    }, 600);
  }
}

function upgradeI18NForV58(){
  if(!window.I18N) return;

  var v58EN = {
    '第 七 扇 門':'DUNGEON VII',
    '第 八 扇 門':'DUNGEON VIII',
    '第 九 扇 門 · DLC':'DUNGEON IX · DLC',
    '鏡像電車':'The Mirror Tram',
    '無盡自助餐':'The Endless Buffet',
    '小學 1999':'Primary School 1999',
    '雙 軌 迴 廊 · 第 七 扇 門':'DUAL-TRACK CORRIDOR · DUNGEON VII',
    '記 憶 饗 宴 · 第 八 扇 門':'FEAST OF MEMORIES · DUNGEON VIII',
    '懷 舊 夾 縫 · 第 九 扇 門 (DLC)':'NOSTALGIC RIFT · DUNGEON IX (DLC)',
    '車 窗 裡 的 你 ， 永 遠 做 相反 的 選 擇':'YOUR REFLECTION IN THE WINDOW ALWAYS CHOOSES THE OPPOSITE',
    '每 道 菜 都 是 一 個 人 的 一 生 · 吃 太 多 會 撐 死':'EVERY DISH IS A HUMAN LIFE · OVEREATING IS FATAL',
    '你 知 道 長 大 後 的 答 案 ， 但 小 時 候 的 你 不 會 那 樣 選':'YOU KNOW THE ADULT ANSWER, YET YOUR CHILDHOOD SELF WILL NOT PICK IT',
    '繼 續 上 次':'CONTINUE',
    '輪 迴 店':'SHOP',
    '結 局 鑑':'COMPENDIUM',
    '每 日 戰':'DAILY SEED',
    '回看':'Lookback',
    '聽書':'TTS Read',
    '真結局指引':'True Ending Guide',
    '壓力':'Stress',
    '飽食度':'Satiety',
    '鏡像HP':'Mirror HP',
    '耗物換提示':'Trade Item for Hint',
    '分配給隊友':'Give to Ally',
    '鎖定跨輪繼承':'Lock for Next Run',
    '已鎖定跨輪繼承':'Locked for Next Run',
    '丟棄物品':'Discard Item',
    '複製本局命運摘要':'Copy Run Fate Summary',
    '文字碼匯出/匯入 & URL雲端同步':'Text Save Export/Import & URL Sync',
    '回滾最近備份':'Rollback Backup',
    '故事':'Story',
    '經典':'Classic',
    '地獄':'Hell',
    '普通':'Common',
    '稀有':'Rare',
    '傳說':'Legendary',
    '達成前隱藏':'Hide Spoilers',
    '達成後摘要':'Summary Only',
    '完整回顧與條件':'Full Guide & Conditions',
    '立即開始今日挑戰':'START DAILY CHALLENGE',
    '列車長·沈默':'Conductor Shen Mo',
    '車窗裡的你':'Your Window Reflection',
    '紅圍巾少女·林雙':'Lin Shuang (Red Scarf)',
    '調音師·宋弦':'Tuner Song Xian',
    '抱時刻表的老人':'Blind Timetable Elder',
    '沉睡的夜班客':'Sleeping Commuter',
    '月台小販·阿婆':'Platform Vendor Grandma',
    '主廚·老陳':'Head Chef Old Chen',
    '十二歲的陸衍':'12-Year-Old Lu Yan',
    '同桌·林小滿':'Desk-Mate Lin Xiaoman'
  };

  var v58JA = {
    '第 七 扇 門':'第 七 章',
    '第 八 扇 門':'第 八 章',
    '第 九 扇 門 · DLC':'第 九 章 · DLC',
    '鏡像電車':'鏡像電車',
    '無盡自助餐':'無尽ビュッフェ',
    '小學 1999':'小学校 1999',
    '雙 軌 迴 廊 · 第 七 扇 門':'双 軌 回 廊 · 第 七 章',
    '記 憶 饗 宴 · 第 八 扇 門':'記 憶 の 饗 宴 · 第 八 章',
    '懷 舊 夾 縫 · 第 九 扇 門 (DLC)':'郷 愁 の 狭 間 · 第 九 章 (DLC)',
    '車 窗 裡 的 你 ， 永 遠 做 相反 的 選 擇':'車窓の向こうのあなたは、常に正反対の選択をする',
    '每 道 菜 都 是 一 個 人 的 一 生 · 吃 太 多 會 撐 死':'すべての料理は誰かの生涯・食べ過ぎれば死に至る',
    '你 知 道 長 大 後 的 答 案 ， 但 小 時 候 的 你 不 會 那 樣 選':'大人の正解を知っていても、幼い自分はそう選ばない',
    '繼 續 上 次':'前回の続き',
    '輪 迴 店':'輪 廻 店',
    '結 局 鑑':'結 末 録',
    '每 日 戰':'日 替 挑 戦',
    '回看':'直前ログ',
    '聽書':'音声読上',
    '真結局指引':'真エンド指針',
    '壓力':'ストレス',
    '飽食度':'満腹度',
    '鏡像HP':'鏡像HP',
    '耗物換提示':'アイテムでヒント',
    '分配給隊友':'仲間に渡す',
    '鎖定跨輪繼承':'次周へ引き継ぐ',
    '已鎖定跨輪繼承':'引き継ぎ設定済',
    '丟棄物品':'捨てる',
    '複製本局命運摘要':'運命要約をコピー',
    '故事':'物語',
    '經典':'標準',
    '地獄':'地獄',
    '普通':'普通',
    '稀有':'希少',
    '傳說':'伝説'
  };

  var v58PhraseEN = [
    ['迴廊深處傳來低語：旅人，第一扇門已經敞開。', 'Welcome to the Corridor, Player. Your first trial is about to begin. '],
    ['門後之地：質數旅館。距離門扉閉合還有十秒。', 'Dungeon: Prime Number Hotel. Difficulty: D. Preparation time: 10 seconds.'],
    ['你又站回大廳。燈還是那樣，隔幾秒閃一下。空氣裡的霉味比頭一回進來時更沖——也許是你待久了，鼻子敏了。', 'You stand back in the lobby. The ceiling bulb still flickers every few seconds, and the smell of mildew feels sharper than when you first arrived.'],
    ['沙發、前台、樓梯，你都走過一遍。不用再看。', 'The sofa, the front desk, the stairs—you have already checked them all.'],
    ['牆上的鐘比剛才又往前走了一點。你知道時間不多。', 'The wall clock has crept forward again. You know time is running short.'],
    ['床。床頭櫃。衣櫃。浴室。和其他房間一樣的佈局。', 'A bed, a nightstand, a wardrobe, and a bathroom—the exact same layout as the other rooms.'],
    ['衣櫃裡只有一個衣架，塑膠的，裂了一道縫。你把衣架拿出來看了看——裂縫裡卡著一張紙條，折成四方形。', 'Inside the wardrobe hangs a single cracked plastic hanger; wedged inside its split seam is a note folded into a neat square.'],
    ['你把紙條塞進口袋。浴室的水龍頭在滴水，噠、噠、噠。你走過去關緊。瓷磚上有一根頭髮，棕色的，很長。不是你的。', 'You slip the note into your pocket and twist the dripping bathroom faucet shut. A long brown hair lies across the tile—not yours.'],
    ['你沒碰那根頭髮。', 'You leave that strand of hair untouched.'],
    ['老趙張嘴，沒話。', 'Old Zhao opens his mouth, speechless.'],
    ['你沒理他，翻登記簿。前幾頁空白。倒數第二頁有痕跡——有人用鉛筆寫過什麼又擦掉。你把本子舉到燈下，斜著光看。', 'Ignoring him, you flip through the blank pages of the guest register until the second-to-last page reveals erased pencil indentations under the angled lamplight.'],
    ['你盯著這行字。兩質數和為10：3+7。乘積21。各位和2+1=3。3號房。', 'You study the line: two primes summing to 10 are 3 and 7; their product is 21, and 2 + 1 = 3. Room 3.'],
    ['2是第一個。所以2是謊言。2號不能進。', '2 is the first number—so Room 2 is the lie and cannot be entered.'],
    ['你看一眼鐘。11:57。還有三分鐘第一次置換。規則說置換時待在質數房裡安全。先去3號。', 'You glance at the clock: 11:57. Three minutes until the first shift. Room 3 comes first.'],
    ['你想自己去看一眼2號房。也許規則在騙人？也許2號其實安全？', 'You decide to check Room 2 yourself—what if the rules are bluffing and Room 2 is actually safe?'],
    ['你走到2號門前，握住把手，往下壓——', 'You step before Room 2, grip the handle, and press it down—'],
    ['門開了。門後不是房間，是黑。那種實質的黑從門縫湧出來，裹住你的手。', 'The door swings open onto solid, tangible darkness that surges from the gap and wraps around your hand.'],
    ['你想縮手，晚了。黑順著手臂往上爬，像冰水滲進皮膚。', 'You try to pull back, but it is too late; the darkness creeps up your arm like ice water seeping through skin.'],
    ['最後一個念頭：原來規則沒騙人。', 'Your final thought: the rule was not lying after all.'],
    ['四人擠進3號房。比想像中小。一張單人床，床單發黃。一個衣櫃，木頭的，門有點歪。衣櫃旁掛一面鏡子，鏡面模糊，照人像隔了層水。窗戶被木板釘死。', 'The four of you squeeze into Room 3—a cramped space with a yellowed single bed, a crooked wooden wardrobe, a clouded mirror, and a boarded-up window.'],
    ['12:00整。晃動開始。', '12:00 sharp. The tremor begins.'],
    ['你聽見自己的心跳。聽見旁邊蘇晚的呼吸，很勻，沒亂。聽見老趙低聲罵髒話。', 'You hear your own heartbeat, Su Wan\'s steady breathing beside you, and Old Zhao cursing under his breath.'],
    ['阿凱——沒聲音。', 'From Akai—not a sound.'],
    ['你在想那三秒的安靜。', 'Your mind lingers on those three seconds of dead silence.'],
    ['二樓走廊。不長，兩邊排著房門。燈比大廳更暗，有幾個燈泡已經壞了，走廊一段亮一段黑。', 'The 2nd-floor corridor is short and lined with doors, patched in alternating light and shadow under broken bulbs.'],
    ['你沿牆走，逐一看門牌。', 'You walk along the wall, inspecting each doorplate in turn.'],
    ['5和7是銅門牌——質數房。其餘全黑，打開即死。', 'Rooms 5 and 7 bear brass plates—prime rooms. The rest are black and fatal to open.'],
    ['走廊中段牆上掛一幅油畫，畫的是旅館大廳。但畫裡有五個人。第五個站角落，臉是糊的。', 'Midway down the hall hangs an oil painting of the lobby showing five people—the fifth standing in the corner with a blurred face.'],
    ['地上有污漬，畫成三個圓，排成三角。每個圓裡一個數字：3、5、7。', 'Stains on the floor form three circles arranged in a triangle, holding the numbers 3, 5, and 7.'],
    ['走廊盡頭最暗那一截，蹲著一個人影。', 'At the darkest end of the corridor crouches a figure.']
  ];

  var origT = I18N.t;
  I18N.t = function(str, langOverride){
    if(str == null || typeof str !== 'string') return str;
    var lg = langOverride || I18N.lang || 'zh-Hant';
    if(lg === 'zh-Hant') return str;
    var tr = str.trim();
    if(!tr) return str;
    if(lg === 'en'){
      if(v58EN[tr]) return v58EN[tr];
      for(var i=0; i<v58PhraseEN.length; i++){
        if(tr === v58PhraseEN[i][0]) return v58PhraseEN[i][1];
      }
    }
    if(lg === 'ja' && v58JA[tr]) return v58JA[tr];
    var res = origT.apply(this, arguments);
    if(lg === 'en' && typeof res === 'string'){
      res = res.replace(/\b(\w+)\s+\1\b/gi, '$1')
               .replace(/\bnot\s+yours\s*\./gi, 'not yours.')
               .replace(/\byours\s+([a-z]+)/gi, 'your $1')
               .replace(/\.{3,}/g, function(m){ return str.indexOf('…') !== -1 ? '...' : '.'; })
               .replace(/\s+/g, ' ').trim();
    }
    return res;
  };
}

window.V58 = {
  version: '5.8.1',
  addAffinity: addNpcAffinity,
  getAffinity: getNpcAffinity,
  updateHUD: updateV58HUD,
  openTextSaveModal: openTextSaveModal,
  rollbackSaveBackup: rollbackSaveBackup,
  reviewReadScene: reviewReadScene,
  startDailyChallenge: startDailyChallenge,
  shuffleStations: function(arr){
    var info = getTodaySeedInfo();
    var s = info.seed;
    for(var i = arr.length - 1; i > 0; i--){
      s = (s * 9301 + 49297) % 233280;
      var j = s % (i + 1);
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }
};


/* --- 註冊 v5.8.0 成就與啟動程序 --- */
V5.addAchievements(1, [
  {id:'ach_v58_suwan_arc', name:'巷口陽春麵之約', desc:'完成蘇晚個人支線故事弧'},
  {id:'ach_v58_zhao_arc',  name:'老兵的打火機',   desc:'完成老趙個人支線故事弧'},
  {id:'ach_v58_akai_arc',  name:'第四名真人',     desc:'完成阿凱個人支線故事弧'}
]);

V5.registerSystem('v58-complete-expansion', function(){
  registerV58StoryExpansions();
  registerV58NpcProfilesAndDialogues();
  setupV58PuzzleUpgrades();
  setupV58ItemUpgrades();
  extendV4AudioThemes();
  hookMemoirAndNotes();
  hookCoreRuntimeForV58();
  injectV58NotebookTabs();
  injectQuickContinueButton();
  setupPWAAndBatteryCare();
  upgradeI18NForV58();
});

V5.onBoot(function(){
  try{
    for(var d=1; d<=9; d++){
      if(typeof window['buildScenes'+d] === 'function') window['buildScenes'+d]();
    }
    state = stateRefs[1];
    SCENES = sceneRefs[1];
    initPartyMembersForDungeon(1);
    injectV58BottomControls();
    updateV58HUD();

    window.VERSION = '5.8.1';
    if(window.CHANGELOG && !window.CHANGELOG.some(function(c){ return c.version === '5.8.0'; })){
      window.CHANGELOG.unshift({
        version:'5.8.0',
        type:'major',
        changes:[
          '新內容擴充（1.1）：新增第七扇門《鏡像電車》（雙重敘事左右對照、HP 連動、站點隨機洗牌、15 結局、7 新 NPC、3 新謎題類型）、第八扇門《無盡自助餐》（隨機菜單、200字微型人生故事、飽食度機制、8 結局）與第九扇門 DLC《小學 1999》（教室/操場/福利社/校刊、童年選擇偏誤機制、8 結局）。',
          '現有門扉擴充（1.2）：第一至第五扇門各新增隱藏密室（鍋爐暗室、古籍修復暗室、頂樓天台溫室、守門人燈芯密室、海心珊瑚密室）、多枚真結局，以及蘇晚、老趙、阿凱 5 場景個人支線故事弧。',
          '敘事系統深化（2.1–2.3）：實裝 NPC 好感度系統（0–100）與狀態欄信任度圖示（愛心/問號/怒臉）、跨輪記憶動態台詞、回憶錄自動檔案、已讀場景全文複習，以及結局「本局回顧」。',
          '玩法機制升級（3.1–3.4）：謎題失敗改為扣血與壓力懲罰（不直接 Game Over）、卡關 3 分鐘自動提示與耗物換提示；新增物品組合配方（門禁卡+磁鐵=臨時磁感鑰匙、氧氣瓶+打火機=高壓燃燒彈）、物品品質分級（普通/稀有/傳說）、可丟棄與跨輪持久化；隊友獨立 HP 與醫療分配、低好感背叛；通用壓力值與高壓幻覺假選項。',
          '輪迴與繼承（4.1–4.3）：新增「輪迴商店」（花費記憶碎片兌換開局加成）、每輪隨機詞條（Modifier）、三階防劇透「結局圖鑑」，以及「故事／經典／地獄」三種難度模式。',
          '閱讀體驗、音訊與分享（5.1–8.2）：新增逐句淡入、TTS 語音朗讀聽書模式、回看最近 3 句、返回標題確認、手動存檔槽名稱標註、一鍵繼續上次場景、場景 SVG 水墨幾何配圖、情緒背景色微調、分路音效開關、本局命運 100 字摘要分享、文字存檔匯出匯入與 URL Hash 雲端同步、每日挑戰 Seed、真結局指引羅盤，以及英文翻譯全面修復。'
        ]
      });
    }
    if(window.CHANGELOG && !window.CHANGELOG.some(function(c){ return c.version === '5.8.1'; })){
      window.CHANGELOG.unshift({
        version:'5.8.1',
        type:'patch',
        changes:[
          '敘事顯示區全面擴展：將遊戲主視窗最大寬度由 680px 提升至 1040px（桌面端擴充逾 50% 閱讀視野），收緊上下內距，讓正文敘事區佔據畫面核心空間。',
          '房間資訊與場景插畫單行整合：將頂部房間標題欄與 SVG 水墨場景縮圖合併為 40px 緊湊單行頂欄，大幅釋放垂直閱讀高度。',
          '預設字號與全文本等比放大：預設敘事字號由 16px 提升至 20px（滑桿支援 14px–30px），對話框、旁白、環境音提示與選項按鈕全面改為 em 相對字級等比縮放。',
          '底部快捷閱讀控制：於遊戲底欄新增「A-」「A+」即時字級微調按鈕與「大屏閱讀」一鍵展開模式（隱藏頂部標題橫幅以最大化正文視窗）。'
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
  }catch(e){ console.error('v5.8 boot error:', e); }
});
})();
