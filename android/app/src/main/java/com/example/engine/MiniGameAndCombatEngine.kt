package com.example.engine

import com.example.model.CombatItemDef
import com.example.model.CombatModalState
import com.example.model.EnemyDef
import com.example.model.MemoryCardItem
import com.example.model.MiniGameModalState
import com.example.model.PipeCellState
import com.example.model.SystemsMeta
import com.example.model.V59PuzzleModalState
import com.example.model.V59PuzzleType
import kotlin.math.abs
import kotlin.math.roundToInt
import kotlin.random.Random

object MiniGameAndCombatEngine {

    val PRIME_GRID_VALS = listOf(
        listOf(2, 4, 6, 8),
        listOf(3, 5, 9, 10),
        listOf(12, 7, 11, 14),
        listOf(15, 16, 13, 17)
    )

    private val PRIME_SET = setOf(2, 3, 5, 7, 11, 13, 17)

    private val PIPES_BASE = listOf(
        listOf(
            PipeCellState(listOf(1, 3), 0, 1),
            PipeCellState(listOf(1, 3), 0, 2),
            PipeCellState(listOf(2, 3), 0, 3)
        ),
        listOf(
            PipeCellState(listOf(1, 2), 0, 2),
            PipeCellState(listOf(0, 2, 3), 0, 1),
            PipeCellState(listOf(0, 2), 0, 1)
        ),
        listOf(
            PipeCellState(listOf(0, 1), 0, 3),
            PipeCellState(listOf(1, 3), 0, 2),
            PipeCellState(listOf(0, 1), 0, 3)
        )
    )

    fun createMiniGameState(mgId: String, fromStory: Boolean): MiniGameModalState {
        return when (mgId) {
            "mg_d1" -> MiniGameModalState(
                mgId = mgId,
                fromStory = fromStory,
                statusText = "起點：2 ｜ 目標：質數 17",
                message = "僅可踩踏質數格，不可斜走",
                d1Row = 0,
                d1Col = 0,
                d1Visited = setOf("0,0"),
                d1Steps = 0
            )
            "mg_d2" -> {
                var b = List(3) { List(3) { false } }
                val seedMoves = listOf(0 to 0, 1 to 1, 2 to 2, 0 to 2)
                for ((r, c) in seedMoves) b = toggleLightsOut(b, r, c)
                MiniGameModalState(
                    mgId = mgId,
                    fromStory = fromStory,
                    statusText = "點擊燈格可翻轉自身及相鄰燈",
                    message = "將 9 盞燈全部關閉即可過關",
                    d2Board = b,
                    d2Moves = 0
                )
            }
            "mg_d3" -> MiniGameModalState(
                mgId = mgId,
                fromStory = fromStory,
                statusText = "成功校準：0 / 3 次",
                message = "游標滑入金色安全區間時點擊對齊脈搏"
            )
            "mg_d4" -> {
                val pairs = listOf(
                    Triple("k", "★", "黃金鑰匙"),
                    Triple("p", "❖", "質數 13"),
                    Triple("c", "◉", "鐘錶 03:17"),
                    Triple("f", "✦", "火柴光輝"),
                    Triple("r", "≈", "潮汐波紋"),
                    Triple("s", "❖", "星象碎片")
                )
                val deck = (pairs + pairs).shuffled().map { (code, sym, label) ->
                    MemoryCardItem(code = code, symbol = sym, label = label)
                }
                MiniGameModalState(
                    mgId = mgId,
                    fromStory = fromStory,
                    statusText = "配對進度：0 / 6 ｜ 翻牌 0 次",
                    message = "翻開並找出全部 6 對記憶圖符",
                    d4Deck = deck
                )
            }
            "mg_d5" -> {
                val filled = computePipeFlow(PIPES_BASE)
                MiniGameModalState(
                    mgId = mgId,
                    fromStory = fromStory,
                    statusText = "步數：0 ｜ 進水口(左上) ➔ 出水口(右下)",
                    message = "點擊管道旋轉，讓水流貫通至右下角",
                    d5Grid = filled
                )
            }
            else -> MiniGameModalState(
                mgId = "mg_d6",
                fromStory = fromStory,
                statusText = "頻率 1 · 振幅 2 · 相位 3",
                message = "調整三項參數與「心率共振波」完全疊合"
            )
        }
    }

