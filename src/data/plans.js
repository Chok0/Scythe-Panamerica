export const FACTORY_RR_HEX = 22;

export const PLANS_FORD = [
  { id: "F1", name: "Model M", type: "ford", desc: "Produce ×2 par ouvrier / Deploy 2M → 2$", topBonus: "produce_x2", bottomBonus: "deploy_discount" },
  { id: "F2", name: "Trimotor", type: "ford", desc: "Move 3 hex (ignore rivières) / Upgrade 2P → 1$", topBonus: "move_3", bottomBonus: "upgrade_discount" },
  { id: "F3", name: "River Rouge Special", type: "ford", desc: "Téléport ressources / Build 2B → 2$", topBonus: "teleport_res", bottomBonus: "build_discount" },
  { id: "F4", name: "Iron Horse", type: "ford", desc: "Move → Mine (gratuit) / Enlist 2N → 2$", topBonus: "move_mine", bottomBonus: "enlist_discount" },
  { id: "F5", name: "Five Dollar Day", type: "ford", desc: "-2$ → +2 Pop + 1 ouvrier / Upgrade 1P → 3$", topBonus: "pop_worker", bottomBonus: "upgrade_profit" },
];

export const PLANS_TESLA = [
  { id: "T1", name: "Golem", type: "tesla", desc: "Move mecha 2 hex à distance / Deploy 3M → +2 Pui", topBonus: "remote_move", bottomBonus: "deploy_power" },
  { id: "T2", name: "L'Onde Tesla", type: "tesla", desc: "+1 Pui mechas rayon 2 / Build 3B → sans ouvrier", topBonus: "aura_power", bottomBonus: "build_no_worker" },
  { id: "T3", name: "Éclair", type: "tesla", desc: "Move mecha 4 hex / Bolster gratuit", topBonus: "mech_sprint", bottomBonus: "free_bolster" },
  { id: "T4", name: "Le Blueprint Perdu", type: "tesla", desc: "Copie top-row / Enlist 3N → ongoing étendu", topBonus: "copy_top", bottomBonus: "enlist_extended" },
  { id: "T5", name: "Réseau Neuronal", type: "tesla", desc: "Move TOUS mechas 1 hex / Deploy 2M+1P → adj. temp.", topBonus: "mass_move", bottomBonus: "deploy_adjacency" },
];
