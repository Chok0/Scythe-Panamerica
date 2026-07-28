import { describe, it, expect } from 'vitest';
import { ENCOUNTERS } from '../../data/encounters.js';
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
});
