import React from 'react';
import { seededRand } from '../../logic/hexMath.js';

// DA: painted-board decorations — each terrain gets miniature "illustrated"
// props (pines with trunks, lit mountain peaks, roofed houses, furrows…)
// like the original Scythe board, kept cheap: plain SVG shapes, no filters.

const Pine = ({ x, y, s, dark, light }) => (
  <g>
    <rect x={x - s * 0.08} y={y + s * 0.55} width={s * 0.16} height={s * 0.35} fill="#4a3520" />
    <polygon points={`${x},${y - s * 0.55} ${x - s * 0.42},${y + s * 0.25} ${x + s * 0.42},${y + s * 0.25}`} fill={dark} />
    <polygon points={`${x},${y - s * 0.55} ${x - s * 0.28},${y} ${x + s * 0.28},${y}`} fill={light} />
    <polygon points={`${x},${y - s * 0.1} ${x - s * 0.42},${y + s * 0.6} ${x + s * 0.42},${y + s * 0.6}`} fill={dark} />
  </g>
);

const Peak = ({ x, y, s, base, lit, snow }) => (
  <g>
    <polygon points={`${x - s},${y + s * 0.55} ${x},${y - s * 0.75} ${x + s},${y + s * 0.55}`} fill={base} />
    <polygon points={`${x},${y - s * 0.75} ${x + s},${y + s * 0.55} ${x + s * 0.25},${y + s * 0.55}`} fill={lit} opacity={0.5} />
    {snow && <polygon points={`${x},${y - s * 0.75} ${x - s * 0.28},${y - s * 0.32} ${x - s * 0.1},${y - s * 0.38} ${x + s * 0.05},${y - s * 0.28} ${x + s * 0.28},${y - s * 0.32}`} fill="#e8e8e2" opacity={0.85} />}
  </g>
);

const House = ({ x, y, s, wall, roof }) => (
  <g>
    <rect x={x - s * 0.5} y={y - s * 0.15} width={s} height={s * 0.62} fill={wall} />
    <polygon points={`${x - s * 0.6},${y - s * 0.12} ${x},${y - s * 0.62} ${x + s * 0.6},${y - s * 0.12}`} fill={roof} />
    <rect x={x - s * 0.12} y={y + s * 0.12} width={s * 0.24} height={s * 0.35} fill={roof} opacity={0.7} />
  </g>
);

