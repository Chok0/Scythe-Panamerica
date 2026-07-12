import numpy as np
from PIL import Image
import os

N = 256
OUT = "/home/user/Scythe-Panamerica/src/assets/terrains"
os.makedirs(OUT, exist_ok=True)

def hx(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i+2],16) for i in (0,2,4)], dtype=np.float64)

# grad = [light, mid, dark] (from terrains.js)
PAL = {
 "montagne": ["#a8a89c","#7d7d72","#4e4e45"],
 "sierra":   ["#bfa070","#94764e","#5e4a2e"],
 "champs":   ["#dfc25e","#b99b3e","#7d6825"],
 "plaine":   ["#bcb968","#98944a","#63602a"],
 "village":  ["#c98f62","#a06a42","#6b4228"],
 "foret":    ["#699a52","#477339","#28481e"],
 "toundra":  ["#a7b0bd","#7d8896","#4e5a68"],
 "desert":   ["#dfbf78","#b39252","#7d6335"],
 "lac":      ["#5f94ba","#3a688e","#1e405e"],
 "marecage": ["#75a179","#527a56","#2e4a32"],
 "factory":  ["#a5493a","#742e23","#421812"],
}

def value_noise(period, seed):
    rng = np.random.default_rng(seed)
    g = rng.random((period, period))
    coord = np.linspace(0, period, N, endpoint=False)
    i0 = np.floor(coord).astype(int) % period
    i1 = (i0 + 1) % period
    f = coord - np.floor(coord); f = f*f*(3-2*f)
    g00 = g[np.ix_(i0,i0)]; g01 = g[np.ix_(i0,i1)]
    g10 = g[np.ix_(i1,i0)]; g11 = g[np.ix_(i1,i1)]
    fx = f[None,:]; fy = f[:,None]
    top = g00*(1-fx)+g01*fx; bot = g10*(1-fx)+g11*fx
    return top*(1-fy)+bot*fy

def fractal(base, octaves, persistence, seed):
    tot = np.zeros((N,N)); amp=1.0; norm=0.0
    for o in range(octaves):
        tot += amp*value_noise(base*(2**o), seed+o*13); norm+=amp; amp*=persistence
    v = tot/norm
    return (v - v.min())/(np.ptp(v)+1e-9)

def ramp3(v, dark, mid, light):
    v = np.clip(v,0,1)[...,None]; lo=(v<0.5)
    t = np.where(lo, v/0.5, (v-0.5)/0.5)
    a = np.where(lo, dark, mid); b = np.where(lo, mid, light)
    return a*(1-t)+b*t

def bright(img, m):  # m in [-1,1] multiplier field
    return np.clip(img*(1+m[...,None]), 0, 255)

Y, X = np.mgrid[0:N, 0:N].astype(np.float64)

