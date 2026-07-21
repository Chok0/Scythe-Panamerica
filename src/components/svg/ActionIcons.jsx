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
    {/* Marcheur de combat : antenne, cockpit bombé, hublot, jambes écartées */}
    <path d="M8 3 V1.5" />
    <path d="M4.5 8.5 V6.5 C4.5 4.4 6 3 8 3 C10 3 11.5 4.4 11.5 6.5 V8.5 Z" fill={color} fillOpacity="0.12" />
    <circle cx="8" cy="5.8" r="1" fill={color} stroke="none" opacity="0.6" />
    <path d="M5.5 8.5 L4.5 13" />
    <path d="M10.5 8.5 L11.5 13" />
    <path d="M3 13 H6" />
    <path d="M10 13 H13" />
  </svg>
);

// Amélioration : la ROUE DENTÉE traditionnelle (le lingot du métal reste
// hexagonal — pas de collision visuelle entre les deux)
export const IconUpgrade = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round">
    <circle cx="8" cy="8" r="3.4" />
    <circle cx="8" cy="8" r="1.2" fill={color} stroke="none" opacity="0.6" />
    <line x1="8" y1="4.6" x2="8" y2="2.6" />
    <line x1="8" y1="11.4" x2="8" y2="13.4" />
    <line x1="4.6" y1="8" x2="2.6" y2="8" />
    <line x1="11.4" y1="8" x2="13.4" y2="8" />
    <line x1="10.4" y1="5.6" x2="11.82" y2="4.18" />
    <line x1="10.4" y1="10.4" x2="11.82" y2="11.82" />
    <line x1="5.6" y1="10.4" x2="4.18" y2="11.82" />
    <line x1="5.6" y1="5.6" x2="4.18" y2="4.18" />
  </svg>
);

// Construction : le marteau
export const IconHammer = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.8" y="2.2" width="6.4" height="3.6" rx="0.8" transform="rotate(45 6 4)" fill={color} fillOpacity="0.12" />
    <path d="M8.2 7.8 L13.5 13.1" />
  </svg>
);

// Enrôlement : deux silhouettes (la recrue rejoint les rangs)
export const IconRecruit = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round">
    <circle cx="5.5" cy="5" r="2.4" />
    <path d="M1.5 14 C1.5 11 3.2 9.5 5.5 9.5 C7.8 9.5 9.5 11 9.5 14" />
    <circle cx="11.5" cy="4.5" r="1.9" opacity="0.75" />
    <path d="M9.6 13.5 C10 10.8 10.6 9.2 11.9 9.2 C13.4 9.2 14.3 10.8 14.6 13.5" opacity="0.75" />
  </svg>
);

// ═══ SVG Building Icons — même vocabulaire graphique (trait simple, silhouette
// unique, pas de détail interne fin) pour rester lisible à 16-18px. ═══

export const IconArsenal = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5 L13 3.5 V8 C13 11.5 10.5 13.5 8 14.5 C5.5 13.5 3 11.5 3 8 V3.5 Z" />
    <path d="M8 4.5 V11" />
    <path d="M5.5 6.5 H10.5" />
  </svg>
);

export const IconMemorial = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 14 L6.5 5 L8 2 L9.5 5 L9.5 14 Z" />
    <line x1="4.5" y1="14" x2="11.5" y2="14" />
  </svg>
);

export const IconGare = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="5" width="11" height="6" rx="1.5" />
    <circle cx="5.5" cy="13" r="1.3" />
    <circle cx="10.5" cy="13" r="1.3" />
    <line x1="5" y1="2" x2="5" y2="5" />
  </svg>
);

export const IconMoulin = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="1.3" fill={color} stroke="none" />
    <path d="M8 6.5 C6.5 4.5 6.5 2.5 8 1.5 C8.5 3.5 8.5 5 8 6.5Z" />
    <path d="M9.5 8 C11.5 6.5 13.5 6.5 14.5 8 C12.5 8.5 11 8.5 9.5 8Z" />
    <path d="M8 9.5 C9.5 11.5 9.5 13.5 8 14.5 C7.5 12.5 7.5 11 8 9.5Z" />
    <path d="M6.5 8 C4.5 9.5 2.5 9.5 1.5 8 C3.5 7.5 5 7.5 6.5 8Z" />
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
  upgrade: IconUpgrade,
  // Gain de l'action Construire : un chantier, pas un ouvrier
  building: IconHammer,
};

