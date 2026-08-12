let currentAudio = null;

/**
 * API의 base64 WAV 응답을 브라우저에서 재생 가능한 Blob URL로 변환한다.
 * raw base64와 data:audio/...;base64, 형식을 모두 지원한다.
 */
export function base64AudioToObjectUrl(base64, mimeType = "audio/wav") {
  if (!base64) return null;

  const normalized = String(base64).replace(/^data:[^;]+;base64,/, "");
  const binary = window.atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: mimeType || "audio/wav" });
  return URL.createObjectURL(blob);
}

/**
 * 새 답변 재생 시 기존 음성은 중지한다.
 * 자동 재생이 브라우저 정책으로 막히더라도 오류를 throw하지 않고 false를 반환한다.
 */
export async function playAudio(url) {
  if (!url) return false;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  const audio = new Audio(url);
  currentAudio = audio;

  try {
    await audio.play();
    return true;
  } catch (error) {
    console.warn("Audio playback was blocked or failed:", error);
    return false;
  }
}

export function stopAudio() {
  if (!currentAudio) return;
  currentAudio.pause();
  currentAudio.currentTime = 0;
  currentAudio = null;
}

export function revokeAudioUrl(url) {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
