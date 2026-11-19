package com.example.data

import android.content.Context
import android.os.Build
import android.util.Base64
import com.example.cloud.FullSaveSnapshot
import com.example.cloud.SaveProgressSummary
import com.example.model.ChronoAnchorData
import com.example.model.DungeonMeta
import com.example.model.GameSettings
import com.example.model.GlobalProgress
import com.example.model.LastSessionData
import com.example.model.SaveSlotData
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.security.MessageDigest

class PersistenceRepository(context: Context) {

    private val prefs = context.getSharedPreferences("infinite_gates_prefs", Context.MODE_PRIVATE)
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    companion object {
        private const val KEY_SETTINGS = "wuxian_settings"
        private const val KEY_PROGRESS = "wuxian_progress"
        private const val KEY_LAST_SESSION = "wuxian_last_session"
        private const val KEY_ANCHORS = "wuxian_chrono_anchors"
        private const val KEY_SLOT_PREFIX = "wuxian_slot_"
        private const val KEY_AUTOSAVE_PREFIX = "wuxian_autosave_"
        private const val KEY_CHAPTER_CARDS = "wuxian_chapter_cards"
        private const val KEY_LOCAL_UPDATED_AT = "wuxian_local_updated_at_ms"
    }

    fun getDeviceLabel(): String {
        val manufacturer = Build.MANUFACTURER.orEmpty().trim()
        val model = Build.MODEL.orEmpty().trim()
        val combined = when {
            model.isBlank() -> "Android 裝置"
            manufacturer.isBlank() || model.startsWith(manufacturer, ignoreCase = true) -> model
            else -> "$manufacturer $model"
        }
        return combined.take(100)
    }

    fun getLocalUpdatedAtMs(): Long = prefs.getLong(KEY_LOCAL_UPDATED_AT, 0L)

    fun setLocalUpdatedAtMs(timestampMs: Long) {
        prefs.edit().putLong(KEY_LOCAL_UPDATED_AT, timestampMs.coerceAtLeast(0L)).apply()
    }

    private fun touchLocalUpdatedAt() {
        prefs.edit().putLong(KEY_LOCAL_UPDATED_AT, System.currentTimeMillis()).apply()
    }

    fun loadSettings(): GameSettings {
        val raw = prefs.getString(KEY_SETTINGS, null) ?: return GameSettings()
        return runCatching { json.decodeFromString<GameSettings>(raw) }.getOrDefault(GameSettings())
    }

    fun saveSettings(settings: GameSettings) {
        prefs.edit()
            .putString(KEY_SETTINGS, json.encodeToString(settings))
            .putLong(KEY_LOCAL_UPDATED_AT, System.currentTimeMillis())
            .apply()
    }

    fun loadProgress(): GlobalProgress {
        val raw = prefs.getString(KEY_PROGRESS, null) ?: return GlobalProgress()
        return runCatching { json.decodeFromString<GlobalProgress>(raw) }.getOrDefault(GlobalProgress())
    }

    fun saveProgress(progress: GlobalProgress) {
        prefs.edit()
            .putString(KEY_PROGRESS, json.encodeToString(progress))
            .putLong(KEY_LOCAL_UPDATED_AT, System.currentTimeMillis())
            .apply()
    }

    fun loadLastSession(): LastSessionData? {
        val raw = prefs.getString(KEY_LAST_SESSION, null) ?: return null
        return runCatching { json.decodeFromString<LastSessionData>(raw) }.getOrNull()
    }

    fun saveLastSession(session: LastSessionData?) {
        val editor = prefs.edit()
        if (session == null) {
            editor.remove(KEY_LAST_SESSION)
        } else {
            editor.putString(KEY_LAST_SESSION, json.encodeToString(session))
        }
        editor.putLong(KEY_LOCAL_UPDATED_AT, System.currentTimeMillis()).apply()
    }

    fun loadSaveSlot(dungeonId: Int, slotIndex: Int): SaveSlotData? {
        val raw = prefs.getString("$KEY_SLOT_PREFIX${dungeonId}_$slotIndex", null) ?: return null
        return runCatching { json.decodeFromString<SaveSlotData>(raw) }.getOrNull()
    }

