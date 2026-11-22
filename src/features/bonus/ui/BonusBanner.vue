<script setup lang="ts">
import { computed } from 'vue'
import { activePlayer, type PinballDocument } from '@/shared/document'

const props = defineProps<{ doc: PinballDocument }>()
const chain = computed(() => activePlayer(props.doc).chain)
const active = computed(() => chain.value.bonusMs > 0)
const seconds = computed(() => (chain.value.bonusMs / 1000).toFixed(1))
</script>

<template>
  <p v-if="active" class="bonus-flag" role="status">
    {{ activePlayer(doc).name }}奖励 {{ chain.multiplier }} 倍 · 剩 {{ seconds }} 秒，坡道保持打开
  </p>
  <p v-else class="bonus-flag bonus-idle">{{ activePlayer(doc).name }}奖励未开启。通道、转轮、回球洞和坡道都算连锁区域。</p>
</template>
