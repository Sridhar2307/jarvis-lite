const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

console.log("========================================================");
console.log("  ⚡ JARVIS LITE + NEXORA UNIFIED DEV ORCHESTRATOR ⚡");
console.log("========================================================");

let nextProcess = null;
let nexoraProcess = null;

function cleanup() {
  console.log("\n🛑 Gracefully shutting down all processes...");
  if (nexoraProcess) {
    try {
      nexoraProcess.kill("SIGTERM");
    } catch {}
  }
  if (nextProcess) {
    try {
      nextProcess.kill("SIGTERM");
    } catch {}
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Step 1: Start Next.js Development Server
console.log("[ORCHESTRATOR] 🚀 Starting Next.js 14 App Router on port 3000...");
const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

nextProcess = spawn(npmCmd, ["run", "dev"], {
  cwd: path.resolve(__dirname, ".."),
  stdio: ["inherit", "pipe", "pipe"],
});

nextProcess.stdout.on("data", (data) => {
  const lines = data.toString().trim().split("\n");
  lines.forEach((l) => console.log(`[NEXT.JS] ${l}`));
});

nextProcess.stderr.on("data", (data) => {
  const lines = data.toString().trim().split("\n");
  lines.forEach((l) => console.error(`[NEXT.JS:ERR] ${l}`));
});

// Step 2: Poll for Next.js server readiness
function checkServerReady(attempts = 0) {
  if (attempts > 30) {
    console.error("[ORCHESTRATOR] ❌ Next.js server took too long to respond.");
    return;
  }

  const req = http.get("http://localhost:3000", (res) => {
    console.log(`[ORCHESTRATOR] ✅ Central Next.js Backend ready (HTTP ${res.statusCode}).`);
    startNexoraDaemon();
  });

  req.on("error", () => {
    setTimeout(() => checkServerReady(attempts + 1), 1000);
  });
}

// Step 3: Start Nexora Headless Daemon
function startNexoraDaemon() {
  console.log("[ORCHESTRATOR] 🤖 Starting Python Nexora Desktop Assistant in headless daemon mode...");
  const pythonCmd = isWindows ? "python" : "python3";

  nexoraProcess = spawn(pythonCmd, ["main.py", "--headless"], {
    cwd: path.resolve(__dirname, "..", "nexora"),
    stdio: ["inherit", "pipe", "pipe"],
  });

  nexoraProcess.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((l) => console.log(`[NEXORA] ${l}`));
  });

  nexoraProcess.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((l) => console.error(`[NEXORA:ERR] ${l}`));
  });

  nexoraProcess.on("close", (code) => {
    console.log(`[ORCHESTRATOR] Nexora process exited with code ${code}`);
  });
}

// Start health probe after 2 seconds
setTimeout(() => checkServerReady(), 2000);
