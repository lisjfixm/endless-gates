package com.example.ui.modals

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.engine.GameUiState
import com.example.engine.GameViewModel
import com.example.engine.MiniGameAndCombatEngine
import com.example.model.AdminQaState
import com.example.model.CombatModalState
import com.example.model.DungeonMeta
import com.example.model.MiniGameModalState
import com.example.model.PuzzleModalState
import com.example.model.UiOverlay
import com.example.model.V59PuzzleModalState
import com.example.model.V59PuzzleType
import com.example.ui.theme.LocalGatePalette
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.PI
import kotlin.math.sin

@Composable
fun PuzzleModal(state: PuzzleModalState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    var answerInput by remember { mutableStateOf("") }

    GateModalContainer(
        title = state.title,
        onClose = { vm.closeOverlay() }
    ) {
        Text(state.text, style = MaterialTheme.typography.bodyLarge, color = palette.textPrimary)
        if (state.hint != null) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("可用提示：${state.hintRemaining}", style = MaterialTheme.typography.labelSmall, color = palette.textSecondary)
                OutlinedButton(
                    onClick = { vm.togglePuzzleHint() },
                    enabled = !state.hintVisible && state.hintRemaining > 0,
                    modifier = Modifier.heightIn(min = 48.dp)
                ) {
                    Text("顯示提示")
                }
            }
            if (state.hintVisible) {
                Text(state.hint, style = MaterialTheme.typography.bodyMedium, color = palette.accent)
            }
        }
        OutlinedTextField(
            value = answerInput,
            onValueChange = { answerInput = it },
            label = { Text("輸入答案") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().testTag("puzzle_answer_input")
        )
        if (!state.errorText.isNullOrBlank()) {
            Text(state.errorText, color = palette.danger, style = MaterialTheme.typography.labelSmall)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            OutlinedButton(onClick = { vm.closeOverlay() }, modifier = Modifier.weight(1f).heightIn(min = 48.dp)) {
                Text("取消")
            }
            Button(
                onClick = { vm.submitPuzzleAnswer(answerInput) },
                modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("puzzle_submit_btn")
            ) {
                Text("確認提交")
            }
        }
    }
}

