import React from 'react';
import { TERRAINS } from '../../data/terrains.js';
import { hPts, HS } from '../../logic/hexMath.js';
import { TerrainDecor } from './TerrainDecor.jsx';
import { FACTION_ICON_MAP, HERO_ICON_MAP, WORKER_ICON_MAP } from './FactionIcons.jsx';

// DA Doc: Hex rendering — cartographic military style
// Stroke 0.5px, no rounded corners, flat (no drop-shadows on game elements)

// Terrain-specific border colors for liseré
const TERRAIN_LISERÉ = {
  foret: "#1A5A1A", plaine: "#7A6B3A", sierra: "#5A6A7A", desert: "#8B6B35",
  village: "#7A4A3A", lac: "#1A3A5A", marecage: "#2A4A2A", factory: "#5A1A1A",
  montagne: "#4A4A4A", champs: "#7A6A20", toundra: "#4A5A6A",
};

// ═══════════════════════════════════════════════════════════════════
// SVG resource icons for hex overlay — hard black/white, high contrast
// ═══════════════════════════════════════════════════════════════════
const HexResIcon = React.memo(({ cx, cy, resType }) => {
  const s = 20; // icon size on hex
  const x = cx - s / 2, y = cy - s / 2;
  const col = "rgba(0,0,0,0.35)";
  const sw = "0.8";
  if (resType === "metal") return (
    <g transform={`translate(${x},${y})`} style={{ pointerEvents: "none" }}>
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" overflow="visible">
        <polygon points="8,1 14,4.5 14,11.5 8,15 2,11.5 2,4.5" />
        <circle cx="8" cy="8" r="2" fill={col} stroke="none" opacity="0.5" />
      </svg>
    </g>
  );
  if (resType === "bois") return (
    <g transform={`translate(${x},${y})`} style={{ pointerEvents: "none" }}>
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" overflow="visible">
        <ellipse cx="8" cy="3.5" rx="4" ry="2.5" />
        <line x1="4" y1="3.5" x2="4" y2="12.5" />
        <line x1="12" y1="3.5" x2="12" y2="12.5" />
        <ellipse cx="8" cy="12.5" rx="4" ry="2.5" />
      </svg>
    </g>
  );
  if (resType === "nourriture") return (
    <g transform={`translate(${x},${y})`} style={{ pointerEvents: "none" }}>
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" overflow="visible">
        <path d="M8 2 L8 14" />
        <path d="M8 4 L5 2" /><path d="M8 4 L11 2" />
        <path d="M8 6 L4.5 4" /><path d="M8 6 L11.5 4" />
        <path d="M8 8 L5 6.5" /><path d="M8 8 L11 6.5" />
        <path d="M8 10 L5.5 8.5" /><path d="M8 10 L10.5 8.5" />
      </svg>
    </g>
  );
  if (resType === "petrole") return (
    <g transform={`translate(${x},${y})`} style={{ pointerEvents: "none" }}>
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" overflow="visible">
        <rect x="4" y="4" width="8" height="10" rx="1" />
        <rect x="6" y="2" width="4" height="3" rx="0.5" />
        <line x1="6" y1="8" x2="10" y2="8" />
      </svg>
    </g>
  );
  if (resType === "ouvriers") return (
    <g transform={`translate(${x},${y})`} style={{ pointerEvents: "none" }}>
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" overflow="visible">
        <circle cx="8" cy="5" r="3" />
        <path d="M3 14 C3 10.5 5 9 8 9 C11 9 13 10.5 13 14" />
      </svg>
    </g>
  );
  return null;
});

