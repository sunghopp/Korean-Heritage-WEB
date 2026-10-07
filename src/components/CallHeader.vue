<script setup>
import { useCallTimer } from "../composables/useCallTimer";

const emit = defineEmits(["reset"]);
const { elapsed } = useCallTimer();
</script>

<template>
  <header class="call-header">
    <div class="agent-id">
      <span class="agent-avatar" aria-hidden="true">AI</span>
      <div>
        <p class="agent-name">제주어 AI ARS</p>
        <p class="call-status"><span class="rec-dot"></span><span>상담 연결됨 · {{ elapsed }}</span></p>
      </div>
    </div>
    <button class="reset-chat" type="button" @click="emit('reset')">대화 초기화</button>
  </header>
</template>

<style scoped>
.call-header {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 22px;
  border-bottom: 1px solid var(--border);
  background:
    linear-gradient(165deg, rgba(43, 52, 55, .97), rgba(22, 35, 38, .98)),
    var(--basalt-texture);
}
.call-header::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: .32;
  background:
    radial-gradient(ellipse at 18% 20%, rgba(236, 230, 216, .14), transparent 26%),
    radial-gradient(ellipse at 84% 100%, rgba(79, 179, 168, .18), transparent 38%),
    var(--basalt-texture);
  mix-blend-mode: screen;
}
.agent-id { display: flex; align-items: center; gap: 12px; }
.agent-avatar {
  width: 38px; height: 38px;
  border-radius: 8px;
  background: linear-gradient(145deg, #2a4649, #14262a);
  border: 1px solid rgba(79, 179, 168, 0.42);
  display: flex; align-items: center; justify-content: center;
  color: var(--accent-strong);
  font: 700 0.7rem var(--font-mono);
  letter-spacing: .06em;
}
.agent-name { margin: 0; font: 700 0.95rem var(--font-title); }
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

.reset-chat {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--danger);
  background: transparent;
  border: 1px solid rgba(229, 139, 126, 0.48);
  border-radius: 4px;
  padding: 7px 12px;
  cursor: pointer;
}
.reset-chat:hover { background: var(--danger-soft); }

@media (max-width: 820px) {
  .call-header { padding: 10px 14px; }
  .agent-avatar { width: 34px; height: 34px; }
  .reset-chat { min-height: 40px; }
}
</style>
