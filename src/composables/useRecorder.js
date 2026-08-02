// 브라우저 MediaRecorder는 wav를 직접 만들 수 없어 webm/opus로 전송한다.
// 백엔드가 다른 포맷을 요구하면 여기서 mimeType 우선순위만 바꾸면 된다.
export function useRecorder() {
  let mediaStream = null;
  let mediaRecorder = null;
  let audioChunks = [];

  function pickMimeType() {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    return candidates.find((type) => window.MediaRecorder && MediaRecorder.isTypeSupported(type)) || "";
  }

  async function ensureMicAccess() {
    if (mediaStream) return mediaStream;
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return mediaStream;
  }

  async function start() {
    await ensureMicAccess();
    audioChunks = [];
    const mimeType = pickMimeType();
    mediaRecorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };
    mediaRecorder.start();
  }

  function stop() {
    return new Promise((resolve) => {
      if (!mediaRecorder || mediaRecorder.state !== "recording") {
        resolve(null);
        return;
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
        resolve(blob);
      };
      mediaRecorder.stop();
    });
  }

  return { start, stop };
}
