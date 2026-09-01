package com.trjt3a.reminder.ui.schedule

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.EventBusy
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.trjt3a.reminder.data.model.Schedule
import com.trjt3a.reminder.ui.components.CourseMaterialsDialog
import com.trjt3a.reminder.ui.components.PiketBannerActionCard
import com.trjt3a.reminder.ui.components.PiketScheduleDialog
import com.trjt3a.reminder.ui.components.ScheduleCardItem
import com.trjt3a.reminder.ui.components.SegmentedDaySelector
import com.trjt3a.reminder.ui.theme.BorderCard
import com.trjt3a.reminder.ui.theme.PrimaryBlue
import com.trjt3a.reminder.ui.theme.SoftBlue
import com.trjt3a.reminder.ui.theme.SurfaceWhite
import com.trjt3a.reminder.ui.theme.TextPrimary
import com.trjt3a.reminder.ui.theme.TextSecondary
import com.trjt3a.reminder.ui.theme.VeryLightBlue

@Composable
fun ScheduleScreen(
    viewModel: ScheduleViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    var showPiketDialog by remember { mutableStateOf(false) }
    var selectedScheduleForMaterial by remember { mutableStateOf<Schedule?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Title & Semester Badge Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Jadwal mingguan",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    letterSpacing = (-0.3).sp
                )
            )

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(99.dp))
                    .background(VeryLightBlue)
                    .border(1.dp, SoftBlue, RoundedCornerShape(99.dp))
                    .padding(horizontal = 12.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "Semester 5",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryBlue
                )
            }
        }

        // Day Segmented Selector Capsule
        SegmentedDaySelector(
            days = uiState.days,
            selectedDayId = uiState.selectedDayId,
            onDaySelected = { viewModel.selectDay(it) }
        )

        // Schedules List
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (uiState.schedulesForSelectedDay.isNotEmpty()) {
                items(uiState.schedulesForSelectedDay, key = { it.id }) { schedule ->
                    ScheduleCardItem(
                        schedule = schedule,
                        onMaterialClick = { selectedScheduleForMaterial = it }
                    )
                }

                item {
                    PiketBannerActionCard(
                        onClick = { showPiketDialog = true },
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            } else {
                item {
                    // Empty state for day without classes
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(SurfaceWhite)
                                .border(1.dp, BorderCard, RoundedCornerShape(16.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.EventBusy,
                                contentDescription = null,
                                tint = PrimaryBlue,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                        Text(
                            text = "Tidak Ada Kuliah",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Tidak ada jadwal perkuliahan terjadwal untuk hari ini.",
                            fontSize = 13.sp,
                            color = TextSecondary,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 32.dp)
                        )
                    }
                }
            }
        }
    }

    // Piket Schedule Dialog
    if (showPiketDialog) {
        PiketScheduleDialog(
            onDismissRequest = { showPiketDialog = false }
        )
    }

    // Material Details Dialog
    selectedScheduleForMaterial?.let { schedule ->
        CourseMaterialsDialog(
            schedule = schedule,
            onDismissRequest = { selectedScheduleForMaterial = null }
        )
    }
}
