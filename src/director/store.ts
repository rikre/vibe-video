import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as THREE from "three";
import type {
  ActorPreset,
  CameraObject,
  Capture,
  DirectorView,
  PrimitivePreset,
  SceneObject,
  SceneSettings,
  SceneSnapshot,
  Transform,
  TransformMode,
  Vec3,
  ViewMode,
} from "./types";

const id = () => crypto.randomUUID();
const clone = <T,>(value: T): T => structuredClone(value);

const defaultTransform = (): Transform => ({
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
});

const actorColors = ["#4f8ef7", "#f75333", "#34c759", "#ffb547", "#b892ff"];

const initialActor: SceneObject = {
  id: "actor-a",
  type: "actor",
  name: "角色A",
  preset: "男性身体",
  transform: defaultTransform(),
  color: actorColors[0],
  visible: true,
  pose: "站立",
};

const initialCamera: CameraObject = {
  id: "camera-1",
  name: "机位1",
  position: [0, 2.2, 10],
  target: [0, 1.2, 0],
  fov: 50,
};

const initialScene: SceneSettings = {
  skyColor: "#080a0b",
  panoramaRotation: 0,
  panoramaRadius: 60,
  groundVisible: true,
  groundOpacity: 0.42,
  groundHeight: 0,
  showLabels: true,
  snapEnabled: false,
  sceneScale: 1,
  scenePosition: [0, 0, 0],
  sceneRotation: [0, 0, 0],
};

export type SyncStatus = "loading" | "saving" | "saved" | "offline" | "error";

export type DirectorProjectData = {
  projectName: string;
  objects: SceneObject[];
  cameras: CameraObject[];
  captures: Capture[];
  scene: SceneSettings;
  selectedId: string | null;
  activeCameraId: string;
  directorView: DirectorView;
  viewMode: ViewMode;
  transformMode: TransformMode;
  savedAt: string;
};

