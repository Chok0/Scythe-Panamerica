// Scythe mech/hero carry rules
// Mech: carries friendly workers + resources from origin hex
// Hero: carries resources from origin hex (NOT workers)
// Worker: carries the origin hex's resources (any number, règle Scythe)
// opts: { carryWorkers=true, carryRes=true, workerCount, resCounts }
//   - carryWorkers/carryRes : tout-ou-rien (le mech continue seul, etc.)
//   - workerCount : nombre d'ouvriers à emporter (défaut : tous)
//   - resCounts : { resType: qty } à emporter (défaut : tout) — le reste
//     RESTE SUR PLACE (transport partiel : tenir le terrain avec une partie)
export const transportUnits = (player, fromHex, toHex, unitType, opts = {}) => {
  const { carryWorkers = true, carryRes = true, workerCount, resCounts } = opts;
  let p = { ...player, workers: [...player.workers], resources: { ...player.resources } };
  Object.keys(player.resources).forEach(k => { p.resources[k] = { ...player.resources[k] }; });
  const fromKey = String(fromHex), toKey = String(toHex);
  const carried = { workers: 0, resTypes: [] };

  // Mech carries friendly workers on origin hex (sauf choix de les déposer)
  if (unitType === "mech" && carryWorkers) {
    const workersOnHex = p.workers.filter(w => w.hexId === fromHex);
    const n = Math.min(workerCount ?? workersOnHex.length, workersOnHex.length);
    if (n > 0) {
      let moved = 0;
      p.workers = p.workers.map(w => {
        if (w.hexId === fromHex && moved < n) { moved++; return { ...w, hexId: toHex }; }
        return w;
      });
      carried.workers = n;
    }
  }

  // Mech, Hero and Worker carry resources on origin hex (tout ou quantités choisies)
  if (carryRes && p.resources[fromKey]) {
    const fromRes = p.resources[fromKey];
    if (Object.keys(fromRes).length > 0) {
      if (!p.resources[toKey]) p.resources[toKey] = {};
      Object.entries(fromRes).forEach(([resType, qty]) => {
        const take = Math.min(resCounts?.[resType] ?? qty, qty);
        if (take > 0) {
          p.resources[toKey][resType] = (p.resources[toKey][resType] || 0) + take;
          fromRes[resType] = qty - take;
          carried.resTypes.push(`${take}${resType}`);
        }
      });
      Object.keys(fromRes).forEach(k => { if (!fromRes[k]) delete fromRes[k]; });
      if (Object.keys(fromRes).length === 0) delete p.resources[fromKey];
    }
  }

  return { player: p, carried };
};
