
(function(){
'use strict';

window.V64 = window.V64 || {};

var LS_ANCHORS        = 'wuxian-v64-chrono-anchors';
var LS_CONTRACTS      = 'wuxian-v64-active-contracts';
var LS_TRIAL_CROWNS   = 'wuxian-v64-trial-crowns';
var LS_RELIC_LOADOUT  = 'wuxian-v64-relic-loadout';
var LS_ALCHEMY_CRAFT  = 'wuxian-v64-alchemy-crafted';
var LS_ANOMALY_USED   = 'wuxian-v64-anomaly-used';
var LS_ENV_GAZE       = 'ed_v64_env_gaze_found';
var LS_RIDDLE_SOLVED  = 'ed_v64_riddles_solved';

var SVG_REWIND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/><polyline points="12 7 12 12 15 14"/></svg>';
var SVG_RADAR  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="3" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="21"/><line x1="3" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="21" y2="12"/></svg>';
var SVG_TUNE   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>';
var SVG_CROWN  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><polygon points="2 19 22 19 20 7 15 12 12 5 9 12 4 7 2 19"/></svg>';
var SVG_RELIC  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><polygon points="12 2 19 12 12 22 5 12 12 2"/><circle cx="12" cy="12" r="3"/></svg>';
var SVG_ALCH   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/></svg>';

/* ============================================================
 * 1. 迴廊試煉契約（8 大高階重玩詞綴）與 12 大跨門扉古遺物配裝系統
 * ============================================================ */
var TRIAL_CONTRACT_DEFS = [
  {
    id: 'contract_fragile',
    name: '殘燭之軀',
    heat: 1,
    desc: '開局與最大生命值上限降至 60 HP，且承受的所有傷害提高 25%。'
  },
  {
    id: 'contract_fog',
    name: '迷霧盲行',
    heat: 1,
    desc: '隱藏所有選項的風險預覽、性格傾向與「未探分支／已踏足」記憶標籤。'
  },
  {
    id: 'contract_stress',
    name: '心魔低語',
    heat: 1,
    desc: '危險與詭異場景帶來的壓力值累積加倍，高壓幻覺提前於 65% 壓力時觸發。'
  },
  {
    id: 'contract_haste',
    name: '逆時沙漏',
    heat: 1,
    desc: '醫院與限時門扉的初始倒計時縮短 35%，考驗極限路線規劃。'
  },
  {
    id: 'contract_lone',
    name: '孤影無援',
    heat: 1,
    desc: '入局時不攜帶額外戰術消耗補給且無同行護衛分擔傷害，僅憑現場推理破局。'
  },
  {
    id: 'contract_karma',
    name: '因果鎖鏈',
    heat: 1,
    desc: '每次發動「時空回溯」或載入「時空錨點」時需支付 8 點生命值代價。'
  },
  {
    id: 'contract_abyss',
    name: '深淵凝視',
    heat: 1,
    desc: '踏入未探索分支時額外承受 3 點精神侵蝕，但發現真結局時獎勵雙倍記憶碎片。'
  },
  {
    id: 'contract_truth',
    name: '真名審判',
    heat: 1,
    desc: '唯有達成生存或隱藏真結局方能結算試煉金冠，普通結局視為試煉未竟。'
  }
];

/* 12 大跨門扉古遺物配裝（最多同時佩掛 3 件，完全改變 13 扇門探索體驗） */
var CORRIDOR_RELIC_DEFS = [
  {
    id: 'relic_watch',
    name: '林夏的停擺懷錶',
    origin: '第 1 / 4 扇門共鳴',
    desc: '限時門扉初始倒計時 +15 秒；生命低於 35 HP 時，壓力值累積速度減半。'
  },
  {
    id: 'relic_mirror',
    name: '無影古鏡殘片',
    origin: '第 2 / 13 扇門共鳴',
    desc: '每次承受傷害時自動折射抵銷 4 點傷害（最低降至 1 點），並降低 4% 壓力。'
  },
  {
    id: 'relic_compass',
    name: '深海青銅羅盤',
    origin: '第 5 / 6 扇門共鳴',
    desc: '在選項按鈕上自動標註「★ 關鍵因果」（指向會給予劇情信物或解鎖新區域的選項）。'
  },
  {
    id: 'relic_feather',
    name: '守門人白鴉羽',
    origin: '第 3 / 11 扇門共鳴',
    desc: '每扇門獲得 1 次「不死庇護」：受到致命傷害時自動鎖血於 20 HP 並清空精神壓力。'
  },
  {
    id: 'relic_lantern',
    name: '第 13 盞冷白提燈',
    origin: '第 4 / 12 扇門共鳴',
    desc: '每踏入一個尚未探索過的新場景，自動恢復 +4 HP 並降低 4% 精神壓力。'
  },
  {
    id: 'relic_ticket',
    name: '1999 雙向對稱車票',
    origin: '第 7 / 9 扇門共鳴',
    desc: '發動「時空回溯」或「錨點躍遷」時免除因果鎖鏈扣血，並額外恢復 +6 HP。'
  },
  {
    id: 'relic_scale',
    name: '真名審判古秤',
    origin: '第 8 扇門共鳴',
    desc: '每簽署 1 項「試煉契約」，入局時額外增加 +6 最大生命值與初始 HP。'
  },
  {
    id: 'relic_film',
    name: '第零號底片鐵盒',
    origin: '第 10 扇門共鳴',
    desc: '達成任意結局時額外獲得 +2 枚記憶碎片，且開啟現場環境凝視時恢復量翻倍（+10 HP）。'
  },
  {
    id: 'relic_bell',
    name: '409 質數黃銅鈴',
    origin: '第 1 扇門共鳴',
    desc: '在每扇門的「迴廊時空奇遇」中可免費領取一次守門人饋贈，且安全場景回血 +6 HP。'
  },
  {
    id: 'relic_flower',
    name: '永夜溫室曇花',
    origin: '第 11 扇門共鳴',
    desc: '入局最大生命值與初始生命值提升 +25 HP，並免疫第一次高壓幻覺。'
  },
  {
    id: 'relic_key',
    name: '萬門骨鑰拓本',
    origin: '全主線共鳴',
    desc: '破解「守門人殘響對弈」或密碼鎖時，額外恢復 +15 HP 並多獲 1 枚記憶碎片。'
  },
  {
    id: 'relic_prism',
    name: '03:18 晨曦稜鏡',
    origin: '第 13 扇門共鳴',
    desc: '入局自帶 15 點晨曦護盾（優先抵扣傷害），且全門扉壓力上限閾值提升。'
  }
];

/* 10 大跨門扉因果煉成陣（結合環境凝視與殘響推演進度，合成永久聖印與即時增益） */
var ALCHEMY_RECIPES = [
  { id: 'alc_prime_seal', name: '質數靜默聖印', reqEnv: 2, reqRiddle: 1, shardCost: 1, rewardText: '立即恢復 25 HP 並清空當前壓力，永久記錄於因果煉成冊。', heal: 25, stress: -100 },
  { id: 'alc_chrono_core', name: '03:17 逆時機芯', reqEnv: 4, reqRiddle: 2, shardCost: 1, rewardText: '最大生命上限 +15 HP（本局立即生效），並延長限時倒數 +20 秒。', maxHp: 15, cd: 20 },
  { id: 'alc_abyss_pearl', name: '迴光深海夜明珠', reqEnv: 6, reqRiddle: 3, shardCost: 2, rewardText: '獲得 2 枚迴光結晶，且本局立即恢復 30 HP。', heal: 30, echo: 2 },
  { id: 'alc_star_astrolabe', name: '1999 觀測星盤', reqEnv: 9, reqRiddle: 4, shardCost: 2, rewardText: '全隊夥伴生命回滿，主角獲得 +20 HP 與冷靜特質提升。', heal: 20, partyHeal: true },
  { id: 'alc_mirror_ticket', name: '雙生鏡像金票', reqEnv: 12, reqRiddle: 5, shardCost: 2, rewardText: '在當前行囊中注入【萬能因果替身符】並恢復 25 HP。', heal: 25, giveToken: '萬能因果替身符' },
  { id: 'alc_feast_chalice', name: '無妄清水聖爵', reqEnv: 15, reqRiddle: 6, shardCost: 2, rewardText: '壓力歸零、飽食度與鏡像 HP 最佳化，最大生命 +20 HP。', maxHp: 20, stress: -100 },
  { id: 'alc_cinema_reel', name: '潮汐終章膠卷', reqEnv: 18, reqRiddle: 8, shardCost: 3, rewardText: '直接回饋 5 枚記憶碎片，並使當前生命值回滿。', heal: 100, shards: 5 },
  { id: 'alc_zoo_lantern', name: '23:00 巡園提燈', reqEnv: 22, reqRiddle: 9, shardCost: 3, rewardText: '賦予 30 點黃金護盾，並提升本局所有同伴信任度。', heal: 30, shield: 30 },
  { id: 'alc_echo_key', name: '第零層回聲主鑰', reqEnv: 28, reqRiddle: 11, shardCost: 3, rewardText: '解鎖「回聲主宰」狀態：生命上限 +30 HP 且壓力永不超過 50%。', maxHp: 30, stress: -100 },
  { id: 'alc_dawn_eye', name: '03:18 萬門真瞳', reqEnv: 33, reqRiddle: 12, shardCost: 4, rewardText: '終極因果煉成：生命上限 +50 HP、完全恢復，並獲贈 8 枚記憶碎片！', maxHp: 50, heal: 150, shards: 8 }
];

/* 13 扇門專屬「迴廊時空奇遇與殘影商人」互動事件（每扇門皆可觸發） */
var GATE_ANOMALY_EVENTS = {
  1: { title: '【409 號房門縫的古董商殘影】', desc: '一名戴著單片眼鏡的舊時代房客從門縫遞出一枚溫熱的銅鈴：「旅人，用一點點精神共鳴，換取走廊質數法則的庇護如何？」',
       choices: [
         { label: '以 10% 壓力換取【+25 HP 與旅館密道提示】', act: function(){ if(window.addStress) addStress(10); if(window.state){ state.hp=Math.min(state.maxHp||100,(state.hp||100)+25); updateHP(); } return '古董商微笑著點頭，溫熱的銅鈴聲撫平了你的傷勢（HP +25）。'; } },
         { label: '靜默傾聽鈴聲【壓力 -20% · 恢復 10 HP】', act: function(){ if(window.addStress) addStress(-20); if(window.state){ state.hp=Math.min(state.maxHp||100,(state.hp||100)+10); updateHP(); } return '你在質數房號的規律鐘聲中找回了內心平靜（壓力 -20%，HP +10）。'; } }
       ] },
  2: { title: '【禁書區漂浮的無字羊皮卷】', desc: '一張泛著微光的羊皮紙自動停在你面前，墨跡正在等待你的抉擇。',
       choices: [
         { label: '滴入指尖溫血銘刻真名【HP -8 · 換取 2 枚記憶碎片與全壓力清空】', act: function(){ if(window.state){ state.hp=Math.max(1,(state.hp||100)-8); updateHP(); } if(window.addStress) addStress(-100); if(window.addMemoryShards) addMemoryShards(2); return '羊皮卷化為純淨的金光融入你的手札（記憶碎片 +2，壓力完全清空）。'; } },
         { label: '以靜默手勢合上書卷【HP +18 · 壓力 -15%】', act: function(){ if(window.state){ state.hp=Math.min(state.maxHp||100,(state.hp||100)+18); updateHP(); } if(window.addStress) addStress(-15); return '館長的殘影向你頷首致意，書香化作暖流（HP +18，壓力 -15%）。'; } }
       ] },
  3: { title: '【03:16 推著銀色藥車的無臉護士】', desc: '藥車上擺著兩支閃爍不同色澤的時空試管：「巡房時間快到了，挑一支能讓你撐過今夜的藥劑吧。」',
       choices: [
         { label: '飲下琥珀色時空凝劑【倒計時 +20 秒 · HP +15】', act: function(){ if(window.state){ state.countdown=(state.countdown||60)+20; state.hp=Math.min(state.maxHp||100,(state.hp||100)+15); if(typeof updateCountdown==='function') updateCountdown(); updateHP(); } return '時間的流速在你周圍明顯變緩（倒計時 +20 秒，HP +15）。'; } },
         { label: '飲下翠綠鎮靜試管【最大生命上限 +15 HP · 壓力歸零】', act: function(){ if(window.state){ state.maxHp=(state.maxHp||100)+15; state.hp=Math.min(state.maxHp,(state.hp||100)+15); updateHP(); } if(window.addStress) addStress(-100); return '冰涼的藥液徹底驅散了耳邊的蜂鳴（最大生命 +15 HP，壓力歸零）。'; } }
       ] },
  4: { title: '【第 13 盞壁燈下的影子旅人】', desc: '你的影子突然從地面站起，向你遞出一枚發光的懷錶齒輪：「我走過你還沒走的那條分支，收下這份餘溫吧。」',
       choices: [
         { label: '與自己的影子擊掌共鳴【HP +25 · 壓力 -20%】', act: function(){ if(window.state){ state.hp=Math.min(state.maxHp||100,(state.hp||100)+25); updateHP(); } if(window.addStress) addStress(-20); return '影子重新融入你的腳下，你感到前所未有的清明（HP +25，壓力 -20%）。'; } },
         { label: '剝離一絲恐懼交給影子【獲得 2 枚記憶碎片 · 壓力 -35%】', act: function(){ if(window.addMemoryShards) addMemoryShards(2); if(window.addStress) addStress(-35); return '影子替你封存了走廊的夢魘，化為兩枚記憶結晶（記憶碎片 +2）。'; } }
       ] },
  5: { title: '【潮汐交界處的提燈守塔人】', desc: '一艘半透明的木舟停靠在浪尖，守塔人將一枚迴光貝殼放入你掌心。',
       choices: [
         { label: '汲取迴光貝殼的能量【迴光結晶 +2 · HP +20】', act: function(){ if(window.state){ state.echo=(state.echo||0)+2; state.hp=Math.min(state.maxHp||100,(state.hp||100)+20); updateHP(); if(typeof updateD5HUD==='function') updateD5HUD(); } return '海浪聲化為溫潤的迴光結晶（迴光 +2，HP +20）。'; } },
         { label: '順著燈塔光束凝視深海【獲贈 2 枚記憶碎片 · 壓力 -25%】', act: function(){ if(window.addMemoryShards) addMemoryShards(2); if(window.addStress) addStress(-25); return '你看清了海底燈塔的真實方位（記憶碎片 +2，壓力 -25%）。'; } }
       ] },
  6: { title: '【1999 射電頻段的未來回音】', desc: '觀測站耳機裡傳來你自己來自未來的聲音：「把頻率調到 03.18 兆赫，那裡有我們留下的補給。」',
       choices: [
         { label: '鎖定未來頻段接收共鳴【HP +25 · 壓力 -25%】', act: function(){ if(window.state){ state.hp=Math.min(state.maxHp||100,(state.hp||100)+25); updateHP(); } if(window.addStress) addStress(-25); return '溫暖的星塵順著天線灑落，修復了你的疲憊（HP +25，壓力 -25%）。'; } },
         { label: '記錄星際座標波紋【記憶碎片 +2 · 最大生命 +10 HP】', act: function(){ if(window.addMemoryShards) addMemoryShards(2); if(window.state){ state.maxHp=(state.maxHp||100)+10; state.hp=Math.min(state.maxHp,(state.hp||100)+10); updateHP(); } return '星際波紋化為珍貴的時空紀錄（記憶碎片 +2，最大生命 +10 HP）。'; } }
       ] },
  7: { title: '【鏡像車廂的午夜查票員】', desc: '查票員並未索取車票，而是端著一盤盛著藍光茶飲的銀托盤：「往返陰陽交界的乘客，都可以免費享用一杯定魂茶。」',
       choices: [
         { label: '飲下定魂藍茶【鏡像 HP +25 · 自身 HP +20】', act: function(){ if(window.state){ state.mirrorHp=Math.min(100,(state.mirrorHp||100)+25); state.hp=Math.min(state.maxHp||100,(state.hp||100)+20); updateHP(); if(typeof updateV58HUD==='function') updateV58HUD(); } return '車窗上的倒影向你舉杯致意，雙方同步恢復了元氣（HP +20，鏡像HP +25）。'; } },
         { label: '索取車長私藏紀念票根【記憶碎片 +2 · 壓力 -20%】', act: function(){ if(window.addMemoryShards) addMemoryShards(2); if(window.addStress) addStress(-20); return '查票員在你的手札上蓋下了金色的通行印記（記憶碎片 +2）。'; } }
       ] },
  8: { title: '【後廚暗門旁的清醒侍者】', desc: '一名雙眼清澈的侍者悄悄塞給你一瓶未受詛咒的山泉水與消化秘藥。',
       choices: [
         { label: '飲下山泉水洗滌腸胃【飽食度降低 25% · HP +25】', act: function(){ if(window.state){ state.satiety=Math.max(0,(state.satiety||0)-25); state.hp=Math.min(state.maxHp||100,(state.hp||100)+25); updateHP(); if(typeof updateV58HUD==='function') updateV58HUD(); } return '清冽的泉水洗去了虛妄盛宴的沉重感（飽食度 -25%，HP +25）。'; } },
         { label: '收下侍者的秘藏銀幣【記憶碎片 +2 · 壓力 -25%】', act: function(){ if(window.addMemoryShards) addMemoryShards(2); if(window.addStress) addStress(-25); return '銀幣上刻著離開宴會廳的暗號（記憶碎片 +2，壓力 -25%）。'; } }
       ] },
  9: { title: '【黃昏保健室的值日生殘影】', desc: '穿著 1999 年校服的少女指了指醫藥箱最下層的鐵盒：「那是我留給長大後的自己的禮物。」',
       choices: [
         { label: '打開鐵盒使用急救繃帶【HP +30 · 壓力 -20%】', act: function(){ if(window.state){ state.hp=Math.min(state.maxHp||100,(state.hp||100)+30); updateHP(); } if(window.addStress) addStress(-20); return '帶著陽光氣息的舊繃帶瞬間治癒了你的傷口（HP +30，壓力 -20%）。'; } },
         { label: '珍藏鐵盒裡的時空彈珠【記憶碎片 +2 · 最大生命 +10 HP】', act: function(){ if(window.addMemoryShards) addMemoryShards(2); if(window.state){ state.maxHp=(state.maxHp||100)+10; state.hp=Math.min(state.maxHp,(state.hp||100)+10); updateHP(); } return '玻璃彈珠裡封存著 1999 年永不落幕的晴空（記憶碎片 +2，最大生命 +10 HP）。'; } }
       ] },
  10: { title: '【午夜售票亭的老放映師】', desc: '老放映師正在剪接一段發光的黃金底片：「把悲劇的格數剪掉幾格，結局就會變得溫柔許多。」',
        choices: [
          { label: '請放映師修補你的時間幀【HP +28 · 影評分數/共鳴提升】', act: function(){ if(window.state){ state.hp=Math.min(state.maxHp||100,(state.hp||100)+28); if(state.criticScore!==undefined) state.criticScore+=15; updateHP(); } return '放映機投射出溫暖的柔光，你的傷勢隨畫面重組而癒合（HP +28）。'; } },
          { label: '收藏剪下的黃金底片【記憶碎片 +2 · 壓力 -25%】', act: function(){ if(window.addMemoryShards) addMemoryShards(2); if(window.addStress) addStress(-25); return '每一格底片都閃耀著過往旅人的智慧（記憶碎片 +2，壓力 -25%）。'; } }
        ] },
  11: { title: '【溫室鐘樓下的提燈巡園人】', desc: '巡園人提著裝有夜光曇花的玻璃燈籠向你招手：「在 23:00 的鐘聲敲響前，吸一口曇花香吧，夜行獸不會靠近帶有花香的訪客。」',
        choices: [
          { label: '深吸夜光曇花香氣【HP +28 · 人性共鳴提升】', act: function(){ if(window.state){ state.hp=Math.min(state.maxHp||100,(state.hp||100)+28); if(state.humanity!==undefined) state.humanity=Math.min(100,(state.humanity||80)+15); updateHP(); } if(window.addStress) addStress(-20); return '清幽的花香讓你的意識無比澄澈（HP +28，壓力 -20%）。'; } },
          { label: '接過巡園人贈予的曇花種子【記憶碎片 +2 · 最大生命 +12 HP】', act: function(){ if(window.addMemoryShards) addMemoryShards(2); if(window.state){ state.maxHp=(state.maxHp||100)+12; state.hp=Math.min(state.maxHp,(state.hp||100)+12); updateHP(); } return '種子在你的行囊裡散發著恆久微光（記憶碎片 +2，最大生命 +12 HP）。'; } }
        ] },
  12: { title: '【停靠在夾層的古銅電梯侍者】', desc: '轎廂門短暫滑開一道縫隙，門外的侍者遞來一杯溫熱的琥珀咖啡：「別理會三秒前的回聲，喝口熱飲定定神。」',
        choices: [
          { label: '飲下琥珀熱咖啡【HP +30 · 壓力 -30%】', act: function(){ if(window.state){ state.hp=Math.min(state.maxHp||100,(state.hp||100)+30); updateHP(); } if(window.addStress) addStress(-30); return '醇厚的暖意順著喉嚨流遍全身，耳邊的詭異回聲頓時消散（HP +30，壓力 -30%）。'; } },
          { label: '索取第零層金屬徽章【記憶碎片 +2 · 最大生命 +15 HP】', act: function(){ if(window.addMemoryShards) addMemoryShards(2); if(window.state){ state.maxHp=(state.maxHp||100)+15; state.hp=Math.min(state.maxHp,(state.hp||100)+15); updateHP(); } return '徽章背面刻著直達中樞的波長（記憶碎片 +2，最大生命 +15 HP）。'; } }
        ] },
  13: { title: '【無倒影之鏡前的守門人本尊】', desc: '鏡中沒有任何倒影，但守門人溫和的聲音在迴廊穹頂迴盪：「你已經走過漫長的十二扇門，在迎接 03:18 的黎明前，收下這份最終祝福吧。」',
        choices: [
          { label: '接受十二門共鳴洗禮【HP 全滿 · 最大生命 +25 HP · 壓力歸零】', act: function(){ if(window.state){ state.maxHp=(state.maxHp||100)+25; state.hp=state.maxHp; updateHP(); } if(window.addStress) addStress(-100); return '十二道門扉的金光匯聚於你掌心，你的生命與意志達到巔峰（最大生命 +25，HP 全滿）！'; } },
          { label: '凝結萬門真知結晶【記憶碎片 +3 · HP +30】', act: function(){ if(window.addMemoryShards) addMemoryShards(3); if(window.state){ state.hp=Math.min(state.maxHp||100,(state.hp||100)+30); updateHP(); } return '三枚璀璨的萬門結晶落入你的手札之中（記憶碎片 +3，HP +30）！'; } }
        ] }
};

/* 13 扇門專屬現場環境調查點（共 39 處）與 13 道守門人殘響推演謎題 */
var GATE_ENV_DETAILS = {
  1: [
    { id: 'g1_1', title: '櫃檯黃銅鈴底刻痕', text: '鈴鐺內側刻著一行極細的小字：「2、3、5、7、11、13……唯有質數房號不會在午夜被走廊吞沒。」' },
    { id: 'g1_2', title: '停擺的落地老爺鐘', text: '指針死死卡在 03:17，鐘擺後方藏著半張燒焦的房客登記簿，記載著紅衣女人在 404 房消失的真相。' },
    { id: 'g1_3', title: '電梯門縫滲出的紅線', text: '紅線並非織物，而是由無數細小時間刻度凝結成的因果絲，指向地下室深處的鏡像核心。' }
  ],
  2: [
    { id: 'g2_1', title: '借閱卡背面的指紋', text: '泛黃借閱卡上蓋著「逾期一百年」的暗紅印章，背面用鉛筆寫著：「切勿出聲朗讀無名之書。」' },
    { id: 'g2_2', title: '禁書區青銅書鎮', text: '書鎮下壓著館長的親筆手記：「當書頁自己翻動時，閉上眼睛數到七，影子會替你讀完。」' },
    { id: 'g2_3', title: '螺旋階梯回音孔', text: '貼耳傾聽可聽見過去旅人的低語，提示唯有歸還真正屬於自己的記憶之書方能開啟隱藏暗門。' }
  ],
  3: [
    { id: 'g3_1', title: '護理站破裂的體溫計', text: '水銀凝結成奇異的莫比烏斯環形狀，旁邊病歷本寫著：「03:17 分的巡房者沒有腳步聲。」' },
    { id: 'g3_2', title: '手術室無影燈倒影', text: '抬頭看向無影燈鏡面，映出的不是現在的你，而是已經握有地下停屍間鑰匙的未來殘影。' },
    { id: 'g3_3', title: '心電監護儀波紋密碼', text: '看似雜亂的心跳峰值實為摩斯密碼，解譯後指向院長室保險櫃的雙重鎖扣。' }
  ],
  4: [
    { id: 'g4_1', title: '無限長廊第 13 盞壁燈', text: '唯有第 13 盞壁燈的燈芯燃燒著冷白色火焰，燈座下刻著：「向後退一步，即是向前跨出深淵。」' },
    { id: 'g4_2', title: '門牌背面的空白拓印', text: '翻開門牌可見前任守門人留下的拓印，記載著如何以清醒夢識破虛假出口的訣竅。' },
    { id: 'g4_3', title: '地毯縫隙的鐘錶齒輪', text: '一枚仍在微弱跳動的懷錶齒輪，與你踏入迴廊前的實驗室螢幕時間完全同步。' }
  ],
  5: [
    { id: 'g5_1', title: '船長室生鏽六分儀', text: '六分儀對準的並非北極星，而是海底深處倒映的另一座星空，刻度鎖定在潮汐反轉之刻。' },
    { id: 'g5_2', title: '甲板欄杆上的鹽晶字跡', text: '海風吹不散的鹽晶凝聚成字：「當海面升起倒影之月，切勿回應水下的呼喚。」' },
    { id: 'g5_3', title: '航海日誌最後一頁', text: '墨跡被海水浸透卻依然清晰：「真正的燈塔不在遠方岸上，而在下潛至最深處的寂靜裡。」' }
  ],
  6: [
    { id: 'g6_1', title: '射電望遠鏡校準盤', text: '校準盤接收到來自 1999 年的重複訊號，頻率恰好與人類腦波在深睡轉醒瞬間的震盪一致。' },
    { id: 'g6_2', title: '觀測日誌紅筆批註', text: '「我們以為自己在觀測群星，直到群星透過透鏡回望了我們的瞳孔。」' },
    { id: 'g6_3', title: '穹頂裂縫飄落的星塵', text: '星塵在掌心化為微光文字，提示在倒數歸零前逆向啟動星圖儀即可鎖定真結局座標。' }
  ],
  7: [
    { id: 'g7_1', title: '車廂連接處的舊車票', text: '車票上的起點與終點印著同一個站名，剪票口呈現奇異的雙向對稱齒痕。' },
    { id: 'g7_2', title: '車窗玻璃上的指尖霧氣', text: '霧氣散去後浮現鏡像反字：「當車窗裡的倒影對你微笑時，請立即拉下緊急制動閥。」' },
    { id: 'g7_3', title: '列車時刻表夾層', text: '夾層藏著車掌的懷錶鏈，記錄著唯有在隧道交會瞬間跨入對向車廂才能脫離循環。' }
  ],
  8: [
    { id: 'g8_1', title: '銀質餐盤底部的天平紋', text: '餐盤背面鐫刻著：「每一口虛妄的盛宴，都在秤量食客遺忘的真名重量。」' },
    { id: 'g8_2', title: '侍者托盤下的白餐巾', text: '餐巾內折著一張字條：「拒絕主廚推薦的第七道紅肉，只飲用映出自己雙眼的清水。」' },
    { id: 'g8_3', title: '宴會廳盡頭的計重古秤', text: '古秤兩端放著羽毛與鉛塊卻保持水平，暗示唯有放下貪念方能推開後廚逃生門。' }
  ],
  9: [
    { id: 'g9_1', title: '黑板右下角的值日生名單', text: '名單上的名字每隔三分鐘就會自動擦去重寫，最後一個名字始終留白等待填補。' },
    { id: 'g9_2', title: '音樂教室風琴踏板', text: '踏板下卡著一張 1999 年的畢業合照，照片裡所有人都望向窗外同一道光縫。' },
    { id: 'g9_3', title: '走廊保健室的舊身高尺', text: '刻度在 150 公分處有一道暗門卡榫，記錄著當年孩子們留下的時空膠囊位置。' }
  ],
  10: [
    { id: 'g10_1', title: '放映室膠卷鐵盒銘牌', text: '鐵盒上貼著封條：「第零號底片：切勿將自己的影子投射在空白銀幕中央。」' },
    { id: 'g10_2', title: '第三排正中央的絨布座椅', text: '扶手內側刻著前任觀眾的警告：「當片尾字幕開始倒著滾動，往放映孔方向走。」' },
    { id: 'g10_3', title: '售票亭找零盤的古銅幣', text: '銅幣正反兩面皆是開門圖騰，握在手中能聽見潮汐拍打影院地基的轟鳴。' }
  ],
  11: [
    { id: 'g11_1', title: '夜間守則告示牌背面', text: '塗鴉寫著：「23:00 之後，籠子裡與籠子外的身分將會對調，請確認自己佩戴的訪客徽章。」' },
    { id: 'g11_2', title: '溫室標本館的玻璃罐', text: '罐中封存著一朵永不凋謝的夜光曇花，標籤註明其花粉能喚醒沉睡的巡園人。' },
    { id: 'g11_3', title: '鐘樓鳥籠下的銅鑰匙模', text: '鑰匙齒痕與園區正門完全吻合，但唯有在不驚動夜行獸群的前提下才能取走。' }
  ],
  12: [
    { id: 'g12_1', title: '電梯按鍵面板後的線路', text: '拆開「B13」按鍵可見背後並非電線，而是連接著十三座門扉記憶迴路的鎏金光纖。' },
    { id: 'g12_2', title: '轎廂頂部通風口刻字', text: '「聽見自己三秒前的回聲時不要回頭，按下開門鍵與關門鍵的摩斯組合。」' },
    { id: 'g12_3', title: '樓層顯示器殘影', text: '數字在跳過「0」層的瞬間會閃現一道暗金符文，正是通往控制中樞的密鑰。' }
  ],
  13: [
    { id: 'g13_1', title: '中央稜鏡基座銘文', text: '「千萬面鏡子只映出同一個靈魂的碎片；當你不再尋找出口，出口便在你瞳孔之中。」' },
    { id: 'g13_2', title: '無倒影之鏡的邊框裂痕', text: '裂痕內嵌著前十二扇門凝結的時空結晶，觸碰時能聽見所有同伴的回聲共鳴。' },
    { id: 'g13_3', title: '凌晨 03:18 的第一道晨曦', text: '鏡面深處透出微弱卻真實的暖光，指向跨越無盡迴廊、回歸現實黎明的最終門扉。' }
  ]
};

var GATE_RIDDLES = {
  1: { q: '【質數旅館之謎】午夜巡房者在走廊獵殺房客時，哪一個房號是絕對安全的庇護所？', opts: ['404 號房（偶數合數）', '409 號房（不可分解之質數）', '405 號房（五之倍數）'], ans: 1, hint: '唯有大於 1 且只能被 1 與自身整除的質數房號，不會被走廊規則折疊吞噬。' },
  2: { q: '【沉默圖書館之謎】面對自行翻頁的無名禁書，旅人應如何解開文字詛咒？', opts: ['大聲朗讀書頁上的古語', '撕毀書頁並點火焚燒', '保持絕對靜默，以自身記憶共鳴歸還書本'], ans: 2, hint: '沉默圖書館嚴禁聲響與破壞，唯有靜默並歸還真實記憶方能開啟暗門。' },
  3: { q: '【倒計時醫院之謎】當心電監護儀在 03:17 響起長鳴，真正的生路藏於何處？', opts: ['順著無影燈倒影與摩斯波紋解開地下室核心鎖', '直接跳出三樓走廊窗戶', '拔除所有病房的電源總閘'], ans: 0, hint: '無影燈的倒影與心電圖波紋構成了雙重密碼，指向醫院深處的真相。' },
  4: { q: '【無盡之間之謎】當走廊在眼前無限延伸、每扇門都一模一樣時，如何打破空間迴圈？', opts: ['蒙眼全速向前狂奔', '鎖定第 13 盞冷白壁燈，逆向退後一步識破虛妄', '逐一踹開所有房門'], ans: 1, hint: '無盡之間的法則為「向後退一步即是向前」，第 13 盞冷白壁燈即為座標。' },
  5: { q: '【迴光之海之謎】當海底升起倒影之月、水下傳來熟悉呼喚時，掌舵者應如何抉擇？', opts: ['順著呼喚跳入海中', '逆轉六分儀刻度，向最深處的寂靜燈塔下潛定錨', '砍斷船錨任由洋流漂流'], ans: 1, hint: '迴光之海的真相不在虛假的水面呼喚，而在逆轉刻度後的深海燈塔。' },
  6: { q: '【終焉觀測站之謎】面對來自 1999 年的群星回望訊號，如何在倒數歸零前鎖定出路？', opts: ['砸毀射電望遠鏡透鏡', '逆向校準星圖儀頻率，使腦波與晨曦座標同步', '關閉穹頂防護罩直視強光'], ans: 1, hint: '逆向校準星圖儀頻率即可將觀測迴路轉為返回現實的信標。' },
  7: { q: '【鏡像電車之謎】當車窗倒影露出微笑、列車即將駛入無盡隧道時，唯一破局之法為何？', opts: ['在兩車交會瞬間拉下制動並跨入對稱車廂', '敲碎車窗跳車', '躲進車廂座位底下閉眼'], ans: 0, hint: '雙向對稱車票暗示唯有在隧道交會的奇點跨入鏡像對稱車廂方能脫離。' },
  8: { q: '【無盡自助餐之謎】在秤量真名的虛妄盛宴上，食客如何通過古秤的審判？', opts: ['狼吞虎嚥吃光主廚第七道紅肉', '拒絕貪婪佳餚，僅飲映出雙眼的清水並保持古秤水平', '掀翻餐桌搶奪侍者銀盤'], ans: 1, hint: '放下口腹貪念、只飲映出本心的清水，古秤便會為清醒者開啟後廚之門。' },
  9: { q: '【小學 1999 之謎】在永遠停留在黃昏放學鐘聲的校舍裡，時空膠囊的鑰匙藏在哪裡？', opts: ['音樂教室風琴踏板與保健室刻度卡榫的交集', '直接翻越操場鐵絲網', '把黑板上的名字全部擦掉'], ans: 0, hint: '1999 年畢業合照與保健室刻度暗門共同封存了離開校舍的真實記憶。' },
  10: { q: '【潮汐電影院之謎】當第零號底片開始倒轉、銀幕湧出潮水時，觀眾該往何處去？', opts: ['衝上銀幕正中央融入畫面', '逆著人流走向放映孔，以古銅幣定住放映機齒輪', '鎖死影廳大門等待退潮'], ans: 1, hint: '前任觀眾的警告指明：切勿讓影子留在銀幕中央，應逆向前往放映室核心。' },
  11: { q: '【動物園 23:00 之謎】當午夜鐘響、籠內外身分即將對調時，如何全身而退？', opts: ['佩戴正確訪客徽章，以夜光曇花粉喚醒巡園人取得正門銅鑰', '打開所有猛獸鐵籠製造混亂', '躲進鐵籠裡假扮標本'], ans: 0, hint: '遵守夜間守則、借助溫室夜光曇花與巡園人的協助，方能安全拿到正門銅鑰。' },
  12: { q: '【回聲電梯之謎】在聽見自己三秒前回聲的下墜轎廂中，如何抵達真正的出口樓層？', opts: ['不回頭回應回聲，輸入開關門摩斯組合喚醒第零層暗金符文', '強行扒開運行中的電梯門', '連續狂按所有樓層按鈕'], ans: 0, hint: '回聲是時空陷阱，唯有不回頭並輸入開關門組合鍵方能停靠第零層中樞。' },
  13: { q: '【鏡子迷宮之謎】面對千萬面映出過去十二扇門碎片的鏡子，如何讓時間跨入 03:18？', opts: ['將所有鏡子全部擊碎', '凝聚十二扇門的共鳴記憶，直視無倒影之鏡的本心迎接 03:18 晨曦', '留在鏡中世界成為新守門人'], ans: 1, hint: '萬門歸一，唯有接納所有迴廊記憶並直視本心，停滯的 03:17 才會邁向 03:18。' }
};

/* ---- 存取輔助 ---- */
function getFoundEnvGaze(){
  try{
    var raw = localStorage.getItem(LS_ENV_GAZE);
    var arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function markEnvGazeFound(id){
  var cur = getFoundEnvGaze();
  if(cur.indexOf(id) === -1){
    cur.push(id);
    try{ localStorage.setItem(LS_ENV_GAZE, JSON.stringify(cur)); }catch(e){}
    return true;
  }
  return false;
}
function getSolvedRiddles(){
  try{
    var raw = localStorage.getItem(LS_RIDDLE_SOLVED);
    var obj = raw ? JSON.parse(raw) : {};
    return (obj && typeof obj === 'object') ? obj : {};
  }catch(e){ return {}; }
}
function markRiddleSolved(did){
  var cur = getSolvedRiddles();
  if(!cur[did]){
    cur[did] = true;
    try{ localStorage.setItem(LS_RIDDLE_SOLVED, JSON.stringify(cur)); }catch(e){}
    return true;
  }
  return false;
}

function getEquippedRelics(){
  try{
    var raw = localStorage.getItem(LS_RELIC_LOADOUT);
    var arr = raw ? JSON.parse(raw) : ['relic_compass', 'relic_lantern'];
    return Array.isArray(arr) ? arr.slice(0, 3) : [];
  }catch(e){ return ['relic_compass', 'relic_lantern']; }
}
function setEquippedRelics(list){
  var clean = Array.isArray(list) ? list.slice(0, 3) : [];
  try{ localStorage.setItem(LS_RELIC_LOADOUT, JSON.stringify(clean)); }catch(e){}
  refineInventoryAndStatusDisplay();
}
function hasRelic(rid){
  return getEquippedRelics().indexOf(rid) !== -1;
}
function toggleRelic(rid){
  var cur = getEquippedRelics();
  var idx = cur.indexOf(rid);
  if(idx !== -1){
    cur.splice(idx, 1);
  } else {
    if(cur.length >= 3){
      if(typeof showToast === 'function') showToast('最多同時佩掛 3 件迴廊古遺物（請先卸下一件）');
      return cur;
    }
    cur.push(rid);
  }
  setEquippedRelics(cur);
  return cur;
}

function getCraftedAlchemy(){
  try{
    var raw = localStorage.getItem(LS_ALCHEMY_CRAFT);
    var arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function markAlchemyCrafted(aid){
  var cur = getCraftedAlchemy();
  if(cur.indexOf(aid) === -1){
    cur.push(aid);
    try{ localStorage.setItem(LS_ALCHEMY_CRAFT, JSON.stringify(cur)); }catch(e){}
  }
}

function getAnomalyUsedMap(){
  try{
    var raw = localStorage.getItem(LS_ANOMALY_USED);
    var obj = raw ? JSON.parse(raw) : {};
    return (obj && typeof obj === 'object') ? obj : {};
  }catch(e){ return {}; }
}
function markAnomalyUsed(did, choiceIdx){
  var cur = getAnomalyUsedMap();
  cur[did] = choiceIdx;
  try{ localStorage.setItem(LS_ANOMALY_USED, JSON.stringify(cur)); }catch(e){}
}

function getActiveContracts(){
  try{
    var raw = localStorage.getItem(LS_CONTRACTS);
    var arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function setActiveContracts(list){
  var clean = Array.isArray(list) ? list : [];
  try{ localStorage.setItem(LS_CONTRACTS, JSON.stringify(clean)); }catch(e){}
  syncContractBodyClasses();
  if(typeof window.updateV58HUD === 'function') window.updateV58HUD();
}
function toggleContract(cid){
  var cur = getActiveContracts();
  var idx = cur.indexOf(cid);
  if(idx === -1) cur.push(cid);
  else cur.splice(idx, 1);
  setActiveContracts(cur);
  return cur;
}
function hasContract(cid){
  return getActiveContracts().indexOf(cid) !== -1;
}

function getTrialCrowns(){
  try{
    var raw = localStorage.getItem(LS_TRIAL_CROWNS);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}
function recordTrialCrown(dungeonId, heatLevel){
  if(!dungeonId || heatLevel <= 0) return;
  var crowns = getTrialCrowns();
  var prev = crowns[dungeonId] || 0;
  if(heatLevel > prev){
    crowns[dungeonId] = heatLevel;
    try{ localStorage.setItem(LS_TRIAL_CROWNS, JSON.stringify(crowns)); }catch(e){}
  }
}

function syncContractBodyClasses(){
  if(!document.body) return;
  document.body.classList.toggle('v64-contract-fog', hasContract('contract_fog'));
}

function applyContractsAndRelicsToCurrentState(){
  syncContractBodyClasses();
  if(!window.state) return;
  var active = getActiveContracts();
  var baseMax = state.maxHp || 100;

  /* 古遺物加成 */
  if(hasRelic('relic_flower')){
    baseMax += 25;
    state.hp = (state.hp || 100) + 25;
  }
  if(hasRelic('relic_scale') && active.length > 0){
    var bonus = active.length * 6;
    baseMax += bonus;
    state.hp = (state.hp || 100) + bonus;
  }
  if(hasRelic('relic_watch') && state.countdown != null){
    state.countdown += 15;
  }
  if(hasRelic('relic_prism')){
    state.flags = state.flags || {};
    state.flags._v64Shield = 15;
  }
  if(hasRelic('relic_feather')){
    state.flags = state.flags || {};
    state.flags._v64FeatherReady = true;
  }
  state.maxHp = baseMax;
  state.hp = Math.min(state.maxHp, state.hp || 100);

  /* 8 大契約效果 */
  if(active.indexOf('contract_fragile') !== -1){
    state.maxHp = Math.min(state.maxHp || 100, 60);
    state.hp = Math.min(state.hp || 100, 60);
  }
  if(active.indexOf('contract_haste') !== -1 && state.countdown != null){
    state.countdown = Math.max(15, Math.round(state.countdown * 0.65));
  }
  if(active.indexOf('contract_lone') !== -1){
    if(Array.isArray(state.inventory)){
      state.inventory = state.inventory.filter(function(it){ return it.usage !== 'combat'; });
    }
    if(Array.isArray(state.partyMembers)){
      state.partyMembers = [];
    }
  }

  if(typeof updateHP === 'function') updateHP();
  if(state.countdown != null && typeof updateCountdown === 'function') updateCountdown();
  if(typeof updateV58HUD === 'function') updateV58HUD();
}

/* ============================================================
 * 2. 時空錨點與單步回溯系統（Chrono Anchor & Step Rewind）
 * ============================================================ */
var _stepStacks = {}; /* dungeonId -> Array of snapshots */
var _isRewinding = false;

function captureStateSnapshot(labelOverride){
  if(!window.state || !state.currentScene) return null;
  var did = parseInt(window.currentDungeonId || 1, 10);
  var scObj = window.SCENES && SCENES[state.currentScene];
  var roomTitle = (scObj && scObj.roomName) || ($('room-name') && $('room-name').textContent) || state.currentScene;
  return {
    dungeonId: did,
    sceneId: state.currentScene,
    roomName: roomTitle,
    label: labelOverride || roomTitle,
    savedAt: new Date().toLocaleTimeString('zh-Hant', { hour12: false }),
    hp: state.hp != null ? state.hp : 100,
    maxHp: state.maxHp != null ? state.maxHp : 100,
    stress: state.stress || 0,
    satiety: state.satiety || 0,
    mirrorHp: state.mirrorHp != null ? state.mirrorHp : 100,
    party: state.party,
    adminQuestions: state.adminQuestions,
    countdown: state.countdown,
    resetCount: state.resetCount,
    tide: state.tide,
    echo: state.echo,
    humanity: state.humanity,
    criticScore: state.criticScore,
    inventory: JSON.parse(JSON.stringify(state.inventory || [])),
    flags: JSON.parse(JSON.stringify(state.flags || {})),
    notes: JSON.parse(JSON.stringify(state.notes || [])),
    mapZones: JSON.parse(JSON.stringify(state.mapZones || [])),
    partyMembers: JSON.parse(JSON.stringify(state.partyMembers || [])),
    personality: JSON.parse(JSON.stringify(state.personality || {calm:50,altruism:50,cautious:50}))
  };
}

function pushStepSnapshot(){
  if(_isRewinding || !window.state || !state.currentScene) return;
  var did = parseInt(window.currentDungeonId || 1, 10);
  if(!_stepStacks[did]) _stepStacks[did] = [];
  var stack = _stepStacks[did];
  if(stack.length > 0 && stack[stack.length - 1].sceneId === state.currentScene){
    stack[stack.length - 1] = captureStateSnapshot();
    updateRewindPillCount();
    return;
  }
  var snap = captureStateSnapshot();
  if(snap){
    stack.push(snap);
    if(stack.length > 25) stack.shift();
  }
  updateRewindPillCount();
}

function applyKarmaAndTicketOnRewind(){
  if(!window.state) return;
  if(hasRelic('relic_ticket')){
    state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + 6);
    if(typeof updateHP === 'function') updateHP();
    return;
  }
  if(hasContract('contract_karma')){
    state.hp = Math.max(1, (state.hp || 100) - 8);
    if(typeof updateHP === 'function') updateHP();
  }
}

function applyStateSnapshot(snap){
  if(!snap) return false;
  var did = parseInt(snap.dungeonId || window.currentDungeonId || 1, 10);
  if(window.V61 && typeof V61.ensureDungeonLoaded === 'function'){
    V61.ensureDungeonLoaded(did);
  }
  if(window.currentDungeonId !== did){
    window.currentDungeonId = did;
    window.state = window.stateRefs[did];
    window.SCENES = window.sceneRefs[did];
  }
  if(!window.state) return false;
  _isRewinding = true;
  try{
    state.hp = snap.hp != null ? snap.hp : 100;
    state.maxHp = snap.maxHp != null ? snap.maxHp : 100;
    state.stress = snap.stress || 0;
    state.satiety = snap.satiety || 0;
    state.mirrorHp = snap.mirrorHp != null ? snap.mirrorHp : 100;
    if(snap.party !== undefined) state.party = snap.party;
    if(snap.adminQuestions !== undefined) state.adminQuestions = snap.adminQuestions;
    if(snap.countdown !== undefined) state.countdown = snap.countdown;
    if(snap.resetCount !== undefined) state.resetCount = snap.resetCount;
    if(snap.tide !== undefined) state.tide = snap.tide;
    if(snap.echo !== undefined) state.echo = snap.echo;
    if(snap.humanity !== undefined) state.humanity = snap.humanity;
    if(snap.criticScore !== undefined) state.criticScore = snap.criticScore;
    state.inventory = JSON.parse(JSON.stringify(snap.inventory || []));
    state.flags = JSON.parse(JSON.stringify(snap.flags || {}));
    state.notes = JSON.parse(JSON.stringify(snap.notes || []));
    if(Array.isArray(snap.mapZones) && snap.mapZones.length) state.mapZones = JSON.parse(JSON.stringify(snap.mapZones));
    if(Array.isArray(snap.partyMembers)) state.partyMembers = JSON.parse(JSON.stringify(snap.partyMembers));
    if(snap.personality) state.personality = JSON.parse(JSON.stringify(snap.personality));

    applyKarmaAndTicketOnRewind();

    var es = document.getElementById('ending-screen');
    if(es && es.classList.contains('show')){
      es.classList.remove('show', 'ending-bad', 'ending-good', 'pseudo-ending', 'show-meta', 'glitching');
      if(typeof cleanupEndingEffects === 'function') cleanupEndingEffects();
    }
    var gs = document.getElementById('game-screen');
    if(gs) gs.classList.add('active');
    var tw = document.getElementById('top-wrap');
    if(tw) tw.classList.remove('collapsed');

    if(window.V63 && typeof V63.playSceneTransitionFX === 'function'){
      V63.playSceneTransitionFX('chrono-sweep', true);
    }
    if(typeof updateHP === 'function') updateHP();
    if(state.party !== undefined && typeof updateParty === 'function') updateParty();
    if(state.countdown !== undefined && typeof updateCountdown === 'function') updateCountdown();
    if(typeof updateInventoryUI === 'function') updateInventoryUI();
    if(typeof renderNotes === 'function') renderNotes();
    if(typeof renderMap === 'function') renderMap();
    if(typeof updateD5HUD === 'function') updateD5HUD();
    if(typeof updateV58HUD === 'function') updateV58HUD();

    window.goToScene(snap.sceneId);
    setTimeout(function(){
      if(typeof skipCurrentScene === 'function') skipCurrentScene();
    }, Math.max(340, (typeof trTime === 'function' ? trTime(300) : 300) + 40));
  }finally{
    _isRewinding = false;
    if(!_stepStacks[did]) _stepStacks[did] = [];
    var stArr = _stepStacks[did];
    if(stArr.length === 0 || stArr[stArr.length - 1].sceneId !== snap.sceneId){
      stArr.push(captureStateSnapshot());
    }
    updateRewindPillCount();
  }
  return true;
}

function rewindLastStep(){
  var did = parseInt(window.currentDungeonId || 1, 10);
  var stack = _stepStacks[did] || [];
  if(stack.length === 0){
    if(typeof showToast === 'function') showToast('目前已在門扉起點，尚無可回退的上一步紀錄');
    return false;
  }
  var es = document.getElementById('ending-screen');
  var inEnding = !!(es && es.classList.contains('show'));
  var targetSnap = null;
  if(inEnding){
    targetSnap = stack[stack.length - 1];
  } else {
    if(stack.length > 1 && stack[stack.length - 1].sceneId === (window.state && state.currentScene)){
      stack.pop();
    }
    targetSnap = stack.pop();
  }
  if(!targetSnap){
    if(typeof showToast === 'function') showToast('已回到門扉最初起點');
    return false;
  }
  applyStateSnapshot(targetSnap);
  if(typeof showToast === 'function') showToast('【時空回溯】已回到抉擇節點：' + (targetSnap.roomName || targetSnap.sceneId));
  return true;
}

function getSavedAnchors(did){
  try{
    var all = JSON.parse(localStorage.getItem(LS_ANCHORS) || '{}');
    return Array.isArray(all[did]) ? all[did] : [];
  }catch(e){ return []; }
}

function saveAnchorToSlot(slotIdx, customLabel){
  var did = parseInt(window.currentDungeonId || 1, 10);
  var snap = captureStateSnapshot(customLabel);
  if(!snap) return false;
  try{
    var all = JSON.parse(localStorage.getItem(LS_ANCHORS) || '{}');
    if(!Array.isArray(all[did])) all[did] = [null, null, null];
    all[did][slotIdx] = snap;
    localStorage.setItem(LS_ANCHORS, JSON.stringify(all));
    if(typeof showToast === 'function') showToast('已烙印時空錨點 #' + (slotIdx + 1) + '：' + snap.roomName);
    return true;
  }catch(e){ return false; }
}

function loadAnchorFromSlot(slotIdx){
  var did = parseInt(window.currentDungeonId || 1, 10);
  var list = getSavedAnchors(did);
  var snap = list[slotIdx];
  if(!snap){
    if(typeof showToast === 'function') showToast('此錨點槽位尚無記錄');
    return false;
  }
  applyStateSnapshot(snap);
  if(typeof showToast === 'function') showToast('【錨點躍遷】已回到時空錨點 #' + (slotIdx + 1) + '：' + snap.roomName);
  return true;
}

function updateRewindPillCount(){
  var badge = document.getElementById('v64-rewind-count');
  if(!badge) return;
  var did = parseInt(window.currentDungeonId || 1, 10);
  var stack = _stepStacks[did] || [];
  var steps = Math.max(0, stack.length - 1);
  badge.textContent = steps > 0 ? String(steps) : '0';
}

function openChronoModal(){
  var did = parseInt(window.currentDungeonId || 1, 10);
  var modal = document.getElementById('v64-chrono-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v64-chrono-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  var stack = (_stepStacks[did] || []).slice().reverse();
  var anchors = getSavedAnchors(did);

  var anchorHtml = [0, 1, 2].map(function(idx){
    var a = anchors[idx];
    return '<div class="v64-step-row">' +
      '<div>' +
        '<div style="color:#f5df98;font-weight:600">錨點槽位 #' + (idx + 1) + ' · ' + (a ? a.roomName : '（空槽位）') + '</div>' +
        '<div style="font-size:.68rem;color:var(--text-dim)">' + (a ? ('場景 ' + a.sceneId + ' · HP ' + a.hp + ' · 記錄於 ' + a.savedAt) : '可在關鍵分岔口烙印錨點，隨時跨分支回溯') + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:.35rem">' +
        '<button type="button" class="v4-btn" style="font-size:.7rem;padding:.24rem .55rem" data-v64-save-anchor="' + idx + '">烙印當前</button>' +
        (a ? '<button type="button" class="v4-btn primary" style="font-size:.7rem;padding:.24rem .55rem" data-v64-load-anchor="' + idx + '">躍遷回溯</button>' : '') +
      '</div>' +
    '</div>';
  }).join('');

  var stepHtml = stack.length ? stack.map(function(st, rIdx){
    var origIdx = (_stepStacks[did].length - 1) - rIdx;
    var isCur = (rIdx === 0 && st.sceneId === (window.state && state.currentScene));
    return '<div class="v64-step-row">' +
      '<div>' +
        '<span style="color:var(--accent);font-family:var(--font-mono)">#' + (origIdx + 1) + '</span> ' +
        '<strong style="color:var(--text-bright)">' + st.roomName + '</strong> ' +
        '<span style="font-size:.68rem;color:var(--text-dim)">(' + st.sceneId + ' · HP ' + st.hp + ')</span>' +
      '</div>' +
      (isCur
        ? '<span class="v4-chip gold">當前位置</span>'
        : '<button type="button" class="v4-btn primary" style="font-size:.7rem;padding:.22rem .55rem" data-v64-jump-step="' + origIdx + '">回溯至此步</button>') +
    '</div>';
  }).join('') : '<div style="font-size:.76rem;color:var(--text-dim);padding:.5rem 0">尚無歷史軌跡記錄。</div>';

  modal.innerHTML =
    '<div class="modal-card v4-card wide" style="max-width:660px;border-color:#d4af37">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap">' +
        '<h3 style="margin:0;color:#f5df98;display:flex;align-items:center;gap:.45rem">' + SVG_REWIND + ' <span>時空錨點與單步回溯（第 ' + did + ' 扇門）</span></h3>' +
        '<button type="button" class="v4-btn primary" style="font-size:.73rem;padding:.28rem .68rem" id="v64-modal-rewind-one">立即回退上一步 (Alt+Z)</button>' +
      '</div>' +
      '<div class="v4-sub" style="margin-top:.25rem">免除走錯一步就重開門扉的繁瑣：可隨時烙印 3 個關鍵分岔口錨點，或沿當前軌跡任意回退。</div>' +
      '<div style="max-height:60vh;overflow-y:auto;margin-top:.65rem;padding-right:.2rem">' +
        '<div class="v64-panel-box">' +
          '<div class="v64-box-title"><span>一、手動時空錨點（跨分支自由存取）</span><span style="font-size:.68rem;color:var(--text-dim)">3 組獨立槽位</span></div>' +
          anchorHtml +
        '</div>' +
        '<div class="v64-panel-box">' +
          '<div class="v64-box-title"><span>二、本輪步伐軌跡（自動記錄最近 25 步）</span><span style="font-size:.68rem;color:var(--text-dim)">點擊任意節點直接回溯</span></div>' +
          stepHtml +
        '</div>' +
      '</div>' +
      '<div class="v4-actions end" style="margin-top:.75rem">' +
        '<button type="button" class="v4-btn primary" onclick="document.getElementById(\'v64-chrono-modal\').classList.remove(\'show\')">關 閉</button>' +
      '</div>' +
    '</div>';

  var rwOne = modal.querySelector('#v64-modal-rewind-one');
  if(rwOne){
    rwOne.onclick = function(){
      modal.classList.remove('show');
      rewindLastStep();
    };
  }
  modal.querySelectorAll('[data-v64-save-anchor]').forEach(function(b){
    b.onclick = function(){
      var idx = parseInt(b.getAttribute('data-v64-save-anchor'), 10);
      saveAnchorToSlot(idx);
      openChronoModal();
    };
  });
  modal.querySelectorAll('[data-v64-load-anchor]').forEach(function(b){
    b.onclick = function(){
      var idx = parseInt(b.getAttribute('data-v64-load-anchor'), 10);
      modal.classList.remove('show');
      loadAnchorFromSlot(idx);
    };
  });
  modal.querySelectorAll('[data-v64-jump-step]').forEach(function(b){
    b.onclick = function(){
      var idx = parseInt(b.getAttribute('data-v64-jump-step'), 10);
      var stackArr = _stepStacks[did] || [];
      var target = stackArr[idx];
      if(target){
        _stepStacks[did] = stackArr.slice(0, idx + 1);
        modal.classList.remove('show');
        applyStateSnapshot(target);
        if(typeof showToast === 'function') showToast('【軌跡回溯】已回到第 #' + (idx + 1) + ' 步：' + target.roomName);
      }
    };
  });

  modal.classList.add('show');
}

/* ============================================================
 * 3. 門扉現場推演雷達、環境凝視、守門人對弈、奇遇商人與因果煉成台
 * ============================================================ */
function extractChoiceTargetScene(ch){
  if(!ch) return null;
  if(ch.next && window.SCENES && SCENES[ch.next]) return ch.next;
  if(ch.action){
    var s = String(ch.action);
    var m = s.match(/goToScene\(\s*['"]([^'"]+)['"]\s*\)/);
    if(m && window.SCENES && SCENES[m[1]]) return m[1];
  }
  return null;
}

function getAllOutgoingSceneIds(scObj){
  if(!scObj || !window.SCENES) return [];
  var out = [];
  var chs = (typeof scObj.choices === 'function') ? (scObj.choices(window.state) || []) : (scObj.choices || []);
  chs.forEach(function(c){
    var t = extractChoiceTargetScene(c);
    if(t && out.indexOf(t) === -1) out.push(t);
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

function isSceneVisitedInStorage(sceneKey, scObj){
  if(!scObj && window.SCENES) scObj = SCENES[sceneKey];
  var sid = (scObj && scObj.sceneId) || sceneKey;
  if(typeof window.isSceneRead === 'function' && (isSceneRead(sid) || isSceneRead(sceneKey))) return true;
  return false;
}

function analyzeCurrentGateProgress(){
  var did = parseInt(window.currentDungeonId || 1, 10);
  if(window.V61 && typeof V61.ensureDungeonLoaded === 'function') V61.ensureDungeonLoaded(did);
  var scMap = (window.sceneRefs && sceneRefs[did]) || window.SCENES || {};
  var keys = Object.keys(scMap);
  var visitedCount = 0;
  var unvisitedFrontiers = [];

  keys.forEach(function(k){
    var sc = scMap[k];
    var vis = isSceneVisitedInStorage(k, sc) || (window.state && state.currentScene === k);
    if(vis){
      visitedCount++;
      var outs = getAllOutgoingSceneIds(sc);
      outs.forEach(function(tk){
        var tsc = scMap[tk];
        if(tsc && !isSceneVisitedInStorage(tk, tsc)){
          unvisitedFrontiers.push({
            fromKey: k,
            fromName: sc.roomName || k,
            toKey: tk,
            toName: tsc.roomName || tk
          });
        }
      });
    }
  });

  var endTotal = (window.ENDING_TOTALS && ENDING_TOTALS[did]) || 0;
  var endFound = (typeof getEndingLog === 'function')
    ? getEndingLog().filter(function(e){ return e.indexOf(String(did) + '|') === 0; }).length
    : 0;

  return {
    did: did,
    totalScenes: keys.length,
    visitedScenes: visitedCount,
    unvisitedFrontiers: unvisitedFrontiers,
    endFound: endFound,
    endTotal: endTotal
  };
}

function buildClueDeductions(){
  if(!window.state) return [];
  var did = parseInt(window.currentDungeonId || 1, 10);
  var storyItems = (state.inventory || []).filter(function(i){ return i.usage !== 'combat' && i.id !== 'all_seeing_eye'; });
  var tips = [];

  if(storyItems.length === 0){
    tips.push('目前尚未取得本門扉專屬劇情信物。建議優先點擊帶有「• 未探分支」標記的選項搜集現場線索。');
  } else {
    storyItems.forEach(function(it){
      tips.push('持有信物【' + it.name + '】：' + (it.usage && it.usage !== 'passive' ? it.usage : it.desc));
    });
  }

  if(typeof window.getTrueEndingGapHint === 'function'){
    tips.push('【真結局推演指引】' + window.getTrueEndingGapHint(did));
  }
  return tips;
}

function buildGateEnvAndRiddleHTML(did){
  var envList = GATE_ENV_DETAILS[did] || GATE_ENV_DETAILS[1];
  var foundArr = getFoundEnvGaze();
  var solvedMap = getSolvedRiddles();
  var riddle = GATE_RIDDLES[did] || GATE_RIDDLES[1];
  var isRiddleSolved = !!solvedMap[did];
  var healAmt = hasRelic('relic_film') ? 10 : 5;

  var envCards = envList.map(function(item){
    var isFound = foundArr.indexOf(item.id) !== -1;
    return '<div class="v64-contract-card ' + (isFound ? 'active' : '') + '" data-v64-env="' + item.id + '" style="margin-bottom:.4rem">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.22rem">' +
        '<strong style="font-size:.79rem;color:' + (isFound ? '#f5df98' : 'var(--text-bright)') + '">• ' + item.title + '</strong>' +
        '<span class="v4-chip ' + (isFound ? 'gold' : '') + '">' + (isFound ? '已勘查 ✓' : ('點擊凝視 (+' + healAmt + ' HP)')) + '</span>' +
      '</div>' +
      '<div style="font-size:.74rem;color:' + (isFound ? 'var(--text-bright)' : 'var(--text-dim)') + ';line-height:1.55">' +
        (isFound ? item.text : ('尚未凝視此處環境細節。點擊即可勘查現場銘文並恢復 ' + healAmt + ' 點生命值。')) +
      '</div>' +
    '</div>';
  }).join('');

  var riddleOpts = riddle.opts.map(function(optText, idx){
    var isAns = (idx === riddle.ans);
    var label = (isRiddleSolved && isAns) ? ('✓ ' + optText) : ('• ' + optText);
    return '<button type="button" class="v4-btn ' + (isRiddleSolved && isAns ? 'primary' : '') + '" data-v64-riddle-opt="' + idx + '" style="text-align:left;justify-content:flex-start;width:100%;margin-bottom:.32rem;font-size:.75rem;padding:.38rem .65rem">' +
      label +
    '</button>';
  }).join('');

  /* 六、迴廊時空奇遇與殘影商人 */
  var anom = GATE_ANOMALY_EVENTS[did] || GATE_ANOMALY_EVENTS[1];
  var usedMap = getAnomalyUsedMap();
  var chosenIdx = usedMap[did];
  var anomBtns = anom.choices.map(function(ch, idx){
    var picked = (chosenIdx === idx);
    return '<button type="button" class="v4-btn ' + (picked ? 'primary' : '') + '" data-v64-anom-opt="' + idx + '" style="text-align:left;justify-content:flex-start;width:100%;margin-bottom:.32rem;font-size:.75rem;padding:.38rem .65rem">' +
      (picked ? '✓ ' : '▸ ') + ch.label +
    '</button>';
  }).join('');

  /* 七、跨門扉因果煉成台 */
  var craftedArr = getCraftedAlchemy();
  var totalEnv = foundArr.length;
  var totalRid = Object.keys(solvedMap).length;
  var curShards = (typeof window.getMemoryShards === 'function') ? window.getMemoryShards() : 0;

  var alchRows = ALCHEMY_RECIPES.map(function(rec){
    var done = craftedArr.indexOf(rec.id) !== -1;
    var canCraft = (totalEnv >= rec.reqEnv && totalRid >= rec.reqRiddle && curShards >= rec.shardCost);
    return '<div class="v64-step-row" style="flex-wrap:wrap">' +
      '<div style="flex:1 1 240px">' +
        '<div style="color:' + (done ? '#8de0a8' : '#f5df98') + ';font-weight:600">' + SVG_ALCH + ' ' + rec.name + (done ? ' ✓ 已煉成' : '') + '</div>' +
        '<div style="font-size:.69rem;color:var(--text-dim);margin-top:.12rem">需求：凝視 ' + rec.reqEnv + ' 處 · 破謎 ' + rec.reqRiddle + ' 道 · 記憶碎片 ' + rec.shardCost + ' 枚</div>' +
        '<div style="font-size:.72rem;color:var(--text-bright);margin-top:.15rem">' + rec.rewardText + '</div>' +
      '</div>' +
      '<div>' +
        '<button type="button" class="v4-btn ' + (canCraft || done ? 'primary' : '') + '" style="font-size:.7rem;padding:.26rem .6rem" data-v64-alchemy="' + rec.id + '">' +
          (done ? '再次共鳴（免費回血）' : (canCraft ? '立即煉成' : '條件未滿')) +
        '</button>' +
      '</div>' +
    '</div>';
  }).join('');

  return '<div class="v64-panel-box">' +
    '<div class="v64-box-title"><span>四、現場環境凝視與隱藏銘文（本門 3 處 · 全迴廊已探 ' + foundArr.length + ' / 39）</span><span style="font-size:.68rem;color:#d4af37">點擊調查細節</span></div>' +
    envCards +
  '</div>' +
  '<div class="v64-panel-box">' +
    '<div class="v64-box-title"><span>五、守門人殘響對弈（全迴廊已破 ' + Object.keys(solvedMap).length + ' / 13）</span><span class="v4-chip ' + (isRiddleSolved ? 'gold' : '') + '">' + (isRiddleSolved ? '真知刻印已點亮 ✓' : '破解獲 +15 HP 與記憶碎片') + '</span></div>' +
    '<div style="font-size:.78rem;color:var(--text-bright);line-height:1.6;margin-bottom:.45rem">' + riddle.q + '</div>' +
    riddleOpts +
    (isRiddleSolved ? '<div style="font-size:.73rem;color:#8de0a8;margin-top:.3rem;line-height:1.5">✓ 守門人共鳴提示：' + riddle.hint + '</div>' : '') +
  '</div>' +
  '<div class="v64-panel-box">' +
    '<div class="v64-box-title"><span>六、迴廊時空奇遇與殘影商人（第 ' + did + ' 扇門專屬奇遇）</span><span class="v4-chip ' + (chosenIdx !== undefined ? 'gold' : '') + '">' + (chosenIdx !== undefined ? '本門奇遇已締約 ✓' : '可隨時締約獲得即時支援') + '</span></div>' +
    '<div style="font-size:.79rem;color:#f5df98;font-weight:600;margin-bottom:.22rem">' + anom.title + '</div>' +
    '<div style="font-size:.74rem;color:var(--text-bright);line-height:1.58;margin-bottom:.48rem">' + anom.desc + '</div>' +
    anomBtns +
  '</div>' +
  '<div class="v64-panel-box">' +
    '<div class="v64-box-title"><span>七、跨門扉因果煉成台（已煉成 ' + craftedArr.length + ' / ' + ALCHEMY_RECIPES.length + ' 聖印 · 持有碎片 ' + curShards + ' 枚）</span></div>' +
    alchRows +
  '</div>';
}

function openRadarModal(){
  var modal = document.getElementById('v64-radar-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v64-radar-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  var stat = analyzeCurrentGateProgress();
  var curKey = (window.state && state.currentScene) || 'prelude';
  var curSc = (window.SCENES && SCENES[curKey]) || {};
  var outs = getAllOutgoingSceneIds(curSc);

  var outPills = outs.length ? outs.map(function(tk){
    var tsc = window.SCENES && SCENES[tk];
    var vis = isSceneVisitedInStorage(tk, tsc);
    return '<span class="v64-radar-node-pill ' + (vis ? '' : 'unvisited') + '">' +
      (vis ? '✓ 已踏足：' : '• 未探分支：') + ((tsc && tsc.roomName) || tk) +
    '</span>';
  }).join(' ') : '<span style="font-size:.75rem;color:var(--text-dim)">此處為終點或結局場景</span>';

  var frontierRows = stat.unvisitedFrontiers.slice(0, 8).map(function(f){
    return '<div class="v64-step-row">' +
      '<div>' +
        '<span style="color:var(--text-dim)">已探節點</span> <strong style="color:var(--text-bright)">' + f.fromName + '</strong> ' +
        '<span style="color:#d4af37">→ 未探分支：' + f.toName + '</span>' +
      '</div>' +
      '<button type="button" class="v4-btn primary" style="font-size:.7rem;padding:.22rem .55rem" data-v64-frontier="' + f.fromKey + '">躍遷至分岔口</button>' +
    '</div>';
  }).join('');

  var deductions = buildClueDeductions().map(function(d){
    return '<div style="font-size:.77rem;line-height:1.6;color:var(--text-bright);padding:.32rem 0;border-bottom:1px dashed rgba(255,255,255,.07)">• ' + d + '</div>';
  }).join('');

  modal.innerHTML =
    '<div class="modal-card v4-card wide" style="max-width:700px;border-color:#d4af37">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap">' +
        '<h3 style="margin:0;color:#f5df98;display:flex;align-items:center;gap:.45rem">' + SVG_RADAR + ' <span>門扉現場推演雷達與萬象羅盤（第 ' + stat.did + ' 扇門）</span></h3>' +
        '<span class="v4-chip gold">探索度 ' + stat.visitedScenes + ' / ' + stat.totalScenes + ' 場景 · 結局 ' + stat.endFound + ' / ' + stat.endTotal + '</span>' +
      '</div>' +
      '<div class="v4-sub" style="margin-top:.25rem">即時分析當前房間連接拓撲、尚未踏足的隱藏分岔口、環境銘文凝視、守門人對弈、奇遇商人與因果煉成。</div>' +
      '<div style="max-height:64vh;overflow-y:auto;margin-top:.65rem;padding-right:.2rem">' +
        '<div class="v64-panel-box">' +
          '<div class="v64-box-title"><span>一、當前房間分支拓撲：' + (curSc.roomName || curKey) + '</span><button type="button" class="v4-btn" style="font-size:.68rem;padding:.18rem .5rem" id="v64-open-full-branch">開啟完整分支樹</button></div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.35rem">' + outPills + '</div>' +
        '</div>' +
        '<div class="v64-panel-box">' +
          '<div class="v64-box-title"><span>二、未探索分岔口導航（共 ' + stat.unvisitedFrontiers.length + ' 處待探索分支）</span><span style="font-size:.68rem;color:var(--text-dim)">一鍵回到已解鎖分岔點</span></div>' +
          (frontierRows || '<div style="font-size:.76rem;color:var(--text-dim);padding:.35rem 0">目前已踏足房間的所有相鄰分支皆已探索完畢！</div>') +
        '</div>' +
        '<div class="v64-panel-box">' +
          '<div class="v64-box-title"><span>三、現場線索與真結局推演盤</span><button type="button" class="v4-btn" style="font-size:.68rem;padding:.18rem .5rem" id="v64-open-loadout-from-radar">古遺物與契約配裝</button></div>' +
          deductions +
        '</div>' +
        buildGateEnvAndRiddleHTML(stat.did) +
      '</div>' +
      '<div class="v4-actions end" style="margin-top:.75rem">' +
        '<button type="button" class="v4-btn primary" onclick="document.getElementById(\'v64-radar-modal\').classList.remove(\'show\')">關 閉</button>' +
      '</div>' +
    '</div>';

  var fbBtn = modal.querySelector('#v64-open-full-branch');
  if(fbBtn){
    fbBtn.onclick = function(){
      modal.classList.remove('show');
      if(typeof openBranchTree === 'function') openBranchTree();
    };
  }
  var ldBtn = modal.querySelector('#v64-open-loadout-from-radar');
  if(ldBtn){
    ldBtn.onclick = function(){
      modal.classList.remove('show');
      openTrialContractsModal('relics');
    };
  }
  modal.querySelectorAll('[data-v64-env]').forEach(function(card){
    card.onclick = function(){
      var eid = card.getAttribute('data-v64-env');
      var healAmt = hasRelic('relic_film') ? 10 : 5;
      if(markEnvGazeFound(eid)){
        if(window.state){
          var maxH = state.maxHp || 100;
          state.hp = Math.min(maxH, (state.hp || 100) + healAmt);
          if(typeof updateHP === 'function') updateHP();
        }
        if(typeof showToast === 'function') showToast('【環境凝視】發現隱藏現場銘文，生命值恢復 +' + healAmt + ' HP');
      }
      openRadarModal();
    };
  });
  modal.querySelectorAll('[data-v64-riddle-opt]').forEach(function(btn){
    btn.onclick = function(){
      var idx = parseInt(btn.getAttribute('data-v64-riddle-opt'), 10);
      var riddle = GATE_RIDDLES[stat.did] || GATE_RIDDLES[1];
      if(idx === riddle.ans){
        if(markRiddleSolved(stat.did)){
          var healAmt = hasRelic('relic_key') ? 30 : 15;
          var shardAmt = hasRelic('relic_key') ? 2 : 1;
          if(window.state){
            var maxH = state.maxHp || 100;
            state.hp = Math.min(maxH, (state.hp || 100) + healAmt);
            if(typeof updateHP === 'function') updateHP();
          }
          if(typeof window.addMemoryShards === 'function') window.addMemoryShards(shardAmt);
          if(typeof showToast === 'function') showToast('【守門人推演成功】點亮本門「真知刻印」，恢復 +' + healAmt + ' HP 並獲贈 ' + shardAmt + ' 枚記憶碎片！');
        } else {
          if(typeof showToast === 'function') showToast('【真知共鳴】' + riddle.hint);
        }
        openRadarModal();
      } else {
        if(typeof showToast === 'function') showToast('推演方向有誤，請結合「現場環境凝視」的銘文線索再次思索。');
      }
    };
  });
  modal.querySelectorAll('[data-v64-anom-opt]').forEach(function(btn){
    btn.onclick = function(){
      var idx = parseInt(btn.getAttribute('data-v64-anom-opt'), 10);
      var anom = GATE_ANOMALY_EVENTS[stat.did] || GATE_ANOMALY_EVENTS[1];
      var ch = anom.choices[idx];
      if(!ch) return;
      var msg = ch.act ? ch.act() : '已完成迴廊奇遇締約。';
      if(hasRelic('relic_bell') && window.state){
        state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + 6);
        if(typeof updateHP === 'function') updateHP();
      }
      markAnomalyUsed(stat.did, idx);
      if(typeof showToast === 'function') showToast(msg);
      openRadarModal();
    };
  });
  modal.querySelectorAll('[data-v64-alchemy]').forEach(function(btn){
    btn.onclick = function(){
      var aid = btn.getAttribute('data-v64-alchemy');
      var rec = ALCHEMY_RECIPES.find(function(r){ return r.id === aid; });
      if(!rec) return;
      var crafted = getCraftedAlchemy();
      var already = crafted.indexOf(aid) !== -1;
      var totalEnv = getFoundEnvGaze().length;
      var totalRid = Object.keys(getSolvedRiddles()).length;
      var curShards = (typeof window.getMemoryShards === 'function') ? window.getMemoryShards() : 0;

      if(!already && (totalEnv < rec.reqEnv || totalRid < rec.reqRiddle || curShards < rec.shardCost)){
        if(typeof showToast === 'function'){
          showToast('煉成條件未滿：需凝視 ' + rec.reqEnv + ' 處（現 ' + totalEnv + '）、破謎 ' + rec.reqRiddle + ' 道（現 ' + totalRid + '）、碎片 ' + rec.shardCost + ' 枚');
        }
        return;
      }
      if(!already){
        if(typeof window.addMemoryShards === 'function') window.addMemoryShards(-rec.shardCost);
        markAlchemyCrafted(aid);
        if(rec.shards && typeof window.addMemoryShards === 'function') window.addMemoryShards(rec.shards);
      }
      if(window.state){
        if(rec.maxHp && !already){
          state.maxHp = (state.maxHp || 100) + rec.maxHp;
        }
        if(rec.heal){
          state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + (already ? 15 : rec.heal));
        }
        if(rec.cd && state.countdown != null){
          state.countdown += rec.cd;
          if(typeof updateCountdown === 'function') updateCountdown();
        }
        if(rec.echo && state.echo != null){
          state.echo += rec.echo;
          if(typeof updateD5HUD === 'function') updateD5HUD();
        }
        if(rec.shield){
          state.flags = state.flags || {};
          state.flags._v64Shield = (state.flags._v64Shield || 0) + rec.shield;
        }
        if(rec.partyHeal && Array.isArray(state.partyMembers)){
          state.partyMembers.forEach(function(m){ m.alive = true; m.hp = m.maxHp || 100; });
        }
        if(typeof updateHP === 'function') updateHP();
      }
      if(rec.stress && typeof window.addStress === 'function') window.addStress(rec.stress);
      if(typeof updateV58HUD === 'function') updateV58HUD();
      if(typeof showToast === 'function') showToast('【因果煉成共鳴】' + rec.name + '：' + rec.rewardText);
      openRadarModal();
    };
  });
  modal.querySelectorAll('[data-v64-frontier]').forEach(function(b){
    b.onclick = function(){
      var fk = b.getAttribute('data-v64-frontier');
      if(fk && window.SCENES && SCENES[fk]){
        modal.classList.remove('show');
        pushStepSnapshot();
        window.goToScene(fk);
        if(typeof showToast === 'function') showToast('【分岔口躍遷】已前往未探分支起點：' + (SCENES[fk].roomName || fk));
      }
    };
  });

  modal.classList.add('show');
}

/* ============================================================
 * 4. 試煉契約與 12 大古遺物配裝彈窗（Hub、手札與遊戲內皆可開啟）
 * ============================================================ */
var _contractsModalTab = 'contracts';
function openTrialContractsModal(defaultTab){
  if(defaultTab === 'relics' || defaultTab === 'contracts') _contractsModalTab = defaultTab;
  var modal = document.getElementById('v64-contracts-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v64-contracts-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  var active = getActiveContracts();
  var equipped = getEquippedRelics();
  var crowns = getTrialCrowns();

  var contractCardsHtml = TRIAL_CONTRACT_DEFS.map(function(c){
    var isOn = active.indexOf(c.id) !== -1;
    return '<div class="v64-contract-card ' + (isOn ? 'active' : '') + '" data-v64-contract="' + c.id + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem">' +
        '<strong style="color:' + (isOn ? '#f5df98' : 'var(--text-bright)') + ';font-size:.84rem">' + SVG_CROWN + ' ' + c.name + '</strong>' +
        '<span class="v4-chip ' + (isOn ? 'gold' : '') + '">' + (isOn ? '已簽署 ✓' : '點擊啟用') + '</span>' +
      '</div>' +
      '<div style="font-size:.74rem;color:var(--text-dim);line-height:1.55">' + c.desc + '</div>' +
    '</div>';
  }).join('');

  var relicCardsHtml = CORRIDOR_RELIC_DEFS.map(function(r){
    var isEq = equipped.indexOf(r.id) !== -1;
    return '<div class="v64-contract-card ' + (isEq ? 'active' : '') + '" data-v64-relic="' + r.id + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.22rem">' +
        '<strong style="color:' + (isEq ? '#f5df98' : 'var(--text-bright)') + ';font-size:.82rem">' + SVG_RELIC + ' ' + r.name + '</strong>' +
        '<span class="v4-chip ' + (isEq ? 'gold' : '') + '">' + (isEq ? '已佩掛 ✓' : '佩掛') + '</span>' +
      '</div>' +
      '<div style="font-size:.66rem;color:#d4af37;margin-bottom:.25rem">' + r.origin + '</div>' +
      '<div style="font-size:.73rem;color:var(--text-dim);line-height:1.52">' + r.desc + '</div>' +
    '</div>';
  }).join('');

  var crownBadges = (window.dungeons || []).map(function(d){
    var lv = crowns[d.id] || 0;
    var isHid = (window.V61 && typeof V61.getDungeonDisplayState === 'function' && V61.getDungeonDisplayState(d.id) === 'hidden' && !window._gmUnlocked);
    var nm = isHid ? ('第 ' + d.id + ' 扇門 · ？？？') : ('第 ' + d.id + ' 扇門 · ' + d.name);
    return '<span class="v64-radar-node-pill ' + (lv > 0 ? 'unvisited' : '') + '" style="font-size:.7rem">' +
      nm + (lv > 0 ? (' • 試煉 ×' + lv) : ' · 未達成') +
    '</span>';
  }).join(' ');

  var bodyContent = (_contractsModalTab === 'relics')
    ? ('<div class="v4-sub">出征前或探索途中可自由佩掛最多 <strong>3 件迴廊古遺物</strong>，為 13 扇門提供被動庇護、關鍵因果導航與替死共鳴：</div>' +
       '<div class="v64-card-grid" style="margin-top:.55rem">' + relicCardsHtml + '</div>')
    : ('<div class="v4-sub">在不增加額外章節的前提下，可自由為既有 13 扇門疊加 8 大試煉契約。帶著契約達成結局將額外獎勵記憶碎片並點亮門扉「試煉金冠」：</div>' +
       '<div class="v64-card-grid" style="margin-top:.55rem">' + contractCardsHtml + '</div>' +
       '<div class="v64-panel-box" style="margin-top:.75rem">' +
         '<div class="v64-box-title"><span>各門扉試煉金冠紀錄</span></div>' +
         '<div style="display:flex;flex-wrap:wrap;gap:.35rem">' + crownBadges + '</div>' +
       '</div>');

  modal.innerHTML =
    '<div class="modal-card v4-card wide" style="max-width:700px;border-color:#d4af37">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap">' +
        '<h3 style="margin:0;color:#f5df98;display:flex;align-items:center;gap:.45rem">' + SVG_CROWN + ' <span>迴廊試煉契約與古遺物刻印配裝</span></h3>' +
        '<div style="display:flex;gap:.35rem;flex-wrap:wrap">' +
          '<span class="v4-chip gold">佩掛遺物：' + equipped.length + ' / 3</span>' +
          '<span class="v4-chip gold">啟用契約：' + active.length + ' / 8</span>' +
        '</div>' +
      '</div>' +
      '<div class="v64-sub-tabs">' +
        '<button type="button" class="v64-sub-tab ' + (_contractsModalTab === 'contracts' ? 'on' : '') + '" data-v64-ctab="contracts">' + SVG_CROWN + ' 8 大迴廊試煉契約</button>' +
        '<button type="button" class="v64-sub-tab ' + (_contractsModalTab === 'relics' ? 'on' : '') + '" data-v64-ctab="relics">' + SVG_RELIC + ' 12 大跨門扉古遺物配裝（' + equipped.length + '/3）</button>' +
      '</div>' +
      '<div style="max-height:58vh;overflow-y:auto;padding-right:.2rem">' +
        bodyContent +
      '</div>' +
      '<div class="v4-actions end" style="margin-top:.75rem">' +
        (_contractsModalTab === 'contracts' && active.length > 0 ? '<button type="button" class="v4-btn" id="v64-clear-contracts">全部解除契約</button>' : '') +
        (_contractsModalTab === 'relics' && equipped.length > 0 ? '<button type="button" class="v4-btn" id="v64-clear-relics">全部卸下遺物</button>' : '') +
        '<button type="button" class="v4-btn primary" onclick="document.getElementById(\'v64-contracts-modal\').classList.remove(\'show\')">完 成</button>' +
      '</div>' +
    '</div>';

  modal.querySelectorAll('[data-v64-ctab]').forEach(function(tb){
    tb.onclick = function(){
      openTrialContractsModal(tb.getAttribute('data-v64-ctab'));
    };
  });
  modal.querySelectorAll('[data-v64-contract]').forEach(function(card){
    card.onclick = function(){
      var cid = card.getAttribute('data-v64-contract');
      toggleContract(cid);
      applyContractsAndRelicsToCurrentState();
      openTrialContractsModal('contracts');
    };
  });
  modal.querySelectorAll('[data-v64-relic]').forEach(function(card){
    card.onclick = function(){
      var rid = card.getAttribute('data-v64-relic');
      toggleRelic(rid);
      applyContractsAndRelicsToCurrentState();
      if(window.state && window.SCENES && state.currentScene && SCENES[state.currentScene]){
        var chs = (typeof SCENES[state.currentScene].choices === 'function') ? SCENES[state.currentScene].choices(state) : SCENES[state.currentScene].choices;
        if(typeof renderChoices === 'function' && chs) renderChoices(chs);
      }
      openTrialContractsModal('relics');
    };
  });
  var clrBtn = modal.querySelector('#v64-clear-contracts');
  if(clrBtn){
    clrBtn.onclick = function(){
      setActiveContracts([]);
      openTrialContractsModal('contracts');
    };
  }
  var clrRel = modal.querySelector('#v64-clear-relics');
  if(clrRel){
    clrRel.onclick = function(){
      setEquippedRelics([]);
      openTrialContractsModal('relics');
    };
  }
  modal.classList.add('show');
}

/* ============================================================
 * 5. 極簡秩序 UI 組裝：重構頂欄、底欄、收納輔助選單、折疊手札跳轉列、分離劇情信物與戰術道具
 * ============================================================ */
function setupDeclutteredTopAndHubBars(){
  /* A. 將遊戲內 .top-bar-right 從 11 個按鈕精簡為 6 個核心按鈕（話、包、圖、札、典、選），其餘收納進「典」萬象抽屜 */
  var topRight = document.querySelector('#game-screen .top-bar-right');
  var drawer = document.querySelector('#game-screen .v53-more-drawer');
  if(topRight && drawer){
    var topChildren = Array.prototype.slice.call(topRight.children);
    topChildren.forEach(function(el){
      if(el.classList.contains('v53-more-wrap')) return;
      var oc = el.getAttribute('onclick') || '';
      var ttl = el.getAttribute('title') || '';
      var isCore = (
        oc.indexOf('openDialogPanel') !== -1 ||
        oc.indexOf('toggleInventory') !== -1 ||
        oc.indexOf('toggleMap') !== -1 ||
        oc.indexOf('openPause') !== -1 ||
        el.classList.contains('v4-nb-btn')
      );
      if(!isCore){
        /* 加上易讀短標籤並移入「典」萬象抽屜 */
        if(el.id === 'v63-top-theater-btn') el.textContent = '轉場';
        else if(oc.indexOf('openSaveModal') !== -1) el.textContent = '存檔';
        else if(oc.indexOf('openLoadModal') !== -1) el.textContent = '讀檔';
        else if(oc.indexOf('openSettings') !== -1) el.textContent = '設定';
        else if(ttl.indexOf('語言') !== -1) el.innerHTML = '語言';
        drawer.appendChild(el);
      }
    });
    /* 為抽屜內原有的單字按鈕補上清晰雙字標籤 */
    Array.prototype.slice.call(drawer.querySelectorAll('.icon-btn')).forEach(function(b){
      var oc = b.getAttribute('onclick') || '';
      if(oc.indexOf('openNotes') !== -1) b.textContent = '筆記';
      else if(oc.indexOf('openAchievements') !== -1) b.textContent = '成就';
      else if(oc.indexOf('openHistory') !== -1) b.textContent = '回顧';
      else if(oc.indexOf('openBranchTree') !== -1) b.textContent = '分支';
      else if(b.classList.contains('v5-cmd-btn')) b.textContent = '指令';
    });
  }

  /* B. 修復並統一主選單「繼續上次」按鈕，支援全部 1–13 扇門，消除雙重按鈕 */
  window.resumeLastPlayedScene = function(){
    if(window.V62 && typeof V62.continueLastSession === 'function'){
      if(V62.continueLastSession()) return;
    }
    var latest = null, latestDid = 1;
    var lastDid = parseInt(localStorage.getItem('wuxian-v58-last-did') || '0', 10);
    if(lastDid >= 1 && window.DUNGEON_CONFIG && DUNGEON_CONFIG[lastDid]){
      try{
        var raw0 = localStorage.getItem(DUNGEON_CONFIG[lastDid].savePrefix + '-auto');
        if(raw0){ latest = JSON.parse(raw0); latestDid = lastDid; }
      }catch(e){}
    }
    if(!latest && window.DUNGEON_CONFIG){
      for(var d = 1; d <= 13; d++){
        if(!DUNGEON_CONFIG[d]) continue;
        try{
          var raw = localStorage.getItem(DUNGEON_CONFIG[d].savePrefix + '-auto');
          if(raw){ latest = JSON.parse(raw); latestDid = d; break; }
        }catch(e){}
      }
    }
    if(!latest){
      if(typeof showToast === 'function') showToast('尚無上次遊玩的自動存檔記錄，將為你開啟第一扇門');
      window.enterDungeon(1, true, true);
      return;
    }
    window.enterDungeon(latestDid, false, true);
    setTimeout(function(){
      var gts = document.getElementById('game-title-screen');
      var gs = document.getElementById('game-screen');
      if(gts) gts.classList.remove('active');
      if(gs) gs.classList.add('active');
      if(typeof applySaveData === 'function') applySaveData(latest);
      if(typeof showToast === 'function') showToast('已快速恢復上次場景：' + (latest.roomName || latest.currentScene));
    }, 260);
  };

  var v58Resume = document.getElementById('v58-quick-resume-btn');
  var v62Resume = document.getElementById('v62-continue-last-btn');
  if(v58Resume && v62Resume && v62Resume.classList.contains('show')){
    v58Resume.classList.add('v64-merged-hidden');
  }
}

function setupDeclutteredBottomBar(){
  var center = document.getElementById('game-bottom-center');
  if(!center || document.getElementById('v64-reading-popover')) return;

  var pop = document.createElement('div');
  pop.id = 'v64-reading-popover';
  pop.innerHTML =
    '<div class="v64-popover-hdr">' +
      '<span>閱讀、視角與戰術輔助面板</span>' +
      '<button type="button" class="v4-btn" style="font-size:.66rem;padding:.12rem .45rem" id="v64-popover-close">收起</button>' +
    '</div>' +
    '<div class="v64-popover-grid" id="v64-popover-grid"></div>';
  document.body.appendChild(pop);

  var grid = document.getElementById('v64-popover-grid');
  var moveIds = [
    'v59-quick-autoread',
    'v59-quick-split',
    'v58-quick-maxread',
    'v58-quick-lookback',
    'v58-quick-tts',
    'v58-quick-compass',
    'v58-quick-font-dec',
    'v58-quick-font-inc',
    'random-choice-btn'
  ];
  moveIds.forEach(function(id){
    var el = document.getElementById(id);
    if(el && grid) grid.appendChild(el);
  });

  var cbBtn = document.createElement('button');
  cbBtn.type = 'button';
  cbBtn.className = 'v58-Quick-btn';
  cbBtn.innerHTML = '<span>道具遭遇戰</span>';
  cbBtn.onclick = function(){
    pop.classList.remove('open');
    if(window.V62 && typeof V62.startDungeonCombat === 'function') V62.startDungeonCombat();
  };
  grid.appendChild(cbBtn);

  var ctBtn = document.createElement('button');
  ctBtn.type = 'button';
  ctBtn.className = 'v58-Quick-btn';
  ctBtn.innerHTML = SVG_CROWN + '<span>契約與遺物</span>';
  ctBtn.onclick = function(){
    pop.classList.remove('open');
    openTrialContractsModal('contracts');
  };
  grid.appendChild(ctBtn);

  var rlBtn = document.createElement('button');
  rlBtn.type = 'button';
  rlBtn.className = 'v58-Quick-btn';
  rlBtn.innerHTML = SVG_RELIC + '<span>古遺物配裝</span>';
  rlBtn.onclick = function(){
    pop.classList.remove('open');
    openTrialContractsModal('relics');
  };
  grid.appendChild(rlBtn);

  var btnRewind = document.createElement('button');
  btnRewind.type = 'button';
  btnRewind.id = 'v64-rewind-btn';
  btnRewind.className = 'v64-bottom-pill primary-gold';
  btnRewind.title = '時空錨點與單步回溯（快捷鍵 Alt+Z 直接回退一步）';
  btnRewind.innerHTML = SVG_REWIND + '<span>時空回溯</span><span class="v64-pill-count" id="v64-rewind-count">0</span>';
  btnRewind.onclick = function(){ openChronoModal(); };

  var btnRadar = document.createElement('button');
  btnRadar.type = 'button';
  btnRadar.id = 'v64-radar-btn';
  btnRadar.className = 'v64-bottom-pill';
  btnRadar.title = '門扉現場推演雷達、環境凝視、守門人對弈與因果煉成 (Alt+R)';
  btnRadar.innerHTML = SVG_RADAR + '<span>推演雷達</span>';
  btnRadar.onclick = function(){ openRadarModal(); };

  var btnMenu = document.createElement('button');
  btnMenu.type = 'button';
  btnMenu.id = 'v64-reading-menu-btn';
  btnMenu.className = 'v64-bottom-pill';
  btnMenu.title = '展開閱讀、字級、左右分欄、聽書與戰術輔助選單';
  btnMenu.innerHTML = SVG_TUNE + '<span>輔助與視角</span>';
  btnMenu.onclick = function(e){
    e.stopPropagation();
    pop.classList.toggle('open');
  };

  var skipBtn = document.getElementById('v59-quick-skipread');
  if(skipBtn){
    skipBtn.className = 'v64-bottom-pill';
  }

  var hintEntry = center.querySelector('.v4-hint-entry');
  center.insertBefore(btnRewind, hintEntry || null);
  center.insertBefore(btnRadar, hintEntry || null);
  if(skipBtn) center.insertBefore(skipBtn, hintEntry || null);
  center.insertBefore(btnMenu, hintEntry || null);

  var closePopBtn = document.getElementById('v64-popover-close');
  if(closePopBtn){
    closePopBtn.onclick = function(){ pop.classList.remove('open'); };
  }
  document.addEventListener('click', function(e){
    if(pop.classList.contains('open') && !pop.contains(e.target) && e.target !== btnMenu && !btnMenu.contains(e.target)){
      pop.classList.remove('open');
    }
  });
}

function decorateChoicesWithBranchMemory(){
  var rndBtn = document.querySelector('#game-bottom-center #random-choice-btn');
  var popGrid = document.getElementById('v64-popover-grid');
  if(rndBtn && popGrid){
    var oldInPop = popGrid.querySelector('#random-choice-btn');
    if(oldInPop && oldInPop !== rndBtn) oldInPop.remove();
    popGrid.appendChild(rndBtn);
  }
  var cWrap = document.getElementById('choices');
  if(!cWrap || !window.SCENES || !window.state) return;
  var curSc = SCENES[state.currentScene];
  if(!curSc) return;
  var rawChoices = (typeof curSc.choices === 'function') ? (curSc.choices(state) || []) : (curSc.choices || []);
  var validChoices = rawChoices.filter(function(ch){ return !ch.condition || ch.condition(); });
  var btns = cWrap.querySelectorAll('.choice-btn:not(.v58-hallucination)');
  var showCompass = hasRelic('relic_compass');

  btns.forEach(function(btn, idx){
    if(btn.querySelector('.v64-choice-branch-badge')) return;
    var ch = validChoices[idx];
    if(!ch) return;
    if(ch.observe || ch.useless) return;
    var targetId = extractChoiceTargetScene(ch);

    /* 若佩掛「深海青銅羅盤」，標註會給予劇情信物、解謎或推進關鍵旗標的選項 */
    if(showCompass && !btn.querySelector('.v64-choice-compass-star')){
      var actStr = ch.action ? String(ch.action) : '';
      var nextSc = (targetId && SCENES[targetId]) ? SCENES[targetId] : null;
      var nextEnter = (nextSc && nextSc.onEnter) ? String(nextSc.onEnter) : '';
      var isKeyCausal = (
        ch.giveItem ||
        ch.puzzle ||
        /addItem|flags\.|openPuzzle/.test(actStr) ||
        /addItem|flags\.|survive_|hidden_/.test(nextEnter)
      );
      if(isKeyCausal){
        var star = document.createElement('span');
        star.className = 'v64-choice-compass-star';
        star.textContent = '★ 關鍵因果';
        btn.appendChild(star);
      }
    }

    if(!targetId || !SCENES[targetId]) return;
    var visited = isSceneVisitedInStorage(targetId, SCENES[targetId]);
    var badge = document.createElement('span');
    badge.className = 'v64-choice-branch-badge ' + (visited ? 'visited' : 'unvisited');
    badge.textContent = visited ? '✓ 已踏足' : '• 未探分支';
    btn.appendChild(badge);
  });
}

function refineInventoryAndStatusDisplay(){
  if(!window.state || !Array.isArray(state.inventory)) return;
  var storyItems = state.inventory.filter(function(i){ return i.usage !== 'combat'; });
  var combatItems = state.inventory.filter(function(i){ return i.usage === 'combat'; });

  var invCountEl = document.getElementById('item-count');
  if(invCountEl){
    invCountEl.innerHTML = String(storyItems.length) +
      (combatItems.length > 0 ? ' <span class="v64-inv-sub-badge" title="含戰術消耗品 ' + combatItems.length + ' 件">+' + combatItems.length + '戰術</span>' : '');
  }

  /* 確保非當前門扉的狀態晶片嚴格隱藏 */
  var cfg = window.DUNGEON_CONFIG && DUNGEON_CONFIG[window.currentDungeonId || 1];
  if(cfg){
    var pEl = document.getElementById('party-status');
    var rEl = document.getElementById('reset-status');
    if(pEl) pEl.style.display = cfg.hasParty ? 'inline-flex' : 'none';
    if(rEl) rEl.style.display = cfg.hasCountdown ? 'inline-flex' : 'none';
  }
  if(typeof window.updateD5HUD === 'function') window.updateD5HUD();

  var modChip = document.getElementById('v58-mod-chip');
  var contracts = getActiveContracts();
  var relics = getEquippedRelics();
  if(modChip){
    if(contracts.length > 0 || relics.length > 0){
      modChip.style.display = 'inline-flex';
      var parts = [];
      if(relics.length > 0) parts.push('遺物×' + relics.length);
      if(contracts.length > 0) parts.push('契約×' + contracts.length);
      var shield = (window.state && state.flags && state.flags._v64Shield) || 0;
      if(shield > 0) parts.push('護盾' + shield);
      modChip.innerHTML = '<span style="color:#f5df98">' + parts.join(' · ') + '</span>';
      modChip.title = '點擊管理迴廊古遺物配裝與試煉契約';
      modChip.onclick = function(){ openTrialContractsModal('relics'); };
    } else if(!(state.activeModifiers && state.activeModifiers.length > 0)){
      modChip.style.display = 'none';
    }
  }
}

function makeNotebookQuickJumpCollapsible(){
  var jumpBar = document.getElementById('v62-nb-quick-jump');
  if(!jumpBar || jumpBar.tagName === 'DETAILS') return;
  var parent = jumpBar.parentNode;
  if(!parent) return;
  var details = document.createElement('details');
  details.id = 'v62-nb-quick-jump';
  details.className = 'v64-nb-jump-drawer';
  var innerContent = jumpBar.innerHTML;
  details.innerHTML =
    '<summary><span>▸ 快速跳轉門扉（1–13）與支線信物狀態</span><span style="font-size:.68rem;color:var(--text-dim)">點擊展開 / 收合</span></summary>' +
    '<div style="margin-top:.55rem;padding-top:.45rem;border-top:1px solid rgba(212,175,55,.2)">' + innerContent + '</div>';
  parent.replaceChild(details, jumpBar);
}

/* ============================================================
 * 6. 核心掛鉤整合與鍵盤快捷鍵
 * ============================================================ */
function hookV64Systems(){
  if(window.V61 && typeof V61.ensureDungeonLoaded === 'function'){
    for(var g = 1; g <= 13; g++){
      try{ V61.ensureDungeonLoaded(g); }catch(e){}
    }
  }

  setupDeclutteredTopAndHubBars();
  setupDeclutteredBottomBar();
  syncContractBodyClasses();

  var hubRight = document.querySelector('#hub-screen .hub-header-right');
  if(hubRight){
    var cBtn = document.getElementById('v64-hub-contracts-btn');
    if(!cBtn){
      cBtn = document.createElement('button');
      cBtn.type = 'button';
      cBtn.id = 'v64-hub-contracts-btn';
      cBtn.className = 'hub-gallery-btn';
      hubRight.insertBefore(cBtn, hubRight.firstChild);
    }
    cBtn.innerHTML = SVG_CROWN + ' <span>契約與遺物</span>';
    cBtn.onclick = function(e){
      e.stopPropagation();
      openTrialContractsModal('contracts');
    };
  }

  if(typeof window.enterDungeon === 'function' && !window.enterDungeon.__v64){
    var _origEnter = window.enterDungeon;
    window.enterDungeon = function(id, autoStart){
      var numId = parseInt(id, 10) || 1;
      _stepStacks[numId] = [];
      document.body.classList.add('v64-in-game');
      var r = _origEnter.apply(this, arguments);
      applyContractsAndRelicsToCurrentState();
      pushStepSnapshot();
      refineInventoryAndStatusDisplay();
      return r;
    };
    window.enterDungeon.__v64 = true;
  }

  ['backToHub', 'quitToTitle'].forEach(function(fnName){
    if(typeof window[fnName] === 'function' && !window[fnName].__v64){
      var _origFn = window[fnName];
      window[fnName] = function(){
        document.body.classList.remove('v64-in-game');
        var pop = document.getElementById('v64-reading-popover');
        if(pop) pop.classList.remove('open');
        var res = _origFn.apply(this, arguments);
        setupDeclutteredTopAndHubBars();
        return res;
      };
      window[fnName].__v64 = true;
    }
  });

  if(typeof window.goToScene === 'function' && !window.goToScene.__v64){
    var _origGo = window.goToScene;
    window.goToScene = function(sceneId){
      document.body.classList.add('v64-in-game');
      var sc = window.SCENES && SCENES[sceneId];
      var wasVisited = isSceneVisitedInStorage(sceneId, sc);

      if(!_isRewinding && sc && window.state){
        /* 契約：心魔低語 */
        if(hasContract('contract_stress') && typeof window.addStress === 'function'){
          if(sc.mood === 'danger' || sc.mood === 'terror' || sc.mood === 'tension'){
            var stAdd = (hasRelic('relic_watch') && (state.hp || 100) < 35) ? 2 : 5;
            window.addStress(stAdd);
          }
        }
        /* 契約：深淵凝視（踏入未探分支承受 3 點精神侵蝕） */
        if(!wasVisited && hasContract('contract_abyss') && typeof window.addStress === 'function'){
          window.addStress(3);
        }
        /* 古遺物：第 13 盞冷白提燈（踏入未探分支恢復 +4 HP 並降壓 4%） */
        if(!wasVisited && hasRelic('relic_lantern')){
          state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + 4);
          if(typeof updateHP === 'function') updateHP();
          if(typeof window.addStress === 'function') window.addStress(-4);
        }
        /* 古遺物：409 質數黃銅鈴（安全場景額外回血 +6 HP） */
        if(hasRelic('relic_bell') && (sc.mood === 'safe' || sc.mood === 'calm')){
          state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + 6);
          if(typeof updateHP === 'function') updateHP();
        }
      }
      var r = _origGo.apply(this, arguments);
      pushStepSnapshot();
      refineInventoryAndStatusDisplay();
      return r;
    };
    window.goToScene.__v64 = true;
  }

  if(typeof window.renderChoices === 'function' && !window.renderChoices.__v64){
    var _origRC = window.renderChoices;
    window.renderChoices = function(choices){
      var r = _origRC.apply(this, arguments);
      try{ decorateChoicesWithBranchMemory(); }catch(e){}
      return r;
    };
    window.renderChoices.__v64 = true;
  }

  if(typeof window.handleChoiceClick === 'function' && !window.handleChoiceClick.__v64){
    var _origHC = window.handleChoiceClick;
    var _choiceClickLock = false;
    window.handleChoiceClick = function(ch){
      if(_choiceClickLock && ch && !ch.observe) return;
      if(ch && !ch.observe){
        _choiceClickLock = true;
        setTimeout(function(){ _choiceClickLock = false; }, 420);
      }
      return _origHC.apply(this, arguments);
    };
    window.handleChoiceClick.__v64 = true;
  }

  if(typeof window.damage === 'function' && !window.damage.__v64){
    var _origDmg = window.damage;
    window.damage = function(amount){
      var adj = amount;
      if(typeof adj === 'number' && adj > 0 && window.state){
        if(hasContract('contract_fragile')){
          adj = Math.ceil(adj * 1.25);
        }
        if(hasRelic('relic_mirror')){
          adj = Math.max(1, adj - 4);
          if(typeof window.addStress === 'function') window.addStress(-4);
        }
        if(state.flags && state.flags._v64Shield > 0){
          var absorbed = Math.min(state.flags._v64Shield, adj);
          state.flags._v64Shield -= absorbed;
          adj -= absorbed;
          refineInventoryAndStatusDisplay();
          if(adj <= 0){
            if(typeof showToast === 'function') showToast('【晨曦護盾】已完全抵禦本次傷害！');
            return;
          }
        }
        /* 守門人白鴉羽：致命傷害替死保護 */
        if((state.hp - adj) <= 0 && hasRelic('relic_feather') && state.flags && state.flags._v64FeatherReady){
          state.flags._v64FeatherReady = false;
          state.hp = 20;
          state.stress = 0;
          if(typeof updateHP === 'function') updateHP();
          if(typeof updateV58HUD === 'function') updateV58HUD();
          if(typeof showToast === 'function') showToast('【守門人白鴉羽發動】替你擋下了致命一擊，生命值鎖定於 20 HP！');
          return;
        }
      }
      return _origDmg.call(this, adj);
    };
    window.damage.__v64 = true;
  }

  ['updateInventoryUI', 'updateV58HUD'].forEach(function(fnName){
    if(typeof window[fnName] === 'function' && !window[fnName].__v64){
      var _origU = window[fnName];
      window[fnName] = function(){
        var r = _origU.apply(this, arguments);
        try{ refineInventoryAndStatusDisplay(); }catch(e){}
        return r;
      };
      window[fnName].__v64 = true;
    }
  });

  if(typeof window.triggerEnding === 'function' && !window.triggerEnding.__v64){
    var _origTE = window.triggerEnding;
    window.triggerEnding = function(type, title, desc, reward){
      var r = _origTE.apply(this, arguments);
      try{
        var tpStr = String(type || '');
        var isTrueOrSurvive = (tpStr === 'survive' || tpStr === 'hidden' || tpStr.indexOf('survive_') === 0 || tpStr.indexOf('hidden_') === 0);
        var isGood = isTrueOrSurvive || (tpStr === 'normal' || tpStr.indexOf('normal_') === 0);
        var activeContracts = getActiveContracts();

        if(hasRelic('relic_film') && typeof window.addMemoryShards === 'function'){
          window.addMemoryShards(2);
        }
        if(isTrueOrSurvive && hasContract('contract_abyss') && typeof window.addMemoryShards === 'function'){
          window.addMemoryShards(2);
        }

        var crownQualified = hasContract('contract_truth') ? isTrueOrSurvive : isGood;
        if(crownQualified && activeContracts.length > 0){
          recordTrialCrown(window.currentDungeonId || 1, activeContracts.length);
          if(typeof window.addMemoryShards === 'function'){
            window.addMemoryShards(activeContracts.length);
          }
        }
        setTimeout(function(){
          var actBox = document.getElementById('ending-actions');
          if(actBox && !document.getElementById('v64-ending-rewind-btn')){
            var rwBtn = document.createElement('button');
            rwBtn.type = 'button';
            rwBtn.id = 'v64-ending-rewind-btn';
            rwBtn.innerHTML = SVG_REWIND + ' <span>回溯至上一步抉擇（免重開門扉）</span>';
            rwBtn.onclick = function(e){
              if(e && e.stopPropagation) e.stopPropagation();
              rewindLastStep();
            };
            actBox.insertBefore(rwBtn, actBox.firstChild);
          }
        }, 380);
      }catch(e){}
      return r;
    };
    window.triggerEnding.__v64 = true;
  }

  var nbBody = document.getElementById('v4-nb-body');
  if(nbBody && typeof MutationObserver === 'function'){
    var nbObs = new MutationObserver(function(){
      makeNotebookQuickJumpCollapsible();
    });
    nbObs.observe(nbBody, { childList: true });
  }
  if(typeof window.openNotebook === 'function' && !window.openNotebook.__v64){
    var _origOpenNb = window.openNotebook;
    window.openNotebook = function(){
      var r = _origOpenNb.apply(this, arguments);
      try{ makeNotebookQuickJumpCollapsible(); }catch(e){}
      return r;
    };
    window.openNotebook.__v64 = true;
  }

  document.addEventListener('keydown', function(e){
    if(!e) return;
    var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if(tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if(e.altKey && (e.key === 'z' || e.key === 'Z')){
      var gs = document.getElementById('game-screen');
      var es = document.getElementById('ending-screen');
      if((gs && gs.classList.contains('active')) || (es && es.classList.contains('show'))){
        e.preventDefault();
        rewindLastStep();
      }
    } else if(e.altKey && (e.key === 'r' || e.key === 'R')){
      var gs2 = document.getElementById('game-screen');
      if(gs2 && gs2.classList.contains('active')){
        e.preventDefault();
        openRadarModal();
      }
    }
  });
}

window.V64.openChronoModal = openChronoModal;
window.V64.rewindLastStep = rewindLastStep;
window.V64.saveAnchorToSlot = saveAnchorToSlot;
window.V64.loadAnchorFromSlot = loadAnchorFromSlot;
window.V64.openRadarModal = openRadarModal;
window.V64.analyzeCurrentGateProgress = analyzeCurrentGateProgress;
window.V64.openTrialContractsModal = openTrialContractsModal;
window.V64.getActiveContracts = getActiveContracts;
window.V64.setActiveContracts = setActiveContracts;
window.V64.toggleContract = toggleContract;
window.V64.CORRIDOR_RELIC_DEFS = CORRIDOR_RELIC_DEFS;
window.V64.getEquippedRelics = getEquippedRelics;
window.V64.setEquippedRelics = setEquippedRelics;
window.V64.toggleRelic = toggleRelic;
window.V64.ALCHEMY_RECIPES = ALCHEMY_RECIPES;
window.V64.GATE_ANOMALY_EVENTS = GATE_ANOMALY_EVENTS;
window.V64.GATE_ENV_DETAILS = GATE_ENV_DETAILS;
window.V64.GATE_RIDDLES = GATE_RIDDLES;
window.V64.getFoundEnvGaze = getFoundEnvGaze;
window.V64.getSolvedRiddles = getSolvedRiddles;

V5.onBoot(function(){
  try{
    hookV64Systems();

    window.VERSION = '6.4.0';
    window.SAVE_VERSION = '3.3';
    if(window.CHANGELOG){
      window.CHANGELOG = window.CHANGELOG.filter(function(c){ return c.version !== '6.4.0'; });
      window.CHANGELOG.unshift({
        version: '6.4.0',
        type: 'minor',
        changes: [
          '極簡秩序 UI/UX 重構：遊戲頂欄由 11 顆按鈕精簡為 6 顆核心按鈕（話、包、圖、札、典、選），次要系統收納入雙欄「典」萬象選單；遊戲底欄 12 個零散工具收斂為「時空回溯」「推演雷達」「跳過已讀」「輔助與視角」「提示」5 大膠囊入口；手札快速跳轉列改為單行折疊抽屜；徹底修復非當前門扉的狀態晶片（潮汐/人數/重置）跨門洩漏問題。',
          '12 大跨門扉古遺物刻印配裝系統（Corridor Relic Loadout）：可自由佩掛最多 3 件被動古遺物（如「林夏的停擺懷錶」「無影古鏡殘片」「深海青銅羅盤」「守門人白鴉羽」「03:18 晨曦稜鏡」等），提供致命傷鎖血替死、選項「★ 關鍵因果」導航、未探分支回血與晨曦護盾。',
          '8 大迴廊試煉契約完整實裝（Corridor Trial Contracts）：在不新增章節的前提下，為 13 扇門提供「殘燭之軀」「迷霧盲行」「心魔低語」「逆時沙漏」「孤影無援」「因果鎖鏈」「深淵凝視」「真名審判」8 項可疊加試煉詞綴與試煉金冠紀錄。',
          '時空錨點與 25 步單步回溯系統（Chrono Anchor）：自動記錄門扉內最近 25 步抉擇軌跡，支援隨時一鍵回退上一步（Alt+Z）、於結局畫面直接回溯至死前抉擇點，並提供每扇門 3 組手動「時空錨點」跨分支自由存取。',
          '門扉現場推演雷達、39 處環境凝視、13 道守門人殘響對弈、13 門迴廊奇遇商人與 10 大跨門扉因果煉成台：一站式整合未探分支躍遷、現場銘文勘查、守門人謎題對弈、殘影商人交易與聖印煉成。'
        ]
      });
    }

    ['title-version', 'hub-title-version'].forEach(function(id){
      var verEl = document.getElementById(id);
      if(verEl){
        var vTxt = 'v 6.4.0';
        verEl.textContent = vTxt;
        if(verEl.firstChild) verEl.firstChild.__origText = vTxt;
      }
    });

    if(typeof window.render === 'function'){
      window.render();
    }
    window.V64.__booted = true;
  }catch(e){
    console.error('v6.4 boot error:', e);
  }
});

})();
