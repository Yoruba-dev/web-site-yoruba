"use client";

import "@/app/creador-de-relojes/editor.css";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import WatchStage from "./WatchStage";
import WatchEntry from "./WatchEntry";
import StepCaja from "./steps/StepCaja";
import StepEsfera from "./steps/StepEsfera";
import StepCorrea, { type StrapMemory } from "./steps/StepCorrea";
import StepTapa from "./steps/StepTapa";
import StepListo from "./steps/StepListo";
import {
  BUILD_STEPS,
  DRAFT_KEY,
  PART_STEP,
  STEPS,
  SUB_LABELS,
  confirmedMask,
  creatorReducer,
  fixSub,
  isStepId,
  nextStop,
  parseDraft,
  pasosSinVer,
  prevStop,
  stepIndex,
  stepOfField,
  stopKey,
  stopsUpTo,
  subsOf,
  viewOf,
  type CreatorAction,
  type Draft,
  type StepId,
  type SubId,
} from "./creator-state";
import { buildOrderInfo, type OrderInfo, type WatchProductVM } from "./order";
import {
  ALL_GHOST,
  ALL_SOLID,
  NO_INSETS,
  WATCH_PARTS,
  maskKey,
  type PartMask,
  type Stage3DStatus,
  type View3D,
  type ViewInsets,
  type WatchPart,
  type WatchStage3DHandle,
} from "./stage3d-contract";
import { AnnouncerProvider, AnnouncerToast, useAnnouncer } from "./shell/announce";
import BottomSheet, { type Snap } from "./shell/BottomSheet";
import FocusHeader, { GUIA_HREF } from "./shell/FocusHeader";
import HelpPanel from "./shell/HelpPanel";
import { OverlayHostContext } from "./shell/overlay";
import SharePopover from "./shell/SharePopover";
import { HintChip, PartTip, StageChips, type PartTipHandle } from "./shell/StageOverlays";
import Stepper from "./shell/Stepper";
import SubTabs from "./shell/SubTabs";
import ViewDock from "./shell/ViewDock";
import { store, useCoarse, useKeyboardViewport, useMedia, usePanelLayout, useShareOrigin } from "./shell/hooks";
import { Icon, claspIcon } from "./shell/icons";
import { copyText, downloadBlob } from "./shell/share";
import { useScrollShadow } from "./shell/useScrollShadow";
import { STAGE3D_V2, preload3D, use3DSupport } from "./shell/stage3d";
import { useReducedMotion } from "./front/layers";
import { useCart } from "@/lib/cart-context";
import { frontSvgDataUrl } from "@/lib/watch-svg";
import { outlineIfReady } from "./front/curvas";
import { SITE } from "@/lib/site";
import {
  canonicalJson,
  designCode,
  getStrap,
  isPresetId,
  lineProperties,
  normalize,
  resolvePreset,
  decodeWatchDesign,
  summary,
  validate,
  type Descontinuado,
  type PresetId,
  type StrapId,
  type StrapType,
  type WatchConfig,
} from "@/lib/watch";

// ---------------------------------------------------------------------------
// CREADOR DE RELOJES — el editor (spec V2: design-assets/creador-relojes/
// SPEC-EDITOR-V2.md).
//
// • Un armazón FIJO a pantalla completa (.pyj-reloj-app): su cabecera propia,
//   el escenario y el panel de cristal (escritorio) o la hoja inferior
//   (móvil). La página NUNCA se desplaza; solo, si hace falta, la zona de
//   opciones por dentro.
// • Un useReducer sobre WatchConfig (creator-state.ts → lib/watch.ts): cada
//   gesto es una acción pura.
// • El reloj 3D es la vista principal y se va ARMANDO: las piezas de los pasos
//   aún no alcanzados van "en cristal" (confirmedMask(max)). Saltar adelante
//   las vuelve reales; "Ver completo" las enseña todas sin tocar `max`.
// • Autoguardado (borrador v2: diseño, paso, sub-pestaña y `max`) en
//   localStorage y en ?d= (replaceState, 400 ms tras el último cambio).
// • Historial: entrada → editor AÑADE una entrada (pushState); "atrás" vuelve a
//   "Empieza con tu Orisha" con "Continuar mi diseño".
// ---------------------------------------------------------------------------

export interface CreatorInitial {
  config: WatchConfig;
  /** De dónde salió: 'd' (enlace), 'preset' (?preset=) o null (entrada). */
  source: "d" | "preset" | null;
  descontinuado: Descontinuado[];
  /** ?paso= de un enlace compartido (por defecto "resumen"). */
  paso?: StepId;
}

const HINT_KEY = "pyj-reloj-pista-cristal";
/** La sub-pestaña de la pieza que se toca en el reloj. */
const PART_SUB: Readonly<Partial<Record<WatchPart, SubId>>> = {
  esfera: "color",
  agujas: "detalles",
  correa: "correa",
  cierre: "cierre",
  tapa: "signo",
};
const PART_NAMES: Readonly<Record<WatchPart, string>> = {
  caja: "caja",
  esfera: "esfera",
  agujas: "agujas",
  correa: "correa",
  cierre: "cierre",
  tapa: "tapa",
};

/** [Acercar] del dock: cuánto se acorta la distancia de la cámara. */
const ACERCAR = 0.52;

/** Cuántos cambios se pueden deshacer. */
const DESHACER_MAX = 20;
/** Lo que se teclea seguido (cada letra es una acción) cuenta como UN cambio. */
const TECLEO_MS = 1500;
interface Cambio {
  /** El reloj ANTES del cambio, y dónde se hizo. */
  config: WatchConfig;
  step: StepId;
  sub: SubId | null;
  clave: string;
  at: number;
}
const claveDe = (a: CreatorAction): string => (a.type === "tapaLinea" ? `tapaLinea${a.linea}` : a.type);
/** ¿Es una letra más de lo mismo? Vaciar de golpe ("Sin texto", "Quitar fecha")
 *  NO: se fundía con lo tecleado y Deshacer no devolvía el nombre borrado. */
const esTecleo = (a: CreatorAction): boolean =>
  (a.type === "texto" && a.texto !== "") ||
  (a.type === "tapaLinea" && a.texto !== "") ||
  (a.type === "tapaFecha" && a.fecha !== "");

/** ¿El foco está en un campo donde se escribe? (⌘Z es del campo). */
const enCampo = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

const todayIso = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const sameInsets = (a: ViewInsets, b: ViewInsets) =>
  a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;

export default function WatchCreator(props: { initial: CreatorInitial; product?: WatchProductVM | null }) {
  return (
    <AnnouncerProvider>
      <Creator {...props} />
    </AnnouncerProvider>
  );
}

