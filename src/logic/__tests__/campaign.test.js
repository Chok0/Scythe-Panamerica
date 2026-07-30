// Campagne : invariants des missions (chaîne de déblocages cohérente) et
// progression (une mission réussie débloque sa récompense, une fois).
import { describe, it, expect } from 'vitest';
import { CAMPAIGN, UNLOCKS, missionById, missionIsOpen, unlockedMatIds } from '../../data/campaign.js';
import { MATS, MATS_ORIGINAL } from '../../data/mats.js';
import { STRUCTURE_BONUSES } from '../../data/structureBonus.js';
import { PLANS_ORIGINAL } from '../../data/plans.js';
import { OBJECTIVES_ORIGINAL } from '../../data/objectives.js';
import {
  emptyProgress, normalizeProgress, completeMission, evaluateMission,
  missionStatus, nextMission, campaignComplete, availableMats, matIsAvailable,
  activeUnlocks, hasUnlock, doneIds,
} from '../campaign.js';
import { createPlayer } from '../player.js';

const winner = (over = {}) => ({ ...createPlayer("bayou", 1, false), ...over });
const ctx = (over = {}) => ({ players: [], rank: 3, score: 40, sbCoins: 0, turn: 20, ...over });

describe('données de campagne', () => {
  it('5 missions numérotées et uniques', () => {
    expect(CAMPAIGN).toHaveLength(5);
    expect(new Set(CAMPAIGN.map(m => m.id)).size).toBe(5);
    CAMPAIGN.forEach((m, i) => expect(m.num).toBe(i + 1));
  });

  it('chaque mission a un objectif, des honneurs et une récompense connue', () => {
    CAMPAIGN.forEach(m => {
      expect(typeof m.goal.check).toBe("function");
      expect(m.goal.label.length).toBeGreaterThan(5);
      expect(typeof m.honors.check).toBe("function");
      expect(UNLOCKS[m.reward], `récompense inconnue : ${m.reward}`).toBeTruthy();
    });
  });

  it('chaque récompense n\'est distribuée qu\'une fois', () => {
    const rewards = CAMPAIGN.map(m => m.reward);
    expect(new Set(rewards).size).toBe(rewards.length);
    // et toutes les récompenses définies sont effectivement attribuées
    expect(new Set(rewards)).toEqual(new Set(Object.keys(UNLOCKS)));
  });

  it('les configurations imposées pointent sur du contenu qui existe', () => {
    CAMPAIGN.forEach(m => {
      const s = m.setup;
      expect(s.bots).toBeGreaterThanOrEqual(1);
      expect(s.bots).toBeLessThanOrEqual(4);
      expect(["facile", "normal", "difficile"]).toContain(s.difficulty);
      expect(["v3", "v2", "random"]).toContain(s.map);
      if (s.structureBonus && s.structureBonus !== "random") {
        expect(STRUCTURE_BONUSES.some(b => b.id === s.structureBonus)).toBe(true);
      }
    });
  });

  it('les plateaux débloqués couvrent exactement les 7 plateaux originaux', () => {
    const all = unlockedMatIds(Object.keys(UNLOCKS));
    expect(new Set(all)).toEqual(new Set(MATS_ORIGINAL.map(m => m.id)));
  });

  it('le contenu réservé attendu par les récompenses est bien présent', () => {
    expect(PLANS_ORIGINAL).toHaveLength(12);
    expect(OBJECTIVES_ORIGINAL).toHaveLength(21);
  });

  it('les missions s\'ouvrent en chaîne', () => {
    expect(missionIsOpen(CAMPAIGN[0], [])).toBe(true);
    expect(missionIsOpen(CAMPAIGN[1], [])).toBe(false);
    expect(missionIsOpen(CAMPAIGN[1], ["m1"])).toBe(true);
    expect(missionIsOpen(CAMPAIGN[4], ["m1", "m2", "m3"])).toBe(false);
  });
});

