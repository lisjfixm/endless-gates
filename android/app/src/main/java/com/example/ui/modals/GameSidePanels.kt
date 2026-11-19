package com.example.ui.modals

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.PushPin
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.behaviors.MetaSystemsBehavior
import com.example.engine.GameUiState
import com.example.engine.GameViewModel
import com.example.model.InventoryItem
import com.example.model.UiOverlay
import com.example.ui.theme.LocalGatePalette

@Composable
fun GateModalContainer(
    title: String,
    subtitle: String? = null,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
    footer: (@Composable ColumnScope.() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val palette = LocalGatePalette.current
    BackHandler { onClose() }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.78f))
            .clickable(onClick = onClose)
            .padding(horizontal = 14.dp, vertical = 20.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 620.dp)
                .fillMaxWidth()
                .heightIn(max = 760.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(palette.bgSurface)
                .border(1.dp, palette.accent.copy(alpha = 0.45f), RoundedCornerShape(16.dp))
                .clickable(enabled = false) {}
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.headlineMedium,
                        color = palette.accent
                    )
                    if (!subtitle.isNullOrBlank()) {
                        Text(
                            text = subtitle,
                            style = MaterialTheme.typography.labelSmall,
                            color = palette.textSecondary
                        )
                    }
                }
                IconButton(
                    onClick = onClose,
                    modifier = Modifier.testTag("modal_close_btn")
                ) {
                    Icon(Icons.Rounded.Close, contentDescription = "關閉視窗", tint = palette.textSecondary)
                }
            }
            Spacer(Modifier.height(8.dp))
            HorizontalDivider(color = palette.borderSubtle)
            Spacer(Modifier.height(10.dp))

            Column(
                modifier = Modifier
                    .weight(1f, fill = false)
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                content = content
            )

            if (footer != null) {
                Spacer(Modifier.height(10.dp))
                HorizontalDivider(color = palette.borderSubtle)
                Spacer(Modifier.height(10.dp))
                Column(modifier = Modifier.fillMaxWidth(), content = footer)
            }
        }
    }
}

