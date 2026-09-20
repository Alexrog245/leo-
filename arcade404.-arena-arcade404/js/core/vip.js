/* =========================================================
   ARCADE 404 — VIP CENTRAL
   Economía persistente, accesos de campaña y compañeros.

   La moneda global vive aparte de los bolívares/materiales propios de
   OPERACIÓN 404. Todas las mutaciones pasan por esta única capa para que
   comprar suministros, entrar a un turno y recibir la recompensa de una
   partida sean operaciones atómicas incluso con localStorage bloqueado.
   ========================================================= */

(function (A) {

    "use strict";


    const STORE_KEY = "vip-central:v1";
    /* El almacenamiento conserva su clave v1 para migrar perfiles previos;
       el esquema 4 añade el estado del vale manual de pruebas, sin regalar
       saldo durante la carga de un perfil. */
    const VERSION = 4;
    const CONVERSATION_LIMIT = 5;
    const PREVIEW_TEST_STIPEND = 10000;
    const PREVIEW_TEST_STIPEND_LABEL = "VALE ÚNICO DE PRUEBAS ARENA";

    /* Las dos campañas quedan abiertas mientras se afinan. Conservamos el
       catálogo y los pases ya guardados para no destruir perfiles, pero no
       se piden, descuentan ni venden tickets hasta que se active otra vez. */
    const CAMPAIGN_TICKETS_ENABLED = false;

    const TICKET_GAMES = {
        op404: {
            id: "op404",
            name: "OPERACIÓN 404",
            price: 28,
            icon: "◈",
            description: "Un acceso de campo. Se consume al iniciar una incursión."
        },
        turno404: {
            id: "turno404",
            name: "TURNO 404",
            price: 30,
            icon: "◐",
            description: "Un acceso de guardia. Se consume al iniciar una noche."
        }
    };

    const GAME_NAMES = {
        snake: "SNAKE",
        invaders: "INVADERS",
        pong: "PONG",
        breaker: "BREAKER",
        tetris: "TETRIS",
        chess: "CHESS",
        blockblast: "BLOCK BLAST",
        pac404: "PAC 404",
        op404: "OPERACIÓN 404",
        turno404: "TURNO 404"
    };

    const ITEM_CATALOG = {
        "op-kit": {
            id: "op-kit",
            game: "op404",
            name: "KIT DE CAMPO",
            price: 20,
            icon: "▣",
            description: "+1 bolsa CLAP y escudo breve al entrar a OPERACIÓN 404.",
            useLabel: "SE APLICA AL PRÓXIMO OPERACIÓN 404"
        },
        "turno-cafe": {
            id: "turno-cafe",
            game: "turno404",
            name: "CAFÉ DE GUARDIA",
            price: 18,
            icon: "☕",
            description: "+10 energía y −8 pánico al empezar TURNO 404.",
            useLabel: "SE APLICA AL PRÓXIMO TURNO 404"
        },
        "turno-buffer": {
            id: "turno-buffer",
            game: "turno404",
            name: "BUFFER DE CLIENTES",
            price: 24,
            icon: "▤",
            description: "Añade margen para responder un mensaje de cliente durante TURNO 404.",
            useLabel: "SE APLICA AL PRÓXIMO TURNO 404"
        }
    };

    /* Cada persona tiene una voz y lectura propia para cada ROM. La reacción
       se muestra al empezar y se remata según el resultado de la partida. */
    const COMPANIONS = {
        rog: {
            id: "rog",
            name: "ROG",
            role: "TACTICIAN / RESPALDO",
            color: "#38BDF8",
            cost: 58,
            portrait: "character.rog.full",
            favorite: { name: "CUADERNO DE RUTAS", price: 17, affinity: 24, icon: "▤" },
            perk: "En TURNO 404 aporta energía de respaldo; en OPERACIÓN 404, escudo táctico.",
            reactions: {
                snake: "La ruta parece simple hasta que un giro cuesta toda la partida.",
                invaders: "Prioriza espacios y no persigas cada destello; es cálculo, no heroísmo.",
                pong: "Devuelve al centro. La pared nunca se equivoca, nosotros sí.",
                breaker: "Una grieta ordenada derriba más que un golpe desesperado.",
                tetris: "Deja una salida. Siempre deja una salida.",
                chess: "Piensa dos movimientos más allá, aunque eso me haga pensar tres veces de más.",
                blockblast: "No llenes el tablero por impulso; conserva una esquina limpia.",
                pac404: "Las rutas tienen esquinas ciegas. Cuenta las salidas antes de correr.",
                op404: "Te cubro la espalda. Tú mira al frente y no gastes el último cartucho.",
                turno404: "Yo llevo el cálculo de energía. Tú escucha qué acceso cambia de tono."
            }
        },
        desire: {
            id: "desire",
            name: "DESIRE",
            role: "LUZ / ÁNIMO",
            color: "#F472B6",
            cost: 74,
            portrait: "character.desire.full",
            favorite: { name: "FLOR DE NEÓN", price: 20, affinity: 26, icon: "✦" },
            perk: "En TURNO 404 baja el pánico inicial; en OPERACIÓN 404 protege con una luz breve.",
            reactions: {
                snake: "Despacio, amor: hasta una línea pequeña merece una ruta bonita.",
                invaders: "No dejes que esas luces te intimiden, amor. Respira y apunta.",
                pong: "Cada rebote es otra oportunidad, amor. No mires el marcador todavía.",
                breaker: "Hazlo sonar bonito cuando rompas el último bloque, amor.",
                tetris: "No pasa nada si toca reordenar, amor; aún cabe algo de calma.",
                chess: "No entregues una pieza por miedo, amor. Haz que te persigan a ti.",
                blockblast: "Guarda ese huequito, amor. Te va a salvar cuando todo parezca lleno.",
                pac404: "No corras sin mirar atrás, amor. Las luces también pueden guiarte.",
                op404: "Luz lista, amor. Si se pone feo, vuelves a mí y respiramos un segundo.",
                turno404: "Estoy en la luz, amor. Si el vidrio se mueve, no cierres los ojos."
            }
        },
        davinchi: {
            id: "davinchi",
            name: "DAVINCHI",
            role: "SISTEMAS / DUCTOS",
            color: "#A3E635",
            cost: 82,
            portrait: "character.davinchi.full",
            favorite: { name: "PEDAL DE DISTORSIÓN", price: 22, affinity: 26, icon: "♬" },
            perk: "En TURNO 404 abarata la descarga del ducto; en OPERACIÓN 404 entrega munición técnica.",
            reactions: {
                snake: "Ese cable vivo no perdona curvas tarde, yeah. Lee el ritmo antes del giro.",
                invaders: "Los patrones bajan en compás. Rompe el beat y rompe la fila, yeah.",
                pong: "Pégale con ángulo, no con rabia. Física con guitarra, yeah.",
                breaker: "Encuentra el amplificador del rebote y deja que el muro haga el solo, yeah.",
                tetris: "No apiles ruido. Haz una base y suelta la pieza en el tiempo justo, yeah.",
                chess: "Ese caballo entra como riff raro: no lo ignores porque suene extraño, yeah.",
                blockblast: "Combina líneas como pedales: una limpia abre la siguiente, yeah.",
                pac404: "Los túneles son cables largos. Si vibran, cambia de canal, yeah.",
                op404: "Te dejé una reserva técnica. Que cada disparo tenga un motivo, yeah.",
                turno404: "Ducto, luz y cámaras sincronizados. Si chirría arriba, V sin pensarlo, yeah."
            }
        },
        sil: {
            id: "sil",
            name: "SIL",
            role: "DATOS / SEÑAL",
            color: "#FB923C",
            cost: 96,
            portrait: "character.sil.full",
            favorite: { name: "LLAVE CIFRADA", price: 24, affinity: 28, icon: "⌘" },
            perk: "En TURNO 404 amplía el tiempo para clientes; en OPERACIÓN 404 localiza efectivo útil.",
            reactions: {
                snake: "El patrón ya existe. Observa dos giros y deja de adivinar.",
                invaders: "Cada columna tiene latencia. Ataca la que deje el siguiente hueco.",
                pong: "La trayectoria es información. La raqueta solo ejecuta lo que decides.",
                breaker: "Los bloques repiten una matriz. Busca la celda que altera toda la tabla.",
                tetris: "Una línea no es progreso si bloquea dos decisiones futuras.",
                chess: "No hay jugada aislada; mide quién queda sin datos después del intercambio.",
                blockblast: "El tablero te está diciendo dónde no jugar. Escúchalo.",
                pac404: "El mapa tiene ciclos. Rompe el ciclo, no persigas el punto brillante.",
                op404: "Marcadores de efectivo útiles en tu ruta. No confundas ruido con recursos.",
                turno404: "Los mensajes reales llevan un pulso distinto. Responde los que sí son clientes."
            }
        },
        colinas: {
            id: "colinas",
            name: "SR. DE LAS COLINAS",
            role: "CONTACTOS / BENEFICIOS",
            color: "#FBBF24",
            cost: 118,
            portrait: "character.colinas.full",
            favorite: { name: "PASE DE GALA", price: 29, affinity: 30, icon: "◆" },
            perk: "Aumenta ligeramente las FICHAS VIP al terminar y aporta efectivo local en OPERACIÓN 404.",
            reactions: {
                snake: "Una ruta elegante evita las paredes. Claramente un concepto de acceso preferente.",
                invaders: "Qué fila tan insistente. Un pase VIP a la salida habría ahorrado esto.",
                pong: "El rebote tiene clase cuando vuelve del lado correcto. El mío, naturalmente.",
                breaker: "Rompe lo necesario, no todo. La exclusividad se nota en lo que dejas intacto.",
                tetris: "Ese bloque merece una colocación premium, no una esquina cualquiera.",
                chess: "La corona se protege con logística. Lo demás es decoración de tablero.",
                blockblast: "Un tablero ordenado es la única sala VIP que no cobra servicio.",
                pac404: "Los fantasmas no conocen membresías. Qué sistema tan poco selecto.",
                op404: "Hay liquidez donde otros ven escombros. Úsala con una dignidad razonable.",
                turno404: "Si el cliente insiste, atiéndelo. Hasta el pánico necesita una recepción presentable."
            }
        }
    };

    const LEVELS = [
        { level: 1, at: 0, title: "CONTACTO" },
        { level: 2, at: 25, title: "CONFIANZA" },
        { level: 3, at: 72, title: "SINCRONÍA" },
        { level: 4, at: 145, title: "VÍNCULO" },
        { level: 5, at: 250, title: "LEYENDA" }
    ];

    /* Cinco bloques cerrados por integrante. El cliente puede mostrar las
       opciones, pero la economía valida el turno actual y anota la respuesta
       para que la afinidad no se pueda farmear recargando la sala. */
    const DIALOGUE_TRIVIA = {
        desire: [
            {
                fact: "Cuando una ronda pesa, Desire prefiere encender una luz y recuperar el aire antes de pedir otro intento.",
                question: "¿Qué propone Desire si todo empieza a oscurecerse?",
                choices: [
                    { id: "luz", text: "Encender una luz y respirar" },
                    { id: "multa", text: "Cobrar una multa de acceso" },
                    { id: "ducto", text: "Abrir todos los ductos" }],
                answer: "luz"
            },
            {
                fact: "Su detalle favorito en el canal es una Flor de Neón: pequeña, brillante y hecha para recordar que alguien está ahí.",
                question: "¿Qué regalo acerca más a Desire?",
                choices: [
                    { id: "flor", text: "Una Flor de Neón" },
                    { id: "llave", text: "Una Llave Cifrada" },
                    { id: "pedal", text: "Un Pedal de Distorsión" }],
                answer: "flor"
            },
            {
                fact: "En TURNO 404, su luz no es adorno: ayuda a contener el pánico cuando el vidrio y el pasillo cambian de tono.",
                question: "¿Qué recurso refuerza Desire durante TURNO 404?",
                choices: [
                    { id: "panico", text: "La calma frente al pánico" },
                    { id: "efectivo", text: "El efectivo local" },
                    { id: "ticket", text: "El ticket de entrada" }],
                answer: "panico"
            },
            {
                fact: "En OPERACIÓN 404, Desire acompaña con una protección luminosa para que el equipo tenga un segundo más de margen.",
                question: "¿Cómo protege Desire en OPERACIÓN 404?",
                choices: [
                    { id: "escudo", text: "Con una luz de escudo" },
                    { id: "mapa", text: "Con un mapa de jefes" },
                    { id: "cafe", text: "Con café de guardia" }],
                answer: "escudo"
            },
            {
                fact: "Su forma de hablar busca cuidar sin apagar la alerta; por eso suele recordar que incluso una ruta difícil merece calma.",
                question: "¿Qué apelativo usa Desire con más frecuencia?",
                choices: [
                    { id: "amor", text: "Amor" },
                    { id: "jefe", text: "Jefe" },
                    { id: "cliente", text: "Cliente" }],
                answer: "amor"
            }
        ],
        davinchi: [
            {
                fact: "Davinchi entiende los ductos, accesos y ritmos como partes de un mismo sistema que hay que sincronizar.",
                question: "¿Qué área le gusta sincronizar a Davinchi?",
                choices: [
                    { id: "ductos", text: "Ductos y accesos" },
                    { id: "flores", text: "Flores y vitrinas" },
                    { id: "facturas", text: "Facturas de gala" }],
                answer: "ductos"
            },
            {
                fact: "Su objeto favorito es un Pedal de Distorsión; lo trata como si una ruta técnica también pudiera tener buen ritmo.",
                question: "¿Qué objeto prefiere Davinchi?",
                choices: [
                    { id: "pedal", text: "Pedal de Distorsión" },
                    { id: "cuaderno", text: "Cuaderno de Rutas" },
                    { id: "flor", text: "Flor de Neón" }],
                answer: "pedal"
            },
            {
                fact: "Mientras afinamos los sistemas, Davinchi dejó OPERACIÓN 404 y TURNO 404 con acceso directo: mejor probar el circuito completo que cobrar un pase inútil.",
                question: "¿Cómo se entra ahora a las campañas?",
                choices: [
                    { id: "directo", text: "Con acceso abierto" },
                    { id: "pase", text: "Comprando un pase" },
                    { id: "espera", text: "Esperando otro desbloqueo" }],
                answer: "directo"
            },
            {
                fact: "En OPERACIÓN 404 deja una reserva de munición técnica: menos disparos al azar y más soluciones con intención.",
                question: "¿Qué apoyo entrega Davinchi en OPERACIÓN 404?",
                choices: [
                    { id: "balas", text: "Munición técnica" },
                    { id: "panico", text: "Reducción de pánico" },
                    { id: "dinero", text: "Efectivo de ruta" }],
                answer: "balas"
            },
            {
                fact: "Cuando una conexión chirría, Davinchi suele cerrar la idea con la misma muletilla que usa para marcar el ritmo.",
                question: "¿Qué muletilla caracteriza a Davinchi?",
                choices: [
                    { id: "yeah", text: "Yeah" },
                    { id: "amor", text: "Amor" },
                    { id: "vip", text: "Exclusivo" }],
                answer: "yeah"
            }
        ],
        rog: [
            {
                fact: "Rog no empieza una ruta sin contar sus salidas. Para él, un plan sirve si todavía queda una esquina limpia para regresar.",
                question: "¿Qué revisa Rog antes de entrar?",
                choices: [
                    { id: "salida", text: "Las rutas y salidas" },
                    { id: "precio", text: "El precio del sofá" },
                    { id: "reflejo", text: "El reflejo de la alfombra" }],
                answer: "salida"
            },
            {
                fact: "Su regalo favorito es el Cuaderno de Rutas, porque un dato anotado puede salvar más que una reacción desesperada.",
                question: "¿Qué detalle valora Rog?",
                choices: [
                    { id: "cuaderno", text: "Cuaderno de Rutas" },
                    { id: "gala", text: "Pase de Gala" },
                    { id: "llave", text: "Llave Cifrada" }],
                answer: "cuaderno"
            },
            {
                fact: "En OPERACIÓN 404, Rog se encarga del respaldo táctico y deja un escudo breve para cubrir una decisión difícil.",
                question: "¿Qué entrega Rog en OPERACIÓN 404?",
                choices: [
                    { id: "escudo", text: "Escudo táctico" },
                    { id: "cafe", text: "Café de guardia" },
                    { id: "pase", text: "Un pase de gala" }],
                answer: "escudo"
            },
            {
                fact: "En TURNO 404 su apoyo se traduce en energía de respaldo, útil cuando la oficina pide más de lo que debería.",
                question: "¿Qué estadística refuerza Rog en TURNO 404?",
                choices: [
                    { id: "energia", text: "Energía" },
                    { id: "fichas", text: "Fichas VIP" },
                    { id: "puntos", text: "Puntos de historia" }],
                answer: "energia"
            },
            {
                fact: "Su consejo aparece incluso bajo presión: conservar el último recurso puede abrir la salida que todavía no se ve.",
                question: "¿Qué aconseja Rog no gastar por impulso?",
                choices: [
                    { id: "ultimo", text: "El último recurso" },
                    { id: "tiempo", text: "El tiempo de carga" },
                    { id: "ticket", text: "El título del juego" }],
                answer: "ultimo"
            }
        ],
        sil: [
            {
                fact: "Sil confía en los patrones antes que en la intuición apresurada: dos señales claras valen más que una corazonada ruidosa.",
                question: "¿Qué prefiere Sil antes de decidir?",
                choices: [
                    { id: "datos", text: "Leer datos y patrones" },
                    { id: "suerte", text: "Confiar en la suerte" },
                    { id: "lujo", text: "Comprar el objeto más caro" }],
                answer: "datos"
            },
            {
                fact: "Su objeto favorito es la Llave Cifrada, porque abrir una señal útil requiere precisión y no sólo fuerza.",
                question: "¿Qué regalo conecta con Sil?",
                choices: [
                    { id: "llave", text: "Llave Cifrada" },
                    { id: "flor", text: "Flor de Neón" },
                    { id: "pedal", text: "Pedal de Distorsión" }],
                answer: "llave"
            },
            {
                fact: "En OPERACIÓN 404, Sil marca efectivo útil en la ruta para que el equipo no confunda recursos con ruido.",
                question: "¿Qué localiza Sil en OPERACIÓN 404?",
                choices: [
                    { id: "efectivo", text: "Efectivo útil" },
                    { id: "piezas", text: "Piezas de ajedrez" },
                    { id: "flores", text: "Flores de neón" }],
                answer: "efectivo"
            },
            {
                fact: "En TURNO 404 puede ampliar el margen para contestar mensajes de clientes que sí merecen respuesta.",
                question: "¿Qué amplía Sil durante TURNO 404?",
                choices: [
                    { id: "margen", text: "El margen de respuesta" },
                    { id: "peligro", text: "El peligro del ducto" },
                    { id: "precio", text: "El precio de tickets" }],
                answer: "margen"
            },
            {
                fact: "Para Sil, una señal limpia puede convertirse en movimiento si primero se separa el dato importante del ruido.",
                question: "¿Qué separa Sil antes de actuar?",
                choices: [
                    { id: "ruido", text: "El dato útil del ruido" },
                    { id: "equipo", text: "El equipo de la sala" },
                    { id: "score", text: "El score del tablero" }],
                answer: "ruido"
            }
        ],
        colinas: [
            {
                fact: "Colinas se toma la logística como un ritual: una entrada clara y una salida preparada son, para él, la base de cualquier privilegio útil.",
                question: "¿Qué cuida Colinas antes de una campaña?",
                choices: [
                    { id: "logistica", text: "Acceso y logística" },
                    { id: "ductos", text: "Sólo los ductos" },
                    { id: "ruido", text: "El ruido del arcade" }],
                answer: "logistica"
            },
            {
                fact: "Su obsequio favorito es el Pase de Gala: no por la pose, sino porque convierte una invitación en una ruta preparada.",
                question: "¿Qué regalo aprecia Colinas?",
                choices: [
                    { id: "gala", text: "Pase de Gala" },
                    { id: "cafe", text: "Café de guardia" },
                    { id: "cuaderno", text: "Cuaderno de Rutas" }],
                answer: "gala"
            },
            {
                fact: "Cuando acompaña una partida, Colinas mejora ligeramente la conversión de FICHAS VIP al cierre.",
                question: "¿Qué mejora Colinas al terminar una partida?",
                choices: [
                    { id: "fichas", text: "La ganancia de Fichas VIP" },
                    { id: "panico", text: "El pánico inicial" },
                    { id: "balas", text: "La munición técnica" }],
                answer: "fichas"
            },
            {
                fact: "En OPERACIÓN 404 su contacto útil aparece como efectivo local para que una buena ruta tenga recursos concretos.",
                question: "¿Qué aporta Colinas en OPERACIÓN 404?",
                choices: [
                    { id: "efectivo", text: "Efectivo local" },
                    { id: "escudo", text: "Escudo táctico" },
                    { id: "luz", text: "Luz contra el vidrio" }],
                answer: "efectivo"
            },
            {
                fact: "Su estilo puede ser ostentoso, pero su principio es simple: la eficiencia también merece verse bien.",
                question: "¿Qué idea repite Colinas sobre la eficiencia?",
                choices: [
                    { id: "gusto", text: "Que también puede tener buen gusto" },
                    { id: "miedo", text: "Que debe dar miedo" },
                    { id: "silencio", text: "Que debe quedarse en silencio" }],
                answer: "gusto"
            }
        ]
    };

    /* Habilidad transversal: desde Confianza, el Companion equipado abre
       una breve ventana de foco en cualquier ROM con la tecla Y. En OP404
       además se representa como mascota caminante dentro del mapa; los
       apoyos propios de OP404/TURNO404 siguen escalando por nivel. */
    const MINI_SUPPORT = {
        rog: {
            label: "RUTA CLARA",
            watch: "LEYENDO RUTA",
            focus: "RUTA EN FOCO",
            win: "SALIDA LIMPIA",
            loss: "RECALCULANDO",
            timeScale: 0.48
        },
        desire: {
            label: "LUZ DE APOYO",
            watch: "MANTÉN LA LUZ",
            focus: "LUZ EN FOCO",
            win: "BRILLASTE",
            loss: "RESPIRA",
            timeScale: 0.52
        },
        davinchi: {
            label: "SYNC TÉCNICO",
            watch: "SINCRONIZANDO",
            focus: "RITMO EN FOCO",
            win: "BEAT LIMPIO",
            loss: "AJUSTANDO",
            timeScale: 0.46
        },
        sil: {
            label: "LECTURA LIMPIA",
            watch: "LEYENDO DATOS",
            focus: "SEÑAL EN FOCO",
            win: "DATO CONFIRMADO",
            loss: "NUEVA LECTURA",
            timeScale: 0.5
        },
        colinas: {
            label: "VENTANA VIP",
            watch: "OBSERVANDO",
            focus: "VENTANA ABIERTA",
            win: "CIERRE ELEGANTE",
            loss: "REVISANDO CUENTAS",
            timeScale: 0.5
        }
    };

    const listeners = new Set();

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function defaultState() {
        const companions = {};

        Object.keys(COMPANIONS).forEach((id) => {
            companions[id] = {
                unlocked: false,
                affinity: 0,
                games: 0,
                gifts: 0,
                trivia: { answered: 0, correct: 0, incorrect: 0, completed: false }
            };
        });

        return {
            version: VERSION,
            /* Un perfil nuevo parte sin saldo. La forma de los pases se
               conserva para migrar perfiles antiguos, aunque las campañas
               están abiertas durante los ajustes actuales. */
            fichas: 0,
            totalEarned: 0,
            tickets: { op404: 0, turno404: 0 },
            inventory: Object.keys(ITEM_CATALOG).reduce((out, id) => {
                out[id] = 0;
                return out;
            }, {}),
            companions,
            activeCompanion: null,
            /* La introducción de la sala es por perfil local: se reproduce
               al primer acceso y siempre puede revisitarse desde la sala. */
            vipIntroSeen: false,
            /* Sólo registra si el vale manual de QA ya fue canjeado. Nunca
               altera el saldo inicial ni se activa al cargar el preview. */
            previewTestStipendClaimed: false,
            runs: {},
            ledger: []
        };
    }

    function normalizeTrivia(source) {
        const input = source && typeof source === "object" ? source : {};
        const answered = Math.max(0, Math.min(CONVERSATION_LIMIT,
            Math.floor(Number(input.answered) || 0)));
        const correct = Math.max(0, Math.min(answered,
            Math.floor(Number(input.correct) || 0)));
        /* Cada bloque es una respuesta definitiva: las equivocadas son el
           resto de las respondidas, incluso si un guardado viejo no traía
           aún esta clave. */
        const incorrect = Math.max(0, answered - correct);

        return {
            answered,
            correct,
            incorrect,
            completed: answered >= CONVERSATION_LIMIT
        };
    }


    function isUntouchedLegacyStarter(input) {
        if (!input || Number(input.version) >= VERSION || Number(input.fichas) !== 72
            || Number(input.totalEarned) !== 72 || !input.tickets
            || Number(input.tickets.op404) !== 1 || Number(input.tickets.turno404) !== 1
            || !Array.isArray(input.ledger) || input.ledger.length !== 0
            || !input.runs || Object.keys(input.runs).length !== 0) {
            return false;
        }

        const inventory = input.inventory || {};
        const inventoryEmpty = Object.keys(ITEM_CATALOG)
            .every((id) => Number(inventory[id] || 0) === 0);
        const companions = input.companions || {};
        const noProgress = Object.keys(COMPANIONS).every((id) => {
            const member = companions[id] || {};
            return !member.unlocked && Number(member.affinity || 0) === 0
                && Number(member.games || 0) === 0 && Number(member.gifts || 0) === 0;
        });

        return inventoryEmpty && noProgress && !input.activeCompanion;
    }


    /* La revisión anterior acreditaba fondos al cargar un preview. Si el
       perfil conserva únicamente ese bono automático —sin partida, compra ni
       afinidad real— lo devolvemos al inicio normal de cero. No tocamos una
       cartera que haya acumulado progreso posterior. */
    function isUntouchedAutomaticPreviewCredit(input) {
        if (!input || !Array.isArray(input.ledger) || !input.ledger.length ||
            !input.ledger.every((entry) => entry && entry.type === "preview-credit" &&
                entry.label === "BONO DE PRUEBAS ARENA")) {
            return false;
        }

        const credited = input.ledger.reduce((total, entry) => (
            total + Math.max(0, Math.floor(Number(entry.amount) || 0))
        ), 0);
        if (!credited || Number(input.fichas) !== credited ||
            Number(input.totalEarned) !== credited || input.activeCompanion ||
            (input.runs && Object.keys(input.runs).length)) {
            return false;
        }

        const noTickets = Object.keys(TICKET_GAMES)
            .every((id) => Number((input.tickets || {})[id] || 0) === 0);
        const noItems = Object.keys(ITEM_CATALOG)
            .every((id) => Number((input.inventory || {})[id] || 0) === 0);
        const noCompanionProgress = Object.keys(COMPANIONS).every((id) => {
            const member = (input.companions || {})[id] || {};
            return !member.unlocked && Number(member.affinity || 0) === 0 &&
                Number(member.games || 0) === 0 && Number(member.gifts || 0) === 0;
        });

        return noTickets && noItems && noCompanionProgress;
    }


    function normalize(source) {
        /* Conservamos una copia intacta de los valores iniciales. No hay que
           mezclar `input` dentro de `base`: un guardado de una versión previa
           puede traer sólo uno de los tickets/objetos y no debe borrar saldo,
           pases ni las claves nuevas del catálogo. */
        const defaults = defaultState();
        const input = source && typeof source === "object" ? source : {};
        const state = Object.assign({}, defaults, input);

        state.version = VERSION;
        state.fichas = Math.max(0, Math.floor(Number(input.fichas != null ? input.fichas : defaults.fichas) || 0));
        state.totalEarned = Math.max(state.fichas, Math.floor(Number(input.totalEarned != null ? input.totalEarned : defaults.totalEarned) || 0));
        state.tickets = Object.assign({}, defaults.tickets, input.tickets || {});
        state.inventory = Object.assign({}, defaults.inventory, input.inventory || {});
        state.companions = Object.assign({}, defaults.companions, input.companions || {});
        state.vipIntroSeen = Boolean(input.vipIntroSeen);
        state.previewTestStipendClaimed = Boolean(input.previewTestStipendClaimed);
        state.runs = Object.assign({}, input.runs || {});
        state.ledger = Array.isArray(input.ledger) ? input.ledger.slice(0, 18) : [];

        Object.keys(TICKET_GAMES).forEach((id) => {
            state.tickets[id] = Math.max(0, Math.floor(Number(state.tickets[id]) || 0));
        });
        Object.keys(ITEM_CATALOG).forEach((id) => {
            state.inventory[id] = Math.max(0, Math.floor(Number(state.inventory[id]) || 0));
        });
        Object.keys(COMPANIONS).forEach((id) => {
            const current = state.companions[id] || {};
            state.companions[id] = {
                unlocked: Boolean(current.unlocked),
                affinity: Math.max(0, Math.floor(Number(current.affinity) || 0)),
                games: Math.max(0, Math.floor(Number(current.games) || 0)),
                gifts: Math.max(0, Math.floor(Number(current.gifts) || 0)),
                trivia: normalizeTrivia(current.trivia)
            };
        });

        /* La versión previa regalaba 72 fichas y dos pases. Sólo el perfil
           exactamente intacto de aquella versión se convierte al nuevo inicio
           en cero; cualquier progreso real del jugador se conserva. */
        if (isUntouchedLegacyStarter(input)) {
            state.fichas = 0;
            state.totalEarned = 0;
            state.tickets = { op404: 0, turno404: 0 };
        }

        if (isUntouchedAutomaticPreviewCredit(input)) {
            state.fichas = 0;
            state.totalEarned = 0;
            state.previewTestStipendClaimed = false;
            state.ledger = [];
        }

        if (!COMPANIONS[state.activeCompanion] || !state.companions[state.activeCompanion].unlocked) {
            state.activeCompanion = null;
        }

        return state;
    }

    function load() {
        if (!A.storage || typeof A.storage.getObject !== "function") {
            return defaultState();
        }

        return normalize(A.storage.getObject(STORE_KEY, null));
    }

    let state = load();

    function levelFor(affinity) {
        let current = LEVELS[0];

        LEVELS.forEach((tier) => {
            if (affinity >= tier.at) {
                current = tier;
            }
        });

        const next = LEVELS.find((tier) => tier.at > affinity) || null;

        return {
            level: current.level,
            title: current.title,
            startsAt: current.at,
            nextAt: next ? next.at : null,
            progress: next
                ? Math.max(0, Math.min(1, (affinity - current.at) / (next.at - current.at)))
                : 1
        };
    }

    function companionView(id) {
        const catalog = COMPANIONS[id];
        const saved = state.companions[id];
        const tier = levelFor(saved.affinity);

        return Object.assign({}, catalog, clone(saved), {
            level: tier.level,
            levelTitle: tier.title,
            nextAffinity: tier.nextAt,
            affinityProgress: tier.progress,
            selected: state.activeCompanion === id
        });
    }

    function snapshot() {
        const copied = clone(state);
        copied.companions = Object.keys(COMPANIONS).reduce((out, id) => {
            out[id] = companionView(id);
            return out;
        }, {});
        /* El mostrador no ofrece pases mientras el acceso de campaña es
           libre. Los saldos de tickets heredados siguen en `state.tickets`,
           intactos y sin conversión automática a FICHAS. */
        copied.campaignTicketsEnabled = CAMPAIGN_TICKETS_ENABLED;
        copied.ticketCatalog = CAMPAIGN_TICKETS_ENABLED ? clone(TICKET_GAMES) : {};
        copied.itemCatalog = clone(ITEM_CATALOG);
        copied.active = state.activeCompanion ? companionView(state.activeCompanion) : null;
        return copied;
    }

    function markVipIntroSeen() {
        if (state.vipIntroSeen) {
            return false;
        }

        state.vipIntroSeen = true;
        persist("vip-intro-seen");
        return true;
    }


    function persist(reason) {
        if (A.storage && typeof A.storage.setObject === "function") {
            A.storage.setObject(STORE_KEY, state);
        }

        const view = snapshot();
        listeners.forEach((listener) => {
            try {
                listener(view, reason || "change");
            } catch (error) {
                console.error("[ARCADE 404] Error en VIP Central:", error);
            }
        });
    }

    function addLedger(type, amount, label) {
        state.ledger.unshift({
            type,
            amount: Number(amount) || 0,
            label: label || "",
            at: Date.now()
        });
        state.ledger = state.ledger.slice(0, 18);
    }

    function result(ok, payload = {}) {
        return Object.assign({ ok: Boolean(ok), state: snapshot() }, payload);
    }

    function ticketFor(gameId) {
        return TICKET_GAMES[gameId] || null;
    }


    /* El preview ya no acredita nada al abrir. Este vale existe únicamente
       para pruebas manuales y requiere el host de Arena: el jugador decide
       canjearlo una sola vez desde la mesa de Colinas. */
    function isArenaPreviewHost() {
        const host = typeof window !== "undefined" && window.location
            ? String(window.location.hostname || "")
            : "";

        return /.+\.e2b\.app$/i.test(host);
    }


    function canClaimPreviewTestStipend() {
        return isArenaPreviewHost() && !state.previewTestStipendClaimed;
    }


    function claimPreviewTestStipend() {
        if (!isArenaPreviewHost()) {
            return result(false, {
                code: "preview-only",
                message: "El vale de calibración sólo está disponible en el preview de Arena."
            });
        }

        if (state.previewTestStipendClaimed) {
            return result(false, {
                code: "preview-stipend-claimed",
                message: "El vale único de pruebas ya fue canjeado en este perfil."
            });
        }

        state.previewTestStipendClaimed = true;
        state.fichas += PREVIEW_TEST_STIPEND;
        state.totalEarned += PREVIEW_TEST_STIPEND;
        addLedger("preview-test-stipend", PREVIEW_TEST_STIPEND, PREVIEW_TEST_STIPEND_LABEL);
        persist("preview-test-stipend");

        return result(true, {
            granted: PREVIEW_TEST_STIPEND,
            message: `VALE DE PRUEBAS: +${PREVIEW_TEST_STIPEND} FICHAS VIP. Jaja, come ahi tremendo pobre`
        });
    }


    function runBonus(gameId) {
        const active = state.activeCompanion && state.companions[state.activeCompanion].unlocked
            ? companionView(state.activeCompanion)
            : null;
        const bonus = {
            gameId,
            companionId: active ? active.id : null,
            companionLevel: active ? active.level : 0,
            fichasMultiplier: 1,
            /* El shell aplica este soporte a todas las ROM, incluso las que
               no tienen hooks de campaña propios. */
            universal: {
                enabled: false,
                focusCharges: 0,
                focusDuration: 0,
                timeScale: 1,
                label: "",
                watch: "",
                focus: "",
                win: "",
                loss: ""
            },
            op404: { shield: 0, claps: 0, cash: 0, bullets: 0 },
            turno404: { energy: 0, panic: 0, clientGrace: 0, ventDiscount: 0 }
        };

        if (!active) {
            return bonus;
        }

        const strength = 1 + (active.level - 1) * 0.24;
        const companionSupport = MINI_SUPPORT[active.id];

        if (companionSupport) {
            bonus.universal.enabled = true;
            bonus.universal.label = companionSupport.label;
            bonus.universal.watch = companionSupport.watch;
            bonus.universal.focus = companionSupport.focus;
            bonus.universal.win = companionSupport.win;
            bonus.universal.loss = companionSupport.loss;
            /* Nivel 2 desbloquea el primer impulso; nivel 4 otorga un
               segundo uso. La duración también crece con el vínculo. */
            if (active.level >= 2) {
                bonus.universal.focusCharges = active.level >= 4 ? 2 : 1;
                bonus.universal.focusDuration = 1000 + active.level * 260;
                bonus.universal.timeScale = companionSupport.timeScale;
            }
        }

        if (active.id === "rog") {
            bonus.op404.shield = Math.round(20 * strength);
            bonus.turno404.energy = Math.round(7 * strength);
        } else if (active.id === "desire") {
            bonus.op404.shield = Math.round(28 * strength);
            bonus.turno404.panic = Math.round(7 * strength);
        } else if (active.id === "davinchi") {
            bonus.op404.bullets = Math.round(18 * strength);
            bonus.turno404.ventDiscount = Math.max(1, Math.round(2 * strength));
        } else if (active.id === "sil") {
            bonus.op404.cash = Math.round(28 * strength);
            bonus.turno404.clientGrace = Math.round(1000 * strength);
        } else if (active.id === "colinas") {
            bonus.op404.cash = Math.round(38 * strength);
            bonus.fichasMultiplier = 1 + 0.08 + (active.level - 1) * 0.02;
        }

        return bonus;
    }

    function consumeSupplies(gameId, bonus) {
        const used = [];
        const finalBonus = bonus || runBonus(gameId);

        Object.keys(ITEM_CATALOG).forEach((id) => {
            const item = ITEM_CATALOG[id];

            if (item.game !== gameId || state.inventory[id] <= 0) {
                return;
            }

            state.inventory[id] -= 1;
            used.push(id);

            if (id === "op-kit") {
                finalBonus.op404.claps += 1;
                finalBonus.op404.shield = Math.max(finalBonus.op404.shield, 32);
            } else if (id === "turno-cafe") {
                finalBonus.turno404.energy += 10;
                finalBonus.turno404.panic += 8;
            } else if (id === "turno-buffer") {
                finalBonus.turno404.clientGrace += 2200;
            }
        });

        return used;
    }

    function reaction(gameId, phase, companionId) {
        const id = companionId || state.activeCompanion;
        const companion = id && COMPANIONS[id];

        if (!companion) {
            return null;
        }

        const specific = companion.reactions[gameId] || "Mide el siguiente intento y vuelve con un dato mejor.";
        const endings = {
            start: "Estoy en canal.",
            win: "Buen cierre. El dato queda guardado.",
            loss: "No fue limpio, pero deja una lectura útil para el siguiente intento."
        };
        /* Si Colinas participa de una recompensa de cierre, conserva su
           entrega característica también fuera de su Sala VIP interna. */
        const colinasDelivery = id === "colinas" && (phase === "win" || phase === "loss")
            ? " Jaja, come ahi tremendo pobre."
            : "";

        return {
            companionId: id,
            name: companion.name,
            color: companion.color,
            portrait: companion.portrait,
            text: `${specific} ${endings[phase] || endings.start}${colinasDelivery}`,
            phase: phase || "start"
        };
    }

    function awardAffinity(gameId, won) {
        if (!state.activeCompanion || !state.companions[state.activeCompanion].unlocked) {
            return null;
        }

        const id = state.activeCompanion;
        const saved = state.companions[id];
        const before = levelFor(saved.affinity);
        const gain = (won ? 6 : 3) + (gameId === "op404" || gameId === "turno404" ? 2 : 0);

        saved.affinity += gain;
        saved.games += 1;

        const after = levelFor(saved.affinity);

        return {
            id,
            gain,
            affinity: saved.affinity,
            level: after.level,
            leveledUp: after.level > before.level
        };
    }

    function entry(gameId) {
        const ticket = ticketFor(gameId);
        const requiresTicket = CAMPAIGN_TICKETS_ENABLED && Boolean(ticket);

        if (requiresTicket && state.tickets[gameId] <= 0) {
            return result(false, {
                code: "ticket-required",
                ticket: clone(ticket),
                message: `${ticket.name} requiere un TICKET DE ACCESO.`
            });
        }

        if (requiresTicket) {
            state.tickets[gameId] -= 1;
            addLedger("entry", -1, `TICKET · ${ticket.name}`);
        }

        const bonus = runBonus(gameId);
        const usedItems = consumeSupplies(gameId, bonus);
        const startReaction = reaction(gameId, "start", bonus.companionId);

        if (requiresTicket || usedItems.length) {
            persist("entry");
        }

        return result(true, {
            ticket: requiresTicket ? clone(ticket) : null,
            remainingTickets: requiresTicket ? state.tickets[gameId] : null,
            access: ticket && !requiresTicket ? "open" : "free",
            usedItems,
            bonus,
            reaction: startReaction
        });
    }

    function completeRun(gameId, score, won) {
        const value = Math.max(0, Math.floor(Number(score) || 0));
        const plays = Math.max(0, Math.floor(Number(state.runs[gameId]) || 0)) + 1;
        const companionBonus = runBonus(gameId);
        /* Conversión lineal y visible: cada 50 puntos de score suma una
           FICHA, con un piso pequeño para que un primer intento sin score
           deje al jugador avanzar desde saldo cero. */
        const base = won ? 10 : 4;
        const scoreReward = Math.min(36, Math.floor(value / 50));
        const streakReward = plays % 5 === 0 ? 4 : 0;
        const reward = Math.max(3, Math.round((base + scoreReward + streakReward) * companionBonus.fichasMultiplier));
        const affinity = awardAffinity(gameId, Boolean(won));

        state.fichas += reward;
        state.totalEarned += reward;
        state.runs[gameId] = plays;
        addLedger("reward", reward, `${GAME_NAMES[gameId] || gameId} · ${won ? "COMPLETADO" : "INTENTO"}`);
        persist("run-complete");

        return result(true, {
            reward,
            gameId,
            plays,
            baseReward: base,
            scoreConverted: scoreReward,
            affinity,
            reaction: reaction(gameId, won ? "win" : "loss", companionBonus.companionId),
            label: `+${reward} FICHAS VIP · ${scoreReward} POR SCORE`
        });
    }

    /* Hitos de campaña: OP404 y TURNO404 llaman esto una vez por zona/nivel
       superado. Recibe sólo los puntos de ese hito, no el score acumulado. */
    function completeLevel(gameId, score, label) {
        const value = Math.max(0, Math.floor(Number(score) || 0));
        const companionBonus = runBonus(gameId);
        const scoreReward = Math.min(18, Math.floor(value / 120));
        const reward = Math.max(2, Math.round((2 + scoreReward) * companionBonus.fichasMultiplier));
        const title = label || `${GAME_NAMES[gameId] || gameId} · NIVEL SUPERADO`;

        state.fichas += reward;
        state.totalEarned += reward;
        addLedger("level-reward", reward, title);
        persist("level-complete");

        return result(true, {
            reward,
            gameId,
            scoreConverted: scoreReward,
            label: `+${reward} FICHAS VIP · NIVEL`,
            reaction: reaction(gameId, "win", companionBonus.companionId)
        });
    }


    function buyTicket(gameId) {
        const ticket = ticketFor(gameId);

        if (!CAMPAIGN_TICKETS_ENABLED && ticket) {
            return result(false, {
                code: "tickets-disabled",
                message: "OPERACIÓN 404 y TURNO 404 están abiertos mientras ajustamos sus campañas; no hace falta emitir un ticket."
            });
        }

        if (!ticket) {
            return result(false, { code: "unknown-ticket", message: "Ese acceso no existe." });
        }

        if (state.fichas < ticket.price) {
            return result(false, { code: "insufficient-fichas", message: "Faltan FICHAS VIP para ese acceso." });
        }

        state.fichas -= ticket.price;
        state.tickets[gameId] += 1;
        addLedger("purchase", -ticket.price, `TICKET · ${ticket.name}`);
        persist("buy-ticket");

        return result(true, { ticket: clone(ticket), message: `TICKET DE ${ticket.name} EMITIDO.` });
    }

    function buyItem(itemId) {
        const item = ITEM_CATALOG[itemId];

        if (!item) {
            return result(false, { code: "unknown-item", message: "Ese suministro no existe." });
        }

        if (state.fichas < item.price) {
            return result(false, { code: "insufficient-fichas", message: "Faltan FICHAS VIP para ese suministro." });
        }

        state.fichas -= item.price;
        state.inventory[itemId] += 1;
        addLedger("purchase", -item.price, item.name);
        persist("buy-item");

        return result(true, { item: clone(item), message: `${item.name} EN RESERVA.` });
    }

    function unlockCompanion(id) {
        const companion = COMPANIONS[id];
        const saved = state.companions[id];

        if (!companion || !saved) {
            return result(false, { code: "unknown-companion", message: "Ese canal no está disponible." });
        }

        if (saved.unlocked) {
            return result(false, { code: "already-unlocked", message: `${companion.name} ya está en tu red.` });
        }

        if (state.fichas < companion.cost) {
            return result(false, { code: "insufficient-fichas", message: `Faltan FICHAS VIP para contactar a ${companion.name}.` });
        }

        state.fichas -= companion.cost;
        saved.unlocked = true;
        saved.affinity = Math.max(saved.affinity, 5);
        state.activeCompanion = id;
        addLedger("contact", -companion.cost, `CANAL · ${companion.name}`);
        persist("unlock-companion");

        return result(true, {
            companion: companionView(id),
            reaction: reaction("hub", "start", id),
            message: `${companion.name} QUEDÓ EN LÍNEA.`
        });
    }

    function selectCompanion(id) {
        const companion = COMPANIONS[id];
        const saved = state.companions[id];

        if (!companion || !saved || !saved.unlocked) {
            return result(false, { code: "locked-companion", message: "Primero debes habilitar ese canal." });
        }

        state.activeCompanion = id;
        persist("select-companion");

        return result(true, { companion: companionView(id), message: `${companion.name} TE ACOMPAÑA.` });
    }

    function giveGift(id) {
        const companion = COMPANIONS[id];
        const saved = state.companions[id];

        if (!companion || !saved || !saved.unlocked) {
            return result(false, { code: "locked-companion", message: "Ese regalo no tiene receptor disponible." });
        }

        const gift = companion.favorite;

        if (state.fichas < gift.price) {
            return result(false, { code: "insufficient-fichas", message: "Faltan FICHAS VIP para ese regalo." });
        }

        const before = levelFor(saved.affinity);
        state.fichas -= gift.price;
        saved.affinity += gift.affinity;
        saved.gifts += 1;
        const after = levelFor(saved.affinity);
        addLedger("gift", -gift.price, `${gift.name} · ${companion.name}`);
        persist("gift");

        return result(true, {
            companion: companionView(id),
            affinity: gift.affinity,
            leveledUp: after.level > before.level,
            message: `${gift.name}: +${gift.affinity} AFINIDAD CON ${companion.name}.`
        });
    }

    function answerTrivia(id, choiceId) {
        const companion = COMPANIONS[id];
        const saved = state.companions[id];
        const blocks = DIALOGUE_TRIVIA[id] || [];
        const limit = Math.min(CONVERSATION_LIMIT, blocks.length);

        if (!companion || !saved || !saved.unlocked) {
            return result(false, {
                code: "locked-companion",
                message: "Primero debes habilitar este canal para conversar."
            });
        }

        if (saved.trivia.answered >= limit) {
            return result(false, {
                code: "trivia-complete",
                message: `Ya completaste los ${limit} bloques de conversación con ${companion.name}.`
            });
        }

        const block = blocks[saved.trivia.answered];
        const choice = block && block.choices.find((item) => item.id === choiceId);

        if (!block || !choice) {
            return result(false, {
                code: "invalid-answer",
                message: "Esa respuesta no pertenece al bloque activo."
            });
        }

        const before = levelFor(saved.affinity);
        const correct = block.answer === choiceId;
        const intendedDelta = correct ? 9 : -4;
        const previousAffinity = saved.affinity;
        saved.affinity = Math.max(0, saved.affinity + intendedDelta);
        const affinityDelta = saved.affinity - previousAffinity;
        saved.trivia.answered += 1;
        saved.trivia.correct += correct ? 1 : 0;
        saved.trivia.incorrect += correct ? 0 : 1;
        saved.trivia.completed = saved.trivia.answered >= limit;
        const after = levelFor(saved.affinity);
        const direction = correct ? `+${affinityDelta}` : `${affinityDelta}`;

        addLedger(
            "trivia",
            affinityDelta,
            `VÍNCULO · ${companion.name} · ${correct ? "ACIERTO" : "ERROR"}`
        );
        persist("trivia-answer");

        return result(true, {
            companion: companionView(id),
            correct,
            choice: clone(choice),
            affinityDelta,
            intendedDelta,
            leveledUp: after.level > before.level,
            leveledDown: after.level < before.level,
            completed: saved.trivia.completed,
            message: correct
                ? `${companion.name}: respuesta correcta. ${direction} AFINIDAD.`
                : `${companion.name}: respuesta incorrecta. ${direction} AFINIDAD.`
        });
    }


    A.vip = {
        STORE_KEY,
        VERSION,
        CONVERSATION_LIMIT,
        CAMPAIGN_TICKETS_ENABLED,
        TICKET_GAMES,
        ITEM_CATALOG,
        COMPANIONS,
        LEVELS,
        DIALOGUE_TRIVIA,
        MINI_SUPPORT,
        snapshot,
        ticketFor,
        ticketsFor(gameId) {
            return Math.max(0, state.tickets[gameId] || 0);
        },
        needsTicket(gameId) {
            return CAMPAIGN_TICKETS_ENABLED && Boolean(ticketFor(gameId));
        },
        isCampaignOpen(gameId) {
            return Boolean(ticketFor(gameId)) && !CAMPAIGN_TICKETS_ENABLED;
        },
        entry,
        completeRun,
        completeLevel,
        buyTicket,
        buyItem,
        unlockCompanion,
        selectCompanion,
        giveGift,
        answerTrivia,
        reaction,
        gameBonus: runBonus,
        PREVIEW_TEST_STIPEND,
        isArenaPreviewHost,
        canClaimPreviewTestStipend,
        claimPreviewTestStipend,
        hasSeenVipIntro() {
            return Boolean(state.vipIntroSeen);
        },
        markVipIntroSeen,
        onChange(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        /* Sólo para pruebas aisladas: no se expone en la pantalla. */
        _replaceForTest(next) {
            state = normalize(next);
            persist("test-replace");
        }
    };

})(window.Arcade404);
