import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Button, Map } from '@tarojs/components'
import { PageHero } from '@/components/PageHero'
import { StatStrip } from '@/components/StatStrip'
import { matchStatusLabel, scoreLabel } from '@/domain/rules'
import type { MatchInternal } from '@/domain/types'
import { appService } from '@/services'
import { matchDateLabel } from '@/utils/date'
import { CloudSyncStatus } from '@/components/CloudSyncStatus'
import { useCloudPageRefresh } from '@/hooks/useCloudPageRefresh'

const formatLabel = {
  '5-a-side': '5 人制',
  '7-a-side': '7 人制',
  '8-a-side': '8 人制',
  '11-a-side': '11 人制',
  custom: '其他赛制'
}
const jerseyLabel = {
  home: '主场球衣',
  away: '客场球衣',
  custom: '自定义'
}

export default function MatchDetailPage() {
  const { syncError } = useCloudPageRefresh()
  const { params } = useRouter()
  const id = params.id || 'm-next'
  const match = appService.getMatch(id)
  const access = appService.getAccess()
  const internal = 'gatheringTime' in match ? match as MatchInternal : null
  const isHistory = ['completed', 'completed_pending_score', 'cancelled'].includes(match.status)
  const isPendingScore = match.status === 'completed_pending_score'
  const dateLabel = matchDateLabel(match.matchDate)
  const hasMapLocation = match.latitude !== undefined && match.longitude !== undefined
  const openMap = () => {
    if (match.latitude !== undefined && match.longitude !== undefined) {
      Taro.openLocation({
        latitude: match.latitude,
        longitude: match.longitude,
        name: match.exactLocation,
        address: match.publicArea
      })
      return
    }
    Taro.showToast({ title: '该赛事暂未保存地图坐标', icon: 'none' })
  }

  return (
    <View className='page'>
      <PageHero
        eyebrow={matchStatusLabel(match.status)}
        title={match.title}
        subtitle={`${dateLabel}${match.kickoffTime ? ` · ${match.kickoffTime}` : ''}\n${match.exactLocation || match.publicArea || '地点待定'} · ${formatLabel[match.format]}`}
        midnight
      >
        {match.status === 'published' && access.memberStatus === 'approved'
          ? <Button className='button button--primary button--small' onClick={() => Taro.navigateTo({ url: `/pages/matches/signup?id=${id}` })}>进入报名</Button>
          : null}
        {access.canManage
          ? <Button className='button button--ghost button--small' onClick={() => Taro.navigateTo({ url: `/pages/matches/edit?id=${id}` })}>管理赛事</Button>
          : null}
      </PageHero>

      <View className='content stack'>
        <CloudSyncStatus error={syncError} />
        {isHistory ? <View className='card card__body match-result-card'>
          <Text className='section-heading__eyebrow'>RESULT</Text>
          <Text className='match-result'>{scoreLabel(match)}</Text>
          {!isPendingScore && match.apps !== undefined ? <View className='match-result-stats'><StatStrip stats={{ apps: match.apps || 0, goals: match.goals || 0, assists: match.assists || 0 }} /></View> : null}
        </View> : <View className='card match-summary'>
          <View className='match-summary__main'>
            <Text className='section-heading__eyebrow'>REGISTRATION</Text>
            <Text className='match-summary__title'>{match.registrationCount || 0} 人已参加</Text>
            <Text className='match-summary__meta'>{match.capacityEnabled === false ? '不限人数' : `上限 ${match.capacity} 人`}</Text>
          </View>
          {access.memberStatus === 'approved' ? <Button className='button button--primary button--small' onClick={() => Taro.navigateTo({ url: `/pages/matches/signup?id=${id}` })}>{access.canManage ? '查看管理名单' : '更新状态'}</Button> : null}
        </View>}

        <View className='card match-info'>
          <View className='match-info__header'>
            <View>
              <Text className='section-heading__eyebrow'>MATCH INFO</Text>
              <Text className='section-heading__title'>赛事信息</Text>
            </View>
          </View>
          <View className='match-info__grid'>
            <View className='match-info__item'>
              <Text className='match-info__label'>比赛时间</Text>
              <Text className='match-info__value'>{dateLabel}　{match.kickoffTime}</Text>
            </View>
            {internal ? <View className='match-info__item'>
              <Text className='match-info__label'>集合时间</Text>
              <Text className='match-info__value'>{internal.gatheringTime}</Text>
            </View> : null}
            <View className='match-info__item match-info__item--wide'>
              <Text className='match-info__label'>比赛地点</Text>
              <Text className='match-info__value'>{match.exactLocation}</Text>
              {match.publicArea && match.publicArea !== match.exactLocation ? <Text className='match-info__address'>{match.publicArea}</Text> : null}
              {hasMapLocation ? <Map
                className='match-location-map'
                latitude={match.latitude!}
                longitude={match.longitude!}
                markers={[{
                  id: 1,
                  latitude: match.latitude!,
                  longitude: match.longitude!,
                  title: match.exactLocation,
                  iconPath: '../../assets/gba-crest-white-v2.png',
                  width: 34,
                  height: 40
                }]}
                scale={16}
                showLocation
                onError={() => Taro.showToast({ title: '地图加载失败', icon: 'none' })}
              /> : <View className='match-location-map match-location-map--empty' onClick={access.canManage ? () => Taro.navigateTo({ url: `/pages/matches/edit?id=${id}` }) : undefined}>
                <Text>尚未保存地图定位</Text>
                {access.canManage ? <Text className='match-location-map__hint'>点击前往赛事管理重新选点</Text> : null}
              </View>}
              {hasMapLocation ? <Text className='match-info__link' onClick={openMap}>打开地图导航</Text> : null}
            </View>
            {internal ? <View className='match-info__item match-info__item--wide'>
              <Text className='match-info__label'>球衣要求</Text>
              <Text className='match-info__value'>{internal.jerseyRequirement ? jerseyLabel[internal.jerseyRequirement] : internal.kitNote || '未设置'}{internal.jerseyCustomNote ? ` · ${internal.jerseyCustomNote}` : ''}</Text>
            </View> : null}
          </View>
        </View>

        <View className='card management-note'>
          <View>
            <Text className='section-heading__eyebrow'>MATCH NOTE</Text>
            <Text className='section-heading__title'>赛事备注</Text>
          </View>
          <Text className='management-note__content'>{match.internalNote || '暂未填写赛事备注'}</Text>
        </View>

        {!internal ? <View className='notice'><Text className='notice__title'>队内信息已保护</Text></View> : null}

        {access.canManage && match.status.startsWith('completed')
          ? <Button className='button button--primary' onClick={() => Taro.navigateTo({ url: `/pages/matches/post-match?id=${id}` })}>{isPendingScore ? '录入赛果' : '编辑赛后数据'}</Button>
          : null}
      </View>
    </View>
  )
}