export const HexTerrain = React.memo(({ hex, isV, isSel, isHov, isFactory }) => {
  const t = TERRAINS[hex.t];
  const isWater = hex.t === "lac" || hex.t === "marecage";
  const liseré = TERRAIN_LISERÉ[hex.t] || "#2A2518";
  return (
    <g>
      {/* Base fill with gradient */}
      <polygon points={hPts(hex.rx, hex.ry)}
        fill={`url(#tg-${hex.t})`}
        stroke={isV ? "#4A8A4A" : isSel ? "#C9A84C" : isHov ? t.stroke : liseré}
        strokeWidth={isV ? 1.5 : isSel ? 2 : isHov ? 1.2 : 0.8}
        opacity={isWater ? 0.75 : 1}
      />
      {/* Texture pattern overlay */}
      <polygon points={hPts(hex.rx, hex.ry)} fill={`url(#tp-${hex.t})`} opacity={isWater ? 0.5 : 0.7} style={{ pointerEvents: "none" }} />
      {/* Terrain decorations */}
      <g opacity={0.55}><TerrainDecor hex={hex} /></g>
      {/* Resource SVG icon — centered, hard contrast */}
      {t.res && <HexResIcon cx={hex.rx} cy={hex.ry} resType={t.res} />}
      {/* Factory special: subtle pulsing ring */}
      {isFactory && <>
        <polygon points={hPts(hex.rx, hex.ry, HS + 4)} fill="none" stroke="#8A2A2A" strokeWidth={0.6} opacity={0.2} strokeDasharray="5 3">
          <animateTransform attributeName="transform" type="rotate" from={`0 ${hex.rx} ${hex.ry}`} to={`360 ${hex.rx} ${hex.ry}`} dur="60s" repeatCount="indefinite" />
        </polygon>
        <polygon points={hPts(hex.rx, hex.ry)} fill="none" stroke="#5A1A1A" strokeWidth={1} opacity={0.1}>
          <animate attributeName="opacity" values="0.05;0.15;0.05" dur="3s" repeatCount="indefinite" />
        </polygon>
      </>}
      {/* Valid move overlay */}
      {isV && <>
        <polygon points={hPts(hex.rx, hex.ry)} fill="rgba(74,138,74,0.15)" stroke="#4A8A4A" strokeWidth={1} opacity={0.8}>
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.4s" repeatCount="indefinite" />
        </polygon>
      </>}
    </g>
  );
});

