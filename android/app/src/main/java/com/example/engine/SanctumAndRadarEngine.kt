package com.example.engine

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import androidx.core.content.FileProvider
import com.example.model.CorridorRelicDef
import com.example.model.EndingPresentation
import com.example.model.GlobalProgress
import com.example.model.RuntimeDungeonState
import com.example.model.SceneDef
import com.example.model.SynergySealDef
import com.example.model.SystemsMeta
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.roundToInt

data class RadarBranchItem(
    val sceneId: String,
    val roomName: String,
    val unvisitedChoiceCount: Int,
    val sampleTexts: List<String>
)

data class DeductionRadarReport(
    val totalScenes: Int,
    val visitedCount: Int,
    val coveragePercent: Int,
    val unlockedEndingsCount: Int,
    val totalEndingsCount: Int,
    val missingFragments: List<String>,
    val branches: List<RadarBranchItem>,
    val trueEndingHint: String
)

data class DailySeedInfo(
    val dateKey: String,
    val dayOfWeek: Int, // 1..7
    val recommendedDungeonId: Int,
    val bonusShards: Int
)

object SanctumAndRadarEngine {

    fun getTodaySeedInfo(overrideDay: Int? = null): DailySeedInfo {
        val today = LocalDate.now(ZoneId.systemDefault())
        val dateKey = today.toString()
        val dow = overrideDay ?: today.dayOfWeek.value // 1=Mon .. 7=Sun
        val hash = absHash(dateKey)
        val recommendedDoor = (hash % 14) + 1
        return DailySeedInfo(
            dateKey = dateKey,
            dayOfWeek = dow,
            recommendedDungeonId = recommendedDoor,
            bonusShards = 35
        )
    }

    private fun absHash(s: String): Int {
        var h = 0
        for (ch in s) {
            h = (h * 31 + ch.code) and 0x7fffffff
        }
        return h
    }

    fun getActiveSynergySeals(
        equippedRelics: List<String>,
        systems: SystemsMeta
    ): List<SynergySealDef> {
        val equippedSet = equippedRelics.toSet()
        return systems.v70SynergySeals.filter { seal ->
            seal.req.isNotEmpty() && seal.req.all { it in equippedSet }
        }
    }

    fun getRelicDefs(systems: SystemsMeta): List<CorridorRelicDef> = systems.v64Relics

    fun analyzeDeductionRadar(
        dungeonId: Int,
        scenes: Map<String, SceneDef>,
        state: RuntimeDungeonState,
        progress: GlobalProgress,
        systems: SystemsMeta,
        totalEndingsInDoor: Int,
        gapHint: String
    ): DeductionRadarReport {
        val readInDoor = progress.readScenesByDungeon[dungeonId].orEmpty() + state.visitedScenes
        val total = scenes.size.coerceAtLeast(1)
        val visited = scenes.keys.count { it in readInDoor }
        val pct = ((visited * 100f) / total).roundToInt().coerceIn(0, 100)
        val endingsCount = progress.endingsLog.count { it.startsWith("$dungeonId|") }
        val missingFrags = systems.v4Fragments.entries
            .filter { it.value.d == dungeonId && it.key !in progress.foundFragments }
            .map { it.value.name }

        val branches = ArrayList<RadarBranchItem>()
        for ((sid, scene) in scenes) {
            val unvisitedChoices = scene.choices.filter { ch ->
                val target = ch.next
                !target.isNullOrBlank() && target !in readInDoor && !ch.useless
            }
            if (unvisitedChoices.isNotEmpty()) {
                branches.add(
                    RadarBranchItem(
                        sceneId = sid,
                        roomName = scene.roomName.ifBlank { scene.id.ifBlank { sid } },
                        unvisitedChoiceCount = unvisitedChoices.size,
                        sampleTexts = unvisitedChoices.take(2).map { it.text }
                    )
                )
            }
        }
        return DeductionRadarReport(
            totalScenes = total,
            visitedCount = visited,
            coveragePercent = pct,
            unlockedEndingsCount = endingsCount,
            totalEndingsCount = totalEndingsInDoor,
            missingFragments = missingFrags,
            branches = branches.take(12),
            trueEndingHint = gapHint
        )
    }

