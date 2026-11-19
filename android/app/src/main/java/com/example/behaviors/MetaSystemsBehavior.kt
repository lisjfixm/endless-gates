package com.example.behaviors

import com.example.model.BuffetStoryDef
import com.example.model.DailyRuleDef
import com.example.model.GameSettings
import com.example.model.GlobalProgress
import com.example.model.InheritanceData
import com.example.model.PartyMember
import com.example.model.SystemsMeta
import kotlin.math.abs

data class RelEdgeDef(
    val from: String,
    val to: String,
    val type: String,
    val label: String
)

object MetaSystemsBehavior {

    val REL_EDGES = listOf(
        RelEdgeDef("luyan", "suwan", "affection", "愛慕／生死並肩"),
        RelEdgeDef("luyan", "laozhao", "trust", "生死相託"),
        RelEdgeDef("luyan", "akai", "betrayal", "鏡像背叛與和解"),
        RelEdgeDef("ankang", "yuanyuan", "parent", "親子執念"),
        RelEdgeDef("lin_doc", "yuanyuan", "parent", "醫者守護"),
        RelEdgeDef("prof_chen", "luyan", "parent", "師徒傳承"),
        RelEdgeDef("luyan", "lib_admin", "hostile", "規則對峙→理解"),
        RelEdgeDef("ankang", "zhoumin", "hostile", "真相封鎖")
    )

    private val ITEM_RARITY = mapOf(
        "golden_key" to "legendary",
        "golden_key2" to "legendary",
        "d1_master_blank" to "legendary",
        "d2_binding_needle" to "legendary",
        "d3_sunflower_seed" to "legendary",
        "d4_lantern_core" to "legendary",
        "d5_tide_bottle" to "legendary",
        "d6_dawn_tape" to "legendary",
        "d6_symphony_tape" to "legendary",
        "tram_wrench" to "legendary",
        "chef_recipe" to "legendary",
        "millennium_badge" to "legendary",
        "plane_1999" to "legendary",
        "d14_prime_key" to "legendary",
        "d14_bond_compass" to "legendary",
        "d14_truth_ledger" to "legendary",
        "molotov_bomb" to "rare",
        "temp_passkey" to "rare",
        "epinephrine_sedative" to "rare",
        "antibiotic_painkiller" to "rare",
        "prime_compass" to "rare",
        "bookmark_jade" to "rare",
        "pulse_stabilizer" to "rare",
        "astral_ember" to "rare",
        "tide_pearl" to "rare",
        "dawn_crystal" to "rare",
        "tram_token" to "rare",
        "tram_timetable" to "rare",
        "suwan_hairpin" to "rare",
        "zhao_lighter" to "rare",
        "akai_shard" to "rare",
        "conductor_pass" to "rare",
        "d7_reverse_ticket" to "rare",
        "d8_golden_spoon" to "rare",
        "d9_special_issue" to "rare",
        "d6_prof_medical_chart" to "rare"
    )

    fun getItemRarity(id: String): String = ITEM_RARITY[id] ?: "common"

    fun getItemRarityLabel(rarity: String): String = when (rarity) {
        "legendary" -> "傳說"
        "rare" -> "稀有"
        else -> "普通"
    }

    fun isConsumable(id: String): Boolean = id in setOf(
        "molotov_bomb", "temp_passkey", "mint_candy", "suwan_water",
        "painkiller", "antibiotic", "sedative", "backup_sedative",
        "epinephrine", "valium", "epinephrine_sedative", "antibiotic_painkiller",
        "bandage", "ramune_1999"
    )

