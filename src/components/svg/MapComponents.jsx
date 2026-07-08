import React from 'react';
import { TERRAINS } from '../../data/terrains.js';
import { hPts, HS } from '../../logic/hexMath.js';
import { TerrainDecor } from './TerrainDecor.jsx';
import { FACTION_ICON_MAP, HERO_ICON_MAP, WORKER_ICON_MAP } from './FactionIcons.jsx';

// DA: painted-board hex rendering — bright terrain fills, dark gutter between
// hexes with a thin cream separation line like the printed Scythe board

// ═══════════════════════════════════════════════════════════════════
// SVG resource icons for hex overlay — hard black/white, high contrast
// ═══════════════════════════════════════════════════════════════════
const HexResIcon = React.memo(({ cx, cy, resType }) => {
  const s = 17; // icon size on hex — discreet marker, must not fight the art
  const x = cx - s / 2, y = cy - s / 2;
  const col = "rgba(20,14,8,0.5)";
  const sw = "1.7";
  if (resType === "metal") return (
    <g transform={`translate(${x},${y})`} style={{ pointerEvents: "none" }}>
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" overflow="visible">
        <polygon points="8,1 14,4.5 14,11.5 8,15 2,11.5 2,4.5" />
        <circle cx="8" cy="8" r="2" fill={col} stroke="none" opacity="0.9" />
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
  return (
    <g>
      {/* Base fill with gradient — painted-board look */}
      <polygon points={hPts(hex.rx, hex.ry)}
        fill={`url(#tg-${hex.t})`}
        stroke="#171310"
        strokeWidth={2.2}
      />
      {/* Texture pattern overlay */}
      <polygon points={hPts(hex.rx, hex.ry)} fill={`url(#tp-${hex.t})`} opacity={isWater ? 0.5 : 0.7} style={{ pointerEvents: "none" }} />
      {/* Terrain decorations */}
      <g opacity={0.85}><TerrainDecor hex={hex} /></g>
      {/* Cream board line between hexes (printed-board separation) */}
      <polygon points={hPts(hex.rx, hex.ry, HS - 1)} fill="none"
        stroke={isSel ? "#e6c96a" : isHov ? "#e0d2a8" : "#d8c9a3"}
        strokeWidth={isSel ? 2.2 : isHov ? 1.6 : 1}
        opacity={isSel ? 0.95 : isHov ? 0.7 : 0.4}
        style={{ pointerEvents: "none" }}
      />
      {/* Resource SVG icon — top of hex so units don't cover it */}
      {t.res && <HexResIcon cx={hex.rx} cy={hex.ry - 24} resType={t.res} />}
      {/* Factory special: subtle pulsing ring */}
      {isFactory && <>
        <polygon points={hPts(hex.rx, hex.ry, HS + 4)} fill="none" stroke="#8A2A2A" strokeWidth={0.6} opacity={0.2} strokeDasharray="5 3">
          <animateTransform attributeName="transform" type="rotate" from={`0 ${hex.rx} ${hex.ry}`} to={`360 ${hex.rx} ${hex.ry}`} dur="60s" repeatCount="indefinite" />
        </polygon>
        <polygon points={hPts(hex.rx, hex.ry)} fill="none" stroke="#5A1A1A" strokeWidth={1} opacity={0.1}>
          <animate attributeName="opacity" values="0.05;0.15;0.05" dur="3s" repeatCount="indefinite" />
        </polygon>
      </>}
      {/* Valid move overlay — bright enough to read on the light painted hexes */}
      {isV && <>
        <polygon points={hPts(hex.rx, hex.ry)} fill="rgba(60,160,60,0.28)" stroke="none" style={{ pointerEvents: "none" }}>
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.4s" repeatCount="indefinite" />
        </polygon>
        <polygon points={hPts(hex.rx, hex.ry, HS - 2)} fill="none" stroke="#b8f0a8" strokeWidth={2.5} opacity={0.9} style={{ pointerEvents: "none" }}>
          <animate attributeName="opacity" values="0.55;0.95;0.55" dur="1.4s" repeatCount="indefinite" />
        </polygon>
      </>}
    </g>
  );
});

// ═══════════════════════════════════════════════════════════════════
// Unit tokens — bigger, fully opaque, high contrast on map
// ═══════════════════════════════════════════════════════════════════
export const UnitToken = React.memo(({ type, cx, cy, color, label, icon, factionId }) => {
  // Wrapper animé : la position vit dans un transform CSS → le pion GLISSE
  // d'un hex à l'autre (transition) au lieu de téléporter
  const wrap = (children) => (
    <g style={{ transform: `translate(${cx}px, ${cy}px)`, transition: "transform 0.55s cubic-bezier(0.22,0.61,0.36,1)" }}>
      {children}
    </g>
  );
  if (type === "hero") {
    const HeroIcon = factionId ? HERO_ICON_MAP[factionId] : null;
    if (HeroIcon) {
      return wrap(<>
        <circle cx={0} cy={1} r={19} fill="rgba(6,5,3,0.85)" stroke={color} strokeWidth={2} />
        <HeroIcon cx={0} cy={1} size={32} color={color} />
        <text x={0} y={30} textAnchor="middle" fontSize="9" fill={color} fontWeight="700" stroke="rgba(6,5,3,0.8)" strokeWidth="2.5" paintOrder="stroke" style={{ fontFamily: "var(--font-map, 'IM Fell English SC', serif)" }}>{label}</text>
      </>);
    }
    // Fallback — generic star
    const r = 15, ri = 6.5;
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? r : ri;
      return `${rad * Math.cos(a)},${rad * Math.sin(a)}`;
    }).join(" ");
    return wrap(<>
      <circle cx={0} cy={0} r={17} fill="rgba(6,5,3,0.85)" />
      <polygon points={pts} fill={color} stroke="rgba(255,255,240,0.9)" strokeWidth={1.5} />
      <text x={0} y={28} textAnchor="middle" fontSize="9" fill={color} fontWeight="700" stroke="rgba(6,5,3,0.8)" strokeWidth="2.5" paintOrder="stroke" style={{ fontFamily: "var(--font-map, 'IM Fell English SC', serif)" }}>{label}</text>
    </>);
  }
  if (type === "mech") {
    const FactionIcon = factionId ? FACTION_ICON_MAP[factionId] : null;
    const r = FactionIcon ? 20 : 17;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${r * Math.cos(a)},${r * Math.sin(a)}`;
    }).join(" ");
    if (FactionIcon) {
      return wrap(<>
        <polygon points={pts} fill="rgba(6,5,3,0.8)" stroke={color} strokeWidth={2} />
        <FactionIcon cx={0} cy={0} size={34} color={color} />
      </>);
    }
    return wrap(<>
      <polygon points={pts} fill="rgba(6,5,3,0.8)" stroke={color} strokeWidth={2} />
      <polygon points={pts} fill={color + "88"} stroke="rgba(255,255,240,0.8)" strokeWidth={1.2} />
    </>);
  }
  if (type === "building") {
    const bt = icon || "■";
    return wrap(<>
      <rect x={-13} y={-13} width={26} height={26} rx={4} fill="rgba(6,5,3,0.85)" stroke={color} strokeWidth={2} />
      <rect x={-11.5} y={-11.5} width={23} height={23} rx={3} fill={color + "66"} stroke="none" />
      <text x={0} y={5} textAnchor="middle" fontSize={14}>{bt}</text>
    </>);
  }
  // Worker — faction-specific silhouette
  const WorkerIcon = factionId ? WORKER_ICON_MAP[factionId] : null;
  if (WorkerIcon) {
    return wrap(<>
      <circle cx={0} cy={0} r={12} fill="rgba(6,5,3,0.85)" stroke={color} strokeWidth={1.5} />
      <WorkerIcon cx={0} cy={0} size={20} color={color} />
    </>);
  }
  // Fallback — filled circle
  return wrap(<>
    <circle cx={0} cy={0} r={10} fill="rgba(6,5,3,0.85)" stroke={color} strokeWidth={1.5} />
    <circle cx={0} cy={0} r={7.5} fill={color} stroke="rgba(255,255,240,0.8)" strokeWidth={1} />
  </>);
});

// Faction halo — semi-transparent circle under unit groups
export const FactionHalo = React.memo(({ cx, cy, color, r = 24 }) => (
  <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.2} style={{ pointerEvents: "none" }} />
));

// Empire mecha — hexagon with X cross, navy blue
export const EmpireMecha = React.memo(({ cx, cy, eid }) => {
  const r = 15;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${r * Math.cos(a)},${r * Math.sin(a)}`;
  }).join(" ");
  return (
    <g style={{ transform: `translate(${cx}px, ${cy}px)`, transition: "transform 0.55s cubic-bezier(0.22,0.61,0.36,1)" }}>
      <polygon points={pts} fill="#0A1A3A" stroke="#1A3A6A" strokeWidth={1.5} opacity={0.95}>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
      </polygon>
      <line x1={-6} y1={-6} x2={6} y2={6} stroke="#2A5A8A" strokeWidth={2} />
      <line x1={6} y1={-6} x2={-6} y2={6} stroke="#2A5A8A" strokeWidth={2} />
      <text x={0} y={25} textAnchor="middle" fontSize={8} fill="#2A5A8A" fontWeight={700} opacity={0.8}>{eid}</text>
    </g>
  );
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