    fun stepD1Move(state: MiniGameModalState, targetRow: Int, targetCol: Int): Pair<MiniGameModalState, Boolean> {
        val dr = abs(targetRow - state.d1Row)
        val dc = abs(targetCol - state.d1Col)
        if (dr + dc != 1) {
            return state.copy(message = "僅可向上下左右相鄰一格移動", isError = true) to false
        }
        val num = PRIME_GRID_VALS[targetRow][targetCol]
        if (num !in PRIME_SET) {
            return state.copy(message = "合數「$num」沒有地板支撐！請選質數格。", isError = true) to false
        }
        val newVisited = state.d1Visited + "$targetRow,$targetCol"
        val steps = state.d1Steps + 1
        val won = targetRow == 3 && targetCol == 3
        val nextState = state.copy(
            d1Row = targetRow,
            d1Col = targetCol,
            d1Visited = newVisited,
            d1Steps = steps,
            statusText = "當前格：$num ｜ 步數：$steps",
            message = if (won) "抵達終點質數 17！" else "穩步踏上質數「$num」",
            isError = false
        )
        return nextState to won
    }

    private fun toggleLightsOut(board: List<List<Boolean>>, r: Int, c: Int): List<List<Boolean>> {
        val mutable = board.map { it.toMutableList() }
        val dirs = listOf(0 to 0, -1 to 0, 1 to 0, 0 to -1, 0 to 1)
        for ((dr, dc) in dirs) {
            val nr = r + dr
            val nc = c + dc
            if (nr in 0..2 && nc in 0..2) {
                mutable[nr][nc] = !mutable[nr][nc]
            }
        }
        return mutable
    }

    fun stepD2Toggle(state: MiniGameModalState, r: Int, c: Int): Pair<MiniGameModalState, Boolean> {
        val updated = toggleLightsOut(state.d2Board, r, c)
        val moves = state.d2Moves + 1
        val allOff = updated.all { row -> row.all { !it } }
        return state.copy(
            d2Board = updated,
            d2Moves = moves,
            statusText = "已翻轉 $moves 步",
            message = if (allOff) "閱覽室歸於靜謐！" else "點擊繼續熄滅所有燈格",
            isError = false
        ) to allOff
    }

    fun tickD3Cursor(state: MiniGameModalState): MiniGameModalState {
        if (state.mgId != "mg_d3") return state
        var nextPos = state.d3CursorPos + state.d3Dir * 3.2f
        var nextDir = state.d3Dir
        if (nextPos >= 95f) {
            nextPos = 95f
            nextDir = -1
        } else if (nextPos <= 5f) {
            nextPos = 5f
            nextDir = 1
        }
        return state.copy(d3CursorPos = nextPos, d3Dir = nextDir)
    }

    fun hitD3Pulse(state: MiniGameModalState): Pair<MiniGameModalState, Boolean> {
        val inZone = state.d3CursorPos in state.d3ZoneMin..state.d3ZoneMax
        return if (inZone) {
            val hits = state.d3Hits + 1
            val won = hits >= 3
            state.copy(
                d3Hits = hits,
                statusText = "成功校準：$hits / 3 次",
                message = if (won) "心跳頻率已同步！" else "精準共振！請繼續下一次校準",
                isError = false
            ) to won
        } else {
            state.copy(
                message = "失手了，再抓準金色區間時機！",
                isError = true
            ) to false
        }
    }

