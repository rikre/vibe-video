import { useState, useCallback } from 'react';
import { Project } from '../types';

interface UseInviteDialogReturn {
  isOpen: boolean;
  open: (project: Project) => void;
  close: () => void;
  project: Project | null;
  selectedMembers: string[];
  toggleMember: (member: string) => void;
  submit: () => void;
}

export function useInviteDialog(
  onUpdateMembers: (projectId: string, members: string[]) => void
): UseInviteDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const open = useCallback((targetProject: Project) => {
    setProject(targetProject);
    setSelectedMembers([]);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setProject(null);
  }, []);

  const toggleMember = useCallback((member: string) => {
    setSelectedMembers((current) => {
      if (current.includes(member)) {
        return current.filter((m) => m !== member);
      }
      return [...current, member];
    });
  }, []);

  const submit = useCallback(() => {
    if (!project) return;
    const updatedMembers = [...project.members, ...selectedMembers];
    onUpdateMembers(project.id, updatedMembers);
    setIsOpen(false);
    setProject(null);
  }, [project, selectedMembers, onUpdateMembers]);

  return {
    isOpen,
    open,
    close,
    project,
    selectedMembers,
    toggleMember,
    submit,
  };
}
