/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Archive, Clapperboard, FolderKanban, Home, LayoutGrid, Moon, Sparkles, Sun, WandSparkles } from 'lucide-react';
import { SidebarTab, ThemeMode } from '../types';

interface SidebarProps {
  activeTab: SidebarTab;
  onChangeTab: (tab: SidebarTab) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
}

const menuItems = [
  { id: '首页', label: '首页', icon: Home },
  { id: '创作', label: '创作', icon: Sparkles },
  { id: '工具', label: '工具', icon: LayoutGrid },
  { id: '项目', label: '项目', icon: FolderKanban },
  { id: '导演台', label: '导演台', icon: Clapperboard },
  { id: '资产', label: '资产', icon: Archive },
] as const;

export default function Sidebar({ activeTab, onChangeTab, theme, toggleTheme }: SidebarProps) {
  return (
    <aside className="main-sidebar">
      <div>
        <div className="brand-lockup">
          <div className="brand-mark"><WandSparkles size={18} /></div>
          <div><strong>剧光</strong><span>DRAMA STUDIO</span></div>
        </div>

        <nav className="main-nav" aria-label="主导航">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} aria-label={item.label} onClick={() => onChangeTab(item.id)} className={active ? 'active' : ''}>
                <span className="nav-icon"><Icon size={19} /></span>
                <span className="nav-copy"><strong>{item.label}</strong></span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="profile-row">
          <div className="profile-avatar">常</div>
          <div><strong>常谦</strong><span>制片人</span></div>
          <button onClick={toggleTheme} title={theme === 'dark' ? '切换亮色模式' : '切换暗色模式'}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