    fun useConsumableItem(ctx: BehaviorContext, itemId: String): Boolean {
        if (!ctx.hasItem(itemId)) return false
        return when (itemId) {
            "molotov_bomb" -> {
                ctx.removeItem(itemId)
                ctx.heal(25)
                ctx.addStress(-30)
                ctx.setFlag("nurse_escaped", true)
                ctx.appendNarrative("<p class=\"action\">【高壓燃燒彈引爆】熾烈的火光瞬間驅散了走廊裡的陰影與幻覺（生命 +25，壓力 -30）。</p>")
                true
            }
            "temp_passkey" -> {
                ctx.setFlag("golden_key", true)
                ctx.appendNarrative("<p class=\"action\">你將「臨時磁感鑰匙」校準至萬用頻段，現在它能打開需要黃金鑰匙或門禁的鎖孔。</p>")
                true
            }
            "mint_candy" -> {
                ctx.removeItem(itemId)
                ctx.addStress(-25)
                ctx.appendNarrative("<p class=\"action\">清涼的薄荷味直衝腦門，你的壓力大幅減輕（壓力 -25）。</p>")
                true
            }
            "suwan_water" -> {
                ctx.removeItem(itemId)
                ctx.heal(20)
                ctx.appendNarrative("<p class=\"action\">你喝下蘇晚留下的礦泉水（生命 +20）。</p>")
                true
            }
            "painkiller" -> {
                ctx.removeItem(itemId)
                ctx.heal(15)
                ctx.addStress(-5)
                ctx.appendNarrative("<p class=\"action\">你吞下一顆止痛藥，頭痛與傷口的灼燒感舒緩了許多（生命 +15）。</p>")
                true
            }
            "antibiotic" -> {
                ctx.removeItem(itemId)
                ctx.heal(20)
                ctx.appendNarrative("<p class=\"action\">你注射了廣譜抗生素（生命 +20）。</p>")
                true
            }
            "sedative" -> {
                ctx.removeItem(itemId)
                if (ctx.dungeonId == 3) {
                    ctx.useSedativeBadEnd()
                } else {
                    ctx.addStress(-20)
                    ctx.appendNarrative("<p class=\"action\">你注射了一支鎮定劑，呼吸逐漸平緩（壓力 -20）。</p>")
                }
                true
            }
            "backup_sedative" -> {
                ctx.removeItem(itemId)
                ctx.addTime(25)
                ctx.addStress(-15)
                ctx.appendNarrative("<p class=\"action\">你使用了林醫生調製的應急鎮定劑，手腕上的倒計時慢了下來（時間 +25 分鐘）。</p>")
                true
            }
            "epinephrine" -> {
                ctx.removeItem(itemId)
                ctx.heal(30)
                ctx.appendNarrative("<p class=\"action\">你注射了腎上腺素，心跳強有力地恢復起來（生命 +30）。</p>")
                true
            }
            "valium" -> {
                ctx.removeItem(itemId)
                ctx.addTime(15)
                ctx.addStress(-10)
                ctx.appendNarrative("<p class=\"action\">你使用了安定劑，心神沉澱下來（時間 +15 分鐘，壓力 -10）。</p>")
                true
            }
            "epinephrine_sedative" -> {
                ctx.removeItem(itemId)
                ctx.heal(45)
                ctx.addTime(25)
                ctx.appendNarrative("<p class=\"action\">你注射了複合急救劑，傷勢大幅好轉且時間流速放緩（生命 +45，時間 +25 分鐘）。</p>")
                true
            }
            "antibiotic_painkiller" -> {
                ctx.removeItem(itemId)
                ctx.heal(35)
                ctx.addStress(-15)
                ctx.appendNarrative("<p class=\"action\">你服下了鎮痛抗炎複合藥丸，痛楚與壓力一併退散（生命 +35，壓力 -15）。</p>")
                true
            }
            "bandage" -> {
                ctx.removeItem(itemId)
                ctx.heal(18)
                ctx.appendNarrative("<p class=\"action\">你用應急繃帶包紮好傷處（生命 +18）。</p>")
                true
            }
            "ramune_1999" -> {
                ctx.removeItem(itemId)
                ctx.heal(15)
                ctx.addStress(-15)
                ctx.appendNarrative("<p class=\"action\">你喝下冰涼的彈珠汽水，氣泡帶來了夏天的味道（生命 +15，壓力 -15）。</p>")
                true
            }
            else -> false
        }
    }

