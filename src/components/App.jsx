// TODO [v0.11]: Add movement animations — smooth unit transitions between hexes (CSS transform + requestAnimationFrame)
// TODO [v0.11]: Add action feedback animations — resource gain/spend particles, combat flash, star burst on milestone
// TODO [v0.11]: Add bot turn visualization — highlight bot's chosen hex, show movement trail
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TERRAINS } from '../data/terrains.js';
import { FACTIONS, FACTION_IDS } from '../data/factions.js';
import { HEXES, RIVERS, HOME_BASES, hMap, ADJ } from '../data/hexes.js';
import { getCombatBonus } from '../data/combat.js';
import { EMPIRE_START, EMPIRE_RAILS, drawEmpireCombat } from '../data/empire.js';
import { ENCOUNTERS, ENCOUNTER_HEXES } from '../data/encounters.js';
import { FACTORY_RR_HEX, PLANS_FORD, PLANS_TESLA } from '../data/plans.js';
import { MATS, BOTTOM, getBottomCost, BUILDING_TYPES, ENLIST_ONGOING, applyEnlistOngoing } from '../data/mats.js';
import { OBJECTIVES } from '../data/objectives.js';
import RulesPage from './RulesPage.jsx';
import AmbientSound from './AmbientSound.jsx';
import SetupScreen from './SetupScreen.jsx';
import { countRes, spendRes, getWorkerHexes } from '../logic/resources.js';
import { canPayProduce, payProduce, getProduceCost, produceCostLabel } from '../logic/production.js';
import { hPts, HS, edgeGeo, shuffleArray } from '../logic/hexMath.js';
import { getValidMoves } from '../logic/movement.js';
import { transportUnits } from '../logic/transport.js';
import { createPlayer } from '../logic/player.js';
import { botTurn } from '../logic/bot.js';
import { applyPlanTop, getPlanBottomBonus } from '../logic/planEffects.js';
import { HexTerrain, UnitToken, EmpireMecha, ResourceToken, FactionHalo } from './svg/MapComponents.jsx';
import { ActionRow, CubeSlots } from './svg/ActionIcons.jsx';

