package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.VolumeUp
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.engine.ChapterCardBanner
import com.example.model.AchDef
import com.example.ui.theme.LocalGatePalette
import kotlin.math.PI
import kotlin.math.sin
import kotlin.random.Random

private data class DustParticle(
    val xFrac: Float,
    val yFrac: Float,
    val radius: Float,
    val speed: Float,
    val phase: Float
)

@Composable
fun AmbientParticleLayer(
    moodKey: String,
    reducedMotion: Boolean,
    modifier: Modifier = Modifier
) {
    if (reducedMotion) return
    val palette = LocalGatePalette.current
    val particles = remember(moodKey) {
        val count = when (moodKey) {
            "danger", "horror" -> 26
            "safe" -> 16
            else -> 20
        }
        val rng = Random(moodKey.hashCode())
        List(count) {
            DustParticle(
                xFrac = rng.nextFloat(),
                yFrac = rng.nextFloat(),
                radius = rng.nextFloat() * 2.4f + 1.2f,
                speed = rng.nextFloat() * 0.6f + 0.4f,
                phase = rng.nextFloat() * 2f * PI.toFloat()
            )
        }
    }
    val transition = rememberInfiniteTransition(label = "ambientParticles")
    val progress by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 12000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "particleDrift"
    )

    val particleColor = when (moodKey) {
        "danger", "horror" -> palette.danger.copy(alpha = 0.25f)
        "safe" -> palette.safeGreen.copy(alpha = 0.25f)
        else -> palette.accent.copy(alpha = 0.22f)
    }

    Canvas(modifier = modifier.fillMaxSize()) {
        for (p in particles) {
            val y = ((p.yFrac + progress * p.speed) % 1f) * size.height
            val x = (p.xFrac * size.width) + sin(progress * 2f * PI.toFloat() + p.phase) * 18f
            drawCircle(
                color = particleColor,
                radius = p.radius.dp.toPx(),
                center = Offset(x.coerceIn(0f, size.width), y)
            )
        }
    }
}

@Composable
fun ChapterCardOverlay(
    banner: ChapterCardBanner?,
    modifier: Modifier = Modifier
) {
    val palette = LocalGatePalette.current
    AnimatedVisibility(
        visible = banner != null,
        enter = fadeIn(tween(400)),
        exit = fadeOut(tween(500)),
        modifier = modifier
    ) {
        if (banner != null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.78f)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .padding(horizontal = 28.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(palette.bgSurface)
                        .border(1.dp, palette.accent.copy(alpha = 0.65f), RoundedCornerShape(14.dp))
                        .padding(horizontal = 28.dp, vertical = 26.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = banner.chapter.num,
                        style = MaterialTheme.typography.labelLarge,
                        color = palette.accent
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = banner.chapter.title,
                        style = MaterialTheme.typography.headlineMedium,
                        color = palette.textPrimary,
                        textAlign = TextAlign.Center
                    )
                    Spacer(Modifier.height(10.dp))
                    Text(
                        text = banner.chapter.quote,
                        style = MaterialTheme.typography.bodyMedium,
                        color = palette.textSecondary,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}

@Composable
fun DoorTransitionOverlay(
    label: String?,
    modifier: Modifier = Modifier
) {
    val palette = LocalGatePalette.current
    AnimatedVisibility(
        visible = label != null,
        enter = fadeIn(tween(180)),
        exit = fadeOut(tween(380)),
        modifier = modifier
    ) {
        if (label != null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(palette.bgSurface, Color(0xFF040406))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                    color = palette.accent,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(24.dp)
                )
            }
        }
    }
}

@Composable
fun FloatingStatusBanners(
    toastMessage: String?,
    sfxSubtitle: String?,
    achievementBanner: AchDef?,
    modifier: Modifier = Modifier
) {
    val palette = LocalGatePalette.current
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        AnimatedVisibility(visible = achievementBanner != null, enter = fadeIn(), exit = fadeOut()) {
            achievementBanner?.let { ach ->
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(palette.bgCard)
                        .border(1.dp, palette.accent, RoundedCornerShape(12.dp))
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.AutoAwesome,
                        contentDescription = "成就解鎖圖示",
                        tint = palette.accent,
                        modifier = Modifier.size(20.dp)
                    )
                    Column {
                        Text(
                            text = "成就解鎖：${ach.name}",
                            style = MaterialTheme.typography.labelLarge,
                            color = palette.accent
                        )
                        Text(
                            text = ach.desc,
                            style = MaterialTheme.typography.bodyMedium,
                            color = palette.textSecondary
                        )
                    }
                }
            }
        }

        AnimatedVisibility(visible = !sfxSubtitle.isNullOrBlank(), enter = fadeIn(), exit = fadeOut()) {
            sfxSubtitle?.let { sub ->
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.Black.copy(alpha = 0.72f))
                        .border(1.dp, palette.borderSubtle, RoundedCornerShape(20.dp))
                        .padding(horizontal = 14.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.VolumeUp,
                        contentDescription = "音效字幕",
                        tint = palette.accent,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(text = sub, style = MaterialTheme.typography.labelSmall, color = palette.textPrimary)
                }
            }
        }

        AnimatedVisibility(visible = !toastMessage.isNullOrBlank(), enter = fadeIn(), exit = fadeOut()) {
            toastMessage?.let { msg ->
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(palette.bgCard.copy(alpha = 0.96f))
                        .border(1.dp, palette.accent.copy(alpha = 0.55f), RoundedCornerShape(10.dp))
                        .padding(horizontal = 16.dp, vertical = 9.dp)
                ) {
                    Text(
                        text = msg,
                        style = MaterialTheme.typography.bodyMedium,
                        color = palette.textPrimary,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}
