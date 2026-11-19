package com.example.model

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.descriptors.element
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

@Serializable
data class SceneDef(
    val id: String = "",
    val room: String = "",
    val roomName: String = "",
    val sceneId: String = "",
    val mapZone: String = "",
    val mood: String = "",
    @SerialName("npc") val rawNpc: JsonElement? = null,
    @SerialName("npcs") val extraNpcs: List<String> = emptyList(),
    val text: List<String> = emptyList(),
    val textReturn: List<String>? = null,
    val choices: List<ChoiceDef> = emptyList(),
    val hasOnEnter: Boolean = false,
    val hasGetText: Boolean = false,
    val ending: String? = null,
    val endingType: String? = null,
    val endingTitle: String? = null
) {
    val npcs: List<String>
        get() = when (rawNpc) {
            is JsonPrimitive -> listOfNotNull(rawNpc.contentOrNull) + extraNpcs
            is JsonArray -> rawNpc.mapNotNull { (it as? JsonPrimitive)?.contentOrNull } + extraNpcs
            else -> extraNpcs
        }

    val npc: String?
        get() = npcs.firstOrNull()
}

@Serializable
data class ChoiceDef(
    val text: String = "",
    val next: String? = null,
    val danger: Boolean = false,
    val useless: Boolean = false,
    val flavor: String? = null,
    val observe: String? = null,
    val personality: Map<String, Int> = emptyMap(),
    val hint: String? = null,
    val hideIfVisited: Boolean = false,
    val hasCondition: Boolean = false,
    val hasAction: Boolean = false
)

@Serializable
data class DungeonMeta(
    val id: Int,
    val name: String,
    val index: String,
    val bgNum: String,
    val tagline: String = "",
    val clearedKey: String = "",
    val savePrefix: String = "",
    val roomNum: String = "",
    val subText: String = "",
    val ruleText: String = "",
    val startScene: String = "",
    val hasParty: Boolean = false,
    val hasCountdown: Boolean = false,
    val hasAdmin: Boolean = false,
    val endingsTotal: Int = 0,
    val achDefs: List<AchDef> = emptyList(),
    val initState: InitDungeonState = InitDungeonState()
)

@Serializable
data class AchDef(
    val id: String,
    val name: String,
    val desc: String,
    val icon: String = "",
    val hidden: Boolean = false,
    val secret: Boolean = false
)

@Serializable
data class InitDungeonState(
    val currentScene: String = "",
    val inventory: List<InventoryItem> = emptyList(),
    val flags: Map<String, kotlinx.serialization.json.JsonElement> = emptyMap(),
    val hp: Int = 100,
    val maxHp: Int = 100,
    val party: Int = 4,
    val countdown: Int? = null,
    val adminQuestions: Int? = null,
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
    val personality: PersonalityStats = PersonalityStats(),
    val mapZones: List<MapZone> = emptyList(),
    val partyMembers: List<PartyMember> = emptyList()
)

@Serializable
data class InventoryItem(
    val id: String,
    val name: String,
    val desc: String = "",
    val usage: String = ""
)

object NoteEntrySerializer : KSerializer<NoteEntry> {
    override val descriptor: SerialDescriptor = buildClassSerialDescriptor("NoteEntry") {
        element<String>("id")
        element<String>("title")
        element<String>("content")
        element<String>("text")
        element<String>("scene")
    }

    override fun deserialize(decoder: Decoder): NoteEntry {
        val jsonDecoder = decoder as? JsonDecoder
            ?: return NoteEntry(id = "note", title = "備忘錄", content = decoder.decodeString())
        return when (val el = jsonDecoder.decodeJsonElement()) {
            is JsonPrimitive -> {
                val body = el.content
                NoteEntry(
                    id = "note_${body.hashCode().toUInt()}",
                    title = "初始備忘錄",
                    content = body
                )
            }
            is JsonObject -> NoteEntry(
                id = el["id"]?.jsonPrimitive?.contentOrNull ?: "",
                title = el["title"]?.jsonPrimitive?.contentOrNull ?: "備忘錄",
                content = el["content"]?.jsonPrimitive?.contentOrNull ?: "",
                text = el["text"]?.jsonPrimitive?.contentOrNull ?: "",
                scene = el["scene"]?.jsonPrimitive?.contentOrNull ?: ""
            )
            else -> NoteEntry(id = "note", title = "備忘錄", content = el.toString())
        }
    }

