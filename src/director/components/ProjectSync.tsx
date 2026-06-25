import { useEffect } from "react";
import { ApiError, fetchProject, getProjectId, saveProject } from "../api";
import { useDirectorStore, type DirectorProjectData, type DirectorState } from "../store";

export function projectData(state: DirectorState): DirectorProjectData {
  return {
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
  };
}

const digest = (state: DirectorState) => JSON.stringify(projectData(state));

export default function ProjectSync() {
  useEffect(() => {
    const projectId = getProjectId();
    const controller = new AbortController();
    let disposed = false;
    let debounceTimer: number | undefined;
    let retryTimer: number | undefined;
    let revision = 0;
    let lastSavedDigest = "";
    let observedDigest = "";
    let saving = false;
    let pending = false;
    let retryDelay = 2000;

    const setSync = useDirectorStore.getState().setSyncState;

    const scheduleRetry = () => {
      window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(() => void flush(), retryDelay);
      retryDelay = Math.min(retryDelay * 2, 15000);
    };

    const commit = async (state: DirectorState) => {
      const payload = projectData(state);
      try {
        let result = await saveProject(projectId, payload, revision, controller.signal);
        if (!result) throw new Error("服务端没有返回项目数据");
        revision = result.revision;
        return result;
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 409) throw error;
        const latest = await fetchProject<DirectorProjectData>(projectId, controller.signal);
        revision = latest?.revision ?? 0;
        const result = await saveProject(projectId, payload, revision, controller.signal);
        if (!result) throw new Error("冲突重试没有返回项目数据");
        revision = result.revision;
        useDirectorStore.getState().setToast("检测到云端版本变化，已保存当前编辑");
        return result;
      }
    };

    const flush = async () => {
      if (disposed) return;
      if (saving) {
        pending = true;
        return;
      }
      const state = useDirectorStore.getState();
      const currentDigest = digest(state);
      if (currentDigest === lastSavedDigest) return;
      saving = true;
      setSync("saving", { error: null });
      try {
        const result = await commit(state);
        if (disposed) return;
        lastSavedDigest = currentDigest;
        retryDelay = 2000;
        setSync("saved", { revision: result.revision, syncedAt: result.updatedAt, error: null });
      } catch (error) {
        if (disposed) return;
        const message = error instanceof Error ? error.message : "远端保存失败";
        setSync(navigator.onLine ? "error" : "offline", { error: message });
        scheduleRetry();
      } finally {
        saving = false;
        if (pending) {
          pending = false;
          void flush();
        }
      }
    };

    const initialize = async () => {
      const localExists = Boolean(localStorage.getItem("vibevideo-director-project"));
      setSync("loading", { error: null });
      try {
        const remote = await fetchProject<DirectorProjectData>(projectId, controller.signal);
        if (disposed) return;
        const local = useDirectorStore.getState();
        if (remote && (!localExists || Date.parse(remote.updatedAt) > Date.parse(local.savedAt))) {
          revision = remote.revision;
          useDirectorStore.getState().hydrateProject(remote.state, remote.revision, remote.updatedAt);
        } else if (remote) {
          revision = remote.revision;
          setSync("saved", { revision, syncedAt: remote.updatedAt, error: null });
        }
        observedDigest = digest(useDirectorStore.getState());
        if (remote && Date.parse(remote.updatedAt) >= Date.parse(useDirectorStore.getState().savedAt)) {
          lastSavedDigest = observedDigest;
        } else {
          await flush();
        }
      } catch (error) {
        if (disposed) return;
        const message = error instanceof Error ? error.message : "无法连接项目服务";
        setSync(navigator.onLine ? "error" : "offline", { error: message });
        observedDigest = digest(useDirectorStore.getState());
        scheduleRetry();
      }
    };

    // 浅比较关键字段，避免每次 state 变化都 JSON.stringify
    let lastSignature = "";
    const signature = (state: DirectorState) => {
      const s = state.scene;
      return `${state.projectName}|${state.objects.length}|${state.cameras.length}|${state.captures.length}|${state.selectedId}|${state.activeCameraId}|${state.viewMode}|${state.transformMode}|${state.savedAt}|${s.panoramaUrl ?? ""}|${s.skyColor}|${s.sceneScale}|${s.groundOpacity}|${s.groundHeight}|${s.panoramaRotation}|${s.panoramaRadius}|${s.showLabels}|${s.snapEnabled}|${s.groundVisible}|${s.scenePosition.join(",")}|${s.sceneRotation.join(",")}|${state.directorView.position.join(",")}|${state.directorView.target.join(",")}|${state.directorView.fov}`;
    };
    const unsubscribe = useDirectorStore.subscribe((state) => {
      const nextSig = signature(state);
      if (nextSig === lastSignature) return;
      lastSignature = nextSig;
      const nextDigest = digest(state);
      if (nextDigest === observedDigest) return;
      observedDigest = nextDigest;
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => void flush(), 800);
    });
    const onOnline = () => void flush();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    void initialize();

    return () => {
      disposed = true;
      controller.abort();
      unsubscribe();
      window.clearTimeout(debounceTimer);
      window.clearTimeout(retryTimer);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
