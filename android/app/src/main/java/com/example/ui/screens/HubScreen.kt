package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Book
import androidx.compose.material.icons.rounded.CalendarToday
import androidx.compose.material.icons.rounded.CloudSync
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.PhotoLibrary
import androidx.compose.material.icons.rounded.ShoppingBag
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.engine.GameUiState
import com.example.engine.GameViewModel
import com.example.engine.HubCorridorTier
import com.example.model.UiOverlay
import com.example.ui.theme.LocalGatePalette

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun HubScreen(
    uiState: GameUiState,
    vm: GameViewModel,
    modifier: Modifier = Modifier
) {
    val palette = LocalGatePalette.current
    BackHandler { vm.backToTitle() }

    val doors = uiState.activeCorridorDoors
    val selected = doors.firstOrNull { it.id == uiState.hubSelectedDungeonId } ?: doors.firstOrNull()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(palette.bgDeep)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            TextButton(
                onClick = { vm.backToTitle() },
                modifier = Modifier.heightIn(min = 48.dp).testTag("hub_back_btn")
            ) {
                Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "返回標題頁", tint = palette.textSecondary)
                Spacer(Modifier.size(4.dp))
                Text("返回", color = palette.textSecondary)
            }

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    "進度 ${uiState.progress.clearedDungeons.size}/14",
                    style = MaterialTheme.typography.labelSmall,
                    color = palette.textSecondary
                )
                Text(
                    "成就 ${uiState.progress.unlockedAchievements.size}/${uiState.allAchievementsCount}",
                    style = MaterialTheme.typography.labelSmall,
                    color = palette.accent
                )
                IconButton(
                    onClick = { vm.openOverlay(UiOverlay.CloudSync) },
                    modifier = Modifier.testTag("hub_cloud_sync_btn")
                ) {
                    Icon(Icons.Rounded.CloudSync, contentDescription = "開啟 Google 雲端同步", tint = palette.accent)
                }
                IconButton(
                    onClick = { vm.openOverlay(UiOverlay.Gallery) },
                    modifier = Modifier.testTag("hub_gallery_btn")
                ) {
                    Icon(Icons.Rounded.PhotoLibrary, contentDescription = "打開畫廊", tint = palette.accent)
                }
            }
        }

        // Corridor Tier Switcher
        Row(
            modifier = Modifier.padding(vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            FilterChip(
                selected = uiState.hubTier == HubCorridorTier.MAIN,
                onClick = { vm.switchHubTier(HubCorridorTier.MAIN) },
                label = { Text("主迴廊 · 1–6 扇門") },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = palette.accent.copy(alpha = 0.22f),
                    selectedLabelColor = palette.accent
                ),
                modifier = Modifier.heightIn(min = 48.dp).testTag("tier_main_chip")
            )
            FilterChip(
                selected = uiState.hubTier == HubCorridorTier.SIDE,
                onClick = { vm.switchHubTier(HubCorridorTier.SIDE) },
                label = { Text("裡迴廊 · 7–14 扇門") },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = palette.accent.copy(alpha = 0.22f),
                    selectedLabelColor = palette.accent
                ),
                modifier = Modifier.heightIn(min = 48.dp).testTag("tier_side_chip")
            )
        }

        // Main Dungeon Stage
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .verticalScroll(rememberScrollState()),
            contentAlignment = Alignment.Center
        ) {
            if (selected != null) {
                val unlocked = uiState.isDungeonUnlocked(selected.id)
                val cleared = selected.id in uiState.progress.clearedDungeons
                val endingsFound = uiState.progress.endingsLog.count { it.startsWith("${selected.id}|") }

                Box(
                    modifier = Modifier
                        .widthIn(max = 520.dp)
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(18.dp))
                        .background(palette.bgSurface)
                        .border(1.dp, palette.accent.copy(alpha = if (unlocked) 0.55f else 0.22f), RoundedCornerShape(18.dp))
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    // Watermark numeral
                    Text(
                        text = if (unlocked) selected.bgNum else "??",
                        style = MaterialTheme.typography.displaySmall.copy(
                            fontSize = 112.sp,
                            fontWeight = FontWeight.Bold
                        ),
                        color = palette.accent.copy(alpha = 0.08f)
                    )

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = selected.index,
                            style = MaterialTheme.typography.labelLarge.copy(letterSpacing = 4.sp),
                            color = palette.accent
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = if (unlocked) selected.name else "？？？",
                            style = MaterialTheme.typography.headlineMedium.copy(fontSize = 26.sp, fontWeight = FontWeight.Bold),
                            color = palette.textPrimary,
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = if (unlocked) selected.tagline else "通關前序門扉後揭示此門真實名稱",
                            style = MaterialTheme.typography.bodyMedium,
                            color = palette.textSecondary,
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(16.dp))
                        HorizontalDivider(color = palette.borderSubtle)
                        Spacer(Modifier.height(14.dp))

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            if (!unlocked) {
                                Icon(Icons.Rounded.Lock, contentDescription = "未解鎖狀態", tint = palette.danger, modifier = Modifier.size(16.dp))
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(9.dp)
                                        .clip(CircleShape)
                                        .background(if (cleared) palette.safeGreen else palette.accent)
                                )
                            }
                            Text(
                                text = when {
                                    !unlocked -> "尚未解鎖"
                                    cleared -> "已通關"
                                    else -> "待探索"
                                },
                                style = MaterialTheme.typography.labelLarge,
                                color = if (!unlocked) palette.danger else if (cleared) palette.safeGreen else palette.accent
                            )
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = "已發現結局 $endingsFound / ${selected.endingsTotal}",
                            style = MaterialTheme.typography.labelSmall,
                            color = palette.textSecondary
                        )

                        Spacer(Modifier.height(20.dp))
                        Button(
                            onClick = { vm.enterDungeonFromHub() },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (unlocked) palette.accent else palette.bgCard,
                                contentColor = if (unlocked) Color(0xFF141008) else palette.textMuted
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 50.dp)
                                .testTag("hub_enter_door_btn")
                        ) {
                            Text(if (unlocked) "推 門 進 入" else "查 看 解 鎖 條 件")
                        }
                        Spacer(Modifier.height(8.dp))
                        OutlinedButton(
                            onClick = { vm.showPreview(selected) },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 48.dp)
                                .testTag("hub_preview_btn")
                        ) {
                            Text("查 看 簡 介", color = palette.textPrimary)
                        }
                    }
                }
            }
        }

        // Prev / Dots / Next Switcher
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            IconButton(
                onClick = { vm.stepHubDungeon(-1) },
                modifier = Modifier.testTag("hub_prev_door_btn")
            ) {
                Icon(Icons.AutoMirrored.Rounded.KeyboardArrowLeft, contentDescription = "上一扇門", tint = palette.accent)
            }

            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.padding(horizontal = 8.dp)
            ) {
                doors.forEach { d ->
                    val isCurr = d.id == uiState.hubSelectedDungeonId
                    val isCleared = d.id in uiState.progress.clearedDungeons
                    Surface(
                        onClick = { vm.selectHubDungeon(d.id) },
                        shape = CircleShape,
                        color = when {
                            isCurr -> palette.accent
                            isCleared -> palette.safeGreen.copy(alpha = 0.65f)
                            else -> palette.bgCard
                        },
                        modifier = Modifier
                            .size(28.dp)
                            .testTag("hub_dot_${d.id}")
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = d.id.toString(),
                                style = MaterialTheme.typography.labelSmall,
                                color = if (isCurr) Color(0xFF141008) else palette.textSecondary
                            )
                        }
                    }
                }
            }

            IconButton(
                onClick = { vm.stepHubDungeon(1) },
                modifier = Modifier.testTag("hub_next_door_btn")
            ) {
                Icon(Icons.AutoMirrored.Rounded.KeyboardArrowRight, contentDescription = "下一扇門", tint = palette.accent)
            }
        }

        // Bottom quick toolbar
        FlowRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            HubQuickAction("聖殿", Icons.Rounded.AutoAwesome, "hub_sanctum_btn") { vm.openOverlay(UiOverlay.Sanctum()) }
            HubQuickAction("手札", Icons.Rounded.Book, "hub_notebook_btn") { vm.openOverlay(UiOverlay.Notebook()) }
            HubQuickAction("商店", Icons.Rounded.ShoppingBag, "hub_shop_btn") { vm.openOverlay(UiOverlay.Shop) }
            HubQuickAction("試煉", Icons.Rounded.CalendarToday, "hub_daily_btn") { vm.openOverlay(UiOverlay.DailyChallenge) }
        }
    }
}

@Composable
private fun HubQuickAction(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    tag: String,
    onClick: () -> Unit
) {
    val palette = LocalGatePalette.current
    OutlinedButton(
        onClick = onClick,
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
            .heightIn(min = 48.dp)
            .testTag(tag)
    ) {
        Icon(icon, contentDescription = "${label}按鈕", tint = palette.accent, modifier = Modifier.size(16.dp))
        Spacer(Modifier.size(4.dp))
        Text(label, color = palette.textPrimary)
    }
}
