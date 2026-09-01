package com.trjt3a.reminder.ui.dosen

import androidx.lifecycle.ViewModel
import com.trjt3a.reminder.data.model.Dosen
import com.trjt3a.reminder.data.repository.ScheduleRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class DosenUiState(
    val allDosen: List<Dosen> = emptyList(),
    val filteredDosen: List<Dosen> = emptyList(),
    val searchQuery: String = ""
)

class DosenViewModel(
    private val scheduleRepository: ScheduleRepository = ScheduleRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(DosenUiState())
    val uiState: StateFlow<DosenUiState> = _uiState.asStateFlow()

    init {
        val list = scheduleRepository.getAllDosen()
        _uiState.value = DosenUiState(
            allDosen = list,
            filteredDosen = list
        )
    }

    fun search(query: String) {
        val q = query.trim()
        val all = _uiState.value.allDosen
        val filtered = if (q.isBlank()) {
            all
        } else {
            all.filter { dosen ->
                dosen.name.contains(q, ignoreCase = true) ||
                        dosen.nip.contains(q, ignoreCase = true) ||
                        dosen.initial.contains(q, ignoreCase = true) ||
                        dosen.courses.any { it.contains(q, ignoreCase = true) }
            }
        }
        _uiState.update { it.copy(searchQuery = query, filteredDosen = filtered) }
    }
}