    fun flipD4Card(state: MiniGameModalState, index: Int): Triple<MiniGameModalState, Boolean, Boolean> {
        val deck = state.d4Deck
        if (index !in deck.indices) return Triple(state, false, false)
        val target = deck[index]
        if (target.flipped || target.matched || state.d4OpenIndices.size >= 2) {
            return Triple(state, false, false)
        }
        val openedDeck = deck.mapIndexed { i, item -> if (i == index) item.copy(flipped = true) else item }
        val openIndices = state.d4OpenIndices + index
        if (openIndices.size < 2) {
            return Triple(
                state.copy(
                    d4Deck = openedDeck,
                    d4OpenIndices = openIndices,
                    message = "請翻開第二張記憶牌",
                    isError = false
                ),
                false,
                false
            )
        }
        val a = openedDeck[openIndices[0]]
        val b = openedDeck[openIndices[1]]
        val moves = state.d4Moves + 1
        return if (a.code == b.code) {
            val matchedDeck = openedDeck.mapIndexed { i, item ->
                if (i == openIndices[0] || i == openIndices[1]) item.copy(matched = true) else item
            }
            val pairs = state.d4MatchedPairs + 1
            val won = pairs >= 6
            Triple(
                state.copy(
                    d4Deck = matchedDeck,
                    d4OpenIndices = emptyList(),
                    d4MatchedPairs = pairs,
                    d4Moves = moves,
                    statusText = "配對進度：$pairs / 6 ｜ 翻牌 $moves 次",
                    message = if (won) "所有觀星圖符拼合完成！" else "配對成功！",
                    isError = false
                ),
                won,
                false
            )
        } else {
            Triple(
                state.copy(
                    d4Deck = openedDeck,
                    d4OpenIndices = openIndices,
                    d4Moves = moves,
                    statusText = "配對進度：${state.d4MatchedPairs} / 6 ｜ 翻牌 $moves 次",
                    message = "圖符不符，即將蓋回…",
                    isError = true
                ),
                false,
                true // need delayed close
            )
        }
    }

    fun closeD4Mismatched(state: MiniGameModalState): MiniGameModalState {
        val resetDeck = state.d4Deck.map { if (!it.matched) it.copy(flipped = false) else it }
        return state.copy(d4Deck = resetDeck, d4OpenIndices = emptyList(), isError = false, message = "請繼續配對記憶圖符")
    }

    fun rotateD5Pipe(state: MiniGameModalState, r: Int, c: Int): Pair<MiniGameModalState, Boolean> {
        val raw = state.d5Grid.mapIndexed { rr, row ->
            row.mapIndexed { cc, cell ->
                if (rr == r && cc == c) cell.copy(rot = (cell.rot + 1) % 4) else cell
            }
        }
        val updated = computePipeFlow(raw)
        val moves = state.d5Moves + 1
        val won = updated[2][2].filled
        return state.copy(
            d5Grid = updated,
            d5Moves = moves,
            statusText = "步數：$moves ｜ ${if (won) "水流已貫通！" else "進水口 ➔ 出水口"}",
            message = if (won) "潮汐排水管道全線貫通！" else "調整管道方向引導藍色水流",
            isError = false
        ) to won
    }

    fun getPipeDirs(cell: PipeCellState): List<Int> = cell.baseDirs.map { (it + cell.rot) % 4 }

    private fun computePipeFlow(grid: List<List<PipeCellState>>): List<List<PipeCellState>> {
        val visited = Array(3) { BooleanArray(3) }
        val dirsStart = getPipeDirs(grid[0][0])
        if (3 in dirsStart || 0 in dirsStart || 1 in dirsStart) {
            val queue = ArrayDeque<Pair<Int, Int>>()
            visited[0][0] = true
            queue.add(0 to 0)
            val dVec = listOf(-1 to 0, 0 to 1, 1 to 0, 0 to -1)
            val opp = listOf(2, 3, 0, 1)
            while (queue.isNotEmpty()) {
                val (r, c) = queue.removeFirst()
                val myDirs = getPipeDirs(grid[r][c])
                for (d in myDirs) {
                    val nr = r + dVec[d].first
                    val nc = c + dVec[d].second
                    if (nr in 0..2 && nc in 0..2 && !visited[nr][nc]) {
                        val nextDirs = getPipeDirs(grid[nr][nc])
                        if (opp[d] in nextDirs) {
                            visited[nr][nc] = true
                            queue.add(nr to nc)
                        }
                    }
                }
            }
        }
        return grid.mapIndexed { r, row ->
            row.mapIndexed { c, cell -> cell.copy(filled = visited[r][c]) }
        }
    }

