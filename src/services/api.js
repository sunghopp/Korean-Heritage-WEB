const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function translateAudio(blob) {
  const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm";
  const formData = new FormData();
  formData.append("file", blob, `recording.${ext}`);

  const res = await fetch(`${BASE_URL}/translate`, { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok || data.status !== "success") {
    throw new Error(data.message || "서버 처리 실패");
  }
  return data;
}
