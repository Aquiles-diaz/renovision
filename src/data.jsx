/* ============ reno · vision — DATA + PRICING ============ */

export const LINES = [
  { id: "BASE", name: "Línea EXA", desc: "Premium · herrajes ocultos", mult: 1.0 },
];

/* ---------- MELAMINAS FAPLAC — terminaciones reales (catálogo + Studio 3D) ----------
   img: foto real del color (se usa como textura en el 3D y como thumbnail)
   tone: variante de render (madera | gris) · mult: factor de precio */
export const MELAMINAS = [
  { id:"sauco", name:"Sauco", line:"Línea Blend", finish:"Textura BARK", code:"212BAR",
    img:"/assets/melaminas/sauco.jpg", hex:"#2a2622", tone:"madera", mult:1.18,
    desc:"Madera negra quemada de carácter intenso. La textura BARK aporta un relieve natural y minimalista que absorbe la luz.",
    ambiente:"Living y racks de TV donde se busca drama y contraste; ideal para muebles que se vuelven el centro de la escena." },
  { id:"pinogris", name:"Pino Gris", line:"Línea Blend", finish:"Textura BARK", code:"120BAR",
    img:"/assets/melaminas/pinogris.jpg", hex:"#8c8389", tone:"gris", mult:1.08,
    desc:"Combinación delicada de tonos gris y violáceos. Una madera fría, serena y sofisticada de personalidad calma.",
    ambiente:"Dormitorios y estudios; suma sobriedad sin enfriar el ambiente, perfecto para placares y escritorios." },
  { id:"grisbasalto", name:"Gris Basalto", line:"Línea Mesopotamia", finish:"Supermate", code:"214MES",
    img:"/assets/melaminas/grisbasalto.jpg", hex:"#6f7173", tone:"gris", mult:1.06,
    desc:"Gris medio, neutro y atemporal con acabado supermate sin reflejos. Transmite estabilidad y sobriedad.",
    ambiente:"Cocinas, oficinas y cualquier ambiente moderno; combina con todo y nunca pasa de moda." },
  { id:"terracota", name:"Terracota", line:"Línea Mesopotamia", finish:"Texturado", code:"223MES",
    img:"/assets/melaminas/terracota.jpg", hex:"#8a4f38", tone:"madera", mult:1.12,
    desc:"Tono tierra profundo y vibrante que evoca los suelos mesopotámicos. Calidez, identidad y carácter natural.",
    ambiente:"Comedores y recibidores; aporta abrigo y bienvenida a los espacios sociales de la casa." },
  { id:"merlot", name:"Merlot", line:"Línea Blend", finish:"Textura BARK", code:"141BAR",
    img:"/assets/melaminas/merlot.jpg", hex:"#5a3a31", tone:"madera", mult:1.20,
    desc:"Roble oscuro con matices rojizos y contrastes elegantes. Una madera noble de aire señorial.",
    ambiente:"Bibliotecas y escritorios; viste ambientes de trabajo y lectura con elegancia clásica." },
  { id:"tribal", name:"Tribal", line:"Línea Étnica", finish:"Texturado", code:"111DMT",
    img:"/assets/melaminas/tribal.jpg", hex:"#7a6650", tone:"madera", mult:1.14,
    desc:"Tonos tierra de inspiración nativa con textura natural marcada. Diseño cálido y orgánico que marca diferencia.",
    ambiente:"Living y recibidor de estilo nativo o boho; ideal para aparadores y muebles con impronta artesanal." },
  { id:"sahara", name:"Sahara", line:"Línea Étnica", finish:"Texturado", code:"112DMT",
    img:"/assets/melaminas/sahara.jpg", hex:"#c9b596", tone:"madera", mult:1.10,
    desc:"Neutro arena cálido y luminoso, pensado para combinar con cualquier sector de la casa sin protagonismo.",
    ambiente:"Cabinas, vestidores y dormitorios; amplía y aclara, perfecto como base que acompaña a otros colores." },
];

