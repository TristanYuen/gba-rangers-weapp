const { db, command, now, ok, requireManager, requireSameTeam, audit, handleError } = require('./common')

const rebuildAggregates = async (actor) => {
  const [stats, players] = await Promise.all([
    db.collection('player_match_stats').aggregate()
      .match({ teamId: actor.teamId, countInStats: true })
      .group({
        _id: '$playerId',
        goals: command.aggregate.sum('$goals'),
        assists: command.aggregate.sum('$assists'),
        apps: command.aggregate.sum(1)
      })
      .end(),
    db.collection('players').where({ teamId: actor.teamId, deletedAt: command.exists(false) }).limit(200).get()
  ])
  const statsByPlayer = new Map(stats.list.map((row) => [row._id, row]))
  await Promise.all(players.data.map((player) => {
    const aggregate = statsByPlayer.get(player._id)
    return db.collection('players').doc(player._id).update({
      data: {
        stats: {
          apps: aggregate?.apps || 0,
          goals: aggregate?.goals || 0,
          assists: aggregate?.assists || 0
        },
        updatedAt: now()
      }
    })
  }))
  return { updatedPlayers: players.data.length }
}

exports.main = async (event) => {
  try {
    const payload = event.payload || {}
    const actor = await requireManager()
    if (event.action === 'publishMatchStats') {
      const rows = payload.rows
      if (!Array.isArray(rows) || rows.length > 200 || rows.some((row) => !row || typeof row.playerId !== 'string' || typeof row.played !== 'boolean')) {
        throw Object.assign(new Error('赛后球员数据无效'), { code: 'INVALID_STAT_ROWS' })
      }
      const goals = rows.reduce((sum, row) => sum + Number(row.goals || 0), 0)
      const assists = rows.reduce((sum, row) => sum + Number(row.assists || 0), 0)
      if (rows.some((row) => !Number.isInteger(row.goals) || !Number.isInteger(row.assists) || row.goals < 0 || row.assists < 0)) throw Object.assign(new Error('进球和助攻必须是非负整数'), { code: 'INVALID_STAT' })
      if (rows.some((row) => !row.played && (row.goals > 0 || row.assists > 0))) throw Object.assign(new Error('未出场球员不能录入 G／A'), { code: 'STAT_WITHOUT_APPEARANCE' })
      if (new Set(rows.map((row) => row.playerId)).size !== rows.length) throw Object.assign(new Error('球员数据重复'), { code: 'DUPLICATE_PLAYER_STAT' })
      if (assists > goals) throw Object.assign(new Error('助攻总数不能高于球队进球总数'), { code: 'ASSISTS_EXCEED_GOALS' })
      if ((payload.homeScore === null) !== (payload.awayScore === null)) throw Object.assign(new Error('两个比分必须同时填写或同时留空'), { code: 'PARTIAL_SCORE' })
      if ([payload.homeScore, payload.awayScore].some((score) => score !== null && (!Number.isInteger(score) || score < 0))) throw Object.assign(new Error('比分必须是非负整数或留空'), { code: 'INVALID_SCORE' })
      const before = (await db.collection('matches').doc(payload.matchId).get()).data
      if (!before) throw Object.assign(new Error('赛事不存在'), { code: 'MATCH_NOT_FOUND' })
      requireSameTeam(actor, before.teamId)
      if (payload.expectedVersion !== before.version) throw Object.assign(new Error('数据已被其他管理员更新，请刷新'), { code: 'VERSION_CONFLICT' })
      const statPlayers = await Promise.all(rows.map((row) => db.collection('players').doc(row.playerId).get()))
      if (statPlayers.some((result) => !result.data || result.data.teamId !== actor.teamId || result.data.deletedAt)) {
        throw Object.assign(new Error('赛后数据包含无效球员'), { code: 'PLAYER_NOT_FOUND' })
      }
      const existingStats = await db.collection('player_match_stats').where({ teamId: actor.teamId, matchId: payload.matchId }).limit(1000).get()
      const submittedIds = new Set(rows.map((row) => row.playerId))
      await db.runTransaction(async (transaction) => {
        for (const existing of existingStats.data.filter((row) => !submittedIds.has(row.playerId))) {
          await transaction.collection('player_match_stats').doc(existing.uniqueKey).remove().catch(() => undefined)
        }
        for (const row of rows) {
          const uniqueKey = `${payload.matchId}:${row.playerId}`
          const statRef = transaction.collection('player_match_stats').doc(uniqueKey)
          if (row.played) {
            await statRef.set({ data: { uniqueKey, teamId: actor.teamId, matchId: payload.matchId, matchDate: before.matchDate, playerId: row.playerId, goals: row.goals, assists: row.assists, countInStats: before.countInStats !== false, updatedAt: now() } })
          } else {
            await statRef.remove().catch(() => undefined)
          }
        }
        await transaction.collection('matches').doc(payload.matchId).update({ data: { homeScore: payload.homeScore, awayScore: payload.awayScore, status: payload.homeScore === null ? 'completed_pending_score' : 'completed', apps: rows.filter((row) => row.played).length, goals, assists, updatedAt: now(), version: command.inc(1) } })
      })
      const existingByPlayer = new Map(existingStats.data.map((row) => [row.playerId, row]))
      const appearanceUpdates = rows.map((row) => {
        const uniqueKey = `${payload.matchId}:${row.playerId}`
        return row.played
          ? db.collection('appearances').doc(uniqueKey).set({ data: { uniqueKey, teamId: actor.teamId, matchId: payload.matchId, playerId: row.playerId, updatedAt: now() } })
          : existingByPlayer.has(row.playerId)
            ? db.collection('appearances').doc(uniqueKey).remove().catch(() => undefined)
            : Promise.resolve()
      })
      for (const existing of existingStats.data.filter((row) => !submittedIds.has(row.playerId))) {
        appearanceUpdates.push(db.collection('appearances').doc(existing.uniqueKey).remove().catch(() => undefined))
      }
      await Promise.all(appearanceUpdates)
      const yearbookExisting = await db.collection('yearbook_entries').where({ teamId: actor.teamId, matchId: payload.matchId, deletedAt: command.exists(false) }).limit(1).get()
      const yearbookRecord = { teamId: actor.teamId, year: Number(before.matchDate.slice(0, 4)), type: before.eventType === 'event' ? 'team_activity' : 'match', matchId: payload.matchId, title: before.title, date: before.matchDate, summary: `${rows.filter((row) => row.played).length} 人出场 · ${goals} 球 · ${assists} 助攻`, public: yearbookExisting.data[0]?.public ?? true, featured: yearbookExisting.data[0]?.featured ?? false, updatedAt: now() }
      if (yearbookExisting.data[0]) await db.collection('yearbook_entries').doc(yearbookExisting.data[0]._id).update({ data: yearbookRecord })
      else await db.collection('yearbook_entries').add({ data: { ...yearbookRecord, createdAt: now() } })
      await rebuildAggregates(actor)
      await audit({ actor, action: 'publishMatchStats', entityType: 'match', entityId: payload.matchId, before, after: { goals, assists, apps: rows.filter((row) => row.played).length }, requestId: event.requestId })
      return ok(event, { matchId: payload.matchId, goals, assists, apps: rows.filter((row) => row.played).length })
    }
    if (event.action === 'recalculateAggregates') {
      return ok(event, await rebuildAggregates(actor))
    }
    throw Object.assign(new Error('未知统计操作'), { code: 'UNKNOWN_ACTION' })
  } catch (error) { return handleError(event, error) }
}