    fun initPartyMembersForDungeon(
        dungeonId: Int,
        hasSuwanUpgrade: Boolean,
        chosenCompanion: String?
    ): List<PartyMember> {
        val base = when (dungeonId) {
            1 -> mutableListOf(
                PartyMember("suwan", "蘇晚", 100, 100, true),
                PartyMember("laozhou", "老趙", 100, 100, true),
                PartyMember("akai", "阿凱", 100, 100, true)
            )
            2 -> mutableListOf(
                PartyMember("suwan", "陳姐", 100, 100, true),
                PartyMember("laozhou", "老周", 100, 100, true),
                PartyMember("akai", "小宇", 100, 100, true)
            )
            3 -> mutableListOf(
                PartyMember("hospital_doctor", "林醫生", 100, 100, true),
                PartyMember("suwan", "小雨", 100, 100, true)
            )
            7 -> mutableListOf(
                PartyMember("tram_girl", "林雙", 100, 100, true),
                PartyMember("tram_tuner", "宋弦", 100, 100, true)
            )
            else -> mutableListOf()
        }
        if (hasSuwanUpgrade && base.none { it.name.startsWith("蘇晚") }) {
            base.add(PartyMember("suwan", "蘇晚(同行)", 100, 100, true))
        }
        if (!chosenCompanion.isNullOrBlank()) {
            val compName = when (chosenCompanion) {
                "suwan" -> "蘇晚(宿命)"
                "laozhao" -> "老趙(宿命)"
                "akai" -> "阿凱(宿命)"
                "lin_doc" -> "林醫生(宿命)"
                "cinema_seller" -> "林默(宿命)"
                else -> null
            }
            if (compName != null && base.none { it.id == chosenCompanion }) {
                base.add(PartyMember(chosenCompanion, compName, 100, 100, true))
            }
        }
        return base
    }

    fun evaluateDialogueCondition(
        code: String?,
        inheritance: InheritanceData,
        isNgPlus: Boolean,
        flags: Map<String, Boolean>,
        counters: Map<String, Int>
    ): Boolean {
        if (code.isNullOrBlank()) return true
        return when {
            code.contains("knows_2_trap") -> flags["knows_2_trap"] == true
            code.contains("knows_mirror") -> flags["knows_mirror"] == true
            code.contains("knows_exit") -> flags["knows_exit"] == true
            code.contains("mirror_defeated") -> inheritance.mirrorDefeated || flags["mirror_defeated"] == true
            code.contains("admin_guest") -> inheritance.adminGuest || flags["admin_guest"] == true
            code.contains("golden_key") -> inheritance.goldenKey || flags["golden_key"] == true
            code.contains("basement_knowledge") -> inheritance.basementKnowledge
            code.contains("yuanyuan") -> flags["yuanyuan_memory_done"] == true || flags["yuanyuan_photo"] == true
            code.contains("resets") -> (counters["resets"] ?: 0) >= 1 || inheritance.loopCount > 0
            code.contains("ng_plus") -> isNgPlus || inheritance.ngPlus
            else -> true
        }
    }

    fun getInheritancePrologue(npcId: String, inheritance: InheritanceData, isNgPlus: Boolean): String? {
        val extra = when (npcId) {
            "suwan" -> when {
                inheritance.suwanSurvived -> "（上週目餘韻）蘇晚看著你微怔了一下：「總覺得……我們之前好像已經一起走出過這座旅館。」"
                inheritance.mirrorDefeated -> "「你身上有一股鏡子碎裂的氣息……難道你已經打敗過那個『自己』？」"
                else -> null
            }
            "laozhao" -> if (inheritance.laozhouSurvived) "老趙摸了摸打火機笑道：「怪了，我怎麼總覺得欠你半條命。」" else null
            "akai" -> if (inheritance.mirrorDefeated) "阿凱低聲說：「別太相信走廊裡的反光……上次有人把它們打碎過。」" else null
            "hotel_landlord" -> if (inheritance.adminGuest) "（前塵遺響）他朝你輕輕頷首：「貴客，2 號房的鑰匙你從前見過的。」" else null
            "library_admin" -> if (inheritance.secondCleared) "管理員扶了扶眼鏡：「閱覽室的地毯下面，有些讀者曾經走過一次。」" else null
            "hospital_doctor" -> if (inheritance.thirdCleared) "林醫生緊緊握住手機：「我的女兒叫林念安……謝謝你幫我記起她的名字。」" else null
            "night_nurse" -> if (inheritance.yuanyuanCarried) "周敏看見你手心的溫熱微光：「謝謝你願意把她帶出來……」" else null
            else -> null
        }
        if (isNgPlus && extra == null) {
            return "【New Game+ 二周目感知】對方眼神一滯，似乎隱約認出了你在輪迴中重返此地的靈魂。"
        }
        return extra
    }

