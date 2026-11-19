package com.example.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.toRoute
import com.example.engine.GameUiState
import com.example.engine.GameViewModel
import com.example.model.AppScreen
import com.example.ui.screens.EndingScreen
import com.example.ui.screens.GameScreen
import com.example.ui.screens.GameTitleScreen
import com.example.ui.screens.HubScreen
import com.example.ui.screens.TitleScreen
import kotlinx.serialization.Serializable

@Serializable
data object MainMenuRoute

@Serializable
data object CorridorHubRoute

@Serializable
data class DoorBriefingRoute(val doorId: Int)

@Serializable
data class DoorGameRoute(val doorId: Int)

@Serializable
data class GameOverRoute(val doorId: Int, val isBadEnding: Boolean = false)

/**
 * Type-safe Jetpack Compose Navigation graph handling transitions between the main menu,
 * corridor hub, door briefing, per-door text-adventure game screens, and the game-over/ending screen.
 */
@Composable
fun AppNavGraph(
    navController: NavHostController,
    uiState: GameUiState,
    vm: GameViewModel,
    modifier: Modifier = Modifier
) {
    val activeDoorId = uiState.selectedDungeonMeta?.id ?: uiState.gameState.dungeonId
    val isBadEnding = uiState.ending?.isBad == true

    LaunchedEffect(uiState.screen, activeDoorId, isBadEnding) {
        val currentEntry = navController.currentBackStackEntry
        val currentDest = currentEntry?.destination

        when (uiState.screen) {
            AppScreen.TITLE -> {
                if (currentDest?.hasRoute<MainMenuRoute>() != true) {
                    navController.navigate(MainMenuRoute) {
                        popUpTo(navController.graph.startDestinationId) { inclusive = true }
                        launchSingleTop = true
                    }
                }
            }
            AppScreen.HUB -> {
                if (currentDest?.hasRoute<CorridorHubRoute>() != true) {
                    navController.navigate(CorridorHubRoute) {
                        popUpTo<MainMenuRoute> { inclusive = false }
                        launchSingleTop = true
                    }
                }
            }
            AppScreen.GAME_TITLE -> {
                val target = DoorBriefingRoute(activeDoorId)
                val sameRoute = currentDest?.hasRoute<DoorBriefingRoute>() == true &&
                    runCatching { currentEntry.toRoute<DoorBriefingRoute>().doorId == activeDoorId }.getOrDefault(false)
                if (!sameRoute) {
                    navController.navigate(target) {
                        launchSingleTop = true
                    }
                }
            }
            AppScreen.GAME -> {
                val target = DoorGameRoute(activeDoorId)
                val sameRoute = currentDest?.hasRoute<DoorGameRoute>() == true &&
                    runCatching { currentEntry.toRoute<DoorGameRoute>().doorId == activeDoorId }.getOrDefault(false)
                if (!sameRoute) {
                    navController.navigate(target) {
                        popUpTo<CorridorHubRoute> { inclusive = false }
                        launchSingleTop = true
                    }
                }
            }
            AppScreen.ENDING -> {
                val target = GameOverRoute(doorId = activeDoorId, isBadEnding = isBadEnding)
                val sameRoute = currentDest?.hasRoute<GameOverRoute>() == true &&
                    runCatching {
                        val route = currentEntry.toRoute<GameOverRoute>()
                        route.doorId == activeDoorId && route.isBadEnding == isBadEnding
                    }.getOrDefault(false)
                if (!sameRoute) {
                    navController.navigate(target) {
                        popUpTo<CorridorHubRoute> { inclusive = false }
                        launchSingleTop = true
                    }
                }
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = MainMenuRoute,
        modifier = modifier
    ) {
        composable<MainMenuRoute> {
            TitleScreen(uiState = uiState, vm = vm)
        }
        composable<CorridorHubRoute> {
            HubScreen(uiState = uiState, vm = vm)
        }
        composable<DoorBriefingRoute> { backStackEntry ->
            val route = backStackEntry.toRoute<DoorBriefingRoute>()
            LaunchedEffect(route.doorId) {
                vm.ensureDoorSelected(route.doorId)
            }
            GameTitleScreen(uiState = uiState, vm = vm)
        }
        composable<DoorGameRoute> { backStackEntry ->
            val route = backStackEntry.toRoute<DoorGameRoute>()
            LaunchedEffect(route.doorId) {
                vm.ensureDoorSelected(route.doorId)
            }
            GameScreen(uiState = uiState, vm = vm)
        }
        composable<GameOverRoute> {
            EndingScreen(uiState = uiState, vm = vm)
        }
    }
}
