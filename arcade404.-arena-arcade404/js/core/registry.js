/* =========================================================
   ARCADE 404 — REGISTRO DE JUEGOS
   Cada juego se auto-registra al cargar su script.
   ========================================================= */

(function (A) {

    "use strict";


    const games = new Map();


    A.registerGame = function registerGame(definition) {

        if (!definition || !definition.id) {
            throw new Error("[ARCADE 404] Juego sin identificador");
        }

        games.set(definition.id, definition);

        return definition;

    };


    A.getGame = function getGame(id) {
        return games.get(id) || null;
    };


    A.listGames = function listGames() {

        return Array.from(games.values()).sort((a, b) => {

            return String(a.number).localeCompare(String(b.number));

        });

    };


    A.countGames = function countGames() {
        return games.size;
    };

})(window.Arcade404);
