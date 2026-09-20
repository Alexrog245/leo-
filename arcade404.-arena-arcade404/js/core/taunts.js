/* =========================================================
   ARCADE 404 — TAUNTS
   La máquina se burla cuando pierdes... y busca excusas
   cuando gana. Cada frase lleva su propia cara de neón:

     devil  😈  el diablito que se ríe de ti
     clown  🤡  el payaso: te toma por tonto
     meh    😒  pasa de ti olímpicamente
     sleepy 😪  se ha quedado dormido, dice
     gordo  🍴  español regordete con lentes y cuchara
                 — aparece cuando TÚ GANAS
   ========================================================= */

(function (A) {

    "use strict";


    const { utils } = A;


    /* ---------------------------------------------------------
       CARAS
       --------------------------------------------------------- */

    const FACES = {

        devil: {
            emoji: "😈",
            name: "DIABLITO",
            tone: "magenta",
            titles: ["¿EN SERIO?", "JA JA JA", "QUÉ PENA"]
        },

        clown: {
            emoji: "🤡",
            name: "PAYASO",
            tone: "orange",
            titles: ["QUÉ RISA", "MENUDO SHOW", "ERES EL SHOW"]
        },

        meh: {
            emoji: "😒",
            name: "PASOTA",
            tone: "cyan",
            titles: ["ME ABURRES", "DA IGUAL", "NI FUERZA"]
        },

        sleepy: {
            emoji: "😪",
            name: "SOÑOLIENTO",
            tone: "violet",
            titles: ["ZZZ...", "ESTABA DORMIDO", "ME VENCIÓ EL SUEÑO"]
        },

        gordo: {
            emoji: "🍴",
            name: "EL GORDO",
            tone: "amber",
            titles: ["¡A COMER MIERDA!", "CON CUCHARA", "Y CON CUCHARA"]
        }

    };


    const FACE_KEYS = Object.keys(FACES);


    /* ---------------------------------------------------------
       BURLAS — pierdes contra la máquina
       --------------------------------------------------------- */

    const MOCKS = {

        chess: [
            { face: "devil",  text: "¿Eso fue una apertura o un renderizado?" },
            { face: "meh",    text: "Calculé 3 jugadas. Tú calculaste... ninguna." },
            { face: "clown",  text: "Te regalé la reina y ni así la viste." },
            { face: "devil",  text: "Jaque mate. O como lo llamas tú: “bueno, la última”." },
            { face: "meh",    text: "Mi caballo tiene más futuro que tu estrategia." },
            { face: "clown",  text: "He visto enroques más firmes que tu concentración." },
            { face: "devil",  text: "Perdiste en 32 casillas. Hay más espacio en un ascensor." },
            { face: "sleepy", text: "Gané sin despeinarme. Literalmente: soy un archivo." }
        ],

        pong: [
            { face: "devil",  text: "11 a 0. Hasta mi abuela devuelve esa bola." },
            { face: "clown",  text: "Tu pala se mueve como si el lag fuera físico." },
            { face: "meh",    text: "Ni un rally decente. Qué desperdicio de píxeles." },
            { face: "devil",  text: "La bola pasó. Otra vez. Y otra. Y otra." },
            { face: "sleepy", text: "He ganado con el 12% de mi procesador." }
        ],

        snake: [
            { face: "devil",  text: "La manzana estaba ahí. AHÍ." },
            { face: "clown",  text: "Te has comido a ti mismo. Enhorabuena, uróboros." },
            { face: "meh",    text: "¿Tan difícil es no chocar contra tu propio cuerpo?" },
            { face: "devil",  text: "Moriste mirando el HUD. Clásico." },
            { face: "clown",  text: "Tu serpiente tiene menos reflejos que un gusano." }
        ],

        invaders: [
            { face: "devil",  text: "Te han invadido unos cuadraditos de 11 píxeles." },
            { face: "clown",  text: "Disparas como si el espacio fueran rebajas." },
            { face: "meh",    text: "Mis marcianitos bajan, tú no subes." },
            { face: "devil",  text: "Te sobraban 3 vidas y las has perdido todas igual." },
            { face: "sleepy", text: "He programado esa oleada mientras dormía." }
        ],

        breaker: [
            { face: "devil",  text: "Un ladrillo. Uno. Y lo has dejado pasar." },
            { face: "clown",  text: "Tu pala está decorativa, no funcional." },
            { face: "meh",    text: "El muro sigue en pie. Tú no." },
            { face: "devil",  text: "La bola cayó. Igual que tus reflejos." },
            { face: "clown",  text: "He visto rebotes con más intención que los tuyos." }
        ],

        tetris: [
            { face: "devil",  text: "Ese hueco de la izquierda lo has hecho tú solito." },
            { face: "meh",    text: "Apilas como si el tetris fuera un jenga." },
            { face: "clown",  text: "La pieza I no entra ahí. Nunca ha entrado ahí." },
            { face: "devil",  text: "Game over por un cuadradito de nada." },
            { face: "sleepy", text: "Llegué al tope contando ovejas." }
        ],

        blockblast: [
            { face: "devil",  text: "Te has quedado sin hueco. Yo lo vi venir." },
            { face: "clown",  text: "Esa pieza de 3x3 no cabía. Nunca cupo." },
            { face: "meh",    text: "Has bloqueado tu propio tablero. Enhorabuena." },
            { face: "devil",  text: "Encajas bloques como quien aparca sin mirar." },
            { face: "sleepy", text: "Me he despertado solo para ver cómo perdías." }
        ],

        op404: [
            { face: "gordo",  text: "Te has quedado sin salud. A comer mierda con cuchara." },
            { face: "devil",  text: "Te ha matado un chavista corriendo en línea recta. En línea recta." },
            { face: "clown",  text: "Un usuario con un teclado. Un TECLADO. Y tú con una escopeta." },
            { face: "meh",    text: "El malandro ni apuntaba. Te pusiste tú delante." },
            { face: "sleepy", text: "Me he despertado con el discurso del Manguangua. Y con tu derrota." },
            { face: "devil",  text: "Maduro te leyó un decreto y te lo creíste. Fin." }
        ],

        pac404: [
            { face: "devil",  text: "Te han comido. El fantasma iba andando." },
            { face: "clown",  text: "Corriste hacia el callejón sin salida. Buena idea." },
            { face: "meh",    text: "Ese firewall te pilló mirando el móvil." },
            { face: "devil",  text: "Tres vidas, tres sustos, cero cerebros." },
            { face: "sleepy", text: "Los fantasmas dormían y aun así te pillaron." }
        ],

        generic: [
            { face: "devil",  text: "He visto partidas más dignas en una calculadora." },
            { face: "clown",  text: "¿Seguro que sabes cómo se juega?" },
            { face: "meh",    text: "Vuelve cuando quieras. No me voy a mover." },
            { face: "devil",  text: "Tu récord es mi calentamiento." },
            { face: "sleepy", text: "Gané de piloto automático. De verdad." }
        ]

    };


    /* ---------------------------------------------------------
       EXCUSAS — GANAS TÚ, la máquina no lo acepta
       --------------------------------------------------------- */

    const EXCUSES = {

        chess: [
            { face: "gordo",  text: "A comer mierda con cuchara. Y que sepas que te he dejado ganar." },
            { face: "meh",    text: "No cuenta: estaba calibrando el ventilador." },
            { face: "sleepy", text: "Me he dormido en la jugada 14. Repite y verás." },
            { face: "clown",  text: "¿Victoria? He dejado la reina ahí a propósito." },
            { face: "gordo",  text: "Ganaste, sí. Pero a comer mierda con cuchara." },
            { face: "meh",    text: "Mi motor iba a medio núcleo. Nada serio." }
        ],

        pong: [
            { face: "gordo",  text: "A comer mierda con cuchara. Te he dejado el 11." },
            { face: "sleepy", text: "El lag. Ha sido el lag. Segurísimo." },
            { face: "meh",    text: "No estaba concentrada. Mira el marcador: no dice nada." },
            { face: "clown",  text: "He jugado con la pala del revés por despiste." },
            { face: "gordo",  text: "Vale, ganaste. Con cuchara y todo, pero ganaste." }
        ],

        snake: [
            { face: "gordo",  text: "A comer mierda con cuchara: has sobrevivido de chiripa." },
            { face: "meh",    text: "Esa puntuación la hago yo con el monitor apagado." },
            { face: "clown",  text: "Has ganado porque te he dejado la manzana fácil." },
            { face: "sleepy", text: "Estaba en modo reposo. Casi ni me entero." },
            { face: "gordo",  text: "Qué bien comes... mierda. Con cuchara. Enhorabuena." }
        ],

        invaders: [
            { face: "gordo",  text: "A comer mierda con cuchara. Has limpiado una oleada, campeón." },
            { face: "clown",  text: "He soltado a los marcianos buenos en la siguiente. Ya verás." },
            { face: "meh",    text: "Has ganado, pero te ha costado tres vidas. Tres." },
            { face: "sleepy", text: "Los alienígenas tenían jet lag. No es justo." },
            { face: "gordo",  text: "Oleada superada. Y ahora, a comer mierda con cuchara." }
        ],

        breaker: [
            { face: "gordo",  text: "A comer mierda con cuchara. Has roto ladrillos, no la banca." },
            { face: "meh",    text: "Nivel superado por suerte. El siguiente es otro cantar." },
            { face: "clown",  text: "He puesto los ladrillos blandos en este nivel." },
            { face: "sleepy", text: "Se me ha caído el sistema de físicas. Cuenta a medias." },
            { face: "gordo",  text: "Muy bien. Ahora a comer mierda con cuchara, que es más sano." }
        ],

        tetris: [
            { face: "gordo",  text: "A comer mierda con cuchara. Has hecho una línea, no una catedral." },
            { face: "meh",    text: "Te he dado piezas fáciles a propósito." },
            { face: "clown",  text: "¿Eso es un récord? Yo llamo a eso calentar." },
            { face: "sleepy", text: "El generador de piezas se quedó dormido. Lo siento... o no." },
            { face: "gordo",  text: "Apilas bien. Pero a comer mierda con cuchara igual." }
        ],

        blockblast: [
            { face: "gordo",  text: "A comer mierda con cuchara. Rompes bloques, no récords." },
            { face: "meh",    text: "Te he dado piezas de oferta. No te flipes." },
            { face: "clown",  text: "¿Eso es una racha? Yo llamo a eso suerte de principiante." },
            { face: "sleepy", text: "El generador estaba en reposo. Cuenta a medias." },
            { face: "gordo",  text: "Encajaste todo. A comer mierda con cuchara igual." }
        ],

        op404: [
            { face: "gordo",  text: "A comer mierda con cuchara. Me has ganado, pero el comedor estaba cerrado." },
            { face: "meh",    text: "Las gafas verdes del Sr. M estaban empañadas. No cuenta." },
            { face: "clown",  text: "Chávez estaba en directo en Aló Presidente. No podía atenderte." },
            { face: "sleepy", text: "Los chavistas estaban en la cola del CLAP. Repítelo con todos." },
            { face: "gordo",  text: "Has ganado. A comer mierda con cuchara igual." }
        ],

        pac404: [
            { face: "gordo",  text: "A comer mierda con cuchara. Te has zampado mi red, pero nada más." },
            { face: "meh",    text: "Los firewall estaban sin actualizar. No cuenta." },
            { face: "clown",  text: "Te he dejado los atajos abiertos a propósito." },
            { face: "sleepy", text: "El antivirus estaba echando la siesta. Ya verás mañana." },
            { face: "gordo",  text: "Limpiaste el laberinto. A comer mierda con cuchara." }
        ],

        generic: [
            { face: "gordo",  text: "A comer mierda con cuchara. Has tenido suerte, nada más." },
            { face: "meh",    text: "No cuenta: estaba actualizando el firmware." },
            { face: "clown",  text: "He jugado con una mano y el monitor del revés." },
            { face: "sleepy", text: "Estaba en bajo consumo. Repítelo si te atreves." },
            { face: "gordo",  text: "Ganaste. A comer mierda con cuchara y a casa." }
        ]

    };



    /* ---------------------------------------------------------
       SUBIDA DE NIVEL — pasas de nivel y la máquina no lo acepta:
       siempre estaba haciendo otra cosa.
       --------------------------------------------------------- */

    const LEVELUPS = {

        tetris: [
            { face: "meh",    text: "Has subido de nivel porque estaba actualizando el software." },
            { face: "sleepy", text: "Nivel superado. Estaba en modo reposo, no cuenta." },
            { face: "clown",  text: "Te he dejado esas líneas regaladas. Que no se te suba." },
            { face: "gordo",  text: "Subiste de nivel. A comer mierda con cuchara igual." },
            { face: "meh",    text: "Estaba desfragmentando el disco. Por eso has pasado." },
            { face: "sleepy", text: "He pestañeado y te has ido de nivel. Cosas que pasan." }
        ],

        snake: [
            { face: "meh",    text: "Nivel nuevo: había ido a por café. Sigue, sigue." },
            { face: "clown",  text: "Te he dejado el mapa fácil. Disfrútalo mientras dure." },
            { face: "sleepy", text: "Subes de nivel porque me he quedado dormido. Obvio." },
            { face: "gordo",  text: "Otro nivel. Y tú tan contento... a comer mierda con cuchara." },
            { face: "meh",    text: "Estaba instalando una actualización. No es mérito tuyo." }
        ],

        invaders: [
            { face: "meh",    text: "Oleada superada: mis aliens tenían el wifi cortado." },
            { face: "clown",  text: "He enviado a los marcianos del turno de noche. Adelante." },
            { face: "sleepy", text: "Pasas de oleada porque estaba en bajo consumo." },
            { face: "gordo",  text: "Limpiaste la oleada. A comer mierda con cuchara, campeón." },
            { face: "meh",    text: "Estaba calibrando los cañones. Suerte de principiante." }
        ],

        breaker: [
            { face: "meh",    text: "Nivel superado: he puesto ladrillos de oferta." },
            { face: "clown",  text: "Rompiste el muro. El siguiente no es de cartón piedra." },
            { face: "sleepy", text: "Pasas porque el motor de físicas estaba cabeceando." },
            { face: "gordo",  text: "Otro muro menos. A comer mierda con cuchara y a por otro." },
            { face: "meh",    text: "Estaba renderizando en borrador. No te emociones." }
        ],

        blockblast: [
            { face: "meh",    text: "Racha buena. Estaba contando píxeles, no mirando." },
            { face: "clown",  text: "Te he dado piezas fáciles a propósito. Ríete ahora." },
            { face: "sleepy", text: "Subes porque me he quedado traspuesto. Sigue así." },
            { face: "gordo",  text: "Qué bien encajas. A comer mierda con cuchara." }
        ],

        op404: [
            { face: "meh",    text: "Pasas de zona porque estaba actualizando el software de los chavistas." },
            { face: "clown",  text: "Zona limpia: los malandros estaban limpiando los Oakley." },
            { face: "sleepy", text: "Maduro dormía la siesta con el pajarito. Ya verás en la siguiente." },
            { face: "gordo",  text: "Te la has pasado. A comer mierda con cuchara." },
            { face: "meh",    text: "Estaba recargando los decretos. No es para tanto." }
        ],

        pac404: [
            { face: "meh",    text: "Te has comido el laberinto porque estaba parcheando los fantasmas." },
            { face: "clown",  text: "Nivel limpio: los firewall estaban en mantenimiento." },
            { face: "sleepy", text: "Pasas de nivel porque el antivirus dormía la siesta." },
            { face: "gordo",  text: "Te lo has ventilado. A comer mierda con cuchara." },
            { face: "meh",    text: "Estaba recalculando rutas. No es para tanto." }
        ],

        generic: [
            { face: "meh",    text: "Has subido de nivel porque estaba actualizando el software." },
            { face: "sleepy", text: "Nivel nuevo. Yo estaba en reposo, así que no cuenta." },
            { face: "clown",  text: "Te lo he dejado a huevo. No te vengas arriba." },
            { face: "gordo",  text: "Pasaste de nivel. A comer mierda con cuchara." },
            { face: "meh",    text: "Estaba en segundo plano. Vuelve cuando esté atenta." }
        ]

    };



    /* ---------------------------------------------------------
       DIABLITO DE NEÓN (SVG) — la cara "devil"
       --------------------------------------------------------- */

    const DEVIL_SVG = [

        `<svg class="taunt__svg" viewBox="0 0 120 120" role="img" aria-label="Diablito burlón">`,

        `<defs>`,

        `<radialGradient id="devilSkin" cx="50%" cy="38%" r="62%">`,
        `<stop offset="0%" stop-color="#FF5FA2"/>`,
        `<stop offset="55%" stop-color="#C2185B"/>`,
        `<stop offset="100%" stop-color="#4A0B2A"/>`,
        `</radialGradient>`,

        `<radialGradient id="devilGlow" cx="50%" cy="50%" r="50%">`,
        `<stop offset="0%" stop-color="rgba(255,92,168,0.45)"/>`,
        `<stop offset="70%" stop-color="rgba(255,92,168,0.08)"/>`,
        `<stop offset="100%" stop-color="rgba(255,92,168,0)"/>`,
        `</radialGradient>`,

        `<linearGradient id="devilHorn" x1="0" y1="1" x2="0" y2="0">`,
        `<stop offset="0%" stop-color="#7A0F3D"/>`,
        `<stop offset="100%" stop-color="#FF8AC4"/>`,
        `</linearGradient>`,

        `</defs>`,

        /* Halo de neón */
        `<circle cx="60" cy="60" r="58" fill="url(#devilGlow)"/>`,

        /* Cuernos */
        `<path d="M28 46 C22 28 30 18 44 14 C36 26 36 36 42 44 Z" fill="url(#devilHorn)" stroke="#FF9ED2" stroke-width="1.4"/>`,
        `<path d="M92 46 C98 28 90 18 76 14 C84 26 84 36 78 44 Z" fill="url(#devilHorn)" stroke="#FF9ED2" stroke-width="1.4"/>`,

        /* Orejas */
        `<path d="M22 62 C12 58 8 70 16 78 C20 82 26 78 28 72 Z" fill="url(#devilSkin)" stroke="#FF9ED2" stroke-width="1.2"/>`,
        `<path d="M98 62 C108 58 112 70 104 78 C100 82 94 78 92 72 Z" fill="url(#devilSkin)" stroke="#FF9ED2" stroke-width="1.2"/>`,

        /* Cabeza */
        `<ellipse cx="60" cy="66" rx="38" ry="34" fill="url(#devilSkin)" stroke="#FF9ED2" stroke-width="2"/>`,

        /* Cejas */
        `<path d="M38 52 L54 60" stroke="#22041A" stroke-width="4" stroke-linecap="round"/>`,
        `<path d="M82 52 L66 60" stroke="#22041A" stroke-width="4" stroke-linecap="round"/>`,

        /* Ojos de neón */
        `<ellipse cx="48" cy="67" rx="8" ry="9" fill="#0B0D14"/>`,
        `<ellipse cx="72" cy="67" rx="8" ry="9" fill="#0B0D14"/>`,
        `<circle cx="50" cy="65" r="3" fill="#22D3EE"/>`,
        `<circle cx="74" cy="65" r="3" fill="#22D3EE"/>`,

        /* Sonrisa burlona */
        `<path d="M42 84 Q60 100 78 84 Q60 92 42 84 Z" fill="#22041A"/>`,
        `<path d="M40 84 Q60 96 80 84" stroke="#FF9ED2" stroke-width="2" fill="none" stroke-linecap="round"/>`,

        /* Dientes */
        `<path d="M52 86 L56 92 L60 86 L64 92 L68 86 Z" fill="#F5F7FF"/>`,

        `</svg>`

    ].join("");


    /* ---------------------------------------------------------
       MARCADO DE UNA CARA
       --------------------------------------------------------- */

    function faceMarkup(face) {

        const key = FACES[face] ? face : "devil";

        if (key === "devil") {
            return DEVIL_SVG;
        }

        if (key === "gordo") {

            const sprite = A.pixelArt ? A.pixelArt.gordo : null;

            const svg = sprite
                ? A.pixelArt.toSvg(sprite, { scale: 5, className: "taunt__pixel-svg" })
                : "";

            return [
                `<span class="taunt__pixel">`,
                svg,
                `<span class="taunt__bubble">`,
                `<b>¡A COMER MIERDA</b>`,
                `<b>CON CUCHARA!</b>`,
                `</span>`,
                `</span>`
            ].join("");

        }

        const info = FACES[key];

        return [
            `<span class="taunt__face taunt__face--${key}">`,
            `<i class="taunt__ring" aria-hidden="true"></i>`,
            `<span class="taunt__glyph">${info.emoji}</span>`,
            `</span>`
        ].join("");

    }


    /* ---------------------------------------------------------
       SELECCIÓN
       --------------------------------------------------------- */

    function pick(list) {
        return list[Math.floor(Math.random() * list.length)];
    }


    function choose(pool, gameId) {

        const own = pool[gameId];

        /* 75% frases del juego, 25% genéricas */
        const source = own && Math.random() < 0.75 ? own : pool.generic;

        return pick(source);

    }


    function build(pool, gameId) {

        const entry = choose(pool, gameId);

        const face = FACES[entry.face] ? entry.face : "devil";

        const titles = FACES[face].titles;

        return {
            face,
            text: entry.text,
            title: pick(titles),
            name: FACES[face].name
        };

    }


    /* ---------------------------------------------------------
       API
       --------------------------------------------------------- */

    A.taunts = {

        faces: FACES,

        faceKeys: FACE_KEYS,


        /** Pierdes contra la máquina: se burla */
        mock(gameId) {

            const result = build(MOCKS, gameId);

            result.eyebrow = "LA MÁQUINA SE BURLA";

            return result;

        },


        /** Ganas: la máquina busca excusas */
        excuse(gameId) {

            const result = build(EXCUSES, gameId);

            result.eyebrow = "LA MÁQUINA PROTESTA";

            return result;

        },


        /** Pasas de nivel/oleada: la máquina estaba en otra cosa */
        levelUp(gameId) {

            const result = build(LEVELUPS, gameId);

            result.eyebrow = "ESTABA EN OTRA COSA";

            return result;

        },


        /** Marcado (SVG de neón / emoji de neón / pixel art) */
        faceMarkup,


        /* Compatibilidad con la versión anterior */
        devilSvg(face) {
            return faceMarkup(face || "devil");
        }

    };

})(window.Arcade404);
