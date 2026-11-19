package com.example.behaviors

object Door4BehaviorHandler : DoorBehaviorHandler {

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        when (sceneId) {
            "heart" -> ctx.unlockAchievement("ach_d4_heart")
            "old_mirror" -> markOldDoor(ctx, "d4_old_mirror")
            "old_library" -> markOldDoor(ctx, "d4_old_library")
            "old_hospital" -> markOldDoor(ctx, "d4_old_hospital")
            "end_cycle" -> ctx.triggerEnding("normal_d4_cycle", "再走一次", "你推開迴廊之門再次走進白牆之間，這次腳步沉穩了許多。", "普通結局 · 循環")
            "end_release" -> {
                ctx.markDungeonCleared(4)
                ctx.triggerEnding("normal_d4_release", "釋懷的微光", "你與過去和解，門後的霧氣化作清晨微光。", "普通結局 · 釋懷")
            }
            "end_handoff" -> {
                ctx.markDungeonCleared(4)
                ctx.triggerEnding("survive_d4_handoff", "接過提燈", "守門人卸下長年的倦意，你替他繼續站在門前。", "逃過一劫 · 交棒")
            }
            "end_shatter" -> ctx.triggerEnding("bad_d4_shatter", "碎裂的心臟", "沒有任何記憶錨定的迴廊同時崩塌成無數白色碎片。", "壞結局 · 碎裂")
            "end_lantern" -> {
                ctx.markDungeonCleared(4)
                ctx.unlockAchievement("ach_d4_lantern")
                ctx.triggerEnding("survive_d4_lantern", "為誰留一盞燈", "你沒有立刻離開，而是蹲在門邊替還在黑暗裡摸索的人留了一道縫。", "逃過一劫 · 留燈")
            }
            "end_return" -> {
                ctx.markDungeonCleared(4)
                ctx.triggerEnding("normal_d4_return", "帶著三扇門回家", "你對三段記憶輕輕點頭，沿著門外真實的柏油路走回家去。", "普通結局 · 歸途")
            }
            "end_true" -> {
                ctx.markDungeonCleared(4)
                ctx.unlockAchievement("ach_d4_true")
                ctx.triggerEnding("hidden_d4_true", "無盡之間 · 萬門歸一", "你集齊了分散於三扇門的九枚迴廊碎片，伸手觸碰門心那道無縫之縫，迎來晨光。", "真結局 · 無盡之門")
            }
            "d4_end_v61_eternity" -> {
                ctx.markDungeonCleared(4)
                ctx.unlockAchievement("ach_v61_d4_eternity")
                ctx.triggerEnding("hidden_v61_d4_eternity", "永恆", "你在永遠的走廊中發現第零道門框，化為迴廊歷史本身的見證者「永恆」。", "v6.1 隱藏結局 · 永恆")
            }
            "d4_end_true_keepers" -> {
                ctx.markDungeonCleared(4)
                ctx.unlockAchievement("ach_d4_true")
                ctx.triggerEnding("hidden_d4_lantern_true", "點燈人的黎明", "你尋獲了燈芯密室的不滅火種，照亮了所有門後的歸途。", "真結局 · 提燈破曉")
            }
        }
    }

    private fun markOldDoor(ctx: BehaviorContext, flagKey: String) {
        ctx.setFlag(flagKey, true)
        if (ctx.hasFlag("d4_old_mirror") && ctx.hasFlag("d4_old_library") && ctx.hasFlag("d4_old_hospital")) {
            ctx.unlockAchievement("ach_d4_triptych")
        }
    }

    override fun isChoiceVisible(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean = when (sceneId) {
        "prologue" -> if (choiceIndex == 1) !ctx.hasFlag("d4_weighed_key") else true
        "heart" -> when (choiceIndex) {
            8 -> ctx.allFragmentsFound() || ctx.hasFlag("d4_old_mirror")
            9 -> !ctx.hasFlag("puz_mg_mg_d4")
            else -> true
        }
        "gate" -> when (choiceIndex) {
            0 -> !ctx.hasFlag("guard_q1")
            1 -> !ctx.hasFlag("guard_q2")
            2 -> !ctx.hasFlag("guard_q3")
            4 -> ctx.hasFlag("guard_q1") || ctx.hasFlag("guard_q2") || ctx.hasFlag("guard_q3")
            6 -> !ctx.hasFlag("puz_mg_mg_d4")
            8 -> !ctx.hasFlag("d4_opened_letter")
            else -> true
        }
        "choice_hall" -> when (choiceIndex) {
            4 -> ctx.hasFlag("guard_q3") || ctx.allFragmentsFound()
            5 -> ctx.hasFlag("d4_old_mirror") && ctx.hasFlag("d4_old_library") && ctx.hasFlag("d4_old_hospital")
            9 -> ctx.hasItem("d4_lantern_core")
            else -> true
        }
        else -> true
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        when (sceneId) {
            "prologue" -> if (choiceIndex == 1) {
                ctx.setFlag("d4_weighed_key", true)
                ctx.appendNarrative("<p class=\"inherit-note\">你在掌心掂著那把沒有齒的鑰匙，它比想像中還要重一分。</p>")
                return true
            }
            "heart" -> if (choiceIndex == 9) { ctx.openMiniGame("mg_d4", true); return true }
            "threshold_mark" -> if (choiceIndex == 0) {
                ctx.openPuzzle(
                    "謎題 · 你一共推開過幾扇門",
                    "走進無盡之間以前，你一共推開過幾扇有號碼的門？（輸入一個數字）",
                    "3",
                    "質數旅館、沉默圖書館、倒計時醫院——共 3 扇門。"
                ) { ok ->
                    if (ok) {
                        ctx.setFlag("puzzle_doors_done", true)
                        ctx.unlockAchievement("ach_d4_doormath")
                        ctx.appendNarrative("<p class=\"inherit-note\">地板上的刻痕發出柔和金光。</p>")
                    } else {
                        ctx.damage(10)
                    }
                }
                return true
            }
            "old_library" -> if (choiceIndex == 0) {
                ctx.appendNarrative("<p class=\"inherit-note\">你把書輕輕合上，沒有發出半點聲響。</p>")
                ctx.goToScene("heart")
                return true
            }
            "old_hospital" -> if (choiceIndex == 0) {
                if (!ctx.hasItem("paper_cat")) {
                    ctx.addItem("paper_cat", "紙摺的小貓", "六歲小女孩摺的紙貓，帶著醫院與海邊的微溫。")
                }
                ctx.goToScene("heart")
                return true
            }
            "gate" -> when (choiceIndex) {
                0 -> { ctx.setFlag("guard_q1", true); ctx.guardAsked(); return true }
                1 -> { ctx.setFlag("guard_q2", true); ctx.guardAsked(); return true }
                2 -> { ctx.setFlag("guard_q3", true); ctx.guardAsked(); return true }
                6 -> { ctx.openMiniGame("mg_d4", true); return true }
                8 -> {
                    ctx.setFlag("d4_opened_letter", true)
                    ctx.appendNarrative("<p class=\"inherit-note\">信封裡只有一張泛黃便條：「03:17 之後，別忘了看看 03:18 的早飯。」</p>")
                    return true
                }
            }
            "gate_time" -> if (choiceIndex == 0) {
                ctx.openPuzzle(
                    "謎題 · 倒下的時間",
                    "你還記得自己在實驗室螢幕前停下來的時間嗎？（格式：時:分）",
                    "3:17",
                    "從一開始時鐘就停在了 3:17。"
                ) { ok ->
                    if (ok) {
                        ctx.setFlag("door_recognized", true)
                        ctx.appendNarrative("<p class=\"inherit-note\">門扉低鳴了一聲，認可了你的存在。</p>")
                    } else {
                        ctx.damage(10)
                    }
                }
                return true
            }
            "choice_hall" -> if (choiceIndex == 6) {
                if (ctx.allFragmentsFound() || ctx.hasItem("d4_lantern_core")) {
                    ctx.goToScene("end_true")
                } else {
                    ctx.goToScene("end_shatter")
                }
                return true
            }
            "d4_secret_watchtower" -> if (choiceIndex == 0) {
                if (!ctx.hasItem("d4_lantern_core")) {
                    ctx.addItem("d4_lantern_core", "不滅燈芯", "守門人留下的傳說級火種。")
                }
                ctx.setFlag("d4_true_flag", true)
                ctx.goToScene("gate")
                return true
            }
        }
        return false
    }
}