export const LEGS = [
  { id:"rectas",   name:"Rectas",    spec:"15 cm", price:14800, h:0.15 },
  { id:"conicas",  name:"Cónicas",   spec:"18 cm", price:19600, h:0.18 },
  { id:"metalicas",name:"Metálicas", spec:"12 cm", price:22400, h:0.12 },
  { id:"sin",      name:"Sin Patas", spec:"zócalo",price:0,     h:0.0  },
];

/* ---------- CATÁLOGO EXA · LIVING COLLECTION ----------
   Medidas en mm (igual al catálogo). Ancho discreto: módulos de 900 mm.
   render: variante por tono de melamina (madera | gris) — /assets/modules/<id>-<tono>.png
   Disponibles en todos los ambientes. */
export const BAY = 900;
export const FURNITURE = [
  { id:"mesatv", name:"Mesa TV", icon:"rack", kind:"drawers",
    widths:[900,1800,2700], defW:1800, alto:410, prof:500, bayUnit:BAY,
    base:118000, perBay:74000, ilum:false,
    gabinete:["Melamina grafito","Melamina scotch"],
    frentes:["Supreme Melamina scotch","Barcelona PVC perlado gris"],
    specs:["Conformados por cajones smart","No incluye iluminación"],
    render:{ madera:"/assets/modules/mesatv-madera.png", gris:"/assets/modules/mesatv-gris.png" },
    spot:{ x:"32%", y:"58%" } },

  { id:"vajillero", name:"Vajillero", icon:"sideboard", kind:"doors-shelf",
    widths:[900,1800,2700], defW:1800, alto:1100, prof:500, bayUnit:BAY,
    base:156000, perBay:92000, ilum:true,
    gabinete:["Melamina grafito","Melamina scotch"],
    frentes:["Supreme Melamina scotch","Vitrina top marco negro vidrio transparente","Barcelona PVC perlado gris"],
    specs:["Conformados por puertas de abrir","Iluminación vertical en laterales (opcional)"],
    render:{ madera:"/assets/modules/vajillero-madera.png", gris:"/assets/modules/vajillero-gris.png" },
    spot:{ x:"58%", y:"46%" } },

  { id:"consola", name:"Consola", icon:"wardrobe", kind:"doors-drawer",
    widths:[900], defW:900, alto:1500, prof:500, bayUnit:BAY,
    base:184000, perBay:0, ilum:true,
    gabinete:["Melamina grafito","Melamina scotch"],
    frentes:["Supreme Melamina scotch","Vitrina top marco negro vidrio transparente","Barcelona PVC perlado gris"],
    specs:["Puertas de abrir + cajón inferior smart","Interior con estantes en melamina","Iluminación vertical en laterales (solo vitrina)"],
    render:{ madera:"/assets/modules/consola-madera.png", gris:"/assets/modules/consola-gris.png" },
    spot:{ x:"73%", y:"64%" } },

  { id:"contenedor", name:"Contenedor", icon:"shelf", kind:"doors-glasstop",
    widths:[900], defW:900, alto:1500, prof:500, bayUnit:BAY,
    base:176000, perBay:0, ilum:true,
    gabinete:["Melamina grafito","Melamina scotch"],
    frentes:["Supreme Melamina scotch","Vitrina top marco negro vidrio transparente","Barcelona PVC perlado gris"],
    specs:["Puertas de abrir","Tapa superior de vidrio transparente 6 mm","Interior con estantes en melamina","Iluminación vertical en laterales (solo vitrina)"],
    render:{ madera:"/assets/modules/contenedor-madera.png", gris:"/assets/modules/contenedor-gris.png" },
    spot:{ x:"44%", y:"38%" } },

  { id:"columna", name:"Columna", icon:"wardrobe", kind:"doors-drawer",
    widths:[900], defW:900, alto:2000, prof:500, bayUnit:BAY,
    base:232000, perBay:0, ilum:true,
    gabinete:["Melamina grafito","Melamina scotch"],
    frentes:["Supreme Melamina scotch","Vitrina top marco negro vidrio transparente","Barcelona PVC perlado gris"],
    specs:["Puertas de abrir + cajón inferior smart","Interior con estantes en melamina","Iluminación vertical en laterales (solo vitrina)","Apertura de puertas superiores con perfil Neo"],
    render:{ madera:"/assets/modules/columna-madera.png", gris:"/assets/modules/columna-gris.png" },
    spot:{ x:"22%", y:"44%" } },
];

