<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRecorder } from "../composables/useRecorder";
import { translateAudio } from "../services/api";

const emit = defineEmits(["result", "error"]);
const props = defineProps({
  history: {
    type: Array,
    default: () => [],
  },
  // AI TTS가 스피커에서 재생되는 동안 마이크가 다시 반응하는 것을 막는다.
  isAssistantSpeaking: Boolean,
});

const state = ref("idle"); // idle | listening | recording | processing
const inputLevel = ref(0);
const { enableLevelMonitoring, getInputLevel, start, stop, release } = useRecorder();

// 조용한 실내 기준 RMS 음량값이다. 현장 소음이 크면 이 값만 조정하면 된다.
const START_THRESHOLD = 0.018;
const CONTINUE_THRESHOLD = 0.011;
const VOICE_CONFIRM_MS = 100;
const SILENCE_TO_SEND_MS = 1200;
const MAX_RECORDING_MS = 30000;

let animationFrameId = null;
let speechCandidateStartedAt = null;
let lastVoiceAt = null;
let recordingStartedAt = null;

const statusText = computed(() => {
  if (state.value === "recording") return "듣고 있어요…";
  if (state.value === "processing") return "처리 중…";
  if (state.value === "listening") {
    return props.isAssistantSpeaking ? "AI 답변이 끝나길 기다리고 있어요…" : "말씀을 기다리고 있어요…";
  }
  return "자동 듣기를 시작해주세요";
});
const hintText = computed(() => {
  if (state.value === "recording") return "말씀이 끝나면 자동으로 전송됩니다";
  if (state.value === "processing") return "AI가 인식하고 있어요";
  if (state.value === "listening") return "아래 버튼을 누르면 자동 듣기를 종료합니다";
  return "한 번만 눌러 마이크 권한을 허용해주세요";
});

function stopMonitoring() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  inputLevel.value = 0;
  speechCandidateStartedAt = null;
}

function monitorInput() {
  if (state.value === "idle" || state.value === "processing") return;

  const now = performance.now();
  const level = getInputLevel();
  inputLevel.value = Math.min(level / START_THRESHOLD, 1);

  if (!props.isAssistantSpeaking) {
    if (state.value === "listening") {
      if (level >= START_THRESHOLD) {
        speechCandidateStartedAt ??= now;
        if (now - speechCandidateStartedAt >= VOICE_CONFIRM_MS) startRecording();
      } else {
        speechCandidateStartedAt = null;
      }
    } else if (state.value === "recording") {
      if (level >= CONTINUE_THRESHOLD) lastVoiceAt = now;
      const hasBeenSilent = lastVoiceAt && now - lastVoiceAt >= SILENCE_TO_SEND_MS;
      const reachedMaximumLength = recordingStartedAt && now - recordingStartedAt >= MAX_RECORDING_MS;
      if (hasBeenSilent || reachedMaximumLength) sendRecording();
    }
  }

  animationFrameId = requestAnimationFrame(monitorInput);
}

async function startRecording() {
  if (state.value !== "listening" || props.isAssistantSpeaking) return;
  try {
    await start();
    const now = performance.now();
    state.value = "recording";
    recordingStartedAt = now;
    lastVoiceAt = now;
    speechCandidateStartedAt = null;
  } catch (err) {
    console.error(err);
    emit("error", "녹음을 시작하지 못했습니다. 마이크 권한을 확인해주세요.");
    state.value = "listening";
  }
}

async function startAutoListening() {
  if (state.value !== "idle") return;
  try {
    await enableLevelMonitoring();
    state.value = "listening";
    monitorInput();
  } catch (err) {
    emit("error", "마이크 권한이 필요합니다. 브라우저 설정에서 허용한 뒤 다시 시도해주세요.");
  }
}

async function sendRecording() {
  if (state.value !== "recording") return;
  state.value = "processing";
  stopMonitoring();
  const blob = await stop();
  if (!blob || blob.size === 0) {
    state.value = "listening";
    monitorInput();
    return;
  }

  try {
    const data = await translateAudio(blob, props.history);
    emit("result", data);
  } catch (err) {
    console.error(err);
    emit("error", err?.message || "서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.");
  } finally {
    state.value = "listening";
    monitorInput();
  }
}

function toggleAutoListening() {
  if (state.value === "idle") {
    startAutoListening();
    return;
  }
  if (state.value === "listening") {
    stopMonitoring();
    release();
    state.value = "idle";
  }
}

watch(
  () => props.isAssistantSpeaking,
  (speaking) => {
    if (speaking) {
      speechCandidateStartedAt = null;
      return;
    }
    // TTS가 끝난 직후의 잔향을 새 발화로 잘못 감지하지 않도록 기준 시점을 초기화한다.
    speechCandidateStartedAt = null;
  }
);

onBeforeUnmount(() => {
  stopMonitoring();
  release();
});
</script>

<template>
  <div class="mic-footer">
    <p class="mic-status">{{ statusText }}</p>
    <button
      class="mic-btn"
      :class="{ listening: state === 'listening', recording: state === 'recording', processing: state === 'processing' }"
      :disabled="state === 'processing'"
      type="button"
      :aria-label="state === 'idle' ? '자동 듣기 시작' : '자동 듣기 종료'"
      :style="{ '--input-level': inputLevel }"
      @click="toggleAutoListening"
    >🎙️</button>
    <p class="mic-hint">{{ hintText }}</p>
  </div>
</template>

<style scoped>
.mic-footer {
  border-top: 1px solid var(--border);
  padding: 16px 16px 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: #0c1b1f;
}
.mic-status {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}
.mic-btn {
  width: 60px; height: 60px;
  border-radius: 50%;
  border: none;
  background: #eac54f;
  color: #092328;
  font-size: 1.4rem;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  transition: background 0.15s ease, transform 0.1s ease;
}
.mic-btn:hover { background: #f2d979; }
.mic-btn.listening {
  box-shadow: 0 0 0 calc(4px + 10px * var(--input-level)) rgba(246, 132, 31, 0.22);
}
.mic-btn.recording {
  background: var(--accent2);
  transform: scale(1.06);
}
.mic-btn.processing {
  background: var(--text-muted);
  cursor: wait;
}
.mic-btn:disabled { cursor: not-allowed; }
.mic-hint { margin: 0; font-size: 0.72rem; color: var(--text-muted); }
</style>
