import { STORAGE_KEY } from '@/shared/ids'
import {
  defaultCareer,
  flashNote,
  matchScore,
  type CareerState,
  type HistoryEntry,
  type PinballDocument,
  type PlayerRecord,
} from '@/shared/document'
import type { KeptRecords } from '@/features/table'
import { latchCareer } from '@/features/records/model/challenge-rules'

interface SaveBlob {
  version: 2
  bestScore: number
  career: CareerState
  history: HistoryEntry[]
}

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function parseCareer(value: unknown): CareerState {
  const career = defaultCareer()
  if (!value || typeof value !== 'object') return career
  const raw = value as Partial<CareerState>
  career.score10k = raw.score10k === true
  career.bonusOnce = raw.bonusOnce === true
  career.bankTwice = raw.bankTwice === true
  career.cleanFinish = raw.cleanFinish === true
  return career
}

function parsePlayerRecord(value: unknown, index: 0 | 1): PlayerRecord | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<PlayerRecord>
  if (typeof raw.score !== 'number' || !Number.isFinite(raw.score)) return null
  return {
    id: index,
    name: typeof raw.name === 'string' && raw.name ? raw.name : `玩家${index === 0 ? '一' : '二'}`,
    score: raw.score,
    ballsLeft: typeof raw.ballsLeft === 'number' ? raw.ballsLeft : 0,
    bonusEntries: typeof raw.bonusEntries === 'number' ? raw.bonusEntries : 0,
    bankClears: typeof raw.bankClears === 'number' ? raw.bankClears : 0,
    tilted: raw.tilted === true,
  }
}

function parseEntry(value: unknown): HistoryEntry | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<HistoryEntry>
  if (typeof raw.id !== 'string' || typeof raw.score !== 'number' || !Number.isFinite(raw.score)) return null
  const players = Array.isArray(raw.players)
    ? ([parsePlayerRecord(raw.players[0], 0), parsePlayerRecord(raw.players[1], 1)] as const)
    : null
  // 只认一场两人的记录，缺任一方都视为损坏数据。
  if (!players || !players[0] || !players[1]) return null
  return {
    id: raw.id,
    endedAt: typeof raw.endedAt === 'number' ? raw.endedAt : 0,
    score: raw.score,
    playMs: typeof raw.playMs === 'number' ? raw.playMs : 0,
    abandoned: raw.abandoned === true,
    tilted: raw.tilted === true,
    bonusEntries: typeof raw.bonusEntries === 'number' ? raw.bonusEntries : 0,
    bankClears: typeof raw.bankClears === 'number' ? raw.bankClears : 0,
    cleanFinish: raw.cleanFinish === true,
    players: [players[0], players[1]],
  }
}

export function emptyKept(): KeptRecords {
  return { career: defaultCareer(), history: [], bestScore: 0 }
}

export function readSave(): KeptRecords {
  const bin = storage()
  if (!bin) return emptyKept()
  try {
    const text = bin.getItem(STORAGE_KEY)
    if (!text) return emptyKept()
    const parsed = JSON.parse(text) as Partial<SaveBlob>
    // 旧版（v1）是单人记录：双人轮换后旧记录无法表达“一场两人”，整体弃用。
    if (parsed.version !== 2) return emptyKept()
    const history = Array.isArray(parsed.history) ? parsed.history.map(parseEntry).filter((item) => item !== null) : []
    return {
      career: parseCareer(parsed.career),
      history,
      bestScore: typeof parsed.bestScore === 'number' && parsed.bestScore > 0 ? parsed.bestScore : 0,
    }
  } catch {
    return emptyKept()
  }
}

function playerRecord(doc: PinballDocument, index: 0 | 1): PlayerRecord {
  const player = doc.players[index]
  return {
    id: player.id,
    name: player.name,
    score: player.score,
    ballsLeft: player.ballsLeft,
    bonusEntries: player.live.bonusEntries,
    bankClears: player.live.bankClears,
    tilted: player.live.tilted,
  }
}

export function persist(doc: PinballDocument): void {
  const bin = storage()
  if (!bin) return
  const total = matchScore(doc)
  const blob: SaveBlob = {
    version: 2,
    bestScore: Math.max(doc.bestScore, total),
    career: doc.career,
    history: doc.history,
  }
  try {
    bin.setItem(STORAGE_KEY, JSON.stringify(blob))
  } catch {
    if (!doc.run.storageWarned) {
      doc.run.storageWarned = true
      flashNote(doc, '这台浏览器没能写下记录')
    }
  }
}

export function commitSession(doc: PinballDocument, abandoned: boolean): void {
  if (!doc.run.launched || doc.run.committed) return
  const total = matchScore(doc)
  const tilted = doc.players.some((player) => player.live.tilted)
  const bonusEntries = doc.players.reduce((sum, player) => sum + player.live.bonusEntries, 0)
  const bankClears = doc.players.reduce((sum, player) => sum + player.live.bankClears, 0)
  const clean = !abandoned && doc.phase === 'gameover' && !tilted
  if (clean) doc.career.cleanFinish = true
  if (total > doc.bestScore) doc.bestScore = total
  doc.history.unshift({
    id: makeId(),
    endedAt: Date.now(),
    score: total,
    playMs: doc.run.playMs,
    abandoned,
    tilted,
    bonusEntries,
    bankClears,
    cleanFinish: clean,
    players: [playerRecord(doc, 0), playerRecord(doc, 1)],
  })
  if (doc.history.length > 20) doc.history.length = 20
  doc.run.committed = true
  doc.run.storedScore = total
  persist(doc)
}

export function syncRecords(doc: PinballDocument): void {
  const careerChanged = latchCareer(doc)
  const total = matchScore(doc)
  const scoreChanged = total !== doc.run.storedScore
  if (total > doc.bestScore) doc.bestScore = total
  if (!careerChanged && !scoreChanged) return
  doc.run.storedScore = total
  persist(doc)
}

export function formatPlay(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`
}
