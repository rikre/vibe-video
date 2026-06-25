import { Box, Camera, ChevronDown, ChevronRight, Eye, EyeOff, Group, Search, Trash2, Ungroup, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useDirectorStore } from "../store";
import type { CameraObject, SceneObject } from "../types";

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="tree-section">
      <button className="tree-section__head" onClick={() => setOpen((value) => !value)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{title}</span>
        <b>{count}</b>
      </button>
      {open && <div className="tree-section__body">{children}</div>}
    </section>
  );
}

function ObjectRow({ object }: { object: SceneObject }) {
  const selectedIds = useDirectorStore((state) => state.selectedIds);
  const select = useDirectorStore((state) => state.select);
  const toggleSelect = useDirectorStore((state) => state.toggleSelect);
  const updateObject = useDirectorStore((state) => state.updateObject);
  const removeObject = useDirectorStore((state) => state.removeObject);
  return (
    <div
      className={`tree-row ${selectedIds.includes(object.id) ? "selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={(event) => (event.metaKey || event.ctrlKey || event.shiftKey ? toggleSelect(object.id) : select(object.id))}
      onKeyDown={(event) => event.key === "Enter" && select(object.id)}
    >
      <span className="tree-row__type">
        {object.type === "actor" ? <UserRound size={14} /> : <Box size={14} />}
      </span>
      <span className="tree-row__name">{object.name}</span>
      {object.groupId && <span className="group-mark">G</span>}
      <span className="tree-row__actions">
        <button
          title={object.visible ? "隐藏" : "显示"}
          onClick={(event) => {
            event.stopPropagation();
            updateObject(object.id, { visible: !object.visible });
          }}
        >
          {object.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
        <button
          title="删除"
          onClick={(event) => {
            event.stopPropagation();
            removeObject(object.id);
          }}
        >
          <Trash2 size={13} />
        </button>
      </span>
    </div>
  );
}

function CameraRow({ camera }: { camera: CameraObject }) {
  const selectedId = useDirectorStore((state) => state.selectedId);
  const activeCameraId = useDirectorStore((state) => state.activeCameraId);
  const setActiveCamera = useDirectorStore((state) => state.setActiveCamera);
  const removeCamera = useDirectorStore((state) => state.removeCamera);
  return (
    <div
      className={`tree-row ${selectedId === camera.id ? "selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => setActiveCamera(camera.id)}
      onKeyDown={(event) => event.key === "Enter" && setActiveCamera(camera.id)}
    >
      <span className={`tree-row__type camera ${activeCameraId === camera.id ? "active" : ""}`}>
        <Camera size={14} />
      </span>
      <span className="tree-row__name">{camera.name}</span>
      <span className="tree-row__actions">
        <span className={`live-dot ${activeCameraId === camera.id ? "on" : ""}`} />
        <button
          title="删除机位"
          onClick={(event) => {
            event.stopPropagation();
            removeCamera(camera.id);
          }}
        >
          <Trash2 size={13} />
        </button>
      </span>
    </div>
  );
}

export default function ObjectTree() {
  const objects = useDirectorStore((state) => state.objects);
  const cameras = useDirectorStore((state) => state.cameras);
  const [query, setQuery] = useState("");
  const selectedIds = useDirectorStore((state) => state.selectedIds);
  const groupSelected = useDirectorStore((state) => state.groupSelected);
  const ungroupSelected = useDirectorStore((state) => state.ungroupSelected);
  const filtered = useMemo(
    () => objects.filter((object) => object.name.toLowerCase().includes(query.toLowerCase())),
    [objects, query],
  );
  const actors = filtered.filter((object) => object.type === "actor");
  const primitives = filtered.filter((object) => object.type !== "actor");

  return (
    <aside className="left-panel panel">
      <div className="panel-title-row">
        <div>
          <span className="eyebrow">SCENE GRAPH</span>
          <h2>场景</h2>
        </div>
        <span className="object-total">{objects.length + cameras.length}</span>
      </div>
      <label className="search-box">
        <Search size={14} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索场景对象" />
        <kbd>⌘K</kbd>
      </label>
      <div className="tree-scroll">
        <Section title="机位" count={cameras.length}>
          {cameras.map((camera) => (
            <CameraRow key={camera.id} camera={camera} />
          ))}
        </Section>
        <Section title="角色" count={actors.length}>
          {actors.map((object) => (
            <ObjectRow key={object.id} object={object} />
          ))}
        </Section>
        <Section title="元素" count={primitives.length}>
          {primitives.map((object) => (
            <ObjectRow key={object.id} object={object} />
          ))}
        </Section>
      </div>
      {selectedIds.length > 1 ? (
        <footer className="group-actions">
          <span>已选 {selectedIds.length}</span>
          <button onClick={groupSelected}><Group size={13} /> 打组</button>
          <button onClick={ungroupSelected}><Ungroup size={13} /> 解组</button>
        </footer>
      ) : (
        <footer className="left-panel__footer">
          <span className="status-light" />
          场景实时同步 · ⌘/Shift 多选
        </footer>
      )}
    </aside>
  );
}
