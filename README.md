# 1V1 FOOT — déploiement Render

Jeu 3D 1v1 (Three.js + PeerJS) en un seul fichier HTML autonome. Aucun build : c'est un **site statique**.

## Contenu du dossier
- `index.html` — le jeu (Three.js et PeerJS chargés en HTTPS via CDN unpkg)
- `render.yaml` — blueprint Render (site statique)

## Méthode A — Blueprint (recommandé, via Git)
1. Mettre ce dossier sur GitHub/GitLab :
   ```sh
   cd 1v1foot-render
   git init
   git add .
   git commit -m "1v1 foot - site statique"
   git branch -M main
   git remote add origin <URL_DE_TON_REPO>
   git push -u origin main
   ```
2. Sur https://dashboard.render.com → **New** → **Blueprint** → choisir le repo.
3. Render lit `render.yaml`, crée le site statique et publie. À chaque `git push`, redéploiement auto.

## Méthode B — Static Site (sans render.yaml)
1. Pousser le repo (étape 1 ci-dessus).
2. Render → **New** → **Static Site** → choisir le repo, puis :
   - **Build Command** : *(laisser vide)*
   - **Publish Directory** : `.`
3. **Create Static Site**.

## Notes
- Render fournit le HTTPS automatiquement : la connexion P2P (PeerServer cloud) fonctionne sans config.
- Le multijoueur passe par WebRTC P2P (NAT traversal). Marche mieux en Wi-Fi domestique ; certains réseaux d'entreprise/4G bloquent et peuvent nécessiter un serveur TURN.
- Pour un nom de page propre, l'URL racine sert directement `index.html`.
