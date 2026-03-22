import React from 'react';
import { TERRAINS } from '../../data/terrains.js';
import { hPts, HS } from '../../logic/hexMath.js';
import { TerrainDecor } from './TerrainDecor.jsx';

export const HexTerrain=React.memo(({hex,isV,isSel,isHov,isFactory})=>{
  const t=TERRAINS[hex.t];
  const isWater=hex.t==="lac"||hex.t==="marecage";
  return(
    <g>
      {/* Deep shadow */}
      <polygon points={hPts(hex.rx+3,hex.ry+4)} fill="rgba(0,0,0,0.6)" opacity={0.5}/>
      {/* Ambient occlusion ring */}
      <polygon points={hPts(hex.rx,hex.ry,HS+2)} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={3} style={{pointerEvents:"none"}}/>
      {/* Base with gradient fill */}
      <polygon points={hPts(hex.rx,hex.ry)}
        fill={`url(#tg-${hex.t})`}
        stroke={isV?"#FFD700":isSel?"#e8dcc8":isHov?t.stroke:"rgba(8,7,4,0.85)"}
        strokeWidth={isV?3:isSel?2.5:isHov?2:1.2}
        opacity={isWater?0.6:0.93}
      />
      {/* Texture pattern overlay */}
      <polygon points={hPts(hex.rx,hex.ry)} fill={`url(#tp-${hex.t})`} opacity={isWater?0.5:0.75} style={{pointerEvents:"none"}}/>
      {/* Inner bevel highlight (top edge) */}
      <polygon points={hPts(hex.rx-0.5,hex.ry-1.5)} fill="none" stroke="rgba(255,255,240,0.08)" strokeWidth={0.7} style={{pointerEvents:"none"}}/>
      {/* Bottom edge shadow */}
      <polygon points={hPts(hex.rx+0.5,hex.ry+1)} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={0.8} style={{pointerEvents:"none"}}/>
      {/* Terrain decorations */}
      <TerrainDecor hex={hex}/>
      {/* Factory special effects */}
      {isFactory&&<>
        <polygon points={hPts(hex.rx,hex.ry,HS+6)} fill="none" stroke="#c4a747" strokeWidth={0.8} opacity={0.25} strokeDasharray="6 4"><animateTransform attributeName="transform" type="rotate" from={`0 ${hex.rx} ${hex.ry}`} to={`360 ${hex.rx} ${hex.ry}`} dur="60s" repeatCount="indefinite"/></polygon>
        <polygon points={hPts(hex.rx,hex.ry)} fill="none" stroke="#ff5522" strokeWidth={2} opacity={0.12}><animate attributeName="opacity" values="0.05;0.2;0.05" dur="3s" repeatCount="indefinite"/></polygon>
        {/* Inner glow */}
        <polygon points={hPts(hex.rx,hex.ry,HS-8)} fill="rgba(255,120,40,0.06)"><animate attributeName="opacity" values="0.03;0.1;0.03" dur="2s" repeatCount="indefinite"/></polygon>
      </>}
      {/* Valid move overlay */}
      {isV&&<>
        <polygon points={hPts(hex.rx,hex.ry)} fill="rgba(255,215,0,0.1)" stroke="#FFD700" strokeWidth={2.5} opacity={0.8}><animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.4s" repeatCount="indefinite"/></polygon>
        <polygon points={hPts(hex.rx,hex.ry,HS-6)} fill="none" stroke="#FFD700" strokeWidth={0.8} opacity={0.3}><animate attributeName="opacity" values="0.1;0.5;0.1" dur="1.4s" repeatCount="indefinite"/></polygon>
      </>}
    </g>
  );
});

