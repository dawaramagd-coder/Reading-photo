export const SAMPLE_TEXT = `Saturday market

Sourdough, two loaves
Blood oranges
Olive oil, the green tin
A bunch of thyme

Meet Lena by the fountain.
If I am late, start without me.`;

export const ARABIC_SAMPLE_TEXT = `قائمة السوق

خبز، رغيفان
برتقال أحمر
زيت زيتون
حزمة زعتر

أقابل لينا عند النافورة.
إذا تأخرت، ابدؤوا من دوني.`;

export function renderSamplePhoto(): string {
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
    "A bunch of thyme",
  ];
  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i] ?? "", 78, 300 + i * 64);
  }
  ctx.fillText("Meet Lena by the fountain.", 78, 640);
  ctx.fillText("If I am late, start without me.", 78, 704);

  ctx.fillStyle = "#b24a28";
  ctx.font = "500 22px Georgia, serif";
  ctx.fillText("a note", 78, 980);

  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function renderArabicSample(): Promise<string> {
  try {
    await document.fonts.load('600 64px "Noto Naskh Arabic"');
    await document.fonts.load('400 36px "Noto Naskh Arabic"');
  } catch {
    /* a system Arabic face is enough for the sample page */
  }

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
  ctx.font = '600 64px "Noto Naskh Arabic", serif';
  ctx.fillText("قائمة السوق", x, 180);

  ctx.font = '400 36px "Noto Naskh Arabic", serif';
  const lines = ["خبز، رغيفان", "برتقال أحمر", "زيت زيتون", "حزمة زعتر"];
  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i] ?? "", x, 300 + i * 72);
  }
  ctx.fillText("أقابل لينا عند النافورة.", x, 660);
  ctx.fillText("إذا تأخرت، ابدؤوا من دوني.", x, 732);

  ctx.fillStyle = "#b24a28";
  ctx.font = '500 24px "Noto Naskh Arabic", serif';
  ctx.fillText("ملاحظة", x, 980);

  return canvas.toDataURL("image/jpeg", 0.92);
}
