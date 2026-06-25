import { useState, useRef, useCallback } from 'react';
import type { RefObject, DragEvent, ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Project } from '../types';

type ProjectType = '剧本模式' | '自由模式';
type CoverType = 'gradient' | 'image';
interface UploadedFile {
  name: string;
  size: string;
  content?: string;
}

interface CreateProjectSubmitData {
  name: string;
  tag: string;
  coverType: CoverType;
  members: string[];
  description: string;
  projectType: ProjectType;
  plannedEpisodesCount?: number;
  scriptFileName?: string;
  scriptContent?: string;
  coverUrl?: string;
}

interface UseCreateProjectDialogReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  projectType: ProjectType;
  setProjectType: Dispatch<SetStateAction<ProjectType>>;
  episodesCount: number;
  setEpisodesCount: Dispatch<SetStateAction<number>>;
  coverType: CoverType;
  setCoverType: Dispatch<SetStateAction<CoverType>>;
  members: string[];
  setMembers: Dispatch<SetStateAction<string[]>>;
  uploadedFile: UploadedFile | null;
  isDragging: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleDragOver: (e: DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  removeFile: () => void;
  submit: () => void;
  reset: () => void;
}

export function useCreateProjectDialog(
  onSubmit: (data: CreateProjectSubmitData) => void
): UseCreateProjectDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('剧本模式');
  const [episodesCount, setEpisodesCount] = useState(3);
  const [coverType, setCoverType] = useState<CoverType>('gradient');
  const [members, setMembers] = useState<string[]>(['常谦', '张三']);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const reset = useCallback(() => {
    setName('');
    setDescription('');
    setProjectType('剧本模式');
    setEpisodesCount(3);
    setCoverType('gradient');
    setMembers(['常谦', '张三']);
    setUploadedFile(null);
    setIsOpen(false);
  }, []);

  const captureFile = useCallback(async (file: File) => {
    const sizeStr = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    const canReadText = file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt');
    const content = canReadText ? await file.text() : undefined;
    setUploadedFile({ name: file.name, size: sizeStr, content });
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void captureFile(e.dataTransfer.files[0]);
    }
  }, [captureFile]);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void captureFile(e.target.files[0]);
    }
  }, [captureFile]);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const submit = useCallback(() => {
    if (!name.trim()) return;
    if (projectType === '剧本模式' && !uploadedFile) return;
    if (projectType === '自由模式' && (!Number.isFinite(episodesCount) || episodesCount < 1)) return;

    onSubmit({
      name,
      tag: '创作中',
      coverType,
      members,
      description: description || '新创建的短剧项目概括描述。',
      projectType,
      plannedEpisodesCount: projectType === '自由模式' ? episodesCount : undefined,
      scriptFileName: uploadedFile?.name,
      scriptContent: uploadedFile?.content,
      coverUrl: coverType === 'image'
        ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop'
        : undefined,
    });

    reset();
  }, [name, projectType, uploadedFile, episodesCount, coverType, members, description, onSubmit, reset]);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    name,
    setName,
    description,
    setDescription,
    projectType,
    setProjectType,
    episodesCount,
    setEpisodesCount,
    coverType,
    setCoverType,
    members,
    setMembers,
    uploadedFile,
    isDragging,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    removeFile,
    submit,
    reset,
  };
}
