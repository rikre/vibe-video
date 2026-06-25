export type Vec3 = [number, number, number];

export type Transform = {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
};

export type ActorPreset =
  | "男性身体"
  | "女性身体"
  | "宽厚身体"
  | "健壮身体"
  | "纤细身体"
  | "少年身体"
  | "儿童身体";

export type PrimitivePreset = "立方体" | "球体" | "圆柱体" | "本地模型";

export type SceneObject = {
  id: string;
  type: "actor" | "primitive" | "uploaded-model";
  name: string;
  preset: ActorPreset | PrimitivePreset;
  transform: Transform;
  color: string;
  visible: boolean;
  pose?: "站立" | "招手" | "奔跑" | "坐姿";
  groupId?: string;
  modelDataUrl?: string;
};

export type CameraObject = {
  id: string;
  name: string;
  position: Vec3;
  target: Vec3;
  targetObjectId?: string;
  fov: number;
};

export type DirectorView = {
  position: Vec3;
  target: Vec3;
  fov: number;
};

export type SceneSettings = {
  skyColor: string;
  panoramaUrl?: string;
  panoramaRotation: number;
  panoramaRadius: number;
  groundVisible: boolean;
  groundOpacity: number;
  groundHeight: number;
  showLabels: boolean;
  snapEnabled: boolean;
  sceneScale: number;
  scenePosition: Vec3;
  sceneRotation: Vec3;
};

export type Capture = {
  id: string;
  cameraId: string;
  ratio: string;
  imageUrl: string;
  createdAt: string;
  selected: boolean;
  sent: boolean;
};

export type ViewMode = "director" | "camera";
export type TransformMode = "translate" | "rotate" | "scale";

export type SceneSnapshot = {
  objects: SceneObject[];
  cameras: CameraObject[];
  scene: SceneSettings;
  activeCameraId: string;
};
