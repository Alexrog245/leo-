/* =========================================================
   ARCADE 404 — GAME 05 · STACK
   ARENA conserva Sandtrix: la pieza se desmorona en granos
   y un color debe conectar ambas paredes. CLÁSICO comparte
   el shell, pero usa tetrominos sólidos, tablero 10 × 20 y
   limpieza de filas tradicional. Cuatro mundos sostienen la
   ambientación de arena; el clásico usa su propia paleta.
   ========================================================= */

(function (A) {

    "use strict";


    const { utils, canvasKit } = A;


    /* ---------------------------------------------------------
       GEOMETRÍA (lienzo 500 x 632)
       --------------------------------------------------------- */

    const WIDTH = 500;
    const HEIGHT = 632;

    const COLS = 10;
    const ROWS = 20;
    const CELL = 30;

    /* Cada celda del tetromino son SUB x SUB granos de arena */
    const SUB = 8;

    const GW = COLS * SUB;           /* 80 granos de ancho  */
    const GH = ROWS * SUB;           /* 160 granos de alto  */
    const N = GW * GH;

    const PX = CELL / SUB;           /* 3.75 px por grano   */

    const BOARD_X = 16;
    const BOARD_Y = 16;

    const BOARD_W = COLS * CELL;     /* 300 */
    const BOARD_H = ROWS * CELL;     /* 600 */

    const SIDE_X = BOARD_X + BOARD_W + 16;   /* 332 */
    const SIDE_W = WIDTH - SIDE_X - 16;      /* 152 */

    const PREVIEW_CELL = 15;


    /* ---------------------------------------------------------
       PIEZAS (formas clásicas; el color lo pone el mundo)
       --------------------------------------------------------- */

    const SHAPES = {

        I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
        O: [[1, 1], [1, 1]],
        T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
        S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
        Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
        J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
        L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]]

    };

    const TYPES = Object.keys(SHAPES);


    /* Velocidad de caída de la pieza en granos por segundo */
    const FALL_SPEED = [
        26, 32, 38, 46, 54, 64, 74, 86, 98, 112,
        126, 142, 158, 176, 194, 214, 234, 256, 278, 300
    ];

    const SOFT_MIN = 170;        /* caída rápida mínima (granos/s) */
    const SOFT_MULT = 4;

    const SIDE_SPEED = 110;      /* desplazamiento lateral mantenido */
    const SIDE_TAP = 4;          /* granos por toque                 */
    const DAS_DELAY = 130;

    const LOCK_DELAY = 110;      /* margen antes de desmoronarse     */
    const SPAWN_DELAY = 110;

    const SAND_HZ = 150;         /* pasos de física por segundo      */
    const SAND_HZ_ECO = 72;      /* perfil fluido para hardware justo */
    const CHECK_MS = 90;         /* cada cuánto se buscan puentes    */
    const FLASH_TIME = 320;      /* destello de la línea             */
    const PARTICLE_LIMIT = 180;
    const PARTICLE_LIMIT_ECO = 72;

    const LINES_PER_LEVEL = 5;
    const LEVELS_PER_WORLD = 2;

    const CLASSIC_COLORS = {
        I: "#22D3EE",
        O: "#FBBF24",
        T: "#A78BFA",
        S: "#4ADE80",
        Z: "#FB7185",
        J: "#60A5FA",
        L: "#FB923C"
    };
    const CLASSIC_LINE_SCORES = [0, 100, 300, 500, 800];
    const CLASSIC_SPAWN_DELAY = 105;
    const CLASSIC_LOCK_DELAY = 420;
    const CLASSIC_ARR = 76;
    const CLASSIC_KICKS = [
        [0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]
    ];
    const ARENA_HINTS = [
        "← → MOVER", "↑ / X ROTAR", "↓ CAÍDA RÁPIDA", "ESPACIO SOLTAR", "C GUARDAR",
        "", "UN COLOR DE", "PARED A PARED", "= LÍNEA"
    ];
    const CLASSIC_HINTS = [
        "← → MOVER", "↑ / X ROTAR", "↓ CAÍDA RÁPIDA", "ESPACIO SOLTAR", "C GUARDAR",
        "", "10 × 20", "FILA COMPLETA", "= LÍNEA"
    ];

    const KICKS = [
        [0, 0], [-SUB, 0], [SUB, 0], [-4, 0], [4, 0],
        [0, -SUB], [-2 * SUB, 0], [2 * SUB, 0], [0, -2 * SUB]
    ];


    /* ---------------------------------------------------------
       MUNDOS — paleta de arena (4 colores) y paisaje
       --------------------------------------------------------- */

    const WORLDS = [

        {
            name: "DUNAS",
            sand: ["#FBBF24", "#F43F5E", "#8B5CF6", "#22D3EE"],
            sky: ["#2B1B4A", "#7C3AED", "#F97316", "#FDBA74"],
            sun: "#FDE68A",
            agua: false,
            estrellas: true,
            nubes: false,
            montes: "#4C1D95",
            suelo: "#7C2D12"
        },

        {
            name: "PLAYA",
            sand: ["#22D3EE", "#A3E635", "#F472B6", "#FDE68A"],
            sky: ["#0EA5E9", "#38BDF8", "#7DD3FC", "#E0F2FE"],
            sun: "#FEF9C3",
            agua: true,
            estrellas: false,
            nubes: true,
            montes: "#0369A1",
            suelo: "#FDE68A"
        },

        {
            name: "NEÓN",
            sand: ["#A3E635", "#F472B6", "#22D3EE", "#FBBF24"],
            sky: ["#0B0F2B", "#312E81", "#7C3AED", "#DB2777"],
            sun: "#F472B6",
            agua: false,
            estrellas: true,
            nubes: false,
            montes: "#1E1B4B",
            suelo: "#111827"
        },

        {
            name: "AURORA",
            sand: ["#34D399", "#8B5CF6", "#F43F5E", "#FDE68A"],
            sky: ["#042F2E", "#065F46", "#0D9488", "#5EEAD4"],
            sun: "#A7F3D0",
            agua: false,
            estrellas: true,
            nubes: false,
            montes: "#022C22",
            suelo: "#052E2B"
        }

    ];


    /* =========================================================
       UTILIDADES
       ========================================================= */

    function rotateMatrix(matrix, direction) {

        const size = matrix.length;

        const result = [];

        for (let y = 0; y < size; y += 1) {
            result.push(new Array(size).fill(0));
        }

        for (let y = 0; y < size; y += 1) {

            for (let x = 0; x < size; x += 1) {

                if (direction > 0) {
                    result[y][x] = matrix[size - 1 - x][y];
                } else {
                    result[size - 1 - x][y] = matrix[y][x];
                }

            }

        }

        return result;

    }


    function shuffleList(list) {

        const copy = list.slice();

        for (let i = copy.length - 1; i > 0; i -= 1) {

            const j = Math.floor(Math.random() * (i + 1));

            const temp = copy[i];

            copy[i] = copy[j];
            copy[j] = temp;

        }

        return copy;

    }


    function cloneMatrix(matrix) {

        return matrix.map((row) => row.slice());

    }


    function hexToRgb(hex) {

        const value = parseInt(hex.slice(1), 16);

        return [(value >> 16) & 255, (value >> 8) & 255, value & 255];

    }


    /** Paleta de granos: 4 colores x 4 tonos, en bytes RGB */
    function buildPalette(colors) {

        const out = new Uint8ClampedArray(colors.length * 4 * 3);

        colors.forEach((hex, index) => {

            const [r, g, b] = hexToRgb(hex);

            const tones = [
                [r, g, b],
                [r + 26, g + 26, b + 26],
                [r - 22, g - 22, b - 22],
                [r - 42, g - 42, b - 42]
            ];

            tones.forEach((tone, t) => {

                const o = (index * 4 + t) * 3;

                out[o] = tone[0];
                out[o + 1] = tone[1];
                out[o + 2] = tone[2];

            });

        });

        return out;

    }


    /* =========================================================
       JUEGO
       ========================================================= */

    class SandtrixGame {


        constructor(shell) {

            this.shell = shell;

            this.stage = A.createStage(shell.refs.stage, {
                width: WIDTH,
                height: HEIGHT,
                background: "#05070E",
                /* El tablero es pixel-art: 1.5x conserva nitidez sin pedir
                   cuatro veces más píxeles al móvil en la escena de arena. */
                maxDpr: 1.5,
                contextOptions: { alpha: false, desynchronized: true }
            });

            this.startLevel = 1;
            this.mode = "arena";
            this.performanceProfile = {
                constrained: false,
                lowFpsSamples: 0,
                sandHz: SAND_HZ,
                maxSandSteps: 6,
                particleLimit: PARTICLE_LIMIT
            };

            /* Buffers de la arena */
            this.color = new Uint8Array(N);     /* 0 vacío, 1..4 color  */

            /* Fila de granos más alta que tiene arena. Todo lo que
               está por encima es vacío garantizado, así que la
               simulación y el pintado se lo pueden saltar. */
            this.topRow = GH;
            this.shade = new Uint8Array(N);     /* 0..3 tono del grano  */
            this.mask = new Uint8Array(N);      /* granos a limpiar     */
            this.visited = new Uint8Array(N);
            this.stack = new Int32Array(N);
            this.comp = new Int32Array(N);
            /* Evita volver a recorrer los 12.800 granos al terminar una
               limpieza: se guarda exactamente la lista que va a desaparecer. */
            this.clearList = new Int32Array(N);
            this.clearCount = 0;

            /* Lienzo de granos (1 px = 1 grano) */
            this.sandCanvas = document.createElement("canvas");
            this.sandCanvas.width = GW;
            this.sandCanvas.height = GH;
            this.sandCtx = this.sandCanvas.getContext("2d");
            this.img = this.sandCtx.createImageData(GW, GH);

            this._fondos = {};

            this.reset();

            this.bindMode();
            this.bindStartLevel();

            shell.setTouchControls({
                /* La caída fuerte necesita una acción independiente: DROP
                   usa el mismo gesto que ESPACIO sin sacrificar el giro al
                   empujar el joystick hacia arriba. */
                mode: "dpad-fire",
                actionLabel: "DROP",
                analogLabel: "Joystick analógico: lados para mover, abajo para bajar y arriba para girar.",
                onDirection: (dir) => {

                    if (dir === "left") {
                        this.moveX(-SUB);
                    } else if (dir === "right") {
                        this.moveX(SUB);
                    } else if (dir === "down") {
                        this.moveDown(SUB);
                    } else if (dir === "up") {
                        this.rotate(1);
                    }

                },
                onAction: (action) => {
                    if (action === "fire") {
                        this.hardDrop();
                    }
                    /* DROP es una pulsación, no fuego continuo: evita que un
                       dedo sostenido coloque la siguiente pieza por sorpresa. */
                    return false;
                }
            });

        }


        /* ---------------------------------------------------------
           Estado
           --------------------------------------------------------- */

        reset() {

            if (this.mode === "classic") {
                this.resetClassic();
                return;
            }

            this.level = this.startLevel;

            this.worldIndex = this.worldForLevel(this.level);
            this.world = WORLDS[this.worldIndex];
            this.palette = buildPalette(this.world.sand);

            this.lines = 0;
            this.levelLines = 0;
            this.pieceClears = 0;
            this.bestChain = 0;
            this.score = 0;

            this.color.fill(0);

            this.topRow = GH;
            this.shade.fill(0);
            this.mask.fill(0);
            this.clearCount = 0;

            this.bag = [];
            this.piece = null;
            this.next = null;
            this.hold = null;
            this.holdUsed = false;

            this.over = false;

            this.flash = null;
            this.sandAcc = 0;
            this.checkTimer = 0;
            this.activity = true;
            this.tick = 0;
            this.settled = true;

            this.spawnTimer = 0;
            this.lockTimer = 0;

            this.particles = [];
            this.popups = [];
            this.banner = null;
            this.shake = 0;
            this.screenFlash = 0;

            this.keys = {
                left: { held: false, timer: 0, repeating: false, acc: 0 },
                right: { held: false, timer: 0, repeating: false, acc: 0 },
                down: { held: false }
            };

            this.time = 0;

            this.spawn();

            this.updateStats();

            this.shell.setStatus(
                "Cruza el tablero con arena de un mismo color"
            );

        }


        /* El modo clásico usa una grilla 10×20, sin simulación por grano.
           Mantener sus buffers separados da la sensación tradicional y a la
           vez ofrece una ruta mucho más ligera en teléfonos modestos. */
        resetClassic() {

            this.level = this.startLevel;
            this.worldIndex = 2;
            this.world = WORLDS[this.worldIndex];
            this.palette = buildPalette(this.world.sand);

            this.lines = 0;
            this.levelLines = 0;
            this.pieceClears = 0;
            this.bestChain = 0;
            this.score = 0;

            if (!this.classicBoard) {
                this.classicBoard = new Uint8Array(COLS * ROWS);
            }
            this.classicBoard.fill(0);

            this.bag = [];
            this.piece = null;
            this.next = null;
            this.hold = null;
            this.holdUsed = false;
            this.over = false;

            this.classicFall = 0;
            this.classicLockTimer = 0;
            this.classicSpawnTimer = 0;
            this.classicFlashRows = [];

            this.particles = [];
            this.popups = [];
            this.banner = null;
            this.shake = 0;
            this.screenFlash = 0;

            this.keys = {
                left: { held: false, timer: 0, repeating: false, acc: 0 },
                right: { held: false, timer: 0, repeating: false, acc: 0 },
                down: { held: false }
            };

            this.time = 0;
            this.spawnClassic();
            this.updateStats();
            this.shell.setStatus("Completa filas de bloque a bloque");

        }


        start() {

            this.reset();

            A.audio.play("start");

        }


        restart() {

            this.reset();

        }


        destroy() {

            this.stage.destroy();

        }


        worldForLevel(level) {

            return Math.floor((level - 1) / LEVELS_PER_WORLD) % WORLDS.length;

        }


        /* ---------------------------------------------------------
           Piezas
           --------------------------------------------------------- */

        nextType() {

            if (!this.bag.length) {
                this.bag = shuffleList(TYPES);
            }

            return this.bag.pop();

        }


        makePiece() {

            const type = this.nextType();

            const matrix = cloneMatrix(SHAPES[type]);

            const size = matrix.length;

            /* Textura de arena propia de la pieza (tono por grano) */
            const shades = new Uint8Array(size * SUB * size * SUB);

            for (let i = 0; i < shades.length; i += 1) {

                const r = Math.random();

                shades[i] = r < 0.55 ? 0 : r < 0.75 ? 1 : r < 0.92 ? 2 : 3;

            }

            return {
                type,
                matrix,
                size,
                colorIndex: 1 + Math.floor(Math.random() * this.world.sand.length),
                shades,
                x: 0,
                y: 0,
                iy: 0
            };

        }


        topOffset(matrix) {

            for (let y = 0; y < matrix.length; y += 1) {

                for (let x = 0; x < matrix[y].length; x += 1) {

                    if (matrix[y][x]) {
                        return y;
                    }

                }

            }

            return 0;

        }


        /* ---------------------------------------------------------
           TETRIS CLÁSICO
           --------------------------------------------------------- */

        makeClassicPiece() {

            const type = this.nextType();
            const matrix = cloneMatrix(SHAPES[type]);

            return {
                type,
                matrix,
                size: matrix.length,
                x: 0,
                y: 0
            };

        }


        classicFallInterval() {

            return Math.max(62, 860 - (this.level - 1) * 62);

        }


        spawnClassic() {

            const piece = this.next ? this.next : this.makeClassicPiece();

            this.next = this.makeClassicPiece();
            piece.x = Math.floor((COLS - piece.size) / 2);
            piece.y = -this.topOffset(piece.matrix);

            this.piece = piece;
            this.classicFall = 0;
            this.classicLockTimer = 0;
            this.holdUsed = false;

            if (!this.fitsClassic(piece.matrix, piece.x, piece.y)) {
                this.gameOver();
            }

        }


        fitsClassic(matrix, px, py) {

            const board = this.classicBoard;

            for (let cy = 0; cy < matrix.length; cy += 1) {
                for (let cx = 0; cx < matrix[cy].length; cx += 1) {
                    if (!matrix[cy][cx]) continue;

                    const x = px + cx;
                    const y = py + cy;

                    if (x < 0 || x >= COLS || y >= ROWS) {
                        return false;
                    }
                    if (y >= 0 && board[y * COLS + x]) {
                        return false;
                    }
                }
            }

            return true;

        }


        moveClassicX(amount) {

            const piece = this.piece;
            if (!piece || this.over) return 0;

            const sign = amount < 0 ? -1 : 1;
            if (!this.fitsClassic(piece.matrix, piece.x + sign, piece.y)) {
                return 0;
            }

            piece.x += sign;
            this.classicLockTimer = 0;
            return 1;

        }


        moveClassicDown(amount = 1) {

            const piece = this.piece;
            if (!piece || this.over) return true;

            const steps = Math.max(1, Math.round(Math.abs(amount) / SUB));

            for (let i = 0; i < steps; i += 1) {
                if (!this.fitsClassic(piece.matrix, piece.x, piece.y + 1)) {
                    return true;
                }
                piece.y += 1;
            }

            this.classicLockTimer = 0;
            return false;

        }


        rotateClassic(direction) {

            const piece = this.piece;
            if (!piece || this.over || piece.type === "O") return false;

            const matrix = rotateMatrix(piece.matrix, direction);

            for (let i = 0; i < CLASSIC_KICKS.length; i += 1) {
                const x = piece.x + CLASSIC_KICKS[i][0];
                const y = piece.y + CLASSIC_KICKS[i][1];

                if (this.fitsClassic(matrix, x, y)) {
                    piece.matrix = matrix;
                    piece.x = x;
                    piece.y = y;
                    this.classicLockTimer = 0;
                    A.audio.play("rotate");
                    return true;
                }
            }

            return false;

        }


        hardDropClassic() {

            const piece = this.piece;
            if (!piece || this.over) return;

            let dropped = 0;
            while (this.fitsClassic(piece.matrix, piece.x, piece.y + 1)) {
                piece.y += 1;
                dropped += 1;
            }

            this.score += dropped * 2;
            this.shake = 4;
            this.lockClassic();

        }


        holdClassicPiece() {

            if (!this.piece || this.over || this.holdUsed) return;

            const current = this.piece;
            current.matrix = cloneMatrix(SHAPES[current.type]);

            if (this.hold) {
                const swap = this.hold;
                this.hold = current;
                swap.matrix = cloneMatrix(SHAPES[swap.type]);
                swap.size = swap.matrix.length;
                swap.x = Math.floor((COLS - swap.size) / 2);
                swap.y = -this.topOffset(swap.matrix);
                this.piece = swap;

                if (!this.fitsClassic(swap.matrix, swap.x, swap.y)) {
                    this.gameOver();
                }
            } else {
                this.hold = current;
                this.piece = null;
                this.spawnClassic();
            }

            this.holdUsed = true;
            this.classicLockTimer = 0;
            A.audio.play("select");

        }


        lockClassic() {

            const piece = this.piece;
            if (!piece) return;

            let topOut = false;
            const colorIndex = TYPES.indexOf(piece.type) + 1;

            for (let cy = 0; cy < piece.size; cy += 1) {
                for (let cx = 0; cx < piece.size; cx += 1) {
                    if (!piece.matrix[cy][cx]) continue;

                    const x = piece.x + cx;
                    const y = piece.y + cy;

                    if (y < 0) {
                        topOut = true;
                    } else {
                        this.classicBoard[y * COLS + x] = colorIndex;
                    }
                }
            }

            this.piece = null;
            this.pieceClears = 0;
            this.classicSpawnTimer = CLASSIC_SPAWN_DELAY;
            A.audio.play("place");

            if (topOut) {
                this.gameOver();
                return;
            }

            const cleared = this.clearClassicRows();
            if (!cleared) return;

            this.pieceClears = cleared;
            this.bestChain = Math.max(this.bestChain, cleared);
            this.lines += cleared;
            this.levelLines += cleared;

            const points = CLASSIC_LINE_SCORES[cleared] * this.level;
            this.score += points;
            this.shake = 5 + cleared * 2;
            this.screenFlash = 160 + cleared * 30;

            this.popups.push({
                text: cleared === 4 ? "TETRIS! +" + utils.formatScore(points) : "+" + utils.formatScore(points),
                x: BOARD_X + BOARD_W / 2,
                y: BOARD_Y + BOARD_H * 0.42,
                life: 1,
                color: cleared === 4 ? "#FBBF24" : "#F5F7FF"
            });

            A.audio.play(cleared === 4 ? "tetris" : "line");
            this.checkClassicLevel();
            this.updateStats();

        }


        clearClassicRows() {

            const board = this.classicBoard;
            let write = ROWS - 1;
            let cleared = 0;

            for (let read = ROWS - 1; read >= 0; read -= 1) {
                const offset = read * COLS;
                let full = true;

                for (let x = 0; x < COLS; x += 1) {
                    if (!board[offset + x]) {
                        full = false;
                        break;
                    }
                }

                if (full) {
                    cleared += 1;
                    for (let x = 0; x < COLS; x += 1) {
                        const index = board[offset + x] - 1;
                        this.spawnClassicBurst(x, read, CLASSIC_COLORS[TYPES[index]]);
                    }
                    continue;
                }

                if (write !== read) {
                    board.copyWithin(write * COLS, offset, offset + COLS);
                }
                write -= 1;
            }

            if (cleared) {
                board.fill(0, 0, (write + 1) * COLS);
            }

            return cleared;

        }


        checkClassicLevel() {

            let leveled = false;

            while (this.levelLines >= LINES_PER_LEVEL) {
                this.levelLines -= LINES_PER_LEVEL;
                this.level += 1;
                leveled = true;
            }

            if (!leveled) return;

            this.banner = {
                title: "NIVEL " + this.level,
                text: "La caída acelera",
                timer: 1600,
                max: 1600
            };
            this.shell.levelUpTaunt();
            A.audio.play("win");

        }


        spawnClassicBurst(x, y, color) {

            const limit = this.performanceProfile.particleLimit;
            if (this.particles.length >= limit) return;

            const px = BOARD_X + (x + 0.5) * CELL;
            const py = BOARD_Y + (y + 0.5) * CELL;
            const count = Math.min(2, limit - this.particles.length);

            for (let i = 0; i < count; i += 1) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.045 + Math.random() * 0.14;
                this.particles.push({
                    x: px,
                    y: py,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 0.07,
                    life: 1,
                    decay: 0.0018 + Math.random() * 0.002,
                    size: 2 + Math.random() * 3,
                    color: color || "#F5F7FF"
                });
            }

        }


        spawn() {

            if (this.mode === "classic") {
                this.spawnClassic();
                return;
            }

            const piece = this.next ? this.next : this.makePiece();

            this.next = this.makePiece();

            piece.x = Math.floor((COLS - piece.size) / 2) * SUB;
            piece.iy = -this.topOffset(piece.matrix) * SUB;
            piece.y = piece.iy;

            this.piece = piece;
            this.lockTimer = 0;
            this.holdUsed = false;

            if (!this.fits(piece.matrix, piece.x, piece.iy)) {

                this.gameOver();

            }

        }


        /** ¿Cabe la pieza con esa matriz en esa posición (en granos)? */
        fits(matrix, px, py) {

            const color = this.color;

            for (let cy = 0; cy < matrix.length; cy += 1) {

                for (let cx = 0; cx < matrix[cy].length; cx += 1) {

                    if (!matrix[cy][cx]) {
                        continue;
                    }

                    const x0 = px + cx * SUB;
                    const y0 = py + cy * SUB;

                    if (x0 < 0 || x0 + SUB > GW || y0 + SUB > GH) {
                        return false;
                    }

                    for (let yy = 0; yy < SUB; yy += 1) {

                        const gy = y0 + yy;

                        if (gy < 0) {
                            continue;
                        }

                        const row = gy * GW + x0;

                        for (let xx = 0; xx < SUB; xx += 1) {

                            if (color[row + xx]) {
                                return false;
                            }

                        }

                    }

                }

            }

            return true;

        }


        moveX(amount) {

            if (this.mode === "classic") {
                return this.moveClassicX(amount);
            }

            const piece = this.piece;

            if (!piece || this.over) {
                return 0;
            }

            const sign = amount < 0 ? -1 : 1;

            let moved = 0;

            for (let i = 0; i < Math.abs(amount); i += 1) {

                if (!this.fits(piece.matrix, piece.x + sign, piece.iy)) {
                    break;
                }

                piece.x += sign;
                moved += 1;

            }

            return moved;

        }


        /** Baja la pieza hasta `amount` granos; devuelve si chocó */
        moveDown(amount) {

            if (this.mode === "classic") {
                return this.moveClassicDown(amount);
            }

            const piece = this.piece;

            if (!piece || this.over) {
                return true;
            }

            for (let i = 0; i < amount; i += 1) {

                if (!this.fits(piece.matrix, piece.x, piece.iy + 1)) {
                    piece.y = piece.iy;
                    return true;
                }

                piece.iy += 1;

            }

            if (piece.y < piece.iy) {
                piece.y = piece.iy;
            }

            return false;

        }


        rotate(direction) {

            if (this.mode === "classic") {
                return this.rotateClassic(direction);
            }

            const piece = this.piece;

            if (!piece || this.over || piece.type === "O") {
                return;
            }

            const matrix = rotateMatrix(piece.matrix, direction);

            for (let i = 0; i < KICKS.length; i += 1) {

                const px = piece.x + KICKS[i][0];
                const py = piece.iy + KICKS[i][1];

                if (this.fits(matrix, px, py)) {

                    piece.matrix = matrix;
                    piece.x = px;
                    piece.iy = py;
                    piece.y = Math.min(piece.y, py);

                    A.audio.play("rotate");

                    return;

                }

            }

        }


        hardDrop() {

            if (this.mode === "classic") {
                this.hardDropClassic();
                return;
            }

            const piece = this.piece;

            if (!piece || this.over) {
                return;
            }

            let dropped = 0;

            while (this.fits(piece.matrix, piece.x, piece.iy + 1)) {

                piece.iy += 1;
                dropped += 1;

            }

            piece.y = piece.iy;

            this.score += Math.floor(dropped / SUB) * 2;

            this.shake = 5;

            this.lock();

        }


        holdPiece() {

            if (this.mode === "classic") {
                this.holdClassicPiece();
                return;
            }

            if (!this.piece || this.over || this.holdUsed) {
                return;
            }

            const current = this.piece;

            current.matrix = cloneMatrix(SHAPES[current.type]);

            if (this.hold) {

                const swap = this.hold;

                this.hold = current;

                swap.x = Math.floor((COLS - swap.size) / 2) * SUB;
                swap.iy = -this.topOffset(swap.matrix) * SUB;
                swap.y = swap.iy;

                this.piece = swap;

                if (!this.fits(swap.matrix, swap.x, swap.iy)) {
                    this.gameOver();
                }

            } else {

                this.hold = current;
                this.piece = null;
                this.spawn();

            }

            this.holdUsed = true;
            this.lockTimer = 0;

            A.audio.play("select");

        }


        /** La pieza se desmorona: sus granos pasan al tablero */
        lock() {

            if (this.mode === "classic") {
                this.lockClassic();
                return;
            }

            const piece = this.piece;

            if (!piece) {
                return;
            }

            const { matrix, x, iy, colorIndex, shades, size } = piece;

            let topOut = false;

            for (let cy = 0; cy < size; cy += 1) {

                for (let cx = 0; cx < size; cx += 1) {

                    if (!matrix[cy][cx]) {
                        continue;
                    }

                    for (let yy = 0; yy < SUB; yy += 1) {

                        const gy = iy + cy * SUB + yy;

                        if (gy < 0) {
                            topOut = true;
                            continue;
                        }

                        for (let xx = 0; xx < SUB; xx += 1) {

                            const gx = x + cx * SUB + xx;

                            const i = gy * GW + gx;

                            this.color[i] = colorIndex;

                            /* El techo sube si esta pieza queda más alta */
                            if (gy < this.topRow) {
                                this.topRow = gy;
                            }

                            this.shade[i] = shades[
                                (cy * SUB + yy) * (size * SUB) + cx * SUB + xx
                            ];

                        }

                    }

                }

            }

            this.piece = null;
            this.pieceClears = 0;
            this.spawnTimer = SPAWN_DELAY;
            this.activity = true;
            this.settled = false;

            A.audio.play("place");
            A.audio.play("arena");

            if (topOut) {
                this.gameOver();
            }

        }


        gameOver() {

            if (this.over) {
                return;
            }

            this.over = true;
            this.piece = null;

            this.releaseKeys();

            this.shell.gameOver({
                taunt: true,
                score: this.score
            });

        }


        /* ---------------------------------------------------------
           Física de la arena
           --------------------------------------------------------- */

        /** Un paso: cada grano baja recto o se escurre en diagonal */
        stepSand() {

            const color = this.color;
            const shade = this.shade;

            this.tick += 1;

            const leftToRight = (this.tick & 1) === 0;

            let moved = 0;

            /* Sólo desde la primera fila con arena: por encima está
               todo vacío y recorrerlo era trabajo tirado. */
            const from = Math.max(0, this.topRow - 1);

            for (let y = GH - 2; y >= from; y -= 1) {

                const row = y * GW;
                const below = row + GW;

                const preferLeft = ((y + this.tick) & 1) === 0;

                for (let k = 0; k < GW; k += 1) {

                    const x = leftToRight ? k : GW - 1 - k;

                    const i = row + x;
                    const c = color[i];

                    if (!c) {
                        continue;
                    }

                    const b = below + x;

                    if (!color[b]) {

                        color[b] = c;
                        shade[b] = shade[i];
                        color[i] = 0;
                        moved += 1;

                        continue;

                    }

                    const canLeft = x > 0 && !color[b - 1] && !color[i - 1];
                    const canRight = x < GW - 1 && !color[b + 1] && !color[i + 1];

                    let target = -1;

                    if (canLeft && canRight) {
                        target = preferLeft ? b - 1 : b + 1;
                    } else if (canLeft) {
                        target = b - 1;
                    } else if (canRight) {
                        target = b + 1;
                    }

                    if (target >= 0) {

                        color[target] = c;
                        shade[target] = shade[i];
                        color[i] = 0;
                        moved += 1;

                    }

                }

            }

            return moved;

        }


        /** Busca capas de un color que unan las dos paredes */
        findClears() {

            const color = this.color;
            const visited = this.visited;
            const stack = this.stack;
            const comp = this.comp;
            const mask = this.mask;
            const clearList = this.clearList;
            const from = Math.max(0, this.topRow - 1);

            /* Las filas por encima del techo garantizado están vacías. No
               hace falta limpiarlas ni volver a iniciar una búsqueda allí. */
            visited.fill(0, from * GW);
            this.clearCount = 0;

            let total = 0;

            for (let y = from; y < GH; y += 1) {

                const start = y * GW;

                const c = color[start];

                if (!c || visited[start]) {
                    continue;
                }

                let sp = 0;
                let count = 0;
                let reachRight = false;

                stack[sp++] = start;
                visited[start] = 1;

                while (sp > 0) {

                    const j = stack[--sp];

                    comp[count++] = j;

                    const x = j % GW;

                    if (x === GW - 1) {
                        reachRight = true;
                    }

                    if (x > 0) {

                        const n = j - 1;

                        if (color[n] === c && !visited[n]) {
                            visited[n] = 1;
                            stack[sp++] = n;
                        }

                    }

                    if (x < GW - 1) {

                        const n = j + 1;

                        if (color[n] === c && !visited[n]) {
                            visited[n] = 1;
                            stack[sp++] = n;
                        }

                    }

                    if (j >= GW) {

                        const n = j - GW;

                        if (color[n] === c && !visited[n]) {
                            visited[n] = 1;
                            stack[sp++] = n;
                        }

                    }

                    if (j + GW < N) {

                        const n = j + GW;

                        if (color[n] === c && !visited[n]) {
                            visited[n] = 1;
                            stack[sp++] = n;
                        }

                    }

                }

                if (reachRight) {

                    for (let k = 0; k < count; k += 1) {
                        const index = comp[k];
                        mask[index] = 1;
                        clearList[this.clearCount++] = index;
                    }

                    total += count;

                }

            }

            if (total > 0) {

                this.flash = {
                    timer: FLASH_TIME,
                    duration: FLASH_TIME,
                    pixels: total,
                    count: this.clearCount
                };

                A.audio.play("line");

            }

            return total;

        }


        /** Termina el destello: quita los granos y puntúa */
        finishFlash() {

            const pixels = this.flash.pixels;

            const mask = this.mask;
            const color = this.color;
            const clearList = this.clearList;
            const count = this.flash.count || this.clearCount;

            let sampled = 0;

            for (let k = 0; k < count; k += 1) {

                const i = clearList[k];

                if (sampled < 70 && Math.random() < 0.08) {

                    this.spawnBurst(
                        i % GW,
                        Math.floor(i / GW),
                        this.world.sand[color[i] - 1]
                    );

                    sampled += 1;

                }

                color[i] = 0;
                mask[i] = 0;

            }

            this.clearCount = 0;
            this.refreshTopRow();
            this.flash = null;

            this.pieceClears += 1;
            this.bestChain = Math.max(this.bestChain, this.pieceClears);

            const chainMult = 1 + (this.pieceClears - 1) * 0.5;

            const points = Math.round(
                pixels * (1 + this.level * 0.5) * chainMult
            );

            this.score += points;

            this.lines += 1;
            this.levelLines += 1;

            const cx = BOARD_X + BOARD_W / 2;
            const cy = BOARD_Y + BOARD_H * 0.42;

            this.popups.push({
                text: "+" + utils.formatScore(points, 1),
                x: cx,
                y: cy,
                life: 1,
                color: "#F5F7FF"
            });

            if (this.pieceClears > 1) {

                this.popups.push({
                    text: "COMBO x" + this.pieceClears,
                    x: cx,
                    y: cy + 28,
                    life: 1,
                    color: "#FBBF24"
                });

                A.audio.play("tetris");

            }

            this.shake = 6 + Math.min(10, pixels / 120);
            this.screenFlash = 200;

            this.activity = true;
            this.settled = false;

            this.checkLevel();

            this.updateStats();

        }


        /* Recalcular sólo después de una limpieza devuelve el límite de
           simulación/pintado a la primera fila con arena real. */
        refreshTopRow() {

            const color = this.color;

            for (let y = 0; y < GH; y += 1) {
                const row = y * GW;
                for (let x = 0; x < GW; x += 1) {
                    if (color[row + x]) {
                        this.topRow = y;
                        return;
                    }
                }
            }

            this.topRow = GH;

        }


        checkLevel() {

            if (this.levelLines < LINES_PER_LEVEL) {
                return;
            }

            this.levelLines -= LINES_PER_LEVEL;

            this.level += 1;

            const newWorld = this.worldForLevel(this.level);

            const cambio = newWorld !== this.worldIndex;

            this.worldIndex = newWorld;
            this.world = WORLDS[this.worldIndex];

            if (cambio) {

                /* Nueva paleta: los granos que hay se re-pintan */
                this.palette = buildPalette(this.world.sand);

                if (this.next) {
                    this.next.colorIndex = 1 + Math.floor(
                        Math.random() * this.world.sand.length
                    );
                }

            }

            this.banner = {
                title: cambio
                    ? "MUNDO " + (this.worldIndex + 1)
                    : "NIVEL " + this.level,
                text: cambio ? this.world.name : "La arena cae más rápido",
                timer: 1600,
                max: 1600
            };

            this.screenFlash = 300;

            /* La máquina sigue sin aceptarlo */
            this.shell.levelUpTaunt();

            A.audio.play("win");

        }


        /* ---------------------------------------------------------
           Bucle
           --------------------------------------------------------- */

        update(dt) {

            if (this.mode === "classic") {
                this.updateClassic(dt);
                return;
            }

            if (this.over) {
                return;
            }

            this.time += dt;

            this.updateKeys(dt);
            this.updatePopups(dt);
            this.updateParticles(dt);

            if (this.shake > 0) {
                this.shake = Math.max(0, this.shake - dt * 0.03);
            }

            if (this.screenFlash > 0) {
                this.screenFlash = Math.max(0, this.screenFlash - dt);
            }

            if (this.banner) {

                this.banner.timer -= dt;

                if (this.banner.timer <= 0) {
                    this.banner = null;
                }

            }

            /* Arena */
            if (this.flash) {

                this.flash.timer -= dt;

                if (this.flash.timer <= 0) {
                    this.finishFlash();
                }

            } else {

                this.sandAcc += dt;

                const stepMs = 1000 / this.performanceProfile.sandHz;
                const maxSteps = this.performanceProfile.maxSandSteps;

                let steps = 0;

                while (this.sandAcc >= stepMs && steps < maxSteps) {

                    this.sandAcc -= stepMs;
                    steps += 1;

                    const moved = this.stepSand();

                    if (moved > 0) {
                        this.activity = true;
                        this.settled = false;
                    } else {
                        this.settled = true;
                    }

                }

                /* Igual que el loop global, no dejamos que una pestaña lenta
                   acumule física vieja y convierta el siguiente frame en un
                   congelón de arena. */
                if (steps === maxSteps && this.sandAcc >= stepMs) {
                    this.sandAcc = Math.min(this.sandAcc, stepMs);
                }

            }

            /* Pieza */
            if (this.piece) {

                this.updatePiece(dt);

            } else {

                this.spawnTimer -= dt;

                if (this.spawnTimer <= 0) {
                    this.spawn();
                }

            }

            /* Puentes de color */
            this.checkTimer += dt;

            if (this.checkTimer >= CHECK_MS && !this.flash && this.activity) {

                this.checkTimer = 0;

                this.findClears();

                if (this.settled && !this.flash) {
                    this.activity = false;
                }

            }

            this.updateStats();

        }


        updateClassic(dt) {

            if (this.over) return;

            this.time += dt;
            this.updateKeysClassic(dt);
            this.updatePopups(dt);
            this.updateParticles(dt);

            if (this.shake > 0) {
                this.shake = Math.max(0, this.shake - dt * 0.03);
            }
            if (this.screenFlash > 0) {
                this.screenFlash = Math.max(0, this.screenFlash - dt);
            }
            if (this.banner) {
                this.banner.timer -= dt;
                if (this.banner.timer <= 0) this.banner = null;
            }

            if (!this.piece) {
                this.classicSpawnTimer -= dt;
                if (this.classicSpawnTimer <= 0) this.spawnClassic();
                this.updateStats();
                return;
            }

            const interval = this.keys.down.held
                ? Math.max(38, this.classicFallInterval() / 18)
                : this.classicFallInterval();
            this.classicFall += dt;

            let steps = 0;
            while (this.classicFall >= interval && steps < 4 && this.piece) {
                this.classicFall -= interval;
                steps += 1;

                if (this.fitsClassic(this.piece.matrix, this.piece.x, this.piece.y + 1)) {
                    this.piece.y += 1;
                    if (this.keys.down.held) this.score += 1;
                } else {
                    break;
                }
            }

            if (steps === 4 && this.classicFall >= interval) {
                this.classicFall = Math.min(this.classicFall, interval);
            }

            if (this.piece && !this.fitsClassic(this.piece.matrix, this.piece.x, this.piece.y + 1)) {
                this.classicLockTimer += dt;
                if (this.classicLockTimer >= CLASSIC_LOCK_DELAY) {
                    this.lockClassic();
                }
            } else {
                this.classicLockTimer = 0;
            }

            this.updateStats();

        }


        updateKeysClassic(dt) {

            const handle = (state, sign) => {
                if (!state.held) {
                    state.repeating = false;
                    state.timer = 0;
                    state.acc = 0;
                    return;
                }

                state.timer += dt;
                if (!state.repeating) {
                    if (state.timer >= DAS_DELAY) {
                        state.repeating = true;
                        state.acc = 0;
                    }
                    return;
                }

                state.acc += dt;
                while (state.acc >= CLASSIC_ARR) {
                    state.acc -= CLASSIC_ARR;
                    if (!this.moveClassicX(sign)) break;
                }
            };

            handle(this.keys.left, -1);
            handle(this.keys.right, 1);

        }


        updatePiece(dt) {

            const piece = this.piece;

            const base = FALL_SPEED[
                Math.min(this.level, FALL_SPEED.length) - 1
            ];

            const speed = this.keys.down.held
                ? Math.max(SOFT_MIN, base * SOFT_MULT)
                : base;

            piece.y += speed * dt / 1000;

            const target = Math.floor(piece.y);

            let blocked = false;

            while (piece.iy < target) {

                if (this.fits(piece.matrix, piece.x, piece.iy + 1)) {

                    piece.iy += 1;

                } else {

                    blocked = true;
                    break;

                }

            }

            if (!blocked && !this.fits(piece.matrix, piece.x, piece.iy + 1)) {
                blocked = true;
            }

            if (blocked) {

                piece.y = piece.iy;

                this.lockTimer += dt;

                if (this.lockTimer >= LOCK_DELAY) {
                    this.lock();
                }

            } else {

                this.lockTimer = 0;

            }

        }


        updateKeys(dt) {

            const handle = (state, sign) => {

                if (!state.held) {

                    state.repeating = false;
                    state.timer = 0;
                    state.acc = 0;

                    return;
                }

                state.timer += dt;

                if (!state.repeating) {

                    if (state.timer >= DAS_DELAY) {

                        state.repeating = true;
                        state.acc = 0;

                    }

                    return;

                }

                state.acc += SIDE_SPEED * dt / 1000;

                const steps = Math.floor(state.acc);

                if (steps > 0) {

                    state.acc -= steps;

                    this.moveX(sign * steps);

                }

            };

            handle(this.keys.left, -1);
            handle(this.keys.right, 1);

        }


        updatePopups(dt) {

            for (let i = this.popups.length - 1; i >= 0; i -= 1) {

                this.popups[i].life -= dt * 0.0011;

                if (this.popups[i].life <= 0) {
                    this.popups.splice(i, 1);
                }

            }

        }


        spawnBurst(gx, gy, color) {

            const limit = this.performanceProfile.particleLimit;
            if (this.particles.length >= limit) return;

            const px = BOARD_X + (gx + 0.5) * PX;
            const py = BOARD_Y + (gy + 0.5) * PX;
            const count = Math.min(3, limit - this.particles.length);

            for (let i = 0; i < count; i += 1) {

                const angle = Math.random() * Math.PI * 2;
                const speed = 0.05 + Math.random() * 0.2;

                this.particles.push({
                    x: px,
                    y: py,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 0.08,
                    life: 1,
                    decay: 0.0014 + Math.random() * 0.002,
                    size: 2 + Math.random() * 3,
                    color: Math.random() < 0.7 ? color : "#F5F7FF"
                });

            }

        }


        updateParticles(dt) {

            for (let i = this.particles.length - 1; i >= 0; i -= 1) {

                const particle = this.particles[i];

                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.vy += 0.0004 * dt;
                particle.life -= particle.decay * dt;

                if (particle.life <= 0) {
                    this.particles.splice(i, 1);
                }

            }

        }


        /* ---------------------------------------------------------
           Entrada
           --------------------------------------------------------- */

        bindMode() {

            const buttons = utils.qsa("[data-tetrismode]", this.shell.root);

            buttons.forEach((button) => {
                button.classList.toggle(
                    "is-active",
                    button.dataset.tetrismode === this.mode
                );

                button.addEventListener("click", () => {
                    const nextMode = button.dataset.tetrismode;
                    if (nextMode !== "arena" && nextMode !== "classic") return;

                    buttons.forEach((item) => {
                        item.classList.toggle("is-active", item === button);
                    });

                    if (nextMode === this.mode) return;

                    this.mode = nextMode;
                    this.reset();
                    A.audio.play("select");
                });
            });

        }


        bindStartLevel() {

            const buttons = utils.qsa("[data-startlevel]", this.shell.root);

            buttons.forEach((button) => {

                button.classList.toggle(
                    "is-active",
                    button.dataset.startlevel === String(this.startLevel)
                );

                button.addEventListener("click", () => {

                    buttons.forEach((item) => {
                        item.classList.toggle("is-active", item === button);
                    });

                    this.startLevel = parseInt(button.dataset.startlevel, 10) || 1;

                    A.audio.play("select");

                    this.reset();

                });

            });

        }


        key(key, event) {

            if (this.over) {
                return false;
            }

            switch (key) {

                case "ArrowLeft":
                case "a":
                case "A":

                    if (!this.keys.left.held) {

                        this.keys.left.held = true;
                        this.keys.left.timer = 0;

                        if (this.moveX(-SIDE_TAP)) {
                            A.audio.play("move");
                        }

                    }

                    return true;

                case "ArrowRight":
                case "d":
                case "D":

                    if (!this.keys.right.held) {

                        this.keys.right.held = true;
                        this.keys.right.timer = 0;

                        if (this.moveX(SIDE_TAP)) {
                            A.audio.play("move");
                        }

                    }

                    return true;

                case "ArrowDown":
                case "s":
                case "S":
                    this.keys.down.held = true;
                    return true;

                case "ArrowUp":
                case "w":
                case "W":
                case "x":
                case "X":
                    this.rotate(1);
                    return true;

                case "z":
                case "Z":
                    this.rotate(-1);
                    return true;

                case " ":
                    this.hardDrop();
                    return true;

                case "c":
                case "C":
                    this.holdPiece();
                    return true;

                default:
                    return false;

            }

        }


        keyUp(key) {

            switch (key) {

                case "ArrowLeft":
                case "a":
                case "A":
                    this.keys.left.held = false;
                    return true;

                case "ArrowRight":
                case "d":
                case "D":
                    this.keys.right.held = false;
                    return true;

                case "ArrowDown":
                case "s":
                case "S":
                    this.keys.down.held = false;
                    return true;

                default:
                    return false;

            }

        }


        releaseKeys() {

            this.keys.left.held = false;
            this.keys.right.held = false;
            this.keys.down.held = false;

        }


        /* ---------------------------------------------------------
           Marcador
           --------------------------------------------------------- */

        updateStats() {

            /* Hilo narrativo: la primera vez que se cruza el umbral
               de este juego, el shell cuenta su capítulo. */
            if (this.shell.checkStory) {
                this.shell.checkStory(this.score);
            }

            this.shell.setStat("score", utils.formatScore(this.score));
            this.shell.setStat("mode", this.mode === "classic" ? "CLÁSICO" : "ARENA");

            this.shell.setStat("best", utils.formatScore(
                Math.max(this.shell.best, this.score)
            ));

            this.shell.setStat("lines", this.lines);
            this.shell.setStat("level", this.level);
            this.shell.setStat("combo", this.bestChain);

            this.shell.setMeter(
                "levelup",
                utils.clamp(this.levelLines / LINES_PER_LEVEL, 0, 1)
            );

        }


        /* ---------------------------------------------------------
           Dibujo
           --------------------------------------------------------- */

        /* Cuando el canvas no sostiene el ritmo, Sandtrix conserva la
           partida pero reduce su simulación por grano una única vez. La
           versión clásica no necesita degradación porque sólo procesa 200
           celdas. */
        onFps(fps) {

            if (this.mode !== "arena" || this.performanceProfile.constrained) {
                return;
            }

            this.performanceProfile.lowFpsSamples = fps < 42
                ? this.performanceProfile.lowFpsSamples + 1
                : 0;

            if (this.performanceProfile.lowFpsSamples < 2) {
                return;
            }

            this.performanceProfile.constrained = true;
            this.performanceProfile.sandHz = SAND_HZ_ECO;
            this.performanceProfile.maxSandSteps = 3;
            this.performanceProfile.particleLimit = PARTICLE_LIMIT_ECO;
        }


        /** Paisaje del mundo, pintado una sola vez */
        fondo() {

            const key = "w" + this.worldIndex;

            if (this._fondos[key]) {
                return this._fondos[key];
            }

            const world = WORLDS[this.worldIndex];

            const canvas = document.createElement("canvas");

            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = WIDTH * dpr;
            canvas.height = HEIGHT * dpr;

            const c = canvas.getContext("2d");

            c.scale(dpr, dpr);

            /* Cielo */
            const sky = c.createLinearGradient(0, 0, 0, HEIGHT);

            sky.addColorStop(0, world.sky[0]);
            sky.addColorStop(0.34, world.sky[1]);
            sky.addColorStop(0.62, world.sky[2]);
            sky.addColorStop(1, world.sky[3]);

            c.fillStyle = sky;
            c.fillRect(0, 0, WIDTH, HEIGHT);

            /* Estrellas */
            if (world.estrellas) {

                c.fillStyle = "rgba(255, 255, 255, 0.85)";

                for (let i = 0; i < 90; i += 1) {

                    const x = Math.random() * WIDTH;
                    const y = Math.random() * HEIGHT * 0.5;
                    const r = Math.random() * 1.3 + 0.4;

                    c.globalAlpha = 0.3 + Math.random() * 0.7;

                    c.beginPath();
                    c.arc(x, y, r, 0, Math.PI * 2);
                    c.fill();

                }

                c.globalAlpha = 1;

            }

            /* Sol / luna */
            const sunY = HEIGHT * 0.3;

            c.save();
            c.shadowColor = world.sun;
            c.shadowBlur = 60;
            c.fillStyle = world.sun;
            c.beginPath();
            c.arc(WIDTH * 0.72, sunY, 52, 0, Math.PI * 2);
            c.fill();
            c.restore();

            /* Nubes */
            if (world.nubes) {

                c.fillStyle = "rgba(255, 255, 255, 0.75)";

                for (let i = 0; i < 5; i += 1) {

                    const x = 40 + i * 105 + Math.random() * 30;
                    const y = 60 + Math.random() * 120;

                    c.beginPath();
                    c.ellipse(x, y, 46, 16, 0, 0, Math.PI * 2);
                    c.fill();

                    c.beginPath();
                    c.ellipse(x + 26, y - 8, 30, 14, 0, 0, Math.PI * 2);
                    c.fill();

                }

            }

            /* Montes / dunas al fondo */
            c.fillStyle = world.montes;
            c.globalAlpha = 0.55;

            c.beginPath();
            c.moveTo(0, HEIGHT * 0.62);

            for (let x = 0; x <= WIDTH; x += 40) {

                const h = HEIGHT * 0.62 -
                    Math.abs(Math.sin(x * 0.012)) * 90 -
                    Math.cos(x * 0.03) * 18;

                c.lineTo(x, h);

            }

            c.lineTo(WIDTH, HEIGHT);
            c.lineTo(0, HEIGHT);
            c.closePath();
            c.fill();

            c.globalAlpha = 1;

            /* Agua */
            if (world.agua) {

                const mar = c.createLinearGradient(0, HEIGHT * 0.66, 0, HEIGHT);

                mar.addColorStop(0, "rgba(14, 165, 233, 0.85)");
                mar.addColorStop(1, "rgba(8, 47, 73, 0.95)");

                c.fillStyle = mar;
                c.fillRect(0, HEIGHT * 0.66, WIDTH, HEIGHT * 0.34);

                c.strokeStyle = "rgba(224, 242, 254, 0.35)";
                c.lineWidth = 2;

                for (let i = 0; i < 14; i += 1) {

                    const y = HEIGHT * 0.68 + i * 14;
                    const w = 40 + Math.random() * 90;
                    const x = Math.random() * (WIDTH - w);

                    c.beginPath();
                    c.moveTo(x, y);
                    c.lineTo(x + w, y);
                    c.stroke();

                }

            } else {

                /* Suelo */
                c.fillStyle = world.suelo;
                c.globalAlpha = 0.8;
                c.fillRect(0, HEIGHT * 0.78, WIDTH, HEIGHT * 0.22);
                c.globalAlpha = 1;

            }

            this._fondos[key] = canvas;

            return canvas;

        }


        render() {

            if (this.mode === "classic") {
                this.renderClassic();
                return;
            }

            const { ctx } = this.stage;

            /* Paisaje del mundo */
            ctx.drawImage(this.fondo(), 0, 0, WIDTH, HEIGHT);

            ctx.save();

            if (this.shake > 0.2) {

                ctx.translate(
                    (Math.random() - 0.5) * this.shake,
                    (Math.random() - 0.5) * this.shake
                );

            }

            this.drawBoardBack();
            this.drawSand();
            this.drawGhost();
            this.drawParticles();
            this.drawSide();
            this.drawPopups();

            ctx.restore();

            if (this.banner) {
                this.drawBanner();
            }

            if (this.screenFlash > 0) {
                this.drawFlash();
            }

        }


        renderClassic() {

            const { ctx } = this.stage;

            ctx.drawImage(this.fondo(), 0, 0, WIDTH, HEIGHT);
            ctx.save();

            if (this.shake > 0.2) {
                ctx.translate(
                    (Math.random() - 0.5) * this.shake,
                    (Math.random() - 0.5) * this.shake
                );
            }

            this.drawBoardBack();
            this.drawClassicCells();
            this.drawClassicGhost();
            this.drawParticles();
            this.drawSide();
            this.drawPopups();
            ctx.restore();

            if (this.banner) this.drawBanner();
            if (this.screenFlash > 0) this.drawFlash();

        }


        drawClassicBlock(x, y, color) {

            const { ctx } = this.stage;
            const px = BOARD_X + x * CELL;
            const py = BOARD_Y + y * CELL;

            ctx.fillStyle = color;
            ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.fillRect(px + 3, py + 3, CELL - 6, 3);
            ctx.strokeStyle = "rgba(3, 7, 18, 0.46)";
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);

        }


        drawClassicCells() {

            const board = this.classicBoard;

            for (let y = 0; y < ROWS; y += 1) {
                const row = y * COLS;
                for (let x = 0; x < COLS; x += 1) {
                    const value = board[row + x];
                    if (value) this.drawClassicBlock(x, y, CLASSIC_COLORS[TYPES[value - 1]]);
                }
            }

            const piece = this.piece;
            if (!piece) return;

            const color = CLASSIC_COLORS[piece.type];
            for (let y = 0; y < piece.size; y += 1) {
                for (let x = 0; x < piece.size; x += 1) {
                    if (!piece.matrix[y][x]) continue;
                    const gy = piece.y + y;
                    if (gy >= 0) this.drawClassicBlock(piece.x + x, gy, color);
                }
            }

        }


        drawClassicGhost() {

            const piece = this.piece;
            if (!piece) return;

            let y = piece.y;
            while (this.fitsClassic(piece.matrix, piece.x, y + 1)) y += 1;
            if (y === piece.y) return;

            const { ctx } = this.stage;
            ctx.save();
            ctx.globalAlpha = 0.23;

            const color = CLASSIC_COLORS[piece.type];
            for (let cy = 0; cy < piece.size; cy += 1) {
                for (let cx = 0; cx < piece.size; cx += 1) {
                    if (!piece.matrix[cy][cx]) continue;
                    const gy = y + cy;
                    if (gy >= 0) this.drawClassicBlock(piece.x + cx, gy, color);
                }
            }

            ctx.restore();

        }


        drawBoardBack() {

            const { ctx } = this.stage;

            ctx.save();

            canvasKit.roundRect(ctx, BOARD_X - 2, BOARD_Y - 2, BOARD_W + 4, BOARD_H + 4, 8);

            ctx.fillStyle = "rgba(4, 6, 12, 0.5)";
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
            ctx.lineWidth = 2;
            ctx.stroke();

            /* Guías suaves de columna */
            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
            ctx.lineWidth = 1;

            for (let x = 1; x < COLS; x += 1) {

                ctx.beginPath();
                ctx.moveTo(BOARD_X + x * CELL, BOARD_Y);
                ctx.lineTo(BOARD_X + x * CELL, BOARD_Y + BOARD_H);
                ctx.stroke();

            }

            ctx.restore();

        }


        /** Pinta los granos (y la pieza) en el lienzo de 80 x 160 */
        drawSand() {

            const { ctx } = this.stage;

            const data = this.img.data;
            const color = this.color;
            const shade = this.shade;
            const mask = this.mask;
            const pal = this.palette;

            const flash = this.flash;

            let pulse = 255;

            if (flash) {

                const t = 1 - flash.timer / flash.duration;

                pulse = Math.sin(t * Math.PI * 4) > 0 ? 255 : 200;

            }

            /* Todo lo que está por encima del techo es vacío: se
               limpia de golpe con fill en vez de grano a grano. */
            const skip = Math.max(0, this.topRow - 1) * GW;

            if (skip > 0) {
                data.fill(0, 0, skip * 4);
            }

            for (let i = skip; i < N; i += 1) {

                const c = color[i];
                const o = i * 4;

                if (!c) {
                    data[o + 3] = 0;
                    continue;
                }

                if (flash && mask[i]) {

                    data[o] = pulse;
                    data[o + 1] = pulse;
                    data[o + 2] = 255;
                    data[o + 3] = 255;

                    continue;

                }

                const p = ((c - 1) * 4 + shade[i]) * 3;

                data[o] = pal[p];
                data[o + 1] = pal[p + 1];
                data[o + 2] = pal[p + 2];
                data[o + 3] = 255;

            }

            /* Pieza en caída, con su textura de arena */
            const piece = this.piece;

            if (piece) {

                const { matrix, size, x, iy, colorIndex, shades } = piece;

                const stride = size * SUB;

                for (let cy = 0; cy < size; cy += 1) {

                    for (let cx = 0; cx < size; cx += 1) {

                        if (!matrix[cy][cx]) {
                            continue;
                        }

                        for (let yy = 0; yy < SUB; yy += 1) {

                            const gy = iy + cy * SUB + yy;

                            if (gy < 0 || gy >= GH) {
                                continue;
                            }

                            for (let xx = 0; xx < SUB; xx += 1) {

                                const gx = x + cx * SUB + xx;

                                const o = (gy * GW + gx) * 4;

                                const s = shades[(cy * SUB + yy) * stride + cx * SUB + xx];

                                const p = ((colorIndex - 1) * 4 + s) * 3;

                                data[o] = pal[p];
                                data[o + 1] = pal[p + 1];
                                data[o + 2] = pal[p + 2];
                                data[o + 3] = 255;

                            }

                        }

                    }

                }

            }

            this.sandCtx.putImageData(this.img, 0, 0);

            ctx.save();

            ctx.imageSmoothingEnabled = false;

            ctx.drawImage(this.sandCanvas, BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

            ctx.restore();

        }


        /** Silueta de dónde va a aterrizar la pieza */
        drawGhost() {

            const piece = this.piece;

            if (!piece) {
                return;
            }

            let gy = piece.iy;

            while (this.fits(piece.matrix, piece.x, gy + 1)) {
                gy += 1;
            }

            if (gy === piece.iy) {
                return;
            }

            const { ctx } = this.stage;

            const color = this.world.sand[piece.colorIndex - 1];

            ctx.save();

            ctx.beginPath();
            ctx.rect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
            ctx.clip();

            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.55;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);

            for (let cy = 0; cy < piece.size; cy += 1) {

                for (let cx = 0; cx < piece.size; cx += 1) {

                    if (!piece.matrix[cy][cx]) {
                        continue;
                    }

                    ctx.strokeRect(
                        BOARD_X + (piece.x + cx * SUB) * PX + 1,
                        BOARD_Y + (gy + cy * SUB) * PX + 1,
                        SUB * PX - 2,
                        SUB * PX - 2
                    );

                }

            }

            ctx.restore();

        }


        drawMini(matrix, color, ox, oy) {

            const { ctx } = this.stage;

            for (let y = 0; y < matrix.length; y += 1) {

                for (let x = 0; x < matrix[y].length; x += 1) {

                    if (!matrix[y][x]) {
                        continue;
                    }

                    canvasKit.fillRoundRect(
                        ctx,
                        ox + x * PREVIEW_CELL + 1,
                        oy + y * PREVIEW_CELL + 1,
                        PREVIEW_CELL - 2,
                        PREVIEW_CELL - 2,
                        3,
                        color
                    );

                }

            }

        }


        drawSide() {

            const { ctx } = this.stage;

            const x = SIDE_X;
            const w = SIDE_W;
            const classic = this.mode === "classic";
            const previewColor = (piece) => classic
                ? CLASSIC_COLORS[piece.type]
                : this.world.sand[piece.colorIndex - 1];

            ctx.save();

            canvasKit.roundRect(ctx, x, BOARD_Y, w, BOARD_H, 10);

            ctx.fillStyle = "rgba(4, 6, 12, 0.62)";
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.restore();

            let cursorY = BOARD_Y + 24;

            const section = (label) => {

                canvasKit.text(ctx, label, x + 12, cursorY, {
                    font: "700 9px 'JetBrains Mono', monospace",
                    color: "rgba(245, 247, 255, 0.55)",
                    align: "left"
                });

                cursorY += 16;

            };

            /* Modo o mundo */
            canvasKit.text(ctx, classic ? "CLÁSICO" : this.world.name, x + w - 12, cursorY, {
                font: "800 12px 'Orbitron', sans-serif",
                color: classic ? "#22D3EE" : "#F5F7FF",
                align: "right"
            });

            section(classic ? "MODO" : "MUNDO");

            cursorY += 30;

            /* Siguiente pieza */
            section("SIGUIENTE");

            if (this.next) {

                const size = this.next.size;

                this.drawMini(
                    this.next.matrix,
                    previewColor(this.next),
                    x + w / 2 - (size * PREVIEW_CELL) / 2,
                    cursorY - 2
                );

                cursorY += size * PREVIEW_CELL + 12;

            }

            /* Guardada */
            section("GUARDADA");

            if (this.hold) {

                const size = this.hold.size;

                this.drawMini(
                    this.hold.matrix,
                    previewColor(this.hold),
                    x + w / 2 - (size * PREVIEW_CELL) / 2,
                    cursorY - 2
                );

                cursorY += size * PREVIEW_CELL + 12;

            } else {

                canvasKit.text(ctx, "—", x + w / 2, cursorY + 6, {
                    font: "700 13px 'Orbitron', sans-serif",
                    color: "rgba(245, 247, 255, 0.35)"
                });

                cursorY += 22;

            }

            /* Nivel */
            section("NIVEL");

            canvasKit.text(ctx, String(this.level), x + w - 12, cursorY - 16, {
                font: "800 18px 'Orbitron', sans-serif",
                color: "#A3E635",
                align: "right"
            });

            ctx.save();

            canvasKit.roundRect(ctx, x + 12, cursorY - 10, w - 24, 7, 4);

            ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
            ctx.fill();

            const fill = utils.clamp(
                this.levelLines / LINES_PER_LEVEL, 0, 1
            ) * (w - 24);

            if (fill > 2) {

                canvasKit.roundRect(ctx, x + 12, cursorY - 10, fill, 7, 4);

                ctx.fillStyle = "#A3E635";
                ctx.fill();

            }

            ctx.restore();

            cursorY += 20;

            /* Líneas y mejor combo */
            section("LÍNEAS");

            canvasKit.text(ctx, String(this.lines), x + w - 12, cursorY - 16, {
                font: "800 13px 'Orbitron', sans-serif",
                color: "#F5F7FF",
                align: "right"
            });

            section("MEJOR COMBO");

            canvasKit.text(
                ctx, "x" + Math.max(1, this.bestChain), x + w - 12, cursorY - 16,
                {
                    font: "800 13px 'Orbitron', sans-serif",
                    color: "#F5F7FF",
                    align: "right"
                }
            );

            cursorY += 10;

            /* Paleta / regla del modo */
            section(classic ? "REGLA" : "ARENA");

            if (classic) {
                canvasKit.text(ctx, "FILA COMPLETA", x + 12, cursorY - 1, {
                    font: "700 8px 'JetBrains Mono', monospace",
                    color: "rgba(245, 247, 255, 0.72)",
                    align: "left"
                });
                canvasKit.text(ctx, "= LIMPIEZA", x + 12, cursorY + 11, {
                    font: "700 8px 'JetBrains Mono', monospace",
                    color: "rgba(34, 211, 238, 0.82)",
                    align: "left"
                });
            } else {
                for (let i = 0; i < this.world.sand.length; i += 1) {
                    canvasKit.fillRoundRect(
                        ctx,
                        x + 12 + i * 24,
                        cursorY - 10,
                        18,
                        18,
                        4,
                        this.world.sand[i]
                    );
                }
            }

            cursorY += 26;

            /* Ayuda. Los textos son constantes para no crear un arreglo y un
               callback en cada frame del panel lateral. */
            const hints = classic ? CLASSIC_HINTS : ARENA_HINTS;

            for (let i = 0; i < hints.length; i += 1) {
                canvasKit.text(ctx, hints[i], x + 12, cursorY, {
                    font: "600 8px 'JetBrains Mono', monospace",
                    color: "rgba(245, 247, 255, 0.45)",
                    align: "left"
                });

                cursorY += 12;
            }

        }


        drawPopups() {

            const { ctx } = this.stage;

            this.popups.forEach((popup) => {

                const rise = (1 - popup.life) * 30;

                ctx.save();

                ctx.globalAlpha = utils.clamp(popup.life * 1.5, 0, 1);

                canvasKit.text(ctx, popup.text, popup.x, popup.y - rise, {
                    font: "800 16px 'Orbitron', sans-serif",
                    color: popup.color,
                    shadow: popup.color,
                    shadowBlur: 14
                });

                ctx.restore();

            });

        }


        drawBanner() {

            const { ctx } = this.stage;

            const banner = this.banner;

            const ratio = banner.timer / banner.max;

            const alpha = utils.clamp(ratio * 3, 0, 1) *
                utils.clamp((1 - ratio) * 6, 0, 1);

            const cx = BOARD_X + BOARD_W / 2;
            const cy = BOARD_Y + BOARD_H / 2;

            ctx.save();

            ctx.globalAlpha = alpha * 0.9;

            canvasKit.fillRoundRect(
                ctx, cx - 120, cy - 40, 240, 80, 12, "rgba(5, 7, 14, 0.92)"
            );

            ctx.globalAlpha = alpha;

            ctx.strokeStyle = "#F5F7FF";
            ctx.lineWidth = 2;

            canvasKit.roundRect(ctx, cx - 120, cy - 40, 240, 80, 12);
            ctx.stroke();

            canvasKit.text(ctx, banner.title, cx, cy - 10, {
                font: "800 19px 'Orbitron', sans-serif",
                color: "#F5F7FF",
                shadow: "#F5F7FF",
                shadowBlur: 14
            });

            canvasKit.text(ctx, banner.text, cx, cy + 16, {
                font: "600 11px 'JetBrains Mono', monospace",
                color: "rgba(245, 247, 255, 0.8)"
            });

            ctx.restore();

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

            const alpha = utils.clamp(this.screenFlash / 300, 0, 1) * 0.3;

            ctx.save();

            ctx.fillStyle = "rgba(245, 247, 255, " + alpha + ")";

            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            ctx.restore();

        }


    }


    /* =========================================================
       REGISTRO
       ========================================================= */

    A.registerGame({

        id: "tetris",
        number: "05",
        name: "STACK",
        genre: "PUZZLE / DOS MODOS",
        mode: "CLÁSICO + ARENA",

        music: "arena",

        accent: "var(--color-purple)",
        accentRgb: "139 92 246",
        cardRgb: "139 92 246",

        ratioMin: 0.78,
        ratioMax: 0.82,

        preview: `
            <span class="preview preview--tetris">
                <i class="preview__piece preview__piece--i"></i>
                <i class="preview__piece preview__piece--t"></i>
                <i class="preview__piece preview__piece--o"></i>
                <i class="preview__piece preview__piece--l"></i>
                <i class="preview__sand"></i>
            </span>
        `,

        readyTitle: "STACK",
        readyText: "Elige ARENA para Sandtrix —las piezas se desmoronan y un color debe cruzar de pared a pared— o CLÁSICO para el tablero 10 × 20 y sus filas completas tradicionales.",
        readyHint: "ELIGE MODO · ENTER — EMPEZAR · ESPACIO — SOLTAR · ESC — SALIR",

        hud: `
            ${A.ui.stat("score", "SCORE", "000000")}
            ${A.ui.stat("best", "BEST", "000000")}
            ${A.ui.stat("mode", "MODO", "ARENA", { text: true })}
            ${A.ui.divider()}
            ${A.ui.stat("lines", "LÍNEAS", "0")}
            ${A.ui.stat("level", "LEVEL", "1")}
            ${A.ui.stat("combo", "COMBO", "0")}
            ${A.ui.divider()}
            ${A.ui.meter("levelup", "NIVEL")}
        `,

        controls: `
            ${A.ui.switcher("tetrismode", [
                { value: "arena", label: "ARENA" },
                { value: "classic", label: "CLÁSICO" }
            ])}
            ${A.ui.switcher("startlevel", [
                { value: "1", label: "NVL 1" },
                { value: "5", label: "NVL 5" },
                { value: "10", label: "NVL 10" }
            ])}
        `,

        hint: "← → MOVER    ↑ / X ROTAR    ↓ RÁPIDO    ESPACIO SOLTAR    C GUARDAR    P PAUSA",

        create(shell) {
            return new SandtrixGame(shell);
        }

    });

})(window.Arcade404);