    override fun serialize(encoder: Encoder, value: NoteEntry) {
        val composite = encoder.beginStructure(descriptor)
        composite.encodeStringElement(descriptor, 0, value.id)
        composite.encodeStringElement(descriptor, 1, value.title)
        composite.encodeStringElement(descriptor, 2, value.content)
        composite.encodeStringElement(descriptor, 3, value.text)
        composite.encodeStringElement(descriptor, 4, value.scene)
        composite.endStructure(descriptor)
    }
}

@Serializable(with = NoteEntrySerializer::class)
data class NoteEntry(
    val id: String = "",
    val title: String = "",
    val content: String = "",
    val text: String = "",
    val scene: String = ""
) {
    val displayBody: String get() = content.ifEmpty { text }
}

@Serializable
data class PersonalityStats(
    val calm: Int = 50,
    val altruism: Int = 50,
    val cautious: Int = 50
)

@Serializable
data class MapZone(
    val id: String,
    val name: String,
    val explored: Boolean = false,
    val current: Boolean = false,
    val scene: String = "",
    val summary: String = ""
)

@Serializable
data class PartyMember(
    val id: String,
    val name: String,
    val hp: Int = 100,
    val maxHp: Int = 100,
    val alive: Boolean = true
)

@Serializable
data class NpcProfile(
    val name: String,
    val desc: String = ""
)

@Serializable
data class DialogueTree(
    val start: String = "root",
    val startReturning: String = "root",
    val nodes: Map<String, DialogueNode> = emptyMap()
)

@Serializable
data class DialogueNode(
    val reply: String = "",
    val onVisitFlag: String? = null,
    val options: List<DialogueOption> = emptyList()
)

@Serializable
data class DialogueOption(
    val text: String = "",
    val next: String = "",
    val conditionCode: String? = null
)

@Serializable
data class SimpleDialogueChoice(
    val text: String = "",
    val reply: String = ""
)

@Serializable
data class SimpleDialogueEntry(
    val id: String = "",
    val name: String = "",
    val role: String = "",
    val lines: List<String> = emptyList(),
    val choices: List<SimpleDialogueChoice> = emptyList()
)

@Serializable
data class NpcBundle(
    @SerialName("NPC_PROFILES") val npcProfiles: Map<String, NpcProfile> = emptyMap(),
    @SerialName("DIALOGUE_TREES") val dialogueTrees: Map<String, DialogueTree> = emptyMap(),
    @SerialName("NPC_DIALOGUES") val npcDialogues: Map<String, SimpleDialogueEntry> = emptyMap()
)

@Serializable
data class MoodConfigDef(
    val bg: String = "#0a0a0c",
    val particleCount: Int = 20,
    val particleSpeed: Double = 0.8,
    val glow: Boolean = false,
    val falling: Boolean = false
)

@Serializable
data class CombineRecipeDef(
    val ingredients: List<String> = emptyList(),
    val name: String,
    val desc: String,
    val usage: String = ""
)

@Serializable
data class ChapterDef(
    val scene: String,
    val num: String,
    val title: String,
    val quote: String,
    val symbol: String
)

@Serializable
data class ChangelogEntry(
    val version: String,
    val type: String = "minor",
    val changes: List<String> = emptyList()
)

@Serializable
data class ShopItemDef(
    val id: String,
    val name: String,
    val cost: Int,
    val desc: String
)

