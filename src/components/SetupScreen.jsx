import React from 'react';
import { FACTIONS, FACTION_IDS } from '../data/factions.js';
import { MATS } from '../data/mats.js';

export default function SetupScreen({ selFaction, setSelFaction, selMat, setSelMat, numBots, setNumBots, startGame, onShowRules }) {
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(170deg, #1A1710 0%, #1A1710 30%, #1a1610 60%, #1A1710 100%)",color:"var(--text)",display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 16px",position:"relative",overflow:"auto"}}>
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(201,168,76,0.012) 1px,rgba(201,168,76,0.012) 2px)",pointerEvents:"none"}}/>
      <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:640}}>
        <div style={{width:80,height:1,background:"linear-gradient(90deg,transparent,var(--gold),transparent)",marginBottom:16}}/>
        <div style={{fontSize:13,color:"var(--gold-dim)",letterSpacing:8,textTransform:"uppercase",marginBottom:6,fontFamily:"'Bitter',serif"}}>Scythe</div>
        <h1 style={{fontSize:32,fontWeight:900,letterSpacing:10,textTransform:"uppercase",color:"var(--gold)",marginBottom:4,textAlign:"center",textShadow:"0 0 40px rgba(201,168,76,0.15)"}}>Panamerica</h1>
        <div style={{width:180,height:1,background:"linear-gradient(90deg,transparent,var(--gold-dim) 20%,var(--gold) 50%,var(--gold-dim) 80%,transparent)",marginBottom:8}}/>
        <p style={{color:"var(--text-dim)",fontSize:12,letterSpacing:1.5,marginBottom:20,textAlign:"center",fontStyle:"italic",maxWidth:320,lineHeight:1.6}}>
          &laquo; L'Empire se meurt. Les machines ne savent pas. &raquo;
        </p>
        <button onClick={onShowRules} style={{
          marginBottom:32,padding:"8px 28px",fontSize:12,letterSpacing:3,textTransform:"uppercase",
          background:"transparent",color:"var(--gold-dim)",border:"1px solid var(--border)",
          borderRadius:4,fontWeight:700,fontFamily:"'Bitter',serif",
        }}>Regles du Jeu</button>

        <div style={{color:"var(--gold-dim)",fontSize:12,marginBottom:10,letterSpacing:4,textTransform:"uppercase",fontFamily:"'Bitter',serif"}}>Adversaires</div>
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

        <div style={{color:"var(--gold-dim)",fontSize:12,marginBottom:12,letterSpacing:4,textTransform:"uppercase",fontFamily:"'Bitter',serif"}}>Votre Faction</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,width:"100%",marginBottom:32}}>
          {FACTION_IDS.map(fid=>{const f=FACTIONS[fid];return(
            <button key={fid} onClick={()=>setSelFaction(fid)} className="fade-in" style={{
              background:selFaction===fid?`linear-gradient(135deg,${f.color}18,${f.color}08)`:"rgba(20,18,12,0.8)",
              border:selFaction===fid?`2px solid ${f.color}`:"1px solid var(--border)",
              borderRadius:6,padding:"14px 12px",color:"var(--text)",textAlign:"left",
              boxShadow:selFaction===fid?`0 0 24px ${f.color}22,inset 0 1px 0 rgba(255,255,255,0.04)`:"inset 0 1px 0 rgba(255,255,255,0.02)",
            }}>
              <div style={{fontFamily:"'Bitter',serif",fontWeight:700,fontSize:14,color:f.color,marginBottom:3}}>{f.name}</div>
              <div style={{fontSize:12,color:"var(--text-dim)"}}>{f.hero} & {f.companion}</div>
              <div style={{display:"flex",gap:8,fontSize:11,color:"var(--text-dim)",marginTop:6,fontFamily:"'IBM Plex Mono',monospace"}}>
                <span>⚡{f.power}</span><span>🃏{f.cards}</span>
              </div>
              {f.fObj&&<div style={{fontSize:11,color:"var(--gold-dim)",marginTop:4,fontStyle:"italic"}}>🏛 {f.fObj.name}</div>}
              {f.isExtension&&<div style={{fontSize:10,color:"var(--gold-dim)",marginTop:2,letterSpacing:2,textTransform:"uppercase"}}>Extension</div>}
            </button>
          );})}
        </div>

        {selFaction&&(<>
          <div style={{color:"var(--gold-dim)",fontSize:12,marginBottom:12,letterSpacing:4,textTransform:"uppercase",fontFamily:"'Bitter',serif"}}>Plateau Joueur</div>
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
              </button>
            ))}
          </div>
        </>)}

        {selFaction&&selMat&&(
          <button onClick={startGame} className="fade-in" style={{
            background:`linear-gradient(135deg, ${FACTIONS[selFaction].color}ee, ${FACTIONS[selFaction].color}aa)`,
            color:"#fff",border:"none",borderRadius:6,padding:"14px 56px",fontSize:14,
            letterSpacing:5,textTransform:"uppercase",fontWeight:700,fontFamily:"'Bitter',serif",
            boxShadow:`0 4px 30px ${FACTIONS[selFaction].color}44,inset 0 1px 0 rgba(255,255,255,0.15)`,
          }}>Commencer</button>
        )}
      </div>
    </div>
  );
}