@Composable
fun AdminQaModal(state: AdminQaState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    var qInput by remember { mutableStateOf("") }
    GateModalContainer(
        title = "圖 書 館 管 理 員",
        subtitle = "剩餘追問次數：${state.remainingQuestions}",
        onClose = { vm.closeOverlay() }
    ) {
        state.qaLog.forEach { (q, a) ->
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(palette.bgCard)
                    .padding(10.dp)
            ) {
                Text(q, style = MaterialTheme.typography.labelLarge, color = palette.accent)
                if (a.isNotBlank()) {
                    Spacer(Modifier.height(4.dp))
                    Text(a, style = MaterialTheme.typography.bodyMedium, color = palette.textPrimary)
                }
            }
        }
        OutlinedTextField(
            value = qInput,
            onValueChange = { qInput = it },
            label = { Text("輸入提問關鍵詞（如：規則、密碼、出口、蘇晚…）") },
            singleLine = true,
            enabled = state.remainingQuestions > 0,
            modifier = Modifier.fillMaxWidth()
        )
        Button(
            onClick = {
                vm.submitAdminQuestion(qInput)
                qInput = ""
            },
            enabled = state.remainingQuestions > 0 && qInput.isNotBlank(),
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
        ) {
            Text("提出問題")
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CombatModal(c: CombatModalState, uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    GateModalContainer(
        title = "戰 術 遭 遇 · ${c.enemyName}",
        subtitle = "我方生命 ${uiState.gameState.hp}/${uiState.gameState.maxHp} · 敵方弱點：${if (c.hasAllSeeingEye) c.weaknessLabel else "請觀察招式推測"}",
        onClose = { vm.combatEscape() }
    ) {
        Text(c.enemyDesc, style = MaterialTheme.typography.bodyMedium, color = palette.textSecondary)
        Text("敵人生命：${c.enemyHp} / ${c.enemyMaxHp}  (攻擊力 ${c.enemyAtk})", color = palette.danger, style = MaterialTheme.typography.titleMedium)
        LinearProgressIndicator(
            progress = { (c.enemyHp.toFloat() / c.enemyMaxHp.coerceAtLeast(1)).coerceIn(0f, 1f) },
            color = palette.danger,
            trackColor = palette.bgCard,
            modifier = Modifier.fillMaxWidth().height(8.dp)
        )

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(palette.bgCard)
                .padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            c.logs.forEach { log ->
                Text(log, style = MaterialTheme.typography.bodyMedium, color = palette.textPrimary)
            }
        }

        Text("選擇屬性道具擊破弱點（1.8x 剋制傷害）：", style = MaterialTheme.typography.labelLarge, color = palette.accent)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            uiState.systems.v61CombatItems.forEach { item ->
                OutlinedButton(
                    onClick = { vm.useCombatItem(item) },
                    modifier = Modifier.heightIn(min = 48.dp)
                ) {
                    Text("${item.name} (${item.targetLabel})")
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            Button(
                onClick = { vm.combatBasicStrike() },
                modifier = Modifier.weight(1f).heightIn(min = 48.dp)
            ) {
                Text("邏輯突刺")
            }
            OutlinedButton(
                onClick = { vm.combatPersuade() },
                modifier = Modifier.weight(1f).heightIn(min = 48.dp)
            ) {
                Text("說服安撫")
            }
            OutlinedButton(
                onClick = { vm.combatEscape() },
                modifier = Modifier.weight(1f).heightIn(min = 48.dp)
            ) {
                Text("撤退")
            }
        }
    }
}

@Composable
fun V59PuzzleModal(st: V59PuzzleModalState, uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val title = when (st.type) {
        V59PuzzleType.WordMatch -> "詞彙因果配對謎題"
        V59PuzzleType.Sliding3x3 -> "3x3 九宮格歸位拼圖"
        V59PuzzleType.RhythmBeat -> "夜鳥節奏韻律共鳴"
        V59PuzzleType.MirrorBeam -> "量子銀幕鏡面光線折射"
    }

    GateModalContainer(
        title = title,
        subtitle = "亦可消耗 15 記憶碎片開啟「靈光略過」",
        onClose = { vm.closeOverlay() },
        footer = {
            OutlinedButton(
                onClick = { vm.skipV59WithIntuition() },
                modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
            ) {
                Text("以直覺略過此謎題（消耗 15 碎片，現有 ${uiState.progress.memoryShards}）")
            }
        }
    ) {
        when (st.type) {
            V59PuzzleType.WordMatch -> {
                Text("先選左側門扉，再點擊右側對應關鍵詞：", color = palette.textSecondary)
                MiniGameAndCombatEngine.WORD_MATCH_PAIRS.forEachIndexed { idx, (left, right) ->
                    val done = idx in st.matchedPairs
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { vm.stepV59WordMatch(true, idx) },
                            enabled = !done,
                            modifier = Modifier.weight(1f).heightIn(min = 48.dp)
                        ) {
                            Text(if (st.leftSelected == idx) "[$left]" else left, color = if (done) palette.safeGreen else palette.textPrimary)
                        }
                        OutlinedButton(
                            onClick = { vm.stepV59WordMatch(false, idx) },
                            enabled = !done,
                            modifier = Modifier.weight(1f).heightIn(min = 48.dp)
                        ) {
                            Text(if (done) "$right (完成)" else right, color = if (done) palette.safeGreen else palette.accent)
                        }
                    }
                }
            }
            V59PuzzleType.Sliding3x3 -> {
                Text("點擊空白格相鄰的數字塊使其歸位（1..8 順排）：", color = palette.textSecondary)
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    for (r in 0 until 3) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                            for (c in 0 until 3) {
                                val idx = r * 3 + c
                                val num = st.slideTiles[idx]
                                Surface(
                                    onClick = { if (num != 0) vm.stepV59Slide(idx) },
                                    color = if (num == 0) Color.Transparent else palette.bgCard,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .aspectRatio(1f)
                                        .border(1.dp, if (num == 0) palette.borderSubtle.copy(alpha = 0.25f) else palette.accent.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        if (num != 0) Text("$num", style = MaterialTheme.typography.headlineMedium, color = palette.textPrimary)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            V59PuzzleType.RhythmBeat -> {
                Text("跟著鳥鳴拍點節奏穩定點擊共鳴（需累積 4 拍）：", color = palette.textSecondary)
                LinearProgressIndicator(
                    progress = { (st.rhythmHits / 4f).coerceIn(0f, 1f) },
                    color = palette.accent,
                    modifier = Modifier.fillMaxWidth().height(8.dp)
                )
                Button(
                    onClick = { vm.hitV59Rhythm() },
                    modifier = Modifier.fillMaxWidth().heightIn(min = 56.dp)
                ) {
                    Text("敲擊共鳴節拍 (${st.rhythmHits}/4)")
                }
            }
            V59PuzzleType.MirrorBeam -> {
                Text("切換三片光學折射鏡的角度（/ 或 \\），讓雷射命中放映口：", color = palette.textSecondary)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    st.mirrorAngles.forEachIndexed { idx, ang ->
                        OutlinedButton(
                            onClick = { vm.toggleV59Mirror(idx) },
                            modifier = Modifier.weight(1f).heightIn(min = 64.dp)
                        ) {
                            Text("鏡面 ${idx + 1}\n[ $ang ]")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MiniGameModal(st: MiniGameModalState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val title = when (st.mgId) {
        "mg_d1" -> "質數路徑矩陣"
        "mg_d2" -> "熄燈詭異閱覽室"
        "mg_d3" -> "心電監護脈搏校準"
        "mg_d4" -> "星象記憶翻牌配對"
        "mg_d5" -> "潮汐閘門連通管道"
        else -> "天台訊號波形諧振"
    }

    GateModalContainer(
        title = title,
        subtitle = st.statusText,
        onClose = { vm.closeOverlay() }
    ) {
        Text(
            text = st.message,
            color = if (st.isError) palette.danger else palette.accent,
            style = MaterialTheme.typography.bodyMedium
        )

        when (st.mgId) {
            "mg_d1" -> {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    for (r in 0 until 4) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                            for (c in 0 until 4) {
                                val num = MiniGameAndCombatEngine.PRIME_GRID_VALS[r][c]
                                val isHere = r == st.d1Row && c == st.d1Col
                                val visited = "$r,$c" in st.d1Visited
                                Surface(
                                    onClick = { vm.stepMiniGameD1(r, c) },
                                    color = when {
                                        isHere -> palette.accent
                                        visited -> palette.safeGreen.copy(alpha = 0.2f)
                                        else -> palette.bgCard
                                    },
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(52.dp)
                                        .border(1.dp, palette.borderSubtle, RoundedCornerShape(8.dp))
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(
                                            text = num.toString(),
                                            color = if (isHere) Color(0xFF141008) else palette.textPrimary,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            "mg_d2" -> {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    for (r in 0 until 3) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                            for (c in 0 until 3) {
                                val lit = st.d2Board.getOrNull(r)?.getOrNull(c) == true
                                Surface(
                                    onClick = { vm.stepMiniGameD2(r, c) },
                                    color = if (lit) palette.accent else palette.bgCard,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .aspectRatio(1f)
                                        .border(1.dp, palette.borderSubtle, RoundedCornerShape(10.dp))
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(if (lit) "亮燈" else "熄滅", color = if (lit) Color(0xFF141008) else palette.textMuted)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            "mg_d3" -> {
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(70.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(palette.bgCard)
                        .border(1.dp, palette.borderSubtle, RoundedCornerShape(10.dp))
                ) {
                    val zoneLeft = (st.d3ZoneMin / 100f) * size.width
                    val zoneRight = (st.d3ZoneMax / 100f) * size.width
                    drawRect(
                        color = palette.accent.copy(alpha = 0.28f),
                        topLeft = Offset(zoneLeft, 0f),
                        size = androidx.compose.ui.geometry.Size(zoneRight - zoneLeft, size.height)
                    )
                    val curX = (st.d3CursorPos / 100f) * size.width
                    drawLine(palette.danger, Offset(curX, 0f), Offset(curX, size.height), strokeWidth = 6f)
                }
                Button(
                    onClick = { vm.hitMiniGameD3() },
                    modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp)
                ) {
                    Text("校準心跳脈搏 (${st.d3Hits}/3)")
                }
            }
            "mg_d4" -> {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    for (r in 0 until 3) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                            for (c in 0 until 4) {
                                val idx = r * 4 + c
                                val card = st.d4Deck.getOrNull(idx)
                                Surface(
                                    onClick = { vm.flipMiniGameD4(idx) },
                                    color = when {
                                        card?.matched == true -> palette.safeGreen.copy(alpha = 0.2f)
                                        card?.flipped == true -> palette.accent.copy(alpha = 0.2f)
                                        else -> palette.bgCard
                                    },
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(62.dp)
                                        .border(1.dp, palette.borderSubtle, RoundedCornerShape(8.dp))
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(
                                            text = if (card?.flipped == true || card?.matched == true) card.symbol else "?",
                                            style = MaterialTheme.typography.titleMedium,
                                            color = palette.textPrimary
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            "mg_d5" -> {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    for (r in 0 until 3) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                            for (c in 0 until 3) {
                                val cell = st.d5Grid.getOrNull(r)?.getOrNull(c)
                                Surface(
                                    onClick = { vm.rotateMiniGameD5(r, c) },
                                    color = if (cell?.filled == true) palette.ghostBlue.copy(alpha = 0.22f) else palette.bgCard,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .aspectRatio(1f)
                                        .border(1.dp, if (cell?.filled == true) palette.ghostBlue else palette.borderSubtle, RoundedCornerShape(10.dp))
                                ) {
                                    Canvas(modifier = Modifier.fillMaxWidth().aspectRatio(1f)) {
                                        if (cell != null) {
                                            val dirs = MiniGameAndCombatEngine.getPipeDirs(cell)
                                            val cx = size.width / 2f
                                            val cy = size.height / 2f
                                            val lineColor = if (cell.filled) Color(0xFF7EA6E0) else Color(0xFFB5AE9C)
                                            drawCircle(lineColor, radius = 7f, center = Offset(cx, cy))
                                            dirs.forEach { d ->
                                                val end = when (d) {
                                                    0 -> Offset(cx, 0f)
                                                    1 -> Offset(size.width, cy)
                                                    2 -> Offset(cx, size.height)
                                                    else -> Offset(0f, cy)
                                                }
                                                drawLine(lineColor, Offset(cx, cy), end, strokeWidth = 10f)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else -> {
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(110.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(palette.bgCard)
                        .border(1.dp, palette.borderSubtle, RoundedCornerShape(10.dp))
                ) {
                    val targetPath = Path()
                    val userPath = Path()
                    val mid = size.height / 2f
                    for (x in 0..size.width.toInt() step 4) {
                        val norm = x / size.width
                        val ty = mid - sin(norm * 2f * PI.toFloat() * 3f + 1f * 0.8f) * (size.height * 0.32f)
                        val uy = mid - sin(norm * 2f * PI.toFloat() * st.d6Freq + st.d6Phase * 0.8f) * (size.height * (st.d6Amp * 0.08f))
                        if (x == 0) {
                            targetPath.moveTo(0f, ty)
                            userPath.moveTo(0f, uy)
                        } else {
                            targetPath.lineTo(x.toFloat(), ty)
                            userPath.lineTo(x.toFloat(), uy)
                        }
                    }
                    drawPath(targetPath, palette.accent.copy(alpha = 0.4f), style = Stroke(width = 4f))
                    drawPath(userPath, palette.safeGreen, style = Stroke(width = 5f))
                }
                WaveControlRow("頻率", st.d6Freq, 1..5) { vm.updateMiniGameD6(it, st.d6Amp, st.d6Phase) }
                WaveControlRow("振幅", st.d6Amp, 1..5) { vm.updateMiniGameD6(st.d6Freq, it, st.d6Phase) }
                WaveControlRow("相位", st.d6Phase, 0..5) { vm.updateMiniGameD6(st.d6Freq, st.d6Amp, it) }
            }
        }
    }
}

@Composable
private fun WaveControlRow(label: String, value: Int, range: IntRange, onSelect: (Int) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(label, modifier = Modifier.widthIn(min = 42.dp))
        range.forEach { v ->
            FilterChip(selected = value == v, onClick = { onSelect(v) }, label = { Text("$v") })
        }
    }
}

@Composable
fun SaveLoadModal(isSaveMode: Boolean, uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val fmt = remember { SimpleDateFormat("MM-dd HH:mm", Locale.getDefault()) }
    var importText by remember { mutableStateOf("") }
    @Suppress("DEPRECATION")
    val clipboard = LocalClipboardManager.current

    GateModalContainer(
        title = if (isSaveMode) "保 存 進 度" else "讀 取 進 度 / 引 繼",
        onClose = { vm.closeOverlay() }
    ) {
        if (!isSaveMode && uiState.autoSaveSlot != null) {
            val auto = uiState.autoSaveSlot
            Surface(
                onClick = { vm.loadFromSlot(auto) },
                color = palette.accent.copy(alpha = 0.1f),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth().border(1.dp, palette.accent.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
            ) {
                Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("自動存檔 · ${auto.roomName}", color = palette.accent)
                    Text(fmt.format(Date(auto.timestamp)), color = palette.textSecondary)
                }
            }
        }

        for (slotIdx in 1..3) {
            val slot = uiState.saveSlots.getOrNull(slotIdx - 1)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(palette.bgCard)
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("存檔槽 $slotIdx", style = MaterialTheme.typography.titleMedium, color = palette.textPrimary)
                    Text(
                        if (slot != null) "${slot.roomName} · HP ${slot.hp} · ${fmt.format(Date(slot.timestamp))}" else "空槽位",
                        style = MaterialTheme.typography.labelSmall,
                        color = palette.textSecondary
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (isSaveMode) {
                        Button(onClick = { vm.saveToSlot(slotIdx) }, modifier = Modifier.heightIn(min = 48.dp)) { Text("存入") }
                    } else if (slot != null) {
                        Button(onClick = { vm.loadFromSlot(slot) }, modifier = Modifier.heightIn(min = 48.dp)) { Text("讀取") }
                    }
                    if (slot != null) {
                        OutlinedButton(onClick = { vm.deleteSlot(slotIdx) }, modifier = Modifier.heightIn(min = 48.dp)) { Text("刪除") }
                    }
                }
            }
        }

        Spacer(Modifier.height(8.dp))
        Text("跨裝置 Base64 引繼碼 (SHA-256 校驗)：", style = MaterialTheme.typography.labelLarge, color = palette.accent)
        Button(
            onClick = {
                val code = vm.generateTransferCode()
                clipboard.setText(AnnotatedString(code))
                vm.showToast("已產生引繼碼並複製到剪貼簿")
            },
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
        ) {
            Text("匯出並複製引繼碼")
        }
        OutlinedTextField(
            value = importText,
            onValueChange = { importText = it },
            label = { Text("貼上引繼碼以匯入所有門扉存檔") },
            maxLines = 3,
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedButton(
            onClick = {
                vm.importTransferCode(importText)
                importText = ""
            },
            enabled = importText.isNotBlank(),
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
        ) {
            Text("匯入引繼碼")
        }
    }
}

@Composable
fun PauseMenuModal(vm: GameViewModel) {
    GateModalContainer(
        title = "暫 停 選 單",
        onClose = { vm.closeOverlay() }
    ) {
        Button(onClick = { vm.closeOverlay() }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("pause_resume_btn")) {
            Text("繼續遊戲")
        }
        OutlinedButton(onClick = { vm.openOverlay(UiOverlay.SaveLoad(true)) }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) {
            Text("保存進度")
        }
        OutlinedButton(onClick = { vm.openOverlay(UiOverlay.SaveLoad(false)) }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) {
            Text("讀取進度")
        }
        OutlinedButton(onClick = { vm.openOverlay(UiOverlay.Settings) }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) {
            Text("畫面與音效設置")
        }
        OutlinedButton(onClick = { vm.restartCurrentDungeon() }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) {
            Text("重新開始本扇門")
        }
        OutlinedButton(onClick = { vm.backToHub() }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("pause_back_hub_btn")) {
            Text("返回無盡迴廊")
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SettingsModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val s = uiState.settings

    GateModalContainer(
        title = "遊 戲 設 置",
        onClose = { vm.closeOverlay() }
    ) {
        Text("文字顯示速度", style = MaterialTheme.typography.labelLarge, color = palette.accent)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("slow" to "沉吟", "normal" to "標準", "fast" to "明快", "instant" to "瞬現").forEach { (k, l) ->
                FilterChip(selected = s.typeSpeed == k, onClick = { vm.updateSettings { it.copy(typeSpeed = k) } }, label = { Text(l) })
            }
        }

        Text("字體大小與風格", style = MaterialTheme.typography.labelLarge, color = palette.accent)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("small" to "小", "normal" to "標準", "large" to "大", "xlarge" to "特大").forEach { (k, l) ->
                FilterChip(selected = s.fontSize == k, onClick = { vm.updateSettings { it.copy(fontSize = k) } }, label = { Text(l) })
            }
        }
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("serif" to "宋體", "sans" to "黑體", "mono" to "等寬").forEach { (k, l) ->
                FilterChip(selected = s.fontFamily == k, onClick = { vm.updateSettings { it.copy(fontFamily = k) } }, label = { Text(l) })
            }
        }

        Text("主題色系（7 選）", style = MaterialTheme.typography.labelLarge, color = palette.accent)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            listOf("default" to "玄金", "blood" to "緋紅", "ice" to "霜藍", "forest" to "幽林", "violet" to "夜紫", "amber" to "琥珀", "jade" to "青玉").forEach { (k, l) ->
                FilterChip(selected = s.theme == k, onClick = { vm.updateSettings { it.copy(theme = k) } }, label = { Text(l) })
            }
        }

        Text("背景墨調（4 選）", style = MaterialTheme.typography.labelLarge, color = palette.accent)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            listOf("ink" to "墨黑", "bamboo" to "暗竹", "crimson" to "殘脂", "azure" to "夜海").forEach { (k, l) ->
                FilterChip(selected = s.bgTone == k, onClick = { vm.updateSettings { it.copy(bgTone = k) } }, label = { Text(l) })
            }
        }

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("啟用環境配樂與點擊音效")
            Switch(checked = s.soundEnabled, onCheckedChange = { v -> vm.updateSettings { it.copy(soundEnabled = v) } })
        }
        Text("主音量 (${(s.masterVolume * 100).toInt()}%)")
        Slider(value = s.masterVolume, onValueChange = { v -> vm.updateSettings { it.copy(masterVolume = v) } })
        Text("配樂音量 (${(s.bgmVolume * 100).toInt()}%)")
        Slider(value = s.bgmVolume, onValueChange = { v -> vm.updateSettings { it.copy(bgmVolume = v) } })

        SettingSwitchRow("高對比無障礙色彩", s.highContrast) { v -> vm.updateSettings { it.copy(highContrast = v) } }
        SettingSwitchRow("減弱粒子與動態效果", s.reducedMotion) { v -> vm.updateSettings { it.copy(reducedMotion = v) } }
        SettingSwitchRow("自動跳過已讀場景打字", s.autoSkipRead) { v -> vm.updateSettings { it.copy(autoSkipRead = v) } }
        SettingSwitchRow("顯示環境音效字幕提示", s.sfxSubtitles) { v -> vm.updateSettings { it.copy(sfxSubtitles = v) } }
    }
}

@Composable
private fun SettingSwitchRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(label)
        Switch(checked = checked, onCheckedChange = onChange)
    }
}

@Composable
fun AchievementsModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    GateModalContainer(
        title = "成 就 一 覽",
        subtitle = "已達成 ${uiState.progress.unlockedAchievements.size} / ${uiState.allAchievementsCount}",
        onClose = { vm.closeOverlay() }
    ) {
        uiState.dungeons.forEach { d ->
            Text("${d.index} · ${d.name}", color = palette.accent, style = MaterialTheme.typography.titleMedium)
            d.achDefs.forEach { ach ->
                val ok = ach.id in uiState.progress.unlockedAchievements
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(palette.bgCard)
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(if (ok || !ach.hidden) ach.name else "隱藏成就", color = if (ok) palette.textPrimary else palette.textMuted)
                        Text(if (ok || !ach.hidden) ach.desc else "推進特殊故事線後解鎖", style = MaterialTheme.typography.labelSmall, color = palette.textSecondary)
                    }
                    Text(if (ok) "達成" else "未解", color = if (ok) palette.safeGreen else palette.textMuted)
                }
            }
        }
    }
}

@Composable
fun HistoryModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    GateModalContainer(
        title = "探 索 歷 史 軌 跡",
        subtitle = "本次推門共歷經 ${uiState.gameState.history.size} 個記憶節點",
        onClose = { vm.closeOverlay() }
    ) {
        uiState.gameState.history.asReversed().forEachIndexed { i, line ->
            Text("${uiState.gameState.history.size - i}. $line", color = palette.textPrimary, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun BranchTreeModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    GateModalContainer(
        title = "劇 情 分 岐 軌 跡 樹",
        subtitle = "已踏足本門場景 ${uiState.gameState.visitedScenes.size} 個",
        onClose = { vm.closeOverlay() }
    ) {
        val visitedList = uiState.gameState.visitedScenes.toList()
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(palette.bgCard)
        ) {
            val count = visitedList.size.coerceAtLeast(1)
            val step = size.width / (count + 1)
            var prev: Offset? = null
            visitedList.forEachIndexed { idx, s ->
                val curr = Offset(step * (idx + 1), if (idx % 2 == 0) size.height * 0.38f else size.height * 0.65f)
                prev?.let { drawLine(palette.accent.copy(alpha = 0.4f), it, curr, strokeWidth = 3f) }
                val isCurrent = s == uiState.gameState.currentScene
                drawCircle(if (isCurrent) palette.accent else palette.safeGreen, radius = if (isCurrent) 11f else 7f, center = curr)
                prev = curr
            }
        }
        visitedList.forEach { sid ->
            Text("• $sid", color = if (sid == uiState.gameState.currentScene) palette.accent else palette.textPrimary)
        }
    }
}

@Composable
fun OutsiderDialogModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    GateModalContainer(
        title = "迴 廊 守 望 者 · 局 外 人",
        subtitle = "牽絆好感度：${uiState.progress.outsiderAffinity}/100 · 現有記憶碎片：${uiState.progress.memoryShards}",
        onClose = { vm.closeOverlay() }
    ) {
        Text("「只要你還沒有忘記自己是誰，這條長廊就永遠不會徹底吞沒你。若你需要一點微光，可以用零碎記憶換些暖意。」", style = MaterialTheme.typography.bodyLarge, color = palette.textPrimary)
        Button(
            onClick = { vm.giveOutsiderShard() },
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
        ) {
            Text("贈予 5 記憶碎片（好感 +15 · 恢復體力 20）")
        }
    }
}

@Composable
fun PreviewDungeonModal(meta: DungeonMeta, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    GateModalContainer(
        title = meta.name,
        subtitle = "${meta.index} · ${meta.subText}",
        onClose = { vm.closeOverlay() }
    ) {
        Text(meta.tagline, style = MaterialTheme.typography.bodyLarge, color = palette.textPrimary)
        if (meta.ruleText.isNotBlank()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(palette.bgCard)
                    .padding(12.dp)
            ) {
                Text(meta.ruleText, color = palette.accent, style = MaterialTheme.typography.bodyMedium)
            }
        }
        Text("收錄結局總數：${meta.endingsTotal} 個 · 成就數量：${meta.achDefs.size} 個", color = palette.textSecondary)
    }
}

@Composable
fun MysteryLockModal(meta: DungeonMeta, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val reqText = when {
        meta.id in 2..11 -> "請先通關第 ${meta.id - 1} 扇門，即可開啟這扇未知門扉。"
        meta.id == 12 || meta.id == 13 -> "通關第 11 扇門並啟動二周目輪迴（或破除第 6 扇門循環）即可解鎖終局雙門。"
        meta.id == 14 -> "需同時通關第 12 扇門與第 13 扇門後，最終起源之門才會顯現。"
        else -> "推進前序門扉進度即可解鎖。"
    }
    GateModalContainer(
        title = "未 知 之 門 · 封 印 中",
        onClose = { vm.closeOverlay() }
    ) {
        Text(reqText, style = MaterialTheme.typography.bodyLarge, color = palette.textPrimary)
    }
}
