# Correos de marca — Pedro Yoruba Jewelry

Plantillas de notificación de Shopify con la identidad de la marca:
cabecera negra con el logo dorado, franja de colores de los Orishas,
tipografía serif ceremonial, botón dorado y pie con contacto/WhatsApp/redes.

- **`es/`** — juego COMPLETO en español (9 plantillas) ← **el que se instala** (tus clientes hablan español)
- **`en/`** — juego completo en inglés (9 plantillas), guardado por si algún día se necesita

> Shopify **no permite** cambiar estas plantillas por API — se pegan a mano.
> Son 2 minutos por plantilla.

## Cómo instalar cada una

1. **Shopify Admin → Configuración → Notificaciones → Notificaciones de clientes**
2. Abre la notificación correspondiente (tabla de abajo) → **Editar código**
3. **Selecciona TODO el contenido del "Cuerpo del correo (HTML)" y bórralo.**
4. Pega el contenido completo del archivo `.liquid` correspondiente (carpeta `es/`).
5. **Vista previa** para verla y **Enviar correo de prueba** a tu propio email.
6. Guardar.

## Mapa archivo → notificación de Shopify (+ asunto recomendado)

| Archivo (`es/`) | Notificación en Shopify | Asunto sugerido |
|---|---|---|
| `confirmacion-de-pedido.liquid` | Confirmación de pedido | `✦ Tu pedido {{ order_name }} está confirmado — Pedro Yoruba Jewelry` |
| `confirmacion-de-envio.liquid` | Confirmación de envío | `✦ Tu pieza va en camino — pedido {{ order_name }}` |
| `en-reparto.liquid` | En reparto / Pedido en camino | `✦ Tu pieza llega hoy — pedido {{ order_name }}` |
| `entregado.liquid` | Entregado | `✦ Tu pieza ha llegado — que la disfrutes con ashé` |
| `reembolso.liquid` | Reembolso / Notificación de reembolso | `Tu reembolso del pedido {{ order_name }}` |
| `pedido-cancelado.liquid` | Pedido cancelado | `Tu pedido {{ order_name }} ha sido cancelado` |
| `carrito-abandonado.liquid` | Pago abandonado / Carrito abandonado | `✦ Tu pieza te está esperando` |
| `factura-de-pedido-preliminar.liquid` | Factura de pedido preliminar | `✦ Tu factura de Pedro Yoruba Jewelry` |
| `listo-para-recoger.liquid` | Listo para recoger | `✦ Tu pedido {{ order_name }} está listo para recoger` |

## Notas

- **Carrito abandonado**: en Configuración → Pago (Checkout) puedes activar el
  envío automático (recomendado: a las 10 horas). Es el correo que recupera ventas.
- **Factura de pedido preliminar**: ideal para los encargos cotizados por WhatsApp —
  creas un "Pedido borrador" (Draft order) en el admin con la pieza y el precio
  acordado, y el cliente recibe esta factura elegante con botón de pago seguro.
- La **suscripción de marketing** (double opt-in) se dejó con la plantilla por
  defecto de Shopify a propósito: contiene el enlace legal de confirmación y
  no conviene tocarla.
- Todo el CSS va **en línea** y en tablas → se ve bien en Gmail, Outlook, Apple Mail y móvil.
- El logo se carga desde `https://pedrojewelryyoruba.com/assets/images/logo/pedro-yoruba-transparent.png`.
- Colores de marca: negro `#0d0a07`, oro `#cda557`, oro profundo `#98662e`, crema `#f6efe2`.
- Si Shopify marca un error de Liquid al guardar, quedó un trozo de la plantilla
  vieja sin borrar — repite el paso 3 borrando todo antes de pegar.
- Las plantillas se regeneran con un script si hace falta cambiar el diseño de
  todas a la vez — pedírselo a Claude.

## Idea pendiente (no hecha ahora, para no complicar)

Correos bilingües EN/ES con selector — se decidió posponer y priorizar tener
ya mismo los correos en español, terminados y sin errores. Si en el futuro se
quiere retomar: opción A) activar español como idioma publicado en Shopify
(ya existe creado pero sin publicar) para envío automático según el idioma de
compra; opción B) un enlace "EN | ES" dentro del mismo correo que salta a la
sección correspondiente.