// ═══════════════════════════════════════════════════════════════════
// Unit tokens — bigger, fully opaque, high contrast on map
// ═══════════════════════════════════════════════════════════════════
export const UnitToken = React.memo(({ type, cx, cy, color, label, icon, factionId }) => {
  if (type === "hero") {
    const HeroIcon = factionId ? HERO_ICON_MAP[factionId] : null;
    if (HeroIcon) {
      return (<g>
        {/* Solid backdrop for visibility */}
        <circle cx={cx} cy={cy + 2} r={18} fill="rgba(6,5,3,0.85)" stroke={color} strokeWidth={1.5} />
        <HeroIcon cx={cx} cy={cy + 2} size={32} color={color} />
        <text x={cx} y={cy + 26} textAnchor="middle" fontSize="7" fill={color} fontWeight="700" stroke="rgba(6,5,3,0.8)" strokeWidth="2" paintOrder="stroke" style={{ fontFamily: "var(--font-map, 'IM Fell English SC', serif)" }}>{label}</text>
      </g>);
    }
    // Fallback — generic star, fully opaque
    const r = 14, ri = 6;
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? r : ri;
      return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
    }).join(" ");
    return (<g>
      <circle cx={cx} cy={cy} r={16} fill="rgba(6,5,3,0.85)" />
      <polygon points={pts} fill={color} stroke="rgba(255,255,240,0.9)" strokeWidth={1.5} />
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize="7" fill={color} fontWeight="700" stroke="rgba(6,5,3,0.8)" strokeWidth="2" paintOrder="stroke" style={{ fontFamily: "var(--font-map, 'IM Fell English SC', serif)" }}>{label}</text>
    </g>);
  }
  if (type === "mech") {
    const FactionIcon = factionId ? FACTION_ICON_MAP[factionId] : null;
    if (FactionIcon) {
      return (<g>
        {/* Solid hex backdrop */}
        {(() => { const r = 20; const pts = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 6; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(" "); return <polygon points={pts} fill="rgba(6,5,3,0.8)" stroke={color} strokeWidth={1.5} />; })()}
        <FactionIcon cx={cx} cy={cy} size={38} color={color} />
      </g>);
    }
    const r = 16;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");
    return (<g>
      <polygon points={pts} fill="rgba(6,5,3,0.8)" stroke={color} strokeWidth={1.5} />
      <polygon points={pts} fill={color + "88"} stroke="rgba(255,255,240,0.8)" strokeWidth={1} />
    </g>);
  }
  if (type === "building") {
    const bt = icon || "■";
    return (<g>
      <rect x={cx - 10} y={cy - 10} width={20} height={20} rx={3} fill="rgba(6,5,3,0.85)" stroke={color} strokeWidth={1.5} />
      <rect x={cx - 9} y={cy - 9} width={18} height={18} rx={2} fill={color + "66"} stroke="none" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={12}>{bt}</text>
    </g>);
  }
  // Worker — faction-specific silhouette, bigger, solid backdrop
  const WorkerIcon = factionId ? WORKER_ICON_MAP[factionId] : null;
  if (WorkerIcon) {
    return (<g>
      <circle cx={cx} cy={cy} r={12} fill="rgba(6,5,3,0.85)" stroke={color} strokeWidth={1.2} />
      <WorkerIcon cx={cx} cy={cy} size={20} color={color} />
    </g>);
  }
  // Fallback — filled circle, bigger
  return (<g>
    <circle cx={cx} cy={cy} r={9} fill="rgba(6,5,3,0.85)" stroke={color} strokeWidth={1.5} />
    <circle cx={cx} cy={cy} r={7} fill={color} stroke="rgba(255,255,240,0.8)" strokeWidth={1} />
  </g>);
});

// Faction halo — semi-transparent circle under unit groups
export const FactionHalo = React.memo(({ cx, cy, color, r = 24 }) => (
  <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.2} style={{ pointerEvents: "none" }} />
));

// Empire mecha — hexagon with X cross, navy blue, slightly larger
export const EmpireMecha = React.memo(({ cx, cy, eid }) => {
  const r = 15;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
  return (<g>
    <polygon points={pts} fill="#0A1A3A" stroke="#1A3A6A" strokeWidth={1.5} opacity={0.95}>
      <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
    </polygon>
    <line x1={cx - 6} y1={cy - 6} x2={cx + 6} y2={cy + 6} stroke="#2A5A8A" strokeWidth={1.5} />
    <line x1={cx + 6} y1={cy - 6} x2={cx - 6} y2={cy + 6} stroke="#2A5A8A" strokeWidth={1.5} />
    <text x={cx} y={cy + 22} textAnchor="middle" fontSize={6} fill="#2A5A8A" fontWeight={700} opacity={0.7}>{eid}</text>
  </g>);
});

// Resource token — clean, SVG icon instead of emoji
export const ResourceToken = React.memo(({ cx, cy, resType, count }) => {
  const cfg = {
    metal: { bg: "#3A3A3A", border: "#8A8A8A" },
    bois: { bg: "#2D3A1A", border: "#5A7A3A" },
    nourriture: { bg: "#3A3018", border: "#9A8A30" },
    petrole: { bg: "#1A1A20", border: "#6A6A7A" },
  }[resType] || { bg: "#333", border: "#888" };
  return (<g>
    <rect x={cx - 14} y={cy - 8} width={28} height={16} rx={3} fill={cfg.bg} stroke={cfg.border} strokeWidth={1} opacity={0.95} />
    <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fill="#E8DCC8" fontWeight={700} style={{ fontFamily: "'IBM Plex Mono',monospace" }}>{count}</text>
  </g>);
});
