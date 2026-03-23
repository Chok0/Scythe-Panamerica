import React from 'react';

// Faction mech SVG icons — designed to fill a hex (~54px radius)
// Each icon is thematic: industrial, handbuilt, etc.

// Confédération — Cavalier: armored horse-like mech, grey steel
export const IconConfederation = React.memo(({ cx, cy, size = 28, color = "#808080" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Body — armored hull */}
      <rect x="8" y="10" width="16" height="10" rx="2" fill={color + "44"} stroke={color} strokeWidth="0.8" />
      {/* Turret */}
      <rect x="12" y="6" width="8" height="5" rx="1.5" fill={color + "66"} stroke={color} strokeWidth="0.6" />
      {/* Cannon */}
      <rect x="6" y="7.5" width="7" height="2" rx="0.5" fill={color + "88"} />
      {/* Legs */}
      <rect x="8" y="20" width="3" height="6" rx="0.5" fill={color + "55"} stroke={color} strokeWidth="0.4" />
      <rect x="21" y="20" width="3" height="6" rx="0.5" fill={color + "55"} stroke={color} strokeWidth="0.4" />
      <rect x="13" y="21" width="2.5" height="5" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.3" />
      <rect x="17" y="21" width="2.5" height="5" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.3" />
      {/* Star emblem */}
      <polygon points="16,8 16.8,9.5 18.5,9.5 17.2,10.5 17.7,12 16,11 14.3,12 14.8,10.5 13.5,9.5 15.2,9.5" fill={color} opacity="0.5" />
      {/* Viewport */}
      <rect x="11" y="12" width="10" height="1.5" rx="0.5" fill="#1a1a1a" opacity="0.6" />
      {/* Rivets */}
      <circle cx="10" cy="14" r="0.5" fill={color} opacity="0.4" />
      <circle cx="22" cy="14" r="0.5" fill={color} opacity="0.4" />
    </svg>
  </g>
));

// Frente Libre — Trilladora: thresher-crawler, industrial agricultural machine
export const IconFrente = React.memo(({ cx, cy, size = 28, color = "#A05020" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Hydraulic piston legs */}
      <g stroke="#5a3a20" strokeWidth="0.4">
        <rect x="2" y="17" width="2.5" height="6" rx="0.5" fill="#7a5030" />
        <rect x="1" y="23" width="4" height="2" rx="0.5" fill="#5a3a20" />
        <rect x="5" y="20" width="2" height="5" rx="0.5" fill="#7a5030" />
        <rect x="4.5" y="25" width="3" height="2" rx="0.5" fill="#5a3a20" />
        <rect x="27.5" y="17" width="2.5" height="6" rx="0.5" fill="#7a5030" />
        <rect x="27" y="23" width="4" height="2" rx="0.5" fill="#5a3a20" />
        <rect x="25" y="20" width="2" height="5" rx="0.5" fill="#7a5030" />
        <rect x="24.5" y="25" width="3" height="2" rx="0.5" fill="#5a3a20" />
      </g>
      {/* Body — rectangular engine block */}
      <rect x="6" y="10" width="20" height="11" rx="1" fill={color + "cc"} stroke="#6a4020" strokeWidth="0.7" />
      {/* Radiator grille */}
      <rect x="7" y="11" width="4" height="9" rx="0.5" fill="#6a4020" />
      <line x1="8" y1="11.5" x2="8" y2="19.5" stroke="#8a6040" strokeWidth="0.4" />
      <line x1="9.5" y1="11.5" x2="9.5" y2="19.5" stroke="#8a6040" strokeWidth="0.4" />
      {/* Drive chain */}
      <path d="M12,20 L14,20 L14,18 L16,18 L16,20 L18,20 L18,18 L20,18 L20,20 L22,20" fill="none" stroke="#9a7050" strokeWidth="0.4" />
      {/* Armor plates + rivets */}
      <rect x="12" y="11" width="6" height="4" rx="0.3" fill="#7a4a28" stroke="#9a7050" strokeWidth="0.3" />
      <circle cx="13" cy="12" r="0.4" fill="#b08850" />
      <circle cx="17" cy="12" r="0.4" fill="#b08850" />
      {/* Gun nest */}
      <rect x="14" y="7" width="5" height="3.5" rx="0.5" fill="#6a4020" stroke="#5a3010" strokeWidth="0.4" />
      <rect x="12" y="8" width="3" height="1" rx="0.3" fill="#4a2a10" />
      {/* Exhaust */}
      <rect x="22" y="5" width="2" height="6" rx="0.7" fill="#6a4020" />
      {/* Viewport slits */}
      <rect x="7.5" y="13" width="2.5" height="0.7" rx="0.2" fill={color} opacity="0.5" />
    </svg>
  </g>
));

