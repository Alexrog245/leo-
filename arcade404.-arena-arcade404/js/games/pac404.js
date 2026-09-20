/* =========================================================
   ARCADE 404 — GAME 08 · PAC 404
   El Pac-Man de siempre con nuestra cara: cuatro firewalls
   con su personalidad, fases de dispersión y persecución,
   chips que los reinician para poder comértelos, fruta
   (el gordo del pixel art), tres mundos y seis niveles.
   ========================================================= */

(function (A) {

    "use strict";


    const { utils, canvasKit } = A;


    /* ---------------------------------------------------------
       GEOMETRÍA (lienzo 564 x 668)
       --------------------------------------------------------- */

    const COLS = 19;
    const ROWS = 21;
    const TILE = 28;

    const BOARD_W = COLS * TILE;      /* 532 */
    const BOARD_H = ROWS * TILE;      /* 588 */

    const BOARD_X = 16;
    const BOARD_Y = 16;

    const FOOT_Y = BOARD_Y + BOARD_H + 14;   /* 618 */
    const FOOT_H = 34;

    const WIDTH = BOARD_X * 2 + BOARD_W;     /* 564 */
    const HEIGHT = FOOT_Y + FOOT_H + 16;     /* 668 */


    /* ---------------------------------------------------------
       LABERINTOS
         #  muro        .  paquete       o  chip (power pellet)
         -  puerta      G  casa          T  túnel lateral
         P  inicio del 404
       --------------------------------------------------------- */

    const MAZE_CIRCUITO = [
        "###################",
        "#........#........#",
        "#o##.###.#.###.##o#",
        "#.................#",
        "#.##.#.#####.#.##.#",
        "#....#...#...#....#",
        "####.###.#.###.####",
        "#..###.......###..#",
        "#.####.##.##.####.#",
        "T......##-##......T",
        "#......#GGG#......#",
        "#.####.#####.####.#",
        "#.##.###.#.###.##.#",
        "#o.......#.......o#",
        "#.##.#.#####.#.##.#",
        "#....#...#...#....#",
        "####.###.#.###.####",
        "#..###.......###..#",
        "#.####.#####.####.#",
        "#........P........#",
        "###################"
    ];

    const MAZE_NEXO = [
        "###################",
        "#o.......#.......o#",
        "#.#####..#..#####.#",
        "#.................#",
        "#.##.###.#.###.##.#",
        "#....#...#...#....#",
        "####.#.#####.#.####",
        "#..###.......###..#",
        "#.####.##.##.####.#",
        "T......##-##......T",
        "#......#GGG#......#",
        "#.####.#####.####.#",
        "#.##.###.#.###.##.#",
        "#o.......#.......o#",
        "#.###.#.###.#.###.#",
        "#....#...#...#....#",
        "####.#.#####.#.####",
        "#..###.......###..#",
        "#.####.#####.####.#",
        "#........P........#",
        "###################"
    ];

    const MAZE_SINGULARIDAD = [
        "###################",
        "#o...............o#",
        "#o##.##.#.#.##.##o#",
        "#.#..##..#..##..#.#",
        "##....#.###.#....##",
        "#..#..#.#.#.#..#..#",
        "#####.........#####",
        "#..##..##.##..##..#",
        "##....###.###....##",
        "T...##.##-##.##...T",
        "#.#....#GGG#....#.#",
        "#...#..#####..#...#",
        "##.#####.#.#####.##",
        "#o.#...........#.o#",
        "#....#..###..#....#",
        "#..#.###...###.#..#",
        "#....##.....##....#",
        "#..#..#.....#..#..#",
        "#o..#...###...#..o#",
        "###..#...P...#..###",
        "###################"
    ];


    const HOUSE_DOOR = { x: 9, y: 9 };
    const HOUSE_SEAT = { x: 9, y: 10 };

    const CORNERS = [
        { x: 1, y: 1 },
        { x: COLS - 2, y: 1 },
        { x: 1, y: ROWS - 2 },
        { x: COLS - 2, y: ROWS - 2 }
    ];


    /* ---------------------------------------------------------
       MUNDOS y NIVELES (3 mundos x 2 niveles)
       --------------------------------------------------------- */

    const WORLDS = [

        {
            name: "CIRCUITO",
            maze: MAZE_CIRCUITO,
            wall: "#22D3EE",
            dot: "#DFF6FF",
            pac: "#FBBF24",
            floor: "#05070E"
        },

        {
            name: "NEXO",
            maze: MAZE_NEXO,
            wall: "#A855F7",
            dot: "#F3E8FF",
            pac: "#22D3EE",
            floor: "#08050F"
        },

        {
            name: "SINGULARIDAD",
            maze: MAZE_SINGULARIDAD,
            wall: "#F43F5E",
            dot: "#FFF1F3",
            pac: "#A3E635",
            floor: "#0B0407"
        }

    ];


    /* velocidad en casillas por segundo */
    const LEVELS = [
        { world: 0, index: 1, pac: 6.8, ghost: 6.1, fright: 7000, scatter: 7000, chase: 20000, fruit: 100 },
        { world: 0, index: 2, pac: 7.1, ghost: 6.5, fright: 6000, scatter: 6000, chase: 22000, fruit: 300 },
        { world: 1, index: 1, pac: 7.3, ghost: 6.8, fright: 5500, scatter: 6000, chase: 24000, fruit: 500 },
        { world: 1, index: 2, pac: 7.5, ghost: 7.0, fright: 5000, scatter: 5000, chase: 26000, fruit: 700 },
        { world: 2, index: 1, pac: 7.7, ghost: 7.2, fright: 4500, scatter: 5000, chase: 28000, fruit: 1000 },
        { world: 2, index: 2, pac: 8.0, ghost: 7.6, fright: 4000, scatter: 4000, chase: 30000, fruit: 2000 }
    ];


    const RITMOS = {
        lento: { factor: 0.86 },
        normal: { factor: 1 },
        rapido: { factor: 1.15 }
    };


    /* ---------------------------------------------------------
       FIREWALLS (los cuatro de siempre, con su carácter)
       --------------------------------------------------------- */

    const FIREWALLS = [

        {
            id: "traza",
            name: "TRAZA",
            color: "#F43F5E",
            role: "chaser",
            delay: 0,
            scatter: 0
        },

        {
            id: "proxy",
            name: "PROXY",
            color: "#F472B6",
            role: "ambusher",
            delay: 2400,
            scatter: 1
        },

        {
            id: "cache",
            name: "CACHE",
            color: "#22D3EE",
            role: "flanker",
            delay: 5200,
            scatter: 3
        },

        {
            id: "spam",
            name: "SPAM",
            color: "#FB923C",
            role: "coward",
            delay: 8000,
            scatter: 2
        }

    ];


    const DIRS = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];


    /* Tiempos (ms) */
    const READY_TIME = 1700;      /* ¡LISTO! antes de cada vida */
    const DYING_TIME = 1600;      /* animación al perder un 404 */
    const CLEAR_TIME = 1900;      /* cartel de nodo vaciado */
    const RESPAWN_TIME = 1200;    /* el firewall borrado vuelve a salir */
    const FRUIT_TIME = 9500;      /* lo que tarda en irse el gordo */
    const FLASH_TIME = 2000;      /* aviso de que el reinicio se acaba */

    const GHOST_POINTS = [200, 400, 800, 1600];


    /* =========================================================
       JUEGO
       ========================================================= */

    class Pac404Game {


        constructor(shell) {

            this.shell = shell;

            this.stage = A.createStage(shell.refs.stage, {
                width: WIDTH,
                height: HEIGHT,
                background: "#05070E"
            });

            this.ritmo = "normal";

            this.reset();

            this.bindRitmo();

            shell.setTouchControls({
                mode: "dpad",
                analogLabel: "Joystick analógico para guiar a PAC-404 por el laberinto.",
                onDirection: (dir) => {

                    this.steer({
                        left: { x: -1, y: 0 },
                        right: { x: 1, y: 0 },
                        up: { x: 0, y: -1 },
                        down: { x: 0, y: 1 }
                    }[dir]);

                }
            });

        }


        /* ---------------------------------------------------------
           Estado
           --------------------------------------------------------- */

        reset() {

            this.levelIndex = 0;
            this.score = 0;
            this.lives = 3;
            this.nextExtra = 10000;

            this.time = 0;
            this.mouth = 0;
            this.wake = [];

            this.popups = [];
            this.particles = [];

            this.phase = "ready";
            this.phaseTimer = READY_TIME;
            this.banner = null;

            this.flash = 0;
            this.fruit = null;
            this.ghostCombo = 0;

            this.loadLevel(0);

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

            this.stage.destroy();

        }


        loadLevel(index) {

            this.levelIndex = index;

            this.cfg = LEVELS[Math.min(index, LEVELS.length - 1)];

            this.world = WORLDS[this.cfg.world];

            this.factor = RITMOS[this.ritmo].factor;

            this.layout = this.world.maze.map((row) => row.split(""));

            /* Paquetes y chips */
            this.dots = [];
            this.dotsLeft = 0;

            for (let y = 0; y < ROWS; y += 1) {

                this.dots.push(new Array(COLS).fill(0));

                for (let x = 0; x < COLS; x += 1) {

                    const cell = this.layout[y][x];

                    if (cell === ".") {

                        this.dots[y][x] = 1;
                        this.dotsLeft += 1;

                    } else if (cell === "o") {

                        this.dots[y][x] = 2;
                        this.dotsLeft += 1;

                    }

                }

            }

            this.levelDots = this.dotsLeft;

            /* Inicio del 404: debajo de la casa */
            this.start = null;

            for (let y = ROWS - 1; y >= 0 && !this.start; y -= 1) {

                for (let x = 0; x < COLS; x += 1) {

                    if (this.layout[y][x] === "P") {

                        this.start = { x, y };
                        break;

                    }

                }

            }

            if (!this.start) {
                this.start = { x: 9, y: ROWS - 2 };
            }

            this.wake = [];
            this.popups = [];

            this.fruit = null;
            this.fruitTaken = 0;

            /* Fases de dispersión y persecución */
            this.scatter = true;
            this.modeTimer = this.cfg.scatter;

            this.spawnActors();

        }


        spawnActors() {

            this.player = {
                x: this.start.x,
                y: this.start.y,
                dir: { x: 0, y: 0 },
                next: { x: 0, y: 0 },
                progress: 0
            };

            this.ghosts = FIREWALLS.map((type) => ({

                type,

                x: HOUSE_SEAT.x,
                y: HOUSE_SEAT.y,

                dir: { x: 0, y: -1 },
                progress: 0,

                mode: "house",
                timer: type.delay,

                seat: type.scatter,
                wobble: Math.random() * Math.PI * 2

            }));

        }


        /* ---------------------------------------------------------
           Rejilla
           --------------------------------------------------------- */

        wrapX(x) {

            return ((x % COLS) + COLS) % COLS;

        }


        cell(x, y) {

            if (y < 0 || y >= ROWS) {
                return "#";
            }

            return this.layout[y][this.wrapX(x)];

        }


        /** El 404 no entra en la casa de los firewalls */
        canPlayer(x, y) {

            const cell = this.cell(x, y);

            return cell !== "#" && cell !== "-" && cell !== "G";

        }


        canGhost(ghost, x, y) {

            const cell = this.cell(x, y);

            if (cell === "#") {
                return false;
            }

            if (cell === "-") {

                /* La puerta sólo se cruza saliendo o volviendo */
                return ghost.mode === "eaten" || ghost.mode === "exiting";

            }

            if (cell === "G") {

                return (
                    ghost.mode === "eaten" ||
                    ghost.mode === "house" ||
                    ghost.mode === "exiting"
                );

            }

            return true;

        }


        isTunnel(x, y) {

            return y > 4 && y < ROWS - 4 && (x <= 1 || x >= COLS - 2);

        }


        /* ---------------------------------------------------------
           Bucle
           --------------------------------------------------------- */

        update(dt) {

            this.time += dt;

            this.mouth += dt * 0.013;

            this.updateWake(dt);
            this.updatePopups(dt);
            this.updateParticles(dt);

            if (this.flash > 0) {
                this.flash = Math.max(0, this.flash - dt);
            }

            if (this.phase === "ready") {

                this.phaseTimer -= dt;

                if (this.phaseTimer <= 0) {

                    this.phase = "run";
                    this.banner = null;

                }

                return;

            }

            if (this.phase === "dying") {

                this.phaseTimer -= dt;

                if (this.phaseTimer <= 0) {
                    this.afterDeath();
                }

                return;

            }

            if (this.phase === "clear") {

                this.phaseTimer -= dt;

                if (this.phaseTimer <= 0) {
                    this.afterClear();
                }

                return;

            }

            if (this.phase !== "run") {
                return;
            }

            this.updateModes(dt);
            this.movePlayer(dt);
            this.moveGhosts(dt);
            this.updateFruit(dt);
            this.checkCollisions();

        }


        /** Dispersión (cada uno a su esquina) y persecución */
        updateModes(dt) {

            /* El reinicio por chip manda sobre todo lo demás */
            const rebooting = this.ghosts.some(
                (ghost) => ghost.mode === "fright"
            );

            if (rebooting) {
                return;
            }

            this.modeTimer -= dt;

            if (this.modeTimer > 0) {
                return;
            }

            this.scatter = !this.scatter;

            this.modeTimer = this.scatter ? this.cfg.scatter : this.cfg.chase;

            /* Al cambiar de fase los firewalls dan media vuelta */
            this.ghosts.forEach((ghost) => {

                if (ghost.mode === "normal" && !this.scatter) {

                    ghost.dir = {
                        x: -ghost.dir.x,
                        y: -ghost.dir.y
                    };

                }

            });

        }


        updateWake(dt) {

            for (let i = this.wake.length - 1; i >= 0; i -= 1) {

                this.wake[i].life -= dt;

                if (this.wake[i].life <= 0) {
                    this.wake.splice(i, 1);
                }

            }

        }


        movePlayer(dt) {

            const player = this.player;

            /* Giro clásico: se acepta un poco antes de llegar al cruce */
            this.tryTurn();

            if (this.phase !== "run") {
                return;
            }

            if (player.dir.x === 0 && player.dir.y === 0) {
                return;
            }

            /* casillas por segundo */
            const speed = this.cfg.pac * this.factor;

            player.progress += (speed * dt) / 1000;

            let guard = 0;

            while (player.progress >= 1 && guard < 8) {

                guard += 1;

                player.progress -= 1;

                player.x = this.wrapX(player.x + player.dir.x);
                player.y = player.y + player.dir.y;

                this.arriveTile();

                if (this.phase !== "run") {
                    return;
                }

                if (player.dir.x === 0 && player.dir.y === 0) {

                    player.progress = 0;

                    break;

                }

            }

            /* Estela decorativa */
            if (player.dir.x !== 0 || player.dir.y !== 0) {

                const px = player.x + player.dir.x * player.progress;
                const py = player.y + player.dir.y * player.progress;

                const last = this.wake[this.wake.length - 1];

                if (!last || last.x !== px || last.y !== py) {

                    this.wake.push({ x: px, y: py, life: 900, max: 900 });

                    if (this.wake.length > 16) {
                        this.wake.shift();
                    }

                }

            }

        }


        /** Al pisar una casilla: come, gira y mira si queda algo */
        arriveTile() {

            const player = this.player;

            const dot = this.dots[player.y][player.x];

            if (dot) {

                this.dots[player.y][player.x] = 0;
                this.dotsLeft -= 1;

                if (dot === 2) {

                    this.score += 50;

                    this.overload();

                    A.audio.play("coin");

                } else {

                    this.score += 10;

                    A.audio.play("eat");

                }

                /* El gordo sale a pasearse de vez en cuando */
                const eaten = this.levelDots - this.dotsLeft;

                if (!this.fruit && (
                    eaten === 70 || eaten === 170
                )) {

                    this.spawnFruit();

                }

                if (
                    this.score >= this.nextExtra
                ) {

                    this.lives += 1;
                    this.nextExtra += 10000;

                    this.shell.setStatus("¡404 EXTRA!");

                    A.audio.play("win");

                }

                this.updateStats();

                if (this.dotsLeft <= 0) {
                    this.completeLevel();
                }

            }

            /* El gordo se come por encima */
            if (
                this.fruit &&
                this.fruit.x === player.x &&
                this.fruit.y === player.y
            ) {

                this.eatFruit();

            }

            if (!this.canPlayer(player.x + player.dir.x, player.y + player.dir.y)) {

                player.dir = { x: 0, y: 0 };
                player.progress = 0;

            }

        }


        /**
         * Giro con cornering: se puede girar al acercarse al centro de la
         * casilla, igual que en el arcade, así subes donde tú quieres.
         */
        tryTurn() {

            const player = this.player;
            const next = player.next;
            const dir = player.dir;

            if (!next || (next.x === 0 && next.y === 0)) {
                return;
            }

            if (next.x === dir.x && next.y === dir.y) {
                return;
            }

            /* Marcha atrás: siempre */
            if (next.x === -dir.x && next.y === -dir.y) {

                player.dir = { x: next.x, y: next.y };

                return;

            }

            if (dir.x === 0 && dir.y === 0) {

                if (this.canPlayer(player.x + next.x, player.y + next.y)) {
                    player.dir = { x: next.x, y: next.y };
                }

                return;

            }

            /* Giro perpendicular: sólo cerca del centro de una casilla */
            const forward = player.progress > 0.7;
            const backward = player.progress < 0.3;

            if (!forward && !backward) {
                return;
            }

            const baseX = forward ? this.wrapX(player.x + dir.x) : player.x;
            const baseY = forward ? player.y + dir.y : player.y;

            if (!this.canPlayer(baseX + next.x, baseY + next.y)) {
                return;
            }

            player.x = baseX;
            player.y = baseY;
            player.progress = 0;

            if (forward) {

                /* Al adelantar la casilla hay que comer lo que hubiera */
                this.arriveTile();

                if (this.phase !== "run") {
                    return;
                }

            }

            player.dir = { x: next.x, y: next.y };

        }


        completeLevel() {

            if (this.levelIndex >= LEVELS.length - 1) {

                this.phase = "won";

                this.shell.win({
                    taunt: true,
                    title: "RED LIMPIA",
                    text: `Has vaciado los ${LEVELS.length} nodos de PAC 404.`,
                    score: this.score
                });

                return;

            }

            this.phase = "clear";
            this.phaseTimer = CLEAR_TIME;

            this.score += 500 * (this.levelIndex + 1);

            const next = LEVELS[this.levelIndex + 1];

            const cambio = next.world !== this.cfg.world;

            this.banner = {
                title: cambio
                    ? "MUNDO " + (next.world + 1)
                    : "NODO " + this.cfg.index + " VACIADO",
                text: cambio
                    ? WORLDS[next.world].name
                    : "Entrando en el nodo " + next.index
            };

            /* La máquina protesta: ella estaba en otra cosa */
            this.shell.levelUpTaunt();

            A.audio.play("win");

            this.flash = 300;

            this.updateStats();

        }


        afterClear() {

            this.banner = null;

            this.phase = "ready";
            this.phaseTimer = READY_TIME;

            this.loadLevel(this.levelIndex + 1);

            this.updateStats();

        }


        /** Chip: los firewalls se reinician, huyen y se pueden comer */
        overload() {

            this.ghostCombo = 0;

            this.ghosts.forEach((ghost) => {

                if (ghost.mode === "eaten" || ghost.mode === "house") {
                    return;
                }

                ghost.mode = "fright";

                ghost.timer = this.cfg.fright;

                ghost.dir = {
                    x: -ghost.dir.x,
                    y: -ghost.dir.y
                };

            });

            this.flash = 220;

        }


        moveGhosts(dt) {

            this.ghosts.forEach((ghost) => {

                if (ghost.mode === "house") {

                    ghost.timer -= dt;

                    ghost.wobble += dt * 0.006;

                    if (ghost.timer <= 0) {

                        ghost.mode = "exiting";
                        ghost.x = HOUSE_DOOR.x;
                        ghost.y = HOUSE_DOOR.y;
                        ghost.dir = { x: 0, y: -1 };
                        ghost.progress = 0;

                    }

                    return;

                }

                if (ghost.mode === "fright") {

                    ghost.timer -= dt;

                    if (ghost.timer <= 0) {

                        ghost.mode = "normal";

                    }

                }

                /* casillas por segundo */
                let speed = this.cfg.ghost * this.factor;

                if (ghost.mode === "fright") {
                    speed *= 0.5;
                }

                if (ghost.mode === "eaten") {
                    speed *= 2;
                }

                if (this.isTunnel(ghost.x, ghost.y)) {
                    speed *= 0.65;
                }

                ghost.progress += (speed * dt) / 1000;

                let guard = 0;

                while (ghost.progress >= 1 && guard < 8) {

                    guard += 1;

                    ghost.progress -= 1;

                    ghost.x = this.wrapX(ghost.x + ghost.dir.x);
                    ghost.y = ghost.y + ghost.dir.y;

                    if (ghost.mode === "exiting" && ghost.y < HOUSE_DOOR.y) {
                        ghost.mode = "normal";
                    }

                    if (
                        ghost.mode === "eaten" &&
                        ghost.x === HOUSE_SEAT.x &&
                        ghost.y === HOUSE_SEAT.y
                    ) {

                        ghost.mode = "house";
                        ghost.timer = RESPAWN_TIME;
                        ghost.dir = { x: 0, y: 0 };
                        ghost.progress = 0;

                        break;

                    }

                    this.decide(ghost);

                }

            });

        }


        /** Elegir el siguiente cruce, como en el arcade de siempre */
        decide(ghost) {

            const options = [];

            const collect = (allowReverse) => {

                options.length = 0;

                for (let i = 0; i < DIRS.length; i += 1) {

                    const dir = DIRS[i];

                    if (
                        !allowReverse &&
                        dir.x === -ghost.dir.x &&
                        dir.y === -ghost.dir.y
                    ) {
                        continue;
                    }

                    const nx = this.wrapX(ghost.x + dir.x);
                    const ny = ghost.y + dir.y;

                    if (!this.canGhost(ghost, nx, ny)) {
                        continue;
                    }

                    options.push({ dir, nx, ny });

                }

            };

            collect(false);

            if (!options.length) {
                collect(true);
            }

            if (!options.length) {
                return;
            }

            /* Reiniciados: huyen al azar, sin pensar */
            if (ghost.mode === "fright") {

                ghost.dir = options[
                    Math.floor(Math.random() * options.length)
                ].dir;

                return;

            }

            /* Borrados: camino más corto a casa */
            if (ghost.mode === "eaten") {

                const field = this.distanceField(
                    HOUSE_DOOR.x, HOUSE_DOOR.y, true
                );

                let best = null;
                let bestValue = Infinity;

                options.forEach((option) => {

                    const value = field[option.ny][option.nx];

                    const distance = value < 0 ? 9999 : value;

                    if (distance < bestValue) {

                        bestValue = distance;
                        best = option;

                    }

                });

                if (best) {
                    ghost.dir = { x: best.dir.x, y: best.dir.y };
                }

                return;

            }

            /* Persecución o dispersión: distancia en línea recta */
            const target = this.ghostTarget(ghost);

            let best = null;
            let bestValue = Infinity;

            options.forEach((option) => {

                const dx = this.wrapDelta(option.nx - target.x);
                const dy = option.ny - target.y;

                const value = dx * dx + dy * dy;

                if (value < bestValue) {

                    bestValue = value;
                    best = option;

                }

            });

            if (best) {
                ghost.dir = { x: best.dir.x, y: best.dir.y };
            }

        }


        /** A dónde quiere ir cada firewall */
        ghostTarget(ghost) {

            const player = this.player;

            if (this.scatter) {

                return CORNERS[ghost.seat % CORNERS.length];

            }

            const role = ghost.type.role;

            if (role === "chaser") {

                return { x: player.x, y: player.y };

            }

            if (role === "ambusher") {

                return {
                    x: this.wrapX(player.x + player.dir.x * 4),
                    y: utils.clamp(player.y + player.dir.y * 4, 1, ROWS - 2)
                };

            }

            if (role === "flanker") {

                /* Dos por delante y el doble de la distancia a TRAZA */
                const pivot = {
                    x: this.wrapX(player.x + player.dir.x * 2),
                    y: utils.clamp(player.y + player.dir.y * 2, 1, ROWS - 2)
                };

                const leader = this.ghosts[0];

                return {
                    x: this.wrapX(pivot.x * 2 - leader.x),
                    y: utils.clamp(pivot.y * 2 - leader.y, 1, ROWS - 2)
                };

            }

            /* SPAM: cobarde, se va a su esquina si te acercas */
            const dx = this.wrapDelta(player.x - ghost.x);
            const dy = player.y - ghost.y;

            if (Math.abs(dx) + Math.abs(dy) < 8) {

                return CORNERS[ghost.seat % CORNERS.length];

            }

            return { x: player.x, y: player.y };

        }


        /** Distancias reales por el laberinto (para volver a casa) */
        distanceField(targetX, targetY, forEaten) {

            const field = [];

            for (let y = 0; y < ROWS; y += 1) {
                field.push(new Array(COLS).fill(-1));
            }

            const tx = this.wrapX(targetX);

            if (targetY < 0 || targetY >= ROWS) {
                return field;
            }

            field[targetY][tx] = 0;

            const queue = [{ x: tx, y: targetY }];

            let head = 0;

            while (head < queue.length) {

                const node = queue[head];

                head += 1;

                const base = field[node.y][node.x];

                for (let i = 0; i < DIRS.length; i += 1) {

                    const nx = this.wrapX(node.x + DIRS[i].x);
                    const ny = node.y + DIRS[i].y;

                    if (ny < 0 || ny >= ROWS) {
                        continue;
                    }

                    if (field[ny][nx] !== -1) {
                        continue;
                    }

                    const cell = this.layout[ny][nx];

                    if (cell === "#") {
                        continue;
                    }

                    if (cell === "-" && !forEaten) {
                        continue;
                    }

                    if (cell === "G" && !forEaten) {
                        continue;
                    }

                    field[ny][nx] = base + 1;

                    queue.push({ x: nx, y: ny });

                }

            }

            return field;

        }


        /* ---------------------------------------------------------
           El gordo: bonus con cuchara
           --------------------------------------------------------- */

        spawnFruit() {

            if (this.fruit) {
                return;
            }

            /* Se deja caer justo debajo de la casa, en el primer hueco */
            const spot = this.fruitSpot();

            if (!spot) {
                return;
            }

            this.fruit = {
                x: spot.x,
                y: spot.y,
                timer: FRUIT_TIME,
                max: FRUIT_TIME,
                value: this.cfg.fruit
            };

            this.shell.setStatus("EL GORDO ANDA SUELTO");

            A.audio.play("coin");

        }


        /** Primer hueco libre bajo la casa de los firewalls */
        fruitSpot() {

            const offsets = [
                [0, 2], [-1, 2], [1, 2], [0, 3], [-2, 2], [2, 2],
                [-1, 3], [1, 3], [0, 4], [-3, 2], [3, 2]
            ];

            for (let i = 0; i < offsets.length; i += 1) {

                const x = this.wrapX(HOUSE_SEAT.x + offsets[i][0]);
                const y = HOUSE_SEAT.y + offsets[i][1];

                if (y >= ROWS - 1) {
                    continue;
                }

                if (this.canPlayer(x, y)) {
                    return { x, y };
                }

            }

            return null;

        }


        updateFruit(dt) {

            if (!this.fruit) {
                return;
            }

            this.fruit.timer -= dt;

            if (this.fruit.timer <= 0) {
                this.fruit = null;
            }

        }


        eatFruit() {

            const value = this.fruit.value;

            this.score += value;

            this.popups.push({
                text: "+" + value,
                x: BOARD_X + this.fruit.x * TILE + TILE / 2,
                y: BOARD_Y + this.fruit.y * TILE + TILE / 2,
                color: "#FBBF24",
                life: 1
            });

            this.spawnBurst(this.fruit.x, this.fruit.y, "#FBBF24");

            this.fruit = null;

            this.fruitTaken += 1;

            A.audio.play("win");

            /* El gordo se queja: te has zampado su bonus */
            this.shell.levelUpTaunt({
                face: "gordo",
                text: "Te has comido al gordo. A comer mierda con cuchara.",
                duration: 3600
            });

            this.updateStats();

        }


        /* ---------------------------------------------------------
           Choques
           --------------------------------------------------------- */

        checkCollisions() {

            const player = this.player;

            const px = player.x + player.dir.x * player.progress;
            const py = player.y + player.dir.y * player.progress;

            for (let i = 0; i < this.ghosts.length; i += 1) {

                const ghost = this.ghosts[i];

                if (ghost.mode === "house" || ghost.mode === "eaten") {
                    continue;
                }

                const gx = ghost.x + ghost.dir.x * ghost.progress;
                const gy = ghost.y + ghost.dir.y * ghost.progress;

                const distance = Math.hypot(
                    this.wrapDelta(px - gx),
                    py - gy
                );

                if (distance > 0.7) {
                    continue;
                }

                if (ghost.mode === "fright") {

                    this.eatGhost(ghost);

                } else {

                    this.die();

                    return;

                }

            }

        }


        wrapDelta(delta) {

            if (delta > COLS / 2) {
                return delta - COLS;
            }

            if (delta < -COLS / 2) {
                return delta + COLS;
            }

            return delta;

        }


        eatGhost(ghost) {

            const points = GHOST_POINTS[
                Math.min(this.ghostCombo, GHOST_POINTS.length - 1)
            ];

            this.ghostCombo += 1;

            this.score += points;

            ghost.mode = "eaten";
            ghost.timer = 0;

            this.popups.push({
                text: String(points),
                x: BOARD_X + ghost.x * TILE + TILE / 2,
                y: BOARD_Y + ghost.y * TILE + TILE / 2,
                color: "#22D3EE",
                life: 1.4
            });

            A.audio.play("explode");

            this.spawnBurst(ghost.x, ghost.y, "#22D3EE");

            this.flash = 160;

            this.updateStats();

        }


        die() {

            this.phase = "dying";
            this.phaseTimer = DYING_TIME;

            this.lives -= 1;

            A.audio.play("gameover");

            this.flash = 300;

            this.shell.setLives("lives", Math.max(0, this.lives));

            this.updateStats();

        }


        afterDeath() {

            if (this.lives <= 0) {

                this.phase = "over";

                this.shell.gameOver({
                    taunt: true,
                    score: this.score
                });

                return;

            }

            this.phase = "ready";
            this.phaseTimer = READY_TIME;

            this.wake = [];
            this.popups = [];
            this.fruit = null;
            this.scatter = true;
            this.modeTimer = this.cfg.scatter;

            this.spawnActors();

        }


        /* ---------------------------------------------------------
           Entrada
           --------------------------------------------------------- */

        bindRitmo() {

            const buttons = utils.qsa("[data-ritmo]", this.shell.root);

            buttons.forEach((button) => {

                button.classList.toggle(
                    "is-active",
                    button.dataset.ritmo === this.ritmo
                );

                button.addEventListener("click", () => {

                    buttons.forEach((item) => {
                        item.classList.toggle("is-active", item === button);
                    });

                    this.ritmo = button.dataset.ritmo || "normal";

                    this.factor = RITMOS[this.ritmo].factor;

                    A.audio.play("select");

                    this.reset();

                });

            });

        }


        steer(direction) {

            if (!direction) {
                return;
            }

            this.player.next = { x: direction.x, y: direction.y };

            if (
                this.player.dir.x === 0 &&
                this.player.dir.y === 0 &&
                this.canPlayer(
                    this.player.x + direction.x,
                    this.player.y + direction.y
                )
            ) {

                this.player.dir = { x: direction.x, y: direction.y };

            }

        }


        key(key, event) {

            if (this.phase !== "run") {

                if (
                    key === "Enter" ||
                    key === " " ||
                    key.indexOf("Arrow") === 0
                ) {

                    event.preventDefault();

                    return true;

                }

                return false;

            }

            switch (key) {

                case "ArrowLeft":
                case "a":
                case "A":
                    this.steer({ x: -1, y: 0 });
                    return true;

                case "ArrowRight":
                case "d":
                case "D":
                    this.steer({ x: 1, y: 0 });
                    return true;

                case "ArrowUp":
                case "w":
                case "W":
                    this.steer({ x: 0, y: -1 });
                    return true;

                case "ArrowDown":
                case "s":
                case "S":
                    this.steer({ x: 0, y: 1 });
                    return true;

                default:
                    return false;

            }

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

            this.shell.setStat("best", utils.formatScore(
                Math.max(this.shell.best, this.score)
            ));

            this.shell.setStat("dots", this.dotsLeft);
            this.shell.setStat("level", this.levelIndex + 1);

            this.shell.setLives("lives", Math.max(0, this.lives));

            this.shell.setMeter(
                "clean",
                utils.clamp(
                    1 - this.dotsLeft / Math.max(1, this.levelDots), 0, 1
                )
            );

        }


        /* ---------------------------------------------------------
           Partículas y avisos
           --------------------------------------------------------- */

        spawnBurst(tileX, tileY, color) {

            const px = BOARD_X + tileX * TILE + TILE / 2;
            const py = BOARD_Y + tileY * TILE + TILE / 2;

            for (let i = 0; i < 12; i += 1) {

                const angle = Math.random() * Math.PI * 2;
                const speed = 0.07 + Math.random() * 0.26;

                this.particles.push({
                    x: px,
                    y: py,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    decay: 0.0018 + Math.random() * 0.002,
                    size: 2 + Math.random() * 3,
                    color: Math.random() < 0.5
                        ? color
                        : utils.pick(["#22D3EE", "#F5F7FF", "#FBBF24"])
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


        updatePopups(dt) {

            for (let i = this.popups.length - 1; i >= 0; i -= 1) {

                this.popups[i].life -= dt * 0.0011;

                if (this.popups[i].life <= 0) {
                    this.popups.splice(i, 1);
                }

            }

        }


        /* ---------------------------------------------------------
           Dibujo
           --------------------------------------------------------- */

        render() {

            const { ctx } = this.stage;

            this.stage.clear(this.world.floor);

            this.drawMaze();
            this.drawWake();
            this.drawDots();
            this.drawFruit();

            if (this.phase !== "dying") {
                this.drawGhosts();
            }

            this.drawPlayer();
            this.drawParticles();
            this.drawPopups();
            this.drawFooter();

            if (this.phase === "ready") {
                this.drawReady();
            }

            if (this.phase === "clear" && this.banner) {
                this.drawBanner();
            }

            if (this.flash > 0) {
                this.drawFlash();
            }

        }


        /* El laberinto no cambia mientras no cambien nivel o mundo,
           así que se pinta una sola vez en un lienzo y luego se copia.
           Antes cada muro se dibujaba con shadowBlur en cada frame. */
        drawMaze() {

            const { ctx } = this.stage;

            const key = this.worldId + "|" + this.levelIndex + "|" +
                this.layout.map((row) => row.join ? row.join("") : row).join("");

            if (!this._mazeCanvas || this._mazeKey !== key) {

                if (!this._mazeCanvas) {
                    this._mazeCanvas = document.createElement("canvas");
                }

                this._mazeCanvas.width = this.stage.width;
                this._mazeCanvas.height = this.stage.height;

                this.paintMaze(this._mazeCanvas.getContext("2d"));

                this._mazeKey = key;

            }

            ctx.drawImage(this._mazeCanvas, 0, 0);

        }


        paintMaze(ctx) {

            const world = this.world;

            ctx.save();

            canvasKit.roundRect(ctx, BOARD_X, BOARD_Y, BOARD_W, BOARD_H, 10);

            ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
            ctx.fill();

            ctx.strokeStyle = world.wall;
            ctx.lineWidth = 2;

            for (let y = 0; y < ROWS; y += 1) {

                for (let x = 0; x < COLS; x += 1) {

                    const cell = this.layout[y][x];

                    if (cell === "#") {

                        const px = BOARD_X + x * TILE;
                        const py = BOARD_Y + y * TILE;

                        ctx.globalAlpha = 0.9;

                        ctx.shadowColor = world.wall;
                        ctx.shadowBlur = 9;

                        canvasKit.fillRoundRect(
                            ctx, px + 3, py + 3, TILE - 6, TILE - 6, 5,
                            world.wall
                        );

                        ctx.shadowBlur = 0;

                        ctx.globalAlpha = 0.95;

                        canvasKit.roundRect(
                            ctx, px + 3.5, py + 3.5, TILE - 7, TILE - 7, 5
                        );

                        ctx.stroke();

                        /* brillo interior para que no quede plano */
                        ctx.globalAlpha = 0.08;

                        canvasKit.fillRoundRect(
                            ctx, px + 7, py + 7, TILE - 14, TILE - 14, 4,
                            "#FFFFFF"
                        );

                    } else if (cell === "-") {

                        ctx.globalAlpha = 0.75;
                        ctx.fillStyle = world.wall;

                        ctx.fillRect(
                            BOARD_X + x * TILE + 3,
                            BOARD_Y + y * TILE + TILE / 2 - 2,
                            TILE - 6,
                            4
                        );

                    }

                }

            }

            ctx.restore();

        }


        drawDots() {

            const { ctx } = this.stage;
            const world = this.world;

            const pulse = 0.75 + Math.sin(this.time / 190) * 0.25;

            ctx.save();

            for (let y = 0; y < ROWS; y += 1) {

                for (let x = 0; x < COLS; x += 1) {

                    const dot = this.dots[y][x];

                    if (!dot) {
                        continue;
                    }

                    const cx = BOARD_X + x * TILE + TILE / 2;
                    const cy = BOARD_Y + y * TILE + TILE / 2;

                    if (dot === 2) {

                        const size = 5 + pulse * 2.5;

                        ctx.shadowColor = world.pac;
                        ctx.shadowBlur = 12 + pulse * 10;
                        ctx.fillStyle = world.pac;

                        ctx.beginPath();
                        ctx.arc(cx, cy, size, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.shadowBlur = 0;

                    } else {

                        ctx.fillStyle = world.dot;
                        ctx.globalAlpha = 0.9;

                        ctx.beginPath();
                        ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.globalAlpha = 1;

                    }

                }

            }

            ctx.restore();

        }


        /** Estela decorativa del 404 */
        drawWake() {

            if (this.wake.length < 2) {
                return;
            }

            const { ctx } = this.stage;

            ctx.save();

            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            for (let i = 1; i < this.wake.length; i += 1) {

                const from = this.wake[i - 1];
                const to = this.wake[i];

                if (Math.abs(from.x - to.x) > 1) {
                    continue;
                }

                const alpha = utils.clamp(to.life / to.max, 0, 1);

                ctx.globalAlpha = alpha * 0.22;

                ctx.strokeStyle = this.world.pac;
                ctx.lineWidth = 6 * alpha;

                ctx.beginPath();
                ctx.moveTo(
                    BOARD_X + from.x * TILE + TILE / 2,
                    BOARD_Y + from.y * TILE + TILE / 2
                );
                ctx.lineTo(
                    BOARD_X + to.x * TILE + TILE / 2,
                    BOARD_Y + to.y * TILE + TILE / 2
                );
                ctx.stroke();

            }

            ctx.restore();

        }


        drawFruit() {

            if (!this.fruit) {
                return;
            }

            const { ctx } = this.stage;

            const cx = BOARD_X + this.fruit.x * TILE + TILE / 2;
            const cy = BOARD_Y + this.fruit.y * TILE + TILE / 2;

            const scale = 1.1 + Math.sin(this.time / 160) * 0.06;

            const size = A.pixelArt.size(A.pixelArt.gordo, scale);

            ctx.save();

            ctx.shadowColor = "#FBBF24";
            ctx.shadowBlur = 16;

            A.pixelArt.draw(
                ctx,
                A.pixelArt.gordo,
                cx - size.width / 2,
                cy - size.height / 2,
                scale,
                1
            );

            ctx.restore();

            /* Cuenta atrás */
            const ratio = this.fruit.timer / this.fruit.max;

            ctx.save();

            ctx.globalAlpha = 0.7;
            ctx.strokeStyle = "#FBBF24";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(cx, cy, TILE * 0.62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
            ctx.stroke();

            ctx.restore();

        }


        drawPlayer() {

            const { ctx } = this.stage;
            const player = this.player;

            const fx = player.x + player.dir.x * player.progress;
            const fy = player.y + player.dir.y * player.progress;

            let angle = Math.atan2(player.dir.y, player.dir.x);

            if (player.dir.x === 0 && player.dir.y === 0) {
                angle = 0;
            }

            let open = Math.abs(Math.sin(this.mouth)) * 0.6;

            let scale = 1;

            if (this.phase === "dying") {

                const ratio = 1 - this.phaseTimer / DYING_TIME;

                open = 0.15 + ratio * 1.4;

                scale = Math.max(0.05, 1 - ratio);

                angle += ratio * Math.PI * 4;

            }

            const draw = (bx, by) => {

                ctx.save();

                ctx.shadowColor = this.world.pac;
                ctx.shadowBlur = 16;
                ctx.fillStyle = this.world.pac;

                ctx.beginPath();
                ctx.moveTo(bx, by);

                ctx.arc(
                    bx, by,
                    TILE * 0.44 * scale,
                    angle + open,
                    angle + Math.PI * 2 - open
                );

                ctx.closePath();
                ctx.fill();

                ctx.restore();

            };

            this.drawWrapped(fx, fy, draw);

        }


        drawGhosts() {

            this.ghosts.forEach((ghost) => {

                const fx = ghost.x + ghost.dir.x * ghost.progress;
                const fy = ghost.y + ghost.dir.y * ghost.progress;

                this.drawGhost(ghost, fx, fy);

            });

        }


        drawGhost(ghost, fx, fy) {

            const { ctx } = this.stage;

            const draw = (bx, by) => {

                const fright = ghost.mode === "fright";
                const eaten = ghost.mode === "eaten";

                if (eaten) {

                    this.drawEyes(bx, by - 2, ghost);
                    return;

                }

                let color = ghost.type.color;

                if (fright) {

                    const ending = ghost.timer < FLASH_TIME;

                    const blink = Math.sin(this.time / 70) > 0;

                    color = ending
                        ? (blink ? "#F5F7FF" : "#3B82F6")
                        : "#3B82F6";

                }

                const radius = TILE * 0.42;

                const wobble = Math.sin(this.time / 120 + ghost.wobble) * 1.3;

                ctx.save();

                ctx.shadowColor = color;
                ctx.shadowBlur = 14;
                ctx.fillStyle = color;

                ctx.beginPath();
                ctx.arc(bx, by - 2, radius, Math.PI, 0);
                ctx.lineTo(bx + radius, by + radius * 0.7);

                const feet = 3;
                const step = (radius * 2) / feet;

                for (let i = 0; i < feet; i += 1) {

                    const x0 = bx + radius - i * step;
                    const x1 = x0 - step / 2;
                    const x2 = x0 - step;

                    const dip = (i % 2 === 0 ? 1 : -1) * 3 + wobble;

                    ctx.quadraticCurveTo(
                        x1, by + radius * 0.7 + dip,
                        x2, by + radius * 0.7
                    );

                }

                ctx.closePath();
                ctx.fill();

                ctx.restore();

                if (fright) {

                    /* Cara de susto */
                    ctx.save();

                    ctx.strokeStyle = "#F5F7FF";
                    ctx.lineWidth = 1.8;

                    [-1, 1].forEach((side) => {

                        ctx.beginPath();
                        ctx.arc(
                            bx + side * 4.6, by - 4, 2, 0, Math.PI * 2
                        );
                        ctx.stroke();

                    });

                    ctx.beginPath();

                    for (let i = 0; i <= 4; i += 1) {

                        const wx = bx - 5 + i * 2.5;
                        const wy = by + 5 + (i % 2 === 0 ? -1.5 : 1.5);

                        if (i === 0) {
                            ctx.moveTo(wx, wy);
                        } else {
                            ctx.lineTo(wx, wy);
                        }

                    }

                    ctx.stroke();

                    ctx.restore();

                    return;

                }

                this.drawEyes(bx, by - 2 + wobble * 0.2, ghost);

            };

            this.drawWrapped(fx, fy, draw);

        }


        drawEyes(bx, by, ghost) {

            const { ctx } = this.stage;

            ctx.save();

            const offsetX = ghost.dir.x * 2.2;
            const offsetY = ghost.dir.y * 2.2;

            const eyeY = by - 4;
            const eyeDx = 4.6;

            ctx.fillStyle = "#F5F7FF";

            [-1, 1].forEach((side) => {

                ctx.beginPath();
                ctx.ellipse(
                    bx + side * eyeDx, eyeY, 3.1, 3.8, 0, 0, Math.PI * 2
                );
                ctx.fill();

            });

            ctx.fillStyle = "#0B1020";

            [-1, 1].forEach((side) => {

                ctx.beginPath();
                ctx.arc(
                    bx + side * eyeDx + offsetX,
                    eyeY + offsetY,
                    1.7,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

            });

            ctx.restore();

        }


        drawWrapped(fx, fy, draw) {

            const margin = 1.2;

            draw(
                BOARD_X + fx * TILE + TILE / 2,
                BOARD_Y + fy * TILE + TILE / 2
            );

            if (fx < margin) {

                draw(
                    BOARD_X + (fx + COLS) * TILE + TILE / 2,
                    BOARD_Y + fy * TILE + TILE / 2
                );

            } else if (fx > COLS - margin) {

                draw(
                    BOARD_X + (fx - COLS) * TILE + TILE / 2,
                    BOARD_Y + fy * TILE + TILE / 2
                );

            }

        }


        drawFooter() {

            const { ctx } = this.stage;

            ctx.save();

            canvasKit.roundRect(ctx, BOARD_X, FOOT_Y, BOARD_W, FOOT_H, 8);

            ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
            ctx.fill();

            ctx.restore();

            /* Vidas */
            for (let i = 0; i < 3; i += 1) {

                const cx = BOARD_X + 20 + i * 26;
                const cy = FOOT_Y + FOOT_H / 2;

                ctx.save();

                ctx.globalAlpha = i < this.lives ? 1 : 0.16;

                ctx.fillStyle = this.world.pac;
                ctx.shadowColor = this.world.pac;
                ctx.shadowBlur = i < this.lives ? 10 : 0;

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, 8, 0.5, Math.PI * 2 - 0.5);
                ctx.closePath();
                ctx.fill();

                ctx.restore();

            }

            canvasKit.text(
                ctx,
                this.world.name + " · NODO " + this.cfg.index,
                BOARD_X + 100,
                FOOT_Y + FOOT_H / 2,
                {
                    font: "700 12px 'JetBrains Mono', monospace",
                    color: "rgba(245, 247, 255, 0.8)",
                    align: "left"
                }
            );

            canvasKit.text(
                ctx,
                "NIVEL " + (this.levelIndex + 1) + " / " + LEVELS.length,
                BOARD_X + BOARD_W - 16,
                FOOT_Y + FOOT_H / 2,
                {
                    font: "700 11px 'JetBrains Mono', monospace",
                    color: this.world.wall,
                    align: "right"
                }
            );

        }


        drawReady() {

            const { ctx } = this.stage;

            const cx = BOARD_X + BOARD_W / 2;
            const cy = BOARD_Y + BOARD_H * 0.62;

            canvasKit.text(ctx, "¡LISTO!", cx, cy - 8, {
                font: "800 26px 'Orbitron', sans-serif",
                color: this.world.pac,
                shadow: this.world.pac,
                shadowBlur: 18
            });

            canvasKit.text(
                ctx,
                this.world.name + " · NODO " + this.cfg.index,
                cx, cy + 20,
                {
                    font: "600 11px 'JetBrains Mono', monospace",
                    color: "rgba(245, 247, 255, 0.7)"
                }
            );

        }


        drawBanner() {

            const { ctx } = this.stage;

            const cx = BOARD_X + BOARD_W / 2;
            const cy = BOARD_Y + BOARD_H / 2;

            ctx.save();

            ctx.globalAlpha = 0.85;

            canvasKit.fillRoundRect(
                ctx, cx - 190, cy - 46, 380, 92, 12, "rgba(5, 7, 14, 0.94)"
            );

            ctx.globalAlpha = 1;

            ctx.strokeStyle = this.world.wall;
            ctx.lineWidth = 2;

            canvasKit.roundRect(ctx, cx - 190, cy - 46, 380, 92, 12);
            ctx.stroke();

            canvasKit.text(ctx, this.banner.title, cx, cy - 12, {
                font: "800 20px 'Orbitron', sans-serif",
                color: this.world.wall,
                shadow: this.world.wall,
                shadowBlur: 14
            });

            canvasKit.text(ctx, this.banner.text, cx, cy + 16, {
                font: "600 11px 'JetBrains Mono', monospace",
                color: "rgba(245, 247, 255, 0.7)"
            });

            ctx.restore();

        }


        drawPopups() {

            const { ctx } = this.stage;

            this.popups.forEach((popup) => {

                const rise = (1 - popup.life) * 26;

                ctx.save();

                ctx.globalAlpha = utils.clamp(popup.life * 1.4, 0, 1);

                canvasKit.text(ctx, popup.text, popup.x, popup.y - rise, {
                    font: "800 15px 'Orbitron', sans-serif",
                    color: popup.color,
                    shadow: popup.color,
                    shadowBlur: 12
                });

                ctx.restore();

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

            const alpha = utils.clamp(this.flash / 300, 0, 1) * 0.18;

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

        id: "pac404",
        number: "08",
        name: "PAC 404",
        genre: "MAZE / ARCADE",
        mode: "FIREWALL",

        music: "arcade",

        accent: "var(--color-cyan)",
        accentRgb: "34 211 238",
        cardRgb: "34 211 238",

        ratioMin: 0.78,
        ratioMax: 0.9,

        preview: `
            <span class="preview preview--pac404">
                <i class="preview__pac"></i>
                <i class="preview__cable"></i>
                <i class="preview__fw preview__fw--a"></i>
                <i class="preview__fw preview__fw--b"></i>
            </span>
        `,

        readyTitle: "PAC 404",
        readyText: "Cómete todos los paquetes. Los chips reinician a los firewalls: huyen en azul y entonces te los puedes comer (200, 400, 800, 1600). Cuidado con el gordo, que sale de bonus.",
        readyHint: "ENTER — EMPEZAR    FLECHAS / WASD — MOVER    ESC — SALIR",

        hud: `
            ${A.ui.stat("score", "SCORE", "000000")}
            ${A.ui.stat("best", "BEST", "000000")}
            ${A.ui.divider()}
            ${A.ui.stat("dots", "DATA", "0")}
            ${A.ui.stat("level", "LEVEL", "1")}
            ${A.ui.lives("lives", 3)}
            ${A.ui.divider()}
            ${A.ui.meter("clean", "NODO")}
        `,

        controls: A.ui.switcher("ritmo", [
            { value: "lento", label: "LENTO" },
            { value: "normal", label: "NORMAL" },
            { value: "rapido", label: "RÁPIDO" }
        ]),

        hint: "FLECHAS / WASD — MOVER    P — PAUSA    ESC — SALIR",

        create(shell) {
            return new Pac404Game(shell);
        }

    });

})(window.Arcade404);
