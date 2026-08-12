<script setup>
import { computed, ref } from "vue";
import { useRecorder } from "../composables/useRecorder";
import { translateAudio } from "../services/api";

const emit = defineEmits(["result", "error"]);

const state = ref("idle"); // idle | recording | processing
const { start, stop } = useRecorder();

const statusText = computed(() => {
  if (state.value === "recording") return "듣고 있어요…";
  if (state.value === "processing") return "처리 중…";
  return "누르고 말하기";
});
const hintText = computed(() => {
  if (state.value === "recording") return "손을 떼면 전송됩니다";
  if (state.value === "processing") return "AI가 인식하고 있어요";
  return "버튼을 누르고 있는 동안 녹음됩니다";
});

// Press & Hold: pointer capture로 버튼 밖에서 손을 떼도 정상 종료되게 한다.
async function handlePointerDown(e) {
  if (state.value !== "idle") return;
  e.currentTarget.setPointerCapture(e.pointerId);
  try {
    await start();
    state.value = "recording";
  } catch (err) {
    emit("error", "마이크 권한이 필요합니다. 브라우저 설정에서 허용한 뒤 다시 시도해주세요.");
  }
}

async function handleRelease() {
  if (state.value !== "recording") return;
  state.value = "processing";
  const blob = await stop();
  if (!blob || blob.size === 0) {
    state.value = "idle";
    return;
  }

  try {
    const data = await translateAudio(blob);
    emit("result", data);
  } catch (err) {
    console.error(err);
    emit("error", err?.message || "서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.");
  } finally {
    state.value = "idle";
  }
}
</script>

<template>
  <div class="mic-footer">
    <p class="mic-status">{{ statusText }}</p>
    <button
      class="mic-btn"
      :class="{ recording: state === 'recording', processing: state === 'processing' }"
      :disabled="state === 'processing'"
      type="button"
      aria-label="눌러서 말하기"
      @pointerdown="handlePointerDown"
      @pointerup="handleRelease"
      @pointercancel="handleRelease"
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
  background: var(--surface);
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
  background: var(--accent);
  color: white;
  font-size: 1.4rem;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  transition: background 0.15s ease, transform 0.1s ease;
}
.mic-btn:hover { background: var(--accent-strong); }
.mic-btn.recording {
  background: var(--danger);
  transform: scale(1.06);
}
.mic-btn.processing {
  background: var(--text-muted);
  cursor: wait;
}
.mic-btn:disabled { cursor: not-allowed; }
.mic-hint { margin: 0; font-size: 0.72rem; color: var(--text-muted); }
</style>
