package com.example.behaviors

object Door1BehaviorHandler : DoorBehaviorHandler {

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        when (sceneId) {
            "lobby" -> {
                if (ctx.isNgPlus && !ctx.hasFlag("ngp_hint")) {
                    ctx.setFlag("ngp_hint", true)
                    ctx.appendNarrative("<p class=\"inherit-note\">二周目記憶滲出：你記得那扇一樓正門，記得七號房那面會裂的鏡子……這一次，你已經知道旅館的所有秘密。</p>")
                }
            }
            "death_stairs" -> ctx.triggerEnding("death_stairs", "踩空了的夜晚", "黑著燈往下摸的時候，第14級是空的。", "死亡結局 · 第14級")
            "room3_greedy" -> ctx.damage(15)
            "room3_search" -> ctx.damage(10)
            "death_void" -> ctx.triggerEnding("death_void", "合數的缺口", "你推開了一扇合數房門。門後沒有地板。", "死亡結局 · 合數門")
            "death_curiosity" -> {
                ctx.killPartyMember("akai")
                ctx.triggerEnding("death_curiosity", "門縫那邊", "你以為阿凱只是站在角落。你不知道他早就走到了門裡面——而且他在裡面，一直笑。", "死亡結局 · 門縫")
            }
            "survive_limb" -> {
                ctx.setFlag("lost_limb", true)
                ctx.killPartyMember("laozhou")
                ctx.triggerEnding("survive_limb", "少了一隻手的晨光", "你活下來了。口袋裡空了一截袖子。沒人知道老趙去哪裡了。", "逃過一劫 · 殘缺")
            }
            "death_force_together" -> ctx.triggerEnding("death_force_together", "擠進去的人", "老趙以為四個人擠一擠總能過去。門關上的聲音，是所有人一起。", "死亡結局 · 強行通行")
            "survive_sacrifice" -> {
                ctx.killPartyMember("laozhou")
                ctx.triggerEnding("survive_sacrifice", "打火機還留著", "你活下來了。老趙沒有。他的打火機在口袋裡還是溫的。", "逃過一劫 · 託付")
            }
            "survive_backdoor" -> {
                ctx.saveInheritance { it.copy(aloneEscape = true) }
                ctx.triggerEnding("survive_backdoor", "一個人的通道", "你從後面那扇小門爬了出去。走廊裡的燈還在閃，另外三個人還在等。", "逃過一劫 · 獨行")
            }
            "room5" -> ctx.setFlag("visited_5", true)
            "death_greedy" -> ctx.triggerEnding("death_greedy", "5號房的重量", "那把鑰匙不屬於這個房間。但你伸了手。門在你背後輕輕合上。", "死亡結局 · 貪婪")
            "death_mirror" -> ctx.triggerEnding("death_mirror", "鏡中客", "鏡子裡的你，比你先伸出手。你們換了位置。他在外面笑，你在裡面。", "死亡結局 · 鏡中")
            "basement" -> {
                ctx.unlockAchievement("ach_basement")
                ctx.addNote("note_basement", "地下室的證明", "圓形石室地面刻滿公式，最近一段開頭：「假設生命的意義存在，記為L……」。有人在這裡一輩子證明一個沒有答案的命題。")
            }
            "death_lobby" -> ctx.triggerEnding("death_lobby", "正門背後", "門後面不是街。是下一段沒有燈的走廊。", "死亡結局 · 正門")
            "death_mirror_rage" -> ctx.triggerEnding("death_mirror_rage", "鏡像的反擊", "你忘了這裡是它主場。你的影子被撕進玻璃，成了鏡框邊緣一道新裂痕。", "死亡結局 · 鏡像反擊")
            "hidden_mirror_door" -> {
                ctx.saveInheritance { it.copy(mirrorDefeated = true, goldenKey = true, trusted = true, suwanSurvived = true) }
                ctx.unlockAchievement("ach_true")
                ctx.triggerEnding("hidden_mirror_door", "沒有數字的那一側", "你沒殺死他，也沒被他替換。你把黃金鑰匙放進他手心。正門開在另一側。蘇晚拉著你的手跑進凌晨的微光。", "真結局 · 鏡中之鑰")
            }
            "ending_normal" -> {
                ctx.saveInheritance { it.copy(mirrorDefeated = true, firstCleared = true) }
                ctx.markDungeonCleared(1)
                ctx.unlockAchievement("ach_normal")
                ctx.triggerEnding("ending_normal", "質數的盡頭", "你憑藉邏輯擊潰了鏡像，帶出剩下的同伴。陽光灑在空曠的老街，那家旅館只剩一堵白牆。", "普通結局 · 逃出生天")
            }
            "survive_trade" -> {
                ctx.saveInheritance { it.copy(tradedAdmin = true, firstCleared = true) }
                ctx.markDungeonCleared(1)
                ctx.triggerEnding("survive_trade", "無償的交換", "管理員用正門鑰匙換走了你一段童年記憶。你活了下來，只是怎麼也想不起小時候那隻貓叫什麼名字。", "逃過一劫 · 交易")
            }
            "survive_hide" -> {
                ctx.saveInheritance { it.copy(aloneEscape = true) }
                ctx.markDungeonCleared(1)
                ctx.triggerEnding("survive_hide", "門後的影子", "你藏在管理員身後的陰影裡躲過了清算，自己一人悄悄逃出大門。", "逃過一劫 · 藏匿")
            }
            "admin_guest" -> {
                ctx.saveInheritance { it.copy(adminGuest = true) }
                ctx.triggerEnding("bad_admin_guest", "2號房的新住客", "「歡迎長期下榻，貴客。」管理員把黃銅房卡交給你。門牌上寫著「2」。", "壞結局 · 貴客")
            }
            "d1_service_exit" -> {
                ctx.markDungeonCleared(1)
                ctx.triggerEnding("survive_d1_service", "後巷的風", "你用一把不該出現在這裡的鑰匙，打開了一扇不該由你打開的門。你活下來了，帶著凌晨的冷風和一點煤炭味。", "逃過一劫")
            }
            "d1_loop_landing" -> ctx.findFragment("d1_loop")
            "d1_zero_room" -> ctx.findFragment("d1_mirror")
            "d1_behind_painting" -> ctx.unlockAchievement("ach_d1_painter")
            "d1_cellar" -> ctx.findFragment("d1_prime")
            "d1_secret_boiler" -> ctx.setFlag("d1_boiler_visited", true)
            "d1_end_v61_prime_cosmos" -> {
                ctx.markDungeonCleared(1)
                ctx.unlockAchievement("ach_v61_d1_cosmos")
                ctx.triggerEnding("hidden_v61_d1_prime_cosmos", "質數宇宙", "在 7 號鏡像崩裂前的一瞬，你解構了整座質數旅館的對稱方程式，躍遷至所有質數門扉交匯的星海「質數宇宙」。", "v6.1 隱藏結局 · 質數宇宙")
            }
            "d1_end_v70_architect" -> {
                ctx.markDungeonCleared(1)
                ctx.unlockAchievement("ach_v70_prime_architect")
                ctx.saveInheritance { it.copy(mirrorDefeated = true, goldenKey = true, basementKnowledge = true, firstCleared = true) }
                ctx.triggerEnding("hidden_v70_d1_architect", "質數定理的建築師", "你放棄與鏡像爭奪鑰匙，轉而重新排列了整座旅館的質數階梯，使 13 號門直接化作回家的迴廊起點。", "v7.0 隱藏結局 · 建築師")
            }
            "d1_end_suwan_true" -> {
                ctx.setFlag("golden_key", true); ctx.setFlag("trusted", true)
                ctx.markDungeonCleared(1)
                ctx.saveInheritance { it.copy(suwanSurvived = true, goldenKey = true, trusted = true, firstCleared = true) }
                ctx.triggerEnding("hidden_d1_suwan_true", "巷口的半碗陽春麵", "你完成了蘇晚支線並解開旅館最深處的秘密，與蘇晚一同回到真實的清晨。", "真結局 · 蘇晚支線圓滿")
            }
            "d1_end_zhao_true" -> {
                ctx.markDungeonCleared(1)
                ctx.saveInheritance { it.copy(suwanSurvived = true, laozhouSurvived = true, trusted = true, firstCleared = true) }
                ctx.triggerEnding("hidden_d1_zhao_true", "一個都沒少", "你化解了老趙的心魔，帶領全員毫髮無傷地走出質數旅館。", "真結局 · 老趙支線圓滿")
            }
            "d1_end_akai_true" -> {
                ctx.markDungeonCleared(1)
                ctx.saveInheritance { it.copy(mirrorDefeated = true, suwanSurvived = true, trusted = true, firstCleared = true) }
                ctx.triggerEnding("hidden_d1_akai_true", "第四名真人", "你賦予了鏡像少年阿凱真正的名字與靈魂，帶他走出了質數旅館。", "真結局 · 阿凱支線圓滿")
            }
            "d1_end_prime_master" -> {
                ctx.markDungeonCleared(1)
                ctx.saveInheritance { it.copy(mirrorDefeated = true, goldenKey = true, basementKnowledge = true, trusted = true, firstCleared = true) }
                ctx.triggerEnding("hidden_d1_prime_true", "質數定理的證明者", "你徹底解構了質數旅館的底層邏輯，達成完美真結局。", "真結局 · 完美破關")
            }
            "death_dark" -> {
                ctx.damage(100)
            }
            "pseudo_door" -> {
                ctx.triggerPseudoEnding(
                    "逃出生天",
                    "你推開大廳正門，凌晨五點的微風吹在臉上……等等。牆上的數位時鐘還是 03:17。",
                    "這是錯誤的出口——你們還在旅館的規則裡面。",
                    "return_lobby"
                )
            }
        }
    }

    override fun getText(ctx: BehaviorContext, sceneId: String): List<String>? = when (sceneId) {
        "return_lobby" -> {
            val count = 4 - (if (ctx.hasFlag("akai_dead")) 1 else 0) - (if (ctx.hasFlag("zhao_dead")) 1 else 0)
            listOf(
                "<p>你們回到一樓大廳。算上你，現在還剩下 $count 個人。</p>",
                "<p>大廳正門緊閉，鏡面般光滑的大理石地板倒映著四下搖曳的燈光。</p>",
                if (ctx.hasFlag("mirror_defeated_early")) "<p>櫃檯旁還殘留著一片碎玻璃，鏡像早已退回地下。</p>" else "<p>前台後面好像站著一個和你輪廓極為相似的身影。</p>"
            )
        }
        "mirror_final" -> {
            val base = mutableListOf(
                "<p>正門之前，那個「你」攔住了去路。它身上穿著和你一模一樣的大衣，連指節上的微傷都分毫不差。</p>"
            )
            if (ctx.inheritance.mirrorDefeated) {
                base.add("<p class=\"inherit-note\">【宿命餘韻】它看見你的瞬間，眼神閃過一絲畏懼——你曾經打破過它的邏輯一次。</p>")
            }
            base
        }
        "death_dark" -> listOf(
            "<p>黑暗迅速吞沒了走廊的最後一絲空氣。有冰涼的指尖搭上了你的後頸。</p>"
        )
        "survive_hide" -> listOf(
            "<p>你壓低呼吸，趁管理員俯身記錄的間隙，順著牆根溜進了門縫後。</p>"
        )
        else -> null
    }

    override fun isChoiceVisible(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean = when (sceneId) {
        "lobby" -> when (choiceIndex) {
            11 -> !ctx.hasFlag("puz_mg_mg_d1")
            12 -> ctx.isNgPlus
            13 -> ctx.getCounter("v58_lobby_searches") < 2
            else -> true
        }
        "corridor" -> when (choiceIndex) {
            11 -> !ctx.hasFlag("puz_mg_mg_d1")
            13 -> !ctx.hasFlag("v58_plastic_found")
            14 -> !ctx.hasFlag("arc_suwan_done")
            15 -> !ctx.hasFlag("zhao_dead") && !ctx.hasFlag("arc_zhao_done")
            16 -> !ctx.hasFlag("akai_dead") && !ctx.hasFlag("arc_akai_done")
            else -> true
        }
        "mirror_final" -> when (choiceIndex) {
            1 -> ctx.hasItem("golden_key") || ctx.inheritance.goldenKey
            2 -> ctx.inheritance.mirrorDefeated
            7 -> ctx.hasItem("d1_master_blank") && (ctx.hasItem("golden_key") || ctx.hasFlag("d1_true_flag"))
            else -> true
        }
        "basement" -> when (choiceIndex) {
            9 -> ctx.hasItem("rope") || ctx.hasItem("golden_key")
            else -> true
        }
        "d1_stairwell" -> when (choiceIndex) {
            1 -> ctx.hasItem("golden_key") || ctx.inheritance.goldenKey
            else -> true
        }
        else -> true
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        when (sceneId) {
            "lobby" -> when (choiceIndex) {
                6 -> { ctx.openDialogPanel(); return true }
                11 -> { ctx.openMiniGame("mg_d1", true); return true }
                12 -> {
                    ctx.setFlag("knows_mirror", true); ctx.setFlag("knows_2_trap", true); ctx.setFlag("knows_exit", true)
                    ctx.addNpcAffinity("suwan", 20); ctx.addNpcAffinity("laozhou", 20)
                    ctx.appendNarrative("<p class=\"inherit-note\">【二周目專屬揭示】你直接說出了「2號房是陷阱」與「7號房的鏡像秘密」，蘇晚與老趙震驚之餘對你的信任大幅提升！</p>")
                    return true
                }
                13 -> {
                    val cnt = ctx.incCounter("v58_lobby_searches")
                    if (cnt == 1) {
                        ctx.addItem("mint_candy", "薄荷糖", "櫃檯縫隙裡掉落的鐵盒糖果（普通），使用可減少 25% 壓力。")
                        ctx.appendNarrative("<p class=\"inherit-note\">你在櫃檯縫裡摸到一小盒薄荷糖！</p>")
                    } else {
                        ctx.addItem("suwan_water", "蘇晚的礦泉水", "蘇晚偷偷塞給你的未開封礦泉水（普通），使用可恢復 20 HP。")
                        ctx.appendNarrative("<p class=\"inherit-note\">你在長椅下找到一瓶未開封的礦泉水。</p>")
                    }
                    return true
                }
            }
            "detail" -> if (choiceIndex == 0) {
                ctx.openPuzzle(
                    "解謎 · 第一個安全房間",
                    "找一個數，它是兩個質數的乘積，且這兩個質數之和等於10。答案的各位數字之和，就是第一個安全房間。",
                    "3",
                    "21 是 3×7，兩個質數相加等於 10，2+1=3。或 5×5=25（同數不合題意通常 3×7=21，各位和為 3）。"
                ) { ok ->
                    if (ok) {
                        ctx.addItem("key3", "3號房鑰匙", "銅製鑰匙，柄上刻著「3」")
                        ctx.setFlag("puzzle1_done", true)
                        ctx.appendNarrative("<p class=\"inherit-note\">回答正確！暗格彈開，你取得了【3號房鑰匙】。</p>")
                        ctx.goToScene("corridor")
                    } else {
                        ctx.damage(10)
                        ctx.appendNarrative("<p class=\"system-msg\">計算錯誤，牌面傳來一陣刺骨寒意（生命 -10）。</p>")
                    }
                }
                return true
            }
            "corridor" -> when (choiceIndex) {
                0 -> {
                    if (ctx.hasItem("golden_key") || ctx.inheritance.goldenKey) {
                        ctx.goToScene("room5")
                    } else {
                        ctx.appendNarrative("<p class=\"action\">5號房的銅鎖紋絲不動——你需要一把特別的「黃金鑰匙」。</p>")
                    }
                    return true
                }
                8 -> {
                    if (!ctx.hasItem("rope")) {
                        ctx.addItem("rope", "應急逃生繩", "從走廊消防箱取出的尼龍結實長繩。")
                        ctx.appendNarrative("<p class=\"inherit-note\">你打開消防栓，在底層找到一卷應急逃生繩！</p>")
                    } else {
                        ctx.appendNarrative("<p class=\"action\">消防箱裡已經沒有其他東西了。</p>")
                    }
                    return true
                }
                11 -> { ctx.openMiniGame("mg_d1", true); return true }
                13 -> {
                    ctx.setFlag("v58_plastic_found", true)
                    ctx.addItem("keycard_lab", "實驗室門禁卡", "卡在 13 號門縫裡的磁條門禁卡，背面寫著「3:17」。")
                    ctx.appendNarrative("<p class=\"inherit-note\">你在門縫裡撿起了一張舊實驗室門禁卡。</p>")
                    return true
                }
            }
            "room7" -> if (choiceIndex == 0) {
                ctx.openPuzzle(
                    "解謎 · 安全的和",
                    "寫出10以內所有「安全的和」。安全意味著構成這個和的兩個質數，都對應真實存在的房間（2, 3, 5, 7）。（多個答案用逗號分隔）",
                    "8,10",
                    "能用兩個質數相加且在 10 以內的和：3+5=8，3+7=10。用逗號隔開輸入：8,10。"
                ) { ok ->
                    if (ok) {
                        ctx.setFlag("puzzle4_done", true)
                        ctx.goToScene("basement")
                    } else {
                        ctx.damage(15)
                        ctx.appendNarrative("<p class=\"system-msg\">答案錯誤，房間四壁逼近了半寸（生命 -15）。</p>")
                    }
                }
                return true
            }
            "basement" -> if (choiceIndex == 0) {
                ctx.openPuzzle(
                    "解謎 · 最終密碼",
                    "第一個數：最小的質數。第二個數：唯一的偶質數。第三個數：10以內最大的質數。第四個數：前面三個數之和的個位。",
                    "2271",
                    "最小質數是2，唯一偶質數也是2，10以內最大質數是7；2+2+7=11，個位是1 → 2271。"
                ) { ok ->
                    if (ok) {
                        ctx.addItem("main_key", "大門鑰匙", "銅製大鑰匙，柄上刻著「大門」")
                        ctx.setFlag("puzzle5_done", true)
                        if (ctx.hasFlag("puzzle1_done") && ctx.hasFlag("puzzle4_done")) {
                            ctx.unlockAchievement("ach_puzzles")
                        }
                        ctx.appendNarrative("<p class=\"inherit-note\">密碼正確！石台應聲彈開，你拿到了【大門鑰匙】。</p>")
                        ctx.goToScene("return_lobby")
                    } else {
                        ctx.damage(20)
                        ctx.appendNarrative("<p class=\"system-msg\">密碼錯了！石室傳來劇烈震動（生命 -20）。</p>")
                    }
                }
                return true
            }
            "mirror_final" -> when (choiceIndex) {
                0 -> {
                    ctx.addItem("key_second", "二樓備用鑰匙", "從鏡像碎片中凝結出的備用鑰匙。")
                    ctx.setFlag("mirror_defeated", true)
                    ctx.goToScene("ending_normal")
                    return true
                }
                1 -> {
                    ctx.goToScene("hidden_mirror_door")
                    return true
                }
                2 -> {
                    ctx.appendNarrative("<p class=\"inherit-note\">「原來……你也是怕黑的人。」你輕聲說出它沒說完的話。鏡像頓時沉默，往後退了半步。</p>")
                    ctx.goToScene("hidden_mirror_door")
                    return true
                }
            }
            "manager" -> when (choiceIndex) {
                0 -> {
                    ctx.setFlag("knows_2_trap", true)
                    ctx.appendNarrative("<p class=\"dialogue\">管理員微微一笑：「2號房當然可以進去……只是沒有住客走出過 2 號房。」</p>")
                    return true
                }
                1 -> {
                    ctx.setFlag("knows_mirror", true)
                    ctx.appendNarrative("<p class=\"dialogue\">管理員看著你們身後：「鏡子不會撒謊，它只會學人說話。」</p>")
                    return true
                }
                2 -> {
                    ctx.setFlag("knows_exit", true)
                    ctx.appendNarrative("<p class=\"dialogue\">「非質數？這整棟樓的數學定理只留給走得出去的 1 號門。」</p>")
                    return true
                }
                3 -> {
                    if (!ctx.hasItem("golden_key")) {
                        ctx.addItem("golden_key", "黃金鑰匙", "藏在管理員桌下地毯裡的純金鑰匙。")
                        ctx.setFlag("golden_key", true)
                        ctx.unlockAchievement("ach_golden")
                        ctx.appendNarrative("<p class=\"inherit-note\">你在地毯下摸到一把沉甸甸的【黃金鑰匙】！</p>")
                    } else {
                        ctx.appendNarrative("<p class=\"action\">地毯底下已經空了。</p>")
                    }
                    return true
                }
            }
            "mirror_reveal" -> if (choiceIndex == 2) {
                ctx.setFlag("mirror_defeated_early", true)
                ctx.addItem("key_second", "二樓備用鑰匙", "從鏡像破碎後掉落的銅鑰匙。")
                ctx.addItem("main_key", "大門鑰匙", "銅製大鑰匙")
                ctx.appendNarrative("<p class=\"inherit-note\">你提前看穿了邏輯悖論！鏡像在半空碎裂，掉落兩把關鍵鑰匙。</p>")
                ctx.goToScene("return_lobby")
                return true
            }
            "d1_loop_landing" -> if (choiceIndex == 0) {
                ctx.openPuzzle(
                    "解謎 · 0 號門",
                    "旅館的房號都是質數。2、3、5、7 之後，下一個質數是幾？敲門幾下，門才會開？（輸入一個數字）",
                    "11",
                    "8、9、10 都不是質數，下一個只能被 1 和自己整除的兩位數是 11。"
                ) { ok ->
                    if (ok) {
                        ctx.unlockAchievement("ach_d1_prime_knock")
                        ctx.goToScene("d1_zero_room")
                    } else {
                        ctx.appendNarrative("<p class=\"system-msg\">門沒有開。門縫那點金光滅了。後頸一緊。</p>")
                        ctx.damage(10)
                    }
                }
                return true
            }
            "d1_zero_room" -> if (choiceIndex == 1) {
                ctx.appendNarrative("<p>鏡子裡那個「蘇晚」的笑僵住了。然後一圈裂紋從她眉間爬開。</p>")
                ctx.markDungeonCleared(1)
                ctx.triggerEnding("hidden_d1_mirror_self", "鏡中屋", "你在一間不存在的房間裡，認出了一張不該有的臉。滿牆的門一齊倒下，門後只有迴廊與終於不笑了的「你」。", "隱藏結局", 1000L)
                return true
            }
            "d1_secret_boiler" -> if (choiceIndex == 0) {
                if (!ctx.hasItem("d1_master_blank")) {
                    ctx.addItem("d1_master_blank", "初代總鑰匙胚", "可同時契合正門與鏡像之門的傳說級鑰匙胚。")
                    ctx.setFlag("d1_true_flag", true)
                    ctx.appendNarrative("<p class=\"inherit-note\">獲得傳說物品：初代總鑰匙胚（已滿足質數旅館真結局隱藏條件）。</p>")
                }
                return true
            }
            "arc_suwan_1" -> if (choiceIndex == 0) { ctx.addNpcAffinity("suwan", 10); ctx.goToScene("arc_suwan_2"); return true }
            "arc_suwan_2" -> if (choiceIndex == 0) { ctx.addNpcAffinity("suwan", 10); ctx.goToScene("arc_suwan_3"); return true }
            "arc_suwan_3" -> if (choiceIndex == 0) {
                ctx.addItem("suwan_hairpin", "蘇晚的銀髮夾", "蘇晚託付給你的信物（稀有），象徵生死與共的信任。")
                ctx.addNpcAffinity("suwan", 15)
                ctx.goToScene("arc_suwan_4")
                return true
            }
            "arc_suwan_4" -> if (choiceIndex == 0) {
                ctx.setFlag("arc_suwan_done", true)
                ctx.unlockAchievement("ach_v58_suwan_arc")
                ctx.addNpcAffinity("suwan", 15)
                ctx.goToScene("arc_suwan_5")
                return true
            }
            "arc_zhao_1" -> if (choiceIndex == 0) { ctx.addNpcAffinity("laozhou", 10); ctx.goToScene("arc_zhao_2"); return true }
            "arc_zhao_2" -> if (choiceIndex == 0) { ctx.addNpcAffinity("laozhou", 15); ctx.goToScene("arc_zhao_3"); return true }
            "arc_zhao_3" -> if (choiceIndex == 0) { ctx.addNpcAffinity("laozhou", 15); ctx.goToScene("arc_zhao_4"); return true }
            "arc_zhao_4" -> if (choiceIndex == 0) {
                ctx.addItem("zhao_lighter", "老趙的黃銅打火機", "老趙隨身攜帶多年的防風打火機（稀有），可與氧氣瓶組合或照明。")
                ctx.setFlag("arc_zhao_done", true)
                ctx.unlockAchievement("ach_v58_zhao_arc")
                ctx.goToScene("arc_zhao_5")
                return true
            }
            "arc_akai_1" -> if (choiceIndex == 0) { ctx.addNpcAffinity("akai", 15); ctx.goToScene("arc_akai_2"); return true }
            "arc_akai_2" -> if (choiceIndex == 0) { ctx.addNpcAffinity("akai", 15); ctx.goToScene("arc_akai_3"); return true }
            "arc_akai_3" -> if (choiceIndex == 0) {
                ctx.addItem("akai_shard", "阿凱的逆轉碎片", "阿凱違抗旅館規則留下的鏡面結晶（稀有）。")
                ctx.setFlag("arc_akai_done", true)
                ctx.unlockAchievement("ach_v58_akai_arc")
                ctx.goToScene("arc_akai_4")
                return true
            }
        }
        return false
    }
}

