package com.example.ui.modals

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Logout
import androidx.compose.material.icons.rounded.AccountCircle
import androidx.compose.material.icons.rounded.CloudDone
import androidx.compose.material.icons.rounded.CloudDownload
import androidx.compose.material.icons.rounded.CloudSync
import androidx.compose.material.icons.rounded.CloudUpload
import androidx.compose.material.icons.rounded.PhoneAndroid
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.cloud.SaveProgressSummary
import com.example.cloud.SyncDirection
import com.example.engine.GameUiState
import com.example.engine.GameViewModel
import com.example.ui.theme.LocalGatePalette
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun CloudSyncModal(
    uiState: GameUiState,
    vm: GameViewModel,
    onSignOutRequested: () -> Unit
) {
    val palette = LocalGatePalette.current
    val syncState = uiState.cloudSync

    LaunchedEffect(Unit) {
        vm.refreshCloudComparison()
    }

    val recommendationHint = when (syncState.recommendedDirection) {
        SyncDirection.LOCAL_TO_CLOUD -> {
            if (syncState.cloudSummary == null) {
                "Google 帳號尚未建立雲端存檔，點擊同步即可將本機最新進度上傳至雲端。"
            } else {
                "目前以本機進度較新，點擊同步將把本機最新存檔上傳至 Google 帳號。"
            }
        }
        SyncDirection.CLOUD_TO_LOCAL -> "Google 帳號雲端進度較新，點擊同步將把雲端最新存檔下載並套用至本機。"
        SyncDirection.ALREADY_IN_SYNC -> "本機與 Google 帳號雲端進度時間一致，點擊同步可再次校驗並同步最新資料。"
    }

    GateModalContainer(
        title = "Google 雲端存檔同步",
        subtitle = "跨裝置登入自動載入 · 以最新進度為準",
        onClose = { vm.closeOverlay() },
        footer = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { vm.refreshCloudComparison() },
                    enabled = !syncState.isSyncing && !syncState.isLoadingCloud,
                    modifier = Modifier
                        .weight(1f)
                        .heightIn(min = 48.dp)
                        .testTag("cloud_refresh_btn")
                ) {
                    Icon(Icons.Rounded.Refresh, contentDescription = "重新整理進度", modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(6.dp))
                    Text("重新整理")
                }
                OutlinedButton(
                    onClick = onSignOutRequested,
                    enabled = !syncState.isSyncing,
                    modifier = Modifier
                        .weight(1f)
                        .heightIn(min = 48.dp)
                        .testTag("cloud_sign_out_btn")
                ) {
                    Icon(
                        Icons.AutoMirrored.Rounded.Logout,
                        contentDescription = "登出 Google 帳號",
                        tint = palette.danger,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(Modifier.size(6.dp))
                    Text("登出帳號", color = palette.danger)
                }
            }
        }
    ) {
        // Account Identity Banner
        Surface(
            color = palette.bgCard,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, palette.accent.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    imageVector = Icons.Rounded.AccountCircle,
                    contentDescription = "Google 帳號頭像圖示",
                    tint = palette.accent,
                    modifier = Modifier.size(34.dp)
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = syncState.account?.displayName?.ifBlank { "Google 探索者" } ?: "尚未登入",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = palette.textPrimary
                    )
                    if (!syncState.account?.email.isNullOrBlank()) {
                        Text(
                            text = syncState.account?.email.orEmpty(),
                            style = MaterialTheme.typography.bodySmall,
                            color = palette.textSecondary
                        )
                    }
                    syncState.lastSyncAtMs?.let { ts ->
                        Text(
                            text = "上次同步：${formatSyncTime(ts)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = palette.safeGreen
                        )
                    }
                }
                if (syncState.isSyncing || syncState.isLoadingCloud) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = palette.accent,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = Icons.Rounded.CloudDone,
                        contentDescription = "已連線至雲端",
                        tint = palette.safeGreen,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
        }

        // Status / Error banners
        if (!syncState.statusMessage.isNullOrBlank()) {
            Surface(
                color = palette.safeGreen.copy(alpha = 0.14f),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, palette.safeGreen.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
            ) {
                Text(
                    text = syncState.statusMessage,
                    style = MaterialTheme.typography.bodySmall,
                    color = palette.textPrimary,
                    modifier = Modifier.padding(10.dp)
                )
            }
        }

        if (!syncState.errorMessage.isNullOrBlank()) {
            Surface(
                color = palette.danger.copy(alpha = 0.16f),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, palette.danger.copy(alpha = 0.55f), RoundedCornerShape(10.dp))
            ) {
                Text(
                    text = syncState.errorMessage,
                    style = MaterialTheme.typography.bodySmall,
                    color = palette.textPrimary,
                    modifier = Modifier.padding(10.dp)
                )
            }
        }

        // Local Progress Card
        ProgressComparisonCard(
            title = "本機進度",
            icon = Icons.Rounded.PhoneAndroid,
            summary = syncState.localSummary,
            badgeText = when (syncState.recommendedDirection) {
                SyncDirection.LOCAL_TO_CLOUD -> "較新進度"
                SyncDirection.ALREADY_IN_SYNC -> "已同步"
                SyncDirection.CLOUD_TO_LOCAL -> "較舊進度"
            },
            isHighlighted = syncState.recommendedDirection == SyncDirection.LOCAL_TO_CLOUD,
            isSyncedBadge = syncState.recommendedDirection == SyncDirection.ALREADY_IN_SYNC,
            emptyMessage = "本機尚無遊玩紀錄。",
            testTag = "local_progress_card"
        )

        // Cloud Progress Card
        ProgressComparisonCard(
            title = "Google 帳號雲端進度",
            icon = Icons.Rounded.CloudSync,
            summary = syncState.cloudSummary,
            badgeText = when {
                syncState.cloudSummary == null -> "尚未建立"
                syncState.recommendedDirection == SyncDirection.CLOUD_TO_LOCAL -> "較新進度"
                syncState.recommendedDirection == SyncDirection.ALREADY_IN_SYNC -> "已同步"
                else -> "較舊進度"
            },
            isHighlighted = syncState.recommendedDirection == SyncDirection.CLOUD_TO_LOCAL,
            isSyncedBadge = syncState.cloudSummary != null && syncState.recommendedDirection == SyncDirection.ALREADY_IN_SYNC,
            emptyMessage = if (syncState.isLoadingCloud) "正在讀取 Google 帳號雲端進度…" else "此 Google 帳號尚未上傳任何雲端存檔。",
            testTag = "cloud_progress_card"
        )

        // Recommendation hint & Primary Sync CTA
        Text(
            text = recommendationHint,
            style = MaterialTheme.typography.bodySmall,
            color = palette.textSecondary
        )

        Button(
            onClick = { vm.syncLatestWithCloud() },
            enabled = !syncState.isSyncing && !syncState.isLoadingCloud,
            colors = ButtonDefaults.buttonColors(
                containerColor = palette.accent,
                contentColor = Color(0xFF141008)
            ),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 52.dp)
                .testTag("cloud_sync_now_btn")
        ) {
            if (syncState.isSyncing) {
                CircularProgressIndicator(
                    modifier = Modifier.size(18.dp),
                    color = Color(0xFF141008),
                    strokeWidth = 2.dp
                )
                Spacer(Modifier.size(8.dp))
                Text("正在同步最新進度…", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
            } else {
                Icon(Icons.Rounded.CloudSync, contentDescription = "同步最新進度", modifier = Modifier.size(20.dp))
                Spacer(Modifier.size(8.dp))
                Text("同步最新進度", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
            }
        }

        // Manual directional override buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = { vm.pushLocalToCloudForce() },
                enabled = !syncState.isSyncing && !syncState.isLoadingCloud,
                modifier = Modifier
                    .weight(1f)
                    .heightIn(min = 48.dp)
                    .testTag("cloud_push_local_btn")
            ) {
                Icon(Icons.Rounded.CloudUpload, contentDescription = "上傳本機存檔", modifier = Modifier.size(16.dp))
                Spacer(Modifier.size(4.dp))
                Text("本機上傳覆蓋")
            }
            OutlinedButton(
                onClick = { vm.pullCloudToLocalForce() },
                enabled = !syncState.isSyncing && !syncState.isLoadingCloud && syncState.cloudSummary != null,
                modifier = Modifier
                    .weight(1f)
                    .heightIn(min = 48.dp)
                    .testTag("cloud_pull_remote_btn")
            ) {
                Icon(Icons.Rounded.CloudDownload, contentDescription = "下載雲端存檔", modifier = Modifier.size(16.dp))
                Spacer(Modifier.size(4.dp))
                Text("雲端載入本機")
            }
        }
    }
}