export const TerrainDecor = React.memo(({ hex }) => {
  const rng = seededRand(hex.id * 137 + hex.rx);
  const cx = hex.rx, cy = hex.ry;

  // Forest — dense pine stand, painted in depth layers (arrière sombre → avant clair)
  if (hex.t === "foret") {
    const trees = [];
    // rangée arrière (petits, sombres) → rangée avant (grands, clairs)
    const back = [[-30, -6], [-14, -12], [2, -14], [18, -12], [30, -4]];
    const mid = [[-26, 8], [-10, 4], [8, 6], [24, 8], [34, 16]];
    const front = [[-20, 24], [-2, 28], [16, 24], [30, 30], [-32, 20]];
    back.forEach(([dx, dy], i) => trees.push(<Pine key={"b" + i} x={cx + dx + rng() * 3} y={cy + dy} s={10 + rng() * 3} dark="#16300f" light="#26471d" />));
    mid.forEach(([dx, dy], i) => trees.push(<Pine key={"m" + i} x={cx + dx + rng() * 3} y={cy + dy} s={12 + rng() * 4} dark="#1e3a16" light="#356028" />));
    front.forEach(([dx, dy], i) => trees.push(<Pine key={"f" + i} x={cx + dx + rng() * 3} y={cy + dy} s={14 + rng() * 5} dark="#264a1c" light="#427a34" />));
    return <g style={{ pointerEvents: "none" }}>{trees}</g>;
  }
  // Mountain — chaîne de pics gris avec neige, crête d'arrière-plan
  if (hex.t === "montagne") {
    return (<g style={{ pointerEvents: "none" }}>
      {/* crête arrière (silhouette douce) */}
      <path d={`M${cx - 38} ${cy + 6} L${cx - 20} ${cy - 14} L${cx - 4} ${cy + 2} L${cx + 12} ${cy - 18} L${cx + 30} ${cy - 2} L${cx + 40} ${cy + 8} Z`} fill="#3e3e38" opacity={0.55} />
      <Peak x={cx - 20} y={cy + 12} s={20} base="#565650" lit="#b8b8ac" snow />
      <Peak x={cx + 16} y={cy + 16} s={16} base="#62625a" lit="#c4c4b6" snow />
      <Peak x={cx + 2} y={cy - 8} s={14} base="#4e4e46" lit="#a8a89a" snow />
      <Peak x={cx - 34} y={cy + 20} s={11} base="#52524a" lit="#aeaea2" snow={false} />
    </g>);
  }
  // Sierra — crêtes rocheuses chaudes, sans neige, chaîne étagée
  if (hex.t === "sierra") {
    return (<g style={{ pointerEvents: "none" }}>
      <path d={`M${cx - 38} ${cy + 8} L${cx - 18} ${cy - 10} L${cx} ${cy + 4} L${cx + 18} ${cy - 14} L${cx + 38} ${cy + 8} Z`} fill="#5e4a2e" opacity={0.5} />
      <Peak x={cx - 18} y={cy + 10} s={18} base="#6b5232" lit="#c9a870" snow={false} />
      <Peak x={cx + 15} y={cy + 15} s={15} base="#75593a" lit="#d4b47c" snow={false} />
      <Peak x={cx + 2} y={cy - 6} s={12} base="#5e4a2e" lit="#b89050" snow={false} />
      <path d={`M${cx - 34} ${cy + 26} Q${cx} ${cy + 16} ${cx + 34} ${cy + 26}`} fill="none" stroke="#5e4a2e" strokeWidth="1.6" opacity={0.5} />
    </g>);
  }
  // Village — hameau plus dense, chemin serpentant
  if (hex.t === "village") {
    return (<g style={{ pointerEvents: "none" }}>
      <path d={`M${cx - 34} ${cy + 30} Q${cx - 10} ${cy + 10} ${cx + 8} ${cy + 20} T${cx + 34} ${cy + 6}`} fill="none" stroke="#8a6038" strokeWidth="2.4" opacity={0.35} />
      <House x={cx - 20} y={cy + 6} s={14} wall="#d9b48a" roof="#7d3f24" />
      <House x={cx + 14} y={cy + 14} s={12} wall="#cfa87e" roof="#6b3520" />
      <House x={cx + 2} y={cy - 12} s={11} wall="#e0bd94" roof="#8a4a2a" />
      <House x={cx - 6} y={cy + 22} s={10} wall="#d4ac80" roof="#733a20" />
      <House x={cx + 26} y={cy - 4} s={9} wall="#e4c298" roof="#8f4e2c" />
    </g>);
  }
  // Lake — waves + light reflection
  if (hex.t === "lac") {
    return (<g style={{ pointerEvents: "none" }}>
      <ellipse cx={cx - 8} cy={cy - 10} rx={16} ry={5} fill="#8fc0dd" opacity={0.25} />
      {[0, 1, 2].map(i => <path key={i} d={`M${cx - 20} ${cy - 2 + i * 9}q6 -3.5 12 0t12 0`} fill="none" stroke="#bcdcee" strokeWidth="1.3" opacity={0.4} />)}
    </g>);
  }
  // Swamp — reeds and murky pools
  if (hex.t === "marecage") {
    const reeds = [];
    [[-16, 4], [8, -6], [18, 12], [-4, 18]].forEach(([dx, dy], i) => {
      reeds.push(<g key={i}>
        <line x1={cx + dx} y1={cy + dy} x2={cx + dx} y2={cy + dy - 12} stroke="#2e4a28" strokeWidth="1.4" />
        <line x1={cx + dx + 4} y1={cy + dy} x2={cx + dx + 5} y2={cy + dy - 9} stroke="#2e4a28" strokeWidth="1.2" />
        <ellipse cx={cx + dx + 1} cy={cy + dy - 13} rx={1.4} ry={3.4} fill="#4a3520" />
      </g>);
    });
    return (<g style={{ pointerEvents: "none" }}>
      <ellipse cx={cx + 2} cy={cy + 8} rx={18} ry={6} fill="#3a6a5a" opacity={0.35} />
      <ellipse cx={cx - 12} cy={cy - 8} rx={10} ry={4} fill="#3a6a5a" opacity={0.3} />
      {reeds}
    </g>);
  }
  // Desert — dunes + cactus-ish stroke
  if (hex.t === "desert") {
    return (<g style={{ pointerEvents: "none" }}>
      <path d={`M${cx - 26} ${cy + 10} Q${cx - 8} ${cy - 2} ${cx + 10} ${cy + 8} T${cx + 30} ${cy + 6}`} fill="none" stroke="#8a6b38" strokeWidth="1.6" opacity={0.55} />
      <path d={`M${cx - 18} ${cy + 20} Q${cx + 2} ${cy + 12} ${cx + 22} ${cy + 20}`} fill="none" stroke="#8a6b38" strokeWidth="1.3" opacity={0.4} />
      <ellipse cx={cx + 14} cy={cy - 12} rx={7} ry={2.4} fill="#e8d090" opacity={0.5} />
      <ellipse cx={cx - 14} cy={cy - 4} rx={5} ry={1.8} fill="#e8d090" opacity={0.4} />
    </g>);
  }
  // Fields — sillons courbes denses + 2 meules + parcelles
  if (hex.t === "champs") {
    return (<g style={{ pointerEvents: "none" }}>
      {[0, 1, 2, 3, 4, 5, 6].map(i => <path key={i} d={`M${cx - 34} ${cy - 20 + i * 7} Q${cx} ${cy - 24 + i * 7} ${cx + 34} ${cy - 20 + i * 7}`} fill="none" stroke="#8a7025" strokeWidth="1.3" opacity={0.5} />)}
      <ellipse cx={cx + 18} cy={cy - 18} rx={6.5} ry={4.8} fill="#d9bc62" stroke="#8a7025" strokeWidth="0.9" />
      <ellipse cx={cx - 20} cy={cy + 18} rx={5} ry={3.6} fill="#cdb058" stroke="#8a7025" strokeWidth="0.8" />
    </g>);
  }
  // Plains — herbes touffues + quelques buissons
  if (hex.t === "plaine") {
    const tufts = [];
    [[-26, 2], [-12, -12], [2, -6], [16, 8], [28, -8], [-6, 18], [22, 20], [-22, 22], [10, -18], [-30, -14]].forEach(([dx, dy], i) => {
      tufts.push(<path key={i} d={`M${cx + dx - 3} ${cy + dy}q1.5 -5 3 0m0 0q1.5 -5 3 0`} fill="none" stroke="#6b6828" strokeWidth="1.3" opacity={0.6} />);
    });
    tufts.push(<ellipse key="bush1" cx={cx - 14} cy={cy + 6} rx={5} ry={3.5} fill="#5a7030" opacity={0.5} />);
    tufts.push(<ellipse key="bush2" cx={cx + 18} cy={cy - 2} rx={4} ry={3} fill="#657a38" opacity={0.45} />);
    return <g style={{ pointerEvents: "none" }}>{tufts}</g>;
  }
  // Tundra — plaques de neige + rochers + arbres morts épars
  if (hex.t === "toundra") {
    return (<g style={{ pointerEvents: "none" }}>
      <ellipse cx={cx - 12} cy={cy + 10} rx={16} ry={5.4} fill="#dde4ea" opacity={0.42} />
      <ellipse cx={cx + 16} cy={cy - 4} rx={11} ry={4} fill="#dde4ea" opacity={0.36} />
      <ellipse cx={cx + 6} cy={cy + 22} rx={9} ry={3.4} fill="#dde4ea" opacity={0.3} />
      <ellipse cx={cx + 20} cy={cy + 14} rx={4} ry={2.6} fill="#8b8f96" opacity={0.5} />
      <ellipse cx={cx - 24} cy={cy - 8} rx={3.4} ry={2.2} fill="#7e838a" opacity={0.5} />
      <g stroke="#3e4a56" strokeWidth="1.3">
        <line x1={cx - 16} y1={cy - 4} x2={cx - 16} y2={cy - 18} />
        <line x1={cx - 16} y1={cy - 14} x2={cx - 21} y2={cy - 18} strokeWidth="1" />
        <line x1={cx - 16} y1={cy - 10} x2={cx - 11} y2={cy - 15} strokeWidth="1" />
      </g>
    </g>);
  }
  // Factory (Rouge River) — dark industrial building with chimneys + gear
  if (hex.t === "factory") {
    return (<g style={{ pointerEvents: "none" }}>
      <rect x={cx - 16} y={cy - 2} width={32} height={16} fill="#2e1410" stroke="#1a0a08" strokeWidth="1" />
      <polygon points={`${cx - 16},${cy - 2} ${cx - 8},${cy - 10} ${cx},${cy - 2} ${cx + 8},${cy - 10} ${cx + 16},${cy - 2}`} fill="#421c14" />
      <rect x={cx - 11} y={cy - 18} width={4} height={16} fill="#2e1410" />
      <rect x={cx + 6} y={cy - 22} width={4} height={20} fill="#2e1410" />
      <circle cx={cx - 9} cy={cy - 20} r={2.4} fill="#8a8078" opacity={0.5} />
      <circle cx={cx + 8} cy={cy - 25} r={2.8} fill="#8a8078" opacity={0.45} />
      <g transform={`translate(${cx},${cy + 6})`} opacity={0.6}>
        <circle r="4.5" fill="none" stroke="#c9843a" strokeWidth="1.4" strokeDasharray="2.2 1.6">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="24s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>);
  }
  return null;
});
