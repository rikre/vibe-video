import {
  Box,
  Camera,
  ChevronDown,
  Circle,
  Cuboid,
  Expand,
  Focus,
  MousePointer2,
  Move3d,
  Redo2,
  Rotate3d,
  Scale3d,
  Scan,
  Undo2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { useDirectorStore } from "../store";
import { fileToDataUrl, getProjectId, uploadAsset } from "../api";
import type { ActorPreset, PrimitivePreset, TransformMode } from "../types";

const actors: ActorPreset[] = ["男性身体", "女性身体", "宽厚身体", "健壮身体", "纤细身体", "少年身体", "儿童身体"];
const primitives: { label: PrimitivePreset; icon: React.ReactNode }[] = [
  { label: "立方体", icon: <Cuboid size={15} /> },
  { label: "球体", icon: <Circle size={15} /> },
  { label: "圆柱体", icon: <Box size={15} /> },
];

function ToolButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className={`tool-button ${active ? "active" : ""}`} title={title} onClick={onClick}>
      {children}
    </button>
  );
}

function TransformTool({ mode, title, icon, shortcut }: { mode: TransformMode; title: string; icon: React.ReactNode; shortcut: string }) {
  const current = useDirectorStore((state) => state.transformMode);
  const setMode = useDirectorStore((state) => state.setTransformMode);
  return (
    <ToolButton title={`${title} (${shortcut})`} active={current === mode} onClick={() => setMode(mode)}>
      {icon}<kbd>{shortcut}</kbd>
    </ToolButton>
  );
}

