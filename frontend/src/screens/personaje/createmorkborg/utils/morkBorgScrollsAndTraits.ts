// ── Catálogos de pergaminos (para sub-tiradas al azar) ────────────────────────

export interface MbScroll {
  idx: number;
  nombre: string;
  descripcion: string;
}

export const MB_IMPURE_SCROLLS: MbScroll[] = [
  {
    idx: 1,
    nombre: "Las palmeras abren la Puerta del Sur",
    descripcion:
      "Una bola de fuego golpea a d2 criaturas e inflige d8 de daño por criatura.",
  },
  {
    idx: 2,
    nombre: "Lengua de Eris",
    descripcion:
      "Una criatura de tu elección queda confundida durante 10 minutos.",
  },
  {
    idx: 3,
    nombre: "Te-le-kin-esis",
    descripcion:
      "Mueves un objeto hacia arriba 1d10 × 10 pies durante d6 minutos.",
  },
  {
    idx: 4,
    nombre: "Levitación de Lucy-Fire",
    descripcion: "Flotar durante Presencia + d10 asaltos.",
  },
  {
    idx: 5,
    nombre: "Demonio de los capilares",
    descripcion:
      "Una criatura se asfixia durante d6 asaltos, perdiendo d4 PV por asalto.",
  },
  {
    idx: 6,
    nombre: "Nueve señales violetas desatan la tormenta",
    descripcion: "Produce d2 rayos que infligen d6 de daño cada uno.",
  },
  {
    idx: 7,
    nombre: "Metzhuotl ciega tu ojo",
    descripcion:
      "Una criatura se vuelve invisible durante d6 asaltos o hasta que reciba daño, ataca/defiende con CD6.",
  },
  {
    idx: 8,
    nombre: "Psicopompo asqueroso",
    descripcion: "Invoca (d6): 1-3 d4 esqueletos, 4-6 d4 zombis.",
  },
  {
    idx: 9,
    nombre: "El párpado que ciega la mente",
    descripcion:
      "d4 criaturas se quedan dormidas durante una hora a menos que superen una prueba de CD14.",
  },
  {
    idx: 10,
    nombre: "Muerte",
    descripcion:
      "Todas las criaturas en un radio de 30 pies pierden un total de 4d10 PV.",
  },
];

export const MB_SACRED_SCROLLS: MbScroll[] = [
  {
    idx: 1,
    nombre: "Gracia del santo muerto",
    descripcion: "d2 criaturas recuperan d10 PV cada una.",
  },
  {
    idx: 2,
    nombre: "Gracia por un pecador",
    descripcion:
      "Una criatura de tu elección obtiene +d6 en una tirada (daño, prueba, etc.)",
  },
  {
    idx: 3,
    nombre: "Susurros a través de la puerta",
    descripcion: "Haz tres preguntas a una criatura fallecida.",
  },
  {
    idx: 4,
    nombre: "Égida del dolor",
    descripcion:
      "Una criatura de tu elección gana 2d6 PV extra durante 10 asaltos.",
  },
  {
    idx: 5,
    nombre: "Destino insatisfecho",
    descripcion:
      "Una criatura, muerta desde hace no más de una semana, se despierta con terribles recuerdos.",
  },
  {
    idx: 6,
    nombre: "Discurso bestial",
    descripcion: "Puede hablar con animales durante d20 minutos.",
  },
  {
    idx: 7,
    nombre: "Falso amanecer/carruaje de la noche",
    descripcion: "Luz u oscuridad total durante 3d10 minutos.",
  },
  {
    idx: 8,
    nombre: "Paso hermético",
    descripcion:
      "Encuentras todas las trampas en tu camino durante 2d10 minutos.",
  },
  {
    idx: 9,
    nombre: "Resplandor consumidor de Roskoe",
    descripcion: "d4 criaturas pierden d8 PV cada una.",
  },
  {
    idx: 10,
    nombre: "Sintaxis",
    descripcion: "Una enoquiana criatura obedece ciegamente una sola orden.",
  },
];

export function getMbScrollByIdx(
  type: "impuro" | "sagrado",
  idx: number,
): MbScroll | null {
  const table = type === "sagrado" ? MB_SACRED_SCROLLS : MB_IMPURE_SCROLLS;
  return table.find((s) => s.idx === idx) ?? null;
}

// ── Rasgos ────────────────────────────────────────────────────────────────────