// Nations Souveraines — Marcheur-Tonnerre: handbuilt wood + copper
export const IconNations = React.memo(({ cx, cy, size = 28, color = "#20B2AA" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Wood beam legs with bronze joints */}
      <g>
        <rect x="5" y="15" width="2" height="7" rx="0.3" fill="#6a5030" stroke="#4a3820" strokeWidth="0.3" />
        <circle cx="6" cy="22" r="1.2" fill="#8a7040" stroke="#6a5030" strokeWidth="0.3" />
        <rect x="4.5" y="23" width="2" height="5" rx="0.3" fill="#5a4020" />
        <rect x="3.5" y="28" width="3.5" height="1.2" rx="0.3" fill={color + "88"} />
        <rect x="25" y="15" width="2" height="7" rx="0.3" fill="#6a5030" stroke="#4a3820" strokeWidth="0.3" />
        <circle cx="26" cy="22" r="1.2" fill="#8a7040" stroke="#6a5030" strokeWidth="0.3" />
        <rect x="25.5" y="23" width="2" height="5" rx="0.3" fill="#5a4020" />
        <rect x="25" y="28" width="3.5" height="1.2" rx="0.3" fill={color + "88"} />
      </g>
      {/* Wood frame body */}
      <rect x="7" y="11" width="18" height="8" rx="1" fill="#5a4020" stroke="#4a3018" strokeWidth="0.5" />
      {/* Wood grain */}
      <line x1="8" y1="13" x2="24" y2="13" stroke="#4a3018" strokeWidth="0.3" />
      <line x1="8" y1="16" x2="24" y2="16" stroke="#4a3018" strokeWidth="0.3" />
      {/* Copper armor plates */}
      <rect x="9" y="12" width="6" height="5" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.5" />
      <rect x="17" y="12" width="6" height="5" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.5" />
      {/* Tribal engravings */}
      <path d="M10,14 L12,13 L14,14 L12,15Z" fill="none" stroke={color} strokeWidth="0.4" opacity="0.5" />
      {/* Antenna masts (wood poles with copper tips) */}
      <line x1="11" y1="11" x2="9" y2="4" stroke="#6a5030" strokeWidth="0.8" />
      <line x1="21" y1="11" x2="23" y2="4" stroke="#6a5030" strokeWidth="0.8" />
      <circle cx="9" cy="4" r="1" fill={color} opacity="0.6" />
      <circle cx="23" cy="4" r="1" fill={color} opacity="0.6" />
      {/* Rawhide bindings */}
      <path d="M7.5,12 L8.5,11.5" stroke="#a09070" strokeWidth="0.5" />
      <path d="M24,12 L23,11.5" stroke="#a09070" strokeWidth="0.5" />
    </svg>
  </g>
));

// Acadiane — Airboat/swamp craft, green, stealthy
export const IconAcadiane = React.memo(({ cx, cy, size = 28, color = "#228B22" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Hull — flat-bottomed swamp boat shape */}
      <path d="M4,18 L8,14 L24,14 L28,18 L26,22 L6,22Z" fill={color + "44"} stroke={color} strokeWidth="0.7" />
      {/* Deck */}
      <rect x="10" y="14" width="12" height="4" rx="0.5" fill={color + "33"} stroke={color} strokeWidth="0.4" />
      {/* Propeller cage (airboat fan) */}
      <circle cx="27" cy="12" r="4" fill="none" stroke={color} strokeWidth="0.6" />
      <line x1="27" y1="8" x2="27" y2="16" stroke={color + "88"} strokeWidth="0.5" />
      <line x1="23" y1="12" x2="31" y2="12" stroke={color + "88"} strokeWidth="0.5" />
      <line x1="24.2" y1="9.2" x2="29.8" y2="14.8" stroke={color + "66"} strokeWidth="0.4" />
      <line x1="29.8" y1="9.2" x2="24.2" y2="14.8" stroke={color + "66"} strokeWidth="0.4" />
      {/* Cabin */}
      <rect x="12" y="10" width="6" height="4.5" rx="1" fill={color + "55"} stroke={color} strokeWidth="0.5" />
      {/* Flag pole */}
      <line x1="9" y1="14" x2="9" y2="6" stroke={color} strokeWidth="0.5" />
      <polygon points="9,6 13,7.5 9,9" fill={color} opacity="0.4" />
      {/* Pontoons / legs */}
      <rect x="7" y="22" width="3" height="4" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.3" />
      <rect x="22" y="22" width="3" height="4" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.3" />
      <rect x="14" y="22.5" width="3" height="3.5" rx="0.5" fill={color + "33"} stroke={color} strokeWidth="0.3" />
      {/* Viewport */}
      <rect x="13" y="11.5" width="4" height="1" rx="0.3" fill="#1a1a1a" opacity="0.5" />
    </svg>
  </g>
));

