import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Grid, Html, OrbitControls, TransformControls, useGLTF } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDirectorStore } from "../store";
import type { CameraObject, SceneObject, Transform } from "../types";

const toTransform = (object: THREE.Object3D): Transform => ({
  position: [object.position.x, object.position.y, object.position.z],
  rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
  scale: [object.scale.x, object.scale.y, object.scale.z],
});

function ActorModel({ object }: { object: SceneObject }) {
  const slim = object.preset === "纤细身体" || object.preset === "女性身体";
  const broad = object.preset === "宽厚身体" || object.preset === "健壮身体";
  const child = object.preset === "儿童身体" || object.preset === "少年身体";
  const torsoWidth = broad ? 0.62 : slim ? 0.38 : 0.48;
  const height = child ? 1.45 : 1.9;
  const skin = object.color;
  const pose = object.pose ?? "站立";
  const armRotation = (side: number): [number, number, number] => {
    if (pose === "招手" && side === 1) return [0, 0, 2.35];
    if (pose === "奔跑") return [side * 0.85, 0, side * 0.12];
    return [0, 0, side * 0.08];
  };
  const legRotation = (side: number): [number, number, number] => {
    if (pose === "坐姿") return [-1.18, 0, side * 0.05];
    if (pose === "奔跑") return [-side * 0.78, 0, side * 0.05];
    return [0, 0, side * 0.03];
  };
  return (
    <group position={[0, pose === "坐姿" ? height / 2 - 0.35 : height / 2, 0]}>
      <mesh position={[0, height * 0.38, 0]} castShadow>
        <sphereGeometry args={[child ? 0.18 : 0.22, 24, 24]} />
        <meshStandardMaterial color={skin} roughness={0.62} />
      </mesh>
      <mesh position={[0, height * 0.08, 0]} castShadow>
        <capsuleGeometry args={[torsoWidth, height * 0.38, 8, 16]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={`limbs-${side}`}>
          <mesh position={[side * (torsoWidth + 0.15), height * 0.08, 0]} rotation={armRotation(side)} castShadow>
            <capsuleGeometry args={[0.08, height * 0.42, 6, 12]} />
            <meshStandardMaterial color={skin} roughness={0.72} />
          </mesh>
          <mesh position={[side * 0.2, -height * 0.34, pose === "坐姿" ? 0.32 : 0]} rotation={legRotation(side)} castShadow>
            <capsuleGeometry args={[0.11, height * 0.44, 6, 12]} />
            <meshStandardMaterial color={skin} roughness={0.72} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PrimitiveModel({ object }: { object: SceneObject }) {
  const material = <meshStandardMaterial color={object.color} roughness={0.55} metalness={0.05} />;
  if (object.preset === "球体") {
    return (
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.65, 32, 24]} />
        {material}
      </mesh>
    );
  }
  if (object.preset === "圆柱体") {
    return (
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.55, 1.25, 32]} />
        {material}
      </mesh>
    );
  }
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1.15, 1.15, 1.15]} />
      {material}
    </mesh>
  );
}

function UploadedModel({ object }: { object: SceneObject }) {
  const model = useGLTF(object.modelDataUrl!);
  const cloned = useMemo(() => {
    const next = model.scene.clone(true);
    const box = new THREE.Box3().setFromObject(next);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
    next.position.sub(center);
    next.scale.setScalar(2 / maxDimension);
    return next;
  }, [model.scene]);
  return <primitive object={cloned} />;
}

