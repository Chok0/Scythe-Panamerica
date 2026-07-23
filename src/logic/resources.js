// Libellés FR des ressources pour les logs (les CLÉS restent metal/bois/
// nourriture/petrole ; c'est l'affichage qui s'uniformise — avant, « +2 metal »
// côtoyait « +3 nourriture »). Terminologie alignée sur les règles (rules.js).
export const RES_FR = { metal: "métal", bois: "bois", nourriture: "nourriture", petrole: "pétrole", ouvriers: "ouvriers" };
export const resFR = (r) => RES_FR[r] || r;
export const resListFR = (arr) => (arr || []).map(resFR).join(", ");

// Resource helpers — count & spend across all controlled hexes
export const countRes = (player, resType) => {
  let total = 0;
  Object.values(player.resources).forEach(r => { if (r[resType]) total += r[resType]; });
  return total;
};

export const spendRes = (player, resType, qty) => {
  const p = { ...player, resources: {} };
  Object.entries(player.resources).forEach(([hid, r]) => { p.resources[hid] = { ...r }; });
  let left = qty;
  for (const hid of Object.keys(p.resources)) {
    if (left <= 0) break;
    const avail = p.resources[hid][resType] || 0;
    if (avail > 0) {
      const take = Math.min(avail, left);
      p.resources[hid][resType] -= take;
      if (p.resources[hid][resType] <= 0) delete p.resources[hid][resType];
      if (Object.keys(p.resources[hid]).length === 0) delete p.resources[hid];
      left -= take;
    }
  }
  return p;
};

export const getWorkerHexes = (player) => [...new Set(player.workers.map(w => w.hexId))];
