/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Episode {
  id: string;
  number: number;
  title: string;
  status: string;
  progress: number;
  description?: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  timeLabel: string;
  type: 'video' | 'image' | 'audio' | 'script';
}

export interface MemberStat {
  rank: number;
  name: string;
  avatarLetter: string;
  computeCost: number;
  outputSummary: string;
}

export interface Project {
  id: string;
  name: string;
  tag: string; // e.g., '创作中', '已完结'
  coverType: 'gradient' | 'image';
  coverUrl?: string; // Standard image URL
  createdAt: string;
  members: string[]; // List of member names
  description?: string;
  projectType?: '剧本模式' | '自由模式' | '短剧项目' | '短片';
  plannedEpisodesCount?: number;
  scriptFileName?: string;
  scriptContent?: string;
  episodesCount: number;
  episodes: Episode[];
  assets: {
    total: number;
    characters: number;
    scenes: number;
    props: number;
  };
  computeSpent: number;
  todaySpent: number;
  memberStats: MemberStat[];
  activities: Activity[];
}

export type SidebarTab = '首页' | '创作' | '工具' | '项目' | '资产';
export type ProjectSubTab = '概览' | '剧本' | '资产' | '分镜' | '故事板' | '成片';
export type ThemeMode = 'dark' | 'light';
