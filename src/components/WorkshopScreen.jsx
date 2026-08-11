import React, { useState } from 'react';
import { BOTTOM, topSlots, maxBottomCubes, frTop, frBot } from '../data/mats.js';
import { MAT_SPACE, UNEXPLORED, PUBLISHED_IN_SPACE, matTraits, matSource } from '../data/matGen.js';
import { ActionRow, ActionSquare, GhostSquare, UpgradeSlot, ProduceTrack, Glyph } from './svg/ActionIcons.jsx';

// Même matérialité que l'écran d'accueil (SetupScreen) : grain de papier,
// bord biseauté, cadre doré à la sélection.
const GRAIN = "repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(201,168,76,0.02) 1px,rgba(201,168,76,0.02) 2px)";
const bevel = (selected) => selected
  ? "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.55), 0 0 20px rgba(201,168,76,0.12)"
  : "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.45)";
const frameStyle = (selected) => ({
  background: `${GRAIN}, ${selected ? "rgba(201,168,76,0.08)" : "rgba(20,18,12,0.82)"}`,
  border: `2px solid ${selected ? "var(--gold)" : "var(--border)"}`,
  borderRadius: 6,
  boxShadow: bevel(selected),
});
const btn = (variant) => ({
  padding: variant === "big" ? "14px 44px" : "9px 20px",
  fontSize: variant === "big" ? 14 : 12, letterSpacing: variant === "big" ? 4 : 2,
  textTransform: "uppercase", fontWeight: 700, fontFamily: "'Bitter',serif", borderRadius: 5,
  cursor: "pointer",
  ...(variant === "big" ? {
    background: "linear-gradient(135deg,var(--gold),#a08030)", color: "var(--bg)", border: "none",
    boxShadow: "0 4px 30px rgba(201,168,76,0.35),inset 0 1px 0 rgba(255,255,255,0.15)",
  } : {
    background: "transparent", color: "var(--gold-dim)", border: "1px solid var(--border)",
    boxShadow: bevel(false),
  }),
});

const num = (n) => n.toLocaleString("fr-FR");

// Rangée du haut : ce que rapporte l'action (mêmes cases que le plateau en
// partie — data/mats.js TOP_UPGRADES décrit les options débloquables).
const TOP_ACTION_ROW = {
  Move: { pay: [], gain: ["worker", "worker"], altGain: ["coins"] },
  Bolster: { pay: ["coins"], gain: ["power", "power"], altGain: ["combatCards"] },
  Trade: { pay: ["coins"], gain: ["metal", "metal"], altGain: ["pop"] },
  Produce: { pay: [], gain: ["nourriture", "nourriture"], altGain: null },
};
const BOTTOM_GAIN = { Upgrade: "upgrade", Deploy: "mech", Build: "building", Enlist: "pop" };

