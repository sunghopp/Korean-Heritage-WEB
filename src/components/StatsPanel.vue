<script setup>
defineProps({
  stats: { type: Object, required: true },
  log: { type: Array, required: true },
});
</script>

<template>
  <aside class="stats-panel">
    <div class="stats-header">
      <h3>실시간 상담 현황</h3>
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
  padding: 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  background: linear-gradient(180deg, #102326, #0a181c);
}
.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.stats-header h3 { margin: 0; font: 700 1rem var(--font-title); }

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.stat-card {
  background: rgba(32, 55, 57, .72);
  border: 1px solid var(--border);
  border-radius: 4px;
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
  border-left: 2px solid var(--accent2);
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

/* 모바일은 마이크와 채팅이 한 화면에 들어오도록 숫자만 한 줄로 보여준다. */
@media (max-width: 820px) {
  .stats-panel {
    order: -1;
    padding: 8px 14px;
    overflow: visible;
    border-bottom: 1px solid var(--border);
  }
  .stats-header, .stats-log { display: none; }
  .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .stat-card { padding: 6px 8px; }
  .stat-value { font-size: 1.05rem; }
  .stat-label { margin-top: 2px; font-size: 0.62rem; }
}
</style>
