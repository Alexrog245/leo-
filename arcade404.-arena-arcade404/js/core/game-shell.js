/* =========================================================
   ARCADE 404 — SHELL DE JUEGO
   Construye una pantalla mínima (barra, HUD, escenario) y
   gestiona el ciclo de vida: mount → ready → running → over
   ========================================================= */

(function (A) {

    "use strict";


    const { utils } = A;


    /* =========================================================
       PLANTILLA — sólo el juego y lo imprescindible
       ========================================================= */

    function template(def) {

        return `

            <div class="game-shell">

                <div class="game-bar">

                    <button
                        class="game-bar__back"
                        data-action="back"
                        type="button"
                        title="Volver al arcade (ESC)"
                    >
                        ←<span>ARCADE</span>
                    </button>

                    <div class="game-bar__title">
                        <span class="game-bar__number">GAME ${def.number}</span>
                        <h2>${def.name}</h2>
                    </div>

                    <div class="game-bar__actions">

                        <button
                            class="icon-button"
                            data-action="pause"
                            type="button"
                            title="Pausa (P)"
                        >
                            <span class="icon-button__glyph">❚❚</span>
                        </button>

                        <button
                            class="icon-button"
                            data-action="restart"
                            type="button"
                            title="Reiniciar"
                        >
                            <span class="icon-button__glyph">↻</span>
                        </button>

                        <button
                            class="icon-button"
                            data-action="sound"
                            type="button"
                            title="Sonido (M)"
                        >
                            <span
                                class="icon-button__glyph"
                                data-role="sound-glyph"
                            >♪</span>
                        </button>

                    </div>

                </div>


                <div class="game-hud" data-role="hud"></div>


                <div class="game-stage">

                    <div class="stage-frame">

                        <div class="stage-slot" data-role="stage"></div>

                        <div
                            class="game-overlay"
                            data-role="overlay"
                            hidden
                        ></div>

                        <!-- Los canvas no ofrecen un objetivo táctil semántico.
                             Esta señal lateral acompaña cada historia y replica
                             ESPACIO sin ocupar la franja donde se lee el diálogo. -->
                        <button
                            class="stage-narrative-control"
                            data-role="narrative-control"
                            type="button"
                            hidden
                        >
                            <span class="stage-narrative-control__cue" aria-hidden="true">↗</span>
                            <span data-role="narrative-label">SIGUIENTE ESCENA</span>
                            <kbd>ESPACIO</kbd>
                        </button>

                    </div>

                    <div class="touch-controls" data-role="touch"></div>

                </div>


                <div class="game-foot">

                    <p class="game-hint" data-role="hint"></p>

                    <span class="game-log" data-role="log"></span>

                </div>

            </div>

        `;

    }


    /* =========================================================
       HELPERS DE HUD (reutilizados por los juegos)
       ========================================================= */

    const ui = {

        /** Estadística compacta: ETIQUETA valor */
        stat(name, label, value = "0", options = {}) {

            const text = options.text ? " hud-stat__value--text" : "";

            return `
                <div class="hud-stat${options.highlight ? " is-highlight" : ""}">
                    <span class="hud-stat__label">${label}</span>
                    <strong
                        class="hud-stat__value${text}"
                        data-stat="${name}"
                    >${value}</strong>
                </div>
            `;

        },


        /** Línea de sistema compacta */
        system(key, value = "-", name = null) {

            return `
                <div class="hud-stat">
                    <span class="hud-stat__label">${key}</span>
                    <strong
                        class="hud-stat__value hud-stat__value--text"
                        ${name ? `data-stat="${name}"` : ""}
                    >${value}</strong>
                </div>
            `;

        },


        label(text) {
            return `<span class="hud-label">${text}</span>`;
        },


        divider() {
            return `<span class="hud-divider" aria-hidden="true"></span>`;
        },


        lives(name, count = 3) {

            const pips = [];

            for (let i = 0; i < count; i += 1) {
                pips.push(`<i class="lives__pip" data-lives="${name}"></i>`);
            }

            return `
                <div class="hud-stat">
                    <span class="hud-stat__label">LIVES</span>
                    <div class="lives">${pips.join("")}</div>
                </div>
            `;

        },


        meter(name, label) {

            return `
                <div class="hud-stat">
                    <span class="hud-stat__label">${label}</span>
                    <div class="meter__track">
                        <i class="meter__fill" data-meter="${name}"></i>
                    </div>
                </div>
            `;

        },


        /** Grupo de opciones (modo, dificultad…) */
        switcher(name, options) {

            return `
                <div class="hud-switch" data-switch="${name}">
                    ${options.map((option, index) => `
                        <button
                            class="hud-switch__option${index === 0 ? " is-active" : ""}"
                            data-${name}="${option.value}"
                            type="button"
                        >${option.label}</button>
                    `).join("")}
                </div>
            `;

        },


        /** Botón compacto de acción */
        action(name, label, glyph = "") {

            return `
                <button
                    class="hud-button"
                    data-action="${name}"
                    type="button"
                >
                    ${glyph ? `<span aria-hidden="true">${glyph}</span>` : ""}
                    ${label}
                </button>
            `;

        }

    };


    /* =========================================================
       OVERLAY
       ========================================================= */

    function buildOverlay(container, config) {

        container.innerHTML = "";
        container.className = "game-overlay";

        if (config.variant) {
            container.classList.add(`game-overlay--${config.variant}`);
        }


        if (config.eyebrow) {

            container.appendChild(
                utils.create("span", "game-overlay__eyebrow", config.eyebrow)
            );

        }


        if (config.title) {

            container.appendChild(
                utils.create("h3", "game-overlay__title", config.title)
            );

        }


        /* Diablito + frase (burla / excusa) */
        if (config.taunt) {

            const taunt = utils.create("figure", "taunt");

            taunt.dataset.face = config.taunt.face;

            taunt.innerHTML = A.taunts.faceMarkup(config.taunt.face);

            container.appendChild(taunt);

            container.appendChild(
                utils.create(
                    "p",
                    "taunt__phrase",
                    "“" + config.taunt.text + "”"
                )
            );

        }


        if (config.text) {

            container.appendChild(
                utils.create("p", "game-overlay__text", config.text)
            );

        }


        if (config.score) {

            const score = utils.create("div", "game-overlay__score");

            const value = config.score.value != null
                ? utilScore(config.score.value, config.score.format)
                : "—";

            score.innerHTML = `
                <span>${config.score.label || "SCORE"}</span>
                <strong>${value}</strong>
            `;

            if (config.score.best != null) {

                const best = utils.create("span");

                best.textContent = config.score.isRecord
                    ? "NEW RECORD!"
                    : `BEST ${utilScore(config.score.best, config.score.format)}`;

                if (config.score.isRecord) {
                    best.style.color = "var(--color-amber)";
                }

                score.appendChild(best);

            }

            container.appendChild(score);

        }


        /* Recompensa persistente separada del score local de cada ROM. */
        if (config.reward && config.reward.label) {
            const reward = utils.create("p", "game-overlay__vip-reward");
            reward.textContent = config.reward.label;
            container.appendChild(reward);

            if (config.reward.reaction && config.reward.reaction.name) {
                container.appendChild(utils.create(
                    "p",
                    "game-overlay__vip-reaction",
                    `${config.reward.reaction.name}: ${config.reward.reaction.text}`
                ));
            }
        }


        if (config.actions && config.actions.length) {

            const actions = utils.create("div", "game-overlay__actions");

            config.actions.forEach((action) => {

                const button = utils.create(
                    "button",
                    `btn ${action.primary ? "btn--accent" : "btn--ghost"} btn--small`
                );

                button.type = "button";

                button.innerHTML = `
                    ${action.icon ? `<span class="btn__icon">${action.icon}</span>` : ""}
                    <span class="btn__label">${action.label}</span>
                    ${action.key ? `<kbd class="btn__key">${action.key}</kbd>` : ""}
                `;

                button.addEventListener("click", () => {

                    A.audio.play("select");

                    action.onClick();

                });

                actions.appendChild(button);

            });

            container.appendChild(actions);

        }


        if (config.hint) {

            container.appendChild(
                utils.create("p", "game-overlay__hint", config.hint)
            );

        }


        container.hidden = false;

    }


    function utilScore(value, format) {

        if (format === "time") {
            return utils.formatClock(value);
        }

        if (format === "raw") {
            return String(value);
        }

        return utils.formatScore(value);

    }


    /* =========================================================
       GAME SHELL
       ========================================================= */

    class GameShell {

        constructor(def) {

            this.def = def;
            this.id = def.id;

            this.state = "ready";       /* ready | running | paused | over | won */
            this.instance = null;
            this.mounted = false;

            this.best = A.storage.getBest(def.id);

            this.touchConfig = null;
            this.touchTimers = new Map();

            /* Una historia puede venir del hilo global o de una campaña.
               El mismo botón visible evita depender de un teclado físico. */
            this.narrativeControl = null;

            this.unsubscribeInput = null;


            /* ---------- DOM ---------- */

            this.root = utils.create("section", "game-screen");
            this.root.dataset.game = def.id;
            this.root.hidden = true;
            this.root.setAttribute("aria-label", `Juego: ${def.name}`);

            this.root.style.setProperty("--accent", def.accent);
            this.root.style.setProperty("--accent-rgb", def.accentRgb);

            this.root.innerHTML = template(def);

            this.refs = {

                hud: this.q('[data-role="hud"]'),
                overlay: this.q('[data-role="overlay"]'),
                stage: this.q('[data-role="stage"]'),
                touch: this.q('[data-role="touch"]'),
                narrativeControl: this.q('[data-role="narrative-control"]'),
                narrativeLabel: this.q('[data-role="narrative-label"]'),
                hint: this.q('[data-role="hint"]'),
                log: this.q('[data-role="log"]'),
                soundGlyph: this.q('[data-role="sound-glyph"]')

            };

            /* El HUD se actualiza desde el bucle de los juegos. Guardar
               nodos y último valor evita consultas DOM y reflows 60 veces
               por segundo cuando, por ejemplo, dinero y arma no cambiaron. */
            this._statNodes = new Map();
            this._statValues = new Map();
            this._meterNodes = new Map();
            this._meterValues = new Map();

            /* Soporte transversal de compañero. La configuración sigue
               existiendo para las ROM, pero su representación pertenece al
               mundo de cada campaña; el shell no monta un overlay fijo. */
            this.vipSupport = null;
            this._vipFocusRemaining = 0;
            this._vipSupportElapsed = 0;


            /* ---------- Barra ---------- */

            this.q('[data-action="back"]').addEventListener("click", () => {

                A.audio.play("back");

                A.router.go("hub");

            });

            this.q('[data-action="pause"]').addEventListener("click", () => {
                this.togglePause();
            });

            this.q('[data-action="restart"]').addEventListener("click", () => {
                this.restart();
            });

            this.q('[data-action="sound"]').addEventListener("click", () => {

                A.audio.toggle();

                if (typeof A.syncSoundUI === "function") {
                    A.syncSoundUI();
                }

            });

            if (this.refs.narrativeControl) {
                this.refs.narrativeControl.addEventListener("click", () => {
                    this.advanceNarrative();
                });
            }

            /* ---------- Bucle ---------- */

            this.loop = new A.Loop({
                onUpdate: (dt) => this._update(dt),
                onRender: () => this._render(),
                onFps: (fps) => {
                    this.setStat("fps", fps);

                    /* Un juego puede bajar detalle si el navegador ya está
                       entregando pocos frames; los demás ignoran este hook. */
                    if (this.instance && typeof this.instance.onFps === "function") {
                        this.instance.onFps(fps);
                    }
                }
            });

        }


        /* ---------------------------------------------------------
           Consultas
           --------------------------------------------------------- */

        q(selector) {
            return this.root.querySelector(selector);
        }


        setStat(name, value) {

            const next = String(value);

            if (this._statValues.get(name) === next) {
                return;
            }

            let node = this._statNodes.get(name);

            if (node === undefined) {
                node = this.q(`[data-stat="${name}"]`) || null;
                this._statNodes.set(name, node);
            }

            if (node) {
                node.textContent = next;
            }

            this._statValues.set(name, next);

        }


        setMeter(name, ratio) {

            const next = `${utils.clamp(ratio, 0, 1) * 100}%`;

            if (this._meterValues.get(name) === next) {
                return;
            }

            let node = this._meterNodes.get(name);

            if (node === undefined) {
                node = this.q(`[data-meter="${name}"]`) || null;
                this._meterNodes.set(name, node);
            }

            if (node) {
                node.style.width = next;
            }

            this._meterValues.set(name, next);

        }


        setLives(name, remaining) {

            utils.qsa(`[data-lives="${name}"]`, this.root).forEach((pip, index) => {

                pip.classList.toggle("is-lost", index >= remaining);

            });

        }


        setHint(text) {

            if (this.refs.hint) {
                this.refs.hint.textContent = text || "";
            }

        }


        setLog(text) {

            if (this.refs.log) {
                this.refs.log.textContent = text || "";
            }

        }


        setStatus(text) {

            const node = this.q('[data-stat="status"]');

            if (node) {
                node.textContent = text;
            }

        }


        /* ---------------------------------------------------------
           Ciclo de vida
           --------------------------------------------------------- */

        mount() {

            if (this.mounted) {
                return;
            }

            this.mounted = true;

            /* HUD compacto + controles propios del juego */
            this.refs.hud.innerHTML =
                (this.def.hud || "") + (this.def.controls || "");

            this._statNodes.clear();
            this._statValues.clear();
            this._meterNodes.clear();
            this._meterValues.clear();


            /* Si la barra, el HUD o el pie cambian de alto (carga de
               fuentes, ajustes del sistema…) se vuelve a medir: así
               no aparece scroll ni por un píxel. */
            if (typeof ResizeObserver === "function") {

                if (this._chromeObserver) {
                    this._chromeObserver.disconnect();
                }

                let frame = null;

                this._chromeObserver = new ResizeObserver(() => {

                    if (frame !== null) {
                        return;
                    }

                    frame = requestAnimationFrame(() => {
                        frame = null;
                        this._updateStageReserve();
                        this._updateStageFit();
                    });

                });

                [
                    this.q(".game-bar"),
                    this.refs.hud,
                    this.refs.touch,
                    this.q(".game-foot")
                ].forEach((node) => {

                    if (node) {
                        this._chromeObserver.observe(node);
                    }

                });

            }

            this.setHint(this.def.hint || "");

            this.setStat("best", utils.formatScore(this.best));


            /* Botones de salida declarados en el HUD */
            utils.qsa('[data-action="back"]', this.refs.hud)
                .forEach((button) => {

                    button.addEventListener("click", () => {

                        A.audio.play("back");

                        A.router.go("hub");

                    });

                });


            /* El marco se adapta a la forma real de la pantalla
               antes de construir el juego: así la rejilla nace
               con las medidas correctas. */
            this._updateStageReserve();
            this._updateStageFit();

            if (typeof this.def.create === "function") {
                this.instance = this.def.create(this);
            }

            this._updateStageReserve();
            this._updateStageFit();

            this.showReady();

        }


        activate() {

            /* Primero se muestra: el lienzo necesita medidas reales */
            this.root.hidden = false;
            this._syncGameViewport();

            this.mount();

            /* Al terminar de cargar las fuentes el HUD puede crecer un
               par de píxeles: se vuelve a medir para que no aparezca
               ni un pixel de scroll. */
            if (!this._fontsReady) {

                this._fontsReady = true;

                if (document.fonts && document.fonts.ready) {

                    document.fonts.ready.then(() => {
                        this.refit();
                    });

                }

            }

            if (!this._onWindowResize) {

                this._onWindowResize = utils.debounce(() => {

                    this._syncGameViewport();
                    /* El número de columnas y el dock táctil pueden cambiar
                       en la misma rotación; el shell no depende de que la
                       capa global reciba ese resize antes que él. */
                    this._updateTouchVisibility();
                    this._updateStageReserve();
                    this._updateStageFit();

                    if (
                        this.instance &&
                        typeof this.instance.layout === "function"
                    ) {
                        this.instance.layout(this.stageRatio);
                    }

                }, 140);

                window.addEventListener("resize", this._onWindowResize);

            }

            /* Algunos navegadores móviles anuncian orientationchange antes
               de recalcular `innerHeight`. Repetimos el encaje en el frame
               siguiente para que tanto el canvas como los botones queden
               dentro de la zona visible tras girar el dispositivo. */
            if (!this._onOrientationChange) {

                this._onOrientationChange = () => {

                    this._syncGameViewport();
                    this._updateTouchVisibility();

                    const settle = () => this.refit();

                    if (typeof window.requestAnimationFrame === "function") {
                        window.requestAnimationFrame(settle);
                    } else {
                        setTimeout(settle, 0);
                    }

                };

                window.addEventListener("orientationchange", this._onOrientationChange);

            }

            /* En móviles el alto útil cambia al ocultar la barra del
               navegador, abrir el teclado o rotar. visualViewport permite
               conservar el tablero dentro del área realmente visible. */
            if (!this._onVisualViewportResize && window.visualViewport) {
                this._onVisualViewportResize = utils.debounce(() => this.refit(), 80);
                window.visualViewport.addEventListener("resize", this._onVisualViewportResize);
                window.visualViewport.addEventListener("scroll", this._onVisualViewportResize);
            }

            this.loop.start();

            /* deactivate() conserva una partida pausada. Loop.start()
               restablece su bandera interna, así que la restauramos para
               que ni lógica ni render sigan trabajando bajo la modal. */
            if (this.state === "paused") {
                this.loop.pause();
            }

            /* Si se vuelve a entrar tras terminar, se empieza de cero */
            if (this.state === "over" || this.state === "won") {

                this.state = "ready";

                if (this.instance && typeof this.instance.restart === "function") {
                    this.instance.restart();
                } else if (this.instance && typeof this.instance.start === "function") {
                    this.instance.start();
                }

                this.showReady();

                this.loop.pause();

                /* restart() prepara el estado de algunos juegos y puede
                   arrancar medios propios. La pantalla READY aún no es una
                   partida: déjalos pausados hasta que el jugador confirme. */
                if (this.instance && typeof this.instance.pause === "function") {
                    this.instance.pause();
                }

            }

            /* Pista de música propia del juego */
            if (this.def.music) {
                A.audio.music(this.def.music);
            }

            this.unsubscribeInput = A.input.subscribe(
                (key, event) => this.handleKey(key, event)
            );

            this.unsubscribeInputUp = A.input.subscribeUp(
                (key, event) => this.handleKeyUp(key, event)
            );

            this._updateTouchVisibility();
            this._syncNarrativeControl();

        }


        deactivate() {

            this.root.hidden = true;

            this.loop.stop();

            if (this.state === "running") {
                this.pause(true);
            }

            if (this._chromeObserver) {
                this._chromeObserver.disconnect();
            }

            if (this.unsubscribeInput) {
                this.unsubscribeInput();
                this.unsubscribeInput = null;
            }

            if (this.unsubscribeInputUp) {
                this.unsubscribeInputUp();
                this.unsubscribeInputUp = null;
            }

            if (this.def.music) {
                A.audio.stopMusic();
            }

            this._releaseKeys();

            if (this._onWindowResize) {
                window.removeEventListener("resize", this._onWindowResize);
                this._onWindowResize = null;
            }

            if (this._onOrientationChange) {
                window.removeEventListener("orientationchange", this._onOrientationChange);
                this._onOrientationChange = null;
            }

            if (this._onVisualViewportResize && window.visualViewport) {
                window.visualViewport.removeEventListener("resize", this._onVisualViewportResize);
                window.visualViewport.removeEventListener("scroll", this._onVisualViewportResize);
                this._onVisualViewportResize = null;
            }

            this._clearTouchTimers();

        }


        _update(dt) {

            /* La cinemática congela el juego mientras se cuenta */
            if (this.story) {

                this.story.update(dt);

                if (this.story.done) {
                    this._endStory();
                }

                return;

            }

            if (
                this.state === "running" &&
                this.instance &&
                typeof this.instance.update === "function"
            ) {

                const support = this.vipSupport;
                const slowed = this._vipFocusRemaining > 0 && support;
                const gameDt = slowed
                    ? dt * Math.max(0.2, Math.min(1, Number(support.timeScale) || 1))
                    : dt;

                this.instance.update(gameDt);
                this._updateVipSupport(dt);

            }

        }


        _render() {

            /* Se sigue pintando el juego debajo, y encima la
               cinemática: así el corte no es brusco. */
            if (this.instance && typeof this.instance.render === "function") {
                this.instance.render();
            }

            if (this.story) {
                this.story.render();
            }

        }


        /* ---------------------------------------------------------
           CONTROL NARRATIVO UNIVERSAL

           Cualquier campaña puede ofrecer una escena sin construir un
           teclado táctil nuevo. El botón sólo existe mientras hay lectura
           pendiente y ejecuta exactamente la misma acción que ESPACIO.
           --------------------------------------------------------- */

        setNarrativeControl(config) {

            this.narrativeControl = config && typeof config.onActivate === "function"
                ? config
                : null;
            this._syncNarrativeControl();

        }


        _syncNarrativeControl() {

            const button = this.refs && this.refs.narrativeControl;

            if (!button) {
                return;
            }

            const config = this.narrativeControl;
            const active = Boolean(config);

            button.hidden = !active;
            button.disabled = !active;
            this.root.classList.toggle("is-narrative-open", active);
            button.setAttribute(
                "aria-label",
                active
                    ? `${config.label || "Siguiente escena"}. También puedes pulsar Espacio.`
                    : ""
            );

            if (this.refs.narrativeLabel) {
                this.refs.narrativeLabel.textContent = active
                    ? (config.label || "SIGUIENTE ESCENA")
                    : "SIGUIENTE ESCENA";
            }

        }


        advanceNarrative() {

            const control = this.narrativeControl;

            if (!control || typeof control.onActivate !== "function") {
                return false;
            }

            const advanced = control.onActivate();
            this._syncNarrativeControl();

            return advanced !== false;

        }


        /* ---------------------------------------------------------
           HILO NARRATIVO

           Cualquier juego puede pedir que se cuente su capítulo.
           El shell lo reproduce sobre su propio lienzo, así que
           los nueve lo heredan sin tocar su código.
           --------------------------------------------------------- */

        /* Lo llaman los juegos al puntuar. Si toca capítulo, lo lanza. */
        checkStory(score) {

            if (!A.story || this.story) {
                return false;
            }

            const chapter = A.story.check(this.id, score);

            if (!chapter) {
                return false;
            }

            this.playStory(chapter);

            return true;

        }


        playStory(chapter) {

            /* El lienzo lo crea cada juego, no el shell */
            const stage = this.instance && this.instance.stage;

            if (!A.story || !stage) {
                return;
            }

            /* Se pausa el juego, pero el bucle sigue vivo para
               poder animar la cinemática. */
            this._storyState = this.state;

            this.state = "story";

            this.story = new A.story.StoryPlayer(stage, chapter);
            this.setNarrativeControl({
                label: "SIGUIENTE ESCENA",
                onActivate: () => {
                    if (!this.story) {
                        return false;
                    }
                    this.story.next();
                    return true;
                }
            });

            A.audio.music("secreta");

            A.audio.play("secreto");

        }


        _endStory() {

            this.story = null;
            this.setNarrativeControl(null);

            this.state = this._storyState || "running";

            /* Si una campaña mantenía un dossier manual debajo del capítulo
               global, le devolvemos su propio control al cerrar esta capa. */
            if (this.instance && typeof this.instance.syncNarrativeControl === "function") {
                this.instance.syncNarrativeControl();
            }

            this._storyState = null;

            /* Vuelve la música del juego */
            if (this.def && this.def.music) {
                A.audio.music(this.def.music);
            }

            this.setLog("CAPÍTULO DESBLOQUEADO");

        }


        /* ---------------------------------------------------------
           Estados
           --------------------------------------------------------- */

        showReady() {

            this.state = "ready";
            this._clearVipSupport();

            const ticketId = this._vipTicketId();
            const ticket = A.vip && typeof A.vip.ticketFor === "function"
                ? A.vip.ticketFor(ticketId)
                : null;
            const requiresTicket = Boolean(
                ticket && A.vip && typeof A.vip.needsTicket === "function" &&
                A.vip.needsTicket(ticketId)
            );
            const ticketNotice = requiresTicket
                ? ` · TICKET ${A.vip.ticketsFor(ticketId)} DISPONIBLE${A.vip.ticketsFor(ticketId) === 1 ? "" : "S"}`
                : ticket
                    ? " · ACCESO ABIERTO PARA AJUSTES"
                    : "";

            this.showOverlay({

                eyebrow: this.def.readyEyebrow || "ARCADE 404",

                title: this.def.readyTitle || "READY?",

                text: (this.def.readyText || "PULSA ENTER PARA EMPEZAR") + ticketNotice,

                actions: [
                    {
                        label: "JUGAR",
                        icon: "▶",
                        key: "ENTER",
                        primary: true,
                        onClick: () => this.start()
                    }
                ],

                hint: "ENTER — EMPEZAR    P — PAUSA    ESC — SALIR"

            });

        }


        /* El registro declara si una campaña usa un ticket distinto de su
           id de ROM. Hoy ambos coinciden, pero leerlo aquí evita una segunda
           lista de campañas en el shell cuando se añada otra misión. */
        _vipTicketId() {
            return (this.def && this.def.vipTicket) || this.id;
        }


        _claimVipEntry() {

            if (!A.vip || typeof A.vip.entry !== "function") {
                return { ok: true, bonus: null, reaction: null, usedItems: [] };
            }

            const entry = A.vip.entry(this._vipTicketId());

            if (entry && entry.ok) {
                return entry;
            }

            this._showTicketRequired(entry || {});
            return null;

        }


        _applyVipEntry(entry) {

            if (!entry) {
                return;
            }

            /* El shell prepara soporte no visual antes de entregar el
               bonus. OP404 crea entonces su mascota en el mapa usando el
               mismo companionId/nivel, sin depender de DOM del shell. */
            this._configureVipSupport(entry);

            if (this.instance && typeof this.instance.applyVipBonus === "function") {
                this.instance.applyVipBonus(entry.bonus || null, entry.usedItems || []);
            }

            const universal = entry.bonus && entry.bonus.universal;
            if (universal && universal.enabled && this.refs && this.refs.hint
                && typeof this.setHint === "function") {
                const companionHint = universal.focusCharges > 0
                    ? `Y — APOYO ${universal.label}`
                    : "COMPAÑERO: NIVEL 2 PARA IMPULSO";
                this.setHint(`${this.def.hint || ""}    ${companionHint}`.trim());
            }

            /* OP404 ya muestra la reacción sobre el sprite caminante.
               Otros juegos conservan un aviso transitorio, no un panel fijo. */
            if (entry.reaction && this.id !== "op404") {
                this._showCompanionSignal(entry.reaction);
            }

            if (entry.usedItems && entry.usedItems.length) {
                this.setLog(`VIP · ${entry.usedItems.length} SUMINISTRO${entry.usedItems.length === 1 ? "" : "S"} APLICADO${entry.usedItems.length === 1 ? "" : "S"}`);
            }

        }


        _openVipTicketDesk() {
            if (A.vipCentral && typeof A.vipCentral.openMerchant === "function") {
                A.vipCentral.openMerchant();
            }
            A.router.go("vip");
        }


        _showTicketRequired(entry) {

            const ticket = entry.ticket || (A.vip && A.vip.ticketFor ? A.vip.ticketFor(this._vipTicketId()) : null);
            const name = ticket ? ticket.name : (this.def.name || "ESTE JUEGO");

            this.state = "ready";
            this.loop.pause();
            this._releaseKeys();
            this.setLog("TICKET REQUERIDO · VIP CENTRAL");

            this.showOverlay({
                variant: "ticket",
                eyebrow: "VIP CENTRAL // CONTROL DE ACCESO",
                title: "TICKET REQUERIDO",
                text: entry.message || `${name} necesita un TICKET DE ACCESO. Los juegos libres te dan FICHAS VIP para emitir otro.`,
                actions: [
                    {
                        label: "VIP CENTRAL",
                        icon: "◈",
                        key: "V",
                        primary: true,
                        onClick: () => this._openVipTicketDesk()
                    },
                    {
                        label: "ARCADE",
                        onClick: () => A.router.go("hub")
                    }
                ],
                hint: "V — VIP CENTRAL    ESC — VOLVER AL ARCADE"
            });

        }


        /* ---------------------------------------------------------
           COMPAÑERO DE CAMPO + IMPULSO TRANSVERSAL

           El shell conserva sólo estado de soporte y la tecla Y. Ninguna
           insignia ni riel de espectadores se monta sobre el escenario: OP404
           toma estos datos y renderiza su mascota como entidad caminante del mapa.
           --------------------------------------------------------- */

        _clearVipSupport() {
            this.vipSupport = null;
            this._vipFocusRemaining = 0;
            this._vipSupportElapsed = 0;
        }


        _setVipSupportMood(mood, text) {
            /* Un motor que tenga compañero propio recibe el gesto; las ROM
               simples pueden ignorarlo sin crear otra capa visual. */
            if (this.instance && typeof this.instance.setVipCompanionMood === "function") {
                this.instance.setVipCompanionMood(mood, text);
            }
        }


        _configureVipSupport(entry) {
            const universal = entry && entry.bonus && entry.bonus.universal;
            const companionId = entry && entry.bonus && entry.bonus.companionId;
            const view = A.vip && typeof A.vip.snapshot === "function" ? A.vip.snapshot() : null;
            const active = view && view.companions && companionId
                ? view.companions[companionId]
                : null;

            if (!universal || !universal.enabled || !active || !active.unlocked) {
                this._clearVipSupport();
                return null;
            }

            this.vipSupport = Object.assign({}, universal, {
                companionId,
                companionName: active.name,
                companionLevel: active.level,
                color: active.color
            });
            this._vipFocusRemaining = 0;
            this._vipSupportElapsed = 0;
            return this.vipSupport;
        }


        useVipFocus() {
            const support = this.vipSupport;

            if (this.state !== "running") {
                return false;
            }

            if (!support || !support.enabled) {
                this.setLog("COMPAÑERO · ELIGE UN CANAL EN VIP");
                return false;
            }

            if (this._vipFocusRemaining > 0) {
                this._setVipSupportMood("focus", support.focus || "FOCO ACTIVO");
                return false;
            }

            const available = Math.max(0, Math.floor(Number(support.focusCharges) || 0));
            if (available <= 0) {
                this._setVipSupportMood("watch", "NIVEL 2 PARA IMPULSO");
                this.setLog("COMPAÑERO · NIVEL 2 PARA IMPULSO");
                return false;
            }

            support.focusCharges = available - 1;
            this._vipFocusRemaining = Math.max(320, Math.floor(Number(support.focusDuration) || 0));
            this._vipSupportElapsed = 0;
            this._setVipSupportMood("focus", support.focus || support.label || "FOCO ACTIVO");
            this.setLog(`COMPAÑERO · ${support.label} ACTIVO`);

            if (this.instance && typeof this.instance.onVipFocus === "function") {
                this.instance.onVipFocus(support);
            }

            if (A.audio && typeof A.audio.play === "function") {
                A.audio.play("select");
            }

            return true;
        }


        _updateVipSupport(dt) {
            const support = this.vipSupport;

            if (!support || this.state !== "running") {
                return;
            }

            const elapsed = Math.max(0, Number(dt) || 0);
            if (this._vipFocusRemaining > 0) {
                this._vipFocusRemaining = Math.max(0, this._vipFocusRemaining - elapsed);
                if (this._vipFocusRemaining === 0) {
                    this._setVipSupportMood("watch", support.watch || "EN FORMACIÓN");
                    if (this.instance && typeof this.instance.onVipFocusEnd === "function") {
                        this.instance.onVipFocusEnd();
                    }
                }
                return;
            }

            /* El contador no se dibuja, pero mantiene un pulso de estado
               interno para motores que quieran leer apoyo sin recargar UI. */
            this._vipSupportElapsed += elapsed;
            if (this._vipSupportElapsed >= 4800) {
                this._vipSupportElapsed = 0;
            }
        }

        _showCompanionSignal(reaction) {

            const host = this.q(".stage-frame");

            if (!host || !reaction) {
                return;
            }

            let toast = this.q(".stage-toast--companion");

            if (!toast) {
                toast = utils.create("div", "stage-toast stage-toast--companion");
                host.appendChild(toast);
            }

            toast.style.setProperty("--companion-color", reaction.color || "var(--color-cyan)");
            toast.innerHTML = `<span class="stage-toast__body"><b class="stage-toast__eyebrow">${reaction.name} // CANAL ACTIVO</b><span class="stage-toast__text">${reaction.text}</span></span>`;
            toast.classList.add("is-visible");

            if (this._companionToastTimer) {
                clearTimeout(this._companionToastTimer);
            }

            this._companionToastTimer = setTimeout(() => {
                if (toast) {
                    toast.classList.remove("is-visible");
                }
            }, 4800);

        }


        start() {

            if (this.state === "running") {
                return;
            }

            const entry = this._claimVipEntry();

            if (!entry) {
                return;
            }

            this.hideOverlay();

            this.state = "running";

            this.loop.resume();

            A.audio.play("start");

            if (this.instance && typeof this.instance.start === "function") {
                this.instance.start();
            }

            this._applyVipEntry(entry);

        }


        restart() {

            if (this.state === "running") {
                return;
            }

            const entry = this._claimVipEntry();

            if (!entry) {
                return;
            }

            this.hideOverlay();

            this.state = "running";

            this.loop.resume();

            if (this.def.music) {
                A.audio.music(this.def.music);
            }

            A.audio.duckMusic(false);

            A.audio.play("start");

            if (this.instance && typeof this.instance.restart === "function") {

                this.instance.restart();

            } else if (this.instance && typeof this.instance.start === "function") {

                this.instance.start();

            }

            this._applyVipEntry(entry);

        }


        pause(silent = false) {

            if (this.state !== "running") {
                return;
            }

            this.state = "paused";
            this._setVipSupportMood("pause", "EN PAUSA");

            this.loop.pause();

            this._releaseKeys();
            this._clearTouchTimers();

            /* Algunos juegos (como TURNO 404) usan medios locales
               además del sintetizador. Les damos el mismo ciclo de
               pausa que al bucle principal sin exigirlo a los demás. */
            if (this.instance && typeof this.instance.pause === "function") {
                this.instance.pause();
            }

            A.audio.duckMusic(true);

            if (!silent) {
                A.audio.play("pause");
            }

            this.showOverlay({

                variant: "paused",

                eyebrow: "SYSTEM HALTED",

                title: "PAUSED",

                text: "PARTIDA EN PAUSA",

                actions: [
                    {
                        label: "CONTINUAR",
                        icon: "▶",
                        key: "P",
                        primary: true,
                        onClick: () => this.resume()
                    },
                    {
                        label: "REINICIAR",
                        onClick: () => this.restart()
                    }
                ],

                hint: "P — CONTINUAR    ESC — SALIR"

            });

        }


        resume() {

            if (this.state !== "paused") {
                return;
            }

            this.hideOverlay();

            this.state = "running";
            this._setVipSupportMood("watch", this.vipSupport && this.vipSupport.watch ? this.vipSupport.watch : "MIRANDO");

            this.loop.resume();

            if (this.instance && typeof this.instance.resume === "function") {
                this.instance.resume();
            }

            A.audio.duckMusic(false);

            A.audio.play("select");

        }


        togglePause() {

            if (this.state === "running") {
                this.pause();
            } else if (this.state === "paused") {
                this.resume();
            }

        }


        /**
         * Cierre con diablito.
         * kind: "mock" (te burlas de mí) | "excuse" (no acepto que perdí)
         */
        taunt(kind, options = {}) {

            /* Una señal tardía del juego no puede cerrar/recompensar dos
               veces la misma entrada. Sólo una partida viva llega a finish. */
            if (this.state !== "running") {
                return;
            }

            const excuse = kind === "excuse";

            this.state = excuse ? "won" : "over";

            const taunt = excuse
                ? A.taunts.excuse(this.id)
                : A.taunts.mock(this.id);

            const vipReward = this._finish(excuse ? "won" : "over", options);

            this.showOverlay({

                variant: excuse ? "taunt-win" : "taunt-lose",

                eyebrow: taunt.eyebrow,

                title: taunt.title,

                taunt: taunt,

                text: options.text || "",

                score: {
                    label: options.scoreLabel || "SCORE",
                    value: options.score || 0,
                    format: options.scoreFormat,
                    best: this.best,
                    isRecord: this.record
                },

                reward: vipReward,

                actions: [
                    {
                        label: "RETRY",
                        icon: "↻",
                        key: "ENTER",
                        primary: true,
                        onClick: () => this.restart()
                    },
                    {
                        label: "ARCADE",
                        onClick: () => A.router.go("hub")
                    }
                ],

                hint: "ENTER — OTRA PARTIDA    ESC — SALIR"

            });

        }


        gameOver(options = {}) {

            if (this.state !== "running") {
                return;
            }

            if (options.taunt) {
                this.taunt("mock", options);
                return;
            }

            this.state = "over";

            const vipReward = this._finish("over", options);

            this.showOverlay({

                variant: "over",

                eyebrow: options.eyebrow || "SIGNAL LOST",

                title: options.title || "GAME OVER",

                text: options.text || "",

                score: {
                    label: options.scoreLabel || "SCORE",
                    value: options.score || 0,
                    format: options.scoreFormat,
                    best: this.best,
                    isRecord: this.record
                },

                reward: vipReward,

                actions: [
                    {
                        label: "RETRY",
                        icon: "↻",
                        key: "ENTER",
                        primary: true,
                        onClick: () => this.restart()
                    },
                    {
                        label: "ARCADE",
                        onClick: () => A.router.go("hub")
                    }
                ],

                hint: "ENTER — OTRA PARTIDA    ESC — SALIR"

            });

        }


        win(options = {}) {

            if (this.state !== "running") {
                return;
            }

            if (options.taunt) {
                this.taunt("excuse", options);
                return;
            }

            this.state = "won";

            const vipReward = this._finish("won", options);

            this.showOverlay({

                variant: "clear",

                eyebrow: options.eyebrow || "MISSION COMPLETE",

                title: options.title || "YOU WIN",

                text: options.text || "",

                score: {
                    label: options.scoreLabel || "SCORE",
                    value: options.score || 0,
                    format: options.scoreFormat,
                    best: this.best,
                    isRecord: this.record
                },

                reward: vipReward,

                actions: [
                    {
                        label: "PLAY AGAIN",
                        icon: "↻",
                        key: "ENTER",
                        primary: true,
                        onClick: () => this.restart()
                    },
                    {
                        label: "ARCADE",
                        onClick: () => A.router.go("hub")
                    }
                ],

                hint: "ENTER — OTRA PARTIDA    ESC — SALIR"

            });

        }


        _finish(kind, options) {

            const score = options.score || 0;

            const result = A.storage.submitScore(this.id, score);

            this.best = result.best;
            this.record = result.isRecord;

            this.setStat("best", utils.formatScore(this.best));

            this.loop.pause();

            this._releaseKeys();
            this._clearTouchTimers();

            if (this.instance && typeof this.instance.pause === "function") {
                this.instance.pause();
            }

            A.audio.stopMusic();

            A.audio.play(kind === "won" ? "win" : "gameover");

            let vipReward = null;

            if (A.vip && typeof A.vip.completeRun === "function") {
                vipReward = A.vip.completeRun(this.id, score, kind === "won");

                if (vipReward && vipReward.ok) {
                    this.setLog(vipReward.label || "+ FICHAS VIP");
                }
            }

            if (this.vipSupport) {
                this._setVipSupportMood(
                    kind === "won" ? "win" : "loss",
                    kind === "won"
                        ? (this.vipSupport.win || "BUEN CIERRE")
                        : (this.vipSupport.loss || "OTRO INTENTO")
                );
            }

            this.lastVipReward = vipReward;
            return vipReward;

        }


        /* Hito de una campaña larga. OP404 y TURNO404 lo llaman cuando se
           supera una zona/nivel; los juegos de una sola ronda usan _finish. */
        awardVipLevel(score, label) {
            if (!A.vip || typeof A.vip.completeLevel !== "function") {
                return null;
            }

            const reward = A.vip.completeLevel(this.id, score, label);
            if (reward && reward.ok) {
                this.setLog(reward.label || "+ FICHAS VIP · NIVEL");
                if (this.vipSupport) {
                    this._setVipSupportMood("win", this.vipSupport.win || "HITO LIMPIO");
                }
            }

            return reward;
        }


        /* ---------------------------------------------------------
           Overlay
           --------------------------------------------------------- */

        showOverlay(config) {

            this.overlayConfig = config;

            buildOverlay(this.refs.overlay, config);

        }


        /**
         * Aviso flotante dentro del tablero: la máquina suelta una
         * excusa cuando pasas de nivel. No interrumpe la partida.
         */
        levelUpTaunt(options = {}) {

            const host = this.q(".stage-frame");

            if (!host || !A.taunts) {
                return;
            }

            let toast = this.q(".stage-toast");

            if (!toast) {

                toast = utils.create("div", "stage-toast");

                host.appendChild(toast);

            }

            const taunt = A.taunts.levelUp(this.id);

            const face = options.face || taunt.face;

            toast.dataset.face = face;

            toast.innerHTML = [
                `<span class="stage-toast__face">`,
                A.taunts.faceMarkup(face),
                `</span>`,
                `<span class="stage-toast__body">`,
                `<b class="stage-toast__eyebrow">${taunt.eyebrow}</b>`,
                `<span class="stage-toast__title">${taunt.title}</span>`,
                `<span class="stage-toast__text">${options.text || taunt.text}</span>`,
                `</span>`
            ].join("");

            toast.classList.add("is-visible");

            if (this._toastTimer) {
                clearTimeout(this._toastTimer);
            }

            this._toastTimer = setTimeout(() => {

                if (toast) {
                    toast.classList.remove("is-visible");
                }

            }, options.duration || 3400);

            A.audio.play("coin");

        }


        hideOverlay() {

            this.overlayConfig = null;

            this.refs.overlay.hidden = true;

        }


        /* ---------------------------------------------------------
           Teclado
           --------------------------------------------------------- */

        /* Teclas mientras se cuenta un capítulo */
        handleStoryKey(key, event) {

            /* Mantener ESPACIO no debe recorrer una historia entera por la
               repetición nativa del teclado: un gesto, una escena. */
            if (event && event.repeat) {
                return true;
            }

            if (key === "Escape") {

                this.story.skip();

                return true;

            }

            if (key === "Enter" || key === " " || key === "Spacebar") {

                this.advanceNarrative();

                return true;

            }

            return true;

        }


        /** Avisa al juego de que se soltó una tecla */
        handleKeyUp(key, event) {

            if (
                this.instance &&
                typeof this.instance.keyUp === "function"
            ) {

                if (key === "*") {

                    if (typeof this.instance.releaseKeys === "function") {
                        this.instance.releaseKeys();
                    }

                    return true;

                }

                return this.instance.keyUp(key, event) === true;

            }

            return false;

        }


        /** Suelta todas las teclas mantenidas del juego actual */
        _releaseKeys() {

            if (!this.instance) {
                return;
            }

            if (typeof this.instance.releaseKeys === "function") {
                this.instance.releaseKeys();
            }

            A.input.clear();

        }


        handleKey(key, event) {

            /* Si se está contando un capítulo manda la cinemática:
               ESC la salta en vez de sacarte al hub. */
            if (this.story) {

                event.preventDefault();

                return this.handleStoryKey(key, event);

            }

            if (key === "Escape" && this.narrativeControl) {

                event.preventDefault();

                if (typeof this.narrativeControl.onSkip === "function") {
                    this.narrativeControl.onSkip();
                    this._syncNarrativeControl();
                    return true;
                }

            }

            if (key === "Escape") {

                event.preventDefault();

                A.router.go("hub");

                return true;

            }


            if (key === "p" || key === "P") {

                event.preventDefault();

                this.togglePause();

                return true;

            }


            if (
                (key === "v" || key === "V") &&
                this.state === "ready" &&
                this.overlayConfig &&
                this.overlayConfig.variant === "ticket"
            ) {
                event.preventDefault();
                this._openVipTicketDesk();
                return true;
            }


            /* El impulso del Companion usa Y: una tecla libre de los controles
               de las ROM actuales. Si el vínculo aún no lo desbloqueó, se deja
               que el juego reciba la tecla normalmente. */
            if ((key === "y" || key === "Y") && this.useVipFocus()) {
                event.preventDefault();
                return true;
            }


            if (key === "Enter" && this.state !== "running") {

                event.preventDefault();

                if (this.state === "paused") {
                    this.resume();
                } else {
                    this.restart();
                }

                return true;

            }


            if (
                this.instance &&
                typeof this.instance.key === "function"
            ) {

                return this.instance.key(key, event) === true;

            }


            return false;

        }


        /* ---------------------------------------------------------
           Controles táctiles
           --------------------------------------------------------- */

        setTouchControls(config) {

            this.touchConfig = config || null;

            const container = this.refs.touch;

            container.innerHTML = "";
            container.classList.remove(
                "is-visible",
                "touch-controls--analog",
                "touch-controls--pointer",
                "touch-controls--fire",
                "touch-controls--drop"
            );
            container.removeAttribute("data-touch-mode");

            this._clearTouchTimers();

            if (!config || config.mode === "none") {
                return;
            }

            container.dataset.touchMode = config.mode;

            if (config.mode === "pointer") {

                /* Los juegos de arrastre ya convierten el lienzo en su
                   superficie de control. Sólo se les añade una indicación
                   ligera y PAUSE: un joystick aquí competiría con el gesto. */
                container.classList.add("touch-controls--pointer");
                container.appendChild(
                    utils.create(
                        "div",
                        "touch-hint",
                        config.hint || "ARRASTRA EN EL ÁREA DE JUEGO PARA MOVER"
                    )
                );

            } else {

                container.classList.add("touch-controls--analog");
                container.appendChild(this._createAnalogStick(config));

            }

            if (config.mode === "dpad-fire") {
                container.classList.add("touch-controls--fire");

                if (String(config.actionLabel || "FIRE").toUpperCase() === "DROP") {
                    container.classList.add("touch-controls--drop");
                }
            }

            this._appendTouchActions(container, config);
            this._updateTouchVisibility();

        }


        /**
         * Construye el stick visual una sola vez por ROM. El shell entrega
         * dos capas de entrada: `onMove` recibe un vector radial normalizado
         * para motores continuos y `onDirection` conserva pulsos cardinales
         * para tableros, laberintos y piezas por casilla.
         */
        _createAnalogStick(config) {

            const stick = utils.create("div", "touch-stick");
            const directions = this._analogDirections(config);

            if (
                directions.length === 2 &&
                directions.includes("left") &&
                directions.includes("right")
            ) {
                stick.classList.add("touch-stick--horizontal");
            }

            if (
                directions.length === 2 &&
                directions.includes("up") &&
                directions.includes("down")
            ) {
                stick.classList.add("touch-stick--vertical");
            }

            stick.setAttribute("role", "group");
            stick.setAttribute("tabindex", "0");
            stick.setAttribute(
                "aria-keyshortcuts",
                "ArrowUp ArrowDown ArrowLeft ArrowRight"
            );
            stick.setAttribute(
                "aria-label",
                config.analogLabel ||
                    "Joystick analógico. Arrastra desde el centro para moverte."
            );
            stick.setAttribute(
                "aria-description",
                "Los controles de teclado del juego siguen disponibles."
            );
            stick.style.setProperty("--stick-x", "0px");
            stick.style.setProperty("--stick-y", "0px");

            const rim = utils.create("span", "touch-stick__rim");
            const axisX = utils.create("span", "touch-stick__axis touch-stick__axis--x");
            const axisY = utils.create("span", "touch-stick__axis touch-stick__axis--y");
            const caption = utils.create("span", "touch-stick__caption", "MOVE");
            const thumb = utils.create("span", "touch-stick__thumb");
            const glyph = utils.create("span", "touch-stick__thumb-glyph", "✦");

            [rim, axisX, axisY, caption].forEach((part) => {
                part.setAttribute("aria-hidden", "true");
                stick.appendChild(part);
            });

            glyph.setAttribute("aria-hidden", "true");
            thumb.setAttribute("aria-hidden", "true");
            thumb.appendChild(glyph);
            stick.appendChild(thumb);

            this._bindAnalogStick(stick, config);

            return stick;

        }


        _appendTouchActions(container, config) {

            if (config.showPause === false && config.mode !== "dpad-fire") {
                return;
            }

            const actions = utils.create("div", "touch-actions");

            if (config.mode === "dpad-fire") {

                const actionLabel = config.actionLabel || "FIRE";
                const fire = utils.create(
                    "button",
                    "touch-btn touch-btn--action"
                );
                const kicker = utils.create("span", "touch-btn__kicker", "ACCIÓN");
                const label = utils.create("strong", "touch-btn__label", actionLabel);

                fire.type = "button";
                fire.setAttribute("aria-label", actionLabel);
                fire.setAttribute("title", actionLabel);
                kicker.setAttribute("aria-hidden", "true");
                label.setAttribute("aria-hidden", "true");
                fire.appendChild(kicker);
                fire.appendChild(label);

                this._bindHold(fire, () => {

                    if (config.onAction) {
                        return config.onAction("fire");
                    }

                    return false;

                }, config.actionRepeat || 130);

                actions.appendChild(fire);

            }


            if (config.showPause !== false) {

                const pause = utils.create(
                    "button",
                    "touch-btn touch-btn--utility"
                );
                const pauseGlyph = utils.create(
                    "span",
                    "touch-btn__pause-glyph",
                    "❚❚"
                );
                const pauseLabel = utils.create("span", "touch-btn__pause-label", "PAUSE");

                pause.type = "button";
                pause.setAttribute("aria-label", "Pausar partida");
                pause.setAttribute("title", "Pausar partida");
                pauseGlyph.setAttribute("aria-hidden", "true");
                pauseLabel.setAttribute("aria-hidden", "true");
                pause.appendChild(pauseGlyph);
                pause.appendChild(pauseLabel);

                pause.addEventListener("click", () => {

                    if (
                        config.onAction &&
                        config.onAction("pause") === true
                    ) {
                        return;
                    }

                    this.togglePause();

                });

                actions.appendChild(pause);

            }

            if (actions.children.length) {
                container.appendChild(actions);
            }

        }


        _analogDirections(config) {

            const valid = ["up", "down", "left", "right"];
            const requested = Array.isArray(config && config.analogDirections)
                ? config.analogDirections.filter((direction) => valid.includes(direction))
                : [];

            return requested.length ? requested : valid;

        }


        _analogDeadzone(config) {

            return Math.max(0.08, Math.min(
                0.7,
                Number(config.analogDeadzone) || 0.22
            ));

        }


        _directionForAnalog(move, config) {

            const deadzone = this._analogDeadzone(config);

            if (!move || move.magnitude < deadzone) {
                return null;
            }

            const x = Number(move.x) || 0;
            const y = Number(move.y) || 0;
            const allowed = this._analogDirections(config);
            const candidates = [];

            if (Math.abs(x) >= deadzone) {
                const horizontal = x < 0 ? "left" : "right";

                if (allowed.includes(horizontal)) {
                    candidates.push({ direction: horizontal, strength: Math.abs(x) });
                }
            }

            if (Math.abs(y) >= deadzone) {
                const vertical = y < 0 ? "up" : "down";

                if (allowed.includes(vertical)) {
                    candidates.push({ direction: vertical, strength: Math.abs(y) });
                }
            }

            candidates.sort((a, b) => b.strength - a.strength);

            return candidates.length ? candidates[0].direction : null;

        }


        _bindAnalogStick(stick, config) {

            let pointerId = null;
            let direction = null;
            let timer = null;

            const repeatEvery = Math.max(55, Number(config.analogRepeat) || 145);

            const emitMove = (move) => {

                if (typeof config.onMove === "function") {
                    config.onMove(move);
                }

            };

            const resetVisual = () => {
                stick.style.setProperty("--stick-x", "0px");
                stick.style.setProperty("--stick-y", "0px");
                stick.classList.remove("is-active");
            };

            const stop = (event) => {

                if (
                    event &&
                    pointerId != null &&
                    event.pointerId != null &&
                    event.pointerId !== pointerId
                ) {
                    return;
                }

                const capturedId = pointerId;

                pointerId = null;
                direction = null;

                clearInterval(timer);
                timer = null;
                this.touchTimers.delete(stick);

                if (stick.releasePointerCapture && capturedId != null) {
                    try {
                        stick.releasePointerCapture(capturedId);
                    } catch (error) {
                        /* El navegador puede haber liberado la captura antes. */
                    }
                }

                resetVisual();
                emitMove({ x: 0, y: 0, magnitude: 0, direction: null });

            };

            const update = (event) => {

                const rect = stick.getBoundingClientRect();
                const width = Math.max(1, rect.width || 1);
                const height = Math.max(1, rect.height || 1);
                const centerX = rect.left + width / 2;
                const centerY = rect.top + height / 2;
                const clientX = Number.isFinite(event.clientX) ? event.clientX : centerX;
                const clientY = Number.isFinite(event.clientY) ? event.clientY : centerY;
                const dx = clientX - centerX;
                const dy = clientY - centerY;
                const inputRadius = Math.max(1, Math.min(width, height) * 0.34);
                const rawMagnitude = Math.hypot(dx, dy);
                const scale = rawMagnitude > inputRadius
                    ? inputRadius / rawMagnitude
                    : 1;
                const rawX = (dx * scale) / inputRadius;
                const rawY = (dy * scale) / inputRadius;
                const normalizedMagnitude = Math.min(1, rawMagnitude / inputRadius);
                const inDeadzone = normalizedMagnitude < this._analogDeadzone(config);
                const x = inDeadzone ? 0 : rawX;
                const y = inDeadzone ? 0 : rawY;
                const magnitude = inDeadzone ? 0 : normalizedMagnitude;
                const nextDirection = this._directionForAnalog(
                    { x, y, magnitude },
                    config
                );
                const thumbTravel = Math.min(width, height) * 0.22;
                const move = { x, y, magnitude, direction: nextDirection };

                stick.style.setProperty("--stick-x", `${(x * thumbTravel).toFixed(2)}px`);
                stick.style.setProperty("--stick-y", `${(y * thumbTravel).toFixed(2)}px`);

                emitMove(move);

                if (
                    nextDirection &&
                    nextDirection !== direction &&
                    typeof config.onDirection === "function"
                ) {
                    config.onDirection(nextDirection);
                }

                direction = nextDirection;

            };

            const start = (event) => {

                if (event.isPrimary === false || pointerId != null) {
                    return;
                }

                event.preventDefault();
                pointerId = event.pointerId != null ? event.pointerId : 0;

                if (stick.setPointerCapture && event.pointerId != null) {
                    try {
                        stick.setPointerCapture(event.pointerId);
                    } catch (error) {
                        /* Algunos webviews no capturan el puntero táctil. */
                    }
                }

                stick.classList.add("is-active");
                update(event);

                if (typeof config.onDirection === "function") {

                    timer = setInterval(() => {

                        if (!direction) {
                            return;
                        }

                        if (config.onDirection(direction) === false) {
                            stop();
                        }

                    }, repeatEvery);

                }

                /* Incluso para motores puramente analógicos guardamos una
                   limpieza: pausa, cambio de ROM o pérdida de foco devuelven
                   el vector a cero sin esperar a que llegue pointerup. */
                this.touchTimers.set(stick, {
                    timer,
                    reset: () => stop()
                });

            };

            const move = (event) => {

                if (
                    pointerId == null ||
                    (event.pointerId != null && event.pointerId !== pointerId)
                ) {
                    return;
                }

                event.preventDefault();
                update(event);

            };

            stick.addEventListener("pointerdown", start);
            stick.addEventListener("pointermove", move);
            stick.addEventListener("pointerup", stop);
            stick.addEventListener("pointercancel", stop);
            stick.addEventListener("lostpointercapture", stop);
            stick.addEventListener("contextmenu", (event) => event.preventDefault());

        }


        _bindHold(button, onPress, repeatEvery = 160) {

            let timer = null;

            const start = (event) => {

                if (event.isPrimary === false) {
                    return;
                }

                event.preventDefault();

                if (button.setPointerCapture && event.pointerId != null) {
                    try {
                        button.setPointerCapture(event.pointerId);
                    } catch (error) {
                        /* Algunos navegadores no capturan punteros sintéticos. */
                    }
                }

                button.classList.add("is-active");

                const shouldRepeat = onPress();

                clearInterval(timer);

                /* Una acción narrativa puede consumir sólo este toque. Así
                   mantener FIRE para cerrar un texto no dispara después por
                   accidente cuando la historia ya desapareció. */
                if (shouldRepeat === false) {
                    button.classList.remove("is-active");
                    this.touchTimers.delete(button);
                    return;
                }

                timer = setInterval(() => {
                    if (onPress() === false) {
                        stop();
                    }
                }, repeatEvery);

                this.touchTimers.set(button, timer);

            };


            const stop = (event) => {

                button.classList.remove("is-active");

                if (event && button.releasePointerCapture && event.pointerId != null) {
                    try {
                        button.releasePointerCapture(event.pointerId);
                    } catch (error) {
                        /* Ya se soltó o el navegador no admite la captura. */
                    }
                }

                clearInterval(timer);

                this.touchTimers.delete(button);

            };


            button.addEventListener("pointerdown", start);
            button.addEventListener("pointerup", stop);
            button.addEventListener("pointercancel", stop);
            button.addEventListener("pointerleave", stop);
            button.addEventListener("lostpointercapture", stop);

        }


        _clearTouchTimers() {

            const entries = Array.from(this.touchTimers.entries());

            this.touchTimers.clear();

            entries.forEach(([control, entry]) => {

                const timer = entry && typeof entry === "object" && "timer" in entry
                    ? entry.timer
                    : entry;

                clearInterval(timer);

                if (entry && typeof entry.reset === "function") {
                    entry.reset();
                }

                if (control && control.classList) {
                    control.classList.remove("is-active");
                }

            });

        }


        _updateTouchVisibility() {

            if (this.touchConfig && this.touchConfig.mode !== "none") {

                /* Un ancho de ventana pequeño no convierte un ratón en dedo.
                   Así el dock nunca reaparece en una ventana de escritorio
                   estrecha ni roba alto al tablero en el preview. */
                const shouldShow = utils.isTouchDevice();

                this.refs.touch.classList.toggle("is-visible", shouldShow);

            } else {

                this.refs.touch.classList.remove("is-visible");

            }

            this._updateStageReserve();

        }


        _viewportHeight() {

            const visual = window.visualViewport;
            const measured = visual && Number.isFinite(visual.height)
                ? visual.height
                : window.innerHeight;

            return Math.max(1, Math.round(Number(measured) || 1));

        }


        _syncGameViewport() {

            if (!this.root) {
                return;
            }

            this.root.style.setProperty("--game-viewport-height", `${this._viewportHeight()}px`);

        }


        /** Vuelve a medir cromo y proporción de una tacada */
        refit() {

            if (this.root.hidden || !this.mounted) {
                return;
            }

            this._syncGameViewport();
            this._updateStageReserve();
            this._updateStageFit();

            if (this.instance && typeof this.instance.layout === "function") {
                this.instance.layout(this.stageRatio);
            }

        }


        /**
         * Forma del tablero: se usa TODO el hueco disponible.
         * El juego declara hasta dónde puede estirarse
         * (def.ratioMin / def.ratioMax) y aquí se calcula la
         * proporción real (ancho / alto libres).
         */
        _updateStageFit() {

            if (this.root.hidden) {
                return;
            }

            const stage = this.q(".game-stage");

            if (!stage) {
                return;
            }

            const chrome = parseFloat(
                getComputedStyle(this.root)
                    .getPropertyValue("--stage-chrome")
            ) || 160;

            const availableHeight = Math.max(
                160,
                this._viewportHeight() - chrome
            );

            const availableWidth = Math.max(
                160,
                stage.clientWidth || (window.innerWidth - 48)
            );

            /* Si el juego no declara límites, se respeta la
               proporción que marca su CSS (tableros fijos). */
            if (
                this.def.ratioMin == null &&
                this.def.ratioMax == null
            ) {
                return;
            }

            const min = this.def.ratioMin != null ? this.def.ratioMin : 0.7;
            const max = this.def.ratioMax != null ? this.def.ratioMax : 1.9;

            const ratio = utils.clamp(
                availableWidth / availableHeight,
                min,
                max
            );

            this.stageRatio = ratio;

            this.root.style.setProperty(
                "--stage-ratio",
                ratio.toFixed(4)
            );

        }


        /**
         * El tablero ocupa todo el alto disponible.
         * Se mide el "cromo" real (barra + HUD + pie + controles táctiles)
         * para que nunca aparezca scroll, sea cual sea la resolución.
         */
        _updateStageReserve() {

            if (this.root.hidden) {
                return;
            }

            const bar = this.q(".game-bar");
            const hud = this.refs.hud;
            const foot = this.q(".game-foot");
            const stage = this.q(".game-stage");

            if (!bar || !hud || !foot || !stage) {
                return;
            }

            const height = (node) => node.getBoundingClientRect().height;

            /* El dock forma parte del flujo en cualquier orientación. Medirlo
               aquí hace que el marco ceda sólo su altura real, sin superponer
               controles sobre el canvas ni reservar una franja fantasma. */
            const touch = this.refs.touch.classList.contains("is-visible")
                ? height(this.refs.touch) + 12
                : 0;

            /* huecos del shell (3 x 9px) + padding de la pantalla + margen
               + colchón para el reflujo de las fuentes */
            const extra = 27 + 18 + 10 + 8;

            const chrome =
                height(bar) +
                height(hud) +
                height(foot) +
                touch +
                extra;

            this.root.style.setProperty(
                "--stage-chrome",
                `${Math.ceil(chrome)}px`
            );

        }


        /* ---------------------------------------------------------
           Limpieza
           --------------------------------------------------------- */

        destroy() {

            this.deactivate();

            if (this.instance && typeof this.instance.destroy === "function") {
                this.instance.destroy();
            }

            this.instance = null;
            this.mounted = false;

            if (this.root.parentNode) {
                this.root.parentNode.removeChild(this.root);
            }

        }

    }


    A.ui = ui;
    A.GameShell = GameShell;

})(window.Arcade404);
