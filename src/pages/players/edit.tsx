import { useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Button, Input, Picker, Switch, Text, View } from '@tarojs/components'
import { PageHero } from '@/components/PageHero'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import type { PlayerStatus } from '@/domain/types'
import { appService } from '@/services'
import { chooseCroppedAvatar } from '@/utils/avatar'
import { confirmMediaUploadCompliance } from '@/utils/mediaCompliance'

const statusOptions: Array<{ value: PlayerStatus; label: string }> = [
  { value: 'active', label: '现役球员' },
  { value: 'alumni', label: '历史成员' }
]

export default function PlayerEditPage() {
  const { params } = useRouter()
  const access = appService.getAccess()
  const id = params.id || ''
  const [player, setPlayer] = useState(() => appService.getPlayer(id))
  const [displayName, setDisplayName] = useState(player.displayName)
  const [shirtNumber, setShirtNumber] = useState(player.shirtNumber?.toString() || '')
  const [position, setPosition] = useState(player.position || '')
  const [joinYear, setJoinYear] = useState(player.joinYear?.toString() || '')
  const [leaveYear, setLeaveYear] = useState(player.leaveYear?.toString() || '')
  const [status, setStatus] = useState<PlayerStatus>(player.status)
  const [showAvatar, setShowAvatar] = useState(player.showAvatar)
  const [showPhotos, setShowPhotos] = useState(player.showPhotos)
  const statusIndex = Math.max(0, statusOptions.findIndex((item) => item.value === status))

  const chooseAvatar = async () => {
    try {
      if (!await confirmMediaUploadCompliance()) return
      const filePath = await chooseCroppedAvatar()
      if (!filePath) return
      setPlayer(await appService.setPlayerAvatarFor(player.id, filePath))
      Taro.showToast({ title: '头像已提交，待队长审批', icon: 'none' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '头像更新失败', icon: 'none' })
    }
  }

  const save = async () => {
    try {
      await appService.updatePlayer(player.id, {
        displayName,
        shirtNumber: shirtNumber ? Number(shirtNumber) : undefined,
        position,
        joinYear: joinYear ? Number(joinYear) : undefined,
        leaveYear: leaveYear ? Number(leaveYear) : undefined,
        status,
        showAvatar,
        showPhotos
      })
      Taro.showToast({ title: '球员资料已保存', icon: 'success' })
      setTimeout(() => Taro.redirectTo({ url: `/pages/players/profile?id=${player.id}` }), 400)
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' })
    }
  }

  if (!access.canManage) {
    return <View className='page content'><View className='notice notice--danger'>只有队长或管理员可以修改球员资料。</View></View>
  }

  return <View className='page'>
    <PageHero eyebrow='PLAYER MANAGEMENT' title='编辑球员资料' subtitle={player.displayName} />
    <View className='content stack'>
      <View className='card player-edit-avatar'>
        <PlayerAvatar player={{ ...player, showAvatar }} className='player-edit-avatar__image' fallback={player.displayName.slice(0, 1)} />
        <View className='player-edit-avatar__main'>
          <Text className='player-edit-avatar__title'>球员头像</Text>
          <Text className='player-edit-avatar__hint'>选择并裁剪后提交队长审批，通过后更换公开头像。</Text>
          <Button className='button button--light button--small' onClick={chooseAvatar}>选择并提交审批</Button>
        </View>
      </View>

      <View className='card form-card'>
        <View className='field'>
          <Text className='field__label'>姓名</Text>
          <Input className='field__input' value={displayName} onInput={(event) => setDisplayName(event.detail.value)} />
        </View>
        <View className='grid-2'>
          <View className='field'>
            <Text className='field__label'>球衣号码</Text>
            <Input className='field__input' type='number' value={shirtNumber} onInput={(event) => setShirtNumber(event.detail.value)} placeholder='可留空' />
          </View>
          <View className='field'>
            <Text className='field__label'>场上位置／职务</Text>
            <Input className='field__input' value={position} onInput={(event) => setPosition(event.detail.value)} placeholder='例如：中场' />
          </View>
        </View>
        <View className='grid-2'>
          <View className='field'>
            <Text className='field__label'>开始效力年份</Text>
            <Input className='field__input' type='number' value={joinYear} onInput={(event) => setJoinYear(event.detail.value)} placeholder='例如：2020' />
          </View>
          <View className='field'>
            <Text className='field__label'>结束效力年份</Text>
            <Input className='field__input' type='number' value={leaveYear} onInput={(event) => setLeaveYear(event.detail.value)} placeholder='现役可留空' />
          </View>
        </View>
        <View className='field'>
          <Text className='field__label'>成员状态</Text>
          <Picker mode='selector' range={statusOptions.map((item) => item.label)} value={statusIndex} onChange={(event) => setStatus(statusOptions[Number(event.detail.value)]?.value || 'active')}>
            <View className='picker-value picker-value--full'>{statusOptions[statusIndex]?.label}</View>
          </Picker>
        </View>
        <View className='list-row'>
          <View className='list-row__main'><Text className='list-row__title'>公开显示头像</Text></View>
          <Switch checked={showAvatar} color='#123BB4' onChange={(event) => setShowAvatar(event.detail.value)} />
        </View>
        <View className='list-row'>
          <View className='list-row__main'><Text className='list-row__title'>公开显示照片</Text></View>
          <Switch checked={showPhotos} color='#123BB4' onChange={(event) => setShowPhotos(event.detail.value)} />
        </View>
      </View>
      <Button className='button button--primary' onClick={save}>保存球员资料</Button>
    </View>
  </View>
}
