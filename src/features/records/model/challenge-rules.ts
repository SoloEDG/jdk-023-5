import { matchScore, type PinballDocument } from '@/shared/document'

export interface GoalView {
  id: string
  label: string
  detail: string
  liveDone: boolean
  careerDone: boolean
}

function totalBonus(doc: PinballDocument): number {
  return doc.players.reduce((sum, player) => sum + player.live.bonusEntries, 0)
}

function totalBankClears(doc: PinballDocument): number {
  return doc.players.reduce((sum, player) => sum + player.live.bankClears, 0)
}

function matchTilted(doc: PinballDocument): boolean {
  return doc.players.some((player) => player.live.tilted)
}

export function latchCareer(doc: PinballDocument): boolean {
  let changed = false
  if (matchScore(doc) >= 10000 && !doc.career.score10k) {
    doc.career.score10k = true
    changed = true
  }
  if (totalBonus(doc) > 0 && !doc.career.bonusOnce) {
    doc.career.bonusOnce = true
    changed = true
  }
  if (totalBankClears(doc) >= 2 && !doc.career.bankTwice) {
    doc.career.bankTwice = true
    changed = true
  }
  return changed
}

export function goalViews(doc: PinballDocument): GoalView[] {
  const tilted = matchTilted(doc)
  const cleanLive = doc.phase === 'gameover' && !tilted
  const cleanDetail = tilted
    ? '本场已经有人倾斜'
    : doc.phase === 'gameover'
      ? '整场无倾斜收台'
      : '两人打完前都不要倾斜'
  const bonusDetail = doc.players
    .map((player) => `${player.name} ${player.live.bonusEntries} 次`)
    .join(' · ')
  const bankDetail = doc.players
    .map((player) => `${player.name} ${player.live.bankClears} 次`)
    .join(' · ')
  return [
    {
      id: 'score10k',
      label: '得分破万',
      detail: `整场合计 ${matchScore(doc)}`,
      liveDone: matchScore(doc) >= 10000,
      careerDone: doc.career.score10k,
    },
    {
      id: 'bonus',
      label: '进入奖励',
      detail: bonusDetail,
      liveDone: totalBonus(doc) > 0,
      careerDone: doc.career.bonusOnce,
    },
    {
      id: 'bank',
      label: '清空落靶两次',
      detail: bankDetail,
      liveDone: totalBankClears(doc) >= 2,
      careerDone: doc.career.bankTwice,
    },
    {
      id: 'clean',
      label: '无倾斜收台',
      detail: cleanDetail,
      liveDone: cleanLive,
      careerDone: doc.career.cleanFinish,
    },
  ]
}
