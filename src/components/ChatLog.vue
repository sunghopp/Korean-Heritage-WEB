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
  background:
    radial-gradient(ellipse at 20% -10%, rgba(236, 230, 216, .10), transparent 34%),
    radial-gradient(circle at 82% 12%, rgba(79, 179, 168, .16), transparent 30%),
    linear-gradient(145deg, rgba(16, 35, 40, .97), rgba(11, 26, 30, .98)),
    var(--basalt-texture);
  min-height: 320px;
}
.chat-log::-webkit-scrollbar { width: 10px; }
.chat-log::-webkit-scrollbar-thumb {
  background: rgba(169, 179, 177, .46);
  border-radius: 999px;
  border: 3px solid #0d1d21;
}
.chat-log::-webkit-scrollbar-thumb:hover { background: var(--accent); }
</style>
