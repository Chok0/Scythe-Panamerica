import React from 'react';
import { seededRand } from '../../logic/hexMath.js';

// DA Doc: Cartographic military patterns — stronger, readable at distance
// Each terrain has a unique texture identifiable even for colorblind players
export const TerrainDecor = React.memo(({ hex }) => {
  const rng = seededRand(hex.id * 137 + hex.rx);
  const cx = hex.rx, cy = hex.ry;

  // Forest: dense diagonal hachures (woodland convention on topo maps)
  if (hex.t === "foret") {
    const lines = [];
    for (let i = 0; i < 7; i++) {
      const dx = cx - 22 + i * 7;
      lines.push(<line key={`fl${i}`} x1={dx} y1={cy - 20} x2={dx + 8} y2={cy + 20} stroke="#1A4A1A" strokeWidth="0.7" opacity={0.35} />);
    }
    // Scattered tree dots
    for (let i = 0; i < 4; i++) {
      const dx = cx - 16 + rng() * 32, dy = cy - 12 + rng() * 24;
      lines.push(<circle key={`fd${i}`} cx={dx} cy={dy} r={2.5 + rng() * 1.5} fill="#1A4A1A" opacity={0.3} />);
    }
    return <g style={{ pointerEvents: "none" }}>{lines}</g>;
  }
  // Mountain / Sierra: inverted V hatchures (topographic relief) — bigger, more visible
  if (hex.t === "montagne" || hex.t === "sierra") {
    const isS = hex.t === "sierra";
    const color = isS ? "#4A3C28" : "#3A3A3A";
    const lines = [];
    for (let i = 0; i < 4; i++) {
      const px = cx - 18 + rng() * 36, py = cy - 10 + rng() * 20, sz = 8 + rng() * 6;
      lines.push(<path key={i} d={`M${px - sz * 0.6},${py + sz * 0.3}L${px},${py - sz * 0.4}L${px + sz * 0.6},${py + sz * 0.3}`}
        fill="none" stroke={color} strokeWidth="0.8" opacity={0.4} />);
    }
    return <g style={{ pointerEvents: "none" }}>{lines}</g>;
  }
  // Village: small rectangles (built-up area convention) — more, darker
  if (hex.t === "village") {
    const rects = [];
    for (let i = 0; i < 5; i++) {
      const rx = cx - 16 + rng() * 32, ry = cy - 10 + rng() * 20;
      rects.push(<rect key={i} x={rx} y={ry} width={3.5 + rng() * 2.5} height={4.5 + rng() * 2.5} fill="#5A3A2A" opacity={0.3} rx="0.3" />);
    }
    return <g style={{ pointerEvents: "none" }}>{rects}</g>;
  }
  // Lake: wavy horizontal lines (hydrographic convention) — stronger
  if (hex.t === "lac") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.3}>
      {[0, 1, 2, 3].map(i => <path key={i} d={`M${cx - 20} ${cy - 12 + i * 7}Q${cx - 6} ${cy - 16 + i * 7} ${cx} ${cy - 12 + i * 7}Q${cx + 6} ${cy - 8 + i * 7} ${cx + 20} ${cy - 12 + i * 7}`}
        fill="none" stroke="#2A6A8A" strokeWidth="0.7" />)}
    </g>);
  }
  // Swamp: wavy lines + cattail dots (marshland convention) — stronger
  if (hex.t === "marecage") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.3}>
      <path d={`M${cx - 18} ${cy - 4}Q${cx - 6} ${cy - 8} ${cx} ${cy - 4}Q${cx + 6} ${cy} ${cx + 18} ${cy - 4}`} fill="none" stroke="#3A7A3A" strokeWidth="0.7" />
      <path d={`M${cx - 16} ${cy + 5}Q${cx - 4} ${cy + 1} ${cx + 2} ${cy + 5}Q${cx + 8} ${cy + 9} ${cx + 16} ${cy + 5}`} fill="none" stroke="#3A7A3A" strokeWidth="0.7" />
      <circle cx={cx - 7} cy={cy + 1} r="1.2" fill="#3A7A3A" />
      <circle cx={cx + 9} cy={cy - 5} r="1.2" fill="#3A7A3A" />
      <circle cx={cx + 2} cy={cy + 8} r="1" fill="#3A7A3A" />
      {/* Cattail vertical strokes */}
      <line x1={cx - 12} y1={cy - 6} x2={cx - 12} y2={cy + 2} stroke="#3A6A3A" strokeWidth="0.5" />
      <line x1={cx + 6} y1={cy - 8} x2={cx + 6} y2={cy} stroke="#3A6A3A" strokeWidth="0.5" />
    </g>);
  }
  // Desert: scattered stippling dots (sandy terrain) — more dots
  if (hex.t === "desert") {
    const dots = [];
    for (let i = 0; i < 12; i++) {
      dots.push(<circle key={i} cx={cx - 20 + rng() * 40} cy={cy - 16 + rng() * 32} r={0.7 + rng() * 0.3} fill="#6B4B25" opacity={0.35} />);
    }
    return <g style={{ pointerEvents: "none" }}>{dots}</g>;
  }
  // Fields (champs): tight horizontal lines (cultivated land) — stronger
  if (hex.t === "champs") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.2}>
      {[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1={cx - 20} y1={cy - 14 + i * 5.5} x2={cx + 20} y2={cy - 14 + i * 5.5} stroke="#6A5A20" strokeWidth="0.6" />)}
    </g>);
  }
  // Plains: wider horizontal lines (flat terrain)
  if (hex.t === "plaine") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.18}>
      {[0, 1, 2, 3].map(i => <line key={i} x1={cx - 20} y1={cy - 10 + i * 8} x2={cx + 20} y2={cy - 10 + i * 8} stroke="#5A4B2A" strokeWidth="0.5" />)}
    </g>);
  }
  // Tundra: crossed hatching (difficult terrain convention) — stronger
  if (hex.t === "toundra") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.18}>
      <line x1={cx - 18} y1={cy - 18} x2={cx + 18} y2={cy + 18} stroke="#3A5A6A" strokeWidth="0.5" />
      <line x1={cx + 18} y1={cy - 18} x2={cx - 18} y2={cy + 18} stroke="#3A5A6A" strokeWidth="0.5" />
      <line x1={cx - 10} y1={cy - 20} x2={cx + 26} y2={cy + 16} stroke="#3A5A6A" strokeWidth="0.5" />
      <line x1={cx + 10} y1={cy - 20} x2={cx - 26} y2={cy + 16} stroke="#3A5A6A" strokeWidth="0.5" />
      {/* Snow dots */}
      <circle cx={cx - 5} cy={cy - 4} r="0.8" fill="rgba(255,255,255,0.12)" />
      <circle cx={cx + 8} cy={cy + 6} r="0.8" fill="rgba(255,255,255,0.12)" />
    </g>);
  }
  // Factory (Rouge River): central gear + radial hatching, slow rotation
  if (hex.t === "factory") {
    return (<g style={{ pointerEvents: "none" }}>
      <g transform={`translate(${cx},${cy})`} opacity={0.25}>
        <circle r="12" fill="none" stroke="#9A2A2A" strokeWidth="1.2" strokeDasharray="3 2">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="30s" repeatCount="indefinite" />
        </circle>
        <circle r="5" fill="none" stroke="#9A2A2A" strokeWidth="1">
          <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="18s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>);
  }
  return null;
});
