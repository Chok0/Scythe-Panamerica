import React from 'react';
import { TERRAINS } from '../../data/terrains.js';
import { hPts, HS } from '../../logic/hexMath.js';
import { TerrainDecor } from './TerrainDecor.jsx';
import { FACTION_ICON_MAP, HERO_ICON_MAP, WORKER_ICON_MAP } from './FactionIcons.jsx';

// DA Doc: Hex rendering — cartographic military style
// Stroke 0.5px, no rounded corners, flat (no drop-shadows on game elements)
const RES_ICONS = { metal: "⚙", bois: "🪵", nourriture: "🌽", petrole: "🛢", ouvriers: "👷" };

// Terrain-specific border colors for liseré
const TERRAIN_LISERÉ = {
  foret: "#1A5A1A", plaine: "#7A6B3A", sierra: "#5A6A7A", desert: "#8B6B35",
  village: "#7A4A3A", lac: "#1A3A5A", marecage: "#2A4A2A", factory: "#5A1A1A",
  montagne: "#4A4A4A", champs: "#7A6A20", toundra: "#4A5A6A",
};

export const HexTerrain = React.memo(({ hex, isV, isSel, isHov, isFactory }) => {
  const t = TERRAINS[hex.t];
  const isWater = hex.t === "lac" || hex.t === "marecage";
  const liseré = TERRAIN_LISERÉ[hex.t] || "#2A2518";
  return (
    <g>
      {/* Base fill with gradient — higher saturation */}
      <polygon points={hPts(hex.rx, hex.ry)}
        fill={`url(#tg-${hex.t})`}
        stroke={isV ? "#4A8A4A" : isSel ? "#C9A84C" : isHov ? t.stroke : liseré}
        strokeWidth={isV ? 1.5 : isSel ? 2 : isHov ? 1.2 : 0.8}
        opacity={isWater ? 0.75 : 1}
      />
      {/* Texture pattern overlay — boosted opacity */}
      <polygon points={hPts(hex.rx, hex.ry)} fill={`url(#tp-${hex.t})`} opacity={isWater ? 0.5 : 0.7} style={{ pointerEvents: "none" }} />
      {/* Terrain decorations — higher opacity */}
      <g opacity={0.55}><TerrainDecor hex={hex} /></g>
      {/* Resource icon — centered, subtle */}
      {t.res && <text x={hex.rx} y={hex.ry + 2} textAnchor="middle" fontSize={18} opacity={0.22} style={{ pointerEvents: "none" }}>{RES_ICONS[t.res] || ""}</text>}
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

// Unit tokens — faction-specific SVG silhouettes for heroes, mechs, workers
// Hero = unique character silhouette, Mech = faction mech, Worker = faction worker, Building = square
export const UnitToken = React.memo(({ type, cx, cy, color, label, icon, factionId }) => {
  if (type === "hero") {
    const HeroIcon = factionId ? HERO_ICON_MAP[factionId] : null;
    if (HeroIcon) {
      return (<g>
        <HeroIcon cx={cx} cy={cy} size={28} color={color} />
        <text x={cx} y={cy + 21} textAnchor="middle" fontSize="6.5" fill={color} fontWeight="700" style={{ fontFamily: "'Bitter',serif" }}>{label}</text>
      </g>);
    }
    // Fallback — generic star
    const r = 12, ri = 5.5;
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? r : ri;
      return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
    }).join(" ");
    return (<g>
      <polygon points={pts} fill={color} stroke="rgba(255,255,240,0.8)" strokeWidth={1.5} opacity={0.95} />
      <text x={cx} y={cy + 19} textAnchor="middle" fontSize="7" fill={color} fontWeight="700" style={{ fontFamily: "'Bitter',serif" }}>{label}</text>
    </g>);
  }
  if (type === "mech") {
    const FactionIcon = factionId ? FACTION_ICON_MAP[factionId] : null;
    if (FactionIcon) {
      return (<g>
        {/* Background hex outline for visibility */}
        {(() => { const r = 18; const pts = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 6; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(" "); return <polygon points={pts} fill={color + "22"} stroke={color} strokeWidth={0.8} opacity={0.6} />; })()}
        <FactionIcon cx={cx} cy={cy} size={36} color={color} />
      </g>);
    }
    const r = 14;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");
    return (<g>
      <polygon points={pts} fill={color + "55"} stroke="rgba(255,255,240,0.7)" strokeWidth={1.5} opacity={0.95} />
      <polygon points={pts} fill="none" stroke={color} strokeWidth={1} opacity={0.9} />
    </g>);
  }
  if (type === "building") {
    const bt = icon || "■";
    return (<g>
      <rect x={cx - 8} y={cy - 8} width={16} height={16} rx={2} fill={color + "44"} stroke="rgba(255,255,240,0.6)" strokeWidth={1.5} opacity={0.95} />
      <rect x={cx - 8} y={cy - 8} width={16} height={16} rx={2} fill="none" stroke={color} strokeWidth={0.8} opacity={0.9} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10}>{bt}</text>
    </g>);
  }
  // Worker — faction-specific silhouette
  const WorkerIcon = factionId ? WORKER_ICON_MAP[factionId] : null;
  if (WorkerIcon) {
    return (<g>
      <WorkerIcon cx={cx} cy={cy} size={18} color={color} />
    </g>);
  }
  // Fallback — filled circle
  return (<g>
    <circle cx={cx} cy={cy} r={6} fill={color} stroke="rgba(255,255,240,0.7)" strokeWidth={1.5} opacity={0.95} />
  </g>);
});

// Faction halo — semi-transparent circle under unit groups
export const FactionHalo = React.memo(({ cx, cy, color, r = 20 }) => (
  <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.15} style={{ pointerEvents: "none" }} />
));

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
