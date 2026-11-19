package com.example.ui.screens

import androidx.compose.foundation.Image
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Book
import androidx.compose.material.icons.rounded.CalendarToday
import androidx.compose.material.icons.rounded.CloudSync
import androidx.compose.material.icons.rounded.MeetingRoom
import androidx.compose.material.icons.rounded.PhotoLibrary
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.ShoppingBag
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.cloud.SyncDirection
import com.example.engine.GameUiState
import com.example.engine.GameViewModel
import com.example.model.UiOverlay
import com.example.ui.theme.LocalGatePalette

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TitleScreen(
    uiState: GameUiState,
    vm: GameViewModel,
    modifier: Modifier = Modifier
) {
    val palette = LocalGatePalette.current

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(palette.bgDeep)
    ) {
        Image(
            painter = painterResource(id = R.drawable.img_corridor_hero),
            contentDescription = "無盡之門幽暗迴廊背景插圖",
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxSize()
                .alpha(0.26f)
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            palette.bgDeep.copy(alpha = 0.72f),
                            palette.bgDeep.copy(alpha = 0.48f),
                            palette.bgDeep.copy(alpha = 0.94f)
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Column(
                modifier = Modifier.widthIn(max = 560.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "INFINITE GATES",
                    style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 5.sp),
                    color = palette.accent
                )
                Spacer(Modifier.height(10.dp))
                Text(
                    text = "無盡之門",
                    style = MaterialTheme.typography.displaySmall.copy(
                        fontSize = 40.sp,
                        letterSpacing = 8.sp,
                        fontWeight = FontWeight.Bold
                    ),
                    color = palette.textPrimary,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "一 場 沒 有 盡 頭 的 逃 亡",
                    style = MaterialTheme.typography.bodyMedium.copy(letterSpacing = 3.sp),
                    color = palette.textSecondary,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(22.dp))
                HorizontalDivider(
                    modifier = Modifier.widthIn(max = 180.dp),
                    color = palette.accent.copy(alpha = 0.55f)
                )
                Spacer(Modifier.height(24.dp))

                uiState.lastSession?.let { last ->
                    val doorName = uiState.dungeons.firstOrNull { it.id == last.dungeonId }?.name ?: "門扉 ${last.dungeonId}"
                    Surface(
                        onClick = { vm.resumeLastSession() },
                        color = palette.bgCard,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("resume_last_btn")
                            .border(1.dp, palette.accent.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
                    ) {
                        Row(
                            modifier = Modifier
                                .padding(horizontal = 16.dp, vertical = 14.dp)
                                .heightIn(min = 48.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("繼續上次冒險", style = MaterialTheme.typography.labelLarge, color = palette.accent)
                                Text(
                                    "$doorName · ${last.roomName.ifBlank { last.sceneId }} (HP ${last.state.hp})",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = palette.textSecondary
                                )
                            }
                            Icon(
                                imageVector = Icons.Rounded.PlayArrow,
                                contentDescription = "繼續遊玩",
                                tint = palette.accent
                            )
                        }
                    }
                    Spacer(Modifier.height(14.dp))
                }

                Button(
                    onClick = { vm.enterHub() },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = palette.accent,
                        contentColor = Color(0xFF141008)
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 52.dp)
                        .testTag("enter_hub_btn")
                ) {
                    Icon(Icons.Rounded.MeetingRoom, contentDescription = "進入迴廊圖示", modifier = Modifier.size(20.dp))
                    Spacer(Modifier.size(8.dp))
                    Text("進 入 迴 廊", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 3.sp))
                }

                Spacer(Modifier.height(18.dp))
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TitleQuickChip("聖殿", Icons.Rounded.AutoAwesome, "title_sanctum_btn") { vm.openOverlay(UiOverlay.Sanctum()) }
                    TitleQuickChip("手札", Icons.Rounded.Book, "title_notebook_btn") { vm.openOverlay(UiOverlay.Notebook()) }
                    TitleQuickChip("畫廊", Icons.Rounded.PhotoLibrary, "title_gallery_btn") { vm.openOverlay(UiOverlay.Gallery) }
                    TitleQuickChip("商店", Icons.Rounded.ShoppingBag, "title_shop_btn") { vm.openOverlay(UiOverlay.Shop) }
                    TitleQuickChip("每日試煉", Icons.Rounded.CalendarToday, "title_daily_btn") { vm.openOverlay(UiOverlay.DailyChallenge) }
                    TitleQuickChip("設置", Icons.Rounded.Settings, "title_settings_btn") { vm.openOverlay(UiOverlay.Settings) }
                }

                Spacer(Modifier.height(20.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "通關門扉 ${uiState.progress.clearedDungeons.size} / 14",
                        style = MaterialTheme.typography.labelSmall,
                        color = palette.textMuted
                    )
                    Text("·", color = palette.textMuted)
                    Text(
                        "記憶碎片 ${uiState.progress.memoryShards}",
                        style = MaterialTheme.typography.labelSmall,
                        color = palette.accent
                    )
                    Text("·", color = palette.textMuted)
                    Text("v7.0.0", style = MaterialTheme.typography.labelSmall, color = palette.textMuted)
                }

                Spacer(Modifier.height(14.dp))
                val syncState = uiState.cloudSync
                val syncBadgeLabel = when {
                    syncState.isSyncing -> "同步中…"
                    syncState.recommendedDirection == SyncDirection.CLOUD_TO_LOCAL -> "雲端有較新進度"
                    syncState.recommendedDirection == SyncDirection.LOCAL_TO_CLOUD && syncState.cloudSummary != null -> "本機有較新進度"
                    syncState.cloudSummary != null -> "已連線 Google 雲端"
                    else -> "點擊比對並同步"
                }
                Surface(
                    onClick = { vm.openOverlay(UiOverlay.CloudSync) },
                    color = palette.bgCard,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, palette.accent.copy(alpha = 0.45f), RoundedCornerShape(12.dp))
                        .testTag("title_cloud_sync_btn")
                ) {
                    Row(
                        modifier = Modifier
                            .padding(horizontal = 14.dp, vertical = 12.dp)
                            .heightIn(min = 48.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.CloudSync,
                            contentDescription = "Google 雲端存檔同步",
                            tint = palette.accent,
                            modifier = Modifier.size(22.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Google 雲端存檔同步",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = palette.textPrimary
                            )
                            Text(
                                text = "${syncState.account?.email?.ifBlank { syncState.account.displayName } ?: "已登入"} · $syncBadgeLabel",
                                style = MaterialTheme.typography.labelSmall,
                                color = palette.textSecondary
                            )
                        }
                        Text(
                            text = "同步",
                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                            color = palette.accent
                        )
                    }
                }

                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = { vm.openOverlay(UiOverlay.SaveLoad(false)) },
                        modifier = Modifier.heightIn(min = 48.dp).testTag("title_transfer_btn")
                    ) {
                        Text("跨裝置引繼 / 存讀檔")
                    }
                    TextButton(
                        onClick = { vm.openOverlay(UiOverlay.GmConsole) },
                        modifier = Modifier.heightIn(min = 48.dp).testTag("title_gm_btn")
                    ) {
                        Text("GM", color = palette.textMuted)
                    }
                }
            }
        }
    }
}

@Composable
private fun TitleQuickChip(
    label: String,
    icon: ImageVector,
    tag: String,
    onClick: () -> Unit
) {
    val palette = LocalGatePalette.current
    OutlinedButton(
        onClick = onClick,
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier
            .heightIn(min = 48.dp)
            .testTag(tag)
    ) {
        Icon(icon, contentDescription = "${label}圖示", tint = palette.accent, modifier = Modifier.size(18.dp))
        Spacer(Modifier.size(6.dp))
        Text(label, color = palette.textPrimary)
    }
}
