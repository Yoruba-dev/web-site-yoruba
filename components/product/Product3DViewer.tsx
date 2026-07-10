"use client";

import { createElement, useEffect, useState } from "react";
import type { Model3D } from "@/lib/types";

// Google's <model-viewer> web component — the e-commerce standard for 3D + AR
// (Shopify itself uses it). Loaded once from CDN to avoid bundler/peer conflicts
// with the app's own three.js. Renders the product's Shopify 3D model with orbit
// controls + real "view in your space" AR (iOS Quick Look via USDZ, Android
// Scene Viewer via GLB).
const MODEL_VIEWER_CDN =
  "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js";

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

  if (!ready) {
    return (
      <div style={{ padding: "70px 0", textAlign: "center", color: "#a99d83" }}>
        Cargando visor 3D…
      </div>
    );
  }

  const arButton = createElement(
    "button",
    {
      slot: "ar-button",
      style: {
        position: "absolute",
        bottom: 18,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--pyj-gold, #caa23a)",
        color: "#14100a",
        border: "none",
        borderRadius: 30,
        padding: "11px 24px",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
      },
    },
    "👋 Ver en tu espacio (AR)",
  );

  const hint = createElement(
    "div",
    {
      slot: "progress-bar",
      style: { display: "none" },
    },
  );

  return createElement(
    "model-viewer",
    {
      src: model.glb,
      "ios-src": model.usdz,
      poster,
      alt: alt ?? "Modelo 3D de la pieza",
      ar: "",
      "ar-modes": "webxr scene-viewer quick-look",
      "ar-scale": "auto",
      "camera-controls": "",
      "touch-action": "pan-y",
      "auto-rotate": "",
      "auto-rotate-delay": "0",
      "rotation-per-second": "18deg",
      "interaction-prompt": "auto",
      "shadow-intensity": "1",
      exposure: "1.1",
      style: {
        width: "100%",
        height: "clamp(340px, 60vh, 560px)",
        background: "#14100a",
        borderRadius: 6,
        overflow: "hidden",
      },
    },
    arButton,
    hint,
  );
}