@Serializable
data class TitleDef(
    val id: String,
    val name: String,
    val desc: String,
    val icon: String = "",
    val rare: Boolean = false,
    val req: String = ""
)

@Serializable
data class V4FragmentDef(
    val d: Int,
    val name: String,
    val hint: String
)

@Serializable
data class V5RelicDef(
    val d: Int,
    val name: String,
    val desc: String,
    val found: Boolean = false
)

@Serializable
data class DailyRuleDef(
    val day: Int,
    val dayName: String,
    val name: String,
    val desc: String,
    val titleId: String,
    val titleName: String,
    val lsKey: String
)

@Serializable
data class CombatItemDef(
    val id: String,
    val name: String,
    val effectName: String,
    val targetType: String,
    val targetLabel: String,
    val baseDmg: Int,
    val desc: String
)

@Serializable
data class EnemyDef(
    val name: String,
    val hp: Int,
    val maxHp: Int,
    val atk: Int,
    val weaknessType: String,
    val weaknessItem: String,
    val weaknessLabel: String,
    val desc: String
)

@Serializable
data class TrialContractDef(
    val id: String,
    val name: String,
    val heat: Int = 1,
    val desc: String
)

@Serializable
data class CorridorRelicDef(
    val id: String,
    val name: String,
    val origin: String,
    val desc: String
)

@Serializable
data class AlchemyRecipeDef(
    val id: String,
    val name: String,
    val reqEnv: Int,
    val reqRiddle: Int,
    val shardCost: Int,
    val rewardText: String,
    val heal: Int = 0,
    val stress: Int = 0,
    val maxHp: Int = 0,
    val cd: Int = 0,
    val echo: Int = 0,
    val partyHeal: Boolean = false,
    val giveToken: String? = null,
    val shards: Int = 0,
    val shield: Int = 0
)

@Serializable
data class AnomalyUiDef(
    val title: String,
    val desc: String,
    val choices: List<String> = emptyList()
)

@Serializable
data class EnvGazeDef(
    val id: String,
    val title: String,
    val text: String
)

@Serializable
data class GateRiddleDef(
    val q: String,
    val opts: List<String> = emptyList(),
    val ans: Int = 0,
    val hint: String = ""
)

@Serializable
data class TarotCardDef(
    val id: String,
    val arcana: String,
    val bonusName: String,
    val desc: String,
    val hpBonus: Int = 0,
    val maxHpBonus: Int = 0,
    val cdBonus: Int = 0,
    val unvisitedHeal: Int = 0,
    val stressResist: Int = 0,
    val shardBonus: Int = 0
)

@Serializable
data class SynergySealDef(
    val id: String,
    val name: String,
    val req: List<String> = emptyList(),
    val desc: String
)

@Serializable
data class GauntletBossDef(
    val gate: Int,
    val name: String,
    val weakness: String,
    val rewardShards: Int,
    val title: String
)

@Serializable
data class SecretLogDef(
    val gate: Int,
    val title: String,
    val text: String
)

@Serializable
data class ConstellationNodeDef(
    val id: String,
    val name: String,
    val x: Float,
    val y: Float,
    val role: String,
    val desc: String
)

@Serializable
data class GmItemDef(
    val id: String,
    val name: String,
    val desc: String
)

@Serializable
data class GmNpcDef(
    val name: String,
    val desc: String
)

@Serializable
data class AudioThemeDef(
    val name: String,
    val sub: String = "",
    val chords: List<List<Double>> = emptyList(),
    val o1: String = "sine",
    val o2: String = "triangle",
    val lp: Int = 520,
    val lfo: Double = 0.05,
    val interval: Long = 6000L,
    val pluck: List<Double> = emptyList(),
    val pulse: Boolean = false
)

@Serializable
data class BuffetStoryDef(
    val id: Int,
    val title: String,
    val story: String
)

@Serializable
data class D13MirrorEndingDef(
    val id: String,
    val name: String,
    val desc: String
)

