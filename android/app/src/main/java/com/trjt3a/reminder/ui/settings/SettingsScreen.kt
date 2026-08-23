package com.trjt3a.reminder.ui.settings

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material.icons.outlined.Storage
import androidx.compose.material.icons.outlined.Sync
import androidx.compose.material.icons.outlined.Vibration
import androidx.compose.material.icons.outlined.VolumeUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.trjt3a.reminder.ui.theme.BorderCard
import com.trjt3a.reminder.ui.theme.BorderSubtle
import com.trjt3a.reminder.ui.theme.DeepBlue
import com.trjt3a.reminder.ui.theme.LightBackground
import com.trjt3a.reminder.ui.theme.PrimaryBlue
import com.trjt3a.reminder.ui.theme.SoftBlue
import com.trjt3a.reminder.ui.theme.StatusCompletedBg
import com.trjt3a.reminder.ui.theme.StatusCompletedText
import com.trjt3a.reminder.ui.theme.StatusSuccessBg
import com.trjt3a.reminder.ui.theme.StatusSuccessText
import com.trjt3a.reminder.ui.theme.SurfaceWhite
import com.trjt3a.reminder.ui.theme.TextMuted
import com.trjt3a.reminder.ui.theme.TextPrimary
import com.trjt3a.reminder.ui.theme.TextSecondary
import com.trjt3a.reminder.ui.theme.VeryLightBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel = viewModel()
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
                                text = "Pengaturan",
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
                                    .background(StatusCompletedBg)
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = uiState.appVersion,
                                    fontSize = 11.sp,
                                    color = StatusCompletedText,
                                    fontWeight = FontWeight.SemiBold
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
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Academic Profile Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderCard, RoundedCornerShape(18.dp)),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(VeryLightBlue)
                            .border(1.dp, SoftBlue, RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "3A",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryBlue
                        )
                    }

                    Column(
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Text(
                            text = "TRJT 3A — Semester 5",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = DeepBlue
                            )
                        )
                        Text(
                            text = "Teknologi Rekayasa Jaringan Telekomunikasi",
                            fontSize = 12.sp,
                            color = TextSecondary,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "Jurusan Teknik Elektro · Politeknik Negeri Lhokseumawe",
                            fontSize = 11.sp,
                            color = TextMuted
                        )
                    }
                }
            }

            // Section 1: PENGINGAT
            SettingsSection(title = "PENGINGAT") {
                SettingSwitchRow(
                    icon = Icons.Outlined.NotificationsActive,
                    title = "Pengingat H-10 Menit",
                    subtitle = "Notifikasi otomatis 10 menit sebelum kuliah",
                    checked = uiState.h10ReminderEnabled,
                    onCheckedChange = { viewModel.toggleH10Reminder(it) }
                )

                HorizontalDivider(color = BorderSubtle, modifier = Modifier.padding(start = 60.dp))

                SettingSwitchRow(
                    icon = Icons.Outlined.VolumeUp,
                    title = "Suara",
                    subtitle = "Efek audio pengingat jadwal",
                    checked = uiState.soundEnabled,
                    onCheckedChange = { viewModel.toggleSound(it) }
                )

                HorizontalDivider(color = BorderSubtle, modifier = Modifier.padding(start = 60.dp))

                SettingSwitchRow(
                    icon = Icons.Outlined.Vibration,
                    title = "Getar",
                    subtitle = "Getar saat alarm reminder berbunyi",
                    checked = uiState.vibrationEnabled,
                    onCheckedChange = { viewModel.toggleVibration(it) }
                )
            }

            // Section 2: TAMPILAN
            SettingsSection(title = "TAMPILAN") {
                SettingSwitchRow(
                    icon = Icons.Outlined.DarkMode,
                    title = "Tema Gelap",
                    subtitle = "Gunakan tema gelap saat malam",
                    checked = uiState.isDarkMode,
                    onCheckedChange = { viewModel.toggleDarkMode(it) }
                )
            }

            // Section 3: APLIKASI
            SettingsSection(title = "APLIKASI") {
                SettingInfoRow(
                    icon = Icons.Outlined.Sync,
                    title = "Sinkronisasi Jadwal",
                    subtitle = "Pembaruan otomatis saat online",
                    badgeText = "Aktif",
                    badgeBg = StatusSuccessBg,
                    badgeTextCol = StatusSuccessText
                )

                HorizontalDivider(color = BorderSubtle, modifier = Modifier.padding(start = 60.dp))

                SettingInfoRow(
                    icon = Icons.Outlined.Storage,
                    title = "Cache Offline",
                    subtitle = "Jadwal tetap dapat diakses tanpa internet",
                    badgeText = "Tersedia",
                    badgeBg = VeryLightBlue,
                    badgeTextCol = PrimaryBlue
                )

                HorizontalDivider(color = BorderSubtle, modifier = Modifier.padding(start = 60.dp))

                SettingInfoRow(
                    icon = Icons.Outlined.Info,
                    title = "Versi Aplikasi",
                    subtitle = "TRJT 3A Reminder Native Android",
                    badgeText = uiState.appVersion,
                    badgeBg = StatusCompletedBg,
                    badgeTextCol = StatusCompletedText
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable () -> Unit
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = title,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = TextSecondary,
            letterSpacing = 0.5.sp,
            modifier = Modifier.padding(start = 4.dp)
        )

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderCard, RoundedCornerShape(18.dp)),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                content()
            }
        }
    }
}

@Composable
private fun SettingSwitchRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(VeryLightBlue),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = PrimaryBlue,
                modifier = Modifier.size(20.dp)
            )
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
            Text(
                text = subtitle,
                fontSize = 12.sp,
                color = TextSecondary
            )
        }

        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = SurfaceWhite,
                checkedTrackColor = PrimaryBlue,
                uncheckedThumbColor = SurfaceWhite,
                uncheckedTrackColor = Color(0xFFCBD5E1)
            )
        )
    }
}

@Composable
private fun SettingInfoRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    badgeText: String,
    badgeBg: Color,
    badgeTextCol: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(VeryLightBlue),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = PrimaryBlue,
                modifier = Modifier.size(20.dp)
            )
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
            Text(
                text = subtitle,
                fontSize = 12.sp,
                color = TextSecondary
            )
        }

        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(8.dp))
                .background(badgeBg)
                .padding(horizontal = 10.dp, vertical = 4.dp)
        ) {
            Text(
                text = badgeText,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = badgeTextCol
            )
        }
    }
}
