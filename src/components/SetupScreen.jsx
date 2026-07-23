import React, { useState } from 'react';
import { FACTIONS, FACTION_IDS } from '../data/factions.js';
import { MATS } from '../data/mats.js';
import { TERRAINS } from '../data/terrains.js';
import { FACTION_LOGOS, FACTION_ART } from '../assets/factions/index.js';
import { Glyph } from './svg/ActionIcons.jsx';

const RES_EMOJI = { petrole: "🛢", metal: "⚙", bois: "🪵", nourriture: "🌽" };
const BOTTOM_EMOJI = ["⬆", "⬡", "🏗", "🤝"]; // Upgrade, Deploy, Build, Enlist — rendus via Glyph (icônes SVG canoniques)
// Emblème par plateau joueur — tient le rôle du blason de faction pour donner
// aux cartes de plateau la même structure d'en-tête (emblème + nom doré).
const MAT_ICONS = { 1: "🏭", 2: "🔧", 3: "🧭", 4: "⚒", 5: "🌾" };

const DIFFICULTIES = [
  { key: "facile", label: "Facile", desc: "bots imprévisibles et sous-optimaux" },
  { key: "normal", label: "Normal", desc: "chaque bot tire un profil adapté à sa faction" },
  { key: "difficile", label: "Difficile", desc: "meilleur profil connu, sans erreur" },
];

// ── Matérialité (§6 priorité B) : grain de papier discret + bord biseauté,
// réutilisés sur toutes les cartes/cadres de l'écran au lieu d'un simple
// stroke plat. Le grain reprend le motif déjà utilisé sur le fond d'écran.
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