    fun askLibraryAdmin(question: String): String {
        val q = question.trim()
        return when {
            q.contains("出口") || q.contains("怎麼出去") || q.contains("離開") || q.contains("門") ->
                "管理員沒有抬頭，手指在桌下的紅木紋路輕敲了兩下：「地毯下面是空的。第三塊的左下角……別在鐘響三次前出聲。」"
            q.contains("媛媛") || q.contains("貓") || q.contains("女兒") || q.contains("畫") ->
                "管理員的指節猛地收緊，鋼筆在紙上停住：「她六歲那年就畫了這本畫冊。那位姓陳的院長……把我關在這裡幫他替她翻頁。禁書區年份鎖是 1987。」"
            q.contains("鈴") || q.contains("鐘") || q.contains("時間") ->
                "「第一聲鈴是提醒，第二聲是整理書架，第三聲之後，沒離開的讀者會變成書架上沒有名字的書。」"
            q.contains("書") || q.contains("名字") || q.contains("凹槽") ->
                "「共有五個凹槽。把屬於管理員的那本放進正中央——就能替我們之間換一條生路。」"
            q.contains("密碼") || q.contains("分類") || q.contains("鎖") ->
                "「前門密碼看那四個最常用字的筆畫（的、了、在、是 → 8269）；工具書鐵盒鎖著數學的分類號（5100）；卡片目錄則是圖書館學（0200）。」"
            else ->
                "管理員翻過一頁紙，頭也不抬地寫下一行小字：「安靜是最好的答案。問得越多，書架聽見的就越多。」"
        }
    }

    fun evaluateTitleUnlocked(
        titleId: String,
        progress: GlobalProgress,
        settings: GameSettings
    ): Boolean {
        val log = progress.endingsLog
        val achs = progress.unlockedAchievements
        val cleared = progress.clearedDungeons
        val inh = progress.inheritance
        return when (titleId) {
            "t_prime" -> cleared.contains(1) || log.any { it.startsWith("1|") }
            "t_librarian" -> cleared.contains(2) || log.any { it.startsWith("2|") }
            "t_doctor" -> cleared.contains(3) || log.any { it.startsWith("3|") }
            "t_keeper" -> cleared.contains(4) || achs.contains("ach_d4_true")
            "t_diver" -> cleared.contains(5) || achs.contains("ach_d5_true")
            "t_dawn" -> cleared.contains(6) || achs.contains("ach_d6_dawn")
            "t_survivor" -> cleared.size >= 3
            "t_collector" -> log.size >= 10 || progress.foundFragments.size >= 9
            "t_true" -> log.count { it.contains("|hidden") || it.contains("真") } >= 3 || cleared.contains(6)
            "t_altruist" -> inh.suwanSurvived && inh.laozhouSurvived
            "t_pacifist" -> achs.contains("ach_v61_pacifist")
            "t_pioneer" -> cleared.containsAll(listOf(1, 2, 3, 4, 5, 6))
            "t_namer" -> achs.contains("ach_d3_names")
            "t_minigamer" -> achs.contains("ach_mg_all") || progress.minigamesCleared.size >= 6
            // V59 Titles
            "t_v59_kill100" -> progress.combatWins >= 3 || inh.deathCount >= 100
            "t_v59_fate_weaver" -> log.size >= 15 || progress.d12VisitedFloors.size >= 12
            "t_v59_scholar" -> cleared.contains(6) && achs.contains("ach_v59_d6_records")
            "t_v59_silent_master" -> cleared.contains(2)
            "t_v59_gourmet" -> progress.buffetStoriesSeen.isNotEmpty()
            "t_v59_cinephile" -> cleared.contains(10)
            "t_v59_zookeeper" -> cleared.contains(11)
            "t_v59_jigsaw" -> progress.jigsawSolved
            "t_v59_enchanter" -> progress.enchantedItems.isNotEmpty()
            "t_v59_breakdown" -> achs.contains("ach_v59_stress_100")
            "t_v59_reverse_tram" -> achs.contains("ach_v59_d7_reverse")
            "t_v59_chief_editor" -> achs.contains("ach_v59_d9_editor")
            "t_v59_animal_friend" -> progress.animalsFed.size >= 6
            "t_v59_four_reels" -> progress.moviesWatched.size >= 4
            "t_v59_streak7" -> progress.dailyStreak >= 7 || achs.size >= 12
            "t_v59_ng_plus" -> inh.ngPlus
            // V61 Titles
            "t_v61_fate_weaver" -> progress.d12VisitedFloors.size >= 12 || achs.contains("ach_v61_fate_weaver")
            "t_v61_left_person" -> progress.titleFlags.contains("left_person")
            "t_v61_glass_heart" -> progress.titleFlags.contains("glass_heart")
            "t_v61_bare_hands" -> progress.titleFlags.contains("bare_hands")
            "t_v61_speedrunner" -> progress.titleFlags.contains("speedrunner")
            "t_v61_homeward_traveler" -> achs.contains("ach_v61_homeward_traveler")
            "t_v61_outsider" -> achs.contains("ach_v61_outsider")
            "t_v61_perseverance" -> progress.dailyStreak >= 30 || achs.contains("ach_v61_perseverance")
            "t_v61_collector" -> achs.contains("ach_v61_collector")
            "t_v61_parallel" -> progress.d12VisitedFloors.size >= 12
            "t_v61_stress_master" -> achs.contains("ach_v61_stress_master")
            "t_v61_charmer" -> achs.contains("ach_v61_charmer")
            // V70 Titles
            "t_v70_gate_architect" -> cleared.contains(14) || achs.contains("ach_v70_d14_true_dawn")
            "t_v70_gauntlet_king" -> progress.gauntletCleared.size >= 14
            "t_v70_tarot_master" -> achs.contains("ach_v70_d14_all_home") && progress.activeTarotId != null
            else -> progress.titleFlags.contains(titleId) || log.size >= 5
        }
    }

