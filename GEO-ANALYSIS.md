# GEO-ANALYSIS.md — pedrojewelryyoruba.com

**Fecha:** 15 de julio de 2026 · **Auditoría:** 4 análisis paralelos (citabilidad, menciones de marca, paisaje de búsqueda IA, técnico) sobre el sitio en vivo.

---

## 1. GEO Readiness Score: **54 / 100**

| Dimensión | Peso | Puntaje | Nota |
|---|---|---|---|
| Citabilidad de pasajes | 25% | 54 | Buena estructura, bloques demasiado cortos |
| Legibilidad estructural | 20% | 60 | Headings-pregunta ✓, falta la tabla clave |
| Contenido multi-modal | 15% | 40 | Fotos ✓, sin video embebido ni tablas/charts |
| Autoridad y marca | 20% | 32 | IG fuerte; cero Reddit/Wikipedia/YouTube de terceros |
| Accesibilidad técnica | 20% | 84 | SSR perfecto, schema rico, llms.txt ✓ |

**Visibilidad actual en las búsquedas objetivo: 8/100** — el dominio no aparece en NINGUNA de las 10 queries objetivo (ver §6). La base técnica está lista; falta contenido citable y señales de marca.

## 2. Desglose por plataforma

| Plataforma | Puntaje | Por qué |
|---|---|---|
| **Google AI Overviews** | ~30 | 92% de citas salen del top-10 orgánico y el sitio no rankea en queries informacionales. Base técnica lista para subir rápido. |
| **ChatGPT (search)** | ~25 | Sin Wikipedia (47.9% de sus citas) ni fuentes de autoridad que mencionen la marca. GPTBot ya tiene acceso ✓. |
| **Perplexity** | ~15 | Reddit = 46.7% de sus citas y la marca tiene CERO presencia ahí. OJO: el nicho entero está vacío en Reddit → first-mover. |
| **Bing Copilot** | ~45 | Sitio verificado en Bing ✓, falta IndexNow. |

## 3. Acceso de crawlers de IA — ✅ COMPLETO

`robots.txt` permite explícitamente: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended. Solo bloquea checkout/cart/api/plantillas. Sitemap declarado (175 URLs con lastmod).

## 4. llms.txt — ✅ PRESENTE y de buena calidad

Conforme al estándar: resumen, NAP completo, horario, materiales, garantía, especialidades, redes. **Corregido hoy:** faltaba la sección del Diario (blog) — ya enlaza las 4 guías publicadas. Pendiente opcional: `llms-full.txt`.

## 5. Menciones de marca (señal 3× más fuerte que backlinks)

| Plataforma | Estado | Detalle |
|---|---|---|
| Instagram | ✅ Fuerte | @pedroyorubajewelry ~80K seguidores, ~20K posts — el activo #1 |
| TikTok | ✅ Fuerte | Cuenta activa + TikTok Shop ya genera páginas "pedro yoruba jewelry reviews" |
| YouTube | ⚠️ Solo propio | Canal propio ✓ pero **cero videos de terceros** (la señal con mayor correlación de citas: ~0.737) |
| Google Maps | ✅ con riesgo | Ficha activa; ya la cita un producto de IA (WanderBoat). Reseñas mixtas. |
| **Yelp** | 🔴 RIESGO | **~2.0 estrellas (7 reseñas)** — quejas de demoras y comunicación. Los motores de IA leen esto como reputación. |
| Reddit | ❌ Cero | Nicho completo vacío → oportunidad first-mover en r/Santeria |
| Wikipedia/Wikidata | ❌ No | Ningún competidor la tiene tampoco (barrera alta para todos) |
| Prensa/blogs del nicho | ❌ Cero | Original Botanica y El Viejo Lázaro sí tienen cobertura |

**Competidores con presencia que la marca no tiene:** Original Botanica (blog que rankea), SanteriaGuide.com, El Viejo Lázaro (YouTube de terceros + reportaje), Orovel's (rankea "pulsera orula oro"), Gardenia Design Miami.