export const UnitToken=React.memo(({type,cx,cy,color,label,icon,factionId})=>{
  if(type==="hero"){
    // Faction-specific hero + companion silhouettes (32×32 viewBox)
    const s=0.82,hw=16*s,hh=16*s;const ox=cx-hw,oy=cy-hh-5;
    return(<g>
      <circle cx={cx} cy={cy} r={22} fill="url(#hero-aura)" opacity={0.7}/>
      {/* Dark backdrop for contrast */}
      <circle cx={cx} cy={cy-1} r={16} fill="rgba(6,5,3,0.75)"/>
      <circle cx={cx} cy={cy-1} r={16} fill="none" stroke={color} strokeWidth={1.5} opacity={0.6}/>
      <ellipse cx={cx} cy={cy+14} rx={10} ry={3} fill="rgba(0,0,0,0.45)"/>
      <g transform={`translate(${ox},${oy}) scale(${s})`}>
        {factionId==="confederation"&&<g>
          {/* J. Cole: tall stance, cavalry hat, long coat + Dixie: hound at feet */}
          <ellipse cx="14" cy="30" rx="8" ry="2" fill="rgba(0,0,0,0.3)"/>
          <rect x="12" y="16" width="5" height="12" rx="1.5" fill={color}/>{/* body */}
          <circle cx="14.5" cy="12" r="4" fill={color}/>{/* head */}
          {/* Cavalry hat brim */}
          <ellipse cx="14.5" cy="10" rx="5.5" ry="1.8" fill="#666"/>
          <rect x="12" y="7" width="5" height="4" rx="1.5" fill="#777"/>
          {/* Coat tails */}
          <path d="M12,28 L10,32 M17,28 L19,32" stroke={color} strokeWidth="1.5" fill="none"/>
          {/* Arm with saber */}
          <path d="M17,18 L21,16 L23,11" stroke="#aaa" strokeWidth="1" fill="none" strokeLinecap="round"/>
          <line x1="23" y1="11" x2="24" y2="7" stroke="#ddd" strokeWidth="0.8"/>
          {/* Dixie (hound) */}
          <ellipse cx="24" cy="28" rx="4" ry="2.5" fill="#8a6a40"/>
          <circle cx="27" cy="26" r="1.8" fill="#8a6a40"/>
          <circle cx="28" cy="25.5" r="0.6" fill="#333"/>
          <path d="M26,24.5 L25,23" stroke="#8a6a40" strokeWidth="1.2" strokeLinecap="round"/>
        </g>}
        {factionId==="frente"&&<g>
          {/* E. Rojas: wide sombrero, bandolier + Trueno: armored horse */}
          <ellipse cx="16" cy="30" rx="10" ry="2" fill="rgba(0,0,0,0.3)"/>
          <rect x="13" y="16" width="6" height="11" rx="2" fill={color}/>
          <circle cx="16" cy="12" r="4" fill={color}/>
          {/* Sombrero */}
          <ellipse cx="16" cy="10" rx="7" ry="2" fill="#7a4a20"/>
          <ellipse cx="16" cy="9" rx="4" ry="3" fill="#8a5a30"/>
          {/* Bandolier diagonal */}
          <line x1="13" y1="16" x2="19" y2="26" stroke="#aa8040" strokeWidth="1.2"/>
          <g fill="#c0a060"><circle cx="14" cy="18" r="0.5"/><circle cx="15" cy="20" r="0.5"/><circle cx="16" cy="22" r="0.5"/><circle cx="17" cy="24" r="0.5"/></g>
          {/* Trueno (armored horse head) */}
          <path d="M24,22 L28,18 L30,16" stroke="#7a4a20" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <circle cx="30" cy="15" r="2.5" fill="#8a5a30"/>
          <path d="M30,13 L31,11" stroke="#aa8040" strokeWidth="0.8"/>
          <circle cx="31" cy="14.5" r="0.5" fill="#333"/>
          {/* Horse armor plate */}
          <rect x="28" y="14" width="3" height="2" rx="0.5" fill="#666" opacity="0.5"/>
        </g>}
        {factionId==="nations"&&<g>
          {/* Aiyana: feathered headdress, lean + Koda: bison silhouette */}
          <ellipse cx="14" cy="30" rx="9" ry="2" fill="rgba(0,0,0,0.3)"/>
          <rect x="12" y="16" width="5" height="12" rx="1.5" fill={color}/>
          <circle cx="14.5" cy="12" r="3.5" fill={color}/>
          {/* Feathered headdress */}
          <g stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round">
            <path d="M14,9 L12,4"/><path d="M15,8.5 L14,3"/><path d="M16,9 L16,4"/>
            <path d="M17,9.5 L18,5"/><path d="M13,9.5 L11,5"/>
          </g>
          <g fill="#50c8b8" opacity="0.7"><circle cx="12" cy="4" r="0.6"/><circle cx="14" cy="3" r="0.6"/><circle cx="16" cy="4" r="0.6"/><circle cx="18" cy="5" r="0.6"/><circle cx="11" cy="5" r="0.6"/></g>
          {/* Staff */}
          <line x1="10" y1="14" x2="8" y2="30" stroke="#8a6a40" strokeWidth="1"/>
          {/* Koda (bison) */}
          <ellipse cx="25" cy="26" rx="5" ry="3.5" fill="#5a4030"/>
          <circle cx="28" cy="23.5" r="2.5" fill="#5a4030"/>
          <path d="M26.5,22 L25,20 M29.5,22 L31,20" stroke="#4a3020" strokeWidth="1" strokeLinecap="round"/>
          <circle cx="29" cy="23.5" r="0.5" fill="#222"/>
        </g>}
        {factionId==="acadiane"&&<g>
          {/* M. Thibodeau: trapper hood, long paddle + Brume: heron perched */}
          <ellipse cx="15" cy="30" rx="8" ry="2" fill="rgba(0,0,0,0.3)"/>
          <rect x="13" y="16" width="5" height="12" rx="1.5" fill={color}/>
          <circle cx="15.5" cy="12" r="3.8" fill={color}/>
          {/* Trapper hood */}
          <path d="M11,13 Q15.5,6 20,13" fill="#2a5a2a" stroke="#1a4a1a" strokeWidth="0.5"/>
          {/* Paddle */}
          <line x1="19" y1="14" x2="24" y2="30" stroke="#6a5030" strokeWidth="1.5"/>
          <ellipse cx="24.5" cy="31" rx="1.5" ry="3" fill="#6a5030"/>
          {/* Brume (blue heron) — perched on shoulder */}
          <path d="M10,10 L8,6 L7,2" stroke="#4a8a8a" strokeWidth="1" fill="none" strokeLinecap="round"/>
          <circle cx="7" cy="2" r="1.5" fill="#5aaa9a"/>
          <line x1="7" y1="2" x2="4" y2="2.5" stroke="#aa8040" strokeWidth="0.6"/>{/* beak */}
          <circle cx="6.5" cy="1.5" r="0.4" fill="#222"/>
          <path d="M8,6 L6,8" stroke="#4a8a8a" strokeWidth="0.7"/>{/* wing hint */}
        </g>}
        {factionId==="bayou"&&<g>
          {/* Cap. Zeke: pirate captain coat, tricorn + Croc: alligator */}
          <ellipse cx="14" cy="30" rx="9" ry="2" fill="rgba(0,0,0,0.3)"/>
          <rect x="12" y="15" width="5.5" height="13" rx="1.5" fill={color}/>
          <circle cx="14.5" cy="11" r="3.8" fill={color}/>
          {/* Tricorn hat */}
          <path d="M9,10 L14.5,7 L20,10" fill="#4a2060" stroke="#3a1850" strokeWidth="0.5"/>
          <ellipse cx="14.5" cy="10.5" rx="5" ry="1.5" fill="#5a3070"/>
          {/* Skull badge on hat */}
          <circle cx="14.5" cy="9.5" r="1" fill="#c080e0" opacity="0.5"/>
          {/* Long coat */}
          <path d="M12,28 L9,32 M17.5,28 L20,32" stroke={color} strokeWidth="1.5" fill="none"/>
          {/* Croc (alligator) */}
          <path d="M22,28 L30,26 L32,25" stroke="#3a6a30" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M30,26 L32,24.5" stroke="#3a6a30" strokeWidth="1.5" fill="none"/>{/* jaw */}
          <circle cx="30.5" cy="25" r="0.6" fill="#aa0" opacity="0.8"/>{/* eye */}
          {/* Tail zigzag */}
          <path d="M22,28 L20,30 L18,29" stroke="#3a6a30" strokeWidth="1.5" fill="none"/>
        </g>}
        {factionId==="dominion"&&<g>
          {/* Col. Whitfield: stiff officer posture, pith helmet + Sterling */}
          <ellipse cx="16" cy="30" rx="8" ry="2" fill="rgba(0,0,0,0.3)"/>
          <rect x="13.5" y="16" width="5.5" height="11" rx="1.5" fill={color}/>
          <circle cx="16" cy="12" r="3.8" fill={color}/>
          {/* Pith helmet */}
          <ellipse cx="16" cy="10" rx="5" ry="1.5" fill="#c8a050"/>
          <ellipse cx="16" cy="9" rx="3.5" ry="2.5" fill="#c8a050"/>
          <line x1="16" y1="6.5" x2="16" y2="9" stroke="#aa8030" strokeWidth="0.6"/>
          {/* Epaulettes */}
          <rect x="11" y="16" width="3" height="1.5" rx="0.5" fill="#c8a050"/>
          <rect x="18.5" y="16" width="3" height="1.5" rx="0.5" fill="#c8a050"/>
          {/* Swagger stick */}
          <line x1="19" y1="18" x2="23" y2="28" stroke="#8a6030" strokeWidth="1"/>
          {/* Sterling (bulldog) */}
          <ellipse cx="26" cy="28" rx="3" ry="2.2" fill="#aa3030"/>
          <circle cx="28" cy="26.5" r="2" fill="#aa3030"/>
          <circle cx="29" cy="26" r="0.5" fill="#222"/>
          <path d="M28.5,27.5 L29.5,28" stroke="#882020" strokeWidth="0.8"/>
        </g>}
        {/* Fallback */}
        {!["confederation","frente","nations","acadiane","bayou","dominion"].includes(factionId)&&<g>
          <circle cx="16" cy="14" r="5" fill={color}/><rect x="13" y="18" width="6" height="10" rx="2" fill={color}/>
        </g>}
      </g>
    </g>);
  }
  if(type==="mech"){
    // Faction-specific arachnoïde mech icons (32×32 viewBox, scaled to ~26px)
    const s=0.82,hw=16*s,hh=16*s;const ox=cx-hw,oy=cy-hh-2;
    return(<g>
      <ellipse cx={cx} cy={cy+12} rx={11} ry={3.5} fill="rgba(0,0,0,0.4)"/>
      {/* Dark backdrop for contrast */}
      <circle cx={cx} cy={cy} r={15} fill="rgba(6,5,3,0.7)"/>
      <circle cx={cx} cy={cy} r={15} fill="none" stroke={color} strokeWidth={1} opacity={0.35}/>
      <g transform={`translate(${ox},${oy}) scale(${s})`}>
        {factionId==="confederation"&&<g>
          <g stroke="#7a7a7a" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M11,15 L6,20 L3,28"/><path d="M21,15 L26,20 L29,28"/><path d="M12,17 L7,23 L5,30"/><path d="M20,17 L25,23 L27,30"/></g>
          <rect x="10" y="10" width="12" height="8" rx="2" fill="#7a7a7a" stroke="#555" strokeWidth="0.6"/><ellipse cx="16" cy="10" rx="5" ry="2" fill="#8a8a8a"/>
          <rect x="18" y="4" width="2.5" height="6.5" rx="0.8" fill="#666"/><ellipse cx="19" cy="2" rx="2.5" ry="1" fill="#8a7a6a" opacity="0.3"/>
          <circle cx="12" cy="12.5" r="1.2" fill="#e8d080" opacity="0.9"/><circle cx="12" cy="12.5" r="0.5" fill="#fff"/>
          <rect x="14" y="7" width="4" height="2" rx="0.5" fill="#666"/>
        </g>}
        {factionId==="frente"&&<g>
          <g stroke="#7a5030" strokeWidth="1.3" fill="none" strokeLinecap="round"><path d="M8,16 L3,19 L1,22"/><path d="M7,19 L2,23 L1,26"/><path d="M8,22 L4,26 L3,29"/><path d="M24,16 L29,19 L31,22"/><path d="M25,19 L30,23 L31,26"/><path d="M24,22 L28,26 L29,29"/></g>
          <ellipse cx="16" cy="18" rx="10" ry="6" fill="#a06030" stroke="#7a4020" strokeWidth="0.7"/>
          <path d="M6,13 L16,9 L26,13 L24,14 L16,11 L8,14 Z" fill="#8a5a30" stroke="#6a4020" strokeWidth="0.6"/>
          <path d="M7,13 L16,9.5 L25,13" fill="none" stroke="#c8a060" strokeWidth="0.8"/>
          <circle cx="13" cy="13.5" r="0.6" fill="#D07030" opacity="0.8"/><circle cx="19" cy="13.5" r="0.6" fill="#D07030" opacity="0.8"/>
        </g>}
        {factionId==="nations"&&<g>
          <g stroke="#30a098" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M10,17 L5,14 L2,18 L1,24"/><path d="M22,17 L27,14 L30,18 L31,24"/><path d="M11,20 L6,22 L3,28"/><path d="M21,20 L26,22 L29,28"/></g>
          <ellipse cx="16" cy="18" rx="7" ry="4.5" fill="#2a8a82" stroke="#1a6a64" strokeWidth="0.6"/>
          <ellipse cx="16" cy="12.5" rx="3.5" ry="2.5" fill="#30a098" stroke="#1a6a64" strokeWidth="0.5"/>
          <g stroke="#50c8b8" strokeWidth="0.7" fill="none" strokeLinecap="round"><path d="M13,11 L10,7 L8,4"/><path d="M10,7 L9,5"/><path d="M19,11 L22,7 L24,4"/><path d="M22,7 L23,5"/></g>
          <circle cx="8" cy="3.5" r="0.6" fill="#80fff0" opacity="0.7"/><circle cx="24" cy="3.5" r="0.6" fill="#80fff0" opacity="0.7"/>
          <circle cx="14" cy="12" r="0.6" fill="#80fff0"/><circle cx="18" cy="12" r="0.6" fill="#80fff0"/>
        </g>}
        {factionId==="acadiane"&&<g>
          <g stroke="#2a7a2a" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9,18 L3,15 L1,20"/><path d="M23,18 L29,15 L31,20"/><path d="M10,21 L4,24 L2,29"/><path d="M22,21 L28,24 L30,29"/></g>
          <g fill="#1a5a1a" opacity="0.7"><ellipse cx="1" cy="21" rx="1.5" ry="2.5" transform="rotate(-15,1,21)"/><ellipse cx="31" cy="21" rx="1.5" ry="2.5" transform="rotate(15,31,21)"/></g>
          <rect x="8" y="13" width="16" height="10" rx="4" fill="#3a8a3a" stroke="#1a5a1a" strokeWidth="0.6"/>
          <rect x="7.5" y="15.5" width="17" height="1" rx="0.3" fill="#5a9a5a"/><rect x="7.5" y="19.5" width="17" height="1" rx="0.3" fill="#5a9a5a"/>
          <ellipse cx="16" cy="12" rx="4" ry="2.5" fill="#4a9a4a" stroke="#2a6a2a" strokeWidth="0.5"/>
          <circle cx="16" cy="11.8" r="0.9" fill="#a0e880" opacity="0.9"/><circle cx="16" cy="11.8" r="0.4" fill="#e0ffd0"/>
          <rect x="19" y="9" width="2" height="4.5" rx="0.7" fill="#2a6a2a"/>
        </g>}
        {factionId==="bayou"&&<g>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9,16 L3,13 L1,19" stroke="#6a3a80" strokeWidth="1.8"/><path d="M10,21 L5,25 L3,30" stroke="#40a098" strokeWidth="0.9"/><path d="M22,15 L28,12 L30,17" stroke="#7a4a90" strokeWidth="1.3"/><path d="M23,19 L28,18 L30,23 L29,27" stroke="#6a3a80" strokeWidth="1.1"/><path d="M21,22 L24,26 L23,29" stroke="#5a3070" strokeWidth="1.5"/></g>
          <path d="M8,12 L7,14 L7,22 L10,24 L22,23 L24,21 L25,14 L23,12 Z" fill="#7a3a98" stroke="#5a2870" strokeWidth="0.6"/>
          <line x1="8" y1="16" x2="24" y2="15.5" stroke="#9060a0" strokeWidth="0.5" strokeDasharray="2 1.5"/>
          <rect x="17" y="16" width="5" height="3.5" rx="0.5" fill="#6a3080"/><rect x="8" y="18" width="4" height="3" rx="0.5" fill="#5a2868"/>
          <g stroke="#c080e0" strokeWidth="0.5" opacity="0.5"><path d="M14,15 L14,19 M12,17 L16,17"/></g>
          <path d="M11,9 L10,11 L11,13 L21,13 L22,11 L20,9 Z" fill="#6a3080" stroke="#5a2870" strokeWidth="0.5"/>
          <circle cx="14" cy="11" r="1.1" fill="#c080e0" opacity="0.9"/><circle cx="14" cy="11" r="0.4" fill="#fff"/>
          <circle cx="18.5" cy="11.2" r="0.5" fill="#9060a0" opacity="0.6"/>
          <path d="M8,12 Q6,10 5,7 Q4,5 5.5,4" fill="none" stroke="#3a8a2a" strokeWidth="0.6" opacity="0.5"/>
          <path d="M20,9 L22,6 L21,3" fill="none" stroke="#7a4a90" strokeWidth="0.5"/><circle cx="21" cy="2.5" r="0.5" fill="#c080e0" opacity="0.5"/>
        </g>}
        {factionId==="dominion"&&<g>
          <g stroke="#8a2020" strokeWidth="0.4"><rect x="3" y="16" width="3.5" height="10" rx="1" fill="#aa3030"/><rect x="25.5" y="16" width="3.5" height="10" rx="1" fill="#aa3030"/><rect x="6" y="20" width="3" height="8" rx="0.8" fill="#992828"/><rect x="23" y="20" width="3" height="8" rx="0.8" fill="#992828"/></g>
          <circle cx="4.8" cy="16" r="1.3" fill="#c8a050"/><circle cx="27.2" cy="16" r="1.3" fill="#c8a050"/>
          <rect x="7" y="10" width="18" height="12" rx="3" fill="#bb2828" stroke="#881818" strokeWidth="0.7"/>
          <rect x="6.5" y="13" width="19" height="1.2" rx="0.3" fill="#c8a050"/><rect x="6.5" y="18" width="19" height="1.2" rx="0.3" fill="#c8a050"/>
          <rect x="11" y="6.5" width="10" height="4" rx="1" fill="#cc3030"/>
          <path d="M13,7 L14,5.5 L16,7 L18,5.5 L19,7" fill="none" stroke="#e0c070" strokeWidth="0.6"/>
          <rect x="2" y="7.8" width="11" height="1" rx="0.3" fill="#aa8040"/>
          <circle cx="9" cy="11.5" r="0.9" fill="#e0c070" opacity="0.9"/>
          <rect x="20" y="3" width="2.5" height="4" rx="0.7" fill="#992020"/><rect x="19.5" y="2.5" width="3.5" height="1.5" rx="0.5" fill="#c8a050"/>
        </g>}
        {/* Fallback for unknown factions */}
        {!["confederation","frente","nations","acadiane","bayou","dominion"].includes(factionId)&&<g>
          <rect x="8" y="8" width="16" height="16" rx="3" fill={color} stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
          <text x="16" y="20" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="900">M</text>
        </g>}
      </g>
    </g>);
  }
  if(type==="building"){
    // Building: square token with icon
    return(<g>
      <ellipse cx={cx} cy={cy+8} rx={6} ry={2} fill="rgba(0,0,0,0.3)"/>
      <rect x={cx-10} y={cy-10} width={20} height={20} rx={3} fill="rgba(6,5,3,0.65)"/>
      <rect x={cx-9} y={cy-9} width={18} height={18} rx={2.5} fill={color} stroke="rgba(255,255,240,0.7)" strokeWidth={1.2} opacity={0.9}/>
      <text x={cx} y={cy+5} textAnchor="middle" fontSize={12}>{icon||"🏗"}</text>
    </g>);
  }
  // Worker — industrial worker silhouette with hard hat
  const ws=0.52;const wox=cx-16*ws,woy=cy-16*ws-2;
  return(<g>
    <ellipse cx={cx} cy={cy+7} rx={5} ry={1.8} fill="rgba(0,0,0,0.35)"/>
    {/* Dark backdrop for contrast */}
    <circle cx={cx} cy={cy} r={9} fill="rgba(6,5,3,0.7)"/>
    <circle cx={cx} cy={cy} r={9} fill="none" stroke={color} strokeWidth={0.8} opacity={0.35}/>
    <g transform={`translate(${wox},${woy}) scale(${ws})`}>
      {/* Body */}
      <rect x="12" y="18" width="8" height="10" rx="2" fill={color}/>
      {/* Head */}
      <circle cx="16" cy="14" r="3.5" fill={color}/>
      {/* Hard hat */}
      <ellipse cx="16" cy="12" rx="4.5" ry="1.5" fill="rgba(255,255,240,0.6)"/>
      <rect x="12.5" y="9.5" width="7" height="3" rx="1.5" fill="rgba(255,255,240,0.5)"/>
      {/* Legs */}
      <rect x="13" y="27" width="3" height="5" rx="1" fill={color} opacity="0.8"/>
      <rect x="17" y="27" width="3" height="5" rx="1" fill={color} opacity="0.8"/>
      {/* Tool (wrench/hammer) */}
      <line x1="20" y1="19" x2="24" y2="26" stroke="#8a7a60" strokeWidth="1.2" strokeLinecap="round"/>
      <rect x="23" y="25" width="3" height="2" rx="0.5" fill="#8a7a60"/>
      {/* Rivet on chest */}
      <circle cx="16" cy="22" r="0.8" fill="rgba(255,255,255,0.3)"/>
    </g>
  </g>);
});