@Composable
fun InventoryModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val items = uiState.gameState.inventory
    val pinned = uiState.progress.pinnedItems
    val sorted = items.sortedByDescending { it.id in pinned }

    GateModalContainer(
        title = "物 品 欄",
        subtitle = "持有物品 ${items.size} 件" + if (uiState.combineMode) " · 組合模式：已選 ${uiState.combineSelectedIds.size}/2" else "",
        onClose = { vm.closeOverlay() },
        footer = {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = { vm.toggleCombineMode() },
                    modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("inv_combine_toggle_btn")
                ) {
                    Text(if (uiState.combineMode) "取消組合" else "物品組合")
                }
                if (uiState.combineMode) {
                    Button(
                        onClick = { vm.executeCombine() },
                        enabled = uiState.combineSelectedIds.size == 2,
                        modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("inv_combine_do_btn")
                    ) {
                        Text("確認合成")
                    }
                } else {
                    OutlinedButton(
                        onClick = { vm.openOverlay(UiOverlay.SaveLoad(true)) },
                        modifier = Modifier.weight(1f).heightIn(min = 48.dp)
                    ) {
                        Text("存檔")
                    }
                }
            }
        }
    ) {
        if (sorted.isEmpty()) {
            Text("口袋空空如也，尚無任何隨身物品。", color = palette.textMuted)
        } else {
            sorted.forEach { item ->
                val rarity = MetaSystemsBehavior.getItemRarity(item.id)
                val rarityLabel = MetaSystemsBehavior.getItemRarityLabel(rarity)
                val isSelected = item.id in uiState.combineSelectedIds
                val isPinned = item.id in pinned
                val isConsumable = MetaSystemsBehavior.isConsumable(item.id)

                val borderColor = when {
                    isSelected -> palette.accent
                    rarity == "legendary" -> palette.accent.copy(alpha = 0.7f)
                    rarity == "rare" -> palette.ghostBlue.copy(alpha = 0.6f)
                    else -> palette.borderSubtle
                }

                Surface(
                    onClick = {
                        if (uiState.combineMode) vm.toggleCombineItem(item.id) else vm.useInventoryItem(item)
                    },
                    color = if (isSelected) palette.accent.copy(alpha = 0.14f) else palette.bgCard,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, borderColor, RoundedCornerShape(10.dp))
                        .testTag("inv_item_${item.id}")
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(item.name, style = MaterialTheme.typography.titleMedium, color = palette.textPrimary)
                                Text(
                                    text = rarityLabel,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (rarity == "legendary") palette.accent else palette.ghostBlue
                                )
                            }
                            if (item.desc.isNotBlank()) {
                                Spacer(Modifier.height(2.dp))
                                Text(item.desc, style = MaterialTheme.typography.bodyMedium, color = palette.textSecondary)
                            }
                            if (item.usage.isNotBlank()) {
                                Text("用途：${item.usage}", style = MaterialTheme.typography.labelSmall, color = palette.accent)
                            }
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (isConsumable && !uiState.combineMode) {
                                Text("可使用", style = MaterialTheme.typography.labelSmall, color = palette.safeGreen)
                            }
                            IconButton(onClick = { vm.togglePinItem(item.id) }) {
                                Icon(
                                    Icons.Rounded.PushPin,
                                    contentDescription = "釘選物品",
                                    tint = if (isPinned) palette.accent else palette.textMuted,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ItemDetailModal(item: InventoryItem, uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    GateModalContainer(
        title = item.name,
        subtitle = "物品詳情",
        onClose = { vm.openOverlay(UiOverlay.Inventory) }
    ) {
        Text(item.desc.ifBlank { "一段緊握在手心的記憶物件。" }, style = MaterialTheme.typography.bodyLarge, color = palette.textPrimary)
        if (item.usage.isNotBlank()) {
            Text("效果／用途：${item.usage}", style = MaterialTheme.typography.bodyMedium, color = palette.accent)
        }
        val aliveMembers = uiState.gameState.partyMembers.filter { it.alive }
        if (item.id in setOf("painkiller", "antibiotic", "epinephrine", "bandage") && aliveMembers.isNotEmpty()) {
            Button(
                onClick = { vm.openOverlay(UiOverlay.PartyHealTarget(item)) },
                modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
            ) {
                Text("用來治療同行夥伴")
            }
        }
        OutlinedButton(
            onClick = { vm.openOverlay(UiOverlay.Inventory) },
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
        ) {
            Text("返回物品欄")
        }
    }
}

@Composable
fun PartyHealTargetModal(item: InventoryItem, uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    GateModalContainer(
        title = "選擇治療對象",
        subtitle = "使用道具：${item.name}",
        onClose = { vm.openOverlay(UiOverlay.Inventory) }
    ) {
        uiState.gameState.partyMembers.forEach { member ->
            Surface(
                onClick = { if (member.alive) vm.healPartyMemberWithItem(item, member.id) },
                enabled = member.alive,
                color = palette.bgCard,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, palette.borderSubtle, RoundedCornerShape(10.dp))
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = member.name + if (!member.alive) "（已離隊）" else "",
                        color = if (member.alive) palette.textPrimary else palette.textMuted
                    )
                    Text("HP ${member.hp}/${member.maxHp}", color = palette.safeGreen)
                }
            }
        }
    }
}

@Composable
fun MemoirModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    GateModalContainer(
        title = "回 憶 錄",
        subtitle = "已收集線索筆記 ${uiState.gameState.notes.size} 條",
        onClose = { vm.closeOverlay() }
    ) {
        if (uiState.gameState.notes.isEmpty()) {
            Text("尚無記錄的線索。探索房間與對話時會自動摘錄關鍵線索。", color = palette.textMuted)
        } else {
            uiState.gameState.notes.forEach { note ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(palette.bgCard)
                        .border(1.dp, palette.borderSubtle, RoundedCornerShape(10.dp))
                        .padding(12.dp)
                ) {
                    Text(note.title, style = MaterialTheme.typography.titleMedium, color = palette.accent)
                    Spacer(Modifier.height(4.dp))
                    Text(note.displayBody, style = MaterialTheme.typography.bodyMedium, color = palette.textPrimary)
                }
            }
        }
    }
}

