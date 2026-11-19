package com.example.model

import kotlinx.serialization.Serializable

/**
 * Core immutable state snapshot for the text-adventure narrative, storing the active door,
 * current scene, inventory items, progress flags, and narrative status.
 */
@Serializable
data class GameState(
    val currentDoor: Int = 1,
    val currentDoorName: String = "",
    val currentSceneId: String = "prelude",
    val roomTitle: String = "—",
    val sceneMood: String = "normal",
    val inventoryItems: List<InventoryItem> = emptyList(),
    val progressFlags: Map<String, Boolean> = emptyMap(),
    val counters: Map<String, Int> = emptyMap(),
    val clearedDoors: Set<Int> = emptySet(),
    val hp: Int = 100,
    val maxHp: Int = 100,
    val stress: Int = 0,
    val narrativeLines: List<String> = emptyList(),
    val isGameOver: Boolean = false,
    val isBadEnding: Boolean = false,
    val endingTitle: String? = null
) {
    fun hasItem(itemId: String): Boolean = inventoryItems.any { it.id == itemId }

    fun hasFlag(flagKey: String): Boolean = progressFlags[flagKey] == true

    fun isDoorCleared(doorId: Int): Boolean = doorId in clearedDoors
}
