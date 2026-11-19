package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoStories
import androidx.compose.material.icons.rounded.Backpack
import androidx.compose.material.icons.rounded.ChatBubbleOutline
import androidx.compose.material.icons.rounded.KeyboardArrowDown
import androidx.compose.material.icons.rounded.KeyboardArrowUp
import androidx.compose.material.icons.rounded.Map
import androidx.compose.material.icons.rounded.Menu
import androidx.compose.material.icons.rounded.MoreHoriz
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.engine.GameUiState
import com.example.engine.GameViewModel
import com.example.model.RenderedChoice
import com.example.model.UiOverlay
import com.example.ui.components.AmbientParticleLayer
import com.example.ui.components.NarrativeFeed
import com.example.ui.theme.LocalGatePalette

@Composable
fun GameScreen(
    uiState: GameUiState,
    vm: GameViewModel,
    modifier: Modifier = Modifier
) {
    val palette = LocalGatePalette.current
    BackHandler { vm.openOverlay(UiOverlay.PauseMenu) }

    val scrollState = rememberScrollState()
    LaunchedEffect(uiState.gameState.currentScene) {
        scrollState.scrollTo(0)
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(palette.bgDeep)
    ) {
        AmbientParticleLayer(
            moodKey = uiState.moodKey,
            reducedMotion = uiState.settings.reducedMotion
        )

        Column(modifier = Modifier.fillMaxSize()) {
            GameTopHud(uiState = uiState, vm = vm)

            BoxWithConstraints(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                val isWide = maxWidth >= 820.dp
                if (isWide) {
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(20.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .weight(1.25f)
                                .fillMaxHeight()
                                .verticalScroll(scrollState)
                                .clickable(enabled = !uiState.typingDone) { vm.skipTypewriter() }
                        ) {
                            SceneHeaderBlock(uiState)
                            Spacer(Modifier.height(12.dp))
                            NarrativeFeed(uiState.paragraphs, uiState.typedCharLimit)
                            Spacer(Modifier.height(24.dp))
                        }

                        Column(
                            modifier = Modifier
                                .weight(0.9f)
                                .fillMaxHeight()
                                .verticalScroll(rememberScrollState()),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                text = if (uiState.typingDone) "做出選擇" else "點擊正文可跳過打字動畫",
                                style = MaterialTheme.typography.labelLarge,
                                color = palette.accent
                            )
                            ChoicesList(uiState.choices, uiState.typingDone, vm)
                        }
                    }
                } else {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(scrollState)
                            .clickable(enabled = !uiState.typingDone) { vm.skipTypewriter() }
                            .padding(horizontal = 18.dp, vertical = 12.dp)
                    ) {
                        SceneHeaderBlock(uiState)
                        Spacer(Modifier.height(14.dp))
                        NarrativeFeed(uiState.paragraphs, uiState.typedCharLimit)
                        Spacer(Modifier.height(22.dp))
                        HorizontalDivider(color = palette.borderSubtle)
                        Spacer(Modifier.height(14.dp))
                        ChoicesList(uiState.choices, uiState.typingDone, vm)
                        Spacer(Modifier.height(24.dp))
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun GameTopHud(
    uiState: GameUiState,
    vm: GameViewModel
) {
    val palette = LocalGatePalette.current
    var showMoreMenu by remember { mutableStateOf(false) }
    val gs = uiState.gameState

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(palette.bgSurface.copy(alpha = 0.94f))
            .border(width = 1.dp, color = palette.borderSubtle)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "${uiState.selectedDungeonMeta?.name ?: ""} · ${gs.currentScene}",
                    style = MaterialTheme.typography.labelSmall,
                    color = palette.textSecondary
                )
                gs.countdown?.let { sec ->
                    val min = sec / 60
                    val rem = sec % 60
                    Text(
                        text = "%02d:%02d".format(min, rem),
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = if (sec <= 300) palette.danger else palette.accent
                    )
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = { vm.openDialogPanel() },
                    modifier = Modifier.testTag("hud_dialog_btn")
                ) {
                    Icon(Icons.Rounded.ChatBubbleOutline, contentDescription = "人物對話", tint = palette.textPrimary)
                }
                IconButton(
                    onClick = { vm.openOverlay(UiOverlay.Inventory) },
                    modifier = Modifier.testTag("hud_inventory_btn")
                ) {
                    Icon(Icons.Rounded.Backpack, contentDescription = "物品欄", tint = palette.textPrimary)
                }
                IconButton(
                    onClick = { vm.openOverlay(UiOverlay.Memoir) },
                    modifier = Modifier.testTag("hud_memoir_btn")
                ) {
                    Icon(Icons.Rounded.AutoStories, contentDescription = "回憶錄", tint = palette.textPrimary)
                }
                IconButton(
                    onClick = { vm.openOverlay(UiOverlay.Map) },
                    modifier = Modifier.testTag("hud_map_btn")
                ) {
                    Icon(Icons.Rounded.Map, contentDescription = "地圖", tint = palette.textPrimary)
                }

                Box {
                    IconButton(
                        onClick = { showMoreMenu = true },
                        modifier = Modifier.testTag("hud_more_btn")
                    ) {
                        Icon(Icons.Rounded.MoreHoriz, contentDescription = "更多功能", tint = palette.accent)
                    }
                    DropdownMenu(
                        expanded = showMoreMenu,
                        onDismissRequest = { showMoreMenu = false }
                    ) {
                        DropdownMenuItem(text = { Text("推理雷達") }, onClick = { showMoreMenu = false; vm.openOverlay(UiOverlay.DeductionRadar) })
                        DropdownMenuItem(text = { Text("時光回溯") }, onClick = { showMoreMenu = false; vm.openOverlay(UiOverlay.ChronoRewind) })
                        DropdownMenuItem(text = { Text("記憶調合") }, onClick = { showMoreMenu = false; vm.openOverlay(UiOverlay.Alchemy) })
                        DropdownMenuItem(text = { Text("環境凝視") }, onClick = { showMoreMenu = false; vm.openOverlay(UiOverlay.EnvGaze) })
                        DropdownMenuItem(text = { Text("門扉謎語") }, onClick = { showMoreMenu = false; vm.openOverlay(UiOverlay.GateRiddle) })
                        DropdownMenuItem(text = { Text("門扉異變") }, onClick = { showMoreMenu = false; vm.openOverlay(UiOverlay.GateAnomaly) })
                        DropdownMenuItem(text = { Text("迴廊聖殿") }, onClick = { showMoreMenu = false; vm.openOverlay(UiOverlay.Sanctum()) })
                        DropdownMenuItem(text = { Text("分岐樹狀圖") }, onClick = { showMoreMenu = false; vm.openOverlay(UiOverlay.BranchTree) })
                        DropdownMenuItem(text = { Text("探索歷史") }, onClick = { showMoreMenu = false; vm.openOverlay(UiOverlay.History) })
                        DropdownMenuItem(text = { Text("成就一覽") }, onClick = { showMoreMenu = false; vm.openOverlay(UiOverlay.Achievements) })
                        DropdownMenuItem(text = { Text("存檔") }, onClick = { showMoreMenu = false; vm.openOverlay(UiOverlay.SaveLoad(true)) })
                        DropdownMenuItem(text = { Text("讀檔") }, onClick = { showMoreMenu = false; vm.openOverlay(UiOverlay.SaveLoad(false)) })
                        DropdownMenuItem(text = { Text("遊戲設置") }, onClick = { showMoreMenu = false; vm.openOverlay(UiOverlay.Settings) })
                    }
                }

                IconButton(
                    onClick = { vm.openOverlay(UiOverlay.PauseMenu) },
                    modifier = Modifier.testTag("hud_pause_btn")
                ) {
                    Icon(Icons.Rounded.Menu, contentDescription = "暫停選單", tint = palette.textPrimary)
                }
            }
        }

        AnimatedVisibility(visible = !uiState.topBarCollapsed) {
            Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)) {
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    HudMetric("生命", "${gs.hp}/${gs.maxHp}", if (gs.hp <= 30) palette.danger else palette.safeGreen)
                    if (gs.shield > 0) HudMetric("護盾", "${gs.shield}", palette.ghostBlue)
                    HudMetric("物品", "${gs.inventory.size}", palette.accent)
                    if (uiState.selectedDungeonMeta?.hasParty == true) {
                        HudMetric("同伴", "${gs.party}", palette.textPrimary)
                    }
                    if (gs.stress > 0) {
                        HudMetric("壓力", "${gs.stress}%", if (gs.stress >= 75) palette.danger else palette.accent)
                    }
                    if (gs.dungeonId == 5) HudMetric("潮位", gs.tide, palette.ghostBlue)
                    if (gs.dungeonId == 7) HudMetric("鏡像", "${gs.mirrorHp}", palette.ghostBlue)
                    if (gs.dungeonId == 8) HudMetric("飽食", "${gs.satiety}%", if (gs.satiety >= 85) palette.danger else palette.accent)
                    if (gs.dungeonId == 10) HudMetric("影評", "${gs.criticScore}", palette.accent)
                    if (gs.dungeonId == 11) HudMetric("人性", "${gs.humanity}%", palette.safeGreen)
                }
                Spacer(Modifier.height(6.dp))
                val readInDoor = uiState.progress.readScenesByDungeon[gs.dungeonId]?.size ?: gs.visitedScenes.size
                val estTotal = when (gs.dungeonId) {
                    1 -> 44; 2 -> 42; 3 -> 41; 4 -> 37; 5 -> 38; 6 -> 40; else -> 24
                }
                val pct = (readInDoor.toFloat() / estTotal.toFloat()).coerceIn(0f, 1f)
                LinearProgressIndicator(
                    progress = { pct },
                    color = palette.accent,
                    trackColor = palette.bgCard,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(3.dp)
                )
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { vm.toggleTopBarCollapsed() }
                .padding(vertical = 2.dp),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (uiState.topBarCollapsed) Icons.Rounded.KeyboardArrowDown else Icons.Rounded.KeyboardArrowUp,
                contentDescription = "切換狀態欄收合",
                tint = palette.textMuted,
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