export default function App(){
  const[phase,setPhase]=useState("setup");
  const[selFaction,setSelFaction]=useState(null);
  const[selMat,setSelMat]=useState(null);
  const[numBots,setNumBots]=useState(2);
  const[players,setPlayers]=useState([]);
  const[currentP,setCurrentP]=useState(0);
  const[turn,setTurn]=useState(1);
  const[empire,setEmpire]=useState(Object.fromEntries(EMPIRE_START.map(e=>[e.id,e.hexId])));
  const[rails,setRails]=useState([...EMPIRE_RAILS]); // shared rail network: array of [hexA, hexB]
  const[railPlacement,setRailPlacement]=useState(null); // {remaining:3, fromHex:null} for placing rails after Gare build
  const[selHex,setSelHex]=useState(null);
  const[selAction,setSelAction]=useState(null);
  const[pendingBottom,setPendingBottom]=useState(null); // {col, action} after top-row done
  const[bottomPick,setBottomPick]=useState(null); // for Build: choosing building type / Deploy: choosing hex
  const[combat,setCombat]=useState(null); // {type:"pvp"|"pve", hexId, enemyIdx?, empireId?, empireCard?, phase:"choose"|"reward", powerSpend:0, cardsSpend:0}
  const[encounter,setEncounter]=useState(null); // {card, hexId}
  const[rougeRiver,setRougeRiver]=useState(null); // {cards:[]}
  const[encounterTokens,setEncounterTokens]=useState(new Set(ENCOUNTER_HEXES));
  const[rrVisitors,setRrVisitors]=useState(0); // how many players visited RR
  const[moveSource,setMoveSource]=useState(null);
  const[preActionSnapshot,setPreActionSnapshot]=useState(null); // snapshot of player[0] before action, for undo
  const[tradePicks,setTradePicks]=useState([]); // for Trade: array of picked resource types (0-2)
  const[hovHex,setHovHex]=useState(null);
  const[clickRipple,setClickRipple]=useState(null); // {hexId, key} for ripple animation
  const[log,setLog]=useState([]);
  const[botRunning,setBotRunning]=useState(false);
  const[showStars,setShowStars]=useState(false);
  const[showObjectives,setShowObjectives]=useState(false);
  const[showLog,setShowLog]=useState(true);
  const[showRules,setShowRules]=useState(false);
  const logRef=useRef(null);
  // Map zoom/pan state
  const MAP_BASE={x:20,y:20,w:980,h:990};
  const[mapView,setMapView]=useState({...MAP_BASE});
  const[isPanning,setIsPanning]=useState(false);
  const panStart=useRef(null);
  const mapRef=useRef(null);

  const me=players[0];const myFaction=me?FACTIONS[me.faction]:null;const myMat=me?MATS.find(m=>m.id===me.matId):null;

  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[log]);

  // Map zoom (wheel) — zoom toward cursor
  const handleMapWheel=useCallback((e)=>{
    e.preventDefault();
    const factor=e.deltaY>0?1.12:1/1.12;
    setMapView(prev=>{
      const newW=Math.min(MAP_BASE.w*2,Math.max(200,prev.w*factor));
      const newH=Math.min(MAP_BASE.h*2,Math.max(200,prev.h*factor));
      // Zoom toward mouse position
      const svg=mapRef.current;
      if(svg){
        const rect=svg.getBoundingClientRect();
        const mx=(e.clientX-rect.left)/rect.width;
        const my=(e.clientY-rect.top)/rect.height;
        const newX=prev.x+prev.w*mx-newW*mx;
        const newY=prev.y+prev.h*my-newH*my;
        return{x:newX,y:newY,w:newW,h:newH};
      }
      const cx=prev.x+prev.w/2,cy=prev.y+prev.h/2;
      return{x:cx-newW/2,y:cy-newH/2,w:newW,h:newH};
    });
  },[]);

  // Map pan (mouse drag)
  const handleMapPointerDown=useCallback((e)=>{
    if(e.button!==1&&!e.shiftKey)return; // middle-click or shift+left-click to pan
    e.preventDefault();
    setIsPanning(true);
    panStart.current={cx:e.clientX,cy:e.clientY,vx:mapView.x,vy:mapView.y};
  },[mapView.x,mapView.y]);

  const handleMapPointerMove=useCallback((e)=>{
    if(!isPanning||!panStart.current)return;
    const svg=mapRef.current;if(!svg)return;
    const rect=svg.getBoundingClientRect();
    const scaleX=mapView.w/rect.width,scaleY=mapView.h/rect.height;
    const dx=(e.clientX-panStart.current.cx)*scaleX;
    const dy=(e.clientY-panStart.current.cy)*scaleY;
    setMapView(prev=>({...prev,x:panStart.current.vx-dx,y:panStart.current.vy-dy}));
  },[isPanning,mapView.w,mapView.h]);

  const handleMapPointerUp=useCallback(()=>{
    setIsPanning(false);panStart.current=null;
  },[]);

  // Attach wheel listener with passive:false for preventDefault
  useEffect(()=>{
    const el=mapRef.current;if(!el)return;
    el.addEventListener("wheel",handleMapWheel,{passive:false});
    return()=>el.removeEventListener("wheel",handleMapWheel);
  },[handleMapWheel]);

  const mapZoom=useCallback((factor)=>{
    setMapView(prev=>{
      const cx=prev.x+prev.w/2,cy=prev.y+prev.h/2;
      const newW=Math.min(MAP_BASE.w*2,Math.max(200,prev.w*factor));
      const newH=Math.min(MAP_BASE.h*2,Math.max(200,prev.h*factor));
      return{x:cx-newW/2,y:cy-newH/2,w:newW,h:newH};
    });
  },[]);

  const mapReset=useCallback(()=>setMapView({...MAP_BASE}),[]);
  const addLog=useCallback((msg)=>setLog(prev=>[...prev,msg]),[]);
  const addLogs=useCallback((msgs)=>setLog(prev=>[...prev,...msgs]),[]);

  const startGame=useCallback(()=>{
    if(!selFaction||!selMat)return;
    const usedFactions=[selFaction];const usedMats=[selMat];
    const ps=[createPlayer(selFaction,selMat,false)];
    const availF=FACTION_IDS.filter(f=>!usedFactions.includes(f));
    const availM=MATS.map(m=>m.id).filter(id=>!usedMats.includes(id));
    for(let i=0;i<numBots&&i<availF.length;i++){
      ps.push(createPlayer(availF[i],availM[i%availM.length],true));
      usedFactions.push(availF[i]);usedMats.push(availM[i%availM.length]);
    }
    const shuffled=shuffleArray(OBJECTIVES);
    ps.forEach((p,i)=>{
      const o1=shuffled[(i*2)%shuffled.length];const o2=shuffled[(i*2+1)%shuffled.length];
      p.objectives=[o1,o2];
      if(p.isBot){p.objective=Math.random()>0.5?o1:o2;}
    });
    setPlayers(ps);setPhase("playing");setCurrentP(0);setTurn(1);
    addLog(`⚔ ${ps.length} joueurs`);
    ps.forEach(p=>{const f=FACTIONS[p.faction];addLog(`${p.isBot?"🤖":"👤"} ${f.name} (${p.matName})  ⚡${p.power} 🃏${p.combatCards} ♥${p.pop} 💰${p.coins}`);});
  },[selFaction,selMat,numBots,addLog]);

  const revealObjective=useCallback((objIdx)=>{
    const p=players[0];if(!p||p.objectiveRevealed)return;
    const obj=p.objectives?.[objIdx];if(!obj)return;
    if(obj.check(p)){setPlayers(prev=>{const n=[...prev];n[0]={...n[0],objectiveRevealed:true,revealedObjectiveIdx:objIdx,stars:n[0].stars+1};return n;});addLog(`⭐ "${obj.name}" révélé !`);}
    else addLog(`❌ "${obj.name}" — condition non remplie`);
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
        const validEmpire=adj.filter(toId=>{const h=hMap[toId];return h&&h.t!=="lac"&&h.t!=="marecage";});
        if(validEmpire.length>0){
          const toId=validEmpire[Math.floor(Math.random()*validEmpire.length)];
          setEmpire(prev=>({...prev,[eid]:toId}));
          addLog(`🔴 Empire ${eid} → #${toId}`);
          // Check if empire moved onto a player's unit → combat triggered next turn
        }
      }
      setCurrentP(0);setTurn(t=>t+1);setBotRunning(false);addLog(`── Tour ${turn+1} ──`);
      return;
    }
    if(!players[cp].isBot){setBotRunning(false);return;}
    const timer=setTimeout(()=>{
      // Build enemy hexes set for this bot (all hexes with other factions' units)
      const botEnemyHexes=new Set();
      players.forEach((op,oi)=>{
        if(oi===cp)return;
        botEnemyHexes.add(op.hero);
        op.mechs.forEach(m=>botEnemyHexes.add(m.hexId));
        op.workers.forEach(w=>botEnemyHexes.add(w.hexId));
      });
      let result=botTurn(players[cp],empire,botEnemyHexes,rails);
      let p=result.player;const logs=[...result.logs];
      // ── BOT COMBAT: check if bot moved onto Empire mecha ──
      const botHeroHex=p.hero;
      const empireOnHero=Object.entries(empire).find(([_,hid])=>hid===botHeroHex);
      if(empireOnHero&&p.power>=2){
        const card=drawEmpireCombat();
        // Combat ability bonus (bot is attacker)
        const botCBonus=getCombatBonus(p, botHeroHex, true);
        const botPow=Math.min(Math.floor(p.power*0.6),7)+botCBonus.powerBonus;
        // Card limit = 1 per combat unit (hero/mech) on the hex + card bonus
        const botUnitsOnHex=(p.hero===botHeroHex?1:0)+p.mechs.filter(m=>m.hexId===botHeroHex).length;
        const botCC=Math.min(Math.floor(Math.random()*(p.combatCards+1)),botUnitsOnHex+botCBonus.cardBonus);
        const botTotal=botPow+(botCC*2);
        const bf=FACTIONS[p.faction];
        p.power-=botPow;p.combatCards-=botCC;
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
          const bhbHex=HEXES.reduce((best,h)=>{const d=Math.sqrt((h.rx-bhb.rx)**2+(h.ry-bhb.ry)**2);const db=best?Math.sqrt((best.rx-bhb.rx)**2+(best.ry-bhb.ry)**2):Infinity;return d<db&&h.t!=="lac"&&h.t!=="marecage"?h:best;},null);
          p.hero=bhbHex.id;
        }
      }
      setPlayers(prev=>{
        const n=[...prev];n[cp]=p;
        // ── SCYTHE RULE: bot hero/mech displaces other players' workers ──
        const botHexes=new Set([p.hero,...p.mechs.map(m=>m.hexId)]);
        for(let oi=0;oi<n.length;oi++){
          if(oi===cp)continue;
          const displaced=n[oi].workers.filter(w=>botHexes.has(w.hexId));
          if(displaced.length>0){
            const ohb=HOME_BASES[n[oi].faction];
            const ohbHex=HEXES.reduce((best,h)=>{const d=Math.sqrt((h.rx-ohb.rx)**2+(h.ry-ohb.ry)**2);const db=best?Math.sqrt((best.rx-ohb.rx)**2+(best.ry-ohb.ry)**2):Infinity;return d<db&&h.t!=="lac"&&h.t!=="marecage"?h:best;},null);
            n[oi]={...n[oi],workers:n[oi].workers.map(w=>botHexes.has(w.hexId)?{...w,hexId:ohbHex.id}:w)};
            // Bot loses pop for displacing workers
            n[cp]={...n[cp],pop:Math.max(0,(n[cp].pop||0)-displaced.length)};
            logs.push(`🏃 ${displaced.length} ouvrier(s) ${FACTIONS[n[oi].faction].name} renvoyé(s) ! (-${displaced.length} Pop ${f.name})`);
          }
          // ── TRAP TRIGGER: bot hero/mech lands on enemy Frente trap ──
          if(n[oi].faction==="frente"){
            (n[oi].trapTokens||[]).forEach((trap,ti)=>{
              if(botHexes.has(trap.hexId)&&!trap.disarmed){
                const penalty=Math.min(n[cp].power||0,3);
                n[cp]={...n[cp],power:Math.max(0,(n[cp].power||0)-penalty)};
                n[oi]={...n[oi],trapTokens:[...n[oi].trapTokens]};
                n[oi].trapTokens[ti]={...n[oi].trapTokens[ti],disarmed:true};
                logs.push(`💥 Trap Frente sur #${trap.hexId} ! ${f.name} -${penalty}⚡`);
              }
            });
          }
        }
        // ── ENLIST ONGOING: bot did a bottom action → trigger for self + neighbors ──
        if(result.bottomCol>=0){
          const enlistResult=applyEnlistOngoing(n,cp,result.bottomCol,FACTIONS);
          enlistResult.logs.forEach(l=>logs.push(l));
          for(let ei=0;ei<enlistResult.players.length;ei++){n[ei]=enlistResult.players[ei];}
        }
        return n;
      });
      // Apply bot-placed rails (from Gare build)
      if(p._pendingRails&&p._pendingRails.length>0){
        setRails(prev=>[...prev,...p._pendingRails]);
        delete p._pendingRails;
      }
      addLogs(logs);setCurrentP(cp+1);
    },350);
    return()=>clearTimeout(timer);
  },[botRunning,currentP,players,phase,empire,turn,addLog,addLogs]);

  // After top-row → show bottom-row option
  const endHumanTurn=useCallback((col)=>{
    setPlayers(prev=>{const n=[...prev];n[0]={...n[0],lastCol:col,movesLeft:undefined,movedUnits:[],packUpUsed:false,commerceUsed:false};return n;});
    setSelAction(null);setMoveSource(null);setPreActionSnapshot(null);setTradePicks([]);
    // Show bottom-row option
    const bottomAction=BOTTOM[col];
    setPendingBottom({col,action:bottomAction});
    setBottomPick(null);
  },[]);

  // Actually finish and pass to bots
  const actuallyEndTurn=useCallback(()=>{
    setPendingBottom(null);setBottomPick(null);
    setCurrentP(1);setBotRunning(true);
  },[]);

  // Wrapper: apply enlist ongoing bonuses then end turn
  const finishBottom=useCallback((bottomCol)=>{
    setPlayers(prev=>{
      const result=applyEnlistOngoing(prev,0,bottomCol,FACTIONS);
      result.logs.forEach(l=>addLog(l));
      return result.players;
    });
    actuallyEndTurn();
  },[addLog,actuallyEndTurn]);

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
    if((me.cubesOnBottom||[])[toCol]>=(mat.bottomSlots||[])[toCol]){addLog(`⚠ Plus de place sur cette action bottom`);return;}
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
  const doDeploy=useCallback((targetHex,overrideRes)=>{
    if(!me||me.mechs.length>=4)return;
    const costs=getBottomCost(me);
    const depCost=costs[1]; // Deploy is bottom col 1
    const baseRes=overrideRes||depCost.res;
    const planBonus=getPlanBottomBonus(me,"Deploy");
    const qty=Math.max(0,depCost.qty-planBonus.costReduction);
    const res=overrideRes||baseRes;
    if(countRes(me,res)<qty){addLog(`⚠ ${qty} ${res} requis`);return;}
    setPlayers(prev=>{
      const n=[...prev];let p=spendRes(n[0],res,qty);
      const abilityIdx=p.mechs.length;
      p.mechs=[...p.mechs,{id:`${p.faction}_m${p.mechs.length}`,hexId:targetHex}];
      p.unlockedAbilities=[...(p.unlockedAbilities||[]),abilityIdx];
      p.coins+=planBonus.bonusCoins;
      p.power=Math.min(p.power+planBonus.bonusPower,16);
      const earned=p.mechs.length>=4&&!p.starMechs;
      if(earned){p.stars++;p.starMechs=true;}
      n[0]=p;return n;
    });
    const abilityNames=["Speed","Riverwalk","Combat","Position"];
    const unlockIdx=me.mechs.length;
    planBonus.logs.forEach(l=>addLog(l));
    addLog(`⬡ Mecha déployé sur #${targetHex} (-${qty} ${res}) → 🔓 ${abilityNames[unlockIdx]||"?"}`);
    if(me.mechs.length+1>=4)addLog(`⭐ 4 Mechas déployés !`);
    finishBottom(1);
  },[me,addLog,finishBottom]);

  // ── BOTTOM-ROW: BUILD ──
  const doBuild=useCallback((targetHex,buildingType)=>{
    if(!me||(me.buildings||[]).length>=4)return;
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
      setRailPlacement({remaining:3,fromHex:null});
      addLog(`🚂 Posez 3 segments de rail (cliquez 2 hex adjacents par segment)`);
      return;
    }
    finishBottom(2);
  },[me,addLog,finishBottom]);

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

  // ── BOTTOM-ROW: ENLIST (pick bottom col to assign recruit → immediate + ongoing bonus) ──
  const ENLIST_BONUSES=[
    {id:0,col:0,icon:"⚡",label:"+2 Puissance",apply:p=>{p.power=Math.min(p.power+2,16);}},
    {id:1,col:1,icon:"💰",label:"+2 Pièces",apply:p=>{p.coins+=2;}},
    {id:2,col:2,icon:"♥",label:"+2 Popularité",apply:p=>{p.pop=Math.min(p.pop+2,18);}},
    {id:3,col:3,icon:"🃏",label:"+2 Cartes",apply:p=>{p.combatCards+=2;}},
  ];
  const doEnlist=useCallback((colIdx)=>{
    if(!me||(me.recruits||0)>=4)return;
    if((me.enlistMap||[])[colIdx]){addLog(`⚠ Déjà une recrue sur ${BOTTOM[colIdx]}`);return;}
    const costs=getBottomCost(me);
    const cost=costs[3]; // Enlist is bottom col 3
    const planBonus=getPlanBottomBonus(me,"Enlist");
    const effectiveQty=Math.max(0,cost.qty-planBonus.costReduction);
    if(countRes(me,cost.res)<effectiveQty){addLog(`⚠ ${effectiveQty} ${cost.res} requis`);return;}
    const bonus=ENLIST_BONUSES[colIdx];
    setPlayers(prev=>{
      const n=[...prev];let p=spendRes(n[0],cost.res,effectiveQty);
      p.recruits=(p.recruits||0)+1;
      p.enlistMap=[...(p.enlistMap||[false,false,false,false])];
      p.enlistMap[colIdx]=true;
      bonus.apply(p);
      p.coins+=planBonus.bonusCoins;
      p.power=Math.min(p.power+planBonus.bonusPower,16);
      const earned=p.recruits>=4&&!p.starRecruits;
      if(earned){p.stars++;p.starRecruits=true;}
      n[0]=p;return n;
    });
    planBonus.logs.forEach(l=>addLog(l));
    addLog(`🤝 Recrue ${(me.recruits||0)+1}/4 sur ${BOTTOM[colIdx]} (-${effectiveQty} ${cost.res}, ${bonus.label})`);
    addLog(`   Ongoing: ${ENLIST_ONGOING[colIdx].icon} quand vous/voisins faites ${BOTTOM[colIdx]}`);
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
      if(reward==="coins"){p.coins+=2;p.imperialCoins=(p.imperialCoins||0)+2;}
      else{p.combatCards++;}
      n[0]=p;return n;
    });
    addLog(`🏛 Commerce Impérial : -1 ${resType} → ${reward==="coins"?"+2💰":"+1🃏"}`);
  },[me,addLog]);

  const validMoves=useMemo(()=>{
    if(!moveSource||!me)return new Set();
    let moves=getValidMoves(moveSource.fromHex,me.faction,me.unlockedAbilities||[],me,rails);
    // Workers cannot enter hexes with any enemy units
    if(moveSource.unitType==="worker"){
      const enemyHexes=new Set();
      for(let pi=1;pi<players.length;pi++){
        const ep=players[pi];
        enemyHexes.add(ep.hero);
        ep.mechs.forEach(m=>enemyHexes.add(m.hexId));
        ep.workers.forEach(w=>enemyHexes.add(w.hexId));
      }
      moves=moves.filter(id=>!enemyHexes.has(id));
    }
    return new Set(moves);
  },[moveSource,me,players,rails]);

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

  const handleHexClick=useCallback((hexId)=>{
    if(phase!=="playing"||botRunning||combat)return;
    // Ripple effect on click
    setClickRipple({hexId,key:Date.now()});
    
    // ── RAIL PLACEMENT MODE ──
    if(railPlacement){
      if(!railPlacement.fromHex){
        // First click: select starting hex of rail segment
        setRailPlacement(prev=>({...prev,fromHex:hexId}));
        addLog(`🚂 Rail depuis #${hexId} — cliquez un hex adjacent`);
        return;
      } else {
        // Second click: must be adjacent to fromHex
        const from=railPlacement.fromHex;
        const isAdj=(ADJ[from]||[]).includes(hexId);
        if(!isAdj||hexId===from){
          addLog(`⚠ Choisissez un hex adjacent à #${from}`);
          setRailPlacement(prev=>({...prev,fromHex:null}));
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
    
    if(moveSource&&validMoves.has(hexId)){
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
      
      // No combat: normal move with TRANSPORT (Scythe rules)
      let p={...me, workers:[...me.workers], mechs:[...me.mechs], resources:{...me.resources}};
      Object.keys(me.resources).forEach(k=>{p.resources[k]={...me.resources[k]};});
      const fromHex=moveSource.fromHex;
      let transportLog="";
      
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
        // Hero carries resources (not workers)
        const tr=transportUnits(p, fromHex, hexId, "hero");
        p=tr.player;
        if(tr.carried.resTypes.length>0) transportLog=` 📦${tr.carried.resTypes.join(",")}`;
      }
      else if(moveSource.unitType==="mech"){
        p.mechs=p.mechs.map(m=>m.id===moveSource.unitId?{...m,hexId}:m);
        // Mech carries workers + resources
        const tr=transportUnits(p, fromHex, hexId, "mech");
        p=tr.player;
        if(tr.carried.workers>0) transportLog+=` 👷×${tr.carried.workers}`;
        if(tr.carried.resTypes.length>0) transportLog+=` 📦${tr.carried.resTypes.join(",")}`;
      }
      else if(moveSource.unitType==="worker"){
        p.workers=p.workers.map(w=>w.id===moveSource.unitId?{...w,hexId}:w);
      }
      
      p.movesLeft=(me.movesLeft||2)-1;p.movedUnits=[...(me.movedUnits||[]),moveSource.unitId];
      
      // ── SCYTHE RULE: displace enemy workers when hero/mech enters (no combat) ──
      const movingCombat2=moveSource.unitType==="hero"||moveSource.unitType==="mech";
      if(movingCombat2){
        let displaced=0;
        for(let pi=1;pi<players.length;pi++){
          const ep=players[pi];
          const enemyWorkersHere=ep.workers.filter(w=>w.hexId===hexId);
          if(enemyWorkersHere.length>0){
            const ehb=HOME_BASES[ep.faction];
            const ehbHex=HEXES.reduce((best,h)=>{const d=Math.sqrt((h.rx-ehb.rx)**2+(h.ry-ehb.ry)**2);const db=best?Math.sqrt((best.rx-ehb.rx)**2+(best.ry-ehb.ry)**2):Infinity;return d<db&&h.t!=="lac"&&h.t!=="marecage"?h:best;},null);
            displaced+=enemyWorkersHere.length;
            // Retreat enemy workers to their home base
            setPlayers(prev=>{
              const n=[...prev];
              n[pi]={...n[pi],workers:n[pi].workers.map(w=>w.hexId===hexId?{...w,hexId:ehbHex.id}:w)};
              // Enemy drops resources on hex (stay for winner)
              return n;
            });
            addLog(`🏃 ${enemyWorkersHere.length} ouvrier(s) ${FACTIONS[ep.faction].name} renvoyé(s) !`);
          }
        }
        if(displaced>0){
          // Lose 1 pop per displaced worker
          p.pop=Math.max(0,p.pop-displaced);
          addLog(`♥ -${displaced} Pop (ouvriers déplacés)`);
        }
      }
      
      setPlayers(prev=>{const n=[...prev];n[0]=p;return n;});
      addLog(`🚶 ${moveSource.unitType==="hero"?myFaction.hero:moveSource.unitId} → #${hexId}${transportLog}`);
      setMoveSource(null);
      
      // ── CHECK TRAP TRIGGER: enemy trap on this hex? ──
      if(moveSource.unitType==="hero"||moveSource.unitType==="mech"){
        for(let pi=1;pi<players.length;pi++){
          const ep=players[pi];
          if(ep.faction!=="frente")continue;
          const trapIdx=(ep.trapTokens||[]).findIndex(t=>t.hexId===hexId&&!t.disarmed);
          if(trapIdx>=0){
            // Trigger trap: -3 power penalty, disarm trap
            const penalty=Math.min(me.power,3);
            setPlayers(prev=>{
              const n=[...prev];
              n[0]={...n[0],power:Math.max(0,n[0].power-penalty)};
              n[pi]={...n[pi],trapTokens:[...n[pi].trapTokens]};
              n[pi].trapTokens[trapIdx]={...n[pi].trapTokens[trapIdx],disarmed:true};
              return n;
            });
            addLog(`💥 Trap Frente déclenché sur #${hexId} ! -${penalty}⚡`);
          }
        }
      }
      
      // ── HERO-ONLY TRIGGERS ──
      if(moveSource.unitType==="hero"){
        // ── TIERRA MINADA: Frente places trap after hero moves ──
        if(me.faction==="frente"&&(me.trapTokens||[]).length<4){
          const alreadyTrapped=(me.trapTokens||[]).some(t=>t.hexId===hexId);
          if(!alreadyTrapped){
            setPlayers(prev=>{
              const n=[...prev];const p2={...n[0]};
              p2.trapTokens=[...(p2.trapTokens||[]),{hexId,disarmed:false}];
              n[0]=p2;return n;
            });
            addLog(`🪤 Tierra Minada ! Trap posé sur #${hexId} (${(me.trapTokens||[]).length+1}/4)`);
          }
        }
        // ── COMPTOIR: Acadiane places flag after hero moves ──
        if(me.faction==="acadiane"&&(me.flagTokens||[]).length<4){
          const alreadyFlagged=(me.flagTokens||[]).some(f=>f.hexId===hexId);
          if(!alreadyFlagged){
            setPlayers(prev=>{
              const n=[...prev];const p2={...n[0]};
              p2.flagTokens=[...(p2.flagTokens||[]),{hexId}];
              n[0]=p2;return n;
            });
            addLog(`🏴 Comptoir posé sur #${hexId} (${(me.flagTokens||[]).length+1}/4)`);
          }
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
          const hasFragments=(me.fragments||0)>=2;
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
      
      if(p.movedUnits.length>=2){addLog(`✅ Mouvement terminé`);endHumanTurn(myMat.topRow.indexOf("Move"));}
      return;
    }
    if(moveSource){setMoveSource(null);return;}
    setSelHex(hexId);
  },[phase,botRunning,moveSource,validMoves,me,myFaction,myMat,addLog,endHumanTurn,finishBottom,combat,empire,players,encounterTokens,rrVisitors,railPlacement,rails]);

  // ── COMBAT RESOLUTION ──
  const resolveCombat=useCallback(()=>{
    if(!combat||!me)return;
    // Player combat ability bonus
    const playerCBonus=getCombatBonus(me, combat.hexId, true); // player is always attacker
    const playerTotal=combat.powerSpend + playerCBonus.powerBonus + (combat.cardsSpend*2);
    if(playerCBonus.name&&(playerCBonus.powerBonus>0||playerCBonus.cardBonus>0)){
      addLog(`🛡 ${playerCBonus.name}: ${playerCBonus.powerBonus>0?`+${playerCBonus.powerBonus}⚡ `:""}${playerCBonus.cardBonus>0?`+${playerCBonus.cardBonus}🃏`:""}`);
    }
    
    if(combat.type==="pve"){
      const empireTotal=combat.empireCard.power;
      const win=playerTotal>=empireTotal; // attacker wins ties
      // Spend resources
      setPlayers(prev=>{
        const n=[...prev];const p={...n[0]};
        p.power-=combat.powerSpend;p.combatCards-=combat.cardsSpend;
        if(!win){
          // Retreat hero/mech to nearest HB hex
          const hb=HOME_BASES[p.faction];
          const hbHex=HEXES.reduce((best,h)=>{const d=Math.sqrt((h.rx-hb.rx)**2+(h.ry-hb.ry)**2);const db=best?Math.sqrt((best.rx-hb.rx)**2+(best.ry-hb.ry)**2):Infinity;return d<db&&h.t!=="lac"&&h.t!=="marecage"?h:best;},null);
          if(combat.moveData.unitType==="hero")p.hero=hbHex.id;
          // Mech stays — it didn't actually move yet
        }
        p.movesLeft=(me.movesLeft||2)-1;p.movedUnits=[...(me.movedUnits||[]),combat.moveData.unitId];
        n[0]=p;return n;
      });
      
      if(win){
        addLog(`✅ Victoire ! ${combat.empireCard.name} détruit (${playerTotal} vs ${empireTotal})`);
        // Move unit to hex + TRANSPORT
        setPlayers(prev=>{
          const n=[...prev];let p={...n[0],workers:[...n[0].workers],mechs:[...n[0].mechs],resources:{...n[0].resources}};
          Object.keys(n[0].resources).forEach(k=>{p.resources[k]={...n[0].resources[k]};});
          if(combat.moveData.unitType==="hero")p.hero=combat.hexId;
          else if(combat.moveData.unitType==="mech")p.mechs=p.mechs.map(m=>m.id===combat.moveData.unitId?{...m,hexId:combat.hexId}:m);
          // Transport workers+resources with mech, resources with hero
          const tr=transportUnits(p, combat.moveData.fromHex, combat.hexId, combat.moveData.unitType);
          p=tr.player;
          if(tr.carried.workers>0||tr.carried.resTypes.length>0) addLog(`🚚 Transport:${tr.carried.workers>0?` 👷×${tr.carried.workers}`:""}${tr.carried.resTypes.length>0?` 📦${tr.carried.resTypes.join(",")}`:""}`);
          p.empireKills=(p.empireKills||0)+1;
          if(p.empireKills>=3&&!p.starLiberator){p.stars++;p.starLiberator=true;addLog(`⭐💀 LIBÉRATEUR ! 3 Empire détruits !`);}
          // Chimère: Bayou captures Empire mech (1×/game)
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
        addLog(`❌ Défaite... ${combat.empireCard.name} vous repousse (${playerTotal} vs ${empireTotal})`);
      }
    }
    
    if(combat.type==="pvp"){
      const enemy=players[combat.enemyIdx];
      const ef=FACTIONS[enemy.faction];
      
      // ── WHITE FLAG CHECK (Acadiane defender with slot 2) ──
      if(enemy.faction==="acadiane"&&(enemy.unlockedAbilities||[]).includes(2)&&Math.random()<0.5){
        // Acadiane refuses combat: retreat + 2 pop, attacker gets hex + resources + star for free
        addLog(`🏳 ${ef.name} active White Flag ! Retraite volontaire + 2 Pop.`);
        const ehb=HOME_BASES[enemy.faction];
        const ehbHex=HEXES.reduce((best,h)=>{const d=Math.sqrt((h.rx-ehb.rx)**2+(h.ry-ehb.ry)**2);const db=best?Math.sqrt((best.rx-ehb.rx)**2+(best.ry-ehb.ry)**2):Infinity;return d<db&&h.t!=="lac"&&h.t!=="marecage"?h:best;},null);
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
          n[0].movesLeft=(me.movesLeft||2)-1;n[0].movedUnits=[...(me.movedUnits||[]),combat.moveData.unitId];
          // Defender retreats + gains 2 pop
          n[combat.enemyIdx]={...n[combat.enemyIdx],workers:[...n[combat.enemyIdx].workers],mechs:[...n[combat.enemyIdx].mechs],resources:{...n[combat.enemyIdx].resources}};
          Object.keys(prev[combat.enemyIdx].resources).forEach(k=>{n[combat.enemyIdx].resources[k]={...prev[combat.enemyIdx].resources[k]};});
          if(n[combat.enemyIdx].hero===combat.hexId)n[combat.enemyIdx].hero=ehbHex.id;
          n[combat.enemyIdx].mechs=n[combat.enemyIdx].mechs.map(m=>m.hexId===combat.hexId?{...m,hexId:ehbHex.id}:m);
          n[combat.enemyIdx].workers=n[combat.enemyIdx].workers.map(w=>w.hexId===combat.hexId?{...w,hexId:ehbHex.id}:w);
          delete n[combat.enemyIdx].resources[String(combat.hexId)];
          n[combat.enemyIdx].pop=Math.min((n[combat.enemyIdx].pop||0)+2,18);
          return n;
        });
        const wfWorkerCount=enemy.workers.filter(w=>w.hexId===combat.hexId).length;
        addLog(`⭐ Étoile combat ${(me.combatWins||0)+1}/2 (White Flag) !${wfWorkerCount>0?` ♥ -${wfWorkerCount} Pop (ouvriers déplacés)`:""}`);
        setCombat(null);
        if((me.movedUnits||[]).length+1>=2){setTimeout(()=>endHumanTurn(myMat.topRow.indexOf("Move")),100);}
        return;
      }
      
      // Bot defense: limited to 1 card per combat unit on hex + combat ability bonus
      const enemyUnitsOnHex=(enemy.hero===combat.hexId?1:0)+enemy.mechs.filter(m=>m.hexId===combat.hexId).length;
      const enemyCBonus=getCombatBonus(enemy, combat.hexId, false, me.combatCards);
      const botCardSlots=enemyUnitsOnHex+enemyCBonus.cardBonus;
      const botPower=Math.min(Math.floor(Math.random()*Math.min(enemy.power,4)),7)+enemyCBonus.powerBonus;
      const botCards=Math.min(Math.floor(Math.random()*(enemy.combatCards+1)),botCardSlots);
      const enemyTotal=botPower+(botCards*2);
      const win=playerTotal>=enemyTotal; // attacker wins ties
      
      let bonusLog="";
      if(enemyCBonus.name&&(enemyCBonus.powerBonus>0||enemyCBonus.cardBonus>0)) bonusLog=` [${enemyCBonus.name}]`;
      addLog(`⚔ ${myFaction.name}: ${playerTotal} (${combat.powerSpend}${playerCBonus.powerBonus>0?`+${playerCBonus.powerBonus}`:""}⚡+${combat.cardsSpend}🃏) vs ${ef.name}: ${enemyTotal} (${botPower}⚡+${botCards}🃏)${bonusLog}`);
      
      const hb=HOME_BASES[me.faction];
      const hbHex=HEXES.reduce((best,h)=>{const d=Math.sqrt((h.rx-hb.rx)**2+(h.ry-hb.ry)**2);const db=best?Math.sqrt((best.rx-hb.rx)**2+(best.ry-hb.ry)**2):Infinity;return d<db&&h.t!=="lac"&&h.t!=="marecage"?h:best;},null);
      const ehb=HOME_BASES[enemy.faction];
      const ehbHex=HEXES.reduce((best,h)=>{const d=Math.sqrt((h.rx-ehb.rx)**2+(h.ry-ehb.ry)**2);const db=best?Math.sqrt((best.rx-ehb.rx)**2+(best.ry-ehb.ry)**2):Infinity;return d<db&&h.t!=="lac"&&h.t!=="marecage"?h:best;},null);
      // Pre-count enemy units on hex (before retreat) for faction abilities
      const preEnemyMechs=enemy.mechs.filter(m=>m.hexId===combat.hexId);
      const preEnemyWorkers=enemy.workers.filter(w=>w.hexId===combat.hexId);
      
      setPlayers(prev=>{
        const n=[...prev];
        // Both spend power + cards
        n[0]={...n[0],workers:[...n[0].workers],mechs:[...n[0].mechs],resources:{...n[0].resources}};
        Object.keys(prev[0].resources).forEach(k=>{n[0].resources[k]={...prev[0].resources[k]};});
        n[0].power-=combat.powerSpend;n[0].combatCards-=combat.cardsSpend;
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
          // Loser loses resources on hex
          delete n[combat.enemyIdx].resources[String(combat.hexId)];
        } else {
          // Attacker loses: retreat to HB
          if(combat.moveData.unitType==="hero")n[0].hero=hbHex.id;
          else if(combat.moveData.unitType==="mech")n[0].mechs=n[0].mechs.map(m=>m.id===combat.moveData.unitId?{...m,hexId:hbHex.id}:m);
        }
        n[0].movesLeft=(me.movesLeft||2)-1;n[0].movedUnits=[...(me.movedUnits||[]),combat.moveData.unitId];
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
        // Servitude: Confédération captures 1 enemy worker (max 2 total, costs 2 pop)
        if(me.faction==="confederation"&&preEnemyWorkers.length>0&&me.pop>=2&&(me.capturedWorkers||0)<2){
          setPlayers(prev=>{
            const n=[...prev];
            const p={...n[0],workers:[...n[0].workers]};
            p.pop=Math.max(0,p.pop-2);
            p.workers.push({id:`${p.faction}_serv${p.workers.length}`,hexId:combat.hexId});
            p.capturedWorkers=(p.capturedWorkers||0)+1;
            n[0]=p;return n;
          });
          addLog(`⛓ Servitude ! Ouvrier ${ef.name} capturé (-2 Pop, ${(me.capturedWorkers||0)+1}/2)`);
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
    const newMovesLeft=(me.movesLeft||2)-1;
    if((me.movedUnits||[]).length+1>=2){
      addLog(`✅ Mouvement terminé`);
      // Need to trigger endHumanTurn after state updates
      setTimeout(()=>endHumanTurn(myMat.topRow.indexOf("Move")),100);
    }
  },[combat,me,players,empire,myFaction,myMat,addLog,endHumanTurn]);

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
        addLog(`🏆 +1 Fragment Tesla (${p.fragments}/2)`);
      }
      n[0]=p;return n;
    });
    setCombat(null);
    if((me.movedUnits||[]).length>=2){
      setTimeout(()=>endHumanTurn(myMat.topRow.indexOf("Move")),100);
    }
  },[combat,me,addLog,endHumanTurn,myMat]);

  // ── ENCOUNTER RESOLUTION ──
  const resolveEncounter=useCallback((choiceIdx)=>{
    if(!encounter)return;
    const choice=encounter.card.choices[choiceIdx];
    setPlayers(prev=>{
      const n=[...prev];const p={...n[0],workers:[...n[0].workers],mechs:[...n[0].mechs],resources:{...n[0].resources}};
      // Deep copy resources
      Object.entries(n[0].resources).forEach(([k,v])=>{p.resources[k]={...v};});
      choice.effect(p);
      p.encounters=(p.encounters||0)+1;
      n[0]=p;return n;
    });
    addLog(`📜 ${encounter.card.name}: ${choice.label} → ${choice.desc}`);
    setEncounter(null);
    // Resume movement check
    const moved=(me.movedUnits||[]).length;
    if(moved>=2){addLog(`✅ Mouvement terminé`);setTimeout(()=>endHumanTurn(myMat.topRow.indexOf("Move")),100);}
  },[encounter,me,addLog,endHumanTurn,myMat]);

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
    if(moved>=2){addLog(`✅ Mouvement terminé`);setTimeout(()=>endHumanTurn(myMat.topRow.indexOf("Move")),100);}
  },[rougeRiver,me,addLog,endHumanTurn,myMat]);

  const doMove=(unitType,unitId,fromHex)=>{
    if(!me.movesLeft)setPlayers(prev=>{const n=[...prev];n[0]={...n[0],movesLeft:2,movedUnits:[]};return n;});
    setMoveSource({unitType,unitId,fromHex});setSelHex(null);
  };

  const doBolster=(type)=>{
    if(!me||me.coins<1)return;
    // Check building effects: Arsenal (+1 Pui) and Mémorial (+1 Pop)
    const hasArsenal=(me.buildings||[]).some(b=>b.type==="arsenal");
    const hasMemorial=(me.buildings||[]).some(b=>b.type==="memorial");
    setPlayers(prev=>{const n=[...prev];const p={...n[0]};p.coins--;
      if(type==="power"){
        const bonus=hasArsenal?1:0;
        p.power=Math.min(p.power+2+bonus,16);
        addLog(`💪 -1$ → +${2+bonus} Pui${hasArsenal?" (Arsenal +1)":""}`);}
      else{p.combatCards++;addLog(`🃏 -1$ → +1 CC`);}
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
    const hexIds=Object.keys(workersByHex).slice(0,2);
    if(hexIds.length===0){addLog("⚠ Aucun ouvrier");return;}
    const costLabel=produceCostLabel(me.workers.length);
    setPlayers(prev=>{
      const n=[...prev];const p={...n[0],resources:{...n[0].resources},workers:[...n[0].workers]};
      payProduce(p);
      hexIds.forEach(hidStr=>{
        const hid=parseInt(hidStr);const hex=hMap[hid];const t=TERRAINS[hex.t];let wCount=workersByHex[hidStr].length;
        // Moulin building: +1 production on this hex (as if +1 worker)
        const hasMoulin=(p.buildings||[]).some(b=>b.type==="moulin"&&b.hexId===hid);
        if(hasMoulin)wCount++;
        if(hex.t==="village"){if(p.workers.length<8){for(let i=0;i<wCount&&p.workers.length<8;i++)p.workers.push({id:`${p.faction}_w${p.workers.length}`,hexId:hid});addLog(`👷 +ouv. #${hid}${hasMoulin?" (Moulin +1)":""}`);}}
        else if(t.res&&t.res!=="ouvriers"){if(!p.resources[hidStr])p.resources[hidStr]={};p.resources[hidStr][t.res]=(p.resources[hidStr][t.res]||0)+wCount;addLog(`🏭 +${wCount} ${t.res} #${hid}${hasMoulin?" (Moulin +1)":""}`);}
      });n[0]=p;return n;});
    if(costLabel!=="Gratuit")addLog(`💳 ${costLabel}`);
    endHumanTurn(myMat.topRow.indexOf("Produce"));
  };

  const doTradePick=(resType)=>{
    if(!me||me.coins<1){addLog("⚠ Pas d'$");return;}
    const newPicks=[...tradePicks,resType];
    if(newPicks.length<2){setTradePicks(newPicks);return;}
    // 2 picks done — apply trade
    const workerHex=me.workers.length>0?me.workers[0].hexId:me.hero;
    setPlayers(prev=>{const n=[...prev];const p={...n[0],resources:{...n[0].resources}};const hid=String(workerHex);
      if(!p.resources[hid])p.resources[hid]={};
      newPicks.forEach(r=>{p.resources[hid][r]=(p.resources[hid][r]||0)+1;});
      p.coins--;n[0]=p;return n;});
    const label=newPicks[0]===newPicks[1]?`+2 ${newPicks[0]}`:`+1 ${newPicks[0]}, +1 ${newPicks[1]}`;
    addLog(`💰 -1$ → ${label}`);setTradePicks([]);endHumanTurn(myMat.topRow.indexOf("Trade"));
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
    return <SetupScreen selFaction={selFaction} setSelFaction={setSelFaction} selMat={selMat} setSelMat={setSelMat} numBots={numBots} setNumBots={setNumBots} startGame={startGame} onShowRules={()=>setShowRules(true)} />;
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
      // Count territories: hexes with at least one unit
      const unitHexes=new Set([p.hero,...p.workers.map(w=>w.hexId),...p.mechs.map(m=>m.hexId)]);
      // Buildings count as territory if hex has no enemy
      (p.buildings||[]).forEach(b=>unitHexes.add(b.hexId));
      // Trap tokens (Frente) count as territory
      (p.trapTokens||[]).forEach(t=>{if(!t.disarmed)unitHexes.add(t.hexId);});
      // Comptoir tokens (Acadiane) count as +1 territory each (not adj to HB)
      let flagBonus=0;
      const hb=HOME_BASES[p.faction];
      const hbHex=HEXES.reduce((best,h)=>{const d=Math.sqrt((h.rx-hb.rx)**2+(h.ry-hb.ry)**2);const db=best?Math.sqrt((best.rx-hb.rx)**2+(best.ry-hb.ry)**2):Infinity;return d<db&&h.t!=="lac"&&h.t!=="marecage"?h:best;},null);
      (p.flagTokens||[]).forEach(fl=>{
        const isAdjHB=hbHex&&(ADJ[hbHex.id]||[]).includes(fl.hexId);
        if(!isAdjHB)flagBonus++;
      });
      const territories=unitHexes.size;
      // Factory = 3 extra territories if controlled
      const factoryBonus=unitHexes.has(22)?3:0;
      // Resources
      let totalRes=0;Object.values(p.resources).forEach(r=>Object.values(r).forEach(n=>totalRes+=n));
      const resPairs=Math.floor(totalRes/2);
      const starScore=p.stars*starMult;
      const terScore=(territories+factoryBonus+flagBonus)*terMult;
      const resScore=resPairs*resMult;
      const total=starScore+terScore+resScore+p.coins;
      return{faction:p.faction,name:f.name,color:f.color,hero:f.hero,isBot:p.isBot,
        stars:p.stars,pop:p.pop,popTier,territories,factoryBonus,flagBonus,totalRes,resPairs,coins:p.coins,
        starScore,terScore,resScore,total,starMult,terMult,resMult};
    }).sort((a,b)=>b.total-a.total);

    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(170deg,#1A1710 0%,#1A1710 40%,#1A1710 100%)",color:"var(--text)",display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 16px",overflow:"auto"}}>
        <div style={{width:80,height:1,background:"linear-gradient(90deg,transparent,var(--gold),transparent)",marginBottom:16}}/>
        <h1 style={{fontSize:24,fontWeight:900,letterSpacing:8,textTransform:"uppercase",color:"var(--gold)",marginBottom:4,textAlign:"center"}}>Fin de Partie</h1>
        <div style={{width:140,height:1,background:"linear-gradient(90deg,transparent,var(--gold-dim),transparent)",marginBottom:24}}/>

        {/* Rankings */}
        <div style={{width:"100%",maxWidth:560}}>
          {scores.map((s,i)=>(
            <div key={s.faction} className="fade-in" style={{
              background:i===0?"rgba(201,168,76,0.08)":"rgba(20,18,12,0.6)",
              border:i===0?`2px solid var(--gold)`:`1px solid var(--border)`,
              borderRadius:8,padding:"16px 20px",marginBottom:8,
              boxShadow:i===0?"0 0 30px rgba(201,168,76,0.12)":"none",
              animationDelay:`${i*0.1}s`,
            }}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <span style={{fontSize:24,fontWeight:900,color:i===0?"var(--gold)":"var(--text-muted)",fontFamily:"'Bitter',serif",width:32}}>
                  {i===0?"🏆":i+1+"."}
                </span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Bitter',serif",fontSize:16,fontWeight:700,color:s.color}}>{s.name}</div>
                  <div style={{fontSize:10,color:"var(--text-dim)"}}>{s.hero} {s.isBot?"🤖":"👤"}</div>
                </div>
                <div style={{fontSize:22,fontWeight:900,color:i===0?"var(--gold)":"var(--text)",fontFamily:"'Bitter',serif"}}>{s.total}$</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,fontSize:11,color:"var(--text-dim)"}}>
                <div style={{background:"var(--bg3)",padding:"6px 8px",borderRadius:4,textAlign:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--gold)"}}>{s.starScore}$</div>
                  <div>⭐{s.stars} × {s.starMult}</div>
                </div>
                <div style={{background:"var(--bg3)",padding:"6px 8px",borderRadius:4,textAlign:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--brass)"}}>{s.terScore}$</div>
                  <div>🗺{s.territories}{s.factoryBonus?`+${s.factoryBonus}`:""}{s.flagBonus?`+${s.flagBonus}⚑`:""} × {s.terMult}</div>
                </div>
                <div style={{background:"var(--bg3)",padding:"6px 8px",borderRadius:4,textAlign:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--copper)"}}>{s.resScore}$</div>
                  <div>📦{s.resPairs}p × {s.resMult}</div>
                </div>
                <div style={{background:"var(--bg3)",padding:"6px 8px",borderRadius:4,textAlign:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--text)"}}>{s.coins}$</div>
                  <div>💰 cash</div>
                </div>
              </div>
              <div style={{fontSize:11,color:"var(--text-dim)",marginTop:4}}>
                Pop: {s.pop} (palier {["0-6","7-12","13-18"][s.popTier]}) — {s.totalRes} ressources
              </div>
            </div>
          ))}
        </div>

        <button onClick={()=>{setPhase("setup");setPlayers([]);setLog([]);setTurn(1);setEmpire(Object.fromEntries(EMPIRE_START.map(e=>[e.id,e.hexId])));setRails([...EMPIRE_RAILS]);setRailPlacement(null);setSelFaction(null);setSelMat(null);}} style={{
          marginTop:24,padding:"12px 40px",fontSize:13,letterSpacing:4,textTransform:"uppercase",
          background:"var(--gold)",color:"var(--bg)",border:"none",borderRadius:6,fontWeight:700,
          fontFamily:"'Bitter',serif",cursor:"pointer",
        }}>Nouvelle Partie</button>
      </div>
    );
  }

  // ══════════ GAME SCREEN ══════════
  if(!me||!myFaction||!myMat)return null;
  const isMyTurn=currentP===0&&!botRunning;
  const selHexData=selHex!==null?hMap[selHex]:null;


  return(
    <div style={{height:"100vh",display:"grid",gridTemplateRows:"var(--top-h) 1fr",gridTemplateColumns:"var(--left-w) 1fr var(--right-w)",background:"var(--bg)",color:"var(--text)",overflow:"hidden"}}>

      {/* ═══ TOP RESOURCE BAR ═══ */}
      <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",padding:"6px 16px",gap:10,background:"var(--bg-topbar)",borderBottom:"1px solid var(--border)",flexShrink:0,height:"var(--top-h)",overflow:"hidden"}}>
        {/* Faction badge */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginRight:4,flexShrink:0}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:myFaction.color+"22",border:`2px solid ${myFaction.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:myFaction.color,fontFamily:"'Bitter',serif"}}>{myFaction.name[0]}</div>
          <div style={{lineHeight:1.2}}>
            <div style={{fontSize:14,fontWeight:700,color:myFaction.color,fontFamily:"'Bitter',serif"}}>{myFaction.name}</div>
            <div style={{fontSize:11,color:"var(--text-dim)"}}>{myMat.name} · T{turn}</div>
          </div>
        </div>
        {botRunning&&<span style={{color:"var(--gold)",fontSize:12,animation:"pulse 1s infinite",marginRight:4}}>⚙ IA…</span>}
        {/* Divider */}
        <div style={{width:1,height:28,background:"var(--border-light)",flexShrink:0}}/>
        {/* Resource counters - redesigned */}
        {(()=>{
          const totalRes=(t)=>{let s=0;Object.values(me.resources).forEach(r=>{if(r[t])s+=r[t];});return s;};
          const stats=[
            {icon:"💰",val:me.coins,color:"var(--gold)",label:"$"},
            {icon:"🃏",val:me.combatCards,color:"#bbaacc",label:"CC"},
            {icon:"⚙",val:totalRes("metal"),color:"#99aabb",label:"Mét"},
            {icon:"🪵",val:totalRes("bois"),color:"#7aaa55",label:"Bois"},
            {icon:"🌽",val:totalRes("nourriture"),color:"#d4b050",label:"Nour"},
            {icon:"🛢",val:totalRes("petrole"),color:"#8a90a0",label:"Pét"},
            {icon:"👤",val:me.workers.length,color:"#c89966",label:"Ouv"},
            {icon:"⬡",val:me.mechs.length,color:"#99aabb",label:"Mech"},
          ];
          return stats.map((s,i)=>(
            <div key={i} className="res-pill" title={s.label}>
              <span className="res-icon">{s.icon}</span>
              <span className="res-val" style={{color:s.color}}>{s.val}</span>
            </div>
          ));
        })()}
        {/* Stars - right side */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4}}>
          {me.factoryCard&&<div style={{fontSize:12,padding:"4px 10px",borderRadius:4,background:me.factoryCard.type==="tesla"?"#7050a022":"#4a5a6a22",border:me.factoryCard.type==="tesla"?"1px solid #7050a0":"1px solid #4a5a6a",color:me.factoryCard.type==="tesla"?"#b080e0":"#8aa0b8"}} title={me.factoryCard.desc}>{me.factoryCard.name}</div>}
          {(me.fragments||0)>0&&<div style={{fontSize:12,padding:"4px 10px",borderRadius:4,background:"rgba(100,60,200,0.15)",border:"1px solid #6040a0",color:"#a080d0"}}>🔬{me.fragments}/2</div>}
          <button onClick={()=>setShowStars(s=>!s)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:6,fontSize:13,fontWeight:700,background:showStars?"var(--gold)":"rgba(255,215,0,0.08)",color:showStars?"var(--bg)":"#C9A84C",border:"1px solid rgba(255,215,0,0.3)",fontFamily:"'Bitter',serif"}}>
            ⭐ {me.stars}/6
          </button>
          <button onClick={()=>setShowRules(true)} title="Regles du jeu" style={{padding:"5px 10px",borderRadius:6,fontSize:13,fontWeight:700,background:"transparent",color:"var(--text-muted)",border:"1px solid var(--border)",fontFamily:"'Bitter',serif"}}>?</button>
        </div>
      </div>

      {/* ═══ LEFT: POWER + POPULARITY TRACKS ═══ */}
      <div style={{display:"flex",gap:4,background:"linear-gradient(180deg,var(--bg-panel),#0a0906)",borderRight:"1px solid var(--border)",padding:"4px 4px",overflow:"hidden"}}>
        {/* Power track */}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{fontSize:8,color:"#cc9988",letterSpacing:1,textTransform:"uppercase",marginBottom:4,fontFamily:"'Bitter',serif",fontWeight:700}}>Pui</div>
          <div style={{flex:1,display:"flex",flexDirection:"column-reverse",gap:1,width:"100%"}}>
            {Array.from({length:17},(_,i)=>i).map(v=>(
              <div key={v} style={{
                flex:1,minHeight:0,width:"100%",borderRadius:2,
                background:v<=me.power?"linear-gradient(90deg,#8b2020,#bb3838)":"rgba(255,255,255,0.03)",
                border:v<=me.power?"1px solid #dd4444":"1px solid rgba(255,255,255,0.04)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:8,fontWeight:v===me.power?900:400,
                color:v<=me.power?"#fff":"#3a2a2a",
                boxShadow:v===me.power?"0 0 6px rgba(220,50,30,0.5)":"none",
              }}>{v%2===0?v:""}</div>
            ))}
          </div>
          <div style={{fontSize:16,fontWeight:700,color:"#dd6644",marginTop:4,fontFamily:"'Bitter',serif"}}>{me.power}</div>
        </div>
        {/* Popularity track */}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{fontSize:8,color:"#ccaa77",letterSpacing:1,textTransform:"uppercase",marginBottom:4,fontFamily:"'Bitter',serif",fontWeight:700}}>Pop</div>
          <div style={{flex:1,display:"flex",flexDirection:"column-reverse",gap:1,width:"100%"}}>
            {Array.from({length:19},(_,i)=>i).map(v=>{
              const tier=v<=6?0:v<=12?1:2;
              const tierColors=["#8a6020","#b88030","#d0a040"];
              return(
                <div key={v} style={{
                  flex:1,minHeight:0,width:"100%",borderRadius:2,
                  background:v<=me.pop?`linear-gradient(90deg,${tierColors[tier]}cc,${tierColors[tier]})`:"rgba(255,255,255,0.03)",
                  border:v<=me.pop?`1px solid ${tierColors[tier]}`:"1px solid rgba(255,255,255,0.04)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:8,fontWeight:v===me.pop?900:400,
                  color:v<=me.pop?"#fff":"#2a2010",
                  boxShadow:v===me.pop?"0 0 6px rgba(200,160,60,0.5)":"none",
                  borderLeft:v===7||v===13?`2px solid ${tierColors[tier]}88`:"none",
                }}>{v%2===0?v:""}</div>
              );
            })}
          </div>
          <div style={{fontSize:16,fontWeight:700,color:"#d0a040",marginTop:4,fontFamily:"'Bitter',serif"}}>{me.pop}</div>
        </div>
      </div>

      {/* ═══ CENTER: MAP + OVERLAYS ═══ */}
      <div style={{position:"relative",overflow:"hidden",background:"radial-gradient(ellipse at 50% 45%,#16140e,var(--bg-map))",cursor:isPanning?"grabbing":"default"}}>
        {/* Zoom controls */}
        <div style={{position:"absolute",top:8,right:8,zIndex:5,display:"flex",flexDirection:"column",gap:4}}>
          <button onClick={()=>mapZoom(1/1.3)} style={{width:32,height:32,borderRadius:6,border:"1px solid var(--border)",background:"rgba(14,12,8,0.85)",color:"var(--gold)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>+</button>
          <button onClick={()=>mapZoom(1.3)} style={{width:32,height:32,borderRadius:6,border:"1px solid var(--border)",background:"rgba(14,12,8,0.85)",color:"var(--gold)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>−</button>
          <button onClick={mapReset} style={{width:32,height:32,borderRadius:6,border:"1px solid var(--border)",background:"rgba(14,12,8,0.85)",color:"var(--text-dim)",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>⟲</button>
        </div>
        <div style={{position:"absolute",bottom:6,left:8,zIndex:5,fontSize:10,color:"var(--text-muted)",opacity:0.5,pointerEvents:"none"}}>Molette: zoom · Shift+clic: panoramique</div>
        {/* SVG Map */}
        <svg ref={mapRef} viewBox={`${mapView.x} ${mapView.y} ${mapView.w} ${mapView.h}`} style={{width:"100%",height:"100%",display:"block",minHeight:"100%"}}
          onPointerDown={handleMapPointerDown} onPointerMove={handleMapPointerMove} onPointerUp={handleMapPointerUp} onPointerLeave={handleMapPointerUp}>
          <defs>
            {Object.entries(TERRAINS).map(([key,t])=>(
              <radialGradient key={`tg-${key}`} id={`tg-${key}`} cx="38%" cy="30%" r="72%">
                <stop offset="0%" stopColor={t.grad[0]}/><stop offset="50%" stopColor={t.grad[1]}/><stop offset="100%" stopColor={t.grad[2]}/>
              </radialGradient>
            ))}
            <pattern id="tp-montagne" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7L7 0L14 7" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.7"/></pattern>
            <pattern id="tp-sierra" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7L7 0L14 7" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.7"/></pattern>
            <pattern id="tp-foret" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="3" fill="rgba(0,0,0,0.14)"/><circle cx="14" cy="13" r="2.5" fill="rgba(0,0,0,0.1)"/></pattern>
            <pattern id="tp-village" width="16" height="16" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="4.5" height="5" fill="rgba(0,0,0,0.12)" rx="0.5"/></pattern>
            <pattern id="tp-champs" width="12" height="12" patternUnits="userSpaceOnUse"><line x1="0" y1="4" x2="12" y2="4" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5"/><line x1="0" y1="8" x2="12" y2="8" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5"/></pattern>
            <pattern id="tp-plaine" width="12" height="12" patternUnits="userSpaceOnUse"><line x1="0" y1="6" x2="12" y2="6" stroke="rgba(0,0,0,0.05)" strokeWidth="0.4"/></pattern>
            <pattern id="tp-toundra" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="0.6" fill="rgba(255,255,255,0.06)"/></pattern>
            <pattern id="tp-desert" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="0.5" fill="rgba(0,0,0,0.06)"/></pattern>
            <pattern id="tp-lac" width="24" height="10" patternUnits="userSpaceOnUse"><path d="M0 5Q6 3 12 5Q18 7 24 5" fill="none" stroke="rgba(200,220,255,0.1)" strokeWidth="0.8"/></pattern>
            <pattern id="tp-marecage" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M0 10Q5 8 10 10Q15 12 20 10" fill="none" stroke="rgba(200,255,200,0.06)" strokeWidth="0.6"/></pattern>
            <pattern id="tp-factory" width="14" height="14" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="14" y2="14" stroke="rgba(255,180,80,0.08)" strokeWidth="0.4"/><line x1="14" y1="0" x2="0" y2="14" stroke="rgba(255,180,80,0.08)" strokeWidth="0.4"/></pattern>
            <filter id="desat"><feColorMatrix type="saturate" values="0.3"/><feComponentTransfer><feFuncR type="linear" slope="0.8"/><feFuncG type="linear" slope="0.8"/><feFuncB type="linear" slope="0.8"/></feComponentTransfer></filter>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="softglow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <radialGradient id="hero-aura"><stop offset="0%" stopColor="#C9A84C" stopOpacity="0.3"/><stop offset="60%" stopColor="#C9A84C" stopOpacity="0.05"/><stop offset="100%" stopColor="#C9A84C" stopOpacity="0"/></radialGradient>
            <radialGradient id="empire-aura"><stop offset="0%" stopColor="#1A3A6A" stopOpacity="0.4"/><stop offset="50%" stopColor="#ff0000" stopOpacity="0.1"/><stop offset="100%" stopColor="#ff0000" stopOpacity="0"/></radialGradient>
            <radialGradient id="mapvig" cx="50%" cy="47%" r="56%"><stop offset="0%" stopColor="transparent"/><stop offset="75%" stopColor="rgba(10,8,4,1)" stopOpacity="0.2"/><stop offset="100%" stopColor="rgba(10,8,4,1)" stopOpacity="0.75"/></radialGradient>
          </defs>
          <rect x="20" y="20" width="980" height="990" fill="#0b0a07"/>
          <rect x="20" y="20" width="980" height="990" fill="url(#mapvig)"/>
          {/* Compass */}
          <g transform="translate(920,90)" opacity={0.2}>
            <circle r="20" fill="none" stroke="#c9a84c" strokeWidth="0.5"/>
            <polygon points="0,-22 -3,-6 0,-8 3,-6" fill="#c9a84c" opacity="0.9"/>
            <text y="-26" textAnchor="middle" fontSize="7" fill="#c9a84c" style={{fontFamily:"'Bitter',serif"}}>N</text>
          </g>
          {/* Rivers */}
          {RIVERS.map(([a,b],i)=>{const g=edgeGeo(a,b,hMap);if(!g)return null;return(
            <React.Fragment key={`r${i}`}>
              <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="#0a2a50" strokeWidth={10} strokeLinecap="round" opacity={0.5}/>
              <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="#1a5590" strokeWidth={5} strokeLinecap="round" opacity={0.6}/>
              <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="#4098d0" strokeWidth={2.5} strokeLinecap="round" opacity={0.5}/>
              <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="#60b8f0" strokeWidth={1.2} strokeLinecap="round" opacity={0.2} strokeDasharray="4 12" style={{animation:"riverFlow 3s linear infinite"}}/>
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
              if(!toH)return null;
              return <line key={`rp${aid}`} x1={fromH.rx} y1={fromH.ry} x2={toH.rx} y2={toH.ry} stroke="#C9A84C" strokeWidth={6} strokeLinecap="round" opacity={0.3} strokeDasharray="4 3"><animate attributeName="opacity" values="0.15;0.55;0.15" dur="1.2s" repeatCount="indefinite"/></line>;
            });
          })()}
          {/* Hexes */}
          {HEXES.map(hex=>{
            const isV=validMoves.has(hex.id);const isSel=selHex===hex.id;const isHov=hovHex===hex.id;
            const units=allHexContents[hex.id]||[];
            const empHere=Object.entries(empire).filter(([_,hid])=>hid===hex.id);
            const isFactory=hex.t==="factory";
            return(<g key={hex.id} onMouseEnter={()=>setHovHex(hex.id)} onMouseLeave={()=>setHovHex(null)} onClick={()=>handleHexClick(hex.id)} style={{cursor:"pointer"}}>
              <HexTerrain hex={hex} isV={isV} isSel={isSel} isHov={isHov} isFactory={isFactory}/>
              {/* Terrain label removed — TerrainDecor provides visual identification */}
              <text x={hex.rx} y={hex.ry+32} textAnchor="middle" fontSize={6.5} fill="#4a4030" opacity={0.2} style={{fontFamily:"'Source Serif 4',serif",pointerEvents:"none"}}>#{hex.id}</text>
              {units.length>0&&(()=>{const fc=units[0].factionId;const c=FACTIONS[fc]?.color||"#888";return <FactionHalo cx={hex.rx} cy={hex.ry+6} color={c} r={22}/>;})()}
              {units.map((u,ui)=>{
                const ox=(ui-(units.length-1)/2)*24;
                return <UnitToken key={u.id} type={u.type} cx={hex.rx+ox} cy={hex.ry+6} color={u.color} label={u.label} icon={u.icon} factionId={u.factionId}/>;
              })}
              {(()=>{
                const pRes=players.reduce((acc,pl)=>{const r=pl.resources[String(hex.id)];if(r)Object.entries(r).forEach(([rt,cnt])=>{acc[rt]=(acc[rt]||0)+cnt;});return acc;},{});
                return Object.entries(pRes).map(([rt,cnt],ri)=>
                  <ResourceToken key={rt} cx={hex.rx+26} cy={hex.ry-22+ri*18} resType={rt} count={cnt}/>
                );
              })()}
              {empHere.map(([eid],ei)=>
                <EmpireMecha key={eid} cx={hex.rx-16+ei*16} cy={hex.ry-20} eid={eid}/>
              )}
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
              {encounterTokens.has(hex.id)&&(
                <g style={{pointerEvents:"none"}}>
                  <circle cx={hex.rx+26} cy={hex.ry+24} r={11} fill="rgba(6,5,3,0.6)"/>
                  <circle cx={hex.rx+26} cy={hex.ry+24} r={10} fill="rgba(201,168,76,0.25)" stroke="#c9a84c" strokeWidth={1.5}/>
                  <text x={hex.rx+26} y={hex.ry+29} textAnchor="middle" fontSize={14} fill="#c9a84c" fontWeight={700}>?</text>
                </g>
              )}
            </g>);
          })}
          {/* Hex click ripple */}
          {clickRipple&&(()=>{
            const rh=hMap[clickRipple.hexId];
            if(!rh)return null;
            return <circle key={clickRipple.key} cx={rh.rx} cy={rh.ry} r={5} fill="none" stroke="#c9a84c" strokeWidth={2} opacity={0.6}>
              <animate attributeName="r" from="5" to="45" dur="0.5s" fill="freeze"/>
              <animate attributeName="opacity" from="0.6" to="0" dur="0.5s" fill="freeze"/>
            </circle>;
          })()}
          {/* Home Bases */}
          {Object.entries(HOME_BASES).map(([fid,hb])=>{
            const fc=FACTIONS[fid];if(!fc)return null;const isMe=fid===me.faction;
            return(<g key={fid} opacity={isMe?1:0.2}>
              <line x1={hb.rx} y1={hb.ry-16} x2={hb.rx} y2={hb.ry+16} stroke={fc.color} strokeWidth={isMe?1.5:0.5} opacity={0.5}/>
              <path d={`M${hb.rx} ${hb.ry-14} L${hb.rx+30} ${hb.ry-8} L${hb.rx+28} ${hb.ry} L${hb.rx} ${hb.ry+6} Z`} fill={isMe?fc.color+"44":fc.color+"15"} stroke={fc.color} strokeWidth={isMe?1.5:0.6}/>
              <text x={hb.rx+14} y={hb.ry-1} textAnchor="middle" fontSize={isMe?9:7} fill={fc.color} fontWeight={isMe?700:400} style={{fontFamily:"'Bitter',serif"}}>{fc.name.slice(0,8)}</text>
              <circle cx={hb.rx} cy={hb.ry-16} r={isMe?2.5:1.5} fill={fc.color}/>
            </g>);
          })}
          {/* Watermark */}
          <g opacity={0.04} style={{fontFamily:"'Bitter',serif"}}>
            <text x="510" y="505" textAnchor="middle" fontSize="80" fill="#c9a84c" letterSpacing="25">1920+</text>
          </g>
        </svg>

        {/* ═══ MODAL OVERLAYS (combat/encounter/RR) ═══ */}
        {(combat||encounter||rougeRiver)&&(
          <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}>
            <div style={{maxWidth:460,width:"92%",maxHeight:"80vh",overflow:"auto",borderRadius:12,border:"1px solid var(--border-light)",boxShadow:"0 10px 50px rgba(0,0,0,0.8)"}}>

              {/* COMBAT CHOOSE */}
              {combat&&combat.phase==="choose"&&(()=>{
                const maxPower=Math.min(me.power,7);
                // Scythe rule: max 1 combat card per hero/mech involved
                const combatUnits=(combat.moveData.unitType==="hero"?1:0)+me.mechs.filter(m=>m.hexId===combat.hexId).length+(combat.moveData.unitType==="mech"?1:0);
                // Combat ability bonus (slot 2)
                const isAttacker=true; // player is always attacker (moved into enemy)
                const cBonus=getCombatBonus(me, combat.hexId, isAttacker);
                const maxCards=Math.min(me.combatCards, combatUnits + cBonus.cardBonus);
                const total=combat.powerSpend + cBonus.powerBonus + (combat.cardsSpend*2);
                const isPve=combat.type==="pve";
                const enemy=!isPve?players[combat.enemyIdx]:null;
                const ef=enemy?FACTIONS[enemy.faction]:null;
                return(
                  <div className="combat-panel" style={{padding:"24px",background:"linear-gradient(180deg,#1a0c08,var(--bg2))",borderRadius:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
                      <div style={{width:50,height:50,borderRadius:"50%",background:isPve?"rgba(180,30,15,0.2)":"rgba(200,100,30,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,border:isPve?"2px solid #1A3A6A":"2px solid "+(ef?ef.color:"#888"),flexShrink:0}}>⚔</div>
                      <div>
                        <div style={{fontFamily:"'Bitter',serif",color:isPve?"#2A5A8A":ef.color,fontSize:18,fontWeight:700}}>{isPve?combat.empireCard.name:`Combat vs ${ef.name}`}</div>
                        <div style={{fontSize:12,color:"var(--text-muted)",marginTop:3}}>{isPve?`Force Empire: ${combat.empireCard.power}`:"L'adversaire choisit secrètement…"}</div>
                      </div>
                    </div>
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:12,color:"var(--brass)",marginBottom:8,fontWeight:600}}>⚡ Puissance ({combat.powerSpend}/{maxPower})</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{Array.from({length:maxPower+1},(_,i)=>i).map(v=>(
                        <button key={v} onClick={()=>setCombat(prev=>({...prev,powerSpend:v}))} className={`dial-btn ${combat.powerSpend===v?"on":"off"}`}>{v}</button>
                      ))}</div>
                    </div>
                    {maxCards>0&&<div style={{marginBottom:14}}>
                      <div style={{fontSize:12,color:"var(--brass)",marginBottom:8,fontWeight:600}}>🃏 Cartes combat ({combat.cardsSpend}/{maxCards}) <span style={{fontWeight:400,color:"var(--text-muted)"}}>+2 chacune</span></div>
                      <div style={{display:"flex",gap:5}}>{Array.from({length:maxCards+1},(_,i)=>i).map(v=>(
                        <button key={v} onClick={()=>setCombat(prev=>({...prev,cardsSpend:v}))} className={`dial-btn ${combat.cardsSpend===v?"on":"off"}`}>{v}</button>
                      ))}</div>
                    </div>}
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,padding:"12px 16px",background:"rgba(0,0,0,0.4)",borderRadius:10,border:"1px solid var(--border)"}}>
                      <span style={{fontSize:22,fontWeight:900,color:"var(--gold)",fontFamily:"'Bitter',serif"}}>{total}</span>
                      <span style={{fontSize:12,color:"var(--text-muted)"}}>{combat.powerSpend}{cBonus.powerBonus>0?`+${cBonus.powerBonus}`:""}⚡ + {combat.cardsSpend}×2🃏</span>
                      {cBonus.name&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(200,160,60,0.15)",border:"1px solid var(--gold-dim)",color:"var(--gold)"}}>{cBonus.name}{cBonus.powerBonus>0?` +${cBonus.powerBonus}⚡`:""}{cBonus.cardBonus>0?` +${cBonus.cardBonus}🃏`:""}</span>}
                      {isPve&&<span style={{fontSize:16,fontWeight:700,marginLeft:"auto",color:total>=combat.empireCard.power?"var(--success)":"#ff4444"}}>{total>=combat.empireCard.power?"✓":"✗"} vs {combat.empireCard.power}</span>}
                    </div>
                    <button onClick={resolveCombat} style={{width:"100%",padding:"14px",fontSize:15,fontWeight:700,fontFamily:"'Bitter',serif",letterSpacing:3,textTransform:"uppercase",background:"linear-gradient(135deg,#8b2020,#6b1515)",color:"#fff",border:"none",borderRadius:10,boxShadow:"0 3px 20px rgba(140,30,20,0.5)"}}>⚔ Combattre</button>
                  </div>
                );
              })()}

              {/* COMBAT REWARD */}
              {combat&&combat.phase==="reward"&&(
                <div className="reward-panel" style={{padding:"24px",background:"linear-gradient(180deg,#0c1a0c,var(--bg2))",borderRadius:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                    <span style={{fontSize:32}}>🏆</span>
                    <div><div style={{fontFamily:"'Bitter',serif",color:"var(--success)",fontSize:20,fontWeight:700}}>Victoire !</div><div style={{fontSize:12,color:"var(--text-dim)"}}>Choisissez votre butin</div></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                    {[{k:"metal",icon:"⚙",label:"2 Métal",sub:"Ferraille"},{k:"pop",icon:"♥",label:"+2 Pop",sub:"Acclamation"},{k:"fragment",icon:"🔬",label:"Fragment",sub:`Tesla (${(me.fragments||0)}/2)`}].map(r=>(
                      <button key={r.k} onClick={()=>claimReward(r.k)} style={{background:"var(--bg3)",border:"1px solid var(--border-light)",borderRadius:10,padding:"18px 10px",color:"var(--text)",textAlign:"center",fontFamily:"inherit"}}>
                        <div style={{fontSize:26,marginBottom:8}}>{r.icon}</div>
                        <div style={{fontSize:13,fontWeight:700}}>{r.label}</div>
                        <div style={{fontSize:10,color:"var(--text-muted)",marginTop:4}}>{r.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ENCOUNTER */}
              {encounter&&(
                <div style={{padding:"20px",background:"linear-gradient(180deg,#1a1608,var(--bg2))",borderRadius:10,border:"1px solid var(--gold-dim)",animation:"slideUp 0.35s ease"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:16}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(201,168,76,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:"2px solid var(--gold)",flexShrink:0}}>📜</div>
                    <div>
                      <div style={{fontFamily:"'Bitter',serif",color:"var(--gold)",fontSize:16,fontWeight:700}}>{encounter.card.name}</div>
                      <div style={{fontSize:11,color:"var(--text-dim)",lineHeight:1.6,marginTop:4,fontStyle:"italic"}}>{encounter.card.desc}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {encounter.card.choices.map((c,ci)=>(
                      <button key={ci} onClick={()=>resolveEncounter(ci)} className="enc-card">
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:20,width:28,textAlign:"center"}}>{c.icon}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{c.label}</div>
                            <div style={{fontSize:10,color:"var(--brass)",marginTop:2}}>{c.desc}</div>
                          </div>
                          <span style={{fontSize:16,color:"var(--gold-dim)"}}>›</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ROUGE RIVER */}
              {rougeRiver&&(
                <div style={{padding:"20px",background:"linear-gradient(180deg,#1a0a08,var(--bg2))",borderRadius:10,border:"1px solid #6b1010",animation:"slideUp 0.35s ease"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(139,32,32,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:"2px solid #8b2020",flexShrink:0}}>⚙</div>
                    <div>
                      <div style={{fontFamily:"'Bitter',serif",color:"#cc4433",fontSize:16,fontWeight:700}}>Rouge River</div>
                      <div style={{fontSize:10,color:"var(--text-dim)"}}>
                        {rougeRiver.hasFragments?<span>Plans Ford <span style={{color:"#9060c0",fontWeight:700}}>+ Tesla</span></span>:"Plans Ford"} — Choisissez 1 carte
                      </div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:8,maxHeight:250,overflowY:"auto"}}>
                    {rougeRiver.cards.map(card=>(
                      <button key={card.id} onClick={()=>pickFactoryCard(card)} className={`rr-card ${card.type}`}>
                        {card.type==="tesla"&&<div style={{position:"absolute",top:4,right:6,fontSize:10,color:"#b080e0",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Tesla</div>}
                        {card.type==="ford"&&<div style={{position:"absolute",top:4,right:6,fontSize:10,color:"#7a9ab0",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Ford</div>}
                        <div style={{fontFamily:"'Bitter',serif",fontSize:13,fontWeight:700,color:card.type==="tesla"?"#c090e0":"#a0b8cc",marginBottom:5,paddingRight:30}}>{card.name}</div>
                        <div style={{fontSize:11,color:"var(--text-dim)",lineHeight:1.5}}>{card.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* ═══ RIGHT PANEL: SCOREBOARD + ACTIONS + DROPDOWNS ═══ */}
      <div style={{display:"flex",flexDirection:"column",background:"linear-gradient(180deg,var(--bg-panel),#0a0906)",borderLeft:"1px solid var(--border)",overflow:"hidden"}}>

        {/* ── Scoreboard ── */}
        <div style={{padding:"6px 8px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          {players.map((p,i)=>{const fc=FACTIONS[p.faction];const isActive=i===currentP;return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 6px",borderRadius:4,
              background:isActive?"rgba(201,168,76,0.06)":"transparent",
              borderLeft:isActive?`3px solid ${fc.color}`:"3px solid transparent",
              animation:isActive&&i>0?"botPulse 1.5s ease infinite":"none",
              marginBottom:2,
            }}>
              <div style={{width:8,height:8,borderRadius:"50%",background:fc.color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:700,color:fc.color,fontFamily:"'Bitter',serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{fc.name.slice(0,8)}{isActive&&<span style={{color:"var(--gold)",marginLeft:4}}>◀</span>}</div>
              </div>
              <div style={{fontSize:10,color:"var(--text-dim)",whiteSpace:"nowrap",fontFamily:"var(--font-mono)"}}>⚡{p.power} ♥{p.pop} ⭐{p.stars}</div>
            </div>
          );})}
        </div>

        {/* Star tracker (toggled) */}
        {showStars&&(()=>{
          const stars=[
            {icon:"⬆",name:"Upg",prog:`${me.upgrades||0}/6`,done:(me.upgrades||0)>=6},
            {icon:"⬡",name:"Mech",prog:`${me.mechs.length}/4`,done:me.mechs.length>=4},
            {icon:"🏗",name:"Bât",prog:`${(me.buildings||[]).length}/4`,done:(me.buildings||[]).length>=4},
            {icon:"🤝",name:"Recr",prog:`${me.recruits||0}/4`,done:(me.recruits||0)>=4},
            {icon:"⚔",name:"Cmbt",prog:`${Math.min(me.combatWins||0,2)}/2`,done:(me.combatWins||0)>=2},
            {icon:"🎯",name:"Obj",prog:me.objectiveRevealed?"✓":"…",done:me.objectiveRevealed},
            {icon:"🏛",name:"Fact",prog:me.fObjRevealed?"✓":"…",done:me.fObjRevealed},
            {icon:"♥",name:"Pop18",prog:`${me.pop}/18`,done:me.pop>=18},
            {icon:"⚡",name:"Pui16",prog:`${me.power}/16`,done:me.power>=16},
          ];
          return(
            <div style={{padding:"4px 8px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2}}>
                {stars.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:3,padding:"2px 4px",borderRadius:3,fontSize:9,whiteSpace:"nowrap",background:s.done?"rgba(76,175,80,0.1)":"transparent",border:s.done?"1px solid rgba(76,175,80,0.2)":"1px solid transparent"}}>
                    <span style={{fontSize:10}}>{s.done?"⭐":s.icon}</span>
                    <span style={{color:s.done?"#4A8A4A":"var(--text-dim)"}}>{s.name}</span>
                    {!s.done&&<span style={{color:"var(--gold)",fontWeight:700,fontSize:9}}>{s.prog}</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Actions area ── */}
        <div style={{flex:1,overflow:"auto",padding:0}}>

          {/* Player mat — 4 vertical action cards, grouped: columns 0+1 (top pair) / columns 2+3 (bottom pair) with strong separator */}
          {isMyTurn&&!combat&&!encounter&&!rougeRiver&&!selAction&&!pendingBottom&&(
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {myMat.topRow.map((action,i)=>{
                const disabled=me.lastCol===i;
                const bottomAction=BOTTOM[i];
                const costs=getBottomCost(me);
                const bc=costs[i];
                const mat=MATS.find(m=>m.id===me.matId);
                const cubesTop=(me.cubesOnTop||[])[i]||0;
                const cubesBot=(me.cubesOnBottom||[])[i]||0;
                const maxBot=(mat?.bottomSlots||[])[i]||0;
                const topActionRow={
                  Move:{pay:[],gain:["worker","worker"],altGain:null,label:"Move"},
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
                const bottomPay=bc?Array(bc.qty).fill(bc.res):[];
                // Action group separator: strong between pairs (after index 1), light between actions within a pair (after index 0, 2)
                const isGroupEnd=i===1;
                const isLastAction=i===3;
                return(
                  <React.Fragment key={action}>
                  <button onClick={()=>{if(!disabled){setPreActionSnapshot({...players[0],workers:[...players[0].workers.map(w=>({...w}))],mechs:[...players[0].mechs.map(m=>({...m}))],buildings:[...(players[0].buildings||[]).map(b=>({...b}))],resources:{...Object.fromEntries(Object.entries(players[0].resources).map(([k,v])=>[k,{...v}]))},movedUnits:[...(players[0].movedUnits||[])]});setSelAction(action);}}}
                    onMouseEnter={e=>{if(!disabled)e.currentTarget.style.background="rgba(201,168,76,0.06)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background=disabled?"rgba(0,0,0,0.3)":"transparent";}}
                    style={{
                    padding:0,background:disabled?"rgba(0,0,0,0.3)":"transparent",
                    border:"none",
                    color:disabled?"var(--text-muted)":"var(--text)",
                    opacity:disabled?0.2:1,cursor:disabled?"not-allowed":"pointer",
                    display:"flex",flexDirection:"column",
                    transition:"all 0.2s ease",
                  }}>
                    {/* TOP ACTION */}
                    <div style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:8,background:"linear-gradient(180deg,rgba(30,27,20,0.8),rgba(22,20,14,0.6))"}}>
                      <div style={{minWidth:0,flex:1}}>
                        <div style={{fontSize:11,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:"var(--gold-dim)",marginBottom:4,fontFamily:"'Bitter',serif"}}>{action}</div>
                        <ActionRow pay={topActionRow.pay} gain={topActionRow.gain} altGain={topActionRow.altGain} compact />
                      </div>
                      <CubeSlots total={cubesTop} filled={cubesTop} />
                    </div>
                    {/* INNER SEPARATOR (top↔bottom within same column) */}
                    <div style={{height:2,background:`linear-gradient(90deg,transparent,${myFaction?.color||"var(--gold)"}66,transparent)`}}/>
                    {/* BOTTOM ACTION */}
                    <div style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:8,background:"linear-gradient(180deg,rgba(14,12,8,0.6),rgba(10,9,6,0.8))"}}>
                      <div style={{minWidth:0,flex:1}}>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--text-dim)",marginBottom:3}}>{bottomAction}</div>
                        <ActionRow pay={bottomPay} gain={[bottomAction==="Upgrade"?"power":bottomAction==="Deploy"?"mech":bottomAction==="Build"?"worker":"pop"]} compact />
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                        <CubeSlots total={maxBot} filled={cubesBot} />
                        <span style={{fontSize:10,fontWeight:600,color:bottomData.max?"var(--success)":"var(--text-muted)",whiteSpace:"nowrap"}}>{bottomData.max?"✓ max":bottomData.prog}</span>
                      </div>
                    </div>
                  </button>
                  {/* GROUP SEPARATOR: strong between action pairs, light within pair */}
                  {!isLastAction&&(isGroupEnd
                    ?<div style={{height:6,background:"var(--bg)",borderTop:"2px solid var(--gold-dim)",borderBottom:"1px solid var(--border)",opacity:0.7}}/>
                    :<div style={{height:1,background:"var(--border)"}}/>
                  )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Action detail panels */}
          {isMyTurn&&!combat&&!encounter&&!rougeRiver&&selAction&&(
            <div style={{padding:"12px 16px",fontSize:12,animation:"slideUp 0.25s ease"}}>
              {selAction==="Move"&&(
                <div>
                  <div style={{color:"var(--gold)",fontFamily:"'Bitter',serif",fontWeight:700,marginBottom:8,fontSize:14}}>Déplacement ({(me.movedUnits||[]).length}/2)</div>
                  <button onClick={()=>{setPlayers(prev=>{const n=[...prev];n[0]={...n[0],coins:n[0].coins+1};return n;});addLog(`💰 +1$`);endHumanTurn(myMat.topRow.indexOf("Move"));}} className="act-btn" style={{marginBottom:8,background:"var(--bg2)",border:`1px solid var(--gold-dim)`,width:"100%"}}>💰 Gagner 1$ (pas de déplacement)</button>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {!(me.movedUnits||[]).includes("hero")&&<button onClick={()=>doMove("hero","hero",me.hero)} className="act-btn" style={{borderColor:myFaction.color+"66"}}>★ {myFaction.hero} <span style={{opacity:0.5}}>#{me.hero}</span></button>}
                    {me.workers.filter(w=>!(me.movedUnits||[]).includes(w.id)).map(w=><button key={w.id} onClick={()=>doMove("worker",w.id,w.hexId)} className="act-btn" style={{borderColor:myFaction.color+"66"}}>● #{w.hexId}</button>)}
                    {me.mechs.filter(m=>!(me.movedUnits||[]).includes(m.id)).map(m=><button key={m.id} onClick={()=>doMove("mech",m.id,m.hexId)} className="act-btn" style={{borderColor:myFaction.color+"66"}}>⬡ #{m.hexId}</button>)}
                  </div>
                  {moveSource&&<div style={{color:"#C9A84C",fontSize:11,marginTop:8,fontStyle:"italic"}}>Sélectionnez un hex doré sur la carte</div>}
                  {/* PACK UP — Nations free building move */}
                  {me.faction==="nations"&&(me.unlockedAbilities||[]).includes(3)&&(me.buildings||[]).length>0&&!me.packUpUsed&&!moveSource&&(()=>{
                    if(bottomPick&&bottomPick.packUp){
                      const bld=(me.buildings||[])[bottomPick.buildingIdx];
                      const adjTargets=(ADJ[bld.hexId]||[]).filter(id=>{const h=hMap[id];return h&&h.t!=="lac"&&h.t!=="marecage"&&!(me.buildings||[]).some(b=>b.hexId===id);});
                      const bt=BUILDING_TYPES.find(t=>t.type===bld.type);
                      return <div style={{marginTop:8,padding:"8px 10px",borderRadius:6,border:"1px solid var(--nations)",background:"rgba(32,178,170,0.06)"}}>
                        <div style={{fontSize:12,color:"var(--nations)",marginBottom:6}}>📦 Pack Up — déplacer {bt?bt.icon:""} {bt?bt.name:""} depuis #{bld.hexId}</div>
                        {adjTargets.length>0?<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{adjTargets.map(hid=><button key={hid} onClick={()=>doPackUpMove(bottomPick.buildingIdx,hid)} className="act-btn" style={{borderColor:"var(--nations)"}}>→ #{hid}</button>)}</div>:<div style={{fontSize:10,color:"var(--text-muted)"}}>Aucun hex adjacent libre</div>}
                        <button onClick={()=>setBottomPick(null)} className="act-btn" style={{marginTop:6,fontSize:12,opacity:0.7,minHeight:36}}>← Annuler</button>
                      </div>;
                    }
                    return <div style={{marginTop:8}}>
                      <div style={{fontSize:12,color:"var(--nations)",marginBottom:4}}>📦 Pack Up (gratuit, 1×/tour) :</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{(me.buildings||[]).map((b,i)=>{const bt=BUILDING_TYPES.find(t=>t.type===b.type);return <button key={i} onClick={()=>setBottomPick({packUp:true,buildingIdx:i})} className="act-btn" style={{fontSize:12,borderColor:"var(--nations)",padding:"8px 12px"}}>{bt?bt.icon:"🏗"} #{b.hexId}</button>;})}</div>
                    </div>;
                  })()}
                  {me.packUpUsed&&me.faction==="nations"&&<div style={{marginTop:6,fontSize:10,color:"var(--text-muted)"}}>📦 Pack Up utilisé ce tour</div>}
                  {(me.movedUnits||[]).length>0&&(me.movedUnits||[]).length<2&&(
                    <button onClick={()=>{addLog("✅ Mouvement terminé");endHumanTurn(myMat.topRow.indexOf("Move"));}} className="act-btn" style={{marginTop:8,background:"#3a6a3a",color:"#fff",border:"none",width:"100%",fontWeight:700}}>Terminer ({(me.movedUnits||[]).length}/2)</button>
                  )}
                </div>
              )}
              {selAction==="Bolster"&&(<div>
                <div style={{color:"var(--gold)",fontFamily:"'Bitter',serif",fontWeight:700,marginBottom:8,fontSize:14}}>Soutien (1$)</div>
                {me.coins<1?<div style={{color:"#8A3030",fontSize:12}}>Pas assez d'$</div>:
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>doBolster("power")} className="act-btn" style={{flex:1}}>⚡ +2 Puissance</button>
                  <button onClick={()=>doBolster("cards")} className="act-btn" style={{flex:1}}>🃏 +1 Carte</button>
                </div>}
              </div>)}
              {selAction==="Produce"&&(<div>
                <div style={{color:"var(--gold)",fontFamily:"'Bitter',serif",fontWeight:700,marginBottom:8,fontSize:14}}>Production (max 2 hex)</div>
                {(()=>{
                  const nw=me.workers.length;const costStr=produceCostLabel(nw);const canPay=canPayProduce(me);const c=getProduceCost(nw);
                  return(<div>
                    <div style={{fontSize:11,color:canPay?"var(--text-dim)":"#ff5555",marginBottom:6}}>Coût: {costStr} ({nw} ouv.)</div>
                    {canPay?<button onClick={doProduce} className="act-btn" style={{width:"100%"}}>⚒ Produire</button>:<div style={{color:"#8A3030"}}>Insuffisant</div>}
                  </div>);
                })()}
              </div>)}
              {selAction==="Trade"&&(<div>
                <div style={{color:"var(--gold)",fontFamily:"'Bitter',serif",fontWeight:700,marginBottom:8,fontSize:14}}>Commerce (1$){tradePicks.length>0&&<span style={{fontWeight:400,fontSize:12,marginLeft:8}}>— choix {tradePicks.length}/2 : {tradePicks.map(r=>({metal:"⚙",bois:"🪵",nourriture:"🌽",petrole:"🛢"}[r])).join(" ")}</span>}</div>
                {me.coins<1?<div style={{color:"#8A3030",fontSize:12}}>Pas assez d'$</div>:
                <div>
                  <div style={{fontSize:11,color:"var(--text-dim)",marginBottom:6}}>Choisissez 2 ressources (même type ou différentes)</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                    {["metal","bois","nourriture","petrole"].map(r=><button key={r} onClick={()=>doTradePick(r)} className="act-btn" style={{flex:1,minWidth:60}}>{({metal:"⚙",bois:"🪵",nourriture:"🌽",petrole:"🛢"})[r]} {r}</button>)}
                  </div>
                  {tradePicks.length>0&&<button onClick={()=>setTradePicks([])} className="act-btn" style={{width:"100%",fontSize:11,opacity:0.7,marginBottom:6}}>↩ Recommencer le choix</button>}
                  <button onClick={()=>{setPlayers(prev=>{const n=[...prev];n[0]={...n[0],coins:n[0].coins-1,pop:Math.min(n[0].pop+1,18)};return n;});addLog("💰 -1$ → +1 Pop");setTradePicks([]);endHumanTurn(myMat.topRow.indexOf("Trade"));}} className="act-btn" style={{width:"100%"}}>♥ +1 Popularité</button>
                </div>}
              </div>)}
              <button onClick={()=>{if(preActionSnapshot){setPlayers(prev=>{const n=[...prev];n[0]=preActionSnapshot;return n;});}setSelAction(null);setMoveSource(null);setPreActionSnapshot(null);setTradePicks([]);addLog("↩ Action annulée");}} style={{marginTop:8,padding:"8px 16px",fontSize:12,background:"transparent",border:`1px solid var(--border)`,color:"var(--text-muted)",borderRadius:5,cursor:"pointer"}}>← Annuler</button>
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
            const buildableHexes=workerHexes.filter(h=>!(me.buildings||[]).some(b=>b.hexId===h));
            const mat=MATS.find(m=>m.id===me.matId);
            return(
              <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)",animation:"slideUp 0.25s ease"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <span style={{fontFamily:"'Bitter',serif",color:"var(--brass)",fontSize:14,fontWeight:700}}>▼ {ba}</span>
                  {bc&&<span style={{fontSize:11,color:hasRes&&!maxed?"var(--text-dim)":"#8A3030"}}>{maxed?"Maximum":` ${bc.qty} ${bc.res} (${resCount} dispo)`}</span>}
                </div>
                {/* UPGRADE — 2-step: pick top source then bottom dest */}
                {ba==="Upgrade"&&!maxed&&(()=>{
                  if(!hasRes) return <div style={{fontSize:11,color:"var(--text-muted)",fontStyle:"italic"}}>Pas assez de {bc.res}</div>;
                  const validTops=[];const validBottoms=[];
                  if(mat){
                    (me.cubesOnTop||[]).forEach((c,ci)=>{if(c>0)validTops.push(ci);});
                    (mat.bottomSlots||[]).forEach((s,ci)=>{if((me.cubesOnBottom||[])[ci]<s)validBottoms.push(ci);});
                  }
                  if(validTops.length===0||validBottoms.length===0) return <div style={{fontSize:11,color:"var(--text-muted)"}}>Plus de cubes disponibles</div>;
                  if(!bottomPick||bottomPick.upgradeFrom===undefined) return <div>
                    <div style={{fontSize:10,color:"#4caf50",marginBottom:6,fontWeight:600}}>① Retirer un cube du top :</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {validTops.map(ci=><button key={ci} onClick={()=>setBottomPick({upgradeFrom:ci})} className="act-btn" style={{borderColor:"#4caf50"}}>
                        <span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:"#4caf50",marginRight:4,verticalAlign:"middle"}}/>
                        {me.topRow[ci]} ({(me.cubesOnTop||[])[ci]}🟩)
                      </button>)}
                    </div>
                  </div>;
                  return <div>
                    <div style={{fontSize:10,color:"#4caf50",marginBottom:4}}>① {me.topRow[bottomPick.upgradeFrom]} sélectionné</div>
                    <div style={{fontSize:10,color:"var(--brass)",marginBottom:6,fontWeight:600}}>② Placer le cube sur un bottom :</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {validBottoms.map(ci=>{
                        const bCost=mat.bottomCosts[ci];
                        return <button key={ci} onClick={()=>{doUpgrade(bottomPick.upgradeFrom,ci);setBottomPick(null);}} className="act-btn" style={{borderColor:"var(--brass)"}}>
                          {BOTTOM[ci]} <span style={{fontSize:11,opacity:0.7}}>(-1 coût, +{bCost.bonus}$)</span>
                          <span style={{display:"inline-flex",gap:1,marginLeft:4}}>
                            {Array.from({length:(mat.bottomSlots||[])[ci]}).map((_2,si)=><span key={si} style={{display:"inline-block",width:6,height:6,borderRadius:1,background:si<(me.cubesOnBottom||[])[ci]?"#4caf50":"#333",border:"1px solid #555"}}/>)}
                          </span>
                        </button>;
                      })}
                    </div>
                    <button onClick={()=>setBottomPick(null)} className="act-btn" style={{marginTop:6,fontSize:12,opacity:0.7,minHeight:36}}>← Autre source</button>
                  </div>;
                })()}
                {ba==="Deploy"&&!maxed&&(()=>{
                  const isNations=me.faction==="nations";
                  const metalCount=countRes(me,"metal");const boisCount=countRes(me,"bois");
                  const qty=bc.qty;
                  const hasMetal=metalCount>=qty;const hasBois=boisCount>=qty;
                  if(!isNations) return hasMetal?<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{workerHexes.map(hid=><button key={hid} onClick={()=>doDeploy(hid)} className="act-btn">⬡ #{hid}</button>)}</div>:<div style={{fontSize:11,color:"var(--text-muted)"}}>Pas assez de {bc.res}</div>;
                  // Nations: Esprit Sauvage — choose metal or bois
                  if(!hasMetal&&!hasBois) return <div style={{fontSize:11,color:"var(--text-muted)"}}>Pas assez de métal ni de bois</div>;
                  if(!bottomPick||!bottomPick.deployRes) return <div>
                    <div style={{fontSize:10,color:"var(--brass)",marginBottom:6}}>🌿 Esprit Sauvage — déployer avec :</div>
                    <div style={{display:"flex",gap:6}}>
                      {hasMetal&&<button onClick={()=>setBottomPick({deployRes:"metal"})} className="act-btn" style={{flex:1}}>⚙ Métal ({metalCount})</button>}
                      {hasBois&&<button onClick={()=>setBottomPick({deployRes:"bois"})} className="act-btn" style={{flex:1,borderColor:"#5a8a3a"}}>🪵 Bois ({boisCount})</button>}
                    </div>
                  </div>;
                  return <div>
                    <div style={{fontSize:10,color:"var(--brass)",marginBottom:4}}>Deploy avec {bottomPick.deployRes} :</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{workerHexes.map(hid=><button key={hid} onClick={()=>doDeploy(hid,bottomPick.deployRes)} className="act-btn">⬡ #{hid}</button>)}</div>
                    <button onClick={()=>setBottomPick(null)} className="act-btn" style={{marginTop:6,fontSize:12,opacity:0.7,minHeight:36}}>← Autre ressource</button>
                  </div>;
                })()}
                {ba==="Build"&&!maxed&&(hasRes&&buildableHexes.length>0&&availBuildings.length>0?<div>{!bottomPick||bottomPick.packUp?<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{availBuildings.map(bt=><button key={bt.type} onClick={()=>setBottomPick({building:bt})} className="act-btn">{bt.icon} {bt.name}</button>)}</div>:<div><div style={{fontSize:11,marginBottom:6}}>Placer {bottomPick.building.icon} sur :</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{buildableHexes.map(hid=><button key={hid} onClick={()=>doBuild(hid,bottomPick.building.type)} className="act-btn">#{hid}</button>)}</div><button onClick={()=>setBottomPick(null)} className="act-btn" style={{marginTop:6,fontSize:12,opacity:0.7,minHeight:36}}>← Autre</button></div>}</div>:<div style={{fontSize:11,color:"var(--text-muted)"}}>Insuffisant</div>)}
                {ba==="Enlist"&&!maxed&&(hasRes?<div>
                  <div style={{fontSize:11,color:"var(--text-dim)",marginBottom:6}}>Recrue {(me.recruits||0)+1}/4 — Assigner à une action bottom :</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>
                    {BOTTOM.map((bName,ci)=>{
                      const assigned=(me.enlistMap||[])[ci];
                      const ongoing=ENLIST_ONGOING[ci];
                      return <button key={ci} onClick={()=>doEnlist(ci)} className="act-btn" disabled={assigned} style={{textAlign:"center",opacity:assigned?0.3:1,cursor:assigned?"not-allowed":"pointer"}}>
                        <div style={{fontWeight:700,fontSize:12}}>{ongoing.icon} {bName}</div>
                        <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>Immédiat: {ENLIST_BONUSES[ci].label}</div>
                        <div style={{fontSize:11,color:"#4caf50",marginTop:1}}>Ongoing: {ongoing.label}</div>
                        {assigned&&<div style={{fontSize:11,color:"#8A3030"}}>✓ assigné</div>}
                      </button>;
                    })}
                  </div>
                </div>:<div style={{fontSize:11,color:"var(--text-muted)"}}>Pas assez de {bc.res}</div>)}
                {maxed&&<div style={{fontSize:12,color:"var(--success)"}}>{ba} au maximum</div>}
                <button onClick={actuallyEndTurn} className="act-btn" style={{marginTop:8,width:"100%",background:"var(--bg)",textAlign:"center",color:"var(--text-muted)"}}>Passer →</button>
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
              <div style={{padding:"8px 16px",borderTop:"1px solid #882020",fontSize:12,background:"rgba(200,30,30,0.04)"}}>
                <div style={{color:"#cc3030",fontWeight:600,marginBottom:6,fontSize:12}}>🏛 Commerce Impérial (1×/tour) — envoyer 1 ressource :</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {available.map(r=><div key={r} style={{display:"flex",gap:4}}>
                    <button onClick={()=>doCommerceImperial(r,"coins")} className="act-btn" style={{fontSize:12,padding:"8px 12px",borderColor:"#882020"}}>-1{r.slice(0,3)} →2💰</button>
                    <button onClick={()=>doCommerceImperial(r,"cards")} className="act-btn" style={{fontSize:12,padding:"8px 12px",borderColor:"#882020"}}>-1{r.slice(0,3)} →1🃏</button>
                  </div>)}
                </div>
              </div>
            );
          })()}
          {me.faction==="dominion"&&me.commerceUsed&&isMyTurn&&!combat&&!selAction&&!pendingBottom&&(
            <div style={{padding:"6px 16px",borderTop:"1px solid var(--border)",fontSize:12,color:"var(--text-dim)"}}>🏛 Commerce Impérial utilisé ce tour</div>
          )}

          {/* Rail placement mode indicator */}
          {railPlacement&&(
            <div style={{padding:"8px 16px",borderTop:"1px solid #6a5030",background:"rgba(100,80,48,0.08)",fontSize:12}}>
              <div style={{color:"#a08050",fontWeight:700,marginBottom:4}}>🚂 Pose de rails ({railPlacement.remaining}/3 restants)</div>
              {railPlacement.fromHex===null?
                <div style={{color:"var(--text-dim)",fontSize:11}}>Cliquez un hex de départ pour le segment</div>:
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:"#C9A84C",fontSize:11}}>Depuis #{railPlacement.fromHex} → cliquez un hex adjacent</span>
                  <button onClick={()=>setRailPlacement(prev=>({...prev,fromHex:null}))} className="act-btn" style={{fontSize:10,padding:"4px 10px"}}>Annuler</button>
                </div>
              }
              <button onClick={()=>{setRailPlacement(null);addLog(`⏭ Rails passés (${railPlacement.remaining} non posés)`);finishBottom(2);}} className="act-btn" style={{marginTop:6,width:"100%",background:"var(--bg)",textAlign:"center",color:"var(--text-muted)",fontSize:11}}>Terminer sans poser les rails restants</button>
            </div>
          )}

          {/* Hex info */}
          {selHexData&&!selAction&&(
            <div style={{padding:"6px 16px",fontSize:12,color:"var(--text-dim)",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>{TERRAINS[selHexData.t].icon}</span>
              <span style={{fontWeight:600,color:TERRAINS[selHexData.t].color}}>{TERRAINS[selHexData.t].label}</span>
              <span style={{color:"var(--text-muted)"}}>#{selHexData.id}</span>
              {TERRAINS[selHexData.t].res&&<span style={{color:"var(--brass)",fontSize:11}}>→ {TERRAINS[selHexData.t].res}</span>}
            </div>
          )}

        </div>

        {/* ── Dropdown: Star Tracker ── */}
        <div style={{borderTop:"1px solid var(--border)",flexShrink:0}}>
          <button onClick={()=>setShowStars(s=>!s)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",background:"rgba(201,168,76,0.04)",border:"none",color:"var(--gold)",fontSize:11,fontWeight:700,fontFamily:"'Bitter',serif",cursor:"pointer"}}>
            <span>⭐ Étoiles ({me.stars}/6)</span>
            <span style={{fontSize:9,color:"var(--text-dim)",transform:showStars?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▼</span>
          </button>
        </div>

        {/* ── Dropdown: Objectives ── */}
        {me.objectives&&me.objectives.length>0&&(
          <div style={{borderTop:"1px solid var(--border)",flexShrink:0}}>
            <button onClick={()=>setShowObjectives(s=>!s)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",background:"rgba(201,168,76,0.04)",border:"none",color:"var(--gold)",fontSize:11,fontWeight:700,fontFamily:"'Bitter',serif",cursor:"pointer"}}>
              <span>🎯 Objectifs {me.objectiveRevealed?"(1 révélé)":""}</span>
              <span style={{fontSize:9,color:"var(--text-dim)",transform:showObjectives?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▼</span>
            </button>
            {showObjectives&&(
              <div style={{padding:"8px 12px",animation:"slideDown 0.2s ease"}}>
                <div style={{fontSize:11,color:"var(--text-dim)",marginBottom:6}}>
                  {me.objectiveRevealed?"1 objectif révélé":"Révélez-en un quand la condition est remplie pour gagner ⭐"}
                </div>
                {me.objectives.map((obj,idx)=>{
                  const isRevealed=me.objectiveRevealed&&me.revealedObjectiveIdx===idx;
                  const canReveal=!me.objectiveRevealed&&obj.check(me);
                  const condMet=obj.check(me);
                  return(
                    <div key={obj.id||idx} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",opacity:me.objectiveRevealed&&!isRevealed?0.4:1}}>
                      <span style={{color:isRevealed?"#4A8A4A":condMet?"var(--gold)":"var(--text-dim)",fontSize:13,fontFamily:"'Bitter',serif",fontWeight:700,minWidth:0,flex:1}}>
                        {isRevealed?"✅":"🎯"} {obj.name}
                        <span style={{fontWeight:400,fontSize:12,color:"var(--text-dim)",marginLeft:8}}>{obj.desc}</span>
                      </span>
                      {!me.objectiveRevealed&&isMyTurn&&!combat&&!encounter&&!rougeRiver&&(
                        canReveal
                          ?<button onClick={()=>revealObjective(idx)} style={{padding:"8px 14px",fontSize:12,background:"var(--gold)",color:"var(--bg)",border:"none",borderRadius:4,fontWeight:700,minHeight:44,flexShrink:0}}>Révéler ⭐</button>
                          :<span style={{fontSize:11,color:"var(--text-muted)",flexShrink:0}}>pas rempli</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Dropdown: Journal ── */}
        <div style={{borderTop:"1px solid var(--border)",flexShrink:0,marginTop:"auto"}}>
          <button onClick={()=>setShowLog(s=>!s)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",background:"rgba(201,168,76,0.04)",border:"none",color:"var(--gold)",fontSize:11,fontWeight:700,fontFamily:"'Bitter',serif",cursor:"pointer"}}>
            <span>📜 Journal</span>
            <span style={{fontSize:9,color:"var(--text-dim)",transform:showLog?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▼</span>
          </button>
          {showLog&&<div ref={logRef} style={{maxHeight:120,overflow:"auto",padding:"4px 8px",fontSize:10}}>
            {log.slice(-20).map((msg,i)=><div key={i} className="log-line">{msg}</div>)}
          </div>}
        </div>
      </div>
      <AmbientSound />
    </div>
  );
}