    fun createJigsawTiles(): List<Int> {
        val solved = (0..8).toList()
        var current = solved.shuffled()
        if (current == solved) {
            current = listOf(1, 0, 2, 3, 4, 5, 6, 7, 8)
        }
        return current
    }

    fun swapJigsawTiles(tiles: List<Int>, idxA: Int, idxB: Int): Pair<List<Int>, Boolean> {
        if (idxA !in tiles.indices || idxB !in tiles.indices) return tiles to false
        val mut = tiles.toMutableList()
        val tmp = mut[idxA]
        mut[idxA] = mut[idxB]
        mut[idxB] = tmp
        val won = mut == (0..8).toList()
        return mut to won
    }

    fun renderInkWashEndingCardBitmap(
        dungeonName: String,
        dungeonIndex: String,
        ending: EndingPresentation,
        unlockedTitlesCount: Int
    ): Bitmap {
        val width = 1080
        val height = 1480
        val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)

        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG)
        bgPaint.shader = LinearGradient(
            0f, 0f, 0f, height.toFloat(),
            intArrayOf(Color.parseColor("#0A0A0E"), Color.parseColor("#14151D"), Color.parseColor("#08080B")),
            floatArrayOf(0f, 0.55f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), bgPaint)

        // Subtle mist mountains
        val mountainPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#1C1F2A")
            style = Paint.Style.FILL
        }
        val mPath = android.graphics.Path().apply {
            moveTo(0f, 1140f)
            lineTo(240f, 940f)
            lineTo(520f, 1080f)
            lineTo(810f, 890f)
            lineTo(1080f, 1050f)
            lineTo(1080f, 1480f)
            lineTo(0f, 1480f)
            close()
        }
        canvas.drawPath(mPath, mountainPaint)

        // Gold outer & inner border
        val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#C9A962")
            style = Paint.Style.STROKE
            strokeWidth = 3f
        }
        canvas.drawRoundRect(RectF(48f, 48f, width - 48f, height - 48f), 18f, 18f, borderPaint)
        borderPaint.alpha = 110
        borderPaint.strokeWidth = 1.5f
        canvas.drawRoundRect(RectF(68f, 68f, width - 68f, height - 68f), 12f, 12f, borderPaint)

        val goldPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#C9A962")
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create(Typeface.SERIF, Typeface.BOLD)
            textSize = 36f
            letterSpacing = 0.18f
        }
        canvas.drawText("INFINITE GATES · 無 盡 之 門", width / 2f, 148f, goldPaint)

        val subPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#9C9482")
            textAlign = Paint.Align.CENTER
            textSize = 30f
        }
        canvas.drawText("$dungeonIndex · $dungeonName", width / 2f, 210f, subPaint)

        // Gate motif circle
        val gateRing = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = if (ending.isGood) Color.parseColor("#D4AF37") else Color.parseColor("#8A4A4A")
            style = Paint.Style.STROKE
            strokeWidth = 4f
        }
        canvas.drawCircle(width / 2f, 360f, 78f, gateRing)
        val archPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = gateRing.color
            style = Paint.Style.STROKE
            strokeWidth = 3f
        }
        canvas.drawRoundRect(RectF(width / 2f - 28f, 320f, width / 2f + 28f, 412f), 26f, 26f, archPaint)

        val catPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = if (ending.isGood) Color.parseColor("#E5C77B") else if (ending.isBad) Color.parseColor("#D46A6A") else Color.parseColor("#C9A962")
            textAlign = Paint.Align.CENTER
            textSize = 32f
        }
        canvas.drawText(ending.categoryLabel, width / 2f, 505f, catPaint)

        val titlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#EFE9D8")
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create(Typeface.SERIF, Typeface.BOLD)
            textSize = 62f
        }
        canvas.drawText(ending.title, width / 2f, 595f, titlePaint)

        // Divider line
        canvas.drawLine(180f, 645f, width - 180f, 645f, borderPaint)

        // Multiline desc wrap
        val bodyPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#D2CCB8")
            textAlign = Paint.Align.LEFT
            textSize = 33f
        }
        val descLines = wrapText(ending.desc, bodyPaint, width - 220f)
        var yPos = 720f
        for (line in descLines.take(8)) {
            canvas.drawText(line, 110f, yPos, bodyPaint)
            yPos += 54f
        }

        // Stats card
        val statBox = RectF(100f, 1130f, width - 100f, 1340f)
        val statBg = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#181A22")
            style = Paint.Style.FILL
        }
        canvas.drawRoundRect(statBox, 14f, 14f, statBg)
        canvas.drawRoundRect(statBox, 14f, 14f, borderPaint)

        val statPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#E4DEC9")
            textAlign = Paint.Align.LEFT
            textSize = 28f
        }
        canvas.drawText("歷時：${ending.elapsedFormatted}    探索場景：${ending.scenesVisitedCount}", 140f, 1200f, statPaint)
        val aliveText = if (ending.alivePartyNames.isEmpty()) "獨行者" else ending.alivePartyNames.joinToString("、")
        canvas.drawText("生還同行：$aliveText", 140f, 1255f, statPaint)
        canvas.drawText(
            "性格：冷靜 ${ending.personality.calm} · 利他 ${ending.personality.altruism} · 謹慎 ${ending.personality.cautious}    稱號：$unlockedTitlesCount",
            140f, 1308f, statPaint
        )

        // Verification seal
        val hashSrc = "${ending.title}|${ending.type}|${ending.elapsedFormatted}|$dungeonName"
        val digest = MessageDigest.getInstance("SHA-256").digest(hashSrc.toByteArray(Charsets.UTF_8))
        val sealCode = digest.take(6).joinToString("") { "%02X".format(it) }
        val sealPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#8A806B")
            textAlign = Paint.Align.CENTER
            typeface = Typeface.MONOSPACE
            textSize = 24f
        }
        canvas.drawText("水墨封緘印記 #$sealCode", width / 2f, 1405f, sealPaint)

        return bmp
    }

    private fun wrapText(text: String, paint: Paint, maxWidth: Float): List<String> {
        val result = ArrayList<String>()
        var current = StringBuilder()
        for (ch in text) {
            if (ch == '\n') {
                result.add(current.toString())
                current = StringBuilder()
                continue
            }
            val candidate = current.toString() + ch
            if (paint.measureText(candidate) > maxWidth && current.isNotEmpty()) {
                result.add(current.toString())
                current = StringBuilder().append(ch)
            } else {
                current.append(ch)
            }
        }
        if (current.isNotEmpty()) result.add(current.toString())
        return result
    }

    fun exportEndingCardPngAndShare(
        context: Context,
        dungeonName: String,
        dungeonIndex: String,
        ending: EndingPresentation,
        unlockedTitlesCount: Int
    ): Result<Intent> {
        return runCatching {
            val bmp = renderInkWashEndingCardBitmap(dungeonName, dungeonIndex, ending, unlockedTitlesCount)
            val cacheDir = File(context.cacheDir, "ending_cards").apply { mkdirs() }
            val outFile = File(cacheDir, "infinite_gates_ending_${System.currentTimeMillis()}.png")
            FileOutputStream(outFile).use { fos ->
                bmp.compress(Bitmap.CompressFormat.PNG, 95, fos)
            }
            val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", outFile)
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "image/png"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_TEXT, "【無盡之門】$dungeonName — 達成結局「${ending.title}」")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            Intent.createChooser(intent, "分享結局記憶卡")
        }
    }
}
