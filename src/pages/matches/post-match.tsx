import { useMemo, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Button, Input, Switch } from '@tarojs/components'
import { PageHero } from '@/components/PageHero'
import type { MatchStatInput } from '@/domain/types'
import { appService } from '@/services'

export default function PostMatchPage() {
  const { params } = useRouter()
  const id = params.id || 'm-history-14'
  const access = appService.getAccess()
  const match = appService.getMatch(id)
  const players = appService.listPlayers(true)
  const initial = useMemo(() => players.map((player, index): MatchStatInput => ({ playerId: player.id, played: index < 7, goals: 0, assists: 0 })), [players])
  const [rows, setRows] = useState(initial)
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const update = (playerId: string, patch: Partial<MatchStatInput>) => setRows((current) => current.map((row) => row.playerId === playerId ? { ...row, ...patch } : row))
  const submit = async () => {
    try {
      const score = homeScore === '' && awayScore === '' ? { home: null, away: null } : { home: Number(homeScore), away: Number(awayScore) }
      await appService.publishStats(id, rows, score)
      Taro.showToast({ title: '赛后数据已发布', icon: 'success' })
    } catch (error) { Taro.showToast({ title: error instanceof Error ? error.message : '发布失败', icon: 'none', duration: 2500 }) }
  }
  if (!access.canManage) return <View className='page content'><View className='notice notice--danger'>只有管理员可以录入赛后数据。</View></View>
  const totals = rows.reduce((value, row) => ({ apps: value.apps + (row.played ? 1 : 0), goals: value.goals + row.goals, assists: value.assists + row.assists }), { apps: 0, goals: 0, assists: 0 })
  return (
    <View className='page'>
      <PageHero eyebrow='POST MATCH' title='赛后数据' subtitle={match.title} midnight />
      <View className='content stack'>
        <View className={`notice ${totals.assists > totals.goals ? 'notice--danger' : ''}`}><Text className='notice__title'>{totals.apps} 人出场 · {totals.goals} 球 · {totals.assists} 助攻{totals.assists > totals.goals ? ' · 数据异常' : ''}</Text></View>
        <View className='card form-card'>
          <Text className='section-heading__title'>比分（选填）</Text><View className='grid-2' style={{ marginTop: '18px' }}><Input className='field__input' type='number' value={homeScore} placeholder='本队' onInput={(e) => setHomeScore(e.detail.value)} /><Input className='field__input' type='number' value={awayScore} placeholder='对手' onInput={(e) => setAwayScore(e.detail.value)} /></View>
        </View>
        <View className='card card__body'>
          {rows.map((row) => {
            const player = players.find((item) => item.id === row.playerId)!
            return <View className='list-row' key={row.playerId}>
              <Switch checked={row.played} color='#123BB4' onChange={(e) => update(row.playerId, { played: e.detail.value, goals: e.detail.value ? row.goals : 0, assists: e.detail.value ? row.assists : 0 })} />
              <View className='list-row__main'><Text className='list-row__title'>{player.displayName}</Text><Text className='list-row__meta'>{row.played ? '实际出场' : '未出场'}</Text></View>
              <Input className='field__input' style={{ width: '88px', minHeight: '62px' }} disabled={!row.played} type='number' value={`${row.goals}`} onInput={(e) => update(row.playerId, { goals: Number(e.detail.value) || 0 })} />
              <Input className='field__input' style={{ width: '88px', minHeight: '62px' }} disabled={!row.played} type='number' value={`${row.assists}`} onInput={(e) => update(row.playerId, { assists: Number(e.detail.value) || 0 })} />
            </View>
          })}
        </View>
        <Button className='button button--primary' disabled={totals.assists > totals.goals} onClick={submit}>发布并重算统计</Button>
      </View>
    </View>
  )
}
