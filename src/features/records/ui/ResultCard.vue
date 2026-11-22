<script setup lang="ts">
import { matchScore, type PinballDocument } from '@/shared/document'
import { formatPlay } from '@/features/records/model/history-store'

defineProps<{ doc: PinballDocument }>()
</script>

<template>
  <section v-if="doc.phase === 'gameover'" class="result-card" role="status">
    <p class="eyebrow">整场结束</p>
    <h2>{{ matchScore(doc) }}</h2>
    <ul class="result-players">
      <li v-for="player in doc.players" :key="player.id">
        <span>{{ player.name }}</span>
        <strong>{{ player.score }}</strong>
        <em>{{ player.live.tilted ? '倾斜过' : '未倾斜' }}</em>
      </li>
    </ul>
    <p>用时 {{ formatPlay(doc.run.playMs) }}。两人成绩合并记为一场。</p>
  </section>
</template>
