// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface MorkBorgClassOpcion {
  numero: string;
  nombre: string;
  descripcion: string;
}

export interface MorkBorgClass {
  id: string;
  nombre: string;
  insignia: string;
  /** Párrafo de sabor */
  descripcion: string;
  /** Rasgos fijos: modificadores de atributos, habilidades pasivas, etc. */
  rasgos: string[];
  /** Encabezado que describe qué son las opciones */
  descripcionOpciones?: string;
  /** Lista de opciones numeradas (equipo, especialidades, poderes…) */
  opciones?: MorkBorgClassOpcion[];
}

// ─── Clases ───────────────────────────────────────────────────────────────────

export const MORK_BORG_CLASSES: MorkBorgClass[] = [
  {
    id: "sin-clase",
    nombre: "Sin clase",
    insignia: "SC",
    descripcion:
      "En este mundo hay quienes buscan la riqueza o la redención. Algunos dicen que del apocalipsis se puede escapar, que incluso se podría detener. Y ahí caminas entre la discordia y la desesperación.",
    rasgos: [],
  },

  {
    id: "desertor-colmilludo",
    nombre: "Desertor Colmilludo",
    insignia: "DC",
    descripcion:
      "Tienes una treintena de amigos que nunca te defraudan: TUS DIENTES. Desleal, trastornado o simplemente incontrolable, cualquier grupo que no te haya echado, lo dejaste de todos modos. Pero tu parlamento de dientes (enormes, salientes, gruesos y afilados), siempre ha sido tu aliado.",
    rasgos: [
      "Fuerte como un toro: tira 3d6+2 para Fuerza.",
      "No eres una lumbrera: tira 3d6−1 para Agilidad y Presencia. Las pruebas de Agilidad normales son CD14 en lugar de DR12, excluida la defensa.",
      "Analfabeto: eres incapaz de entender pergaminos. Si comienzas con uno, vuelve a tirar, cómetelo o úsalo como papel higiénico.",
      "Ataque de mordisco: CD10 para atacar, d6 de daño. Debes estar cerca de tu objetivo. 1-2 en d6 posibilidades de que el enemigo obtenga un ataque gratis.",
    ],
    descripcionOpciones: "Comienzas con uno de los siguientes:",
    opciones: [
      {
        numero: "1",
        nombre: "Máscara de monstruo arrugada",
        descripcion:
          "Infunde miedo primitivo en criaturas menores como goblins, gnoums y niños. Mientras la uses, harán pruebas de Moral en cada asalto.",
      },
      {
        numero: "2",
        nombre: "La cimitarra marrón de Galgenbeck",
        descripcion:
          "Una espada apestosa que sacaste de una letrina militar. Daño D6. DR10 ataque y defensa mientras la manejas. Hay una probabilidad de 1 entre 6 de que un enemigo herido sufra una potente sepsis y muera en 10 minutos.",
      },
      {
        numero: "3",
        nombre: "Dientes de mago",
        descripcion:
          "Cuatro extraños dientes traquetean dentro de una bolsa ennegrecida. Antes de la batalla, tira un d6 por cada uno. Por cada 6, uno de tus ataques causa el daño máximo.",
      },
      {
        numero: "4",
        nombre: "Honda del viejo Sigûrd",
        descripcion:
          "Sigûrd fue el hombre más fuerte al que le has roído la garganta. Tejida con su larga cabellera gris, esta honda nunca te ha fallado. 2d4 de daño, requiere rocas del tamaño de un puño que, quizás lamentablemente, están por todas partes.",
      },
      {
        numero: "5",
        nombre: "Viejo sabueso",
        descripcion:
          "Asmática, engañada y en sus últimas patas, esta criatura arrugada todavía tiene un olfato soberbio y puede olfatear tesoros en los escombros más repugnantes. Ataca con CD10 (mordisco d6). Defiende con CD12, 10 PV. Se vuelve frenético cuando hay goblins y berserkers alrededor.",
      },
      {
        numero: "6",
        nombre: "La herradura del caballo de la Muerte",
        descripcion:
          "Parece normal, pero desde que la encontraste en una oscura cripta estás convencido de que esta herradura proviene del mismísimo caballo de la Muerte. En tus manos golpea con CD10, d4 de daño. Hay una probabilidad de 1 entre 6 de que la herradura rompa el cráneo, matando instantáneamente a criaturas de tamaño pequeño o mediano. La herradura vuelve a tu mano como un bumerán.",
      },
    ],
  },

  {
    id: "escoria-alcantarillas",
    nombre: "Escoria nacida en las alcantarillas",
    insignia: "EAL",
    descripcion:
      "Una mala estrella sonrió tu nacimiento. La pobreza, el crimen y la mala crianza tampoco ayudaron. En tu comunidad, un día de trabajo honrado nunca fue una opción. No es que lo hayas probado alguna vez, ¿qué eres?, ¿algún tipo de tonto? Una hoja de afeitar y una noche sin luna vale tanto como una semana de trabajo inútil.",
    rasgos: [
      "Pequeño: tira 3d6−2 para Fuerza.",
      "Sigiloso: todas las pruebas de Presencia y Agilidad tienen su CD reducido en 2 (las pruebas normales son CD10 en lugar de CD12).",
      "Tira d6 en la tabla de armas y d2 en la tabla de armaduras.",
      "Mejora especial: la primera vez que mejores, lanza otra especialidad. A partir de la segunda, puedes volver a tirar una o las dos.",
    ],
    descripcionOpciones: "Comienzas con una especialidad:",
    opciones: [
      {
        numero: "1",
        nombre: "El pinchazo del cobarde",
        descripcion:
          "Al atacar por sorpresa, haz una prueba de Agilidad CD10. Si tienes éxito, golpeas automáticamente una vez con un arma ligera de una mano, lo que causa daño normal +3.",
      },
      {
        numero: "2",
        nombre: "Dedos sucios",
        descripcion:
          "Tus pequeños dedos serpenteantes se meten en los bolsillos y abren cerraduras con una prueba de Agilidad CD8. ¡También comienzas con ganzúas!",
      },
      {
        numero: "3",
        nombre: "Escupidor abominable",
        descripcion:
          "Tu flema es viscosa, grumosa, vil y balísticamente precisa a corta distancia. Puedes escupir d2 veces durante una pelea. Realiza una prueba de Presencia CD8 para atinar. Los objetivos quedan cegados, con arcadas y vómitos durante d4 asaltos. Cualquiera que sea testigo, amigos y enemigos, debe hacer una prueba de Resistencia para no vomitar también (CD10 para PJs, CD12 para enemigos).",
      },
      {
        numero: "4",
        nombre: "Escapar del destino",
        descripcion:
          "Cada vez que uses un presagio, hay un 50% de probabilidad de que no se gaste.",
      },
      {
        numero: "5",
        nombre: "Sigilo excretor",
        descripcion:
          "Tienes una habilidad asombrosa, casi sobrenatural, para esconderte en el lodo, los escombros y la suciedad. Cuando estás oculto en estas condiciones, se requiere una prueba de Presencia CD16 para descubrirte.",
      },
      {
        numero: "6",
        nombre: "Esquivar la muerte",
        descripcion:
          "Eres tan desagradable, irrelevante, repugnante y vil que incluso la Muerte preferiría evitarte si pudiera. Al morir, si existe la más mínima posibilidad de que hayas sobrevivido, hay un 50% de probabilidad de que lo hayas hecho. Si tienes éxito, después de 10 asaltos vuelves a aparecer con d4 PV y una explicación poco probable de tu escapatoria.",
      },
    ],
  },

  {
    id: "ermitano-esoterico",
    nombre: "Ermitaño esotérico",
    insignia: "EE",
    descripcion:
      "La piedra de tu cueva es una con las estrellas. Silencio y perfección. Ahora el caos de un mundo caído perturba tus rituales y la placenta de la noche se vuelve más negra que la penumbra de tu caverna. ¡Irritante!",
    rasgos: [
      "Sabio: tira 3d6+2 para Presencia.",
      "Débil: tira 3d6−2 para Fuerza.",
      "Equipo inicial ordinario más un pergamino aleatorio (sagrado o impuro).",
      "Tira un d4 en la tabla de armas y un d2 en la tabla de armaduras.",
    ],
    descripcionOpciones: "Comienzas con uno de los siguientes:",
    opciones: [
      {
        numero: "1",
        nombre: "Maestro del Destino",
        descripcion:
          "¿De qué sirven los mapas cuando la sustancia de la causalidad misma está abierta a ti? Conoces el camino correcto con una prueba de Presencia CD8.",
      },
      {
        numero: "2",
        nombre: "Un libro de sangre hirviendo",
        descripcion:
          "Puede abrir y leer este libro una vez al día. Tu enemigo debe realizar una prueba CD12 para evitarlo. Si falla, D2 berserker asesinos aparecen desde las profundidades de una dimensión de sangre olvidada. Tira un D6: con 1–4 luchan a tu lado; con 5-6 se vuelven contra ti intentando matarte y destruir el libro. Tras la batalla regresan a su encierro.",
      },
      {
        numero: "3",
        nombre: "Portavoz de verdades",
        descripcion:
          "Dos veces al día usa tu sabiduría, conocimiento, consejo y calma interior para aportar claridad a una criatura que elijas. La CD de la siguiente prueba que realice se reduce en 4.",
      },
      {
        numero: "4",
        nombre: "Iniciado del Colegio Invisible",
        descripcion:
          "Una vez al día puedes invocar D2 pergaminos cuyo poder solo se puede usar una vez. Tira un d4: con 1-2 los pergaminos son sagrados; con 3-4, impuros. Si no se usan antes del amanecer, se convierten en cenizas.",
      },
      {
        numero: "5",
        nombre: "Bardo de los Eternos",
        descripcion:
          "Aprendiste tus melodías en el Otro Mundo. La música de tu arpa da +D4 en las tiradas de reacción.",
      },
      {
        numero: "6",
        nombre: "Halcón como arma",
        descripcion:
          "Tu astuto halcón casi inteligente es leal solo a ti. Incluso sin compartir lenguaje, entiendes sus gritos mientras vigila, explora y ataca a los enemigos. Ataca/defiende CD10 (garras/mordisco D4), PV 8.",
      },
    ],
  },

  {
    id: "realeza-desgracia",
    nombre: "Realeza en desgracia",
    insignia: "RD",
    descripcion:
      "Abrumado solo por los recuerdos de tu propia gloria perdida, no podrías someterte a nadie más. ¡Tú no, de sangre noble! (No es que esperes que alguno de estos peones comprenda la profundidad de tu dolor.)",
    rasgos: [
      "Dolorosamente mediocre: no ajustas ninguna característica.",
      "Tira un d8 en la tabla de armas.",
      "Tira un d4 en la tabla de armaduras, pero vuelve a tirar si recibes una armadura pesada.",
    ],
    descripcionOpciones: "Comienzas con dos de los siguientes:",
    opciones: [
      {
        numero: "1",
        nombre: "La espada de tus antepasados",
        descripcion:
          "Esta magnífica y claramente mágica espada parlante es caprichosa, poco fiable y te desprecia en silencio. Se burla de tus fracasos y, si la decepcionas continuamente, tiene una probabilidad de 1 entre 6 de atacarte 'accidentalmente' a ti o a tus compañeros. Inflige d6+1 de daño. La CD de Ataque/Defensa es 10.",
      },
      {
        numero: "2",
        nombre: '"Poltroon" el bufón de la Corte',
        descripcion:
          "Si bien es prácticamente inútil, personalmente irritante y emocionalmente agotador, las cabriolas de Poltroon en realidad hacen que los enemigos pierdan la concentración en combate. Durante los dos primeros asaltos, tú y tus aliados obtenéis +2 en ataque/defensa.",
      },
      {
        numero: "3",
        nombre: "Barbarister el caballo increíble",
        descripcion:
          "Barbarister es mágico, inteligente, arrogante y vanidoso. También puede hablar. Si puedes persuadirle de que se involucre, Barbarister ocasionalmente suma +2 a las pruebas de Presencia que impliquen lógica e intelecto. El caballo puede ser más inteligente que tú y es muy consciente de ello.",
      },
      {
        numero: "4",
        nombre: "Hamfund el escudero",
        descripcion:
          "Este sirviente intensamente cobarde actúa solo como guardián de la vaina de la espada maldita Eurekia. Una vez por combate, si se puede encontrar a Ham, se puede desenvainar a Eurekia. La espada hace 2d6 de daño y por cada golpe tira un d6. Con un 1, el escudero muere y Eurekia desaparece para siempre.",
      },
      {
        numero: "5",
        nombre: "El regalo de piel de serpiente",
        descripcion:
          "Una costosa caja de sándalo revestida en piel de serpiente. Contiene una daga aparentemente normal, envuelta en seda. La daga hace d4 de daño pero con un 1 el objetivo muere inmediatamente por el veneno mortal que sale de la hoja.",
      },
      {
        numero: "6",
        nombre: "¡Cuerno de los señores de Schleswig!",
        descripcion:
          "Una vez al día, suelta un estruendo de esta vieja trompeta abollada y tira Presencia CD12. Una criatura puede hacer que su próxima prueba que no sea de combate sea un éxito automático.",
      },
    ],
  },

  {
    id: "sacerdote-hereje",
    nombre: "Sacerdote Hereje",
    insignia: "SH",
    descripcion:
      "Perseguido por los Basiliscos de Dos Cabezas de la Única Fe Verdadera, se puede encontrar a este hereje delirando en las ruinas, recorriendo interminablemente caminos polvorientos y profanando catedrales por la noche.",
    rasgos: [
      "Perspicaz: tira 3d6+2 para Presencia.",
      "Frágil: tira 3d6−2 para Fuerza.",
      "Tira un d8 en la tabla de armas y puedes usar Poderes mientras usas armadura media.",
    ],
    descripcionOpciones: "Comienzas con uno de los siguientes:",
    opciones: [
      {
        numero: "1",
        nombre: "Sagrado cayado del pastor",
        descripcion:
          "Su cabeza es un garfio de hueso humano con inscripciones de antioraciones superpuestas. Este cayado atraviesa otros mundos. El bastón hace 2d4 de daño excepto a los humanos infieles.",
      },
      {
        numero: "2",
        nombre: "Mitra robada",
        descripcion:
          "Mientras usa este sombrero sagrado, el infame cuerpo del sacerdote se desvanece, volviéndose difícil de golpear en combate (Defensa CD10). Si se coloca sobre las orejas fuera de la batalla, el sacerdote se vuelve casi invisible, tirando sigilo contra CD8.",
      },
      {
        numero: "3",
        nombre: "Lista de pecados",
        descripcion:
          "Un documento largo y preciso con referencias cruzadas con la realidad para descubrir malhechores invisibles. Presencia exitosa CD10: una luz extraña rodea a las criaturas malignas. El dueño de la lista se defiende con +2 contra cualquier ser descubierto de esta manera.",
      },
      {
        numero: "4",
        nombre: "La Biblia blasfema de Nechrubel",
        descripcion:
          "Tan intensamente blasfema que incluso los mismos sacerdotes solo pueden leerla una vez al día. Cuando se lee, lanza un dado. Resultado par: durante el resto del día, los PJs recuperan d4 PV después de solo cinco minutos de descanso. Resultado impar: el sacerdote sufre alucinaciones demoníacas durante el resto del día (el DM inventa d3 cosas que solo el sacerdote puede ver y las describe como verdaderas).",
      },
      {
        numero: "5",
        nombre: "Piedras del Templo Perdido de Thel-Emas",
        descripcion:
          "Arroja las piedras al suelo. Su patrón revela si el peligro acecha en una habitación adyacente. Las piedras pueden mentir. El sacerdote hace una prueba de Presencia CD10 para ver si son verdaderas, pero después de fallar no puede volver a probar hasta que se haya puesto el sol.",
      },
      {
        numero: "666",
        nombre: "Crucifijo (Jesús invertido)",
        descripcion:
          "El crucifijo se puede usar en encuentros con no muertos, así como con trolls y goblins menores. Tira por Moral (suma o resta el modificador de Presencia del sacerdote) para ver si las criaturas se inclinan y se retiran amablemente.",
      },
    ],
  },

  {
    id: "herborista-ocultista",
    nombre: "Herborista Ocultista",
    insignia: "HO",
    descripcion:
      "Nacido del hongo, criado en el claro, observado por el ojo de la luna en un estanque negro plateado.",
    rasgos: [
      "Duro como la madera: tira 3d6+2 para Resistencia.",
      "Bajo en proteínas: tira 3d6−2 para Fuerza.",
      "Tira d6 en la tabla de armas y d2 en la tabla de armaduras.",
      "Lleva un laboratorio portátil y busca continuamente los ingredientes que se gastan con frecuencia.",
      "Diariamente tiene materiales para crear dos decocciones determinadas al azar (d4 dosis cada una). Si no se usan, pierden vitalidad después de 24 horas.",
    ],
    descripcionOpciones:
      "Tabla de decocciones (tira 2 al día de forma aleatoria):",
    opciones: [
      {
        numero: "1",
        nombre: "Veneno rojo",
        descripcion: "Resistencia CD12 o −d10 PV.",
      },
      {
        numero: "2",
        nombre: "Vapores de Ezumiels",
        descripcion:
          "Pasa una prueba CD14 o alucinaciones graves (y posiblemente divertidas) durante d4 horas.",
      },
      {
        numero: "3",
        nombre: "Estofado de rana sureña",
        descripcion:
          "Vomita durante d4 horas; pasa una prueba CD14 o no puedes hacer nada más.",
      },
      {
        numero: "4",
        nombre: "Elixir Vitalis",
        descripcion: "Cura d6 PV y detiene la infección. Puede crear hábito.",
      },
      {
        numero: "5",
        nombre: "Sopa de araña-búho",
        descripcion:
          "Ver en la oscuridad y trepar por las paredes durante 30 minutos.",
      },
      {
        numero: "6",
        nombre: "Filtro de Fernor",
        descripcion:
          "Aceite translúcido, debe aplicarse directamente en el ojo. Cura la infección y da +2 en las pruebas de Presencia durante d4 horas.",
      },
      {
        numero: "7",
        nombre: "Rapé enervante de Hyphos",
        descripcion:
          "¡Berserker! Dos ataques por asalto pero defiende con CD14. Dura una pelea. Debe ser inhalado; provoca estornudos.",
      },
      {
        numero: "8",
        nombre: "Veneno negro",
        descripcion: "Resistencia CD14 o −d6 PV y cegado durante una hora.",
      },
    ],
  },
];
