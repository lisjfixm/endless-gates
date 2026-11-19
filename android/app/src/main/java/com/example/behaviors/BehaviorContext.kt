package com.example.behaviors

import com.example.model.BuffetStoryDef
import com.example.model.InheritanceData
import com.example.model.RuntimeDungeonState
import com.example.model.V59PuzzleType

interface BehaviorContext {
    val dungeonId: Int
    val state: RuntimeDungeonState
    val isNgPlus: Boolean
    val inheritance: InheritanceData

    fun hasItem(id: String): Boolean
    fun addItem(id: String, name: String, desc: String = "", usage: String = "")
    fun removeItem(id: String)

    fun hasFlag(key: String): Boolean
    fun setFlag(key: String, value: Boolean = true)
    fun getCounter(key: String, default: Int = 0): Int
    fun setCounter(key: String, value: Int)
    fun incCounter(key: String, delta: Int = 1): Int
    fun getStr(key: String, default: String = ""): String
    fun setStr(key: String, value: String)

    fun damage(amount: Int)
    fun heal(amount: Int)
    fun setHp(hp: Int)
    fun addMaxHp(delta: Int)
    fun addTime(minutes: Int)
    fun loseTime(minutes: Int)
    fun addStress(delta: Int)
    fun addSatiety(delta: Int)
    fun syncMirrorDamage(delta: Int)
    fun modHumanity(delta: Int)
    fun modCritic(delta: Int)
    fun addEcho(delta: Int)
    fun setTide(tide: String)
    fun addChildhoodFrag(id: String)
    fun addNpcAffinity(npcId: String, delta: Int)
    fun killPartyMember(id: String)
    fun setSilence(quiet: Boolean)

    fun addNote(id: String, title: String, content: String)
    fun appendNarrative(html: String)
    fun setRoom(room: String, roomName: String)
    fun showToast(msg: String)

    fun goToScene(sceneId: String, delayMs: Long = 0L)
    fun openPuzzle(title: String, text: String, answer: String, hint: String? = null, onResult: (Boolean) -> Unit)
    fun openAdmin()
    fun openDialogPanel(npcId: String? = null)
    fun openMiniGame(mgId: String, fromStory: Boolean = true)
    fun openV59Puzzle(type: V59PuzzleType, onSolved: () -> Unit)
    fun openCombat(enemyKey: String? = null, onWin: (() -> Unit)? = null, onEscape: (() -> Unit)? = null)
    fun openOutsiderDialog(dungeonId: Int)

    fun unlockAchievement(id: String)
    fun findFragment(id: String)
    fun allFragmentsFound(): Boolean
    fun grantRelicV5(id: String)
    fun isRelicUsed(id: String): Boolean
    fun setRelicUsed(id: String)
    fun hasSideRelic(id: String): Boolean
    fun saveSideChainFlag(key: String, value: Boolean = true)

    fun saveInheritance(transform: (InheritanceData) -> InheritanceData)
    fun markDungeonCleared(did: Int)
    fun isCleared(did: Int): Boolean
    fun getEndingLog(): List<String>

    fun triggerEnding(type: String, title: String, desc: String, reward: String = "", delayMs: Long = 0L)
    fun triggerPseudoEnding(title: String, desc: String, metaText: String, returnSceneId: String)

    fun recordBuffetStoryTasted(id: Int)
    fun getBuffetStory(id: Int): BuffetStoryDef?
    fun recordMovieWatched(id: String)
    fun markD12FloorVisited(floor: Int)
    fun getVisitedD12Floors(): Set<Int>
    fun recordD13Ending(id: String, name: String, isTrust: Boolean, isShatter: Boolean)
    fun getD13UnlockedEndings(): Set<String>
    fun buildDualNarrativeHtml(mainText: String, mirrorText: String): String
    fun triggerOutsiderAchievementCheck()
    fun useSedativeBadEnd()
    fun randomNurseEncounter()
    fun guardAsked()
    fun checkCat()
    fun checkUnchosen()
    fun checkVoices()
    fun checkWatcher()
}

interface DoorBehaviorHandler {
    fun onEnter(ctx: BehaviorContext, sceneId: String) {}
    fun getText(ctx: BehaviorContext, sceneId: String): List<String>? = null
    fun isChoiceVisible(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean = true
    fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean = false
}

object BehaviorRegistry {
    private val handlers: Map<Int, DoorBehaviorHandler> by lazy {
        mapOf(
            1 to Door1BehaviorHandler,
            2 to Door2BehaviorHandler,
            3 to Door3BehaviorHandler,
            4 to Door4BehaviorHandler,
            5 to Door5BehaviorHandler,
            6 to Door6BehaviorHandler,
            7 to Door7BehaviorHandler,
            8 to Door8BehaviorHandler,
            9 to Door9BehaviorHandler,
            10 to Door10BehaviorHandler,
            11 to Door11BehaviorHandler,
            12 to Door12BehaviorHandler,
            13 to Door13BehaviorHandler,
            14 to Door14BehaviorHandler
        )
    }

    fun getHandler(dungeonId: Int): DoorBehaviorHandler? = handlers[dungeonId]
}
