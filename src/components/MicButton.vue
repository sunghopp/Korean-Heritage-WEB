<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import { useRecorder } from "../composables/useRecorder";
import { translateAudio } from "../services/api";

const emit = defineEmits(["result", "error"]);
const props = defineProps({
  history: {
    type: Array,
    default: () => [],
  },
});

const state = ref("idle"); // idle | recording | processing
const inputLevel = ref(0);
const { enableLevelMonitoring, getInputLevel, start, stop, release } = useRecorder();

const MAX_RECORDING_MS = 30000;
// 링이 최대 크기가 되는 RMS 음량값이다.
const FULL_LEVEL = 0.018;
let maxTimer = null;
let animationFrameId = null;

function monitorInput() {
  inputLevel.value = Math.min(getInputLevel() / FULL_LEVEL, 1);
  animationFrameId = requestAnimationFrame(monitorInput);
}

function stopMonitoring() {
  cancelAnimationFrame(animationFrameId);
  inputLevel.value = 0;
}

const statusText = computed(() => {
  if (state.value === "recording") return "듣고 있어요…";
  if (state.value === "processing") return "처리 중…";
  return "마이크 버튼을 눌러 말씀해주세요";
});
const hintText = computed(() => {
  if (state.value === "recording") return "말씀을 마치면 버튼을 한 번 더 눌러주세요";
  if (state.value === "processing") return "AI가 인식하고 있어요";
  return "버튼을 누르면 듣기를 시작합니다";
});

async function startRecording() {
  try {
    await enableLevelMonitoring();
    await start();
    state.value = "recording";
    monitorInput();
    maxTimer = setTimeout(sendRecording, MAX_RECORDING_MS);
  } catch (err) {
    console.error(err);
    emit("error", "마이크 권한이 필요합니다. 브라우저 설정에서 허용한 뒤 다시 시도해주세요.");
  }
}

async function sendRecording() {
  if (state.value !== "recording") return;
  clearTimeout(maxTimer);
  stopMonitoring();
  state.value = "processing";
  const blob = await stop();
  try {
    if (!blob || blob.size === 0) return;
    const data = await translateAudio(blob, props.history);
    emit("result", data);
  } catch (err) {
    console.error(err);
    emit("error", err?.message || "서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.");
  } finally {
    state.value = "idle";
  }
}

function toggleRecording() {
  if (state.value === "idle") startRecording();
  else if (state.value === "recording") sendRecording();
}

onBeforeUnmount(() => {
  clearTimeout(maxTimer);
  stopMonitoring();
  release();
});
</script>

<template>
  <div class="mic-footer">
    <p class="mic-status">{{ statusText }}</p>
    <button
      class="mic-btn"
      :class="{ recording: state === 'recording', processing: state === 'processing' }"
      :disabled="state === 'processing'"
      type="button"
      :style="{ '--input-level': inputLevel }"
      :aria-label="state === 'recording' ? '듣기 종료' : '듣기 시작'"
      @click="toggleRecording"
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
.mic-btn.recording {
  background: var(--accent2);
  transform: scale(1.06);
  box-shadow: 0 0 0 calc(4px + 10px * var(--input-level)) rgba(246, 132, 31, 0.22);
}
.mic-btn.processing {
  background: var(--text-muted);
  cursor: wait;
}
.mic-btn:disabled { cursor: not-allowed; }
.mic-hint { margin: 0; font-size: 0.72rem; color: var(--text-muted); }

@media (max-width: 820px) {
  .mic-footer { padding: 10px 16px calc(12px + env(safe-area-inset-bottom)); gap: 6px; }
  .mic-btn { width: 64px; height: 64px; -webkit-tap-highlight-color: transparent; }
}
</style>
