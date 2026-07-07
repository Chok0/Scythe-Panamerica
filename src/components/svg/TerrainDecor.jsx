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

  // Forest — cluster of pines with trunks, darker at the back
  if (hex.t === "foret") {
    const trees = [];
    const spots = [[-24, 8], [-8, -8], [10, 12], [24, -2], [2, 24], [-18, 26]];
    spots.forEach(([dx, dy], i) => {
      const s = 11 + rng() * 5;
      trees.push(<Pine key={i} x={cx + dx + rng() * 4} y={cy + dy} s={s} dark="#1e3a16" light="#33582a" />);
    });
    return <g style={{ pointerEvents: "none" }}>{trees}</g>;
  }
  // Mountain — grey peaks with snow caps
  if (hex.t === "montagne") {
    return (<g style={{ pointerEvents: "none" }}>
      <Peak x={cx - 14} y={cy + 8} s={17} base="#565650" lit="#b8b8ac" snow />
      <Peak x={cx + 13} y={cy + 12} s={13} base="#62625a" lit="#c4c4b6" snow />
      <Peak x={cx + 2} y={cy - 12} s={11} base="#4e4e46" lit="#a8a89a" snow={false} />
    </g>);
  }
  // Sierra — warm rocky ridges, no snow
  if (hex.t === "sierra") {
    return (<g style={{ pointerEvents: "none" }}>
      <Peak x={cx - 13} y={cy + 6} s={15} base="#6b5232" lit="#c9a870" snow={false} />
      <Peak x={cx + 12} y={cy + 12} s={12} base="#75593a" lit="#d4b47c" snow={false} />
      <path d={`M${cx - 28} ${cy + 22} Q${cx} ${cy + 14} ${cx + 28} ${cy + 22}`} fill="none" stroke="#5e4a2e" strokeWidth="1.4" opacity={0.5} />
    </g>);
  }
  // Village — clustered roofed houses
  if (hex.t === "village") {
    return (<g style={{ pointerEvents: "none" }}>
      <House x={cx - 14} y={cy + 4} s={13} wall="#d9b48a" roof="#7d3f24" />
      <House x={cx + 12} y={cy + 12} s={11} wall="#cfa87e" roof="#6b3520" />
      <House x={cx + 4} y={cy - 12} s={10} wall="#e0bd94" roof="#8a4a2a" />
      <path d={`M${cx - 26} ${cy + 26} Q${cx} ${cy + 18} ${cx + 26} ${cy + 26}`} fill="none" stroke="#6b4228" strokeWidth="1.6" opacity={0.4} />
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
  // Fields — curved furrow rows + haystack
  if (hex.t === "champs") {
    return (<g style={{ pointerEvents: "none" }}>
      {[0, 1, 2, 3, 4].map(i => <path key={i} d={`M${cx - 26} ${cy - 14 + i * 8} Q${cx} ${cy - 18 + i * 8} ${cx + 26} ${cy - 14 + i * 8}`} fill="none" stroke="#8a7025" strokeWidth="1.2" opacity={0.5} />)}
      <ellipse cx={cx + 16} cy={cy - 16} rx={6} ry={4.4} fill="#d9bc62" stroke="#8a7025" strokeWidth="0.8" />
    </g>);
  }
  // Plains — grass tufts
  if (hex.t === "plaine") {
    const tufts = [];
    [[-18, 2], [0, -10], [16, 6], [-6, 18], [20, -14], [-24, -12]].forEach(([dx, dy], i) => {
      tufts.push(<path key={i} d={`M${cx + dx - 3} ${cy + dy}q1.5 -5 3 0m0 0q1.5 -5 3 0`} fill="none" stroke="#6b6828" strokeWidth="1.2" opacity={0.6} />);
    });
    return <g style={{ pointerEvents: "none" }}>{tufts}</g>;
  }
  // Tundra — snow patches + sparse dead trees
  if (hex.t === "toundra") {
    return (<g style={{ pointerEvents: "none" }}>
      <ellipse cx={cx - 10} cy={cy + 8} rx={12} ry={4.4} fill="#dde4ea" opacity={0.4} />
      <ellipse cx={cx + 14} cy={cy - 6} rx={8} ry={3} fill="#dde4ea" opacity={0.35} />
      <line x1={cx - 16} y1={cy - 4} x2={cx - 16} y2={cy - 16} stroke="#3e4a56" strokeWidth="1.3" />
      <line x1={cx - 16} y1={cy - 12} x2={cx - 20} y2={cy - 15} stroke="#3e4a56" strokeWidth="1" />
      <line x1={cx - 16} y1={cy - 9} x2={cx - 12} y2={cy - 13} stroke="#3e4a56" strokeWidth="1" />
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