    fun getTrueEndingGapHint(dungeonId: Int, ctx: BehaviorContext): String {
        val inh = ctx.inheritance
        return when (dungeonId) {
            1 -> {
                val gaps = mutableListOf<String>()
                if (!ctx.hasItem("d1_master_blank")) gaps.add("尚未進入地下室石台後的「鍋爐暗室」取得初代總鑰匙胚")
                if (!ctx.hasFlag("arc_suwan_done")) gaps.add("尚未在二樓走廊完成「蘇晚支線（巷口的那碗陽春麵）」")
                if (!ctx.hasItem("golden_key") && !inh.goldenKey) gaps.add("尚未在 5 號房或地下室取得「黃金鑰匙」")
                if (gaps.isEmpty()) "已滿足質數旅館真結局全部條件！前往大廳鏡像或蘇晚支線即可觸發。"
                else "距離質數旅館真結局還缺：${gaps.joinToString("；")}"
            }
            2 -> {
                val gaps = mutableListOf<String>()
                if (!ctx.hasItem("d2_binding_needle")) gaps.add("尚未推開閱覽室後的「古籍修復暗室」取得無聲裝訂針")
                if (!ctx.hasItem("yuanyuan_album")) gaps.add("尚未在禁書區找齊媛媛的畫冊")
                if (gaps.isEmpty()) "已滿足沉默圖書館真結局全部條件！前往最終準備或管理員室即可觸發。"
                else "距離沉默圖書館真結局還缺：${gaps.joinToString("；")}"
            }
            3 -> {
                val gaps = mutableListOf<String>()
                if (!ctx.hasItem("d3_sunflower_seed")) gaps.add("尚未從四樓消防門登上「頂樓天台溫室」取得向日葵種子膠囊")
                if (!ctx.hasItem("yuanyuan_memory")) gaps.add("尚未取得媛媛的記憶卡")
                if (gaps.isEmpty()) "已滿足倒計時醫院真結局全部條件！前往 B2 核心區即可觸發。"
                else "距離倒計時醫院真結局還缺：${gaps.joinToString("；")}"
            }
            4 -> if (!ctx.allFragmentsFound() && !ctx.hasItem("d4_lantern_core")) {
                "距離無盡之間真結局還缺：集齊 9 枚迴廊碎片，或進入守門人木椅下的「燈芯密室」取得不滅燈芯。"
            } else "已滿足無盡之間真結局條件！"
            5 -> if (!ctx.hasItem("d5_tide_bottle") && !(ctx.hasFlag("d5_unspoken") && ctx.hasFlag("d5_untaken") && ctx.hasFlag("d5_cat"))) {
                "距離迴光之海真結局還缺：潛入退潮海床「海心珊瑚密室」取得定潮玻璃瓶，或看過未說出口的門、未走之路與紙貓。"
            } else "已滿足迴光之海真結局條件！"
            6 -> if (!ctx.hasItem("d6_dawn_tape") && !ctx.hasItem("d6_symphony_tape")) {
                "距離終焉觀測站真結局還缺：在質數主機輸入 17 並在天線塔輸入 0318 取得破曉磁帶。"
            } else "已滿足終焉觀測站真結局條件！"
            7 -> if (!ctx.hasItem("tram_wrench") || !ctx.hasItem("tram_timetable")) {
                "距離鏡像電車真結局還缺：在車站解謎取得「完整時刻表（答案28）」，並進入車廂連接處或總控室取得「緊急制動扳手」。"
            } else "已滿足鏡像電車真結局條件！前往駕駛室即可觸發。"
            8 -> if (!ctx.hasItem("chef_recipe") || !ctx.hasFlag("d8_noodles_eaten")) {
                "距離無盡自助餐真結局還缺：品嚐《蘇晚的半碗陽春麵》，並在後廚冷庫（密碼 35）取得「主廚的家常食譜」。"
            } else "已滿足無盡自助餐真結局條件！前往結帳櫃檯即可觸發。"
            9 -> if (!ctx.hasItem("millennium_badge") || !ctx.hasItem("chalk_star")) {
                "距離小學 1999 真結局還缺：解開黑板附加題（答案 5）拿粉筆星，並用福利社彈珠汽水跟小阿凱換鑰匙進入器材室拿「千禧紀念章」。"
            } else "已滿足小學 1999 真結局條件！前往校刊編輯室即可觸發。"
            10 -> if (ctx.getCounter("d10_reels") < 4) {
                "距離潮汐電影院真結局還缺：看過並收集 A/B/C/D 四廳片尾膠卷（目前 ${ctx.getCounter("d10_reels")} / 4）。"
            } else "已集齊四廳膠卷！前往頂層放映室即可觸發真結局。"
            11 -> if (!ctx.hasItem("childhood_ticket_1999")) {
                "距離動物園真結局還缺：餵食六個展區找齊 6 枚童年記憶碎片並合成「1999兒童半價票」（目前 ${ctx.getCounter("childhoodFrags")} / 6）。"
            } else "已合成 1999 兒童半價票！在午夜前保持人性值前往正門即可觸發真結局。"
            12 -> "在回聲電梯大廳點亮全部 1F–12F 平行樓層，並踏出電梯進行結算。"
            13 -> "在鏡廳逐一審視 7 面鏡子的「信任 / 擊碎」結局，並於中央揭示第 15 個真實鏡像。"
            14 -> {
                val gaps = mutableListOf<String>()
                if (!ctx.hasItem("d14_prime_key")) gaps.add("尚缺質數總控臺「質數密鑰」（2357）")
                if (!ctx.hasItem("d14_bond_compass")) gaps.add("尚缺同伴回聲廊「四重羈絆星盤」")
                if (!ctx.hasItem("d14_truth_ledger")) gaps.add("尚缺時間檔案庫「03:18 質數手帳」（0318）")
                if (gaps.isEmpty()) "已集齊聖殿三大信物！前往「無盡鍛造聖殿」即可啟動萬門終極真結局！"
                else "距離第十四扇門真結局還缺：${gaps.joinToString("；")}"
            }
            else -> "探索隱藏密室並留意同伴支線即可解鎖真結局。"
        }
    }

