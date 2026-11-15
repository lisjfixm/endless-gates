
/* ============================================================
 * 無盡之門 · v5.6.0 邏輯與 UI 深度優化腳本
 * ============================================================ */
(function(){
'use strict';
if(!window.V5 || window.V5.__v56Loaded) return;
window.V5.__v56Loaded = true;

function t(s){ return (window.I18N && typeof I18N.t === 'function') ? I18N.t(s) : s; }

/* ============================================================
 * 1. 補齊小遊戲獎勵道具與共鳴磁帶的多語詞條與物品欄互動
 * ============================================================ */
function registerV56ItemsAndI18N(){
  if(window.ITEM_CONSUMABLES){
    ITEM_CONSUMABLES.prime_compass = {use:function(){
      if(state.hp < (state.maxHp||100)){
        state.hp = Math.min(state.maxHp||100, state.hp + 10);
        if(typeof updateHP === 'function') updateHP();
        appendNarrative('<p class="action">你低頭看著質數懷錶羅盤，指針穩穩停在質數刻度上，紊亂的呼吸平復了下來（生命 +10）。</p>');
        return true;
      }
      return false;
    }};
    ITEM_CONSUMABLES.pulse_stabilizer = {use:function(){
      if(state.hp < (state.maxHp||100)){
        state.hp = Math.min(state.maxHp||100, state.hp + 15);
        if(typeof updateHP === 'function') updateHP();
        appendNarrative('<p class="action">脈衝穩壓晶片貼在手環側邊，釋放出平穩的微電流（生命 +15）。</p>');
        return true;
      }
      return false;
    }};
  }

  if(!window.I18N) return;
  var addEN = {
    '機關':'GAME','觀察':'LOOK','謎題':'PUZZLE','危險':'RISK','分支':'PATH','探索':'EXPLORE',
    '質數懷錶羅盤':'Prime Pocket Compass',
    '通過走廊質數迷陣取得的銅羅盤，刻度只標註質數。':'A brass compass earned from the Prime Path Labyrinth; its dial marks only prime numbers.',
    '無聲玉書籤':'Silent Jade Bookmark',
    '九宮命書歸於寂靜後滑出的冷玉書籤。':'A cool jade bookmark that slipped from the shelves once all nine books fell silent.',
    '脈衝穩壓晶片':'Pulse Stabilizer Chip',
    '從穩定的心電監護儀中取出的諧振晶片。':'A resonance chip extracted from the stabilized ECG monitor.',
    '心臟火種':'Heart Ember',
    '六對舊門殘響配對合一後凝成的溫暖火種。':'A warm ember condensed after matching all six pairs of Old Gate echoes.',
    '迴光潮珠':'Echo Tide Pearl',
    '水脈貫通後在石槽終點凝結的發光水珠。':'A luminescent pearl formed at the conduit terminus once the golden tide flowed through.',
    '破曉諧振晶體':'Dawn Resonance Crystal',
    '03:18 雙波完全重合時凝成的金色晶體。':'A golden crystal formed when the 03:18 dual waveforms reached 100% resonance.',
    '六門共鳴磁帶':'Six-Gate Symphony Tape',
    '合成了旅館、圖書館、醫院、心臟與迴光之海全部回聲的磁帶。':'A magnetic reel synthesizing the echoes of all five preceding gates.',
    '鍵盤方向鍵 / WASD 或點擊相鄰質數格移動 · 支援退回已踩格':'Arrow Keys / WASD or click adjacent prime tiles · Step-back supported',
    '數字鍵 1–9 或點擊書冊切換四鄰 · 目標：全數歸為「靜」':'Keys 1–9 or click to toggle book & neighbors · Goal: All Silent',
    '空白鍵 Space / Enter 或點擊軌道中央即可鎖定波峰':'Press Space / Enter or click the track when cursor is in gold zone',
    '點擊或按數字鍵翻開星牌 · 開局預覽 0.85 秒':'Click or use number keys to flip · 0.85s initial memory preview',
    '數字鍵 1–9 或點擊石槽順時針旋轉 90° · 連通左上至右下':'Keys 1–9 or click to rotate 90° · Connect top-left source to bottom-right sea',
    '點擊 - / + 調整三組波形參數至 100% 共振':'Click - / + to tune all 3 wave parameters to 100% resonance'
  };
  var addJA = {
    '機關':'機関','觀察':'観察','謎題':'謎題','危險':'危険','分支':'進行','探索':'探索',
    '質數懷錶羅盤':'素数の懐中羅針盤',
    '通過走廊質數迷陣取得的銅羅盤，刻度只標註質數。':'廊下の素数迷陣を突破して得た真鍮の羅針盤。素数のみが刻まれている。',
    '無聲玉書籤':'無声の玉栞',
    '九宮命書歸於寂靜後滑出的冷玉書籤。':'九冊の命書が静寂に帰した際に滑り落ちた翡翠の栞。',
    '脈衝穩壓晶片':'パルス安定チップ',
    '從穩定的心電監護儀中取出的諧振晶片。':'安定した心電モニターから取り出した共鳴チップ。',
    '心臟火種':'心臓の火種',
    '六對舊門殘響配對合一後凝成的溫暖火種。':'六対の旧き扉の残響が重なり合って生まれた温かい火種。',
    '迴光潮珠':'回光の潮珠',
    '水脈貫通後在石槽終點凝結的發光水珠。':'水脈が繋がった終点で結ばれた、淡く光る真珠。',
    '破曉諧振晶體':'夜明けの共鳴結晶',
    '03:18 雙波完全重合時凝成的金色晶體。':'03:18の双波が100%同調した瞬間に結晶化した金の石。',
    '六門共鳴磁帶':'六門共鳴テープ',
    '合成了旅館、圖書館、醫院、心臟與迴光之海全部回聲的磁帶。':'ホテル・図書館・病院・心臓・回光の海のすべての残響を合成した磁気テープ。',
    '鍵盤方向鍵 / WASD 或點擊相鄰質數格移動 · 支援退回已踩格':'矢印キー / WASD または隣接する素数マスをクリック・後退可能',
    '數字鍵 1–9 或點擊書冊切換四鄰 · 目標：全數歸為「靜」':'数字キー 1〜9 またはクリックで周囲を反転・目標：すべて「静」',
    '空白鍵 Space / Enter 或點擊軌道中央即可鎖定波峰':'Space / Enter またはトラッククリックでピークをロック',
    '點擊或按數字鍵翻開星牌 · 開局預覽 0.85 秒':'クリックで星牌をめくる・開始時0.85秒プレビュー',
    '數字鍵 1–9 或點擊石槽順時針旋轉 90° · 連通左上至右下':'数字キー 1〜9 またはクリックで90°回転・左上から右下へ繋ぐ',
    '點擊 - / + 調整三組波形參數至 100% 共振':'- / + ボタンで3つの波形パラメータを100%同調させる'
  };
  var origT = I18N.t;
  I18N.t = function(str, langOverride){
    var lg = langOverride || I18N.lang || 'zh-Hant';
    if(str && typeof str === 'string'){
      var tr = str.trim();
      if(lg === 'en' && addEN[tr]) return addEN[tr];
      if(lg === 'ja' && addJA[tr]) return addJA[tr];
    }
    return origT.apply(this, arguments);
  };
}

/* ============================================================
 * 2. 優化 playSceneText / skipCurrentScene 時序與選項顯示邏輯
 * ============================================================ */
function isSideInteractionChoice(ch){
  if(!ch) return false;
  if(ch.observe) return true;
  if(typeof ch.action === 'function'){
    var fnStr = String(ch.action);
    if(fnStr.indexOf('openMiniGame') !== -1 || fnStr.indexOf('grantRelic') !== -1 || fnStr.indexOf('openDialogPanel') !== -1){
      return true;
    }
  }
  return false;
}

function anyBlockingModalOpen(){
  var ids = ['puzzle-modal','admin-modal','v55-minigame-modal','observation-modal'];
  for(var i=0;i<ids.length;i++){
    var el = document.getElementById(ids[i]);
    if(el && el.classList.contains('show')) return true;
  }
  var dlg = document.getElementById('dialog-overlay');
  if(dlg && dlg.classList.contains('open')) return true;
  return false;
}

function optimizeChoiceAndModalFlow(){
  /* 0) 修復 playSceneText 與 skipCurrentScene 在前 300ms 轉場期間的時序競態：
   *    當旅人或腳本在 goToScene 後立即呼叫 skipCurrentScene() 時，即使 300ms 淡出尚未結束，
   *    也能立即寫入全部段落並同步渲染選項！
   */
  if(typeof window.playSceneText === 'function' && !window.playSceneText.__v56Sync){
    var _pst = window.playSceneText;
    window.playSceneText = function(textArr, onDone, preStart){
      window._v56PendingScene = {
        token: window.sceneToken,
        textArr: textArr || [],
        onDone: onDone,
        preStart: preStart,
        started: false
      };
      var wrappedPre = function(){
        if(window._v56PendingScene) window._v56PendingScene.started = true;
        if(preStart) preStart();
      };
      return _pst.call(this, textArr, onDone, wrappedPre);
    };
    window.playSceneText.__v56Sync = true;
  }

  if(typeof window.skipCurrentScene === 'function' && !window.skipCurrentScene.__v56Sync){
    var _scs = window.skipCurrentScene;
    window.skipCurrentScene = function(){
      var pend = window._v56PendingScene;
      if(pend && !pend.started && pend.token === window.sceneToken){
        /* 尚在 300ms 淡出等待期內被呼叫：立即推進 sceneToken 取消舊計時器，同步完成渲染 */
        pend.started = true;
        window.sceneToken++;
        var narr = $('narrative');
        if(narr) narr.classList.remove('scene-fade');
        clearNarrative();
        state.textIndex = 0;
        try{ var loopHtml = restoreLoopMemory(); if(loopHtml && narr) narr.innerHTML = loopHtml; }catch(e){}
        if(pend.preStart) pend.preStart();
        var arr = pend.textArr || [];
        for(var i=0;i<arr.length;i++){
          if(arr[i]){
            var tmp = document.createElement('div');
            tmp.innerHTML = (window.I18N && typeof I18N.html === 'function') ? I18N.html(arr[i]) : arr[i];
            var node = tmp.firstChild;
            if(node){
              var skipTx = stripTextEffectPrefix(node);
              if(skipTx) node.classList.add(skipTx);
              node.classList.add('visible', 'typed-done');
              narr.appendChild(node);
            }
          }
        }
        state.textIndex = arr.length;
        currentPlayContext = null;
        renderChoices(currentSceneChoices);
        $('choices').classList.remove('hidden-choices');
        return;
      }
      var r = _scs.apply(this, arguments);
      /* 同步確保選項立刻渲染並顯示，不等 250ms 延遲 */
      if(window.currentSceneChoices && window.currentSceneChoices.length > 0){
        renderChoices(currentSceneChoices);
        $('choices').classList.remove('hidden-choices');
      }
      return r;
    };
    window.skipCurrentScene.__v56Sync = true;
  }

  /* 1) Escape 優先關閉小遊戲彈窗並清理動畫 */
  if(typeof window.closeTopmostOverlay === 'function' && !window.closeTopmostOverlay.__v56){
    var _cto = window.closeTopmostOverlay;
    window.closeTopmostOverlay = function(){
      var mg = document.getElementById('v55-minigame-modal');
      if(mg && mg.classList.contains('show')){
        if(typeof window.closeMiniGame === 'function') window.closeMiniGame();
        else mg.classList.remove('show');
        return true;
      }
      return _cto.apply(this, arguments);
    };
    window.closeTopmostOverlay.__v56 = true;
  }

  /* 2) 當進入已讀場景時，直接解鎖主線選項 */
  if(typeof window.goToScene === 'function' && !window.goToScene.__v56ReadUnlock){
    var _gts = window.goToScene;
    window.goToScene = function(id){
      var sc = window.SCENES && SCENES[id];
      var sid = sc ? (sc.sceneId || id) : id;
      var alreadyRead = (typeof isSceneRead === 'function') && isSceneRead(sid);
      var r = _gts.apply(this, arguments);
      if(alreadyRead && window.sceneChoiceState){
        sceneChoiceState.hasShownMain = true;
      }
      return r;
    };
    window.goToScene.__v56ReadUnlock = true;
  }

  /* 3) 優化 renderChoices：
   *    - 讓章節小遊戲（openMiniGame）、遺物拾取（grantRelic）與觀察（observe）始終可見，不被無用選項鎖在後面
   *    - 為選項加上清晰的視覺分類樣式與微標籤
   */
  if(typeof window.renderChoices === 'function' && !window.renderChoices.__v56Smart){
    var _rcOrig = window.renderChoices;
    window.renderChoices = function(choices){
      var valid = (choices || []).filter(function(ch){ return !ch.condition || ch.condition(); });
      var useless = valid.filter(function(ch){ return ch.useless && sceneChoiceState.pickedUseless.indexOf(ch.text) === -1; });
      var side = valid.filter(function(ch){ return !ch.useless && isSideInteractionChoice(ch); });
      var mainOnly = valid.filter(function(ch){ return !ch.useless && !isSideInteractionChoice(ch); });

      var listForRender = choices;
      var showingInitialWithSide = false;
      if(!sceneChoiceState.hasShownMain && useless.length > 0 && mainOnly.length > 0 && side.length > 0){
        showingInitialWithSide = true;
        /* 為無用選項與支線選項加上臨時淺拷貝（全標為 useless:false 讓基礎 renderChoices 一次全部渲染出來） */
        listForRender = valid.filter(function(ch){
          if(ch.useless) return sceneChoiceState.pickedUseless.indexOf(ch.text) === -1;
          return isSideInteractionChoice(ch);
        }).map(function(ch){
          if(!ch.useless) return ch;
          /* 保留原始引用以便點擊時識別為無用選項 */
          return ch;
        });
      }

      /* 若處於 showingInitialWithSide，我們暫時令基礎函數渲染 useless + side */
      var savedHasShown = sceneChoiceState.hasShownMain;
      if(showingInitialWithSide){
        sceneChoiceState.hasShownMain = true;
      }
      var r = _rcOrig.call(this, showingInitialWithSide ? listForRender : choices);
      if(showingInitialWithSide){
        sceneChoiceState.hasShownMain = savedHasShown;
      }

      /* 加上視覺層次 class 與微章 */
      try{
        var c = document.getElementById('choices');
        if(!c) return r;
        var btns = c.querySelectorAll('.choice-btn');
        var shownList = showingInitialWithSide
          ? listForRender
          : ((!sceneChoiceState.hasShownMain && useless.length > 0 && mainOnly.length > 0)
              ? useless
              : (useless.length === 0 && (mainOnly.length + side.length) > 0
                  ? valid.filter(function(x){return !x.useless;})
                  : valid.filter(function(x){return !x.useless || sceneChoiceState.pickedUseless.indexOf(x.text)===-1;})));

        btns.forEach(function(btn, idx){
          var ch = shownList[idx];
          if(!ch) return;
          var fnStr = ch.action ? String(ch.action) : '';
          var isMg = fnStr.indexOf('openMiniGame') !== -1;
          var isObs = !!ch.observe;
          var isPuz = fnStr.indexOf('openPuzzle') !== -1;
          if(isMg) btn.classList.add('v56-ch-minigame');
          else if(isObs) btn.classList.add('v56-ch-observe');
          else if(ch.useless) btn.classList.add('v56-ch-useless');

          if(!btn.querySelector('.v53-choice-tag') && !btn.querySelector('.v56-choice-badge')){
            var badgeTxt = '', badgeCls = '';
            if(isMg){ badgeTxt = '機關'; badgeCls = 'mg'; }
            else if(isObs){ badgeTxt = '觀察'; badgeCls = 'obs'; }
            else if(isPuz){ badgeTxt = '謎題'; badgeCls = 'puz'; }
            else if(ch.danger){ badgeTxt = '危險'; badgeCls = 'dng'; }
            if(badgeTxt){
              var b = document.createElement('span');
              b.className = 'v56-choice-badge ' + badgeCls;
              b.textContent = t(badgeTxt);
              btn.appendChild(b);
            }
          }
        });
      }catch(e){}
      return r;
    };
    window.renderChoices.__v56Smart = true;
  }

  /* 4) 優化 handleChoiceClick：點擊支線動作時同時解鎖主線選項 */
  if(typeof window.handleChoiceClick === 'function' && !window.handleChoiceClick.__v56){
    var _hcc = window.handleChoiceClick;
    window.handleChoiceClick = function(ch){
      if(ch && !ch.useless && isSideInteractionChoice(ch)){
        sceneChoiceState.hasShownMain = true;
        if(ch.observe){
          showObservation(ch.observe);
          renderChoices(currentSceneChoices);
          return;
        }
        if(ch.action) ch.action();
        if(!anyBlockingModalOpen()){
          renderChoices(currentSceneChoices);
          $('choices').classList.remove('hidden-choices');
        }
        return;
      }
      return _hcc.apply(this, arguments);
    };
    window.handleChoiceClick.__v56 = true;
  }

  /* 5) 當關閉小遊戲或謎題彈窗時，自動刷新並恢復選項區可見性 */
  if(typeof window.closeMiniGame === 'function' && !window.closeMiniGame.__v56){
    var _cmg = window.closeMiniGame;
    window.closeMiniGame = function(){
      var r = _cmg.apply(this, arguments);
      try{
        if($('game-screen') && $('game-screen').classList.contains('active') && !$('ending-screen').classList.contains('show')){
          sceneChoiceState.hasShownMain = true;
          renderChoices(currentSceneChoices);
          $('choices').classList.remove('hidden-choices');
        }
      }catch(e){}
      return r;
    };
    window.closeMiniGame.__v56 = true;
  }

  if(typeof window.closePuzzle === 'function' && !window.closePuzzle.__v56){
    var _cpz = window.closePuzzle;
    window.closePuzzle = function(){
      var r = _cpz.apply(this, arguments);
      try{
        if($('game-screen') && $('game-screen').classList.contains('active') && !$('ending-screen').classList.contains('show')){
          $('choices').classList.remove('hidden-choices');
        }
      }catch(e){}
      return r;
    };
    window.closePuzzle.__v56 = true;
  }
}

/* ============================================================
 * 3. 升級六大章節小遊戲邏輯與 UI（鍵盤操控 + 進度條 + 記憶閃視）
 * ============================================================ */
function injectMgShellEnhancements(){
  var card = document.querySelector('#v55-minigame-modal .v55-mg-card');
  var statusEl = document.getElementById('v55-mg-status');
  var stageEl = document.getElementById('v55-mg-stage');
  if(!card || !statusEl || !stageEl) return;

  if(!document.getElementById('v56-mg-prog')){
    var prog = document.createElement('div');
    prog.className = 'v56-mg-prog-wrap';
    prog.id = 'v56-mg-prog';
    prog.innerHTML = '<div class="v56-mg-prog-fill" id="v56-mg-prog-fill"></div>';
    card.insertBefore(prog, statusEl.nextSibling);
  }
  if(!document.getElementById('v56-mg-keyhint')){
    var kh = document.createElement('div');
    kh.className = 'v56-mg-keyhint';
    kh.id = 'v56-mg-keyhint';
    card.insertBefore(kh, stageEl.nextSibling);
  }
}

function setMgProgress(pct){
  var fill = document.getElementById('v56-mg-prog-fill');
  if(fill) fill.style.width = Math.max(0, Math.min(100, Math.round(pct))) + '%';
}
function setMgKeyHint(txt){
  var kh = document.getElementById('v56-mg-keyhint');
  if(kh) kh.textContent = t(txt);
}

function hookMiniGameUpgrades(){
  injectMgShellEnhancements();

  var _origOpen = window.openMiniGame;
  if(typeof _origOpen === 'function' && !_origOpen.__v56){
    window.openMiniGame = function(mgId, fromStory){
      injectMgShellEnhancements();
      var r = _origOpen.apply(this, arguments);
      updateMgEnhancementsAfterRender(mgId);
      return r;
    };
    window.openMiniGame.__v56 = true;
  }

  var _origHint = window.hintCurrentMiniGame;
  if(typeof _origHint === 'function' && !_origHint.__v56){
    window.hintCurrentMiniGame = function(){
      var r = _origHint.apply(this, arguments);
      var m = document.getElementById('v55-minigame-modal');
      if(m && m.classList.contains('show')){
        syncMgProgressFromDOM();
      }
      return r;
    };
    window.hintCurrentMiniGame.__v56 = true;
  }

  var stageEl = document.getElementById('v55-mg-stage');
  if(stageEl){
    var obs = new MutationObserver(function(){
      syncMgProgressFromDOM();
    });
    obs.observe(stageEl, {childList: true, subtree: true, attributes: true});
  }

  /* 全局鍵盤支援：小遊戲開啟時可用方向鍵 / WASD / 1-9 / Space 操控 */
  document.addEventListener('keydown', function(e){
    var modal = document.getElementById('v55-minigame-modal');
    if(!modal || !modal.classList.contains('show')) return;
    var stage = document.getElementById('v55-mg-stage');
    if(!stage) return;

    var curCell = stage.querySelector('.v55-prime-cell.current');
    if(curCell){
      var r = parseInt(curCell.getAttribute('data-r'), 10);
      var c = parseInt(curCell.getAttribute('data-c'), 10);
      var nr = r, nc = c;
      if(e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') nr--;
      else if(e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') nr++;
      else if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') nc--;
      else if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') nc++;
      else return;
      e.preventDefault();
      var target = stage.querySelector('.v55-prime-cell[data-r="'+nr+'"][data-c="'+nc+'"]');
      if(target) target.click();
      return;
    }

    var bookCells = stage.querySelectorAll('.v55-book-cell');
    if(bookCells.length === 9 && e.key >= '1' && e.key <= '9'){
      e.preventDefault();
      bookCells[parseInt(e.key, 10) - 1].click();
      return;
    }
    var pipeCells = stage.querySelectorAll('.v55-pipe-cell');
    if(pipeCells.length === 9 && e.key >= '1' && e.key <= '9'){
      e.preventDefault();
      pipeCells[parseInt(e.key, 10) - 1].click();
      return;
    }

    var lockBtn = document.getElementById('v55-ecg-lock-btn');
    if(lockBtn && (e.key === ' ' || e.key === 'Enter')){
      e.preventDefault();
      lockBtn.click();
      return;
    }
  });
}

function updateMgEnhancementsAfterRender(mgId){
  var hints = {
    mg_d1: '鍵盤方向鍵 / WASD 或點擊相鄰質數格移動 · 支援退回已踩格',
    mg_d2: '數字鍵 1–9 或點擊書冊切換四鄰 · 目標：全數歸為「靜」',
    mg_d3: '空白鍵 Space / Enter 或點擊軌道中央即可鎖定波峰',
    mg_d4: '點擊或按數字鍵翻開星牌 · 開局預覽 0.85 秒',
    mg_d5: '數字鍵 1–9 或點擊石槽順時針旋轉 90° · 連通左上至右下',
    mg_d6: '點擊 - / + 調整三組波形參數至 100% 共振'
  };
  setMgKeyHint(hints[mgId] || '');
  syncMgProgressFromDOM();

  if(mgId === 'mg_d3'){
    var track = document.getElementById('v55-ecg-track');
    var lockBtn = document.getElementById('v55-ecg-lock-btn');
    if(track && lockBtn){
      track.style.cursor = 'pointer';
      track.onclick = function(){ lockBtn.click(); };
    }
  }

  if(mgId === 'mg_d4'){
    var stage = document.getElementById('v55-mg-stage');
    if(stage){
      var cards = stage.querySelectorAll('.v55-mem-card');
      cards.forEach(function(c){ c.classList.remove('face-down'); c.classList.add('flipped'); });
      setTimeout(function(){
        cards.forEach(function(c){
          if(!c.classList.contains('matched')){
            c.classList.add('face-down');
            c.classList.remove('flipped');
          }
        });
      }, 850);
    }
  }
}

function syncMgProgressFromDOM(){
  var stage = document.getElementById('v55-mg-stage');
  if(!stage) return;

  var curPrime = stage.querySelector('.v55-prime-cell.current');
  if(curPrime){
    var r = parseInt(curPrime.getAttribute('data-r'), 10) || 0;
    var c = parseInt(curPrime.getAttribute('data-c'), 10) || 0;
    setMgProgress(((r + c) / 6) * 100);
    return;
  }
  var books = stage.querySelectorAll('.v55-book-cell');
  if(books.length === 9){
    var silentCnt = stage.querySelectorAll('.v55-book-cell.silent').length;
    setMgProgress((silentCnt / 9) * 100);
    return;
  }
  var ecgDots = stage.querySelectorAll('.v55-ecg-dot');
  if(ecgDots.length === 3){
    var onCnt = stage.querySelectorAll('.v55-ecg-dot.on').length;
    setMgProgress((onCnt / 3) * 100);
    return;
  }
  var memCards = stage.querySelectorAll('.v55-mem-card');
  if(memCards.length === 12){
    var matchedCnt = stage.querySelectorAll('.v55-mem-card.matched').length;
    setMgProgress((matchedCnt / 12) * 100);
    return;
  }
  var pipes = stage.querySelectorAll('.v55-pipe-cell');
  if(pipes.length === 9){
    var filledCnt = stage.querySelectorAll('.v55-pipe-cell.filled').length;
    setMgProgress(Math.min(100, (filledCnt / 5) * 100));
    return;
  }
  var wavePct = document.getElementById('v55-wave-pct');
  if(wavePct){
    setMgProgress(parseInt(wavePct.textContent, 10) || 0);
  }
}

/* ============================================================
 * 4. 註冊系統與升級版本號至 v5.6.0
 * ============================================================ */
V5.registerSystem('v56-logic-ui-polish', function(){
  registerV56ItemsAndI18N();
  optimizeChoiceAndModalFlow();
  hookMiniGameUpgrades();
});

V5.onBoot(function(){
  try{
    window.VERSION = '5.6.0';
    if(window.CHANGELOG && !window.CHANGELOG.some(function(c){ return c.version === '5.6.0'; })){
      window.CHANGELOG.unshift({
        version:'5.6.0',
        type:'minor',
        changes:[
          '優化場景跳過與選項顯示邏輯：修復在場景淡入前 300ms 內觸發跳過會失效的競態問題；章節小遊戲（機關）、迴光遺物拾取與環境觀察選項現在於初次進入場景時即直接顯示，不再被無用選項鎖在後面；重返已讀場景時自動展開全部主線選項；關閉小遊戲或謎題彈窗後平滑恢復選項列表。',
          '優化六大章節小遊戲互動與鍵盤操控：支援方向鍵／WASD 走質數迷陣、數字鍵 1–9 操控九宮書架與潮汐水脈、空白鍵／Enter 或直接點擊軌道鎖定心電波峰，並為舊門翻牌加入 0.85 秒開局記憶預覽與即時進度條。',
          '優化小遊戲獎勵道具邏輯：為全部 6 件章節機關專屬獎勵道具補齊四語圖鑑說明與物品欄直接使用調息效果，並將 Escape 鍵納入小遊戲動畫計時器安全清理。',
          '優化迴廊手札 10 分頁導航 UI：改為 5×2 響應式膠囊網格導航（總覽／稱號／遺物／統計／印記／契約／占卜／萬門／試煉／機關），徹底消除橫向滾動截斷。',
          '優化選項清單視覺層次：新增左飾線與右側類型微章（機關／觀察／謎題／危險），提升閱讀與決策掃描效率。'
        ]
      });
    }
    var verEl = document.getElementById('title-version');
    if(verEl && typeof getVersionDisplay === 'function'){
      verEl.textContent = 'v ' + getVersionDisplay();
    }
  }catch(e){ console.error('v5.6 boot error:', e); }
});

})();
