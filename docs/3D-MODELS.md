# Modelos 3D + Realidad Aumentada

Cada página de producto muestra un **visor 3D + AR** (botón "Ver en tu espacio")
cuando la pieza tiene un modelo 3D. El visor
(`components/product/Product3DViewer.tsx`) usa `<model-viewer>` de Google y lee
los modelos **directamente de la media del producto en Shopify** — la misma
fuente única que las fotos, precios y stock.

## Cómo una pieza obtiene su modelo 3D

1. **Generar** un `.glb` a partir de las fotos de la pieza con **Meshy**
   (imagen → 3D).
2. **Adjuntar** el `.glb` al producto en Shopify:
   - **Manual:** Shopify admin → producto → *Media* → arrastra el `.glb`.
     Shopify genera solo el archivo AR de iPhone (`.usdz`) y lo procesa.
   - **Automático:** el script `scripts/generate-3d.mjs` (ver abajo).
3. El sitio lo detecta solo — aparece la pestaña **"✦ Ver en 3D / AR"**.

¿Aún sin modelos? La pestaña simplemente no aparece — nada se ve roto.

## Generación automática con la API de Meshy

Flujo del script `scripts/generate-3d.mjs`:
1. Lee los productos de Shopify.
2. Envía la primera foto de cada producto a Meshy (image-to-3D).
3. Espera a que el modelo esté listo y descarga el `.glb`.
4. Lo sube a ese producto en Shopify como modelo 3D.

Variables necesarias en `.env.local`:

| Variable | Para qué | Dónde |
|---|---|---|
| `MESHY_API_KEY` | Generar los `.glb` | Meshy.ai → API Keys (plan con acceso API) |
| `SHOPIFY_ADMIN_API_TOKEN` | Subir el `.glb` a Shopify | Custom app con scope `write_products` |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Tienda | ya configurada |

## Estado

- ✅ **Visor 3D + AR:** en vivo. Sube un `.glb` a un producto y aparece solo.
- ✅ **Lectura desde Shopify** (`Model3d` media) → `Product.model3d`.
- ✅ **Script de generación con Meshy:** `scripts/generate-3d.mjs` (image → 3D →
  sube a Shopify). Requiere `MESHY_API_KEY` (ya en `.env.local`) y un
  `SHOPIFY_ADMIN_API_TOKEN` con `write_products` para subir los modelos.