    fun saveToSlot(slot: SaveSlotData) {
        prefs.edit()
            .putString("$KEY_SLOT_PREFIX${slot.dungeonId}_${slot.slotIndex}", json.encodeToString(slot))
            .putLong(KEY_LOCAL_UPDATED_AT, System.currentTimeMillis())
            .apply()
    }

    fun deleteSlot(dungeonId: Int, slotIndex: Int) {
        prefs.edit()
            .remove("$KEY_SLOT_PREFIX${dungeonId}_$slotIndex")
            .putLong(KEY_LOCAL_UPDATED_AT, System.currentTimeMillis())
            .apply()
    }

    fun loadAutoSave(dungeonId: Int): SaveSlotData? {
        val raw = prefs.getString("$KEY_AUTOSAVE_PREFIX$dungeonId", null) ?: return null
        return runCatching { json.decodeFromString<SaveSlotData>(raw) }.getOrNull()
    }

    fun saveAutoSave(slot: SaveSlotData) {
        prefs.edit()
            .putString("$KEY_AUTOSAVE_PREFIX${slot.dungeonId}", json.encodeToString(slot))
            .putLong(KEY_LOCAL_UPDATED_AT, System.currentTimeMillis())
            .apply()
    }

    fun loadAllSaveSlots(): List<SaveSlotData> {
        val result = mutableListOf<SaveSlotData>()
        for (doorId in 1..14) {
            loadAutoSave(doorId)?.let { result.add(it.copy(slotIndex = 0)) }
            for (slotIdx in 1..3) {
                loadSaveSlot(doorId, slotIdx)?.let { result.add(it.copy(slotIndex = slotIdx)) }
            }
        }
        return result
    }

    fun loadChronoAnchors(): List<ChronoAnchorData?> {
        val raw = prefs.getString(KEY_ANCHORS, null) ?: return listOf(null, null, null)
        return runCatching { json.decodeFromString<List<ChronoAnchorData?>>(raw) }
            .getOrDefault(listOf(null, null, null))
            .let { list ->
                List(3) { idx -> list.getOrNull(idx) }
            }
    }

    fun saveChronoAnchors(anchors: List<ChronoAnchorData?>) {
        val normalized = List(3) { idx -> anchors.getOrNull(idx) }
        prefs.edit()
            .putString(KEY_ANCHORS, json.encodeToString(normalized))
            .putLong(KEY_LOCAL_UPDATED_AT, System.currentTimeMillis())
            .apply()
    }

    fun buildLocalSnapshot(dungeons: List<DungeonMeta>): FullSaveSnapshot {
        val progress = loadProgress()
        val settings = loadSettings()
        val lastSession = loadLastSession()
        val anchors = loadChronoAnchors()
        val slots = loadAllSaveSlots()
        val hasData = progress.clearedDungeons.isNotEmpty() ||
            progress.endingsLog.isNotEmpty() ||
            progress.unlockedAchievements.isNotEmpty() ||
            progress.memoryShards > 0 ||
            progress.readScenesByDungeon.isNotEmpty() ||
            lastSession != null ||
            slots.isNotEmpty() ||
            anchors.any { it != null }

        val updatedAtMs = getLocalUpdatedAtMs().let { stored ->
            if (stored > 0L) stored
            else if (lastSession != null) lastSession.timestamp
            else if (hasData) System.currentTimeMillis()
            else 0L
        }
        val activeDoorId = (lastSession?.dungeonId ?: 1).coerceIn(1, 14)
        val doorName = dungeons.firstOrNull { it.id == activeDoorId }?.name ?: "第 $activeDoorId 扇門"
        val deviceLabel = getDeviceLabel()

        val summary = SaveProgressSummary(
            sourceLabel = "本機進度",
            deviceLabel = deviceLabel,
            updatedAtMs = updatedAtMs,
            clearedDoorsCount = progress.clearedDungeons.size,
            endingsCount = progress.endingsLog.size,
            achievementsCount = progress.unlockedAchievements.size,
            memoryShards = progress.memoryShards,
            currentDoorId = activeDoorId,
            currentDoorName = doorName,
            currentSceneId = lastSession?.sceneId.orEmpty(),
            currentRoomName = lastSession?.roomName.orEmpty(),
            currentHp = lastSession?.state?.hp ?: 100,
            saveSlotCount = slots.size,
            hasData = hasData
        )
        return FullSaveSnapshot(
            deviceLabel = deviceLabel,
            updatedAtMs = updatedAtMs,
            progress = progress,
            settings = settings,
            lastSession = lastSession,
            chronoAnchors = anchors,
            saveSlots = slots,
            summary = summary
        )
    }

