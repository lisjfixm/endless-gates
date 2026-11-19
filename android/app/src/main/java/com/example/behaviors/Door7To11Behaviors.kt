package com.example.behaviors

import com.example.model.V59PuzzleType
import kotlin.math.abs

object Door7BehaviorHandler : DoorBehaviorHandler {

    private val stations = listOf("d7_st_hotel", "d7_st_library", "d7_st_hospital")

    private fun checkMirrorPuzzleAch(ctx: BehaviorContext) {
        if (ctx.hasFlag("d7_puz_mirror") && ctx.hasFlag("d7_puz_schedule") && ctx.hasFlag("d7_puz_swap")) {
            ctx.unlockAchievement("ach_d7_mirror")
        }
    }

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        when (sceneId) {
            "d7_prologue" -> ctx.unlockAchievement("ach_d7_board")
            "d7_st_hotel" -> ctx.setFlag("d7_visited_hotel", true)
            "d7_st_library" -> ctx.setFlag("d7_visited_library", true)
            "d7_st_hospital" -> ctx.setFlag("d7_visited_hospital", true)
            "d7_cab" -> {
                if (abs(ctx.state.hp - ctx.state.mirrorHp) <= 10) {
                    ctx.unlockAchievement("ach_d7_sync")
                }
            }
            "d7_reverse_station" -> ctx.unlockAchievement("ach_v59_d7_reverse")
            "d7_end_true" -> {
                ctx.markDungeonCleared(7)
                ctx.unlockAchievement("ach_d7_true")
                ctx.saveInheritance { it.copy(mirrorDefeated = true, trusted = true) }
                ctx.triggerEnding("true", "鏡軌重疊的晨光", "左右兩列電車在 03:28 的鐘聲裡完美重合。你與鏡像並肩跨過月台，走出了無盡地鐵。", "真結局 · 雙軌合一")
            }
            "d7_end_true_dawn" -> {
                ctx.markDungeonCleared(7)
                ctx.unlockAchievement("ach_d7_true")
                ctx.triggerEnding("true", "並軌黎明", "雙軌銅幣牽引兩列電車同時駛出隧道。平行軌道上的所有遺憾都被妥善安放。", "真結局 · 雙軌銅幣")
            }
            "d7_end_true_companions" -> {
                ctx.markDungeonCleared(7)
                ctx.unlockAchievement("ach_d7_true")
                ctx.saveInheritance { it.copy(suwanSurvived = true, trusted = true) }
                ctx.triggerEnding("true", "無一人掉隊的月台", "蘇晚與林雙一左一右穩住雙重氣閥。列車停靠地面站台時，你們一個都沒少。", "真結局 · 同行者")
            }
            "d7_end_reverse_world" -> {
                ctx.markDungeonCleared(7)
                ctx.unlockAchievement("ach_d7_true")
                ctx.triggerEnding("hidden", "反向世界的重逢", "你在反向車站遇見所有曾經錯過的同伴。這一次，陽光真實地灑在每個人臉上。", "隱藏真結局 · 反向車站")
            }
            "d7_end_normal_self" -> {
                ctx.markDungeonCleared(7)
                ctx.triggerEnding("normal", "正軌生還", "你拉滿正側操縱桿衝出隧道口。身後的鏡像緩緩消散在車窗倒影裡。", "普通結局 · 正軌生還")
            }
            "d7_end_normal_mirror" -> {
                ctx.markDungeonCleared(7)
                ctx.triggerEnding("normal", "讓給鏡像的車票", "你鬆開操縱桿，目送鏡像駛向地面晨光。這一次，替你活下去的是另一個你。", "普通結局 · 鏡像代償")
            }
            "d7_end_survive_brake" -> {
                ctx.markDungeonCleared(7)
                ctx.triggerEnding("survive", "隧道中的靜止", "你在兩站之間拉下緊急煞車。車廂停在安靜的黑暗裡，直到霧氣退散。", "逃過一劫 · 急煞")
            }
            "d7_end_conductor" -> {
                ctx.markDungeonCleared(7)
                ctx.triggerEnding("normal", "新任列車長", "你戴上沈默留下的深藍色制帽，接過打孔鉗，繼續守望深夜搭乘鏡像電車的旅人。", "普通結局 · 守望者")
            }
            "d7_end_tuner" -> {
                ctx.markDungeonCleared(7)
                ctx.triggerEnding("hidden", "第十二節音叉車廂", "宋弦撥響音叉，鐵軌化作溫柔弦樂。你們在不存在的車廂裡尋回最珍貴的舊物。", "隱藏結局 · 調音師")
            }
            "d7_end_oldman" -> {
                ctx.markDungeonCleared(7)
                ctx.triggerEnding("survive", "舊道微光", "盲眼老人敲擊枕木，帶你沿著防空連通道從街角人孔蓋爬回地面。", "逃過一劫 · 舊道")
            }
            "d7_end_v61_mirror_vanish" -> {
                ctx.markDungeonCleared(7)
                ctx.unlockAchievement("ach_v61_d7_vanish")
                ctx.triggerEnding("hidden", "鏡像消失", "你不帶任何票根空手走進駕駛室，雙面車窗徹底化為透明，鏡中人就此從世界上抹消。", "v6.1 隱藏結局 · 無票前行")
            }
            "d7_end_jump1" -> ctx.triggerEnding("death_jump", "永不停靠的月台", "你強行跳上倒影月台，這裡沒有出口，只有一列列呼嘯而過的空車。", "壞結局 · 跳車")
            "d7_end_noise" -> ctx.triggerEnding("death_noise", "塗抹姓名的書頁", "燃燒書庫裡的反寫鉛字飛起，將你的名字從車票上徹底塗去。", "壞結局 · 喧囂書庫")
            "d7_end_format" -> ctx.triggerEnding("bad_format", "白紙車票", "鏡像按下格式化按鈕，手裡的車票變成白紙，你也忘了自己要搭去哪裡。", "壞結局 · 格式化")
            "d7_end_shatter" -> ctx.triggerEnding("death_shatter", "碎裂的雙軌", "車窗碎裂的氣流將正側與鏡像同時捲入雙軌縫隙。", "壞結局 · 碎窗")
            "d7_end_derail" -> ctx.triggerEnding("death_derail", "脫軌深淵", "失去耦合平衡的電車在彎道傾覆，車頭燈劃出最後一道弧線。", "壞結局 · 脫軌")
            "d7_end_loop" -> ctx.triggerEnding("bad_loop", "永遠的環線", "你在搖晃車廂裡沉沉睡去，列車在 03:17 與 03:18 之間永恆打轉。", "壞結局 · 環線")
        }
    }

    override fun getText(ctx: BehaviorContext, sceneId: String): List<String>? {
        return when (sceneId) {
            "d7_hub", "d7_st_hotel", "d7_st_library", "d7_st_hospital", "d7_cab" -> {
                val mainText = "<p>正側體力：<strong>${ctx.state.hp}</strong> ｜ 鏡像體力：<strong>${ctx.state.mirrorHp}</strong></p>"
                val mirrorText = "<p>雙軌差值：<strong>${abs(ctx.state.hp - ctx.state.mirrorHp)}</strong> ｜ 謎題進度：${listOf("d7_puz_mirror", "d7_puz_schedule", "d7_puz_swap").count { ctx.hasFlag(it) }}/3</p>"
                listOf(ctx.buildDualNarrativeHtml(mainText, mirrorText))
            }
            else -> null
        }
    }

    override fun isChoiceVisible(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        return when (sceneId) {
            "d7_prologue" -> when (choiceIndex) {
                3 -> !ctx.hasFlag("v60_tram_stub") && !ctx.hasItem("v60_tram_stub")
                else -> true
            }
            "d7_hub" -> when (choiceIndex) {
                1 -> !ctx.hasFlag("d7_puz_mirror")
                2 -> !ctx.hasFlag("d7_puz_schedule")
                3 -> ctx.hasFlag("golden_key") || ctx.hasItem("golden_key") || ctx.hasItem("tram_token") || ctx.inheritance.goldenKey
                4 -> ctx.getCounter("d7_station_idx") >= 1 || ctx.hasFlag("d7_puz_mirror") || ctx.hasFlag("d7_puz_schedule")
                7 -> !ctx.hasItem("v60_tram_stub") && !ctx.hasFlag("v60_tram_stub")
                else -> true
            }
            "d7_cab" -> when (choiceIndex) {
                0 -> ctx.hasItem("tram_wrench") && ctx.hasItem("tram_timetable")
                1 -> ctx.hasItem("tram_token")
                2 -> ctx.hasFlag("trusted") || ctx.inheritance.suwanSurvived || ctx.inheritance.trusted
                else -> true
            }
            "d7_reverse_station" -> when (choiceIndex) {
                1 -> ctx.hasItem("d7_reverse_ticket")
                else -> true
            }
            else -> true
        }
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        return when (sceneId) {
            "d7_prologue" -> if (choiceIndex == 3) {
                ctx.addItem("v60_tram_stub", "鏡像電車票根", "來自時間裂縫的泛黃票根，能貫通後續門扉的隱藏折扣與信物。", "跨門信物")
                ctx.saveSideChainFlag("tram_stub")
                ctx.setFlag("v60_tram_stub", true)
                ctx.appendNarrative("<p class=\"action\">你彎腰拾起了那張閃著微光的鏡像電車票根。</p>")
                ctx.goToScene("d7_hub")
                true
            } else false

            "d7_hub" -> when (choiceIndex) {
                0 -> {
                    val idx = ctx.getCounter("d7_station_idx")
                    val target = stations[idx % stations.size]
                    ctx.setCounter("d7_station_idx", idx + 1)
                    ctx.goToScene(target)
                    true
                }
                1 -> {
                    ctx.openPuzzle(
                        "鏡像文字鎖",
                        "車窗上反寫著「23」與「12」，若將正側與鏡像讀數相加，總和是多少？",
                        "35",
                        "提示：23 + 12 = 35"
                    ) { ok ->
                        if (ok) {
                            ctx.setFlag("d7_puz_mirror", true)
                            ctx.addItem("tram_token", "雙軌銅幣", "刻有雙面列車編號的古銅代幣。", "可開啟駕駛室銅幣真結局")
                            ctx.appendNarrative("<p class=\"action\">文字鎖應聲彈開！你獲得了「雙軌銅幣」。</p>")
                            checkMirrorPuzzleAch(ctx)
                        }
                    }
                    true
                }
                2 -> {
                    ctx.openPuzzle(
                        "時刻表碎片",
                        "末班車準點為 03:17，在 11 分鐘後將抵達交匯站，該時刻的「分鐘數」是幾分？",
                        "28",
                        "提示：17 + 11 = 28"
                    ) { ok ->
                        if (ok) {
                            ctx.setFlag("d7_puz_schedule", true)
                            ctx.addItem("tram_timetable", "完整時刻表", "標記了所有停靠站與交匯時間的發車表。", "駕駛室必需道具")
                            ctx.appendNarrative("<p class=\"action\">你拼合了所有時刻表碎片（獲得：完整時刻表）。</p>")
                            checkMirrorPuzzleAch(ctx)
                        }
                    }
                    true
                }
                else -> false
            }

            "d7_secret_coupler" -> if (choiceIndex == 0) {
                ctx.addItem("tram_wrench", "緊急制動扳手", "能鎖定雙軌差速器的重型鋼鐵扳手。", "駕駛室鎖軌用")
                ctx.heal(20)
                ctx.syncMirrorDamage(-20)
                ctx.appendNarrative("<p class=\"action\">你取下緊急制動扳手並修補了玻璃裂紋（正側與鏡像體力皆 +20）。</p>")
                ctx.goToScene("d7_hub")
                true
            } else false

            "d7_st_hotel" -> when (choiceIndex) {
                0 -> {
                    ctx.damage(10)
                    ctx.appendNarrative("<p class=\"action\">你敲窗提醒了鏡像，自己分擔了虛空衝擊（正側 HP -10）。</p>")
                    ctx.goToScene("d7_hub")
                    true
                }
                1 -> {
                    ctx.syncMirrorDamage(30)
                    ctx.appendNarrative("<p class=\"action\">你拉上遮光簾，鏡像獨自承受了反噬（鏡像 HP -30）。</p>")
                    ctx.goToScene("d7_hub")
                    true
                }
                else -> false
            }

            "d7_st_library" -> when (choiceIndex) {
                0 -> {
                    ctx.damage(10)
                    ctx.appendNarrative("<p class=\"action\">你切斷噪音廣播替鏡像消音，自己耳膜微微震痛（正側 HP -10）。</p>")
                    ctx.goToScene("d7_hub")
                    true
                }
                1 -> {
                    ctx.addNote("note_d7_lib", "焚燒月台的殘頁", "「鏡像與正側的體力相差越小，列車才不會在終點翻覆。」")
                    ctx.addStress(10)
                    ctx.appendNarrative("<p class=\"action\">你收起飄落在車門口的書頁線索（已記入回憶錄）。</p>")
                    ctx.goToScene("d7_hub")
                    true
                }
                else -> false
            }

            "d7_st_hospital" -> if (choiceIndex == 0) {
                ctx.openPuzzle(
                    "身份交換鎖",
                    "鏡像電車前後共幾節核心車廂對稱並聯？（提示：1、2 號主車廂與對稱 2 節鏡像車廂）",
                    "4",
                    "提示：2 + 2 = 4"
                ) { ok ->
                    if (ok) {
                        ctx.setFlag("d7_puz_swap", true)
                        val avg = (ctx.state.hp + ctx.state.mirrorHp) / 2
                        ctx.setHp(avg)
                        ctx.syncMirrorDamage(ctx.state.mirrorHp - avg)
                        ctx.appendNarrative("<p class=\"action\">身份交換成功！雙側體力重新平衡至 $avg。</p>")
                        checkMirrorPuzzleAch(ctx)
                        ctx.goToScene("d7_hub")
                    }
                }
                true
            } else false

            "d7_reverse_station" -> if (choiceIndex == 0) {
                ctx.addItem("d7_reverse_ticket", "反向車站月台票", "鏡像世界的單程車票，寫著從未遺憾的站名。", "真結局鑰匙")
                ctx.heal(100)
                ctx.syncMirrorDamage(-100)
                ctx.appendNarrative("<p class=\"action\">你與鏡像交換了反向月台票，雙側狀態瞬間恢復圓滿。</p>")
                true
            } else false

            "d7_v60_ticket_pickup" -> if (choiceIndex == 0) {
                ctx.addItem("v60_tram_stub", "鏡像電車票根", "印著 03:17 編號的跨門信物。", "跨門信物")
                ctx.saveSideChainFlag("tram_stub")
                ctx.setFlag("v60_tram_stub", true)
                ctx.appendNarrative("<p class=\"action\">你妥善收好「鏡像電車票根」。</p>")
                ctx.goToScene("d7_hub")
                true
            } else false

            else -> false
        }
    }
}

