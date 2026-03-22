export const getProduceCost = (nWorkers) => {
  const pui = nWorkers >= 3 ? 1 : 0;
  const pop = nWorkers >= 5 ? 1 : 0;
  const coins = nWorkers >= 7 ? 1 : 0;
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
