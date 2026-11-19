package com.example.model

import kotlinx.serialization.Serializable

enum class AppScreen {
    TITLE,
    HUB,
    GAME_TITLE,
    GAME,
    ENDING
}

@Serializable
data class InheritanceData(
    val mirrorDefeated: Boolean = false,
    val goldenKey: Boolean = false,
    val basementKnowledge: Boolean = false,
    val tradedAdmin: Boolean = false,
    val aloneEscape: Boolean = false,
    val trusted: Boolean = false,
    val lostLimb: Boolean = false,
    val adminGuest: Boolean = false,
    val chenSurvived: Boolean = false,
    val laozhouSurvived: Boolean = false,
    val suwanSurvived: Boolean = false,
    val xiaoyuSurvived: Boolean = false,
    val yuanyuanCarried: Boolean = false,
    val memoryKept: Boolean = false,
    val memoryDeleted: Boolean = false,
    val firstCleared: Boolean = false,
    val secondCleared: Boolean = false,
    val thirdCleared: Boolean = false,
    val ngPlus: Boolean = false,
    val deathCount: Int = 0,
    val loopCount: Int = 0,
    val memoryFragments: List<String> = emptyList()
)

@Serializable
data class RuntimeDungeonState(
    val dungeonId: Int = 1,
    val currentScene: String = "prelude",
    val inventory: List<InventoryItem> = emptyList(),
    val flags: Map<String, Boolean> = emptyMap(),
    val counters: Map<String, Int> = emptyMap(),
    val strings: Map<String, String> = emptyMap(),
    val hp: Int = 100,
    val maxHp: Int = 100,
    val shield: Int = 0,
    val party: Int = 4,
    val countdown: Int? = null,
    val adminQuestions: Int = 3,
    val resets: Int = 0,
    val stress: Int = 0,
    val silence: Boolean = true,
    val echo: Int = 0,
    val tide: String = "low",
    val mirrorHp: Int = 100,
    val satiety: Int = 0,
    val criticScore: Int = 80,
    val humanity: Int = 100,
    val notes: List<NoteEntry> = emptyList(),
    val history: List<String> = emptyList(),
    val visitedScenes: Set<String> = emptySet(),
    val personality: PersonalityStats = PersonalityStats(),
    val mapZones: List<MapZone> = emptyList(),
    val partyMembers: List<PartyMember> = emptyList(),
    val gameStartTimeMs: Long = System.currentTimeMillis()
)

@Serializable
data class SaveSlotData(
    val slotIndex: Int,
    val timestamp: Long,
    val dungeonId: Int,
    val dungeonName: String,
    val sceneId: String,
    val roomName: String,
    val hp: Int,
    val state: RuntimeDungeonState
)

@Serializable
data class LastSessionData(
    val dungeonId: Int,
    val sceneId: String,
    val roomName: String,
    val timestamp: Long,
    val state: RuntimeDungeonState
)

@Serializable
data class ChronoAnchorData(
    val slot: Int,
    val dungeonId: Int,
    val sceneId: String,
    val roomName: String,
    val timestamp: Long,
    val state: RuntimeDungeonState
)

@Serializable
data class GameSettings(
    val typeSpeed: String = "normal", // slow, normal, fast, instant
    val fontSize: String = "normal",  // small, normal, large, xlarge
    val soundEnabled: Boolean = true,
    val masterVolume: Float = 0.7f,
    val bgmVolume: Float = 0.6f,
    val sfxVolume: Float = 0.8f,
    val theme: String = "default",    // default, blood, ice, forest, violet, amber, jade
    val bgTone: String = "ink",       // ink, bamboo, crimson, azure
    val fontFamily: String = "serif", // serif, sans, mono
    val difficulty: String = "normal",// easy, normal, hard
    val autoSkipRead: Boolean = false,
    val autoPlay: Boolean = false,
    val reducedMotion: Boolean = false,
    val highContrast: Boolean = false,
    val flashSafe: Boolean = false,
    val sfxSubtitles: Boolean = false,
    val fastCombat: Boolean = false,
    val jukeboxTheme: String? = null
)

