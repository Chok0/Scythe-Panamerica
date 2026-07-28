// Signature COMPORTEMENTALE des bots gagnants vs derniers : rejoue K parties
// en verbose (1 partie par seed), parse le journal par faction et corrèle
// avec le classement final du dump.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const SEEDS = process.argv.slice(2).map(Number);
const FNAMES = { confederation: 'Confédération', frente: 'Frente Libre', nations: 'Nations Souv.', acadiane: 'Acadiane', bayou: 'Bayou', dominion: 'Dominion' };

const CATS = [
  ['produce', /: Produire$/],
  ['produceBlocked', /\((coût prod\.|rien à produire)/],
  ['bolster', /: \+\d+ pui$|: \+\d+ CC$/],
  ['tradeRes', /: \+\d+ (métal|bois|nourriture|pétrole)$/],
  ['tradePop', /: \+\d+ Pop$/],
  ['noCash', /\(pas d'\$\)/],
  ['moveCoin', /: \+\d+\$ \(Déplacer\)/],
  ['moves', /→ #\d+/],
  ['upgrade', /: Améliorer \d\/6/],
  ['deploy', /: Déployer #/],
  ['build', /: Construire /],
  ['enlist', /: Enrôler /],
  ['factoryTop', /⚙ .*paie /],
  ['factoryMove', /bas d'usine/],
  ['factoryBlocked', /coût impayable/],
  ['encounters', /📜/],
  ['pvpAtk', /⚔🤖/],
];

const agg = { win: {}, last: {}, turns: { win: 0, last: 0 } };
const bump = (side, cat, n = 1) => { agg[side][cat] = (agg[side][cat] || 0) + n; };
let W = 0, L = 0;

for (const seed of SEEDS) {
  const out = execSync(`node scripts/simulate.mjs --games 1 --seed ${seed} --verbose --dump /tmp/g_${seed}.json`,
    { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const dump = JSON.parse(readFileSync(`/tmp/g_${seed}.json`, 'utf8').split('\n')[0]);
  const scored = dump.scored;
  const winner = FNAMES[scored[0].faction];
  const last = FNAMES[scored[scored.length - 1].faction];
  W++; L++;
  agg.turns.win += dump.rounds; agg.turns.last += dump.rounds;
  const lines = out.split('\n');
  for (const line of lines) {
    const side = line.includes(winner) ? 'win' : line.includes(last) ? 'last' : null;
    if (!side) continue;
    for (const [cat, re] of CATS) if (re.test(line)) bump(side, cat);
  }
  console.log(`seed ${seed}: ${dump.nPlayers}J ${dump.rounds}t — gagnant ${scored[0].faction}/${scored[0].mat}/${scored[0].profile} ${scored[0].total} pts · dernier ${scored[scored.length-1].faction}/${scored[scored.length-1].mat}/${scored[scored.length-1].profile} ${scored[scored.length-1].total} pts (pop ${scored[scored.length-1].pop}, ${scored[scored.length-1].coins}$)`);
}

console.log(`\n═══ Actions par partie (moyenne) — GAGNANT vs DERNIER sur ${SEEDS.length} parties ═══`);
console.log(''.padEnd(16), 'GAGNANT'.padStart(8), 'DERNIER'.padStart(9));
for (const [cat] of CATS) {
  const w = (agg.win[cat] || 0) / W, l = (agg.last[cat] || 0) / L;
  console.log(cat.padEnd(16), w.toFixed(1).padStart(8), l.toFixed(1).padStart(9));
}
