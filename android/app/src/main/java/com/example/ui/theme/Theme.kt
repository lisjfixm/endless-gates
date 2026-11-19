package com.example.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.shape.RoundedCornerShape
import com.example.R
import com.example.model.GameSettings

@Immutable
data class GatePalette(
    val bgDeep: Color,
    val bgSurface: Color,
    val bgCard: Color,
    val accent: Color,
    val accentDim: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textMuted: Color,
    val danger: Color,
    val safeGreen: Color,
    val ghostBlue: Color,
    val borderSubtle: Color
)

val LocalGatePalette = staticCompositionLocalOf {
    GatePalette(
        bgDeep = Color(0xFF0A0A0E),
        bgSurface = Color(0xFF12131A),
        bgCard = Color(0xFF191B24),
        accent = Color(0xFFC9A962),
        accentDim = Color(0xFF8C723A),
        textPrimary = Color(0xFFEAE4D3),
        textSecondary = Color(0xFFB5AE9C),
        textMuted = Color(0xFF7B7464),
        danger = Color(0xFFD95B5B),
        safeGreen = Color(0xFF5FB082),
        ghostBlue = Color(0xFF7EA6E0),
        borderSubtle = Color(0xFF2B2D3A)
    )
}

val NotoSerifFamily: FontFamily by lazy {
    runCatching { FontFamily(Font(R.font.noto_serif, FontWeight.Normal)) }.getOrDefault(FontFamily.Serif)
}

val JetBrainsMonoFamily: FontFamily by lazy {
    runCatching { FontFamily(Font(R.font.jetbrains_mono, FontWeight.Normal)) }.getOrDefault(FontFamily.Monospace)
}

private fun resolvePalette(settings: GameSettings): GatePalette {
    val bgDeep = when (settings.bgTone) {
        "bamboo" -> Color(0xFF0B1410)
        "crimson" -> Color(0xFF14090B)
        "azure" -> Color(0xFF080E18)
        else -> Color(0xFF0A0A0E)
    }
    val bgSurface = when (settings.bgTone) {
        "bamboo" -> Color(0xFF111E18)
        "crimson" -> Color(0xFF1D0E12)
        "azure" -> Color(0xFF0F1826)
        else -> Color(0xFF12131A)
    }
    val bgCard = when (settings.bgTone) {
        "bamboo" -> Color(0xFF172720)
        "crimson" -> Color(0xFF271419)
        "azure" -> Color(0xFF152233)
        else -> Color(0xFF191B24)
    }

    val (accent, accentDim) = when (settings.theme) {
        "blood" -> Color(0xFFD96459) to Color(0xFF8A332D)
        "ice" -> Color(0xFF7AC2E8) to Color(0xFF3E6F8E)
        "forest" -> Color(0xFF76C28A) to Color(0xFF3E6E4C)
        "violet" -> Color(0xFFB388EB) to Color(0xFF664799)
        "amber" -> Color(0xFFE5A443) to Color(0xFF8E6220)
        "jade" -> Color(0xFF5BC2B1) to Color(0xFF2E7569)
        else -> Color(0xFFC9A962) to Color(0xFF7D6633)
    }

    return GatePalette(
        bgDeep = if (settings.highContrast) Color(0xFF000000) else bgDeep,
        bgSurface = if (settings.highContrast) Color(0xFF0D0D10) else bgSurface,
        bgCard = if (settings.highContrast) Color(0xFF16161C) else bgCard,
        accent = accent,
        accentDim = accentDim,
        textPrimary = if (settings.highContrast) Color(0xFFFFFFFF) else Color(0xFFEAE4D3),
        textSecondary = if (settings.highContrast) Color(0xFFDCD8CD) else Color(0xFFB5AE9C),
        textMuted = if (settings.highContrast) Color(0xFFA8A399) else Color(0xFF7D7666),
        danger = Color(0xFFE06464),
        safeGreen = Color(0xFF64B888),
        ghostBlue = Color(0xFF88B0EB),
        borderSubtle = if (settings.highContrast) Color(0xFF494B5E) else Color(0xFF2A2C38)
    )
}

@Composable
fun InfiniteGatesTheme(
    settings: GameSettings = GameSettings(),
    content: @Composable () -> Unit
) {
    val palette = resolvePalette(settings)
    val fontFamily = when (settings.fontFamily) {
        "sans" -> FontFamily.SansSerif
        "mono" -> JetBrainsMonoFamily
        else -> NotoSerifFamily
    }
    val scale = when (settings.fontSize) {
        "small" -> 0.88f
        "large" -> 1.15f
        "xlarge" -> 1.3f
        else -> 1.0f
    }

    val colorScheme: ColorScheme = darkColorScheme(
        primary = palette.accent,
        onPrimary = Color(0xFF14110A),
        secondary = palette.accentDim,
        onSecondary = palette.textPrimary,
        tertiary = palette.ghostBlue,
        background = palette.bgDeep,
        onBackground = palette.textPrimary,
        surface = palette.bgSurface,
        onSurface = palette.textPrimary,
        surfaceVariant = palette.bgCard,
        onSurfaceVariant = palette.textSecondary,
        outline = palette.borderSubtle,
        error = palette.danger,
        onError = Color.White
    )

    val typography = Typography(
        displaySmall = TextStyle(
            fontFamily = NotoSerifFamily,
            fontWeight = FontWeight.Bold,
            fontSize = (30 * scale).sp,
            lineHeight = (38 * scale).sp,
            color = palette.textPrimary
        ),
        headlineMedium = TextStyle(
            fontFamily = fontFamily,
            fontWeight = FontWeight.SemiBold,
            fontSize = (22 * scale).sp,
            lineHeight = (30 * scale).sp,
            color = palette.textPrimary
        ),
        titleMedium = TextStyle(
            fontFamily = fontFamily,
            fontWeight = FontWeight.Medium,
            fontSize = (17 * scale).sp,
            lineHeight = (24 * scale).sp,
            color = palette.textPrimary
        ),
        bodyLarge = TextStyle(
            fontFamily = fontFamily,
            fontWeight = FontWeight.Normal,
            fontSize = (16 * scale).sp,
            lineHeight = (26 * scale).sp,
            color = palette.textPrimary
        ),
        bodyMedium = TextStyle(
            fontFamily = fontFamily,
            fontWeight = FontWeight.Normal,
            fontSize = (14 * scale).sp,
            lineHeight = (21 * scale).sp,
            color = palette.textSecondary
        ),
        labelLarge = TextStyle(
            fontFamily = FontFamily.SansSerif,
            fontWeight = FontWeight.Medium,
            fontSize = (14 * scale).sp,
            lineHeight = (18 * scale).sp
        ),
        labelSmall = TextStyle(
            fontFamily = JetBrainsMonoFamily,
            fontWeight = FontWeight.Normal,
            fontSize = (11 * scale).sp,
            lineHeight = (15 * scale).sp
        )
    )

    val shapes = Shapes(
        small = RoundedCornerShape(6.dp),
        medium = RoundedCornerShape(10.dp),
        large = RoundedCornerShape(16.dp)
    )

    CompositionLocalProvider(LocalGatePalette provides palette) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = typography,
            shapes = shapes,
            content = content
        )
    }
}