@Serializable
data class GlobalProgress(
    val endingsLog: List<String> = emptyList(),       // "dungeonId|type|title"
    val unlockedAchievements: List<String> = emptyList(),
    val clearedDungeons: Set<Int> = emptySet(),
    val inheritance: InheritanceData = InheritanceData(),
    val memoryShards: Int = 0,
    val totalPlayMs: Long = 0L,
    val foundFragments: Set<String> = emptySet(),
    val foundRelicsV5: Set<String> = emptySet(),
    val equippedRelics: List<String> = emptyList(),   // max 3
    val activeContracts: List<String> = emptyList(),
    val trialCrowns: Int = 0,
    val alchemyCrafted: Set<String> = emptySet(),
    val anomalyUsedByDoor: Set<Int> = emptySet(),
    val envGazeFound: Set<String> = emptySet(),
    val riddlesSolved: Set<Int> = emptySet(),
    val activeTarotId: String? = null,
    val gauntletCleared: Set<Int> = emptySet(),
    val pinnedItems: Set<String> = emptySet(),
    val enchantedItems: Set<String> = emptySet(),
    val purchasedShopItems: Set<String> = emptySet(),
    val chosenStartCompanion: String? = null,
    val jigsawSolved: Boolean = false,
    val combatWins: Int = 0,
    val buffetStoriesSeen: Set<Int> = emptySet(),
    val moviesWatched: Set<String> = emptySet(),
    val animalsFed: Set<String> = emptySet(),
    val dailyStreak: Int = 1,
    val dailyCompletedDates: Set<String> = emptySet(),
    val dailyRuleOverrideDay: Int? = null,
    val minigamesCleared: Map<String, Int> = emptyMap(),
    val d12VisitedFloors: Set<Int> = emptySet(),
    val d13UnlockedEndings: Set<String> = emptySet(),
    val outsiderAffinity: Int = 0,
    val metNpcs: Set<String> = emptySet(),
    val readScenesByDungeon: Map<Int, Set<String>> = emptyMap(),
    val npcAffinities: Map<String, Int> = emptyMap(),
    val titleFlags: Set<String> = emptySet(),
    val quickNotes: String = ""
)

data class RenderedChoice(
    val index: Int,
    val text: String,
    val next: String?,
    val danger: Boolean = false,
    val useless: Boolean = false,
    val observe: String? = null,
    val personality: Map<String, Int> = emptyMap(),
    val isVisited: Boolean = false,
    val isCausalKey: Boolean = false
)

data class NarrativeParagraph(
    val id: String,
    val html: String
)

data class EndingPresentation(
    val type: String,
    val categoryLabel: String,
    val isGood: Boolean,
    val isBad: Boolean,
    val title: String,
    val desc: String,
    val reward: String,
    val elapsedFormatted: String,
    val scenesVisitedCount: Int,
    val alivePartyNames: List<String>,
    val personality: PersonalityStats,
    val fateSummary: String
)

data class PseudoEndingPresentation(
    val title: String,
    val desc: String,
    val metaText: String,
    val returnSceneId: String,
    val phase: Int = 0 // 0=normal, 1=glitch, 2=meta reveal
)

data class PuzzleModalState(
    val title: String,
    val text: String,
    val answer: String,
    val hint: String? = null,
    val hintRemaining: Int = 1,
    val hintVisible: Boolean = false,
    val errorText: String? = null,
    val onResult: (Boolean) -> Unit
)

data class AdminQaState(
    val remainingQuestions: Int,
    val qaLog: List<Pair<String, String>> = emptyList()
)

data class CombatModalState(
    val enemyKey: String,
    val enemyName: String,
    val enemyDesc: String,
    val enemyHp: Int,
    val enemyMaxHp: Int,
    val enemyAtk: Int,
    val weaknessType: String,
    val weaknessItem: String,
    val weaknessLabel: String,
    val frozenTurns: Int = 0,
    val inTurnMode: Boolean = false,
    val showItemDrawer: Boolean = false,
    val hasAllSeeingEye: Boolean = false,
    val lastDamageBadge: Int? = null,
    val logs: List<String> = emptyList(),
    val onWin: (() -> Unit)? = null,
    val onEscape: (() -> Unit)? = null
)

