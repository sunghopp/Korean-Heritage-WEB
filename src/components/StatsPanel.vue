<script setup>
import { computed } from "vue";

const props = defineProps({
  stats: { type: Object, required: true },
  log: { type: Array, required: true },
});

const avgTime = computed(() => (props.stats.turns ? (props.stats.totalTime / props.stats.turns).toFixed(2) : "–"));
</script>

<template>
  <aside class="stats-panel">
    <div class="stats-header">
      <h3>실시간 데이터베이스</h3>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <p class="stat-value">{{ stats.turns }}</p>
        <p class="stat-label">처리된 문장</p>
      </div>
      <div class="stat-card">
        <p class="stat-value">{{ stats.jejuWords }}</p>
        <p class="stat-label">인식된 제주어 어절</p>
      </div>
      <div class="stat-card">
        <p class="stat-value">{{ stats.stdWords }}</p>
        <p class="stat-label">번역된 표준어 어절</p>
      </div>
      <div class="stat-card">
        <p class="stat-value">{{ avgTime }}</p>
        <p class="stat-label">평균 처리 시간(초)</p>
      </div>
    </div>

    <div class="stats-log">
      <p class="stats-log-title">최근 처리 로그</p>
      <ul>
        <li v-if="log.length === 0" class="stats-log-empty">아직 처리된 발화가 없습니다</li>
        <li v-for="item in log" :key="item.turn" class="stats-log-item">
          <span class="log-time">#{{ item.turn }} · {{ item.time }}</span>
          <span class="log-text">{{ item.text }}</span>
        </li>
      </ul>
    </div>
  </aside>
</template>

<style scoped>
.stats-panel {
  padding: 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}
.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.stats-header h3 { margin: 0; font-size: 0.95rem; }

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.stat-card {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 10px;
}
.stat-value {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--accent-strong);
  font-variant-numeric: tabular-nums;
}
.stat-label {
  margin: 4px 0 0;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.stats-log { border-top: 1px solid var(--border); padding-top: 12px; }
.stats-log-title {
  margin: 0 0 8px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.stats-log ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.stats-log-empty { font-size: 0.78rem; color: var(--text-muted); }
.stats-log-item {
  font-size: 0.78rem;
  border-left: 2px solid var(--accent);
  padding-left: 8px;
}
.stats-log-item .log-time {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--text-muted);
  display: block;
}
.stats-log-item .log-text {
  color: var(--text);
  display: block;
  margin-top: 2px;
}
</style>
