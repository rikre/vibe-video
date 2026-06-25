import { AlertCircle, CircleDot, Cloud, CloudOff, LoaderCircle, Maximize2 } from "lucide-react";
import { useDirectorStore } from "../store";

export default function Header() {
  const projectName = useDirectorStore((state) => state.projectName);
  const viewMode = useDirectorStore((state) => state.viewMode);
  const setViewMode = useDirectorStore((state) => state.setViewMode);
  const savedAt = useDirectorStore((state) => state.savedAt);
  const syncStatus = useDirectorStore((state) => state.syncStatus);
  const syncedAt = useDirectorStore((state) => state.syncedAt);
  const syncError = useDirectorStore((state) => state.syncError);
  const status = syncStatus === "loading"
    ? { icon: <LoaderCircle size={14} className="spin" />, label: "正在读取云端…" }
    : syncStatus === "saving"
      ? { icon: <LoaderCircle size={14} className="spin" />, label: "保存中…" }
      : syncStatus === "saved"
        ? { icon: <Cloud size={14} />, label: `已保存 ${new Date(syncedAt ?? savedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}` }
        : syncStatus === "offline"
          ? { icon: <CloudOff size={14} />, label: "离线草稿" }
          : { icon: <AlertCircle size={14} />, label: "保存失败，正在重试" };

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="product-mark">VV</span>
        <div>
          <div className="product-name">3D 导演台</div>
          <div className="project-name">{projectName}</div>
        </div>
      </div>

      <div className="view-switch" role="tablist" aria-label="视角模式">
        <button className={viewMode === "director" ? "active" : ""} onClick={() => setViewMode("director")}>
          <CircleDot size={14} /> 导演视角
        </button>
        <button className={viewMode === "camera" ? "active" : ""} onClick={() => setViewMode("camera")}>
          <span className="camera-frame-icon" /> 机位视角
        </button>
      </div>

      <div className="topbar__status">
        <span className={`save-status ${syncStatus}`} title={syncError ?? "项目已同时保存到本机与项目服务"}>
          {status.icon} {status.label}
        </span>
        <button className="icon-button" title="全屏" onClick={() => document.documentElement.requestFullscreen?.()}>
          <Maximize2 size={16} />
        </button>
      </div>
    </header>
  );
}
