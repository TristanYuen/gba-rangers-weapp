import type { FeePlan, MatchInternal, MediaAsset, MembershipApplication, Player, PlayerFeeAssignment, Signup, TeamNotice, YearbookEntry } from '@/domain/types'

const stats = (apps: number, goals: number, assists: number) => ({ apps, goals, assists })
const importedPlayerStats: Record<string, [number, number, number]> = {
  陈树健: [12, 7, 13],
  何文轩: [7, 0, 0],
  尹伟明: [2, 1, 1],
  蹇昌安: [11, 2, 1],
  袁梓皓: [3, 0, 1],
  杨承炫: [4, 0, 0],
  胡敬钧: [3, 1, 1],
  李炜麒: [11, 13, 12],
  韦张军: [2, 3, 2],
  莫汝恒: [4, 5, 1],
  冯正夫: [0, 0, 0],
  刘铭术: [5, 0, 2],
  唐添翼: [1, 0, 0],
  叶俊鹏: [4, 1, 0],
  沙雨润: [3, 0, 1],
  黎沛轩: [6, 0, 0],
  陆泳锜: [3, 0, 2],
  郑文睿: [5, 1, 2],
  吴子康: [4, 0, 2],
  郝嘉旭: [0, 0, 0],
  袁铖: [2, 0, 0],
  陈厚达: [7, 2, 4],
  林子彬: [2, 0, 0],
  钟颖俊: [2, 0, 3],
  冯耀夫: [7, 0, 0],
  向浩麟: [3, 4, 0],
  欧嘉俊: [4, 6, 4],
  吴庚华: [12, 2, 2],
  黎耀锋: [0, 0, 0],
  黎响: [14, 24, 4],
  陈泳杰: [3, 0, 0],
  李宇轩: [1, 0, 0],
  谢嘉峻: [11, 3, 2],
  刘梓睿: [9, 0, 1],
  周照安: [6, 1, 0],
  黄震杰: [14, 3, 1],
  萧毅杰: [4, 1, 0],
  梁子谦: [0, 0, 0],
  刘广健: [3, 1, 1],
  陈智威: [4, 0, 1],
  钟佳栩: [12, 0, 2],
  何熙: [9, 8, 2],
  冯江楠: [1, 0, 0]
}
const importedJoinYears: Record<string, number> = {
  陈树健: 2023, 周照安: 2022, 胡敬钧: 2022, 冯正夫: 2022, 吴庚华: 2023,
  欧嘉俊: 2025, 王振懿: 2022, 尹伟明: 2026, 黄震杰: 2020, 叶俊鹏: 2023,
  沙雨润: 2026, 刘梓睿: 2022, 李炜麒: 2020, 黎响: 2020, 何熙: 2023,
  蹇昌安: 2022, 郑文睿: 2026, 钟佳栩: 2020, 萧毅杰: 2026, 黎耀锋: 2022,
  林子彬: 2020, 马君豪: 2022, 冯江楠: 2020, 袁铖: 2020, 韦张军: 2025,
  唐添翼: 2022, 谢嘉峻: 2022, 袁梓皓: 2023, 陆泳锜: 2022, 吴子康: 2023,
  冯耀夫: 2022, 梁子谦: 2024, 刘广健: 2025, 陈智威: 2020, 刘铭术: 2023,
  郝嘉旭: 2023, 向浩麟: 2024, 陈厚达: 2025, 钟颖俊: 2025, 莫汝恒: 2025,
  何文轩: 2022, 陈泳杰: 2025, 杨承炫: 2024, 黎沛轩: 2025, 李宇轩: 2021,
  尹智: 2020, 何泽锋: 2021, 王基权: 2021, 陈智民: 2021, 陈昊翔: 2020
}
const rosterPlayer = (id: string, displayName: string, shirtNumber?: number, position?: string): Player => ({
  ...(() => {
    const [apps, goals, assists] = importedPlayerStats[displayName] ?? [0, 0, 0]
    return { stats: stats(apps, goals, assists), seasonStats: stats(apps, goals, assists) }
  })(),
  id,
  displayName,
  sourceName: displayName,
  memberType: 'formal',
  status: 'active',
  shirtNumber,
  position: position || '未分类',
  joinYear: importedJoinYears[displayName],
  publicAuthorized: true,
  showAvatar: true,
  showPhotos: true,
})

