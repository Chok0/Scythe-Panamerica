import React, { useState } from 'react';
import { CAMPAIGN, UNLOCKS } from '../data/campaign.js';
import { missionStatus, nextMission, campaignComplete, hasUnlock } from '../logic/campaign.js';

// Mêmes matériaux que l'écran de setup (grain de papier + bord biseauté) —
// la campagne est un écran frère, pas une fenêtre étrangère.
const GRAIN = "repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(201,168,76,0.02) 1px,rgba(201,168,76,0.02) 2px)";
const bevel = (selected) => selected
  ? "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.55), 0 0 20px rgba(201,168,76,0.12)"
  : "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.45)";

const STATUS_STYLE = {
  done: { color: "#8fc26a", border: "#5a8a5a", badge: "✔ Réussie" },
  open: { color: "var(--gold)", border: "var(--gold)", badge: "▶ Disponible" },
  locked: { color: "var(--text-muted)", border: "var(--border)", badge: "🔒 Verrouillée" },
};

// Rappel de la configuration imposée par une mission (lisible avant de lancer)
const setupSummary = (s) => [
  `${s.bots} adversaire${s.bots > 1 ? "s" : ""}`,
  { facile: "bots faciles", normal: "bots normaux", difficile: "bots difficiles" }[s.difficulty],
  s.empire ? "🤖 patrouilles de l'Empire" : null,
  s.empireRails ? "🛤 rails impériaux posés" : null,
  s.structureBonus && s.structureBonus !== "random" ? "🏦 tuile de pose imposée" : null,
  s.teslaStar ? "🔬 le prototype Tesla pose une étoile" : null,
].filter(Boolean).join(" · ");

