<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import {
  fetchDatasetStats,
  fetchDatasetSamples,
  datasetAudioUrl,
  updateDatasetSample,
} from "../services/dashboardApi";
import { playAudio } from "../services/audio";

const stats = ref({ total: 0, auto_approved: 0, needs_monitoring: 0, needs_review: 0, reviewed: 0 });
const samples = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const activeFilter = ref(null);

const TIER_LABELS = {
  auto_approved: "정확도 높음",
  needs_monitoring: "관찰 필요",
  needs_review: "리뷰 필요",
  reviewed: "검수 완료",
};

const TIER_FILTERS = ["auto_approved", "needs_monitoring", "needs_review"];

const filteredSamples = computed(() => {
  if (!activeFilter.value) return samples.value;
  return samples.value.filter((sample) => sample.review_status === activeFilter.value);
});

function tierLabel(reviewStatus) {
  return TIER_LABELS[reviewStatus] || reviewStatus;
}

function toggleFilter(tier) {
  activeFilter.value = activeFilter.value === tier ? null : tier;
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

function startEdit(sample) {
  editingId.value = sample.id;
  draft.dialectForm = sample.dialect_form || sample.form || "";
  draft.standardForm = sample.standard_form || "";
  saveError.value = "";
}

function cancelEdit() {
  editingId.value = null;
  saveError.value = "";
}

async function saveEdit(sample) {
  saving.value = true;
  saveError.value = "";
  try {
    const updated = await updateDatasetSample(sample.review_status, sample.id, {
      dialect_form: draft.dialectForm,
      standard_form: draft.standardForm,
    });
    const idx = samples.value.findIndex((s) => s.id === sample.id);
    if (idx !== -1) samples.value.splice(idx, 1, updated);
    editingId.value = null;
  } catch (error) {
    saveError.value = error.message || "저장에 실패했습니다.";
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
      <div class="stat-card">
        <p class="stat-value">{{ stats.needs_review }}</p>
        <p class="stat-label">리뷰가 필요한 학습 데이터 수</p>
      </div>
      <div class="stat-card">
        <p class="stat-value">{{ stats.needs_monitoring }}</p>
        <p class="stat-label">관찰이 필요한 학습 데이터 수</p>
      </div>
      <div class="stat-card">
        <p class="stat-value">{{ stats.auto_approved }}</p>
        <p class="stat-label">정확도 높은 학습 데이터 수</p>
      </div>
    </div>

    <p v-if="errorMessage" class="dashboard-error">{{ errorMessage }}</p>
    <p v-else-if="loading" class="dashboard-loading">불러오는 중...</p>

    <template v-else>
      <div class="filter-bar">
        <button
          v-for="tier in TIER_FILTERS"
          :key="tier"
          type="button"
          class="filter-button"
          :class="{ active: activeFilter === tier, [`tier-${tier}`]: activeFilter === tier }"
          @click="toggleFilter(tier)"
        >
          {{ tierLabel(tier) }} ({{ stats[tier] ?? 0 }})
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
                {{ activeFilter ? "해당 구분의 학습 데이터가 없습니다" : "아직 수집된 학습 데이터가 없습니다" }}
              </td>
            </tr>
            <tr v-for="sample in filteredSamples" :key="sample.id">
              <td>
                <span class="tier-badge" :class="`tier-${sample.review_status}`">
                  {{ tierLabel(sample.review_status) }}
                </span>
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
                  <p v-if="saveError" class="save-error">{{ saveError }}</p>
                </td>
              </template>
              <template v-else>
                <td>{{ sample.dialect_form || sample.form }}</td>
                <td>{{ sample.standard_form }}</td>
                <td>
                  <button class="play-button" type="button" @click="handlePlay(sample)">▶ 재생</button>
                </td>
                <td>
                  <button class="edit-button" type="button" @click="startEdit(sample)">편집</button>
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
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 720px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
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
.filter-button.active.tier-auto_approved { background: var(--accent-soft); color: var(--accent-strong); }
.filter-button.active.tier-needs_monitoring { background: var(--accent2-soft); color: var(--accent2); }
.filter-button.active.tier-needs_review { background: var(--danger-soft); color: var(--danger); }

.tier-badge {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  padding: 3px 8px;
  border-radius: 5px;
  border: 1px solid var(--border);
  white-space: nowrap;
}
.tier-auto_approved { background: var(--accent-soft); color: var(--accent-strong); border-color: transparent; }
.tier-needs_monitoring { background: var(--accent2-soft); color: var(--accent2); border-color: transparent; }
.tier-needs_review { background: var(--danger-soft); color: var(--danger); border-color: transparent; }
.tier-reviewed { background: var(--surface-alt); color: var(--accent-strong); border-color: var(--accent-strong); }

.play-button,
.edit-button,
.save-button,
.cancel-button {
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