function Creator({ initial, product = null }: { initial: CreatorInitial; product?: WatchProductVM | null }) {
  const router = useRouter();
  const uid = useId();
  const { announce, toast } = useAnnouncer();
  const [config, rawDispatch] = useReducer(creatorReducer, initial.config);
  const [screen, setScreen] = useState<"entrada" | "editor">(initial.source ? "editor" : "entrada");
  const desdeEnlace = initial.source === "d";
  const [step, setStep] = useState<StepId>(desdeEnlace ? (initial.paso ?? "resumen") : "caja");
  const [subMem, setSubMem] = useState<Partial<Record<StepId, SubId>>>({});
  const [max, setMax] = useState<number>(desdeEnlace ? STEPS.length - 1 : initial.source === "preset" ? 0 : -1);
  const [compartido, setCompartido] = useState(desdeEnlace);
  // Con ?d=, hasta saber si es una recarga (el borrador coincide) o un enlace
  // ajeno, el panel no se pinta: así no asoma "Listo" antes del paso guardado.
  const [listo, setListo] = useState(!desdeEnlace);
  const [verCompleto, setVerCompleto] = useState(false);
  const [view, setView] = useState<{ v: View3D; seq: number }>({ v: "tres4", seq: 0 });
  const [cerca, setCerca] = useState(false);
  // Las paradas ya vistas (los aros "sin ver"). Un enlace compartido: todas.
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set(desdeEnlace ? stopsUpTo(STEPS.length - 1) : []));
  const [pasado, setPasado] = useState<readonly Cambio[]>([]);
  const [ayuda, setAyuda] = useState<HTMLElement | null>(null);
  const [noche, setNoche] = useState(false);
  const [foto, setFoto] = useState(false);
  const [fotoVista, setFotoVista] = useState<"frente" | "tapa">("frente");
  const [want3d, setWant3d] = useState(false);
  const [status, setStatus] = useState<Stage3DStatus>("cargando");
  const [hoverPreset, setHoverPreset] = useState<PresetId | null>(null);
  const [snap, setSnap] = useState<Snap>("half");
  const [shareAnchor, setShareAnchor] = useState<HTMLElement | null>(null);
  const [pedido, setPedido] = useState(false);
  const [policy, setPolicy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saveSeq, setSaveSeq] = useState(0);
  const [insets, setInsets] = useState<ViewInsets>(NO_INSETS);
  const [descontinuado, setDescontinuado] = useState<Descontinuado[]>(initial.descontinuado);
  const [strapMem, setStrapMem] = useState<StrapMemory>({});
  const [hint, setHint] = useState(false);
  const [snapshot, setSnapshot] = useState<{ code: string; url: string; file: File } | null>(null);
  const [detalle, setDetalle] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stage3d = useRef<WatchStage3DHandle>(null);
  const partTip = useRef<PartTipHandle>(null);
  const sheetH = useRef(0);
  const moved = useRef(false);
  /** La entrada actual del historial la añadió el creador (entrada → editor). */
  const pushed = useRef(false);
  const [overlayHost, setOverlayHost] = useState<HTMLElement | null>(null);
  const optsShadow = useScrollShadow();
  /** Llevar el foco al título en cuanto la pantalla nueva se pinte (elegir
   *  Orisha, "Continuar mi diseño", volver a la entrada, atrás/adelante): el
   *  botón o la tarjeta que tenía el foco desaparece y el foco caía a <body>. */
  const focusTitle = useRef(false);

  const { addLine, setCartOpen, count } = useCart();
  const panel = usePanelLayout();
  // Teléfono apaisado: panel a la derecha, pero el dock va en columna (§3.4).
  const apaisado = useMedia("(orientation: landscape) and (max-height: 500px)");
  const dockVertical = !panel || apaisado;
  const coarse = useCoarse();
  const reducido = useReducedMotion();
  const teclado = useKeyboardViewport(rootRef);
  const origin = useShareOrigin();
  const support3d = use3DSupport();
  const support = STAGE3D_V2 ? support3d : support3d === null ? null : "no";

  // El reloj tal como se pide y se comparte: normalizado (y referencia estable).
  const final = useMemo(() => normalize(config), [config]);
  const order: OrderInfo = useMemo(() => buildOrderInfo(final, product, origin), [final, product, origin]);
  // Lo que se valida para PEDIR es lo que el cliente ve. normalize() quita en
  // silencio una fecha de tapa imposible (1899, 2205…): validando solo `final`
  // no saltaba el bloqueo "fecha-tapa" y el pedido salía sin la fecha que el
  // cliente sí ve escrita. Se suma la validación del config crudo para ese
  // campo (solo cuando normalize la quitó, así no se valida dos veces).
  const validation = useMemo(() => {
    if (!config.tapa.fecha || config.tapa.fecha.trim() === final.tapa.fecha) return order.validation;
    const extra = validate(config).issues.filter((x) => x.campo === "tapa.fecha");
    return extra.length ? { ok: false, issues: [...extra, ...order.validation.issues] } : order.validation;
  }, [config, final, order.validation]);
  /** El pedido tal como lo ve "Listo" (con esa validación). */
  const orderView: OrderInfo = useMemo(
    () => (validation === order.validation ? order : { ...order, validation }),
    [order, validation],
  );
  const sub = fixSub(step, subMem[step]);

  // La entrada del cuerpo: al cambiar de paso entra de lado (x 12 → 0); al
  // cambiar de sub-pestaña, de abajo (y 6 → 0). Spec §6.2. El tipo se fija UNA
  // vez por cuerpo (su `key`): derivarlo en cada pintado lo volvía "sub" en el
  // re-pintado que dispara el propio cambio de paso, y la entrada de lado no
  // se veía nunca. (Estado derivado del pintado anterior: patrón de React.)
  const bodyKey = screen === "entrada" ? "entrada" : `${step}-${sub ?? ""}`;
  const bodyParte = screen === "entrada" ? "entrada" : step;
  const [anim, setAnim] = useState<{ key: string; parte: string; kind: "step" | "sub" }>({
    key: bodyKey,
    parte: bodyParte,
    kind: "step",
  });
  if (anim.key !== bodyKey) setAnim({ key: bodyKey, parte: bodyParte, kind: anim.parte === bodyParte ? "sub" : "step" });
  const animKind = anim.key === bodyKey ? anim.kind : anim.parte === bodyParte ? "sub" : "step";

  // Lo último de cada estado, para lo que corre fuera del pintado (dispatch, el
  // oyente de popstate, goTo).
  const live = useRef({ screen, config, final, step, sub, max, seen });
  live.current = { screen, config, final, step, sub, max, seen };

  /** Toda edición pasa por aquí (y queda en la pila de "Deshacer"). */
  const dispatch = useCallback((a: CreatorAction) => {
    setPedido(false);
    setCompartido(false);
    const now = live.current;
    if (JSON.stringify(creatorReducer(now.config, a)) !== JSON.stringify(now.config)) {
      const at = Date.now();
      const clave = claveDe(a);
      setPasado((p) => {
        const ult = p[p.length - 1];
        if (ult && esTecleo(a) && ult.clave === clave && at - ult.at < TECLEO_MS) return [...p.slice(0, -1), { ...ult, at }];
        return [...p.slice(1 - DESHACER_MAX), { config: now.config, step: now.step, sub: now.sub, clave, at }];
      });
    }
    rawDispatch(a);
  }, []);

  // — Lo que se enseña en el escenario —————————————————————————————————————
  const ifa = useMemo(() => resolvePreset("ifa"), []);
  const hoverConfig = useMemo(() => (hoverPreset ? resolvePreset(hoverPreset) : null), [hoverPreset]);
  const stageConfig = screen === "entrada" ? (hoverConfig ?? ifa) : final;
  const mask: PartMask = useMemo(
    () => (screen === "entrada" ? (hoverPreset ? ALL_SOLID : ALL_GHOST) : confirmedMask(max, verCompleto)),
    [screen, hoverPreset, max, verCompleto],
  );
  const hayCristal = screen === "editor" && maskKey(confirmedMask(max, false)) !== maskKey(ALL_SOLID);
  const mode = screen === "entrada" ? "entrada" : step === "resumen" ? "final" : "editor";
  const mount3d = support === "completo" || (want3d && support !== "no" && support !== null);
  const tres = mount3d && !foto && status !== "sin-3d";

  const requestView = useCallback((v: View3D) => {
    setView((s) => ({ v, seq: s.seq + 1 }));
    setCerca(false);
  }, []);

  // — Llegada con ?d=: ¿recarga del mismo diseño (borrador) o enlace ajeno? ——
  // Manda el ?d= VIVO de la barra, no `initial`: al volver con "atrás" desde
  // otra página ("Cómo funciona", la ×), Next monta el editor con las props EN
  // CACHÉ de la primera visita (?preset=… o la entrada) mientras la URL ya
  // trae el diseño autoguardado. Sin esto se veía el diseño viejo y el
  // autoguardado lo escribía encima del borrador (el diseño se perdía).
  useLayoutEffect(() => {
    let sp: URLSearchParams | null = null;
    try {
      sp = new URL(window.location.href).searchParams;
    } catch {
      sp = null;
    }
    const dVivo = sp?.get("d");
    const r = dVivo ? decodeWatchDesign(dVivo) : null;
    // ¿La URL trae otro diseño que el de las props?
    const otro = !!r && (!desdeEnlace || canonicalJson(r.config) !== canonicalJson(normalize(initial.config)));
    if (!desdeEnlace && !otro) return;
    const cfg = otro && r ? r.config : normalize(initial.config);
    const pasoVivo = sp?.get("paso");
    const paso: StepId = otro ? (isStepId(pasoVivo) ? pasoVivo : "resumen") : (initial.paso ?? "resumen");
    if (otro && r) {
      rawDispatch({ type: "cargar", config: r.config });
      setDescontinuado(r.descontinuado);
      setPolicy(false);
      setPedido(false);
      setHoverPreset(null);
      setScreen("editor");
    }
    const d = parseDraft(store.get(DRAFT_KEY));
    if (d && canonicalJson(d.config) === canonicalJson(cfg)) {
      // El mismo diseño que el borrador: es una recarga (o una vuelta). Se
      // sigue en el paso, la sub-pestaña y el avance guardados.
      setStep(d.step);
      setSubMem(d.sub ? { [d.step]: d.sub } : {});
      setMax(d.max);
      setSeen(new Set(d.seen));
      setCompartido(false);
      setView({ v: viewOf(d.step, d.sub), seq: 1 });
    } else {
      // Un enlace ajeno: se abre en "Listo" (o en su ?paso=), todo real.
      if (otro) {
        setStep(paso);
        setSubMem({});
        setMax(STEPS.length - 1);
        setSeen(new Set(stopsUpTo(STEPS.length - 1)));
        setCompartido(true);
      }
      setView({ v: viewOf(paso, null), seq: 1 });
    }
    setListo(true);
    // Solo al montar.
  }, []);

  // — El enlace viejo "#como-funciona" lleva a su página propia.
  useEffect(() => {
    if (window.location.hash === "#como-funciona") router.replace(GUIA_HREF);
  }, [router]);

  // — Borrador guardado: se ofrece en la entrada ("Continuar mi diseño").
  useEffect(() => {
    setDraft(parseDraft(store.get(DRAFT_KEY)));
    setHint(store.get(HINT_KEY) !== "1");
  }, []);

  // — Atrás / adelante del navegador dentro del creador.
  useEffect(() => {
    const onPop = () => {
      const sp = new URL(window.location.href).searchParams;
      const d = sp.get("d");
      const preset = sp.get("preset");
      const now = live.current;
      if (!d && !preset) {
        if (now.screen !== "editor") return;
        pushed.current = false;
        setDraft({ v: 2, config: now.final, step: now.step, sub: now.sub, max: now.max, seen: [...now.seen], at: Date.now() });
        setHoverPreset(null);
        focusTitle.current = true;
        setScreen("entrada");
        setView((s) => ({ v: "tres4", seq: s.seq + 1 }));
        return;
      }
      if (now.screen !== "entrada") return;
      const r = d ? decodeWatchDesign(d) : null;
      if (r) {
        rawDispatch({ type: "cargar", config: r.config });
        setDescontinuado(r.descontinuado);
      } else if (isPresetId(preset)) {
        rawDispatch({ type: "preset", id: preset });
        setDescontinuado([]);
      } else return;
      pushed.current = true;
      focusTitle.current = true;
      setPasado([]);
      setScreen("editor");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // — Autoguardado: URL ?d= + borrador v2, 400 ms después del último cambio.
  const lastSaidSave = useRef(0);
  useEffect(() => {
    // Un diseño compartido que aún no se tocó no pisa el borrador propio.
    if (screen !== "editor" || !listo || compartido) return;
    const t = window.setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("preset");
        url.searchParams.delete("paso");
        url.searchParams.set("d", order.d);
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
      } catch {
        /* URL demasiado larga o historial bloqueado: el borrador local basta */
      }
      const d: Draft = { v: 2, config: final, step, sub, max, seen: [...seen], at: Date.now() };
      store.set(DRAFT_KEY, JSON.stringify(d));
      setSaveSeq((n) => n + 1);
      // "Guardado" se anuncia, pero como mucho cada 20 s (no en cada letra).
      if (Date.now() - lastSaidSave.current > 20000) {
        lastSaidSave.current = Date.now();
        announce("Diseño guardado");
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [screen, listo, compartido, final, step, sub, max, seen, order.d, announce]);

  // — La parada en la que se está queda vista (su aro se va).
  useEffect(() => {
    if (screen !== "editor" || !listo) return;
    const k = stopKey(step, sub);
    setSeen((s) => (s.has(k) ? s : new Set(s).add(k)));
  }, [screen, listo, step, sub]);

  // — Cambio de paso: anunciarlo, llevar el foco al título, y el golpe de
  //   cámara de ese paso (en la foto, la tapa se ve en "Tapa").
  const prevStep = useRef<StepId | null>(null);
  useEffect(() => {
    if (screen !== "editor" || !listo) return;
    const changed = prevStep.current !== step;
    prevStep.current = step;
    if (!changed) return;
    const i = stepIndex(step);
    announce(i < BUILD_STEPS ? `Paso ${i + 1} de ${BUILD_STEPS}: ${STEPS[i].label}` : "Listo: tu reloj está completo");
    setFotoVista(step === "tapa" ? "tapa" : "frente");
    if (!moved.current) return;
    requestView(viewOf(step, live.current.sub));
    headingRef.current?.focus({ preventScroll: true });
  }, [step, screen, listo, announce, requestView]);

  // El foco pedido por focusTitle, ya con la pantalla nueva en el DOM.
  useLayoutEffect(() => {
    if (!focusTitle.current) return;
    focusTitle.current = false;
    headingRef.current?.focus({ preventScroll: true });
  }, [screen, listo]);

  // — La pista de una vez: sale cuando el reloj ya se puede tocar (con 3D, al
  //   terminar de cargar; sin saber aún si hay 3D, espera) y se va a los 8 s, al
  //   primer gesto o al colocar otra pieza. Solo se da por vista si SE VIO.
  const verPista = hint && screen === "editor" && hayCristal && (tres ? status === "listo" : support !== null);
  const quitarPista = useCallback(() => {
    setHint(false);
    store.set(HINT_KEY, "1");
  }, []);
  useEffect(() => {
    if (!verPista) return;
    const t = window.setTimeout(quitarPista, 8000);
    return () => window.clearTimeout(t);
  }, [verPista, quitarPista]);

  // — Piezas que pasan a reales: se anuncian ("Pieza colocada: correa").
  const prevMask = useRef<PartMask>(mask);
  const prevScreen = useRef(screen);
  useEffect(() => {
    const before = prevMask.current;
    // Elegir el Orisha (entrada → editor) también coloca la caja, pero eso no es
    // un gesto sobre el reloj: en táctil y con teclado (sin ratón encima que
    // deje todo real) apagaba la pista antes de que llegara a salir.
    const entrando = prevScreen.current !== screen;
    prevMask.current = mask;
    prevScreen.current = screen;
    if (screen !== "editor") return;
    const nuevas = WATCH_PARTS.filter((p) => mask[p] && !before[p]);
    if (!nuevas.length) return;
    announce(`${nuevas.length === 1 ? "Pieza colocada" : "Piezas colocadas"}: ${nuevas.map((p) => PART_NAMES[p]).join(", ")}`);
    if (verPista && !entrando) quitarPista();
  }, [mask, screen, announce, verPista, quitarPista]);

  // — Teclado del móvil abierto: el escenario pequeño enseña lo que se escribe.
  useEffect(() => {
    if (!teclado || screen !== "editor") return;
    if (step === "esfera") requestView("esfera");
    else if (step === "tapa") requestView("tapa");
  }, [teclado, screen, step, requestView]);

  // — Ir a un paso (cualquiera, en cualquier orden): visitar = aceptar lo de
  //   en medio (max sube y esas piezas se vuelven reales, escalonadas).
  const goTo = useCallback(
    (s: StepId, sb?: SubId | null, abrir = true) => {
      const now = live.current;
      moved.current = true;
      setStep(s);
      setMax((m) => Math.max(m, stepIndex(s)));
      if (sb) setSubMem((x) => ({ ...x, [s]: sb }));
      setShareAnchor(null);
      setAyuda(null);
      // La hoja en su altura mínima no enseña opciones: al ir a otra parada se
      // abre a media (si no, "Siguiente" las daba por vistas sin enseñarlas).
      if (abrir) setSnap((x) => (x === "peek" ? "half" : x));
      // Otra sub-pestaña del MISMO paso: su encuadre (al cambiar de paso lo
      // pide el efecto de arriba).
      if (s === now.step && sb && sb !== now.sub) requestView(viewOf(s, sb));
    },
    [requestView],
  );

  const setSub = useCallback((sb: SubId) => goTo(live.current.step, sb), [goTo]);

  // — Deshacer: el reloj de antes, en el sitio donde se cambió.
  const deshacer = useCallback(() => {
    const ult = pasado[pasado.length - 1];
    if (!ult) return;
    // El último: el botón se desmonta y el foco caería a <body>.
    if (pasado.length === 1 && document.activeElement?.closest(".rl-undobtn")) headingRef.current?.focus({ preventScroll: true });
    setPasado((p) => p.slice(0, -1));
    setPedido(false);
    rawDispatch({ type: "restaurar", config: ult.config });
    goTo(ult.step, ult.sub, false);
    announce("Cambio deshecho");
  }, [pasado, goTo, announce]);

  // — ⌘Z / Ctrl+Z = Deshacer, en todo el editor (en la ventana: con el foco en
  //   <body> el armazón no recibe la tecla). No si se escribe (es del campo), si
  //   hay un diálogo abierto (compartir, ayuda) o fuera del armazón (carrito).
  //   Las teclas de las vistas (1–5) las lleva el visor, con su foco.
  useEffect(() => {
    if (screen !== "editor" || !listo || ayuda || shareAnchor || !pasado.length) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.key.toLowerCase() !== "z" || !(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
      const t = e.target;
      if (enCampo(t)) return;
      if (t instanceof Element && t !== document.body && t !== document.documentElement && !rootRef.current?.contains(t)) return;
      e.preventDefault();
      deshacer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, listo, ayuda, shareAnchor, pasado.length, deshacer]);

  /** "Corregir": al paso y sub-pestaña del campo, con el foco en él. */
  const fix = useCallback(
    (s: StepId, sb?: SubId | null, field?: string) => {
      goTo(s, sb);
      if (!field) return;
      window.setTimeout(() => {
        const box = rootRef.current?.querySelector<HTMLElement>(`[data-field="${field}"]`);
        // Un campo de texto primero (el nombre de la combinación); si no, la
        // opción elegida del grupo; si no, su primer botón.
        const target =
          box?.querySelector<HTMLElement>("input:not([type=hidden])") ??
          box?.querySelector<HTMLElement>("[role=radio][tabindex='0']") ??
          box?.querySelector<HTMLElement>("button") ??
          box;
        target?.focus({ preventScroll: false });
      }, 80);
    },
    [goTo],
  );

  // — Entrada → editor ————————————————————————————————————————————————————
  function pushEditorEntry(cfg: WatchConfig) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("preset");
      url.searchParams.delete("paso");
      url.searchParams.set("d", buildOrderInfo(normalize(cfg), product, origin).d);
      window.history.pushState(null, "", `${url.pathname}${url.search}`);
      pushed.current = true;
    } catch {
      /* historial bloqueado: el autoguardado sigue funcionando */
    }
  }

  function pickPreset(id: PresetId) {
    pushEditorEntry(resolvePreset(id));
    rawDispatch({ type: "preset", id });
    setDescontinuado([]);
    setCompartido(false);
    setPolicy(false);
    setPedido(false);
    setHoverPreset(null);
    setStrapMem({});
    setSubMem({});
    setMax(0);
    setSeen(new Set());
    setPasado([]);
    setVerCompleto(false);
    // Sin golpe de cámara (moved = false), pero el foco sí va al título.
    moved.current = false;
    focusTitle.current = true;
    prevStep.current = "caja";
    setStep("caja");
    setFotoVista("frente");
    setScreen("editor");
    requestView("tres4");
    announce(`Paso 1 de ${BUILD_STEPS}: Caja`);
  }

  function continueDraft() {
    if (!draft) return;
    pushEditorEntry(draft.config);
    rawDispatch({ type: "cargar", config: draft.config });
    setDescontinuado([]);
    setCompartido(false);
    setHoverPreset(null);
    setSubMem(draft.sub ? { [draft.step]: draft.sub } : {});
    setMax(draft.max);
    setSeen(new Set(draft.seen ?? stopsUpTo(draft.max)));
    setPasado([]);
    moved.current = false;
    focusTitle.current = true;
    prevStep.current = draft.step;
    setStep(draft.step);
    setScreen("editor");
    requestView(viewOf(draft.step, draft.sub));
  }

  /** Volver a la entrada sin perder nada: el diseño queda como "Continuar". */
  function backToEntry() {
    setDraft({ v: 2, config: final, step, sub, max, seen: [...seen], at: Date.now() });
    focusTitle.current = true;
    if (pushed.current) {
      window.history.back();
      return;
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("d");
      url.searchParams.delete("preset");
      url.searchParams.delete("paso");
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    } catch {
      /* sin historial: solo cambia la pantalla */
    }
    setScreen("entrada");
    requestView("tres4");
  }

  // — Pedir —————————————————————————————————————————————————————————————————
  // Con la validación de lo que el cliente ve (`validation`, arriba): una
  // fecha imposible bloquea, pinta el punto del paso y sale en "Listo".
  const bloqueos = useMemo(() => validation.issues.filter((i) => i.nivel === "bloqueo"), [validation]);
  const blockedSteps = useMemo(() => new Set(bloqueos.map((i) => stepOfField(i.campo).step)), [bloqueos]);
  const blockedSubs = useMemo(
    () => new Set(bloqueos.map((i) => stepOfField(i.campo)).filter((x) => x.step === step && x.sub).map((x) => x.sub as SubId)),
    [bloqueos, step],
  );
  const listoParaPedir = validation.ok && (!order.canBuy || policy);

  function showBlocker() {
    const el = rootRef.current?.querySelector<HTMLElement>("[data-corregir]") ?? rootRef.current?.querySelector<HTMLElement>(".rl-policy input");
    el?.focus();
  }

  function addToCart() {
    const v = order.variant;
    if (!product || !v || !order.canBuy || !validation.ok || !policy) return;
    const lineUid =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${order.code}`;
    const preview = frontSvgDataUrl(final, { curvas: outlineIfReady() ?? undefined });
    addLine(
      {
        id: `${v.id}-reloj-${lineUid}`,
        merchandiseId: v.id,
        productHandle: product.handle,
        title: `${product.title} — ${order.code}`,
        image: product.image || preview,
        price: Number(v.price.amount),
        currencyCode: v.price.currencyCode,
        properties: lineProperties(final, order.code, order.sheetUrl, { politicaAceptada: todayIso() }),
        customization: { label: "Diseño", text: summary(final), font: "", preview, previewAlt: "Tu reloj" },
      },
      1,
    );
    setCartOpen(true);
  }

  // — Compartir ——————————————————————————————————————————————————————————————
  // Estable: el popover no debe re-ejecutar su efecto de foco en cada pintado.
  const closeShare = useCallback(() => setShareAnchor(null), []);
  const closeHelp = useCallback(() => setAyuda(null), []);
  async function copyLink() {
    const r = await copyText(order.creatorUrl);
    if (r === "ok") toast("Enlace copiado ✓");
    else setShareAnchor(chipsRef.current);
  }

  // La foto de estudio pequeña de "Listo" (tras la vuelta de presentación,
  // en reposo; una por código de diseño).
  const snaps = useRef(new Map<string, { url: string; file: File }>());
  useEffect(() => {
    if (step !== "resumen" || screen !== "editor" || !tres || status !== "listo") return;
    const code = order.code;
    const hit = snaps.current.get(code);
    if (hit) {
      setSnapshot({ code, ...hit });
      return;
    }
    let vivo = true;
    const t = window.setTimeout(
      () => {
        const run = async () => {
          const blob = await stage3d.current?.capture({ views: ["tres4"], size: 480, ssaa: 4 });
          if (!vivo || !blob) return;
          const file = new File([blob], `reloj-${code}.jpg`, { type: "image/jpeg" });
          const item = { url: URL.createObjectURL(blob), file };
          snaps.current.set(code, item);
          setSnapshot({ code, ...item });
        };
        if ("requestIdleCallback" in window) window.requestIdleCallback(() => void run(), { timeout: 2000 });
        else void run();
      },
      reducido ? 600 : 7600,
    );
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, [step, screen, tres, status, order.code, reducido]);
  useEffect(() => {
    const m = snaps.current;
    return () => m.forEach((s) => URL.revokeObjectURL(s.url));
  }, []);

  async function downloadStudio() {
    const blob = await stage3d.current?.capture();
    if (blob) downloadBlob(blob, `reloj-${order.code}.jpg`);
    else toast("No pudimos preparar la foto en este equipo");
  }

  // — Encuadre: lo que tapa la interfaz (chips, dock, hoja), cada fotograma
  //   como mucho. ——————————————————————————————————————————————————————————
  const measureRaf = useRef(0);
  const measure = useCallback(() => {
    cancelAnimationFrame(measureRaf.current);
    measureRaf.current = requestAnimationFrame(() => {
      const st = stageRef.current?.getBoundingClientRect();
      if (!st) return;
      const chips = chipsRef.current?.getBoundingClientRect();
      const dock = dockRef.current?.getBoundingClientRect();
      const top = chips && chips.height ? Math.round(chips.bottom - st.top + 8) : 16;
      let next: ViewInsets;
      if (panel && !dockVertical) {
        const bottom = dock && dock.height ? Math.round(st.bottom - dock.top + 8) : 16;
        next = { top, right: 16, bottom, left: 16 };
      } else if (panel) {
        const right = dock && dock.width ? Math.round(st.right - dock.left + 8) : 16;
        next = { top, right, bottom: 12, left: 12 };
      } else {
        const right = dock && dock.width ? Math.round(st.right - dock.left + 8) : 12;
        next = { top, right, bottom: Math.round(sheetH.current + 8), left: 12 };
      }
      setInsets((cur) => (sameInsets(cur, next) ? cur : next));
    });
  }, [panel, dockVertical]);
  useLayoutEffect(() => {
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    for (const el of [stageRef.current, chipsRef.current, dockRef.current]) if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [measure, screen, tres, panel, hayCristal]);
  // Cada cuerpo nuevo (paso o sub-pestaña) empieza arriba. La zona de opciones
  // es la misma caja para todos y conservaba el desplazamiento del anterior:
  // al "Terminar" con la lista de Meyis bajada, Listo abría a mitad y sin el
  // resumen. ("Corregir" enfoca su campo después, y ese sí desplaza.)
  useLayoutEffect(() => {
    document.getElementById(`${uid}-opts`)?.scrollTo(0, 0);
  }, [bodyKey, uid]);
  const onSheetHeight = useCallback(
    (px: number) => {
      sheetH.current = px;
      measure();
    },
    [measure],
  );

  // — Lo que pide el visor ——————————————————————————————————————————————————
  const onPartPick = useCallback(
    (p: WatchPart) => {
      if (screen !== "editor") return;
      goTo(PART_STEP[p], PART_SUB[p] ?? null);
    },
    [screen, goTo],
  );
  // El nombre de la pieza bajo el ratón ("Correa"), sin repintar el editor.
  const onPartHover = useCallback((p: WatchPart | null, x: number, y: number) => {
    const n = p ? PART_NAMES[p] : null;
    partTip.current?.show(n ? n.charAt(0).toUpperCase() + n.slice(1) : null, x, y);
  }, []);
  const onViewRequest = useCallback((v: View3D) => requestView(v), [requestView]);
  // El primer gesto sobre el reloj: la pista ya no hace falta (si se giró en la
  // entrada, aún falta decir que las piezas se tocan).
  const onInteract = useCallback(() => {
    if (live.current.screen === "editor") quitarPista();
  }, [quitarPista]);
  // Con el visor sin montar (o recargado), [Acercar] no tiene qué acercar: la
  // cámara nace en su sitio.
  const onStatus = useCallback((s: Stage3DStatus) => {
    setStatus(s);
    if (s !== "listo") setCerca(false);
  }, []);

  // ==========================================================================
  // PINTAR
  // ==========================================================================
  const i = stepIndex(step);
  const def = STEPS[i];
  const subs = subsOf(step);
  // "Siguiente" recorre lo que falta por ver; "‹" vuelve a la parada anterior.
  const next = nextStop(step, sub, seen);
  const prev = prevStop(step, sub);
  const nombreParada = (x: { step: StepId; sub: SubId | null }) =>
    x.step === step && x.sub ? SUB_LABELS[x.sub] : STEPS[stepIndex(x.step)].label;
  const sinVer = new Set(subs.filter((x) => !seen.has(stopKey(step, x))));
  const pasosPorVer = pasosSinVer(max, seen);
  const panelId = `${uid}-opts`;
  const stepProps = { config, dispatch, goTo, requestView };
  const enEditor = screen === "editor" && listo;

  /** [Acercar] del dock: acerca, y otra vez para volver. */
  function acercar() {
    stage3d.current?.zoom(cerca ? 1 / ACERCAR : ACERCAR);
    setHint(false);
    setCerca(!cerca);
  }

  const dock = (
    <div ref={dockRef} className={dockVertical ? "rl-vdockwrap" : "rl-dockwrap"}>
      <ViewDock
        vertical={dockVertical}
        tres={tres}
        view={view.v}
        onView={(v) => {
          requestView(v);
          setHint(false);
        }}
        fotoVista={fotoVista}
        onFotoVista={setFotoVista}
        cierre={enEditor && mask.correa && mask.cierre ? claspIcon(getStrap(final.correa)?.tipo, final.cierre) : null}
        noche={noche}
        onNoche={() => setNoche((x) => !x)}
        cerca={cerca}
        onCerca={status === "listo" ? acercar : null}
        pasoCorrea={enEditor && step === "correa" && sub === "correa"}
        onToggleFoto={
          support === "no" || support === null
            ? null
            : () => {
                if (!mount3d) {
                  setWant3d(true);
                  setFoto(false);
                  preload3D();
                } else setFoto((x) => !x);
              }
        }
        hayCristal={hayCristal}
        verCompleto={verCompleto}
        onVerCompleto={() => setVerCompleto((x) => !x)}
      />
    </div>
  );

  // — "Tu diseño · PY-R-…" / "Diseño compartido · … · Editar este diseño"
  //   (Listo, R8.2). En el panel va encima del título; en la hoja del móvil
  //   (sin cabeza de paso) va arriba de las opciones, solo si es compartido.
  const listoEyebrow = (
    <span className="rl-eyebrow">
      {compartido ? "Diseño compartido" : "Tu diseño"} ·{" "}
      <button type="button" className="rl-eyebrow_code" onClick={copyLink} title="Copiar el enlace">
        {order.code}
      </button>
      {compartido && (
        <>
          {" · "}
          <button
            type="button"
            className="rl-eyebrow_edit"
            onClick={() => {
              setCompartido(false);
              goTo("caja");
            }}
          >
            Editar este diseño
          </button>
        </>
      )}
    </span>
  );

  const stepBody = (() => {
    if (!enEditor) return null;
    switch (step) {
      case "caja":
        return <StepCaja {...stepProps} />;
      case "esfera":
        return <StepEsfera {...stepProps} sub={sub ?? "color"} />;
      case "correa":
        return (
          <StepCorrea
            {...stepProps}
            sub={sub ?? "correa"}
            memoria={strapMem}
            recordar={(t: StrapType, id: StrapId) => setStrapMem((m) => (m[t] === id ? m : { ...m, [t]: id }))}
          />
        );
      case "tapa":
        return <StepTapa {...stepProps} sub={sub ?? "signo"} />;
      case "resumen":
        return (
          <>
            {!panel && compartido && <div className="rl-sharedrow">{listoEyebrow}</div>}
            <StepListo
              config={final}
              // "Corregir" pasa SU campo (el foco va a ese, no al primer
              // problema del paso); los lápices "Editar" no pasan ninguno.
              goTo={fix}
              order={orderView}
              descontinuado={descontinuado}
              snapshot={snapshot && snapshot.code === order.code ? snapshot : null}
              onDownload={tres && status === "listo" ? downloadStudio : undefined}
              policy={policy}
              onPolicy={setPolicy}
              detalle={detalle}
              onDetalle={panel ? undefined : () => setDetalle((x) => !x)}
            />
          </>
        );
    }
  })();

  const cta = (big: boolean): ReactNode =>
    order.canBuy ? (
      <button
        type="button"
        className={`rl-btn rl-btn--gold rl-btn--cta${big ? " rl-btn--big" : ""}${listoParaPedir ? "" : " is-disabled"}`}
        aria-disabled={!listoParaPedir || undefined}
        onClick={() => (listoParaPedir ? addToCart() : showBlocker())}
      >
        {`Añadir al carrito · ${order.priceLabel}`}
      </button>
    ) : (
      <a
        className={`rl-btn rl-btn--gold rl-btn--cta${big ? " rl-btn--big" : ""}${listoParaPedir ? "" : " is-disabled"}${pedido ? "" : " has-sheen"}`}
        href={listoParaPedir ? order.whatsappHref : undefined}
        target="_blank"
        rel="noopener noreferrer"
        role={listoParaPedir ? undefined : "link"}
        aria-disabled={!listoParaPedir || undefined}
        tabIndex={0}
        onClick={(e) => {
          if (!listoParaPedir) {
            e.preventDefault();
            showBlocker();
            return;
          }
          setPedido(true);
        }}
        onKeyDown={(e) => {
          if (!listoParaPedir && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            showBlocker();
          }
        }}
      >
        <Icon name="whatsapp" />
        <span className="rl-btn_label">{pedido ? "Abrir WhatsApp de nuevo" : order.ctaLabel}</span>
      </a>
    );

  const footer = !enEditor ? null : step === "resumen" ? (
    <div className="rl-foot rl-foot--listo">
      {panel ? (
        <button
          type="button"
          className="rl-btn rl-btn--ghost rl-btn--square"
          onClick={() => goTo("tapa", prev?.sub)}
          aria-label="Volver a Tapa"
        >
          <Icon name="back" />
        </button>
      ) : (
        <button
          type="button"
          className="rl-btn rl-btn--glass rl-btn--square rl-foot_share"
          onClick={(e) => setShareAnchor(e.currentTarget)}
          aria-haspopup="dialog"
          aria-label="Compartir tu diseño"
          title="Compartir"
        >
          <Icon name="share" />
        </button>
      )}
      {cta(true)}
    </div>
  ) : (
    <div className="rl-foot">
      <button
        type="button"
        className="rl-btn rl-btn--ghost rl-btn--square"
        onClick={() => (prev ? goTo(prev.step, prev.sub) : backToEntry())}
        aria-label={prev ? `Volver a ${nombreParada(prev)}` : "Cambiar de Orisha"}
        title={prev ? nombreParada(prev) : "Cambiar de Orisha"}
      >
        <Icon name="back" />
      </button>
      {next && (
        <button
          type="button"
          className="rl-btn rl-btn--gold rl-foot_next"
          onClick={() => {
            goTo(next.step, next.sub);
            // El cambio de paso ya se anuncia; el de sub-pestaña, aquí.
            if (next.step === step && next.sub) announce(`${def.label}: ${SUB_LABELS[next.sub]}`);
          }}
        >
          <span className="rl-btn_label">
            {next.step === "resumen" ? (
              "Terminar"
            ) : (
              <>
                Siguiente<span className="rl-foot_nextname">: {nombreParada(next)}</span>
              </>
            )}
          </span>
          <Icon name="next" />
        </button>
      )}
      {!panel && (
        <button type="button" className="rl-btn rl-btn--outline rl-foot_pedir" onClick={() => goTo("resumen")}>
          Pedir
        </button>
      )}
    </div>
  );

  const postCta =
    enEditor && step === "resumen" && pedido ? (
      <div className="rl-sent rl-glass" role="status">
        <button type="button" className="rl-iconbtn rl-sent_close" onClick={() => setPedido(false)} aria-label="Cerrar">
          <Icon name="close" size={16} />
        </button>
        <p className="rl-sent_title">
          Te abrimos WhatsApp con tu diseño <strong>{order.code}</strong>
        </p>
        <p className="rl-sent_row">
          <button
            type="button"
            className="rl-link"
            onClick={async () => {
              const r = await copyText(order.whatsappText);
              toast(r === "ok" ? "Mensaje copiado ✓" : "No pudimos copiarlo: escríbenos");
            }}
          >
            ¿No se abrió? Copiar mensaje
          </button>
          {/* "Escríbenos" = un canal escrito: el chat de WhatsApp de la tienda
              (sin el texto prellenado, que es lo que pudo fallar), no tel:. */}
          <a className="rl-link" href={SITE.contact.whatsapp} target="_blank" rel="noopener noreferrer">
            Escríbenos al {SITE.contact.phone}
          </a>
        </p>
        <p className="rl-sent_note">Tu diseño {order.code} queda guardado.</p>
      </div>
    ) : null;

  // — Cabeza del panel: el título del paso (o de la entrada). Con ?d=, antes
  //   de saber en qué paso se abre (hasta hidratar), una cabeza NEUTRA del
  //   mismo alto: no "Empieza con tu Orisha" sobre un reloj ya diseñado. —
  const stepHead = !enEditor && screen === "editor" ? (
    <div className="rl-stephead" aria-busy="true">
      <span className="rl-eyebrow">&nbsp;</span>
      <h2 id={`${uid}-title`} ref={headingRef} tabIndex={-1} className="rl-title">
        &nbsp;
      </h2>
    </div>
  ) : enEditor ? (
    <div className="rl-stephead">
      {step === "resumen" ? (
        listoEyebrow
      ) : (
        <span className="rl-eyebrow">
          Paso {i + 1} de {BUILD_STEPS}
          {/* Solo con un bloqueo real: nunca una frase roja fija. */}
          {blockedSteps.has(step) && <span className="rl-eyebrow_falta"> · falta resolver algo</span>}
        </span>
      )}
      <div className="rl-stephead_row">
        <h2 id={`${uid}-title`} ref={headingRef} tabIndex={-1} className="rl-title">
          {def.titulo}
        </h2>
        {step === "resumen" && (
          <button type="button" className="rl-detail_toggle" aria-expanded={detalle} onClick={() => setDetalle((x) => !x)}>
            {detalle ? "Ocultar detalle" : "Ver detalle"}
          </button>
        )}
      </div>
    </div>
  ) : (
    <div className="rl-stephead">
      <span className="rl-eyebrow">✦ Creador de relojes</span>
      <h2 id={`${uid}-title`} ref={headingRef} tabIndex={-1} className="rl-title">
        Empieza con tu Orisha
      </h2>
      <p className="rl-sub">Después lo cambias todo.</p>
    </div>
  );

  const tabs =
    enEditor && subs.length > 0 && sub ? (
      <SubTabs
        subs={subs}
        value={sub}
        onChange={setSub}
        panelId={panelId}
        idPrefix={uid}
        blocked={blockedSubs}
        sinVer={sinVer}
        label={`Partes de ${def.label}`}
      />
    ) : null;

  const options = (
    <div className="rl-opts_wrap">
      <div
        id={panelId}
        ref={optsShadow}
        className="rl-opts"
        role={tabs ? "tabpanel" : undefined}
        aria-labelledby={tabs && sub ? `${uid}-tab-${sub}` : `${uid}-title`}
        tabIndex={-1}
      >
        <div key={bodyKey} className="rl-body" data-anim={animKind}>
          {screen === "entrada" ? (
            <WatchEntry
              onPick={pickPreset}
              onHover={
                panel && !coarse
                  ? (id) => {
                      setHoverPreset(id);
                      // El 3D se adelanta solo si este equipo lo va a montar:
                      // con 'no' (sin WebGL2) nunca se usa, y con 'ligero'
                      // (ahorro de datos, red lenta, equipo modesto) se monta
                      // al pedirlo (§4.10). Mientras se mide (null, ≤ 1.5 s)
                      // sí se adelanta: casi siempre sale 'completo'.
                      if (id && support !== "no" && support !== "ligero") preload3D();
                    }
                  : undefined
              }
              onContinue={draft ? continueDraft : undefined}
              draft={draft ? { code: designCode(draft.config), at: draft.at } : null}
            />
          ) : (
            stepBody
          )}
        </div>
      </div>
      <div className="rl-ovhost" ref={setOverlayHost} />
    </div>
  );

  const showChips = enEditor;
  const sheetFull = !panel && (snap === "full" || teclado);
  const appClass = `pyj-reloj-app${panel ? " is-panel" : " is-sheet"}${teclado && !panel ? " is-keyboard" : ""}${
    sheetFull ? " is-sheet-full" : ""
  }`;

  return (
    <div ref={rootRef} className={appClass} data-pantalla={screen} data-paso={enEditor ? step : undefined}>
      <FocusHeader
        saved={screen === "editor" && saveSeq > 0}
        saveSeq={saveSeq}
        onAyuda={(el) => setAyuda((a) => (a ? null : el))}
        ayudaAbierta={!!ayuda}
        onSolicitar={panel && enEditor && step !== "resumen" ? () => goTo("resumen") : undefined}
        cart={order.canBuy ? { count, onOpen: () => setCartOpen(true) } : null}
      />

      <main className="rl-main">
        <WatchStage
          stageRef={stageRef}
          stage3dRef={stage3d}
          config={stageConfig}
          mask={mask}
          mode={mode}
          view={view.v}
          viewSeq={view.seq}
          noche={noche}
          mount3d={mount3d}
          foto={foto}
          fotoVista={fotoVista}
          insets={insets}
          status={status}
          onStatus={onStatus}
          onPartPick={onPartPick}
          onPartHover={enEditor ? onPartHover : undefined}
          onViewRequest={onViewRequest}
          onInteract={onInteract}
        >
          {showChips && (
            <StageChips
              ref={chipsRef}
              code={order.code}
              onCopy={copyLink}
              onShare={(el) => setShareAnchor((a) => (a ? null : el))}
              shareOpen={!!shareAnchor}
              onUndo={pasado.length ? deshacer : undefined}
              compact={!panel}
            />
          )}
          {/* UNA pista, y que diga qué se puede hacer con el reloj (la del visor
              se calla en el editor: editor.css). */}
          {enEditor && verPista && (
            <HintChip
              text={
                !tres
                  ? "Las piezas en cristal se colocan en su paso"
                  : coarse
                    ? "Desliza para girarlo · toca una pieza"
                    : "Arrastra para girarlo · toca una pieza para cambiarla"
              }
            />
          )}
          {enEditor && tres && !coarse && <PartTip ref={partTip} />}
          {(screen === "editor" || tres || support === "ligero") && dock}
        </WatchStage>

        <OverlayHostContext.Provider value={overlayHost}>
          {panel ? (
            <aside className={`rl-panel rl-glass${screen === "entrada" ? " rl-panel--entrada" : ""}`} aria-labelledby={`${uid}-title`}>
              {enEditor && <Stepper step={step} max={max} blocked={blockedSteps} sinVer={pasosPorVer} onGo={(s) => goTo(s)} />}
              {stepHead}
              {tabs}
              {options}
              {postCta}
              {footer}
            </aside>
          ) : (
            <BottomSheet
              snap={snap}
              onSnap={setSnap}
              keyboard={teclado}
              onVisibleHeight={onSheetHeight}
              label={screen === "editor" ? def.titulo : "Empieza con tu Orisha"}
              head={
                !enEditor && screen === "editor" ? (
                  // ?d= aún sin decidir el paso (antes de hidratar): neutra.
                  <h2 id={`${uid}-title`} ref={headingRef} tabIndex={-1} className="rl-sr" aria-busy="true">
                    {def.titulo}
                  </h2>
                ) : enEditor ? (
                  <>
                    <Stepper step={step} max={max} blocked={blockedSteps} sinVer={pasosPorVer} onGo={(s) => goTo(s)} compact />
                    <h2 id={`${uid}-title`} ref={headingRef} tabIndex={-1} className="rl-sr">
                      {step === "resumen" ? `${def.titulo} · ${order.code}` : def.titulo}
                    </h2>
                  </>
                ) : (
                  <div className="rl-sheet_entryhead">
                    <h2 id={`${uid}-title`} ref={headingRef} tabIndex={-1} className="rl-title">
                      Empieza con tu Orisha
                    </h2>
                    <span className="rl-sub">Después lo cambias todo</span>
                  </div>
                )
              }
              tabs={tabs}
              footer={
                <>
                  {postCta}
                  {footer ??
                    (screen === "entrada" ? (
                      <div className="rl-foot rl-foot--entrada">
                        <a className="rl-link" href={GUIA_HREF}>
                          ¿Cómo funciona? Precio, plazo y prueba →
                        </a>
                      </div>
                    ) : (
                      // ?d= antes de hidratar: el pie guarda su alto, vacío.
                      <div className="rl-foot" aria-hidden="true" />
                    ))}
                </>
              }
            >
              {options}
            </BottomSheet>
          )}
        </OverlayHostContext.Provider>
      </main>

      {shareAnchor && (
        <SharePopover
          order={order}
          file={snapshot && snapshot.code === order.code ? snapshot.file : null}
          onClose={closeShare}
          returnFocus={shareAnchor}
        />
      )}
      {ayuda && <HelpPanel onClose={closeHelp} returnFocus={ayuda} tres={tres} coarse={coarse} />}
      {/* El aviso ("Enlace copiado ✓") dentro del armazón: tokens, cristal y
          capa propios (announce.tsx). */}
      <AnnouncerToast />
    </div>
  );
}
