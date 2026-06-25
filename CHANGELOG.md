# Changelog

本项目所有重要变更均会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 计划中

- 集成 Aholo Viewer（3DGS 真实场景渲染 + 体素碰撞检测）
- 集成 Qwen-Image-Edit-2511-Multiple-Angles-LoRA（机位参数 → 多视角参考图）
- 运镜关键帧路径系统
- 运镜参数导出至视频生成模型（Seedance 2.0 等）

---

## [1.3.0] - 2026-06-25

### 主题：3D 导演工作台 · React Three Fiber 真实 3D 构图与机位调度

### Added

- **导演工作台模块**（`src/director/`）—— 全新 3D 构图与机位调度工具，对标 LibTV 导演台
  - 基于 React Three Fiber 9 + @react-three/drei 10 + Three.js 0.182 实现真实 3D 渲染
  - 7 种体型人体素模（健壮/标准/纤细 × 成人/儿童 + 模特）+ 4 种姿势（站立/招手/奔跑/坐姿）
  - 基础几何体（立方体/球体/圆柱体）+ GLB/glTF 本地模型导入与自动归一化
  - 机位管理：预设机位（正面/俯视/侧前 45°/侧面）、FOV 焦距调节、注视目标绑定角色跟随
  - 多比例截图裁剪（16:9 / 9:16 / 1:1 / 4:3 / 3:4）+ 异步上传到项目服务
  - 全景背景球：全景图上传 + 普通图转全景 + 旋转/半径调节 + 历史记录
  - 群众阵列生成器：行 × 列网格配置 + 间距调节 + 自动打组
  - 分组管理：打组/解组 + Three.js Quaternion 组内联动变换
  - 撤销/重做系统：50 步历史栈（structuredClone 快照）+ ⌘Z / ⇧⌘Z 快捷键
  - 无限画布节点展示：导演台节点 + 截图节点 + SVG 贝塞尔连线 + 缩略地图
  - WebGL 检测 + 友好降级页（GraphicsUnsupported 组件）
- **云端同步引擎**（ProjectSync 组件）
  - 800ms 防抖自动保存 + 浅比较签名优化
  - 乐观锁冲突检测（If-Match revision + 409 自动重试）
  - 离线模式：指数退避重试（2s → 15s max）+ online 事件恢复同步
  - visibilitychange 事件触发页面隐藏即时保存
- **Node.js HTTP 后端服务**（`server/`）
  - 项目数据 CRUD API + 二进制资产存储
  - CORS 支持 + 16MB body limit
  - 文件存储引擎（`storage.mjs`）
- **性能自适应策略**
  - 对象 ≤24：高质量模式（阴影 + 抗锯齿 + DPR 1.7）
  - 对象 >24：性能模式（InstancedMesh 合并 + 关闭阴影 + DPR 1）
- **导演工作台技术方案文档**（`docs/导演工作台技术方案.md`）
  - 12 项核心能力清单 + 9 个子模块详解
  - 技术架构图（当前 R3F + 目标 Aholo Viewer）
  - 数据模型 TypeScript 类型定义
  - 5 项技术决策说明
  - 4 阶段实施路径（Phase 1 已完成 / Phase 2-4 规划中）

### Changed

- 技术栈扩展：新增 React Three Fiber、@react-three/drei、Three.js、Zustand 依赖
- 应用路由支持 `#/director`（导演台）与 `#/canvas`（画布）双入口
- `scripts/dev.mjs` 开发脚本同时启动 Web 与 API 服务

---

## [1.2.0] - 2026-06-23

### 主题：统一成片工作台 + 暗房霓虹设计系统 + 可访问性达标

### Added

- 建立暗房霓虹（Darkroom Neon）设计系统：Moss Lime 主色 `#c0cf62` + Sora/Hanken Grotesk/JetBrains Mono 字体
- 全站语义 Token 体系（accent / surface / border / text-primary 等），支持暗色/亮色双主题
- 剧本模式与自由模式成片页面统一为「统一工作台」（集数导航 + 播放器 + 模块 Tab + 时间轴 + 导出）
- 删除项目自定义危险确认模态（替代原生 confirm）
- 配音弹窗四维筛选器（语言 / 搜索 / 性别 / 年龄）+ 空状态 + 重置
- 创建表单新增「项目简介」字段 + `isSubmitting` 防重复提交
- Tab 导航 ARIA tablist 语义 + 键盘左右箭头切换
- 全局 `focus-visible` 焦点环（WCAG 2.4.7）
- 全局 `prefers-reduced-motion` 减弱动效覆盖

### Changed

- 110 处硬编码颜色值替换为设计 Token
- 成片页面主色调从靛蓝统一为 Moss Lime，适配暗色主题
- 资产 Tab 不再强制拦截，先切换页面再展示提取入口
- 图标按钮补全 `aria-label`

### Removed

- 概览页 Agent 生产进度可视化模块（后续版本视接口能力再评估）
- 分镜 Tab 不可达死代码（69 行）

---

## [1.1.0] - 2026-06-15

### 主题：双模式差异 + Agent 流程定义 + 验收标准

### Added

- 定义剧本模式与自由模式的完整创作流程
- 定义四大 Agent 职责（剧本解析 / 资产生成 / 分镜生成 / 成片合成）
- 补充漫剧制作业务流程图与双模式差异说明
- 项目列表、创建项目、资产、分镜、成片基础流程
- 截图说明与验收标准

---

## [1.0.0] - 2026-06-15

### 主题：初版发布

### Added

- 项目列表页：项目卡片、筛选、创建入口
- 创建项目：剧本模式 / 自由模式选择、剧本上传、集数填写
- 项目详情：顶部 Tab 导航（概览 / 剧本 / 资产 / 分镜 / 成片）
- 资产管理：角色、场景、道具、音色绑定
- 分镜制作：集数切换、分镜编辑、提示词、视频生成
- 基础成片流程：合成状态、预览入口、导出准备