sealed interface V59PuzzleType {
    data object WordMatch : V59PuzzleType
    data object Sliding3x3 : V59PuzzleType
    data object RhythmBeat : V59PuzzleType
    data object MirrorBeam : V59PuzzleType
}

data class V59PuzzleModalState(
    val type: V59PuzzleType,
    val leftSelected: Int = -1,
    val matchedPairs: Set<Int> = emptySet(),
    val slideTiles: List<Int> = listOf(1, 2, 3, 4, 5, 6, 7, 0, 8),
    val rhythmHits: Int = 0,
    val mirrorAngles: List<String> = listOf("/", "\\", "/"),
    val onSolved: (() -> Unit)? = null
)

data class MiniGameModalState(
    val mgId: String,
    val fromStory: Boolean,
    val statusText: String = "",
    val message: String = "",
    val isError: Boolean = false,
    val d1Row: Int = 0,
    val d1Col: Int = 0,
    val d1Visited: Set<String> = setOf("0,0"),
    val d1Steps: Int = 0,
    val d2Board: List<List<Boolean>> = emptyList(),
    val d2Moves: Int = 0,
    val d3CursorPos: Float = 10f,
    val d3Dir: Int = 1,
    val d3ZoneMin: Float = 36f,
    val d3ZoneMax: Float = 64f,
    val d3Hits: Int = 0,
    val d4Deck: List<MemoryCardItem> = emptyList(),
    val d4OpenIndices: List<Int> = emptyList(),
    val d4MatchedPairs: Int = 0,
    val d4Moves: Int = 0,
    val d5Grid: List<List<PipeCellState>> = emptyList(),
    val d5Moves: Int = 0,
    val d6Freq: Int = 1,
    val d6Amp: Int = 2,
    val d6Phase: Int = 3
)

data class MemoryCardItem(
    val code: String,
    val symbol: String,
    val label: String,
    val flipped: Boolean = false,
    val matched: Boolean = false
)

data class PipeCellState(
    val baseDirs: List<Int>,
    val solRot: Int,
    val rot: Int,
    val filled: Boolean = false
)

sealed interface UiOverlay {
    data object None : UiOverlay
    data class PreviewDungeon(val dungeon: DungeonMeta) : UiOverlay
    data object Inventory : UiOverlay
    data object Memoir : UiOverlay
    data object Map : UiOverlay
    data class DialogDrawer(val selectedNpcId: String? = null, val currentNodeId: String = "root") : UiOverlay
    data object Achievements : UiOverlay
    data object History : UiOverlay
    data object BranchTree : UiOverlay
    data class SaveLoad(val isSaveMode: Boolean) : UiOverlay
    data object PauseMenu : UiOverlay
    data object Settings : UiOverlay
    data object Gallery : UiOverlay
    data class Notebook(val initialTab: String = "overview") : UiOverlay
    data class Sanctum(val initialTab: String = "starmap") : UiOverlay
    data object Shop : UiOverlay
    data object DailyChallenge : UiOverlay
    data object TrialContracts : UiOverlay
    data object ChronoRewind : UiOverlay
    data object DeductionRadar : UiOverlay
    data object Alchemy : UiOverlay
    data object EnvGaze : UiOverlay
    data object GateRiddle : UiOverlay
    data object GateAnomaly : UiOverlay
    data object OutsiderDialog : UiOverlay
    data object NgPlusInfo : UiOverlay
    data object NewGamePlusConfirm : UiOverlay
    data class MysteryLock(val dungeon: DungeonMeta) : UiOverlay
    data object GmConsole : UiOverlay
    data class ItemDetail(val item: InventoryItem) : UiOverlay
    data class PartyHealTarget(val item: InventoryItem) : UiOverlay
    data class Puzzle(val state: PuzzleModalState) : UiOverlay
    data class AdminQa(val state: AdminQaState) : UiOverlay
    data class Combat(val state: CombatModalState) : UiOverlay
    data class V59Puzzle(val state: V59PuzzleModalState) : UiOverlay
    data class MiniGame(val state: MiniGameModalState) : UiOverlay
    data object CloudSync : UiOverlay
    data class SimpleAlert(val title: String, val message: String, val onConfirm: (() -> Unit)? = null) : UiOverlay
}