@Composable
private fun ProgressComparisonCard(
    title: String,
    icon: ImageVector,
    summary: SaveProgressSummary?,
    badgeText: String,
    isHighlighted: Boolean,
    isSyncedBadge: Boolean,
    emptyMessage: String,
    testTag: String
) {
    val palette = LocalGatePalette.current
    val borderColor = when {
        isHighlighted -> palette.accent
        isSyncedBadge -> palette.safeGreen.copy(alpha = 0.65f)
        else -> palette.borderSubtle
    }
    val badgeBg = when {
        isHighlighted -> palette.accent.copy(alpha = 0.22f)
        isSyncedBadge -> palette.safeGreen.copy(alpha = 0.2f)
        else -> palette.bgDeep
    }
    val badgeColor = when {
        isHighlighted -> palette.accent
        isSyncedBadge -> palette.safeGreen
        else -> palette.textMuted
    }

    Surface(
        color = palette.bgCard,
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, borderColor, RoundedCornerShape(12.dp))
            .testTag(testTag)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(icon, contentDescription = title, tint = palette.accent, modifier = Modifier.size(18.dp))
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = palette.textPrimary
                    )
                }
                Text(
                    text = badgeText,
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                    color = badgeColor,
                    modifier = Modifier
                        .background(badgeBg, RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                )
            }

            HorizontalDivider(color = palette.borderSubtle)

            if (summary == null || (!summary.hasData && summary.updatedAtMs == 0L)) {
                Text(
                    text = emptyMessage,
                    style = MaterialTheme.typography.bodyMedium,
                    color = palette.textMuted
                )
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "裝置：${summary.deviceLabel.ifBlank { "未知裝置" }}",
                        style = MaterialTheme.typography.labelSmall,
                        color = palette.textSecondary
                    )
                    Text(
                        text = if (summary.updatedAtMs > 0L) formatSyncTime(summary.updatedAtMs) else "尚未記錄時間",
                        style = MaterialTheme.typography.labelSmall,
                        color = palette.accent
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    MetricItem("通關門扉", "${summary.clearedDoorsCount} / 14")
                    MetricItem("已發現結局", "${summary.endingsCount}")
                    MetricItem("已解鎖成就", "${summary.achievementsCount}")
                    MetricItem("記憶碎片", "${summary.memoryShards}")
                }

                val locationText = buildString {
                    append(summary.currentDoorName.ifBlank { "第 ${summary.currentDoorId} 扇門" })
                    val room = summary.currentRoomName.ifBlank { summary.currentSceneId }
                    if (room.isNotBlank()) {
                        append(" · ")
                        append(room)
                    }
                    append("（HP ${summary.currentHp} · 存檔槽 ${summary.saveSlotCount}）")
                }
                Text(
                    text = "最近進度：$locationText",
                    style = MaterialTheme.typography.bodySmall,
                    color = palette.textSecondary
                )
            }
        }
    }
}

@Composable
private fun MetricItem(label: String, value: String) {
    val palette = LocalGatePalette.current
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
            color = palette.textPrimary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = palette.textMuted
        )
    }
}

private fun formatSyncTime(epochMs: Long): String {
    if (epochMs <= 0L) return "尚未同步"
    return SimpleDateFormat("yyyy/MM/dd HH:mm:ss", Locale.getDefault()).format(Date(epochMs))
}
