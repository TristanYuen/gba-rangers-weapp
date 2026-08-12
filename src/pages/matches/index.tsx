import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import { MatchCard } from '@/components/MatchCard'
import { PageHero } from '@/components/PageHero'
import { SectionHeading } from '@/components/SectionHeading'
import { Segmented } from '@/components/Segmented'
import { TopNav } from '@/components/TopNav'
import { CloudSyncStatus } from '@/components/CloudSyncStatus'
import { appService } from '@/services'
import { useCloudPageRefresh } from '@/hooks/useCloudPageRefresh'

type Filter = 'signup' | 'history'

export default function MatchesPage() {
  const [filter, setFilter] = useState<Filter>('signup')
  const { syncError } = useCloudPageRefresh()
  useDidShow(() => {
    const page = Taro.getCurrentInstance().page as unknown as ({
      getTabBar?: () => { setData: (data: { selected: number }) => void }
    } | undefined)
    page?.getTabBar?.()?.setData({ selected: 0 })
  })
  const access = appService.getAccess()
  const matches = appService.listMatches().filter((match) => filter === 'signup'
    ? ['published', 'registration_closed'].includes(match.status) || (access.canManage && match.status === 'draft')
    : ['completed', 'completed_pending_score', 'cancelled'].includes(match.status))
  return (
    <View className='page'>
      <TopNav />
      <PageHero eyebrow='GBA RANGERS · 2026' title='比赛中心' brand>
        <Button className='button button--ghost button--small' onClick={() => Taro.navigateTo({ url: '/pages/leaderboard/index' })}>排行榜</Button>
        {access.canManage ? <Button className='button button--dark button--small' onClick={() => Taro.navigateTo({ url: '/pages/matches/edit' })}>创建赛事</Button> : null}
      </PageHero>
      <View className='content'>
        <CloudSyncStatus error={syncError} />
        <Segmented value={filter} onChange={setFilter} items={[{ label: '赛事报名', value: 'signup' }, { label: '历史比赛', value: 'history' }]} />
        <SectionHeading eyebrow={filter === 'signup' ? 'UPCOMING' : 'ARCHIVE'} title={filter === 'signup' ? '近期比赛' : '比赛记录'} />
        {access.memberStatus !== 'approved' && filter === 'signup'
          ? <View className='notice notice--warning'><Text className='notice__title'>球队成员专属</Text></View>
          : matches.length
            ? matches.map((match) => <MatchCard key={match.id} match={match} showResult={filter === 'history'} />)
            : <View className='notice center'>当前没有符合条件的比赛</View>}
      </View>
    </View>
  )
}
