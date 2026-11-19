package com.example.ui.modals

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.R
import com.example.behaviors.MetaSystemsBehavior
import com.example.engine.GameUiState
import com.example.engine.GameViewModel
import com.example.ui.theme.LocalGatePalette

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun GalleryModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("結局收錄", "藝術 CG", "點唱機", "三百人生")

    GateModalContainer(
        title = "回 廊 畫 廊",
        subtitle = "已收錄結局 ${uiState.progress.endingsLog.size} 條 · 自助餐物語 ${uiState.progress.buffetStoriesSeen.size}/300",
        onClose = { vm.closeOverlay() }
    ) {
        TabRow(selectedTabIndex = selectedTab, containerColor = palette.bgCard) {
            tabs.forEachIndexed { idx, label ->
                Tab(
                    selected = selectedTab == idx,
                    onClick = { selectedTab = idx },
                    text = { Text(label, maxLines = 1) }
                )
            }
        }
        Spacer(Modifier.height(6.dp))

        when (selectedTab) {
            0 -> {
                if (uiState.progress.endingsLog.isEmpty()) {
                    Text("尚未解鎖任何結局，推門展開你的第一次探索吧。", color = palette.textMuted)
                } else {
                    uiState.dungeons.forEach { d ->
                        val logs = uiState.progress.endingsLog.filter { it.startsWith("${d.id}|") }
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(palette.bgCard)
                                .border(1.dp, palette.borderSubtle, RoundedCornerShape(10.dp))
                                .padding(12.dp)
                        ) {
                            Text("${d.index} · ${d.name} (${logs.size}/${d.endingsTotal})", style = MaterialTheme.typography.titleMedium, color = palette.accent)
                            if (logs.isEmpty()) {
                                Text("尚未收錄結局", style = MaterialTheme.typography.labelSmall, color = palette.textMuted)
                            } else {
                                logs.forEach { entry ->
                                    val parts = entry.split("|")
                                    val title = parts.getOrNull(2) ?: entry
                                    Text("• $title", style = MaterialTheme.typography.bodyMedium, color = palette.textPrimary)
                                }
                            }
                        }
                    }
                }
            }
            1 -> {
                listOf(
                    Triple(R.drawable.img_corridor_hero, "無盡迴廊深處", "黑色鏡面長廊盡頭的微光"),
                    Triple(R.drawable.img_gate_hotel, "13 號質數旅館", "只為質數房間亮起的玄關暖燈"),
                    Triple(R.drawable.img_dawn_observatory, "天台晨星破曉", "穿過 03:18 迷霧後的第一縷朝陽")
                ).forEach { (resId, title, desc) ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(palette.bgCard)
                            .border(1.dp, palette.borderSubtle, RoundedCornerShape(12.dp))
                    ) {
                        Image(
                            painter = painterResource(resId),
                            contentDescription = title,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxWidth().height(150.dp)
                        )
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(title, style = MaterialTheme.typography.titleMedium, color = palette.accent)
                            Text(desc, style = MaterialTheme.typography.bodyMedium, color = palette.textSecondary)
                        }
                    }
                }
            }
            2 -> {
                Text("選擇常駐迴廊環境合成曲目：", style = MaterialTheme.typography.labelLarge, color = palette.textSecondary)
                uiState.systems.audioThemes.entries.forEach { (key, theme) ->
                    val isPlaying = uiState.settings.jukeboxTheme == key
                    Surface(
                        onClick = {
                            vm.updateSettings { it.copy(jukeboxTheme = if (isPlaying) null else key, soundEnabled = true) }
                            vm.showToast(if (isPlaying) "已切回門扉自適應配樂" else "正在播放：${theme.name}")
                        },
                        color = if (isPlaying) palette.accent.copy(alpha = 0.16f) else palette.bgCard,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, if (isPlaying) palette.accent else palette.borderSubtle, RoundedCornerShape(10.dp))
                    ) {
                        Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(theme.name, style = MaterialTheme.typography.titleMedium, color = palette.textPrimary)
                                if (theme.sub.isNotBlank()) {
                                    Text(theme.sub, style = MaterialTheme.typography.labelSmall, color = palette.textSecondary)
                                }
                            }
                            Text(if (isPlaying) "播放中" else "試聽", color = palette.accent)
                        }
                    }
                }
            }
            else -> {
                Text("已品嚐 ${uiState.progress.buffetStoriesSeen.size} / 300 道自助餐人生故事：", style = MaterialTheme.typography.labelLarge, color = palette.accent)
                val seen = uiState.progress.buffetStoriesSeen.sorted().take(30)
                if (seen.isEmpty()) {
                    Text("在第八扇門《午夜自助餐》甜點區翻閱故事菜單即可陸續解鎖。", color = palette.textMuted)
                } else {
                    seen.forEach { id ->
                        val st = MetaSystemsBehavior.getBuffetStoryById(id, uiState.systems)
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(palette.bgCard)
                                .padding(10.dp)
                        ) {
                            Text("#${st.id} · ${st.title}", color = palette.accent, style = MaterialTheme.typography.labelLarge)
                            Text(st.story, color = palette.textPrimary, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun NotebookModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("記憶拼圖", "星圖人物", "羈絆網絡", "碎片遺物", "成就稱號", "隨手筆記")

    GateModalContainer(
        title = "探 索 手 札",
        subtitle = "成就 ${uiState.progress.unlockedAchievements.size}/${uiState.allAchievementsCount} · 稱號 ${uiState.unlockedTitlesCount}/${uiState.systems.titles.size}",
        onClose = { vm.closeOverlay() }
    ) {
        TabRow(selectedTabIndex = selectedTab, containerColor = palette.bgCard) {
            tabs.forEachIndexed { idx, label ->
                Tab(
                    selected = selectedTab == idx,
                    onClick = { selectedTab = idx },
                    text = { Text(label, maxLines = 1) }
                )
            }
        }
        Spacer(Modifier.height(6.dp))

        when (selectedTab) {
            0 -> {
                Text(
                    text = if (uiState.progress.jigsawSolved) "3x3 記憶拼圖已重構完畢！" else "點擊兩塊拼圖互換位置，將 1–9 按順序拼合（首通獎勵 +50 碎片）：",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (uiState.progress.jigsawSolved) palette.safeGreen else palette.textSecondary
                )
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    for (r in 0 until 3) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                            for (c in 0 until 3) {
                                val idx = r * 3 + c
                                val valTile = uiState.jigsawTiles.getOrElse(idx) { idx }
                                val isSel = uiState.jigsawSelectedIdx == idx
                                val isCorrect = valTile == idx
                                Surface(
                                    onClick = { vm.clickJigsawTile(idx) },
                                    color = when {
                                        isSel -> palette.accent.copy(alpha = 0.25f)
                                        isCorrect -> palette.safeGreen.copy(alpha = 0.16f)
                                        else -> palette.bgCard
                                    },
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .aspectRatio(1f)
                                        .border(1.dp, if (isSel) palette.accent else palette.borderSubtle, RoundedCornerShape(10.dp))
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text("${valTile + 1}", style = MaterialTheme.typography.headlineMedium, color = palette.textPrimary)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            1 -> {
                val nodes = uiState.systems.constellationNodes
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(palette.bgCard)
                        .border(1.dp, palette.borderSubtle, RoundedCornerShape(12.dp))
                ) {
                    val map = nodes.associate { it.id to Offset((it.x / 100f) * size.width, (it.y / 100f) * size.height) }
                    MetaSystemsBehavior.REL_EDGES.forEach { e ->
                        val a = map[e.from]; val b = map[e.to]
                        if (a != null && b != null) {
                            drawLine(palette.accent.copy(alpha = 0.35f), a, b, strokeWidth = 2f)
                        }
                    }
                    nodes.forEach { n ->
                        val pt = map[n.id] ?: return@forEach
                        val met = n.id in uiState.progress.metNpcs || n.id == "luyan"
                        drawCircle(if (met) palette.accent else palette.textMuted, radius = 9f, center = pt)
                    }
                }
                nodes.forEach { n ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(palette.bgCard)
                            .padding(10.dp)
                    ) {
                        Text("${n.name} · ${n.role}", color = palette.accent, style = MaterialTheme.typography.titleMedium)
                        Text(n.desc, color = palette.textSecondary, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
            2 -> {
                val nameMap = uiState.systems.constellationNodes.associate { it.id to it.name }
                MetaSystemsBehavior.REL_EDGES.forEach { edge ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(palette.bgCard)
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("${nameMap[edge.from] ?: edge.from} ↔ ${nameMap[edge.to] ?: edge.to}", color = palette.textPrimary)
                        Text(edge.label, color = palette.accent, style = MaterialTheme.typography.labelLarge)
                    }
                }
            }
            3 -> {
                Text("記憶碎片 (${uiState.progress.foundFragments.size}/${uiState.systems.v4Fragments.size})", color = palette.accent, style = MaterialTheme.typography.titleMedium)
                uiState.systems.v4Fragments.forEach { (id, f) ->
                    val found = id in uiState.progress.foundFragments
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(palette.bgCard)
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(if (found) f.name else "第${f.d}扇門 · 未尋獲碎片", color = if (found) palette.textPrimary else palette.textMuted)
                            Text(f.hint, style = MaterialTheme.typography.labelSmall, color = palette.textSecondary)
                        }
                        Text(if (found) "已收集" else "缺失", color = if (found) palette.safeGreen else palette.textMuted)
                    }
                }
                Spacer(Modifier.height(6.dp))
                Text("核心遺物 (${uiState.progress.foundRelicsV5.size}/${uiState.systems.v5Relics.size})", color = palette.ghostBlue, style = MaterialTheme.typography.titleMedium)
                uiState.systems.v5Relics.forEach { (id, r) ->
                    val found = id in uiState.progress.foundRelicsV5
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(palette.bgCard)
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(r.name, color = if (found) palette.textPrimary else palette.textMuted)
                            Text(r.desc, style = MaterialTheme.typography.labelSmall, color = palette.textSecondary)
                        }
                        Text(if (found) "已持有" else "未取得", color = if (found) palette.ghostBlue else palette.textMuted)
                    }
                }
            }
            4 -> {
                Text("稱號收集 (${uiState.unlockedTitlesCount}/${uiState.systems.titles.size})", color = palette.accent, style = MaterialTheme.typography.titleMedium)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    uiState.systems.titles.forEach { t ->
                        val unlocked = MetaSystemsBehavior.evaluateTitleUnlocked(t.id, uiState.progress, uiState.settings)
                        FilterChip(
                            selected = unlocked,
                            onClick = { vm.showToast("${t.name}：${t.desc}") },
                            label = { Text(if (unlocked) t.name else "？？？") }
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
                Text("里程碑成就 (${uiState.progress.unlockedAchievements.size}/${uiState.allAchievementsCount})", color = palette.accent, style = MaterialTheme.typography.titleMedium)
                uiState.dungeons.flatMap { it.achDefs }.take(60).forEach { a ->
                    val unlocked = a.id in uiState.progress.unlockedAchievements
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(palette.bgCard)
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(if (unlocked || !a.hidden) a.name else "隱藏成就", color = if (unlocked) palette.accent else palette.textMuted)
                            Text(if (unlocked || !a.hidden) a.desc else "達成特定隱藏路徑後解鎖", style = MaterialTheme.typography.labelSmall, color = palette.textSecondary)
                        }
                        Text(if (unlocked) "已解鎖" else "未解鎖", color = if (unlocked) palette.safeGreen else palette.textMuted)
                    }
                }
            }
            else -> {
                var draft by remember(uiState.progress.quickNotes) { mutableStateOf(uiState.progress.quickNotes) }
                OutlinedTextField(
                    value = draft,
                    onValueChange = { draft = it },
                    label = { Text("探索備忘錄與密碼紀錄") },
                    minLines = 6,
                    modifier = Modifier.fillMaxWidth()
                )
                Button(
                    onClick = {
                        vm.updateQuickNotes(draft)
                        vm.showToast("已保存隨手筆記")
                    },
                    modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                ) {
                    Text("保存筆記")
                }
            }
        }
    }
}
