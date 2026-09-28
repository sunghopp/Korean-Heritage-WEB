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
const assistantSpeaking = ref(false);
const HISTORY_KEY = "jeju-ars-conversation-v1";
const GREETING_MESSAGE = {
  type: "ai",
  label: "AI 인사",
  text: "안녕하우꽈, 제주120 만덕콜센터 AI 상담원이우다. 행정이나 생활 민원, 교통·관광, 복지 같은 궁금한 거 편하게 말씀해줍서.",
};

function loadConversationHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    if (!Array.isArray(saved)) return [];

    return saved
      .filter((turn) =>
        turn &&
        typeof turn.jeju_text === "string" &&
        typeof turn.standard_text === "string" &&
        typeof turn.ars_reply_jeju === "string"
      )
      .slice(-5);
  } catch {
    return [];
  }
}

function toChatMessages(turn) {
  return [
    {
      type: "user",
      jejuText: turn.jeju_text,
      standardText: turn.standard_text,
    },
    {
      type: "ai",
      label: "만덕콜센터 AI 답변",
      text: turn.ars_reply_jeju,
      replayable: false,
    },
  ];
}

const conversationHistory = ref(loadConversationHistory());

const messages = reactive([
  { ...GREETING_MESSAGE },
  ...conversationHistory.value.flatMap(toChatMessages),
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

  conversationHistory.value = [
    ...conversationHistory.value,
    {
      jeju_text: data.jeju_text || "",
      standard_text: data.standard_text || "",
      ars_reply_jeju: data.ars_reply_text || "답변을 생성했습니다.",
    },
  ].slice(-5);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(conversationHistory.value));

  // 4) 답변을 받는 즉시 TTS 음성 재생
  // 브라우저 자동재생 정책으로 막히는 경우에도 텍스트 클릭으로 다시 재생할 수 있다.
  if (audioUrl) {
    assistantSpeaking.value = true;
    await playAudio(audioUrl, {
      onEnded: () => {
        assistantSpeaking.value = false;
      },
    });
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

function resetConversation() {
  stopAudio();
  assistantSpeaking.value = false;
  createdAudioUrls.forEach(revokeAudioUrl);
  createdAudioUrls.length = 0;

  localStorage.removeItem(HISTORY_KEY);
  conversationHistory.value = [];
  messages.splice(0, messages.length, { ...GREETING_MESSAGE });
  Object.assign(stats, { turns: 0, jejuWords: 0, stdWords: 0, totalTime: 0 });
  statsLog.splice(0, statsLog.length);
}

onBeforeUnmount(() => {
  stopAudio();
  createdAudioUrls.forEach(revokeAudioUrl);
});
</script>

<template>
  <div class="app">
    <header class="app-chrome">
      <div class="tile-wave" aria-hidden="true"></div>
      <div class="brand-row">
        <div class="brand-lockup">
          <span class="brand-mark" aria-hidden="true">K·H</span>
          <div>
            <p class="brand-name">Korean Heritage</p>
            <p class="brand-description">사라지는 우리말을 잇는 경험</p>
          </div>
        </div>

        <nav class="tab-bar" aria-label="서비스 화면 선택">
          <button
            type="button"
            class="tab-button"
            :class="{ active: activeTab === 'ars' }"
            @click="activeTab = 'ars'"
          >
            AI ARS 상담
          </button>
          <button
            type="button"
            class="tab-button"
            :class="{ active: activeTab === 'flywheel' }"
            @click="activeTab = 'flywheel'"
          >
            데이터 플라이휠
          </button>
        </nav>
      </div>
    </header>

    <template v-if="activeTab === 'ars'">
      <CallHeader @reset="resetConversation" />

      <main class="layout">
        <section class="call-screen">
          <ChatLog :messages="messages" />
          <MicButton
            :history="conversationHistory"
            :is-assistant-speaking="assistantSpeaking"
            @result="handleResult"
            @error="handleError"
          />
        </section>

        <StatsPanel :stats="stats" :log="statsLog" />
      </main>
    </template>

    <DashboardView v-else />
  </div>
</template>

<style scoped>
.app-chrome {
  flex: 0 0 auto;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(120deg, #0d2024, #102c31 58%, #153d40);
}
.tile-wave {
  height: 18px;
  background-color: #28334b;
  background-image:
    radial-gradient(ellipse 18px 5px at 11px 0, transparent 61%, rgba(92, 111, 145, 0.54) 63% 72%, transparent 74%),
    radial-gradient(ellipse 18px 5px at 33px 10px, transparent 61%, rgba(16, 27, 49, 0.78) 63% 72%, transparent 74%),
    linear-gradient(180deg, #35405b, #202941);
  background-size: 44px 12px, 44px 12px, 100% 100%;
}
.brand-row {
  min-height: 76px;
  padding: 13px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}
.brand-lockup { display: flex; align-items: center; gap: 11px; }
.brand-mark {
  display: grid;
  place-items: center;
  width: 37px;
  height: 37px;
  color: var(--text);
  border: 1px solid rgba(236, 230, 216, 0.4);
  border-radius: 9px;
  background: linear-gradient(145deg, #315457, #15292d);
  box-shadow: inset 0 1px rgba(255,255,255,.14);
  font: 700 0.78rem/1 var(--font-title);
  letter-spacing: -0.08em;
}
.brand-name { margin: 0; color: var(--text); font: 700 0.98rem/1.2 var(--font-title); }
.brand-description { margin: 3px 0 0; color: var(--text-muted); font-size: 0.7rem; }
.tab-bar {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px;
  border: 1px solid rgba(236, 230, 216, 0.14);
  background: rgba(5, 15, 18, 0.34);
}
.tab-button {
  font-family: var(--font-display);
  font-size: 0.78rem;
  color: var(--text-muted);
  background: transparent;
  border: 0;
  border-radius: 4px;
  padding: 8px 13px;
  cursor: pointer;
}
.tab-button:hover { background: rgba(236, 230, 216, 0.08); }
.tab-button.active {
  color: #0b2528;
  background: var(--accent);
  font-weight: 600;
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
  .brand-row { padding: 11px 14px; flex-direction: column; align-items: stretch; gap: 10px; }
  .tab-bar { width: 100%; }
  .tab-button { flex: 1; }
  .call-screen { border-right: none; border-bottom: 1px solid var(--border); }
}
</style>
