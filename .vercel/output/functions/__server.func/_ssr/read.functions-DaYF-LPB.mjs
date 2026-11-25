import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { r as isReadLang } from "./read-lang-C1PuvUBi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/read.functions-DaYF-LPB.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function readPrompt(lang) {
	return `Transcribe every piece of visible text in this image.

Rules:
- Output only the transcription.
- ${lang === "ara" ? "The photo is Arabic. Transcribe it in Arabic script only. Do not translate it into English or Latin letters." : lang === "eng" ? "The photo is English. Transcribe it in English." : "Keep the original language and script, including Arabic. Do not translate."}
- Preserve meaningful line breaks, headings, and list items.
- Do not describe the photo.
- Do not invent text that is not visible.
- If there is no readable text, output exactly: (no text)`;
}
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
function unwrap(raw) {
	const trimmed = raw.trim();
	return (trimmed.match(/^```(?:\w+)?\s*([\s\S]*?)\s*```$/)?.[1] ?? trimmed).trim();
}
async function grok(messages, maxTokens) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Reading with Grok isn't available right now."
	};
	let res;
	try {
		res = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			signal: AbortSignal.timeout(45e3),
			body: JSON.stringify({
				model: "grok-4.5",
				temperature: .1,
				max_tokens: maxTokens,
				messages
			})
		});
	} catch {
		return {
			ok: false,
			error: "Couldn't reach the reader. Try again in a moment."
		};
	}
	if (!res.ok) {
		let code = "";
		try {
			code = (await res.json()).code ?? "";
		} catch {
			code = "";
		}
		if (res.status === 403 || code.includes("spending-limit")) return {
			ok: false,
			error: "Grok is out of credits for this app right now."
		};
		return {
			ok: false,
			error: "The reader couldn't finish that one."
		};
	}
	const content = (await res.json()).choices?.[0]?.message?.content;
	return {
		ok: true,
		text: unwrap(typeof content === "string" ? content : Array.isArray(content) ? content.map((part) => part.text ?? "").join("") : "")
	};
}
var readPhotoText_createServerFn_handler = createServerRpc({
	id: "d3f81a5a5693c85e3ee1c4b7a355724543553d34a1290a7ab8bfe914b88187c3",
	name: "readPhotoText",
	filename: "src/lib/read.functions.ts"
}, (opts) => readPhotoText.__executeServer(opts));
var readPhotoText = createServerFn({ method: "POST" }).validator(assertImage).handler(readPhotoText_createServerFn_handler, async ({ data }) => {
	return grok([{
		role: "user",
		content: [{
			type: "text",
			text: readPrompt(data.lang)
		}, {
			type: "image_url",
			image_url: { url: data.image }
		}]
	}], 2500);
});
var convertWithGrok_createServerFn_handler = createServerRpc({
	id: "cedf1770a07be66796a01357cc642b767bf9bda3b3dc168cbb424a9d3d9415e7",
	name: "convertWithGrok",
	filename: "src/lib/read.functions.ts"
}, (opts) => convertWithGrok.__executeServer(opts));
var convertWithGrok = createServerFn({ method: "POST" }).validator(assertConvert).handler(convertWithGrok_createServerFn_handler, async ({ data }) => {
	return grok([{
		role: "system",
		content: "You convert text. Follow the instruction exactly. Reply with only the converted text — no title, no quotes, no explanation."
	}, {
		role: "user",
		content: `Instruction: ${data.instruction}\n\nText:\n${data.text}`
	}], 2e3);
});
//#endregion
export { convertWithGrok_createServerFn_handler, readPhotoText_createServerFn_handler };
