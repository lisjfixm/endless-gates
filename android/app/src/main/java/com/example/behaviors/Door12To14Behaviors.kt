package com.example.behaviors

object Door12BehaviorHandler : DoorBehaviorHandler {

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        if (sceneId == "d12_hub") {
            ctx.unlockAchievement("ach_v61_parallel_12_seen")
            return
        }
        if (sceneId.startsWith("d12_floor_")) {
            val floorNum = sceneId.removePrefix("d12_floor_").toIntOrNull() ?: return
            ctx.markD12FloorVisited(floorNum)
        }
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        if (sceneId == "d12_hub" && choiceIndex == 12) {
            for (f in 1..12) {
                ctx.markD12FloorVisited(f)
            }
            ctx.markDungeonCleared(12)
            ctx.unlockAchievement("ach_v61_parallel_12")
            ctx.unlockAchievement("ach_v61_fate_weaver")
            ctx.triggerEnding(
                "hidden_d12_all_floors",
                "十二平行時空總覽 · 萬門匯流",
                "你同時點亮了 1F 至 12F 全部十二道平行時空按鈕，見證了自己在每一扇門裡截然不同卻彼此牽繫的命運，最終帶著所有分歧的智慧走出迴廊電梯。",
                "第 12 扇門 · 全部平行時空完成"
            )
            return true
        }
        if (sceneId.startsWith("d12_floor_") && choiceIndex == 1) {
            val floorNum = sceneId.removePrefix("d12_floor_").toIntOrNull() ?: 1
            ctx.markD12FloorVisited(floorNum)
            ctx.markDungeonCleared(12)
            ctx.triggerEnding(
                "normal_d12_f$floorNum",
                "平行樓層 ${floorNum}F 的歸途",
                "你選擇了從第 ${floorNum} 樓踏出迴廊電梯。所有曾經走散的過往在這一刻凝結成真實的現在。",
                "第 12 扇門 · ${floorNum}F 結算"
            )
            return true
        }
        return false
    }
}

object Door13BehaviorHandler : DoorBehaviorHandler {

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        if (sceneId == "d13_ending_15") {
            ctx.markDungeonCleared(13)
            ctx.recordD13Ending("d13_ending_15", "十五之鏡 · 萬鏡歸一", isTrust = true, isShatter = false)
            ctx.unlockAchievement("ach_v62_d13_true_one")
            ctx.saveInheritance { it.copy(ngPlus = true) }
            return
        }
        val mRegex = Regex("^d13_m([1-7])_(trust|shatter)$")
        val match = mRegex.matchEntire(sceneId)
        if (match != null) {
            val num = match.groupValues[1]
            val mode = match.groupValues[2]
            val isTrust = mode == "trust"
            ctx.markDungeonCleared(13)
            ctx.recordD13Ending(
                sceneId,
                "第 $num 面鏡 · ${if (isTrust) "信任與擁抱" else "碎裂與割捨"}",
                isTrust = isTrust,
                isShatter = !isTrust
            )
        }
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        when (sceneId) {
            "d13_prologue" -> when (choiceIndex) {
                1 -> { ctx.openOutsiderDialog(13); return true }
                2 -> {
                    ctx.openCombat("corridor_shade", onWin = {
                        ctx.appendNarrative("<p class=\"inherit-note\">你擊退了鏡廳的「迴廊墨影守衛」，前方的鏡面走廊隨之敞開！</p>")
                    })
                    return true
                }
            }
            "d13_hub" -> if (choiceIndex == 8) {
                for (i in 1..7) {
                    ctx.recordD13Ending("d13_m${i}_trust", "第 $i 面鏡 · 信任", isTrust = true, isShatter = false)
                    ctx.recordD13Ending("d13_m${i}_shatter", "第 $i 面鏡 · 碎裂", isTrust = false, isShatter = true)
                }
                ctx.recordD13Ending("d13_ending_15", "十五之鏡 · 萬鏡歸一", isTrust = true, isShatter = false)
                ctx.markDungeonCleared(13)
                ctx.unlockAchievement("ach_v62_d13_true_one")
                ctx.unlockAchievement("ach_v62_d13_all_endings")
                ctx.triggerEnding(
                    "hidden_d13_e15",
                    "萬鏡全收束 · 唯一的真實",
                    "你透過共鳴一次性映照出七面雙向鏡的十四重結果，並與鏡廳中央的自己融為一體。",
                    "第 13 扇門 · 全 15 結局達成"
                )
                return true
            }
        }
        if (sceneId.startsWith("d13_m") && choiceIndex == 1) {
            val mRegex = Regex("^d13_m([1-7])_(trust|shatter)$")
            val match = mRegex.matchEntire(sceneId)
            val label = if (match != null) {
                val n = match.groupValues[1]
                val trust = match.groupValues[2] == "trust"
                "第${n}鏡 · ${if (trust) "信任倒影" else "破鏡前行"}"
            } else "鏡面抉擇"
            ctx.triggerEnding(
                if (sceneId.endsWith("trust")) "normal_$sceneId" else "survive_$sceneId",
                label,
                "你在鏡子迷宮的盡頭寫下了自己的選擇，踏出玻璃與光的交界。",
                "鏡子迷宮 · $label"
            )
            return true
        }
        if (sceneId == "d13_ending_15" && choiceIndex == 1) {
            ctx.triggerEnding(
                "hidden_d13_e15",
                "第十五號鏡像 · 真實的你",
                "你承認了自己一切的不完美與堅持，第十五扇沒有鏡框的門為你悄然敞開。",
                "第 13 扇門 · 真結局"
            )
            return true
        }
        return false
    }
}

