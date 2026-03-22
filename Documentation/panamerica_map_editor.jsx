import { useState, useCallback } from "react";

// ============================================================
// PANAMERICA MAP EDITOR v1
// Click any hex → pick a terrain → export report
// ============================================================

const TERRAINS = {
  montagne:  { color: "#7A7A7A", label: "Montagne",    resource: "Métal",       icon: "⛰" },
  sierra:    { color: "#8B6B45", label: "Sierra",       resource: "Métal",       icon: "🏔" },
  champs:    { color: "#E8D44D", label: "Champs",       resource: "Nourriture",  icon: "🌾" },
  plaine:    { color: "#B8A040", label: "Plaine",       resource: "Nourriture",  icon: "🌿" },
  village:   { color: "#CC3030", label: "Village",      resource: "Ouvriers",    icon: "🏘" },
  foret:     { color: "#1B8C30", label: "Forêt",        resource: "Bois",        icon: "🌲" },
  toundra:   { color: "#6B3FA0", label: "Toundra",      resource: "Pétrole",     icon: "❄" },
  desert:    { color: "#C49020", label: "Désert",       resource: "Pétrole",     icon: "☀" },
  lac:       { color: "#1E7AB8", label: "Lac",           resource: "—",           icon: "~" },
  marecage:  { color: "#3B6B3B", label: "Marécage",     resource: "— (coût)",    icon: "≋" },
  factory:   { color: "#9B1010", label: "Rouge River",  resource: "Plans",       icon: "⚙" },
};

const TERRAIN_KEYS = ["montagne","sierra","champs","plaine","village","foret","toundra","desert","lac","marecage","factory"];

const INITIAL_HEXES = [
  { id:0,  rx:265, ry:103, ot:"champs",   pt:"toundra" },
  { id:1,  rx:501, ry:103, ot:"montagne", pt:"montagne" },
  { id:2,  rx:737, ry:103, ot:"toundra",  pt:"toundra" },
  { id:3,  rx:146, ry:171, ot:"village",  pt:"village" },
  { id:4,  rx:382, ry:171, ot:"village",  pt:"village" },
  { id:5,  rx:618, ry:171, ot:"lac",      pt:"lac" },
  { id:6,  rx:855, ry:171, ot:"champs",   pt:"village" },
  { id:7,  rx:265, ry:240, ot:"champs",   pt:"champs" },
  { id:8,  rx:501, ry:240, ot:"toundra",  pt:"toundra" },
  { id:9,  rx:737, ry:240, ot:"montagne", pt:"montagne" },
  { id:10, rx:146, ry:308, ot:"toundra",  pt:"foret" },
  { id:11, rx:382, ry:308, ot:"foret",    pt:"foret" },
  { id:12, rx:618, ry:308, ot:"village",  pt:"foret" },
  { id:13, rx:855, ry:308, ot:"village",  pt:"lac" },
  { id:14, rx:265, ry:376, ot:"montagne", pt:"montagne" },
  { id:15, rx:501, ry:376, ot:"montagne", pt:"plaine" },
  { id:16, rx:737, ry:376, ot:"foret",    pt:"champs" },
  { id:17, rx:146, ry:445, ot:"foret",    pt:"plaine" },
  { id:18, rx:382, ry:445, ot:"lac",      pt:"lac" },
  { id:19, rx:618, ry:445, ot:"lac",      pt:"lac" },
  { id:20, rx:855, ry:445, ot:"montagne", pt:"marecage" },
  { id:21, rx:265, ry:513, ot:"toundra",  pt:"desert" },
  { id:22, rx:501, ry:513, ot:"factory",  pt:"factory" },
  { id:23, rx:737, ry:513, ot:"toundra",  pt:"desert" },
  { id:24, rx:974, ry:513, ot:"village",  pt:"village" },
  { id:25, rx:146, ry:581, ot:"village",  pt:"village" },
  { id:26, rx:382, ry:581, ot:"foret",    pt:"champs" },
  { id:27, rx:618, ry:581, ot:"toundra",  pt:"village" },
  { id:28, rx:855, ry:581, ot:"champs",   pt:"foret" },
  { id:29, rx:265, ry:650, ot:"lac",      pt:"lac" },
  { id:30, rx:501, ry:650, ot:"lac",      pt:"lac" },
  { id:31, rx:737, ry:650, ot:"village",  pt:"marecage" },
  { id:32, rx:146, ry:718, ot:"champs",   pt:"plaine" },
  { id:33, rx:382, ry:718, ot:"montagne", pt:"foret" },
  { id:34, rx:618, ry:718, ot:"champs",   pt:"foret" },
  { id:35, rx:855, ry:718, ot:"lac",      pt:"champs" },
  { id:36, rx:265, ry:786, ot:"toundra",  pt:"village" },
  { id:37, rx:501, ry:786, ot:"village",  pt:"village" },
  { id:38, rx:737, ry:786, ot:"village",  pt:"village" },
  { id:39, rx:146, ry:855, ot:"montagne", pt:"sierra" },
  { id:40, rx:382, ry:855, ot:"foret",    pt:"desert" },
  { id:41, rx:618, ry:855, ot:"foret",    pt:"desert" },
  { id:42, rx:855, ry:855, ot:"toundra",  pt:"desert" },
  { id:43, rx:265, ry:923, ot:"lac",      pt:"marecage" },
  { id:44, rx:501, ry:923, ot:"champs",   pt:"champs" },
  { id:45, rx:737, ry:923, ot:"montagne", pt:"sierra" },
  { id:46, rx:618, ry:991, ot:"foret",    pt:"sierra" },
];

