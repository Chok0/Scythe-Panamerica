// Animations de mouvement (transitions CSS des pions) ✅ et retour visuel des
// gains (floaters) ✅ sont implémentés. Idée libre restante : visualiser le hex
// choisi par le bot pendant son tour (voir « Idées libres » dans TODO_proto_fixes.md).
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TERRAINS } from '../data/terrains.js';
import { FACTIONS, FACTION_IDS } from '../data/factions.js';
import { HEXES, RIVERS, HOME_BASES, hMap, ADJ, CURRENT_MAP, DEFAULT_MAP, CLASSIC_V2_MAP, loadMap, baseHexAt, homeBaseHex, isBaseHex } from '../data/hexes.js';
import { generateAcceptedMap } from '../data/mapGen.js';
import { getCombatBonus } from '../data/combat.js';
import { BALANCE } from '../data/balance.js';
import { EMPIRE_START, drawEmpireCombat } from '../data/empire.js';
import { ENCOUNTERS } from '../data/encounters.js';
import { FACTORY_RR_HEX, PLANS_FORD, PLANS_TESLA, TESLA_FRAGMENTS_REQUIRED } from '../data/plans.js';
import { MATS, BOTTOM, getBottomCost, BUILDING_TYPES, ENLIST_ONGOING, ENLIST_IMMEDIATE, applyEnlistOngoing, topSlots, topUpgradeCount, maxBottomCubes } from '../data/mats.js';
import { OBJECTIVES } from '../data/objectives.js';
import { structureBonusDetail } from '../data/structureBonus.js';
import { reconcileHand, topCardsSum, spendTopCards, spendPickedCards, handSummary } from '../logic/cards.js';
import RulesPage from './RulesPage.jsx';
import AmbientSound from './AmbientSound.jsx';
import SetupScreen from './SetupScreen.jsx';
import { countRes, spendRes, getWorkerHexes } from '../logic/resources.js';
import { canPayProduce, payProduce, getProduceCost, produceCostLabel } from '../logic/production.js';
import { hPts, HS, edgeGeo, shuffleArray } from '../logic/hexMath.js';
import { getValidMoves, findPathWaypoints, marshToll } from '../logic/movement.js';
import { transportUnits } from '../logic/transport.js';
import { createPlayer } from '../logic/player.js';
import { botTurn } from '../logic/bot.js';
import { BOT_PROFILES, assignBotProfile, BOT_NOISE, MAP_META_THREAT, playerStanding } from '../logic/botProfiles.js';
import { applyBotPvpAfterMove, servitudeOnDisplace, transferHexResources } from '../logic/pvpBots.js';
import { resolveBotEncounter } from '../logic/botEncounters.js';
import { getPlanBottomBonus, auraPowerCount } from '../logic/planEffects.js';
import { HexTerrain, UnitToken, EmpireMecha, ResourceToken, FactionHalo } from './svg/MapComponents.jsx';
import { ActionRow, ActionSquare, CubeSlots, UpgradeSlot, GhostSquare, BuildingSlot, RecruitSlot, ProduceTrack, RESOURCE_ICONS, BUILDING_ICONS, Glyph } from './svg/ActionIcons.jsx';
import { getMechAbilities } from '../data/mechAbilities.js';
import { FACTION_LOGOS, FACTION_ART } from '../assets/factions/index.js';
import { TERRAIN_TEXTURES, TERRAIN_TILE } from '../assets/terrains/index.js';
import { BOARD_IMAGE } from '../assets/map/index.js';

// ═══ Marqueurs de piste (popularité / puissance) ═══
// Cœur aux couleurs de la faction, portant la valeur courante de popularité.
const HeartMarker=({color,value,size=26})=>(
  <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.75))",zIndex:2}}>
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M8 14 C8 14 2 10 2 6.5 C2 4 4 2 6 2 C7 2 7.6 2.5 8 3 C8.4 2.5 9 2 10 2 C12 2 14 4 14 6.5 C14 10 8 14 8 14Z" fill={color} stroke="rgba(255,255,255,0.85)" strokeWidth="0.9" strokeLinejoin="round"/>
    </svg>
    <span style={{position:"absolute",top:"44%",left:"50%",transform:"translate(-50%,-50%)",fontSize:Math.round(size*0.42),fontWeight:900,color:"#fff",fontFamily:"var(--font-mono)",textShadow:"0 1px 2px rgba(0,0,0,0.85)",lineHeight:1}}>{value}</span>
  </div>
);

// Éclair aux couleurs de la faction, portant la valeur courante de puissance.
const BoltMarker=({color,value,height=24})=>(
  <div style={{display:"flex",alignItems:"center",gap:2,padding:"0 7px 0 4px",height,borderRadius:height/2,
    background:color,border:"1px solid rgba(255,255,255,0.8)",boxShadow:"0 1px 4px rgba(0,0,0,0.7)"}}>
    <svg width={Math.round(height*0.62)} height={Math.round(height*0.62)} viewBox="0 0 16 16">
      <polygon points="9,1 4,9 7.5,9 7,15 12,7 8.5,7" fill="#fff" stroke="rgba(0,0,0,0.35)" strokeWidth="0.5"/>
    </svg>
    <span style={{fontSize:Math.round(height*0.52),fontWeight:900,color:"#fff",fontFamily:"var(--font-mono)",textShadow:"0 1px 2px rgba(0,0,0,0.7)",lineHeight:1}}>{value}</span>
  </div>
);

// Étoile de fin de piste (pop 18 / puissance 16) : fantôme en pointillés tant
// que l'étoile n'est pas obtenue, pleine et dorée une fois atteinte.
const TrackStar=({size=13,earned=false})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flexShrink:0,display:"block"}}>
    <path d="M12 2.5l2.83 5.9 6.47.84-4.75 4.48 1.21 6.4L12 17.02l-5.76 3.1 1.21-6.4-4.75-4.48 6.47-.84z"
      fill={earned?"var(--gold)":"none"} stroke="var(--gold)" strokeWidth="1.8"
      strokeDasharray={earned?undefined:"3 2.4"} opacity={earned?0.95:0.5} strokeLinejoin="round"/>
  </svg>
);

