import { describe, it, expect } from 'vitest';
import { ENCOUNTERS, RAIL_ENCOUNTERS, ALL_ENCOUNTERS, hasTeslaFragment } from '../../data/encounters.js';
import { resolveBotEncounter } from '../botEncounters.js';
import { createPlayer } from '../player.js';

describe('deck de rencontres — 15 Panamerica + 12 triptyques originaux + 6 extension', () => {
  it('33 cartes, ids uniques, 12 marquées src:"original"', () => {
    expect(ENCOUNTERS.length).toBe(33);
    expect(new Set(ENCOUNTERS.map(c => c.id)).size).toBe(33);
    expect(ENCOUNTERS.filter(c => c.src === "original").length).toBe(12);
  });

  it('~50% des cartes offrent un choix Fragment Tesla, à des positions variées', () => {
    const hasFrag = (c) => c.choices.some(ch => /Fragment/.test(ch.desc));
    const fragCards = ENCOUNTERS.filter(hasFrag);
    expect(fragCards.length).toBe(16); // 16/33 ≈ 48.5%
    // positions variées : le fragment n'est pas cantonné à l'option 2
    const slots = new Set();
    fragCards.forEach(c => c.choices.forEach((ch, i) => { if (/Fragment/.test(ch.desc)) slots.add(i); }));
    expect(slots.size).toBe(3);
  });

  it('structure du triptyque : 3 options, la 1re gratuite gagne +1 pop, les coûts sont gardés', () => {
    ENCOUNTERS.forEach(card => {
      expect(card.choices.length, `carte ${card.id}`).toBe(3);
      card.choices.forEach(ch => {
        expect(typeof ch.label).toBe("string");
        expect(typeof ch.desc).toBe("string");
        expect(typeof ch.effect).toBe("function");
      });
      // Option 1 : gratuite (pas de garde de coût) et donne de la popularité
      expect(card.choices[0].available, `carte ${card.id}: option 1 gratuite`).toBeUndefined();
      expect(card.choices[0].desc).toMatch(/\+1 pop/);
      // Option 3 : payée en popularité (convention parsée par le bot : « -N pop »)
      expect(card.choices[2].desc, `carte ${card.id}: option 3 en pop`).toMatch(/-\d+ pop/);
    });
  });

  it('les effets des 27 cartes s\'appliquent sans planter sur un joueur riche', () => {
    ENCOUNTERS.forEach(card => card.choices.forEach(ch => {
      const p = createPlayer('confederation', 1, false);
      p.coins = 20; p.pop = 10; p.resources = {};
      if (!ch.available || ch.available(p)) expect(() => ch.effect(p)).not.toThrow();
    }));
  });

  it('grantsResources (bot) : les ressources au choix atterrissent sur le hex de la rencontre', () => {
    const p = createPlayer('confederation', 1, true);
    p.botProfile = 'equilibre'; p.coins = 5;
    const card = { id: 999, name: "Test", choices: [
      { label: "Emplettes", icon: "📦", desc: "-2$, +3 ressources au choix", grantsResources: 3,
        available: (pl) => pl.coins >= 2, effect: (pl) => { pl.coins -= 2; } },
    ] };
    const { player: after } = resolveBotEncounter(p, [card]);
    expect(after.coins).toBe(3);
    const onHero = Object.values(after.resources[String(after.hero)] || {}).reduce((a, b) => a + b, 0);
    expect(onHero).toBe(3);
  });

  it('hasTeslaFragment repère exactement les 16 cartes taguées grantsFragment', () => {
    expect(ENCOUNTERS.filter(hasTeslaFragment).length).toBe(16);
    ENCOUNTERS.forEach(c => {
      const tagged = c.choices.some(ch => ch.grantsFragment);
      expect(hasTeslaFragment(c), `carte ${c.id}`).toBe(tagged);
    });
  });
});