object Door8BehaviorHandler : DoorBehaviorHandler {

    private data class DishInfo(
        val name: String,
        val satiety: Int,
        val hp: Int,
        val stress: Int,
        val noteTitle: String,
        val noteBody: String
    )

    private val dishes = listOf(
        DishInfo("1998年的糖醋排骨", 25, 15, -5, "餐盤記憶：糖醋排骨", "小學放學後外婆端上桌的溫熱排骨，酸甜裡藏著夕陽的味道。"),
        DishInfo("03:17 的冷萃黑咖啡", 15, 0, -15, "餐盤記憶：凌晨黑咖啡", "苦澀提神，讓你在疲憊的守夜裡重新看清桌上的紙條。"),
        DishInfo("無聲冬瓜盅", 20, 20, -15, "餐盤記憶：無聲冬瓜盅", "清甜暖胃的湯水撫平了焦躁，連呼吸都安靜下來。"),
        DishInfo("碎裂的檸檬棒棒糖", 15, 5, -10, "餐盤記憶：檸檬棒棒糖", "酸甜清爽的童年滋味，提醒著還有未完成的約定。"),
        DishInfo("急診室夜班烤吐司", 30, 10, -5, "餐盤記憶：夜班烤吐司", "林醫生值完大夜班後分半的吐司，焦香中帶著堅定。"),
        DishInfo("蘇晚的半碗陽春麵", 25, 25, -20, "餐盤記憶：半碗陽春麵", "巷口夜攤裡最樸實卻最溫暖的熱湯，你們曾約好再來吃一次。")
    )

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        when (sceneId) {
            "d8_prologue" -> ctx.unlockAchievement("ach_d8_enter")
            "d8_dessert_zone" -> ctx.unlockAchievement("ach_v59_d8_dessert")
            "d8_v61_free_hidden_dish" -> {
                ctx.setRelicUsed("tram_stub")
                ctx.heal(100)
                ctx.appendNarrative("<p class=\"action\">憑電車票根品嚐了隱藏主廚料理，體力完全恢復！</p>")
            }
            "d8_end_true" -> {
                ctx.markDungeonCleared(8)
                ctx.unlockAchievement("ach_d8_true")
                ctx.saveInheritance { it.copy(suwanSurvived = true, trusted = true) }
                ctx.triggerEnding("true", "夜市巷口的陽春麵", "你與蘇晚在櫃檯旁分食熱湯，苦澀與等待盡數化開，旋轉門外已是飄雨的真實街口。", "真結局 · 記憶共享")
            }
            "d8_end_true_perfect" -> {
                ctx.markDungeonCleared(8)
                ctx.unlockAchievement("ach_d8_true")
                ctx.triggerEnding("true", "八分飽的天平", "你既沒抗拒別人的故事，也沒被貪念吞沒。主廚深深鞠躬，替你推開黎明大門。", "真結局 · 精準平衡")
            }
            "d8_end_true_archivist" -> {
                ctx.markDungeonCleared(8)
                ctx.unlockAchievement("ach_d8_true")
                ctx.triggerEnding("true", "記憶味道的記錄者", "你把客人們的悲歡離合完整抄錄成冊，讓遺忘的靈魂都被記住了味道。", "真結局 · 味覺檔案")
            }
            "d8_end_sweet_finale" -> {
                ctx.markDungeonCleared(8)
                ctx.unlockAchievement("ach_d8_true")
                ctx.triggerEnding("hidden", "初戀青檸塔的餘韻", "甜點區的主廚為你拉開大門，晨光與咖啡香氣迎面撲來。", "隱藏真結局 · 甜點結算")
            }
            "d8_end_normal" -> {
                ctx.markDungeonCleared(8)
                ctx.triggerEnding("normal", "恰好的離席", "你結清帳單，帶著幾段溫暖陌生的記憶走出旋轉門。", "普通結局 · 離席")
            }
            "d8_end_fasting" -> {
                ctx.markDungeonCleared(8)
                ctx.triggerEnding("survive", "空腹清醒者", "你滴水未沾，沒被任何記憶同化，餓著肚子清醒地走出餐廳。", "逃過一劫 · 清醒絕食")
            }
            "d8_end_pawn" -> {
                ctx.markDungeonCleared(8)
                ctx.triggerEnding("survive", "典當的夏日午後", "你典當了一段無關緊要的夏日午後作為餐費，平安推門離場。", "逃過一劫 · 典當")
            }
            "d8_end_overeat" -> {
                ctx.unlockAchievement("ach_d8_full")
                ctx.triggerEnding("death_overeat", "飽食度 100%", "無數陌生人的一生在胃袋裡同時炸開，你成了長桌上的下一道新菜。", "壞結局 · 暴食")
            }
            "d8_end_ingredient" -> ctx.triggerEnding("death_ingredient", "切配間冷盤", "強闖正門的你被陰影拖進後廚，第二天長桌上多了一道新菜。", "壞結局 · 成為食材")
            "d8_end_v61_forever_full" -> {
                ctx.markDungeonCleared(8)
                ctx.unlockAchievement("ach_v61_d8_full200")
                ctx.triggerEnding("hidden", "永遠吃飽", "飽食度突破 200%！餐廳的主廚與客人為你鼓掌，你獲得了無盡迴廊永不飢餓的加護。", "v6.1 隱藏結局 · 永遠吃飽")
            }
        }
    }

    override fun getText(ctx: BehaviorContext, sceneId: String): List<String>? {
        return when (sceneId) {
            "d8_hub" -> {
                val tasted = ctx.getCounter("d8_tasted_count")
                listOf("<p class=\"system-msg\">【餐廳狀態】飽食度：<strong>${ctx.state.satiety}%</strong>（警戒線 100%） ｜ 已品嚐記憶菜餚：<strong>$tasted / 6</strong></p>")
            }
            "d8_cashier" -> {
                listOf("<p class=\"system-msg\">【結帳櫃檯】當前飽食度：<strong>${ctx.state.satiety}%</strong> ｜ 持有主廚食譜：${if (ctx.hasItem("chef_recipe")) "是" else "否"}</p>")
            }
            else -> null
        }
    }

    override fun isChoiceVisible(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        return when (sceneId) {
            "d8_hub" -> when (choiceIndex) {
                in 0..5 -> !ctx.hasFlag("d8_dish_$choiceIndex")
                6 -> !ctx.hasFlag("d8_lemon_used") && ctx.state.satiety > 0
                9 -> (ctx.isCleared(7) || ctx.hasSideRelic("tram_stub") || ctx.hasItem("v60_tram_stub")) && !ctx.isRelicUsed("tram_stub")
                12 -> ctx.hasSideRelic("tram_stub") || ctx.hasItem("v60_tram_stub")
                else -> true
            }
            "d8_kitchen" -> if (choiceIndex == 0) !ctx.hasItem("chef_recipe") else true
            "d8_cashier" -> when (choiceIndex) {
                0 -> ctx.hasItem("chef_recipe") && ctx.hasFlag("d8_noodles_eaten")
                1 -> ctx.state.satiety in 80..95
                2 -> ctx.getCounter("d8_tasted_count") >= 3
                3 -> ctx.state.satiety >= 60
                4 -> ctx.state.satiety == 0
                5 -> ctx.state.satiety in 1..59
                9 -> ctx.state.satiety >= 30 && (ctx.hasSideRelic("tram_stub") || ctx.hasItem("v60_tram_stub"))
                else -> true
            }
            "d8_dessert_zone" -> if (choiceIndex == 2) ctx.hasItem("d8_golden_spoon") else true
            else -> true
        }
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        return when (sceneId) {
            "d8_hub" -> when (choiceIndex) {
                in 0..5 -> {
                    val dish = dishes[choiceIndex]
                    ctx.setFlag("d8_dish_$choiceIndex", true)
                    if (choiceIndex == 5) ctx.setFlag("d8_noodles_eaten", true)
                    val tasted = ctx.incCounter("d8_tasted_count")
                    if (tasted >= 3) ctx.unlockAchievement("ach_d8_taste")
                    ctx.addSatiety(dish.satiety)
                    if (dish.hp > 0) ctx.heal(dish.hp)
                    if (dish.stress != 0) ctx.addStress(dish.stress)
                    ctx.addNote("note_d8_dish_$choiceIndex", dish.noteTitle, dish.noteBody)
                    ctx.appendNarrative("<p class=\"action\">你品嚐了《${dish.name}》（飽食度 +${dish.satiety}%）。</p>")
                    if (ctx.state.satiety >= 100) {
                        ctx.unlockAchievement("ach_d8_full")
                        ctx.goToScene("d8_end_overeat")
                    }
                    true
                }
                6 -> {
                    ctx.setFlag("d8_lemon_used", true)
                    ctx.addSatiety(-15)
                    ctx.appendNarrative("<p class=\"action\">酸澀的催吐檸檬水讓你吐出了部分雜質（飽食度 -15%）。</p>")
                    true
                }
                10 -> {
                    ctx.addSatiety(210 - ctx.state.satiety)
                    ctx.unlockAchievement("ach_v61_d8_full200")
                    ctx.goToScene("d8_end_v61_forever_full")
                    true
                }
                else -> false
            }

            "d8_kitchen" -> if (choiceIndex == 0) {
                ctx.openPuzzle(
                    "記憶高湯比例鎖",
                    "湯鍋標籤寫著：糖醋「20」分火候，冬瓜「15」分慢燉，總火候分鐘數是多少？",
                    "35",
                    "提示：20 + 15 = 35"
                ) { ok ->
                    if (ok) {
                        ctx.addItem("chef_recipe", "主廚的家常食譜", "泛黃的手寫筆記，記載著一碗陽春麵的真諦。", "真結局鑰匙")
                        ctx.appendNarrative("<p class=\"action\">比例鎖打開，你拿走了「主廚的家常食譜」。</p>")
                    }
                }
                true
            } else false

            "d8_cashier" -> if (choiceIndex == 9) {
                ctx.appendNarrative("<p class=\"action\">你出示「鏡像電車票根」折抵了一半飽食度需求！</p>")
                ctx.goToScene("d8_end_normal")
                true
            } else false

            "d8_dessert_zone" -> when (choiceIndex) {
                0 -> {
                    ctx.addStress(-100)
                    ctx.addSatiety(5)
                    ctx.addItem("d8_golden_spoon", "甜點主廚的純金小匙", "刻有 300 號微型標記的精緻小匙。", "甜點區真結局鑰匙")
                    ctx.appendNarrative("<p class=\"action\">酸甜青檸在舌尖融化，所有焦慮歸零！你獲得「甜點主廚的純金小匙」。</p>")
                    true
                }
                1 -> {
                    val idx = (ctx.incCounter("d8_story_cursor") - 1) % 300 + 1
                    val story = ctx.getBuffetStory(idx)
                    ctx.recordBuffetStoryTasted(idx)
                    if (story != null) {
                        ctx.appendNarrative("<p class=\"system-msg\">【微型人生故事 #$idx · ${story.title}】</p><p>${story.story}</p>")
                    }
                    true
                }
                else -> false
            }

            "d8_v60_ticket_discount" -> if (choiceIndex == 0) {
                ctx.addItem("v60_memory_shard", "自助餐記憶碎片", "從餐廳帶出的琥珀色味覺碎片。", "跨門信物")
                ctx.saveSideChainFlag("memory_shard")
                ctx.setFlag("v60_memory_shard", true)
                ctx.appendNarrative("<p class=\"action\">你收下了「自助餐記憶碎片」，準備將它帶往下一個年歲。</p>")
                ctx.goToScene("d8_hub")
                true
            } else false

            else -> false
        }
    }
}

