// Textures de terrain seamless (vue de dessus) — remplissent chaque hexagone via
// un <pattern> SVG en userSpaceOnUse : les hexes d'un même terrain se raccordent
// sans couture, et le rendu suit les cartes procédurales (composition par hex).
// Générées procéduralement (bruit fractal raster) dans la palette de chaque
// terrain ; remplaçables par de vraies photos/textures en gardant les mêmes noms.
import montagne from './montagne.webp';
import sierra from './sierra.webp';
import champs from './champs.webp';
import plaine from './plaine.webp';
import village from './village.webp';
import foret from './foret.webp';
import toundra from './toundra.webp';
import desert from './desert.webp';
import lac from './lac.webp';
import marecage from './marecage.webp';
import factory from './factory.webp';

export const TERRAIN_TEXTURES = {
  montagne, sierra, champs, plaine, village, foret, toundra, desert, lac, marecage, factory,
};

// Taille d'affichage d'une tuile en unités du viewBox de la carte (un hex ≈ 128u,
// donc la texture se répète ~1,3× par hex — détail lisible sans être trop zoomé).
export const TERRAIN_TILE = 100;
