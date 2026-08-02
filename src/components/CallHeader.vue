<script setup>
import { useCallTimer } from "../composables/useCallTimer";

const { elapsed } = useCallTimer();
</script>

<template>
  <header class="call-header">
    <div class="agent-id">
      <span class="agent-avatar">🍊</span>
      <div>
        <p class="agent-name">제주어 상담 AI</p>
        <p class="call-status"><span class="rec-dot"></span><span>통화중 · {{ elapsed }}</span></p>
      </div>
    </div>
    <button class="end-call" type="button">종료</button>
  </header>
</template>

<style scoped>
.call-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
}
.agent-id { display: flex; align-items: center; gap: 12px; }
.agent-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--accent2-soft);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem;
}
.agent-name { margin: 0; font-weight: 700; font-size: 0.95rem; }
.call-status {
  margin: 2px 0 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex; align-items: center; gap: 6px;
  font-variant-numeric: tabular-nums;
}
.rec-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--danger);
  display: inline-block;
  animation: pulse 1.6s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .rec-dot { animation: none; }
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

.end-call {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--danger);
  background: transparent;
  border: 1px solid #d6454540;
  border-radius: 6px;
  padding: 7px 12px;
  cursor: pointer;
}
.end-call:hover { background: var(--danger-soft); }
</style>
