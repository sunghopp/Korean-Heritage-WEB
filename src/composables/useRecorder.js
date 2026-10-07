// 브라우저 MediaRecorder는 wav를 직접 만들 수 없어 webm/opus로 전송한다.
// 백엔드가 다른 포맷을 요구하면 여기서 mimeType 우선순위만 바꾸면 된다.
export function useRecorder() {
  let mediaStream = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let audioContext = null;
  let analyser = null;
  let analyserSource = null;
  let analyserData = null;

  function pickMimeType() {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    return candidates.find((type) => window.MediaRecorder && MediaRecorder.isTypeSupported(type)) || "";
  }

  async function ensureMicAccess() {
    if (mediaStream) return mediaStream;
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return mediaStream;
  }

  /**
   * 녹음 중 마이크 입력의 음량을 표시하기 위한 analyser를 준비한다.
   * AudioContext는 사용자의 버튼 동작 안에서 생성해야 브라우저 정책에 막히지 않는다.
   */
  async function enableLevelMonitoring() {
    const stream = await ensureMicAccess();
    if (analyser) return;

    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) throw new Error("이 브라우저는 음량 감지를 지원하지 않습니다.");
    audioContext = new AudioContextConstructor();
    if (audioContext.state === "suspended") await audioContext.resume();

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.25;
    analyserData = new Uint8Array(analyser.fftSize);
    analyserSource = audioContext.createMediaStreamSource(stream);
    analyserSource.connect(analyser);
  }

  // 0~1 범위의 RMS 음량을 반환한다. 마이크 신호를 스피커로 연결하지 않는다.
  function getInputLevel() {
    if (!analyser || !analyserData) return 0;

    analyser.getByteTimeDomainData(analyserData);
    let sum = 0;
    for (const sample of analyserData) {
      const normalized = (sample - 128) / 128;
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / analyserData.length);
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

  function release() {
    if (mediaRecorder?.state === "recording") mediaRecorder.stop();
    mediaRecorder = null;
    audioChunks = [];
    analyserSource?.disconnect();
    analyserSource = null;
    analyser = null;
    analyserData = null;
    if (audioContext) audioContext.close();
    audioContext = null;
    mediaStream?.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  return { enableLevelMonitoring, getInputLevel, start, stop, release };
}
