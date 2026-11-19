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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.behaviors.MetaSystemsBehavior
import com.example.engine.GameUiState
import com.example.engine.GameViewModel
import com.example.engine.SanctumAndRadarEngine
import com.example.model.UiOverlay
import com.example.ui.theme.LocalGatePalette
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun SanctumModal(initialTab: String, uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val tabNames = listOf("星圖", "塔羅牌", "遺物共鳴", "首領試煉", "機密檔案")
    val initIdx = when (initialTab) {
        "tarot" -> 1
        "relics" -> 2
        "gauntlet" -> 3
        "logs" -> 4
        else -> 0
    }
    var selectedTab by remember { mutableIntStateOf(initIdx) }

    GateModalContainer(
        title = "無 盡 迴 廊 聖 殿",
        subtitle = "記憶碎片 ${uiState.progress.memoryShards} · 已試煉首領 ${uiState.progress.gauntletCleared.size}/14",
        onClose = { vm.closeOverlay() }
    ) {
        TabRow(selectedTabIndex = selectedTab, containerColor = palette.bgCard) {
            tabNames.forEachIndexed { i, t ->
                Tab(selected = selectedTab == i, onClick = { selectedTab = i }, text = { Text(t, maxLines = 1) })
            }
        }
        Spacer(Modifier.height(6.dp))

        when (selectedTab) {
            0 -> {
                Text("十四扇門扉因果星圖", style = MaterialTheme.typography.titleMedium, color = palette.accent)
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(170.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(palette.bgCard)
                        .border(1.dp, palette.borderSubtle, RoundedCornerShape(12.dp))
                ) {
                    val cols = 7
                    val pts = (1..14).map { idx ->
                        val r = (idx - 1) / cols
                        val c = (idx - 1) % cols
                        val x = ((c + 1f) / (cols + 1f)) * size.width
                        val y = (if (r == 0) 0.34f else 0.7f) * size.height
                        idx to Offset(x, y)
                    }
                    for (i in 0 until pts.lastIndex) {
                        drawLine(palette.borderSubtle, pts[i].second, pts[i + 1].second, strokeWidth = 2f)
                    }
                    pts.forEach { (id, pt) ->
                        val cleared = id in uiState.progress.clearedDungeons
                        drawCircle(
                            color = if (cleared) palette.accent else palette.textMuted.copy(alpha = 0.45f),
                            radius = if (cleared) 12f else 8f,
                            center = pt
                        )
                    }
                }
                Text(
                    "已貫通門扉：${uiState.progress.clearedDungeons.sorted().joinToString("、").ifBlank { "尚無" }}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = palette.textSecondary
                )
            }
            1 -> {
                Text("擇一張大阿爾克那為下次推門提供常駐加護：", style = MaterialTheme.typography.bodyMedium, color = palette.textSecondary)
                uiState.systems.v70Tarot.forEach { card ->
                    val equipped = uiState.progress.activeTarotId == card.id
                    Surface(
                        onClick = { vm.equipTarot(card.id) },
                        color = if (equipped) palette.accent.copy(alpha = 0.16f) else palette.bgCard,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, if (equipped) palette.accent else palette.borderSubtle, RoundedCornerShape(10.dp))
                    ) {
                        Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("${card.arcana} · ${card.bonusName}", style = MaterialTheme.typography.titleMedium, color = palette.textPrimary)
                                Text(card.desc, style = MaterialTheme.typography.bodyMedium, color = palette.textSecondary)
                            }
                            Text(if (equipped) "共鳴中" else "裝備", color = palette.accent)
                        }
                    }
                }
            }
            2 -> {
                val activeSynergies = SanctumAndRadarEngine.getActiveSynergySeals(uiState.progress.equippedRelics, uiState.systems)
                Text("已裝備遺物 ${uiState.progress.equippedRelics.size}/3 · 啟動共鳴 ${activeSynergies.size} 組", color = palette.accent, style = MaterialTheme.typography.titleMedium)
                activeSynergies.forEach { seal ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(palette.safeGreen.copy(alpha = 0.12f))
                            .border(1.dp, palette.safeGreen, RoundedCornerShape(8.dp))
                            .padding(10.dp)
                    ) {
                        Text("共鳴啟動【${seal.name}】：${seal.desc}", color = palette.safeGreen)
                    }
                }
                uiState.systems.v64Relics.forEach { relic ->
                    val eq = relic.id in uiState.progress.equippedRelics
                    Surface(
                        onClick = { vm.toggleEquipRelic(relic.id) },
                        color = if (eq) palette.accent.copy(alpha = 0.14f) else palette.bgCard,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, if (eq) palette.accent else palette.borderSubtle, RoundedCornerShape(10.dp))
                    ) {
                        Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("${relic.name}（${relic.origin}）", style = MaterialTheme.typography.titleMedium, color = palette.textPrimary)
                                Text(relic.desc, style = MaterialTheme.typography.bodyMedium, color = palette.textSecondary)
                            }
                            Text(if (eq) "已佩帶" else "佩帶", color = palette.accent)
                        }
                    }
                }
            }
            3 -> {
                uiState.systems.v70Gauntlet.forEach { boss ->
                    val cleared = boss.gate in uiState.progress.gauntletCleared
                    Surface(
                        onClick = { vm.challengeGauntletBoss(boss.gate) },
                        color = palette.bgCard,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, if (cleared) palette.safeGreen else palette.borderSubtle, RoundedCornerShape(10.dp))
                    ) {
                        Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("第 ${boss.gate} 門 · ${boss.name}", style = MaterialTheme.typography.titleMedium, color = palette.textPrimary)
                                Text("弱點：${boss.weakness} · 獎勵 ${boss.rewardShards} 碎片", style = MaterialTheme.typography.bodyMedium, color = palette.textSecondary)
                            }
                            Text(if (cleared) "已破關" else "挑戰", color = if (cleared) palette.safeGreen else palette.accent)
                        }
                    }
                }
            }
            else -> {
                uiState.systems.v70SecretLogs.forEach { log ->
                    val unlocked = log.gate in uiState.progress.clearedDungeons
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(palette.bgCard)
                            .border(1.dp, palette.borderSubtle, RoundedCornerShape(10.dp))
                            .padding(12.dp)
                    ) {
                        Text(if (unlocked) "門 ${log.gate} · ${log.title}" else "門 ${log.gate} · 尚未解密", color = palette.accent, style = MaterialTheme.typography.titleMedium)
                        Text(if (unlocked) log.text else "通關第 ${log.gate} 扇門後揭示此機密觀測紀錄。", color = palette.textSecondary, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
}

@Composable
fun AlchemyModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    GateModalContainer(
        title = "記 憶 調 合 工 坊",
        subtitle = "碎片 ${uiState.progress.memoryShards} · 凝視 ${uiState.progress.envGazeFound.size}/42 · 謎語 ${uiState.progress.riddlesSolved.size}/14",
        onClose = { vm.closeOverlay() }
    ) {
        uiState.systems.v64Alchemy.forEach { r ->
            val crafted = r.id in uiState.progress.alchemyCrafted
            val canCraft = uiState.progress.envGazeFound.size >= r.reqEnv &&
                uiState.progress.riddlesSolved.size >= r.reqRiddle &&
                uiState.progress.memoryShards >= r.shardCost
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(palette.bgCard)
                    .border(1.dp, if (crafted) palette.safeGreen.copy(alpha = 0.5f) else palette.borderSubtle, RoundedCornerShape(10.dp))
                    .padding(12.dp)
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(r.name, style = MaterialTheme.typography.titleMedium, color = palette.accent)
                    Text("消耗 ${r.shardCost} 碎片", style = MaterialTheme.typography.labelSmall, color = palette.textSecondary)
                }
                Text(r.rewardText, style = MaterialTheme.typography.bodyMedium, color = palette.textPrimary)
                Text("解鎖要求：凝視 >= ${r.reqEnv} · 謎語 >= ${r.reqRiddle}", style = MaterialTheme.typography.labelSmall, color = palette.textMuted)
                Spacer(Modifier.height(6.dp))
                OutlinedButton(
                    onClick = { vm.craftAlchemyRecipe(r.id) },
                    enabled = canCraft,
                    modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                ) {
                    Text(if (crafted) "再次調合" else if (canCraft) "開始調合" else "條件未滿足")
                }
            }
        }
    }
}

