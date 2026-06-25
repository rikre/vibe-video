import { Aperture, CheckCircle2, ChevronDown, MonitorUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import Inspector from "./components/Inspector";
import ObjectTree from "./components/ObjectTree";
import Stage from "./components/Stage";
import Toolbar from "./components/Toolbar";
import CanvasShell from "./components/CanvasShell";
import ProjectSync from "./components/ProjectSync";
import { getProjectId, uploadCapture } from "./api";
import { useDirectorStore } from "./store";

const ratios = [
  { label: "16:9", value: 16 / 9, shape: "landscape" },
  { label: "9:16", value: 9 / 16, shape: "portrait" },
  { label: "1:1", value: 1, shape: "square" },
  { label: "4:3", value: 4 / 3, shape: "classic" },
  { label: "3:4", value: 3 / 4, shape: "portrait-short" },
];

function supportsWebGL() {
  if (new URLSearchParams(window.location.search).has("force-webgl-error")) return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function GraphicsUnsupported() {
  return (
    <main className="graphics-error">
      <div className="graphics-error__diagram">
        <span>GPU</span><i /><span>WEBGL</span>
      </div>
      <div className="dialog-kicker">GRAPHICS CHECK FAILED</div>
      <h1>无法启动 3D 导演台</h1>
      <p>当前浏览器没有提供可用的 WebGL 图形能力。导演台不会进入黑屏状态，请按下面步骤开启硬件加速后重试。</p>
      <ol>
        <li><b>Chrome / Edge 设置</b><span>系统 → 开启“使用图形加速功能”</span></li>
        <li><b>重启浏览器</b><span>完全退出后重新打开项目</span></li>
        <li><b>更新显卡与浏览器</b><span>仍不可用时检查系统图形驱动</span></li>
      </ol>
      <div className="graphics-error__actions">
        <button onClick={() => { window.location.hash = "#/canvas"; }}>返回画布</button>
        <button className="primary" onClick={() => window.location.reload()}>重新检测</button>
      </div>
    </main>
  );
}

function cropCanvas(source: HTMLCanvasElement, ratio: number) {
  const sourceRatio = source.width / source.height;
  let sx = 0;
  let sy = 0;
  let sw = source.width;
  let sh = source.height;
  if (sourceRatio > ratio) {
    sw = source.height * ratio;
    sx = (source.width - sw) / 2;
  } else {
    sh = source.width / ratio;
    sy = (source.height - sh) / 2;
  }
  const width = ratio >= 1 ? 960 : Math.round(960 * ratio);
  const height = Math.round(width / ratio);
  const target = document.createElement("canvas");
  target.width = width;
  target.height = height;
  const context = target.getContext("2d")!;
  context.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
  return target.toDataURL("image/jpeg", 0.88);
}

function CaptureDialog({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(ratios[0]);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const activeCameraId = useDirectorStore((state) => state.activeCameraId);
  const viewMode = useDirectorStore((state) => state.viewMode);
  const addCamera = useDirectorStore((state) => state.addCamera);
  const directorView = useDirectorStore((state) => state.directorView);
  const addCapture = useDirectorStore((state) => state.addCapture);
  const updateCaptureImage = useDirectorStore((state) => state.updateCaptureImage);
  const setCleanCapture = useDirectorStore((state) => state.setCleanCapture);
  const capture = async () => {
    setCapturing(true);
    setCaptureError(null);
    try {
      setCleanCapture(true);
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const canvas = document.querySelector<HTMLCanvasElement>("canvas.stage-canvas, .stage-canvas canvas, canvas");
      if (!canvas) throw new Error("没有找到可渲染的 3D 画布");
      const cameraId = viewMode === "director"
        ? addCamera(directorView.position, directorView.target, directorView.fov)
        : activeCameraId;
      const imageUrl = cropCanvas(canvas, selected.value);
      if (!imageUrl) throw new Error("浏览器未能生成截图数据");
      const captureId = addCapture(imageUrl, selected.label, cameraId);
      void uploadCapture(getProjectId(), captureId, imageUrl)
        .then((stored) => updateCaptureImage(captureId, stored.url))
        .catch(() => {
          // The data URL remains in the local draft; ProjectSync will keep retrying the project save.
        });
      onClose();
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : "截图生成失败，请重试");
    } finally {
      setCleanCapture(false);
      setCapturing(false);
    }
  };
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="capture-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" onClick={onClose}><X size={16} /></button>
        <div className="dialog-kicker"><Aperture size={15} /> FRAME CAPTURE</div>
        <h2>选择截图比例</h2>
        <p>当前构图将以所选画幅离屏渲染，并保存到机位数据。</p>
        <div className="ratio-options">
          {ratios.map((ratio) => (
            <button className={selected.label === ratio.label ? "selected" : ""} key={ratio.label} onClick={() => setSelected(ratio)}>
              <span className={`ratio-shape ${ratio.shape}`}><i /></span>
              <b>{ratio.label}</b>
              {selected.label === ratio.label && <CheckCircle2 size={14} />}
            </button>
          ))}
        </div>
        {captureError && <div className="capture-error">{captureError}</div>}
        <div className="dialog-footer">
          <span>截图不会包含辅助线与操作控件</span>
          <button className="capture-confirm" disabled={capturing} onClick={capture}>
            <MonitorUp size={15} /> {capturing ? "渲染中…" : captureError ? "重新生成" : "生成截图"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CrowdDialog({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [spacing, setSpacing] = useState(1.2);
  const addCrowd = useDirectorStore((state) => state.addCrowd);
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="crowd-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" onClick={onClose}><X size={16} /></button>
        <div className="dialog-kicker">CROWD ARRAY</div>
        <h2>添加群众阵列</h2>
        <p>按行列快速排布人体素模，添加后仍可逐个调整。</p>
        <div className="crowd-layout">
          <div className="crowd-preview" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: rows * columns }, (_, index) => <i key={index} />)}
          </div>
          <div className="crowd-fields">
            <label>行数<input type="number" min="1" max="10" value={rows} onChange={(event) => setRows(Number(event.target.value))} /></label>
            <label>列数<input type="number" min="1" max="10" value={columns} onChange={(event) => setColumns(Number(event.target.value))} /></label>
            <label>间距<input type="number" min="0.5" max="5" step="0.1" value={spacing} onChange={(event) => setSpacing(Number(event.target.value))} /></label>
          </div>
        </div>
        <div className="dialog-footer">
          <span>将创建 {Math.max(1, rows) * Math.max(1, columns)} 个角色</span>
          <button className="capture-confirm" onClick={() => { addCrowd(rows, columns, spacing); onClose(); }}>添加阵列</button>
        </div>
      </div>
    </div>
  );
}

function ViewportHud() {
  const viewMode = useDirectorStore((state) => state.viewMode);
  const activeCameraId = useDirectorStore((state) => state.activeCameraId);
  const cameras = useDirectorStore((state) => state.cameras);
  const active = cameras.find((camera) => camera.id === activeCameraId);
  return (
    <>
      <div className="viewport-status">
        <span className="rec-dot" />
        {viewMode === "director" ? "DIRECTOR / FREE" : `CAMERA / ${active?.name.toUpperCase() ?? "NONE"}`}
        <ChevronDown size={12} />
      </div>
      <div className="orientation-cube" aria-hidden="true">
        <span className="axis-label x">X</span>
        <span className="axis-label y">Y</span>
        <span className="axis-label z">Z</span>
        <div className="cube-face">前</div>
      </div>
      <div className="viewport-help">
        <span><kbd>左键</kbd> 选择</span>
        <span><kbd>右键</kbd> 环绕</span>
        <span><kbd>滚轮</kbd> 缩放</span>
      </div>
    </>
  );
}

interface DirectorAppProps {
  onExit?: () => void;
}

export default function DirectorApp({ onExit }: DirectorAppProps) {
  const [route, setRoute] = useState(() => window.location.hash || "#/director");
  const [webglAvailable] = useState(supportsWebGL);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [crowdOpen, setCrowdOpen] = useState(false);
  const toast = useDirectorStore((state) => state.toast);
  const setToast = useDirectorStore((state) => state.setToast);
  const setTransformMode = useDirectorStore((state) => state.setTransformMode);
  const updateScene = useDirectorStore((state) => state.updateScene);
  const scene = useDirectorStore((state) => state.scene);
  const undo = useDirectorStore((state) => state.undo);
  const redo = useDirectorStore((state) => state.redo);
  const removeObject = useDirectorStore((state) => state.removeObject);
  const removeCamera = useDirectorStore((state) => state.removeCamera);
  const selectedId = useDirectorStore((state) => state.selectedId);
  const objects = useDirectorStore((state) => state.objects);
  const cameras = useDirectorStore((state) => state.cameras);
  const addCamera = useDirectorStore((state) => state.addCamera);
  const setViewMode = useDirectorStore((state) => state.setViewMode);
  const resetDirectorView = useDirectorStore((state) => state.resetDirectorView);
  const groupSelected = useDirectorStore((state) => state.groupSelected);
  const ungroupSelected = useDirectorStore((state) => state.ungroupSelected);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || "#/director");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [setToast, toast]);

  useEffect(() => {
    // CanvasShell 路由下不注册导演台快捷键，避免误删场景对象
    if (route === "#/canvas") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, [contenteditable='true']")) return;
      // 模态框打开时禁用所有导演台快捷键，避免误操作
      if (captureOpen || crowdOpen) return;
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && key === "g") {
        event.preventDefault();
        event.shiftKey ? ungroupSelected() : groupSelected();
        return;
      }
      // 系统快捷键（Cmd+S/R/V 等）不触发变换模式
      if (event.metaKey || event.ctrlKey) return;
      if (key === "v") setTransformMode("translate");
      if (key === "r") setTransformMode("rotate");
      if (key === "s") setTransformMode("scale");
      if (key === "x") updateScene({ snapEnabled: !scene.snapEnabled });
      if (key === "y") { addCamera([0, 1.65, 8], [0, 1.2, 0]); setViewMode("camera"); }
      if (key === "t") { addCamera([0, 9, 0.1], [0, 0, 0]); setViewMode("camera"); }
      if (key === "q") resetDirectorView();
      // Escape 仅在无模态框时退出导演台
      if (key === "escape" && onExit) onExit();
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        if (objects.some((object) => object.id === selectedId)) removeObject(selectedId);
        if (cameras.some((camera) => camera.id === selectedId)) removeCamera(selectedId);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addCamera, cameras, captureOpen, crowdOpen, groupSelected, objects, onExit, redo, removeCamera, removeObject, resetDirectorView, route, scene.snapEnabled, selectedId, setTransformMode, setViewMode, undo, ungroupSelected, updateScene]);

  if (route === "#/canvas") return <><ProjectSync /><CanvasShell /></>;
  if (!webglAvailable) return <><ProjectSync /><GraphicsUnsupported /></>;

  return (
    <main className="app-shell director-shell">
      <ProjectSync />
      <Header />
      <div className="workspace">
        <ObjectTree />
        <section className="viewport">
          <Stage />
          <ViewportHud />
          <Toolbar onCapture={() => setCaptureOpen(true)} onCrowd={() => setCrowdOpen(true)} />
        </section>
        <Inspector />
      </div>
      {captureOpen && <CaptureDialog onClose={() => setCaptureOpen(false)} />}
      {crowdOpen && <CrowdDialog onClose={() => setCrowdOpen(false)} />}
      {toast && <div className="toast"><CheckCircle2 size={16} />{toast}</div>}
    </main>
  );
}
