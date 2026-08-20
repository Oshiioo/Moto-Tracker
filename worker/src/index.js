// Proxy Cloudflare Worker pour l'API Gemini.
// L'app ne détient plus jamais la clé Gemini — elle envoie le ID token Firebase
// de l'utilisateur connecté, que ce Worker vérifie avant de relayer la requête
// à Gemini avec la vraie clé API (gardée en secret côté serveur).

const FIREBASE_PROJECT_ID = "moto-tracker-683e6";
const FIREBASE_JWKS_URL =
	"https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function corsHeaders(origin) {
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
	};
}

function jsonResponse(body, status, origin) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
	});
}

function base64UrlToBytes(base64Url) {
	const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
	const raw = atob(padded);
	const bytes = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
	return bytes;
}

function base64UrlDecodeJson(segment) {
	return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
}

async function fetchJwks() {
	const res = await fetch(FIREBASE_JWKS_URL, { cf: { cacheTtl: 3600, cacheEverything: true } });
	if (!res.ok) throw new Error("Impossible de récupérer les clés publiques Firebase");
	const { keys } = await res.json();
	return keys;
}

// Vérifie un ID token Firebase (JWT RS256) et retourne l'uid (claim "sub").
// Suit les étapes officielles de vérification décrites par Firebase :
// https://firebase.google.com/docs/auth/admin/verify-id-tokens
async function verifyFirebaseIdToken(token) {
	const parts = token.split(".");
	if (parts.length !== 3) throw new Error("Token malformé");
	const [headerB64, payloadB64, signatureB64] = parts;

	const header = base64UrlDecodeJson(headerB64);
	const payload = base64UrlDecodeJson(payloadB64);

	if (header.alg !== "RS256") throw new Error("Algorithme non supporté");

	const now = Math.floor(Date.now() / 1000);
	if (typeof payload.exp !== "number" || payload.exp <= now) throw new Error("Token expiré");
	if (typeof payload.iat !== "number" || payload.iat > now + 300) throw new Error("Token émis dans le futur");
	if (payload.aud !== FIREBASE_PROJECT_ID) throw new Error("Audience invalide");
	if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) throw new Error("Émetteur invalide");
	if (!payload.sub) throw new Error("Sujet manquant");

	const jwks = await fetchJwks();
	const jwk = jwks.find((k) => k.kid === header.kid);
	if (!jwk) throw new Error("Clé de signature inconnue");

	const publicKey = await crypto.subtle.importKey(
		"jwk",
		jwk,
		{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
		false,
		["verify"]
	);

	const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
	const signature = base64UrlToBytes(signatureB64);
	const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signature, signedData);
	if (!valid) throw new Error("Signature invalide");

	return payload.sub;
}

export default {
	async fetch(request, env) {
		const origin = env.ALLOWED_ORIGIN || "*";

		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders(origin) });
		}

		if (request.method !== "POST") {
			return new Response("Not Found", { status: 404, headers: corsHeaders(origin) });
		}

		const authHeader = request.headers.get("Authorization") || "";
		const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
		if (!token) {
			return jsonResponse({ error: "Authentification requise" }, 401, origin);
		}

		try {
			await verifyFirebaseIdToken(token);
		} catch (err) {
			return jsonResponse({ error: `Token invalide : ${err.message}` }, 401, origin);
		}

		const body = await request.text();

		const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${env.GEMINI_API_KEY}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body,
		});

		const responseBody = await geminiRes.text();
		return new Response(responseBody, {
			status: geminiRes.status,
			headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
		});
	},
};
