import confederationLogo from './confederation-logo.webp';
import frenteLogo from './frente-logo.webp';
import nationsLogo from './nations-logo.webp';
import acadianeLogo from './acadiane-logo.webp';
import bayouLogo from './bayou-logo.webp';
import dominionLogo from './dominion-logo.webp';

import confederationArt from './confederation-art.webp';
import frenteArt from './frente-art.webp';
import nationsArt from './nations-art.webp';
import acadianeArt from './acadiane-art.webp';
import bayouArt from './bayou-art.webp';
import dominionArt from './dominion-art.webp';

// Blasons (§6 priorité C) — remplacent la dépendance à la couleur de titre
// pour l'identité de faction sur l'écran de sélection.
export const FACTION_LOGOS = {
  confederation: confederationLogo,
  frente: frenteLogo,
  nations: nationsLogo,
  acadiane: acadianeLogo,
  bayou: bayouLogo,
  dominion: dominionLogo,
};

// Illustrations en amorce — utilisées dans le panneau d'aperçu de faction.
export const FACTION_ART = {
  confederation: confederationArt,
  frente: frenteArt,
  nations: nationsArt,
  acadiane: acadianeArt,
  bayou: bayouArt,
  dominion: dominionArt,
};
