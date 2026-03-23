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

// Frente Libre — Trilladora v3: rectangular thresher-crawler, 6 hydraulic piston legs,
// harvester cutter bar, exposed drive chain, bolted armor plates, gun nest, exhaust stack
export const IconFrente = React.memo(({ cx, cy, size = 28, color = "#A05020" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* 6 HYDRAULIC PISTON LEGS — industrial cylinders */}
      <g stroke="#5a3a20" strokeWidth="0.4">
        {/* Left side: 3 piston assemblies */}
        <rect x="1" y="17" width="3" height="7" rx="0.5" fill="#7a5030" />
        <rect x="1.5" y="20" width="2" height="3.5" rx="0.3" fill="#8a6040" />
        <rect x="0.5" y="24" width="4" height="2.5" rx="0.5" fill="#5a3a20" />
        <rect x="3" y="20" width="2.5" height="6" rx="0.5" fill="#7a5030" />
        <rect x="3.3" y="22" width="1.8" height="3" rx="0.3" fill="#8a6040" />
        <rect x="2.5" y="26" width="3.5" height="2.2" rx="0.5" fill="#5a3a20" />
        <rect x="5" y="22" width="2.5" height="5.5" rx="0.5" fill="#7a5030" />
        <rect x="4.5" y="27.5" width="3.5" height="2" rx="0.5" fill="#5a3a20" />
        {/* Right side: 3 piston assemblies (mirror) */}
        <rect x="28" y="17" width="3" height="7" rx="0.5" fill="#7a5030" />
        <rect x="28.5" y="20" width="2" height="3.5" rx="0.3" fill="#8a6040" />
        <rect x="27.5" y="24" width="4" height="2.5" rx="0.5" fill="#5a3a20" />
        <rect x="26.5" y="20" width="2.5" height="6" rx="0.5" fill="#7a5030" />
        <rect x="26.7" y="22" width="1.8" height="3" rx="0.3" fill="#8a6040" />
        <rect x="26" y="26" width="3.5" height="2.2" rx="0.5" fill="#5a3a20" />
        <rect x="24.5" y="22" width="2.5" height="5.5" rx="0.5" fill="#7a5030" />
        <rect x="24" y="27.5" width="3.5" height="2" rx="0.5" fill="#5a3a20" />
      </g>
      {/* Piston joints — industrial bolts */}
      <g fill="#9a7050" stroke="#6a4a30" strokeWidth="0.3">
        <circle cx="2.5" cy="17" r="1" /><circle cx="4.2" cy="20" r="0.8" /><circle cx="6.2" cy="22" r="0.8" />
        <circle cx="29.5" cy="17" r="1" /><circle cx="27.8" cy="20" r="0.8" /><circle cx="25.8" cy="22" r="0.8" />
      </g>
      {/* BODY — Rectangular engine block */}
      <rect x="6" y="10" width="20" height="12" rx="1" fill="#8a5a30" stroke="#6a4020" strokeWidth="0.7" />
      {/* Engine grille / radiator front */}
      <rect x="6.5" y="10.5" width="5" height="11" rx="0.5" fill="#6a4020" stroke="#5a3010" strokeWidth="0.3" />
      <g stroke="#8a6040" strokeWidth="0.4">
        <line x1="7.5" y1="11.5" x2="7.5" y2="20.5" />
        <line x1="8.8" y1="11.5" x2="8.8" y2="20.5" />
        <line x1="10" y1="11.5" x2="10" y2="20.5" />
      </g>
      {/* Exposed drive chain */}
      <path d="M12,21 L14,21 L14,19 L16,19 L16,21 L18,21 L18,19 L20,19 L20,21 L22,21" fill="none" stroke="#9a7050" strokeWidth="0.4" />
      {/* Chain sprockets */}
      <circle cx="12" cy="20" r="1.5" fill="#6a4020" stroke="#8a6040" strokeWidth="0.3" />
      <circle cx="12" cy="20" r="0.5" fill="#9a7050" />
      <circle cx="22" cy="20" r="1.5" fill="#6a4020" stroke="#8a6040" strokeWidth="0.3" />
      <circle cx="22" cy="20" r="0.5" fill="#9a7050" />
      {/* Bolted armor plates — welded on top, crude */}
      <rect x="12" y="10.5" width="7" height="5" rx="0.3" fill="#7a4a28" stroke="#9a7050" strokeWidth="0.3" />
      <rect x="20" y="11" width="5" height="4" rx="0.3" fill="#6a4020" stroke="#8a6040" strokeWidth="0.3" />
      {/* Armor plate rivets — irregular, hand-bolted */}
      <g fill="#b08850">
        <circle cx="13" cy="11.5" r="0.4" /><circle cx="18" cy="11.5" r="0.4" />
        <circle cx="13" cy="14.5" r="0.4" /><circle cx="18" cy="14.5" r="0.4" />
        <circle cx="21" cy="12" r="0.4" /><circle cx="24" cy="12" r="0.4" />
        <circle cx="21" cy="14" r="0.4" /><circle cx="24" cy="14" r="0.4" />
      </g>
      {/* HARVESTER CUTTER BAR — front ram */}
      <rect x="3" y="13" width="2" height="6" rx="0.3" fill="#9a7050" stroke="#7a5030" strokeWidth="0.3" />
      {/* Cutter teeth */}
      <g fill="#b89060">
        <polygon points="3,13.5 2,14 3,14.5" />
        <polygon points="3,15 2,15.5 3,16" />
        <polygon points="3,16.5 2,17 3,17.5" />
        <polygon points="3,18 2,18.5 3,19" />
      </g>
      <line x1="4" y1="13" x2="4" y2="19" stroke="#b89060" strokeWidth="0.5" />
      {/* MACHINE GUN NEST — on top, behind gun shield */}
      <rect x="14" y="7" width="6" height="3.5" rx="0.5" fill="#6a4020" stroke="#5a3010" strokeWidth="0.4" />
      <path d="M14,7 Q17,5.5 20,7" fill="#7a5030" stroke="#5a3010" strokeWidth="0.4" />
      <rect x="12" y="8" width="3" height="1" rx="0.3" fill="#4a2a10" />
      {/* Ammunition belt */}
      <path d="M20,9 L22,10 L23,9.5 L24,10.5" fill="none" stroke="#b89060" strokeWidth="0.4" />
      {/* EXHAUST STACK — industrial, tilted */}
      <rect x="22" y="4" width="2.5" height="7" rx="0.7" fill="#6a4020" stroke="#5a3010" strokeWidth="0.3" />
      <ellipse cx="23.2" cy="3.5" rx="1.8" ry="0.7" fill="#7a5030" />
      <ellipse cx="23" cy="2" rx="3" ry="1.2" fill="#6a5a4a" opacity="0.3" />
      {/* VIEWPORTS — narrow industrial slits */}
      <rect x="7" y="12" width="3" height="0.8" rx="0.2" fill="#2a1a08" />
      <rect x="7" y="12.1" width="2.5" height="0.6" rx="0.2" fill={color} opacity="0.5" />
      {/* Revolutionary stencil */}
      <text x="16" y="18.5" textAnchor="middle" fontSize="1.8" fill="#c09050" opacity="0.35" style={{ fontFamily: "sans-serif", fontWeight: 700 }}>T·L</text>
      {/* Rust patch */}
      <ellipse cx="18" cy="16" rx="2" ry="1.5" fill="#4a2a10" opacity="0.2" />
    </svg>
  </g>
));

