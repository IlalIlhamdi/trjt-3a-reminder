package com.trjt3a.reminder.ui.theme

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class ThemeMode(val title: String, val desc: String) {
    LIGHT("Tema Terang (Light Glass)", "Tampilan putih biru segar dan elegan"),
    DARK("Tema Gelap (Dark Glass)", "Mengurangi silau dan hemat baterai"),
    SYSTEM("Otomatis (Sistem)", "Mengikuti setelan sistem perangkat")
}

object ThemeManager {
    private val _themeMode = MutableStateFlow(ThemeMode.LIGHT)
    val themeMode: StateFlow<ThemeMode> = _themeMode.asStateFlow()

    fun setThemeMode(mode: ThemeMode) {
        _themeMode.value = mode
    }

    fun setDarkMode(enabled: Boolean) {
        _themeMode.value = if (enabled) ThemeMode.DARK else ThemeMode.LIGHT
    }
}
