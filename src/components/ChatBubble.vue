<script setup>
import { playAudio } from "../services/audio";

const props = defineProps({
  message: { type: Object, required: true },
});

async function replayAnswer() {
  if (!props.message.audioUrl) return;
  await playAudio(props.message.audioUrl);
}
</script>

<template>
  <div class="bubble" :class="message.type">
    <template v-if="message.type === 'ai'">
      <p class="bubble-label">{{ message.label || "AI 인사" }}</p>

      <button
        v-if="message.replayable && message.audioUrl"
        type="button"
        class="ai-answer replayable"
        title="클릭하면 답변 음성을 다시 재생합니다"
        aria-label="AI 답변 다시 듣기"
        @click="replayAnswer"
      >
        {{ message.text }}
      </button>

      <p v-else class="ai-answer">{{ message.text }}</p>

      <p v-if="message.replayable && message.audioUrl" class="replay-hint">
        🔊 답변을 누르면 다시 들을 수 있어요
      </p>
    </template>

    <template v-else-if="message.type === 'user'">
      <p class="bubble-label">사용자 발화 인식</p>
      <p class="jeju-text">"{{ message.jejuText }}"</p>
      <p class="arrow">↓ 표준어 번역</p>
      <p class="std-text">"{{ message.standardText }}"</p>
    </template>

    <template v-else>
      {{ message.text }}
    </template>
  </div>
</template>

<style scoped>
.bubble {
  border-radius: 12px;
  padding: 12px 14px;
  max-width: 82%;
  box-shadow: 0 8px 18px rgba(0, 0, 0, .14);
}
.bubble-label {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  margin: 0 0 4px;
  opacity: 0.75;
}
.bubble p:last-child { margin-bottom: 0; }
.bubble.ai {
  align-self: flex-start;
  border: 1px solid rgba(236, 230, 216, .12);
  background: linear-gradient(145deg, #263a3d, #17282b);
  color: var(--accent-strong);
}
.bubble.ai .ai-answer {
  color: var(--text);
  margin: 0;
}

.ai-answer.replayable {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  line-height: inherit;
  text-align: left;
  color: var(--text);
  cursor: pointer;
}
.ai-answer.replayable:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.ai-answer.replayable:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
  border-radius: 3px;
}
.replay-hint {
  margin: 7px 0 0;
  color: var(--accent-strong);
  font-size: 0.68rem;
  opacity: 0.78;
}

.bubble.user {
  align-self: flex-end;
  background: linear-gradient(145deg, #68c0b6, #3d9d94);
}
.bubble.user .jeju-text { color: var(--text); font-weight: 700; margin: 0; }
.bubble.user .arrow { font-size: 0.72rem; color: #204d4c; margin: 6px 0 2px; }
.bubble.user .std-text { color: #204d4c; margin: 0; }

@media (max-width: 820px) {
  .bubble { max-width: 88%; overflow-wrap: anywhere; }
}

.bubble.error {
  align-self: center;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.85rem;
}
</style>