export interface MbTrait {
  idx: number;
  nombre: string;
}

export const MB_RASGOS_TERRIBLES: MbTrait[] = [
  { idx: 1, nombre: "Agraviado sin cesar" },
  { idx: 2, nombre: "Complejo de inferioridad" },
  { idx: 3, nombre: "Problemas con la autoridad" },
  { idx: 4, nombre: "Boca ruidosa" },
  { idx: 5, nombre: "CRUEL" },
  { idx: 6, nombre: "Egocéntrico" },
  { idx: 7, nombre: "Nihilista" },
  { idx: 8, nombre: "Propenso al abuso de sustancias" },
  { idx: 9, nombre: "Bipolar" },
  { idx: 10, nombre: "Astuto" },
  { idx: 11, nombre: "Vengativo" },
  { idx: 12, nombre: "Cobarde" },
  { idx: 13, nombre: "Perezoso" },
  { idx: 14, nombre: "Sospechoso" },
  { idx: 15, nombre: "Despiadado" },
  { idx: 16, nombre: "Preocupado" },
  { idx: 17, nombre: "Amargado" },
  { idx: 18, nombre: "Engañoso" },
  { idx: 19, nombre: "Derrochador" },
  { idx: 20, nombre: "Arrogante" },
];

export const MB_CUERPOS_ROTOS: MbTrait[] = [
  { idx: 1, nombre: "Mirada fija y maníaca." },
  { idx: 2, nombre: "Cubierto de (para algunos) tatuajes blasfemos." },
  { idx: 3, nombre: "Cara podrida. Lleva una máscara." },
  { idx: 4, nombre: "Perdió tres dedos del pie, cojea." },
  { idx: 5, nombre: "Hambriento: demacrado y pálido." },
  { idx: 6, nombre: "Una mano reemplazada con un gancho oxidado (daño d6)." },
  { idx: 7, nombre: "Dientes deteriorados." },
  { idx: 8, nombre: "Inquietantemente hermosa, enervantemente limpia." },
  { idx: 9, nombre: "Manos cubiertas de llagas." },
  {
    idx: 10,
    nombre: "Catarata que se extiende lenta pero inexorable en ambos ojos.",
  },
  {
    idx: 11,
    nombre: "Cabello largo enredado, al menos una cucaracha vive en él.",
  },
  { idx: 12, nombre: "Orejas rotas y aplastadas." },
  { idx: 13, nombre: "Temblor y tartamudeo por daño nervioso o estrés." },
  { idx: 14, nombre: "Corpulento, voraz, babeante." },
  {
    idx: 15,
    nombre: "Una mano carece de pulgar e índice, agarra como una langosta.",
  },
  { idx: 16, nombre: "Nariz enrojecida e hinchada de alcohólico." },
  { idx: 17, nombre: "Cara de maníaco en reposo, hacer amigos es difícil." },
  { idx: 18, nombre: "Pie de atleta crónico. Apesta." },
  {
    idx: 19,
    nombre: "Ojo recién acuchillado y maloliente cubierto con un parche.",
  },
  { idx: 20, nombre: "Uñas agrietadas y negras, tal vez a punto de caerse." },
];

