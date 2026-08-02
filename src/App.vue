<script setup>
import { reactive } from "vue";
import CallHeader from "./components/CallHeader.vue";
import ChatLog from "./components/ChatLog.vue";
import MicButton from "./components/MicButton.vue";
import StatsPanel from "./components/StatsPanel.vue";

const messages = reactive([
  { type: "ai", text: "안녕하우꽈, 아주대학교병원 상담 도와드리쿠다. 무신 거 궁금하우꽈?" },
]);

const stats = reactive({ turns: 0, jejuWords: 0, stdWords: 0, totalTime: 0 });
const statsLog = reactive([]);

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function handleResult(data) {
  messages.push({ type: "user", jejuText: data.jeju_text, standardText: data.standard_text });

  stats.turns += 1;
  stats.jejuWords += countWords(data.jeju_text || "");
  stats.stdWords += countWords(data.standard_text || "");
  stats.totalTime += Number(data.processing_time) || 0;

  statsLog.unshift({
    turn: stats.turns,
    time: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
    text: data.jeju_text,
  });
  if (statsLog.length > 5) statsLog.length = 5;
}

function handleError(message) {
  messages.push({ type: "error", text: message });
}
</script>

<template>
  <div class="app">
    <CallHeader />

    <main class="layout">
      <section class="call-screen">
        <ChatLog :messages="messages" />
        <MicButton @result="handleResult" @error="handleError" />
      </section>

      <StatsPanel :stats="stats" :log="statsLog" />
    </main>
  </div>
</template>

<style scoped>
.layout {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 300px;
  min-height: 0;
}
@media (max-width: 820px) {
  .layout { grid-template-columns: 1fr; }
}

.call-screen {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--border);
}
@media (max-width: 820px) {
  .call-screen { border-right: none; border-bottom: 1px solid var(--border); }
}
</style>
