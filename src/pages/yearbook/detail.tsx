import { useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Button, Input } from '@tarojs/components'
import { PageHero } from '@/components/PageHero'
import { MatchCard } from '@/components/MatchCard'
import { SectionHeading } from '@/components/SectionHeading'
import { appService } from '@/services'
import { confirmMediaUploadCompliance } from '@/utils/mediaCompliance'

export default function YearbookDetailPage() {
  const { params } = useRouter()
  const [entry, setEntry] = useState(appService.getYearbookEntry(params.id || 'y-m-history-1'))
  const [albumUrl, setAlbumUrl] = useState(entry.cloudAlbumUrl || '')
  const [uploadedCount, setUploadedCount] = useState(0)
  const access = appService.getAccess()
  const match = entry.matchId ? appService.getMatch(entry.matchId) : null
  const approvedPhotos = appService.getMedia().filter((asset) => asset.matchId === entry.matchId && asset.reviewStatus === 'approved')
  const saveAlbumLink = async () => {
    if (!albumUrl.trim()) {
      Taro.showToast({ title: '请填写网盘链接', icon: 'none' })
      return
    }
    setEntry(await appService.updateYearbookEntry(entry.id, { cloudAlbumUrl: albumUrl.trim(), cloudAlbumLabel: '完整比赛相册' }))
    Taro.showToast({ title: '网盘链接已保存', icon: 'success' })
  }
  const copyAlbumLink = async () => {
    if (!entry.cloudAlbumUrl) return
    await Taro.setClipboardData({ data: entry.cloudAlbumUrl })
    Taro.showToast({ title: '网盘链接已复制', icon: 'success' })
  }
  const uploadPhotos = async () => {
    try {
      if (!await confirmMediaUploadCompliance()) return
      const result = await Taro.chooseMedia({ count: 9, mediaType: ['image'], sourceType: ['album', 'camera'] })
      let saved = 0
      for (const file of result.tempFiles) {
        const compressed = await Taro.compressImage({ src: file.tempFilePath, quality: 82 })
        await appService.addLocalMedia(compressed.tempFilePath, { matchId: entry.matchId })
        saved += 1
      }
      setUploadedCount((count) => count + saved)
      Taro.showToast({ title: `已提交 ${saved} 张`, icon: 'success' })
    } catch {
      Taro.showToast({ title: '已取消选择', icon: 'none' })
    }
  }
  const updateEntry = async (patch: Parameters<typeof appService.updateYearbookEntry>[1]) => {
    try {
      setEntry(await appService.updateYearbookEntry(entry.id, patch))
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '章节更新失败', icon: 'none' })
    }
  }
  return <View className='page'>
    <PageHero eyebrow={`${entry.year} YEARBOOK`} title={entry.title} subtitle={`${entry.date}\n${entry.summary}`} midnight />
    <View className='content stack'>
      {match ? <MatchCard match={match} /> : null}
      <View className='card card__body album-panel'>
        <SectionHeading eyebrow='MATCH ALBUM' title='比赛相册' />
        <View className='album-stats'><View><Text className='album-stats__value'>{approvedPhotos.length}</Text><Text className='album-stats__label'>张公开照片</Text></View><View><Text className='album-stats__value'>{uploadedCount}</Text><Text className='album-stats__label'>张等待审核</Text></View></View>
        {entry.cloudAlbumUrl ? <View className='album-cloud'><View><Text className='album-cloud__title'>{entry.cloudAlbumLabel || '完整比赛相册'}</Text></View><Button className='button button--small button--primary' onClick={copyAlbumLink}>复制链接</Button></View> : <View className='notice'><Text className='notice__title'>完整相册链接待补充</Text></View>}
        {access.memberStatus === 'approved' ? <><Button className='button button--light album-upload' onClick={uploadPhotos}>单独上传照片（最多 9 张）</Button>
        </> : null}
      </View>
      {access.canManage ? <View className='card card__body'>
        <Text className='section-heading__title'>章节设置</Text>
        <View className='field album-link-field'><Text className='field__label'>完整相册网盘链接</Text><Input className='field__input' value={albumUrl} onInput={(event) => setAlbumUrl(event.detail.value)} placeholder='粘贴百度网盘、夸克网盘或其他 HTTPS 链接' /></View>
        <View className='toolbar'><Button className='button button--small button--primary' onClick={() => void saveAlbumLink()}>保存相册链接</Button><Button className='button button--small button--light' onClick={() => void updateEntry({ featured: !entry.featured })}>{entry.featured ? '取消精选' : '设为精选'}</Button><Button className='button button--small button--light' onClick={() => void updateEntry({ public: !entry.public })}>{entry.public ? '设为内部' : '公开章节'}</Button></View>
      </View> : null}
    </View>
  </View>
}