export const MB_HABITOS: MbTrait[] = [
  { idx: 1, nombre: "Recolectas obsesivamente pequeñas piedras afiladas." },
  {
    idx: 2,
    nombre:
      "No usarás una cuchilla sin probarla en tu propia carne. Brazos cubiertos de cicatrices.",
  },
  { idx: 3, nombre: "No puedes dejar de beber una vez que empiezas." },
  {
    idx: 4,
    nombre:
      "Adicto al juego. Debes apostar todos los días. Si pierdes, subes la apuesta y vuelves a jugar.",
  },
  {
    idx: 5,
    nombre:
      "No puedes tolerar críticas de ningún tipo. Acabas en rabia y llanto.",
  },
  {
    idx: 6,
    nombre:
      "Incapaz de ir al grano. En realidad, nunca has terminado una historia.",
  },
  {
    idx: 7,
    nombre:
      "Tu mejor amigo es una calavera. Llévala contigo, cuéntale todo, no confíes en nadie más.",
  },
  { idx: 8, nombre: "Te hurgas la nariz tan profundamente que sangra." },
  {
    idx: 9,
    nombre:
      "Te ríes histéricamente de tus propios chistes que luego explicas en detalle.",
  },
  {
    idx: 10,
    nombre:
      "Nihilista. Insistes en decirle a todo el mundo que eres nihilista y en explicar por qué.",
  },
  { idx: 11, nombre: "Comedor empedernido de insectos." },
  {
    idx: 12,
    nombre:
      "La respuesta al estrés es una exhibición estética. Cuanto peor se ponen las cosas, más elegante hay que ser.",
  },
  {
    idx: 13,
    nombre:
      "Depósito permanente de flemas en la garganta. Continuamente toses, resoplas, escupes y tragas.",
  },
  { idx: 14, nombre: "Pirómano." },
  {
    idx: 15,
    nombre:
      "Pierdes constantemente objetos importantes y olvidas datos vitales.",
  },
  {
    idx: 16,
    nombre:
      "AGITADOR DE MIERDA INSEGURO. HABLAS DE QUIEN ACABA DE SALIR DE LA HABITACIÓN.",
  },
  { idx: 17, nombre: "Tartamudeas cuando mientes." },
  { idx: 18, nombre: "Te ríes locamente en los peores momentos posibles." },
  {
    idx: 19,
    nombre:
      "Silbas mientras intentas esconderte. Negarás esto. Silbas cuando salga 5, 7, 9, 11 o 13 en un d20.",
  },
  { idx: 20, nombre: "Haces joyas con los dientes de los muertos." },
];

export const MB_HISTORIAS_PERTURBADORAS: MbTrait[] = [
  {
    idx: 1,
    nombre: "Perseguido por homicidio involuntario. Hay una recompensa.",
  },
  {
    idx: 2,
    nombre:
      "Deuda enorme. La deuda se está negociando con grupos cada vez más despiadados.",
  },
  { idx: 3, nombre: "Tienes un artículo raro y buscado." },
  { idx: 4, nombre: "Tienes una herida maldita que nunca cicatriza." },
  {
    idx: 5,
    nombre:
      "Tuviste un romance ilegal, inmoral y secreto con un miembro de la familia real. Tienes pruebas.",
  },
  {
    idx: 6,
    nombre:
      "Miembro de culto huido. Aterrorizado y paranoico. Hay otros cultistas por todas partes.",
  },
  {
    idx: 7,
    nombre:
      "Un ladrón de identidad que recientemente mató y reemplazó a esta persona.",
  },
  {
    idx: 8,
    nombre:
      "Desterrado y repudiado por hechos no especificados. Nunca podrás volver a casa.",
  },
  {
    idx: 9,
    nombre:
      "Desertor militar después de presenciar una masacre, hay recompensa por tu cabeza. Cazado por antiguos amigos.",
  },
  {
    idx: 10,
    nombre:
      "Asesinaste muy recientemente a un pariente cercano. Muy recientemente.",
  },
  {
    idx: 11,
    nombre:
      "Has montado incorrectamente (¿o no?) un cubo rompecabezas, despertando a una abominación dormida.",
  },
  {
    idx: 12,
    nombre:
      "Las criaturas malvadas aman el olor de tu rastro y se sienten atraídas por él, trayendo el desastre a tu paso.",
  },
  {
    idx: 13,
    nombre:
      "Una herida de batalla dejó una esquirla de metal acercándose lentamente a tu corazón. Todos los días hay un 2% de probabilidad de que lo alcance.",
  },
  {
    idx: 14,
    nombre:
      "La violencia te obligó a ir al desierto. Crees que los árboles que se agitan susurran. Hablas, gritas y atacas a los árboles.",
  },
  {
    idx: 15,
    nombre:
      "Maldito por compartir las pesadillas ajenas, duermes muy, muy lejos.",
  },
  {
    idx: 16,
    nombre:
      "En guerra permanente con todos los córvidos. Ningún contacto sin algo de violencia. Llevas una honda.",
  },
  {
    idx: 17,
    nombre:
      "Después de soñar con un templo subterráneo de un dios olvidado, comprendes los cantos de insectos y gusanos.",
  },
  {
    idx: 18,
    nombre:
      "Eres rastreado y observado por un gólem después de un acuerdo que sabes que ha sido borrado de tu mente.",
  },
  { idx: 19, nombre: '"Arder o ser quemado" es el destino que has aceptado.' },
  {
    idx: 20,
    nombre:
      'Tu carne se cura el doble de rápido, pero tus compañeros el doble de lento. Ves un "ángel de la guarda" de muchos ojos.',
  },
];
