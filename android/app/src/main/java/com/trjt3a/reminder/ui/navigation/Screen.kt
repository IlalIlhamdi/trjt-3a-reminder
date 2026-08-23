package com.trjt3a.reminder.ui.navigation

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Home : Screen("home")
    object Schedule : Screen("schedule")
    object Notification : Screen("notification")
    object Settings : Screen("settings")
}
