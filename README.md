# GBA RANGERS 微信小程序

球队公开数字档案馆与内部赛事管理工具，基于 Taro 4、React、TypeScript 和 CloudBase。

## 本地启动

```powershell
pnpm install
pnpm dev:weapp
```

## 浏览器手机预览

```powershell
pnpm build:h5
pnpm preview:h5
```

浏览器打开 `http://127.0.0.1:4173`。桌面浏览器会显示手机边框，窄屏设备会自动铺满屏幕。

在微信开发者工具中导入本目录，默认 `touristappid` 和本地数据模式可以直接预览公开端。进入“我的球队”可切换球员、管理员和队主演示身份。

生产构建已配置 CloudBase 环境 `cloud1-d4g1nl8yx26d1f3f2`。数据库集合创建后，还需将 `public-query`、`membership`、`match`、`stats`、`media`、`notifications`、`team` 七个云函数部署到该环境，生产数据请求才能正常工作。

第一次验收可以直接按照 [验收清单](docs/ACCEPTANCE.md) 逐页点击，无需填写 AppID 或 CloudBase 环境。

需要检查微信小程序原生效果时，双击项目根目录的 `打开小程序真实预览.cmd`。完整说明见 [真实效果检验方式](docs/REAL_PREVIEW.md)。

本地演示邀请码：`GBA2026`。

## 质量检查

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build:weapp
pnpm build:cloudfunctions
```

完整架构、数据安全边界和 CloudBase 接入步骤见 `docs/ARCHITECTURE.md`。
