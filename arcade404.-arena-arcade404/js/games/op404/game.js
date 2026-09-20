/* =========================================================
   ARCADE 404 — GAME 09 · OPERACIÓN 404 (FPS de raycasting)
   Antes "MIERDA 404". DOOM de píxeles: doce niveles, arsenal
   con inventario (pistola, escopeta, ametralladora y lanza-
   pasticho), enemigos venezolanos de melee y a distancia,
   seis jefes en una ruta de doce niveles; cierra SR. M.

   Entrada: cada tecla se mantiene SOLO mientras el teclado
   diga que está pulsada (keydown/keyup), y todo se suelta al
   pausar, perder el foco, morir o salir. Nada se queda pegado.
   ========================================================= */

(function (A) {

    "use strict";


    const { utils, canvasKit } = A;

    const OP = A.op404;


    /* ---------------------------------------------------------
       LIENZO Y CÁMARA
       --------------------------------------------------------- */

    const WIDTH = 640;
    const HEIGHT = 400;
    const HALF = HEIGHT / 2;

    /* 320 columnas conservan el look raycast en escritorio. En pantallas
       táctiles o equipos modestos se baja a 192: sigue siendo pixel-art,
       pero reduce rayos, recortes y fill-rate de forma muy visible. */
    const RENDER_COLS = 320;
    const LOW_RENDER_COLS = 192;

    const FOV = Math.PI / 2.5;


    /**
     * OPERACIÓN 404 es el único juego que hace raycasting por columna.
     * Detectamos perfiles con menos presupuesto gráfico antes de crear el
     * canvas para mantener el control responsivo en vez de intentar dibujar
     * más píxeles de los que el teléfono puede sostener.
     */
    function op404RenderProfile() {

        const nav = typeof navigator !== "undefined" ? navigator : {};
        const cores = Number(nav.hardwareConcurrency) || 0;
        const memory = Number(nav.deviceMemory) || 0;
        const coarsePointer = typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(pointer: coarse)").matches;
        const constrained = coarsePointer ||
            (cores > 0 && cores <= 4) ||
            (memory > 0 && memory <= 4);

        return {
            constrained,
            columns: constrained ? LOW_RENDER_COLS : RENDER_COLS,
            /* El escenario usa coordenadas de píxel retro; 1x/1.25x evita
               pintar cuatro veces la misma escena en pantallas Retina. */
            maxDpr: constrained ? 1 : 1.25,
            /* A 30 FPS estables en móvil el movimiento sigue a 60 Hz, pero
               el canvas deja suficiente tiempo para input y audio. */
            renderInterval: constrained ? (1000 / 30) : 0,
            sightInterval: constrained ? 140 : 85,
            particleLimit: constrained ? 72 : 120
        };

    }


    const MAP_W = OP.MAP_W;
    const MAP_H = OP.MAP_H;

    const TEX = OP.TEX_SIZE;

    /* `v` es una barrera de señal: funciona como cobertura completa. Los
       props bajos también siguen siendo sólidos para cuerpos y proyectiles,
       aunque el raycaster sólo ocluye con paredes/barreras altas. */
    const WALL_CHARS = "#%&v";
    const SOLID_CHARS = "#%&vxot";


    /* ---------------------------------------------------------
       JUGADOR
       --------------------------------------------------------- */

    /* Ratón: sensibilidad en radianes por píxel */
    const MOUSE_SENS = 0.0026;
    const MOUSE_SENS_LOCKED = 0.0022;

    const PLAYER_SPEED = 3.2;
    const RUN_SPEED = 4.6;
    const TURN_SPEED = 2.7;
    const HURT_TIME = 420;
    const MAX_HEALTH = 100;
    /* Reserva de blindaje persistente. A diferencia de los efectos de bolsa,
       nunca baja con el reloj: sólo un impacto puede descargarla. */
    const MAX_SHIELD = 100;
    const LOOT_WINDOW_MS = 5000;

    /* La ruta siempre es la misma: sólo se ajusta la presión del combate.
       Así FÁCIL sirve para aprender el visor y DIFÍCIL exige administrar
       la Sala VIP sin alterar los doce mapas, los seis jefes ni el ritmo
       de botín. */
    const DIFFICULTIES = {
        /* La presión sube por lectura y composición, no por convertir cada
           roce tardío en dos golpes. Los multiplicadores amortiguan además
           la subida que ya declaran los doce mundos. */
        facil: {
            label: "FÁCIL",
            short: "FÁCIL",
            hp: 0.72,
            speed: 0.82,
            damage: 0.52,
            money: 1.35,
            drops: 0.32,
            checkpointHealth: 78,
            note: "Menos daño, más botín y un reintento de campo generoso.",
            color: "#A3E635"
        },
        normal: {
            label: "NORMAL",
            short: "NORMAL",
            hp: 0.88,
            speed: 0.93,
            damage: 0.72,
            money: 1.10,
            drops: 0.22,
            checkpointHealth: 70,
            note: "Daño moderado, botín consistente y un reintento por zona.",
            color: "#FBBF24"
        },
        dificil: {
            label: "DIFÍCIL",
            short: "DIFÍCIL",
            hp: 1.10,
            speed: 1.07,
            damage: 0.94,
            money: 0.95,
            drops: 0.14,
            checkpointHealth: 62,
            note: "Más presión, pero con checkpoint y recursos de recuperación.",
            color: "#F87171"
        }
    };

    const DIFFICULTY_ORDER = ["facil", "normal", "dificil"];
    const DIFFICULTY_STORAGE_KEY = "op404:difficulty";

    /* Sil no reemplaza a Desire ni a Davinchi: aparece como el encuentro
       cifrado poco frecuente de una sala secreta y entrega una reserva que
       sí alcanza para cambiar una compra de la Sala VIP. */
    const SIL_SECRET_CHANCE = 0.28;
    const SIL_VIP_STASH = 180;

    /* Efectos visuales con tope: en una oleada grande no deben convertir
       decenas de explosiones ya invisibles en una caída de FPS. */
    const MAX_DECALS = 52;
    const MAX_PUDDLES = 18;
    const MAX_BEAMS = 2;
    const MAX_TRACERS = 28;
    const MAX_IMPACT_BURSTS = 30;
    const MAX_AOE_BURSTS = 8;


    /* ---------------------------------------------------------
       ARSENAL
       --------------------------------------------------------- */

    const WEAPONS = {

        pistola: {
            label: "PISTOLA DE PÍXELES",
            short: "PISTOLA",
            ammo: null,                /* infinita */
            damage: 14,
            pellets: 1,
            spread: 0,
            cooldown: 270,
            speed: 11,
            shot: "bala",
            auto: false,
            kick: 1,
            sound: "pistola"
        },

        escopeta: {
            label: "ESCOPETA",
            short: "ESCOPETA",
            ammo: "cartuchos",
            damage: 9,
            pellets: 6,
            spread: 0.22,
            cooldown: 760,
            speed: 10,
            shot: "bala",
            auto: false,
            kick: 1.6,
            sound: "escopeta"
        },

        ametralladora: {
            label: "AMETRALLADORA PESADA",
            short: "AMETRALL.",
            ammo: "balas",
            damage: 8,
            pellets: 1,
            spread: 0.05,
            cooldown: 95,
            speed: 12,
            shot: "bala",
            auto: true,
            kick: 0.7,
            sound: "ametralladora"
        },

        lanzapasticho: {
            label: "LANZA-PASTICHO",
            short: "PASTICHO",
            ammo: "pastichos",
            damage: 46,
            pellets: 1,
            spread: 0,
            cooldown: 900,
            speed: 8,
            shot: "pasticho",
            auto: false,
            splash: 1.6,
            kick: 2,
            sound: "pasticho",
            effectColor: "#F97316"
        },

        /* Principal técnico: atraviesa un objetivo y deja un destello de
           señal, útil contra pasillos que ahora tienen rutas laterales. */
        riflepulso: {
            label: "RIFLE DE PULSO",
            short: "PULSO",
            ammo: "celdas",
            damage: 13,
            pellets: 1,
            spread: 0.018,
            cooldown: 130,
            speed: 16,
            shot: "pulso",
            auto: true,
            pierce: 1,
            kick: 0.8,
            sound: "ametralladora",
            effectColor: "#22D3EE"
        },

        /* Secundaria criogénica: daño de área contenido y ralentización
           visible de los enemigos alcanzados. */
        criopasticho: {
            label: "CRIO-PASTICHO",
            short: "CRIO",
            ammo: "celdas",
            damage: 25,
            pellets: 1,
            spread: 0,
            cooldown: 640,
            speed: 9,
            shot: "crio",
            auto: false,
            splash: 0.92,
            slow: 2500,
            kick: 1.45,
            sound: "pasticho",
            effectColor: "#60A5FA"
        },

        /* Secundaria de rebote: conserva el tiro hasta tres impactos en
           pared; abre ángulos seguros sin pedir daño bruto adicional. */
        rebotador: {
            label: "REBOTA-404",
            short: "REBOTE",
            ammo: "balas",
            damage: 18,
            pellets: 1,
            spread: 0.025,
            cooldown: 420,
            speed: 11,
            shot: "rebote",
            auto: false,
            bounces: 3,
            kick: 1.05,
            sound: "pistola",
            effectColor: "#C084FC"
        }

    };

    const WEAPON_ORDER = [
        "pistola", "escopeta", "ametralladora", "lanzapasticho",
        "riflepulso", "criopasticho", "rebotador"
    ];

    const AMMO_MAX = { balas: 200, cartuchos: 40, pastichos: 12, celdas: 44 };

    /* El Taller VIP modifica el arma equipada, no la campaña entera de una
       vez. Tres mejoras por rama permiten especializar el arsenal sin que
       una compra convierta los doce mundos en un paseo automático. */
    const WEAPON_UPGRADE_MAX = 3;
    const WEAPON_UPGRADES = Object.freeze({
        impact: Object.freeze({
            label: "IMPACTO",
            damage: 0.14
        }),
        cycle: Object.freeze({
            label: "CICLO",
            cooldown: 0.09
        }),
        control: Object.freeze({
            label: "CONTROL",
            spread: 0.18,
            speed: 0.055,
            kick: 0.07
        })
    });
    const WEAPON_UPGRADE_ORDER = Object.freeze(["impact", "cycle", "control"]);

    /* Cada pareja de zonas abre una pieza más del arsenal aleatorio. Así las
       cajas nunca adelantan prototipos finales a la primera oficina, pero sí
       hacen que dos incursiones encuentren armas distintas. */
    const WEAPON_LOOT_ORDER = Object.freeze([
        "escopeta", "ametralladora", "lanzapasticho",
        "riflepulso", "criopasticho", "rebotador"
    ]);

    /* La entidad de mapa usa sprites propios pequeños. El catálogo VIP sigue
       siendo la fuente de desbloqueo/afinidad; este perfil sólo define cómo
       se lee a distancia dentro del raycaster. */
    const VIRTUAL_COMPANIONS = {
        rog: { name: "ROG", color: "#38BDF8" },
        desire: { name: "DESIRE", color: "#F472B6" },
        davinchi: { name: "DAVINCHI", color: "#A3E635" },
        sil: { name: "SIL", color: "#C084FC" },
        colinas: { name: "SR. DE LAS COLINAS", color: "#FBBF24" }
    };


    /* ---------------------------------------------------------
       PRESENTACIÓN DE LA OPERACIÓN

       Las transmisiones conservan un lienzo ligero y sus partículas de
       ambiente deterministas, pero las de historia ya no desaparecen por
       reloj: ESPACIO o el control táctil las cierran cuando el jugador ha
       terminado de leer. Sólo el aviso de botín sigue el tiempo jugable de
       cinco segundos, porque no es una escena que bloquee la partida.
       --------------------------------------------------------- */

    const TRANSMISSION_FADE_MS = 240;
    const TRANSMISSION_TYPE_MS = 15;
    const BOSS_TRANSMISSION_PULSE_MS = 4800;

    const COMMS_PERSONNEL = {
        rog: {
            name: "ROG",
            role: "OPERACIONES / CAMPO",
            color: "#38BDF8"
        },
        sil: {
            name: "SIL",
            role: "RED / INTELIGENCIA",
            color: "#FB923C"
        },
        desire: {
            name: "DESIRE",
            role: "ATENCIÓN / REFUGIO",
            color: "#F472B6"
        },
        davinchi: {
            name: "DAVINCHI",
            role: "SEGURIDAD / RUTA",
            color: "#A3E635"
        },
        colinas: {
            name: "SR. DE LAS COLINAS",
            role: "VIP / SUMINISTROS",
            color: "#FBBF24"
        }
    };

    /* Cada mundo usa un gesto de visor propio. La intensidad se mantiene
       baja y los bucles se acotan a 6–14 trazos por frame, incluso en la
       presentación de escritorio. */
    const WORLD_VISUALS = {
        callcenter: { color: "#38BDF8", label: "SEÑAL INTERNA", effect: "scan" },
        calles: { color: "#FB923C", label: "CALLE ABIERTA", effect: "rain" },
        gobierno: { color: "#FDE68A", label: "ARCHIVO ACTIVO", effect: "dust" },
        refineria: { color: "#FB7185", label: "PULSO INDUSTRIAL", effect: "steam" },
        escape: { color: "#C084FC", label: "RETRANSMISIÓN", effect: "static" },
        final: { color: "#A3E635", label: "NODO MADRE", effect: "spores" }
    };


    /* ---------------------------------------------------------
       ENEMIGOS
       --------------------------------------------------------- */

    /* Frases de los compañeros de las salas secretas */

    /* ---------------------------------------------------------
       ARCOS NARRATIVOS DE LOS ALIADOS

       No son frases sueltas al azar: cada aliado tiene una
       historia que avanza. La primera vez se presenta, la segunda
       te reconoce y sigue contando, y así hasta el desenlace. El
       progreso se guarda en `game.allyMet`, que también viaja en
       el checkpoint, para que la continuidad sobreviva a la
       muerte y a la carga de partida.

       Si te los encuentras más veces de las que hay capítulos,
       se repiten las frases sueltas del final del arco, que están
       escritas para poder oírse muchas veces sin cansar.
       --------------------------------------------------------- */

    const DESIRE_ARC = [
        [
            "¡Ay, por fin una cara conocida, amor!",
            "Soy Desire. Atención al cliente, piso 3.",
            "Me botaron por responderle feo a un supervisor. Delicadeza selectiva, supongo.",
            "Desde entonces cuido este huequito y a quien llegue sin hacer ruido.",
            "Tú vienes lastimado, mi amor. Eso tiene arreglo.",
            "Ven acá, que te cuido. Siempre puedes contar conmigo."
        ],
        [
            "¡Mira quién sobrevivió! Ya me tenías preocupada, amor.",
            "Encontré a más gente escondida abajo; ya somos como ocho.",
            "Tenemos agua, curitas y una olla que milagrosamente todavía sirve.",
            "El supervisor del piso 3 anda buscándome, pero no va a encontrar a nadie.",
            "Yo tengo algo que él no tiene: gente que se cuida entre sí.",
            "Anda, amor, déjame revisarte eso otra vez."
        ],
        [
            "Estás vivo. Cada vez me sorprendes menos, amor.",
            "Los de abajo empezaron a llamarme la doctora. Imagínate tú.",
            "Yo sólo sé poner curitas, escuchar y hablar bonito.",
            "Pero a veces eso es justo lo que hace falta.",
            "Uno de ellos preguntó por ti. Le dije que ibas ganando, mi amor.",
            "No me hagas quedar mal. Toma."
        ],
        [
            "Amor, ahora sí me tienes que escuchar.",
            "El supervisor dio con nosotros. Nos tocó movernos.",
            "Perdimos a dos. No quiero hablar de eso ahorita.",
            "Pero saqué a los demás por los ductos, todos juntos.",
            "Tú sigue subiendo. Si llegas arriba, esto se acaba.",
            "Y cuando se acabe, me invitas un café. Ya está prometido, amor."
        ],
        [
            "Última vez que te veo aquí abajo, y lo sé, amor.",
            "Ya no queda nada que curar en este piso.",
            "Me voy con mi gente. Encontramos una salida al este.",
            "Tú tienes la tuya, y no es por ahí: es hacia arriba.",
            "Gracias por no dejarnos morir en un pasillo, mi amor.",
            "Ahora vete. Y no mires atrás; eso es de novatos."
        ]
    ];

    /* Reencuentros extra, cuando el arco ya se contó entero */
    const DESIRE_EXTRA = [
        [
            "¿Otra vez tú, amor? Yo ya me despedí.",
            "Bueno, ya que estás aquí, déjame verte.",
            "Listo. Ahora sí, vete con cuidado."
        ],
        [
            "Te dije que no miraras atrás, amor.",
            "Pero me alegra que sigas respirando, no te voy a mentir.",
            "Toma y desaparece con estilo."
        ]
    ];

    const DAVINCHI_ARC = [
        [
            "Baja el arma, pana. Estamos del mismo lado, yeah.",
            "Davinchi. Yo era seguridad del edificio y sé cómo respira este cableado.",
            "Me pidieron disparar contra la gente. Dije que no.",
            "Me fui por los ductos, desarmé dos cerraduras y aquí sigo.",
            "Este mapa es una ratonera con mala acústica, te lo firmo.",
            "Toma esto. Con lo que traías no llegabas ni al primer riff, yeah."
        ],
        [
            "Otra vez tú. Empiezo a creer que sabes lo que haces, yeah.",
            "Estuve mapeando los pisos con el panel de mantenimiento.",
            "Hay un patrón: los duros siempre cubren una puerta.",
            "Eso significa que detrás hay un nodo que vale la pena romper.",
            "Todavía no sé cuál, pero el sistema deja huellas. Siempre.",
            "Agarra esto y no te me pongas creativo con el cableado."
        ],
        [
            "Te tengo noticias, y no son buenas. Pero son claras, yeah.",
            "Averigüé qué cuidan detrás de las puertas: servidores.",
            "Todo lo que hicieron quedó registrado en esas máquinas.",
            "Por eso no las apagan: el negocio depende del respaldo.",
            "Si ese rack cae, se les cae la función completa.",
            "Ya sabes a dónde vas. Llévate esto y mantén el volumen alto."
        ],
        [
            "Me encontraron, pana. Se acabó lo de esconderse, yeah.",
            "Tuve que quemar mi taller. Todo, con las herramientas dentro.",
            "Salvé lo que cabía en el bolso. Aquí está la mitad.",
            "No me pongas esa cara: fue mi decisión.",
            "Tú tienes más chance que yo de llegar arriba y cortar el sistema.",
            "Así que llega. Y déjalos sin señal."
        ],
        [
            "Última entrega, y hablo en serio esta vez, yeah.",
            "Ya no me queda taller, ni cajas, ni excusas.",
            "Sólo esto, que estaba guardando para un solo golpe.",
            "Si lo uso yo, cae un tipo. Si lo usas tú, cae el piso entero.",
            "La cuenta es fácil; hasta el sistema la entiende.",
            "Nos vemos arriba, o no nos vemos. Suerte, pana."
        ]
    ];

    const DAVINCHI_EXTRA = [
        [
            "No me queda casi nada, pero algo se rebusca, yeah.",
            "Toma. Y no te acostumbres.",
            "Sigue moviéndote; quedarse quieto mata."
        ],
        [
            "¿Todavía por aquí? Basado, yeah.",
            "Revisé los bolsillos y encontré esto.",
            "Andando, que el tiempo no está de nuestro lado."
        ]
    ];

    /* SIL — contacto cifrado de la red. Su sala conserva el mismo hallazgo
       físico que Desire y Davinchi, pero su aporte es efectivo trazable para
       que el jugador pueda invertirlo al llegar a la Sala VIP. */
    const SIL_ARC = [
        [
            "Baja la voz. Soy Sil. Leía la red desde el canal cuatro.",
            "No me encontraron porque nunca uso la misma puerta dos veces.",
            "Intervine unas cajas de viáticos antes de que cerraran el sistema.",
            "No preguntes de dónde salen. Calcula cuánto tiempo compran.",
            "La Sala VIP todavía acepta este código. Es tuyo.",
            "Úsalo antes de que el mercader le ponga impuesto al aire."
        ],
        [
            "Te vi cruzar el nodo. La señal ya te marcó.",
            "Cambié las rutas y escondí otro fondo en esta sala.",
            "No es heroísmo. Es presupuesto recuperado.",
            "Davinchi abre puertas. Desire sostiene a la gente.",
            "Yo hago que el dinero llegue donde hace falta.",
            "Guárdalo para la Sala VIP. No lo gastes en orgullo."
        ],
        [
            "La red soltó otra transferencia fantasma. La tomé primero.",
            "Cada nodo que tumbas libera una cuenta que nadie quería mirar.",
            "No arregla el país. Sí compra una salida.",
            "Tu inventario no puede depender de milagros.",
            "La ruta cifrada está en mi pulsera.",
            "Toma el fondo. Sigue antes de que cambie la contraseña."
        ],
        [
            "Nos rastrean. Esta sala desaparecerá del mapa.",
            "Mandé a la gente por la salida baja. Dejé la reserva aquí.",
            "No me debes nada. Se lo debemos a quienes no salieron.",
            "Con ese dinero compras tiempo, munición o una segunda oportunidad.",
            "El Sr. de las Colinas fingirá no saber de dónde viene.",
            "No le expliques. Paga y sigue."
        ],
        [
            "Este es el último fondo limpio que puedo sacar de la red.",
            "Después de esto los nodos sólo devuelven ruido.",
            "Ya no necesito esconderme. La señal se cae contigo encima.",
            "Cuando veas al equipo arriba, diles que el canal cuatro aguantó.",
            "Haz que esa reserva mantenga a todos vivos.",
            "Y si el mercader pregunta, dile: transferencia inmediata."
        ]
    ];

    const SIL_EXTRA = [
        [
            "La red todavía deja migas si sabes dónde mirar.",
            "Te guardé una. No te acostumbres a que el sistema funcione.",
            "Sigue antes de que se borre."
        ],
        [
            "Canal cuatro confirma: todavía respiras.",
            "Eso merece una reserva pequeña y una ruta mejor.",
            "Nos vemos en la siguiente sombra."
        ]
    ];


    const ENEMIES = {

        /* GORGOJO GIGANTE: sale del arroz de la bolsa del CLAP.
           Rápido, rabioso y sin nada que perder. */
        gorgojo: {
            label: "GORGOJO GIGANTE",
            hp: 55,
            speed: 3.4,
            damage: 11,
            score: 300,
            size: 1.15,
            attack: "melee",
            drop: 0.2,
            shouts: [
                "CRRRK CRRRK",
                "¡ESE ARROZ ERA MÍO!",
                "KRIIIIK"
            ]
        },

        chavista: {
            label: "CHAVISTA",
            hp: 34,
            speed: 2.3,
            damage: 9,
            score: 120,
            size: 1,
            attack: "melee",
            drop: 0.3,
            shouts: ["¡PATRIA!", "¡UH AH!", "¡NO VOLVERÁN!", "¡VIVA!"]
        },

        usuario: {
            label: "USUARIO",
            hp: 26,
            speed: 3,
            damage: 7,
            score: 100,
            size: 0.98,
            attack: "melee",
            drop: 0.35,
            shouts: ["¡NO SIRVE!", "¡REEMBOLSO!", "¡SUPERVISOR!"]
        },

        malandro: {
            label: "MALANDRO",
            hp: 40,
            speed: 1.7,
            damage: 8,
            score: 220,
            size: 1.02,
            attack: "ranged",
            rangedRate: 1500,
            shot: "bala",
            shotSpeed: 5.2,
            strafe: true,
            drop: 0.5,
            shouts: [
                "MANO, YA TE LA SABES",
                "SUELTA EL TELÉFONO",
                "NO ME MIRES EL ROSTRO",
                "¡QUIETO AHÍ!",
                "DAME TODO SIN PEO"
            ]
        },

        /* GENTE DE CALIDAD: supervisores de calidad que te
           tiran planillas de evaluación y te bajan la nota. */
        calidad: {
            label: "GENTE DE CALIDAD",
            hp: 46,
            speed: 1.9,
            damage: 6,
            score: 260,
            size: 1.04,
            attack: "ranged",
            rangedRate: 1700,
            shot: "planilla",
            shotSpeed: 4.4,
            strafe: true,
            drop: 0.55,
            shouts: [
                "TE FALTÓ UN PUNTO",
                "NO MALTRATES AL USUARIO",
                "¡RESPUESTA FUERA DE PARÁMETRO!",
                "ESO NO ESTÁ EN EL GUION",
                "TE VOY A MONITOREAR"
            ]
        },

        /* MOTORIZADO: rápido, embiste y se va */
        motorizado: {
            label: "MOTORIZADO",
            hp: 38,
            speed: 4.2,
            damage: 11,
            score: 300,
            size: 1.1,
            attack: "melee",
            drop: 0.5,
            shouts: [
                "¡QUÍTATE!",
                "VOY EN CONTRA",
                "¡LA ACERA ES MÍA!"
            ]
        },

        /* BUROCRATA: lento, mucha vida, lanza sellos */
        burocrata: {
            label: "BURÓCRATA",
            hp: 90,
            speed: 1.2,
            damage: 9,
            score: 340,
            size: 1.16,
            attack: "ranged",
            rangedRate: 2100,
            shot: "sello",
            shotSpeed: 4,
            drop: 0.7,
            shouts: [
                "VUELVA MAÑANA",
                "FALTA UNA COPIA",
                "NO ES CON ESTA PLANILLA",
                "EL SISTEMA ESTÁ CAÍDO"
            ]
        },

        /* COLECTIVO: en moto, dispara y aguanta */
        colectivo: {
            label: "COLECTIVO",
            hp: 72,
            speed: 2.6,
            damage: 12,
            score: 420,
            size: 1.12,
            attack: "ranged",
            rangedRate: 1250,
            shot: "bala",
            shotSpeed: 5.6,
            strafe: true,
            drop: 0.8,
            shouts: [
                "¡AQUÍ MANDA EL COLECTIVO!",
                "¡ZONA DE PAZ!",
                "¡ORDEN REVOLUCIONARIO!"
            ]
        },

        /* --- SUB-JEFES DE MUNDO --- */

        /* Mundo 1: el supervisor que nunca aprueba nada */
        supervisor: {
            label: "EL SUPERVISOR",
            hp: 300,
            speed: 1.5,
            damage: 13,
            score: 1800,
            size: 1.5,
            attack: "ranged",
            rangedRate: 1300,
            shot: "planilla",
            shotSpeed: 5,
            drop: 1,
            boss: true,
            summon: { kind: "calidad", every: 8000, count: 2, max: 4 },
            shouts: [
                "ESA LLAMADA LA VOY A ESCUCHAR",
                "CERO EN EMPATÍA",
                "¡REPÍTELO CON EL GUION!",
                "TU MÉTRICA ESTÁ EN ROJO"
            ]
        },

        /* Mundo 2: jefe de la calle */
        jefeBarrio: {
            label: "EL PRANES",
            hp: 420,
            speed: 2.2,
            damage: 15,
            score: 2200,
            size: 1.6,
            attack: "ranged",
            rangedRate: 1000,
            shot: "bala",
            shotSpeed: 6,
            strafe: true,
            drop: 1,
            boss: true,
            summon: { kind: "malandro", every: 7500, count: 2, max: 4 },
            shouts: [
                "AQUÍ MANDO YO",
                "TÚ NO SABES QUIÉN SOY",
                "ESTE BARRIO ES MÍO"
            ]
        },

        maduro: {
            label: "MADURO",
            hp: 520,
            speed: 1.15,
            damage: 16,
            score: 2500,
            size: 1.7,
            attack: "ranged",
            rangedRate: 1400,
            shot: "decreto",
            shotSpeed: 4.6,
            drop: 1,
            boss: true,
            summon: { kind: "chavista", every: 7000, count: 2, max: 5 },
            shouts: ["¡DECRETO!", "¡PAJARITO!", "¡MILLONES DE MILLONES!"]
        },

        chavez: {
            label: "CHÁVEZ",
            hp: 820,
            speed: 0.9,
            damage: 18,
            score: 5000,
            size: 2.1,
            attack: "ranged",
            rangedRate: 1100,
            shot: "petroleo",
            shotSpeed: 5,
            drop: 1,
            boss: true,
            phases: true,
            summon: { kind: "chavista", every: 9000, count: 2, max: 4 },
            shouts: ["¡EXPRÓPIESE!", "¡ALÓ PRESIDENTE!", "¡POR AHORA!"]
        },

        manguangua: {
            label: "EL MANGUANGUA",
            hp: 640,
            speed: 1.4,
            damage: 6,
            score: 4000,
            size: 1.55,
            attack: "beam",
            rangedRate: 2600,
            shot: "texto",
            shotSpeed: 6,
            drop: 1,
            boss: true,
            teleport: 5200,
            shouts: ["HAY UN CAMINO", "PROGRESO", "VENEZOLANOS..."]
        },

        srm: {
            label: "SR. M",
            hp: 900,
            speed: 2.5,
            damage: 22,
            score: 8000,
            size: 2.2,
            attack: "melee",
            rangedRate: 3200,
            shot: "cucharada",
            shotSpeed: 6.5,
            drop: 1,
            boss: true,
            spoon: true,
            shouts: ["¡A COMER MIERDA!", "¡CON CUCHARA!", "¡VENGA YA!"]
        }

    };

    const CHAR_ENEMY = {
        C: "chavista",
        U: "usuario",
        M: "malandro",
        G: "calidad",
        T: "motorizado",
        R: "burocrata",
        K: "colectivo"
    };

    /* Inversa estable para validar invocaciones contra el pool declarado
       por cada zona. Jefes y eventos únicos no tienen marca y conservan su
       propio guion; los esbirros sí deben pertenecer a su temática. */
    const ENEMY_TILE_BY_KIND = {
        chavista: "C",
        usuario: "U",
        malandro: "M",
        calidad: "G",
        motorizado: "T",
        burocrata: "R",
        colectivo: "K"
    };

    const CHAR_ITEM = {
        h: "arepa",
        b: "balas",
        s: "cartuchos",
        p: "pastichos",
        q: "celdas",
        2: "escopeta",
        3: "ametralladora",
        4: "lanzapasticho",
        5: "riflepulso",
        6: "criopasticho",
        7: "rebotador"
    };

    const CHAR_PROP = {
        x: "escritorio",
        o: "barril",
        t: "mesa"
    };


    /* ---------------------------------------------------------
       ARTE EXTERNO

       Los sprites dibujados a píxel siguen siendo el respaldo
       inmediato mientras se descarga el arte. Cuando la imagen
       local está lista, el raycaster la usa sin cargar los 24 MB
       de recursos antes de entrar a OPERACIÓN 404.
       --------------------------------------------------------- */

    const EXTERNAL_ART = {
        chavista: ["enemy.chavista", "enemy.chavista-f"],
        usuario: ["enemy.usuario", "enemy.usuario-f"],
        malandro: ["enemy.malandro", "enemy.malandro-f"],
        calidad: ["enemy.calidad", "enemy.calidad-f"],
        burocrata: ["enemy.backoffice"],
        colectivo: ["enemy.militar"],
        supervisor: ["boss.supervisor"],
        jefeBarrio: ["boss.ampa"],
        maduro: ["boss.maduro"],
        chavez: ["boss.chavez"],
        manguangua: ["boss.capriles"],
        srm: ["boss.srm"]
    };


    /* Los PNG no comparten estatura ni pose. El factor anterior los
       inflaba y la base quedaba demasiado arriba respecto del suelo del
       raycaster. Estas medidas se aplican después del recorte visible:
       menos altura, base ligeramente más baja y una silueta que siempre
       toca el suelo. Es ajuste de render, nunca duplica ni altera assets. */
    const EXTERNAL_SPRITE_FIT = {
        "enemy.backoffice": { height: 1.14, lift: 0.82 },
        "enemy.calidad-f": { height: 1.13, lift: 0.83 },
        "enemy.calidad": { height: 1.13, lift: 0.83 },
        "enemy.chavista": { height: 1.16, lift: 0.82 },
        "enemy.chavista-f": { height: 1.16, lift: 0.82 },
        "enemy.malandro-f": { height: 1.12, lift: 0.84 },
        "enemy.malandro": { height: 1.12, lift: 0.84 },
        "enemy.militar": { height: 1.15, lift: 0.82 },
        "enemy.usuario-f": { height: 1.11, lift: 0.83 },
        "enemy.usuario": { height: 1.11, lift: 0.83 },
        "boss.ampa": { height: 1.08, lift: 0.84 },
        "boss.capriles": { height: 1.08, lift: 0.87 },
        "boss.chavez": { height: 1.05, lift: 0.84 },
        "boss.maduro": { height: 1.08, lift: 0.83 },
        "boss.srm": { height: 1.06, lift: 0.84 },
        "boss.supervisor": { height: 1.1, lift: 0.83 }
    };


    /* En el mundo 3D, los aliados se ven siempre con su PNG de cuerpo
       completo. El primer plano del diálogo sí cambia de expresión para
       acompañar cada momento de su arco sin convertirlos en miniaturas. */
    const ALLY_ART = {
        desire: { idle: "character.desire.full" },
        davinchi: { idle: "character.davinchi.full" },
        sil: { idle: "character.sil.full" }
    };


    /* Cada entrada corresponde a una visita del arco. Al agotar las
       visitas se vuelve a una expresión del repertorio, no a un alias ni
       a una imagen distinta de personaje. */
    const ALLY_DIALOGUE_EXPRESSIONS = {
        desire: [
            ["emocionada", "seria", "molesta", "despreocupada", "preocupada", "feliz"],
            ["emocionada", "emocionada", "feliz", "miedo", "enamorada", "preocupada"],
            ["feliz", "emocionada", "despreocupada", "seria", "emocionada", "feliz"],
            ["seria", "miedo", "triste", "preocupada", "seria", "emocionada"],
            ["triste", "seria", "preocupada", "seria", "feliz", "emocionada"]
        ],
        davinchi: [
            ["serio", "serio", "enojado", "nervioso", "preocupado", "emocionado"],
            ["despreocupado", "serio", "preocupado", "emocionado", "serio", "feliz"],
            ["preocupado", "serio", "serio", "enojado", "serio", "emocionado"],
            ["miedo", "triste", "triste", "serio", "preocupado", "enojado"],
            ["serio", "triste", "serio", "emocionado", "serio", "feliz"]
        ],
        sil: [
            ["seria", "nerviosa", "preocupada", "seria", "emocionada", "feliz"],
            ["preocupada", "seria", "seria", "feliz", "emocionada", "seria"],
            ["emocionada", "preocupada", "seria", "nerviosa", "seria", "feliz"],
            ["miedo", "triste", "seria", "preocupada", "molesta", "seria"],
            ["seria", "preocupada", "emocionada", "feliz", "seria", "despreocupada"]
        ]
    };


    function externalArtId(kind, variant) {

        const choices = EXTERNAL_ART[kind];

        if (!choices || !choices.length) {
            return "";
        }

        /* Las variantes procedurales conservan su variedad, pero
           apuntan a una variante estable del arte entregado. */
        if (kind === "usuario") {
            return variant === "usuario2" ? choices[1] : choices[0];
        }

        if (kind === "calidad") {
            return variant === "calidad2" ? choices[1] : choices[0];
        }

        return choices.length === 1
            ? choices[0]
            : choices[Math.floor(Math.random() * choices.length)];

    }


    /* Altura visual objetivo para que los PNG entregados compartan la
       misma escala física que los sprites procedurales. `frame` elimina
       los márgenes transparentes de enemigos y jefes. */
    function externalSpriteFit(assetId) {
        return EXTERNAL_SPRITE_FIT[assetId] || { height: 1.12, lift: 0.83 };
    }


    function allyDialogueExpression(ally) {

        const chapters = ALLY_DIALOGUE_EXPRESSIONS[ally.kind] || [];
        const fallback = ally.kind === "davinchi" ? "serio" : "seria";

        if (!chapters.length) {
            return fallback;
        }

        const chapter = chapters[(Math.max(1, ally.meeting || 1) - 1) % chapters.length] || [];
        const step = Math.max(0, ally.step || 0);

        return chapter[Math.min(step, chapter.length - 1)] || fallback;

    }


    function allyDialogueArtId(ally) {

        if (!A.assets || typeof A.assets.characterImageId !== "function") {
            return "";
        }

        return A.assets.characterImageId(
            ally.kind,
            ally.expression || allyDialogueExpression(ally)
        );

    }


    function fittedSpriteScale(image, frame, targetHeight) {

        const width = frame
            ? frame.width
            : (image.naturalWidth || image.width);
        const height = frame
            ? frame.height
            : (image.naturalHeight || image.height);

        if (!width || !height) {
            return targetHeight;
        }

        return targetHeight / (height / width);

    }


    /* =========================================================
       JUEGO
       ========================================================= */

    class Op404Game {


        constructor(shell) {

            this.shell = shell;

            this.renderProfile = op404RenderProfile();
            this.renderCols = this.renderProfile.columns;
            this.colWidth = WIDTH / this.renderCols;
            this.sightInterval = this.renderProfile.sightInterval;
            this.particleLimit = this.renderProfile.particleLimit;
            this.lastRenderAt = -Infinity;
            this.lowFpsSamples = 0;

            this.stage = A.createStage(shell.refs.stage, {
                width: WIDTH,
                height: HEIGHT,
                background: "#05070E",
                maxDpr: this.renderProfile.maxDpr,
                /* El FPS pinta un cuadro opaco completo por frame. Estas
                   pistas permiten al navegador presentarlo sin bloquearse
                   esperando el compositor en hardware menos potente. */
                contextOptions: { alpha: false, desynchronized: true }
            });

            this.art = OP.sprites();

            this.zbuffer = new Float32Array(this.renderCols);

            this.keys = {};

            /* Las variaciones del dossier rotan entre reintentos y nuevas
               incursiones de esta sesión. Se conserva fuera de `reset()` para
               que volver a empezar no repita siempre la misma radio. */
            this.transmissionVariantCursor = {};

            /* La dificultad se recuerda para la próxima incursión, pero no
               comparte el ajuste global de ajedrez: cada juego conserva su
               propia campaña y su propio perfil de presión. */
            this.difficulty = this.readDifficulty();

            this.reset();

            shell.setTouchControls({
                mode: "dpad-fire",
                analogLabel: "Joystick analógico: arriba avanza, abajo retrocede y los lados giran.",
                /* El shell entrega un vector radial limitado a -1..1. OP404
                   lo consume directamente para que avanzar y virar respondan
                   a la distancia real del pulgar, no a cuatro botones. */
                onMove: (move) => {

                    const active = this.phase === "run" || this.phase === "loot";

                    this.touchMotion = active
                        ? {
                            x: utils.clamp(Number(move && move.x) || 0, -1, 1),
                            y: utils.clamp(Number(move && move.y) || 0, -1, 1)
                        }
                        : { x: 0, y: 0 };

                },
                onAction: (action) => {

                    if (action === "fire") {
                        if (this.activeAllyDialogue()) {
                            this.advanceAllyDialogue();
                            return false;
                        }
                        /* Mientras una escena bloqueante está abierta, el
                           botón principal actúa como el ESPACIO: no dispara
                           a ciegas detrás del texto. */
                        if (this.transmission && this.transmission.blocking) {
                            this.dismissTransmission();
                            return false;
                        }
                        this.shoot();
                    }

                }
            });

            this.bindPointer();
            this.bindDifficulty();

        }


        /* ---------------------------------------------------------
           DIFICULTAD

           El selector vive en el HUD para que se vea antes de pulsar JUGAR.
           Una incursión en curso no se reconfigura a mitad de combate: se
           elige en READY y el perfil se conserva al reiniciar la campaña.
           --------------------------------------------------------- */

        readDifficulty() {

            const stored = A.storage && typeof A.storage.get === "function"
                ? A.storage.get(DIFFICULTY_STORAGE_KEY, "normal")
                : "normal";

            return DIFFICULTIES[stored] ? stored : "normal";

        }


        get tuning() {
            return DIFFICULTIES[this.difficulty] || DIFFICULTIES.normal;
        }


        syncDifficultyButtons() {

            (this.difficultyButtons || []).forEach((button) => {
                const active = button.dataset.op404Difficulty === this.difficulty;
                button.classList.toggle("is-active", active);
                button.setAttribute("aria-pressed", active ? "true" : "false");
            });

        }


        setDifficulty(id) {

            if (!DIFFICULTIES[id]) {
                return false;
            }

            this.difficulty = id;

            if (A.storage && typeof A.storage.set === "function") {
                A.storage.set(DIFFICULTY_STORAGE_KEY, id);
            }

            this.syncDifficultyButtons();
            this.updateStats();

            return true;

        }


        bindDifficulty() {

            if (!utils.qsa || !this.shell.root) {
                this.difficultyButtons = [];
                return;
            }

            this.difficultyButtons = utils.qsa(
                "[data-op404-difficulty]",
                this.shell.root
            );

            this.syncDifficultyButtons();

            this.difficultyButtons.forEach((button) => {
                button.addEventListener("click", () => {

                    /* Se evita una alteración invisible de HP/daño mientras
                       ya hay enemigos vivos. El selector explica cómo hacer
                       el cambio sin perder el control de la partida. */
                    if (this.shell.state !== "ready") {
                        this.shell.setStatus("DIFICULTAD: VUELVE A READY PARA CAMBIARLA");
                        A.audio.play("vacio");
                        return;
                    }

                    const id = button.dataset.op404Difficulty;

                    if (!this.setDifficulty(id)) {
                        return;
                    }

                    /* El mapa, los enemigos y los multiplicadores nacen de
                       cero con el nuevo perfil; la campaña nunca mezcla dos
                       dificultades en un mismo checkpoint. */
                    this.reset();
                    this.shell.setStatus("DIFICULTAD · " + this.tuning.label);
                    A.audio.play("select");

                });
            });

        }


        enemyDamage(amount) {
            /* La dificultad y el mapa todavía importan, pero la curva queda
               amortiguada: los últimos mundos no convierten un roce en una
               muerte inmediata cuando el jugador ya exploró una ruta larga. */
            const mapPressure = Math.min(1.16, Number(this.cfg.damage) || 1);
            return amount * mapPressure * this.tuning.damage;
        }


        recoveryDropBonus() {
            let bonus = Math.max(0, Number(this.tuning.drops) || 0);

            /* Si el visor marca vida baja o ya consumiste el reintento de
               campo, la operación inclina el botín hacia recuperación. */
            if (this.health <= 45) {
                bonus += 0.16;
            }
            if (this.fieldCheckpoint && !this.fieldCheckpoint.available) {
                bonus += 0.08;
            }

            return Math.min(0.42, bonus);
        }


        /* ---------------------------------------------------------
           RATÓN
           Mover el puntero gira la vista y el clic dispara. Con el
           puntero bloqueado (clic en el lienzo) se mira en continuo
           como en cualquier FPS; sin bloquear, la posición del ratón
           respecto al centro marca hacia dónde giras.
           --------------------------------------------------------- */

        bindPointer() {

            const canvas = this.stage.canvas;

            this.mouseTurn = 0;
            this.pointerLocked = false;

            this._shopPointerAt = (clientX, clientY) => {
                if (this.phase !== "shop" || !this.shop) {
                    return false;
                }

                const rect = canvas.getBoundingClientRect();
                const x = (clientX - rect.left) * WIDTH / rect.width;
                const y = (clientY - rect.top) * HEIGHT / rect.height;

                return this.shop.pointer(x, y);
            };

            this._onMouseMove = (event) => {

                if (this.phase !== "run" && this.phase !== "loot") {
                    return;
                }

                if (this.pointerLocked) {

                    /* Bloqueado: se usa el desplazamiento puro */
                    this.player.angle += event.movementX * MOUSE_SENS_LOCKED;

                    this.mouseTurn = 0;

                    return;

                }

                /* Sin bloquear: orientación proporcional a la distancia al centro */
                const rect = canvas.getBoundingClientRect();

                const centerX = rect.left + rect.width / 2;

                const offset = (event.clientX - centerX) / (rect.width / 2);

                /* Zona muerta en el centro para que no derive solo */
                this.mouseTurn = Math.abs(offset) < 0.12
                    ? 0
                    : utils.clamp(offset, -1, 1);

            };

            this._onMouseDown = (event) => {

                if (event.button !== 0) {
                    return;
                }

                event.preventDefault();

                if (this.phase === "intro" && this.intro) {
                    this.intro.skipScene();
                    return;
                }

                if (this.activeAllyDialogue()) {
                    this.advanceAllyDialogue();
                    return;
                }

                if (this.transmission && this.transmission.blocking) {
                    this.dismissTransmission();
                    return;
                }

                if (this.phase === "shop") {
                    this._shopPointerAt(event.clientX, event.clientY);
                    return;
                }

                if (this.phase !== "run") {
                    return;
                }

                this.keys.fire = true;

                this.shoot();

            };

            this._onMouseUp = (event) => {

                if (event.button === 0) {
                    this.keys.fire = false;
                }

            };

            /* Hablar directamente con el mercader también responde al toque
               sobre el lienzo; no obliga a usar teclado físico en móvil. */
            this._onTouchStart = (event) => {

                if (!event.touches || !event.touches[0]) {
                    return;
                }

                if (this.phase === "intro" && this.intro) {
                    this.intro.skipScene();
                    event.preventDefault();
                    return;
                }

                if (this.activeAllyDialogue()) {
                    this.advanceAllyDialogue();
                    event.preventDefault();
                    return;
                }

                if (this.transmission && this.transmission.blocking) {
                    this.dismissTransmission();
                    event.preventDefault();
                    return;
                }

                if (this.phase !== "shop") {
                    return;
                }

                if (this._shopPointerAt(
                    event.touches[0].clientX,
                    event.touches[0].clientY
                )) {
                    event.preventDefault();
                }

            };

            this._onLeave = () => {

                this.mouseTurn = 0;
                this.keys.fire = false;

            };

            /* Doble clic: bloquear el puntero (ratón libre estilo FPS) */
            this._onDblClick = () => {

                if (this.phase !== "run") {
                    return;
                }

                if (canvas.requestPointerLock) {
                    canvas.requestPointerLock();
                }

            };

            this._onLockChange = () => {

                this.pointerLocked = document.pointerLockElement === canvas;

                this.mouseTurn = 0;

                this.shell.setStatus(
                    this.pointerLocked
                        ? "RATÓN BLOQUEADO · ESC PARA SOLTARLO"
                        : "RATÓN LIBRE · DOBLE CLIC PARA BLOQUEAR"
                );

            };

            /* Rueda: cambiar de arma */
            this._onWheel = (event) => {

                if (this.phase !== "run") {
                    return;
                }

                event.preventDefault();

                this.cycleWeapon(event.deltaY > 0 ? 1 : -1);

            };

            canvas.addEventListener("mousemove", this._onMouseMove);
            canvas.addEventListener("mousedown", this._onMouseDown);
            canvas.addEventListener("touchstart", this._onTouchStart, { passive: false });
            canvas.addEventListener("dblclick", this._onDblClick);
            canvas.addEventListener("mouseleave", this._onLeave);
            canvas.addEventListener("wheel", this._onWheel, { passive: false });
            canvas.addEventListener("contextmenu", (event) => event.preventDefault());

            window.addEventListener("mouseup", this._onMouseUp);

            document.addEventListener("pointerlockchange", this._onLockChange);

        }


        unbindPointer() {

            const canvas = this.stage.canvas;

            canvas.removeEventListener("mousemove", this._onMouseMove);
            canvas.removeEventListener("mousedown", this._onMouseDown);
            canvas.removeEventListener("touchstart", this._onTouchStart);
            canvas.removeEventListener("dblclick", this._onDblClick);
            canvas.removeEventListener("mouseleave", this._onLeave);
            canvas.removeEventListener("wheel", this._onWheel);

            window.removeEventListener("mouseup", this._onMouseUp);

            document.removeEventListener("pointerlockchange", this._onLockChange);

            if (document.pointerLockElement === canvas && document.exitPointerLock) {
                document.exitPointerLock();
            }

        }


        /* ---------------------------------------------------------
           Estado
           --------------------------------------------------------- */

        reset() {

            this.levelIndex = 0;
            this.score = 0;

            /* Partida nueva: la cartera vuelve a cero */
            this.money = 0;

            this.shop = null;
            this.checkpoint = null;
            /* Cada zona instala un reintento local independiente del seguro
               VIP. Es una red de seguridad de diseño, no un recurso pagado. */
            this.fieldCheckpoint = null;
            this.virtualCompanion = null;

            this.health = MAX_HEALTH;

            this.ammo = { balas: 0, cartuchos: 0, pastichos: 0, celdas: 0 };

            /* Economía: el dinero sobrevive entre niveles */
            if (typeof this.money !== "number") {
                this.money = 0;
            }
            this.owned = { pistola: true };
            /* Cada incursión empieza con la pistola limpia; el Taller guarda
               sus mejoras durante toda la ruta, checkpoints y seguro de
               esta campaña, pero nunca contamina una partida nueva. */
            this.weaponUpgrades = {};
            this.weapon = "pistola";
            this.weaponSwap = 0;

            this.shots = [];
            this.hostileShots = [];
            this.pickups = [];
            this.particles = [];
            this.decals = [];
            this.puddles = [];
            this.beams = [];
            this.floaters = [];
            /* VFX del arsenal: topes independientes de las partículas para
               que un combate intenso siga legible sin comprometer el loop. */
            this.tracers = [];
            this.impactBursts = [];
            this.aoeBursts = [];
            this.muzzleFlash = null;

            this.shootTimer = 0;
            this.recoil = 0;
            this.hurt = 0;
            this.slow = 0;

            /* --- Inventario de habilidades --- */

            /* Llamada a los Yanquis: bombardeo aéreo */
            this.yanquis = 0;
            this.strike = 0;

            /* Furia de Atención al Cliente.

               No se compra por usos: se DESBLOQUEA una sola vez en la
               tienda y a partir de ahí se mejora. En vez de gastarse,
               se recarga recibiendo daño: mientras más te maltraten,
               antes vuelve a estar lista. */
            this.furiaUnlocked = false;
            this.furiaLevel = 1;
            this.furiaCharge = 0;
            this.furiaTime = 0;

            /* Bolsas del CLAP en la mochila */
            this.claps = 0;

            /* Seguro de vida comprado en la Sala VIP */
            this.insurance = false;

            /* El regateo se reinicia al entrar en cada Sala VIP. Estas
               variables describen únicamente la visita que está activa. */
            this.haggleAttempts = OP.SHOP_HAGGLE_MAX_ATTEMPTS || 5;
            this.haggleAnnoyance = 0;

            /* ¿Ya visitó la tienda alguna vez? Para el discurso
               de bienvenida del mercader. */
            this.shopVisits = 0;

            /* Efectos temporales de la bolsa y blindaje persistente. El
               escudo es una reserva propia: no se descuenta con el tiempo. */
            this.sugar = 0;       /* +velocidad */
            this.shield = 0;      /* carga actual de blindaje */
            this.shieldMax = MAX_SHIELD;
            this.sticky = 0;      /* -30% velocidad */
            this.clapFlash = null;

            /* Informe de la zona para los diálogos del mercader */
            this.report = { damage: 0, flawless: true };

            /* Cuántas veces te has encontrado a cada aliado. Es lo
               que da continuidad a sus historias. */
            this.allyMet = { desire: 0, davinchi: 0, sil: 0 };
            this.bob = 0;
            this.time = 0;
            this.nextStatsUpdate = 0;

            this.keys = {};
            this.pulses = {};
            /* Vector continuo del joystick compartido. Se reinicia junto a
               teclas/pulsos para que una pausa, un diálogo o un reintento no
               dejen al operador caminando con un dedo ya soltado. */
            this.touchMotion = { x: 0, y: 0 };

            this.phase = "run";
            this.phaseTimer = 0;
            /* Un cierre de botín puede originarse dentro del bucle de
               proyectiles. Esta compuerta hace la transición idempotente y
               evita que dos rutas intenten abrir tienda/nivel a la vez. */
            this.lootTransitioning = false;
            this.banner = null;
            this.transmission = null;
            this.bossIntroMax = 0;

            /* El arte externo se solicita en una cola visible, nunca todo
               el elenco de enemigos a la vez al abrir una zona. */
            this.nextArtStreamAt = 0;

            this.loadLevel(0);

            this.updateStats();

        }


        /* Cada mundo suena distinto; los jefes mandan sobre todo */
        worldTrack() {

            if (this.boss) {
                return "jefe";
            }

            const map = {
                callcenter: "m1oficina",
                calles: "m2calle",
                gobierno: "m3gobierno",
                refineria: "m3gobierno",
                escape: "m4final",
                final: "m4final"
            };

            return map[this.cfg && this.cfg.world] || "doom";

        }


        /* --- API que usa la Sala VIP --- */

        get maxHealth() {
            return MAX_HEALTH;
        }


        ammoMax(kind) {
            return AMMO_MAX[kind] || 0;
        }


        /* La campaña siempre abre con la cinemática. El shell llama
           a start() o a restart() según de dónde venga, así que la
           lógica vive en un único sitio. */
        beginCampaign() {

            if (this.shell && typeof this.shell.setNarrativeControl === "function") {
                this.shell.setNarrativeControl(null);
            }

            /* La Sala VIP aparece después de limpiar zonas; pedir los
               retratos ahora da tiempo a que el primer render ya sea el
               PNG correcto y nunca el vendedor procedural antiguo. */
            if (A.assets && typeof A.assets.characterImageId === "function" &&
                typeof A.assets.preload === "function") {
                /* Sólo el retrato de entrada se carga durante combate. Los
                   demás gestos se solicitan bajo demanda en la Sala VIP;
                   así una ráfaga de PNG no compite con el primer nivel. */
                const firstPortrait = A.assets.characterImageId("colinas", "despreocupado");
                A.assets.preload([firstPortrait]);
            }

            this.reset();

            if (A.op404.Intro && !this.skipIntro) {

                this.intro = new A.op404.Intro(this.stage);

                this.phase = "intro";
                this.syncNarrativeControl();

                A.audio.music("tenso");

            }

        }


        start() {

            this.beginCampaign();

            A.audio.play("start");

        }


        restart() {

            this.beginCampaign();

        }


        /* Bonos de VIP Central. Son complementos pequeños a una campaña nueva
           y usan únicamente los recursos locales ya existentes: no mezclan
           FICHAS VIP con los bolívares de la Sala VIP interna. */
        applyVipBonus(bonus, usedItems = []) {

            const perks = bonus && bonus.op404 ? bonus.op404 : null;
            const companionId = bonus && VIRTUAL_COMPANIONS[bonus.companionId]
                ? bonus.companionId
                : null;
            const companionLevel = Math.max(0, Math.floor(Number(bonus && bonus.companionLevel) || 0));

            /* El canal activo se materializa dentro del nivel después de la
               entrada: no queda un panel fijo cubriendo el visor. */
            if (companionId && companionLevel > 0) {
                this.configureVipCompanion(companionId, companionLevel, bonus.universal || null);
            } else {
                this.virtualCompanion = null;
            }

            if (!perks) {
                return;
            }

            const messages = [];

            if (perks.claps > 0) {
                this.claps += Math.max(0, Math.floor(perks.claps));
                messages.push(`+${Math.floor(perks.claps)} CLAP`);
            }

            if (perks.shield > 0) {
                this.grantShield(Math.floor(perks.shield));
                messages.push("ESCUDO VIP");
            }

            if (perks.cash > 0) {
                const cash = Math.max(0, Math.floor(perks.cash));
                this.money += cash;
                messages.push(`+$${cash}`);
            }

            if (perks.bullets > 0) {
                const bullets = Math.max(0, Math.floor(perks.bullets));
                this.ammo.balas = Math.min(this.ammoMax("balas"), this.ammo.balas + bullets);
                messages.push(`+${bullets} BALAS`);
            }

            if (messages.length) {
                this.floater(`VIP · ${messages.join(" · ")}`, "#FBBF24");
                this.shell.setStatus("VIP CENTRAL: " + messages.join(" · "));
            }

            this.updateStats();

        }


        /* ---------------------------------------------------------
           MASCOTA VIRTUAL DE COMPAÑERO

           El vínculo VIP se ve donde importa: en el mapa. Al nivel 2 recoge
           efectivo que queda lejos; al 3 avisa emboscadas; del 4 en adelante
           concede micro-ayudas en intervalos. Ninguna de estas ayudas es una
           ventana estática ni detiene la campaña.
           --------------------------------------------------------- */

        configureVipCompanion(id, level, support) {

            const profile = VIRTUAL_COMPANIONS[id];

            if (!profile || !this.player) {
                return false;
            }

            this.virtualCompanion = {
                id,
                name: profile.name,
                color: profile.color,
                level: Math.max(1, Math.min(5, level)),
                support: support || null,
                x: this.player.x,
                y: this.player.y,
                anim: 0,
                mood: "follow",
                moodTimer: 0,
                signal: "EN CANAL",
                signalTimer: 1800,
                targetPickup: null,
                nextCollectAt: this.time + 350,
                nextAlertAt: this.time + 1700,
                nextDangerAt: this.time + 1000,
                nextBuffAt: this.time + 14500,
                lastPlayerX: this.player.x,
                lastPlayerY: this.player.y
            };

            this.placeVirtualCompanion();
            this.floater(profile.name + " · EN CANAL", profile.color);

            return true;

        }


        placeVirtualCompanion() {

            const companion = this.virtualCompanion;
            const player = this.player;

            if (!companion || !player) {
                return false;
            }

            const behind = player.angle + Math.PI;
            const offsets = [0, 0.72, -0.72, 1.35, -1.35, Math.PI];

            for (let index = 0; index < offsets.length; index += 1) {
                const angle = behind + offsets[index];
                const distance = index < 3 ? 0.82 : 0.56;
                const x = player.x + Math.cos(angle) * distance;
                const y = player.y + Math.sin(angle) * distance;

                if (this.freeSpot(x, y, 0.13)) {
                    companion.x = x;
                    companion.y = y;
                    return true;
                }
            }

            /* Un spawn de respaldo nunca bloquea al jugador: comparte el
               punto sólo si ninguna casilla alrededor está libre. */
            companion.x = player.x;
            companion.y = player.y;
            return false;

        }


        setVipCompanionMood(mood, signal, duration) {

            const companion = this.virtualCompanion;

            if (!companion) {
                return false;
            }

            const moods = {
                win: "cheer",
                cheer: "cheer",
                danger: "danger",
                loss: "danger",
                focus: "focus",
                pause: "follow",
                watch: "follow",
                support: "support"
            };
            companion.mood = moods[mood] || "follow";
            companion.moodTimer = Math.max(350, Number(duration) || 1500);
            if (signal) {
                companion.signal = signal;
                companion.signalTimer = companion.moodTimer;
            }

            return true;

        }


        companionPickupTarget(companion) {

            if (companion.level < 2 || this.time < companion.nextCollectAt) {
                return null;
            }

            const current = companion.targetPickup;
            if (current && this.pickups.indexOf(current) >= 0) {
                return current;
            }

            let selected = null;
            let nearest = Infinity;

            this.pickups.forEach((item) => {
                if (!item || item.type !== "dinero") {
                    return;
                }

                const playerDistance = Math.hypot(item.x - this.player.x, item.y - this.player.y);
                const companionDistance = Math.hypot(item.x - companion.x, item.y - companion.y);

                /* Sólo va por fichas/efectivo que el jugador realmente dejó
                   atrás; no roba el pickup que ya está recogiendo a mano. */
                if (playerDistance > 1.15 && companionDistance < 6.2 &&
                    companionDistance < nearest && this.canSee(companion.x, companion.y, item.x, item.y)) {
                    selected = item;
                    nearest = companionDistance;
                }
            });

            companion.targetPickup = selected;
            return selected;

        }


        collectVipCompanionPickup(companion) {

            const item = companion.targetPickup;
            const index = item ? this.pickups.indexOf(item) : -1;

            if (index < 0 || Math.hypot(item.x - companion.x, item.y - companion.y) > 0.46) {
                return false;
            }

            const value = Math.max(1, Math.floor(Number(item.value) || 5));
            this.money += value;
            this.pickups.splice(index, 1);
            companion.targetPickup = null;
            companion.nextCollectAt = this.time + 520;
            this.setVipCompanionMood("support", "+$" + value + " RECUPERADO", 1200);
            this.floater(companion.name + " RECUPERÓ +$" + value, companion.color);
            this.shell.setStatus(companion.name + " TRAJO +$" + value);
            A.audio.play("coin");
            return true;

        }


        updateVirtualCompanion(dt) {

            const companion = this.virtualCompanion;
            const player = this.player;

            if (!companion || !player || (this.phase !== "run" && this.phase !== "loot")) {
                return;
            }

            companion.anim += dt;
            companion.moodTimer = Math.max(0, companion.moodTimer - dt);
            companion.signalTimer = Math.max(0, companion.signalTimer - dt);
            if (companion.moodTimer === 0 && companion.mood !== "follow") {
                companion.mood = "follow";
            }

            /* Una mascota atascada detrás de un muro se reubica cerca del
               jugador; no hace pathfinding caro dentro de cada frame. */
            const playerGap = Math.hypot(companion.x - player.x, companion.y - player.y);
            if (playerGap > 4.8 || !this.canSee(companion.x, companion.y, player.x, player.y)) {
                this.placeVirtualCompanion();
            }

            if (this.health <= 30 && this.time >= companion.nextDangerAt) {
                companion.nextDangerAt = this.time + 2600;
                this.setVipCompanionMood("danger", "¡VIDA BAJA!", 1250);
            }

            if (companion.level >= 3 && this.time >= companion.nextAlertAt) {
                const ambush = this.enemies.find((enemy) => (
                    !enemy.dead && !enemy.hidden &&
                    Math.hypot(enemy.x - player.x, enemy.y - player.y) < 7.5 &&
                    !this.canSee(player.x, player.y, enemy.x, enemy.y)
                ));

                if (ambush) {
                    companion.nextAlertAt = this.time + 6200;
                    this.setVipCompanionMood("danger", "¡EMBOSCADA!", 1600);
                    this.floater(companion.name + " · EMBOSCADA", companion.color);
                    this.shell.setStatus(companion.name + " DETECTÓ UNA EMBOSCADA");
                }
            }

            if (companion.level >= 4 && this.time >= companion.nextBuffAt) {
                const stronger = companion.level >= 5;
                companion.nextBuffAt = this.time + (stronger ? 13000 : 18000);

                if (this.health < 74) {
                    const recovery = stronger ? 8 : 6;
                    this.health = Math.min(MAX_HEALTH, this.health + recovery);
                    this.setVipCompanionMood("support", "+" + recovery + " RESPALDO", 1350);
                    this.floater("+" + recovery + " · " + companion.name, companion.color);
                } else {
                    const bullets = stronger ? 7 : 4;
                    this.ammo.balas = Math.min(this.ammoMax("balas"), this.ammo.balas + bullets);
                    this.setVipCompanionMood("support", "+" + bullets + " BALAS", 1350);
                    this.floater("+" + bullets + " · " + companion.name, companion.color);
                }
            }

            const pickup = this.companionPickupTarget(companion);
            const trailingAngle = player.angle + Math.PI;
            let targetX = player.x + Math.cos(trailingAngle) * 0.82 + Math.sin(player.angle) * 0.22;
            let targetY = player.y + Math.sin(trailingAngle) * 0.82 - Math.cos(player.angle) * 0.22;

            if (pickup) {
                targetX = pickup.x;
                targetY = pickup.y;
            }

            const dx = targetX - companion.x;
            const dy = targetY - companion.y;
            const distance = Math.hypot(dx, dy);

            if (distance > 0.08) {
                const step = Math.min(distance, (2.1 + companion.level * 0.13) * Math.min(0.05, dt / 1000));
                const nextX = companion.x + dx / distance * step;
                const nextY = companion.y + dy / distance * step;

                if (this.freeSpot(nextX, nextY, 0.13)) {
                    companion.x = nextX;
                    companion.y = nextY;
                } else if (this.freeSpot(nextX, companion.y, 0.13)) {
                    companion.x = nextX;
                } else if (this.freeSpot(companion.x, nextY, 0.13)) {
                    companion.y = nextY;
                }
            }

            if (pickup) {
                this.collectVipCompanionPickup(companion);
            }

            companion.lastPlayerX = player.x;
            companion.lastPlayerY = player.y;

        }


        onVipFocus(support) {

            const companion = this.virtualCompanion;
            if (!companion) {
                return false;
            }

            const duration = Math.max(500, Number(support && support.focusDuration) || 1200);
            this.setVipCompanionMood("focus", (support && support.focus) || "FOCO ACTIVO", duration);
            return true;

        }


        onVipFocusEnd() {
            this.setVipCompanionMood("follow", "EN FORMACIÓN", 700);
        }


        destroy() {

            this.unbindPointer();

            this.stage.destroy();

        }


        /* Las rutas ampliadas ya llegan saneadas desde maps.js, pero esta
           segunda compuerta protege la partida si un mapa futuro conserva un
           símbolo antiguo. Un pool ausente se permite sólo para harnesses y
           mapas externos heredados; toda zona oficial declara el suyo. */
        isLevelEnemyTileAllowed(tile) {

            const pool = this.cfg && this.cfg.enemyPool;

            return !Array.isArray(pool) || pool.indexOf(tile) !== -1;

        }


        isLevelEnemyKindAllowed(kind) {

            const tile = ENEMY_TILE_BY_KIND[kind];

            return !tile || this.isLevelEnemyTileAllowed(tile);

        }


        loadLevel(index, options = {}) {

            this.levelIndex = index;

            this.cfg = OP.LEVELS[Math.min(index, OP.LEVELS.length - 1)];

            this.grid = this.cfg.map.map((row) => row.split(""));

            this.minimapCache = null;

            this.shots = [];
            this.hostileShots = [];
            this.pickups = [];
            this.particles = [];
            this.decals = [];
            this.puddles = [];
            this.beams = [];
            this.floaters = [];
            this.tracers = [];
            this.impactBursts = [];
            this.aoeBursts = [];
            this.muzzleFlash = null;
            this.props = [];

            this.enemies = [];

            this.boss = null;
            this.bossIntro = 0;
            this.bossIntroMax = 0;
            this.lootTransitioning = false;
            this.banner = null;
            this.transmission = null;
            this.syncNarrativeControl();
            this.nextArtStreamAt = this.time + 120;

            this.player = null;

            for (let y = 0; y < MAP_H; y += 1) {

                for (let x = 0; x < MAP_W; x += 1) {

                    const cell = this.grid[y][x];

                    const spot = { x: x + 0.5, y: y + 0.5 };

                    if (cell === "P") {

                        this.player = { x: spot.x, y: spot.y, angle: 0 };

                        this.grid[y][x] = ".";

                    } else if (CHAR_ENEMY[cell]) {

                        /* Nunca se materializa una marca que no esté en el
                           pool de esta zona. Se limpia igual para que una
                           edición errónea no forme una pared invisible. */
                        if (this.isLevelEnemyTileAllowed(cell)) {
                            this.spawnEnemy(CHAR_ENEMY[cell], spot);
                        }

                        this.grid[y][x] = ".";

                    } else if (cell === "B" && this.cfg.boss) {

                        this.boss = this.spawnEnemy(this.cfg.boss, spot);

                        this.grid[y][x] = ".";

                    } else if (CHAR_ITEM[cell]) {

                        const mappedItem = CHAR_ITEM[cell];

                        if (this.isWeaponPickup(mappedItem)) {
                            /* Las marcas 2–7 son cajas de arsenal: cada una
                               tira un arma de la pool permitida por la zona,
                               en vez de repetir un premio fijo entre partidas. */
                            this.spawnRandomWeaponPickup(
                                spot.x,
                                spot.y,
                                mappedItem,
                                { source: "mapa" }
                            );
                        } else {
                            this.pickups.push({
                                type: mappedItem,
                                x: spot.x,
                                y: spot.y,
                                bob: Math.random() * 6
                            });
                        }

                        this.grid[y][x] = ".";

                    } else if (CHAR_PROP[cell]) {

                        /* Los props son sólidos (bloquean el paso) pero no
                           se dibujan como muros: son sprites. */
                        this.props.push({
                            kind: CHAR_PROP[cell],
                            x: spot.x,
                            y: spot.y
                        });

                    } else if (cell === "B") {

                        this.grid[y][x] = ".";

                    }

                }

            }

            if (!this.player) {
                this.player = { x: 1.5, y: 1.5, angle: 0 };
            }

            /* El informe de desempeño se reinicia en cada zona:
               es lo que el mercader usará para burlarse. */
            this.report = { damage: 0, flawless: true };

            /* Salas secretas: se tallan en el mapa al azar */
            this.buildSecretRooms();

            /* El compañero equipado conserva el canal al cruzar de zona y
               reaparece detrás del visor; no ocupa un panel externo. */
            if (this.virtualCompanion) {
                this.placeVirtualCompanion();
            }

            /* Cada zona recibe un único reintento de campo. Al restaurarlo
               se conserva la misma carga marcada como usada. */
            if (options.fieldCheckpoint) {
                this.fieldCheckpoint = Object.assign({}, options.fieldCheckpoint, { available: false });
            } else {
                this.saveFieldCheckpoint();
            }

            /* Mirar hacia el centro del mapa */
            this.player.angle = Math.atan2(
                MAP_H / 2 - this.player.y,
                MAP_W / 2 - this.player.x
            );

            /* El dossier sustituye al cartel genérico al existir una ruta
               narrativa para la zona. Los mapas antiguos o un smoke mínimo
               conservan el rótulo clásico como respaldo. */
            if (!this.openLevelTransmission()) {
                this.banner = {
                    title: this.cfg.name,
                    text: this.cfg.subtitle + " · " + this.enemies.length + " hostiles",
                    timer: 2400,
                    max: 2400,
                    color: this.cfg.light
                };
            }

            /* La transmisión pide primero la voz y, si aplica, al jefe. Sólo
               después se adelanta el arte de enemigos únicos de la zona;
               así el par visible en la tarjeta gana la cola de descarga sin
               mover ninguna solicitud al render o al combate. */
            this.preloadLevelEnemyArtwork();

            /* En las zonas con jefe suena la pista agresiva */
            A.audio.music(this.worldTrack());

            if (this.boss) {
                A.audio.play("jefe");
            }

            this.updateStats();

        }


        /* ---------------------------------------------------------
           DOSSIER / TRANSMISIONES

           La historia de la ruta se dibuja encima del visor sin cambiar
           `phase`: entrar, pelear y recoger botín mantienen exactamente
           los mismos controles. Las entradas que no traen dossier siguen
           funcionando para mapas de prueba o contenidos anteriores.
           --------------------------------------------------------- */

        dossierForLevel() {

            const dossiers = OP.DOSSIER || {};

            return dossiers[this.cfg && this.cfg.id] || null;

        }


        /* Un dossier conserva su briefing principal, pero puede traer pares
           alternos para que los capítulos de una primera ruta, los reintentos
           y una nueva incursión no suenen como una grabación idéntica. La
           rotación es determinista: no deja la personalidad ni la información
           táctica al azar. */
        transmissionEntry(entry, kind) {

            if (!entry) {
                return null;
            }

            const variants = Array.isArray(entry.variants)
                ? entry.variants.filter((variant) => variant && (
                    Array.isArray(variant.lines) || typeof variant.line === "string"
                ))
                : [];

            if (!variants.length) {
                return entry;
            }

            this.transmissionVariantCursor = this.transmissionVariantCursor || {};

            const levelId = this.cfg && this.cfg.id ? this.cfg.id : "sin-zona";
            const key = levelId + ":" + (kind || "briefing");
            const sequence = [entry].concat(variants);
            const hasCursor = Object.prototype.hasOwnProperty.call(
                this.transmissionVariantCursor,
                key
            );
            /* La primera ruta distribuye las tres voces por capítulo; una
               repetición sigue desde ahí y nunca cae enseguida en el mismo
               par. Los cierres se desplazan un paso para no duplicar la voz
               de entrada del mismo jefe. */
            const initialCursor = Math.max(0, Number(this.levelIndex) || 0) + (
                kind === "clear" ? 1 : 0
            );
            const cursor = hasCursor
                ? this.transmissionVariantCursor[key]
                : initialCursor;
            const selected = sequence[cursor % sequence.length];

            this.transmissionVariantCursor[key] = cursor + 1;

            return selected === entry
                ? entry
                : Object.assign({}, entry, selected);

        }


        /* El visor usa una fuente monoespaciada. Partir por palabras una vez
           al crear la transmisión mantiene los dos retratos de jefe visibles
           y evita medir texto o recalcular layout en cada frame. */
        wrapTransmissionLines(lines, limit) {

            const maxCharacters = Math.max(18, Math.floor(Number(limit) || 64));
            const wrapped = [];

            (lines || []).forEach((line) => {
                const words = String(line || "").trim().split(/\s+/).filter(Boolean);
                let row = "";

                words.forEach((word) => {
                    const next = row ? row + " " + word : word;

                    if (row && next.length > maxCharacters) {
                        wrapped.push(row);
                        row = word;
                    } else {
                        row = next;
                    }
                });

                if (row) {
                    wrapped.push(row);
                }
            });

            return wrapped.length ? wrapped : [""];

        }


        transmissionPortraitId(entry) {

            if (!entry || !entry.speaker || !A.assets ||
                typeof A.assets.characterImageId !== "function") {
                return "";
            }

            return A.assets.characterImageId(
                entry.speaker,
                entry.expression || "full"
            );

        }


        makeTransmission(dossier, kind) {

            const dossierEntry = kind === "clear" && dossier
                ? dossier.clear
                : dossier;
            const entry = this.transmissionEntry(dossierEntry, kind);

            if (!entry) {
                return null;
            }

            const profile = COMMS_PERSONNEL[entry.speaker] || COMMS_PERSONNEL.rog;
            const isThreat = kind === "threat";
            const lines = Array.isArray(entry.lines)
                ? entry.lines.slice(0, 2)
                : [entry.line || ""];
            const displayLines = this.wrapTransmissionLines(
                lines,
                isThreat ? 68 : 64
            );
            const characters = lines.reduce((total, line) => total + String(line).length, 0);

            return {
                kind,
                /* La lectura se anima una vez, pero la tarjeta queda hasta el
                   gesto del jugador. La pista de botín no bloquea sus 5 s. */
                blocking: kind !== "clear",
                elapsed: 0,
                revealDuration: Math.max(TRANSMISSION_FADE_MS, 150 + characters * TRANSMISSION_TYPE_MS),
                speaker: entry.speaker || "rog",
                name: profile.name,
                role: profile.role,
                color: isThreat ? "#FB7185" : profile.color,
                speakerColor: profile.color,
                channel: entry.channel || "CANAL DE OPERACIONES",
                objective: entry.objective || "",
                lines,
                displayLines,
                /* Una amenaza necesita leer a la voz y reconocer al jefe:
                   ambos IDs viajan juntos hacia la misma tarjeta. */
                portraitId: this.transmissionPortraitId(entry),
                threatAsset: isThreat && this.boss ? this.boss.assetId : "",
                threatName: isThreat && this.boss
                    ? this.boss.type.label
                    : "",
                sector: this.cfg.stage || String(this.levelIndex + 1)
            };

        }


        preloadTransmissionArtwork(transmission) {

            if (!transmission || !A.assets || typeof A.assets.preload !== "function") {
                return;
            }

            /* En una alerta de jefe la escena es deliberadamente dual: el
               objetivo hostil y el retrato de quien lo reporta. Se limitan a
               esos dos IDs únicos y se solicitan mientras la lectura manual
               bloquea el combate; `Image.decoding = async` evita convertir
               su decodificación en trabajo del primer frame de combate. */
            const assetIds = [
                transmission.threatAsset,
                transmission.portraitId
            ].filter((assetId, index, list) => assetId && list.indexOf(assetId) === index);

            if (!assetIds.length) {
                return;
            }

            A.assets.preload(assetIds);

            if (transmission.threatAsset && this.boss) {
                this.boss.assetRequested = true;
            }

        }


        openLevelTransmission() {

            const dossier = this.dossierForLevel();

            if (!dossier) {
                return false;
            }

            const kind = this.boss ? "threat" : "briefing";

            this.transmission = this.makeTransmission(dossier, kind);

            this.preloadTransmissionArtwork(this.transmission);

            /* La radio ya pidió su ilustración prioritaria. En un jefe son
               dos retratos, no una oleada: dejamos un pequeño margen extra
               antes de reanudar la cola de enemigos para que ambos puedan
               decodificar durante la lectura manual, incluso en equipos
               restringidos. */
            const dualPortraits = Boolean(
                this.transmission && this.transmission.threatAsset && this.transmission.portraitId
            );
            this.nextArtStreamAt = Math.max(
                this.nextArtStreamAt,
                this.time + (this.renderProfile.constrained
                    ? (dualPortraits ? 1220 : 1050)
                    : (dualPortraits ? 780 : 680))
            );

            if (this.boss) {
                this.bossIntro = BOSS_TRANSMISSION_PULSE_MS;
                this.bossIntroMax = BOSS_TRANSMISSION_PULSE_MS;
            }

            this.syncNarrativeControl();
            return Boolean(this.transmission);

        }


        openClearTransmission() {

            const dossier = this.dossierForLevel();

            if (!dossier || !dossier.clear) {
                return false;
            }

            this.transmission = this.makeTransmission(dossier, "clear");

            this.preloadTransmissionArtwork(this.transmission);
            this.syncNarrativeControl();

            return Boolean(this.transmission);

        }


        updateTransmission(dt) {

            if (!this.transmission) {
                return;
            }

            const transmission = this.transmission;
            const delta = Math.max(0, Number(dt) || 0);
            transmission.elapsed = Math.min(
                transmission.revealDuration || TRANSMISSION_FADE_MS,
                (transmission.elapsed || 0) + delta
            );

        }


        dismissTransmission() {

            if (!this.transmission) {
                return false;
            }

            this.transmission = null;
            this.syncNarrativeControl();
            A.audio.play("select");
            return true;

        }


        /* Coordina todas las lecturas de OP404 con el botón táctil común del
           shell. La prioridad es intro → bienvenida VIP → transmisión; una
           historia global del shell toma el control temporalmente por encima. */
        syncNarrativeControl() {

            if (!this.shell || typeof this.shell.setNarrativeControl !== "function" ||
                this.shell.story) {
                return;
            }

            /* Antes de pulsar JUGAR la capa READY es la única interacción
               válida; no adelantamos una transmisión que aún no empezó. */
            if (this.shell.state && this.shell.state !== "running") {
                this.shell.setNarrativeControl(null);
                return;
            }

            if (this.phase === "intro" && this.intro) {
                this.shell.setNarrativeControl({
                    label: "SIGUIENTE ESCENA",
                    onActivate: () => {
                        if (this.phase !== "intro" || !this.intro) {
                            return false;
                        }
                        this.intro.skipScene();
                        return true;
                    },
                    onSkip: () => {
                        if (this.phase === "intro" && this.intro) {
                            this.intro.skipAll();
                        }
                    }
                });
                return;
            }

            const talkingAlly = this.activeAllyDialogue();
            if (talkingAlly) {
                this.shell.setNarrativeControl({
                    label: "SIGUIENTE MENSAJE",
                    onActivate: () => this.advanceAllyDialogue(),
                    onSkip: () => this.skipAllyDialogue()
                });
                return;
            }

            if (this.phase === "shop" && this.shop && this.shop.intro >= 0 &&
                typeof this.shop.advanceIntro === "function") {
                this.shell.setNarrativeControl({
                    label: "SIGUIENTE MENSAJE",
                    onActivate: () => this.shop.advanceIntro(),
                    onSkip: () => this.shop.skipIntro()
                });
                return;
            }

            if (this.transmission) {
                this.shell.setNarrativeControl({
                    label: "CONTINUAR TRANSMISIÓN",
                    onActivate: () => this.dismissTransmission(),
                    onSkip: () => this.dismissTransmission()
                });
                return;
            }

            this.shell.setNarrativeControl(null);

        }


        /* =========================================================
           SALAS SECRETAS

           Cada zona puede esconder una o dos habitaciones talladas
           en un bloque macizo de pared. No hay puerta marcada: hay
           que empujar contra el muro correcto. Dentro espera un
           compañero de trabajo.
           ========================================================= */

        buildSecretRooms() {

            this.allies = [];
            this.secretRooms = [];
            this.secretDoors = [];

            /* Los mapas ampliados ofrecen más bloques que revisar: la
               frecuencia sube sin volver cada ruta lateral obligatoria. */
            if (Math.random() > 0.72) {

                this.scatterClaps();

                return;

            }

            /* Casi siempre una sola; en los mapas grandes una proporción
               algo mayor abre una segunda recompensa de exploración. */
            const wanted = Math.random() < 0.32 ? 2 : 1;

            const familiar = Math.random() < 0.5
                ? ["desire", "davinchi"]
                : ["davinchi", "desire"];

            /* Sil llega por un canal cifrado, por eso no reemplaza la
               rotación normal de Desire/Davinchi ni aparece en cada sala.
               Si la habitación permite un segundo encuentro, éste conserva
               también uno de los aliados habituales. */
            const kinds = Math.random() < SIL_SECRET_CHANCE
                ? ["sil"].concat(familiar)
                : familiar;

            let made = 0;

            /* Los mapas son de pasillos, así que se talla en el
               bloque de pared más grande que quepa. Si no cabe
               ninguno, este nivel simplemente no tiene sala. */
            const sizes = [3, 2];

            for (let si = 0; si < sizes.length && made < wanted; si += 1) {

                const size = sizes[si];

                const spots = this.findWallBlocks(size);

                /* Barajado in situ (Fisher-Yates) */
                for (let k = spots.length - 1; k > 0; k -= 1) {

                    const j = Math.floor(Math.random() * (k + 1));

                    const tmp = spots[k];
                    spots[k] = spots[j];
                    spots[j] = tmp;

                }

                for (let i = 0; i < spots.length && made < wanted; i += 1) {

                    const spot = spots[i];

                    if (!this.isSolidBlock(spot.x, spot.y, size, size)) {
                        continue;
                    }

                    const door = this.findSecretDoor(spot.x, spot.y, size, size);

                    if (!door) {
                        continue;
                    }

                    for (let ry = spot.y; ry < spot.y + size; ry += 1) {

                        for (let rx = spot.x; rx < spot.x + size; rx += 1) {
                            this.grid[ry][rx] = ".";
                        }

                    }

                    /* La pared falsa se abre: hay que dar con ella */
                    this.grid[door.y][door.x] = ".";

                    /* La sala se marca para pintarle otro suelo y
                       para saber cuándo el jugador está dentro. */
                    this.secretRooms.push({
                        x: spot.x,
                        y: spot.y,
                        w: size,
                        h: size,
                        found: false
                    });

                    this.secretDoors.push({
                        x: door.x,
                        y: door.y,
                        found: false
                    });

                    /* El aliado va justo en el centro de la sala */
                    this.spawnAlly(
                        kinds[made % kinds.length],
                        spot.x + size / 2,
                        spot.y + size / 2
                    );

                    made += 1;

                }

            }

            this.scatterClaps();

        }


        /* ¿Está el jugador dentro de una sala secreta? */
        inSecretRoom() {

            const p = this.player;

            return (this.secretRooms || []).some(
                (room) => p.x >= room.x && p.x <= room.x + room.w
                    && p.y >= room.y && p.y <= room.y + room.h
            );

        }


        /* ¿Es todo pared en ese rectángulo? */
        isSolidBlock(x, y, w, h) {

            for (let ry = y; ry < y + h; ry += 1) {

                for (let rx = x; rx < x + w; rx += 1) {

                    if (rx < 0 || ry < 0 || rx >= MAP_W || ry >= MAP_H) {
                        return false;
                    }

                    if (this.grid[ry][rx] === ".") {
                        return false;
                    }

                }

            }

            return true;

        }


        /* Una celda del borde del bloque que toque suelo por fuera */
        findSecretDoor(x, y, w, h) {

            const candidates = [];

            const check = (dx, dy, ox, oy) => {

                const outX = dx + ox;
                const outY = dy + oy;

                if (outX < 1 || outY < 1 || outX >= MAP_W - 1 || outY >= MAP_H - 1) {
                    return;
                }

                if (this.grid[outY][outX] === ".") {
                    candidates.push({ x: dx, y: dy });
                }

            };

            for (let rx = x; rx < x + w; rx += 1) {
                check(rx, y - 1, 0, -1);
                check(rx, y + h, 0, 1);
            }

            for (let ry = y; ry < y + h; ry += 1) {
                check(x - 1, ry, -1, 0);
                check(x + w, ry, 1, 0);
            }

            if (!candidates.length) {
                return null;
            }

            return candidates[Math.floor(Math.random() * candidates.length)];

        }


        /* Todos los bloques de pared de NxN que hay en el mapa */
        findWallBlocks(size) {

            const found = [];

            for (let y = 1; y < MAP_H - size; y += 1) {

                for (let x = 1; x < MAP_W - size; x += 1) {

                    if (this.isSolidBlock(x, y, size, size)) {
                        found.push({ x, y });
                    }

                }

            }

            return found;

        }


        /* ---------------------------------------------------------
           COMPAÑEROS ALIADOS
           --------------------------------------------------------- */

        spawnAlly(kind, x, y) {

            const isDesire = kind === "desire";
            const isSil = kind === "sil";

            this.allies.push({

                kind,

                x,
                y,

                /* Animación de aparición: se dispara al verte */
                greeted: false,
                intro: 0,
                anim: Math.random() * 1000,

                gave: false,
                secret: isSil,

                label: isDesire ? "DESIRE" : (isSil ? "SIL" : "DAVINCHI"),

                color: isDesire ? "#F472B6" : (isSil ? "#FB923C" : "#A3E635"),

                /* Capítulo que toca según los encuentros previos */
                script: this.allyScript(kind),

                /* Número de encuentro, para el rótulo */
                meeting: (this.allyMet[kind] || 0) + 1,

                step: -1,
                expression: isDesire ? "emocionada" : (isSil ? "seria" : "serio")

            });

            /* El mundo sólo necesita el cuerpo completo al entrar. Cargar
               todas las expresiones aquí provocaba una ráfaga de decodificado
               PNG justo antes del combate; el diálogo anticipa las dos que
               va a usar cuando el jugador llega a la sala. */
            const portrait = ALLY_ART[kind];
            if (portrait && A.assets && typeof A.assets.preload === "function") {
                A.assets.preload([portrait.idle]);
            }

        }


        /* El capítulo que le toca contar a este aliado */
        allyScript(kind) {

            const arc = kind === "desire"
                ? DESIRE_ARC
                : (kind === "sil" ? SIL_ARC : DAVINCHI_ARC);

            const extra = kind === "desire"
                ? DESIRE_EXTRA
                : (kind === "sil" ? SIL_EXTRA : DAVINCHI_EXTRA);

            const seen = this.allyMet[kind] || 0;

            if (seen < arc.length) {
                return arc[seen];
            }

            /* Arco terminado: reencuentros cortos que sí se pueden
               repetir sin sonar a disco rayado. */
            return extra[(seen - arc.length) % extra.length];

        }


        /* Precarga como máximo la línea actual y la siguiente. El fallback
           de cuerpo completo mantiene el cuadro estable si la red tarda, sin
           descargar un álbum entero de expresiones durante la partida. */
        preloadAllyDialogueWindow(ally) {

            if (!A.assets || typeof A.assets.characterImageId !== "function" ||
                typeof A.assets.preload !== "function") {
                return;
            }

            const ids = [];

            for (let offset = 0; offset < 2; offset += 1) {
                const step = ally.step + offset;

                if (step < 0 || step >= ally.script.length) {
                    continue;
                }

                const expression = allyDialogueExpression({
                    kind: ally.kind,
                    meeting: ally.meeting,
                    step
                });
                const id = A.assets.characterImageId(ally.kind, expression);

                if (id && ids.indexOf(id) < 0) {
                    ids.push(id);
                }
            }

            if (ids.length) {
                A.assets.preload(ids);
            }

        }


        /* El aliado activo es una escena de lectura, no un temporizador de
           proximidad. Se consulta desde input, render y el botón táctil común. */
        activeAllyDialogue() {

            return (this.allies || []).find((ally) => (
                ally.greeted && !ally.gave && ally.step >= 0 &&
                ally.step < ally.script.length
            )) || null;

        }


        /* Mantiene viva la aparición visual mientras la simulación queda
           detenida para lectura; no toca pasos del diálogo ni recompensas. */
        updateAllyPresentation(dt) {

            const ally = this.activeAllyDialogue();
            const delta = Math.max(0, Number(dt) || 0);

            if (ally) {
                ally.anim += delta;
                if (ally.intro > 0) {
                    ally.intro = Math.max(0, ally.intro - delta);
                }
            }

            if (this.vignette) {
                this.vignette.timer -= delta;
                if (this.vignette.timer <= 0) {
                    this.vignette = null;
                }
            }

        }


        finishAllyDialogue(ally) {

            if (!ally || ally.gave) {
                return false;
            }

            ally.gave = true;
            ally.step = ally.script.length;
            this.allyGift(ally);
            A.audio.music(this.worldTrack());
            this.syncNarrativeControl();
            A.audio.play("select");
            return true;

        }


        advanceAllyDialogue() {

            const ally = this.activeAllyDialogue();

            if (!ally) {
                return false;
            }

            if (ally.step >= ally.script.length - 1) {
                return this.finishAllyDialogue(ally);
            }

            ally.step += 1;
            ally.expression = allyDialogueExpression(ally);
            this.preloadAllyDialogueWindow(ally);
            A.audio.play("move");
            return true;

        }


        skipAllyDialogue() {

            return this.finishAllyDialogue(this.activeAllyDialogue());

        }


        updateAllies(dt) {

            if (!this.allies || !this.allies.length) {
                return;
            }

            const p = this.player;

            this.allies.forEach((ally) => {

                ally.anim += dt;

                const dx = ally.x - p.x;
                const dy = ally.y - p.y;

                const distance = Math.sqrt(dx * dx + dy * dy);

                /* --- Entrada: sólo al pisar la sala --- */
                if (!ally.greeted && distance < 3.4) {

                    ally.greeted = true;

                    ally.intro = 2200;

                    ally.step = 0;
                    ally.expression = allyDialogueExpression(ally);
                    this.preloadAllyDialogueWindow(ally);
                    /* No hay movimiento/fuego retenido detrás de la escena. */
                    this.releaseKeys();

                    /* Queda registrado: la próxima vez seguirá
                       contando desde donde lo dejó. */
                    this.allyMet[ally.kind] = (this.allyMet[ally.kind] || 0) + 1;

                    /* Música de refugio mientras dure la escena */
                    A.audio.music("secreta");

                    A.audio.play("secreto");

                    if (ally.kind === "desire") {

                        this.vignette = {
                            text: "Soy VIP Baby",
                            timer: 2400,
                            max: 2400,
                            color: "#F472B6"
                        };

                    } else if (ally.kind === "sil") {

                        this.vignette = {
                            text: "CANAL CIFRADO · FONDO VIP",
                            timer: 2400,
                            max: 2400,
                            color: "#FB923C"
                        };

                    }

                    this.syncNarrativeControl();

                }

                if (ally.intro > 0) {
                    ally.intro = Math.max(0, ally.intro - dt);
                }

                /* El texto queda abierto hasta que el jugador pulse
                   ESPACIO/tocar. La recompensa sólo llega tras la última
                   línea manual (o un salto explícito), nunca por cercanía. */

            });

            if (this.vignette) {

                this.vignette.timer -= dt;

                if (this.vignette.timer <= 0) {
                    this.vignette = null;
                }

            }

        }


        /* Cuadro de diálogo del aliado que está hablando */
        drawAllyTalk() {

            const talking = (this.allies || []).find(
                (ally) => ally.step >= 0 && ally.step < ally.script.length
            );

            if (!talking) {
                return;
            }

            const { ctx } = this.stage;

            const text = talking.script[talking.step];

            const boxW = 420;
            const boxH = 58;

            const bx = (WIDTH - boxW) / 2;
            const by = HEIGHT - 118;
            const portrait = ALLY_ART[talking.kind];
            const expressionId = allyDialogueArtId(talking);
            let portraitId = expressionId;
            let portraitImage = portraitId && A.assets
                ? A.assets.readyImage(portraitId)
                : null;

            /* La carga lenta nunca devuelve al retrato procedural: hasta
               que llegue el gesto pedido, se mantiene el cuerpo completo. */
            if (!portraitImage && portrait && A.assets) {
                portraitId = portrait.idle;
                portraitImage = A.assets.readyImage(portraitId);
            }

            const portraitFrame = portraitImage && typeof A.assets.canvasFrame === "function"
                ? A.assets.canvasFrame(portraitId)
                : null;
            const hasPortrait = portraitImage && (portraitImage.naturalWidth || portraitImage.width);
            const textX = hasPortrait ? bx + 74 : bx + 14;

            ctx.save();

            /* Marco */
            canvasKit.fillRoundRect(
                ctx, bx, by, boxW, boxH, 8, "rgba(6, 9, 16, 0.92)"
            );

            ctx.strokeStyle = talking.color;
            ctx.lineWidth = 2;

            if (ctx.roundRect) {

                ctx.beginPath();
                ctx.roundRect(bx, by, boxW, boxH, 8);
                ctx.stroke();

            } else {

                ctx.strokeRect(bx, by, boxW, boxH);

            }

            /* La viñeta muestra el gesto que acompaña a esa línea. Si la
               red aún lo está cargando, el cuerpo completo queda estable
               como respaldo y jamás reaparece el dibujo viejo. */
            if (hasPortrait) {

                const sourceX = portraitFrame ? portraitFrame.x : 0;
                const sourceY = portraitFrame ? portraitFrame.y : 0;
                const sourceW = portraitFrame
                    ? portraitFrame.width
                    : (portraitImage.naturalWidth || portraitImage.width);
                const sourceH = portraitFrame
                    ? portraitFrame.height
                    : (portraitImage.naturalHeight || portraitImage.height);
                const scale = Math.min(54 / sourceW, 46 / sourceH);
                const portraitW = sourceW * scale;
                const portraitH = sourceH * scale;

                canvasKit.fillRoundRect(ctx, bx + 8, by + 6, 56, 46, 5, "rgba(5, 7, 14, 0.72)");
                ctx.drawImage(
                    portraitImage,
                    sourceX,
                    sourceY,
                    sourceW,
                    sourceH,
                    bx + 36 - portraitW / 2,
                    by + 52 - portraitH,
                    portraitW,
                    portraitH
                );

            }

            /* Nombre */
            canvasKit.text(ctx, talking.label, textX, by + 15, {
                font: "800 10px 'Orbitron', sans-serif",
                color: talking.color,
                align: "left"
            });

            /* Progreso del monólogo */
            canvasKit.text(
                ctx,
                (talking.step + 1) + "/" + talking.script.length + " · ESPACIO",
                bx + boxW - 14,
                by + 15,
                {
                    font: "600 7px 'JetBrains Mono', monospace",
                    color: "rgba(245, 247, 255, 0.52)",
                    align: "right"
                }
            );

            /* La frase, partida en dos líneas si hace falta */
            const words = text.split(" ");

            const lines = [];

            let line = "";

            words.forEach((word) => {

                const test = line ? line + " " + word : word;

                if (test.length > (hasPortrait ? 38 : 46)) {

                    lines.push(line);

                    line = word;

                } else {

                    line = test;

                }

            });

            if (line) {
                lines.push(line);
            }

            lines.slice(0, 2).forEach((row, i) => {

                canvasKit.text(ctx, row, textX, by + 34 + i * 14, {
                    font: "500 11px 'JetBrains Mono', monospace",
                    color: "#F5F7FF",
                    align: "left"
                });

            });

            ctx.restore();

        }


        allyGift(ally) {

            if (ally.kind === "sil") {

                /* El fondo llega directo a la cartera: Sil es el contacto
                   secreto que hace viable una compra antes de la próxima
                   Sala VIP, no una caja aleatoria que pueda perderse. */
                const amount = Math.max(
                    1,
                    Math.round(SIL_VIP_STASH * this.tuning.money)
                );

                this.money += amount;

                this.bannerText(
                    "FONDO DE RED RECUPERADO",
                    "SIL CIFRÓ +$" + amount + " PARA LA SALA VIP",
                    "#FB923C"
                );
                this.floater("+$" + amount + " · FONDO VIP", "#FB923C");
                this.shell.setStatus("SIL TE PASÓ +$" + amount + " PARA COMPRAS");
                this.updateStats();
                A.audio.play("coin");

                return;

            }

            if (ally.kind === "desire") {

                /* Cura fuerte o refuerzo directo */
                if (this.health < MAX_HEALTH * 0.7) {

                    this.health = Math.min(
                        MAX_HEALTH,
                        this.health + Math.round(MAX_HEALTH * 0.5)
                    );

                    this.floater("+50% SALUD", "#F472B6");

                    this.shell.setStatus("DESIRE TE CURÓ");

                } else {

                    this.grantShield(38);

                    this.furiaCharge = this.furiaNeeded();

                    this.floater("ESCUDO + FURIA", "#F472B6");

                    this.shell.setStatus("DESIRE TE DIO UN BUFF");

                }

                A.audio.play("win");

                return;

            }

            /* DAVINCHI: munición pesada y mejoras tácticas */
            const upgrades = [
                "escopeta", "ametralladora", "lanzapasticho",
                "riflepulso", "criopasticho", "rebotador"
            ];

            const missing = upgrades.filter((kind) => !this.owned[kind]);

            if (missing.length) {

                const gift = missing[Math.floor(Math.random() * missing.length)];

                this.owned[gift] = true;

                this.floater("ARMA: " + gift.toUpperCase(), "#A3E635");

                this.shell.setStatus("DAVINCHI TE PASÓ UNA " + gift.toUpperCase());

            } else {

                this.ammo.balas = AMMO_MAX.balas;
                this.ammo.cartuchos = AMMO_MAX.cartuchos;

                this.ammo.pastichos = Math.min(
                    AMMO_MAX.pastichos,
                    this.ammo.pastichos + 4
                );
                this.ammo.celdas = Math.min(AMMO_MAX.celdas, this.ammo.celdas + 12);

                this.floater("MUNICIÓN AL TOPE", "#A3E635");

                this.shell.setStatus("DAVINCHI TE SURTIÓ");

            }

            this.yanquis += 1;

            A.audio.play("arma");

        }


        /* Bolsas del CLAP repartidas por el suelo */
        scatterClaps() {

            const wanted = 1 + Math.floor(Math.random() * 3);

            let placed = 0;

            for (let attempt = 0; attempt < 220 && placed < wanted; attempt += 1) {

                const x = 1 + Math.floor(Math.random() * (MAP_W - 2));
                const y = 1 + Math.floor(Math.random() * (MAP_H - 2));

                if (this.grid[y][x] !== ".") {
                    continue;
                }

                const dx = x + 0.5 - this.player.x;
                const dy = y + 0.5 - this.player.y;

                /* Ni encima del jugador ni pegada a otra bolsa */
                if (Math.sqrt(dx * dx + dy * dy) < 3) {
                    continue;
                }

                const clash = this.pickups.some(
                    (item) => Math.abs(item.x - x - 0.5) < 2
                        && Math.abs(item.y - y - 0.5) < 2
                );

                if (clash) {
                    continue;
                }

                this.pickups.push({
                    type: "clap",
                    x: x + 0.5,
                    y: y + 0.5,
                    bob: Math.random() * 6
                });

                placed += 1;

            }

        }


        spawnEnemy(kind, spot) {

            /* Todo esbirro de mapa o invocación debe pasar el mismo filtro
               zonal. Los jefes y Gorgojo son excepciones narrativas sin
               marcador de mapa y continúan por su ruta dedicada. */
            if (!this.isLevelEnemyKindAllowed(kind)) {
                return null;
            }

            const type = ENEMIES[kind];
            if (!type) {
                return null;
            }

            const hp = Math.max(
                1,
                Math.round(type.hp * this.cfg.hp * this.tuning.hp)
            );

            const variant = kind === "usuario"
                ? ["usuario", "usuario2", "usuario3"][Math.floor(Math.random() * 3)]
                : (kind === "calidad"
                    ? ["calidad", "calidad2"][Math.floor(Math.random() * 2)]
                    : kind);

            const enemy = {
                kind,
                type,
                x: spot.x,
                y: spot.y,
                hp,
                maxHp: hp,
                flash: 0,
                stagger: 0,
                slowed: 0,
                slowColor: null,
                stun: 0,
                attackTimer: 600 + Math.random() * 600,
                rangedTimer: 900 + Math.random() * 900,
                summonTimer: type.summon ? type.summon.every * 0.6 : 0,
                teleportTimer: type.teleport || 0,
                strafeDir: Math.random() < 0.5 ? -1 : 1,
                strafeTimer: 800 + Math.random() * 900,
                anim: Math.random() * 1000,
                shout: 0,
                shoutText: "",
                shoutTimer: 1200 + Math.random() * 2500,
                /* La visión se actualiza por intervalos, no 60 veces/s. */
                sightTimer: 0,
                sightCellX: null,
                sightCellY: null,
                sees: false,
                dead: false,
                deadTimer: 0,
                phase: 1,
                variant,
                assetId: externalArtId(kind, variant),
                /* Los invocados después de cargar la zona entran a la cola
                   visual al ser relevantes; la baliza de señal evita mostrar
                   la silueta procedural mientras llega su PNG. */
                assetRequested: false
            };

            this.enemies.push(enemy);

            return enemy;

        }


        preloadLevelEnemyArtwork() {

            if (!A.assets || !this.enemies) {
                return;
            }

            const assetIds = [...new Set(this.enemies
                .map((enemy) => enemy.assetId)
                .filter(Boolean))];

            if (!assetIds.length) {
                return;
            }

            /* `assetRequested` mantiene compatible la cola incremental para
               enemigos invocados después, pero los habitantes iniciales de la
               zona ya tienen una solicitud en vuelo antes del primer frame. */
            this.enemies.forEach((enemy) => {
                if (enemy.assetId) {
                    enemy.assetRequested = true;
                }
            });

            if (typeof A.assets.preload === "function") {
                A.assets.preload(assetIds).catch(() => {});
            } else if (typeof A.assets.readyImage === "function") {
                assetIds.forEach((assetId) => A.assets.readyImage(assetId));
            }

        }


        /* Solicitud escalonada para enemigos invocados después. Antes cada
           enemigo podía llamar `readyImage()` en el primer render, incluso
           fuera de cámara; en una zona poblada eso disparaba varios PNG
           grandes a la vez y competía con movimiento, rayos y disparos. Se
           prioriza el enemigo cercano dentro del visor y la baliza de señal
           cubre la decodificación fuera de la ruta crítica. */
        updateArtStreaming() {

            if (!A.assets || !this.enemies || this.time < this.nextArtStreamAt) {
                return;
            }

            let candidate = null;
            let nearest = Infinity;
            const p = this.player;

            for (let i = 0; i < this.enemies.length; i += 1) {

                const enemy = this.enemies[i];

                if (enemy.dead || enemy.hidden || enemy.assetRequested || !enemy.assetId) {
                    continue;
                }

                const dx = enemy.x - p.x;
                const dy = enemy.y - p.y;
                const distance = Math.hypot(dx, dy);

                if (distance > 16) {
                    continue;
                }

                const angle = Math.atan2(dy, dx);
                const delta = Math.abs(Math.atan2(
                    Math.sin(angle - p.angle),
                    Math.cos(angle - p.angle)
                ));
                const visible = enemy.type.boss || delta < FOV * 0.82;

                if (visible && distance < nearest) {
                    candidate = enemy;
                    nearest = distance;
                }

            }

            if (!candidate) {
                /* No hay nada nuevo a la vista; no repetimos trigonometría
                   sobre toda la oleada hasta el siguiente pequeño pulso. */
                this.nextArtStreamAt = this.time + 160;
                return;
            }

            candidate.assetRequested = true;

            if (typeof A.assets.preload === "function") {
                A.assets.preload([candidate.assetId]);
            } else if (typeof A.assets.readyImage === "function") {
                /* Compatibilidad con un cargador mínimo: solicitar una vez
                   sigue siendo bastante mejor que hacerlo por enemigo/frame. */
                A.assets.readyImage(candidate.assetId);
            }

            this.nextArtStreamAt = this.time + (
                this.renderProfile.constrained ? 900 : 520
            );

        }


        /* ---------------------------------------------------------
           Mapa
           --------------------------------------------------------- */

        isWall(x, y) {

            const mx = Math.floor(x);
            const my = Math.floor(y);

            if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H) {
                return true;
            }

            return WALL_CHARS.indexOf(this.grid[my][mx]) >= 0;

        }


        isSolid(x, y) {

            const mx = Math.floor(x);
            const my = Math.floor(y);

            if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H) {
                return true;
            }

            return SOLID_CHARS.indexOf(this.grid[my][mx]) >= 0;

        }


        /* Una cobertura física protege de los dos bandos: muros, barreras de
           señal, escritorios, barriles y mesas no son sólo decorado ni dejan
           pasar proyectiles enemigos mientras bloquean al jugador. */
        blocksProjectile(x, y) {

            return this.isSolid(x, y);

        }


        /* Revisa el tramo completo, no sólo el punto final. Así un cuadro
           lento o una bala rápida no puede saltar por encima de una mesa,
           un barril o una barrera de señal entre dos actualizaciones. */
        projectilePathBlocked(x0, y0, x1, y1) {

            const distance = Math.hypot(x1 - x0, y1 - y0);
            const steps = Math.max(1, Math.ceil(distance * 8));

            for (let i = 1; i <= steps; i += 1) {
                const t = i / steps;
                if (this.blocksProjectile(
                    x0 + (x1 - x0) * t,
                    y0 + (y1 - y0) * t
                )) {
                    return true;
                }
            }

            return false;

        }


        freeSpot(x, y, radius) {

            const r = radius || 0.22;

            return !this.isSolid(x + r, y + r) &&
                !this.isSolid(x - r, y + r) &&
                !this.isSolid(x + r, y - r) &&
                !this.isSolid(x - r, y - r);

        }


        /** ¿Hay línea de visión/cobertura libre entre dos puntos? */
        canSee(x0, y0, x1, y1) {

            const dx = x1 - x0;
            const dy = y1 - y0;

            const distance = Math.hypot(dx, dy);

            const steps = Math.ceil(distance * 4);

            for (let i = 1; i < steps; i += 1) {

                const t = i / steps;

                if (this.blocksProjectile(x0 + dx * t, y0 + dy * t)) {
                    return false;
                }

            }

            return true;

        }


        /* ---------------------------------------------------------
           Bucle
           --------------------------------------------------------- */

        update(dt) {

            this.time += dt;

            /* Cinemática de apertura */
            if (this.phase === "intro") {

                this.intro.update(dt);

                if (this.intro.done) {
                    this.endIntro();
                }

                return;

            }

            /* Sala VIP: el mundo exterior queda congelado */
            if (this.phase === "shop") {

                this.shop.update(dt);

                if (this.shop.done) {
                    this.leaveShop();
                }

                return;

            }

            if (this.banner) {

                this.banner.timer -= dt;

                if (this.banner.timer <= 0) {
                    this.banner = null;
                }

            }

            this.updateTransmission(dt);

            /* Los dossiers de entrada y de jefe esperan lectura manual. El
               mundo no puede seguir dañando al jugador detrás de una escena;
               los avisos de botín siguen sin bloquear su ventana exacta. */
            if (this.transmission && this.transmission.blocking) {
                return;
            }

            /* Los encuentros secretos cuentan una escena completa antes de
               devolver el control; no dejan que enemigos o proximidad corten
               una línea a mitad de lectura. */
            if (this.activeAllyDialogue()) {
                this.updateAllyPresentation(dt);
                return;
            }

            /* Al caer el último hostil queda una ventana jugable de
               exactamente cinco segundos: no hay fuego ni amenazas, pero
               sí movimiento, orientación y recolección del botín recién caído.

               `killEnemy()` puede entrar aquí desde updateShots(). El reloj
               se satura en cero y termina mediante una única compuerta: así
               una ráfaga de varios perdigones nunca deja una fase a medias. */
            if (this.phase === "loot") {

                const safeDt = Number.isFinite(dt) ? Math.max(0, dt) : 0;
                const remaining = Number.isFinite(this.phaseTimer)
                    ? Math.max(0, this.phaseTimer)
                    : 0;
                const lootDt = Math.min(safeDt, remaining);

                this.phaseTimer = Math.max(0, remaining - safeDt);

                this.updatePulses(lootDt);
                this.updatePlayer(lootDt);
                this.updateVirtualCompanion(lootDt);
                this.updatePickups(lootDt);
                this.updateParticles(lootDt);

                if (this.phaseTimer === 0) {
                    this.finishLootWindow();
                }

                return;

            }

            if (this.phase !== "run") {
                return;
            }

            this.updatePulses(dt);
            this.updatePlayer(dt);
            this.updateWeapon(dt);
            this.updateShots(dt);

            /* El último impacto puede abrir el botín dentro de
               updateShots(). No avanzamos sistemas de combate en ese mismo
               frame ni dejamos que un dt largo cierre los cinco segundos. */
            if (this.phase !== "run") {
                this.updateStats();
                return;
            }

            this.updateEnemies(dt);
            this.updateArtStreaming();
            this.updatePickups(dt);
            this.updateParticles(dt);
            this.updateHazards(dt);

            if (this.hurt > 0) {
                this.hurt = Math.max(0, this.hurt - dt);
            }

            if (this.slow > 0) {
                this.slow = Math.max(0, this.slow - dt);
            }

            this.updateAbilities(dt);
            this.updateAllies(dt);
            this.updateVirtualCompanion(dt);

            if (this.recoil > 0) {
                this.recoil = Math.max(0, this.recoil - dt * 0.006);
            }

            if (this.weaponSwap > 0) {
                this.weaponSwap = Math.max(0, this.weaponSwap - dt);
            }

            if (this.bossIntro > 0) {
                this.bossIntro = Math.max(0, this.bossIntro - dt);
            }

            if (this.phase === "run" && this.enemies.length === 0) {
                this.clearLevel();
            }

            /* El HUD no necesita recalcularse en cada paso fijo: los cambios
               importantes lo fuerzan desde disparos, botines y daño. */
            this.updateStats(false);

        }


        /* Pulsos táctiles: un pulso dura un poco y se apaga solo */
        pulse(name) {
            this.pulses[name] = 170;
        }


        updatePulses(dt) {

            Object.keys(this.pulses).forEach((name) => {

                this.pulses[name] -= dt;

                if (this.pulses[name] <= 0) {
                    delete this.pulses[name];
                }

            });

        }


        held(name) {
            return !!this.keys[name] || !!this.pulses[name];
        }


        updatePlayer(dt) {

            const p = this.player;

            const seconds = dt / 1000;

            if (this.held("turnLeft")) {
                p.angle -= TURN_SPEED * seconds;
            }

            if (this.held("turnRight")) {
                p.angle += TURN_SPEED * seconds;
            }

            /* El eje X del stick es giro proporcional: permite corregir una
               esquina con suavidad sin obligar a pulsar una flecha entera. */
            const touchMotion = this.touchMotion || { x: 0, y: 0 };
            const touchTurn = utils.clamp(Number(touchMotion.x) || 0, -1, 1);
            const touchForward = utils.clamp(-(Number(touchMotion.y) || 0), -1, 1);

            if (touchTurn) {
                p.angle += touchTurn * TURN_SPEED * seconds;
            }

            /* Orientación con el ratón sin bloquear (proporcional al borde) */
            if (this.mouseTurn) {
                p.angle += this.mouseTurn * TURN_SPEED * 1.5 * seconds;
            }

            let speed = (this.held("run") ? RUN_SPEED : PLAYER_SPEED) * seconds;

            if (this.slow > 0) {
                speed *= 0.45;
            }

            /* Azúcar del CLAP: subidón de velocidad */
            if (this.sugar > 0) {
                speed *= 1.5;
            }

            /* Pasta picada: caminas como con bloques */
            if (this.sticky > 0) {
                speed *= 0.7;
            }

            let forward = 0;
            let strafe = 0;

            if (this.held("up")) {
                forward += 1;
            }

            if (this.held("down")) {
                forward -= 1;
            }

            /* El eje Y del stick conserva magnitud, por lo que un arrastre
               corto sirve para avanzar despacio y uno al borde da avance
               completo sin introducir una segunda acción táctil. */
            forward += touchForward;

            if (this.held("strafeLeft")) {
                strafe -= 1;
            }

            if (this.held("strafeRight")) {
                strafe += 1;
            }

            if (!forward && !strafe) {
                return;
            }

            const dirX = Math.cos(p.angle);
            const dirY = Math.sin(p.angle);

            let moveX = (dirX * forward - dirY * strafe);
            let moveY = (dirY * forward + dirX * strafe);

            const length = Math.hypot(moveX, moveY) || 1;

            moveX = moveX / length * speed;
            moveY = moveY / length * speed;

            if (this.freeSpot(p.x + moveX, p.y)) {
                p.x += moveX;
            }

            if (this.freeSpot(p.x, p.y + moveY)) {
                p.y += moveY;
            }

            this.bob += dt * (this.held("run") ? 0.016 : 0.011);

        }


        /* ---------------------------------------------------------
           Armas
           --------------------------------------------------------- */

        /* Normaliza niveles heredados o incompletos sin requerir una
           migración de guardado: las mejoras existen sólo dentro de una
           incursión, pero los checkpoints pueden llegar de una versión
           anterior que no conocía el Taller. */
        cloneWeaponUpgrades(source) {

            const copy = {};

            Object.keys(source || {}).forEach((kind) => {
                if (!WEAPONS[kind]) {
                    return;
                }

                const saved = source[kind] || {};
                const levels = {};

                WEAPON_UPGRADE_ORDER.forEach((upgrade) => {
                    levels[upgrade] = Math.max(
                        0,
                        Math.min(
                            WEAPON_UPGRADE_MAX,
                            Math.floor(Number(saved[upgrade]) || 0)
                        )
                    );
                });

                if (WEAPON_UPGRADE_ORDER.some((upgrade) => levels[upgrade] > 0)) {
                    copy[kind] = levels;
                }
            });

            return copy;

        }


        weaponUpgradeLevel(kind, upgrade) {

            if (!WEAPONS[kind] || WEAPON_UPGRADE_ORDER.indexOf(upgrade) < 0) {
                return 0;
            }

            const levels = this.weaponUpgrades && this.weaponUpgrades[kind];

            return Math.max(
                0,
                Math.min(
                    WEAPON_UPGRADE_MAX,
                    Math.floor(Number(levels && levels[upgrade]) || 0)
                )
            );

        }


        weaponUpgradeTotal(kind) {

            return WEAPON_UPGRADE_ORDER.reduce(
                (total, upgrade) => total + this.weaponUpgradeLevel(kind, upgrade),
                0
            );

        }


        weaponProfile(kind) {

            const base = WEAPONS[kind] || WEAPONS.pistola;
            const impact = this.weaponUpgradeLevel(kind, "impact");
            const cycle = this.weaponUpgradeLevel(kind, "cycle");
            const control = this.weaponUpgradeLevel(kind, "control");
            const cycleFloor = base.auto ? 52 : 78;

            return Object.assign({}, base, {
                damage: Math.max(1, Math.round(base.damage * (1 + impact * WEAPON_UPGRADES.impact.damage))),
                cooldown: Math.max(
                    cycleFloor,
                    Math.round(base.cooldown * Math.pow(1 - WEAPON_UPGRADES.cycle.cooldown, cycle))
                ),
                spread: Math.max(0, base.spread * Math.pow(1 - WEAPON_UPGRADES.control.spread, control)),
                speed: base.speed * (1 + control * WEAPON_UPGRADES.control.speed),
                kick: Math.max(0.35, base.kick * (1 - control * WEAPON_UPGRADES.control.kick)),
                upgrades: { impact, cycle, control },
                upgradeTotal: impact + cycle + control
            });

        }


        upgradeWeapon(kind, upgrade) {

            if (!this.owned[kind] || !WEAPONS[kind] ||
                WEAPON_UPGRADE_ORDER.indexOf(upgrade) < 0) {
                return 0;
            }

            const current = this.weaponUpgradeLevel(kind, upgrade);

            if (current >= WEAPON_UPGRADE_MAX) {
                return current;
            }

            this.weaponUpgrades = this.cloneWeaponUpgrades(this.weaponUpgrades);
            this.weaponUpgrades[kind] = Object.assign(
                { impact: 0, cycle: 0, control: 0 },
                this.weaponUpgrades[kind] || {}
            );
            this.weaponUpgrades[kind][upgrade] = current + 1;

            this.floater(
                (WEAPON_UPGRADES[upgrade].label || upgrade).toUpperCase() +
                    " L" + (current + 1) + " · " + WEAPONS[kind].short,
                "#C084FC"
            );
            this.shell.setStatus(
                WEAPONS[kind].short + " · " + WEAPON_UPGRADES[upgrade].label +
                    " L" + (current + 1)
            );
            this.updateStats();

            return current + 1;

        }


        /* Las marcas de arma de los mapas son cajas, no premios fijos. La
           pool se abre gradualmente cada dos zonas para respetar el ritmo de
           descubrimiento y los prototipos tardíos de la campaña. */
        weaponLootPool() {

            const level = Math.max(0, Math.floor(Number(this.levelIndex) || 0));
            const count = Math.min(
                WEAPON_LOOT_ORDER.length,
                1 + Math.floor((level + 1) / 2)
            );

            return WEAPON_LOOT_ORDER.slice(0, count);

        }


        isWeaponPickup(kind) {

            return WEAPON_LOOT_ORDER.indexOf(kind) >= 0;

        }


        randomWeaponPickup(sourceKind) {

            const pool = this.weaponLootPool();

            if (!pool.length) {
                return "";
            }

            const missing = pool.filter((kind) => !this.owned[kind]);
            const choices = missing.length ? missing.slice() : pool.slice();

            /* La caja marcada en el mapa conserva una probabilidad extra de
               entregar su arma original cuando ya pertenece a la pool, pero
               nunca deja de ser una tirada real ni rompe el orden de zonas. */
            if (sourceKind && choices.indexOf(sourceKind) >= 0) {
                choices.push(sourceKind);
            }

            return choices[Math.floor(Math.random() * choices.length)] || "";

        }


        spawnRandomWeaponPickup(x, y, sourceKind, options = {}) {

            const kind = this.randomWeaponPickup(sourceKind);

            if (!kind) {
                return "";
            }

            this.pickups.push({
                type: kind,
                x,
                y,
                bob: Number.isFinite(options.bob) ? options.bob : Math.random() * 6,
                randomWeapon: true,
                source: options.source || "caja"
            });

            return kind;

        }


        maybeDropRandomWeapon(enemy) {

            if (!enemy || !enemy.type) {
                return "";
            }

            const pool = this.weaponLootPool();
            const missing = pool.filter((kind) => !this.owned[kind]);
            const chance = enemy.type.boss
                ? (missing.length ? 1 : 0.28)
                : (missing.length ? 0.018 + Math.min(0.02, this.levelIndex * 0.003) : 0.006);
            const guaranteed = Boolean(enemy.type.boss && missing.length);

            if (!guaranteed && Math.random() >= chance) {
                return "";
            }

            return this.spawnRandomWeaponPickup(
                enemy.x,
                enemy.y,
                "",
                { bob: 0, source: enemy.type.boss ? "jefe" : "enemigo" }
            );

        }


        updateWeapon(dt) {

            /* Durante la Furia el arma dispara sola si mantienes fuego */
            if (this.furiaTime > 0 && this.held("fire") && this.shootTimer <= 0) {
                this.shoot();
            }


            if (this.shootTimer > 0) {
                this.shootTimer = Math.max(0, this.shootTimer - dt);
            }

            /* Automática: dispara mientras se mantiene */
            if (this.keys.fire && WEAPONS[this.weapon].auto) {
                this.shoot();
            }

        }


        hasAmmo(kind) {

            const weapon = WEAPONS[kind];

            return weapon.ammo === null || this.ammo[weapon.ammo] > 0;

        }


        selectWeapon(kind, silent) {

            if (!this.owned[kind] || kind === this.weapon) {
                return false;
            }

            this.weapon = kind;
            this.weaponSwap = 260;
            this.shootTimer = Math.max(this.shootTimer, 200);

            if (!silent) {

                A.audio.play("arma");

                this.shell.setStatus(WEAPONS[kind].label);

            }

            return true;

        }


        cycleWeapon(direction) {

            const owned = WEAPON_ORDER.filter((kind) => this.owned[kind]);

            if (owned.length < 2) {
                return;
            }

            const index = owned.indexOf(this.weapon);

            const next = owned[(index + direction + owned.length) % owned.length];

            this.selectWeapon(next);

        }


        /** Mejor arma disponible con munición */
        bestWeapon() {

            for (let i = WEAPON_ORDER.length - 1; i >= 0; i -= 1) {

                const kind = WEAPON_ORDER[i];

                if (this.owned[kind] && this.hasAmmo(kind)) {
                    return kind;
                }

            }

            return "pistola";

        }


        shoot() {

            if (this.phase !== "run" || this.shootTimer > 0 || this.weaponSwap > 0) {
                return;
            }

            const weapon = this.weaponProfile(this.weapon);

            if (!this.hasAmmo(this.weapon) && this.furiaTime <= 0) {

                this.shell.setStatus("SIN " + weapon.ammo.toUpperCase() + " · CAMBIA DE ARMA");

                A.audio.play("vacio");

                this.shootTimer = 220;

                /* si no queda nada, vuelve a la pistola */
                if (!WEAPON_ORDER.some((kind) => this.owned[kind] && this.hasAmmo(kind) && kind !== "pistola")) {
                    this.selectWeapon("pistola");
                }

                return;
            }

            const p = this.player;
            const effectColor = weapon.effectColor ||
                (this.weapon === "escopeta" ? "#F97316" : "#FDE68A");
            const muzzleX = p.x + Math.cos(p.angle) * 0.34;
            const muzzleY = p.y + Math.sin(p.angle) * 0.34;

            for (let i = 0; i < weapon.pellets; i += 1) {

                const offset = weapon.pellets > 1
                    ? (i - (weapon.pellets - 1) / 2) * (weapon.spread / (weapon.pellets - 1) * 2)
                    : (Math.random() - 0.5) * weapon.spread;

                const angle = p.angle + offset + (Math.random() - 0.5) * 0.02;
                const shotX = p.x + Math.cos(angle) * 0.4;
                const shotY = p.y + Math.sin(angle) * 0.4;

                this.shots.push({
                    x: shotX,
                    y: shotY,
                    /* Guarda el último punto real para trazar una estela
                       nítida sin crear una lista de partículas por bala. */
                    trailX: shotX,
                    trailY: shotY,
                    trailLength: 0.36 + Math.min(0.34, weapon.speed * 0.018),
                    vx: Math.cos(angle) * weapon.speed,
                    vy: Math.sin(angle) * weapon.speed,
                    damage: weapon.damage,
                    splash: weapon.splash || 0,
                    slow: weapon.slow || 0,
                    pierce: weapon.pierce || 0,
                    bounces: weapon.bounces || 0,
                    hitIds: [],
                    color: effectColor,
                    sprite: weapon.shot,
                    life: 1600,
                    spin: 0
                });

            }

            /* Fogonazo y trazadora de boca independientes del retroceso: el
               flash dura varios frames, late con el arma y también lee bien
               en ráfagas rápidas o con el lanza-pasticho. */
            const flashLife = weapon.pellets > 1 ? 145 : (weapon.auto ? 92 : 118);
            this.muzzleFlash = {
                life: flashLife,
                maxLife: flashLife,
                color: effectColor,
                power: Math.max(0.8, weapon.kick)
            };
            this.pushTracer({
                x0: muzzleX,
                y0: muzzleY,
                x1: p.x + Math.cos(p.angle) * (1.08 + weapon.speed * 0.024),
                y1: p.y + Math.sin(p.angle) * (1.08 + weapon.speed * 0.024),
                color: effectColor,
                width: weapon.pellets > 1 ? 1.35 : 1,
                life: weapon.pellets > 1 ? 108 : 82
            });

            /* En Furia no se gasta munición: el cliente siempre
               tiene la razón y el cargador nunca se acaba. */
            if (weapon.ammo && this.furiaTime <= 0) {
                this.ammo[weapon.ammo] -= 1;
            }

            this.fired = (this.fired || 0) + 1;

            /* Cadencia máxima mientras dura la Furia */
            this.shootTimer = this.furiaTime > 0
                ? Math.min(60, weapon.cooldown)
                : weapon.cooldown;
            this.recoil = weapon.kick;

            A.audio.play(weapon.sound);

            this.updateStats();

        }


        updateShots(dt) {

            const seconds = dt / 1000;

            /* Disparos del jugador. `startLootWindow()` limpia las dos
               listas de proyectiles al caer el último enemigo. Una escopeta
               puede tener varios perdigones en este mismo `for`, por lo que
               hay que abandonar el frame inmediatamente después de abrir el
               botín: seguir indexando el array ya vaciado era la ruta que
               detenía el bucle y dejaba la pantalla congelada. */
            for (let i = this.shots.length - 1; i >= 0; i -= 1) {

                if (this.phase !== "run") {
                    return;
                }

                const shot = this.shots[i];

                if (!shot) {
                    continue;
                }

                shot.life -= dt;
                shot.spin += dt * 0.02;
                shot.trailX = shot.x;
                shot.trailY = shot.y;

                const stepX = shot.vx * seconds;
                const stepY = shot.vy * seconds;

                let gone = shot.life <= 0;
                let bounced = false;

                if (!gone && this.projectilePathBlocked(
                    shot.x, shot.y, shot.x + stepX, shot.y + stepY
                )) {

                    /* El Rebota-404 rebota de forma determinista sobre el
                       eje bloqueado. No avanza en el frame del impacto, lo
                       que evita atravesar paredes con cuadros lentos. */
                    if (shot.bounces > 0) {

                        const collideX = this.projectilePathBlocked(
                            shot.x, shot.y, shot.x + stepX, shot.y
                        );
                        const collideY = this.projectilePathBlocked(
                            shot.x, shot.y, shot.x, shot.y + stepY
                        );

                        if (collideX) {
                            shot.vx *= -1;
                        }
                        if (collideY) {
                            shot.vy *= -1;
                        }
                        if (!collideX && !collideY) {
                            shot.vx *= -1;
                            shot.vy *= -1;
                        }

                        shot.bounces -= 1;
                        shot.life -= 32;
                        bounced = true;
                        this.spawnHitSpark(shot.x, shot.y, shot.color, 0.72);
                        this.pushDecal({ x: shot.x, y: shot.y, life: 1800, color: shot.color });

                    } else {

                        gone = true;

                        if (shot.splash) {
                            this.splash(shot.x, shot.y, shot.splash, shot.damage, shot.slow, shot.color);
                        } else {
                            this.spawnHitSpark(shot.x, shot.y, shot.color, 0.78);
                            this.pushDecal({ x: shot.x, y: shot.y, life: 5000, color: shot.color });
                        }

                    }

                }

                if (this.phase !== "run") {
                    return;
                }

                if (!gone && !bounced) {

                    shot.x += stepX;
                    shot.y += stepY;

                    for (let e = 0; e < this.enemies.length; e += 1) {

                        const enemy = this.enemies[e];

                        if (enemy.dead || enemy.hidden ||
                            (shot.hitIds && shot.hitIds.indexOf(enemy) !== -1)) {
                            continue;
                        }

                        const distance = Math.hypot(enemy.x - shot.x, enemy.y - shot.y);

                        const radius = 0.26 + enemy.type.size * 0.2;

                        if (distance < radius) {

                            if (shot.splash) {
                                this.splash(shot.x, shot.y, shot.splash, shot.damage, shot.slow, shot.color);
                                gone = true;
                            } else {
                                this.hitEnemy(enemy, shot.damage, shot.slow, shot.color);

                                /* El pulso atraviesa una silueta y pierde
                                   potencia; `hitIds` impide dañarla dos veces
                                   mientras sale de su radio. */
                                if (shot.pierce > 0) {
                                    shot.hitIds.push(enemy);
                                    shot.pierce -= 1;
                                    shot.damage = Math.max(1, Math.round(shot.damage * 0.72));
                                    this.pushDecal({ x: shot.x, y: shot.y, life: 1200, color: shot.color });
                                } else {
                                    gone = true;
                                }
                            }

                            break;

                        }

                    }

                }

                if (this.phase !== "run") {
                    return;
                }

                if (gone) {
                    this.shots.splice(i, 1);
                }

            }

            /* Proyectiles enemigos. El mismo cierre puede producirse por
               seguro/game over, así que no seguimos tocando una lista que
               otra transición ya haya vaciado. */
            if (this.phase !== "run") {
                return;
            }

            for (let i = this.hostileShots.length - 1; i >= 0; i -= 1) {

                if (this.phase !== "run") {
                    return;
                }

                const shot = this.hostileShots[i];

                if (!shot) {
                    continue;
                }

                shot.life -= dt;
                shot.trailX = shot.x;
                shot.trailY = shot.y;

                const stepX = shot.vx * seconds;
                const stepY = shot.vy * seconds;

                const blocked = this.projectilePathBlocked(
                    shot.x, shot.y, shot.x + stepX, shot.y + stepY
                );
                let gone = shot.life <= 0 || blocked;

                if (blocked) {
                    const coverColor = shot.sprite === "petroleo" ? "#F97316"
                        : (shot.sprite === "texto" ? "#C084FC" : "#38BDF8");
                    this.spawnHitSpark(shot.x, shot.y, coverColor, 0.58);
                }

                if (gone && shot.puddle) {
                    this.pushPuddle({ x: shot.x, y: shot.y, life: 9000 });
                }

                if (!gone) {

                    shot.x += stepX;
                    shot.y += stepY;

                    const distance = Math.hypot(this.player.x - shot.x, this.player.y - shot.y);

                    if (distance < 0.4) {

                        this.hurtPlayer(shot.damage);

                        if (shot.puddle) {
                            this.pushPuddle({ x: shot.x, y: shot.y, life: 9000 });
                        }

                        if (shot.slow) {
                            this.slow = Math.max(this.slow, shot.slow);
                        }

                        gone = true;

                    }

                }

                if (this.phase !== "run") {
                    return;
                }

                if (gone) {
                    this.hostileShots.splice(i, 1);
                }

            }

        }


        splash(x, y, radius, damage, slow, color) {

            const effectColor = color || "#F97316";

            /* El daño de área conserva su decal táctico, pero ahora añade un
               anillo pixelado expansivo y fragmentos del color del arma. */
            this.spawnAoEVisual(x, y, radius, effectColor, slow);

            this.pushDecal({ x, y, life: 7000, color: effectColor, big: true });

            this.enemies.forEach((enemy) => {

                if (enemy.dead || enemy.hidden) {
                    return;
                }

                const distance = Math.hypot(enemy.x - x, enemy.y - y);

                if (distance < radius) {

                    const falloff = 1 - distance / radius * 0.5;

                    this.hitEnemy(enemy, Math.round(damage * falloff), slow, effectColor);

                }

            });

            A.audio.play("explode");

        }


        hitEnemy(enemy, damage, slow, color) {

            const impactColor = color || (slow ? "#60A5FA" : "#DC2626");

            enemy.hp -= damage;

            enemy.flash = 140;
            enemy.stagger = enemy.type.boss ? 90 : 260;

            if (slow) {
                /* Los jefes se ralentizan menos tiempo, pero nunca ignoran
                   el efecto: sigue siendo una herramienta de control real. */
                const duration = enemy.type.boss ? Math.round(slow * 0.42) : slow;
                enemy.slowed = Math.max(enemy.slowed || 0, duration);
                enemy.slowColor = "#60A5FA";
            }

            A.audio.play("impacto");

            /* Hitspark de píxeles, central y con fragmentos visibles sobre
               la silueta; los impactos de pulso/crío conservan su color. */
            this.spawnHitSpark(
                enemy.x,
                enemy.y,
                impactColor,
                enemy.type.boss ? 1.45 : 1
            );

            if (enemy.hp <= 0) {

                this.killEnemy(enemy);

            } else if (enemy.type.phases) {

                /* Chávez: fases por porcentaje de vida */
                const ratio = enemy.hp / enemy.maxHp;

                const phase = ratio < 0.35 ? 3 : ratio < 0.7 ? 2 : 1;

                if (phase !== enemy.phase) {

                    enemy.phase = phase;

                    this.shout(enemy, phase === 2 ? "¡EXPRÓPIESE!" : "¡POR AHORA!");

                    this.bannerText("FASE " + phase, "El líder se enfada", enemy.type.boss ? "#F43F5E" : null);

                }

            }

        }


        killEnemy(enemy) {

            /* Daño de área y perdigones pueden coincidir en el mismo tick.
               Sólo el primer golpe vivo abre la ventana de botín. */
            if (!enemy || enemy.dead || this.phase !== "run") {
                return;
            }

            enemy.dead = true;
            enemy.deadTimer = 520;
            enemy.hidden = false;

            this.score += enemy.type.score;

            this.spawnParticles(enemy.x, enemy.y, "#DC2626", 22, {
                style: "debris",
                pixelSize: enemy.type.boss ? 0.1 : 0.072,
                speedMin: 0.7,
                speedMax: enemy.type.boss ? 3.2 : 2.45
            });
            this.pushImpactBurst({
                x: enemy.x,
                y: enemy.y,
                z: 0.52,
                color: enemy.type.boss ? "#FBBF24" : "#DC2626",
                size: enemy.type.boss ? 0.26 : 0.16,
                life: enemy.type.boss ? 330 : 220,
                kind: "defeat"
            });

            A.audio.play(enemy.type.boss ? "explode" : "muere");

            this.shell.setStatus(enemy.type.label + " NEUTRALIZADO");

            if (enemy.type.boss) {

                this.bannerText(enemy.type.label + " DERROTADO", "+" + enemy.type.score, "#A3E635");
                this.setVipCompanionMood("cheer", "¡JEFE ABAJO!", 3000);

            }

            /* Las bajas pueden soltar una caja de arma; un jefe garantiza una
               de la pool actual mientras aún falte una pieza del arsenal.
               Las repetidas se convierten en munición al recogerlas, por lo
               que el azar no desperdicia una recompensa de combate. */
            this.maybeDropRandomWeapon(enemy);

            const recoveryBonus = this.recoveryDropBonus();
            const itemDropChance = Math.min(0.97, enemy.type.drop + recoveryBonus);

            if (Math.random() < itemDropChance) {

                /* Al bajar de 45 de salud aumenta la posibilidad de una
                   arepa; si estás estable, el botín alimenta el arsenal. */
                const kinds = this.health <= 45
                    ? ["arepa", "arepa", "balas", "cartuchos", "celdas"]
                    : ["balas", "balas", "cartuchos", "arepa", "pastichos", "celdas"];

                this.pickups.push({
                    type: enemy.type.boss ? "arepa" : kinds[Math.floor(Math.random() * kinds.length)],
                    x: enemy.x,
                    y: enemy.y,
                    bob: 0
                });

            }

            /* Dinero: todos sueltan algo, los jefes un fajo. El nuevo margen
               de recursos suaviza las zonas largas sin regalar el catálogo. */
            const loot = enemy.type.boss
                ? 3 + Math.floor(Math.random() * 3)
                : (Math.random() < Math.min(0.96, 0.76 + recoveryBonus * 0.55) ? 1 : 0);

            for (let i = 0; i < loot; i += 1) {

                const angle = Math.random() * Math.PI * 2;
                const radius = enemy.type.boss ? 0.3 + Math.random() * 0.5 : 0.12;

                const baseValue = enemy.type.boss
                    ? 40 + Math.floor(Math.random() * 30)
                    : Math.max(3, Math.round(enemy.type.score / 22));
                const value = Math.max(1, Math.round(baseValue * this.tuning.money));

                this.pickups.push({
                    type: "dinero",
                    big: enemy.type.boss || value >= 18,
                    value,
                    x: enemy.x + Math.cos(angle) * radius,
                    y: enemy.y + Math.sin(angle) * radius,
                    bob: Math.random() * Math.PI * 2,
                    spin: Math.random() * 4
                });

            }

            /* No esperamos a que desaparezca la animación del cadáver: la
               cuenta de cinco segundos empieza al derrotar al último. */
            if (this.phase === "run" && this.enemies.every((entry) => entry.dead)) {
                this.clearLevel();
            }

        }


        shout(enemy, text) {

            enemy.shout = 1400;
            enemy.shoutText = text;

            A.audio.play("grito");

        }


        /* =========================================================
           HABILIDADES Y CONSUMIBLES
           ========================================================= */

        /* Texto flotante corto en el centro de la pantalla */
        floater(text, color) {

            this.floaters.push({
                text,
                color: color || "#F8FAFC",
                timer: 1100,
                max: 1100
            });

        }


        /* El blindaje es una reserva de daño, no un cronómetro. Las ayudas,
           CLAP y artículos VIP agregan carga hasta su capacidad; por eso una
           compra puede rellenar lo que ya protegía al jugador sin borrar el
           resto. */
        grantShield(amount) {

            const incoming = Math.max(0, Math.floor(Number(amount) || 0));
            const current = Math.max(0, Math.floor(Number(this.shield) || 0));
            const maximum = Math.max(1, Math.floor(Number(this.shieldMax) || MAX_SHIELD));

            this.shieldMax = maximum;

            if (incoming <= 0) {
                return Math.min(current, maximum);
            }

            this.shield = Math.min(maximum, current + incoming);

            return this.shield;

        }


        clearShield() {

            /* Descargar una carga no elimina la batería instalada. Mantener
               la capacidad permite que el HUD y la Sala VIP hablen siempre
               de la misma reserva de 100 puntos. */
            this.shield = 0;
            this.shieldMax = Math.max(1, Math.floor(Number(this.shieldMax) || MAX_SHIELD));

        }


        shieldRatio() {

            const remaining = Math.max(0, Number(this.shield) || 0);
            const maximum = Math.max(1, Number(this.shieldMax) || MAX_SHIELD);

            return utils.clamp(remaining / maximum, 0, 1);

        }


        absorbShieldDamage(amount) {

            const incoming = Math.max(0, Math.round(Number(amount) || 0));
            const available = Math.max(0, Math.floor(Number(this.shield) || 0));
            const absorbed = Math.min(available, incoming);

            if (absorbed > 0) {
                this.shield = available - absorbed;
            }

            return {
                absorbed,
                remaining: Math.max(0, incoming - absorbed)
            };

        }


        updateAbilities(dt) {

            /* Furia de Atención al Cliente */
            if (this.furiaTime > 0) {

                this.furiaTime = Math.max(0, this.furiaTime - dt);

                if (this.furiaTime === 0) {
                    this.floater("SE ACABÓ LA FURIA", "#F87171");
                }

            }

            /* Destello del bombardeo */
            if (this.strike > 0) {
                this.strike = Math.max(0, this.strike - dt);
            }

            /* Efectos de la bolsa del CLAP */
            if (this.sugar > 0) {
                this.sugar = Math.max(0, this.sugar - dt);
            }

            /* El escudo no vive en la lista de temporizadores: conservar su
               carga entre encuentros es parte de la economía de defensa. */

            if (this.sticky > 0) {
                this.sticky = Math.max(0, this.sticky - dt);
            }

            /* El aturdimiento se descuenta dentro de updateEnemies(), junto
               con la IA del objetivo; evitamos una segunda vuelta completa
               sobre la oleada en cada paso fijo. */

            /* Rótulos flotantes */
            for (let i = this.floaters.length - 1; i >= 0; i -= 1) {

                this.floaters[i].timer -= dt;

                if (this.floaters[i].timer <= 0) {
                    this.floaters.splice(i, 1);
                }

            }

        }


        /* ---------------------------------------------------------
           LLAMADA A LOS YANQUIS

           Bombardeo aéreo. Barre a la tropa común de la pantalla,
           pero contra jefes y subjefes NO es un botón de matar:
           les quita un 15-20% de su vida máxima y los deja
           aturdidos 2 segundos.
           --------------------------------------------------------- */

        callYanquis() {

            if (this.phase !== "run") {
                return;
            }

            if (this.yanquis <= 0) {

                this.floater("SIN LLAMADAS", "#F87171");

                A.audio.play("vacio");

                return;

            }

            this.yanquis -= 1;

            this.strike = 900;

            this.bannerText(
                "LLAMADA A LOS YANQUIS",
                "Coordenadas enviadas",
                "#38BDF8"
            );

            A.audio.play("bombardeo");

            /* Copia: killEnemy modifica el array */
            const targets = this.enemies.slice();

            targets.forEach((enemy) => {

                if (enemy.dead) {
                    return;
                }

                if (enemy.type.boss) {

                    /* 15-20% de la vida máxima, nunca letal de golpe */
                    const factor = 0.15 + Math.random() * 0.05;

                    const damage = Math.max(1, Math.round(enemy.maxHp * factor));

                    enemy.hp = Math.max(1, enemy.hp - damage);

                    enemy.stun = 2000;

                    enemy.stagger = 400;

                    return;

                }

                this.killEnemy(enemy);

            });

            this.updateStats();

        }


        /* ---------------------------------------------------------
           FURIA DE ATENCIÓN AL CLIENTE

           3 segundos: pantalla roja, invulnerable y disparando a
           cadencia máxima. Usos limitados, ampliables en la tienda.
           --------------------------------------------------------- */

        /* Duración de la Furia según la mejora comprada */
        furiaDuration() {
            return 3000 + (this.furiaLevel - 1) * 700;
        }


        /* Carga necesaria para un uso: mejorarla la abarata */
        furiaNeeded() {
            return Math.max(45, 110 - (this.furiaLevel - 1) * 14);
        }


        callFuria() {

            if (this.phase !== "run") {
                return;
            }

            if (this.furiaTime > 0) {
                return;
            }

            if (!this.furiaUnlocked) {

                this.floater("FURIA BLOQUEADA · CÓMPRALA EN LA SALA VIP", "#F87171");

                A.audio.play("vacio");

                return;

            }

            if (this.furiaCharge < this.furiaNeeded()) {

                this.floater("FURIA CARGANDO · RECIBE DAÑO", "#F87171");

                A.audio.play("vacio");

                return;

            }

            this.furiaCharge = 0;

            this.furiaTime = this.furiaDuration();

            this.bannerText(
                "FURIA DE ATENCIÓN AL CLIENTE",
                "¡QUIERO HABLAR CON EL GERENTE!",
                "#F43F5E"
            );

            A.audio.play("furia");

            this.updateStats();

        }


        /* ---------------------------------------------------------
           BOLSA DEL CLAP

           60% suministros útiles, 40% contratiempos. Se abre desde
           la mochila: el riesgo sigue ahí, pero abrir una bolsa ya
           sirve para remontar una zona difícil.
           --------------------------------------------------------- */

        openClap() {

            if (this.phase !== "run") {
                return;
            }

            if (this.claps <= 0) {

                this.floater("NO TIENES BOLSAS", "#F87171");

                A.audio.play("vacio");

                return;

            }

            this.claps -= 1;

            const result = A.op404.clap.roll();

            this.clapFlash = {
                timer: 1600,
                max: 1600,
                color: result.color,
                label: result.label,
                good: result.good
            };

            this.bannerText(result.label, result.text, result.color);

            A.audio.play("bolsa");

            this.applyClap(result);

            /* El veredicto llega justo después del plástico */
            const verdict = result.good ? "clapBien" : "clapMal";

            setTimeout(() => A.audio.play(verdict), 220);

            this.updateStats();

        }


        /* Una cura no debe sentirse vacía con vida llena: convierte el
           excedente en una recarga de blindaje y devuelve un mensaje claro. */
        restoreClapHealth(amount, fallbackShield) {

            const before = this.health;
            const recovered = Math.max(1, Math.round(amount || 0));

            this.health = Math.min(MAX_HEALTH, this.health + recovered);

            if (this.health > before) {
                this.floater("+" + (this.health - before) + " SALUD", "#A3E635");
                return;
            }

            this.grantShield(fallbackShield || 22);
            this.floater("SALUD COMPLETA · ESCUDO", "#38BDF8");

        }


        /* Reponer cada tipo permite que la caja sea útil aunque el jugador
           ya haya comprado un arma; si todo está al tope, protege en vez de
           convertir un resultado favorable en una pérdida de turno. */
        refillClapAmmo(amounts, fallbackShield) {

            const refill = amounts || {};
            let recovered = false;

            Object.keys(AMMO_MAX).forEach((kind) => {

                const before = this.ammo[kind] || 0;
                const maximum = this.ammoMax(kind);
                const amount = Math.max(0, Math.round(refill[kind] || 0));

                this.ammo[kind] = Math.min(maximum, before + amount);
                recovered = recovered || this.ammo[kind] > before;

            });

            if (recovered) {
                this.floater("MUNICIÓN RECUPERADA", "#F87171");
                return;
            }

            this.grantShield(fallbackShield || 28);
            this.floater("ARSENAL LLENO · ESCUDO", "#38BDF8");

        }


        /* El vale usa el efectivo local de OPERACIÓN 404. Mantenerlo separado
           evita mezclar esta Sala VIP de campaña con una economía externa. */
        grantClapSupplies(amount) {

            const base = Math.max(1, Math.round(amount || 0));
            const multiplier = this.tuning && this.tuning.money
                ? this.tuning.money
                : 1;
            const credited = Math.max(1, Math.round(base * multiplier));

            this.money += credited;
            this.floater("+$" + credited + " · SUMINISTROS", "#34D399");
            this.shell.setStatus("VALE CLAP: +$" + credited + " PARA LA SALA VIP");

        }


        applyClap(result) {

            switch (result.id) {

                /* --- BUENOS --- */

                case "azucar":
                    this.sugar = Math.max(this.sugar, result.duration || 4200);
                    this.sticky = 0;
                    this.slow = 0;
                    this.floater("SUBIDÓN DE VELOCIDAD", "#FDE68A");
                    break;

                case "nutrivicha":
                    this.grantShield(result.shield || 55);
                    this.floater("ESCUDO NUTRIVICHA", "#38BDF8");
                    break;

                case "harina":
                case "arepa":
                    this.restoreClapHealth(result.health, result.fallbackShield);
                    break;

                case "municion":
                    this.refillClapAmmo(result.ammo, result.fallbackShield);
                    break;

                case "cafe":
                    this.sticky = 0;
                    this.slow = 0;
                    this.sugar = Math.max(this.sugar, result.duration || 3200);
                    this.floater("CAFÉ: LIMPIO Y EN MARCHA", "#C084FC");
                    break;

                case "vale":
                    this.grantClapSupplies(result.money);
                    break;

                case "furia":
                    if (this.furiaUnlocked) {
                        this.furiaCharge = this.furiaNeeded();
                        this.floater("FURIA LISTA", "#FB7185");
                    } else {
                        this.grantShield(result.fallbackShield || 35);
                        this.floater("FURIA BLOQUEADA · ESCUDO", "#38BDF8");
                    }
                    break;

                /* --- MALOS --- */

                case "gorgojos":
                    if (!this.spawnGorgojo()) {
                        /* Un mapa muy cerrado no debe anular el riesgo: deja
                           una penalización breve y reversible como respaldo. */
                        this.slow = Math.max(this.slow, result.fallbackSlow || 1800);
                    }
                    break;

                case "sardina": {
                    /* El veneno duele, pero nunca parte la vida ni puede
                       rematar: el jugador conserva una salida clara. */
                    const damage = Math.max(1, Math.round(result.damage || 18));
                    const before = this.health;
                    this.health = Math.max(1, this.health - damage);
                    this.hurt = HURT_TIME;
                    this.floater("-" + (before - this.health) + " SALUD", "#F43F5E");
                    break;
                }

                case "pasta":
                    this.sticky = Math.max(this.sticky, result.duration || 3800);
                    this.floater("PASO PESADO", "#A16B3A");
                    break;

                case "rota":
                    this.breakBag(result.ammoLoss, result.moneyLoss);
                    break;

                default:
                    break;

            }

        }


        /* Arroz con gorgojos: aparece un bicho grande y agresivo. Devuelve
           un booleano para que la Bolsa pueda aplicar un malus corto si no
           hay espacio físico para materializarlo. */
        spawnGorgojo() {

            const p = this.player;

            /* Busca sitio libre cerca del jugador */
            for (let attempt = 0; attempt < 40; attempt += 1) {

                const angle = Math.random() * Math.PI * 2;

                const dist = 2 + Math.random() * 2;

                const x = p.x + Math.cos(angle) * dist;
                const y = p.y + Math.sin(angle) * dist;

                if (!this.freeSpot(x, y, 0.32)) {
                    continue;
                }

                const enemy = this.spawnEnemy("gorgojo", { x, y });

                if (enemy) {
                    A.audio.play("invocar");
                    this.floater("¡GORGOJO ENTRANTE!", "#B45309");
                    return true;
                }

            }

            return false;

        }


        /* Bolsa rota: derrama una parte, no borra armas ni una campaña. Es
           adversa, pero la próxima caja, pickup o Sala VIP puede revertirla. */
        breakBag(ammoLoss, moneyLoss) {

            const ammoFactor = Math.max(0, Math.min(1, ammoLoss == null ? 0.45 : ammoLoss));
            const cashFactor = Math.max(0, Math.min(1, moneyLoss == null ? 0.20 : moneyLoss));
            let lostAmmo = 0;

            Object.keys(AMMO_MAX).forEach((kind) => {
                const before = Math.max(0, this.ammo[kind] || 0);
                /* Redondear evita que una sola bala o el último dólar se
                   evaporen por completo: el malus sigue doliendo sin cebarse
                   con un inventario ya casi vacío. */
                const lost = Math.min(before, Math.round(before * ammoFactor));
                this.ammo[kind] = before - lost;
                lostAmmo += lost;
            });

            const beforeMoney = Math.max(0, this.money || 0);
            const lostMoney = Math.min(beforeMoney, Math.ceil(beforeMoney * cashFactor));
            this.money = beforeMoney - lostMoney;
            this.bagTear = 900;

            const summary = "BOLSA ROTA · -" + lostAmmo + " MUNICIÓN / -$" + lostMoney;
            this.floater(summary, "#94A3B8");
            this.shell.setStatus("BOLSA ROTA: CONSERVASTE EL ARSENAL");

        }


        bannerText(title, text, color) {

            this.banner = {
                title,
                text,
                timer: 1800,
                max: 1800,
                color: color || this.cfg.light
            };

        }


        /* ---------------------------------------------------------
           Enemigos
           --------------------------------------------------------- */

        updateEnemies(dt) {

            const p = this.player;

            const seconds = dt / 1000;
            const playerCellX = Math.floor(p.x);
            const playerCellY = Math.floor(p.y);

            for (let i = this.enemies.length - 1; i >= 0; i -= 1) {

                const enemy = this.enemies[i];

                if (enemy.dead) {

                    enemy.deadTimer -= dt;

                    if (enemy.deadTimer <= 0) {
                        this.enemies.splice(i, 1);
                    }

                    continue;
                }

                if (enemy.flash > 0) {
                    enemy.flash = Math.max(0, enemy.flash - dt);
                }

                if (enemy.stagger > 0) {
                    enemy.stagger = Math.max(0, enemy.stagger - dt);
                }

                if (enemy.slowed > 0) {
                    enemy.slowed = Math.max(0, enemy.slowed - dt);
                }

                /* Aturdido por el bombardeo: ni se mueve ni ataca */
                if (enemy.stun > 0) {

                    enemy.stun = Math.max(0, enemy.stun - dt);
                    enemy.anim += dt;

                    continue;

                }

                /* El frío frena también la cadencia (sin detener por
                   completo al enemigo), así el control de área tiene valor
                   táctico real frente a grupos y jefes. */
                const combatDt = enemy.slowed > 0 ? dt * 0.62 : dt;

                if (enemy.attackTimer > 0) {
                    enemy.attackTimer -= combatDt;
                }

                if (enemy.shout > 0) {
                    enemy.shout -= dt;
                }

                enemy.anim += dt;

                const dx = p.x - enemy.x;
                const dy = p.y - enemy.y;

                const distance = Math.hypot(dx, dy) || 0.001;

                const nx = dx / distance;
                const ny = dy / distance;

                /* La comprobación de línea de visión atraviesa varias celdas
                   del mapa. Hacerla para cada enemigo 60 veces por segundo
                   era el coste más alto de una oleada; se refresca al entrar
                   en una celda nueva o cada fracción de segundo. */
                const refreshSight = !Number.isFinite(enemy.sightTimer) ||
                    enemy.sightTimer <= 0 ||
                    enemy.sightCellX !== playerCellX ||
                    enemy.sightCellY !== playerCellY;

                if (refreshSight) {
                    enemy.sees = distance < 18 && this.canSee(enemy.x, enemy.y, p.x, p.y);
                    enemy.sightTimer = this.sightInterval;
                    enemy.sightCellX = playerCellX;
                    enemy.sightCellY = playerCellY;
                } else {
                    enemy.sightTimer -= dt;
                }

                const sees = Boolean(enemy.sees);

                /* Consignas */
                enemy.shoutTimer -= dt;

                if (enemy.shoutTimer <= 0 && sees) {

                    enemy.shoutTimer = 2600 + Math.random() * 3000;

                    this.shout(enemy, utils.pick(enemy.type.shouts));

                }

                let speed = enemy.type.speed * this.cfg.speed * this.tuning.speed;

                if (enemy.stagger > 0) {
                    speed *= 0.2;
                }
                if (enemy.slowed > 0) {
                    speed *= enemy.type.boss ? 0.68 : 0.52;
                }

                const type = enemy.type;

                /* Teletransporte (Manguangua): aparece en un rincón cerrado */
                if (type.teleport) {

                    enemy.teleportTimer -= combatDt;

                    if (enemy.teleportTimer <= 0) {

                        enemy.teleportTimer = type.teleport;

                        this.teleport(enemy);

                    }

                }

                /* Movimiento */
                if (type.attack === "melee") {

                    if (distance > 0.8 && (sees || distance < 6)) {
                        this.moveEnemy(enemy, nx, ny, speed * seconds);
                    }

                } else if (type.attack === "ranged" || type.attack === "beam") {

                    /* Mantienen distancia media; los malandros se mueven en lateral */
                    const ideal = type.boss ? 3.2 : 4.5;

                    if (!sees && distance < 14) {

                        this.moveEnemy(enemy, nx, ny, speed * seconds);

                    } else if (distance > ideal + 1) {

                        this.moveEnemy(enemy, nx, ny, speed * seconds);

                    } else if (distance < ideal - 1.2 && !type.boss) {

                        this.moveEnemy(enemy, -nx, -ny, speed * seconds * 0.7);

                    }

                    if (type.strafe || type.boss) {

                        enemy.strafeTimer -= dt;

                        if (enemy.strafeTimer <= 0) {

                            enemy.strafeTimer = 700 + Math.random() * 900;
                            enemy.strafeDir *= -1;

                        }

                        const sx = -ny * enemy.strafeDir;
                        const sy = nx * enemy.strafeDir;

                        this.moveEnemy(enemy, sx, sy, speed * seconds * 0.8);

                    }

                }

                /* Ataque cuerpo a cuerpo */
                if (distance < (type.boss ? 1.4 : 1) && enemy.attackTimer <= 0) {

                    enemy.attackTimer = type.boss ? 700 : 900;

                    this.hurtPlayer(this.enemyDamage(type.damage));

                    this.shout(enemy, utils.pick(type.shouts));

                }

                /* Ataque a distancia */
                if (type.rangedRate && sees && distance < 15) {

                    enemy.rangedTimer -= combatDt;

                    if (enemy.rangedTimer <= 0) {

                        let rate = type.rangedRate;

                        if (type.phases) {
                            rate = rate / (1 + (enemy.phase - 1) * 0.45);
                        }

                        enemy.rangedTimer = rate * (0.75 + Math.random() * 0.5);

                        this.enemyFire(enemy, nx, ny, distance);

                    }

                }

                /* Invocar oleadas */
                if (type.summon) {

                    enemy.summonTimer -= combatDt;

                    if (enemy.summonTimer <= 0) {

                        enemy.summonTimer = type.summon.every;

                        const alive = this.enemies.filter(
                            (other) => !other.dead && other.kind === type.summon.kind
                        ).length;

                        if (alive < type.summon.max) {

                            this.summon(enemy, type.summon.kind, type.summon.count);

                        }

                    }

                }

            }

            /* Rayo de texto del Manguangua: daño continuo si te quedas cerca */
            for (let i = this.beams.length - 1; i >= 0; i -= 1) {

                const beam = this.beams[i];

                beam.life -= dt;

                if (beam.life <= 0) {
                    this.beams.splice(i, 1);
                    continue;
                }

                const owner = beam.owner;

                if (owner.dead) {
                    this.beams.splice(i, 1);
                    continue;
                }

                beam.x = owner.x;
                beam.y = owner.y;

                const distance = Math.hypot(p.x - owner.x, p.y - owner.y);

                if (distance < beam.radius) {

                    this.slow = Math.max(this.slow, 400);

                    beam.tick -= dt;

                    if (beam.tick <= 0) {

                        beam.tick = 420;

                        this.hurtPlayer(beam.damage, true);

                    }

                }

            }

        }


        moveEnemy(enemy, nx, ny, step) {

            const radius = enemy.type.boss ? 0.36 : 0.3;

            if (this.freeSpot(enemy.x + nx * step, enemy.y, radius)) {
                enemy.x += nx * step;
            }

            if (this.freeSpot(enemy.x, enemy.y + ny * step, radius)) {
                enemy.y += ny * step;
            }

        }


        enemyFire(enemy, nx, ny, distance) {

            const type = enemy.type;

            const p = this.player;

            if (type.attack === "beam") {

                /* Manguangua: ráfaga de texto + campo que ralentiza */
                this.pushBeam({
                    owner: enemy,
                    x: enemy.x,
                    y: enemy.y,
                    radius: 3.2,
                    damage: Math.round(this.enemyDamage(type.damage)),
                    life: 2200,
                    tick: 0
                });

                for (let i = 0; i < 5; i += 1) {

                    const spread = (i - 2) * 0.13;

                    const angle = Math.atan2(ny, nx) + spread;

                    this.hostileShots.push({
                        x: enemy.x + Math.cos(angle) * 0.5,
                        y: enemy.y + Math.sin(angle) * 0.5,
                        vx: Math.cos(angle) * type.shotSpeed,
                        vy: Math.sin(angle) * type.shotSpeed,
                        damage: Math.round(this.enemyDamage(type.damage * 0.6)),
                        life: 2400,
                        sprite: "texto",
                        slow: 900
                    });

                }

                this.shout(enemy, utils.pick(type.shouts));

                A.audio.play("discurso");

                return;

            }

            if (type.spoon) {

                /* Sr. M lanza la cucharada: deja un charco que ralentiza */
                this.hostileShots.push({
                    x: enemy.x + nx * 0.5,
                    y: enemy.y + ny * 0.5,
                    vx: nx * type.shotSpeed,
                    vy: ny * type.shotSpeed,
                    damage: Math.round(this.enemyDamage(type.damage * 0.8)),
                    life: 2600,
                    sprite: "cucharada",
                    puddle: true,
                    slow: 1200
                });

                this.shout(enemy, "¡A COMER MIERDA CON CUCHARA!");

                A.audio.play("cuchara");

                return;

            }

            /* Chávez: chorro de petróleo (más proyectiles por fase) y pluma en área */
            if (type.phases) {

                const count = 1 + enemy.phase;

                for (let i = 0; i < count; i += 1) {

                    const spread = (i - (count - 1) / 2) * 0.16;

                    const angle = Math.atan2(ny, nx) + spread;

                    this.hostileShots.push({
                        x: enemy.x + Math.cos(angle) * 0.6,
                        y: enemy.y + Math.sin(angle) * 0.6,
                        vx: Math.cos(angle) * type.shotSpeed,
                        vy: Math.sin(angle) * type.shotSpeed,
                        damage: Math.round(this.enemyDamage(type.damage * 0.55)),
                        life: 2600,
                        sprite: "petroleo",
                        puddle: enemy.phase >= 2,
                        slow: 700
                    });

                }

                /* Pluma: golpe de área si estás cerca */
                if (enemy.phase >= 2 && distance < 3.4) {

                    this.hurtPlayer(this.enemyDamage(type.damage * 0.8));

                    this.spawnParticles(p.x, p.y, "#F5C542", 14);

                    this.shout(enemy, "¡PLUMAZO!");

                }

                A.audio.play("shoot");

                return;

            }

            /* Genérico: malandro (bala) y Maduro (decreto) */
            const shotSpeed = type.shotSpeed;

            this.hostileShots.push({
                x: enemy.x + nx * 0.45,
                y: enemy.y + ny * 0.45,
                vx: nx * shotSpeed,
                vy: ny * shotSpeed,
                damage: Math.round(this.enemyDamage(type.damage * 0.75)),
                life: 2600,
                sprite: type.shot
            });

            if (type.boss) {

                /* Maduro: decreto triple en abanico */
                [-0.2, 0.2].forEach((spread) => {

                    const angle = Math.atan2(ny, nx) + spread;

                    this.hostileShots.push({
                        x: enemy.x + Math.cos(angle) * 0.45,
                        y: enemy.y + Math.sin(angle) * 0.45,
                        vx: Math.cos(angle) * shotSpeed,
                        vy: Math.sin(angle) * shotSpeed,
                        damage: Math.round(this.enemyDamage(type.damage * 0.6)),
                        life: 2600,
                        sprite: type.shot
                    });

                });

            }

            A.audio.play("shoot");

        }


        summon(boss, kind, count) {

            /* Los jefes sólo pueden pedir refuerzos que pertenezcan al pool
               del nivel. Con las tablas actuales todos sus summons coinciden;
               esta compuerta evita una filtración si se edita un jefe luego. */
            if (!this.isLevelEnemyKindAllowed(kind)) {
                return 0;
            }

            let spawned = 0;

            for (let attempt = 0; attempt < 80 && spawned < count; attempt += 1) {

                const angle = Math.random() * Math.PI * 2;
                const radius = 1.2 + Math.random() * 1.6;

                const x = boss.x + Math.cos(angle) * radius;
                const y = boss.y + Math.sin(angle) * radius;

                if (this.freeSpot(x, y, 0.3)) {

                    const reinforcement = this.spawnEnemy(kind, { x, y });

                    if (!reinforcement) {
                        continue;
                    }

                    this.spawnParticles(x, y, "#DC2626", 10, {
                        style: "hitspark",
                        pixelSize: 0.075,
                        speedMin: 0.6,
                        speedMax: 2.1
                    });

                    spawned += 1;

                }

            }

            if (spawned > 0) {

                this.shout(boss, "¡OLEADA!");

                this.shell.setStatus(boss.type.label + " INVOCA " + spawned + " " + ENEMIES[kind].label + (spawned > 1 ? "S" : ""));

                A.audio.play("invocar");

            }

        }


        /** El Manguangua se mete "en tu casa": salta a un hueco cerrado cerca */
        teleport(enemy) {

            const p = this.player;

            let best = null;
            let bestScore = -Infinity;

            for (let attempt = 0; attempt < 60; attempt += 1) {

                const x = 1.5 + Math.floor(Math.random() * (MAP_W - 2));
                const y = 1.5 + Math.floor(Math.random() * (MAP_H - 2));

                if (!this.freeSpot(x, y, 0.36)) {
                    continue;
                }

                const distance = Math.hypot(p.x - x, p.y - y);

                if (distance < 2.2 || distance > 7) {
                    continue;
                }

                /* Preferir rincones: más muros alrededor */
                let walls = 0;

                for (let oy = -1; oy <= 1; oy += 1) {
                    for (let ox = -1; ox <= 1; ox += 1) {
                        if (this.isWall(x + ox, y + oy)) {
                            walls += 1;
                        }
                    }
                }

                const score = walls * 2 - Math.abs(distance - 4);

                if (score > bestScore) {
                    bestScore = score;
                    best = { x, y };
                }

            }

            if (!best) {
                return;
            }

            this.spawnParticles(enemy.x, enemy.y, "#C084FC", 16);

            enemy.x = best.x;
            enemy.y = best.y;

            enemy.rangedTimer = 500;

            this.spawnParticles(enemy.x, enemy.y, "#C084FC", 16);

            this.shout(enemy, "YA ESTOY EN TU CASA");

            A.audio.play("teleport");

        }


        hurtPlayer(amount, quiet) {

            if (this.phase !== "run") {
                return;
            }

            /* Furia de Atención al Cliente: intocable */
            if (this.furiaTime > 0) {
                return;
            }

            /* La reserva absorbe exactamente el daño que alcance a cubrir.
               Un impacto fuerte puede romperla y dejar pasar el excedente;
               uno pequeño sólo baja la barra azul. */
            let damage = Math.max(1, Math.round(amount));
            const shieldHit = this.absorbShieldDamage(damage);

            if (shieldHit.absorbed > 0) {
                this.hurt = HURT_TIME;
                this.floater(
                    shieldHit.remaining > 0
                        ? "ESCUDO ROTO · −" + shieldHit.absorbed
                        : "ESCUDO · −" + shieldHit.absorbed,
                    "#38BDF8"
                );
                A.audio.play("escudo");
                damage = shieldHit.remaining;

                if (damage <= 0) {
                    this.updateStats();
                    return;
                }
            }

            /* Para que el mercader sepa cómo te fue */
            this.report.damage += damage;
            this.report.flawless = false;

            /* El maltrato alimenta la Furia */
            if (this.furiaUnlocked) {

                const before = this.furiaCharge >= this.furiaNeeded();

                this.furiaCharge = Math.min(
                    this.furiaNeeded(),
                    this.furiaCharge + damage * 1.6
                );

                if (!before && this.furiaCharge >= this.furiaNeeded()) {

                    this.floater("¡FURIA LISTA! [Z]", "#F43F5E");

                    A.audio.play("furiaLista");

                }

            }

            this.health -= damage;

            this.hurt = HURT_TIME;

            if (!quiet) {
                A.audio.play("dano");
            }

            if (this.health <= 0) {

                this.health = 0;

                /* Primero entra el checkpoint gratuito de la zona. El
                   seguro comprado sigue siendo la segunda red de seguridad
                   para volver a la Sala VIP cuando ese reintento ya se usó. */
                if (this.restoreFieldCheckpoint()) {
                    return;
                }

                /* ¿Pagaste el seguro? Entonces esto no fue el final. */
                if (this.insurance && this.checkpoint) {

                    A.audio.play("win");

                    this.useInsurance();

                    return;

                }

                this.phase = "over";

                this.releaseKeys();

                this.shell.gameOver({
                    taunt: true,
                    score: this.score
                });

            }

            this.updateStats();

        }


        /* ---------------------------------------------------------
           Objetos, charcos y partículas
           --------------------------------------------------------- */

        updatePickups(dt) {

            const p = this.player;

            for (let i = this.pickups.length - 1; i >= 0; i -= 1) {

                const item = this.pickups[i];

                item.bob += dt * 0.005;

                const distance = Math.hypot(p.x - item.x, p.y - item.y);

                if (distance > 0.62) {
                    continue;
                }

                let taken = true;

                switch (item.type) {

                    case "dinero": {

                        const value = item.value || 5;

                        this.money += value;

                        this.shell.setStatus("+$" + value);

                        A.audio.play("coin");

                        break;

                    }

                    case "clap":

                        this.claps += 1;
                        this.shell.setStatus("BOLSA DEL CLAP · " + this.claps);
                        break;

                    case "arepa":

                        if (this.health >= MAX_HEALTH) {
                            taken = false;
                            break;
                        }

                        this.health = Math.min(MAX_HEALTH, this.health + 30);
                        this.shell.setStatus("+30 AREPA");
                        break;

                    case "balas":
                        this.ammo.balas = Math.min(AMMO_MAX.balas, this.ammo.balas + 40);
                        this.shell.setStatus("+40 BALAS");
                        break;

                    case "cartuchos":
                        this.ammo.cartuchos = Math.min(AMMO_MAX.cartuchos, this.ammo.cartuchos + 8);
                        this.shell.setStatus("+8 CARTUCHOS");
                        break;

                    case "pastichos":
                        this.ammo.pastichos = Math.min(AMMO_MAX.pastichos, this.ammo.pastichos + 3);
                        this.shell.setStatus("+3 PASTICHOS");
                        break;

                    case "celdas":
                        this.ammo.celdas = Math.min(AMMO_MAX.celdas, this.ammo.celdas + 8);
                        this.shell.setStatus("+8 CELDAS DE PULSO");
                        break;

                    case "escopeta":
                    case "ametralladora":
                    case "lanzapasticho":
                    case "riflepulso":
                    case "criopasticho":
                    case "rebotador": {

                        const weapon = WEAPONS[item.type];

                        const first = !this.owned[item.type];

                        this.owned[item.type] = true;

                        const gain = item.type === "escopeta" ? 12
                            : item.type === "ametralladora" ? 60
                                : item.type === "lanzapasticho" ? 4
                                    : item.type === "riflepulso" ? 18
                                        : item.type === "criopasticho" ? 10 : 28;

                        this.ammo[weapon.ammo] = Math.min(
                            AMMO_MAX[weapon.ammo], this.ammo[weapon.ammo] + gain
                        );

                        this.bannerText(
                            first
                                ? (item.randomWeapon ? "CAJA ALEATORIA" : "NUEVA ARMA")
                                : (item.randomWeapon ? "CAJA · MUNICIÓN" : "MUNICIÓN"),
                            weapon.label,
                            item.randomWeapon ? "#C084FC" : "#FBBF24"
                        );

                        this.selectWeapon(item.type, true);

                        break;
                    }

                    default:
                        break;

                }

                if (!taken) {
                    continue;
                }

                A.audio.play("coin");

                this.pickups.splice(i, 1);

                this.updateStats();

            }

        }


        updateHazards(dt) {

            const p = this.player;

            for (let i = this.puddles.length - 1; i >= 0; i -= 1) {

                const puddle = this.puddles[i];

                puddle.life -= dt;

                if (puddle.life <= 0) {
                    this.puddles.splice(i, 1);
                    continue;
                }

                if (Math.hypot(p.x - puddle.x, p.y - puddle.y) < 0.7) {
                    this.slow = Math.max(this.slow, 300);
                }

            }

        }


        spawnParticles(x, y, color, count, options = {}) {

            const available = Math.max(0, this.particleLimit - this.particles.length);
            const total = Math.min(count, available);
            const style = options.style || "debris";
            const speedMin = Number.isFinite(options.speedMin) ? options.speedMin : 0.4;
            const speedMax = Math.max(speedMin, Number.isFinite(options.speedMax)
                ? options.speedMax : 2);
            const zBase = Number.isFinite(options.z) ? options.z : 0.35;
            const zSpread = Number.isFinite(options.zSpread) ? options.zSpread : 0.5;
            const vzMin = Number.isFinite(options.vzMin) ? options.vzMin : 0.4;
            const vzMax = Math.max(vzMin, Number.isFinite(options.vzMax)
                ? options.vzMax : 1.6);
            const decay = Number.isFinite(options.decay) ? options.decay : null;
            const palette = Array.isArray(options.palette) && options.palette.length
                ? options.palette
                : ["#F5F7FF", "#FBBF24", color];
            const pixelSize = Number.isFinite(options.pixelSize)
                ? options.pixelSize
                : (style === "hitspark" ? 0.082 : 0.05);

            for (let i = 0; i < total; i += 1) {

                const angle = Math.random() * Math.PI * 2;
                const speed = speedMin + Math.random() * (speedMax - speedMin);

                this.particles.push({
                    x,
                    y,
                    z: zBase + Math.random() * zSpread,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    vz: vzMin + Math.random() * (vzMax - vzMin),
                    life: Number.isFinite(options.life) ? options.life : 1,
                    decay: decay === null ? 0.0016 + Math.random() * 0.002 : decay,
                    color: Math.random() < 0.6 ? color : utils.pick(palette),
                    style,
                    pixelSize
                });

            }

        }


        /* Las estelas no son partículas libres: son segmentos breves del
           disparo que conservan un núcleo blanco y borde neón. El límite
           evita que una ametralladora convierta el raycaster en un overlay. */
        pushTracer(tracer) {

            if (!tracer) {
                return;
            }

            if (this.tracers.length >= MAX_TRACERS) {
                this.tracers.shift();
            }

            const life = Math.max(16, Math.round(Number(tracer.life) || 86));

            this.tracers.push({
                x0: Number(tracer.x0) || 0,
                y0: Number(tracer.y0) || 0,
                x1: Number(tracer.x1) || 0,
                y1: Number(tracer.y1) || 0,
                color: tracer.color || "#FDE68A",
                width: Math.max(0.7, Number(tracer.width) || 1),
                life,
                maxLife: life
            });

        }


        pushImpactBurst(burst) {

            if (!burst) {
                return;
            }

            if (this.impactBursts.length >= MAX_IMPACT_BURSTS) {
                this.impactBursts.shift();
            }

            const life = Math.max(70, Math.round(Number(burst.life) || 180));

            this.impactBursts.push({
                x: Number(burst.x) || 0,
                y: Number(burst.y) || 0,
                z: Number.isFinite(burst.z) ? burst.z : 0.56,
                color: burst.color || "#FBBF24",
                size: Math.max(0.08, Number(burst.size) || 0.15),
                kind: burst.kind || "hit",
                life,
                maxLife: life
            });

        }


        /* Hitsparks con lectura arcade: cruz de píxeles + fragmentos de alto
           contraste. La escala permite que el jefe responda con más peso sin
           inundar la pantalla cuando una escopeta conecta varios perdigones. */
        spawnHitSpark(x, y, color, scale = 1) {

            const power = Math.max(0.55, Math.min(1.8, Number(scale) || 1));

            this.spawnParticles(x, y, color || "#FBBF24", Math.round(8 * power), {
                style: "hitspark",
                pixelSize: 0.07 + power * 0.018,
                z: 0.48,
                zSpread: 0.36,
                speedMin: 0.75,
                speedMax: 1.7 + power,
                vzMin: 0.7,
                vzMax: 1.9,
                decay: 0.0024,
                palette: ["#FFFFFF", "#FDE68A", color || "#FBBF24"]
            });
            this.pushImpactBurst({
                x,
                y,
                z: 0.58,
                color: color || "#FBBF24",
                size: 0.12 + power * 0.075,
                life: Math.round(155 + power * 65),
                kind: "hit"
            });

        }


        /* El impacto de radio conserva el daño original; este objeto sólo
           pinta una onda expansiva sobre el suelo y no abre otra ruta de
           física. Así lanza-pasticho y crio-pasticho tienen una AoE clara. */
        spawnAoEVisual(x, y, radius, color, slow) {

            if (this.aoeBursts.length >= MAX_AOE_BURSTS) {
                this.aoeBursts.shift();
            }

            const life = slow ? 680 : 560;
            const safeRadius = Math.max(0.35, Number(radius) || 1);

            this.aoeBursts.push({
                x,
                y,
                radius: safeRadius,
                color: color || "#F97316",
                slow: Boolean(slow),
                life,
                maxLife: life
            });
            this.spawnParticles(x, y, color || "#F97316", slow ? 30 : 34, {
                style: "aoe",
                pixelSize: slow ? 0.085 : 0.094,
                z: 0.18,
                zSpread: 0.65,
                speedMin: 0.85,
                speedMax: safeRadius * 1.8 + 1.2,
                vzMin: 0.45,
                vzMax: 2.4,
                decay: 0.00175,
                palette: slow
                    ? ["#E0F2FE", "#22D3EE", color || "#60A5FA"]
                    : ["#FFF7ED", "#FDE68A", color || "#F97316"]
            });

        }


        pushDecal(decal) {

            if (this.decals.length >= MAX_DECALS) {
                this.decals.shift();
            }

            this.decals.push(decal);

        }


        pushPuddle(puddle) {

            if (this.puddles.length >= MAX_PUDDLES) {
                this.puddles.shift();
            }

            this.puddles.push(puddle);

        }


        pushBeam(beam) {

            if (this.beams.length >= MAX_BEAMS) {
                this.beams.shift();
            }

            this.beams.push(beam);

        }


        updateParticles(dt) {

            const seconds = dt / 1000;

            for (let i = this.particles.length - 1; i >= 0; i -= 1) {

                const particle = this.particles[i];

                particle.x += particle.vx * seconds;
                particle.y += particle.vy * seconds;
                particle.z += particle.vz * seconds;
                particle.vz -= 2.4 * seconds;

                if (particle.z < 0) {
                    particle.z = 0;
                    particle.vz *= -0.35;
                }

                particle.life -= particle.decay * dt;

                if (particle.life <= 0) {
                    this.particles.splice(i, 1);
                }

            }

            for (let i = this.tracers.length - 1; i >= 0; i -= 1) {
                this.tracers[i].life -= dt;
                if (this.tracers[i].life <= 0) {
                    this.tracers.splice(i, 1);
                }
            }

            for (let i = this.impactBursts.length - 1; i >= 0; i -= 1) {
                this.impactBursts[i].life -= dt;
                if (this.impactBursts[i].life <= 0) {
                    this.impactBursts.splice(i, 1);
                }
            }

            for (let i = this.aoeBursts.length - 1; i >= 0; i -= 1) {
                this.aoeBursts[i].life -= dt;
                if (this.aoeBursts[i].life <= 0) {
                    this.aoeBursts.splice(i, 1);
                }
            }

            if (this.muzzleFlash) {
                this.muzzleFlash.life -= dt;
                if (this.muzzleFlash.life <= 0) {
                    this.muzzleFlash = null;
                }
            }

            for (let i = this.decals.length - 1; i >= 0; i -= 1) {

                this.decals[i].life -= dt;

                if (this.decals[i].life <= 0) {
                    this.decals.splice(i, 1);
                }

            }

        }


        /* ---------------------------------------------------------
           Niveles
           --------------------------------------------------------- */

        /* ---------------------------------------------------------
           Cinemática y Sala VIP
           --------------------------------------------------------- */

        endIntro() {

            this.intro = null;

            this.phase = "run";
            this.syncNarrativeControl();

            A.audio.music(this.worldTrack());

            /* El primer dossier ya está preparado desde loadLevel(). Sólo
               se recupera el cartel clásico si una variante sin dossier lo
               necesita, evitando dos overlays compitiendo al arrancar. */
            if (!this.transmission) {
                this.bannerText(
                    this.cfg.name,
                    this.cfg.subtitle,
                    this.cfg.light
                );
            }

        }


        enterShop() {

            this.phase = "shop";

            this.releaseKeys();

            /* La Sala VIP usa controles de menú y una zona táctil; soltar el
               puntero del FPS garantiza que el botón de regateo sea clicable. */
            if (document.pointerLockElement === this.stage.canvas && document.exitPointerLock) {
                document.exitPointerLock();
            }

            this.shopVisits = (this.shopVisits || 0) + 1;

            this.shop = new A.op404.Shop(this.stage, this);
            this.syncNarrativeControl();

            /* Checkpoint: se guarda el estado para reaparecer aquí */
            this.saveCheckpoint();

            A.audio.music("vip");

            A.audio.play("win");

        }


        leaveShop() {

            /* Las compras del Taller, armas y suministros se consolidan antes
               de abrir la siguiente zona; así el seguro no puede devolver un
               inventario anterior a la visita VIP. */
            this.saveCheckpoint();
            this.shop = null;

            this.phase = "run";
            this.syncNarrativeControl();

            this.loadLevel(this.levelIndex + 1);

            this.health = Math.min(MAX_HEALTH, this.health + 15);

            this.updateStats();

        }


        /* El progreso queda registrado al entrar en cada Sala VIP */
        saveCheckpoint() {

            this.checkpoint = {
                levelIndex: this.levelIndex,
                score: this.score,
                money: this.money,
                health: this.health,
                ammo: Object.assign({}, this.ammo),
                owned: Object.assign({}, this.owned),
                weapon: this.weapon,
                weaponUpgrades: this.cloneWeaponUpgrades(this.weaponUpgrades),

                /* La continuidad de los aliados también se guarda:
                   morir no debe borrarles la memoria. */
                allyMet: Object.assign({}, this.allyMet),
                difficulty: this.difficulty,

                /* Habilidades */
                furiaUnlocked: this.furiaUnlocked,
                furiaLevel: this.furiaLevel,
                yanquis: this.yanquis,
                claps: this.claps,
                /* La reserva no es un buff de segundos: se conserva al
                   volver por el seguro a esta Sala VIP. */
                shield: this.shield,
                shieldMax: this.shieldMax
            };

        }


        /* ---------------------------------------------------------
           CHECKPOINT DE CAMPO

           Un mapa amplio pide explorar sin castigar con una salida completa
           por el primer mal ángulo. Cada zona ofrece una restauración local:
           reinicia hostiles de esa zona, preserva arsenal/cartera y no gasta
           tickets ni interfiere con el seguro de la Sala VIP.
           --------------------------------------------------------- */

        saveFieldCheckpoint() {

            this.fieldCheckpoint = {
                available: true,
                levelIndex: this.levelIndex,
                score: this.score,
                money: this.money,
                ammo: Object.assign({ balas: 0, cartuchos: 0, pastichos: 0, celdas: 0 }, this.ammo),
                owned: Object.assign({}, this.owned),
                weapon: this.weapon,
                weaponUpgrades: this.cloneWeaponUpgrades(this.weaponUpgrades),
                furiaUnlocked: this.furiaUnlocked,
                furiaLevel: this.furiaLevel,
                yanquis: this.yanquis,
                claps: this.claps,
                shield: this.shield,
                shieldMax: this.shieldMax
            };

        }


        restoreFieldCheckpoint() {

            const save = this.fieldCheckpoint;

            if (!save || !save.available) {
                return false;
            }

            /* Marcamos el checkpoint antes de recargar: una nueva muerte no
               puede obtener otro uso de forma accidental dentro del mismo
               nivel. */
            save.available = false;
            this.score = save.score;
            this.money = save.money;
            this.ammo = Object.assign({ balas: 0, cartuchos: 0, pastichos: 0, celdas: 0 }, save.ammo);
            this.owned = Object.assign({ pistola: true }, save.owned);
            this.weapon = this.owned[save.weapon] ? save.weapon : "pistola";
            this.weaponUpgrades = this.cloneWeaponUpgrades(save.weaponUpgrades);
            this.furiaUnlocked = Boolean(save.furiaUnlocked);
            this.furiaLevel = Math.max(1, Number(save.furiaLevel) || 1);
            this.yanquis = Math.max(0, Number(save.yanquis) || 0);
            this.claps = Math.max(0, Number(save.claps) || 0);
            this.shieldMax = Math.max(1, Math.min(MAX_SHIELD, Math.floor(Number(save.shieldMax) || MAX_SHIELD)));
            this.shield = utils.clamp(Math.floor(Number(save.shield) || 0), 0, this.shieldMax);
            this.furiaCharge = 0;
            this.furiaTime = 0;
            /* El reintento conserva la reserva y deja una pequeña carga de
               emergencia, en vez de reinstalar un temporizador invisible. */
            this.grantShield(25);
            this.sugar = 0;
            this.sticky = 0;
            this.slow = 0;
            this.hurt = 0;
            this.releaseKeys();

            this.loadLevel(save.levelIndex, { fieldCheckpoint: save });
            this.health = Math.max(35, Math.min(MAX_HEALTH, Number(this.tuning.checkpointHealth) || 70));
            this.bannerText("CHECKPOINT DE CAMPO", "REINTENTO ACTIVADO · EQUIPO RESTAURADO", "#38BDF8");
            this.floater("REINTENTO DE CAMPO", "#38BDF8");
            this.shell.setStatus("CHECKPOINT · REINTENTO DE CAMPO ACTIVADO");
            A.audio.play("win");
            this.updateStats();

            return true;

        }


        /* ---------------------------------------------------------
           SEGURO DE VIDA

           Se compra en la Sala VIP. Si te matan, en vez de game over
           reapareces en la Sala VIP con el progreso del checkpoint,
           y el Sr. De Las Colinas te lo recuerda con cariño.
           --------------------------------------------------------- */

        useInsurance() {

            const save = this.checkpoint;

            if (!save) {
                return false;
            }

            this.insurance = false;

            /* Se restaura el estado guardado */
            this.levelIndex = save.levelIndex;
            this.score = save.score;
            this.money = save.money;
            this.ammo = Object.assign({ balas: 0, cartuchos: 0, pastichos: 0, celdas: 0 }, save.ammo);
            this.owned = Object.assign({ pistola: true }, save.owned);
            this.weapon = this.owned[save.weapon] ? save.weapon : "pistola";
            this.weaponUpgrades = this.cloneWeaponUpgrades(save.weaponUpgrades);

            /* Compatibilidad con checkpoints de la versión previa: las
               claves heredadas pasan a las identidades definitivas sin
               borrar un encuentro ya conseguido. */
            const savedAllies = save.allyMet || {};
            const legacyAllyKeys = {
                /* Se componen para que los aliases no sobrevivan como parte
                   de la identidad pública actual. */
                desire: ["a", "lex", "a"].join(""),
                davinchi: ["le", "on"].join("")
            };
            this.allyMet = {
                desire: Number(savedAllies.desire != null
                    ? savedAllies.desire
                    : (savedAllies[legacyAllyKeys.desire] || 0)) || 0,
                davinchi: Number(savedAllies.davinchi != null
                    ? savedAllies.davinchi
                    : (savedAllies[legacyAllyKeys.davinchi] || 0)) || 0,
                sil: Number(savedAllies.sil || 0) || 0
            };

            /* Un seguro devuelve la misma campaña que se guardó. Las
               partidas previas sin campo conservan la dificultad actual. */
            if (DIFFICULTIES[save.difficulty]) {
                this.difficulty = save.difficulty;
                this.syncDifficultyButtons();
            }

            this.furiaUnlocked = save.furiaUnlocked;
            this.furiaLevel = save.furiaLevel || 1;
            this.yanquis = save.yanquis || 0;
            this.claps = save.claps || 0;
            this.shieldMax = Math.max(1, Math.min(MAX_SHIELD, Math.floor(Number(save.shieldMax) || MAX_SHIELD)));
            this.shield = utils.clamp(Math.floor(Number(save.shield) || 0), 0, this.shieldMax);

            /* El regateo pertenece a una visita, no al checkpoint. Al
               volver a entrar enterShop() entrega los cinco intentos nuevos. */

            /* Vuelves entero, que para eso pagaste. El blindaje se restaura
               al valor consolidado, no se elimina como un efecto temporal. */
            this.health = MAX_HEALTH;
            this.furiaCharge = 0;
            this.furiaTime = 0;
            this.sugar = 0;
            this.sticky = 0;
            this.slow = 0;
            this.hurt = 0;

            this.releaseKeys();

            /* De vuelta a la Sala VIP, y el mercader lo va a disfrutar */
            this.enterShop();

            this.shop.mock();

            return true;

        }


        startLootWindow() {

            if (this.phase !== "run") {
                return;
            }

            this.phase = "loot";
            this.phaseTimer = LOOT_WINDOW_MS;
            this.lootTransitioning = false;

            /* Una victoria de jefe entrega la siguiente pista durante el
               botín. No congela ni acorta los 5000 ms de movimiento. */
            this.openClearTransmission();

            /* El último disparo ya hizo su trabajo. Se mantiene el control
               de movimiento, pero se bloquea todo fuego residual y daño de
               proyectiles mientras el jugador recoge lo que cayó. */
            this.keys.fire = false;
            delete this.pulses.fire;
            this.shots = [];
            this.hostileShots = [];
            this.beams = [];

            this.score += 500 * (this.levelIndex + 1);

            const last = this.levelIndex >= OP.LEVELS.length - 1;

            this.banner = {
                title: last ? "SR. M DERROTADO" : "ZONA LIMPIA",
                text: "RECOGE EL BOTÍN · 5.0s",
                timer: 1800,
                max: 1800,
                color: last ? "#39FF14" : this.cfg.light
            };

            this.shell.setStatus("BOTÍN ABIERTO · 5.0s");
            A.audio.play("win");
            this.updateStats();

        }


        /* Se invoca una vez al caer el último enemigo y otra al acabarse
           la cuenta. Separar ambas rutas conserva exactamente 5000 ms de
           botín jugable antes de tienda, siguiente zona o final. */
        clearLevel() {

            if (this.phase === "loot") {
                if (!Number.isFinite(this.phaseTimer) || this.phaseTimer <= 0) {
                    this.finishLootWindow();
                }
                return;
            }

            if (this.phase === "run") {
                this.startLootWindow();
            }

        }


        /* Único cierre permitido para la ventana de botín. Es importante
           que la bandera se active antes de llamar a código externo (tienda,
           HUD o final): si alguno vuelve a consultar clearLevel(), la segunda
           llamada no puede reiniciar ni duplicar la transición. */
        finishLootWindow() {

            if (this.phase !== "loot" || this.lootTransitioning) {
                return false;
            }

            this.lootTransitioning = true;
            this.phaseTimer = 0;
            this.afterClear();

            return true;

        }


        afterClear() {

            this.banner = null;
            /* La notificación de botín ya tuvo la ventana completa; no puede
               filtrarse por encima de la tienda, la zona siguiente o GAME OVER. */
            this.transmission = null;
            this.syncNarrativeControl();

            /* La ventana de botín ya terminó: la zona limpia acredita sus
               puntos globales ahora, una sola vez por la misma compuerta que
               evita congelamientos y transiciones duplicadas. */
            if (this.shell && typeof this.shell.awardVipLevel === "function") {
                const clearScore = 500 * (this.levelIndex + 1);
                const stage = this.cfg && this.cfg.stage ? this.cfg.stage : String(this.levelIndex + 1);
                this.shell.awardVipLevel(clearScore, `OPERACIÓN 404 · ZONA ${stage} LIMPIA`);
            }

            if (this.levelIndex >= OP.LEVELS.length - 1) {

                this.phase = "won";

                this.shell.win({
                    taunt: true,
                    title: "OPERACIÓN COMPLETADA",
                    text: "Le has quitado la cuchara al Sr. M. El comedor es tuyo.",
                    score: this.score
                });

                return;
            }

            /* El aviso de progreso llega al cerrar el botín, nunca tapa los
               cinco segundos en los que todavía se puede recoger. */
            this.shell.levelUpTaunt();

            /* Si la zona tiene Sala VIP, se pasa por la tienda antes
               de continuar; ella misma carga el siguiente nivel. */
            if (this.cfg.shop && A.op404.Shop) {

                this.enterShop();
                /* Si el último enemigo cruzó un umbral narrativo, ahora la
                   historia puede abrirse sobre una Sala VIP ya estable, sin
                   congelar ni recortar el botín que acaba de terminar. */
                this.updateStats();

                return;

            }

            this.phase = "run";

            this.loadLevel(this.levelIndex + 1);

            /* Se conserva el arsenal; se recupera algo de vida */
            this.health = Math.min(MAX_HEALTH, this.health + 25);

            this.updateStats();

        }


        /* ---------------------------------------------------------
           Entrada
           --------------------------------------------------------- */

        keyName(key) {

            switch (key) {

                case "w":
                case "W":
                case "ArrowUp":
                    return "up";

                case "s":
                case "S":
                case "ArrowDown":
                    return "down";

                case "a":
                case "A":
                    return "strafeLeft";

                case "d":
                case "D":
                    return "strafeRight";

                case "ArrowLeft":
                case "q":
                case "Q":
                    return "turnLeft";

                case "ArrowRight":
                case "e":
                case "E":
                    return "turnRight";

                case "Shift":
                    return "run";

                case " ":
                case "Spacebar":
                case "Control":
                    return "fire";

                default:
                    return null;

            }

        }


        key(key, event) {

            /* Cinemática: nunca avanza sola. ESPACIO (y Enter como
               alternativa de accesibilidad) muestra exactamente una escena;
               Escape conserva el salto explícito de toda la secuencia. */
            if (this.phase === "intro") {

                if (key === " " || key === "Spacebar" || key === "Enter" || key === "ArrowRight") {

                    if (!event || !event.repeat) {
                        this.intro.skipScene();
                    }

                    return true;

                }

                if (key === "Escape") {

                    this.intro.skipAll();

                    return true;

                }

                return false;

            }

            /* Los encuentros secretos también se leen a ritmo manual. */
            if (this.activeAllyDialogue()) {
                if (key === " " || key === "Spacebar" || key === "Enter" || key === "ArrowRight") {
                    return event && event.repeat ? true : this.advanceAllyDialogue();
                }
                if (key === "Escape") {
                    return this.skipAllyDialogue();
                }
                return true;
            }

            /* Las transmisiones de ruta y jefe también esperan lectura. */
            if (this.transmission && (key === " " || key === "Spacebar" || key === "Enter")) {
                return event && event.repeat ? true : this.dismissTransmission();
            }

            /* Sala VIP */
            if (this.phase === "shop") {

                if (this.shop && this.shop.intro >= 0) {
                    if (key === " " || key === "Spacebar" || key === "Enter" || key === "ArrowRight") {
                        return event && event.repeat ? true : this.shop.advanceIntro();
                    }
                    if (key === "Escape") {
                        return this.shop.skipIntro();
                    }
                    return true;
                }

                switch (key) {

                    case "ArrowUp":
                    case "w":
                    case "W":
                        this.shop.move(-1);
                        return true;

                    case "ArrowDown":
                    case "s":
                    case "S":
                        this.shop.move(1);
                        return true;

                    case "ArrowLeft":
                    case "a":
                    case "A":
                        this.shop.moveTab(-1);
                        return true;

                    case "ArrowRight":
                    case "d":
                    case "D":
                        this.shop.moveTab(1);
                        return true;

                    case "Enter":
                        this.shop.buy();
                        return true;

                    case "r":
                    case "R":
                        /* R expresa una petición de descuento; no abre un
                           botón ni revela el margen interno de la visita. */
                        this.shop.askDiscount("pedido de descuento");
                        return true;

                    case " ":
                        this.shop.leave();
                        return true;

                    default:
                        return false;

                }

            }

            if (this.phase !== "run" && this.phase !== "loot") {
                return false;
            }

            const name = this.keyName(key);

            if (name) {

                if (name === "fire") {

                    /* La ventana de botín conserva movimiento, no combate:
                       ninguna pulsación puede gastar munición después de
                       limpiar la zona. */
                    if (this.phase !== "run") {
                        this.keys.fire = false;
                        return true;
                    }

                    /* semi-automáticas: un disparo por pulsación */
                    if (!this.keys.fire || event && !event.repeat && !WEAPONS[this.weapon].auto) {
                        this.shoot();
                    }

                    this.keys.fire = true;

                    return true;

                }

                this.keys[name] = true;

                return true;

            }

            if (this.phase === "loot") {
                return false;
            }

            switch (key) {

                case "1":
                    this.selectWeapon("pistola");
                    return true;

                case "2":
                    this.selectWeapon("escopeta");
                    return true;

                case "3":
                    this.selectWeapon("ametralladora");
                    return true;

                case "4":
                    this.selectWeapon("lanzapasticho");
                    return true;

                case "5":
                    this.selectWeapon("riflepulso");
                    return true;

                case "6":
                    this.selectWeapon("criopasticho");
                    return true;

                case "7":
                    this.selectWeapon("rebotador");
                    return true;

                /* Z / X / C: habilidades. Q y E están ocupadas
                   virando la cámara. */
                case "z":
                case "Z":
                    this.callFuria();
                    return true;

                case "x":
                case "X":
                    this.callYanquis();
                    return true;

                case "c":
                case "C":
                    this.openClap();
                    return true;

                case "Tab":
                case "r":
                case "R":

                    if (event && event.preventDefault) {
                        event.preventDefault();
                    }

                    this.cycleWeapon(1);
                    return true;

                default:
                    return false;

            }

        }


        keyUp(key) {

            const name = this.keyName(key);

            if (!name) {
                return false;
            }

            this.keys[name] = false;

            return true;

        }


        /** Suelta todas las teclas (pausa, pérdida de foco, fin) */
        releaseKeys() {

            this.keys = {};
            this.pulses = {};
            this.touchMotion = { x: 0, y: 0 };
            this.mouseTurn = 0;

        }


        /* ---------------------------------------------------------
           Marcador
           --------------------------------------------------------- */

        updateStats(force = true) {

            if (!force && this.time < this.nextStatsUpdate) {
                return;
            }

            this.nextStatsUpdate = this.time + 100;

            const shell = this.shell;

            /* Hilo narrativo: el capítulo 9 cierra el arco y enlaza
               con la cinemática de apertura del propio juego. */
            /* Un capítulo global no puede pausar la cuenta de cinco
               segundos: si el umbral se cruza con el último enemigo, se
               revisa al entrar a tienda o a la siguiente zona. */
            if (shell.checkStory && this.phase !== "loot") {
                shell.checkStory(this.score);
            }

            shell.setStat("score", utils.formatScore(this.score));

            shell.setStat("best", utils.formatScore(
                Math.max(shell.best, this.score)
            ));

            /* "1-2" en vez de un índice suelto: se entiende el mundo */
            shell.setStat("level", this.cfg.stage || String(this.levelIndex + 1));
            shell.setStat("difficulty", this.tuning.short);

            const alive = this.enemies.filter((enemy) => !enemy.dead).length;

            shell.setStat("targets", alive);

            shell.setStat("money", this.money);

            const weapon = this.weaponProfile(this.weapon);
            const weaponTier = weapon.upgradeTotal
                ? " +" + weapon.upgradeTotal
                : "";

            shell.setStat("weapon", weapon.short + weaponTier);

            shell.setStat(
                "ammo",
                weapon.ammo === null ? "∞" : this.ammo[weapon.ammo]
            );

            shell.setMeter("health", utils.clamp(this.health / MAX_HEALTH, 0, 1));

        }


        /* El shell informa los FPS reales dos veces por segundo. Si un
           escritorio que parecía potente no puede sostener el combate,
           degradamos una vez y conservamos esa decisión durante la partida
           en lugar de alternar calidad y producir otro tipo de tirón. */
        onFps(fps) {

            if (this.renderProfile.constrained || this.renderCols <= LOW_RENDER_COLS) {
                return;
            }

            this.lowFpsSamples = fps < 42 ? this.lowFpsSamples + 1 : 0;

            if (this.lowFpsSamples < 2) {
                return;
            }

            this.renderProfile.constrained = true;
            this.renderCols = LOW_RENDER_COLS;
            this.colWidth = WIDTH / this.renderCols;
            this.zbuffer = new Float32Array(this.renderCols);
            this.sightInterval = 140;
            this.particleLimit = 72;
            this.renderProfile.renderInterval = 1000 / 30;
            this.lastRenderAt = -Infinity;
        }


        /* =========================================================
           DIBUJO
           ========================================================= */

        render() {

            /* La lógica e input continúan a 60 Hz. En hardware táctil
               limitado sólo se espacia el pintado del raycaster a 30 FPS,
               una cadencia estable que evita que el canvas monopolice el
               hilo principal durante el combate. */
            if (this.renderProfile.renderInterval &&
                (this.phase === "run" || this.phase === "loot")) {
                const now = typeof performance !== "undefined" &&
                    typeof performance.now === "function"
                    ? performance.now()
                    : Date.now();

                if (now - this.lastRenderAt < this.renderProfile.renderInterval) {
                    return;
                }

                this.lastRenderAt = now;
            }

            if (this.phase === "intro") {

                this.intro.render();

                return;

            }

            if (this.phase === "shop") {

                this.shop.render();

                return;

            }

            this.castWalls();
            this.drawWorldAtmosphere(false);
            this.drawDecals();
            this.drawSprites();
            this.drawCombatVfx();
            this.drawBeams();
            this.drawWorldAtmosphere(true);
            this.drawGun();
            this.drawTacticalFrame();
            this.drawHud();
            this.drawMinimap();

            if (this.phase === "loot" && !this.transmission) {
                this.drawLootCountdown();
            }

            if (this.boss && !this.boss.dead) {
                this.drawBossBar();
            }

            if (this.banner) {
                this.drawBanner();
            }

            if (this.furiaTime > 0) {
                this.drawFuria();
            }

            if (this.strike > 0) {
                this.drawStrike();
            }

            if (this.vignette) {
                this.drawVignette();
            }

            if (this.transmission) {
                this.drawTransmission();
            }

            this.drawAllyTalk();

            if (this.floaters.length) {
                this.drawFloaters();
            }

            if (this.hurt > 0) {
                this.drawHurt();
            }

            if (this.slow > 0) {
                this.drawSlow();
            }

        }


        textureFor(cell) {

            const names = this.cfg.tex;

            /* Las barreras de señal comparten física con una pared, pero usan
               un patrón propio para que se lean como cobertura táctica y no
               como otro bloque decorativo del mundo. */
            if (cell === "v") {
                return this.art.textures.escudo || this.art.textures.panel;
            }

            const key = cell === "%" ? names[1] : cell === "&" ? names[2] : names[0];

            return this.art.textures[key] || this.art.textures.panel;

        }


        castWalls() {

            const { ctx } = this.stage;

            const p = this.player;
            const cfg = this.cfg;
            const renderCols = this.renderCols;
            const colWidth = this.colWidth;

            /* Techo y suelo con degradado (niebla hacia el horizonte).
               Solo dependen de la zona, así que se construyen una vez y se
               reutilizan en vez de recrearlos en cada uno de los 60 frames. */
            if (!this.skyCache || this.skyCache.zone !== cfg) {

                const ceiling = ctx.createLinearGradient(0, 0, 0, HALF);

                ceiling.addColorStop(0, cfg.ceiling);
                ceiling.addColorStop(1, cfg.fog);

                const floor = ctx.createLinearGradient(0, HALF, 0, HEIGHT);

                floor.addColorStop(0, cfg.fog);
                floor.addColorStop(1, cfg.floor);

                this.skyCache = { zone: cfg, ceiling, floor };

            }

            ctx.fillStyle = this.skyCache.ceiling;
            ctx.fillRect(0, 0, WIDTH, HALF);

            ctx.fillStyle = this.skyCache.floor;
            ctx.fillRect(0, HALF, WIDTH, HALF);

            const dirX = Math.cos(p.angle);
            const dirY = Math.sin(p.angle);

            const planeLen = Math.tan(FOV / 2);

            const planeX = -dirY * planeLen;
            const planeY = dirX * planeLen;

            const pitch = Math.sin(this.bob) * 5;

            for (let col = 0; col < renderCols; col += 1) {

                const cameraX = 2 * col / renderCols - 1;

                const rayX = dirX + planeX * cameraX;
                const rayY = dirY + planeY * cameraX;

                let mapX = Math.floor(p.x);
                let mapY = Math.floor(p.y);

                const deltaX = Math.abs(1 / (rayX || 0.00001));
                const deltaY = Math.abs(1 / (rayY || 0.00001));

                let stepX;
                let stepY;
                let sideDistX;
                let sideDistY;

                if (rayX < 0) {
                    stepX = -1;
                    sideDistX = (p.x - mapX) * deltaX;
                } else {
                    stepX = 1;
                    sideDistX = (mapX + 1 - p.x) * deltaX;
                }

                if (rayY < 0) {
                    stepY = -1;
                    sideDistY = (p.y - mapY) * deltaY;
                } else {
                    stepY = 1;
                    sideDistY = (mapY + 1 - p.y) * deltaY;
                }

                let hit = false;
                let side = 0;
                let guard = 0;
                let cell = "#";

                while (!hit && guard < 80) {

                    guard += 1;

                    if (sideDistX < sideDistY) {
                        sideDistX += deltaX;
                        mapX += stepX;
                        side = 0;
                    } else {
                        sideDistY += deltaY;
                        mapY += stepY;
                        side = 1;
                    }

                    if (mapX < 0 || mapY < 0 || mapX >= MAP_W || mapY >= MAP_H) {
                        hit = true;
                        break;
                    }

                    cell = this.grid[mapY][mapX];

                    if (WALL_CHARS.indexOf(cell) >= 0) {
                        hit = true;
                    }

                }

                const perp = side === 0
                    ? sideDistX - deltaX
                    : sideDistY - deltaY;

                const distance = Math.max(0.12, perp);

                this.zbuffer[col] = distance;

                const lineHeight = HEIGHT / distance;

                const start = -lineHeight / 2 + HALF + pitch;

                let wallX = side === 0
                    ? p.y + distance * rayY
                    : p.x + distance * rayX;

                wallX -= Math.floor(wallX);

                let texX = Math.floor(wallX * TEX);

                if ((side === 0 && rayX > 0) || (side === 1 && rayY < 0)) {
                    texX = TEX - texX - 1;
                }

                texX = utils.clamp(texX, 0, TEX - 1);

                ctx.drawImage(
                    this.textureFor(cell),
                    texX, 0, 1, TEX,
                    col * colWidth, start, colWidth + 1, lineHeight
                );

                let shade = Math.min(0.78, distance / 17);

                if (side === 1) {
                    shade += 0.1;
                }

                ctx.fillStyle = "rgba(3, 5, 12, " + shade.toFixed(3) + ")";

                ctx.fillRect(col * colWidth, start, colWidth + 1, lineHeight);

            }

        }


        /* Identidad visual por mundo. Mantenerla en un helper permite que
           el HUD, el ambiente y las transmisiones hablen el mismo idioma
           sin meter condiciones dispersas por el raycaster. */
        worldVisual() {

            return WORLD_VISUALS[this.cfg && this.cfg.world] || {
                color: (this.cfg && this.cfg.light) || "#FBBF24",
                label: "CANAL ABIERTO",
                effect: "scan"
            };

        }


        /* Neblina y señales de ambiente en dos planos. Son trazos de visor,
           no sprites de mundo: no necesitan z-buffer ni física y no añaden
           trabajo al ciclo de enemigos. */
        drawWorldAtmosphere(foreground) {

            const { ctx } = this.stage;
            const visual = this.worldVisual();
            const t = this.time * 0.001;
            const count = this.renderProfile.constrained ? 6 : 12;

            ctx.save();
            ctx.strokeStyle = visual.color;
            ctx.fillStyle = visual.color;
            ctx.lineWidth = 1;

            switch (visual.effect) {

                case "scan":
                    if (foreground) {
                        ctx.globalAlpha = 0.075;

                        for (let i = 0; i < count; i += 1) {
                            const y = (i * 37 + t * 92) % HEIGHT;
                            ctx.fillRect(0, y, WIDTH, 1);
                        }
                    } else {
                        ctx.globalAlpha = 0.09;
                        const y = 38 + (Math.sin(t * 2.1) * 0.5 + 0.5) * 115;
                        ctx.fillRect(0, y, WIDTH, 2);
                    }
                    break;

                case "rain":
                    ctx.globalAlpha = foreground ? 0.18 : 0.08;

                    for (let i = 0; i < count; i += 1) {
                        const x = (i * 71 + t * (foreground ? 132 : 58)) % (WIDTH + 44) - 22;
                        const y = (i * 43 + t * (foreground ? 188 : 76)) % HEIGHT;

                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x - (foreground ? 9 : 5), y + (foreground ? 22 : 12));
                        ctx.stroke();
                    }
                    break;

                case "dust":
                    ctx.globalAlpha = foreground ? 0.16 : 0.08;

                    for (let i = 0; i < count; i += 1) {
                        const x = (i * 97 + t * 11 * (i % 3 + 1)) % WIDTH;
                        const y = 72 + (i * 41 + Math.sin(t + i) * 20) % 230;
                        const size = foreground ? (i % 3 + 1) : 1;
                        ctx.fillRect(x, y, size, size);
                    }
                    break;

                case "steam":
                    ctx.globalAlpha = foreground ? 0.11 : 0.065;

                    for (let i = 0; i < count - 2; i += 1) {
                        const x = (i * 89 + Math.sin(t * 0.7 + i) * 18 + WIDTH) % WIDTH;
                        const y = 110 + ((i * 29 + t * 24) % 190);
                        const h = foreground ? 30 + (i % 3) * 12 : 18;
                        ctx.fillRect(x, y - h, foreground ? 3 : 2, h);
                    }
                    break;

                case "static":
                    ctx.globalAlpha = foreground ? 0.13 : 0.07;

                    for (let i = 0; i < count; i += 1) {
                        const y = (i * 31 + t * 116) % HEIGHT;
                        const x = (i * 113 + t * 47) % 210;
                        const w = 80 + (i % 4) * 44;
                        ctx.fillRect(x, y, w, foreground ? 2 : 1);
                    }
                    break;

                case "spores":
                    ctx.globalAlpha = foreground ? 0.19 : 0.09;

                    for (let i = 0; i < count; i += 1) {
                        const x = (i * 83 + Math.sin(t * 1.2 + i) * 26 + WIDTH) % WIDTH;
                        const y = (i * 53 + t * (foreground ? 42 : 18)) % HEIGHT;
                        const size = 1 + i % 3;
                        ctx.fillRect(x, y, size, size);
                    }
                    break;

                default:
                    break;

            }

            ctx.restore();

        }


        /* Marco mínimo del visor: da profundidad de gabinete sin recurrir
           a filtros de canvas costosos y mantiene despejado el centro. */
        drawTacticalFrame() {

            const { ctx } = this.stage;
            const visual = this.worldVisual();
            const pulse = 0.16 + (Math.sin(this.time * 0.005) + 1) * 0.035;

            ctx.save();
            ctx.strokeStyle = visual.color;
            ctx.globalAlpha = pulse;
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(8, 30);
            ctx.lineTo(8, 8);
            ctx.lineTo(30, 8);
            ctx.moveTo(WIDTH - 30, 8);
            ctx.lineTo(WIDTH - 8, 8);
            ctx.lineTo(WIDTH - 8, 30);
            ctx.moveTo(8, HEIGHT - 30);
            ctx.lineTo(8, HEIGHT - 8);
            ctx.lineTo(30, HEIGHT - 8);
            ctx.moveTo(WIDTH - 30, HEIGHT - 8);
            ctx.lineTo(WIDTH - 8, HEIGHT - 8);
            ctx.lineTo(WIDTH - 8, HEIGHT - 30);
            ctx.stroke();

            ctx.globalAlpha = 0.05;
            ctx.fillStyle = visual.color;
            ctx.fillRect(0, 0, WIDTH, 2);
            ctx.fillRect(0, HEIGHT - 2, WIDTH, 2);

            ctx.restore();

        }


        /** Proyección de un punto del mundo a pantalla */
        project(x, y) {

            const p = this.player;

            const dirX = Math.cos(p.angle);
            const dirY = Math.sin(p.angle);

            const planeLen = Math.tan(FOV / 2);

            const planeX = -dirY * planeLen;
            const planeY = dirX * planeLen;

            const invDet = 1 / (planeX * dirY - dirX * planeY);

            const rx = x - p.x;
            const ry = y - p.y;

            return {
                tx: invDet * (dirY * rx - dirX * ry),
                ty: invDet * (-planeY * rx + planeX * ry)
            };

        }


        drawDecals() {

            const { ctx } = this.stage;
            const renderCols = this.renderCols;
            const colWidth = this.colWidth;

            const paint = (x, y, size, color, alpha) => {

                const { tx, ty } = this.project(x, y);

                if (ty <= 0.2) {
                    return;
                }

                const screenX = (WIDTH / 2) * (1 + tx / ty);

                const unit = Math.abs(HEIGHT / ty);

                const floorY = HALF + unit / 2;

                const col = Math.floor(screenX / colWidth);

                if (col < 0 || col >= renderCols || this.zbuffer[col] < ty) {
                    return;
                }

                ctx.save();

                ctx.globalAlpha = alpha;
                ctx.fillStyle = color;

                ctx.beginPath();
                ctx.ellipse(screenX, floorY, unit * size, unit * size * 0.42, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

            };

            this.decals.forEach((decal) => {

                paint(
                    decal.x, decal.y,
                    decal.big ? 0.3 : 0.1,
                    decal.color,
                    utils.clamp(decal.life / 5000, 0, 1) * 0.6
                );

            });

            this.puddles.forEach((puddle) => {

                paint(
                    puddle.x, puddle.y, 0.34, "#5A3A1C",
                    utils.clamp(puddle.life / 9000, 0, 1) * 0.85
                );

            });

        }


        drawSprites() {

            const { ctx } = this.stage;
            const renderCols = this.renderCols;
            const colWidth = this.colWidth;

            const items = [];

            this.enemies.forEach((enemy) => {

                if (enemy.hidden) {
                    return;
                }

                const frames = this.art.enemies[enemy.variant] || this.art.enemies[enemy.kind];

                const moving = !enemy.dead && enemy.stagger <= 0;

                const fallback = moving
                    ? frames[Math.floor(enemy.anim / 180) % frames.length]
                    : frames[0];

                /* Los retratos externos se solicitan al cargar la zona.
                   Mientras siguen decodificando, usamos una baliza de señal
                   neutral: jamás el sprite procedural anterior del enemigo.
                   El fallback histórico sólo queda para tipos que no poseen
                   ilustración externa o para harnesses mínimos sin baliza. */
                const hasExternalArt = Boolean(enemy.assetId && A.assets &&
                    typeof A.assets.readyImage === "function");
                const external = hasExternalArt
                    ? A.assets.readyImage(enemy.assetId)
                    : null;
                const frame = external && typeof A.assets.canvasFrame === "function"
                    ? A.assets.canvasFrame(enemy.assetId)
                    : null;
                const externalFit = external ? externalSpriteFit(enemy.assetId) : null;
                const pending = hasExternalArt && !external
                    ? (this.art.pendingEnemy && this.art.pendingEnemy[
                        Math.floor(enemy.anim / 220) % this.art.pendingEnemy.length
                    ])
                    : null;

                items.push({
                    x: enemy.x,
                    y: enemy.y,
                    sprite: external || pending || fallback,
                    /* La ventana visible conserva las proporciones reales;
                       cada ficha baja la silueta para que no flote alta. */
                    frame,
                    scale: external
                        ? fittedSpriteScale(external, frame, enemy.type.size * externalFit.height)
                        : (pending ? enemy.type.size * 0.84 : enemy.type.size),
                    lift: external ? externalFit.lift : (pending ? 0.76 : 0.5),
                    ground: Boolean(external || pending),
                    /* Los PNG de elenco no son pixel-art procedural: forzar
                       nearest-neighbour sobre ellos al entrar al visor los
                       hacía verse dentados/deformados a escala fraccional. */
                    externalArtwork: Boolean(external),
                    alpha: enemy.dead ? utils.clamp(enemy.deadTimer / 520, 0, 1) : 1,
                    flash: enemy.flash > 0,
                    slow: !enemy.dead && enemy.slowed > 0,
                    slowColor: enemy.slowColor || "#60A5FA",
                    squash: enemy.dead ? 1 - (1 - enemy.deadTimer / 520) * 0.75 : 1,
                    bob: enemy.dead ? 0 : Math.sin(enemy.anim / 140) * 2,
                    enemy
                });

            });

            (this.allies || []).forEach((ally) => {

                const frames = this.art.allies[ally.kind];

                /* La animación de aparición marca el gesto */
                const showing = ally.intro > 0;

                const fallback = showing
                    ? frames[Math.floor(ally.intro / 160) % frames.length]
                    : frames[Math.floor(ally.anim / 400) % frames.length];

                /* Desire, Davinchi y Sil usan exclusivamente sus PNG de
                   cuerpo completo en este FPS. El sprite procedural cubre la
                   carga inicial, pero nunca sustituye la identidad visible final. */
                const portrait = ALLY_ART[ally.kind];
                const assetId = portrait && portrait.idle;
                const external = assetId && A.assets
                    ? A.assets.readyImage(assetId)
                    : null;
                const frame = external && typeof A.assets.canvasFrame === "function"
                    ? A.assets.canvasFrame(assetId)
                    : null;

                items.push({
                    x: ally.x,
                    y: ally.y,
                    sprite: external || fallback,
                    /* Los marcos de personaje eliminan el gran lienzo vacío
                       de los originales y apoyan ambos cuerpos en el suelo. */
                    frame,
                    scale: external
                        ? fittedSpriteScale(external, frame, 1.13)
                        : 1.05,
                    lift: external ? 0.9 : 0.5,
                    ground: Boolean(external),
                    externalArtwork: Boolean(external),
                    alpha: 1,
                    squash: 1,
                    bob: Math.sin(ally.anim / 260) * (showing ? 2 : 1)
                });

            });

            /* El Companion activo es una entidad del mundo: se proyecta y se
               oculta detrás de paredes igual que aliados/enemigos. */
            if (this.virtualCompanion && this.art.companions) {

                const companion = this.virtualCompanion;
                const framesByMood = this.art.companions[companion.id];
                const mood = framesByMood && (framesByMood[companion.mood] || framesByMood.follow);
                const frames = mood || [];

                if (frames.length) {
                    items.push({
                        x: companion.x,
                        y: companion.y,
                        sprite: frames[Math.floor(companion.anim / 170) % frames.length],
                        scale: companion.mood === "cheer" ? 0.61 : 0.54,
                        lift: 0.78,
                        ground: true,
                        alpha: 1,
                        squash: companion.mood === "danger" ? 0.92 : 1,
                        bob: Math.sin(companion.anim / 105) * 1.3,
                        companion
                    });
                }

            }


            this.props.forEach((prop) => {

                items.push({
                    x: prop.x,
                    y: prop.y,
                    sprite: this.art.props[prop.kind],
                    scale: prop.kind === "barril" ? 0.7 : 0.95,
                    lift: 0.7,
                    alpha: 1,
                    squash: 1,
                    bob: 0
                });

            });

            this.pickups.forEach((item) => {

                let sprite;
                let scale;

                if (item.type === "dinero") {

                    /* Fajo para botines grandes, moneda girando el resto */
                    if (item.big) {

                        sprite = this.art.money.billete;
                        scale = 0.4;

                    } else {

                        const frames = this.art.money.moneda;

                        sprite = frames[
                            Math.floor((item.spin || 0) + this.time / 120) % frames.length
                        ];

                        scale = 0.3;

                    }

                } else {

                    sprite = this.art.items[item.type];
                    scale = item.type.length > 8 ? 0.55 : 0.42;

                }

                items.push({
                    x: item.x,
                    y: item.y,
                    sprite,
                    scale,
                    lift: 0.86,
                    alpha: 1,
                    squash: 1,
                    bob: Math.sin(item.bob) * 3
                });

            });

            this.shots.forEach((shot) => {

                items.push({
                    x: shot.x,
                    y: shot.y,
                    sprite: this.art.shots[shot.sprite],
                    scale: shot.sprite === "pasticho" || shot.sprite === "crio"
                        ? 0.34 : (shot.sprite === "rebote" ? 0.22 : 0.16),
                    lift: 0.55,
                    alpha: 1,
                    squash: 1,
                    bob: 0
                });

            });

            this.hostileShots.forEach((shot) => {

                items.push({
                    x: shot.x,
                    y: shot.y,
                    sprite: this.art.shots[shot.sprite],
                    scale: shot.sprite === "bala" ? 0.16 : 0.3,
                    lift: 0.5,
                    alpha: 1,
                    squash: 1,
                    bob: 0
                });

            });

            this.particles.forEach((particle) => {

                items.push({
                    x: particle.x,
                    y: particle.y,
                    sprite: null,
                    particle,
                    scale: 0.1,
                    lift: 1 - particle.z,
                    alpha: Math.max(0, particle.life),
                    squash: 1,
                    bob: 0
                });

            });

            items.forEach((item) => {

                const { tx, ty } = this.project(item.x, item.y);

                item.transformX = tx;
                item.transformY = ty;

            });

            items.sort((a, b) => b.transformY - a.transformY);

            items.forEach((item) => {

                if (item.transformY <= 0.18) {
                    return;
                }

                const screenX = (WIDTH / 2) * (1 + item.transformX / item.transformY);

                const unit = Math.abs(HEIGHT / item.transformY);

                if (item.particle) {

                    const particle = item.particle;
                    const maxSize = particle.style === "hitspark" || particle.style === "aoe"
                        ? 16 : 10;
                    const size = Math.max(2, Math.min(
                        maxSize,
                        unit * (particle.pixelSize || 0.05)
                    ));
                    const pixel = Math.max(1, Math.round(size / 3));
                    const centerX = Math.round(screenX);
                    const floorY = HALF + unit / 2 - unit * particle.z;
                    const centerY = Math.round(floorY);

                    const col = Math.floor(screenX / colWidth);

                    if (col < 0 || col >= renderCols || this.zbuffer[col] < item.transformY) {
                        return;
                    }

                    ctx.save();
                    ctx.imageSmoothingEnabled = false;
                    ctx.globalAlpha = item.alpha;
                    ctx.fillStyle = particle.color;

                    if (particle.style === "hitspark") {

                        /* Una cruz dura de píxeles comunica el golpe sobre
                           retratos grandes mejor que un único punto tenue. */
                        const arm = Math.max(pixel * 2, Math.round(size * 0.7));
                        ctx.globalCompositeOperation = "lighter";
                        ctx.fillRect(centerX - Math.floor(pixel / 2), centerY - arm, pixel, arm * 2 + pixel);
                        ctx.fillRect(centerX - arm, centerY - Math.floor(pixel / 2), arm * 2 + pixel, pixel);
                        ctx.globalAlpha = item.alpha * 0.92;
                        ctx.fillStyle = "#FFFFFF";
                        ctx.fillRect(centerX - pixel, centerY - pixel, pixel * 2, pixel * 2);

                    } else if (particle.style === "aoe") {

                        /* Fragmento romboidal para la nube de una explosión;
                           se mantiene deliberadamente cuadriculado. */
                        ctx.globalCompositeOperation = "lighter";
                        ctx.fillRect(centerX - pixel, centerY, pixel * 3, pixel);
                        ctx.fillRect(centerX, centerY - pixel, pixel, pixel * 3);

                    } else {
                        ctx.fillRect(centerX - size / 2, centerY - size / 2, size, size);
                    }

                    ctx.restore();

                    return;
                }

                if (!item.sprite) {
                    return;
                }

                const sourceWidth = item.frame
                    ? item.frame.width
                    : (item.sprite.naturalWidth || item.sprite.width);
                const sourceHeight = item.frame
                    ? item.frame.height
                    : (item.sprite.naturalHeight || item.sprite.height);

                if (!sourceWidth || !sourceHeight) {
                    return;
                }

                const width = unit * item.scale;
                const height = width * (sourceHeight / sourceWidth);

                const left = screenX - width / 2;
                const right = screenX + width / 2;

                if (right < 0 || left > WIDTH) {
                    return;
                }

                const colLeft = Math.floor(left / colWidth);
                const colCenter = Math.floor(screenX / colWidth);
                const colRight = Math.floor(right / colWidth);

                const visible = [colLeft, colCenter, colRight].some((col) => (
                    col >= 0 && col < renderCols && this.zbuffer[col] > item.transformY
                ));

                if (!visible) {
                    return;
                }

                const floorY = HALF + unit / 2;
                const top = floorY - height * item.lift + item.bob;

                const drawH = height * item.squash;

                ctx.save();

                /* Los sprites generados conservan píxel duro; los PNG de
                   enemigos/jefes se interpolan para que su primer cuadro en
                   el mapa no muestre dientes ni una falsa deformación al
                   proyectarse a tamaños fraccionales. */
                ctx.imageSmoothingEnabled = Boolean(item.externalArtwork);
                if (item.externalArtwork && "imageSmoothingQuality" in ctx) {
                    ctx.imageSmoothingQuality = "high";
                }

                ctx.globalAlpha = item.alpha;

                /* Recorte por columnas: solo la parte no tapada por muros */
                const from = Math.max(0, colLeft);
                const to = Math.min(renderCols - 1, colRight);

                ctx.beginPath();

                let runStart = null;

                for (let col = from; col <= to + 1; col += 1) {

                    const open = col <= to && this.zbuffer[col] > item.transformY;

                    if (open && runStart === null) {
                        runStart = col;
                    } else if (!open && runStart !== null) {

                        ctx.rect(runStart * colWidth, 0, (col - runStart) * colWidth, HEIGHT);
                        runStart = null;

                    }

                }

                ctx.clip();

                /* Una sombra compacta fija el contacto con el suelo. Con
                   ilustraciones de cuerpo entero evita el efecto flotante
                   que hacía que enemigos y jefes parecieran demasiado altos. */
                if (item.ground) {
                    const shadowWidth = Math.min(width * 0.46, unit * 0.72);

                    ctx.save();
                    ctx.globalAlpha = item.alpha * (item.enemy && item.enemy.dead ? 0.16 : 0.25);
                    ctx.fillStyle = "#02030A";
                    ctx.beginPath();
                    ctx.ellipse(screenX, top + drawH - 2, shadowWidth / 2, Math.max(2, shadowWidth * 0.11), 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                if (item.frame) {
                    ctx.drawImage(
                        item.sprite,
                        item.frame.x,
                        item.frame.y,
                        item.frame.width,
                        item.frame.height,
                        left,
                        top + (height - drawH),
                        width,
                        drawH
                    );
                } else {
                    ctx.drawImage(item.sprite, left, top + (height - drawH), width, drawH);
                }

                if (item.flash) {

                    ctx.globalCompositeOperation = "source-atop";
                    ctx.globalAlpha = item.alpha * 0.55;
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(left, top, width, height);

                } else if (item.slow) {

                    /* El frío deja una lectura azul sobre el enemigo durante
                       toda la ralentización, no sólo en el impacto inicial. */
                    ctx.globalCompositeOperation = "source-atop";
                    ctx.globalAlpha = item.alpha * 0.34;
                    ctx.fillStyle = item.slowColor;
                    ctx.fillRect(left, top, width, height);

                }

                ctx.restore();

                /* Consigna sobre la cabeza */
                if (item.enemy && item.enemy.shout > 0 && !item.enemy.dead && width > 22) {

                    const alpha = utils.clamp(item.enemy.shout / 400, 0, 1);

                    ctx.save();

                    ctx.globalAlpha = alpha;

                    const font = Math.max(8, Math.min(16, width * 0.16));

                    canvasKit.text(ctx, item.enemy.shoutText, screenX, top - font * 0.9, {
                        font: "800 " + font + "px 'JetBrains Mono', monospace",
                        color: item.enemy.type.boss ? "#FBBF24" : "#F5F7FF",
                        shadow: "#05070E",
                        shadowBlur: 6
                    });

                    ctx.restore();

                }

                /* El gesto se lee dentro del mapa (sobre el sprite), no en
                   un overlay. Se atenúa rápido para no tapar el combate. */
                if (item.companion && item.companion.signalTimer > 0 && width > 18) {

                    const alpha = utils.clamp(item.companion.signalTimer / 450, 0, 1);
                    const font = Math.max(7, Math.min(12, width * 0.2));

                    ctx.save();
                    ctx.globalAlpha = alpha;
                    canvasKit.text(ctx, item.companion.signal, screenX, top - font * 0.8, {
                        font: "800 " + font + "px 'JetBrains Mono', monospace",
                        color: item.companion.color,
                        shadow: "#05070E",
                        shadowBlur: 6
                    });
                    ctx.restore();

                }


                /* Barra de vida de los enemigos normales tocados */
                if (item.enemy && !item.enemy.dead && !item.enemy.type.boss &&
                    item.enemy.hp < item.enemy.maxHp && width > 18) {

                    const barW = Math.min(60, width * 0.8);

                    ctx.save();
                    ctx.fillStyle = "rgba(5, 7, 14, 0.7)";
                    ctx.fillRect(screenX - barW / 2, top - 6, barW, 4);
                    ctx.fillStyle = "#F43F5E";
                    ctx.fillRect(screenX - barW / 2, top - 6, barW * item.enemy.hp / item.enemy.maxHp, 4);
                    ctx.restore();

                }

            });

        }


        /* ---------------------------------------------------------
           VFX DE COMBATE

           Los efectos se proyectan contra el mismo z-buffer de sprites y
           muros. Son geométricos/pixelados, no DOM overlays: por eso siguen
           la cámara, se esconden correctamente y conservan el FPS estable.
           --------------------------------------------------------- */
        isVfxProjectedVisible(projected) {

            if (!projected || projected.ty <= 0.18) {
                return false;
            }

            const screenX = (WIDTH / 2) * (1 + projected.tx / projected.ty);
            const col = Math.floor(screenX / this.colWidth);

            return col >= 0 && col < this.renderCols &&
                this.zbuffer[col] > projected.ty - 0.045;

        }


        drawNeonTracer(x0, y0, x1, y1, color, width, alpha) {

            const from = this.project(x0, y0);
            const to = this.project(x1, y1);

            if (from.ty <= 0.18 || to.ty <= 0.18) {
                return;
            }

            const midpoint = {
                tx: (from.tx + to.tx) / 2,
                ty: (from.ty + to.ty) / 2
            };
            if (!this.isVfxProjectedVisible(midpoint)) {
                return;
            }

            const startX = Math.round((WIDTH / 2) * (1 + from.tx / from.ty));
            /* Los proyectiles se apoyan cerca del suelo como sus sprites;
               usar el mismo plano evita trazadoras flotando en el horizonte. */
            const startY = Math.round(HALF + Math.abs(HEIGHT / from.ty) * 0.44);
            const endX = Math.round((WIDTH / 2) * (1 + to.tx / to.ty));
            const endY = Math.round(HALF + Math.abs(HEIGHT / to.ty) * 0.44);
            const distance = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));
            const steps = Math.max(2, Math.min(
                this.renderProfile.constrained ? 11 : 22,
                Math.ceil(distance / 3)
            ));
            const thickness = Math.max(0.7, Number(width) || 1);
            const opacity = Number.isFinite(alpha) ? utils.clamp(alpha, 0, 1) : 1;
            const outer = Math.max(2, Math.round(2 + thickness * 1.7));
            const core = Math.max(1, Math.round(1 + thickness * 0.45));

            const { ctx } = this.stage;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.globalCompositeOperation = "lighter";
            ctx.fillStyle = color || "#FDE68A";
            ctx.globalAlpha = opacity * 0.44;

            for (let index = 0; index <= steps; index += 1) {
                const ratio = index / steps;
                const px = Math.round(startX + (endX - startX) * ratio);
                const py = Math.round(startY + (endY - startY) * ratio);
                ctx.fillRect(px - Math.floor(outer / 2), py - Math.floor(outer / 2), outer, outer);
            }

            ctx.fillStyle = "#F8FAFC";
            ctx.globalAlpha = opacity * 0.92;
            for (let index = 0; index <= steps; index += 1) {
                const ratio = index / steps;
                const px = Math.round(startX + (endX - startX) * ratio);
                const py = Math.round(startY + (endY - startY) * ratio);
                ctx.fillRect(px - Math.floor(core / 2), py - Math.floor(core / 2), core, core);
            }

            ctx.restore();

        }


        drawPixelImpact(burst) {

            const projected = this.project(burst.x, burst.y);
            if (!this.isVfxProjectedVisible(projected)) {
                return;
            }

            const { ctx } = this.stage;
            const unit = Math.abs(HEIGHT / projected.ty);
            const screenX = Math.round((WIDTH / 2) * (1 + projected.tx / projected.ty));
            const screenY = Math.round(HALF + unit / 2 - unit * burst.z);
            const remaining = utils.clamp(burst.life / burst.maxLife, 0, 1);
            const phase = 1 - remaining;
            const radius = Math.max(3, Math.min(46,
                unit * burst.size * (0.65 + phase * 1.25)
            ));
            const pixel = Math.max(2, Math.round(radius * 0.22));
            const points = burst.kind === "defeat" ? 8 : 4;

            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = remaining * 0.78;
            ctx.fillStyle = burst.color;

            for (let index = 0; index < points; index += 1) {
                const angle = (Math.PI * 2 * index / points) + (burst.kind === "hit" ? Math.PI / 4 : 0);
                const px = Math.round(screenX + Math.cos(angle) * radius);
                const py = Math.round(screenY + Math.sin(angle) * radius * 0.72);
                ctx.fillRect(px - pixel, py - pixel, pixel * 2, pixel * 2);
            }

            ctx.globalAlpha = remaining;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(screenX - pixel, screenY - pixel, pixel * 2, pixel * 2);
            ctx.restore();

        }


        drawAoEBurst(burst) {

            const projected = this.project(burst.x, burst.y);
            if (!this.isVfxProjectedVisible(projected)) {
                return;
            }

            const { ctx } = this.stage;
            const unit = Math.abs(HEIGHT / projected.ty);
            const screenX = Math.round((WIDTH / 2) * (1 + projected.tx / projected.ty));
            const floorY = Math.round(HALF + unit / 2);
            const remaining = utils.clamp(burst.life / burst.maxLife, 0, 1);
            const phase = 1 - remaining;
            const radius = Math.max(5, Math.min(150,
                unit * burst.radius * (0.3 + phase * 0.82)
            ));
            const verticalRadius = Math.max(3, radius * 0.36);
            const pixels = this.renderProfile.constrained ? 10 : 16;
            const block = Math.max(2, Math.min(8, Math.round(radius * 0.075)));

            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = remaining * 0.58;
            ctx.fillStyle = burst.color;

            for (let index = 0; index < pixels; index += 1) {
                const angle = Math.PI * 2 * index / pixels;
                const px = Math.round(screenX + Math.cos(angle) * radius);
                const py = Math.round(floorY + Math.sin(angle) * verticalRadius);
                ctx.fillRect(px - block, py - block, block * 2, block * 2);
            }

            /* Segundo anillo corto: convierte el área en un pulso fácil de
               leer sin cubrir la visión central con una nube transparente. */
            ctx.globalAlpha = remaining * 0.3;
            ctx.fillStyle = burst.slow ? "#E0F2FE" : "#FFF7ED";
            for (let index = 0; index < pixels; index += 2) {
                const angle = Math.PI * 2 * index / pixels + Math.PI / pixels;
                const px = Math.round(screenX + Math.cos(angle) * radius * 0.56);
                const py = Math.round(floorY + Math.sin(angle) * verticalRadius * 0.56);
                ctx.fillRect(px - block, py - block, block * 2, block * 2);
            }

            ctx.restore();

        }


        drawCombatVfx() {

            const liveTrail = (shot, fallbackColor, fallbackLength) => {
                const dx = shot.x - (Number.isFinite(shot.trailX) ? shot.trailX : shot.x);
                const dy = shot.y - (Number.isFinite(shot.trailY) ? shot.trailY : shot.y);
                const moved = Math.hypot(dx, dy);
                const velocity = Math.hypot(shot.vx || 0, shot.vy || 0);
                let x0 = Number.isFinite(shot.trailX) ? shot.trailX : shot.x;
                let y0 = Number.isFinite(shot.trailY) ? shot.trailY : shot.y;

                if (moved < 0.025 && velocity > 0.01) {
                    const length = shot.trailLength || fallbackLength;
                    x0 = shot.x - shot.vx / velocity * length;
                    y0 = shot.y - shot.vy / velocity * length;
                }

                this.drawNeonTracer(
                    x0,
                    y0,
                    shot.x,
                    shot.y,
                    shot.color || fallbackColor,
                    shot.sprite === "pasticho" || shot.sprite === "crio" ? 1.45 : 0.9,
                    1
                );
            };

            this.aoeBursts.forEach((burst) => this.drawAoEBurst(burst));
            this.impactBursts.forEach((burst) => this.drawPixelImpact(burst));

            this.shots.forEach((shot) => liveTrail(shot, "#FDE68A", 0.48));

            /* Las trazadoras enemigas ayudan a esquivar, pero se recortan en
               perfil ligero para que el arsenal del jugador conserve foco. */
            const hostileLimit = this.renderProfile.constrained ? 4 : 10;
            for (let index = 0; index < this.hostileShots.length && index < hostileLimit; index += 1) {
                const shot = this.hostileShots[index];
                const color = shot.sprite === "petroleo" ? "#F97316"
                    : (shot.sprite === "texto" ? "#C084FC" : "#F43F5E");
                liveTrail(shot, color, 0.3);
            }

            this.tracers.forEach((tracer) => {
                this.drawNeonTracer(
                    tracer.x0,
                    tracer.y0,
                    tracer.x1,
                    tracer.y1,
                    tracer.color,
                    tracer.width,
                    utils.clamp(tracer.life / tracer.maxLife, 0, 1)
                );
            });

        }


        drawBeams() {

            const { ctx } = this.stage;

            this.beams.forEach((beam) => {

                const { tx, ty } = this.project(beam.x, beam.y);

                if (ty <= 0.2) {
                    return;
                }

                const screenX = (WIDTH / 2) * (1 + tx / ty);

                const unit = Math.abs(HEIGHT / ty);

                const radius = unit * beam.radius * 0.5;

                const alpha = utils.clamp(beam.life / 600, 0, 1) * 0.28;

                ctx.save();

                const glow = ctx.createRadialGradient(screenX, HALF, 0, screenX, HALF, radius);

                glow.addColorStop(0, "rgba(192, 132, 252, " + alpha + ")");
                glow.addColorStop(1, "rgba(192, 132, 252, 0)");

                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);

                /* Ruido de texto */
                ctx.globalAlpha = alpha * 2;
                ctx.fillStyle = "#F5F7FF";
                ctx.font = "700 9px 'JetBrains Mono', monospace";

                for (let i = 0; i < 12; i += 1) {

                    const x = screenX + (Math.random() - 0.5) * radius * 1.6;
                    const y = HALF + (Math.random() - 0.5) * radius;

                    ctx.fillText(utils.pick(["PROGRESO", "CAMINO", "UNIÓN", "FUTURO", "###", "..."]), x, y);

                }

                ctx.restore();

            });

        }


        drawGun() {

            const { ctx } = this.stage;

            const sprite = this.art.hands[this.weapon];

            const recoil = this.recoil * 26;

            const swap = this.weaponSwap > 0 ? (this.weaponSwap / 260) * 90 : 0;

            const bobX = Math.sin(this.bob) * 6;
            const bobY = Math.abs(Math.cos(this.bob)) * 5;

            const height = 150;
            const width = height * (sprite.width / sprite.height);

            ctx.save();

            ctx.imageSmoothingEnabled = false;

            ctx.drawImage(
                sprite,
                WIDTH / 2 - width / 2 + bobX + 30,
                HEIGHT - height + recoil + bobY + swap + 10,
                width,
                height
            );

            /* Fogonazo animado en escalones de píxel. No depende del valor
               instantáneo de recoil: cada arma deja leer su disparo durante
               varios cuadros y el lanza-pasticho conserva su pulso naranja. */
            const flash = this.muzzleFlash;
            if (flash && flash.life > 0) {

                const remaining = utils.clamp(flash.life / flash.maxLife, 0, 1);
                const frame = Math.floor((flash.maxLife - flash.life) / 23) % 3;
                const pulse = (0.85 + (frame === 1 ? 0.3 : 0.08)) * flash.power;
                const pixel = Math.max(3, Math.round(3 * pulse));
                const muzzleX = Math.round(WIDTH / 2 + bobX + 30);
                const muzzleY = Math.round(HEIGHT - height + 8 + bobY + recoil * 0.16);
                const sparks = [
                    [0, -4, 1, 4], [-1, -3, 3, 2], [1, -3, 2, 2],
                    [-2, -1, 5, 1], [-1, 0, 3, 2], [0, 1, 1, 2]
                ];

                ctx.globalCompositeOperation = "lighter";
                ctx.globalAlpha = remaining * 0.3;
                ctx.fillStyle = flash.color;
                ctx.fillRect(muzzleX - pixel * 3, muzzleY - pixel * 4, pixel * 6, pixel * 7);

                ctx.globalAlpha = remaining * 0.9;
                sparks.forEach(([x, y, widthUnits, heightUnits], index) => {
                    ctx.fillStyle = index % 2 ? "#FDE68A" : flash.color;
                    ctx.fillRect(
                        muzzleX + x * pixel - Math.floor(pixel / 2),
                        muzzleY + y * pixel - Math.floor(pixel / 2),
                        widthUnits * pixel,
                        heightUnits * pixel
                    );
                });

                ctx.globalAlpha = remaining;
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(muzzleX - pixel, muzzleY - pixel, pixel * 2, pixel * 2);

            }

            ctx.restore();

        }


        /* Contadores de las tres habilidades, arriba a la izquierda */
        drawAbilityBar() {

            const { ctx } = this.stage;

            const slots = [
                {
                    key: "Z",
                    label: "FURIA",
                    value: this.furiaUnlocked
                        ? Math.floor(
                            Math.min(1, this.furiaCharge / this.furiaNeeded()) * 100
                        ) + "%"
                        : "—",
                    color: "#F43F5E",
                    ready: this.furiaUnlocked
                        && this.furiaCharge >= this.furiaNeeded()
                        && this.furiaTime <= 0,
                    gauge: this.furiaUnlocked
                        ? Math.min(1, this.furiaCharge / this.furiaNeeded())
                        : 0
                },
                {
                    key: "X",
                    label: "YANQUIS",
                    value: String(this.yanquis),
                    color: "#38BDF8",
                    ready: this.yanquis > 0
                },
                {
                    key: "C",
                    label: "CLAP",
                    value: String(this.claps),
                    color: "#A3E635",
                    ready: this.claps > 0
                }
            ];

            const startY = this.transmission
                ? (this.transmission.kind === "threat" ? 180 : 164)
                : 76;

            ctx.save();

            slots.forEach((slot, i) => {

                const x = 10;
                const y = startY + i * 26;

                canvasKit.fillRoundRect(
                    ctx, x, y, 112, 22, 6,
                    slot.ready ? "rgba(5, 7, 14, 0.78)" : "rgba(5, 7, 14, 0.42)"
                );

                ctx.globalAlpha = slot.ready ? 1 : 0.4;

                canvasKit.text(ctx, "[" + slot.key + "]", x + 8, y + 11, {
                    font: "800 9px 'JetBrains Mono', monospace",
                    color: slot.color,
                    align: "left"
                });

                canvasKit.text(ctx, slot.label, x + 34, y + 11, {
                    font: "700 9px 'JetBrains Mono', monospace",
                    color: "rgba(245, 247, 255, 0.85)",
                    align: "left"
                });

                canvasKit.text(ctx, slot.value, x + 104, y + 11, {
                    font: "800 10px 'Orbitron', sans-serif",
                    color: slot.color,
                    align: "right"
                });

                /* Barrita de carga (sólo la Furia la usa) */
                if (typeof slot.gauge === "number") {

                    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
                    ctx.fillRect(x + 8, y + 17, 96, 2);

                    ctx.fillStyle = slot.color;
                    ctx.fillRect(x + 8, y + 17, 96 * slot.gauge, 2);

                }

                ctx.globalAlpha = 1;

            });

            ctx.restore();

        }


        drawHud() {

            const { ctx } = this.stage;

            /* Mira de visor: conserva la lectura inmediata de la cruz, pero
               toma el color del mundo y deja un punto de foco respirando. */
            ctx.save();

            const visual = this.worldVisual();
            const cx = WIDTH / 2;
            const cy = HALF;
            const aimPulse = 0.56 + (Math.sin(this.time * 0.012) + 1) * 0.12;

            ctx.strokeStyle = "rgba(245, 247, 255, 0.84)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx - 11, cy);
            ctx.lineTo(cx - 4, cy);
            ctx.moveTo(cx + 4, cy);
            ctx.lineTo(cx + 11, cy);
            ctx.moveTo(cx, cy - 11);
            ctx.lineTo(cx, cy - 4);
            ctx.moveTo(cx, cy + 4);
            ctx.lineTo(cx, cy + 11);
            ctx.stroke();

            ctx.globalAlpha = aimPulse;
            ctx.strokeStyle = visual.color;
            ctx.beginPath();
            ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = visual.color;
            ctx.fillRect(cx - 0.75, cy - 0.75, 1.5, 1.5);

            ctx.restore();

            /* Barra de habilidades: furia, bombardeo y bolsas */
            this.drawAbilityBar();

            /* Panel inferior izquierdo: salud y blindaje. El escudo tiene
               carril propio para que el jugador no dependa de un floater al
               recoger Nutrivicha, un bono VIP o una ayuda de Desire. */
            const barW = 170;
            const vitalsY = HEIGHT - 82;
            const shieldActive = this.shield > 0;
            const shield = this.shieldRatio();
            const shieldCharge = Math.ceil(Math.max(0, this.shield));
            const shieldCapacity = Math.max(1, Math.ceil(this.shieldMax || MAX_SHIELD));

            ctx.save();

            canvasKit.fillRoundRect(ctx, 10, vitalsY, 200, 72, 8, "rgba(5, 7, 14, 0.74)");

            canvasKit.text(ctx, "SALUD", 20, vitalsY + 14, {
                font: "700 9px 'JetBrains Mono', monospace",
                color: "rgba(245, 247, 255, 0.7)",
                align: "left"
            });

            /* El reintento de campo se anuncia una vez como estado, no como
               una moneda de tienda: explorar sigue siendo una decisión libre. */
            const checkpointReady = this.fieldCheckpoint && this.fieldCheckpoint.available;
            canvasKit.text(ctx, checkpointReady ? "CP · LISTO" : "CP · USADO", 102, vitalsY + 14, {
                font: "700 7px 'JetBrains Mono', monospace",
                color: checkpointReady ? "#38BDF8" : "rgba(148, 163, 184, 0.68)",
                align: "center"
            });

            canvasKit.text(ctx, String(this.health) + "%", 200, vitalsY + 14, {
                font: "800 13px 'Orbitron', sans-serif",
                color: this.health > 50 ? "#22C55E" : this.health > 25 ? "#FBBF24" : "#F43F5E",
                align: "right"
            });

            canvasKit.roundRect(ctx, 20, vitalsY + 25, barW, 11, 5);
            ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
            ctx.fill();

            const health = utils.clamp(this.health / MAX_HEALTH, 0, 1);

            if (health > 0) {

                canvasKit.roundRect(ctx, 20, vitalsY + 25, barW * health, 11, 5);

                ctx.fillStyle = health > 0.5 ? "#22C55E" : this.health > 25 ? "#FBBF24" : "#F43F5E";

                ctx.fill();

            }

            /* Barra permanente del escudo: apagada sigue indicando que no hay
               protección; encendida muestra los puntos que aún absorberá. */
            canvasKit.text(ctx, "ESCUDO", 20, vitalsY + 48, {
                font: "700 9px 'JetBrains Mono', monospace",
                color: shieldActive ? "#67E8F9" : "rgba(148, 163, 184, 0.64)",
                align: "left"
            });

            canvasKit.text(ctx, shieldActive ? shieldCharge + "/" + shieldCapacity : "SIN CARGA", 200, vitalsY + 48, {
                font: "800 9px 'Orbitron', sans-serif",
                color: shieldActive ? "#A5F3FC" : "rgba(148, 163, 184, 0.58)",
                align: "right"
            });

            canvasKit.roundRect(ctx, 20, vitalsY + 56, barW, 7, 3);
            ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
            ctx.fill();

            if (shield > 0) {

                const shieldGlow = 0.72 + (Math.sin(this.time * 0.016) + 1) * 0.14;
                ctx.globalAlpha = shieldGlow;
                canvasKit.roundRect(ctx, 20, vitalsY + 56, barW * shield, 7, 3);
                ctx.fillStyle = "#22D3EE";
                ctx.fill();
                ctx.globalAlpha = 1;

            }

            ctx.restore();

            /* Panel inferior derecho: arma, mods del Taller y munición */
            const weapon = this.weaponProfile(this.weapon);

            ctx.save();

            canvasKit.fillRoundRect(ctx, WIDTH - 222, HEIGHT - 58, 212, 48, 8, "rgba(5, 7, 14, 0.7)");

            const modText = weapon.upgradeTotal
                ? "TALLER · I" + weapon.upgrades.impact +
                    " C" + weapon.upgrades.cycle + " E" + weapon.upgrades.control
                : "TALLER · BASE";
            canvasKit.text(ctx, modText, WIDTH - 212, HEIGHT - 52, {
                font: "700 6px 'JetBrains Mono', monospace",
                color: weapon.upgradeTotal ? "#C084FC" : "rgba(245, 247, 255, 0.36)",
                align: "left"
            });

            canvasKit.text(ctx, weapon.label, WIDTH - 20, HEIGHT - 44, {
                font: "700 9px 'JetBrains Mono', monospace",
                color: "#FBBF24",
                align: "right"
            });

            const ammoText = weapon.ammo === null ? "∞" : String(this.ammo[weapon.ammo]);

            canvasKit.text(ctx, ammoText, WIDTH - 20, HEIGHT - 22, {
                font: "800 24px 'Orbitron', sans-serif",
                color: weapon.ammo === null || this.ammo[weapon.ammo] > 0 ? "#F5F7FF" : "#F43F5E",
                align: "right",
                shadow: "#FBBF24",
                shadowBlur: 8
            });

            /* Ranuras del inventario */
            WEAPON_ORDER.forEach((kind, index) => {

                const x = WIDTH - 212 + index * 26;
                const y = HEIGHT - 34;

                const owned = this.owned[kind];
                const active = kind === this.weapon;

                canvasKit.fillRoundRect(
                    ctx, x, y, 22, 18, 4,
                    active ? "rgba(251, 191, 36, 0.9)" : owned ? "rgba(245, 247, 255, 0.2)" : "rgba(245, 247, 255, 0.06)"
                );

                canvasKit.text(ctx, String(index + 1), x + 11, y + 9, {
                    font: "800 10px 'JetBrains Mono', monospace",
                    color: active ? "#05070E" : owned ? "#F5F7FF" : "rgba(245, 247, 255, 0.3)"
                });

            });

            /* Reservas */
            canvasKit.text(
                ctx,
                "B " + this.ammo.balas + "  C " + this.ammo.cartuchos + "  P " + this.ammo.pastichos + "  CE " + this.ammo.celdas,
                WIDTH - 212, HEIGHT - 44,
                {
                    font: "700 8px 'JetBrains Mono', monospace",
                    color: "rgba(245, 247, 255, 0.6)",
                    align: "left"
                }
            );

            ctx.restore();

            this.drawOperationTelemetry();

        }


        /* Encabezado compacto de campaña. Los doce nodos se ven sin tapar
           la mira: el jugador entiende cuánto falta y qué clase de señal
           está atravesando aun cuando la transmisión inicial ya se fue. */
        drawOperationTelemetry() {

            const { ctx } = this.stage;
            const visual = this.worldVisual();
            const world = (OP.WORLDS || []).find((entry) => entry.id === this.cfg.world) || {};
            const alive = this.enemies.reduce(
                (total, enemy) => total + (enemy.dead ? 0 : 1),
                0
            );
            const x = 10;
            const y = 12;
            const width = 146;
            const height = 40;

            ctx.save();
            canvasKit.fillRoundRect(ctx, x, y, width, height, 5, "rgba(4, 7, 16, 0.66)");
            ctx.strokeStyle = visual.color;
            ctx.globalAlpha = 0.65;
            ctx.lineWidth = 1;
            canvasKit.roundRect(ctx, x, y, width, height, 5);
            ctx.stroke();
            ctx.globalAlpha = 1;

            canvasKit.text(ctx, "OP-404 // " + (this.cfg.stage || "--"), x + 8, y + 12, {
                font: "800 8px 'JetBrains Mono', monospace",
                color: visual.color,
                align: "left"
            });

            canvasKit.text(ctx, world.short || this.cfg.name, x + width - 8, y + 12, {
                font: "700 8px 'JetBrains Mono', monospace",
                color: "rgba(245, 247, 255, 0.68)",
                align: "right"
            });

            canvasKit.text(ctx, visual.label + " · " + alive + " H", x + 8, y + 27, {
                font: "700 8px 'JetBrains Mono', monospace",
                color: "rgba(245, 247, 255, 0.9)",
                align: "left"
            });

            const nodeWidth = 8;
            const nodeGap = 3;
            const trackX = x + width - 12 * (nodeWidth + nodeGap) + nodeGap;

            for (let i = 0; i < 12; i += 1) {
                const reached = i < this.levelIndex;
                const current = i === this.levelIndex;

                ctx.globalAlpha = current ? 1 : reached ? 0.72 : 0.18;
                ctx.fillStyle = current ? visual.color : reached ? "#F5F7FF" : visual.color;
                ctx.fillRect(trackX + i * (nodeWidth + nodeGap), y + 31, nodeWidth, 3);
            }

            ctx.restore();

        }


        drawBossBar() {

            const { ctx } = this.stage;

            const boss = this.boss;

            const w = 300;
            const x = WIDTH / 2 - w / 2;
            const y = 14;

            ctx.save();

            canvasKit.fillRoundRect(ctx, x - 8, y - 6, w + 16, 34, 6, "rgba(5, 7, 14, 0.78)");
            ctx.strokeStyle = "rgba(244, 63, 94, 0.72)";
            ctx.lineWidth = 1;
            canvasKit.roundRect(ctx, x - 8, y - 6, w + 16, 34, 6);
            ctx.stroke();
            ctx.fillStyle = "#F43F5E";
            ctx.globalAlpha = 0.75;
            ctx.fillRect(x - 2, y - 1, 4, 6);
            ctx.globalAlpha = 1;

            canvasKit.text(ctx, "AMENAZA // " + boss.type.label, WIDTH / 2, y + 2, {
                font: "800 9px 'Orbitron', sans-serif",
                color: "#F43F5E",
                shadow: "#7F1D1D",
                shadowBlur: 6
            });

            canvasKit.roundRect(ctx, x, y + 12, w, 8, 4);
            ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
            ctx.fill();

            const ratio = utils.clamp(boss.hp / boss.maxHp, 0, 1);

            if (ratio > 0) {

                canvasKit.roundRect(ctx, x, y + 12, w * ratio, 8, 4);
                ctx.fillStyle = "#F43F5E";
                ctx.fill();

            }

            ctx.restore();

        }


        minimap() {

            if (this.minimapCache) {
                return this.minimapCache;
            }

            const cell = 4;
            const size = MAP_W * cell;

            const canvas = document.createElement("canvas");

            canvas.width = (size + 4) * 2;
            canvas.height = (size + 4) * 2;

            const c = canvas.getContext("2d");

            c.scale(2, 2);

            c.fillStyle = "rgba(5, 7, 14, 0.72)";
            c.fillRect(0, 0, size + 4, size + 4);

            for (let y = 0; y < MAP_H; y += 1) {

                for (let x = 0; x < MAP_W; x += 1) {

                    const tile = this.grid[y][x];
                    if (WALL_CHARS.indexOf(tile) >= 0) {

                        c.fillStyle = tile === "v" ? "#22D3EE" : this.cfg.light;
                        c.globalAlpha = tile === "v" ? 0.9 : 0.5;
                        c.fillRect(2 + x * cell, 2 + y * cell, cell, cell);

                    }

                }

            }

            c.globalAlpha = 1;

            this.minimapCache = { canvas, size: size + 4, cell };

            return this.minimapCache;

        }


        drawMinimap() {

            const { ctx } = this.stage;

            const map = this.minimap();

            const ox = WIDTH - map.size - 12;
            const baseY = 12 + (this.boss && !this.boss.dead ? 34 : 0);
            /* Durante una tarjeta narrativa el radar baja unos píxeles:
               sigue disponible sin atravesar el retrato ni el texto. */
            const transmissionY = this.transmission
                ? (this.transmission.kind === "threat" ? 188 : 170)
                : 0;
            const oy = Math.max(baseY, transmissionY);

            const visual = this.worldVisual();

            ctx.save();

            canvasKit.fillRoundRect(
                ctx,
                ox - 5,
                oy - 15,
                map.size + 10,
                map.size + 20,
                5,
                "rgba(4, 7, 16, 0.74)"
            );
            ctx.strokeStyle = visual.color;
            ctx.globalAlpha = 0.6;
            ctx.lineWidth = 1;
            canvasKit.roundRect(ctx, ox - 5, oy - 15, map.size + 10, map.size + 20, 5);
            ctx.stroke();

            ctx.globalAlpha = 0.92;

            ctx.drawImage(map.canvas, ox, oy, map.size, map.size);

            ctx.globalAlpha = 1;

            canvasKit.text(ctx, "RADAR // " + visual.label, ox, oy - 8, {
                font: "800 7px 'JetBrains Mono', monospace",
                color: visual.color,
                align: "left"
            });

            const put = (x, y, color, radius) => {

                ctx.fillStyle = color;

                ctx.beginPath();
                ctx.arc(ox + 2 + x * map.cell, oy + 2 + y * map.cell, radius, 0, Math.PI * 2);
                ctx.fill();

            };

            this.pickups.forEach((item) => {
                /* Las cajas aleatorias se distinguen de una curación o una
                   bala normal incluso en el radar compacto. */
                put(
                    item.x,
                    item.y,
                    item.randomWeapon ? "#C084FC" : "#22C55E",
                    item.randomWeapon ? 1.8 : 1.4
                );
            });

            this.enemies.forEach((enemy) => {

                if (!enemy.dead) {
                    put(enemy.x, enemy.y, enemy.type.boss ? "#FBBF24" : "#F43F5E", enemy.type.boss ? 2.6 : 1.7);
                }

            });

            const p = this.player;

            ctx.fillStyle = "#A3E635";

            ctx.beginPath();
            ctx.arc(ox + 2 + p.x * map.cell, oy + 2 + p.y * map.cell, 2.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#A3E635";
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.moveTo(ox + 2 + p.x * map.cell, oy + 2 + p.y * map.cell);
            ctx.lineTo(
                ox + 2 + (p.x + Math.cos(p.angle) * 1.6) * map.cell,
                oy + 2 + (p.y + Math.sin(p.angle) * 1.6) * map.cell
            );
            ctx.stroke();

            ctx.restore();

        }


        drawLootCountdown() {

            const { ctx } = this.stage;
            const remaining = Math.max(0, this.phaseTimer);
            const ratio = utils.clamp(remaining / LOOT_WINDOW_MS, 0, 1);
            const seconds = (remaining / 1000).toFixed(1);
            const width = 232;
            const x = WIDTH / 2 - width / 2;
            const y = 54;

            ctx.save();
            canvasKit.fillRoundRect(ctx, x, y, width, 32, 7, "rgba(5, 7, 14, 0.82)");
            ctx.strokeStyle = "rgba(163, 230, 53, 0.78)";
            ctx.lineWidth = 1;
            canvasKit.roundRect(ctx, x, y, width, 32, 7);
            ctx.stroke();

            canvasKit.text(ctx, "BOTÍN ABIERTO · " + seconds + "s", WIDTH / 2, y + 12, {
                font: "800 10px 'JetBrains Mono', monospace",
                color: "#D9F99D",
                shadow: "#05070E",
                shadowBlur: 4
            });

            canvasKit.fillRoundRect(ctx, x + 12, y + 20, width - 24, 5, 2.5, "rgba(255, 255, 255, 0.12)");
            canvasKit.fillRoundRect(ctx, x + 12, y + 20, (width - 24) * ratio, 5, 2.5, "#A3E635");
            ctx.restore();

        }


        /* Retrato contenido en una tarjeta de radio. Usa el mismo recorte
           conocido por el raycaster para jefes y cuerpos completos; una
           ficha de texto estable ocupa su lugar mientras el PNG llega. */
        drawTransmissionPortrait(ctx, assetId, x, y, width, height, color, label) {

            canvasKit.fillRoundRect(ctx, x, y, width, height, 5, "rgba(2, 4, 10, 0.74)");

            let image = null;

            if (assetId && A.assets && typeof A.assets.readyImage === "function") {
                image = A.assets.readyImage(assetId);
            }

            const sourceWidth = image && (image.naturalWidth || image.width);
            const sourceHeight = image && (image.naturalHeight || image.height);

            if (!sourceWidth || !sourceHeight) {
                ctx.save();
                ctx.globalAlpha = 0.72;
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
                canvasKit.text(ctx, label || "404", x + width / 2, y + height / 2, {
                    font: "900 9px 'Orbitron', sans-serif",
                    color,
                    shadow: color,
                    shadowBlur: 6
                });
                ctx.restore();
                return false;
            }

            const frame = typeof A.assets.canvasFrame === "function"
                ? A.assets.canvasFrame(assetId)
                : null;
            const sourceX = frame ? frame.x : 0;
            const sourceY = frame ? frame.y : 0;
            const cropWidth = frame ? frame.width : sourceWidth;
            const cropHeight = frame ? frame.height : sourceHeight;
            const scale = Math.min(
                (width - 6) / cropWidth,
                (height - 5) / cropHeight
            );
            const drawWidth = cropWidth * scale;
            const drawHeight = cropHeight * scale;

            ctx.save();
            ctx.beginPath();

            if (ctx.roundRect) {
                ctx.roundRect(x, y, width, height, 5);
            } else {
                ctx.rect(x, y, width, height);
            }

            ctx.clip();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                image,
                sourceX,
                sourceY,
                cropWidth,
                cropHeight,
                x + (width - drawWidth) / 2,
                y + height - drawHeight - 2,
                drawWidth,
                drawHeight
            );
            ctx.restore();

            return true;

        }


        /* La transmisión es una pequeña escena de HUD, no una pausa:
           aparece al cruzar una zona y deja que el jugador siga mirando,
           moviéndose y disparando. Las amenazas de jefe elevan el aviso y
           encuadran simultáneamente la ilustración real del jefe y la voz
           que lo está reportando, sin pedir todo el paquete de arte. */
        drawTransmission() {

            const { ctx } = this.stage;
            const transmission = this.transmission;

            if (!transmission) {
                return;
            }

            const elapsed = Math.max(0, transmission.elapsed || 0);
            const alpha = utils.clamp(elapsed / TRANSMISSION_FADE_MS, 0, 1);
            const threat = transmission.kind === "threat";
            const displayLines = Array.isArray(transmission.displayLines)
                ? transmission.displayLines
                : transmission.lines;
            /* Las tarjetas de jefe reservan una ventana para cada rol: la
               voz queda a la izquierda y el objetivo hostil a la derecha.
               El texto continúa entre ambos para que se lean como una sola
               transmisión, no como dos overlays en competencia. El alto se
               adapta a las líneas ya partidas al abrir el dossier, nunca en
               el loop de render. */
            const width = threat ? 584 : 452;
            const minimumHeight = 84 + Math.max(0, displayLines.length - 1) * 12;
            const height = threat
                ? Math.max(126, minimumHeight)
                : Math.max(94, minimumHeight);
            const x = (WIDTH - width) / 2;
            const y = threat ? 48 : 58;
            const speakerPortraitWidth = threat ? 70 : 56;
            const speakerPortraitHeight = height - 16;
            const speakerPortraitX = x + 10;
            const portraitY = y + 8;
            const threatPortraitWidth = threat ? 88 : 0;
            const threatPortraitX = threat
                ? x + width - threatPortraitWidth - 10
                : 0;
            const textX = threat
                ? speakerPortraitX + speakerPortraitWidth + 12
                : speakerPortraitX + speakerPortraitWidth + 10;
            const textRight = threat ? threatPortraitX - 12 : x + width - 14;
            const label = threat
                ? "AMENAZA DETECTADA · ENLACE ACTIVO"
                : transmission.kind === "clear"
                    ? "NODO DESCONECTADO"
                    : "TRANSMISIÓN PRIORITARIA";

            ctx.save();
            ctx.globalAlpha = alpha * 0.94;
            canvasKit.fillRoundRect(ctx, x, y, width, height, 8, "rgba(4, 7, 16, 0.93)");

            ctx.globalAlpha = alpha;
            ctx.strokeStyle = transmission.color;
            ctx.lineWidth = threat ? 2 : 1;
            canvasKit.roundRect(ctx, x, y, width, height, 8);
            ctx.stroke();

            /* Dientes de señal: dan ritmo a la tarjeta sin filtros caros. */
            ctx.fillStyle = transmission.color;
            ctx.globalAlpha = alpha * (threat ? 0.25 : 0.18);

            for (let i = 0; i < 9; i += 1) {
                const signal = 4 + ((i * 7 + Math.floor(this.time / 90)) % 15);
                ctx.fillRect(x + 12 + i * 8, y + height - 7 - signal, 3, signal);
            }

            if (threat) {
                const flash = this.bossIntroMax
                    ? utils.clamp(this.bossIntro / this.bossIntroMax, 0, 1)
                    : 0;

                ctx.globalAlpha = alpha * (0.12 + flash * 0.16);
                ctx.fillRect(x, y, width, 4);
                ctx.fillRect(x, y + height - 4, width, 4);
            }

            ctx.globalAlpha = alpha;
            canvasKit.text(ctx, label, textX, y + 15, {
                font: "800 8px 'JetBrains Mono', monospace",
                color: transmission.color,
                align: "left",
                shadow: transmission.color,
                shadowBlur: 5
            });

            canvasKit.text(ctx, "ESPACIO / TOCAR", textRight, y + 15, {
                font: "700 7px 'JetBrains Mono', monospace",
                color: "rgba(245, 247, 255, 0.64)",
                align: "right"
            });

            canvasKit.text(
                ctx,
                threat ? transmission.threatName : transmission.channel,
                textX,
                y + 30,
                {
                    font: threat
                        ? "900 14px 'Orbitron', sans-serif"
                        : "800 9px 'JetBrains Mono', monospace",
                    color: threat ? "#FDE2E7" : "rgba(245, 247, 255, 0.9)",
                    align: "left"
                }
            );

            canvasKit.text(ctx, transmission.name + " · " + transmission.role, textX, y + 43, {
                font: "700 8px 'JetBrains Mono', monospace",
                color: threat
                    ? (transmission.speakerColor || "#FDE2E7")
                    : "rgba(245, 247, 255, 0.56)",
                align: "left"
            });

            /* El texto entra como una radio que termina de sincronizar;
               ninguna medición de texto ni layout variable por frame. */
            let characters = Math.max(0, Math.floor((elapsed - 150) / TRANSMISSION_TYPE_MS));

            displayLines.forEach((line, index) => {
                const visible = line.slice(0, Math.max(0, characters));
                characters -= line.length;

                if (visible) {
                    canvasKit.text(ctx, visible, textX, y + 57 + index * 12, {
                        font: "600 9px 'JetBrains Mono', monospace",
                        color: "rgba(245, 247, 255, 0.9)",
                        align: "left"
                    });
                }
            });

            const lootSeconds = Math.max(0, this.phaseTimer || 0) / 1000;
            const footer = this.phase === "loot"
                ? "BOTÍN // " + lootSeconds.toFixed(1) + "s · ENLACE ACTUALIZADO"
                : transmission.objective
                    ? "OBJ // " + transmission.objective
                    : "CANAL ESTABLE";

            canvasKit.text(ctx, footer, textX, y + height - 12, {
                font: "800 8px 'JetBrains Mono', monospace",
                color: transmission.color,
                align: "left"
            });

            /* En las alertas de jefe se dibujan ambos retratos en el mismo
               frame. Si alguno aún termina de cargar, su baliza lleva el
               nombre del rol y el otro no desaparece ni se reemplaza. */
            this.drawTransmissionPortrait(
                ctx,
                transmission.portraitId,
                speakerPortraitX,
                portraitY,
                speakerPortraitWidth,
                speakerPortraitHeight,
                transmission.speakerColor || transmission.color,
                transmission.name.slice(0, 3)
            );

            if (threat) {
                this.drawTransmissionPortrait(
                    ctx,
                    transmission.threatAsset,
                    threatPortraitX,
                    portraitY,
                    threatPortraitWidth,
                    speakerPortraitHeight,
                    transmission.color,
                    "!"
                );

                canvasKit.text(ctx, "VOZ", speakerPortraitX + speakerPortraitWidth / 2, y + height - 7, {
                    font: "800 6px 'JetBrains Mono', monospace",
                    color: transmission.speakerColor || "#F5F7FF"
                });
                canvasKit.text(ctx, "JEFE", threatPortraitX + threatPortraitWidth / 2, y + height - 7, {
                    font: "800 6px 'JetBrains Mono', monospace",
                    color: transmission.color
                });
            }

            ctx.restore();

        }


        drawBanner() {

            const { ctx } = this.stage;

            const banner = this.banner;

            const ratio = banner.timer / banner.max;

            const alpha = utils.clamp(ratio * 4, 0, 1) * utils.clamp((1 - ratio) * 5, 0, 1);

            const color = banner.color || this.cfg.light;
            /* Si una pista del dossier sigue arriba durante el botín, el
               cartel baja un poco: ambos se leen sin taparse. */
            const centerY = this.phase === "loot" && this.transmission
                ? HALF + 30
                : HALF;

            ctx.save();

            ctx.globalAlpha = alpha * 0.9;

            canvasKit.fillRoundRect(ctx, WIDTH / 2 - 200, centerY - 58, 400, 96, 12, "rgba(5, 7, 14, 0.92)");

            ctx.globalAlpha = alpha;

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            canvasKit.roundRect(ctx, WIDTH / 2 - 200, centerY - 58, 400, 96, 12);
            ctx.stroke();

            canvasKit.text(ctx, banner.title, WIDTH / 2, centerY - 20, {
                font: "800 22px 'Orbitron', sans-serif",
                color,
                shadow: color,
                shadowBlur: 16
            });

            canvasKit.text(ctx, banner.text, WIDTH / 2, centerY + 14, {
                font: "600 12px 'JetBrains Mono', monospace",
                color: "rgba(245, 247, 255, 0.85)"
            });

            ctx.restore();

        }


        /* Furia de Atención al Cliente: la pantalla se pone roja */
        drawFuria() {

            const { ctx } = this.stage;

            const t = this.furiaTime / this.furiaDuration();

            const pulse = 0.22 + Math.sin(this.time * 26) * 0.06;

            ctx.save();

            ctx.fillStyle = "rgba(220, 38, 38, " + (pulse * (0.4 + t * 0.6)).toFixed(3) + ")";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            ctx.strokeStyle = "rgba(248, 113, 113, 0.9)";
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, WIDTH - 8, HEIGHT - 8);

            canvasKit.text(ctx, "FURIA DE ATENCIÓN AL CLIENTE", WIDTH / 2, 42, {
                font: "900 14px 'Orbitron', sans-serif",
                color: "#FEE2E2",
                shadow: "#7F1D1D",
                shadowBlur: 10
            });

            /* Barra del tiempo que queda */
            const w = 180;

            ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
            ctx.fillRect(WIDTH / 2 - w / 2, 52, w, 6);

            ctx.fillStyle = "#F87171";
            ctx.fillRect(WIDTH / 2 - w / 2, 52, w * t, 6);

            ctx.restore();

        }


        /* Destello del bombardeo de los Yanquis */
        drawStrike() {

            const { ctx } = this.stage;

            const t = this.strike / 900;

            ctx.save();

            ctx.fillStyle = "rgba(248, 250, 252, " + (t * t * 0.85).toFixed(3) + ")";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            ctx.restore();

        }


        /* Viñeta de presentación (Desire) */
        drawVignette() {

            const { ctx } = this.stage;

            const v = this.vignette;

            const t = v.timer / v.max;

            const slide = (1 - Math.min(1, (1 - t) * 5)) * 60;

            ctx.save();

            ctx.globalAlpha = Math.min(1, t * 3);

            ctx.fillStyle = "rgba(10, 6, 16, 0.82)";
            ctx.fillRect(0, HEIGHT / 2 - 34 + slide, WIDTH, 58);

            ctx.fillStyle = v.color;
            ctx.fillRect(0, HEIGHT / 2 - 34 + slide, WIDTH, 3);
            ctx.fillRect(0, HEIGHT / 2 + 21 + slide, WIDTH, 3);

            canvasKit.text(ctx, v.text, WIDTH / 2, HEIGHT / 2 + slide, {
                font: "900 26px 'Orbitron', sans-serif",
                color: v.color,
                shadow: "#000000",
                shadowBlur: 12
            });

            ctx.restore();

        }


        /* Rótulos flotantes de efectos */
        drawFloaters() {

            const { ctx } = this.stage;

            ctx.save();

            this.floaters.forEach((floater, index) => {

                const t = floater.timer / floater.max;

                ctx.globalAlpha = Math.min(1, t * 2);

                canvasKit.text(
                    ctx,
                    floater.text,
                    WIDTH / 2,
                    HEIGHT / 2 - 40 - index * 20 - (1 - t) * 20,
                    {
                        font: "800 13px 'Orbitron', sans-serif",
                        color: floater.color,
                        shadow: "#05070E",
                        shadowBlur: 8
                    }
                );

            });

            ctx.restore();

        }


        drawHurt() {

            const { ctx } = this.stage;

            const alpha = utils.clamp(this.hurt / HURT_TIME, 0, 1) * 0.4;

            ctx.save();
            ctx.fillStyle = "rgba(244, 63, 94, " + alpha.toFixed(3) + ")";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.restore();

        }


        drawSlow() {

            const { ctx } = this.stage;

            ctx.save();

            ctx.strokeStyle = "rgba(122, 74, 34, 0.7)";
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, WIDTH - 10, HEIGHT - 10);

            canvasKit.text(ctx, "RALENTIZADO", WIDTH / 2, HEIGHT - 76, {
                font: "800 11px 'Orbitron', sans-serif",
                color: "#D9B382",
                shadow: "#05070E",
                shadowBlur: 6
            });

            ctx.restore();

        }


    }


    /* =========================================================
       REGISTRO
       ========================================================= */

    A.registerGame({

        id: "op404",
        number: "09",
        name: "OPERACIÓN 404",
        genre: "FPS / RAYCASTING",
        mode: "DOOM",
        vipTicket: "op404",

        music: "doom",

        accent: "var(--color-amber)",
        accentRgb: "217 119 6",
        cardRgb: "217 119 6",

        ratioMin: 1.5,
        ratioMax: 1.72,

        preview: `
            <span class="preview preview--op404">
                <i class="op404p__cielo"></i>
                <i class="op404p__suelo"></i>
                <i class="op404p__pared op404p__pared--izq"></i>
                <i class="op404p__pared op404p__pared--der"></i>
                <i class="op404p__enemigo op404p__enemigo--a"></i>
                <i class="op404p__enemigo op404p__enemigo--b"></i>
                <i class="op404p__enemigo op404p__enemigo--c"></i>
                <i class="op404p__bala"></i>
                <i class="op404p__fogonazo"></i>
                <i class="op404p__arma"></i>
                <i class="op404p__mira"></i>
                <i class="op404p__scan"></i>
            </span>
        `,

        readyTitle: "OPERACIÓN 404",
        readyText: "FPS de píxeles al estilo DOOM. Elige FÁCIL, NORMAL o DIFÍCIL en el selector antes de jugar: la campaña conserva sus doce zonas, seis nodos y jefes cada dos niveles. Recibe dossiers del equipo, encuentra a Sil en salas cifradas y usa su fondo extra en la Sala VIP.",
        readyHint: "ELIGE DIFICULTAD — ENTER EMPEZAR    WASD MOVER    RATÓN MIRAR Y DISPARAR",

        hud: `
            ${A.ui.stat("score", "SCORE", "000000")}
            ${A.ui.stat("best", "BEST", "000000")}
            ${A.ui.divider()}
            ${A.ui.stat("level", "ZONA", "1-1", { text: true })}
            ${A.ui.stat("difficulty", "DIF.", "NORMAL", { text: true })}
            ${A.ui.stat("targets", "HOSTILES", "0")}
            ${A.ui.stat("money", "BS", "0")}
            ${A.ui.divider()}
            ${A.ui.stat("weapon", "ARMA", "PISTOLA", { text: true })}
            ${A.ui.stat("ammo", "MUNICIÓN", "∞")}
            ${A.ui.meter("health", "SALUD")}
        `,

        controls: A.ui.switcher(
            "op404-difficulty",
            DIFFICULTY_ORDER.map((id) => ({
                value: id,
                label: DIFFICULTIES[id].label
            }))
        ),

        hint: "WASD — MOVER    RATÓN / ← → — MIRAR    CLIC / ESPACIO — DISPARAR    RUEDA / 1-7 — ARMA    SHIFT — CORRER    P — PAUSA",

        create(shell) {
            return new Op404Game(shell);
        }

    });

})(window.Arcade404);
