import type { ContactEvent } from '@/shared/contacts'
import { activePlayer, flashNote, type PinballDocument } from '@/shared/document'
import { BodyId } from '@/shared/ids'

export const CHAIN_NEED = 4
export const CHAIN_WINDOW_MS = 2500
export const BONUS_MS = 15000
export const BONUS_MULTIPLIER = 2

const ZONES = new Set<string>([
  BodyId.laneL,
  BodyId.laneC,
  BodyId.laneR,
  BodyId.hole,
  BodyId.ramp,
  BodyId.spinner,
])

function arm(doc: PinballDocument, zone: string): void {
  const player = activePlayer(doc)
  const chain = player.chain
  chain.count += 1
  chain.lastZone = zone
  chain.remainMs = CHAIN_WINDOW_MS
  if (chain.count < CHAIN_NEED || chain.bonusMs > 0) return
  chain.bonusMs = BONUS_MS
  chain.multiplier = BONUS_MULTIPLIER
  player.live.bonusEntries += 1
  flashNote(doc, `${player.name}进入奖励，得分双倍`)
}

export function absorbZones(doc: PinballDocument, events: ContactEvent[]): void {
  const chain = activePlayer(doc).chain
  if (chain.bonusMs > 0) return
  for (const event of events) {
    if (!ZONES.has(event.id)) continue
    if (chain.remainMs <= 0) {
      chain.count = 0
      chain.lastZone = null
    }
    if (chain.lastZone === event.id) {
      chain.remainMs = CHAIN_WINDOW_MS
      continue
    }
    arm(doc, event.id)
  }
}