object Door9BehaviorHandler : DoorBehaviorHandler {

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        when (sceneId) {
            "d9_prologue" -> ctx.unlockAchievement("ach_d9_bell")
            "d9_editorial_club" -> ctx.unlockAchievement("ach_v59_d9_editor")
            "d9_v61_summon_child_puzzle" -> {
                ctx.setRelicUsed("memory_shard")
                ctx.addItem("chalk_star", "彩色粉筆星", "十二歲的自己畫在手心的滿分星星。", "免試道具")
            }
            "d9_end_true" -> {
                ctx.markDungeonCleared(9)
                ctx.unlockAchievement("ach_d9_true")
                ctx.triggerEnding("true", "1999 的白色紙飛機", "紙飛機穿過二十七年的夕陽，穩穩落在你未來的書桌上。童年的你笑著和你並肩。", "真結局 · 童年和解")
            }
            "d9_end_true_magazine" -> {
                ctx.markDungeonCleared(9)
                ctx.unlockAchievement("ach_d9_true")
                ctx.triggerEnding("true", "油印機裡的千禧夜", "手搖油印機將「03:18 記得抬頭休息」印入生命底片，那晚不再冰冷。", "真結局 · 油印底片")
            }
            "d9_end_true_friends" -> {
                ctx.markDungeonCleared(9)
                ctx.unlockAchievement("ach_d9_true")
                ctx.triggerEnding("true", "斑馬線上的影子", "放學鐘響起，你與林小滿、小阿凱並肩走過斑馬線，影子被夕陽拉得很長。", "真結局 · 放學同行")
            }
            "d9_end_chief_editor" -> {
                ctx.markDungeonCleared(9)
                ctx.unlockAchievement("ach_d9_true")
                ctx.triggerEnding("hidden", "1999 校刊總編輯", "《千禧年特刊》發到走廊每個同學手中，紙飛機與油墨香改寫了遺憾。", "隱藏真結局 · 總編輯")
            }
            "d9_end_normal" -> {
                ctx.markDungeonCleared(9)
                ctx.triggerEnding("normal", "放學路隊的微風", "你輕輕摸了摸十二歲自己的頭，隨著下課鐘聲搭上夕陽路隊。", "普通結局 · 放學鐘聲")
            }
            "d9_end_notes" -> {
                ctx.markDungeonCleared(9)
                ctx.triggerEnding("normal", "鉛筆盒裡的密碼", "小陸衍把你留下的未來公式當成太空密碼，珍藏在鐵鉛筆盒底層。", "普通結局 · 太空密碼")
            }
            "d9_end_survive" -> {
                ctx.markDungeonCleared(9)
                ctx.triggerEnding("survive", "夏末蛙鳴的矮牆", "你在福利社後聽著蛙鳴等到天黑，安靜翻過矮牆回到迴廊。", "逃過一劫 · 蛙鳴")
            }
            "d9_end_bad_bias" -> ctx.triggerEnding("bad_bias", "粉筆灰的教室", "十二歲的你無法認出冷漠的大人版自己，教室在尖叫聲中坍塌為粉筆灰。", "壞結局 · 選擇偏誤")
            "d9_end_bad_homework" -> ctx.triggerEnding("bad_homework", "寫不完的八月", "日曆停在八月最後一天，面前堆著永遠寫不完的暑假作業。", "壞結局 · 八月循環")
            "d9_end_v61_grown_up" -> {
                ctx.markDungeonCleared(9)
                ctx.unlockAchievement("ach_v61_d9_grownup")
                ctx.triggerEnding("hidden", "我們一定要長大嗎", "「即使有遺憾，也要走去明天。」你在夕陽裡溫柔地微笑著與自己道別。", "v6.1 隱藏結局 · 當大人")
            }
        }
    }

    override fun isChoiceVisible(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        return when (sceneId) {
            "d9_classroom" -> when (choiceIndex) {
                0 -> !ctx.hasFlag("d9_adult_done")
                1 -> !ctx.hasItem("chalk_star")
                5 -> (ctx.hasSideRelic("memory_shard") || ctx.hasItem("v60_memory_shard")) && !ctx.isRelicUsed("memory_shard")
                8 -> ctx.hasSideRelic("memory_shard") || ctx.hasItem("v60_memory_shard")
                else -> true
            }
            "d9_store" -> if (choiceIndex == 0) !ctx.hasItem("ramune_1999") else true
            "d9_playground" -> when (choiceIndex) {
                0 -> ctx.hasItem("ramune_1999") && !ctx.hasItem("gym_key_1999")
                1 -> ctx.hasItem("gym_key_1999")
                else -> true
            }
            "d9_magazine" -> when (choiceIndex) {
                0 -> ctx.hasItem("millennium_badge") && ctx.hasItem("chalk_star")
                1 -> ctx.hasItem("chalk_star") || ctx.hasFlag("d9_interview_suwan")
                2 -> ctx.getCounter("d9_child_bias") <= 20
                else -> true
            }
            "d9_editorial_club" -> when (choiceIndex) {
                2 -> ctx.hasFlag("d9_interview_suwan") || ctx.hasFlag("d9_interview_teacher")
                else -> true
            }
            else -> true
        }
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        return when (sceneId) {
            "d9_classroom" -> when (choiceIndex) {
                0 -> {
                    ctx.setFlag("d9_adult_done", true)
                    ctx.incCounter("d9_child_bias", 20)
                    ctx.appendNarrative("<p class=\"action\">你直接說出了大人世界的標準答案，十二歲的自己眼神暗淡了些（童年偏誤 +20）。</p>")
                    true
                }
                1 -> {
                    ctx.openPuzzle(
                        "1999 世紀末質數附加題",
                        "最小的三個質數「2、3、？」——第三個最小質數是多少？",
                        "5",
                        "提示：2 之後的質數依序是 3、5、7"
                    ) { ok ->
                        if (ok) {
                            ctx.addItem("chalk_star", "彩色粉筆星", "小陸衍在黑板旁送你的五角星獎勵。", "校刊真結局必需品")
                            ctx.appendNarrative("<p class=\"action\">答案正確！小陸衍開心地畫了一顆「彩色粉筆星」給你。</p>")
                        }
                    }
                    true
                }
                else -> false
            }

            "d9_store" -> if (choiceIndex == 0) {
                ctx.addItem("ramune_1999", "1999年玻璃彈珠汽水", "清脆作響的冰涼汽水，全校男生女生都搶著要。", "可交給操場的小阿凱")
                ctx.heal(15)
                ctx.appendNarrative("<p class=\"action\">你買下一瓶玻璃彈珠汽水喝了一口（體力 +15）。</p>")
                true
            } else false

            "d9_playground" -> if (choiceIndex == 0) {
                ctx.removeItem("ramune_1999")
                ctx.addItem("gym_key_1999", "器材室銅鑰匙", "小阿凱用彈珠汽水換給你的舊鑰匙。", "可打開舊體育器材室")
                ctx.appendNarrative("<p class=\"action\">小阿凱接過彈珠汽水，神秘兮兮地把「器材室銅鑰匙」塞進你手裡。</p>")
                true
            } else false

            "d9_secret_gym" -> if (choiceIndex == 0) {
                ctx.addItem("millennium_badge", "千禧紀念章", "閃閃發光的 1999 小學紀念徽章。", "真結局鑰匙")
                ctx.setCounter("d9_child_bias", 0)
                ctx.unlockAchievement("ach_d9_bias")
                ctx.appendNarrative("<p class=\"action\">你戴上「千禧紀念章」，所有大人視角的疏離感與選擇偏誤盡數消融！</p>")
                ctx.goToScene("d9_playground")
                true
            } else false

            "d9_magazine" -> if (choiceIndex == 9) {
                ctx.addItem("v60_school_magazine", "1999年小學校刊", "油墨未乾的特刊，記載著最單純的願望。", "跨門信物")
                ctx.saveSideChainFlag("school_magazine")
                ctx.setFlag("v60_school_magazine", true)
                ctx.appendNarrative("<p class=\"action\">你將剛印好的《1999年小學校刊》捲進書包（已記錄跨門信物）。</p>")
                ctx.goToScene("d9_classroom")
                true
            } else false

            "d9_editorial_club" -> when (choiceIndex) {
                0 -> {
                    ctx.setFlag("d9_interview_suwan", true)
                    ctx.addNpcAffinity("suwan", 10)
                    ctx.addNote("note_d9_suwan", "採訪記錄：小蘇晚", "「我希望未來有一天，大家還能坐同一班晚自習的公車回家。」")
                    ctx.appendNarrative("<p class=\"action\">你完成了小蘇晚的溫柔專訪（已記入回憶錄）。</p>")
                    true
                }
                1 -> {
                    ctx.setFlag("d9_interview_teacher", true)
                    ctx.addNote("note_d9_teacher", "採訪記錄：自然老師", "「如果夜晚太長，記得抬頭看一眼教室窗外還亮著的路燈。」")
                    ctx.appendNarrative("<p class=\"action\">你記錄了自然老師關於燈塔與夜空的調查報告。</p>")
                    true
                }
                else -> false
            }

            "d9_v60_shard_dialogue" -> if (choiceIndex == 0) {
                ctx.addItem("v60_school_magazine", "1999年小學校刊", "帶著童年祝福的手搖油印特刊。", "跨門信物")
                ctx.saveSideChainFlag("school_magazine")
                ctx.setFlag("v60_school_magazine", true)
                ctx.appendNarrative("<p class=\"action\">你從十二歲的自己手中接過了《1999年小學校刊》。</p>")
                ctx.goToScene("d9_classroom")
                true
            } else false

            else -> false
        }
    }
}

