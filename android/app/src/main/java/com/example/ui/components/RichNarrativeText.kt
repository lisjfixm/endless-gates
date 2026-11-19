package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.model.NarrativeParagraph
import com.example.ui.theme.LocalGatePalette

private enum class ParagraphStyleKind {
    NORMAL,
    SYSTEM,
    ACTION,
    DIALOGUE,
    INHERIT_NOTE,
    DANGER,
    GHOST,
    DUAL_TRACK
}

private fun classifyParagraph(html: String): ParagraphStyleKind {
    return when {
        html.contains("class=\"dual-track\"") -> ParagraphStyleKind.DUAL_TRACK
        html.contains("class=\"inherit-note\"") -> ParagraphStyleKind.INHERIT_NOTE
        html.contains("class=\"danger-msg\"") -> ParagraphStyleKind.DANGER
        html.contains("class=\"ghost\"") -> ParagraphStyleKind.GHOST
        html.contains("class=\"system-msg\"") -> ParagraphStyleKind.SYSTEM
        html.contains("class=\"action\"") -> ParagraphStyleKind.ACTION
        html.contains("class=\"dialogue\"") -> ParagraphStyleKind.DIALOGUE
        else -> ParagraphStyleKind.NORMAL
    }
}

private fun parseStyledParagraph(rawHtml: String, remainingChars: Int, palette: com.example.ui.theme.GatePalette): Pair<AnnotatedString, Int> {
    // Normalize common tags into simple tokens while preserving plain character count
    val clean = rawHtml
        .replace(Regex("<br\\s*/?>", RegexOption.IGNORE_CASE), "\n")
        .replace(Regex("</p>\\s*<p[^>]*>", RegexOption.IGNORE_CASE), "\n\n")
        .replace(Regex("<div[^>]*>", RegexOption.IGNORE_CASE), "")
        .replace(Regex("</div>", RegexOption.IGNORE_CASE), "\n")
        .replace(Regex("</?p[^>]*>", RegexOption.IGNORE_CASE), "")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .trim()

    val sb = StringBuilder()
    val spans = mutableListOf<Triple<Int, Int, SpanStyle>>()

    var i = 0
    var activeBold = false
    var activeItalic = false
    var activeGlow = false
    var boldStart = -1
    var italicStart = -1
    var glowStart = -1

    while (i < clean.length) {
        if (clean[i] == '<') {
            val end = clean.indexOf('>', i)
            if (end > i) {
                val tag = clean.substring(i + 1, end).lowercase().trim()
                when {
                    tag == "strong" || tag == "b" -> if (!activeBold) { activeBold = true; boldStart = sb.length }
                    tag == "/strong" || tag == "/b" -> if (activeBold) {
                        spans.add(Triple(boldStart, sb.length, SpanStyle(fontWeight = FontWeight.Bold, color = palette.accent)))
                        activeBold = false
                    }
                    tag == "em" || tag == "i" -> if (!activeItalic) { activeItalic = true; italicStart = sb.length }
                    tag == "/em" || tag == "/i" -> if (activeItalic) {
                        spans.add(Triple(italicStart, sb.length, SpanStyle(fontStyle = FontStyle.Italic)))
                        activeItalic = false
                    }
                    tag.startsWith("span") -> if (!activeGlow) { activeGlow = true; glowStart = sb.length }
                    tag == "/span" -> if (activeGlow) {
                        spans.add(Triple(glowStart, sb.length, SpanStyle(color = palette.accent, fontWeight = FontWeight.Medium)))
                        activeGlow = false
                    }
                }
                i = end + 1
                continue
            }
        }
        if (clean[i] == '[') {
            when {
                clean.startsWith("[glow]", i) -> { activeGlow = true; glowStart = sb.length; i += 6; continue }
                clean.startsWith("[/glow]", i) -> {
                    if (activeGlow) spans.add(Triple(glowStart, sb.length, SpanStyle(color = palette.accent, fontWeight = FontWeight.SemiBold)))
                    activeGlow = false; i += 7; continue
                }
                clean.startsWith("[shake]", i) || clean.startsWith("[/shake]", i) -> {
                    i += if (clean.startsWith("[/shake]", i)) 8 else 7; continue
                }
                clean.startsWith("[ghost]", i) -> { activeGlow = true; glowStart = sb.length; i += 7; continue }
                clean.startsWith("[/ghost]", i) -> {
                    if (activeGlow) spans.add(Triple(glowStart, sb.length, SpanStyle(color = palette.ghostBlue)))
                    activeGlow = false; i += 8; continue
                }
            }
        }
        sb.append(clean[i])
        i++
    }
    if (activeBold && boldStart in 0 until sb.length) {
        spans.add(Triple(boldStart, sb.length, SpanStyle(fontWeight = FontWeight.Bold, color = palette.accent)))
    }
    if (activeGlow && glowStart in 0 until sb.length) {
        spans.add(Triple(glowStart, sb.length, SpanStyle(color = palette.accent)))
    }

    val fullStr = sb.toString()
    val visibleCount = if (remainingChars == Int.MAX_VALUE) fullStr.length else remainingChars.coerceIn(0, fullStr.length)
    val clipped = fullStr.substring(0, visibleCount)

    val annotated = buildAnnotatedString {
        append(clipped)
        for ((start, end, style) in spans) {
            val s = start.coerceIn(0, visibleCount)
            val e = end.coerceIn(0, visibleCount)
            if (e > s) addStyle(style, s, e)
        }
    }
    return annotated to fullStr.length
}