// Nations Souveraines — Marcheur-Tonnerre v3: handbuilt wood + copper machine,
// timber frame, hammered copper plates, bronze cast joints, rawhide bindings, antenna masts
export const IconNations = React.memo(({ cx, cy, size = 28, color = "#20B2AA" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* 4 LEGS — wood beams with copper/bronze joint castings */}
      {/* Front-left leg */}
      <g>
        <rect x="4" y="13" width="2.5" height="8" rx="0.3" fill="#6a5030" stroke="#4a3820" strokeWidth="0.3" />
        <line x1="4.8" y1="13.5" x2="4.8" y2="20.5" stroke="#5a4020" strokeWidth="0.2" />
        <line x1="5.8" y1="14" x2="5.8" y2="20" stroke="#5a4020" strokeWidth="0.2" />
        <circle cx="5.2" cy="21" r="1.5" fill="#8a7040" stroke="#6a5030" strokeWidth="0.4" />
        <circle cx="5.2" cy="21" r="0.5" fill="#a08850" />
        <rect x="3.5" y="22" width="2.5" height="6" rx="0.3" fill="#5a4020" stroke="#4a3820" strokeWidth="0.3" />
        <line x1="4.3" y1="22.5" x2="4.3" y2="27.5" stroke="#4a3018" strokeWidth="0.2" />
        <path d="M4,20 L6.5,20.5 M4.2,20.5 L6.3,21" stroke="#a09070" strokeWidth="0.4" />
        <rect x="2.5" y="28" width="4" height="1.5" rx="0.3" fill="#4a8878" stroke="#2a6858" strokeWidth="0.3" />
      </g>
      {/* Front-right leg */}
      <g>
        <rect x="25.5" y="13" width="2.5" height="8" rx="0.3" fill="#6a5030" stroke="#4a3820" strokeWidth="0.3" />
        <line x1="26.3" y1="13.5" x2="26.3" y2="20.5" stroke="#5a4020" strokeWidth="0.2" />
        <line x1="27.2" y1="14" x2="27.2" y2="20" stroke="#5a4020" strokeWidth="0.2" />
        <circle cx="26.8" cy="21" r="1.5" fill="#8a7040" stroke="#6a5030" strokeWidth="0.4" />
        <circle cx="26.8" cy="21" r="0.5" fill="#a08850" />
        <rect x="26" y="22" width="2.5" height="6" rx="0.3" fill="#5a4020" stroke="#4a3820" strokeWidth="0.3" />
        <line x1="26.8" y1="22.5" x2="26.8" y2="27.5" stroke="#4a3018" strokeWidth="0.2" />
        <path d="M25.5,20 L28,20.5 M25.7,20.5 L27.8,21" stroke="#a09070" strokeWidth="0.4" />
        <rect x="25.5" y="28" width="4" height="1.5" rx="0.3" fill="#4a8878" stroke="#2a6858" strokeWidth="0.3" />
      </g>
      {/* Back-left leg */}
      <g>
        <rect x="7" y="18" width="2.2" height="6.5" rx="0.3" fill="#5a4020" stroke="#4a3820" strokeWidth="0.3" />
        <line x1="7.7" y1="18.5" x2="7.7" y2="24" stroke="#4a3018" strokeWidth="0.2" />
        <circle cx="8.1" cy="24.5" r="1.2" fill="#8a7040" stroke="#6a5030" strokeWidth="0.3" />
        <rect x="6.5" y="25.5" width="2.2" height="4" rx="0.3" fill="#5a4020" />
        <rect x="5.5" y="29.5" width="3.5" height="1.2" rx="0.3" fill="#4a8878" stroke="#2a6858" strokeWidth="0.3" />
      </g>
      {/* Back-right leg */}
      <g>
        <rect x="22.8" y="18" width="2.2" height="6.5" rx="0.3" fill="#5a4020" stroke="#4a3820" strokeWidth="0.3" />
        <line x1="23.5" y1="18.5" x2="23.5" y2="24" stroke="#4a3018" strokeWidth="0.2" />
        <circle cx="23.9" cy="24.5" r="1.2" fill="#8a7040" stroke="#6a5030" strokeWidth="0.3" />
        <rect x="23.3" y="25.5" width="2.2" height="4" rx="0.3" fill="#5a4020" />
        <rect x="23" y="29.5" width="3.5" height="1.2" rx="0.3" fill="#4a8878" stroke="#2a6858" strokeWidth="0.3" />
      </g>
      {/* BODY — Timber frame chassis with copper plating */}
      <rect x="7" y="10" width="18" height="10" rx="1" fill="#5a4020" stroke="#4a3018" strokeWidth="0.5" />
      {/* Wood plank texture */}
      <line x1="7.5" y1="11" x2="7.5" y2="19.5" stroke="#4a3018" strokeWidth="0.3" />
      <line x1="11" y1="10.5" x2="11" y2="19.5" stroke="#4a3018" strokeWidth="0.3" />
      <line x1="16" y1="10.5" x2="16" y2="19.5" stroke="#4a3018" strokeWidth="0.3" />
      <line x1="21" y1="10.5" x2="21" y2="19.5" stroke="#4a3018" strokeWidth="0.3" />
      <line x1="24.5" y1="11" x2="24.5" y2="19.5" stroke="#4a3018" strokeWidth="0.3" />
      {/* Hammered copper armor plates — irregular, handmade */}
      <path d="M9,11 L14,10.5 L14,15 L9,15.5Z" fill="#3a8a7a" stroke="#2a6a5a" strokeWidth="0.4" opacity="0.8" />
      <path d="M17,11 L23,10.5 L23,14.5 L17,15Z" fill="#4a9a8a" stroke="#2a6a5a" strokeWidth="0.4" opacity="0.75" />
      <path d="M9,16 L15,15.5 L15,19 L9,19.5Z" fill="#4a9a8a" stroke="#2a6a5a" strokeWidth="0.4" opacity="0.7" />
      {/* Copper plate hammer marks */}
      <g fill="#5aaa9a" opacity="0.3">
        <circle cx="11" cy="12.5" r="0.6" /><circle cx="12.5" cy="13.5" r="0.5" />
        <circle cx="19" cy="12" r="0.5" /><circle cx="21" cy="13" r="0.6" />
        <circle cx="11.5" cy="17.5" r="0.5" />
      </g>
      {/* Bronze rivets — handcast, irregular spacing */}
      <g fill="#a08850">
        <circle cx="9.5" cy="11.5" r="0.4" /><circle cx="13.5" cy="11" r="0.4" />
        <circle cx="9.5" cy="15" r="0.4" /><circle cx="13.5" cy="14.8" r="0.4" />
        <circle cx="17.5" cy="11.2" r="0.4" /><circle cx="22.5" cy="11" r="0.4" />
        <circle cx="17.5" cy="14.5" r="0.4" /><circle cx="22.5" cy="14.3" r="0.4" />
        <circle cx="9.5" cy="16.5" r="0.4" /><circle cx="14.5" cy="16" r="0.4" />
      </g>
      {/* Tribal geometric patterns etched into copper */}
      <g stroke="#60c0b0" strokeWidth="0.3" fill="none" opacity="0.5">
        <path d="M10,12 L11,11.5 L12,12 L11,12.5Z" />
        <path d="M19,12 L20.5,11.5 L22,12 L20.5,12.5Z" />
        <path d="M10,17 L11.5,16.5 L13,17 L11.5,17.5Z" />
      </g>
      {/* Rawhide lashings holding copper to wood */}
      <g stroke="#a09070" strokeWidth="0.4">
        <path d="M9,13 L7.5,13.5 M9,14 L7.5,14.5" />
        <path d="M23,12 L24.5,12.5 M23,13 L24.5,13.5" />
      </g>
      {/* HEAD — angular wood+copper box */}
      <rect x="10" y="5.5" width="12" height="5" rx="0.8" fill="#5a4020" stroke="#4a3018" strokeWidth="0.5" />
      <rect x="11" y="6" width="10" height="3.5" rx="0.5" fill="#3a8a7a" stroke="#2a6a5a" strokeWidth="0.4" />
      {/* VIEWPORTS — narrow horizontal slits, copper-rimmed */}
      <rect x="12" y="7" width="3.5" height="0.8" rx="0.2" fill="#0a2a28" />
      <rect x="12.2" y="7.1" width="3" height="0.6" rx="0.2" fill="#60d8c8" opacity="0.7" />
      <rect x="17" y="7" width="3.5" height="0.8" rx="0.2" fill="#0a2a28" />
      <rect x="17.2" y="7.1" width="3" height="0.6" rx="0.2" fill="#60d8c8" opacity="0.7" />
      {/* Bronze jaw piece */}
      <rect x="12" y="8.5" width="8" height="1.5" rx="0.3" fill="#8a7040" />
      <line x1="13" y1="9" x2="19" y2="9" stroke="#6a5030" strokeWidth="0.3" />
      <line x1="13.5" y1="9.5" x2="18.5" y2="9.5" stroke="#6a5030" strokeWidth="0.3" />
      {/* ANTENNA MASTS — wood poles with copper sensor tips */}
      <g>
        <line x1="12" y1="6" x2="7" y2="1" stroke="#6a5030" strokeWidth="1" strokeLinecap="round" />
        <line x1="9" y1="4" x2="7.5" y2="3.5" stroke="#5a4020" strokeWidth="0.5" />
        <rect x="5.5" y="0" width="2.5" height="1.5" rx="0.3" fill="#4a9a8a" stroke="#2a6a5a" strokeWidth="0.3" />
        <circle cx="6.8" cy="0.7" r="0.4" fill="#80fff0" opacity="0.7" />
        <path d="M11.5,6 L12.5,5.5 M11.8,6.5 L12.8,6" stroke="#a09070" strokeWidth="0.4" />
        <line x1="20" y1="6" x2="25" y2="1" stroke="#6a5030" strokeWidth="1" strokeLinecap="round" />
        <line x1="23" y1="4" x2="24.5" y2="3.5" stroke="#5a4020" strokeWidth="0.5" />
        <rect x="24" y="0" width="2.5" height="1.5" rx="0.3" fill="#4a9a8a" stroke="#2a6a5a" strokeWidth="0.3" />
        <circle cx="25.2" cy="0.7" r="0.4" fill="#80fff0" opacity="0.7" />
        <path d="M19.5,6 L20.5,5.5 M19.8,6.5 L20.8,6" stroke="#a09070" strokeWidth="0.4" />
      </g>
      {/* SPINE RIFLE — long copper barrel along the top */}
      <rect x="8" y="9.5" width="14" height="0.8" rx="0.2" fill="#4a8878" stroke="#2a6a5a" strokeWidth="0.2" />
      <rect x="3" y="9.6" width="5.5" height="0.6" rx="0.2" fill="#3a7868" />
      {/* Small copper exhaust vent */}
      <rect x="22" y="8" width="1.5" height="2.5" rx="0.4" fill="#4a8878" stroke="#2a6a5a" strokeWidth="0.2" />
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

// ═══════════════════════════════════════════════════════════════════
// HERO ICONS — unique silhouette per faction hero
// ═══════════════════════════════════════════════════════════════════

// Confédération — J. Cole: cavalry officer on horseback with sabre
export const HeroConfederation = React.memo(({ cx, cy, size = 24, color = "#808080" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Horse body */}
      <ellipse cx="16" cy="20" rx="9" ry="4" fill={color + "44"} stroke={color} strokeWidth="0.6" />
      {/* Horse legs */}
      <rect x="9" y="23" width="1.5" height="5" rx="0.3" fill={color + "55"} stroke={color} strokeWidth="0.3" />
      <rect x="13" y="24" width="1.5" height="4.5" rx="0.3" fill={color + "44"} stroke={color} strokeWidth="0.3" />
      <rect x="18" y="24" width="1.5" height="4.5" rx="0.3" fill={color + "44"} stroke={color} strokeWidth="0.3" />
      <rect x="22" y="23" width="1.5" height="5" rx="0.3" fill={color + "55"} stroke={color} strokeWidth="0.3" />
      {/* Horse neck + head */}
      <path d="M23,18 L27,12 L29,11 L28,13 L25,17" fill={color + "44"} stroke={color} strokeWidth="0.5" />
      {/* Rider torso */}
      <rect x="14" y="11" width="5" height="8" rx="1" fill={color + "66"} stroke={color} strokeWidth="0.5" />
      {/* Rider head (kepi hat) */}
      <circle cx="16.5" cy="8" r="2.5" fill={color + "55"} stroke={color} strokeWidth="0.5" />
      <rect x="13.5" y="6.5" width="6" height="1.5" rx="0.3" fill={color + "77"} stroke={color} strokeWidth="0.3" />
      {/* Sabre raised */}
      <path d="M19,12 L22,5 L23,4 L22.5,6 L20,12" fill={color + "88"} stroke={color} strokeWidth="0.4" />
      {/* Star on chest */}
      <polygon points="16.5,14 17,15 18,15 17.2,15.6 17.5,16.5 16.5,16 15.5,16.5 15.8,15.6 15,15 16,15" fill={color} opacity="0.6" />
    </svg>
  </g>
));

// Frente Libre — E. Rojas: revolutionary with rifle and bandolier
export const HeroFrente = React.memo(({ cx, cy, size = 24, color = "#A05020" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Legs */}
      <rect x="12" y="22" width="3" height="7" rx="0.5" fill={color + "55"} stroke={color} strokeWidth="0.4" />
      <rect x="17" y="22" width="3" height="7" rx="0.5" fill={color + "55"} stroke={color} strokeWidth="0.4" />
      {/* Body */}
      <rect x="11" y="12" width="10" height="11" rx="1.5" fill={color + "55"} stroke={color} strokeWidth="0.6" />
      {/* Bandolier diagonal */}
      <line x1="12" y1="13" x2="20" y2="22" stroke={color} strokeWidth="1" opacity="0.6" />
      <circle cx="13.5" cy="15" r="0.5" fill={color + "88"} />
      <circle cx="15" cy="17" r="0.5" fill={color + "88"} />
      <circle cx="16.5" cy="19" r="0.5" fill={color + "88"} />
      {/* Head (sombrero) */}
      <circle cx="16" cy="8" r="3" fill={color + "55"} stroke={color} strokeWidth="0.5" />
      <ellipse cx="16" cy="6.5" rx="6" ry="1.2" fill={color + "66"} stroke={color} strokeWidth="0.4" />
      <rect x="13" y="4.5" width="6" height="2.5" rx="1.5" fill={color + "55"} stroke={color} strokeWidth="0.3" />
      {/* Rifle held diagonally */}
      <line x1="22" y1="8" x2="10" y2="26" stroke="#5a3a20" strokeWidth="1.2" />
      <rect x="21" y="6" width="1.5" height="3" rx="0.3" fill="#4a2a10" />
      {/* Mustache */}
      <path d="M14.5,9 Q16,10.5 17.5,9" fill="none" stroke={color} strokeWidth="0.5" />
    </svg>
  </g>
));

// Nations Souveraines — Aiyana: indigenous leader with staff and feathers
export const HeroNations = React.memo(({ cx, cy, size = 24, color = "#20B2AA" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Legs */}
      <rect x="12" y="22" width="3" height="7" rx="0.5" fill="#5a4020" stroke={color} strokeWidth="0.3" />
      <rect x="17" y="22" width="3" height="7" rx="0.5" fill="#5a4020" stroke={color} strokeWidth="0.3" />
      {/* Body — leather tunic */}
      <path d="M11,13 L16,12 L21,13 L20,23 L12,23Z" fill="#6a5030" stroke={color} strokeWidth="0.5" />
      {/* Fringe on tunic */}
      <g stroke={color} strokeWidth="0.3" opacity="0.5">
        <line x1="12" y1="23" x2="11.5" y2="25" /><line x1="14" y1="23" x2="13.5" y2="25" />
        <line x1="16" y1="23" x2="16" y2="25" /><line x1="18" y1="23" x2="18.5" y2="25" />
        <line x1="20" y1="23" x2="20.5" y2="25" />
      </g>
      {/* Head */}
      <circle cx="16" cy="9" r="3" fill="#8a6a40" stroke={color} strokeWidth="0.5" />
      {/* Feather headdress */}
      <path d="M16,6 L14,1 L15,3 L16,0.5 L17,3 L18,1 L16,6" fill={color + "66"} stroke={color} strokeWidth="0.4" />
      <path d="M13,7 L10,3 L12,5" fill={color + "55"} stroke={color} strokeWidth="0.3" />
      <path d="M19,7 L22,3 L20,5" fill={color + "55"} stroke={color} strokeWidth="0.3" />
      {/* Staff with glowing crystal */}
      <line x1="7" y1="4" x2="9" y2="28" stroke="#6a5030" strokeWidth="1" />
      <circle cx="7" cy="4" r="1.5" fill={color} opacity="0.7" />
      <circle cx="7" cy="4" r="0.7" fill="#fff" opacity="0.4" />
      {/* Tribal necklace */}
      <path d="M13,12 Q16,14 19,12" fill="none" stroke={color} strokeWidth="0.6" opacity="0.6" />
      <circle cx="16" cy="13.5" r="0.8" fill={color} opacity="0.5" />
    </svg>
  </g>
));

// Acadiane — M. Thibodeau: trapper/explorer with lantern and paddle
export const HeroAcadiane = React.memo(({ cx, cy, size = 24, color = "#228B22" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Legs (wading boots) */}
      <rect x="12" y="22" width="3" height="7" rx="0.5" fill="#4a3a20" stroke={color} strokeWidth="0.3" />
      <rect x="17" y="22" width="3" height="7" rx="0.5" fill="#4a3a20" stroke={color} strokeWidth="0.3" />
      <rect x="11" y="27" width="5" height="2" rx="0.5" fill="#3a2a15" />
      <rect x="16" y="27" width="5" height="2" rx="0.5" fill="#3a2a15" />
      {/* Body — heavy coat */}
      <path d="M10,13 L16,11 L22,13 L21,23 L11,23Z" fill={color + "44"} stroke={color} strokeWidth="0.6" />
      {/* Coat buttons */}
      <circle cx="16" cy="15" r="0.5" fill={color} opacity="0.5" />
      <circle cx="16" cy="17.5" r="0.5" fill={color} opacity="0.5" />
      <circle cx="16" cy="20" r="0.5" fill={color} opacity="0.5" />
      {/* Head (trapper hat with fur) */}
      <circle cx="16" cy="8" r="3" fill="#5a4a30" stroke={color} strokeWidth="0.5" />
      <path d="M12,7 L12,5 L20,5 L20,7" fill="#6a5a3a" stroke={color} strokeWidth="0.3" />
      <ellipse cx="16" cy="5" rx="5" ry="1" fill="#7a6a4a" stroke={color} strokeWidth="0.2" />
      {/* Lantern held left */}
      <line x1="9" y1="14" x2="8" y2="18" stroke={color} strokeWidth="0.5" />
      <rect x="6.5" y="18" width="3" height="4" rx="0.5" fill={color + "33"} stroke={color} strokeWidth="0.4" />
      <circle cx="8" cy="20" r="1" fill="#FFD700" opacity="0.6" />
      <circle cx="8" cy="20" r="0.5" fill="#fff" opacity="0.4" />
      {/* Paddle held right */}
      <line x1="23" y1="10" x2="25" y2="28" stroke="#5a4020" strokeWidth="0.8" />
      <ellipse cx="25.5" cy="28" rx="1.5" ry="3" fill="#6a5030" stroke="#4a3020" strokeWidth="0.3" />
    </svg>
  </g>
));

// Bayou — Cap. Zeke: pirate captain with harpoon and hook
export const HeroBayou = React.memo(({ cx, cy, size = 24, color = "#7B2D8B" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Peg leg + normal leg */}
      <rect x="12" y="22" width="3" height="7" rx="0.5" fill={color + "55"} stroke={color} strokeWidth="0.4" />
      <line x1="18.5" y1="22" x2="18.5" y2="29" stroke="#6a5030" strokeWidth="1.5" />
      <circle cx="18.5" cy="29" r="1" fill="#6a5030" />
      {/* Body — captain coat */}
      <path d="M10,13 L16,11 L22,13 L21,23 L11,23Z" fill={color + "55"} stroke={color} strokeWidth="0.6" />
      {/* Coat flaps */}
      <path d="M11,23 L9,27" stroke={color} strokeWidth="0.4" />
      <path d="M21,23 L23,27" stroke={color} strokeWidth="0.4" />
      {/* Belt + buckle */}
      <rect x="11" y="19" width="10" height="1.5" rx="0.3" fill={color + "44"} stroke={color} strokeWidth="0.3" />
      <rect x="15" y="18.5" width="2" height="2.5" rx="0.3" fill="#FFD700" opacity="0.5" />
      {/* Head (tricorn hat) */}
      <circle cx="16" cy="8" r="2.8" fill={color + "55"} stroke={color} strokeWidth="0.5" />
      <path d="M11,7 L16,5 L21,7 L19,8 L13,8Z" fill={color + "77"} stroke={color} strokeWidth="0.4" />
      {/* Skull emblem on hat */}
      <circle cx="16" cy="5.8" r="0.8" fill="#fff" opacity="0.3" />
      {/* Eye patch */}
      <line x1="14" y1="7.5" x2="17.5" y2="7.5" stroke={color} strokeWidth="0.5" />
      <rect x="14" y="7" width="2" height="1.5" rx="0.3" fill="#1a1a1a" opacity="0.6" />
      {/* Harpoon held right */}
      <line x1="24" y1="3" x2="22" y2="26" stroke="#6a5030" strokeWidth="1" />
      <polygon points="24,3 23,1 25,1 24.5,4" fill={color + "88"} stroke={color} strokeWidth="0.3" />
      {/* Hook hand left */}
      <path d="M9,15 L7,16 Q6,17 7,18" fill="none" stroke="#888" strokeWidth="0.8" />
    </svg>
  </g>
));

// Dominion — Col. Whitfield: imperial officer with sword and medals
export const HeroDominion = React.memo(({ cx, cy, size = 24, color = "#CC2222" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Legs (polished boots) */}
      <rect x="12" y="22" width="3" height="7" rx="0.5" fill="#2a2a2a" stroke={color} strokeWidth="0.3" />
      <rect x="17" y="22" width="3" height="7" rx="0.5" fill="#2a2a2a" stroke={color} strokeWidth="0.3" />
      {/* Body — military dress uniform */}
      <rect x="11" y="12" width="10" height="11" rx="1" fill={color + "55"} stroke={color} strokeWidth="0.6" />
      {/* Epaulettes */}
      <ellipse cx="11" cy="13" rx="2" ry="1" fill="#FFD700" opacity="0.4" stroke={color} strokeWidth="0.3" />
      <ellipse cx="21" cy="13" rx="2" ry="1" fill="#FFD700" opacity="0.4" stroke={color} strokeWidth="0.3" />
      {/* Medals on chest */}
      <circle cx="14" cy="16" r="0.8" fill="#FFD700" opacity="0.5" />
      <circle cx="16" cy="15.5" r="0.8" fill="#C0C0C0" opacity="0.5" />
      <circle cx="18" cy="16" r="0.8" fill="#FFD700" opacity="0.5" />
      {/* Belt + sash */}
      <rect x="11" y="20" width="10" height="1.2" rx="0.3" fill="#FFD700" opacity="0.3" />
      <line x1="12" y1="13" x2="20" y2="20" stroke={color + "88"} strokeWidth="0.8" />
      {/* Head (officer cap) */}
      <circle cx="16" cy="8" r="2.8" fill="#2a2a2a" stroke={color} strokeWidth="0.5" />
      <rect x="12.5" y="5.5" width="7" height="2" rx="0.5" fill="#2a2a2a" stroke={color} strokeWidth="0.3" />
      <rect x="13" y="5.5" width="6" height="0.8" rx="0.2" fill="#FFD700" opacity="0.4" />
      {/* Sword at side */}
      <line x1="22" y1="14" x2="24" y2="28" stroke="#888" strokeWidth="0.8" />
      <rect x="21.5" y="13" width="1.5" height="2.5" rx="0.3" fill="#FFD700" opacity="0.5" />
      <line x1="20.5" y1="15" x2="23.5" y2="15" stroke="#888" strokeWidth="0.6" />
    </svg>
  </g>
));

// ═══════════════════════════════════════════════════════════════════
// WORKER ICONS — unique silhouette per faction
// ═══════════════════════════════════════════════════════════════════

// Confédération — Industrial worker with wrench and flat cap
export const WorkerConfederation = React.memo(({ cx, cy, size = 16, color = "#808080" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Legs */}
      <rect x="12" y="22" width="3" height="7" rx="0.5" fill={color + "55"} stroke={color} strokeWidth="0.5" />
      <rect x="17" y="22" width="3" height="7" rx="0.5" fill={color + "55"} stroke={color} strokeWidth="0.5" />
      {/* Body — overalls */}
      <rect x="11" y="13" width="10" height="10" rx="1" fill={color + "44"} stroke={color} strokeWidth="0.6" />
      {/* Suspenders */}
      <line x1="13" y1="13" x2="14" y2="23" stroke={color} strokeWidth="0.5" opacity="0.6" />
      <line x1="19" y1="13" x2="18" y2="23" stroke={color} strokeWidth="0.5" opacity="0.6" />
      {/* Head + flat cap */}
      <circle cx="16" cy="9" r="3" fill={color + "55"} stroke={color} strokeWidth="0.5" />
      <path d="M12,8 L13,5.5 L19,5.5 L20,8" fill={color + "66"} stroke={color} strokeWidth="0.3" />
      <rect x="11" y="7.5" width="10" height="1" rx="0.3" fill={color + "77"} />
      {/* Wrench */}
      <line x1="22" y1="14" x2="24" y2="22" stroke="#666" strokeWidth="1" />
      <circle cx="24.5" cy="22.5" r="1.5" fill="none" stroke="#666" strokeWidth="0.8" />
    </svg>
  </g>
));

// Frente Libre — Campesino worker with hoe and straw hat
export const WorkerFrente = React.memo(({ cx, cy, size = 16, color = "#A05020" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Legs */}
      <rect x="12" y="22" width="3" height="7" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.5" />
      <rect x="17" y="22" width="3" height="7" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.5" />
      {/* Body */}
      <rect x="11" y="13" width="10" height="10" rx="1" fill={color + "44"} stroke={color} strokeWidth="0.6" />
      {/* Head + straw hat */}
      <circle cx="16" cy="9" r="3" fill="#8a6a40" stroke={color} strokeWidth="0.5" />
      <ellipse cx="16" cy="7" rx="6" ry="1.2" fill="#c8a860" stroke={color} strokeWidth="0.3" />
      <rect x="13" y="5" width="6" height="2.5" rx="2" fill="#b89850" stroke={color} strokeWidth="0.3" />
      {/* Hoe */}
      <line x1="7" y1="6" x2="9" y2="28" stroke="#5a3a20" strokeWidth="1" />
      <path d="M6,5 L8,5 L8,7 L5,7Z" fill="#666" stroke="#444" strokeWidth="0.3" />
    </svg>
  </g>
));

// Nations Souveraines — Tribal gatherer with basket
export const WorkerNations = React.memo(({ cx, cy, size = 16, color = "#20B2AA" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Legs */}
      <rect x="12" y="22" width="3" height="7" rx="0.5" fill="#5a4020" stroke={color} strokeWidth="0.4" />
      <rect x="17" y="22" width="3" height="7" rx="0.5" fill="#5a4020" stroke={color} strokeWidth="0.4" />
      {/* Body — leather tunic */}
      <path d="M11,13 L16,12 L21,13 L20,23 L12,23Z" fill="#6a5030" stroke={color} strokeWidth="0.5" />
      {/* Head + headband */}
      <circle cx="16" cy="9" r="3" fill="#8a6a40" stroke={color} strokeWidth="0.5" />
      <rect x="12" y="7.5" width="8" height="1.2" rx="0.3" fill={color + "66"} stroke={color} strokeWidth="0.3" />
      {/* Feather */}
      <path d="M20,7.5 L22,4 L21,6" fill={color + "55"} stroke={color} strokeWidth="0.3" />
      {/* Basket on back */}
      <path d="M21,14 L25,13 L26,20 L22,21Z" fill="#8a7040" stroke="#6a5030" strokeWidth="0.4" />
      <line x1="22" y1="14" x2="25" y2="14" stroke="#6a5030" strokeWidth="0.3" />
      <line x1="22.5" y1="17" x2="25.5" y2="17" stroke="#6a5030" strokeWidth="0.3" />
    </svg>
  </g>
));

// Acadiane — Swamp fisherman with net
export const WorkerAcadiane = React.memo(({ cx, cy, size = 16, color = "#228B22" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Legs (wading) */}
      <rect x="12" y="22" width="3" height="7" rx="0.5" fill="#4a3a20" stroke={color} strokeWidth="0.4" />
      <rect x="17" y="22" width="3" height="7" rx="0.5" fill="#4a3a20" stroke={color} strokeWidth="0.4" />
      {/* Body */}
      <rect x="11" y="13" width="10" height="10" rx="1" fill={color + "44"} stroke={color} strokeWidth="0.6" />
      {/* Head + wide-brim hat */}
      <circle cx="16" cy="9" r="3" fill="#5a4a30" stroke={color} strokeWidth="0.5" />
      <ellipse cx="16" cy="7" rx="6" ry="1" fill={color + "55"} stroke={color} strokeWidth="0.3" />
      <rect x="13" y="5" width="6" height="2.5" rx="1.5" fill={color + "44"} stroke={color} strokeWidth="0.3" />
      {/* Net draped */}
      <path d="M22,14 L26,10 L28,14 L26,18 L22,16" fill="none" stroke={color} strokeWidth="0.4" opacity="0.6" />
      <line x1="23" y1="11" x2="25" y2="17" stroke={color} strokeWidth="0.3" opacity="0.4" />
      <line x1="24" y1="10.5" x2="27" y2="15" stroke={color} strokeWidth="0.3" opacity="0.4" />
      <line x1="23" y1="13" x2="27" y2="13" stroke={color} strokeWidth="0.3" opacity="0.4" />
    </svg>
  </g>
));

// Bayou — Swamp scavenger with grappling hook
export const WorkerBayou = React.memo(({ cx, cy, size = 16, color = "#7B2D8B" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Legs */}
      <rect x="12" y="22" width="3" height="7" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.4" />
      <rect x="17" y="22" width="3" height="7" rx="0.5" fill={color + "44"} stroke={color} strokeWidth="0.4" />
      {/* Body — ragged vest */}
      <rect x="11" y="13" width="10" height="10" rx="1" fill={color + "44"} stroke={color} strokeWidth="0.6" />
      <path d="M11,13 L13,23" fill="none" stroke={color} strokeWidth="0.4" opacity="0.5" />
      <path d="M21,13 L19,23" fill="none" stroke={color} strokeWidth="0.4" opacity="0.5" />
      {/* Head + bandana */}
      <circle cx="16" cy="9" r="3" fill={color + "55"} stroke={color} strokeWidth="0.5" />
      <path d="M12,8 L16,6 L20,8" fill={color + "66"} stroke={color} strokeWidth="0.3" />
      <line x1="20" y1="8" x2="23" y2="10" stroke={color} strokeWidth="0.4" />
      {/* Grappling hook */}
      <line x1="7" y1="8" x2="9" y2="18" stroke="#666" strokeWidth="0.8" />
      <path d="M6,7 L7,5 L8,7" fill="none" stroke="#666" strokeWidth="0.6" />
      <path d="M5.5,7 L6,8" stroke="#666" strokeWidth="0.5" />
      <path d="M8.5,7 L8,8" stroke="#666" strokeWidth="0.5" />
    </svg>
  </g>
));

// Dominion — Imperial laborer with pickaxe and uniform
export const WorkerDominion = React.memo(({ cx, cy, size = 16, color = "#CC2222" }) => (
  <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
    <svg width={size} height={size} viewBox="0 0 32 32">
      {/* Legs */}
      <rect x="12" y="22" width="3" height="7" rx="0.5" fill="#3a3a3a" stroke={color} strokeWidth="0.4" />
      <rect x="17" y="22" width="3" height="7" rx="0.5" fill="#3a3a3a" stroke={color} strokeWidth="0.4" />
      {/* Body — uniform */}
      <rect x="11" y="13" width="10" height="10" rx="1" fill={color + "44"} stroke={color} strokeWidth="0.6" />
      {/* Cross insignia */}
      <line x1="16" y1="15" x2="16" y2="20" stroke={color} strokeWidth="0.6" opacity="0.4" />
      <line x1="13.5" y1="17.5" x2="18.5" y2="17.5" stroke={color} strokeWidth="0.6" opacity="0.4" />
      {/* Head + helmet */}
      <circle cx="16" cy="9" r="3" fill="#3a3a3a" stroke={color} strokeWidth="0.5" />
      <path d="M12,9 L12,6 L20,6 L20,9" fill="#4a4a4a" stroke={color} strokeWidth="0.3" />
      <rect x="11" y="8.5" width="10" height="1" rx="0.3" fill={color + "55"} />
      {/* Pickaxe */}
      <line x1="23" y1="10" x2="25" y2="26" stroke="#5a4020" strokeWidth="0.8" />
      <path d="M22,9 L24,9 L25,11 L21,11Z" fill="#666" stroke="#444" strokeWidth="0.3" />
    </svg>
  </g>
));

// ═══════════════════════════════════════════════════════════════════
// ICON MAPS
// ═══════════════════════════════════════════════════════════════════

// Map faction id to mech icon component
export const FACTION_ICON_MAP = {
  confederation: IconConfederation,
  frente: IconFrente,
  nations: IconNations,
  acadiane: IconAcadiane,
  bayou: IconBayou,
  dominion: IconDominion,
};

// Map faction id to hero icon component
export const HERO_ICON_MAP = {
  confederation: HeroConfederation,
  frente: HeroFrente,
  nations: HeroNations,
  acadiane: HeroAcadiane,
  bayou: HeroBayou,
  dominion: HeroDominion,
};

// Map faction id to worker icon component
export const WORKER_ICON_MAP = {
  confederation: WorkerConfederation,
  frente: WorkerFrente,
  nations: WorkerNations,
  acadiane: WorkerAcadiane,
  bayou: WorkerBayou,
  dominion: WorkerDominion,
};
