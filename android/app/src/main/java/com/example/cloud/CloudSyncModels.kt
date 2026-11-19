package com.example.cloud

import com.example.model.ChronoAnchorData
import com.example.model.GameSettings
import com.example.model.GlobalProgress
import com.example.model.LastSessionData
import com.example.model.SaveSlotData
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.longOrNull

data class CloudAccountInfo(
    val uid: String,
    val displayName: String,
    val email: String
)

data class SaveProgressSummary(
    val sourceLabel: String = "",
    val deviceLabel: String = "",
    val updatedAtMs: Long = 0L,
    val clearedDoorsCount: Int = 0,
    val endingsCount: Int = 0,
    val achievementsCount: Int = 0,
    val memoryShards: Int = 0,
    val currentDoorId: Int = 1,
    val currentDoorName: String = "",
    val currentSceneId: String = "",
    val currentRoomName: String = "",
    val currentHp: Int = 100,
    val saveSlotCount: Int = 0,
    val hasData: Boolean = false
)

data class FullSaveSnapshot(
    val deviceLabel: String = "",
    val updatedAtMs: Long = 0L,
    val progress: GlobalProgress = GlobalProgress(),
    val settings: GameSettings = GameSettings(),
    val lastSession: LastSessionData? = null,
    val chronoAnchors: List<ChronoAnchorData?> = listOf(null, null, null),
    val saveSlots: List<SaveSlotData> = emptyList(),
    val summary: SaveProgressSummary = SaveProgressSummary()
)

enum class SyncDirection {
    CLOUD_TO_LOCAL,
    LOCAL_TO_CLOUD,
    ALREADY_IN_SYNC
}

data class CloudSyncUiState(
    val account: CloudAccountInfo? = null,
    val isSyncing: Boolean = false,
    val isLoadingCloud: Boolean = false,
    val localSummary: SaveProgressSummary = SaveProgressSummary(),
    val cloudSummary: SaveProgressSummary? = null,
    val recommendedDirection: SyncDirection = SyncDirection.ALREADY_IN_SYNC,
    val lastSyncAtMs: Long? = null,
    val statusMessage: String? = null,
    val errorMessage: String? = null
)

/**
 * Pure conflict resolver implementing "latest progress wins" across devices.
 */
object CloudSyncResolver {
    fun resolveLatest(local: FullSaveSnapshot, cloud: FullSaveSnapshot?): SyncDirection {
        if (cloud == null) {
            return SyncDirection.LOCAL_TO_CLOUD
        }
        if (!local.summary.hasData && cloud.summary.hasData) {
            return SyncDirection.CLOUD_TO_LOCAL
        }
        if (local.summary.hasData && !cloud.summary.hasData) {
            return SyncDirection.LOCAL_TO_CLOUD
        }
        return when {
            cloud.updatedAtMs > local.updatedAtMs -> SyncDirection.CLOUD_TO_LOCAL
            local.updatedAtMs > cloud.updatedAtMs -> SyncDirection.LOCAL_TO_CLOUD
            else -> {
                val localScore = progressWeight(local.summary)
                val cloudScore = progressWeight(cloud.summary)
                when {
                    cloudScore > localScore -> SyncDirection.CLOUD_TO_LOCAL
                    localScore > cloudScore -> SyncDirection.LOCAL_TO_CLOUD
                    else -> SyncDirection.ALREADY_IN_SYNC
                }
            }
        }
    }

    private fun progressWeight(s: SaveProgressSummary): Long {
        return s.clearedDoorsCount * 100_000L +
            s.endingsCount * 1_000L +
            s.achievementsCount * 500L +
            s.memoryShards.toLong() +
            s.saveSlotCount * 10L
    }
}

/**
 * Lossless converter between kotlinx.serialization JsonElement trees and native Firestore Maps/Lists
 * (no JSON strings persisted in Firestore documents).
 */
object FirestoreMapCodec {
    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
        coerceInputValues = true
    }

    fun toFirestoreMap(element: JsonElement): Map<String, Any> {
        val obj = element as? JsonObject ?: return emptyMap()
        val result = LinkedHashMap<String, Any>()
        obj.forEach { (k, v) ->
            toFirestoreValue(v)?.let { converted ->
                result[k] = converted
            }
        }
        return result
    }

    fun toFirestoreValue(element: JsonElement): Any? {
        return when (element) {
            is JsonNull -> null
            is JsonPrimitive -> {
                if (element.isString) {
                    element.content
                } else {
                    element.booleanOrNull
                        ?: element.longOrNull
                        ?: element.doubleOrNull
                        ?: element.content
                }
            }
            is JsonObject -> toFirestoreMap(element)
            is JsonArray -> element.mapNotNull { toFirestoreValue(it) }
        }
    }

    fun fromFirestoreValue(value: Any?): JsonElement {
        return when (value) {
            null -> JsonNull
            is Boolean -> JsonPrimitive(value)
            is Byte -> JsonPrimitive(value.toLong())
            is Short -> JsonPrimitive(value.toLong())
            is Int -> JsonPrimitive(value.toLong())
            is Long -> JsonPrimitive(value)
            is Float -> JsonPrimitive(value.toDouble())
            is Double -> JsonPrimitive(value)
            is Number -> JsonPrimitive(value.toLong())
            is String -> JsonPrimitive(value)
            is Map<*, *> -> {
                val content = LinkedHashMap<String, JsonElement>()
                value.forEach { (k, v) ->
                    val keyStr = k?.toString() ?: return@forEach
                    content[keyStr] = fromFirestoreValue(v)
                }
                JsonObject(content)
            }
            is Iterable<*> -> JsonArray(value.map { fromFirestoreValue(it) })
            else -> JsonPrimitive(value.toString())
        }
    }
}
