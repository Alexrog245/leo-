/* =========================================================
   ARCADE 404 — SALA VIP CENTRAL
   Escena social persistente: el Sr. de las Colinas recibe, el equipo ocupa
   la sala y cada personaje abre su propio menú. La economía sigue viviendo
   en A.vip; esta capa sólo representa y orquesta la interacción.
   ========================================================= */

(function (A) {

    "use strict";


    let root = null;
    let balanceNode = null;
    let messageNode = null;
    let unlisten = null;
    let reception = "normal";
    let introOpen = false;
    let introIndex = 0;
    let introResume = null;
    let activeMenu = null;
    let activeMode = "merchant";
    let releasedMenu = null;
    let menuResponse = null;
    let triviaFeedback = null;
    let loungeMotionTimer = null;
    let loungeMotionFrame = null;
    let loungeMotionStep = 0;
    let unlistenRoute = null;


    /* Conserva el orden visual del elenco de HOME; Colinas abre su mesa
       desde su propio asiento, sin desplazar la composición reconocible. */
    const DISPLAY_ORDER = ["desire", "davinchi", "rog", "colinas", "sil"];
    const LOUNGE_ACTIVITY_ORDER = ["desire", "davinchi", "rog", "sil", "colinas"];
    const LOUNGE_ACTIVITY_DELAY = 3400;

    const WELCOME = {
        normal: "Pasa, ponte cómodo. Esta es la sala donde una buena partida se convierte en apoyo y una red que responde.",
        colinas: "Ah, viniste directamente por mí. Ponte cómodo: aquí convertimos tus FICHAS VIP en un plan antes de cruzar la siguiente puerta."
    };

    /* Seis planos breves: Colinas recibe y los demás se suman, uno a uno,
       explicando la parte del sistema que realmente controlan. */
    const INTRO_SCENES = [
        {
            speaker: "colinas",
            expression: "feliz",
            joined: 0,
            arrival: "colinas",
            eyebrow: "SALA VIP // PISO 404",
            text: "Bienvenido. Esta sala es para llegar preparado, no para rellenar otra cola absurda. Aquí tus FICHAS VIP sí tienen destino."
        },
        {
            speaker: "desire",
            expression: "feliz",
            joined: 1,
            arrival: "desire",
            eyebrow: "DESIRE // LUZ Y ÁNIMO",
            text: "Cada partida convierte tu score en FICHAS, amor. Ganar deja un poco más, pero incluso el primer intento sin puntos te ayuda a empezar desde cero."
        },
        {
            speaker: "davinchi",
            expression: "emocionado",
            joined: 2,
            arrival: "davinchi",
            eyebrow: "DAVINCHI // SISTEMAS",
            text: "OPERACIÓN 404 y TURNO 404 están abiertos mientras afinamos sus sistemas, yeah. Guarda las fichas para suministros y vínculos que sí cambian cómo entras."
        },
        {
            speaker: "rog",
            expression: "serio",
            joined: 3,
            arrival: "rog",
            eyebrow: "ROG // RESPALDO",
            text: "Antes de entrar puedes preparar suministros. Se guardan y se aplican al siguiente intento compatible; menos improvisación cuando todo se ponga raro."
        },
        {
            speaker: "sil",
            expression: "despreocupada",
            joined: 4,
            arrival: "sil",
            eyebrow: "SIL // DATOS Y SEÑAL",
            text: "Y nosotros no somos decoración. Elige un canal, juega con esa persona y usa su objeto favorito: la afinidad abre apoyos más fuertes."
        },
        {
            speaker: "colinas",
            expression: "despreocupado",
            joined: 4,
            arrival: "colinas",
            eyebrow: "SR. DE LAS COLINAS // ANFITRIÓN",
            text: "En resumen: juega, prepara y forma equipo. Ahora sí, revisa la sala con calma. Una experiencia exclusiva no debería ser confusa."
        }
    ];

    const BOND_REWARDS = {
        1: "Canal abierto, diálogo y apoyo base.",
        2: "Confianza: Companion con 1 impulso de foco.",
        3: "Sincronía: bonus de campaña reforzado.",
        4: "Vínculo: marco neón y 2 impulsos Companion.",
        5: "Leyenda: señal completa y apoyo máximo."
    };

    const TRIVIA_REACTIONS = {
        desire: { correct: "Lo escuchaste, amor. Guardemos esa luz para la siguiente ronda.", wrong: "Casi, amor. Vuelve a la idea que acabamos de compartir." },
        davinchi: { correct: "Exacto, yeah. La señal quedó perfectamente sincronizada.", wrong: "No va por ahí, yeah. Revisa el ritmo del bloque anterior." },
        rog: { correct: "Correcto. Leer la ruta antes de moverse siempre deja una salida.", wrong: "No. Si pierdes ese dato, la ruta se cierra antes de tiempo." },
        sil: { correct: "Dato confirmado. Esa lectura sí merece pasar a la siguiente capa.", wrong: "Esa era interferencia. Revisa qué dato repetimos antes de decidir." },
        colinas: { correct: "Bien. Un invitado que escucha evita errores costosos de logística.", wrong: "No exactamente. Hasta el lujo necesita recordar el detalle correcto." }
    };

    const MEMBER_EXPRESSIONS = {
        desire: { neutral: "seria", happy: "feliz", excited: "emocionada", stressed: "nerviosa" },
        davinchi: { neutral: "serio", happy: "feliz", excited: "emocionado", stressed: "nervioso" },
        rog: { neutral: "serio", happy: "feliz", excited: "emocionado", stressed: "nervioso" },
        sil: { neutral: "seria", happy: "feliz", excited: "emocionada", stressed: "nerviosa" },
        colinas: { neutral: "serio", happy: "feliz", excited: "emocionado", stressed: "molesto" }
    };

    const MEMBER_DIALOGUE = {
        desire: {
            locked: "Cuando estés lista, amor, abrimos el canal y buscamos una forma de que el próximo turno pese menos.",
            ready: "Estoy aquí, amor. Un detalle bonito y unas partidas juntas hacen que la señal llegue más lejos.",
            selected: "Voy contigo, amor. Si todo se pone oscuro, te devuelvo un poco de luz."
        },
        davinchi: {
            locked: "El canal está apagado, pero nada que una conexión decente no arregle, yeah.",
            ready: "Tengo los sistemas listos, yeah. Un regalo al canal y afinamos la respuesta para la próxima ruta.",
            selected: "Estoy en tu frecuencia, yeah. Ductos, munición y ritmo: todo sincronizado."
        },
        rog: {
            locked: "No hace falta correr para abrir un canal. Cuando tengas recursos, lo hacemos con una salida clara.",
            ready: "Puedo acompañarte. Solo quiero revisar la ruta, el suministro y una salida antes de entrar.",
            selected: "Estoy contigo. Llevo el respaldo; tú conserva la ruta y no gastes el último recurso."
        },
        sil: {
            locked: "El canal existe; falta una inversión mínima para que deje de ser sólo ruido.",
            ready: "Los datos ya señalan el siguiente vínculo. Un objeto correcto vale más que una compra al azar.",
            selected: "Canal estable. Yo leo la señal; tú decide qué dato convertir en movimiento."
        },
        colinas: {
            locked: "La mesa está abierta, pero un buen contacto siempre requiere una ficha de presentación.",
            ready: "Pasa por la mesa cuando quieras: reservas, apoyo y un poco de criterio logístico.",
            selected: "Te acompaño desde el canal preferente. La eficiencia también puede tener buen gusto."
        }
    };


    function number(value) {
        const safe = Math.max(0, Number(value) || 0);

        try {
            return typeof Intl !== "undefined" && Intl.NumberFormat
                ? new Intl.NumberFormat("es-VE").format(safe)
                : String(safe);
        } catch (error) {
            return String(safe);
        }
    }


    function imageUrl(id) {
        if (!id || !A.assets || typeof A.assets.url !== "function") {
            return "";
        }

        return A.assets.url(id);
    }


    function expressionUrl(companion, expression) {
        if (!companion) {
            return "";
        }

        if (A.assets && typeof A.assets.characterImageId === "function") {
            const expressionId = A.assets.characterImageId(companion.id, expression || "full");
            const expressionSource = imageUrl(expressionId);

            if (expressionSource) {
                return expressionSource;
            }
        }

        return imageUrl(companion.portrait);
    }


    function expressionFor(companion, mood) {
        const expressions = companion && MEMBER_EXPRESSIONS[companion.id];

        return expressions && expressions[mood] ? expressions[mood] : "full";
    }


    function orderedCompanions(state) {
        const known = DISPLAY_ORDER.filter((id) => state.companions[id]);
        const extras = Object.keys(state.companions).filter((id) => known.indexOf(id) === -1);

        return known.concat(extras).map((id) => state.companions[id]);
    }


    function firstIntroPending() {
        return !A.vip || typeof A.vip.hasSeenVipIntro !== "function"
            ? true
            : !A.vip.hasSeenVipIntro();
    }


    /* El personaje activo abandona su hueco visual porque pasa al primer
       plano del menú. Al cambiar o cerrar, `releasedMenu` anima su regreso
       mientras el nuevo foco ocupa el centro de la conversación. */
    function setMenu(id, mode, preserveTriviaFeedback) {
        const next = id || null;

        if (activeMenu && activeMenu !== next) {
            releasedMenu = activeMenu;
        } else if (!next && activeMenu) {
            releasedMenu = activeMenu;
        } else if (next && activeMenu === next) {
            releasedMenu = null;
        }

        activeMenu = next;
        activeMode = mode || (next === "colinas" ? "merchant" : "bond");

        if (!preserveTriviaFeedback) {
            triviaFeedback = null;
        }
    }


    /* Un solo integrante recibe un pequeño gesto cada pocos segundos. El
       movimiento vive sobre la ilustración, nunca sobre su botón: así no se
       mueven los blancos táctiles ni se rompe el orden de la sala. */
    function stopLoungeMotion() {
        if (loungeMotionTimer !== null && typeof window.clearTimeout === "function") {
            window.clearTimeout(loungeMotionTimer);
        }
        if (loungeMotionFrame !== null && typeof window.cancelAnimationFrame === "function") {
            window.cancelAnimationFrame(loungeMotionFrame);
        }
        loungeMotionTimer = null;
        loungeMotionFrame = null;
    }


    function canAnimateLounge() {
        if (introOpen || !root || typeof root.querySelectorAll !== "function") return false;
        if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return false;
        }
        const screen = typeof root.closest === "function" ? root.closest(".screen") : null;
        return !screen || !screen.hidden;
    }


    function rotateLoungeMotion() {
        loungeMotionTimer = null;
        loungeMotionFrame = null;
        if (!canAnimateLounge()) return;

        const members = Array.from(root.querySelectorAll(".vip-scene__character"));
        if (!members.length) return;

        members.forEach((member) => member.classList.remove("is-lounge-beat"));
        const available = members.filter((member) => (
            !member.classList.contains("is-in-dialogue") &&
            !member.classList.contains("is-returning") &&
            !member.classList.contains("is-locked") &&
            !member.classList.contains("is-active")
        ));
        if (!available.length) return;

        const nextId = LOUNGE_ACTIVITY_ORDER[loungeMotionStep % LOUNGE_ACTIVITY_ORDER.length];
        loungeMotionStep += 1;
        const member = available.find((item) => item.dataset.vipId === nextId) || available[0];
        member.classList.add("is-lounge-beat");

        const scene = root.querySelector(".vip-scene");
        if (scene && scene.dataset) scene.dataset.loungeActivity = member.dataset.vipId || "";

        if (typeof window.setTimeout === "function") {
            loungeMotionTimer = window.setTimeout(rotateLoungeMotion, LOUNGE_ACTIVITY_DELAY);
        }
    }


    function scheduleLoungeMotion() {
        stopLoungeMotion();
        if (!canAnimateLounge()) return;

        if (typeof window.requestAnimationFrame === "function") {
            loungeMotionFrame = window.requestAnimationFrame(rotateLoungeMotion);
            return;
        }
        rotateLoungeMotion();
    }


    function beginIntroduction() {
        introResume = { menu: activeMenu, mode: activeMode };
        introOpen = true;
        introIndex = 0;
    }


    function activeSpeech(companion) {
        if (menuResponse && menuResponse.id === companion.id) {
            return menuResponse;
        }

        const lines = MEMBER_DIALOGUE[companion.id] || MEMBER_DIALOGUE.rog;
        const state = !companion.unlocked
            ? "locked"
            : companion.selected
                ? "selected"
                : "ready";

        return {
            id: companion.id,
            expression: expressionFor(companion, companion.selected ? "happy" : "neutral"),
            label: companion.selected ? "CANAL ACTIVO" : "EN LA SALA",
            text: lines[state]
        };
    }


    function merchantResponse(action, id, outcome, state) {
        const item = state.itemCatalog[id];
        const ticket = state.ticketCatalog[id];

        if (action === "preview-stipend") {
            return {
                id: "colinas",
                expression: expressionFor(state.companions.colinas, outcome && outcome.ok ? "excited" : "stressed"),
                label: outcome && outcome.ok ? "VALE DE CALIBRACIÓN EMITIDO" : "VALE YA CERRADO",
                text: outcome && outcome.ok
                    ? "Este lote es sólo para revisar la tienda con calma. Jaja, come ahi tremendo pobre"
                    : (outcome && outcome.message) || "Ese vale ya no está disponible en este perfil."
            };
        }

        if (action === "ticket" && outcome && outcome.code === "tickets-disabled") {
            return {
                id: "colinas",
                expression: expressionFor(state.companions.colinas, "happy"),
                label: "ACCESO ABIERTO",
                text: outcome.message
            };
        }

        if (!outcome || !outcome.ok) {
            const target = ticket ? ticket.name : item ? item.name : "esa solicitud";
            return {
                id: "colinas",
                expression: expressionFor(state.companions.colinas, "stressed"),
                label: "CAJA EN REVISIÓN",
                text: `Para ${target} todavía faltan FICHAS VIP. Juega una ronda, vuelve con saldo y lo resolvemos sin dramas administrativos.`
            };
        }

        if (action === "ticket") {
            return {
                id: "colinas",
                expression: expressionFor(state.companions.colinas, "happy"),
                label: "PASE EMITIDO",
                text: `${ticket.name} ya tiene su entrada. Guárdala: se descuenta sólo cuando decidas iniciar, como debe ser.`
            };
        }

        if (action === "item") {
            return {
                id: "colinas",
                expression: expressionFor(state.companions.colinas, "excited"),
                label: "RESERVA PREPARADA",
                text: `${item.name} queda en la mesa de salida. Úsalo en el próximo ingreso compatible y no lo desperdicies por ansiedad.`
            };
        }

        return activeSpeech(state.companions.colinas);
    }


    function companionResponse(action, companion, outcome) {
        const name = companion.name;
        const lines = MEMBER_DIALOGUE[companion.id] || MEMBER_DIALOGUE.rog;

        if (!outcome || !outcome.ok) {
            return {
                id: companion.id,
                expression: expressionFor(companion, "stressed"),
                label: "SEÑAL INCOMPLETA",
                text: `${lines.locked} Todavía no alcanza el saldo para ese movimiento.`
            };
        }

        if (action === "unlock") {
            return {
                id: companion.id,
                expression: expressionFor(companion, "happy"),
                label: "CANAL HABILITADO",
                text: `${name} ya está en línea. El vínculo empieza con un apoyo base y crece cada vez que juegan juntos.`
            };
        }

        if (action === "equip") {
            return {
                id: companion.id,
                expression: expressionFor(companion, "excited"),
                label: "COMPAÑERO ASIGNADO",
                text: lines.selected
            };
        }

        if (action === "gift") {
            return {
                id: companion.id,
                expression: expressionFor(companion, "happy"),
                label: outcome.leveledUp ? "NUEVO NIVEL DE VÍNCULO" : "AFINIDAD RECIBIDA",
                text: outcome.leveledUp
                    ? `${name} subió de nivel. Su apoyo ya pesa más dentro de las campañas.`
                    : `${companion.favorite.name} llegó al canal. La afinidad sube y la próxima respuesta será más fuerte.`
            };
        }

        return activeSpeech(companion);
    }


    function ticketCard(ticket, current) {
        const enough = current.fichas >= ticket.price;
        const price = enough ? `${ticket.price} ◈` : `FALTAN ${number(ticket.price - current.fichas)} ◈`;

        return `
            <article class="vip-menu__catalog-card vip-menu__catalog-card--ticket" style="--vip-color:${ticket.id === "op404" ? "#22d3ee" : "#fb7185"}">
                <div class="vip-menu__catalog-head">
                    <span aria-hidden="true">${ticket.icon}</span>
                    <div><small>PASE DE CAMPAÑA</small><b>${ticket.name}</b></div>
                    <strong>${number(current.tickets[ticket.id])}</strong>
                </div>
                <p>${ticket.description}</p>
                <button class="vip-menu__action${enough ? "" : " is-unaffordable"}" data-vip-action="ticket" data-vip-id="${ticket.id}" type="button">
                    <span>EMITIR 1 TICKET</span><b>${price}</b>
                </button>
            </article>
        `;
    }


    function campaignAccessSection(state) {
        if (state.campaignTicketsEnabled) {
            const tickets = Object.keys(state.ticketCatalog)
                .map((id) => ticketCard(state.ticketCatalog[id], state))
                .join("");

            return `
                <section aria-labelledby="vipPasses">
                    <header><p>MOSTRADOR A</p><h4 id="vipPasses">TICKETS DE JUEGO</h4></header>
                    <div class="vip-menu__catalog">${tickets}</div>
                </section>
            `;
        }

        return `
            <section aria-labelledby="vipPasses">
                <header><p>MOSTRADOR A</p><h4 id="vipPasses">ACCESO DE CAMPAÑA</h4></header>
                <div class="vip-menu__catalog">
                    <article class="vip-menu__catalog-card" style="--vip-color:#4ade80">
                        <div class="vip-menu__catalog-head">
                            <span aria-hidden="true">✓</span>
                            <div><small>PROTOCOLO DE AJUSTES</small><b>OPERACIÓN 404 + TURNO 404</b></div>
                            <strong>OK</strong>
                        </div>
                        <p>Las dos campañas están abiertas para revisar y mejorar. Puedes iniciarlas, reiniciarlas y volver a entrar sin gastar pases.</p>
                        <em>NO SE CONSUMEN TICKETS · LAS FICHAS SIGUEN SIRVIENDO PARA AYUDAS Y VÍNCULOS</em>
                    </article>
                </div>
            </section>
        `;
    }


    function itemCard(item, current) {
        const enough = current.fichas >= item.price;
        const price = enough ? `${item.price} ◈` : `FALTAN ${number(item.price - current.fichas)} ◈`;

        return `
            <article class="vip-menu__catalog-card vip-menu__catalog-card--item">
                <div class="vip-menu__catalog-head">
                    <span aria-hidden="true">${item.icon}</span>
                    <div><small>RESERVA DE SALIDA</small><b>${item.name}</b></div>
                    <strong>x${number(current.inventory[item.id])}</strong>
                </div>
                <p>${item.description}</p>
                <em>${item.useLabel}</em>
                <button class="vip-menu__action${enough ? "" : " is-unaffordable"}" data-vip-action="item" data-vip-id="${item.id}" type="button">
                    <span>PREPARAR</span><b>${price}</b>
                </button>
            </article>
        `;
    }


    function sceneCharacter(companion) {
        const locked = !companion.unlocked;
        const selected = activeMenu === companion.id;
        const returning = releasedMenu === companion.id;
        const portrait = expressionUrl(companion, "full");
        const stateLabel = selected
            ? "EN PRIMER PLANO"
            : locked
                ? `${companion.cost} ◈ PARA CONTACTAR`
                : companion.selected
                    ? "EN TU CANAL"
                    : `NIVEL ${companion.level} · ${companion.levelTitle}`;

        return `
            <button
                class="vip-scene__character${locked ? " is-locked" : ""}${selected ? " is-menu-open is-in-dialogue" : ""}${returning ? " is-returning" : ""}${companion.selected ? " is-active" : ""}"
                data-vip-action="character"
                data-vip-id="${companion.id}"
                data-character="${companion.id}"
                data-vip-level="${companion.level}"
                type="button"
                aria-expanded="${selected ? "true" : "false"}"
                aria-controls="vipContextMenu"
                aria-label="Abrir menú de ${companion.name}"
                style="--member:${companion.color}"
            >
                <span class="vip-scene__character-glow" aria-hidden="true"></span>
                <span class="vip-scene__activity" aria-hidden="true"></span>
                <span class="vip-scene__character-art" aria-hidden="true">
                    ${portrait ? `<img src="${portrait}" alt="" loading="lazy">` : `<i>${companion.name.slice(0, 1)}</i>`}
                </span>
                <span class="vip-scene__character-vacancy" aria-hidden="true">EN PRIMER PLANO</span>
                <span class="vip-scene__character-label"><b>${companion.name}</b><small>${stateLabel}</small></span>
            </button>
        `;
    }


    function affinityLadder(companion) {
        const levels = A.vip && Array.isArray(A.vip.LEVELS) ? A.vip.LEVELS : [];

        return `
            <ol class="vip-bond__ladder" aria-label="Progreso de afinidad de ${companion.name}">
                ${levels.map((tier) => {
                    const reached = companion.level >= tier.level;
                    const current = companion.level === tier.level;
                    return `<li class="${reached ? "is-reached" : ""}${current ? " is-current" : ""}">
                        <span>${tier.level}</span><div><b>${tier.title}</b><small>${BOND_REWARDS[tier.level] || "Mejora de vínculo."}</small></div>
                    </li>`;
                }).join("")}
            </ol>
        `;
    }


    function triviaPanel(companion) {
        const trivia = companion.trivia || { answered: 0, correct: 0, incorrect: 0, completed: false };
        const limit = A.vip && A.vip.CONVERSATION_LIMIT ? A.vip.CONVERSATION_LIMIT : 5;
        const blocks = A.vip && A.vip.DIALOGUE_TRIVIA ? A.vip.DIALOGUE_TRIVIA[companion.id] : [];
        const feedback = triviaFeedback && triviaFeedback.id === companion.id ? triviaFeedback : null;

        if (!companion.unlocked) {
            return `
                <section class="vip-bond__trivia is-locked" aria-labelledby="vipTriviaTitle">
                    <header><p>CONVERSACIÓN / ${limit} BLOQUES</p><h4 id="vipTriviaTitle">CANAL AÚN CERRADO</h4></header>
                    <span>Habilita el canal para conocer sus cinco bloques personales y responder su trivia de vínculo.</span>
                </section>
            `;
        }

        if (feedback) {
            const reactions = TRIVIA_REACTIONS[companion.id] || TRIVIA_REACTIONS.rog;
            const delta = feedback.affinityDelta > 0 ? `+${feedback.affinityDelta}` : String(feedback.affinityDelta);
            const title = feedback.correct ? "RESPUESTA CORRECTA" : "RESPUESTA INCORRECTA";
            const nextLabel = feedback.completed ? "VER RESUMEN DEL VÍNCULO" : "SIGUIENTE BLOQUE →";

            return `
                <section class="vip-bond__trivia vip-trivia__feedback${feedback.correct ? " is-correct" : " is-wrong"}" aria-labelledby="vipTriviaTitle" aria-live="polite">
                    <header><p>CONVERSACIÓN / ${number(feedback.answered)} DE ${limit}</p><h4 id="vipTriviaTitle">${title}</h4><b>${delta} AFINIDAD</b></header>
                    <blockquote>“${reactions[feedback.correct ? "correct" : "wrong"]}”</blockquote>
                    <span>${feedback.correct ? "El vínculo registra el acierto." : "El vínculo registra el error y resta puntos reales."}</span>
                    <button class="vip-menu__channel-link" data-vip-action="trivia-next" data-vip-id="${companion.id}" type="button">${nextLabel}</button>
                </section>
            `;
        }

        if (trivia.completed || trivia.answered >= blocks.length) {
            return `
                <section class="vip-bond__trivia vip-trivia__complete" aria-labelledby="vipTriviaTitle">
                    <header><p>CONVERSACIÓN COMPLETA / ${limit} DE ${limit}</p><h4 id="vipTriviaTitle">ARCHIVO DE VÍNCULO CERRADO</h4></header>
                    <strong>${number(trivia.correct)} ACIERTOS · ${number(trivia.incorrect)} ERRORES</strong>
                    <span>Ya conoces los cinco bloques de ${companion.name}. Los regalos y las partidas siguen mejorando el vínculo, pero la trivia no se puede repetir para farmear afinidad.</span>
                </section>
            `;
        }

        const block = blocks[trivia.answered];
        if (!block) {
            return "";
        }

        return `
            <section class="vip-bond__trivia" aria-labelledby="vipTriviaTitle">
                <header><p>CONVERSACIÓN FINITA / ${number(trivia.answered + 1)} DE ${limit}</p><h4 id="vipTriviaTitle">ARCHIVO PERSONAL</h4><b>${number(trivia.correct)} ACIERTOS</b></header>
                <blockquote>“${block.fact}”</blockquote>
                <strong>${block.question}</strong>
                <div class="vip-trivia__choices">
                    ${block.choices.map((choice, index) => `<button data-vip-action="trivia-answer" data-vip-id="${companion.id}" data-vip-choice="${choice.id}" type="button"><i>${String.fromCharCode(65 + index)}</i><span>${choice.text}</span></button>`).join("")}
                </div>
                <span>Responde con cuidado: acierto +9 afinidad · error −4 afinidad. Cada respuesta queda guardada.</span>
            </section>
        `;
    }


    function memberPortrait(companion, speech) {
        const portrait = expressionUrl(companion, speech.expression || "serio");

        return `
            <div class="vip-menu__portrait" data-character="${companion.id}" aria-hidden="true">
                <span></span>
                ${portrait ? `<img src="${portrait}" alt="">` : `<i>${companion.name.slice(0, 1)}</i>`}
            </div>
        `;
    }


    /* El vale de calibración no forma parte de la economía publicada. Sólo
       aparece bajo el host de preview y requiere una decisión explícita: al
       abrir la sala no se suma ninguna ficha automáticamente. */
    function previewTestVoucher(state) {
        const preview = A.vip && typeof A.vip.isArenaPreviewHost === "function" &&
            A.vip.isArenaPreviewHost();

        if (!preview) {
            return "";
        }

        const claimed = Boolean(state.previewTestStipendClaimed);
        const amount = number(A.vip.PREVIEW_TEST_STIPEND || 10000);

        return `
            <aside class="vip-menu__qa-voucher${claimed ? " is-claimed" : ""}" aria-label="Vale único de pruebas">
                <div>
                    <p>PROTOCOLO DE CALIBRACIÓN · PREVIEW</p>
                    <h4>VALE ÚNICO DE PRUEBAS</h4>
                    <span>${claimed
                        ? "Canjeado en este perfil. La economía vuelve a depender de tus partidas."
                        : "No se acredita al abrir la sala. Canjéalo una vez para probar ayudas, objetos y vínculos."}</span>
                </div>
                ${claimed
                    ? "<b>CANJEADO</b>"
                    : `<button data-vip-action="preview-stipend" type="button"><span>CANJEAR LOTE</span><b>+${amount} ◈</b></button>`}
            </aside>
        `;
    }


    function merchantMenu(state, companion) {
        const speech = activeSpeech(companion);
        const campaignAccess = campaignAccessSection(state);
        const items = Object.keys(state.itemCatalog).map((id) => itemCard(state.itemCatalog[id], state)).join("");

        return `
            <section class="vip-menu vip-menu--merchant" id="vipContextMenu" style="--member:${companion.color}" aria-labelledby="vipMenuTitle">
                <button class="vip-menu__close" data-vip-action="close-menu" type="button" aria-label="Cerrar menú del Sr. de las Colinas">×</button>
                <header class="vip-menu__header">
                    ${memberPortrait(companion, speech)}
                    <div class="vip-menu__identity">
                        <p>COMERCIANTE PRINCIPAL // SALA VIP</p>
                        <h3 id="vipMenuTitle">${companion.name}</h3>
                        <span>${speech.label}</span>
                        <blockquote>“${speech.text}”</blockquote>
                    </div>
                    <div class="vip-menu__balance" aria-label="Saldo actual">
                        <small>CARTERA DISPONIBLE</small><strong>${number(state.fichas)} <i>◈</i></strong>
                    </div>
                </header>
                <div class="vip-menu__merchant-grid">
                    ${campaignAccess}
                    <section aria-labelledby="vipSupplies"><header><p>MOSTRADOR B</p><h4 id="vipSupplies">AYUDAS Y CONSUMIBLES</h4></header><div class="vip-menu__catalog">${items}</div></section>
                </div>
                ${previewTestVoucher(state)}
                <footer class="vip-menu__merchant-footer">
                    <div><p>CANAL PERSONAL DEL ANFITRIÓN</p><strong>NIVEL ${companion.level} · ${companion.levelTitle}</strong><span>También puedes mejorar el vínculo de Colinas, equiparlo y usar su Pase de Gala.</span></div>
                    <button class="vip-menu__channel-link" data-vip-action="open-bond" data-vip-id="colinas" type="button">VER VÍNCULO DE COLINAS →</button>
                </footer>
            </section>
        `;
    }


    function bondMenu(state, companion) {
        const speech = activeSpeech(companion);
        const locked = !companion.unlocked;
        const enough = state.fichas >= companion.cost;
        const nextText = companion.nextAffinity === null
            ? "VÍNCULO MÁXIMO"
            : `${number(companion.affinity)} / ${number(companion.nextAffinity)} AFINIDAD`;
        const unlockPrice = enough ? `${companion.cost} ◈` : `FALTAN ${number(companion.cost - state.fichas)} ◈`;
        const giftEnough = state.fichas >= companion.favorite.price;
        const giftPrice = giftEnough
            ? `+${companion.favorite.affinity} · ${companion.favorite.price} ◈`
            : `+${companion.favorite.affinity} · FALTAN ${number(companion.favorite.price - state.fichas)} ◈`;
        const actionMarkup = locked
            ? `<button class="vip-menu__action${enough ? "" : " is-unaffordable"}" data-vip-action="unlock" data-vip-id="${companion.id}" type="button"><span>HABILITAR CANAL</span><b>${unlockPrice}</b></button>`
            : `<button class="vip-menu__action" data-vip-action="equip" data-vip-id="${companion.id}" type="button" ${companion.selected ? "disabled" : ""}><span>${companion.selected ? "ACOMPAÑANDO" : "ACOMPAÑAR"}</span><b>${companion.selected ? "●" : "→"}</b></button>
               <button class="vip-menu__gift${giftEnough ? "" : " is-unaffordable"}" data-vip-action="gift" data-vip-id="${companion.id}" type="button"><span>OBSEQUIAR · ${companion.favorite.icon} ${companion.favorite.name}</span><b>${giftPrice}</b></button>`;
        const shopShortcut = companion.id === "colinas"
            ? `<button class="vip-menu__channel-link" data-vip-action="open-shop" data-vip-id="colinas" type="button">← VOLVER AL MOSTRADOR</button>`
            : "";
        const companionSupport = A.vip && A.vip.MINI_SUPPORT ? A.vip.MINI_SUPPORT[companion.id] : null;
        const companionMessage = companionSupport
            ? companion.level >= 2
                ? `COMPANION ${companionSupport.label}: en OPERACIÓN 404 camina contigo; en cualquier juego usa Y para activar ${companion.level >= 4 ? "2" : "1"} impulso${companion.level >= 4 ? "s" : ""} de foco.`
                : `COMPANION ${companionSupport.label}: aparece dentro de OPERACIÓN 404. Alcanza CONFIANZA (nivel 2) para desbloquear un impulso de foco con Y.`
            : "El Companion equipado aparece dentro de OPERACIÓN 404 durante la partida.";

        return `
            <section class="vip-menu vip-menu--bond" id="vipContextMenu" data-member="${companion.id}" style="--member:${companion.color}" aria-labelledby="vipMenuTitle">
                <button class="vip-menu__close" data-vip-action="close-menu" type="button" aria-label="Cerrar menú de ${companion.name}">×</button>
                <header class="vip-menu__header">
                    ${memberPortrait(companion, speech)}
                    <div class="vip-menu__identity">
                        <p>${companion.role} // VÍNCULO PERSONAL</p>
                        <h3 id="vipMenuTitle">${companion.name}</h3>
                        <span>${speech.label}</span>
                        <blockquote>“${speech.text}”</blockquote>
                    </div>
                    <div class="vip-menu__balance" aria-label="Nivel actual de vínculo">
                        <small>NIVEL ACTUAL</small><strong>${companion.level} <i>◆</i></strong><span>${companion.levelTitle}</span>
                    </div>
                </header>
                <div class="vip-bond__body">
                    <section class="vip-bond__status" aria-labelledby="vipBondStatus">
                        <p>AFINIDAD / ${nextText}</p>
                        <div class="vip-bond__meter" aria-label="${nextText}"><i style="width:${Math.round(companion.affinityProgress * 100)}%"></i></div>
                        <h4 id="vipBondStatus">${locked ? "EL CANAL ESTÁ CERRADO" : "APOYO DISPONIBLE EN PARTIDA"}</h4>
                        <span>${companion.perk}</span>
                        <p class="vip-bond__companion-note">${companionMessage}</p>
                        <div class="vip-bond__actions">${actionMarkup}${shopShortcut}</div>
                    </section>
                    <section class="vip-bond__progress" aria-labelledby="vipBondLevels">
                        <header><p>RECOMPENSAS DEL VÍNCULO</p><h4 id="vipBondLevels">RUTA DE AFINIDAD</h4></header>
                        ${affinityLadder(companion)}
                    </section>
                </div>
                ${triviaPanel(companion)}
            </section>
        `;
    }


    function idleMenu() {
        return `
            <section class="vip-menu vip-menu--idle" id="vipContextMenu" aria-labelledby="vipMenuTitle">
                <header><p>LA SALA ESTÁ ABIERTA</p><h3 id="vipMenuTitle">ELIGE A QUIÉN ESCUCHAR</h3></header>
                <span>Selecciona una silueta de la escena. Colinas abre el mostrador de reservas y ayudas; cada compañero abre su vínculo personal. OPERACIÓN 404 y TURNO 404 están abiertos para ajustes. Si tu saldo está en cero, una partida convierte su score en FICHAS.</span>
            </section>
        `;
    }


    function currentMenu(state) {
        if (!activeMenu || !state.companions[activeMenu]) {
            return idleMenu();
        }

        const companion = state.companions[activeMenu];
        return companion.id === "colinas" && activeMode === "merchant"
            ? merchantMenu(state, companion)
            : bondMenu(state, companion);
    }


    function ledgerEntry(entry) {
        const sign = entry.amount > 0 ? "+" : "";
        const className = entry.amount > 0 ? "is-positive" : "is-negative";

        return `<li class="${className}"><span>${entry.label}</span><b>${sign}${number(entry.amount)} ◈</b></li>`;
    }


    function introCast(state, scene) {
        const order = ["colinas", "desire", "davinchi", "rog", "sil"];

        return order.map((id, index) => {
            const companion = state.companions[id];
            if (!companion) {
                return "";
            }
            const portrait = expressionUrl(companion, "full");
            const joined = index <= scene.joined;
            const speaking = scene.speaker === id;
            const arriving = scene.arrival === id;

            return `<span class="vip-intro__member${joined ? " is-joined" : ""}${speaking ? " is-speaking" : ""}${arriving ? " is-arriving" : ""}" data-character="${id}" style="--member:${companion.color}">
                ${portrait ? `<img src="${portrait}" alt="">` : `<i>${companion.name.slice(0, 1)}</i>`}
            </span>`;
        }).join("");
    }


    function introOverlay(state) {
        if (!introOpen) {
            return "";
        }

        const scene = INTRO_SCENES[introIndex] || INTRO_SCENES[0];
        const speaker = state.companions[scene.speaker];
        const speakerPortrait = expressionUrl(speaker, scene.expression);
        const atEnd = introIndex >= INTRO_SCENES.length - 1;

        return `
            <section class="vip-intro" role="dialog" aria-modal="true" aria-labelledby="vipIntroTitle">
                <div class="vip-intro__backdrop" aria-hidden="true"></div>
                <div class="vip-intro__frame">
                    <div class="vip-intro__sign" aria-hidden="true">VIP</div>
                    <div class="vip-intro__floor" aria-hidden="true"></div>
                    <div class="vip-intro__cast" aria-hidden="true">${introCast(state, scene)}</div>
                    <div class="vip-intro__speaker" data-character="${scene.speaker}" aria-hidden="true">
                        ${speakerPortrait ? `<img src="${speakerPortrait}" alt="">` : ""}
                    </div>
                    <section class="vip-intro__dialogue" aria-live="polite">
                        <p>${scene.eyebrow}</p>
                        <h3 id="vipIntroTitle">${speaker ? speaker.name : "SALA VIP"}</h3>
                        <blockquote>“${scene.text}”</blockquote>
                        <div><span>${String(introIndex + 1).padStart(2, "0")} / ${String(INTRO_SCENES.length).padStart(2, "0")}</span><i aria-hidden="true"></i></div>
                    </section>
                    <footer class="vip-intro__actions">
                        <button data-vip-action="intro-skip" type="button">SALTAR INTRO</button>
                        <div>
                            <button data-vip-action="intro-prev" type="button" ${introIndex === 0 ? "disabled" : ""}>← ANTERIOR</button>
                            <button class="is-primary" data-vip-action="intro-next" type="button">${atEnd ? "ABRIR LA SALA →" : "SIGUIENTE · ESPACIO →"}</button>
                        </div>
                    </footer>
                </div>
            </section>
        `;
    }


    function render() {
        if (!root || !A.vip) {
            return;
        }

        const state = A.vip.snapshot();
        const companions = orderedCompanions(state).map(sceneCharacter).join("");
        const active = state.active
            ? `${state.active.name} · NIVEL ${state.active.level}`
            : "NINGÚN COMPAÑERO ASIGNADO";
        const welcome = reception === "colinas" ? WELCOME.colinas : WELCOME.normal;
        const backdrop = imageUrl("home.vip-lounge");
        /* La historia y toda la sala permanecen en el flujo. Cuando se abre
           un canal sólo recogemos el espacio decorativo sobrante para que el
           comienzo del mostrador llegue enseguida, sin ocultar la escena. */
        const contextOpen = Boolean(activeMenu && state.companions[activeMenu]);
        const deferPanelsForIntro = introOpen;
        const accountIdle = !state.active && !state.ledger.length;

        root.innerHTML = `
            <section class="vip-central${deferPanelsForIntro ? " is-intro-open" : ""}">
                <section class="vip-scene${reception === "colinas" ? " is-direct-arrival" : ""}${contextOpen ? " is-context-open" : ""}" aria-labelledby="vipTitle">
                    ${backdrop ? `<img class="vip-scene__backdrop" src="${backdrop}" alt="" aria-hidden="true">` : ""}
                    <div class="vip-scene__veil" aria-hidden="true"></div>
                    <div class="vip-scene__grid" aria-hidden="true"></div>
                    <div class="vip-scene__carpet" aria-hidden="true"></div>
                    <div class="vip-scene__sign" aria-hidden="true"><span>ARCADE 404</span><b>VIP</b><i>LOUNGE</i></div>
                    <header class="vip-scene__header">
                        <div class="vip-scene__title">
                            <p>SALA EXCLUSIVA // PISO 404</p>
                            <h2 id="vipTitle">VIP <em>CENTRAL</em></h2>
                            <span>Selecciona a alguien en la sala para abrir su canal, vínculo o mostrador.</span>
                        </div>
                        <div class="vip-scene__wallet" aria-label="Saldo de Fichas VIP">
                            <small>FICHAS VIP</small><strong>${number(state.fichas)} <i>◈</i></strong><span>TOTAL · ${number(state.totalEarned)} ◈</span>
                        </div>
                    </header>
                    <section class="vip-scene__host-note" aria-label="Recibimiento del Sr. de las Colinas">
                        <b>SR. DE LAS COLINAS</b><p>“${welcome}”</p>
                    </section>
                    <div class="vip-scene__cast" aria-label="Personajes presentes en la Sala VIP">
                        ${companions}
                    </div>
                    <footer class="vip-scene__footer">
                        <button data-vip-action="show-intro" type="button">▷ VER INTRODUCCIÓN</button>
                        <span>◈ El personaje elegido pasa al primer plano; su asiento vuelve al cambiar o cerrar.</span>
                        <button data-vip-action="back" type="button">← VOLVER AL ARCADE</button>
                    </footer>
                </section>

                ${deferPanelsForIntro ? "" : `
                    <p class="vip-central__notice" data-role="vip-message" role="status" aria-live="polite">EMPIEZAS CON 0 ◈. OPERACIÓN 404 y TURNO 404 están abiertos para ajustes; cada partida convierte score en FICHAS VIP y sus zonas también acreditan progreso. Ayudas y afinidad quedan guardadas.</p>

                    ${currentMenu(state)}

                    <section class="vip-central__ledger-row${accountIdle ? " is-idle" : ""}">
                        <article class="vip-central__active"><p>COMPAÑERO EN CANAL</p><strong>${active}</strong><span>El canal activo aporta una ayuda real en OPERACIÓN 404 o TURNO 404 y gana afinidad al jugar.</span></article>
                        <article class="vip-central__ledger" aria-label="Últimos movimientos VIP"><p>ÚLTIMOS MOVIMIENTOS</p><ol>${state.ledger.length ? state.ledger.slice(0, 6).map(ledgerEntry).join("") : "<li><span>AÚN NO HAY MOVIMIENTOS</span><b>—</b></li>"}</ol></article>
                    </section>
                `}

                ${introOverlay(state)}
            </section>
        `;

        messageNode = root.querySelector('[data-role="vip-message"]');
        syncBalance(state);
        scheduleLoungeMotion();
    }


    function syncBalance(state) {
        const view = state || (A.vip && A.vip.snapshot ? A.vip.snapshot() : null);

        if (balanceNode && view) {
            balanceNode.textContent = `${number(view.fichas)} ◈`;
        }
    }


    function showMessage(text, error) {
        if (!messageNode) {
            return;
        }

        messageNode.textContent = text;
        messageNode.classList.toggle("is-error", Boolean(error));
        messageNode.classList.add("is-visible");
    }


    function finishIntro() {
        const resume = introResume || { menu: null, mode: "merchant" };

        introOpen = false;
        introIndex = 0;
        activeMenu = resume.menu;
        activeMode = resume.mode || "merchant";
        releasedMenu = null;
        triviaFeedback = null;
        introResume = null;

        if (A.vip && typeof A.vip.markVipIntroSeen === "function") {
            A.vip.markVipIntroSeen();
        }

        render();
    }


    function advanceIntro() {
        if (introIndex >= INTRO_SCENES.length - 1) {
            finishIntro();
            return;
        }

        introIndex += 1;
        render();
    }


    function revealMenu() {
        if (!root || typeof root.querySelector !== "function") {
            return;
        }

        /* La historia y la Sala conservan su flujo normal. En pantalla táctil
           sólo pedimos el desplazamiento mínimo necesario para mostrar el
           comienzo del panel: no se salta toda la escena decorativa. */
        const reveal = () => {
            const menu = root.querySelector(".vip-menu");
            if (!menu || typeof menu.scrollIntoView !== "function") {
                return;
            }

            const compactMenu = Boolean(
                window.matchMedia && window.matchMedia("(max-width: 900px)").matches
            );
            const behavior = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth";
            try {
                menu.scrollIntoView({
                    behavior,
                    block: compactMenu ? "nearest" : "start"
                });
            } catch (error) {
                menu.scrollIntoView();
            }
        };

        if (typeof window.requestAnimationFrame === "function") {
            window.requestAnimationFrame(reveal);
        } else {
            reveal();
        }
    }


    function restoreSceneFocus(id) {
        if (!id || !root || typeof root.querySelector !== "function") {
            return;
        }

        const restore = () => {
            const character = root.querySelector(`[data-vip-action="character"][data-vip-id="${id}"]`);
            if (!character || typeof character.focus !== "function") {
                return;
            }
            try {
                character.focus({ preventScroll: true });
            } catch (error) {
                character.focus();
            }
        };

        if (typeof window.requestAnimationFrame === "function") {
            window.requestAnimationFrame(restore);
        } else {
            restore();
        }
    }


    function handleVipPurchase(action, id) {
        let outcome = null;

        if (action === "ticket") {
            outcome = A.vip.buyTicket(id);
        } else if (action === "item") {
            outcome = A.vip.buyItem(id);
        } else if (action === "unlock") {
            outcome = A.vip.unlockCompanion(id);
        } else if (action === "equip") {
            outcome = A.vip.selectCompanion(id);
        } else if (action === "gift") {
            outcome = A.vip.giveGift(id);
        } else if (action === "preview-stipend" &&
            typeof A.vip.claimPreviewTestStipend === "function") {
            outcome = A.vip.claimPreviewTestStipend();
        }

        if (!outcome) {
            return;
        }

        const state = outcome.state || A.vip.snapshot();
        const isMerchantAction = action === "ticket" || action === "item" ||
            action === "preview-stipend";
        const companion = state.companions[id];
        menuResponse = isMerchantAction
            ? merchantResponse(action, id, outcome, state)
            : companion
                ? companionResponse(action, companion, outcome)
                : null;
        /* Tickets, ítems y el vale de prueba no tienen ID de personaje.
           La mesa de Colinas queda abierta tras cada operación para que su
           reacción y la cartera actualizada se vean de inmediato. */
        setMenu(isMerchantAction ? "colinas" : id || activeMenu,
            isMerchantAction ? "merchant" : "bond");
        render();
        showMessage(outcome.message || (outcome.ok ? "OPERACIÓN COMPLETADA." : "NO SE PUDO COMPLETAR LA OPERACIÓN."), !outcome.ok);

        if (A.audio && typeof A.audio.play === "function") {
            A.audio.play(outcome.ok ? "select" : "vacio");
        }
    }


    function handleTriviaAnswer(id, choiceId) {
        if (!A.vip || typeof A.vip.answerTrivia !== "function") {
            return;
        }

        const outcome = A.vip.answerTrivia(id, choiceId);
        const state = outcome.state || A.vip.snapshot();
        const companion = state.companions[id];

        if (!outcome.ok || !companion) {
            triviaFeedback = null;
            if (companion) {
                menuResponse = {
                    id,
                    expression: expressionFor(companion, "stressed"),
                    label: "TRIVIA NO DISPONIBLE",
                    text: outcome.message || "Ese bloque ya no está disponible."
                };
                setMenu(id, "bond", true);
                render();
            }
            showMessage(outcome.message || "No se pudo registrar esa respuesta.", true);
            if (A.audio && typeof A.audio.play === "function") {
                A.audio.play("vacio");
            }
            return;
        }

        const reactions = TRIVIA_REACTIONS[id] || TRIVIA_REACTIONS.rog;
        triviaFeedback = {
            id,
            correct: outcome.correct,
            affinityDelta: outcome.affinityDelta,
            answered: companion.trivia.answered,
            completed: outcome.completed,
            leveledUp: outcome.leveledUp,
            leveledDown: outcome.leveledDown
        };
        menuResponse = {
            id,
            expression: expressionFor(companion, outcome.correct ? "happy" : "stressed"),
            label: outcome.correct ? "TRIVIA ACERTADA" : "TRIVIA FALLADA",
            text: reactions[outcome.correct ? "correct" : "wrong"]
        };
        setMenu(id, "bond", true);
        render();
        showMessage(outcome.message, !outcome.correct);

        if (A.audio && typeof A.audio.play === "function") {
            A.audio.play(outcome.correct ? "select" : "vacio");
        }
    }


    function handleAction(event) {
        const button = event.target.closest("[data-vip-action]");

        if (!button || button.disabled || !A.vip) {
            return;
        }

        const action = button.dataset.vipAction;
        const id = button.dataset.vipId;

        if (action === "back") {
            reception = "normal";
            setMenu(null, "merchant");
            menuResponse = null;
            A.router.go("hub");
            return;
        }

        if (action === "show-intro") {
            beginIntroduction();
            render();
            return;
        }

        if (action === "intro-skip") {
            finishIntro();
            return;
        }

        if (action === "intro-prev") {
            introIndex = Math.max(0, introIndex - 1);
            render();
            return;
        }

        if (action === "intro-next") {
            advanceIntro();
            return;
        }

        if (action === "character") {
            setMenu(id, id === "colinas" ? "merchant" : "bond");
            menuResponse = null;
            render();
            revealMenu();
            return;
        }

        if (action === "open-bond") {
            setMenu(id, "bond");
            menuResponse = null;
            render();
            return;
        }

        if (action === "open-shop") {
            setMenu("colinas", "merchant");
            menuResponse = null;
            render();
            /* El mostrador sigue después de la sala para conservar la
               historia; en móvil revealMenu aplica sólo el scroll mínimo. */
            revealMenu();
            return;
        }

        if (action === "close-menu") {
            const returningId = activeMenu;
            setMenu(null, "merchant");
            menuResponse = null;
            render();
            /* Al cerrar el panel, el foco vuelve a la silueta que dejó
               temporalmente su sitio sin provocar salto de scroll. */
            restoreSceneFocus(returningId);
            return;
        }

        if (action === "trivia-answer") {
            handleTriviaAnswer(id, button.dataset.vipChoice);
            return;
        }

        if (action === "trivia-next") {
            triviaFeedback = null;
            menuResponse = null;
            render();
            return;
        }

        handleVipPurchase(action, id);
    }


    function handleKey(key, event) {
        if (introOpen) {
            if (event && event.repeat) {
                return true;
            }

            if (key === "Escape") {
                finishIntro();
                return true;
            }

            if (key === "ArrowLeft") {
                introIndex = Math.max(0, introIndex - 1);
                render();
                return true;
            }

            if (key === "Enter" || key === " " || key === "Spacebar" || key === "ArrowRight") {
                advanceIntro();
                return true;
            }

            return false;
        }

        if (key === "Escape" && activeMenu) {
            setMenu(null, "merchant");
            menuResponse = null;
            render();
            return true;
        }

        return false;
    }


    function receiveFromColinas() {
        reception = "colinas";
        setMenu("colinas", "merchant");
        menuResponse = null;

        if (firstIntroPending()) {
            beginIntroduction();
        }

        render();
        if (!introOpen) {
            revealMenu();
        }
    }


    function receiveNormally() {
        reception = "normal";
        /* Desde barra, hub o una URL directa se ve primero al equipo entero.
           Colinas sigue siendo el acceso al mostrador al pulsar su silueta. */
        setMenu(null, "merchant");
        menuResponse = null;

        if (firstIntroPending()) {
            beginIntroduction();
        }

        render();
    }


    function openMerchant() {
        /* Ruta usada por el bloqueo de ticket: conserva el recibimiento
           normal, pero deja la mesa de Colinas lista para emitir el pase. */
        reception = "normal";
        setMenu("colinas", "merchant");
        menuResponse = null;

        if (firstIntroPending()) {
            beginIntroduction();
        }

        render();
        if (!introOpen) {
            revealMenu();
        }
    }


    A.vipCentral = {
        init(options = {}) {
            stopLoungeMotion();
            if (unlistenRoute) {
                unlistenRoute();
                unlistenRoute = null;
            }
            root = options.root || null;
            balanceNode = options.balance || null;

            if (!root || !A.vip) {
                return;
            }

            /* El temporizador de ambiente se corta en el mismo cambio de
               ruta; no queda esperando su siguiente pulso fuera de VIP. */
            if (A.router && typeof A.router.onChange === "function") {
                const offRoute = A.router.onChange((route) => {
                    if (!route || route.type !== "vip") {
                        stopLoungeMotion();
                    }
                });
                unlistenRoute = typeof offRoute === "function" ? offRoute : null;
            }

            activeMenu = null;
            activeMode = "merchant";
            releasedMenu = null;
            menuResponse = null;
            triviaFeedback = null;
            introOpen = false;
            introIndex = 0;
            introResume = null;
            if (firstIntroPending()) {
                beginIntroduction();
            }
            root.addEventListener("click", handleAction);
            render();

            if (unlisten) {
                unlisten();
            }
            unlisten = A.vip.onChange((state) => {
                syncBalance(state);

                const screen = typeof root.closest === "function"
                    ? root.closest(".screen")
                    : root.parentElement;
                if (!screen || !screen.hidden) {
                    render();
                }
                if (A.hub && typeof A.hub.refresh === "function") {
                    A.hub.refresh();
                }
            });
        },
        refresh: render,
        syncBalance,
        showMessage,
        handleKey,
        receiveFromColinas,
        receiveNormally,
        openMerchant,
        openIntroduction() {
            beginIntroduction();
            render();
        }
    };

})(window.Arcade404);