export const fixturePlayers: Player[] = [
  rosterPlayer('p-chen-shujian', '陈树健', 69, '中场'),
  rosterPlayer('p-zhou-zhaoan', '周照安', 92, '后卫'),
  rosterPlayer('p-hu-jingjun', '胡敬钧', 8, '中场'),
  rosterPlayer('p-feng-zhengfu', '冯正夫', 12, '中场'),
  rosterPlayer('p-wu-genghua', '吴庚华', 33, '前锋'),
  rosterPlayer('p-ou-jiajun', '欧嘉俊', 47, '前锋'),
  rosterPlayer('p-wang-zhenyi', '王振懿', undefined, '后卫'),
  rosterPlayer('p-yin-weiming', '尹伟明', 2, '中场'),
  rosterPlayer('p-huang', '黄震杰', 17, '中场'),
  rosterPlayer('p-ye-junpeng', '叶俊鹏', 18, '中场'),
  rosterPlayer('p-sha-yurun', '沙雨润', 21, '中场'),
  rosterPlayer('p-liu-zirui', '刘梓睿', 88, '中场'),
  rosterPlayer('p-li-weiqi', '李炜麒', 7, '前锋'),
  rosterPlayer('p-li-xiang', '黎响', 56, '前锋'),
  rosterPlayer('p-he-xi', '何熙', 67, '前锋'),
  rosterPlayer('p-jian-changan', '蹇昌安', 4, '后卫'),
  rosterPlayer('p-zheng-wenrui', '郑文睿', 25, '后卫'),
  rosterPlayer('p-zhong-jiaxu', '钟佳栩', 66, '后卫'),
  rosterPlayer('p-xiao-yijie', '萧毅杰', 93, '后卫'),
  rosterPlayer('p-li-yaofeng', '黎耀锋', 52, '中场'),
  rosterPlayer('p-lin-zibin', '林子彬', 30, '后卫'),
  rosterPlayer('p-ma-junhao', '马君豪'),
  rosterPlayer('p-feng-jiangnan', '冯江楠', 20, '中场'),
  rosterPlayer('p-yuan-cheng', '袁铖', 28, '中场'),
  rosterPlayer('p-wei-zhangjun', '韦张军', 9, '前锋'),
  rosterPlayer('p-tang-tianyi', '唐添翼', 14, '后卫'),
  rosterPlayer('p-xie-jiajun', '谢嘉峻', 77, '中场'),
  rosterPlayer('p-yuan-zihao', '袁梓皓', 5, '后卫'),
  rosterPlayer('p-lu-yongqi', '陆泳锜', 24, '中场'),
  rosterPlayer('p-wu-zikang', '吴子康', 26, '中场'),
  rosterPlayer('p-feng-yaofu', '冯耀夫', 35, '中场'),
  rosterPlayer('p-liang-ziqian', '梁子谦', 95, '中场'),
  rosterPlayer('p-liu-guangjian', '刘广健', 97, '中场'),
  rosterPlayer('p-chen-zhiwei', '陈智威', 99, '中场'),
  rosterPlayer('p-liu-mingshu', '刘铭术', 13, '前锋'),
  rosterPlayer('p-hao-jiaxu', '郝嘉旭', 27, '前锋'),
  rosterPlayer('p-xiang-haolin', '向浩麟', 46, '前锋'),
  rosterPlayer('p-chen-houda', '陈厚达', 29, '后卫'),
  rosterPlayer('p-zhong-yingjun', '钟颖俊', 31, '后卫'),
  rosterPlayer('p-mo-ruheng', '莫汝恒', 11, '前锋'),
  rosterPlayer('p-he-wenxuan', '何文轩', 1, '门将'),
  rosterPlayer('p-chen-yongjie', '陈泳杰', 59, '门将'),
  rosterPlayer('p-yang-chengxuan', '杨承炫', 6, '后卫'),
  rosterPlayer('p-li-peixuan', '黎沛轩', 22, '后卫'),
  rosterPlayer('p-li-yuxuan', '李宇轩', 76, '后卫'),
  rosterPlayer('p-yin-zhi', '尹智'),
  rosterPlayer('p-he-zefeng', '何泽锋'),
  rosterPlayer('p-wang-jiquan', '王基权'),
  rosterPlayer('p-chen-zhimin', '陈智民'),
  rosterPlayer('p-chen-haoxiang', '陈昊翔'),
  {
    ...rosterPlayer('p-alumni-lu-huajie', '卢华杰', 7, '董事长'),
    status: 'alumni',
    joinYear: 2020,
    leaveYear: 2025,
    legacySpecialAmount: 37263,
    legacyAmount: 197042.15
  }
]

