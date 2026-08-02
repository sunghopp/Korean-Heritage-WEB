import { onMounted, onUnmounted, ref } from "vue";

export function useCallTimer() {
  const elapsed = ref("00:00");
  const start = Date.now();
  let timer = null;

  function tick() {
    const seconds = Math.floor((Date.now() - start) / 1000);
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    elapsed.value = `${m}:${s}`;
  }

  onMounted(() => {
    tick();
    timer = setInterval(tick, 1000);
  });
  onUnmounted(() => clearInterval(timer));

  return { elapsed };
}
