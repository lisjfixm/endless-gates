package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import com.example.model.UiOverlay
import com.example.ui.theme.LocalGatePalette

@Composable
fun GameTitleScreen(
    uiState: GameUiState,
    vm: GameViewModel,
    modifier: Modifier = Modifier
) {
    val palette = LocalGatePalette.current
    val meta = uiState.selectedDungeonMeta
    BackHandler { vm.backToHub() }

    if (meta == null) {
        vm.backToHub()
        return
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(palette.bgDeep)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 520.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = meta.roomNum,
                style = MaterialTheme.typography.displaySmall.copy(
                    fontSize = 68.sp,
                    fontWeight = FontWeight.Bold
                ),
                color = palette.accent.copy(alpha = 0.85f)
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = meta.name,
                style = MaterialTheme.typography.displaySmall.copy(fontSize = 30.sp),
                color = palette.textPrimary,
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = meta.subText,
                style = MaterialTheme.typography.bodyMedium,
                color = palette.textSecondary,
                textAlign = TextAlign.Center
            )

            if (uiState.progress.inheritance.ngPlus) {
                Spacer(Modifier.height(10.dp))
                Text(
                    text = "NEW GAME+ · 輪迴週目 ${uiState.progress.inheritance.loopCount + 1}",
                    style = MaterialTheme.typography.labelLarge.copy(letterSpacing = 2.sp),
                    color = palette.ghostBlue,
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(palette.ghostBlue.copy(alpha = 0.14f))
                        .border(1.dp, palette.ghostBlue.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
                        .padding(horizontal = 12.dp, vertical = 4.dp)
                )
            }

            if (meta.ruleText.isNotBlank()) {
                Spacer(Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(palette.bgCard)
                        .border(1.dp, palette.accent.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                        .padding(14.dp)
                ) {
                    Text(
                        text = meta.ruleText,
                        style = MaterialTheme.typography.bodyMedium,
                        color = palette.textPrimary,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            Spacer(Modifier.height(22.dp))
            HorizontalDivider(color = palette.borderSubtle)
            Spacer(Modifier.height(22.dp))

            Button(
                onClick = { vm.startDungeonGame(dailyChallenge = false) },
                colors = ButtonDefaults.buttonColors(
                    containerColor = palette.accent,
                    contentColor = Color(0xFF141008)
                ),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 52.dp)
                    .testTag("game_title_start_btn")
            ) {
                Text("推 門 進 入", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 3.sp))
            }

            Spacer(Modifier.height(10.dp))
            OutlinedButton(
                onClick = { vm.openOverlay(UiOverlay.TrialContracts) },
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 48.dp)
                    .testTag("game_title_contracts_btn")
            ) {
                val activeCount = uiState.progress.activeContracts.size
                Text("設定受虐契約（已選 $activeCount 項）", color = palette.textPrimary)
            }

            if (uiState.dailySeedInfo.recommendedDungeonId == meta.id) {
                Spacer(Modifier.height(10.dp))
                OutlinedButton(
                    onClick = { vm.startDungeonGame(dailyChallenge = true) },
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 48.dp)
                        .testTag("game_title_daily_btn")
                ) {
                    Text("作為今日試煉入口出發（額外碎片 +${uiState.dailySeedInfo.bonusShards}）", color = palette.accent)
                }
            }

            Spacer(Modifier.height(10.dp))
            TextButton(
                onClick = { vm.backToHub() },
                modifier = Modifier.heightIn(min = 48.dp).testTag("game_title_back_btn")
            ) {
                Text("返 回 門 扉 選 擇", color = palette.textSecondary)
            }

            val inhBadges = buildList {
                val inh = uiState.progress.inheritance
                if (inh.goldenKey) add("黃金鑰匙記憶")
                if (inh.suwanSurvived) add("蘇晚之約")
                if (inh.mirrorDefeated) add("鏡像破除")
                if (inh.basementKnowledge) add("質數證明")
                if (inh.firstCleared) add("門一印記")
            }
            if (inhBadges.isNotEmpty()) {
                Spacer(Modifier.height(14.dp))
                Text(
                    text = "繼承迴響：${inhBadges.joinToString(" · ")}",
                    style = MaterialTheme.typography.labelSmall,
                    color = palette.ghostBlue,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}
