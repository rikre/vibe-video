import {
  BoxSelect,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Image as ImageIcon,
  Layers3,
  Maximize,
  Minus,
  MoreHorizontal,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { useDirectorStore } from "../store";

export default function CanvasShell() {
  const [directorVisible, setDirectorVisible] = useState(() => localStorage.getItem("vibevideo-director-node") !== "false");
  const [addOpen, setAddOpen] = useState(false);
  const captures = useDirectorStore((state) => state.captures);
  const objects = useDirectorStore((state) => state.objects);
  const cameras = useDirectorStore((state) => state.cameras);
  const sent = captures.filter((capture) => capture.sent);

  return (
    <main className="canvas-shell">
      <header className="canvas-header">
        <div className="canvas-header__left">
          <button className="icon-button"><ChevronLeft size={17} /></button>
          <span className="product-mark">VV</span>
          <div>
            <b>构图测试项目</b>
            <span>AUTO SAVED</span>
          </div>
        </div>
        <div className="canvas-header__right">
          <button><Share2 size={14} /> 分享</button>
          <button className="primary"><Sparkles size={14} /> 发布作品</button>
          <button className="icon-button"><CircleHelp size={16} /></button>
          <span className="canvas-avatar">驴</span>
        </div>
      </header>
      <aside className="canvas-rail">
        <button className="active" onClick={() => setAddOpen((value) => !value)}><Plus size={18} /><span>添加</span></button>
        <button><Workflow size={18} /><span>工作流</span></button>
        <button><BoxSelect size={18} /><span>资产</span></button>
        <button><Layers3 size={18} /><span>历史</span></button>
      </aside>
      <section
        className="infinite-canvas"
        onDoubleClick={(event) => {
          if ((event.target as HTMLElement).closest(".canvas-node")) return;
          setDirectorVisible(true);
          localStorage.setItem("vibevideo-director-node", "true");
        }}
      >
        <div className="canvas-breadcrumb">无限画布 <ChevronRight size={12} /> 导演构图</div>
        {addOpen && (
          <div className="canvas-add-menu">
            <span>添加工具节点</span>
            <button
              disabled={directorVisible}
              onClick={() => {
                setDirectorVisible(true);
                setAddOpen(false);
                localStorage.setItem("vibevideo-director-node", "true");
              }}
            >
              <Layers3 size={15} /><div><b>导演台</b><small>轻量 3D 构图与多机位截图</small></div>
            </button>
          </div>
        )}
        <svg className="canvas-connections" aria-hidden="true">
          {directorVisible && sent.map((_, index) => {
            const endY = 248 + index * 220;
            return (
              <path key={index} d={`M 616 430 C 700 430, 690 ${endY}, 795 ${endY}`} />
            );
          })}
        </svg>
        {directorVisible && <article className="canvas-node director-node">
          <header>
            <span className="node-type-icon"><Layers3 size={15} /></span>
            <div><b>导演台</b><span>3D DIRECTOR STAGE</span></div>
            <button
              title="删除导演台节点"
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
        </article>}

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
        <div className="canvas-minimap">
          <span className="minimap-node main" />
          {sent.map((capture, index) => <span key={capture.id} className="minimap-node output" style={{ top: 12 + index * 8 }} />)}
          <i />
        </div>
        <div className="canvas-zoom">
          <button><Minus size={14} /></button><span>75%</span><button><Plus size={14} /></button><button><Maximize size={14} /></button>
        </div>
      </section>
    </main>
  );
}
