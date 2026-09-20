/* =========================================================
   ARCADE 404 — PERSISTENCIA
   Récords y ajustes en localStorage (con respaldo en memoria
   si el navegador lo bloquea, p. ej. modo privado).
   ========================================================= */

(function (A) {

    "use strict";


    const PREFIX = "arcade404:";
    const memory = Object.create(null);


    let usable = true;

    try {

        const probe = PREFIX + "__probe__";

        window.localStorage.setItem(probe, "1");
        window.localStorage.removeItem(probe);

    } catch (error) {

        usable = false;

    }


    function readRaw(key) {

        if (!usable) {
            return key in memory ? memory[key] : null;
        }

        try {
            return window.localStorage.getItem(PREFIX + key);
        } catch (error) {
            /* El almacenamiento puede dejar de estar disponible después
               de la prueba inicial (privacidad, cuota o iframe). Como
               writeRaw siempre mantiene una copia en memoria, úsala
               también en esta ruta de recuperación. */
            usable = false;
            return key in memory ? memory[key] : null;
        }

    }


    function writeRaw(key, value) {

        memory[key] = value;

        if (!usable) {
            return;
        }

        try {
            window.localStorage.setItem(PREFIX + key, value);
        } catch (error) {
            /* Cuota agotada o almacenamiento bloqueado: las siguientes
               lecturas/escrituras continúan coherentemente en memoria. */
            usable = false;
        }

    }


    function readJson(key, fallback) {

        const raw = readRaw(key);

        if (raw == null) {
            return fallback;
        }

        try {
            return JSON.parse(raw);
        } catch (error) {
            return fallback;
        }

    }


    const storage = {

        /* ---------------------------------------------------------
           Genérico
           --------------------------------------------------------- */

        get(key, fallback = null) {

            const raw = readRaw(key);

            return raw == null ? fallback : raw;

        },


        set(key, value) {
            writeRaw(key, String(value));
        },


        getObject(key, fallback = null) {
            return readJson(key, fallback);
        },


        setObject(key, value) {
            writeRaw(key, JSON.stringify(value));
        },


        remove(key) {

            delete memory[key];

            if (!usable) {
                return;
            }

            try {
                window.localStorage.removeItem(PREFIX + key);
            } catch (error) { /* no-op */ }

        },


        /* ---------------------------------------------------------
           Récords
           --------------------------------------------------------- */

        getBest(gameId) {

            const value = parseInt(readRaw(`best:${gameId}`), 10);

            return Number.isFinite(value) ? value : 0;

        },


        /** Guarda un récord si supera el anterior. Devuelve { best, isRecord } */
        submitScore(gameId, score) {

            const current = storage.getBest(gameId);
            const value = Math.max(0, Math.floor(score));

            const isRecord = value > current;

            if (isRecord) {
                writeRaw(`best:${gameId}`, String(value));
            }

            return {
                best: isRecord ? value : current,
                isRecord
            };

        },


        clearScores() {

            Object.keys(memory)
                .filter((key) => key.indexOf("best:") === 0)
                .forEach((key) => delete memory[key]);

            if (!usable) {
                return;
            }

            try {

                Object.keys(window.localStorage)
                    .filter((key) => key.indexOf(PREFIX + "best:") === 0)
                    .forEach((key) => window.localStorage.removeItem(key));

            } catch (error) { /* no-op */ }

        },


        /* ---------------------------------------------------------
           Ajustes
           --------------------------------------------------------- */

        getSettings() {

            return Object.assign(
                { sound: true, difficulty: "normal" },
                readJson("settings", {}) || {}
            );

        },


        saveSettings(settings) {

            storage.setObject(
                "settings",
                Object.assign(storage.getSettings(), settings || {})
            );

        }

    };


    A.storage = storage;

})(window.Arcade404);
