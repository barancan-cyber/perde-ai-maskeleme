import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Perde upload screen", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Perde — AI Öncesi Kişisel Veri Maskeleme/);
  assert.match(html, /Paylaşmadan önce/);
  assert.match(html, /Evraklarınızı buraya bırakın/);
  assert.match(html, /Evraklarınız cihazınızdan çıkmaz/);
  assert.match(html, /accept="\.udf,\.pdf,\.docx,\.txt"/);
  assert.doesNotMatch(html, /Continue with ChatGPT|UYAP ÖNCESİ KOPYA/);
});

test("keeps local launchers and Word/PDF exports available", async () => {
  const [page, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    access(new URL("../Perdeyi-Baslat.command", import.meta.url)),
    access(new URL("../Perdeyi-Baslat.bat", import.meta.url)),
  ]);

  assert.match(page, /async function downloadDocx\(\)/);
  assert.match(page, /async function downloadPdf\(\)/);
  assert.match(page, /Maskeli Word indir/);
  assert.match(page, /Maskeli PDF indir/);
  assert.match(page, /ai-icin-maskeli-kopya\.docx/);
  assert.match(page, /ai-icin-maskeli-kopya\.pdf/);
  assert.match(packageJson, /"docx"/);
  assert.match(packageJson, /"pdfmake"/);
});

test("ships Node-free Windows and macOS desktop packaging", async () => {
  const [desktopMain, electronMain, packageJson, workflow] = await Promise.all([
    readFile(new URL("../desktop/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../desktop/electron.cjs", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/desktop-packages.yml", import.meta.url), "utf8"),
  ]);

  assert.match(desktopMain, /import Perde from "\.\.\/app\/page"/);
  assert.match(electronMain, /nodeIntegration: false/);
  assert.match(electronMain, /contextIsolation: true/);
  assert.match(electronMain, /listen\(0, "127\.0\.0\.1"/);
  assert.match(packageJson, /desktop:package:win/);
  assert.match(packageJson, /desktop:package:mac/);
  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /macos-latest/);
});