@Composable
fun NarrativeFeed(
    paragraphs: List<NarrativeParagraph>,
    typedCharLimit: Int,
    modifier: Modifier = Modifier
) {
    val palette = LocalGatePalette.current
    val renderedBlocks = remember(paragraphs, typedCharLimit, palette) {
        var budget = typedCharLimit
        paragraphs.mapNotNull { p ->
            if (budget <= 0 && typedCharLimit != Int.MAX_VALUE) return@mapNotNull null
            val (text, plainLen) = parseStyledParagraph(p.html, budget, palette)
            if (typedCharLimit != Int.MAX_VALUE) {
                budget = (budget - plainLen).coerceAtLeast(0)
            }
            Triple(p.id, classifyParagraph(p.html), text)
        }
    }

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        renderedBlocks.forEach { (_, kind, annotated) ->
            if (annotated.isNotEmpty()) {
                NarrativeBlock(kind = kind, text = annotated)
            }
        }
    }
}

@Composable
private fun NarrativeBlock(
    kind: ParagraphStyleKind,
    text: AnnotatedString
) {
    val palette = LocalGatePalette.current
    val baseStyle = MaterialTheme.typography.bodyLarge

    when (kind) {
        ParagraphStyleKind.SYSTEM -> {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(palette.accent.copy(alpha = 0.08f))
                    .border(1.dp, palette.accent.copy(alpha = 0.35f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                Text(text = text, style = baseStyle.copy(color = palette.accent))
            }
        }
        ParagraphStyleKind.ACTION -> {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(palette.bgCard)
                    .border(1.dp, palette.borderSubtle, RoundedCornerShape(8.dp))
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                Text(text = text, style = baseStyle.copy(color = palette.textPrimary))
            }
        }
        ParagraphStyleKind.INHERIT_NOTE -> {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(palette.ghostBlue.copy(alpha = 0.08f))
                    .border(1.dp, palette.ghostBlue.copy(alpha = 0.35f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                Text(text = text, style = baseStyle.copy(color = palette.ghostBlue, fontStyle = FontStyle.Italic))
            }
        }
        ParagraphStyleKind.DANGER -> {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(palette.danger.copy(alpha = 0.1f))
                    .border(1.dp, palette.danger.copy(alpha = 0.45f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                Text(text = text, style = baseStyle.copy(color = palette.danger))
            }
        }
        ParagraphStyleKind.GHOST -> {
            Text(
                text = text,
                style = baseStyle.copy(color = palette.ghostBlue.copy(alpha = 0.9f), fontStyle = FontStyle.Italic),
                modifier = Modifier.padding(vertical = 2.dp)
            )
        }
        ParagraphStyleKind.DIALOGUE -> {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 8.dp)
                    .border(1.dp, palette.accent.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Text(text = text, style = baseStyle.copy(color = palette.textPrimary))
            }
        }
        ParagraphStyleKind.DUAL_TRACK -> {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(palette.bgCard)
                    .border(1.dp, palette.accent.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                    .padding(14.dp)
            ) {
                Text(text = text, style = baseStyle)
            }
        }
        ParagraphStyleKind.NORMAL -> {
            Text(
                text = text,
                style = baseStyle,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