object Door5BehaviorHandler : DoorBehaviorHandler {

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        when (sceneId) {
            "d5_prologue" -> ctx.unlockAchievement("ach_d5_sink")
            "d5_door_unspoken" -> { ctx.setFlag("d5_unspoken", true); ctx.checkUnchosen() }
            "d5_door_untaken" -> { ctx.setFlag("d5_untaken", true); ctx.checkUnchosen() }
            "d5_echo_self" -> if (!ctx.hasFlag("d5_met_self")) { ctx.setFlag("d5_met_self", true); ctx.addEcho(1) }
            "d5_papercat" -> {
                ctx.setFlag("d5_cat", true)
                if (!ctx.hasItem("paper_cat")) {
                    ctx.addItem("paper_cat", "紙摺的小貓", "摺得很拙劣。它從很深的地方漂上來，身上一個角都沒皺。")
                }
                ctx.addNote("d5_cat", "紙貓", "它跟著你漂過了四扇門。這次，你把它撈起來了。")
            }
            "d5_end_drown" -> ctx.triggerEnding("death_drown", "沉到底", "你放棄了划水。海收容了你，像收容所有沒走完的路——溫柔、安靜、不會再醒。", "死亡結局 · 沉沒")
            "d5_end_tide" -> ctx.triggerEnding("bad_tide", "漲潮", "你賴在退潮的海床上，忘記潮水會回來。海不會等人準備好。", "壞結局 · 吞沒")
            "d5_end_breath" -> {
                ctx.markDungeonCleared(5)
                ctx.triggerEnding("normal_breath", "在海裡呼吸", "你學會了在這片收容未竟之事的海裡呼吸——人不一定要上岸，也能活。", "普通結局 · 呼吸")
            }
            "d5_end_lighthouse" -> {
                ctx.markDungeonCleared(5)
                ctx.triggerEnding("survive_lighthouse", "點燈的人", "你在海心頂上把燈撥亮，為那些還沒學會呼吸的人照出一道方向。", "逃過一劫 · 點燈")
            }
            "d5_end_return" -> {
                ctx.markDungeonCleared(5)
                ctx.triggerEnding("normal_return", "上岸", "你回去看過那兩扇沒推的門。你從水裡走出來，腳邊的沙乾了一塊。", "普通結局 · 和解")
            }
            "d5_end_loop" -> ctx.triggerEnding("death_loop", "無限倒帶", "你用盡迴光粒想倒回落水前，卻把自己活成了一個無限重溫的迴圈。", "死亡結局 · 循環")
            "d5_end_true" -> {
                ctx.markDungeonCleared(5)
                ctx.unlockAchievement("ach_d5_true")
                ctx.triggerEnding("hidden_echo", "迴光之海", "你看完了兩扇未選的門，解開沉鐘與迴聲，撈起紙貓並走進海心。身後那些沒走過的路安靜地滅了。", "隱藏結局 · 真")
            }
            "d5_end_v61_deep_home" -> {
                ctx.markDungeonCleared(5)
                ctx.unlockAchievement("ach_v61_d5_deep")
                ctx.triggerEnding("hidden_v61_d5_deep_home", "深海歸鄉", "你順著海底發光的門框潛入最深的海溝，看見海面上倒映出的真實實驗室燈火，帶回所有未曾實現的「如果」。", "v6.1 隱藏結局 · 深海歸鄉")
            }
            "d5_end_true_starlight" -> {
                ctx.markDungeonCleared(5)
                ctx.unlockAchievement("ach_d5_true")
                ctx.triggerEnding("hidden_d5_starlight_true", "星光鋪就的歸航", "你在海心珊瑚密室找到了定潮星光，讓所有未選之路皆成坦途。", "真結局 · 星海歸航")
            }
        }
    }

    override fun isChoiceVisible(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean = when (sceneId) {
        "d5_shore" -> when (choiceIndex) {
            1 -> ctx.state.tide == "low"
            2 -> ctx.state.tide == "high"
            3 -> ctx.hasFlag("d5_tidepushed")
            6 -> !ctx.hasFlag("puz_mg_mg_d5")
            else -> true
        }
        "d5_well" -> if (choiceIndex == 4) !ctx.hasFlag("puz_mg_mg_d5") else true
        "d5_seabed" -> if (choiceIndex == 7) !ctx.hasFlag("d5_compass_taken") else true
        "d5_lighthouse" -> when (choiceIndex) {
            1 -> ctx.hasFlag("d5_echoes")
            3 -> !ctx.hasFlag("d5_conch_taken")
            else -> true
        }
        "d5_deepgate" -> when (choiceIndex) {
            1 -> ctx.hasFlag("d5_unspoken") && ctx.hasFlag("d5_untaken")
            3 -> ctx.state.echo > 0
            4 -> ctx.hasFlag("d5_unspoken") && ctx.hasFlag("d5_untaken") &&
                ctx.hasFlag("d5_recognized") && ctx.hasFlag("d5_echoes") &&
                ctx.hasFlag("d5_cat") && ctx.state.echo >= 2
            7 -> ctx.hasItem("d5_tide_bottle")
            else -> true
        }
        else -> true
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        when (sceneId) {
            "d5_shore" -> if (choiceIndex == 6) { ctx.openMiniGame("mg_d5", true); return true }
            "d5_well" -> when (choiceIndex) {
                0 -> {
                    val order = listOf("still", "high", "low")
                    val nextTide = order[(order.indexOf(ctx.state.tide) + 1) % order.size]
                    ctx.setTide(nextTide)
                    ctx.setFlag("d5_tidepushed", true)
                    ctx.unlockAchievement("ach_d5_tidepushed")
                    val label = when (nextTide) { "high" -> "漲潮"; "low" -> "退潮"; else -> "平潮" }
                    ctx.appendNarrative("<p class=\"inherit-note\">井裡的潮頁翻了一頁。海在你腳邊換了方向——現在是「$label」。</p>")
                    return true
                }
                1 -> {
                    if (ctx.hasFlag("d5_well_solved")) {
                        ctx.appendNarrative("<p class=\"action\">井壁的字已經暗了。</p>")
                        return true
                    }
                    ctx.openPuzzle(
                        "謎題 · 海的心跳",
                        "井壁刻著：潮水晝夜，一漲一退。\n一個太陽日裡，海的心總共搏動幾回？（輸入一個數字）",
                        "2",
                        "一天兩回潮汐呼吸。"
                    ) { ok ->
                        if (ok) {
                            ctx.setFlag("d5_well_solved", true)
                            ctx.addEcho(1)
                            ctx.addNote("d5_well", "海的心跳", "一漲，一退。一天兩回。")
                            ctx.appendNarrative("<p class=\"inherit-note\">一粒新的迴光粒落到你掌心（+1）。</p>")
                        }
                    }
                    return true
                }
                2 -> {
                    if (!ctx.hasFlag("d5_well_picked")) {
                        ctx.setFlag("d5_well_picked", true)
                        ctx.addEcho(1)
                        ctx.appendNarrative("<p class=\"inherit-note\">你拾起井沿縫裡那粒迴光粒（+1）。</p>")
                    }
                    return true
                }
                4 -> { ctx.openMiniGame("mg_d5", true); return true }
            }
            "d5_seabed" -> when (choiceIndex) {
                3 -> {
                    if (!ctx.hasFlag("d5_seabed_picked")) {
                        ctx.setFlag("d5_seabed_picked", true)
                        ctx.addEcho(1)
                        ctx.appendNarrative("<p class=\"inherit-note\">迴光粒落在掌心（+1）。</p>")
                    }
                    return true
                }
                7 -> {
                    ctx.setFlag("d5_compass_taken", true)
                    ctx.grantRelicV5("d5_compass")
                    ctx.appendNarrative("<p class=\"inherit-note\">你撿起了停擺的【生鏽的指南針】（迴光遺物）。</p>")
                    return true
                }
            }
            "d5_chapel" -> if (choiceIndex == 0) {
                if (ctx.hasFlag("d5_recognized")) {
                    ctx.appendNarrative("<p class=\"action\">海早就認得你了。</p>")
                    return true
                }
                ctx.openPuzzle(
                    "謎題 · 沉鐘之時",
                    "鐘停在你倒下的那個凌晨。（格式：時:分）",
                    "3:17",
                    "你盯著那個時間太久了——3:17。"
                ) { ok ->
                    if (ok) {
                        ctx.setFlag("d5_recognized", true)
                        ctx.addEcho(1)
                        ctx.addNote("d5_time", "三點十七分", "沉鐘認出了這個時間。")
                        ctx.checkWatcher()
                        ctx.appendNarrative("<p class=\"inherit-note\">鐘溫溫地震了一下，一粒迴光粒浮了上來（+1）。</p>")
                    }
                }
                return true
            }
            "d5_raft" -> if (choiceIndex == 2) {
                if (!ctx.hasFlag("d5_raft_picked")) {
                    ctx.setFlag("d5_raft_picked", true)
                    ctx.addEcho(1)
                    ctx.appendNarrative("<p class=\"inherit-note\">迴光粒落在掌心（+1）。</p>")
                }
                return true
            }
            "d5_lighthouse" -> when (choiceIndex) {
                0 -> {
                    if (ctx.hasFlag("d5_echoes")) {
                        ctx.appendNarrative("<p class=\"action\">海已經給過你答案。</p>")
                        return true
                    }
                    ctx.openPuzzle(
                        "謎題 · 迴聲之數",
                        "十三次迴聲，其中三次是空的。真正還在等你的迴聲有幾次？（輸入一個數字）",
                        "10",
                        "十三減三等於十。"
                    ) { ok ->
                        if (ok) {
                            ctx.setFlag("d5_echoes", true)
                            ctx.addEcho(1)
                            ctx.addNote("d5_echoes", "迴聲之數", "十三減三等於十。")
                            ctx.checkWatcher()
                            ctx.appendNarrative("<p class=\"inherit-note\">燈光頓了一下，海面只餘十道輕柔的回聲（迴光 +1）。</p>")
                        }
                    }
                    return true
                }
                3 -> {
                    ctx.setFlag("d5_conch_taken", true)
                    ctx.grantRelicV5("d5_conch")
                    ctx.appendNarrative("<p class=\"inherit-note\">獲得迴光遺物：帶鹽霜的海螺。</p>")
                    return true
                }
            }
            "d5_echo_self" -> if (choiceIndex == 0) {
                ctx.appendNarrative("<p class=\"action\">他笑了一下，沉進水裡。你們終於不必再比較了。</p>")
                return true
            }
            "d5_secret_coral" -> if (choiceIndex == 0) {
                if (!ctx.hasItem("d5_tide_bottle")) {
                    ctx.addItem("d5_tide_bottle", "定潮玻璃瓶", "封存著平靜海面與星光的傳說級信物。")
                    ctx.addEcho(3)
                }
                ctx.goToScene("d5_seabed")
                return true
            }
        }
        return false
    }
}

