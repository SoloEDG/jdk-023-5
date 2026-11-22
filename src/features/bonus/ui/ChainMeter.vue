<script setup lang="ts">
import { computed } from 'vue'
import { activePlayer, type PinballDocument } from '@/shared/document'
import { CHAIN_NEED } from '@/features/bonus/model/chain-rules'

const props = defineProps<{ doc: PinballDocument }>()
const chain = computed(() => activePlayer(props.doc).chain)
const pips = computed(() => Array.from({ length: CHAIN_NEED }, (_, index) => index < chain.value.count))
const windowLabel = computed(() => {
  if (chain.value.bonusMs > 0) return `${activePlayer(props.doc).name}奖励中`
  if (chain.value.count <= 0) return `${activePlayer(props.doc).name}尚未连上`
  return `${(chain.value.remainMs / 1000).toFixed(1)} 秒内续上`
})
</script>

<template>
  <section class="slip" aria-label="连锁">
    <header class="slip-head">
      <p class="eyebrow">连锁 · {{ activePlayer(doc).name }}</p>
      <h2>{{ windowLabel }}</h2>
    </header>
    <div class="pips" aria-hidden="true">
      <i v-for="(on, index) in pips" :key="index" :class="{ on }"></i>
    </div>
    <p class="slip-copy">连续打进四个不同区域进入奖励。同一区域只刷新时间，不增加连锁。换人后计时冻结，只属于本人。</p>
  </section>
</template>
