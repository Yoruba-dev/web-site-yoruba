// La cola entre la web y el programa de la PC de la impresora.
//
// No hay base de datos en este proyecto, así que la cola vive en Netlify
// Blobs. Dos clases de llave:
//
//   REGISTROS (se quedan para siempre, son el cerrojo contra duplicados)
//     compra/<fulfillmentOrder>  una por pedido que este código compra. Se crea
//                                con onlyIfNew: si Flow reintenta o dispara dos
//                                veces, la segunda no encuentra hueco y no se
//                                paga otra etiqueta.
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
  | "lanzando" // a punto de pedir la compra: si algo se cae aquí, NO se
  //                 reintenta sola (podría pagarse dos veces); se avisa
  | "comprando" // Shopify aceptó la compra y la está procesando
  | "comprada" // etiqueta pagada y su PDF en la cola
  | "fallida" // no se compró, o no se sabe: aviso en la PC
  | "omitida"; // no tocaba comprarla (por encargo, $1.000+, ya preparada…)

const TERMINALES: EstadoCompra[] = ["comprada", "fallida", "omitida"];

export interface Compra {
  fulfillmentOrderId: string;
  pedido: string;
  orderId: string;
  estado: EstadoCompra;
  resultadoId?: string;
  etiquetaId?: string;
  motivo?: string;
  intentos?: number;
  creada: string;
  actualizada: string;
}

/** Devuelve false si ese pedido ya se estaba (o se había) comprado. */
export async function reclamarCompra(
  datos: Pick<Compra, "fulfillmentOrderId" | "pedido" | "orderId">,
  llave: string,
): Promise<boolean> {
  const compra: Compra = { ...datos, estado: "reclamada", creada: ahora(), actualizada: ahora() };
  const nueva = await setCondicional(`compra/${llave}`, JSON.stringify(compra), { onlyIfNew: true });
  if (nueva) await almacen().set(`activa/${llave}`, "1");
  return nueva;
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
  if (TERMINALES.includes(nueva.estado)) await almacen().delete(`activa/${llave}`);
  return nueva;
}

/**
 * Borra el cerrojo de una compra que NUNCA llegó a pedirse a Shopify (pedido
 * retenido o programado). Así, cuando Flow vuelva a avisar al liberarse, se
 * puede reclamar de nuevo. Solo desde "reclamada": nunca después de lanzarla.
 */
export async function soltarCompra(llave: string): Promise<void> {
  const c = await leerCompra(llave);
  if (c?.estado !== "reclamada") return;
  await almacen().delete(`compra/${llave}`);
  await almacen().delete(`activa/${llave}`);
}

/** Compras sin terminar (la función se quedó sin tiempo o se cayó). */
export async function comprasEnCurso(): Promise<{ llave: string; compra: Compra }[]> {
  const { blobs } = await almacen().list({ prefix: "activa/" });
  const llaves = blobs.map((b) => b.key.slice("activa/".length));
  const compras = await leerVarias<Compra>(llaves.map((l) => `compra/${l}`));
  const out: { llave: string; compra: Compra }[] = [];
  for (let n = 0; n < llaves.length; n++) {
    const c = compras[n];
    if (c && !TERMINALES.includes(c.estado)) out.push({ llave: llaves[n], compra: c });
    else await almacen().delete(`activa/${llaves[n]}`); // índice huérfano
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
  if (nuevo) await almacen().set(`pendiente/${t.id}`, "1");
  return nuevo;
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
