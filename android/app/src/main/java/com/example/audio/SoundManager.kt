package com.example.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import com.example.model.AudioThemeDef
import com.example.model.GameSettings
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Collections
import java.util.concurrent.atomic.AtomicInteger
import kotlin.math.PI
import kotlin.math.asin
import kotlin.math.exp
import kotlin.math.sin

enum class SoundEffect(val key: String) {
    DOOR_OPEN("door_open"),
    PAGE_TURN("page_turn"),
    RELIC_CHIME("relic_chime"),
    HURT("hurt"),
    HEAL("heal"),
    RAIN_DROP("rain_drop"),
    ENDING_GOOD("ending_good"),
    ENDING_BAD("ending_bad"),
    TYPE_CLICK("type_click")
}

/**
 * SoundManager backed by Android [MediaPlayer] for looping ambient background tracks
 * per door/scene mood and one-shot sound effects.
 *
 * Generates and caches compact procedural PCM WAV tracks in the app cache directory so
 * [MediaPlayer] can play distinct ambient loops and effects offline without external files.
 */
class SoundManager(context: Context) {

    private val cacheDir = File(context.cacheDir, "sound_cache").apply { mkdirs() }
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private var ambientPlayer: MediaPlayer? = null
    private val activeSfxPlayers = Collections.synchronizedSet(mutableSetOf<MediaPlayer>())

    @Volatile
    private var settings: GameSettings = GameSettings()

    @Volatile
    private var isPaused: Boolean = false

    @Volatile
    private var currentTrackKey: String? = null

    private var lastDoorId: Int = 1
    private var lastSceneMood: String = "normal"
    private var lastThemes: Map<String, AudioThemeDef> = emptyMap()
    private var lastChords: Map<String, List<List<Double>>> = emptyMap()
    private val typeClickCounter = AtomicInteger(0)

