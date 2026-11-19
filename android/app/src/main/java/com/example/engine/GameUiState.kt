package com.example.engine

import com.example.behaviors.MetaSystemsBehavior
import com.example.cloud.CloudSyncUiState
import com.example.model.AchDef
import com.example.model.ChapterDef
import com.example.model.ChronoAnchorData
import com.example.model.DungeonMeta
import com.example.model.EndingPresentation
import com.example.model.GameSettings
import com.example.model.GlobalProgress
import com.example.model.LastSessionData
import com.example.model.NarrativeParagraph
import com.example.model.NpcBundle
import com.example.model.PseudoEndingPresentation
import com.example.model.RenderedChoice
import com.example.model.RuntimeDungeonState
import com.example.model.SaveSlotData
import com.example.model.SceneDef
import com.example.model.SystemsMeta
import com.example.model.UiOverlay
import kotlinx.serialization.Serializable

enum class HubCorridorTier { MAIN, SIDE }

@Serializable
data class ChronoSnapshot(
    val sceneId: String,
    val roomName: String,
    val timestamp: Long,
    val state: RuntimeDungeonState
)

data class ChapterCardBanner(
    val chapter: ChapterDef,
    val visible: Boolean = true
)

data class GameUiState(
    val screen: com.example.model.AppScreen = com.example.model.AppScreen.TITLE,
    val overlay: UiOverlay = UiOverlay.None,
    val hubTier: HubCorridorTier = HubCorridorTier.MAIN,
    val hubSelectedDungeonId: Int = 1,
    val selectedDungeonMeta: DungeonMeta? = null,
    val dungeons: List<DungeonMeta> = emptyList(),
    val systems: SystemsMeta = SystemsMeta(),
    val npcBundle: NpcBundle = NpcBundle(),
    val progress: GlobalProgress = GlobalProgress(),
    val settings: GameSettings = GameSettings(),
    val lastSession: LastSessionData? = null,
    val gameState: RuntimeDungeonState = RuntimeDungeonState(),
    val currentSceneDef: SceneDef? = null,
    val roomDisplayNum: String = "—",
    val roomDisplayName: String = "—",
    val moodKey: String = "normal",
    val paragraphs: List<NarrativeParagraph> = emptyList(),
    val typingDone: Boolean = true,
    val typedCharLimit: Int = Int.MAX_VALUE,
    val choices: List<RenderedChoice> = emptyList(),
    val ending: EndingPresentation? = null,
    val pseudoEnding: PseudoEndingPresentation? = null,
    val toastMessage: String? = null,
    val sfxSubtitle: String? = null,
    val achievementBanner: AchDef? = null,
    val chapterCard: ChapterCardBanner? = null,
    val doorTransitionText: String? = null,
    val topBarCollapsed: Boolean = false,
    val combineMode: Boolean = false,
    val combineSelectedIds: List<String> = emptyList(),
    val chronoStack: List<ChronoSnapshot> = emptyList(),
    val chronoAnchors: List<ChronoAnchorData?> = listOf(null, null, null),
    val saveSlots: List<SaveSlotData?> = listOf(null, null, null),
    val autoSaveSlot: SaveSlotData? = null,
    val jigsawTiles: List<Int> = (0..8).toList(),
    val jigsawSelectedIdx: Int? = null,
    val dailySeedInfo: DailySeedInfo = SanctumAndRadarEngine.getTodaySeedInfo(),
    val isDailyChallengeRun: Boolean = false,
    val deductionRadarReport: DeductionRadarReport? = null,
    val transferCodePreview: String = "",
    val branchTreeExpandedAll: Boolean = false,
    val cloudSync: CloudSyncUiState = CloudSyncUiState()
) {
    val activeCorridorDoors: List<DungeonMeta>
        get() = if (hubTier == HubCorridorTier.MAIN) {
            dungeons.filter { it.id in 1..6 }
        } else {
            dungeons.filter { it.id >= 7 }
        }

    fun isDungeonUnlocked(doorId: Int): Boolean {
        if (doorId <= 1) return true
        val prevCleared = doorId - 1 in progress.clearedDungeons
        return when {
            doorId in 2..11 -> prevCleared || doorId in progress.clearedDungeons
            doorId == 12 || doorId == 13 -> {
                (11 in progress.clearedDungeons && progress.inheritance.ngPlus) ||
                    doorId in progress.clearedDungeons
            }
            doorId == 14 -> (12 in progress.clearedDungeons && 13 in progress.clearedDungeons) || 14 in progress.clearedDungeons
            else -> false
        }
    }

    val allAchievementsCount: Int
        get() = dungeons.sumOf { it.achDefs.size }

    val unlockedTitlesCount: Int
        get() = systems.titles.count { MetaSystemsBehavior.evaluateTitleUnlocked(it.id, progress, settings) }
}
