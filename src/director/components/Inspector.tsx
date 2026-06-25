import {
  Aperture,
  Box,
  Camera,
  Check,
  Image as ImageIcon,
  Layers3,
  Send,
  SlidersHorizontal,
  Trash2,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDirectorStore } from "../store";
import {
  deleteCaptureFile,
  fileToDataUrl,
  getProjectId,
  sendCaptureToCanvas,
  uploadAsset,
  uploadAssetData,
} from "../api";
import type { CameraObject, SceneObject, Transform, Vec3 } from "../types";

type InspectorTab = "selection" | "scene" | "captures";

const round = (value: number) => Number(value.toFixed(2));

function convertImageToPanorama(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("读取文件失败"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("图片加载失败，可能为不支持的格式"));
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1600;
        canvas.height = 800;
        const context = canvas.getContext("2d")!;
        const coverScale = Math.max(canvas.width / image.width, canvas.height / image.height);
        const coverW = image.width * coverScale;
        const coverH = image.height * coverScale;
        context.filter = "blur(28px) saturate(0.82)";
        context.globalAlpha = 0.74;
        context.drawImage(image, (canvas.width - coverW) / 2, (canvas.height - coverH) / 2, coverW, coverH);
        context.filter = "none";
        context.globalAlpha = 1;
        const fitScale = Math.min(canvas.width * 0.56 / image.width, canvas.height * 0.9 / image.height);
        const fitW = image.width * fitScale;
        const fitH = image.height * fitScale;
        const x = (canvas.width - fitW) / 2;
        const y = (canvas.height - fitH) / 2;
        context.drawImage(image, x, y, fitW, fitH);
        const fade = context.createLinearGradient(0, 0, canvas.width, 0);
        fade.addColorStop(0, "rgba(0,0,0,.2)");
        fade.addColorStop(0.24, "rgba(0,0,0,0)");
        fade.addColorStop(0.76, "rgba(0,0,0,0)");
        fade.addColorStop(1, "rgba(0,0,0,.2)");
        context.fillStyle = fade;
        context.fillRect(0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function AxisFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Vec3;
  onChange: (value: Vec3) => void;
}) {
  return (
    <Field label={label}>
      <div className="axis-fields">
        {(["X", "Y", "Z"] as const).map((axis, index) => (
          <label className={`axis axis-${axis.toLowerCase()}`} key={axis}>
            <span>{axis}</span>
            <input
              type="number"
              step="0.1"
              value={round(value[index])}
              onChange={(event) => {
                const raw = event.target.value;
                if (raw === '' || raw === '-') return;
                const parsed = Number(raw);
                if (!Number.isFinite(parsed)) return;
                const next = [...value] as Vec3;
                next[index] = parsed;
                onChange(next);
              }}
            />
          </label>
        ))}
      </div>
    </Field>
  );
}