    private val gameAudioAttributes: AudioAttributes by lazy {
        AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_GAME)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .build()
    }

    private val sfxAudioAttributes: AudioAttributes by lazy {
        AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_GAME)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
    }

    fun updateSettings(newSettings: GameSettings) {
        val oldSound = settings.soundEnabled
        val oldJukebox = settings.jukeboxTheme
        settings = newSettings
        if (!newSettings.soundEnabled) {
            stopBgm()
        } else {
            val vol = computeBgmVolume()
            runCatching { ambientPlayer?.setVolume(vol, vol) }
            if (!oldSound || oldJukebox != newSettings.jukeboxTheme) {
                playAmbientForDoor(
                    doorId = lastDoorId,
                    sceneMood = lastSceneMood,
                    themeOverride = newSettings.jukeboxTheme,
                    themes = lastThemes,
                    chordsFallback = lastChords
                )
            }
        }
    }

    fun setPaused(paused: Boolean) {
        isPaused = paused
        val player = ambientPlayer
        if (paused) {
            runCatching { if (player?.isPlaying == true) player.pause() }
        } else if (settings.soundEnabled) {
            runCatching {
                if (player != null && !player.isPlaying) {
                    val vol = computeBgmVolume()
                    player.setVolume(vol, vol)
                    player.start()
                }
            }
        }
    }

    fun playAmbientForDoor(
        doorId: Int,
        sceneMood: String = "normal",
        themeOverride: String? = settings.jukeboxTheme,
        themes: Map<String, AudioThemeDef> = lastThemes,
        chordsFallback: Map<String, List<List<Double>>> = lastChords
    ) {
        lastDoorId = doorId
        lastSceneMood = sceneMood
        lastThemes = themes
        lastChords = chordsFallback

        if (!settings.soundEnabled) {
            stopBgm()
            return
        }

        val trackKey = resolveAmbientTrackKey(doorId, sceneMood, themeOverride)
        if (trackKey == currentTrackKey && ambientPlayer != null) {
            val vol = computeBgmVolume()
            runCatching {
                ambientPlayer?.setVolume(vol, vol)
                if (!isPaused && ambientPlayer?.isPlaying == false) {
                    ambientPlayer?.start()
                }
            }
            return
        }
        currentTrackKey = trackKey

        scope.launch {
            val wavFile = ensureAmbientWavFile(trackKey, doorId, sceneMood, themeOverride, themes, chordsFallback)
            if (trackKey != currentTrackKey || !settings.soundEnabled) return@launch
            startAmbientMediaPlayer(wavFile)
        }
    }

    fun startBgm(
        dungeonId: Int,
        themeOverride: String?,
        themes: Map<String, AudioThemeDef>,
        chordsFallback: Map<String, List<List<Double>>>,
        sceneMood: String = "normal"
    ) {
        playAmbientForDoor(dungeonId, sceneMood, themeOverride, themes, chordsFallback)
    }

    fun stopBgm() {
        currentTrackKey = null
        releaseAmbientPlayer()
    }

    fun playDoorSound() = playEffect(SoundEffect.DOOR_OPEN)

    fun playEndingDrum(isGood: Boolean) {
        playEffect(if (isGood) SoundEffect.ENDING_GOOD else SoundEffect.ENDING_BAD)
    }

    fun playTypeClick() {
        if (!settings.soundEnabled || isPaused) return
        if (typeClickCounter.incrementAndGet() % 4 != 0) return
        playEffect(SoundEffect.TYPE_CLICK)
    }

    fun playSfx(kind: String) {
        val effect = when (kind) {
            "bell", "relic" -> SoundEffect.RELIC_CHIME
            "page" -> SoundEffect.PAGE_TURN
            "hurt" -> SoundEffect.HURT
            "heal" -> SoundEffect.HEAL
            "rain" -> SoundEffect.RAIN_DROP
            else -> SoundEffect.PAGE_TURN
        }
        playEffect(effect)
    }

    fun playEffect(effect: SoundEffect) {
        if (!settings.soundEnabled || isPaused) return
        val vol = computeSfxVolume(effect)
        if (vol <= 0.002f) return
        if (activeSfxPlayers.size >= 4) return

        scope.launch {
            val wavFile = ensureSfxWavFile(effect)
            runCatching {
                val mp = MediaPlayer()
                activeSfxPlayers.add(mp)
                mp.setAudioAttributes(sfxAudioAttributes)
                mp.setDataSource(wavFile.absolutePath)
                mp.setVolume(vol, vol)
                mp.setOnPreparedListener { prepared ->
                    if (!isPaused && settings.soundEnabled) {
                        runCatching { prepared.start() }
                    } else {
                        activeSfxPlayers.remove(prepared)
                        runCatching { prepared.release() }
                    }
                }
                mp.setOnCompletionListener { done ->
                    activeSfxPlayers.remove(done)
                    runCatching { done.release() }
                }
                mp.setOnErrorListener { failed, _, _ ->
                    activeSfxPlayers.remove(failed)
                    runCatching { failed.release() }
                    true
                }
                mp.prepareAsync()
            }
        }
    }

    fun release() {
        stopBgm()
        val copy = synchronized(activeSfxPlayers) { activeSfxPlayers.toList() }
        activeSfxPlayers.clear()
        copy.forEach { mp ->
            runCatching {
                if (mp.isPlaying) mp.stop()
                mp.release()
            }
        }
        scope.cancel()
    }

    private fun computeBgmVolume(): Float =
        (settings.masterVolume * settings.bgmVolume * 0.45f).coerceIn(0f, 1f)

    private fun computeSfxVolume(effect: SoundEffect): Float {
        val factor = if (effect == SoundEffect.TYPE_CLICK) 0.16f else 0.65f
        return (settings.masterVolume * settings.sfxVolume * factor).coerceIn(0f, 1f)
    }

    @Synchronized
    private fun releaseAmbientPlayer() {
        ambientPlayer?.let { mp ->
            runCatching {
                if (mp.isPlaying) mp.stop()
                mp.reset()
                mp.release()
            }
        }
        ambientPlayer = null
    }

    @Synchronized
    private fun startAmbientMediaPlayer(wavFile: File) {
        releaseAmbientPlayer()
        runCatching {
            val mp = MediaPlayer()
            mp.setAudioAttributes(gameAudioAttributes)
            mp.setDataSource(wavFile.absolutePath)
            mp.isLooping = true
            val vol = computeBgmVolume()
            mp.setVolume(vol, vol)
            mp.setOnPreparedListener { prepared ->
                if (!isPaused && settings.soundEnabled && ambientPlayer === prepared) {
                    runCatching { prepared.start() }
                }
            }
            mp.setOnErrorListener { failed, _, _ ->
                if (ambientPlayer === failed) ambientPlayer = null
                runCatching { failed.release() }
                true
            }
            ambientPlayer = mp
            mp.prepareAsync()
        }
    }

    private fun ensureAmbientWavFile(
        trackKey: String,
        doorId: Int,
        sceneMood: String,
        themeOverride: String?,
        themes: Map<String, AudioThemeDef>,
        chordsFallback: Map<String, List<List<Double>>>
    ): File {
        val file = File(cacheDir, "ambient_$trackKey.wav")
        if (file.exists() && file.length() > 44L) return file

        val resolvedKey = themeOverride ?: doorId.toString()
        val theme = themes[resolvedKey]
        val baseChords = theme?.chords?.takeIf { it.isNotEmpty() }
            ?: chordsFallback[doorId.toString()]?.takeIf { it.isNotEmpty() }
            ?: listOf(listOf(110.0, 164.81), listOf(98.0, 146.83), listOf(130.81, 196.0), listOf(87.31, 130.81))

        val pitchScale = when (normalizeMood(sceneMood)) {
            "danger" -> 0.88
            "safe" -> 1.06
            "mystery" -> 0.94
            else -> 1.0
        }
        val wave = if (normalizeMood(sceneMood) == "danger") "triangle" else (theme?.o1 ?: "sine")

        val sampleRate = 16000
        val chordSec = 2.0
        val chordsToRender = baseChords.take(4)
        val totalSamples = (sampleRate * chordSec * chordsToRender.size).toInt()
        val samples = ShortArray(totalSamples)
        val perChord = (sampleRate * chordSec).toInt()

        for (cIdx in chordsToRender.indices) {
            val freqs = chordsToRender[cIdx].map { it * pitchScale }
            val norm = 1.0 / freqs.size.coerceAtLeast(1)
            val baseOffset = cIdx * perChord
            for (i in 0 until perChord) {
                val tSec = i.toDouble() / sampleRate
                val progress = i.toDouble() / perChord
                val fadeIn = (progress / 0.18).coerceAtMost(1.0)
                val fadeOut = ((1.0 - progress) / 0.25).coerceAtMost(1.0)
                val env = fadeIn * fadeOut * 0.42
                var sum = 0.0
                for (f in freqs) {
                    val phase = 2.0 * PI * f * tSec
                    sum += if (wave == "triangle") (2.0 / PI) * asin(sin(phase)) else sin(phase)
                }
                val idx = baseOffset + i
                if (idx < totalSamples) {
                    samples[idx] = (sum * norm * env * Short.MAX_VALUE)
                        .toInt()
                        .coerceIn(-32767, 32767)
                        .toShort()
                }
            }
        }

        val wavBytes = buildWavBytes(samples, sampleRate)
        FileOutputStream(file).use { it.write(wavBytes) }
        return file
    }

    private fun ensureSfxWavFile(effect: SoundEffect): File {
        val file = File(cacheDir, "sfx_${effect.key}.wav")
        if (file.exists() && file.length() > 44L) return file

        val sampleRate = 22050
        val samples = when (effect) {
            SoundEffect.DOOR_OPEN -> renderSweep(135.0, 44.0, 260, sampleRate, 0.72)
            SoundEffect.PAGE_TURN -> renderSweep(440.0, 720.0, 85, sampleRate, 0.35)
            SoundEffect.RELIC_CHIME -> renderChord(listOf(523.25, 659.25, 783.99), 380, sampleRate, 0.55)
            SoundEffect.HURT -> renderSweep(190.0, 58.0, 220, sampleRate, 0.65)
            SoundEffect.HEAL -> renderChord(listOf(392.0, 493.88, 587.33), 340, sampleRate, 0.5)
            SoundEffect.RAIN_DROP -> renderChord(listOf(320.0, 480.0), 120, sampleRate, 0.3)
            SoundEffect.ENDING_GOOD -> renderChord(listOf(261.63, 329.63, 392.0, 523.25), 850, sampleRate, 0.65)
            SoundEffect.ENDING_BAD -> renderSweep(96.0, 30.0, 620, sampleRate, 0.75)
            SoundEffect.TYPE_CLICK -> renderChord(listOf(840.0), 18, sampleRate, 0.25)
        }
        val wavBytes = buildWavBytes(samples, sampleRate)
        FileOutputStream(file).use { it.write(wavBytes) }
        return file
    }

    companion object {
        fun normalizeMood(sceneMood: String): String {
            return when (sceneMood.lowercase()) {
                "danger", "horror", "chase", "tense" -> "danger"
                "safe", "calm", "warm", "dawn" -> "safe"
                "mystery", "mirror", "void" -> "mystery"
                else -> "normal"
            }
        }

        fun resolveAmbientTrackKey(doorId: Int, sceneMood: String, themeOverride: String?): String {
            val mood = normalizeMood(sceneMood)
            val base = themeOverride?.replace(Regex("[^a-zA-Z0-9_]"), "_") ?: "d$doorId"
            return "${base}_$mood"
        }

        fun buildWavBytes(samples: ShortArray, sampleRate: Int): ByteArray {
            val dataSize = samples.size * 2
            val byteRate = sampleRate * 2
            val out = ByteArrayOutputStream(44 + dataSize)
            val header = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN).apply {
                put("RIFF".toByteArray(Charsets.US_ASCII))
                putInt(36 + dataSize)
                put("WAVE".toByteArray(Charsets.US_ASCII))
                put("fmt ".toByteArray(Charsets.US_ASCII))
                putInt(16) // PCM chunk size
                putShort(1) // PCM format
                putShort(1) // Mono
                putInt(sampleRate)
                putInt(byteRate)
                putShort(2) // Block align
                putShort(16) // Bits per sample
                put("data".toByteArray(Charsets.US_ASCII))
                putInt(dataSize)
            }
            out.write(header.array())
            val pcmBuf = ByteBuffer.allocate(dataSize).order(ByteOrder.LITTLE_ENDIAN)
            for (s in samples) pcmBuf.putShort(s)
            out.write(pcmBuf.array())
            return out.toByteArray()
        }

        private fun renderSweep(
            startFreq: Double,
            endFreq: Double,
            durationMs: Int,
            sampleRate: Int,
            gain: Double
        ): ShortArray {
            val count = (sampleRate * durationMs / 1000).coerceAtLeast(1)
            val buf = ShortArray(count)
            var phase = 0.0
            for (i in 0 until count) {
                val t = i.toDouble() / count
                val freq = startFreq + (endFreq - startFreq) * t
                val env = (1.0 - t) * (1.0 - exp(-t * 24.0))
                phase += 2.0 * PI * freq / sampleRate
                buf[i] = (sin(phase) * env * gain * Short.MAX_VALUE).toInt().coerceIn(-32767, 32767).toShort()
            }
            return buf
        }

        private fun renderChord(
            freqs: List<Double>,
            durationMs: Int,
            sampleRate: Int,
            gain: Double
        ): ShortArray {
            val count = (sampleRate * durationMs / 1000).coerceAtLeast(1)
            val buf = ShortArray(count)
            val norm = 1.0 / freqs.size.coerceAtLeast(1)
            for (i in 0 until count) {
                val tSec = i.toDouble() / sampleRate
                val progress = i.toDouble() / count
                val attack = (progress / 0.1).coerceAtMost(1.0)
                val release = ((1.0 - progress) / 0.35).coerceAtMost(1.0)
                var sum = 0.0
                for (f in freqs) sum += sin(2.0 * PI * f * tSec)
                buf[i] = (sum * norm * attack * release * gain * Short.MAX_VALUE)
                    .toInt()
                    .coerceIn(-32767, 32767)
                    .toShort()
            }
            return buf
        }
    }
}
