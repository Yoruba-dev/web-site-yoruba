// La cola entre la web y el programa de la PC de la impresora.
//
// No hay base de datos en este proyecto, así que la cola vive en Netlify
// Blobs. Dos clases de llave:
//
//   REGISTROS (se quedan para siempre, son el cerrojo contra duplicados)
//     compra/<fulfillmentOrder>  una por pedido con etiqueta automática (USPS
//                                que compra este código, o FedEx que compra
//                                Flow). Se crea con onlyIfNew: si Flow reintenta
//                                o dispara dos veces, la segunda no encuentra
//                                hueco y no se paga otra etiqueta.
//     revisado/<fulfillmentOrder> los motivos por los que se apartó ese pedido.
//                                Liberarlo los da por buenos.
//     trabajo/<id>               lo que la PC tiene que hacer. También onlyIfNew:
//                                un aviso repetido no abre el pedido dos veces.
//
//   ÍNDICES (pequeños: solo lo vivo, se borran al terminar)
//     activa/<fulfillmentOrder>  compras sin terminar.
//     pendiente/<id>             trabajos que la PC aún no hizo.
//   La PC pregunta cada 30 s; si cada consulta leyera TODOS los registros, en
//   unos meses tardaría más que el límite de Netlify y dejaría de imprimir.
//   Con los índices, cada consulta lee solo lo pendiente — casi siempre nada.
//
//   archivo/<etiqueta>           el PDF. Lleva nombre y dirección de la
//                                clienta: se borra al cerrar el trabajo.
//
// Consistencia fuerte siempre: con la eventual, un reintento de Flow que llega
// en el mismo segundo podría no ver el cerrojo del primero.

import { getStore } from "@netlify/blobs";

function almacen() {
  return getStore({ name: "etiquetas", consistency: "strong" });
}

const ahora = () => new Date().toISOString();

/**
 * Escritura condicional que no se fía de un "modified" sin ETag. Una escritura
 * que de verdad cambió algo SIEMPRE trae ETag; si no la trae, Blobs falló de
 * otra forma (no un 412) y tratarlo como éxito rompería el cerrojo — dos
 * procesos creerían haber ganado y se pagarían dos etiquetas.
 */
async function setCondicional(
  llave: string,
  valor: string,
  opciones: { onlyIfNew: true } | { onlyIfMatch: string },
): Promise<boolean> {
  const r = await almacen().set(llave, valor, opciones);
  if (r.modified && !r.etag) throw new Error("Blobs: escritura condicional sin confirmar");
  return r.modified;
}

/** Lee varias llaves a la vez, pocas en paralelo (Blobs limita la ráfaga). */
async function leerVarias<T>(llaves: string[]): Promise<(T | null)[]> {
  const out: (T | null)[] = new Array(llaves.length).fill(null);
  let i = 0;
  const hilo = async () => {
    while (i < llaves.length) {
      const n = i++;
      const t = await almacen().get(llaves[n], { type: "text" });
      out[n] = t ? (JSON.parse(t) as T) : null;
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, llaves.length) }, hilo));
  return out;
}

// ---------- compras ----------

export type EstadoCompra =
  | "reclamada" // recibida, aún sin pedir nada a Shopify
  | "flow" // $1.000 o más: Flow compra la FedEx; aquí solo se vigila que lo haga
  | "lanzando" // a punto de pedir la compra: si algo se cae aquí, NO se
  //                 reintenta sola (podría pagarse dos veces); se avisa
  | "comprando" // Shopify aceptó la compra y la está procesando
  | "comprada" // etiqueta pagada y su PDF en la cola
  | "fallida" // no se compró, o no se sabe: aviso en la PC
  | "omitida"; // no tocaba comprarla (apartada, $1.000+, ya preparada…). Nunca
//                 se pidió nada a Shopify: si Flow vuelve a avisar (el dueño
//                 liberó el pedido), se puede reclamar otra vez.

