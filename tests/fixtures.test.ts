import { describe, expect, it } from 'vitest'
import { fixtureFeeAssignments, fixturePlayers } from '@/data/fixtures'

describe('2026-08-01 人员与会费数据', () => {
  const activePlayers = fixturePlayers.filter((player) => player.status === 'active')
  const alumni = fixturePlayers.filter((player) => player.status === 'alumni')

  it('包含表格中的 50 名现役成员', () => {
    expect(activePlayers).toHaveLength(50)
    expect(new Set(activePlayers.map((player) => player.displayName)).size).toBe(50)
  })

  it('历史成员仅保留 7 号卢华杰', () => {
    expect(alumni.map((player) => ({
      displayName: player.displayName,
      shirtNumber: player.shirtNumber,
      legacySpecialAmount: player.legacySpecialAmount,
      legacyAmount: player.legacyAmount
    }))).toEqual([{ displayName: '卢华杰', shirtNumber: 7, legacySpecialAmount: 37263, legacyAmount: 197042.15 }])
  })

  it('每名现役成员都有会费档案', () => {
    const assignedIds = new Set(fixtureFeeAssignments.map((assignment) => assignment.playerId))
    expect(activePlayers.every((player) => assignedIds.has(player.id))).toBe(true)
  })

  it('号码、位置和入队年份按最新名单固定', () => {
    expect(activePlayers.find((player) => player.displayName === '袁梓皓')).toMatchObject({ shirtNumber: 5, position: '后卫', joinYear: 2023 })
    expect(activePlayers.find((player) => player.displayName === '黎响')).toMatchObject({ shirtNumber: 56, position: '前锋', joinYear: 2020 })
    expect(activePlayers.filter((player) => player.position === '未分类').map((player) => player.displayName)).toEqual([
      '马君豪', '尹智', '何泽锋', '王基权', '陈智民', '陈昊翔'
    ])
  })

  it('四名新成员在 2026 年 9 月前暂免并于 10 月恢复在莞档次', () => {
    const temporarilyExempt = fixtureFeeAssignments.filter((assignment) =>
      assignment.feePlanId === 'temporary_exempt' &&
      assignment.effectiveTo === '2026-09'
    )
    expect(temporarilyExempt).toHaveLength(4)
    for (const assignment of temporarilyExempt) {
      expect(fixtureFeeAssignments).toContainEqual(expect.objectContaining({
        playerId: assignment.playerId,
        feePlanId: 'dongguan',
        effectiveFrom: '2026-10'
      }))
    }
  })
})
