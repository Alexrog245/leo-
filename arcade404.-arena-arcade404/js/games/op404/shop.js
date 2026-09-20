/* =========================================================
   ARCADE 404 — OPERACIÓN 404
   SALA VIP — checkpoint y tienda

   Al terminar cada zona el agente entra en la Sala VIP:
   se guarda el progreso y atiende el SR. DE LAS COLINAS,
   un mercader con camisa blanca, lentes oscuros, pelo
   castaño y una corona de oro flotando sobre la cabeza.
   Está siempre relajado con su cerveza Polar y un toboso
   que dice "Soy VIP Baby".

   Vende arepas (vida) y munición a cambio del dinero que
   sueltan los enemigos.
   ========================================================= */

(function (A) {

    "use strict";

    const WIDTH = 640;
    const HEIGHT = 400;


    /* ---------------------------------------------------------
       Catálogo
       Cada artículo indica a qué recurso afecta y su tope.
       --------------------------------------------------------- */

    /* ---------------------------------------------------------
       CATÁLOGO POR CATEGORÍAS

       El inventario creció y en una sola lista no cabía, así que
       la mercancía va en pestañas. Se navega con izquierda /
       derecha entre categorías y arriba / abajo dentro de cada
       una.
       --------------------------------------------------------- */

    const CATEGORIES = [
        {
            id: "armas",
            label: "ARMAS",
            color: "#F87171",
            items: [
                {
                    id: "escopeta",
                    label: "ESCOPETA RECORTADA",
                    note: "arma secundaria · dispersión",
                    price: 240,
                    kind: "weapon",
                    weapon: "escopeta"
                },
                {
                    id: "ametralladora",
                    label: "AMETRALLADORA",
                    note: "arma automática · cadencia alta",
                    price: 340,
                    kind: "weapon",
                    weapon: "ametralladora"
                },
                {
                    id: "lanzapasticho",
                    label: "LANZAPASTICHOS",
                    note: "arma pesada · daño en área",
                    price: 460,
                    kind: "weapon",
                    weapon: "lanzapasticho"
                }
            ]
        },
        {
            id: "prototipos",
            label: "PROTO",
            color: "#C084FC",
            items: [
                {
                    id: "riflepulso",
                    label: "RIFLE DE PULSO",
                    note: "principal · atraviesa una silueta",
                    price: 390,
                    kind: "weapon",
                    weapon: "riflepulso"
                },
                {
                    id: "criopasticho",
                    label: "CRIO-PASTICHO",
                    note: "secundaria · área y ralentización",
                    price: 430,
                    kind: "weapon",
                    weapon: "criopasticho"
                },
                {
                    id: "rebotador",
                    label: "REBOTA-404",
                    note: "secundaria · tres rebotes en pared",
                    price: 370,
                    kind: "weapon",
                    weapon: "rebotador"
                }
            ]
        },
        {
            id: "taller",
            label: "TALLER",
            color: "#C084FC",
            items: [
                {
                    id: "impacto",
                    label: "NÚCLEO DE IMPACTO",
                    note: "+14% daño · arma equipada",
                    price: 120,
                    kind: "weaponUpgrade",
                    upgrade: "impact"
                },
                {
                    id: "ciclo",
                    label: "CICLADOR DE RECÁMARA",
                    note: "−9% espera · arma equipada",
                    price: 110,
                    kind: "weaponUpgrade",
                    upgrade: "cycle"
                },
                {
                    id: "control",
                    label: "ESTABILIZADOR 404",
                    note: "menos dispersión · más control",
                    price: 100,
                    kind: "weaponUpgrade",
                    upgrade: "control"
                }
            ]
        },
        {
            id: "municion",
            label: "MUNICIÓN",
            color: "#FBBF24",
            items: [
                {
                    id: "balas",
                    label: "CAJA DE BALAS",
                    note: "+60 balas",
                    price: 90,
                    kind: "ammo",
                    ammo: "balas",
                    amount: 60
                },
                {
                    id: "cartuchos",
                    label: "CARTUCHOS",
                    note: "+12 cartuchos",
                    price: 150,
                    kind: "ammo",
                    ammo: "cartuchos",
                    amount: 12
                },
                {
                    id: "pastichos",
                    label: "PASTICHO CONGELADO",
                    note: "+4 pastichos",
                    price: 210,
                    kind: "ammo",
                    ammo: "pastichos",
                    amount: 4
                },
                {
                    id: "celdas",
                    label: "CELDAS DE PULSO",
                    note: "+14 celdas para prototipos",
                    price: 175,
                    kind: "ammo",
                    ammo: "celdas",
                    amount: 14
                }
            ]
        },
        {
            id: "poderes",
            label: "PODERES",
            color: "#F43F5E",
            items: [
                {
                    id: "furiaUnlock",
                    label: "FURIA ATC",
                    note: "desbloquea el especial · se recarga con daño",
                    price: 300,
                    kind: "furiaUnlock"
                },
                {
                    id: "furiaUp",
                    label: "MEJORA DE FURIA",
                    note: "+duración y recarga más rápida",
                    price: 260,
                    kind: "furiaUp"
                },
                {
                    id: "yanqui",
                    label: "LLAMADA A LOS YANQUIS",
                    note: "+1 ataque aéreo",
                    price: 320,
                    kind: "yanqui"
                }
            ]
        },
        {
            id: "seguro",
            label: "SEGURO",
            color: "#38BDF8",
            items: [
                {
                    id: "recargaEscudo",
                    label: "RECARGA DE ESCUDO",
                    note: "+40 blindaje persistente · absorbe daño",
                    price: 150,
                    kind: "shield",
                    amount: 40
                },
                {
                    id: "seguro",
                    label: "SEGURO DE VIDA VIP",
                    note: "si te matan, reapareces aquí con tu progreso",
                    price: 400,
                    kind: "insurance"
                }
            ]
        },
        {
            id: "comida",
            label: "COMIDA",
            color: "#A3E635",
            items: [
                {
                    id: "clap",
                    label: "BOLSA DEL CLAP",
                    note: "60% suministros útiles · 40% contratiempos",
                    price: 35,
                    kind: "clap"
                },
                {
                    id: "arepa",
                    label: "AREPA RELLENA",
                    note: "+35 de vida",
                    price: 120,
                    kind: "health",
                    amount: 35
                },
                {
                    id: "chaleco",
                    label: "CHALECO VIP",
                    note: "vida al máximo",
                    price: 380,
                    kind: "full"
                }
            ]
        }
    ];


    /* Lista plana que expone el catálogo completo de la Sala VIP. */
    const STOCK = CATEGORIES.reduce(
        (all, category) => all.concat(category.items),
        []
    );


    /* El regateo es una conversación directa: cada Sala VIP estrena cinco
       intentos y sólo el 20% consigue un regalo limitado. */
    const HAGGLE_MAX_ATTEMPTS = 5;
    const HAGGLE_GIFT_CHANCE = 0.20;


    /* ---------------------------------------------------------
       Repertorio del mercader

       Hay frases obligatorias que siempre entran en rotación y
       otras que dependen de cómo le fue al jugador en la zona
       anterior: si pasó sin despeinarse, si llegó reventado o si
       anda sin un bolívar encima.
       --------------------------------------------------------- */

    const LINES = {

        saludo: [
            "Bienvenido a la Sala VIP. No pises la alfombra como si fuera pública.",
            "Tranquilo: este refugio tiene filtro, hielo y categoría.",
            "Siéntate. ¿Un toboso? No, esa reserva es de miembro fundador.",
            "El estatus no se explica; se factura.",
            "Mi ex confundió austeridad con personalidad. Imperdonable."
        ],

        /* Su clasismo apunta al privilegio absurdo del propio mercader,
           no a grupos reales: presume precios, acceso y una exclusividad
           que claramente inventó para su mostrador. */
        random: [
            "¿Monedas? Qué folclor. Aquí se acepta transferencia inmediata.",
            "Con esa señal pareces conectado al Wi-Fi de una oficina pública.",
            "Mi minuto vale más que todo lo que llevas en el inventario.",
            "Si le pones ese empeño al trabajo, quizá subas de categoría.",
            "VIP cobra lo que quiere; el mercado agradece la visión.",
            "La austeridad es una estética difícil. Sobre todo cuando no es opcional.",
            "¡Deposítame y cómpralo YA! El estatus no espera."
        ],

        compra: [
            "Pago confirmado. Ahora sí conversamos a un nivel razonable.",
            "Llévatelo. Afuera está fuerte la cosa y este empaque sí tiene clase.",
            "Ese es mi cliente favorito. Soy VIP baby.",
            "¡Deposítame y cómpralo YA! Ah, ya pagaste. Excelente educación financiera."
        ],

        lleno: [
            "Ya andas full de eso. Hasta el exceso necesita buen gusto.",
            "¿Pa' qué más? Ya tienes inventario de miembro fundador."
        ],

        salida: [
            "Dale pues. Intenta volver con la ropa menos traumada.",
            "Nos vemos en la próxima sala, campeón. La categoría se trabaja.",
            "Si te matan, no me eches la culpa; mi póliza cubre vida, no prestigio."
        ],

        /* Al despertarlo a golpes de botón */
        dormido: [
            "¿Tú sabes quién soy? A un miembro fundador no lo despiertan sin cita.",
            "¡Epa! ¿Quién autorizó esta interrupción? Mi siesta es de nivel VIP."
        ],

        /* --- Según el desempeño en la zona anterior --- */

        /* Llegó con la vida por el piso */
        herido: [
            "Llegaste con el traje de combate hecho un coleto. Sin clase, pero vivo.",
            "Mi pana, ¿te agarraron de saco de boxeo? La presentación importa.",
            "¿Esa sangre es tuya o es un accesorio de supervivencia?"
        ],

        /* Terminó la zona intacto */
        impecable: [
            "Ni un rasguño. Ese sí es nivel VIP.",
            "Limpiecito. Casi pareces de mi círculo.",
            "Ok, respeto. Pero la excelencia también paga completo."
        ],

        /* Vino con la cartera llena */
        rico: [
            "¡Ajá! Por fin traes con qué. Habla claro.",
            "Ese billete te queda bien, mi pana. Es el mejor accesorio.",
            "Ahora sí conversamos como gente con acceso preferencial."
        ],

        /* Vino sin nada */
        arruinado: [
            "¿Viniste a mirar vitrinas? Esto no es museo; es membresía aspiracional.",
            "Sin real y con hambre. El mercado tiene un sentido del humor cruel.",
            "Con esa cartera el ascensor social está en mantenimiento. Qué tragedia estética."
        ],

        regateo: [
            "Bueno, te escucho. Una propuesta y procura que tenga categoría.",
            "Tienes un margen corto en esta visita. Habla rápido; mi agenda es exclusiva.",
            "Regatea, pero no confundas insistencia con carisma.",
            "A ver si tu argumento vale más que tu cartera. Dudo, pero sorpréndeme."
        ],

        regateoFallido: [
            "Con ese argumento no te regalo ni un recibo con membrete.",
            "No hay trato. La labia también cotiza en mercado VIP.",
            "Eso no fue regatear; fue pedir audiencia.",
            "Te dije que esto no era beneficencia. Es curaduría de suministros."
        ],

        fastidio: [
            "Ya estás forzando la conversación. No me hagas cerrar el mostrador premium.",
            "Otra vez con el regateo. Mi paciencia no tiene acceso general.",
            "Regatear no es una personalidad, mi pana.",
            "Cada intento que desperdicias baja la categoría de esta visita."
        ],

        sinRegateos: [
            "Se acabó el margen de esta visita. Ahora toca pagar como adulto funcional.",
            "Ya no negocio contigo en esta visita. La exclusividad tiene límites.",
            "Ni un intento más. Ve a generar liquidez y vuelve con actitud.",
            "No insistas: hoy la conversación terminó y el estatus se mantiene."
        ],

        premio: [
            "Mira tú. Por una vez tu labia alcanzó el estándar.",
            "No te emociones: fue argumento, no carisma.",
            "Te cayó algo. No lo conviertas en costumbre; el privilegio se dosifica.",
            "Hoy cerraste un trato. Mañana me pagas y subes de categoría."
        ]

    };


    /* Presentación de la primera visita: quién es, qué vende y por
       qué deberías tomártelo en serio. Se cuenta frase a frase. */
    const WELCOME = [
        "Epa. Baja el arma: aquí no se dispara y el piso es importado.",
        "Sr. de las Colinas. Dueño, gerente y único estándar de esta sala.",
        "Esto es la Sala VIP. Aquí no entra cualquiera... bueno, hoy hicimos una excepción.",
        "Mientras estés aquí nadie te toca. Zona neutral, servicio preferencial.",
        "Tengo armas, prototipos, munición, poderes y comida.",
        "Y el Taller: afina impacto, ciclo y control del arma que llevas.",
        "Ah, y seguros. Por si te da por morirte, que no combina con tu perfil.",
        "Se paga por adelantado; el estatus no acepta lástima.",
        "Usa las flechas; si no te alcanza, pide descuento o háblame de frente. No me hagas perder categoría."
    ];


    /* Cuando vuelves porque te mataron y tenías seguro */
    const MOCK_LINES = [
        "Jajaja. Te mataron. Menos mal que pagaste: la previsión también es estatus.",
        "Mira nada más. El seguro más rentable de mi catálogo premium.",
        "Tranquilo, a todos les pasa. A los que no leen la letra pequeña, sobre todo.",
        "Te devolví la vida. La dignidad se vende aparte y está agotada.",
        "¿Y ese es el que iba a salvar al país? Al menos vuelve con cobertura.",
        "Otro milagro del capitalismo. De nada; la factura llega luego."
    ];


    function pick(list) {
        return list[Math.floor(Math.random() * list.length)];
    }


    function rect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }


    /* Retrato entregado para el mercader. Conserva una escala única
       para todas sus expresiones y evita que la tarjeta invada la tienda. */
    function drawVendedorAsset(ctx, image, x, y, t) {

        if (!image || !(image.naturalWidth || image.width)) {
            return false;
        }

        const sourceW = image.naturalWidth || image.width;
        const sourceH = image.naturalHeight || image.height;
        /* El retrato de expresión es horizontal; una altura contenida lo
           mantiene dentro de la composición VIP sin invadir el panel. */
        const height = 158 + Math.sin(t * 1.6) * 2;
        const width = height * (sourceW / sourceH);

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.shadowColor = "rgba(251, 191, 36, 0.38)";
        ctx.shadowBlur = 16;
        ctx.drawImage(image, x - width / 2, y - height + 4, width, height);
        ctx.restore();

        return true;

    }


    /* Mientras el primer PNG termina de descargar, la Sala VIP muestra
       una tarjeta estable de sincronización en lugar del vendedor
       procedural antiguo. Así no hay un flash de dos versiones. */
    function drawVendedorLoading(ctx, x, y, t) {

        const pulse = 0.45 + Math.sin(t * 3.2) * 0.18;

        ctx.save();
        ctx.fillStyle = "rgba(6, 9, 16, 0.9)";
        ctx.fillRect(x - 67, y - 151, 134, 147);
        ctx.strokeStyle = "rgba(251, 191, 36, " + pulse.toFixed(3) + ")";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 66, y - 150, 132, 145);

        ctx.fillStyle = "rgba(251, 191, 36, 0.13)";
        ctx.beginPath();
        ctx.arc(x, y - 91, 34, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#FBBF24";
        ctx.beginPath();
        ctx.moveTo(x - 20, y - 85);
        ctx.lineTo(x - 8, y - 101);
        ctx.lineTo(x, y - 89);
        ctx.lineTo(x + 9, y - 105);
        ctx.lineTo(x + 20, y - 85);
        ctx.lineTo(x + 20, y - 78);
        ctx.lineTo(x - 20, y - 78);
        ctx.closePath();
        ctx.stroke();

        ctx.font = "700 8px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#FDE68A";
        ctx.fillText("RETRATO VIP", x, y - 38);
        ctx.fillStyle = "rgba(245, 247, 255, 0.48)";
        ctx.fillText("SINCRONIZANDO...", x, y - 23);
        ctx.restore();

    }


    /* ---------------------------------------------------------
       Sala VIP
       --------------------------------------------------------- */

    class Shop {

        constructor(stage, game) {

            this.stage = stage;
            this.game = game;

            this.tab = 0;
            this.cursor = 0;
            this.time = 0;
            this.done = false;

            /* Se duerme si lo dejas quieto; despertarlo a botonazos
               tiene consecuencias. */
            this.idle = 0;
            this.asleep = false;
            this.pokes = 0;

            /* Estado interno del regateo. Cada entrada a la Sala VIP renueva
               el margen de negociación y el ánimo del mercader, sin contador
               ni botón que convierta la conversación en un minijuego aparte. */
            this.merchantMood = "despreocupado";
            this.moodTimer = 0;
            this.lastMerchantImage = null;
            this.lastMerchantExpression = "despreocupado";

            game.haggleAttempts = HAGGLE_MAX_ATTEMPTS;
            game.haggleAnnoyance = 0;

            /* El retrato de entrada se pide antes del primer render. Los
               demás gestos se cargan según el diálogo para no congelar la
               transición VIP con una ráfaga de PNG. */
            if (A.assets && typeof A.assets.characterImageId === "function" &&
                typeof A.assets.preload === "function") {
                const firstPortrait = A.assets.characterImageId("colinas", "despreocupado");
                A.assets.preload([firstPortrait]);
            }

            /* Primera visita: presentación a ritmo de lectura. Cada línea
               espera ESPACIO o el botón táctil antes de pasar a la siguiente. */
            this.intro = game.shopVisits <= 1 ? 0 : -1;

            if (this.intro === 0) {

                this.message = WELCOME[0];
                this.messageTimer = Infinity;

            } else {

                this.message = this.greeting();
                this.messageTimer = 3600;

            }

            this.flash = 0;

            /* Cada cuánto suelta una frase suelta del repertorio */
            this.chatter = 7000 + Math.random() * 4000;

        }


        preloadMerchantExpression(expression) {

            if (!A.assets || typeof A.assets.characterImageId !== "function" ||
                typeof A.assets.preload !== "function") {
                return;
            }

            const id = A.assets.characterImageId("colinas", expression);

            if (id) {
                A.assets.preload([id]);
            }

        }


        setMerchantMood(mood, duration) {

            this.merchantMood = mood || "despreocupado";
            this.moodTimer = Math.max(0, duration || 0);
            this.preloadMerchantExpression(this.merchantMood);

        }


        merchantExpression() {

            if (this.asleep) {
                return "dormido";
            }

            if ((this.game.haggleAnnoyance || 0) >= 3) {
                return "molesto";
            }

            if (this.flash > 0) {
                return "feliz";
            }

            return this.merchantMood || "despreocupado";

        }


        say(message, duration, mood) {

            this.message = message;
            this.messageTimer = duration || 3000;

            if (mood) {
                this.setMerchantMood(mood, this.messageTimer);
            }

        }


        /* Saludo distinto según cómo llegó el jugador de la zona */
        greeting() {

            const game = this.game;

            const report = game.report || {};

            const ratio = game.health / game.maxHealth;
            const annoyance = game.haggleAnnoyance || 0;

            if (game.haggleAttempts <= 0) {
                this.setMerchantMood("molesto", 4200);
                return pick(LINES.sinRegateos);
            }

            if (annoyance >= 3) {
                this.setMerchantMood("molesto", 4200);
                return pick(LINES.fastidio);
            }

            if (annoyance >= 1) {
                this.setMerchantMood("serio", 3200);
            }

            /* La prioridad normal es: casi muerto > intacto > cartera */
            if (ratio <= 0.35) {
                return pick(LINES.herido);
            }

            if (report.flawless) {
                return pick(LINES.impecable);
            }

            if (game.money >= 300) {
                return pick(LINES.rico);
            }

            if (game.money < 40) {
                return pick(LINES.arruinado);
            }

            return pick(LINES.saludo);

        }


        /* Se llama al resucitar con el seguro */
        mock() {

            /* La burla manda sobre cualquier otro saludo */
            this.intro = -1;

            if (this.game && typeof this.game.syncNarrativeControl === "function") {
                this.game.syncNarrativeControl();
            }

            this.say(pick(MOCK_LINES), 5200, "molesto");

            this.flash = 400;

        }


        /* Avance explícito de la bienvenida. La última pulsación entrega
           el saludo normal; ninguna línea desaparece ni progresa por tiempo. */
        advanceIntro() {

            if (this.intro < 0) {
                return false;
            }

            this.idle = 0;

            if (this.intro < WELCOME.length - 1) {
                this.intro += 1;
                this.message = WELCOME[this.intro];
                this.messageTimer = Infinity;
            } else {
                this.intro = -1;
                this.say(this.greeting(), 3200);
            }

            if (this.game && typeof this.game.syncNarrativeControl === "function") {
                this.game.syncNarrativeControl();
            }

            A.audio.play("select");
            return true;

        }


        /* Escape conserva una salida deliberada para quien quiera ir directo
           al catálogo; no se llama desde flechas, compras ni toques comunes. */
        skipIntro() {

            if (this.intro < 0) {
                return false;
            }

            this.intro = -1;
            this.say(this.greeting(), 3000);

            if (this.game && typeof this.game.syncNarrativeControl === "function") {
                this.game.syncNarrativeControl();
            }

            A.audio.play("select");
            return true;

        }


        move(delta) {

            this.idle = 0;

            if (this.intro >= 0) {
                return;
            }

            if (this.poke()) {
                return;
            }

            const items = this.items();

            this.cursor = (this.cursor + delta + items.length) % items.length;

            A.audio.play("move");

        }


        /* Categoría activa y sus artículos */
        category() {
            return CATEGORIES[this.tab];
        }


        items() {
            return this.category().items;
        }


        current() {
            return this.items()[this.cursor];
        }


        /* El Taller cobra por el siguiente nivel del arma actualmente
           equipada. Toda la lectura pasa por aquí para que el precio, la
           etiqueta y el tope sean iguales en teclado, compra y render. */
        itemInfo(item) {

            const game = this.game;
            const info = {
                item,
                price: Math.max(0, Number(item && item.price) || 0),
                label: item && item.label || "ARTÍCULO",
                note: item && item.note || "",
                owned: false,
                completion: ""
            };

            if (!item || item.kind !== "weaponUpgrade") {
                return info;
            }

            const kind = game.weapon || "pistola";
            const max = Math.max(1, Math.floor(Number(item.max) || 3));
            const level = typeof game.weaponUpgradeLevel === "function"
                ? game.weaponUpgradeLevel(kind, item.upgrade)
                : 0;
            const profile = typeof game.weaponProfile === "function"
                ? game.weaponProfile(kind)
                : null;
            const weaponName = profile && (profile.short || profile.label)
                ? (profile.short || profile.label)
                : String(kind).toUpperCase();

            info.weapon = kind;
            info.level = Math.max(0, Math.min(max, Number(level) || 0));
            info.max = max;
            info.price = Math.round(info.price * (1 + info.level * 0.5));
            info.label += " · L" + info.level + "/" + max;
            info.note = weaponName + " · " + info.note;
            info.owned = info.level >= max;
            info.completion = info.owned ? "MAX" : "";

            return info;

        }


        itemPrice(item) {
            return this.itemInfo(item).price;
        }


        /* Cambia de pestaña con izquierda / derecha */
        moveTab(delta) {

            this.idle = 0;

            if (this.intro >= 0) {
                return;
            }

            if (this.poke()) {
                return;
            }

            this.tab = (this.tab + delta + CATEGORIES.length) % CATEGORIES.length;

            this.cursor = 0;

            A.audio.play("select");

        }


        /* ---------------------------------------------------------
           REGATEO IMPLÍCITO

           El regalo se evalúa al pedir descuento, al no poder pagar un
           artículo o al hablar con el Sr. de las Colinas. El margen de cada
           visita y el 20% de premio permanecen internos.
           --------------------------------------------------------- */

        haggleAvailable() {
            return this.game.haggleAttempts > 0;
        }


        haggleOutcome() {

            const roll = Math.random();

            /* 80% sin trato; el 20% restante reparte efectivo, objeto,
               seguro o CLAP. No se regalan armas ni módulos del Taller. */
            const giftStart = 1 - HAGGLE_GIFT_CHANCE;

            if (roll < giftStart) {
                return { kind: "empty", label: "SIN TRATO" };
            }

            if (roll < giftStart + 0.09) {
                const amount = 18 + Math.floor(Math.random() * 25);
                return { kind: "money", label: "$" + amount, amount };
            }

            if (roll < giftStart + 0.14) {
                return {
                    kind: "item",
                    label: "24 BALAS",
                    item: { kind: "ammo", ammo: "balas", amount: 24 }
                };
            }

            if (roll < giftStart + 0.17) {
                return {
                    kind: "item",
                    label: "AREPA +28",
                    item: { kind: "health", amount: 28 }
                };
            }

            if (roll < giftStart + 0.185) {
                /* Si ya tiene seguro, el regalo se transforma en efectivo
                   para que el intento nunca se desperdicie. */
                if (this.game.insurance) {
                    return { kind: "money", label: "$35", amount: 35 };
                }
                return {
                    kind: "item",
                    label: "SEGURO",
                    item: { kind: "insurance" }
                };
            }

            return {
                kind: "item",
                label: "1 CLAP",
                item: { kind: "clap" }
            };

        }


        askDiscount(reason) {
            return this.haggle(reason || "petición de descuento");
        }


        haggle(reason) {

            this.idle = 0;

            if (this.intro >= 0 || this.poke()) {
                return;
            }

            const game = this.game;
            const item = this.current();
            const itemInfo = this.itemInfo(item);
            this.lastHaggleReason = reason || "interacción";

            if (game.haggleAttempts <= 0) {
                game.haggleAnnoyance = Math.min(5, (game.haggleAnnoyance || 0) + 1);
                this.say(pick(LINES.sinRegateos), 3600, "molesto");
                A.audio.play("vacio");
                return;
            }

            if (itemInfo.owned) {
                this.say("Ese módulo ya está al máximo. No vendo humo dos veces.", 3000, "serio");
                A.audio.play("vacio");
                return;
            }

            if (game.money >= itemInfo.price) {
                this.say("Te alcanza para " + itemInfo.label + ". Compra o deja de actuar.", 3000, "serio");
                A.audio.play("vacio");
                return;
            }

            game.haggleAttempts -= 1;

            const reward = this.haggleOutcome();

            if (reward.kind === "empty") {
                game.haggleAnnoyance = Math.min(5, (game.haggleAnnoyance || 0) + 1);
                this.say(
                    pick(game.haggleAnnoyance >= 3 ? LINES.fastidio : LINES.regateoFallido),
                    3600,
                    "molesto"
                );
                A.audio.play("vacio");

            } else {
                let rewardLabel = reward.label;

                if (reward.kind === "money") {
                    /* La economía de OP404 usa el mismo perfil que los
                       fajos enemigos y la reserva de Sil. Los regalos de
                       objeto siguen siendo limitados: sólo se ajusta el
                       efectivo para que Fácil/Difícil no mezclen escalas. */
                    const multiplier = game.tuning && Number.isFinite(game.tuning.money)
                        ? game.tuning.money
                        : 1;
                    const amount = Math.max(1, Math.round(reward.amount * multiplier));

                    game.money += amount;
                    rewardLabel = "$" + amount;
                } else {
                    this.grant(reward.item);
                }

                game.haggleAnnoyance = Math.max(0, (game.haggleAnnoyance || 0) - 1);
                /* Frase solicitada para cada regalo/recompensa real del Sr.
                   de las Colinas: la conserva incluso si el premio se vuelve
                   efectivo por tener el objeto ya asegurado. */
                this.say("Jaja, come ahi tremendo pobre · " + rewardLabel, 3900, "feliz");
                this.flash = 420;
                A.audio.play("win");
            }

            game.updateStats();

        }


        /* Entrega el efecto de un artículo sin cobrarlo */
        grant(item) {

            const game = this.game;

            if (item.kind === "health") {

                game.health = Math.min(
                    game.maxHealth,
                    game.health + item.amount
                );

            } else if (item.kind === "full") {

                game.health = game.maxHealth;

            } else if (item.kind === "ammo") {

                game.ammo[item.ammo] = Math.min(
                    game.ammoMax(item.ammo),
                    game.ammo[item.ammo] + item.amount
                );

            } else if (item.kind === "weapon") {

                game.owned[item.weapon] = true;

                /* Un arma sin balas no sirve de nada */
                const feed = {
                    escopeta: ["cartuchos", 12],
                    ametralladora: ["balas", 60],
                    lanzapasticho: ["pastichos", 4],
                    riflepulso: ["celdas", 18],
                    criopasticho: ["celdas", 10],
                    rebotador: ["balas", 28]
                }[item.weapon];

                if (feed) {

                    game.ammo[feed[0]] = Math.min(
                        game.ammoMax(feed[0]),
                        game.ammo[feed[0]] + feed[1]
                    );

                }

            } else if (item.kind === "weaponUpgrade") {

                if (typeof game.upgradeWeapon === "function") {
                    game.upgradeWeapon(game.weapon || "pistola", item.upgrade);
                }

            } else if (item.kind === "furiaUnlock") {

                game.furiaUnlocked = true;

                /* Llega cargada: para que la estrenes */
                game.furiaCharge = game.furiaNeeded();

            } else if (item.kind === "furiaUp") {

                game.furiaLevel += 1;

            } else if (item.kind === "yanqui") {

                game.yanquis += 1;

            } else if (item.kind === "shield") {

                if (typeof game.grantShield === "function") {
                    game.grantShield(item.amount);
                }

            } else if (item.kind === "insurance") {

                game.insurance = true;

            } else if (item.kind === "clap") {

                game.claps += 1;

            }

        }


        /* Compra el artículo bajo el cursor */
        buy() {

            this.idle = 0;

            if (this.intro >= 0) {
                return;
            }

            if (this.poke()) {
                return;
            }

            const item = this.current();

            const game = this.game;
            const itemInfo = this.itemInfo(item);

            if (itemInfo.owned) {
                this.say(
                    item.kind === "weaponUpgrade"
                        ? "Ese ajuste ya está al máximo. El exceso no da categoría."
                        : "Eso ya está completo. No confundas inventario con estatus.",
                    3000,
                    "serio"
                );
                A.audio.play("vacio");
                return;
            }

            if (game.money < itemInfo.price) {

                /* Intentar comprar sin saldo ya es pedir descuento. Así el
                   regateo sigue siendo accesible sin un contador ni un botón
                   explícito en la Sala VIP. */
                this.askDiscount("saldo insuficiente para " + item.id);
                return;

            }

            /* Comprobación de topes antes de cobrar */
            if (item.kind === "health" || item.kind === "full") {

                if (game.health >= game.maxHealth) {

                    this.say(pick(LINES.lleno));

                    A.audio.play("vacio");

                    return;

                }

            }

            if (item.kind === "ammo") {

                const max = game.ammoMax(item.ammo);

                if (game.ammo[item.ammo] >= max) {

                    this.say(pick(LINES.lleno));

                    A.audio.play("vacio");

                    return;

                }

            }

            if (item.kind === "shield") {

                const maximum = Math.max(1, Number(game.shieldMax) || 100);

                if ((Number(game.shield) || 0) >= maximum) {

                    this.say("Ese blindaje ya está lleno. No vendo aire en empaque VIP.");
                    A.audio.play("vacio");
                    return;

                }

            }

            /* Las armas se compran una sola vez */
            if (item.kind === "weapon" && game.owned[item.weapon]) {

                this.say("Ya la tienes. ¿Quieres dos para presumir?");

                A.audio.play("vacio");

                return;

            }

            /* El seguro es de un solo uso: mientras esté activo no
               tiene sentido venderte otro. */
            if (item.kind === "insurance" && game.insurance) {

                this.say("Ya estás asegurado. Relájate... o no.");

                A.audio.play("vacio");

                return;

            }

            /* La Furia se desbloquea una vez; luego sólo se mejora */
            if (item.kind === "furiaUnlock" && game.furiaUnlocked) {

                this.say("La Furia ya es tuya. Ahora mejórala.");

                A.audio.play("vacio");

                return;

            }

            if (item.kind === "furiaUp" && !game.furiaUnlocked) {

                this.say("¿Mejorar qué? Primero compra la Furia.");

                A.audio.play("vacio");

                return;

            }

            game.money -= itemInfo.price;

            this.grant(item);

            this.flash = 320;

            /* La bolsa del CLAP se abre al momento: es su gracia */
            if (item.kind === "clap") {

                this.say("Suerte con esa bolsa, mi pana.", 2600, "feliz");

                A.audio.play("coin");

                game.updateStats();

                return;

            }

            if (item.kind === "weaponUpgrade") {
                const upgraded = this.itemInfo(item);
                this.say(
                    "Calibrado: " + upgraded.weapon.toUpperCase() + " ya tiene " +
                        item.label.toLowerCase() + ". No digas que no invierto en talento.",
                    3300,
                    "feliz"
                );
            } else {
                this.say(pick(LINES.compra), 2600, "feliz");
            }

            A.audio.play("coin");

            game.updateStats();

        }


        /* ---------------------------------------------------------
           Estado dormido

           Si lo dejas quieto un rato se duerme (es VIP, no tiene
           prisa). Insistir con el botón mientras duerme lo despierta
           de muy mal humor.
           --------------------------------------------------------- */

        poke() {

            if (!this.asleep) {
                return false;
            }

            this.pokes += 1;

            if (this.pokes >= 2) {

                this.asleep = false;
                this.idle = 0;
                this.pokes = 0;

                this.say(pick(LINES.dormido), 4200, "molesto");

                A.audio.play("grito");

            } else {

                this.say("Zzz... déjame quieto.", 1600, "molesto");

                A.audio.play("move");

            }

            return true;

        }


        pointer(x, y) {

            /* El propio mercader es la interacción: tocar/clicar su zona es
               hablarle. Si la cartera no llega, esa conversación activa el
               pedido de descuento sin exponer el número de intentos. */
            const atMerchant = x >= 58 && x <= 238 && y >= 82 && y <= 354;

            if (!atMerchant) {
                return false;
            }

            this.idle = 0;
            if (this.intro >= 0) {
                return this.advanceIntro();
            }
            if (this.poke()) {
                return true;
            }

            this.askDiscount("interacción con el Sr. de las Colinas");
            return true;

        }

        leave() {

            this.done = true;

            this.say(pick(LINES.salida));

            A.audio.play("start");

        }


        update(dt) {

            this.time += dt / 1000;

            if (this.messageTimer > 0) {
                this.messageTimer -= dt;
            }

            if (this.moodTimer > 0) {
                this.moodTimer -= dt;
                if (this.moodTimer <= 0 && !this.asleep &&
                    (this.game.haggleAnnoyance || 0) < 3) {
                    this.setMerchantMood("despreocupado");
                }
            }

            if (this.flash > 0) {
                this.flash -= dt;
            }

            /* La bienvenida se mantiene fija hasta que el jugador avance.
               Mientras lee, el mercader no se duerme ni pisa la línea con
               frases ambientales. */
            if (this.intro >= 0) {
                this.idle = 0;
                return;
            }

            /* Se aburre y se duerme */
            this.idle += dt;

            if (!this.asleep && this.idle > 11000) {

                this.asleep = true;
                this.pokes = 0;

                this.say("Zzz...", 2400, "dormido");

            }

            /* Mientras está despierto suelta frases del repertorio */
            if (!this.asleep) {

                this.chatter -= dt;

                if (this.chatter <= 0) {

                    this.chatter = 8000 + Math.random() * 5000;

                    if (this.messageTimer <= 0) {
                        const fedUp = (this.game.haggleAnnoyance || 0) >= 3;
                        this.say(
                            pick(fedUp ? LINES.fastidio : LINES.random),
                            3400,
                            fedUp ? "molesto" : "despreocupado"
                        );
                    }

                }

            }

        }


        merchantImage() {

            if (!A.assets || typeof A.assets.characterImageId !== "function") {
                return this.lastMerchantImage;
            }

            const expression = this.merchantExpression();
            const imageId = A.assets.characterImageId("colinas", expression);
            const nextImage = A.assets.readyImage(imageId);

            /* Durante el cambio de gesto se conserva el último retrato
               listo. El fallback sólo puede ser la tarjeta VIP estable. */
            if (nextImage && (nextImage.naturalWidth || nextImage.width)) {
                this.lastMerchantImage = nextImage;
                this.lastMerchantExpression = expression;
            }

            return this.lastMerchantImage;

        }


        render() {

            const { ctx } = this.stage;

            const game = this.game;

            ctx.save();

            ctx.imageSmoothingEnabled = false;

            /* --- Sala: alfombra roja y paredes doradas --- */
            const pared = ctx.createLinearGradient(0, 0, 0, HEIGHT);

            pared.addColorStop(0, "#241A0B");
            pared.addColorStop(1, "#120C05");

            ctx.fillStyle = pared;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            /* Columnas */
            for (let i = 0; i < 5; i += 1) {

                const x = 18 + i * 150;

                rect(ctx, x, 20, 16, 250, "#2E220F");
                rect(ctx, x + 2, 20, 5, 250, "#3D2E15");

            }

            /* Cordón VIP */
            rect(ctx, 0, 268, WIDTH, 4, "#7C2D12");

            /* Suelo alfombrado */
            const suelo = ctx.createLinearGradient(0, 272, 0, HEIGHT);

            suelo.addColorStop(0, "#7F1D1D");
            suelo.addColorStop(1, "#3F0D0D");

            ctx.fillStyle = suelo;
            ctx.fillRect(0, 272, WIDTH, HEIGHT - 272);

            /* Letrero SALA VIP */
            ctx.font = "700 22px 'Orbitron', 'JetBrains Mono', monospace";
            ctx.textAlign = "center";

            ctx.fillStyle = "rgba(251, 191, 36, 0.2)";
            ctx.fillText("SALA VIP", 320, 46);

            ctx.fillStyle = "#FBBF24";
            ctx.fillText("SALA VIP", 320, 44);

            ctx.font = "500 10px 'JetBrains Mono', monospace";
            ctx.fillStyle = "rgba(245, 247, 255, 0.55)";
            ctx.fillText("PROGRESO GUARDADO · ZONA " + (game.levelIndex + 1), 320, 62);

            ctx.textAlign = "left";

            /* --- Vendedor --- */
            if (!drawVendedorAsset(ctx, this.merchantImage(), 148, 300, this.time)) {
                drawVendedorLoading(ctx, 148, 300, this.time);
            }

            /* Nombre bajo el personaje */
            ctx.textAlign = "center";
            ctx.font = "700 11px 'JetBrains Mono', monospace";
            ctx.fillStyle = "#FDE68A";
            ctx.fillText("SR. DE LAS COLINAS", 148, 336);

            ctx.font = "500 9px 'JetBrains Mono', monospace";
            ctx.fillStyle = "rgba(245, 247, 255, 0.5)";
            ctx.fillText("MERCADER VIP", 148, 348);
            ctx.textAlign = "left";

            /* --- Bocadillo --- */
            if (this.messageTimer > 0) {

                this.drawBubble(ctx, this.message);

            }

            /* --- Mostrador --- */
            this.drawStock(ctx, game);

            /* --- Cartera; el regateo ocurre al conversar o intentar pagar --- */
            this.drawWallet(ctx, game);

            /* Destello al comprar */
            if (this.flash > 0) {

                ctx.fillStyle = "rgba(251, 191, 36, " +
                    (this.flash / 320 * 0.22).toFixed(3) + ")";

                ctx.fillRect(0, 0, WIDTH, HEIGHT);

            }

            /* Ayuda */
            ctx.font = "500 10px 'JetBrains Mono', monospace";
            ctx.fillStyle = "rgba(245, 247, 255, 0.5)";
            ctx.textAlign = "center";

            const hint = this.intro >= 0
                ? "ESPACIO / TOCAR · SIGUIENTE MENSAJE · ESC · SALTAR PRESENTACIÓN"
                : "← → CATEGORÍA · ↑ ↓ ELEGIR · ENTER COMPRAR · R PEDIR DESCUENTO · ESPACIO SALIR";
            ctx.fillText(hint, 320, HEIGHT - 10);

            ctx.textAlign = "left";

            ctx.restore();

        }


        drawBubble(ctx, text) {

            /* El bocadillo va bajo el vendedor, en su columna, para no
               taparse con el catálogo de la derecha. El gesto activo entra
               en el propio diálogo: su texto y su variante se leen juntos. */
            const portrait = this.merchantImage();
            const hasPortrait = portrait && (portrait.naturalWidth || portrait.width);
            const expression = this.lastMerchantExpression || this.merchantExpression();
            const labels = {
                despreocupado: "RELAJADO",
                serio: "SERIO",
                feliz: "FELIZ",
                molesto: "MOLESTO",
                dormido: "DORMIDO"
            };
            const variant = labels[expression] || String(expression).toUpperCase();
            const variantText = "VARIANTE · " + variant;

            ctx.font = "700 6px 'JetBrains Mono', monospace";
            const variantWidth = ctx.measureText(variantText).width;
            ctx.font = "500 10px 'JetBrains Mono', monospace";

            const maxW = 274;
            const textInset = hasPortrait ? 66 : 11;
            const lineLimit = maxW - textInset - 11;

            /* Se parte en varias líneas si hace falta */
            const words = text.split(" ");
            const lines = [];

            let current = "";

            words.forEach((word) => {

                const test = current ? current + " " + word : word;

                if (ctx.measureText(test).width > lineLimit && current) {

                    lines.push(current);
                    current = word;

                } else {

                    current = test;

                }

            });

            if (current) {
                lines.push(current);
            }

            const longest = Math.max.apply(null, lines.map((line) => ctx.measureText(line).width));
            const w = Math.min(
                maxW,
                Math.max(
                    hasPortrait ? 122 : 80,
                    longest + textInset + 11,
                    variantWidth + textInset + 11
                )
            );
            const h = Math.max(hasPortrait ? 58 : 0, 25 + lines.length * 13);

            const x = 14;
            const y = HEIGHT - 74 - h;

            ctx.fillStyle = "rgba(8, 12, 20, 0.94)";
            ctx.fillRect(x, y, w, h);

            ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

            /* Rabito hacia arriba, hacia el vendedor */
            ctx.fillStyle = "rgba(8, 12, 20, 0.94)";
            ctx.beginPath();
            ctx.moveTo(x + Math.min(108, w - 38), y);
            ctx.lineTo(x + Math.min(124, w - 22), y - 11);
            ctx.lineTo(x + Math.min(132, w - 14), y);
            ctx.closePath();
            ctx.fill();

            if (hasPortrait) {
                const cardX = x + 6;
                const cardY = y + 5;
                const cardW = 48;
                const cardH = h - 10;
                const sourceW = portrait.naturalWidth || portrait.width;
                const sourceH = portrait.naturalHeight || portrait.height;
                const scale = Math.min(42 / sourceW, 33 / sourceH);
                const drawW = sourceW * scale;
                const drawH = sourceH * scale;

                ctx.fillStyle = "rgba(251, 191, 36, 0.12)";
                ctx.fillRect(cardX, cardY, cardW, cardH);
                ctx.strokeStyle = "rgba(251, 191, 36, 0.42)";
                ctx.strokeRect(cardX + 0.5, cardY + 0.5, cardW - 1, cardH - 1);
                ctx.drawImage(
                    portrait,
                    cardX + cardW / 2 - drawW / 2,
                    cardY + 3 + Math.max(0, (cardH - 14 - drawH) / 2),
                    drawW,
                    drawH
                );
                ctx.textAlign = "center";
                ctx.font = "700 6px 'JetBrains Mono', monospace";
                ctx.fillStyle = "#FDE68A";
                ctx.fillText(variant, cardX + cardW / 2, cardY + cardH - 4);
                ctx.textAlign = "left";
                ctx.font = "500 10px 'JetBrains Mono', monospace";
            }

            /* La variante también se escribe junto al diálogo, incluso si
               el PNG aún está cargando y sólo se muestra la tarjeta VIP. */
            ctx.font = "700 6px 'JetBrains Mono', monospace";
            ctx.fillStyle = "#FDE68A";
            ctx.fillText(variantText, x + textInset, y + 10);

            ctx.font = "500 10px 'JetBrains Mono', monospace";
            ctx.fillStyle = "#F5F7FF";

            lines.forEach((line, i) => {
                ctx.fillText(line, x + textInset, y + 25 + i * 13);
            });

        }


        drawStock(ctx, game) {

            const x = 300;
            const y = 62;
            const w = 316;

            const rowH = 30;

            /* Alto fijo: caben las 3 filas de la categoría más
               larga sin invadir la cartera. */
            const maxRows = CATEGORIES.reduce(
                (max, cat) => Math.max(max, cat.items.length),
                0
            );

            const h = 54 + maxRows * rowH + 8;

            ctx.fillStyle = "rgba(6, 9, 16, 0.9)";
            ctx.fillRect(x, y, w, h);

            const category = this.category();

            ctx.strokeStyle = "rgba(251, 191, 36, 0.35)";
            ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

            /* --- Pestañas de categoría --- */
            const tabW = w / CATEGORIES.length;

            CATEGORIES.forEach((cat, i) => {

                const tx = x + i * tabW;

                const active = i === this.tab;

                ctx.fillStyle = active
                    ? "rgba(251, 191, 36, 0.18)"
                    : "rgba(255, 255, 255, 0.03)";

                ctx.fillRect(tx, y, tabW, 24);

                if (active) {

                    ctx.fillStyle = cat.color;
                    ctx.fillRect(tx, y + 22, tabW, 2);

                }

                ctx.font = CATEGORIES.length > 6
                    ? "700 7px 'JetBrains Mono', monospace"
                    : "700 9px 'JetBrains Mono', monospace";
                ctx.textAlign = "center";

                ctx.fillStyle = active
                    ? cat.color
                    : "rgba(245, 247, 255, 0.38)";

                ctx.fillText(cat.label, tx + tabW / 2, y + 16);

                ctx.textAlign = "left";

            });

            /* Flechas de navegación entre pestañas */
            ctx.font = "700 10px 'JetBrains Mono', monospace";
            ctx.fillStyle = "rgba(245, 247, 255, 0.3)";
            ctx.fillText("←", x + 4, y + 40);
            ctx.textAlign = "right";
            ctx.fillText("→", x + w - 4, y + 40);
            ctx.textAlign = "left";

            /* --- Artículos de la categoría activa --- */
            category.items.forEach((item, i) => {

                const iy = y + 48 + i * rowH;

                const active = i === this.cursor;
                const itemInfo = this.itemInfo(item);

                const afford = game.money >= itemInfo.price;

                /* ¿Ya lo tiene o el módulo llegó a su tope? */
                const ownedWeapon = item.kind === "weapon"
                    && game.owned[item.weapon];

                const ownedFuria = item.kind === "furiaUnlock"
                    && game.furiaUnlocked;

                const owned = itemInfo.owned || ownedWeapon || ownedFuria;

                if (active) {

                    ctx.fillStyle = "rgba(251, 191, 36, 0.16)";
                    ctx.fillRect(x + 6, iy - 2, w - 12, rowH - 4);

                    ctx.fillStyle = category.color;
                    ctx.fillRect(x + 6, iy - 2, 3, rowH - 4);

                }

                ctx.font = "600 11px 'JetBrains Mono', monospace";

                ctx.fillStyle = owned
                    ? "rgba(163, 230, 53, 0.55)"
                    : (afford
                        ? (active ? "#FDE68A" : "#E8EDF7")
                        : "rgba(245, 247, 255, 0.32)");

                ctx.fillText(itemInfo.label, x + 16, iy + 10);

                ctx.font = "500 8px 'JetBrains Mono', monospace";
                ctx.fillStyle = "rgba(245, 247, 255, 0.45)";
                ctx.fillText(itemInfo.note, x + 16, iy + 21);

                /* Precio, o el sello de comprado */
                ctx.textAlign = "right";

                if (owned) {

                    ctx.font = "700 10px 'JetBrains Mono', monospace";
                    ctx.fillStyle = "#A3E635";
                    ctx.fillText(itemInfo.completion || "COMPRADO", x + w - 14, iy + 14);

                } else {

                    ctx.font = "700 12px 'JetBrains Mono', monospace";
                    ctx.fillStyle = afford ? "#A3E635" : "#F43F5E";
                    ctx.fillText("$" + itemInfo.price, x + w - 14, iy + 14);

                }

                ctx.textAlign = "left";

            });

            /* Nivel de Furia, que es lo único acumulativo fuera del Taller. */
            if (category.id === "poderes" && game.furiaUnlocked) {

                ctx.font = "500 8px 'JetBrains Mono', monospace";
                ctx.fillStyle = "rgba(244, 63, 94, 0.75)";

                ctx.fillText(
                    "FURIA NIVEL " + game.furiaLevel +
                    " · " + (game.furiaDuration() / 1000).toFixed(1) + "s",
                    x + 16,
                    y + h - 8
                );

            } else if (category.id === "taller") {

                const weapon = typeof game.weaponProfile === "function"
                    ? game.weaponProfile(game.weapon || "pistola")
                    : null;
                const label = weapon && (weapon.label || weapon.short)
                    ? (weapon.label || weapon.short)
                    : String(game.weapon || "pistola").toUpperCase();
                const mods = weapon && weapon.upgrades
                    ? "I" + weapon.upgrades.impact + " C" + weapon.upgrades.cycle +
                        " E" + weapon.upgrades.control
                    : "I0 C0 E0";

                ctx.font = "500 8px 'JetBrains Mono', monospace";
                ctx.fillStyle = "rgba(196, 181, 253, 0.86)";
                ctx.fillText("BANCO · " + label + " · " + mods, x + 16, y + h - 8);

            }

        }


        drawWallet(ctx, game) {

            const x = 300;
            const y = 274;

            ctx.fillStyle = "rgba(6, 9, 16, 0.88)";
            ctx.fillRect(x, y, 316, 40);

            ctx.strokeStyle = "rgba(163, 230, 53, 0.35)";
            ctx.strokeRect(x + 0.5, y + 0.5, 315, 39);

            /* Icono de billete */
            rect(ctx, x + 12, y + 14, 22, 13, "#166534");
            rect(ctx, x + 14, y + 16, 18, 9, "#22C55E");
            rect(ctx, x + 21, y + 18, 4, 5, "#166534");

            ctx.font = "700 16px 'JetBrains Mono', monospace";
            ctx.fillStyle = "#A3E635";
            ctx.fillText("$" + game.money, x + 44, y + 26);

            /* Estado del agente */
            ctx.font = "500 10px 'JetBrains Mono', monospace";
            ctx.fillStyle = "rgba(245, 247, 255, 0.6)";
            ctx.textAlign = "right";

            ctx.fillText(
                "VIDA " + Math.round(game.health) + "/" + game.maxHealth,
                x + 304,
                y + 18
            );

            /* Aviso de que el seguro está activo */
            if (game.insurance) {

                ctx.textAlign = "left";
                ctx.font = "700 9px 'JetBrains Mono', monospace";
                ctx.fillStyle = "#38BDF8";
                ctx.fillText("● ASEGURADO", x + 44, y + 34);
                ctx.textAlign = "right";

            }

            ctx.fillText(
                "BALAS " + game.ammo.balas +
                "  CART " + game.ammo.cartuchos +
                "  PAST " + game.ammo.pastichos + "  CEL " + (game.ammo.celdas || 0),
                x + 304,
                y + 32
            );

            ctx.textAlign = "left";

        }

    }


    A.op404 = A.op404 || {};

    A.op404.Shop = Shop;

    A.op404.SHOP_STOCK = STOCK;
    A.op404.SHOP_HAGGLE_MAX_ATTEMPTS = HAGGLE_MAX_ATTEMPTS;

})(window.Arcade404);