// ── La carte du plateau forgé ─────────────────────────────────────────────
// Rendu IDENTIQUE au plateau en partie (App.jsx) : cases de coût pleines,
// cases encore annulables en pointillés, bonus $ et gain à droite. Un plateau
// d'atelier doit se juger sur la même image que celle qu'on aura en main.
function MatSheet({ mat }) {
  return (
    <div style={{ ...frameStyle(true), width: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Glyph icon={mat.icon || "⬆"} size={26} color="var(--gold)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Bitter',serif", fontWeight: 700, fontSize: 21, color: "var(--gold)", lineHeight: 1.15 }}>{mat.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: 2, textTransform: "uppercase" }}>Atelier · plateau n°{mat.id}</div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 17, fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0 }}>
          <span>♥ <span style={{ color: "var(--text)", fontWeight: 600 }}>{mat.pop}</span></span>
          <span>💰 <span style={{ color: "var(--text)", fontWeight: 600 }}>{mat.coins}$</span></span>
        </div>
      </div>

      {/* Ce que le plateau raconte, en clair — un plateau tiré au sort doit se
          lire aussi vite qu'un plateau écrit à la main */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.2)" }}>
        {matTraits(mat).map(t => (
          <span key={t.label} style={{ fontSize: 12, padding: "3px 9px", borderRadius: 4, border: "1px solid var(--border)", background: "rgba(201,168,76,0.05)", color: "var(--text-dim)" }}>
            <b style={{ color: "var(--gold-dim)", fontWeight: 700 }}>{t.label}</b> · {t.text}
          </span>
        ))}
      </div>

      {mat.topRow.map((action, i) => {
        const bottomAction = BOTTOM[i];
        const bc = mat.bottomCosts[i];
        const maxBot = maxBottomCubes(mat, i);
        const fixedQty = Math.max(0, bc.base - maxBot);
        const topPark = mat.topCubes[i];
        const row = TOP_ACTION_ROW[action] || { pay: [], gain: [], altGain: null };
        const slots = Array.from({ length: topPark }, (_, k) => topSlots(action, topPark)[k] || { res: "upgrade", label: "Amélioration" });
        const gainGhosts = [], altGhosts = [];
        slots.forEach((s, k) => {
          const ghost = <GhostSquare key={`t${k}`} resource={s.res} kind="gain" filled={false} size={21}
            title={`À débloquer via Améliorer : ${s.label}`} />;
          (["combatCards", "pop", "coins"].includes(s.res) ? altGhosts : gainGhosts).push(ghost);
        });
        return (
          <div key={action} style={{ borderTop: i > 0 ? "1px solid var(--border-dark)" : "none" }}>
            <div style={{ padding: "5px 12px", display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(180deg,rgba(66,52,30,0.7),rgba(44,35,20,0.55))" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--rust-light)", fontFamily: "var(--font-title)" }}>{frTop(action)}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>·</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-dim)", fontFamily: "var(--font-title)" }}>{frBot(bottomAction)}</span>
            </div>
            <div style={{ padding: "6px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
              <ActionRow pay={row.pay} gain={row.gain} altGain={row.altGain} compact size={21}
                gainSuffix={gainGhosts} altSuffix={altGhosts} />
              {action === "Produce" && <ProduceTrack nWorkers={2} mat={mat} size={19} />}
            </div>
            <div style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap", background: "rgba(0,0,0,0.28)", borderTop: "1px solid var(--border)" }}>
              {Array.from({ length: fixedQty }).map((_, k) => <ActionSquare key={`f${k}`} type="cost" resource={bc.res} size={21} />)}
              {Array.from({ length: maxBot }).map((_, k) => (
                <GhostSquare key={`r${k}`} resource={bc.res} kind="cost" size={21} title="Coût annulable via Améliorer" />
              ))}
              <span style={{ width: 6, flexShrink: 0 }} />
              <ActionRow gain={[...(bc.bonus > 0 ? Array(bc.bonus).fill("coins") : []), BOTTOM_GAIN[bottomAction]]} compact size={21} />
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontFamily: "'IBM Plex Mono',monospace", whiteSpace: "nowrap" }}>
                {bc.base}→{Math.max(1, bc.base - maxBot)} · {maxBot} case{maxBot > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function WorkshopScreen({ mats, current, onForge, onSelect, onPlay, onBack }) {
  const [copied, setCopied] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const mat = current;
  // Repère d'échelle : un nombre à sept chiffres ne dit rien tant qu'on ne
  // l'a pas ramené à une durée.
  const days = Math.round(MAT_SPACE.total / 86400);

  const copySource = () => {
    const src = matSource(mat);
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    // `navigator.clipboard` exige un contexte sécurisé — le jeu se distribue
    // en HTML autonome ouvert en local, où il peut manquer : on retombe alors
    // sur le bloc de code, à sélectionner à la main.
    try {
      navigator.clipboard.writeText(src).then(done, () => setShowSource(true));
    } catch { setShowSource(true); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg, #1A1710 0%, #1A1710 30%, #1a1610 60%, #1A1710 100%)", color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 16px", position: "relative", overflow: "auto" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: GRAIN, pointerEvents: "none" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 820 }}>
        <div style={{ width: 80, height: 1, background: "linear-gradient(90deg,transparent,var(--gold),transparent)", marginBottom: 16 }} />
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gold-dim)", letterSpacing: 8, textTransform: "uppercase", marginBottom: 6, fontFamily: "'Bitter',serif" }}>Scythe · Panamerica</div>
        <h1 style={{ fontFamily: "var(--font-brand)", fontSize: 30, fontWeight: 900, letterSpacing: 8, textTransform: "uppercase", color: "var(--gold)", marginBottom: 4, textAlign: "center" }}>Mode Atelier</h1>
        <div style={{ width: 180, height: 1, background: "linear-gradient(90deg,transparent,var(--gold-dim) 20%,var(--gold) 50%,var(--gold-dim) 80%,transparent)", marginBottom: 10 }} />
        <p style={{ color: "var(--text-dim)", fontSize: 13, fontStyle: "italic", letterSpacing: 1, marginBottom: 24, textAlign: "center", maxWidth: 520, lineHeight: 1.6 }}>
          Les {PUBLISHED_IN_SPACE.length} plateaux du jeu obéissent tous à la même grammaire. Elle en décrit
          bien d'autres — l'atelier va les chercher là où personne n'est allé.
        </p>

        {/* ── Le compte ── */}
        <div style={{ ...frameStyle(false), width: "100%", padding: "14px 16px", marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold-dim)", letterSpacing: 3, textTransform: "uppercase", fontFamily: "'Bitter',serif", marginBottom: 10 }}>Le compte</div>
          {[
            { n: MAT_SPACE.topOrders, label: "ordres de la rangée du haut", detail: "les 4 actions permutées ; les cubes suivent l'action (Déplacer 2, Soutien 2, Commerce 1, Produire 1)" },
            { n: MAT_SPACE.wealth, label: "échelons de départ ♥/$", detail: "l'échelle pauvre→riche du jeu original, de 2♥/4$ à 4♥/7$" },
            { n: MAT_SPACE.bonuses, label: "répartitions du bonus $", detail: "4 colonnes, 0 à 3$ chacune, 6$ au total" },
            { n: MAT_SPACE.baseSlotPairs, label: "couples coûts / cases d'amélioration", detail: "coûts 2 à 4 pour 13 au total, 6 cases sans jamais descendre un coût sous 1" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "5px 0", borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 17, fontWeight: 700, color: "var(--gold)", minWidth: 46, textAlign: "right" }}>{r.n}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, color: "var(--text)" }}>{r.label}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.4 }}>{r.detail}</span>
              </span>
            </div>
          ))}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 8, paddingTop: 10 }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "'IBM Plex Mono',monospace" }}>
              {MAT_SPACE.topOrders} × {MAT_SPACE.wealth} × {MAT_SPACE.bonuses} × {MAT_SPACE.baseSlotPairs} =
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 25, fontWeight: 700, color: "var(--gold)" }}>{num(MAT_SPACE.total)}</span>
            <span style={{ fontSize: 13, color: "var(--text)" }}>plateaux jouables</span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.6, marginTop: 6 }}>
            {PUBLISHED_IN_SPACE.length} sont déjà publiés (6 Panamerica + 7 du jeu original) : il en reste{" "}
            <b style={{ color: "var(--gold)" }}>{num(UNEXPLORED)}</b> à découvrir — un par seconde, sans dormir, il
            faudrait {days} jours pour tous les voir. L'atelier ne tire que là-dedans : jamais un plateau existant,
            jamais deux fois le même.
          </div>
        </div>

        {/* ── La forge ── */}
        <button onClick={onForge} style={{ ...btn("big"), marginBottom: 8 }}>
          🎲 {mat ? "Forger un autre plateau" : "Forger un plateau"}
        </button>
        <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontStyle: "italic", marginBottom: 22 }}>
          {mats.length === 0 ? "aucun plateau forgé pour l'instant"
            : `${mats.length} plateau${mats.length > 1 ? "x" : ""} forgé${mats.length > 1 ? "s" : ""} — conservé${mats.length > 1 ? "s" : ""} d'une session à l'autre`}
        </div>

        {mat && (<>
          <div className="fade-in" style={{ width: "100%", marginBottom: 12 }}>
            <MatSheet mat={mat} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
            <button onClick={() => onPlay(mat)} style={{ ...btn(), color: "var(--gold)", border: "1px solid var(--gold-dim)", background: "rgba(201,168,76,0.10)" }}>
              ▶ Jouer avec ce plateau
            </button>
            <button onClick={copySource} style={btn()} title="Le plateau au format de data/mats.js — à coller tel quel dans le jeu s'il tient la table">
              {copied ? "✓ Copié" : "⧉ Copier le code"}
            </button>
            <button onClick={() => setShowSource(s => !s)} style={btn()}>{showSource ? "▾ Masquer" : "▸ Voir le code"}</button>
          </div>
          {showSource && (
            <pre onClick={e => { const r = document.createRange(); r.selectNodeContents(e.currentTarget); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }}
              style={{ width: "100%", marginBottom: 14, padding: 12, borderRadius: 6, border: "1px solid var(--border)", background: "rgba(0,0,0,0.45)", color: "var(--text-dim)", fontSize: 11.5, fontFamily: "'IBM Plex Mono',monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", cursor: "text" }}>
              {matSource(mat)}
            </pre>
          )}
        </>)}

        {/* ── Les plateaux de la forge ── */}
        {mats.length > 0 && (<>
          <div style={{ color: "var(--gold-dim)", fontSize: 13, fontWeight: 600, margin: "14px 0 10px", letterSpacing: 3, textTransform: "uppercase", fontFamily: "'Bitter',serif" }}>La forge</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 8, width: "100%", marginBottom: 28 }}>
            {mats.map(m => {
              const sel = mat?.id === m.id;
              return (
                <button key={m.id} onClick={() => onSelect(m)} style={{ ...frameStyle(sel), padding: "10px 12px", color: "var(--text)", textAlign: "left", display: "flex", flexDirection: "column", gap: 5, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Glyph icon={m.icon || "⬆"} size={20} color="var(--gold)" />
                    <div style={{ fontFamily: "'Bitter',serif", fontWeight: 700, fontSize: 15, color: "var(--gold)", lineHeight: 1.2 }}>{m.name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: 14, fontFamily: "'IBM Plex Mono',monospace" }}>
                    <span>♥ <span style={{ color: "var(--text)", fontWeight: 600 }}>{m.pop}</span></span>
                    <span>💰 <span style={{ color: "var(--text)", fontWeight: 600 }}>{m.coins}$</span></span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-dim)", fontStyle: "italic" }}>{m.topRow.map(frTop).join(" · ")}</div>
                </button>
              );
            })}
          </div>
        </>)}

        <button onClick={onBack} style={{ ...btn(), marginBottom: 20 }}>← Retour au menu</button>
      </div>
    </div>
  );
}
