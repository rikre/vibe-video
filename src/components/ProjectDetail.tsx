/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Edit2, Plus, Users, Cpu, FileText, LayoutGrid, Award, Film, Play, Volume2, Sparkles, Send, Check, X, Bot, Boxes, Map, Package, WandSparkles, CheckCircle2, Image as ImageIcon, Mic2, ChevronDown, Upload, Trash2, Folder, Download } from 'lucide-react';
import { Project, ProjectSubTab, ThemeMode } from '../types';

interface ScriptChapter {
  id: string;
  title: string;
  content: string;
}

const fallbackScript = `林家院子里，那口缺了口的大水缸面上已经结了一层厚厚的冰。

林安跨进水缸，正用一把生锈的铁锨一下一下地砸开冰面，冒出冰冷刺骨的水。倒进面前那个掉漆的红双喜大木盆里。

她的双手浸泡在漂着冰碴子的冷水里，早就冻得失去了知觉。院本应该是一双二十岁女孩白皙柔软的手，此刻却布满了细小伤口。

屋檐下的冰天雪地形成鲜明对比，是一墙之隔的堂屋。

堂屋的门缝里，正源源不断地飘出猪肉白菜炖粉条的浓郁香气。煤球炉子烧得正旺，把屋里烘得暖融融的。`;

function buildChapters(project: Project): ScriptChapter[] {
  const source = project.scriptContent?.trim() || fallbackScript;
  const chapterPattern = /(?=\n?\s*第[\d一二三四五六七八九十百]+章[^\n]*)/g;
  const chunks = source.split(chapterPattern).map((item) => item.trim()).filter(Boolean);
  const normalized = chunks.length > 1 ? chunks : [source];
  return normalized.slice(0, 20).map((content, index) => ({
    id: `chapter-${index + 1}`,
    title: `第${index + 1}章`,
    content: content.replace(/^第[\d一二三四五六七八九十百]+章[^\n]*\n?/, '').trim(),
  }));
}

interface ProjectDetailProps {
  project: Project;
  theme: ThemeMode;
  initialTab?: '概览' | '剧本';
  onBack: () => void;
  onRenameProject: (projectId: string, newName: string) => void;
}

