/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, User, MoreHorizontal, Video, Image as ImageIcon, Plus, Trash2, Edit3, X, Sparkles, Check, ChevronDown, ChevronUp, UserPlus, Upload, FileText, FolderKanban, ArrowDownUp, Share2, Coins } from 'lucide-react';
import { Project, ThemeMode } from '../types';
import { ALL_MEMBERS } from '../data';
import emptyProjectMascot from '../assets/images/empty-project-mascot.png';

interface ProjectListProps {
  projects: Project[];
  theme: ThemeMode;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'episodes' | 'episodesCount' | 'assets' | 'computeSpent' | 'todaySpent' | 'memberStats' | 'activities'>) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onUpdateProjectMembers?: (projectId: string, members: string[]) => void;
}

export default function ProjectList({
  projects,
  theme,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  onUpdateProjectMembers,
}: ProjectListProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [memberFilterMode, setMemberFilterMode] = useState<'所有成员' | '由我创建'>('所有成员');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [ownershipFilter, setOwnershipFilter] = useState<'全部' | '我创建的' | '我协作的'>('全部');
  
  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectType, setNewProjectType] = useState<'剧本模式' | '自由模式'>('剧本模式');
  const [newProjectEpisodesCount, setNewProjectEpisodesCount] = useState(3);
  const [newProjectCoverType, setNewProjectCoverType] = useState<'gradient' | 'image'>('gradient');
  const [newProjectMembers, setNewProjectMembers] = useState<string[]>(['常谦', '张三']);
  
  // Script Upload state
  const [uploadedScriptFile, setUploadedScriptFile] = useState<{ name: string; size: string; content?: string } | null>(null);
  const [isScriptDragging, setIsScriptDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScriptDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsScriptDragging(true);
  };

  const handleScriptDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsScriptDragging(false);
  };

  const captureScriptFile = async (file: File) => {
    const sizeStr = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    const canReadText = file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt');
    const content = canReadText ? await file.text() : undefined;
    setUploadedScriptFile({ name: file.name, size: sizeStr, content });
  };

  const handleScriptDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsScriptDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void captureScriptFile(e.dataTransfer.files[0]);
    }
  };

  const handleScriptFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void captureScriptFile(e.target.files[0]);
    }
  };

  const handleRemoveScriptFile = () => {
    setUploadedScriptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Custom dialog or inputs for other actions
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Invite Dialog State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteProject, setInviteProject] = useState<Project | null>(null);
  const [selectedInviteMembers, setSelectedInviteMembers] = useState<string[]>([]);

  // Delete Dialog State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const startDeleteFlow = (project: Project) => {
    setDeleteTarget(project);
    setIsDeleteOpen(true);
    setActiveDropdown(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDeleteProject(deleteTarget.id);
    }
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  const startInviteFlow = (project: Project) => {
    setInviteProject(project);
    setSelectedInviteMembers([]);
    setIsInviteOpen(true);
    setActiveDropdown(null);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteProject) return;
    const updatedMembers = [...inviteProject.members, ...selectedInviteMembers];
    if (onUpdateProjectMembers) {
      onUpdateProjectMembers(inviteProject.id, updatedMembers);
    }
    setIsInviteOpen(false);
    setInviteProject(null);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target as Node)) {
        setIsMemberDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const keyword = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !keyword ||
      project.name.toLowerCase().includes(keyword) ||
      project.members.some((member) => member.toLowerCase().includes(keyword));
    const matchesMember =
      memberFilterMode === '所有成员' ||
      project.members.includes('常谦') ||
      project.id.startsWith('custom-');
    const createdByMe = project.members[0] === '常谦' || project.id.startsWith('custom-');
    const matchesOwnership =
      ownershipFilter === '全部' ||
      (ownershipFilter === '我创建的' ? createdByMe : !createdByMe);
    return matchesSearch && matchesMember && matchesOwnership;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!newProjectName.trim()) return;
    if (newProjectType === '剧本模式' && !uploadedScriptFile) return;
    if (newProjectType === '自由模式' && (!Number.isFinite(newProjectEpisodesCount) || newProjectEpisodesCount < 1)) return;
    
    setIsSubmitting(true);
    
    onCreateProject({
      name: newProjectName,
      tag: '创作中',
      coverType: newProjectCoverType,
      members: newProjectMembers,
      description: newProjectDesc || '新创建的短剧项目概括描述。',
      projectType: newProjectType,
      plannedEpisodesCount: newProjectType === '自由模式' ? newProjectEpisodesCount : undefined,
      scriptFileName: uploadedScriptFile?.name,
      scriptContent: uploadedScriptFile?.content,
      coverUrl: newProjectCoverType === 'image' 
        ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop'
        : undefined,
    });

    // Reset and close
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectCoverType('gradient');
    setNewProjectType('剧本模式');
    setNewProjectEpisodesCount(3);
    setNewProjectMembers(['常谦', '张三']);
    setUploadedScriptFile(null);
    setIsCreateOpen(false);
    setIsSubmitting(false);
  };

  const startRenameFlow = (project: Project) => {
    setRenameTargetId(project.id);
    setRenameValue(project.name);
    setIsRenameOpen(true);
    setActiveDropdown(null);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameTargetId && renameValue.trim()) {
      onRenameProject(renameTargetId, renameValue.trim());
      setIsRenameOpen(false);
      setRenameTargetId(null);
    }
  };

  const formatProjectDate = (createdAt: string) => {
    const normalized = createdAt.replace(' 创建', '').replace(' ', 'T');
    const timestamp = new Date(normalized).getTime();
    if (Number.isNaN(timestamp)) return createdAt.replace(' 创建', '').slice(5, 10);

    const diffDays = Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
    if (diffDays === 0) return '今天';
    if (diffDays < 30) return diffDays + '天前';
    if (diffDays < 365) return Math.floor(diffDays / 30) + '个月前';
    return Math.floor(diffDays / 365) + '年前';
  };
  const createdProjectsCount = projects.filter((project) => project.members[0] === '常谦' || project.id.startsWith('custom-')).length;
  const collaboratedProjectsCount = projects.length - createdProjectsCount;

  return (
    <div className={`project-library flex-1 min-h-screen px-6 md:px-10 py-8 transition-theme ${
      theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'
    }`}>
      <section className="project-board-toolbar" id="projects-board-toolbar">
        <div className="ownership-tabs">
          <button type="button" onClick={() => setOwnershipFilter('全部')} className={ownershipFilter === '全部' ? 'active' : ''}>
            全部 ({projects.length})
          </button>
          <button type="button" onClick={() => setOwnershipFilter('我创建的')} className={ownershipFilter === '我创建的' ? 'active' : ''}>
            我创建的 ({createdProjectsCount})
          </button>
          <button type="button" onClick={() => setOwnershipFilter('我协作的')} className={ownershipFilter === '我协作的' ? 'active' : ''}>
            我协作的 ({collaboratedProjectsCount})
          </button>
        </div>

        <div className="project-board-actions">
          <div className="board-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="搜索项目名称或制作人员"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && <button onClick={() => setSearchTerm('')}>清除</button>}
          </div>
          <button className="board-sort-button" type="button"><ArrowDownUp size={14} />按修改时间</button>
          <button className="board-folder-button" type="button" onClick={() => setIsCreateOpen(true)}><Plus size={14} />创建项目</button>
        </div>
      </section>

      <section className="project-command-center">
        <div className="command-count-card">
          <span>项目数量</span>
          <strong>{projects.length}</strong>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="primary-action command-create-action" id="btn-create-project">
          <Plus size={16} />新增项目
        </button>
      </section>

      <div className="project-toolbar flex flex-col md:flex-row md:items-center gap-3 mb-8 w-full" id="projects-filter-bar">
        {/* 1. Search Box */}
        <div className="relative flex-1">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${
            theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
          }`} />
          <input
            type="text"
            placeholder="搜索短剧项目名称"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border outline-none transition-all ${
              theme === 'dark' 
                ? 'bg-[#151419]/60 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700 focus:bg-[#151419]' 
                : 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:border-zinc-300'
            }`}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs"
            >
              清除
            </button>
          )}
        </div>

        <div className="relative" ref={memberDropdownRef}>
          <button
            type="button"
            onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
            id="member-dropdown-trigger"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm cursor-pointer select-none transition-all ${
              isMemberDropdownOpen 
                ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] bg-[#fbfbfb] dark:bg-[#1a191e]'
                : (theme === 'dark' ? 'bg-[#151419]/60 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-300')
            }`}
          >
            <User className={`w-4 h-4 ${isMemberDropdownOpen ? 'text-[var(--accent)]' : 'text-zinc-400'}`} />
            <span className={`font-medium ${isMemberDropdownOpen ? (theme === 'dark' ? 'text-white' : 'text-zinc-900') : (theme === 'dark' ? 'text-zinc-350' : 'text-zinc-650')}`}>
              {memberFilterMode}
            </span>
            {isMemberDropdownOpen ? (
              <ChevronUp className="w-3.5 h-3.5 ml-1 text-[var(--accent)]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-1 text-zinc-400" />
            )}
          </button>

          {isMemberDropdownOpen && (
            <div
              id="member-dropdown-menu"
              className={`absolute right-0 top-full mt-2 z-30 w-44 py-1.5 rounded-xl shadow-xl border animate-fade-in ${
                theme === 'dark' 
                  ? 'bg-[#141317] border-zinc-800 text-zinc-250' 
                  : 'bg-white border-zinc-200 text-zinc-700'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setMemberFilterMode('所有成员');
                  setIsMemberDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-4.5 py-2.5 text-left text-sm cursor-pointer transition-colors ${
                  memberFilterMode === '所有成员'
                    ? (theme === 'dark' ? 'bg-[#1a191e]/80 text-[var(--accent)] font-semibold' : 'bg-zinc-100/70 text-[var(--accent)] font-semibold')
                    : (theme === 'dark' ? 'hover:bg-zinc-800/40 text-zinc-300' : 'hover:bg-zinc-50 text-zinc-700')
                }`}
              >
                <User className="w-4 h-4 shrink-0 text-zinc-400" />
                所有成员
              </button>
              <button
                type="button"
                onClick={() => {
                  setMemberFilterMode('由我创建');
                  setIsMemberDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-4.5 py-2.5 text-left text-sm cursor-pointer transition-colors ${
                  memberFilterMode === '由我创建'
                    ? (theme === 'dark' ? 'bg-[#1a191e]/80 text-[var(--accent)] font-semibold' : 'bg-zinc-100/70 text-[var(--accent)] font-semibold')
                    : (theme === 'dark' ? 'hover:bg-zinc-800/40 text-zinc-300' : 'hover:bg-zinc-50 text-zinc-700')
                }`}
              >
                <User className="w-4 h-4 shrink-0 text-zinc-400" />
                由我创建
              </button>
            </div>
          )}
        </div>

      </div>

      <div className="project-section-heading">
        <div><FolderKanban size={14} /><span>项目列表</span><b>{filteredProjects.length}</b></div>
        <span>按最近创作上下文排列</span>
      </div>
      <div className="project-list" id="projects-grid">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            id={`project-card-${project.id}`}
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty('--card-x', `${event.clientX - rect.left}px`);
              event.currentTarget.style.setProperty('--card-y', `${event.clientY - rect.top}px`);
            }}
            className={`project-card group relative overflow-hidden transition-all duration-200 border flex flex-col ${
              theme === 'dark' 
                ? 'bg-[#141317]/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-[#141317]' 
                : 'bg-white border-zinc-200 hover:border-zinc-300'
            }`}
          >
            {/* Card Thumbnail Area */}
            <div 
              onClick={() => onSelectProject(project.id)}
              className="project-cover aspect-video w-full relative overflow-hidden cursor-pointer group shrink-0"
            >
              {project.coverType === 'image' && project.coverUrl ? (
                <img
                  src={project.coverUrl}
                  alt={project.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                /* Dynamic film placeholder cyan-to-dark blue gradient layout */
                <div className="w-full h-full bg-gradient-to-tr from-cyan-300/40 via-blue-400/30 to-purple-400/20 flex items-center justify-center relative">
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                    <Video className="w-8 h-8 text-white/80" />
                  </div>
                </div>
              )}

              {/* Cover overlays */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
              <span className="project-canvas-pill">{project.episodesCount}集</span>
            </div>

            {/* Title / Info row */}
            <div className="project-card-body p-4 flex flex-col justify-between flex-1 min-w-0">
              <div className="flex justify-between items-start gap-3">
                <div 
                  onClick={() => onSelectProject(project.id)}
                  className="cursor-pointer min-w-0"
                >
                  <h3 className={`project-cover-title text-[15px] font-semibold tracking-tight transition-colors truncate ${
                      theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
                    }`}>{project.name}</h3>
                </div>

                {/* Dropdown controls with ref */}
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === project.id ? null : project.id)}
                    className={`p-2 rounded-full cursor-pointer hover:bg-zinc-800/10 transition-colors ${
                      theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'
                    }`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {/* Actions Dropdown exactly like Image 1 popup */}
                  {activeDropdown === project.id && (
                    <div
                      ref={dropdownRef}
                      className={`absolute right-0 top-9 z-[80] w-40 py-1 rounded-lg shadow-xl border animate-fade-in project-action-menu ${
                        theme === 'dark' 
                          ? 'bg-[#18171b] border-zinc-800 text-zinc-300' 
                          : 'bg-white border-zinc-200 text-zinc-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => startRenameFlow(project)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs cursor-pointer hover:bg-zinc-800/20`}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        编辑名称
                      </button>
                      <button
                        type="button"
                        onClick={() => startInviteFlow(project)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs cursor-pointer hover:bg-zinc-800/20`}
                      >
                        <Share2 className="w-3.5 h-3.5 text-var(--accent)" />
                        邀请分享
                      </button>
                      <button
                        type="button"
                        onClick={() => startDeleteFlow(project)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-rose-500 cursor-pointer hover:bg-zinc-800/20`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        删除项目
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="project-card-meta-row">
                <span>修改于{formatProjectDate(project.createdAt)}</span>
                <strong><Coins size={12} /> {project.computeSpent}</strong>
              </div>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="project-empty-state col-span-full">
            <div className="empty-state-glow" aria-hidden="true" />
            <img src={emptyProjectMascot} alt="" className="empty-state-mascot" />
            <h3>{projects.length === 0 ? '这里在等你的第一部' : '没有找到匹配的项目'}</h3>
            <p>{projects.length === 0 ? '从一个想法开始，创建你的第一个短剧项目。' : '试试调整搜索关键词或成员筛选。'}</p>
            {projects.length === 0 && (
              <button onClick={() => setIsCreateOpen(true)} className="empty-state-action">
                <Plus size={16} />
                创建第一个项目
              </button>
            )}
          </div>
        )}
      </div>

      {/* 1. Modal: Rename Project */}
      {isRenameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl animate-fade-in ${
            theme === 'dark' ? 'bg-[#141317] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">编辑项目名称</h3>
              <button onClick={() => setIsRenameOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRenameSubmit}>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border outline-none transition-all mb-4 focus:ring-1 ${
                  theme === 'dark' 
                    ? 'bg-[#1a191e] border-zinc-850 text-white focus:border-zinc-700 focus:ring-zinc-700' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400 focus:ring-zinc-450'
                }`}
                placeholder="请输入项目名称"
                autoFocus
              />
              <div className="flex justify-end gap-3 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setIsRenameOpen(false)}
                  className={`px-4 py-2 rounded-lg cursor-pointer ${
                    theme === 'dark' ? 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800/80' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  取消
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg cursor-pointer bg-var(--accent) hover:bg-indigo-505 text-white shadow-lg shadow-var(--accent)/10">
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Create Project */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl animate-fade-in ${
            theme === 'dark' ? 'bg-[#141317] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5.5 h-5.5 text-var(--accent)" />
                <h3 className="text-lg font-bold">创建项目</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  项目名称 &lt;必填&gt;
                </label>
                <input
                  type="text"
                  required
                  placeholder="如: 媳妇井 / 绝境逃生"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#1a191e] border-zinc-850 text-white focus:border-zinc-700' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  项目简介 &lt;选填&gt;
                </label>
                <textarea
                  rows={2}
                  placeholder="一句话描述项目定位，将展示在概览页全剧总览中"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all resize-none ${
                    theme === 'dark'
                      ? 'bg-[#1a191e] border-zinc-850 text-white focus:border-zinc-700 placeholder-zinc-600'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400 placeholder-zinc-400'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  创作模式
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['剧本模式', '自由模式'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setNewProjectType(mode);
                        if (mode === '自由模式') {
                          handleRemoveScriptFile();
                        }
                      }}
                      className={`creation-mode-card ${newProjectType === mode ? 'active' : ''}`}
                    >
                      <span>{mode}</span>
                      <small>{mode === '剧本模式' ? '上传剧本，自动解析' : '输入集数，自由创作'}</small>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Screenplay Module */}
              {newProjectType === '剧本模式' ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  上传剧本 &lt;必填&gt;
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleScriptFileSelect}
                  accept=".txt,.pdf,.docx,.doc"
                  className="hidden"
                />

                {!uploadedScriptFile ? (
                  <div
                    onDragOver={handleScriptDragOver}
                    onDragLeave={handleScriptDragLeave}
                    onDrop={handleScriptDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      isScriptDragging
                        ? (theme === 'dark' ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-emerald-500 bg-emerald-50/30')
                        : (theme === 'dark' ? 'border-zinc-800 hover:border-zinc-750 bg-[#17161b]/30' : 'border-[#e4e4e7] hover:border-zinc-300 bg-zinc-50/50')
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className={`p-2.5 rounded-full ${theme === 'dark' ? 'bg-[#1c1a21] text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
                        <Upload className="w-5 h-5 text-[var(--accent)] dark:text-[var(--accent)]" />
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                          点击或将文件拖件到这里上传
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          支持 PDF, TXT, WORD (最大 50MB)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${
                    theme === 'dark' ? 'bg-[#1b1a20]/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        theme === 'dark' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-emerald-50 text-var(--accent)'
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
                          {uploadedScriptFile.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {uploadedScriptFile.size} • 已检测
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveScriptFile}
                      className="text-[11px] font-semibold text-red-400 hover:text-red-300 px-2 py-1 hover:bg-red-500/10 rounded-lg cursor-pointer transition-all"
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
              ) : (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  集数 &lt;必填&gt;
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  required
                  value={newProjectEpisodesCount}
                  onChange={(e) => setNewProjectEpisodesCount(Math.max(1, Number(e.target.value) || 1))}
                  className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all ${
                    theme === 'dark'
                      ? 'bg-[#1a191e] border-zinc-850 text-white focus:border-zinc-700'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400'
                  }`}
                  placeholder="请输入计划集数"
                />
                <p className="text-[10px] text-zinc-500 mt-1.5">自由模式会按集数创建空白剧集。</p>
              </div>
              )}

              <div className="pt-4 flex justify-end gap-3 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className={`px-4 py-2.5 rounded-lg cursor-pointer ${
                    theme === 'dark' ? 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800/80' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (newProjectType === '剧本模式' && !uploadedScriptFile)}
                  className={`px-6 py-2.5 rounded-lg font-semibold cursor-pointer active:translate-y-0 shadow-lg ${
                    theme === 'dark'
                      ? 'bg-[var(--accent)] hover:bg-[#c3ec44] text-[#000000] shadow-[var(--accent)]/10'
                      : 'bg-var(--accent) hover:bg-emerald-500 text-white shadow-emerald-500/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? '创建中…' : '创建项目'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Invite Members */}
      {isInviteOpen && inviteProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl animate-fade-in ${
            theme === 'dark' ? 'bg-[#141317] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-var(--accent)" />
                <h3 className="text-lg font-bold">邀请成员加入项目</h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsInviteOpen(false);
                  setInviteProject(null);
                }} 
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <span className="text-xs font-semibold text-zinc-405 block mb-1">当前项目</span>
              <p className={`text-base font-semibold ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
                {inviteProject.name}
              </p>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                  选择要邀请的成员
                </label>
                
                {/* Find candidate members who are NOT in this project */}
                {(() => {
                  const candidates = ALL_MEMBERS.filter(
                    m => m !== '所有成员' && !inviteProject.members.includes(m)
                  );

                  if (candidates.length === 0) {
                    return (
                      <p className="text-xs text-zinc-500 py-3 italic">
                        剧组所有可选成员均已该项目中。
                      </p>
                    );
                  }

                  return (
                    <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto py-1">
                      {candidates.map((member) => {
                        const isSelected = selectedInviteMembers.includes(member);
                        return (
                          <button
                            key={member}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedInviteMembers(selectedInviteMembers.filter(m => m !== member));
                              } else {
                                setSelectedInviteMembers([...selectedInviteMembers, member]);
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border cursor-pointer select-none transition-all ${
                              isSelected
                                ? 'border-var(--accent) bg-var(--accent)/20 text-var(--accent)'
                                : (theme === 'dark' ? 'border-zinc-800 bg-[#1a191e] hover:border-zinc-700 text-zinc-400' : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-650')
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                            {member}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2 flex justify-end gap-3 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setIsInviteOpen(false);
                    setInviteProject(null);
                  }}
                  className={`px-4 py-2 rounded-lg cursor-pointer ${
                    theme === 'dark' ? 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800/80' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  disabled={selectedInviteMembers.length === 0}
                  className={`px-5 py-2 rounded-lg text-white shadow-lg shadow-var(--accent)/10 transition-all ${
                    selectedInviteMembers.length === 0 
                      ? 'bg-var(--accent)/40 cursor-not-allowed opacity-50' 
                      : 'bg-var(--accent) hover:bg-var(--accent) cursor-pointer'
                  }`}
                >
                  确认邀请
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl animate-fade-in ${
            theme === 'dark' ? 'bg-[#141317] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                <Trash2 className="w-7 h-7 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">确认删除项目</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                确认要删除「{deleteTarget.name}」吗？该操作不可撤销，项目下的所有剧本、资产、分镜和成片数据将被永久移除。
              </p>
            </div>

            <div className="flex justify-end gap-3 text-sm font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteTarget(null);
                }}
                className={`px-4 py-2 rounded-lg cursor-pointer ${
                  theme === 'dark' ? 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800/80' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-lg text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-lg shadow-rose-600/20 transition-all"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