@Composable
fun DeductionRadarModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val report = uiState.deductionRadarReport
    GateModalContainer(
        title = "因 果 推 理 雷 達",
        subtitle = uiState.selectedDungeonMeta?.name ?: "",
        onClose = { vm.closeOverlay() }
    ) {
        if (report == null) {
            Text("正在掃描門扉分岐樹…", color = palette.textSecondary)
        } else {
            Text("場景覆蓋率：${report.visitedCount}/${report.totalScenes} (${report.coveragePercent}%)", color = palette.accent, style = MaterialTheme.typography.titleMedium)
            LinearProgressIndicator(
                progress = { report.coveragePercent / 100f },
                color = palette.accent,
                trackColor = palette.bgCard,
                modifier = Modifier.fillMaxWidth().height(6.dp)
            )
            Text("真結局條件診斷：${report.trueEndingHint}", style = MaterialTheme.typography.bodyMedium, color = palette.textPrimary)
            if (report.missingFragments.isNotEmpty()) {
                Text("本門未收集碎片：${report.missingFragments.joinToString("、")}", color = palette.ghostBlue, style = MaterialTheme.typography.bodyMedium)
            }
            if (report.branches.isNotEmpty()) {
                Text("尚未踏足的分歧節點：", style = MaterialTheme.typography.labelLarge, color = palette.accent)
                report.branches.forEach { b ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(palette.bgCard)
                            .padding(10.dp)
                    ) {
                        Text("${b.roomName} (${b.sceneId}) · 剩餘 ${b.unvisitedChoiceCount} 條支線", color = palette.textPrimary)
                        b.sampleTexts.forEach { sample ->
                            Text("→ $sample", style = MaterialTheme.typography.labelSmall, color = palette.textSecondary)
                        }
                    }
                }
            } else {
                Text("此門扉主要分歧點已全數走訪！", color = palette.safeGreen)
            }
        }
    }
}

