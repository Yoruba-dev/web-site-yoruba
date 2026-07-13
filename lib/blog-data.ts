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

  // --- Backlog: se publican solos, uno por semana (fechas futuras) -----------
  {
    slug: "san-lazaro-babalu-aye-devocion",
    title: "San Lázaro y Babalú Ayé: la devoción que sana",
    excerpt:
      "San Lázaro se sincretiza con Babalú Ayé, el Oricha de la salud. Te contamos su devoción, sus colores y por qué se le honra con tanto respeto.",
    keywords: [
      "san lazaro babalu aye",
      "babalu aye orisha",
      "devocion a san lazaro",
      "atributos de san lazaro",
      "san lazaro colores",
    ],
    date: "2026-07-20",
    cover: "/assets/images/slider/2.jpg",
    category: "Tradición",
    readingMinutes: 4,
    cta: { label: "Ver piezas por Oricha", href: "/shop-left-sidebar" },
    blocks: [
      { p: "**San Lázaro** es una de las devociones más queridas y respetadas. En la tradición Lucumí se sincretiza con **Babalú Ayé**, el Oricha ligado a la **salud**, la enfermedad y la curación." },
      { h2: "¿Quién es Babalú Ayé?" },
      { p: "Babalú Ayé es el Oricha que castiga y también sana. Se le honra con humildad y respeto profundo, pidiendo salud para uno y para los suyos. Su culto está lleno de gratitud." },
      { h2: "Sus colores y símbolos" },
      { p: "Se asocia con el **morado** y con la tela de saco (jute). Entre sus atributos están las **muletas** y los perros que lo acompañan, símbolos de su historia y de su misericordia." },
      { h2: "Piezas en su honor" },
      { p: "Muchos devotos llevan una medalla o dije de San Lázaro como muestra de fe y agradecimiento por la salud recibida. Se pueden elaborar a mano en oro o plata, por encargo." },
      { p: "Si buscas una pieza de San Lázaro hecha con respeto y a tu gusto, podemos crearla para ti." },
    ],
  },
  {
    slug: "como-cuidar-tu-joyeria-de-oro",
    title: "Cómo cuidar tu joyería de oro para que dure toda la vida",
    excerpt:
      "El oro no se oxida, pero un cuidado sencillo mantiene su brillo por años. Guía práctica para limpiar, guardar y proteger tus piezas.",
    keywords: [
      "como cuidar joyeria de oro",
      "limpiar oro en casa",
      "cuidado de joyas de oro",
      "como mantener el brillo del oro",
      "guardar joyas de oro",
    ],
    date: "2026-07-27",
    cover: "/assets/images/banner/1_6.jpg",
    category: "Guía de compra",
    readingMinutes: 4,
    cta: { label: "Ver la colección", href: "/shop-left-sidebar" },
    blocks: [
      { p: "El **oro no se oxida**, pero el uso diario, los perfumes y el sudor pueden opacar su brillo. Con unos cuidados sencillos, tu pieza se mantiene como nueva por años." },
      { h2: "Limpieza en casa" },
      { p: "Sumerge la pieza unos minutos en **agua tibia con un poco de jabón neutro**, frota suave con un cepillo de cerdas blandas, enjuaga y seca con un paño de microfibra. Evita productos abrasivos." },
      { h2: "Qué evitar" },
      { ul: [
        "Perfumes, cremas y químicos directos sobre la pieza.",
        "Cloro de piscinas y productos de limpieza del hogar.",
        "Golpes fuertes: quítala para hacer ejercicio o trabajos rudos.",
      ] },
      { h2: "Cómo guardarla" },
      { p: "Guarda cada pieza en su **estuche** o en una bolsita suave, separada de otras joyas para que no se rayen entre sí. Un lugar seco y sin humedad es lo ideal." },
      { p: "Toda pieza de nuestra casa tiene **garantía de por vida**. Si necesita un ajuste o pulido, escríbenos y la dejamos como nueva." },
    ],
  },
  {
    slug: "virgen-caridad-del-cobre-y-oshun",
    title: "La Virgen de la Caridad del Cobre y Oshún: patrona y Oricha",
    excerpt:
      "La Caridad del Cobre es la patrona de Cuba y, en la tradición Lucumí, se sincretiza con Oshún, dueña del amor, el río y el oro.",
    keywords: [
      "caridad del cobre oshun",
      "virgen de la caridad del cobre",
      "oshun oricha del amor",
      "patrona de cuba",
      "cachita oshun",
    ],
    date: "2026-08-03",
    cover: "/assets/images/slider/6.jpg",
    category: "Tradición",
    readingMinutes: 4,
    cta: {
      label: "Ver la Virgen de la Caridad",
      href: "/products/virgen-de-la-caridad-del-cobre-10k-oro-tres-colores",
    },
    blocks: [
      { p: "La **Virgen de la Caridad del Cobre** —cariñosamente “Cachita”— es la **patrona de Cuba**. En la tradición Lucumí se sincretiza con **Oshún**, dueña del amor, el río, la dulzura y el oro." },
      { h2: "El amor y el río" },
      { p: "Oshún representa el amor, la feminidad y la prosperidad. Su color es el **amarillo y el dorado**, por eso muchas de sus piezas se elaboran en oro, el metal que más le pertenece." },
      { h2: "Una misma devoción, dos rostros" },
      { p: "Para muchos creyentes, honrar a la Caridad del Cobre es honrar a Oshún. Una medalla o dije de la Virgen une la fe católica y la Lucumí en una sola pieza." },
      { p: "En nuestra colección tenemos la **Virgen de la Caridad del Cobre en oro de tres colores**, hecha a mano, en varios tamaños y también por encargo." },
    ],
  },
  {
    slug: "elekes-que-son-como-se-llevan",
    title: "Elekes: qué son los collares de los Orishas y cómo se llevan",
    excerpt:
      "Los elekes son los collares de cuentas de cada Oricha. Te explicamos qué significan, por qué se consagran y cómo llevarlos con respeto.",
    keywords: [
      "elekes",
      "collares de los orishas",
      "ileke santeria",
      "collares de santo significado",
      "como se llevan los elekes",
    ],
    date: "2026-08-10",
    cover: "/assets/images/slider/7.jpg",
    category: "Tradición",
    readingMinutes: 4,
    cta: { label: "Comprar por Oricha", href: "/shop-left-sidebar" },
    blocks: [
      { p: "Los **elekes** (o ilekes) son los **collares de cuentas** de los Orichas. Cada uno lleva los colores de su santo y, una vez consagrados, son mucho más que un adorno: son protección y presencia del Oricha." },
      { h2: "¿Por qué se consagran?" },
      { p: "Un eleke se consagra en la casa de santo mediante un ritual. A partir de ese momento, se trata con respeto: no es una bisutería, es un objeto sagrado que acompaña al creyente." },
      { h2: "Cómo llevarlos con respeto" },
      { p: "Se recomienda quitárselos para dormir, bañarse o tener intimidad, y guardarlos con cuidado. Tu padrino o madrina te orientará según tu casa de santo." },
      { p: "Además de las cuentas, muchas piezas de los Orichas —dijes, medallas y atributos— se elaboran en oro para durar toda la vida. Podemos hacerlas por encargo." },
    ],
  },
  {
    slug: "regalar-una-pieza-religiosa-guia",
    title: "Regalar una pieza religiosa: guía para acertar",
    excerpt:
      "¿Vas a regalar una joya de santo? Te ayudamos a elegir por Oricha, tamaño y quilate para que el regalo tenga el significado correcto.",
    keywords: [
      "regalar joya religiosa",
      "regalo santeria",
      "regalo cumpleaños de santo",
      "que regalar a un iyawo",
      "regalo pieza de oricha",
    ],
    date: "2026-08-17",
    cover: "/assets/images/banner/1_5.jpg",
    category: "Guía de compra",
    readingMinutes: 4,
    cta: { label: "Ver la colección", href: "/shop-left-sidebar" },
    blocks: [
      { p: "Regalar una **pieza religiosa** es un gesto lleno de significado. Para acertar, conviene pensar en la persona que la recibe y en su devoción." },
      { h2: "Elige por su Oricha" },
      { p: "Lo más acertado es regalar algo ligado al **Oricha de la persona** o a su santo de devoción: un dije, una medalla o los colores de su eleke. Si no lo sabes, una pieza de la Caridad del Cobre (Oshún) o de San Lázaro suele ser bien recibida." },
      { h2: "Tamaño y quilate" },
      { p: "Para uso diario, el **oro 10k o 14k** rinde mejor; para un regalo especial, el **18k** luce más. Si dudas del tamaño, elige una pieza mediana o pregúntanos." },
      { h2: "Ocasiones" },
      { ul: [
        "Cumpleaños de santo (aniversario de la coronación).",
        "Iniciación o entrega de collares.",
        "Cumpleaños, aniversarios y agradecimientos.",
      ] },
      { p: "Si quieres algo único, lo hacemos **por encargo** con el nombre del Oricha y a la medida. Escríbenos y te asesoramos." },
    ],
  },
  {
    slug: "santa-barbara-y-chango",
    title: "Santa Bárbara y Changó: fuerza, justicia y fuego",
    excerpt:
      "Santa Bárbara se sincretiza con Changó, el Oricha del fuego y la justicia. Conoce sus colores, sus símbolos y su devoción.",
    keywords: [
      "santa barbara chango",
      "chango orisha",
      "santa barbara colores",
      "atributos de chango",
      "devocion santa barbara",
    ],
    date: "2026-08-24",
    cover: "/assets/images/slider/3.jpg",
    category: "Tradición",
    readingMinutes: 4,
    cta: { label: "Ver piezas por Oricha", href: "/shop-left-sidebar" },
    blocks: [
      { p: "**Santa Bárbara** se sincretiza con **Changó**, uno de los Orichas más venerados: dueño del **fuego, el rayo, la fuerza y la justicia**." },
      { h2: "Sus colores" },
      { p: "El **rojo y el blanco** identifican a Changó: el rojo de su fuego y su poder, el blanco de su equilibrio. Estos colores aparecen en su eleke y en sus piezas." },
      { h2: "Sus símbolos" },
      { p: "Su atributo más reconocible es el **hacha doble (oshé)**, símbolo de su fuerza y de la justicia que imparte. También se le asocia con la espada y el castillo de Santa Bárbara." },
      { p: "Una pieza de Changó —un dije, una medalla o su hacha— se puede elaborar a mano en oro, respetando sus colores y su significado. La hacemos por encargo si lo prefieres." },
    ],
  },
];

/** Today as YYYY-MM-DD (UTC) — used to gate scheduled ("future-dated") posts. */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** An article is live once its publish date has arrived. Future-dated articles
 *  sit in the queue and appear on their own — one drips out each week without
 *  anyone touching the site (the pages revalidate on a timer). */
export function isPublished(a: Article): boolean {
  return a.date <= todayStr();
}

/** Published articles, newest first — for the /blog listing and the sitemap. */
export function publishedArticles(): Article[] {
  return ARTICLES.filter(isPublished).sort((x, y) => y.date.localeCompare(x.date));
}

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