function SceneObjectView({ object }: { object: SceneObject }) {
  const ref = useRef<THREE.Group>(null);
  const selectedId = useDirectorStore((state) => state.selectedId);
  const selectedIds = useDirectorStore((state) => state.selectedIds);
  const select = useDirectorStore((state) => state.select);
  const toggleSelect = useDirectorStore((state) => state.toggleSelect);
  const mode = useDirectorStore((state) => state.transformMode);
  const checkpoint = useDirectorStore((state) => state.checkpoint);
  const updateTransform = useDirectorStore((state) => state.updateObjectTransform);
  const showLabels = useDirectorStore((state) => state.scene.showLabels);
  const cleanCapture = useDirectorStore((state) => state.cleanCapture);
  const snap = useDirectorStore((state) => state.scene.snapEnabled);
  const selected = selectedId === object.id;

  useEffect(() => {
    const group = ref.current;
    if (!group) return;
    group.position.fromArray(object.transform.position);
    group.rotation.fromArray([...object.transform.rotation, "XYZ"]);
    group.scale.fromArray(object.transform.scale);
  }, [object.transform]);

  const content = (
    <group
      ref={ref}
      visible={object.visible}
      onClick={(event) => {
        event.stopPropagation();
        const native = event.nativeEvent as MouseEvent;
        if (native.metaKey || native.ctrlKey || native.shiftKey) toggleSelect(object.id);
        else select(object.id);
      }}
    >
      {object.type === "actor" ? (
        <ActorModel object={object} />
      ) : object.type === "uploaded-model" && object.modelDataUrl ? (
        <UploadedModel object={object} />
      ) : (
        <PrimitiveModel object={object} />
      )}
      {showLabels && !cleanCapture && (
        <Html position={[0, object.type === "actor" ? 2.35 : 1.05, 0]} center distanceFactor={11}>
          <span className={`world-label ${selectedIds.includes(object.id) ? "is-selected" : ""}`}>{object.name}</span>
        </Html>
      )}
    </group>
  );

  if (!selected || !object.visible || cleanCapture) return content;

  return (
    <TransformControls
      mode={mode}
      translationSnap={snap ? 0.25 : null}
      rotationSnap={snap ? Math.PI / 12 : null}
      scaleSnap={snap ? 0.1 : null}
      onMouseDown={checkpoint}
      onObjectChange={() => {
        if (ref.current) updateTransform(object.id, toTransform(ref.current), false);
      }}
    >
      {content}
    </TransformControls>
  );
}

function InstancedActors({ objects }: { objects: SceneObject[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const select = useDirectorStore((state) => state.select);
  const toggleSelect = useDirectorStore((state) => state.toggleSelect);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const objectMatrix = new THREE.Matrix4();
    const offsetMatrix = new THREE.Matrix4();
    const bodyScaleMatrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    objects.forEach((object, index) => {
      const child = object.preset === "儿童身体" || object.preset === "少年身体";
      const broad = object.preset === "宽厚身体" || object.preset === "健壮身体";
      const slim = object.preset === "纤细身体" || object.preset === "女性身体";
      const width = broad ? 1.24 : slim ? 0.82 : 1;
      const height = child ? 0.76 : 1;
      position.fromArray(object.transform.position);
      quaternion.setFromEuler(new THREE.Euler(...object.transform.rotation));
      scale.fromArray(object.transform.scale);
      objectMatrix.compose(position, quaternion, scale);
      offsetMatrix.makeTranslation(0, child ? 0.68 : 0.9, 0);
      bodyScaleMatrix.makeScale(width, height, width);
      matrix.copy(objectMatrix).multiply(offsetMatrix).multiply(bodyScaleMatrix);
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, new THREE.Color(object.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [objects]);

  if (!objects.length) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, objects.length]}
      castShadow={false}
      receiveShadow={false}
      onClick={(event) => {
        event.stopPropagation();
        const object = event.instanceId === undefined ? undefined : objects[event.instanceId];
        if (!object) return;
        const native = event.nativeEvent as MouseEvent;
        if (native.metaKey || native.ctrlKey || native.shiftKey) toggleSelect(object.id);
        else select(object.id);
      }}
    >
      <capsuleGeometry args={[0.31, 1.18, 4, 8]} />
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  );
}

function CameraMarker({ cameraObject }: { cameraObject: CameraObject }) {
  const ref = useRef<THREE.Group>(null);
  const selectedId = useDirectorStore((state) => state.selectedId);
  const select = useDirectorStore((state) => state.select);
  const setActive = useDirectorStore((state) => state.setActiveCamera);
  const mode = useDirectorStore((state) => state.transformMode);
  const checkpoint = useDirectorStore((state) => state.checkpoint);
  const updateCamera = useDirectorStore((state) => state.updateCamera);
  const activeCameraId = useDirectorStore((state) => state.activeCameraId);
  const selected = selectedId === cameraObject.id;
  const isActive = activeCameraId === cameraObject.id;

  const content = (
    <group
      ref={ref}
      position={cameraObject.position}
      onClick={(event) => {
        event.stopPropagation();
        select(cameraObject.id);
        setActive(cameraObject.id);
      }}
    >
      <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[0.42, 0.3, 0.55]} />
        <meshStandardMaterial color={isActive ? "#ffad42" : "#72818a"} roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.23, 0.35, 20]} />
        <meshStandardMaterial color={isActive ? "#ffad42" : "#72818a"} roughness={0.35} />
      </mesh>
      <Html position={[0, 0.65, 0]} center distanceFactor={11}>
        <span className={`world-label camera ${selected ? "is-selected" : ""}`}>{cameraObject.name}</span>
      </Html>
    </group>
  );

  if (!selected) return content;
  return (
    <TransformControls
      mode="translate"
      onMouseDown={checkpoint}
      onObjectChange={() => {
        if (ref.current) {
          const p = ref.current.position;
          updateCamera(cameraObject.id, { position: [p.x, p.y, p.z] }, false);
        }
      }}
    >
      {content}
    </TransformControls>
  );
}