object Door2BehaviorHandler : DoorBehaviorHandler {

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        when (sceneId) {
            "lobby_items" -> {
                ctx.addItem("bookmark", "泛黃書籤", "上面寫著：靜音是唯一的通行證。")
            }
            "lobby_secret" -> ctx.setFlag("lobby_searched", true)
            "reading_search" -> ctx.setFlag("reading_searched", true)
            "bookshelf" -> ctx.setFlag("at_bookshelf", true)
            "bookshelf_right" -> ctx.setFlag("bookshelf_right_done", true)
            "laozhou_route" -> ctx.setFlag("laozhou_followed", true)
            "fiction_zone" -> ctx.setFlag("fiction_explored", true)
            "reference_zone" -> {
                ctx.setFlag("explored_reference", true)
                ctx.setFlag("reference_clue", true)
            }
            "braille_zone" -> {
                ctx.setFlag("braille_found", true)
                ctx.setFlag("braille_groove", true)
            }
            "xiaoyu_route2" -> ctx.setFlag("xiaoyu_safe", true)
            "forbidden_zone" -> ctx.setFlag("at_forbidden", true)
            "yuanyuan_end" -> {
                if (!ctx.hasItem("yuanyuan_album")) {
                    ctx.addItem("yuanyuan_album", "媛媛的畫冊", "蠟筆畫著一隻又一隻沒有名字的貓。")
                }
            }
            "hidden_books_master" -> ctx.setFlag("master_clue", true)
            "basement" -> ctx.setFlag("visited_basement", true)
            "first_bell" -> ctx.setFlag("first_bell_done", true)
            "manager_book" -> {
                ctx.setFlag("manager_book_found", true)
                if (!ctx.hasItem("manager_book")) ctx.addItem("manager_book", "《第三任管理員》", "書背印著空白的書號。")
                if (!ctx.hasItem("exit_key")) ctx.addItem("exit_key", "地毯暗門鑰匙", "管理員悄悄留給懂規矩者的鑰匙。")
            }
            "groove_test" -> ctx.setFlag("groove_tested", true)
            "d2_catalog_alcove" -> ctx.setFlag("d2_alcove_found", true)
            "d2_silent_aisle" -> ctx.setFlag("d2_aisle_found", true)
            "d2_wall_gap" -> {
                ctx.setFlag("d2_wall_gap_found", true)
                ctx.findFragment("d2_forbid")
                ctx.unlockAchievement("ach_d2_deleted")
            }
            "d2_under_stack" -> {
                ctx.setFlag("d2_under_found", true)
                ctx.findFragment("d2_below")
                ctx.addNote("d2_deleted_records", "被刪的讀者", "地下書庫夾角一箱登記卡，1993年，全蓋「刪除」。媛媛那張在最上面。")
                ctx.damage(5)
            }
            "d2_cat_names" -> {
                ctx.setFlag("d2_cat_names_done", true)
                ctx.findFragment("d2_cat")
            }
            "d2_secret_bindery" -> ctx.setFlag("d2_bindery_visited", true)
            "pseudo_lib_exit" -> {
                ctx.triggerPseudoEnding(
                    "閉館門扉",
                    "你順著指標推開圖書館大門……但街燈照在頭頂，牆上的時鐘依然停在 03:17。",
                    "管理員的聲音從背後傳來：「出口不在門外，在第三塊地毯的左下角。」",
                    "reading_room"
                )
            }
            // Endings
            "ending_normal" -> {
                ctx.markDungeonCleared(2)
                ctx.saveInheritance { it.copy(secondCleared = true, chenSurvived = true, laozhouSurvived = true, xiaoyuSurvived = true) }
                ctx.triggerEnding("normal_d2_carpet", "地毯下的通道", "你揭開第三塊地毯左下角的暗門，帶著全員屏息爬出了沉默圖書館。", "普通結局 · 安靜歸途")
            }
            "ending_normal_trade" -> {
                ctx.markDungeonCleared(2)
                ctx.saveInheritance { it.copy(secondCleared = true) }
                ctx.triggerEnding("normal_d2_trade", "五個凹槽的代價", "你將管理員之書放入正中央凹槽，書架讓開一條窄路，你也用一段語音換取了生還。", "普通結局 · 以靜換生")
            }
            "ending_normal_yuanyuan" -> {
                ctx.markDungeonCleared(2)
                ctx.saveInheritance { it.copy(secondCleared = true, yuanyuanCarried = true) }
                ctx.triggerEnding("hidden_d2_yuanyuan", "畫貓的人走出館外", "你帶著媛媛的畫冊帶領眾人無聲穿過地毯暗門，為她補上了最後的晨光。", "好結局 · 媛媛畫冊")
            }
            "ending_survive_silence" -> {
                ctx.markDungeonCleared(2)
                ctx.triggerEnding("survive_d2_silence", "屏息到底", "你在三次鐘響之間始終維持絕對安靜，管理員默許你獨自離館。", "逃過一劫 · 靜默之生")
            }
            "ending_survive_chen" -> {
                ctx.markDungeonCleared(2); ctx.saveInheritance { it.copy(chenSurvived = true) }
                ctx.triggerEnding("survive_d2_chen", "與陳姐同行", "你拉著陳姐穿過暗道，遠處隱約傳來鐘聲。你沒敢回頭看另兩人。", "逃過一劫 · 陳姐")
            }
            "ending_survive_xiaoyu" -> {
                ctx.markDungeonCleared(2); ctx.saveInheritance { it.copy(xiaoyuSurvived = true) }
                ctx.triggerEnding("survive_d2_xiaoyu", "帶著小宇逃生", "你捂著小宇的嘴穿過暗道，在清晨冷風中鬆開了手。", "逃過一劫 · 小宇")
            }
            "ending_survive_laozhou" -> {
                ctx.markDungeonCleared(2); ctx.saveInheritance { it.copy(laozhouSurvived = true) }
                ctx.triggerEnding("survive_d2_laozhou", "老周的默契", "你和老周兩人配合默契，無聲通過地下通道重見天日。", "逃過一劫 · 老周")
            }
            "ending_survive_schism" -> {
                ctx.markDungeonCleared(2)
                ctx.triggerEnding("survive_d2_schism", "盲目的一掀", "你憑直覺直接掀開第三塊地毯，千鈞一髮間滾進出口通道。", "逃過一劫 · 奇蹟之手")
            }
            "ending_survive_admindoor" -> {
                ctx.markDungeonCleared(2); ctx.saveInheritance { it.copy(adminGuest = true) }
                ctx.triggerEnding("survive_d2_admindoor", "管理員之門", "管理員嘆了口氣，用自己的備用鑰匙開門送你離開。", "逃過一劫 · 門後交換")
            }
            "ending_bad_admin" -> ctx.triggerEnding("bad_d2_admin", "多問了一句", "你在借書台問了太多問題，書架聽見了你的聲音。", "壞結局 · 禁聲懲戒")
            "ending_bad_basement" -> ctx.triggerEnding("bad_d2_basement", "地下書庫的黑影", "書庫角落那團黑影抓住了你發抖的腳踝。", "壞結局 · 埋沒地下")
            "ending_bad_wrongbook" -> ctx.triggerEnding("bad_d2_wrongbook", "錯的書頁", "你翻開了一本寫著別人死亡日期的書。", "壞結局 · 錯書")
            "ending_bad_silence" -> ctx.triggerEnding("bad_d2_silence", "第三次鈴響", "三次鈴聲落下時，你手中沒有任何出口線索，化作書架上又一冊空白書。", "壞結局 · 歸檔")
            "ending_bad_chen" -> ctx.triggerEnding("bad_d2_chen", "消失的陳姐", "你轉身想帶陳姐走，卻只抓到一只漸漸變冷的保溫杯。", "壞結局 · 錯失")
            "ending_bad_wrong_groove" -> ctx.triggerEnding("bad_d2_wrong_groove", "凹槽錯位", "五個凹槽之中只有中央屬於它。機關反彈鎖死了整面牆。", "壞結局 · 錯位")
            "ending_bad_xiaoyu" -> ctx.triggerEnding("bad_d2_xiaoyu", "失聲痛哭", "小宇在通道裡驚叫出聲，整排黑書架同時合攏。", "壞結局 · 破禁")
            "ending_bad_too_loud" -> ctx.triggerEnding("bad_d2_loud", "期刊區的迴響", "那點輕微的咳嗽被書牆放大了十倍，館內的書同時翻頁。", "壞結局 · 噪音")
            "ending_bad_forced_forbidden" -> ctx.triggerEnding("bad_d2_forbidden", "硬撞禁書門", "年輪密碼不是用蠻力撞開的。", "壞結局 · 強闖")
            "ending_bad_bell" -> ctx.triggerEnding("bad_d2_bell", "無聲鈴的震盪", "不該搖響的鈴震碎了這裡最後一絲安寧。", "壞結局 · 鈴響")
            "ending_bad_cat" -> ctx.triggerEnding("bad_d2_cat", "錯按的紐扣", "毛線貓眼裡的紐扣閃過紅光。", "壞結局 · 貓之記")
            "d2_ending_hush" -> {
                ctx.markDungeonCleared(2)
                ctx.triggerEnding("hidden_d2_hush", "無聲之書", "你把黑皮書放回原處，用全身的安靜掩上牆縫。圖書館認出了你——作為一個懂得不出聲的人。", "隱藏結局 · 無聲")
            }
            "d2_ending_echo" -> ctx.triggerEnding("bad_d2_echo", "回音", "你在迴音走道裡出了聲。聲音被加倍送回來，也被書架聽見了。", "壞結局 · 你成了走道裡又一道回聲")
            "d2_end_v61_voice_rebellion" -> {
                ctx.markDungeonCleared(2)
                ctx.unlockAchievement("ach_v61_d2_voice")
                ctx.triggerEnding("hidden_v61_d2_voice_rebellion", "聲音叛變", "你打破「圖書館不能說話」的絕對法則，在無聲大廳深吸一口氣，喊出了陳媛媛與同伴的名字，引發共振瓦解了禁聲結界！", "v6.1 隱藏結局 · 聲音叛變")
            }
            "d2_end_true_symphony" -> {
                ctx.markDungeonCleared(2)
                ctx.saveInheritance { it.copy(chenSurvived = true, laozhouSurvived = true, xiaoyuSurvived = true, secondCleared = true) }
                ctx.triggerEnding("hidden_d2_true_voice", "重獲聲音的讀者們", "你破除了沉默圖書館的禁聲詛咒，帶領所有同伴與管理員的託付重返人間。", "真結局 I · 破除靜默")
            }
            "d2_end_true_chronicler" -> {
                ctx.markDungeonCleared(2)
                ctx.saveInheritance { it.copy(secondCleared = true, trusted = true) }
                ctx.triggerEnding("hidden_d2_true_pen", "自書命運之人", "你奪回了書寫自己人生的筆，達成沉默圖書館第二真結局。", "真結局 II · 自書命運")
            }
            "d2_end_true_librarian" -> {
                ctx.markDungeonCleared(2)
                ctx.saveInheritance { it.copy(secondCleared = true, adminGuest = true) }
                ctx.triggerEnding("hidden_d2_true_close", "永久閉館日", "你解開了三代圖書館管理員的心結，讓整座圖書館安然謝幕。", "真結局 III · 永久閉館")
            }
        }
    }

    override fun getText(ctx: BehaviorContext, sceneId: String): List<String>? = when (sceneId) {
        "d2_wall_gap" -> listOf(
            "<p>禁書區的黑書架在這裡長成了一面牆——沒有層板，書脊與書脊擠成磚。</p>",
            if (ctx.hasItem("d2_deleted_card")) "<p>你想起那張索書卡：黑書架牆根，第三道縫。你數過去——第一道，第二道，第三道。</p>"
            else "<p>你數著牆根的書縫。第三道，比別的寬一指。你側過身子。</p>",
            "<p>剛好容一個人擠進去。</p>",
            "<p>牆後不是房間，是書與書之間的一個夾層。正中一個小木架，架上一本黑皮書，書名被人用刀颳掉了。</p>"
        )
        else -> null
    }

    override fun isChoiceVisible(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean = when (sceneId) {
        "lobby" -> when (choiceIndex) {
            1 -> !ctx.hasFlag("lobby_searched")
            3 -> !ctx.hasFlag("lobby_items_taken")
            5 -> !ctx.hasFlag("puz_mg_mg_d2")
            else -> true
        }
        "reading_room" -> when (choiceIndex) {
            1 -> !ctx.hasFlag("bookshelf_right_done")
            2 -> !ctx.hasFlag("reading_searched")
            3 -> !ctx.hasFlag("laozhou_followed")
            4 -> !ctx.hasFlag("fiction_explored")
            5 -> !ctx.hasFlag("explored_reference")
            6 -> !ctx.hasFlag("braille_found")
            7 -> !ctx.hasFlag("periodical_checked")
            9 -> !ctx.hasFlag("d2_alcove_found")
            10 -> !ctx.hasFlag("puz_mg_mg_d2")
            11 -> ctx.hasItem("golden_key") || ctx.hasItem("your_book") || ctx.inheritance.goldenKey
            else -> true
        }
        "bookshelf" -> when (choiceIndex) {
            3 -> !ctx.hasFlag("d2_aisle_found")
            4 -> !ctx.hasFlag("d2_silent_bell_taken")
            else -> true
        }
        "periodical_zone" -> when (choiceIndex) {
            4 -> true
            else -> true
        }
        "forbidden_inner" -> when (choiceIndex) {
            4 -> ctx.hasFlag("first_bell_done")
            5 -> !ctx.hasFlag("first_bell_done")
            6 -> !ctx.hasFlag("d2_wall_gap_found")
            else -> true
        }
        "yuanyuan_end" -> when (choiceIndex) {
            0 -> ctx.inheritance.memoryFragments.isNotEmpty() || ctx.hasFlag("yuanyuan_photo")
            1 -> ctx.hasItem("yuanyuan_album")
            2 -> true
            4 -> !ctx.hasFlag("d2_cat_names_done")
            else -> true
        }
        "admin_deal" -> when (choiceIndex) {
            2 -> ctx.hasFlag("first_bell_done")
            3 -> !ctx.hasFlag("first_bell_done")
            4 -> ctx.hasItem("d2_binding_needle") && ctx.hasItem("yuanyuan_album")
            else -> true
        }
        "basement" -> when (choiceIndex) {
            1 -> !ctx.hasFlag("d2_under_found")
            2 -> !ctx.hasFlag("d2_blueprint_taken")
            else -> true
        }
        "final_prep" -> when (choiceIndex) {
            1 -> ctx.hasFlag("manager_book_found") || ctx.hasItem("exit_key")
            5 -> !ctx.hasFlag("manager_book_found") && !ctx.hasFlag("braille_groove")
            6 -> ctx.hasFlag("braille_groove")
            7 -> !ctx.hasFlag("chen_dead")
            8 -> ctx.hasFlag("chen_dead")
            9 -> !ctx.hasFlag("xiaoyu_dead")
            10 -> !ctx.hasFlag("laozhou_dead")
            11 -> ctx.hasItem("yuanyuan_album")
            12 -> !ctx.hasFlag("xiaoyu_safe")
            13 -> ctx.hasFlag("master_clue")
            15 -> ctx.hasFlag("admin_door_clue")
            16 -> ctx.hasItem("d2_binding_needle")
            17 -> ctx.hasItem("d2_binding_needle") && ctx.hasItem("your_book")
            else -> true
        }
        "groove_test" -> if (choiceIndex == 0) ctx.hasItem("manager_book") else true
        else -> true
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        when (sceneId) {
            "lobby" -> when (choiceIndex) {
                2 -> { ctx.openAdmin(); return true }
                5 -> { ctx.openMiniGame("mg_d2", true); return true }
            }
            "corridor_left" -> if (choiceIndex == 0) {
                ctx.openPuzzle(
                    "密碼鎖",
                    "提示：最常用的四個字，各取它們的筆畫數——的、了、在、是。輸入四位數字。",
                    "8269",
                    "的=8畫、了=2畫、在=6畫、是=9畫，合起來為 8269。"
                ) { ok ->
                    if (ok) {
                        ctx.setFlag("password_solved", true)
                        ctx.setFlag("puzzle1_done", true)
                        ctx.goToScene("reading_room")
                    } else {
                        ctx.damage(20)
                        ctx.appendNarrative("<p class=\"action\">密碼鎖爆出一聲刺耳的響，你被電得一縮（生命 -20）。</p>")
                    }
                }
                return true
            }
            "reading_room" -> if (choiceIndex == 10) { ctx.openMiniGame("mg_d2", true); return true }
            "bookshelf" -> if (choiceIndex == 4) {
                ctx.setFlag("d2_silent_bell_taken", true)
                ctx.addItem("d2_silent_bell", "沒有舌的銅鈴", "再怎麼搖都不會響的銅鈴。")
                ctx.appendNarrative("<p class=\"inherit-note\">你撿起這隻不會出聲的銅鈴收進口袋。</p>")
                return true
            }
            "reference_zone" -> if (choiceIndex == 0) {
                ctx.openPuzzle(
                    "分類號鐵盒",
                    "提示：數學在杜威分類法裡，是哪三個數字？（第四位留0）",
                    "5100",
                    "500 是自然科學與數學，數學是 510，第四位補 0 即 5100。"
                ) { ok ->
                    if (ok) {
                        ctx.setFlag("puzzle2_done", true)
                        ctx.setFlag("yuanyuan_photo", true)
                        ctx.unlockAchievement("ach_lib_puzzles")
                        ctx.addNote("yuanyuan_cat_photo", "媛媛的畫", "管理員肩上那個女孩，手裡舉著一張貓。")
                        ctx.appendNarrative("<p class=\"inherit-note\">鐵盒開了！裡面是一張媛媛舉著畫的照片。</p>")
                    } else {
                        ctx.damage(10)
                        ctx.appendNarrative("<p class=\"action\">鐵盒鎖芯發燙（生命 -10）。</p>")
                    }
                }
                return true
            }
            "periodical_zone" -> when (choiceIndex) {
                0, 1, 2 -> {
                    ctx.setFlag("periodical_checked", true)
                    ctx.damage(25)
                    ctx.goToScene("ending_bad_too_loud")
                    return true
                }
            }
            "forbidden_zone" -> if (choiceIndex == 0) {
                ctx.openPuzzle(
                    "年份鎖",
                    "提示：她活了六歲。那一年，她來了，又走了。輸入四位年份。",
                    "1987",
                    "媛媛生於 1987 年，1993 年病逝。輸入 1987。"
                ) { ok ->
                    if (ok) {
                        ctx.setFlag("puzzle3_done", true)
                        ctx.setFlag("forbidden_open", true)
                        ctx.goToScene("forbidden_inner")
                    } else {
                        ctx.damage(15)
                        ctx.appendNarrative("<p class=\"action\">鎖芯燙白了你的指腹（生命 -15）。</p>")
                    }
                }
                return true
            }
            "forbidden_inner" -> when (choiceIndex) {
                0 -> {
                    ctx.setFlag("cat_btn_1", true)
                    ctx.appendNarrative("<p class=\"action\">第一顆紐扣沉下去。</p>")
                    return true
                }
                1 -> {
                    ctx.setFlag("cat_btn_2", true)
                    ctx.appendNarrative("<p class=\"action\">第二顆紐扣也沉下去。</p>")
                    return true
                }
                2 -> {
                    ctx.setFlag("cat_btn_3", true)
                    if (ctx.hasFlag("cat_btn_1") && ctx.hasFlag("cat_btn_2")) {
                        ctx.goToScene("yuanyuan_end")
                    } else {
                        ctx.goToScene("ending_bad_cat")
                    }
                    return true
                }
            }
            "yuanyuan_end" -> when (choiceIndex) {
                0 -> {
                    ctx.appendNarrative("<p class=\"inherit-note\">你憑記憶填補上空白的那一頁，原來她並不是被遺忘的。</p>")
                    return true
                }
                1 -> {
                    ctx.goToScene("ending_normal_yuanyuan")
                    return true
                }
            }
            "admin_deal" -> if (choiceIndex == 0) {
                ctx.setFlag("admin_door_clue", true)
                ctx.appendNarrative("<p class=\"dialogue\">管理員緩緩推過半扇小門：「若真走到盡頭，來找我吧。」</p>")
                return true
            }
            "basement" -> if (choiceIndex == 2) {
                ctx.setFlag("d2_blueprint_taken", true)
                ctx.addItem("d2_blueprint", "地下書庫藍圖", "標出第三塊地毯下方空心的老舊工程圖。")
                ctx.appendNarrative("<p class=\"inherit-note\">你收起書庫藍圖。</p>")
                return true
            }
            "d2_catalog_alcove" -> if (choiceIndex == 0) {
                ctx.openPuzzle(
                    "索書號鎖",
                    "提示：這座館本身——圖書館學與資訊科學——在杜威十進分類法裡是哪三位數？照館內慣例，第四位補0。",
                    "0200",
                    "020 代表圖書館學與資訊科學，補 0 → 0200。"
                ) { ok ->
                    if (ok) {
                        ctx.setFlag("d2_alcove_solved", true)
                        ctx.addItem("d2_deleted_card", "被刪書的索書卡", "一張手寫卡片：《無聲之書》。背面寫著：「黑書架牆根，第三道縫。」")
                        ctx.addNote("d2_deleted_note", "牆縫的位置", "被刪書的索書卡背面：黑書架牆根，第三道縫。")
                        ctx.appendNarrative("<p class=\"inherit-note\">鎖開了，你取出了【被刪書的索書卡】。</p>")
                    } else {
                        ctx.damage(10)
                        ctx.appendNarrative("<p class=\"action\">鎖芯發燙（生命 -10）。</p>")
                    }
                }
                return true
            }
            "d2_silent_aisle" -> when (choiceIndex) {
                0 -> {
                    ctx.setFlag("d2_aisle_silent", true)
                    ctx.unlockAchievement("ach_d2_whisper")
                    ctx.appendNarrative("<p>你屏住呼吸悄無聲息地穿過走道，沒有驚動半頁書。</p>")
                    ctx.goToScene("d2_aisle_niche")
                    return true
                }
                1 -> {
                    ctx.damage(5)
                    ctx.appendNarrative("<p>輕咳加倍彈了回來，你硬著頭皮快步穿過盡頭（生命 -5）。</p>")
                    ctx.goToScene("d2_aisle_niche")
                    return true
                }
            }
            "d2_wall_gap" -> if (choiceIndex == 0) {
                ctx.addItem("d2_silent_book", "《無聲之書》", "一本被颳掉書名的黑皮書。翻開，每一頁都是空白。")
                ctx.goToScene("forbidden_inner")
                return true
            }
            "d2_secret_bindery" -> if (choiceIndex == 0) {
                if (!ctx.hasItem("d2_binding_needle")) {
                    ctx.addItem("d2_binding_needle", "無聲裝訂針", "可改寫並保護書頁不被圖書館吞噬的傳說級工具。")
                    ctx.setFlag("d2_true_flag", true)
                    ctx.appendNarrative("<p class=\"inherit-note\">獲得傳說物品：無聲裝訂針（已解鎖沉默圖書館真結局條件）。</p>")
                }
                return true
            }
        }
        return false
    }
}

