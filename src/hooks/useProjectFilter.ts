import { useState, useMemo, useRef } from 'react';
import type { RefObject, Dispatch, SetStateAction } from 'react';
import { Project } from '../types';

type MemberFilterMode = '所有成员' | '由我创建';
type OwnershipFilter = '全部' | '我创建的' | '我协作的';

interface UseProjectFilterReturn {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  memberFilterMode: MemberFilterMode;
  setMemberFilterMode: Dispatch<SetStateAction<MemberFilterMode>>;
  isMemberDropdownOpen: boolean;
  setIsMemberDropdownOpen: Dispatch<SetStateAction<boolean>>;
  ownershipFilter: OwnershipFilter;
  setOwnershipFilter: Dispatch<SetStateAction<OwnershipFilter>>;
  filteredProjects: Project[];
  memberDropdownRef: RefObject<HTMLDivElement | null>;
  createdProjectsCount: number;
  collaboratedProjectsCount: number;
}

export function useProjectFilter(projects: Project[]): UseProjectFilterReturn {
  const [searchTerm, setSearchTerm] = useState('');
  const [memberFilterMode, setMemberFilterMode] = useState<MemberFilterMode>('所有成员');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('全部');
  const memberDropdownRef = useRef<HTMLDivElement | null>(null);

  const createdProjectsCount = useMemo(
    () => projects.filter((project) => project.members[0] === '常谦' || project.id.startsWith('custom-')).length,
    [projects]
  );

  const collaboratedProjectsCount = projects.length - createdProjectsCount;

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
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
  }, [projects, searchTerm, memberFilterMode, ownershipFilter]);

  return {
    searchTerm,
    setSearchTerm,
    memberFilterMode,
    setMemberFilterMode,
    isMemberDropdownOpen,
    setIsMemberDropdownOpen,
    ownershipFilter,
    setOwnershipFilter,
    filteredProjects,
    memberDropdownRef,
    createdProjectsCount,
    collaboratedProjectsCount,
  };
}
