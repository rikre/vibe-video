import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  dataRoot,
  deleteBinary,
  readBinary,
  readProject,
  saveBinary,
  saveCanvasNode,
  saveProject,
} from "./storage.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "..", "dist");
const PORT = Number(process.env.PORT || 4174);
const HOST = process.env.HOST || "127.0.0.1";
const BODY_LIMIT = 16 * 1024 * 1024;

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,if-match",
};

function send(response, status, payload, headers = {}) {
  if (status === 204) {
    response.writeHead(status, { ...corsHeaders, ...headers });
    response.end();
    return;
  }
  const isBuffer = Buffer.isBuffer(payload);
  const body = isBuffer ? payload : Buffer.from(JSON.stringify(payload));
  response.writeHead(status, {
    ...corsHeaders,
    "content-type": isBuffer ? "application/octet-stream" : "application/json; charset=utf-8",
    "content-length": body.length,
    "cache-control": "no-store",
    ...headers,
  });
  response.end(body);
}

async function jsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > BODY_LIMIT) {
      const error = new Error("请求内容超过 16MB");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("JSON 格式无效");
    error.statusCode = 400;
    throw error;
  }
}

async function api(request, response, url) {
  if (request.method === "OPTIONS") return send(response, 204, {});

  let match = /^\/api\/director-projects\/([^/]+)$/.exec(url.pathname);
  if (match && request.method === "GET") {
    const project = await readProject(decodeURIComponent(match[1]));
    return project ? send(response, 200, project, { etag: `\"${project.revision}\"` }) : send(response, 204, null);
  }
  if (match && request.method === "PUT") {
    const body = await jsonBody(request);
    const headerRevision = request.headers["if-match"]?.replaceAll('"', "");
    const expectedRevision = headerRevision !== undefined ? Number(headerRevision) : body.revision;
    const project = await saveProject(decodeURIComponent(match[1]), body.state, Number.isFinite(expectedRevision) ? expectedRevision : undefined);
    return send(response, 200, project, { etag: `\"${project.revision}\"` });
  }

  match = /^\/api\/director-projects\/([^/]+)\/(assets|captures)$/.exec(url.pathname);
  if (match && request.method === "POST") {
    const body = await jsonBody(request);
    const resourceId = body.id || randomUUID();
    const result = await saveBinary({
      projectId: decodeURIComponent(match[1]),
      resourceId,
      dataUrl: body.dataUrl,
      kind: match[2] === "captures" ? "capture" : "asset",
      fileName: body.fileName,
    });
    return send(response, 201, result);
  }

  match = /^\/api\/director-projects\/([^/]+)\/captures\/([^/]+)$/.exec(url.pathname);
  if (match && request.method === "DELETE") {
    await deleteBinary(decodeURIComponent(match[1]), "capture", decodeURIComponent(match[2]));
    return send(response, 200, { deleted: true });
  }

  match = /^\/api\/canvases\/([^/]+)\/nodes\/from-capture$/.exec(url.pathname);
  if (match && request.method === "POST") {
    const node = await saveCanvasNode(decodeURIComponent(match[1]), await jsonBody(request));
    return send(response, 201, node);
  }

  match = /^\/api\/files\/([^/]+)\/(asset|capture)\/([^/]+)$/.exec(url.pathname);
  if (match && request.method === "GET") {
    const result = await readBinary(decodeURIComponent(match[1]), match[2], decodeURIComponent(match[3]));
    return result
      ? send(response, 200, result.buffer, { "content-type": result.mimeType, "cache-control": "public, max-age=31536000, immutable" })
      : send(response, 404, { error: "FILE_NOT_FOUND" });
  }

  return send(response, 404, { error: "API_NOT_FOUND" });
}

const staticTypes = new Map([
  [".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"], [".svg", "image/svg+xml"], [".png", "image/png"],
  [".jpg", "image/jpeg"], [".webp", "image/webp"], [".json", "application/json; charset=utf-8"],
]);

async function serveStatic(response, url) {
  let relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (!relative) relative = "index.html";
  let filePath = path.resolve(DIST, relative);
  if (!filePath.startsWith(`${DIST}${path.sep}`) && filePath !== path.join(DIST, "index.html")) return send(response, 403, { error: "FORBIDDEN" });
  try {
    if (!(await stat(filePath)).isFile()) throw Object.assign(new Error(), { code: "ENOENT" });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    filePath = path.join(DIST, "index.html");
  }
  const body = await readFile(filePath);
  response.writeHead(200, {
    "content-type": staticTypes.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream",
    "content-length": body.length,
  });
  response.end(body);
}

async function serveStaticHead(response, url) {
  let relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (!relative) relative = "index.html";
  let filePath = path.resolve(DIST, relative);
  if (!filePath.startsWith(`${DIST}${path.sep}`) && filePath !== path.join(DIST, "index.html")) return send(response, 403, { error: "FORBIDDEN" });
  let targetStats;
  try {
    targetStats = await stat(filePath);
    if (!targetStats.isFile()) throw Object.assign(new Error(), { code: "ENOENT" });
    response.writeHead(200, {
      "content-type": staticTypes.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream",
      "content-length": targetStats.size,
    });
    response.end();
    return;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const fallbackPath = path.join(DIST, "index.html");
  try {
    targetStats = await stat(fallbackPath);
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "content-length": targetStats.size,
    });
    response.end();
  } catch {
    send(response, 404, { error: "NOT_FOUND" });
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || `${HOST}:${PORT}`}`);
  try {
    if (url.pathname.startsWith("/api/")) await api(request, response, url);
    else if (request.method === "HEAD") await serveStaticHead(response, url);
    else if (request.method === "GET") await serveStatic(response, url);
    else send(response, 405, { error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    const status = Number(error?.statusCode) || 500;
    send(response, status, {
      error: status === 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED",
      message: error instanceof Error ? error.message : "未知错误",
      ...(error?.details ? { details: error.details } : {}),
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[director-server] http://${HOST}:${PORT} · data ${dataRoot}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
