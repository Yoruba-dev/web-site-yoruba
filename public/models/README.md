# Modelos 3D del personalizador

Aquí viven los modelos `.glb` de las piezas que se personalizan en 3D (`/personalizar`).

- `ejemplo-*.glb` → modelos de ejemplo (solo para demostrar el cargador).
- `products/<handle>.glb` → **el modelo real de cada producto**. El personalizador lo
  carga **automáticamente** cuando abres `/personalizar?handle=<handle>` (o el botón
  "Personalizar" del producto). El modelo se **auto-encaja** (centra y escala) solo.

## Generar los 150 modelos desde las fotos (IA foto→3D, automatizado)

Está todo listo: con tu API key de [Meshy](https://www.meshy.ai), dos comandos generan
y conectan los 150. **Yo no puedo correrlo** (necesita tu cuenta/créditos), tú sí.

```bash
# 1) Exporta el manifiesto (producto + foto). Ya generado: scripts/products-manifest.json
node scripts/export-products.mjs

# 2) Prueba con 3 piezas primero (para validar calidad/coste):
LIMIT=3 MESHY_API_KEY=msy_tu_clave node scripts/generate-models-meshy.mjs

# 3) Si te gusta, genera todos (reanudable: salta los que ya existen):
MESHY_API_KEY=msy_tu_clave node scripts/generate-models-meshy.mjs
```

Cada modelo se guarda en `public/models/products/<handle>.glb` y queda **conectado
solo**. No tienes que editar código.

> Coste: Meshy cobra créditos por modelo. Empieza con `LIMIT=3` para calibrar. Tripo y
> Rodin son alternativas equivalentes (cambiarían solo la URL/headers del script).

## Añadir UNA pieza a mano (sin script)

1. Genera/exporta su `.glb` (Meshy/Tripo manual, o Blender/escaneo).
2. Guárdalo como `public/models/products/<handle>.glb` (usa el handle exacto del producto).
3. Listo — `/personalizar?handle=<handle>` ya lo usa.

## Recomendaciones
- `.glb` **ligeros** (< 5 MB) para que carguen rápido en móvil. Comprime con
  [gltf-transform](https://gltf-transform.dev) o Draco.
- Orienta la cara grabable hacia **+Z**; si el grabado queda mal ubicado, ajusta
  `decalPos` / `decalScale` de esa pieza en `lib/customizer-models.ts`.
