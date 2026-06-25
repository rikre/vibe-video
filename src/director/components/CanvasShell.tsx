import { ChevronRight, Image as ImageIcon, Layers3, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDirectorStore } from "../store";

export default function CanvasShell() {
  const [directorVisible, setDirectorVisible] = useState(() => localStorage.getItem("vibevideo-director-node") !== "false");
  const captures = useDirectorStore((state) => state.captures);
  const objects = useDirectorStore((state) => state.objects);
  const cameras = useDirectorStore((state) => state.cameras);
  const sent = captures.filter((capture) => capture.sent);

  return (
    <main className="canvas-shell">
      <section
        className="infinite-canvas"
        onDoubleClick={(event) => {
          if ((event.target as HTMLElement).closest(".canvas-node")) return;
          setDirectorVisible(true);
          localStorage.setItem("vibevideo-director-node", "true");
        }}
      >
        <div className="canvas-breadcrumb">无限画布 <ChevronRight size={12} /> 导演构图</div>

        <svg className="canvas-connections" aria-hidden="true">
          {directorVisible && sent.map((_, index) => {
            const endY = 248 + index * 220;
            return <path key={index} d={`M 616 430 C 700 430, 690 ${endY}, 795 ${endY}`} />;
          })}
        </svg>

        {directorVisible && (
          <article className="canvas-node director-node">
            <header>
              <span className="node-type-icon"><Layers3 size={15} /></span>
              <div><b>导演台</b><span>3D DIRECTOR STAGE</span></div>
              <button
                title="隐藏导演台节点（数据保留）"
                onClick={() => {
                  setDirectorVisible(false);
                  localStorage.setItem("vibevideo-director-node", "false");
                }}
              ><Trash2 size={14} /></button>
            </header>
            <div className="director-node__preview">
              <div className="mini-grid" />
              <div className="mini-actor actor-one" />
              <div className="mini-actor actor-two" />
              <span className="mini-camera">CAM 01</span>
            </div>
            <div className="node-metrics">
              <span><b>{objects.length}</b> 场景对象</span>
              <span><b>{cameras.length}</b> 个机位</span>
              <span><b>{captures.length}</b> 张截图</span>
            </div>
            <button className="open-director" onClick={() => { window.location.hash = "#/director"; }}>
              打开导演台 <ChevronRight size={15} />
            </button>
            <span className="node-port output" />
          </article>
        )}

        {!directorVisible && (
          <button
            className="empty-director-node"
            onClick={() => {
              setDirectorVisible(true);
              localStorage.setItem("vibevideo-director-node", "true");
            }}
          >
            <Plus size={18} /><b>新建导演台节点</b><span>或双击画布空白处</span>
          </button>
        )}

        {sent.map((capture, index) => (
          <article className="canvas-node image-node" key={capture.id} style={{ top: 150 + index * 220 }}>
            <header>
              <span className="node-type-icon image"><ImageIcon size={14} /></span>
              <div><b>导演台截图 {index + 1}</b><span>{capture.ratio} · 构图参考</span></div>
              <button><MoreHorizontal size={16} /></button>
            </header>
            <img src={capture.imageUrl} alt={`导演台截图 ${index + 1}`} />
            <footer><span className="status-light" /> 已从机位发送</footer>
            <span className="node-port input" />
          </article>
        ))}

        {sent.length === 0 && (
          <div className="canvas-empty-output">
            <ImageIcon size={17} />
            导演台截图将出现在这里
          </div>
        )}
      </section>
    </main>
  );
}
