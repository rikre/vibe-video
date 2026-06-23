/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Activity } from './types';

// We import the generated image directly or reference its path
export const WELL_IMAGE_PATH = '/src/assets/images/well_forest_1780553072336.png';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'changqian-project',
    name: '常谦的项目',
    tag: '创作中',
    coverType: 'gradient',
    createdAt: '2026-06-04 01:47:36 创建',
    members: ['常谦', '张三'],
    description: '一个充满科幻色彩的现代都市微短剧项目。',
    projectType: '自由模式',
    plannedEpisodesCount: 3,
    episodesCount: 3,
    episodes: [
      { id: 'cq-e1', number: 1, title: '第一集：诡异的时空波动', status: '脚本编辑中', progress: 45, description: '主角在咖啡馆突然遭遇了时间的诡异停滞，发现了一枚怀表。' },
      { id: 'cq-e2', number: 2, title: '第二集：追寻神秘信使', status: '初始状态', progress: 0, description: '通过怀表上的线索，追寻一名只在雨天出现的神秘邮差。' },
      { id: 'cq-e3', number: 3, title: '第三集：命运的平行线', status: '初始状态', progress: 0, description: '最终揭开了时空波动背后关于两个平行时空的秘密合作。' }
    ],
    assets: {
      total: 8,
      characters: 3,
      scenes: 3,
      props: 2
    },
    computeSpent: 120,
    todaySpent: 15,
    memberStats: [
      { rank: 1, name: '常谦', avatarLetter: '常', computeCost: 85, outputSummary: '图片 34 / 视频 12 / 时长 180s' },
      { rank: 2, name: '张三', avatarLetter: '张', computeCost: 35, outputSummary: '图片 15 / 视频 5 / 时长 60s' }
    ],
    activities: [
      { id: 'cq-act-1', user: '常谦', action: '生成了第一集剧本草稿', timeLabel: '20分钟前', type: 'script' },
      { id: 'cq-act-2', user: '张三', action: '生成第一集场景概念图', timeLabel: '3小时前', type: 'image' }
    ]
  },
  {
    id: 'xifujing-project',
    name: '媳妇井',
    tag: '创作中',
    coverType: 'image',
    coverUrl: WELL_IMAGE_PATH,
    createdAt: '2026-05-21 14:03:19 创建',
    members: ['张三', '李四', '王五', '赵六'],
    description: '惊悚悬疑题材短剧。讲述迷雾村庄古井深处的诡异传说，与调查员寻找失踪新娘的惊悚历程。',
    projectType: '剧本模式',
    scriptFileName: '媳妇井_前三集剧本.txt',
    scriptContent: `第一章 背锅！秘宝首饰盒的诅咒

荒村夜色深沉，李二狗抱着青铜秘宝盒冲进雾气弥漫的林道。身后传来王天霸的怒吼，井边忽然亮起幽绿的光。

白衣女鬼从枯井中缓缓抬头，低声问他：你拿了我的嫁妆，还想逃到哪里？

第二章 绝境！传承血契觉醒

村民将李二狗逼到古井边，逼他交出秘宝盒。混乱中，李二狗跌入井底，掌心被白玉锁划破。

血滴落入玉锁，井底石门震动，沉睡百年的林家血契被唤醒。

第三章 蛰伏！初探荒村祠堂

李二狗在井底秘境中重获生机，发现村中祠堂藏着活人祭祀的真相。

他决定暂时蛰伏，借秘宝盒的力量查清王天霸与古井诅咒的关系。`,
    episodesCount: 3,
    episodes: [
      { id: 'xf-e1', number: 1, title: '第一集：背锅！秘宝...', status: '分镜分析中', progress: 20, description: '李二狗替罪背锅连夜逃入荒村，却无意中在古井旁捡到一只青铜斑驳的秘宝首饰盒，开启诡异诅咒。' },
      { id: 'xf-e2', number: 2, title: '第二集：绝境！传承...', status: '初始状态', progress: 100, description: '古道枯井之中，女鬼哀鸣。村民设法将李二狗推下干涸的深井，面临致命危机，古老家族的传承血契却由此觉醒。' },
      { id: 'xf-e3', number: 3, title: '第三集：蛰伏！初探...', status: '资产编辑中', progress: 0, description: '李二狗在井底秘境内蛰伏数日，重获新生。初探荒村祠堂，誓要揭开祭祀恶俗的真相。' }
    ],
    assets: {
      total: 11,
      characters: 5,
      scenes: 3,
      props: 3
    },
    computeSpent: 0,
    todaySpent: 0,
    memberStats: [
      { rank: 1, name: '张三', avatarLetter: '戏', computeCost: 0, outputSummary: '图片 0 / 视频 0 / 时长 0s' }
    ],
    activities: [
      { id: 'xf-act-1', user: '张三', action: '生视频', timeLabel: '1分钟前', type: 'video' },
      { id: 'xf-act-2', user: '李四', action: '生图', timeLabel: '6小时前', type: 'image' },
      { id: 'xf-act-3', user: '王五', action: '音频合成', timeLabel: '6小时前', type: 'audio' },
      { id: 'xf-act-4', user: '赵六', action: '脚本生成', timeLabel: '5天前', type: 'script' },
      { id: 'xf-act-5', user: '张三', action: '生图', timeLabel: '5天前', type: 'image' }
    ]
  }
];

export const ALL_MEMBERS = ['所有成员', '常谦', '张三', '李四', '王五', '赵六'];