@Composable
private fun HudMetric(label: String, value: String, valueColor: androidx.compose.ui.graphics.Color) {
    val palette = LocalGatePalette.current
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = palette.textMuted)
        Text(value, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = valueColor)
    }
}

@Composable
private fun SceneHeaderBlock(uiState: GameUiState) {
    val palette = LocalGatePalette.current
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = uiState.roomDisplayNum,
            style = MaterialTheme.typography.labelLarge,
            color = palette.accent
        )
        Text(
            text = uiState.roomDisplayName,
            style = MaterialTheme.typography.headlineMedium,
            color = palette.textPrimary
        )
    }
}

@Composable
private fun ChoicesList(
    choices: List<RenderedChoice>,
    typingDone: Boolean,
    vm: GameViewModel
) {
    val palette = LocalGatePalette.current
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        choices.forEach { choice ->
            val borderColor = when {
                choice.danger -> palette.danger.copy(alpha = 0.65f)
                choice.isCausalKey -> palette.accent.copy(alpha = 0.6f)
                choice.isVisited -> palette.borderSubtle.copy(alpha = 0.5f)
                else -> palette.borderSubtle
            }
            val bgColor = when {
                choice.danger -> palette.danger.copy(alpha = 0.08f)
                choice.isVisited -> palette.bgSurface.copy(alpha = 0.7f)
                else -> palette.bgCard
            }

            Surface(
                onClick = { vm.onChoiceClicked(choice) },
                color = bgColor,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 50.dp)
                    .border(1.dp, borderColor, RoundedCornerShape(10.dp))
                    .testTag("choice_${choice.index}")
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = choice.text,
                        style = MaterialTheme.typography.bodyLarge.copy(
                            color = if (choice.danger) palette.danger else if (choice.isVisited) palette.textSecondary else palette.textPrimary
                        ),
                        modifier = Modifier.weight(1f)
                    )
                    if (choice.isVisited) {
                        Text(
                            text = "已閱",
                            style = MaterialTheme.typography.labelSmall,
                            color = palette.textMuted,
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    } else if (!typingDone) {
                        Text(
                            text = "快速",
                            style = MaterialTheme.typography.labelSmall,
                            color = palette.accent,
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    }
                }
            }
        }
    }
}
