import React from 'react';
import { TERRAINS } from '../../data/terrains.js';
import { hPts, HS } from '../../logic/hexMath.js';
import { TerrainDecor } from './TerrainDecor.jsx';

// DA Doc: Hex rendering — cartographic military style
// Stroke 0.5px, no rounded corners, flat (no drop-shadows on game elements)
const RES_ICONS = { metal: "⚙", bois: "🪵", nourriture: "🌽", petrole: "🛢", ouvriers: "👷" };

export const HexTerrain = React.memo(({ hex, isV, isSel, isHov, isFactory }) => {
  const t = TERRAINS[hex.t];
  const isWater = hex.t === "lac" || hex.t === "marecage";
  return (
    <g>
      {/* Base fill with gradient — desaturated */}
      <g filter="url(#desat)">
        <polygon points={hPts(hex.rx, hex.ry)}
          fill={`url(#tg-${hex.t})`}
          stroke={isV ? "#4A8A4A" : isSel ? "#C9A84C" : isHov ? t.stroke : "#2A2518"}
          strokeWidth={isV ? 1.5 : isSel ? 2 : isHov ? 1 : 0.5}
          opacity={isWater ? 0.7 : 0.9}
        />
        {/* Texture pattern overlay */}
        <polygon points={hPts(hex.rx, hex.ry)} fill={`url(#tp-${hex.t})`} opacity={isWater ? 0.4 : 0.6} style={{ pointerEvents: "none" }} />
      </g>
      {/* Terrain decorations */}
      <TerrainDecor hex={hex} />
      {/* Resource icon — centered, subtle */}
      {t.res && <text x={hex.rx} y={hex.ry + 2} textAnchor="middle" fontSize={18} opacity={0.18} style={{ pointerEvents: "none" }}>{RES_ICONS[t.res] || ""}</text>}
      {/* Factory special: subtle pulsing ring */}
      {isFactory && <>
        <polygon points={hPts(hex.rx, hex.ry, HS + 4)} fill="none" stroke="#8A2A2A" strokeWidth={0.6} opacity={0.2} strokeDasharray="5 3">
          <animateTransform attributeName="transform" type="rotate" from={`0 ${hex.rx} ${hex.ry}`} to={`360 ${hex.rx} ${hex.ry}`} dur="60s" repeatCount="indefinite" />
        </polygon>
        <polygon points={hPts(hex.rx, hex.ry)} fill="none" stroke="#5A1A1A" strokeWidth={1} opacity={0.1}>
          <animate attributeName="opacity" values="0.05;0.15;0.05" dur="3s" repeatCount="indefinite" />
        </polygon>
      </>}
      {/* Valid move overlay — green translucent per DA doc */}
      {isV && <>
        <polygon points={hPts(hex.rx, hex.ry)} fill="rgba(74,138,74,0.15)" stroke="#4A8A4A" strokeWidth={1} opacity={0.8}>
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.4s" repeatCount="indefinite" />
        </polygon>
      </>}
    </g>
  );
});

// DA Doc: Unit tokens — simple military silhouettes
// Hero = 5-pointed star, Mech = hexagon, Worker = filled circle, Building = square
export const UnitToken = React.memo(({ type, cx, cy, color, label, icon, factionId }) => {
  if (type === "hero") {
    // 5-pointed star — DA doc: filled, color faction, 10-12px
    const r = 11, ri = 5;
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? r : ri;
      return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
    }).join(" ");
    return (<g>
      <polygon points={pts} fill={color} stroke="rgba(255,255,240,0.6)" strokeWidth={1.2} opacity={0.9} />
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="7" fill={color} fontWeight="700" style={{ fontFamily: "'Bitter',serif" }}>{label}</text>
    </g>);
  }
  if (type === "mech") {
    // Hexagon — DA doc: stroke faction color, semi-transparent fill, 10-12px
    const r = 11;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");
    return (<g>
      <polygon points={pts} fill={color + "44"} stroke={color} strokeWidth={1.5} opacity={0.9} />
    </g>);
  }
  if (type === "building") {
    // Square — DA doc: 10px, color faction
    const bt = icon || "■";
    return (<g>
      <rect x={cx - 7} y={cy - 7} width={14} height={14} rx={1} fill={color + "44"} stroke={color} strokeWidth={1} opacity={0.9} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9}>{bt}</text>
    </g>);
  }
  // Worker — filled circle, DA doc: 6-8px
  return (<g>
    <circle cx={cx} cy={cy} r={5} fill={color} stroke="rgba(255,255,240,0.4)" strokeWidth={0.8} opacity={0.9} />
  </g>);
});

// Empire mecha — DA doc: hexagon with X cross, navy blue, slightly larger
export const EmpireMecha = React.memo(({ cx, cy, eid }) => {
  const r = 13;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
  return (<g>
    <polygon points={pts} fill="#0A1A3A" stroke="#1A3A6A" strokeWidth={1.5} opacity={0.9}>
      <animate attributeName="opacity" values="0.7;0.95;0.7" dur="3s" repeatCount="indefinite" />
    </polygon>
    {/* X cross inside */}
    <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} stroke="#2A5A8A" strokeWidth={1.2} />
    <line x1={cx + 5} y1={cy - 5} x2={cx - 5} y2={cy + 5} stroke="#2A5A8A" strokeWidth={1.2} />
    <text x={cx} y={cy + 20} textAnchor="middle" fontSize={5} fill="#2A5A8A" fontWeight={700} opacity={0.6}>{eid}</text>
  </g>);
});

// Resource token — clean, small
export const ResourceToken = React.memo(({ cx, cy, resType, count }) => {
  const cfg = {
    metal: { bg: "#3A3A3A", border: "#7A7A7A", icon: "⚙" },
    bois: { bg: "#2D3A1A", border: "#4A6A2A", icon: "🪵" },
    nourriture: { bg: "#3A3018", border: "#8A7A30", icon: "🌽" },
    petrole: { bg: "#1A1A20", border: "#5A5A6A", icon: "🛢" },
  }[resType] || { bg: "#333", border: "#888", icon: "?" };
  return (<g>
    <rect x={cx - 14} y={cy - 7} width={28} height={15} rx={3} fill={cfg.bg} stroke={cfg.border} strokeWidth={0.8} opacity={0.9} />
    <text x={cx - 2} y={cy + 4} textAnchor="middle" fontSize={10} fill="#E8DCC8" fontWeight={600} style={{ fontFamily: "'IBM Plex Mono',monospace" }}>{count}</text>
    <text x={cx + 9} y={cy + 4} textAnchor="middle" fontSize={8}>{cfg.icon}</text>
  </g>);
});