export default function CampaignScreen({ progress, onStartMission, onBack, onReset }) {
  const suggested = nextMission(progress);
  const [selId, setSelId] = useState(suggested?.id || CAMPAIGN[0].id);
  const [confirmReset, setConfirmReset] = useState(false);
  const selected = CAMPAIGN.find(m => m.id === selId) || CAMPAIGN[0];
  const selStatus = missionStatus(progress, selected);
  const doneCount = CAMPAIGN.filter(m => missionStatus(progress, m) === "done").length;
  const finished = campaignComplete(progress);

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(170deg, #1A1710 0%, #1A1710 30%, #1a1610 60%, #1A1710 100%)",color:"var(--text)",display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 16px",position:"relative",overflow:"auto"}}>
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:GRAIN,pointerEvents:"none"}}/>
      <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:820}}>
        <div style={{width:80,height:1,background:"linear-gradient(90deg,transparent,var(--gold),transparent)",marginBottom:16}}/>
        <div style={{fontSize:11,fontWeight:600,color:"var(--gold-dim)",letterSpacing:8,textTransform:"uppercase",marginBottom:6,fontFamily:"'Bitter',serif"}}>Campagne</div>
        <h1 style={{fontFamily:"var(--font-brand)",fontSize:30,fontWeight:900,letterSpacing:8,textTransform:"uppercase",color:"var(--gold)",marginBottom:4,textAlign:"center",textShadow:"0 0 40px rgba(201,168,76,0.15)"}}>La Chute de l'Empire</h1>
        <div style={{width:180,height:1,background:"linear-gradient(90deg,transparent,var(--gold-dim) 20%,var(--gold) 50%,var(--gold-dim) 80%,transparent)",marginBottom:10}}/>
        <p style={{color:"var(--text-dim)",fontSize:13,fontStyle:"italic",letterSpacing:1,marginBottom:6,textAlign:"center",maxWidth:520,lineHeight:1.6}}>
          Cinq missions, cinq parties complètes. Chaque objectif rempli débloque du contenu
          — plateaux, plans d'usine et missions secrètes du jeu original — utilisable
          dans la suite de la campagne comme en partie libre.
        </p>
        <div style={{fontSize:12,color:"var(--gold-dim)",letterSpacing:2,marginBottom:24,fontFamily:"'IBM Plex Mono',monospace"}}>
          {doneCount}/{CAMPAIGN.length} mission{doneCount > 1 ? "s" : ""} réussie{doneCount > 1 ? "s" : ""}
          {finished && <span style={{color:"#8fc26a",marginLeft:10}}>🏆 Campagne terminée</span>}
        </div>

        {/* ── Liste des missions ── */}
        <div style={{width:"100%",display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
          {CAMPAIGN.map((m, i) => {
            const st = missionStatus(progress, m);
            const sty = STATUS_STYLE[st];
            const sel = m.id === selId;
            const rec = progress?.done?.[m.id];
            const newAct = i === 0 || CAMPAIGN[i - 1].act !== m.act;
            return (
              <React.Fragment key={m.id}>
                {newAct && (
                  <div style={{fontSize:11,letterSpacing:4,textTransform:"uppercase",color:"var(--gold-dim)",fontFamily:"'Bitter',serif",marginTop:i === 0 ? 0 : 10,marginBottom:2}}>{m.act}</div>
                )}
                <button onClick={()=>setSelId(m.id)} className="fade-in" style={{
                  background:`${GRAIN}, ${sel ? "rgba(201,168,76,0.08)" : "rgba(20,18,12,0.82)"}`,
                  border:`2px solid ${sel ? sty.border : "var(--border)"}`,
                  borderRadius:6,boxShadow:bevel(sel),padding:"12px 16px",
                  display:"flex",alignItems:"center",gap:14,textAlign:"left",color:"var(--text)",
                  opacity:st === "locked" ? 0.65 : 1,
                }}>
                  <div style={{fontSize:24,width:32,textAlign:"center",flexShrink:0,filter:st === "locked" ? "grayscale(1)" : "none"}}>{st === "locked" ? "🔒" : m.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Bitter',serif",fontWeight:700,fontSize:17,color:sty.color,lineHeight:1.2}}>
                      {m.num}. {m.name}
                    </div>
                    <div style={{fontSize:12,color:"var(--text-dim)",marginTop:2}}>
                      {st === "locked" ? "Réussissez la mission précédente pour l'ouvrir" : m.goal.label}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:11,letterSpacing:1,color:sty.color,fontFamily:"'Bitter',serif",fontWeight:700}}>{sty.badge}</div>
                    {rec?.honors && <div style={{fontSize:11,color:"var(--gold)"}}>🎖 Honneurs</div>}
                    {rec?.score != null && <div style={{fontSize:11,color:"var(--text-muted)",fontFamily:"'IBM Plex Mono',monospace"}}>{rec.score}$ · tour {rec.turn}</div>}
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Briefing de la mission sélectionnée ── */}
        <div style={{
          width:"100%",background:`${GRAIN}, rgba(20,18,12,0.82)`,border:"1px solid var(--border)",
          borderRadius:8,boxShadow:bevel(false),padding:"18px 20px",marginBottom:20,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:26}}>{selected.icon}</span>
            <div>
              <div style={{fontFamily:"'Bitter',serif",fontWeight:700,fontSize:20,color:"var(--gold)"}}>{selected.name}</div>
              <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"var(--text-muted)"}}>{selected.act}</div>
            </div>
          </div>
          <p style={{fontSize:13,fontStyle:"italic",color:"var(--text-dim)",lineHeight:1.7,marginBottom:12}}>{selected.intro}</p>
          <p style={{fontSize:13,color:"var(--text2)",lineHeight:1.6,marginBottom:12}}>{selected.brief}</p>
          <div style={{display:"flex",flexDirection:"column",gap:6,fontSize:13}}>
            <div><span style={{color:"var(--gold)"}}>🎯 Objectif</span> — {selected.goal.label}</div>
            {selected.honors && <div><span style={{color:"var(--gold-dim)"}}>🎖 Honneurs</span> — {selected.honors.label}</div>}
            <div style={{color:"var(--text-dim)"}}><span style={{color:"var(--text-muted)"}}>⚙ Configuration</span> — {setupSummary(selected.setup)}</div>
            {selected.reward && UNLOCKS[selected.reward] && (
              <div style={{color:hasUnlock(progress, selected.reward) ? "#8fc26a" : "var(--text2)"}}>
                {UNLOCKS[selected.reward].icon} Récompense — <b>{UNLOCKS[selected.reward].name}</b> : {UNLOCKS[selected.reward].desc}
                {hasUnlock(progress, selected.reward) && " (débloquée)"}
              </div>
            )}
          </div>
        </div>

        {/* ── Contenu débloqué ── */}
        {(progress?.unlocked || []).length > 0 && (
          <div style={{width:"100%",marginBottom:24}}>
            <div style={{fontSize:11,letterSpacing:4,textTransform:"uppercase",color:"var(--gold-dim)",fontFamily:"'Bitter',serif",marginBottom:8}}>Contenu débloqué</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {progress.unlocked.map(u => UNLOCKS[u] && (
                <div key={u} title={UNLOCKS[u].desc} style={{
                  padding:"6px 12px",fontSize:12,borderRadius:4,border:"1px solid #5a8a5a",
                  background:"rgba(90,138,90,0.10)",color:"#a8cf90",fontFamily:"'Bitter',serif",
                }}>{UNLOCKS[u].icon} {UNLOCKS[u].name}</div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",marginBottom:16}}>
          <button onClick={onBack} style={{
            padding:"12px 30px",fontSize:12,letterSpacing:3,textTransform:"uppercase",
            background:"transparent",color:"var(--gold-dim)",border:"1px solid var(--border)",
            borderRadius:6,fontWeight:700,fontFamily:"'Bitter',serif",boxShadow:bevel(false),
          }}>← Retour</button>
          <button disabled={selStatus === "locked"} onClick={()=>selStatus !== "locked" && onStartMission(selected)} style={{
            padding:"14px 44px",fontSize:13,letterSpacing:4,textTransform:"uppercase",fontWeight:700,
            fontFamily:"'Bitter',serif",borderRadius:6,border:"none",
            background:selStatus === "locked" ? "var(--bg3)" : "linear-gradient(135deg,var(--gold),#a08030)",
            color:selStatus === "locked" ? "var(--text-muted)" : "var(--bg)",
            cursor:selStatus === "locked" ? "not-allowed" : "pointer",
            boxShadow:selStatus === "locked" ? "none" : "0 4px 30px rgba(201,168,76,0.35),inset 0 1px 0 rgba(255,255,255,0.15)",
          }}>{selStatus === "done" ? "Rejouer la mission" : "Lancer la mission"}</button>
        </div>

        {/* Remise à zéro — deux clics, la progression est la seule chose qu'on
            ne peut pas rejouer pour récupérer */}
        <button onClick={()=>{ if (confirmReset) { onReset(); setConfirmReset(false); } else setConfirmReset(true); }}
          onMouseLeave={()=>setConfirmReset(false)} style={{
            padding:"6px 16px",fontSize:11,letterSpacing:1,background:"transparent",
            color:confirmReset ? "var(--rust)" : "var(--text-muted)",
            border:`1px solid ${confirmReset ? "var(--rust)" : "var(--border)"}`,borderRadius:4,
            fontFamily:"'Bitter',serif",
          }}>{confirmReset ? "Confirmer : effacer toute la progression ?" : "Réinitialiser la campagne"}</button>
      </div>
    </div>
  );
}
