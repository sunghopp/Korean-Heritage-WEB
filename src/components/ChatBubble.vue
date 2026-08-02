<script setup>
defineProps({
  message: { type: Object, required: true },
});
</script>

<template>
  <div class="bubble" :class="message.type">
    <template v-if="message.type === 'ai'">
      <p class="bubble-label">AI 인사</p>
      <p>{{ message.text }}</p>
    </template>
    <template v-else-if="message.type === 'user'">
      <p class="bubble-label">사용자 발화 인식</p>
      <p class="jeju-text">"{{ message.jejuText }}"</p>
      <p class="arrow">↓ 표준어 번역</p>
      <p class="std-text">"{{ message.standardText }}"</p>
    </template>
    <template v-else>
      {{ message.text }}
    </template>
  </div>
</template>

<style scoped>
.bubble {
  border-radius: 10px;
  padding: 12px 14px;
  max-width: 82%;
}
.bubble-label {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  margin: 0 0 4px;
  opacity: 0.75;
}
.bubble p:last-child { margin-bottom: 0; }
.bubble.ai {
  align-self: flex-start;
  background: var(--accent-soft);
  color: var(--accent-strong);
}
.bubble.ai p:not(.bubble-label) { color: var(--text); margin: 0; }

.bubble.user {
  align-self: flex-end;
  background: var(--accent2-soft);
}
.bubble.user .jeju-text { color: var(--text); font-weight: 700; margin: 0; }
.bubble.user .arrow { font-size: 0.72rem; color: var(--text-muted); margin: 6px 0 2px; }
.bubble.user .std-text { color: var(--text-muted); margin: 0; }

.bubble.error {
  align-self: center;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.85rem;
}
</style>
