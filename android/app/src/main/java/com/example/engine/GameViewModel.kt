package com.example.engine

import android.app.Application
import android.content.Intent
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.audio.SoundManager
import com.example.behaviors.BehaviorContext
import com.example.behaviors.BehaviorRegistry
import com.example.behaviors.MetaSystemsBehavior
import com.example.cloud.CloudAccountInfo
import com.example.cloud.CloudSaveRepository
import com.example.cloud.CloudSyncResolver
import com.example.cloud.CloudSyncUiState
import com.example.cloud.FullSaveSnapshot
import com.example.cloud.SyncDirection
import com.example.data.AssetRepository
import com.example.data.PersistenceRepository
import com.example.model.AchDef
import com.example.model.AppScreen
import com.example.model.BuffetStoryDef
import com.example.model.ChronoAnchorData
import com.example.model.CombatItemDef
import com.example.model.DungeonMeta
import com.example.model.EndingPresentation
import com.example.model.GameSettings
import com.example.model.GameState
import com.example.model.GlobalProgress
import com.example.model.InheritanceData
import com.example.model.InventoryItem
import com.example.model.LastSessionData
import com.example.model.NarrativeParagraph
import com.example.model.NoteEntry
import com.example.model.PartyMember
import com.example.model.PseudoEndingPresentation
import com.example.model.PuzzleModalState
import com.example.model.RenderedChoice
import com.example.model.RuntimeDungeonState
import com.example.model.SaveSlotData
import com.example.model.SceneDef
import com.example.model.UiOverlay
import com.example.model.V59PuzzleType
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.intOrNull
import kotlin.math.abs

class GameViewModel(application: Application) : AndroidViewModel(application), BehaviorContext {

    val assetRepo = AssetRepository(application)
    val persistence = PersistenceRepository(application)
    val soundManager = SoundManager(application)
    val audioManager: SoundManager get() = soundManager
    private val cloudRepo = CloudSaveRepository(application)

    private val _uiState = MutableStateFlow(GameUiState())
    val uiState: StateFlow<GameUiState> = _uiState.asStateFlow()

