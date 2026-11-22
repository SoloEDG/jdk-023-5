import { flashNote, activePlayer, type PinballDocument } from '@/shared/document'

export function tickBonus(doc: PinballDocument, dtMs: number): void {
  const chain = activePlayer(doc).chain
  if (chain.bonusMs > 0) {
    chain.bonusMs = Math.max(0, chain.bonusMs - dtMs)
    if (chain.bonusMs === 0) {
      chain.multiplier = 1
      chain.count = 0
      chain.lastZone = null
      chain.remainMs = 0
      flashNote(doc, '奖励结束')
    }
    return
  }
  if (chain.remainMs <= 0) return
  chain.remainMs = Math.max(0, chain.remainMs - dtMs)
  if (chain.remainMs === 0) {
    chain.count = 0
    chain.lastZone = null
  }
}

/** 清掉一位玩家自己的连锁（目前只在重置整台时使用；落球换人会保留并冻结）。 */
export function clearChain(doc: PinballDocument): void {
  const chain = activePlayer(doc).chain
  chain.count = 0
  chain.lastZone = null
  chain.remainMs = 0
  chain.bonusMs = 0
  chain.multiplier = 1
}