export default function Toolbar({ onCapture, onCrowd }: { onCapture: () => void; onCrowd: () => void }) {
  const [menu, setMenu] = useState<"actor" | "primitive" | "camera" | null>(null);
  const addActor = useDirectorStore((state) => state.addActor);
  const addPrimitive = useDirectorStore((state) => state.addPrimitive);
  const addUploadedModel = useDirectorStore((state) => state.addUploadedModel);
  const setToast = useDirectorStore((state) => state.setToast);
  const addCamera = useDirectorStore((state) => state.addCamera);
  const setViewMode = useDirectorStore((state) => state.setViewMode);
  const undo = useDirectorStore((state) => state.undo);
  const redo = useDirectorStore((state) => state.redo);
  const past = useDirectorStore((state) => state.past);
  const future = useDirectorStore((state) => state.future);

  const importModel = async (files: File[]) => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 5 * 1024 * 1024) throw new Error("模型及依赖文件合计需小于 5MB");
    const gltfFile = files.find((file) => /\.gltf$/i.test(file.name));
    if (!gltfFile) {
      const glbFile = files.find((file) => /\.glb$/i.test(file.name));
      if (!glbFile) throw new Error("请选择 GLB 或 glTF 主文件");
      const header = await glbFile.slice(0, 4).arrayBuffer();
      if (new TextDecoder().decode(header) !== "glTF") throw new Error("文件不是有效的 GLB 模型");
      const localDataUrl = await fileToDataUrl(glbFile);
      try {
        const stored = await uploadAsset(getProjectId(), glbFile);
        addUploadedModel(glbFile.name, stored.url);
      } catch {
        addUploadedModel(glbFile.name, localDataUrl);
        setToast("项目服务暂不可用，模型已保存在本机草稿");
      }
      return;
    }

    let document: any;
    try {
      document = JSON.parse(await gltfFile.text());
    } catch {
      throw new Error("glTF 主文件不是有效 JSON");
    }
    if (!String(document?.asset?.version ?? "").startsWith("2")) throw new Error("仅支持 glTF 2.0");
    const references: Array<{ owner: Record<string, unknown>; uri: string }> = [];
    for (const owner of [...(document.buffers ?? []), ...(document.images ?? [])]) {
      if (typeof owner?.uri === "string" && !owner.uri.startsWith("data:")) references.push({ owner, uri: owner.uri });
    }
    if (references.some(({ uri }) => /^(https?:)?\/\//i.test(uri))) throw new Error("glTF 不允许引用外部网络资源");
    const dependencyFor = (uri: string) => {
      const name = decodeURIComponent(uri.split(/[\\/]/).at(-1) ?? uri);
      return files.find((file) => file.name === name || file.webkitRelativePath === uri);
    };
    for (const reference of references) {
      if (!dependencyFor(reference.uri)) throw new Error(`缺少 glTF 依赖文件：${reference.uri}`);
    }

    const projectId = getProjectId();
    try {
      for (const reference of references) {
        const stored = await uploadAsset(projectId, dependencyFor(reference.uri)!);
        reference.owner.uri = stored.url;
      }
      const rewritten = new File([JSON.stringify(document)], gltfFile.name, { type: "model/gltf+json" });
      const stored = await uploadAsset(projectId, rewritten);
      addUploadedModel(gltfFile.name, stored.url);
    } catch {
      for (const reference of references) reference.owner.uri = await fileToDataUrl(dependencyFor(reference.uri)!);
      const local = new File([JSON.stringify(document)], gltfFile.name, { type: "model/gltf+json" });
      addUploadedModel(gltfFile.name, await fileToDataUrl(local));
      setToast("项目服务暂不可用，glTF 已嵌入本机草稿");
    }
  };

  const createPresetCamera = (position: [number, number, number], target: [number, number, number]) => {
    addCamera(position, target);
    setViewMode("camera");
    setMenu(null);
  };

  return (
    <div className="toolbar-wrap">
      {menu === "actor" && (
        <div className="tool-popover actor-popover">
          <div className="popover-kicker">添加人体素模</div>
          <div className="actor-options">
            {actors.map((preset, index) => (
              <button key={preset} onClick={() => { addActor(preset); setMenu(null); }}>
                <span className={`body-glyph body-${index}`}>人</span>
                <span>{preset}</span>
              </button>
            ))}
          </div>
          <button className="wide-option" onClick={() => { setMenu(null); onCrowd(); }}><UsersRound size={15} /> 群众阵列 <span>GRID</span></button>
        </div>
      )}
      {menu === "primitive" && (
        <div className="tool-popover primitive-popover">
          <div className="popover-kicker">添加基础元素</div>
          {primitives.map(({ label, icon }) => (
            <button key={label} onClick={() => { addPrimitive(label); setMenu(null); }}>{icon}{label}</button>
          ))}
          <label className="tool-upload">
            <Scan size={15} /> 本地上传 GLB / glTF <span>≤5MB</span>
            <input
              type="file"
              multiple
              accept=".glb,.gltf,.bin,image/png,image/jpeg,image/webp,model/gltf-binary,model/gltf+json"
              onChange={async (event) => {
                const files = Array.from(event.target.files ?? []);
                if (!files.length) return;
                setToast("正在解析模型…");
                try {
                  await importModel(files);
                  setMenu(null);
                } catch (error) {
                  setToast(error instanceof Error ? error.message : "模型导入失败");
                } finally {
                  event.target.value = "";
                }
              }}
            />
          </label>
        </div>
      )}
      {menu === "camera" && (
        <div className="tool-popover camera-popover">
          <div className="popover-kicker">创建预设机位</div>
          <div className="camera-presets">
            <button onClick={() => createPresetCamera([0, 1.65, 8], [0, 1.2, 0])}><span className="preset-diagram front" />正面全身<kbd>Y</kbd></button>
            <button onClick={() => createPresetCamera([0, 9, 0.1], [0, 0, 0])}><span className="preset-diagram top" />俯视机位<kbd>T</kbd></button>
            <button onClick={() => createPresetCamera([6.5, 2.2, 6.5], [0, 1.2, 0])}><span className="preset-diagram angle" />侧前 45°</button>
            <button onClick={() => createPresetCamera([-6.5, 2.2, 2], [0, 1.2, 0])}><span className="preset-diagram side" />侧面机位</button>
          </div>
        </div>
      )}

      <nav className="toolbar" aria-label="导演台工具栏">
        <div className="tool-group subtle">
          <ToolButton title="选择"><MousePointer2 size={17} /></ToolButton>
        </div>
        <div className="tool-divider" />
        <div className="tool-group">
          <TransformTool mode="translate" title="移动" shortcut="V" icon={<Move3d size={17} />} />
          <TransformTool mode="rotate" title="旋转" shortcut="R" icon={<Rotate3d size={17} />} />
          <TransformTool mode="scale" title="缩放" shortcut="S" icon={<Scale3d size={17} />} />
        </div>
        <div className="tool-divider" />
        <div className="tool-group">
          <ToolButton title="添加角色" active={menu === "actor"} onClick={() => setMenu(menu === "actor" ? null : "actor")}>
            <UserPlus size={18} /><ChevronDown size={10} />
          </ToolButton>
          <ToolButton title="添加几何模型" active={menu === "primitive"} onClick={() => setMenu(menu === "primitive" ? null : "primitive")}>
            <Cuboid size={18} /><ChevronDown size={10} />
          </ToolButton>
        </div>
        <div className="tool-divider" />
        <div className="tool-group">
          <ToolButton title="预设机位" active={menu === "camera"} onClick={() => setMenu(menu === "camera" ? null : "camera")}>
            <Focus size={18} /><ChevronDown size={10} />
          </ToolButton>
          <ToolButton title="截图" onClick={onCapture}><Camera size={18} /></ToolButton>
          <ToolButton title="全屏" onClick={() => document.documentElement.requestFullscreen?.()}><Expand size={17} /></ToolButton>
        </div>
        <div className="tool-divider" />
        <div className="tool-group subtle">
          <ToolButton title="撤销 (⌘Z)" onClick={undo} active={past.length > 0}><Undo2 size={16} /></ToolButton>
          <ToolButton title="重做 (⇧⌘Z)" onClick={redo} active={future.length > 0}><Redo2 size={16} /></ToolButton>
        </div>
      </nav>
    </div>
  );
}
