package com.trjt3a.reminder.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val Shapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(10.dp),   // Badges
    medium = RoundedCornerShape(14.dp),  // Buttons & inner containers
    large = RoundedCornerShape(18.dp),   // Schedule & regular cards
    extraLarge = RoundedCornerShape(24.dp) // Hero Card & dialogs
)