## 6. Paisaje de búsqueda IA (10 queries objetivo) — el sitio aparece en 0/10

| Query | Quién domina hoy | Oportunidad |
|---|---|---|
| que es el idde de orula | ashepamicuba, EcuRed, joyeros CON blog | Guía definitiva + FAQ schema (ya hay base) |
| en que mano se usa el idde | Contenido débil/foros | 1 frase extraíble = snippet fácil |
| colores de los orishas y sus collares | **Tripod, Scribd, dominios muertos** | La SERP más ganable — tabla comparativa |
| herramientas de santo que son | Etsy, PDFs de Scribd | Guía de fabricante real = única fuente experta |
| joyeria yoruba en miami | **La propia marca vía terceros** (Yelp #1, IG, TikTok) — el dominio canónico NO aparece; rankea el duplicado myshopify | **Arreglar el canonical del tema Shopify (pendiente conocido)** |
| donde comprar idde de orula en oro | Marketplaces con chapado | Landing "oro real vs laminado" |
| elekes de santeria comprar | Original Botanica + marketplaces | Página de colección con capa educativa |
| **joyeria para santeros** | **Prácticamente nadie** (solo perfiles sociales) | La SERP MÁS vacía — página pilar propia |
| pulsera de orula oro precio | Joyeros MX con precios visibles | Precios indexables + sección "¿cuánto cuesta?" |
| mayoreo joyeria botanica | Nadie entiende la intención | /mayoreo ya existe — afinar frases literales |

## 7. SSR — ✅ VERIFICADO

Curl sin JavaScript: home, FAQ, blog y producto entregan todo el contenido principal en HTML crudo. Los crawlers de IA (que no ejecutan JS) ven todo. Nota: el HTML de la home pesa ~715 KB (payload RSC) — algunos fetchers de IA truncan; reducir productos precargados es mejora opcional.

## 8. Schema presente

JewelryStore (address+geo+horario+sameAs) · WebSite · FAQPage · Article · BreadcrumbList · Product+Offer (con MerchantReturnPolicy y, desde hoy, **AggregateRating** de Judge.me) · Organization.

**Corregido hoy:** canonical del FAQ apuntaba a la home (perdía el rich result) · AggregateRating faltante · llms.txt sin blog.

## 9. Top 5 cambios de mayor impacto (pendientes)

1. **Arreglar el canonical del tema Shopify** (duplicado myshopify.com se lleva las citas de "joyeria yoruba en miami" — diagnóstico ya hecho, fix diferido).
2. **Reescribir el post de colores de los Orishas** con tabla comparativa + bloques de 134-167 palabras — la SERP más ganable del nicho contra Tripod/Scribd.
3. **Autoría E-E-A-T:** byline de Pedro (Person schema con credenciales: joyero fundador, años de oficio) en los 4 posts + página de autor. En dominio religioso-cultural la falta de autor mata la citabilidad.
4. **Página pilar "Joyería para Santeros"** — SERP vacía, categoría literal del negocio, enlaza todas las colecciones.
5. **Reputación Yelp (2.0★):** responder reseñas + pedir reseñas a clientes felices de WhatsApp. Los motores de IA la leen como señal de confianza.

## 10. Reescrituras concretas de contenido

Detalladas por la auditoría (página → problema → fix con texto propuesto): colores-de-los-orishas (tabla + definición extraíble de "eleke"), que-es-el-idde (bloque "¿Cuánto cuesta un Idde?" con precios reales por quilate — nadie lo publica en español), herramientas-de-santo (tabla por Orisha con "desde $60"), FAQ (3 preguntas nuevas: precio/envío/devoluciones + fecha visible), mayoreo (mínimos de pedido + plazos + bloque "fabricante, no revendedor"), home (bloque de entidad ~150 palabras sobre el footer con quién es Pedro + dirección).

---

*Regenerar esta auditoría: workflow `geo-audit-pedrojewelry` (4 agentes paralelos).*
