package com.example

import com.example.audio.SoundManager
import com.example.behaviors.BehaviorRegistry
import com.example.behaviors.MetaSystemsBehavior
import com.example.cloud.CloudSyncResolver
import com.example.cloud.FirestoreMapCodec
import com.example.cloud.FullSaveSnapshot
import com.example.cloud.SaveProgressSummary
import com.example.cloud.SyncDirection
import com.example.engine.MiniGameAndCombatEngine
import com.example.engine.SanctumAndRadarEngine
import com.example.model.CombatItemDef
import com.example.model.DungeonMeta
import com.example.model.GameSettings
import com.example.model.GameState
import com.example.model.GlobalProgress
import com.example.model.InventoryItem
import com.example.model.NpcBundle
import com.example.model.RuntimeDungeonState
import com.example.model.SceneDef
import com.example.model.SynergySealDef
import com.example.model.SystemsMeta
import com.example.model.V59PuzzleType
import com.example.ui.navigation.CorridorHubRoute
import com.example.ui.navigation.DoorBriefingRoute
import com.example.ui.navigation.DoorGameRoute
import com.example.ui.navigation.GameOverRoute
import com.example.ui.navigation.MainMenuRoute
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.encodeToJsonElement
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class GameEngineTest {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    private fun assetsDir(): File {
        val candidates = listOf(
            File("src/main/assets/game_data"),
            File("app/src/main/assets/game_data")
        )
        return candidates.first { it.exists() && it.isDirectory }
    }

    @Test
    fun all17GameDataAssetsDeserializeCleanly() {
        val dir = assetsDir()
        val dungeons = json.decodeFromString<List<DungeonMeta>>(File(dir, "meta_dungeons.json").readText())
        assertEquals(14, dungeons.size)

        val systems = json.decodeFromString<SystemsMeta>(File(dir, "meta_systems.json").readText())
        assertTrue(systems.titles.isNotEmpty())
        assertTrue(systems.v64Alchemy.isNotEmpty())
        assertTrue(systems.v70Tarot.isNotEmpty())
        assertTrue(systems.v70Gauntlet.size == 14)

        val npcBundle = json.decodeFromString<NpcBundle>(File(dir, "npcs_dialogues.json").readText())
        assertTrue(npcBundle.npcProfiles.isNotEmpty())

        var totalScenes = 0
        for (d in 1..14) {
            val scenes = json.decodeFromString<Map<String, SceneDef>>(File(dir, "scenes_d$d.json").readText())
            assertTrue("D$d must have scenes", scenes.isNotEmpty())
            totalScenes += scenes.size
        }
        assertTrue("Expected ~426 scenes across 14 doors, got $totalScenes", totalScenes >= 400)
    }

    @Test
    fun behaviorRegistryCoversAll14Doors() {
        for (d in 1..14) {
            assertNotNull("Handler missing for door $d", BehaviorRegistry.getHandler(d))
        }
    }

    @Test
    fun miniGamesAndV59PuzzlesLogicWorks() {
        // D1 prime path: (0,0)=2 -> (1,0)=3 -> (1,1)=5 -> (2,1)=7 -> (2,2)=11 -> (3,2)=13 -> (3,3)=17
        var d1 = MiniGameAndCombatEngine.createMiniGameState("mg_d1", true)
        val path = listOf(1 to 0, 1 to 1, 2 to 1, 2 to 2, 3 to 2, 3 to 3)
        var d1Won = false
        for ((r, c) in path) {
            val (next, won) = MiniGameAndCombatEngine.stepD1Move(d1, r, c)
            d1 = next
            d1Won = won
        }
        assertTrue("D1 Prime Path should solve at (3,3)", d1Won)

        // D1 stepping onto composite number fails cleanly
        val d1Fresh = MiniGameAndCombatEngine.createMiniGameState("mg_d1", false)
        val (errState, errWon) = MiniGameAndCombatEngine.stepD1Move(d1Fresh, 0, 1)
        assertFalse(errWon)
        assertTrue(errState.isError)

        // D6 wave match (freq=3, amp=4, phase=1)
        val d6 = MiniGameAndCombatEngine.createMiniGameState("mg_d6", true)
        val (_, d6Won) = MiniGameAndCombatEngine.updateD6Wave(d6, 3, 4, 1)
        assertTrue("D6 Wave should solve at (3,4,1)", d6Won)

        // V59 Sliding 3x3 single move to win
        val slide = MiniGameAndCombatEngine.createV59PuzzleState(V59PuzzleType.Sliding3x3) {}
        val (_, slideWon) = MiniGameAndCombatEngine.stepSlidingTile(slide, 8)
        assertTrue("Sliding 3x3 should solve when sliding tile 8 into blank spot", slideWon)
    }

    @Test
    fun combatWeaknessMultiplierAppliesCorrectly() {
        val torch = CombatItemDef("lighter", "防風打火機", "火攻", "fire", "火焰", 20, "test")
        val (weakDmg, isWeak) = MiniGameAndCombatEngine.calculateAttackDamage(torch, "fire", enchanted = false)
        assertTrue(isWeak)
        assertEquals(36, weakDmg)

        val (enchDmg, _) = MiniGameAndCombatEngine.calculateAttackDamage(torch, "fire", enchanted = true)
        assertEquals(50, enchDmg)
    }

    @Test
    fun sanctumAndMetaSystemsEvaluateCorrectly() {
        val dir = assetsDir()
        val systems = json.decodeFromString<SystemsMeta>(File(dir, "meta_systems.json").readText())
        val progress = GlobalProgress(clearedDungeons = setOf(1, 2, 3, 4, 5, 6), gauntletCleared = (1..14).toSet())
        assertTrue(MetaSystemsBehavior.evaluateTitleUnlocked("t_pioneer", progress, GameSettings()))
        assertTrue(MetaSystemsBehavior.evaluateTitleUnlocked("t_v70_gauntlet_king", progress, GameSettings()))

        val story250 = MetaSystemsBehavior.getBuffetStoryById(250, systems)
        assertEquals(250, story250.id)

        assertTrue(MetaSystemsBehavior.askLibraryAdmin("出口在哪").contains("地毯"))

        val fakeSeal = SynergySealDef("s1", "Twin Seal", listOf("r1", "r2"), "desc")
        val sysWithSeal = systems.copy(v70SynergySeals = listOf(fakeSeal))
        val active = SanctumAndRadarEngine.getActiveSynergySeals(listOf("r1", "r2"), sysWithSeal)
        assertEquals(1, active.size)

        val report = SanctumAndRadarEngine.analyzeDeductionRadar(
            dungeonId = 1,
            scenes = json.decodeFromString<Map<String, SceneDef>>(File(dir, "scenes_d1.json").readText()),
            state = RuntimeDungeonState(dungeonId = 1, visitedScenes = setOf("lobby")),
            progress = progress,
            systems = systems,
            totalEndingsInDoor = 17,
            gapHint = "hint"
        )
        assertTrue(report.totalScenes >= 40)
        assertTrue(report.branches.isNotEmpty())
    }

    @Test
    fun gameStateStoresDoorInventoryAndFlagsWithJsonRoundTrip() {
        val initial = GameState(
            currentDoor = 3,
            currentDoorName = "雨夜劇場",
            currentSceneId = "stage_back",
            roomTitle = "後台廊道",
            sceneMood = "danger",
            inventoryItems = listOf(
                InventoryItem("brass_key", "黃銅鑰匙", "刻著編號 13 的舊鑰匙", "可開啟後台鐵門")
            ),
            progressFlags = mapOf("met_director" to true, "lamp_broken" to false),
            clearedDoors = setOf(1, 2),
            hp = 82,
            stress = 24
        )

        assertEquals(3, initial.currentDoor)
        assertTrue(initial.hasItem("brass_key"))
        assertFalse(initial.hasItem("missing_item"))
        assertTrue(initial.hasFlag("met_director"))
        assertFalse(initial.hasFlag("lamp_broken"))
        assertTrue(initial.isDoorCleared(2))
        assertFalse(initial.isDoorCleared(3))

        val encoded = json.encodeToString(initial)
        val decoded = json.decodeFromString<GameState>(encoded)
        assertEquals(initial, decoded)
    }

    @Test
    fun soundManagerResolvesTracksAndBuildsValidWavHeader() {
        assertEquals("danger", SoundManager.normalizeMood("horror"))
        assertEquals("safe", SoundManager.normalizeMood("dawn"))
        assertEquals("mystery", SoundManager.normalizeMood("mirror"))
        assertEquals("normal", SoundManager.normalizeMood("unknown"))

        assertEquals("d5_danger", SoundManager.resolveAmbientTrackKey(5, "chase", null))
        assertEquals("custom_theme_safe", SoundManager.resolveAmbientTrackKey(2, "calm", "custom-theme"))

        val samples = ShortArray(160) { i -> (i * 100).toShort() }
        val wav = SoundManager.buildWavBytes(samples, 16000)
        assertEquals(44 + samples.size * 2, wav.size)
        assertEquals("RIFF", String(wav, 0, 4, Charsets.US_ASCII))
        assertEquals("WAVE", String(wav, 8, 4, Charsets.US_ASCII))
        assertEquals("fmt ", String(wav, 12, 4, Charsets.US_ASCII))
        assertEquals("data", String(wav, 36, 4, Charsets.US_ASCII))
    }

    @Test
    fun navigationRoutesSerializeAndDeserializeCleanly() {
        val doorRoute = DoorGameRoute(doorId = 7)
        val decodedDoor = json.decodeFromString<DoorGameRoute>(json.encodeToString(doorRoute))
        assertEquals(doorRoute, decodedDoor)

        val briefingRoute = DoorBriefingRoute(doorId = 4)
        val decodedBriefing = json.decodeFromString<DoorBriefingRoute>(json.encodeToString(briefingRoute))
        assertEquals(briefingRoute, decodedBriefing)

        val gameOverRoute = GameOverRoute(doorId = 6, isBadEnding = true)
        val decodedGameOver = json.decodeFromString<GameOverRoute>(json.encodeToString(gameOverRoute))
        assertEquals(gameOverRoute, decodedGameOver)

        assertEquals(MainMenuRoute, json.decodeFromString<MainMenuRoute>(json.encodeToString(MainMenuRoute)))
        assertEquals(CorridorHubRoute, json.decodeFromString<CorridorHubRoute>(json.encodeToString(CorridorHubRoute)))
    }

    @Test
    fun cloudSyncResolverPrefersLatestProgressAcrossDevices() {
        val emptyLocal = FullSaveSnapshot(
            deviceLabel = "New Device",
            updatedAtMs = 0L,
            summary = SaveProgressSummary(hasData = false, updatedAtMs = 0L)
        )
        val cloudOld = FullSaveSnapshot(
            deviceLabel = "Phone A",
            updatedAtMs = 1_000_000L,
            summary = SaveProgressSummary(hasData = true, updatedAtMs = 1_000_000L, clearedDoorsCount = 2)
        )
        val localNewer = FullSaveSnapshot(
            deviceLabel = "Phone B",
            updatedAtMs = 2_000_000L,
            summary = SaveProgressSummary(hasData = true, updatedAtMs = 2_000_000L, clearedDoorsCount = 4)
        )
        val cloudNewest = FullSaveSnapshot(
            deviceLabel = "Tablet C",
            updatedAtMs = 3_000_000L,
            summary = SaveProgressSummary(hasData = true, updatedAtMs = 3_000_000L, clearedDoorsCount = 5)
        )

        // Fresh device logging into Google loads existing cloud save
        assertEquals(SyncDirection.CLOUD_TO_LOCAL, CloudSyncResolver.resolveLatest(emptyLocal, cloudOld))
        // No cloud save yet -> upload local
        assertEquals(SyncDirection.LOCAL_TO_CLOUD, CloudSyncResolver.resolveLatest(localNewer, null))
        // Newer local wins over older cloud
        assertEquals(SyncDirection.LOCAL_TO_CLOUD, CloudSyncResolver.resolveLatest(localNewer, cloudOld))
        // Newer cloud wins over older local
        assertEquals(SyncDirection.CLOUD_TO_LOCAL, CloudSyncResolver.resolveLatest(localNewer, cloudNewest))
        // Identical timestamp and progress -> already in sync
        assertEquals(SyncDirection.ALREADY_IN_SYNC, CloudSyncResolver.resolveLatest(cloudOld, cloudOld))
    }

    @Test
    fun firestoreMapCodecRoundTripsNativeMapsLosslessly() {
        val original = GlobalProgress(
            endingsLog = listOf("1|true|逃離質數旅館", "2|normal|紙船漂流"),
            unlockedAchievements = listOf("ach_d1_escape"),
            clearedDungeons = setOf(1, 2, 3),
            memoryShards = 240,
            metNpcs = setOf("chen", "suwan"),
            quickNotes = "第 3 扇門密碼 137"
        )
        val nativeMap = FirestoreMapCodec.toFirestoreMap(
            FirestoreMapCodec.json.encodeToJsonElement(original)
        )
        assertEquals(240L, nativeMap["memoryShards"])
        assertTrue(nativeMap["clearedDungeons"] is List<*>)

        val restored = FirestoreMapCodec.json.decodeFromJsonElement<GlobalProgress>(
            FirestoreMapCodec.fromFirestoreValue(nativeMap)
        )
        assertEquals(original, restored)
    }
}
