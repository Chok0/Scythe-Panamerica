import React from 'react';
import { seededRand } from '../../logic/hexMath.js';

export const TerrainDecor = React.memo(({ hex }) => {
  const rng = seededRand(hex.id * 137 + hex.rx);
  const cx = hex.rx, cy = hex.ry;

  if (hex.t === "foret") {
    const trees = [];
    for (let i = 0; i < 4; i++) {
      const tx = cx - 20 + rng() * 40, ty = cy - 18 + rng() * 28, sz = 5 + rng() * 6;
      trees.push(<g key={i} opacity={0.3 + rng() * 0.2}>
        <polygon points={`${tx},${ty - sz} ${tx - sz * 0.5},${ty + sz * 0.3} ${tx + sz * 0.5},${ty + sz * 0.3}`} fill="#1a4a1a" />
        <polygon points={`${tx},${ty - sz * 0.6} ${tx - sz * 0.4},${ty + sz * 0.1} ${tx + sz * 0.4},${ty + sz * 0.1}`} fill="#2a5a2a" />
        <line x1={tx} y1={ty + sz * 0.3} x2={tx} y2={ty + sz * 0.5} stroke="#3a2a1a" strokeWidth="1" />
      </g>);
    }
    return <g style={{ pointerEvents: "none" }}>{trees}</g>;
  }
  if (hex.t === "montagne" || hex.t === "sierra") {
    const isS = hex.t === "sierra";
    const peaks = [];
    for (let i = 0; i < (isS ? 2 : 3); i++) {
      const px = cx - 18 + rng() * 36, py = cy - 6 + rng() * 14, sz = 10 + rng() * 10;
      const c1 = isS ? "#8a7050" : "#6a7580", c2 = isS ? "#a08060" : "#8a95a0";
      peaks.push(<g key={i} opacity={0.35}>
        <polygon points={`${px},${py - sz} ${px - sz * 0.7},${py + sz * 0.3} ${px + sz * 0.7},${py + sz * 0.3}`} fill={c1} />
        <polygon points={`${px},${py - sz} ${px - sz * 0.15},${py - sz * 0.3} ${px + sz * 0.3},${py - sz * 0.2}`} fill={c2} />
      </g>);
    }
    return <g style={{ pointerEvents: "none" }}>{peaks}</g>;
  }
  if (hex.t === "village") {
    const houses = [];
    for (let i = 0; i < 3; i++) {
      const hx = cx - 16 + rng() * 32, hy = cy - 10 + rng() * 16, sz = 4 + rng() * 3;
      houses.push(<g key={i} opacity={0.3}>
        <rect x={hx - sz} y={hy} width={sz * 2} height={sz * 1.3} fill="#7a3a1a" rx="0.5" />
        <polygon points={`${hx - sz - 1},${hy} ${hx},${hy - sz} ${hx + sz + 1},${hy}`} fill="#5a2a10" />
        <rect x={hx - 1} y={hy + sz * 0.4} width={2} height={sz * 0.9} fill="#c4a040" opacity="0.5" />
      </g>);
    }
    return <g style={{ pointerEvents: "none" }}>{houses}</g>;
  }
  if (hex.t === "lac") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.15}>
      <circle cx={cx - 8 + rng() * 16} cy={cy - 4 + rng() * 8} r="8" fill="none" stroke="#80b8e0" strokeWidth="0.6"><animate attributeName="r" values="4;14;4" dur={`${3 + rng() * 2}s`} repeatCount="indefinite" /><animate attributeName="opacity" values="0.4;0;0.4" dur={`${3 + rng() * 2}s`} repeatCount="indefinite" /></circle>
      <circle cx={cx + 5 + rng() * 10} cy={cy + 3 + rng() * 6} r="6" fill="none" stroke="#80b8e0" strokeWidth="0.5"><animate attributeName="r" values="3;11;3" dur={`${4 + rng() * 2}s`} begin="1.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.3;0;0.3" dur={`${4 + rng() * 2}s`} begin="1.5s" repeatCount="indefinite" /></circle>
    </g>);
  }
  if (hex.t === "marecage") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.25}>
      <ellipse cx={cx - 10} cy={cy - 4} rx="5" ry="3.5" fill="#3a6a3a" opacity="0.5" />
      <ellipse cx={cx + 12} cy={cy + 6} rx="4" ry="3" fill="#2a5a2a" opacity="0.4" />
      <circle cx={cx + 2} cy={cy + 2} r="6" fill="none" stroke="#5a9a6a" strokeWidth="0.4"><animate attributeName="r" values="3;10;3" dur="5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.3;0;0.3" dur="5s" repeatCount="indefinite" /></circle>
    </g>);
  }
  if (hex.t === "desert") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.2}>
      <path d={`M${cx - 22} ${cy + 6}Q${cx - 10} ${cy - 4} ${cx} ${cy + 4}Q${cx + 12} ${cy + 10} ${cx + 22} ${cy + 2}`} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
      <line x1={cx + rng() * 10} y1={cy + 2} x2={cx + rng() * 10} y2={cy - 10} stroke="#5a8040" strokeWidth="1.5" strokeLinecap="round" />
      <line x1={cx + rng() * 10 - 3} y1={cy - 5} x2={cx + rng() * 10} y2={cy - 7} stroke="#5a8040" strokeWidth="1" strokeLinecap="round" />
    </g>);
  }
  if (hex.t === "champs") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.15}>
      {[0, 1, 2, 3].map(i => <line key={i} x1={cx - 20} y1={cy - 10 + i * 8} x2={cx + 20} y2={cy - 10 + i * 8} stroke="#8a7020" strokeWidth="0.8" strokeDasharray="3 5" />)}
    </g>);
  }
  if (hex.t === "plaine") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.15}>
      {[0, 1, 2].map(i => { const gx = cx - 14 + rng() * 28, gy = cy - 6 + rng() * 14; return (
        <g key={i}><line x1={gx} y1={gy} x2={gx - 2} y2={gy - 5} stroke="#4a7a30" strokeWidth="0.8" strokeLinecap="round" /><line x1={gx} y1={gy} x2={gx + 2} y2={gy - 6} stroke="#5a8a3a" strokeWidth="0.7" strokeLinecap="round" /><line x1={gx} y1={gy} x2={gx} y2={gy - 7} stroke="#4a7a30" strokeWidth="0.8" strokeLinecap="round" /></g>
      ); })}
    </g>);
  }
  if (hex.t === "toundra") {
    return (<g style={{ pointerEvents: "none" }} opacity={0.12}>
      <ellipse cx={cx - 8} cy={cy + 3} rx="10" ry="4" fill="#8aa0b0" />
      <ellipse cx={cx + 10} cy={cy - 6} rx="7" ry="3" fill="#9ab0c0" />
    </g>);
  }
  if (hex.t === "factory") {
    return (<g style={{ pointerEvents: "none" }}>
      <g transform={`translate(${cx},${cy})`} opacity={0.15}>
        <circle r="12" fill="none" stroke="#c4a747" strokeWidth="1.5" strokeDasharray="4 3"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite" /></circle>
        <circle r="6" fill="none" stroke="#c4a747" strokeWidth="1"><animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="12s" repeatCount="indefinite" /></circle>
      </g>
      <circle cx={cx - 8} cy={cy - 20} r="4" fill="#4a4038" opacity="0.15"><animate attributeName="cy" values={`${cy - 16};${cy - 38}`} dur="4s" repeatCount="indefinite" /><animate attributeName="r" values="3;8" dur="4s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.2;0" dur="4s" repeatCount="indefinite" /></circle>
      <circle cx={cx + 6} cy={cy - 18} r="3" fill="#4a4038" opacity="0.12"><animate attributeName="cy" values={`${cy - 14};${cy - 35}`} dur="5s" begin="1.5s" repeatCount="indefinite" /><animate attributeName="r" values="2;7" dur="5s" begin="1.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.15;0" dur="5s" begin="1.5s" repeatCount="indefinite" /></circle>
    </g>);
  }
  return null;
});
