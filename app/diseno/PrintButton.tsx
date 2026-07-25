"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      className="pyj-btn-gold pyj-sheet_print"
      onClick={() => window.print()}
    >
      Imprimir / Guardar PDF
    </button>
  );
}
