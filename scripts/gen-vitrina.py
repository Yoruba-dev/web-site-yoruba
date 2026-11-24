#!/usr/bin/env python3
"""Imágenes pequeñas de la VITRINA del creador de relojes (muestras de correa y
de esfera). Salen SOLO de nuestras capas (public/assets/images/reloj/capas/
*-1200.webp); nada de internet. Se corre a mano cuando cambian las capas:

    python3 scripts/gen-vitrina.py

Salida: public/assets/images/reloj/vitrina/
  caucho-<color>.webp            punta de la correa, con su muesca (foto 1)
  piel-<color>-<acabado>.webp    punta de la correa con su terminal metálico
  brazalete-<acabado>.webp       tramo del brazalete
  tipo-*.webp                    macro del material (tarjetas de Tipo)
  caja-<acabado>.webp            marco del mini reloj
  dial-<base>.webp               esfera sol
  dial-degradado-<clave>-p<n>.webp
  indices[-ifa][-sin].svg        lo aplicado sobre la esfera (-sin: sin el aplique
                                 PY, para ponerle encima la foto del de verdad)

Reglas (PLAN-REALISMO-V3 §6.1): un solo encuadre por grupo — todas las piezas
de un grupo llevan la MISMA silueta (la de la mayoría), así que la IoU entre
ellas es 1 —, filo claro de 1 px para que el negro se lea sobre el panel, y el
color es el de la capa, que es el que usa la vista 3D (STRAP_PHOTO_TONE).
"""
import math
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
RELOJ = os.path.normpath(os.path.join(AQUI, "../public/assets/images/reloj"))
CAPAS = os.path.join(RELOJ, "capas")
OUT = os.path.join(RELOJ, "vitrina")

CAUCHO = ["negro", "gris", "blanco", "azul-marino", "azul", "naranja", "verde", "rojo", "tan"]
PIEL = ["verde", "rojo", "azul-marino"]
ACABADOS = ["acero", "pvd-negro", "oro-rosa"]
SOL = ["blanco", "negro", "rojo", "verde", "azul"]
GRAD = ["orula", "eleggua", "chango", "chango-vino", "yemaya", "oshun", "oya", "ogun", "obatala", "babalu-aye", "olokun"]
PX_MM = 16.3934

os.makedirs(OUT, exist_ok=True)
total = 0


def capa(nombre):
    return Image.open(os.path.join(CAPAS, f"{nombre}-1200.webp")).convert("RGBA")


def mayor(m):
    """La mancha más grande de una máscara booleana (fuera las astillas de la
    corona y las rayitas del recorte)."""
    h, w = m.shape
    lab = np.zeros((h, w), np.int32)
    mejor, mejor_n, cur = 0, 0, 0
    for y0, x0 in zip(*np.nonzero(m)):
        if lab[y0, x0]:
            continue
        cur += 1
        n = 0
        q = deque([(y0, x0)])
        lab[y0, x0] = cur
        while q:
            y, x = q.popleft()
            n += 1
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < h and 0 <= xx < w and m[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = cur
                    q.append((yy, xx))
        if n > mejor_n:
            mejor, mejor_n = cur, n
    return lab == mejor


def rellena(rgb, ok, n=14):
    """Extiende el color de dentro hacia fuera (n px), para que la silueta común
    nunca enseñe el borde sucio ni un hueco de una capa concreta."""
    rgb = rgb.astype(np.float32).copy()
    ok = ok.copy()
    for _ in range(n):
        suma = np.zeros_like(rgb)
        peso = np.zeros(ok.shape, np.float32)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            o = np.roll(ok, (dy, dx), (0, 1))
            suma += np.roll(rgb, (dy, dx), (0, 1)) * o[..., None]
            peso += o
        nuevo = (~ok) & (peso > 0)
        rgb[nuevo] = suma[nuevo] / peso[nuevo][:, None]
        ok |= nuevo
    return rgb


def suaviza(m, r=1.6):
    """Máscara booleana → alfa con borde suave y contorno sin dientes."""
    im = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))
    a = np.asarray(im, np.float32) / 255
    return np.clip((a - 0.5) * 2.2 + 0.5, 0, 1)


def encoge(m, n):
    im = Image.fromarray((m * 255).astype(np.uint8))
    for _ in range(n):
        im = im.filter(ImageFilter.MinFilter(3))
    return np.asarray(im) > 127