    fun getDailyRuleForDay(dayOfWeek1To7: Int, systems: SystemsMeta): DailyRuleDef? {
        return systems.v61DailyRules[dayOfWeek1To7.toString()]
            ?: systems.v61DailyRules.values.firstOrNull { it.day == dayOfWeek1To7 }
    }

    fun getBuffetStoryById(id: Int, systems: SystemsMeta): BuffetStoryDef {
        val clamped = id.coerceIn(1, 300)
        systems.buffetStories.firstOrNull { it.id == clamped }?.let { return it }
        val roles = listOf("加班程式員", "夜班計程車司機", "急診室護理師", "書店工讀生", "凌晨麵包師", "退休數學老師", "便利商店大夜店員", "音樂學院學生")
        val tastes = listOf("微焦醬香", "青檸酸甜", "海鹽清冽", "桂花微苦", "老火慢燉", "薄荷清涼", "焦糖微暖", "陳皮甘醇")
        val role = roles[(clamped - 1) % roles.size]
        val taste = tastes[(clamped / 3) % tastes.size]
        return BuffetStoryDef(
            id = clamped,
            title = "#%03d · %s的%s手記".format(clamped, role, taste),
            story = "盤底留著一段微弱卻真摯的記憶：那年凌晨三點十七分，一位${role}在回家的路上停下來喘了口氣，心想「再撐一下，天亮就能喝到溫熱的湯了」。"
        )
    }

