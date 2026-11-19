package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.credentials.CredentialManager
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.rememberNavController
import com.example.cloud.CloudAccountInfo
import com.example.cloud.authStateFlow
import com.example.cloud.signOutGoogle
import com.example.engine.GameUiState
import com.example.engine.GameViewModel
import com.example.model.GameSettings
import com.example.model.UiOverlay
import com.example.ui.components.ChapterCardOverlay
import com.example.ui.components.DoorTransitionOverlay
import com.example.ui.components.FloatingStatusBanners
import com.example.ui.modals.AchievementsModal
import com.example.ui.modals.AdminQaModal
import com.example.ui.modals.AlchemyModal
import com.example.ui.modals.BranchTreeModal
import com.example.ui.modals.ChronoRewindModal
import com.example.ui.modals.CloudSyncModal
import com.example.ui.modals.CombatModal
import com.example.ui.modals.DailyChallengeModal
import com.example.ui.modals.DeductionRadarModal
import com.example.ui.modals.DialogDrawerModal
import com.example.ui.modals.EnvGazeModal
import com.example.ui.modals.GalleryModal
import com.example.ui.modals.GateAnomalyModal
import com.example.ui.modals.GateModalContainer
import com.example.ui.modals.GateRiddleModal
import com.example.ui.modals.GmConsoleModal
import com.example.ui.modals.HistoryModal
import com.example.ui.modals.InventoryModal
import com.example.ui.modals.ItemDetailModal
import com.example.ui.modals.MapModal
import com.example.ui.modals.MemoirModal
import com.example.ui.modals.MiniGameModal
import com.example.ui.modals.MysteryLockModal
import com.example.ui.modals.NotebookModal
import com.example.ui.modals.OutsiderDialogModal
import com.example.ui.modals.PartyHealTargetModal
import com.example.ui.modals.PauseMenuModal
import com.example.ui.modals.PreviewDungeonModal
import com.example.ui.modals.PuzzleModal
import com.example.ui.modals.SanctumModal
import com.example.ui.modals.SaveLoadModal
import com.example.ui.modals.SettingsModal
import com.example.ui.modals.ShopModal
import com.example.ui.modals.TrialContractsModal
import com.example.ui.modals.V59PuzzleModal
import com.example.ui.navigation.AppNavGraph
import com.example.ui.screens.AuthScreen
import com.example.ui.screens.PseudoEndingOverlay
import com.example.ui.theme.InfiniteGatesTheme
import com.example.ui.theme.LocalGatePalette
import com.google.firebase.Firebase
import com.google.firebase.auth.auth

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        setContent {
            AppAuthGateRoot()
        }
    }
}

@Composable
private fun AppAuthGateRoot() {
    val auth = remember { Firebase.auth }
    val currentUser by auth.authStateFlow().collectAsStateWithLifecycle(initialValue = auth.currentUser)
    val user = currentUser

    if (user == null) {
        InfiniteGatesTheme(settings = GameSettings()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(LocalGatePalette.current.bgDeep)
                    .windowInsetsPadding(WindowInsets.safeDrawing)
            ) {
                AuthScreen(onAuthSuccess = {})
            }
        }
    } else {
        key(user.uid) {
            val vm: GameViewModel = viewModel(key = user.uid)
            val uiState by vm.uiState.collectAsStateWithLifecycle()
            val lifecycleOwner = LocalLifecycleOwner.current
            val context = LocalContext.current
            val scope = rememberCoroutineScope()
            val credentialManager = remember(context) { CredentialManager.create(context) }

            DisposableEffect(lifecycleOwner, vm) {
                val observer = object : DefaultLifecycleObserver {
                    override fun onStart(owner: LifecycleOwner) {
                        vm.setLifecyclePaused(false)
                    }

                    override fun onStop(owner: LifecycleOwner) {
                        vm.setLifecyclePaused(true)
                    }
                }
                lifecycleOwner.lifecycle.addObserver(observer)
                onDispose {
                    lifecycleOwner.lifecycle.removeObserver(observer)
                }
            }

            LaunchedEffect(user.uid) {
                vm.attachCloudAccount(
                    CloudAccountInfo(
                        uid = user.uid,
                        displayName = user.displayName.orEmpty(),
                        email = user.email.orEmpty()
                    )
                )
            }

            InfiniteGatesTheme(settings = uiState.settings) {
                InfiniteGatesAppRoot(
                    uiState = uiState,
                    vm = vm,
                    onSignOutRequested = {
                        signOutGoogle(
                            credentialManager = credentialManager,
                            scope = scope,
                            beforeSignOut = { vm.detachCloudAccount() }
                        )
                    }
                )
            }
        }
    }
}

