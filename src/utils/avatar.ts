import Taro from '@tarojs/taro'

const isCancel = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error || '')
  return message.toLowerCase().includes('cancel')
}

export const chooseCroppedAvatar = async (): Promise<string | null> => {
  try {
    const result = await Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera']
    })
    const source = result.tempFiles[0]?.tempFilePath
    if (!source) return null

    let processedPath = source
    try {
      const cropped = await Taro.cropImage({ src: source, cropScale: '1:1' })
      processedPath = cropped.tempFilePath
    } catch (error) {
      if (isCancel(error)) return null
      // 低版本基础库或部分 H5 环境不支持系统裁剪时继续使用原图。
    }

    try {
      const compressed = await Taro.compressImage({ src: processedPath, quality: 82 })
      processedPath = compressed.tempFilePath
    } catch {
      // 不支持压缩时保留裁剪后的文件。
    }

    try {
      const saved = await Taro.saveFile({ tempFilePath: processedPath })
      if ('savedFilePath' in saved && saved.savedFilePath) processedPath = saved.savedFilePath
    } catch {
      // H5 使用浏览器临时地址，小程序端通常会进入持久文件路径。
    }
    return processedPath
  } catch (error) {
    if (isCancel(error)) return null
    throw error
  }
}
