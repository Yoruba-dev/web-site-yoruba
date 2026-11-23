// GENERADO por scripts/gen-watch-glyphs.mjs (--solo fina) — no editar a mano.
// Avance de cada carácter de la letra fina (Cormorant Garamond Italic 500), en em
// (avance / upm 1000), sin interletraje. Lo usa estimateTextWidth()
// (lib/watch-art.ts) para medir el grabado "Fina" con sus anchos reales. Es lo
// único de las tablas de letras que llega a la carga inicial: debe seguir
// pesando poco (≤ 3 KB).
// Copyright 2015 The Cormorant Project Authors (github.com/CatharsisFonts/Cormorant) — SIL Open Font License 1.1
// (el texto completo, en lib/watch-glyphs-fina.ts).
export const FINA_ADV: Readonly<Record<string, number>> = {"0":0.441,"1":0.291,"2":0.366,"3":0.346,"4":0.426,"5":0.374,"6":0.422,"7":0.389,"8":0.44,"9":0.422,"A":0.602,"B":0.534,"C":0.586,"D":0.62,"E":0.519,"F":0.484,"G":0.631,"H":0.672,"I":0.317,"J":0.292,"K":0.604,"L":0.499,"M":0.735,"N":0.652,"O":0.652,"P":0.512,"Q":0.652,"R":0.62,"S":0.465,"T":0.553,"U":0.619,"V":0.595,"W":0.826,"X":0.579,"Y":0.531,"Z":0.55,"a":0.437,"b":0.439,"c":0.346,"d":0.446,"e":0.347,"f":0.264,"g":0.382,"h":0.448,"i":0.247,"j":0.242,"k":0.415,"l":0.24,"m":0.679,"n":0.468,"o":0.401,"p":0.406,"q":0.417,"r":0.345,"s":0.306,"t":0.297,"u":0.468,"v":0.437,"w":0.621,"x":0.424,"y":0.446,"z":0.344,"Á":0.602,"É":0.519,"Í":0.317,"Ó":0.652,"Ú":0.619,"Ü":0.619,"Ñ":0.652,"á":0.437,"é":0.347,"í":0.247,"ó":0.401,"ú":0.468,"ü":0.468,"ñ":0.468," ":0.234,".":0.2,",":0.227,"'":0.132,"·":0.203,"&":0.755,"/":0.305,"-":0.305};

