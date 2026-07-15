# 1V1 FOOT — Web Service (relais WebSocket)

Version **serveur** du jeu : au lieu d'une connexion P2P directe (souvent mauvaise route entre 2 FAI),
le trafic passe par **ce serveur** hébergé en Europe → meilleure route / moins de gigue quand le direct est mauvais.

Le jeu reste **hôte-autoritatif** (un navigateur simule), mais hôte et client communiquent
**via le serveur** (`client ↔ serveur EU ↔ hôte`) au lieu d'un canal P2P.

## Contenu
- `server.mjs` — serveur Node : sert le client (`public/`) **et** relaie le jeu en WebSocket (rooms par code, salons publics, spectateurs).
- `public/index.html` — le jeu (transport PeerJS/MQTT remplacé par WebSocket vers ce serveur).
- `public/sfx/` — musiques/SFX.
- `render.yaml` — blueprint Render (Web Service Node, région Francfort, plan free).

## Déploiement Render (Web Service)
1. Mettre **ce dossier** (`1v1foot-server/`) sur un repo GitHub.
2. Render → **New** → **Blueprint** (lit `render.yaml`) **ou** **Web Service** manuel :
   - **Runtime** : Node
   - **Region** : Frankfurt (EU)
   - **Build Command** : `npm install`
   - **Start Command** : `node server.mjs`
   - **Plan** : Free
3. Render fournit l'URL (HTTPS + WebSocket `wss://` automatiques). Le client se connecte tout seul à son propre hôte.

⚠️ **Plan Free** : le service s'endort après ~15 min d'inactivité → le **1er** à se connecter attend ~30-60 s (réveil), puis c'est instantané. Passer en plan payant (~7 $/mois) pour le garder toujours actif.

## Local
```sh
cd 1v1foot-server
npm install
node server.mjs        # http://localhost:3000
```

## Notes
- Pas de PeerJS ni MQTT : tout (matchmaking, salons publics, relais de jeu) passe par ce serveur en WebSocket.
- Si la latence reste mauvaise même via le serveur, c'est le **dernier kilomètre** d'un joueur (sa connexion locale instable) — qu'aucun serveur ne corrige. Étape suivante éventuelle : serveur **autoritatif** complet (simulation côté serveur + rollback), plus gros chantier.
