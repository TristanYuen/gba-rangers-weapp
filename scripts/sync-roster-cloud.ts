import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fixtureFeeAssignments, fixturePlayers } from '../src/data/fixtures'

type JsonRecord = Record<string, unknown>

const args = new Set(process.argv.slice(2))
const commit = args.has('--commit')
const envId = 'cloud1-d4g1nl8yx26d1f3f2'
const teamId = '698a4c596a69ed84010a7c2e27709c78'
const cli = process.env.GBA_CLOUDBASE_CLI || 'D:/cbcli/node_modules/@cloudbase/cli/bin/cloudbase'
const backupDir = path.resolve('.codex_tmp/backups')
const planPath = path.resolve('.codex_tmp/roster-sync-plan.json')
const now = new Date().toISOString()
const writeBatchSize = 10

const hash = (value: string, length = 32) => crypto.createHash('sha256').update(value).digest('hex').slice(0, length)
const cloudDate = (value: string) => ({ $date: { $numberLong: String(Date.parse(value)) } })
const numericValue = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const raw = record.$numberInt ?? record.$numberLong ?? record.$numberDouble
    if (raw !== undefined && Number.isFinite(Number(raw))) return Number(raw)
  }
  return undefined
}
const parseCliJson = (value: string): JsonRecord => {
  const start = value.indexOf('{')
  const end = value.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error(`CloudBase CLI 未返回 JSON：${value.slice(0, 300)}`)
  return JSON.parse(value.slice(start, end + 1)) as JsonRecord
}
const execute = (commands: JsonRecord[]): JsonRecord => {
  const result = spawnSync(process.execPath, [
    cli,
    'db',
    'nosql',
    'execute',
    '-e',
    envId,
    '--command',
    JSON.stringify(commands),
    '--json'
  ], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
  if (result.status !== 0) {
    throw new Error(JSON.stringify({
      status: result.status,
      signal: result.signal,
      spawnError: result.error?.message,
      stdout: result.stdout,
      stderr: result.stderr
    }, null, 2))
  }
  return parseCliJson(result.stdout)
}
const query = (collection: string, filter: JsonRecord = {}, limit = 1000): JsonRecord[] => {
  const response = execute([{
    TableName: collection,
    CommandType: 'QUERY',
    Command: JSON.stringify({ find: collection, filter, limit })
  }])
  const results = (response.data as { results?: JsonRecord[][] } | undefined)?.results
  return results?.[0] ?? []
}
const updateCommand = (collection: string, updates: JsonRecord[]) => ({
  TableName: collection,
  CommandType: 'UPDATE',
  Command: JSON.stringify({ update: collection, updates })
})
const insertCommand = (collection: string, documents: JsonRecord[]) => ({
  TableName: collection,
  CommandType: 'INSERT',
  Command: JSON.stringify({ insert: collection, documents })
})
const chunks = <T>(values: T[], size: number): T[][] => {
  const result: T[][] = []
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size))
  return result
}