const TERMINALES: EstadoCompra[] = ["comprada", "fallida", "omitida"];

/** ¿Sigue viva? Sin terminar, o terminada con un aviso aún por entregar. */
const viva = (c: Compra) => !TERMINALES.includes(c.estado) || (!!c.aviso && !c.avisado);

export interface Compra {
  fulfillmentOrderId: string;
  pedido: string;
  orderId: string;
  estado: EstadoCompra;
  resultadoId?: string;
  etiquetaId?: string;
  motivo?: string;
  intentos?: number;
  /** Cuándo se pidió la compra a Shopify (para el plazo de "comprando"). */
  lanzada?: string;
  /**
   * Aviso para la PC que aún no se entregó. Se guarda DENTRO de la compra al
   * cerrarla, y la compra no sale del índice activa/ hasta que el aviso está
   * en la cola. Así un fallo de red entre "cerrar" y "avisar" no puede dejar
   * una etiqueta pagada sin que nadie se entere: la próxima consulta lo reenvía.
   */
  aviso?: { id: string; titulo: string; mensaje: string; adminUrl?: string };
  avisado?: boolean;
  creada: string;
  actualizada: string;
}

/**
 * Toma el pedido para comprarle la etiqueta. Devuelve false si ya se estaba
 * (o se había) comprado. Una compra "omitida" nunca pidió nada a Shopify, así
 * que se puede volver a tomar; y una "flow" que se pide otra vez como "flow" es
 * Flow repitiendo la misma pregunta: misma respuesta.
 */
export async function reclamarCompra(
  datos: Pick<Compra, "fulfillmentOrderId" | "pedido" | "orderId">,
  llave: string,
  estado: "reclamada" | "flow" = "reclamada",
): Promise<boolean> {
  const compra: Compra = { ...datos, estado, creada: ahora(), actualizada: ahora() };
  const nueva = await setCondicional(`compra/${llave}`, JSON.stringify(compra), { onlyIfNew: true });
  if (nueva) {
    await almacen().set(`activa/${llave}`, "1");
    return true;
  }
  const actual = await almacen().getWithMetadata(`compra/${llave}`, { type: "text" });
  const previa = actual ? (JSON.parse(actual.data) as Compra) : null;
  if (previa?.estado === "omitida" && actual?.etag) {
    const ok = await setCondicional(`compra/${llave}`, JSON.stringify(compra), {
      onlyIfMatch: actual.etag,
    });
    if (ok) await almacen().set(`activa/${llave}`, "1");
    return ok;
  }
  // Ya existía. Puede ser un duplicado de verdad… o que la escritura llegó
  // pero su respuesta se perdió (Blobs reintenta y recibe 412), o que el
  // índice no llegó a escribirse. Re-asegurar el índice es inofensivo y evita
  // que un pedido se quede sin etiqueta ni aviso.
  if (previa && viva(previa)) await almacen().set(`activa/${llave}`, "1");
  return previa?.estado === "flow" && estado === "flow";
}

export async function leerCompra(llave: string): Promise<Compra | null> {
  const t = await almacen().get(`compra/${llave}`, { type: "text" });
  return t ? (JSON.parse(t) as Compra) : null;
}

/**
 * Pasa una compra de un estado a otro SOLO si sigue en el estado esperado,
 * comparando la ETag. Si dos procesos intentan mover la misma compra a la vez,
 * uno gana y el otro recibe null: así una etiqueta nunca se paga dos veces.
 */
