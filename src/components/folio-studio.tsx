import { useEffect, useId, useRef, useState } from "react";
import {
  Camera,
  Check,
  Copy,
  Download,
  ImagePlus,
  LoaderCircle,
  RotateCcw,
  ScanText,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react";
import { CONVERT_MODES, convertText, textStats, type ConvertMode } from "@/lib/convert-text";
import { fileToJpeg, makeThumb } from "@/lib/prepare-image";
import { readOnDevice } from "@/lib/read-on-device";
import { convertWithGrok, readPhotoText } from "@/lib/read.functions";
import { READ_LANGS, hasArabicScript, type ReadLang } from "@/lib/read-lang";
import { ARABIC_SAMPLE_TEXT, SAMPLE_TEXT, renderArabicSample, renderSamplePhoto } from "@/lib/sample-note";

const HISTORY_KEY = "folio.scans.v1";
const LANG_KEY = "folio.read-lang";

const AI_PRESETS = [
  {
    id: "fix",
    label: "Fix mistakes",
    instruction:
      "Correct typos, misread letters, and broken words. Keep the original language, meaning, and line breaks. Do not add new facts.",
  },
  {
    id: "es",
    label: "Spanish",
    instruction: "Translate into natural Spanish. Keep names unchanged.",
  },
  {
    id: "fr",
    label: "French",
    instruction: "Translate into natural French. Keep names unchanged.",
  },
  {
    id: "ar",
    label: "Arabic",
    instruction: "Translate into Modern Standard Arabic. Keep names unchanged.",
  },
  {
    id: "zh",
    label: "Chinese",
    instruction: "Translate into Simplified Chinese. Keep names unchanged.",
  },
  {
    id: "sum",
    label: "Summarize",
    instruction: "Summarize in a few short sentences. Stay in the original language.",
  },
  {
    id: "formal",
    label: "Formal",
    instruction: "Rewrite in a clear formal tone. Keep the original language and the facts.",
  },
  {
    id: "casual",
    label: "Casual",
    instruction: "Rewrite in a warm casual tone. Keep the original language and the facts.",
  },
] as const;

type Reader = "Grok" | "On this device" | "Sample";

type Scan = {
  id: string;
  at: number;
  text: string;
  thumb: string;
  image: string;
  reader: Reader;
};

function errorText(err: unknown): string {
  if (err instanceof Error && err.message) return err.message.replace(/^Error:\s*/, "");
  return "Something went wrong. Try that again.";
}

function loadHistory(): Scan[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Scan[];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveHistory(scans: Scan[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(scans.slice(0, 8)));
  } catch {
    /* private mode or a full disk — the reading still stays on screen */
  }
}

export function FolioStudio() {
  const uploadId = useId();
  const cameraId = useId();
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState("");
  const [original, setOriginal] = useState("");
  const [reading, setReading] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<ConvertMode | "edited">("as-read");
  const [reader, setReader] = useState<Reader | "">("");
  const [busy, setBusy] = useState<"read" | "device" | "convert" | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [customAsk, setCustomAsk] = useState("");
  const [history, setHistory] = useState<Scan[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [readLang, setReadLang] = useState<ReadLang>("auto");

  useEffect(() => {
    setHistory(loadHistory());
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "auto" || saved === "eng" || saved === "ara") setReadLang(saved);
  }, []);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const file = [...(event.clipboardData?.files ?? [])].find((item) =>
        item.type.startsWith("image/"),
      );
      if (!file) return;
      event.preventDefault();
      void acceptFile(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  async function acceptFile(file: File) {
    setError("");
    setNotice("");
    try {
      const next = await fileToJpeg(file);
      setImage(next);
      setStatus("Photo ready. Read it when you want the words.");
    } catch (err) {
      setError(errorText(err));
    }
  }

  function commitReading(text: string, via: Reader, photo = image) {
    const cleaned = convertText(text, "as-read");
    setOriginal(cleaned);
    setReading(cleaned);
    setOutput(cleaned);
    setMode("as-read");
    setReader(via);
    setError("");
    setNotice("");
    void remember(cleaned, via, photo);
  }

  async function remember(text: string, via: Reader, photo: string) {
    if (!photo || !text) return;
    let thumb = photo;
    try {
      thumb = await makeThumb(photo);
    } catch {
      thumb = photo;
    }
    const scan: Scan = {
      id: `${Date.now()}`,
      at: Date.now(),
      text,
      thumb,
      image: thumb,
      reader: via,
    };
    setHistory((current) => {
      const next = [scan, ...current.filter((item) => item.text !== text)].slice(0, 8);
      saveHistory(next);
      return next;
    });
  }

  function chooseLang(next: ReadLang) {
    setReadLang(next);
    localStorage.setItem(LANG_KEY, next);
  }

  function loadSample() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    const photo = renderSamplePhoto();
    setImage(photo);
    commitReading(SAMPLE_TEXT, "Sample", photo);
    setStatus("");
  }

  async function loadArabicSample() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    chooseLang("ara");
    setError("");
    setNotice("");
    setStatus("Preparing an Arabic sample…");
    const photo = await renderArabicSample();
    setImage(photo);
    commitReading(ARABIC_SAMPLE_TEXT, "Sample", photo);
    setStatus("");
  }

  function restore(scan: Scan) {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setImage(scan.image);
    setOriginal(scan.text);
    setReading(scan.text);
    setOutput(scan.text);
    setMode("as-read");
    setReader(scan.reader);
    setError("");
    setNotice("");
    setStatus("");
  }

  async function readCurrent(prefer: "auto" | "device") {
    if (!image || busy) return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setBusy(prefer === "device" ? "device" : "read");
    setError("");
    setNotice("");
    setStatus(prefer === "device" ? "Reading on this device…" : "Reading the photo…");
    try {
      if (prefer !== "device") {
        const result = await readPhotoText({ data: { image, lang: readLang } });
        if (result.ok) {
          const text = result.text === "(no text)" ? "" : result.text;
          if (!text.trim()) {
            setError("No words showed up in that photo.");
            setStatus("");
            return;
          }
          commitReading(text, "Grok");
          setStatus("");
          return;
        }
        setStatus("Grok couldn't take this one. Reading on this device…");
      }
      const text = (await readOnDevice(image, readLang, setStatus)).trim();
      if (!text) {
        setError("No words showed up in that photo.");
        setStatus("");
        return;
      }
      commitReading(text, "On this device");
      setStatus("");
    } catch (err) {
      setError(errorText(err));
      setStatus("");
    } finally {
      setBusy(null);
    }
  }

  function applyMode(next: ConvertMode) {
    if (!reading) return;
    setMode(next);
    setOutput(convertText(reading, next));
    setNotice("");
  }

  function resetReading() {
    if (!original) return;
    setReading(original);
    setOutput(original);
    setMode("as-read");
    setNotice("");
  }

  async function runConvert(instruction: string) {
    const source = output.trim();
    if (!source || busy) return;
    const clipped = source.length > 8000;
    setBusy("convert");
    setError("");
    setNotice("");
    setStatus("Converting…");
    try {
      const result = await convertWithGrok({
        data: { text: source.slice(0, 8000), instruction },
      });
      if (!result.ok) {
        setError(result.error);
        setStatus("");
        return;
      }
      if (!result.text.trim()) {
        setError("That conversion came back empty.");
        setStatus("");
        return;
      }
      const next = result.text.trim();
      setReading(next);
      setOutput(next);
      setMode("as-read");
      setNotice(clipped ? "Converted the first part of a long reading." : "");
      setStatus("");
    } catch (err) {
      setError(errorText(err));
      setStatus("");
    } finally {
      setBusy(null);
    }
  }

  async function copyOutput() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      const area = document.createElement("textarea");
      area.value = output;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadOutput() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "folio-reading.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function toggleSpeak() {
    if (!output || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(output);
    utter.lang = hasArabicScript(output) ? "ar" : "en";
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  const stats = textStats(output);
  const hasText = output.trim().length > 0;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-6 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-medium tracking-widest text-copper uppercase">
              Photo to type
            </p>
            <h1 className="font-display text-4xl leading-none text-ink sm:text-5xl">Folio</h1>
          </div>
          <p className="hidden max-w-xs text-right text-sm leading-relaxed text-pretty text-muted sm:block">
            Read the words in a photo, then change how they read.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-2 lg:gap-6 lg:py-8">
        <section className="flex flex-col gap-4 rounded-3xl border border-line bg-sheet p-4 sm:p-5">
          {image ? (
            <div className="overflow-hidden rounded-2xl border border-line bg-paper">
              <img
                src={image}
                alt="Photo waiting to be read"
                className="max-h-112 w-full object-contain"
              />
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => uploadRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  uploadRef.current?.click();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                const file = event.dataTransfer.files[0];
                if (file) void acceptFile(file);
              }}
              className={`flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 text-center transition-colors ${
                dragOver ? "border-copper bg-paper" : "border-line bg-paper"
              }`}
            >
              <ImagePlus className="size-8 text-copper" aria-hidden="true" />
              <div>
                <p className="font-display text-2xl text-ink">Drop a photo here</p>
                <p className="mt-1 max-w-xs text-sm leading-relaxed text-pretty text-muted">
                  A menu, a sign, a note, a page. Paste one with the keyboard, too.
                </p>
              </div>
            </div>
          )}

          <input
            ref={uploadRef}
            id={uploadId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void acceptFile(file);
            }}
          />
          <input
            ref={cameraRef}
            id={cameraId}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void acceptFile(file);
            }}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-sheet px-4 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              <Upload className="size-4" aria-hidden="true" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-sheet px-4 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              <Camera className="size-4" aria-hidden="true" />
              Camera
            </button>
            <button
              type="button"
              onClick={loadSample}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-sheet px-4 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              Try a sample
            </button>
            <button
              type="button"
              onClick={() => void loadArabicSample()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-sheet px-4 font-arabic text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              عينة عربية
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">Read as</span>
            {READ_LANGS.map((item) => {
              const active = readLang === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseLang(item.id)}
                  className={`min-h-11 rounded-full border px-3 text-sm font-medium transition-colors ${
                    item.id === "ara" ? "font-arabic" : ""
                  } ${
                    active
                      ? "border-ink bg-ink text-sheet"
                      : "border-line bg-sheet text-ink hover:border-ink"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!image || busy !== null}
            onClick={() => void readCurrent("auto")}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-copper px-5 text-sm font-medium text-copper-ink transition-colors hover:bg-ink disabled:opacity-50"
          >
            {busy === "read" ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ScanText className="size-4" aria-hidden="true" />
            )}
            {busy === "read" ? "Reading…" : "Read the text"}
          </button>
          {image ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void readCurrent("device")}
              className="self-start text-sm text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-50"
            >
              {busy === "device" ? "Reading on this device…" : "Read on this device instead"}
            </button>
          ) : null}
          <p className="text-xs leading-relaxed text-muted">
            Photos stay in the browser unless you ask to read or convert them. Choose العربية
            to read Arabic, on the server or on this device.
          </p>
        </section>

        <section className="flex min-w-0 flex-col gap-4 rounded-3xl border border-line bg-sheet p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-ink">The reading</h2>
              {reader ? <p className="text-xs text-muted">From {reader}</p> : null}
            </div>
            {original ? (
              <button
                type="button"
                onClick={resetReading}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Reset
              </button>
            ) : null}
          </div>

          {hasText ? (
            <div className="folio-rise flex min-w-0 flex-col gap-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {CONVERT_MODES.map((item) => {
                  const active = mode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => applyMode(item.id)}
                      className={`shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "border-ink bg-ink text-sheet"
                          : "border-line bg-sheet text-ink hover:border-ink"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <label className="sr-only" htmlFor="folio-output">
                Converted text
              </label>
              <textarea
                id="folio-output"
                value={output}
                dir="auto"
                lang={hasArabicScript(output) ? "ar" : undefined}
                onChange={(event) => {
                  setOutput(event.target.value);
                  setMode("edited");
                }}
                rows={12}
                spellCheck
                className="folio-reading min-h-64 w-full resize-y rounded-2xl border border-line bg-paper px-4 py-3 text-lg leading-relaxed text-ink"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyOutput()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-sheet transition-colors hover:bg-copper"
                >
                  {copied ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={downloadOutput}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-ink transition-colors hover:border-ink"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={toggleSpeak}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-ink transition-colors hover:border-ink"
                >
                  {speaking ? (
                    <VolumeX className="size-4" aria-hidden="true" />
                  ) : (
                    <Volume2 className="size-4" aria-hidden="true" />
                  )}
                  {speaking ? "Stop" : "Listen"}
                </button>
                <p className="ml-auto text-xs text-muted tabular-nums">
                  {stats.words} words · {stats.chars} characters · {stats.lines} lines
                </p>
              </div>

              <div className="border-t border-line pt-4">
                <p className="text-sm font-medium text-ink">Convert further</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Fix a bad reading, change the language, or reshape the tone.
                </p>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {AI_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void runConvert(preset.instruction)}
                      className="shrink-0 rounded-full border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-copper hover:text-copper disabled:opacity-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <form
                  className="mt-3 flex flex-col gap-2 sm:flex-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (customAsk.trim()) void runConvert(customAsk.trim());
                  }}
                >
                  <label className="sr-only" htmlFor="folio-ask">
                    How to convert the text
                  </label>
                  <input
                    id="folio-ask"
                    value={customAsk}
                    onChange={(event) => setCustomAsk(event.target.value)}
                    placeholder="Turn this into a short text message"
                    className="min-h-11 w-full rounded-full border border-line bg-paper px-4 text-sm text-ink placeholder:text-muted"
                  />
                  <button
                    type="submit"
                    disabled={busy !== null || !customAsk.trim()}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-copper px-4 text-sm font-medium text-copper-ink transition-colors hover:bg-ink disabled:opacity-50"
                  >
                    {busy === "convert" ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    Convert
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-center rounded-2xl bg-paper px-5 py-8">
              <p className="font-display text-2xl text-ink">Nothing read yet</p>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                <li>
                  <span className="font-display text-copper">1 </span>
                  Add a photo, or paste one.
                </li>
                <li>
                  <span className="font-display text-copper">2 </span>
                  Read the text.
                </li>
                <li>
                  <span className="font-display text-copper">3 </span>
                  Convert it — case, lines, language, tone.
                </li>
              </ol>
            </div>
          )}

          <div aria-live="polite" className="min-h-5 text-sm">
            {error ? <p className="text-danger">{error}</p> : null}
            {!error && status ? <p className="text-muted">{status}</p> : null}
            {!error && !status && notice ? <p className="text-muted">{notice}</p> : null}
          </div>
        </section>
      </main>

      {history.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <h2 className="text-sm font-medium text-ink">Kept on this device</h2>
          <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {history.map((scan) => (
              <li key={scan.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => restore(scan)}
                  className="flex w-40 flex-col overflow-hidden rounded-2xl border border-line bg-sheet text-left transition-colors hover:border-ink"
                >
                  <img src={scan.thumb} alt="" className="h-24 w-full object-cover" />
                  <span className="line-clamp-2 px-3 py-2 text-xs leading-snug text-ink">
                    {scan.text}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted sm:px-6">
          Recent readings stay on this device.
        </p>
      )}
    </div>
  );
}
