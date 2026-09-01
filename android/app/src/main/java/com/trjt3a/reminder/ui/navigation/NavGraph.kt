package com.trjt3a.reminder.ui.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.trjt3a.reminder.data.repository.NotificationRepository
import com.trjt3a.reminder.ui.components.AppHeader
import com.trjt3a.reminder.ui.components.BottomNavBar
import com.trjt3a.reminder.ui.dosen.DosenScreen
import com.trjt3a.reminder.ui.home.HomeScreen
import com.trjt3a.reminder.ui.notification.NotificationScreen
import com.trjt3a.reminder.ui.schedule.ScheduleScreen
import com.trjt3a.reminder.ui.settings.SettingsScreen
import com.trjt3a.reminder.ui.splash.SplashScreen

@Composable
fun MainAppNavGraph(
    navController: NavHostController = rememberNavController(),
    notificationRepository: NotificationRepository = remember { NotificationRepository() }
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val notifications by notificationRepository.notifications.collectAsState(initial = emptyList())
    val unreadCount = notifications.count { !it.isRead }

    var isBottomBarVisible by remember { mutableStateOf(true) }

    // Reset visibility to true whenever the user switches tabs
    LaunchedEffect(currentRoute) {
        isBottomBarVisible = true
    }

    val nestedScrollConnection = remember {
        object : NestedScrollConnection {
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                // When dragging down / scrolling content up
                if (available.y < -4f) {
                    isBottomBarVisible = false
                } else if (available.y > 4f) {
                    isBottomBarVisible = true
                }
                return Offset.Zero
            }

            override fun onPostScroll(consumed: Offset, available: Offset, source: NestedScrollSource): Offset {
                if (consumed.y < -4f) {
                    isBottomBarVisible = false
                } else if (consumed.y > 4f) {
                    isBottomBarVisible = true
                }
                return Offset.Zero
            }
        }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .nestedScroll(nestedScrollConnection),
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        topBar = {
            if (currentRoute != null && currentRoute != Screen.Splash.route) {
                AppHeader(
                    hasUnreadNotification = unreadCount > 0,
                    onNotificationClick = {
                        if (currentRoute != Screen.Notification.route) {
                            navController.navigate(Screen.Notification.route) {
                                popUpTo(Screen.Home.route) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    }
                )
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            NavHost(
                navController = navController,
                startDestination = Screen.Splash.route,
                modifier = Modifier.fillMaxSize()
            ) {
                // 1. Splash Screen
                composable(Screen.Splash.route) {
                    SplashScreen(
                        onSplashFinished = {
                            navController.navigate(Screen.Home.route) {
                                popUpTo(Screen.Splash.route) {
                                    inclusive = true
                                }
                            }
                        }
                    )
                }

                // 2. Main App Screens (5 Tabs)
                composable(Screen.Home.route) {
                    HomeScreen(
                        onNavigateToSchedule = {
                            navController.navigate(Screen.Schedule.route) {
                                popUpTo(Screen.Home.route) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }

                composable(Screen.Schedule.route) {
                    ScheduleScreen()
                }

                composable(Screen.Notification.route) {
                    NotificationScreen()
                }

                composable(Screen.Dosen.route) {
                    DosenScreen()
                }

                composable(Screen.Settings.route) {
                    SettingsScreen()
                }
            }

            // Scroll-to-Hide Floating Capsule Bottom Navigation Bar
            if (currentRoute != null && currentRoute != Screen.Splash.route) {
                AnimatedVisibility(
                    visible = isBottomBarVisible,
                    enter = slideInVertically(
                        initialOffsetY = { it * 2 },
                        animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy, stiffness = Spring.StiffnessMediumLow)
                    ) + fadeIn(animationSpec = tween(150)),
                    exit = slideOutVertically(
                        targetOffsetY = { it * 2 },
                        animationSpec = tween(durationMillis = 220)
                    ) + fadeOut(animationSpec = tween(150)),
                    modifier = Modifier.align(Alignment.BottomCenter)
                ) {
                    BottomNavBar(
                        currentRoute = currentRoute,
                        unreadNotifCount = unreadCount,
                        onNavigate = { route ->
                            if (route != currentRoute) {
                                navController.navigate(route) {
                                    popUpTo(Screen.Home.route) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}