    fun applyFullSnapshot(snapshot: FullSaveSnapshot) {
        val editor = prefs.edit()
        // Clear old save slot keys before restoring synced slots
        for (doorId in 1..14) {
            editor.remove("$KEY_AUTOSAVE_PREFIX$doorId")
            for (slotIdx in 1..3) {
                editor.remove("$KEY_SLOT_PREFIX${doorId}_$slotIdx")
            }
        }
        editor.putString(KEY_PROGRESS, json.encodeToString(snapshot.progress))
        editor.putString(KEY_SETTINGS, json.encodeToString(snapshot.settings))
        if (snapshot.lastSession == null) {
            editor.remove(KEY_LAST_SESSION)
        } else {
            editor.putString(KEY_LAST_SESSION, json.encodeToString(snapshot.lastSession))
        }
        val normalizedAnchors = List(3) { idx -> snapshot.chronoAnchors.getOrNull(idx) }
        editor.putString(KEY_ANCHORS, json.encodeToString(normalizedAnchors))
        snapshot.saveSlots.forEach { slot ->
            if (slot.slotIndex == 0) {
                editor.putString("$KEY_AUTOSAVE_PREFIX${slot.dungeonId}", json.encodeToString(slot))
            } else if (slot.slotIndex in 1..3) {
                editor.putString("$KEY_SLOT_PREFIX${slot.dungeonId}_${slot.slotIndex}", json.encodeToString(slot))
            }
        }
        editor.putLong(KEY_LOCAL_UPDATED_AT, snapshot.updatedAtMs.coerceAtLeast(1L))
        editor.apply()
    }

    fun hasShownChapterCard(dungeonId: Int, sceneId: String): Boolean {
        val shown = prefs.getStringSet(KEY_CHAPTER_CARDS, emptySet()) ?: emptySet()
        return shown.contains("$dungeonId:$sceneId")
    }

    fun markChapterCardShown(dungeonId: Int, sceneId: String) {
        val current = (prefs.getStringSet(KEY_CHAPTER_CARDS, emptySet()) ?: emptySet()).toMutableSet()
        current.add("$dungeonId:$sceneId")
        prefs.edit().putStringSet(KEY_CHAPTER_CARDS, current).apply()
    }

    @Serializable
    private data class ExportBundle(
        val game: String = "INFINITE_GATES",
        val version: String = "7.0.0",
        val saveVersion: String = "3.0",
        val checksum: String,
        val payload: String
    )

    @Serializable
    private data class SavePayload(
        val progress: GlobalProgress,
        val settings: GameSettings,
        val lastSession: LastSessionData? = null
    )

    fun exportTransferCode(): String {
        val payloadJson = json.encodeToString(
            SavePayload(
                progress = loadProgress(),
                settings = loadSettings(),
                lastSession = loadLastSession()
            )
        )
        val b64 = Base64.encodeToString(payloadJson.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
        val checksum = computeChecksum(b64)
        return json.encodeToString(ExportBundle(checksum = checksum, payload = b64))
    }

    fun importTransferCode(rawInput: String): Result<Unit> {
        return runCatching {
            val trimmed = rawInput.trim()
            val payloadStr = if (trimmed.startsWith("{")) {
                val bundle = json.decodeFromString<ExportBundle>(trimmed)
                val expected = computeChecksum(bundle.payload)
                require(expected == bundle.checksum) { "存檔校驗碼不符（檔案可能遭外部修改或損毀）" }
                String(Base64.decode(bundle.payload, Base64.DEFAULT), Charsets.UTF_8)
            } else {
                String(Base64.decode(trimmed, Base64.DEFAULT), Charsets.UTF_8)
            }
            val data = json.decodeFromString<SavePayload>(payloadStr)
            saveProgress(data.progress)
            saveSettings(data.settings)
            saveLastSession(data.lastSession)
        }
    }

    fun computeChecksum(text: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(text.toByteArray(Charsets.UTF_8))
        return digest.take(6).joinToString("") { "%02x".format(it) }
    }

    fun clearAll() {
        prefs.edit().clear().apply()
    }
}
