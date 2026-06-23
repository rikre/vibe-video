---
name: Synthetic Motion v2 — Neon Glow
colors:
  surface: '#0c0e08'
  surface-dim: '#0c0e08'
  surface-bright: '#333a22'
  surface-container-lowest: '#070905'
  surface-container-low: '#11140b'
  surface-container: '#161a0f'
  surface-container-high: '#1f2414'
  surface-container-highest: '#2a301b'
  on-surface: '#e9eed9'
  on-surface-variant: '#b9c2a2'
  inverse-surface: '#e9eed9'
  inverse-on-surface: '#2b3120'
  outline: '#8b9376'
  outline-variant: '#3b4228'
  surface-tint: '#c0cf62'
  primary: '#c0cf62'
  primary-glow: '#d9f43c'
  on-primary: '#232c00'
  primary-container: '#dceb7b'
  on-primary-container: '#5e6a00'
  inverse-primary: '#596400'
  secondary: '#bcc78c'
  on-secondary: '#2c3309'
  secondary-container: '#39411e'
  on-secondary-container: '#dfe8ac'
  tertiary: '#d9f43c'
  on-tertiary: '#232c00'
  tertiary-container: '#2c3a0a'
  on-tertiary-container: '#e4ff7a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dceb7b'
  primary-fixed-dim: '#c0cf62'
  on-primary-fixed: '#191e00'
  on-primary-fixed-variant: '#424b00'
  secondary-fixed: '#e1e7b1'
  secondary-fixed-dim: '#bcc78c'
  on-secondary-fixed: '#191e00'
  on-secondary-fixed-variant: '#39411e'
  tertiary-fixed: '#e4ff7a'
  tertiary-fixed-dim: '#d9f43c'
  on-tertiary-fixed: '#161d00'
  on-tertiary-fixed-variant: '#2c3a0a'
  background: '#0c0e08'
  on-background: '#e9eed9'
  surface-variant: '#2a301b'
  glow: 'rgba(217,244,60,0.35)'
  glow-soft: 'rgba(217,244,60,0.14)'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Jetbrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Jetbrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.08em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  card: 0.625rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 24px
  panel-width: 320px
  timeline-height: 240px
---

## Brand & Style

面向 AI 漫剧创作的专业 To B 工作台。品牌人格：专业、精密、面向未来 — 一台为漫剧团队打造的「工业级生成设备」。

视觉风格为 **暗房霓虹（Neon Glow on Dark Chamber）**：深绿黑基底让漫剧画面成为绝对主角；莱姆霓虹辉光作为唯一的「能量信号」，标记 AI 正在工作的位置；玻璃质感卡片与径向光晕渐变营造深度，而非传统投影。

## Colors

本设计系统原生 **Dark Mode**。v2 围绕参考方向「霓虹辉光」融合：主色家族（Moss Lime）保持不变，基底与辉光层级重构。

- **Primary（Moss Lime）：** `#c0cf62` 保持不变，用于主按钮填充、激活态、成功指示。
- **Primary Glow（霓虹莱姆）：** 新增 `#d9f43c` — 专用于辉光特效层：文字发光高亮、按钮 glow、图表描边、评分环、playhead。永远伴随 `glow` 阴影出现，不单独做大面积填充。
- **Secondary（Olive）：** `#bcc78c` / 容器 `#39411e`，用于次级标签、时间轴片段、非激活工具。
- **Neutrals：** 基底从橄榄暖灰加深为绿黑「暗房」色（`#0c0e08` 起步），层级间保持微弱绿调倾向，与霓虹莱姆同一色相家族，画面更统一。
- **Tertiary：** 与 Primary Glow 合并为霓虹层级（原 Frost Blue 移除），技术读数统一用霓虹莱姆或 on-surface-variant。

## Gradients & Glow（v2 新增）

参考图提取的特效语言，全部基于霓虹莱姆单色相：

- **径向光晕（Halo）：** `radial-gradient(ellipse, rgba(217,244,60,0.35) 0%, rgba(217,244,60,0.10) 40%, transparent 70%)`，置于 hero 视觉、当前生成中的画面卡背后；可叠加 `filter: blur(6px)`。每屏最多 1–2 处，光晕即视觉焦点。
- **辉光阴影（Glow shadow）：** 交互元素激活态 `box-shadow: 0 0 22px rgba(217,244,60,0.35)`；小元素（slider thumb、状态点）用 `0 0 8px`。
- **文字辉光：** 仅限 display 级标题中的强调词：`color: #d9f43c; text-shadow: 0 0 18px glow, 0 0 42px glow-soft`。
- **按钮渐变：** 主按钮 `linear-gradient(180deg, #d9f43c, #c0cf62)` + `inset 0 1px 0 rgba(255,255,255,0.45)` 顶部高光，模拟发光硬件按键。
- **图表发光：** 折线/曲线 stroke 用 `#d9f43c` + `drop-shadow(0 0 5px glow)`，下方填充 `linear-gradient(rgba(217,244,60,0.30) → transparent)`。

## Typography

不变：**Sora**（标题）、**Hanken Grotesk**（正文）、**JetBrains Mono**（数据/标签，label-sm 全大写）。中文场景下回退 **Noto Sans SC**。

## Layout & Spacing

不变：模块化面板网格 — 320px 固定侧栏、流式中央画布、240px 底部时间轴；4px 基线，常用 16px / 24px。

## Elevation & Depth

层级通过 **玻璃质感 + 光晕** 建立，不使用传统投影。

- **Level 0（背景）：** `#0c0e08` 绿黑暗房色。
- **Level 1（玻璃卡片）：** `background: linear-gradient(165deg, rgba(255,255,255,0.055), rgba(255,255,255,0.012))` + `border: 1px solid rgba(255,255,255,0.09)` + `border-radius: 10px`。
- **Level 2（浮层/模态）：** 同上 + `backdrop-filter: blur(12px)`。
- **激活/生成中：** 描边升级为 `rgba(217,244,60,0.22)` + 背后径向光晕 — 「正在发光的卡片 = AI 正在工作」。

## Shapes

- **基础圆角：** 4px（输入框、小按钮）；**卡片：** 10px；**胶囊：** 仅状态标签与主操作按钮。

## Components

- **Buttons：** 主按钮霓虹渐变胶囊 + glow；次级按钮 ghost 描边 + `rgba(255,255,255,0.03)` 微填充。
- **玻璃卡片：** 见 Elevation；hover 时描边亮度 +50%，光晕淡入。
- **Input Fields：** 基底色 `#070905`，JetBrains Mono 文本，聚焦态 1px `#d9f43c` 描边。
- **AI-Status：** 生成中 = 霓虹莱姆呼吸点（pulse）+ 胶囊容器；成功 = Moss Lime；错误 = 静音红。
- **Sliders：** 暗轨 + 霓虹莱姆 thumb（带 8px glow）+ 右侧 mono 数值读出（霓虹色）。
- **Timeline：** 斑马条纹轨道；片段左缘 2px 莱姆描边；playhead 为 1px 霓虹线 + glow。
- **评分环/进度环：** `conic-gradient(#d9f43c …)` + 24px glow。
