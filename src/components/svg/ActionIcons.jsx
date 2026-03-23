import React from 'react';

// ═══ SVG Resource Icons (16-18px, monochrome, stroke 1-1.5px) ═══

export const IconMetal = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="8,1 14,4.5 14,11.5 8,15 2,11.5 2,4.5" />
    <circle cx="8" cy="8" r="2" fill={color} stroke="none" opacity="0.6" />
  </svg>
);

export const IconWood = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round">
    <ellipse cx="8" cy="3.5" rx="4" ry="2.5" />
    <line x1="4" y1="3.5" x2="4" y2="12.5" />
    <line x1="12" y1="3.5" x2="12" y2="12.5" />
    <ellipse cx="8" cy="12.5" rx="4" ry="2.5" />
  </svg>
);

export const IconFood = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round">
    <path d="M8 2 L8 14" />
    <path d="M8 4 L5 2" /><path d="M8 4 L11 2" />
    <path d="M8 6 L4.5 4" /><path d="M8 6 L11.5 4" />
    <path d="M8 8 L5 6.5" /><path d="M8 8 L11 6.5" />
    <path d="M8 10 L5.5 8.5" /><path d="M8 10 L10.5 8.5" />
  </svg>
);

export const IconOil = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="8" height="10" rx="1" />
    <rect x="6" y="2" width="4" height="3" rx="0.5" />
    <line x1="6" y1="8" x2="10" y2="8" />
  </svg>
);

export const IconCoin = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round">
    <circle cx="8" cy="8" r="6" />
    <text x="8" y="11" textAnchor="middle" fontSize="8" fill={color} stroke="none" fontWeight="700" fontFamily="serif">$</text>
  </svg>
);

export const IconCard = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="2" width="10" height="12" rx="1.5" />
    <line x1="5.5" y1="5" x2="10.5" y2="5" />
    <line x1="5.5" y1="7.5" x2="10.5" y2="7.5" />
    <line x1="5.5" y1="10" x2="8.5" y2="10" />
  </svg>
);

export const IconPower = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="9,1 4,9 7.5,9 7,15 12,7 8.5,7" fill={color} fillOpacity="0.15" />
  </svg>
);

export const IconPop = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 14 C8 14 2 10 2 6.5 C2 4 4 2 6 2 C7 2 7.6 2.5 8 3 C8.4 2.5 9 2 10 2 C12 2 14 4 14 6.5 C14 10 8 14 8 14Z" fill={color} fillOpacity="0.15" />
  </svg>
);

export const IconWorker = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round">
    <circle cx="8" cy="5" r="3" />
    <path d="M3 14 C3 10.5 5 9 8 9 C11 9 13 10.5 13 14" />
  </svg>
);

export const IconMech = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="8,2 14,8 8,14 2,8" fill={color} fillOpacity="0.1" />
  </svg>
);

// Map resource name to icon component
export const RESOURCE_ICONS = {
  metal: IconMetal,
  bois: IconWood,
  nourriture: IconFood,
  petrole: IconOil,
  coins: IconCoin,
  combatCards: IconCard,
  power: IconPower,
  pop: IconPop,
  worker: IconWorker,
  mech: IconMech,
};

// ═══ ActionSquare — colored square with icon inside ═══
export function ActionSquare({ type = "cost", resource, size = 24, children }) {
  const bg = type === "cost" ? "var(--cost-bg)" : type === "gain" ? "var(--gain-bg)" : "#4A4A3A";
  const border = type === "cost" ? "var(--cost-border)" : type === "gain" ? "var(--gain-border)" : "#5A5A4A";
  const Icon = RESOURCE_ICONS[resource];
  const iconSize = Math.round(size * 0.65);
  return (
    <div style={{
      width: size, height: size, borderRadius: 3,
      background: bg, border: `1.5px solid ${border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {Icon ? <Icon size={iconSize} color="rgba(255,255,255,0.9)" /> : children}
    </div>
  );
}

// ═══ OrPill — "ou" separator ═══
export function OrPill() {
  return (
    <span style={{
      fontSize: 9, color: "var(--text-dim)", background: "#4A4A3A",
      borderRadius: 10, padding: "1px 6px", flexShrink: 0,
      fontFamily: "var(--font-body)", fontStyle: "italic",
    }}>ou</span>
  );
}

// ═══ ActionRow — PAY → GAIN layout ═══
export function ActionRow({ pay = [], gain = [], altGain, compact = false }) {
  const sqSize = compact ? 20 : 24;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
      {pay.length > 0 && <>
        {pay.map((r, i) => <ActionSquare key={`p${i}`} type="cost" resource={r} size={sqSize} />)}
        <span style={{ color: "var(--text-muted)", fontSize: 10, margin: "0 1px" }}>→</span>
      </>}
      {gain.map((r, i) => <ActionSquare key={`g${i}`} type="gain" resource={r} size={sqSize} />)}
      {altGain && <>
        <OrPill />
        {altGain.map((r, i) => <ActionSquare key={`a${i}`} type="gain" resource={r} size={sqSize} />)}
      </>}
    </div>
  );
}

// ═══ CubeSlots — upgrade cube visualization ═══
export function CubeSlots({ total, filled, size = 8 }) {
  if (total <= 0) return null;
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: size, height: size, borderRadius: 2,
          background: i < filled ? "var(--cube-active)" : "transparent",
          border: i < filled ? "1px solid var(--cube-border)" : "1px solid #555",
          opacity: i < filled ? 0.85 : 0.4,
        }} />
      ))}
    </div>
  );
}
