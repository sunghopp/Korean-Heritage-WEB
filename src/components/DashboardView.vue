<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import {
  fetchDatasetStats,
  fetchDatasetSamples,
  datasetAudioUrl,
  updateDatasetSample,
} from "../services/dashboardApi";
import { playAudio } from "../services/audio";

const stats = ref({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
});
const samples = ref([]);
const loading = ref(true);
const errorMessage = ref("");

const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_FILTERS = ["pending", "approved", "rejected"];

const REVIEWER_LABELS = {
  system: "System",
  human: "Human",
};

const activeStatusFilter = ref(null);

const filteredSamples = computed(() => {
  return samples.value.filter((sample) => {
    if (activeStatusFilter.value && sample.status !== activeStatusFilter.value) return false;
    return true;
  });
});

function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function reviewerLabel(reviewedBy) {
  return REVIEWER_LABELS[reviewedBy] || reviewedBy;
}

function toggleStatusFilter(status) {
  activeStatusFilter.value = activeStatusFilter.value === status ? null : status;
}

function formatConfidence(confidence) {
  if (typeof confidence !== "number") return "–";
  return `${(confidence * 100).toFixed(1)}%`;
}

function handlePlay(sample) {
  const url = datasetAudioUrl(sample.id);
  playAudio(url);
}

const editingId = ref(null);
const draft = reactive({ dialectForm: "", standardForm: "" });
const saving = ref(false);
const saveError = ref("");
const errorSampleId = ref(null);

function startEdit(sample) {
  editingId.value = sample.id;
  draft.dialectForm = sample.dialect_form || sample.form || "";
  draft.standardForm = sample.standard_form || "";
  saveError.value = "";
  errorSampleId.value = null;
}

function cancelEdit() {
  editingId.value = null;
  saveError.value = "";
  errorSampleId.value = null;
}

async function saveEdit(sample) {
  saving.value = true;
  saveError.value = "";
  try {
    const updated = await updateDatasetSample(sample.id, {
      dialect_form: draft.dialectForm,
      standard_form: draft.standardForm,
      status: "approved",
    });
    const idx = samples.value.findIndex((s) => s.id === sample.id);
    if (idx !== -1) samples.value.splice(idx, 1, updated);
    editingId.value = null;
    errorSampleId.value = null;
  } catch (error) {
    saveError.value = error.message || "저장에 실패했습니다.";
    errorSampleId.value = sample.id;
  } finally {
    saving.value = false;
  }
}