object Door10BehaviorHandler : DoorBehaviorHandler {

    private fun reelCount(ctx: BehaviorContext): Int =
        listOf("reel_a", "reel_b", "reel_c", "reel_d").count { ctx.hasItem(it) }

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        when (sceneId) {
            "d10_prologue" -> ctx.unlockAchievement("ach_d10_enter")
            "d10_hub" -> {
                if (ctx.state.criticScore <= 0) {
                    ctx.goToScene("d10_end_walkout")
                }
            }
            "d10_projection" -> {
                if (ctx.state.criticScore >= 95) {
                    ctx.unlockAchievement("ach_d10_critic")
                }
            }
            "d10_v61_magazine_skip" -> {
                ctx.setRelicUsed("school_magazine")
                listOf("reel_a" to "A廳膠卷", "reel_b" to "B廳膠卷", "reel_c" to "C廳膠卷", "reel_d" to "D廳膠卷").forEach { (id, name) ->
                    ctx.addItem(id, name, "完整修復的 35mm 放映膠卷。", "放映室合成素材")
                }
                listOf("A", "B", "C", "D").forEach { ctx.recordMovieWatched(it) }
                ctx.modCritic(100 - ctx.state.criticScore)
            }
            "d10_end_cinephile" -> {
                ctx.markDungeonCleared(10)
                ctx.unlockAchievement("ach_d10_cinephile")
                ctx.unlockAchievement("ach_d10_true")
                ctx.triggerEnding("true", "資深影迷的金色長鏡頭", "四卷 35mm 膠卷完美銜接，售票員林默與鄰座幽靈在散場光芒中微笑致意。", "真結局 · 資深影迷")
            }
            "d10_end_director" -> {
                ctx.markDungeonCleared(10)
                ctx.unlockAchievement("ach_d10_true")
                ctx.triggerEnding("hidden", "導演剪輯版", "你在剪輯台前剪除了所有悲劇鏡頭，將畫面接向重逢的晨曦。", "隱藏結局 · 導演剪輯版")
            }
            "d10_end_v61_curtain_call" -> {
                ctx.markDungeonCleared(10)
                ctx.unlockAchievement("ach_v61_d10_curtain")
                ctx.triggerEnding("hidden", "四廳謝幕", "A、B、C、D 四座影廳全部觀影圓滿！全場響起經久不息的掌聲。", "v6.1 隱藏結局 · 謝幕")
            }
            "d10_end_eternal_screen" -> {
                ctx.markDungeonCleared(10)
                ctx.triggerEnding("hidden", "永不退潮的銀幕", "你跨過銀幕邊框，走進了那片溫柔寧靜的夏夜海堤。", "隱藏分歧 · 銀幕彼岸")
            }
            "d10_end_dawn" -> {
                ctx.markDungeonCleared(10)
                ctx.triggerEnding("normal", "早場陽光", "片尾字幕升起，你握著半截票根走上車水馬龍的早晨。", "普通結局 · 早場散場")
            }
            "d10_end_cut_reel" -> {
                ctx.markDungeonCleared(10)
                ctx.triggerEnding("survive", "剪斷主膠卷", "你在放映機起火前剪斷主膠卷，順著緊急出口衝出地下影院。", "逃過一劫 · 剪卷")
            }
            "d10_end_ghost_seat" -> {
                ctx.markDungeonCleared(10)
                ctx.triggerEnding("survive", "贈票鄰座", "你將出場票送給鄰座幽靈沈影，兩人在散場人潮中並肩離場。", "逃過一劫 · 幽靈鄰座")
            }
            "d10_end_cleaner" -> {
                ctx.markDungeonCleared(10)
                ctx.triggerEnding("survive", "後巷鐵門", "清潔工老陳用掃帚頂開後巷鐵門，放你趁著黎明前逃走。", "逃過一劫 · 清潔通道")
            }
            "d10_end_lookback" -> ctx.triggerEnding("death_lookback", "第 317 格黑白菲林", "你在驚悚片中忍不住回了頭，臉龐永遠定格在銀幕第 317 格。", "壞結局 · 回頭定格")
            "d10_end_unspoken" -> ctx.triggerEnding("death_unspoken", "NG 重拍循環", "潮水退盡，沒開口告白的你被永久困在重拍鏡頭裡。", "壞結局 · 沉默")
            "d10_end_coward" -> ctx.triggerEnding("death_coward", "無名客", "放棄拔刀的人連名字都不會出現在演職員表上。", "壞結局 · 棄刀")
            "d10_end_paradox" -> ctx.triggerEnding("death_paradox", "因果擦除", "強行扯斷量子放映機電源引發悖論，你的時間線歸零。", "壞結局 · 量子悖論")
            "d10_end_walkout" -> ctx.triggerEnding("bad_walkout", "負分退場", "影評人評分跌破零分，售票員無奈把你的票根剪碎。", "壞結局 · 評分歸零")
        }
    }

    override fun getText(ctx: BehaviorContext, sceneId: String): List<String>? {
        return when (sceneId) {
            "d10_hub", "d10_projection" -> listOf(
                "<p class=\"system-msg\">【影院計分】影評人評分：<strong>${ctx.state.criticScore}</strong> ｜ 已集齊膠卷：<strong>${reelCount(ctx)} / 4</strong></p>"
            )
            else -> null
        }
    }

    override fun isChoiceVisible(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        return when (sceneId) {
            "d10_hub" -> when (choiceIndex) {
                5 -> (ctx.hasSideRelic("school_magazine") || ctx.hasItem("v60_school_magazine")) && !ctx.isRelicUsed("school_magazine")
                7 -> ctx.hasSideRelic("school_magazine") || ctx.hasItem("v60_school_magazine")
                else -> true
            }
            "d10_projection" -> when (choiceIndex) {
                0 -> reelCount(ctx) >= 4
                1 -> reelCount(ctx) >= 3
                2 -> reelCount(ctx) >= 2
                else -> true
            }
            else -> true
        }
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        return when (sceneId) {
            "d10_hub" -> when (choiceIndex) {
                0 -> {
                    ctx.appendNarrative("<p class=\"action\">【逆向售票規則】你向售票員要「B 廳票」，他默不作聲地遞來一張「A 廳入場券」。</p>")
                    ctx.goToScene("d10_hall_a")
                    true
                }
                1 -> {
                    ctx.appendNarrative("<p class=\"action\">【逆向售票規則】你向售票員要「A 廳票」，手中卻拿到了一張「B 廳入場券」。</p>")
                    ctx.goToScene("d10_hall_b")
                    true
                }
                else -> false
            }

            "d10_hall_a" -> when (choiceIndex) {
                0 -> {
                    ctx.unlockAchievement("ach_d10_no_lookback")
                    ctx.addItem("reel_a", "A廳膠卷 · 驚悚", "記錄著永不回頭勇氣的 35mm 膠卷。", "放映室鑰匙")
                    ctx.recordMovieWatched("A")
                    ctx.modCritic(5)
                    ctx.appendNarrative("<p class=\"action\">你遵守規則盯緊前方直到片尾（影評 +5，獲得 A 廳膠卷）。</p>")
                    ctx.goToScene("d10_hub")
                    true
                }
                1 -> {
                    ctx.modCritic(-25)
                    ctx.appendNarrative("<p class=\"action\">中途離場觸發扣分（影評 -25）。</p>")
                    ctx.goToScene("d10_hub")
                    true
                }
                else -> false
            }

            "d10_hall_b" -> when (choiceIndex) {
                0 -> {
                    ctx.unlockAchievement("ach_d10_confess")
                    ctx.addItem("reel_b", "B廳膠卷 · 告白", "在潮水與月色間完成告白的膠卷。", "放映室鑰匙")
                    ctx.recordMovieWatched("B")
                    ctx.modCritic(5)
                    ctx.appendNarrative("<p class=\"action\">海潮與真心共鳴（影評 +5，獲得 B 廳膠卷）。</p>")
                    ctx.goToScene("d10_hub")
                    true
                }
                1 -> {
                    ctx.modCritic(-25)
                    ctx.appendNarrative("<p class=\"action\">你沉默退出 B 廳（影評 -25）。</p>")
                    ctx.goToScene("d10_hub")
                    true
                }
                else -> false
            }

            "d10_hall_c" -> when (choiceIndex) {
                0 -> {
                    ctx.openCombat(
                        enemyKey = "film_swordsman",
                        onWin = {
                            ctx.addItem("reel_c", "C廳膠卷 · 武俠", "斷刀不悔的武者膠卷。", "放映室鑰匙")
                            ctx.recordMovieWatched("C")
                            ctx.modCritic(8)
                            ctx.appendNarrative("<p class=\"action\">劍光落定，銀幕恢復清明（影評 +8，獲得 C 廳膠卷）。</p>")
                            ctx.goToScene("d10_hub")
                        },
                        onEscape = {
                            ctx.modCritic(-15)
                            ctx.goToScene("d10_hub")
                        }
                    )
                    true
                }
                1 -> {
                    ctx.modCritic(-25)
                    ctx.goToScene("d10_hub")
                    true
                }
                else -> false
            }

            "d10_hall_d" -> when (choiceIndex) {
                0 -> {
                    ctx.openV59Puzzle(V59PuzzleType.MirrorBeam) {
                        ctx.addItem("reel_d", "D廳膠卷 · 科幻", "0318 光線軌道折射完成的膠卷。", "放映室鑰匙")
                        ctx.recordMovieWatched("D")
                        ctx.modCritic(8)
                        ctx.appendNarrative("<p class=\"action\">雷射光束匯入量子放映口！（影評 +8，獲得 D 廳膠卷）。</p>")
                        ctx.goToScene("d10_hub")
                    }
                    true
                }
                1 -> {
                    ctx.modCritic(-25)
                    ctx.goToScene("d10_hub")
                    true
                }
                else -> false
            }

            "d10_v60_hidden_hall" -> if (choiceIndex == 0) {
                ctx.addItem("v60_clerk_watch", "售票員的歸途懷錶", "指針刻著動物園午夜標記的銀色懷錶。", "跨門信物")
                ctx.saveSideChainFlag("cinema_clerk")
                ctx.setFlag("v60_clerk_watch", true)
                ctx.appendNarrative("<p class=\"action\">林默微笑著將「歸途懷錶」放在你掌心：「下一站動物園見。」</p>")
                ctx.goToScene("d10_hub")
                true
            } else false

            else -> false
        }
    }
}

