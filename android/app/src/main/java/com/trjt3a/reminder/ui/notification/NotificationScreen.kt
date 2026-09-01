package com.trjt3a.reminder.ui.notification

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.trjt3a.reminder.ui.components.NotificationCardItem
import com.trjt3a.reminder.ui.theme.BorderCard
import com.trjt3a.reminder.ui.theme.PrimaryBlue
import com.trjt3a.reminder.ui.theme.SoftBlue
import com.trjt3a.reminder.ui.theme.SurfaceWhite
import com.trjt3a.reminder.ui.theme.TextPrimary
import com.trjt3a.reminder.ui.theme.TextSecondary
import com.trjt3a.reminder.ui.theme.VeryLightBlue

@Composable
fun NotificationScreen(
    viewModel: NotificationViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Title & Mark All as Read Row
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Notifikasi",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        color = MaterialTheme.colorScheme.onSurface,
                        letterSpacing = (-0.3).sp
                    )
                )

                TextButton(
                    onClick = { viewModel.markAllAsRead() }
                ) {
                    Text(
                        text = "Tandai dibaca",
                        color = PrimaryBlue,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                    )
                }
            }

            Text(
                text = "Kotak masuk pengingat kelas",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // Filter Pills Bar (Semua / Belum dibaca)
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val unreadCount = uiState.allNotifications.count { !it.isRead }
            val isAllSelected = uiState.filterType == "all"

            // Pill: Semua
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(99.dp))
                    .background(if (isAllSelected) PrimaryBlue else MaterialTheme.colorScheme.surface)
                    .border(
                        1.dp,
                        if (isAllSelected) PrimaryBlue else MaterialTheme.colorScheme.outlineVariant,
                        RoundedCornerShape(99.dp)
                    )
                    .clickable { viewModel.setFilter("all") }
                    .padding(horizontal = 16.dp, vertical = 7.dp)
            ) {
                Text(
                    text = "Semua (${uiState.allNotifications.size})",
                    fontSize = 12.sp,
                    fontWeight = if (isAllSelected) FontWeight.Bold else FontWeight.Medium,
                    color = if (isAllSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Pill: Belum dibaca
            val isUnreadSelected = uiState.filterType == "unread"
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(99.dp))
                    .background(if (isUnreadSelected) PrimaryBlue else MaterialTheme.colorScheme.surface)
                    .border(
                        1.dp,
                        if (isUnreadSelected) PrimaryBlue else MaterialTheme.colorScheme.outlineVariant,
                        RoundedCornerShape(99.dp)
                    )
                    .clickable { viewModel.setFilter("unread") }
                    .padding(horizontal = 16.dp, vertical = 7.dp)
            ) {
                Text(
                    text = "Belum dibaca ($unreadCount)",
                    fontSize = 12.sp,
                    fontWeight = if (isUnreadSelected) FontWeight.Bold else FontWeight.Medium,
                    color = if (isUnreadSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Notifications List
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (uiState.filteredNotifications.isNotEmpty()) {
                items(uiState.filteredNotifications, key = { it.id }) { notif ->
                    NotificationCardItem(
                        notification = notif,
                        onClick = { viewModel.markAsRead(notif.id) }
                    )
                }
            } else {
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 40.dp),
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
                                imageVector = Icons.Outlined.NotificationsNone,
                                contentDescription = null,
                                tint = PrimaryBlue,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                        Text(
                            text = "Tidak Ada Notifikasi",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = if (uiState.filterType == "unread")
                                "Semua notifikasi sudah dibaca."
                            else
                                "Belum ada pengingat atau pengumuman masuk.",
                            fontSize = 13.sp,
                            color = TextSecondary,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}