object Door3BehaviorHandler : DoorBehaviorHandler {

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        when (sceneId) {
            "lobby_search" -> {
                ctx.loseTime(3)
                if (!ctx.hasItem("unlabeled_medicine")) {
                    ctx.addItem("unlabeled_medicine", "未標籤玻璃藥瓶", "沒有貼名字的玻璃藥瓶。")
                }
                ctx.addNote("note_close", "靠近的病歷", "MK-II 記錄著：靠近記憶提取者將消耗自身時間。")
            }
            "pharmacy" -> {
                ctx.loseTime(3)
                if (!ctx.hasFlag("pharmacy_searched")) {
                    ctx.setFlag("pharmacy_searched", true)
                    ctx.addItem("painkiller", "止痛藥", "醫療緩解藥物，恢復 15 HP。")
                    ctx.addItem("antibiotic", "抗生素", "醫療消炎藥，恢復 20 HP。")
                    ctx.addItem("sedative", "高濃度鎮定劑", "極度危險的處方藥劑。")
                }
            }
            "pharmacy_backroom" -> {
                ctx.loseTime(3)
                if (!ctx.hasItem("epinephrine")) ctx.addItem("epinephrine", "腎上腺素針劑", "危急時刻恢復 30 HP。")
            }
            "medicine_puzzle" -> {
                ctx.setFlag("medicine_puzzle_done", true)
                ctx.loseTime(3)
                ctx.openPuzzle(
                    "藥品辨識解謎",
                    "五個瓶子擺在你面前。哪一個是鎮定劑？（輸入瓶號數字）\n\n提示：鎮定劑通常是深色玻璃瓶保存，避光。",
                    "3",
                    "只有避光儲存的深褐色玻璃瓶（第 3 號）符合鎮定劑的保存方式。"
                ) { ok ->
                    if (ok) {
                        if (!ctx.hasItem("backup_sedative")) {
                            ctx.addItem("backup_sedative", "應急鎮定劑", "深褐色玻璃瓶。+25分鐘。林醫生確認過。")
                        }
                        ctx.appendNarrative("<p class=\"inherit-note\">正確。林醫生點了點頭，把【應急鎮定劑】遞給你。</p>")
                    } else {
                        ctx.damage(15)
                        ctx.appendNarrative("<p class=\"system-msg\">你選錯了，誤觸腐蝕性消毒液（生命 -15）。</p>")
                    }
                }
            }
            "internal_med" -> {
                ctx.loseTime(3)
                if (!ctx.hasItem("medical_records")) {
                    ctx.addItem("medical_records", "破碎的二樓病歷", "記錄著 2003 年 4 月 15 日的失蹤數據。")
                }
                ctx.randomNurseEncounter()
            }
            "internal_search" -> {
                ctx.loseTime(3)
                if (!ctx.hasItem("director_diary")) {
                    ctx.addItem("director_diary", "院長的秘密筆記", "夾著一張媛媛的舊照片。")
                }
            }
            "medical_record_puzzle" -> {
                ctx.setFlag("record_puzzle_done", true)
                ctx.loseTime(3)
                ctx.openPuzzle(
                    "病歷拼圖解謎",
                    "把碎片拼好之後，你需要回答一個問題：\n\n2003年4月15日，記憶提取機MK-II過載時，同時崩潰的病人有多少人？（輸入數字）",
                    "14",
                    "與太平間無名件抽屜總格數相同，答案是 14。"
                ) { ok ->
                    if (ok) {
                        ctx.setFlag("accident_truth", true)
                        ctx.appendNarrative("<p class=\"inherit-note\">正確。14 個人。</p>")
                    } else {
                        ctx.damage(10)
                        ctx.appendNarrative("<p class=\"system-msg\">你拼錯了碎片（生命 -10）。</p>")
                    }
                }
            }
            "surgery" -> {
                ctx.loseTime(3)
                if (!ctx.hasItem("scalpel")) ctx.addItem("scalpel", "不鏽鋼手術刀", "醫用鋒利手術刀，必要時可防身或撬開精密機殼。")
            }
            "surgery_deep" -> {
                ctx.loseTime(5)
                if (!ctx.hasItem("surgery_record")) ctx.addItem("surgery_record", "塗改的手術記錄", "寫著 4 月 15 日事故後的封存紀錄。")
            }
            "icu" -> {
                ctx.loseTime(3)
                if (!ctx.hasItem("valium")) ctx.addItem("valium", "安定劑", "可穩定倒計時與壓力。")
                ctx.randomNurseEncounter()
            }
            "ward" -> {
                ctx.loseTime(5)
                ctx.setFlag("heard_yuanyuan", true)
            }
            "director_office" -> {
                ctx.loseTime(5)
                if (!ctx.hasItem("b2_key")) ctx.addItem("b2_key", "B2核心機房鑰匙", "陳安康院長遺留在辦公桌上的鑰匙。")
            }
            "morgue" -> {
                ctx.loseTime(5)
                ctx.setFlag("zhoumin_morgue", true)
            }
            "morgue_puzzle" -> {
                ctx.setFlag("morgue_puzzle_done", true)
                ctx.loseTime(3)
                ctx.openPuzzle(
                    "太平間密碼",
                    "A是第1格。一共有14格無名件。周敏把自己放進了最後一格。\n\n第14格對應的英文字母是？（輸入一個大寫字母）",
                    "N",
                    "字母表第 14 個字母是 N。"
                ) { ok ->
                    if (ok) {
                        if (!ctx.hasItem("epinephrine")) ctx.addItem("epinephrine", "腎上腺素針劑", "危急時使用，恢復30點生命。")
                        ctx.unlockAchievement("ach_morgue")
                        ctx.appendNarrative("<p class=\"inherit-note\">正確。你拉開 N 格，取得一支腎上腺素針劑。</p>")
                    } else {
                        ctx.damage(10)
                        ctx.appendNarrative("<p class=\"system-msg\">你拉錯了格位，寒氣穿透手套（生命 -10）。</p>")
                    }
                }
            }
            "yuanyuan_memory" -> ctx.setFlag("yuanyuan_memory_done", true)
            "nurse_chase" -> ctx.setFlag("chase_started", true)
            "nurse_chase_fight" -> {
                ctx.setFlag("nurse_defeated", true)
                ctx.unlockAchievement("ach_nurse")
                ctx.damage(15)
            }
            "nurse_chase_drug" -> ctx.setFlag("nurse_escaped", true)
            "ward4_1" -> { ctx.setFlag("ward4_1_done", true); checkFourthFloor(ctx) }
            "ward4_2" -> { ctx.setFlag("ward4_2_done", true); checkFourthFloor(ctx) }
            "ward4_3" -> { ctx.setFlag("ward4_3_done", true); checkFourthFloor(ctx) }
            "ward4_4" -> { ctx.setFlag("ward4_4_done", true); checkFourthFloor(ctx) }
            "d3_morgue_back" -> if (!ctx.hasFlag("d3_morgue_back_done")) {
                ctx.setFlag("d3_morgue_back_done", true)
                ctx.findFragment("d3_morgue")
                ctx.loseTime(3)
                ctx.addNote("note_d3_handover", "周敏的交接本", "4月16日那頁：我送了十四個人下來。他們還活著。我沒有忘記他們的名字。")
            }
            "d3_404_under" -> if (!ctx.hasFlag("d3_names_read")) {
                ctx.setFlag("d3_names_read", true)
                ctx.unlockAchievement("ach_d3_names")
                ctx.findFragment("d3_wait")
                ctx.loseTime(2)
                ctx.addNote("note_d3_names", "牆板下的十四個名字", "404病房牆板寫下了太平間那十四個無名件的名字。")
            }
            "d3_b2_behind" -> if (!ctx.hasFlag("d3_service_done")) {
                ctx.setFlag("d3_service_done", true)
                ctx.unlockAchievement("ach_d3_service")
                ctx.findFragment("d3_core")
                ctx.loseTime(4)
                ctx.addNote("note_d3_service", "機房後側", "散熱間終端顯示：記憶存儲量98.7%，已釋放0.0%。")
            }
            "d3_secret_rooftop" -> ctx.setFlag("d3_rooftop_visited", true)
            "xiaoyu_collude" -> ctx.unlockAchievement("ach_xiaoyu")
            "hidden_memory_gate" -> {
                ctx.markDungeonCleared(3)
                ctx.saveInheritance { it.copy(thirdCleared = true, memoryKept = true, yuanyuanCarried = true) }
                ctx.triggerEnding("hidden_d3_memory_gate", "記憶的真門", "你用手術刀撬開側縫，溫柔釋放了困守多年的記憶。", "隱藏結局 · 記憶解放")
            }
            "ending_truth" -> {
                ctx.markDungeonCleared(3)
                ctx.saveInheritance { it.copy(thirdCleared = true, memoryKept = true) }
                ctx.triggerEnding("normal_d3_truth", "記憶未滅", "你選擇說出真相並完整保留了媛媛與病人的記憶。", "好結局 · 銘記真相")
            }
            "ending_lie" -> {
                ctx.markDungeonCleared(3)
                ctx.triggerEnding("normal_d3_lie", "善意的謊言", "你安慰了那團不願離去的記憶，讓她安靜沉睡。", "普通結局 · 溫柔一謊")
            }
            "ending_delete" -> {
                ctx.markDungeonCleared(3)
                ctx.saveInheritance { it.copy(thirdCleared = true, memoryDeleted = true) }
                ctx.triggerEnding("normal_d3_delete", "格式化", "機器歸零的同時，整座安康醫院的執念伴隨晨霧消散。", "普通結局 · 格式化")
            }
            "ending_carry" -> {
                ctx.markDungeonCleared(3)
                ctx.saveInheritance { it.copy(thirdCleared = true, yuanyuanCarried = true) }
                ctx.triggerEnding("hidden_d3_carry", "背出醫院的人", "你將她輕輕背在肩上走出醫院大門，外頭剛好亮起晨光。", "好結局 · 帶她回家")
            }
            "ending_survive_escape" -> {
                ctx.markDungeonCleared(3)
                ctx.triggerEnding("survive_d3_escape", "逃出急診大門", "在倒計時歸零前一秒，你撞開消防通道滾出了醫院。", "逃過一劫 · 最後一秒")
            }
            "ending_bad_waiting" -> {
                ctx.unlockAchievement("ach_waiting")
                ctx.triggerEnding("bad_d3_waiting", "永恆的等待", "你在 404 的牆上也貼上了自己的名字，成了等下一個人來念的無名氏。", "壞結局 · 等")
            }
            "ending_bad_nightnurse" -> ctx.triggerEnding("bad_d3_nurse", "夜巡截擊", "注射器刺進頸動脈時，計時器徹底歸零。", "死亡結局 · 夜巡")
            "ending_bad_medicine" -> ctx.triggerEnding("bad_d3_medicine", "過量鎮定", "手錶不再走動，你的眼睛也緩緩閉上。", "死亡結局 · 藥效")
            "ending_bad_reset" -> {
                ctx.incCounter("resets")
                ctx.triggerEnding("bad_d3_reset", "第 N 次重置", "時鐘倒回 60:00，所有人的記憶又退回原點。", "壞結局 · 時間重置")
            }
            "ending_xiaoyu_betray" -> ctx.triggerEnding("bad_d3_betray", "分道揚鑣的背叛", "你不相信小雨，在最黑暗的門前她鬆開了手。", "壞結局 · 背叛")
            "ending_lin_redemption" -> {
                ctx.markDungeonCleared(3)
                ctx.triggerEnding("normal_d3_lin", "念安的父親", "林醫生終於喊出了女兒的名字，卸下多年悔恨走出大門。", "普通結局 · 醫者救贖")
            }
            "ending_lin_fallen" -> ctx.triggerEnding("bad_d3_lin", "留在手術室", "林醫生沒能跨過自己的過去，倒在了手術燈下。", "壞結局 · 沉沒")
            "d3_overload" -> ctx.triggerEnding("bad_d3_overload", "斷電", "斷了電的機器從最近的東西身上抽取記憶——太平間的件數從 14 變成了 15。", "壞結局 · 第十五格·貳")
            "d3_ending_names" -> {
                ctx.markDungeonCleared(3)
                ctx.saveInheritance { it.copy(thirdCleared = true, memoryKept = true) }
                ctx.triggerEnding("hidden_d3_names", "十四個名字", "你念出了那十四個被忘記的名字，把他們還給了外面；最後你也記得她叫陳媛媛。", "隱藏結局 · 「念名者」稱號")
            }
            "d3_end_v61_zero_minute" -> {
                ctx.markDungeonCleared(3)
                ctx.unlockAchievement("ach_v61_d3_zero")
                ctx.triggerEnding("hidden_v61_d3_zero_minute", "零分鐘", "你在倒計時 00:00 前一毫秒拔除了記憶主機總線，醫院鐘聲在 00:00 停止並展開了純白出口。", "v6.1 隱藏結局 · 零分鐘")
            }
            "d3_end_true_sunrise" -> {
                ctx.markDungeonCleared(3)
                ctx.saveInheritance { it.copy(xiaoyuSurvived = true, yuanyuanCarried = true, memoryKept = true, thirdCleared = true) }
                ctx.triggerEnding("hidden_d3_true_sunrise", "向日葵盛開的早晨", "你用溫室的生機膠囊逆轉了記憶提取機，拯救了醫院裡所有的靈魂。", "真結局 I · 破曉仁心")
            }
            "d3_end_true_zhoumin" -> {
                ctx.markDungeonCleared(3)
                ctx.saveInheritance { it.copy(thirdCleared = true, memoryKept = true) }
                ctx.triggerEnding("hidden_d3_true_nurse", "夜巡結束的鐘聲", "你完成了周敏最後的心願，讓漫長的夜班終於迎來下班的晨光。", "真結局 II · 夜巡謝幕")
            }
            "d3_end_true_family" -> {
                ctx.markDungeonCleared(3)
                ctx.saveInheritance { it.copy(xiaoyuSurvived = true, yuanyuanCarried = true, thirdCleared = true) }
                ctx.triggerEnding("hidden_d3_true_family", "不再倒數的時間", "所有人的執念都在黎明前得到了安放，達成倒計時醫院第三真結局。", "真結局 III · 時間解鎖")
            }
        }
    }

    private fun checkFourthFloor(ctx: BehaviorContext) {
        if (ctx.hasFlag("ward4_1_done") && ctx.hasFlag("ward4_2_done") &&
            ctx.hasFlag("ward4_3_done") && ctx.hasFlag("ward4_4_done")
        ) {
            ctx.unlockAchievement("ach_fourth")
        }
    }

    override fun isChoiceVisible(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean = when (sceneId) {
        "entrance" -> when (choiceIndex) {
            7 -> !ctx.hasFlag("puz_mg_mg_d3")
            9 -> !ctx.hasFlag("v58_hospital_card_taken")
            else -> true
        }
        "pharmacy" -> when (choiceIndex) {
            0 -> ctx.hasItem("painkiller")
            1 -> ctx.hasItem("antibiotic")
            2 -> ctx.hasItem("sedative")
            4 -> !ctx.hasFlag("medicine_puzzle_done")
            5 -> ctx.hasItem("unlabeled_medicine")
            6 -> ctx.hasItem("painkiller") && !ctx.hasFlag("lin_trust")
            else -> true
        }
        "internal_med" -> if (choiceIndex == 1) !ctx.hasFlag("record_puzzle_done") else true
        "morgue" -> when (choiceIndex) {
            0 -> !ctx.hasFlag("morgue_puzzle_done")
            3 -> ctx.hasFlag("morgue_puzzle_done")
            4 -> !ctx.hasFlag("v58_morgue_syringe_taken")
            5 -> ctx.hasItem("d3_sunflower_seed")
            else -> true
        }
        "night_nurse_encounter" -> if (choiceIndex == 2) ctx.hasItem("scalpel") else true
        "operating_room" -> when (choiceIndex) {
            1 -> ctx.hasItem("yuanyuan_memory") || ctx.hasFlag("yuanyuan_card_found")
            5 -> !ctx.hasFlag("puz_mg_mg_d3")
            else -> true
        }
        "basement_entrance" -> when (choiceIndex) {
            1 -> !ctx.hasFlag("lin_resolved")
            2 -> !ctx.hasFlag("xiaoyu_resolved")
            else -> true
        }
        "basement" -> when (choiceIndex) {
            0 -> ctx.hasFlag("director_diary_read") || ctx.hasItem("director_diary")
            1 -> ctx.hasItem("scalpel")
            7 -> ctx.hasItem("d3_names_card") && ctx.hasFlag("d3_names_read")
            9 -> ctx.hasItem("d3_sunflower_seed")
            else -> true
        }
        "ward4_floor" -> if (choiceIndex == 3) ctx.hasItem("scalpel") || ctx.hasItem("b2_key") else true
        "ward4_4" -> if (choiceIndex == 1) !ctx.hasFlag("d3_names_read") else true
        "nurse_chase" -> when (choiceIndex) {
            2 -> ctx.hasItem("scalpel")
            3 -> ctx.hasItem("epinephrine")
            else -> true
        }
        "lin_final_choice" -> if (choiceIndex == 3) ctx.hasItem("d3_sunflower_seed") else true
        "xiaoyu_doubt" -> when (choiceIndex) {
            0 -> ctx.hasFlag("xiaoyu_trust")
            1 -> !ctx.hasFlag("xiaoyu_trust")
            else -> true
        }
        "d3_b2_behind" -> if (choiceIndex == 0) !ctx.hasFlag("d3_box_open") else true
        else -> true
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        when (sceneId) {
            "entrance" -> when (choiceIndex) {
                7 -> { ctx.openMiniGame("mg_d3", true); return true }
                9 -> {
                    ctx.setFlag("v58_hospital_card_taken", true)
                    ctx.addItem("magnet_coil", "強磁線圈", "醫療磁振儀拆下來的線圈，可與實驗室門禁卡組合。")
                    ctx.appendNarrative("<p class=\"inherit-note\">你在椅背縫隙撿到一枚「強磁線圈」。</p>")
                    return true
                }
            }
            "pharmacy" -> when (choiceIndex) {
                0 -> { ctx.removeItem("painkiller"); ctx.heal(15); return true }
                1 -> { ctx.removeItem("antibiotic"); ctx.heal(20); return true }
                2 -> { ctx.removeItem("sedative"); ctx.useSedativeBadEnd(); return true }
                5 -> {
                    ctx.removeItem("unlabeled_medicine")
                    ctx.addItem("backup_sedative", "應急鎮定劑", "林醫生兌換出來的鎮定劑，+25 分鐘。")
                    ctx.appendNarrative("<p class=\"inherit-note\">林醫生辨識出這批樣本，替你換了一瓶【應急鎮定劑】。</p>")
                    return true
                }
                6 -> {
                    ctx.removeItem("painkiller")
                    ctx.setFlag("lin_trust", true)
                    ctx.addNpcAffinity("hospital_doctor", 20)
                    ctx.appendNarrative("<p class=\"inherit-note\">林醫生吞下止痛藥，發抖的雙手慢慢穩了下來（好感度大幅提升）。</p>")
                    return true
                }
                7 -> {
                    ctx.appendNarrative("<p class=\"action\">你將過期藥瓶投入醫廢桶，心裡踏實了一分。</p>")
                    return true
                }
            }
            "morgue" -> if (choiceIndex == 4) {
                ctx.setFlag("v58_morgue_syringe_taken", true)
                ctx.addItem("oxygen_flask", "袖珍氧氣瓶", "應急醫療氧氣瓶，可與防風打火機組合。")
                ctx.appendNarrative("<p class=\"inherit-note\">你在第十四格旁取得了「袖珍氧氣瓶」。</p>")
                return true
            }
            "operating_room" -> if (choiceIndex == 5) { ctx.openMiniGame("mg_d3", true); return true }
            "basement_entrance" -> when (choiceIndex) {
                0 -> {
                    if (!ctx.hasFlag("chase_started") && !ctx.hasFlag("nurse_defeated") && !ctx.hasFlag("nurse_escaped")) {
                        ctx.goToScene("nurse_chase")
                    } else {
                        ctx.goToScene("basement")
                    }
                    return true
                }
                3 -> {
                    ctx.openDialogPanel("hospital_doctor")
                    return true
                }
            }
            "basement" -> when (choiceIndex) {
                0, 1 -> {
                    if (ctx.hasItem("director_diary") && ctx.hasItem("scalpel")) {
                        ctx.goToScene("hidden_memory_gate")
                    } else {
                        ctx.appendNarrative("<p class=\"action\">你試著打開側邊機殼，但沒有趁手工具與院長筆記無法找到正確節點。</p>")
                    }
                    return true
                }
            }
            "d3_b2_behind" -> when (choiceIndex) {
                0 -> {
                    ctx.openPuzzle(
                        "散熱間密碼鎖",
                        "交接單上寫著：「應急停機密碼＝院長當年親筆拒絕的那一天。」\n輸入四位數字：月兩位、日兩位。",
                        "0415",
                        "事故報告上的日期為 4 月 15 日，輸入 0415。"
                    ) { ok ->
                        if (ok) {
                            ctx.setFlag("d3_box_open", true)
                            ctx.addItem("d3_names_card", "十四個名字的備份卡", "周敏藏在散熱間的記憶備份。上面是十四個被忘記的名字。")
                            ctx.appendNarrative("<p class=\"inherit-note\">鎖「咔」一聲開了！你拿到【十四個名字的備份卡】。</p>")
                        } else {
                            ctx.damage(10)
                            ctx.appendNarrative("<p class=\"system-msg\">密碼錯誤！電流順著指尖麻上手肘（生命 -10）。</p>")
                        }
                    }
                    return true
                }
                1 -> {
                    ctx.appendNarrative("<p>你撕開塑料封條，把紅色閘刀扳到底。整間機房陷入刺骨靜默……</p>")
                    ctx.goToScene("d3_overload", 900L)
                    return true
                }
            }
            "d3_secret_rooftop" -> if (choiceIndex == 0) {
                if (!ctx.hasItem("d3_sunflower_seed")) {
                    ctx.addItem("d3_sunflower_seed", "向日葵種子膠囊", "頂樓溫室保存至今的生機膠囊（傳說）。")
                    ctx.addTime(20)
                    ctx.setFlag("d3_true_flag", true)
                    ctx.appendNarrative("<p class=\"inherit-note\">獲得傳說物品：向日葵種子膠囊（倒計時 +20 分鐘，已滿足醫院真結局條件）。</p>")
                }
                return true
            }
        }
        return false
    }
}
