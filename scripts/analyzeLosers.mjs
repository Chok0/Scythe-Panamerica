// Analyse des BOTS PERDANTS à partir du dump NDJSON du simulateur.
import { readFileSync } from 'node:fs';

const games = readFileSync(process.argv[2] || 'games.ndjson', 'utf8')
  .split('\n').filter(Boolean).map(l => JSON.parse(l));

const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const pct = (n, d) => d ? (100 * n / d).toFixed(1) + '%' : '—';
const f1 = (x) => x.toFixed(1);

const winners = [], lasts = [], mids = [], all = [];
let triggerNotWinner = 0, triggers = 0;
for (const g of games) {
  const s = g.scored;
  winners.push({ ...s[0], nP: g.nPlayers, rounds: g.rounds });
  lasts.push({ ...s[s.length - 1], nP: g.nPlayers, rounds: g.rounds, gap: s[0].total - s[s.length - 1].total });
  s.slice(1, -1).forEach(x => mids.push(x));
  s.forEach((x, r) => all.push({ ...x, rank: r, nP: g.nPlayers }));
  const trig = s.find(x => x.isTrigger);
  if (trig) { triggers++; if (trig !== s[0]) triggerNotWinner++; }
}

console.log(`═══ ${games.length} parties — gagnants vs DERNIERS ═══\n`);
const line = (label, fn, dec = f1) =>
  console.log(label.padEnd(26), dec(avg(winners.map(fn))).padStart(7), dec(avg(lasts.map(fn))).padStart(9),
    (dec(avg(winners.map(fn)) - avg(lasts.map(fn)))).padStart(8));
console.log(''.padEnd(26), 'GAGNANT'.padStart(7), 'DERNIER'.padStart(9), 'ÉCART'.padStart(8));
line('Score total', x => x.total);
line('  Étoiles (pts)', x => x.starScore);
line('  Territoires (pts)', x => x.terScore);
line('  Ressources (pts)', x => x.resScore);
line('  Pièces', x => x.coins);
line('Étoiles (nombre)', x => x.stars);
line('Popularité finale', x => x.pop);
line('Palier de pop (0/1/2)', x => x.popTier);
line('Territoires (nombre)', x => x.territories);
line('Ressources contrôlées', x => x.totalRes);
line('Ouvriers', x => x.workers);
line('Mechas', x => x.mechs);
line('Bâtiments', x => x.buildings);
line('Recrues', x => x.recruits);
line('Améliorations', x => x.upgrades);
line('Rencontres', x => x.encounters);

console.log(`\n── Palier de popularité final (multiplicateurs ×1/×2/×3) ──`);
for (const [name, set] of [['gagnants', winners], ['derniers', lasts]]) {
  const t = [0, 1, 2].map(tier => set.filter(x => x.popTier === tier).length);
  console.log(`  ${name.padEnd(9)} : tier0 (pop≤6) ${pct(t[0], set.length)} | tier1 (7-12) ${pct(t[1], set.length)} | tier2 (13+) ${pct(t[2], set.length)}`);
}

console.log(`\n── Le déclencheur des 6 étoiles perd la partie ──`);
console.log(`  ${triggerNotWinner}/${triggers} parties (${pct(triggerNotWinner, triggers)}) : le bot qui finit se fait dépasser au score`);

console.log(`\n── Étoiles : taux d'obtention gagnants vs derniers (écarts les plus discriminants) ──`);
const starKeys = Object.keys(winners[0].starFlags);
const rows = starKeys.map(k => {
  const w = winners.filter(x => x.starFlags[k]).length / winners.length;
  const l = lasts.filter(x => x.starFlags[k]).length / lasts.length;
  return [k, w, l, w - l];
}).sort((a, b) => b[3] - a[3]);
rows.forEach(([k, w, l, d]) => console.log(`  ${k.padEnd(12)} gagnants ${(100 * w).toFixed(0).padStart(3)}% | derniers ${(100 * l).toFixed(0).padStart(3)}% | Δ ${(100 * d).toFixed(0).padStart(3)}`));

console.log(`\n── Dernière place par PROFIL (sièges → % de dernières places) ──`);
const byKey = (key) => {
  const seats = {}, lastc = {}, winc = {};
  all.forEach(x => { seats[x[key]] = (seats[x[key]] || 0) + 1; });
  lasts.forEach(x => { lastc[x[key]] = (lastc[x[key]] || 0) + 1; });
  winners.forEach(x => { winc[x[key]] = (winc[x[key]] || 0) + 1; });
  Object.keys(seats).sort((a, b) => (lastc[b] || 0) / seats[b] - (lastc[a] || 0) / seats[a])
    .forEach(k => console.log(`  ${String(k).padEnd(14)} ${String(seats[k]).padStart(4)} sièges | dernier ${pct(lastc[k] || 0, seats[k]).padStart(6)} | gagnant ${pct(winc[k] || 0, seats[k]).padStart(6)}`));
};
byKey('profile');
console.log(`\n── Dernière place par FACTION ──`);
byKey('faction');
console.log(`\n── Dernière place par PLATEAU ──`);
byKey('mat');

// Les derniers « catastrophiques » (écart > 60 pts) : à quoi ressemblent-ils ?
const crushed = lasts.filter(x => x.gap >= 60);
console.log(`\n── Défaites écrasées (écart ≥ 60 pts) : ${crushed.length}/${lasts.length} ──`);
if (crushed.length) {
  console.log(`  pop moyenne ${f1(avg(crushed.map(x => x.pop)))} | étoiles ${f1(avg(crushed.map(x => x.stars)))} | pièces ${f1(avg(crushed.map(x => x.coins)))} | territoires ${f1(avg(crushed.map(x => x.territories)))}`);
  const byProf = {}; crushed.forEach(x => { byProf[x.profile] = (byProf[x.profile] || 0) + 1; });
  console.log('  par profil :', Object.entries(byProf).map(([k, v]) => `${k} ${v}`).join(' | '));
  const byFac = {}; crushed.forEach(x => { byFac[x.faction] = (byFac[x.faction] || 0) + 1; });
  console.log('  par faction :', Object.entries(byFac).map(([k, v]) => `${k} ${v}`).join(' | '));
}

// Pièces qui dorment / famine : distribution des pièces chez les derniers
const broke = lasts.filter(x => x.coins <= 3).length;
const rich = lasts.filter(x => x.coins >= 20).length;
console.log(`\n── Trésorerie des derniers ── fauchés (≤3$) ${pct(broke, lasts.length)} | riches (≥20$) ${pct(rich, lasts.length)}`);

// Étoiles totales par nombre de joueurs (la densité de la course)
console.log(`\n── Écart moyen au score par taille de partie ──`);
[2, 3, 4, 5].forEach(n => {
  const l = lasts.filter(x => x.nP === n);
  if (l.length) console.log(`  ${n} joueurs : écart moyen ${f1(avg(l.map(x => x.gap)))} pts (${l.length} parties), durée ${f1(avg(l.map(x => x.rounds)))} tours`);
});
