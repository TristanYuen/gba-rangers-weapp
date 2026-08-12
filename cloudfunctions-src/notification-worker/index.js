const crypto = require('crypto')
const { db, command, now, ok, transactionValue, handleError } = require('./common')

const stableId = (prefix, value) =>
  `${prefix}_${crypto.createHash('sha256').update(value).digest('hex').slice(0, 40)}`

exports.main = async (event) => {
  try {
    const due = await db.collection('notification_jobs').where({
      eventName: 'pending_confirmation',
      status: command.in(['scheduled', 'pending']),
      runAt: command.lte(new Date())
    }).orderBy('runAt', 'asc').limit(100).get()
    let completed = 0
    let cancelled = 0

    for (const job of due.data) {
      const signupResult = await db.collection('signups').where({
        teamId: job.teamId,
        uniqueKey: job.signupKey
      }).limit(1).get()
      const signup = signupResult.data[0]
      if (!signup || signup.choice !== 'maybe') {
        await db.collection('notification_jobs').doc(job._id).update({
          data: { status: 'cancelled', updatedAt: now() }
        })
        cancelled += 1
        continue
      }
      const [matchResult, preferenceResult] = await Promise.all([
        db.collection('matches').doc(job.matchId).get(),
        db.collection('notification_preferences').where({
          teamId: job.teamId,
          playerId: signup.playerId
        }).limit(1).get()
      ])
      const match = matchResult.data
      const notificationEnabled = preferenceResult.data[0]?.enabled !== false
      const noticeId = stableId('pending_notice', job._id)
      const recipientId = stableId('notice_recipient', `${noticeId}:${signup.playerId}`)

      const changed = transactionValue(await db.runTransaction(async (transaction) => {
        const currentJob = (await transaction.collection('notification_jobs').doc(job._id).get()).data
        if (!currentJob || !['scheduled', 'pending'].includes(currentJob.status)) return false
        const currentSignup = (await transaction.collection('signups').doc(signup._id).get()).data
        if (!currentSignup || currentSignup.choice !== 'maybe') {
          await transaction.collection('notification_jobs').doc(job._id).update({
            data: { status: 'cancelled', updatedAt: now() }
          })
          return false
        }
        const notice = {
          teamId: job.teamId,
          type: 'pending_confirmation',
          title: '待定时间已到，请确认',
          content: `${match?.title || '赛事'}：请尽快选择参加或缺席。`,
          audience: 'individual',
          matchId: job.matchId,
          targetPlayerId: signup.playerId,
          createdBy: 'system',
          createdAt: now()
        }
        await transaction.collection('team_notices').doc(noticeId).set({ data: notice })
        await transaction.collection('notice_recipients').doc(recipientId).set({
          data: {
            teamId: job.teamId,
            noticeId,
            playerId: signup.playerId,
            title: notice.title,
            content: notice.content,
            type: notice.type,
            deliveryStatus: notificationEnabled ? 'pending' : 'unavailable',
            createdAt: now()
          }
        })
        await transaction.collection('signups').doc(signup._id).update({
          data: { reminderStatus: 'sent', reminderSentAt: now(), updatedAt: now() }
        })
        await transaction.collection('notification_jobs').doc(job._id).update({
          data: { status: 'completed', noticeId, updatedAt: now() }
        })
        return true
      }))
      if (changed) completed += 1
      else cancelled += 1
    }

    return ok(event, { scanned: due.data.length, completed, cancelled })
  } catch (error) {
    return handleError(event, error)
  }
}