@Composable
fun MapModal(uiState: GameUiState, vm: GameViewModel) {
    val palette = LocalGatePalette.current
    val zones = uiState.gameState.mapZones

    GateModalContainer(
        title = "樓 層 檢 索 地 圖",
        subtitle = "當前位置：${uiState.roomDisplayName}",
        onClose = { vm.closeOverlay() }
    ) {
        if (zones.isEmpty()) {
            Text("此門扉為線性流動空間，暫無平面區域圖，但目前已踏足 ${uiState.gameState.visitedScenes.size} 個場景。", color = palette.textSecondary)
        } else {
            // Node graph Canvas visualization
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(palette.bgCard)
                    .border(1.dp, palette.borderSubtle, RoundedCornerShape(10.dp))
            ) {
                val count = zones.size
                val stepX = size.width / (count + 1)
                val centerY = size.height / 2f
                val points = List(count) { idx ->
                    val yOffset = if (idx % 2 == 0) -24f else 24f
                    Offset(stepX * (idx + 1), centerY + yOffset)
                }
                for (i in 0 until points.lastIndex) {
                    drawLine(
                        color = palette.borderSubtle,
                        start = points[i],
                        end = points[i + 1],
                        strokeWidth = 3f
                    )
                }
                points.forEachIndexed { idx, pt ->
                    val z = zones[idx]
                    val col = when {
                        z.current -> palette.accent
                        z.explored -> palette.safeGreen
                        else -> palette.textMuted.copy(alpha = 0.4f)
                    }
                    drawCircle(color = col, radius = if (z.current) 14f else 10f, center = pt)
                }
            }

            zones.forEach { z ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (z.current) palette.accent.copy(alpha = 0.14f) else palette.bgCard)
                        .border(1.dp, if (z.current) palette.accent else palette.borderSubtle, RoundedCornerShape(10.dp))
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(if (z.current) palette.accent else if (z.explored) palette.safeGreen else palette.textMuted)
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(z.name, style = MaterialTheme.typography.titleMedium, color = palette.textPrimary)
                        if (z.summary.isNotBlank()) {
                            Text(z.summary, style = MaterialTheme.typography.bodyMedium, color = palette.textSecondary)
                        }
                    }
                    Text(
                        text = if (z.current) "當前" else if (z.explored) "已探索" else "未知",
                        style = MaterialTheme.typography.labelSmall,
                        color = if (z.current) palette.accent else palette.textMuted
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun DialogDrawerModal(
    selectedNpcId: String?,
    currentNodeId: String,
    uiState: GameUiState,
    vm: GameViewModel
) {
    val palette = LocalGatePalette.current
    val bundle = uiState.npcBundle
    val npcKeys = bundle.dialogueTrees.keys.toList()
    val activeNpcId = selectedNpcId ?: npcKeys.firstOrNull() ?: "suwan"
    val profile = bundle.npcProfiles[activeNpcId]
    val tree = bundle.dialogueTrees[activeNpcId]
    val node = tree?.nodes?.get(currentNodeId) ?: tree?.nodes?.values?.firstOrNull()
    val affinity = uiState.progress.npcAffinities[activeNpcId] ?: 0

    GateModalContainer(
        title = "伴 行 對話 · ${profile?.name ?: activeNpcId}",
        subtitle = "羈絆好感度：$affinity / 100",
        onClose = { vm.closeOverlay() }
    ) {
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            npcKeys.take(6).forEach { id ->
                val label = bundle.npcProfiles[id]?.name ?: id
                FilterChip(
                    selected = id == activeNpcId,
                    onClick = { vm.selectDialogNpc(id) },
                    label = { Text(label) }
                )
            }
        }

        LinearProgressIndicator(
            progress = { (affinity / 100f).coerceIn(0f, 1f) },
            color = palette.accent,
            trackColor = palette.bgCard,
            modifier = Modifier.fillMaxWidth().height(5.dp)
        )

        if (!profile?.desc.isNullOrBlank()) {
            Text(profile!!.desc, style = MaterialTheme.typography.bodyMedium, color = palette.textSecondary)
        }

        if (node != null) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(palette.bgCard)
                    .border(1.dp, palette.accent.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                    .padding(14.dp)
            ) {
                Text(node.reply, style = MaterialTheme.typography.bodyLarge, color = palette.textPrimary)
            }

            val visibleOpts = node.options.filter { opt ->
                MetaSystemsBehavior.evaluateDialogueCondition(
                    opt.conditionCode,
                    uiState.progress.inheritance,
                    uiState.progress.inheritance.ngPlus,
                    uiState.gameState.flags,
                    uiState.gameState.counters
                )
            }
            visibleOpts.forEach { opt ->
                OutlinedButton(
                    onClick = {
                        if (opt.next == "close" || opt.next.isBlank()) {
                            vm.closeOverlay()
                        } else {
                            vm.advanceDialogNode(activeNpcId, opt.next)
                        }
                    },
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                ) {
                    Text(opt.text, color = palette.accent)
                }
            }
        } else {
            val simple = bundle.npcDialogues[activeNpcId]
            if (simple != null) {
                simple.lines.forEach { line ->
                    Text(line, style = MaterialTheme.typography.bodyLarge, color = palette.textPrimary)
                }
            } else {
                Text("對方安靜地注視著前方的門縫，暫時無話可說。", color = palette.textMuted)
            }
        }
    }
}