object Door11BehaviorHandler : DoorBehaviorHandler {

    private fun checkAllFed(ctx: BehaviorContext) {
        val count = ctx.getCounter("d11_frags_fed")
        if (count >= 6) {
            ctx.addItem("childhood_ticket_1999", "1999年兒童半價票", "蓋滿六枚動物印章的珍貴童年門票。", "正門真結局鑰匙")
            ctx.unlockAchievement("ach_d11_feed_all")
            ctx.unlockAchievement("ach_v59_all_animals")
        }
    }

    private fun feedZone(ctx: BehaviorContext, zone: String, name: String, fragId: String) {
        if (!ctx.hasFlag("d11_fed_$zone")) {
            ctx.setFlag("d11_fed_$zone", true)
            ctx.incCounter("d11_frags_fed")
            ctx.addChildhoodFrag(fragId)
            ctx.addNpcAffinity("keeper_zoo", 10)
            ctx.loseTime(6)
            ctx.appendNarrative("<p class=\"action\">你溫柔地餵食了$name（童年記憶碎片 +1，剩餘時間 -6 分鐘）。</p>")
            checkAllFed(ctx)
        } else {
            ctx.appendNarrative("<p class=\"system-msg\">${name}已經安靜地進食完畢了。</p>")
        }
        ctx.goToScene("d11_hub")
    }

