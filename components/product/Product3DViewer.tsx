"use client";

import { createElement, useEffect, useState } from "react";
import type { Model3D } from "@/lib/types";

// Google's <model-viewer> — the e-commerce standard for 3D + AR (Shopify uses it
// too). Loaded once from CDN to avoid bundler/peer conflicts with the app's own
// three.js. Real "view in your space" AR: iOS Quick Look (USDZ) + Android Scene
// Viewer (GLB) — both use the phone camera to place the piece in the room.
const MODEL_VIEWER_CDN =
  "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js";

const GOLD = "#e3b23c";
const GOLD_LIGHT = "#f2d896";
const BORDER = "1px solid rgba(227,178,60,0.32)";

const BADGES = ["Girar 360°", "Acercar al detalle", "Ver en tu espacio · AR"];

export default function Product3DViewer({
  model,
  poster,
  alt,
}: {
  model: Model3D;
  poster?: string;
  alt?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.customElements?.get("model-viewer")) {
      setReady(true);
      return;
    }
    if (!document.querySelector("script[data-model-viewer]")) {
      const s = document.createElement("script");
      s.type = "module";
      s.src = MODEL_VIEWER_CDN;
      s.dataset.modelViewer = "1";
      document.head.appendChild(s);
    }
    let cancelled = false;
    window.customElements.whenDefined("model-viewer").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const arButton = createElement(
    "button",
    {
      slot: "ar-button",
      style: {
        position: "absolute",
        bottom: 18,
        left: "50%",
        transform: "translateX(-50%)",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: GOLD,
        color: "#14100a",
        border: "none",
        padding: "12px 26px",
        fontSize: 14.5,
        fontWeight: 700,
        letterSpacing: "0.03em",
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
      },
    },
    "Ver en tu espacio",
  );

  const viewer = ready
    ? createElement(
        "model-viewer",
        {
          src: model.glb,
          "ios-src": model.usdz,
          poster,
          alt: alt ?? "Modelo 3D de la pieza",
          // React 19 maps `ar` to the element property — must be a truthy boolean,
          // NOT "" (empty string is falsy → AR silently disabled).
          ar: true,
          "ar-modes": "webxr scene-viewer quick-look",
          "ar-scale": "auto",
          "camera-controls": "",
          "touch-action": "pan-y",
          "auto-rotate": "",
          "auto-rotate-delay": "0",
          "rotation-per-second": "18deg",
          "interaction-prompt": "auto",
          "shadow-intensity": "1",
          exposure: "1.15",
          style: {
            width: "100%",
            height: "clamp(360px, 62vh, 580px)",
            background: "radial-gradient(120% 120% at 50% 15%, #201810 0%, #14100a 70%)",
            display: "block",
          },
        },
        arButton,
      )
    : (
        <div style={{ padding: "80px 0", textAlign: "center", color: "#a99d83" }}>
          Cargando visor 3D…
        </div>
      );

  return (
    <div>
      <p style={{ color: "#a99d83", fontSize: 14.5, lineHeight: 1.65, margin: "0 0 14px", maxWidth: 640 }}>
        Míralo como si lo tuvieras en la mano:{" "}
        <strong style={{ color: GOLD }}>gíralo y acércalo</strong>, y desde tu celular{" "}
        <strong style={{ color: GOLD }}>colócalo en tu espacio con la cámara</strong> en tamaño
        real antes de comprar.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, margin: "0 0 16px" }}>
        {BADGES.map((b) => (
          <span
            key={b}
            style={{
              fontSize: 12.5,
              letterSpacing: "0.03em",
              color: GOLD_LIGHT,
              border: BORDER,
              padding: "6px 13px",
            }}
          >
            {b}
          </span>
        ))}
      </div>

      <div style={{ position: "relative", border: BORDER, overflow: "hidden" }}>{viewer}</div>

      <p style={{ color: "#8c8168", fontSize: 12.5, margin: "12px 0 0", fontStyle: "italic" }}>
        ¿En computadora? Abre esta página en tu teléfono y toca{" "}
        <strong style={{ color: GOLD_LIGHT }}>&ldquo;Ver en tu espacio&rdquo;</strong> para la
        experiencia de realidad aumentada.
      </p>
    </div>
  );
}
