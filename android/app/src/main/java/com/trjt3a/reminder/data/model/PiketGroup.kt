package com.trjt3a.reminder.data.model

data class PiketGroup(
    val groupNumber: Int,
    val groupRoman: String,
    val groupName: String,
    val members: List<String>
)
