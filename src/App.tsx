/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import DirectorApp from './director/DirectorApp';
import { INITIAL_PROJECTS } from './data';
import { Project, SidebarTab, ThemeMode } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('项目');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectInitialTab, setProjectInitialTab] = useState<'概览' | '剧本'>('概览');
  const [notice, setNotice] = useState<string | null>(null);
  const [directorFullscreen, setDirectorFullscreen] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleSelectTab = (tab: SidebarTab) => {
    if (tab === '导演台') {
      setActiveTab('导演台');
      setSelectedProjectId(null);
      setDirectorFullscreen(true);
      return;
    }
    if (tab !== '项目') {
      setNotice(`${tab}功能正在开发中，敬请期待`);
      return;
    }
    setActiveTab('项目');
    setSelectedProjectId(null);
  };

  const handleCreateProject = (newProject: Omit<Project, 'id' | 'createdAt' | 'episodes' | 'episodesCount' | 'assets' | 'computeSpent' | 'todaySpent' | 'memberStats' | 'activities'>) => {
    const now = Date.now();
    const creator = newProject.members[0] || '你';
    const plannedEpisodesCount = Math.max(1, Math.min(200, newProject.plannedEpisodesCount || 3));
    const freshProject: Project = {
      ...newProject,
      id: `custom-${now}`,
      createdAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleTimeString('zh-CN', { hour12: false })} 创建`,
      episodesCount: plannedEpisodesCount,
      episodes: Array.from({ length: plannedEpisodesCount }, (_, index) => index + 1).map((number) => ({
        id: `ep-${now}-${number}`,
        number,
        title: `第${number}集：待创作`,
        status: '初始状态',
        progress: 0,
      })),
      assets: { total: 4, characters: 2, scenes: 1, props: 1 },
      computeSpent: 0,
      todaySpent: 0,
      memberStats: [{ rank: 1, name: creator, avatarLetter: creator[0], computeCost: 0, outputSummary: '图片 0 / 视频 0 / 时长 0s' }],
      activities: [{ id: `act-${now}`, user: creator, action: '创建了该短剧项目', timeLabel: '刚刚', type: 'script' }],
    };
    setProjects((current) => [freshProject, ...current]);
    setProjectInitialTab(newProject.projectType === '自由模式' ? '概览' : '剧本');
    setSelectedProjectId(freshProject.id);
  };

  const currentProject = projects.find((project) => project.id === selectedProjectId);

  // 导演台全屏模式：覆盖整个视口，独立于主框架
  if (directorFullscreen) {
    return (
      <div className={`app-shell director-host ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
        <DirectorApp onExit={() => {
          setDirectorFullscreen(false);
          setActiveTab('项目');
        }} />
        <button
          className="director-exit-btn"
          onClick={() => {
            setDirectorFullscreen(false);
            setActiveTab('项目');
          }}
          title="返回主控台"
        >
          <ArrowLeft size={16} /> 返回主控台
        </button>
      </div>
    );
  }

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <Sidebar
        activeTab={activeTab}
        onChangeTab={handleSelectTab}
        theme={theme}
        toggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
      />

      <main
        className="workspace"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
          event.currentTarget.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
        }}
      >
        <div className="tech-grid" aria-hidden="true" />
        <div className="pointer-aura" aria-hidden="true" />
        <div className="workspace-content">
          {selectedProjectId && currentProject ? (
            <ProjectDetail
              project={currentProject}
              theme={theme}
              initialTab={projectInitialTab}
              onBack={() => setSelectedProjectId(null)}
              onRenameProject={(id, name) => setProjects((current) => current.map((project) => project.id === id ? { ...project, name } : project))}
            />
          ) : (
            <ProjectList
              projects={projects}
              theme={theme}
              onSelectProject={(id) => {
                setProjectInitialTab('概览');
                setSelectedProjectId(id);
              }}
              onCreateProject={handleCreateProject}
              onDeleteProject={(id) => setProjects((current) => current.filter((project) => project.id !== id))}
              onRenameProject={(id, name) => setProjects((current) => current.map((project) => project.id === id ? { ...project, name } : project))}
              onUpdateProjectMembers={(id, members) => setProjects((current) => current.map((project) => project.id === id ? { ...project, members } : project))}
            />
          )}
        </div>
      </main>

      {notice && (
        <div className="development-toast" role="status">
          <div className="development-toast-icon"><CheckCircle2 size={18} /></div>
          <div>
            <strong>功能建设中</strong>
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} aria-label="关闭提示"><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
