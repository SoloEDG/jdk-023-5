import { BALL_RADIUS } from '@/shared/ids'

export type Phase = 'ready' | 'playing' | 'paused' | 'gameover'

export type HoldKind = 'none' | 'plunger' | 'hole' | 'ramp' | 'scoop'

export type PlayerId = 0 | 1

export type MechanismKind =
  | 'bumper'
  | 'sling'
  | 'drop'
  | 'spinner'
  | 'gate'
  | 'hole'
  | 'lane'
  | 'ramp'
  | 'scoop'

export interface BallState {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  held: HoldKind
  holdMs: number
  rideMs: number
  rideDur: number
  idleMs: number
}

export interface FlipperState {
  angle: number
  omega: number
  held: boolean
}

export interface PlungerState {
  power: number
  charging: boolean
}

export interface NudgeState {
  warnings: number
  tilted: boolean
  flashMs: number
  flashDir: -1 | 0 | 1
}

export interface MechanismState {
  id: string
  kind: MechanismKind
  label: string
  cooldownMs: number
  lamp: number
  up: boolean
  openMs: number
  lit: boolean
  spin: number
  spinOmega: number
}

export interface ChainState {
  count: number
  lastZone: string | null
  remainMs: number
  bonusMs: number
  multiplier: number
}

/** 落靶整组的台面进度，属于整台机器、不随换人重置。 */
export interface BankState {
  pending: boolean
  resetMs: number
  /** 触发整组击落的玩家，重置结算时把清空记在他名下；换人不改变归属。 */
  ownerId: PlayerId | null
}

/** 只归属于某一位玩家的单局目标，旁观时不计入另一位。 */
export interface PlayerLiveGoals {
  bonusEntries: number
  bankClears: number
  tilted: boolean
}

export interface PlayerState {
  id: PlayerId
  name: string
  score: number
  ballsLeft: number
  chain: ChainState
  nudge: NudgeState
  live: PlayerLiveGoals
}

export interface CareerState {
  score10k: boolean
  bonusOnce: boolean
  bankTwice: boolean
  cleanFinish: boolean
}

export interface PlayerRecord {
  id: PlayerId
  name: string
  score: number
  ballsLeft: number
  bonusEntries: number
  bankClears: number
  tilted: boolean
}

/** 一场两人共用一条记录，而不是各记一条单人成绩。 */
export interface HistoryEntry {
  id: string
  endedAt: number
  score: number
  playMs: number
  abandoned: boolean
  tilted: boolean
  bonusEntries: number
  bankClears: number
  cleanFinish: boolean
  players: [PlayerRecord, PlayerRecord]
}

export interface FeedItem {
  uid: number
  text: string
  points: number
}

export interface NoteState {
  text: string
  ms: number
}

export interface RunMeta {
  launched: boolean
  committed: boolean
  playMs: number
  turnCount: number
  storedScore: number
  storageWarned: boolean
}

export interface PinballDocument {
  phase: Phase
  phaseBeforePause: Phase | null
  activePlayer: PlayerId
  bestScore: number
  ball: BallState
  flippers: { left: FlipperState; right: FlipperState }
  plunger: PlungerState
  players: [PlayerState, PlayerState]
  mechanisms: MechanismState[]
  gates: { rampOpen: boolean }
  bank: BankState
  career: CareerState
  history: HistoryEntry[]
  feed: FeedItem[]
  feedSeq: number
  note: NoteState
  run: RunMeta
  signals: { drain: boolean }
}

export const PLAYER_NAMES = ['玩家一', '玩家二'] as const
export const BALLS_PER_PLAYER = 3
export const PLAYER_COUNT = 2

export function defaultCareer(): CareerState {
  return { score10k: false, bonusOnce: false, bankTwice: false, cleanFinish: false }
}

function blankChain(): ChainState {
  return { count: 0, lastZone: null, remainMs: 0, bonusMs: 0, multiplier: 1 }
}

function blankNudge(): NudgeState {
  return { warnings: 0, tilted: false, flashMs: 0, flashDir: 0 }
}

export function createPlayer(id: PlayerId): PlayerState {
  return {
    id,
    name: PLAYER_NAMES[id],
    score: 0,
    ballsLeft: BALLS_PER_PLAYER,
    chain: blankChain(),
    nudge: blankNudge(),
    live: { bonusEntries: 0, bankClears: 0, tilted: false },
  }
}

export function createDocument(): PinballDocument {
  return {
    phase: 'ready',
    phaseBeforePause: null,
    activePlayer: 0,
    bestScore: 0,
    ball: {
      x: 372,
      y: 640,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      held: 'plunger',
      holdMs: 0,
      rideMs: 0,
      rideDur: 1,
      idleMs: 0,
    },
    flippers: {
      left: { angle: 0.62, omega: 0, held: false },
      right: { angle: Math.PI - 0.62, omega: 0, held: false },
    },
    plunger: { power: 0, charging: false },
    players: [createPlayer(0), createPlayer(1)],
    mechanisms: [],
    gates: { rampOpen: false },
    bank: { pending: false, resetMs: 0, ownerId: null },
    career: defaultCareer(),
    history: [],
    feed: [],
    feedSeq: 0,
    note: { text: '', ms: 0 },
    run: { launched: false, committed: false, playMs: 0, turnCount: 0, storedScore: 0, storageWarned: false },
    signals: { drain: false },
  }
}

/** 正在击球的玩家：倍率、连锁与倾斜都挂在他名下。 */
export function activePlayer(doc: PinballDocument): PlayerState {
  return doc.players[doc.activePlayer]
}

export function otherPlayer(doc: PinballDocument): PlayerState {
  return doc.players[doc.activePlayer === 0 ? 1 : 0]
}

/** 一场两人的总得分。 */
export function matchScore(doc: PinballDocument): number {
  return doc.players[0].score + doc.players[1].score
}

export function ballsRemaining(doc: PinballDocument): number {
  return doc.players.reduce((total, player) => total + player.ballsLeft, 0)
}

export function flashNote(doc: PinballDocument, text: string, ms = 1700): void {
  doc.note.text = text
  doc.note.ms = ms
}

export function findMechanism(doc: PinballDocument, id: string): MechanismState | undefined {
  return doc.mechanisms.find((item) => item.id === id)
}
