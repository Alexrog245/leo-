/* =========================================================
   ARCADE 404 — ENRUTADOR
   Rutas:
     #/            → pantalla de inicio
     #/hub         → selector de juegos
     #/vip         → VIP Central
     #/game/<id>   → pantalla de un juego
   ========================================================= */

(function (A) {

    "use strict";


    const { utils } = A;


    const screens = {
        home: null,
        hub: null,
        vip: null
    };


    const shells = new Map();

    const listeners = new Set();


    let gameRoot = null;
    let liveRegion = null;

    let current = null;


    /* ---------------------------------------------------------
       Análisis del hash
       --------------------------------------------------------- */

    function parse(hash) {

        const value = String(hash || window.location.hash || "")
            .replace(/^#\/?/, "");

        if (!value) {
            return { type: "home" };
        }

        const parts = value.split("/");

        if (parts[0] === "hub") {
            return { type: "hub" };
        }

        if (parts[0] === "vip") {
            return { type: "vip" };
        }

        if (parts[0] === "game" && parts[1]) {
            return { type: "game", id: parts[1] };
        }

        return { type: "home" };

    }


    function toHash(route) {

        if (route.type === "hub") {
            return "#/hub";
        }

        if (route.type === "vip") {
            return "#/vip";
        }

        if (route.type === "game") {
            return `#/game/${route.id}`;
        }

        return "#/";

    }


    /* ---------------------------------------------------------
       Shells de juego (creación diferida)
       --------------------------------------------------------- */

    function getShell(id) {

        if (shells.has(id)) {
            return shells.get(id);
        }

        const def = A.getGame(id);

        if (!def) {
            return null;
        }

        const shell = new A.GameShell(def);

        gameRoot.appendChild(shell.root);

        shells.set(id, shell);

        return shell;

    }


    /* ---------------------------------------------------------
       Render
       --------------------------------------------------------- */

    function render(route) {

        const previous = current;

        /* Se actualiza antes: si algo falla, el estado no se queda
           apuntando a la pantalla anterior. */
        current = route;


        /* Salida de la pantalla anterior */

        if (previous && previous.type === "game") {

            const shell = shells.get(previous.id);

            if (shell) {
                shell.deactivate();
            }

        }


        /* Entrada en la nueva pantalla */

        screens.home.hidden = route.type !== "home";
        screens.hub.hidden = route.type !== "hub";
        if (screens.vip) {
            screens.vip.hidden = route.type !== "vip";
        }


        if (route.type === "game") {

            const shell = getShell(route.id);

            if (!shell) {

                window.location.hash = "#/hub";

                return;

            }

            try {

                shell.activate();

            } catch (error) {

                console.error(
                    "[ARCADE 404] Error al abrir el juego:",
                    error
                );

                shell.root.hidden = true;

                window.location.hash = "#/hub";

                return;

            }

        }


        document.body.classList.toggle(
            "is-gaming",
            route.type === "game"
        );

        /* HOME es una portada inmersiva: sus propios elementos ocupan el
           viewport y la barra/cierre general vuelven al navegar al hub. */
        document.body.classList.toggle(
            "is-home",
            route.type === "home"
        );

        /* El selector conserva el distrito de HOME como fondo oscuro;
           esta clase activa su capa sin afectar las pantallas de juego. */
        document.body.classList.toggle(
            "is-hub",
            route.type === "hub"
        );

        document.body.classList.toggle(
            "is-vip",
            route.type === "vip"
        );


        if (route.type === "hub" && A.hub) {

            A.hub.refresh();

            if (typeof A.hub.playEntrance === "function") {
                A.hub.playEntrance();
            }

            if (previous && previous.type === "home") {
                A.hub.focusSelected(false);
            }

        }


        if (route.type === "vip" && A.vipCentral && typeof A.vipCentral.refresh === "function") {
            A.vipCentral.refresh();
        }


        if (liveRegion) {

            const messages = {

                home: "Pantalla de inicio",
                hub: "Selector de juegos",
                vip: "VIP Central",
                game: (() => {

                    const def = A.getGame(route.id);

                    return def ? `Juego ${def.name}` : "Juego";

                })()

            };

            liveRegion.textContent = messages[route.type] || "";

        }


        listeners.forEach((listener) => {

            try {
                listener(route, previous);
            } catch (error) {
                console.error("[ARCADE 404] Error en listener de ruta:", error);
            }

        });

    }


    function onHashChange() {
        render(parse(window.location.hash));
    }


    /* ---------------------------------------------------------
       API pública
       --------------------------------------------------------- */

    A.router = {

        init(options = {}) {

            screens.home = options.home;
            screens.hub = options.hub;
            screens.vip = options.vip || null;
            gameRoot = options.gameRoot;
            liveRegion = options.liveRegion || null;

            window.addEventListener("hashchange", onHashChange);

            render(parse(window.location.hash));

        },


        /**
         * Navega: "home" | "hub" | "vip" | "game/<id>"
         */
        go(target) {

            const route = parse(target);

            const hash = toHash(route);

            if (window.location.hash === hash) {

                render(route);

                return;

            }

            window.location.hash = hash;

        },


        getCurrent() {
            return current;
        },


        getShell(id) {
            return shells.get(id) || null;
        },


        /** Pausa el juego activo (p. ej. al cambiar de pestaña) */
        pauseActive() {

            if (current && current.type === "game") {

                const shell = shells.get(current.id);

                if (shell) {
                    shell.pause();
                }

            }

        },


        onChange(listener) {

            listeners.add(listener);

            return function off() {
                listeners.delete(listener);
            };

        },


        refresh() {
            onHashChange();
        }

    };


    /* Utilidad interna usada por los juegos para volver al hub */
    A.exitGame = function exitGame() {
        A.router.go("hub");
    };

})(window.Arcade404);