    private fun beastDescent(ctx: BehaviorContext, zone: String) {
        ctx.modHumanity(-20)
        ctx.loseTime(6)
        ctx.appendNarrative("<p class=\"action\">你模仿野獸的嘶鳴與習慣（人性 -20%，當前人性 ${ctx.state.humanity}%）。</p>")
        ctx.goToScene("d11_hub")
    }

    override fun onEnter(ctx: BehaviorContext, sceneId: String) {
        when (sceneId) {
            "d11_prologue" -> ctx.unlockAchievement("ach_d11_enter")
            "d11_hub" -> {
                if ((ctx.state.countdown ?: 1) <= 0) {
                    ctx.goToScene("d11_end_exhibit")
                }
            }
            "d11_v61_summon_clerk_persuade" -> {
                ctx.setRelicUsed("cinema_clerk")
                ctx.modHumanity(20)
                ctx.incCounter("d11_frags_fed", 2)
                ctx.addChildhoodFrag("frag_clerk_1")
                ctx.addChildhoodFrag("frag_clerk_2")
                checkAllFed(ctx)
            }
            "d11_end_true_ticket" -> {
                ctx.markDungeonCleared(11)
                ctx.unlockAchievement("ach_d11_true")
                ctx.triggerEnding("true", "1999年兒童半價票", "蓋滿六枚動物印章的半價票卡過檢票口，月光下的百獸向你揮手道別。", "真結局 · 兒童半價票")
            }
            "d11_end_beast_soul" -> {
                ctx.markDungeonCleared(11)
                ctx.unlockAchievement("ach_d11_beast")
                ctx.triggerEnding("hidden", "化獸之夜", "人性歸於沉寂，你躍上月光假山與百獸一同在午夜叢林奔馳。", "特殊結局 · 化獸")
            }
            "d11_end_ark" -> {
                ctx.markDungeonCleared(11)
                ctx.triggerEnding("hidden", "午夜百獸大遊行", "所有柵欄同時敞開，你與獅子熊貓飛鳥在城市月色大道奔騰獲得自由。", "隱藏結局 · 百獸遊行")
            }
            "d11_end_v61_become_exhibit" -> {
                ctx.markDungeonCleared(11)
                ctx.unlockAchievement("ach_v61_d11_exhibit")
                ctx.triggerEnding("hidden", "成為午夜展品", "錯過閉園鐘響的你成為中央透明玻璃廳裡最平和的新展品，反而看清了整條迴廊的本質。", "v6.1 隱藏結局 · 展品")
            }
            "d11_end_normal_exit" -> {
                ctx.markDungeonCleared(11)
                ctx.triggerEnding("normal", "鐘響前的遊客", "你在 24:00 鐘聲敲響最後一下前穩穩跨出旋轉柵欄。", "普通結局 · 準時離園")
            }
            "d11_end_truck" -> {
                ctx.markDungeonCleared(11)
                ctx.triggerEnding("survive", "冷藏飼料貨車", "你蜷縮在空飼料桶後車廂，隨著夜間引擎發動駛出動物園側門。", "逃過一劫 · 貨車")
            }
            "d11_end_aviary_sky" -> {
                ctx.markDungeonCleared(11)
                ctx.triggerEnding("survive", "鳥園破網之月", "白鸚鵡雪球為你指引鐵網破口，你攀過樹冠翻出高牆。", "逃過一劫 · 越牆")
            }
            "d11_end_exhibit" -> ctx.triggerEnding("death_exhibit", "24:00 新展品", "午夜鐘響升起四面透明玻璃，動物們正饒有興致地隔著玻璃觀賞你。", "壞結局 · 新展品")
            "d11_end_lion_fang" -> ctx.triggerEnding("death_lion", "獅王領地", "貿然越欄闖入獅群領地的人，沒能看到午夜的月亮。", "壞結局 · 越欄")
            "d11_end_drowned" -> ctx.triggerEnding("death_drown", "珊瑚間的倒影", "你在幽藍水族箱底緩緩閉上雙眼。", "壞結局 · 溺水")
            "d11_end_wax" -> ctx.triggerEnding("death_wax", "第 13 號玻璃櫃", "玻璃櫃門鎖上的一刻，你的皮膚凝固成光滑蠟像。", "壞結局 · 蠟像")
        }
    }