// ═══ Glyph — rend l'icône SVG CANONIQUE d'un pictogramme texte connu
// (⬡ mecha, ⬆ amélioration, 🏗 construction, 🤝 recrue…) : tous les menus
// partagent ainsi le même vocabulaire visuel. L'hexagone nu ⬡ est réservé
// à la notion de territoire — le mecha a sa silhouette de marcheur.
// Un picto non mappé reste affiché en texte. ═══
export const GLYPH_ICONS = {
  "⬡": IconMech, "⬆": IconUpgrade, "🏗": IconHammer, "🤝": IconRecruit,
  "👷": IconWorker, "●": IconWorker, "♥": IconPop, "💰": IconCoin,
  "🃏": IconCard, "⚡": IconPower, "🌽": IconFood, "🛢": IconOil,
  "🪵": IconWood, "⚙": IconMetal,
};
export const Glyph = ({ icon, size = 16, color = "#e8dcc8", style }) => {
  const Cmp = GLYPH_ICONS[icon];
  if (!Cmp) return <span style={style}>{icon}</span>;
  return <span style={{ display: "inline-flex", verticalAlign: "-0.18em", ...style }}><Cmp size={size} color={color} /></span>;
};

// Map building type (BUILDING_TYPES[i].type from data/mats.js) to icon component
export const BUILDING_ICONS = {
  arsenal: IconArsenal,
  memorial: IconMemorial,
  gare: IconGare,
  moulin: IconMoulin,
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
// gainSuffix / altSuffix : nœuds (cases d'amélioration GhostSquare) insérés
// juste APRÈS l'option qu'ils améliorent — le « +2 (améliorable +3) ou +1
// (améliorable +2) » se lit alors dans l'ordre, option par option.
export function ActionRow({ pay = [], gain = [], altGain, compact = false, size, gainSuffix = null, altSuffix = null }) {
  const sqSize = size || (compact ? 23 : 26);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
      {pay.length > 0 && <>
        {pay.map((r, i) => <ActionSquare key={`p${i}`} type="cost" resource={r} size={sqSize} />)}
        <span style={{ color: "var(--text-muted)", fontSize: 10, margin: "0 1px" }}>→</span>
      </>}
      {gain.map((r, i) => <ActionSquare key={`g${i}`} type="gain" resource={r} size={sqSize} />)}
      {gainSuffix}
      {altGain && <>
        <OrPill />
        {altGain.map((r, i) => <ActionSquare key={`a${i}`} type="gain" resource={r} size={sqSize} />)}
        {altSuffix}
      </>}
    </div>
  );
}

// ═══ CubeSlots — upgrade cube visualization (petit indicateur compact) ═══
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

// ═══ UpgradeSlot — case d'amélioration intégrée à la ligne de coût.
// Plein = cube posé (réduction acquise) · pointillé = case encore disponible
// pour un futur cube (aucune donnée cachée dans un compteur à part). ═══
export function UpgradeSlot({ filled = false, size = 23, title }) {
  return (
    <div title={title} style={{
      width: size, height: size, borderRadius: 4, flexShrink: 0,
      background: filled ? "linear-gradient(160deg, var(--cube-active), var(--cube-border))" : "transparent",
      border: filled ? "1.5px solid var(--cube-border)" : "1.5px dashed rgba(76,175,80,0.55)",
      boxShadow: filled ? "inset 0 1px 0 rgba(255,255,255,0.32), 0 1px 2px rgba(0,0,0,0.4)" : "none",
    }} />
  );
}

