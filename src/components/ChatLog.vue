<script setup>
import { nextTick, ref, watch } from "vue";
import ChatBubble from "./ChatBubble.vue";

const props = defineProps({
  messages: { type: Array, required: true },
});

const chatLogEl = ref(null);

watch(
  () => props.messages.length,
  async () => {
    await nextTick();
    if (chatLogEl.value) chatLogEl.value.scrollTop = chatLogEl.value.scrollHeight;
  }
);
</script>

<template>
  <div class="chat-log" ref="chatLogEl">
    <ChatBubble v-for="(message, i) in messages" :key="i" :message="message" />
  </div>
</template>

<style scoped>
.chat-log {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--surface-alt);
  min-height: 320px;
}
.chat-log::-webkit-scrollbar { width: 10px; }
.chat-log::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 999px;
  border: 3px solid var(--surface-alt);
}
.chat-log::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
</style>