// Bayou — Chimère: crocodilian amphibious mech, purple
export const IconBayou = React.memo(({ cx, cy, size = 28, color = "#7B2D8B" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Low, long body — croc-like profile */}
      <path d="M3,16 L6,12 L26,12 L30,15 L28,19 L4,19Z" fill={color + "44"} stroke={color} strokeWidth="0.7" />
      {/* Jaw / snout */}
      <path d="M3,16 L1,15 L1,17.5 L3,17Z" fill={color + "55"} stroke={color} strokeWidth="0.4" />
      {/* Teeth */}
      <g fill={color + "88"}>
        <polygon points="1.5,15.5 2,14.5 2.5,15.5" />
        <polygon points="2.5,15.5 3,14.5 3.5,15.5" />
      </g>
      {/* Armored spine ridges */}
      <g fill={color + "66"} stroke={color} strokeWidth="0.3">
        <polygon points="10,12 11,9 12,12" />
        <polygon points="14,12 15,9.5 16,12" />
        <polygon points="18,12 19,9.5 20,12" />
        <polygon points="22,12 23,10 24,12" />
      </g>
      {/* Eyes — glowing */}
      <circle cx="5" cy="14" r="1" fill={color} opacity="0.7" />
      <circle cx="5" cy="14" r="0.4" fill="#fff" opacity="0.5" />
      {/* Legs — short, wide, amphibious */}
      <rect x="7" y="19" width="3" height="5" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.3" />
      <rect x="13" y="19" width="3" height="4.5" rx="0.5" fill={color + "33"} stroke={color} strokeWidth="0.3" />
      <rect x="19" y="19" width="3" height="4.5" rx="0.5" fill={color + "33"} stroke={color} strokeWidth="0.3" />
      <rect x="25" y="19" width="3" height="5" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.3" />
      {/* Tail */}
      <path d="M28,15 L31,14 L31,17 L28,17Z" fill={color + "33"} stroke={color} strokeWidth="0.3" />
    </svg>
  </g>
));

// Dominion — Imperial walker, red, imposing military
export const IconDominion = React.memo(({ cx, cy, size = 28, color = "#CC2222" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Tall body — imperial tower */}
      <rect x="10" y="6" width="12" height="14" rx="1.5" fill={color + "44"} stroke={color} strokeWidth="0.7" />
      {/* Crown/crenelations on top */}
      <g fill={color + "55"} stroke={color} strokeWidth="0.3">
        <rect x="10" y="4" width="3" height="3" rx="0.3" />
        <rect x="14.5" y="3" width="3" height="4" rx="0.3" />
        <rect x="19" y="4" width="3" height="3" rx="0.3" />
      </g>
      {/* Cannons — side-mounted */}
      <rect x="5" y="10" width="6" height="1.5" rx="0.4" fill={color + "88"} />
      <rect x="21" y="10" width="6" height="1.5" rx="0.4" fill={color + "88"} />
      {/* Cross emblem */}
      <line x1="16" y1="9" x2="16" y2="15" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <line x1="13" y1="12" x2="19" y2="12" stroke={color} strokeWidth="0.8" opacity="0.5" />
      {/* Viewport */}
      <rect x="12" y="8" width="8" height="1.5" rx="0.5" fill="#1a1a1a" opacity="0.5" />
      {/* Heavy legs — thick pillars */}
      <rect x="10" y="20" width="4" height="8" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.4" />
      <rect x="18" y="20" width="4" height="8" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.4" />
      {/* Knee joints */}
      <circle cx="12" cy="24" r="1.5" fill={color + "33"} stroke={color} strokeWidth="0.3" />
      <circle cx="20" cy="24" r="1.5" fill={color + "33"} stroke={color} strokeWidth="0.3" />
      {/* Feet plates */}
      <rect x="8.5" y="28" width="6" height="1.5" rx="0.3" fill={color + "55"} />
      <rect x="17" y="28" width="6" height="1.5" rx="0.3" fill={color + "55"} />
    </svg>
  </g>
));

// Hero icons — simpler, star-like silhouettes with faction flavor
export const IconHeroStar = React.memo(({ cx, cy, size = 22, color }) => {
  const r = size / 2, ri = r * 0.42;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : ri;
    return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
  }).join(" ");
  return (
    <g>
      <polygon points={pts} fill={color + "55"} stroke={color} strokeWidth={1.2} opacity={0.9} />
      <polygon points={pts} fill="none" stroke="rgba(255,255,240,0.5)" strokeWidth={0.6} />
    </g>
  );
});

// Map faction id to icon component
export const FACTION_ICON_MAP = {
  confederation: IconConfederation,
  frente: IconFrente,
  nations: IconNations,
  acadiane: IconAcadiane,
  bayou: IconBayou,
  dominion: IconDominion,
};
