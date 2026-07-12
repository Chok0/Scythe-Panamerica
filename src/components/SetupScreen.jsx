import React from 'react';
import { FACTIONS, FACTION_IDS } from '../data/factions.js';
import { MATS } from '../data/mats.js';
import { TERRAINS } from '../data/terrains.js';

const RES_EMOJI = { petrole: "🛢", metal: "⚙", bois: "🪵", nourriture: "🌽" };
const BOTTOM_EMOJI = ["⬆", "⬡", "🏗", "🤝"]; // Upgrade, Deploy, Build, Enlist

const DIFFICULTIES = [
  { key: "facile", label: "Facile", desc: "bots imprévisibles et sous-optimaux" },
  { key: "normal", label: "Normal", desc: "chaque bot tire un profil adapté à sa faction" },
  { key: "difficile", label: "Difficile", desc: "meilleur profil connu, sans erreur" },
];

export default function SetupScreen({ selFaction, setSelFaction, selMat, setSelMat, numBots, setNumBots, randomMap, setRandomMap, difficulty, setDifficulty, empireEnabled, setEmpireEnabled, startGame, onShowRules }) {
  const randomFaction = () => setSelFaction(FACTION_IDS[Math.floor(Math.random() * FACTION_IDS.length)]);
  const randomMat = () => setSelMat(MATS[Math.floor(Math.random() * MATS.length)].id);
  const diceBtnStyle = {
    padding: "4px 12px", fontSize: 11, letterSpacing: 1, borderRadius: 4,
    background: "transparent", color: "var(--gold-dim)", border: "1px solid var(--border)",
    fontFamily: "'Bitter',serif", fontWeight: 700, cursor: "pointer",
  };
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(170deg, #1A1710 0%, #1A1710 30%, #1a1610 60%, #1A1710 100%)",color:"var(--text)",display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 16px",position:"relative",overflow:"auto"}}>
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(201,168,76,0.012) 1px,rgba(201,168,76,0.012) 2px)",pointerEvents:"none"}}/>
      <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:640}}>
        <div style={{width:80,height:1,background:"linear-gradient(90deg,transparent,var(--gold),transparent)",marginBottom:16}}/>
        <div style={{fontSize:11,fontWeight:600,color:"var(--gold-dim)",letterSpacing:8,textTransform:"uppercase",marginBottom:6,fontFamily:"'Bitter',serif"}}>Scythe</div>
        <h1 style={{fontSize:32,fontWeight:900,letterSpacing:10,textTransform:"uppercase",color:"var(--gold)",marginBottom:4,textAlign:"center",textShadow:"0 0 40px rgba(201,168,76,0.15)"}}>Panamerica</h1>
        <div style={{width:180,height:1,background:"linear-gradient(90deg,transparent,var(--gold-dim) 20%,var(--gold) 50%,var(--gold-dim) 80%,transparent)",marginBottom:8}}/>
        <p style={{color:"var(--text-dim)",fontSize:13,fontStyle:"italic",letterSpacing:1.5,marginBottom:20,textAlign:"center",maxWidth:320,lineHeight:1.6}}>
          &laquo; L'Empire se meurt. Les machines ne savent pas. &raquo;
        </p>
        <button onClick={onShowRules} style={{
          marginBottom:32,padding:"8px 28px",fontSize:12,letterSpacing:3,textTransform:"uppercase",
          background:"transparent",color:"var(--gold-dim)",border:"1px solid var(--border)",
          borderRadius:4,fontWeight:700,fontFamily:"'Bitter',serif",
        }}>Regles du Jeu</button>

        <div style={{color:"var(--gold-dim)",fontSize:13,fontWeight:600,marginBottom:10,letterSpacing:3,textTransform:"uppercase",fontFamily:"'Bitter',serif"}}>Adversaires</div>
        <div style={{display:"flex",gap:8,marginBottom:32}}>
          {[1,2,3,4].map(n=>(
            <button key={n} onClick={()=>setNumBots(n)} style={{
              width:42,height:42,borderRadius:"50%",fontSize:15,fontWeight:700,
              background:numBots===n?"linear-gradient(135deg,var(--gold),#a08030)":"transparent",
              color:numBots===n?"var(--bg)":"var(--text-muted)",
              border:numBots===n?"none":"1px solid var(--border)",
              boxShadow:numBots===n?"0 0 20px rgba(201,168,76,0.3),inset 0 1px 0 rgba(255,255,255,0.2)":"none",
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
              boxShadow:difficulty===d.key?"0 0 20px rgba(201,168,76,0.3)":"none",
            }}>{d.label}</button>
          ))}
        </div>
        <div style={{fontSize:11,color:"var(--text-dim)",marginBottom:28,fontStyle:"italic"}}>
          {DIFFICULTIES.find(d=>d.key===difficulty)?.desc}
        </div>

        <div style={{display:"flex",gap:10,marginBottom:32,flexWrap:"wrap",justifyContent:"center"}}>
          <button onClick={()=>setRandomMap(r=>!r)} style={{
            padding:"10px 24px",fontSize:12,letterSpacing:2,
            background:randomMap?"rgba(201,168,76,0.12)":"transparent",
            color:randomMap?"var(--gold)":"var(--text-muted)",
            border:randomMap?"1px solid var(--gold)":"1px solid var(--border)",
            borderRadius:4,fontFamily:"'Bitter',serif",fontWeight:700,
          }}>
            🗺 Carte {randomMap?"PROCÉDURALE":"classique"} {randomMap?"— nouvelle carte à chaque partie":""}
          </button>
          <button onClick={()=>setEmpireEnabled(e=>!e)} title="Les mechas de l'Empire patrouillent la carte et attaquent en fin de tour" style={{
            padding:"10px 24px",fontSize:12,letterSpacing:2,
            background:empireEnabled?"rgba(201,168,76,0.12)":"transparent",
            color:empireEnabled?"var(--gold)":"var(--text-muted)",
            border:empireEnabled?"1px solid var(--gold)":"1px solid var(--border)",
            borderRadius:4,fontFamily:"'Bitter',serif",fontWeight:700,
          }}>
            🤖 Bots de l'Empire : {empireEnabled?"ACTIVÉS":"désactivés"}
          </button>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{color:"var(--gold-dim)",fontSize:13,fontWeight:600,letterSpacing:3,textTransform:"uppercase",fontFamily:"'Bitter',serif"}}>Votre Faction</div>
          <button onClick={randomFaction} style={diceBtnStyle}>🎲 Aléatoire</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,width:"100%",marginBottom:32}}>
          {FACTION_IDS.map(fid=>{const f=FACTIONS[fid];const sel=selFaction===fid;return(
            <button key={fid} onClick={()=>setSelFaction(fid)} className="fade-in" style={{
              background:sel?"rgba(201,168,76,0.08)":"rgba(20,18,12,0.8)",
              border:sel?"2px solid var(--gold)":"1px solid var(--border)",
              borderRadius:6,padding:"14px 12px",color:"var(--text)",textAlign:"left",
              boxShadow:sel?"0 0 20px rgba(201,168,76,0.12),inset 0 1px 0 rgba(255,255,255,0.04)":"inset 0 1px 0 rgba(255,255,255,0.02)",
            }}>
              {/* Nom de faction — ancre visuelle de la carte (§4 : 18-20px Bold, accent
                  doré unique — la couleur ne différencie plus le contenu, cf. §3/§5) */}
              <div style={{fontFamily:"'Bitter',serif",fontWeight:700,fontSize:19,color:"var(--gold)",marginBottom:4}}>{f.name}</div>
              <div style={{fontSize:15,color:"var(--text2)"}}>{f.hero} & {f.companion}</div>
              {/* Stats de jeu — l'info qui sert la décision du joueur, doit primer
                  visuellement sur le lore (§2.1/§5) : taille corps de carte + blanc cassé */}
              <div style={{display:"flex",flexWrap:"wrap",gap:"4px 10px",fontSize:15,marginTop:8,fontFamily:"'IBM Plex Mono',monospace"}}>
                <span>⚡ <span style={{color:"var(--text)",fontWeight:600}}>{f.power}</span></span>
                <span>🃏 <span style={{color:"var(--text)",fontWeight:600}}>{f.cards}</span></span>
                {f.startBonus&&<span style={{color:"#8fc26a",fontWeight:600}}>
                  💰+{f.startBonus.coins} ♥+{f.startBonus.pop}
                </span>}
                {f.startAbs&&<span style={{color:"#d2a468",fontWeight:600}} title="Valeurs de départ fixes (remplacent celles du plateau joueur)">
                  💰={f.startAbs.coins} ♥={f.startAbs.pop}
                </span>}
              </div>
              {/* Texte de lore — ambiance, jamais confondu avec les stats ci-dessus :
                  italique, contraste réduit assumé (§4) */}
              {f.riverwalk&&<div style={{fontSize:13,fontStyle:"italic",color:"#6aa8d0",opacity:0.85,marginTop:6}}>🌊 {f.rwName||"Riverwalk"} → {f.riverwalk.map(t=>TERRAINS[t]?.label||t).join(" & ")}</div>}
              {f.fObj&&<div style={{fontSize:13,fontStyle:"italic",color:"var(--gold-dim)",opacity:0.85,marginTop:4}}>🏛 {f.fObj.name}</div>}
              {f.isExtension&&<div style={{fontSize:11,fontWeight:600,color:"var(--gold-dim)",marginTop:4,letterSpacing:2,textTransform:"uppercase"}}>Extension</div>}
            </button>
          );})}
        </div>

        {selFaction&&(<>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{color:"var(--gold-dim)",fontSize:13,fontWeight:600,letterSpacing:3,textTransform:"uppercase",fontFamily:"'Bitter',serif"}}>Plateau Joueur</div>
            <button onClick={randomMat} style={diceBtnStyle}>🎲 Aléatoire</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8,width:"100%",marginBottom:32}}>
            {MATS.map(pm=>(
              <button key={pm.id} onClick={()=>setSelMat(pm.id)} className="fade-in" style={{
                background:selMat===pm.id?"rgba(201,168,76,0.08)":"rgba(20,18,12,0.8)",
                border:selMat===pm.id?"2px solid var(--gold)":"1px solid var(--border)",
                borderRadius:6,padding:"14px 12px",color:"var(--text)",textAlign:"left",
                boxShadow:selMat===pm.id?"0 0 20px rgba(201,168,76,0.12)":"none",
              }}>
                <div style={{fontFamily:"'Bitter',serif",fontWeight:700,fontSize:14}}>{pm.name}</div>
                <div style={{fontSize:11,color:"var(--text-dim)",marginTop:4,letterSpacing:0.5}}>{pm.topRow.join(" · ")}</div>
                <div style={{fontSize:12,color:"var(--gold)",marginTop:6,fontFamily:"'IBM Plex Mono',monospace"}}>♥{pm.pop}  💰{pm.coins}$</div>
                <div style={{fontSize:11,color:"var(--text-dim)",marginTop:5,fontFamily:"'IBM Plex Mono',monospace"}} title="Coûts des actions bottom : Upgrade / Deploy / Build / Enlist (+bonus $ par cube posé)">
                  {pm.bottomCosts.map((bc,i)=><span key={i} style={{marginRight:6,whiteSpace:"nowrap"}}>{BOTTOM_EMOJI[i]}{bc.base}{RES_EMOJI[bc.res]}{bc.bonus>0?<span style={{color:"#7fa05a"}}>+{bc.bonus}$</span>:""}</span>)}
                </div>
              </button>
            ))}
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
