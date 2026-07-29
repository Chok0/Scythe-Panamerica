#!/usr/bin/env node
// Serveur API du mode headless — enveloppe HTTP mince autour de HeadlessGame.
// Usage : npm run api   (ou : node scripts/apiServer.mjs [port])
// Doc   : docs/reference/mode_api.md
import http from 'node:http';
import { HeadlessGame } from '../src/logic/headlessGame.js';

const PORT = Number(process.argv[2] || process.env.SCYTHE_API_PORT || 4600);
const games = new Map(); // id → HeadlessGame
let nextId = 1;

const json = (res, code, obj) => {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
};

const readBody = (req) => new Promise((resolve, reject) => {
  let data = '';
  req.on('data', (c) => { data += c; if (data.length > 1e6) { reject(new Error('body trop gros')); req.destroy(); } });
  req.on('end', () => {
    if (!data.trim()) return resolve({});
    try { resolve(JSON.parse(data)); } catch { reject(new Error('JSON invalide')); }
  });
  req.on('error', reject);
});

const getGame = (url, res) => {
  const id = url.searchParams.get('g');
  const g = games.get(id);
  if (!g) { json(res, 404, { ok: false, error: `partie inconnue: ${id} — POST /new pour en créer une` }); return null; }
  return g;
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const route = `${req.method} ${url.pathname}`;
  try {
    if (route === 'POST /new') {
      const cfg = await readBody(req);
      const g = new HeadlessGame(cfg);
      const id = `g${nextId++}`;
      games.set(id, g);
      return json(res, 201, { gameId: id, etat: g.publicState() });
    }
    if (route === 'GET /state') {
      const g = getGame(url, res); if (!g) return;
      return json(res, 200, g.publicState());
    }
    if (route === 'POST /act') {
      const g = getGame(url, res); if (!g) return;
      const action = await readBody(req);
      const r = g.act(action);
      if (!r.ok) return json(res, 422, { ok: false, error: r.error, actionsLegales: g.legalActions() });
      return json(res, 200, { ok: true, events: r.events, etat: g.publicState() });
    }
    if (route === 'GET /journal') {
      const g = getGame(url, res); if (!g) return;
      return json(res, 200, g.exportJournal());
    }
    if (route === 'GET /games') {
      return json(res, 200, [...games.entries()].map(([id, g]) => {
        const s = g.publicState();
        return { id, tour: s.tour, fini: s.fini, faction: s.moi.faction, etoiles: s.moi.etoiles };
      }));
    }
    if (route === 'DELETE /game') {
      const id = url.searchParams.get('g');
      return json(res, games.delete(id) ? 200 : 404, { ok: games.has(id) === false });
    }
    if (route === 'GET /') {
      return json(res, 200, {
        service: 'Scythe Panamerica — mode API',
        endpoints: ['POST /new {faction?,mat?,bots?,difficulty?,seed?,maxRounds?,blind?,factionsBots?}',
          'GET /state?g=ID', 'POST /act?g=ID {type,...}', 'GET /journal?g=ID', 'GET /games', 'DELETE /game?g=ID'],
        doc: 'docs/reference/mode_api.md',
      });
    }
    json(res, 404, { ok: false, error: `route inconnue: ${route}` });
  } catch (e) {
    json(res, 400, { ok: false, error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`⚙ Scythe Panamerica API — http://localhost:${PORT}`);
  console.log('  POST /new · GET /state?g= · POST /act?g= · GET /journal?g= · GET /games');
});
