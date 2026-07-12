# Cómo seguir trabajando (guía rápida)

Proyecto: **Pedro Yoruba Jewelry** — tienda Next.js (headless) conectada a Shopify, hospedada en Netlify.

- **Carpeta del código (raíz del proyecto):**
  `/Users/pedroantoniomonzon/pedro-joyeria-temp/hiraola-jewelry-store-html-template-2023-11-27-05-03-11-utc/storefront`
- **Repositorio:** https://github.com/Yoruba-dev/web-site-yoruba
- **Web en vivo:** https://pedrojewelryyoruba.com (y https://pedroyorubajewelry.netlify.app)

---

## 1) Abrir otra sesión con Claude

1. Abre una **conversación nueva de Claude Code EN ESTA MISMA carpeta** (`.../storefront`).
2. La **memoria del proyecto se carga sola** → Claude ya sabe todo (web, Shopify, dominio, 3D, etc.). No hay que re-explicar.
3. Empieza directo con lo que quieras: “sigamos con X”, “arregla Y”, etc.

---

## 2) Trabajar en local

```bash
cd .../storefront          # la carpeta de arriba
npm install                # solo la primera vez (o si cambian dependencias)
npm run dev                # servidor local → http://localhost:3000
```

- Editas el código (o Claude lo edita) → se ve al instante en `localhost:3000`.
- Antes de subir, verifica que compila:

```bash
npm run build              # si termina con "✓ Compiled successfully" → todo bien
```

---

## 3) Subir el código y desplegar (deploy)

El deploy es **automático**: cada `push` a la rama **main** hace que **Netlify reconstruya y publique** la web sola (1–2 min).

```bash
git checkout main          # trabajar/subir sobre main
# ...cambios...
npm run build              # verificar que compila
git add -A
git commit -m "descripción corta del cambio"
git push origin main       # ← esto DESPLIEGA la web automáticamente
```

Listo. En 1–2 minutos el cambio está en https://pedrojewelryyoruba.com

### ⚠️ Reglas importantes de git (para que Netlify no falle)
- **NO** pongas `Co-Authored-By:` en los mensajes de commit. Netlify (plan gratis) permite **1 solo contribuidor**; un segundo autor **rompe el deploy**. Mantén todo como el mismo autor (**Yoruba Dev**).
- Si trabajas en la rama `dev`, fusiona a `main` antes de subir:
  ```bash
  git checkout main && git merge dev --ff-only && git push origin main
  ```

---

## 4) Datos y comandos útiles

- **Config del sitio (marca, contacto, redes, banners):** `lib/site.ts`
- **Política de compra (online vs por-encargo/WhatsApp):** `lib/commerce.ts`
  - Para que UNA pieza pida WhatsApp en vez de carrito: agrégale el tag **`encargo`** en Shopify.
- **Modelos 3D:** viven en **Shopify** (media 3D del producto). Generador: `scripts/generate-3d.mjs` (usa Meshy). Nota: la IA solo da modelos fieles en piezas **simples**; los sets intrincados necesitan CAD/modelado pro.
- **Variables de entorno** (tokens de Shopify, Meshy, etc.): `.env.local` (NO se sube a git).

```bash
# ver el estado del repo
git status
# ver los últimos cambios
git log --oneline -10
# confirmar que local = remoto
git fetch && git log --oneline -1 origin/main
```

---

*El diseño y la lógica están documentados en el propio código (comentarios). La memoria de Claude guarda el contexto entre sesiones.*
