"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Download, FileCheck2, FileText, LockKeyhole, RotateCcw, Search, ShieldCheck, Sparkles, Upload, X } from "lucide-react";
import { categoryMeta, detectFindings, Finding, maskedText, MaskCategory } from "./masking";

type AppStep = "upload" | "processing" | "review";
type LoadedDocument = {
  name: string;
  size: number;
  text: string;
  extension: string;
  pages?: number;
  warning?: string;
  sourceBytes?: ArrayBuffer;
  udfXml?: string;
};

const MAX_SIZE = 20 * 1024 * 1024;
const categoryOrder = Object.keys(categoryMeta) as MaskCategory[];

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function readFile(file: File): Promise<LoadedDocument> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (file.size > MAX_SIZE) throw new Error("Dosya 20 MB sınırını aşıyor.");

  if (extension === "txt") {
    return { name: file.name, size: file.size, extension, text: await file.text() };
  }

  if (extension === "docx") {
    const mammoth = await import("mammoth/mammoth.browser");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return { name: file.name, size: file.size, extension, text: result.value, warning: result.messages.length ? "Word belgesindeki bazı biçimler sadeleştirildi." : undefined };
  }

  if (extension === "udf") {
    const JSZip = (await import("jszip")).default;
    const sourceBytes = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(sourceBytes);
    const contentFile = zip.file("content.xml");
    if (!contentFile) throw new Error("UDF içinde content.xml bulunamadı.");
    const udfXml = await contentFile.async("text");
    const contentMatch = udfXml.match(/<content\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/content>/i);
    if (!contentMatch) throw new Error("UDF metin içeriği okunamadı.");
    return { name: file.name, size: file.size, extension, text: contentMatch[1], sourceBytes, udfXml, warning: "Maskeli UDF dışa aktarılırken eski elektronik imza kaldırılır; belgeyi UYAP'ta yeniden imzalamanız gerekir." };
  }

  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    const ocrPages: number[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => {
        if (!("str" in item)) return "";
        const lineEnd = "hasEOL" in item && item.hasEOL ? "\n" : " ";
        return `${item.str}${lineEnd}`;
      }).join("").replace(/[ \t]+\n/g, "\n");
      pages.push(pageText);
      if (pageText.trim().length < 20) ocrPages.push(pageNumber);
    }

    if (ocrPages.length) {
      const { createWorker, OEM } = await import("tesseract.js");
      const ocrWorker = await createWorker("tur", OEM.LSTM_ONLY, {
        workerPath: "/tesseract/worker.min.js",
        langPath: "/tesseract/lang",
        corePath: "/tesseract/core",
      });
      try {
        for (const pageNumber of ocrPages) {
          const page = await document.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.8 });
          const canvas = window.document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) throw new Error("PDF sayfası OCR için hazırlanamadı.");
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          const result = await ocrWorker.recognize(canvas);
          pages[pageNumber - 1] = result.data.text;
        }
      } finally {
        await ocrWorker.terminate();
      }
    }
    const text = pages.join("\n\n");
    return {
      name: file.name,
      size: file.size,
      extension,
      text,
      pages: document.numPages,
      warning: ocrPages.length ? `${ocrPages.length} taranmış sayfa Türkçe OCR ile okundu. OCR sonuçlarını mutlaka kontrol edin.` : undefined,
    };
  }

  throw new Error("Yalnızca UDF, PDF, DOCX veya TXT dosyaları destekleniyor.");
}