export async function moverCompra(
  llave: string,
  de: EstadoCompra,
  cambios: Partial<Compra> & { estado: EstadoCompra },
): Promise<Compra | null> {
  const actual = await almacen().getWithMetadata(`compra/${llave}`, { type: "text" });
  if (!actual?.etag) return null;
  const compra = JSON.parse(actual.data) as Compra;
  if (compra.estado !== de) return null;
  const nueva: Compra = { ...compra, ...cambios, actualizada: ahora() };
  const ok = await setCondicional(`compra/${llave}`, JSON.stringify(nueva), {
    onlyIfMatch: actual.etag,
  });
  if (!ok) return null;
  if (!viva(nueva)) {
    await almacen().delete(`activa/${llave}`);
    // Una "omitida" se puede reclamar: si justo ahora otro la tomó, que no se
    // quede fuera del índice por este borrado.
    const otra = await leerCompra(llave);
    if (otra && viva(otra)) await almacen().set(`activa/${llave}`, "1");
  }
  return nueva;
}

/**
 * Entrega a la cola de la PC el aviso guardado en una compra cerrada y, solo
 * entonces, la saca del índice. Repetible: crearTrabajo no duplica.
 */
export async function entregarAviso(llave: string): Promise<void> {
  const c = await leerCompra(llave);
  if (!c?.aviso || c.avisado || !TERMINALES.includes(c.estado)) return;
  await crearTrabajo({ tipo: "abrir", pedido: c.pedido, ...c.aviso });
  // Con ETag aunque esté cerrada: una "omitida" puede reclamarse otra vez
  // mientras tanto, y esta escritura no debe pisar esa compra nueva.
  await moverCompra(llave, c.estado, { estado: c.estado, avisado: true });
}

/** Compras sin terminar (la función se quedó sin tiempo o se cayó). */
export async function comprasEnCurso(): Promise<{ llave: string; compra: Compra }[]> {
  const { blobs } = await almacen().list({ prefix: "activa/" });
  const llaves = blobs.map((b) => b.key.slice("activa/".length));
  const compras = await leerVarias<Compra>(llaves.map((l) => `compra/${l}`));
  const out: { llave: string; compra: Compra }[] = [];
  for (let n = 0; n < llaves.length; n++) {
    const c = compras[n];
    if (c && viva(c)) {
      out.push({ llave: llaves[n], compra: c });
      continue;
    }
    // Índice que ya no sirve. Se vuelve a leer antes de borrarlo por si justo
    // ahora se reclamó de nuevo.
    const otra = await leerCompra(llaves[n]);
    if (!otra || !viva(otra)) await almacen().delete(`activa/${llaves[n]}`);
  }
  return out;
}

// ---------- trabajos para la PC ----------

export type TipoTrabajo = "pdf" | "abrir" | "aviso";

export interface Trabajo {
  id: string;
  tipo: TipoTrabajo;
  pedido: string;
  titulo: string;
  mensaje?: string;
  /** Para "pdf": llave del archivo en el almacén. */
  archivo?: string;
  formato?: "PDF" | "ZPL";
  /** La página del pedido en el admin, donde está el botón de imprimir. */
  adminUrl?: string;
  estado: "pendiente" | "hecho" | "fallido";
  error?: string;
  creado: string;
  actualizado: string;
}

/** Los ids que crea este sistema: "etiqueta-123", "reimprimir-etiqueta-123"… */
export const ID_TRABAJO = /^[a-z]+(-[a-z]+)*-\d+$/;

/** Idempotente por id: crear dos veces el mismo trabajo no lo duplica. */
export async function crearTrabajo(
  t: Omit<Trabajo, "estado" | "creado" | "actualizado">,
): Promise<boolean> {
  const trabajo: Trabajo = { ...t, estado: "pendiente", creado: ahora(), actualizado: ahora() };
  const nuevo = await setCondicional(`trabajo/${t.id}`, JSON.stringify(trabajo), {
    onlyIfNew: true,
  });
  if (nuevo) {
    await almacen().set(`pendiente/${t.id}`, "1");
    return true;
  }
  // Ya existía: si sigue pendiente, que no se quede fuera del índice por una
  // escritura cuya respuesta se perdió.
  const previo = await leerTrabajo(t.id);
  if (previo?.estado === "pendiente") await almacen().set(`pendiente/${t.id}`, "1");
  return false;
}