@Composable
private fun InfiniteGatesAppRoot(
    uiState: GameUiState,
    vm: GameViewModel,
    onSignOutRequested: () -> Unit
) {
    val palette = LocalGatePalette.current
    val navController = rememberNavController()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(palette.bgDeep)
            .windowInsetsPadding(WindowInsets.safeDrawing)
    ) {
        AppNavGraph(
            navController = navController,
            uiState = uiState,
            vm = vm,
            modifier = Modifier.fillMaxSize()
        )

        uiState.pseudoEnding?.let { pe ->
            PseudoEndingOverlay(pe = pe)
        }

        ChapterCardOverlay(banner = uiState.chapterCard)
        DoorTransitionOverlay(label = uiState.doorTransitionText)

        when (val ov = uiState.overlay) {
            UiOverlay.None -> Unit
            is UiOverlay.PreviewDungeon -> PreviewDungeonModal(ov.dungeon, vm)
            UiOverlay.Inventory -> InventoryModal(uiState, vm)
            UiOverlay.Memoir -> MemoirModal(uiState, vm)
            UiOverlay.Map -> MapModal(uiState, vm)
            is UiOverlay.DialogDrawer -> DialogDrawerModal(ov.selectedNpcId, ov.currentNodeId, uiState, vm)
            UiOverlay.Achievements -> AchievementsModal(uiState, vm)
            UiOverlay.History -> HistoryModal(uiState, vm)
            UiOverlay.BranchTree -> BranchTreeModal(uiState, vm)
            is UiOverlay.SaveLoad -> SaveLoadModal(ov.isSaveMode, uiState, vm)
            UiOverlay.PauseMenu -> PauseMenuModal(vm)
            UiOverlay.Settings -> SettingsModal(uiState, vm)
            UiOverlay.Gallery -> GalleryModal(uiState, vm)
            is UiOverlay.Notebook -> NotebookModal(uiState, vm)
            is UiOverlay.Sanctum -> SanctumModal(ov.initialTab, uiState, vm)
            UiOverlay.Shop -> ShopModal(uiState, vm)
            UiOverlay.DailyChallenge -> DailyChallengeModal(uiState, vm)
            UiOverlay.TrialContracts -> TrialContractsModal(uiState, vm)
            UiOverlay.ChronoRewind -> ChronoRewindModal(uiState, vm)
            UiOverlay.DeductionRadar -> DeductionRadarModal(uiState, vm)
            UiOverlay.Alchemy -> AlchemyModal(uiState, vm)
            UiOverlay.EnvGaze -> EnvGazeModal(uiState, vm)
            UiOverlay.GateRiddle -> GateRiddleModal(uiState, vm)
            UiOverlay.GateAnomaly -> GateAnomalyModal(uiState, vm)
            UiOverlay.OutsiderDialog -> OutsiderDialogModal(uiState, vm)
            UiOverlay.NgPlusInfo -> GateModalContainer(title = "二周目輪迴記憶", onClose = { vm.closeOverlay() }) {
                Text("通關第 6 扇門後即可攜帶關鍵印記與記憶碎片重新輪迴，解鎖第 12 扇門與第 13 扇門，並揭示隱藏對白。")
            }
            UiOverlay.NewGamePlusConfirm -> GateModalContainer(title = "確認開啟二周目輪迴？", onClose = { vm.closeOverlay() }) {
                Text("將保留全域結局與稱號進度，重新進入門扉。")
                Button(onClick = { vm.startNewGamePlus() }) { Text("確認輪迴") }
            }
            is UiOverlay.MysteryLock -> MysteryLockModal(ov.dungeon, vm)
            UiOverlay.GmConsole -> GmConsoleModal(uiState, vm)
            is UiOverlay.ItemDetail -> ItemDetailModal(ov.item, uiState, vm)
            is UiOverlay.PartyHealTarget -> PartyHealTargetModal(ov.item, uiState, vm)
            is UiOverlay.Puzzle -> PuzzleModal(ov.state, vm)
            is UiOverlay.AdminQa -> AdminQaModal(ov.state, vm)
            is UiOverlay.Combat -> CombatModal(ov.state, uiState, vm)
            is UiOverlay.V59Puzzle -> V59PuzzleModal(ov.state, uiState, vm)
            is UiOverlay.MiniGame -> MiniGameModal(ov.state, vm)
            UiOverlay.CloudSync -> CloudSyncModal(
                uiState = uiState,
                vm = vm,
                onSignOutRequested = onSignOutRequested
            )
            is UiOverlay.SimpleAlert -> GateModalContainer(title = ov.title, onClose = { vm.closeOverlay() }) {
                Text(ov.message)
                Button(onClick = {
                    ov.onConfirm?.invoke()
                    vm.closeOverlay()
                }) { Text("確認") }
            }
        }

        FloatingStatusBanners(
            toastMessage = uiState.toastMessage,
            sfxSubtitle = uiState.sfxSubtitle,
            achievementBanner = uiState.achievementBanner,
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 60.dp)
        )
    }
}
