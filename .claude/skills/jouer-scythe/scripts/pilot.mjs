#!/usr/bin/env node
// Pilote compact du mode API — pensé pour un agent : chaque commande imprime
// l'essentiel en ~15-30 lignes au lieu des 4-6 Ko de JSON brut.
// Usage :
//   node pilot.mjs map                          # carte statique + rencontres (sans serveur)
//   node pilot.mjs new '{"faction":"bayou","seed":7}'
//   node pilot.mjs state g1
//   node pilot.mjs act g1 '{"type":"bolster","pick":"power"}' '{"type":"skip_bottom"}' …
//   node pilot.mjs full g1                      # JSON complet si le résumé ne suffit pas
//   node pilot.mjs journal g1 fichier.json
// Serveur attendu sur localhost:$SCYTHE_API_PORT (défaut 4600) — `npm run api`.

const PORT = process.env.SCYTHE_API_PORT || 4600;
const BASE = `http://localhost:${PORT}`;
const [cmd, ...args] = process.argv.slice(2);

const api = async (method, path, body) => {
  const r = await fetch(BASE + path, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
};

const RES_ABR = { metal: 'mé', bois: 'bo', nourriture: 'no', petrole: 'pé' };
const abr = (r) => RES_ABR[r] || (r ? r.slice(0, 2) : '·');

const resStr = (resources) => Object.entries(resources || {})
  .map(([hex, r]) => {
    const inner = Object.entries(r).filter(([, n]) => n > 0).map(([t, n]) => `${abr(t)}${n}`).join(' ');
    return inner ? `#${hex}:${inner}` : null;
  }).filter(Boolean).join(' · ') || '∅';

const attStr = (at) => {
  if (!at) return 'à vous — choisissez une colonne (ou pass_turn)';
  if (at.kind === 'move') return `move — ${at.movesLeft} unité(s) restante(s) (move_unit / end_move)`;
  if (at.kind === 'bottom') return `bottom(${at.action}) — bottom_* ou skip_bottom`;
  if (at.kind === 'turn_end') return 'turn_end — reveal (étoile !) ou end_turn';
  if (at.kind === 'combat') return `⚔ COMBAT ${at.role} sur #${at.hexId} — max ${at.maxPower}⚡ ${at.maxCards}🃏 · ${at.info}`;
  if (at.kind === 'encounter') return `📜 RENCONTRE « ${at.rencontre.nom} »`;
  if (at.kind === 'factory_offer') return `⚙ OFFRE USINE (${at.offre.length} cartes)`;
  if (at.kind === 'rails') return `🛤 posez ${at.remaining} rail(s) — {type:"rail",from,to}`;
  return at.kind;
};

const render = (s) => {
  const L = [];
  const m = s.moi;
  L.push(`── T${s.tour}${s.fini ? ' · FINIE' : ''} · ${attStr(s.attente)}`);
  if (s.attente?.kind === 'encounter') s.attente.rencontre.options.forEach(o =>
    L.push(`   opt${o.i}${o.payable ? '' : ' (impayable)'}: ${o.label} — ${o.desc || ''}`));
  if (s.attente?.kind === 'factory_offer') s.attente.offre.forEach(c =>
    L.push(`   ${c.id}: ${c.nom} — coût ${JSON.stringify(c.cout)} → ${JSON.stringify(c.gains)}`));
  L.push(`MOI ${m.faction}·${m.plateau} ⚡${m.pui} 🃏[${(m.cartes || []).join(',')}] ♥${m.pop} 💰${m.argent} ⭐${m.etoiles} lastCol:${m.lastCol ?? '·'}`);
  L.push(`  H#${m.heros} · W ${m.ouvriers.map(w => '#' + w.hex).join(' ')} · M ${m.mechs.map(mm => '#' + mm.hex).join(' ') || '∅'} · Ab[${(m.abilities || []).join(',')}] · rec${m.recrues} amé${m.ameliorations}`);
  L.push(`  res ${resStr(m.ressources)}`);
  const cols = m.colonnes.map((c, i) => {
    const bc = m.coutsBas?.[i];
    return `${i}:${c.replace('·', '/')}↑${m.cubesHaut?.[i] ?? '·'}${bc ? ` ${bc.qty}${abr(bc.res)}` : ''}`;
  }).join(' | ');
  L.push(`  ${cols} · enlist[${(m.enlistMap || []).map(e => e ?? '-').join(',')}]`);
  (m.missions || []).forEach(o => L.push(`  mission${o.i} « ${o.nom} » ${o.remplie ? '✓' + (o.revelee ? ' révélée' : ' RÉVÉLABLE (reveal!)') : '✗'} — ${o.desc}`));
  if (m.objectifFaction) L.push(`  fObj « ${m.objectifFaction.nom} » ${m.objectifFaction.rempli ? (m.objectifFaction.revele ? '✓ révélé' : '✓ RÉVÉLABLE') : '✗'} — ${m.objectifFaction.desc}`);
  if (m.carteUsine) L.push(`  usine « ${m.carteUsine.nom} » coût ${JSON.stringify(m.carteUsine.cout)} → ${JSON.stringify(m.carteUsine.gains)}${m.carteUsine.jouable ? '' : ' (jouée au tour préc.)'}`);
  if (m.comptoirs?.length) L.push(`  comptoirs ${m.comptoirs.map(h => '#' + h).join(' ')}`);
  if (m.pieges?.length) L.push(`  pièges ${m.pieges.map(t => '#' + t.hex + (t.desarme ? '×' : '')).join(' ')}`);
  s.adversaires.forEach(a => {
    const wCount = {};
    a.ouvriers.forEach(h => { wCount[h] = (wCount[h] || 0) + 1; });
    const ws = Object.entries(wCount).map(([h, n]) => `#${h}${n > 1 ? '×' + n : ''}`).join(' ');
    L.push(`ADV ${a.faction}·${a.plateau} ⚡${a.pui} 🃏${a.nbCartes} ♥${a.pop} 💰${a.argent} ⭐${a.etoiles} H#${a.heros} M ${a.mechs.map(h => '#' + h).join(' ') || '∅'} W ${ws || '∅'}${a.profil ? ` [${a.profil}]` : ''}`);
  });
  const cells = Object.entries(s.plateau || {})
    .filter(([, c]) => c.unites || c.stocks || c.rencontre)
    .map(([id, c]) => {
      const parts = [];
      if (c.rencontre) parts.push('📜');
      if (c.unites) parts.push(c.unites.join(','));
      if (c.stocks) parts.push('{' + Object.entries(c.stocks).map(([k, n]) => `${k}${n}`).join(' ') + '}');
      return `#${id}${c.rail ? '🛤' : ''} ${parts.join(' ')}`;
    });
  L.push(`PLATEAU ${cells.join(' | ')}`);
  if (s.rails?.length) L.push(`RAILS ${s.rails.map(([a, b]) => a + '↔' + b).join(' ')}`);
  L.push(`POSE ${s.bonusPose.nom} (${s.bonusPose.bareme}) — mon compte: ${JSON.stringify(s.bonusPose.monCompte)}`);
  L.push(`ACTIONS ${s.actionsLegales.map(a => a.type + (a.nom ? `(${a.nom})` : '')).filter((v, i, arr) => arr.indexOf(v) === i).join(' · ')}`);
  if (s.fini && s.resultat) {
    L.push('CLASSEMENT ' + s.resultat.classement.map(c => `${c.rang}.${c.faction} ${c.total} (⭐${c.etoiles}·terr${c.territoires}·${c.paires}paires·${c.argent}$)`).join(' | '));
  }
  return L.join('\n');
};

const main = async () => {
  if (cmd === 'map') {
    // Carte statique — aucun serveur requis.
    const { HEXES, ADJ, hasR, CURRENT_MAP } = await import(new URL('../../../../src/data/hexes.js', import.meta.url));
    const { TERRAINS } = await import(new URL('../../../../src/data/terrains.js', import.meta.url));
    console.log(`carte ${CURRENT_MAP.id || 'défaut'} — rencontres initiales: ${(CURRENT_MAP.encounterHexes || []).join(', ')}`);
    console.log('format: #id terrain(res) → voisins libres | ~voisins derrière rivière');
    HEXES.filter(h => !h.base).forEach(h => {
      const free = [], river = [];
      (ADJ[h.id] || []).forEach(n => (hasR(h.id, n) ? river : free).push(n));
      const t = TERRAINS[h.t];
      console.log(`#${h.id} ${h.t}${t?.res ? `(${abr(t.res)})` : ''} → ${free.join(' ')}${river.length ? ' | ~' + river.join(' ~') : ''}`);
    });
    return;
  }
  if (cmd === 'new') {
    const cfg = args[0] ? JSON.parse(args[0]) : {};
    const r = await api('POST', '/new', cfg);
    if (!r.gameId) return console.log('ERREUR', JSON.stringify(r));
    console.log(`gameId ${r.gameId}`);
    console.log(render(r.etat));
    return;
  }
  if (cmd === 'state' || cmd === 'full') {
    const s = await api('GET', `/state?g=${args[0]}`);
    if (s.error) return console.log('ERREUR', s.error);
    console.log(cmd === 'full' ? JSON.stringify(s, null, 1) : render(s));
    return;
  }
  if (cmd === 'act') {
    const g = args[0];
    let last = null;
    for (const raw of args.slice(1)) {
      const r = await api('POST', `/act?g=${g}`, JSON.parse(raw));
      if (!r.ok) {
        console.log(`✗ ${raw} → ${r.error}`);
        console.log(`  légales: ${(r.actionsLegales || []).map(a => a.type).join(' · ')}`);
        break; // on s'arrête à la première erreur : les actions suivantes dépendaient de celle-ci
      }
      (r.events || []).forEach(e => console.log('· ' + e));
      last = r.etat;
    }
    if (last) console.log(render(last));
    return;
  }
  if (cmd === 'journal') {
    const j = await api('GET', `/journal?g=${args[0]}`);
    if (args[1]) {
      const { writeFileSync } = await import('node:fs');
      writeFileSync(args[1], JSON.stringify(j, null, 1));
      console.log(`journal → ${args[1]} (${j.journal?.length} entrées)`);
    } else console.log(JSON.stringify(j));
    return;
  }
  console.log('commandes: map · new [cfg] · state <g> · full <g> · act <g> <action.json>… · journal <g> [fichier]');
};

main().catch(e => { console.error('ERREUR', e.message); process.exit(1); });