export default function ProjectDetail({ project, theme, initialTab = '概览', onBack, onRenameProject }: ProjectDetailProps) {
  const [activeSubTab, setActiveSubTab] = useState<ProjectSubTab>(initialTab);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(project.name);
  
  // Script editor state
  const [scriptPrompt, setScriptPrompt] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<Array<{ role: string; content: string; cue?: string }>>([
    { role: '李二狗', content: '（喘着粗气，看着手中的秘宝盒子）这……这到底是什么脏东西，怎么逃都逃不掉。', cue: '中景 紧张' },
    { role: '旁白', content: '（风声呼啸）荒村深处的古道上，枯枝如鬼影怪手般拉扯着夜行者的衣襟。', cue: '全景 阴森' },
    { role: '李二狗', content: '（惊恐回头）谁？！谁在井边吹气？！', cue: '特写 惊恐' },
  ]);

  // Storyboard state
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [customScenes, setCustomScenes] = useState<Array<{ id: string; title: string; desc: string; img: string }>>([
    { id: 'sc-1', title: '李二狗夜奔', desc: '李二狗背着首饰盒，满脸惊恐惊跑在雾气环绕的松林。', img: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=300&auto=format&fit=crop' },
    { id: 'sc-2', title: '百年枯井异象', desc: '井口冒出森森绿光，似乎有潮湿的白发顺着青砖向上蔓延。', img: project.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop' },
    { id: 'sc-3', title: '血契觉醒', desc: '祖传秘盒咬破二狗手指，一滴猩红融入白玉锁，红光大放。', img: 'https://images.unsplash.com/photo-1547841243-eacb14453cd9?q=80&w=300&auto=format&fit=crop' },
  ]);

  // General Overview Editor
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [overviewText, setOverviewText] = useState(project.description || '待补充封面、简介和主创信息');

  // Video Playing State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExtractionOpen, setIsExtractionOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStage, setExtractionStage] = useState<'角色' | '场景' | '道具' | null>(null);
  const [hasExtractedSubjects, setHasExtractedSubjects] = useState(false);
  const [completedExtractionMode, setCompletedExtractionMode] = useState<'手动生成' | '智能提取' | null>(null);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [assetFilter, setAssetFilter] = useState<'全部' | '角色' | '场景' | '道具'>('全部');
  const [voiceBindings, setVoiceBindings] = useState<Record<string, string>>({ 'role-1': '清冷碎玉音' });
  const [voicePickerTargetId, setVoicePickerTargetId] = useState<string | null>(null);
  const [voiceUploadTargetId, setVoiceUploadTargetId] = useState<string | null>(null);
  const [voiceSearch, setVoiceSearch] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState<'中文音色' | '英文音色' | '日文音色'>('中文音色');
  const [voiceGender, setVoiceGender] = useState<'全部' | '女性' | '男性' | '中性'>('全部');
  const [voiceAge, setVoiceAge] = useState<'全部' | '儿童' | '青少年' | '青年' | '中年' | '老年'>('全部');
  const [scriptChapters, setScriptChapters] = useState<ScriptChapter[]>(() => buildChapters(project));
  const [activeChapterId, setActiveChapterId] = useState('chapter-1');
  const [isAnalyzingScript, setIsAnalyzingScript] = useState(initialTab === '剧本');
  const [scriptAspect, setScriptAspect] = useState<'16:9' | '9:16' | '4:3' | '3:4'>('9:16');
  const [visualStyleType, setVisualStyleType] = useState<'AI真人剧' | 'AI漫剧' | '自定义'>('AI真人剧');
  const [visualStyle, setVisualStyle] = useState('现代短剧');
  const [customVisualStyle, setCustomVisualStyle] = useState('');
  const [activeShotEpisode, setActiveShotEpisode] = useState(0);
  const [shotIds, setShotIds] = useState([1, 2]);
  const [shotModes, setShotModes] = useState<Record<number, '多参生成' | '首尾帧生成'>>({ 1: '多参生成', 2: '多参生成' });
  const [shotDescriptions, setShotDescriptions] = useState<Record<number, string>>({
    1: '黄昏下，林克与塞尔达并肩站在海拉鲁城堡废墟高处，望向远方。林克收剑，塞尔达神情凝重，抬起无光的右手。',
    2: '镜头推进，塞尔达低头看向掌心，微弱光点在指尖聚集，空气中漂浮细小尘埃。',
  });
  const [shotPrompts, setShotPrompts] = useState<Record<number, string>>({
    1: '图片1和图片3在图片2中散步，图片1的女生用音频1的音色说：这个地方好热闹啊！',
    2: '镜头缓慢推进，角色看向远方，环境光从背后穿过，整体氛围紧张但克制。',
  });
  const [shotModel, setShotModel] = useState('Doubao-Seedance-2-0');
  const [shotDuration, setShotDuration] = useState<'5s' | '9s' | '12s'>('9s');
  const [shotSpeed, setShotSpeed] = useState<'1x' | '1.5x' | '2x'>('1x');
  const [generatedShots, setGeneratedShots] = useState<Record<number, boolean>>({});
  const [freeStoryboardTool, setFreeStoryboardTool] = useState<'图像' | '视频' | '配音' | '上传'>('视频');
  const [episodeProgressOverrides, setEpisodeProgressOverrides] = useState<Record<string, number>>({});
  const [addedEpisodesCount, setAddedEpisodesCount] = useState(0);
  const [isAddEpisodeOpen, setIsAddEpisodeOpen] = useState(false);
  const [newEpisodeScript, setNewEpisodeScript] = useState('');
  const [newEpisodeScriptFile, setNewEpisodeScriptFile] = useState<string | null>(null);
  const [finalModule, setFinalModule] = useState<'分镜视频' | '配音' | '配字幕'>('分镜视频');
  const hasTrackedShotEdits = useRef(false);
  const isFreeMode = project.projectType === '自由模式';
  const subTabs: ProjectSubTab[] = isFreeMode
    ? ['概览', '资产', '分镜', '成片']
    : ['概览', '剧本', '资产', '分镜', '成片'];
  const getEpisodeFolderId = (index: number) => project.episodes[index]?.id || 'episode-folder-' + project.id + '-' + (index + 1);

  useEffect(() => {
    const nextInitialTab = isFreeMode && initialTab === '剧本' ? '概览' : initialTab;
    setActiveSubTab(subTabs.includes(nextInitialTab) ? nextInitialTab : '概览');
    setHasExtractedSubjects(false);
    setCompletedExtractionMode(null);
    setEpisodeProgressOverrides({});
    setAddedEpisodesCount(0);
    setIsAddEpisodeOpen(false);
    setNewEpisodeScript('');
    setNewEpisodeScriptFile(null);
    hasTrackedShotEdits.current = false;
    setScriptChapters(buildChapters(project));
    setActiveChapterId('chapter-1');
    if (!isFreeMode && nextInitialTab === '剧本') {
      setIsAnalyzingScript(true);
      const timer = window.setTimeout(() => setIsAnalyzingScript(false), 1100);
      return () => window.clearTimeout(timer);
    }
  }, [project.id, initialTab, isFreeMode]);

  const markEpisodeEditing = (episodeIndex = activeShotEpisode) => {
    setEpisodeProgressOverrides((current) => ({ ...current, [getEpisodeFolderId(episodeIndex)]: 50 }));
  };

  useEffect(() => {
    if (!hasTrackedShotEdits.current) {
      hasTrackedShotEdits.current = true;
      return;
    }
    markEpisodeEditing();
  }, [shotDescriptions, shotPrompts]);

  const activeChapter = scriptChapters.find((chapter) => chapter.id === activeChapterId) || scriptChapters[0];
  const updateActiveChapter = (content: string) => {
    setScriptChapters((chapters) => chapters.map((chapter) => chapter.id === activeChapterId ? { ...chapter, content } : chapter));
  };

  const openScriptStudio = () => {
    setActiveSubTab('剧本');
    setIsAnalyzingScript(true);
    window.setTimeout(() => setIsAnalyzingScript(false), 1100);
  };

  const assetGroups = [
    {
      id: 'characters', title: '角色', icon: Users,
      items: [
        { id: 'role-1', name: '李二狗', description: '落魄青年，古风青衫，眼神凌厉。', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop' },
        { id: 'role-2', name: '古井白衣女', description: '白色嫁衣，长发及膝，周身常年被雾气笼罩。', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop' },
        { id: 'role-3', name: '王天霸', description: '荒村恶霸，黑色劲装，凶悍狡猾。', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop' },
      ],
    },
    {
      id: 'scenes', title: '场景', icon: Map,
      items: [
        { id: 'scene-1', name: '雾锁荒村', description: '密雾中的破败村落，木屋与荒草隐约可见。', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=600&auto=format&fit=crop' },
        { id: 'scene-2', name: '百年枯井', description: '青砖斑驳的古井，井口冒出幽绿冷光。', image: project.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop' },
        { id: 'scene-3', name: '荒村祠堂', description: '年久失修的祠堂，红烛与牌位排列在阴影中。', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=600&auto=format&fit=crop' },
      ],
    },
    {
      id: 'props', title: '道具', icon: Package,
      items: [
        { id: 'prop-1', name: '青铜秘宝盒', description: '雕刻太极云纹，缝隙间泛出暗红微光。', image: 'https://images.unsplash.com/photo-1510251173928-4c47485c2548?q=80&w=600&auto=format&fit=crop' },
        { id: 'prop-2', name: '白玉锁', description: '温润白玉打造，吸收鲜血后会显现契约纹路。', image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=600&auto=format&fit=crop' },
        { id: 'prop-3', name: '祭祀铜铃', description: '铜铃表面布满绿锈，无风时仍会自行作响。', image: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?q=80&w=600&auto=format&fit=crop' },
      ],
    },
  ];

  const voiceOptions = [
    { id: 'voice-1', name: '蜜糖波波幼圆音', gender: '女性', age: '儿童' },
    { id: 'voice-2', name: '甜糯稚嫩奶音', gender: '女性', age: '儿童' },
    { id: 'voice-3', name: '清甜幼态蜜糖音', gender: '女性', age: '儿童' },
    { id: 'voice-4', name: '稚嫩奶糖音', gender: '女性', age: '儿童' },
    { id: 'voice-5', name: '治愈系软糯奶音', gender: '女性', age: '儿童' },
    { id: 'voice-6', name: '清冷碎玉音', gender: '女性', age: '青年' },
    { id: 'voice-7', name: '清脆砂糖童声', gender: '女性', age: '儿童' },
    { id: 'voice-8', name: '清脆甜美萝莉音', gender: '女性', age: '儿童' },
    { id: 'voice-9', name: '脆亮元气少年音', gender: '中性', age: '青少年' },
    { id: 'voice-10', name: '傲娇千金音', gender: '女性', age: '青少年' },
    { id: 'voice-11', name: '柔媚酥麻娇宠音', gender: '女性', age: '青年' },
    { id: 'voice-12', name: '锋利权御音', gender: '女性', age: '青年' },
  ];

  const filteredVoiceOptions = voiceOptions.filter((voice) => {
    const matchesSearch = !voiceSearch.trim() || voice.name.toLowerCase().includes(voiceSearch.trim().toLowerCase());
    const matchesGender = voiceGender === '全部' || voice.gender === voiceGender;
    const matchesAge = voiceAge === '全部' || voice.age === voiceAge;
    return matchesSearch && matchesGender && matchesAge;
  });

  const visualStyleGroups = {
    AI真人剧: [
      { name: '现代短剧', desc: '逆袭 · 复仇 · 都市', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=360&auto=format&fit=crop' },
      { name: '美型古装', desc: '仙侠 · 美颜 · 东方', image: 'https://images.unsplash.com/photo-1507808973436-a4ed7b5e87c9?q=80&w=360&auto=format&fit=crop' },
      { name: '经典古装', desc: '宫廷 · 历史 · 古装', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=360&auto=format&fit=crop' },
      { name: '院线电影风', desc: '质感 · 光影 · 剧情', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=360&auto=format&fit=crop' },
      { name: '张艺谋风格', desc: '历史 · 大片 · 仪式感', image: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?q=80&w=360&auto=format&fit=crop' },
      { name: '现代韩剧风', desc: '言情 · 都市 · 偶像', image: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=360&auto=format&fit=crop' },
    ],
    AI漫剧: [
      { name: '通用3D', desc: '写实 · 虚幻引擎', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=360&auto=format&fit=crop' },
      { name: '玄幻仙侠3D', desc: '修仙 · 斗破 · 国风', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=360&auto=format&fit=crop' },
      { name: '现代都市2D', desc: '都市 · 校园 · 日常', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=360&auto=format&fit=crop' },
      { name: '古风仙侠2D', desc: '古装 · 修仙 · 历史', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=360&auto=format&fit=crop' },
      { name: 'Q版3D', desc: '可爱 · 精致 · 萌系', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=360&auto=format&fit=crop' },
      { name: '方块世界', desc: '像素 · 体素 · 游戏', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=360&auto=format&fit=crop' },
    ],
  } satisfies Record<'AI真人剧' | 'AI漫剧', Array<{ name: string; desc: string; image: string }>>;

  const bindVoiceToRole = (roleId: string, voiceName: string) => {
    setVoiceBindings((current) => ({ ...current, [roleId]: voiceName }));
    setVoicePickerTargetId(null);
  };

  const handleVoiceUpload = (file?: File) => {
    if (!file || !voiceUploadTargetId) return;
    const lowerName = file.name.toLowerCase();
    const isAllowedType = lowerName.endsWith('.mp3') || lowerName.endsWith('.wav') || file.type === 'audio/mpeg' || file.type === 'audio/wav';
    if (!isAllowedType) {
      alert('请上传 MP3 或 WAV 格式的人声音频文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('音色文件不能超过 10MB');
      return;
    }
    setVoiceBindings((current) => ({ ...current, [voiceUploadTargetId]: '自定义音色 · ' + file.name }));
    setVoiceUploadTargetId(null);
  };

  const startSubjectExtraction = () => {
    setIsExtracting(true);
    setExtractionStage('角色');
    window.setTimeout(() => {
      setExtractionStage('场景');
      window.setTimeout(() => {
        setExtractionStage('道具');
        window.setTimeout(() => {
          setIsExtracting(false);
          setExtractionStage(null);
          setCompletedExtractionMode('智能提取');
          setHasExtractedSubjects(true);
          setIsExtractionOpen(false);
          setActiveSubTab('资产');
        }, 520);
      }, 520);
    }, 520);
  };

  const handleRenameSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onRenameProject(project.id, tempName.trim());
      setIsEditingName(false);
    }
  };

  const generateAIScript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptPrompt.trim()) return;
    setIsGeneratingScript(true);
    
    setTimeout(() => {
      const results = [
        { role: '系统提示', content: '已根据您的创意： “‘' + scriptPrompt + '”’ 生成以下高能反转短剧场景：', cue: '智能生成' },
        { role: '神秘白衣女', content: '（惨白面庞悬浮在井口）你拿了我的骨灰，还要我做你的娘子吗？', cue: '近景 诡异' },
        { role: '李二狗', content: '（瘫坐在地，步步后退）我……我只是替人背锅的！不是我要娶你，是恶霸王天霸！', cue: '中景 挣扎' },
        { role: '神秘白衣女', content: '（空灵长笑）王天霸吗……呵呵，那这井下，就又得多装一个人了。', cue: '全景 镜头拉远' },
      ];
      setGeneratedScript([...generatedScript, ...results]);
      setScriptPrompt('');
      setIsGeneratingScript(false);
    }, 1500);
  };

  const generateAIImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    
    setTimeout(() => {
      const newScene = {
        id: 'sc-custom-' + Date.now(),
        title: imagePrompt.substring(0, 8) + '...',
        desc: imagePrompt,
        img: 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?q=80&w=300&auto=format&fit=crop',
      };
      setCustomScenes([newScene, ...customScenes]);
      setImagePrompt('');
      setIsGeneratingImage(false);
    }, 1800);
  };

  const createShot = () => {
    const nextId = Math.max(...shotIds, 0) + 1;
    setShotIds((current) => [...current, nextId]);
    setShotModes((current) => ({ ...current, [nextId]: '多参生成' }));
    setShotDescriptions((current) => ({ ...current, [nextId]: '请输入这一条分镜的画面、角色动作、镜头调度与情绪节奏。' }));
    setShotPrompts((current) => ({ ...current, [nextId]: '使用 @ 引用角色、场景、道具和音色，补充分镜视频生成提示词。' }));
  };

  const duplicateShot = (shotId: number) => {
    const nextId = Math.max(...shotIds, 0) + 1;
    const insertIndex = shotIds.indexOf(shotId) + 1;
    setShotIds((current) => [...current.slice(0, insertIndex), nextId, ...current.slice(insertIndex)]);
    setShotModes((current) => ({ ...current, [nextId]: current[shotId] || '多参生成' }));
    setShotDescriptions((current) => ({ ...current, [nextId]: current[shotId] || '' }));
    setShotPrompts((current) => ({ ...current, [nextId]: current[shotId] || '' }));
  };

  const deleteShot = (shotId: number) => {
    if (shotIds.length <= 1) return;
    setShotIds((current) => current.filter((id) => id !== shotId));
    setGeneratedShots((current) => {
      const next = { ...current };
      delete next[shotId];
      return next;
    });
  };

  const addFreeEpisode = () => {
    setAddedEpisodesCount((count) => {
      const nextEpisodeIndex = Math.max(10, project.episodesCount || project.episodes.length) + count;
      setActiveShotEpisode(nextEpisodeIndex);
      return count + 1;
    });
  };

  const handleAddEpisodeClick = () => {
    if (isFreeMode) {
      addFreeEpisode();
      return;
    }
    setIsAddEpisodeOpen(true);
  };

  const handleAddEpisodeScriptFile = async (file?: File) => {
    if (!file) return;
    setNewEpisodeScriptFile(file.name);
    const canReadText = file.type.startsWith('text/') || /\.(txt|md)$/i.test(file.name);
    if (canReadText) {
      setNewEpisodeScript(await file.text());
    }
  };

  const submitScriptEpisode = () => {
    const content = newEpisodeScript.trim();
    if (!content && !newEpisodeScriptFile) return;
    setAddedEpisodesCount((count) => {
      const baseCount = Math.max(10, project.episodesCount || project.episodes.length);
      const nextNumber = baseCount + count + 1;
      setScriptChapters((chapters) => [
        ...chapters,
        {
          id: 'chapter-added-' + Date.now(),
          title: '第' + nextNumber + '章',
          content: content || '已上传 ' + newEpisodeScriptFile + '，等待解析剧集内容。',
        },
      ]);
      setActiveShotEpisode(nextNumber - 1);
      return count + 1;
    });
    setNewEpisodeScript('');
    setNewEpisodeScriptFile(null);
    setIsAddEpisodeOpen(false);
  };

  const cycleShotDuration = () => {
    setShotDuration((current) => current === '5s' ? '9s' : current === '9s' ? '12s' : '5s');
  };

  const cycleShotSpeed = () => {
    setShotSpeed((current) => current === '1x' ? '1.5x' : current === '1.5x' ? '2x' : '1x');
  };

  const cycleShotModel = () => {
    setShotModel((current) => current === 'Doubao-Seedance-2-0' ? 'Vidu-Q1' : current === 'Vidu-Q1' ? 'Kling-2.1' : 'Doubao-Seedance-2-0');
  };

  const generateShotVideo = (shotId: number) => {
    setGeneratedShots((current) => ({ ...current, [shotId]: true }));
  };

  const generateAllShots = () => {
    setGeneratedShots((current) => ({
      ...current,
      ...Object.fromEntries(shotIds.map((id) => [id, true])),
    }));
  };

  const allAssets = assetGroups.flatMap((group) => group.items);
  const assetStatusMap: Record<string, '已完成' | '生成中' | '生成失败'> = {
    'role-1': '已完成',
    'role-2': '生成中',
    'role-3': '生成失败',
    'scene-1': '生成中',
    'scene-2': '已完成',
    'scene-3': '已完成',
    'prop-1': '已完成',
    'prop-2': '生成失败',
    'prop-3': '生成中',
  };
  const assetStats = {
    total: allAssets.length,
    completed: allAssets.filter((item) => assetStatusMap[item.id] === '已完成').length,
    generating: allAssets.filter((item) => assetStatusMap[item.id] === '生成中').length,
    failed: allAssets.filter((item) => assetStatusMap[item.id] === '生成失败').length,
  };
  const roleVersionMap: Record<string, Array<{ name: string; note: string }>> = {
    'role-1': [
      { name: '默认青衫', note: '常规剧情' },
      { name: '夜行斗篷', note: '潜入场景' },
      { name: '喜服变装', note: '婚契反转' },
    ],
    'role-2': [
      { name: '白衣怨灵', note: '惊悚主形态' },
      { name: '红嫁衣', note: '回忆段落' },
    ],
    'role-3': [
      { name: '黑色劲装', note: '打斗形态' },
      { name: '富商外袍', note: '伪装形态' },
    ],
  };
  const configuredAssetIds = allAssets.filter((item) => assetStatusMap[item.id] === '已完成').map((item) => item.id);
  const batchReadyAssets = allAssets.filter((item) => !configuredAssetIds.includes(item.id));
  const visibleAssetGroups = assetFilter === '全部' ? assetGroups : assetGroups.filter((group) => group.title === assetFilter);
  const baseEpisodeCount = Math.max(10, project.plannedEpisodesCount || 0, project.episodesCount || project.episodes.length);
  const episodeFolders = Array.from({ length: baseEpisodeCount + addedEpisodesCount }, (_, index) => {
    const existingEpisode = project.episodes[index];
    return existingEpisode || {
      id: getEpisodeFolderId(index),
      number: index + 1,
      title: '第' + (index + 1) + '集',
      status: index < 5 ? '正在编辑中' : '未完成',
      progress: index < 3 ? 100 : index < 5 ? 50 : 0,
    };
  });
  const getEpisodeProgress = (episode: Project['episodes'][number], index: number) => {
    const defaultProgress = index < 3 ? 100 : index < 5 ? 50 : 0;
    return episodeProgressOverrides[episode.id] ?? defaultProgress;
  };
  const completedEpisodes = episodeFolders.filter((episode, index) => getEpisodeProgress(episode, index) >= 100).length;
  const editingEpisodes = episodeFolders.filter((episode, index) => {
    const progress = getEpisodeProgress(episode, index);
    return progress > 0 && progress < 100;
  }).length;
  const projectProgress = episodeFolders.length
    ? Math.round(episodeFolders.reduce((total, episode, index) => total + getEpisodeProgress(episode, index), 0) / episodeFolders.length)
    : 0;
  const renderEpisodeRail = () => (
    <aside className="shot-episode-rail" aria-label="集数">
      <span>集数</span>
      <button type="button" className="shot-add-episode-button" onClick={handleAddEpisodeClick} aria-label="新增剧集">
        <Plus size={18} />
      </button>
      {episodeFolders.map((ep, index) => (
        <button key={ep.id} type="button" onClick={() => setActiveShotEpisode(index)} className={activeShotEpisode === index ? 'active' : ''}>
          {index + 1}
        </button>
      ))}
    </aside>
  );
  return (
    <div className={`project-detail flex-1 min-h-screen flex flex-col transition-theme ${
      theme === 'dark' ? 'text-zinc-100 font-sans' : 'text-zinc-800'
    }`}>
      {/* Detail Header exactly matching screenshot 2 */}
      <header className={`project-detail-header px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 ${
        theme === 'dark' ? 'border-zinc-800/80' : 'border-zinc-200'
      }`}>
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={onBack}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
              theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </button>

          <span className="text-zinc-650 font-normal">|</span>

          {/* Project Name & Edit Pencil */}
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <form onSubmit={handleRenameSave} className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className={`px-2.5 py-1 text-sm rounded border outline-none font-semibold ${
                    theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'
                  }`}
                  autoFocus
                />
                <button type="submit" className="text-xs text-[var(--accent)] hover:text-[var(--accent)] font-bold px-2 py-1 bg-[var(--accent-soft)] rounded">
                  保存
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">{project.name}</h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className={`p-1.5 rounded-full cursor-pointer hover:bg-zinc-800/20 transition-colors ${
                    theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'
                  }`}
                  title="重命名项目"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Top level sub-menu tabs matching Image 2 exactly */}
        <div className="flex items-center overflow-x-auto no-scrollbar gap-1.5 md:gap-4 md:mr-8 border-b-0" role="tablist" aria-label="项目功能导航">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab;
            return (
              <button
                key={tab}
                id={`project-tab-${tab}`}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  setActiveSubTab(tab);
                  if (tab === '剧本' && !isAnalyzingScript) {
                    setIsAnalyzingScript(true);
                    window.setTimeout(() => setIsAnalyzingScript(false), 1100);
                  }
                  if (tab === '资产' && !isFreeMode && !hasExtractedSubjects) {
                    setIsExtractionOpen(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const currentIndex = subTabs.indexOf(tab);
                    const direction = e.key === 'ArrowRight' ? 1 : -1;
                    const nextIndex = (currentIndex + direction + subTabs.length) % subTabs.length;
                    const nextTab = subTabs[nextIndex];
                    setActiveSubTab(nextTab);
                    document.getElementById(`project-tab-${nextTab}`)?.focus();
                  }
                }}
                className={`px-3 py-2 text-sm font-semibold relative transition-all duration-300 cursor-pointer ${
                  isActive
                    ? (theme === 'dark' ? 'text-[var(--accent)]' : 'text-[#6b7d00] font-bold')
                    : (theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800')
                }`}
              >
                {tab}
                {isActive && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
                    theme === 'dark' ? 'bg-[var(--accent)]' : 'bg-[#6b7d00]'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Primary detail view body */}
      <div className="flex-1 p-6" id="project-detail-content">
        {activeSubTab === '概览' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Main Dashboard (approx 75% wide) */}
            <div className="lg:col-span-3 space-y-8">
              
              {/* Section A: 全剧总览 with inline markdown edit */}
              <div className={`p-6 rounded-2xl border transition-theme ${
                theme === 'dark' ? 'bg-[#121115]/90 border-zinc-800/70' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className={`w-5 h-5 ${theme === 'dark' ? 'text-[var(--accent)]' : 'text-var(--accent)'}`} />
                    <h3 className="text-sm font-bold tracking-wider uppercase opacity-90 text-zinc-300">
                      全剧总览
                    </h3>
                  </div>
                  
                  {isEditingOverview ? (
                    <button
                      onClick={() => setIsEditingOverview(false)}
                      className="text-xs bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20 px-3 py-1 rounded-full cursor-pointer hover:bg-[var(--accent-soft)] transition-colors font-semibold"
                    >
                      完成编辑
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingOverview(true)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                        theme === 'dark' 
                          ? 'border-zinc-850/50 text-zinc-400 hover:text-white hover:bg-zinc-800/50' 
                          : 'border-zinc-200 text-zinc-650 hover:bg-zinc-150'
                      }`}
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>编辑</span>
                    </button>
                  )}
                </div>

                {isEditingOverview ? (
                  <textarea
                    rows={4}
                    value={overviewText}
                    onChange={(e) => setOverviewText(e.target.value)}
                    className={`w-full p-4 rounded-xl border text-sm outline-none transition-theme focus:ring-1 ${
                      theme === 'dark' 
                        ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-300'
                    }`}
                  />
                ) : (
                  <div>
                    <p className={`text-sm leading-relaxed font-normal whitespace-pre-line ${
                      overviewText === '待补充封面、简介和主创信息' ? 'text-zinc-500 italic' : 'text-zinc-300'
                    }`}>
                      {overviewText}
                    </p>
                  </div>
                )}
              </div>

              {/* Section B: 项目概览 Numbers exactly as in Image 2 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <LayoutGrid className={`w-5 h-5 ${theme === 'dark' ? 'text-[var(--accent)]' : 'text-var(--accent)'}`} />
                  <h3 className="text-sm font-bold tracking-wider uppercase opacity-90 text-zinc-300">
                    项目概览
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: 进度 */}
                  <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
                    theme === 'dark' ? 'bg-[#121115]/80 border-zinc-800/70' : 'bg-white border-zinc-200 shadow-sm'
                  }`}>
                    <div>
	                      <span className="text-xs text-zinc-500 font-medium">项目总进度 ?</span>
	                      <h4 className="text-4xl font-extrabold font-mono text-zinc-100 tracking-tight mt-2">
	                        {projectProgress}%
	                      </h4>
	                    </div>
	                    <span className="text-xs text-zinc-400 font-medium mt-4">
		                      完成 {completedEpisodes}/{episodeFolders.length} 集
	                    </span>
	                  </div>

                  {/* Card 2: 资产 */}
                  <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
                    theme === 'dark' ? 'bg-[#121115]/80 border-zinc-800/70' : 'bg-white border-zinc-200 shadow-sm'
                  }`}>
                    <div>
                      <span className="text-xs text-zinc-500 font-medium">资产总数</span>
                      <h4 className="text-4xl font-extrabold font-mono text-zinc-100 mt-2">
                        {project.assets.total}个
                      </h4>
                    </div>
                    <span className="text-xs text-zinc-400 font-semibold mt-4">
                      角色 {project.assets.characters} / 场景 {project.assets.scenes} / 道具 {project.assets.props}
                    </span>
                  </div>

                  {/* Card 3: 算力 */}
                  <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
                    theme === 'dark' ? 'bg-[#121115]/80 border-zinc-800/70' : 'bg-white border-zinc-200 shadow-sm'
                  }`}>
                    <div>
                      <span className="text-xs text-zinc-500 font-medium">算力消耗</span>
                      <h4 className="text-4xl font-extrabold font-mono text-zinc-100 mt-2">
                        {project.computeSpent}
                      </h4>
                    </div>
                    <span className="text-xs text-zinc-400 font-semibold mt-4">
                      今日 +{project.todaySpent}
                    </span>
	                  </div>
	                </div>
	              </div>

	              {/* Section D: 成员统计 fully structured list */}
              <div className="space-y-4 overview-wide-section">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className={`w-5 h-5 ${theme === 'dark' ? 'text-[var(--accent)]' : 'text-var(--accent)'}`} />
                    <h3 className="text-sm font-bold tracking-wider uppercase opacity-90 text-zinc-300">
                      成员统计
                    </h3>
                  </div>
                  <button className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 border border-zinc-750/70 text-[var(--accent)] hover:bg-zinc-800/50 cursor-pointer transition-all">
                    + 邀请成员
                  </button>
                </div>

                <div className={`rounded-2xl border overflow-hidden ${
                  theme === 'dark' ? 'bg-[#121115]/70 border-zinc-800/70' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b ${theme === 'dark' ? 'border-zinc-800/60 bg-zinc-900/10' : 'border-zinc-200 bg-zinc-50'} text-zinc-500 uppercase tracking-widest font-normal`}>
                        <th className="p-4 w-20">排名</th>
                        <th className="p-4">成员</th>
                        <th className="p-4">算力消耗</th>
                        <th className="p-4 text-right pr-6">累计产能</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/20">
                      {project.memberStats.map((stat) => (
                        <tr key={stat.name} className="hover:bg-zinc-800/10">
                          {/* Rank with square boundary */}
                          <td className="p-4">
                            <span className="w-6 h-6 rounded border border-[var(--accent)]/50 text-[var(--accent)] font-bold font-mono text-[11px] flex items-center justify-center bg-[var(--accent-soft)]">
                              {stat.rank}
                            </span>
                          </td>
                          <td className="p-4 font-bold flex items-center gap-2.5">
                            {/* Avatar Letter Circle */}
                            <span className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 font-bold text-xs flex items-center justify-center">
                              {stat.avatarLetter}
                            </span>
                            <span className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}>
                              {stat.name}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-zinc-300">{stat.computeCost}</td>
                          <td className="p-4 text-right pr-6 font-medium text-zinc-400">{stat.outputSummary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

	              <div className="overview-wide-section episode-folder-section">
	                <div className="episode-folder-summary">
	                  <div>
		                    <span>剧集文件夹</span>
			                    <h3>{episodeFolders.length} 集 · 完成 {completedEpisodes} · 编辑中 {editingEpisodes}</h3>
		                    <p>内容更新后自动变为编辑中</p>
		                  </div>
		                  <button onClick={() => setEpisodeProgressOverrides(Object.fromEntries(episodeFolders.map((ep) => [ep.id, 100])))}>
		                    <Check size={14} /> 全部完成
		                  </button>
		                </div>

		                <div className="episode-folder-grid">
		                  {episodeFolders.map((ep, index) => {
		                    const progress = getEpisodeProgress(ep, index);
		                    const folderState = progress >= 100 ? 'done' : progress > 0 ? 'editing' : 'todo';
		                    const stateLabel = progress >= 100 ? '已完成' : progress > 0 ? '正在编辑中' : '未完成';
		                    return (
		                      <article key={ep.id} className={'episode-folder-card ' + folderState}>
	                        <button
	                          className="episode-complete-button"
	                          onClick={() => setEpisodeProgressOverrides((current) => ({ ...current, [ep.id]: 100 }))}
	                        >
	                          {progress >= 100 ? '已完成' : '完成'}
	                        </button>
	                        <Folder size={31} />
	                        <strong>第{ep.number}集</strong>
	                        <span>{stateLabel}</span>
	                      </article>
	                    );
	                  })}
	                </div>
	              </div>

            </div>

            {/* Right Activity Panel Column (approx 25% wide) matching Image 2 style */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Dynamic Operations log & activities panel */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                theme === 'dark' ? 'bg-[#121115]/90 border-zinc-800/70 shadow-sm' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div>
                  <div className="flex justify-between items-center border-b border-zinc-805/30 pb-3 mb-4">
                    <span className="text-[12px] font-bold text-zinc-350 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      最近动态
                    </span>
                    <button className="text-[11px] font-bold text-zinc-500 hover:text-zinc-300 cursor-pointer flex items-center gap-1.5 uppercase">
                      操作日志
                    </button>
                  </div>

                  {/* List of Dynamic updates matching screenshot */}
                  <div className="space-y-4.5" id="activities-panel">
                    {project.activities.map((act) => (
                      <div key={act.id} className="flex justify-between items-start text-xs leading-relaxed">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[#d9f99d] font-bold">{act.user}</span>
                            
                            {/* Type badge to match style perfectly */}
                            {act.type === 'video' && (
                              <span className="bg-[#121c10] text-[#86efac] text-[9px] px-1.5 py-0.2 rounded font-mono border border-emerald-900/30">
                                生视频
                              </span>
                            )}
                            {act.type === 'image' && (
                              <span className="bg-[#1d1b10] text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-mono border border-amber-900/30">
                                生图
                              </span>
                            )}
                            {act.type === 'audio' && (
                              <span className="bg-[#13111b] text-var(--accent) text-[9px] px-1.5 py-0.2 rounded font-mono border border-rgba(192,207,98,0.3)">
                                音频合成
                              </span>
                            )}
                            {act.type === 'script' && (
                              <span className="bg-[#1c1110] text-rose-300 text-[9px] px-1.5 py-0.2 rounded font-mono border border-rose-900/30">
                                脚本生成
                              </span>
                            )}
                          </div>
                          {/* Optional additional subtext */}
                          {act.action !== '生视频' && act.action !== '生图' && act.action !== '音频合成' && act.action !== '脚本生成' && (
                            <span className="text-zinc-500 font-normal mt-0.5 text-[11px]">
                              {act.action}
                            </span>
                          )}
                        </div>

                        <span className="text-zinc-550 shrink-0 text-[11px] font-medium pl-2">
                          {act.timeLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated live controller for adding logs */}
                <div className="mt-8 pt-4 border-t border-zinc-800/40">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      实时协同仿真模块
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ACTIVE MAIN SUBTAB Modules - "剧本" (Script AI Tool) */}
        {activeSubTab === '剧本' && (
          <div className="script-studio animate-fade-in">
            {isAnalyzingScript && (
              <div className="script-agent-overlay">
                <div className="agent-orb"><Bot size={22} /></div>
	                <h3>正在解析剧本</h3>
                <p>{project.scriptFileName ? `正在读取 ${project.scriptFileName}，识别章节与场景结构` : '正在创建初始章节并标记剧情节点'}</p>
                <div><span /></div>
              </div>
            )}

            <aside className="script-chapters-panel">
	              <div className="script-panel-label">章节提取 <span>{scriptChapters.length}</span></div>
              <nav>
                {scriptChapters.map((chapter) => (
                  <button key={chapter.id} onClick={() => setActiveChapterId(chapter.id)} className={activeChapterId === chapter.id ? 'active' : ''}>
                    <span>{chapter.title}</span><Edit2 size={12} />
                  </button>
                ))}
              </nav>
              <button onClick={() => {
                const id = `chapter-${scriptChapters.length + 1}`;
                setScriptChapters([...scriptChapters, { id, title: `第${scriptChapters.length + 1}章`, content: '' }]);
                setActiveChapterId(id);
              }} className="add-chapter-button"><Plus size={14} /> 添加剧集</button>
            </aside>

            <section className="script-editor-panel">
              <header>
                <div><strong>{activeChapter?.title}</strong><Edit2 size={13} /></div>
                <label>内容类型 <select><option>剧本</option><option>故事大纲</option></select></label>
                <span className={activeChapter && activeChapter.content.length > 2000 ? 'warning' : ''}>{activeChapter?.content.length || 0} / 2000 字</span>
              </header>
              <textarea value={activeChapter?.content || ''} onChange={(event) => updateActiveChapter(event.target.value)} spellCheck={false} />
	              <footer><CheckCircle2 size={13} /> 章节解析完成，内容已自动保存</footer>
            </section>

            <aside className="script-settings-panel">
              <div className="settings-tabs"><button className="active">全局设定</button></div>
              <section>
                <h4>视频比例</h4>
                <div className="aspect-options">
                  {(['16:9','9:16','4:3','3:4'] as const).map((aspect) => <button key={aspect} onClick={() => setScriptAspect(aspect)} className={scriptAspect === aspect ? 'active' : ''}><i className={`ratio-${aspect.replace(':','-')}`} />{aspect}</button>)}
                </div>
              </section>
              <section className="visual-style-section">
                <h4>画风</h4>
                <div className="style-category-tabs">
                  {(['AI真人剧', 'AI漫剧', '自定义'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setVisualStyleType(type);
                        if (type === 'AI真人剧') setVisualStyle('现代短剧');
                        if (type === 'AI漫剧') setVisualStyle('通用3D');
                      }}
                      className={visualStyleType === type ? 'active' : ''}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {visualStyleType === '自定义' ? (
                  <div className="style-custom-field">
                    <label>自定义风格</label>
                    <textarea
                      value={customVisualStyle}
                      onChange={(event) => setCustomVisualStyle(event.target.value)}
                      placeholder="输入画风关键词，例如：冷色电影感、低饱和、强对比光影"
                    />
                  </div>
                ) : (
                  <>
                    <div className="style-selected-banner">
                      <span>当前已选：{visualStyle}</span>
                      <button>查看</button>
                    </div>
                    <div className="visual-style-grid">
                      {visualStyleGroups[visualStyleType].map((style) => (
                        <button key={style.name} onClick={() => setVisualStyle(style.name)} className={visualStyle === style.name ? 'active' : ''}>
                          <img src={style.image} alt="" referrerPolicy="no-referrer" />
                          <span>{style.name}</span>
                          <small>{style.desc}</small>
                          {visualStyle === style.name && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </section>
              <button className="director-settings-button">⚙ 全局导演设定</button>
            </aside>

            <button onClick={() => setIsExtractionOpen(true)} className="script-extract-floating"><WandSparkles size={15} /> 提取资产 <span>→</span></button>
          </div>
        )}

        {/* ACTIVE MAIN SUBTAB Modules - Assets */}
        {activeSubTab === '资产' && (
          <div className="subject-assets-page space-y-10 animate-fade-in">
            <div className="subject-assets-header">
              <div>
		                <h3>项目资产</h3>
		                <p>
		                  {isFreeMode
		                    ? '自由模式下请手动创建角色、场景、道具和音色，用于后续分镜生成。'
		                    : completedExtractionMode === '手动生成'
		                      ? '已进入手动生成模式，请分别创建角色、场景和道具。'
		                      : '已从剧本中提取角色、场景和道具，可继续生成视觉资产。'}
		                </p>
	              </div>
	              <div className="flex gap-2">
	                {isFreeMode && <button className="asset-secondary-button"><Plus size={15} /> 新增资产</button>}
	                {!isFreeMode && completedExtractionMode === '智能提取' && <button onClick={() => setIsBatchOpen(true)} className="asset-primary-button"><WandSparkles size={15} /> 批量生成</button>}
		              </div>
		            </div>

            <div className="asset-filter-bar">
              <div className="asset-filter-tabs">
                {(['全部', '角色', '场景', '道具'] as const).map((filter) => (
                  <button key={filter} onClick={() => setAssetFilter(filter)} className={assetFilter === filter ? 'active' : ''}>
                    {filter}<span>{filter === '全部' ? allAssets.length : assetGroups.find((group) => group.title === filter)?.items.length}</span>
                  </button>
                ))}
              </div>
              <span>总计 {assetStats.total} · 已完成 {assetStats.completed} · 生成中 {assetStats.generating} · 失败 {assetStats.failed}</span>
            </div>

            {completedExtractionMode === '手动生成' ? (
              <div className="manual-assets-empty">
                {assetGroups.map((group) => {
                  const GroupIcon = group.icon;
                  return (
                    <section key={group.id} className="manual-asset-section">
                      <div><GroupIcon size={18} /><h4>{group.title}</h4><span>0</span></div>
                      <p>暂无{group.title}资产，请手动创建或上传参考图。</p>
                      <button><Plus size={15} /> 新增{group.title}</button>
                    </section>
                  );
                })}
              </div>
            ) : visibleAssetGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <section key={group.id} id={`asset-${group.id}`} className="asset-group-section">
                  <div className="asset-group-heading">
                    <div><GroupIcon size={17} /><h4>{group.title}</h4></div>
	                    <div className="asset-group-stats">
	                      <span>总计 {group.items.length}</span>
	                      <span>已完成 {group.items.filter((item) => assetStatusMap[item.id] === '已完成').length}</span>
	                      <span>生成中 {group.items.filter((item) => assetStatusMap[item.id] === '生成中').length}</span>
	                      <span className="failed">失败 {group.items.filter((item) => assetStatusMap[item.id] === '生成失败').length}</span>
	                    </div>
	                    <button><Plus size={14} /> 新增{group.title}</button>
	                  </div>
	                  <div className="asset-card-grid">
	                    {group.items.map((item) => {
	                      const status = assetStatusMap[item.id] || '生成中';
	                      const isFailed = status === '生成失败';
	                      const isGenerating = status === '生成中';
	                      return (
	                      <article key={item.id} className={'asset-detail-card ' + (isFailed ? 'failed' : isGenerating ? 'running' : 'done')}>
	                        <div className="asset-detail-image">
	                          <img src={item.image} alt={item.name} referrerPolicy="no-referrer" />
	                          <span className={status === '已完成' ? 'configured' : isFailed ? 'failed' : 'running'}>
	                            {status === '已完成' ? <CheckCircle2 size={12} /> : isFailed ? <X size={12} /> : <Sparkles size={12} />}
	                            {status}
	                          </span>
	                          <div className="asset-hover-toolbar">
	                            <button aria-label="生成" data-tip="生成"><WandSparkles size={15} /></button>
	                            <button aria-label="资产库引用" data-tip="资产库引用"><Boxes size={15} /></button>
	                            <button aria-label="本地上传" data-tip="本地上传"><Upload size={15} /></button>
	                            <button aria-label="删除" data-tip="删除" className="danger"><Trash2 size={15} /></button>
	                          </div>
	                        </div>
	                        <div className="asset-detail-copy">
	                          <h5>{item.name}</h5>
	                          <p>{item.description}</p>
	                          {group.title === '角色' && (
	                            <div className="asset-tag-row">
	                              <span>版本 {roleVersionMap[item.id]?.length || 1}</span>
	                              <span>变装 {Math.max((roleVersionMap[item.id]?.length || 1) - 1, 0)}</span>
	                            </div>
	                          )}
	                          {group.title === '角色' ? (
	                            <div className="character-voice-actions">
	                              {voiceBindings[item.id] ? (
	                                <button className="voice-bound-button" onClick={() => setVoicePickerTargetId(item.id)}>
	                                  <Play size={12} fill="currentColor" />
	                                  {voiceBindings[item.id]}
	                                </button>
	                              ) : (
	                                <div className="voice-menu-trigger">
	                                  <button className="voice-menu-button"><Mic2 size={13} /> 音色</button>
	                                  <div className="voice-menu-popover">
	                                    <button onClick={() => setVoiceUploadTargetId(item.id)}>上传音频</button>
	                                    <button onClick={() => setVoicePickerTargetId(item.id)}>选择音色</button>
	                                  </div>
	                                </div>
	                              )}
	                            </div>
	                          ) : null}
	                        </div>
	                      </article>
	                    )})}
	                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* ACTIVE MAIN SUBTAB Modules - "分镜" free mode editor */}
        {activeSubTab === '分镜' && isFreeMode && (
          <div className="free-storyboard-page animate-fade-in">
            {renderEpisodeRail()}
            <section className="free-storyboard-main">
              <header className="free-storyboard-topbar">
                <div className="free-episode-title">
                  <strong>第{activeShotEpisode + 1}集</strong>
                  <span>自由创作</span>
                </div>
                <div className="free-top-actions">
                  {(['图像', '配音', '视频'] as const).map((tool) => (
                    <button key={tool} onClick={() => setFreeStoryboardTool(tool)} className={freeStoryboardTool === tool ? 'active' : ''}>
                      {tool}
                    </button>
                  ))}
                  <button className="disabled">导出</button>
                </div>
              </header>

              <div className="free-preview-grid">
                <div className="free-preview-stage">
                  <img src={project.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=480&auto=format&fit=crop'} alt="" referrerPolicy="no-referrer" />
                  <p>主角来到汽修厂，新的冲突即将开始。</p>
                </div>
                <aside className="free-preview-side">
                  <button><ImageIcon size={14} /> 截取当前帧</button>
                  <div className="free-play-controls">
                    <button>-0.5s</button>
                    <button onClick={() => setIsPlaying(!isPlaying)}><Play size={14} fill="currentColor" /></button>
                    <button>+0.5s</button>
                  </div>
                  <span>收藏 0</span>
                </aside>
              </div>

              <div className="free-timeline-panel">
                <div className="free-timeline-head">
                  <span>字幕</span>
                  <button className="active" aria-label="字幕开关" />
                  <button className="free-play-mini" onClick={() => setIsPlaying(!isPlaying)}><Play size={13} fill="currentColor" /></button>
                  <strong>00:00 / 01:19</strong>
                </div>
                <div className="free-time-ruler">
                  {['00:00', '00:04', '00:08', '00:12', '00:16', '00:20', '00:24', '00:28'].map((time) => <span key={time}>{time}</span>)}
                </div>
                <div className="free-shot-strip">
                  {['Shot1-1', 'Shot1-1A', 'Shot1-2', 'Shot1-3'].map((shot, index) => (
                    <article key={shot} className={index === 0 ? 'active' : ''}>
                      <header><b>{shot}</b><button aria-label="更多">...</button></header>
                      <div className="free-shot-thumb">
                        {index < 2 ? <img src={project.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=160&auto=format&fit=crop'} alt="" referrerPolicy="no-referrer" /> : <span>暂无媒体</span>}
                      </div>
                      <button className="free-audio-pill"><Volume2 size={12} /> 音频</button>
                    </article>
                  ))}
                </div>
                <button className="free-bg-audio"><Volume2 size={13} /> 背景音乐</button>
              </div>
            </section>

            <aside className="free-storyboard-panel">
              <div className="free-panel-tabs">
                {(['图像', '视频', '配音', '上传'] as const).map((tool) => (
                  <button key={tool} onClick={() => setFreeStoryboardTool(tool)} className={freeStoryboardTool === tool ? 'active' : ''}>
                    {tool}
                  </button>
                ))}
              </div>
              <div className="free-prompt-box">
                <textarea
                  aria-label="生成提示词"
                  value={shotPrompts[1] || ''}
                  onChange={(event) => setShotPrompts((current) => ({ ...current, 1: event.target.value }))}
                  placeholder="描述画面、动作、镜头和对白"
                  maxLength={2000}
                />
                <div className="free-prompt-footer">
                  <span>
                    <Edit2 size={14} />
                    <FileText size={14} />
                  </span>
                  <b>{(shotPrompts[1] || '').length}/2000</b>
                </div>
              </div>
              <div className="free-panel-actions">
                <button className="primary">生成视频</button>
                <button>预览</button>
                <button>历史</button>
              </div>
            </aside>
          </div>
        )}

        {/* ACTIVE MAIN SUBTAB Modules - "分镜" (Storyboard Shot List) */}
        {activeSubTab === '分镜' && !isFreeMode && (
          <div className="space-y-6 animate-fade-in" id="shot-list-grid">
            <div className="shot-workbench">
              {renderEpisodeRail()}

              <section className="shot-main-panel">
                <header className="shot-toolbar">
                  <button className="shot-tab active" onClick={() => setActiveSubTab('分镜')}>分镜表</button>
                  <div className="shot-toolbar-actions">
                    <select value={shotModel} onChange={(event) => setShotModel(event.target.value)}>
                      <option>Doubao-Seedance-2-0</option>
                      <option>Vidu-Q1</option>
                      <option>Kling-2.1</option>
                    </select>
                    <button onClick={generateAllShots}><Film size={14} />批量生视频</button>
                  </div>
                </header>

                {shotIds.map((shot) => (
                  <article key={shot} className="shot-row-card">
                    <div className="shot-row-head">
                      <div className="shot-row-title"><span className="drag-handle">::</span><strong>分镜{shot}</strong><b>ID</b></div>
                      <div className="shot-mode-toggle">
                        {(['多参生成', '首尾帧生成'] as const).map((mode) => (
                          <button key={mode} onClick={() => setShotModes((current) => ({ ...current, [shot]: mode }))} className={shotModes[shot] === mode ? 'active' : ''}><i />{mode}</button>
                        ))}
                      </div>
                      <div className="shot-row-tools"><button onClick={createShot}>＋</button><button onClick={() => duplicateShot(shot)}>□</button><button onClick={() => deleteShot(shot)}>⌫</button></div>
                    </div>

                    <div className="shot-row-body">
                      <aside className="shot-info-panel">
                        <h4>分镜信息</h4>
                        <label>分镜描述</label>
                        <textarea value={shotDescriptions[shot] || ''} onChange={(event) => setShotDescriptions((current) => ({ ...current, [shot]: event.target.value }))} />
                        <div className="shot-field-title"><span>出镜角色</span><button onClick={() => setShotPrompts((current) => ({ ...current, [shot]: (current[shot] || '') + ' @角色' }))}>＋</button></div>
                        <div className="shot-character-row"><div className="shot-avatar error"><ImageIcon size={16} /></div><button onClick={() => setShotPrompts((current) => ({ ...current, [shot]: (current[shot] || '') + ' @塞尔达' }))}>塞尔达 · 塞尔达</button><button onClick={() => setShotPrompts((current) => ({ ...current, [shot]: (current[shot] || '') + ' @塞尔达音色' }))}>未配置音色</button><button onClick={() => setShotPrompts((current) => ({ ...current, [shot]: (current[shot] || '') + ' @角色设置' }))}>...</button></div>
                        <div className="shot-character-row"><div className="shot-avatar">林</div><button onClick={() => setShotPrompts((current) => ({ ...current, [shot]: (current[shot] || '') + ' @林克' }))}>林克 · 林克</button><button onClick={() => setShotPrompts((current) => ({ ...current, [shot]: (current[shot] || '') + ' @林克音色' }))}>未配置音色</button><button onClick={() => setShotPrompts((current) => ({ ...current, [shot]: (current[shot] || '') + ' @角色设置' }))}>...</button></div>
                        <div className="shot-field-title"><span>分镜场景</span><button onClick={() => setShotPrompts((current) => ({ ...current, [shot]: (current[shot] || '') + ' @场景' }))}>＋</button></div>
                        <div className="shot-scene-thumb"><ImageIcon size={34} /></div>
                        <div className="shot-select-row"><button onClick={() => setShotPrompts((current) => ({ ...current, [shot]: (current[shot] || '') + ' @海拉鲁城堡废墟' }))}>海拉鲁城堡废墟...</button><button onClick={() => setShotPrompts((current) => ({ ...current, [shot]: (current[shot] || '') + ' @场景设置' }))}>...</button></div>
                        <div className="shot-field-title"><span>场景道具</span><button onClick={() => setShotPrompts((current) => ({ ...current, [shot]: (current[shot] || '') + ' @道具' }))}>＋</button></div>
                        <div className="shot-empty-props"><Sparkles size={17} />暂未选择道具</div>
                      </aside>

                      <section className="shot-generation-panel">
                        <h4>分镜视频生成</h4>
                        <div className="shot-prompt-box">
                          <div className="shot-prompt-helper"><button onClick={() => setShotPrompts((current) => ({ ...current, [shot]: (current[shot] || '') + ' @素材' }))}>＋</button><span>使用 @ 引用角色、场景、道具、音色及参考素材，编辑更灵活，分镜更精准</span></div>
                          <textarea className="shot-prompt-textarea" value={shotPrompts[shot] || ''} onChange={(event) => setShotPrompts((current) => ({ ...current, [shot]: event.target.value }))} />
                          <div className="shot-generate-controls"><button onClick={cycleShotModel}><Sparkles size={13} />{shotModel}</button><button onClick={cycleShotDuration}>{shotDuration}</button><button onClick={cycleShotSpeed}>{shotSpeed}</button><button onClick={() => setShotPrompts((current) => ({ ...current, [shot]: (current[shot] || '') + ' @' }))}>@</button><button onClick={() => generateShotVideo(shot)} className="shot-cost"><Sparkles size={13} />生成</button></div>
                        </div>
                      </section>

                      <aside className={'shot-preview-panel ' + (generatedShots[shot] ? 'generated' : '')}>
                        <div>
                          <Film size={28} />
                          <span>{generatedShots[shot] ? '分镜' + shot + '已生成预览' : '请完成分镜视频生成'}</span>
                          {generatedShots[shot] && <small>{shotModel} · {shotDuration} · {shotSpeed}</small>}
                        </div>
                      </aside>
                    </div>
                  </article>
                ))}
              </section>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-zinc-100">分镜脚本清单</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  剧集第一集拍摄运镜参数详情，用于导出渲染。
                </p>
              </div>
              <button className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 font-semibold rounded text-xs text-zinc-200 cursor-pointer">
                导出 PDF
              </button>
            </div>

            <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-[#121115]/80 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className={`border-b ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-200 bg-zinc-100'} text-zinc-400 font-bold`}>
                    <th className="p-4 w-16">镜头号</th>
                    <th className="p-4 w-28">画面说明</th>
                    <th className="p-4 w-28">景别/角度</th>
                    <th className="p-4 w-24">镜头运动</th>
                    <th className="p-4">提示词描写</th>
                    <th className="p-4 w-20 text-center">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/10">
                  <tr>
                    <td className="p-4 font-bold font-mono">01</td>
                    <td className="p-4 font-semibold text-zinc-200">李二狗在幽林狂奔</td>
                    <td className="p-4 font-mono">全景 (Wide Angle)</td>
                    <td className="p-4">跟移 (Tracking Shot)</td>
                    <td className="p-4 text-zinc-400">A weary man in ancient rag, running away desperately in misty forest at night...</td>
                    <td className="p-4 text-center"><span className="text-emerald-400 bg-emerald-950/20 font-bold px-2 py-0.5 rounded text-[10px]">已就绪</span></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold font-mono">02</td>
                    <td className="p-4 font-semibold text-zinc-200">枯井旁的阴冷视线</td>
                    <td className="p-4 font-mono">仰角/特写 (Over-shoulder)</td>
                    <td className="p-4">前推 (Push In)</td>
                    <td className="p-4 text-zinc-400">Spooky vintage stone well in a forest under shining moon rays, green glow...</td>
                    <td className="p-4 text-center"><span className="text-amber-400 bg-amber-950/20 font-bold px-2 py-0.5 rounded text-[10px]">渲染中</span></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold font-mono">03</td>
                    <td className="p-4 font-semibold text-zinc-200">李二狗惊惶回头</td>
                    <td className="p-4 font-mono">近景/特写 (Close-up)</td>
                    <td className="p-4">极速摇镜头 (Whip pan)</td>
                    <td className="p-4 text-zinc-400">Terrified facial expression, wet forehead, heavy sweat, ancient chinese garments...</td>
                    <td className="p-4 text-center"><span className="text-zinc-500 bg-zinc-800/30 px-2 py-0.5 rounded text-[10px]">排队中</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACTIVE MAIN SUBTAB Modules - "成片" unified workbench (剧本模式 + 自由模式) */}
        {activeSubTab === '成片' && (
          <div className="final-cut-page animate-fade-in">
            <aside className="final-episode-rail" aria-label="集数">
              <span>集数</span>
              {episodeFolders.slice(0, 5).map((ep, index) => (
                <button key={ep.id} type="button" onClick={() => setActiveShotEpisode(index)} className={activeShotEpisode === index ? 'active' : ''}>
                  {index + 1}
                </button>
              ))}
            </aside>

            <section className="final-cut-main">
              <header className="final-cut-topbar">
                <div>
                  <strong>成片预览</strong>
                  <span>第{activeShotEpisode + 1}集 · 分镜 {Math.min(activeShotEpisode + 1, 4)}</span>
                </div>
                <div className="final-export-actions">
                  <button><Upload size={15} /> 导出</button>
                  <button><Download size={15} /> 下载视频</button>
                </div>
              </header>

              <div className="final-player-card">
                <div className="final-player-stage">
                  <span>分镜 {Math.min(activeShotEpisode + 1, 4)}</span>
                  <button className="final-edit-button"><WandSparkles size={15} /> 编辑</button>
                  <div className="final-player-side">
                    <Volume2 size={18} />
                    <b>1x</b>
                    <Download size={18} />
                  </div>
                </div>
                <div className="final-player-controls">
                  <b>00:03 / 00:08</b>
                  <button>‹</button>
                  <button className="play" onClick={() => setIsPlaying(!isPlaying)}><Play size={18} fill="currentColor" /></button>
                  <button>›</button>
                </div>
              </div>

              <div className="final-module-tabs">
                {(['分镜视频', '配音', '配字幕'] as const).map((module) => (
                  <button key={module} type="button" onClick={() => setFinalModule(module)} className={finalModule === module ? 'active' : ''}>
                    {module === '分镜视频' ? <Film size={15} /> : module === '配音' ? <Volume2 size={15} /> : <FileText size={15} />}
                    {module}
                  </button>
                ))}
              </div>

              <section className="final-timeline-card">
                <div className="final-time-ruler">
                  <span>00:00</span>
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="final-track">
                  {['分镜 1', '分镜 2', '分镜 3', '分镜 4'].map((label, index) => (
                    <button key={label} type="button" onClick={() => setFinalModule('分镜视频')} className={index === 1 ? 'active' : ''}>
                      <span>{label} · 00:02</span>
                      <b><Film size={18} />分镜视频未生成</b>
                    </button>
                  ))}
                </div>
              </section>

              <section className="final-module-panel">
                {finalModule === '分镜视频' && (
                  <div>
                    <h4>分镜视频</h4>
                    <p>查看当前集的分镜片段，支持逐段生成、编辑和替换。</p>
                    <button><Film size={15} /> 生成当前分镜视频</button>
                  </div>
                )}
                {finalModule === '配音' && (
                  <div>
                    <h4>配音</h4>
                    <p>为角色对白绑定音色，生成旁白和对白音轨。</p>
                    <button><Volume2 size={15} /> 进入配音</button>
                  </div>
                )}
                {finalModule === '配字幕' && (
                  <div>
                    <h4>配字幕</h4>
                    <p>编辑字幕文本、时间轴和字幕样式。</p>
                    <button><FileText size={15} /> 进入配字幕</button>
                  </div>
                )}
              </section>
            </section>
          </div>
        )}

      </div>

      {isAddEpisodeOpen && (
        <div className="add-episode-modal-backdrop">
          <div className="add-episode-modal">
            <header>
              <h3>新增剧集</h3>
              <button onClick={() => setIsAddEpisodeOpen(false)} aria-label="关闭"><X size={24} /></button>
            </header>
            <div className="add-episode-card">
              <div className="add-episode-upload-row">
                <label>
                  <Plus size={22} />
                  上传剧本
                  <input
                    type="file"
                    accept=".txt,.doc,.docx,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) => void handleAddEpisodeScriptFile(event.target.files?.[0])}
                  />
                </label>
                <span>{newEpisodeScriptFile ? newEpisodeScriptFile : '仅支持 txt、word 文件，单次导入建议不超过 10 集'}</span>
              </div>
              <textarea
                value={newEpisodeScript}
                onChange={(event) => setNewEpisodeScript(event.target.value)}
                placeholder="请输入剧集内容..."
              />
            </div>
            <footer>
              <span>已输入 {newEpisodeScript.length} 字</span>
              <button onClick={submitScriptEpisode} disabled={!newEpisodeScript.trim() && !newEpisodeScriptFile}>
                提交
              </button>
            </footer>
          </div>
        </div>
      )}

      {isExtractionOpen && (
        <div className="workflow-modal-backdrop">
          <div className="workflow-modal extraction-modal">
            <div className="workflow-modal-title">
              <div><WandSparkles size={19} /><h3>资产提取确认</h3></div>
              <button onClick={() => !isExtracting && setIsExtractionOpen(false)}><X size={18} /></button>
            </div>
            <div className="workflow-modal-body">
              <label>提取方式</label>
              <button type="button" disabled={isExtracting} className="extraction-mode-button">
                <span>智能提取</span>
                <small>识别角色场景道具</small>
                <i>✓</i>
              </button>
              {isExtracting && (
                <div className="extraction-progress">
                  {(['角色', '场景', '道具'] as const).map((stage) => {
                    const stages = ['角色', '场景', '道具'];
                    const currentIndex = stages.indexOf(extractionStage || '角色');
                    const stageIndex = stages.indexOf(stage);
	                    return <div key={stage} className={stageIndex < currentIndex ? 'done' : stage === extractionStage ? 'active' : ''}><span>{stageIndex < currentIndex ? '✓' : stageIndex + 1}</span><p><b>{stage}资产</b><small>{stage === extractionStage ? '正在识别与整理' : stageIndex < currentIndex ? '提取完成' : '等待执行'}</small></p></div>;
                  })}
                </div>
              )}
            </div>
            <div className="workflow-modal-actions">
              <button disabled={isExtracting} onClick={() => setIsExtractionOpen(false)}>取消</button>
              <button onClick={startSubjectExtraction} disabled={isExtracting} className="confirm">
                {isExtracting ? `提取${extractionStage || ''}中...` : '开始提取'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBatchOpen && (
        <div className="workflow-modal-backdrop">
          <div className="workflow-modal batch-modal">
            <div className="workflow-modal-title">
              <div><Boxes size={19} /><h3>批量生成</h3></div>
              <button onClick={() => setIsBatchOpen(false)}><X size={18} /></button>
            </div>
            <div className="batch-asset-list">
              {allAssets.map((item) => {
                const selected = selectedAssets.includes(item.id);
                const configured = configuredAssetIds.includes(item.id);
                return (
                  <button key={item.id} disabled={configured} onClick={() => setSelectedAssets(selected ? selectedAssets.filter((id) => id !== item.id) : [...selectedAssets, item.id])} className={`${selected ? 'selected' : ''} ${configured ? 'configured' : ''}`}>
                    <span className="batch-checkbox">{selected ? '✓' : ''}</span>
                    <img src={item.image} alt="" referrerPolicy="no-referrer" />
                    <span className="batch-copy"><b>{item.name}</b><small>{item.description}</small></span>
                    <span className={`batch-status ${configured ? 'locked' : ''}`}>{configured ? '已完成设定，不支持批量生成' : selected ? '已选择' : '待生成'}</span>
                  </button>
                );
              })}
            </div>
            <div className="batch-modal-footer">
              <button className="model-select compact"><span><Sparkles size={13} /> Seedream-5.0-lite</span><span>⌄</span></button>
              <div>
                <button onClick={() => setSelectedAssets(batchReadyAssets.map((item) => item.id))}>全选</button>
                <button onClick={() => setIsBatchOpen(false)}>取消</button>
                <button className="confirm" disabled={selectedAssets.length === 0}><Sparkles size={14} /> {selectedAssets.length}</button>
              </div>
            </div>
          </div>
        </div>
      )}

	      {voicePickerTargetId && (
        <div className="voice-modal-backdrop">
          <div className="voice-modal">
            <div className="voice-modal-header">
              <h3>选择配音音色</h3>
              <button onClick={() => setVoicePickerTargetId(null)} aria-label="关闭"><X size={32} /></button>
            </div>

            <div className="voice-search-bar">
              <select
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value as typeof voiceLanguage)}
                className="voice-filter-select"
                aria-label="语言筛选"
              >
                <option value="中文音色">中文音色</option>
                <option value="英文音色">英文音色</option>
                <option value="日文音色">日文音色</option>
              </select>
              <input
                placeholder="搜索音色"
                value={voiceSearch}
                onChange={(e) => setVoiceSearch(e.target.value)}
                aria-label="搜索音色"
              />
              <button className="voice-search-submit">搜索</button>
              <div className="voice-filter-spacer" />
              <select
                value={voiceGender}
                onChange={(e) => setVoiceGender(e.target.value as typeof voiceGender)}
                className="voice-filter-select"
                aria-label="性别筛选"
              >
                <option value="全部">性别（全部）</option>
                <option value="女性">女性</option>
                <option value="男性">男性</option>
                <option value="中性">中性</option>
              </select>
              <select
                value={voiceAge}
                onChange={(e) => setVoiceAge(e.target.value as typeof voiceAge)}
                className="voice-filter-select"
                aria-label="年龄筛选"
              >
                <option value="全部">年龄（全部）</option>
                <option value="儿童">儿童</option>
                <option value="青少年">青少年</option>
                <option value="青年">青年</option>
                <option value="中年">中年</option>
                <option value="老年">老年</option>
              </select>
            </div>

            <div className="voice-option-grid">
              {filteredVoiceOptions.length > 0 ? (
                filteredVoiceOptions.map((voice) => (
                  <button key={voice.id} className="voice-option-card" onClick={() => bindVoiceToRole(voicePickerTargetId, voice.name)}>
                    <span className="voice-play"><Play size={18} fill="currentColor" /></span>
                    <span className="voice-option-copy">
                      <b>{voice.name}</b>
                      <small><i>{voice.gender}</i><i>{voice.age}</i></small>
                    </span>
                  </button>
                ))
              ) : (
                <div className="voice-empty-state">
                  <p>未找到匹配的音色</p>
                  <button
                    onClick={() => { setVoiceSearch(''); setVoiceGender('全部'); setVoiceAge('全部'); }}
                    className="voice-empty-reset"
                  >
                    重置筛选条件
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

	      {voiceUploadTargetId && (
	        <div className="workflow-modal-backdrop">
	          <div className="workflow-modal voice-upload-modal">
	            <div className="workflow-modal-title">
	              <div><Mic2 size={19} /><h3>上传自定义音色</h3></div>
	              <button onClick={() => setVoiceUploadTargetId(null)}><X size={18} /></button>
	            </div>
	            <div className="workflow-modal-body">
	              <div className="voice-upload-dropzone">
	                <Upload size={24} />
	                <strong>上传人声音频文件</strong>
	                <p>请上传清晰的人声音频文件，格式为 MP3 或 WAV，文件大小不能超过 10MB，超过 5 秒将自动裁剪。</p>
	                <label>
	                  选择音频
	                  <input
	                    type="file"
	                    accept=".mp3,.wav,audio/mpeg,audio/wav"
	                    onChange={(event) => handleVoiceUpload(event.target.files?.[0])}
	                  />
	                </label>
	              </div>
	            </div>
	            <div className="workflow-modal-actions">
	              <button onClick={() => setVoiceUploadTargetId(null)}>取消</button>
	              <button className="confirm" onClick={() => setVoiceUploadTargetId(null)}>稍后上传</button>
	            </div>
	          </div>
	        </div>
	      )}
	    </div>
	  );
	}