export default function SetupScreen({ selFaction, setSelFaction, selMat, setSelMat, numBots, setNumBots, mapChoice, setMapChoice, difficulty, setDifficulty, empireEnabled, setEmpireEnabled, startGame, onShowRules }) {
  const [hoverFaction, setHoverFaction] = useState(null);
  const previewId = hoverFaction || selFaction;
  const preview = previewId ? FACTIONS[previewId] : null;
  const randomFaction = () => setSelFaction(FACTION_IDS[Math.floor(Math.random() * FACTION_IDS.length)]);
  const randomMat = () => setSelMat(MATS[Math.floor(Math.random() * MATS.length)].id);
  const diceBtnStyle = {
    padding: "4px 12px", fontSize: 11, letterSpacing: 1, borderRadius: 4,
    background: "transparent", color: "var(--gold-dim)", border: "1px solid var(--border)",
    fontFamily: "'Bitter',serif", fontWeight: 700, cursor: "pointer",
  };
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(170deg, #1A1710 0%, #1A1710 30%, #1a1610 60%, #1A1710 100%)",color:"var(--text)",display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 16px",position:"relative",overflow:"auto"}}>
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:GRAIN,pointerEvents:"none"}}/>
      <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:820}}>
        <div style={{width:80,height:1,background:"linear-gradient(90deg,transparent,var(--gold),transparent)",marginBottom:16}}/>
        <div style={{fontSize:11,fontWeight:600,color:"var(--gold-dim)",letterSpacing:8,textTransform:"uppercase",marginBottom:6,fontFamily:"'Bitter',serif"}}>Scythe</div>
        <h1 style={{fontFamily:"var(--font-brand)",fontSize:32,fontWeight:900,letterSpacing:10,textTransform:"uppercase",color:"var(--gold)",marginBottom:4,textAlign:"center",textShadow:"0 0 40px rgba(201,168,76,0.15)"}}>Panamerica</h1>
        <div style={{width:180,height:1,background:"linear-gradient(90deg,transparent,var(--gold-dim) 20%,var(--gold) 50%,var(--gold-dim) 80%,transparent)",marginBottom:8}}/>
        <p style={{color:"var(--text-dim)",fontSize:13,fontStyle:"italic",letterSpacing:1.5,marginBottom:20,textAlign:"center",maxWidth:320,lineHeight:1.6}}>
          &laquo; L'Empire se meurt. Les machines ne savent pas. &raquo;
        </p>
        <button onClick={onShowRules} style={{
          marginBottom:32,padding:"8px 28px",fontSize:12,letterSpacing:3,textTransform:"uppercase",
          background:"transparent",color:"var(--gold-dim)",border:"1px solid var(--border)",
          borderRadius:4,fontWeight:700,fontFamily:"'Bitter',serif",boxShadow:bevel(false),
        }}>Regles du Jeu</button>

        <div style={{color:"var(--gold-dim)",fontSize:13,fontWeight:600,marginBottom:10,letterSpacing:3,textTransform:"uppercase",fontFamily:"'Bitter',serif"}}>Adversaires</div>
        <div style={{display:"flex",gap:8,marginBottom:32}}>
          {[1,2,3,4].map(n=>(
            <button key={n} onClick={()=>setNumBots(n)} style={{
              width:42,height:42,borderRadius:"50%",fontSize:15,fontWeight:700,
              background:numBots===n?"linear-gradient(135deg,var(--gold),#a08030)":"transparent",
              color:numBots===n?"var(--bg)":"var(--text-muted)",
              border:numBots===n?"none":"1px solid var(--border)",
              boxShadow:numBots===n?"0 0 20px rgba(201,168,76,0.3),inset 0 1px 0 rgba(255,255,255,0.2)":bevel(false),
            }}>{n}</button>
          ))}
        </div>

        <div style={{color:"var(--gold-dim)",fontSize:13,fontWeight:600,marginBottom:10,letterSpacing:3,textTransform:"uppercase",fontFamily:"'Bitter',serif"}}>Difficulté des bots</div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          {DIFFICULTIES.map(d=>(
            <button key={d.key} onClick={()=>setDifficulty(d.key)} style={{
              padding:"8px 20px",fontSize:12,letterSpacing:2,textTransform:"uppercase",fontWeight:700,
              background:difficulty===d.key?"linear-gradient(135deg,var(--gold),#a08030)":"transparent",
              color:difficulty===d.key?"var(--bg)":"var(--text-muted)",
              border:difficulty===d.key?"none":"1px solid var(--border)",
              borderRadius:4,fontFamily:"'Bitter',serif",
              boxShadow:difficulty===d.key?"0 0 20px rgba(201,168,76,0.3)":bevel(false),
            }}>{d.label}</button>
          ))}
        </div>
        <div style={{fontSize:11,color:"var(--text-dim)",marginBottom:28,fontStyle:"italic"}}>
          {DIFFICULTIES.find(d=>d.key===difficulty)?.desc}
        </div>

        <div style={{color:"var(--gold-dim)",fontSize:13,fontWeight:600,marginBottom:10,letterSpacing:3,textTransform:"uppercase",fontFamily:"'Bitter',serif"}}>Carte</div>
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",justifyContent:"center"}}>
          {[
            {key:"v3",label:"🗺 Classique",desc:"carte retouchée (v3) — recommandée"},
            {key:"v2",label:"🗺 Originale",desc:"configuration initiale de la carte (v2)"},
            {key:"random",label:"🎲 Procédurale",desc:"nouvelle carte à chaque partie"},
          ].map(m=>(
            <button key={m.key} onClick={()=>setMapChoice(m.key)} title={m.desc} style={{
              padding:"10px 20px",fontSize:12,letterSpacing:2,
              background:mapChoice===m.key?"rgba(201,168,76,0.12)":"transparent",
              color:mapChoice===m.key?"var(--gold)":"var(--text-muted)",
              border:mapChoice===m.key?"1px solid var(--gold)":"1px solid var(--border)",
              borderRadius:4,fontFamily:"'Bitter',serif",fontWeight:700,boxShadow:bevel(mapChoice===m.key),
            }}>{m.label}</button>
          ))}
        </div>
        <div style={{fontSize:11,color:"var(--text-dim)",marginBottom:20,fontStyle:"italic"}}>
          {{v3:"Carte retouchée (v3) — recommandée",v2:"Configuration initiale de la carte (v2)",random:"Nouvelle carte générée à chaque partie"}[mapChoice]}
        </div>
        <div style={{display:"flex",gap:10,marginBottom:32,flexWrap:"wrap",justifyContent:"center"}}>
          <button onClick={()=>setEmpireEnabled(e=>!e)} title="Mécanique réservée au futur mode campagne — les mechas de l'Empire patrouillent la carte et attaquent en fin de tour" style={{
            padding:"10px 24px",fontSize:12,letterSpacing:2,
            background:empireEnabled?"rgba(201,168,76,0.12)":"transparent",
            color:empireEnabled?"var(--gold)":"var(--text-muted)",
            border:empireEnabled?"1px solid var(--gold)":"1px solid var(--border)",
            borderRadius:4,fontFamily:"'Bitter',serif",fontWeight:700,boxShadow:bevel(empireEnabled),
          }}>
            🤖 Bots de l'Empire : {empireEnabled?"ACTIVÉS":"désactivés"} <span style={{opacity:0.7}}>(campagne)</span>
          </button>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{color:"var(--gold-dim)",fontSize:13,fontWeight:600,letterSpacing:3,textTransform:"uppercase",fontFamily:"'Bitter',serif"}}>Votre Faction</div>
          <button onClick={randomFaction} style={diceBtnStyle}>🎲 Aléatoire</button>
        </div>

        {/* ── Panneau d'aperçu (§6 priorité C) : illustration + blason + lore de la
            faction survolée/sélectionnée. Sépare nettement l'ambiance (ici) des
            stats de décision (cartes ci-dessous), au lieu de tout empiler par carte. ── */}
        <div style={{
          width:"100%",height:340,borderRadius:8,marginBottom:14,position:"relative",overflow:"hidden",
          border:"1px solid var(--border)",boxShadow:bevel(false),background:"#0f0d08",
        }}>
          {preview ? (<>
            <img src={FACTION_ART[previewId]} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 42%",display:"block",opacity:0.92}}/>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(10,9,6,0.05) 0%,rgba(10,9,6,0.35) 45%,rgba(8,7,5,0.94) 100%)"}}/>
            <div style={{position:"absolute",left:18,right:18,bottom:16,display:"flex",alignItems:"flex-end",gap:14}}>
              <img src={FACTION_LOGOS[previewId]} alt="" style={{width:64,height:64,flexShrink:0,filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.7))"}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Bitter',serif",fontWeight:700,fontSize:20,color:"var(--gold)"}}>{preview.name}</div>
                <div style={{fontSize:14,color:"var(--text2)",marginBottom:4}}>{preview.hero} &amp; {preview.companion}</div>
                {/* Bloc lore — encart distinct des stats, italique, contraste réduit (§5) */}
                <div style={{fontSize:13,fontStyle:"italic",color:"var(--text-dim)",opacity:0.9,lineHeight:1.4}}>
                  {preview.riverwalk&&<span>🌊 {preview.rwName||"Riverwalk"} → {preview.riverwalk.map(t=>TERRAINS[t]?.label||t).join(" & ")}</span>}
                  {preview.riverwalk&&preview.fObj&&<span> · </span>}
                  {preview.fObj&&<span>🏛 {preview.fObj.name} — {preview.fObj.desc}</span>}
                </div>
              </div>
              {preview.isExtension&&<div style={{fontSize:11,fontWeight:600,color:"var(--gold-dim)",letterSpacing:2,textTransform:"uppercase",flexShrink:0}}>Extension</div>}
            </div>
          </>) : (
            <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:GRAIN}}>
              <span style={{fontSize:13,fontStyle:"italic",color:"var(--text-muted)"}}>Survolez ou choisissez une faction pour découvrir son histoire</span>
            </div>
          )}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8,width:"100%",marginBottom:32}}>
          {FACTION_IDS.map(fid=>{const f=FACTIONS[fid];const sel=selFaction===fid;return(
            <button key={fid} onClick={()=>setSelFaction(fid)}
              onMouseEnter={()=>setHoverFaction(fid)} onMouseLeave={()=>setHoverFaction(null)}
              className="fade-in" style={{
              ...frameStyle(sel),
              padding:"12px 12px",color:"var(--text)",textAlign:"left",display:"flex",flexDirection:"column",gap:6,
            }}>
              {/* Blason (§6 priorité C) — porte l'identité de faction à la place de
                  la couleur de titre ; nom en accent doré unique (§3/§4 : 18-20px Bold) */}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <img src={FACTION_LOGOS[fid]} alt="" style={{width:30,height:30,flexShrink:0,opacity:sel?1:0.85}}/>
                <div style={{fontFamily:"'Bitter',serif",fontWeight:700,fontSize:18,color:"var(--gold)",lineHeight:1.2}}>{f.name}</div>
              </div>
              {/* Stats de jeu — priment sur le lore, désormais relégué au panneau
                  d'aperçu ci-dessus plutôt que répété sur chaque carte (§2.1/§5) */}
              <div style={{display:"flex",flexWrap:"wrap",gap:"4px 10px",fontSize:15,fontFamily:"'IBM Plex Mono',monospace"}}>
                <span>⚡ <span style={{color:"var(--text)",fontWeight:600}}>{f.power}</span></span>
                <span>🃏 <span style={{color:"var(--text)",fontWeight:600}}>{f.cards}</span></span>
              </div>
            </button>
          );})}
        </div>

        {selFaction&&(<>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{color:"var(--gold-dim)",fontSize:13,fontWeight:600,letterSpacing:3,textTransform:"uppercase",fontFamily:"'Bitter',serif"}}>Plateau Joueur</div>
            <button onClick={randomMat} style={diceBtnStyle}>🎲 Aléatoire</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8,width:"100%",marginBottom:32}}>
            {MATS.map(pm=>{const sel=selMat===pm.id;return(
              <button key={pm.id} onClick={()=>setSelMat(pm.id)} className="fade-in" style={{
                ...frameStyle(sel),
                padding:"12px 12px",color:"var(--text)",textAlign:"left",display:"flex",flexDirection:"column",gap:6,
              }}>
                {/* En-tête identique aux cartes de faction : emblème + nom en accent doré */}
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,opacity:sel?1:0.9,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.6))"}}>{MAT_ICONS[pm.id]}</div>
                  <div style={{fontFamily:"'Bitter',serif",fontWeight:700,fontSize:18,color:"var(--gold)",lineHeight:1.2}}>{pm.name}</div>
                </div>
                {/* Stats de départ — même motif « icône + valeur en gras blanc » que les factions */}
                <div style={{display:"flex",flexWrap:"wrap",gap:"4px 10px",fontSize:15,fontFamily:"'IBM Plex Mono',monospace"}}>
                  <span>♥ <span style={{color:"var(--text)",fontWeight:600}}>{pm.pop}</span></span>
                  <span>💰 <span style={{color:"var(--text)",fontWeight:600}}>{pm.coins}$</span></span>
                </div>
                {/* Ordre des actions du haut — info secondaire, style atténué (comme le lore) */}
                <div style={{fontSize:12,color:"var(--text-dim)",fontStyle:"italic"}}>{pm.topRow.join(" · ")}</div>
                {/* Coûts des actions du bas — mono, atténué */}
                <div style={{fontSize:12,color:"var(--text-dim)",fontFamily:"'IBM Plex Mono',monospace",display:"flex",flexWrap:"wrap",gap:"2px 8px"}} title="Coûts des actions bottom : Améliorer / Déployer / Construire / Enrôler (+bonus $ gagné à chaque exécution de l'action)">
                  {pm.bottomCosts.map((bc,i)=><span key={i} style={{whiteSpace:"nowrap"}}><Glyph icon={BOTTOM_EMOJI[i]} size={12} color="#b8a878"/>{bc.base}<Glyph icon={RES_EMOJI[bc.res]} size={12} color="#b8a878"/>{bc.bonus>0?<span style={{color:"#8fc26a"}}>+{bc.bonus}$</span>:""}</span>)}
                </div>
              </button>
            );})}
          </div>
        </>)}

        {selFaction&&selMat&&(
          <button onClick={startGame} className="fade-in" style={{
            background:"linear-gradient(135deg,var(--gold),#a08030)",
            color:"var(--bg)",border:"none",borderRadius:6,padding:"14px 56px",fontSize:14,
            letterSpacing:5,textTransform:"uppercase",fontWeight:700,fontFamily:"'Bitter',serif",
            boxShadow:"0 4px 30px rgba(201,168,76,0.35),inset 0 1px 0 rgba(255,255,255,0.15)",
          }}>Commencer</button>
        )}
      </div>
    </div>
  );
}
