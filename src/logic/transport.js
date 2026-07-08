// Scythe mech/hero carry rules
// Mech: carries all friendly workers + all resources from origin hex
// Hero: carries all resources from origin hex (NOT workers)
// Worker: carries the origin hex's resources (any number, règle Scythe)
// opts: { carryWorkers=true, carryRes=true } — permet de laisser les ouvriers
// derrière (expansion de territoire : le mech continue seul, les ouvriers
// tiennent le terrain) ou d'abandonner les ressources sur place.
export const transportUnits = (player, fromHex, toHex, unitType, opts = {}) => {
  const { carryWorkers = true, carryRes = true } = opts;
  let p = { ...player, workers: [...player.workers], resources: { ...player.resources } };
  Object.keys(player.resources).forEach(k => { p.resources[k] = { ...player.resources[k] }; });
  const fromKey = String(fromHex), toKey = String(toHex);
  const carried = { workers: 0, resTypes: [] };

  // Mech carries friendly workers on origin hex (sauf choix de les déposer)
  if (unitType === "mech" && carryWorkers) {
    const workersOnHex = p.workers.filter(w => w.hexId === fromHex);
    if (workersOnHex.length > 0) {
      p.workers = p.workers.map(w => w.hexId === fromHex ? { ...w, hexId: toHex } : w);
      carried.workers = workersOnHex.length;
    }
  }

  // Mech, Hero and Worker carry all resources on origin hex
  if (carryRes && p.resources[fromKey]) {
    const fromRes = p.resources[fromKey];
    if (Object.keys(fromRes).length > 0) {
      if (!p.resources[toKey]) p.resources[toKey] = {};
      Object.entries(fromRes).forEach(([resType, qty]) => {
        if (qty > 0) {
          p.resources[toKey][resType] = (p.resources[toKey][resType] || 0) + qty;
          carried.resTypes.push(`${qty}${resType}`);
        }
      });
      delete p.resources[fromKey];
    }
  }

  return { player: p, carried };
};