export const fixtureFeePlans: FeePlan[] = [
  { id: 'dongguan', name: '在莞人士', monthlyAmount: 50, category: 'standard', holidayRule: 'keep_current', description: '常规在莞球员会费档次', active: true },
  { id: 'non_dongguan', name: '非在莞人士', monthlyAmount: 40, category: 'standard', holidayRule: 'keep_current', description: '寒暑假继续执行非在莞人士标准', active: true },
  { id: 'student_high', name: '高出勤学生', monthlyAmount: 35, category: 'standard', holidayRule: 'dongguan_rate', description: '1、7、8 月调整为 50 元，其他月份按高出勤学生标准', active: true },
  { id: 'student_low', name: '低出勤学生', monthlyAmount: 25, category: 'standard', holidayRule: 'dongguan_rate', description: '1、7、8 月调整为 50 元，其他月份按低出勤学生标准', active: true },
  { id: 'overseas', name: '留学人员', monthlyAmount: 10, category: 'standard', holidayRule: 'keep_current', description: '寒暑假保持留学档次', active: true },
  { id: 'special_buffer', name: '特殊情况缓冲期', monthlyAmount: 10, category: 'temporary', holidayRule: 'keep_current', description: '用于恢复期限待定等临时情况', active: true },
  { id: 'medical', name: '重大伤病', monthlyAmount: 10, category: 'temporary', holidayRule: 'keep_current', description: '重大伤病期间的临时档次', active: true },
  { id: 'staff_exempt', name: '工作人员豁免', monthlyAmount: 0, category: 'exempt', holidayRule: 'keep_current', description: '俱乐部工作人员会费豁免', active: true },
  { id: 'goalkeeper_exempt', name: '门将豁免', monthlyAmount: 0, category: 'exempt', holidayRule: 'keep_current', description: '门将会费豁免', active: true },
  { id: 'temporary_exempt', name: '暂免会费', monthlyAmount: 0, category: 'exempt', holidayRule: 'keep_current', description: '经队委会确认的临时豁免', active: true },
  { id: 'sponsor_exempt', name: '赞助商豁免', monthlyAmount: 0, category: 'exempt', holidayRule: 'keep_current', description: '顶级赞助商会费豁免', active: true },
  { id: 'professional_exempt', name: '职业球员豁免', monthlyAmount: 0, category: 'exempt', holidayRule: 'keep_current', description: '参加职业或半职业联赛球员会费豁免', active: true }
]

const feeAssignment = (
  playerId: string,
  feePlanId: PlayerFeeAssignment['feePlanId'],
  reason: string,
  paymentMethod?: PlayerFeeAssignment['paymentMethod'],
  effectiveFrom = '2026-01',
  effectiveTo?: string
): PlayerFeeAssignment => ({
  id: `fee-initial-${playerId}-${effectiveFrom}`,
  playerId,
  feePlanId,
  effectiveFrom,
  effectiveTo,
  paymentMethod,
  reason,
  adjustedBy: '队委会',
  createdAt: '2026-01-01T00:00:00+08:00'
})

const importedReason = '依据 2026-08-01 人员名单录入'
const monthly = '月付' as const
const annual = '年付' as const

const newMemberAssignments = (playerId: string): PlayerFeeAssignment[] => [
  feeAssignment(playerId, 'temporary_exempt', '新成员豁免至 2026.9', monthly, '2026-01', '2026-09'),
  feeAssignment(playerId, 'dongguan', importedReason, monthly, '2026-10')
]