    fun updateD6Wave(state: MiniGameModalState, freq: Int, amp: Int, phase: Int): Pair<MiniGameModalState, Boolean> {
        val won = freq == 3 && amp == 4 && phase == 1
        return state.copy(
            d6Freq = freq,
            d6Amp = amp,
            d6Phase = phase,
            statusText = "頻率 $freq · 振幅 $amp · 相位 $phase",
            message = if (won) "共振波形完全重疊！" else "目標波形：頻率 3 · 振幅 4 · 相位 1",
            isError = false
        ) to won
    }

    data class MiniGameReward(
        val itemId: String,
        val itemName: String,
        val itemDesc: String,
        val itemUsage: String,
        val achId: String,
        val narrativeHtml: String
    )

    fun getMiniGameReward(mgId: String): MiniGameReward = when (mgId) {
        "mg_d1" -> MiniGameReward(
            "prime_compass", "質數羅盤", "指向質數樓層核心的精密青銅羅盤。",
            "減免旅館探索迷失風險，可用於組合或危機閃避。", "ach_mg_d1",
            "<p class=\"action\">【質數羅盤入手】你踏過最後一格 17，從地板暗格拾起了「質數羅盤」。</p>"
        )
        "mg_d2" -> MiniGameReward(
            "bookmark_jade", "翠玉書籤", "能短暫安撫圖書館管理員的溫潤玉籤。",
            "降低與管理員對話衝突風險。", "ach_mg_d2",
            "<p class=\"action\">【翠玉書籤入手】所有白熾燈管熄滅後，架頂掉下一枚「翠玉書籤」。</p>"
        )
        "mg_d3" -> MiniGameReward(
            "pulse_stabilizer", "心律穩壓器", "校準至 72 BPM 的便攜醫療儀器。",
            "急診室心跳穩定與壓力控制關鍵物品。", "ach_mg_d3",
            "<p class=\"action\">【心律穩壓器入手】監護儀回歸平穩藍線，你取得了「心律穩壓器」。</p>"
        )
        "mg_d4" -> MiniGameReward(
            "astral_ember", "星象餘燼", "觀星台燈籠裡凝聚的暖光餘燼。",
            "能在第4層雪夜提供光亮與記憶提示。", "ach_mg_d4",
            "<p class=\"action\">【星象餘燼入手】六對記憶圖符化作微光落入掌心，獲得「星象餘燼」。</p>"
        )
        "mg_d5" -> MiniGameReward(
            "tide_pearl", "潮汐珍珠", "海灣退潮時才會浮現的夜光珍珠。",
            "抵禦潮水吞噬並助於喚醒沉船線索。", "ach_mg_d5",
            "<p class=\"action\">【潮汐珍珠入手】閘門排水暢通，貝殼悄然吐出一顆「潮汐珍珠」。</p>"
        )
        else -> MiniGameReward(
            "dawn_crystal", "破曉結晶", "凝固著天台第一道日出頻率的結晶。",
            "能穩定最終章的共鳴頻道。", "ach_mg_d6",
            "<p class=\"action\">【破曉結晶入手】當兩道正弦波重合時，桌上凝出一枚「破曉結晶」。</p>"
        )
    }

    // ===== V5.9 4 Puzzle Minigames =====
    val WORD_MATCH_PAIRS = listOf(
        "質數旅館" to "13號房",
        "深夜圖書館" to "03:17",
        "鏡像電車" to "雙軌並行",
        "世紀末校園" to "紙飛機"
    )

    fun createV59PuzzleState(type: V59PuzzleType, onSolved: () -> Unit): V59PuzzleModalState {
        return when (type) {
            V59PuzzleType.Sliding3x3 -> V59PuzzleModalState(
                type = type,
                slideTiles = listOf(1, 2, 3, 4, 5, 6, 7, 0, 8),
                onSolved = onSolved
            )
            V59PuzzleType.MirrorBeam -> V59PuzzleModalState(
                type = type,
                mirrorAngles = listOf("/", "\\", "\\"),
                onSolved = onSolved
            )
            else -> V59PuzzleModalState(type = type, onSolved = onSolved)
        }
    }