export async function existeTrabajo(id: string): Promise<boolean> {
  return (await leerTrabajo(id)) !== null;
}

export async function leerTrabajo(id: string): Promise<Trabajo | null> {
  if (!ID_TRABAJO.test(id)) return null;
  const t = await almacen().get(`trabajo/${id}`, { type: "text" });
  return t ? (JSON.parse(t) as Trabajo) : null;
}

export async function trabajosPendientes(): Promise<Trabajo[]> {
  const { blobs } = await almacen().list({ prefix: "pendiente/" });
  const ids = blobs.map((b) => b.key.slice("pendiente/".length));
  const trabajos = await leerVarias<Trabajo>(ids.map((id) => `trabajo/${id}`));
  const out: Trabajo[] = [];
  for (let n = 0; n < ids.length; n++) {
    const t = trabajos[n];
    if (t?.estado === "pendiente") out.push(t);
    else await almacen().delete(`pendiente/${ids[n]}`); // índice huérfano
  }
  return out.sort((a, b) => a.creado.localeCompare(b.creado));
}

export async function cerrarTrabajo(
  id: string,
  estado: "hecho" | "fallido",
  error?: string,
): Promise<Trabajo | null> {
  const t = await leerTrabajo(id);
  if (!t || t.estado !== "pendiente") return t;
  t.estado = estado;
  t.error = error?.slice(0, 500);
  t.actualizado = ahora();
  await almacen().set(`trabajo/${id}`, JSON.stringify(t));
  await almacen().delete(`pendiente/${id}`);
  // El PDF lleva nombre y dirección de la clienta: con el trabajo cerrado ya
  // no tiene por qué guardarse. Si falló, se reimprime desde el pedido.
  if (t.archivo) await almacen().delete(t.archivo);
  return t;
}

// ---------- archivos ----------

export async function guardarArchivo(llave: string, datos: ArrayBuffer): Promise<void> {
  await almacen().set(llave, datos);
}

export async function leerArchivo(llave: string): Promise<ArrayBuffer | null> {
  return (await almacen().get(llave, { type: "arrayBuffer" })) ?? null;
}

// ---------- señal de vida de la PC ----------

export async function registrarLatido(info: Record<string, string>): Promise<void> {
  await almacen().set("latido", JSON.stringify({ ...info, visto: ahora() }));
}

// ---------- pedidos apartados ----------
//
// Los motivos por los que se apartó un pedido (pago, riesgo, encargo). Si el
// dueño lo LIBERA, Flow vuelve a avisar y estos ya no cuentan: liberarlo es
// su visto bueno. Uno nuevo que aparezca después sí lo vuelve a apartar.

export async function leerRevisado(llave: string): Promise<string[]> {
  const t = await almacen().get(`revisado/${llave}`, { type: "text" });
  return t ? ((JSON.parse(t) as { motivos: string[] }).motivos ?? []) : [];
}

export async function anotarRevisado(llave: string, motivos: string[]): Promise<void> {
  const antes = await leerRevisado(llave);
  const todos = [...new Set([...antes, ...motivos])];
  if (todos.length === antes.length) return;
  await almacen().set(`revisado/${llave}`, JSON.stringify({ motivos: todos, cuando: ahora() }));
}

// ---------- errores que no se arreglan solos ----------

/**
 * Flow reintenta cada error; casi todos se arreglan solos en el siguiente
 * intento y avisar de ellos sería ruido. Devuelve true cuando ese pedido lleva
 * más de 10 minutos fallando: entonces sí hay que avisar.
 */
export async function falloPersistente(llave: string): Promise<boolean> {
  await almacen().set(`error/${llave}`, ahora(), { onlyIfNew: true });
  const desde = await almacen().get(`error/${llave}`, { type: "text" });
  return !!desde && Date.now() - Date.parse(desde) > 10 * 60_000;
}