@Composable
fun EnvGazeModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val doorKey = uiState.gameState.dungeonId.toString()
    val list = uiState.systems.v64EnvGaze[doorKey].orEmpty()
    GateModalContainer(
        title = "環 境 凝 視 觀 測",
        subtitle = "全迴廊累積發現 ${uiState.progress.envGazeFound.size} / 42 處細微異常",
        onClose = { vm.closeOverlay() }
    ) {
        if (list.isEmpty()) {
            Text("此區域目前環境澄明，無額外可凝視物件。", color = palette.textMuted)
        } else {
            list.forEach { item ->
                val found = item.id in uiState.progress.envGazeFound
                Surface(
                    onClick = { vm.discoverEnvGaze(item.id) },
                    color = palette.bgCard,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, if (found) palette.safeGreen else palette.borderSubtle, RoundedCornerShape(10.dp))
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("${item.title} ${if (found) "(已記錄)" else "(點擊凝視)"}", color = if (found) palette.safeGreen else palette.accent, style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(4.dp))
                        Text(item.text, color = palette.textPrimary, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
}

@Composable
fun GateRiddleModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val did = uiState.gameState.dungeonId
    val riddle = uiState.systems.v64Riddles[did.toString()]
    val solved = did in uiState.progress.riddlesSolved

    GateModalContainer(
        title = "門 扉 守 則 謎 語",
        subtitle = "已破解門扉謎語 ${uiState.progress.riddlesSolved.size} / 14",
        onClose = { vm.closeOverlay() }
    ) {
        if (riddle == null) {
            Text("本門扉無守則謎語。", color = palette.textMuted)
        } else {
            Text(riddle.q, style = MaterialTheme.typography.bodyLarge, color = palette.textPrimary)
            if (riddle.hint.isNotBlank()) {
                Text("線索：${riddle.hint}", style = MaterialTheme.typography.labelSmall, color = palette.textSecondary)
            }
            riddle.opts.forEachIndexed { idx, opt ->
                val isAns = solved && idx == riddle.ans
                OutlinedButton(
                    onClick = { vm.answerGateRiddle(did, idx) },
                    enabled = !solved,
                    modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                ) {
                    Text(if (isAns) "$opt (正解)" else opt, color = if (isAns) palette.safeGreen else palette.textPrimary)
                }
            }
        }
    }
}

@Composable
fun GateAnomalyModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val did = uiState.gameState.dungeonId
    val anomaly = uiState.systems.v64Anomalies[did.toString()]
    val used = did in uiState.progress.anomalyUsedByDoor

    GateModalContainer(
        title = anomaly?.title ?: "迴廊時間縫隙",
        subtitle = if (used) "本門異變已觸發完畢" else "選擇一種介入方式（每門限一次）",
        onClose = { vm.closeOverlay() }
    ) {
        if (anomaly != null) {
            Text(anomaly.desc, style = MaterialTheme.typography.bodyLarge, color = palette.textPrimary)
            anomaly.choices.forEachIndexed { idx, ch ->
                Button(
                    onClick = { vm.triggerGateAnomalyChoice(did, idx) },
                    enabled = !used,
                    modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                ) {
                    Text(ch)
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ShopModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    GateModalContainer(
        title = "記 憶 碎 片 商 店",
        subtitle = "持有記憶碎片：${uiState.progress.memoryShards}",
        onClose = { vm.closeOverlay() }
    ) {
        uiState.systems.shopItems.forEach { item ->
            val owned = item.id in uiState.progress.purchasedShopItems
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(palette.bgCard)
                    .border(1.dp, if (owned) palette.safeGreen.copy(alpha = 0.45f) else palette.borderSubtle, RoundedCornerShape(10.dp))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(item.name, style = MaterialTheme.typography.titleMedium, color = palette.textPrimary)
                    Text(item.desc, style = MaterialTheme.typography.bodyMedium, color = palette.textSecondary)
                }
                OutlinedButton(
                    onClick = { vm.purchaseShopItem(item.id) },
                    enabled = !owned,
                    modifier = Modifier.heightIn(min = 48.dp)
                ) {
                    Text(if (owned) "已擁有" else "${item.cost} 碎片")
                }
            }
        }

        if ("shop_companion_select" in uiState.progress.purchasedShopItems) {
            Spacer(Modifier.height(6.dp))
            Text("指定第一扇門初始強化夥伴：", style = MaterialTheme.typography.labelLarge, color = palette.accent)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("suwan" to "蘇晚", "laozhao" to "老趙", "akai" to "阿凱").forEach { (id, name) ->
                    FilterChip(
                        selected = uiState.progress.chosenStartCompanion == id,
                        onClick = { vm.selectStartCompanion(id) },
                        label = { Text(name) }
                    )
                }
            }
        }
    }
}

@Composable
fun DailyChallengeModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val seed = uiState.dailySeedInfo
    val rule = MetaSystemsBehavior.getDailyRuleForDay(seed.dayOfWeek, uiState.systems)
    val meta = uiState.dungeons.firstOrNull { it.id == seed.recommendedDungeonId }
    val doneToday = seed.dateKey in uiState.progress.dailyCompletedDates

    GateModalContainer(
        title = "每 日 迴 廊 試 煉",
        subtitle = "今日日期：${seed.dateKey} · 連續參與 ${uiState.progress.dailyStreak} 天",
        onClose = { vm.closeOverlay() }
    ) {
        if (rule != null) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(palette.bgCard)
                    .border(1.dp, palette.accent.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                    .padding(14.dp)
            ) {
                Column {
                    Text("${rule.dayName}守則 · ${rule.name}", color = palette.accent, style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(4.dp))
                    Text(rule.desc, color = palette.textPrimary, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
        if (meta != null) {
            Text("今日指定門扉：${meta.index} · ${meta.name}", style = MaterialTheme.typography.titleMedium, color = palette.textPrimary)
            Text("完成獎勵：額外 +${seed.bonusShards} 記憶碎片", style = MaterialTheme.typography.bodyMedium, color = palette.safeGreen)
            Button(
                onClick = { vm.startDungeonById(meta.id, dailyChallenge = true) },
                modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp).testTag("start_daily_challenge_btn")
            ) {
                Text(if (doneToday) "再次挑戰今日試煉" else "開啟今日試煉")
            }
        }
    }
}

@Composable
fun TrialContractsModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val totalHeat = uiState.systems.v64Contracts.filter { it.id in uiState.progress.activeContracts }.sumOf { it.heat }
    GateModalContainer(
        title = "受 虐 與 試 煉 契 約",
        subtitle = "當前熱度：$totalHeat · 累積榮譽冠冕 ${uiState.progress.trialCrowns}",
        onClose = { vm.closeOverlay() }
    ) {
        uiState.systems.v64Contracts.forEach { c ->
            val active = c.id in uiState.progress.activeContracts
            Surface(
                onClick = { vm.toggleContract(c.id) },
                color = if (active) palette.danger.copy(alpha = 0.14f) else palette.bgCard,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, if (active) palette.danger else palette.borderSubtle, RoundedCornerShape(10.dp))
            ) {
                Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("${c.name}（熱度 +${c.heat}）", color = if (active) palette.danger else palette.textPrimary, style = MaterialTheme.typography.titleMedium)
                        Text(c.desc, color = palette.textSecondary, style = MaterialTheme.typography.bodyMedium)
                    }
                    Text(if (active) "已簽訂" else "簽訂", color = if (active) palette.danger else palette.accent)
                }
            }
        }
    }
}

