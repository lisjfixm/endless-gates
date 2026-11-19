package com.example.ui.screens

import androidx.compose.foundation.Image
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
import androidx.compose.material.icons.rounded.AccountCircle
import androidx.compose.material.icons.rounded.CloudSync
import androidx.compose.material.icons.rounded.Devices
import androidx.compose.material.icons.rounded.Security
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.credentials.CredentialManager
import com.example.R
import com.example.cloud.attemptAutoSignIn
import com.example.cloud.onGoogleSignInClicked
import com.example.ui.theme.LocalGatePalette

@Composable
fun AuthScreen(
    onAuthSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val palette = LocalGatePalette.current
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val credentialManager = remember(context) { CredentialManager.create(context) }

    var isCheckingAutoSignIn by remember { mutableStateOf(true) }
    var isSigningIn by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        attemptAutoSignIn(
            context = context,
            credentialManager = credentialManager,
            onAuthSuccess = {
                isCheckingAutoSignIn = false
                onAuthSuccess()
            },
            onUnauthenticated = {
                isCheckingAutoSignIn = false
            },
            scope = scope
        )
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(palette.bgDeep)
    ) {
        Image(
            painter = painterResource(id = R.drawable.img_corridor_hero),
            contentDescription = "無盡之門迴廊背景插圖",
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxSize()
                .alpha(0.24f)
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            palette.bgDeep.copy(alpha = 0.78f),
                            palette.bgDeep.copy(alpha = 0.54f),
                            palette.bgDeep.copy(alpha = 0.96f)
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
                modifier = Modifier.widthIn(max = 520.dp),
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
                    text = "跨 裝 置 雲 端 存 檔 迴 廊",
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

                Surface(
                    color = palette.bgSurface.copy(alpha = 0.92f),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, palette.accent.copy(alpha = 0.35f), RoundedCornerShape(16.dp))
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        AuthFeatureRow(
                            icon = Icons.Rounded.CloudSync,
                            title = "自動載入最新進度",
                            desc = "登入 Google 帳號後，自動比對本機與雲端存檔，並以最新進度為準完成同步。"
                        )
                        AuthFeatureRow(
                            icon = Icons.Rounded.Devices,
                            title = "跨裝置無縫接續",
                            desc = "於其他裝置登入同一 Google 帳號時，立即接續門扉進度、結局、成就與存檔槽。"
                        )
                        AuthFeatureRow(
                            icon = Icons.Rounded.Security,
                            title = "專屬帳號隔離保護",
                            desc = "所有雲端存檔僅限本人 Google 帳號讀寫，並支援隨時查看雙方進度後手動同步。"
                        )
                    }
                }

                Spacer(Modifier.height(22.dp))

                if (!errorMessage.isNullOrBlank()) {
                    Surface(
                        color = palette.danger.copy(alpha = 0.16f),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, palette.danger.copy(alpha = 0.6f), RoundedCornerShape(10.dp))
                    ) {
                        Text(
                            text = errorMessage.orEmpty(),
                            style = MaterialTheme.typography.bodyMedium,
                            color = palette.textPrimary,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                    Spacer(Modifier.height(14.dp))
                }

                Button(
                    onClick = {
                        errorMessage = null
                        isSigningIn = true
                        onGoogleSignInClicked(
                            context = context,
                            credentialManager = credentialManager,
                            onAuthSuccess = {
                                isSigningIn = false
                                onAuthSuccess()
                            },
                            onAuthError = { msg ->
                                isSigningIn = false
                                errorMessage = msg
                            },
                            scope = scope,
                            onAuthCancelled = {
                                isSigningIn = false
                            }
                        )
                    },
                    enabled = !isSigningIn,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = palette.accent,
                        contentColor = Color(0xFF141008)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 54.dp)
                        .testTag("google_sign_in_btn")
                ) {
                    if (isSigningIn) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color(0xFF141008),
                            strokeWidth = 2.dp
                        )
                        Spacer(Modifier.size(10.dp))
                        Text(
                            "正在驗證 Google 帳號…",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Rounded.AccountCircle,
                            contentDescription = "Google 登入圖示",
                            modifier = Modifier.size(22.dp)
                        )
                        Spacer(Modifier.size(10.dp))
                        Text(
                            "使用 Google 帳號登入",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                        )
                    }
                }

                if (isCheckingAutoSignIn) {
                    Spacer(Modifier.height(10.dp))
                    Text(
                        text = "正在檢查已授權的 Google 登入狀態…",
                        style = MaterialTheme.typography.labelSmall,
                        color = palette.textMuted
                    )
                }
            }
        }
    }
}

@Composable
private fun AuthFeatureRow(
    icon: ImageVector,
    title: String,
    desc: String
) {
    val palette = LocalGatePalette.current
    Row(
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            imageVector = icon,
            contentDescription = title,
            tint = palette.accent,
            modifier = Modifier
                .padding(top = 2.dp)
                .size(20.dp)
        )
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                color = palette.textPrimary
            )
            Text(
                text = desc,
                style = MaterialTheme.typography.bodySmall,
                color = palette.textSecondary
            )
        }
    }
}
