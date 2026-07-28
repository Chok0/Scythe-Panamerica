#!/usr/bin/env node
/**
 * Audit des riverwalks — Scythe: Panamerica
 *
 * Usage : node scripts/riverwalkAudit.mjs
 *
 * Un riverwalk n'a de valeur que s'il ouvre au moins une SORTIE de l'îlot de
 * départ de sa faction. Un terrain que la faction possède déjà chez elle, ou
 * qui ne borde aucune rivière sur sa frontière, est une capacité MORTE : le
 * joueur paie un mecha pour rien.
 *
 * L'îlot est calculé en BFS depuis les hexes de départ, sans franchir de
 * rivière, en traitant :
 *   - le lac comme infranchissable (seule l'Acadiane y entre, avec Batelier) ;
 *   - le marécage comme un mur pour tout le monde SAUF le Bayou — pour les
 *     autres c'est un péage (-1♥/-1⚡) doublé d'un arrêt forcé, donc pas une
 *     route d'expansion mais un passage à péage ; pour le Bayou (Sang du
 *     Marais) c'est une route franche, ce qui explique son îlot bien plus vaste.
 *
 * À relancer après CHAQUE retouche de la carte (terrains ou rivières) :
 * c'est exactement ce qui avait laissé passer deux capacités mortes en v0.14.
 */
import { hMap, ADJ, hasR } from '../src/data/hexes.js';
import { FACTIONS } from '../src/data/factions.js';
import { TERRAINS } from '../src/data/terrains.js';

// Îlot de départ + sorties par rivière, groupées par terrain de destination.
export const islandOf = (fid, f) => {
  const walkable = (id) => {
    const h = hMap[id];
    if (!h || h.base || h.t === 'lac') return false;
    return h.t !== 'marecage' || fid === 'bayou';   // Sang du Marais
  };
  const seen = new Set(f.workerHex);
  const queue = [...f.workerHex];
  while (queue.length) {
    const cur = queue.shift();
    for (const nb of (ADJ[cur] || [])) {
      if (seen.has(nb) || !walkable(nb) || hasR(cur, nb)) continue;
      seen.add(nb); queue.push(nb);
    }
  }
  const exits = {};
  for (const cur of seen) {
    for (const nb of (ADJ[cur] || [])) {
      const h = hMap[nb];
      if (!h || h.base || h.t === 'lac' || seen.has(nb) || !hasR(cur, nb)) continue;
      (exits[h.t] = exits[h.t] || []).push(`#${cur}→#${nb}`);
    }
  }
  return { island: seen, exits };
};

// Nombre de sorties qu'un riverwalk débloque réellement, terrain par terrain.
export const riverwalkValue = (fid, f) => {
  const { exits } = islandOf(fid, f);
  return (f.riverwalk || []).map(t => ({ t, n: (exits[t] || []).length }));
};

if (import.meta.url === `file://${process.argv[1]}`) {
  let dead = 0;
  for (const [fid, f] of Object.entries(FACTIONS)) {
    const { island, exits } = islandOf(fid, f);
    const value = riverwalkValue(fid, f);
    const bad = value.filter(v => v.n === 0);
    dead += bad.length;
    const verdict = bad.length ? `⚠ MORT : ${bad.map(v => v.t).join(', ')}` : '✅';
    console.log(`\n▸ ${f.name}  —  îlot ${island.size} hex  —  ${f.rwName} [${value.map(v => `${v.t}:${v.n}`).join(' + ')}]  ${verdict}`);
    const ranked = Object.entries(exits).sort((a, b) => b[1].length - a[1].length);
    if (!ranked.length) console.log('     (aucune sortie par rivière)');
    ranked.forEach(([t, l]) => console.log(
      `     ${t.padEnd(9)} ${(TERRAINS[t]?.res || '—').padEnd(10)} ${String(l.length).padStart(2)}  ${l.join(' ')}`));
  }
  console.log(`\n${dead === 0 ? '✅ Aucune capacité morte.' : `⚠ ${dead} terrain(s) de riverwalk sans effet.`}`);
  process.exitCode = dead === 0 ? 0 : 1;
}
