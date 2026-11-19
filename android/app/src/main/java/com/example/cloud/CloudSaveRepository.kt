package com.example.cloud

import android.content.Context
import com.example.R
import com.example.model.ChronoAnchorData
import com.example.model.GameSettings
import com.example.model.GlobalProgress
import com.example.model.LastSessionData
import com.example.model.SaveSlotData
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.encodeToJsonElement

/**
 * Firestore-backed repository storing per-user cloud saves at:
 *   /users/{userId}/cloud_saves/primary
 *
 * Always uses the provisioned named database from R.string.firestore_database_id.
 */
class CloudSaveRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = Firebase.auth
) {
    constructor(context: Context) : this(
        FirebaseFirestore.getInstance(
            context.applicationContext.getString(R.string.firestore_database_id)
        )
    )

    companion object {
        const val PRIMARY_SAVE_ID = "primary"
    }

    private fun requireUserId(): String {
        return auth.currentUser?.uid?.takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("使用者必須先以 Google 帳號登入後才能存取雲端存檔。")
    }

    private fun saveDocRef(userId: String) =
        db.collection("users")
            .document(userId)
            .collection("cloud_saves")
            .document(PRIMARY_SAVE_ID)

    fun observeCloudSave(userId: String): Flow<FullSaveSnapshot?> = flow {
        val uid = auth.currentUser?.uid
        if (uid.isNullOrBlank() || uid != userId) {
            emit(null)
            return@flow
        }
        val docRef = saveDocRef(userId)
        val path = docRef.path
        emitAll(
            docRef.snapshots()
                .map { snapshot ->
                    if (!snapshot.exists()) null else parseSnapshot(snapshot)
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val exceptionToLog = firestoreError ?: (error as? Exception)
                    if (exceptionToLog != null && auth.currentUser?.uid == userId) {
                        handleFirestoreError(exceptionToLog, OperationType.GET, path)
                    }
                    throw error
                }
        )
    }

    suspend fun fetchCloudSave(userId: String): Result<FullSaveSnapshot?> {
        val docRef = saveDocRef(userId)
        val path = docRef.path
        return try {
            val uid = requireUserId()
            check(uid == userId) { "登入帳號已變更，拒絕跨帳號讀取。" }
            val snapshot = docRef.get().await()
            if (!snapshot.exists()) {
                Result.success(null)
            } else {
                Result.success(parseSnapshot(snapshot))
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.GET, path)
            Result.failure(e)
        }
    }

    suspend fun uploadCloudSave(
        userId: String,
        displayName: String,
        snapshot: FullSaveSnapshot
    ): Result<FullSaveSnapshot> {
        val docRef = saveDocRef(userId)
        val path = docRef.path
        return try {
            val uid = requireUserId()
            check(uid == userId) { "登入帳號已變更，拒絕跨帳號寫入。" }

            val existingSnap = docRef.get().await()
            val exists = existingSnap.exists()

            val safeDeviceLabel = snapshot.deviceLabel.ifBlank { "Android 裝置" }.take(100)
            val safeDisplayName = displayName.take(100)
            val safeClientTs = snapshot.updatedAtMs.coerceAtLeast(1L)
            val safeClearedCount = snapshot.progress.clearedDungeons.size.coerceIn(0, 14).toLong()
            val safeEndingsCount = snapshot.progress.endingsLog.size.coerceIn(0, 500).toLong()
            val safeAchCount = snapshot.progress.unlockedAchievements.size.coerceIn(0, 500).toLong()
            val safeShards = snapshot.progress.memoryShards.coerceIn(0, 10_000_000).toLong()
            val safeDoorId = snapshot.summary.currentDoorId.coerceIn(1, 14).toLong()
            val safeDoorName = snapshot.summary.currentDoorName.take(80)
            val safeSceneId = snapshot.summary.currentSceneId.take(120)
            val safeRoomName = snapshot.summary.currentRoomName.take(120)
            val safeHp = snapshot.summary.currentHp.coerceIn(0, 9999).toLong()
            val boundedSlots = snapshot.saveSlots.take(64)
            val safeSlotCount = boundedSlots.size.coerceIn(0, 100).toLong()

            val progressMap = FirestoreMapCodec.toFirestoreMap(
                FirestoreMapCodec.json.encodeToJsonElement(snapshot.progress)
            )
            val settingsMap = FirestoreMapCodec.toFirestoreMap(
                FirestoreMapCodec.json.encodeToJsonElement(snapshot.settings)
            )
            val lastSessionMap = snapshot.lastSession?.let { ls ->
                FirestoreMapCodec.toFirestoreMap(
                    FirestoreMapCodec.json.encodeToJsonElement(ls)
                )
            }
            val anchorsList = snapshot.chronoAnchors
                .filterNotNull()
                .take(3)
                .map { anchor ->
                    FirestoreMapCodec.toFirestoreMap(
                        FirestoreMapCodec.json.encodeToJsonElement(anchor)
                    )
                }
            val slotsList = boundedSlots.map { slot ->
                FirestoreMapCodec.toFirestoreMap(
                    FirestoreMapCodec.json.encodeToJsonElement(slot)
                )
            }

            if (!exists) {
                val createPayload = LinkedHashMap<String, Any>().apply {
                    put("userId", uid)
                    put("deviceLabel", safeDeviceLabel)
                    put("displayName", safeDisplayName)
                    put("clientUpdatedAtMs", safeClientTs)
                    put("clearedDoorsCount", safeClearedCount)
                    put("endingsCount", safeEndingsCount)
                    put("achievementsCount", safeAchCount)
                    put("memoryShards", safeShards)
                    put("currentDoorId", safeDoorId)
                    put("currentDoorName", safeDoorName)
                    put("currentSceneId", safeSceneId)
                    put("currentRoomName", safeRoomName)
                    put("currentHp", safeHp)
                    put("saveSlotCount", safeSlotCount)
                    put("progressData", progressMap)
                    put("settingsData", settingsMap)
                    if (lastSessionMap != null) {
                        put("lastSessionData", lastSessionMap)
                    }
                    put("chronoAnchorsData", anchorsList)
                    put("saveSlotsData", slotsList)
                    put("createdAt", FieldValue.serverTimestamp())
                    put("updatedAt", FieldValue.serverTimestamp())
                }
                docRef.set(createPayload).await()
            } else {
                val updatePayload = LinkedHashMap<String, Any>().apply {
                    put("deviceLabel", safeDeviceLabel)
                    put("displayName", safeDisplayName)
                    put("clientUpdatedAtMs", safeClientTs)
                    put("clearedDoorsCount", safeClearedCount)
                    put("endingsCount", safeEndingsCount)
                    put("achievementsCount", safeAchCount)
                    put("memoryShards", safeShards)
                    put("currentDoorId", safeDoorId)
                    put("currentDoorName", safeDoorName)
                    put("currentSceneId", safeSceneId)
                    put("currentRoomName", safeRoomName)
                    put("currentHp", safeHp)
                    put("saveSlotCount", safeSlotCount)
                    put("progressData", progressMap)
                    put("settingsData", settingsMap)
                    if (lastSessionMap != null) {
                        put("lastSessionData", lastSessionMap)
                    } else {
                        put("lastSessionData", FieldValue.delete())
                    }
                    put("chronoAnchorsData", anchorsList)
                    put("saveSlotsData", slotsList)
                    put("updatedAt", FieldValue.serverTimestamp())
                }
                docRef.update(updatePayload).await()
            }

            val updatedSummary = snapshot.summary.copy(
                sourceLabel = "Google 帳號雲端進度",
                deviceLabel = safeDeviceLabel,
                updatedAtMs = safeClientTs,
                hasData = true
            )
            Result.success(
                snapshot.copy(
                    deviceLabel = safeDeviceLabel,
                    updatedAtMs = safeClientTs,
                    summary = updatedSummary
                )
            )
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    private fun parseSnapshot(doc: DocumentSnapshot): FullSaveSnapshot {
        val data = doc.data.orEmpty()
        val serverUpdatedMs = doc.getTimestamp(
            "updatedAt",
            DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
        )?.toDate()?.time ?: 0L
        val clientUpdatedMs = (data["clientUpdatedAtMs"] as? Number)?.toLong() ?: serverUpdatedMs
        val deviceLabel = data["deviceLabel"] as? String ?: "其他裝置"

        val progress = runCatching {
            val raw = data["progressData"]
            if (raw is Map<*, *>) {
                FirestoreMapCodec.json.decodeFromJsonElement<GlobalProgress>(
                    FirestoreMapCodec.fromFirestoreValue(raw)
                )
            } else {
                GlobalProgress()
            }
        }.getOrDefault(GlobalProgress())

        val settings = runCatching {
            val raw = data["settingsData"]
            if (raw is Map<*, *>) {
                FirestoreMapCodec.json.decodeFromJsonElement<GameSettings>(
                    FirestoreMapCodec.fromFirestoreValue(raw)
                )
            } else {
                GameSettings()
            }
        }.getOrDefault(GameSettings())

        val lastSession = runCatching {
            val raw = data["lastSessionData"]
            if (raw is Map<*, *>) {
                FirestoreMapCodec.json.decodeFromJsonElement<LastSessionData>(
                    FirestoreMapCodec.fromFirestoreValue(raw)
                )
            } else {
                null
            }
        }.getOrNull()

        val rawAnchors = (data["chronoAnchorsData"] as? List<*>).orEmpty().mapNotNull { entry ->
            if (entry is Map<*, *>) {
                runCatching {
                    FirestoreMapCodec.json.decodeFromJsonElement<ChronoAnchorData>(
                        FirestoreMapCodec.fromFirestoreValue(entry)
                    )
                }.getOrNull()
            } else {
                null
            }
        }
        val normalizedAnchors = List(3) { idx -> rawAnchors.firstOrNull { it.slot == idx } ?: rawAnchors.getOrNull(idx) }

        val saveSlots = (data["saveSlotsData"] as? List<*>).orEmpty().mapNotNull { entry ->
            if (entry is Map<*, *>) {
                runCatching {
                    FirestoreMapCodec.json.decodeFromJsonElement<SaveSlotData>(
                        FirestoreMapCodec.fromFirestoreValue(entry)
                    )
                }.getOrNull()
            } else {
                null
            }
        }

        val summary = SaveProgressSummary(
            sourceLabel = "Google 帳號雲端進度",
            deviceLabel = deviceLabel,
            updatedAtMs = clientUpdatedMs,
            clearedDoorsCount = (data["clearedDoorsCount"] as? Number)?.toInt() ?: progress.clearedDungeons.size,
            endingsCount = (data["endingsCount"] as? Number)?.toInt() ?: progress.endingsLog.size,
            achievementsCount = (data["achievementsCount"] as? Number)?.toInt() ?: progress.unlockedAchievements.size,
            memoryShards = (data["memoryShards"] as? Number)?.toInt() ?: progress.memoryShards,
            currentDoorId = (data["currentDoorId"] as? Number)?.toInt() ?: (lastSession?.dungeonId ?: 1),
            currentDoorName = data["currentDoorName"] as? String ?: "",
            currentSceneId = data["currentSceneId"] as? String ?: (lastSession?.sceneId ?: ""),
            currentRoomName = data["currentRoomName"] as? String ?: (lastSession?.roomName ?: ""),
            currentHp = (data["currentHp"] as? Number)?.toInt() ?: (lastSession?.state?.hp ?: 100),
            saveSlotCount = (data["saveSlotCount"] as? Number)?.toInt() ?: saveSlots.size,
            hasData = true
        )

        return FullSaveSnapshot(
            deviceLabel = deviceLabel,
            updatedAtMs = clientUpdatedMs,
            progress = progress,
            settings = settings,
            lastSession = lastSession,
            chronoAnchors = normalizedAnchors,
            saveSlots = saveSlots,
            summary = summary
        )
    }
}
