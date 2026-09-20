/* =========================================================
   ARCADE 404 — HUB (SELECTOR DE JUEGOS)
   Genera las tarjetas desde el registro y gestiona la
   selección con ratón, táctil y teclado.
   ========================================================= */

(function (A) {

    "use strict";


    const { utils, storage } = A;


    let grid = null;
    let counter = null;

    let cards = [];
    let definitions = [];

    let selected = 0;


    /* ---------------------------------------------------------
       Tarjeta
       --------------------------------------------------------- */

    function buildCard(def, index) {

        const card = utils.create("button", `game-card game-card--${def.id}`);

        card.type = "button";
        card.dataset.game = def.id;
        card.setAttribute("role", "listitem");
        card.style.setProperty("--card-rgb", def.cardRgb || def.accentRgb);
        card.style.setProperty("--entry-delay", `${index * 55}ms`);


        const best = storage.getBest(def.id);
        const ticketId = def.vipTicket || def.id;
        const ticketTag = A.vip && typeof A.vip.needsTicket === "function" && A.vip.needsTicket(ticketId)
            ? `<span class="game-card__ticket" data-ticket-game="${ticketId}">TICKET ×${A.vip.ticketsFor(ticketId)}</span>`
            : "";


        /* Marca de capítulo: si este juego guarda un trozo de la
           historia, se indica si ya se ha desbloqueado. */
        const chapter = A.story ? A.story.BY_GAME[def.id] : null;

        const chapterSeen = chapter ? A.story.isSeen(chapter.id) : false;

        const chapterTag = chapter
            ? `<span class="game-card__chapter${chapterSeen ? " is-seen" : ""}"
                     title="${chapterSeen
                         ? "Capítulo " + chapter.chapter + " desbloqueado"
                         : "Capítulo " + chapter.chapter + " · llega a " + chapter.score}">
                   ${chapterSeen ? "▣" : "▢"} CAP ${chapter.chapter}
               </span>`
            : "";


        card.innerHTML = `

            <span class="game-card__number">ROM ${def.number}</span>

            ${chapterTag}

            <span class="game-card__badge">
                BEST ${utils.formatScore(best)}
            </span>

            ${ticketTag}

            <span class="game-card__screen" aria-hidden="true">
                <span class="game-card__visual">
                    ${def.preview || ""}
                </span>
            </span>

            <span class="game-card__info">

                <span class="game-card__name">${def.name}</span>

                <span class="game-card__genre">${def.genre}</span>

                <span class="game-card__mode">${def.mode || "FREE PLAY"}</span>

            </span>

            <span class="game-card__arrow" aria-hidden="true">
                <small>PLAY</small><b>↗</b>
            </span>

        `;


        if (def.comingSoon) {

            card.classList.add("game-card--locked");
            card.disabled = true;

            const badge = card.querySelector(".game-card__badge");

            if (badge) {
                badge.textContent = "SOON";
            }

        }


        card.addEventListener("mouseenter", () => {
            select(index, false);
        });


        card.addEventListener("focus", () => {
            select(index, false);
        });


        card.addEventListener("click", () => {

            select(index, false);

            launch(def);

        });


        return card;

    }


    /* ---------------------------------------------------------
       Selección
       --------------------------------------------------------- */

    function select(index, playSound = true) {

        if (!cards.length) {
            return;
        }

        const total = cards.length;

        let next = index;

        if (next < 0) {
            next = total - 1;
        }

        if (next >= total) {
            next = 0;
        }

        if (next !== selected && playSound) {
            A.audio.play("move");
        }

        selected = next;

        cards.forEach((card, position) => {

            card.classList.toggle(
                "game-card--selected",
                position === selected
            );

        });

    }


    function getColumnCount() {

        if (!grid) {
            return 3;
        }

        const columns = window
            .getComputedStyle(grid)
            .gridTemplateColumns
            .split(" ")
            .filter(Boolean);

        return Math.max(1, columns.length);

    }


    function launch(def) {

        if (!def || def.comingSoon) {
            return;
        }

        A.audio.play("select");

        A.router.go(`game/${def.id}`);

    }


    /* ---------------------------------------------------------
       API
       --------------------------------------------------------- */

    A.hub = {

        init(options = {}) {

            grid = options.grid;
            counter = options.counter;

            this.build();

            window.addEventListener("resize", utils.debounce(() => {

                /* Mantiene la selección visible al cambiar de rejilla */
                select(selected, false);

            }, 200));

        },


        build() {

            if (!grid) {
                return;
            }

            definitions = A.listGames();

            grid.innerHTML = "";

            cards = definitions.map((def, index) => {

                const card = buildCard(def, index);

                grid.appendChild(card);

                return card;

            });

            if (counter) {

                const available = definitions.filter((def) => !def.comingSoon);

                counter.textContent = `${utils.pad(available.length, 2)} TITLES`;

            }

            select(0, false);

        },


        /** Actualiza récords y contador sin reconstruir la rejilla */
        refresh() {

            definitions.forEach((def, index) => {

                const card = cards[index];

                if (!card) {
                    return;
                }

                const badge = card.querySelector(".game-card__badge");

                if (badge && !def.comingSoon) {

                    badge.textContent =
                        `BEST ${utils.formatScore(storage.getBest(def.id))}`;

                }

                const ticket = card.querySelector("[data-ticket-game]");
                if (ticket && A.vip && typeof A.vip.ticketsFor === "function") {
                    const ticketId = ticket.dataset.ticketGame || def.vipTicket || def.id;
                    ticket.textContent = `TICKET ×${A.vip.ticketsFor(ticketId)}`;
                    ticket.classList.toggle("is-empty", A.vip.ticketsFor(ticketId) <= 0);
                }

            });

        },


        /* Reactiva la entrada escalonada cada vez que el selector aparece.
           Las tarjetas se montan al arrancar la app, por lo que no basta la
           animación inicial si HOME estuvo visible primero. */
        playEntrance() {

            if (!grid || !cards.length) {
                return;
            }

            cards.forEach((card) => {
                card.classList.remove("game-card--entering");
            });

            /* Fuerza un nuevo ciclo de animación sin reconstruir botones,
               foco ni récords guardados. */
            void grid.offsetWidth;

            cards.forEach((card) => {
                card.classList.add("game-card--entering");
            });

        },


        select,


        focusSelected(scroll = true) {

            const card = cards[selected];

            if (!card) {
                return;
            }

            card.focus({

                preventScroll: !scroll

            });

        },


        getSelected() {
            return definitions[selected] || null;
        },


        launchSelected() {
            launch(this.getSelected());
        },


        /** Devuelve true si la tecla fue gestionada por el hub */
        handleKey(key) {

            const columns = getColumnCount();

            switch (key) {

                case "ArrowRight":
                case "d":
                case "D":
                    select(selected + 1);
                    this.focusSelected();
                    return true;

                case "ArrowLeft":
                case "a":
                case "A":
                    select(selected - 1);
                    this.focusSelected();
                    return true;

                case "ArrowDown":
                case "s":
                case "S":
                    select(selected + columns);
                    this.focusSelected();
                    return true;

                case "ArrowUp":
                case "w":
                case "W":
                    select(selected - columns);
                    this.focusSelected();
                    return true;

                case "Enter":
                case " ":
                    this.launchSelected();
                    return true;

                default:
                    return false;

            }

        }

    };

})(window.Arcade404);
