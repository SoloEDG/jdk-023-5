<script setup lang="ts">
import type { PinballDocument } from '@/shared/document'
import { formatPlay } from '@/features/records/model/history-store'

defineProps<{ doc: PinballDocument }>()
</script>

<template>
  <section class="slip" aria-label="对局记录">
    <header class="slip-head">
      <p class="eyebrow">记录</p>
      <h2>最近对局（一场两人）</h2>
    </header>
    <p v-if="doc.history.length === 0" class="slip-copy">打完一场两人轮换，或中途重开，才会留下一条记录。</p>
    <ol v-else class="history-list">
      <li v-for="entry in doc.history" :key="entry.id" class="history-entry">
        <div class="history-head">
          <strong>{{ entry.score }}</strong>
          <span>{{ formatPlay(entry.playMs) }}</span>
          <span>{{ entry.abandoned ? '中途重开' : '打完' }}</span>
          <span>{{ entry.tilted ? '有人倾斜' : '未倾斜' }}</span>
        </div>
        <div class="history-players">
          <span v-for="player in entry.players" :key="player.id">
            {{ player.name }} {{ player.score }}
          </span>
        </div>
      </li>
    </ol>
  </section>
</template>
