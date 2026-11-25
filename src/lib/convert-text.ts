export const CONVERT_MODES = [
  { id: "as-read", label: "As read" },
  { id: "paragraphs", label: "Paragraphs" },
  { id: "one-line", label: "One line" },
  { id: "upper", label: "UPPER" },
  { id: "lower", label: "lower" },
  { id: "title", label: "Title Case" },
  { id: "sentence", label: "Sentence" },
  { id: "bullets", label: "Bullets" },
] as const;

export type ConvertMode = (typeof CONVERT_MODES)[number]["id"];

export function convertText(source: string, mode: ConvertMode): string {
  const text = source.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
  switch (mode) {
    case "as-read":
      return text
        .split("\n")
        .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    case "paragraphs":
      return toParagraphs(text);
    case "one-line":
      return text.replace(/\s+/g, " ").trim();
    case "upper":
      return text.trim().toLocaleUpperCase();
    case "lower":
      return text.trim().toLocaleLowerCase();
    case "title":
      return toTitle(text.trim());
    case "sentence":
      return toSentence(text.trim());
    case "bullets":
      return text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => (/^([•\-*]|\d+[.)])\s/.test(line) ? line : `• ${line}`))
        .join("\n");
  }
}

function toParagraphs(text: string): string {
  const paragraphs: string[] = [];
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
    if (!buffer) {
      buffer = line;
    } else if (/[-–—]$/.test(buffer)) {
      buffer = `${buffer.slice(0, -1)}${line}`;
    } else {
      buffer = `${buffer} ${line}`;
    }
  }
  if (buffer) paragraphs.push(buffer.trim());
  return paragraphs.join("\n\n");
}

function toTitle(text: string): string {
  return text.replace(/\S+/g, (word) => {
    const lower = word.toLocaleLowerCase();
    return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
  });
}

function toSentence(text: string): string {
  const lower = text.toLocaleLowerCase();
  return lower.replace(
    /(^|[.!?]\s+|\n+)(\p{L})/gu,
    (_, lead: string, ch: string) => lead + ch.toLocaleUpperCase(),
  );
}

export function textStats(text: string): { words: number; chars: number; lines: number } {
  const trimmed = text.trim();
  return {
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    chars: text.length,
    lines: trimmed ? trimmed.split("\n").length : 0,
  };
}
