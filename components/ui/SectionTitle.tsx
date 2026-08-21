import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Cabecera de sección: título + línea de apoyo + enlace a la derecha.
 *
 * Este patrón estaba escrito A MANO en tres sitios (la portada, /mayoreo y
 * /ninos), cada uno con sus propios estilos incrustados y el gris #a99d83
 * copiado a pelo. /ninos además copió solo las piezas de dentro y no el
 * contenedor, que es por lo que se veía distinto y apretado.
 *
 * Dos detalles que hay que respetar y que antes se rompían:
 *
 * 1. El <h4> tiene que ser HIJO DIRECTO de .hiraola-section_title. La raya
 *    dorada de la plantilla es `.hiraola-section_title > h4:before`, así que en
 *    cuanto se envuelve el título en otro <div> —como hacía la portada— la raya
 *    desaparece sin que nadie se dé cuenta.
 * 2. La línea de apoyo va FUERA de esa caja. Dentro queda aplastada entre la
 *    raya dorada del h4 y el borde inferior de la propia caja: 6 px de aire
 *    entre dos líneas.
 */
export default function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  /** Línea de apoyo: un contador ("9 piezas") o una frase corta. */
  subtitle?: ReactNode;
  /** Enlace alineado a la derecha. `external` para destinos fuera del sitio. */
  action?: { label: string; href: string; external?: boolean };
}) {
  return (
    <div className="pyj-sechead">
      <div className="hiraola-section_title">
        <h4>{title}</h4>
      </div>
      {(subtitle || action) && (
        <div className="pyj-sechead_meta">
          {subtitle && <p className="pyj-sechead_sub">{subtitle}</p>}
          {action &&
            (action.external ? (
              <a
                className="pyj-sechead_action"
                href={action.href}
                target="_blank"
                rel="noreferrer"
              >
                {action.label} →
              </a>
            ) : (
              <Link className="pyj-sechead_action" href={action.href}>
                {action.label} →
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