// ═══ GhostSquare — case intégrée à la séquence, liée à une amélioration.
// kind="gain" (rangée haut) : bonus à débloquer → fantôme estompé tant que le
// cube est en place, case réelle (filled) une fois le cube retiré.
// kind="cost" (rangée bas) : coût ENCORE ACTIF tant qu'aucun cube n'est posé —
// il se paie comme les coûts fixes → rouge plein comme un vrai coût, mais
// bordure en POINTILLÉS pour signaler qu'une action Améliorer peut le faire
// disparaître (le cube posé est rendu par UpgradeSlot, pas ici). ═══
// onClick (action Améliorer) : la case devient cliquable — bordure verte
// accentuée quand sélectionnable, dorée lumineuse quand sélectionnée.
export function GhostSquare({ resource, kind = "gain", filled = false, size = 23, title, onClick, selected }) {
  const Icon = RESOURCE_ICONS[resource];
  const iconSize = Math.round(size * 0.65);
  return (
    <div title={title} onClick={onClick} style={{
      width: size, height: size, borderRadius: 3, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      ...(filled ? {
        background: kind === "cost" ? "var(--cost-bg)" : "var(--gain-bg)",
        border: "1.5px solid var(--cube-border)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
      } : kind === "cost" ? {
        background: "var(--cost-bg)",
        border: "1.5px dashed var(--cost-border)",
      } : {
        background: "transparent",
        border: "1.5px dashed rgba(150,150,140,0.5)",
      }),
      ...(onClick ? { cursor: "pointer", border: `1.5px dashed ${selected ? "#e6c96a" : "#4caf50"}` } : {}),
      ...(selected ? { border: "2px solid #e6c96a", boxShadow: "0 0 8px rgba(230,201,106,0.85)", background: "rgba(230,201,106,0.18)" } : {}),
    }}>
      {Icon && <Icon size={iconSize} color={selected ? "#f0e0a8" : filled || kind === "cost" ? "rgba(255,255,255,0.9)" : "rgba(200,200,190,0.45)"} />}
    </div>
  );
}

// ═══ BuildingSlot — le pion Bâtiment de cette colonne : encore en réserve
// (silhouette fantôme, pointillé) ou construit (icône pleine, effet révélé). ═══
export function BuildingSlot({ Icon, name, effect, revealed, extra }) {
  return (
    <div title={revealed ? `${name} construit${extra ? ` (${extra})` : ""} — ${effect}` : `${name} — à construire (${effect})`} style={{
      display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0,
      padding: "5px 8px", borderRadius: 6,
      border: `1px solid ${revealed ? "var(--gold-dim)" : "var(--border)"}`,
      background: revealed ? "rgba(212,178,84,0.08)" : "rgba(196,160,96,0.03)",
    }}>
      <div style={{
        width: 28, height: 28, flexShrink: 0, borderRadius: 5,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: revealed ? "rgba(212,178,84,0.15)" : "transparent",
        border: revealed ? "1px solid var(--gold-dim)" : "1.5px dashed var(--border-dark)",
      }}>
        {Icon && <Icon size={16} color={revealed ? "var(--gold)" : "var(--text-ghost)"} />}
      </div>
      <div style={{ minWidth: 0, lineHeight: 1.25 }}>
        <div style={{
          fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, letterSpacing: "0.05em",
          textTransform: "uppercase", color: revealed ? "var(--text)" : "var(--text-dim)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{name}{extra ? ` · ${extra}` : ""}</div>
        <div style={{
          fontSize: 11.5, color: revealed ? "var(--gold)" : "var(--text-muted)", lineHeight: 1.2,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{effect}</div>
      </div>
    </div>
  );
}

// ═══ RecruitSlot — l'emplacement Recrue de cette colonne : libre (cercle
// fantôme pointillé) ou enrôlée (disque plein + bonus permanent affiché). ═══
export function RecruitSlot({ Icon, label, placed }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0,
      padding: "5px 8px", borderRadius: 6,
      border: `1px solid ${placed ? "#5a9a7a" : "var(--border)"}`,
      background: placed ? "rgba(90,122,106,0.1)" : "rgba(90,122,106,0.03)",
    }}>
      <div style={{
        width: 26, height: 26, flexShrink: 0, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: placed ? "radial-gradient(circle at 34% 30%, #7ac08a, #3d7a52 75%)" : "transparent",
        border: placed ? "1px solid #2a5c3a" : "1.5px dashed var(--border-dark)",
        boxShadow: placed ? "inset 0 1px 0 rgba(255,255,255,0.3)" : "none",
      }} />
      <div style={{ minWidth: 0, lineHeight: 1.25 }}>
        <div style={{
          fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, letterSpacing: "0.05em",
          textTransform: "uppercase", color: placed ? "#8fd0b0" : "var(--text-dim)",
        }}>Recrue</div>
        <div style={{
          fontSize: 11.5, color: placed ? "#8fd0b0" : "var(--text-muted)",
          display: "flex", alignItems: "center", gap: 4,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {placed ? <>{Icon && <Icon size={12} color="#8fd0b0" />}{label}</> : "emplacement libre"}
        </div>
      </div>
    </div>
  );
}
