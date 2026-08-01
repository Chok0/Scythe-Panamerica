import React, { useState, useRef } from 'react';
import { PROLOGUE, CHAPTERS, chapterById } from '../data/campaign.js';
import { LEGACIES, LEGACY_IDS } from '../data/legacies.js';
import { chapterStates, unlockedLegacies, campaignComplete } from '../logic/campaign.js';
import { FACTIONS } from '../data/factions.js';
import { MATS } from '../data/mats.js';
import { FACTION_LOGOS } from '../assets/factions/index.js';

// Écran de campagne — sélection de chapitre, histoire avant/après, variantes.
// Même grammaire visuelle que l'écran de setup (grain, biseau, or) : les deux
// écrans sont des « couvertures », pas des tableaux de bord.
const GRAIN = "repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(201,168,76,0.02) 1px,rgba(201,168,76,0.02) 2px)";
const bevel = (sel) => sel
  ? "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.55), 0 0 20px rgba(201,168,76,0.12)"
  : "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.45)";
const frame = (sel) => ({
  background: `${GRAIN}, ${sel ? "rgba(201,168,76,0.08)" : "rgba(20,18,12,0.82)"}`,
  border: `2px solid ${sel ? "var(--gold)" : "var(--border)"}`,
  borderRadius: 6, boxShadow: bevel(sel),
});
const Para = ({ children }) => (
  <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text2)", margin: "0 0 10px" }}>{children}</p>
);
const SectionTitle = ({ children }) => (
  <div style={{ color: "var(--gold-dim)", fontSize: 12, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", fontFamily: "'Bitter',serif", margin: "16px 0 8px" }}>{children}</div>
);

export default function CampaignScreen({ progress, onPlay, onRead, onBack, onReset, savedGame, onResume, onExport, onImport }) {
  const states = chapterStates(progress);
  const firstOpen = states.find(s => s.unlocked && !s.done)?.chapter.id;
  const [openId, setOpenId] = useState(firstOpen || "prologue");
  const [matId, setMatId] = useState(MATS[0].id);
  const [importMsg, setImportMsg] = useState(null); // {ok,text} — retour du chargement de fichier
  const fileRef = useRef(null);
  const savedChapter = savedGame?.chapter ? chapterById(savedGame.chapter) : null;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de recharger deux fois le même fichier
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = onImport(String(reader.result || ""));
      if (res?.ok) setImportMsg({ ok: true, text: `Sauvegarde chargée — ${res.summary}` });
      else if (res?.error) setImportMsg({ ok: false, text: res.error });
      else setImportMsg(null); // chargement annulé par le joueur
    };
    reader.onerror = () => setImportMsg({ ok: false, text: "Impossible de lire le fichier." });
    reader.readAsText(file);
  };
  const legs = unlockedLegacies(progress);
  const complete = campaignComplete(progress);

  const badge = (s) => {
    if (!s.unlocked) return { txt: "🔒 verrouillé", color: "var(--text-muted)" };
    if (!s.done) return { txt: "▶ à jouer", color: "var(--gold)" };
    if (s.result?.canonMet) return { txt: "★ canon", color: "#8fc26a" };
    return { txt: "✓ terminé", color: "var(--text-dim)" };
  };

  const detail = (chapter, s) => {
    const isGame = chapter.kind === "game";
    const faction = chapter.faction ? FACTIONS[chapter.faction] : null;
    const legacy = chapter.unlock ? LEGACIES[chapter.unlock] : null;
    return (
      <div style={{ padding: "14px 16px 18px", borderTop: "1px solid var(--border)" }}>
        <SectionTitle>Histoire</SectionTitle>
        {chapter.before.map((t, i) => <Para key={i}>{t}</Para>)}

        {chapter.variant?.label && (<>
          <SectionTitle>Variante de jeu</SectionTitle>
          <Para>⚙ {chapter.variant.label}</Para>
        </>)}

        <SectionTitle>Conditions de victoire</SectionTitle>
        {chapter.canon
          ? <Para>🏛 <b style={{ color: "var(--gold)" }}>{chapter.canon.name}</b> — {chapter.canon.desc}</Para>
          : <Para><i>🏛 Condition canon encore à concevoir : {chapter.canonDraft}</i></Para>}
        <Para>⭐ Ou la voie classique : 6 étoiles. La première atteinte l'emporte.</Para>
        {legacy && <Para>🎁 Récompense (condition canon remplie) : <b style={{ color: "var(--gold)" }}>{legacy.icon} {legacy.name}</b> — {legacy.desc}</Para>}

        {s.done && chapter.after.length > 0 && (<>
          <SectionTitle>Ce qui s'est passé ensuite</SectionTitle>
          {chapter.after.map((t, i) => <Para key={i}>{t}</Para>)}
        </>)}

        {isGame ? (<>
          <SectionTitle>Plateau joueur — {faction?.name}</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {MATS.map(m => (
              <button key={m.id} onClick={() => setMatId(m.id)} style={{
                padding: "6px 12px", fontSize: 12, borderRadius: 4, fontFamily: "'Bitter',serif", fontWeight: 700,
                background: matId === m.id ? "rgba(201,168,76,0.12)" : "transparent",
                color: matId === m.id ? "var(--gold)" : "var(--text-muted)",
                border: `1px solid ${matId === m.id ? "var(--gold)" : "var(--border)"}`,
              }}>{m.name} <span style={{ opacity: 0.7 }}>♥{m.pop} 💰{m.coins}</span></button>
            ))}
          </div>
          <button onClick={() => onPlay(chapter, matId)} style={{
            background: "linear-gradient(135deg,var(--gold),#a08030)", color: "var(--bg)", border: "none",
            borderRadius: 6, padding: "12px 40px", fontSize: 13, letterSpacing: 4, textTransform: "uppercase",
            fontWeight: 700, fontFamily: "'Bitter',serif", cursor: "pointer",
          }}>{s.done ? "Rejouer le chapitre" : "Lancer le chapitre"}</button>
        </>) : (
          <button onClick={() => onRead(chapter)} disabled={s.done} style={{
            marginTop: 8, padding: "12px 36px", fontSize: 13, letterSpacing: 3, textTransform: "uppercase",
            fontWeight: 700, fontFamily: "'Bitter',serif", borderRadius: 6, cursor: s.done ? "default" : "pointer",
            background: s.done ? "transparent" : "rgba(201,168,76,0.12)",
            color: s.done ? "var(--text-muted)" : "var(--gold)",
            border: `1px solid ${s.done ? "var(--border)" : "var(--gold)"}`,
          }}>{s.done ? "Interlude déjà lu" : "Lire et poursuivre"}</button>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg,#1A1710 0%,#1A1710 60%,#1A1710 100%)", color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 16px", overflow: "auto", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, background: GRAIN, pointerEvents: "none" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 820 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gold-dim)", letterSpacing: 8, textTransform: "uppercase", fontFamily: "'Bitter',serif" }}>Mode</div>
          <h1 style={{ fontFamily: "var(--font-brand)", fontSize: 30, fontWeight: 900, letterSpacing: 8, textTransform: "uppercase", color: "var(--gold)", margin: "6px 0 4px" }}>Campagne</h1>
          <div style={{ width: 180, height: 1, background: "linear-gradient(90deg,transparent,var(--gold) 50%,transparent)", margin: "0 auto 10px" }} />
          <p style={{ color: "var(--text-dim)", fontSize: 13, fontStyle: "italic", lineHeight: 1.6, maxWidth: 560, margin: "0 auto" }}>
            Huit chapitres, un ordre strictement causal : on incarne tour à tour chaque faction, de la première fissure de l'Empire au sabotage de Rouge River.
          </p>
        </div>

        {/* Partie en cours (autosauvegardée à chaque tour) — reprise en un clic */}
        {savedGame && (
          <button onClick={onResume} style={{
            width: "100%", marginBottom: 14, padding: "12px 20px", fontSize: 13, letterSpacing: 2,
            textTransform: "uppercase", background: "linear-gradient(135deg,#3a5a3a,#254025)", color: "#cfe8bf",
            border: "1px solid #5a8a5a", borderRadius: 6, fontWeight: 700, fontFamily: "'Bitter',serif",
            boxShadow: "0 4px 24px rgba(90,154,90,0.25)", cursor: "pointer",
          }}>
            💾 Reprendre — {savedChapter ? `chapitre ${savedChapter.num} : ${savedChapter.title}` : "partie libre"} · tour {savedGame.turn}
          </button>
        )}

        {/* Prologue — toujours lisible, aucune partie à jouer */}
        <div style={{ ...frame(openId === "prologue"), marginBottom: 10 }}>
          <button onClick={() => setOpenId(openId === "prologue" ? null : "prologue")} style={{ width: "100%", background: "transparent", border: "none", padding: "12px 16px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "var(--font-title)", fontSize: 22, color: "var(--text-muted)", width: 30 }}>§</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontFamily: "'Bitter',serif", fontWeight: 700, fontSize: 17, color: "var(--gold)" }}>Prologue — {PROLOGUE.title}</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--text-dim)" }}>{PROLOGUE.subtitle}</span>
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>texte seul</span>
          </button>
          {openId === "prologue" && (
            <div style={{ padding: "14px 16px 18px", borderTop: "1px solid var(--border)" }}>
              {PROLOGUE.before.map((t, i) => <Para key={i}>{t}</Para>)}
            </div>
          )}
        </div>

        {states.map(s => {
          const c = s.chapter, b = badge(s), open = openId === c.id;
          const logo = c.faction && FACTION_LOGOS[c.faction];
          return (
            <div key={c.id} style={{ ...frame(open), marginBottom: 10, opacity: s.unlocked ? 1 : 0.55 }}>
              <button onClick={() => s.unlocked && setOpenId(open ? null : c.id)} style={{
                width: "100%", background: "transparent", border: "none", padding: "12px 16px", textAlign: "left",
                cursor: s.unlocked ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontFamily: "var(--font-title)", fontSize: 22, fontWeight: 900, color: s.done ? "var(--gold)" : "var(--text-muted)", width: 30 }}>{c.num}</span>
                {logo
                  ? <img src={logo} alt="" style={{ width: 30, height: 30, flexShrink: 0, opacity: s.unlocked ? 1 : 0.5 }} />
                  : <span style={{ width: 30, textAlign: "center", fontSize: 20 }}>🕳</span>}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: "'Bitter',serif", fontWeight: 700, fontSize: 17, color: "var(--gold)" }}>{c.title}</span>
                  <span style={{ display: "block", fontSize: 12, color: "var(--text-dim)" }}>{c.subtitle}{c.kind === "interlude" ? " · interlude" : ""}</span>
                </span>
                <span style={{ fontSize: 12, color: b.color, fontWeight: 700, whiteSpace: "nowrap" }}>{b.txt}</span>
              </button>
              {open && s.unlocked && detail(c, s)}
            </div>
          );
        })}

        {/* Récompenses débloquées — vitrine de progression. « Legs de
            Wardenclyffe » ne convient plus comme titre : le chapitre 1 donne
            désormais le Chantier ferroviaire, qui n'en est pas un. */}
        <div style={{ ...frame(false), marginTop: 18, padding: "14px 16px" }}>
          <div style={{ color: "var(--gold-dim)", fontSize: 12, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", fontFamily: "'Bitter',serif", marginBottom: 8 }}>
            Récompenses de campagne — {legs.length}/{LEGACY_IDS.length}
          </div>
          {legs.length === 0
            ? <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>Aucune récompense débloquée. Chacune s'obtient en remplissant la condition canon de son chapitre.</div>
            : legs.map(l => (
              <div key={l.id} style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>
                <b style={{ color: "var(--gold)" }}>{l.icon} {l.name}</b> — {l.desc}
                {!l.implemented && <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}> (effet en jeu à venir)</span>}
              </div>
            ))}
        </div>

        {complete && (
          <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 6, border: "1px solid var(--gold)", background: "rgba(201,168,76,0.08)", fontSize: 14, color: "var(--text2)", lineHeight: 1.6 }}>
            🏁 Campagne terminée. La boucle se referme exactement là où commence une partie standard de Scythe Panamerica.
          </div>
        )}

        {/* ── Fichier de sauvegarde : la campagne survit au navigateur ── */}
        <div style={{ ...frame(false), marginTop: 14, padding: "14px 16px" }}>
          <div style={{ color: "var(--gold-dim)", fontSize: 12, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", fontFamily: "'Bitter',serif", marginBottom: 8 }}>
            Sauvegarde
          </div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 10 }}>
            La progression est conservée automatiquement dans ce navigateur, et la partie en cours est
            sauvegardée à chaque tour — fermer l'onglet ne perd rien. Exportez un fichier pour garder la
            campagne à l'abri d'un nettoyage de cache, ou la reprendre sur une autre machine.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={onExport} title="Télécharge un fichier .json contenant la progression, les legs et la partie en cours" style={{
              padding: "10px 24px", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", background: "rgba(201,168,76,0.10)",
              color: "var(--gold)", border: "1px solid var(--gold-dim)", borderRadius: 4, fontWeight: 700, fontFamily: "'Bitter',serif", cursor: "pointer",
            }}>💾 Exporter</button>
            <button onClick={() => fileRef.current?.click()} title="Recharge une campagne exportée — remplace la progression de ce navigateur" style={{
              padding: "10px 24px", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", background: "transparent",
              color: "var(--gold-dim)", border: "1px solid var(--border)", borderRadius: 4, fontWeight: 700, fontFamily: "'Bitter',serif", cursor: "pointer",
            }}>📂 Importer</button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleFile} style={{ display: "none" }} />
          </div>
          {importMsg && (
            <div style={{ marginTop: 10, fontSize: 13, color: importMsg.ok ? "#8fc26a" : "var(--rust)" }}>
              {importMsg.ok ? "✅ " : "⚠ "}{importMsg.text}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          <button onClick={onBack} style={{
            padding: "10px 28px", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", background: "transparent",
            color: "var(--gold-dim)", border: "1px solid var(--border)", borderRadius: 4, fontWeight: 700, fontFamily: "'Bitter',serif", cursor: "pointer",
          }}>← Retour</button>
          <button onClick={() => { if (window.confirm("Effacer toute la progression de campagne (chapitres et legs) ?")) onReset(); }} style={{
            padding: "10px 28px", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", background: "transparent",
            color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 4, fontWeight: 700, fontFamily: "'Bitter',serif", cursor: "pointer",
          }}>Réinitialiser</button>
        </div>
      </div>
    </div>
  );
}
