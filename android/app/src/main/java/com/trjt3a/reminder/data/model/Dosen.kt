package com.trjt3a.reminder.data.model

data class Dosen(
    val no: Int,
    val initial: String,
    val name: String,
    val nip: String,
    val courses: List<String>
)
