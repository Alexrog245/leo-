/* =========================================================
   ARCADE 404 — UTILIDADES
   Helpers compartidos por todo el sistema.
   ========================================================= */

window.Arcade404 = window.Arcade404 || {};

(function (A) {

    "use strict";


    const utils = {

        /* ---------------------------------------------------------
           DOM
           --------------------------------------------------------- */

        qs(selector, root = document) {
            return root.querySelector(selector);
        },


        qsa(selector, root = document) {
            return Array.prototype.slice.call(
                root.querySelectorAll(selector)
            );
        },


        on(target, type, handler, options) {
            target.addEventListener(type, handler, options);

            return function off() {
                target.removeEventListener(type, handler, options);
            };
        },


        create(tag, className, html) {

            const node = document.createElement(tag);

            if (className) {
                node.className = className;
            }

            if (html != null) {
                node.innerHTML = html;
            }

            return node;

        },


        /* ---------------------------------------------------------
           NÚMEROS
           --------------------------------------------------------- */

        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },


        lerp(a, b, t) {
            return a + (b - a) * t;
        },


        rand(min, max) {
            return min + Math.random() * (max - min);
        },


        randInt(min, max) {
            return Math.floor(min + Math.random() * (max - min + 1));
        },


        pick(list) {
            return list[Math.floor(Math.random() * list.length)];
        },


        pad(value, length = 6, char = "0") {

            let text = String(value);

            while (text.length < length) {
                text = char + text;
            }

            return text;

        },


        formatScore(value, length = 6) {
            return utils.pad(Math.max(0, Math.floor(value)), length);
        },


        /* ---------------------------------------------------------
           TIEMPO
           --------------------------------------------------------- */

        formatClock(ms) {

            const total = Math.max(0, Math.floor(ms / 1000));

            const minutes = Math.floor(total / 60);
            const seconds = total % 60;

            return `${utils.pad(minutes, 2)}:${utils.pad(seconds, 2)}`;

        },


        debounce(fn, wait = 160) {

            let timer = null;

            return function debounced(...args) {

                clearTimeout(timer);

                timer = setTimeout(() => fn.apply(this, args), wait);

            };

        },


        /* ---------------------------------------------------------
           ENTORNO
           --------------------------------------------------------- */

        prefersReducedMotion() {

            return window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        },


        isTouchDevice() {

            /* `pointer` describe sólo el apuntador principal. En portátiles
               híbridos suele ser fino aunque el panel táctil esté disponible;
               `any-pointer` conserva los controles de dedo para esos casos.
               La guarda de matchMedia evita que un webview antiguo bloquee la
               pantalla de juego al consultar la capacidad del dispositivo. */
            const media = typeof window.matchMedia === "function"
                ? window.matchMedia.bind(window)
                : null;
            const hasCoarsePointer = Boolean(media && (
                media("(any-pointer: coarse)").matches ||
                media("(pointer: coarse)").matches
            ));
            const touchPoints = typeof navigator !== "undefined"
                ? Number(navigator.maxTouchPoints || 0)
                : 0;

            return (
                ("ontouchstart" in window) ||
                touchPoints > 0 ||
                hasCoarsePointer
            );

        },


        /* ---------------------------------------------------------
           VARIOS
           --------------------------------------------------------- */

        escapeHtml(text) {

            return String(text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

        }

    };


    A.utils = utils;

})(window.Arcade404);
