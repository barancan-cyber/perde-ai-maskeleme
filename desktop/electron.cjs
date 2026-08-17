const { app, BrowserWindow, shell } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gz": "application/gzip",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".woff2": "font/woff2",
};

function desktopRoot() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "desktop-dist")
    : path.join(__dirname, "..", "desktop-dist");
}

function resolveWebFile(root, requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://127.0.0.1").pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const candidate = path.resolve(root, relativePath);
  const rootPrefix = `${path.resolve(root)}${path.sep}`;

  if (candidate !== path.resolve(root) && !candidate.startsWith(rootPrefix)) {
    return null;
  }

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  return path.join(root, "index.html");
}

function createLocalServer(root) {
  return http.createServer((request, response) => {
    const filePath = resolveWebFile(root, request.url || "/");
    if (!filePath || !fs.existsSync(filePath)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Dosya bulunamadı.");
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

function createWindow(url) {
  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 700,
    title: "Perde",
    backgroundColor: "#f4f1e9",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (/^https?:\/\//i.test(targetUrl)) shell.openExternal(targetUrl);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, targetUrl) => {
    if (!targetUrl.startsWith(url)) {
      event.preventDefault();
      if (/^https?:\/\//i.test(targetUrl)) shell.openExternal(targetUrl);
    }
  });

  window.loadURL(url);
}

let localServer;

app.whenReady().then(() => {
  localServer = createLocalServer(desktopRoot());
  localServer.listen(0, "127.0.0.1", () => {
    const address = localServer.address();
    if (!address || typeof address === "string") return;
    createWindow(`http://127.0.0.1:${address.port}/`);
  });
});

app.on("window-all-closed", () => {
  localServer?.close();
  app.quit();
});
