const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getRecordingExtension(blob) {
  const type = blob?.type || "";
  if (type.includes("wav")) return "wav";
  if (type.includes("mp4")) return "mp4";
  if (type.includes("ogg")) return "ogg";
  return "webm";
}

export async function translateAudio(blob) {
  const ext = getRecordingExtension(blob);
  const formData = new FormData();
  formData.append("file", blob, `recording.${ext}`);

  const res = await fetch(`${BASE_URL}/translate`, {
    method: "POST",
    body: formData,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`API 응답을 JSON으로 해석할 수 없습니다. (HTTP ${res.status})`);
  }

  if (!res.ok || data.status !== "success") {
    throw new Error(data.message || data.detail || `서버 처리 실패 (HTTP ${res.status})`);
  }

  return data;
}
