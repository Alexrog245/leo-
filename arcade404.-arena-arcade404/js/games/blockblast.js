/* =========================================================
   ARCADE 404 — GAME 07 · BLOCK BLAST
   Rejilla 8x8: arrastra las piezas, llena filas y columnas
   y revéntalas. Niveles con bloques de piedra, racha de
   combos y bombas que se ganan encadenando roturas.
   ========================================================= */

(function (A) {

    "use strict";


    const { utils, canvasKit } = A;


    /* ---------------------------------------------------------
       GEOMETRÍA (lienzo 632 x 668)
       --------------------------------------------------------- */

    const WIDTH = 632;
    const HEIGHT = 668;

    const COLS = 8;
    const ROWS = 8;
    const CELL = 58;

    const BOARD = COLS * CELL;               /* 464 */

    const BOARD_X = 16;
    const BOARD_Y = 16;

    const SIDE_X = BOARD_X + BOARD + 18;     /* 498 */
    const SIDE_W = WIDTH - SIDE_X - 16;      /* 118 */

    const TRAY_Y = BOARD_Y + BOARD + 20;     /* 500 */
    const TRAY_H = HEIGHT - TRAY_Y - 16;     /* 152 */

    const TRAY_W = WIDTH - BOARD_X * 2;      /* 600 */
    const TRAY_GAP = 14;

    const SLOT_W = (TRAY_W - TRAY_GAP * 2) / 3;
    const SLOT_H = TRAY_H;

    const TRAY_CELL = 24;

    const CLEAR_TIME = 240;     /* animación de rotura */
    const FALL_TIME = 190;      /* animación de la caída */
    const POP_TIME = 180;       /* animación al colocar */
    const BANNER_TIME = 1800;   /* aviso de cambio de mundo */


    /* ---------------------------------------------------------
       MUNDOS — cada tres roturas seguidas el mapa cambia
       --------------------------------------------------------- */

    const WORLDS = [

        {
            name: "TALLER",
            wall: "#22D3EE",
            floor: "#070A10",
            grid: "rgba(34, 211, 238, 0.07)",
            stone: "#5A6478",
            pattern: "grid"
        },

        {
            name: "FÁBRICA",
            wall: "#FBBF24",
            floor: "#0B0803",
            grid: "rgba(251, 191, 36, 0.07)",
            stone: "#6B5A45",
            pattern: "stripes"
        },

        {
            name: "NÚCLEO",
            wall: "#A3E635",
            floor: "#050A04",
            grid: "rgba(163, 230, 53, 0.07)",
            stone: "#4E6B45",
            pattern: "dots"
        },

        {
            name: "SINGULARIDAD",
            wall: "#F43F5E",
            floor: "#0B0407",
            grid: "rgba(244, 63, 94, 0.08)",
            stone: "#7A4A55",
            pattern: "rings"
        }

    ];

    const CHAIN_WORDS = [
        "ROTO", "DOBLE", "TRIPLE", "CUÁDRUPLE", "QUÍNTUPLE", "BRUTAL"
    ];


    /* ---------------------------------------------------------
       PIEZAS (poliominós clásicos del Block Blast)
       --------------------------------------------------------- */

    const SHAPES = [

        { id: "dot",     weight: 6,  color: "#22D3EE", cells: [[1]] },
        { id: "duo",     weight: 10, color: "#A3E635", cells: [[1, 1]] },
        { id: "trio",    weight: 9,  color: "#FBBF24", cells: [[1, 1, 1]] },
        { id: "quad",    weight: 6,  color: "#FB923C", cells: [[1, 1, 1, 1]] },
        { id: "penta",   weight: 3,  color: "#F43F5E", cells: [[1, 1, 1, 1, 1]] },

        { id: "vduo",    weight: 10, color: "#34D399", cells: [[1], [1]] },
        { id: "vtrio",   weight: 9,  color: "#22D3EE", cells: [[1], [1], [1]] },
        { id: "vquad",   weight: 6,  color: "#8B5CF6", cells: [[1], [1], [1], [1]] },

        { id: "cube2",   weight: 7,  color: "#FBBF24", cells: [[1, 1], [1, 1]] },
        { id: "cube3",   weight: 2,  color: "#3B82F6", cells: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },

        { id: "corner",  weight: 7,  color: "#A3E635", cells: [[1, 0], [1, 0], [1, 1]] },
        { id: "corner2", weight: 7,  color: "#FB923C", cells: [[0, 1], [0, 1], [1, 1]] },
        { id: "corner3", weight: 5,  color: "#8B5CF6", cells: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
        { id: "corner4", weight: 5,  color: "#22D3EE", cells: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },

        { id: "tee",     weight: 6,  color: "#F43F5E", cells: [[1, 1, 1], [0, 1, 0], [0, 1, 0]] },
        { id: "ess",     weight: 5,  color: "#34D399", cells: [[0, 1, 1], [1, 1, 0]] },
        { id: "zed",     weight: 5,  color: "#FBBF24", cells: [[1, 1, 0], [0, 1, 1]] },
        { id: "diag",    weight: 3,  color: "#FB923C", cells: [[1, 0], [0, 1]] }

    ];


    /* ---------------------------------------------------------
       NIVELES — cada nivel pide más líneas y añade piedra
       --------------------------------------------------------- */

    const LEVELS = [
        { goal: "lineas", amount: 5,  lines: 5,  stones: 0 },
        { goal: "gemas",  amount: 4,  lines: 7,  stones: 2 },
        { goal: "lineas", amount: 9,  lines: 9,  stones: 3 },
        { goal: "piedra", amount: 6,  lines: 11, stones: 5 },
        { goal: "cadena", amount: 3,  lines: 13, stones: 5 },
        { goal: "gemas",  amount: 8,  lines: 15, stones: 6 },
        { goal: "lineas", amount: 18, lines: 18, stones: 7 },
        { goal: "cadena", amount: 4,  lines: 20, stones: 8 }
    ];


    /* ---------------------------------------------------------
       DIFICULTAD
       --------------------------------------------------------- */

    const MODES = {

        calma: {
            label: "CALMA",
            stones: 0.5,
            bombs: 2,
            bigPieces: false
        },

        normal: {
            label: "NORMAL",
            stones: 1,
            bombs: 1,
            bigPieces: true
        },

        ruido: {
            label: "RUIDO",
            stones: 1.6,
            bombs: 0,
            bigPieces: true
        }

    };


    /* ---------------------------------------------------------
       BLOQUES ESPECIALES

       Algunas piezas traen una celda marcada. No hacen nada
       mientras están en el tablero: el efecto se dispara cuando
       esa celda entra en una línea que se rompe. Eso convierte
       cada colocación en una decisión — ¿la gasto ya o la guardo
       para una cadena mejor?
       --------------------------------------------------------- */

    const SPECIALS = {

        bomba: {
            id: "bomba",
            label: "BOMBA",
            glyph: "✸",
            color: "#F43F5E",
            /* Revienta el 3x3 de alrededor */
            radius: 1
        },

        rayo: {
            id: "rayo",
            label: "RAYO",
            glyph: "⚡",
            color: "#FBBF24"
            /* Limpia su fila y su columna enteras */
        },

        gema: {
            id: "gema",
            label: "GEMA",
            glyph: "◆",
            color: "#22D3EE"
            /* Suma al contador de gemas y puntúa fuerte */
        },

        estrella: {
            id: "estrella",
            label: "ESTRELLA",
            glyph: "★",
            color: "#A3E635"
            /* Dobla la puntuación de toda la rotura */
        }

    };


    /* Probabilidad de que una pieza traiga un especial, por
       dificultad. Las piezas de una sola celda nunca lo traen:
       sería demasiado fácil colocarlas. */
    const SPECIAL_CHANCE = {
        calma: 0.3,
        normal: 0.22,
        ruido: 0.16
    };


    /* Reparto entre tipos de especial */
    const SPECIAL_WEIGHTS = [
        { id: "gema", weight: 10 },
        { id: "bomba", weight: 6 },
        { id: "rayo", weight: 5 },
        { id: "estrella", weight: 4 }
    ];


    /* ---------------------------------------------------------
       OBJETIVOS DE NIVEL

       Antes todos los niveles pedían lo mismo: N líneas. Ahora
       cada uno pide algo distinto, así que hay que cambiar de
       estrategia en vez de repetir la misma jugada.
       --------------------------------------------------------- */

    const GOALS = {

        lineas: {
            id: "lineas",
            label: "LÍNEAS",
            describe: (n) => "Rompe " + n + " líneas",
            color: "#A3E635"
        },

        gemas: {
            id: "gemas",
            label: "GEMAS",
            describe: (n) => "Recoge " + n + " gemas",
            color: "#22D3EE"
        },

        piedra: {
            id: "piedra",
            label: "PIEDRA",
            describe: (n) => "Destruye " + n + " piedras",
            color: "#94A3B8"
        },

        cadena: {
            id: "cadena",
            label: "CADENA",
            describe: (n) => "Encadena " + n + " roturas seguidas",
            color: "#F43F5E"
        }

    };


    const STONE_COLOR = "#5A6478";


    /* =========================================================
       JUEGO
       ========================================================= */

    class BlockBlastGame {


        constructor(shell) {

            this.shell = shell;

            this.stage = A.createStage(shell.refs.stage, {
                width: WIDTH,
                height: HEIGHT,
                background: "#070A10"
            });

            this.mode = "normal";

            this.reset();

            this.bindDifficulty();
            this.bindPointer();

            shell.setTouchControls({
                mode: "pointer",
                hint: "ARRASTRA LOS BLOQUES HASTA LA REJILLA"
            });

        }


        /* ---------------------------------------------------------
           Estado
           --------------------------------------------------------- */

        reset() {

            this.board = [];

            for (let y = 0; y < ROWS; y += 1) {
                this.board.push(new Array(COLS).fill(null));
            }

            this.tray = [];

            this.worldIndex = 0;
            this.world = WORLDS[0];

            this.chain = 0;
            this.bestChain = 0;

            this.popups = [];
            this.banner = null;

            this._sprites = {};
            this._frames = {};

            this.levelIndex = 0;
            this.level = 1;
            this.levelLines = 0;
            this.lines = 0;

            /* Contadores de objetivo: se reinician en cada nivel */
            this.gems = 0;
            this.stonesBroken = 0;
            this.goalGems = 0;
            this.goalStones = 0;
            this.goalChain = 0;

            this.score = 0;
            this.streak = 0;
            this.bestStreak = 0;

            this.modeData = MODES[this.mode];

            this.bombs = this.modeData.bombs;

            this.phase = "idle";
            this.clearing = null;
            this.particles = [];

            this.flash = 0;
            this.shake = 0;
            this.pulse = 0;

            this.drag = null;
            this.hover = null;
            this.bombMode = false;

            this.cursor = { x: 3, y: 3, slot: 0 };

            this.over = false;

            this.refillTray();

            this.updateStats();

        }


        start() {

            this.reset();

            A.audio.play("start");

        }


        restart() {

            this.reset();

        }


        destroy() {

            this.unbindPointer();

            this.stage.destroy();

        }


        get target() {
            return LEVELS[Math.min(this.levelIndex, LEVELS.length - 1)];
        }


        /* Definición del objetivo del nivel en curso */
        get goal() {
            return GOALS[this.target.goal] || GOALS.lineas;
        }


        /* Cuánto llevas hecho del objetivo actual */
        get goalProgress() {

            const target = this.target;

            switch (target.goal) {

                case "gemas":
                    return this.gems - this.goalGems;

                case "piedra":
                    return this.stonesBroken - this.goalStones;

                case "cadena":
                    return this.goalChain;

                default:
                    return this.levelLines;

            }

        }


        /* Texto corto del objetivo, para el panel lateral */
        goalText() {

            const target = this.target;

            return Math.min(this.goalProgress, target.amount) +
                " / " + target.amount;

        }


        /* ---------------------------------------------------------
           Bandeja y piezas
           --------------------------------------------------------- */

        refillTray() {

            this.tray = [];

            for (let i = 0; i < 3; i += 1) {
                this.tray.push(this.randomPiece());
            }

        }


        randomPiece() {

            const mode = this.modeData || MODES.normal;

            let pool = SHAPES;

            if (!mode.bigPieces) {

                pool = SHAPES.filter((shape) => {

                    return shape.cells.length <= 2 &&
                        shape.cells[0].length <= 2;

                });

            }

            const total = pool.reduce((sum, shape) => sum + shape.weight, 0);

            let ticket = Math.random() * total;

            let chosen = pool[0];

            for (let i = 0; i < pool.length; i += 1) {

                ticket -= pool[i].weight;

                if (ticket <= 0) {
                    chosen = pool[i];
                    break;
                }

            }

            const piece = {
                shape: chosen,
                color: chosen.color,
                id: chosen.id + "-" + Math.random().toString(36).slice(2, 7),
                special: null,
                specialAt: null
            };

            this.attachSpecial(piece);

            return piece;

        }


        /* Marca al azar una celda de la pieza con un especial */
        attachSpecial(piece) {

            const cells = piece.shape.cells;

            /* Lista de celdas ocupadas */
            const spots = [];

            for (let y = 0; y < cells.length; y += 1) {

                for (let x = 0; x < cells[y].length; x += 1) {

                    if (cells[y][x]) {
                        spots.push({ x, y });
                    }

                }

            }

            /* Las piezas de una celda no llevan especial */
            if (spots.length < 2) {
                return;
            }

            const chance = SPECIAL_CHANCE[this.mode] !== undefined
                ? SPECIAL_CHANCE[this.mode]
                : SPECIAL_CHANCE.normal;

            if (Math.random() > chance) {
                return;
            }

            /* Qué tipo de especial toca */
            const total = SPECIAL_WEIGHTS.reduce(
                (sum, entry) => sum + entry.weight,
                0
            );

            let ticket = Math.random() * total;

            let kind = SPECIAL_WEIGHTS[0].id;

            for (let i = 0; i < SPECIAL_WEIGHTS.length; i += 1) {

                ticket -= SPECIAL_WEIGHTS[i].weight;

                if (ticket <= 0) {
                    kind = SPECIAL_WEIGHTS[i].id;
                    break;
                }

            }

            piece.special = kind;
            piece.specialAt = spots[Math.floor(Math.random() * spots.length)];

        }


        pieceSize(piece) {

            return {
                w: piece.shape.cells[0].length,
                h: piece.shape.cells.length
            };

        }


        /** ¿Cabe la pieza con su esquina en (ox, oy)? */
        fits(piece, ox, oy) {

            const cells = piece.shape.cells;

            for (let y = 0; y < cells.length; y += 1) {

                for (let x = 0; x < cells[y].length; x += 1) {

                    if (!cells[y][x]) {
                        continue;
                    }

                    const bx = ox + x;
                    const by = oy + y;

                    if (bx < 0 || bx >= COLS || by < 0 || by >= ROWS) {
                        return false;
                    }

                    if (this.board[by][bx]) {
                        return false;
                    }

                }

            }

            return true;

        }


        /** ¿Queda algún sitio para alguna pieza de la bandeja? */
        hasMoves() {

            if (!this.tray.length) {
                return true;
            }

            for (let i = 0; i < this.tray.length; i += 1) {

                if (!this.tray[i]) {
                    continue;
                }

                for (let y = 0; y < ROWS; y += 1) {

                    for (let x = 0; x < COLS; x += 1) {

                        if (this.fits(this.tray[i], x, y)) {
                            return true;
                        }

                    }

                }

            }

            return false;

        }


        /* ---------------------------------------------------------
           Colocar y resolver
           --------------------------------------------------------- */

        place(slot, ox, oy) {

            const piece = this.tray[slot];

            if (!piece || !this.fits(piece, ox, oy)) {

                A.audio.play("back");

                return false;

            }

            const cells = piece.shape.cells;

            let filled = 0;

            for (let y = 0; y < cells.length; y += 1) {

                for (let x = 0; x < cells[y].length; x += 1) {

                    if (!cells[y][x]) {
                        continue;
                    }

                    const bx = ox + x;
                    const by = oy + y;

                    const isSpecial = piece.special
                        && piece.specialAt
                        && piece.specialAt.x === x
                        && piece.specialAt.y === y;

                    this.board[by][bx] = {
                        color: piece.color,
                        stone: false,
                        pop: POP_TIME,

                        /* El especial viaja con la celda y espera
                           a que una línea la haga estallar. */
                        special: isSpecial ? piece.special : null
                    };

                    filled += 1;

                }

            }

            this.tray[slot] = null;

            this.chain = 0;
            this.popups = [];

            this.score += filled * 2;

            A.audio.play("place");

            this.spawnParticles(ox, oy, filled, piece.color);

            this.resolve();

            return true;

        }


        /** Filas y columnas completas en este instante */
        findClears() {

            const rows = [];
            const cols = [];

            for (let y = 0; y < ROWS; y += 1) {

                let full = true;

                for (let x = 0; x < COLS; x += 1) {

                    if (!this.board[y][x]) {
                        full = false;
                        break;
                    }

                }

                if (full) {
                    rows.push(y);
                }

            }

            for (let x = 0; x < COLS; x += 1) {

                let full = true;

                for (let y = 0; y < ROWS; y += 1) {

                    if (!this.board[y][x]) {
                        full = false;
                        break;
                    }

                }

                if (full) {
                    cols.push(x);
                }

            }

            return { rows, cols };

        }


        /** Rota lo que esté completo; encadena si al caer se arma otra */
        resolve() {

            const { rows, cols } = this.findClears();

            const lines = rows.length + cols.length;

            if (!lines) {

                /* Nada que reventar: se corta la racha */
                this.endChain();

                return;

            }

            this.chain += 1;

            this.bestChain = Math.max(this.bestChain, this.chain);

            /* Para el objetivo de tipo cadena */
            this.goalChain = Math.max(this.goalChain, this.chain);

            this.phase = "clearing";

            this.clearing = {
                timer: CLEAR_TIME,
                duration: CLEAR_TIME,
                rows,
                cols
            };

            this.flash = 200;
            this.shake = Math.min(16, 5 + lines * 3 + this.chain * 2);

            A.audio.play(lines >= 3 || this.chain > 1 ? "tetris" : "line");

        }


        /** Fin de la cadena: racha, bomba, mundo y bandeja */
        endChain() {

            if (this.chain > 0) {

                this.streak += 1;

                this.bestStreak = Math.max(this.bestStreak, this.streak);

                /* Cada cuatro roturas seguidas: una bomba */
                if (this.streak % 4 === 0) {

                    this.bombs = Math.min(3, this.bombs + 1);

                    this.shell.setStatus("BOMBA CARGADA · PULSA B");

                    A.audio.play("coin");

                }

                /* Cada tres: cambia el mapa y la máquina se cabrea */
                if (this.streak % 3 === 0 || this.chain >= 3) {
                    this.changeWorld();
                }

            } else {

                this.streak = 0;

            }

            this.chain = 0;

            this.checkLevel();

            this.afterTurn();

        }


        /* Revienta un cuadrado alrededor de (cx, cy). Devuelve
           cuántas celdas normales cayeron. */
        detonate(cx, cy, radius) {

            let hits = 0;

            for (let y = cy - radius; y <= cy + radius; y += 1) {

                for (let x = cx - radius; x <= cx + radius; x += 1) {

                    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
                        continue;
                    }

                    const cell = this.board[y][x];

                    if (!cell) {
                        continue;
                    }

                    /* La bomba sí parte la piedra de un golpe */
                    if (cell.stone) {

                        this.board[y][x] = null;

                        this.stonesBroken += 1;

                        continue;

                    }

                    this.board[y][x] = null;

                    hits += 1;

                }

            }

            return hits;

        }


        /* El rayo limpia la fila y la columna enteras */
        zap(cx, cy) {

            let hits = 0;

            for (let x = 0; x < COLS; x += 1) {
                hits += this.zapCell(x, cy);
            }

            for (let y = 0; y < ROWS; y += 1) {
                hits += this.zapCell(cx, y);
            }

            return hits;

        }


        zapCell(x, y) {

            const cell = this.board[y][x];

            if (!cell) {
                return 0;
            }

            if (cell.stone) {

                cell.cracks = (cell.cracks || 0) + 1;

                if (cell.cracks >= 2) {

                    this.board[y][x] = null;

                    this.stonesBroken += 1;

                }

                return 0;

            }

            this.board[y][x] = null;

            return 1;

        }


        /** Fin de la animación: se borran las celdas y se puntúa */
        finishClear() {

            const { rows, cols } = this.clearing;

            this.clearing = null;

            let cleared = 0;

            /* Especiales que había en las celdas rotas */
            const specials = [];

            const touched = [];

            let sumX = 0;
            let sumY = 0;

            for (let y = 0; y < ROWS; y += 1) {

                for (let x = 0; x < COLS; x += 1) {

                    const hit = rows.indexOf(y) !== -1 || cols.indexOf(x) !== -1;

                    if (!hit || !this.board[y][x]) {
                        continue;
                    }

                    const cell = this.board[y][x];

                    if (cell.stone) {

                        /* La piedra se resquebraja con la onda expansiva */
                        cell.cracks = (cell.cracks || 0) + 1;

                        if (cell.cracks >= 2) {

                            this.board[y][x] = null;

                            this.stonesBroken += 1;

                        }

                        continue;

                    }

                    /* Los especiales se anotan y se disparan después,
                       cuando la línea ya se ha limpiado entera. */
                    if (cell.special) {
                        specials.push({ x, y, kind: cell.special });
                    }

                    this.board[y][x] = null;

                    cleared += 1;

                    touched.push({ x, y });

                    sumX += x;
                    sumY += y;

                }

            }

            /* --- Detonación de los especiales --- */
            let bonus = 1;

            specials.forEach((entry) => {

                const spec = SPECIALS[entry.kind];

                if (!spec) {
                    return;
                }

                this.spawnBurst(
                    BOARD_X + entry.x * CELL + CELL / 2,
                    BOARD_Y + entry.y * CELL + CELL / 2
                );

                if (entry.kind === "gema") {

                    this.gems += 1;

                    this.score += 200 * this.level;

                } else if (entry.kind === "estrella") {

                    /* Dobla la puntuación de toda la rotura */
                    bonus *= 2;

                } else if (entry.kind === "bomba") {

                    cleared += this.detonate(entry.x, entry.y, spec.radius);

                } else if (entry.kind === "rayo") {

                    cleared += this.zap(entry.x, entry.y);

                }

                this.spawnPopup(
                    spec.label,
                    BOARD_X + entry.x * CELL + CELL / 2,
                    BOARD_Y + entry.y * CELL + CELL / 2 - 18,
                    spec.color
                );

            });

            if (specials.length) {

                this.shake = Math.min(22, this.shake + 6);

                A.audio.play("explode");

            }

            const lines = rows.length + cols.length;

            this.lines += lines;
            this.levelLines += lines;

            /* Cuanto más larga sea la cadena, más vale cada rotura */
            const base = 100 * lines * (lines + 1) / 2;

            const chainFactor = this.chain;

            const streakFactor = 1 + 0.15 * Math.max(0, this.streak);

            const gained = Math.round(
                base * chainFactor * streakFactor * this.level * bonus
            );

            this.score += gained;

            /* Avisos flotantes: qué ha pasado y cuánto vale */
            if (touched.length) {

                const cx = BOARD_X + (sumX / touched.length + 0.5) * CELL;
                const cy = BOARD_Y + (sumY / touched.length + 0.5) * CELL;

                const word = CHAIN_WORDS[
                    Math.min(this.chain - 1, CHAIN_WORDS.length - 1)
                ];

                this.spawnPopup(
                    this.chain > 1 ? word + " x" + this.chain : word,
                    cx,
                    cy - 6,
                    this.world.wall
                );

                this.spawnPopup("+" + gained, cx, cy + 20, "#F5F7FF");

            }

            touched.forEach((cell) => {

                this.spawnBurst(
                    BOARD_X + cell.x * CELL + CELL / 2,
                    BOARD_Y + cell.y * CELL + CELL / 2
                );

            });

            /* Lo que quede arriba cae: puede armar otra línea */
            this.startFall();

        }


        /** Gravedad: cada bloque baja hasta donde algo lo sostenga */
        startFall() {

            const drops = [];

            const grid = [];

            for (let y = 0; y < ROWS; y += 1) {
                grid.push(new Array(COLS).fill(0));
            }

            for (let x = 0; x < COLS; x += 1) {

                let write = ROWS - 1;

                for (let y = ROWS - 1; y >= 0; y -= 1) {

                    const cell = this.board[y][x];

                    if (!cell) {
                        continue;
                    }

                    if (write !== y) {

                        this.board[write][x] = cell;
                        this.board[y][x] = null;

                        drops.push({ x, from: y, to: write });

                        grid[write][x] = write - y;

                    }

                    write -= 1;

                }

            }

            if (!drops.length) {

                this.endFall();

                return;

            }

            this.phase = "falling";

            this.falling = {
                timer: FALL_TIME,
                duration: FALL_TIME,
                drops,
                grid
            };

            A.audio.play("place");

        }


        /** Fin de la caída: si se ha armado otra línea, se encadena */
        endFall() {

            this.falling = null;

            this.phase = "idle";

            const { rows, cols } = this.findClears();

            if (rows.length || cols.length) {

                this.resolve();

                return;

            }

            this.endChain();

        }


        /** Cada tres roturas seguidas el mapa cambia y la máquina protesta */
        changeWorld() {

            this.worldIndex = (this.worldIndex + 1) % WORLDS.length;

            this.world = WORLDS[this.worldIndex];

            this.score += 500 * (this.worldIndex + 1) * this.level;

            this.flash = 320;
            this.shake = 18;

            this.banner = {
                title: "MUNDO " + (this.worldIndex + 1),
                text: this.world.name,
                timer: BANNER_TIME,
                max: BANNER_TIME
            };

            /* El gordo con la cuchara: la máquina no lo acepta */
            this.shell.levelUpTaunt({
                face: "gordo",
                text: "¿Otra racha? A comer mierda con cuchara. Cambio de mapa y te sigo ganando.",
                duration: 4200
            });

            A.audio.play("win");

            this.updateStats();

        }


        /** Textos flotantes de puntos y combos */
        spawnPopup(text, x, y, color) {

            this.popups.push({
                text,
                x: utils.clamp(x, BOARD_X + 40, BOARD_X + BOARD - 40),
                y,
                color,
                life: 1
            });

        }


        updatePopups(dt) {

            for (let i = this.popups.length - 1; i >= 0; i -= 1) {

                this.popups[i].life -= dt * 0.0011;

                if (this.popups[i].life <= 0) {
                    this.popups.splice(i, 1);
                }

            }

        }


        /** Rellenar bandeja, mirar si se acabó y actualizar marcador */
        afterTurn() {

            if (
                this.over ||
                this.phase === "clearing" ||
                this.phase === "falling"
            ) {
                return;
            }

            if (this.tray.every((slot) => slot === null)) {
                this.refillTray();
            }

            this.updateStats();

            if (!this.hasMoves()) {

                this.over = true;

                this.shell.gameOver({
                    taunt: true,
                    score: this.score
                });

            }

        }


        checkLevel() {

            const target = this.target;

            if (this.goalProgress < target.amount) {
                return;
            }

            if (this.levelIndex >= LEVELS.length - 1) {

                this.over = true;

                this.shell.win({
                    taunt: true,
                    title: "REJILLA DESPEJADA",
                    text: `Has reventado los ${LEVELS.length} niveles de Block Blast.`,
                    score: this.score
                });

                return;

            }

            this.levelIndex += 1;
            this.level = this.levelIndex + 1;
            this.levelLines = 0;

            /* Los contadores del objetivo arrancan de cero: se
               guarda el corte para poder restarlo. */
            this.goalGems = this.gems;
            this.goalStones = this.stonesBroken;
            this.goalChain = 0;

            this.addStones(Math.round(target.stones * this.modeData.stones));

            /* Aviso del nuevo objetivo */
            const next = this.target;

            const goal = GOALS[next.goal] || GOALS.lineas;

            this.banner = {
                title: "NIVEL " + this.level,
                text: goal.describe(next.amount),
                color: goal.color,
                timer: BANNER_TIME,
                max: BANNER_TIME
            };

            A.audio.play("win");

            /* La máquina no acepta que hayas subido */
            this.shell.levelUpTaunt();

            this.flash = 260;

        }


        /** Piedras: no se rompen con líneas, solo con bombas u ondas */
        addStones(count) {

            const free = [];

            for (let y = 0; y < ROWS; y += 1) {

                for (let x = 0; x < COLS; x += 1) {

                    if (!this.board[y][x]) {
                        free.push({ x, y });
                    }

                }

            }

            for (let i = 0; i < count && free.length; i += 1) {

                const index = Math.floor(Math.random() * free.length);

                const spot = free.splice(index, 1)[0];

                this.board[spot.y][spot.x] = {
                    color: this.world.stone,
                    stone: true,
                    cracks: 0
                };

            }

        }


        /* ---------------------------------------------------------
           Bomba: revienta un área de 3 x 3
           --------------------------------------------------------- */

        useBomb(cx, cy) {

            if (this.bombs <= 0 || this.phase !== "idle") {
                return false;
            }

            let hits = 0;

            for (let y = cy - 1; y <= cy + 1; y += 1) {

                for (let x = cx - 1; x <= cx + 1; x += 1) {

                    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
                        continue;
                    }

                    if (!this.board[y][x]) {
                        continue;
                    }

                    this.board[y][x] = null;

                    hits += 1;

                    this.spawnBurst(
                        BOARD_X + x * CELL + CELL / 2,
                        BOARD_Y + y * CELL + CELL / 2
                    );

                }

            }

            if (!hits) {

                A.audio.play("back");

                return false;

            }

            this.bombs -= 1;

            this.score += 150 * this.level;

            this.shake = 18;
            this.flash = 220;

            A.audio.play("explode");

            this.bombMode = false;

            this.chain = 0;
            this.popups = [];

            this.resolve();

            return true;

        }


        /* ---------------------------------------------------------
           Entrada
           --------------------------------------------------------- */

        bindDifficulty() {

            const buttons = utils.qsa("[data-modo]", this.shell.root);

            buttons.forEach((button) => {

                button.classList.toggle(
                    "is-active",
                    button.dataset.modo === this.mode
                );

                button.addEventListener("click", () => {

                    buttons.forEach((item) => {
                        item.classList.toggle("is-active", item === button);
                    });

                    this.mode = button.dataset.modo || "normal";

                    A.audio.play("select");

                    this.reset();

                });

            });

        }


        bindPointer() {

            const canvas = this.stage.canvas;

            this._onDown = (event) => this.onPointerDown(event);
            this._onMove = (event) => this.onPointerMove(event);
            this._onUp = (event) => this.onPointerUp(event);

            canvas.addEventListener("pointerdown", this._onDown);
            canvas.addEventListener("pointermove", this._onMove);
            canvas.addEventListener("pointerup", this._onUp);
            canvas.addEventListener("pointercancel", this._onUp);
            canvas.addEventListener("pointerleave", this._onUp);

        }


        unbindPointer() {

            const canvas = this.stage.canvas;

            if (this._onDown) {
                canvas.removeEventListener("pointerdown", this._onDown);
            }

            if (this._onMove) {
                canvas.removeEventListener("pointermove", this._onMove);
            }

            if (this._onUp) {
                canvas.removeEventListener("pointerup", this._onUp);
                canvas.removeEventListener("pointercancel", this._onUp);
                canvas.removeEventListener("pointerleave", this._onUp);
            }

        }


        /** Hueco de la bandeja que contiene el punto (o -1) */
        slotAt(point) {

            if (point.y < TRAY_Y || point.y > TRAY_Y + SLOT_H) {
                return -1;
            }

            for (let i = 0; i < 3; i += 1) {

                const x = BOARD_X + i * (SLOT_W + TRAY_GAP);

                if (point.x >= x && point.x <= x + SLOT_W) {
                    return i;
                }

            }

            return -1;

        }


        /** Centro de dibujo de la pieza dentro de su hueco */
        slotCenter(index) {

            const x = BOARD_X + index * (SLOT_W + TRAY_GAP);

            return {
                x: x + SLOT_W / 2,
                y: TRAY_Y + SLOT_H / 2
            };

        }


        onPointerDown(event) {

            if (this.phase !== "idle" || this.over) {
                return;
            }

            const point = this.stage.toLogical(event.clientX, event.clientY);

            const slot = this.slotAt(point);

            if (slot !== -1 && this.tray[slot]) {

                const center = this.slotCenter(slot);
                const piece = this.tray[slot];
                const size = this.pieceSize(piece);

                const localX = point.x - (center.x - size.w * TRAY_CELL / 2);
                const localY = point.y - (center.y - size.h * TRAY_CELL / 2);

                const cellX = utils.clamp(
                    Math.floor(localX / TRAY_CELL), 0, size.w - 1
                );

                const cellY = utils.clamp(
                    Math.floor(localY / TRAY_CELL), 0, size.h - 1
                );

                this.drag = {
                    slot,
                    x: point.x,
                    y: point.y,
                    grabX: cellX * CELL + CELL / 2,
                    grabY: cellY * CELL + CELL / 2
                };

                this.bombMode = false;

                this.cursor.slot = slot;

                A.audio.play("select");

                this.updateHover();

                return;

            }

            /* Modo bomba: clic en la rejilla */
            if (this.bombMode) {

                const cell = this.cellAt(point);

                if (cell) {

                    this.useBomb(cell.x, cell.y);

                    this.updateStats();

                }

                return;

            }

            const cell = this.cellAt(point);

            if (cell) {
                this.cursor.x = cell.x;
                this.cursor.y = cell.y;
            }

        }


        onPointerMove(event) {

            if (!this.drag) {
                return;
            }

            const point = this.stage.toLogical(event.clientX, event.clientY);

            this.drag.x = point.x;
            this.drag.y = point.y;

            this.updateHover();

        }


        onPointerUp(event) {

            if (!this.drag) {
                return;
            }

            const point = this.stage.toLogical(event.clientX, event.clientY);

            this.drag.x = point.x;
            this.drag.y = point.y;

            this.updateHover();

            const drag = this.drag;

            this.drag = null;

            if (drag && this.hover && this.hover.valid) {

                const placed = this.place(drag.slot, this.hover.x, this.hover.y);

                if (placed) {
                    this.updateStats();
                }

            }

            this.hover = null;

        }


        /** Esquina de la rejilla bajo la pieza arrastrada */
        updateHover() {

            if (!this.drag) {

                this.hover = null;

                return;

            }

            const piece = this.tray[this.drag.slot];

            if (!piece) {

                this.hover = null;

                return;

            }

            const ox = Math.round(
                (this.drag.x - this.drag.grabX - BOARD_X) / CELL
            );

            const oy = Math.round(
                (this.drag.y - this.drag.grabY - BOARD_Y) / CELL
            );

            const overBoard =
                this.drag.y > BOARD_Y - CELL / 2 &&
                this.drag.y < BOARD_Y + BOARD + CELL / 2;

            if (!overBoard) {

                this.hover = null;

                return;
            }

            this.hover = {
                x: utils.clamp(ox, -1, COLS),
                y: utils.clamp(oy, -1, ROWS),
                valid: this.fits(piece, ox, oy)
            };

        }


        cellAt(point) {

            const x = Math.floor((point.x - BOARD_X) / CELL);
            const y = Math.floor((point.y - BOARD_Y) / CELL);

            if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
                return null;
            }

            return { x, y };

        }


        key(key, event) {

            if (this.over || this.phase !== "idle") {

                if (key === "Enter" || key === " ") {
                    event.preventDefault();
                    return true;
                }

                return false;

            }

            const slot = Number(key);

            if (slot >= 1 && slot <= 3 && this.tray[slot - 1]) {

                this.cursor.slot = slot - 1;

                this.bombMode = false;

                A.audio.play("select");

                return true;

            }

            if (key === "b" || key === "B") {

                if (this.bombs > 0) {

                    this.bombMode = !this.bombMode;

                    this.shell.setStatus(
                        this.bombMode
                            ? "BOMBA LISTA · ELIGE DÓNDE"
                            : "BOMBA CANCELADA"
                    );

                    A.audio.play("select");

                } else {

                    this.shell.setStatus("SIN BOMBAS · ENCADENA 4 ROTURAS");

                    A.audio.play("back");

                }

                return true;

            }

            switch (key) {

                case "ArrowLeft":
                    this.cursor.x = Math.max(0, this.cursor.x - 1);
                    return true;

                case "ArrowRight":
                    this.cursor.x = Math.min(COLS - 1, this.cursor.x + 1);
                    return true;

                case "ArrowUp":
                    this.cursor.y = Math.max(0, this.cursor.y - 1);
                    return true;

                case "ArrowDown":
                    this.cursor.y = Math.min(ROWS - 1, this.cursor.y + 1);
                    return true;

                case "Enter":
                case " ":
                    this.commitCursor();
                    return true;

                default:
                    return false;

            }

        }


        commitCursor() {

            if (this.bombMode) {

                this.useBomb(this.cursor.x, this.cursor.y);

                this.updateStats();

                return;

            }

            const piece = this.tray[this.cursor.slot];

            if (!piece) {

                for (let i = 0; i < this.tray.length; i += 1) {

                    if (this.tray[i]) {
                        this.cursor.slot = i;
                        break;
                    }

                }

                return;

            }

            if (this.place(this.cursor.slot, this.cursor.x, this.cursor.y)) {
                this.updateStats();
            }

        }


        /* ---------------------------------------------------------
           Bucle
           --------------------------------------------------------- */

        update(dt) {

            this.pulse += dt;

            if (this.clearing) {

                this.clearing.timer -= dt;

                if (this.clearing.timer <= 0) {
                    this.finishClear();
                }

            } else if (this.falling) {

                this.falling.timer -= dt;

                if (this.falling.timer <= 0) {
                    this.endFall();
                }

            }

            /* Brillo al colocar: se apaga en la propia celda */
            for (let y = 0; y < ROWS; y += 1) {

                for (let x = 0; x < COLS; x += 1) {

                    const cell = this.board[y][x];

                    if (cell && cell.pop > 0) {
                        cell.pop = Math.max(0, cell.pop - dt);
                    }

                }

            }

            if (this.banner) {

                this.banner.timer -= dt;

                if (this.banner.timer <= 0) {
                    this.banner = null;
                }

            }

            this.updatePopups(dt);
            this.updateParticles(dt);

            if (this.flash > 0) {
                this.flash = Math.max(0, this.flash - dt);
            }

            if (this.shake > 0) {
                this.shake = Math.max(0, this.shake - dt * 0.05);
            }

        }


        updateStats() {

            /* Hilo narrativo: la primera vez que se cruza el umbral
               de este juego, el shell cuenta su capítulo. */
            if (this.shell.checkStory) {
                this.shell.checkStory(this.score);
            }

            this.shell.setStat("score", utils.formatScore(this.score));

            this.shell.setStat("best", utils.formatScore(
                Math.max(this.shell.best, this.score)
            ));

            this.shell.setStat("lines", this.lines);
            this.shell.setStat("level", this.level);
            this.shell.setStat("streak", "x" + this.streak);

            const target = this.target;

            this.shell.setMeter(
                "progress",
                utils.clamp(this.levelLines / target.lines, 0, 1)
            );

        }


        spawnParticles(ox, oy, count, color) {

            const px = BOARD_X + ox * CELL + CELL / 2;
            const py = BOARD_Y + oy * CELL + CELL / 2;

            for (let i = 0; i < count * 4; i += 1) {

                const angle = Math.random() * Math.PI * 2;
                const speed = 0.06 + Math.random() * 0.22;

                this.particles.push({
                    x: px + (Math.random() - 0.5) * CELL,
                    y: py + (Math.random() - 0.5) * CELL,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    decay: 0.0016 + Math.random() * 0.002,
                    size: 2 + Math.random() * 3,
                    color: Math.random() < 0.5
                        ? color
                        : utils.pick(["#22D3EE", "#F5F7FF", "#A3E635"])
                });

            }

        }


        spawnBurst(px, py) {

            for (let i = 0; i < 8; i += 1) {

                const angle = Math.random() * Math.PI * 2;
                const speed = 0.08 + Math.random() * 0.3;

                this.particles.push({
                    x: px,
                    y: py,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    decay: 0.0018 + Math.random() * 0.002,
                    size: 2 + Math.random() * 4,
                    color: utils.pick([
                        "#FBBF24", "#FB923C", "#F5F7FF", "#F43F5E"
                    ])
                });

            }

        }


        updateParticles(dt) {

            for (let i = this.particles.length - 1; i >= 0; i -= 1) {

                const particle = this.particles[i];

                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.life -= particle.decay * dt;

                if (particle.life <= 0) {
                    this.particles.splice(i, 1);
                }

            }

        }


        /* ---------------------------------------------------------
           Dibujo
           --------------------------------------------------------- */

        render() {

            const { ctx } = this.stage;

            this.stage.clear(this.world.floor);

            ctx.save();

            if (this.shake > 0.2) {

                ctx.translate(
                    (Math.random() - 0.5) * this.shake,
                    (Math.random() - 0.5) * this.shake
                );

            }

            this.drawBoardFrame();
            this.drawCells();
            this.drawPreview();
            this.drawTray();
            this.drawSide();
            this.drawParticles();
            this.drawPopups();

            if (this.flash > 0) {
                this.drawFlash();
            }

            ctx.restore();

            if (this.banner) {
                this.drawBanner();
            }

        }


        /** Fondo del tablero: se dibuja una vez por mundo */
        boardSprite() {

            const key = "w" + this.worldIndex;

            if (this._frames[key]) {
                return this._frames[key];
            }

            const pad = 12;

            const canvas = document.createElement("canvas");

            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = (BOARD + pad * 2) * dpr;
            canvas.height = (BOARD + pad * 2) * dpr;

            const c = canvas.getContext("2d");

            c.scale(dpr, dpr);

            const world = WORLDS[this.worldIndex];

            /* Fondo */
            canvasKit.roundRect(c, pad, pad, BOARD, BOARD, 14);

            c.fillStyle = "rgba(9, 12, 20, 0.92)";
            c.fill();

            c.save();

            canvasKit.roundRect(c, pad, pad, BOARD, BOARD, 14);
            c.clip();

            /* Paisaje de fondo: cada mundo tiene el suyo. Se pinta
               una sola vez en el sprite cacheado, así que no cuesta
               nada por frame. */
            this.paintScenery(c, pad, world);

            /* Patrón del mundo */
            c.strokeStyle = world.grid;
            c.fillStyle = world.grid;
            c.lineWidth = 1;

            if (world.pattern === "stripes") {

                for (let i = -BOARD; i < BOARD * 2; i += 26) {

                    c.beginPath();
                    c.moveTo(pad + i, pad);
                    c.lineTo(pad + i + BOARD, pad + BOARD);
                    c.stroke();

                }

            } else if (world.pattern === "dots") {

                for (let y = 14; y < BOARD; y += 28) {

                    for (let x = 14; x < BOARD; x += 28) {

                        c.beginPath();
                        c.arc(pad + x, pad + y, 2, 0, Math.PI * 2);
                        c.fill();

                    }

                }

            } else if (world.pattern === "rings") {

                for (let r = 30; r < BOARD * 1.4; r += 46) {

                    c.beginPath();
                    c.arc(pad + BOARD / 2, pad + BOARD / 2, r, 0, Math.PI * 2);
                    c.stroke();

                }

            } else {

                for (let i = CELL; i < BOARD; i += CELL) {

                    c.beginPath();
                    c.moveTo(pad + i, pad);
                    c.lineTo(pad + i, pad + BOARD);
                    c.stroke();

                    c.beginPath();
                    c.moveTo(pad, pad + i);
                    c.lineTo(pad + BOARD, pad + i);
                    c.stroke();

                }

            }

            c.restore();

            /* Marco de neón */
            canvasKit.roundRect(c, pad, pad, BOARD, BOARD, 14);

            c.globalAlpha = 0.4;
            c.strokeStyle = world.wall;
            c.lineWidth = 2;
            c.stroke();

            const sprite = { canvas, pad, size: BOARD + pad * 2 };

            this._frames[key] = sprite;

            return sprite;

        }


        /* ---------------------------------------------------------
           PAISAJES

           Un decorado distinto por mundo, en silueta y muy tenue
           para que nunca compita con las piezas.
           --------------------------------------------------------- */

        paintScenery(c, pad, world) {

            const scenery = {
                TALLER: () => this.sceneryTaller(c, pad, world),
                FÁBRICA: () => this.sceneryFabrica(c, pad, world),
                NÚCLEO: () => this.sceneryNucleo(c, pad, world),
                SINGULARIDAD: () => this.sceneryEspacio(c, pad, world)
            };

            const paint = scenery[world.name];

            if (paint) {
                paint();
            }

        }


        /* TALLER — skyline de ciudad con ventanas encendidas */
        sceneryTaller(c, pad, world) {

            c.save();

            /* Resplandor del horizonte */
            const glow = c.createLinearGradient(0, pad + BOARD * 0.4, 0, pad + BOARD);

            glow.addColorStop(0, "rgba(34, 211, 238, 0)");
            glow.addColorStop(1, "rgba(34, 211, 238, 0.09)");

            c.fillStyle = glow;
            c.fillRect(pad, pad, BOARD, BOARD);

            /* Edificios de alturas variables */
            const towers = [
                [0.02, 0.34], [0.11, 0.52], [0.20, 0.28], [0.28, 0.44],
                [0.38, 0.62], [0.49, 0.36], [0.57, 0.50], [0.67, 0.30],
                [0.75, 0.46], [0.85, 0.38], [0.93, 0.56]
            ];

            towers.forEach((tower, index) => {

                const x = pad + tower[0] * BOARD;
                const w = BOARD * 0.085;
                const h = tower[1] * BOARD * 0.62;
                const y = pad + BOARD - h;

                c.fillStyle = "rgba(34, 211, 238, 0.06)";
                c.fillRect(x, y, w, h);

                /* Ventanas */
                c.fillStyle = "rgba(34, 211, 238, 0.11)";

                for (let wy = y + 8; wy < pad + BOARD - 10; wy += 14) {

                    for (let wx = x + 5; wx < x + w - 6; wx += 11) {

                        /* Patrón fijo: unas encendidas y otras no */
                        if ((wx + wy + index * 7) % 3 === 0) {
                            c.fillRect(wx, wy, 4, 6);
                        }

                    }

                }

            });

            /* Antena con luz */
            c.fillStyle = "rgba(34, 211, 238, 0.14)";
            c.fillRect(pad + BOARD * 0.42, pad + BOARD * 0.28, 2, BOARD * 0.1);

            c.restore();

        }


        /* FÁBRICA — chimeneas, humo y engranajes */
        sceneryFabrica(c, pad, world) {

            c.save();

            const base = pad + BOARD;

            /* Naves industriales: techos en diente de sierra */
            c.fillStyle = "rgba(251, 191, 36, 0.05)";

            c.beginPath();
            c.moveTo(pad, base);

            for (let i = 0; i < 7; i += 1) {

                const x = pad + (i / 7) * BOARD;
                const w = BOARD / 7;

                c.lineTo(x, base - BOARD * 0.16);
                c.lineTo(x + w * 0.5, base - BOARD * 0.24);
                c.lineTo(x + w * 0.5, base - BOARD * 0.16);

            }

            c.lineTo(pad + BOARD, base);
            c.closePath();
            c.fill();

            /* Chimeneas */
            [[0.14, 0.42], [0.30, 0.34], [0.72, 0.46], [0.86, 0.36]]
                .forEach((stack) => {

                    const x = pad + stack[0] * BOARD;
                    const h = stack[1] * BOARD;

                    c.fillStyle = "rgba(251, 191, 36, 0.07)";
                    c.fillRect(x, base - h, BOARD * 0.045, h);

                    /* Penacho de humo */
                    c.fillStyle = "rgba(251, 191, 36, 0.045)";

                    for (let p = 0; p < 4; p += 1) {

                        c.beginPath();

                        c.arc(
                            x + BOARD * 0.022 + p * 7,
                            base - h - 10 - p * 13,
                            7 + p * 4,
                            0,
                            Math.PI * 2
                        );

                        c.fill();

                    }

                });

            /* Engranaje grande, media rueda asomando */
            c.strokeStyle = "rgba(251, 191, 36, 0.07)";
            c.lineWidth = 3;

            const gx = pad + BOARD * 0.5;
            const gy = pad + BOARD * 0.18;
            const gr = BOARD * 0.13;

            c.beginPath();
            c.arc(gx, gy, gr, 0, Math.PI * 2);
            c.stroke();

            c.beginPath();
            c.arc(gx, gy, gr * 0.45, 0, Math.PI * 2);
            c.stroke();

            /* Dientes */
            for (let i = 0; i < 10; i += 1) {

                const a = (i / 10) * Math.PI * 2;

                c.beginPath();
                c.moveTo(gx + Math.cos(a) * gr, gy + Math.sin(a) * gr);
                c.lineTo(gx + Math.cos(a) * (gr + 8), gy + Math.sin(a) * (gr + 8));
                c.stroke();

            }

            c.restore();

        }


        /* NÚCLEO — selva de circuitos y esporas */
        sceneryNucleo(c, pad, world) {

            c.save();

            /* Pistas de circuito que suben desde abajo */
            c.strokeStyle = "rgba(163, 230, 53, 0.08)";
            c.lineWidth = 2;

            for (let i = 0; i < 9; i += 1) {

                let x = pad + (i / 9) * BOARD + 10;
                let y = pad + BOARD;

                c.beginPath();
                c.moveTo(x, y);

                /* Zigzag ortogonal, como una placa */
                for (let seg = 0; seg < 5; seg += 1) {

                    y -= BOARD * 0.1;

                    c.lineTo(x, y);

                    x += ((i + seg) % 2 === 0 ? 1 : -1) * BOARD * 0.05;

                    c.lineTo(x, y);

                }

                c.stroke();

                /* Nodo al final */
                c.fillStyle = "rgba(163, 230, 53, 0.12)";
                c.beginPath();
                c.arc(x, y, 3, 0, Math.PI * 2);
                c.fill();

            }

            /* Esporas flotando */
            c.fillStyle = "rgba(163, 230, 53, 0.07)";

            for (let i = 0; i < 26; i += 1) {

                /* Distribución fija y sin repetir patrón obvio */
                const px = pad + ((i * 97) % 100) / 100 * BOARD;
                const py = pad + ((i * 61) % 100) / 100 * BOARD;

                c.beginPath();
                c.arc(px, py, 2 + (i % 3), 0, Math.PI * 2);
                c.fill();

            }

            c.restore();

        }


        /* SINGULARIDAD — agujero negro con disco de acreción */
        sceneryEspacio(c, pad, world) {

            c.save();

            const cx = pad + BOARD / 2;
            const cy = pad + BOARD / 2;

            /* Halo del disco */
            const halo = c.createRadialGradient(
                cx, cy, BOARD * 0.05,
                cx, cy, BOARD * 0.55
            );

            halo.addColorStop(0, "rgba(244, 63, 94, 0.14)");
            halo.addColorStop(0.45, "rgba(244, 63, 94, 0.05)");
            halo.addColorStop(1, "rgba(244, 63, 94, 0)");

            c.fillStyle = halo;
            c.fillRect(pad, pad, BOARD, BOARD);

            /* Horizonte de sucesos */
            c.fillStyle = "rgba(4, 4, 8, 0.75)";
            c.beginPath();
            c.arc(cx, cy, BOARD * 0.11, 0, Math.PI * 2);
            c.fill();

            /* Anillos elípticos del disco */
            c.strokeStyle = "rgba(244, 63, 94, 0.10)";
            c.lineWidth = 2;

            for (let i = 1; i <= 4; i += 1) {

                c.save();
                c.translate(cx, cy);
                c.rotate(-0.35);
                c.scale(1, 0.32);

                c.beginPath();
                c.arc(0, 0, BOARD * (0.14 + i * 0.075), 0, Math.PI * 2);
                c.stroke();

                c.restore();

            }

            /* Estrellas de fondo */
            c.fillStyle = "rgba(245, 247, 255, 0.16)";

            for (let i = 0; i < 40; i += 1) {

                const px = pad + ((i * 137) % 100) / 100 * BOARD;
                const py = pad + ((i * 89) % 100) / 100 * BOARD;

                /* Las de cerca del agujero se estiran */
                const d = Math.hypot(px - cx, py - cy);

                if (d < BOARD * 0.16) {
                    continue;
                }

                c.fillRect(px, py, d > BOARD * 0.34 ? 2 : 1, 1);

            }

            c.restore();

        }


        drawBoardFrame() {

            const { ctx } = this.stage;

            const sprite = this.boardSprite();

            ctx.drawImage(
                sprite.canvas,
                BOARD_X - sprite.pad,
                BOARD_Y - sprite.pad,
                sprite.size,
                sprite.size
            );

        }


        /** Bloque pre-renderizado con su resplandor (una vez por color) */
        blockSprite(color, stone) {

            const key = color + (stone ? "-s" : "");

            if (this._sprites[key]) {
                return this._sprites[key];
            }

            const pad = 9;

            const canvas = document.createElement("canvas");

            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = (CELL + pad * 2) * dpr;
            canvas.height = (CELL + pad * 2) * dpr;

            const c = canvas.getContext("2d");

            c.scale(dpr, dpr);

            c.shadowColor = color;
            c.shadowBlur = stone ? 4 : 12;

            canvasKit.fillRoundRect(
                c, pad + 2, pad + 2, CELL - 4, CELL - 4, 7, color
            );

            c.shadowBlur = 0;

            c.globalAlpha = 0.28;

            canvasKit.fillRoundRect(
                c, pad + 5, pad + 5, CELL - 10, 5, 3, "#FFFFFF"
            );

            const sprite = {
                canvas,
                pad,
                size: CELL + pad * 2
            };

            this._sprites[key] = sprite;

            return sprite;

        }


        drawCells() {

            const clearing = this.clearing;

            const progress = clearing
                ? 1 - Math.max(0, clearing.timer) / clearing.duration
                : 0;

            const falling = this.falling;

            const fallProgress = falling
                ? 1 - Math.max(0, falling.timer) / falling.duration
                : 1;

            const gap = CELL * (1 - fallProgress * fallProgress);

            for (let y = 0; y < ROWS; y += 1) {

                for (let x = 0; x < COLS; x += 1) {

                    const cell = this.board[y][x];

                    if (!cell) {
                        continue;
                    }

                    const hit = clearing && (
                        clearing.rows.indexOf(y) !== -1 ||
                        clearing.cols.indexOf(x) !== -1
                    );

                    const drop = falling ? falling.grid[y][x] : 0;

                    const cx = BOARD_X + x * CELL + CELL / 2;
                    const cy = BOARD_Y + y * CELL + CELL / 2 - drop * gap;

                    if (hit) {

                        const scale = Math.max(0, 1 - progress);

                        this.drawBlockAt(
                            cx,
                            cy,
                            "#F5F7FF",
                            scale,
                            Math.max(0, 1 - progress * 0.8),
                            false,
                            0
                        );

                        continue;

                    }

                    let scale = 1;

                    if (cell.pop > 0) {

                        const t = cell.pop / POP_TIME;

                        scale = 1 + 0.16 * t * t;

                    }

                    this.drawBlockAt(
                        cx,
                        cy,
                        cell.color,
                        scale,
                        1,
                        cell.stone === true,
                        cell.cracks || 0
                    );

                    /* Marca del especial encima del bloque */
                    if (cell.special) {
                        this.drawSpecialMark(cx, cy, cell.special, scale);
                    }

                }

            }

        }


        /* Símbolo del especial, con halo palpitante para que
           destaque sobre el color del bloque */
        drawSpecialMark(cx, cy, kind, scale) {

            const spec = SPECIALS[kind];

            if (!spec) {
                return;
            }

            const { ctx } = this.stage;

            const pulse = 0.72 + Math.sin(this.pulse * 6) * 0.28;

            ctx.save();

            /* Halo */
            ctx.globalAlpha = 0.35 * pulse;
            ctx.fillStyle = spec.color;

            ctx.beginPath();
            ctx.arc(cx, cy, CELL * 0.3 * scale, 0, Math.PI * 2);
            ctx.fill();

            /* Anillo */
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = spec.color;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(cx, cy, CELL * 0.3 * scale, 0, Math.PI * 2);
            ctx.stroke();

            /* Glifo */
            ctx.globalAlpha = 1;
            ctx.fillStyle = "#05070E";
            ctx.font = "700 " + Math.round(20 * scale) + "px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText(spec.glyph, cx, cy + 1);

            ctx.fillStyle = "#F5F7FF";
            ctx.fillText(spec.glyph, cx, cy);

            ctx.restore();

        }


        drawBlockAt(cx, cy, color, scale = 1, alpha = 1, stone = false, cracks = 0) {

            const { ctx } = this.stage;

            const sprite = this.blockSprite(color, stone);

            const size = sprite.size * scale;

            if (size <= 1) {
                return;
            }

            ctx.save();

            ctx.globalAlpha = alpha;

            ctx.drawImage(
                sprite.canvas,
                cx - size / 2,
                cy - size / 2,
                size,
                size
            );

            if (stone && cracks > 0) {

                const s = CELL - 4;

                ctx.globalAlpha = alpha * 0.85;
                ctx.strokeStyle = "#0B0F18";
                ctx.lineWidth = 2;

                for (let i = 0; i < cracks; i += 1) {

                    ctx.beginPath();
                    ctx.moveTo(cx - s / 3 + i * 6, cy - s / 2 + 6);
                    ctx.lineTo(cx + s / 4 - i * 4, cy + s / 2 - 6);
                    ctx.stroke();

                }

            }

            ctx.restore();

        }


        drawPreview() {

            const { ctx } = this.stage;

            /* Bomba: área 3 x 3 */
            if (this.bombMode) {

                const { x, y } = this.cursor;

                const px = BOARD_X + (x - 1) * CELL;
                const py = BOARD_Y + (y - 1) * CELL;

                ctx.save();

                ctx.globalAlpha = 0.28 + Math.sin(this.pulse / 160) * 0.08;

                canvasKit.fillRoundRect(
                    ctx, px, py, CELL * 3, CELL * 3, 10, "#F43F5E"
                );

                ctx.globalAlpha = 1;
                ctx.strokeStyle = "#F43F5E";
                ctx.lineWidth = 2;

                canvasKit.roundRect(ctx, px, py, CELL * 3, CELL * 3, 10);
                ctx.stroke();

                ctx.restore();

                return;

            }

            if (this.drag && this.hover) {

                const piece = this.tray[this.drag.slot];

                if (piece) {

                    this.drawShape(
                        piece,
                        this.hover.x,
                        this.hover.y,
                        this.hover.valid ? "#22C55E" : "#F43F5E",
                        0.4
                    );

                }

                return;

            }

            /* Cursor de teclado */
            const piece = this.tray[this.cursor.slot];

            if (piece && !this.over) {

                this.drawShape(
                    piece,
                    this.cursor.x,
                    this.cursor.y,
                    this.fits(piece, this.cursor.x, this.cursor.y)
                        ? "#22C55E"
                        : "#F43F5E",
                    0.3
                );

            }

        }


        drawShape(piece, ox, oy, color, alpha) {

            const { ctx } = this.stage;

            const cells = piece.shape.cells;

            ctx.save();

            ctx.globalAlpha = alpha;

            for (let y = 0; y < cells.length; y += 1) {

                for (let x = 0; x < cells[y].length; x += 1) {

                    if (!cells[y][x]) {
                        continue;
                    }

                    const bx = ox + x;
                    const by = oy + y;

                    if (bx < 0 || bx >= COLS || by < 0 || by >= ROWS) {
                        continue;
                    }

                    canvasKit.fillRoundRect(
                        ctx,
                        BOARD_X + bx * CELL + 2,
                        BOARD_Y + by * CELL + 2,
                        CELL - 4,
                        CELL - 4,
                        7,
                        color
                    );

                }

            }

            ctx.restore();

        }


        drawTray() {

            const { ctx } = this.stage;

            for (let i = 0; i < 3; i += 1) {

                const x = BOARD_X + i * (SLOT_W + TRAY_GAP);
                const piece = this.tray[i];

                const dragging = this.drag && this.drag.slot === i;

                ctx.save();

                canvasKit.roundRect(ctx, x, TRAY_Y, SLOT_W, SLOT_H, 12);

                ctx.fillStyle = "rgba(12, 16, 26, 0.85)";
                ctx.fill();

                ctx.strokeStyle = dragging
                    ? "rgba(163, 230, 53, 0.6)"
                    : "rgba(255, 255, 255, 0.07)";

                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.restore();

                if (!piece) {
                    continue;
                }

                const center = this.slotCenter(i);

                if (dragging) {

                    /* La pieza sigue al dedo a tamaño de rejilla */
                    const topX = this.drag.x - this.drag.grabX;
                    const topY = this.drag.y - this.drag.grabY;

                    this.drawPieceAt(piece, topX, topY, CELL, 0.95);

                } else {

                    const size = this.pieceSize(piece);

                    this.drawPieceAt(
                        piece,
                        center.x - size.w * TRAY_CELL / 2,
                        center.y - size.h * TRAY_CELL / 2,
                        TRAY_CELL,
                        1
                    );

                }

                /* Número de hueco */
                canvasKit.text(ctx, String(i + 1), x + 14, TRAY_Y + 14, {
                    font: "700 11px 'JetBrains Mono', monospace",
                    color: "rgba(245, 247, 255, 0.35)",
                    align: "left"
                });

            }

        }


        drawPieceAt(piece, left, top, cell, alpha) {

            const { ctx } = this.stage;

            const sprite = this.blockSprite(piece.color, false);

            const cells = piece.shape.cells;

            const scale = cell / CELL;

            const size = sprite.size * scale;

            ctx.save();

            ctx.globalAlpha = alpha;

            for (let y = 0; y < cells.length; y += 1) {

                for (let x = 0; x < cells[y].length; x += 1) {

                    if (!cells[y][x]) {
                        continue;
                    }

                    const cx = left + x * cell + cell / 2;
                    const cy = top + y * cell + cell / 2;

                    ctx.drawImage(
                        sprite.canvas,
                        cx - size / 2,
                        cy - size / 2,
                        size,
                        size
                    );

                    /* La bandeja también enseña el especial: hay que
                       poder planificar antes de colocar. */
                    if (
                        piece.special &&
                        piece.specialAt &&
                        piece.specialAt.x === x &&
                        piece.specialAt.y === y
                    ) {

                        this.drawSpecialMark(cx, cy, piece.special, scale);

                    }

                }

            }

            ctx.restore();

        }


        /** Textos de puntos y combos flotando sobre el tablero */
        drawPopups() {

            const { ctx } = this.stage;

            this.popups.forEach((popup) => {

                const rise = (1 - popup.life) * 34;

                ctx.save();

                ctx.globalAlpha = utils.clamp(popup.life * 1.5, 0, 1);

                canvasKit.text(ctx, popup.text, popup.x, popup.y - rise, {
                    font: "800 17px 'Orbitron', sans-serif",
                    color: popup.color,
                    shadow: popup.color,
                    shadowBlur: 14
                });

                ctx.restore();

            });

        }


        /** Cartel de cambio de mundo */
        drawBanner() {

            const { ctx } = this.stage;

            const banner = this.banner;

            const ratio = banner.timer / banner.max;

            const alpha = utils.clamp(ratio * 3, 0, 1) *
                utils.clamp((1 - ratio) * 6, 0, 1);

            const cx = BOARD_X + BOARD / 2;
            const cy = BOARD_Y + BOARD / 2;

            ctx.save();

            ctx.globalAlpha = alpha * 0.9;

            canvasKit.fillRoundRect(
                ctx, cx - 150, cy - 44, 300, 88, 12, "rgba(5, 7, 14, 0.94)"
            );

            ctx.globalAlpha = alpha;

            ctx.strokeStyle = this.world.wall;
            ctx.lineWidth = 2;

            canvasKit.roundRect(ctx, cx - 150, cy - 44, 300, 88, 12);
            ctx.stroke();

            canvasKit.text(ctx, banner.title, cx, cy - 12, {
                font: "800 22px 'Orbitron', sans-serif",
                color: this.world.wall,
                shadow: this.world.wall,
                shadowBlur: 16
            });

            canvasKit.text(ctx, banner.text, cx, cy + 16, {
                font: "600 11px 'JetBrains Mono', monospace",
                color: "rgba(245, 247, 255, 0.75)"
            });

            ctx.restore();

        }


        drawSide() {

            const { ctx } = this.stage;

            const x = SIDE_X;
            const w = SIDE_W;

            ctx.save();

            canvasKit.roundRect(ctx, x, BOARD_Y, w, BOARD, 12);

            ctx.fillStyle = "rgba(11, 14, 23, 0.8)";
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.restore();

            const padX = x + 14;
            const innerW = w - 28;

            let cursorY = BOARD_Y + 26;

            const section = (label) => {

                canvasKit.text(ctx, label, padX, cursorY, {
                    font: "700 9px 'JetBrains Mono', monospace",
                    color: "rgba(245, 247, 255, 0.4)",
                    align: "left"
                });

                cursorY += 16;

            };

            const bar = (ratio, color, height = 8) => {

                ctx.save();

                canvasKit.roundRect(ctx, padX, cursorY, innerW, height, 4);

                ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
                ctx.fill();

                const fill = utils.clamp(ratio, 0, 1) * innerW;

                if (fill > 2) {

                    canvasKit.roundRect(
                        ctx, padX, cursorY, fill, height, 4
                    );

                    ctx.fillStyle = color;
                    ctx.fill();

                }

                ctx.restore();

                cursorY += height + 22;

            };

            /* Nivel */
            canvasKit.text(ctx, "NIVEL", padX, cursorY, {
                font: "700 9px 'JetBrains Mono', monospace",
                color: "rgba(245, 247, 255, 0.4)",
                align: "left"
            });

            canvasKit.text(ctx, String(this.level), x + w - 14, cursorY, {
                font: "800 20px 'Orbitron', sans-serif",
                color: "#A3E635",
                align: "right"
            });

            cursorY += 18;

            const target = this.target;

            const goal = this.goal;

            bar(
                Math.min(1, this.goalProgress / target.amount),
                goal.color
            );

            canvasKit.text(
                ctx,
                goal.label + "  " + this.goalText(),
                padX,
                cursorY - 8,
                {
                    font: "600 9px 'JetBrains Mono', monospace",
                    color: "rgba(245, 247, 255, 0.55)",
                    align: "left"
                }
            );

            cursorY += 12;

            /* El mundo va en su propia línea: junto al objetivo se
               solapaban cuando el texto era largo. */
            canvasKit.text(ctx, this.world.name, padX, cursorY - 8, {
                font: "800 8px 'Orbitron', sans-serif",
                color: this.world.wall,
                align: "left"
            });

            cursorY += 16;

            /* Racha */
            section("RACHA");

            canvasKit.text(
                ctx,
                this.streak > 0 ? "x" + this.streak : "—",
                x + w - 14,
                cursorY - 16,
                {
                    font: "800 16px 'Orbitron', sans-serif",
                    color: this.streak > 0 ? "#FBBF24" : "rgba(245,247,255,0.3)",
                    align: "right"
                }
            );

            bar(this.streak / 4, "#FBBF24");

            /* Bombas */
            section("BOMBAS [B]");

            for (let i = 0; i < 3; i += 1) {

                const bx = padX + i * 24;

                ctx.save();

                ctx.beginPath();
                ctx.arc(bx + 7, cursorY + 2, 7, 0, Math.PI * 2);

                ctx.fillStyle = i < this.bombs
                    ? (this.bombMode ? "#F43F5E" : "#FB923C")
                    : "rgba(255, 255, 255, 0.08)";

                ctx.fill();

                if (this.bombMode && i < this.bombs) {

                    ctx.shadowColor = "#F43F5E";
                    ctx.shadowBlur = 12;
                    ctx.fill();

                }

                ctx.restore();

            }

            cursorY += 30;

            /* Piedra */
            section("PIEDRA");

            let stones = 0;

            this.board.forEach((row) => {

                row.forEach((cell) => {

                    if (cell && cell.stone) {
                        stones += 1;
                    }

                });

            });

            canvasKit.text(ctx, String(stones), x + w - 14, cursorY - 16, {
                font: "800 14px 'Orbitron', sans-serif",
                color: "#5A6478",
                align: "right"
            });

            cursorY += 20;

            /* Mejor cadena */
            /* Gemas recogidas: es la moneda de los objetivos */
            section("GEMAS");

            canvasKit.text(ctx, "◆ " + this.gems, padX, cursorY, {
                font: "800 15px 'Orbitron', sans-serif",
                color: "#22D3EE",
                align: "left"
            });

            cursorY += 22;

            section("MEJOR CADENA");

            canvasKit.text(
                ctx,
                "x" + Math.max(1, this.bestChain),
                x + w - 14,
                cursorY - 16,
                {
                    font: "800 14px 'Orbitron', sans-serif",
                    color: this.world.wall,
                    align: "right"
                }
            );

            cursorY += 18;

            /* Pista */
            const hints = [
                "ARRASTRA · 1 2 3 ELIGE",
                "FLECHAS + ENTER · B BOMBA",
                "",
                "ESPECIALES",
                "✸ revienta 3x3",
                "⚡ limpia fila y columna",
                "◆ suma una gema",
                "★ dobla los puntos"
            ];

            hints.forEach((line, index) => {

                canvasKit.text(ctx, line, padX, cursorY + index * 15, {
                    font: "600 9px 'JetBrains Mono', monospace",
                    color: "rgba(245, 247, 255, 0.28)",
                    align: "left"
                });

            });

        }


        drawParticles() {

            const { ctx } = this.stage;

            this.particles.forEach((particle) => {

                ctx.globalAlpha = Math.max(0, particle.life);
                ctx.fillStyle = particle.color;

                ctx.fillRect(
                    particle.x - particle.size / 2,
                    particle.y - particle.size / 2,
                    particle.size,
                    particle.size
                );

            });

            ctx.globalAlpha = 1;

        }


        drawFlash() {

            const { ctx } = this.stage;

            const alpha = utils.clamp(this.flash / 260, 0, 1) * 0.16;

            ctx.save();

            ctx.fillStyle = `rgba(245, 247, 255, ${alpha})`;

            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            ctx.restore();

        }


    }


    /* =========================================================
       REGISTRO
       ========================================================= */

    A.registerGame({

        id: "blockblast",
        number: "07",
        name: "BLOCK BLAST",
        genre: "PUZZLE / GRID",
        mode: "BLAST",

        music: "arena",

        accent: "var(--color-lime)",
        accentRgb: "163 230 53",
        cardRgb: "163 230 53",

        ratioMin: 0.85,
        ratioMax: 1.05,

        preview: `
            <span class="preview preview--blockblast">
                <i class="preview__blast preview__blast--a"></i>
                <i class="preview__blast preview__blast--b"></i>
                <i class="preview__blast preview__blast--c"></i>
                <i class="preview__blast preview__blast--d"></i>
            </span>
        `,

        readyTitle: "BLAST",
        readyText: "Arrastra los bloques a la rejilla. Llena una fila o una columna entera para reventarla y encadena roturas para ganar bombas.",
        readyHint: "ENTER — EMPEZAR    ARRASTRA PARA COLOCAR    ESC — SALIR",

        hud: `
            ${A.ui.stat("score", "SCORE", "000000")}
            ${A.ui.stat("best", "BEST", "000000")}
            ${A.ui.divider()}
            ${A.ui.stat("lines", "LINES", "0")}
            ${A.ui.stat("level", "LEVEL", "1")}
            ${A.ui.stat("streak", "STREAK", "x0")}
            ${A.ui.divider()}
            ${A.ui.meter("progress", "NIVEL")}
        `,

        controls: A.ui.switcher("modo", [
            { value: "calma", label: "CALMA" },
            { value: "normal", label: "NORMAL" },
            { value: "ruido", label: "RUIDO" }
        ]),

        hint: "ARRASTRA PARA COLOCAR    1 2 3 ELEGIR    FLECHAS MOVER    ENTER COLOCAR    B BOMBA    P PAUSA",

        create(shell) {
            return new BlockBlastGame(shell);
        }

    });

})(window.Arcade404);
