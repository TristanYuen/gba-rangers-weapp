const { db, command, ok, requireApproved, publicMatch, handleError } = require('./common')

exports.main = async (event) => {
  try {
    const payload = event.payload || {}
    const actor = await requireApproved()
    switch (event.action) {
      case 'getPublicHome': {
        const [matches, players, yearbook] = await Promise.all([
          db.collection('matches').where({ teamId: actor.teamId, deletedAt: command.exists(false), status: command.in(['published', 'registration_closed', 'completed', 'completed_pending_score']) }).orderBy('matchDate', 'desc').limit(20).get(),
          db.collection('players').where({ teamId: actor.teamId, deletedAt: command.exists(false), memberType: 'formal' }).orderBy('stats.apps', 'desc').limit(6).get(),
          db.collection('yearbook_entries').where({ teamId: actor.teamId, deletedAt: command.exists(false), featured: true }).orderBy('date', 'desc').limit(6).get()
        ])
        return ok(event, { matches: matches.data.map(publicMatch), featuredPlayers: players.data, featuredYearbook: yearbook.data })
      }
      case 'listMatches': {
        const result = await db.collection('matches').where({ teamId: actor.teamId, deletedAt: command.exists(false), status: command.neq('draft') }).orderBy('matchDate', 'desc').limit(100).get()
        return ok(event, result.data.map(publicMatch))
      }
      case 'getMatch': {
        const result = await db.collection('matches').doc(payload.id).get()
        if (!result.data || result.data.teamId !== actor.teamId || result.data.status === 'draft' || result.data.deletedAt) return { ok: false, error: { code: 'MATCH_NOT_FOUND', message: '赛事不存在' }, requestId: event.requestId }
        return ok(event, publicMatch(result.data))
      }
      case 'listPlayers': {
        const result = await db.collection('players').where({ teamId: actor.teamId, deletedAt: command.exists(false), memberType: 'formal' }).orderBy('stats.apps', 'desc').limit(100).get()
        return ok(event, result.data)
      }
      case 'getPlayerProfile': {
        const result = await db.collection('players').doc(payload.id).get()
        if (!result.data || result.data.teamId !== actor.teamId || result.data.deletedAt) throw Object.assign(new Error('球员不存在'), { code: 'PLAYER_NOT_FOUND' })
        return ok(event, result.data)
      }
      case 'getYearbook': {
        const result = await db.collection('yearbook_entries').where({ teamId: actor.teamId, year: payload.year || 2026, deletedAt: command.exists(false) }).orderBy('date', 'desc').limit(100).get()
        return ok(event, result.data)
      }
      case 'getLeaderboard': {
        const field = ['apps', 'goals', 'assists'].includes(payload.metric) ? payload.metric : 'apps'
        const condition = { teamId: actor.teamId, deletedAt: command.exists(false), ...(payload.includeAll ? {} : { memberType: 'formal' }) }
        const result = await db.collection('players').where(condition).orderBy(`stats.${field}`, 'desc').orderBy('stats.apps', field === 'apps' ? 'desc' : 'asc').limit(100).get()
        return ok(event, result.data)
      }
      default: throw Object.assign(new Error('未知公开查询'), { code: 'UNKNOWN_ACTION' })
    }
  } catch (error) { return handleError(event, error) }
}