const CX = 530, CY = 530;
function rot90(x, y) { return [y - CY + CX, -(x - CX) + CY]; }

const RIVERS_ORIG = [
  [[10,678],[332,678],[342,783]],
  [[33,553],[378,553]],
  [[194,292],[357,476]],
  [[467,248],[583,67]],
  [[531,157],[644,338],[669,366],[869,51]],
  [[1025,321],[826,327],[742,501],[854,608]],
  [[381,818],[679,791],[685,945]],
];
const RIVERS = RIVERS_ORIG.map(poly => poly.map(([x, y]) => rot90(x, y)));

const HB_DATA = [
  { ox:651, oy:23,  faction:"Nations Souv.",  color:"#20B2AA" },
  { ox:981, oy:361, faction:"Dominion",       color:"#CC2222" },
  { ox:981, oy:834, faction:"Acadiane",       color:"#228B22" },
  { ox:377, oy:945, faction:"Bayou",          color:"#7B2D8B" },
  { ox:42,  oy:841, faction:"Frente Libre",   color:"#A05020" },
  { ox:42,  oy:265, faction:"Confédération",  color:"#666666" },
].map(hb => {
  const [rx, ry] = rot90(hb.ox, hb.oy);
  return { ...hb, rx, ry };
});

const HS = 62;
function hexPts(cx, cy) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    pts.push(`${cx + HS * Math.cos(a)},${cy + HS * Math.sin(a)}`);
  }
  return pts.join(" ");
}