export const fixtureFeeAssignments: PlayerFeeAssignment[] = [
  feeAssignment('p-chen-shujian', 'dongguan', importedReason, annual),
  feeAssignment('p-zhou-zhaoan', 'dongguan', importedReason, annual),
  feeAssignment('p-hu-jingjun', 'non_dongguan', importedReason, annual),
  feeAssignment('p-feng-zhengfu', 'non_dongguan', importedReason, annual),
  feeAssignment('p-wu-genghua', 'special_buffer', '伤病', monthly),
  feeAssignment('p-ou-jiajun', 'special_buffer', '伤病', monthly),
  feeAssignment('p-wang-zhenyi', 'special_buffer', '伤病', monthly),
  ...newMemberAssignments('p-yin-weiming'),
  feeAssignment('p-huang', 'dongguan', importedReason, monthly),
  feeAssignment('p-ye-junpeng', 'dongguan', importedReason, monthly),
  ...newMemberAssignments('p-sha-yurun'),
  feeAssignment('p-liu-zirui', 'dongguan', importedReason, monthly),
  feeAssignment('p-li-weiqi', 'dongguan', importedReason, monthly),
  feeAssignment('p-li-xiang', 'dongguan', importedReason, monthly),
  feeAssignment('p-he-xi', 'dongguan', importedReason, monthly),
  feeAssignment('p-jian-changan', 'dongguan', importedReason, monthly),
  ...newMemberAssignments('p-zheng-wenrui'),
  feeAssignment('p-zhong-jiaxu', 'dongguan', importedReason, monthly),
  ...newMemberAssignments('p-xiao-yijie'),
  feeAssignment('p-li-yaofeng', 'non_dongguan', importedReason, monthly),
  feeAssignment('p-lin-zibin', 'non_dongguan', importedReason, monthly),
  feeAssignment('p-ma-junhao', 'non_dongguan', importedReason, monthly),
  feeAssignment('p-feng-jiangnan', 'overseas', importedReason, monthly),
  feeAssignment('p-yuan-cheng', 'overseas', importedReason, monthly),
  feeAssignment('p-wei-zhangjun', 'overseas', importedReason, monthly),
  feeAssignment('p-tang-tianyi', 'overseas', importedReason, monthly),
  feeAssignment('p-xie-jiajun', 'student_high', importedReason, monthly),
  feeAssignment('p-yuan-zihao', 'student_high', importedReason, monthly),
  feeAssignment('p-lu-yongqi', 'student_low', importedReason, monthly),
  feeAssignment('p-wu-zikang', 'student_low', importedReason, monthly),
  feeAssignment('p-feng-yaofu', 'student_low', importedReason, monthly),
  feeAssignment('p-liang-ziqian', 'student_low', importedReason, monthly),
  feeAssignment('p-liu-guangjian', 'student_low', importedReason, monthly),
  feeAssignment('p-chen-zhiwei', 'student_low', importedReason, monthly),
  feeAssignment('p-liu-mingshu', 'student_low', importedReason, monthly),
  feeAssignment('p-hao-jiaxu', 'student_low', importedReason, monthly),
  feeAssignment('p-xiang-haolin', 'student_low', importedReason, monthly),
  feeAssignment('p-chen-houda', 'student_low', importedReason, monthly),
  feeAssignment('p-zhong-yingjun', 'student_low', importedReason, monthly),
  feeAssignment('p-mo-ruheng', 'professional_exempt', '职业／半职业联赛球员'),
  feeAssignment('p-he-wenxuan', 'goalkeeper_exempt', '门将'),
  feeAssignment('p-chen-yongjie', 'goalkeeper_exempt', '门将'),
  feeAssignment('p-yang-chengxuan', 'professional_exempt', '职业／半职业联赛球员'),
  feeAssignment('p-li-peixuan', 'sponsor_exempt', '高级赞助商'),
  feeAssignment('p-li-yuxuan', 'staff_exempt', '工作人员'),
  feeAssignment('p-yin-zhi', 'staff_exempt', '工作人员'),
  feeAssignment('p-he-zefeng', 'staff_exempt', '工作人员'),
  feeAssignment('p-wang-jiquan', 'staff_exempt', '工作人员'),
  feeAssignment('p-chen-zhimin', 'staff_exempt', '工作人员'),
  feeAssignment('p-chen-haoxiang', 'staff_exempt', '工作人员')
]

const historical: Array<[string, string, number, number, number]> = [
  ['2026-01-03', '天海', 17, 4, 1], ['2026-01-11', '聚梦青年', 18, 9, 6],
  ['2026-01-15', '炽热', 15, 6, 6], ['2026-01-19', '捌点拌', 13, 2, 2],
  ['2026-01-25', 'GBA 年会活动', 27, 15, 17], ['2026-01-30', '杨柑', 14, 4, 4],
  ['2026-02-09', '聚梦青年', 27, 2, 3], ['2026-02-26', '七宝一丁', 17, 2, 2],
  ['2026-05-04', '落雨', 12, 11, 9], ['2026-05-16', '落雨', 14, 15, 9],
  ['2026-05-24', '三部曲', 12, 4, 3], ['2026-06-21', '风起云涌', 16, 5, 5],
  ['2026-07-02', '莞兴联', 17, 7, 5], ['2026-07-13', '恒大集团', 16, 8, 4]
]

