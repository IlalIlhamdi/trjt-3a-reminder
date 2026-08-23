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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.trjt3a.reminder.ui.components.AppHeader
import com.trjt3a.reminder.ui.components.EmptyStateCard
import com.trjt3a.reminder.ui.components.HeroNextClassCard
import com.trjt3a.reminder.ui.components.QuickStatsCards
import com.trjt3a.reminder.ui.components.TodayTimeline
import com.trjt3a.reminder.ui.theme.LightBackground
import com.trjt3a.reminder.ui.theme.PrimaryBlue
import com.trjt3a.reminder.ui.theme.TextPrimary

@Composable
fun HomeScreen(
    onNavigateToSchedule: () -> Unit,
    onNavigateToNotification: () -> Unit,
    viewModel: HomeViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            AppHeader(
                greeting = uiState.greeting,
                dateString = uiState.formattedDate,
                hasUnreadNotification = uiState.unreadNotifCount > 0,
                onNotificationClick = onNavigateToNotification
            )
        },
        containerColor = LightBackground
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Hero Card (Active or Upcoming) or Empty State
            val activeOrNextSchedule = uiState.inProgressSchedule ?: uiState.nextUpcomingSchedule
            if (activeOrNextSchedule != null) {
                HeroNextClassCard(
                    schedule = activeOrNextSchedule,
                    status = uiState.currentStatus,
                    countdownText = uiState.countdownText,
                    progressPercent = uiState.progressPercent
                )
            } else {
                EmptyStateCard(
                    nextDayName = uiState.nextDayName,
                    nextUpcomingSchedule = uiState.nextDayUpcomingSchedule,
                    onViewScheduleClick = onNavigateToSchedule
                )
            }

            // Quick Stats (Hari Ini & Selesai)
            QuickStatsCards(
                totalToday = uiState.totalCount,
                completedToday = uiState.completedCount
            )

            // Section: Jadwal Hari Ini
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Jadwal Hari Ini",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = TextPrimary
                        )
                    )

                    TextButton(onClick = onNavigateToSchedule) {
                        Text(
                            text = "Semua Hari",
                            color = PrimaryBlue,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
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
                    completedScheduleIds = uiState.completedScheduleIds
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
