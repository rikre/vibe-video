import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.env.DIRECTOR_DATA_DIR || path.join(process.cwd(), ".data"));
const PROJECTS_DIR = path.join(ROOT, "projects");
const ASSETS_DIR = path.join(ROOT, "assets");

const safeId = (value, label = "id") => {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) {
    const error = new Error(`${label} 格式无效`);
    error.statusCode = 400;
    throw error;
  }
  return value;
};

const projectPath = (projectId) => path.join(PROJECTS_DIR, `${safeId(projectId, "projectId")}.json`);

const atomicJson = async (filePath, value) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, filePath);
};

export async function readProject(projectId) {
  try {
    return JSON.parse(await readFile(projectPath(projectId), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function saveProject(projectId, state, expectedRevision) {
  safeId(projectId, "projectId");
  const current = await readProject(projectId);
  const actualRevision = current?.revision ?? 0;
  if (expectedRevision !== undefined && expectedRevision !== actualRevision) {
    const error = new Error("项目已被其他客户端更新");
    error.statusCode = 409;
    error.details = { expectedRevision, actualRevision };
    throw error;
  }
  const now = new Date().toISOString();
  const project = {
    id: projectId,
    schemaVersion: 1,
    revision: actualRevision + 1,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
    state,
  };
  await atomicJson(projectPath(projectId), project);
  return project;
}

const mimeExtensions = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["model/gltf-binary", ".glb"],
  ["model/gltf+json", ".gltf"],
  ["application/octet-stream", ".bin"],
]);

export function decodeDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") {
    const error = new Error("缺少 dataUrl");
    error.statusCode = 400;
    throw error;
  }
  const match = /^data:([^;,]+);base64,([a-zA-Z0-9+/=\r\n]+)$/.exec(dataUrl);
  if (!match) {
    const error = new Error("只支持 base64 data URL");
    error.statusCode = 400;
    throw error;
  }
  return { mimeType: match[1].toLowerCase(), buffer: Buffer.from(match[2], "base64") };
}

export async function saveBinary({ projectId, resourceId, dataUrl, kind = "asset", fileName = "" }) {
  safeId(projectId, "projectId");
  safeId(resourceId, "resourceId");
  if (!new Set(["asset", "capture"]).has(kind)) {
    const error = new Error("kind 格式无效");
    error.statusCode = 400;
    throw error;
  }
  const { mimeType, buffer } = decodeDataUrl(dataUrl);
  const sizeLimit = kind === "capture" ? 12 * 1024 * 1024 : 8 * 1024 * 1024;
  if (!buffer.length || buffer.length > sizeLimit) {
    const error = new Error(`文件大小必须在 1B–${Math.round(sizeLimit / 1024 / 1024)}MB 之间`);
    error.statusCode = 413;
    throw error;
  }
  const suppliedExtension = path.extname(path.basename(fileName)).toLowerCase();
  const extension = suppliedExtension && suppliedExtension.length <= 8
    ? suppliedExtension
    : (mimeExtensions.get(mimeType) ?? ".bin");
  const folder = path.join(ASSETS_DIR, projectId, kind);
  await mkdir(folder, { recursive: true });
  const file = `${resourceId}${extension}`;
  const outputPath = path.join(folder, file);
  await writeFile(outputPath, buffer);
  return {
    id: resourceId,
    kind,
    fileName: path.basename(fileName || file),
    mimeType,
    size: buffer.length,
    sha256: createHash("sha256").update(buffer).digest("hex"),
    url: `/api/files/${projectId}/${kind}/${file}`,
  };
}

export async function readBinary(projectId, kind, file) {
  safeId(projectId, "projectId");
  if (!new Set(["asset", "capture"]).has(kind)) return null;
  if (typeof file !== "string" || path.basename(file) !== file || !/^[a-zA-Z0-9_.-]{1,180}$/.test(file)) return null;
  try {
    const buffer = await readFile(path.join(ASSETS_DIR, projectId, kind, file));
    const extension = path.extname(file).toLowerCase();
    const mimeType = [...mimeExtensions.entries()].find(([, ext]) => ext === extension)?.[0] ?? "application/octet-stream";
    return { buffer, mimeType };
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function deleteBinary(projectId, kind, resourceId) {
  safeId(projectId, "projectId");
  safeId(resourceId, "resourceId");
  const folder = path.join(ASSETS_DIR, projectId, kind);
  try {
    const candidates = [".jpg", ".png", ".webp", ".glb", ".gltf", ".bin"];
    await Promise.all(candidates.map((extension) => rm(path.join(folder, `${resourceId}${extension}`), { force: true })));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export async function saveCanvasNode(canvasId, payload) {
  safeId(canvasId, "canvasId");
  const nodeId = safeId(payload?.id || randomUUID(), "nodeId");
  const filePath = path.join(ROOT, "canvases", canvasId, `${nodeId}.json`);
  const node = { ...payload, id: nodeId, canvasId, createdAt: payload?.createdAt ?? new Date().toISOString() };
  await atomicJson(filePath, node);
  return node;
}

export { ROOT as dataRoot };