export default function App(){
  const[phase,setPhase]=useState("setup");
  const[selFaction,setSelFaction]=useState(null);
  const[selMat,setSelMat]=useState(null);
  const[numBots,setNumBots]=useState(2);
  const[mapChoice,setMapChoice]=useState("v3"); // "v3" (défaut) | "v2" (configuration initiale) | "random" (procédurale)
  // Bots de l'Empire désactivés par défaut — mécanique réservée au mode campagne
  const[empireEnabled,setEmpireEnabled]=useState(false);
  const[difficulty,setDifficulty]=useState("normal");
  const[structureBonus,setStructureBonus]=useState(null); // tuile bonus de construction tirée au début
  const[players,setPlayers]=useState([]);
  const[currentP,setCurrentP]=useState(0);
  const[turn,setTurn]=useState(1);
  const[empire,setEmpire]=useState(Object.fromEntries(EMPIRE_START.map(e=>[e.id,e.hexId])));
  const[rails,setRails]=useState([]); // shared rail network: array of [hexA, hexB] — la carte de base démarre SANS rails (EMPIRE_RAILS réservés à la campagne)
  const[railPlacement,setRailPlacement]=useState(null); // {remaining:3, fromHex:null} for placing rails after Gare build
  const[selHex,setSelHex]=useState(null);
  const[selAction,setSelAction]=useState(null);
  const[pendingBottom,setPendingBottom]=useState(null); // {col, action} after top-row done
  const[bottomPick,setBottomPick]=useState(null); // for Build: choosing building type / Deploy: choosing hex
  const[pendingAbility,setPendingAbility]=useState(null); // {source:"deploy"|"encounter", hexId} — waiting for player to pick mech ability
  const[combat,setCombat]=useState(null); // {type:"pvp"|"pve", hexId, enemyIdx?, empireId?, empireCard?, phase:"choose"|"reward", powerSpend:0, cardsSpend:0}
  const[encounter,setEncounter]=useState(null); // {card, hexId}
  const[encounterBuild,setEncounterBuild]=useState(false); // rencontre → choisir le type de bâtiment (posé sur le hex du héros)
  const[encounterEnlist,setEncounterEnlist]=useState(null); // rencontre → enrôler : {col:null} puis {col}
  const[rougeRiver,setRougeRiver]=useState(null); // {cards:[]}
  const[encounterTokens,setEncounterTokens]=useState(new Set(CURRENT_MAP.encounterHexes));
  const[rrVisitors,setRrVisitors]=useState(0); // how many players visited RR
  const[moveSource,setMoveSource]=useState(null);
  // Transport partiel (mech) : choix des ouvriers/ressources à emporter avant le déplacement
  const[transportPick,setTransportPick]=useState(null);
  const[unitPicker,setUnitPicker]=useState(null); // {hexId,units:[{type,id,label}]} — plusieurs unités sur le hex cliqué
  const[carryOnMove,setCarryOnMove]=useState(true); // 🚚 emporter ouvriers/ressources au Move
  const[routeDrop,setRouteDrop]=useState(null); // 📦 dépose en route: {mids,destHex,endAfter}
  const[preActionSnapshot,setPreActionSnapshot]=useState(null); // snapshot of player[0] before action, for undo
  const[undoStack,setUndoStack]=useState([]); // pile d'annulation (snapshots d'état, dans le tour humain)
  const[redoStack,setRedoStack]=useState([]); // pile de rétablissement
  const[tradePicks,setTradePicks]=useState([]); // for Trade: array of picked resource types (0-2)
  const[producePicks,setProducePicks]=useState([]); // for Produce: hex choisis au clic (2-3 + Moulin en bonus)
  const[abilityOffer,setAbilityOffer]=useState(null); // pouvoir de faction OPTIONNEL à confirmer: {type:"servitude"|"trap"|"flag", hexId}
  const[hovHex,setHovHex]=useState(null);
  const[clickRipple,setClickRipple]=useState(null); // {hexId, key} for ripple animation
  const[showOpponents,setShowOpponents]=useState(false); // barre du haut dépliée : ressources + étoiles adverses
  const[showScoring,setShowScoring]=useState(false); // tiroir latéral : barème de score de fin de partie
  const[floaters,setFloaters]=useState([]); // animations de gain : {id,icon,color,x,y,label}
  const[log,setLog]=useState([]);
  const[botRunning,setBotRunning]=useState(false);
  const[starDetail,setStarDetail]=useState(null); // étoile sélectionnée → panneau détail façon Steam
  const[showCards,setShowCards]=useState(false); // main de cartes de combat (clic sur le compteur 🃏)
  const[showLog,setShowLog]=useState(false);
  const[logFilter,setLogFilter]=useState("all"); // "all"|"combat"|"move"|"resource"|"bot"|"warn"|"star"|"note"|"snap"
  const[noteInput,setNoteInput]=useState(""); // 📝 annotation manuelle à insérer au journal
  const[endOfTurn,setEndOfTurn]=useState(false); // étape « Fin du tour » (validation + révélation d'objectifs)
  const[showRules,setShowRules]=useState(false);
  const logRef=useRef(null);
  // Map zoom/pan state
  const MAP_BASE={x:20,y:20,w:980,h:990};
  const[mapView,setMapView]=useState({...MAP_BASE});
  const[isPanning,setIsPanning]=useState(false);
  const panStart=useRef(null);
  const mapRef=useRef(null);

  const me=players[0];const myFaction=me?FACTIONS[me.faction]:null;const myMat=me?MATS.find(m=>m.id===me.matId):null;
  // Plan « Réseau Neuronal » (mass_move) : 3 déplacements par action Move au lieu de 2
  // 2 unités de base, 3 si le cube de l'option « +1 unité » est retiré
  // (le plan « mass_move » garantit au moins 3)
  const moveLimit=Math.max(me?.factoryCard?.topBonus==="mass_move"?3:2, 2+(me?topUpgradeCount(me,"Move","worker"):0));

  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[log]);

  // ── MAP INTERACTION: wheel/trackpad zoom, drag pan, touch pinch+pan ──
  const ZOOM_MIN=80,ZOOM_MAX=MAP_BASE.w*2.5;
  const dragThreshold=5;
  const touchRef=useRef(null);
  const wasDragging=useRef(false);
  const mapViewRef=useRef(mapView); // always-fresh ref for event handlers
  useEffect(()=>{mapViewRef.current=mapView;},[mapView]);

  // Wheel/trackpad zoom toward cursor
  const handleMapWheel=useCallback((e)=>{
    e.preventDefault();
    // Trackpads send ctrlKey+deltaY for pinch, or plain deltaY for scroll
    const isTrackpadPinch=e.ctrlKey;
    const delta=isTrackpadPinch?e.deltaY*3:e.deltaY; // amplify trackpad pinch
    const factor=delta>0?1.08:1/1.08;
    setMapView(prev=>{
      const newW=Math.min(ZOOM_MAX,Math.max(ZOOM_MIN,prev.w*factor));
      const newH=Math.min(ZOOM_MAX,Math.max(ZOOM_MIN,prev.h*factor));
      const svg=mapRef.current;
      if(svg){
        const rect=svg.getBoundingClientRect();
        const mx=(e.clientX-rect.left)/rect.width;
        const my=(e.clientY-rect.top)/rect.height;
        return{x:prev.x+prev.w*mx-newW*mx,y:prev.y+prev.h*my-newH*my,w:newW,h:newH};
      }
      const cx=prev.x+prev.w/2,cy=prev.y+prev.h/2;
      return{x:cx-newW/2,y:cy-newH/2,w:newW,h:newH};
    });
  },[]);

  // Drag pan — left-click drag.
  // setPointerCapture : tous les pointermove/up vont au SVG même si le curseur
  // passe sur un hex enfant ou sort brièvement du cadre → le pan ne décroche
  // jamais (c'était le bug : onPointerLeave coupait le drag).
  const handleMapPointerDown=useCallback((e)=>{
    if(e.button>1)return;
    const mv=mapViewRef.current;
    // NE PAS capturer ici : un capture au pointerdown redirige aussi le `click`
    // vers le SVG et casse le onClick des hexes. On capture seulement quand un
    // vrai drag démarre (seuil franchi dans pointermove).
    panStart.current={cx:e.clientX,cy:e.clientY,vx:mv.x,vy:mv.y,moved:false,pid:e.pointerId,el:e.currentTarget};
  },[]);

  const handleMapPointerMove=useCallback((e)=>{
    const ps=panStart.current;if(!ps)return;
    const dx0=e.clientX-ps.cx,dy0=e.clientY-ps.cy;
    if(!ps.moved&&Math.abs(dx0)<dragThreshold&&Math.abs(dy0)<dragThreshold)return;
    if(!ps.moved){
      ps.moved=true;
      // Drag confirmé → on capture pour que le pan ne décroche jamais
      try{ps.el&&ps.el.setPointerCapture(ps.pid);}catch{}
    }
    if(!isPanning)setIsPanning(true);
    const svg=mapRef.current;if(!svg)return;
    const rect=svg.getBoundingClientRect();
    const mv=mapViewRef.current;
    const scaleX=mv.w/rect.width,scaleY=mv.h/rect.height;
    setMapView(prev=>({...prev,x:ps.vx-dx0*scaleX,y:ps.vy-dy0*scaleY}));
  },[isPanning]);

  const handleMapPointerUp=useCallback((e)=>{
    const ps=panStart.current;
    wasDragging.current=!!(ps&&ps.moved);
    if(ps&&ps.moved&&ps.pid!=null&&ps.el){try{ps.el.releasePointerCapture(ps.pid);}catch{}}
    setIsPanning(false);panStart.current=null;
  },[]);

  // Touch: pinch zoom + single-finger pan
  const handleTouchStart=useCallback((e)=>{
    if(e.touches.length===2){
      const t=e.touches;
      const dist=Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
      const mx=(t[0].clientX+t[1].clientX)/2,my=(t[0].clientY+t[1].clientY)/2;
      const mv=mapViewRef.current;
      touchRef.current={dist,mx,my,vx:mv.x,vy:mv.y,vw:mv.w,vh:mv.h};
    } else if(e.touches.length===1){
      const t=e.touches[0];
      const mv=mapViewRef.current;
      panStart.current={cx:t.clientX,cy:t.clientY,vx:mv.x,vy:mv.y,moved:false};
    }
  },[]);

  const handleTouchMove=useCallback((e)=>{
    if(e.touches.length===2&&touchRef.current){
      e.preventDefault();
      const t=e.touches;
      const dist=Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
      const scale=touchRef.current.dist/dist;
      const newW=Math.min(ZOOM_MAX,Math.max(ZOOM_MIN,touchRef.current.vw*scale));
      const newH=Math.min(ZOOM_MAX,Math.max(ZOOM_MIN,touchRef.current.vh*scale));
      const svg=mapRef.current;if(!svg)return;
      const rect=svg.getBoundingClientRect();
      const mx2=(t[0].clientX+t[1].clientX)/2,my2=(t[0].clientY+t[1].clientY)/2;
      const panScaleX=touchRef.current.vw/rect.width,panScaleY=touchRef.current.vh/rect.height;
      const panDx=(mx2-touchRef.current.mx)*panScaleX;
      const panDy=(my2-touchRef.current.my)*panScaleY;
      const mxN=(touchRef.current.mx-rect.left)/rect.width;
      const myN=(touchRef.current.my-rect.top)/rect.height;
      setMapView({x:touchRef.current.vx+touchRef.current.vw*mxN-newW*mxN-panDx,y:touchRef.current.vy+touchRef.current.vh*myN-newH*myN-panDy,w:newW,h:newH});
    } else if(e.touches.length===1&&panStart.current){
      const t=e.touches[0];
      const dx0=t.clientX-panStart.current.cx,dy0=t.clientY-panStart.current.cy;
      if(!panStart.current.moved&&Math.abs(dx0)<dragThreshold&&Math.abs(dy0)<dragThreshold)return;
      panStart.current.moved=true;
      const svg=mapRef.current;if(!svg)return;
      const rect=svg.getBoundingClientRect();
      const mv=mapViewRef.current;
      setMapView(prev=>({...prev,x:panStart.current.vx-(dx0*mv.w/rect.width),y:panStart.current.vy-(dy0*mv.h/rect.height)}));
    }
  },[]);

  const handleTouchEnd=useCallback(()=>{
    touchRef.current=null;panStart.current=null;setIsPanning(false);
  },[]);

  // Attach wheel + touch listeners with passive:false
  // `phase` est dans les deps : le SVG n'existe pas pendant le setup, il faut
  // ré-attacher quand l'écran de jeu monte (sinon zoom molette/trackpad mort)
  useEffect(()=>{
    const el=mapRef.current;if(!el)return;
    el.addEventListener("wheel",handleMapWheel,{passive:false});
    el.addEventListener("touchmove",handleTouchMove,{passive:false});
    return()=>{el.removeEventListener("wheel",handleMapWheel);el.removeEventListener("touchmove",handleTouchMove);};
  },[handleMapWheel,handleTouchMove,phase]);

  const mapZoom=useCallback((factor)=>{
    setMapView(prev=>{
      const cx=prev.x+prev.w/2,cy=prev.y+prev.h/2;
      const newW=Math.min(ZOOM_MAX,Math.max(ZOOM_MIN,prev.w*factor));
      const newH=Math.min(ZOOM_MAX,Math.max(ZOOM_MIN,prev.h*factor));
      return{x:cx-newW/2,y:cy-newH/2,w:newW,h:newH};
    });
  },[]);

  const mapReset=useCallback(()=>setMapView({...MAP_BASE}),[]);

  // Center on player's hero
  const mapCenterOnMe=useCallback(()=>{
    if(!me)return;
    const heroHex=hMap[me.hero];if(!heroHex)return;
    const zoomW=400,zoomH=400; // tight view around hero, clamped to board bounds
    const x=Math.max(MAP_BASE.x,Math.min(MAP_BASE.x+MAP_BASE.w-zoomW,heroHex.rx-zoomW/2));
    const y=Math.max(MAP_BASE.y,Math.min(MAP_BASE.y+MAP_BASE.h-zoomH,heroHex.ry-zoomH/2));
    setMapView({x,y,w:zoomW,h:zoomH});
  },[me]);
  // ── Structured log: auto-categorize from emoji/content ──
  const turnRef=useRef(0);
  const stepRef=useRef(0);
  const categorize=(msg)=>{
    if(/^📝/.test(msg))return"note"; // annotation manuelle du joueur — avant tout
    if(/\[Début/.test(msg))return"snap"; // snapshots de debug (joueur + bots)
    if(/⚔|Combat|combat|Combattre/.test(msg))return"combat";
    if(/🤖/.test(msg))return"bot";
    if(/⭐|étoile|star/i.test(msg))return"star";
    if(/⚠|❌|Err/i.test(msg))return"warn";
    if(/📜|Rencontre|encounter/i.test(msg))return"encounter";
    if(/⚙|Rouge River/i.test(msg))return"rr";
    if(/🚶|Move|Déplacement|mouvement|→ #/i.test(msg))return"move";
    if(/⬡|Deploy|Mecha déployé/i.test(msg))return"deploy";
    if(/🏗|Build|construit/i.test(msg))return"build";
    if(/🤝|Enlist|Recrue/i.test(msg))return"enlist";
    if(/⬆|Upgrade/i.test(msg))return"upgrade";
    if(/💰|Commerce|Trade|Bolster|pui|puissance/i.test(msg))return"resource";
    if(/🔓|Ability/i.test(msg))return"ability";
    if(/── Tour/.test(msg))return"turn";
    return"info";
  };
  const mkEntry=(msg)=>{stepRef.current++;return{msg,turn:turnRef.current,step:stepRef.current,ts:Date.now(),cat:categorize(msg)};};
  const addLog=useCallback((msg)=>setLog(prev=>[...prev,mkEntry(msg)]),[]);
  const addLogs=useCallback((msgs)=>setLog(prev=>[...prev,...msgs.map(mkEntry)]),[]);
  // State snapshot for debug — shows key stats of a player
  const logSnap=useCallback((label,p)=>{
    if(!p)return;
    const totalRes=(t)=>{let s=0;Object.values(p.resources||{}).forEach(r=>{if(r[t])s+=r[t];});return s;};
    const snap=`[${label}] ⚡${p.power} 🃏${p.combatCards} ♥${p.pop} 💰${p.coins} ⭐${p.stars||0} W${p.workers?.length||0} M${p.mechs?.length||0} Fe${totalRes("metal")} Bo${totalRes("bois")} No${totalRes("nourriture")} Pe${totalRes("petrole")} Ab[${(p.unlockedAbilities||[]).join(",")}]`;
    addLog(snap);
  },[addLog]);

  const startGame=useCallback(()=>{
    if(!selFaction||!selMat)return;
    // Carte : v3 (défaut), configuration initiale (v2), ou procédurale
    if(mapChoice==="random"){
      const gen=generateAcceptedMap(Math.random);
      loadMap(gen.map);
      addLog(`🗺 Carte procédurale générée (${gen.tries} essai${gen.tries>1?"s":""})`);
    } else if(mapChoice==="v2"){
      loadMap(CLASSIC_V2_MAP);
      addLog(`🗺 Carte classique — configuration initiale (v2)`);
    } else {
      loadMap(DEFAULT_MAP);
    }
    setEncounterTokens(new Set(CURRENT_MAP.encounterHexes));
    setEmpire(empireEnabled?Object.fromEntries(EMPIRE_START.map(e=>[e.id,e.hexId])):{});
    if(empireEnabled)addLog(`🤖 Bots de l'Empire activés (mécanique campagne)`);
    // La carte de base démarre sans rails — seules les Gares en posent
    setRails([]);
    setRrVisitors(0);
    // 🏦 Tuiles bonus $ retirées du jeu de base — l'idée est réservée à la
    // mission « Ruée vers l'or » du mode campagne (voir docs/campagne.md)
    setStructureBonus(null);
    const usedFactions=[selFaction];const usedMats=[selMat];
    const ps=[createPlayer(selFaction,selMat,false)];
    const availF=FACTION_IDS.filter(f=>!usedFactions.includes(f));
    const availM=MATS.map(m=>m.id).filter(id=>!usedMats.includes(id));
    for(let i=0;i<numBots&&i<availF.length;i++){
      const bot=createPlayer(availF[i],availM[i%availM.length],true);
      // Profil stratégique (bâtisseur/blitz/thésauriseur/équilibré) + bruit
      // décisionnel selon la difficulté choisie au setup
      bot.botProfile=assignBotProfile(bot.faction,difficulty);
      bot.botNoise=BOT_NOISE[difficulty]??3;
      ps.push(bot);
      usedFactions.push(availF[i]);usedMats.push(availM[i%availM.length]);
    }
    const shuffled=shuffleArray(OBJECTIVES);
    ps.forEach((p,i)=>{
      const o1=shuffled[(i*2)%shuffled.length];const o2=shuffled[(i*2+1)%shuffled.length];
      p.objectives=[o1,o2];
      if(p.isBot){p.objective=Math.random()>0.5?o1:o2;}
    });
    setPlayers(ps);setPhase("playing");setCurrentP(0);setTurn(1);turnRef.current=1;
    addLog(`⚔ ${ps.length} joueurs`);
    ps.forEach(p=>{
      const f=FACTIONS[p.faction];
      const prof=p.isBot?BOT_PROFILES[p.botProfile]:null;
      addLog(`${p.isBot?"🤖":"👤"} ${f.name} (${p.matName})${prof?` ${prof.icon} ${prof.name}`:""}  ⚡${p.power} 🃏${p.combatCards} ♥${p.pop} 💰${p.coins}`);
    });
    // Auto-center on player's hero
    const heroHex=hMap[ps[0].hero];
    if(heroHex){
      const zw=700,zh=700;
      const x=Math.max(MAP_BASE.x,Math.min(MAP_BASE.x+MAP_BASE.w-zw,heroHex.rx-zw/2));
      const y=Math.max(MAP_BASE.y,Math.min(MAP_BASE.y+MAP_BASE.h-zh,heroHex.ry-zh/2));
      setMapView({x,y,w:zw,h:zh});
    }
  },[selFaction,selMat,numBots,mapChoice,empireEnabled,difficulty,addLog]);

  const revealObjective=useCallback((objIdx)=>{
    const p=players[0];if(!p||p.objectiveRevealed)return;
    const obj=p.objectives?.[objIdx];if(!obj)return;
    if(obj.check(p)){setPlayers(prev=>{const n=[...prev];n[0]={...n[0],objectiveRevealed:true,revealedObjectiveIdx:objIdx,stars:n[0].stars+1};return n;});addLog(`⭐ "${obj.name}" révélé !`);}
    else addLog(`❌ "${obj.name}" — condition non remplie`);
  },[players,addLog]);

  // Objectif de faction : comme la mission secrète, le révéler est un CHOIX —
  // garder une étoile « invisible » pour conclure par surprise est une
  // stratégie légitime (le sandbagging du 4-étoiles)
  const revealFObj=useCallback(()=>{
    const p=players[0];const fc=FACTIONS[p?.faction];
    if(!p||!fc?.fObj||p.fObjRevealed||!fc.fObj.check(p))return;
    setPlayers(prev=>{const n=[...prev];n[0]={...n[0],stars:n[0].stars+1,fObjRevealed:true};return n;});
    addLog(`🏛⭐ Objectif de faction "${fc.fObj.name}" révélé !`);
  },[players,addLog]);

  useEffect(()=>{
    if(phase!=="playing"||!botRunning||players.length===0)return;
    const cp=currentP;
    if(cp>=players.length){
      // ── END OF ROUND: Empire movement ──
      const empireIds=Object.keys(empire);
      if(empireIds.length>0){
        const dirs=[[0,-1],[1,-0.5],[1,0.5],[0,1],[-1,0.5],[-1,-0.5]]; // 6 hex directions (pointy-top)
        // Pick a random empire mecha and move it
        const eid=empireIds[Math.floor(Math.random()*empireIds.length)];
        const fromId=empire[eid];
        const adj=ADJ[fromId]||[];
        // Empire can cross rivers but not lakes/swamps
        const validEmpire=adj.filter(toId=>{const h=hMap[toId];return h&&h.t!=="lac"&&h.t!=="marecage"&&!h.base;});
        if(validEmpire.length>0){
          const toId=validEmpire[Math.floor(Math.random()*validEmpire.length)];
          setEmpire(prev=>({...prev,[eid]:toId}));
          addLog(`🔴 Empire ${eid} → #${toId}`);
          // Check if empire moved onto a player's combat unit → trigger combat
          for(let pi=0;pi<players.length;pi++){
            const pl=players[pi];
            const hasCombatUnit=pl.hero===toId||pl.mechs.some(m=>m.hexId===toId);
            if(hasCombatUnit){
              if(pl.isBot){
                // Auto-resolve bot defense
                const card=drawEmpireCombat();
                const botCBonus=getCombatBonus(pl,toId,false);
                // Ability bonus adds to the combat total but is NOT spent from the power track
                const botSpend=Math.min(Math.floor(pl.power*0.5),5,pl.power);
                const botUnitsOnHex=(pl.hero===toId?1:0)+pl.mechs.filter(m=>m.hexId===toId).length;
                const botCC=Math.min(Math.floor(Math.random()*(pl.combatCards+1)),botUnitsOnHex+botCBonus.cardBonus);
                const botTotal=botSpend+botCBonus.powerBonus+(botCC*2);
                const bf=FACTIONS[pl.faction];
                const updPlayers=[...players];const bp={...updPlayers[pi]};
                bp.power-=botSpend;bp.combatCards-=botCC;
                if(botTotal>=card.power){ // defender wins ties (same rule as the human defender)
                  addLog(`⚔🤖 ${bf.name} défend vs ${card.name} (${botTotal} vs ${card.power}) ✅`);
                  setEmpire(prev2=>{const n2={...prev2};delete n2[eid];return n2;});
                  bp.empireKills=(bp.empireKills||0)+1;
                  if(bp.empireKills>=3&&!bp.starLiberator){bp.stars++;bp.starLiberator=true;addLog(`⭐💀 ${bf.name} LIBÉRATEUR !`);}
                } else {
                  addLog(`⚔🤖 ${bf.name} échoue vs ${card.name} (${botTotal} vs ${card.power})`);
                  // Retreat bot unit to home base
                  const hb=HOME_BASES[pl.faction];
                  const hbHex=baseHexAt(hb);
                  if(bp.hero===toId)bp.hero=hbHex.id;
                  bp.mechs=bp.mechs.map(m=>m.hexId===toId?{...m,hexId:hbHex.id}:m);
                }
                updPlayers[pi]=bp;
                setPlayers(updPlayers);
              } else {
                // Human player — trigger interactive combat (defender)
                const card=drawEmpireCombat();
                setCombat({type:"pve",hexId:toId,empireId:eid,empireCard:card,phase:"choose",powerSpend:0,cardsSpend:0,
                  empireAttacks:true});
                addLog(`⚔ L'Empire attaque ! ${card.name} (Force: ${card.power}) sur #${toId}`);
              }
              break; // only one combat per empire move
            }
          }
        }
      }
      // Reset commerceUsed for human player at start of new turn
      setPlayers(prev=>{const n=[...prev];n[0]={...n[0],commerceUsed:false,importUsed:false,planTopUsed:false};return n;});
      turnRef.current=turn+1;setCurrentP(0);setTurn(t=>t+1);setBotRunning(false);addLog(`── Tour ${turn+1} ──`);logSnap("Début",players[0]);
      // Snapshots de debug des BOTS : leurs compteurs étaient invisibles au
      // journal — impossible de vérifier leurs gains (demande de partie réelle)
      players.slice(1).forEach(bp=>logSnap(`Début 🤖 ${FACTIONS[bp.faction]?.name||bp.faction}`,bp));
      return;
    }
    if(!players[cp].isBot){setBotRunning(false);return;}
    const timer=setTimeout(()=>{
      // Build enemy hexes set for this bot (all hexes with other factions' units)
      const botEnemyHexes=new Set();
      // PvP : hex des unités combattantes adverses → force défensive estimée
      // (l'IA n'attaque que sur avantage réel)
      const attackable=new Map();
      const hexLoot=new Map();
      // Méta-stratégie : menace par hex = a priori de la faction sur cette
      // carte + bonus si son propriétaire mène la partie (harceler le leader)
      const hexThreat=new Map();
      const standings=players.map((op,oi)=>oi===cp?-1:playerStanding(op));
      const leaderIdx=standings.indexOf(Math.max(...standings));
      players.forEach((op,oi)=>{
        if(oi===cp)return;
        botEnemyHexes.add(op.hero);
        op.mechs.forEach(m=>botEnemyHexes.add(m.hexId));
        op.workers.forEach(w=>botEnemyHexes.add(w.hexId));
        // Force défensive RÉALISTE par hex : puissance plafonnée à 7 (règle) et
        // cartes limitées aux unités de combat PRÉSENTES sur l'hex (+1 de marge
        // pour les bonus de faction). L'ancienne formule power+cartes×2 comptait
        // toute la main : estimations gonflées → décisions d'attaque absurdes.
        const effStrength=(hid)=>{
          const units=(op.hero===hid?1:0)+op.mechs.filter(m=>m.hexId===hid).length;
          return Math.min(op.power,7)+Math.min(op.combatCards||0,units+1)*2;
        };
        attackable.set(op.hero,Math.max(attackable.get(op.hero)||0,effStrength(op.hero)));
        op.mechs.forEach(m=>attackable.set(m.hexId,Math.max(attackable.get(m.hexId)||0,effStrength(m.hexId))));
        // Butin par hex : les tas de ressources attirent les raids (le
        // vainqueur d'un combat prend les ressources du hex)
        Object.entries(op.resources||{}).forEach(([hid,res])=>{
          const total=Object.values(res).reduce((a,b)=>a+b,0);
          if(total>0)hexLoot.set(parseInt(hid),(hexLoot.get(parseInt(hid))||0)+total);
        });
        const threat=Math.min(6,(MAP_META_THREAT[op.faction]||0)+(oi===leaderIdx?3:0));
        if(threat>0){
          [op.hero,...op.mechs.map(m=>m.hexId),...op.workers.map(w=>w.hexId)]
            .forEach(hid=>hexThreat.set(hid,Math.max(hexThreat.get(hid)||0,threat)));
        }
      });
      const botCtx={attackable,hexLoot,hexThreat,forbidden:new Set(),encounterHexes:encounterTokens};
      let result=botTurn(players[cp],empire,botEnemyHexes,rails,botCtx);
      let p=result.player;const logs=[...result.logs];
      // ── BOT COMBAT: check if bot moved onto Empire mecha ──
      const botHeroHex=p.hero;
      const empireOnHero=Object.entries(empire).find(([_,hid])=>hid===botHeroHex);
      if(empireOnHero&&p.power>=2){
        const card=drawEmpireCombat();
        // Combat ability bonus (bot is attacker) — adds to total, not spent from track
        const botCBonus=getCombatBonus(p, botHeroHex, true);
        const botSpend=Math.min(Math.floor(p.power*0.6),7,p.power);
        // Card limit = 1 per combat unit (hero/mech) on the hex + card bonus
        const botUnitsOnHex=(p.hero===botHeroHex?1:0)+p.mechs.filter(m=>m.hexId===botHeroHex).length;
        const botCC=Math.min(Math.floor(Math.random()*(p.combatCards+1)),botUnitsOnHex+botCBonus.cardBonus);
        const botTotal=botSpend+botCBonus.powerBonus+(botCC*2);
        const bf=FACTIONS[p.faction];
        p.power-=botSpend;p.combatCards-=botCC;
        if(botTotal>=card.power){
          logs.push(`⚔🤖 ${bf.name} bat ${card.name} (${botTotal} vs ${card.power})`);
          // Remove empire mecha
          setEmpire(prev=>{const n={...prev};delete n[empireOnHero[0]];return n;});
          p.empireKills=(p.empireKills||0)+1;
          // Bot picks random reward
          const rw=Math.random();
          if(rw<0.4){p.pop=Math.min(p.pop+2,18);logs.push(`🤖 ${bf.name}: +2 Pop`);}
          else{
            const hid=String(botHeroHex);if(!p.resources[hid])p.resources[hid]={};
            p.resources[hid].metal=(p.resources[hid].metal||0)+2;
            logs.push(`🤖 ${bf.name}: +2 Métal`);
          }
          if(p.empireKills>=3&&!p.starLiberator){p.stars++;p.starLiberator=true;logs.push(`⭐💀 ${bf.name}: LIBÉRATEUR !`);}
          // Chimère: Bayou captures destroyed Empire mech (1×/game)
          if(p.faction==="bayou"&&!p.chimereUsed){
            p.mechs=[...p.mechs,{id:`${p.faction}_chimere`,hexId:botHeroHex}];
            p.chimereUsed=true;p.capturedMech=(p.capturedMech||0)+1;
            logs.push(`🤖🧟 ${bf.name}: Chimère ! Mecha Empire capturé !`);
          }
        } else {
          logs.push(`⚔🤖 ${bf.name} échoue vs ${card.name} (${botTotal} vs ${card.power})`);
          // Bot retreats hero to HB
          const bhb=HOME_BASES[p.faction];
          const bhbHex=baseHexAt(bhb);
          p.hero=bhbHex.id;
        }
      }
      // Copie locale des joueurs : déplacements, pièges, PvP bot↔bot, rencontre, enlist
      let n=[...players];n[cp]=p;
      // ── SCYTHE RULE: bot hero/mech displaces other players' workers ──
      const botHexes=new Set([p.hero,...p.mechs.map(m=>m.hexId)]);
      for(let oi=0;oi<n.length;oi++){
        if(oi===cp)continue;
        // Rule: workers retreat only when ALONE on the hex — if their hero/mechs
        // defend it, a combat resolves instead (they retreat with the loser)
        const defended=(hid)=>n[oi].hero===hid||n[oi].mechs.some(m=>m.hexId===hid);
        const displaced=n[oi].workers.filter(w=>botHexes.has(w.hexId)&&!defended(w.hexId));
        if(displaced.length>0){
          const ohb=HOME_BASES[n[oi].faction];
          const ohbHex=baseHexAt(ohb);
          const dispHexes=[...new Set(displaced.map(w=>w.hexId))];
          n[oi]={...n[oi],workers:n[oi].workers.map(w=>botHexes.has(w.hexId)&&!defended(w.hexId)?{...w,hexId:ohbHex.id}:w)};
          // Bot loses pop for displacing workers
          n[cp]={...n[cp],pop:Math.max(0,(n[cp].pop||0)-displaced.length)};
          // Pillage : le magot des hexes pris passe au nouvel occupant
          const deepResB=(pl)=>{const r={};Object.entries(pl.resources).forEach(([k,v])=>{r[k]={...v};});return r;};
          const loserB={...n[oi],resources:deepResB(n[oi])};
          const winnerB={...n[cp],resources:deepResB(n[cp])};
          dispHexes.forEach(hid=>transferHexResources(loserB,winnerB,hid));
          n[oi]=loserB;n[cp]=winnerB;
          logs.push(`🏃 ${displaced.length} ouvrier(s) ${FACTIONS[n[oi].faction].name} renvoyé(s) ! (-${displaced.length} Pop ${FACTIONS[n[cp].faction].name})`);
          const servB=servitudeOnDisplace(n[cp],displaced[0].hexId);
          if(servB.captured){n[cp]=servB.player;logs.push(`⛓🤖 Servitude ! ${FACTIONS[n[cp].faction].name} capture un ouvrier (${n[cp].capturedWorkers}/2)`);}
        }
        // ── TRAP TRIGGER: bot hero/mech lands on enemy Frente trap ──
        // Même pénalité durcie que côté joueur : -3⚡ ET -2♥
        if(n[oi].faction==="frente"){
          (n[oi].trapTokens||[]).forEach((trap,ti)=>{
            if(botHexes.has(trap.hexId)&&!trap.disarmed){
              const penalty=Math.min(n[cp].power||0,3);
              n[cp]={...n[cp],power:Math.max(0,(n[cp].power||0)-penalty),pop:Math.max(0,(n[cp].pop||0)-2)};
              n[oi]={...n[oi],trapTokens:[...n[oi].trapTokens]};
              n[oi].trapTokens[ti]={...n[oi].trapTokens[ti],disarmed:true};
              logs.push(`💥 Trap Frente sur #${trap.hexId} ! ${FACTIONS[n[cp].faction].name} -${penalty}⚡ -2♥`);
            }
          });
        }
      }
      // ── PVP ENTRE BOTS : combats résolus à la fin de l'action Move (règle p.22) ──
      const pvp=applyBotPvpAfterMove(n,cp,(oi)=>n[oi].isBot);
      n=pvp.players;pvp.logs.forEach(l=>logs.push(l));
      // ── PVP BOT → JOUEUR : le bot a engagé le combat, le joueur défend via le modal ──
      const human=n[0];
      const botCombatHexes2=new Set([n[cp].hero,...n[cp].mechs.map(m=>m.hexId)]);
      const clashHex=[human.hero,...human.mechs.map(m=>m.hexId)].find(h=>botCombatHexes2.has(h));
      let humanDefense=null;
      if(clashHex!==undefined&&!human.isBot){
        const atk=n[cp];
        const atkUnits=(atk.hero===clashHex?1:0)+atk.mechs.filter(m=>m.hexId===clashHex).length;
        const atkCB=getCombatBonus(atk,clashHex,true,human.combatCards);
        // Le bot engage secrètement puissance + cartes (déduits à la résolution).
        // FEINTE : très supérieur en visible, il mise parfois le minimum en
        // pariant que vous ne miserez rien (« perdu d'avance ») — à vous de voir…
        // Estimation RÉALISTE du défenseur : cartes limitées aux unités de
        // combat sur l'hex (+1 de marge), pas toute la main. Et jamais de
        // pari en fin de partie (5⭐ visibles : perdre le combat peut donner
        // la 6e étoile adverse — on joue le maximum, pas le bluff).
        const humanUnitsAtClash=(human.hero===clashHex?1:0)+human.mechs.filter(m=>m.hexId===clashHex).length;
        const humanVis=Math.min(human.power,7)+Math.min(human.combatCards,humanUnitsAtClash+1)*2;
        const botVis=Math.min(atk.power,7)+atkCB.powerBonus+Math.min(atk.combatCards,atkUnits+atkCB.cardBonus)*2;
        const endgame=players.some(pl=>pl.stars>=5);
        const botFeints=!endgame&&botVis>=humanVis+8&&Math.random()<0.35;
        const botSpend=botFeints?Math.min(1,atk.power):Math.min(Math.floor(atk.power*0.7)+1,7,atk.power);
        const botCards=botFeints?0:Math.min(atk.combatCards,atkUnits+atkCB.cardBonus);
        humanDefense={type:"pvp_defense",hexId:clashHex,enemyIdx:cp,phase:"choose",powerSpend:0,cardsSpend:0,botSpend,botCards,resumeCp:cp+1};
        logs.push(`⚔ ${FACTIONS[atk.faction].name} vous attaque sur #${clashHex} ! Défendez-vous.`);
      }
      // ── RENCONTRE BOT : héros sur un jeton, après les combats (règle p.24) ──
      if(encounterTokens.has(n[cp].hero)){
        const encHex=n[cp].hero;
        const er=resolveBotEncounter(n[cp]);
        n[cp]=er.player;logs.push(er.log);
        setEncounterTokens(prev=>{const s=new Set(prev);s.delete(encHex);return s;});
      }
      // ── ROUGE RIVER BOT : héros sur l'Usine (1re visite) → plan auto ──
      // Même règle que le joueur : le tirage rétrécit avec les visiteurs
      // précédents, Tesla accessible avec les fragments requis
      if(n[cp].hero===FACTORY_RR_HEX&&!n[cp].visitedRR){
        const hasFrag=(n[cp].fragments||0)>=TESLA_FRAGMENTS_REQUIRED;
        const pool=hasFrag?[...PLANS_FORD,...PLANS_TESLA]:[...PLANS_FORD];
        const seeCount=Math.max(1,Math.min(pool.length,pool.length-rrVisitors));
        const visible=shuffleArray(pool).slice(0,seeCount);
        const card=visible.find(c=>c.type==="tesla")||visible[Math.floor(Math.random()*visible.length)];
        n[cp]={...n[cp],visitedRR:true,factoryCard:card};
        setRrVisitors(prev=>prev+1);
        logs.push(`⚙ ${FACTIONS[n[cp].faction].name} visite la Rouge River → plan « ${card.name} »${card.type==="tesla"?" (Tesla)":""}`);
      }
      // ── ENLIST ONGOING: bot did a bottom action → trigger for self + neighbors ──
      if(result.bottomCol>=0){
        const enlistResult=applyEnlistOngoing(n,cp,result.bottomCol,FACTIONS);
        enlistResult.logs.forEach(l=>logs.push(l));
        for(let ei=0;ei<enlistResult.players.length;ei++){n[ei]=enlistResult.players[ei];}
      }
      // Apply bot-placed rails (from Gare build)
      // Capture the array before deleting: the setRails updater runs after this code
      if(n[cp]._pendingRails&&n[cp]._pendingRails.length>0){
        const newRails=[...n[cp]._pendingRails];
        n[cp]={...n[cp]};delete n[cp]._pendingRails;
        setRails(prev=>[...prev,...newRails]);
      }
      setPlayers(n);
      addLogs(logs);
      if(humanDefense){
        // Pause de la chaîne des bots : reprise dans resolveCombat (resumeCp)
        setBotRunning(false);
        setCombat(humanDefense);
      } else {
        setCurrentP(cp+1);
      }
    },350);
    return()=>clearTimeout(timer);
  },[botRunning,currentP,players,phase,empire,turn,rails,encounterTokens,rrVisitors,addLog,addLogs]);

  // After top-row → show bottom-row option
  const endHumanTurn=useCallback((col,movedOverride)=>{
    // Log UNIQUE de fin de déplacement — avant, chaque point d'appel loguait
    // (ou pas) « ✅ Mouvement terminé » : le même événement apparaissait au
    // journal selon le bouton cliqué (incohérence constatée en partie réelle).
    // movedOverride : compte frais quand l'appelant vient de setPlayers (état
    // `me` encore périmé dans sa closure).
    const moved=movedOverride??(me?.movedUnits||[]).length;
    if((myMat?.topRow||[])[col]==="Move"&&moved>0)addLog(`✅ Mouvement terminé (${moved}/${moveLimit})`);
    setPlayers(prev=>{const n=[...prev];n[0]={...n[0],lastCol:col,movesLeft:undefined,movedUnits:[],packUpUsed:false};return n;});
    setSelAction(null);setMoveSource(null);setUnitPicker(null);setPreActionSnapshot(null);setTradePicks([]);setRouteDrop(null);
    // Show bottom-row option
    const bottomAction=BOTTOM[col];
    setPendingBottom({col,action:bottomAction});
    setBottomPick(null);
  },[me,myMat,moveLimit,addLog]);

  // Actually finish and pass to bots
  const actuallyEndTurn=useCallback(()=>{
    setPendingBottom(null);setBottomPick(null);setEndOfTurn(false);
    // On ne peut pas annuler par-delà le tour des bots (tirages aléatoires) :
    // les piles sont vidées au passage à l'IA.
    setUndoStack([]);setRedoStack([]);
    setCurrentP(1);setBotRunning(true);
  },[]);

  // ── VALIDATION DE FIN DE TOUR (façon Scythe Digital Edition) : au lieu de
  // passer directement la main aux bots, on ouvre une étape « Fin du tour » —
  // c'est LÀ (et seulement là) que se révèlent les objectifs, et révéler
  // termine le tour au passage. Le joueur garde aussi une dernière fenêtre
  // pour Commerce/Import Impérial avant de valider.
  const requestEndTurn=useCallback(()=>{
    setPendingBottom(null);setBottomPick(null);
    setEndOfTurn(true);
  },[]);

  // Wrapper: apply enlist ongoing bonuses then end turn
  const finishBottom=useCallback((bottomCol)=>{
    setPlayers(prev=>{
      const result=applyEnlistOngoing(prev,0,bottomCol,FACTIONS);
      result.logs.forEach(l=>addLog(l));
      return result.players;
    });
    requestEndTurn();
  },[addLog,requestEndTurn]);

  // ── BOTTOM-ROW: UPGRADE (2-step: pick top source → pick bottom dest) ──
  const doUpgrade=useCallback((fromCol,toCol)=>{
    if(!me||(me.upgrades||0)>=6)return;
    const costs=getBottomCost(me);
    const cost=costs[0]; // Upgrade is always bottom col 0
    // Apply plan bottom bonus (cost reduction)
    const planBonus=getPlanBottomBonus(me,"Upgrade");
    const effectiveQty=Math.max(0,cost.qty-planBonus.costReduction);
    if(countRes(me,cost.res)<effectiveQty){addLog(`⚠ ${effectiveQty} ${cost.res} requis`);return;}
    const mat=MATS.find(m=>m.id===me.matId);
    if(!mat)return;
    if((me.cubesOnTop||[])[fromCol]<=0){addLog(`⚠ Pas de cube sur cette action top`);return;}
    // Plafond règle Scythe : jamais plus de (base - 1) cubes → coût min 1
    if((me.cubesOnBottom||[])[toCol]>=maxBottomCubes(mat,toCol)){addLog(`⚠ Plus de place sur cette action bottom`);return;}
    setPlayers(prev=>{
      const n=[...prev];let p={...n[0]};
      p=spendRes(p,cost.res,effectiveQty);
      p.cubesOnTop=[...(p.cubesOnTop||[])];p.cubesOnTop[fromCol]--;
      p.cubesOnBottom=[...(p.cubesOnBottom||[])];p.cubesOnBottom[toCol]++;
      p.upgrades=(p.upgrades||0)+1;
      p.coins+=(mat.bottomCosts[toCol].bonus||0)+planBonus.bonusCoins;
      p.power=Math.min(p.power+planBonus.bonusPower,16);
      const earned=p.upgrades>=6&&!p.starUpgrades;
      if(earned){p.stars++;p.starUpgrades=true;}
      n[0]=p;return n;
    });
    const topName=me.topRow[fromCol];const bottomName=BOTTOM[toCol];
    planBonus.logs.forEach(l=>addLog(l));
    addLog(`⬆ Upgrade ${(me.upgrades||0)+1}/6: ${topName}↑ → ${bottomName}↓ (-${effectiveQty} ${cost.res}, +${(mat.bottomCosts[toCol].bonus||0)+planBonus.bonusCoins}$)`);
    if((me.upgrades||0)+1>=6)addLog(`⭐ 6 Upgrades complétés !`);
    finishBottom(0);
  },[me,addLog,finishBottom]);

  // ── BOTTOM-ROW: DEPLOY ──
  // Nations "Esprit Sauvage": can deploy with metal OR bois
  // Capacités de mecha SPÉCIFIQUES à la faction du joueur (noms + descriptions
  // depuis data/mechAbilities.js — les mécaniques sont dans movement/combat)
  const myMechAbilities=getMechAbilities(me?.faction);

  const doDeploy=useCallback((targetHex,overrideRes)=>{
    // Garde de ré-entrée : le choix de capacité en cours = le Deploy de ce
    // tour est déjà fait (un 2e clic déployait un 2e mecha, bug mesuré en jeu)
    if(!me||me.mechs.length>=4||pendingAbility)return;
    const costs=getBottomCost(me);
    const depCost=costs[1]; // Deploy is bottom col 1
    const baseRes=overrideRes||depCost.res;
    const planBonus=getPlanBottomBonus(me,"Deploy");
    const qty=Math.max(0,depCost.qty-planBonus.costReduction);
    const res=overrideRes||baseRes;
    if(countRes(me,res)<qty){addLog(`⚠ ${qty} ${res} requis`);return;}
    setPlayers(prev=>{
      const n=[...prev];let p=spendRes(n[0],res,qty);
      p.mechs=[...p.mechs,{id:`${p.faction}_m${p.mechs.length}`,hexId:targetHex}];
      // Do NOT unlock ability yet — player chooses
      p.coins+=planBonus.bonusCoins;
      p.power=Math.min(p.power+planBonus.bonusPower,16);
      const earned=p.mechs.length>=4&&!p.starMechs;
      if(earned){p.stars++;p.starMechs=true;}
      n[0]=p;return n;
    });
    planBonus.logs.forEach(l=>addLog(l));
    addLog(`⬡ Mecha déployé sur #${targetHex} (-${qty} ${res})`);
    if(me.mechs.length+1>=4)addLog(`⭐ 4 Mechas déployés !`);
    // Show ability picker — finishBottom will be called after player picks
    setPendingAbility({source:"deploy",col:1});
  },[me,addLog,pendingAbility]);

  const confirmAbility=useCallback((abilityIdx)=>{
    setPlayers(prev=>{
      const n=[...prev];const p={...n[0],unlockedAbilities:[...(n[0].unlockedAbilities||[]),abilityIdx]};
      n[0]=p;return n;
    });
    addLog(`🔓 Ability débloquée : ${myMechAbilities[abilityIdx]?.icon||""} ${myMechAbilities[abilityIdx]?.name||""}`);
    const source=pendingAbility;
    setPendingAbility(null);
    if(source&&source.source==="deploy") finishBottom(source.col);
    if(source&&source.source==="encounter"){
      // Resume movement check after encounter mech ability pick
      const moved=(me.movedUnits||[]).length;
      if(moved>=moveLimit){setTimeout(()=>endHumanTurn(myMat.topRow.indexOf("Move")),100);}
    }
  },[pendingAbility,me,addLog,finishBottom,endHumanTurn,myMat]);

  // ── BOTTOM-ROW: BUILD ──
  const doBuild=useCallback((targetHex,buildingType)=>{
    // Garde de ré-entrée : pendant la pose de rails (Gare), le Build de ce
    // tour est déjà fait — pas de 2e bâtiment avant finishBottom
    if(!me||(me.buildings||[]).length>=4||railPlacement)return;
    if((me.buildings||[]).some(b=>b.hexId===targetHex)){addLog(`⚠ Déjà un bâtiment sur #${targetHex}`);return;}
    if((me.buildings||[]).some(b=>b.type===buildingType)){addLog(`⚠ ${buildingType} déjà construit`);return;}
    const costs=getBottomCost(me);
    const cost=costs[2]; // Build is bottom col 2
    const planBonus=getPlanBottomBonus(me,"Build");
    const effectiveQty=Math.max(0,cost.qty-planBonus.costReduction);
    if(countRes(me,cost.res)<effectiveQty){addLog(`⚠ ${effectiveQty} ${cost.res} requis`);return;}
    const bt=BUILDING_TYPES.find(b=>b.type===buildingType);
    setPlayers(prev=>{
      const n=[...prev];let p=spendRes(n[0],cost.res,effectiveQty);
      p.buildings=[...(p.buildings||[]),{type:buildingType,hexId:targetHex}];
      p.coins+=planBonus.bonusCoins;
      p.power=Math.min(p.power+planBonus.bonusPower,16);
      const earned=p.buildings.length>=4&&!p.starBuildings;
      if(earned){p.stars++;p.starBuildings=true;}
      n[0]=p;return n;
    });
    planBonus.logs.forEach(l=>addLog(l));
    addLog(`🏗 ${bt.name} construit sur #${targetHex} (-${effectiveQty} ${cost.res})`);
    if((me.buildings||[]).length+1>=4)addLog(`⭐ 4 Bâtiments construits !`);
    if(buildingType==="gare"){
      setRailPlacement({remaining:3,fromHex:null,gareHex:targetHex});
      addLog(`🚂 Posez 3 segments de rail depuis la Gare ou un rail existant (pas sur lac/marécage)`);
      return;
    }
    finishBottom(2);
  },[me,addLog,finishBottom,railPlacement]);

  // ── PACK UP (Nations slot 3 — free building move during Move action) ──
  const doPackUpMove=useCallback((buildingIdx,targetHex)=>{
    if(!me||me.faction!=="nations")return;
    if(!(me.unlockedAbilities||[]).includes(3))return;
    if(me.packUpUsed)return; // 1 per Move action
    const bld=(me.buildings||[])[buildingIdx];
    if(!bld)return;
    if((me.buildings||[]).some(b=>b.hexId===targetHex&&b!==bld)){addLog(`⚠ Déjà un bâtiment sur #${targetHex}`);return;}
    const bt=BUILDING_TYPES.find(b=>b.type===bld.type);
    setPlayers(prev=>{
      const n=[...prev];const p={...n[0],buildings:[...(n[0].buildings||[])]};
      p.buildings[buildingIdx]={...p.buildings[buildingIdx],hexId:targetHex};
      p.packUpUsed=true;
      n[0]=p;return n;
    });
    addLog(`📦 Pack Up! ${bt?bt.name:bld.type} #${bld.hexId} → #${targetHex} (gratuit)`);
    setBottomPick(null);
  },[me,addLog]);

  // ── BOTTOM-ROW: ENLIST (recrue sur une colonne → bonus immédiat + ongoing) ──
  // Règle Scythe : le bonus IMMÉDIAT (une fois) est d'un type DIFFÉRENT du
  // bonus PERMANENT de la recrue. On garde l'ongoing fixé par colonne
  // (Upgrade → +2 Pièces, Deploy → +2 Pop, Build → +2 Cartes, Enlist → +2 Pui).
  // Le bonus PERMANENT (recrue) est choisi SÉPARÉMENT par le joueur → totalement
  // décorrélé du bonus immédiat (règle Scythe : on choisit quelle recrue poser).
  const ENLIST_BONUSES=ENLIST_IMMEDIATE; // bonus immédiat par colonne (source unique dans mats.js)
  // colIdx : action bottom qui reçoit la recrue (→ bonus immédiat de la section)
  // recruitIdx : QUELLE recrue permanente poser (0-3, indépendante de colIdx)
  const doEnlist=useCallback((colIdx,recruitIdx)=>{
    if(!me||(me.recruits||0)>=4)return;
    if((me.enlistMap||[])[colIdx]!=null){addLog(`⚠ Déjà une recrue sur ${BOTTOM[colIdx]}`);return;}
    if((me.enlistMap||[]).includes(recruitIdx)){addLog(`⚠ Recrue ${ENLIST_ONGOING[recruitIdx].label} déjà posée`);return;}
    const costs=getBottomCost(me);
    const cost=costs[3]; // Enlist is bottom col 3
    const planBonus=getPlanBottomBonus(me,"Enlist");
    const effectiveQty=Math.max(0,cost.qty-planBonus.costReduction);
    if(countRes(me,cost.res)<effectiveQty){addLog(`⚠ ${effectiveQty} ${cost.res} requis`);return;}
    const bonus=ENLIST_BONUSES[colIdx];
    const recruit=ENLIST_ONGOING[recruitIdx];
    setPlayers(prev=>{
      const n=[...prev];let p=spendRes(n[0],cost.res,effectiveQty);
      p.recruits=(p.recruits||0)+1;
      p.enlistMap=[...(p.enlistMap||[null,null,null,null])];
      p.enlistMap[colIdx]=recruitIdx; // stocke la recrue choisie (pas un booléen)
      bonus.apply(p);
      p.coins+=planBonus.bonusCoins;
      p.power=Math.min(p.power+planBonus.bonusPower,16);
      const earned=p.recruits>=4&&!p.starRecruits;
      if(earned){p.stars++;p.starRecruits=true;}
      n[0]=p;return n;
    });
    planBonus.logs.forEach(l=>addLog(l));
    addLog(`🤝 Recrue ${(me.recruits||0)+1}/4 sur ${BOTTOM[colIdx]} (-${effectiveQty} ${cost.res}) — immédiat ${bonus.label}`);
    addLog(`   Permanent ${recruit.icon} ${recruit.label} quand vous/voisins faites ${BOTTOM[colIdx]}`);
    if((me.recruits||0)+1>=4)addLog(`⭐ 4 Recrues enrôlées !`);
    finishBottom(3);
  },[me,addLog,finishBottom]);

  // ── FACTION ABILITY: COMMERCE IMPÉRIAL (Dominion, 1×/tour) ──
  const doCommerceImperial=useCallback((resType,reward)=>{
    if(!me||me.faction!=="dominion"||me.commerceUsed)return;
    if(countRes(me,resType)<1){addLog(`⚠ Pas de ${resType}`);return;}
    setPlayers(prev=>{
      const n=[...prev];let p=spendRes(n[0],resType,1);
      p.commerceUsed=true;
      if(reward==="coins"){p.coins+=1;p.imperialCoins=(p.imperialCoins||0)+1;}
      else{p.combatCards++;}
      n[0]=p;return n;
    });
    addLog(`🏛 Commerce Impérial : -1 ${resType} → ${reward==="coins"?"+1💰":"+1🃏"}`);
  },[me,addLog]);

  // Import Impérial (Dominion) : le commerce dans l'autre sens — 2$ → 1
  // ressource au choix (1×/tour). Corrige le goulot structurel de sa
  // péninsule (pétrole+métal : ni Build ni Enlist natifs).
  const doImportImperial=useCallback((resType)=>{
    if(!me||me.faction!=="dominion"||me.importUsed||me.coins<2)return;
    setPlayers(prev=>{
      const n=[...prev];const p={...n[0],resources:{...n[0].resources}};
      Object.keys(p.resources).forEach(k=>{p.resources[k]={...p.resources[k]};});
      const wHex=p.workers.length>0?String(p.workers[0].hexId):String(p.hero);
      if(!p.resources[wHex])p.resources[wHex]={};
      p.resources[wHex][resType]=(p.resources[wHex][resType]||0)+1;
      p.coins-=2;p.importUsed=true;
      n[0]=p;return n;
    });
    addLog(`🏛 Import Impérial : -2💰 → +1 ${resType}`);
  },[me,addLog]);

  // ── PLAN « Five Dollar Day » (pop_worker) : action libre 1×/tour, -2$ → +2 Pop +1 ouvrier ──
  const doPlanPopWorker=useCallback(()=>{
    if(!me||me.factoryCard?.topBonus!=="pop_worker"||me.planTopUsed||me.coins<2)return;
    setPlayers(prev=>{
      const n=[...prev];const p={...n[0],workers:[...n[0].workers]};
      p.coins-=2;p.pop=Math.min(p.pop+2,18);
      if(p.workers.length<8)p.workers.push({id:`${p.faction}_w${p.workers.length}`,hexId:p.hero});
      p.planTopUsed=true;
      n[0]=p;return n;
    });
    addLog(`⚙ Five Dollar Day : -2$ → +2 Pop${me.workers.length<8?" +1 ouvrier":""}`);
  },[me,addLog]);

  // ── PLAN « River Rouge Special » (teleport_res) : 1×/tour, rapatrier les ressources d'un hex vers le héros ──
  const doPlanTeleportRes=useCallback((fromHid)=>{
    if(!me||me.factoryCard?.topBonus!=="teleport_res"||me.planTopUsed)return;
    setPlayers(prev=>{
      const n=[...prev];const p={...n[0],resources:{...n[0].resources}};
      Object.keys(p.resources).forEach(k=>{p.resources[k]={...p.resources[k]};});
      const src=p.resources[String(fromHid)]||{};
      const destKey=String(p.hero);
      if(!p.resources[destKey])p.resources[destKey]={};
      Object.entries(src).forEach(([rt,q])=>{p.resources[destKey][rt]=(p.resources[destKey][rt]||0)+q;});
      delete p.resources[String(fromHid)];
      p.planTopUsed=true;
      n[0]=p;return n;
    });
    addLog(`⚙ River Rouge Special : ressources de #${fromHid} téléportées vers le héros (#${me.hero})`);
  },[me,addLog]);

  // ── ANIMATIONS DE GAIN (floaters) ──────────────────────────────────
  // Un système basé sur les deltas de stats : tout gain (action, bonus enlist
  // ongoing, bonus de bâtiment au Bolster…) fait « pop » l'icône correspondante.
  // Joueur → près de la barre du haut ; adversaires → mini au-dessus de leur base.
  const prevStatsRef=useRef(null);
  // variant : "big" (gains du joueur — gros toast au centre de l'écran),
  // "mini" (gains adverses au-dessus de leur base), sinon taille standard
  const spawnFloater=useCallback((icon,color,x,y,variant)=>{
    const id=`${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    setFloaters(f=>[...f,{id,icon,color,x,y,variant}]);
    setTimeout(()=>setFloaters(f=>f.filter(z=>z.id!==id)),variant==="big"?1800:1500);
  },[]);
  useEffect(()=>{
    if(phase!=="playing"||players.length===0){prevStatsRef.current=null;return;}
    const FKEYS=[["coins","🪙","var(--gold)"],["pop","❤","#e0708a"],["power","⚡","#e0603a"],["combatCards","🃏","#c0b0d8"],["stars","⭐","#e8c860"]];
    const snap=players.map(p=>({coins:p.coins,pop:p.pop,power:p.power,combatCards:p.combatCards,stars:p.stars}));
    const prev=prevStatsRef.current;
    if(prev&&prev.length===snap.length){
      const rect=mapRef.current?.getBoundingClientRect();
      const mv=mapViewRef.current;
      players.forEach((p,pi)=>{
        const pr=prev[pi];if(!pr)return;
        let stack=0;
        FKEYS.forEach(([k,icon,color])=>{
          const d=snap[pi][k]-pr[k];
          if(d>0&&d<=12){
            if(pi===0){
              // Gain du joueur : gros toast au CENTRE de l'écran (empilé
              // verticalement si plusieurs gains simultanés)
              const bx=window.innerWidth*0.5;
              const by=window.innerHeight*0.40+stack*72;
              spawnFloater(`+${d>1?d:""}${icon}`,color,bx,by,"big");
            } else if(rect&&mv){
              const hb=HOME_BASES[p.faction];
              const sx=rect.left+(hb.rx-mv.x)/mv.w*rect.width;
              const sy=rect.top+(hb.ry-mv.y)/mv.h*rect.height;
              if(sx>rect.left&&sx<rect.right&&sy>rect.top&&sy<rect.bottom)
                spawnFloater(`+${d>1?d:""}${icon}`,color,sx+stack*16,sy-24,"mini");
            }
            stack++;
          }
        });
      });
    }
    prevStatsRef.current=snap;
  },[players,phase,spawnFloater]);

  // Matérialise la main de cartes du joueur dès que son compteur change (gains)
  // → la main affichée/jouée reflète toujours combatCards, sans toucher aux ~15
  // sites de gain (qui font juste combatCards++).
  useEffect(()=>{
    if(phase!=="playing"||!me)return;
    if((me.cardHand?.length||0)===me.combatCards)return;
    setPlayers(prev=>{const n=[...prev];const p={...n[0]};reconcileHand(p);n[0]=p;return n;});
  },[me?.combatCards,me?.cardHand,phase]);

  // ── ANNULER / REFAIRE (undo/redo) ──────────────────────────────────
  // Pile de snapshots de l'état de jeu, poussée avant chaque coup humain et
  // vidée au passage aux bots (on n'annule pas au-delà de son propre tour ni
  // par-dessus des tirages aléatoires de l'IA). Les objets porteurs de
  // fonctions (objectifs) sont conservés par référence lors du clonage.
  const gameRef=useRef({});
  gameRef.current={players,empire,rails,encounterTokens,rrVisitors,selAction,preActionSnapshot};
  const cloneVal=useCallback((v)=>{
    if(Array.isArray(v))return v.map(cloneVal);
    if(v&&typeof v==="object"){
      if(Object.values(v).some(x=>typeof x==="function"))return v; // def immuable (objectif…)
      const o={};for(const k in v)o[k]=cloneVal(v[k]);return o;
    }
    return v;
  },[]);
  const snapshotGame=useCallback(()=>{
    const g=gameRef.current;
    return {players:g.players.map(cloneVal),empire:{...g.empire},rails:g.rails.map(r=>[...r]),encounterTokens:[...g.encounterTokens],rrVisitors:g.rrVisitors,
      // Contexte d'action : un undo de sous-coup (déplacement 2/2 → 1/2) doit
      // rester DANS l'action en cours — sinon on peut garder le 1er déplacement
      // et enchaîner une autre action top (Move gratuit + Produce).
      selAction:g.selAction,preActionSnapshot:g.preActionSnapshot};
  },[cloneVal]);
  const restoreGame=useCallback((snap)=>{
    setPlayers(snap.players.map(cloneVal));
    setEmpire({...snap.empire});
    setRails(snap.rails.map(r=>[...r]));
    setEncounterTokens(new Set(snap.encounterTokens));
    setRrVisitors(snap.rrVisitors);
    // annule tout état transitoire d'action en cours — mais restaure le
    // contexte d'action capturé (selAction/preActionSnapshot) du snapshot
    setSelAction(snap.selAction??null);setMoveSource(null);setUnitPicker(null);setPreActionSnapshot(snap.preActionSnapshot??null);setTradePicks([]);
    setPendingBottom(null);setBottomPick(null);setCombat(null);setEncounter(null);setRougeRiver(null);
    setEncounterBuild(false);setEncounterEnlist(null);
    setRailPlacement(null);setPendingAbility(null);setRouteDrop(null);setEndOfTurn(false);
  },[cloneVal]);
  const pushHistory=useCallback(()=>{ setUndoStack(s=>[...s.slice(-40),snapshotGame()]); setRedoStack([]); },[snapshotGame]);
  const undo=useCallback(()=>{
    setUndoStack(s=>{ if(s.length===0)return s; setRedoStack(r=>[...r,snapshotGame()]); restoreGame(s[s.length-1]); return s.slice(0,-1); });
    addLog("↶ Coup annulé");
  },[snapshotGame,restoreGame,addLog]);
  const redo=useCallback(()=>{
    setRedoStack(r=>{ if(r.length===0)return r; setUndoStack(u=>[...u,snapshotGame()]); restoreGame(r[r.length-1]); return r.slice(0,-1); });
    addLog("↷ Coup rétabli");
  },[snapshotGame,restoreGame,addLog]);

  // Hexes occupés par l'ennemi (joueurs + Empire) : destinations possibles
  // (combat / déplacement d'ouvriers) mais jamais TRAVERSÉS — ni par les pas
  // multiples (Vitesse), ni par le réseau de rails (bug du « saut par-dessus
  // le héros Frente » constaté en partie réelle)
  const enemyOccupiedHexes=useMemo(()=>{
    const s=new Set();
    for(let pi=1;pi<players.length;pi++){
      const ep=players[pi];
      s.add(ep.hero);
      ep.mechs.forEach(m=>s.add(m.hexId));
      ep.workers.forEach(w=>s.add(w.hexId));
    }
    Object.values(empire||{}).forEach(hid=>s.add(hid));
    return s;
  },[players,empire]);

  const validMoves=useMemo(()=>{
    if(!moveSource||!me)return new Set();
    let moves=getValidMoves(moveSource.fromHex,me.faction,me.unlockedAbilities||[],me,rails,moveSource.unitType,enemyOccupiedHexes);
    // Workers cannot enter hexes with any enemy units
    if(moveSource.unitType==="worker"){
      moves=moves.filter(id=>!enemyOccupiedHexes.has(id));
    }
    return new Set(moves);
  },[moveSource,me,rails,enemyOccupiedHexes,empire]);

  // Déplacement au clic : hex → unités du joueur encore déplaçables ce tour.
  // Cliquer un hex surligné sélectionne l'unité (picker si plusieurs).
  const movableUnits=useMemo(()=>{
    const m=new Map();
    if(!me||selAction!=="Move")return m;
    if((me.movedUnits||[]).length>=moveLimit)return m;
    const moved=new Set(me.movedUnits||[]);
    const add=(hid,u)=>{if(!m.has(hid))m.set(hid,[]);m.get(hid).push(u);};
    if(!moved.has("hero"))add(me.hero,{type:"hero",id:"hero",icon:"★",label:myFaction?.hero||"Héros"});
    me.mechs.forEach(mm=>{if(!moved.has(mm.id))add(mm.hexId,{type:"mech",id:mm.id,icon:"⬡",label:"Mecha"});});
    me.workers.forEach(w=>{if(!moved.has(w.id))add(w.hexId,{type:"worker",id:w.id,icon:"●",label:"Ouvrier"});});
    return m;
  },[me,selAction,myFaction]);

  // Mode « amélioration sur cartes » : pendant l'action Améliorer, les cartes
  // d'action restent affichées et leurs cases de cubes deviennent cliquables
  // (source en rangée haut, destination en rangée bas + bouton Valider)
  const upgradePicking=!!me&&pendingBottom?.action==="Upgrade"&&(me.upgrades||0)<6
    &&(()=>{const c=getBottomCost(me)[BOTTOM.indexOf("Upgrade")];return !!c&&countRes(me,c.res)>=c.qty;})();

  // Cibles cliquables sur la carte pour les actions bottom Deploy/Build
  // (en plus des boutons du panneau : cliquer l'hex surligné place directement)
  const actionTargets=useMemo(()=>{
    const none={type:null,hexes:new Set()};
    // Une seule exécution de l'action du bas par tour : tant que le choix de
    // capacité (Deploy) ou la pose de rails (Gare) est en cours, plus aucune
    // cible cliquable — sinon un 2e clic redéclenchait doDeploy/doBuild
    // (double mecha observé en partie réelle, une seule capacité débloquée)
    if(!me||!pendingBottom||pendingAbility||railPlacement)return none;
    const workerHexes=getWorkerHexes(me);
    const isLand=(h)=>{const hx=hMap[h];return hx&&hx.t!=="lac"&&hx.t!=="marecage";};
    if(pendingBottom.action==="Deploy"&&me.mechs.length<4){
      const bc=getBottomCost(me)[1];
      const qty=Math.max(0,bc.qty-getPlanBottomBonus(me,"Deploy").costReduction);
      const deployAlt=FACTIONS[me.faction]?.deployAltRes;
      const res=deployAlt?bottomPick?.deployRes:bc.res; // faction à ressource alternative : attendre le choix métal/bois
      if(!res||countRes(me,res)<qty)return none;
      const hexes=me.factoryCard?.bottomBonus==="deploy_adjacency"
        ?[...new Set(workerHexes.flatMap(h=>[h,...(ADJ[h]||[])]))].filter(isLand)
        :workerHexes;
      return{type:"deploy",res:deployAlt?res:undefined,hexes:new Set(hexes)};
    }
    if(pendingBottom.action==="Build"&&bottomPick?.building&&(me.buildings||[]).length<4){
      const bc=getBottomCost(me)[2];
      const qty=Math.max(0,bc.qty-getPlanBottomBonus(me,"Build").costReduction);
      if(countRes(me,bc.res)<qty)return none;
      const base=me.factoryCard?.bottomBonus==="build_no_worker"
        ?[...new Set([...workerHexes,me.hero,...me.mechs.map(m=>m.hexId)])].filter(isLand)
        :workerHexes;
      return{type:"build",hexes:new Set(base.filter(h=>!(me.buildings||[]).some(b=>b.hexId===h)))};
    }
    return none;
  },[me,pendingBottom,bottomPick,pendingAbility,railPlacement]);

  // Automatic stars for the human player (bots handle these in botTurn)
  useEffect(()=>{
    if(phase!=="playing"||players.length===0)return;
    const p=players[0];if(!p||p.isBot)return;
    if(p.power>=16&&!p.starPower){
      setPlayers(prev=>{const n=[...prev];n[0]={...n[0],stars:n[0].stars+1,starPower:true};return n;});
      addLog(`⭐⚡ Puissance maximale (16) !`);return;
    }
    if(p.pop>=18&&!p.starPop){
      setPlayers(prev=>{const n=[...prev];n[0]={...n[0],stars:n[0].stars+1,starPop:true};return n;});
      addLog(`⭐♥ Popularité maximale (18) !`);return;
    }
    if(p.workers.length>=8&&!p.starWorkers){
      setPlayers(prev=>{const n=[...prev];n[0]={...n[0],stars:n[0].stars+1,starWorkers:true};return n;});
      addLog(`⭐👷 8 ouvriers !`);return;
    }
    // (l'objectif de FACTION ne se valide plus automatiquement : comme la
    // mission secrète, le révéler est un CHOIX du joueur — revealFObj)
  },[players,phase,addLog]);

  // Fix #8: Immediate game end when ANY player reaches 6 stars (Scythe rule)
  useEffect(()=>{
    if(phase!=="playing"||players.length===0)return;
    const winner=players.find(p=>p.stars>=6);
    if(winner){
      const wf=FACTIONS[winner.faction];
      addLog(`🏆🏆🏆 ${wf.name} atteint 6 étoiles ! FIN DE PARTIE IMMÉDIATE !`);
      setPhase("ended");
    }
  },[players,phase,addLog]);

  // transportOverride : {transport:{workers,res}} — quantités choisies dans le
  // panneau de transport partiel (repasse par ce même flux après validation) ;
  // {forceMove:true} — clic « ➤ Déplacer ici » du unitPicker quand l'hex cible
  // portait aussi une unité à soi (ambiguïté destination/sélection tranchée)
  // ── Hexes de production éligibles (action Produce) : ceux qui portent mes
  // ouvriers, plus le hex du Moulin — territoire BONUS de la règle Scythe,
  // il ne compte pas dans la limite de 2 (3 avec amélioration)
  const produceEligible=useMemo(()=>{
    if(selAction!=="Produce"||!me)return new Set();
    const s=new Set(me.workers.map(w=>w.hexId));
    const moulin=(me.buildings||[]).find(b=>b.type==="moulin");
    if(moulin)s.add(moulin.hexId);
    return s;
  },[selAction,me]);
  // Pré-sélection à l'entrée dans l'action : si le choix est trivial (tous les
  // hex d'ouvriers tiennent dans la limite), tout cocher — sinon laisser choisir
  useEffect(()=>{
    if(selAction!=="Produce"||!me){setProducePicks([]);return;}
    const maxN=2+topUpgradeCount(me,"Produce","nourriture");
    const workerHexes=[...new Set(me.workers.map(w=>w.hexId))];
    const moulinHex=(me.buildings||[]).find(b=>b.type==="moulin")?.hexId;
    if(workerHexes.length<=maxN){
      const all=[...workerHexes];
      if(moulinHex!=null&&!all.includes(moulinHex))all.push(moulinHex);
      setProducePicks(all);
    }else setProducePicks([]);
    // volontairement déclenché sur selAction seul : la sélection appartient au
    // joueur une fois l'action ouverte
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selAction]);

  const handleHexClick=useCallback((hexId,transportOverride)=>{
    if(wasDragging.current){wasDragging.current=false;return;} // suppress click after drag
    if(phase!=="playing"||botRunning||combat)return;
    // Ripple effect on click
    setClickRipple({hexId,key:Date.now()});
    
    // ── RAIL PLACEMENT MODE ──
    // Règles : chaque segment part de la Gare ou d'un hex déjà relié au réseau
    // (réseau connexe, pas de pose « offensive » isolée) et jamais sur lac/marécage
    if(railPlacement){
      const railHexes=new Set([railPlacement.gareHex]);
      rails.forEach(([a,b])=>{railHexes.add(a);railHexes.add(b);});
      if(!railPlacement.fromHex){
        // First click: select starting hex of rail segment
        if(!railHexes.has(hexId)){
          addLog(`⚠ Le rail doit partir de la Gare (#${railPlacement.gareHex}) ou d'un rail existant`);
          return;
        }
        setRailPlacement(prev=>({...prev,fromHex:hexId}));
        addLog(`🚂 Rail depuis #${hexId} — cliquez un hex adjacent`);
        return;
      } else {
        // Second click: must be adjacent to fromHex, on land
        const from=railPlacement.fromHex;
        const isAdj=(ADJ[from]||[]).includes(hexId);
        if(!isAdj||hexId===from){
          addLog(`⚠ Choisissez un hex adjacent à #${from}`);
          setRailPlacement(prev=>({...prev,fromHex:null}));
          return;
        }
        const toT=hMap[hexId]?.t;
        if(toT==="lac"||toT==="marecage"){
          addLog(`⚠ Pas de rail sur ${toT==="lac"?"un lac":"un marécage"}`);
          return;
        }
        // Check no duplicate rail
        const exists=rails.some(([a,b])=>(a===from&&b===hexId)||(a===hexId&&b===from));
        if(exists){
          addLog(`⚠ Rail déjà posé entre #${from} et #${hexId}`);
          setRailPlacement(prev=>({...prev,fromHex:null}));
          return;
        }
        // Place rail segment
        setRails(prev=>[...prev,[from,hexId]]);
        const remaining=railPlacement.remaining-1;
        addLog(`🛤 Rail posé #${from}↔#${hexId} (${remaining} restant${remaining>1?"s":""})`);
        if(remaining<=0){
          setRailPlacement(null);
          addLog(`✅ 3 rails posés !`);
          finishBottom(2);
        } else {
          setRailPlacement({remaining,fromHex:null});
        }
        return;
      }
    }
    
    // ── MOVE : re-cliquer l'hex de l'unité sélectionnée = DÉSÉLECTION ──
    if(moveSource&&hexId===moveSource.fromHex){setMoveSource(null);setTransportPick(null);return;}
    if(moveSource&&validMoves.has(hexId)){
      // Hex cible portant aussi une de MES unités encore déplaçables : le clic
      // est ambigu (destination ? nouvelle sélection ?) → unitPicker enrichi
      // d'une option « Déplacer ici » — avant, le clic déplaçait la 1re unité
      // alors qu'on voulait sélectionner la voisine (bug constaté en partie)
      if(!transportOverride&&movableUnits.has(hexId)){
        setUnitPicker({hexId,units:movableUnits.get(hexId),moveDest:true});
        return;
      }
      // Snapshot avant CE déplacement → l'undo prend en compte chaque sous-coup.
      // Pas de re-push à la validation du transport : le clic qui a ouvert le
      // panneau a déjà poussé ce snapshot (sinon chaque déplacement de mech
      // chargé compterait double dans la pile d'annulation).
      if(!transportOverride?.transport)pushHistory();
      // Check for combat triggers before actually moving
      const movingCombatUnit=moveSource.unitType==="hero"||moveSource.unitType==="mech";
      
      // Check PvE: Empire mecha on target hex
      const empireOnHex=Object.entries(empire).filter(([_,hid])=>hid===hexId);
      if(movingCombatUnit&&empireOnHex.length>0){
        const card=drawEmpireCombat();
        setCombat({type:"pve",hexId,empireId:empireOnHex[0][0],empireCard:card,phase:"choose",powerSpend:0,cardsSpend:0,
          moveData:{...moveSource}});
        addLog(`⚔ Combat Empire ! ${card.name} (Force: ${card.power})`);
        setMoveSource(null);
        return;
      }
      
      // Check PvP: enemy combat units (hero or mech) on target hex
      if(movingCombatUnit){
        for(let pi=1;pi<players.length;pi++){
          const ep=players[pi];
          const enemyHero=ep.hero===hexId;
          const enemyMechs=ep.mechs.filter(m=>m.hexId===hexId);
          if(enemyHero||enemyMechs.length>0){
            setCombat({type:"pvp",hexId,enemyIdx:pi,phase:"choose",powerSpend:0,cardsSpend:0,
              moveData:{...moveSource}});
            addLog(`⚔ Combat PvP vs ${FACTIONS[ep.faction].name} sur #${hexId} !`);
            setMoveSource(null);
            return;
          }
        }
      }
      
      // ── TRANSPORT PARTIEL (mech) : s'il y a de quoi emporter, ouvrir le
      // panneau de quantités au lieu d'exécuter — la validation repasse ici
      // avec transportOverride ──
      if(moveSource.unitType==="mech"&&carryOnMove&&!transportOverride?.transport){
        const wOnHex=me.workers.filter(w=>w.hexId===moveSource.fromHex).length;
        const resOnHex=Object.fromEntries(Object.entries(me.resources[String(moveSource.fromHex)]||{}).filter(([,q])=>q>0));
        if(wOnHex>0||Object.keys(resOnHex).length>0){
          setTransportPick({toHex:hexId,fromHex:moveSource.fromHex,workersMax:wOnHex,workers:wOnHex,resMax:resOnHex,res:{...resOnHex}});
          return;
        }
      }
      setTransportPick(null);

      // No combat: normal move with TRANSPORT (Scythe rules)
      let p={...me, workers:[...me.workers], mechs:[...me.mechs], resources:{...me.resources}};
      Object.keys(me.resources).forEach(k=>{p.resources[k]={...me.resources[k]};});
      const fromHex=moveSource.fromHex;
      let transportLog="";
      let marshCarried=0; // ouvriers transportés par un mecha → paient aussi le péage
      
      // ── SCYTHE RULE: workers cannot enter enemy-occupied hexes ──
      if(moveSource.unitType==="worker"){
        for(let pi=1;pi<players.length;pi++){
          const ep=players[pi];
          const enemyOnHex=ep.hero===hexId||ep.mechs.some(m=>m.hexId===hexId)||ep.workers.some(w=>w.hexId===hexId);
          if(enemyOnHex){addLog(`⚠ Les ouvriers ne peuvent pas entrer sur un hex ennemi`);setMoveSource(null);return;}
        }
      }
      
      if(moveSource.unitType==="hero"){
        p.hero=hexId;
        // Hero carries resources (not workers) — sauf si l'emport est désactivé
        const tr=transportUnits(p, fromHex, hexId, "hero", {carryRes:carryOnMove});
        p=tr.player;
        if(tr.carried.resTypes.length>0) transportLog=` 📦${tr.carried.resTypes.join(",")}`;
      }
      else if(moveSource.unitType==="mech"){
        p.mechs=p.mechs.map(m=>m.id===moveSource.unitId?{...m,hexId}:m);
        // Mech carries workers + resources — 🚚 désactivé = les ouvriers et
        // ressources restent (stratégie d'expansion : le mech continue seul).
        // Avec transport partiel validé : quantités choisies, le reste sur place.
        const tp=transportOverride?.transport;
        const tr=transportUnits(p, fromHex, hexId, "mech", tp
          ?{carryWorkers:tp.workers>0,carryRes:true,workerCount:tp.workers,resCounts:tp.res}
          :{carryWorkers:carryOnMove,carryRes:carryOnMove});
        p=tr.player;
        marshCarried=tr.carried.workers;
        if(tr.carried.workers>0) transportLog+=` 👷×${tr.carried.workers}`;
        if(tr.carried.resTypes.length>0) transportLog+=` 📦${tr.carried.resTypes.join(",")}`;
      }
      else if(moveSource.unitType==="worker"){
        p.workers=p.workers.map(w=>w.id===moveSource.unitId?{...w,hexId}:w);
        // L'ouvrier emporte les ressources de son hex (règle Scythe) si demandé
        if(carryOnMove){
          const tr=transportUnits(p, fromHex, hexId, "worker");
          p=tr.player;
          if(tr.carried.resTypes.length>0) transportLog=` 📦${tr.carried.resTypes.join(",")}`;
        }
      }
      
      // ── PÉAGE DE MARÉCAGE : -1♥ par ouvrier, -1⚡ par unité de combat qui y entre ──
      const toll=marshToll(p,hexId,moveSource.unitType,marshCarried);
      if(toll){
        addLog(toll);
        // Toast de perte au centre — le système de floaters automatique ne
        // suit que les gains, les pertes du péage sont poussées ici
        const bx=window.innerWidth*0.5;const by=window.innerHeight*0.40;let stack=0;
        if(moveSource.unitType==="worker"){
          spawnFloater("-❤","#e0708a",bx,by,"big");
        }else{
          spawnFloater("-⚡","#e0603a",bx,by,"big");stack++;
          if(marshCarried>0)spawnFloater(`-${marshCarried>1?marshCarried:""}❤`,"#e0708a",bx,by+stack*72,"big");
        }
      }

      p.movesLeft=(me.movesLeft||moveLimit)-1;p.movedUnits=[...(me.movedUnits||[]),moveSource.unitId];

      // ── PLAN « Iron Horse » (move_mine) : chaque déplacement mine 1 ressource du terrain d'arrivée ──
      if(me.factoryCard?.topBonus==="move_mine"){
        const destT=TERRAINS[hMap[hexId]?.t];
        if(destT?.res&&destT.res!=="ouvriers"){
          const hid=String(hexId);
          if(!p.resources[hid])p.resources[hid]={};
          p.resources[hid][destT.res]=(p.resources[hid][destT.res]||0)+1;
          addLog(`⚙ ${me.factoryCard.name}: +1 ${destT.res} miné sur #${hexId}`);
        }
      }

      // ── SCYTHE RULE: displace enemy workers when hero/mech enters (no combat) ──
      const movingCombat2=moveSource.unitType==="hero"||moveSource.unitType==="mech";
      if(movingCombat2){
        let displaced=0;
        for(let pi=1;pi<players.length;pi++){
          const ep=players[pi];
          const enemyWorkersHere=ep.workers.filter(w=>w.hexId===hexId);
          if(enemyWorkersHere.length>0){
            const ehb=HOME_BASES[ep.faction];
            const ehbHex=baseHexAt(ehb);
            displaced+=enemyWorkersHere.length;
            // Retreat enemy workers to their home base + PILLAGE : leur magot
            // sur le hex passe au joueur (motivation au combat du design)
            const looted={};
            setPlayers(prev=>{
              const n=[...prev];
              const deepResH=(pl)=>{const r={};Object.entries(pl.resources).forEach(([k,v])=>{r[k]={...v};});return r;};
              const loserH={...n[pi],workers:n[pi].workers.map(w=>w.hexId===hexId?{...w,hexId:ehbHex.id}:w),resources:deepResH(n[pi])};
              Object.entries(loserH.resources[String(hexId)]||{}).forEach(([rt,q])=>{looted[rt]=q;});
              transferHexResources(loserH,p,hexId);
              n[pi]=loserH;
              return n;
            });
            const lootTxt=Object.entries(looted).map(([rt,q])=>`${q}${rt}`).join(",");
            addLog(`🏃 ${enemyWorkersHere.length} ouvrier(s) ${FACTIONS[ep.faction].name} renvoyé(s) !${lootTxt?` 💰 Pillage: ${lootTxt}`:""}`);
          }
        }
        if(displaced>0){
          // Lose 1 pop per displaced worker
          p.pop=Math.max(0,p.pop-displaced);
          addLog(`♥ -${displaced} Pop (ouvriers déplacés)`);
          // Servitude (Confédération) : la capture est un CHOIX du joueur
          // (-2 Pop, max 2) — proposée après le déplacement, plus d'office
          if(p.faction==="confederation"&&p.pop>=2&&(p.capturedWorkers||0)<2)setAbilityOffer({type:"servitude",hexId});
        }
      }
      
      setPlayers(prev=>{const n=[...prev];n[0]=p;return n;});
      addLog(`🚶 ${moveSource.unitType==="hero"?myFaction.hero:moveSource.unitId} → #${hexId}${transportLog}`);
      setMoveSource(null);
      
      // ── CHECK TRAP TRIGGER: pièges ennemis sur la DESTINATION et sur tout
      // le TRAJET (terrain miné : le traverser le déclenche aussi — avant,
      // un mech à 2 pas « sautait » les pièges, constatés inoffensifs en
      // partie réelle). Pénalité durcie : -3⚡ ET -2♥ (la puissance seule ne
      // pique plus personne en fin de partie).
      if(moveSource.unitType==="hero"||moveSource.unitType==="mech"){
        const route=[...findPathWaypoints(fromHex,hexId,me.faction,me.unlockedAbilities||[],me,rails,enemyOccupiedHexes),hexId];
        for(let pi=1;pi<players.length;pi++){
          const ep=players[pi];
          if(ep.faction!=="frente")continue;
          route.forEach(routeHex=>{
            const trapIdx=(ep.trapTokens||[]).findIndex(t=>t.hexId===routeHex&&!t.disarmed);
            if(trapIdx>=0){
              const powPenalty=Math.min(me.power,3);
              setPlayers(prev=>{
                const n=[...prev];
                n[0]={...n[0],power:Math.max(0,n[0].power-powPenalty),pop:Math.max(0,n[0].pop-2)};
                n[pi]={...n[pi],trapTokens:[...n[pi].trapTokens]};
                n[pi].trapTokens[trapIdx]={...n[pi].trapTokens[trapIdx],disarmed:true};
                return n;
              });
              addLog(`💥 Trap Frente déclenché sur #${routeHex}${routeHex!==hexId?" (au passage)":""} ! -${powPenalty}⚡ -2♥`);
            }
          });
        }
      }
      
      // ── HERO-ONLY TRIGGERS ──
      if(moveSource.unitType==="hero"){
        // ── TIERRA MINADA (Frente) : poser un piège ici est un CHOIX — les
        // 4 jetons sont précieux, l'emplacement se décide (plus d'office) ──
        if(me.faction==="frente"&&(me.trapTokens||[]).length<4&&!(me.trapTokens||[]).some(t=>t.hexId===hexId)){
          setAbilityOffer({type:"trap",hexId});
        }
        // ── COMPTOIR (Acadiane) : idem — l'objectif de faction exige des
        // comptoirs NON adjacents, les poser partout d'office le sabotait ──
        if(me.faction==="acadiane"&&(me.flagTokens||[]).length<4&&!(me.flagTokens||[]).some(f=>f.hexId===hexId)){
          setAbilityOffer({type:"flag",hexId});
        }
        
        // Encounter token?
        if(encounterTokens.has(hexId)){
          const shuffled=shuffleArray(ENCOUNTERS);
          const card=shuffled[0];
          setEncounterTokens(prev=>{const s=new Set(prev);s.delete(hexId);return s;});
          setEncounter({card,hexId});
          addLog(`📜 Rencontre: "${card.name}"`);
          return; // Pause — player must resolve encounter before continuing
        }
        // Rouge River (hex #22) — first visit by this hero?
        if(hexId===FACTORY_RR_HEX&&!me.visitedRR){
          const hasFragments=(me.fragments||0)>=TESLA_FRAGMENTS_REQUIRED;
          const available=hasFragments?[...PLANS_FORD,...PLANS_TESLA]:[...PLANS_FORD];
          const shuffled=shuffleArray(available);
          const seeCount=Math.max(1,Math.min(shuffled.length,shuffled.length-rrVisitors));
          const visible=shuffled.slice(0,seeCount);
          setRougeRiver({cards:visible,hasFragments});
          setRrVisitors(prev=>prev+1);
          addLog(`⚙ Rouge River ! ${hasFragments?"Plans Ford + Tesla accessibles !":"Plans Ford uniquement."} (${visible.length} cartes)`);
          return; // Pause — player picks a card
        }
      }
      
      // ── DÉPOSE EN ROUTE (mech) : le trajet a des hexes intermédiaires ? ──
      // Permet les passe-passe : déposer un ouvrier à mi-chemin, laisser du
      // matériel au passage et continuer (relais de mechas, expansion…)
      let dropOffer=null;
      if(moveSource.unitType==="mech"&&carryOnMove){
        // Jamais de dépose sur un hex ennemi : un ouvrier posé face à une
        // unité de combat serait renvoyé à sa base (règle Scythe) — le
        // trajet lui-même évite désormais les hexes occupés (blockedHexes)
        const mids=findPathWaypoints(fromHex,hexId,me.faction,me.unlockedAbilities||[],me,rails,enemyOccupiedHexes)
          .filter(hid=>{const h=hMap[hid];return h&&h.t!=="lac"&&h.t!=="marecage"&&!enemyOccupiedHexes.has(hid);});
        const hasCargo=p.workers.some(w=>w.hexId===hexId)||Object.keys(p.resources[String(hexId)]||{}).length>0;
        if(mids.length>0&&hasCargo){
          dropOffer={mids,destHex:hexId,endAfter:p.movedUnits.length>=moveLimit};
          setRouteDrop(dropOffer);
          addLog(`📦 Dépose en route possible (passage par ${mids.map(m=>`#${m}`).join(", ")})`);
        }
      }
      if(p.movedUnits.length>=moveLimit&&!dropOffer)endHumanTurn(myMat.topRow.indexOf("Move"),p.movedUnits.length);
      return;
    }
    // ── CIBLES D'ACTION BOTTOM : Deploy/Build en cliquant l'hex sur la carte ──
    if(pendingBottom&&actionTargets.type&&actionTargets.hexes.has(hexId)){
      if(actionTargets.type==="deploy")doDeploy(hexId,actionTargets.res);
      else doBuild(hexId,bottomPick.building.type);
      return;
    }
    // ── SÉLECTION DES HEX DE PRODUCTION (action Produce) : cocher/décocher ──
    if(selAction==="Produce"&&produceEligible.has(hexId)){
      if(producePicks.includes(hexId)){setProducePicks(p=>p.filter(h=>h!==hexId));return;}
      const moulinHex=(me.buildings||[]).find(b=>b.type==="moulin")?.hexId;
      const maxN=2+topUpgradeCount(me,"Produce","nourriture");
      if(hexId!==moulinHex&&producePicks.filter(h=>h!==moulinHex).length>=maxN){
        addLog(`⚠ Max ${maxN} hex de production (le Moulin est en bonus) — décochez-en un d'abord`);return;
      }
      setProducePicks(p=>[...p,hexId]);return;
    }
    // ── SÉLECTION D'UNITÉ AU CLIC (action Move) : cliquer le pion à déplacer ──
    if(selAction==="Move"&&movableUnits.has(hexId)){
      const units=movableUnits.get(hexId);
      setUnitPicker(null);
      if(units.length===1){doMove(units[0].type,units[0].id,hexId);}
      else{setMoveSource(null);setUnitPicker({hexId,units});}
      return;
    }
    if(moveSource){setMoveSource(null);setTransportPick(null);return;}
    setUnitPicker(null);
    setSelHex(hexId);
  },[phase,botRunning,moveSource,validMoves,me,myFaction,myMat,addLog,endHumanTurn,finishBottom,combat,empire,players,encounterTokens,rrVisitors,railPlacement,rails,carryOnMove,selAction,movableUnits,pendingBottom,actionTargets,bottomPick,doDeploy,doBuild,pushHistory,produceEligible,producePicks,enemyOccupiedHexes]);

  // ── COMBAT RESOLUTION ──
  const resolveCombat=useCallback(()=>{
    if(!combat||!me)return;
    // Player combat ability bonus (attacker if player moved, defender if attacked)
    const isDefender=!!combat.empireAttacks||combat.type==="pvp_defense";
    const playerCBonus=getCombatBonus(me, combat.hexId, !isDefender);
    // Cartes engagées : celles CHOISIES par le joueur (cardsPicked = indices
    // dans la main triée) — repli sur les plus fortes si aucun choix explicite
    const handSortedR=[...(me.cardHand||[])].sort((a,b)=>b-a);
    const pickedVals=(combat.cardsPicked||[]).map(i=>handSortedR[i]).filter(v=>v!=null);
    const playerCardVal=combat.cardsPicked?pickedVals.reduce((a,b)=>a+b,0):topCardsSum(me.cardHand,combat.cardsSpend);
    const playerTotal=combat.powerSpend + playerCBonus.powerBonus + playerCardVal;
    if(playerCBonus.name&&(playerCBonus.powerBonus>0||playerCBonus.cardBonus>0)){
      addLog(`🛡 ${playerCBonus.name}: ${playerCBonus.powerBonus>0?`+${playerCBonus.powerBonus}⚡ `:""}${playerCBonus.cardBonus>0?`+${playerCBonus.cardBonus}🃏`:""}`);
    }

    // ── PVP DEFENSE : un bot attaque le joueur (il a engagé secrètement ses forces) ──
    if(combat.type==="pvp_defense"){
      const atkIdx=combat.enemyIdx;
      const attacker=players[atkIdx];const af=FACTIONS[attacker.faction];
      const atkCB=getCombatBonus(attacker,combat.hexId,true,me.combatCards);
      const attackerTotal=combat.botSpend+atkCB.powerBonus+(combat.botCards*2);
      const win=playerTotal>attackerTotal; // l'attaquant remporte les égalités
      addLog(`⚔ ${af.name}: ${attackerTotal} (${combat.botSpend}⚡+${combat.botCards}🃏) vs vous: ${playerTotal} (${combat.powerSpend}⚡+${combat.cardsSpend}🃏)`);
      const myHb=HOME_BASES[me.faction];
      const myHbHex=baseHexAt(myHb);
      const atkHb=HOME_BASES[attacker.faction];
      const atkHbHex=baseHexAt(atkHb);
      setPlayers(prev=>{
        const n=[...prev];
        n[0]={...n[0],workers:[...n[0].workers],mechs:[...n[0].mechs],resources:{...n[0].resources}};
        Object.keys(prev[0].resources).forEach(k=>{n[0].resources[k]={...prev[0].resources[k]};});
        n[atkIdx]={...n[atkIdx],workers:[...n[atkIdx].workers],mechs:[...n[atkIdx].mechs],resources:{...n[atkIdx].resources}};
        Object.keys(prev[atkIdx].resources).forEach(k=>{n[atkIdx].resources[k]={...prev[atkIdx].resources[k]};});
        n[0].power-=combat.powerSpend;
        if(combat.cardsPicked)spendPickedCards(n[0],pickedVals);else spendTopCards(n[0],combat.cardsSpend);
        n[atkIdx].power-=combat.botSpend;n[atkIdx].combatCards-=combat.botCards;
        if(win){
          // Le joueur repousse l'attaquant : retraite totale du bot + étoile défenseur
          if(n[atkIdx].hero===combat.hexId)n[atkIdx].hero=atkHbHex.id;
          n[atkIdx].mechs=n[atkIdx].mechs.map(m=>m.hexId===combat.hexId?{...m,hexId:atkHbHex.id}:m);
          n[atkIdx].workers=n[atkIdx].workers.map(w=>w.hexId===combat.hexId?{...w,hexId:atkHbHex.id}:w);
          n[0].combatWins=(n[0].combatWins||0)+1;
          if(n[0].combatWins<=2&&!n[0][`starCombat${n[0].combatWins}`]){n[0].stars++;n[0][`starCombat${n[0].combatWins}`]=true;}
          if(attackerTotal>=1)n[atkIdx].combatCards++;
        } else {
          // Le bot prend le hex : retraite totale du joueur, ressources transférées
          const displaced=n[0].workers.filter(w=>w.hexId===combat.hexId).length;
          if(n[0].hero===combat.hexId)n[0].hero=myHbHex.id;
          n[0].mechs=n[0].mechs.map(m=>m.hexId===combat.hexId?{...m,hexId:myHbHex.id}:m);
          n[0].workers=n[0].workers.map(w=>w.hexId===combat.hexId?{...w,hexId:myHbHex.id}:w);
          const key=String(combat.hexId);const lostRes=n[0].resources[key];
          if(lostRes){
            if(!n[atkIdx].resources[key])n[atkIdx].resources[key]={};
            Object.entries(lostRes).forEach(([rt,q])=>{n[atkIdx].resources[key][rt]=(n[atkIdx].resources[key][rt]||0)+q;});
            delete n[0].resources[key];
          }
          if(displaced>0)n[atkIdx].pop=Math.max(0,n[atkIdx].pop-displaced);
          n[atkIdx].combatWins=(n[atkIdx].combatWins||0)+1;
          if(n[atkIdx].combatWins<=2&&!n[atkIdx][`starCombat${n[atkIdx].combatWins}`]){n[atkIdx].stars++;n[atkIdx][`starCombat${n[atkIdx].combatWins}`]=true;}
          if(playerTotal>=1)n[0].combatCards++;
          // Capacités post-combat de l'attaquant vainqueur
          if(n[atkIdx].faction==="bayou"&&(n[atkIdx].unlockedAbilities||[]).includes(2)){
            const loot=Math.min(n[0].coins||0,2);
            if(loot>0){n[atkIdx].coins+=loot;n[0].coins-=loot;}
          }
          if(n[atkIdx].faction==="bayou"&&!n[atkIdx].chimereUsed&&prev[0].mechs.some(m=>m.hexId===combat.hexId)){
            n[atkIdx].mechs=[...n[atkIdx].mechs,{id:`${n[atkIdx].faction}_chimere`,hexId:combat.hexId}];
            n[atkIdx].chimereUsed=true;n[atkIdx].capturedMech=(n[atkIdx].capturedMech||0)+1;
          }
          if(n[atkIdx].faction==="confederation"&&displaced>0&&n[atkIdx].pop>=2&&(n[atkIdx].capturedWorkers||0)<2){
            n[atkIdx].pop=Math.max(0,n[atkIdx].pop-2);
            n[atkIdx].workers=[...n[atkIdx].workers,{id:`${n[atkIdx].faction}_serv${n[atkIdx].workers.length}`,hexId:combat.hexId}];
            n[atkIdx].capturedWorkers=(n[atkIdx].capturedWorkers||0)+1;
          }
        }
        return n;
      });
      addLog(win?`🛡 Vous repoussez ${af.name} ! ⭐ Étoile de combat.`:`❌ ${af.name} prend #${combat.hexId}... Retraite vers la base.`);
      setCombat(null);
      // Reprise de la chaîne des bots
      setCurrentP(combat.resumeCp);setBotRunning(true);
      return;
    }

    if(combat.type==="pve"){
      const empireTotal=combat.empireCard.power;
      // Attacker wins ties when player attacks; defender (player) wins ties when Empire attacks
      const win=isDefender?playerTotal>=empireTotal:playerTotal>=empireTotal;
      // Spend resources
      setPlayers(prev=>{
        const n=[...prev];const p={...n[0]};
        p.power-=combat.powerSpend;
        if(combat.cardsPicked)spendPickedCards(p,pickedVals);else spendTopCards(p,combat.cardsSpend);
        if(!win){
          // Règle : le PERDANT pioche 1 carte s'il a engagé au moins 1 point
          // (puissance ou carte) — appliquée aussi contre l'Empire
          if(playerTotal>=1)p.combatCards=(p.combatCards||0)+1;
          if(isDefender){
            // Empire attacked us — retreat ALL our combat units from that hex to home base
            const hb=HOME_BASES[p.faction];
            const hbHex=baseHexAt(hb);
            if(p.hero===combat.hexId)p.hero=hbHex.id;
            p.mechs=p.mechs.map(m=>m.hexId===combat.hexId?{...m,hexId:hbHex.id}:m);
            // Workers also retreat
            p.workers=p.workers.map(w=>w.hexId===combat.hexId?{...w,hexId:hbHex.id}:w);
          } else {
            // Player attacked Empire — retreat the attacking unit
            const hb=HOME_BASES[p.faction];
            const hbHex=baseHexAt(hb);
            if(combat.moveData.unitType==="hero")p.hero=hbHex.id;
          }
        }
        if(!isDefender){
          p.movesLeft=(me.movesLeft||moveLimit)-1;p.movedUnits=[...(me.movedUnits||[]),combat.moveData.unitId];
        }
        n[0]=p;return n;
      });

      if(win){
        addLog(`✅ Victoire ! ${combat.empireCard.name} détruit (${playerTotal} vs ${empireTotal} — dépensé: ${combat.powerSpend}⚡ ${combat.cardsSpend}🃏)`);
        setPlayers(prev=>{
          const n=[...prev];let p={...n[0],workers:[...n[0].workers],mechs:[...n[0].mechs],resources:{...n[0].resources}};
          Object.keys(n[0].resources).forEach(k=>{p.resources[k]={...n[0].resources[k]};});
          if(!isDefender){
            // Player attacked → move unit to hex + transport
            if(combat.moveData.unitType==="hero")p.hero=combat.hexId;
            else if(combat.moveData.unitType==="mech")p.mechs=p.mechs.map(m=>m.id===combat.moveData.unitId?{...m,hexId:combat.hexId}:m);
            const tr=transportUnits(p, combat.moveData.fromHex, combat.hexId, combat.moveData.unitType);
            p=tr.player;
            if(tr.carried.workers>0||tr.carried.resTypes.length>0) addLog(`🚚 Transport:${tr.carried.workers>0?` 👷×${tr.carried.workers}`:""}${tr.carried.resTypes.length>0?` 📦${tr.carried.resTypes.join(",")}`:""}`);
          }
          // Empire attacked → player stays in place, no transport needed
          p.empireKills=(p.empireKills||0)+1;
          if(p.empireKills>=3&&!p.starLiberator){p.stars++;p.starLiberator=true;addLog(`⭐💀 LIBÉRATEUR ! 3 Empire détruits !`);}
          if(p.faction==="bayou"&&!p.chimereUsed){
            p.mechs=[...p.mechs,{id:`${p.faction}_chimere`,hexId:combat.hexId}];
            p.chimereUsed=true;p.capturedMech=(p.capturedMech||0)+1;
            addLog(`🧟 Chimère ! Mecha Empire capturé → 5e mecha Bayou !`);
          }
          n[0]=p;return n;
        });
        // Remove empire mecha
        setEmpire(prev=>{const n={...prev};delete n[combat.empireId];return n;});
        // Show reward phase
        setCombat(prev=>({...prev,phase:"reward",win:true}));
        return; // Don't close yet — reward phase
      } else {
        addLog(`❌ Défaite... ${combat.empireCard.name} vous repousse (${playerTotal} vs ${empireTotal} — dépensé: ${combat.powerSpend}⚡ ${combat.cardsSpend}🃏)`);
      }
    }
    
    if(combat.type==="pvp"){
      const enemy=players[combat.enemyIdx];
      const ef=FACTIONS[enemy.faction];
      
      // ── WHITE FLAG CHECK (Acadiane defender with slot 2) ──
      if(enemy.faction==="acadiane"&&(enemy.unlockedAbilities||[]).includes(2)&&Math.random()<0.5){
        // Acadiane refuses combat: retreat + 2 pop, attacker gets hex + resources + star for free
        addLog(`🏳 ${ef.name} active White Flag ! Retraite volontaire + ${BALANCE.whiteFlagPop} Pop.`);
        const ehb=HOME_BASES[enemy.faction];
        const ehbHex=baseHexAt(ehb);
        setPlayers(prev=>{
          const n=[...prev];
          // Attacker moves in (no power/cards spent)
          n[0]={...n[0],workers:[...n[0].workers],mechs:[...n[0].mechs],resources:{...n[0].resources}};
          Object.keys(prev[0].resources).forEach(k=>{n[0].resources[k]={...prev[0].resources[k]};});
          if(combat.moveData.unitType==="hero")n[0].hero=combat.hexId;
          else if(combat.moveData.unitType==="mech")n[0].mechs=n[0].mechs.map(m=>m.id===combat.moveData.unitId?{...m,hexId:combat.hexId}:m);
          const tr=transportUnits(n[0], combat.moveData.fromHex, combat.hexId, combat.moveData.unitType);
          n[0]=tr.player;
          n[0].combatWins=(n[0].combatWins||0)+1;
          if(n[0].combatWins<=2&&!n[0][`starCombat${n[0].combatWins}`]){n[0].stars++;n[0][`starCombat${n[0].combatWins}`]=true;}
          // Pop loss for displacing enemy workers
          const wfWorkersOnHex=n[combat.enemyIdx].workers.filter(w=>w.hexId===combat.hexId).length;
          if(wfWorkersOnHex>0)n[0].pop=Math.max(0,n[0].pop-wfWorkersOnHex);
          n[0].movesLeft=(me.movesLeft||moveLimit)-1;n[0].movedUnits=[...(me.movedUnits||[]),combat.moveData.unitId];
          // Defender retreats + gains 2 pop
          n[combat.enemyIdx]={...n[combat.enemyIdx],workers:[...n[combat.enemyIdx].workers],mechs:[...n[combat.enemyIdx].mechs],resources:{...n[combat.enemyIdx].resources}};
          Object.keys(prev[combat.enemyIdx].resources).forEach(k=>{n[combat.enemyIdx].resources[k]={...prev[combat.enemyIdx].resources[k]};});
          if(n[combat.enemyIdx].hero===combat.hexId)n[combat.enemyIdx].hero=ehbHex.id;
          n[combat.enemyIdx].mechs=n[combat.enemyIdx].mechs.map(m=>m.hexId===combat.hexId?{...m,hexId:ehbHex.id}:m);
          n[combat.enemyIdx].workers=n[combat.enemyIdx].workers.map(w=>w.hexId===combat.hexId?{...w,hexId:ehbHex.id}:w);
          delete n[combat.enemyIdx].resources[String(combat.hexId)];
          n[combat.enemyIdx].pop=Math.min((n[combat.enemyIdx].pop||0)+BALANCE.whiteFlagPop,18);
          return n;
        });
        const wfWorkerCount=enemy.workers.filter(w=>w.hexId===combat.hexId).length;
        addLog(`⭐ Étoile combat ${(me.combatWins||0)+1}/2 (White Flag) !${wfWorkerCount>0?` ♥ -${wfWorkerCount} Pop (ouvriers déplacés)`:""}`);
        setCombat(null);
        if((me.movedUnits||[]).length+1>=moveLimit){setTimeout(()=>endHumanTurn(myMat.topRow.indexOf("Move")),100);}
        return;
      }
      
      // Bot defense: limited to 1 card per combat unit on hex + combat ability bonus
      const enemyUnitsOnHex=(enemy.hero===combat.hexId?1:0)+enemy.mechs.filter(m=>m.hexId===combat.hexId).length;
      const enemyCBonus=getCombatBonus(enemy, combat.hexId, false, me.combatCards);
      const botCardSlots=enemyUnitsOnHex+enemyCBonus.cardBonus;
      // Psychologie : dominé en visible (votre stock ⚡+🃏 affiché), le bot
      // préfère parfois ne RIEN miser et garder ses munitions (fold) — mais
      // pas toujours : votre feinte peut donc échouer contre lui !
      const humanVisible=Math.min(me.power,7)+me.combatCards*2;
      const botVisible=Math.min(enemy.power,7)+enemyCBonus.powerBonus+Math.min(enemy.combatCards,botCardSlots)*2;
      const botFold=botVisible+6<=humanVisible&&Math.random()<0.5;
      // Ability bonus adds to the total but is NOT spent from the power track
      const botPower=botFold?0:Math.min(Math.floor(enemy.power*0.6),7,enemy.power);
      const botCards=botFold?0:Math.min(enemy.combatCards,botCardSlots);
      const enemyTotal=botPower+enemyCBonus.powerBonus+(botCards*2);
      const win=playerTotal>=enemyTotal; // attacker wins ties
      if(botFold)addLog(`🫱 ${ef.name} ne mise rien (dominé en visible — munitions gardées)`);
      
      let bonusLog="";
      if(enemyCBonus.name&&(enemyCBonus.powerBonus>0||enemyCBonus.cardBonus>0)) bonusLog=` [${enemyCBonus.name}]`;
      addLog(`⚔ ${myFaction.name}: ${playerTotal} (${combat.powerSpend}${playerCBonus.powerBonus>0?`+${playerCBonus.powerBonus}`:""}⚡+${combat.cardsSpend}🃏) vs ${ef.name}: ${enemyTotal} (${botPower}⚡+${botCards}🃏)${bonusLog}`);
      
      const hb=HOME_BASES[me.faction];
      const hbHex=baseHexAt(hb);
      const ehb=HOME_BASES[enemy.faction];
      const ehbHex=baseHexAt(ehb);
      // Pre-count enemy units on hex (before retreat) for faction abilities
      const preEnemyMechs=enemy.mechs.filter(m=>m.hexId===combat.hexId);
      const preEnemyWorkers=enemy.workers.filter(w=>w.hexId===combat.hexId);
      
      setPlayers(prev=>{
        const n=[...prev];
        // Both spend power + cards
        n[0]={...n[0],workers:[...n[0].workers],mechs:[...n[0].mechs],resources:{...n[0].resources}};
        Object.keys(prev[0].resources).forEach(k=>{n[0].resources[k]={...prev[0].resources[k]};});
        n[0].power-=combat.powerSpend;
        if(combat.cardsPicked)spendPickedCards(n[0],pickedVals);else spendTopCards(n[0],combat.cardsSpend);
        n[combat.enemyIdx]={...n[combat.enemyIdx],workers:[...n[combat.enemyIdx].workers],mechs:[...n[combat.enemyIdx].mechs],resources:{...n[combat.enemyIdx].resources}};
        Object.keys(prev[combat.enemyIdx].resources).forEach(k=>{n[combat.enemyIdx].resources[k]={...prev[combat.enemyIdx].resources[k]};});
        n[combat.enemyIdx].power-=botPower;n[combat.enemyIdx].combatCards-=botCards;
        
        if(win){
          // Winner: move to hex
          if(combat.moveData.unitType==="hero")n[0].hero=combat.hexId;
          else if(combat.moveData.unitType==="mech")n[0].mechs=n[0].mechs.map(m=>m.id===combat.moveData.unitId?{...m,hexId:combat.hexId}:m);
          // Transport workers+resources
          const tr=transportUnits(n[0], combat.moveData.fromHex, combat.hexId, combat.moveData.unitType);
          n[0]=tr.player;
          n[0].combatWins=(n[0].combatWins||0)+1;
          if(n[0].combatWins<=2&&!n[0][`starCombat${n[0].combatWins}`]){n[0].stars++;n[0][`starCombat${n[0].combatWins}`]=true;}
          // Count enemy workers on hex for pop loss
          const enemyWorkersOnHex=n[combat.enemyIdx].workers.filter(w=>w.hexId===combat.hexId).length;
          if(enemyWorkersOnHex>0)n[0].pop=Math.max(0,n[0].pop-enemyWorkersOnHex);
          // Loser: retreat ALL units to HB
          if(n[combat.enemyIdx].hero===combat.hexId)n[combat.enemyIdx].hero=ehbHex.id;
          n[combat.enemyIdx].mechs=n[combat.enemyIdx].mechs.map(m=>m.hexId===combat.hexId?{...m,hexId:ehbHex.id}:m);
          n[combat.enemyIdx].workers=n[combat.enemyIdx].workers.map(w=>w.hexId===combat.hexId?{...w,hexId:ehbHex.id}:w);
          // Rule: the winner takes control of the resources on the hex
          const lostRes=n[combat.enemyIdx].resources[String(combat.hexId)];
          if(lostRes){
            const key=String(combat.hexId);
            if(!n[0].resources[key])n[0].resources[key]={};
            Object.entries(lostRes).forEach(([rt,q])=>{n[0].resources[key][rt]=(n[0].resources[key][rt]||0)+q;});
            delete n[combat.enemyIdx].resources[key];
          }
          // Rule: the loser draws 1 combat card if they revealed at least 1 power
          if(enemyTotal>=1)n[combat.enemyIdx].combatCards++;
        } else {
          // Attacker loses: retreat to HB
          if(combat.moveData.unitType==="hero")n[0].hero=hbHex.id;
          else if(combat.moveData.unitType==="mech")n[0].mechs=n[0].mechs.map(m=>m.id===combat.moveData.unitId?{...m,hexId:hbHex.id}:m);
          // Rule: the loser (player) draws 1 combat card if they revealed at least 1 power
          if(playerTotal>=1)n[0].combatCards++;
          // Rule: the winner — even defending — gains a combat star (max 2)
          const db={...n[combat.enemyIdx]};
          db.combatWins=(db.combatWins||0)+1;
          if(db.combatWins<=2&&!db[`starCombat${db.combatWins}`]){db.stars++;db[`starCombat${db.combatWins}`]=true;}
          n[combat.enemyIdx]=db;
        }
        n[0].movesLeft=(me.movesLeft||moveLimit)-1;n[0].movedUnits=[...(me.movedUnits||[]),combat.moveData.unitId];
        return n;
      });
      
      if(win){
        const popLost=preEnemyWorkers.length;
        addLog(`✅ Victoire PvP ! ${ef.name} repoussé.${popLost>0?` ♥ -${popLost} Pop (${popLost} ouvrier${popLost>1?"s":""} déplacé${popLost>1?"s":""})`:""}`);
        if((me.combatWins||0)+1<=2)addLog(`⭐ Étoile combat ${(me.combatWins||0)+1}/2 !`);
        // Flibuste: Bayou winner takes 2 coins from loser
        if(me.faction==="bayou"&&(me.unlockedAbilities||[]).includes(2)){
          setPlayers(prev=>{
            const n=[...prev];
            const loot=Math.min(n[combat.enemyIdx].coins||0, 2);
            if(loot>0){n[0]={...n[0],coins:n[0].coins+loot};n[combat.enemyIdx]={...n[combat.enemyIdx],coins:n[combat.enemyIdx].coins-loot};}
            return n;
          });
          addLog(`🏴‍☠️ Flibuste ! +2💰 pillées sur ${ef.name}`);
        }
        // Chimère: Bayou captures 1 enemy mech (1×/game, becomes 5th mech)
        if(me.faction==="bayou"&&!me.chimereUsed&&preEnemyMechs.length>0){
          setPlayers(prev=>{
            const n=[...prev];
            const p={...n[0],mechs:[...n[0].mechs]};
            p.mechs.push({id:`${p.faction}_chimere`,hexId:combat.hexId});
            p.chimereUsed=true;
            p.capturedMech=(p.capturedMech||0)+1;
            n[0]=p;return n;
          });
          addLog(`🧟 Chimère ! Mecha ${ef.name} capturé → 5e mecha Bayou !`);
        }
        // Servitude : la capture est un CHOIX du joueur (-2 Pop, max 2) —
        // proposée après la victoire, plus appliquée d'office
        if(me.faction==="confederation"&&preEnemyWorkers.length>0&&me.pop>=2&&(me.capturedWorkers||0)<2){
          setAbilityOffer({type:"servitude",hexId:combat.hexId});
        }
      } else {
        addLog(`❌ Défaite PvP... Retraite vers la base.`);
        // Flibuste: Bayou bot defender wins → takes 2 coins from player
        if(enemy.faction==="bayou"&&(enemy.unlockedAbilities||[]).includes(2)){
          setPlayers(prev=>{
            const n=[...prev];
            const loot=Math.min(n[0].coins||0, 2);
            if(loot>0){n[0]={...n[0],coins:n[0].coins-loot};n[combat.enemyIdx]={...n[combat.enemyIdx],coins:(n[combat.enemyIdx].coins||0)+loot};}
            return n;
          });
          addLog(`🏴‍☠️ ${ef.name} active Flibuste ! -2💰`);
        }
      }
    }
    
    setCombat(null);
    // Check if movement is done
    const newMovesLeft=(me.movesLeft||moveLimit)-1;
    if((me.movedUnits||[]).length+1>=moveLimit){
      // Need to trigger endHumanTurn after state updates (il logue ✅ lui-même)
      setTimeout(()=>endHumanTurn(myMat.topRow.indexOf("Move")),100);
    }
  },[combat,me,players,empire,myFaction,myMat,addLog,endHumanTurn]);

  // ── WHITE FLAG (Acadiane défenseur, slot 2) : céder le hex sans combattre ──
  const resolveWhiteFlag=useCallback(()=>{
    if(!combat||combat.type!=="pvp_defense"||!me)return;
    const atkIdx=combat.enemyIdx;
    const af=FACTIONS[players[atkIdx].faction];
    const myHb=HOME_BASES[me.faction];
    const myHbHex=baseHexAt(myHb);
    setPlayers(prev=>{
      const n=[...prev];
      n[0]={...n[0],workers:[...n[0].workers],mechs:[...n[0].mechs],resources:{...n[0].resources}};
      Object.keys(prev[0].resources).forEach(k=>{n[0].resources[k]={...prev[0].resources[k]};});
      n[atkIdx]={...n[atkIdx],resources:{...n[atkIdx].resources}};
      Object.keys(prev[atkIdx].resources).forEach(k=>{n[atkIdx].resources[k]={...prev[atkIdx].resources[k]};});
      const displaced=n[0].workers.filter(w=>w.hexId===combat.hexId).length;
      if(n[0].hero===combat.hexId)n[0].hero=myHbHex.id;
      n[0].mechs=n[0].mechs.map(m=>m.hexId===combat.hexId?{...m,hexId:myHbHex.id}:m);
      n[0].workers=n[0].workers.map(w=>w.hexId===combat.hexId?{...w,hexId:myHbHex.id}:w);
      n[0].pop=Math.min((n[0].pop||0)+BALANCE.whiteFlagPop,18);
      const key=String(combat.hexId);const lostRes=n[0].resources[key];
      if(lostRes){
        if(!n[atkIdx].resources[key])n[atkIdx].resources[key]={};
        Object.entries(lostRes).forEach(([rt,q])=>{n[atkIdx].resources[key][rt]=(n[atkIdx].resources[key][rt]||0)+q;});
        delete n[0].resources[key];
      }
      if(displaced>0)n[atkIdx]={...n[atkIdx],pop:Math.max(0,n[atkIdx].pop-displaced)};
      const ab={...n[atkIdx]};
      ab.combatWins=(ab.combatWins||0)+1;
      if(ab.combatWins<=2&&!ab[`starCombat${ab.combatWins}`]){ab.stars++;ab[`starCombat${ab.combatWins}`]=true;}
      n[atkIdx]=ab;
      return n;
    });
    addLog(`🏳 White Flag ! Vous cédez #${combat.hexId} à ${af.name} (+${BALANCE.whiteFlagPop} Pop, aucune dépense).`);
    setCombat(null);
    setCurrentP(combat.resumeCp);setBotRunning(true);
  },[combat,me,players,addLog]);

  // ── PVE REWARD ──
  const claimReward=useCallback((reward)=>{
    if(!combat||combat.type!=="pve")return;
    setPlayers(prev=>{
      const n=[...prev];const p={...n[0]};
      if(reward==="metal"){
        const hid=String(combat.hexId);
        if(!p.resources[hid])p.resources[hid]={};
        p.resources[hid].metal=(p.resources[hid].metal||0)+2;
        addLog(`🏆 +2 Métal (ferraille)`);
      } else if(reward==="pop"){
        p.pop=Math.min(p.pop+2,18);
        addLog(`🏆 +2 Popularité`);
      } else if(reward==="fragment"){
        p.fragments=(p.fragments||0)+1;
        addLog(`🏆 +1 Fragment Tesla (${p.fragments}/${TESLA_FRAGMENTS_REQUIRED})`);
      }
      n[0]=p;return n;
    });
    setCombat(null);
    if((me.movedUnits||[]).length>=moveLimit){
      setTimeout(()=>endHumanTurn(myMat.topRow.indexOf("Move")),100);
    }
  },[combat,me,addLog,endHumanTurn,myMat]);

  // Reprend le tour humain après un picker de rencontre (mecha/bâtiment/recrue) :
  // si tous les déplacements sont faits, on enchaîne sur l'action bottom.
  const resumeAfterEncounter=useCallback(()=>{
    const moved=(me?.movedUnits||[]).length;
    if(moved>=moveLimit){setTimeout(()=>endHumanTurn(myMat.topRow.indexOf("Move")),100);}
  },[me,moveLimit,endHumanTurn,myMat]);

  // ── ENCOUNTER RESOLUTION ──
  const resolveEncounter=useCallback((choiceIdx)=>{
    if(!encounter)return;
    const choice=encounter.card.choices[choiceIdx];
    const mechsBefore=me.mechs.length;
    setPlayers(prev=>{
      const n=[...prev];const p={...n[0],workers:[...n[0].workers],mechs:[...n[0].mechs],resources:{...n[0].resources},unlockedAbilities:[...(n[0].unlockedAbilities||[])]};
      // Deep copy resources
      Object.entries(n[0].resources).forEach(([k,v])=>{p.resources[k]={...v};});
      choice.effect(p);
      p.encounters=(p.encounters||0)+1;
      n[0]=p;return n;
    });
    addLog(`📜 ${encounter.card.name}: ${choice.label} → ${choice.desc}`);
    setEncounter(null);
    // Récompenses « structurantes » qui demandent un choix du joueur — l'option
    // a déjà payé son coût (mecha/bâtiment/recrue via l'effet), on ouvre le
    // picker correspondant ; le tour reprend une fois le choix fait. Les gardes
    // `available` garantissent qu'un placement/enrôlement valide existe.
    if(choice.grantsMech&&mechsBefore<4){
      setPendingAbility({source:"encounter"});
      return; // don't end turn yet — ability picker will handle it
    }
    if(choice.grantsBuilding){ setEncounterBuild(true); return; }
    if(choice.grantsRecruit){ setEncounterEnlist({col:null}); return; }
    // Resume movement check
    resumeAfterEncounter();
  },[encounter,me,addLog,resumeAfterEncounter]);

  // ── RÉCOMPENSE RENCONTRE : bâtiment gratuit (posé sur le hex du héros) ──
  const doEncounterBuild=useCallback((buildingType)=>{
    if(!me)return;
    const hex=me.hero;
    if((me.buildings||[]).length>=4)return;
    if((me.buildings||[]).some(b=>b.hexId===hex)){addLog(`⚠ Déjà un bâtiment ici`);return;}
    if((me.buildings||[]).some(b=>b.type===buildingType))return;
    const bt=BUILDING_TYPES.find(b=>b.type===buildingType);
    setPlayers(prev=>{
      const n=[...prev];const p={...n[0],buildings:[...(n[0].buildings||[])]};
      p.buildings.push({type:buildingType,hexId:hex});
      const earned=p.buildings.length>=4&&!p.starBuildings;
      if(earned){p.stars++;p.starBuildings=true;}
      n[0]=p;return n;
    });
    addLog(`🏗 ${bt?bt.name:buildingType} édifié sur #${hex} (rencontre)`);
    if((me.buildings||[]).length+1>=4)addLog(`⭐ 4 Bâtiments construits !`);
    setEncounterBuild(false);
    resumeAfterEncounter();
  },[me,addLog,resumeAfterEncounter]);

  // ── RÉCOMPENSE RENCONTRE : recrue gratuite (colonne + recrue permanente) ──
  const doEncounterEnlist=useCallback((colIdx,recruitIdx)=>{
    if(!me||(me.recruits||0)>=4)return;
    if((me.enlistMap||[])[colIdx]!=null)return;
    if((me.enlistMap||[]).includes(recruitIdx))return;
    const bonus=ENLIST_IMMEDIATE[colIdx];const recruit=ENLIST_ONGOING[recruitIdx];
    setPlayers(prev=>{
      const n=[...prev];const p={...n[0]};
      p.recruits=(p.recruits||0)+1;
      p.enlistMap=[...(p.enlistMap||[null,null,null,null])];
      p.enlistMap[colIdx]=recruitIdx;
      bonus.apply(p);
      const earned=p.recruits>=4&&!p.starRecruits;
      if(earned){p.stars++;p.starRecruits=true;}
      n[0]=p;return n;
    });
    addLog(`🤝 Recrue ${(me.recruits||0)+1}/4 sur ${BOTTOM[colIdx]} (rencontre) — immédiat ${bonus.label}`);
    addLog(`   Permanent ${recruit.icon} ${recruit.label} quand vous/voisins faites ${BOTTOM[colIdx]}`);
    if((me.recruits||0)+1>=4)addLog(`⭐ 4 Recrues enrôlées !`);
    setEncounterEnlist(null);
    resumeAfterEncounter();
  },[me,addLog,resumeAfterEncounter]);

  // ── ROUGE RIVER — PICK FACTORY CARD ──
  const pickFactoryCard=useCallback((card)=>{
    if(!rougeRiver)return;
    setPlayers(prev=>{
      const n=[...prev];const p={...n[0]};
      p.visitedRR=true;
      p.factoryCard=card;
      n[0]=p;return n;
    });
    addLog(`⚙ Plan choisi: ${card.name} (${card.type==="tesla"?"Tesla":"Ford"}) — ${card.desc}`);
    setRougeRiver(null);
    const moved=(me.movedUnits||[]).length;
    if(moved>=moveLimit){setTimeout(()=>endHumanTurn(myMat.topRow.indexOf("Move")),100);}
  },[rougeRiver,me,endHumanTurn,myMat,addLog]);

  const doMove=(unitType,unitId,fromHex)=>{
    if(!me.movesLeft)setPlayers(prev=>{const n=[...prev];n[0]={...n[0],movesLeft:moveLimit,movedUnits:[]};return n;});
    setMoveSource({unitType,unitId,fromHex});setSelHex(null);setUnitPicker(null);
  };

  const doBolster=(type)=>{
    if(!me||me.coins<1)return;
    // Check building effects: Arsenal (+1 Pui) and Mémorial (+1 Pop)
    const hasArsenal=(me.buildings||[]).some(b=>b.type==="arsenal");
    const hasMemorial=(me.buildings||[]).some(b=>b.type==="memorial");
    setPlayers(prev=>{const n=[...prev];const p={...n[0]};p.coins--;
      if(type==="power"){
        // +1 si le cube d'amélioration de l'option ⚡ a été retiré (2 → 3)
        const upg=topUpgradeCount(p,"Bolster","power");
        const bonus=(hasArsenal?1:0)+upg;
        // Plan « L'Onde Tesla » : +1 Pui par mecha proche du héros
        const aura=auraPowerCount(p,hMap);
        p.power=Math.min(p.power+2+bonus+aura,16);
        addLog(`💪 -1$ → +${2+bonus+aura} Pui${upg?" (Amélioration +1)":""}${hasArsenal?" (Arsenal +1)":""}${aura>0?` (Onde Tesla +${aura})`:""}`);}
      else{
        // +1 si le cube d'amélioration de l'option 🃏 a été retiré (1 → 2)
        const upg=topUpgradeCount(p,"Bolster","combatCards");
        p.combatCards+=1+upg;addLog(`🃏 -1$ → +${1+upg} CC${upg?" (Amélioration +1)":""}`);}
      if(hasMemorial){p.pop=Math.min(p.pop+1,18);addLog(`🪦 Mémorial: +1 Pop`);}
      n[0]=p;return n;});
    endHumanTurn(myMat.topRow.indexOf("Bolster"));
  };

  const doProduce=()=>{
    if(!me)return;
    if(!canPayProduce(me)){
      const c=getProduceCost(me.workers.length);
      const missing=[];
      if(me.power<c.pui)missing.push("Pui");if(me.pop<c.pop)missing.push("Pop");if(me.coins<c.coins)missing.push("$");
      addLog(`⚠ ${missing.join("+")} insuffisant(e)`);return;
    }
    const workersByHex={};me.workers.forEach(w=>{if(!workersByHex[w.hexId])workersByHex[w.hexId]=[];workersByHex[w.hexId].push(w);});
    // Les hex CHOISIS par le joueur (clic sur la carte) — 2 de base, 3 avec
    // l'amélioration ; le hex du Moulin est un territoire bonus hors limite
    const moulinHex=(me.buildings||[]).find(b=>b.type==="moulin")?.hexId;
    const hexIds=[...new Set(producePicks)].filter(h=>workersByHex[String(h)]||h===moulinHex).map(String);
    if(hexIds.length===0){addLog("⚠ Sélectionnez vos hex de production (clic sur la carte)");return;}
    const costLabel=produceCostLabel(me.workers.length);
    setPlayers(prev=>{
      const n=[...prev];const p={...n[0],resources:{...n[0].resources},workers:[...n[0].workers]};
      payProduce(p);
      hexIds.forEach(hidStr=>{
        const hid=parseInt(hidStr);const hex=hMap[hid];const t=TERRAINS[hex?.t];if(!t)return;let wCount=(workersByHex[hidStr]||[]).length;
        // Moulin building: +1 production on this hex (as if +1 worker)
        const hasMoulin=(p.buildings||[]).some(b=>b.type==="moulin"&&b.hexId===hid);
        if(hasMoulin)wCount++;
        // Plan « Model M » : production doublée sur chaque hex
        const hasModelM=p.factoryCard?.topBonus==="produce_x2";
        if(hasModelM)wCount*=2;
        if(hex.t==="village"){if(p.workers.length<8){for(let i=0;i<wCount&&p.workers.length<8;i++)p.workers.push({id:`${p.faction}_w${p.workers.length}`,hexId:hid});addLog(`👷 +ouv. #${hid}${hasMoulin?" (Moulin +1)":""}${hasModelM?" (Model M ×2)":""}`);}}
        else if(t.res&&t.res!=="ouvriers"){if(!p.resources[hidStr])p.resources[hidStr]={};p.resources[hidStr][t.res]=(p.resources[hidStr][t.res]||0)+wCount;addLog(`🏭 +${wCount} ${t.res} #${hid}${hasMoulin?" (Moulin +1)":""}${hasModelM?" (Model M ×2)":""}`);}
      });n[0]=p;return n;});
    if(costLabel!=="Gratuit")addLog(`💳 ${costLabel}`);
    setProducePicks([]);
    endHumanTurn(myMat.topRow.indexOf("Produce"));
  };

  // Trade en 2 temps : on remplit 2 emplacements (mêmes ou différents), puis
  // on CONFIRME — l'état est visible, rien ne part sans validation
  // 2 ressources de base, +1 par cube d'amélioration retiré (option 📦)
  const tradeSlots=2+(me?topUpgradeCount(me,"Trade","metal"):0);
  // Règle Scythe : chaque ressource achetée atterrit sur un hex portant un de
  // MES ouvriers, AU CHOIX (réparties librement) — tradePicks = [{res,hexId}],
  // choisis en cliquant le chip de ressources au-dessus de l'hex (façon
  // Scythe Digital Edition)
  const tradeHexes=useMemo(()=>{
    if(selAction!=="Trade"||!me)return [];
    return [...new Set(me.workers.map(w=>w.hexId))].filter(h=>hMap[h]&&!hMap[h].base);
  },[selAction,me]);
  const tradeLabel=(picks)=>{const c={};picks.forEach(({res,hexId})=>{const k=`${res}#${hexId}`;c[k]=(c[k]||0)+1;});
    return Object.entries(c).map(([k,n])=>{const[r,h]=k.split("#");return `+${n} ${r} (#${h})`;}).join(", ");};
  const doTradePick=(resType,hexId)=>{
    if(!me||me.coins<1){addLog("⚠ Pas d'$");return;}
    setTradePicks(prev=>prev.length>=tradeSlots?prev:[...prev,{res:resType,hexId}]);
  };
  const doTradeConfirm=()=>{
    if(!me||me.coins<1||tradePicks.length!==tradeSlots)return;
    const picks=[...tradePicks];
    setPlayers(prev=>{const n=[...prev];const p={...n[0],resources:{...n[0].resources}};
      picks.forEach(({res,hexId})=>{const hid=String(hexId);
        p.resources[hid]={...(p.resources[hid]||{})};
        p.resources[hid][res]=(p.resources[hid][res]||0)+1;});
      p.coins--;n[0]=p;return n;});
    addLog(`💰 -1$ → ${tradeLabel(picks)}`);setTradePicks([]);endHumanTurn(myMat.topRow.indexOf("Trade"));
  };

  const allHexContents=useMemo(()=>{
    const c={};
    players.forEach(p=>{
      const f=FACTIONS[p.faction];
      const add=(hexId,unit)=>{if(!c[hexId])c[hexId]=[];c[hexId].push({...unit,color:f.color,fName:f.name,factionId:p.faction});};
      add(p.hero,{type:"hero",id:`${p.faction}_hero`,label:f.hero});
      p.workers.forEach(w=>add(w.hexId,{type:"worker",id:w.id,label:"Ouv."}));
      p.mechs.forEach(m=>add(m.hexId,{type:"mech",id:m.id,label:"Mech"}));
      (p.buildings||[]).forEach(b=>{
        const bt=BUILDING_TYPES.find(t=>t.type===b.type);
        add(b.hexId,{type:"building",id:`${p.faction}_b_${b.type}`,label:bt?bt.name:b.type,icon:bt?bt.icon:"🏗"});
      });
    });
    return c;
  },[players]);

  // ══════════ RULES OVERLAY ══════════
  if(showRules) return <RulesPage onClose={()=>setShowRules(false)} />;

  // ══════════ SETUP SCREEN ══════════
  if(phase==="setup"){
    return <SetupScreen selFaction={selFaction} setSelFaction={setSelFaction} selMat={selMat} setSelMat={setSelMat} numBots={numBots} setNumBots={setNumBots} mapChoice={mapChoice} setMapChoice={setMapChoice} difficulty={difficulty} setDifficulty={setDifficulty} empireEnabled={empireEnabled} setEmpireEnabled={setEmpireEnabled} startGame={startGame} onShowRules={()=>setShowRules(true)} />;
  }

  // (pick_objective phase removed — player keeps both objectives per Scythe rules)

  // ══════════ END GAME — SCORING ══════════
  if(phase==="ended"&&players.length>0){
    // Calculate final scores (Scythe scoring)
    const scores=players.map(p=>{
      const f=FACTIONS[p.faction];
      const popTier=p.pop<=6?0:p.pop<=12?1:2;
      const starMult=[3,4,5][popTier];
      const terMult=[2,3,4][popTier];
      const resMult=[1,2,3][popTier];
      // Count territories: hexes with at least one unit (l'hex de base ne
      // compte pas comme territoire — il est hors plateau)
      const unitHexes=new Set([p.hero,...p.workers.map(w=>w.hexId),...p.mechs.map(m=>m.hexId)]);
      [...unitHexes].forEach(id=>{if(isBaseHex(id))unitHexes.delete(id);});
      // Buildings count as territory if hex has no enemy (règle Scythe : une
      // unité ennemie SUR l'hex en prend le contrôle malgré le bâtiment)
      const enemyOccupied=new Set();
      players.forEach(op=>{
        if(op===p)return;
        enemyOccupied.add(op.hero);
        op.mechs.forEach(m=>enemyOccupied.add(m.hexId));
        op.workers.forEach(w=>enemyOccupied.add(w.hexId));
      });
      (p.buildings||[]).forEach(b=>{if(!enemyOccupied.has(b.hexId))unitHexes.add(b.hexId);});
      // Trap tokens (Frente) count as territory
      (p.trapTokens||[]).forEach(t=>{if(!t.disarmed)unitHexes.add(t.hexId);});
      // Comptoir tokens (Acadiane) count as +1 territory each (not adj to HB)
      let flagBonus=0;
      const hb=HOME_BASES[p.faction];
      const hbHex=baseHexAt(hb);
      (p.flagTokens||[]).forEach(fl=>{
        const isAdjHB=hbHex&&(ADJ[hbHex.id]||[]).includes(fl.hexId);
        if(!isAdjHB)flagBonus++;
      });
      const territories=unitHexes.size;
      // Factory = 3 extra territories if controlled
      // Règle originale : l'Usine compte 3 territoires EN TOUT (1 + bonus 2)
      const factoryBonus=unitHexes.has(22)?2:0;
      // Resources — rule: only resources on territories you control are scored.
      // Pas de plafond (BALANCE.resScoringCap=9999) : le contre du gros magot
      // est le pillage — il attire les raids, pas une règle de score.
      let totalRes=0;Object.entries(p.resources).forEach(([hid,r])=>{if(unitHexes.has(parseInt(hid)))Object.values(r).forEach(n=>totalRes+=n);});
      const resPairs=Math.floor(Math.min(totalRes,BALANCE.resScoringCap)/2);
      const starScore=p.stars*starMult;
      const terScore=(territories+factoryBonus+flagBonus)*terMult;
      const resScore=resPairs*resMult;
      // Bonus de construction : X$ par bâtiment sur les tuiles qualifiées
      const sbDetail=structureBonusDetail(p,structureBonus);
      const total=starScore+terScore+resScore+p.coins+sbDetail.coins;
      return{faction:p.faction,name:f.name,color:f.color,hero:f.hero,isBot:p.isBot,
        stars:p.stars,pop:p.pop,popTier,territories,factoryBonus,flagBonus,totalRes,resPairs,coins:p.coins,
        starScore,terScore,resScore,total,starMult,terMult,resMult,
        sbCount:sbDetail.count,sbCoins:sbDetail.coins};
    }).sort((a,b)=>b.total-a.total);

    // Export du journal de partie (JSON) — données pour l'entraînement de l'IA
    // et l'étude des bugs : classement complet + log horodaté de tous les coups
    const downloadJournal=()=>{
      const data={
        jeu:"Scythe Panamerica",
        date:new Date().toISOString(),
        carte:CURRENT_MAP.name,
        tours:turn,
        difficulte:difficulty,
        classement:scores.map((s,i)=>({
          rang:i+1,faction:s.faction,nom:s.name,bot:s.isBot,total:s.total,
          etoiles:s.stars,pop:s.pop,palier_pop:["0-6","7-12","13-18"][s.popTier],
          territoires:s.territories,bonus_usine:s.factoryBonus,comptoirs:s.flagBonus,
          ressources:s.totalRes,paires:s.resPairs,argent:s.coins,
          detail:{etoiles:s.starScore,territoires:s.terScore,ressources:s.resScore},
        })),
        journal:log.map(e=>({tour:e.turn,etape:e.step,cat:e.cat,ts:e.ts,msg:e.msg})),
      };
      const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=`scythe-journal-${new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")}.json`;
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    };

    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(170deg,#1A1710 0%,#1A1710 40%,#1A1710 100%)",color:"var(--text)",display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 16px",overflow:"auto"}}>
        <div style={{width:80,height:1,background:"linear-gradient(90deg,transparent,var(--rust),transparent)",marginBottom:16}}/>
        <h1 style={{fontSize:28,fontWeight:900,letterSpacing:8,textTransform:"uppercase",color:"var(--rust)",marginBottom:4,textAlign:"center"}}>Fin de Partie</h1>
        <div style={{width:140,height:1,background:"linear-gradient(90deg,transparent,var(--rust-dark),transparent)",marginBottom:24}}/>

        {/* Rankings */}
        <div style={{width:"100%",maxWidth:560}}>
          {scores.map((s,i)=>(
            <div key={s.faction} className="fade-in" style={{
              background:i===0?"rgba(200,112,64,0.08)":"rgba(20,18,12,0.6)",
              border:i===0?`2px solid var(--rust)`:`1px solid var(--border)`,
              borderRadius:8,padding:"16px 20px",marginBottom:8,
              boxShadow:i===0?"0 0 30px rgba(200,112,64,0.15)":"none",
              animationDelay:`${i*0.1}s`,
            }}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <span style={{fontSize:28,fontWeight:900,color:i===0?"var(--rust)":"var(--text-muted)",fontFamily:"var(--font-title)",width:32}}>
                  {i===0?"🏆":i+1+"."}
                </span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"var(--font-title)",fontSize:18,fontWeight:700,color:s.color}}>{s.name}</div>
                  <div style={{fontSize:12,color:"var(--text-dim)"}}>{s.hero} {s.isBot?"🤖":"👤"}</div>
                </div>
                <div style={{fontSize:25,fontWeight:900,color:i===0?"var(--rust)":"var(--text)",fontFamily:"var(--font-title)"}}>{s.total}$</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,fontSize:13,color:"var(--text-dim)"}}>
                <div style={{background:"var(--bg3)",padding:"6px 8px",borderRadius:4,textAlign:"center"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--gold)"}}>{s.starScore}$</div>
                  <div>⭐{s.stars} × {s.starMult}</div>
                </div>
                <div style={{background:"var(--bg3)",padding:"6px 8px",borderRadius:4,textAlign:"center"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--brass)"}}>{s.terScore}$</div>
                  <div>🗺{s.territories}{s.factoryBonus?`+${s.factoryBonus}`:""}{s.flagBonus?`+${s.flagBonus}⚑`:""} × {s.terMult}</div>
                </div>
                <div style={{background:"var(--bg3)",padding:"6px 8px",borderRadius:4,textAlign:"center"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--copper)"}}>{s.resScore}$</div>
                  <div>📦{s.resPairs}p × {s.resMult}</div>
                </div>
                <div style={{background:"var(--bg3)",padding:"6px 8px",borderRadius:4,textAlign:"center"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{s.coins}$</div>
                  <div>💰 cash</div>
                </div>
              </div>
              <div style={{fontSize:13,color:"var(--text-dim)",marginTop:4}}>
                Pop: {s.pop} (palier {["0-6","7-12","13-18"][s.popTier]}) — {s.totalRes} ressources
                {structureBonus&&s.sbCoins>0&&<span style={{color:"var(--gold)",marginLeft:8}}>🏦 {structureBonus.icon} {structureBonus.name}: +{s.sbCoins}$ ({s.sbCount} bât.)</span>}
              </div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:12,marginTop:24,flexWrap:"wrap",justifyContent:"center"}}>
          <button onClick={()=>{setPhase("setup");setPlayers([]);setLog([]);setTurn(1);setEmpire({});setRails([]);setRailPlacement(null);setSelFaction(null);setSelMat(null);}} style={{
            padding:"12px 40px",fontSize:15,letterSpacing:4,textTransform:"uppercase",
            background:"var(--gold)",color:"var(--bg)",border:"none",borderRadius:6,fontWeight:700,
            fontFamily:"var(--font-title)",cursor:"pointer",
          }}>Nouvelle Partie</button>
          <button onClick={downloadJournal} title="Exporter le journal complet de la partie en JSON (classement + tous les coups) — utile pour analyser l'IA et les bugs" style={{
            padding:"12px 30px",fontSize:15,letterSpacing:2,textTransform:"uppercase",
            background:"transparent",color:"var(--gold)",border:"1px solid var(--gold-dim)",borderRadius:6,fontWeight:700,
            fontFamily:"var(--font-title)",cursor:"pointer",
          }}>💾 Télécharger le journal</button>
        </div>
      </div>
    );
  }

  // ══════════ GAME SCREEN ══════════
  if(!me||!myFaction||!myMat)return null;
  const isMyTurn=currentP===0&&!botRunning;
  const selHexData=selHex!==null?hMap[selHex]:null;

  // Ressources d'un joueur → compteurs (partagé barre du haut / panneau adversaires).
  // Ordre demandé : Métal / Bois / Céréales / Pétrole // Argent / Cartes munitions.
  // (Ouvriers et mechas retirés : leurs valeurs sont lisibles sur la rangée d'objectifs.)
  const playerStats=(p)=>{
    const tot=(t)=>{let s=0;Object.values(p.resources).forEach(r=>{if(r[t])s+=r[t];});return s;};
    return[
      {svgKey:"metal",val:tot("metal"),color:"#99aabb",label:"Métal"},
      {svgKey:"bois",val:tot("bois"),color:"#7aaa55",label:"Bois"},
      {svgKey:"nourriture",val:tot("nourriture"),color:"#d4b050",label:"Céréales"},
      {svgKey:"petrole",val:tot("petrole"),color:"#8a90a0",label:"Pétrole"},
      {svgKey:"coins",val:p.coins,color:"var(--gold)",label:"Argent",sep:true},
      {svgKey:"combatCards",val:p.combatCards,color:"#bbaacc",label:"Cartes munitions"},
    ];
  };
  // Vocabulaire couplé façon Scythe (en-tête de chaque cellule d'action)
  const FR_TOP={Move:"Déplacer",Bolster:"Soutien",Trade:"Commerce",Produce:"Produire"};
  const FR_BOT={Upgrade:"Améliorer",Deploy:"Déployer",Build:"Construire",Enlist:"Enrôler"};

  // Étoiles à obtenir (pour le joueur) : icône + nom + progression + exigence.
  // Utilisé par la rangée de la barre du haut ET le panneau détail façon Steam.
  const starList=[
    {key:"upg",icon:"⬆",name:"6 Améliorations",done:(me.upgrades||0)>=6,prog:`${me.upgrades||0}/6`,need:"Améliorer 6 cubes (action Upgrade : déplace un cube du haut vers le bas)."},
    {key:"mech",icon:"⬡",name:"4 Mechas déployés",done:me.mechs.length>=4,prog:`${me.mechs.length}/4`,need:"Déployer 4 mechas (action Deploy, sur un hex avec un ouvrier)."},
    {key:"build",icon:"🏗",name:"4 Bâtiments",done:(me.buildings||[]).length>=4,prog:`${(me.buildings||[]).length}/4`,need:"Construire 4 bâtiments (action Build, sur un hex avec un ouvrier)."},
    {key:"recr",icon:"🤝",name:"4 Recrues",done:(me.recruits||0)>=4,prog:`${me.recruits||0}/4`,need:"Enrôler 4 recrues (action Enlist)."},
    // Règle Scythe : DEUX étoiles de combat distinctes, une par victoire
    {key:"cbt1",icon:"⚔",name:"1er Combat gagné",done:(me.combatWins||0)>=1,prog:`${Math.min(me.combatWins||0,1)}/1`,need:"Gagner un combat (chaque victoire pose sa propre étoile)."},
    {key:"cbt2",icon:"⚔",name:"2e Combat gagné",done:(me.combatWins||0)>=2,prog:`${Math.min(Math.max((me.combatWins||0)-1,0),1)}/1`,need:"Gagner un second combat (2e étoile de combat)."},
    {key:"obj",icon:"🎯",name:"Mission secrète",done:!!me.objectiveRevealed,prog:me.objectiveRevealed?"✓":"…",need:"Remplir la condition d'une de vos 2 missions secrètes puis la révéler."},
    {key:"fobj",icon:"🏛",name:"Objectif de faction",done:!!me.fObjRevealed,prog:me.fObjRevealed?"✓":"…",need:myFaction.fObj?`${myFaction.fObj.name} — ${myFaction.fObj.desc}`:"Accomplir l'objectif de votre faction."},
    {key:"wrk",icon:"👷",name:"8 Ouvriers",done:me.workers.length>=8,prog:`${me.workers.length}/8`,need:"Avoir 8 ouvriers sur le plateau (produits sur les villages)."},
    {key:"pop",icon:"♥",name:"Popularité max",done:me.pop>=18,prog:`${me.pop}/18`,need:"Atteindre 18 de popularité."},
    {key:"pow",icon:"⚡",name:"Puissance max",done:me.power>=16,prog:`${me.power}/16`,need:"Atteindre 16 de puissance."},
  ];

  // Progression des 6 étoiles (voies d'étoiles Scythe) pour n'importe quel joueur
  const starMilestones=(p)=>[
    {icon:"⬆",label:"Upg",done:(p.upgrades||0)>=6,prog:`${p.upgrades||0}/6`},
    {icon:"⬡",label:"Mech",done:p.mechs.length>=4,prog:`${p.mechs.length}/4`},
    {icon:"🏗",label:"Bât",done:(p.buildings||[]).length>=4,prog:`${(p.buildings||[]).length}/4`},
    {icon:"🤝",label:"Recr",done:(p.recruits||0)>=4,prog:`${p.recruits||0}/4`},
    {icon:"⚔",label:"Cbt1",done:(p.combatWins||0)>=1,prog:`${Math.min(p.combatWins||0,1)}/1`},
    {icon:"⚔",label:"Cbt2",done:(p.combatWins||0)>=2,prog:`${Math.min(Math.max((p.combatWins||0)-1,0),1)}/1`},
    {icon:"👷",label:"Ouv",done:p.workers.length>=8,prog:`${p.workers.length}/8`},
    {icon:"♥",label:"Pop",done:p.pop>=18,prog:`${p.pop}/18`},
    {icon:"⚡",label:"Pui",done:p.power>=16,prog:`${p.power}/16`},
  ];


  return(
    <div style={{height:"100vh",display:"grid",gridTemplateRows:"var(--top-h) 1fr auto",gridTemplateColumns:"var(--left-w) 1fr var(--right-w)",background:"var(--bg)",color:"var(--text)",overflow:"hidden"}}>

      {/* ═══ TOP RESOURCE BAR ═══ */}
      <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",padding:"6px 16px",gap:10,background:"linear-gradient(180deg,#282013,#1c150c)",borderBottom:"1px solid var(--panel-edge)",boxShadow:"inset 0 -1px 0 rgba(216,201,163,0.07)",flexShrink:0,height:"var(--top-h)",overflow:"hidden"}}>
        {/* Faction badge — logo agrandi */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginRight:4,flexShrink:0}}>
          <div style={{width:54,height:54,borderRadius:"50%",background:myFaction.color+"22",border:`2px solid ${myFaction.color}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,boxShadow:`0 0 10px ${myFaction.color}33`}}>
            <img src={FACTION_LOGOS[me.faction]} alt="" style={{width:"86%",height:"86%",objectFit:"contain"}}/>
          </div>
          <div style={{lineHeight:1.2}}>
            <div style={{fontSize:18,fontWeight:700,color:myFaction.color,fontFamily:"var(--font-title)"}}>{myFaction.name}</div>
            <div style={{fontSize:13,color:"var(--text-dim)",fontFamily:"var(--font-body)"}}>{myMat.name} · T{turn}</div>
          </div>
        </div>
        {botRunning&&<span style={{color:"var(--rust)",fontSize:14,animation:"pulse 1s infinite",marginRight:4,display:"flex",alignItems:"center",gap:3}}>{React.createElement(RESOURCE_ICONS.metal,{size:12,color:"var(--rust)"})} IA…</span>}
        {/* Divider */}
        <div style={{width:1,height:28,background:"var(--border-light)",flexShrink:0}}/>
        {/* Resource counters — grandes icônes SVG, sans bloc :
            Métal / Bois / Céréales / Pétrole ‖ Argent / Cartes munitions */}
        {(()=>{
          const stats=playerStats(me);
          return stats.map(s=>{
            const Icon=RESOURCE_ICONS[s.svgKey];
            const isCards=s.svgKey==="combatCards";
            return(
            <React.Fragment key={s.svgKey}>
              {s.sep&&<div style={{width:1,height:34,background:"var(--border-light)",flexShrink:0,margin:"0 6px"}}/>}
              <div title={isCards?"Cartes munitions — cliquer pour voir la main":s.label}
                onClick={isCards?()=>setShowCards(v=>!v):undefined}
                style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,padding:"3px 5px",borderRadius:6,
                  cursor:isCards?"pointer":"default",
                  background:isCards&&showCards?"rgba(212,178,84,0.12)":"transparent",
                  boxShadow:isCards&&showCards?"inset 0 0 0 1px var(--gold-dim)":"none"}}>
                {Icon?<Icon size={28} color={s.color}/>:null}
                <span style={{fontSize:24,fontWeight:700,fontFamily:"var(--font-mono)",color:s.color,lineHeight:1}}>{s.val}</span>
              </div>
            </React.Fragment>
          );});
        })()}
        {/* ── Rangée d'ÉTOILES À OBTENIR (icône grisée → étoile posée si atteint) ──
            Occupe l'espace libre ; clic → panneau détail façon Steam (progression
            + ce que l'objectif demande). Remplace le drop-down récap. */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
          {starList.map(s=>{
            // « ! » : un objectif secret / de faction est PRÊT à être révélé
            // (condition remplie, pas encore révélé) — notification demandée
            // en partie réelle, la condition passait inaperçue
            const ready=(s.key==="obj"&&!me.objectiveRevealed&&(me.objectives||[]).some(o=>o.check(me)))
              ||(s.key==="fobj"&&!me.fObjRevealed&&myFaction.fObj&&myFaction.fObj.check(me));
            return(
            <button key={s.key} onClick={()=>setStarDetail(d=>d===s.key?null:s.key)} title={`${s.name} — ${s.prog}${ready?" — prêt à révéler en fin de tour !":""}`}
              style={{position:"relative",width:36,height:36,borderRadius:7,border:starDetail===s.key?"1px solid var(--gold)":ready?"1px solid var(--gold-dim)":"1px solid var(--border)",
                background:s.done?"rgba(232,200,96,0.16)":starDetail===s.key?"rgba(212,178,84,0.12)":"rgba(255,255,255,0.02)",
                display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}>
              <span style={{fontSize:21,opacity:s.done?0.4:0.75,display:"inline-flex"}}><Glyph icon={s.icon} size={20} color="#e8dcc8"/></span>
              {s.done&&<span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,filter:"drop-shadow(0 0 3px rgba(232,200,96,0.7))"}}>⭐</span>}
              {!s.done&&s.prog&&s.prog!=="…"&&<span style={{position:"absolute",bottom:-2,right:0,fontSize:9,fontWeight:700,color:"var(--gold)",fontFamily:"var(--font-mono)",background:"var(--bg)",borderRadius:2,padding:"0 2px"}}>{s.prog.split("/")[0]}</span>}
              {ready&&<span style={{position:"absolute",top:-5,right:-4,width:15,height:15,borderRadius:"50%",background:"var(--gold)",color:"var(--bg)",fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 6px rgba(232,200,96,0.9)",animation:"pulse 1.2s ease infinite"}}>!</span>}
            </button>
          );})}
        </div>
        {/* Divider + total + boutons */}
        <div style={{width:1,height:28,background:"var(--border-light)",flexShrink:0,marginLeft:4}}/>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <div title="Étoiles obtenues" style={{display:"flex",alignItems:"center",gap:3,fontSize:17,fontWeight:900,color:"var(--gold)",fontFamily:"var(--font-title)"}}>⭐{me.stars}<span style={{fontSize:13,color:"var(--text-dim)"}}>/6</span></div>
          {players.length>1&&<button onClick={()=>setShowOpponents(s=>!s)} title="Voir les adversaires" style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",borderRadius:6,fontSize:15,fontWeight:700,background:showOpponents?"rgba(200,112,64,0.18)":"rgba(200,112,64,0.06)",color:"var(--rust)",border:"1px solid var(--border-dark)",fontFamily:"var(--font-title)"}}>
            👥 {players.length-1}<span style={{fontSize:10,transform:showOpponents?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▼</span>
          </button>}
          {(me.fragments||0)>0&&<div style={{fontSize:14,padding:"4px 8px",borderRadius:4,background:"rgba(100,60,200,0.15)",border:"1px solid #6040a0",color:"#a080d0"}}>{me.fragments}/{TESLA_FRAGMENTS_REQUIRED} frag.</div>}
          {/* Annuler / Refaire (dans le tour humain) */}
          {(()=>{const canUndo=isMyTurn&&!botRunning&&undoStack.length>0;const canRedo=isMyTurn&&!botRunning&&redoStack.length>0;return<>
            <button onClick={undo} disabled={!canUndo} title="Annuler le dernier coup" style={{width:32,height:32,borderRadius:6,fontSize:17,fontWeight:700,background:"transparent",color:canUndo?"var(--gold)":"var(--text-ghost)",border:`1px solid ${canUndo?"var(--gold-dim)":"var(--border)"}`,cursor:canUndo?"pointer":"not-allowed"}}>↶</button>
            <button onClick={redo} disabled={!canRedo} title="Refaire le coup annulé" style={{width:32,height:32,borderRadius:6,fontSize:17,fontWeight:700,background:"transparent",color:canRedo?"var(--gold)":"var(--text-ghost)",border:`1px solid ${canRedo?"var(--gold-dim)":"var(--border)"}`,cursor:canRedo?"pointer":"not-allowed"}}>↷</button>
          </>;})()}
          <button onClick={()=>setShowRules(true)} title="Regles du jeu" style={{padding:"5px 10px",borderRadius:6,fontSize:16,fontWeight:700,background:"transparent",color:"var(--text-muted)",border:"1px solid var(--border)",fontFamily:"var(--font-title)"}}>?</button>
        </div>
      </div>

      {/* ═══ BARRE DÉPLIABLE : RESSOURCES + ÉTOILES DES ADVERSAIRES ═══ */}
      {showOpponents&&players.length>1&&(
        <div style={{position:"fixed",top:"var(--top-h)",left:0,right:0,zIndex:40,
          background:"linear-gradient(180deg,#241c11,#181206)",borderBottom:"2px solid var(--panel-edge)",
          boxShadow:"0 8px 24px rgba(0,0,0,0.6)",padding:"10px 16px",animation:"slideDown 0.2s ease",
          display:"flex",flexDirection:"column",gap:8,maxHeight:"70vh",overflowY:"auto"}}>
          {players.slice(1).map((op,idx)=>{
            const of=FACTIONS[op.faction];const oi=idx+1;const active=oi===currentP;
            return(
              <div key={op.faction} style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",
                padding:"6px 10px",borderRadius:8,background:active?"rgba(200,112,64,0.08)":"rgba(255,255,255,0.02)",
                borderLeft:`4px solid ${of.color}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,minWidth:150}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:of.color+"22",border:`2px solid ${of.color}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                    <img src={FACTION_LOGOS[op.faction]} alt="" style={{width:"82%",height:"82%",objectFit:"contain"}}/>
                  </div>
                  <div style={{lineHeight:1.2}}>
                    <div style={{fontSize:15,fontWeight:700,color:of.color,fontFamily:"var(--font-title)"}}>{of.name}{op.isBot?" 🤖":""}{active?" ◀":""}</div>
                    <div style={{fontSize:12,color:"var(--text-dim)"}}>{op.matName} · ⭐{op.stars}/6</div>
                  </div>
                </div>
                {/* Ressources */}
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {playerStats(op).map((s,i)=>{const Icon=RESOURCE_ICONS[s.svgKey];return(
                    <div key={i} className="res-pill" title={s.label} style={{minWidth:40,padding:"3px 7px"}}>
                      <span style={{display:"flex",alignItems:"center"}}>{Icon?<Icon size={15} color={s.color}/>:null}</span>
                      <span className="res-val" style={{color:s.color,fontSize:16}}>{s.val}</span>
                    </div>
                  );})}
                </div>
                {/* Étoiles — progression des 6 voies */}
                <div style={{display:"flex",gap:3,marginLeft:"auto",flexWrap:"wrap"}}>
                  {starMilestones(op).map((m,i)=>(
                    <div key={i} title={`${m.label} ${m.prog}`} style={{display:"flex",alignItems:"center",gap:2,padding:"2px 5px",borderRadius:4,fontSize:12,
                      background:m.done?"rgba(232,200,96,0.15)":"rgba(255,255,255,0.03)",
                      border:m.done?"1px solid rgba(232,200,96,0.4)":"1px solid var(--border)"}}>
                      <span>{m.done?"⭐":<Glyph icon={m.icon} size={15}/>}</span>
                      <span style={{color:m.done?"#e8c860":"var(--text-muted)",fontFamily:"var(--font-mono)"}}>{m.prog}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ LEFT: POPULARITY TRACK ═══ (la piste de puissance est en bas d'écran ;
            le barème de score est replié dans un tiroir latéral — bande à flèche) */}
      <div style={{display:"flex",gap:3,background:"linear-gradient(180deg,#241d12,#171209 60%,#100c07)",borderRight:"1px solid var(--panel-edge)",boxShadow:"inset -1px 0 0 rgba(216,201,163,0.06)",padding:"4px 3px 4px 4px",overflow:"hidden"}}>
        {/* Popularity track — le cœur (couleur faction) marque la position, chiffre
            dessus ; les cases vides gardent leur chiffre grisé ; les lignes dorées
            marquent les paliers de score (6/7 et 12/13) ; étoile de fin à 18. */}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",minWidth:0}}>
          <div style={{fontSize:9,color:"var(--brass)",letterSpacing:1,textTransform:"uppercase",marginBottom:4,fontFamily:"var(--font-title)",fontWeight:700}}>Pop</div>
          <div style={{flex:1,display:"flex",flexDirection:"column-reverse",gap:1,width:"100%"}}>
            {Array.from({length:19},(_,i)=>i).map(v=>{
              const tier=v<=6?0:v<=12?1:2;
              const tierFills=["rgba(122,92,58,0.30)","rgba(196,160,96,0.26)","rgba(212,178,84,0.28)"];
              const tierLines=["var(--oxide)","var(--brass)","var(--gold)"];
              const isCur=v===me.pop;
              return(
                <div key={v} title={v===18?"18 — étoile Popularité max":`Popularité ${v}`} style={{
                  flex:1,minHeight:0,width:"100%",borderRadius:2,position:"relative",
                  background:v<=me.pop?tierFills[tier]:"rgba(255,255,255,0.02)",
                  border:"1px solid rgba(255,255,255,0.04)",
                  // palier de score : ligne marquée entre 6/7 et 12/13
                  borderBottom:v===7||v===13?`2px solid ${tierLines[tier]}`:"1px solid rgba(255,255,255,0.04)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {v===18&&<span style={{position:"absolute",left:3,top:"50%",transform:"translateY(-50%)",display:"flex"}}><TrackStar size={12} earned={me.pop>=18}/></span>}
                  {isCur
                    ?<HeartMarker color={myFaction.color} value={v}/>
                    :<span style={{fontSize:10,fontWeight:600,fontFamily:"var(--font-mono)",color:"var(--text-ghost)"}}>{v}</span>}
                </div>
              );
            })}
          </div>
          <div style={{fontSize:18,fontWeight:700,color:"var(--brass)",marginTop:4,fontFamily:"var(--font-title)"}}>{me.pop}</div>
        </div>
        {/* ── Bande-tiroir du BARÈME DE SCORE : repliée en permanence, une petite
              flèche l'ouvre en panneau latéral détaillé (affiché plus grand). ── */}
        <button onClick={()=>setShowScoring(v=>!v)} title="Barème de score de fin de partie"
          style={{width:17,flexShrink:0,borderRadius:5,border:"1px solid var(--gold-dim)",
            background:showScoring?"linear-gradient(90deg,rgba(212,178,84,0.22),rgba(212,178,84,0.10))":"linear-gradient(90deg,rgba(212,178,84,0.10),rgba(212,178,84,0.03))",
            color:"var(--gold)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",padding:"6px 0"}}>
          <span style={{fontSize:9,transition:"transform .2s",transform:showScoring?"rotate(180deg)":"none"}}>▶</span>
          <span style={{writingMode:"vertical-rl",fontSize:9,letterSpacing:2,textTransform:"uppercase",fontFamily:"var(--font-title)",fontWeight:700}}>Score</span>
          <span style={{fontSize:9,transition:"transform .2s",transform:showScoring?"rotate(180deg)":"none"}}>▶</span>
        </button>
      </div>

      {/* ═══ TIROIR LATÉRAL : BARÈME DE SCORE (⭐ étoiles / 🗺 territoires /
            📦 paires de ressources, par palier de popularité) ═══ */}
      {showScoring&&(()=>{
        const curTier=me.pop<=6?0:me.pop<=12?1:2;
        const bands=[
          {t:2,range:"13-18",star:5,ter:4,res:3},
          {t:1,range:"7-12",star:4,ter:3,res:2},
          {t:0,range:"0-6",star:3,ter:2,res:1},
        ];
        return(
          <div style={{position:"fixed",top:"calc(var(--top-h) + 8px)",left:"calc(var(--left-w) + 6px)",zIndex:45,width:330,maxHeight:"calc(100vh - var(--top-h) - 56px)",overflowY:"auto",
            background:"linear-gradient(180deg,#211a10,#14100a)",border:"1px solid var(--gold-dim)",borderRadius:12,boxShadow:"0 10px 40px rgba(0,0,0,0.7)",animation:"slideUp 0.2s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderBottom:"1px solid var(--border)"}}>
              <span style={{fontSize:22}}>💰</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"var(--font-title)",fontSize:18,fontWeight:800,color:"var(--gold)"}}>Barème de fin de partie</div>
                <div style={{fontSize:13,color:"var(--text-dim)"}}>Votre palier suit votre popularité — ♥ {me.pop} actuellement.</div>
              </div>
              <button onClick={()=>setShowScoring(false)} style={{width:26,height:26,borderRadius:6,background:"rgba(0,0,0,0.4)",border:"1px solid var(--border)",color:"var(--text-dim)",fontSize:16,cursor:"pointer",flexShrink:0}}>✕</button>
            </div>
            <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
              {bands.map(b=>{const active=b.t===curTier;return(
                <div key={b.t} style={{borderRadius:10,padding:"10px 12px",
                  background:active?"rgba(212,178,84,0.14)":"rgba(255,255,255,0.02)",
                  border:active?"1px solid var(--gold)":"1px solid var(--border)"}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:6}}>
                    <span style={{fontSize:19,fontWeight:900,fontFamily:"var(--font-mono)",color:active?"var(--gold)":"var(--text-dim)"}}>♥ {b.range}</span>
                    <span style={{fontSize:12,color:active?"var(--gold)":"var(--text-muted)",textTransform:"uppercase",letterSpacing:1,fontFamily:"var(--font-title)",fontWeight:700}}>{active?"— votre palier":"de popularité"}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,textAlign:"center"}}>
                    {[["⭐",b.star,"par étoile"],["🗺",b.ter,"par territoire"],["📦",b.res,"par paire de ressources"]].map(([ic,val,lab])=>(
                      <div key={lab} style={{borderRadius:8,padding:"8px 4px",background:"rgba(0,0,0,0.3)",border:"1px solid var(--border)"}}>
                        <div style={{fontSize:17}}>{ic}</div>
                        <div style={{fontSize:21,fontWeight:900,fontFamily:"var(--font-mono)",color:active?"#e8dcc4":"var(--text-dim)"}}>{val}$</div>
                        <div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.25}}>{lab}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );})}
              <div style={{fontSize:12.5,color:"var(--text-muted)",lineHeight:1.5}}>S'ajoute à l'argent en caisse. Les paliers sont marqués par les lignes dorées sur la piste de popularité.</div>
            </div>
          </div>
        );
      })()}

      {/* ═══ CENTER: MAP + OVERLAYS ═══ */}
      <div style={{position:"relative",overflow:"hidden",background:"radial-gradient(ellipse at 50% 45%,#16140e,var(--bg-map))",cursor:isPanning?"grabbing":"grab",touchAction:"none"}}>
        {/* Zoom controls */}
        <div style={{position:"absolute",top:8,right:8,zIndex:5,display:"flex",flexDirection:"column",gap:4}}>
          <button onClick={()=>mapZoom(1/1.4)} style={{width:32,height:32,borderRadius:6,border:"1px solid var(--border)",background:"rgba(14,12,8,0.85)",color:"var(--rust)",fontSize:21,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>+</button>
          <button onClick={()=>mapZoom(1.4)} style={{width:32,height:32,borderRadius:6,border:"1px solid var(--border)",background:"rgba(14,12,8,0.85)",color:"var(--rust)",fontSize:21,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>−</button>
          <button onClick={mapCenterOnMe} title="Centrer sur mon héros" style={{width:32,height:32,borderRadius:6,border:"1px solid var(--border)",background:"rgba(14,12,8,0.85)",color:"var(--rust)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>⌖</button>
          <button onClick={mapReset} style={{width:32,height:32,borderRadius:6,border:"1px solid var(--border)",background:"rgba(14,12,8,0.85)",color:"var(--text-dim)",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>⟲</button>
        </div>
        <div style={{position:"absolute",bottom:6,left:8,zIndex:5,fontSize:12,color:"var(--text-muted)",opacity:0.5,pointerEvents:"none"}}>Glisser: panoramique · Molette/pinch: zoom</div>
        {/* SVG Map */}
        <svg ref={mapRef} viewBox={`${mapView.x} ${mapView.y} ${mapView.w} ${mapView.h}`} style={{width:"100%",height:"100%",display:"block",minHeight:"100%"}}
          onPointerDown={handleMapPointerDown} onPointerMove={handleMapPointerMove} onPointerUp={handleMapPointerUp} onPointerCancel={handleMapPointerUp}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <defs>
            {Object.entries(TERRAINS).map(([key,t])=>(
              <radialGradient key={`tg-${key}`} id={`tg-${key}`} cx="38%" cy="30%" r="72%">
                <stop offset="0%" stopColor={t.grad[0]}/><stop offset="50%" stopColor={t.grad[1]}/><stop offset="100%" stopColor={t.grad[2]}/>
              </radialGradient>
            ))}
            {/* Textures de terrain seamless — remplissage photo-réaliste des hexes.
                userSpaceOnUse → les hexes voisins d'un même terrain se raccordent. */}
            {Object.entries(TERRAIN_TEXTURES).map(([key,url])=>(
              <pattern key={`tex-${key}`} id={`tex-${key}`} patternUnits="userSpaceOnUse" width={TERRAIN_TILE} height={TERRAIN_TILE}>
                <image href={url} x="0" y="0" width={TERRAIN_TILE} height={TERRAIN_TILE} preserveAspectRatio="xMidYMid slice"/>
              </pattern>
            ))}
            <filter id="desat"><feColorMatrix type="saturate" values="0.3"/><feComponentTransfer><feFuncR type="linear" slope="0.8"/><feFuncG type="linear" slope="0.8"/><feFuncB type="linear" slope="0.8"/></feComponentTransfer></filter>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="softglow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <radialGradient id="hero-aura"><stop offset="0%" stopColor="#C9A84C" stopOpacity="0.3"/><stop offset="60%" stopColor="#C9A84C" stopOpacity="0.05"/><stop offset="100%" stopColor="#C9A84C" stopOpacity="0"/></radialGradient>
            <radialGradient id="empire-aura"><stop offset="0%" stopColor="#1A3A6A" stopOpacity="0.4"/><stop offset="50%" stopColor="#ff0000" stopOpacity="0.1"/><stop offset="100%" stopColor="#ff0000" stopOpacity="0"/></radialGradient>
            <radialGradient id="mapvig" cx="50%" cy="47%" r="60%"><stop offset="0%" stopColor="transparent"/><stop offset="80%" stopColor="rgba(10,8,4,1)" stopOpacity="0.06"/><stop offset="100%" stopColor="rgba(10,8,4,1)" stopOpacity="0.3"/></radialGradient>
            <radialGradient id="mapbg" cx="50%" cy="45%" r="75%"><stop offset="0%" stopColor="#26211a"/><stop offset="70%" stopColor="#1c1812"/><stop offset="100%" stopColor="#12100a"/></radialGradient>
            {/* Vignette interne par hex : centre transparent (terrain visible),
                bords assombris (lecture des pions) — rendu peint/organique */}
            <radialGradient id="hexvig" cx="50%" cy="46%" r="60%">
              <stop offset="0%" stopColor="#140f08" stopOpacity="0"/>
              <stop offset="62%" stopColor="#140f08" stopOpacity="0"/>
              <stop offset="100%" stopColor="#140f08" stopOpacity="0.42"/>
            </radialGradient>
          </defs>
          <rect x="20" y="20" width="980" height="990" fill="url(#mapbg)"/>
          {/* Fond de plateau peint (carte classique) — sous la grille en fil de fer.
              Cadrage aligné sur la zone des hexagones ; ajustable via ces 4 valeurs. */}
          {mapChoice!=="random" && <image href={BOARD_IMAGE} x={44} y={30} width={952} height={968} preserveAspectRatio="none" opacity={0.98} style={{pointerEvents:"none"}}/>}
          <rect x="20" y="20" width="980" height="990" fill="url(#mapvig)"/>
          {/* Compass */}
          <g transform="translate(920,90)" opacity={0.2}>
            <circle r="20" fill="none" stroke="#c9a84c" strokeWidth="0.5"/>
            <polygon points="0,-22 -3,-6 0,-8 3,-6" fill="#c9a84c" opacity="0.9"/>
            <text y="-26" textAnchor="middle" fontSize="7" fill="#c9a84c" style={{fontFamily:"var(--font-title)"}}>N</text>
          </g>
          {/* Rivers — painted water ribbons with light banks (no neon) */}
          {RIVERS.map(([a,b],i)=>{const g=edgeGeo(a,b,hMap);if(!g)return null;return(
            <React.Fragment key={`r${i}`}>
              <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="#d8c9a3" strokeWidth={11} strokeLinecap="round" opacity={0.35}/>
              <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="#1e3f5e" strokeWidth={8.5} strokeLinecap="round" opacity={0.95}/>
              <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="#3a688e" strokeWidth={5} strokeLinecap="round" opacity={0.9}/>
              <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="#7fb3d6" strokeWidth={1.6} strokeLinecap="round" opacity={0.45} strokeDasharray="5 9" style={{animation:"riverFlow 4s linear infinite"}}/>
            </React.Fragment>
          );})}
          {/* Rails — center-to-center hex lines */}
          {rails.map(([a,b],i)=>{
            const ha=hMap[a],hb=hMap[b];
            if(!ha||!hb)return null;
            return(
              <React.Fragment key={`rail${i}`}>
                {/* Sleeper ties — thick dark base center-to-center */}
                <line x1={ha.rx} y1={ha.ry} x2={hb.rx} y2={hb.ry} stroke="#2a1a0a" strokeWidth={9} strokeLinecap="round" opacity={0.5}/>
                {/* Wooden sleepers — dashed perpendicular marks */}
                <line x1={ha.rx} y1={ha.ry} x2={hb.rx} y2={hb.ry} stroke="#5a4020" strokeWidth={7} strokeLinecap="butt" opacity={0.6} strokeDasharray="2 4"/>
                {/* Double rail tracks */}
                <line x1={ha.rx} y1={ha.ry} x2={hb.rx} y2={hb.ry} stroke="#8a6a40" strokeWidth={3.5} strokeLinecap="round" opacity={0.7}/>
                <line x1={ha.rx} y1={ha.ry} x2={hb.rx} y2={hb.ry} stroke="#c0a060" strokeWidth={1.5} strokeLinecap="round" opacity={0.5}/>
                {/* Rail bolts at ends */}
                <circle cx={ha.rx} cy={ha.ry} r={2.5} fill="#6a5030" stroke="#a08050" strokeWidth={0.5} opacity={0.6}/>
                <circle cx={hb.rx} cy={hb.ry} r={2.5} fill="#6a5030" stroke="#a08050" strokeWidth={0.5} opacity={0.6}/>
              </React.Fragment>
            );
          })}
          {/* Rail placement highlight — center-to-center */}
          {railPlacement&&railPlacement.fromHex!==null&&(()=>{
            const adjIds=ADJ[railPlacement.fromHex]||[];
            const fromH=hMap[railPlacement.fromHex];
            if(!fromH)return null;
            return adjIds.map(aid=>{
              const exists=rails.some(([a,b])=>(a===railPlacement.fromHex&&b===aid)||(a===aid&&b===railPlacement.fromHex));
              if(exists)return null;
              const toH=hMap[aid];
              if(!toH||toH.t==="lac"||toH.t==="marecage")return null;
              return <line key={`rp${aid}`} x1={fromH.rx} y1={fromH.ry} x2={toH.rx} y2={toH.ry} stroke="#C9A84C" strokeWidth={6} strokeLinecap="round" opacity={0.3} strokeDasharray="4 3"><animate attributeName="opacity" values="0.15;0.55;0.15" dur="1.2s" repeatCount="indefinite"/></line>;
            });
          })()}
          {/* Hexes */}
          {HEXES.map(hex=>{
            // Produce : hex éligibles surlignés (isSrc), hex cochés en vert (isV)
            const isV=validMoves.has(hex.id)||(selAction==="Produce"&&producePicks.includes(hex.id));
            const isSel=selHex===hex.id;const isHov=hovHex===hex.id;
            const isFactory=hex.t==="factory";
            const isSrc=(!moveSource&&movableUnits.has(hex.id))||actionTargets.hexes.has(hex.id)||produceEligible.has(hex.id);
            const isBonusTile=structureBonus&&hex.t!=="lac"&&hex.t!=="marecage"&&hex.t!=="factory"&&structureBonus.check(hex.id);
            // Territorial control contour (§2.3 refonte visuelle) : la première unité
            // présente sur l'hex porte la couleur de contrôle — un hex n'est jamais
            // occupé par deux factions à la fois hors résolution de combat.
            const controlColor=!isBaseHex(hex.id)?(allHexContents[hex.id]?.[0]?.color||null):null;
            return(<g key={hex.id} onMouseEnter={()=>setHovHex(hex.id)} onMouseLeave={()=>setHovHex(null)} onClick={()=>handleHexClick(hex.id)} style={{cursor:"pointer"}}>
              <HexTerrain hex={hex} isV={isV} isSel={isSel} isHov={isHov} isFactory={isFactory} isSrc={isSrc} controlColor={controlColor} wireframe={mapChoice!=="random"}/>
              {/* Bonus de construction : pastille $ sur les tuiles qualifiées */}
              {isBonusTile&&<g style={{pointerEvents:"none"}}>
                <circle cx={hex.rx-26} cy={hex.ry+24} r={8} fill="rgba(6,5,3,0.75)" stroke="#d4b254" strokeWidth={1}/>
                <text x={hex.rx-26} y={hex.ry+27.5} textAnchor="middle" fontSize={10} fill="#d4b254" fontWeight={700}>$</text>
              </g>}
              {/* Terrain label removed — TerrainDecor provides visual identification */}
              <text x={hex.rx} y={hex.ry+32} textAnchor="middle" fontSize={6.5} fill="#4a4030" opacity={0.2} style={{fontFamily:"var(--font-map)",pointerEvents:"none"}}>#{hex.id}</text>
              {(()=>{
                const pRes=players.reduce((acc,pl)=>{const r=pl.resources[String(hex.id)];if(r)Object.entries(r).forEach(([rt,cnt])=>{acc[rt]=(acc[rt]||0)+cnt;});return acc;},{});
                return Object.entries(pRes).map(([rt,cnt],ri)=>
                  <ResourceToken key={rt} cx={hex.rx+26} cy={hex.ry-22+ri*18} resType={rt} count={cnt}/>
                );
              })()}
              {/* Faction tokens: Traps (Frente) + Comptoirs (Acadiane) */}
              {players.map(pl=>{
                // Traps — hidden marker (skull if active, X if disarmed)
                const traps=(pl.trapTokens||[]).filter(t=>t.hexId===hex.id);
                const flags=(pl.flagTokens||[]).filter(f=>f.hexId===hex.id);
                const fc=FACTIONS[pl.faction];
                return <React.Fragment key={pl.faction+"tok"}>
                  {traps.map((t,ti)=><g key={`trap${ti}`} style={{pointerEvents:"none"}}>
                    <circle cx={hex.rx-26} cy={hex.ry-22+ti*16} r={9} fill="rgba(6,5,3,0.85)"/>
                    <circle cx={hex.rx-26} cy={hex.ry-22+ti*16} r={8} fill={t.disarmed?"rgba(100,50,20,0.4)":"rgba(208,112,48,0.5)"} stroke={t.disarmed?"#6a4020":fc.color} strokeWidth={1.2}/>
                    <text x={hex.rx-26} y={hex.ry-17+ti*16} textAnchor="middle" fontSize={10} fill={t.disarmed?"#6a4020":"#D07030"} fontWeight={700}>{t.disarmed?"✗":"💀"}</text>
                  </g>)}
                  {flags.map((f2,fi)=><g key={`flag${fi}`} style={{pointerEvents:"none"}}>
                    <circle cx={hex.rx-26} cy={hex.ry-22+fi*16} r={9} fill="rgba(6,5,3,0.85)"/>
                    <circle cx={hex.rx-26} cy={hex.ry-22+fi*16} r={8} fill="rgba(51,170,51,0.4)" stroke={fc.color} strokeWidth={1.2}/>
                    <text x={hex.rx-26} y={hex.ry-17+fi*16} textAnchor="middle" fontSize={11} fill="#33AA33" fontWeight={700}>⚑</text>
                  </g>)}
                </React.Fragment>;
              })}
              {encounterTokens.has(hex.id)&&(()=>{
                const ex=hex.rx+26,ey=hex.ry+24;
                const star=Array.from({length:8},(_,i)=>{
                  const a=(Math.PI/4)*i-Math.PI/2;const r=i%2===0?6.5:2.6;
                  return `${ex+r*Math.cos(a)},${ey+r*Math.sin(a)}`;
                }).join(" ");
                return(
                  <g style={{pointerEvents:"none"}}>
                    <circle cx={ex} cy={ey} r={11} fill="rgba(6,5,3,0.6)"/>
                    <circle cx={ex} cy={ey} r={10} fill="#2e6b34" stroke="#d8c9a3" strokeWidth={1.5}/>
                    <polygon points={star} fill="#e8e4d0" opacity={0.95}/>
                  </g>
                );
              })()}
            </g>);
          })}
          {/* ── HEXES DE BASE (invisibles mais interactifs) : sous chaque drapeau.
                Le héros y démarre et les unités vaincues y reviennent. On rend un
                hexagone cliquable discret pour pouvoir sélectionner l'unité qui
                en sort (surbrillance dorée/verte comme les autres hexes). ── */}
          {Object.values(HOME_BASES).map((hb,bi)=>{
            const baseH=baseHexAt(hb);if(!baseH)return null;
            const isMineBase=baseH.faction===me.faction;
            const isV=validMoves.has(baseH.id);const isSrc=!moveSource&&movableUnits.has(baseH.id);
            return(
              <g key={`base${bi}`} onClick={()=>handleHexClick(baseH.id)} style={{cursor:isMineBase?"pointer":"default"}}>
                {/* zone cliquable transparente autour du drapeau */}
                <polygon points={hPts(baseH.rx,baseH.ry,26)} fill="rgba(0,0,0,0.01)" stroke={isMineBase?"rgba(216,201,163,0.18)":"none"} strokeWidth={1} strokeDasharray="3 3"/>
                {isSrc&&<polygon points={hPts(baseH.rx,baseH.ry,26)} fill="rgba(212,178,84,0.16)" stroke="#e6c96a" strokeWidth={2.5} style={{pointerEvents:"none"}}>
                  <animate attributeName="opacity" values="0.4;0.95;0.4" dur="1.4s" repeatCount="indefinite"/>
                </polygon>}
                {isV&&<polygon points={hPts(baseH.rx,baseH.ry,26)} fill="rgba(60,160,60,0.3)" stroke="#b8f0a8" strokeWidth={2.5} style={{pointerEvents:"none"}}/>}
              </g>
            );
          })}
          {/* ── COUCHE UNITÉS : plate et animée (les pions glissent entre les hexes) ── */}
          <g style={{pointerEvents:"none"}}>
            {Object.entries(allHexContents).map(([hidStr,units])=>{
              const hex=hMap[hidStr];if(!hex||units.length===0)return null;
              const c=FACTIONS[units[0].factionId]?.color||"#888";
              return <FactionHalo key={`halo${hidStr}`} cx={hex.rx} cy={hex.ry+6} color={c} r={22}/>;
            })}
            {Object.entries(allHexContents).flatMap(([hidStr,units])=>{
              const hex=hMap[hidStr];if(!hex)return [];
              // Disposition en PACK : rangées compactes centrées (3 pions max
              // par rangée, léger rétrécissement quand l'hex est bondé) au lieu
              // d'une ligne qui débordait sur les hexes voisins dès 4 unités —
              // chaque pion reste cliquable individuellement
              const n=units.length;
              const perRow=n<=2?2:3;
              const nRows=Math.ceil(n/perRow);
              const packScale=n>=7?0.8:n>=5?0.88:1;
              return units.map((u,ui)=>{
                const row=Math.floor(ui/perRow);
                const inRow=(row===nRows-1)?(n-row*perRow):perRow;
                const ox=((ui%perRow)-(inRow-1)/2)*24*packScale;
                const oy=(row-(nRows-1)/2)*21*packScale;
                // Action Move : cliquer directement le pion à déplacer (au lieu
                // du picker de liste). Si le hex est une destination valide de
                // l'unité déjà sélectionnée, le clic doit passer au hex.
                const movKey=u.type==="hero"?"hero":u.id;
                const isMovable=selAction==="Move"&&u.factionId===me.faction&&(movableUnits.get(hex.id)||[]).some(mu=>mu.id===movKey);
                const isSel=!!moveSource&&moveSource.unitId===movKey&&moveSource.fromHex===hex.id;
                const clickable=isMovable&&!isSel&&!(moveSource&&validMoves.has(hex.id));
                return <UnitToken key={u.id} type={u.type} cx={hex.rx+ox} cy={hex.ry+6+oy} scale={packScale} color={u.color} label={u.label} icon={u.icon} factionId={u.factionId}
                  selectable={clickable} selected={isSel}
                  onClick={clickable?(e)=>{e.stopPropagation();doMove(u.type,movKey,hex.id);}:undefined}/>;
              });
            })}
            {(()=>{
              const byHex={};
              Object.entries(empire).forEach(([eid,hid])=>{(byHex[hid]=byHex[hid]||[]).push(eid);});
              return Object.entries(byHex).flatMap(([hidStr,eids])=>{
                const hex=hMap[hidStr];if(!hex)return [];
                return eids.map((eid,ei)=><EmpireMecha key={eid} cx={hex.rx-16+ei*16} cy={hex.ry-20} eid={eid}/>);
              });
            })()}
          </g>
          {/* Hex click ripple */}
          {clickRipple&&(()=>{
            const rh=hMap[clickRipple.hexId];
            if(!rh)return null;
            return <circle key={clickRipple.key} cx={rh.rx} cy={rh.ry} r={5} fill="none" stroke="#c9a84c" strokeWidth={2} opacity={0.6} style={{pointerEvents:"none"}}>
              <animate attributeName="r" from="5" to="45" dur="0.5s" fill="freeze"/>
              <animate attributeName="opacity" from="0.6" to="0" dur="0.5s" fill="freeze"/>
            </circle>;
          })()}
          {/* ═══ COMMERCE — chip des 4 ressources au-dessus de chaque hex à
              ouvrier (façon Scythe Digital Edition) : cliquer une icône dépose
              la ressource achetée SUR CET HEX (règle : les ressources
              atterrissent sur un territoire portant un de vos ouvriers) ═══ */}
          {selAction==="Trade"&&me&&me.coins>=1&&tradePicks.length<tradeSlots&&tradeHexes.map(hid=>{
            const hex=hMap[hid];if(!hex)return null;
            const RESL=["metal","bois","nourriture","petrole"];
            const w=RESL.length*22+8,x0=hex.rx-w/2,y0=hex.ry-60;
            return(<g key={`tr${hid}`} style={{cursor:"pointer"}}>
              <rect x={x0} y={y0} width={w} height={26} rx={6} fill="rgba(14,12,8,0.92)" stroke="var(--gold-dim)" strokeWidth={1}/>
              <path d={`M${hex.rx-5} ${y0+26} L${hex.rx+5} ${y0+26} L${hex.rx} ${y0+33} Z`} fill="rgba(14,12,8,0.92)" stroke="var(--gold-dim)" strokeWidth={1}/>
              {RESL.map((r,i)=>{const Icon=RESOURCE_ICONS[r];return(
                <g key={r} transform={`translate(${x0+5+i*22},${y0+5})`} onClick={(e)=>{e.stopPropagation();doTradePick(r,hid);}}>
                  <title>{`+1 ${r} sur #${hid}`}</title>
                  <rect x={-2} y={-3} width={21} height={22} rx={3} fill="transparent"/>
                  <Icon size={16} color="#d8c9a3"/>
                </g>);})}
            </g>);
          })}
          {/* Home Bases — purement décoratif : pointerEvents none pour que
              l'hex de base interactif en dessous reçoive bien les clics */}
          {Object.entries(HOME_BASES).map(([fid,hb])=>{
            const fc=FACTIONS[fid];if(!fc)return null;const isMe=fid===me.faction;
            return(<g key={fid} opacity={isMe?1:0.55} style={{pointerEvents:"none"}}>
              <line x1={hb.rx} y1={hb.ry-18} x2={hb.rx} y2={hb.ry+14} stroke="#d8c9a3" strokeWidth={1.2} opacity={0.6}/>
              <path d={`M${hb.rx} ${hb.ry-17} L${hb.rx+34} ${hb.ry-10} L${hb.rx+32} ${hb.ry-1} L${hb.rx} ${hb.ry+5} Z`} fill={fc.color} opacity={isMe?0.9:0.55} stroke="#0e0c08" strokeWidth={1}/>
              <text x={hb.rx+16} y={hb.ry-4} textAnchor="middle" fontSize={8} fill="#fff" fontWeight={700} stroke="rgba(0,0,0,0.5)" strokeWidth={2} paintOrder="stroke" style={{fontFamily:"var(--font-title)"}}>{fc.name.slice(0,8)}</text>
              {/* Blason de faction — identifie la base au premier coup d'œil,
                  à la place du simple point de couleur */}
              <circle cx={hb.rx} cy={hb.ry-18} r={13} fill="rgba(6,5,3,0.85)" stroke={fc.color} strokeWidth={1.5}/>
              <image href={FACTION_LOGOS[fid]} x={hb.rx-11} y={hb.ry-29} width={22} height={22}/>
            </g>);
          })}
          {/* Watermark — pointerEvents none : le texte est rendu au-dessus des
              hexes et son em-box couvrait le centre de la carte, avalant les
              clics sur l'Usine #22 (« impossible d'entrer sur Rouge River ») */}
          <g opacity={0.04} style={{fontFamily:"var(--font-title)",pointerEvents:"none"}}>
            <text x="510" y="505" textAnchor="middle" fontSize="80" fill="#c9a84c" letterSpacing="25">1920+</text>
          </g>
        </svg>

        {/* ═══ UNIT PICKER — plusieurs unités sur le hex cliqué ═══ */}
        {unitPicker&&selAction==="Move"&&(
          <div style={{position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",zIndex:8,
            background:"rgba(14,12,8,0.95)",border:"1px solid var(--gold-dim)",borderRadius:10,
            padding:"10px 14px",boxShadow:"0 6px 30px rgba(0,0,0,0.7)",backdropFilter:"blur(4px)",animation:"slideUp 0.2s ease"}}>
            <div style={{fontSize:14,color:"var(--gold)",fontWeight:700,marginBottom:8,fontFamily:"var(--font-title)"}}>
              {unitPicker.moveDest?`Hex #${unitPicker.hexId} — y déplacer l'unité sélectionnée, ou changer d'unité ?`:`Quelle unité déplacer depuis #${unitPicker.hexId} ?`}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {unitPicker.moveDest&&(
                <button onClick={()=>{const h=unitPicker.hexId;setUnitPicker(null);handleHexClick(h,{forceMove:true});}} className="act-btn" style={{fontSize:15,borderColor:"var(--gold)",color:"var(--gold)",fontWeight:700}}>
                  ➤ Déplacer ici
                </button>
              )}
              {unitPicker.units.map(u=>(
                <button key={u.id} onClick={()=>doMove(u.type,u.id,unitPicker.hexId)} className="act-btn" style={{borderColor:myFaction.color+"88",fontSize:15}}>
                  <Glyph icon={u.icon} size={15}/> {u.label}
                </button>
              ))}
              <button onClick={()=>setUnitPicker(null)} className="act-btn" style={{fontSize:14,opacity:0.7}}>✕</button>
            </div>
          </div>
        )}

        {/* ═══ MODAL OVERLAYS (combat/encounter/RR/dépose en route/pouvoir optionnel) ═══ */}
        {(combat||encounter||encounterBuild||encounterEnlist||rougeRiver||routeDrop||abilityOffer)&&(
          <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}>
            <div style={{maxWidth:460,width:"92%",maxHeight:"80vh",overflow:"auto",borderRadius:12,border:"1px solid var(--border-light)",boxShadow:"0 10px 50px rgba(0,0,0,0.8)"}}>

              {/* COMBAT CHOOSE */}
              {combat&&combat.phase==="choose"&&(()=>{
                const maxPower=Math.min(me.power,7);
                // Scythe rule: max 1 combat card per hero/mech involved
                // combat.moveData is undefined when the Empire attacks us (defender): count units already on the hex
                const combatUnits=combat.moveData
                  ?(combat.moveData.unitType==="hero"?1:0)+me.mechs.filter(m=>m.hexId===combat.hexId).length+(combat.moveData.unitType==="mech"?1:0)
                  :(me.hero===combat.hexId?1:0)+me.mechs.filter(m=>m.hexId===combat.hexId).length;
                // Combat ability bonus (slot 2)
                const isAttacker=!combat.empireAttacks&&combat.type!=="pvp_defense";
                const cBonus=getCombatBonus(me, combat.hexId, isAttacker);
                const maxCards=Math.min(me.combatCards, combatUnits + cBonus.cardBonus);
                // Cartes valuées : contribution = somme des cartes CHOISIES par le
                // joueur dans sa main (clic sur chaque carte, plus d'auto-sélection)
                const handSorted=[...(me.cardHand||[])].sort((a,b)=>b-a);
                const cardVal=(combat.cardsPicked||[]).reduce((a,ci)=>a+(handSorted[ci]||0),0);
                const total=combat.powerSpend + cBonus.powerBonus + cardVal;
                const isPve=combat.type==="pve";
                const enemy=!isPve?players[combat.enemyIdx]:null;
                const ef=enemy?FACTIONS[enemy.faction]:null;
                return(
                  <div className="combat-panel" style={{padding:"24px",background:"linear-gradient(180deg,#200e0a,var(--bg2))",borderRadius:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
                      <div style={{width:50,height:50,borderRadius:"50%",background:isPve?"rgba(180,30,15,0.2)":"rgba(200,100,30,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,border:isPve?"2px solid #1A3A6A":"2px solid "+(ef?ef.color:"#888"),flexShrink:0}}>⚔</div>
                      <div>
                        <div style={{fontFamily:"var(--font-title)",color:isPve?"#2A5A8A":ef.color,fontSize:21,fontWeight:700}}>{isPve?combat.empireCard.name:combat.type==="pvp_defense"?`${ef.name} vous attaque !`:`Combat vs ${ef.name}`}</div>
                        <div style={{fontSize:14,color:"var(--text-muted)",marginTop:3}}>{isPve?`Force Empire: ${combat.empireCard.power}`:combat.type==="pvp_defense"?"Ses forces sont engagées en secret — défendez le territoire":"L'adversaire choisit secrètement…"}</div>
                      </div>
                    </div>
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:14,color:"var(--brass)",marginBottom:8,fontWeight:600}}>⚡ Puissance ({combat.powerSpend}/{maxPower})</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{Array.from({length:maxPower+1},(_,i)=>i).map(v=>(
                        <button key={v} onClick={()=>setCombat(prev=>({...prev,powerSpend:v}))} className={`dial-btn ${combat.powerSpend===v?"on":"off"}`}>{v}</button>
                      ))}</div>
                    </div>
                    {maxCards>0&&<div style={{marginBottom:14}}>
                      <div style={{fontSize:14,color:"var(--brass)",marginBottom:8,fontWeight:600}}>🃏 Cartes engagées ({(combat.cardsPicked||[]).length}/{maxCards}) <span style={{fontWeight:400,color:"var(--text-muted)"}}>— cliquez les cartes de votre main à engager</span></div>
                      {/* Votre main — chaque carte se choisit individuellement (clic = engager/retirer) */}
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{handSorted.map((val,ci)=>{
                        const on=(combat.cardsPicked||[]).includes(ci);
                        return(
                        <button key={ci} title={on?"Retirer cette carte":"Engager cette carte"} onClick={()=>setCombat(prev=>{
                          const cur=prev.cardsPicked||[];
                          if(cur.includes(ci))return{...prev,cardsPicked:cur.filter(x=>x!==ci),cardsSpend:cur.length-1};
                          if(cur.length>=maxCards)return prev;
                          return{...prev,cardsPicked:[...cur,ci],cardsSpend:cur.length+1};
                        })} style={{width:26,height:34,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,fontFamily:"var(--font-mono)",cursor:"pointer",padding:0,
                          background:on?"linear-gradient(180deg,#8b2020,#bb3838)":"var(--bg3)",color:on?"#fff":"var(--text-dim)",
                          border:on?"1px solid #dd4444":"1px solid var(--border)",boxShadow:on?"0 0 6px rgba(220,50,30,0.4)":"none"}}>{val}</button>
                      );})}</div>
                    </div>}
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,padding:"12px 16px",background:"rgba(0,0,0,0.4)",borderRadius:10,border:"1px solid var(--border)"}}>
                      <span style={{fontSize:25,fontWeight:900,color:"var(--gold)",fontFamily:"var(--font-title)"}}>{total}</span>
                      <span style={{fontSize:14,color:"var(--text-muted)"}}>{combat.powerSpend}{cBonus.powerBonus>0?`+${cBonus.powerBonus}`:""}⚡ + {cardVal}🃏</span>
                      {cBonus.name&&<span style={{fontSize:12,padding:"2px 8px",borderRadius:4,background:"rgba(200,112,64,0.12)",border:"1px solid var(--rust)",color:"var(--rust)"}}>{cBonus.name}{cBonus.powerBonus>0?` +${cBonus.powerBonus}⚡`:""}{cBonus.cardBonus>0?` +${cBonus.cardBonus}🃏`:""}</span>}
                      {isPve&&<span style={{fontSize:18,fontWeight:700,marginLeft:"auto",color:total>=combat.empireCard.power?"var(--success)":"#ff4444"}}>{total>=combat.empireCard.power?"✓":"✗"} vs {combat.empireCard.power}</span>}
                    </div>
                    <button onClick={resolveCombat} style={{width:"100%",padding:"14px",fontSize:17,fontWeight:700,fontFamily:"var(--font-title)",letterSpacing:3,textTransform:"uppercase",background:"linear-gradient(135deg,var(--danger),#8b1515)",color:"#fff",border:"none",borderRadius:10,boxShadow:"0 3px 20px rgba(200,56,40,0.4)"}}>⚔ Combattre</button>
                    {combat.type==="pvp_defense"&&me.faction==="acadiane"&&(me.unlockedAbilities||[]).includes(2)&&(
                      <button onClick={resolveWhiteFlag} style={{width:"100%",marginTop:8,padding:"11px",fontSize:14,fontWeight:700,fontFamily:"var(--font-title)",letterSpacing:2,textTransform:"uppercase",background:"transparent",color:"var(--text-dim)",border:"1px solid var(--border-dark)",borderRadius:10}}>🏳 White Flag — céder le hex, +2 Popularité</button>
                    )}
                  </div>
                );
              })()}

              {/* COMBAT REWARD */}
              {combat&&combat.phase==="reward"&&(
                <div className="reward-panel" style={{padding:"24px",background:"linear-gradient(180deg,#0e200e,var(--bg2))",borderRadius:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                    <span style={{fontSize:37}}>🏆</span>
                    <div><div style={{fontFamily:"var(--font-title)",color:"var(--success)",fontSize:23,fontWeight:700}}>Victoire !</div><div style={{fontSize:14,color:"var(--text-dim)"}}>Choisissez votre butin</div></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                    {[{k:"metal",icon:"⚙",label:"2 Métal",sub:"Ferraille"},{k:"pop",icon:"♥",label:"+2 Pop",sub:"Acclamation"},{k:"fragment",icon:"🔬",label:"Fragment",sub:`Tesla (${(me.fragments||0)}/${TESLA_FRAGMENTS_REQUIRED})`}].map(r=>(
                      <button key={r.k} onClick={()=>claimReward(r.k)} style={{background:"var(--bg3)",border:"1px solid var(--border-light)",borderRadius:10,padding:"18px 10px",color:"var(--text)",textAlign:"center",fontFamily:"inherit"}}>
                        <div style={{fontSize:30,marginBottom:8}}>{r.icon}</div>
                        <div style={{fontSize:15,fontWeight:700}}>{r.label}</div>
                        <div style={{fontSize:12,color:"var(--text-muted)",marginTop:4}}>{r.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 📦 DÉPOSE EN ROUTE (mech) — passe-passe stratégiques */}
              {routeDrop&&!combat&&!encounter&&(()=>{
                const destKey=String(routeDrop.destHex);
                const wAtDest=(me?.workers||[]).filter(w=>w.hexId===routeDrop.destHex).length;
                const resAtDest=Object.entries(me?.resources?.[destKey]||{}).filter(([,q])=>q>0);
                const dropWorker=(mid)=>{
                  setPlayers(prev=>{const n=[...prev];const p2={...n[0],workers:[...n[0].workers]};
                    const wi=p2.workers.findIndex(w=>w.hexId===routeDrop.destHex);
                    if(wi>=0)p2.workers[wi]={...p2.workers[wi],hexId:mid};
                    n[0]=p2;return n;});
                  addLog(`📦 Ouvrier déposé sur #${mid} au passage`);
                };
                const dropRes=(mid)=>{
                  setPlayers(prev=>{const n=[...prev];const p2={...n[0],resources:{...n[0].resources}};
                    Object.keys(p2.resources).forEach(k=>{p2.resources[k]={...p2.resources[k]};});
                    const src=p2.resources[destKey]||{};
                    if(!p2.resources[String(mid)])p2.resources[String(mid)]={};
                    Object.entries(src).forEach(([rt,q])=>{p2.resources[String(mid)][rt]=(p2.resources[String(mid)][rt]||0)+q;});
                    delete p2.resources[destKey];
                    n[0]=p2;return n;});
                  addLog(`📦 Ressources déposées sur #${mid} au passage`);
                };
                return(
                <div style={{padding:"16px",background:"linear-gradient(180deg,#141a10,var(--bg2))",borderRadius:10,border:"1px solid var(--gold-dim)",animation:"slideUp 0.35s ease",marginBottom:10}}>
                  <div style={{color:"var(--gold)",fontFamily:"var(--font-title)",fontWeight:700,fontSize:15,marginBottom:6}}>📦 Dépose en route — le mech est passé par {routeDrop.mids.map(m=>`#${m}`).join(", ")}</div>
                  <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:8,fontStyle:"italic"}}>Déposez des ouvriers ou du matériel sur un hex de passage (expansion, relais, dépôt avant bataille)</div>
                  {routeDrop.mids.map(mid=>(
                    <div key={mid} style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
                      <span style={{fontSize:14,color:"var(--text)",minWidth:36}}>#{mid}</span>
                      <button disabled={wAtDest<1} onClick={()=>dropWorker(mid)} className="act-btn" style={{fontSize:13,opacity:wAtDest<1?0.4:1}}>● Déposer 1 ouvrier ({wAtDest} dispo)</button>
                      <button disabled={resAtDest.length===0} onClick={()=>dropRes(mid)} className="act-btn" style={{fontSize:13,opacity:resAtDest.length===0?0.4:1}}>📦 Déposer les ressources ({resAtDest.map(([rt,q])=>`${q}${rt}`).join(",")||"—"})</button>
                    </div>
                  ))}
                  <button onClick={()=>{const end=routeDrop.endAfter;setRouteDrop(null);if(end)endHumanTurn(myMat.topRow.indexOf("Move"));}} className="act-btn" style={{marginTop:6,background:"#3a6a3a",color:"#fff",border:"none",width:"100%",fontWeight:700}}>Continuer ▶</button>
                </div>);
              })()}

              {/* CHOIX DE POUVOIR DE FACTION — Servitude / Tierra Minada / Comptoir
                  sont des capacités OPTIONNELLES : confirmation demandée, plus
                  d'application d'office (les autres modaux passent en premier) */}
              {abilityOffer&&!combat&&!encounter&&!rougeRiver&&(()=>{
                const o=abilityOffer;
                const conf={
                  servitude:{icon:"⛓",title:"Servitude",desc:`Capturer un ouvrier chassé sur #${o.hexId} ? Il rejoint vos rangs (−2 Popularité · ${me.capturedWorkers||0}/2 captures).`,yes:"⛓ Capturer (−2 Pop)"},
                  trap:{icon:"🪤",title:"Tierra Minada",desc:`Poser un piège sur #${o.hexId} ? (${(me.trapTokens||[]).length}/4 posés — inflige −3⚡ à l'ennemi qui le déclenche)`,yes:"🪤 Poser le piège"},
                  flag:{icon:"🏴",title:"Comptoir",desc:`Établir un comptoir sur #${o.hexId} ? (${(me.flagTokens||[]).length}/4 — +1 territoire au score ; rappel : l'objectif de faction exige des comptoirs NON adjacents entre eux)`,yes:"🏴 Établir le comptoir"},
                }[o.type];
                const apply=()=>{
                  setPlayers(prev=>{
                    const n=[...prev];const p={...n[0]};
                    if(o.type==="servitude"){
                      if(p.pop<2||(p.capturedWorkers||0)>=2)return prev;
                      p.workers=[...p.workers,{id:`${p.faction}_serv${p.workers.length}`,hexId:o.hexId}];
                      p.pop=Math.max(0,p.pop-2);p.capturedWorkers=(p.capturedWorkers||0)+1;
                    }else if(o.type==="trap"){
                      p.trapTokens=[...(p.trapTokens||[]),{hexId:o.hexId,disarmed:false}];
                    }else{
                      p.flagTokens=[...(p.flagTokens||[]),{hexId:o.hexId}];
                    }
                    n[0]=p;return n;
                  });
                  addLog(o.type==="servitude"?`⛓ Servitude ! Ouvrier capturé (-2 Pop, ${(me.capturedWorkers||0)+1}/2)`
                    :o.type==="trap"?`🪤 Tierra Minada ! Trap posé sur #${o.hexId} (${(me.trapTokens||[]).length+1}/4)`
                    :`🏴 Comptoir posé sur #${o.hexId} (${(me.flagTokens||[]).length+1}/4)`);
                  setAbilityOffer(null);
                };
                return(
                  <div style={{padding:"20px",background:"linear-gradient(180deg,#1a1608,var(--bg2))",borderRadius:10,border:"1px solid var(--rust)",animation:"slideUp 0.35s ease"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(201,168,76,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,border:"2px solid var(--gold)",flexShrink:0}}>{conf.icon}</div>
                      <div>
                        <div style={{fontFamily:"var(--font-title)",color:"var(--gold)",fontSize:18,fontWeight:700}}>{conf.title}</div>
                        <div style={{fontSize:13,color:"var(--text-dim)",lineHeight:1.5,marginTop:3}}>{conf.desc}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={apply} className="act-btn" style={{flex:1,fontWeight:700,background:"#3a6a3a",color:"#fff",border:"none"}}>{conf.yes}</button>
                      <button onClick={()=>{setAbilityOffer(null);addLog(`— ${conf.title} : pouvoir non utilisé`);}} className="act-btn" style={{flex:1,opacity:0.8}}>Non merci</button>
                    </div>
                  </div>
                );
              })()}

              {/* ENCOUNTER */}
              {encounter&&(
                <div style={{padding:"20px",background:"linear-gradient(180deg,#1a1608,var(--bg2))",borderRadius:10,border:"1px solid var(--rust)",animation:"slideUp 0.35s ease"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:16}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(201,168,76,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:25,border:"2px solid var(--gold)",flexShrink:0}}>📜</div>
                    <div>
                      <div style={{fontFamily:"var(--font-title)",color:"var(--gold)",fontSize:18,fontWeight:700}}>{encounter.card.name}</div>
                      <div style={{fontSize:13,color:"var(--text-dim)",lineHeight:1.6,marginTop:4,fontStyle:"italic"}}>{encounter.card.desc}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {encounter.card.choices.map((c,ci)=>{
                      const locked=c.available&&!c.available(me);
                      return(
                      <button key={ci} onClick={()=>{if(!locked)resolveEncounter(ci);}} className="enc-card" disabled={locked} style={locked?{opacity:0.35,cursor:"not-allowed"}:undefined}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:23,width:28,textAlign:"center",display:"inline-flex",justifyContent:"center"}}><Glyph icon={c.icon} size={22}/></span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>{c.label}</div>
                            <div style={{fontSize:12,color:"var(--brass)",marginTop:2}}>{c.desc}</div>
                          </div>
                          <span style={{fontSize:18,color:"var(--gold-dim)"}}>›</span>
                        </div>
                      </button>
                    );})}
                  </div>
                </div>
              )}

              {/* RENCONTRE → BÂTIMENT GRATUIT (posé sur le hex du héros) */}
              {encounterBuild&&(()=>{
                const types=BUILDING_TYPES.filter(bt=>bt.type!=="gare"&&!(me.buildings||[]).some(b=>b.type===bt.type));
                return(
                  <div style={{padding:"20px",background:"linear-gradient(180deg,#1a1608,var(--bg2))",borderRadius:10,border:"1px solid var(--rust)",animation:"slideUp 0.35s ease"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                      <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(201,168,76,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:25,border:"2px solid var(--gold)",flexShrink:0}}>🏗</div>
                      <div>
                        <div style={{fontFamily:"var(--font-title)",color:"var(--gold)",fontSize:18,fontWeight:700}}>Bâtiment gratuit</div>
                        <div style={{fontSize:13,color:"var(--text-dim)"}}>Édifié sur le hex de votre héros (#{me.hero})</div>
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {types.map(bt=>(
                        <button key={bt.type} onClick={()=>doEncounterBuild(bt.type)} className="enc-card">
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontSize:23,width:28,textAlign:"center"}}>{bt.icon}</span>
                            <div style={{flex:1}}>
                              <div style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>{bt.name}</div>
                              <div style={{fontSize:12,color:"var(--brass)",marginTop:2}}>{bt.effect}</div>
                            </div>
                            <span style={{fontSize:18,color:"var(--gold-dim)"}}>›</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* RENCONTRE → RECRUE GRATUITE (colonne puis recrue permanente) */}
              {encounterEnlist&&(
                <div style={{padding:"20px",background:"linear-gradient(180deg,#12160e,var(--bg2))",borderRadius:10,border:"1px solid #5a9a7a",animation:"slideUp 0.35s ease"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(90,154,122,0.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:25,border:"2px solid #5a9a7a",flexShrink:0}}>🤝</div>
                    <div>
                      <div style={{fontFamily:"var(--font-title)",color:"#8fd0b0",fontSize:18,fontWeight:700}}>Recrue gratuite</div>
                      <div style={{fontSize:13,color:"var(--text-dim)"}}>Recrue {(me.recruits||0)+1}/4</div>
                    </div>
                  </div>
                  {encounterEnlist.col==null?(
                    <div>
                      <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:6}}>① Section (bonus immédiat) :</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>
                        {BOTTOM.map((bName,ci)=>{
                          const assigned=(me.enlistMap||[])[ci]!=null;
                          return <button key={ci} onClick={()=>setEncounterEnlist({col:ci})} className="act-btn" disabled={assigned} style={{textAlign:"center",opacity:assigned?0.3:1,cursor:assigned?"not-allowed":"pointer"}}>
                            <div style={{fontWeight:700,fontSize:14}}>{bName}</div>
                            <div style={{fontSize:13,color:"var(--gold)",marginTop:2}}>Immédiat {ENLIST_IMMEDIATE[ci].icon} {ENLIST_IMMEDIATE[ci].label}</div>
                            {assigned&&<div style={{fontSize:12,color:"#8fd0b0",marginTop:1}}>🤝 {ENLIST_ONGOING[(me.enlistMap||[])[ci]].icon} posée</div>}
                          </button>;
                        })}
                      </div>
                    </div>
                  ):(
                    <div>
                      <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:6}}>Section <b style={{color:"var(--brass)"}}>{BOTTOM[encounterEnlist.col]}</b> (immédiat {ENLIST_IMMEDIATE[encounterEnlist.col].icon} {ENLIST_IMMEDIATE[encounterEnlist.col].label}) — ② Recrue permanente :</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>
                        {ENLIST_ONGOING.map((rec,ri)=>{
                          const used=(me.enlistMap||[]).includes(ri);
                          return <button key={ri} onClick={()=>doEncounterEnlist(encounterEnlist.col,ri)} className="act-btn" disabled={used} style={{textAlign:"center",opacity:used?0.3:1,cursor:used?"not-allowed":"pointer",borderColor:used?"var(--border)":"#5a9a7a"}}>
                            <div style={{fontWeight:700,fontSize:15}}>{rec.icon} {rec.label}</div>
                            <div style={{fontSize:12,color:"#8fd0b0",marginTop:1}}>à chaque {BOTTOM[encounterEnlist.col]} (vous/voisins)</div>
                          </button>;
                        })}
                      </div>
                      <button onClick={()=>setEncounterEnlist({col:null})} className="act-btn" style={{marginTop:6,fontSize:14,opacity:0.7,minHeight:36}}>← Autre section</button>
                    </div>
                  )}
                </div>
              )}

              {/* ROUGE RIVER */}
              {rougeRiver&&(
                <div style={{padding:"20px",background:"linear-gradient(180deg,#1a0a08,var(--bg2))",borderRadius:10,border:"1px solid var(--danger)",animation:"slideUp 0.35s ease"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(139,32,32,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:25,border:"2px solid #8b2020",flexShrink:0}}>⚙</div>
                    <div>
                      <div style={{fontFamily:"var(--font-title)",color:"#cc4433",fontSize:18,fontWeight:700}}>Rouge River</div>
                      <div style={{fontSize:12,color:"var(--text-dim)"}}>
                        {rougeRiver.hasFragments?<span>Plans Ford <span style={{color:"#9060c0",fontWeight:700}}>+ Tesla</span></span>:"Plans Ford"} — Choisissez 1 carte
                      </div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:8,maxHeight:250,overflowY:"auto"}}>
                    {rougeRiver.cards.map(card=>(
                      <button key={card.id} onClick={()=>pickFactoryCard(card)} className={`rr-card ${card.type}`}>
                        {card.type==="tesla"&&<div style={{position:"absolute",top:4,right:6,fontSize:12,color:"#b080e0",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Tesla</div>}
                        {card.type==="ford"&&<div style={{position:"absolute",top:4,right:6,fontSize:12,color:"#7a9ab0",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Ford</div>}
                        <div style={{fontFamily:"var(--font-title)",fontSize:15,fontWeight:700,color:card.type==="tesla"?"#c090e0":"#a0b8cc",marginBottom:5,paddingRight:30}}>{card.name}</div>
                        <div style={{fontSize:13,color:"var(--text-dim)",lineHeight:1.5}}>{card.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ═══ ABILITY PICKER MODAL ═══ */}
        {pendingAbility&&(
          <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:12}}>
            <div style={{maxWidth:420,width:"90%",borderRadius:12,border:"1px solid var(--rust)",boxShadow:"0 10px 50px rgba(0,0,0,0.8)",background:"linear-gradient(180deg,#1a1510,var(--bg2))",padding:24,animation:"slideUp 0.25s ease"}}>
              <div style={{textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:25,fontWeight:900,fontFamily:"var(--font-title)",color:"var(--rust)",letterSpacing:2,textTransform:"uppercase"}}>Choisir une Ability</div>
                <div style={{fontSize:14,color:"var(--text-dim)",marginTop:4}}>Mecha déployé — débloque une capacité</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {myMechAbilities.map((ab,idx)=>{
                  const already=(me.unlockedAbilities||[]).includes(idx);
                  return(
                    <button key={idx} onClick={()=>{if(!already)confirmAbility(idx);}} disabled={already}
                      style={{
                        padding:"14px 12px",borderRadius:8,cursor:already?"not-allowed":"pointer",
                        background:already?"rgba(0,0,0,0.3)":"var(--bg3)",
                        border:already?"1px solid var(--border)":"1px solid var(--rust-dark)",
                        opacity:already?0.3:1,transition:"all 0.15s",textAlign:"center",
                      }}
                      onMouseEnter={e=>{if(!already)e.currentTarget.style.borderColor="var(--rust)";e.currentTarget.style.background="rgba(200,112,64,0.1)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=already?"var(--border)":"var(--rust-dark)";e.currentTarget.style.background=already?"rgba(0,0,0,0.3)":"var(--bg3)";}}
                    >
                      <div style={{fontSize:32,marginBottom:6}}>{ab.icon}</div>
                      <div style={{fontSize:16,fontWeight:700,fontFamily:"var(--font-title)",color:already?"var(--text-muted)":"var(--rust)",letterSpacing:1}}>{ab.name}</div>
                      <div style={{fontSize:13,color:already?"var(--text-muted)":"var(--text-dim)",marginTop:4}}>{already?"Déjà débloqué":ab.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ RIGHT PANEL: SCOREBOARD + ACTIONS + DROPDOWNS ═══ */}
      <div style={{display:"flex",flexDirection:"column",background:"linear-gradient(180deg,#241d12,#171209 60%,#100c07)",borderLeft:"1px solid var(--panel-edge)",boxShadow:"inset 1px 0 0 rgba(216,201,163,0.06)",overflow:"hidden"}}>

        {/* ── Illustration de faction — réintégrée dans l'espace de jeu (bannière
              compacte en tête du panneau, au lieu d'être réservée à l'écran de
              sélection) ── */}
        <div style={{height:74,position:"relative",overflow:"hidden",borderBottom:"1px solid var(--panel-edge)",flexShrink:0}}>
          <img src={FACTION_ART[me.faction]} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 32%",display:"block",opacity:0.85}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(10,9,6,0.1) 0%,rgba(10,9,6,0.5) 55%,rgba(10,9,6,0.92) 100%)"}}/>
          <div style={{position:"absolute",left:10,bottom:6,display:"flex",alignItems:"center",gap:6}}>
            <img src={FACTION_LOGOS[me.faction]} alt="" style={{width:22,height:22,filter:"drop-shadow(0 1px 4px rgba(0,0,0,0.7))"}}/>
            <span style={{fontSize:15,fontWeight:700,color:"var(--gold)",fontFamily:"var(--font-title)",textShadow:"0 1px 3px rgba(0,0,0,0.8)"}}>{myFaction.name}</span>
          </div>
        </div>

        {/* ── Capacité de faction — rappel permanent en jeu ── */}
        {myFaction.ability&&(
          <div title={`${myFaction.ability} — ${myFaction.abilityDesc||""}`}
            style={{padding:"5px 10px",borderBottom:"1px solid var(--border)",flexShrink:0,fontSize:13,display:"flex",gap:6,alignItems:"flex-start",background:"rgba(200,112,64,0.05)"}}>
            <span>🏴</span>
            <div style={{minWidth:0}}>
              <span style={{fontWeight:700,fontFamily:"var(--font-title)",color:"var(--rust)"}}>{myFaction.ability}</span>
              <div style={{color:"var(--text-dim)",fontSize:12,lineHeight:1.45}}>{myFaction.abilityDesc}</div>
            </div>
          </div>
        )}

        {/* ── Scoreboard ── */}
        <div style={{padding:"6px 8px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          {players.map((p,i)=>{const fc=FACTIONS[p.faction];const isActive=i===currentP;return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 6px",borderRadius:4,
              background:isActive?"rgba(200,112,64,0.06)":"transparent",
              borderLeft:isActive?`3px solid ${fc.color}`:"3px solid transparent",
              animation:isActive&&i>0?"botPulse 1.5s ease infinite":"none",
              marginBottom:2,
            }}>
              <div style={{width:8,height:8,borderRadius:"50%",background:fc.color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:fc.color,fontFamily:"var(--font-title)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{fc.name.slice(0,8)}{isActive&&<span style={{color:"var(--gold)",marginLeft:4}}>◀</span>}</div>
              </div>
              <div style={{fontSize:14,color:"var(--text-dim)",whiteSpace:"nowrap",fontFamily:"var(--font-mono)"}}>⚡{p.power} ♥{p.pop} ⭐{p.stars}</div>
            </div>
          );})}
        </div>

        {/* ── Bonus de construction actif ── */}
        {structureBonus&&(
          <div title={`En fin de partie : +${structureBonus.coins}$ ${structureBonus.desc} (tuiles marquées $ sur la carte)`}
            style={{padding:"5px 10px",borderBottom:"1px solid var(--border)",flexShrink:0,fontSize:13,color:"var(--gold)",display:"flex",alignItems:"center",gap:6,background:"rgba(212,178,84,0.05)"}}>
            <span>🏦</span>
            <span style={{fontWeight:700,fontFamily:"var(--font-title)"}}>{structureBonus.icon} {structureBonus.name}</span>
            <span style={{color:"var(--text-dim)",marginLeft:"auto"}}>+{structureBonus.coins}$/bât.</span>
          </div>
        )}

        {/* ── Plan d'usine actif (Rouge River) ── */}
        {me.factoryCard&&(
          <div style={{padding:"5px 10px",borderBottom:"1px solid var(--border)",flexShrink:0,fontSize:13,display:"flex",gap:6,alignItems:"flex-start",background:me.factoryCard.type==="tesla"?"rgba(123,45,139,0.07)":"rgba(58,106,154,0.07)"}}>
            <span>⚙</span>
            <div style={{minWidth:0}}>
              <span style={{fontWeight:700,fontFamily:"var(--font-title)",color:me.factoryCard.type==="tesla"?"#b080e0":"#8aa0b8"}}>{me.factoryCard.name}</span>
              <div style={{color:"var(--text-dim)",fontSize:12,lineHeight:1.45}}>{me.factoryCard.desc}</div>
            </div>
          </div>
        )}

        {/* ── Actions area ── */}
        <div style={{flex:1,overflow:"auto",padding:0}}>

          {/* Player mat — 4 vertical action cards, grouped: columns 0+1 (top pair) / columns 2+3 (bottom pair) with strong separator.
              Restent visibles pendant l'Améliorer (upgradePicking) : les cases de cubes y sont cliquées directement */}
          {isMyTurn&&!combat&&!encounter&&!rougeRiver&&!selAction&&!endOfTurn&&(!pendingBottom||upgradePicking)&&(
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {/* ── AMÉLIORER : consignes AU-DESSUS des colonnes (constaté en
                  partie réelle : sans ce bandeau, on croyait l'amélioration
                  jamais démarrée — les instructions vivaient tout en bas) ── */}
              {upgradePicking&&(()=>{
                const from=bottomPick?.upgradeFrom;const to=bottomPick?.upgradeTo;
                const ready=from!=null&&to!=null;
                const mat=MATS.find(m=>m.id===me.matId);
                return(
                  <div style={{margin:"8px 8px 10px",padding:"10px 12px",borderRadius:8,background:"rgba(212,178,84,0.10)",border:"1px solid var(--gold)",boxShadow:"0 0 12px rgba(212,178,84,0.18)",animation:"slideUp 0.2s ease"}}>
                    <div style={{fontFamily:"var(--font-title)",fontWeight:800,fontSize:15,color:"var(--gold)",marginBottom:4}}>⬆ Amélioration en cours — sur les cartes ci-dessous :</div>
                    <div style={{fontSize:14,lineHeight:1.6}}>
                      <span style={{color:from!=null?"#8fbf6a":"var(--text)",fontWeight:700}}>① retirez un cube de la rangée HAUT{from!=null?` ✓ ${FR_TOP[me.topRow[from]]||me.topRow[from]}`:""}</span>
                      <span style={{color:"var(--text-muted)"}}> puis </span>
                      <span style={{color:to!=null?"#8fbf6a":from!=null?"var(--gold)":"var(--text-dim)",fontWeight:700}}>② posez-le sur un coût de la rangée BAS{to!=null?` ✓ ${FR_BOT[BOTTOM[to]]||BOTTOM[to]} (+${mat?.bottomCosts?.[to]?.bonus||0}$)`:""}</span>
                    </div>
                    <div style={{display:"flex",gap:6,marginTop:8}}>
                      <button disabled={!ready} onClick={()=>{doUpgrade(from,to);setBottomPick(null);}} className="act-btn" style={{flex:1,fontWeight:700,...(ready?{background:"#3a6a3a",color:"#fff",border:"none"}:{opacity:0.45,cursor:"not-allowed"})}}>✓ Valider l'amélioration</button>
                      {(from!=null||to!=null)&&<button onClick={()=>setBottomPick(null)} className="act-btn" style={{fontSize:13,opacity:0.75}} title="Réinitialiser la sélection">↩</button>}
                    </div>
                    <div style={{fontSize:12,color:"var(--text-dim)",marginTop:6}}>Toutes les colonnes sont des cibles valides — y compris l'action que vous venez de jouer.</div>
                  </div>
                );
              })()}
              {myMat.topRow.map((action,i)=>{
                // Plan « Le Blueprint Perdu » : peut rejouer la même colonne deux tours de suite.
                // Pendant l'Améliorer, AUCUNE carte n'est grisée : les cubes de toutes les
                // colonnes (y compris celle jouée ce tour) sont des cibles valides — le
                // grisage laissait croire qu'on ne pouvait pas y appliquer l'amélioration
                const disabled=me.lastCol===i&&me.factoryCard?.topBonus!=="copy_top"&&!upgradePicking;
                const bottomAction=BOTTOM[i];
                const costs=getBottomCost(me);
                const bc=costs[i];
                const mat=MATS.find(m=>m.id===me.matId);
                const cubesTop=(me.cubesOnTop||[])[i]||0;
                const cubesBot=(me.cubesOnBottom||[])[i]||0;
                // Cases utilisables plafonnées : le coût ne descend jamais sous 1
                const maxBot=maxBottomCubes(mat,i);
                // Le coût de Produce n'est plus une liste calculée : il se LIT sur
                // la piste des 6 ouvriers rendue sous la rangée (ProduceTrack) —
                // chaque case libérée révèle son coût imprimé (⚡/♥/💰)
                const topActionRow={
                  Move:{pay:[],gain:["worker","worker"],altGain:["coins"],label:"Move"},
                  Bolster:{pay:["coins"],gain:["power","power"],altGain:["combatCards"],label:"Bolster"},
                  Trade:{pay:["coins"],gain:["metal","metal"],altGain:["pop"],label:"Trade"},
                  Produce:{pay:[],gain:["nourriture","nourriture"],altGain:null,label:"Produce"},
                }[action]||{pay:[],gain:[],altGain:null,label:action};
                const bottomData={
                  Upgrade:{prog:`${me.upgrades||0}/6`,max:(me.upgrades||0)>=6},
                  Deploy:{prog:`${me.mechs.length}/4`,max:me.mechs.length>=4},
                  Build:{prog:`${(me.buildings||[]).length}/4`,max:(me.buildings||[]).length>=4},
                  Enlist:{prog:`${me.recruits||0}/4`,max:(me.recruits||0)>=4},
                }[bottomAction]||{prog:"",max:false};
                const hasRes=bc?countRes(me,bc.res)>=bc.qty:false;
                // $ libéré à chaque cube d'upgrade posé ici (icône, pas chiffre)
                const upBonus=(mat?.bottomCosts||[])[i]?.bonus||0;
                // Cubes d'upgrade encore posables ici → autant de -1 sur le coût
                const reducAvail=Math.max(0,maxBot-cubesBot);
                // Part du coût jamais réductible (base moins le nombre total de cases d'amélioration)
                const fixedQty=bc?Math.max(0,bc.base-maxBot):0;
                const topPark=(mat?.topCubes||[])[i]||0;
                // Bâtiment "domicilié" sur cette colonne (rangement, pas une règle de jeu :
                // BUILDING_TYPES[i] est fixe, indépendant du top/bottom de ce plateau)
                const colBuilding=BUILDING_TYPES[i];
                const builtEntry=colBuilding?(me.buildings||[]).find(b=>b.type===colBuilding.type):null;
                const BIcon=colBuilding?BUILDING_ICONS[colBuilding.type]:null;
                // Recrue posée sur cette colonne (choix libre du joueur à l'enrôlement)
                const recIdx=(me.enlistMap||[])[i];
                const rec=recIdx!=null?ENLIST_ONGOING[recIdx]:null;
                const RIcon=rec?RESOURCE_ICONS[rec.svgKey]:null;
                // Gain intrinsèque de l'action du bas (la flèche ↑ pour Améliorer)
                const bottomGainRes=bottomAction==="Deploy"?"mech":bottomAction==="Build"?"building":bottomAction==="Enlist"?"pop":"upgrade";
                // Action group separator: strong between pairs (after index 1), light between actions within a pair (after index 0, 2)
                const isGroupEnd=i===1;
                const isLastAction=i===3;
                return(
                  <React.Fragment key={action}>
                  <button onClick={()=>{if(upgradePicking)return;if(!disabled){pushHistory();setPreActionSnapshot({...players[0],workers:[...players[0].workers.map(w=>({...w}))],mechs:[...players[0].mechs.map(m=>({...m}))],buildings:[...(players[0].buildings||[]).map(b=>({...b}))],resources:{...Object.fromEntries(Object.entries(players[0].resources).map(([k,v])=>[k,{...v}]))},movedUnits:[...(players[0].movedUnits||[])]});setSelAction(action);}}}
                    onMouseEnter={e=>{if(!disabled&&!upgradePicking)e.currentTarget.style.borderColor=myFaction?.color||"var(--rust)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border-dark)";}}
                    style={{
                    padding:0,margin:"0 8px 8px",borderRadius:8,overflow:"hidden",textAlign:"left",
                    background:disabled?"rgba(0,0,0,0.4)":"rgba(255,255,255,0.025)",
                    border:"1px solid var(--border-dark)",
                    color:disabled?"var(--text-muted)":"var(--text)",
                    opacity:disabled?0.4:1,cursor:disabled?"not-allowed":"pointer",
                    display:"flex",flexDirection:"column",transition:"border-color 0.15s ease",
                  }}>
                    {/* EN-TÊTE : nom couplé (action haut · action bas) façon Scythe */}
                    <div style={{padding:"6px 10px",display:"flex",alignItems:"center",gap:6,background:"linear-gradient(180deg,rgba(66,52,30,0.7),rgba(44,35,20,0.55))",borderBottom:"1px solid var(--border)"}}>
                      <span style={{fontSize:15,fontWeight:800,color:disabled?"var(--text-muted)":"var(--rust-light)",fontFamily:"var(--font-title)"}}>{FR_TOP[action]||action}</span>
                      <span style={{fontSize:14,color:"var(--text-muted)"}}>·</span>
                      <span style={{fontSize:14,fontWeight:700,color:"var(--text-dim)",fontFamily:"var(--font-title)"}}>{FR_BOT[bottomAction]||bottomAction}</span>
                      {disabled?<span style={{marginLeft:"auto",fontSize:12,color:"var(--text-muted)",fontStyle:"italic"}}>joué</span>
                        :<span style={{marginLeft:"auto",fontSize:12,fontWeight:700,color:bottomData.max?"var(--success)":"var(--gold-dim)",whiteSpace:"nowrap"}}>{bottomData.max?"✓ max":bottomData.prog}</span>}
                    </div>
                    {/* RANGÉE HAUT — gains de l'action (+ cases fantômes des bonus à débloquer)
                        avec, alignée à droite, la case Bâtiment domiciliée sur cette colonne */}
                    <div style={{padding:"7px 10px",display:"flex",alignItems:"center",gap:8}}>
                      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:3,flexWrap:"wrap"}}>
                        {(()=>{
                          // Chaque case d'amélioration correspond à une OPTION précise de
                          // l'action (Soutien : ⚡+1 et 🃏+1 ; Commerce : ♥+1 et 📦+1…) et
                          // se rend EN LIGNE à côté de l'option concernée — pas en vrac en
                          // fin de rangée. Cube en place = bonus verrouillé (fantôme).
                          const slots=Array.from({length:topPark},(_,k)=>topSlots(action,topPark)[k]||{res:"upgrade",label:"Amélioration"});
                          const ghost=(k)=>{
                            // Améliorer : le prochain cube retirable de cette colonne se clique directement
                            const isCube=k<cubesTop;
                            const pickable=upgradePicking&&isCube&&k===cubesTop-1;
                            return <GhostSquare key={`t${k}`} resource={slots[k].res} kind="gain" filled={!isCube} size={21}
                              selected={pickable&&bottomPick?.upgradeFrom===i}
                              onClick={pickable?(e)=>{e.stopPropagation();setBottomPick(prev=>({...(prev||{}),upgradeFrom:i}));}:undefined}
                              title={pickable?`① Retirer ce cube de ${FR_TOP[action]||action} (${slots[k].label})`:!isCube?`Bonus débloqué : ${slots[k].label}`:`À débloquer via Améliorer : ${slots[k].label}`}/>;
                          };
                          const gainGhosts=[],altGhosts=[];
                          slots.forEach((s,k)=>{(["combatCards","pop","coins"].includes(s.res)?altGhosts:gainGhosts).push(ghost(k));});
                          return <ActionRow pay={topActionRow.pay} gain={topActionRow.gain} altGain={topActionRow.altGain} compact size={21}
                            gainSuffix={gainGhosts} altSuffix={altGhosts}/>;
                        })()}
                        </div>
                        {/* Piste des 6 ouvriers (règle Scythe) : chaque case libérée
                            révèle le coût imprimé dessous — le coût de Produire se
                            lit directement sur la piste */}
                        {action==="Produce"&&<ProduceTrack nWorkers={me.workers.length} size={19}/>}
                      </div>
                      {colBuilding&&<div style={{width:168,flexShrink:0,display:"flex",alignSelf:"stretch"}}>
                        <BuildingSlot Icon={BIcon} name={colBuilding.name} effect={colBuilding.effect} revealed={!!builtEntry} extra={builtEntry?`#${builtEntry.hexId}`:null}/>
                      </div>}
                    </div>
                    {/* RANGÉE BAS — coût lu comme une séquence : cases fixes → cubes déjà posés
                        (réduction acquise) → coûts fantômes (encore annulables) → gains,
                        avec, alignée à droite, la case Recrue de cette colonne */}
                    <div style={{padding:"7px 10px",display:"flex",alignItems:"center",gap:8,background:"rgba(0,0,0,0.28)",borderTop:"1px solid var(--border)"}}>
                      <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:3,flexWrap:"wrap"}}>
                        {bc&&<>
                          {Array.from({length:fixedQty}).map((_,k)=><ActionSquare key={`f${k}`} type="cost" resource={bc.res} size={21}/>)}
                          {Array.from({length:cubesBot}).map((_,k)=><UpgradeSlot key={`u${k}`} filled size={21} title="Réduction acquise (cube posé)"/>)}
                          {Array.from({length:reducAvail}).map((_,k)=>{
                            // Améliorer : la prochaine case de réduction de cette colonne se clique directement
                            const pickable=upgradePicking&&k===0;
                            return <GhostSquare key={`r${k}`} resource={bc.res} kind="cost" size={21}
                              selected={pickable&&bottomPick?.upgradeTo===i}
                              onClick={pickable?(e)=>{e.stopPropagation();setBottomPick(prev=>({...(prev||{}),upgradeTo:i}));}:undefined}
                              title={pickable?`② Placer le cube ici : -1 coût sur ${FR_BOT[bottomAction]||bottomAction}`:"Coût encore annulable via Améliorer"}/>;
                          })}
                          <span style={{width:6,flexShrink:0}}/>
                        </>}
                        <ActionRow gain={[...(upBonus>0?Array(upBonus).fill("coins"):[]),bottomGainRes]} compact size={21} />
                      </div>
                      <div style={{width:168,flexShrink:0,display:"flex",alignSelf:"stretch"}}>
                        <RecruitSlot Icon={RIcon} label={rec?rec.label:null} placed={!!rec}/>
                      </div>
                    </div>
                  </button>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Action detail panels */}
          {isMyTurn&&!combat&&!encounter&&!rougeRiver&&selAction&&(
            <div style={{padding:"12px 16px",fontSize:14,animation:"slideUp 0.25s ease"}}>
              {selAction==="Move"&&(
                <div>
                  <div style={{color:"var(--gold)",fontFamily:"var(--font-title)",fontWeight:700,marginBottom:8,fontSize:16}}>Déplacement ({(me.movedUnits||[]).length}/{moveLimit})</div>
                  {/* Règle : Gagner est l'ALTERNATIVE au déplacement — plus proposé dès qu'une unité a bougé */}
                  {(me.movedUnits||[]).length===0&&<button onClick={()=>{const g=1+topUpgradeCount(me,"Move","coins");setPlayers(prev=>{const n=[...prev];n[0]={...n[0],coins:n[0].coins+g};return n;});addLog(`💰 +${g}$`);endHumanTurn(myMat.topRow.indexOf("Move"));}} className="act-btn" style={{marginBottom:8,background:"var(--bg2)",border:`1px solid var(--gold-dim)`,width:"100%"}}>💰 Gagner {1+topUpgradeCount(me,"Move","coins")}$ (pas de déplacement)</button>}
                  {!moveSource&&(
                    <div style={{padding:"10px 12px",borderRadius:6,background:"rgba(212,178,84,0.07)",border:"1px dashed var(--gold-dim)",fontSize:14,color:"var(--gold)",lineHeight:1.5}}>
                      👆 Cliquez sur la carte l'unité à déplacer (hexes surlignés en doré), puis sa destination.
                      <div style={{fontSize:13,color:"var(--text-dim)",marginTop:4}}>
                        Disponibles : {!(me.movedUnits||[]).includes("hero")&&<span>★ {myFaction.hero} · </span>}
                        ● {me.workers.filter(w=>!(me.movedUnits||[]).includes(w.id)).length} ouvrier(s)
                        {me.mechs.length>0&&<span> · ⬡ {me.mechs.filter(m=>!(me.movedUnits||[]).includes(m.id)).length} mecha(s)</span>}
                      </div>
                    </div>
                  )}
                  {/* 🚚 Choix d'emport (règle Scythe : le transport est optionnel) —
                      désactivé, le mech laisse ouvriers+ressources tenir le terrain */}
                  <button onClick={()=>setCarryOnMove(c=>!c)} className="act-btn" style={{marginTop:8,width:"100%",fontSize:14,
                    background:carryOnMove?"rgba(201,168,76,0.12)":"transparent",
                    border:carryOnMove?"1px solid var(--gold)":"1px solid var(--border)",
                    color:carryOnMove?"var(--gold)":"var(--text-muted)"}}>
                    🚚 Emporter ouvriers & ressources : {carryOnMove?"OUI":"NON (les laisser sur place)"}
                  </button>
                  {/* Plan « River Rouge Special » : téléporter les ressources d'un hex vers le héros */}
                  {me.factoryCard?.topBonus==="teleport_res"&&!me.planTopUsed&&!moveSource&&(()=>{
                    const resHexes=Object.entries(me.resources).filter(([hid,r])=>parseInt(hid)!==me.hero&&Object.values(r).some(q=>q>0));
                    if(resHexes.length===0)return null;
                    return <div style={{marginTop:8}}>
                      <div style={{fontSize:13,color:"#8aa0b8",marginBottom:4}}>⚙ River Rouge Special (1×/tour) — téléporter vers le héros (#{me.hero}) :</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {resHexes.map(([hid,r])=><button key={hid} onClick={()=>doPlanTeleportRes(parseInt(hid))} className="act-btn" style={{fontSize:13,borderColor:"#4a5a6a"}}>#{hid} · {Object.entries(r).filter(([,q])=>q>0).map(([rt,q])=>`${q} ${rt.slice(0,4)}`).join(", ")}</button>)}
                      </div>
                    </div>;
                  })()}
                  {moveSource&&<div style={{color:"#C9A84C",fontSize:14,marginTop:8,fontStyle:"italic"}}>
                    {moveSource.unitType==="hero"?`★ ${myFaction.hero}`:<><Glyph icon={moveSource.unitType==="mech"?"⬡":"●"} size={14}/> {moveSource.unitType==="mech"?"Mecha":"Ouvrier"}</>} sélectionné (#{moveSource.fromHex}) — cliquez sa destination (hexes verts), ou une autre de vos unités pour changer.
                  </div>}
                  {/* ═══ TRANSPORT PARTIEL — répartition façon balance à deux plateaux
                      (modèle Scythe Digital Edition) : hex qui GARDE à gauche, mecha qui
                      EMBARQUE à droite, ‹ › « » par ligne + tout-laisser/tout-embarquer.
                      Rendu ICI, dans le panneau d'action de droite (pas en overlay carte). ═══ */}
                  {transportPick&&(()=>{
                    const tp=transportPick;
                    const sq={width:24,height:24,borderRadius:4,border:"1px solid var(--border)",background:"var(--bg3)",color:"var(--gold-dim)",cursor:"pointer",fontSize:13,fontWeight:800,lineHeight:1,padding:0};
                    const bigSq={...sq,width:32,height:32,fontSize:15,color:"var(--gold)"};
                    const setW=(v)=>setTransportPick(t=>({...t,workers:Math.max(0,Math.min(t.workersMax,v))}));
                    const setR=(rt,v)=>setTransportPick(t=>({...t,res:{...t.res,[rt]:Math.max(0,Math.min(t.resMax[rt],v))}}));
                    const row=(key,Icon,taken,max,set,divider)=>(
                      <div key={key} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 0",borderBottom:divider?"1px dashed var(--border-dark)":"none",marginBottom:divider?4:0}}>
                        <button style={sq} title="Tout laisser sur l'hex" onClick={()=>set(0)}>«</button>
                        <button style={sq} title="En laisser 1 de plus" onClick={()=>set(taken-1)}>‹</button>
                        <span style={{width:20,textAlign:"center",fontFamily:"var(--font-mono)",fontSize:14,color:max-taken>0?"var(--text)":"var(--text-muted)"}}>{max-taken}</span>
                        <div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
                          <span style={{width:20,display:"flex",justifyContent:"center",flexShrink:0}}>{Icon&&<Icon size={17} color="#d8c9a3"/>}</span>
                          <div style={{flex:1,height:5,borderRadius:3,background:"rgba(0,0,0,0.55)",border:"1px solid var(--border-dark)",position:"relative"}}>
                            <div style={{position:"absolute",right:0,top:0,bottom:0,width:`${max?taken/max*100:0}%`,background:"linear-gradient(90deg,#8a6c2e,#c9a84c)",borderRadius:3,transition:"width 0.15s ease"}}/>
                          </div>
                        </div>
                        <span style={{width:20,textAlign:"center",fontFamily:"var(--font-mono)",fontSize:14,color:taken>0?"var(--gold)":"var(--text-muted)"}}>{taken}</span>
                        <button style={sq} title="En embarquer 1 de plus" onClick={()=>set(taken+1)}>›</button>
                        <button style={sq} title="Tout embarquer" onClick={()=>set(max)}>»</button>
                      </div>
                    );
                    const MechIcon=RESOURCE_ICONS.mech,WorkerIcon=RESOURCE_ICONS.worker;
                    return(
                    <div style={{marginTop:8,width:"100%",
                      background:"linear-gradient(180deg,#241d12,#14100a)",border:"1px solid var(--gold-dim)",borderRadius:10,
                      animation:"slideUp 0.2s ease",overflow:"hidden"}}>
                      <div style={{textAlign:"center",padding:"5px 0",fontFamily:"var(--font-title)",fontSize:14,letterSpacing:5,fontWeight:800,color:"var(--gold)",borderBottom:"1px solid var(--border)",background:"rgba(0,0,0,0.3)"}}>TRANSPORT</div>
                      <div style={{display:"flex",alignItems:"stretch",gap:8,padding:"8px 10px 4px"}}>
                        {/* Plateau gauche : l'hex de départ (ce qui RESTE) */}
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",width:42,paddingBottom:2}}>
                          <span title={`Reste sur l'hex #${tp.fromHex}`} style={{fontSize:24,lineHeight:1,color:"#8a8070"}}>⬡</span>
                          <span style={{fontSize:11,color:"var(--text-muted)",fontFamily:"var(--font-mono)"}}>#{tp.fromHex}</span>
                          <button style={bigSq} title="Tout laisser (le mecha part seul)"
                            onClick={()=>setTransportPick(t=>({...t,workers:0,res:Object.fromEntries(Object.keys(t.resMax).map(k=>[k,0]))}))}>≪</button>
                        </div>
                        {/* Lignes : ouvriers (séparés) puis ressources */}
                        <div style={{flex:1,minWidth:0}}>
                          {tp.workersMax>0&&row("workers",WorkerIcon,tp.workers,tp.workersMax,setW,Object.keys(tp.resMax).length>0)}
                          {Object.entries(tp.resMax).map(([rt,mx])=>row(rt,RESOURCE_ICONS[rt],tp.res[rt]||0,mx,(v)=>setR(rt,v),false))}
                        </div>
                        {/* Plateau droit : le mecha (ce qui EMBARQUE) */}
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",width:42,paddingBottom:2}}>
                          <span title={`Embarqué vers l'hex #${tp.toHex}`}>{MechIcon&&<MechIcon size={24} color="#c9a84c"/>}</span>
                          <span style={{fontSize:11,color:"var(--text-muted)",fontFamily:"var(--font-mono)"}}>#{tp.toHex}</span>
                          <button style={bigSq} title="Tout embarquer"
                            onClick={()=>setTransportPick(t=>({...t,workers:t.workersMax,res:{...t.resMax}}))}>≫</button>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6,padding:"4px 10px 10px"}}>
                        <button className="act-btn" style={{flex:1,fontWeight:700,minHeight:36,background:"#3a6a3a",color:"#fff",border:"none"}}
                          onClick={()=>{setTransportPick(null);handleHexClick(tp.toHex,{transport:{workers:tp.workers,res:tp.res}});}}>✓ Déplacer</button>
                        <button className="act-btn" style={{minHeight:36,opacity:0.7}} onClick={()=>setTransportPick(null)}>✕</button>
                      </div>
                    </div>);
                  })()}
                  {/* PACK UP — Nations free building move */}
                  {me.faction==="nations"&&(me.unlockedAbilities||[]).includes(3)&&(me.buildings||[]).length>0&&!me.packUpUsed&&!moveSource&&(()=>{
                    if(bottomPick&&bottomPick.packUp){
                      const bld=(me.buildings||[])[bottomPick.buildingIdx];
                      const adjTargets=(ADJ[bld.hexId]||[]).filter(id=>{const h=hMap[id];return h&&h.t!=="lac"&&h.t!=="marecage"&&!(me.buildings||[]).some(b=>b.hexId===id);});
                      const bt=BUILDING_TYPES.find(t=>t.type===bld.type);
                      return <div style={{marginTop:8,padding:"8px 10px",borderRadius:6,border:"1px solid var(--nations)",background:"rgba(32,178,170,0.06)"}}>
                        <div style={{fontSize:14,color:"var(--nations)",marginBottom:6}}>📦 Pack Up — déplacer {bt?bt.icon:""} {bt?bt.name:""} depuis #{bld.hexId}</div>
                        {adjTargets.length>0?<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{adjTargets.map(hid=><button key={hid} onClick={()=>doPackUpMove(bottomPick.buildingIdx,hid)} className="act-btn" style={{borderColor:"var(--nations)"}}>→ #{hid}</button>)}</div>:<div style={{fontSize:12,color:"var(--text-muted)"}}>Aucun hex adjacent libre</div>}
                        <button onClick={()=>setBottomPick(null)} className="act-btn" style={{marginTop:6,fontSize:14,opacity:0.7,minHeight:36}}>← Annuler</button>
                      </div>;
                    }
                    return <div style={{marginTop:8}}>
                      <div style={{fontSize:14,color:"var(--nations)",marginBottom:4}}>📦 Pack Up (gratuit, 1×/tour) :</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{(me.buildings||[]).map((b,i)=>{const bt=BUILDING_TYPES.find(t=>t.type===b.type);return <button key={i} onClick={()=>setBottomPick({packUp:true,buildingIdx:i})} className="act-btn" style={{fontSize:14,borderColor:"var(--nations)",padding:"8px 12px"}}>{bt?bt.icon:"🏗"} #{b.hexId}</button>;})}</div>
                    </div>;
                  })()}
                  {me.packUpUsed&&me.faction==="nations"&&<div style={{marginTop:6,fontSize:12,color:"var(--text-muted)"}}>📦 Pack Up utilisé ce tour</div>}
                  {/* Le bouton unique « ✓ Terminer le déplacement » (bloc générique
                      plus bas) sert de filet de sécurité — l'ancien doublon ici
                      loguait ✅ quand l'autre non (journal incohérent) */}
                </div>
              )}
              {selAction==="Bolster"&&(<div>
                <div style={{color:"var(--gold)",fontFamily:"var(--font-title)",fontWeight:700,marginBottom:8,fontSize:16}}>Soutien (1$)</div>
                {me.coins<1?<div style={{color:"#8A3030",fontSize:14}}>Pas assez d'$</div>:
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>doBolster("power")} className="act-btn" style={{flex:1}}>⚡ +{2+topUpgradeCount(me,"Bolster","power")} Puissance</button>
                  <button onClick={()=>doBolster("cards")} className="act-btn" style={{flex:1}}>🃏 +{1+topUpgradeCount(me,"Bolster","combatCards")} Carte{topUpgradeCount(me,"Bolster","combatCards")>0?"s":""}</button>
                </div>}
              </div>)}
              {selAction==="Produce"&&(<div>
                <div style={{color:"var(--gold)",fontFamily:"var(--font-title)",fontWeight:700,marginBottom:8,fontSize:16}}>Production (max {2+topUpgradeCount(me,"Produce","nourriture")} hex)</div>
                {(()=>{
                  const nw=me.workers.length;const costStr=produceCostLabel(nw);const canPay=canPayProduce(me);
                  const maxN=2+topUpgradeCount(me,"Produce","nourriture");
                  const moulinHex=(me.buildings||[]).find(b=>b.type==="moulin")?.hexId;
                  const nbPicked=producePicks.filter(h=>h!==moulinHex).length;
                  const moulinPicked=moulinHex!=null&&producePicks.includes(moulinHex);
                  return(<div>
                    {/* La piste des 6 ouvriers : chaque case libérée révèle son coût */}
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <ProduceTrack nWorkers={nw} size={26}/>
                    </div>
                    {/* Choix des hex AU CLIC sur la carte (le Moulin est un bonus hors limite) */}
                    <div style={{padding:"8px 10px",borderRadius:6,background:"rgba(212,178,84,0.07)",border:"1px dashed var(--gold-dim)",fontSize:14,color:"var(--gold)",lineHeight:1.5,marginBottom:8}}>
                      👆 Cliquez vos hex de production sur la carte (surlignés) — sélection : <b>{nbPicked}/{maxN}</b>{moulinHex!=null&&<span> {moulinPicked?"+ Moulin ✓":"· Moulin (bonus) à cocher"}</span>}
                    </div>
                    <div style={{fontSize:14,color:canPay?"var(--text-dim)":"#ff5555",marginBottom:6}}>Coût actuel : {costStr} ({nw} ouvrier{nw>1?"s":""})</div>
                    {canPay
                      ?<button onClick={doProduce} disabled={producePicks.length===0} className="act-btn" style={{width:"100%",...(producePicks.length===0?{opacity:0.45,cursor:"not-allowed"}:{})}}>⚒ Produire ({producePicks.length} hex)</button>
                      :<div style={{color:"#8A3030"}}>Insuffisant</div>}
                  </div>);
                })()}
              </div>)}
              {selAction==="Trade"&&(()=>{
                const RES_ICO={metal:"⚙",bois:"🪵",nourriture:"🌽",petrole:"🛢"};
                return(<div>
                <div style={{color:"var(--gold)",fontFamily:"var(--font-title)",fontWeight:700,marginBottom:8,fontSize:16}}>Commerce (1$)</div>
                {me.coins<1?<div style={{color:"#8A3030",fontSize:14}}>Pas assez d'$</div>:
                <div>
                  <div style={{fontSize:14,color:"var(--text-dim)",marginBottom:6}}>
                    Choisissez {tradeSlots} ressources <b>sur la carte</b> : cliquez une icône dans le chip au-dessus d'un hex portant un de vos ouvriers — c'est là qu'elle atterrit (règle Scythe, réparties librement).
                  </div>
                  {tradeHexes.length===0&&<div style={{fontSize:13,color:"#c07050",marginBottom:8}}>⚠ Aucun ouvrier sur le plateau — seule l'option ♥ est disponible.</div>}
                  {/* Emplacements visibles — l'état de la sélection ne peut pas être raté */}
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                    {Array.from({length:tradeSlots}).map((_,i)=>(
                      <div key={i} style={{width:46,height:42,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontSize:tradePicks[i]?17:13,lineHeight:1.15,
                        border:tradePicks[i]?"2px solid var(--gold)":"2px dashed var(--border-dark)",
                        background:tradePicks[i]?"rgba(212,178,84,0.12)":"transparent",
                        color:tradePicks[i]?"var(--text)":"var(--text-muted)"}}>
                        {tradePicks[i]?<>
                          <span>{RES_ICO[tradePicks[i].res]}</span>
                          <span style={{fontSize:10,color:"var(--text-dim)",fontFamily:"var(--font-mono)"}}>#{tradePicks[i].hexId}</span>
                        </>:i+1}
                      </div>
                    ))}
                    <span style={{fontSize:13,color:"var(--text-dim)",flex:1}}>
                      {tradePicks.length===0?`${tradeSlots} ressources à placer`:tradePicks.length<tradeSlots?`Encore ${tradeSlots-tradePicks.length} à placer`:"Prêt — confirmez l'échange"}
                    </span>
                    {tradePicks.length>0&&<button onClick={()=>setTradePicks([])} className="act-btn" style={{fontSize:13,padding:"6px 10px",minHeight:36,opacity:0.8}}>↩</button>}
                  </div>
                  {tradePicks.length===tradeSlots&&(
                    <button onClick={doTradeConfirm} className="act-btn" style={{width:"100%",marginBottom:6,background:"#3a6a3a",color:"#fff",border:"none",fontWeight:700}}>
                      💰 Échanger : -1$ → {tradeLabel(tradePicks)}
                    </button>
                  )}
                  <button onClick={()=>{const gp=1+topUpgradeCount(me,"Trade","pop");setPlayers(prev=>{const n=[...prev];n[0]={...n[0],coins:n[0].coins-1,pop:Math.min(n[0].pop+gp,18)};return n;});addLog(`💰 -1$ → +${gp} Pop`);setTradePicks([]);endHumanTurn(myMat.topRow.indexOf("Trade"));}} className="act-btn" style={{width:"100%"}}>♥ +{1+topUpgradeCount(me,"Trade","pop")} Popularité (à la place)</button>
                </div>}
              </div>);})()}
              {(()=>{
                // Règle Scythe : l'action du HAUT est optionnelle — on peut
                // l'ignorer (ex. Produire impayable) et passer directement à
                // l'action du bas ; un Move entamé peut aussi se TERMINER
                // avant la limite d'unités (arrêt volontaire, parfois utile)
                const colIdx=myMat.topRow.indexOf(selAction);
                if(colIdx<0)return null;
                const moved=selAction==="Move"?(me.movedUnits||[]).length:0;
                const label=moved>0
                  ?`✓ Terminer le déplacement (${moved}/${moveLimit})`
                  :`⤵ Passer ${FR_TOP[selAction]||selAction} → ${FR_BOT[BOTTOM[colIdx]]||BOTTOM[colIdx]}`;
                return <button onClick={()=>{setTransportPick(null);endHumanTurn(colIdx);}} className="act-btn"
                  style={{marginTop:8,width:"100%",fontWeight:600,...(moved>0?{background:"#3a6a3a",color:"#fff",border:"none"}:{opacity:0.85})}}>{label}</button>;
              })()}
              <button onClick={()=>{if(preActionSnapshot){setPlayers(prev=>{const n=[...prev];n[0]=preActionSnapshot;return n;});}setSelAction(null);setMoveSource(null);setUnitPicker(null);setTransportPick(null);setRouteDrop(null);setPreActionSnapshot(null);setTradePicks([]);addLog("↩ Action annulée");}} style={{marginTop:8,padding:"8px 16px",fontSize:14,background:"transparent",border:`1px solid var(--border)`,color:"var(--text-muted)",borderRadius:5,cursor:"pointer"}}>← Annuler</button>
            </div>
          )}

          {/* Bottom-row action */}
          {isMyTurn&&!combat&&!encounter&&!rougeRiver&&pendingBottom&&(()=>{
            const ba=pendingBottom.action;const colIdx=BOTTOM.indexOf(ba);
            const costs=getBottomCost(me);const bc=costs[colIdx];
            const hasRes=bc?countRes(me,bc.res)>=bc.qty:false;const resCount=bc?countRes(me,bc.res):0;
            const workerHexes=getWorkerHexes(me);
            const maxed=ba==="Upgrade"?(me.upgrades||0)>=6:ba==="Deploy"?me.mechs.length>=4:ba==="Build"?(me.buildings||[]).length>=4:ba==="Enlist"?(me.recruits||0)>=4:false;
            const availBuildings=BUILDING_TYPES.filter(bt=>!(me.buildings||[]).some(b=>b.type===bt.type));
            const isLand=(h)=>{const hx=hMap[h];return hx&&hx.t!=="lac"&&hx.t!=="marecage";};
            // Plan « L'Onde Tesla » (build_no_worker) : un héros/mecha suffit pour construire
            const buildBase=me.factoryCard?.bottomBonus==="build_no_worker"
              ?[...new Set([...workerHexes,me.hero,...me.mechs.map(m=>m.hexId)])].filter(isLand)
              :workerHexes;
            const buildableHexes=buildBase.filter(h=>!(me.buildings||[]).some(b=>b.hexId===h));
            // Plan « Réseau Neuronal » (deploy_adjacency) : Deploy aussi sur les hex adjacents aux ouvriers
            const deployHexes=me.factoryCard?.bottomBonus==="deploy_adjacency"
              ?[...new Set(workerHexes.flatMap(h=>[h,...(ADJ[h]||[])]))].filter(isLand)
              :workerHexes;
            const mat=MATS.find(m=>m.id===me.matId);
            return(
              <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)",animation:"slideUp 0.25s ease"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <span style={{fontFamily:"var(--font-title)",color:"var(--brass)",fontSize:16,fontWeight:700}}>▼ {ba}</span>
                  {bc&&<span style={{fontSize:13,color:hasRes&&!maxed?"var(--text-dim)":"#8A3030"}}>{maxed?"Maximum":` ${bc.qty} ${bc.res} (${resCount} dispo)`}</span>}
                </div>
                {/* UPGRADE — 2-step: pick top source then bottom dest */}
                {ba==="Upgrade"&&!maxed&&(()=>{
                  if(!hasRes) return <div style={{fontSize:13,color:"var(--text-muted)",fontStyle:"italic"}}>Pas assez de {bc.res}</div>;
                  const validTops=[];const validBottoms=[];
                  if(mat){
                    (me.cubesOnTop||[]).forEach((c,ci)=>{if(c>0)validTops.push(ci);});
                    (mat.bottomSlots||[]).forEach((s,ci)=>{if((me.cubesOnBottom||[])[ci]<maxBottomCubes(mat,ci))validBottoms.push(ci);});
                  }
                  if(validTops.length===0||validBottoms.length===0) return <div style={{fontSize:13,color:"var(--text-muted)"}}>Plus de cubes disponibles</div>;
                  // Sélection directe SUR LES CARTES D'ACTION (au-dessus) : cube
                  // source en rangée haut, case de réduction en rangée bas —
                  // le panneau ne porte plus que le statut et la validation
                  const from=bottomPick?.upgradeFrom;const to=bottomPick?.upgradeTo;
                  const ready=from!=null&&to!=null;
                  return <div>
                    <div style={{fontSize:13,color:"var(--text-dim)",lineHeight:1.6,marginBottom:8}}>
                      Cliquez sur les cartes d'action ci-dessus :<br/>
                      <span style={{color:from!=null?"#8fbf6a":"#4caf50",fontWeight:600}}>① cube à retirer (rangée haut){from!=null?` — ${FR_TOP[me.topRow[from]]||me.topRow[from]} ✓`:""}</span><br/>
                      <span style={{color:to!=null?"#8fbf6a":"var(--brass)",fontWeight:600}}>② coût à réduire (rangée bas){to!=null?` — ${FR_BOT[BOTTOM[to]]||BOTTOM[to]} ✓ (+${mat.bottomCosts[to].bonus||0}$)`:""}</span>
                    </div>
                    <button disabled={!ready} onClick={()=>{doUpgrade(from,to);setBottomPick(null);}} className="act-btn"
                      style={{width:"100%",fontWeight:700,...(ready?{background:"#3a6a3a",color:"#fff",border:"none"}:{opacity:0.45,cursor:"not-allowed"})}}>
                      ✓ Valider l'amélioration
                    </button>
                    {(from!=null||to!=null)&&<button onClick={()=>setBottomPick(null)} className="act-btn" style={{marginTop:6,fontSize:13,opacity:0.7,minHeight:34,width:"100%"}}>↩ Réinitialiser la sélection</button>}
                  </div>;
                })()}
                {ba==="Deploy"&&!maxed&&(()=>{
                  const deployAlt=FACTIONS[me.faction]?.deployAltRes;
                  const metalCount=countRes(me,"metal");const boisCount=countRes(me,"bois");
                  const qty=bc.qty;
                  const hasMetal=metalCount>=qty;const hasBois=boisCount>=qty;
                  if(!deployAlt) return hasMetal?<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{deployHexes.map(hid=><button key={hid} onClick={()=>doDeploy(hid)} className="act-btn"><Glyph icon="⬡" size={14}/> #{hid}</button>)}</div>:<div style={{fontSize:13,color:"var(--text-muted)"}}>Pas assez de {bc.res}</div>;
                  // Nations: Esprit Sauvage — choose metal or bois
                  if(!hasMetal&&!hasBois) return <div style={{fontSize:13,color:"var(--text-muted)"}}>Pas assez de métal ni de bois</div>;
                  if(!bottomPick||!bottomPick.deployRes) return <div>
                    <div style={{fontSize:12,color:"var(--brass)",marginBottom:6}}>🌿 {FACTIONS[me.faction].deployAltName||FACTIONS[me.faction].ability} — déployer avec :</div>
                    <div style={{display:"flex",gap:6}}>
                      {hasMetal&&<button onClick={()=>setBottomPick({deployRes:"metal"})} className="act-btn" style={{flex:1}}>⚙ Métal ({metalCount})</button>}
                      {hasBois&&<button onClick={()=>setBottomPick({deployRes:"bois"})} className="act-btn" style={{flex:1,borderColor:"#5a8a3a"}}>🪵 Bois ({boisCount})</button>}
                    </div>
                  </div>;
                  return <div>
                    <div style={{fontSize:12,color:"var(--brass)",marginBottom:4}}>Deploy avec {bottomPick.deployRes} :</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{deployHexes.map(hid=><button key={hid} onClick={()=>doDeploy(hid,bottomPick.deployRes)} className="act-btn"><Glyph icon="⬡" size={14}/> #{hid}</button>)}</div>
                    <button onClick={()=>setBottomPick(null)} className="act-btn" style={{marginTop:6,fontSize:14,opacity:0.7,minHeight:36}}>← Autre ressource</button>
                  </div>;
                })()}
                {ba==="Build"&&!maxed&&(hasRes&&buildableHexes.length>0&&availBuildings.length>0?<div>{!bottomPick||bottomPick.packUp?<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{availBuildings.map(bt=><button key={bt.type} onClick={()=>setBottomPick({building:bt})} className="act-btn">{bt.icon} {bt.name}</button>)}</div>:<div><div style={{fontSize:13,marginBottom:6}}>Placer {bottomPick.building.icon} sur :</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{buildableHexes.map(hid=><button key={hid} onClick={()=>doBuild(hid,bottomPick.building.type)} className="act-btn">#{hid}</button>)}</div><button onClick={()=>setBottomPick(null)} className="act-btn" style={{marginTop:6,fontSize:14,opacity:0.7,minHeight:36}}>← Autre</button></div>}</div>:<div style={{fontSize:13,color:"var(--text-muted)"}}>Insuffisant</div>)}
                {ba==="Enlist"&&!maxed&&(hasRes?(()=>{
                  // Étape 1 : choisir la SECTION (→ bonus immédiat de la colonne)
                  // Étape 2 : choisir la RECRUE permanente à y poser (décorrélée)
                  if(!bottomPick||bottomPick.enlistCol==null){
                    return <div>
                      <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:6}}>Recrue {(me.recruits||0)+1}/4 — ① Section (bonus immédiat) :</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>
                        {BOTTOM.map((bName,ci)=>{
                          const assigned=(me.enlistMap||[])[ci]!=null;
                          return <button key={ci} onClick={()=>setBottomPick({enlistCol:ci})} className="act-btn" disabled={assigned} style={{textAlign:"center",opacity:assigned?0.3:1,cursor:assigned?"not-allowed":"pointer"}}>
                            <div style={{fontWeight:700,fontSize:14}}>{bName}</div>
                            <div style={{fontSize:13,color:"var(--gold)",marginTop:2}}>Immédiat {ENLIST_BONUSES[ci].icon} {ENLIST_BONUSES[ci].label}</div>
                            {assigned&&<div style={{fontSize:12,color:"#8fd0b0",marginTop:1}}>🤝 {ENLIST_ONGOING[(me.enlistMap||[])[ci]].icon} posée</div>}
                          </button>;
                        })}
                      </div>
                    </div>;
                  }
                  const col=bottomPick.enlistCol;
                  return <div>
                    <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:6}}>Section <b style={{color:"var(--brass)"}}>{BOTTOM[col]}</b> (immédiat {ENLIST_BONUSES[col].icon} {ENLIST_BONUSES[col].label}) — ② Recrue permanente à poser :</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>
                      {ENLIST_ONGOING.map((rec,ri)=>{
                        const used=(me.enlistMap||[]).includes(ri);
                        return <button key={ri} onClick={()=>{doEnlist(col,ri);setBottomPick(null);}} className="act-btn" disabled={used} style={{textAlign:"center",opacity:used?0.3:1,cursor:used?"not-allowed":"pointer",borderColor:used?"var(--border)":"#5a9a7a"}}>
                          <div style={{fontWeight:700,fontSize:15}}>{rec.icon} {rec.label}</div>
                          <div style={{fontSize:12,color:"#8fd0b0",marginTop:1}}>à chaque {BOTTOM[col]} (vous/voisins)</div>
                          {used&&<div style={{fontSize:12,color:"#8A3030"}}>déjà posée</div>}
                        </button>;
                      })}
                    </div>
                    <button onClick={()=>setBottomPick(null)} className="act-btn" style={{marginTop:6,fontSize:14,opacity:0.7,minHeight:36}}>← Autre section</button>
                  </div>;
                })():<div style={{fontSize:13,color:"var(--text-muted)"}}>Pas assez de {bc.res}</div>)}
                {maxed&&<div style={{fontSize:14,color:"var(--success)"}}>{ba} au maximum</div>}
                <button onClick={requestEndTurn} className="act-btn" style={{marginTop:8,width:"100%",background:"var(--bg)",textAlign:"center",color:"var(--text-muted)"}}>Passer →</button>
              </div>
            );
          })()}

          {/* ═══ FIN DU TOUR (façon Scythe Digital Edition) : étape de validation
              avant de passer aux bots — c'est ICI que se révèlent les objectifs
              (mission secrète / objectif de faction), et révéler termine le tour ═══ */}
          {isMyTurn&&!combat&&!encounter&&!rougeRiver&&endOfTurn&&(()=>{
            const revealables=(!me.objectiveRevealed?(me.objectives||[]).map((o,idx)=>({o,idx})).filter(({o})=>o.check(me)):[]);
            const fObjReady=!me.fObjRevealed&&myFaction.fObj&&myFaction.fObj.check(me);
            return(
              <div style={{padding:"12px 16px",borderTop:"1px solid var(--gold-dim)",animation:"slideUp 0.25s ease",background:"rgba(212,178,84,0.05)"}}>
                <div style={{fontFamily:"var(--font-title)",color:"var(--gold)",fontSize:17,fontWeight:800,marginBottom:6}}>🏁 Fin du tour {turn}</div>
                {(revealables.length>0||fObjReady)&&<div style={{marginBottom:8}}>
                  <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:6}}>Objectif accompli — le révéler pose l'étoile et termine le tour :</div>
                  {revealables.map(({o,idx})=>(
                    <button key={o.id||idx} onClick={()=>{revealObjective(idx);actuallyEndTurn();}} className="act-btn"
                      style={{width:"100%",marginBottom:6,textAlign:"left",borderColor:"var(--gold)",background:"rgba(212,178,84,0.10)"}}>
                      <div style={{fontWeight:700,color:"var(--gold)",fontSize:14}}>🎯 Révéler « {o.name} » ⭐</div>
                      <div style={{fontSize:12,color:"var(--text-dim)"}}>{o.desc}</div>
                    </button>
                  ))}
                  {fObjReady&&(
                    <button onClick={()=>{revealFObj();actuallyEndTurn();}} className="act-btn"
                      style={{width:"100%",marginBottom:6,textAlign:"left",borderColor:"var(--gold)",background:"rgba(212,178,84,0.10)"}}>
                      <div style={{fontWeight:700,color:"var(--gold)",fontSize:14}}>🏛 Révéler « {myFaction.fObj.name} » ⭐</div>
                      <div style={{fontSize:12,color:"var(--text-dim)"}}>{myFaction.fObj.desc} — révéler est un choix : garder l'étoile cachée peut conclure au meilleur moment.</div>
                    </button>
                  )}
                </div>}
                <button onClick={actuallyEndTurn} className="act-btn"
                  style={{width:"100%",fontWeight:800,fontSize:15,background:"#3a6a3a",color:"#fff",border:"none",padding:"10px"}}>
                  ✔ Terminer le tour
                </button>
              </div>
            );
          })()}

          {/* Objectives — now controlled by showObjectives dropdown toggle */}

          {/* Commerce Impérial — Dominion free action 1×/tour */}
          {me.faction==="dominion"&&isMyTurn&&!combat&&!encounter&&!rougeRiver&&!me.commerceUsed&&(()=>{
            const resTypes=["metal","bois","nourriture","petrole"];
            const available=resTypes.filter(r=>countRes(me,r)>=1);
            if(available.length===0) return null;
            return(
              <div style={{padding:"8px 16px",borderTop:"1px solid #882020",fontSize:14,background:"rgba(200,30,30,0.04)"}}>
                <div style={{color:"#cc3030",fontWeight:600,marginBottom:6,fontSize:14}}>🏛 Commerce Impérial (1×/tour) — envoyer 1 ressource :</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {available.map(r=><div key={r} style={{display:"flex",gap:4}}>
                    <button onClick={()=>doCommerceImperial(r,"coins")} className="act-btn" style={{fontSize:14,padding:"8px 12px",borderColor:"#882020"}}>-1{r.slice(0,3)} →1💰</button>
                    <button onClick={()=>doCommerceImperial(r,"cards")} className="act-btn" style={{fontSize:14,padding:"8px 12px",borderColor:"#882020"}}>-1{r.slice(0,3)} →1🃏</button>
                  </div>)}
                </div>
              </div>
            );
          })()}
          {me.faction==="dominion"&&me.commerceUsed&&isMyTurn&&!combat&&!selAction&&!pendingBottom&&(
            <div style={{padding:"6px 16px",borderTop:"1px solid var(--border)",fontSize:14,color:"var(--text-dim)"}}>🏛 Commerce Impérial utilisé ce tour</div>
          )}
          {/* Import Impérial — Dominion : 2$ → 1 ressource (1×/tour) */}
          {me.faction==="dominion"&&isMyTurn&&!combat&&!encounter&&!rougeRiver&&!me.importUsed&&me.coins>=2&&BALANCE.imperialImport&&(
            <div style={{padding:"8px 16px",borderTop:"1px solid #882020",fontSize:14,background:"rgba(200,30,30,0.04)"}}>
              <div style={{color:"#cc3030",fontWeight:600,marginBottom:6,fontSize:14}}>🏛 Import Impérial (1×/tour) — acheter 1 ressource pour 2💰 :</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["metal","bois","nourriture","petrole"].map(r=>(
                  <button key={r} onClick={()=>doImportImperial(r)} className="act-btn" style={{fontSize:14,padding:"8px 12px",borderColor:"#882020"}}>-2💰 →1 {r}</button>
                ))}
              </div>
            </div>
          )}

          {/* Plan « Five Dollar Day » — action libre 1×/tour */}
          {me.factoryCard?.topBonus==="pop_worker"&&isMyTurn&&!combat&&!encounter&&!rougeRiver&&!me.planTopUsed&&me.coins>=2&&(
            <div style={{padding:"8px 16px",borderTop:"1px solid #3a5a7a",fontSize:14,background:"rgba(58,106,154,0.05)"}}>
              <div style={{color:"#8aa0b8",fontWeight:600,marginBottom:6}}>⚙ Five Dollar Day (1×/tour)</div>
              <button onClick={doPlanPopWorker} className="act-btn" style={{width:"100%",borderColor:"#4a5a6a"}}>-2💰 → +2♥ Pop{me.workers.length<8?" + 1👷 ouvrier (sur le héros)":""}</button>
            </div>
          )}

          {/* Rail placement mode indicator */}
          {railPlacement&&(
            <div style={{padding:"8px 16px",borderTop:"1px solid #6a5030",background:"rgba(100,80,48,0.08)",fontSize:14}}>
              <div style={{color:"#a08050",fontWeight:700,marginBottom:4}}>🚂 Pose de rails ({railPlacement.remaining}/3 restants)</div>
              {railPlacement.fromHex===null?
                <div style={{color:"var(--text-dim)",fontSize:13}}>Cliquez un hex de départ : la Gare (#{railPlacement.gareHex}) ou un rail existant</div>:
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:"#C9A84C",fontSize:13}}>Depuis #{railPlacement.fromHex} → cliquez un hex adjacent</span>
                  <button onClick={()=>setRailPlacement(prev=>({...prev,fromHex:null}))} className="act-btn" style={{fontSize:12,padding:"4px 10px"}}>Annuler</button>
                </div>
              }
              <button onClick={()=>{setRailPlacement(null);addLog(`⏭ Rails passés (${railPlacement.remaining} non posés)`);finishBottom(2);}} className="act-btn" style={{marginTop:6,width:"100%",background:"var(--bg)",textAlign:"center",color:"var(--text-muted)",fontSize:13}}>Terminer sans poser les rails restants</button>
            </div>
          )}

          {/* Hex info */}
          {selHexData&&!selAction&&(
            <div style={{padding:"6px 16px",fontSize:14,color:"var(--text-dim)",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
              {selHexData.base ? (<>
                <span style={{fontSize:18}}>🏳</span>
                <span style={{fontWeight:600,color:FACTIONS[selHexData.faction]?.color||"var(--text)"}}>Base — {FACTIONS[selHexData.faction]?.name}</span>
                <span style={{color:"var(--text-muted)"}}>#{selHexData.id}</span>
              </>) : (<>
                <span style={{fontSize:18}}>{TERRAINS[selHexData.t].icon}</span>
                <span style={{fontWeight:600,color:TERRAINS[selHexData.t].color}}>{TERRAINS[selHexData.t].label}</span>
                <span style={{color:"var(--text-muted)"}}>#{selHexData.id}</span>
                {TERRAINS[selHexData.t].res&&<span style={{color:"var(--brass)",fontSize:13}}>→ {TERRAINS[selHexData.t].res}</span>}
              </>)}
            </div>
          )}

        </div>

        {/* Étoiles + objectifs : désormais dans la rangée d'icônes de la barre du
            haut → clic ouvre le panneau détail (voir plus bas). */}

        {/* ── Dropdown: Journal enrichi ── */}
        <div style={{borderTop:"1px solid var(--border)",flexShrink:0,marginTop:"auto"}}>
          <button onClick={()=>setShowLog(s=>!s)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",background:"rgba(200,112,64,0.04)",border:"none",color:"var(--rust)",fontSize:14,fontWeight:700,fontFamily:"var(--font-title)",cursor:"pointer"}}>
            <span>📜 Journal ({log.length})</span>
            <span style={{fontSize:10,color:"var(--text-dim)",transform:showLog?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▼</span>
          </button>
          {showLog&&<>
            {/* Filter bar + copy */}
            <div style={{display:"flex",gap:2,padding:"3px 6px",flexWrap:"wrap",alignItems:"center",borderBottom:"1px solid var(--border)"}}>
              {[["all","Tout"],["combat","⚔"],["move","🚶"],["bot","🤖"],["resource","💰"],["deploy","⬡"],["encounter","📜"],["warn","⚠"],["star","⭐"],["note","📝"],["snap","🔍"]].map(([k,label])=>(
                <button key={k} onClick={()=>setLogFilter(k)} style={{
                  padding:"2px 7px",fontSize:12,borderRadius:3,cursor:"pointer",
                  background:logFilter===k?"var(--rust)":"transparent",
                  color:logFilter===k?"#fff":"var(--text-muted)",
                  border:logFilter===k?"1px solid var(--rust)":"1px solid transparent",
                }}>{label}</button>
              ))}
              <button onClick={()=>{
                const txt=log.map(e=>`[T${e.turn}#${e.step}] ${e.msg}`).join("\n");
                navigator.clipboard.writeText(txt);
              }} style={{marginLeft:"auto",padding:"1px 5px",fontSize:10,borderRadius:3,cursor:"pointer",background:"transparent",color:"var(--text-muted)",border:"1px solid var(--border)"}} title="Copier tout le log">📋</button>
            </div>
            {/* ── Note manuelle : annoter la partie EN JEU (📝, horodatée au tour
                courant, exportée avec le journal — demande de partie réelle) ── */}
            <div style={{display:"flex",gap:4,padding:"4px 6px",borderBottom:"1px solid var(--border)",alignItems:"center"}}>
              <input value={noteInput} onChange={e=>setNoteInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&noteInput.trim()){addLog(`📝 ${noteInput.trim()}`);setNoteInput("");}}}
                placeholder="📝 Noter une observation (Entrée pour ajouter)…"
                style={{flex:1,minWidth:0,padding:"5px 8px",fontSize:13,borderRadius:4,background:"rgba(0,0,0,0.3)",
                  border:"1px solid var(--border)",color:"var(--text)",outline:"none"}}/>
              <button onClick={()=>{if(noteInput.trim()){addLog(`📝 ${noteInput.trim()}`);setNoteInput("");}}}
                disabled={!noteInput.trim()}
                style={{padding:"5px 10px",fontSize:13,borderRadius:4,cursor:noteInput.trim()?"pointer":"default",
                  background:noteInput.trim()?"var(--gold)":"rgba(255,255,255,0.04)",color:noteInput.trim()?"var(--bg)":"var(--text-ghost)",
                  border:"none",fontWeight:700}}>+</button>
            </div>
            <div ref={logRef} style={{maxHeight:200,overflow:"auto",padding:"6px 8px",fontSize:13,lineHeight:1.55}}>
              {(()=>{
                const CAT_COLORS={combat:"#e04838",bot:"#a89878",star:"#d4b254",warn:"#e08850",encounter:"#b08060",rr:"#c87040",move:"#5a9aca",deploy:"#7aaa55",build:"#7aaa55",enlist:"#5a7a6a",upgrade:"#c4a060",resource:"#d4b254",ability:"#e08850",turn:"var(--rust)",info:"var(--text-dim)",note:"#e8dcc8",snap:"#8a9ab0"};
                const filtered=logFilter==="all"?log:log.filter(e=>e.cat===logFilter);
                return filtered.slice(-60).map((e,i)=>(
                  <div key={i} className="log-line" style={{display:"flex",gap:6,alignItems:"baseline",
                    ...(e.cat==="note"?{background:"rgba(212,178,84,0.07)",borderLeft:"2px solid var(--gold-dim)",paddingLeft:4,borderRadius:2}:{})}}>
                    <span style={{fontSize:10,color:"var(--text-muted)",fontFamily:"var(--font-mono)",flexShrink:0,minWidth:36,textAlign:"right"}}>T{e.turn}.{e.step}</span>
                    <span style={{color:CAT_COLORS[e.cat]||"var(--text-dim)",fontWeight:e.cat==="turn"||e.cat==="star"?700:e.cat==="note"?600:400,fontStyle:e.cat==="note"?"italic":"normal"}}>{e.msg}</span>
                  </div>
                ));
              })()}
            </div>
          </>}
        </div>
      </div>

      {/* ═══ BOTTOM: POWER TRACK (horizontale, pleine largeur) — l'éclair (couleur
            faction) marque la position, chiffre dessus ; chiffres grisés sur les
            cases vides ; palier 7 = maximum engageable dans un combat ; étoile de
            fin de piste à 16. Un point de couleur par adversaire marque sa position. ═══ */}
      <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:10,padding:"5px 16px",height:36,background:"linear-gradient(0deg,#241d12,#171209)",borderTop:"1px solid var(--panel-edge)",boxShadow:"inset 0 1px 0 rgba(216,201,163,0.06)",flexShrink:0}}>
        <div style={{fontSize:10,color:"var(--rust)",letterSpacing:1,textTransform:"uppercase",fontFamily:"var(--font-title)",fontWeight:700,flexShrink:0}}>Puissance</div>
        <div style={{flex:1,display:"flex",gap:2,height:22,position:"relative"}}>
          {Array.from({length:17},(_,v)=>v).map(v=>{
            const opponentsHere=players.slice(1).filter(op=>op.power===v);
            const isCur=v===me.power;
            const isCombatCap=v===7; // palier : maximum de puissance engageable dans un combat
            return(
              <div key={v} title={isCombatCap?"7 — maximum de puissance engageable dans un combat":v===16?"16 — étoile Puissance max":`Puissance ${v}`} style={{
                flex:1,minWidth:0,borderRadius:2,position:"relative",
                background:v<=me.power?"rgba(187,56,56,0.16)":"rgba(255,255,255,0.03)",
                border:isCombatCap?"1px solid var(--rust)":"1px solid rgba(255,255,255,0.05)",
                borderRight:isCombatCap?"2px solid var(--rust)":undefined,
                display:"flex",alignItems:"center",justifyContent:"center",gap:3,
              }}>
                {!isCur&&<span style={{fontSize:10,fontWeight:isCombatCap?800:600,fontFamily:"var(--font-mono)",color:isCombatCap?"var(--rust)":"var(--text-ghost)"}}>{v}</span>}
                {isCombatCap&&!isCur&&<span style={{fontSize:9,opacity:0.75}}>⚔</span>}
                {v===16&&<span style={{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",display:"flex"}}><TrackStar size={12} earned={me.power>=16}/></span>}
                {isCur&&<div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",zIndex:2}}><BoltMarker color={myFaction.color} value={v}/></div>}
                {opponentsHere.length>0&&(
                  <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",display:"flex",gap:2,zIndex:3}}>
                    {opponentsHere.map(op=>(
                      <div key={op.faction} title={`${FACTIONS[op.faction].name} : ${op.power}⚡`} style={{width:7,height:7,borderRadius:"50%",background:FACTIONS[op.faction].color,border:"1px solid rgba(6,5,3,0.9)"}}/>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{fontSize:17,fontWeight:700,color:"var(--rust-light)",fontFamily:"var(--font-title)",flexShrink:0,minWidth:20,textAlign:"right"}}>{me.power}</div>
      </div>

      {/* ═══ PANNEAU DÉTAIL D'ÉTOILE (façon Steam) — clic sur une icône de la barre ═══ */}
      {starDetail&&(()=>{
        const s=starList.find(x=>x.key===starDetail);if(!s)return null;
        return(
          <div style={{position:"fixed",top:"calc(var(--top-h) + 8px)",right:"calc(var(--right-w) + 8px)",width:340,maxHeight:"calc(100vh - var(--top-h) - 24px)",overflowY:"auto",zIndex:45,
            background:"linear-gradient(180deg,#211a10,#14100a)",border:"1px solid var(--gold-dim)",borderRadius:12,boxShadow:"0 10px 40px rgba(0,0,0,0.7)",animation:"slideUp 0.2s ease"}}>
            {/* En-tête */}
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid var(--border)",position:"relative"}}>
              <div style={{position:"relative",width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,background:s.done?"rgba(232,200,96,0.14)":"rgba(255,255,255,0.03)",border:`1px solid ${s.done?"var(--gold)":"var(--border)"}`}}>
                <span style={{fontSize:25,opacity:s.done?0.5:0.7,display:"inline-flex"}}><Glyph icon={s.icon} size={24} color="#e8dcc8"/></span>
                {s.done&&<span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>⭐</span>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"var(--font-title)",fontSize:18,fontWeight:800,color:s.done?"var(--gold)":"var(--text)"}}>{s.name}</div>
                <div style={{fontSize:15,color:s.done?"#8fbf6a":"var(--gold)",fontWeight:700,marginTop:2}}>{s.done?"⭐ Étoile obtenue":`Progression ${s.prog}`}</div>
              </div>
              <button onClick={()=>setStarDetail(null)} style={{position:"absolute",top:10,right:10,width:26,height:26,borderRadius:6,background:"rgba(0,0,0,0.4)",border:"1px solid var(--border)",color:"var(--text-dim)",fontSize:16,cursor:"pointer"}}>✕</button>
            </div>
            {/* Ce que ça demande */}
            <div style={{padding:"12px 16px",fontSize:15,color:"var(--text-dim)",lineHeight:1.6,borderBottom:"1px solid var(--border)"}}>{s.need}</div>
            {/* Contenu spécifique */}
            <div style={{padding:"12px 16px"}}>
              {starDetail==="build"&&(<div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--brass)",marginBottom:8,fontFamily:"var(--font-title)"}}>Vos bâtiments & bonus</div>
                {BUILDING_TYPES.map(bt=>{const built=(me.buildings||[]).find(b=>b.type===bt.type);return(
                  <div key={bt.type} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 8px",borderRadius:6,marginBottom:5,background:built?"rgba(122,170,85,0.12)":"rgba(0,0,0,0.25)",border:built?"1px solid rgba(122,170,85,0.4)":"1px dashed var(--border-dark)"}}>
                    <span style={{fontSize:23,filter:built?"none":"grayscale(1)",opacity:built?1:0.5}}>{bt.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:700,color:built?"#8fbf6a":"var(--text-dim)"}}>{bt.name}{built?` (#${built.hexId})`:""}</div>
                      <div style={{fontSize:14,color:"var(--text-dim)"}}>{bt.effect}</div>
                    </div>
                    <span style={{fontSize:14,color:built?"#8fbf6a":"var(--text-muted)",fontWeight:700}}>{built?"✓ posé":"à poser"}</span>
                  </div>
                );})}
                {structureBonus&&<div style={{marginTop:8,padding:"8px 10px",borderRadius:6,background:"rgba(212,178,84,0.07)",border:"1px solid var(--gold-dim)",fontSize:14,color:"var(--gold)"}}>
                  🏦 Bonus de pose : <b>{structureBonus.icon} {structureBonus.name}</b> — +{structureBonus.coins}$ {structureBonus.desc} (tuiles marquées $ sur la carte).
                </div>}
                {/* Règle de scoring liée au PLACEMENT des bâtiments — toujours
                    lisible ici (demande de jeu réel : introuvable en partie) */}
                <div style={{marginTop:8,padding:"8px 10px",borderRadius:6,background:"rgba(0,0,0,0.25)",border:"1px solid var(--border)",fontSize:14,color:"var(--text-dim)",lineHeight:1.55}}>
                  <div style={{fontWeight:700,color:"var(--brass)",marginBottom:4,fontFamily:"var(--font-title)"}}>🗺 Scoring du placement</div>
                  Chaque bâtiment <b>contrôle son hex</b> jusqu'à la fin de partie, même sans unité dessus (sauf si un ennemi occupe l'hex) : il compte comme <b>territoire</b> au score final — ×{[2,3,4][me.pop<=6?0:me.pop<=12?1:2]}$ à votre palier de popularité actuel (×2$ / ×3$ / ×4$ selon le palier).
                  Placez-les sur des hexes que vos unités ne tiendront pas : production excentrée, carrefours, abords de l'Usine.
                  {!structureBonus&&<div style={{marginTop:4,color:"var(--text-muted)"}}>🏦 Pas de tuile « bonus de pose » dans la partie de base (réservée au mode campagne).</div>}
                </div>
              </div>)}
              {starDetail==="mech"&&(<div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--brass)",marginBottom:8,fontFamily:"var(--font-title)"}}>Mechas & capacités</div>
                <div style={{fontSize:14,color:"var(--text-dim)",marginBottom:8}}>Déployés : {me.mechs.length}/4 {me.mechs.length>0&&`(hex ${me.mechs.map(m=>`#${m.hexId}`).join(", ")})`} · Chaque déploiement débloque UNE capacité au choix :</div>
                {myMechAbilities.map((ab,idx)=>{const unlocked=(me.unlockedAbilities||[]).includes(idx);return(
                  <div key={idx} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 8px",borderRadius:6,marginBottom:5,background:unlocked?"rgba(200,112,64,0.1)":"rgba(0,0,0,0.25)",border:unlocked?"1px solid var(--rust-dark)":"1px dashed var(--border-dark)",opacity:unlocked?1:0.75}}>
                    <span style={{fontSize:23,opacity:unlocked?1:0.5}}>{ab.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:700,color:unlocked?"var(--rust)":"var(--text-dim)"}}>{ab.name}</div>
                      <div style={{fontSize:14,color:"var(--text-dim)"}}>{ab.desc}</div>
                    </div>
                    <span style={{fontSize:14,color:unlocked?"#8fbf6a":"var(--text-muted)",fontWeight:700}}>{unlocked?"✓":"—"}</span>
                  </div>
                );})}
              </div>)}
              {starDetail==="recr"&&(<div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--brass)",marginBottom:8,fontFamily:"var(--font-title)"}}>Recrues posées (immédiat / permanent)</div>
                {BOTTOM.map((bName,ci)=>{const rec=(me.enlistMap||[])[ci];const placed=rec!=null;return(
                  <div key={ci} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 8px",borderRadius:6,marginBottom:5,background:placed?"rgba(90,122,106,0.15)":"rgba(0,0,0,0.25)",border:placed?"1px solid #5a9a7a":"1px dashed var(--border-dark)"}}>
                    <span style={{fontSize:18,fontWeight:700,color:"var(--text-dim)",minWidth:52}}>{bName}</span>
                    <div style={{flex:1,fontSize:14}}>
                      <div style={{color:"var(--gold)"}}>Immédiat {ENLIST_BONUSES[ci].icon} {ENLIST_BONUSES[ci].label}</div>
                      <div style={{color:placed?"#8fd0b0":"var(--text-muted)"}}>Permanent {placed?`${ENLIST_ONGOING[rec].icon} ${ENLIST_ONGOING[rec].label}`:"— libre —"}</div>
                    </div>
                    <span style={{fontSize:14,color:placed?"#8fd0b0":"var(--text-muted)",fontWeight:700}}>{placed?"🤝":"—"}</span>
                  </div>
                );})}
              </div>)}
              {starDetail==="obj"&&me.objectives&&(<div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--brass)",marginBottom:6,fontFamily:"var(--font-title)"}}>Vos missions secrètes</div>
                <div style={{fontSize:14,color:"var(--text-dim)",marginBottom:8}}>{me.objectiveRevealed?"1 mission révélée (⭐ obtenue).":"Révélez-en une dès que sa condition est remplie."}</div>
                {me.objectives.map((obj,idx)=>{const isRev=me.objectiveRevealed&&me.revealedObjectiveIdx===idx;const canRev=!me.objectiveRevealed&&obj.check(me);const met=obj.check(me);return(
                  <div key={obj.id||idx} style={{padding:"8px 10px",borderRadius:6,marginBottom:6,background:isRev?"rgba(122,170,85,0.12)":"rgba(0,0,0,0.25)",border:`1px solid ${isRev?"rgba(122,170,85,0.4)":met?"var(--gold-dim)":"var(--border)"}`,opacity:me.objectiveRevealed&&!isRev?0.45:1}}>
                    <div style={{fontSize:15,fontWeight:700,color:isRev?"#8fbf6a":met?"var(--gold)":"var(--text)"}}>{isRev?"✅":"🎯"} {obj.name}</div>
                    <div style={{fontSize:14,color:"var(--text-dim)",marginTop:2}}>{obj.desc}</div>
                    {/* Règle Scythe DE : la révélation se fait à l'étape FIN DU TOUR */}
                    {!me.objectiveRevealed&&isMyTurn&&!combat&&!encounter&&!rougeRiver&&(canRev
                      ?(endOfTurn
                        ?<button onClick={()=>{revealObjective(idx);actuallyEndTurn();setStarDetail(null);}} style={{marginTop:6,padding:"8px 14px",fontSize:14,background:"var(--gold)",color:"var(--bg)",border:"none",borderRadius:4,fontWeight:700,cursor:"pointer"}}>Révéler ⭐ (termine le tour)</button>
                        :<div style={{marginTop:4,fontSize:13,color:"var(--gold)",fontWeight:600}}>✔ Condition remplie — révélable à la fin du tour</div>)
                      :<div style={{marginTop:4,fontSize:13,color:"var(--text-muted)"}}>{met?"":"Condition non remplie"}</div>)}
                  </div>
                );})}
              </div>)}
              {starDetail==="fobj"&&myFaction.fObj&&(()=>{
                const met=myFaction.fObj.check(me);
                return(<div>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--brass)",marginBottom:6,fontFamily:"var(--font-title)"}}>{myFaction.fObj.name}</div>
                  <div style={{fontSize:14,color:"var(--text-dim)",marginBottom:8}}>{myFaction.fObj.desc}</div>
                  {me.fObjRevealed
                    ?<div style={{color:"#8fbf6a",fontWeight:700,fontSize:14}}>✅ Révélé (⭐ obtenue)</div>
                    :met&&isMyTurn&&!combat&&!encounter&&!rougeRiver&&endOfTurn
                      ?<>
                        <button onClick={()=>{revealFObj();actuallyEndTurn();setStarDetail(null);}} style={{padding:"8px 14px",fontSize:14,background:"var(--gold)",color:"var(--bg)",border:"none",borderRadius:4,fontWeight:700,cursor:"pointer"}}>Révéler ⭐ (termine le tour)</button>
                        <div style={{fontSize:12,color:"var(--text-muted)",marginTop:6}}>Révéler est un choix — vous pouvez garder cette étoile cachée et conclure au bon moment.</div>
                      </>
                      :<div style={{fontSize:13,color:met?"var(--gold)":"var(--text-muted)"}}>{met?"✔ Condition remplie — révélable à la fin du tour":"Condition non remplie"}</div>}
                </div>);
              })()}
              {/* Barre de progression générique pour les compteurs */}
              {["upg","recr","cbt1","cbt2","wrk","pop","pow"].includes(starDetail)&&(()=>{
                const parts=s.prog.split("/");const cur=+parts[0],max=+parts[1]||1;
                return<div style={{marginTop:4}}>
                  <div style={{height:10,borderRadius:5,background:"rgba(0,0,0,0.4)",overflow:"hidden",border:"1px solid var(--border)"}}>
                    <div style={{height:"100%",width:`${Math.min(100,cur/max*100)}%`,background:s.done?"linear-gradient(90deg,#7aaa55,#9fd070)":"linear-gradient(90deg,var(--gold-dim),var(--gold))",transition:"width 0.3s"}}/>
                  </div>
                  <div style={{textAlign:"center",fontSize:15,fontWeight:700,color:"var(--gold)",marginTop:5}}>{s.prog}</div>
                </div>;
              })()}
            </div>
          </div>
        );
      })()}

      {/* ═══ MAIN DE CARTES DE COMBAT (clic sur le compteur 🃏) ═══ */}
      {showCards&&(()=>{
        const summ=handSummary(me);const vals=Object.keys(summ).map(Number).sort((a,b)=>b-a);
        return<div style={{position:"fixed",top:"calc(var(--top-h) + 6px)",left:200,zIndex:60,background:"linear-gradient(180deg,#211a10,#14100a)",border:"1px solid var(--gold-dim)",borderRadius:12,padding:"14px 16px",boxShadow:"0 8px 30px rgba(0,0,0,0.7)",minWidth:200,animation:"slideUp 0.15s ease"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--gold)",fontFamily:"var(--font-title)"}}>🃏 Main de combat ({me.combatCards})</div>
            <button onClick={()=>setShowCards(false)} style={{width:22,height:22,borderRadius:5,background:"rgba(0,0,0,0.4)",border:"1px solid var(--border)",color:"var(--text-dim)",fontSize:14,cursor:"pointer"}}>✕</button>
          </div>
          {vals.length===0?<div style={{fontSize:14,color:"var(--text-dim)"}}>Aucune carte</div>:
            <div style={{display:"flex",flexDirection:"column",gap:6}}>{vals.map(v=>(
              <div key={v} style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{width:30,height:40,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,fontFamily:"var(--font-mono)",background:"var(--bg3)",border:"1px solid var(--border-light)",color:"#c0b0d8"}}>{v}</span>
                <span style={{fontSize:16,color:"var(--text-dim)"}}>× {summ[v]}</span>
                <span style={{fontSize:13,color:"var(--text-muted)",marginLeft:"auto"}}>= {v*summ[v]} pts</span>
              </div>
            ))}</div>}
          <div style={{fontSize:13,color:"var(--text-muted)",marginTop:10,lineHeight:1.5,maxWidth:220}}>En combat, chaque carte engagée ajoute <b>sa valeur</b> au total (les plus fortes jouées en premier).</div>
        </div>;
      })()}

      {/* ═══ FLOATERS — animations de gain (pièces/cœurs/puissance qui pop) ═══ */}
      {floaters.length>0&&(
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:50}}>
          {floaters.map(f=>(
            <div key={f.id} className="floater" style={{
              position:"absolute",left:f.x,top:f.y,transform:"translate(-50%,-50%)",
              fontSize:f.variant==="big"?58:f.variant==="mini"?13:22,fontWeight:900,color:f.color,
              textShadow:f.variant==="big"?"0 2px 6px rgba(0,0,0,0.95),0 0 18px rgba(0,0,0,0.7)":"0 1px 3px rgba(0,0,0,0.9),0 0 6px rgba(0,0,0,0.6)",
              fontFamily:"var(--font-title)",whiteSpace:"nowrap",
            }}>{f.icon}</div>
          ))}
        </div>
      )}

      <AmbientSound />
    </div>
  );
}
