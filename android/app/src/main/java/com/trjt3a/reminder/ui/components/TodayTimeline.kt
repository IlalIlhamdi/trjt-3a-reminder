package com.trjt3a.reminder.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.trjt3a.reminder.data.model.ClassStatus
import com.trjt3a.reminder.data.model.Schedule
import com.trjt3a.reminder.ui.theme.BorderCard
import com.trjt3a.reminder.ui.theme.BorderColor
import com.trjt3a.reminder.ui.theme.BorderSubtle
import com.trjt3a.reminder.ui.theme.DeepBlue
import com.trjt3a.reminder.ui.theme.PrimaryBlue
import com.trjt3a.reminder.ui.theme.StatusCompleted
import com.trjt3a.reminder.ui.theme.StatusCompletedBg
import com.trjt3a.reminder.ui.theme.StatusCompletedText
import com.trjt3a.reminder.ui.theme.StatusSuccess
import com.trjt3a.reminder.ui.theme.StatusSuccessBg
import com.trjt3a.reminder.ui.theme.StatusSuccessText
import com.trjt3a.reminder.ui.theme.SurfaceWhite
import com.trjt3a.reminder.ui.theme.TextPrimary
import com.trjt3a.reminder.ui.theme.TextSecondary
import com.trjt3a.reminder.ui.theme.VeryLightBlue

@Composable
fun TodayTimeline(
    todaySchedules: List<Schedule>,
    currentScheduleId: String?,
    completedScheduleIds: Set<String>,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        todaySchedules.forEachIndexed { index, schedule ->
            val isCurrent = schedule.id == currentScheduleId
            val isCompleted = completedScheduleIds.contains(schedule.id)
            val isLast = index == todaySchedules.lastIndex

            val status = when {
                isCurrent -> ClassStatus.IN_PROGRESS
                isCompleted -> ClassStatus.COMPLETED
                else -> ClassStatus.UPCOMING
            }

            TimelineItem(
                schedule = schedule,
                status = status,
                showConnector = !isLast
            )
        }
    }
}

@Composable
private fun TimelineItem(
    schedule: Schedule,
    status: ClassStatus,
    showConnector: Boolean
) {
    val stripColor = when (status) {
        ClassStatus.IN_PROGRESS -> StatusSuccess
        ClassStatus.COMPLETED -> StatusCompleted
        else -> PrimaryBlue
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        verticalAlignment = Alignment.Top
    ) {
        // Time Column on Left
        Column(
            modifier = Modifier.width(64.dp),
            horizontalAlignment = Alignment.End
        ) {
            Text(
                text = schedule.formattedStartTime,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = if (status == ClassStatus.IN_PROGRESS) PrimaryBlue else TextPrimary
            )
            Text(
                text = schedule.formattedEndTime,
                fontSize = 12.sp,
                color = TextSecondary
            )
        }

        // Card on Right with Left Accent Strip
        Card(
            modifier = Modifier
                .weight(1f)
                .border(1.dp, BorderCard, RoundedCornerShape(18.dp)),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            elevation = CardDefaults.cardElevation(
                defaultElevation = if (status == ClassStatus.IN_PROGRESS) 4.dp else 2.dp
            )
        ) {
            Row(modifier = Modifier.fillMaxWidth()) {
                // 4dp Left Strip
                Box(
                    modifier = Modifier
                        .width(4.dp)
                        .height(110.dp)
                        .background(stripColor)
                )

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = schedule.courseName,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Person,
                            contentDescription = null,
                            tint = TextSecondary,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = schedule.displayLecturer,
                            fontSize = 13.sp,
                            color = TextSecondary
                        )
                    }

                    HorizontalDivider(
                        color = BorderSubtle,
                        modifier = Modifier.padding(top = 4.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Location badge
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(VeryLightBlue)
                                .padding(horizontal = 6.dp, vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.LocationOn,
                                contentDescription = null,
                                tint = PrimaryBlue,
                                modifier = Modifier.size(12.dp)
                            )
                            Text(
                                text = schedule.displayRoom,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = DeepBlue
                            )
                        }

                        // Status Tag
                        when (status) {
                            ClassStatus.IN_PROGRESS -> {
                                Text(
                                    text = "● Sedang Berlangsung",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = StatusSuccessText
                                )
                            }
                            ClassStatus.COMPLETED -> {
                                Text(
                                    text = "Selesai",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = StatusCompletedText
                                )
                            }
                            else -> {
                                Text(
                                    text = "Akan Datang",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = PrimaryBlue
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