function renderDocument(text: string, findings: Finding[], onToggle: (id: string) => void) {
  const ordered = [...findings].sort((a, b) => a.start - b.start);
  const content: React.ReactNode[] = [];
  let cursor = 0;
  ordered.forEach((finding) => {
    content.push(text.slice(cursor, finding.start));
    content.push(
      <button
        type="button"
        key={finding.id}
        className={`redaction ${finding.enabled ? "active" : "inactive"}`}
        onClick={() => onToggle(finding.id)}
        title={`${categoryMeta[finding.category].label}: ${finding.value} — maskeyi aç/kapat`}
      >
        <span>{finding.enabled ? categoryMeta[finding.category].label.toLocaleUpperCase("tr-TR") : finding.value}</span>
      </button>,
    );
    cursor = finding.end;
  });
  content.push(text.slice(cursor));
  return content;
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<AppStep>("upload");
  const [dragging, setDragging] = useState(false);
  const [document, setDocument] = useState<LoadedDocument | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [manualName, setManualName] = useState("");

  const activeCount = findings.filter((item) => item.enabled).length;
  const counts = useMemo(() => categoryOrder.reduce((acc, category) => {
    acc[category] = findings.filter((item) => item.category === category && item.enabled).length;
    return acc;
  }, {} as Record<MaskCategory, number>), [findings]);

  async function handleFile(file?: File) {
    if (!file) return;
    setError("");
    setStep("processing");
    try {
      const loaded = await readFile(file);
      const detected = detectFindings(loaded.text);
      setDocument(loaded);
      setFindings(detected);
      setSelectedId(detected[0]?.id ?? null);
      setStep("review");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Dosya okunamadı.");
      setStep("upload");
    }
  }

  function toggleFinding(id: string) {
    setFindings((items) => items.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item));
    setSelectedId(id);
  }

  function toggleCategory(category: MaskCategory) {
    const hasActive = findings.some((item) => item.category === category && item.enabled);
    setFindings((items) => items.map((item) => item.category === category ? { ...item, enabled: !hasActive } : item));
  }

  function reset() {
    setStep("upload");
    setDocument(null);
    setFindings([]);
    setSelectedId(null);
    setSearch("");
    setManualName("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function downloadTxt() {
    if (!document) return;
    const blob = new Blob([maskedText(document.text, findings)], { type: "text/plain;charset=utf-8" });
    const link = window.document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${document.name.replace(/\.[^.]+$/, "")}-maskeli.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function downloadUdf() {
    if (!document?.sourceBytes || !document.udfXml) return;
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(document.sourceBytes);
    const sameLengthMasked = [...findings]
      .filter((item) => item.enabled)
      .sort((a, b) => b.start - a.start)
      .reduce((output, finding) => `${output.slice(0, finding.start)}${finding.value.replace(/\S/g, "*")}${output.slice(finding.end)}`, document.text);
    const updatedXml = document.udfXml.replace(/(<content\b[^>]*>\s*<!\[CDATA\[)[\s\S]*?(\]\]>\s*<\/content>)/i, `$1${sameLengthMasked}$2`);
    zip.file("content.xml", updatedXml);
    zip.remove("sign.sgn");
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    const link = window.document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${document.name.replace(/\.udf$/i, "")}-maskeli.udf`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function addManualName() {
    if (!document) return;
    const value = manualName.trim();
    if (value.length < 3) return;
    const additions: Finding[] = [];
    let cursor = 0;
    while (cursor < document.text.length) {
      const start = document.text.indexOf(value, cursor);
      if (start < 0) break;
      const end = start + value.length;
      if (!findings.some((item) => start < item.end && end > item.start)) additions.push({ id: `name-manual-${start}-${value}`, category: "name", value, start, end, enabled: true });
      cursor = end;
    }
    if (additions.length) {
      setFindings((items) => [...items, ...additions].sort((a, b) => a.start - b.start));
      setSelectedId(additions[0].id);
      setManualName("");
    } else {
      setError("Bu isim belgede aynı yazımla bulunamadı veya zaten maskeli.");
    }
  }

  function printPdf() {
    window.print();
  }

  if (step === "processing") {
    return (
      <main className="processing-screen">
        <div className="processing-card">
          <div className="scan-document"><span className="scan-line" /><FileText size={56} strokeWidth={1.2} /></div>
          <span className="eyebrow">CİHAZINIZDA İŞLENİYOR</span>
          <h1>Hassas veriler aranıyor…</h1>
          <p>Belgeniz hiçbir sunucuya gönderilmeden inceleniyor.</p>
          <div className="progress"><span /></div>
        </div>
      </main>
    );
  }

  if (step === "review" && document) {
    const filtered = findings.filter((item) => !search || item.value.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR")) || categoryMeta[item.category].label.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR")));
    return (
      <main className="review-shell">
        <header className="topbar review-topbar">
          <a className="brand" href="#" onClick={(event) => { event.preventDefault(); reset(); }}><span className="brand-mark">P</span><span>PERDE</span></a>
          <div className="review-progress"><span className="done"><Check size={12} /> Yükle</span><i /><span className="current">2. İncele</span><i /><span>3. Dışa aktar</span></div>
          <button className="quiet-button" onClick={reset}><RotateCcw size={15} /> Yeni evrak</button>
        </header>

        <section className="review-layout">
          <aside className="left-panel">
            <button className="back-button" onClick={reset}><ArrowLeft size={16} /> Evraklara dön</button>
            <div className="file-summary"><div className="file-badge"><FileText size={20} /></div><span><b>{document.name}</b><small>{formatSize(document.size)}{document.pages ? ` · ${document.pages} sayfa` : ""}</small></span></div>
            <div className="panel-heading"><span>Tespit edilenler</span><b>{activeCount}</b></div>
            <div className="category-list">
              {categoryOrder.map((category) => (
                <button key={category} className={counts[category] ? "has-findings" : ""} onClick={() => toggleCategory(category)}>
                  <span className="category-icon">{categoryMeta[category].short}</span>
                  <span><b>{categoryMeta[category].label}</b><small>{findings.filter((item) => item.category === category).length ? `${findings.filter((item) => item.category === category).length} bulgu` : "Bulgu yok"}</small></span>
                  <span className={`switch ${counts[category] ? "on" : ""}`}><i /></span>
                </button>
              ))}
            </div>
            <div className="privacy-note"><LockKeyhole size={16} /><span><b>Tamamen yerel</b>Bu evrak cihazınızdan çıkmadı.</span></div>
          </aside>

          <section className="document-area">
            <div className="document-toolbar"><span><FileCheck2 size={16} /> Maskeleme önizlemesi</span><span className="legend"><i /> Maskeli veri</span></div>
            {document.warning && <div className="warning-banner"><Sparkles size={16} /> {document.warning}</div>}
            <article className="paper" aria-label="Belge maskeleme önizlemesi">
              <div className="paper-stamp">UYAP ÖNCESİ KOPYA</div>
              <div className="document-text">{renderDocument(document.text, findings, toggleFinding)}</div>
            </article>
          </section>

          <aside className="right-panel">
            <div className="result-summary"><span><ShieldCheck size={21} /></span><div><b>{activeCount} veri maskelenecek</b><small>Bulguya tıklayarak değiştirebilirsiniz.</small></div></div>
            <label className="search-box"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Bulgularda ara" />{search && <button onClick={() => setSearch("")}><X size={13} /></button>}</label>
            <div className="manual-name-box">
              <label htmlFor="manual-name">Kaçan ismi ekle</label>
              <div><input id="manual-name" value={manualName} onChange={(event) => { setManualName(event.target.value); setError(""); }} onKeyDown={(event) => { if (event.key === "Enter") addManualName(); }} placeholder="Örn. Ayşe Yılmaz" /><button onClick={addManualName}>Ekle</button></div>
              {error && <small>{error}</small>}
            </div>
            <div className="findings-list">
              {filtered.length === 0 && <p className="empty-findings">Bu ölçüte uygun bulgu yok.</p>}
              {filtered.map((finding) => (
                <button key={finding.id} className={`${selectedId === finding.id ? "selected" : ""} ${!finding.enabled ? "disabled" : ""}`} onClick={() => toggleFinding(finding.id)}>
                  <span className="finding-type">{categoryMeta[finding.category].short}</span>
                  <span><small>{categoryMeta[finding.category].label}</small><b>{finding.value}</b></span>
                  <Check size={14} />
                </button>
              ))}
            </div>
            <div className="export-box">
              <p><b>UYAP’a hazır kopya</b>Orijinal dosyanız değişmeden kalır.</p>
              {document.extension === "udf" ? (
                <button className="primary-action" onClick={() => void downloadUdf()}><Download size={16} /> Maskeli UDF indir <ChevronRight size={16} /></button>
              ) : (
                <button className="primary-action" onClick={printPdf}><Download size={16} /> PDF olarak kaydet <ChevronRight size={16} /></button>
              )}
              <button className="secondary-action" onClick={downloadTxt}>Maskeli metni indir</button>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Perde ana sayfa"><span className="brand-mark">P</span><span>PERDE</span></a>
        <div className="security-pill"><span /> Evraklarınız cihazınızdan çıkmaz</div>
      </header>
      <section className="workspace">
        <div className="intro">
          <span className="eyebrow">UYAP ÖNCESİ GÜVENLİK KATMANI</span>
          <h1>Paylaşmadan önce<br /><em>görünmez kılın.</em></h1>
          <p>Dilekçe ve eklerinizdeki kişisel verileri otomatik bulur, maskeler ve son kontrolünüze hazırlar.</p>
        </div>
        <div
          className={`drop-card ${dragging ? "dragging" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); void handleFile(event.dataTransfer.files[0]); }}
        >
          <div className="file-icon" aria-hidden="true"><span /><span /><span /></div>
          <h2>Evraklarınızı buraya bırakın</h2>
          <p>veya bilgisayarınızdan dosya seçin</p>
          <button onClick={() => inputRef.current?.click()}><Upload size={16} /> Dosya seç</button>
          <input ref={inputRef} type="file" hidden accept=".udf,.pdf,.docx,.txt" onChange={(event) => void handleFile(event.target.files?.[0])} />
          <div className="formats"><span>UDF</span><span>PDF</span><span>DOCX</span><span>TXT</span><b>•</b> En fazla 20 MB</div>
          {error && <div className="upload-error">{error}</div>}
        </div>
        <div className="trust-row">
          <div><strong>01</strong><span><b>Yerel işlem</b>Dosyanız tarayıcınızda işlenir.</span></div>
          <div><strong>02</strong><span><b>Akıllı tespit</b>7 kişisel veri türünü bulur.</span></div>
          <div><strong>03</strong><span><b>Sizin kontrolünüz</b>Her maskeyi onaylayabilirsiniz.</span></div>
        </div>
      </section>
    </main>
  );
}