    fun triggerAnomalyEffect(dungeonId: Int, choiceIdx: Int, ctx: BehaviorContext): String {
        val sign = if (choiceIdx == 0) 1 else -1
        return when (dungeonId) {
            1 -> if (choiceIdx == 0) {
                ctx.heal(20); ctx.addStress(-8)
                "【旅館異變】你將房號重新排列成質數階梯，走廊瞬間明朗起來（生命 +20，壓力 -8）。"
            } else {
                ctx.damage(10); ctx.addEcho(1)
                "【旅館異變】你強行折疊了數字縫隙，震盪雖傷身卻震出一道迴光（生命 -10，迴光 +1）。"
            }
            2 -> if (choiceIdx == 0) {
                ctx.setSilence(true); ctx.addStress(-15)
                "【圖書館異變】整排書頁同時停止翻動，館內歸於絕對寧靜（壓力 -15）。"
            } else {
                ctx.heal(15); ctx.addNpcAffinity("library_admin", 10)
                "【圖書館異變】你安靜地替傾斜的書架歸位，管理員投來讚許的目光（生命 +15，好感 +10）。"
            }
            3 -> if (choiceIdx == 0) {
                ctx.addTime(15); ctx.heal(10)
                "【醫院異變】你將掛鐘的齒輪輕輕撥慢半格，倒計時拉長了（時間 +15 分鐘，生命 +10）。"
            } else {
                ctx.addStress(-12); ctx.addNpcAffinity("hospital_doctor", 10)
                "【醫院異變】心電監護發出穩定長音，醫護的心神也隨之安定（壓力 -12，林醫生好感 +10）。"
            }
            7 -> if (choiceIdx == 0) {
                ctx.syncMirrorDamage(25); ctx.heal(25)
                "【電車異變】雙軌共鳴啟動，正側與鏡像的傷勢同時癒合（雙方 HP +25）。"
            } else {
                ctx.addStress(-15)
                "【電車異變】列車鳴笛穿越黑霧，車廂抖落了所有雜訊（壓力 -15）。"
            }
            8 -> if (choiceIdx == 0) {
                ctx.addSatiety(-20); ctx.heal(15)
                "【餐廳異變】桌上的清水突然散發清香，替你消除了多餘的飽脹感（飽食 -20%，生命 +15）。"
            } else {
                ctx.addStress(-18)
                "【餐廳異變】主廚在後廚敲響銀杓，餐廳響起安神的餐鈴（壓力 -18）。"
            }
            10 -> if (choiceIdx == 0) {
                ctx.modCritic(12); ctx.heal(10)
                "【影院異變】膠卷重新對焦至最佳幀率，影評分提升且精神振奮（影評分 +12，生命 +10）。"
            } else {
                ctx.addStress(-15)
                "【影院異變】銀幕散開柔和暖光，替你照亮全廳座位（壓力 -15）。"
            }
            11 -> if (choiceIdx == 0) {
                ctx.modHumanity(15); ctx.addTime(10)
                "【動物園異變】路燈暖意融融，你清楚記得自己的姓名與歸途（人性 +15%，時間 +10 分鐘）。"
            } else {
                ctx.heal(20)
                "【動物園異變】夜風帶來竹林與晨露的氣息（生命 +20）。"
            }
            else -> if (choiceIdx == 0) {
                ctx.heal(20); ctx.addStress(-12)
                "【門扉共鳴異變】你順應異變之門的脈動穩住呼吸（生命 +20，壓力 -12）。"
            } else {
                ctx.addStress(sign * -10); ctx.addEcho(1)
                "【門扉共鳴異變】裂縫中落下一粒溫暖的金光，照亮你的下一步（壓力 -10，迴光 +1）。"
            }
        }
    }

