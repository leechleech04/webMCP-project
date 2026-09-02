import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CHROME_PATH = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.CHROME_DEBUG_PORT ?? 9222);
const URL = process.env.WEBMCP_VERIFY_URL ?? "http://localhost:5173/";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "docs", "screenshots");

if (!fs.existsSync(CHROME_PATH)) {
  throw new Error(`Chrome executable not found at ${CHROME_PATH}. Set CHROME_PATH to override it.`);
}

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runBrowserVerification() {
  console.log("Starting headless Chrome with remote debugging on port", PORT);

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${PORT}`,
    "--window-size=1440,1080",
    URL,
  ], { stdio: "ignore" });

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {
      await sleep(300);
    }
  }

  if (!wsUrl) {
    chromeProc.kill();
    throw new Error("Could not connect to Chrome CDP");
  }

  console.log("Connected to Chrome CDP:", wsUrl);

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));

  let reqId = 1;
  const pending = new Map();
  const consoleErrors = [];
  const networkFailures = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    } else if (msg.method === "Log.entryAdded") {
      if (msg.params.entry.level === "error") {
        consoleErrors.push(msg.params.entry);
      }
    } else if (msg.method === "Runtime.consoleAPICalled") {
      if (msg.params.type === "error") {
        consoleErrors.push(msg.params);
      }
    } else if (msg.method === "Network.loadingFailed") {
      networkFailures.push(msg.params);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = reqId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Get pages / targets
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
  const pageTarget = targets.find((t) => t.type === "page");
  if (!pageTarget) throw new Error("No page target found");

  const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((r) => (pageWs.onopen = r));

  let pageReqId = 1;
  const pagePending = new Map();

  pageWs.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pagePending.has(msg.id)) {
      const { resolve, reject } = pagePending.get(msg.id);
      pagePending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      consoleErrors.push(msg.params);
    } else if (msg.method === "Network.loadingFailed") {
      networkFailures.push(msg.params);
    }
  };

  function pageSend(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = pageReqId++;
      pagePending.set(id, { resolve, reject });
      pageWs.send(JSON.stringify({ id, method, params }));
    });
  }

  await pageSend("Page.enable");
  await pageSend("Runtime.enable");
  await pageSend("Network.enable");
  await pageSend("DOM.enable");

  console.log("Navigating to", URL);
  await pageSend("Page.navigate", { url: URL });
  await sleep(2500);

  // Helper to evaluate JS in page
  async function evalInPage(expr) {
    const res = await pageSend("Runtime.evaluate", { expression: expr, returnByValue: true });
    return res.result?.value;
  }

  // Helper to capture screenshot at dimensions
  async function captureShot(filename, width = 1440, height = 900) {
    await pageSend("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
    await sleep(600);
    const { data } = await pageSend("Page.captureScreenshot", { format: "png" });
    const fullPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(fullPath, Buffer.from(data, "base64"));
    console.log(`Saved screenshot: ${filename} (${width}x${height})`);
  }

  // 1. Initial State (1440x900)
  await captureShot("after-desktop-1440.png", 1440, 900);

  // 2. Desktop Standard (1280x720)
  await captureShot("after-desktop-1280.png", 1280, 720);

  // 3. Tablet (768x1024)
  await captureShot("after-tablet-768.png", 768, 1024);

  // 4. Mobile (390x844)
  await captureShot("after-mobile-390.png", 390, 844);

  // Reset to 1440 for interactions
  await pageSend("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await sleep(400);

  // Test Auto Fill
  console.log("Executing Auto Fill...");
  const autoFillClicked = await evalInPage(`(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Auto fill build"));
    if (btn) { btn.click(); return true; }
    return false;
  })()`);
  console.log("Auto Fill clicked:", autoFillClicked);
  await sleep(1500);

  // Capture Auto-Filled state
  await captureShot("after-desktop-autofilled.png", 1440, 900);

  // Test Category Tabs: Fans & Air
  console.log("Clicking 'Fans & Air' tab...");
  const fanTabClicked = await evalInPage(`(() => {
    const tab = document.querySelector("#catalog-tab-FAN");
    if (tab) { tab.click(); return true; }
    return false;
  })()`);
  console.log("Fans tab clicked:", fanTabClicked);
  await sleep(800);
  await captureShot("after-catalog-fan-tab.png", 1440, 900);

  // Test Korean language toggle
  console.log("Toggling language to KO...");
  const koClicked = await evalInPage(`(() => {
    const koBtn = Array.from(document.querySelectorAll(".language-switch button")).find(b => b.textContent.trim() === "KO");
    if (koBtn) { koBtn.click(); return true; }
    return false;
  })()`);
  console.log("KO button clicked:", koClicked);
  await sleep(800);
  await captureShot("after-desktop-korean.png", 1440, 900);

  // Test Case Switch in KO: SFF
  console.log("Switching case to SFF...");
  const sffClicked = await evalInPage(`(() => {
    const sffBtn = Array.from(document.querySelectorAll(".case-option")).find(b => b.textContent.includes("SFF"));
    if (sffBtn) { sffBtn.click(); return true; }
    return false;
  })()`);
  console.log("SFF case clicked:", sffClicked);
  await sleep(1000);

  // Capture SFF KO state
  await captureShot("after-case-sff-korean.png", 1440, 900);

  // Switch back to EN
  console.log("Switching back to EN...");
  await evalInPage(`(() => {
    const enBtn = Array.from(document.querySelectorAll(".language-switch button")).find(b => b.textContent.trim() === "EN");
    if (enBtn) enBtn.click();
  })()`);
  await sleep(500);

  // Test Undo / Redo
  console.log("Testing Undo...");
  await evalInPage(`(() => {
    const undoBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Undo");
    if (undoBtn) undoBtn.click();
  })()`);
  await sleep(500);

  console.log("Testing Redo...");
  await evalInPage(`(() => {
    const redoBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Redo");
    if (redoBtn) redoBtn.click();
  })()`);
  await sleep(500);

  console.log("\n=== VERIFICATION METRICS ===");
  console.log("Console Errors Count:", consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log("Console Errors:", JSON.stringify(consoleErrors, null, 2));
  }
  console.log("Network Failures Count:", networkFailures.length);
  if (networkFailures.length > 0) {
    console.log("Network Failures:", JSON.stringify(networkFailures, null, 2));
  }

  // Cleanup
  ws.close();
  pageWs.close();
  chromeProc.kill();
  console.log("Browser verification finished successfully!");
}

runBrowserVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