object Door6BehaviorHandler : DoorBehaviorHandler {

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        when (sceneId) {
            "d6_desk" -> ctx.unlockAchievement("ach_d6_coffee")
            "d6_echo_suwan" -> { ctx.setFlag("d6_suwan_heard", true); ctx.checkVoices() }
            "d6_echo_yuanyuan" -> { ctx.setFlag("d6_yuanyuan_heard", true); ctx.checkVoices() }
            "d6_end_static" -> ctx.triggerEnding("bad_d6_static", "白噪音", "你切斷了所有門扉的觀測波段，意識化作了監視牆上一閃而過的雪花噪點。", "壞結局 · 訊號中斷")
            "d6_end_overwrite" -> ctx.triggerEnding("death_d6_overwrite", "覆寫失敗", "你試圖用亂數篡改迴廊的基準曲線，觸發底層強制回滾，一切重置回 13 號門。", "死亡結局 · 系統回滾")
            "d6_end_observer" -> {
                ctx.markDungeonCleared(6)
                ctx.triggerEnding("normal_d6_observer", "守望 03:17", "你選擇留在終焉觀測站，成為新一任觀測者。", "普通結局 · 觀測者")
            }
            "d6_end_broadcast" -> {
                ctx.markDungeonCleared(6)
                ctx.triggerEnding("survive_d6_broadcast", "向所有門廣播", "你用天線塔向整座無盡迴廊發送了 03:18 的黎明波段，為所有滯留的旅者打開出口。", "逃過一劫 · 破曉廣播")
            }
            "d6_end_paperplane" -> {
                ctx.markDungeonCleared(6)
                ctx.triggerEnding("normal_d6_paperplane", "飛出窗外的紙飛機", "紙飛機帶著六道門扉的記憶飛進了清晨的風裡。你跟隨它的航線走出了迴廊。", "普通結局 · 航線終點")
            }
            "d6_end_dawn" -> {
                ctx.markDungeonCleared(6)
                ctx.unlockAchievement("ach_d6_dawn")
                ctx.triggerEnding("hidden_d6_dawn", "03:18 的破曉", "你校準了質數曲線，聽見同伴回音並將時間撥向 03:18。那杯咖啡沒有灑在鍵盤上——手機亮起蘇晚的早安訊息。", "真結局 · 萬門破曉")
            }
            "d6_end_symphony" -> {
                ctx.markDungeonCleared(6)
                ctx.unlockAchievement("ach_d6_symphony")
                ctx.triggerEnding("hidden_d6_symphony", "六門共鳴", "當秒針跳向 03:18，蘇晚、老趙、陳姐、老周、林醫生、周敏與抱著紙貓的媛媛在同一道晨光中向你揮手道別。", "隱藏結局 · 六門共鳴")
            }
            "d6_end_v61_stillness" -> {
                ctx.markDungeonCleared(6)
                ctx.unlockAchievement("ach_v61_d6_still")
                ctx.triggerEnding("hidden_v61_d6_stillness", "靜止", "你在 03:17 與 03:18 的交界按下了鎖定開關，將半空中的咖啡與全體同伴的微笑定格於永恆的「靜止」之中。", "v6.1 隱藏結局 · 靜止")
            }
            "d6_observer_records" -> {
                ctx.unlockAchievement("ach_v59_d6_records")
                ctx.addNpcAffinity("prof_chen", 35)
                ctx.setFlag("d6_prof_records_seen", true)
            }
            "d6_end_prof_legacy" -> {
                ctx.markDungeonCleared(6)
                ctx.unlockAchievement("ach_d6_dawn")
                ctx.triggerEnding("hidden_v59_prof_legacy", "導師的病歷與傳承之燈", "兩代學者的腳步在觀測站重疊，三十年的守望終於在 03:18 的破曉交棒。", "真結局 · 師恩傳承")
            }
        }
    }

    override fun isChoiceVisible(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean = when (sceneId) {
        "d6_hub" -> if (choiceIndex == 7) !ctx.hasFlag("puz_mg_mg_d6") else true
        "d6_desk" -> when (choiceIndex) {
            0 -> !ctx.hasFlag("d6_got_mug")
            1 -> !ctx.hasFlag("d6_got_thesis")
            else -> true
        }
        "d6_monitors" -> if (choiceIndex == 4) !ctx.hasFlag("puz_mg_mg_d6") else true
        "d6_threshold" -> when (choiceIndex) {
            0 -> ctx.hasFlag("d6_prime_solved") && ctx.hasFlag("d6_freq_solved") &&
                ctx.hasFlag("d6_suwan_heard") && ctx.hasFlag("d6_yuanyuan_heard")
            1 -> ctx.hasFlag("d6_prime_solved") || ctx.hasFlag("d6_freq_solved")
            2 -> ctx.hasFlag("d6_freq_solved")
            5 -> ctx.hasFlag("d6_symphony_ready")
            else -> true
        }
        "d6_observer_records" -> if (choiceIndex == 1) ctx.hasItem("d6_prof_medical_chart") else true
        else -> true
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        when (sceneId) {
            "d6_hub" -> if (choiceIndex == 7) { ctx.openMiniGame("mg_d6", true); return true }
            "d6_desk" -> when (choiceIndex) {
                0 -> {
                    ctx.setFlag("d6_got_mug", true)
                    ctx.grantRelicV5("d6_mug")
                    ctx.appendNarrative("<p class=\"inherit-note\">那滴懸停的咖啡落回杯底，獲得遺物：裂紋咖啡杯。</p>")
                    return true
                }
                1 -> {
                    ctx.setFlag("d6_got_thesis", true)
                    ctx.grantRelicV5("d6_thesis")
                    ctx.addNote("d6_thesis_note", "第 7 個質數", "前六個質數依次是 2、3、5、7、11、13。第 7 個質數是 17。")
                    ctx.appendNarrative("<p class=\"inherit-note\">獲得遺物：質數分佈手稿末頁。</p>")
                    return true
                }
            }
            "d6_monitors" -> if (choiceIndex == 4) { ctx.openMiniGame("mg_d6", true); return true }
            "d6_server" -> if (choiceIndex == 0) {
                if (ctx.hasFlag("d6_prime_solved")) {
                    ctx.appendNarrative("<p class=\"action\">主機已經完成校準，曲線平穩收斂。</p>")
                    return true
                }
                ctx.openPuzzle(
                    "謎題 · 第七個質數",
                    "已確認前六個質數序列：2、3、5、7、11、13。\n請輸入緊隨 13 之後的下一個質數（即第 7 個質數）：",
                    "17",
                    "14, 15, 16 都是合數，13 之後第一個質數是 17。"
                ) { ok ->
                    if (ok) {
                        ctx.setFlag("d6_prime_solved", true)
                        ctx.unlockAchievement("ach_d6_prime")
                        ctx.addItem("d6_tuning_fork", "03:17 調諧音叉", "主機校準後彈出的音叉。")
                        ctx.addNote("d6_prime_calibrated", "主機已校準", "輸入 17 後偏離曲線終於閉合。")
                        ctx.appendNarrative("<p class=\"inherit-note\">你輸入 17！整條質數曲線平滑收斂，獲得【03:17 調諧音叉】。</p>")
                    } else {
                        ctx.damage(10)
                        ctx.appendNarrative("<p class=\"system-msg\">校準值錯誤（生命 -10）。</p>")
                    }
                }
                return true
            }
            "d6_roof" -> if (choiceIndex == 0) {
                if (ctx.hasFlag("d6_freq_solved")) {
                    ctx.appendNarrative("<p class=\"action\">天線塔已鎖定在 0318 波段。</p>")
                    return true
                }
                ctx.openPuzzle(
                    "謎題 · 破曉波段",
                    "秒針停在 03:17。要讓時間跨入下一分鐘迎來破曉，請輸入四位數字（時兩位+分兩位）：",
                    "0318",
                    "03:17 的下一分鐘是 03:18，輸入 0318。"
                ) { ok ->
                    if (ok) {
                        ctx.setFlag("d6_freq_solved", true)
                        ctx.unlockAchievement("ach_d6_frequency")
                        ctx.addItem("d6_dawn_tape", "破曉磁帶 03:18", "記錄著 03:18 黎明頻率與同伴回音的磁帶。")
                        ctx.addNote("d6_freq_note", "03:18 波段已鎖定", "分界門的鎖扣已經鬆開。")
                        ctx.appendNarrative("<p class=\"inherit-note\">轉盤停在 0318！獲得【破曉磁帶 03:18】。</p>")
                    } else {
                        ctx.damage(10)
                        ctx.appendNarrative("<p class=\"system-msg\">頻率失諧（生命 -10）。</p>")
                    }
                }
                return true
            }
            "d6_echo_console" -> if (choiceIndex == 0) {
                if (ctx.hasFlag("d6_symphony_ready")) {
                    ctx.appendNarrative("<p class=\"action\">六門共鳴磁帶已經合成完畢。</p>")
                    return true
                }
                ctx.openPuzzle(
                    "謎題 · 五門共鳴碼",
                    "前兩位＝第一扇門初始門牌號碼（13）\n後兩位＝第三扇門牆板下的無名者人數（14）",
                    "1314",
                    "13 與 14 合起來即 1314。"
                ) { ok ->
                    if (ok) {
                        ctx.setFlag("d6_symphony_ready", true)
                        ctx.addItem("d6_symphony_tape", "六門共鳴磁帶", "合成了前五門全部回聲的磁帶。")
                        ctx.addNote("d6_symphony_note", "六門共鳴磁帶", "13 號門與 14 個名字在真空管中合鳴。")
                        ctx.appendNarrative("<p class=\"inherit-note\">真空管亮起暖光！獲得【六門共鳴磁帶】。</p>")
                    } else {
                        ctx.appendNarrative("<p class=\"action\">真空管發出一聲低鳴，共鳴碼不對。</p>")
                    }
                }
                return true
            }
            "d6_observer_records" -> if (choiceIndex == 0) {
                if (!ctx.hasItem("d6_prof_medical_chart")) {
                    ctx.addItem("d6_prof_medical_chart", "陳教授的觀測者病歷與懷錶齒輪", "記載 OBSERVER-001 留守觀測站三十年的真實手記。")
                    ctx.appendNarrative("<p class=\"inherit-note\">已收好導師懷錶齒輪與病歷檔案。</p>")
                }
                return true
            }
        }
        return false
    }
}
