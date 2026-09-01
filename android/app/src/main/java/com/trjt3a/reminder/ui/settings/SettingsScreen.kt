package com.trjt3a.reminder.ui.settings

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material.icons.outlined.Palette
import androidx.compose.material.icons.outlined.People
import androidx.compose.material.icons.outlined.School
import androidx.compose.material.icons.outlined.Storage
import androidx.compose.material.icons.outlined.Sync
import androidx.compose.material.icons.outlined.Vibration
import androidx.compose.material.icons.outlined.VolumeUp
import androidx.compose.material.icons.outlined.WbSunny
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.trjt3a.reminder.ui.components.MahasiswaListDialog
import com.trjt3a.reminder.ui.components.ThemeSelectionDialog
import com.trjt3a.reminder.ui.theme.BorderCard
import com.trjt3a.reminder.ui.theme.BorderColor
import com.trjt3a.reminder.ui.theme.BorderSubtle
import com.trjt3a.reminder.ui.theme.DeepBlue
import com.trjt3a.reminder.ui.theme.LightBackground
import com.trjt3a.reminder.ui.theme.PrimaryBlue
import com.trjt3a.reminder.ui.theme.SoftBlue
import com.trjt3a.reminder.ui.theme.StatusCompletedBg
import com.trjt3a.reminder.ui.theme.StatusCompletedText
import com.trjt3a.reminder.ui.theme.StatusSuccessBg
import com.trjt3a.reminder.ui.theme.StatusSuccessBorder
import com.trjt3a.reminder.ui.theme.StatusSuccessText
import com.trjt3a.reminder.ui.theme.SurfaceWhite
import com.trjt3a.reminder.ui.theme.TextMuted
import com.trjt3a.reminder.ui.theme.TextPrimary
import com.trjt3a.reminder.ui.theme.TextSecondary
import com.trjt3a.reminder.ui.theme.ThemeMode
import com.trjt3a.reminder.ui.theme.VeryLightBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    var showThemeDialog by remember { mutableStateOf(false) }
    var showMahasiswaDialog by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.testNotificationSent) {
        if (uiState.testNotificationSent) {
            Toast.makeText(context, "Notifikasi tes berhasil dikirim ke tab Notifikasi!", Toast.LENGTH_SHORT).show()
            viewModel.resetTestNotificationStatus()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Title & Version Badge Row
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
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
                        text = uiState.appVersion,
                        fontSize = 12.sp,
                        color = PrimaryBlue,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Text(
                text = "Atur pengalaman pengingat kelas",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // PANEL 1: Notifikasi & Alarm
            SettingsSection(title = "NOTIFIKASI & ALARM") {
                SettingInfoRow(
                    icon = Icons.Outlined.Notifications,
                    title = "Izin Notifikasi",
                    subtitle = "Status penerimaan notifikasi",
                    badgeText = "Diizinkan",
                    badgeBg = StatusSuccessBg,
                    badgeBorder = StatusSuccessBorder,
                    badgeTextCol = StatusSuccessText
                )

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant, modifier = Modifier.padding(start = 68.dp))

                SettingSwitchRow(
                    icon = Icons.Outlined.NotificationsActive,
                    title = "Pengingat H-10 Menit",
                    subtitle = "Notifikasi otomatis 10 menit sebelum kelas",
                    checked = uiState.h10ReminderEnabled,
                    onCheckedChange = { viewModel.toggleH10Reminder(it) }
                )

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant, modifier = Modifier.padding(start = 68.dp))

                SettingSwitchRow(
                    icon = Icons.Outlined.VolumeUp,
                    title = "Suara Alarm",
                    subtitle = "Efek audio pengingat jadwal",
                    checked = uiState.soundEnabled,
                    onCheckedChange = { viewModel.toggleSound(it) }
                )

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant, modifier = Modifier.padding(start = 68.dp))

                SettingSwitchRow(
                    icon = Icons.Outlined.Vibration,
                    title = "Getar",
                    subtitle = "Getar saat alarm reminder berbunyi",
                    checked = uiState.vibrationEnabled,
                    onCheckedChange = { viewModel.toggleVibration(it) }
                )

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant, modifier = Modifier.padding(start = 68.dp))

                // Button Tes Notifikasi
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.Center
                ) {
                    Button(
                        onClick = { viewModel.sendTestNotification() },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = VeryLightBlue)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Notifications,
                            contentDescription = null,
                            tint = PrimaryBlue,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.size(8.dp))
                        Text(
                            text = "Tes notifikasi",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryBlue
                        )
                    }
                }
            }

            // PANEL 2: Tampilan
            SettingsSection(title = "TAMPILAN") {
                val themeLabel = when (uiState.themeMode) {
                    ThemeMode.LIGHT -> "Terang"
                    ThemeMode.DARK -> "Gelap"
                    ThemeMode.SYSTEM -> "Otomatis"
                }

                SettingActionRow(
                    icon = when (uiState.themeMode) {
                        ThemeMode.DARK -> Icons.Outlined.DarkMode
                        ThemeMode.LIGHT -> Icons.Outlined.WbSunny
                        ThemeMode.SYSTEM -> Icons.Outlined.Palette
                    },
                    title = "Tema",
                    subtitle = "Kenyamanan visual antarmuka",
                    valueText = themeLabel,
                    onClick = { showThemeDialog = true }
                )
            }

            // PANEL 3: Aplikasi & Akademik
            SettingsSection(title = "APLIKASI") {
                SettingActionRow(
                    icon = Icons.Outlined.People,
                    title = "Daftar Mahasiswa TRJT 3A",
                    subtitle = "17 Mahasiswa Aktif & Kelompok Piket",
                    valueText = "Lihat",
                    onClick = { showMahasiswaDialog = true }
                )

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant, modifier = Modifier.padding(start = 68.dp))

                SettingInfoRow(
                    icon = Icons.Outlined.School,
                    title = "Semester",
                    subtitle = "Semester 5 · TA 2026/2027",
                    badgeText = "Aktif",
                    badgeBg = VeryLightBlue,
                    badgeBorder = SoftBlue,
                    badgeTextCol = PrimaryBlue
                )

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant, modifier = Modifier.padding(start = 68.dp))

                SettingInfoRow(
                    icon = Icons.Outlined.Info,
                    title = "Versi Aplikasi",
                    subtitle = "TRJT 3A Class Reminder Native",
                    badgeText = uiState.appVersion,
                    badgeBg = MaterialTheme.colorScheme.surfaceVariant,
                    badgeBorder = MaterialTheme.colorScheme.outlineVariant,
                    badgeTextCol = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
        }

        // Theme Dialog
        if (showThemeDialog) {
            ThemeSelectionDialog(
                currentMode = uiState.themeMode,
                onModeSelected = { viewModel.setThemeMode(it) },
                onDismissRequest = { showThemeDialog = false }
            )
        }

        // Mahasiswa List Dialog
        if (showMahasiswaDialog) {
            MahasiswaListDialog(
                onDismissRequest = { showMahasiswaDialog = false }
            )
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
            fontSize = 11.5.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            letterSpacing = 0.5.sp,
            modifier = Modifier.padding(start = 4.dp)
        )

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(18.dp)),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
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
                .background(VeryLightBlue)
                .border(1.dp, SoftBlue, RoundedCornerShape(12.dp)),
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
                fontSize = 14.5.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
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
private fun SettingActionRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    valueText: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(VeryLightBlue)
                .border(1.dp, SoftBlue, RoundedCornerShape(12.dp)),
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
                fontSize = 14.5.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = valueText,
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontWeight = FontWeight.Medium
            )
            Icon(
                imageVector = Icons.Outlined.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
private fun SettingInfoRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    badgeText: String,
    badgeBg: Color,
    badgeBorder: Color,
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
                .background(VeryLightBlue)
                .border(1.dp, SoftBlue, RoundedCornerShape(12.dp)),
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
                fontSize = 14.5.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Surface(
            shape = RoundedCornerShape(8.dp),
            color = badgeBg,
            border = androidx.compose.foundation.BorderStroke(1.dp, badgeBorder)
        ) {
            Text(
                text = badgeText,
                fontSize = 11.5.sp,
                fontWeight = FontWeight.Bold,
                color = badgeTextCol,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
            )
        }
    }
}