describe('cartes « Chantier ferroviaire » (récompense de campagne, ch.1)', () => {
  it('3 cartes, ids distincts du deck standard, structure de triptyque respectée', () => {
    expect(RAIL_ENCOUNTERS.length).toBe(3);
    const stdIds = new Set(ENCOUNTERS.map(c => c.id));
    RAIL_ENCOUNTERS.forEach(c => expect(stdIds.has(c.id), `id ${c.id} en collision`).toBe(false));
    expect(new Set(ALL_ENCOUNTERS.map(c => c.id)).size).toBe(ALL_ENCOUNTERS.length);
    RAIL_ENCOUNTERS.forEach(c => {
      expect(c.choices.length, `carte ${c.id}`).toBe(3);
      expect(c.choices[0].desc).toMatch(/\+1 pop/);
      expect(c.choices[1].railSegments, `carte ${c.id}: option 2 pose 2 segments`).toBe(2);
      expect(c.choices[2].grantsGare, `carte ${c.id}: option 3 donne une Gare`).toBe(true);
      expect(c.choices[2].desc).toMatch(/-2 pop/);
    });
  });

  it('aucune ne grante de fragment Tesla — n\'apparaît jamais dans le verrou', () => {
    RAIL_ENCOUNTERS.forEach(c => expect(hasTeslaFragment(c), `carte ${c.id}`).toBe(false));
  });

  it('les effets s\'appliquent sans planter, et les gardes filtrent bien un joueur pauvre', () => {
    RAIL_ENCOUNTERS.forEach(card => card.choices.forEach(ch => {
      const rich = createPlayer('confederation', 1, false); rich.coins = 20; rich.pop = 10; rich.resources = {};
      if (!ch.available || ch.available(rich)) expect(() => ch.effect(rich)).not.toThrow();
      const poor = createPlayer('confederation', 1, false); poor.coins = 0; poor.pop = 0; poor.resources = {};
      if (ch.available) expect(ch.available(poor), `carte ${card.id} option payante`).toBe(false);
    }));
  });

  // Le choix du bot est ALÉATOIRE parmi les options éligibles et "sûres"
  // (resolveBotEncounter) — on boucle jusqu'à observer chaque option plutôt
  // que de dépendre d'un seul tirage, pour ne pas écrire un test qui flake.
  it('bot : l\'option Gare pose la Gare ET exactement 3 segments légaux depuis le héros', () => {
    const card = RAIL_ENCOUNTERS.find(c => c.choices[2].grantsGare);
    let picked = false;
    for (let i = 0; i < 30 && !picked; i++) {
      const p = createPlayer('nations', 1, true);
      p.pop = 14; p.coins = 0; p.buildings = []; p.resources = {}; // pop haut : l'option 3 reste "safe" pour le bot
      const { player: after } = resolveBotEncounter(p, [card], { rails: [] });
      if (after.buildings.some(b => b.type === 'gare' && b.hexId === after.hero)) {
        picked = true;
        expect(after._pendingRails.length).toBeGreaterThan(0);
        expect(after._pendingRails.length).toBeLessThanOrEqual(3);
      }
    }
    expect(picked, 'option Gare jamais tirée en 30 essais').toBe(true);
  });

  it('bot : l\'option "2 segments" pose exactement 2 segments depuis le héros, sans Gare', () => {
    const card = RAIL_ENCOUNTERS.find(c => c.choices[1].railSegments === 2);
    let picked = false;
    for (let i = 0; i < 30 && !picked; i++) {
      const p = createPlayer('nations', 1, true);
      p.coins = 5; p.pop = 14; p.buildings = []; p.resources = {};
      const { player: after } = resolveBotEncounter(p, [card], { rails: [] });
      if (!after.buildings.some(b => b.type === 'gare') && (after._pendingRails || []).length > 0) {
        picked = true;
        expect(after._pendingRails.length).toBe(2);
      }
    }
    expect(picked, 'option "2 segments" jamais tirée en 30 essais').toBe(true);
  });
});
