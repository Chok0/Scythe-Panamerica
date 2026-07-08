export const FACTORY_RR_HEX = 22;

export const PLANS_FORD = [
  { id: "F1", name: "Model M", type: "ford", desc: "Production ×2 sur chaque hex / Deploy -2 métal", topBonus: "produce_x2", bottomBonus: "deploy_discount" },
  { id: "F2", name: "Trimotor", type: "ford", desc: "Move : 3 hex et ignore les rivières / Upgrade -1 coût +1$", topBonus: "move_3", bottomBonus: "upgrade_discount" },
  { id: "F3", name: "River Rouge Special", type: "ford", desc: "1×/Move : téléporter les ressources d'un hex vers le héros / Build -2 bois +2$", topBonus: "teleport_res", bottomBonus: "build_discount" },
  { id: "F4", name: "Iron Horse", type: "ford", desc: "Chaque déplacement mine 1 ressource du terrain d'arrivée / Enlist -2 nourriture +2$", topBonus: "move_mine", bottomBonus: "enlist_discount" },
  { id: "F5", name: "Five Dollar Day", type: "ford", desc: "1×/tour : -2$ → +2 Pop +1 ouvrier / Upgrade +3$", topBonus: "pop_worker", bottomBonus: "upgrade_profit" },
];

export const PLANS_TESLA = [
  { id: "T1", name: "Golem", type: "tesla", desc: "Mechas : 2 hex par Move / Deploy +2 Pui", topBonus: "remote_move", bottomBonus: "deploy_power" },
  { id: "T2", name: "L'Onde Tesla", type: "tesla", desc: "Bolster : +1 Pui par mecha proche du héros / Build sans ouvrier (héros/mecha suffit)", topBonus: "aura_power", bottomBonus: "build_no_worker" },
  { id: "T3", name: "Éclair", type: "tesla", desc: "Mechas : 4 hex par Move / +2 Pui après chaque action bottom", topBonus: "mech_sprint", bottomBonus: "free_bolster" },
  { id: "T4", name: "Le Blueprint Perdu", type: "tesla", desc: "Peut rejouer la même action top deux tours de suite / Votre Enlist ongoing déclenché par TOUS les joueurs", topBonus: "copy_top", bottomBonus: "enlist_extended" },
  { id: "T5", name: "Réseau Neuronal", type: "tesla", desc: "3 déplacements par action Move / Deploy sur hex adjacent aux ouvriers", topBonus: "mass_move", bottomBonus: "deploy_adjacency" },
];
