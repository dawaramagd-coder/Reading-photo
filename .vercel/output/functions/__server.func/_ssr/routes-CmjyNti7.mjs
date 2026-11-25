import { o as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { i as tesseractLang, n as hasArabicScript, r as isReadLang, t as READ_LANGS } from "./read-lang-C1PuvUBi.mjs";
import { a as ScanText, c as ImagePlus, d as Check, f as Camera, l as Download, n as Volume2, o as RotateCcw, r as Upload, s as LoaderCircle, t as VolumeX, u as Copy } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CmjyNti7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CONVERT_MODES = [
	{
		id: "as-read",
		label: "As read"
	},
	{
		id: "paragraphs",
		label: "Paragraphs"
	},
	{
		id: "one-line",
		label: "One line"
	},
	{
		id: "upper",
		label: "UPPER"
	},
	{
		id: "lower",
		label: "lower"
	},
	{
		id: "title",
		label: "Title Case"
	},
	{
		id: "sentence",
		label: "Sentence"
	},
	{
		id: "bullets",
		label: "Bullets"
	}
];
function convertText(source, mode) {
	const text = source.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
	switch (mode) {
		case "as-read": return text.split("\n").map((line) => line.replace(/[ \t]+/g, " ").trimEnd()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
		case "paragraphs": return toParagraphs(text);
		case "one-line": return text.replace(/\s+/g, " ").trim();
		case "upper": return text.trim().toLocaleUpperCase();
		case "lower": return text.trim().toLocaleLowerCase();
		case "title": return toTitle(text.trim());
		case "sentence": return toSentence(text.trim());
		case "bullets": return text.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => /^([•\-*]|\d+[.)])\s/.test(line) ? line : `• ${line}`).join("\n");
	}
}
function toParagraphs(text) {
	const paragraphs = [];
	let buffer = "";
	for (const raw of text.split("\n")) {
		const line = raw.trim();
		if (!line) {
			if (buffer) {
				paragraphs.push(buffer.trim());
				buffer = "";
			}
			continue;
		}
		if (!buffer) buffer = line;
		else if (/[-–—]$/.test(buffer)) buffer = `${buffer.slice(0, -1)}${line}`;
		else buffer = `${buffer} ${line}`;
	}
	if (buffer) paragraphs.push(buffer.trim());
	return paragraphs.join("\n\n");
}
function toTitle(text) {
	return text.replace(/\S+/g, (word) => {
		const lower = word.toLocaleLowerCase();
		return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
	});
}
function toSentence(text) {
	return text.toLocaleLowerCase().replace(/(^|[.!?]\s+|\n+)(\p{L})/gu, (_, lead, ch) => lead + ch.toLocaleUpperCase());
}
function textStats(text) {
	const trimmed = text.trim();
	return {
		words: trimmed ? trimmed.split(/\s+/).length : 0,
		chars: text.length,
		lines: trimmed ? trimmed.split("\n").length : 0
	};
}
var MAX_DATA_URL = 7e5;
async function fileToJpeg(file) {
	if (!file.type.startsWith("image/")) throw new Error("That file isn't a photo.");
	let bitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		throw new Error("Folio couldn't open that photo. Try a JPG or PNG.");
	}
	try {
		let url = paintJpeg(bitmap, 1280, .72);
		if (url.length > MAX_DATA_URL) url = paintJpeg(bitmap, 1024, .6);
		if (url.length > MAX_DATA_URL) url = paintJpeg(bitmap, 800, .55);
		if (url.length > 9e5) throw new Error("That photo is too heavy. Try a smaller one.");
		return url;
	} finally {
		bitmap.close();
	}
}
function paintJpeg(bitmap, maxEdge, quality) {
	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Couldn't prepare that photo.");
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL("image/jpeg", quality);
}
async function makeThumb(dataUrl) {
	const img = new Image();
	await new Promise((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = () => reject(/* @__PURE__ */ new Error("thumb"));
		img.src = dataUrl;
	});
	const canvas = document.createElement("canvas");
	const width = 160;
	const height = Math.max(1, Math.round(img.height / img.width * width));
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) return dataUrl;
	ctx.drawImage(img, 0, 0, width, height);
	return canvas.toDataURL("image/jpeg", .7);
}
async function readOnDevice(image, lang, onStatus) {
	const pack = tesseractLang(lang);
	onStatus(lang === "ara" ? "Loading the Arabic reader…" : "Loading the on-device reader…");
	const loaded = await import("../_libs/tesseract.js.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
	const Tesseract = loaded.default ?? loaded;
	const worker = await Tesseract.createWorker(pack, Tesseract.OEM.LSTM_ONLY, {
		workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@v7.0.0/dist/worker.min.js",
		logger: (message) => {
			if (message.status === "recognizing text") onStatus(`Reading on this device… ${Math.round(message.progress * 100)}%`);
			else if (lang === "ara") onStatus("Preparing Arabic on this device…");
			else onStatus("Preparing the on-device reader…");
		}
	});
	try {
		return (await worker.recognize(image)).data.text ?? "";
	} finally {
		await worker.terminate();
	}
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function assertImage(data) {
	if (!data || typeof data !== "object" || !("image" in data)) throw new Error("Choose a photo first.");
	const image = data.image;
	if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/i.test(image)) throw new Error("That photo format isn't supported.");
	if (image.length > 9e5) throw new Error("That photo is too heavy. Try a smaller one.");
	const langRaw = "lang" in data ? data.lang : "auto";
	return {
		image,
		lang: isReadLang(langRaw) ? langRaw : "auto"
	};
}
function assertConvert(data) {
	if (!data || typeof data !== "object") throw new Error("Nothing to convert.");
	const text = "text" in data ? data.text : "";
	const instruction = "instruction" in data ? data.instruction : "";
	if (typeof text !== "string" || !text.trim()) throw new Error("Nothing to convert yet.");
	if (typeof instruction !== "string" || !instruction.trim()) throw new Error("Say how to convert it.");
	return {
		text: text.slice(0, 8e3),
		instruction: instruction.slice(0, 500)
	};
}
var readPhotoText = createServerFn({ method: "POST" }).validator(assertImage).handler(createSsrRpc("d3f81a5a5693c85e3ee1c4b7a355724543553d34a1290a7ab8bfe914b88187c3"));
var convertWithGrok = createServerFn({ method: "POST" }).validator(assertConvert).handler(createSsrRpc("cedf1770a07be66796a01357cc642b767bf9bda3b3dc168cbb424a9d3d9415e7"));
var SAMPLE_TEXT = `Saturday market

Sourdough, two loaves
Blood oranges
Olive oil, the green tin
A bunch of thyme

Meet Lena by the fountain.
If I am late, start without me.`;
var ARABIC_SAMPLE_TEXT = `قائمة السوق

خبز، رغيفان
برتقال أحمر
زيت زيتون
حزمة زعتر

أقابل لينا عند النافورة.
إذا تأخرت، ابدؤوا من دوني.`;
function renderSamplePhoto() {
	const canvas = document.createElement("canvas");
	canvas.width = 840;
	canvas.height = 1120;
	const ctx = canvas.getContext("2d");
	if (!ctx) return "";
	ctx.fillStyle = "#f6f0e4";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.strokeStyle = "#e4d8c6";
	ctx.lineWidth = 28;
	ctx.strokeRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#1c1916";
	ctx.font = "600 64px Georgia, serif";
	ctx.fillText("Saturday market", 78, 180);
	ctx.font = "400 36px Georgia, serif";
	const lines = [
		"Sourdough, two loaves",
		"Blood oranges",
		"Olive oil, the green tin",
		"A bunch of thyme"
	];
	for (let i = 0; i < lines.length; i += 1) ctx.fillText(lines[i] ?? "", 78, 300 + i * 64);
	ctx.fillText("Meet Lena by the fountain.", 78, 640);
	ctx.fillText("If I am late, start without me.", 78, 704);
	ctx.fillStyle = "#b24a28";
	ctx.font = "500 22px Georgia, serif";
	ctx.fillText("a note", 78, 980);
	return canvas.toDataURL("image/jpeg", .92);
}
async function renderArabicSample() {
	try {
		await document.fonts.load("600 64px \"Noto Naskh Arabic\"");
		await document.fonts.load("400 36px \"Noto Naskh Arabic\"");
	} catch {}
	const canvas = document.createElement("canvas");
	canvas.width = 840;
	canvas.height = 1120;
	const ctx = canvas.getContext("2d");
	if (!ctx) return "";
	ctx.fillStyle = "#f6f0e4";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.strokeStyle = "#e4d8c6";
	ctx.lineWidth = 28;
	ctx.strokeRect(0, 0, canvas.width, canvas.height);
	ctx.direction = "rtl";
	ctx.textAlign = "right";
	const x = canvas.width - 78;
	ctx.fillStyle = "#1c1916";
	ctx.font = "600 64px \"Noto Naskh Arabic\", serif";
	ctx.fillText("قائمة السوق", x, 180);
	ctx.font = "400 36px \"Noto Naskh Arabic\", serif";
	const lines = [
		"خبز، رغيفان",
		"برتقال أحمر",
		"زيت زيتون",
		"حزمة زعتر"
	];
	for (let i = 0; i < lines.length; i += 1) ctx.fillText(lines[i] ?? "", x, 300 + i * 72);
	ctx.fillText("أقابل لينا عند النافورة.", x, 660);
	ctx.fillText("إذا تأخرت، ابدؤوا من دوني.", x, 732);
	ctx.fillStyle = "#b24a28";
	ctx.font = "500 24px \"Noto Naskh Arabic\", serif";
	ctx.fillText("ملاحظة", x, 980);
	return canvas.toDataURL("image/jpeg", .92);
}
var HISTORY_KEY = "folio.scans.v1";
var LANG_KEY = "folio.read-lang";
var AI_PRESETS = [
	{
		id: "fix",
		label: "Fix mistakes",
		instruction: "Correct typos, misread letters, and broken words. Keep the original language, meaning, and line breaks. Do not add new facts."
	},
	{
		id: "es",
		label: "Spanish",
		instruction: "Translate into natural Spanish. Keep names unchanged."
	},
	{
		id: "fr",
		label: "French",
		instruction: "Translate into natural French. Keep names unchanged."
	},
	{
		id: "ar",
		label: "Arabic",
		instruction: "Translate into Modern Standard Arabic. Keep names unchanged."
	},
	{
		id: "zh",
		label: "Chinese",
		instruction: "Translate into Simplified Chinese. Keep names unchanged."
	},
	{
		id: "sum",
		label: "Summarize",
		instruction: "Summarize in a few short sentences. Stay in the original language."
	},
	{
		id: "formal",
		label: "Formal",
		instruction: "Rewrite in a clear formal tone. Keep the original language and the facts."
	},
	{
		id: "casual",
		label: "Casual",
		instruction: "Rewrite in a warm casual tone. Keep the original language and the facts."
	}
];
function errorText(err) {
	if (err instanceof Error && err.message) return err.message.replace(/^Error:\s*/, "");
	return "Something went wrong. Try that again.";
}
function loadHistory() {
	try {
		const raw = localStorage.getItem(HISTORY_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
	} catch {
		return [];
	}
}
function saveHistory(scans) {
	try {
		localStorage.setItem(HISTORY_KEY, JSON.stringify(scans.slice(0, 8)));
	} catch {}
}
function FolioStudio() {
	const uploadId = (0, import_react.useId)();
	const cameraId = (0, import_react.useId)();
	const uploadRef = (0, import_react.useRef)(null);
	const cameraRef = (0, import_react.useRef)(null);
	const [image, setImage] = (0, import_react.useState)("");
	const [original, setOriginal] = (0, import_react.useState)("");
	const [reading, setReading] = (0, import_react.useState)("");
	const [output, setOutput] = (0, import_react.useState)("");
	const [mode, setMode] = (0, import_react.useState)("as-read");
	const [reader, setReader] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [status, setStatus] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [notice, setNotice] = (0, import_react.useState)("");
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	const [customAsk, setCustomAsk] = (0, import_react.useState)("");
	const [history, setHistory] = (0, import_react.useState)([]);
	const [speaking, setSpeaking] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [readLang, setReadLang] = (0, import_react.useState)("auto");
	(0, import_react.useEffect)(() => {
		setHistory(loadHistory());
		const saved = localStorage.getItem(LANG_KEY);
		if (saved === "auto" || saved === "eng" || saved === "ara") setReadLang(saved);
	}, []);
	(0, import_react.useEffect)(() => {
		function onPaste(event) {
			const file = [...event.clipboardData?.files ?? []].find((item) => item.type.startsWith("image/"));
			if (!file) return;
			event.preventDefault();
			acceptFile(file);
		}
		window.addEventListener("paste", onPaste);
		return () => window.removeEventListener("paste", onPaste);
	}, []);
	(0, import_react.useEffect)(() => {
		return () => {
			window.speechSynthesis?.cancel();
		};
	}, []);
	async function acceptFile(file) {
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
	function commitReading(text, via, photo = image) {
		const cleaned = convertText(text, "as-read");
		setOriginal(cleaned);
		setReading(cleaned);
		setOutput(cleaned);
		setMode("as-read");
		setReader(via);
		setError("");
		setNotice("");
		remember(cleaned, via, photo);
	}
	async function remember(text, via, photo) {
		if (!photo || !text) return;
		let thumb = photo;
		try {
			thumb = await makeThumb(photo);
		} catch {
			thumb = photo;
		}
		const scan = {
			id: `${Date.now()}`,
			at: Date.now(),
			text,
			thumb,
			image: thumb,
			reader: via
		};
		setHistory((current) => {
			const next = [scan, ...current.filter((item) => item.text !== text)].slice(0, 8);
			saveHistory(next);
			return next;
		});
	}
	function chooseLang(next) {
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
	function restore(scan) {
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
	async function readCurrent(prefer) {
		if (!image || busy) return;
		window.speechSynthesis?.cancel();
		setSpeaking(false);
		setBusy(prefer === "device" ? "device" : "read");
		setError("");
		setNotice("");
		setStatus(prefer === "device" ? "Reading on this device…" : "Reading the photo…");
		try {
			if (prefer !== "device") {
				const result = await readPhotoText({ data: {
					image,
					lang: readLang
				} });
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
	function applyMode(next) {
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
	async function runConvert(instruction) {
		const source = output.trim();
		if (!source || busy) return;
		const clipped = source.length > 8e3;
		setBusy("convert");
		setError("");
		setNotice("");
		setStatus("Converting…");
		try {
			const result = await convertWithGrok({ data: {
				text: source.slice(0, 8e3),
				instruction
			} });
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "border-b border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl items-end justify-between gap-6 px-4 py-5 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-widest text-copper uppercase",
						children: "Photo to type"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl leading-none text-ink sm:text-5xl",
						children: "Folio"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hidden max-w-xs text-right text-sm leading-relaxed text-pretty text-muted sm:block",
						children: "Read the words in a photo, then change how they read."
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto grid max-w-6xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-2 lg:gap-6 lg:py-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-4 rounded-3xl border border-line bg-sheet p-4 sm:p-5",
					children: [
						image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-hidden rounded-2xl border border-line bg-paper",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: image,
								alt: "Photo waiting to be read",
								className: "max-h-112 w-full object-contain"
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							role: "button",
							tabIndex: 0,
							onClick: () => uploadRef.current?.click(),
							onKeyDown: (event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									uploadRef.current?.click();
								}
							},
							onDragEnter: (event) => {
								event.preventDefault();
								setDragOver(true);
							},
							onDragOver: (event) => {
								event.preventDefault();
								setDragOver(true);
							},
							onDragLeave: () => setDragOver(false),
							onDrop: (event) => {
								event.preventDefault();
								setDragOver(false);
								const file = event.dataTransfer.files[0];
								if (file) acceptFile(file);
							},
							className: `flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 text-center transition-colors ${dragOver ? "border-copper bg-paper" : "border-line bg-paper"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
								className: "size-8 text-copper",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-2xl text-ink",
								children: "Drop a photo here"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 max-w-xs text-sm leading-relaxed text-pretty text-muted",
								children: "A menu, a sign, a note, a page. Paste one with the keyboard, too."
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: uploadRef,
							id: uploadId,
							type: "file",
							accept: "image/*",
							className: "sr-only",
							onChange: (event) => {
								const file = event.target.files?.[0];
								event.target.value = "";
								if (file) acceptFile(file);
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: cameraRef,
							id: cameraId,
							type: "file",
							accept: "image/*",
							capture: "environment",
							className: "sr-only",
							onChange: (event) => {
								const file = event.target.files?.[0];
								event.target.value = "";
								if (file) acceptFile(file);
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => uploadRef.current?.click(),
									className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-sheet px-4 text-sm font-medium text-ink transition-colors hover:border-ink",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Upload"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => cameraRef.current?.click(),
									className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-sheet px-4 text-sm font-medium text-ink transition-colors hover:border-ink",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Camera"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: loadSample,
									className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-sheet px-4 text-sm font-medium text-ink transition-colors hover:border-ink",
									children: "Try a sample"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void loadArabicSample(),
									className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-sheet px-4 font-arabic text-sm font-medium text-ink transition-colors hover:border-ink",
									children: "عينة عربية"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-medium text-muted",
								children: "Read as"
							}), READ_LANGS.map((item) => {
								const active = readLang === item.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": active,
									onClick: () => chooseLang(item.id),
									className: `min-h-11 rounded-full border px-3 text-sm font-medium transition-colors ${item.id === "ara" ? "font-arabic" : ""} ${active ? "border-ink bg-ink text-sheet" : "border-line bg-sheet text-ink hover:border-ink"}`,
									children: item.label
								}, item.id);
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: !image || busy !== null,
							onClick: () => void readCurrent("auto"),
							className: "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-copper px-5 text-sm font-medium text-copper-ink transition-colors hover:bg-ink disabled:opacity-50",
							children: [busy === "read" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
								className: "size-4 animate-spin",
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanText, {
								className: "size-4",
								"aria-hidden": "true"
							}), busy === "read" ? "Reading…" : "Read the text"]
						}),
						image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: busy !== null,
							onClick: () => void readCurrent("device"),
							className: "self-start text-sm text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-50",
							children: busy === "device" ? "Reading on this device…" : "Read on this device instead"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs leading-relaxed text-muted",
							children: "Photos stay in the browser unless you ask to read or convert them. Choose العربية to read Arabic, on the server or on this device."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex min-w-0 flex-col gap-4 rounded-3xl border border-line bg-sheet p-4 sm:p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl text-ink",
								children: "The reading"
							}), reader ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: ["From ", reader]
							}) : null] }), original ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: resetReading,
								className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-ink transition-colors hover:border-ink",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
									className: "size-4",
									"aria-hidden": "true"
								}), "Reset"]
							}) : null]
						}),
						hasText ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "folio-rise flex min-w-0 flex-col gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex gap-2 overflow-x-auto pb-1",
									children: CONVERT_MODES.map((item) => {
										const active = mode === item.id;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": active,
											onClick: () => applyMode(item.id),
											className: `shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${active ? "border-ink bg-ink text-sheet" : "border-line bg-sheet text-ink hover:border-ink"}`,
											children: item.label
										}, item.id);
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "sr-only",
									htmlFor: "folio-output",
									children: "Converted text"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									id: "folio-output",
									value: output,
									dir: "auto",
									lang: hasArabicScript(output) ? "ar" : void 0,
									onChange: (event) => {
										setOutput(event.target.value);
										setMode("edited");
									},
									rows: 12,
									spellCheck: true,
									className: "folio-reading min-h-64 w-full resize-y rounded-2xl border border-line bg-paper px-4 py-3 text-lg leading-relaxed text-ink"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => void copyOutput(),
											className: "inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-sheet transition-colors hover:bg-copper",
											children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
												className: "size-4",
												"aria-hidden": "true"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
												className: "size-4",
												"aria-hidden": "true"
											}), copied ? "Copied" : "Copy"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: downloadOutput,
											className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-ink transition-colors hover:border-ink",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
												className: "size-4",
												"aria-hidden": "true"
											}), "Download"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: toggleSpeak,
											className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-ink transition-colors hover:border-ink",
											children: [speaking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, {
												className: "size-4",
												"aria-hidden": "true"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {
												className: "size-4",
												"aria-hidden": "true"
											}), speaking ? "Stop" : "Listen"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "ml-auto text-xs text-muted tabular-nums",
											children: [
												stats.words,
												" words · ",
												stats.chars,
												" characters · ",
												stats.lines,
												" lines"
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "border-t border-line pt-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium text-ink",
											children: "Convert further"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs leading-relaxed text-muted",
											children: "Fix a bad reading, change the language, or reshape the tone."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-3 flex gap-2 overflow-x-auto pb-1",
											children: AI_PRESETS.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: busy !== null,
												onClick: () => void runConvert(preset.instruction),
												className: "shrink-0 rounded-full border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-copper hover:text-copper disabled:opacity-50",
												children: preset.label
											}, preset.id))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
											className: "mt-3 flex flex-col gap-2 sm:flex-row",
											onSubmit: (event) => {
												event.preventDefault();
												if (customAsk.trim()) runConvert(customAsk.trim());
											},
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "sr-only",
													htmlFor: "folio-ask",
													children: "How to convert the text"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													id: "folio-ask",
													value: customAsk,
													onChange: (event) => setCustomAsk(event.target.value),
													placeholder: "Turn this into a short text message",
													className: "min-h-11 w-full rounded-full border border-line bg-paper px-4 text-sm text-ink placeholder:text-muted"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "submit",
													disabled: busy !== null || !customAsk.trim(),
													className: "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-copper px-4 text-sm font-medium text-copper-ink transition-colors hover:bg-ink disabled:opacity-50",
													children: [busy === "convert" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
														className: "size-4 animate-spin",
														"aria-hidden": "true"
													}) : null, "Convert"]
												})
											]
										})
									]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-1 flex-col justify-center rounded-2xl bg-paper px-5 py-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-2xl text-ink",
								children: "Nothing read yet"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
								className: "mt-4 space-y-3 text-sm leading-relaxed text-muted",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-display text-copper",
										children: "1 "
									}), "Add a photo, or paste one."] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-display text-copper",
										children: "2 "
									}), "Read the text."] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-display text-copper",
										children: "3 "
									}), "Convert it — case, lines, language, tone."] })
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							"aria-live": "polite",
							className: "min-h-5 text-sm",
							children: [
								error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-danger",
									children: error
								}) : null,
								!error && status ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted",
									children: status
								}) : null,
								!error && !status && notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted",
									children: notice
								}) : null
							]
						})
					]
				})]
			}),
			history.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mx-auto max-w-6xl px-4 pb-10 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium text-ink",
					children: "Kept on this device"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 flex gap-3 overflow-x-auto pb-1",
					children: history.map((scan) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => restore(scan),
							className: "flex w-40 flex-col overflow-hidden rounded-2xl border border-line bg-sheet text-left transition-colors hover:border-ink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: scan.thumb,
								alt: "",
								className: "h-24 w-full object-cover"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "line-clamp-2 px-3 py-2 text-xs leading-snug text-ink",
								children: scan.text
							})]
						})
					}, scan.id))
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto max-w-6xl px-4 pb-10 text-xs text-muted sm:px-6",
				children: "Recent readings stay on this device."
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolioStudio, {});
}
//#endregion
export { Home as component };