/* ROOMS — two structures: edificio (tower) + casa */
export const ROOMS = [
  { id:"cabina",     struct:"edificio", name:"Cabina",        sub:"Vestidor · walk-in",       floor:5, furniture:["columna","consola","vajillero"] },
  { id:"estudio",    struct:"edificio", name:"Estudio",       sub:"Home office",              floor:4, furniture:["columna","consola","contenedor"] },
  { id:"comedor",    struct:"edificio", name:"Comedor",       sub:"Living comedor",           floor:4, furniture:["vajillero","contenedor","mesatv"] },
  { id:"sala",       struct:"edificio", name:"Sala de estar", sub:"Estar principal",          floor:3, furniture:["mesatv","contenedor","vajillero"] },
  { id:"lavanderia", struct:"edificio", name:"Lavandería",    sub:"Servicio",                 floor:1, furniture:["columna","contenedor"] },
  { id:"garaje",     struct:"edificio", name:"Garaje",        sub:"Cochera + guardado",       floor:1, furniture:["columna","contenedor"] },
  { id:"dormitorio", struct:"casa",     name:"Dormitorio",    sub:"Suite",                    floor:2, furniture:["columna","consola","vajillero"] },
  { id:"recibidor",  struct:"casa",     name:"Recibidor",     sub:"Hall de entrada",          floor:1, furniture:["consola","contenedor"] },
];

/* muebles de un ambiente: resuelve la lista curada del ROOM contra el catálogo */
export function furnitureForRoom(roomId){
  const room = roomById(roomId);
  if(!room || !room.furniture) return [];
  return room.furniture.map(furnitureById).filter(Boolean);
}
export function roomById(id){ return ROOMS.find(r => r.id === id); }
export function melaminaById(id){ return MELAMINAS.find(m => m.id === id) || MELAMINAS[0]; }
export function furnitureById(id){ return FURNITURE.find(f => f.id === id); }

/* nº de cuerpos (bahías de 900 mm) según el ancho elegido */
export function baysForWidth(furniture, width){
  return Math.max(1, Math.round(width / (furniture.bayUnit || BAY)));
}

/* ---------- PRICING / COTIZADOR ---------- */
export function computeQuote({ furniture, line, width, material, legs }){
  if(!furniture) return { total:0, breakdown:[] };
  const lineObj = LINES.find(l=>l.id===line) || LINES[0];
  const matObj  = melaminaById(material);
  const legObj  = LEGS.find(l=>l.id===legs) || LEGS[0];
  const bays = baysForWidth(furniture, width);

  const bd = [];
  const base = furniture.base;
  bd.push({ label:`${furniture.name} · base (${furniture.bayUnit} mm)`, value: base });

  let baysCost = 0;
  if(bays > 1 && furniture.perBay > 0){
    baysCost = furniture.perBay * (bays - 1);
    bd.push({ label:`+ ${bays-1} cuerpo(s) de ${furniture.bayUnit} mm`, value: baysCost });
  }

  let subtotal = base + baysCost;
  // line multiplier
  const lineAdj = Math.round(subtotal*(lineObj.mult-1));
  if(lineAdj!==0){ bd.push({ label:`${lineObj.name}`, value: lineAdj }); subtotal += lineAdj; }
  // melamina multiplier
  const matAdj = Math.round(subtotal*(matObj.mult-1));
  if(matAdj!==0){ bd.push({ label:`${matObj.name} (${matObj.finish})`, value: matAdj }); subtotal += matAdj; }
  // legs
  if(legObj.price>0){ bd.push({ label:`Patas ${legObj.name}`, value: legObj.price }); subtotal += legObj.price; }

  return { total: subtotal, breakdown: bd, fixed: furniture.widths.length === 1, bays };
}

export function fmtAR(n){
  return "$" + Math.round(n).toLocaleString("es-AR");
}