    fun stepWordMatchClick(state: V59PuzzleModalState, isLeft: Boolean, idx: Int): Pair<V59PuzzleModalState, Boolean> {
        if (isLeft) {
            return state.copy(leftSelected = idx) to false
        }
        val sel = state.leftSelected
        if (sel < 0) return state to false
        return if (sel == idx) {
            val nextMatched = state.matchedPairs + idx
            val won = nextMatched.size >= WORD_MATCH_PAIRS.size
            state.copy(leftSelected = -1, matchedPairs = nextMatched) to won
        } else {
            state.copy(leftSelected = -1) to false
        }
    }

    fun stepSlidingTile(state: V59PuzzleModalState, idx: Int): Pair<V59PuzzleModalState, Boolean> {
        val tiles = state.slideTiles
        val blankIdx = tiles.indexOf(0)
        if (blankIdx < 0) return state to false
        val r1 = idx / 3; val c1 = idx % 3
        val r2 = blankIdx / 3; val c2 = blankIdx % 3
        if (abs(r1 - r2) + abs(c1 - c2) != 1) return state to false
        val nextTiles = tiles.toMutableList()
        nextTiles[blankIdx] = tiles[idx]
        nextTiles[idx] = 0
        val won = nextTiles == listOf(1, 2, 3, 4, 5, 6, 7, 8, 0)
        return state.copy(slideTiles = nextTiles) to won
    }

    fun stepRhythmHit(state: V59PuzzleModalState): Pair<V59PuzzleModalState, Boolean> {
        val hits = state.rhythmHits + 1
        return state.copy(rhythmHits = hits) to (hits >= 4)
    }

    fun toggleMirrorAngle(state: V59PuzzleModalState, idx: Int): Pair<V59PuzzleModalState, Boolean> {
        val list = state.mirrorAngles.toMutableList()
        if (idx !in list.indices) return state to false
        list[idx] = if (list[idx] == "/") "\\" else "/"
        val won = list == listOf("/", "/", "\\") || list == listOf("\\", "/", "\\")
        return state.copy(mirrorAngles = list) to won
    }

    // ===== Tactical Combat System =====
    fun createCombatState(
        enemyKey: String,
        systems: SystemsMeta,
        isNgPlus: Boolean,
        dailyRuleDay: Int,
        hasAllSeeingEye: Boolean,
        onWin: (() -> Unit)?,
        onEscape: (() -> Unit)?
    ): CombatModalState {
        val def = systems.v61Enemies[enemyKey] ?: EnemyDef(
            name = "迷霧異靈",
            hp = 80,
            maxHp = 80,
            atk = 15,
            weaknessType = "fire",
            weaknessItem = "lighter",
            weaknessLabel = "🔥 火焰",
            desc = "從門縫裡滲出的執念聚合體。"
        )
        val scale = if (isNgPlus) 1.35 else 1.0
        var hp = (def.hp * scale).roundToInt()
        if (dailyRuleDay == 2) hp = 1
        val atk = (def.atk * scale).roundToInt()
        return CombatModalState(
            enemyKey = enemyKey,
            enemyName = def.name,
            enemyDesc = def.desc,
            enemyHp = hp,
            enemyMaxHp = hp,
            enemyAtk = atk,
            weaknessType = def.weaknessType,
            weaknessItem = def.weaknessItem,
            weaknessLabel = def.weaknessLabel,
            inTurnMode = true,
            hasAllSeeingEye = hasAllSeeingEye,
            logs = listOf("遭遇敵人「${def.name}」（HP $hp · 攻擊 $atk）！" + if (isNgPlus) " [二周目強化]" else ""),
            onWin = onWin,
            onEscape = onEscape
        )
    }

    fun calculateAttackDamage(
        itemDef: CombatItemDef,
        enemyWeaknessType: String,
        enchanted: Boolean
    ): Pair<Int, Boolean> {
        val isWeak = itemDef.targetType == enemyWeaknessType || itemDef.targetType == "all"
        var dmg = if (isWeak) (itemDef.baseDmg * 1.8).roundToInt() else itemDef.baseDmg
        if (enchanted) dmg = (dmg * 1.4).roundToInt()
        return dmg to isWeak
    }

    fun generateDailyRandomCombat(rng: Random = Random.Default): String {
        val keys = listOf("corridor_shade", "mirror_warden", "film_swordsman", "midnight_lion")
        return keys[rng.nextInt(keys.size)]
    }
}
