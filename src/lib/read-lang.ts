export const READ_LANGS = [
  { id: "auto", label: "Any" },
  { id: "eng", label: "English" },
  { id: "ara", label: "العربية" },
] as const;

export type ReadLang = (typeof READ_LANGS)[number]["id"];

export function isReadLang(value: unknown): value is ReadLang {
  return value === "auto" || value === "eng" || value === "ara";
}

export function hasArabicScript(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function tesseractLang(lang: ReadLang): string {
  if (lang === "ara") return "ara";
  if (lang === "eng") return "eng";
  return "ara+eng";
}
