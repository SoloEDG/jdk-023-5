<script setup lang="ts">
import { computed } from 'vue'
import {
  activePlayer,
  BALLS_PER_PLAYER,
  matchScore,
  type PinballDocument,
} from '@/shared/document'
import { speedOf } from '@/shared/geometry'

const props = defineProps<{ doc: PinballDocument }>()

const totalScore = computed(() => matchScore(props.doc))

const clock = computed(() => {
  const total = Math.floor(props.doc.run.playMs / 1000)
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`
})

const speed = computed(() => Math.round(speedOf(props.doc.ball.vx, props.doc.ball.vy)))

const phaseLabel = computed(() => {
  if (props.doc.phase === 'paused') return '暂停'
  if (props.doc.phase === 'gameover') return '结束'
  if (props.doc.phase === 'ready') return '待发'
  if (props.doc.ball.held === 'plunger') return '回槽'
  return '游玩'
})

const turnLabel = computed(() => {
  const current = activePlayer(props.doc)
  const used = BALLS_PER_PLAYER - current.ballsLeft + 1
  return `第 ${used} 颗 / 共 ${BALLS_PER_PLAYER} 颗`
})
</script>

<template>
  <div class="score-window">
    <p class="score-digits" aria-live="polite">{{ totalScore }}</p>
    <div class="player-scores">
      <p
        v-for="player in doc.players"
        :key="player.id"
        class="player-score"
        :class="{ on: player.id === doc.activePlayer && doc.phase !== 'gameover' }"
      >
        <span class="player-dot" aria-hidden="true"></span>
        <span class="player-name">{{ player.name }}</span>
        <strong>{{ player.score }}</strong>
        <em>剩 {{ player.ballsLeft }} 球</em>
      </p>
    </div>
    <dl class="score-meta">
      <div>
        <dt>最佳</dt>
        <dd>{{ Math.max(doc.bestScore, totalScore) }}</dd>
      </div>
      <div>
        <dt>用时</dt>
        <dd>{{ clock }}</dd>
      </div>
      <div>
        <dt>球速</dt>
        <dd>{{ speed }}</dd>
      </div>
      <div>
        <dt>状态</dt>
        <dd>{{ phaseLabel }}</dd>
      </div>
    </dl>
    <p class="ball-label">{{ activePlayer(doc).name }} · {{ turnLabel }}</p>
    <p v-if="doc.note.ms > 0" class="note-line">{{ doc.note.text }}</p>
  </div>
</template>
