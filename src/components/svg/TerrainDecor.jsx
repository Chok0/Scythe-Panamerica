import React from 'react';
import { seededRand } from '../../logic/hexMath.js';

// DA Doc: Cartographic military patterns — fine strokes, no illustrations
export const TerrainDecor = React.memo(({ hex }) => {
  const rng = seededRand(hex.id * 137 + hex.rx);
  const cx = hex.rx, cy = hex.ry;

  // Forest: small filled circles (woodland convention)
  if (hex.t === "foret") {
    const dots = [];
    for (let i = 0; i < 5; i++) {
      const dx = cx - 18 + rng() * 36, dy = cy - 14 + rng() * 28;
      dots.push(<circle key={i} cx={dx} cy={dy} r={2 + rng() * 1.5} fill="#1A3A1A" opacity={0.3 + rng() * 0.15} />);
    }
    return <g style={{ pointerEvents: "none" }}>{dots}</g>;
  }
  // Mountain / Sierra: inverted V hatchures (topographic relief)
  if (hex.t === "montagne" || hex.t === "sierra") {
    const isS = hex.t === "sierra";
    const color = isS ? "#4A3C28" : "#3A3A3A";
    const lines = [];
    for (let i = 0; i < 3; i++) {
      const px = cx - 16 + rng() * 32, py = cy - 8 + rng() * 16, sz = 6 + rng() * 5;
      lines.push(<path key={i} d={`M${px - sz * 0.6},${py + sz * 0.3}L${px},${py - sz * 0.4}L${px + sz * 0.6},${py + sz * 0.3}`}
        fill="none" stroke={color} strokeWidth="0.6" opacity={0.35} />);
    }
    return <g style={{ pointerEvents: "none" }}>{lines}</g>;
  }
  // Village: small rectangles (built-up area convention)
  if (hex.t === "village") {
    const rects = [];
    for (let i = 0; i < 3; i++) {
      const rx = cx - 14 + rng() * 28, ry = cy - 8 + rng() * 16;
      rects.push(<rect key={i} x={rx} y={ry} width={3 + rng() * 2} height={4 + rng() * 2} fill="#5A3A2A" opacity={0.25} rx="0.3" />);
    }
    return <g style={{ pointerEvents: "none" }}>{rects}</g>;
  }
  // Lake: wavy horizontal lines (hydrographic convention)
  if (hex.t === "lac") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.2}>
      {[0, 1, 2].map(i => <path key={i} d={`M${cx - 18} ${cy - 8 + i * 8}Q${cx - 6} ${cy - 12 + i * 8} ${cx} ${cy - 8 + i * 8}Q${cx + 6} ${cy - 4 + i * 8} ${cx + 18} ${cy - 8 + i * 8}`}
        fill="none" stroke="#2A5A7A" strokeWidth="0.5" />)}
    </g>);
  }
  // Swamp: wavy lines + dots (marshland convention)
  if (hex.t === "marecage") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.2}>
      <path d={`M${cx - 16} ${cy - 2}Q${cx - 6} ${cy - 6} ${cx} ${cy - 2}Q${cx + 6} ${cy + 2} ${cx + 16} ${cy - 2}`} fill="none" stroke="#3A6A3A" strokeWidth="0.5" />
      <path d={`M${cx - 14} ${cy + 6}Q${cx - 4} ${cy + 2} ${cx + 2} ${cy + 6}Q${cx + 8} ${cy + 10} ${cx + 14} ${cy + 6}`} fill="none" stroke="#3A6A3A" strokeWidth="0.5" />
      <circle cx={cx - 6} cy={cy + 2} r="1" fill="#3A6A3A" /><circle cx={cx + 8} cy={cy - 4} r="1" fill="#3A6A3A" />
    </g>);
  }
  // Desert: scattered dots (sandy terrain convention)
  if (hex.t === "desert") {
    const dots = [];
    for (let i = 0; i < 8; i++) {
      dots.push(<circle key={i} cx={cx - 18 + rng() * 36} cy={cy - 14 + rng() * 28} r={0.6} fill="#6B4B25" opacity={0.3} />);
    }
    return <g style={{ pointerEvents: "none" }}>{dots}</g>;
  }
  // Fields (champs): tight horizontal lines (cultivated land)
  if (hex.t === "champs") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.15}>
      {[0, 1, 2, 3, 4].map(i => <line key={i} x1={cx - 18} y1={cy - 12 + i * 6} x2={cx + 18} y2={cy - 12 + i * 6} stroke="#6A5A20" strokeWidth="0.5" />)}
    </g>);
  }
  // Plains: wider horizontal lines (flat terrain)
  if (hex.t === "plaine") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.12}>
      {[0, 1, 2].map(i => <line key={i} x1={cx - 18} y1={cy - 8 + i * 10} x2={cx + 18} y2={cy - 8 + i * 10} stroke="#5A4B2A" strokeWidth="0.4" />)}
    </g>);
  }
  // Tundra: crossed hatching (difficult terrain convention)
  if (hex.t === "toundra") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.1}>
      <line x1={cx - 16} y1={cy - 16} x2={cx + 16} y2={cy + 16} stroke="#3A4A5A" strokeWidth="0.4" />
      <line x1={cx + 16} y1={cy - 16} x2={cx - 16} y2={cy + 16} stroke="#3A4A5A" strokeWidth="0.4" />
      <line x1={cx - 8} y1={cy - 18} x2={cx + 24} y2={cy + 14} stroke="#3A4A5A" strokeWidth="0.4" />
      <line x1={cx + 8} y1={cy - 18} x2={cx - 24} y2={cy + 14} stroke="#3A4A5A" strokeWidth="0.4" />
    </g>);
  }
  // Factory (Rouge River): central gear + radial hatching, slow rotation
  if (hex.t === "factory") {
    return (<g style={{ pointerEvents: "none" }}>
      <g transform={`translate(${cx},${cy})`} opacity={0.2}>
        <circle r="10" fill="none" stroke="#8A2A2A" strokeWidth="1" strokeDasharray="3 2">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="30s" repeatCount="indefinite" />
        </circle>
        <circle r="4" fill="none" stroke="#8A2A2A" strokeWidth="0.8">
          <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="18s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>);
  }
  return null;
});
