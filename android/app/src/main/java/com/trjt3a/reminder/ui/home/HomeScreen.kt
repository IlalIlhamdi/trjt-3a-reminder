package com.trjt3a.reminder.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.PlayArrow
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.trjt3a.reminder.data.model.ClassStatus
import com.trjt3a.reminder.data.model.Schedule
import com.trjt3a.reminder.ui.components.CourseMaterialsDialog
import com.trjt3a.reminder.ui.components.HeroNextClassCard
import com.trjt3a.reminder.ui.components.PiketBannerActionCard
import com.trjt3a.reminder.ui.components.PiketScheduleDialog
import com.trjt3a.reminder.ui.components.TodayTimeline
import com.trjt3a.reminder.ui.theme.PrimaryBlue
import com.trjt3a.reminder.ui.theme.SoftBlue
import com.trjt3a.reminder.ui.theme.StatusSuccessBg
import com.trjt3a.reminder.ui.theme.StatusSuccessBorder
import com.trjt3a.reminder.ui.theme.StatusSuccessText
import com.trjt3a.reminder.ui.theme.StatusWarningBg
import com.trjt3a.reminder.ui.theme.StatusWarningBorder
import com.trjt3a.reminder.ui.theme.StatusWarningText
import com.trjt3a.reminder.ui.theme.VeryLightBlue

@Composable
fun HomeScreen(
    onNavigateToSchedule: () -> Unit,
    viewModel: HomeViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    var showPiketDialog by remember { mutableStateOf(false) }
    var selectedScheduleForMaterial by remember { mutableStateOf<Schedule?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Greeting & Status Pill Chip Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = uiState.greeting,
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 24.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                )
                Text(
                    text = uiState.formattedDate,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                )
            }

            // Status Pill Chip
            val isAllFinished = uiState.todaySchedules.isNotEmpty() && uiState.completedCount == uiState.todaySchedules.size
            val (chipBg, chipBorder, chipTextCol, chipIcon) = when {
                uiState.inProgressSchedule != null -> Tuple4(
                    VeryLightBlue,
                    SoftBlue,
                    PrimaryBlue,
                    Icons.Outlined.PlayArrow
                )
                uiState.currentStatus == ClassStatus.STARTING_SOON_H10 -> Tuple4(
                    StatusWarningBg,
                    StatusWarningBorder,
                    StatusWarningText,
                    Icons.Outlined.Notifications
                )
                isAllFinished -> Tuple4(
                    StatusSuccessBg,
                    StatusSuccessBorder,
                    StatusSuccessText,
                    Icons.Outlined.Check
                )
                else -> Tuple4(
                    VeryLightBlue,
                    SoftBlue,
                    PrimaryBlue,
                    Icons.Outlined.Schedule
                )
            }

            Surface(
                shape = RoundedCornerShape(99.dp),
                color = chipBg,
                border = androidx.compose.foundation.BorderStroke(1.dp, chipBorder)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = chipIcon,
                        contentDescription = null,
                        tint = chipTextCol,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        text = uiState.statusChipText,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = chipTextCol
                    )
                }
            }
        }

        // Hero Card (Ongoing / Upcoming Today / Next Academic Day)
        HeroNextClassCard(
            inProgressSchedule = uiState.inProgressSchedule,
            nextUpcomingSchedule = uiState.nextUpcomingSchedule,
            nextDaySchedule = uiState.nextDayUpcomingSchedule,
            nextDayName = uiState.nextDayName,
            status = uiState.currentStatus,
            countdownText = uiState.countdownText,
            progressPercent = uiState.progressPercent,
            onMaterialClick = { selectedScheduleForMaterial = it }
        )

        // Section: Jadwal Hari Ini
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Jadwal hari ini",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                )

                TextButton(onClick = onNavigateToSchedule) {
                    Text(
                        text = "Semua Hari",
                        color = PrimaryBlue,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                    )
                    Icon(
                        imageVector = Icons.Outlined.ChevronRight,
                        contentDescription = null,
                        tint = PrimaryBlue,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            TodayTimeline(
                todaySchedules = uiState.todaySchedules,
                currentScheduleId = uiState.inProgressSchedule?.id,
                completedScheduleIds = uiState.completedScheduleIds,
                onMaterialClick = { selectedScheduleForMaterial = it }
            )

            // Piket Action Card Banner
            PiketBannerActionCard(
                onClick = { showPiketDialog = true },
                modifier = Modifier.padding(top = 4.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))
    }

    // Piket Dialog
    if (showPiketDialog) {
        PiketScheduleDialog(
            onDismissRequest = { showPiketDialog = false }
        )
    }

    // Course Material Dialog
    selectedScheduleForMaterial?.let { schedule ->
        CourseMaterialsDialog(
            schedule = schedule,
            onDismissRequest = { selectedScheduleForMaterial = null }
        )
    }
}

private data class Tuple4<A, B, C, D>(val a: A, val b: B, val c: C, val d: D)
