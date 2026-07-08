// Blog content for Pedro Yoruba Jewelry. Real, brand-relevant articles in Spanish
// about Yoruba/Lucumí religious jewelry — elekes, Ifá, the Orishas and gold care —
// instead of the template's generic English placeholder posts. All blog routes
// import BLOG_POSTS from here.

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  /** 2-3 paragraphs of body copy. */
  body: string[];
  image: string;
  /** Display date, e.g. "12 May, 2026". */
  date: string;
  /** Short day/month used by the `.blog-time_schedule` badge. */
  day: string;
  month: string;
  author: string;
  category: string;
  comments: number;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "que-es-un-eleke",
    title: "Qué es un eleke y cómo se lleva con respeto",
    excerpt:
      "El collar de cuentas es mucho más que un adorno: es la presencia del Orisha sobre quien lo lleva. Te explicamos su significado y su cuidado.",
    body: [
      "El eleke, también llamado collar de Orisha, es una de las primeras piezas que recibe quien se acerca a la religión Lucumí. Cada eleke se monta con las cuentas y los colores que corresponden a un Orisha —blanco para Obatalá, azul y cristal para Yemayá, amarillo y ámbar para Oshún— y, una vez consagrado, deja de ser una simple joya para convertirse en una extensión de esa energía sobre la persona.",
      "Llevar un eleke implica respeto. Tradicionalmente se retira en momentos íntimos y se cuida de no mojarlo ni golpearlo. No se presta ni se regala a la ligera, porque está hecho y consagrado para una persona en particular. Muchos eligen una versión en oro de su collar para el día a día, conservando los colores sagrados pero con la durabilidad del metal noble.",
      "En el taller montamos cada eleke a mano, cuenta por cuenta, respetando el orden y la proporción de colores de cada camino. Esa es la diferencia entre una pieza hecha por costumbre y una hecha con conocimiento: el collar no solo se ve bien, dice correctamente lo que tiene que decir.",
    ],
    image: "/assets/images/blog/medium-size/1.jpg",
    date: "14 May, 2026",
    day: "14",
    month: "May",
    author: "Pedro Olófin",
    category: "Elekes",
    comments: 6,
  },
  {
    slug: "idde-de-orula-significado",
    title: "El Idde de Orula: el hilo verde y amarillo que protege",
    excerpt:
      "Entregado por los babalawos, el idde de Orula acompaña y protege a quien lo lleva. Conoce su origen, su simbolismo y cómo cuidarlo.",
    body: [
      "El idde de Orula es la pulsera de cuentas verdes y amarillas que se recibe de manos de un babalawo y se lleva en la muñeca izquierda. El verde y el amarillo son los colores de Orunmila, el Orisha de la sabiduría y testigo de Ifá, y la pieza funciona como un pacto de protección entre la persona y ese Orisha.",
      "Por su valor, muchas personas mandan a hacer su idde en oro, alternando las cuentas verdes y amarillas en el metal para que resista el uso diario sin perder el significado. Es una pieza que se lleva toda la vida, así que conviene que esté bien construida: cierre firme, cuentas parejas y un oro de buena ley.",
      "Cuando elaboramos un idde de Orula por encargo respetamos el patrón de color tal como se entrega tradicionalmente. No es un brazalete decorativo: es un objeto religioso, y lo tratamos como tal desde el primer eslabón hasta el broche.",
    ],
    image: "/assets/images/blog/medium-size/2.jpg",
    date: "28 Abr, 2026",
    day: "28",
    month: "Abr",
    author: "Pedro Olófin",
    category: "Ifá",
    comments: 4,
  },
  {
    slug: "oro-10k-14k-18k-cual-elegir",
    title: "Oro 10k, 14k y 18k: cuál elegir para tu pieza sagrada",
    excerpt:
      "No todo el oro es igual. Te explicamos las diferencias en pureza, color, durabilidad y precio para que elijas con confianza.",
    body: [
      "El número de quilates indica cuánto oro puro contiene la aleación. El oro de 24k es oro puro, demasiado blando para el uso diario, por eso se mezcla con otros metales. El 18k (75% de oro) tiene un color cálido e intenso y es el preferido para piezas finas; el 14k (58%) equilibra belleza y resistencia; y el 10k (42%) es el más duro y económico, ideal para piezas que reciben mucho roce.",
      "Para un eleke o un idde que se va a usar todos los días, muchos eligen 14k por su balance entre durabilidad y color. Si buscas una pieza de lujo o de herencia, el 18k luce un dorado más rico. Si el presupuesto manda o la pieza va a sufrir golpes, el 10k rinde sin problema y mantiene un acabado precioso.",
      "En todos los casos trabajamos oro de ley garantizada y te explicamos las opciones antes de fundir. La mejor elección no es siempre la de más quilates, sino la que se ajusta a cómo vas a usar la pieza y por cuánto tiempo quieres conservarla.",
    ],
    image: "/assets/images/blog/medium-size/4.jpg",
    date: "09 Abr, 2026",
    day: "09",
    month: "Abr",
    author: "Pedro Olófin",
    category: "Oro",
    comments: 9,
  },
  {
    slug: "colores-de-los-orishas",
    title: "Los colores de los Orishas y su simbolismo",
    excerpt:
      "Cada Orisha tiene sus colores sagrados, presentes en sus elekes y herramientas. Una guía breve de su significado.",
    body: [
      "Los colores no son decorativos: identifican a cada Orisha y cuentan su naturaleza. Obatalá viste de blanco, color de la pureza y la paz; Elegguá combina el rojo y el negro de los caminos y las encrucijadas; Yemayá lleva el azul y el cristal del mar; Oshún el amarillo y el ámbar de la miel y el río; Changó el rojo y el blanco de la justicia y el fuego; y Orula el verde y el amarillo de la sabiduría de Ifá.",
      "Cuando ves un eleke o un dije, sus colores te dicen de inmediato a qué Orisha pertenece. Por eso es tan importante respetarlos: alterar el orden o mezclar tonos que no corresponden cambia el mensaje de la pieza. Un buen artesano conoce estos códigos y los honra.",
      "En nuestra sección \"Comprar por Orisha\" puedes explorar las piezas justamente por estos colores, para encontrar lo que acompaña tu camino. Es una forma de comprar pensada desde la tradición, no desde la moda.",
    ],
    image: "/assets/images/blog/medium-size/3.jpg",
    date: "22 Mar, 2026",
    day: "22",
    month: "Mar",
    author: "Pedro Olófin",
    category: "Orishas",
    comments: 5,
  },
  {
    slug: "opele-de-ifa-herramienta-sagrada",
    title: "El Opele de Ifá: la herramienta sagrada del babalawo",
    excerpt:
      "El opele es el instrumento con el que el babalawo consulta a Orula. Conoce su forma, su uso y por qué se elabora con tanto cuidado.",
    body: [
      "El opele es una cadena con ocho piezas que el babalawo lanza para consultar a Orula. Según como caigan —mostrando su cara o su revés— se forman los signos u odu de Ifá que guían la lectura. Es, junto con el tablero, la herramienta central del oráculo, y por eso su construcción no admite descuidos.",
      "Un opele debe estar perfectamente equilibrado: las ocho piezas iguales, bien espaciadas y con el peso justo para que la caída sea limpia. Cuando se elabora en oro o en plata, además de durar, se convierte en una pieza de gran valor que muchos babalawos conservan y heredan.",
      "Elaborar un opele por encargo es un trabajo de precisión y de respeto. No es solo joyería: es una herramienta de trabajo religioso, y cada detalle —el largo de la cadena, la forma de las piezas, el acabado— influye en cómo cumple su función.",
    ],
    image: "/assets/images/blog/medium-size/1.jpg",
    date: "05 Mar, 2026",
    day: "05",
    month: "Mar",
    author: "Pedro Olófin",
    category: "Ifá",
    comments: 7,
  },
  {
    slug: "como-cuidar-tus-piezas-de-oro",
    title: "Cómo cuidar tus piezas de oro para que duren generaciones",
    excerpt:
      "Con hábitos sencillos, tu oro conserva su brillo toda la vida. Estos son los cuidados que recomendamos en el taller.",
    body: [
      "El oro es noble pero no indestructible. La regla de oro es sencilla: que tu pieza sea lo último que te pongas y lo primero que te quites. Así evitas el contacto con perfumes, cremas y productos de limpieza, que con el tiempo opacan el brillo y debilitan los broches.",
      "Para limpiarla en casa basta agua tibia con un poco de jabón neutro y un cepillo suave; sécala bien con un paño de algodón. Guarda cada pieza por separado, en una bolsa de tela, para que las cadenas no se enreden ni se rayen entre sí. Si una pieza recibe mucho uso, una revisión de broches y engastes cada cierto tiempo evita pérdidas.",
      "Con estos cuidados, un eleke, un idde o un dije en oro no solo te acompaña a ti: se convierte en una herencia que pasa a las siguientes generaciones conservando su fuerza y su brillo.",
    ],
    image: "/assets/images/blog/medium-size/2.jpg",
    date: "18 Feb, 2026",
    day: "18",
    month: "Feb",
    author: "Pedro Olófin",
    category: "Cuidado",
    comments: 3,
  },
];

// Small thumbnails for the sidebar "Recent Post" widget.
export const RECENT_POST_THUMBS = [
  "/assets/images/product/small-size/2-1.jpg",
  "/assets/images/product/small-size/2-2.jpg",
  "/assets/images/product/small-size/2-3.jpg",
];