export default function MapEditor() {
  const [hexes, setHexes] = useState(INITIAL_HEXES.map(h => ({ ...h })));
  const [editingId, setEditingId] = useState(null);
  const [changes, setChanges] = useState([]);
  const [showRivers, setShowRivers] = useState(true);
  const [showHB, setShowHB] = useState(true);

  const assignTerrain = useCallback((id, newTerrain) => {
    setHexes(prev => prev.map(h => {
      if (h.id !== id) return h;
      const oldPt = h.pt;
      if (oldPt === newTerrain) return h;
      setChanges(c => [...c.filter(ch => ch.id !== id), {
        id, rx: h.rx, ry: h.ry, from: oldPt, to: newTerrain, ot: h.ot
      }]);
      return { ...h, pt: newTerrain };
    }));
    setEditingId(null);
  }, []);

  const resetAll = useCallback(() => {
    setHexes(INITIAL_HEXES.map(h => ({ ...h })));
    setChanges([]);
    setEditingId(null);
  }, []);

  const exportReport = useCallback(() => {
    const report = {
      title: "Panamerica Map Editor — Rapport de modifications",
      date: new Date().toISOString(),
      total_changes: changes.length,
      changes: changes.map(c => ({
        hex_id: c.id,
        position: `(${c.rx}, ${c.ry})`,
        original_scythe: c.ot,
        was_panamerica: c.from,
        now_panamerica: c.to,
      })),
      final_map: hexes.map(h => ({
        id: h.id, rx: h.rx, ry: h.ry,
        scythe_terrain: h.ot,
        panamerica_terrain: h.pt,
      })),
      terrain_counts: (() => {
        const c = {};
        hexes.forEach(h => { if (h.pt !== "factory") c[h.pt] = (c[h.pt] || 0) + 1; });
        return c;
      })(),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "panamerica_map_report.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [changes, hexes]);

  const counts = {};
  hexes.forEach(h => { if (h.pt !== "factory") counts[h.pt] = (counts[h.pt] || 0) + 1; });

  const allX = [...hexes.map(h => h.rx), ...HB_DATA.map(h => h.rx)];
  const allY = [...hexes.map(h => h.ry), ...HB_DATA.map(h => h.ry)];
  const pad = 85;
  const minX = Math.min(...allX) - pad;
  const maxX = Math.max(...allX) + pad;
  const minY = Math.min(...allY) - pad;
  const maxY = Math.max(...allY) + pad;

  const editingHex = editingId != null ? hexes.find(h => h.id === editingId) : null;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13 }}>
      {/* Top bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#9B1010" }}>Map Editor</span>
        <button onClick={exportReport} disabled={changes.length === 0}
          style={{
            padding: "5px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer",
            border: "none", fontWeight: 600,
            background: changes.length > 0 ? "#1565C0" : "#ccc",
            color: "#fff", opacity: changes.length > 0 ? 1 : 0.5,
          }}>
          Exporter rapport ({changes.length} modif{changes.length !== 1 ? "s" : ""})
        </button>
        <button onClick={resetAll}
          style={{
            padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
            border: "1px solid #ccc", background: "transparent", color: "#666",
          }}>
          Reset tout
        </button>
        {[
          [showRivers, setShowRivers, "Rivières"],
          [showHB, setShowHB, "Home Bases"],
        ].map(([v, s, l], i) => (
          <label key={i} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, cursor: "pointer" }}>
            <input type="checkbox" checked={v} onChange={e => s(e.target.checked)} />{l}
          </label>
        ))}
      </div>

      {/* Terrain picker (when editing) */}
      {editingHex && (
        <div style={{
          padding: "8px 10px", background: "#fff8e1", borderRadius: 6,
          marginBottom: 8, border: "1px solid #f9a825",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Hex #{editingHex.id} ({editingHex.rx},{editingHex.ry}) —
            actuellement: {TERRAINS[editingHex.pt]?.icon} {TERRAINS[editingHex.pt]?.label}
            <button onClick={() => setEditingId(null)}
              style={{ marginLeft: 8, fontSize: 11, cursor: "pointer", background: "none",
                border: "1px solid #ccc", borderRadius: 4, padding: "2px 8px" }}>
              Annuler
            </button>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {TERRAIN_KEYS.map(tk => {
              const td = TERRAINS[tk];
              const isActive = editingHex.pt === tk;
              return (
                <button key={tk} onClick={() => assignTerrain(editingHex.id, tk)}
                  style={{
                    padding: "4px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer",
                    border: isActive ? "2px solid #333" : "1px solid #ccc",
                    background: td.color, color: "#fff", fontWeight: isActive ? 700 : 400,
                    opacity: isActive ? 1 : 0.8,
                  }}>
                  {td.icon} {td.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        style={{ width: "100%", maxWidth: 680, display: "block", margin: "0 auto" }}>
        <rect x={minX} y={minY} width={maxX-minX} height={maxY-minY}
          fill="#1a1a10" rx={12} />

        {/* Cardinal labels */}
        <text x={(minX+maxX)/2} y={minY+16} textAnchor="middle" fontSize={10}
          fill="rgba(255,200,150,0.5)" fontWeight={500}>NORD — Canada, Toundra</text>
        <text x={(minX+maxX)/2} y={maxY-6} textAnchor="middle" fontSize={10}
          fill="rgba(255,200,150,0.5)" fontWeight={500}>SUD — Mexique, Désert, Sierras</text>
        <text x={minX+12} y={(minY+maxY)/2} textAnchor="middle" fontSize={9}
          fill="rgba(255,200,150,0.35)" fontWeight={500}
          transform={`rotate(-90 ${minX+12} ${(minY+maxY)/2})`}>OUEST — Plaines, Rocheuses</text>
        <text x={maxX-12} y={(minY+maxY)/2} textAnchor="middle" fontSize={9}
          fill="rgba(255,200,150,0.35)" fontWeight={500}
          transform={`rotate(90 ${maxX-12} ${(minY+maxY)/2})`}>EST — Côtes, Bayou</text>

        {/* Rivers */}
        {showRivers && RIVERS.map((pts, i) => {
          const d = pts.map((p, j) => `${j === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ");
          return <path key={`r${i}`} d={d} fill="none"
            stroke="#2c4c9c" strokeWidth={10} strokeLinecap="round"
            strokeLinejoin="round" opacity={0.45} />;
        })}

        {/* Hex tiles */}
        {hexes.map((hex) => {
          const td = TERRAINS[hex.pt];
          if (!td) return null;
          const isEditing = editingId === hex.id;
          const wasChanged = changes.some(c => c.id === hex.id);

          return (
            <g key={hex.id} onClick={() => setEditingId(hex.id)} style={{ cursor: "pointer" }}>
              <polygon points={hexPts(hex.rx, hex.ry)} fill={td.color}
                stroke={isEditing ? "#ffcc00" : wasChanged ? "#00e676" : "rgba(0,0,0,0.3)"}
                strokeWidth={isEditing ? 3.5 : wasChanged ? 2.5 : 1}
                opacity={0.88} />
              <text x={hex.rx} y={hex.ry - 6} textAnchor="middle" fontSize={15}
                style={{ pointerEvents: "none" }}>{td.icon}</text>
              <text x={hex.rx} y={hex.ry + 13} textAnchor="middle" fontSize={8.5}
                fill="#fff" fontWeight={500}
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)", pointerEvents: "none" }}>
                {td.label}
              </text>
              <text x={hex.rx} y={hex.ry - 24} textAnchor="middle" fontSize={6.5}
                fill="rgba(255,255,255,0.35)" style={{ pointerEvents: "none" }}>
                #{hex.id}
              </text>
              {wasChanged && (
                <circle cx={hex.rx + HS * 0.5} cy={hex.ry - HS * 0.4} r={5}
                  fill="#00e676" stroke="#fff" strokeWidth={0.5} />
              )}
            </g>
          );
        })}

        {/* Home bases */}
        {showHB && HB_DATA.map((hb, i) => (
          <g key={`hb${i}`}>
            <circle cx={hb.rx} cy={hb.ry} r={20}
              fill={hb.color} opacity={0.2} />
            <circle cx={hb.rx} cy={hb.ry} r={20}
              fill="none" stroke={hb.color}
              strokeWidth={2.5} strokeDasharray="5 3" />
            <text x={hb.rx} y={hb.ry + 4} textAnchor="middle" fontSize={8.5}
              fill="#fff" fontWeight={600}
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>
              {hb.faction}
            </text>
          </g>
        ))}
      </svg>

      {/* Terrain counts */}
      <div style={{ marginTop: 6, display: "flex", gap: 3, flexWrap: "wrap" }}>
        {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t, n]) => (
          <span key={t} style={{
            padding: "2px 7px", borderRadius: 3,
            background: TERRAINS[t].color, color: "#fff", fontSize: 10, fontWeight: 500,
          }}>
            {TERRAINS[t].label}: {n}
          </span>
        ))}
        <span style={{ padding: "2px 7px", borderRadius: 3, background: "#9B1010", color: "#fff", fontSize: 10 }}>
          Rouge River: 1
        </span>
        <span style={{ padding: "2px 7px", borderRadius: 3, background: "#555", color: "#fff", fontSize: 10 }}>
          Total: {Object.values(counts).reduce((s, v) => s + v, 0) + 1}
        </span>
      </div>

      {/* Change log */}
      {changes.length > 0 && (
        <div style={{ marginTop: 8, padding: "8px 10px", background: "#e8f5e9",
          borderRadius: 6, fontSize: 11, maxHeight: 120, overflowY: "auto" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Modifications ({changes.length}) :
          </div>
          {changes.map((c, i) => (
            <div key={i} style={{ color: "#2e7d32" }}>
              #{c.id} ({c.rx},{c.ry}) : {TERRAINS[c.from]?.label} → <b>{TERRAINS[c.to]?.label}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
