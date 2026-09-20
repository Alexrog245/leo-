/* =========================================================
   ARCADE 404 — ENTRADA DE TECLADO
   Un único listener global; los módulos se suscriben.
   ========================================================= */

(function (A) {

    "use strict";


    const pressed = new Set();

    const subscribers = new Set();

    /* Suscriptores de SOLTAR tecla: sin esto los juegos que
       guardan "tecla mantenida" se quedaban pegados. */
    const upSubscribers = new Set();

    /* Teclas que no deben hacer scroll ni activar botones */
    const PREVENT_DEFAULT = new Set([
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " ",
        "Spacebar",
        "Enter"
    ]);


    function isTypingTarget(target) {

        if (!target) {
            return false;
        }

        const tag = target.tagName;

        return (
            tag === "INPUT" ||
            tag === "TEXTAREA" ||
            tag === "SELECT" ||
            target.isContentEditable
        );

    }


    window.addEventListener("keydown", (event) => {

        const key = event.key;

        if (isTypingTarget(event.target)) {
            return;
        }

        /* También se previenen los keydown repetidos: de lo contrario,
           mantener una flecha pulsada puede desplazar la página en
           algunos navegadores mientras el juego intenta usarla. */
        if (PREVENT_DEFAULT.has(key)) {
            event.preventDefault();
        }

        pressed.add(key.length === 1 ? key.toLowerCase() : key);

        subscribers.forEach((handler) => {

            try {
                handler(key, event);
            } catch (error) {
                console.error("[ARCADE 404] Error en handler de teclado:", error);
            }

        });

    });


    function notifyUp(key, event) {

        upSubscribers.forEach((handler) => {

            try {
                handler(key, event);
            } catch (error) {
                console.error("[ARCADE 404] Error en handler de keyup:", error);
            }

        });

    }


    window.addEventListener("keyup", (event) => {

        const key = event.key;

        pressed.delete(key.length === 1 ? key.toLowerCase() : key);

        /* Si se soltó Shift/Alt/Meta con otra tecla pulsada, el
           navegador puede haber cambiado la mayúscula: se liberan
           las dos variantes para que nada quede colgado. */
        notifyUp(key, event);

    });


    /* Al perder el foco (cambio de pestaña, alert, clic fuera) se
       sueltan TODAS las teclas: los juegos reciben un keyup por
       cada una y además un aviso general. */
    function releaseAll() {

        const keys = Array.from(pressed);

        pressed.clear();

        keys.forEach((key) => notifyUp(key, null));

        notifyUp("*", null);

    }


    window.addEventListener("blur", releaseAll);

    document.addEventListener("visibilitychange", () => {

        if (document.hidden) {
            releaseAll();
        }

    });


    A.input = {

        /** ¿Está pulsada ahora mismo? */
        isDown(key) {
            return pressed.has(key);
        },


        /** Suscripción: devuelve función para darse de baja */
        subscribe(handler) {

            subscribers.add(handler);

            return function unsubscribe() {
                subscribers.delete(handler);
            };

        },


        /** Suscripción a keyup (mismo contrato que subscribe) */
        subscribeUp(handler) {

            upSubscribers.add(handler);

            return function unsubscribe() {
                upSubscribers.delete(handler);
            };

        },


        clear() {
            pressed.clear();
        },


        /** Suelta todo y avisa a los juegos (pausa, game over, salida) */
        releaseAll,


        keys: pressed

    };

})(window.Arcade404);