function ObjectProperties({ object }: { object: SceneObject }) {
  const updateObject = useDirectorStore((state) => state.updateObject);
  const updateTransform = useDirectorStore((state) => state.updateObjectTransform);
  const setTransform = (key: keyof Transform, value: Vec3) =>
    updateTransform(object.id, { ...object.transform, [key]: value });
  return (
    <div className="inspector-content">
      <div className="selection-summary">
        <span className="selection-icon" style={{ color: object.color }}>
          {object.type === "actor" ? <UserRound size={18} /> : <Box size={18} />}
        </span>
        <div>
          <b>{object.type === "actor" ? "角色" : object.type === "uploaded-model" ? "本地模型" : "几何模型"}</b>
          <span>{object.preset}</span>
        </div>
        <span className="selected-chip">SELECTED</span>
      </div>
      <section className="property-section">
        <h3>基础属性</h3>
        <Field label="名称">
          <input className="text-input" value={object.name} onChange={(event) => updateObject(object.id, { name: event.target.value })} />
        </Field>
        <AxisFields label="位置" value={object.transform.position} onChange={(value) => setTransform("position", value)} />
        <AxisFields label="旋转" value={object.transform.rotation} onChange={(value) => setTransform("rotation", value)} />
        <AxisFields label="缩放" value={object.transform.scale} onChange={(value) => setTransform("scale", value)} />
        <Field label="统一缩放">
          <div className="range-row">
            <input
              type="range"
              min="0.2"
              max="3"
              step="0.05"
              value={object.transform.scale[0]}
              onChange={(event) => {
                const value = Number(event.target.value);
                setTransform("scale", [value, value, value]);
              }}
            />
            <output>{object.transform.scale[0].toFixed(2)}</output>
          </div>
        </Field>
        <Field label="颜色">
          <div className="color-field">
            <input type="color" value={object.color} onChange={(event) => updateObject(object.id, { color: event.target.value })} />
            <input className="text-input mono" value={object.color.toUpperCase()} onChange={(event) => updateObject(object.id, { color: event.target.value })} />
          </div>
        </Field>
      </section>
      {object.type === "actor" && (
        <section className="property-section compact">
          <h3>姿势控制</h3>
          <div className="pose-options">
            {(["站立", "招手", "奔跑", "坐姿"] as const).map((pose) => (
              <button
                key={pose}
                className={(object.pose ?? "站立") === pose ? "active" : ""}
                onClick={() => updateObject(object.id, { pose })}
              >
                <span className={`pose-figure pose-${pose}`} aria-hidden="true">人</span>
                {pose}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CameraProperties({ camera }: { camera: CameraObject }) {
  const updateCamera = useDirectorStore((state) => state.updateCamera);
  const setViewMode = useDirectorStore((state) => state.setViewMode);
  const objects = useDirectorStore((state) => state.objects);
  const actors = useMemo(() => objects.filter((object) => object.type === "actor"), [objects]);
  return (
    <div className="inspector-content">
      <div className="camera-preview-card">
        <div className="camera-preview-grid">
          <span />
        </div>
        <div className="camera-preview-meta">
          <span><span className="live-dot on" /> LIVE</span>
          <button onClick={() => setViewMode("camera")}>切换机位</button>
        </div>
      </div>
      <section className="property-section">
        <h3>摄像机属性</h3>
        <Field label="名称">
          <input className="text-input" value={camera.name} onChange={(event) => updateCamera(camera.id, { name: event.target.value })} />
        </Field>
        <AxisFields label="位置" value={camera.position} onChange={(position) => updateCamera(camera.id, { position })} />
        <Field label="FOV · 视场角">
          <div className="range-row accent">
            <input
              type="range"
              min="10"
              max="120"
              step="1"
              value={camera.fov}
              onChange={(event) => updateCamera(camera.id, { fov: Number(event.target.value) })}
            />
            <output>{camera.fov}°</output>
          </div>
        </Field>
      </section>
      <section className="property-section">
        <h3>注视目标</h3>
        <div className="segmented-mini">
          <button
            className={!camera.targetObjectId ? "active" : ""}
            onClick={() => updateCamera(camera.id, { targetObjectId: undefined })}
          >手动坐标</button>
          <button
            className={camera.targetObjectId ? "active" : ""}
            disabled={!actors.length}
            onClick={() => updateCamera(camera.id, { targetObjectId: actors[0]?.id })}
          >绑定角色</button>
        </div>
        {camera.targetObjectId ? (
          <Field label="跟随角色">
            <select
              className="text-input"
              value={camera.targetObjectId}
              onChange={(event) => updateCamera(camera.id, { targetObjectId: event.target.value })}
            >
              {actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}
            </select>
          </Field>
        ) : (
          <AxisFields label="目标坐标" value={camera.target} onChange={(target) => updateCamera(camera.id, { target })} />
        )}
      </section>
    </div>
  );
}

function SceneProperties() {
  const scene = useDirectorStore((state) => state.scene);
  const updateScene = useDirectorStore((state) => state.updateScene);
  const captures = useDirectorStore((state) => state.captures);
  const setToast = useDirectorStore((state) => state.setToast);
  return (
    <div className="inspector-content">
      <div className="selection-summary scene-summary">
        <span className="selection-icon"><Layers3 size={18} /></span>
        <div><b>3D 场景</b><span>整体空间设置</span></div>
      </div>
      <section className="property-section">
        <h3>场景变换</h3>
        <Field label="场景缩放">
          <div className="range-row accent">
            <input type="range" min="0.25" max="4" step="0.05" value={scene.sceneScale} onChange={(event) => updateScene({ sceneScale: Number(event.target.value) })} />
            <output>{Math.round(scene.sceneScale * 100)}%</output>
          </div>
        </Field>
        <AxisFields label="场景平移" value={scene.scenePosition} onChange={(scenePosition) => updateScene({ scenePosition })} />
        <AxisFields label="场景旋转" value={scene.sceneRotation} onChange={(sceneRotation) => updateScene({ sceneRotation })} />
      </section>
      <section className="property-section">
        <h3>环境</h3>
        <Field label="天空颜色">
          <div className="color-field">
            <input type="color" value={scene.skyColor} onChange={(event) => updateScene({ skyColor: event.target.value })} />
            <input className="text-input mono" value={scene.skyColor.toUpperCase()} readOnly />
          </div>
        </Field>
        <Field label="全景背景">
          <div className="panorama-upload">
            <label>
              <ImageIcon size={14} />
              {scene.panoramaUrl ? "更换全景图" : "本地上传"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const fallback = await fileToDataUrl(file);
                  try {
                    const stored = await uploadAsset(getProjectId(), file);
                    updateScene({ panoramaUrl: stored.url });
                  } catch {
                    updateScene({ panoramaUrl: fallback });
                    setToast("项目服务暂不可用，全景图已保存在本机草稿");
                  }
                }}
              />
            </label>
            <label title="本地近似转换，不调用 AI 模型">
              <Layers3 size={14} />
              普通图转全景
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const panoramaUrl = await convertImageToPanorama(file);
                    try {
                      const stored = await uploadAssetData(getProjectId(), panoramaUrl, `${file.name.replace(/\.[^.]+$/, "")}-panorama.jpg`);
                      updateScene({ panoramaUrl: stored.url });
                    } catch {
                      updateScene({ panoramaUrl });
                      setToast("项目服务暂不可用，近似全景已保存在本机草稿");
                    }
                  } catch (error) {
                    setToast(error instanceof Error ? error.message : "图片转换失败");
                  }
                }}
              />
            </label>
            {scene.panoramaUrl && <button onClick={() => updateScene({ panoramaUrl: undefined })}>清除</button>}
          </div>
          {captures.length > 0 && (
            <select
              className="text-input panorama-history"
              defaultValue=""
              onChange={(event) => {
                const capture = captures.find((item) => item.id === event.target.value);
                if (capture) updateScene({ panoramaUrl: capture.imageUrl });
              }}
            >
              <option value="" disabled>从生成历史选择…</option>
              {captures.map((capture, index) => <option value={capture.id} key={capture.id}>截图 {index + 1} · {capture.ratio}</option>)}
            </select>
          )}
          <p className="field-note">“普通图转全景”为复刻版的本地近似预览；正式 AI 转换需接入后端模型。</p>
        </Field>
        <Field label="全景球水平旋转">
          <div className="range-row">
            <input type="range" min="0" max="360" value={scene.panoramaRotation} onChange={(event) => updateScene({ panoramaRotation: Number(event.target.value) })} />
            <output>{scene.panoramaRotation}°</output>
          </div>
        </Field>
        <Field label="球形半径">
          <div className="range-row">
            <input type="range" min="20" max="400" value={scene.panoramaRadius} onChange={(event) => updateScene({ panoramaRadius: Number(event.target.value) })} />
            <output>{scene.panoramaRadius}</output>
          </div>
        </Field>
      </section>
      <section className="property-section">
        <h3>显示辅助</h3>
        <Toggle label="角色标签" checked={scene.showLabels} onChange={(showLabels) => updateScene({ showLabels })} />
        <Toggle label="网格吸附" hint="X" checked={scene.snapEnabled} onChange={(snapEnabled) => updateScene({ snapEnabled })} />
        <Toggle label="地面" checked={scene.groundVisible} onChange={(groundVisible) => updateScene({ groundVisible })} />
        <Field label="地面透明度">
          <div className="range-row">
            <input type="range" min="0" max="1" step="0.01" value={scene.groundOpacity} onChange={(event) => updateScene({ groundOpacity: Number(event.target.value) })} />
            <output>{scene.groundOpacity.toFixed(2)}</output>
          </div>
        </Field>
        <Field label="地面高度">
          <div className="range-row">
            <input type="range" min="-2" max="2" step="0.05" value={scene.groundHeight} onChange={(event) => updateScene({ groundHeight: Number(event.target.value) })} />
            <output>{scene.groundHeight.toFixed(1)}</output>
          </div>
        </Field>
      </section>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle-row">
      <span>{label}{hint && <kbd>{hint}</kbd>}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i />
    </label>
  );
}

function Captures() {
  const captures = useDirectorStore((state) => state.captures);
  const cameras = useDirectorStore((state) => state.cameras);
  const toggle = useDirectorStore((state) => state.toggleCapture);
  const remove = useDirectorStore((state) => state.deleteCapture);
  const clear = useDirectorStore((state) => state.clearCaptures);
  const send = useDirectorStore((state) => state.sendCaptures);
  const markCaptureSent = useDirectorStore((state) => state.markCaptureSent);
  const setToast = useDirectorStore((state) => state.setToast);
  const selectedCount = captures.filter((capture) => capture.selected).length;
  return (
    <div className="capture-panel">
      <div className="capture-heading">
        <div><b>机位截图</b><span>{captures.length} 张构图</span></div>
        {captures.length > 0 && <button onClick={() => {
          const ids = captures.map((capture) => capture.id);
          clear();
          void Promise.allSettled(ids.map((captureId) => deleteCaptureFile(getProjectId(), captureId)));
        }}>全部清空</button>}
      </div>
      {captures.length === 0 ? (
        <div className="empty-captures">
          <span className="empty-frame"><ImageIcon size={22} /></span>
          <b>暂无图像数据</b>
          <p>选择机位并点击底部相机按钮，生成第一张构图参考。</p>
        </div>
      ) : (
        <div className="capture-grid">
          {captures.map((capture) => {
            const camera = cameras.find((item) => item.id === capture.cameraId);
            return (
              <div
                className={`capture-card ${capture.selected ? "selected" : ""}`}
                key={capture.id}
                role="button"
                tabIndex={0}
                onClick={() => toggle(capture.id)}
                onKeyDown={(event) => event.key === "Enter" && toggle(capture.id)}
              >
                <img src={capture.imageUrl} alt={`${camera?.name ?? "已删除机位"}截图`} />
                <span className="capture-check">{capture.selected && <Check size={12} />}</span>
                <span className="capture-ratio">{capture.ratio}</span>
                {capture.sent && <span className="sent-chip">已发送</span>}
                <span className="capture-name">{camera?.name ?? "已删除机位"}</span>
                <button className="capture-delete" onClick={(event) => {
                  event.stopPropagation();
                  remove(capture.id);
                  void deleteCaptureFile(getProjectId(), capture.id);
                }}><Trash2 size={12} /></button>
              </div>
            );
          })}
        </div>
      )}
      <button className="send-button" disabled={!selectedCount} onClick={() => {
        const selected = captures.filter((capture) => capture.selected);
        const ids = send();
        if (!ids.length) return;
        void Promise.allSettled(selected.map((capture) => sendCaptureToCanvas(getProjectId(), capture)))
          .then((results) => {
            let successCount = 0;
            let failureCount = 0;
            results.forEach((result, index) => {
              const capture = selected[index];
              if (result.status === "fulfilled") {
                successCount += 1;
                markCaptureSent(capture.id, true);
              } else {
                failureCount += 1;
                // 发送失败时恢复 selected 状态，允许用户重试
              }
            });
            if (failureCount) setToast(`${successCount} 张已发送；${failureCount} 张发送失败，可重新选择后重试`);
            else setToast(`已发送 ${successCount} 张截图到画布`);
          });
      }}>
        <Send size={15} /> 发送到画布 {selectedCount > 0 && <span>{selectedCount}</span>}
      </button>
    </div>
  );
}

export default function Inspector() {
  const selectedId = useDirectorStore((state) => state.selectedId);
  const objects = useDirectorStore((state) => state.objects);
  const cameras = useDirectorStore((state) => state.cameras);
  const [tab, setTab] = useState<InspectorTab>("selection");
  const selected = useMemo(
    () => objects.find((object) => object.id === selectedId) ?? cameras.find((camera) => camera.id === selectedId),
    [cameras, objects, selectedId],
  );

  return (
    <aside className="right-panel panel">
      <div className="inspector-tabs">
        <button className={tab === "selection" ? "active" : ""} onClick={() => setTab("selection")} title="属性">
          <SlidersHorizontal size={16} /><span>属性</span>
        </button>
        <button className={tab === "scene" ? "active" : ""} onClick={() => setTab("scene")} title="3D场景">
          <Layers3 size={16} /><span>场景</span>
        </button>
        <button className={tab === "captures" ? "active" : ""} onClick={() => setTab("captures")} title="摄像机数据">
          <Aperture size={16} /><span>截图</span>
        </button>
      </div>
      {tab === "scene" ? (
        <SceneProperties />
      ) : tab === "captures" ? (
        <Captures />
      ) : !selected ? (
        <div className="empty-selection"><SlidersHorizontal size={22} /><b>未选择对象</b><span>从左侧列表或 3D 场景中选择一个对象</span></div>
      ) : "transform" in selected ? (
        <ObjectProperties object={selected} />
      ) : (
        <CameraProperties camera={selected} />
      )}
    </aside>
  );
}
