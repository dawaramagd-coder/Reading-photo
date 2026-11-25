import { createServerFn } from "@tanstack/react-start";
import { isReadLang, type ReadLang } from "@/lib/read-lang";

type GrokResult = { ok: true; text: string } | { ok: false; error: string };

function readPrompt(lang: ReadLang): string {
  const focus =
    lang === "ara"
      ? "The photo is Arabic. Transcribe it in Arabic script only. Do not translate it into English or Latin letters."
      : lang === "eng"
        ? "The photo is English. Transcribe it in English."
        : "Keep the original language and script, including Arabic. Do not translate.";
  return `Transcribe every piece of visible text in this image.

Rules:
- Output only the transcription.
- ${focus}
- Preserve meaningful line breaks, headings, and list items.
- Do not describe the photo.
- Do not invent text that is not visible.
- If there is no readable text, output exactly: (no text)`;
}

function assertImage(data: unknown): { image: string; lang: ReadLang } {
  if (!data || typeof data !== "object" || !("image" in data)) {
    throw new Error("Choose a photo first.");
  }
  const image = (data as { image: unknown }).image;
  if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/i.test(image)) {
    throw new Error("That photo format isn't supported.");
  }
  if (image.length > 900_000) {
    throw new Error("That photo is too heavy. Try a smaller one.");
  }
  const langRaw = "lang" in data ? (data as { lang: unknown }).lang : "auto";
  return { image, lang: isReadLang(langRaw) ? langRaw : "auto" };
}

function assertConvert(data: unknown): { text: string; instruction: string } {
  if (!data || typeof data !== "object") throw new Error("Nothing to convert.");
  const text = "text" in data ? (data as { text: unknown }).text : "";
  const instruction = "instruction" in data ? (data as { instruction: unknown }).instruction : "";
  if (typeof text !== "string" || !text.trim()) throw new Error("Nothing to convert yet.");
  if (typeof instruction !== "string" || !instruction.trim()) {
    throw new Error("Say how to convert it.");
  }
  return {
    text: text.slice(0, 8000),
    instruction: instruction.slice(0, 500),
  };
}

function unwrap(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:\w+)?\s*([\s\S]*?)\s*```$/);
  return (fenced?.[1] ?? trimmed).trim();
}

async function grok(messages: unknown[], maxTokens: number): Promise<GrokResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "Reading with Grok isn't available right now." };

  let res: Response;
  try {
    res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.1,
        max_tokens: maxTokens,
        messages,
      }),
    });
  } catch {
    return { ok: false, error: "Couldn't reach the reader. Try again in a moment." };
  }

  if (!res.ok) {
    let code = "";
    try {
      const errBody = (await res.json()) as { code?: string };
      code = errBody.code ?? "";
    } catch {
      code = "";
    }
    if (res.status === 403 || code.includes("spending-limit")) {
      return { ok: false, error: "Grok is out of credits for this app right now." };
    }
    return { ok: false, error: "The reader couldn't finish that one." };
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string | { text?: string }[] } }[];
  };
  const content = body.choices?.[0]?.message?.content;
  const text =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.map((part) => part.text ?? "").join("")
        : "";
  return { ok: true, text: unwrap(text) };
}

export const readPhotoText = createServerFn({ method: "POST" })
  .validator(assertImage)
  .handler(async ({ data }): Promise<GrokResult> => {
    return grok(
      [
        {
          role: "user",
          content: [
            { type: "text", text: readPrompt(data.lang) },
            { type: "image_url", image_url: { url: data.image } },
          ],
        },
      ],
      2500,
    );
  });

export const convertWithGrok = createServerFn({ method: "POST" })
  .validator(assertConvert)
  .handler(async ({ data }): Promise<GrokResult> => {
    return grok(
      [
        {
          role: "system",
          content:
            "You convert text. Follow the instruction exactly. Reply with only the converted text — no title, no quotes, no explanation.",
        },
        {
          role: "user",
          content: `Instruction: ${data.instruction}\n\nText:\n${data.text}`,
        },
      ],
      2000,
    );
  });
