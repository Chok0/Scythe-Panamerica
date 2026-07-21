// Cartes de combat VALUÉES (façon Scythe : toutes n'ont pas la même valeur).
//
// Conception « matérialisation paresseuse » pour rester compatible avec tout le
// code existant : `player.combatCards` reste le COMPTEUR de référence (tous les
// gains ++/+= restent inchangés). La MAIN `player.cardHand` (tableau de valeurs)
// est réconciliée avec le compteur quand on en a besoin (combat, affichage) :
// on tire une valeur pour chaque carte gagnée, on retire les plus fortes quand
// on en dépense. Les valeurs déjà tirées sont stables (jamais re-tirées).
//
// Distribution : moyenne ≈ 2,5 (léger buff vs l'ancien +2 fixe) avec de la
// variété 1-5 pour que la main soit intéressante à consulter. Vérifiée par la
// simulation (scripts/simulate.mjs) pour ne pas casser l'équilibre.
export const CARD_DECK = [1, 1, 2, 2, 2, 2, 3, 3, 4, 5]; // moyenne 2,5

export const drawCardValue = () => CARD_DECK[Math.floor(Math.random() * CARD_DECK.length)];

// Aligne la main sur le compteur : tire pour les cartes gagnées, retire l'excès.
// N'altère jamais les cartes déjà présentes (valeurs stables).
export const reconcileHand = (p) => {
  const hand = [...(p.cardHand || [])];
  const target = p.combatCards || 0;
  while (hand.length < target) hand.push(drawCardValue());
  while (hand.length > target) hand.pop();
  p.cardHand = hand;
  return p;
};

// Somme des n cartes les plus fortes de la main (sans mutation) — contribution
// au combat si l'on engage n cartes.
export const topCardsSum = (hand, n) => {
  if (!hand || n <= 0) return 0;
  return [...hand].sort((a, b) => b - a).slice(0, n).reduce((a, b) => a + b, 0);
};

// Dépense les n cartes les plus fortes : retire de la main, décrémente le
// compteur, renvoie la somme des valeurs engagées (contribution au combat).
export const spendTopCards = (p, n) => {
  reconcileHand(p);
  if (n <= 0) return 0;
  const sorted = [...p.cardHand].sort((a, b) => b - a);
  const spent = sorted.slice(0, n);
  p.cardHand = sorted.slice(n);
  p.combatCards = p.cardHand.length;
  return spent.reduce((a, b) => a + b, 0);
};

// Dépense des cartes PRÉCISES (choisies par le joueur dans sa main) : retire
// une carte par valeur listée, resynchronise le compteur, renvoie la somme
// engagée. Repli sur la plus forte en cas de désynchronisation improbable.
export const spendPickedCards = (p, values) => {
  reconcileHand(p);
  const hand = [...p.cardHand];
  let sum = 0;
  for (const v of values) {
    if (hand.length === 0) break;
    let i = hand.indexOf(v);
    if (i < 0) i = hand.indexOf(Math.max(...hand));
    sum += hand[i]; hand.splice(i, 1);
  }
  p.cardHand = hand;
  p.combatCards = hand.length;
  return sum;
};

// Décompte par valeur pour l'affichage de la main : { valeur: nombre }
export const handSummary = (p) => {
  const m = {};
  (p.cardHand || []).forEach((v) => { m[v] = (m[v] || 0) + 1; });
  return m;
};