    override fun getText(ctx: BehaviorContext, sceneId: String): List<String>? {
        return when (sceneId) {
            "d11_hub", "d11_gate_exit" -> listOf(
                "<p class=\"system-msg\">【午夜園區】人性保持度：<strong>${ctx.state.humanity}%</strong> ｜ 已安撫展區：<strong>${ctx.getCounter("d11_frags_fed")} / 6</strong></p>"
            )
            else -> null
        }
    }

    override fun isChoiceVisible(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        return when (sceneId) {
            "d11_hub" -> when (choiceIndex) {
                7 -> (ctx.hasSideRelic("cinema_clerk") || ctx.hasItem("v60_clerk_watch")) && !ctx.isRelicUsed("cinema_clerk")
                9 -> ctx.hasSideRelic("cinema_clerk") || ctx.hasItem("v60_clerk_watch")
                else -> true
            }
            "d11_gate_exit" -> when (choiceIndex) {
                0 -> ctx.hasItem("childhood_ticket_1999") && ctx.state.humanity >= 25
                1 -> ctx.state.humanity <= 25
                2 -> ctx.hasFlag("d11_zoo_key") || ctx.hasItem("zoo_key") || ctx.inheritance.goldenKey
                else -> true
            }
            else -> true
        }
    }

    override fun onChoiceAction(ctx: BehaviorContext, sceneId: String, choiceIndex: Int): Boolean {
        return when (sceneId) {
            "d11_panda" -> when (choiceIndex) {
                0 -> {
                    ctx.unlockAchievement("ach_d11_panda")
                    feedZone(ctx, "panda", "老熊貓團團", "frag_panda")
                    true
                }
                1 -> {
                    beastDescent(ctx, "panda")
                    true
                }
                else -> false
            }

            "d11_lion" -> when (choiceIndex) {
                0 -> {
                    feedZone(ctx, "lion", "獨眼獅王阿斯蘭", "frag_lion")
                    true
                }
                1 -> {
                    beastDescent(ctx, "lion")
                    true
                }
                2 -> {
                    ctx.openCombat(
                        enemyKey = "midnight_lion",
                        onWin = {
                            feedZone(ctx, "lion", "獨眼獅王阿斯蘭", "frag_lion")
                        },
                        onEscape = {
                            ctx.damage(12)
                            ctx.goToScene("d11_hub")
                        }
                    )
                    true
                }
                else -> false
            }

            "d11_aquarium" -> when (choiceIndex) {
                0 -> {
                    feedZone(ctx, "aquarium", "海豚藍月", "frag_aquarium")
                    true
                }
                1 -> {
                    beastDescent(ctx, "aquarium")
                    true
                }
                else -> false
            }

            "d11_aviary" -> when (choiceIndex) {
                0 -> {
                    ctx.openV59Puzzle(V59PuzzleType.RhythmBeat) {
                        feedZone(ctx, "aviary", "白鸚鵡雪球", "frag_aviary")
                    }
                    true
                }
                1 -> {
                    beastDescent(ctx, "aviary")
                    true
                }
                else -> false
            }

            "d11_reptile" -> when (choiceIndex) {
                0 -> {
                    ctx.openV59Puzzle(V59PuzzleType.Sliding3x3) {
                        ctx.addTime(15)
                        feedZone(ctx, "reptile", "百歲陸龜玄武", "frag_reptile")
                    }
                    true
                }
                1 -> {
                    beastDescent(ctx, "reptile")
                    true
                }
                else -> false
            }

            "d11_haunted" -> if (choiceIndex == 0) {
                ctx.setFlag("d11_zoo_key", true)
                feedZone(ctx, "haunted", "標本館最後的方糖", "frag_haunted")
                true
            } else false

            "d11_v60_clerk_gift" -> if (choiceIndex == 0) {
                ctx.addItem("v60_clerk_watch", "售票員的歸途懷錶", "穩住心跳與時間流的溫暖懷錶。", "跨門信物")
                ctx.addTime(10)
                ctx.modHumanity(10)
                ctx.appendNarrative("<p class=\"action\">懷錶的滴答聲溫暖了你的掌心（時間 +10 分鐘，人性 +10%）。</p>")
                ctx.goToScene("d11_hub")
                true
            } else false

            else -> false
        }
    }
}
