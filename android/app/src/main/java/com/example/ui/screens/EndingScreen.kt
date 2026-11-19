package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.rounded.Replay
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.engine.GameUiState
import com.example.engine.GameViewModel
import com.example.ui.theme.LocalGatePalette

@Composable
fun EndingScreen(
    uiState: GameUiState,
    vm: GameViewModel,
    modifier: Modifier = Modifier
) {
    val palette = LocalGatePalette.current
    val context = LocalContext.current
    val ending = uiState.ending ?: return

    BackHandler { vm.backToHub() }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(palette.bgDeep)
            .padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 540.dp)
                .verticalScroll(rememberScrollState())
                .clip(RoundedCornerShape(16.dp))
                .background(palette.bgSurface)
                .border(
                    width = 1.dp,
                    color = if (ending.isBad) palette.danger.copy(alpha = 0.6f) else palette.accent.copy(alpha = 0.65f),
                    shape = RoundedCornerShape(16.dp)
                )
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = ending.categoryLabel,
                style = MaterialTheme.typography.labelLarge,
                color = if (ending.isBad) palette.danger else palette.accent
            )
            Spacer(Modifier.height(10.dp))
            Text(
                text = ending.title,
                style = MaterialTheme.typography.displaySmall.copy(fontSize = 28.spValue()),
                color = palette.textPrimary,
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(14.dp))
            HorizontalDivider(color = palette.borderSubtle)
            Spacer(Modifier.height(14.dp))
            Text(
                text = ending.desc,
                style = MaterialTheme.typography.bodyLarge,
                color = palette.textPrimary
            )
            if (ending.reward.isNotBlank()) {
                Spacer(Modifier.height(14.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(palette.accent.copy(alpha = 0.1f))
                        .border(1.dp, palette.accent.copy(alpha = 0.45f), RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Text(
                        text = ending.reward,
                        style = MaterialTheme.typography.labelLarge,
                        color = palette.accent,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            Spacer(Modifier.height(18.dp))
            // 4-Stat Grid
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(palette.bgCard)
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatPairRow("歷時", ending.elapsedFormatted, "已探索場景", "${ending.scenesVisitedCount}")
                StatPairRow(
                    "生還同行",
                    if (ending.alivePartyNames.isEmpty()) "獨行者" else ending.alivePartyNames.joinToString("、"),
                    "性格傾向",
                    "冷${ending.personality.calm} · 利${ending.personality.altruism} · 慎${ending.personality.cautious}"
                )
            }

            Spacer(Modifier.height(20.dp))
            Button(
                onClick = {
                    val res = vm.exportEndingCardShareIntent(context)
                    res.onSuccess { intent -> context.startActivity(intent) }
                        .onFailure { vm.showToast("無法建立分享圖卡") }
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = palette.accent,
                    contentColor = Color(0xFF141008)
                ),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 48.dp)
                    .testTag("ending_share_png_btn")
            ) {
                Icon(Icons.Rounded.Share, contentDescription = "分享水墨結局圖卡", modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
                Text("生成並分享水墨結局卡 (PNG)")
            }

            Spacer(Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = { vm.restartCurrentDungeon() },
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .weight(1f)
                        .heightIn(min = 48.dp)
                        .testTag("ending_replay_btn")
                ) {
                    Icon(Icons.Rounded.Replay, contentDescription = "重新遊玩本門", modifier = Modifier.size(16.dp))
                    Spacer(Modifier.size(6.dp))
                    Text("重開此門")
                }

                OutlinedButton(
                    onClick = { vm.backToHub() },
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .weight(1f)
                        .heightIn(min = 48.dp)
                        .testTag("ending_hub_btn")
                ) {
                    Text("返回迴廊")
                }
            }

            if (uiState.progress.inheritance.ngPlus) {
                Spacer(Modifier.height(10.dp))
                OutlinedButton(
                    onClick = { vm.startNewGamePlus() },
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 48.dp)
                        .testTag("ending_ngplus_btn")
                ) {
                    Icon(Icons.Rounded.AutoAwesome, contentDescription = "二周目", tint = palette.ghostBlue, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(6.dp))
                    Text("以二周目輪迴繼續探索", color = palette.ghostBlue)
                }
            }
        }
    }
}

@Composable
private fun Int.spValue() = androidx.compose.ui.unit.TextUnit(this.toFloat(), androidx.compose.ui.unit.TextUnitType.Sp)

@Composable
private fun StatPairRow(l1: String, v1: String, l2: String, v2: String) {
    val palette = LocalGatePalette.current
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Column(modifier = Modifier.weight(1f)) {
            Text(l1, style = MaterialTheme.typography.labelSmall, color = palette.textMuted)
            Text(v1, style = MaterialTheme.typography.bodyMedium, color = palette.textPrimary)
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(l2, style = MaterialTheme.typography.labelSmall, color = palette.textMuted)
            Text(v2, style = MaterialTheme.typography.bodyMedium, color = palette.textPrimary)
        }
    }
}

@Composable
fun PseudoEndingOverlay(
    pe: com.example.model.PseudoEndingPresentation,
    modifier: Modifier = Modifier
) {
    val palette = LocalGatePalette.current
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.9f))
            .padding(28.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 460.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(palette.bgSurface)
                .border(
                    1.dp,
                    if (pe.phase == 0) palette.accent else palette.danger,
                    RoundedCornerShape(14.dp)
                )
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = if (pe.phase == 0) pe.title else "系統異常 · 規則覆寫",
                style = MaterialTheme.typography.headlineMedium,
                color = if (pe.phase == 0) palette.accent else palette.danger,
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = if (pe.phase < 2) pe.desc else pe.metaText,
                style = MaterialTheme.typography.bodyLarge,
                color = palette.textPrimary,
                textAlign = TextAlign.Center
            )
        }
    }
}
