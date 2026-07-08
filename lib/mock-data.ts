import type { Product } from "./types";
import { money } from "./utils";

// Full catalogue generated from the live Pedro Yoruba Jewelry Shopify store
// (pedroyorubajewelry.myshopify.com/products.json). 150 products with real
// photos from Shopify's CDN (HEIC auto-served as JPEG, width-optimised). Categories are
// derived from the product title for the shop filters.

const C = "USD";

interface Seed {
  id: string; handle: string; title: string; description: string;
  price: number; compare: number | null; images: string[];
  rating: number; badge: string | null; available: boolean; tags: string[];
  variants: { id: string; title: string; price: number; available: boolean }[];
}

const SEEDS: Seed[] = [
  {
    "id": "pyj-9217539211486",
    "handle": "opele-de-ifa-7",
    "title": "Opele de Ifa",
    "description": "10k 26”de Largo 14720",
    "price": 4150,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0228.heic?v=1778862250&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0228.heic?v=1778862250&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Opele",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48248839438558",
        "title": "Default Title",
        "price": 4150,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9217508966622",
    "handle": "opele-de-ifa-6",
    "title": "Opele de ifa",
    "description": "10k 26”de Largo 14720",
    "price": 4485,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0227.heic?v=1778861502&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0227.heic?v=1778861502&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Opele",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48248800182494",
        "title": "Default Title",
        "price": 4485,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9217249149150",
    "handle": "set-de-herramientas-para-oshun-acero",
    "title": "Herramientas de oshun acero inoxidable",
    "description": "Acero inoxidable garantia de por vida",
    "price": 60,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/DD675DDF-843B-437E-8ED1-2958FAF726D0.jpg?v=1778854672&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/DD675DDF-843B-437E-8ED1-2958FAF726D0.jpg?v=1778854672&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Herramientas",
      "Oshún"
    ],
    "variants": [
      {
        "id": "pyj-v-48248381505758",
        "title": "Default Title",
        "price": 60,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9212834775262",
    "handle": "dije-de-eleggua-para-cargar-10k",
    "title": "Dije de Eleggua Para cargar 10k",
    "description": "10k Piedras Zirconia 1¨x13mm",
    "price": 1200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/2CEF71A4-3573-4E47-A7D1-6A131E5CF5A1.jpg?v=1778611256&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/F83D2340-AB68-4862-AA1A-1F7E5B5EB24A.jpg?v=1778611256&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/DE7AE4EC-1E02-402B-8769-C6FAF67136A9.jpg?v=1778611256&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/8E93EFDC-F293-4BAE-A222-A67D39B178D0.jpg?v=1778611256&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Dijes",
      "Elegguá"
    ],
    "variants": [
      {
        "id": "pyj-v-48235554341086",
        "title": "Default Title",
        "price": 1200,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9212770255070",
    "handle": "idde-de-orula-10k",
    "title": "Idde de Orula 10k",
    "description": "10k Con cuentas Disponible para todos los Orichas por Orden",
    "price": 4850,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0217.heic?v=1778607993&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0219.heic?v=1778608013&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0218.heic?v=1778607965&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48235088085214",
        "title": "7.5",
        "price": 4850,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9212690366686",
    "handle": "idde-de-acero-destapado",
    "title": "Idde de acero destapado",
    "description": "Acero inoxidable Con Cuentas",
    "price": 30,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0216.heic?v=1778601232&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0214.heic?v=1778601273&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48234489544926",
        "title": "8",
        "price": 30,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9203875512542",
    "handle": "anillo-de-ifa-2",
    "title": "Anillo de Ifa",
    "description": "10k Plata 925 en parte superior Piedra turquesa Echo por encargo",
    "price": 1700,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0174.heic?v=1778012495&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0175.heic?v=1778012536&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0173.heic?v=1778012575&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0172.heic?v=1778012609&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Anillos",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48210351423710",
        "title": "Default Title",
        "price": 1700,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9210046218462",
    "handle": "dije-de-rana",
    "title": "Dije de Rana",
    "description": "10k Piedras de Zirconia 1\"x30 mm 14702",
    "price": 2000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0212.heic?v=1778258635&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0213.heic?v=1778258635&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0211.heic?v=1778258635&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Dijes"
    ],
    "variants": [
      {
        "id": "pyj-v-48224256393438",
        "title": "Default Title",
        "price": 2000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9210043039966",
    "handle": "idde-de-lujo-13",
    "title": "Idde de lujo",
    "description": "10k Piedras en Zirconia 13820",
    "price": 4600,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0209.heic?v=1778257391&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0209.heic?v=1778257391&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48224249807070",
        "title": "7.5",
        "price": 4600,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9210041401566",
    "handle": "idde-de-lujo-12",
    "title": "Idde de Lujo",
    "description": "10k Piedras Zirconia Size 18. 61mm interior 13647",
    "price": 5900,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0208.heic?v=1778257121&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0207.heic?v=1778257121&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0206.heic?v=1778257121&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48224238862558",
        "title": "Default Title",
        "price": 5900,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9210037895390",
    "handle": "idde-de-lujo-11",
    "title": "Idde de Lujo",
    "description": "10k Piedras es Zirconia 14216",
    "price": 3600,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0205.heic?v=1778255922&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0205.heic?v=1778255922&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48224219693278",
        "title": "7",
        "price": 3600,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9210033242334",
    "handle": "idde-de-lujo-10",
    "title": "Idde de lujo",
    "description": "10k Piedras Zirconia 13233",
    "price": 3865,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0204.heic?v=1778255250&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0204.heic?v=1778255250&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48224189481182",
        "title": "7.5",
        "price": 3865,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9210029441246",
    "handle": "idde-de-lujo-9",
    "title": "Idde de Lujo",
    "description": "10k Piedras Zirconia",
    "price": 4000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0203.heic?v=1778254549&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0203.heic?v=1778254549&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48224177225950",
        "title": "8.5",
        "price": 4000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9208296407262",
    "handle": "idde-destapado-2",
    "title": "Idde destapado",
    "description": "10k Con cuentas",
    "price": 1250,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0202.heic?v=1778187240&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0202.heic?v=1778187240&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48221392601310",
        "title": "7.5",
        "price": 1250,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9207999430878",
    "handle": "idde-de-orula-1",
    "title": "Idde de Orula",
    "description": "10k 14417 Modelo pulso de hueso",
    "price": 2500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0192.heic?v=1778169863&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0192.heic?v=1778169863&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48220350906590",
        "title": "Default Title",
        "price": 2500,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9207994613982",
    "handle": "idde-de-lujo-8",
    "title": "Idde de lujo",
    "description": "10k Zirconia 13307",
    "price": 2800,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0191.heic?v=1778169478&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0191.heic?v=1778169478&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48220349006046",
        "title": "8",
        "price": 2800,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9207975444702",
    "handle": "sin-titulo-7may_11-32",
    "title": "Idde de lujo",
    "description": "10k Piedras zirconia 13350",
    "price": 2250,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/FullSizeRender_f692c2b7-3ae7-41b2-9073-13abb8e2f11c.heic?v=1778168180&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/FullSizeRender_c1065175-8ae0-442c-9888-55c2252d7be6.heic?v=1778168180&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48220291924190",
        "title": "7.5",
        "price": 2250,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9207962468574",
    "handle": "idde-de-lujo-para-mujer",
    "title": "Idde de lujo para Mujer",
    "description": "10k Piedras en zirconia 7\"x2.7mm 14633",
    "price": 2300,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/9D57462F-3815-4AA7-8BEA-3426802171CC.jpg?v=1778166807&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/4733E304-0217-4254-9626-4431CD1BFC30.jpg?v=1778166944&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48220246343902",
        "title": "Default Title",
        "price": 2300,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9206646440158",
    "handle": "sin-titulo-6may_16-38",
    "title": "Idde de Lujo",
    "description": "10k 7.5¨x7.7mm 14206",
    "price": 5000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/D61C8DF3-1182-4384-B7BE-42FBC447821E.jpg?v=1778100020&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/D61C8DF3-1182-4384-B7BE-42FBC447821E.jpg?v=1778100020&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48216837357790",
        "title": "Default Title",
        "price": 5000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9206645653726",
    "handle": "idde-de-lujo-7",
    "title": "Idde de Lujo",
    "description": "10k 63x4.8mm Piedras Zirconia 14502",
    "price": 3025,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0184.heic?v=1778099600&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0184.heic?v=1778099600&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48216835784926",
        "title": "Default Title",
        "price": 3025,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9206640443614",
    "handle": "idde-de-lujo-6",
    "title": "Idde de Lujo",
    "description": "10k Piedras de zirconia 14559",
    "price": 4500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0181.heic?v=1778097766&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0183.heic?v=1778098058&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48216824676574",
        "title": "7.5",
        "price": 4500,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9206634315998",
    "handle": "idde-de-lujo-5",
    "title": "Idde de Lujo",
    "description": "10k Piedras Zirconia 7¨x7mm 14587",
    "price": 3000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0180.heic?v=1778096478&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0180.heic?v=1778096478&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48216804491486",
        "title": "Default Title",
        "price": 3000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9206632120542",
    "handle": "idde-de-lujo-4",
    "title": "Idde de lujo",
    "description": "10k Piedras Zirconia 12983",
    "price": 6000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0179.heic?v=1778095833&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0178.heic?v=1778095833&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48216798462174",
        "title": "Default Title",
        "price": 6000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9206613704926",
    "handle": "medalla-de-oshun",
    "title": "Medalla de Oshun",
    "description": "Oro 10k 20mm 14694",
    "price": 450,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0176.heic?v=1778093157&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0177.heic?v=1778093157&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Medallas",
      "Oshún"
    ],
    "variants": [
      {
        "id": "pyj-v-48216758321374",
        "title": "Default Title",
        "price": 450,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9203787956446",
    "handle": "idde-de-obbatala-1",
    "title": "Idde de Obbatala",
    "description": "Plata 925 Piedras zirconia",
    "price": 200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0170.heic?v=1777999947&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0170.heic?v=1777999947&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-48210061557982",
        "title": "6.5",
        "price": 200,
        "available": true
      },
      {
        "id": "pyj-v-48210061590750",
        "title": "7",
        "price": 220,
        "available": true
      },
      {
        "id": "pyj-v-48210061623518",
        "title": "8",
        "price": 260,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9203772883166",
    "handle": "idde-de-oshun",
    "title": "Idde de Oshun",
    "description": "Plata 925 Piedras zirconia",
    "price": 200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/F329D98D-A620-4519-BF41-20396F1AAB1B.jpg?v=1777998851&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/F329D98D-A620-4519-BF41-20396F1AAB1B.jpg?v=1777998851&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde",
      "Oshún"
    ],
    "variants": [
      {
        "id": "pyj-v-48209988649182",
        "title": "6.5",
        "price": 200,
        "available": true
      },
      {
        "id": "pyj-v-48209988681950",
        "title": "7",
        "price": 220,
        "available": true
      },
      {
        "id": "pyj-v-48209988714718",
        "title": "7.5",
        "price": 240,
        "available": true
      },
      {
        "id": "pyj-v-48209988747486",
        "title": "8",
        "price": 260,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9203770196190",
    "handle": "idde-de-yemaya",
    "title": "Idde de Yemaya",
    "description": "Plata 925 Piedras zirconia",
    "price": 200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0168.heic?v=1777998051&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0168.heic?v=1777998051&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde",
      "Yemayá"
    ],
    "variants": [
      {
        "id": "pyj-v-48209966039262",
        "title": "6.5",
        "price": 200,
        "available": true
      },
      {
        "id": "pyj-v-48209966072030",
        "title": "7",
        "price": 220,
        "available": true
      },
      {
        "id": "pyj-v-48209966104798",
        "title": "7.5",
        "price": 240,
        "available": true
      },
      {
        "id": "pyj-v-48209974100190",
        "title": "8",
        "price": 260,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9203768066270",
    "handle": "idde-de-orula",
    "title": "Idde de Orula",
    "description": "Plata 925 Piedras zirconia",
    "price": 200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0167.heic?v=1777997693&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0167.heic?v=1777997693&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48209958240478",
        "title": "6.5",
        "price": 200,
        "available": true
      },
      {
        "id": "pyj-v-48209958273246",
        "title": "7",
        "price": 220,
        "available": true
      },
      {
        "id": "pyj-v-48209958306014",
        "title": "8",
        "price": 260,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9203760726238",
    "handle": "idde-de-shango",
    "title": "Idde de Shango",
    "description": "Plata925 Piedras de zirconia",
    "price": 200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0166.heic?v=1777997354&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0166.heic?v=1777997354&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde",
      "Changó"
    ],
    "variants": [
      {
        "id": "pyj-v-48209949032670",
        "title": "6.5",
        "price": 200,
        "available": true
      },
      {
        "id": "pyj-v-48209949065438",
        "title": "7",
        "price": 220,
        "available": true
      },
      {
        "id": "pyj-v-48209949098206",
        "title": "8",
        "price": 260,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9203723337950",
    "handle": "idde-de-flores",
    "title": "Idde de Eleggua",
    "description": "Plata 925 Piedras zirconia",
    "price": 200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0165.heic?v=1777996917&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0165.heic?v=1777996917&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde",
      "Elegguá"
    ],
    "variants": [
      {
        "id": "pyj-v-48209938284766",
        "title": "6.5",
        "price": 200,
        "available": true
      },
      {
        "id": "pyj-v-48209938317534",
        "title": "7",
        "price": 220,
        "available": true
      },
      {
        "id": "pyj-v-48209938350302",
        "title": "8",
        "price": 260,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9202740723934",
    "handle": "idde-destapado-1",
    "title": "Idde destapado",
    "description": "10k Con cuentas",
    "price": 1600,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0161.heic?v=1777927476&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0162.heic?v=1777927476&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48206027948254",
        "title": "Default Title",
        "price": 1600,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9202672271582",
    "handle": "opele-de-ifa-5",
    "title": "Opele de ifa",
    "description": "10k 40”de Largo 13218",
    "price": 7200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0160.heic?v=1777923880&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0160.heic?v=1777923880&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Opele",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48205762232542",
        "title": "Default Title",
        "price": 7200,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9202667159774",
    "handle": "opele-de-ifa-4",
    "title": "Opele de ifa",
    "description": "10k 29 de Largo",
    "price": 3500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0159.heic?v=1777923501&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0159.heic?v=1777923501&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Opele",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48205751091422",
        "title": "Default Title",
        "price": 3500,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9202651824350",
    "handle": "opele-de-ifa-3",
    "title": "Opele de ifa",
    "description": "10k 29.5”De Largo 10047",
    "price": 4400,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0158.heic?v=1777922304&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0158.heic?v=1777922304&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Opele",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48205677461726",
        "title": "Default Title",
        "price": 4400,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9202630525150",
    "handle": "opele-de-ifa-2",
    "title": "Opele de ifa",
    "description": "10k 34”de Largo 14239",
    "price": 8000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0156.heic?v=1777920626&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0156.heic?v=1777920626&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Opele",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48205550977246",
        "title": "Default Title",
        "price": 8000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9202583339230",
    "handle": "opele-de-ifa-1",
    "title": "Opele de ifa",
    "description": "10k 36 de largo 13434",
    "price": 8825,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0155.heic?v=1777918195&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0155.heic?v=1777918195&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Opele",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48205270941918",
        "title": "Default Title",
        "price": 8825,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9202510332126",
    "handle": "opele-de-ifa",
    "title": "Opele de ifa",
    "description": "10k 30 de Largo 13500",
    "price": 7150,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0153.heic?v=1778251419&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0153.heic?v=1778251419&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Opele",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48204973899998",
        "title": "Default Title",
        "price": 7150,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9202469142750",
    "handle": "pulsera-de-plata",
    "title": "Pulsera de plata",
    "description": "Plata925 Para niños",
    "price": 190,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/E6AD060E-772D-4E4F-AD49-5D6E61425802.jpg?v=1777911207&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/06CB009D-70ED-4DE6-9B11-2BC55083780E.jpg?v=1777911207&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Pulseras"
    ],
    "variants": [
      {
        "id": "pyj-v-48204897353950",
        "title": "Default Title",
        "price": 190,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9197498466526",
    "handle": "medalla-de-santa-barbara",
    "title": "Medalla de Santa Bárbara",
    "description": "10k piedras en zirconia 0,62x54.96",
    "price": 3800,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0144.heic?v=1777669314&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0145.heic?v=1777669348&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Medallas",
      "Changó"
    ],
    "variants": [
      {
        "id": "pyj-v-48189334356190",
        "title": "Default Title",
        "price": 3800,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9197493256414",
    "handle": "idde-destapado",
    "title": "Idde Destapado",
    "description": "Plata 925’ bañada en oro",
    "price": 200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0143.heic?v=1777667022&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0143.heic?v=1777667022&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48189314236638",
        "title": "6.5",
        "price": 200,
        "available": true
      },
      {
        "id": "pyj-v-48189314269406",
        "title": "7",
        "price": 220,
        "available": true
      },
      {
        "id": "pyj-v-48189314302174",
        "title": "7.5",
        "price": 240,
        "available": true
      },
      {
        "id": "pyj-v-48189314334942",
        "title": "8",
        "price": 260,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9197453902046",
    "handle": "pulso-de-obbatala-1",
    "title": "Pulso de Obbatala",
    "description": "Plata 925 Para niños",
    "price": 90,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0140.heic?v=1777656290&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0142.heic?v=1777656685&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Pulseras",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-48224067682526",
        "title": "5",
        "price": 90,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9197430341854",
    "handle": "pulso-de-obbatala",
    "title": "Pulso de Obbatala",
    "description": "Plata 925 Ajustable",
    "price": 250,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0139.heic?v=1777651700&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0138.heic?v=1777651700&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": false,
    "tags": [
      "Pulseras",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-48188981706974",
        "title": "Default Title",
        "price": 250,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-9196917686494",
    "handle": "cadenas-con-letras",
    "title": "Cadenas con letras",
    "description": "10k ‼️Especial por el día de las madres‼️ Varias letras disponibles",
    "price": 170,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0137.heic?v=1777583003&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0136.heic?v=1777583004&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Cadenas"
    ],
    "variants": [
      {
        "id": "pyj-v-48187100070110",
        "title": "Default Title",
        "price": 170,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9196746178782",
    "handle": "azabache-12mm",
    "title": "Azabache 12mm",
    "description": "10k",
    "price": 60,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/FullSizeRender_8c80b0c1-23a3-4125-9e4e-3c154934d1bb.heic?v=1777574855&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/FullSizeRender_8c80b0c1-23a3-4125-9e4e-3c154934d1bb.heic?v=1777574855&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Azabaches"
    ],
    "variants": [
      {
        "id": "pyj-v-48186579517662",
        "title": "Default Title",
        "price": 60,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9195108630750",
    "handle": "pulso-de-lujo",
    "title": "Pulso de Lujo",
    "description": "10k Piedras de zirconia",
    "price": 5450,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0129.heic?v=1777494917&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0128.heic?v=1777494917&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Pulseras"
    ],
    "variants": [
      {
        "id": "pyj-v-48182860021982",
        "title": "7.5",
        "price": 5450,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9195088183518",
    "handle": "idde-de-lujo-3",
    "title": "Idde de Lujo",
    "description": "10k Con zirconia 14088",
    "price": 6300,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/E54288E6-C33C-4122-9AC9-5DFC899B160F.jpg?v=1777494431&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/3307F16F-4A8B-49B1-AE37-4C5BB9F95E5A.jpg?v=1777494021&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48182843211998",
        "title": "8",
        "price": 6300,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9195078549726",
    "handle": "idde-doble",
    "title": "Idde doble",
    "description": "Con cuentas 10k 10112",
    "price": 4700,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0123.heic?v=1777493114&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0124.heic?v=1777493114&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48182752608478",
        "title": "8",
        "price": 4700,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9195075829982",
    "handle": "idde-de-obbatala",
    "title": "Idde de Obbatala",
    "description": "14k Con zirconia",
    "price": 2700,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-8560.heic?v=1777482486&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-8559.heic?v=1777482486&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-48182728098014",
        "title": "7",
        "price": 2700,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9194990207198",
    "handle": "idde-de-lujo-2",
    "title": "Idde de lujo",
    "description": "10k Piedras de zirconia 13530",
    "price": 7200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0114.heic?v=1777396321&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0115.heic?v=1777479663&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48181205729502",
        "title": "8",
        "price": 7200,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9194974937310",
    "handle": "idde-de-elefante",
    "title": "Idde de elefante",
    "description": "10k Con cuentas 14645",
    "price": 2900,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/FullSizeRender_917ca581-7b0b-4d0c-920d-cb400035ddbe.heic?v=1777478274&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/FullSizeRender_617395fa-a638-4304-b3cc-e8990d6a997e.heic?v=1777478735&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48181155528926",
        "title": "7",
        "price": 2900,
        "available": true
      },
      {
        "id": "pyj-v-48181155561694",
        "title": "7.5",
        "price": 3100,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9189297750238",
    "handle": "idde-semi-tapado",
    "title": "Idde semi-tapado",
    "description": "Oro 10k con cuentas interiores 8x5mm 14323",
    "price": 2260,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/E3018C6C-B08D-4628-8221-9852359B9A6D.jpg?v=1777475678&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/82414D8D-8E8A-437F-BC70-969A3F071316.jpg?v=1777475708&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48157151887582",
        "title": "8",
        "price": 2260,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9189287919838",
    "handle": "idde-tapado",
    "title": "Idde tapado",
    "description": "10k Con cuentas 7.5 x 5mm #14603",
    "price": 2100,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/2E939A4B-1D44-43A7-BBE3-11E3A272E367.jpg?v=1777052886&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/F074268E-B020-4DAD-B393-1DF9986D8779.jpg?v=1777052886&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48157157916894",
        "title": "7.5",
        "price": 2100,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9189277335774",
    "handle": "idde-destapado-de-plata",
    "title": "Idde de plata",
    "description": "Plata 925 #13772 Cierre con zirconia",
    "price": 370,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0101.heic?v=1779152883&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0102.heic?v=1777910124&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48157056663774",
        "title": "7.5",
        "price": 370,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9189194203358",
    "handle": "pulsos-flexible",
    "title": "Pulsos flexibles",
    "description": "Plata 925 bañada en oro Piedras de zirconia",
    "price": 200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0093.heic?v=1776891112&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0092.heic?v=1776891112&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/4D794E9B-FD1F-4AA8-8C3B-641C97964212.jpg?v=1777044837&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Pulseras"
    ],
    "variants": [
      {
        "id": "pyj-v-48156881420510",
        "title": "6",
        "price": 200,
        "available": true
      },
      {
        "id": "pyj-v-48156881453278",
        "title": "6.5",
        "price": 220,
        "available": true
      },
      {
        "id": "pyj-v-48156919333086",
        "title": "8",
        "price": 270,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9185598374110",
    "handle": "azabache-para-ninos",
    "title": "Ojos de Santa Lucía",
    "description": "10k",
    "price": 500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/8778E18B-FBF4-4953-902F-85C4C301A2D5.jpg?v=1777573832&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/8778E18B-FBF4-4953-902F-85C4C301A2D5.jpg?v=1777573832&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Otros"
    ],
    "variants": [
      {
        "id": "pyj-v-48137458712798",
        "title": "Default Title",
        "price": 500,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9185573961950",
    "handle": "azabache-para-nino",
    "title": "Azabache para niño",
    "description": "Oro 10k 20mm 14646",
    "price": 550,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0082.heic?v=1777329571&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0079.heic?v=1777329590&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Azabaches"
    ],
    "variants": [
      {
        "id": "pyj-v-48137377317086",
        "title": "Default Title",
        "price": 550,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9185555808478",
    "handle": "idde-de-lujo-1",
    "title": "Idde de lujo",
    "description": "Oro 10k Con circonia",
    "price": 3200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0078.heic?v=1776799435&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0077.heic?v=1776799435&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-48137364668638",
        "title": "7",
        "price": 3200,
        "available": true
      },
      {
        "id": "pyj-v-48137364701406",
        "title": "7.5",
        "price": 3400,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9185348878558",
    "handle": "anillo-de-ifa-1",
    "title": "Anillo de IFA",
    "description": "Plata 925 Personalizado",
    "price": 700,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/58386A1B-19D0-41C1-BDBB-60FD3879F154.jpg?v=1776791229&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/63AD3D31-45D7-45A0-ACC4-AAC02676F3A0.jpg?v=1776791262&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/D4687E9F-B056-4843-B6AC-131A9008F9D4.jpg?v=1776791229&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Anillos",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48135892435166",
        "title": "Default Title",
        "price": 700,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9185321058526",
    "handle": "pulsos-de-yemaya",
    "title": "Pulsos de Yemaya",
    "description": "Plata 925 75mm x 2.6mm",
    "price": 900,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/594A2A84-D17B-4082-B567-9E9F3373E98A.jpg?v=1777429513&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/594A2A84-D17B-4082-B567-9E9F3373E98A.jpg?v=1777429513&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Pulseras",
      "Yemayá"
    ],
    "variants": [
      {
        "id": "pyj-v-48135813071070",
        "title": "Default Title",
        "price": 900,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9184866861278",
    "handle": "pulsos-de-obbatala-1",
    "title": "Pulsos de Obbatala",
    "description": "En Plata De bolas 7x2.9",
    "price": 0,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/3F91A7BA-7186-4725-9AC3-7FCF311E4C39.jpg?v=1777430735&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/6635CFBD-6642-4FE0-8F25-1BF244852448.jpg?v=1777430800&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/DD4FF7B7-304D-42C8-866B-2AF436F2E005.jpg?v=1777430841&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Pulseras",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-48134361022686",
        "title": "6.5",
        "price": 0,
        "available": true
      },
      {
        "id": "pyj-v-48134361055454",
        "title": "7",
        "price": 0,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9184840679646",
    "handle": "pulsos-de-obbatala",
    "title": "Pulsos de Obbatala",
    "description": "Plata 925 Pauye de Obbatala",
    "price": 410,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/C261C67B-173D-4603-8ADD-14DD96367AD6.jpg?v=1777430901&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/CE2C9345-3B21-41D8-A497-399D92DAEDD0.jpg?v=1777430949&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Pulseras",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-48134291325150",
        "title": "6.5",
        "price": 410,
        "available": true
      },
      {
        "id": "pyj-v-48134291357918",
        "title": "7",
        "price": 420,
        "available": true
      },
      {
        "id": "pyj-v-48134311968990",
        "title": "7.5",
        "price": 430,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9184729104606",
    "handle": "pulso-de-flores-de-todos-los-orichas",
    "title": "Pulsos de flores de todos los orichas",
    "description": "Plata 925 Piedras sirconia Piedras naturales Todos los colores disponibles para todos los santos Se puede personalizar al gusto del cliente",
    "price": 200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0035.heic?v=1776712419&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-0033.heic?v=1776712419&width=800"
    ],
    "rating": 5,
    "badge": "Nuevo",
    "available": true,
    "tags": [
      "Pulseras"
    ],
    "variants": [
      {
        "id": "pyj-v-48134175129822",
        "title": "6.5",
        "price": 200,
        "available": true
      },
      {
        "id": "pyj-v-48134175162590",
        "title": "7",
        "price": 220,
        "available": true
      },
      {
        "id": "pyj-v-48134175195358",
        "title": "7.5",
        "price": 240,
        "available": true
      },
      {
        "id": "pyj-v-48134175228126",
        "title": "8",
        "price": 260,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8273822351582",
    "handle": "anillo-de-orula-10k",
    "title": "Anillo de Orula 10k",
    "description": "10k. Size 8. Piedras zirconias SIZE 11 SIZE 12/5",
    "price": 870,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240205-113906.jpg?v=1707151625&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240205-114004.jpg?v=1707151624&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240205-114148.jpg?v=1707151624&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Anillos",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-48023874633950",
        "title": "11",
        "price": 870,
        "available": false
      },
      {
        "id": "pyj-v-48023905566942",
        "title": "12/5",
        "price": 970,
        "available": false
      },
      {
        "id": "pyj-v-48023925653726",
        "title": "8",
        "price": 730,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8273815437534",
    "handle": "anillo-de-obbatala-10k",
    "title": "Anillo de Obbatalá 10k",
    "description": "10k. Size 8. Piedras zirconias JB2",
    "price": 730,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240205-112051.jpg?v=1707150334&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240205-112149.jpg?v=1707150334&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240205-112237.jpg?v=1707150335&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Anillos",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-44759973789918",
        "title": "Default Title",
        "price": 730,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-9134342144222",
    "handle": "herramientas-de-oshun-remos-acero",
    "title": "Herramientas de Oshun remos acero",
    "description": "Remos de Oshun acero inoxidable con baño en oro 14k",
    "price": 60,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/DD675DDF-843B-437E-8ED1-2958FAF726D0.jpg?v=1778854672&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/DD675DDF-843B-437E-8ED1-2958FAF726D0.jpg?v=1778854672&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Herramientas",
      "Oshún"
    ],
    "variants": [
      {
        "id": "pyj-v-47936063373534",
        "title": "Default Title",
        "price": 60,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9134341980382",
    "handle": "herramientas-de-obatala",
    "title": "Herramientas de Obatala",
    "description": "Herramientas de acero inoxidable garantía de por vida",
    "price": 60,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/B9328704-2958-44E9-84C4-B9F46B5A3A81.jpg?v=1780367162&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/B9328704-2958-44E9-84C4-B9F46B5A3A81.jpg?v=1780367162&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Herramientas",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-47936063078622",
        "title": "Default Title",
        "price": 60,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9134341226718",
    "handle": "herramientas-de-olokun",
    "title": "Herramientas de olokun",
    "description": "Herramientas de acero inoxidable garantía de por vida",
    "price": 90,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/5B1FD3BD-A819-4138-AC13-456A00512E37.jpg?v=1780367102&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/5B1FD3BD-A819-4138-AC13-456A00512E37.jpg?v=1780367102&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Herramientas"
    ],
    "variants": [
      {
        "id": "pyj-v-47936061964510",
        "title": "Default Title",
        "price": 90,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9134339915998",
    "handle": "herramientas-de-yemaya-acero",
    "title": "Herramientas de Yemaya acero",
    "description": "Herramientas de acero inoxidable garantía de por vida",
    "price": 80,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/8EC85657-1249-4C0B-B1D5-AB78B9468730.jpg?v=1772107737&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/8EC85657-1249-4C0B-B1D5-AB78B9468730.jpg?v=1772107737&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Herramientas",
      "Yemayá"
    ],
    "variants": [
      {
        "id": "pyj-v-47936058851550",
        "title": "Default Title",
        "price": 80,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9048691081438",
    "handle": "anillo-de-ifa",
    "title": "Anillo de ifa",
    "description": "Anillo de ifa sólido solo por orden el cliente puede personalizar su anillo su gusto el precio no cambia estos precio es medida #9 #10 #11 las piedras son Sirconia para más detalles llamar o escribir 305-522-8490 305-901-9377",
    "price": 4500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-9271.heic?v=1762273093&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-9269.heic?v=1762273093&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-9267.heic?v=1762273093&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-9270.heic?v=1762273093&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-9273.heic?v=1762273093&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-9272.heic?v=1762273093&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-9268.heic?v=1762273093&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Anillos",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-47655173783774",
        "title": "Oro 14k",
        "price": 4500,
        "available": true
      },
      {
        "id": "pyj-v-47655173816542",
        "title": "Oro 10k",
        "price": 3500,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9018781466846",
    "handle": "anillo-ifa-plata-con-oro",
    "title": "Anillo ifa plata con oro",
    "description": "Anillo ifa sólido plata con los signo y figura en oro 10k 25mm 25 gramo #10 Los anillo se hacen por orden",
    "price": 1300,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/5906456A-79F7-445E-BEAC-C7617D1066ED.jpg?v=1758649105&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/17A12C25-704B-49C3-A106-A5E1D394A7FB.jpg?v=1758649105&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/1DCF7FC4-30B4-46E6-B532-869C12CC4C47.jpg?v=1758649105&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/4CDF8641-B655-4CDC-84F0-0720E2242F34.jpg?v=1758649105&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Anillos",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-47552820838622",
        "title": "Default Title",
        "price": 1300,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9018780516574",
    "handle": "anillo-ifa-10k-4",
    "title": "Anillo ifa 10k",
    "description": "Anillo personalizado en 10k solido 25mm #11.5 los anillos varían los precios depende medidas y peso por orden de 1 mes los diseños están Incluidos en el costo del anillo",
    "price": 3750,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/58163C84-640F-4A47-9E8E-DC3D6DC0399F.jpg?v=1758648945&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/A39BD96B-49FD-49EE-A147-21B7DED51F9F.jpg?v=1758648945&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/42CFA80E-179C-4CA8-973B-01AE23FD4BF9.jpg?v=1758648945&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/687667B8-66BC-418C-A771-C4BD1080634C.jpg?v=1758648945&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/52B1B3C9-0325-4B25-A56E-5D54CA9C8B4E.jpg?v=1758648945&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Anillos",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-47552818151646",
        "title": "Default Title",
        "price": 3750,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9018773831902",
    "handle": "anillo-ifa-10k-3",
    "title": "Ánillo ifa 14k",
    "description": "Anillo ifa 10k solido 25 25mm #9 los precios varían depende medidas los diseños están incluidos en los precios los anillos son por orden",
    "price": 4000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/5C1F7D49-5BFC-4965-BA25-CE32E2D772E8.jpg?v=1758647242&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/36CA97F8-27C4-4063-A09B-31611AF192E1.jpg?v=1758647242&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/DCF26678-53C6-498A-82CF-5913E16486B5.jpg?v=1758647245&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/928D6305-786E-4867-A507-DF6EE904AE70.jpg?v=1758647242&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/1ED54308-CC0F-45A3-B3C5-15D3F39C6751.jpg?v=1758647243&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/C2AF1247-4CB0-437B-A01A-16F72CA36A51.jpg?v=1758647242&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Anillos",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-47552794460382",
        "title": "Default Title",
        "price": 4000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9018753810654",
    "handle": "anillo-ifa-10k-2",
    "title": "Anillo ifa 10k",
    "description": "Anillo ifa 10k #10 20mm 14gm costo varía de peso y diseño lo personalizamos a el gusto del cliente por orden",
    "price": 2000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/11DBE9BE-9FD7-492B-9197-726E8B8C7F50.jpg?v=1758645411&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/B51E8560-3263-4E77-BF58-0624A4A0A413.jpg?v=1758645412&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/947A80D0-8088-4895-AD05-2046BCE4A477.jpg?v=1758645411&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Anillos",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-47552707428574",
        "title": "Default Title",
        "price": 2000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9018753253598",
    "handle": "anillo-obatala-14k",
    "title": "Anillo Obatala 14k",
    "description": "Anillo Obatala 14k #12 28.4 gramo los precios varían en el peso y medidas y oro por orden de cualquier Oricha 20mm",
    "price": 4600,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/70ACEA35-DFDD-4734-88C7-D2408DEC811A.jpg?v=1758645167&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/D30CC778-4FC2-4859-8C66-DA1506651C32.jpg?v=1758645167&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/41D1D3B4-E037-4456-9BB4-9CD91B9C25C7.jpg?v=1758645168&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/A0CDBF35-B107-41A4-A7F4-63515850FC14.jpg?v=1758645167&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Anillos",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-47552706281694",
        "title": "Default Title",
        "price": 4600,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9005020315870",
    "handle": "anillo-de-ifa-10k",
    "title": "Ánillo de ifa 10k",
    "description": "Anillo ifa sólido 10k 22mm #12 por orden con el signo del cliente #10287",
    "price": 3000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6826.heic?v=1757363346&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6825.heic?v=1757363346&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6824.heic?v=1757363346&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6822.heic?v=1757363346&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6821.heic?v=1757363346&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6823.heic?v=1757363346&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6820.heic?v=1757363346&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Anillos",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-47517493690590",
        "title": "Default Title",
        "price": 3000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9005019300062",
    "handle": "anillo-ifa-10k-1",
    "title": "Anillo ifa 10k",
    "description": "Anillo sólido 10k por orden 36 Gm #14 24mm #13575",
    "price": 5000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6819.heic?v=1757363208&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6818.heic?v=1757363208&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6817.heic?v=1757363208&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6816.heic?v=1757363208&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6815.heic?v=1757363208&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6814.heic?v=1757363208&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-6813.heic?v=1757363208&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Anillos",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-47517489168606",
        "title": "Default Title",
        "price": 5000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-9005019037918",
    "handle": "anillo-ifa-10k",
    "title": "Anillo ifa 10k",
    "description": "Anillo ifa sólido 10k 25 Gm #10.5 22mm por orden su signo #14069",
    "price": 3625,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/099FC8A8-41AD-46DA-B25B-8146B5C417F8.jpg?v=1757362983&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/903455DD-A3FF-46BE-B3BE-FB75A8338624.jpg?v=1757362987&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/53F190A0-C296-4CC3-8673-22548F7FB49F.jpg?v=1757363001&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Anillos",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-47517488709854",
        "title": "Default Title",
        "price": 3625,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8671831458014",
    "handle": "medalla-de-la-caridad-del-cobre",
    "title": "Medalla de la Caridad del Cobre",
    "description": "10K oro amarillo la 2.5” es por orden ahora",
    "price": 2300,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-8620.heic?v=1777580853&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-8619.heic?v=1777580821&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-8618.heic?v=1777580884&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-8617.heic?v=1777580942&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-8616.heic?v=1777580986&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Medallas",
      "Oshún"
    ],
    "variants": [
      {
        "id": "pyj-v-46485266497758",
        "title": "1.5”",
        "price": 2300,
        "available": true
      },
      {
        "id": "pyj-v-46485268070622",
        "title": "2”",
        "price": 3500,
        "available": true
      },
      {
        "id": "pyj-v-46485268103390",
        "title": "2.5”",
        "price": 6300,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8669388931294",
    "handle": "idde-de-lujo",
    "title": "Idde de lujo",
    "description": "8.5\" x 10.40mm 10k 11661",
    "price": 4500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-172047.jpg?v=1725658437&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-172833.jpg?v=1725658437&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-172549.jpg?v=1725658701&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMAGE-EDIT_12a72fd5-737a-4ab3-95f4-3e48cec0c372.png?v=1725658700&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-45867185307870",
        "title": "Default Title",
        "price": 4500,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8669386801374",
    "handle": "idde-de-oshun-14k-2",
    "title": "Idde de oshun 14k",
    "description": "Idde de lujo de oshun 14k por orden 8\"9,40mm 10276",
    "price": 8000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/FullSizeRender_821e8f30-324a-477a-a6cd-3e4d85c42113.jpg?v=1776872754&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/FullSizeRender_844ce4e9-df46-484c-a4f3-0d66187a10ae.heic?v=1776872753&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/FullSizeRender.heic?v=1776872753&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde",
      "Oshún"
    ],
    "variants": [
      {
        "id": "pyj-v-45867176329438",
        "title": "Default Title",
        "price": 8000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8669385457886",
    "handle": "idde-de-lujo-de-orula-4",
    "title": "Idde de lujo de orula",
    "description": "8\"X9.20mm 10k 14526",
    "price": 5700,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-164948.jpg?v=1725656743&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-165035.jpg?v=1725656743&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-165102.jpg?v=1725656743&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-45867171250398",
        "title": "Default Title",
        "price": 5700,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8669339648222",
    "handle": "idde-de-lujo-de-flores",
    "title": "Idde de lujo de flores 10k",
    "description": "7.5\"X14mm 10k 36,4grm 11658",
    "price": 5800,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-155843_0.jpg?v=1725654095&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-160102.jpg?v=1725654095&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-160105.jpg?v=1725654095&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-160147.jpg?v=1725654095&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-45867010064606",
        "title": "Default Title",
        "price": 5800,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8669268345054",
    "handle": "idde-de-lujo-de-orula-y-todos-los-santos-por-orden-12333",
    "title": "Idde de lujo Orula y todos santos",
    "description": "10k SOLO POR ORDEN",
    "price": 7000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-150542.jpg?v=1725650312&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-150651.jpg?v=1725650312&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-150320.jpg?v=1725650312&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-150105.jpg?v=1725650312&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-145545.jpg?v=1725650312&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-145908.jpg?v=1725650313&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-112812.jpg?v=1725650312&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-112430.jpg?v=1725650312&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-110508_2.jpg?v=1725650312&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240906-110314.jpg?v=1725650312&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-45866868277470",
        "title": "Default Title",
        "price": 7000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8668183331038",
    "handle": "idde-meyi-de-orula",
    "title": "Idde meyi de orula",
    "description": "7,5\"X8.80mm 14k 10119",
    "price": 2600,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/E70B969A-FF68-4D8F-AC4B-32642945538C.png?v=1725627105&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/27254F5E-CF62-4C50-B53D-A1C7FD1CB9E1.png?v=1725627105&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/79DE4600-E3EB-4917-B9B0-07486EDF87D2.png?v=1725627105&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-45863992197342",
        "title": "Default Title",
        "price": 2600,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8668155183326",
    "handle": "idde-de-codito",
    "title": "Idde de Codito",
    "description": "10k 7,5\" 7,45mm 33,7grm 11745 solo por pedido",
    "price": 4700,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240905-123434.jpg?v=1762878466&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240905-123510.jpg?v=1762878489&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240905-123547.jpg?v=1762878528&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-45863827538142",
        "title": "Default Title",
        "price": 4700,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8640798327006",
    "handle": "idde-de-los-16-meyis-10k",
    "title": "Idde de los 16 Meyis 10K",
    "description": "Iddé de los 16 Meyis 10k Por Orden",
    "price": 3200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-3411.jpg?v=1723144532&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-3412.jpg?v=1723144533&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-3413.jpg?v=1723144532&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/IMG-3409.jpg?v=1723144533&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-45796580327646",
        "title": "6.5”",
        "price": 3200,
        "available": true
      },
      {
        "id": "pyj-v-45796580360414",
        "title": "7”",
        "price": 3400,
        "available": true
      },
      {
        "id": "pyj-v-45796580393182",
        "title": "7.5”",
        "price": 3600,
        "available": true
      },
      {
        "id": "pyj-v-45796580425950",
        "title": "8”",
        "price": 3800,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8628274626782",
    "handle": "idde-tenis-en-especial-10k",
    "title": "Idde Tenis en Especial 10K",
    "description": "10K 3.2 13428 por orden",
    "price": 850,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240729-105654.jpg?v=1722266048&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240729-104218.jpg?v=1722266048&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240729-104158.jpg?v=1722266047&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-45770573218014",
        "title": "7\"",
        "price": 850,
        "available": true
      },
      {
        "id": "pyj-v-45770573250782",
        "title": "7.5\"",
        "price": 900,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8557157974238",
    "handle": "idde-nuevo",
    "title": "Idde Nuevo 10k",
    "description": "Pulso de ifa. Sólido 8.5”x8mm con grabado por orden",
    "price": 7500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/64D83704-D87C-4ACB-8FC4-9C45EE49AEF1.jpg?v=1718396288&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/0DDBD943-F643-4D63-ACAA-FBFE9BC34C92.jpg?v=1718396288&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/AE97341E-3FAE-4750-82DE-426179016EF4.jpg?v=1718396288&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/6058D4AA-C104-4FA4-BE13-53B918632127.jpg?v=1718396288&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/4EC2212B-26FE-488C-9CE7-FF321BA2907B.jpg?v=1718396288&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-45557197570270",
        "title": "Default Title",
        "price": 7500,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8512767459550",
    "handle": "corona-👑-oshun-caridad-cobre",
    "title": "Corona 👑 oshun Caridad cobre",
    "description": "Corona 👑 oshun 10k Sólida con piedras zirconias solo por orden 40x25mm 10030",
    "price": 1,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240527-161307.jpg?v=1716841013&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240527-161314.jpg?v=1716841014&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Coronas",
      "Oshún"
    ],
    "variants": [
      {
        "id": "pyj-v-45435522089182",
        "title": "Default Title",
        "price": 1,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8512766050526",
    "handle": "corona-👑10k",
    "title": "Corona 👑10k",
    "description": "Corona para poner a santa barbara 10k sólida 42x20mm Piedras zirconia Por Orden",
    "price": 1,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240527-160144.jpg?v=1716840430&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240527-160219.jpg?v=1716840429&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240527-160141.jpg?v=1716840430&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Coronas"
    ],
    "variants": [
      {
        "id": "pyj-v-45435519303902",
        "title": "Default Title",
        "price": 1,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8276376191198",
    "handle": "collar-ogbe-yono-14k-y-swarovski-por-orden",
    "title": "Collar Ogbe Yono 14k y Swarovski por Orden",
    "description": "14k. Piedras swarovski. 40\" largo solo por orden",
    "price": 12000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240208-122805.jpg?v=1707413527&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240208-122834.jpg?v=1707413527&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Elekes"
    ],
    "variants": [
      {
        "id": "pyj-v-44771166453982",
        "title": "Default Title",
        "price": 12000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8275990118622",
    "handle": "idde-de-orula-10k-14",
    "title": "Iddé de Orula 10k",
    "description": "10k. 7.5”x 5mm. Piedras zirconias 14554",
    "price": 2600,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240207-161918.jpg?v=1707341079&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240207-161813.jpg?v=1707341080&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-44769724301534",
        "title": "Default Title",
        "price": 2600,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8269389037790",
    "handle": "medalla-de-san-miguel-arcangel-10k",
    "title": "Medalla de San Miguel Arcangel 10k",
    "description": "10K. 2\" de altura X 3.3 mm de ancho 11082",
    "price": 2700,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240129-124506.jpg?v=1774459571&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240129-124506.jpg?v=1774459571&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Medallas"
    ],
    "variants": [
      {
        "id": "pyj-v-44741995331806",
        "title": "Default Title",
        "price": 2700,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8269355253982",
    "handle": "dije-de-nuestra-senora-de-monserrat-10k",
    "title": "Dije de Nuestra Señora de Monserrat 10k",
    "description": "10k. 1 1/4\" de altura 11093",
    "price": 600,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240129-114746.jpg?v=1706547062&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240129-114746.jpg?v=1706547062&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Dijes"
    ],
    "variants": [
      {
        "id": "pyj-v-44741738987742",
        "title": "Default Title",
        "price": 600,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8261443289310",
    "handle": "esclava-abierta-de-obbatala",
    "title": "Esclava abierta de Obbatalá",
    "description": "Plata BG50",
    "price": 300,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240122-141145.jpg?v=1705951789&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240122-141145.jpg?v=1705951789&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Pulseras",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-44698884800734",
        "title": "Diámetro: 78mm",
        "price": 300,
        "available": true
      },
      {
        "id": "pyj-v-44698884833502",
        "title": "Diámetro: 72mm",
        "price": 300,
        "available": true
      },
      {
        "id": "pyj-v-44698884866270",
        "title": "Diámetro: 68mm",
        "price": 300,
        "available": true
      },
      {
        "id": "pyj-v-44698884899038",
        "title": "Diámetro: 62mm",
        "price": 300,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8257741684958",
    "handle": "idde-10k",
    "title": "Idde 10k",
    "description": "Idde 10k. 8\" x 10 mm solo por orden 1 mes de entrega para más información enviar un mensaje 305-522-8490 305-901-9377",
    "price": 8000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240119-155333.jpg?v=1705699310&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240119-155625.jpg?v=1705699310&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240119-160731.jpg?v=1705699310&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-44685921419486",
        "title": "Default Title",
        "price": 8000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8256722370782",
    "handle": "moneda-de-plata-1",
    "title": "Moneda de Plata",
    "description": "Plata. Diámetro: 37.30mm BG36",
    "price": 80,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240118-144730.jpg?v=1705609256&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240118-144812.jpg?v=1705609255&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Monedas"
    ],
    "variants": [
      {
        "id": "pyj-v-44682814619870",
        "title": "Default Title",
        "price": 80,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8256698712286",
    "handle": "pulsera-de-rubi-14k",
    "title": "Pulsera de rubí 14k",
    "description": "14k. 7\" x 2.5\". Rubíes 10819",
    "price": 2900,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240118-141734.jpg?v=1705605978&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240118-141755.jpg?v=1705605978&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Pulseras"
    ],
    "variants": [
      {
        "id": "pyj-v-44682686529758",
        "title": "Default Title",
        "price": 2900,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8256694911198",
    "handle": "pulsera-de-green-onix-14k",
    "title": "Pulsera de green onix 14k",
    "description": "14k. 7\" x 3mm Green piedras preciosas 10812",
    "price": 3800,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240118-141309.jpg?v=1705605428&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20240118-141323.jpg?v=1705605429&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Pulseras"
    ],
    "variants": [
      {
        "id": "pyj-v-44682665787614",
        "title": "Default Title",
        "price": 3800,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8219283685598",
    "handle": "idde-de-orula-10k-12",
    "title": "Iddé de Orula 10k",
    "description": "10k. 7 1/2\" x 10.9mm. Piedras zirconias 12982",
    "price": 5400,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231127-172251.jpg?v=1701124451&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231127-172559.jpg?v=1701124451&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-44559745515742",
        "title": "Default Title",
        "price": 5400,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8219281981662",
    "handle": "idde-de-orula-10k-11",
    "title": "Iddé de Orula 10k",
    "description": "10k. 7 3/4\" x 7.8mm. Piedras zirconias solo por orden 15 de entrega",
    "price": 3000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231127-171624.jpg?v=1701123677&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231127-171652.jpg?v=1701123677&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Idde",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-44559733883102",
        "title": "Default Title",
        "price": 3000,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8181357052126",
    "handle": "dije-de-obbatala-10k",
    "title": "Dije de Obbatalá 14k",
    "description": "14k. 2\" altura. Piedras zirconias 11663",
    "price": 1200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/Screenshot-20231031_121525_Shopify.jpg?v=1698769185&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/Screenshot-20231031_121525_Shopify.jpg?v=1698769185&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Dijes",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-44469939994846",
        "title": "Default Title",
        "price": 1200,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8170999939294",
    "handle": "idde-tapado-de-eleggua-10k",
    "title": "Iddé tapado de Elegguá 10k",
    "description": "10k. 7\" x 4.8mm",
    "price": 2000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231026-104547.jpg?v=1698332195&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231026-104618.jpg?v=1698332194&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231026-104751.jpg?v=1698332195&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde",
      "Elegguá"
    ],
    "variants": [
      {
        "id": "pyj-v-44452288725214",
        "title": "Default Title",
        "price": 2000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8170901471454",
    "handle": "idde-de-yemaya-10k",
    "title": "Iddé de Yemayá 10k",
    "description": "10k. 7\" x 4.8mm Por Orden",
    "price": 1750,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231026-102511.jpg?v=1698330572&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231026-102609.jpg?v=1698330572&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde",
      "Yemayá"
    ],
    "variants": [
      {
        "id": "pyj-v-44452182163678",
        "title": "Default Title",
        "price": 1750,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8169172828382",
    "handle": "rosario-de-plata-3",
    "title": "Rosario de plata",
    "description": "Plata.",
    "price": 100,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231025-142740.jpg?v=1698258601&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231025-142751.jpg?v=1698258601&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Rosarios"
    ],
    "variants": [
      {
        "id": "pyj-v-44449594900702",
        "title": "20\" 2.96mm",
        "price": 100,
        "available": true
      },
      {
        "id": "pyj-v-44449594933470",
        "title": "22' 6mm",
        "price": 360,
        "available": true
      },
      {
        "id": "pyj-v-48046487732446",
        "title": "22' 4mm",
        "price": 200,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8169130066142",
    "handle": "rosario-de-plata-2",
    "title": "Rosario de plata",
    "description": "Plata MX3",
    "price": 270,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231025-131330.jpg?v=1698254503&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231025-131351.jpg?v=1698254503&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Rosarios"
    ],
    "variants": [
      {
        "id": "pyj-v-44449413890270",
        "title": "24\" 5mm",
        "price": 270,
        "available": true
      },
      {
        "id": "pyj-v-48046581678302",
        "title": "28' 5,78mm",
        "price": 400,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8169053552862",
    "handle": "rosario-8",
    "title": "Rosario",
    "description": "Plata 18\" MX5",
    "price": 160,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231025-113548.jpg?v=1698249220&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231025-113631.jpg?v=1698249220&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Rosarios"
    ],
    "variants": [
      {
        "id": "pyj-v-44449200210142",
        "title": "Default Title",
        "price": 160,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8169042051294",
    "handle": "rosario-de-plata-1",
    "title": "Rosario de plata",
    "description": "Plata MX2",
    "price": 250,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231025-101943_62617db5-c860-441f-9633-440a4816f864.jpg?v=1698248322&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231025-101904.jpg?v=1698248323&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231025-101749_de9c1e0e-a98b-4ccf-8689-77a12bb1ae25.jpg?v=1698248322&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Rosarios"
    ],
    "variants": [
      {
        "id": "pyj-v-44449144537310",
        "title": "16\"",
        "price": 250,
        "available": true
      },
      {
        "id": "pyj-v-44449144570078",
        "title": "18\"",
        "price": 205,
        "available": true
      },
      {
        "id": "pyj-v-44449144602846",
        "title": "20\"",
        "price": 235,
        "available": true
      },
      {
        "id": "pyj-v-44449144635614",
        "title": "22\"",
        "price": 215,
        "available": true
      },
      {
        "id": "pyj-v-44449144668382",
        "title": "26\"",
        "price": 240,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8168990965982",
    "handle": "rosario-de-plata",
    "title": "Rosario de plata",
    "description": "Plata. MX1",
    "price": 100,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231025-101943.jpg?v=1698244796&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231025-101749.jpg?v=1698244795&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Rosarios"
    ],
    "variants": [
      {
        "id": "pyj-v-44448926204126",
        "title": "18\"",
        "price": 100,
        "available": true
      },
      {
        "id": "pyj-v-44448926236894",
        "title": "20\"",
        "price": 130,
        "available": true
      },
      {
        "id": "pyj-v-44448926269662",
        "title": "22\"",
        "price": 150,
        "available": true
      },
      {
        "id": "pyj-v-44448926302430",
        "title": "24\"",
        "price": 135,
        "available": true
      },
      {
        "id": "pyj-v-44448926335198",
        "title": "26\"",
        "price": 160,
        "available": true
      },
      {
        "id": "pyj-v-44449648279774",
        "title": "16\"",
        "price": 120,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8162516140254",
    "handle": "remos-de-oshun-10k-juego-de-2",
    "title": "Remos de Oshún 10k. Juego de 2 por orden",
    "description": "10k. 3 1/2\" X32X",
    "price": 1500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231019-155325.jpg?v=1697745909&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231019-155325.jpg?v=1697745909&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Herramientas",
      "Oshún"
    ],
    "variants": [
      {
        "id": "pyj-v-44430782660830",
        "title": "Default Title",
        "price": 1500,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8162434351326",
    "handle": "pulso-oro-blanco-de-bolas-full-diamond-por-orden",
    "title": "Pulso oro blanco de bolas full diamond por Orden",
    "description": "Oro blanco. 10k. Size 16. Diamantes 2.4CT Se hacen por Orden",
    "price": 3000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231019-152049.jpg?v=1697744155&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231019-152124.jpg?v=1697744155&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Pulseras"
    ],
    "variants": [
      {
        "id": "pyj-v-44430667907294",
        "title": "Default Title",
        "price": 3000,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8152608407774",
    "handle": "idde-de-eleggua",
    "title": "Iddé de Elegguá",
    "description": "10k. 7.3 x 9.8mm. Piedras zirconia 10091",
    "price": 9500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231012-175653_0.jpg?v=1697148151&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231012-175725.jpg?v=1697148151&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Idde",
      "Elegguá"
    ],
    "variants": [
      {
        "id": "pyj-v-44405571256542",
        "title": "Default Title",
        "price": 9500,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8152600936670",
    "handle": "idde-de-shango-10k",
    "title": "Iddé de Shangó. 10k",
    "description": "10k. 8 1/2\" x 10mm 10055 este modelo es por orden",
    "price": 10000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231012-174843.jpg?v=1697147674&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231012-174753.jpg?v=1697147674&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde",
      "Changó"
    ],
    "variants": [
      {
        "id": "pyj-v-44405551268062",
        "title": "Default Title",
        "price": 10000,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8151505830110",
    "handle": "idde-de-orula-tradicional-10k",
    "title": "Iddé de Orula tradicional 10k",
    "description": "10k. 8 “x 9.8mm. Piedras zirconias 10090",
    "price": 9500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231011-162737.jpg?v=1697056519&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231011-162940.jpg?v=1697056519&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-44402256576734",
        "title": "Default Title",
        "price": 9500,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8151501471966",
    "handle": "idde-de-oshun-de-lujo-10k",
    "title": "Iddé de Oshún de lujo 10k por Orden",
    "description": "10k. 8 1/2\" x 9.80mm. Piedras zirconias solo por pedido",
    "price": 9500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231011-161049.jpg?v=1697055703&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231011-161235.jpg?v=1697055703&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde",
      "Oshún"
    ],
    "variants": [
      {
        "id": "pyj-v-44402247074014",
        "title": "Default Title",
        "price": 9500,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8150316122334",
    "handle": "idde-de-orula-de-lujo-18",
    "title": "Iddé de Orula de lujo",
    "description": "Oro. Piedras zirconias. 8\" x 6.5mm 10136 10137",
    "price": 0,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231010-172942.jpg?v=1696975382&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231010-173058.jpg?v=1696975382&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Idde",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-44398712979678",
        "title": "10k",
        "price": 0,
        "available": false
      },
      {
        "id": "pyj-v-44398713012446",
        "title": "14k",
        "price": 0,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8139346542814",
    "handle": "dije-de-eleggua-14k-2",
    "title": "Dije de Elegguá 14k",
    "description": "14k. 1 1/2\" altura. Piedras zirconias 10686",
    "price": 2500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/Screenshot-20230929_175233_Shopify.jpg?v=1696024643&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/Screenshot-20230929_175237_Shopify.jpg?v=1696024643&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Dijes",
      "Elegguá"
    ],
    "variants": [
      {
        "id": "pyj-v-44369667358942",
        "title": "Default Title",
        "price": 2500,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8129723629790",
    "handle": "pulso-de-azabaches-14k",
    "title": "Pulso de azabaches",
    "description": "10k . Azabaches",
    "price": 180,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230915-155638.jpg?v=1694807917&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230915-155705.jpg?v=1694807917&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Azabaches"
    ],
    "variants": [
      {
        "id": "pyj-v-44349329866974",
        "title": "Default Title",
        "price": 180,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8127359975646",
    "handle": "sin-nombre-12sept_17-44",
    "title": "Iddé de Oshún de lujo. 14k",
    "description": "14k. 7\" x 2.3mm. Piedras zirconias Por orden",
    "price": 1800,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230912-174229.jpg?v=1694555190&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230912-174042.jpg?v=1694555190&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Idde",
      "Oshún"
    ],
    "variants": [
      {
        "id": "pyj-v-44344938299614",
        "title": "Default Title",
        "price": 1800,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8124937076958",
    "handle": "sin-nombre-8sept_17-41",
    "title": "Iddé personalizado",
    "description": "10k 8\" x 9.8mm Piedras zirconias",
    "price": 7000,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/Screenshot-20230908_174001_Shopify.jpg?v=1694209377&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/Screenshot-20230908_174005_Shopify.jpg?v=1694209378&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/Screenshot-20230908_174009_Shopify.jpg?v=1694209378&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Idde"
    ],
    "variants": [
      {
        "id": "pyj-v-44340317847774",
        "title": "Default Title",
        "price": 7000,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8119606149342",
    "handle": "sin-nombre-29ago_11-18",
    "title": "Iddé de Orula de lujo 10k",
    "description": "10k. Size 17. Grosor: 8mm. Piedras zirconias por orden",
    "price": 5300,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/rn-image_picker_lib_temp_cc05d9d8-da4a-4bf9-94ae-68485586a5df.jpg?v=1693323049&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/rn-image_picker_lib_temp_fdbf09a5-c35c-4202-bab2-cf82a57bda9a.jpg?v=1693323050&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Idde",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-44328290517214",
        "title": "Default Title",
        "price": 5300,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8117101723870",
    "handle": "sin-nombre-25ago_16-59",
    "title": "Moneda americana de 50 centavos de colección",
    "description": "Plata. Año 1964. Diámetro: 30.4mm",
    "price": 100,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/rn-image_picker_lib_temp_5cd61015-99c1-4afa-9d67-d1099efd400a.jpg?v=1692997312&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230825-165837.jpg?v=1692997313&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Monedas"
    ],
    "variants": [
      {
        "id": "pyj-v-44324625481950",
        "title": "Default Title",
        "price": 100,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8117092286686",
    "handle": "sin-nombre-25ago_16-43",
    "title": "Monedas de 50 centavos en oferta especial",
    "description": "Plata. Diámetro: 30.4mm ST23",
    "price": 70,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/rn-image_picker_lib_temp_9d03eb5f-77b0-4e82-bf1c-3bb2193783a8.jpg?v=1692996794&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/rn-image_picker_lib_temp_612f51eb-cfac-450e-a743-9b5094444060.jpg?v=1692996795&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Monedas"
    ],
    "variants": [
      {
        "id": "pyj-v-44324616929502",
        "title": "1",
        "price": 70,
        "available": true
      },
      {
        "id": "pyj-v-44324621779166",
        "title": "2",
        "price": 80,
        "available": true
      },
      {
        "id": "pyj-v-44324622729438",
        "title": "3",
        "price": 130,
        "available": true
      },
      {
        "id": "pyj-v-44324622958814",
        "title": "16",
        "price": 700,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8116476281054",
    "handle": "sin-nombre-24ago_17-11",
    "title": "Iddé de Elegguá por Orden 10k",
    "description": "10k. 8 1/2\" x 9.8mm. Piedras zirconias *SE HACEN POR ORDEN * ST23",
    "price": 9500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/rn-image_picker_lib_temp_18738dd9-1b5f-4e7d-836b-e2ec6aba4393.jpg?v=1692912963&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/rn-image_picker_lib_temp_a712546d-b450-4e96-9dc5-eb056010d726.jpg?v=1692912963&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Idde",
      "Elegguá"
    ],
    "variants": [
      {
        "id": "pyj-v-44323467526366",
        "title": "Default Title",
        "price": 9500,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8110108573918",
    "handle": "sin-nombre-15ago_14-43",
    "title": "Rosario de plata",
    "description": "Plata. 37\" x 5.6mm VA7",
    "price": 540,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230815-144143.jpg?v=1692125320&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230815-144148.jpg?v=1692125321&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230815-144153.jpg?v=1692125322&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230815-143334_bdce5c79-7694-44d9-8831-2192e6bea59b.jpg?v=1692125323&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Rosarios"
    ],
    "variants": [
      {
        "id": "pyj-v-44310853026014",
        "title": "Default Title",
        "price": 540,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8110081573086",
    "handle": "sin-nombre-15ago_14-30",
    "title": "Rosario de plata",
    "description": "Plata. 41\" x 7.4mm VA6",
    "price": 810,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/rn-image_picker_lib_temp_8c6c928c-c10a-4a67-88c8-e0504d3bf60e.jpg?v=1692124826&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/rn-image_picker_lib_temp_47ebe577-b951-4671-8990-5b5441b350e9.jpg?v=1692124827&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230815-143159.jpg?v=1692124827&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230815-143334.jpg?v=1692124828&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Rosarios"
    ],
    "variants": [
      {
        "id": "pyj-v-44310819537118",
        "title": "Default Title",
        "price": 810,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8106956980446",
    "handle": "sin-nombre-10ago_14-07",
    "title": "Pulso de ochosi de Plata",
    "description": "Plata. 10\" x 4.4mm. Diàmetro: 80.2mm BA36",
    "price": 470,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/rn-image_picker_lib_temp_8d23836d-28b1-46b3-b6c9-c398bc798e77.jpg?v=1691690864&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/rn-image_picker_lib_temp_4d7528b0-8d52-4ef0-ba30-36f95c76fa67.jpg?v=1691690865&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Pulseras",
      "Ochosi"
    ],
    "variants": [
      {
        "id": "pyj-v-44304691790046",
        "title": "Default Title",
        "price": 470,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8080510779614",
    "handle": "rosario-9",
    "title": "Rosario 10k",
    "description": "10k. 18\" . Tres Misterios 2 1/2\" 10696",
    "price": 480,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230706_123015.jpg?v=1688661239&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230706_123143.jpg?v=1688661239&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230706_123220.jpg?v=1688661239&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Rosarios"
    ],
    "variants": [
      {
        "id": "pyj-v-44260101718238",
        "title": "Default Title",
        "price": 480,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8072440152286",
    "handle": "idde-de-orula-de-lujo-1",
    "title": "Iddé de Orula de lujo",
    "description": "14k. 7.5\" x 7.8mm. Piedras zirconias Por orden",
    "price": 4200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230627_173637.jpg?v=1687902110&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230627_173805.jpg?v=1687902110&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230627_173847.jpg?v=1687902110&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Idde",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-44247357358302",
        "title": "Default Title",
        "price": 4200,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8068998594782",
    "handle": "herramientas-de-oshun",
    "title": "Herramienta de Oshún. Aldanes",
    "description": "Aro: diámetro: 66mm. Adanes: 2\" 13047",
    "price": 1800,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231102-121534.jpg?v=1698942265&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20231102-121534.jpg?v=1698942265&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Herramientas",
      "Oshún"
    ],
    "variants": [
      {
        "id": "pyj-v-44241879859422",
        "title": "Default Title",
        "price": 1800,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8058619986142",
    "handle": "azabache-5",
    "title": "Azabache",
    "description": "14k",
    "price": 160,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230607_121627.jpg?v=1686154681&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230607_121627.jpg?v=1686154681&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Azabaches"
    ],
    "variants": [
      {
        "id": "pyj-v-44219975270622",
        "title": "Default Title",
        "price": 160,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8058614743262",
    "handle": "azabache-4",
    "title": "Azabache",
    "description": "10k",
    "price": 110,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230607_120828.jpg?v=1686154213&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230607_120828.jpg?v=1686154213&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Azabaches"
    ],
    "variants": [
      {
        "id": "pyj-v-44219959574750",
        "title": "Default Title",
        "price": 110,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8058611499230",
    "handle": "azabache-3",
    "title": "Azabache",
    "description": "10k",
    "price": 70,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230607_120326.jpg?v=1686153882&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230607_120326.jpg?v=1686153882&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Azabaches"
    ],
    "variants": [
      {
        "id": "pyj-v-44219946139870",
        "title": "Default Title",
        "price": 70,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8058602094814",
    "handle": "azabache-1",
    "title": "Azabache",
    "description": "10k",
    "price": 120,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230607_115117.jpg?v=1686153181&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230607_115117.jpg?v=1686153181&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Azabaches"
    ],
    "variants": [
      {
        "id": "pyj-v-44219911012574",
        "title": "Default Title",
        "price": 120,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8039341424862",
    "handle": "moneda-de-coleccion-5",
    "title": "Moneda de colección",
    "description": "Plata. Diámetro: 39mm",
    "price": 100,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230511_164751.jpg?v=1683838879&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230511_165016.jpg?v=1683838879&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Monedas"
    ],
    "variants": [
      {
        "id": "pyj-v-44185634210014",
        "title": "Default Title",
        "price": 100,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8039336706270",
    "handle": "moneda-de-coleccion-4",
    "title": "Moneda de colección",
    "description": "Plata. Diámetro: 39mm",
    "price": 150,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230511_164127.jpg?v=1683838013&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230511_164257.jpg?v=1683838013&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Monedas"
    ],
    "variants": [
      {
        "id": "pyj-v-44185623363806",
        "title": "Default Title",
        "price": 150,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8039335035102",
    "handle": "moneda-de-coleccion-2",
    "title": "Moneda de ifa’ 16 meyis",
    "description": "Monada ifa plata 925 36.5mm. X 2.9mm las monedas en ese precio viene con signo incluido también vendemos al por mayor",
    "price": 250,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/FullSizeRender.jpg?v=1772564325&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/FullSizeRender.jpg?v=1772564325&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Monedas",
      "Orula"
    ],
    "variants": [
      {
        "id": "pyj-v-44185620906206",
        "title": "Default Title",
        "price": 250,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8039320256734",
    "handle": "pulso-tenis-de-lujo-6",
    "title": "Pulso tenis de lujo",
    "description": "14k. 7\" x 4.8mm. Piedras zirconias N5",
    "price": 1600,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230511_160128.jpg?v=1683835485&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230511_160158.jpg?v=1683835485&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Pulseras"
    ],
    "variants": [
      {
        "id": "pyj-v-44185597509854",
        "title": "Default Title",
        "price": 1600,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8039318520030",
    "handle": "pulso-tenis-de-lujo-5",
    "title": "Pulso tenis de lujo",
    "description": "14k. 7\" x 4.4mm. Piedras zirconias N4",
    "price": 1500,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230511_155618.jpg?v=1683835142&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/20230511_155657.jpg?v=1683835142&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Pulseras"
    ],
    "variants": [
      {
        "id": "pyj-v-44185595642078",
        "title": "Default Title",
        "price": 1500,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-8015382413534",
    "handle": "esclava-de-obbatala-1",
    "title": "Esclava de Obbatalá",
    "description": "Plata. 9\" x 3.8mm",
    "price": 380,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230413_125052_79c8ceeb-fd35-4ec0-b20e-3f8c26b84223.jpg?v=1681405148&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230413_125052_79c8ceeb-fd35-4ec0-b20e-3f8c26b84223.jpg?v=1681405148&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Pulseras",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-44142533705950",
        "title": "Default Title",
        "price": 380,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-8015380447454",
    "handle": "esclava-de-obbatala",
    "title": "Esclava de Obbatalá",
    "description": "Plata. 10\" x 4mm",
    "price": 450,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230413_125052.jpg?v=1681404874&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230413_125052.jpg?v=1681404874&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Pulseras",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-44142514438366",
        "title": "Default Title",
        "price": 450,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-7956222443742",
    "handle": "dije-de-azabache-1",
    "title": "Azabache para colgar en ropa",
    "description": "10k",
    "price": 120,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230216_181113_635f932a-c7ab-4ef7-a757-a0d22cce3d6c.jpg?v=1676589184&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230216_181113.jpg?v=1676589184&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230216_181143.jpg?v=1676589185&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230216_181143_fcd22c83-8280-45b4-857e-cdf2245af2bf.jpg?v=1676589185&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Azabaches"
    ],
    "variants": [
      {
        "id": "pyj-v-43997718970590",
        "title": "Default Title",
        "price": 120,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-7950617411806",
    "handle": "pulso-de-ochosi",
    "title": "Pulso de Oshosi A12",
    "description": "Plata. Size 21. 5.8mm",
    "price": 0,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230208_150910.jpg?v=1675887700&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230208_151113.jpg?v=1675887700&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Pulseras",
      "Ochosi"
    ],
    "variants": [
      {
        "id": "pyj-v-43979653808350",
        "title": "Default Title",
        "price": 0,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-7939309895902",
    "handle": "remos-de-oshun",
    "title": "Remos de Oshún 14k. Juego de 2",
    "description": "14k 3 1/2\" 82x12mm 10670",
    "price": 1800,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/Screenshot_20230620_125502_Shopify.jpg?v=1687280352&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/Screenshot_20230620_125459_Shopify.jpg?v=1687280352&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Herramientas",
      "Oshún"
    ],
    "variants": [
      {
        "id": "pyj-v-43931462303966",
        "title": "Default Title",
        "price": 1800,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-7939274965214",
    "handle": "muletas-de-san-lazaro",
    "title": "Muletas de San Lázaro",
    "description": "10k. 1.8\" altura",
    "price": 160,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230125_135111.jpg?v=1674672889&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230125_135111.jpg?v=1674672889&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": false,
    "tags": [
      "Herramientas",
      "Babalú Ayé"
    ],
    "variants": [
      {
        "id": "pyj-v-43931383529694",
        "title": "Default Title",
        "price": 160,
        "available": false
      }
    ]
  },
  {
    "id": "pyj-7933478699230",
    "handle": "herramientas-de-yemaya",
    "title": "Herramientas de Yemayá. Plata",
    "description": "Plata Virgen de Regla",
    "price": 750,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230118_121252.jpg?v=1674062218&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230118_121252.jpg?v=1674062218&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Herramientas",
      "Yemayá"
    ],
    "variants": [
      {
        "id": "pyj-v-43907111583966",
        "title": "Default Title",
        "price": 750,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-7933051764958",
    "handle": "herramientas-de-obbtala",
    "title": "Herramientas de Obbatalá",
    "description": "Plata,",
    "price": 550,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/Screenshot-20231110_235045_Shopify.jpg?v=1699678278&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/Screenshot-20231110_235045_Shopify.jpg?v=1699678278&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Herramientas",
      "Obatalá"
    ],
    "variants": [
      {
        "id": "pyj-v-43904912031966",
        "title": "Default Title",
        "price": 550,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-7932756164830",
    "handle": "moneda-de-coleccion-1",
    "title": "Moneda de colección",
    "description": "Plata",
    "price": 150,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230117_152938.jpg?v=1673987617&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230117_152957.jpg?v=1673987617&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Monedas"
    ],
    "variants": [
      {
        "id": "pyj-v-43903752962270",
        "title": "Default Title",
        "price": 150,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-7932735029470",
    "handle": "moneda-de-coleccion",
    "title": "Moneda de colección",
    "description": "Plata. One dollar. 1985",
    "price": 150,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230117_150940.jpg?v=1673986378&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230117_150921.jpg?v=1673986378&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Monedas"
    ],
    "variants": [
      {
        "id": "pyj-v-43903684280542",
        "title": "Default Title",
        "price": 150,
        "available": true
      }
    ]
  },
  {
    "id": "pyj-7932730638558",
    "handle": "moneda-de-plata",
    "title": "Moneda de Plata",
    "description": "Plata",
    "price": 200,
    "compare": null,
    "images": [
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230117_145003.jpg?v=1673985999&width=800",
      "https://cdn.shopify.com/s/files/1/0667/9475/0174/products/20230117_144930.jpg?v=1673986000&width=800"
    ],
    "rating": 5,
    "badge": null,
    "available": true,
    "tags": [
      "Monedas"
    ],
    "variants": [
      {
        "id": "pyj-v-43903665864926",
        "title": "Default Title",
        "price": 200,
        "available": true
      }
    ]
  }
];

export const MOCK_PRODUCTS: Product[] = SEEDS.map((s) => ({
  id: s.id,
  handle: s.handle,
  title: s.title,
  description: s.description,
  price: money(s.price, C),
  compareAtPrice: s.compare ? money(s.compare, C) : null,
  images: s.images.map((url) => ({ url, altText: s.title })),
  rating: s.rating,
  badge: s.badge,
  availableForSale: s.available,
  tags: s.tags,
  variants: s.variants.map((v) => ({
    id: v.id,
    title: v.title,
    price: money(v.price, C),
    availableForSale: v.available,
  })),
}));

// Distinct categories present in the catalogue (for the shop filter), most common first.
export const DEMO_CATEGORIES = ["Idde","Pulseras","Anillos","Herramientas","Monedas","Opele","Azabaches","Rosarios","Dijes","Medallas","Coronas","Cadenas","Otros","Elekes"];