export const EmpireMecha=React.memo(({cx,cy,eid})=>{
  const s=0.78,hw=16*s,hh=16*s;const ox=cx-hw,oy=cy-hh-2;
  return(
  <g>
    <circle cx={cx} cy={cy} r={22} fill="url(#empire-aura)" opacity={0.6}/>
    <circle cx={cx} cy={cy} r={18} fill="none" stroke="#ff2200" strokeWidth={0.5} opacity={0.15}><animate attributeName="r" values="16;22;16" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.2;0;0.2" dur="3s" repeatCount="indefinite"/></circle>
    {/* Dark backdrop */}
    <circle cx={cx} cy={cy} r={16} fill="rgba(10,0,0,0.75)"/>
    <circle cx={cx} cy={cy} r={16} fill="none" stroke="#aa2222" strokeWidth={1.2} opacity={0.5}/>
    <ellipse cx={cx} cy={cy+14} rx={10} ry={3} fill="rgba(0,0,0,0.5)"/>
    <g transform={`translate(${ox},${oy}) scale(${s})`}>
      <g stroke="#4a1010" strokeWidth="0.4">
        <rect x="2" y="14" width="3" height="8" rx="0.5" fill="#2a0808"/><rect x="1.5" y="22" width="4" height="3" rx="0.5" fill="#3a0a0a"/>
        <rect x="27" y="14" width="3" height="8" rx="0.5" fill="#2a0808"/><rect x="26.5" y="22" width="4" height="3" rx="0.5" fill="#3a0a0a"/>
        <rect x="5" y="20" width="2.5" height="7" rx="0.5" fill="#2a0808"/><rect x="24.5" y="20" width="2.5" height="7" rx="0.5" fill="#2a0808"/>
      </g>
      <circle cx="3.5" cy="14" r="1.2" fill="#3a0a0a" stroke="#5a1818" strokeWidth="0.4"/><circle cx="28.5" cy="14" r="1.2" fill="#3a0a0a" stroke="#5a1818" strokeWidth="0.4"/>
      <rect x="7" y="9" width="18" height="13" rx="1.5" fill="#2a0808" stroke="#5a1818" strokeWidth="0.7"/>
      <rect x="6.5" y="12" width="19" height="1" rx="0.2" fill="#4a1010"/><rect x="6.5" y="16" width="19" height="1" rx="0.2" fill="#4a1010"/><rect x="6.5" y="20" width="19" height="1" rx="0.2" fill="#4a1010"/>
      <g fill="#6a2020"><circle cx="9" cy="12.5" r="0.5"/><circle cx="16" cy="12.5" r="0.5"/><circle cx="23" cy="12.5" r="0.5"/><circle cx="9" cy="16.5" r="0.5"/><circle cx="16" cy="16.5" r="0.5"/><circle cx="23" cy="16.5" r="0.5"/></g>
      <rect x="12" y="5" width="8" height="5" rx="1" fill="#3a0a0a" stroke="#5a1818" strokeWidth="0.5"/>
      <rect x="19.5" y="6.5" width="5" height="2" rx="0.5" fill="#2a0808"/>
      <rect x="10" y="2" width="2" height="4" rx="0.6" fill="#2a0808"/><rect x="20" y="2" width="2" height="4" rx="0.6" fill="#2a0808"/>
      <circle cx="16" cy="7.5" r="1" fill="#cc2020" opacity="0.85"><animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/></circle>
      <circle cx="16" cy="7.5" r="0.4" fill="#ff8866" opacity="0.6"/>
    </g>
    <text x={cx} y={cy+14} textAnchor="middle" fontSize={6} fill="#ff6644" fontWeight={700} opacity={0.6}>{eid}</text>
  </g>
)});

export const ResourceToken=React.memo(({cx,cy,resType,count})=>{
  const cfg={
    metal:{bg:"#3a4550",border:"#7899aa",icon:"⚙"},
    bois:{bg:"#2a3a1a",border:"#5a8a3a",icon:"🪵"},
    nourriture:{bg:"#3a3018",border:"#c4a040",icon:"🌽"},
    petrole:{bg:"#1a1a20",border:"#5a5a6a",icon:"🛢"},
  }[resType]||{bg:"#333",border:"#888",icon:"?"};
  return(<g>
    {/* Dark outline for contrast */}
    <rect x={cx-18} y={cy-9} width={36} height={19} rx={5} fill="rgba(4,3,2,0.6)"/>
    <rect x={cx-17} y={cy-8} width={34} height={17} rx={4} fill={cfg.bg} stroke={cfg.border} strokeWidth={1.2} opacity={0.95}/>
    <text x={cx-4} y={cy+5} textAnchor="middle" fontSize={11} fill="#f0e8d0" fontWeight={700}>{count}</text>
    <text x={cx+10} y={cy+5} textAnchor="middle" fontSize={10}>{cfg.icon}</text>
  </g>);
});
