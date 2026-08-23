package com.trjt3a.reminder.ui.schedule

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.outlined.WbSunny
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.trjt3a.reminder.ui.components.ScheduleCardItem
import com.trjt3a.reminder.ui.components.SegmentedDaySelector
import com.trjt3a.reminder.ui.theme.BorderCard
import com.trjt3a.reminder.ui.theme.LightBackground
import com.trjt3a.reminder.ui.theme.PrimaryBlue
import com.trjt3a.reminder.ui.theme.SurfaceWhite
import com.trjt3a.reminder.ui.theme.TextPrimary
import com.trjt3a.reminder.ui.theme.TextSecondary
import com.trjt3a.reminder.ui.theme.VeryLightBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScheduleScreen(
    viewModel: ScheduleViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            Surface(
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 2.dp
            ) {
                TopAppBar(
                    title = {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Jadwal Mingguan",
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 20.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            )

                            Box(
                                modifier = Modifier
                                    .padding(end = 16.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(VeryLightBlue)
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = "Semester 5",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryBlue
                                )
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Day Segmented Selector
            SegmentedDaySelector(
                days = uiState.days,
                selectedDayId = uiState.selectedDayId,
                onDaySelected = { viewModel.selectDay(it) }
            )

            // Schedules List or Empty State
            if (uiState.schedulesForSelectedDay.isNotEmpty()) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    items(uiState.schedulesForSelectedDay, key = { it.id }) { schedule ->
                        ScheduleCardItem(schedule = schedule)
                    }
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }
            } else {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 24.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.WbSunny,
                            contentDescription = null,
                            tint = PrimaryBlue,
                            modifier = Modifier.size(36.dp)
                        )
                        Text(
                            text = "Tidak Ada Jadwal Kuliah",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Hari ini libur / tidak ada sesi perkuliahan.",
                            fontSize = 14.sp,
                            color = TextSecondary,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}
