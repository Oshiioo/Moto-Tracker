# moto-tracker-gemini-proxy

Worker Cloudflare qui relaie les requêtes vers l'API Gemini. Vérifie le ID
token Firebase envoyé par l'app (`Authorization: Bearer <idToken>`) avant de
relayer la requête, avec la vraie clé Gemini gardée en secret côté serveur.

## Déploiement

```
cd worker
npm install
npm run deploy
```

## Secret requis (à poser une seule fois, pas versionné)

```
npx wrangler secret put GEMINI_API_KEY
```

## Variable

`ALLOWED_ORIGIN` (dans `wrangler.jsonc`) — origine autorisée pour le CORS.