@Serializable
data class D13MirrorDef(
    val mirrorNum: Int,
    val title: String,
    val reflectionDesc: String,
    val trustEnding: D13MirrorEndingDef,
    val shatterEnding: D13MirrorEndingDef
)

@Serializable
data class SystemsMeta(
    @SerialName("BGM_CHORDS") val bgmChords: Map<String, List<List<Double>>> = emptyMap(),
    @SerialName("MOOD_CONFIG") val moodConfig: Map<String, MoodConfigDef> = emptyMap(),
    @SerialName("COMBINATION_RECIPES") val combinationRecipes: Map<String, CombineRecipeDef> = emptyMap(),
    @SerialName("INHERIT_LABELS") val inheritLabels: Map<String, String> = emptyMap(),
    @SerialName("CHAPTER_DEFS") val chapterDefs: Map<String, List<ChapterDef>> = emptyMap(),
    @SerialName("CHANGELOG") val changelog: List<ChangelogEntry> = emptyList(),
    @SerialName("SHOP_ITEMS") val shopItems: List<ShopItemDef> = emptyList(),
    @SerialName("TITLES") val titles: List<TitleDef> = emptyList(),
    @SerialName("V4_FRAGMENTS") val v4Fragments: Map<String, V4FragmentDef> = emptyMap(),
    @SerialName("V5_RELICS") val v5Relics: Map<String, V5RelicDef> = emptyMap(),
    @SerialName("V61_DAILY_RULES") val v61DailyRules: Map<String, DailyRuleDef> = emptyMap(),
    @SerialName("V61_COMBAT_ITEMS") val v61CombatItems: List<CombatItemDef> = emptyList(),
    @SerialName("V61_ENEMIES") val v61Enemies: Map<String, EnemyDef> = emptyMap(),
    @SerialName("V64_CONTRACTS") val v64Contracts: List<TrialContractDef> = emptyList(),
    @SerialName("V64_RELICS") val v64Relics: List<CorridorRelicDef> = emptyList(),
    @SerialName("V64_ALCHEMY") val v64Alchemy: List<AlchemyRecipeDef> = emptyList(),
    @SerialName("V64_ANOMALIES_UI") val v64Anomalies: Map<String, AnomalyUiDef> = emptyMap(),
    @SerialName("V64_ENV_GAZE") val v64EnvGaze: Map<String, List<EnvGazeDef>> = emptyMap(),
    @SerialName("V64_RIDDLES") val v64Riddles: Map<String, GateRiddleDef> = emptyMap(),
    @SerialName("V70_TAROT") val v70Tarot: List<TarotCardDef> = emptyList(),
    @SerialName("V70_SYNERGY_SEALS") val v70SynergySeals: List<SynergySealDef> = emptyList(),
    @SerialName("V70_GAUNTLET") val v70Gauntlet: List<GauntletBossDef> = emptyList(),
    @SerialName("V70_SECRET_LOGS") val v70SecretLogs: List<SecretLogDef> = emptyList(),
    @SerialName("CONSTELLATION_NODES") val constellationNodes: List<ConstellationNodeDef> = emptyList(),
    @SerialName("GM_ITEMS") val gmItems: List<GmItemDef> = emptyList(),
    @SerialName("GM_NPCS") val gmNpcs: List<GmNpcDef> = emptyList(),
    @SerialName("GM_MECH") val gmMech: List<String> = emptyList(),
    @SerialName("GM_COMMON_FLAGS") val gmCommonFlags: List<String> = emptyList(),
    @SerialName("AUDIO_THEMES") val audioThemes: Map<String, AudioThemeDef> = emptyMap(),
    @SerialName("BUFFET_STORIES") val buffetStories: List<BuffetStoryDef> = emptyList(),
    @SerialName("D13_MIRRORS_META") val d13MirrorsMeta: List<D13MirrorDef> = emptyList()
)