    fun getSceneHint(dungeonId: Int, sceneId: String): String {
        val specific = when (sceneId) {
            "detail" -> "輸入兩個相加等於 10、乘積取數字和的質數提示：答案是 3。"
            "room7" -> "10 以內可由兩個存在的質數房號（2,3,5,7）相加組成的和：答案 8,10。"
            "basement" -> if (dungeonId == 1) "最小質數(2)、唯一偶質數(2)、10內最大質數(7)、前三個和的個位(1) → 2271。"
            else "記得查閱周敏的交接本或散熱間線索。"
            "corridor_left" -> "最常用四漢字筆畫（的8、了2、在6、是9）→ 8269。"
            "reference_zone" -> "數學在杜威分類法為 510，第四位補 0 → 5100。"
            "forbidden_zone" -> "媛媛出生的那年（亦出現在舊電影票與校徽）→ 1987。"
            "d2_catalog_alcove" -> "圖書館學與資訊科學在杜威分類法為 020，末位補 0 → 0200。"
            "medicine_puzzle" -> "深色避光玻璃瓶是第 3 號 → 答案 3。"
            "medical_record_puzzle" -> "2003年4月15日過載崩潰人數，亦即太平間無名件格數 → 14。"
            "morgue_puzzle" -> "第 14 個英文字母 → N。"
            "d3_b2_behind" -> "事故日期 4 月 15 日 → 0415。"
            "threshold_mark" -> "推開過旅館、圖書館、醫院共 3 扇門 → 3。"
            "gate_time" -> "倒下且停滯的凌晨時刻 → 3:17。"
            "d5_well" -> "海每日一漲一退共搏動 → 2。"
            "d5_chapel" -> "停滯的時間（格式 時:分）→ 3:17。"
            "d5_lighthouse" -> "13 次迴聲減去 3 次空的 → 10。"
            "d6_server" -> "2,3,5,7,11,13 之後第 7 個質數 → 17。"
            "d6_roof" -> "03:17 跨過的一刻破曉四位頻率 → 0318。"
            "d6_echo_console" -> "13 號門 + 14 個名字 → 1314。"
            "d7_hub" -> "時刻表數列（2,3,5,7,11,13）加總（35）或對稱鏡像差（28）。"
            "d7_st_hospital" -> "對調總計 4 次 → 4。"
            "d8_kitchen" -> "黃金比例數字密碼 → 35。"
            "d9_classroom" -> "1999 世紀末質數附加題答案 → 5。"
            "d14_console_hub" -> "前四個基本質數連綴 → 2357。"
            "d14_archive_vault" -> "黎明時刻 → 0318。"
            else -> null
        }
        return specific ?: when (dungeonId) {
            1 -> "觀察質數房號 2, 3, 5, 7；從大廳或地下室找尋黃金鑰匙與總鑰匙胚。"
            2 -> "善用「問管理員」或查閱杜威分類號碼；禁聲規則下盡量保持沉默。"
            3 -> "留意倒計時並搜集藥房/內科/外科/太平間與頂樓溫室線索，別忘了 404 牆板下的十四個名字。"
            4 -> "重訪三扇舊門收集記憶，並在門前聆聽守門人的三句提問。"
            5 -> "在潮井切換漲潮／退潮，同時踏遍海床與光筏後才能揭開海心。"
            6 -> "聽取一、三號波段留言，並分別於主機、屋頂天線與檔案回聲機輸入校準碼。"
            7 -> "注意平衡正側與鏡像 HP（差距不超過 10），並找齊扳手與時刻表。"
            8 -> "品嚐多道料理並在 80%–95% 飽食度離席，別錯過主廚食譜與蘇晚的陽春麵。"
            9 -> "避開大人偏誤，到福利社買彈珠汽水找小阿凱換器材室鑰匙。"
            10 -> "售票員實行逆向售票（要 B 給 A）；集齊四廳膠卷前往放映室。"
            11 -> "餵食六個展區動物喚醒六枚童年碎片，維持人性值於 24:00 前返回正門。"
            12 -> "拜訪 1F–12F 各平行時空以記錄對應歷史與稱號。"
            13 -> "逐一檢視七面鏡像抉擇並於大廳收集全員記憶。"
            14 -> "取得控制台質數密鑰(2357)、四重羈絆星盤與檔案手帳(0318)後前往鍛造聖殿。"
            else -> "仔細觀察房間線索與同伴對白。"
        }
    }

    fun getChapterDefForScene(systems: SystemsMeta, dungeonId: Int, sceneId: String) =
        systems.chapterDefs[dungeonId.toString()]?.firstOrNull { it.scene == sceneId }
}