const main = async () => {
  const [cloudPlayers, cloudFees] = [query('players'), query('player_fee_assignments')]
  await fs.mkdir(backupDir, { recursive: true })
  const backupStamp = now.replace(/[:.]/g, '-')
  const backupPath = path.join(backupDir, `roster-before-${backupStamp}.json`)
  await fs.writeFile(backupPath, `${JSON.stringify({ envId, teamId, capturedAt: now, players: cloudPlayers, feeAssignments: cloudFees }, null, 2)}\n`, 'utf8')

  const aliases = new Map<string, string>([['杨承炫', '杨承铉']])
  const formalCloudPlayers = cloudPlayers.filter((record) => record.teamId === teamId && record.memberType === 'formal')
  const findCloudPlayer = (displayName: string) => formalCloudPlayers.find((record) =>
    record.displayName === displayName || record.sourceName === displayName || record.displayName === aliases.get(displayName) || record.sourceName === aliases.get(displayName)
  )
  const playerUpdates: JsonRecord[] = []
  const playerInserts: JsonRecord[] = []
  const playerIdByFixtureId = new Map<string, string>()
  const playerDiffs: JsonRecord[] = []

  for (const player of fixturePlayers) {
    const historicalChairman = player.id === 'p-alumni-lu-huajie'
    const existing = historicalChairman
      ? cloudPlayers.find((record) => record._id === player.id || record.displayName === player.displayName)
      : findCloudPlayer(player.displayName)
    const id = String(existing?._id || (historicalChairman ? player.id : `player_${hash(`${teamId}:${player.displayName}`)}`))
    playerIdByFixtureId.set(player.id, id)
    const desired = {
      displayName: player.displayName,
      sourceName: player.displayName,
      memberType: 'formal',
      status: player.status,
      position: player.position || '未分类',
      joinYear: player.joinYear,
      publicAuthorized: true,
      showAvatar: true,
      showPhotos: true,
      ...(player.shirtNumber !== undefined ? { shirtNumber: player.shirtNumber } : {}),
      ...(player.leaveYear !== undefined ? { leaveYear: player.leaveYear } : {}),
      ...(player.legacySpecialAmount !== undefined ? { legacySpecialAmount: player.legacySpecialAmount } : {}),
      ...(player.legacyAmount !== undefined ? { legacyAmount: player.legacyAmount } : {})
    }
    if (existing) {
      const unset: JsonRecord = {}
      if (player.shirtNumber === undefined && existing.shirtNumber !== undefined) unset.shirtNumber = ''
      const set = { ...desired, updatedAt: cloudDate(now), rosterSource: '2026-08-01-excel' }
      playerUpdates.push({ q: { _id: id }, u: { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, multi: false, upsert: false })
      playerDiffs.push({ id, displayName: player.displayName, mode: 'update', before: { shirtNumber: numericValue(existing.shirtNumber), position: existing.position, joinYear: numericValue(existing.joinYear) }, after: desired })
    } else {
      const record = {
        _id: id,
        teamId,
        sourceKey: historicalChairman ? 'honorary:lu-huajie' : `roster:${player.displayName}`,
        ...desired,
        stats: player.stats,
        seasonStats: player.seasonStats,
        version: 1,
        rosterSource: '2026-08-01-excel',
        createdAt: cloudDate(now),
        updatedAt: cloudDate(now)
      }
      playerInserts.push(record)
      playerDiffs.push({ id, displayName: player.displayName, mode: 'insert', after: desired })
    }
  }

  const fixtureNameById = new Map(fixturePlayers.map((player) => [player.id, player.displayName]))
  const feeUpdates: JsonRecord[] = []
  const feeInserts: JsonRecord[] = []
  for (const assignment of fixtureFeeAssignments) {
    const playerId = playerIdByFixtureId.get(assignment.playerId)
    if (!playerId) throw new Error(`找不到会费记录对应球员：${fixtureNameById.get(assignment.playerId) || assignment.playerId}`)
    const existing = cloudFees.find((record) => record.playerId === playerId && record.effectiveFrom === assignment.effectiveFrom)
    const desired = {
      teamId,
      playerId,
      feePlanId: assignment.feePlanId,
      effectiveFrom: assignment.effectiveFrom,
      effectiveTo: assignment.effectiveTo || null,
      paymentMethod: assignment.paymentMethod || null,
      reason: assignment.reason.includes('2026-07-26') ? '依据 2026-08-01 人员名单录入' : assignment.reason,
      adjustedBy: '2026-08-01 名单同步',
      updatedAt: cloudDate(now)
    }
    if (existing) {
      feeUpdates.push({ q: { _id: existing._id }, u: { $set: desired }, multi: false, upsert: false })
    } else {
      feeInserts.push({
        _id: `fee_assignment_${hash(`${playerId}:${assignment.effectiveFrom}:${assignment.feePlanId}`)}`,
        ...desired,
        createdAt: cloudDate(assignment.createdAt)
      })
    }
  }

  const activeNumbers = fixturePlayers.filter((player) => player.status === 'active' && player.shirtNumber !== undefined).map((player) => player.shirtNumber)
  const duplicates = activeNumbers.filter((number, index) => activeNumbers.indexOf(number) !== index)
  if (duplicates.length) throw new Error(`现役号码重复：${[...new Set(duplicates)].join('、')}`)
  if (fixturePlayers.filter((player) => player.status === 'active').length !== 50) throw new Error('权威现役名单数量应为 50 人')

  const plan = {
    envId,
    teamId,
    generatedAt: now,
    source: '8.1名单（已更新年份）(1).xlsx',
    backupPath,
    summary: {
      activeRoster: fixturePlayers.filter((player) => player.status === 'active').length,
      historicalPlayers: fixturePlayers.filter((player) => player.status === 'alumni').length,
      playerUpdates: playerUpdates.length,
      playerInserts: playerInserts.length,
      feeUpdates: feeUpdates.length,
      feeInserts: feeInserts.length
    },
    playerDiffs
  }
  await fs.writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8')

  if (commit) {
    for (const batch of chunks(playerUpdates, writeBatchSize)) execute([updateCommand('players', batch)])
    for (const batch of chunks(playerInserts, writeBatchSize)) execute([insertCommand('players', batch)])
    for (const batch of chunks(feeUpdates, writeBatchSize)) execute([updateCommand('player_fee_assignments', batch)])
    for (const batch of chunks(feeInserts, writeBatchSize)) execute([insertCommand('player_fee_assignments', batch)])
  }
  console.log(JSON.stringify({ mode: commit ? 'commit' : 'dry-run', ...plan.summary, backupPath, planPath }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
