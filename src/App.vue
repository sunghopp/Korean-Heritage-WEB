<script setup>
import { onBeforeUnmount, reactive, ref } from "vue";
import CallHeader from "./components/CallHeader.vue";
import ChatLog from "./components/ChatLog.vue";
import DashboardView from "./components/DashboardView.vue";
import MicButton from "./components/MicButton.vue";
import StatsPanel from "./components/StatsPanel.vue";
import {
  base64AudioToObjectUrl,
  playAudio,
  revokeAudioUrl,
  stopAudio,
} from "./services/audio";

const activeTab = ref("ars");

const messages = reactive([
  {
    type: "ai",
    label: "AI 인사",
    text: "안녕하우꽈, 제주120 만덕콜센터 AI 상담원이우다. 행정이나 생활 민원, 교통·관광, 복지 같은 궁금한 거 편하게 말씀해줍서.",
  },
]);

const stats = reactive({ turns: 0, jejuWords: 0, stdWords: 0, totalTime: 0 });
const statsLog = reactive([]);
const createdAudioUrls = [];

function countWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

async function handleResult(data) {
  // 1) 사용자의 제주어 STT 결과 + 표준어 번역 표시
  messages.push({
    type: "user",
    jejuText: data.jeju_text || "",
    standardText: data.standard_text || "",
  });

  // 2) API가 반환한 WAV(base64)를 브라우저에서 재생 가능한 URL로 변환
  let audioUrl = data.audio_url || null;
  if (!audioUrl && data.audio_base64) {
    try {
      audioUrl = base64AudioToObjectUrl(
        data.audio_base64,
        data.audio_mime_type || "audio/wav"
      );
      if (audioUrl) createdAudioUrls.push(audioUrl);
    } catch (error) {
      console.error("Failed to decode TTS audio:", error);
    }
  }

  // 3) Gemini가 만든 제주어 AI ARS 답변을 별도 AI 말풍선로 표시
  messages.push({
    type: "ai",
    label: "만덕콜센터 AI 답변",
    text: data.ars_reply_text || "답변을 생성했습니다.",
    audioUrl,
    replayable: Boolean(audioUrl),
  });

  // 4) 답변을 받는 즉시 TTS 음성 재생
  // 브라우저 자동재생 정책으로 막히는 경우에도 텍스트 클릭으로 다시 재생할 수 있다.
  if (audioUrl) {
    await playAudio(audioUrl);
  }

  stats.turns += 1;
  stats.jejuWords += countWords(data.jeju_text);
  stats.stdWords += countWords(data.standard_text);
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

onBeforeUnmount(() => {
  stopAudio();
  createdAudioUrls.forEach(revokeAudioUrl);
});
</script>

<template>
  <div class="app">
    <nav class="tab-bar">
      <button
        type="button"
        class="tab-button"
        :class="{ active: activeTab === 'ars' }"
        @click="activeTab = 'ars'"
      >
        🍊 AI ARS 상담
      </button>
      <button
        type="button"
        class="tab-button"
        :class="{ active: activeTab === 'flywheel' }"
        @click="activeTab = 'flywheel'"
      >
        📊 데이터 플라이휠
      </button>
    </nav>

    <template v-if="activeTab === 'ars'">
      <CallHeader />

      <main class="layout">
        <section class="call-screen">
          <ChatLog :messages="messages" />
          <MicButton @result="handleResult" @error="handleError" />
        </section>

        <StatsPanel :stats="stats" :log="statsLog" />
      </main>
    </template>

    <DashboardView v-else />
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  gap: 8px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
}
.tab-button {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 7px 14px;
  cursor: pointer;
}
.tab-button:hover { background: var(--surface-alt); }
.tab-button.active {
  color: var(--accent-strong);
  background: var(--accent-soft);
  border-color: transparent;
}

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