// ---------------------------------------------------------------------------
// AÑADIDO A MANO (no lo escribe el generador) — para que el grabado de la TAPA
// encoja por igual y nunca se comprima de lado (fitCasebackSize, en
// lib/watch-art.ts), sin cargar las tablas de contornos:
//   • CLASICA_ADV: avance de cada carácter de la clásica (Cinzel Regular), en
//     em (avance / upm 1000), copiado de GLYPH_PY_DIAL
//     (lib/watch-glyphs-clasica.ts, que no se toca).
//   • CLASICA_KERN_POS / FINA_KERN_POS: SOLO las parejas cuyo interletraje
//     SEPARA (positivo), en em. Las que juntan se ignoran a propósito: así la
//     medida es una cota por exceso del ancho real de los contornos
//     (textWidthMm, lib/watch-curvas.ts).
// scripts/check-watch-data.ts comprueba que son EXACTAMENTE las de las tablas
// de contornos y, si no, imprime las líneas correctas. El generador
// (--solo fina) conserva este bloque tal cual: lo copia del archivo anterior
// desde la línea "AÑADIDO A MANO" (si faltara, tsc y el chequeo fallan). Con
// él, los datos pesan
// ~3.3 KB (~1.2 KB gzip, sin estos comentarios): sigue siendo poco para la
// carga inicial.
// ---------------------------------------------------------------------------
export const CLASICA_ADV: Readonly<Record<string, number>> = {"0":0.596,"1":0.344,"2":0.553,"3":0.503,"4":0.583,"5":0.498,"6":0.56,"7":0.502,"8":0.552,"9":0.56,"A":0.712,"B":0.586,"C":0.76,"D":0.807,"E":0.577,"F":0.541,"G":0.798,"H":0.813,"I":0.338,"J":0.324,"K":0.657,"L":0.562,"M":0.931,"N":0.841,"O":0.838,"P":0.577,"Q":0.837,"R":0.677,"S":0.475,"T":0.618,"U":0.785,"V":0.74,"W":0.982,"X":0.662,"Y":0.661,"Z":0.651,"a":0.663,"b":0.57,"c":0.705,"d":0.76,"e":0.546,"f":0.523,"g":0.742,"h":0.746,"i":0.336,"j":0.309,"k":0.624,"l":0.536,"m":0.878,"n":0.779,"o":0.774,"p":0.553,"q":0.777,"r":0.627,"s":0.462,"t":0.578,"u":0.7,"v":0.663,"w":0.899,"x":0.626,"y":0.64,"z":0.608,"Á":0.712,"É":0.577,"Í":0.338,"Ó":0.838,"Ú":0.785,"Ü":0.785,"Ñ":0.841,"á":0.663,"é":0.546,"í":0.306,"ó":0.774,"ú":0.7,"ü":0.7,"ñ":0.779," ":0.25,".":0.179,",":0.185,"'":0.17,"·":0.17,"&":0.646,"/":0.406,"-":0.38};
export const CLASICA_KERN_POS: Readonly<Record<string, number>> = {"11":0.035,"A/":0.04,"BC":0.005,"BG":0.005,"BO":0.005,"BQ":0.005,"BÓ":0.005,"K/":0.04,"M/":0.025,"PC":0.005,"PG":0.005,"PO":0.005,"PQ":0.005,"PÓ":0.005,"R/":0.04,"TT":0.015,"T'":0.05,"V'":0.035,"X/":0.04,"Y'":0.04,"Zc":0.01,"Zg":0.01,"Zo":0.01,"Zq":0.01,"Zó":0.01,"a/":0.04,"bc":0.005,"bg":0.005,"bo":0.005,"bq":0.005,"bó":0.005,"cc":0.02,"cg":0.02,"co":0.02,"cq":0.02,"có":0.02,"k/":0.04,"pc":0.005,"pg":0.005,"po":0.005,"pq":0.005,"pó":0.005,"r/":0.04,"tt":0.015,"tv":0.01,"tw":0.01,"ty":0.01,"vt":0.01,"wt":0.01,"x/":0.04,"yt":0.01,"6-":0.015,"9-":0.015,"Á/":0.04,"á/":0.04,"'T":0.05,"'V":0.035,"'Y":0.04,"/V":0.04,"/W":0.04,"/X":0.03,"/Y":0.04,"/v":0.015,"/w":0.015,"/y":0.015,"-4":0.025,"-6":0.015};
export const FINA_KERN_POS: Readonly<Record<string, number>> = {"A4":0.025,"Q3":0.04,"Q5":0.04,"Q7":0.06,"Q9":0.04,"T'":0.035,"V'":0.023,"W'":0.023,"YY":0.023,"Y'":0.023,"f'":0.025,"gf":0.023,"gj":0.023,"gp":0.012,"hc":0.006,"he":0.006,"ho":0.006,"jf":0.017,"mc":0.006,"me":0.006,"mo":0.006,"nc":0.006,"ne":0.006,"no":0.006,"qg":0.012,"Á4":0.025,"ñc":0.006,"ñe":0.006,"ño":0.006,".A":0.035,".X":0.035,".Á":0.035,"..":0.07,".,":0.07,"./":0.07,",A":0.035,",X":0.035,",Á":0.035,",.":0.07,",,":0.07,",/":0.07,"'T":0.035,"'V":0.023,"'W":0.023,"'Y":0.023,"'b":0.023,"'h":0.023,"'k":0.023,"'l":0.023,"''":0.052,"/T":0.035,"/V":0.023,"/W":0.023,"/Y":0.023,"/b":0.023,"/h":0.023,"/k":0.023,"/l":0.023,"/'":0.052};
