import { useState, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Project } from '../types';

interface UseRenameDialogReturn {
  isOpen: boolean;
  open: (project: Project) => void;
  close: () => void;
  targetId: string | null;
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  submit: () => void;
}

export function useRenameDialog(
  onRename: (projectId: string, newName: string) => void
): UseRenameDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [value, setValue] = useState('');

  const open = useCallback((project: Project) => {
    setTargetId(project.id);
    setValue(project.name);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const submit = useCallback(() => {
    if (targetId && value.trim()) {
      onRename(targetId, value.trim());
      setIsOpen(false);
      setTargetId(null);
    }
  }, [targetId, value, onRename]);

  return {
    isOpen,
    open,
    close,
    targetId,
    value,
    setValue,
    submit,
  };
}
