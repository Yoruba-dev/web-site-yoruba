// Editorial content ("Diario") — devotional/educational articles that answer
// what people actually search for (Idde de Orula, colores de los Orishas, tipos
// de oro, herramientas de santo) and lead the reader to the relevant pieces.
// This is the store's long-tail SEO engine: each article targets real queries
// and links into the catalogue. Rendered by /blog and /blog/[slug] and listed
// in the sitemap.
//
// Body is authored as structured Blocks (not raw HTML) so it renders as plain
// React nodes, safely. Inline emphasis uses a tiny markdown subset handled by
// components/blog/ArticleBody: **bold** and [label](/href) links only.

export type Block = { h2: string } | { p: string } | { ul: string[] };

export interface Article {
  slug: string;
  title: string;
  /** ~155-char summary for the card + meta description. */
  excerpt: string;
  keywords: string[];
  /** ISO date (published). Kept constant so builds stay deterministic. */
  date: string;
  cover: string;
  category: string;
  readingMinutes: number;
  /** Soft call-to-action into the catalogue. */
  cta?: { label: string; href: string };
  blocks: Block[];
}

export const ARTICLES: Article[] = [
  {
    slug: "que-es-el-idde-de-orula",
    title: "¿Qué es el Idde de Orula? Significado y cómo se lleva",
    excerpt:
      "El Idde de Orula es la pulsera verde y amarilla que recibe quien se acerca a Ifá. Te explicamos su significado, en qué mano se usa y por qué se hace en oro.",
    keywords: [
      "idde de orula",
      "idde de ifa",
      "pulsera de orula significado",
      "manilla de orula",
      "que es el idde",
    ],
    date: "2026-07-13",
    cover: "/assets/images/slider/4.jpg",
    category: "Tradición",
    readingMinutes: 4,
    cta: { label: "Ver los Idde de Orula", href: "/shop-left-sidebar?cat=Idde" },
    blocks: [
      { p: "El **Idde de Orula** (también escrito ide o iddé de Ifá) es una de las prendas más reconocibles de la tradición Yoruba. Es la pulsera de cuentas **verdes y amarillas** —los colores de Orula, el Oricha de la sabiduría y el oráculo de Ifá— que recibe la persona cuando se acerca a esta senda." },
      { h2: "¿Qué significa el Idde?" },
      { p: "El Idde es, ante todo, un **pacto**. Representa el vínculo entre el creyente y Orunmila (Orula), y funciona como una señal de protección y de compromiso con la sabiduría de Ifá. No es un adorno: es un atributo religioso con un significado profundo para quien lo porta." },
      { h2: "¿En qué mano se lleva?" },
      { p: "Tradicionalmente, el Idde de Orula se coloca en la **muñeca izquierda**. La costumbre puede variar según la casa de santo y la orientación de tu padrino o madrina, por lo que siempre conviene consultarlo con quien te guía." },
      { h2: "¿Por qué hacerlo en oro?" },
      { p: "Muchos devotos eligen llevar su Idde en **oro de 10k, 14k o 18k** en lugar de solo cuentas. El oro respeta los colores de Orula, es mucho más duradero para el uso diario y eleva la pieza a una joya de por vida. En un taller como el nuestro se elabora **a mano** y a la medida de tu muñeca." },
      { h2: "Cuidado de tu Idde" },
      { p: "Guárdalo en su estuche cuando no lo lleves y evita el contacto directo con perfumes y químicos. El oro no se oxida, pero un cuidado sencillo mantiene su brillo por años." },
      { p: "Si buscas un Idde de Orula hecho a mano en Miami, en oro y a tu medida, podemos elaborarlo por encargo respetando la tradición." },
    ],
  },
  {
    slug: "colores-de-los-orishas-y-sus-elekes",
    title: "Los colores de los Orishas y sus elekes",
    excerpt:
      "Cada Oricha tiene sus colores y su eleke (collar). Guía rápida de Elegguá, Obatalá, Oshún, Yemayá, Changó y Orula para reconocerlos y honrarlos.",
    keywords: [
      "colores de los orishas",
      "eleke de los orishas",
      "collares de santo colores",
      "colores de oshun yemaya chango",
      "significado colores orishas",
    ],
    date: "2026-07-12",
    cover: "/assets/images/slider/5.jpg",
    category: "Tradición",
    readingMinutes: 5,
    cta: { label: "Comprar por Oricha", href: "/shop-left-sidebar" },
    blocks: [
      { p: "En la tradición Lucumí, cada **Oricha** se reconoce por sus colores. Esos colores aparecen en su **eleke** (el collar de cuentas), en sus atributos y en las joyas que le honran. Conocerlos ayuda a elegir la pieza correcta y a llevar tu devoción con propiedad." },
      { h2: "Elegguá — rojo y negro" },
      { p: "Dueño de los caminos y las aperturas. Sus colores, el **rojo y el negro**, marcan el inicio de todo: nada empieza sin Elegguá." },
      { h2: "Obatalá — blanco" },
      { p: "La pureza y la paz. Obatalá se viste de **blanco**, a veces con detalles nacarados, símbolo de claridad y equilibrio." },
      { h2: "Oshún — amarillo y dorado" },
      { p: "El amor, el río y la prosperidad. Oshún, sincretizada con la **Virgen de la Caridad del Cobre**, brilla en **amarillo y oro**. Por eso muchas de sus piezas se elaboran en oro." },
      { h2: "Yemayá — azul y blanco" },
      { p: "El mar y la maternidad. El **azul y el blanco** de Yemayá evocan las olas y la protección de la madre de todos." },
      { h2: "Changó — rojo y blanco" },
      { p: "La fuerza y la justicia. El **rojo y el blanco** de Changó representan el fuego y el poder." },
      { h2: "Orula — verde y amarillo" },
      { p: "La sabiduría de Ifá. El **verde y el amarillo** de Orula son los del [Idde de Orula](/blog/que-es-el-idde-de-orula), la pulsera de quien se acerca al oráculo." },
      { p: "Cada Oricha tiene además otros atributos y matices según la casa de santo. En nuestra colección puedes encontrar piezas hechas a mano para cada uno, en oro de 10k, 14k y 18k." },
    ],
  },
  {
    slug: "oro-10k-14k-18k-cual-elegir",
    title: "Oro 10k, 14k o 18k: cuál elegir para tu joya",
    excerpt:
      "La diferencia entre oro 10k, 14k y 18k está en la pureza. Te explicamos cuál conviene según durabilidad, color y presupuesto para tu pieza religiosa.",
    keywords: [
      "diferencia oro 10k 14k 18k",
      "cual oro es mejor",
      "quilates de oro joyeria",
      "oro 14k vs 18k",
      "que significa 10k 14k 18k",
    ],
    date: "2026-07-11",
    cover: "/assets/images/banner/1_5.jpg",
    category: "Guía de compra",
    readingMinutes: 4,
    cta: { label: "Ver la colección", href: "/shop-left-sidebar" },
    blocks: [
      { p: "Cuando encargas una joya, una de las primeras decisiones es el **quilataje del oro**: 10k, 14k o 18k. La diferencia está en la **pureza** —cuánto oro puro contiene la aleación— y eso afecta el color, la durabilidad y el precio." },
      { h2: "¿Qué significan los quilates?" },
      { p: "El oro puro es de 24 quilates (24k), pero es demasiado blando para el uso diario, así que se mezcla con otros metales:" },
      { ul: [
        "**10k** — 41.7% de oro. El más resistente y accesible; ideal para piezas de uso diario que reciben golpes.",
        "**14k** — 58.5% de oro. El equilibrio más popular entre durabilidad, color y precio.",
        "**18k** — 75% de oro. El color más intenso y cálido; más noble, algo más blando y de mayor valor.",
      ] },
      { h2: "¿Cuál elegir?" },
      { p: "**Para uso diario** (una pulsera o un Idde que no te quitas): el 10k o el 14k rinden mejor porque resisten más. **Para una pieza de lujo o de regalo** que buscas que luzca un dorado profundo: el 18k destaca. Si dudas, el **14k** es la elección segura para la mayoría de las piezas." },
      { h2: "Tres colores de oro" },
      { p: "El oro también viene en **amarillo, blanco y rosado**. Combinarlos —como en nuestras piezas de tres colores— permite resaltar detalles: por ejemplo, un resplandor en oro rosa sobre una figura en oro amarillo y blanco." },
      { p: "En cada pieza te asesoramos sobre el quilataje según lo que buscas. Todas se elaboran a mano y, si lo prefieres, por encargo en el quilate que elijas." },
    ],
  },
  {
    slug: "herramientas-de-santo-que-son",
    title: "Herramientas de santo: qué son y para qué sirven",
    excerpt:
      "Las herramientas de santo son los atributos de cada Oricha. Te explicamos qué representan los remos de Oshún, las herramientas de Yemayá y más.",
    keywords: [
      "herramientas de santo",
      "atributos de los orishas",
      "remos de oshun",
      "herramientas de yemaya",
      "atributos de santo significado",
    ],
    date: "2026-07-10",
    cover: "/assets/images/slider/1.jpg",
    category: "Tradición",
    readingMinutes: 4,
    cta: {
      label: "Ver las Herramientas de santo",
      href: "/shop-left-sidebar?cat=Herramientas",
    },
    blocks: [
      { p: "Las **herramientas de santo** (o atributos) son los instrumentos sagrados que acompañan a cada **Oricha**. Cada una cuenta algo del carácter y la historia del santo, y forma parte del fundamento en la coronación de Ocha y en el trono." },
      { h2: "¿Qué representan?" },
      { p: "Las herramientas no son decoración: son símbolos del poder y del dominio de cada Oricha. Se elaboran con cuidado y se entregan según el ritual, muchas veces en metal noble para que perduren." },
      { h2: "Algunas herramientas por Oricha" },
      { ul: [
        "**Oshún** — sus remos y símbolos del río, ligados al amor y a la prosperidad.",
        "**Yemayá** — atributos del mar: timón, ancla, salvavidas y la media luna.",
        "**Elegguá** — la llave y los símbolos de los caminos que abre y cierra.",
        "**Changó** — el hacha doble (oshé), símbolo de su fuerza y justicia.",
      ] },
      { h2: "¿En qué material se hacen?" },
      { p: "Se elaboran en **plata, acero** y también en **oro** para piezas de fundamento o de lujo. En un taller artesanal se pueden hacer **por encargo**, cuidando cada detalle para que respeten la tradición." },
      { p: "Si necesitas herramientas para tu Ocha o para completar un trono, podemos elaborarlas a mano y coordinar los detalles contigo." },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
