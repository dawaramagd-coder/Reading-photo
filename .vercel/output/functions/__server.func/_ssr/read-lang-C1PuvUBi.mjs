//#region node_modules/.nitro/vite/services/ssr/assets/read-lang-C1PuvUBi.js
var READ_LANGS = [
	{
		id: "auto",
		label: "Any"
	},
	{
		id: "eng",
		label: "English"
	},
	{
		id: "ara",
		label: "العربية"
	}
];
function isReadLang(value) {
	return value === "auto" || value === "eng" || value === "ara";
}
function hasArabicScript(text) {
	return /[\u0600-\u06FF]/.test(text);
}
function tesseractLang(lang) {
	if (lang === "ara") return "ara";
	if (lang === "eng") return "eng";
	return "ara+eng";
}
//#endregion
export { tesseractLang as i, hasArabicScript as n, isReadLang as r, READ_LANGS as t };