describe('objectifs de mission', () => {
  it('m1 — terminer premier', () => {
    expect(evaluateMission(missionById("m1"), winner(), ctx({ rank: 1 })).success).toBe(true);
    expect(evaluateMission(missionById("m1"), winner(), ctx({ rank: 2 })).success).toBe(false);
  });

  it('m2 — 12$ de bonus de pose', () => {
    const m = missionById("m2");
    expect(evaluateMission(m, winner(), ctx({ sbCoins: 12 })).success).toBe(true);
    expect(evaluateMission(m, winner(), ctx({ sbCoins: 11 })).success).toBe(false);
  });

  it('m3 — 3 mechas de l\'Empire détruits', () => {
    const m = missionById("m3");
    expect(evaluateMission(m, winner({ empireKills: 3 }), ctx()).success).toBe(true);
    expect(evaluateMission(m, winner({ empireKills: 2 }), ctx()).success).toBe(false);
  });

  it('m4 — repartir de l\'Usine avec un prototype Tesla', () => {
    const m = missionById("m4");
    expect(evaluateMission(m, winner({ factoryCard: { id: "T01", deck: "tesla" } }), ctx()).success).toBe(true);
    expect(evaluateMission(m, winner({ factoryCard: { id: "F01", deck: "ford" } }), ctx()).success).toBe(false);
    expect(evaluateMission(m, winner(), ctx()).success).toBe(false);
  });

  it('m5 — premier avec 6 étoiles', () => {
    const m = missionById("m5");
    expect(evaluateMission(m, winner({ stars: 6 }), ctx({ rank: 1 })).success).toBe(true);
    expect(evaluateMission(m, winner({ stars: 5 }), ctx({ rank: 1 })).success).toBe(false);
    expect(evaluateMission(m, winner({ stars: 6 }), ctx({ rank: 2 })).success).toBe(false);
  });

  it('les honneurs exigent la réussite de l\'objectif', () => {
    const m = missionById("m4");
    // prototype pris mais 2e au score : objectif oui, honneurs non
    const half = evaluateMission(m, winner({ factoryCard: { deck: "tesla" } }), ctx({ rank: 2 }));
    expect(half).toEqual({ success: true, honors: false });
    const full = evaluateMission(m, winner({ factoryCard: { deck: "tesla" } }), ctx({ rank: 1 }));
    expect(full).toEqual({ success: true, honors: true });
    // objectif raté : pas d'honneurs même si leur condition passe par ailleurs
    expect(evaluateMission(m, winner(), ctx({ rank: 1 })).honors).toBe(false);
  });

  it('un check qui lève ne casse pas la fin de partie', () => {
    const bad = { id: "x", goal: { check: () => { throw new Error("boom"); } } };
    expect(evaluateMission(bad, winner(), ctx())).toEqual({ success: false, honors: false });
    expect(evaluateMission(null, winner(), ctx()).success).toBe(false);
  });
});

describe('progression', () => {
  it('progression vide : seule la 1re mission est ouverte', () => {
    const p = emptyProgress();
    expect(missionStatus(p, CAMPAIGN[0])).toBe("open");
    expect(missionStatus(p, CAMPAIGN[1])).toBe("locked");
    expect(nextMission(p).id).toBe("m1");
    expect(campaignComplete(p)).toBe(false);
  });

  it('réussir une mission la marque, débloque sa récompense et ouvre la suivante', () => {
    const p = completeMission(emptyProgress(), "m1", { honors: true, score: 71, rank: 1, turn: 24 });
    expect(missionStatus(p, CAMPAIGN[0])).toBe("done");
    expect(missionStatus(p, CAMPAIGN[1])).toBe("open");
    expect(p.done.m1).toMatchObject({ honors: true, score: 71, rank: 1, turn: 24 });
    expect(hasUnlock(p, "mats_pionniers")).toBe(true);
    expect(nextMission(p).id).toBe("m2");
  });

  it('rejouer une mission ne retire jamais les honneurs déjà acquis', () => {
    let p = completeMission(emptyProgress(), "m1", { honors: true, score: 71 });
    p = completeMission(p, "m1", { honors: false, score: 40 });
    expect(p.done.m1.honors).toBe(true);
    expect(p.done.m1.score).toBe(40); // le dernier résultat chiffré, lui, s'écrase
    expect(p.unlocked.filter(u => u === "mats_pionniers")).toHaveLength(1);
  });

  it('campagne terminée quand les 5 missions sont réussies', () => {
    const p = CAMPAIGN.reduce((acc, m) => completeMission(acc, m.id), emptyProgress());
    expect(campaignComplete(p)).toBe(true);
    expect(nextMission(p)).toBe(null);
    expect(doneIds(p)).toHaveLength(5);
    expect(activeUnlocks(p)).toHaveLength(Object.keys(UNLOCKS).length);
  });

  it('une mission inconnue ne modifie pas la progression', () => {
    expect(completeMission(emptyProgress(), "m99")).toEqual(emptyProgress());
  });

  it('normalise une sauvegarde douteuse et récupère les récompenses manquantes', () => {
    expect(normalizeProgress(null)).toEqual(emptyProgress());
    expect(normalizeProgress("nope")).toEqual(emptyProgress());
    const p = normalizeProgress({ done: { m1: {}, m404: { honors: true } }, unlocked: ["inconnu"] });
    expect(Object.keys(p.done)).toEqual(["m1"]);
    // récompense de m1 réattribuée alors qu'elle manquait dans `unlocked`
    expect(p.unlocked).toEqual(["mats_pionniers"]);
  });
});

describe('contenu débloqué en partie libre', () => {
  it('sans déblocage : les 6 plateaux standard', () => {
    const p = emptyProgress();
    expect(availableMats(p)).toEqual(MATS);
    expect(activeUnlocks(p)).toEqual([]);
  });

  it('avec déblocages : les plateaux originaux correspondants s\'ajoutent', () => {
    const p = completeMission(emptyProgress(), "m1");
    const mats = availableMats(p);
    expect(mats).toHaveLength(MATS.length + 3);
    expect(mats.filter(m => m.original).map(m => m.id)).toEqual([101, 102, 103]);
    expect(matIsAvailable(103, p)).toBe(true);
    expect(matIsAvailable(107, p)).toBe(false);
  });

  it('contenu désactivé : retour aux plateaux standard', () => {
    const p = completeMission(completeMission(emptyProgress(), "m1"), "m2");
    expect(availableMats(p, false)).toEqual(MATS);
    expect(matIsAvailable(107, p, true)).toBe(true);
    expect(matIsAvailable(107, p, false)).toBe(false);
    expect(activeUnlocks(p, false)).toEqual([]);
  });
});