    val gameState: StateFlow<GameState> = _uiState
        .map { it.toGameState() }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.Eagerly,
            initialValue = _uiState.value.toGameState()
        )

    private var currentScenes: Map<String, SceneDef> = emptyMap()
    private var typewriterJob: Job? = null
    private var countdownJob: Job? = null
    private var d3RhythmJob: Job? = null
    private var toastJob: Job? = null
    private var achBannerJob: Job? = null
    private var outsiderJob: Job? = null
    private var cloudObserverJob: Job? = null
    private var cloudSyncJob: Job? = null
    private var activeCloudAccount: CloudAccountInfo? = null
    private var latestCloudSnapshot: FullSaveSnapshot? = null
    private var lifecyclePaused = false

    private var pendingChoiceOnResult: ((Boolean) -> Unit)? = null
    private var pendingV59OnSolved: (() -> Unit)? = null
    private var pendingCombatWin: (() -> Unit)? = null
    private var pendingCombatEscape: (() -> Unit)? = null

    init {
        val dungeons = assetRepo.getDungeons()
        val systems = assetRepo.getSystems()
        val npcBundle = assetRepo.getNpcBundle()
        val settings = persistence.loadSettings()
        val progress = persistence.loadProgress()
        val lastSession = persistence.loadLastSession()
        val anchors = persistence.loadChronoAnchors()
        audioManager.updateSettings(settings)

        _uiState.value = GameUiState(
            dungeons = dungeons,
            systems = systems,
            npcBundle = npcBundle,
            settings = settings,
            progress = progress,
            lastSession = lastSession,
            chronoAnchors = anchors,
            jigsawTiles = SanctumAndRadarEngine.createJigsawTiles(),
            dailySeedInfo = SanctumAndRadarEngine.getTodaySeedInfo(progress.dailyRuleOverrideDay)
        )
        startOutsiderHubTracker()
    }

    // ===== BehaviorContext Properties =====
    override val dungeonId: Int get() = _uiState.value.gameState.dungeonId
    override val state: RuntimeDungeonState get() = _uiState.value.gameState
    override val isNgPlus: Boolean get() = _uiState.value.progress.inheritance.ngPlus
    override val inheritance: InheritanceData get() = _uiState.value.progress.inheritance

    // ===== App Lifecycle =====
    fun setLifecyclePaused(paused: Boolean) {
        lifecyclePaused = paused
        audioManager.setPaused(paused)
    }

    override fun onCleared() {
        super.onCleared()
        typewriterJob?.cancel()
        countdownJob?.cancel()
        d3RhythmJob?.cancel()
        outsiderJob?.cancel()
        cloudObserverJob?.cancel()
        cloudSyncJob?.cancel()
        soundManager.release()
    }

    private fun GameUiState.toGameState(): GameState = GameState(
        currentDoor = gameState.dungeonId,
        currentDoorName = selectedDungeonMeta?.name.orEmpty(),
        currentSceneId = gameState.currentScene,
        roomTitle = roomDisplayName,
        sceneMood = moodKey,
        inventoryItems = gameState.inventory,
        progressFlags = gameState.flags,
        counters = gameState.counters,
        clearedDoors = progress.clearedDungeons,
        hp = gameState.hp,
        maxHp = gameState.maxHp,
        stress = gameState.stress,
        narrativeLines = paragraphs.map { it.html },
        isGameOver = screen == AppScreen.ENDING,
        isBadEnding = ending?.isBad == true,
        endingTitle = ending?.title
    )

    private fun startOutsiderHubTracker() {
        outsiderJob?.cancel()
        outsiderJob = viewModelScope.launch {
            var accumulatedSec = 0
            while (isActive) {
                delay(1000L)
                if (!lifecyclePaused && _uiState.value.screen == AppScreen.HUB) {
                    accumulatedSec++
                    if (accumulatedSec >= 600) {
                        unlockAchievement("ach_v61_outsider")
                    }
                }
            }
        }
    }

    // ===== Navigation =====
    fun enterHub() {
        audioManager.playDoorSound()
        _uiState.update { it.copy(screen = AppScreen.HUB, overlay = UiOverlay.None) }
    }

    fun backToTitle() {
        stopActiveGameplayLoops()
        audioManager.stopBgm()
        _uiState.update { it.copy(screen = AppScreen.TITLE, overlay = UiOverlay.None) }
    }

    fun switchHubTier(tier: HubCorridorTier) {
        _uiState.update { s ->
            val list = if (tier == HubCorridorTier.MAIN) s.dungeons.filter { it.id in 1..6 } else s.dungeons.filter { it.id >= 7 }
            s.copy(
                hubTier = tier,
                hubSelectedDungeonId = list.firstOrNull()?.id ?: 1
            )
        }
    }

    fun stepHubDungeon(delta: Int) {
        _uiState.update { s ->
            val list = s.activeCorridorDoors
            if (list.isEmpty()) return@update s
            val idx = list.indexOfFirst { it.id == s.hubSelectedDungeonId }.coerceAtLeast(0)
            val nextIdx = (idx + delta + list.size) % list.size
            s.copy(hubSelectedDungeonId = list[nextIdx].id)
        }
    }

    fun selectHubDungeon(doorId: Int) {
        _uiState.update { it.copy(hubSelectedDungeonId = doorId) }
    }

    fun ensureDoorSelected(doorId: Int) {
        val st = _uiState.value
        if (st.selectedDungeonMeta?.id == doorId) return
        val meta = st.dungeons.firstOrNull { it.id == doorId } ?: return
        _uiState.update {
            it.copy(
                hubSelectedDungeonId = doorId,
                selectedDungeonMeta = meta
            )
        }
    }

    fun enterDungeonFromHub() {
        val st = _uiState.value
        val meta = st.dungeons.firstOrNull { it.id == st.hubSelectedDungeonId } ?: return
        if (!st.isDungeonUnlocked(meta.id)) {
            _uiState.update { it.copy(overlay = UiOverlay.MysteryLock(meta)) }
            return
        }
        audioManager.playDoorSound()
        _uiState.update {
            it.copy(
                screen = AppScreen.GAME_TITLE,
                selectedDungeonMeta = meta,
                overlay = UiOverlay.None
            )
        }
    }

    fun backToHub() {
        stopActiveGameplayLoops()
        audioManager.stopBgm()
        _uiState.update { it.copy(screen = AppScreen.HUB, overlay = UiOverlay.None) }
    }

    fun showPreview(meta: DungeonMeta) {
        _uiState.update { it.copy(overlay = UiOverlay.PreviewDungeon(meta)) }
    }

    fun startDungeonGame(dailyChallenge: Boolean = false) {
        val meta = _uiState.value.selectedDungeonMeta ?: _uiState.value.dungeons.firstOrNull() ?: return
        startDungeonById(meta.id, dailyChallenge)
    }

    fun startDungeonById(doorId: Int, dailyChallenge: Boolean = false) {
        val meta = _uiState.value.dungeons.firstOrNull { it.id == doorId } ?: return
        currentScenes = assetRepo.getScenes(doorId)
        val init = meta.initState
        val progress = _uiState.value.progress
        val systems = _uiState.value.systems

        val boolFlags = mutableMapOf<String, Boolean>()
        val intCounters = mutableMapOf<String, Int>()
        val strMap = mutableMapOf<String, String>()
        init.flags.forEach { (k, el) ->
            if (el is JsonPrimitive) {
                el.booleanOrNull?.let { boolFlags[k] = it }
                    ?: el.intOrNull?.let { intCounters[k] = it }
                    ?: run { strMap[k] = el.content }
            }
        }

        val items = init.inventory.toMutableList()
        if ("shop_extra_item" in progress.purchasedShopItems && items.none { it.id == "mint_candy" }) {
            items.add(InventoryItem("mint_candy", "薄荷糖", "出發前帶在兜裡的薄荷糖。", "服用可減輕 25 點壓力"))
        }
        if (doorId == 1 && "shop_companion_select" in progress.purchasedShopItems && !progress.chosenStartCompanion.isNullOrBlank()) {
            boolFlags["chosen_companion_${progress.chosenStartCompanion}"] = true
        }

        var maxHp = init.maxHp
        if ("shop_hp20" in progress.purchasedShopItems) maxHp += 20
        val activeTarot = systems.v70Tarot.firstOrNull { it.id == progress.activeTarotId }
        if (activeTarot != null) maxHp += activeTarot.maxHpBonus

        var startHp = maxHp.coerceAtMost(init.hp + (maxHp - init.maxHp))
        if (activeTarot != null && activeTarot.hpBonus != 0) startHp = (startHp + activeTarot.hpBonus).coerceIn(1, maxHp)

        var startCountdown = init.countdown
        if (startCountdown != null && activeTarot != null && activeTarot.cdBonus != 0) {
            startCountdown += activeTarot.cdBonus
        }
        if ("c_timer" in progress.activeContracts && startCountdown != null) {
            startCountdown = (startCountdown * 0.8).toInt().coerceAtLeast(300)
        }
        if ("c_fragile" in progress.activeContracts) {
            maxHp = (maxHp * 0.75).toInt().coerceAtLeast(40)
            startHp = startHp.coerceAtMost(maxHp)
        }

        val defaultMembers = if (init.partyMembers.isNotEmpty()) {
            init.partyMembers
        } else {
            MetaSystemsBehavior.initPartyMembersForDungeon(
                dungeonId = doorId,
                hasSuwanUpgrade = "shop_suwan" in progress.purchasedShopItems,
                chosenCompanion = progress.chosenStartCompanion
            )
        }
        val startScene = init.currentScene.ifBlank { meta.startScene }

        val runtime = RuntimeDungeonState(
            dungeonId = doorId,
            currentScene = startScene,
            inventory = items,
            flags = boolFlags,
            counters = intCounters,
            strings = strMap,
            hp = startHp,
            maxHp = maxHp,
            shield = 0,
            party = init.party.coerceAtLeast(defaultMembers.size.coerceAtLeast(1)),
            countdown = startCountdown,
            adminQuestions = init.adminQuestions ?: 3,
            resets = init.resets,
            stress = init.stress,
            silence = init.silence,
            echo = init.echo,
            tide = init.tide,
            mirrorHp = init.mirrorHp,
            satiety = init.satiety,
            criticScore = init.criticScore,
            humanity = init.humanity,
            notes = init.notes,
            history = init.history,
            visitedScenes = emptySet(),
            personality = init.personality,
            mapZones = init.mapZones,
            partyMembers = defaultMembers,
            gameStartTimeMs = System.currentTimeMillis()
        )

        refreshSlotsState(doorId)
        _uiState.update {
            it.copy(
                screen = AppScreen.GAME,
                selectedDungeonMeta = meta,
                gameState = runtime,
                chronoStack = emptyList(),
                isDailyChallengeRun = dailyChallenge,
                ending = null,
                pseudoEnding = null,
                overlay = UiOverlay.None,
                doorTransitionText = "${meta.index} · ${meta.name}"
            )
        }

        viewModelScope.launch {
            delay(650L)
            _uiState.update { it.copy(doorTransitionText = null) }
        }

        audioManager.playDoorSound()
        audioManager.startBgm(doorId, _uiState.value.settings.jukeboxTheme, systems.audioThemes, systems.bgmChords)
        startCountdownLoop()
        goToScene(startScene)
    }

    fun resumeLastSession() {
        val last = persistence.loadLastSession() ?: return
        val meta = _uiState.value.dungeons.firstOrNull { it.id == last.dungeonId } ?: return
        currentScenes = assetRepo.getScenes(last.dungeonId)
        refreshSlotsState(last.dungeonId)
        _uiState.update {
            it.copy(
                screen = AppScreen.GAME,
                selectedDungeonMeta = meta,
                gameState = last.state,
                overlay = UiOverlay.None
            )
        }
        val systems = _uiState.value.systems
        audioManager.startBgm(last.dungeonId, _uiState.value.settings.jukeboxTheme, systems.audioThemes, systems.bgmChords)
        startCountdownLoop()
        goToScene(last.sceneId)
    }

    private fun stopActiveGameplayLoops() {
        typewriterJob?.cancel()
        countdownJob?.cancel()
        d3RhythmJob?.cancel()
    }

    private fun startCountdownLoop() {
        countdownJob?.cancel()
        countdownJob = viewModelScope.launch {
            while (isActive) {
                delay(1000L)
                val st = _uiState.value
                if (lifecyclePaused || st.screen != AppScreen.GAME || st.overlay != UiOverlay.None) continue
                val cd = st.gameState.countdown ?: continue
                if (cd > 0) {
                    val nextCd = cd - 1
                    _uiState.update { it.copy(gameState = it.gameState.copy(countdown = nextCd)) }
                    if (nextCd == 0) {
                        val handler = BehaviorRegistry.getHandler(st.gameState.dungeonId)
                        when (st.gameState.dungeonId) {
                            2 -> goToScene("d2_timeout")
                            3 -> goToScene("death_timeout")
                            11 -> goToScene("d11_end_exhibit")
                            else -> handler?.onEnter(this@GameViewModel, st.gameState.currentScene)
                        }
                    }
                }
            }
        }
    }

    // ===== Core Scene Transition & Rendering =====
    override fun goToScene(sceneId: String, delayMs: Long) {
        if (delayMs > 0L) {
            viewModelScope.launch {
                delay(delayMs)
                executeGoToScene(sceneId)
            }
        } else {
            executeGoToScene(sceneId)
        }
    }

    private fun executeGoToScene(sceneId: String) {
        if (currentScenes.isEmpty()) {
            currentScenes = assetRepo.getScenes(dungeonId)
        }
        val scene = currentScenes[sceneId]
        if (scene == null) {
            showToast("找不到場景：$sceneId")
            return
        }

        val currentVisited = _uiState.value.gameState.visitedScenes
        val alreadyVisited = sceneId in currentVisited
        val updatedZones = _uiState.value.gameState.mapZones.map { z ->
            val isCurr = z.id == scene.mapZone
            z.copy(explored = z.explored || isCurr, current = isCurr)
        }

        val updatedHistory = (_uiState.value.gameState.history + "${scene.roomName.ifBlank { sceneId }} ($sceneId)").takeLast(60)
        _uiState.update { s ->
            val readMap = s.progress.readScenesByDungeon.toMutableMap()
            val doorRead = (readMap[s.gameState.dungeonId].orEmpty() + sceneId)
            readMap[s.gameState.dungeonId] = doorRead
            val updatedProgress = s.progress.copy(readScenesByDungeon = readMap)
            persistence.saveProgress(updatedProgress)

            val newGameState = s.gameState.copy(
                currentScene = sceneId,
                visitedScenes = s.gameState.visitedScenes + sceneId,
                mapZones = updatedZones,
                history = updatedHistory
            )
            s.copy(
                gameState = newGameState,
                currentSceneDef = scene,
                roomDisplayNum = scene.room.ifBlank { "—" },
                roomDisplayName = scene.roomName.ifBlank { scene.id.ifBlank { sceneId } },
                moodKey = scene.mood.ifBlank { "normal" },
                paragraphs = emptyList(),
                progress = updatedProgress
            )
        }

        soundManager.playAmbientForDoor(
            doorId = dungeonId,
            sceneMood = scene.mood.ifBlank { "normal" },
            themeOverride = _uiState.value.settings.jukeboxTheme,
            themes = _uiState.value.systems.audioThemes,
            chordsFallback = _uiState.value.systems.bgmChords
        )

        if (scene.mood == "safe") {
            val tarot = _uiState.value.systems.v70Tarot.firstOrNull { it.id == _uiState.value.progress.activeTarotId }
            if (tarot != null && tarot.unvisitedHeal > 0 && !alreadyVisited) {
                heal(tarot.unvisitedHeal)
            }
        }

        // Chapter banner check
        val chapters = _uiState.value.systems.chapterDefs[dungeonId.toString()].orEmpty()
        val matchedChapter = chapters.firstOrNull { it.scene == sceneId }
        if (matchedChapter != null && !persistence.hasShownChapterCard(dungeonId, sceneId)) {
            persistence.markChapterCardShown(dungeonId, sceneId)
            _uiState.update { it.copy(chapterCard = ChapterCardBanner(matchedChapter)) }
            viewModelScope.launch {
                delay(2400L)
                _uiState.update { it.copy(chapterCard = null) }
            }
        }

        val handler = BehaviorRegistry.getHandler(dungeonId)
        handler?.onEnter(this, sceneId)

        // Check generic ending field if scene triggered no handler ending and has ending metadata
        if (_uiState.value.screen == AppScreen.GAME && scene.ending != null && scene.endingType != null) {
            triggerEnding(scene.endingType, scene.endingTitle ?: scene.roomName, scene.text.joinToString("\n").replace(Regex("<[^>]+>"), ""), scene.ending)
            return
        }

        // Compose scene paragraphs
        val baseParagraphs = mutableListOf<String>()
        val activeNpc = scene.npc ?: scene.npcs.firstOrNull()
        val prologue = activeNpc?.let { MetaSystemsBehavior.getInheritancePrologue(it, inheritance, isNgPlus) }
        if (!prologue.isNullOrBlank()) baseParagraphs.add("<p class=\"inherit-note\">$prologue</p>")

        val customText = handler?.getText(this, sceneId)
        if (customText != null) {
            baseParagraphs.addAll(customText)
            if (scene.text.isNotEmpty() && baseParagraphs.size <= 1) {
                baseParagraphs.addAll(scene.text)
            }
        } else if (alreadyVisited && !scene.textReturn.isNullOrEmpty()) {
            baseParagraphs.addAll(scene.textReturn)
        } else {
            baseParagraphs.addAll(scene.text)
        }

        val npcsMeta = _uiState.value.npcBundle.npcProfiles
        val presentNpc = scene.npc
        if (!presentNpc.isNullOrBlank() && presentNpc !in _uiState.value.progress.metNpcs) {
            val updatedMet = _uiState.value.progress.metNpcs + presentNpc
            updateProgress { it.copy(metNpcs = updatedMet) }
            val npcName = npcsMeta[presentNpc]?.name ?: presentNpc
            showToast("遇見人物：$npcName")
        }

        val renderedParagraphs = baseParagraphs.mapIndexed { i, html -> NarrativeParagraph("${sceneId}_$i", html) }
        val renderedChoices = buildRenderedChoices(scene, handler)

        // AutoSave
        val autoSlot = SaveSlotData(
            slotIndex = 0,
            timestamp = System.currentTimeMillis(),
            dungeonId = dungeonId,
            dungeonName = _uiState.value.selectedDungeonMeta?.name ?: "",
            sceneId = sceneId,
            roomName = scene.roomName,
            hp = state.hp,
            state = state
        )
        persistence.saveAutoSave(autoSlot)
        persistence.saveLastSession(
            LastSessionData(
                dungeonId = dungeonId,
                sceneId = sceneId,
                roomName = scene.roomName,
                timestamp = System.currentTimeMillis(),
                state = state
            )
        )

        _uiState.update {
            it.copy(
                paragraphs = renderedParagraphs,
                choices = renderedChoices,
                autoSaveSlot = autoSlot
            )
        }
        startTypewriter(renderedParagraphs)
    }

    private fun buildRenderedChoices(scene: SceneDef, handler: com.example.behaviors.DoorBehaviorHandler?): List<RenderedChoice> {
        val visited = state.visitedScenes
        val list = scene.choices.mapIndexedNotNull { idx, ch ->
            if (ch.hideIfVisited && !ch.next.isNullOrBlank() && ch.next in visited) return@mapIndexedNotNull null
            if (ch.hasCondition && handler != null && !handler.isChoiceVisible(this, scene.id.ifBlank { state.currentScene }, idx)) {
                return@mapIndexedNotNull null
            }
            val targetVisited = !ch.next.isNullOrBlank() && ch.next in visited
            val isCausal = ch.hasAction || ch.personality.isNotEmpty() || ch.text.contains("真結局") || ch.text.contains("支線")
            RenderedChoice(
                index = idx,
                text = ch.text,
                next = ch.next,
                danger = ch.danger,
                useless = ch.useless,
                observe = ch.observe,
                personality = ch.personality,
                isVisited = targetVisited,
                isCausalKey = isCausal
            )
        }.toMutableList()

        // Stress & Mood dynamic choices
        if (state.stress >= 100) {
            list.add(RenderedChoice(-102, "【精神崩潰】再也受不了這個地方了…", null, danger = true))
        } else if (state.stress >= 85) {
            list.add(RenderedChoice(-101, "【幻覺誘惑】跟隨壁縫裡微弱的私語走去", null, danger = true))
        }
        if (scene.mood == "safe" && state.stress >= 30 && !hasFlag("rest_${state.currentScene}")) {
            list.add(RenderedChoice(-103, "在安全區原地調息片刻（體力 +10，壓力 -15）", null))
        }
        if (_uiState.value.dailySeedInfo.dayOfWeek == 1 && !hasFlag("monday_rule_${state.currentScene}") && state.party > 1 && list.size > 1) {
            list.add(RenderedChoice(-104, "【週一每日守則】請隊伍最左側成員先行探路", null))
        }
        return list
    }

    private fun startTypewriter(paragraphs: List<NarrativeParagraph>) {
        typewriterJob?.cancel()
        val totalLen = paragraphs.sumOf { it.html.replace(Regex("<[^>]+>"), "").length }.coerceAtLeast(1)
        val speedSetting = _uiState.value.settings.typeSpeed
        val shouldSkipRead = _uiState.value.settings.autoSkipRead &&
            (_uiState.value.progress.readScenesByDungeon[dungeonId]?.contains(state.currentScene) == true)

        if (speedSetting == "instant" || shouldSkipRead) {
            _uiState.update { it.copy(typedCharLimit = Int.MAX_VALUE, typingDone = true) }
            return
        }

        val delayMs = when (speedSetting) {
            "slow" -> 28L
            "fast" -> 7L
            else -> 15L
        }
        val step = if (speedSetting == "fast") 4 else 2

        _uiState.update { it.copy(typedCharLimit = 0, typingDone = false) }
        typewriterJob = viewModelScope.launch {
            var pos = 0
            while (pos < totalLen && isActive) {
                pos += step
                audioManager.playTypeClick()
                _uiState.update { it.copy(typedCharLimit = pos) }
                delay(delayMs)
            }
            _uiState.update { it.copy(typedCharLimit = Int.MAX_VALUE, typingDone = true) }
            if (_uiState.value.settings.autoPlay) {
                delay(1800L)
            }
        }
    }

    fun skipTypewriter() {
        typewriterJob?.cancel()
        _uiState.update { it.copy(typedCharLimit = Int.MAX_VALUE, typingDone = true) }
    }

    fun onChoiceClicked(choice: RenderedChoice) {
        if (!_uiState.value.typingDone) {
            skipTypewriter()
            return
        }
        pushChronoSnapshot()
        audioManager.playSfx("page")

        when (choice.index) {
            -101 -> {
                damage(15)
                addStress(10)
                appendNarrative("<p class=\"danger-msg\">幻覺的低語讓你的指尖滲出冷汗，卻什麼也沒找到。</p>")
                return
            }
            -102 -> {
                damage(100)
                return
            }
            -103 -> {
                setFlag("rest_${state.currentScene}", true)
                heal(10)
                addStress(-15)
                appendNarrative("<p class=\"action\">你靠在牆邊深呼吸調息，精神穩定了些（體力 +10，壓力 -15）。</p>")
                refreshChoices()
                return
            }
            -104 -> {
                setFlag("monday_rule_${state.currentScene}", true)
                damage(12)
                appendNarrative("<p class=\"action\">【週一規則反噬】最左側的影子突然消失了一瞬，眾人心驚膽戰（HP -12）。</p>")
                refreshChoices()
                return
            }
        }

        // Apply personality delta
        if (choice.personality.isNotEmpty()) {
            val curP = state.personality
            val deltaP = curP.copy(
                calm = (curP.calm + (choice.personality["calm"] ?: 0)).coerceIn(0, 100),
                altruism = (curP.altruism + (choice.personality["altruism"] ?: 0)).coerceIn(0, 100),
                cautious = (curP.cautious + (choice.personality["cautious"] ?: 0)).coerceIn(0, 100)
            )
            _uiState.update { it.copy(gameState = it.gameState.copy(personality = deltaP)) }
        }

        // Observe or flavor inline
        if (choice.useless || !choice.observe.isNullOrBlank()) {
            val msg = choice.observe ?: "你仔細觀察了一會兒，沒有發現異常。"
            appendNarrative("<p class=\"system-msg\">$msg</p>")
            return
        }

        val handler = BehaviorRegistry.getHandler(dungeonId)
        val sceneId = state.currentScene
        val handled = handler?.onChoiceAction(this, sceneId, choice.index) == true
        if (!handled && !choice.next.isNullOrBlank()) {
            goToScene(choice.next)
        } else {
            refreshChoices()
        }
    }

    private fun refreshChoices() {
        val scene = _uiState.value.currentSceneDef ?: return
        val handler = BehaviorRegistry.getHandler(dungeonId)
        _uiState.update { it.copy(choices = buildRenderedChoices(scene, handler)) }
    }

    private fun pushChronoSnapshot() {
        val snap = ChronoSnapshot(
            sceneId = state.currentScene,
            roomName = _uiState.value.roomDisplayName,
            timestamp = System.currentTimeMillis(),
            state = state
        )
        _uiState.update { it.copy(chronoStack = (it.chronoStack + snap).takeLast(25)) }
    }

    // ===== BehaviorContext Implementation =====
    override fun hasItem(id: String): Boolean = state.inventory.any { it.id == id }

    override fun addItem(id: String, name: String, desc: String, usage: String) {
        if (hasItem(id)) return
        audioManager.playSfx("relic")
        val item = InventoryItem(id, name, desc, usage)
        _uiState.update { it.copy(gameState = it.gameState.copy(inventory = it.gameState.inventory + item)) }
        showSfxSubtitle("♪ 獲得物品：$name")
    }

    override fun removeItem(id: String) {
        _uiState.update {
            it.copy(gameState = it.gameState.copy(inventory = it.gameState.inventory.filterNot { item -> item.id == id }))
        }
    }

    override fun hasFlag(key: String): Boolean = state.flags[key] == true

    override fun setFlag(key: String, value: Boolean) {
        _uiState.update { it.copy(gameState = it.gameState.copy(flags = it.gameState.flags + (key to value))) }
    }

    override fun getCounter(key: String, default: Int): Int = state.counters[key] ?: default

    override fun setCounter(key: String, value: Int) {
        _uiState.update { it.copy(gameState = it.gameState.copy(counters = it.gameState.counters + (key to value))) }
    }

    override fun incCounter(key: String, delta: Int): Int {
        val next = getCounter(key) + delta
        setCounter(key, next)
        return next
    }

    override fun getStr(key: String, default: String): String = state.strings[key] ?: default

    override fun setStr(key: String, value: String) {
        _uiState.update { it.copy(gameState = it.gameState.copy(strings = it.gameState.strings + (key to value))) }
    }

    override fun damage(amount: Int) {
        var rem = amount
        if (_uiState.value.settings.difficulty == "easy") rem = (rem * 0.7).toInt().coerceAtLeast(1)
        if (_uiState.value.settings.difficulty == "hard") rem = (rem * 1.3).toInt()
        if ("c_no_heal" in _uiState.value.progress.activeContracts) rem += 3

        val currShield = state.shield
        val blocked = minOf(currShield, rem)
        rem -= blocked
        val nextShield = currShield - blocked
        val nextHp = (state.hp - rem).coerceAtLeast(0)
        audioManager.playSfx("hurt")
        showSfxSubtitle("♪ 受到 $rem 點傷害")
        _uiState.update { it.copy(gameState = it.gameState.copy(hp = nextHp, shield = nextShield)) }

        if (nextHp <= 0) {
            triggerEnding("death_hp", "體力耗盡", "你在冰冷的門扉前倒下，再也沒有力氣起身。", "死亡結局 · 力竭")
        }
    }

    override fun heal(amount: Int) {
        if ("c_no_heal" in _uiState.value.progress.activeContracts) {
            showToast("契約生效中：無法恢復體力")
            return
        }
        val nextHp = (state.hp + amount).coerceAtMost(state.maxHp)
        audioManager.playSfx("heal")
        _uiState.update { it.copy(gameState = it.gameState.copy(hp = nextHp)) }
    }

    override fun setHp(hp: Int) {
        _uiState.update { it.copy(gameState = it.gameState.copy(hp = hp.coerceIn(0, state.maxHp))) }
    }

    override fun addMaxHp(delta: Int) {
        val nextMax = (state.maxHp + delta).coerceAtLeast(20)
        _uiState.update { it.copy(gameState = it.gameState.copy(maxHp = nextMax, hp = minOf(it.gameState.hp, nextMax))) }
    }

    override fun addTime(minutes: Int) {
        val cur = state.countdown ?: return
        _uiState.update { it.copy(gameState = it.gameState.copy(countdown = cur + minutes * 60)) }
    }

    override fun loseTime(minutes: Int) {
        val cur = state.countdown ?: return
        _uiState.update { it.copy(gameState = it.gameState.copy(countdown = (cur - minutes * 60).coerceAtLeast(0))) }
    }

    override fun addStress(delta: Int) {
        val tarot = _uiState.value.systems.v70Tarot.firstOrNull { it.id == _uiState.value.progress.activeTarotId }
        val actual = if (delta > 0 && tarot != null && tarot.stressResist > 0) {
            (delta - tarot.stressResist).coerceAtLeast(1)
        } else delta
        val next = (state.stress + actual).coerceIn(0, 120)
        _uiState.update { it.copy(gameState = it.gameState.copy(stress = next)) }
    }

    override fun addSatiety(delta: Int) {
        val next = (state.satiety + delta).coerceIn(0, 220)
        _uiState.update { it.copy(gameState = it.gameState.copy(satiety = next)) }
    }

    override fun syncMirrorDamage(delta: Int) {
        val next = (state.mirrorHp - delta).coerceIn(0, 100)
        _uiState.update { it.copy(gameState = it.gameState.copy(mirrorHp = next)) }
    }

    override fun modHumanity(delta: Int) {
        val next = (state.humanity + delta).coerceIn(0, 100)
        _uiState.update { it.copy(gameState = it.gameState.copy(humanity = next)) }
    }

    override fun modCritic(delta: Int) {
        val next = (state.criticScore + delta).coerceIn(-20, 100)
        _uiState.update { it.copy(gameState = it.gameState.copy(criticScore = next)) }
    }

    override fun addEcho(delta: Int) {
        val next = (state.echo + delta).coerceAtLeast(0)
        _uiState.update { it.copy(gameState = it.gameState.copy(echo = next)) }
    }

    override fun setTide(tide: String) {
        _uiState.update { it.copy(gameState = it.gameState.copy(tide = tide)) }
    }

    override fun addChildhoodFrag(id: String) {
        setFlag("childhood_frag_$id", true)
    }

    override fun addNpcAffinity(npcId: String, delta: Int) {
        updateProgress { p ->
            val cur = p.npcAffinities[npcId] ?: 0
            p.copy(npcAffinities = p.npcAffinities + (npcId to (cur + delta).coerceIn(0, 100)))
        }
    }

    override fun killPartyMember(id: String) {
        val updated = state.partyMembers.map { if (it.id == id) it.copy(alive = false, hp = 0) else it }
        val aliveCount = updated.count { it.alive }
        _uiState.update { it.copy(gameState = it.gameState.copy(partyMembers = updated, party = aliveCount)) }
    }

    override fun setSilence(quiet: Boolean) {
        _uiState.update { it.copy(gameState = it.gameState.copy(silence = quiet)) }
    }

    override fun addNote(id: String, title: String, content: String) {
        if (state.notes.any { it.id == id }) return
        val note = NoteEntry(id = id, title = title, content = content, scene = state.currentScene)
        _uiState.update { it.copy(gameState = it.gameState.copy(notes = it.gameState.notes + note)) }
        showToast("新增回憶錄：$title")
    }

    override fun appendNarrative(html: String) {
        val p = NarrativeParagraph("dyn_${System.nanoTime()}", html)
        _uiState.update { it.copy(paragraphs = it.paragraphs + p, typingDone = true, typedCharLimit = Int.MAX_VALUE) }
    }

    override fun setRoom(room: String, roomName: String) {
        _uiState.update { it.copy(roomDisplayNum = room, roomDisplayName = roomName) }
    }

    override fun showToast(msg: String) {
        toastJob?.cancel()
        _uiState.update { it.copy(toastMessage = msg) }
        toastJob = viewModelScope.launch {
            delay(2500L)
            _uiState.update { it.copy(toastMessage = null) }
        }
    }

    private fun showSfxSubtitle(text: String) {
        if (!_uiState.value.settings.sfxSubtitles) return
        _uiState.update { it.copy(sfxSubtitle = text) }
        viewModelScope.launch {
            delay(1800L)
            _uiState.update { it.copy(sfxSubtitle = null) }
        }
    }

    // ===== Modals & Encounters =====
    override fun openPuzzle(title: String, text: String, answer: String, hint: String?, onResult: (Boolean) -> Unit) {
        pendingChoiceOnResult = onResult
        val modal = PuzzleModalState(title = title, text = text, answer = answer, hint = hint, onResult = onResult)
        _uiState.update { it.copy(overlay = UiOverlay.Puzzle(modal)) }
    }

    fun togglePuzzleHint() {
        val ov = _uiState.value.overlay as? UiOverlay.Puzzle ?: return
        if (ov.state.hintRemaining <= 0 || ov.state.hintVisible) return
        _uiState.update {
            it.copy(overlay = UiOverlay.Puzzle(ov.state.copy(hintVisible = true, hintRemaining = 0)))
        }
    }

    fun submitPuzzleAnswer(input: String) {
        val ov = _uiState.value.overlay as? UiOverlay.Puzzle ?: return
        val normalized = input.trim().uppercase()
        val expected = ov.state.answer.trim().uppercase()
        if (normalized == expected) {
            _uiState.update { it.copy(overlay = UiOverlay.None) }
            ov.state.onResult(true)
            refreshChoices()
        } else {
            _uiState.update {
                it.copy(overlay = UiOverlay.Puzzle(ov.state.copy(errorText = "答案不正確，請再思考看看")))
            }
            ov.state.onResult(false)
        }
    }

    override fun openAdmin() {
        _uiState.update {
            it.copy(
                overlay = UiOverlay.AdminQa(
                    com.example.model.AdminQaState(
                        remainingQuestions = state.adminQuestions,
                        qaLog = listOf("管理員" to "你還有 ${state.adminQuestions} 次提問機會。說吧，你想知道什麼？")
                    )
                )
            )
        }
    }

    fun submitAdminQuestion(q: String) {
        val ov = _uiState.value.overlay as? UiOverlay.AdminQa ?: return
        if (q.isBlank() || ov.state.remainingQuestions <= 0) return
        val reply = MetaSystemsBehavior.askLibraryAdmin(q)
        val rem = (ov.state.remainingQuestions - 1).coerceAtLeast(0)
        _uiState.update { it.copy(gameState = it.gameState.copy(adminQuestions = rem)) }
        _uiState.update {
            it.copy(
                overlay = UiOverlay.AdminQa(
                    ov.state.copy(
                        remainingQuestions = rem,
                        qaLog = ov.state.qaLog + ("你：$q" to "管理員：$reply")
                    )
                )
            )
        }
        if (rem == 0) {
            unlockAchievement("ach_d2_admin")
        }
    }

    override fun openDialogPanel(npcId: String?) {
        val bundle = _uiState.value.npcBundle
        val targetNpc = npcId ?: _uiState.value.currentSceneDef?.npc ?: _uiState.value.currentSceneDef?.npcs?.firstOrNull() ?: "suwan"
        val tree = bundle.dialogueTrees[targetNpc]
        val startNode = if (hasFlag("visited_npc_$targetNpc")) tree?.startReturning ?: "root" else tree?.start ?: "root"
        setFlag("visited_npc_$targetNpc", true)
        _uiState.update { it.copy(overlay = UiOverlay.DialogDrawer(targetNpc, startNode)) }
    }

    fun selectDialogNpc(npcId: String) {
        openDialogPanel(npcId)
    }

    fun advanceDialogNode(npcId: String, nextNodeId: String) {
        val tree = _uiState.value.npcBundle.dialogueTrees[npcId] ?: return
        val node = tree.nodes[nextNodeId] ?: return
        if (!node.onVisitFlag.isNullOrBlank()) {
            setFlag(node.onVisitFlag, true)
            addNpcAffinity(npcId, 5)
        }
        _uiState.update { it.copy(overlay = UiOverlay.DialogDrawer(npcId, nextNodeId)) }
    }

    override fun openMiniGame(mgId: String, fromStory: Boolean) {
        val st = MiniGameAndCombatEngine.createMiniGameState(mgId, fromStory)
        _uiState.update { it.copy(overlay = UiOverlay.MiniGame(st)) }
        d3RhythmJob?.cancel()
        if (mgId == "mg_d3") {
            d3RhythmJob = viewModelScope.launch {
                while (isActive) {
                    delay(45L)
                    val ov = _uiState.value.overlay as? UiOverlay.MiniGame ?: break
                    if (ov.state.mgId != "mg_d3") break
                    _uiState.update { it.copy(overlay = UiOverlay.MiniGame(MiniGameAndCombatEngine.tickD3Cursor(ov.state))) }
                }
            }
        }
    }

    fun stepMiniGameD1(r: Int, c: Int) {
        val ov = _uiState.value.overlay as? UiOverlay.MiniGame ?: return
        val (next, won) = MiniGameAndCombatEngine.stepD1Move(ov.state, r, c)
        handleMiniGameStep(next, won)
    }

    fun stepMiniGameD2(r: Int, c: Int) {
        val ov = _uiState.value.overlay as? UiOverlay.MiniGame ?: return
        val (next, won) = MiniGameAndCombatEngine.stepD2Toggle(ov.state, r, c)
        handleMiniGameStep(next, won)
    }

    fun hitMiniGameD3() {
        val ov = _uiState.value.overlay as? UiOverlay.MiniGame ?: return
        val (next, won) = MiniGameAndCombatEngine.hitD3Pulse(ov.state)
        handleMiniGameStep(next, won)
    }

    fun flipMiniGameD4(index: Int) {
        val ov = _uiState.value.overlay as? UiOverlay.MiniGame ?: return
        val (next, won, needClose) = MiniGameAndCombatEngine.flipD4Card(ov.state, index)
        handleMiniGameStep(next, won)
        if (needClose) {
            viewModelScope.launch {
                delay(650L)
                val curr = _uiState.value.overlay as? UiOverlay.MiniGame ?: return@launch
                _uiState.update { it.copy(overlay = UiOverlay.MiniGame(MiniGameAndCombatEngine.closeD4Mismatched(curr.state))) }
            }
        }
    }

    fun rotateMiniGameD5(r: Int, c: Int) {
        val ov = _uiState.value.overlay as? UiOverlay.MiniGame ?: return
        val (next, won) = MiniGameAndCombatEngine.rotateD5Pipe(ov.state, r, c)
        handleMiniGameStep(next, won)
    }

    fun updateMiniGameD6(freq: Int, amp: Int, phase: Int) {
        val ov = _uiState.value.overlay as? UiOverlay.MiniGame ?: return
        val (next, won) = MiniGameAndCombatEngine.updateD6Wave(ov.state, freq, amp, phase)
        handleMiniGameStep(next, won)
    }

    private fun handleMiniGameStep(next: com.example.model.MiniGameModalState, won: Boolean) {
        _uiState.update { it.copy(overlay = UiOverlay.MiniGame(next)) }
        if (won) {
            d3RhythmJob?.cancel()
            val reward = MiniGameAndCombatEngine.getMiniGameReward(next.mgId)
            updateProgress { p ->
                val map = p.minigamesCleared.toMutableMap()
                map[next.mgId] = (map[next.mgId] ?: 0) + 1
                p.copy(minigamesCleared = map, memoryShards = p.memoryShards + 15)
            }
            unlockAchievement(reward.achId)
            val clearedSet = _uiState.value.progress.minigamesCleared.keys
            if (listOf("mg_d1", "mg_d2", "mg_d3", "mg_d4", "mg_d5", "mg_d6").all { it in clearedSet }) {
                unlockAchievement("ach_mg_all")
            }
            if (next.fromStory) {
                addItem(reward.itemId, reward.itemName, reward.itemDesc, reward.itemUsage)
                appendNarrative(reward.narrativeHtml)
                if (next.mgId == "mg_d3") {
                    setFlag("d3_machine_fixed", true)
                }
            }
            showToast("小遊戲通關！獲得「${reward.itemName}」與 15 記憶碎片")
            viewModelScope.launch {
                delay(700L)
                _uiState.update { it.copy(overlay = UiOverlay.None) }
                refreshChoices()
            }
        }
    }

    override fun openV59Puzzle(type: V59PuzzleType, onSolved: () -> Unit) {
        pendingV59OnSolved = onSolved
        val st = MiniGameAndCombatEngine.createV59PuzzleState(type, onSolved)
        _uiState.update { it.copy(overlay = UiOverlay.V59Puzzle(st)) }
    }

    fun stepV59WordMatch(isLeft: Boolean, idx: Int) {
        val ov = _uiState.value.overlay as? UiOverlay.V59Puzzle ?: return
        val (next, won) = MiniGameAndCombatEngine.stepWordMatchClick(ov.state, isLeft, idx)
        finishV59IfWon(next, won)
    }

    fun stepV59Slide(idx: Int) {
        val ov = _uiState.value.overlay as? UiOverlay.V59Puzzle ?: return
        val (next, won) = MiniGameAndCombatEngine.stepSlidingTile(ov.state, idx)
        finishV59IfWon(next, won)
    }

    fun hitV59Rhythm() {
        val ov = _uiState.value.overlay as? UiOverlay.V59Puzzle ?: return
        val (next, won) = MiniGameAndCombatEngine.stepRhythmHit(ov.state)
        finishV59IfWon(next, won)
    }

    fun toggleV59Mirror(idx: Int) {
        val ov = _uiState.value.overlay as? UiOverlay.V59Puzzle ?: return
        val (next, won) = MiniGameAndCombatEngine.toggleMirrorAngle(ov.state, idx)
        finishV59IfWon(next, won)
    }

    fun skipV59WithIntuition() {
        val ov = _uiState.value.overlay as? UiOverlay.V59Puzzle ?: return
        if (_uiState.value.progress.memoryShards < 15) {
            showToast("記憶碎片不足（需要 15 碎片）")
            return
        }
        updateProgress { it.copy(memoryShards = it.memoryShards - 15) }
        finishV59IfWon(ov.state, true)
    }

    private fun finishV59IfWon(next: com.example.model.V59PuzzleModalState, won: Boolean) {
        if (won) {
            _uiState.update { it.copy(overlay = UiOverlay.None) }
            next.onSolved?.invoke() ?: pendingV59OnSolved?.invoke()
            pendingV59OnSolved = null
            refreshChoices()
        } else {
            _uiState.update { it.copy(overlay = UiOverlay.V59Puzzle(next)) }
        }
    }

    override fun openCombat(enemyKey: String?, onWin: (() -> Unit)?, onEscape: (() -> Unit)?) {
        pendingCombatWin = onWin
        pendingCombatEscape = onEscape
        val key = enemyKey ?: MiniGameAndCombatEngine.generateDailyRandomCombat()
        val hasEye = "all_seeing_eye" in _uiState.value.progress.equippedRelics
        val st = MiniGameAndCombatEngine.createCombatState(
            enemyKey = key,
            systems = _uiState.value.systems,
            isNgPlus = isNgPlus,
            dailyRuleDay = _uiState.value.dailySeedInfo.dayOfWeek,
            hasAllSeeingEye = hasEye,
            onWin = onWin,
            onEscape = onEscape
        )
        _uiState.update { it.copy(overlay = UiOverlay.Combat(st)) }
    }

    fun useCombatItem(itemDef: CombatItemDef) {
        val ov = _uiState.value.overlay as? UiOverlay.Combat ?: return
        val c = ov.state
        val enchanted = itemDef.id in _uiState.value.progress.enchantedItems
        val (dmg, isWeak) = MiniGameAndCombatEngine.calculateAttackDamage(itemDef, c.weaknessType, enchanted)
        val nextHp = (c.enemyHp - dmg).coerceAtLeast(0)
        val freezeTurns = if (itemDef.targetType == "cold") 1 else c.frozenTurns
        val weakText = if (isWeak) "【弱點命中！】" else ""
        val logLine = "$weakText 使用「${itemDef.name}」造成 $dmg 點傷害！"

        if (nextHp <= 0) {
            updateProgress { it.copy(combatWins = it.combatWins + 1, memoryShards = it.memoryShards + 20) }
            if (_uiState.value.progress.combatWins + 1 >= 5) unlockAchievement("ach_v61_slayer")
            _uiState.update { it.copy(overlay = UiOverlay.None) }
            showToast("戰鬥勝利！獲得 20 記憶碎片")
            c.onWin?.invoke() ?: pendingCombatWin?.invoke()
            pendingCombatWin = null
            refreshChoices()
            return
        }

        // Enemy counterattack
        val counterDmg = if (freezeTurns > 0) 0 else c.enemyAtk
        val counterMsg = if (freezeTurns > 0) "${c.enemyName} 處於凍結狀態，本回合無法行動！" else "${c.enemyName} 反擊造成 $counterDmg 點傷害！"
        if (counterDmg > 0) damage(counterDmg)
        if (_uiState.value.screen == AppScreen.ENDING) return

        _uiState.update {
            it.copy(
                overlay = UiOverlay.Combat(
                    c.copy(
                        enemyHp = nextHp,
                        frozenTurns = (freezeTurns - 1).coerceAtLeast(0),
                        lastDamageBadge = dmg,
                        logs = (c.logs + logLine + counterMsg).takeLast(6)
                    )
                )
            )
        }
    }

    fun combatBasicStrike() {
        useCombatItem(
            CombatItemDef("bare_hand", "邏輯破綻突刺", "基礎攻擊", "none", "無", 24, "瞄準防禦空隙突刺。")
        )
    }

    fun combatPersuade() {
        val ov = _uiState.value.overlay as? UiOverlay.Combat ?: return
        val c = ov.state
        if (state.personality.altruism >= 55 || c.enemyHp <= c.enemyMaxHp / 2) {
            _uiState.update { it.copy(overlay = UiOverlay.None) }
            showToast("你安撫了對方的執念，化干戈為玉帛！")
            c.onWin?.invoke() ?: pendingCombatWin?.invoke()
            pendingCombatWin = null
            refreshChoices()
        } else {
            damage(c.enemyAtk / 2)
            _uiState.update {
                it.copy(overlay = UiOverlay.Combat(c.copy(logs = (c.logs + "說服未果，敵人依然充滿敵意！").takeLast(6))))
            }
        }
    }

    fun combatEscape() {
        val ov = _uiState.value.overlay as? UiOverlay.Combat ?: return
        _uiState.update { it.copy(overlay = UiOverlay.None) }
        ov.state.onEscape?.invoke() ?: pendingCombatEscape?.invoke()
        pendingCombatEscape = null
    }

    override fun openOutsiderDialog(dungeonId: Int) {
        _uiState.update { it.copy(overlay = UiOverlay.OutsiderDialog) }
    }

    fun giveOutsiderShard() {
        if (_uiState.value.progress.memoryShards < 5) {
            showToast("記憶碎片不足（需要 5 碎片）")
            return
        }
        updateProgress {
            val nextAff = (it.outsiderAffinity + 15).coerceAtMost(100)
            it.copy(memoryShards = it.memoryShards - 5, outsiderAffinity = nextAff)
        }
        heal(20)
        showToast("局外人收下碎片並回贈了暖意（好感度 +15，HP +20）")
    }

    // ===== Achievements, Fragments, Relics & Progression =====
    override fun unlockAchievement(id: String) {
        if (id in _uiState.value.progress.unlockedAchievements) return
        val achDef = _uiState.value.dungeons.flatMap { it.achDefs }.firstOrNull { it.id == id }
        updateProgress { p ->
            p.copy(
                unlockedAchievements = p.unlockedAchievements + id,
                memoryShards = p.memoryShards + 10
            )
        }
        audioManager.playSfx("bell")
        if (achDef != null) {
            achBannerJob?.cancel()
            _uiState.update { it.copy(achievementBanner = achDef) }
            achBannerJob = viewModelScope.launch {
                delay(3200L)
                _uiState.update { it.copy(achievementBanner = null) }
            }
        }
    }

    override fun findFragment(id: String) {
        if (id in _uiState.value.progress.foundFragments) return
        val frag = _uiState.value.systems.v4Fragments[id]
        updateProgress { p ->
            p.copy(
                foundFragments = p.foundFragments + id,
                memoryShards = p.memoryShards + 15
            )
        }
        showToast("獲得記憶碎片：${frag?.name ?: id}（+15 碎片）")
        if (allFragmentsFound()) unlockAchievement("ach_v4_all_frags")
    }

    override fun allFragmentsFound(): Boolean {
        val totalKeys = _uiState.value.systems.v4Fragments.keys
        return totalKeys.isNotEmpty() && totalKeys.all { it in _uiState.value.progress.foundFragments }
    }

    override fun grantRelicV5(id: String) {
        if (id in _uiState.value.progress.foundRelicsV5) return
        val relic = _uiState.value.systems.v5Relics[id]
        updateProgress { it.copy(foundRelicsV5 = it.foundRelicsV5 + id) }
        showToast("獲得核心遺物：${relic?.name ?: id}")
        val allV5 = _uiState.value.systems.v5Relics.keys
        if (allV5.isNotEmpty() && allV5.all { it in _uiState.value.progress.foundRelicsV5 }) {
            unlockAchievement("ach_v5_all_relics")
        }
    }

    override fun isRelicUsed(id: String): Boolean = hasFlag("side_relic_used_$id")
    override fun setRelicUsed(id: String) = setFlag("side_relic_used_$id", true)
    override fun hasSideRelic(id: String): Boolean = id in _uiState.value.progress.titleFlags
    override fun saveSideChainFlag(key: String, value: Boolean) {
        updateProgress { p ->
            val next = if (value) p.titleFlags + key else p.titleFlags - key
            p.copy(titleFlags = next)
        }
    }

    override fun saveInheritance(transform: (InheritanceData) -> InheritanceData) {
        updateProgress { it.copy(inheritance = transform(it.inheritance)) }
    }

    override fun markDungeonCleared(did: Int) {
        updateProgress { p ->
            val nextCleared = p.clearedDungeons + did
            var nextInh = p.inheritance
            if (did == 1) nextInh = nextInh.copy(firstCleared = true)
            if (did == 2) nextInh = nextInh.copy(secondCleared = true)
            if (did == 3) nextInh = nextInh.copy(thirdCleared = true)
            p.copy(clearedDungeons = nextCleared, inheritance = nextInh)
        }
        if ((1..6).all { it in _uiState.value.progress.clearedDungeons }) {
            unlockAchievement("ach_all_6_doors")
        }
        if (did == 6) {
            updateProgress { it.copy(inheritance = it.inheritance.copy(ngPlus = true)) }
        }
    }

    override fun isCleared(did: Int): Boolean = did in _uiState.value.progress.clearedDungeons

    override fun getEndingLog(): List<String> = _uiState.value.progress.endingsLog

    // ===== Endings & Pseudo Endings =====
    override fun triggerEnding(type: String, title: String, desc: String, reward: String, delayMs: Long) {
        if (delayMs > 0L) {
            viewModelScope.launch {
                delay(delayMs)
                executeTriggerEnding(type, title, desc, reward)
            }
        } else {
            executeTriggerEnding(type, title, desc, reward)
        }
    }

    private fun executeTriggerEnding(type: String, title: String, desc: String, reward: String) {
        stopActiveGameplayLoops()
        val isBad = type.startsWith("death") || type.startsWith("bad")
        val isGood = type == "true" || type.contains("true") || type.contains("hidden")
        val catLabel = when {
            type.contains("true") -> "✦ 真 · 結 局 ✦"
            type.contains("hidden") -> "◈ 隱 藏 結 局 ◈"
            type.contains("survive") -> "◇ 逃 過 一 劫 ◇"
            isBad -> "✕ 壞 結 局 ✕"
            else -> "◆ 普 通 結 局 ◆"
        }

        val entryKey = "$dungeonId|$type|$title"
        val elapsedSec = ((System.currentTimeMillis() - state.gameStartTimeMs) / 1000L).coerceAtLeast(1L)
        val elapsedStr = "%02d:%02d".format(elapsedSec / 60, elapsedSec % 60)

        var shardEarned = if (isGood) 30 else if (isBad) 8 else 18
        if (_uiState.value.isDailyChallengeRun) shardEarned += _uiState.value.dailySeedInfo.bonusShards
        val contractsHeat = _uiState.value.systems.v64Contracts
            .filter { it.id in _uiState.value.progress.activeContracts }
            .sumOf { it.heat }
        shardEarned += contractsHeat * 10

        updateProgress { p ->
            val newEndings = if (entryKey in p.endingsLog) p.endingsLog else p.endingsLog + entryKey
            val newDeathCount = if (isBad) p.inheritance.deathCount + 1 else p.inheritance.deathCount
            val dailyCompleted = if (_uiState.value.isDailyChallengeRun) {
                p.dailyCompletedDates + _uiState.value.dailySeedInfo.dateKey
            } else p.dailyCompletedDates
            p.copy(
                endingsLog = newEndings,
                memoryShards = p.memoryShards + shardEarned,
                totalPlayMs = p.totalPlayMs + elapsedSec * 1000L,
                trialCrowns = if (contractsHeat > 0 && !isBad) p.trialCrowns + contractsHeat else p.trialCrowns,
                dailyCompletedDates = dailyCompleted,
                inheritance = p.inheritance.copy(deathCount = newDeathCount)
            )
        }
        if (isGood) {
            markDungeonCleared(dungeonId)
        }
        if (isBad && _uiState.value.progress.inheritance.deathCount >= 3) {
            unlockAchievement("ach_deaths_3")
        }
        if (elapsedSec <= 90L && !isBad) {
            unlockAchievement("ach_speedrun")
        }

        audioManager.playEndingDrum(!isBad)
        val aliveNames = state.partyMembers.filter { it.alive }.map { it.name }
        val presentation = EndingPresentation(
            type = type,
            categoryLabel = catLabel,
            isGood = isGood,
            isBad = isBad,
            title = title,
            desc = desc,
            reward = if (reward.isBlank()) "記憶碎片 +$shardEarned" else "$reward · 記憶碎片 +$shardEarned",
            elapsedFormatted = elapsedStr,
            scenesVisitedCount = state.visitedScenes.size,
            alivePartyNames = aliveNames,
            personality = state.personality,
            fateSummary = if (aliveNames.size == state.partyMembers.size && aliveNames.isNotEmpty()) "全員平安同行" else "見證者已紀錄因果"
        )
        persistence.saveLastSession(null)
        _uiState.update { it.copy(screen = AppScreen.ENDING, ending = presentation, pseudoEnding = null) }
    }

    override fun triggerPseudoEnding(title: String, desc: String, metaText: String, returnSceneId: String) {
        val pe = PseudoEndingPresentation(title = title, desc = desc, metaText = metaText, returnSceneId = returnSceneId, phase = 0)
        _uiState.update { it.copy(pseudoEnding = pe) }
        viewModelScope.launch {
            delay(1800L)
            _uiState.update { s -> s.pseudoEnding?.let { s.copy(pseudoEnding = it.copy(phase = 1)) } ?: s }
            delay(1200L)
            _uiState.update { s -> s.pseudoEnding?.let { s.copy(pseudoEnding = it.copy(phase = 2)) } ?: s }
            delay(1800L)
            _uiState.update { it.copy(pseudoEnding = null) }
            goToScene(returnSceneId)
        }
    }

    // ===== Special Door Helpers =====
    override fun recordBuffetStoryTasted(id: Int) {
        updateProgress { it.copy(buffetStoriesSeen = it.buffetStoriesSeen + id) }
    }

    override fun getBuffetStory(id: Int): BuffetStoryDef? =
        MetaSystemsBehavior.getBuffetStoryById(id, _uiState.value.systems)

    override fun recordMovieWatched(id: String) {
        updateProgress { it.copy(moviesWatched = it.moviesWatched + id) }
    }

    override fun markD12FloorVisited(floor: Int) {
        updateProgress { it.copy(d12VisitedFloors = it.d12VisitedFloors + floor) }
    }

    override fun getVisitedD12Floors(): Set<Int> = _uiState.value.progress.d12VisitedFloors

    override fun recordD13Ending(id: String, name: String, isTrust: Boolean, isShatter: Boolean) {
        updateProgress { it.copy(d13UnlockedEndings = it.d13UnlockedEndings + id) }
        val entry = "13|mirror_$id|$name"
        if (entry !in _uiState.value.progress.endingsLog) {
            updateProgress { it.copy(endingsLog = it.endingsLog + entry) }
        }
    }

    override fun getD13UnlockedEndings(): Set<String> = _uiState.value.progress.d13UnlockedEndings

    override fun buildDualNarrativeHtml(mainText: String, mirrorText: String): String =
        "<div class=\"dual-track\"><p><strong>【正側電車】</strong></p>$mainText<p><strong>【鏡像電車】</strong></p>$mirrorText</div>"

    override fun triggerOutsiderAchievementCheck() = unlockAchievement("ach_v61_outsider")

    override fun useSedativeBadEnd() {
        damage(100)
    }

    override fun randomNurseEncounter() {
        addStress(15)
        damage(10)
        appendNarrative("<p class=\"danger-msg\">走廊深處傳來推車金屬摩擦聲，一名無臉護士擦身而過！（體力 -10，壓力 +15）</p>")
    }

    override fun guardAsked() {
        val c = incCounter("d2_guard_asks")
        if (c >= 3) unlockAchievement("ach_d2_admin")
    }

    override fun checkCat() {
        val c = incCounter("d1_cat_checks")
        if (c >= 1) unlockAchievement("ach_d1_cat")
    }

    override fun checkUnchosen() {
        if (state.visitedScenes.size >= 15) setFlag("all_explored", true)
    }

    override fun checkVoices() {
        addStress(8)
        appendNarrative("<p class=\"ghost\">天花板通風口裡有人在唸你的名字……聲音與你一模一樣。</p>")
    }

    override fun checkWatcher() {
        addStress(6)
        appendNarrative("<p class=\"ghost\">門縫下的一道視線悄悄移開了。</p>")
    }

    // ===== Inventory & Combine & Heal =====
    fun useInventoryItem(item: InventoryItem) {
        if (MetaSystemsBehavior.isConsumable(item.id)) {
            val used = MetaSystemsBehavior.useConsumableItem(this, item.id)
            if (used) {
                closeOverlay()
                refreshChoices()
            }
        } else {
            _uiState.update { it.copy(overlay = UiOverlay.ItemDetail(item)) }
        }
    }

    fun healPartyMemberWithItem(item: InventoryItem, memberId: String) {
        if (!hasItem(item.id)) return
        val healAmt = when (item.id) {
            "painkiller" -> 25
            "antibiotic" -> 30
            "epinephrine" -> 45
            "bandage" -> 20
            else -> 25
        }
        removeItem(item.id)
        val updatedMembers = state.partyMembers.map { m ->
            if (m.id == memberId && m.alive) m.copy(hp = (m.hp + healAmt).coerceAtMost(m.maxHp)) else m
        }
        _uiState.update { it.copy(gameState = it.gameState.copy(partyMembers = updatedMembers), overlay = UiOverlay.Inventory) }
        showToast("已替隊友恢復 $healAmt 點體力")
    }

    fun toggleCombineMode() {
        _uiState.update { it.copy(combineMode = !it.combineMode, combineSelectedIds = emptyList()) }
    }

    fun toggleCombineItem(id: String) {
        _uiState.update { s ->
            val cur = s.combineSelectedIds.toMutableList()
            if (id in cur) cur.remove(id) else if (cur.size < 2) cur.add(id)
            s.copy(combineSelectedIds = cur)
        }
    }

    fun executeCombine() {
        val sel = _uiState.value.combineSelectedIds
        if (sel.size != 2) return
        val recipes = _uiState.value.systems.combinationRecipes
        val matched = recipes.entries.firstOrNull { (_, r) ->
            r.ingredients.size == 2 && r.ingredients.toSet() == sel.toSet()
        }
        if (matched == null) {
            showToast("這兩樣物品無法組合出新線索")
            return
        }
        sel.forEach { removeItem(it) }
        addItem(matched.key, matched.value.name, matched.value.desc, matched.value.usage)
        _uiState.update { it.copy(combineMode = false, combineSelectedIds = emptyList()) }
        showToast("組合成功：獲得「${matched.value.name}」！")
    }

    fun togglePinItem(id: String) {
        updateProgress { p ->
            val next = if (id in p.pinnedItems) p.pinnedItems - id else p.pinnedItems + id
            p.copy(pinnedItems = next)
        }
    }

    // ===== Save / Load / Chrono / Settings / Overlay Controls =====
    fun openOverlay(overlay: UiOverlay) {
        if (overlay is UiOverlay.DeductionRadar) {
            refreshDeductionRadar()
        } else if (overlay is UiOverlay.SaveLoad) {
            refreshSlotsState(dungeonId)
        }
        _uiState.update { it.copy(overlay = overlay) }
    }

    fun closeOverlay() {
        d3RhythmJob?.cancel()
        _uiState.update { it.copy(overlay = UiOverlay.None, combineMode = false, combineSelectedIds = emptyList()) }
    }

    fun toggleTopBarCollapsed() {
        _uiState.update { it.copy(topBarCollapsed = !it.topBarCollapsed) }
    }

    private fun refreshSlotsState(did: Int) {
        val slots = (1..3).map { persistence.loadSaveSlot(did, it) }
        val auto = persistence.loadAutoSave(did)
        _uiState.update { it.copy(saveSlots = slots, autoSaveSlot = auto) }
    }

    fun saveToSlot(slotIdx: Int) {
        val slot = SaveSlotData(
            slotIndex = slotIdx,
            timestamp = System.currentTimeMillis(),
            dungeonId = dungeonId,
            dungeonName = _uiState.value.selectedDungeonMeta?.name ?: "",
            sceneId = state.currentScene,
            roomName = _uiState.value.roomDisplayName,
            hp = state.hp,
            state = state
        )
        persistence.saveToSlot(slot)
        refreshSlotsState(dungeonId)
        showToast("已保存至存檔槽 $slotIdx")
    }

    fun loadFromSlot(slot: SaveSlotData) {
        currentScenes = assetRepo.getScenes(slot.dungeonId)
        _uiState.update { it.copy(gameState = slot.state, overlay = UiOverlay.None) }
        goToScene(slot.sceneId)
        showToast("已讀取存檔：${slot.roomName}")
    }

    fun deleteSlot(slotIdx: Int) {
        persistence.deleteSlot(dungeonId, slotIdx)
        refreshSlotsState(dungeonId)
    }

    fun rewindToChronoIndex(index: Int) {
        val stack = _uiState.value.chronoStack
        val snap = stack.getOrNull(index) ?: return
        _uiState.update {
            it.copy(
                gameState = snap.state,
                chronoStack = stack.take(index),
                overlay = UiOverlay.None
            )
        }
        goToScene(snap.sceneId)
        showToast("時間回溯至「${snap.roomName}」")
    }

    fun saveChronoAnchor(slot: Int) {
        val anchor = ChronoAnchorData(
            slot = slot,
            dungeonId = dungeonId,
            sceneId = state.currentScene,
            roomName = _uiState.value.roomDisplayName,
            timestamp = System.currentTimeMillis(),
            state = state
        )
        val updated = _uiState.value.chronoAnchors.toMutableList()
        while (updated.size < 3) updated.add(null)
        updated[slot.coerceIn(0, 2)] = anchor
        persistence.saveChronoAnchors(updated)
        _uiState.update { it.copy(chronoAnchors = updated) }
        showToast("已寫入時光錨點 #${slot + 1}")
    }

    fun loadChronoAnchor(anchor: ChronoAnchorData) {
        currentScenes = assetRepo.getScenes(anchor.dungeonId)
        val meta = _uiState.value.dungeons.firstOrNull { it.id == anchor.dungeonId }
        _uiState.update {
            it.copy(
                screen = AppScreen.GAME,
                selectedDungeonMeta = meta,
                gameState = anchor.state,
                overlay = UiOverlay.None
            )
        }
        startCountdownLoop()
        goToScene(anchor.sceneId)
        showToast("已從時光錨點躍遷")
    }

    fun generateTransferCode(): String {
        val code = persistence.exportTransferCode()
        _uiState.update { it.copy(transferCodePreview = code) }
        return code
    }

    fun importTransferCode(code: String) {
        val res = persistence.importTransferCode(code)
        if (res.isSuccess) {
            val progress = persistence.loadProgress()
            val settings = persistence.loadSettings()
            audioManager.updateSettings(settings)
            _uiState.update {
                it.copy(
                    progress = progress,
                    settings = settings,
                    lastSession = persistence.loadLastSession()
                )
            }
            showToast("跨裝置引繼碼匯入成功！")
        } else {
            showToast("引繼失敗：${res.exceptionOrNull()?.message ?: "格式無效"}")
        }
    }

    fun updateSettings(transform: (GameSettings) -> GameSettings) {
        val next = transform(_uiState.value.settings)
        persistence.saveSettings(next)
        audioManager.updateSettings(next)
        _uiState.update { it.copy(settings = next) }
    }

    fun updateQuickNotes(notes: String) {
        updateProgress { it.copy(quickNotes = notes) }
    }

    fun updateProgress(transform: (GlobalProgress) -> GlobalProgress) {
        val next = transform(_uiState.value.progress)
        persistence.saveProgress(next)
        _uiState.update {
            it.copy(
                progress = next,
                dailySeedInfo = SanctumAndRadarEngine.getTodaySeedInfo(next.dailyRuleOverrideDay)
            )
        }
    }

    // ===== Meta Systems: Sanctum / Alchemy / EnvGaze / Riddles / Anomaly / Shop / Radar =====
    fun equipTarot(tarotId: String) {
        updateProgress { it.copy(activeTarotId = if (it.activeTarotId == tarotId) null else tarotId) }
    }

    fun toggleEquipRelic(relicId: String) {
        updateProgress { p ->
            val list = p.equippedRelics.toMutableList()
            if (relicId in list) {
                list.remove(relicId)
            } else {
                if (list.size >= 3) list.removeAt(0)
                list.add(relicId)
            }
            p.copy(equippedRelics = list)
        }
    }

    fun challengeGauntletBoss(gate: Int) {
        val boss = _uiState.value.systems.v70Gauntlet.firstOrNull { it.gate == gate } ?: return
        if (gate in _uiState.value.progress.gauntletCleared) {
            showToast("第 $gate 門試煉已通關")
            return
        }
        updateProgress { p ->
            p.copy(
                gauntletCleared = p.gauntletCleared + gate,
                memoryShards = p.memoryShards + boss.rewardShards
            )
        }
        showToast("擊破【${boss.name}】！獲得 +${boss.rewardShards} 記憶碎片")
        if ((1..14).all { it in _uiState.value.progress.gauntletCleared }) {
            unlockAchievement("ach_v70_prime_architect")
        }
    }

    fun craftAlchemyRecipe(recipeId: String) {
        val r = _uiState.value.systems.v64Alchemy.firstOrNull { it.id == recipeId } ?: return
        val p = _uiState.value.progress
        if (p.envGazeFound.size < r.reqEnv || p.riddlesSolved.size < r.reqRiddle || p.memoryShards < r.shardCost) {
            showToast("調合條件不足（凝視 ${p.envGazeFound.size}/${r.reqEnv} · 謎語 ${p.riddlesSolved.size}/${r.reqRiddle} · 碎片 ${p.memoryShards}/${r.shardCost}）")
            return
        }
        updateProgress {
            it.copy(
                memoryShards = it.memoryShards - r.shardCost + r.shards,
                alchemyCrafted = it.alchemyCrafted + r.id
            )
        }
        if (r.heal > 0) heal(r.heal)
        if (r.stress != 0) addStress(r.stress)
        if (r.maxHp > 0) addMaxHp(r.maxHp)
        if (r.cd > 0) addTime(r.cd / 60)
        if (r.echo > 0) addEcho(r.echo)
        if (r.shield > 0) {
            _uiState.update { it.copy(gameState = it.gameState.copy(shield = it.gameState.shield + r.shield)) }
        }
        if (r.partyHeal) {
            val healedMembers = state.partyMembers.map { m -> if (m.alive) m.copy(hp = m.maxHp) else m }
            _uiState.update { it.copy(gameState = it.gameState.copy(partyMembers = healedMembers)) }
        }
        if (!r.giveToken.isNullOrBlank()) {
            addItem(r.giveToken, r.name, r.rewardText, "秘術調合產物")
        }
        showToast("秘術調合成功：${r.name}！")
    }

    fun discoverEnvGaze(envId: String) {
        if (envId in _uiState.value.progress.envGazeFound) return
        updateProgress { it.copy(envGazeFound = it.envGazeFound + envId, memoryShards = it.memoryShards + 5) }
        showToast("環境凝視新發現！記憶碎片 +5")
    }

    fun answerGateRiddle(doorId: Int, selectedIndex: Int) {
        val riddle = _uiState.value.systems.v64Riddles[doorId.toString()] ?: return
        if (doorId in _uiState.value.progress.riddlesSolved) return
        if (selectedIndex == riddle.ans) {
            updateProgress { it.copy(riddlesSolved = it.riddlesSolved + doorId, memoryShards = it.memoryShards + 12) }
            audioManager.playSfx("bell")
            showToast("門扉謎語解答正確！獲得 12 記憶碎片")
        } else {
            showToast("答案有誤，請再讀一遍謎題提示")
        }
    }

    fun triggerGateAnomalyChoice(doorId: Int, choiceIndex: Int) {
        if (doorId in _uiState.value.progress.anomalyUsedByDoor) {
            showToast("本門扉的異常事件已共振過")
            return
        }
        val msg = MetaSystemsBehavior.triggerAnomalyEffect(doorId, choiceIndex, this)
        updateProgress { it.copy(anomalyUsedByDoor = it.anomalyUsedByDoor + doorId) }
        showToast(msg)
    }

    fun purchaseShopItem(itemId: String) {
        val def = _uiState.value.systems.shopItems.firstOrNull { it.id == itemId } ?: return
        if (itemId in _uiState.value.progress.purchasedShopItems) {
            showToast("已擁有此項強化")
            return
        }
        if (_uiState.value.progress.memoryShards < def.cost) {
            showToast("記憶碎片不足（需要 ${def.cost}）")
            return
        }
        updateProgress { p ->
            var next = p.copy(
                memoryShards = p.memoryShards - def.cost,
                purchasedShopItems = p.purchasedShopItems + itemId
            )
            if (itemId == "shop_enchant_lighter") next = next.copy(enchantedItems = next.enchantedItems + "lighter")
            if (itemId == "shop_secret_rooms_50") {
                next = next.copy(titleFlags = next.titleFlags + "shop_secret_rooms_50")
            }
            next
        }
        if (itemId == "shop_bg_bamboo") {
            updateSettings { it.copy(bgTone = "bamboo") }
        }
        showToast("購買成功：${def.name}")
    }

    fun selectStartCompanion(compId: String) {
        updateProgress { it.copy(chosenStartCompanion = compId) }
        showToast("已設定開局同行夥伴")
    }

    fun toggleContract(contractId: String) {
        updateProgress { p ->
            val list = p.activeContracts.toMutableList()
            if (contractId in list) list.remove(contractId) else list.add(contractId)
            p.copy(activeContracts = list)
        }
    }

    fun refreshDeductionRadar() {
        val did = dungeonId
        val scenes = if (currentScenes.isNotEmpty()) currentScenes else assetRepo.getScenes(did)
        val totalEndings = _uiState.value.dungeons.firstOrNull { it.id == did }?.endingsTotal ?: 10
        val report = SanctumAndRadarEngine.analyzeDeductionRadar(
            dungeonId = did,
            scenes = scenes,
            state = state,
            progress = _uiState.value.progress,
            systems = _uiState.value.systems,
            totalEndingsInDoor = totalEndings,
            gapHint = MetaSystemsBehavior.getTrueEndingGapHint(did, this)
        )
        _uiState.update { it.copy(deductionRadarReport = report) }
    }

    fun clickJigsawTile(idx: Int) {
        val selected = _uiState.value.jigsawSelectedIdx
        if (selected == null) {
            _uiState.update { it.copy(jigsawSelectedIdx = idx) }
            return
        }
        if (selected == idx) {
            _uiState.update { it.copy(jigsawSelectedIdx = null) }
            return
        }
        val (nextTiles, won) = SanctumAndRadarEngine.swapJigsawTiles(_uiState.value.jigsawTiles, selected, idx)
        _uiState.update { it.copy(jigsawTiles = nextTiles, jigsawSelectedIdx = null) }
        if (won && !_uiState.value.progress.jigsawSolved) {
            updateProgress { it.copy(jigsawSolved = true, memoryShards = it.memoryShards + 50) }
            showToast("核心記憶拼圖重構完成！記憶碎片 +50")
        }
    }

    fun startNewGamePlus() {
        val meta = _uiState.value.selectedDungeonMeta ?: _uiState.value.dungeons.firstOrNull() ?: return
        updateProgress {
            it.copy(
                inheritance = it.inheritance.copy(
                    ngPlus = true,
                    loopCount = it.inheritance.loopCount + 1
                )
            )
        }
        startDungeonById(meta.id, dailyChallenge = false)
    }

    fun restartCurrentDungeon() {
        startDungeonById(dungeonId, _uiState.value.isDailyChallengeRun)
    }

    fun unlockAllDoorsGm() {
        updateProgress {
            it.copy(
                clearedDungeons = (1..14).toSet(),
                inheritance = it.inheritance.copy(ngPlus = true, firstCleared = true, secondCleared = true, thirdCleared = true)
            )
        }
        showToast("GM：已解鎖全部 14 扇門扉與 NG+")
    }

    fun grantShardsGm(amount: Int) {
        updateProgress { it.copy(memoryShards = it.memoryShards + amount) }
        showToast("GM：記憶碎片 +$amount")
    }

    fun gmJumpToScene(sceneId: String) {
        if (currentScenes.containsKey(sceneId)) {
            closeOverlay()
            goToScene(sceneId)
        } else {
            showToast("當前門扉不存在場景 $sceneId")
        }
    }

    fun exportEndingCardShareIntent(context: android.content.Context): Result<Intent> {
        val st = _uiState.value
        val ending = st.ending ?: return Result.failure(IllegalStateException("目前沒有可分享的結局"))
        val meta = st.selectedDungeonMeta
        return SanctumAndRadarEngine.exportEndingCardPngAndShare(
            context = context,
            dungeonName = meta?.name ?: "無盡之門",
            dungeonIndex = meta?.index ?: "",
            ending = ending,
            unlockedTitlesCount = st.unlockedTitlesCount
        )
    }

    // ===== Google Cloud Save & Cross-Device Sync =====

    fun attachCloudAccount(account: CloudAccountInfo) {
        if (account.uid.isBlank()) return
        if (activeCloudAccount?.uid == account.uid && cloudObserverJob?.isActive == true) return

        detachCloudAccount()
        activeCloudAccount = account

        val localSnap = persistence.buildLocalSnapshot(_uiState.value.dungeons)
        _uiState.update {
            it.copy(
                cloudSync = CloudSyncUiState(
                    account = account,
                    isLoadingCloud = true,
                    localSummary = localSnap.summary,
                    cloudSummary = null,
                    recommendedDirection = SyncDirection.ALREADY_IN_SYNC
                )
            )
        }

        // Start real-time Firestore observation scoped to this signed-in user
        cloudObserverJob = viewModelScope.launch {
            cloudRepo.observeCloudSave(account.uid)
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val rootError = firestoreError ?: error
                    _uiState.update { s ->
                        s.copy(
                            cloudSync = s.cloudSync.copy(
                                isLoadingCloud = false,
                                errorMessage = "無法即時監聽雲端存檔：${rootError.message ?: "請檢查網路連線"}"
                            )
                        )
                    }
                }
                .collect { remoteSnap ->
                    latestCloudSnapshot = remoteSnap
                    val latestLocal = persistence.buildLocalSnapshot(_uiState.value.dungeons)
                    val direction = CloudSyncResolver.resolveLatest(latestLocal, remoteSnap)
                    _uiState.update { s ->
                        s.copy(
                            cloudSync = s.cloudSync.copy(
                                isLoadingCloud = false,
                                localSummary = latestLocal.summary,
                                cloudSummary = remoteSnap?.summary,
                                recommendedDirection = direction,
                                errorMessage = null
                            )
                        )
                    }
                }
        }

        // Perform automatic latest-wins sync immediately on login / device switch
        performAutoLoginSync(account)
    }

    fun detachCloudAccount() {
        cloudObserverJob?.cancel()
        cloudObserverJob = null
        cloudSyncJob?.cancel()
        cloudSyncJob = null
        activeCloudAccount = null
        latestCloudSnapshot = null
        _uiState.update {
            it.copy(cloudSync = CloudSyncUiState())
        }
    }

    private fun performAutoLoginSync(account: CloudAccountInfo) {
        cloudSyncJob?.cancel()
        cloudSyncJob = viewModelScope.launch {
            _uiState.update { s ->
                s.copy(cloudSync = s.cloudSync.copy(isSyncing = true, errorMessage = null))
            }
            val fetchResult = cloudRepo.fetchCloudSave(account.uid)
            fetchResult.fold(
                onSuccess = { remoteSnap ->
                    latestCloudSnapshot = remoteSnap
                    val localSnap = persistence.buildLocalSnapshot(_uiState.value.dungeons)
                    val direction = CloudSyncResolver.resolveLatest(localSnap, remoteSnap)
                    when (direction) {
                        SyncDirection.CLOUD_TO_LOCAL -> {
                            if (remoteSnap != null) {
                                applyCloudSnapshotToLocal(remoteSnap)
                                val refreshedLocal = persistence.buildLocalSnapshot(_uiState.value.dungeons)
                                _uiState.update { s ->
                                    s.copy(
                                        cloudSync = s.cloudSync.copy(
                                            isSyncing = false,
                                            isLoadingCloud = false,
                                            localSummary = refreshedLocal.summary,
                                            cloudSummary = remoteSnap.summary,
                                            recommendedDirection = SyncDirection.ALREADY_IN_SYNC,
                                            lastSyncAtMs = System.currentTimeMillis(),
                                            statusMessage = "已自動從 Google 帳號載入最新雲端存檔",
                                            errorMessage = null
                                        )
                                    )
                                }
                                showToast("已自動載入 Google 帳號最新雲端存檔")
                            }
                        }
                        SyncDirection.LOCAL_TO_CLOUD -> {
                            if (localSnap.summary.hasData || remoteSnap == null) {
                                val uploadSnap = localSnap.copy(
                                    updatedAtMs = localSnap.updatedAtMs.coerceAtLeast(System.currentTimeMillis())
                                )
                                persistence.setLocalUpdatedAtMs(uploadSnap.updatedAtMs)
                                val uploadRes = cloudRepo.uploadCloudSave(
                                    userId = account.uid,
                                    displayName = account.displayName,
                                    snapshot = uploadSnap
                                )
                                uploadRes.fold(
                                    onSuccess = { uploaded ->
                                        latestCloudSnapshot = uploaded
                                        val refreshedLocal = persistence.buildLocalSnapshot(_uiState.value.dungeons)
                                        _uiState.update { s ->
                                            s.copy(
                                                cloudSync = s.cloudSync.copy(
                                                    isSyncing = false,
                                                    isLoadingCloud = false,
                                                    localSummary = refreshedLocal.summary,
                                                    cloudSummary = uploaded.summary,
                                                    recommendedDirection = SyncDirection.ALREADY_IN_SYNC,
                                                    lastSyncAtMs = System.currentTimeMillis(),
                                                    statusMessage = "已將本機最新進度同步至 Google 帳號",
                                                    errorMessage = null
                                                )
                                            )
                                        }
                                        showToast("已將本機最新進度同步至 Google 帳號")
                                    },
                                    onFailure = { err ->
                                        _uiState.update { s ->
                                            s.copy(
                                                cloudSync = s.cloudSync.copy(
                                                    isSyncing = false,
                                                    isLoadingCloud = false,
                                                    localSummary = localSnap.summary,
                                                    cloudSummary = remoteSnap?.summary,
                                                    recommendedDirection = direction,
                                                    errorMessage = "自動上傳雲端失敗：${err.localizedMessage ?: "請稍後重試"}"
                                                )
                                            )
                                        }
                                    }
                                )
                            } else {
                                _uiState.update { s ->
                                    s.copy(cloudSync = s.cloudSync.copy(isSyncing = false, isLoadingCloud = false))
                                }
                            }
                        }
                        SyncDirection.ALREADY_IN_SYNC -> {
                            _uiState.update { s ->
                                s.copy(
                                    cloudSync = s.cloudSync.copy(
                                        isSyncing = false,
                                        isLoadingCloud = false,
                                        localSummary = localSnap.summary,
                                        cloudSummary = remoteSnap?.summary,
                                        recommendedDirection = SyncDirection.ALREADY_IN_SYNC,
                                        lastSyncAtMs = System.currentTimeMillis(),
                                        statusMessage = "本機與 Google 帳號進度已為最新狀態",
                                        errorMessage = null
                                    )
                                )
                            }
                        }
                    }
                },
                onFailure = { err ->
                    val localSnap = persistence.buildLocalSnapshot(_uiState.value.dungeons)
                    _uiState.update { s ->
                        s.copy(
                            cloudSync = s.cloudSync.copy(
                                isSyncing = false,
                                isLoadingCloud = false,
                                localSummary = localSnap.summary,
                                errorMessage = "讀取 Google 雲端存檔失敗：${err.localizedMessage ?: "請檢查網路連線"}"
                            )
                        )
                    }
                }
            )
        }
    }

    fun refreshCloudComparison() {
        val account = activeCloudAccount ?: return
        viewModelScope.launch {
            val localSnap = persistence.buildLocalSnapshot(_uiState.value.dungeons)
            _uiState.update { s ->
                s.copy(
                    cloudSync = s.cloudSync.copy(
                        isLoadingCloud = true,
                        localSummary = localSnap.summary,
                        errorMessage = null
                    )
                )
            }
            cloudRepo.fetchCloudSave(account.uid).fold(
                onSuccess = { remoteSnap ->
                    latestCloudSnapshot = remoteSnap
                    val freshLocal = persistence.buildLocalSnapshot(_uiState.value.dungeons)
                    val direction = CloudSyncResolver.resolveLatest(freshLocal, remoteSnap)
                    _uiState.update { s ->
                        s.copy(
                            cloudSync = s.cloudSync.copy(
                                isLoadingCloud = false,
                                localSummary = freshLocal.summary,
                                cloudSummary = remoteSnap?.summary,
                                recommendedDirection = direction,
                                errorMessage = null
                            )
                        )
                    }
                },
                onFailure = { err ->
                    _uiState.update { s ->
                        s.copy(
                            cloudSync = s.cloudSync.copy(
                                isLoadingCloud = false,
                                errorMessage = "重新整理雲端進度失敗：${err.localizedMessage ?: "請稍後再試"}"
                            )
                        )
                    }
                }
            )
        }
    }

    fun syncLatestWithCloud() {
        val account = activeCloudAccount ?: return
        cloudSyncJob?.cancel()
        cloudSyncJob = viewModelScope.launch {
            _uiState.update { s ->
                s.copy(
                    cloudSync = s.cloudSync.copy(
                        isSyncing = true,
                        statusMessage = null,
                        errorMessage = null
                    )
                )
            }
            val fetchRes = cloudRepo.fetchCloudSave(account.uid)
            fetchRes.fold(
                onSuccess = { remoteSnap ->
                    latestCloudSnapshot = remoteSnap
                    val localSnap = persistence.buildLocalSnapshot(_uiState.value.dungeons)
                    val direction = CloudSyncResolver.resolveLatest(localSnap, remoteSnap)
                    when (direction) {
                        SyncDirection.CLOUD_TO_LOCAL -> {
                            if (remoteSnap != null) {
                                applyCloudSnapshotToLocal(remoteSnap)
                                val freshLocal = persistence.buildLocalSnapshot(_uiState.value.dungeons)
                                _uiState.update { s ->
                                    s.copy(
                                        cloudSync = s.cloudSync.copy(
                                            isSyncing = false,
                                            localSummary = freshLocal.summary,
                                            cloudSummary = remoteSnap.summary,
                                            recommendedDirection = SyncDirection.ALREADY_IN_SYNC,
                                            lastSyncAtMs = System.currentTimeMillis(),
                                            statusMessage = "同步完成：已將 Google 帳號最新進度載入本機。",
                                            errorMessage = null
                                        )
                                    )
                                }
                                showToast("已同步 Google 帳號最新進度至本機")
                            }
                        }
                        SyncDirection.LOCAL_TO_CLOUD, SyncDirection.ALREADY_IN_SYNC -> {
                            val nowMs = maxOf(System.currentTimeMillis(), localSnap.updatedAtMs)
                            val uploadSnap = localSnap.copy(updatedAtMs = nowMs)
                            persistence.setLocalUpdatedAtMs(nowMs)
                            cloudRepo.uploadCloudSave(
                                userId = account.uid,
                                displayName = account.displayName,
                                snapshot = uploadSnap
                            ).fold(
                                onSuccess = { uploaded ->
                                    latestCloudSnapshot = uploaded
                                    val freshLocal = persistence.buildLocalSnapshot(_uiState.value.dungeons)
                                    _uiState.update { s ->
                                        s.copy(
                                            cloudSync = s.cloudSync.copy(
                                                isSyncing = false,
                                                localSummary = freshLocal.summary,
                                                cloudSummary = uploaded.summary,
                                                recommendedDirection = SyncDirection.ALREADY_IN_SYNC,
                                                lastSyncAtMs = System.currentTimeMillis(),
                                                statusMessage = "同步完成：已將最新進度上傳至 Google 帳號。",
                                                errorMessage = null
                                            )
                                        )
                                    }
                                    showToast("已將最新進度同步至 Google 帳號")
                                },
                                onFailure = { err ->
                                    _uiState.update { s ->
                                        s.copy(
                                            cloudSync = s.cloudSync.copy(
                                                isSyncing = false,
                                                errorMessage = "同步上傳失敗：${err.localizedMessage ?: "請稍後再試"}"
                                            )
                                        )
                                    }
                                }
                            )
                        }
                    }
                },
                onFailure = { err ->
                    _uiState.update { s ->
                        s.copy(
                            cloudSync = s.cloudSync.copy(
                                isSyncing = false,
                                errorMessage = "同步失敗：${err.localizedMessage ?: "請檢查網路連線"}"
                            )
                        )
                    }
                }
            )
        }
    }

    fun pushLocalToCloudForce() {
        val account = activeCloudAccount ?: return
        cloudSyncJob?.cancel()
        cloudSyncJob = viewModelScope.launch {
            _uiState.update { s ->
                s.copy(cloudSync = s.cloudSync.copy(isSyncing = true, statusMessage = null, errorMessage = null))
            }
            val nowMs = System.currentTimeMillis()
            persistence.setLocalUpdatedAtMs(nowMs)
            val localSnap = persistence.buildLocalSnapshot(_uiState.value.dungeons).copy(updatedAtMs = nowMs)
            cloudRepo.uploadCloudSave(
                userId = account.uid,
                displayName = account.displayName,
                snapshot = localSnap
            ).fold(
                onSuccess = { uploaded ->
                    latestCloudSnapshot = uploaded
                    val freshLocal = persistence.buildLocalSnapshot(_uiState.value.dungeons)
                    _uiState.update { s ->
                        s.copy(
                            cloudSync = s.cloudSync.copy(
                                isSyncing = false,
                                localSummary = freshLocal.summary,
                                cloudSummary = uploaded.summary,
                                recommendedDirection = SyncDirection.ALREADY_IN_SYNC,
                                lastSyncAtMs = System.currentTimeMillis(),
                                statusMessage = "已以本機存檔覆蓋 Google 帳號雲端進度。",
                                errorMessage = null
                            )
                        )
                    }
                    showToast("已將本機進度上傳覆蓋至雲端")
                },
                onFailure = { err ->
                    _uiState.update { s ->
                        s.copy(
                            cloudSync = s.cloudSync.copy(
                                isSyncing = false,
                                errorMessage = "上傳失敗：${err.localizedMessage ?: "請稍後再試"}"
                            )
                        )
                    }
                }
            )
        }
    }

    fun pullCloudToLocalForce() {
        val account = activeCloudAccount ?: return
        cloudSyncJob?.cancel()
        cloudSyncJob = viewModelScope.launch {
            _uiState.update { s ->
                s.copy(cloudSync = s.cloudSync.copy(isSyncing = true, statusMessage = null, errorMessage = null))
            }
            cloudRepo.fetchCloudSave(account.uid).fold(
                onSuccess = { remoteSnap ->
                    if (remoteSnap == null) {
                        _uiState.update { s ->
                            s.copy(
                                cloudSync = s.cloudSync.copy(
                                    isSyncing = false,
                                    errorMessage = "Google 帳號目前尚無可下載的雲端存檔。"
                                )
                            )
                        }
                    } else {
                        latestCloudSnapshot = remoteSnap
                        applyCloudSnapshotToLocal(remoteSnap)
                        val freshLocal = persistence.buildLocalSnapshot(_uiState.value.dungeons)
                        _uiState.update { s ->
                            s.copy(
                                cloudSync = s.cloudSync.copy(
                                    isSyncing = false,
                                    localSummary = freshLocal.summary,
                                    cloudSummary = remoteSnap.summary,
                                    recommendedDirection = SyncDirection.ALREADY_IN_SYNC,
                                    lastSyncAtMs = System.currentTimeMillis(),
                                    statusMessage = "已將 Google 帳號雲端存檔載入並套用至本機。",
                                    errorMessage = null
                                )
                            )
                        }
                        showToast("已從雲端還原最新存檔至本機")
                    }
                },
                onFailure = { err ->
                    _uiState.update { s ->
                        s.copy(
                            cloudSync = s.cloudSync.copy(
                                isSyncing = false,
                                errorMessage = "下載雲端存檔失敗：${err.localizedMessage ?: "請稍後再試"}"
                            )
                        )
                    }
                }
            )
        }
    }

    private fun applyCloudSnapshotToLocal(snapshot: FullSaveSnapshot) {
        persistence.applyFullSnapshot(snapshot)
        soundManager.updateSettings(snapshot.settings)
        val activeDoorId = _uiState.value.gameState.dungeonId
        val slots = listOf(1, 2, 3).map { persistence.loadSaveSlot(activeDoorId, it) }
        val autoSlot = persistence.loadAutoSave(activeDoorId)
        _uiState.update { s ->
            s.copy(
                progress = snapshot.progress,
                settings = snapshot.settings,
                lastSession = snapshot.lastSession,
                chronoAnchors = persistence.loadChronoAnchors(),
                saveSlots = slots,
                autoSaveSlot = autoSlot,
                dailySeedInfo = SanctumAndRadarEngine.getTodaySeedInfo(snapshot.progress.dailyRuleOverrideDay)
            )
        }
    }
}
