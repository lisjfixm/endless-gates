
(function(){
'use strict';

window.V70 = window.V70 || {};

var LS_TAROT_ACTIVE    = 'wuxian-v70-active-tarot';
var LS_TAROT_UNLOCKED  = 'wuxian-v70-unlocked-tarot';
var LS_BOSS_CLEARED    = 'wuxian-v70-boss-gauntlet';
var LS_SYNERGY_FORGED  = 'wuxian-v70-synergy-seals';
var LS_LOGS_READ       = 'wuxian-v70-logs-read';
var LS_D14_CLEARED     = 'wuxian-fourteenth-cleared';

var SVG_SANCTUM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
var SVG_STARMAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><line x1="8.5" y1="7.5" x2="10.5" y2="15.5"/><line x1="15.5" y1="7.5" x2="13.5" y2="15.5"/><line x1="9" y1="6" x2="15" y2="6"/></svg>';
var SVG_TAROT   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M8 6h.01M16 18h.01"/></svg>';
var SVG_TOWER   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V6l6-4 6 4v16"/><path d="M2 22h20"/><path d="M10 14h4v8h-4z"/><path d="M9 9h6"/></svg>';
var SVG_ARCHIVE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';

/* ============================================================
 * 1. 徹底修復全量細微 Bug（state.inheritance 保證、Gate 1 第 24 結局補完、Gate 12/13/14 GM 列表）
 * ============================================================ */
function ensureAllStatesHaveInheritance(){
  var inh = (typeof window.loadInheritance === 'function') ? window.loadInheritance() : {};
  if(window.stateRefs){
    Object.keys(window.stateRefs).forEach(function(k){
      if(window.stateRefs[k] && !window.stateRefs[k].inheritance){
        window.stateRefs[k].inheritance = Object.assign({}, inh);
      }
    });
  }
  if(window.state && !window.state.inheritance){
    window.state.inheritance = Object.assign({}, inh);
  }
}

function injectGate1TwentyFourthEnding(){
  if(!window.sceneRefs || !window.sceneRefs[1]) return;
  var S1 = window.sceneRefs[1];
  if(!S1['d1_end_v70_architect']){
    S1['d1_end_v70_architect'] = {
      room: '03:17',
      roomName: '第 17 號觀測室 · 質數建築師',
      sceneId: '隱藏真結局',
      mood: 'hope',
      text: [
        '<p>你沒有急著推開旅館正門，也沒有與鏡像爭奪軀殼，而是取出實驗室門禁卡，對準地下室石台底部的第 17 道刻痕輕輕一劃。</p>',
        '<p>石牆上的黎曼猜想推導與哥德巴赫曲線同時亮起溫暖的鎏金微光。原來你在實驗室凌晨 03:17 觀測到的那條偏離曲線，正是這座質數旅館的空間座標。</p>',
        '<p>阿凱、老趙與蘇晚的身影在光芒中同時向你頷首。當你證明了「L（生命的意義）大於零」的那一刻，虛空不再吞噬任何房間，整座質數旅館化為通往無盡迴廊深處的第一座金質路標。</p>'
      ],
      onEnter: function(){
        if(window.state && state.flags){
          state.flags.mirror_defeated = true;
          state.flags.suwan_survived = true;
          state.flags.golden_key = true;
        }
        if(typeof saveInheritance === 'function'){
          saveInheritance({ suwan_survived: true, golden_key: true, mirror_defeated: true, basement_knowledge: true, trusted: true });
        }
        try{ localStorage.setItem('wuxian-first-cleared', 'true'); }catch(e){}
        if(window.V4 && typeof V4.markDungeonCleared === 'function') V4.markDungeonCleared(1);
        if(typeof unlockAchievement === 'function') unlockAchievement('ach_v70_prime_architect');
        setTimeout(function(){
          triggerEnding('hidden_v70_d1_architect', '質數建築師', '你以實驗室的質數曲線解開了旅館底層的第 17 號觀測命題，讓所有人平安跨越第一扇門。', '隱藏真結局 · 質數建築師');
        }, 500);
      },
      choices: []
    };
  }
  var mf = S1['mirror_final'];
  if(mf && Array.isArray(mf.choices)){
    var exists = mf.choices.some(function(c){ return c.next === 'd1_end_v70_architect'; });
    if(!exists){
      mf.choices.push({
        text: '【03:17 質數原點】以實驗室曲線重構第 17 號觀測命題（隱藏真結局）',
        next: 'd1_end_v70_architect'
      });
    }
  }
}

/* ============================================================
 * 2. 第 14 扇門・終焉大聖堂《第零號觀測室：萬門鍛造者》（18 場景 · 3 謎題 · 12 結局）
 * ============================================================ */
var D14_ACH_DEFS = [
  { id: 'ach_v70_d14_enter',     name: '重返 03:17',     desc: '踏入第十四扇門《第零號觀測室：萬門鍛造者》' },
  { id: 'ach_v70_d14_console',   name: '曲線收斂',       desc: '解開第零號觀測室的黎曼質數主控台謎題' },
  { id: 'ach_v70_d14_echoes',    name: '四重回響',       desc: '在記憶長廊與蘇晚、老趙、陳姐、門外之人的殘響全數共鳴' },
  { id: 'ach_v70_d14_forge',     name: '萬門鍛造者',     desc: '在第零號核心完成萬門星圖的最終校準' },
  { id: 'ach_v70_d14_true_dawn', name: '03:18 的咖啡香', desc: '達成第十四扇門真結局「03:18 的第一縷晨光」' },
  { id: 'ach_v70_d14_all_home',  name: '無一人遺落',     desc: '達成第十四扇門大團圓真結局「萬門同歸」' }
];

function buildScenes14(){
  var S = {};
  if(window.sceneRefs) window.sceneRefs[14] = S;
  var st = (window.stateRefs && window.stateRefs[14]) || window.state || {};

  S['d14_prologue'] = {
    room: '03:17',
    roomName: '第零號觀測室 · 實驗室夾縫',
    sceneId: '序幕',
    mapZone: '實驗室原點',
    mood: 'mystery',
    text: [
      '<p>推開第十四扇門的瞬間，預想中的無盡白牆並沒有出現。你聞到了一股極其熟悉的、微苦的冷咖啡味。</p>',
      '<p>你站在自己的大學實驗室裡。桌上擺著三本書、兩疊論文，以及那杯只剩一半的褐色咖啡。電腦螢幕右下角的時間依然停在 <strong>03:17</strong>，但螢幕中央那條曾讓你徹夜難眠的「質數分佈偏離曲線」，此刻正投射在半空中，化為十三道緩緩旋轉的黃金門扉座標。</p>',
      '<p class="system-msg">迴廊終焉低語：歡迎來到一切的起點與終點——第十四扇門《第零號觀測室》。你所走過的十三扇門，皆是由這條 03:17 腦波共鳴曲線所鍛造的意識庇護所。</p>',
      '<p>實驗室深處延伸出三條發光的迴廊：左側通往<strong>「主控演算台」</strong>，中央通往<strong>「同伴殘響長廊」</strong>，右側則是一扇刻著『03:18』的<strong>「破曉天頂門」</strong>。</p>'
    ],
    onEnter: function(){
      if(typeof unlockAchievement === 'function') unlockAchievement('ach_v70_d14_enter');
    },
    choices: [
      { text: '走向發光的電腦螢幕，檢查【主控演算台】', next: 'd14_console_hub' },
      { text: '步入中央的【同伴殘響長廊】，尋找曾並肩作戰的身影', next: 'd14_echo_gallery' },
      { text: '前往右側的【時空檔案庫】，翻閱第零號觀測紀錄', next: 'd14_archive_vault' },
      { text: '直接強行推開刻著 03:18 的【破曉天頂門】', next: 'd14_premature_gate' }
    ]
  };

  S['d14_console_hub'] = {
    room: 'CORE-01',
    roomName: '主控演算台 · 質數曲線核心',
    sceneId: '第一幕',
    mapZone: '主控演算台',
    mood: 'calm',
    text: [
      '<p>你坐在自己那張熟悉的實驗室轉椅上。螢幕上跳動著十三組質數參數：從第 1 扇門的房號「13」、第 2 扇門的杜威分類碼「510」、第 3 扇門的倒數「60」，直到第 13 扇門的七重水銀鏡。</p>',
      '<p>主控台彈出一道金色驗證框：「若要將停滯的 03:17 推進至 03:18，請輸入前四個基本質數（2、3、5、7）連綴而成的四位校準碼，或直接啟動深層邏輯重構。」</p>'
    ],
    choices: [
      {
        text: '【解謎校準】輸入前四個基本質數連綴碼（2357）',
        action: function(){
          openPuzzle('第零號演算台 · 質數原點校準', '請輸入 10 以內前四個質數（由小到大）連綴而成的 4 位數字校準碼：', '2357', function(ok){
            if(ok){
              state.flags.d14_console_calibrated = true;
              addItem('d14_prime_key', '03:18 質數原點密鑰', '由 2、3、5、7 四道質數波段凝結而成的黃金密鑰。');
              if(typeof unlockAchievement === 'function') unlockAchievement('ach_v70_d14_console');
              showToast('主控台校準完成！獲得【03:18 質數原點密鑰】');
              goToScene('d14_console_unlocked');
            } else {
              damage(15);
              showToast('校準碼錯誤，演算逆流造成 15 點精神衝擊');
            }
          });
        }
      },
      { text: '將曲線參數鎖定為「無限遞歸」（放棄返回現實，永遠留在推演中）', next: 'd14_end_bad_recursion' },
      { text: '強行拔除主機電源線，試圖以物理斷電摧毀迴廊', next: 'd14_end_bad_shortcircuit' },
      { text: '返回第零號觀測室中央', next: 'd14_prologue' }
    ]
  };

  S['d14_console_unlocked'] = {
    room: 'CORE-01',
    roomName: '主控演算台 · 收斂完畢',
    sceneId: '第一幕·突破',
    mapZone: '主控演算台',
    mood: 'hope',
    text: [
      '<p>隨著「2357」四個數字輸入，螢幕上偏離了三個晚上的質數曲線瞬間收斂成一條璀璨的黃金螺旋！</p>',
      '<p>印表機自動吐出一張溫熱的紙頁，上面印著你昏迷前最後一秒的心電波形，以及一行小字：「所有在迴廊裡相遇的人，都是被同一場凌晨 03:17 的城市磁暴捲入意識夾縫的生還者。」</p>'
    ],
    choices: [
      { text: '帶著【03:18 質數原點密鑰】前往【同伴殘響長廊】', next: 'd14_echo_gallery' },
      { text: '前往【時空檔案庫】核對磁暴生還者名單', next: 'd14_archive_vault' },
      { text: '直接前往【萬門鍛造爐】準備開啟終局之門', next: 'd14_forge_sanctum' }
    ]
  };

  S['d14_echo_gallery'] = {
    room: 'ECHO-04',
    roomName: '同伴殘響長廊',
    sceneId: '第二幕',
    mapZone: '同伴殘響長廊',
    mood: 'eerie',
    text: [
      '<p>長廊兩側懸浮著四座溫暖的光龕。光龕中分別站著你在前十三扇門中最深刻的四位同行者：</p>',
      '<p>穿著白連帽衫的<strong>蘇晚</strong>、夾著沒點燃香菸的<strong>老趙</strong>、握著保溫杯與紙飛機的<strong>陳姐與媛媛</strong>，以及那位總在門外守候的<strong>門外之人</strong>。</p>',
      '<p>蘇晚輕聲對你說：「我們每個人都被困在不同的門扉時間裡。如果你願意把我們的名字寫進最終的收斂公式，我們就能一起醒來。」</p>'
    ],
    choices: [
      {
        text: '與蘇晚、老趙、陳姐、門外之人逐一擊掌共鳴（凝聚四重羈絆）',
        action: function(){
          state.flags.d14_echoes_united = true;
          state.hp = state.maxHp || 100;
          if(typeof updateHP === 'function') updateHP();
          addItem('d14_bond_compass', '四重羈絆星盤', '銘刻著蘇晚、老趙、陳姐、媛媛與門外之人真名的星盤。');
          if(typeof unlockAchievement === 'function') unlockAchievement('ach_v70_d14_echoes');
          showToast('四重回響共鳴完成！獲得【四重羈絆星盤】且生命值完全恢復');
          goToScene('d14_forge_sanctum');
        }
      },
      { text: '只喚醒蘇晚一人，立刻從側門緊急通道撤離', next: 'd14_end_survive_suwan_duo' },
      { text: '將自己的意識分給所有殘響，獨自留在長廊替他們鎮守', next: 'd14_end_survive_sentinel' },
      { text: '前往【時空檔案庫】調查他們的真實身分', next: 'd14_archive_vault' }
    ]
  };

  S['d14_archive_vault'] = {
    room: 'ARCH-1999',
    roomName: '時空檔案庫 · 1999–2026 卷宗',
    sceneId: '第三幕',
    mapZone: '時空檔案庫',
    mood: 'mystery',
    text: [
      '<p>檔案庫的書架高聳入雲，每一格都存放著一扇門扉的原始設計圖：</p>',
      '<p>「1999 年盛夏小學的紙飛機、23:00 閉園的動物園、午夜潮汐電影院的第零號底片、還有倒計時醫院的第 14 號冰櫃……」</p>',
      '<p>檔案桌中央擺著一座雙層密碼匣，旁邊刻著提示：「開啟終極真相卷宗，需輸入『跨入黎明的分針時刻（0318）』。」</p>'
    ],
    choices: [
      {
        text: '【解開檔案密碼匣】輸入黎明分針時刻（0318）',
        action: function(){
          openPuzzle('時空檔案庫 · 破曉密碼匣', '請輸入跨越 03:17 停滯時刻、迎來第一縷晨光的 4 位時間數字：', '0318', function(ok){
            if(ok){
              state.flags.d14_archive_opened = true;
              addItem('d14_truth_ledger', '第零號觀測真名錄', '記載著全部十四扇門扉與現實世界對應座標的總名冊。');
              showToast('成功開啟破曉密碼匣！獲得【第零號觀測真名錄】');
              goToScene('d14_forge_sanctum');
            } else {
              damage(10);
              showToast('密碼錯誤，受到時空靜電反噬 (-10 HP)');
            }
          });
        }
      },
      { text: '抹除檔案庫中所有關於痛苦的記憶，只保留無憂的假象', next: 'd14_end_normal_amnesia' },
      { text: '將整座檔案庫封存並化身新的首席檔案官', next: 'd14_end_survive_archivist' },
      { text: '前往【萬門鍛造爐】核心', next: 'd14_forge_sanctum' }
    ]
  };

  S['d14_premature_gate'] = {
    room: 'GATE-0',
    roomName: '未校準的天頂門前',
    sceneId: '分支危機',
    mapZone: '萬門鍛造爐',
    mood: 'danger',
    text: [
      '<p>你在尚未完成主控台校準與同伴共鳴的情況下，強行握住了天頂門的青銅把手。</p>',
      '<p>狂暴的時空亂流從門縫傾瀉而出！未收斂的質數曲線像鋒利的琴弦般切割著空間，你必須立刻做出決斷。</p>'
    ],
    choices: [
      { text: '立刻縮回手，退回【主控演算台】進行正規校準', next: 'd14_console_hub' },
      { text: '硬著頭皮撞入未校準的時空裂隙（強行脫出）', next: 'd14_end_survive_scarred' },
      { text: '任由時空亂流將自己捲回第一扇門的起點', next: 'd14_end_bad_mobius' }
    ]
  };

  S['d14_forge_sanctum'] = {
    room: 'FORGE-14',
    roomName: '萬門鍛造爐 · 終焉審判庭',
    sceneId: '第四幕·終局抉擇',
    mapZone: '萬門鍛造爐',
    mood: 'hope',
    text: [
      '<p>你來到了第零號觀測室的最核心——<strong>萬門鍛造爐</strong>。十四道門扉的微縮星環在穹頂之上交織運轉，中央站著那個與你容貌完全相同、卻身披星辰長袍的「萬門鍛造者」。</p>',
      '<p>「你終於走到這裡了。」鍛造者微笑著向你伸出手，「當初你在實驗室倒下時，為了不讓你的意識消散，我用那條質數曲線在 03:17 的一秒鐘內展開了十四座門扉世界。現在，決定權回到你手裡了。」</p>'
    ],
    onEnter: function(){
      if(typeof unlockAchievement === 'function') unlockAchievement('ach_v70_d14_forge');
    },
    choices: [
      {
        text: '【真結局一 · 萬門同歸】同時舉起「質數密鑰」「四重羈絆星盤」與「真名錄」，帶領所有同伴返回 03:18 的現實黎明',
        condition: function(){
          return !!(state.flags.d14_console_calibrated && state.flags.d14_echoes_united && state.flags.d14_archive_opened);
        },
        next: 'd14_end_true_grand_reunion'
      },
      {
        text: '【真結局二 · 03:18 的第一縷晨光】以「03:18 質數原點密鑰」完成論文最後一行證明，在實驗室清晨醒來',
        condition: function(){
          return !!(state.flags.d14_console_calibrated);
        },
        next: 'd14_end_true_lab_dawn'
      },
      {
        text: '【真結局三 · 萬門星河領航員】接過鍛造者的星辰權杖，將無盡迴廊改造成庇護所有迷途夢境者的溫柔星空',
        condition: function(){
          return !!(state.flags.d14_echoes_united || state.flags.d14_archive_opened);
        },
        next: 'd14_end_true_star_navigator'
      },
      {
        text: '【真結局四 · 破壁執筆人】走出實驗室與螢幕之外，在手札最後一頁簽下自己的名字',
        next: 'd14_end_true_author'
      },
      {
        text: '【普通結局 · 獨醒之晨】不攜帶任何迴廊記憶，獨自一人推門回到現實病房',
        next: 'd14_end_normal_solo_wake'
      },
      {
        text: '【壞結局 · 零號標本】拒絕做出選擇，化為第零號觀測室裡永恆靜止的琥珀雕像',
        next: 'd14_end_bad_amber'
      }
    ]
  };

  function makeD14EndingScene(sid, endType, endTitle, endDesc, endReward, achId){
    S[sid] = {
      room: '03:18',
      roomName: endTitle,
      sceneId: '終章',
      mapZone: '萬門鍛造爐',
      mood: endType.indexOf('bad') === 0 ? 'danger' : 'hope',
      text: [
        '<p>' + endDesc + '</p>',
        '<p class="system-msg">第十四扇門《第零號觀測室》終局記錄：' + endTitle + '</p>'
      ],
      onEnter: function(){
        if(endType.indexOf('bad') !== 0){
          try{ localStorage.setItem(LS_D14_CLEARED, 'true'); }catch(e){}
          if(window.V4 && typeof V4.markDungeonCleared === 'function') V4.markDungeonCleared(14);
        }
        if(achId && typeof unlockAchievement === 'function') unlockAchievement(achId);
        setTimeout(function(){
          triggerEnding(endType, endTitle, endDesc, endReward);
        }, 450);
      },
      choices: []
    };
  }

  makeD14EndingScene('d14_end_true_grand_reunion', 'hidden_d14_grand_reunion', '萬門同歸 · 破曉重逢',
    '當三件原點信物在鍛造爐中央共鳴，電腦螢幕右下角的時間終於跳過了 03:17，定格在溫暖的 03:18。實驗室的門被推開，晨光灑滿走廊——蘇晚、老趙、陳姐與帶著笑容的媛媛就站在晨曦裡等你。這一次，沒有任何一個人被留在門後。',
    '真結局 · 萬門同歸', 'ach_v70_d14_all_home');

  makeD14EndingScene('d14_end_true_lab_dawn', 'hidden_d14_lab_dawn', '03:18 的第一縷晨光',
    '你在實驗室的鍵盤上敲下最後一行收斂證明。窗外東方泛起魚肚白，桌上那杯半涼的咖啡旁多了一枚金色的質數書籤。你伸了個懶腰，帶著十四扇門淬鍊出的堅定意志走向黎明。',
    '真結局 · 破曉證明者', 'ach_v70_d14_true_dawn');

  makeD14EndingScene('d14_end_true_star_navigator', 'hidden_d14_star_navigator', '萬門星河領航員',
    '你改寫了無盡迴廊的底層法則：所有致命的虛空與倒計時都被轉化為溫柔的試煉星軌。你成為第零號觀測室的新任領航員，為每一位在黑夜裡迷路的旅人點亮歸途。',
    '真結局 · 星河領航員', null);

  makeD14EndingScene('d14_end_true_author', 'hidden_d14_author', '破壁執筆人 · 故事之外',
    '你合上旅人手札，發現整座第零號觀測室就是你親手書寫的長篇史詩。當你在扉頁簽下真名時，十四扇門化作漫天金粉，成為你靈魂中最閃耀的勳章。',
    '真結局 · 破壁執筆人', null);

  makeD14EndingScene('d14_end_survive_suwan_duo', 'survive_d14_suwan_duo', '雙人晨曦 · 街角重逢',
    '你緊握著蘇晚的手從觀測室側門躍出。清晨的街道微涼，她在街角的陽春麵攤前轉過身，對你露出了不再恐懼的微笑。',
    '逃過結局 · 雙人晨曦', null);

  makeD14EndingScene('d14_end_survive_sentinel', 'survive_d14_sentinel', '第零號守望者',
    '你將生的機會全數推給了長廊裡的同伴，自己坐在主控台前維持著通道穩定。每當現實世界下起雨，他們都會想起那個留在 03:17 替所有人撐傘的人。',
    '逃過結局 · 第零號守望者', null);

  makeD14EndingScene('d14_end_survive_archivist', 'survive_d14_archivist', '永恆檔案官',
    '你留在時空檔案庫中整理著千萬旅人的記憶卷宗。雖然未能回到原來的早晨，但你的存在讓每一段被遺忘的人生都得到了妥善安放。',
    '逃過結局 · 永恆檔案官', null);

  makeD14EndingScene('d14_end_survive_scarred', 'survive_d14_scarred', '裂隙生還者',
    '你頂著時空亂流的擦傷強行衝出了未校準的天頂門。你在醫院病床上醒來，雖然失去了部分門扉記憶，但掌心仍緊握著半截實驗室門禁卡。',
    '逃過結局 · 裂隙生還者', null);

  makeD14EndingScene('d14_end_normal_amnesia', 'normal_d14_amnesia', '無夢之晨',
    '你抹去了迴廊裡所有的驚險記憶，像做了一場無痕的長夢般在實驗室桌上醒來。陽光很暖，你卻總覺得心裡空了一小塊。',
    '普通結局 · 無夢之晨', null);

  makeD14EndingScene('d14_end_normal_solo_wake', 'normal_d14_solo_wake', '獨醒之晨',
    '你獨自推開天頂門回到現實世界。03:18 的鬧鐘準時響起，你安全地活了下來，只是偶爾經過旅館或圖書館時會莫名駐足。',
    '普通結局 · 獨醒之晨', null);

  makeD14EndingScene('d14_end_bad_recursion', 'bad_d14_recursion', '無限遞歸之囚',
    '你將質數曲線設為無限遞歸。03:17 的最後一秒被無限拉長，你的意識永遠困在推演公式的死循環裡。',
    '壞結局 · 無限遞歸', null);

  makeD14EndingScene('d14_end_bad_shortcircuit', 'bad_d14_shortcircuit', '觀測崩塌 · 斷電虛空',
    '拔除電源的瞬間，尚未收斂的十四座門扉空間同時向內坍縮，將第零號觀測室化為一片純白的靜電雜訊。',
    '壞結局 · 觀測崩塌', null);

  makeD14EndingScene('d14_end_bad_mobius', 'bad_d14_mobius', '莫比烏斯起點',
    '時空亂流將你拋回了一條純白走廊。正前方，一扇寫著「13」的木門緩緩長出——你忘記了一切，再次邁進了質數旅館。',
    '壞結局 · 莫比烏斯起點', null);

  makeD14EndingScene('d14_end_bad_amber', 'bad_d14_amber', '第零號琥珀標本',
    '你遲遲無法在鍛造爐前做出抉擇，凝滯的時間結晶順著腳踝蔓延全身，將你化為觀測室中央永恆的雕像。',
    '壞結局 · 第零號琥珀', null);

  return S;
}

function registerDungeon14ZeroObservatory(){
  window.buildScenes14 = buildScenes14;
  var d14Def = {
    id: 14,
    name: '第零號觀測室',
    index: '第 十 四 扇 門',
    bgNum: '03:18',
    roomNum: '03:18',
    subText: '無 盡 迴 廊 · 第 十 四 扇 門（終焉大聖堂）',
    ruleText: '將 03:17 的偏離曲線收斂至 03:18 的破曉',
    tagline: '一切始於凌晨 03:17 的實驗室質數曲線，也將在此迎來 03:18 的最終證明。匯聚十三扇門的記憶與羈絆，鍛造通往真實黎明的第零號門扉。',
    clearedKey: LS_D14_CLEARED,
    savePrefix: 'zero-observatory-save',
    startScene: 'd14_prologue',
    totalEndings: 14,
    hasParty: false,
    hasCountdown: false,
    hasAdmin: false,
    achDefs: D14_ACH_DEFS.slice(),
    stateInit: function(){
      var inh = (typeof window.loadInheritance === 'function') ? window.loadInheritance() : {};
      return {
        dungeonId: 14,
        currentScene: 'd14_prologue',
        hp: 100,
        maxHp: 100,
        stress: 0,
        inventory: [],
        flags: {},
        notes: ['【第零號觀測室】主控台校準碼為 10 以內前四個質數（2357），時空檔案庫破曉時刻為 0318。'],
        history: [],
        inheritance: Object.assign({}, inh),
        personality: { calm: 50, altruism: 50, cautious: 50 },
        mapZones: [
          { id: '實驗室原點', name: '實驗室原點', explored: true, current: true },
          { id: '主控演算台', name: '主控演算台', explored: false, current: false },
          { id: '同伴殘響長廊', name: '同伴殘響長廊', explored: false, current: false },
          { id: '時空檔案庫', name: '時空檔案庫', explored: false, current: false },
          { id: '萬門鍛造爐', name: '萬門鍛造爐', explored: false, current: false }
        ]
      };
    }
  };

  if(window.V5 && typeof V5.registerDungeon === 'function'){
    V5.registerDungeon(d14Def);
  }
  if(!window.stateRefs) window.stateRefs = {};
  if(!window.sceneRefs) window.sceneRefs = {};
  window.stateRefs[14] = d14Def.stateInit();
  window.sceneRefs[14] = {};
  buildScenes14();

  if(window.DUNGEON_CONFIG){
    window.DUNGEON_CONFIG[14] = {
      savePrefix: d14Def.savePrefix,
      dungeonId: '14',
      totalEndings: d14Def.totalEndings,
      startScene: d14Def.startScene,
      roomNum: d14Def.roomNum,
      dungeonName: d14Def.name,
      subText: d14Def.subText,
      ruleText: d14Def.ruleText,
      hasParty: false,
      hasCountdown: false,
      hasAdmin: false,
      achDefs: D14_ACH_DEFS.slice()
    };
  }
  if(window.ENDING_TOTALS){
    window.ENDING_TOTALS[14] = d14Def.totalEndings;
  }
  if(Array.isArray(window.dungeons) && !window.dungeons.some(function(d){ return d.id === 14; })){
    window.dungeons.push({
      id: 14,
      name: d14Def.name,
      index: d14Def.index,
      bgNum: d14Def.bgNum,
      tagline: d14Def.tagline,
      clearedKey: d14Def.clearedKey
    });
  }

  /* 為 V63、V64 補齊第 14 扇門專屬過場圖騰、環境凝視、守門人謎題與奇遇 */
  if(window.V63 && window.V63.GATE_EMBLEMS){
    window.V63.GATE_EMBLEMS[14] = {
      subtitle: '03:17 實驗室原點 · 跨越十三重門扉的 03:18 破曉證明',
      svg: '<svg viewBox="0 0 120 120" fill="none" stroke="#f5df98" stroke-width="1.8">' +
        '<circle cx="60" cy="60" r="50" stroke-dasharray="5 3" class="v63-svg-spin"/>' +
        '<circle cx="60" cy="60" r="36" stroke="#7dd3fc" stroke-opacity="0.75"/>' +
        '<polygon points="60,12 73,44 108,44 80,64 90,98 60,78 30,98 40,64 12,44 47,44" stroke="#f5df98" fill="rgba(212,175,55,0.12)" class="v63-svg-pulse"/>' +
        '<circle cx="60" cy="60" r="8" fill="#f5df98"/>' +
      '</svg>'
    };
  }
  if(window.V64){
    if(V64.GATE_ENV_DETAILS){
      V64.GATE_ENV_DETAILS[14] = [
        { id: 'g14_1', title: '實驗室半乾的褐色咖啡杯', text: '杯底沉澱的咖啡漬構成了一圈微縮星圖，旁邊便籤寫著：「2、3、5、7 是喚醒主控台的初始質數。」' },
        { id: 'g14_2', title: '螢幕右下角閃爍的 03:17', text: '仔細凝視像素邊緣，可見「7」的尾端正在向「8」緩緩過渡——破曉密碼正是 0318。' },
        { id: 'g14_3', title: '導師留下的紅筆批註手稿', text: '手稿扉頁寫著：「即使證明過程跨越千百個夜晚，只要不放棄同伴與求真之心，曲線終將收斂於黎明。」' }
      ];
    }
    if(V64.GATE_RIDDLES){
      V64.GATE_RIDDLES[14] = {
        q: '【第零號觀測室之謎】如何將停滯於 03:17 的實驗室質數曲線推進至真正的 03:18 黎明？',
        opts: [
          '拔掉實驗室主機電源強行關機',
          '集齊主控台 2357 質數密鑰、四重同伴羈絆星盤與 0318 檔案真名錄，於鍛造爐完成最終收斂',
          '將自己鎖在無限遞歸的公式裡永不醒來'
        ],
        ans: 1,
        hint: '唯有同時完成理性校準（2357）、同伴羈絆共鳴與真實記憶歸檔（0318），方能達成萬門同歸的真結局。'
      };
    }
    if(V64.GATE_ANOMALY_EVENTS){
      V64.GATE_ANOMALY_EVENTS[14] = {
        title: '【03:18 晨曦窗邊的未來自己】',
        desc: '推開半扇窗的未來自己向你遞來一杯剛沖好的熱咖啡：「辛苦了，把最後這一步走完，我們就能一起迎接早晨了。」',
        choices: [
          { label: '飲下破曉熱咖啡【HP 全滿 · 最大生命 +25 HP · 壓力完全清空】', act: function(){ if(window.state){ state.maxHp=(state.maxHp||100)+25; state.hp=state.maxHp; updateHP(); } if(window.addStress) addStress(-100); return '溫熱的咖啡香瞬間驅散了所有疲憊（最大生命 +25 HP，生命全滿，壓力歸零）！'; } },
          { label: '收下未來自己遞來的質數金筆【記憶碎片 +3 · HP +30】', act: function(){ if(window.addMemoryShards) addMemoryShards(3); if(window.state){ state.hp=Math.min(state.maxHp||100,(state.hp||100)+30); updateHP(); } return '金筆在手札上自動簽下了破曉印記（記憶碎片 +3，HP +30）！'; } }
        ]
      };
    }
  }
}

/* ============================================================
 * 3. v7.0 超豐富可玩性系統一：14 大阿爾卡納「命運塔羅占卜」（Corridor Tarot Divination）
 * ============================================================ */
var CORRIDOR_TAROT_CARDS = [
  { id: 'tarot_0_fool',       arcana: '0 · 愚者之門',     bonusName: '初生無畏', desc: '踏入任何未探索分支時自動恢復 +6 HP，且完全免疫第一次陷阱傷害。', hpBonus: 10, unvisitedHeal: 6 },
  { id: 'tarot_1_magician',   arcana: 'I · 質數魔術師',   bonusName: '萬法歸質', desc: '破解密碼鎖或守門人謎題時額外獲得 +2 枚記憶碎片並恢復 15 HP。', hpBonus: 10, puzzleShard: 2 },
  { id: 'tarot_2_priestess',  arcana: 'II · 靜默女祭司',  bonusName: '書海無聲', desc: '精神壓力累積速度降低 40%，且每次環境凝視額外恢復 +8 HP。', hpBonus: 12, stressMult: 0.6 },
  { id: 'tarot_3_empress',    arcana: 'III · 豐饒女皇',   bonusName: '生命湧泉', desc: '入局最大生命上限與當前生命值直接提升 +35 HP。', hpBonus: 35 },
  { id: 'tarot_4_emperor',    arcana: 'IV · 黑曜皇帝',    bonusName: '秩序鐵壁', desc: '入局獲得 25 點黑曜護盾，受到的所有直接傷害固定減免 3 點。', hpBonus: 15, shield: 25, flatRed: 3 },
  { id: 'tarot_6_lovers',     arcana: 'VI · 雙生戀人',    bonusName: '同行羈絆', desc: '所有同伴初始健康與信任度提升，且每幕自動為全隊恢復 +5 HP。', hpBonus: 18, sceneHeal: 5 },
  { id: 'tarot_7_chariot',    arcana: 'VII · 鏡像戰車',   bonusName: '破鏡突進', desc: '遭遇戰對敵人造成的道具與弱點傷害提升 35%，並免疫鏡像反噬。', hpBonus: 15, combatBoost: 1.35 },
  { id: 'tarot_8_justice',    arcana: 'VIII · 真名正義',  bonusName: '因果均衡', desc: '每簽署 1 項試煉契約，額外提供 +8 HP 與 +5 點護盾。', hpBonus: 12, contractScale: 8 },
  { id: 'tarot_9_hermit',     arcana: 'IX · 提燈隱者',    bonusName: '第13盞燈', desc: '自動於選項旁高亮標示關鍵因果路徑，且時空回溯不消耗任何代價。', hpBonus: 12, freeRewind: true },
  { id: 'tarot_10_wheel',     arcana: 'X · 命運之輪',     bonusName: '輪迴饋贈', desc: '達成任意結局時獲得的記憶碎片數量 +3，且奇遇事件雙倍收益。', hpBonus: 15, endShards: 3 },
  { id: 'tarot_12_hanged',    arcana: 'XII · 逆時倒吊人', bonusName: '時間反轉', desc: '限時門扉初始倒計時延長 +25 秒，生命低於 50% 時自動獲得護盾。', hpBonus: 15, cdBonus: 25 },
  { id: 'tarot_13_death',     arcana: 'XIII · 破曉死神',  bonusName: '向死而生', desc: '提供 1 次「破曉涅槃」：受到致命傷害時恢復至 50 HP 並獲贈 2 枚碎片。', hpBonus: 10, phoenix: true },
  { id: 'tarot_17_star',      arcana: 'XVII · 觀測之星',  bonusName: '群星指引', desc: '萬門星圖解鎖全節點預覽，且每次跨房間移動自動降低 5% 壓力。', hpBonus: 18, moveCalm: 5 },
  { id: 'tarot_21_world',     arcana: 'XXI · 萬門世界',   bonusName: '萬門歸一', desc: '全能力共鳴：最大生命 +30 HP、護盾 +20、每幕回血 +4 HP、結局碎片 +2。', hpBonus: 30, shield: 20, sceneHeal: 4, endShards: 2 }
];

function getActiveTarotId(){
  try{ return localStorage.getItem(LS_TAROT_ACTIVE) || 'tarot_17_star'; }catch(e){ return 'tarot_17_star'; }
}
function setActiveTarotId(tid){
  try{ localStorage.setItem(LS_TAROT_ACTIVE, tid || ''); }catch(e){}
}
function getActiveTarotCard(){
  var tid = getActiveTarotId();
  return CORRIDOR_TAROT_CARDS.find(function(c){ return c.id === tid; }) || null;
}

/* ============================================================
 * 4. v7.0 超豐富可玩性系統二：6 大「雙生遺物神話共鳴聖印」（Relic Synergy Seals）
 * ============================================================ */
var RELIC_SYNERGY_SEALS = [
  { id: 'syn_chrono_mirror', name: '【時空鏡像聖印】', req: ['relic_watch', 'relic_mirror'], desc: '當同時佩掛「停擺懷錶」與「無影古鏡」時啟動：每次受到傷害額外反彈並恢復自身 +5 HP，限時倒數額外 +10 秒。' },
  { id: 'syn_abyss_guider',  name: '【深海引魂聖印】', req: ['relic_compass', 'relic_lantern'], desc: '當同時佩掛「青銅羅盤」與「冷白提燈」時啟動：踏入未探索分支的恢復量提升至 +10 HP，且自動淨化 10% 壓力。' },
  { id: 'syn_immortal_wing', name: '【白鴉不死聖印】', req: ['relic_feather', 'relic_flower'], desc: '當同時佩掛「白鴉羽」與「永夜曇花」時啟動：最大生命額外 +20 HP，且不死庇護觸發後生命值直接回滿至 60 HP。' },
  { id: 'syn_karma_express', name: '【1999 破曉列車印】', req: ['relic_ticket', 'relic_scale'], desc: '當同時佩掛「雙向車票」與「真名古秤」時啟動：時空回溯時額外獲得 +15 點護盾並恢復 12 HP。' },
  { id: 'syn_cinema_prime',  name: '【409 黃金菲林印】', req: ['relic_film', 'relic_bell'], desc: '當同時佩掛「零號底片」與「質數銅鈴」時啟動：達成結局額外多獲 +3 枚記憶碎片，安全場景恢復 +12 HP。' },
  { id: 'syn_omniscient_dawn', name: '【03:18 萬門真神印】', req: ['relic_key', 'relic_prism'], desc: '當同時佩掛「萬門骨鑰」與「晨曦稜鏡」時啟動：入局護盾提升至 35 點，且所有謎題與對弈獎勵翻倍。' }
];

function getActiveSynergySeals(){
  var eq = (window.V64 && typeof V64.getEquippedRelics === 'function') ? V64.getEquippedRelics() : [];
  return RELIC_SYNERGY_SEALS.filter(function(s){
    return eq.indexOf(s.req[0]) !== -1 && eq.indexOf(s.req[1]) !== -1;
  });
}

/* ============================================================
 * 5. v7.0 超豐富可玩性系統三：「萬門試煉塔・14 守門人連戰」（Gatekeeper Boss Rush Gauntlet）
 * ============================================================ */
var GATEKEEPER_GAUNTLET = [
  { gate: 1,  name: '第 1 層 · 3號房鏡中替身',     weakness: '直指其「不懂進食與燈滅三秒死寂」的悖論', rewardShards: 2, title: '破鏡行者' },
  { gate: 2,  name: '第 2 層 · 沉默圖書館首席館長', weakness: '以無聲唇語歸還第 510 號記憶真書',       rewardShards: 2, title: '靜默知音' },
  { gate: 3,  name: '第 3 層 · 03:17 夜巡護士長',   weakness: '出示太平間第 14 格周敏的真實病歷名牌',   rewardShards: 2, title: '仁心破曉' },
  { gate: 4,  name: '第 4 層 · 第 13 盞壁燈守望者', weakness: '不向前奔跑，逆向退後一步熄滅虛妄燈火',   rewardShards: 2, title: '逆行清醒者' },
  { gate: 5,  name: '第 5 層 · 迴光深海倒影巨鯨',   weakness: '逆轉六分儀刻度，向深海寂靜燈塔定錨',     rewardShards: 3, title: '定海掌舵人' },
  { gate: 6,  name: '第 6 層 · 1999 射電星穹觀測者', weakness: '將接收頻率調諧至 03.18 兆赫晨曦波段',   rewardShards: 3, title: '群星調諧師' },
  { gate: 7,  name: '第 7 層 · 雙軌鏡像列車長',     weakness: '於隧道交會瞬間拉下雙重氣閥跨入對向車廂', rewardShards: 3, title: '雙軌破界者' },
  { gate: 8,  name: '第 8 層 · 無盡盛宴審判主廚',   weakness: '拒食虛妄紅肉，只飲映出本心的澄澈清水',   rewardShards: 3, title: '無妄清心者' },
  { gate: 9,  name: '第 9 層 · 千禧年黃昏值日生',   weakness: '歸還音樂教室與保健室封存的紙飛機膠囊',   rewardShards: 3, title: '千禧守約人' },
  { gate: 10, name: '第 10 層 · 午夜四廳老放映師',  weakness: '逆著銀幕潮水走向放映孔，以古銅幣定住膠卷', rewardShards: 4, title: '終章剪輯師' },
  { gate: 11, name: '第 11 層 · 23:00 百獸巡園長',  weakness: '以溫室夜光曇花粉喚醒巡園人並守住訪客徽章', rewardShards: 4, title: '百獸守夜人' },
  { gate: 12, name: '第 12 層 · 第零層回聲升降官',  weakness: '無視三秒前回聲，輸入開關門摩斯密碼直達中樞', rewardShards: 4, title: '回聲主宰' },
  { gate: 13, name: '第 13 層 · 七重水銀萬鏡之主',  weakness: '融合十二門記憶碎片，直視無倒影之鏡的本心', rewardShards: 5, title: '萬鏡歸一者' },
  { gate: 14, name: '第 14 層 · 03:17 萬門鍛造者',  weakness: '以 2357 質數原點與四重同伴羈絆收斂 03:18 曲線', rewardShards: 6, title: '萬門超越者' }
];

function getClearedBosses(){
  try{
    var raw = localStorage.getItem(LS_BOSS_CLEARED);
    var arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function markBossCleared(gateId){
  var cur = getClearedBosses();
  if(cur.indexOf(gateId) === -1){
    cur.push(gateId);
    try{ localStorage.setItem(LS_BOSS_CLEARED, JSON.stringify(cur)); }catch(e){}
    return true;
  }
  return false;
}

/* ============================================================
 * 6. v7.0 超豐富可玩性系統四：「守門人殘響密錄（14 篇真相檔案）」
 * ============================================================ */
var GATEKEEPER_SECRET_LOGS = [
  { gate: 1,  title: '密錄 #01 · 質數旅館的建立日誌', text: '「凌晨 03:17，當你的心臟在實驗室停跳的第一毫秒，大腦為了拒絕死亡，用你正在推導的質數定理搭建了第一座防禦迷宮。阿凱是你對盲目樂觀的投射，而 3、5、7 則是你求生本能鎖定的三個安全錨點。」' },
  { gate: 2,  title: '密錄 #02 · 沉默圖書館與 1987 剪報', text: '「為什麼圖書館禁止喧嘩？因為在意識搶救的最初階段，外界加護病房的儀器警報聲太吵了。館長老周與陳姐，正是同一夜在醫院走廊裡與你擦肩而過的真實靈魂。」' },
  { gate: 3,  title: '密錄 #03 · 倒計時醫院的第 14 號冰櫃', text: '「60 秒的倒計時，對應著除顫器每次充能的間隔。周敏護士與林醫生並非幻影，他們曾是這間醫院最盡責的醫護者，在無數次時間重置中守護著小女孩媛媛的最後一縷記憶。」' },
  { gate: 4,  title: '密錄 #04 · 無盡之間與第 13 盞壁燈', text: '「當旅人走過前三扇門，意識開始察覺自己身處迴廊。無盡之間的『向後退一步』，其實是教導靈魂不要被無止境的焦慮推著狂奔，停下來回望本心，出口自現。」' },
  { gate: 5,  title: '密錄 #05 · 迴光之海的潮汐定律', text: '「每一滴海水都是旅人『如果當初選了另一條路』的遺憾。漲潮與退潮代表意識的呼吸，而海底最深處的燈塔，正是你在實驗室桌上那盞從未熄滅的檯燈。」' },
  { gate: 6,  title: '密錄 #06 · 終焉觀測站的 03.18 兆赫', text: '「觀測站的射電天線接收到的不是外星訊號，而是蘇晚與現實世界的人們呼喚你醒來的聲音。只要將頻率調諧至 03:18，長夜就會結束。」' },
  { gate: 7,  title: '密錄 #07 · 鏡像電車的雙向車票', text: '「左車廂載著渴望前進的你，右車廂載著留戀過去的你。當兩個車廂在隧道中央合而為一，分裂的潛意識才真正完成了自我和解。」' },
  { gate: 8,  title: '密錄 #08 · 無盡自助餐的古秤真意', text: '「盛宴上的佳餚象徵著誘惑人忘卻現實的虛假甜夢。唯有拒絕遺忘、只飲映出自己雙眼的清水，靈魂的重量才不會在古秤上失衡。」' },
  { gate: 9,  title: '密錄 #09 · 小學 1999 的紙飛機', text: '「那是你記憶裡最無憂無慮的一個夏天。十二歲的自己把紙飛機擲向未來，只為了在二十多年後的那個凌晨，提醒倒在實驗室地板上的你：別忘了我們曾經多麼期待長大。」' },
  { gate: 10, title: '密錄 #10 · 潮汐電影院的第零號底片', text: '「四座影廳放映著人生的喜怒哀樂。當你不再作為被動的觀眾流淚，而是走進放映室親手剪接底片時，你便奪回了命運的導演權。」' },
  { gate: 11, title: '密錄 #11 · 動物園 23:00 的夜光曇花', text: '「籠內與籠外的對調，拷問著人在極端恐懼下是否還能守住溫柔與信諾。那朵永不凋謝的曇花，是所有同伴對你信任的結晶。」' },
  { gate: 12, title: '密錄 #12 · 回聲電梯的十二重平行樓層', text: '「每一層樓都是一個『沒有遺憾的平行世界』。走遍十二層卻依然選擇按下第零層的人，才擁有直面真實人生的勇氣。」' },
  { gate: 13, title: '密錄 #13 · 鏡子迷宮與無倒影之鏡', text: '「當七面平行世界之鏡全數照亮，中央的無倒影之鏡不再映出虛像，因為你已經看清了自己是誰。」' },
  { gate: 14, title: '密錄 #14 · 第零號觀測室與 03:18 的黎明', text: '「第十四扇門不是牢籠，而是將前十三扇門的勇氣、理性與羈絆鍛造成鑰匙的聖堂。當 03:17 跳向 03:18，無盡之門將永遠作為你心底的星辰圖書館而存在。」' }
];

/* ============================================================
 * 7. 即時 SVG 萬門星圖繪製器（Interactive Constellation Map）
 * ============================================================ */
function buildInteractiveStarMapHTML(){
  var did = parseInt(window.currentDungeonId || 1, 10);
  if(window.V61 && typeof V61.ensureDungeonLoaded === 'function') V61.ensureDungeonLoaded(did);
  var scMap = (window.sceneRefs && window.sceneRefs[did]) || window.SCENES || {};
  var keys = Object.keys(scMap);
  var curKey = (window.state && state.currentScene) || (window.DUNGEON_CONFIG && DUNGEON_CONFIG[did] && DUNGEON_CONFIG[did].startScene) || keys[0] || 'prelude';

  /* 以 BFS 分層排列當前門扉的場景節點（最多取前 18 個核心節點保持星圖清爽易讀） */
  var startKey = (window.DUNGEON_CONFIG && DUNGEON_CONFIG[did] && DUNGEON_CONFIG[did].startScene) || keys[0] || 'prelude';
  if(!scMap[startKey] && keys.length) startKey = keys[0];

  var levels = {};
  var order = [];
  var edges = [];
  var queue = [{ k: startKey, lv: 0 }];
  levels[startKey] = 0;

  while(queue.length > 0 && order.length < 18){
    var item = queue.shift();
    var k = item.k;
    if(order.indexOf(k) !== -1) continue;
    order.push(k);
    var sc = scMap[k];
    if(!sc) continue;
    var chs = (typeof sc.choices === 'function') ? (sc.choices(window.state) || []) : (sc.choices || []);
    chs.forEach(function(c){
      var tk = c.next;
      if(!tk && c.action){
        var m = String(c.action).match(/goToScene\(\s*['"]([^'"]+)['"]\s*\)/);
        if(m) tk = m[1];
      }
      if(tk && scMap[tk]){
        edges.push({ from: k, to: tk });
        if(levels[tk] === undefined && order.length + queue.length < 22){
          levels[tk] = item.lv + 1;
          queue.push({ k: tk, lv: item.lv + 1 });
        }
      }
    });
  }
  if(curKey && scMap[curKey] && order.indexOf(curKey) === -1 && order.length < 19){
    levels[curKey] = 3;
    order.push(curKey);
  }

  /* 計算每個節點的 (x, y) 座標 */
  var byLv = {};
  var maxLv = 0;
  order.forEach(function(k){
    var lv = levels[k] || 0;
    if(lv > maxLv) maxLv = lv;
    if(!byLv[lv]) byLv[lv] = [];
    byLv[lv].push(k);
  });

  var coords = {};
  var W = 680, H = 300;
  var colCount = Math.max(1, maxLv + 1);
  Object.keys(byLv).forEach(function(lvStr){
    var lv = parseInt(lvStr, 10);
    var arr = byLv[lv];
    var x = colCount === 1 ? W / 2 : (65 + (lv / (colCount - 1)) * (W - 130));
    arr.forEach(function(k, idx){
      var y = (H / (arr.length + 1)) * (idx + 1);
      coords[k] = { x: Math.round(x), y: Math.round(y) };
    });
  });

  var svgLines = edges.map(function(e){
    var p1 = coords[e.from], p2 = coords[e.to];
    if(!p1 || !p2) return '';
    return '<line x1="' + p1.x + '" y1="' + p1.y + '" x2="' + p2.x + '" y2="' + p2.y + '" stroke="rgba(212,175,55,0.35)" stroke-width="1.5" stroke-dasharray="4 3"/>';
  }).join('');

  var svgNodes = order.map(function(k){
    var p = coords[k];
    if(!p) return '';
    var sc = scMap[k] || {};
    var sid = sc.sceneId || k;
    var isCur = (k === curKey);
    var isVis = isCur || (typeof window.isSceneRead === 'function' && (window.isSceneRead(sid) || window.isSceneRead(k)));
    var fill = isCur ? '#38bdf8' : (isVis ? '#d4af37' : '#1e293b');
    var stroke = isCur ? '#bae6fd' : (isVis ? '#f5df98' : '#64748b');
    var r = isCur ? 11 : (isVis ? 8.5 : 7);
    var rawName = String(sc.roomName || k).replace(/[<>&"]/g, '');
    var shortName = rawName.length > 8 ? rawName.slice(0, 8) + '…' : rawName;
    return '<g class="v70-star-node" data-v70-star-scene="' + k + '" data-v70-star-visited="' + (isVis ? '1' : '0') + '">' +
      (isCur ? '<circle cx="' + p.x + '" cy="' + p.y + '" r="17" fill="none" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="3 2"/>' : '') +
      '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.8"/>' +
      '<text x="' + p.x + '" y="' + (p.y + 21) + '" text-anchor="middle" fill="' + (isCur ? '#7dd3fc' : (isVis ? '#f5df98' : '#94a3b8')) + '" font-size="10.5" font-family="serif">' + shortName + '</text>' +
    '</g>';
  }).join('');

  var dName = (window.DUNGEON_CONFIG && DUNGEON_CONFIG[did] && DUNGEON_CONFIG[did].dungeonName) || ('第 ' + did + ' 扇門');

  return '<div class="v64-panel-box">' +
    '<div class="v64-box-title">' +
      '<span>' + SVG_STARMAP + ' 第 ' + did + ' 扇門《' + dName + '》即時因果拓撲星圖</span>' +
      '<span style="font-size:.69rem;color:var(--text-dim)">藍核：當前位置 · 金星：已踏足（點擊可直接躍遷） · 灰星：未探分支</span>' +
    '</div>' +
    '<div class="v70-starmap-wrap">' +
      '<svg class="v70-starmap-svg" viewBox="0 0 ' + W + ' ' + H + '">' +
        svgLines +
        svgNodes +
      '</svg>' +
    '</div>' +
  '</div>';
}

/* ============================================================
 * 8. 「v7.0 萬象聖所樞紐（Unified Sanctum Command Center）」一站式互動面板
 * ============================================================ */
var _sanctumTab = 'starmap';

function openSanctumModal(defaultTab){
  if(defaultTab) _sanctumTab = defaultTab;
  var modal = document.getElementById('v70-sanctum-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v70-sanctum-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  var activeTarot = getActiveTarotCard();
  var clearedBosses = getClearedBosses();
  var activeSynergies = getActiveSynergySeals();
  var curShards = (typeof window.getMemoryShards === 'function') ? window.getMemoryShards() : 0;

  var tabBarHtml =
    '<div class="v70-sanctum-nav">' +
      '<button type="button" class="v70-sanctum-tab ' + (_sanctumTab === 'starmap' ? 'on' : '') + '" data-v70-stab="starmap">' + SVG_STARMAP + '<span>萬門星圖與雷達</span></button>' +
      '<button type="button" class="v70-sanctum-tab ' + (_sanctumTab === 'tarot' ? 'on' : '') + '" data-v70-stab="tarot">' + SVG_TAROT + '<span>14 大阿爾卡納占卜</span></button>' +
      '<button type="button" class="v70-sanctum-tab ' + (_sanctumTab === 'gauntlet' ? 'on' : '') + '" data-v70-stab="gauntlet">' + SVG_TOWER + '<span>守門人試煉塔（' + clearedBosses.length + '/14）</span></button>' +
      '<button type="button" class="v70-sanctum-tab ' + (_sanctumTab === 'synergy' ? 'on' : '') + '" data-v70-stab="synergy">' + SVG_SANCTUM + '<span>遺物共鳴與契約</span></button>' +
      '<button type="button" class="v70-sanctum-tab ' + (_sanctumTab === 'logs' ? 'on' : '') + '" data-v70-stab="logs">' + SVG_ARCHIVE + '<span>守門人密錄（14篇）</span></button>' +
    '</div>';

  var contentHtml = '';

  if(_sanctumTab === 'starmap'){
    contentHtml = buildInteractiveStarMapHTML() +
      '<div style="display:flex;gap:.45rem;flex-wrap:wrap;margin-top:.55rem">' +
        '<button type="button" class="v4-btn primary" id="v70-goto-d14-btn">▸ 直接踏入第 14 扇門《第零號觀測室》</button>' +
        '<button type="button" class="v4-btn" id="v70-open-radar-btn">開啟現場環境凝視與守門人對弈</button>' +
        '<button type="button" class="v4-btn" id="v70-open-chrono-btn">開啟時空錨點與 25 步回溯</button>' +
        '<button type="button" class="v4-btn" id="v70-open-theater-btn">開啟 14 扇門 3D 推門過場劇場</button>' +
      '</div>';
  } else if(_sanctumTab === 'tarot'){
    var tarotCardsHtml = CORRIDOR_TAROT_CARDS.map(function(c){
      var isOn = (activeTarot && activeTarot.id === c.id);
      return '<div class="v70-tarot-card ' + (isOn ? 'active' : '') + '" data-v70-tarot="' + c.id + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<strong style="color:' + (isOn ? '#f5df98' : 'var(--text-bright)') + ';font-size:.81rem">' + c.arcana + '</strong>' +
          '<span class="v4-chip ' + (isOn ? 'gold' : '') + '">' + (isOn ? '庇護中 ✓' : '點擊結契') + '</span>' +
        '</div>' +
        '<div style="font-size:.7rem;color:#d4af37;font-weight:600">命運加護：' + c.bonusName + '</div>' +
        '<div style="font-size:.72rem;color:var(--text-dim);line-height:1.5">' + c.desc + '</div>' +
      '</div>';
    }).join('');

    contentHtml =
      '<div class="v64-panel-box">' +
        '<div class="v64-box-title">' +
          '<span>當前命運阿爾卡納牌陣：' + (activeTarot ? (activeTarot.arcana + ' · 【' + activeTarot.bonusName + '】') : '尚未結契') + '</span>' +
          '<button type="button" class="v4-btn primary" style="font-size:.71rem;padding:.24rem .62rem" id="v70-random-tarot-btn">隨機占卜抽牌（立即恢復 +15 HP）</button>' +
        '</div>' +
        '<div style="font-size:.74rem;color:var(--text-dim)">可隨時自由切換或隨機占卜 14 張迴廊大阿爾卡納牌，為全部 14 扇門提供被動命運加護：</div>' +
        '<div class="v70-tarot-grid">' + tarotCardsHtml + '</div>' +
      '</div>';
  } else if(_sanctumTab === 'gauntlet'){
    var bossRowsHtml = GATEKEEPER_GAUNTLET.map(function(b){
      var done = clearedBosses.indexOf(b.gate) !== -1;
      return '<div class="v70-boss-row ' + (done ? 'cleared' : '') + '">' +
        '<div style="flex:1 1 260px">' +
          '<div style="font-weight:600;color:' + (done ? '#8de0a8' : '#f5df98') + ';font-size:.81rem">' +
            b.name + (done ? (' ✓ 已擊破 · 獲封【' + b.title + '】') : '') +
          '</div>' +
          '<div style="font-size:.72rem;color:var(--text-dim);margin-top:.14rem">破局法則：' + b.weakness + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:.38rem;align-items:center">' +
          '<span class="v4-chip gold">獎勵 +' + b.rewardShards + ' 碎片</span>' +
          '<button type="button" class="v4-btn ' + (done ? '' : 'primary') + '" style="font-size:.71rem;padding:.26rem .62rem" data-v70-boss="' + b.gate + '">' +
            (done ? '再次演練 (+10 HP)' : '發起破局對決') +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    contentHtml =
      '<div class="v64-panel-box">' +
        '<div class="v64-box-title">' +
          '<span>萬門試煉塔 · 14 守門人破局連戰（已擊破 ' + clearedBosses.length + ' / 14 層）</span>' +
          '<span class="v4-chip gold">持有記憶碎片：' + curShards + ' 枚</span>' +
        '</div>' +
        '<div style="font-size:.74rem;color:var(--text-dim);margin-bottom:.5rem">以你在十四扇門中領悟的規則弱點正面迎戰各門守門人，擊破即可贏取記憶碎片、專屬榮譽稱號與生命恢復：</div>' +
        bossRowsHtml +
      '</div>';
  } else if(_sanctumTab === 'synergy'){
    var eqRelics = (window.V64 && typeof V64.getEquippedRelics === 'function') ? V64.getEquippedRelics() : [];
    var synRows = RELIC_SYNERGY_SEALS.map(function(s){
      var active = eqRelics.indexOf(s.req[0]) !== -1 && eqRelics.indexOf(s.req[1]) !== -1;
      return '<div class="v70-boss-row ' + (active ? 'cleared' : '') + '">' +
        '<div style="flex:1 1 260px">' +
          '<div style="font-weight:600;color:' + (active ? '#8de0a8' : '#f5df98') + ';font-size:.81rem">' +
            s.name + (active ? ' ✓ 共鳴啟動中' : '（未啟動）') +
          '</div>' +
          '<div style="font-size:.73rem;color:var(--text-bright);margin-top:.15rem">' + s.desc + '</div>' +
        '</div>' +
        '<button type="button" class="v4-btn ' + (active ? '' : 'primary') + '" style="font-size:.71rem;padding:.26rem .62rem" data-v70-equip-pair="' + s.req.join(',') + '">' +
          (active ? '已佩掛此組合 ✓' : '一鍵配裝此雙生遺物') +
        '</button>' +
      '</div>';
    }).join('');

    contentHtml =
      '<div class="v64-panel-box">' +
        '<div class="v64-box-title">' +
          '<span>6 大雙生遺物神話共鳴聖印（當前啟動：' + activeSynergies.length + ' 組）</span>' +
          '<button type="button" class="v4-btn primary" style="font-size:.71rem;padding:.24rem .6rem" id="v70-open-v64-contracts">開啟 12 古遺物與 8 試煉契約完整面板</button>' +
        '</div>' +
        '<div style="font-size:.74rem;color:var(--text-dim);margin-bottom:.5rem">點擊下方任一神話共鳴組合即可一鍵佩掛對應的兩件古遺物，立即觸發跨門扉共鳴特效：</div>' +
        synRows +
      '</div>';
  } else if(_sanctumTab === 'logs'){
    var logRows = GATEKEEPER_SECRET_LOGS.map(function(l){
      return '<div class="v64-panel-box" style="margin-bottom:.5rem">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.25rem">' +
          '<strong style="color:#f5df98;font-size:.8rem">• ' + l.title + '</strong>' +
          '<span class="v4-chip gold">第 ' + l.gate + ' 扇門真相</span>' +
        '</div>' +
        '<div style="font-size:.75rem;color:var(--text-bright);line-height:1.65">' + l.text + '</div>' +
      '</div>';
    }).join('');

    contentHtml =
      '<div>' +
        '<div style="font-size:.75rem;color:var(--text-dim);margin-bottom:.55rem">完整收錄貫穿《無盡之門》第 1 至第 14 扇門的底層世界觀真相檔案：</div>' +
        logRows +
      '</div>';
  }

  modal.innerHTML =
    '<div class="modal-card v4-card wide" style="max-width:740px;border-color:#d4af37">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap">' +
        '<h3 style="margin:0;color:#f5df98;display:flex;align-items:center;gap:.45rem">' + SVG_SANCTUM + ' <span>v7.0 萬象聖所樞紐 · 無盡迴廊中樞</span></h3>' +
        '<div style="display:flex;gap:.35rem;align-items:center;flex-wrap:wrap">' +
          '<span class="v4-chip gold">占卜：' + (activeTarot ? activeTarot.bonusName : '無') + '</span>' +
          '<span class="v4-chip gold">共鳴：' + activeSynergies.length + ' 聖印</span>' +
          '<span class="v4-chip gold">試煉塔：' + clearedBosses.length + '/14</span>' +
        '</div>' +
      '</div>' +
      tabBarHtml +
      '<div style="max-height:60vh;overflow-y:auto;padding-right:.2rem">' +
        contentHtml +
      '</div>' +
      '<div class="v4-actions end" style="margin-top:.75rem">' +
        '<button type="button" class="v4-btn" id="v70-toggle-zen-btn">' + (document.body.classList.contains('v70-zen-mode') ? '退出專注閱讀模式' : '開啟專注閱讀模式 (Zen)') + '</button>' +
        '<button type="button" class="v4-btn primary" onclick="document.getElementById(\'v70-sanctum-modal\').classList.remove(\'show\')">關 閉</button>' +
      '</div>' +
    '</div>';

  modal.querySelectorAll('[data-v70-stab]').forEach(function(b){
    b.onclick = function(){
      openSanctumModal(b.getAttribute('data-v70-stab'));
    };
  });

  modal.querySelectorAll('[data-v70-star-scene]').forEach(function(gEl){
    gEl.onclick = function(){
      var scKey = gEl.getAttribute('data-v70-star-scene');
      var vis = gEl.getAttribute('data-v70-star-visited') === '1';
      if(!vis && !window._gmUnlocked){
        if(typeof showToast === 'function') showToast('此分支節點尚未踏足，請先由相鄰已探索房間推進');
        return;
      }
      if(scKey && window.SCENES && window.SCENES[scKey]){
        modal.classList.remove('show');
        var gs = document.getElementById('game-screen');
        if(!gs || !gs.classList.contains('active')){
          window.enterDungeon(window.currentDungeonId || 1, true, true);
          setTimeout(function(){ window.goToScene(scKey); }, 320);
        } else {
          window.goToScene(scKey);
        }
        if(typeof showToast === 'function') showToast('【萬門星圖躍遷】已前往節點：' + (window.SCENES[scKey].roomName || scKey));
      }
    };
  });

  var d14Btn = modal.querySelector('#v70-goto-d14-btn');
  if(d14Btn){
    d14Btn.onclick = function(){
      modal.classList.remove('show');
      window.enterDungeon(14, true, true);
    };
  }
  var radBtn = modal.querySelector('#v70-open-radar-btn');
  if(radBtn){
    radBtn.onclick = function(){
      modal.classList.remove('show');
      if(window.V64 && typeof V64.openRadarModal === 'function') V64.openRadarModal();
    };
  }
  var chrBtn = modal.querySelector('#v70-open-chrono-btn');
  if(chrBtn){
    chrBtn.onclick = function(){
      modal.classList.remove('show');
      if(window.V64 && typeof V64.openChronoModal === 'function') V64.openChronoModal();
    };
  }
  var thBtn = modal.querySelector('#v70-open-theater-btn');
  if(thBtn){
    thBtn.onclick = function(){
      modal.classList.remove('show');
      if(window.V63 && typeof V63.openTransitionTheater === 'function') V63.openTransitionTheater();
    };
  }

  var rndTarotBtn = modal.querySelector('#v70-random-tarot-btn');
  if(rndTarotBtn){
    rndTarotBtn.onclick = function(){
      var pick = CORRIDOR_TAROT_CARDS[Math.floor(Math.random() * CORRIDOR_TAROT_CARDS.length)];
      setActiveTarotId(pick.id);
      if(window.state){
        state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + 15);
        if(typeof updateHP === 'function') updateHP();
      }
      if(typeof unlockAchievement === 'function') unlockAchievement('ach_v70_tarot_reader');
      if(typeof showToast === 'function') showToast('【命運占卜】抽中「' + pick.arcana + '」，獲得【' + pick.bonusName + '】加護並恢復 15 HP！');
      openSanctumModal('tarot');
    };
  }

  modal.querySelectorAll('[data-v70-tarot]').forEach(function(card){
    card.onclick = function(){
      var tid = card.getAttribute('data-v70-tarot');
      setActiveTarotId(tid);
      var tObj = getActiveTarotCard();
      if(typeof unlockAchievement === 'function') unlockAchievement('ach_v70_tarot_reader');
      if(typeof showToast === 'function' && tObj){
        showToast('已結契命運牌陣：' + tObj.arcana + '（' + tObj.bonusName + '）');
      }
      openSanctumModal('tarot');
    };
  });

  modal.querySelectorAll('[data-v70-boss]').forEach(function(btn){
    btn.onclick = function(){
      var gid = parseInt(btn.getAttribute('data-v70-boss'), 10);
      var bObj = GATEKEEPER_GAUNTLET.find(function(x){ return x.gate === gid; });
      if(!bObj) return;
      var firstTime = markBossCleared(gid);
      if(firstTime){
        if(typeof window.addMemoryShards === 'function') window.addMemoryShards(bObj.rewardShards);
        if(typeof unlockAchievement === 'function') unlockAchievement('ach_v70_tower_challenger');
        if(getClearedBosses().length >= 14 && typeof unlockAchievement === 'function'){
          unlockAchievement('ach_v70_tower_conqueror');
        }
      }
      if(window.state){
        state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + (firstTime ? 20 : 10));
        if(typeof updateHP === 'function') updateHP();
      }
      if(typeof showToast === 'function'){
        showToast(firstTime
          ? ('【試煉塔破局】擊破「' + bObj.name + '」！獲贈 +' + bObj.rewardShards + ' 記憶碎片與 +20 HP！')
          : ('【試煉演練】重溫「' + bObj.name + '」破局之法，恢復 +10 HP'));
      }
      openSanctumModal('gauntlet');
    };
  });

  modal.querySelectorAll('[data-v70-equip-pair]').forEach(function(btn){
    btn.onclick = function(){
      var pair = btn.getAttribute('data-v70-equip-pair').split(',');
      if(window.V64 && typeof V64.getEquippedRelics === 'function' && typeof V64.setEquippedRelics === 'function'){
        var cur = V64.getEquippedRelics().filter(function(r){ return pair.indexOf(r) === -1; });
        var next = pair.concat(cur).slice(0, 3);
        V64.setEquippedRelics(next);
        if(typeof unlockAchievement === 'function') unlockAchievement('ach_v70_synergy_master');
        if(typeof showToast === 'function') showToast('已配裝雙生共鳴遺物，神話共鳴聖印立即生效！');
      }
      openSanctumModal('synergy');
    };
  });

  var openV64Btn = modal.querySelector('#v70-open-v64-contracts');
  if(openV64Btn){
    openV64Btn.onclick = function(){
      modal.classList.remove('show');
      if(window.V64 && typeof V64.openTrialContractsModal === 'function') V64.openTrialContractsModal('relics');
    };
  }

  var zenBtn = modal.querySelector('#v70-toggle-zen-btn');
  if(zenBtn){
    zenBtn.onclick = function(){
      document.body.classList.toggle('v70-zen-mode');
      var isZen = document.body.classList.contains('v70-zen-mode');
      if(typeof showToast === 'function'){
        showToast(isZen ? '已開啟【專注閱讀模式】（隱藏次要狀態列）' : '已恢復標準介面顯示');
      }
      openSanctumModal(_sanctumTab);
    };
  }

  modal.classList.add('show');
}

/* ============================================================
 * 9. 升級 GM 結局清單（支援第 12、13、14 扇門完整結局列表）與手札 5 大分類過濾器
 * ============================================================ */
function upgradeGmEndingListAndNotebook(){
  if(typeof window.gmGetEndingList === 'function' && !window.gmGetEndingList.__v70){
    var _origGmList = window.gmGetEndingList;
    window.gmGetEndingList = function(){
      var did = parseInt(window.currentDungeonId || 1, 10);
      var list = _origGmList.apply(this, arguments) || [];
      if(did === 12 && list.length === 0 && window.SCENES){
        for(var f = 1; f <= 12; f++){
          var fk = 'd12_floor_' + f;
          if(SCENES[fk]){
            list.push({ id: fk, title: SCENES[fk].roomName || ('第 ' + f + ' 樓結局'), roomName: SCENES[fk].roomName || '', reward: '回聲電梯結局 #' + f });
          }
        }
      } else if(did === 13 && list.length === 0 && window.SCENES){
        for(var m = 1; m <= 7; m++){
          if(SCENES['d13_m' + m + '_trust']){
            list.push({ id: 'd13_m' + m + '_trust', title: SCENES['d13_m' + m + '_trust'].roomName || ('第 ' + m + ' 鏡信任結局'), roomName: '', reward: '信任路線' });
          }
          if(SCENES['d13_m' + m + '_shatter']){
            list.push({ id: 'd13_m' + m + '_shatter', title: SCENES['d13_m' + m + '_shatter'].roomName || ('第 ' + m + ' 鏡擊碎結局'), roomName: '', reward: '擊碎路線' });
          }
        }
        if(SCENES['d13_ending_15']){
          list.push({ id: 'd13_ending_15', title: '萬鏡歸一 · 第十五結局', roomName: '中央稜鏡', reward: '真結局' });
        }
      }
      var expected = (window.ENDING_TOTALS && ENDING_TOTALS[did]) || list.length;
      var hasDeathHp = list.some(function(x){ return x.id === 'death_hp'; });
      if(!hasDeathHp && list.length === expected - 1 && typeof window.damage === 'function'){
        list.push({ id: 'death_hp', title: '失血過多', reward: '壞結局 · 死亡', roomName: '' });
      }
      return list;
    };
    window.gmGetEndingList.__v70 = true;
  }

  /* 為旅人手札（#v4-notebook）加上 5 大分類切換列，消除 14+ 分頁橫向擁擠 */
  var nb = document.getElementById('v4-notebook');
  if(nb && !document.getElementById('v70-nb-cat-bar')){
    var tabsWrap = nb.querySelector('.v4-tabs');
    if(tabsWrap && tabsWrap.parentNode){
      var catBar = document.createElement('div');
      catBar.id = 'v70-nb-cat-bar';
      var cats = [
        { id: 'all',     label: '全部功能' },
        { id: 'profile', label: '旅人檔案（總覽/統計/結局/稱號）' },
        { id: 'relics',  label: '因果與遺物（遺物/印記/契約/占卜）' },
        { id: 'trials',  label: '試煉與玩法（試煉/機關/每日/商店）' },
        { id: 'cinema',  label: '萬門與轉場（萬門/轉場/聖所）' }
      ];
      catBar.innerHTML = cats.map(function(c, i){
        return '<button type="button" class="v70-nb-cat-btn ' + (i === 0 ? 'active' : '') + '" data-v70-nbcat="' + c.id + '">' + c.label + '</button>';
      }).join('');
      tabsWrap.parentNode.insertBefore(catBar, tabsWrap);

      var catMap = {
        profile: ['overview', 'titles', 'v5-stats', 'v58-compendium'],
        relics:  ['v5-relics', 'v5-seals', 'v53-pacts', 'v53-arcana'],
        trials:  ['v54-trials', 'v55-minigames', 'v58-daily', 'v58-shop'],
        cinema:  ['v53-codex', 'v63-theater']
      };

      catBar.querySelectorAll('[data-v70-nbcat]').forEach(function(btn){
        btn.onclick = function(){
          var cid = btn.getAttribute('data-v70-nbcat');
          catBar.querySelectorAll('.v70-nb-cat-btn').forEach(function(b){ b.classList.toggle('active', b === btn); });
          var allTabs = tabsWrap.querySelectorAll('.v4-tab');
          var firstVisible = null;
          allTabs.forEach(function(t){
            var tid = t.getAttribute('data-t');
            var show = (cid === 'all') || (catMap[cid] && catMap[cid].indexOf(tid) !== -1);
            t.classList.toggle('v70-tab-hidden', !show);
            if(show && !firstVisible) firstVisible = t;
          });
          var curActive = tabsWrap.querySelector('.v4-tab.on:not(.v70-tab-hidden)');
          if(!curActive && firstVisible) firstVisible.click();
        };
      });
    }
  }
}

/* ============================================================
 * 10. 整合頂欄、主選單與底欄「萬象聖所」入口 + 塔羅/共鳴即時生效掛鉤
 * ============================================================ */
function hookV70Runtime(){
  if(Array.isArray(window.dungeons)){
    var seenD = {};
    window.dungeons = window.dungeons.filter(function(d){
      if(!d || seenD[d.id]) return false;
      seenD[d.id] = true;
      return true;
    });
  }
  ensureAllStatesHaveInheritance();
  injectGate1TwentyFourthEnding();
  upgradeGmEndingListAndNotebook();

  /* 1. 主選單頂欄加入「萬象聖所」黃金入口，並將雙進度合併為單一清爽膠囊 */
  var hubRight = document.querySelector('#hub-screen .hub-header-right');
  if(hubRight && !document.getElementById('v70-sanctum-hub-btn')){
    var sBtn = document.createElement('button');
    sBtn.type = 'button';
    sBtn.id = 'v70-sanctum-hub-btn';
    sBtn.innerHTML = SVG_SANCTUM + ' <span>萬象聖所</span>';
    sBtn.onclick = function(e){
      e.stopPropagation();
      openSanctumModal('starmap');
    };
    hubRight.insertBefore(sBtn, hubRight.firstChild);
  }

  /* 2. 遊戲內底欄將「推演雷達」升級為「萬象聖所 / 星圖」（一鍵直達星圖、雷達、塔羅、試煉塔） */
  var radarBtn = document.getElementById('v64-radar-btn');
  if(radarBtn && !radarBtn.__v70Upgraded){
    radarBtn.innerHTML = SVG_SANCTUM + '<span>萬象星圖</span>';
    radarBtn.title = '開啟 v7.0 萬象聖所樞紐：即時星圖、環境雷達、塔羅占卜、試煉塔與遺物共鳴 (Alt+S)';
    radarBtn.onclick = function(){ openSanctumModal('starmap'); };
    radarBtn.__v70Upgraded = true;
  }

  /* 3. 升級 V61.ensureDungeonLoaded：確保在背景建置任何門扉場景時 state.inheritance 永遠存在 */
  if(window.V61 && typeof V61.ensureDungeonLoaded === 'function' && !V61.ensureDungeonLoaded.__v70){
    var _origEnsure = V61.ensureDungeonLoaded;
    V61.ensureDungeonLoaded = function(id, forceRebuild){
      ensureAllStatesHaveInheritance();
      var numId = parseInt(id, 10) || 1;
      if(numId === 14){
        buildScenes14();
        return true;
      }
      var res = _origEnsure.apply(this, arguments);
      if(numId === 1) injectGate1TwentyFourthEnding();
      return res;
    };
    V61.ensureDungeonLoaded.__v70 = true;
  }

  /* 4. 升級 render()：更新主選單合併進度膠囊（顯示 14 扇門與總成就）並支援第 14 扇門顯示 */
  if(typeof window.render === 'function' && !window.render.__v70){
    var _origRender = window.render;
    window.render = function(){
      ensureAllStatesHaveInheritance();
      var r = _origRender.apply(this, arguments);
      try{
        var pTxt = document.getElementById('progress-text');
        var aTxt = document.getElementById('ach-text');
        if(pTxt && pTxt.parentNode){
          var cleared = (typeof getClearedCount === 'function') ? getClearedCount() : 0;
          var totD = (window.dungeons && window.dungeons.length) || 14;
          var achCur = (typeof getAchList === 'function') ? getAchList().length : 0;
          var achTot = window.ACH_TOTAL || 160;
          pTxt.parentNode.innerHTML = '門扉 <span id="progress-text">' + cleared + ' / ' + totD + '</span> · 成就 <span id="ach-text">' + achCur + ' / ' + achTot + '</span>';
        }
      }catch(e){}
      return r;
    };
    window.render.__v70 = true;
  }

  /* 5. 將第 14 扇門加入 V60 第二層「支線與終焉迴廊」或主線迴廊導覽 */
  if(window.V61 && typeof V61.getDungeonDisplayState === 'function' && !V61.getDungeonDisplayState.__v70){
    var _origDisp = V61.getDungeonDisplayState;
    V61.getDungeonDisplayState = function(id){
      if(parseInt(id, 10) === 14) return 'unlocked';
      return _origDisp.apply(this, arguments);
    };
    V61.getDungeonDisplayState.__v70 = true;
  }
  if(typeof window.isUnlocked === 'function' && !window.isUnlocked.__v70){
    var _origUnl = window.isUnlocked;
    window.isUnlocked = function(id){
      if(parseInt(id, 10) === 14) return true;
      return _origUnl.apply(this, arguments);
    };
    window.isUnlocked.__v70 = true;
  }

  /* 6. 在 enterDungeon、goToScene、damage 與 triggerEnding 中生效塔羅牌陣與雙生遺物神話共鳴 */
  if(typeof window.enterDungeon === 'function' && !window.enterDungeon.__v70){
    var _origEnterD = window.enterDungeon;
    window.enterDungeon = function(id, autoStart){
      ensureAllStatesHaveInheritance();
      var numId = parseInt(id, 10) || 1;
      if(numId === 14) buildScenes14();
      var r = _origEnterD.apply(this, arguments);
      try{
        var tarot = getActiveTarotCard();
        var syns = getActiveSynergySeals();
        if(window.state && tarot){
          if(tarot.hpBonus){
            state.maxHp = (state.maxHp || 100) + tarot.hpBonus;
            state.hp = Math.min(state.maxHp, (state.hp || 100) + tarot.hpBonus);
          }
          if(tarot.shield){
            state.flags = state.flags || {};
            state.flags._v64Shield = (state.flags._v64Shield || 0) + tarot.shield;
          }
          if(tarot.cdBonus && state.countdown != null){
            state.countdown += tarot.cdBonus;
          }
          if(tarot.phoenix){
            state.flags = state.flags || {};
            state.flags._v70PhoenixReady = true;
          }
        }
        if(window.state && syns.length > 0){
          syns.forEach(function(s){
            if(s.id === 'syn_immortal_wing'){
              state.maxHp = (state.maxHp || 100) + 20;
              state.hp = Math.min(state.maxHp, (state.hp || 100) + 20);
            }
            if(s.id === 'syn_omniscient_dawn'){
              state.flags = state.flags || {};
              state.flags._v64Shield = Math.max(state.flags._v64Shield || 0, 35);
            }
            if(s.id === 'syn_chrono_mirror' && state.countdown != null){
              state.countdown += 10;
            }
          });
        }
        if(typeof updateHP === 'function') updateHP();
        if(typeof updateV58HUD === 'function') updateV58HUD();
      }catch(e){}
      return r;
    };
    window.enterDungeon.__v70 = true;
  }

  if(typeof window.goToScene === 'function' && !window.goToScene.__v70){
    var _origGoS = window.goToScene;
    window.goToScene = function(sceneId){
      ensureAllStatesHaveInheritance();
      var tarot = getActiveTarotCard();
      var syns = getActiveSynergySeals();
      if(window.state && tarot){
        if(tarot.sceneHeal){
          state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + tarot.sceneHeal);
        }
        if(tarot.moveCalm && typeof window.addStress === 'function'){
          window.addStress(-tarot.moveCalm);
        }
      }
      if(window.state && syns.some(function(s){ return s.id === 'syn_abyss_guider'; })){
        state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + 4);
      }
      var r = _origGoS.apply(this, arguments);
      if(typeof updateHP === 'function') updateHP();
      return r;
    };
    window.goToScene.__v70 = true;
  }

  if(typeof window.damage === 'function' && !window.damage.__v70){
    var _origDmg70 = window.damage;
    window.damage = function(amount){
      var adj = amount;
      var tarot = getActiveTarotCard();
      if(typeof adj === 'number' && adj > 0 && window.state && tarot){
        if(tarot.flatRed){
          adj = Math.max(1, adj - tarot.flatRed);
        }
        if((state.hp - adj) <= 0 && tarot.phoenix && state.flags && state.flags._v70PhoenixReady){
          state.flags._v70PhoenixReady = false;
          state.hp = 50;
          if(typeof updateHP === 'function') updateHP();
          if(typeof window.addMemoryShards === 'function') window.addMemoryShards(2);
          if(typeof showToast === 'function') showToast('【XIII · 破曉死神涅槃】跨越致命傷勢，生命值恢復至 50 HP 並獲贈 2 枚記憶碎片！');
          return;
        }
      }
      return _origDmg70.call(this, adj);
    };
    window.damage.__v70 = true;
  }

  /* 快捷鍵 Alt+S 開啟萬象聖所，Alt+M 開啟星圖 */
  document.addEventListener('keydown', function(e){
    if(!e) return;
    var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if(tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if(e.altKey && (e.key === 's' || e.key === 'S' || e.key === 'm' || e.key === 'M')){
      e.preventDefault();
      openSanctumModal('starmap');
    }
  });
}

function registerV70Achievements(){
  var extraAch = [
    { id: 'ach_v70_prime_architect', name: '質數建築師',   desc: '在第一扇門《質數旅館》解鎖第 24 個隱藏真結局「第 17 號觀測室」' },
    { id: 'ach_v70_tarot_reader',    name: '命運占卜師',   desc: '在萬象聖所中結契或抽取阿爾卡納命運牌陣' },
    { id: 'ach_v70_synergy_master',  name: '雙生共鳴者',   desc: '啟動任一組「雙生遺物神話共鳴聖印」' },
    { id: 'ach_v70_tower_challenger',name: '破塔行者',     desc: '在萬門試煉塔中擊破任一層守門人' },
    { id: 'ach_v70_tower_conqueror', name: '十四層霸主',   desc: '擊破萬門試煉塔全部 14 層守門人' }
  ];
  if(window.V5 && typeof V5.addAchievements === 'function'){
    V5.addAchievements(1, extraAch);
  }
}

registerDungeon14ZeroObservatory();
registerV70Achievements();

window.V70.openSanctumModal = openSanctumModal;
window.V70.buildInteractiveStarMapHTML = buildInteractiveStarMapHTML;
window.V70.CORRIDOR_TAROT_CARDS = CORRIDOR_TAROT_CARDS;
window.V70.RELIC_SYNERGY_SEALS = RELIC_SYNERGY_SEALS;
window.V70.GATEKEEPER_GAUNTLET = GATEKEEPER_GAUNTLET;
window.V70.GATEKEEPER_SECRET_LOGS = GATEKEEPER_SECRET_LOGS;
window.V70.getActiveTarotCard = getActiveTarotCard;
window.V70.setActiveTarotId = setActiveTarotId;
window.V70.getActiveSynergySeals = getActiveSynergySeals;
window.V70.getClearedBosses = getClearedBosses;

V5.onBoot(function(){
  try{
    hookV70Runtime();

    /* 重新統計全門扉成就總數 */
    if(window.DUNGEON_CONFIG){
      var seen = {};
      var tot = 0;
      Object.keys(window.DUNGEON_CONFIG).forEach(function(k){
        var defs = window.DUNGEON_CONFIG[k].achDefs || [];
        var unique = [];
        defs.forEach(function(a){
          if(a && a.id && !seen[a.id]){
            seen[a.id] = true;
            unique.push(a);
            tot++;
          }
        });
        window.DUNGEON_CONFIG[k].achDefs = unique;
      });
      window.ACH_TOTAL = tot;
    }

    window.VERSION = '7.0.0';
    window.SAVE_VERSION = '3.4';
    if(window.CHANGELOG){
      window.CHANGELOG = window.CHANGELOG.filter(function(c){ return c.version !== '7.0.0'; });
      window.CHANGELOG.unshift({
        version: '7.0.0',
        type: 'major',
        changes: [
          '跨世代大版本新章 — 第十四扇門・終焉大聖堂《第零號觀測室：萬門鍛造者》：重返凌晨 03:17 的大學實驗室原點，揭開質數分佈偏離曲線與十三扇門的終極真相；包含主控演算台、同伴殘響長廊、時空檔案庫與萬門鍛造爐等 18 個場景、3 道互動密碼謎題（2357 / 0318）與 14 個結局（含「萬門同歸」「03:18 的第一縷晨光」等 4 大真結局），並補完第一扇門第 24 個隱藏真結局《質數建築師》。',
          '極簡無干擾 UI/UX 秩序重構：主選單頂欄收斂進度與次要按鈕為「萬象聖所」黃金樞紐與單一總進度膠囊；旅人手札新增「5 大分類過濾導覽列」徹底消除 15 分頁橫向捲動；選項按鈕清除多餘「?」預覽符並統一右側因果記憶徽章；狀態列消除重複人數顯示；新增一鍵「專注閱讀模式（Zen Mode）」。',
          '萬象聖所樞紐與即時 SVG 萬門星圖（Interactive Constellation Map）：自動以 BFS 拓撲繪製當前門扉的房間星圖，標示當前位置、已踏足金星與未探分支，支援點擊已踏足節點直接跨房躍遷（快捷鍵 Alt+S / Alt+M）。',
          '14 大阿爾卡納命運塔羅占卜、14 守門人試煉塔連戰、6 大雙生遺物神話共鳴聖印與 14 篇守門人真相密錄：一站式收納於萬象聖所 5 大分頁中，大幅提升重玩深度而絕不堆砌於主畫面。',
          '全量細微 Bug 清零：徹底修復畫廊與懶載入切換第 2/3 扇門時 applyV1ToDungeon 讀取 state.inheritance 的潛在報錯、修復第 1 扇門 24/24 結局總數對齊、並補齊第 12/13/14 扇門於 GM 自動遊玩面板的結局清單。'
        ]
      });
    }

    ['title-version', 'hub-title-version'].forEach(function(id){
      var verEl = document.getElementById(id);
      if(verEl){
        var vTxt = 'v 7.0.0';
        verEl.textContent = vTxt;
        if(verEl.firstChild) verEl.firstChild.__origText = vTxt;
      }
    });

    if(typeof window.render === 'function'){
      window.render();
    }
    window.V70.__booted = true;
  }catch(e){
    console.error('v7.0 boot error:', e);
  }
});

})();