@Composable
fun ChronoRewindModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val fmt = remember { SimpleDateFormat("HH:mm:ss", Locale.getDefault()) }
    GateModalContainer(
        title = "時 光 回 溯 與 錨 點",
        subtitle = "自動紀錄最近 25 個抉擇節點，可隨時回檔重試",
        onClose = { vm.closeOverlay() }
    ) {
        Text("永久跨界時光錨點 (3 槽)：", style = MaterialTheme.typography.labelLarge, color = palette.accent)
        for (i in 0 until 3) {
            val anchor = uiState.chronoAnchors.getOrNull(i)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(palette.bgCard)
                    .padding(10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("錨點 #${i + 1}", style = MaterialTheme.typography.titleMedium, color = palette.textPrimary)
                    Text(
                        if (anchor != null) "門 ${anchor.dungeonId} · ${anchor.roomName}" else "尚未寫入",
                        style = MaterialTheme.typography.labelSmall,
                        color = palette.textSecondary
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    OutlinedButton(onClick = { vm.saveChronoAnchor(i) }, modifier = Modifier.heightIn(min = 48.dp)) { Text("覆寫") }
                    if (anchor != null) {
                        Button(onClick = { vm.loadChronoAnchor(anchor) }, modifier = Modifier.heightIn(min = 48.dp)) { Text("躍遷") }
                    }
                }
            }
        }

        Spacer(Modifier.height(6.dp))
        Text("最近選擇節點 (${uiState.chronoStack.size}/25)：", style = MaterialTheme.typography.labelLarge, color = palette.accent)
        if (uiState.chronoStack.isEmpty()) {
            Text("尚無可回溯的節點，請先進行至少一次抉擇。", color = palette.textMuted)
        } else {
            uiState.chronoStack.asReversed().forEachIndexed { revIdx, snap ->
                val actualIdx = uiState.chronoStack.lastIndex - revIdx
                Surface(
                    onClick = { vm.rewindToChronoIndex(actualIdx) },
                    color = palette.bgCard,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("${snap.roomName} (${snap.sceneId})", color = palette.textPrimary)
                        Text(fmt.format(Date(snap.timestamp)), color = palette.accent, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }
    }
}

@Composable
fun GmConsoleModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    var sceneInput by remember { mutableStateOf("") }
    GateModalContainer(
        title = "開 發 者 控 制 台 (GM)",
        subtitle = "用於快速驗證 14 扇門扉與全系統數值",
        onClose = { vm.closeOverlay() }
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            Button(
                onClick = { vm.unlockAllDoorsGm() },
                modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("gm_unlock_all_btn")
            ) {
                Text("解鎖全部 14 門扉")
            }
            Button(
                onClick = { vm.grantShardsGm(500) },
                modifier = Modifier.weight(1f).heightIn(min = 48.dp)
            ) {
                Text("+500 記憶碎片")
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            OutlinedButton(onClick = { vm.heal(100); vm.showToast("HP 已回滿") }, modifier = Modifier.weight(1f).heightIn(min = 48.dp)) {
                Text("回復體力")
            }
            OutlinedButton(onClick = { vm.openMiniGame("mg_d1", false) }, modifier = Modifier.weight(1f).heightIn(min = 48.dp)) {
                Text("測試小遊戲")
            }
        }
        OutlinedTextField(
            value = sceneInput,
            onValueChange = { sceneInput = it },
            label = { Text("輸入目標 sceneId 直接跳轉") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        Button(
            onClick = { vm.gmJumpToScene(sceneInput.trim()) },
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
        ) {
            Text("跳轉場景")
        }
    }
}
