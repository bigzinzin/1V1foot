// 1V1 FOOT — serveur Web Service Render : sert le client + relaie le jeu en WebSocket.
// Le jeu reste "hôte-autoritatif" (un navigateur simule) mais les messages transitent par CE
// serveur au lieu d'une route P2P directe → meilleure route/gigue quand le direct est mauvais.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;

const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.mjs':'text/javascript',
  '.css':'text/css', '.m4a':'audio/mp4', '.mp3':'audio/mpeg', '.png':'image/png', '.ico':'image/x-icon', '.json':'application/json' };

const server = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/' || url === '') url = '/index.html';
  const fp = path.join(PUB, path.normalize(url));
  if (!fp.startsWith(PUB)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream', 'Cache-Control':'no-cache' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });
const rooms = new Map();   // code -> { code, name, host, client, specs:Set, playing }

function send(ws, obj) { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj)); } catch (e) {} }
function publicList() {
  const list = [];
  for (const r of rooms.values()) if (r.pub && r.host) list.push({ code: r.code, name: r.name || ('Salon ' + r.code), playing: !!r.playing });
  return list;
}
function leave(ws) {
  const r = ws.room && rooms.get(ws.room); if (!r) return;
  if (ws.role === 'host') {
    // hôte parti → ferme la room, prévient les autres
    send(r.client, { t: 'peer-left' });
    for (const s of r.specs) send(s, { t: 'peer-left' });
    rooms.delete(r.code);
  } else if (ws.role === 'client') {
    r.client = null; r.playing = false; send(r.host, { t: 'peer-left' });
  } else if (ws.role === 'spec') {
    r.specs.delete(ws);
  }
}

wss.on('connection', (ws) => {
  ws.role = null; ws.room = null;
  ws.on('message', (buf) => {
    let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
    const t = m.t;
    if (t === 'create') {
      const code = (m.code || '').toUpperCase();
      if (!code) return;
      rooms.set(code, { code, name: m.name || ('Salon ' + code), host: ws, client: null, specs: new Set(), playing: false, pub: !!m.pub });
      ws.role = 'host'; ws.room = code;
      send(ws, { t: 'created', code });
    } else if (t === 'pub') {            // l'hôte (re)définit la visibilité publique
      const r = rooms.get(ws.room); if (r) r.pub = !!m.v;
    } else if (t === 'playing') {        // l'hôte marque le match comme lancé (liste publique / spectate)
      const r = rooms.get(ws.room); if (r) r.playing = !!m.v;
    } else if (t === 'join') {
      const code = (m.code || '').toUpperCase();
      const r = rooms.get(code);
      if (!r || !r.host) { send(ws, { t: 'nojoin', reason: 'introuvable' }); return; }
      if (!r.client && !r.playing) {     // place de joueur libre
        r.client = ws; ws.role = 'client'; ws.room = code;
        send(ws, { t: 'joined' }); send(r.host, { t: 'peer-joined' });
      } else {                           // match en cours / plein → spectateur
        r.specs.add(ws); ws.role = 'spec'; ws.room = code;
        send(ws, { t: 'spectator' }); send(r.host, { t: 'spec-joined' });
      }
    } else if (t === 'rooms') {
      send(ws, { t: 'rooms', list: publicList() });
    } else if (t === 'rl') {             // relais d'un message de jeu vers l'autre partie
      const r = rooms.get(ws.room); if (!r) return;
      if (ws.role === 'host') { send(r.client, { t: 'rl', d: m.d }); for (const s of r.specs) send(s, { t: 'rl', d: m.d }); }
      else if (ws.role === 'client') { send(r.host, { t: 'rl', d: m.d }); }
    }
  });
  ws.on('close', () => leave(ws));
  ws.on('error', () => {});
});

server.listen(PORT, () => console.log('1V1 FOOT relay on :' + PORT));
