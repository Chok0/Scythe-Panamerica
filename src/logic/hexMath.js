export const HS = 54;

export const hPts = (cx, cy, s) => {
  const sz = s || HS;
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${cx + sz * Math.cos(a)},${cy + sz * Math.sin(a)}`;
  }).join(" ");
};

export const edgeGeo = (idA, idB, hMap) => {
  const a = hMap[idA], b = hMap[idB];
  if (!a || !b) return null;
  const mx = (a.rx + b.rx) / 2, my = (a.ry + b.ry) / 2;
  const dx = b.rx - a.rx, dy = b.ry - a.ry;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (!len) return null;
  const px = -dy / len, py = dx / len, half = HS * 0.52;
  return { x1: mx + px * half, y1: my + py * half, x2: mx - px * half, y2: my - py * half, mx, my };
};

export const seededRand = (seed) => {
  let s = seed * 9301 + 49297;
  return () => { s = (s * 49297 + 233280) % 233280; return s / 233280; };
};

export const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
