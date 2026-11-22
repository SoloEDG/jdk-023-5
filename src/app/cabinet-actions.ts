import {
  activePlayer,
  ballsRemaining,
  flashNote,
  otherPlayer,
  type PinballDocument,
} from '@/shared/document'
import { clearWarnings } from '@/features/flippers'
import { commitSession } from '@/features/records'
import { mountFresh, stickPlunger } from '@/features/table'
import { publishGates } from '@/features/table/model/mechanism-rules'

export function togglePause(doc: PinballDocument): void {
  if (doc.phase === 'paused') {
    doc.phase = doc.phaseBeforePause ?? 'ready'
    doc.phaseBeforePause = null
    return
  }
  if (doc.phase === 'playing' || doc.phase === 'ready') {
    doc.phaseBeforePause = doc.phase
    doc.phase = 'paused'
  }
}

export function applyDrain(doc: PinballDocument): void {
  doc.signals.drain = false
  if (doc.phase === 'gameover') return
  const player = activePlayer(doc)
  if (player.nudge.tilted) player.live.tilted = true
  // 连锁、倍率与奖励时间不清除，原样冻结在这位玩家名下，等他下一颗球继续。
  clearWarnings(doc)
  player.ballsLeft -= 1
  doc.ball.rideMs = 0
  doc.ball.holdMs = 0
  doc.ball.vx = 0
  doc.ball.vy = 0

  if (ballsRemaining(doc) <= 0) {
    doc.phase = 'gameover'
    doc.ball.held = 'none'
    flashNote(doc, '两人的球都用尽了')
    commitSession(doc, false)
    return
  }

  // 换人发生在球已落出、下一颗还停在发射槽时。
  doc.activePlayer = otherPlayer(doc).id
  doc.phase = 'ready'
  doc.plunger.power = 0
  stickPlunger(doc)
  // 立刻按新玩家状态重算闸门：上一位奖励顶开的坡道不能在待命时继续亮着。
  publishGates(doc)
  const next = activePlayer(doc)
  flashNote(doc, `轮到${next.name}，还剩 ${next.ballsLeft} 颗球`)
}

export function restartGame(doc: PinballDocument): void {
  if (doc.run.launched && !doc.run.committed) commitSession(doc, doc.phase !== 'gameover')
  mountFresh(doc, {
    career: doc.career,
    history: doc.history,
    bestScore: doc.bestScore,
  })
}