def filo(rgb, m, grosor):
    """Filo claro por dentro del contorno (≈ 1 px de CSS): más fuerte cuanto más
    oscura es la pieza, para que el negro se lea sobre el panel oscuro."""
    lum = float(np.median((rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722)[m])) / 255
    fuerza = 0.16 + 0.34 * max(0.0, 1 - lum / 0.45)
    dentro = encoge(m, grosor)
    b = (m & ~dentro).astype(np.float32)
    b = np.asarray(Image.fromarray((b * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255
    k = (b * fuerza)[..., None]
    return rgb * (1 - k) + 255 * k


def guarda(im, nombre, ancho, q=78):
    global total
    alto = round(im.height * ancho / im.width)
    im = im.resize((ancho, alto), Image.LANCZOS)
    p = os.path.join(OUT, f"{nombre}.webp")
    im.save(p, "WEBP", quality=q, alpha_quality=92, method=6)
    total += os.path.getsize(p)


def grupo(nombres, caja, salidas, ancho, recorte=None, q=78, abre=capa):
    """Un grupo entero con la MISMA silueta (mayoría de sus capas)."""
    capas = [abre(n).crop(caja) for n in nombres]
    arr = [np.asarray(c) for c in capas]
    masks = [mayor(a[..., 3] > 127) for a in arr]
    m = np.sum(masks, 0) * 2 > len(masks)
    m = mayor(m)
    if recorte is not None:
        m = recorte(m)
    alfa = suaviza(m)
    duro = alfa > 0.02
    # 1 px de CSS ≈ caja/76 px de la pieza mostrada
    grosor = max(2, round(m.shape[1] / 76 * 0.75))
    for a, mk, s in zip(arr, masks, salidas):
        rgb = rellena(a[..., :3], encoge(mk, 3))
        if s == "caucho-blanco":
            # La capa blanca trae la sombra de las costillas muy gris (mediana
            # #bdbdbd; el 3D la pinta #ececea): se aclaran los medios tonos.
            rgb = 255 * (np.clip(rgb, 0, 255) / 255) ** 0.55
        rgb = filo(rgb, duro, grosor)
        out = np.dstack([np.clip(rgb, 0, 255), alfa * 255]).astype(np.uint8)
        im = Image.fromarray(out)
        ys, xs = np.nonzero(duro)
        im = im.crop((xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3))
        guarda(im, s, ancho, q)
    print(f"  {salidas[0].split('-')[0]}: {len(salidas)} piezas, misma silueta {m.sum()} px")


# — Caucho: punta con la muesca de la foto 1 ————————————————————————————————————
# Las capas llenan el hueco de la muesca con una lengüeta de caucho; la correa del
# dueño (foto 1) acaba en dos puntas con la muesca abierta, y las costillas nacen
# en ella. Se abre la muesca hasta la primera costilla (2 mm bajo las puntas).
CX0, CY0, CX1, CY1 = 395, 1120, 812, 1475
MUESCA_Y = 1204


def corta_caucho(m):
    m = m.copy()
    fila = m[1150 - CY0]
    xs = np.nonzero(fila)[0]
    izq, der = xs.min(), xs.max()
    m[: MUESCA_Y - CY0, :][:, izq - 3 : der + 4] = False
    # fuera las puntas de 1 px que las capas dejan en las esquinas de arriba
    cols = m.sum(0)
    m[:, cols < 60] = False
    # el pie, plano: por donde todas las capas son opacas
    m[1464 - CY0 :] = False
    return mayor(m)


grupo(
    [f"correa-caucho-{c}" for c in CAUCHO],
    (CX0, CY0, CX1, CY1),
    [f"caucho-{c}" for c in CAUCHO],
    176,
    corta_caucho,
)


def corta_pie(y):
    def f(m):
        m = m.copy()
        m[y:] = False
        cols = m.sum(0)
        m[:, cols < 60] = False
        return mayor(m)

    return f


# — Piel: con su terminal metálico (sigue el acabado de la caja) ————————————————
def piel(nombre):
    """El cuero sale SIEMPRE de la capa en acero (las recoloreadas traen una mancha
    en una esquina) y de la del acabado, solo el terminal."""
    acabado = next(f for f in ACABADOS if nombre.endswith(f"-{f}"))
    base = capa(nombre[: -len(acabado)] + "acero")
    caja = (488, 1130, 724, 1214)
    base.paste(capa(nombre).crop(caja), caja[:2])
    return base


grupo(
    [f"correa-piel-{c}-{f}" for c in PIEL for f in ACABADOS],
    (385, 1120, 816, 1570),
    [f"piel-{c}-{f}" for c in PIEL for f in ACABADOS],
    200,
    corta_pie(1545 - 1120),
    abre=piel,
)

# — Brazalete ———————————————————————————————————————————————————————————————————
grupo(
    [f"brazalete-{f}" for f in ACABADOS],
    (395, 1120, 812, 1475),
    [f"brazalete-{f}" for f in ACABADOS],
    224,
    corta_pie(1460 - 1120),
)

# — Macro del material para las tarjetas de Tipo (mismo encuadre: 18 × 10 mm) ————
for nombre, sal in (
    [(f"correa-caucho-{c}", f"tipo-caucho-{c}") for c in CAUCHO]
    + [(f"correa-piel-{c}-acero", f"tipo-piel-{c}") for c in PIEL]
    + [(f"brazalete-{f}", f"tipo-brazalete-{f}") for f in ACABADOS]
):
    im = capa(nombre).crop((458, 1212, 742, 1376))
    fondo = Image.new("RGB", im.size, (20, 17, 12))
    fondo.paste(im, (0, 0), im)
    if sal == "tipo-caucho-blanco":
        fondo = fondo.point([round(255 * (v / 255) ** 0.55) for v in range(256)] * 3)
    guarda(fondo, sal, 284, q=72)

# — Mini reloj: la caja del paso 1 como marco de cada esfera ———————————————————
# Recorte cuadrado de 740 px centrado en la esfera: en él, la esfera (r = 250 px)
# ocupa el 67.6 %, y así se coloca en CSS bajo la caja (.rl-mini).
MINI = 740
for f in ACABADOS:
    c = np.asarray(capa(f"caja-{f}").crop((600 - MINI // 2, 800 - MINI // 2, 600 + MINI // 2, 800 + MINI // 2)))
    m = mayor(c[..., 3] > 127)
    # el filo va solo en la silueta de fuera: con la ventana tapada
    yy, xx = np.mgrid[0:MINI, 0:MINI]
    lleno = m | ((xx - MINI / 2) ** 2 + (yy - MINI / 2) ** 2 < 240**2)
    rgb = np.where(m[..., None], filo(c[..., :3].astype(np.float32), lleno, 9), c[..., :3])
    alfa = np.where(m, c[..., 3], 0)
    guarda(Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alfa]).astype(np.uint8)), f"caja-{f}", 152, q=80)
for d in SOL:
    guarda(capa(f"esfera-{d}").crop((350, 550, 850, 1050)), f"dial-{d}", 92, q=76)
for g in GRAD:
    for n in (1, 2, 3, 4, 5):
        guarda(capa(f"esfera-degradado-{g}-p{n}").crop((350, 550, 850, 1050)), f"dial-degradado-{g}-p{n}", 92, q=74)


# — Índices (SVG, en px del recorte de MINI): DIAL_LAYOUT en mm × 16.3934 ———————
def indices(ifa, aplique):
    C = MINI // 2
    mm = lambda v: round(v * PX_MM, 1)
    p = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 740 740"><defs>'
        '<linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfcfd"/>'
        '<stop offset=".5" stop-color="#8f969d"/><stop offset="1" stop-color="#e3e7ea"/></linearGradient>'
        '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/>'
        '<stop offset=".45" stop-color="#d9a634"/><stop offset="1" stop-color="#8a5f12"/></linearGradient></defs>'
    ]
    lume = 'fill="#f1f2e8" stroke="url(#s)" stroke-width="6" stroke-linejoin="round"'
    if ifa:
        # Esfera Ifá: el anillo de los 16 (solo su ritmo: a este tamaño los signos
        # no se leen y no se inventan).
        for k in range(16):
            a = math.radians(k * 22.5)
            r = 10.75 if k != 4 else 7.8
            p.append(f'<circle cx="{C + mm(r * math.sin(a)):.1f}" cy="{C - mm(r * math.cos(a)):.1f}" r="11" fill="url(#g)"/>')
    else:
        p.append(f'<path d="M{C - mm(1.6)} {C - mm(12.5)}H{C + mm(1.6)}L{C} {C - mm(9.5)}Z" {lume}/>')
        for h in (1, 2, 4, 5, 7, 8, 10, 11):
            a = math.radians(h * 30)
            p.append(f'<circle cx="{C + mm(11.3 * math.sin(a)):.1f}" cy="{C - mm(11.3 * math.cos(a)):.1f}" r="{mm(1.2)}" {lume}/>')
        L, W = mm(3.6), mm(1.45)
        p.append(f'<rect x="{C - W / 2:.1f}" y="{C + mm(10.8) - L / 2:.1f}" width="{W}" height="{L}" {lume}/>')
        p.append(f'<rect x="{C - mm(10.8) - L / 2:.1f}" y="{C - W / 2:.1f}" width="{L}" height="{W}" {lume}/>')
    p.append(f'<rect x="{C + mm(10.55) - mm(1.75):.1f}" y="{C - mm(1.3)}" width="{mm(3.5)}" height="{mm(2.6)}" fill="#f7f6f2" stroke="url(#s)" stroke-width="7"/>')
    # aplique PY: escudo de 5 × 6 mm bajo las 12 (a 50 px solo se lee su mancha)
    if aplique:
        sy = C - mm(5.6)
        p.append(
            f'<path d="M{C - 41} {sy - 46}H{C + 41}V{sy}Q{C + 41} {sy + 34} {C} {sy + 50}Q{C - 41} {sy + 34} {C - 41} {sy}Z" '
            'fill="url(#g)" stroke="#6b4a0e" stroke-width="4"/>'
        )
    p.append("</svg>")
    return "".join(p)


for nombre, es_ifa, con in (
    ("indices", False, True),
    ("indices-ifa", True, True),
    ("indices-sin", False, False),
    ("indices-ifa-sin", True, False),
):
    ruta = os.path.join(OUT, f"{nombre}.svg")
    with open(ruta, "w") as fh:
        fh.write(indices(es_ifa, con))
    total += os.path.getsize(ruta)

print(f"total {total / 1024:.1f} KB en {OUT}")
if total > 480 * 1024:
    print("demasiado peso en disco: revisa tamaños", file=sys.stderr)
    sys.exit(1)