async function reject(sample) {
  if (!window.confirm("이 데이터를 Rejected로 표시할까요? 학습에 사용되지 않습니다.")) {
    return;
  }
  saving.value = true;
  saveError.value = "";
  errorSampleId.value = null;
  try {
    const updated = await updateDatasetSample(sample.id, {
      status: "rejected",
    });
    const idx = samples.value.findIndex((s) => s.id === sample.id);
    if (idx !== -1) samples.value.splice(idx, 1, updated);
  } catch (error) {
    saveError.value = error.message || "처리에 실패했습니다.";
    errorSampleId.value = sample.id;
  } finally {
    saving.value = false;
  }
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [statsData, samplesData] = await Promise.all([
      fetchDatasetStats(),
      fetchDatasetSamples(),
    ]);
    stats.value = statsData;
    samples.value = samplesData;
  } catch (error) {
    errorMessage.value = error.message || "데이터를 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <p class="stat-value">{{ stats.total }}</p>
        <p class="stat-label">총 학습 데이터 수</p>
      </div>
      <div v-for="status in STATUS_FILTERS" :key="status" class="stat-card">
        <p class="stat-value">{{ stats[status] ?? 0 }}</p>
        <p class="stat-label">{{ statusLabel(status) }}</p>
      </div>
    </div>

    <p v-if="errorMessage" class="dashboard-error">{{ errorMessage }}</p>
    <p v-else-if="loading" class="dashboard-loading">불러오는 중...</p>

    <template v-else>
      <div class="filter-bar">
        <button
          v-for="status in STATUS_FILTERS"
          :key="status"
          type="button"
          class="filter-button"
          :class="{ active: activeStatusFilter === status, [`status-${status}`]: activeStatusFilter === status }"
          @click="toggleStatusFilter(status)"
        >
          {{ statusLabel(status) }} ({{ stats[status] ?? 0 }})
        </button>
      </div>

      <div class="table-wrap">
        <table class="dataset-table">
          <thead>
            <tr>
              <th>학습 데이터 구분</th>
              <th>Confidence</th>
              <th>발화 제주어</th>
              <th>번역 표준어</th>
              <th>음성 재생</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredSamples.length === 0">
              <td colspan="6" class="empty-row">
                {{ activeStatusFilter ? "해당 조건의 학습 데이터가 없습니다" : "아직 수집된 학습 데이터가 없습니다" }}
              </td>
            </tr>
            <tr v-for="sample in filteredSamples" :key="sample.id">
              <td>
                <div class="badge-row">
                  <span class="status-badge" :class="`status-${sample.status}`">
                    {{ statusLabel(sample.status) }}
                  </span>
                  <span v-if="sample.reviewed_by" class="reviewer-badge" :class="`reviewer-${sample.reviewed_by}`">
                    {{ reviewerLabel(sample.reviewed_by) }}
                  </span>
                </div>
              </td>
              <td class="mono">{{ formatConfidence(sample.confidence) }}</td>
              <template v-if="editingId === sample.id">
                <td><input class="edit-input" v-model="draft.dialectForm" /></td>
                <td><input class="edit-input" v-model="draft.standardForm" /></td>
                <td>
                  <button class="play-button" type="button" @click="handlePlay(sample)">▶ 재생</button>
                </td>
                <td>
                  <div class="edit-actions">
                    <button
                      class="save-button"
                      type="button"
                      :disabled="saving"
                      @click="saveEdit(sample)"
                    >
                      저장
                    </button>
                    <button
                      class="cancel-button"
                      type="button"
                      :disabled="saving"
                      @click="cancelEdit"
                    >
                      취소
                    </button>
                  </div>
                  <p v-if="saveError && errorSampleId === sample.id" class="save-error">{{ saveError }}</p>
                </td>
              </template>
              <template v-else>
                <td>{{ sample.dialect_form || sample.form }}</td>
                <td>{{ sample.standard_form }}</td>
                <td>
                  <button class="play-button" type="button" @click="handlePlay(sample)">▶ 재생</button>
                </td>
                <td>
                  <div v-if="sample.status === 'pending'" class="edit-actions">
                    <button class="edit-button" type="button" @click="startEdit(sample)">편집</button>
                    <button
                      class="reject-button"
                      type="button"
                      :disabled="saving"
                      @click="reject(sample)"
                    >
                      거부
                    </button>
                  </div>
                  <span v-else class="no-action">–</span>
                  <p v-if="saveError && errorSampleId === sample.id" class="save-error">{{ saveError }}</p>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<style scoped>
.dashboard {
  flex: 1;
  min-height: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.stat-card {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 12px;
}
.stat-value {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent-strong);
  font-variant-numeric: tabular-nums;
}
.stat-label {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.dashboard-error {
  color: var(--danger);
  font-size: 0.85rem;
}
.dashboard-loading {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.table-wrap {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: auto;
}

.dataset-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.dataset-table th,
.dataset-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.dataset-table th {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: var(--surface-alt);
}
.dataset-table tbody tr:last-child td { border-bottom: none; }
.dataset-table tbody tr:hover { background: var(--surface-alt); }

.dataset-table td:nth-child(3),
.dataset-table td:nth-child(4) {
  white-space: normal;
  min-width: 180px;
}
.dataset-table td:nth-child(6) {
  white-space: normal;
  min-width: 90px;
}

.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

.empty-row {
  text-align: center;
  color: var(--text-muted);
  padding: 24px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.filter-button {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
}
.filter-button:hover { background: var(--surface-alt); }
.filter-button.active {
  border-color: transparent;
  font-weight: 700;
}
.filter-button.active.status-pending { background: var(--surface-alt); color: var(--text); }
.filter-button.active.status-approved { background: var(--accent-soft); color: var(--accent-strong); }
.filter-button.active.status-rejected { background: var(--danger-soft); color: var(--danger); }

.badge-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-badge,
.reviewer-badge {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  padding: 3px 8px;
  border-radius: 5px;
  border: 1px solid var(--border);
  white-space: nowrap;
}

.status-pending { background: var(--surface-alt); color: var(--text-muted); }
.status-approved { background: var(--accent-soft); color: var(--accent-strong); border-color: transparent; }
.status-rejected { background: var(--danger-soft); color: var(--danger); border-color: transparent; }

.reviewer-badge {
  font-size: 0.62rem;
  padding: 2px 6px;
  color: var(--text-muted);
}
.reviewer-system { border-style: dashed; }
.reviewer-human { border-style: solid; }

.play-button,
.edit-button,
.save-button,
.cancel-button,
.reject-button {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 5px 10px;
  cursor: pointer;
}
.play-button,
.edit-button { color: var(--accent-strong); }
.play-button:hover,
.edit-button:hover,
.cancel-button:hover { background: var(--surface-alt); }

.reject-button { color: var(--danger); border-color: var(--danger); }
.reject-button:hover:not(:disabled) { background: var(--danger-soft); }
.reject-button:disabled { opacity: 0.5; cursor: not-allowed; }

.no-action { color: var(--text-muted); }

.edit-input {
  width: 100%;
  min-width: 160px;
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 8px;
}

.edit-actions {
  display: flex;
  gap: 6px;
}
.save-button {
  color: var(--accent-strong);
  border-color: var(--accent-strong);
}
.save-button:hover:not(:disabled) { background: var(--accent-soft); }
.save-button:disabled,
.cancel-button:disabled { opacity: 0.5; cursor: not-allowed; }
.cancel-button { color: var(--text-muted); }

.save-error {
  margin: 6px 0 0;
  font-size: 0.72rem;
  color: var(--danger);
  white-space: normal;
}
</style>
