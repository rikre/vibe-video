import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const processes = [
  spawn(process.execPath, [path.join(root, "server", "index.mjs")], {
    cwd: root,
    env: { ...process.env, PORT: process.env.API_PORT || "4174" },
    stdio: "inherit",
  }),
  spawn(npmCommand, ["exec", "vite", "--", "--host", "0.0.0.0", "--port", "3000"], {
    cwd: root,
    stdio: "inherit",
  }),
];

let stopping = false;
const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  for (const child of processes) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 250).unref();
};

for (const child of processes) {
  child.on("exit", (code, signal) => {
    if (!stopping && (code !== 0 || signal)) stop(code || 1);
  });
}
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