def build(name):
    light, mid, dark = [hx(c) for c in PAL[name]]
    s = abs(hash(name)) % 100000
    base = fractal(6, 5, 0.55, s)          # main terrain variation
    det  = fractal(24, 3, 0.5, s+7)        # fine grain
    img = ramp3(base, dark, mid, light)

    if name == "foret":
        clump = fractal(4, 4, 0.6, s+3)
        shade = np.clip((0.5-clump)*1.4, 0, 1)         # dark canopy clusters
        img = bright(img, -0.35*shade)
        img = bright(img, 0.25*(det-0.5))               # leaf speckle
        hl = (det>0.82)&(clump>0.5)
        img[hl] = img[hl]*0.5 + light*0.5
    elif name in ("plaine",):
        img = bright(img, 0.18*(det-0.5))
        rows = 0.5+0.5*np.sin(Y*0.6 + fractal(8,2,0.5,s+2)*6)
        img = bright(img, 0.06*(rows-0.5))
    elif name == "champs":
        warp = fractal(6,2,0.5,s+2)
        rows = 0.5+0.5*np.sin((Y*0.30) + warp*4)       # cultivated furrows
        img = bright(img, 0.22*(rows-0.5))
        img = bright(img, 0.12*(det-0.5))
    elif name in ("montagne","sierra"):
        ridge = 1-np.abs(2*fractal(5,5,0.55,s+4)-1)     # rock ridges/cracks
        img = bright(img, 0.4*(ridge-0.5))
        crev = fractal(18,3,0.5,s+9)
        img = bright(img, -0.3*np.clip(0.35-crev,0,1)*2)
    elif name == "desert":
        dune = fractal(3,3,0.5,s+1)
        img = ramp3(dune, dark, mid, light)
        ripple = 0.5+0.5*np.sin(X*0.5 + Y*0.18 + fractal(6,2,0.5,s+5)*5)
        img = bright(img, 0.07*(ripple-0.5))
        img = bright(img, 0.06*(det-0.5))
    elif name == "toundra":
        img = bright(img, 0.1*(det-0.5))
        snow = np.clip((base-0.62)/0.38,0,1)            # snow patches
        img = img*(1-snow[...,None]*0.7) + np.array([235,240,246])*(snow[...,None]*0.7)
    elif name == "lac":
        img = ramp3(fractal(4,3,0.5,s), dark, mid, light)
        rip = np.sin(Y*0.9 + fractal(6,2,0.5,s+5)*7) + np.sin(X*0.35+Y*0.2)
        img = bright(img, 0.10*np.clip(rip,-1,1))
        gl = (det>0.8); img[gl] = img[gl]*0.6 + np.array([200,225,245])*0.4
    elif name == "marecage":
        blot = fractal(4,4,0.6,s+3)
        brown = hx("#5a5638")
        mix = np.clip((blot-0.45)*2,0,1)[...,None]
        img = img*(1-mix*0.5) + brown*(mix*0.5)
        water = (base<0.3)
        img[water] = img[water]*0.5 + hx("#2e4038")*0.5
        img = bright(img, 0.1*(det-0.5))
    elif name == "village":
        img = bright(img, 0.14*(det-0.5))
        rng = np.random.default_rng(s)
        roof_cols = [hx("#8a5236"), hx("#9c6b44"), hx("#6b4a30"), hx("#b5794e")]
        step=22
        for gy in range(0, N, step):
            for gx in range(0, N, step):
                if rng.random()<0.55:
                    w=rng.integers(9,15); h=rng.integers(9,15)
                    oy=gy+rng.integers(0,6); ox=gx+rng.integers(0,6)
                    c=roof_cols[rng.integers(0,len(roof_cols))]
                    ys=np.arange(oy,oy+h)%N; xs=np.arange(ox,ox+w)%N
                    img[np.ix_(ys,xs)] = img[np.ix_(ys,xs)]*0.25 + c*0.75
        img = bright(img, 0.05*(det-0.5))
    elif name == "factory":
        img = bright(img, 0.18*(det-0.5))
        streak = 0.5+0.5*np.sin((X+Y)*0.4 + fractal(6,2,0.5,s+5)*5)
        img = bright(img, 0.14*(streak-0.5))
        rng = np.random.default_rng(s+11)
        for _ in range(120):  # rivets / hot spots
            px,py = rng.integers(0,N,2); r=rng.integers(1,3)
            ys=np.arange(py-r,py+r+1)%N; xs=np.arange(px-r,px+r+1)%N
            img[np.ix_(ys,xs)] = img[np.ix_(ys,xs)]*0.4 + hx("#d68a4e")*0.6
    else:
        img = bright(img, 0.15*(det-0.5))

    # légère désaturation globale (§2.3 : plateau désaturé → le contour de faction porte l'info de contrôle)
    gray = img.mean(axis=2, keepdims=True)
    img = img*0.82 + gray*0.18
    out = Image.fromarray(np.clip(img,0,255).astype(np.uint8), "RGB")
    path = os.path.join(OUT, f"{name}.webp")
    out.save(path, "WEBP", quality=82, method=6)
    return os.path.getsize(path)

total=0
for k in PAL:
    sz = build(k); total+=sz
    print(f"{k:10s} {sz/1024:5.1f} KB")
print(f"TOTAL {total/1024:.0f} KB")
