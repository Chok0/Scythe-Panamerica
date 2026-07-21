// Coût croissant de Produce (règle Scythe) : plus on a sorti d'ouvriers,
// plus produire coûte. On démarre avec 2 ouvriers, 6 autres à sortir (max 8).
// La piste des 6 ouvriers (ProduceTrack) matérialise la règle : le coût est
// IMPRIMÉ sous les cases — ⚡ sous la 2e sortie, ♥ sous la 4e, 💰 sous la 6e :
//   1-3 ouvriers : gratuit          (0-1 sorti)
//   4-5 ouvriers : 1 Puissance     (2-3 sortis)
//   6-7 ouvriers : + 1 Popularité  (4-5 sortis)
//   8   ouvriers : + 1 Pièce       (6 sortis)
export const getProduceCost = (nWorkers) => {
  const pui = nWorkers >= 4 ? 1 : 0;
  const pop = nWorkers >= 6 ? 1 : 0;
  const coins = nWorkers >= 8 ? 1 : 0;
  return { pui, pop, coins };
};

export const canPayProduce = (player) => {
  const c = getProduceCost(player.workers.length);
  return player.power >= c.pui && player.pop >= c.pop && player.coins >= c.coins;
};

export const payProduce = (player) => {
  const c = getProduceCost(player.workers.length);
  player.power -= c.pui;
  player.pop -= c.pop;
  player.coins -= c.coins;
};

export const produceCostLabel = (nWorkers) => {
  const c = getProduceCost(nWorkers);
  if (c.pui === 0 && c.pop === 0 && c.coins === 0) return "Gratuit";
  const parts = [];
  if (c.pui) parts.push(`${c.pui} Pui`);
  if (c.pop) parts.push(`${c.pop} Pop`);
  if (c.coins) parts.push(`${c.coins}$`);
  return parts.join(" + ");
};