export type DirectorState = DirectorProjectData & {
  projectName: string;
  objects: SceneObject[];
  cameras: CameraObject[];
  captures: Capture[];
  scene: SceneSettings;
  selectedId: string | null;
  selectedIds: string[];
  activeCameraId: string;
  directorView: DirectorView;
  viewRevision: number;
  viewMode: ViewMode;
  transformMode: TransformMode;
  past: SceneSnapshot[];
  future: SceneSnapshot[];
  savedAt: string;
  toast: string | null;
  cleanCapture: boolean;
  syncStatus: SyncStatus;
  remoteRevision: number;
  syncedAt: string | null;
  syncError: string | null;
  setToast: (toast: string | null) => void;
  setCleanCapture: (value: boolean) => void;
  select: (selectedId: string | null) => void;
  toggleSelect: (objectId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setTransformMode: (mode: TransformMode) => void;
  addActor: (preset: ActorPreset) => void;
  addCrowd: (rows: number, columns: number, spacing: number) => void;
  addPrimitive: (preset: PrimitivePreset) => void;
  addUploadedModel: (fileName: string, dataUrl: string) => void;
  removeObject: (objectId: string) => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  updateObject: (objectId: string, patch: Partial<SceneObject>, record?: boolean) => void;
  updateObjectTransform: (objectId: string, transform: Transform, record?: boolean) => void;
  addCamera: (position?: Vec3, target?: Vec3, fov?: number) => string;
  removeCamera: (cameraId: string) => void;
  setActiveCamera: (cameraId: string) => void;
  updateCamera: (cameraId: string, patch: Partial<CameraObject>, record?: boolean) => void;
  updateScene: (patch: Partial<SceneSettings>, record?: boolean) => void;
  setDirectorView: (view: DirectorView) => void;
  resetDirectorView: () => void;
  checkpoint: () => void;
  undo: () => void;
  redo: () => void;
  addCapture: (imageUrl: string, ratio: string, cameraId: string) => string;
  updateCaptureImage: (captureId: string, imageUrl: string) => void;
  toggleCapture: (captureId: string) => void;
  deleteCapture: (captureId: string) => void;
  clearCaptures: () => void;
  sendCaptures: () => string[];
  markCaptureSent: (captureId: string, sent: boolean) => void;
  hydrateProject: (project: DirectorProjectData, revision: number, syncedAt: string) => void;
  setSyncState: (status: SyncStatus, patch?: { revision?: number; syncedAt?: string | null; error?: string | null }) => void;
  resetProject: () => void;
};

const takeSnapshot = (state: Pick<DirectorState, "objects" | "cameras" | "scene" | "activeCameraId">): SceneSnapshot => ({
  objects: clone(state.objects),
  cameras: clone(state.cameras),
  scene: clone(state.scene),
  activeCameraId: state.activeCameraId,
});

const nextActorName = (objects: SceneObject[]) => {
  const count = objects.filter((object) => object.type === "actor").length;
  return `角色${String.fromCharCode(65 + Math.min(count, 25))}`;
};

const nextPrimitiveName = (objects: SceneObject[], preset: PrimitivePreset) => {
  const count = objects.filter((object) => object.type === "primitive" && object.preset === preset).length;
  return `${preset}${count + 1}`;
};

const withCheckpoint = (state: DirectorState) => ({
  past: [...state.past.slice(-49), takeSnapshot(state)],
  future: [],
  savedAt: new Date().toISOString(),
});

export const useDirectorStore = create<DirectorState>()(
  persist(
    (set, get) => ({
      projectName: "未命名场景 · 001",
      objects: [initialActor],
      cameras: [initialCamera],
      captures: [],
      scene: initialScene,
      selectedId: initialActor.id,
      selectedIds: [initialActor.id],
      activeCameraId: initialCamera.id,
      directorView: { position: [7.5, 5.5, 9.5], target: [0, 1, 0], fov: 46 },
      viewRevision: 0,
      viewMode: "director",
      transformMode: "translate",
      past: [],
      future: [],
      savedAt: new Date().toISOString(),
      toast: null,
      cleanCapture: false,
      syncStatus: "loading",
      remoteRevision: 0,
      syncedAt: null,
      syncError: null,

      setToast: (toast) => set({ toast }),
      setCleanCapture: (cleanCapture) => set({ cleanCapture }),
      select: (selectedId) => set({ selectedId, selectedIds: selectedId ? [selectedId] : [] }),
      toggleSelect: (objectId) =>
        set((state) => {
          const exists = state.selectedIds.includes(objectId);
          const selectedIds = exists
            ? state.selectedIds.filter((id) => id !== objectId)
            : [...state.selectedIds, objectId];
          return { selectedIds, selectedId: selectedIds.at(-1) ?? null };
        }),
      setViewMode: (viewMode) => set({ viewMode }),
      setTransformMode: (transformMode) => set({ transformMode }),

      checkpoint: () => set((state) => withCheckpoint(state)),

      addActor: (preset) =>
        set((state) => {
          const index = state.objects.filter((object) => object.type === "actor").length;
          const object: SceneObject = {
            id: id(),
            type: "actor",
            name: nextActorName(state.objects),
            preset,
            transform: {
              ...defaultTransform(),
              position: [Math.min(index * 1.25, 4), 0, 0],
              scale: preset === "儿童身体" ? [0.75, 0.75, 0.75] : [1, 1, 1],
            },
            color: actorColors[index % actorColors.length],
            visible: true,
            pose: "站立",
          };
          return {
            ...withCheckpoint(state),
            objects: [...state.objects, object],
            selectedId: object.id,
            selectedIds: [object.id],
            toast: `已添加 ${object.name}`,
          };
        }),

      addCrowd: (rows, columns, spacing) =>
        set((state) => {
          const safeRows = Math.max(1, Math.min(10, Math.round(rows)));
          const safeColumns = Math.max(1, Math.min(10, Math.round(columns)));
          const safeSpacing = Math.max(0.5, Math.min(5, spacing));
          const groupId = id();
          const startIndex = state.objects.filter((object) => object.type === "actor").length;
          const crowd: SceneObject[] = [];
          for (let row = 0; row < safeRows; row += 1) {
            for (let column = 0; column < safeColumns; column += 1) {
              const index = startIndex + crowd.length;
              crowd.push({
                id: id(),
                type: "actor",
                name: `群众${crowd.length + 1}`,
                preset: "男性身体",
                transform: {
                  ...defaultTransform(),
                  position: [
                    (column - (safeColumns - 1) / 2) * safeSpacing,
                    0,
                    (row - (safeRows - 1) / 2) * safeSpacing,
                  ],
                  scale: [0.92, 0.92, 0.92],
                },
                color: actorColors[index % actorColors.length],
                visible: true,
                pose: "站立",
                groupId,
              });
            }
          }
          return {
            ...withCheckpoint(state),
            objects: [...state.objects, ...crowd],
            selectedId: crowd[0]?.id ?? state.selectedId,
            selectedIds: crowd.map((object) => object.id),
            toast: `已添加 ${safeRows}×${safeColumns} 群众阵列`,
          };
        }),

      addPrimitive: (preset) =>
        set((state) => {
          const object: SceneObject = {
            id: id(),
            type: "primitive",
            name: nextPrimitiveName(state.objects, preset),
            preset,
            transform: {
              ...defaultTransform(),
              position: [-1.5, preset === "球体" ? 0.7 : 0.5, 0],
            },
            color: "#d1e7f7",
            visible: true,
          };
          return {
            ...withCheckpoint(state),
            objects: [...state.objects, object],
            selectedId: object.id,
            selectedIds: [object.id],
            toast: `已添加 ${object.name}`,
          };
        }),

      addUploadedModel: (fileName, dataUrl) =>
        set((state) => {
          const object: SceneObject = {
            id: id(),
            type: "uploaded-model",
            name: fileName.replace(/\.(glb|gltf)$/i, "") || `本地模型${state.objects.length + 1}`,
            preset: "本地模型",
            transform: defaultTransform(),
            color: "#d1e7f7",
            visible: true,
            modelDataUrl: dataUrl,
          };
          return {
            ...withCheckpoint(state),
            objects: [...state.objects, object],
            selectedId: object.id,
            selectedIds: [object.id],
            toast: `已导入 ${object.name}`,
          };
        }),

      removeObject: (objectId) =>
        set((state) => {
          const object = state.objects.find((item) => item.id === objectId);
          if (!object) return state;
          return {
            ...withCheckpoint(state),
            objects: state.objects.filter((item) => item.id !== objectId),
            selectedId: state.selectedId === objectId ? null : state.selectedId,
            selectedIds: state.selectedIds.filter((id) => id !== objectId),
            toast: `已删除 ${object.name}`,
          };
        }),

      groupSelected: () =>
        set((state) => {
          const selected = state.objects.filter((object) => state.selectedIds.includes(object.id));
          if (selected.length < 2) return { toast: "至少选择两个对象才能打组" } as Partial<DirectorState>;
          const groupId = id();
          return {
            ...withCheckpoint(state),
            objects: state.objects.map((object) =>
              state.selectedIds.includes(object.id) ? { ...object, groupId } : object,
            ),
            toast: `已将 ${selected.length} 个对象打组`,
          };
        }),

      ungroupSelected: () =>
        set((state) => {
          const groupIds = new Set(
            state.objects.filter((object) => state.selectedIds.includes(object.id)).map((object) => object.groupId).filter(Boolean),
          );
          if (!groupIds.size) return { toast: "所选对象不在组内" } as Partial<DirectorState>;
          return {
            ...withCheckpoint(state),
            objects: state.objects.map((object) =>
              object.groupId && groupIds.has(object.groupId) ? { ...object, groupId: undefined } : object,
            ),
            toast: "已解组",
          };
        }),

      updateObject: (objectId, patch, record = true) =>
        set((state) => ({
          ...(record ? withCheckpoint(state) : {}),
          objects: state.objects.map((object) => (object.id === objectId ? { ...object, ...patch } : object)),
          savedAt: new Date().toISOString(),
        })),

      updateObjectTransform: (objectId, transform, record = true) =>
        set((state) => {
          const source = state.objects.find((object) => object.id === objectId);
          if (!source) return state;
          const translationDelta: Vec3 = [
            transform.position[0] - source.transform.position[0],
            transform.position[1] - source.transform.position[1],
            transform.position[2] - source.transform.position[2],
          ];
          const oldRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(...source.transform.rotation));
          const newRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(...transform.rotation));
          const rotationDelta = newRotation.clone().multiply(oldRotation.clone().invert());
          const scaleRatio: Vec3 = source.transform.scale.map((value, index) =>
            Math.abs(value) < 0.0001 ? 1 : transform.scale[index] / value,
          ) as Vec3;
          const pivot = new THREE.Vector3(...source.transform.position);
          return {
            ...(record ? withCheckpoint(state) : {}),
            objects: state.objects.map((object) => {
              if (object.id === objectId) return { ...object, transform };
              if (source.groupId && object.groupId === source.groupId) {
                const relative = new THREE.Vector3(...object.transform.position)
                  .sub(pivot)
                  .multiply(new THREE.Vector3(...scaleRatio))
                  .applyQuaternion(rotationDelta);
                const nextPosition = relative.add(pivot).add(new THREE.Vector3(...translationDelta));
                const objectRotation = rotationDelta.clone().multiply(
                  new THREE.Quaternion().setFromEuler(new THREE.Euler(...object.transform.rotation)),
                );
                const nextEuler = new THREE.Euler().setFromQuaternion(objectRotation);
                return {
                  ...object,
                  transform: {
                    ...object.transform,
                    position: nextPosition.toArray() as Vec3,
                    rotation: [nextEuler.x, nextEuler.y, nextEuler.z],
                    scale: object.transform.scale.map((value, index) => value * scaleRatio[index]) as Vec3,
                  },
                };
              }
              return object;
            }),
            savedAt: new Date().toISOString(),
          };
        }),

      addCamera: (position = [2.5, 1.5, 5], target = [0, 1.2, 0], fov = 40) => {
        const cameraId = id();
        set((state) => {
          const camera: CameraObject = {
            id: cameraId,
            name: `机位${state.cameras.length + 1}`,
            position,
            target,
            fov,
          };
          return {
            ...withCheckpoint(state),
            cameras: [...state.cameras, camera],
            activeCameraId: camera.id,
            selectedId: camera.id,
            selectedIds: [camera.id],
            toast: `已创建 ${camera.name}`,
          };
        });
        return cameraId;
      },

      removeCamera: (cameraId) =>
        set((state) => {
          if (state.cameras.length <= 1) return { toast: "至少保留一个机位" } as Partial<DirectorState>;
          const index = state.cameras.findIndex((camera) => camera.id === cameraId);
          const cameras = state.cameras.filter((camera) => camera.id !== cameraId);
          const fallback = cameras[Math.max(0, index - 1)];
          const wasSelected = state.selectedId === cameraId || state.selectedIds.includes(cameraId);
          const selectedIds = state.selectedIds.filter((sid) => sid !== cameraId);
          return {
            ...withCheckpoint(state),
            cameras,
            activeCameraId: state.activeCameraId === cameraId ? fallback.id : state.activeCameraId,
            selectedId: state.selectedId === cameraId ? fallback.id : state.selectedId,
            selectedIds: wasSelected && selectedIds.length === 0 && state.selectedId === cameraId ? [fallback.id] : selectedIds,
            toast: "机位已删除，截图已保留",
          };
        }),

      setActiveCamera: (activeCameraId) => set({ activeCameraId, selectedId: activeCameraId, selectedIds: [activeCameraId] }),

      updateCamera: (cameraId, patch, record = true) =>
        set((state) => ({
          ...(record ? withCheckpoint(state) : {}),
          cameras: state.cameras.map((camera) => (camera.id === cameraId ? { ...camera, ...patch } : camera)),
          savedAt: new Date().toISOString(),
        })),

      updateScene: (patch, record = true) =>
        set((state) => ({
          ...(record ? withCheckpoint(state) : {}),
          scene: { ...state.scene, ...patch },
          savedAt: new Date().toISOString(),
        })),

      setDirectorView: (directorView) => set({ directorView }),
      resetDirectorView: () =>
        set((state) => ({
          directorView: { position: [7.5, 5.5, 9.5], target: [0, 1, 0], fov: 46 },
          viewMode: "director",
          viewRevision: state.viewRevision + 1,
          toast: "导演视角已重置",
        })),

      undo: () =>
        set((state) => {
          const previous = state.past.at(-1);
          if (!previous) return state;
          // 保留当前选中状态，仅当所选对象已不存在时才清空
          const restoredObjects = previous.objects;
          const restoredCameras = previous.cameras;
          const selectedId = restoredObjects.some((o) => o.id === state.selectedId) || restoredCameras.some((c) => c.id === state.selectedId)
            ? state.selectedId
            : null;
          const selectedIds = state.selectedIds.filter((sid) => restoredObjects.some((o) => o.id === sid) || restoredCameras.some((c) => c.id === sid));
          return {
            ...clone(previous),
            past: state.past.slice(0, -1),
            future: [takeSnapshot(state), ...state.future].slice(0, 50),
            selectedId,
            selectedIds,
            savedAt: new Date().toISOString(),
            toast: "已撤销",
          };
        }),

      redo: () =>
        set((state) => {
          const next = state.future[0];
          if (!next) return state;
          // 保留当前选中状态，仅当所选对象已不存在时才清空
          const restoredObjects = next.objects;
          const restoredCameras = next.cameras;
          const selectedId = restoredObjects.some((o) => o.id === state.selectedId) || restoredCameras.some((c) => c.id === state.selectedId)
            ? state.selectedId
            : null;
          const selectedIds = state.selectedIds.filter((sid) => restoredObjects.some((o) => o.id === sid) || restoredCameras.some((c) => c.id === sid));
          return {
            ...clone(next),
            past: [...state.past, takeSnapshot(state)].slice(-50),
            future: state.future.slice(1),
            selectedId,
            selectedIds,
            savedAt: new Date().toISOString(),
            toast: "已重做",
          };
        }),

      addCapture: (imageUrl, ratio, cameraId) => {
        const captureId = id();
        set((state) => ({
          captures: [
            {
              id: captureId,
              cameraId,
              ratio,
              imageUrl,
              createdAt: new Date().toISOString(),
              selected: true,
              sent: false,
            },
            ...state.captures.map((capture) => ({ ...capture, selected: false })),
          ],
          savedAt: new Date().toISOString(),
          toast: `已生成 ${ratio} 构图截图`,
        }));
        return captureId;
      },

      updateCaptureImage: (captureId, imageUrl) =>
        set((state) => ({
          captures: state.captures.map((capture) => capture.id === captureId ? { ...capture, imageUrl } : capture),
          savedAt: new Date().toISOString(),
        })),

      toggleCapture: (captureId) =>
        set((state) => ({
          captures: state.captures.map((capture) =>
            capture.id === captureId ? { ...capture, selected: !capture.selected } : capture,
          ),
        })),

      deleteCapture: (captureId) =>
        set((state) => ({
          captures: state.captures.filter((capture) => capture.id !== captureId),
          savedAt: new Date().toISOString(),
          toast: "截图已删除",
        })),

      clearCaptures: () => set({ captures: [], savedAt: new Date().toISOString(), toast: "截图记录已清空" }),

      sendCaptures: () => {
        const captureIds = get().captures.filter((capture) => capture.selected).map((capture) => capture.id);
        if (!captureIds.length) {
          set({ toast: "请先选择截图" });
          return [];
        }
        // 仅取消 selected 避免重复发送，sent 标记由调用方在发送成功后通过 markCaptureSent 设置
        set((state) => ({
            captures: state.captures.map((capture) =>
              captureIds.includes(capture.id) ? { ...capture, selected: false } : capture,
            ),
            savedAt: new Date().toISOString(),
            toast: `正在发送 ${captureIds.length} 张截图到画布`,
        }));
        return captureIds;
      },

      markCaptureSent: (captureId, sent) =>
        set((state) => ({
          captures: state.captures.map((capture) =>
            capture.id === captureId ? { ...capture, sent } : capture,
          ),
          savedAt: new Date().toISOString(),
        })),

      hydrateProject: (project, remoteRevision, syncedAt) =>
        set((state) => ({
          ...project,
          scene: { ...initialScene, ...project.scene },
          objects: project.objects.map((object) => ({
            ...object,
            pose: object.type === "actor" ? (object.pose ?? "站立") : object.pose,
          })),
          selectedIds: project.selectedId && project.objects.some((object) => object.id === project.selectedId)
            ? [project.selectedId]
            : [],
          viewRevision: state.viewRevision + 1,
          past: [],
          future: [],
          remoteRevision,
          syncedAt,
          syncStatus: "saved",
          syncError: null,
          toast: null,
          cleanCapture: false,
        })),

      setSyncState: (syncStatus, patch = {}) =>
        set((state) => ({
          syncStatus,
          remoteRevision: patch.revision ?? state.remoteRevision,
          syncedAt: patch.syncedAt === undefined ? state.syncedAt : patch.syncedAt,
          syncError: patch.error === undefined ? state.syncError : patch.error,
        })),

      resetProject: () =>
        set({
          objects: [clone(initialActor)],
          cameras: [clone(initialCamera)],
          captures: [],
          scene: clone(initialScene),
          selectedId: initialActor.id,
          selectedIds: [initialActor.id],
          activeCameraId: initialCamera.id,
          directorView: { position: [7.5, 5.5, 9.5], target: [0, 1, 0], fov: 46 },
          viewRevision: get().viewRevision + 1,
          viewMode: "director",
          transformMode: "translate",
          past: [],
          future: [],
          toast: "场景已重置",
          // 重置同步状态字段，避免残留的同步错误状态
          syncStatus: "loading",
          syncError: null,
          syncedAt: null,
        }),
    }),
    {
      name: "vibevideo-director-project",
      version: 2,
      merge: (persisted, current) => {
        const saved = persisted as Partial<DirectorState>;
        return {
          ...current,
          ...saved,
          scene: { ...initialScene, ...(saved.scene ?? {}) },
          objects: (saved.objects ?? current.objects).map((object) => ({
            ...object,
            pose: object.type === "actor" ? (object.pose ?? "站立") : object.pose,
          })),
          directorView: saved.directorView ?? current.directorView,
          viewRevision: 0,
          past: [],
          future: [],
          toast: null,
          cleanCapture: false,
          selectedIds: saved.selectedId && saved.objects?.some((object) => object.id === saved.selectedId)
            ? [saved.selectedId]
            : [current.selectedId].filter(Boolean) as string[],
        };
      },
      partialize: (state) => ({
        projectName: state.projectName,
        objects: state.objects,
        cameras: state.cameras,
        captures: state.captures,
        scene: state.scene,
        selectedId: state.selectedId,
        activeCameraId: state.activeCameraId,
        directorView: state.directorView,
        viewMode: state.viewMode,
        transformMode: state.transformMode,
        savedAt: state.savedAt,
      }),
    },
  ),
);
