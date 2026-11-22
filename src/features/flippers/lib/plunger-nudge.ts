import type { FrameInput } from '@/shared/commands'
import { activePlayer, flashNote, type PinballDocument } from '@/shared/document'

const CHARGE_MS = 900
const TILT_LIMIT = 3
const NUDGE_SPEED = 240

export function advancePlunger(doc: PinballDocument, input: FrameInput, dtMs: number): void {
  if (doc.ball.held !== 'plunger' || doc.phase === 'gameover') {
    doc.plunger.charging = false
    if (doc.ball.held !== 'plunger') doc.plunger.power = 0
    return
  }
  if (input.plunger) {
    doc.plunger.charging = true
    doc.plunger.power = Math.min(1, doc.plunger.power + dtMs / CHARGE_MS)
  } else {
    doc.plunger.charging = false
  }
  if (!input.plungerReleased || doc.ball.held !== 'plunger') return
  const power = Math.max(doc.plunger.power, 0.2)
  doc.ball.held = 'none'
  doc.ball.vy = -(980 + power * 1100)
  doc.ball.vx = -24
  doc.plunger.power = 0
  doc.plunger.charging = false
  if (doc.phase === 'ready') {
    doc.phase = 'playing'
    doc.run.launched = true
    doc.run.turnCount += 1
  }
}

function bump(doc: PinballDocument, direction: -1 | 1): void {
  const player = activePlayer(doc)
  const nudge = player.nudge
  doc.ball.vx += direction * NUDGE_SPEED
  nudge.warnings += 1
  nudge.flashMs = 160
  nudge.flashDir = direction
  if (nudge.warnings >= TILT_LIMIT) {
    nudge.tilted = true
    player.live.tilted = true
    flashNote(doc, `${player.name}倾斜，挡板失灵`)
    return
  }
  flashNote(doc, `${player.name}轻推 ${nudge.warnings}/${TILT_LIMIT}`)
}

export function applyNudges(doc: PinballDocument, input: FrameInput): void {
  if (doc.phase !== 'playing' || activePlayer(doc).nudge.tilted || doc.ball.held !== 'none') return
  if (input.nudgeLeft) bump(doc, -1)
  if (input.nudgeRight && activePlayer(doc).nudge.warnings < TILT_LIMIT) bump(doc, 1)
}

export function decayNudgeFlash(doc: PinballDocument, dtMs: number): void {
  const flash = activePlayer(doc).nudge
  if (flash.flashMs <= 0) return
  flash.flashMs = Math.max(0, flash.flashMs - dtMs)
  if (flash.flashMs === 0) flash.flashDir = 0
}

/** 只清掉当前玩家的轻推计数，另一位的倾斜记录不受影响。 */
export function clearWarnings(doc: PinballDocument): void {
  const nudge = activePlayer(doc).nudge
  nudge.warnings = 0
  nudge.tilted = false
  nudge.flashMs = 0
  nudge.flashDir = 0
}
