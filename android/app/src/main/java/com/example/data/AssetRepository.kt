package com.example.data

import android.content.Context
import com.example.model.DungeonMeta
import com.example.model.NpcBundle
import com.example.model.SceneDef
import com.example.model.SystemsMeta
import kotlinx.serialization.json.Json
import java.util.concurrent.ConcurrentHashMap

class AssetRepository(private val context: Context) {

    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    private var cachedDungeons: List<DungeonMeta>? = null
    private var cachedSystems: SystemsMeta? = null
    private var cachedNpcs: NpcBundle? = null
    private val sceneCache = ConcurrentHashMap<Int, Map<String, SceneDef>>()

    fun getDungeons(): List<DungeonMeta> {
        cachedDungeons?.let { return it }
        val text = readAsset("game_data/meta_dungeons.json")
        return json.decodeFromString<List<DungeonMeta>>(text).also { cachedDungeons = it }
    }

    fun getDungeon(id: Int): DungeonMeta? = getDungeons().firstOrNull { it.id == id }

    fun getSystems(): SystemsMeta {
        cachedSystems?.let { return it }
        val text = readAsset("game_data/meta_systems.json")
        return json.decodeFromString<SystemsMeta>(text).also { cachedSystems = it }
    }

    fun getNpcBundle(): NpcBundle {
        cachedNpcs?.let { return it }
        val text = readAsset("game_data/npcs_dialogues.json")
        return json.decodeFromString<NpcBundle>(text).also { cachedNpcs = it }
    }

    fun getScenes(dungeonId: Int): Map<String, SceneDef> {
        sceneCache[dungeonId]?.let { return it }
        val text = readAsset("game_data/scenes_d$dungeonId.json")
        return json.decodeFromString<Map<String, SceneDef>>(text).also { sceneCache[dungeonId] = it }
    }

    fun getAllAchievementDefs(): List<com.example.model.AchDef> {
        val seen = HashSet<String>()
        val result = ArrayList<com.example.model.AchDef>()
        getDungeons().forEach { d ->
            d.achDefs.forEach { a ->
                if (seen.add(a.id)) result.add(a)
            }
        }
        return result
    }

    private fun readAsset(path: String): String {
        return context.assets.open(path).bufferedReader(Charsets.UTF_8).use { it.readText() }
    }
}