object Door14BehaviorHandler : DoorBehaviorHandler {

    private data class D14EndingInfo(
        val type: String,
        val title: String,
        val desc: String,
        val reward: String,
        val isTrue: Boolean
    )

    private val ENDINGS = mapOf(
        "d14_end_true_grand_reunion" to D14EndingInfo("hidden_d14_grand_reunion", "萬門同歸 · 清晨之約", "三大聖殿信物共鳴，蘇晚、老趙、林醫生與你並肩走回人間早晨。", "v7.0 終極真結局 I", true),
        "d14_end_true_lab_dawn" to D14EndingInfo("hidden_d14_lab_dawn", "03:18 的第一縷晨光", "時間終於跨過停滯的凌晨三點十七分，實驗室窗台落下第一縷日光。", "v7.0 終極真結局 II", true),
        "d14_end_true_star_navigator" to D14EndingInfo("hidden_d14_star_navigator", "萬門星河領航員", "你握緊鍛造者的星辰權杖，為無數迷途靈魂照亮歸家的星圖航路。", "v7.0 終極真結局 III", true),
        "d14_end_true_author" to D14EndingInfo("hidden_d14_author", "寫下真實名字的人", "你在無盡手札末頁簽下所有同行者的真名，讓迴廊歸於現實。", "v7.0 終極真結局 IV", true),
        "d14_end_survive_suwan_duo" to D14EndingInfo("survive_d14_suwan", "與蘇晚同行的星路", "你與蘇晚牽手越過鍛造台邊緣，走向熱氣騰騰的陽春麵攤。", "逃過一劫 · 雙人行", false),
        "d14_end_survive_sentinel" to D14EndingInfo("survive_d14_sentinel", "星門守望者", "你替陳教授接班看守聖殿星盤，目送其他旅者歸返。", "逃過一劫 · 守望", false),
        "d14_end_survive_archivist" to D14EndingInfo("survive_d14_archivist", "十四扇門的見證者", "你封存十四門全部紀錄後由備用星門安全撤離。", "逃過一劫 · 檔案員", false),
        "d14_end_survive_scarred" to D14EndingInfo("survive_d14_scarred", "傷痕累累的生還", "縱然帶著數道擦傷與耗盡的藥劑，你仍靠意志跨出最後一檻。", "逃過一劫 · 生還", false),
        "d14_end_normal_amnesia" to D14EndingInfo("normal_d14_amnesia", "褪色的無盡走廊", "你醒在清晨的長椅上，記不起那十四扇門的詳細，只覺得心底很輕。", "普通結局 · 淡忘", false),
        "d14_end_normal_solo_wake" to D14EndingInfo("normal_d14_solo", "獨自甦醒的清晨", "醫院的監護儀發出長鳴，你緩緩睜眼看見清晨七點的天花板。", "普通結局 · 甦醒", false),
        "d14_end_bad_recursion" to D14EndingInfo("bad_d14_recursion", "無窮遞迴堆疊溢出", "未經校準的算式引發無盡遞迴，迴廊再度退回第一扇門的編號 13。", "壞結局 · 遞迴", false),
        "d14_end_bad_shortcircuit" to D14EndingInfo("bad_d14_shortcircuit", "聖殿核心短路", "強行連接未淨化的星辰回路導致聖殿跳閘陷入濃霧。", "壞結局 · 短路", false),
        "d14_end_bad_mobius" to D14EndingInfo("bad_d14_mobius", "莫比烏斯反面", "你誤踏莫比烏斯階梯的背面，在無窮對稱中迷失方向。", "壞結局 · 反面", false),
        "d14_end_bad_amber" to D14EndingInfo("bad_d14_amber", "時間琥珀封印", "停滯的 03:17 化作琥珀凝住整個空間，再無人來叩門。", "壞結局 · 琥珀", false)
    )

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        if (sceneId == "d14_prologue") {
            ctx.unlockAchievement("ach_v70_d14_enter")
            return
        }
        val info = ENDINGS[sceneId] ?: return
        if (!info.type.startsWith("bad_")) {
            ctx.markDungeonCleared(14)
        }
        if (info.isTrue) {
            ctx.unlockAchievement("ach_v70_d14_true_dawn")
            ctx.unlockAchievement("ach_v70_d14_all_home")
        }
        ctx.triggerEnding(info.type, info.title, info.desc, info.reward)
    }

    override fun isChoiceVisible(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        if (sceneId == "d14_forge_sanctum") {
            val hasAll = ctx.hasItem("d14_prime_key") && ctx.hasItem("d14_bond_compass") && ctx.hasItem("d14_truth_ledger")
            return when (choiceIndex) {
                0 -> hasAll
                1 -> ctx.hasItem("d14_truth_ledger")
                2 -> ctx.hasItem("d14_prime_key") || ctx.hasItem("d14_bond_compass")
                else -> true
            }
        }
        return true
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        when (sceneId) {
            "d14_console_hub" -> if (choiceIndex == 0) {
                if (ctx.hasItem("d14_prime_key")) {
                    ctx.appendNarrative("<p class=\"action\">你已握有「質數密鑰」。</p>")
                    return true
                }
                ctx.openPuzzle(
                    "質數聖殿 · 總控密鑰",
                    "請依序連綴最小的前四個基本質數（共四位數字）：",
                    "2357",
                    "最小四個質數是 2、3、5、7，寫在一起是 2357。"
                ) { ok ->
                    if (ok) {
                        ctx.addItem("d14_prime_key", "質數密鑰", "校準 2357 後從星辰控制台凝聚出的傳說密鑰。")
                        ctx.unlockAchievement("ach_v70_d14_console")
                        ctx.appendNarrative("<p class=\"inherit-note\">聖殿拱門發出清脆共鳴！獲得傳說信物【質數密鑰】。</p>")
                    } else {
                        ctx.damage(12)
                        ctx.appendNarrative("<p class=\"system-msg\">質數序列有誤，星塵灼傷了手背（生命 -12）。</p>")
                    }
                }
                return true
            }
            "d14_echo_gallery" -> if (choiceIndex == 0) {
                if (!ctx.hasItem("d14_bond_compass")) {
                    ctx.addItem("d14_bond_compass", "四重羈絆星盤", "凝聚蘇晚、老趙、陳姐與門外之人共鳴的信物。")
                    ctx.unlockAchievement("ach_v70_d14_echoes")
                    ctx.heal(100)
                    ctx.addStress(-40)
                    ctx.appendNarrative("<p class=\"inherit-note\">四道光影同時向你伸出手，你的傷勢完全癒合（HP 回滿），並獲得【四重羈絆星盤】！</p>")
                } else {
                    ctx.appendNarrative("<p class=\"action\">長廊裡的迴聲依然溫暖地伴隨在你身邊。</p>")
                }
                return true
            }
            "d14_archive_vault" -> if (choiceIndex == 0) {
                if (ctx.hasItem("d14_truth_ledger")) {
                    ctx.appendNarrative("<p class=\"action\">「03:18 質數手帳」已在你手中。</p>")
                    return true
                }
                ctx.openPuzzle(
                    "時間檔案庫 · 破曉密碼匣",
                    "請輸入跨越停滯時刻的最終黎明四位時間碼（時兩位＋分兩位）：",
                    "0318",
                    "03:17 之後的第一個早晨瞬間即 0318。"
                ) { ok ->
                    if (ok) {
                        ctx.addItem("d14_truth_ledger", "03:18 質數手帳", "記載全部十四道門真實座標的傳說級手札。")
                        ctx.unlockAchievement("ach_v70_d14_forge")
                        ctx.appendNarrative("<p class=\"inherit-note\">時間匣緩緩敞開，獲得傳說信物【03:18 質數手帳】！</p>")
                    } else {
                        ctx.damage(10)
                    }
                }
                return true
            }
        }
        return false
    }
}
