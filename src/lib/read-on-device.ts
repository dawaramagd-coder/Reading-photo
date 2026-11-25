import { tesseractLang, type ReadLang } from "@/lib/read-lang";

export async function readOnDevice(
  image: string,
  lang: ReadLang,
  onStatus: (status: string) => void,
): Promise<string> {
  const pack = tesseractLang(lang);
  onStatus(
    lang === "ara" ? "Loading the Arabic reader…" : "Loading the on-device reader…",
  );
  const loaded = await import("tesseract.js");
  const Tesseract = loaded.default ?? loaded;
  const worker = await Tesseract.createWorker(pack, Tesseract.OEM.LSTM_ONLY, {
    workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@v7.0.0/dist/worker.min.js",
    logger: (message) => {
      if (message.status === "recognizing text") {
        onStatus(`Reading on this device… ${Math.round(message.progress * 100)}%`);
      } else if (lang === "ara") {
        onStatus("Preparing Arabic on this device…");
      } else {
        onStatus("Preparing the on-device reader…");
      }
    },
  });
  try {
    const result = await worker.recognize(image);
    return result.data.text ?? "";
  } finally {
    await worker.terminate();
  }
}
