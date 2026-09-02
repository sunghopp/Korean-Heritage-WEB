const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchDatasetStats() {
  const res = await fetch(`${BASE_URL}/dataset/stats`);
  if (!res.ok) {
    throw new Error(`통계 조회 실패 (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchDatasetSamples(limit = 100) {
  const res = await fetch(`${BASE_URL}/dataset/samples?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`데이터 목록 조회 실패 (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.samples;
}

export function datasetAudioUrl(id) {
  return `${BASE_URL}/dataset/audio/${id}`;
}

export async function updateDatasetSample(tier, id, updates) {
  const res = await fetch(`${BASE_URL}/dataset/samples/${tier}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`레이블 저장 실패 (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.detail || `레이블 저장 실패 (HTTP ${res.status})`);
  }

  return data;
}