export const fixtureMatches: MatchInternal[] = [
  {
    id: 'm-next', title: 'GBA RANGERS VS 南城联', opponent: '南城联', eventType: 'versus',
    matchDate: '2026-07-30', kickoffTime: '20:00', publicArea: '大湾区', format: '7-a-side', capacityEnabled: true, capacity: 14,
    jerseyRequirement: 'home', registrationDeadline: '2026-07-29T20:00:00+08:00', status: 'published', homeScore: null, awayScore: null,
    countInStats: true, registrationCount: 11, exactLocation: '东莞市南城区体育公园足球场', gatheringTime: '19:30',
    kitNote: '皇家蓝球衣', internalNote: '提前 15 分钟完成热身'
  },
  ...historical.map(([date, opponent, apps, goals, assists], index): MatchInternal => ({
    id: `m-history-${index + 1}`,
    title: opponent.includes('活动') ? opponent : `GBA RANGERS VS ${opponent}`,
    opponent: opponent.includes('活动') ? undefined : opponent,
    eventType: opponent.includes('活动') ? 'event' : 'versus',
    matchDate: date,
    kickoffTime: '20:00', publicArea: '大湾区', format: '7-a-side', capacity: 28,
    status: 'completed_pending_score', homeScore: null, awayScore: null, countInStats: true,
    apps, goals, assists, exactLocation: '历史地点待补', gatheringTime: '19:30'
  }))
]

export const fixtureSignups: Signup[] = fixturePlayers.slice(0, 8).map((player, index) => ({
  id: `signup-${player.id}`, matchId: 'm-next', playerId: player.id,
  choice: index < 6 ? 'attending' : index === 6 ? 'maybe' : 'absent',
  placement: index < 6 ? 'confirmed' : 'not_applicable',
  signupType: 'self', approvalStatus: 'not_required', reminderStatus: index === 6 ? 'scheduled' : 'not_required',
  pendingUntil: index === 6 ? '2026-07-29T18:00:00+08:00' : undefined,
  createdAt: `2026-07-23T0${index}:00:00+08:00`, updatedAt: `2026-07-23T0${index}:00:00+08:00`, version: 1
}))

export const fixtureNotices: TeamNotice[] = [
  {
    id: 'notice-welcome',
    type: 'match_signup',
    title: '周日比赛报名提醒',
    content: '南城联比赛报名即将截止，请及时确认是否参加。',
    audience: 'unregistered',
    matchId: 'm-next',
    dueAt: '2026-07-26T20:00:00+08:00',
    createdAt: '2026-07-25T10:00:00+08:00',
    createdBy: '队长',
    readBy: [],
    delivery: { total: 4, delivered: 3, unavailable: 1 }
  }
]

export const fixtureMembershipApplications: MembershipApplication[] = [
  { id: 'join-1', displayName: '林嘉朗', requestedAt: '2026-07-22T20:30:00+08:00', status: 'pending', role: 'player', version: 1 },
  { id: 'join-2', displayName: '周恺文', requestedAt: '2026-07-23T09:10:00+08:00', status: 'pending', role: 'player', version: 1 }
]

export const fixtureYearbook: YearbookEntry[] = fixtureMatches.slice(1, 6).map((match, index) => ({
  id: `y-${match.id}`, year: 2026, type: match.eventType === 'event' ? 'team_activity' : 'match', matchId: match.id,
  title: match.title, date: match.matchDate, summary: `${match.apps} 人出场 · ${match.goals} 球 · ${match.assists} 助攻`,
  featured: index < 3, public: true
}))

export const fixtureMedia: MediaAsset[] = [
  { id: 'media-1', uploaderId: 'p-li-xiang', matchId: 'm-history-14', fileUrl: '', thumbnailUrl: '', reviewStatus: 'pending_review', isCover: false, isFeatured: false, createdAt: '2026-07-14T12:00:00+08:00' },
  { id: 'media-2', uploaderId: 'p-huang', playerId: 'p-huang', fileUrl: '', thumbnailUrl: '', reviewStatus: 'approved', isCover: true, isFeatured: true, createdAt: '2026-07-10T12:00:00+08:00' }
]