function ViewController() {
  const viewMode = useDirectorStore((state) => state.viewMode);
  const activeCameraId = useDirectorStore((state) => state.activeCameraId);
  const cameras = useDirectorStore((state) => state.cameras);
  const objects = useDirectorStore((state) => state.objects);
  const directorView = useDirectorStore((state) => state.directorView);
  const viewRevision = useDirectorStore((state) => state.viewRevision);
  const { camera } = useThree();
  const lastMode = useRef(viewMode);
  const lastRevision = useRef(viewRevision);
  const active = cameras.find((item) => item.id === activeCameraId) ?? cameras[0];

  useEffect(() => {
    const modeChanged = lastMode.current !== viewMode;
    const resetRequested = lastRevision.current !== viewRevision;
    if (!modeChanged && !resetRequested) return;
    if (viewMode === "director") {
      camera.position.fromArray(directorView.position);
      camera.lookAt(...directorView.target);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = directorView.fov;
        camera.updateProjectionMatrix();
      }
    }
    lastMode.current = viewMode;
    lastRevision.current = viewRevision;
  }, [camera, directorView, viewMode, viewRevision]);

  useFrame(() => {
    if (viewMode !== "camera" || !active) return;
    camera.position.fromArray(active.position);
    const targetObject = objects.find((object) => object.id === active.targetObjectId);
    if (targetObject) {
      const [x, y, z] = targetObject.transform.position;
      camera.lookAt(x, y + (targetObject.type === "actor" ? 1.1 : 0), z);
    } else {
      camera.lookAt(...active.target);
    }
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== active.fov) {
      camera.fov = active.fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function PanoramaSphere({ url, radius, rotation }: { url: string; radius: number; rotation: number }) {
  const texture = useLoader(THREE.TextureLoader, url);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);
  return (
    <mesh rotation={[0, THREE.MathUtils.degToRad(rotation), 0]}>
      <sphereGeometry args={[radius, 64, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  );
}

function World() {
  const objects = useDirectorStore((state) => state.objects);
  const cameras = useDirectorStore((state) => state.cameras);
  const scene = useDirectorStore((state) => state.scene);
  const viewMode = useDirectorStore((state) => state.viewMode);
  const cleanCapture = useDirectorStore((state) => state.cleanCapture);
  const selectedId = useDirectorStore((state) => state.selectedId);
  const setDirectorView = useDirectorStore((state) => state.setDirectorView);
  const select = useDirectorStore((state) => state.select);
  const threeScene = useThree((state) => state.scene);
  const activeRenderCamera = useThree((state) => state.camera);
  const controlsRef = useRef<any>(null);
  const gridColor = useMemo(() => new THREE.Color("#344048"), []);
  const subGridColor = useMemo(() => new THREE.Color("#1a2227"), []);
  const performanceMode = objects.length > 24;
  const instancedActors = performanceMode
    ? objects.filter((object) => object.type === "actor" && object.visible && object.id !== selectedId)
    : [];
  const individualObjects = performanceMode
    ? objects.filter((object) => object.type !== "actor" || object.id === selectedId)
    : objects;

  useEffect(() => {
    threeScene.background = new THREE.Color(scene.skyColor);
  }, [scene.skyColor, threeScene]);

  return (
    <>
      <ViewController />
      <ambientLight intensity={0.95} />
      {!performanceMode && <directionalLight position={[6, 10, 7]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} />}
      {!performanceMode && <pointLight position={[-8, 5, -4]} intensity={1.2} color="#55ccff" />}
      {scene.panoramaUrl && (
        <PanoramaSphere url={scene.panoramaUrl} radius={scene.panoramaRadius} rotation={scene.panoramaRotation} />
      )}
      <group position={[0, scene.groundHeight, 0]}>
        {scene.groundVisible && (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={!performanceMode}>
              <planeGeometry args={[80, 80]} />
              {performanceMode
                ? <meshBasicMaterial color="#11171a" transparent opacity={scene.groundOpacity} />
                : <meshStandardMaterial color="#11171a" transparent opacity={scene.groundOpacity} roughness={0.9} />}
            </mesh>
            {!cleanCapture && (performanceMode
              ? <gridHelper args={[80, 40, gridColor, subGridColor]} position={[0, 0.006, 0]} />
              : <Grid
                args={[80, 80]}
                cellSize={0.5}
                cellThickness={0.55}
                cellColor={subGridColor}
                sectionSize={2.5}
                sectionThickness={0.85}
                sectionColor={gridColor}
                fadeDistance={32}
                fadeStrength={1.7}
                infiniteGrid
              />)}
          </>
        )}
      </group>
      <group
        position={scene.scenePosition}
        rotation={scene.sceneRotation}
        scale={scene.sceneScale}
      >
        {performanceMode && <InstancedActors objects={instancedActors} />}
        {individualObjects.map((object) => (
          <SceneObjectView key={object.id} object={object} />
        ))}
      </group>
      {viewMode === "director" && !cleanCapture && cameras.map((camera) => <CameraMarker key={camera.id} cameraObject={camera} />)}
      <mesh
        position={[0, -0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMissed={() => select(null)}
        visible={false}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial />
      </mesh>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={viewMode === "director"}
        target={[0, 1, 0]}
        minDistance={2.5}
        maxDistance={32}
        maxPolarAngle={Math.PI / 2 - 0.02}
        onEnd={() => {
          if (viewMode !== "director" || !controlsRef.current) return;
          setDirectorView({
            position: [activeRenderCamera.position.x, activeRenderCamera.position.y, activeRenderCamera.position.z],
            target: [controlsRef.current.target.x, controlsRef.current.target.y, controlsRef.current.target.z],
            fov: activeRenderCamera instanceof THREE.PerspectiveCamera ? activeRenderCamera.fov : 46,
          });
        }}
      />
    </>
  );
}

export default function Stage() {
  const directorView = useDirectorStore((state) => state.directorView);
  const objectCount = useDirectorStore((state) => state.objects.length);
  const highQuality = objectCount <= 24;
  return (
    <Canvas
      className="stage-canvas"
      shadows={highQuality}
      camera={{ position: directorView.position, fov: directorView.fov, near: 0.1, far: 300 }}
      gl={{ antialias: highQuality, preserveDrawingBuffer: true, alpha: false, powerPreference: "high-performance" }}
      dpr={highQuality ? [1, 1.7] : 1}
    >
      <World />
    </Canvas>
  );
}
